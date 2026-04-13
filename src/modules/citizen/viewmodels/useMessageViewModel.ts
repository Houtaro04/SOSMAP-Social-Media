import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import {
  messageService,
  formatRelativeTime
} from '@/shared/services/messageService';
import { sosService } from '@/shared/services/sosService';
import {
  type ConversationItem,
  type MessageItem,
  type ParticipantItem
} from '@/shared/entities/MessageEntity';
import { useAuthStore } from '@/store/authStore';
import { ensureFullUrl } from '@/shared/services/profileService';

/**
 * View Model cho module Tin nhắn của Người dân (Citizen).
 * Quản lý trạng thái danh sách hội thoại, nội dung tin nhắn, tìm kiếm và kết nối SignalR.
 * 
 * @returns Các trạng thái và phương thức xử lý UI cho màn hình tin nhắn.
 */
export const useMessageViewModel = () => {
  // ─── Authentication & User Context ──────────────────────────────────────────
  const currentUser = useAuthStore(state => state.user);

  // ─── UI States ──────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<ParticipantItem[]>([]);

  // Trạng thái Loading
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Tìm kiếm & Tạo mới
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [inputText, setInputText] = useState('');

  // Chế độ nhóm (Group Mode)
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  // SOS Form
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [currentSosStatus, setCurrentSosStatus] = useState<string | null>(null);

  // ─── References (SignalR & State Sync) ──────────────────────────────────────
  const hubRef = useRef<signalR.HubConnection | null>(null);
  const activeConvIdRef = useRef<string | null>(null);

  // Đồng bộ activeConvId vào Ref để SignalR handler luôn lấy giá trị mới nhất mà không bị Stale Closure
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // ─── 1. Tải danh sách hội thoại ─────────────────────────────────────────────

  /**
   * Truy xuất danh sách hội thoại từ API và lọc bỏ các hội thoại không hợp lệ.
   */
  const loadConversations = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data: items } = await messageService.getConversations();
      // Lọc bỏ ADMIN và bản thân khỏi danh sách hiển thị
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

  // Polling danh sách hội thoại mỗi 30 giây để cập nhật tin nhắn cuối/trạng thái
  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, 30000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  // ─── 2. Quản lý Kết nối SignalR ─────────────────────────────────────────────

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

    // Khởi tạo Hub Connection
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(messageService.getHubUrl(), {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    /**
     * Bắt đầu kết nối và Join vào phòng nếu có hội thoại đang mở.
     */
    const startHub = async () => {
      try {
        if (hub.state === signalR.HubConnectionState.Disconnected) {
          isStarted = true;
          await hub.start();
          console.log('[SignalR] Kết nối thành công');

          const currentId = activeConvIdRef.current;
          if (currentId) {
            await hub.invoke('JoinConversation', currentId);
          }
        }
      } catch (err) {
        console.error('[SignalR] Lỗi kết nối:', err);
        isStarted = false;
      }
    };

    // Lắng nghe sự kiện nhận tin nhắn
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

      // Cập nhật mảng tin nhắn nếu đang mở hội thoại này
      if (incomingConvId === currentId) {
        setMessages(prev => {
          if (prev.some(m => m.id === mapped.id)) return prev;
          return [...prev, mapped];
        });
      }

      // Cập nhật nội dung xem trước ở thanh bên trái (Sidebar)
      setConversations(prev => prev.map(c =>
        c.id === incomingConvId ? {
          ...c,
          lastMessageText: mapped.content,
          lastMessageTime: 'Vừa xong',
          lastMessageTimeRaw: mapped.createdAtRaw
        } : c
      ));
    });

    // Tự động Join lại khi kết nối lại thành công
    hub.onreconnected(() => {
      const currentId = activeConvIdRef.current;
      if (currentId) hub.invoke('JoinConversation', currentId).catch(console.error);
    });

    startHub();
    hubRef.current = hub;

    return () => {
      if (isStarted) {
        hub.stop().catch(() => { });
      }
    };
  }, [currentUser?.id]);

  // ─── 3. Chuyển đổi Hội thoại (Join SignalR Room) ───────────────────────────

  useEffect(() => {
    const hub = hubRef.current;
    if (!hub || hub.state !== signalR.HubConnectionState.Connected) return;

    if (activeConvId) {
      hub.invoke('JoinConversation', activeConvId)
        .catch(e => console.error('[SignalR] Join failed:', e));
    }
  }, [activeConvId]);

  // ─── 4. Tải dữ liệu chi tiết khi chọn Hội thoại ─────────────────────────────

  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      setActiveParticipants([]);
      return;
    }

    /**
     * Tải tin nhắn và thành viên của hội thoại được chọn.
     */
    const loadDetail = async () => {
      setIsLoadingMessages(true);
      try {
        const [{ data: msgs }, { data: members }] = await Promise.all([
          messageService.getMessages(activeConvId),
          messageService.getMembers(activeConvId),
        ]);
        // Backend trả về DESC (mới lên đầu), ta đảo ngược để hiển thị cũ lên đầu khung chat
        setMessages([...msgs].reverse());
        setActiveParticipants(members);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadDetail();
  }, [activeConvId]);

  // ─── 4.1. Kiểm tra trạng thái SOS của bản thân ──────────────────────────────
  
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const checkSosStatus = async () => {
      const { data: activeSos } = await sosService.getActiveSosReport(currentUser.id);
      setCurrentSosStatus(activeSos?.status || null);
    };

    checkSosStatus();
    const interval = setInterval(checkSosStatus, 15000); // Check mỗi 15s
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // ─── 4.2. Bộ đếm thời gian thực cho nhãn Relative Time ──────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      // Cập nhật nhãn "x phút trước" cho tất cả tin nhắn và hội thoại đang hiển thị
      setMessages(prev => prev.map(m => ({
        ...m,
        createdAt: formatRelativeTime(m.createdAtRaw)
      })));

      setConversations(prev => prev.map(c => ({
        ...c,
        lastMessageTime: c.lastMessageTimeRaw ? formatRelativeTime(c.lastMessageTimeRaw) : c.lastMessageTime
      })));
    }, 60000); // 1 phút / lần
    return () => clearInterval(timer);
  }, []);

  // Thông tin hội thoại đang active
  const activeConversationInfo = conversations.find(c => c.id === activeConvId) ?? null;

  // ─── 5. Tìm kiếm người dùng ──────────────────────────────────────────────────

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
    }, 500); // Debounce 500ms
    return () => clearTimeout(t);
  }, [searchQuery, currentUser?.id]);

  // ─── 6. Action Handlers (Xử lý sự kiện người dùng) ──────────────────────────

  /**
   * Gửi tin nhắn văn bản từ input field.
   */
  const handleSendMessage = async () => {
    if (!activeConvId || !inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    const { data: msg } = await messageService.sendMessage(activeConvId, text);
    if (msg) {
      // Thêm ngay tin nhắn vào UI (Optimistic Update) vì SignalR không gửi lại tin nhắn cho chính người gửi
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Cập nhật xem trước ở thanh bên trái
      setConversations(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, lastMessageText: text, lastMessageTime: 'Vừa xong' } : c
      ));
    }
  };

  /**
   * Khởi tạo hoặc chuyển đến cuộc hội thoại 1-1 với một người dùng mới.
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
   * Tạo nhóm chat mới với danh sách thành viên đã chọn.
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
   * Xóa một đoạn hội thoại khỏi danh sách cá nhân.
   */
  const handleDeleteConversation = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hội thoại này?')) return;
    try {
      await messageService.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) setActiveConvId(null);
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  /**
   * Gửi yêu cầu cứu trợ (Mở Modal)
   */
  const handleRequestRescue = async () => {
    setIsSosModalOpen(true);
  };

  /**
   * Xử lý sau khi người dùng nộp Form SOS thành công
   */
  const onSosFormSuccess = async () => {
    if (!activeConvId) return;
    const { data: msg } = await messageService.sendSystemMessage(
      activeConvId, 
      "Bạn đã gửi yêu cầu cứu trợ đến đội cứu trợ này, hãy đợi admin duyệt"
    );
    if (msg) {
      setMessages(prev => [...prev, msg]);
      setConversations(prev => prev.map(c => 
        c.id === activeConvId ? { ...c, lastMessageText: msg.content, lastMessageTime: 'Vừa xong' } : c
      ));
    }
    setCurrentSosStatus('PENDING');
  };

  // Trả về State và Logic để View sử dụng
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
    isSosModalOpen,
    setIsSosModalOpen,
    currentSosStatus,
    currentUser,

    // Actions
    handleSendMessage,
    handleCreateNewChat,
    handleCreateGroup,
    handleDeleteConversation,
    handleRequestRescue,
    onSosFormSuccess,
  };
};
