import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import {
  messageService,
  formatRelativeTime
} from '@/shared/services/messageService';
import { sosService } from '@/shared/services/sosService';
import { apiPost, apiPatch } from '../../../lib/api';
import {
  type ConversationItem,
  type MessageItem,
  type ParticipantItem
} from '@/shared/entities/MessageEntity';
import { useAuthStore } from '@/store/authStore';
import { ensureFullUrl } from '@/shared/services/profileService';

/**
 * View Model cho module Tin nhắn của Đội cứu hộ (Volunteer).
 * Quản lý hội thoại giữa cứu hộ và người dân, kết nối SignalR real-time và các tương tác nhóm.
 * 
 * @returns Các trạng thái và phương thức xử lý UI cho giao diện cứu hộ.
 */
export function useVolunteerMessageViewModel() {
  // ─── Authentication Context ────────────────────────────────────────────────
  const { user: currentUser } = useAuthStore();

  // ─── UI States ──────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<ParticipantItem[]>([]);

  // Trạng thái SOS của Citizen trong hội thoại
  const [currentSosReport, setCurrentSosReport] = useState<any | null>(null);

  // Trạng thái Loading
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Tìm kiếm & Soạn tin
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [inputText, setInputText] = useState('');

  // Quản lý Nhóm
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  // ─── References ────────────────────────────────────────────────────────────
  const hubRef = useRef<signalR.HubConnection | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const [hubState, setHubState] = useState<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);

  // Đồng bộ activeConvId vào Ref để SignalR handler luôn lấy giá trị mới nhất mà không bị Stale Closure
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // ─── 1. Tải danh sách hội thoại ─────────────────────────────────────────────

  /**
   * Truy xuất toàn bộ danh sách hội thoại của cứu hộ.
   * Lọc bỏ các hội thoại không cần thiết (admin, tự chat).
   */
  const loadConversations = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data: items } = await messageService.getConversations();
      const filtered = items.filter(c => {
        if (c.type === 'Private' || c.type === 'PRIVATE') {
          if (c.otherUserId === currentUser?.id) return false;
          if (c.role === 'ADMIN') return false;
        }
        return true;
      });
      setConversations(filtered);
    } finally {
      setIsLoadingList(false);
    }
  }, [currentUser?.id]);

  // Cập nhật danh sách định kỳ mỗi 30 giây
  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, 30000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  // ─── 2. Kết nối SignalR (Real-time) ────────────────────────────────────────

  useEffect(() => {
    const token = (() => {
      try {
        const raw = localStorage.getItem('sosmap-auth-storage');
        if (!raw) return null;
        return JSON.parse(raw)?.state?.token;
      } catch { return null; }
    })();

    if (!token || !currentUser?.id) return;

    let isStarted = false;
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(messageService.getHubUrl(), {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.elapsedMilliseconds < 60000) {
            return 2000;
          }
          return 10000;
        }
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    /**
     * Khởi động hub và join vào phòng chat hiện tại.
     */
    const startHub = async () => {
      try {
        if (hub.state === signalR.HubConnectionState.Disconnected) {
          isStarted = true;
          await hub.start();
          setHubState(signalR.HubConnectionState.Connected);
          console.log('[SignalR Volunteer] Kết nối thành công');
          // Không gọi Join ở đây nữa, để useEffect bên dưới xử lý đồng bộ
        }
      } catch (err) {
        console.error('[SignalR Volunteer] Lỗi khởi động kết nối:', err);
        setHubState(signalR.HubConnectionState.Disconnected);
        isStarted = false;
        // Thử lại sau 5 giây nếu lỗi do giao thức
        setTimeout(startHub, 5000);
      }
    };

    hub.onreconnected(() => {
      console.log('[SignalR Volunteer] Đã kết nối lại');
      setHubState(signalR.HubConnectionState.Connected);
      // Không gọi Join ở đây nữa, để useEffect bên dưới xử lý đồng bộ
    });

    hub.onreconnecting(() => {
      console.log('[SignalR Volunteer] Đang mất kết nối, đang thử kết nối lại...');
      setHubState(signalR.HubConnectionState.Reconnecting);
    });

    hub.onclose((error) => {
      console.log('[SignalR Volunteer] Kết nối đã đóng:', error);
      setHubState(signalR.HubConnectionState.Disconnected);
      isStarted = false;
    });

    // Lắng nghe tin nhắn mới từ Hub
    hub.on('ReceiveMessage', (msg: any) => {
      const currentId = activeConvIdRef.current;
      const incomingConvId = msg.conversationId || msg.ConversationId;

      const mapped: MessageItem = {
        id: msg.id || msg.Id,
        conversationId: incomingConvId,
        senderId: msg.senderId || msg.SenderId,
        senderName: msg.senderName || msg.SenderName || '',
        senderAvatarUrl: ensureFullUrl(msg.senderAvatarUrl || msg.SenderAvatarUrl, msg.senderName || msg.SenderName),
        type: msg.type || msg.Type || 'Text',
        content: msg.content || msg.Content || '',
        fileUrl: msg.fileUrl || msg.FileUrl,
        createdAt: (msg.createdAt || msg.CreatedAt) ? formatRelativeTime(msg.createdAt || msg.CreatedAt) : 'Vừa xong',
        createdAtRaw: msg.createdAt || msg.CreatedAt || new Date().toISOString(),
        isMine: (msg.senderId || msg.SenderId) === currentUser?.id,
      };

      // Cập nhật khung chat nếu đúng phòng đang mở
      if (incomingConvId && currentId && incomingConvId.toLowerCase() === currentId.toLowerCase()) {
        setMessages(prev => {
          if (prev.some(m => m.id === mapped.id)) return prev;
          return [...prev, mapped];
        });
      }

      // Cập nhật nội dung xem trước và đẩy hội thoại lên đầu ở thanh bên trái (Sidebar)
      setConversations(prev => {
        const index = prev.findIndex(c => c.id.toLowerCase() === incomingConvId.toLowerCase());
        if (index !== -1) {
          const updated = {
            ...prev[index],
            lastMessageText: mapped.content,
            lastMessageTime: 'Vừa xong',
            lastMessageTimeRaw: mapped.createdAtRaw
          };
          const newList = [...prev];
          newList.splice(index, 1);
          return [updated, ...newList];
        }
        // Nếu là hội thoại mới chưa có trong list
        loadConversations();
        return prev;
      });
    });

    // Lắng nghe sự kiện thay đổi trạng thái online/offline
    hub.on('UserPresenceChanged', (data: any) => {
      const userId = data.userId || data.UserId;
      const isOnline = data.isOnline ?? data.IsOnline ?? false;
      
      console.log(`[SignalR] User ${userId} is now ${isOnline ? 'Online' : 'Offline'}`);

      // Cập nhật trong danh sách hội thoại
      setConversations(prev => prev.map(c => {
        if (c.otherUserId === userId) {
          return { ...c, isOnline };
        }
        return c;
      }));

      // Cập nhật trong danh sách thành viên đang chọn
      setActiveParticipants(prev => prev.map(p => {
        if (p.userId === userId) {
          return { ...p, isOnline };
        }
        return p;
      }));
    });

    // Không cần handler onreconnected ở đây nữa vì đã gộp vào logic startHub phía trên

    startHub();
    hubRef.current = hub;

    return () => {
      if (isStarted) {
        hub.stop().catch(() => { });
      }
    };
  }, [currentUser?.id]);

  // ─── 3. Chuyển phòng SignalR ────────────────────────────────────────────────

  useEffect(() => {
    const hub = hubRef.current;
    if (!hub || hubState !== signalR.HubConnectionState.Connected) return;

    if (activeConvId) {
      hub.invoke('JoinConversation', activeConvId)
        .catch(e => console.error('[SignalR Volunteer] Join phòng thất bại:', e));
    }
  }, [activeConvId, hubState]);

  // ─── 4. Tải chi tiết nội dung Chat ──────────────────────────────────────────

  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      setActiveParticipants([]);
      return;
    }

    /**
     * Tải toàn bộ tin nhắn và danh sách thành viên của hội thoại được chọn.
     */
    const loadAll = async () => {
      setIsLoadingMessages(true);
      try {
        const [{ data: msgs }, { data: members }] = await Promise.all([
          messageService.getMessages(activeConvId),
          messageService.getMembers(activeConvId),
        ]);
        // Đảo ngược mảng để tin nhắn cũ nhất nằm ở trên cùng
        setMessages([...msgs].reverse());
        setActiveParticipants(members);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadAll();
  }, [activeConvId]);

  // ─── 4.1. Kiểm tra trạng thái SOS của đối phương (Citizen) ────────────────
  
  useEffect(() => {
    if (!activeConvId || !activeParticipants.length || !currentUser?.id) return;
    
    // Tìm người kia (không phải bản thân)
    const otherUser = activeParticipants.find(p => p.userId !== currentUser.id);
    if (!otherUser) {
      setCurrentSosReport(null);
      return;
    }

    const checkSosStatus = async () => {
      const { data: activeSos } = await sosService.getActiveSosReport(otherUser.userId);
      setCurrentSosReport(activeSos);
    };

    checkSosStatus();
    const interval = setInterval(checkSosStatus, 15000); // Check mỗi 15s
    return () => clearInterval(interval);
  }, [activeConvId, activeParticipants, currentUser?.id]);

  // ─── 4.2. Cập nhật thời gian thực (Relative Time) ───────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      setMessages(prev => prev.map(m => ({
        ...m,
        createdAt: formatRelativeTime(m.createdAtRaw)
      })));

      setConversations(prev => prev.map(c => ({
        ...c,
        lastMessageTime: c.lastMessageTimeRaw ? formatRelativeTime(c.lastMessageTimeRaw) : c.lastMessageTime
      })));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Thông tin cơ bản về hội thoại đang chọn
  const activeConversationInfo = conversations.find(c => c.id === activeConvId) ?? null;

  // ─── 5. Tìm kiếm Người dùng / Thành viên ─────────────────────────────────────

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setUserSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const { data: results } = await messageService.searchUsers(searchQuery);
        const filtered = results
          .filter((u: any) => (u.id || u.Id) !== currentUser?.id && (u.role || u.Role) !== 'ADMIN')
          .map((u: any) => ({
            id: u.id || u.Id,
            fullName: u.fullName || u.FullName || u.name,
            role: u.role || u.Role || '',
            address: u.address || u.Address || '',
            avatarUrl: ensureFullUrl(u.imageUrl || u.image_url || u.ImageUrl, u.fullName || u.FullName),
          }));
        setUserSearchResults(filtered);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery, currentUser?.id]);

  // ─── 6. Action Handlers (Xử lý tương tác cư dân) ─────────────────────────────

  /**
   * Gửi tin nhắn mới.
   */
  const handleSendMessage = async () => {
    if (!activeConvId || !inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    const { data: msg } = await messageService.sendMessage(activeConvId, text);
    if (msg) {
      // Cập nhật UI ngay lập tức
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setConversations(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, lastMessageText: text, lastMessageTime: 'Vừa xong' } : c
      ));
    }
  };

  /**
   * Tạo hội thoại riêng mới từ kết quả tìm kiếm.
   */
  const handleCreateNewChat = async (userId: string, _fullName: string, _avatarUrl?: string, _role?: string, _address?: string) => {
    const { data: conv } = await messageService.getOrCreatePrivate(userId);
    if (!conv) return;
    setConversations(prev => {
      if (prev.some(c => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
    setActiveConvId(conv.id);
    setSearchQuery('');
  };

  /**
   * Khởi tạo nhóm chat (Group) mới.
   */
  const handleCreateGroup = async (participantIds: string[], name: string) => {
    const { data: conv } = await messageService.createGroup(name, participantIds);
    if (!conv) return;
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(conv.id);
    setIsGroupMode(false);
    setSelectedUserIds([]);
    setGroupName('');
    setSearchQuery('');
  };

  /**
   * Xóa hội thoại khỏi danh sách cá nhân của Cứu hộ.
   */
  const handleDeleteConversation = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hội thoại này không?')) return;
    try {
      await messageService.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) setActiveConvId(null);
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  /**
   * Xác nhận đã cứu trợ (Thực tế là chấp nhận hoặc đang đi cứu)
   */
  const handleConfirmRescue = async () => {
    if (!activeConvId || !currentSosReport) return;
    
    try {
      // Cập nhật trạng thái sang PROCESSING (Sử dụng endpoint Patch chuẩn từ SosReport)
      await apiPatch(`/SosReport/${currentSosReport.id}/status`, {
        status: 'PROCESSING'
      });

      // Gửi tin nhắn hệ thống
      const { data: msg } = await messageService.sendSystemMessage(
        activeConvId, 
        "Đội cứu trợ ĐÃ NHẬN ĐƠN và đang trên đường đến hỗ trợ bạn. Hãy giữ liên lạc!"
      );
      
      if (msg) {
        setMessages(prev => [...prev, msg]);
        setConversations(prev => prev.map(c => 
          c.id === activeConvId ? { ...c, lastMessageText: msg.content, lastMessageTime: 'Vừa xong' } : c
        ));
      }

      setCurrentSosReport((prev: any) => prev ? { ...prev, status: 'PROCESSING' } : null);

    } catch (e) {
      console.error('Confirm rescue failed', e);
    }
  };

  /**
   * Hoàn thành cứu trợ
   */
  const handleCompleteRescue = async () => {
    if (!activeConvId || !currentSosReport) return;
    
    try {
      // Cập nhật trạng thái sang COMPLETED (Dùng DONE hoặc COMPLETED tùy backend xử lý, nhưng endpoint là SosReport)
      await apiPatch(`/SosReport/${currentSosReport.id}/status`, {
        status: 'COMPLETED'
      });

      const { data: msg } = await messageService.sendSystemMessage(
        activeConvId, 
        "NHIỆM VỤ CỨU TRỢ ĐÃ HOÀN THÀNH"
      );
      
      if (msg) {
        setMessages(prev => [...prev, msg]);
        setConversations(prev => prev.map(c => 
          c.id === activeConvId ? { ...c, lastMessageText: msg.content, lastMessageTime: 'Vừa xong' } : c
        ));
      }
      setCurrentSosReport((prev: any) => prev ? { ...prev, status: 'DONE' } : null);
    } catch (e) {
      console.error('Complete rescue failed', e);
    }
  };

  return {
    // States
    conversations,
    messages,
    activeConvId,
    setActiveConvId,
    activeParticipants,
    activeConversationInfo,
    searchQuery,
    setSearchQuery,
    inputText,
    setInputText,
    isLoadingList,
    isLoadingMessages,
    userSearchResults,
    isSearchingUsers,
    isGroupMode,
    setIsGroupMode,
    selectedUserIds,
    setSelectedUserIds,
    groupName,
    setGroupName,
    currentUser,

    // Handlers
    handleSendMessage,
    handleCreateNewChat,
    handleCreateGroup,
    handleDeleteConversation,
    handleConfirmRescue,
    handleCompleteRescue,
    currentSosReport,
  };
}

