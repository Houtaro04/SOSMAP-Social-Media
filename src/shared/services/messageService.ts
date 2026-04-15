/**
 * Message Service - Quản lý các hoạt động liên lạc, hội thoại và tin nhắn.
 * 
 * Các endpoint hỗ trợ:
 * - GET    /api/Conversation/my                          → Lấy danh sách hội thoại của người dùng hiện tại.
 * - POST   /api/Conversation/private                    → Khởi tạo hoặc lấy phòng chat 1-1 (truyền receiverId).
 * - POST   /api/Conversation/group                      → Tạo nhóm chat mới (truyền name, memberIds).
 * - GET    /api/Conversation/{id}/members               → Truy xuất danh sách thành viên của một hội thoại.
 * - DELETE /api/Conversation/{id}                       → Xóa cuộc hội thoại (Soft delete/Leave tùy backend).
 * - GET    /api/Message/conversation/{id}?page=1&pageSize=30  → Lấy lịch sử tin nhắn kèm phân trang.
 * - POST   /api/Message/send                            → Gửi tin nhắn mới (hỗ trợ đính kèm file qua FormData).
 * - GET    /api/User?searchTerm=...                     → Tìm kiếm người dùng hệ thống.
 */

import { apiGet, apiPost, apiDelete, BASE_URL } from '../../lib/api';
import { ensureFullUrl } from './profileService';
import {
  ConversationItem,
  ParticipantItem,
  MessageItem
} from '../entities/MessageEntity';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Truy xuất ID người dùng hiện tại từ local storage (Zustand auth storage).
 * @returns ID người dùng hoặc undefined nếu chưa đăng nhập.
 */
function getCurrentUserId(): string | undefined {
  try {
    const raw = localStorage.getItem('sosmap-auth-storage');
    if (!raw) return undefined;
    const { state } = JSON.parse(raw);
    return state?.user?.id;
  } catch {
    return undefined;
  }
}

/**
 * Chuyển đổi chuỗi thời gian từ Backend sang định dạng tương đối (ví dụ: 'Vừa xong', '5 phút trước').
 * @param dateStr Chuỗi thời gian ISO nhận từ API.
 * @returns Chuỗi thời gian thân thiện với người dùng.
 */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const now = new Date();
    // Xử lý lệch múi giờ nếu chuỗi không có Z (mặc định coi là UTC nếu cần, hoặc local tùy Backend)
    const date = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffMs < 0) return 'Vừa xong'; // Đối với các máy khách nhanh hơn server một chút
    if (diffSec < 60) return 'Vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    if (diffSec < 172800) return 'Hôm qua';

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr || '';
  }
}

/**
 * Chuyển đổi dữ liệu thô từ API sang interface ConversationItem chuẩn.
 * @param raw Đối tượng thô nhận từ API.
 * @returns Đối tượng hội thoại đã được chuẩn hóa.
 */
function mapConversation(raw: any): ConversationItem {
  const id = raw.id || raw.Id || '';
  const type: string = raw.type || raw.Type || 'Private';

  const isPrivate = type === 'Private' || type === 'PRIVATE';
  const name = isPrivate
    ? (raw.otherUserName || raw.OtherUserName || raw.name || raw.Name || 'Người dùng')
    : (raw.name || raw.Name || `Nhóm ${id.slice(0, 8)}`);

  const avatarRaw = isPrivate
    ? (raw.otherUserAvatarUrl || raw.OtherUserAvatarUrl || raw.avatarUrl || raw.AvatarUrl || raw.imageUrl || raw.ImageUrl)
    : (raw.imageUrl || raw.ImageUrl || raw.avatarUrl || raw.AvatarUrl);

  const lastMsg = raw.lastMessage || raw.LastMessage;

  return new ConversationItem({
    id,
    type,
    name,
    avatarUrl: ensureFullUrl(avatarRaw, name),
    lastMessageText: lastMsg?.content || lastMsg?.Content || '',
    lastMessageTime: lastMsg?.createdAt ? formatRelativeTime(lastMsg.createdAt) : (raw.updatedAt ? formatRelativeTime(raw.updatedAt) : ''),
    lastMessageTimeRaw: lastMsg?.createdAt || raw.updatedAt,
    unreadCount: 0,
    isOnline: raw.isOnline || raw.IsOnline || false,
    otherUserId: raw.otherUserId || raw.OtherUserId,
    otherUserName: raw.otherUserName || raw.OtherUserName,
    otherUserAvatarUrl: ensureFullUrl(raw.otherUserAvatarUrl || raw.OtherUserAvatarUrl, name),
    role: raw.role || raw.Role || '',
    address: raw.address || raw.Address || '',
    status: raw.status || raw.Status || 'OPEN',
    participants: (raw.participants || raw.Participants || []).map((p: any) => new ParticipantItem({
      userId: p.userId || p.UserId,
      fullName: p.fullName || p.FullName || 'Thành viên',
      avatarUrl: ensureFullUrl(p.avatarUrl || p.AvatarUrl, p.fullName || p.FullName),
      role: p.role || p.Role || 'Member',
      joinedAt: p.joinedAt || p.JoinedAt || '',
      isOnline: p.isOnline || p.IsOnline || false,
    })),
  });
}

function ensureFullFileUrl(url?: string): string | undefined {
  if (!url || url.trim() === '') return undefined;
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const BACKEND_HOST = BASE_URL.replace('/api', '');
  const normalizedUrl = url.replace(/\\/g, '/');
  const cleanUrl = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
  return `${BACKEND_HOST}${cleanUrl}`;
}

/**
 * Chuyển đổi dữ liệu thô từ API sang interface MessageItem chuẩn.
 * @param raw Đối tượng thô nhận từ API.
 * @returns Đối tượng tin nhắn đã được chuẩn hóa.
 */
function mapMessage(raw: any): MessageItem {
  const senderId = raw.senderId || raw.SenderId || '';
  return new MessageItem({
    id: raw.id || raw.Id || '',
    conversationId: raw.conversationId || raw.ConversationId || '',
    senderId,
    senderName: raw.senderName || raw.SenderName || '',
    senderAvatarUrl: ensureFullUrl(raw.senderAvatarUrl || raw.SenderAvatarUrl || raw.avatarUrl || raw.AvatarUrl || raw.imageUrl || raw.ImageUrl || raw.avatar, raw.senderName || raw.SenderName),
    type: raw.type || raw.Type || 'Text',
    content: raw.content || raw.Content || '',
    fileUrl: ensureFullFileUrl(raw.fileUrl || raw.FileUrl),
    createdAt: (raw.createdAt || raw.CreatedAt) ? formatRelativeTime(raw.createdAt || raw.CreatedAt) : 'Vừa xong',
    createdAtRaw: raw.createdAt || raw.CreatedAt || new Date().toISOString(),
    isMine: senderId === getCurrentUserId(),
  });
}

// ─── Exported Service ────────────────────────────────────────────────────────

/**
 * Service cung cấp các phương thức giao tiếp với API liên quan đến tin nhắn.
 */
export const messageService = {

  /**
   * Truy xuất danh sách hội thoại của người dùng hiện tại.
   * @returns Mảng các đối tượng hội thoại.
   */
  getConversations: async (): Promise<{ data: ConversationItem[] }> => {
    try {
      const res = await apiGet<any>('/Conversation/my');
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => mapConversation(item)) };
    } catch (e) {
      console.error('[MessageService] getConversations error:', e);
      return { data: [] };
    }
  },

  /**
   * Truy xuất lịch sử tin nhắn của một cuộc hội thoại cụ thể.
   * @param conversationId ID của cuộc hội thoại.
   * @returns Mảng các đối tượng tin nhắn.
   */
  getMessages: async (conversationId: string): Promise<{ data: MessageItem[] }> => {
    try {
      const res = await apiGet<any>(`/Message/conversation/${conversationId}`, { page: 1, pageSize: 50 });
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => mapMessage(item)) };
    } catch (e) {
      console.error('[MessageService] getMessages error:', e);
      return { data: [] };
    }
  },

  /**
   * Lấy danh sách thành viên trong một cuộc hội thoại (thường dùng cho chat nhóm).
   * @param conversationId ID của hội thoại.
   * @returns Mảng các đối tượng thành viên.
   */
  getMembers: async (conversationId: string): Promise<{ data: ParticipantItem[] }> => {
    try {
      const res = await apiGet<any>(`/Conversation/${conversationId}/members`);
      const items = res?.data || (Array.isArray(res) ? res : []);
      return {
        data: items.map((p: any) => new ParticipantItem({
          userId: p.userId || p.UserId,
          fullName: p.fullName || p.FullName || 'Thành viên',
          avatarUrl: ensureFullUrl(p.avatarUrl || p.AvatarUrl, p.fullName || p.FullName),
          role: p.role || p.Role || 'Member',
          joinedAt: p.joinedAt || p.JoinedAt || '',
          isOnline: p.isOnline || p.IsOnline || false,
        }))
      };
    } catch (e) {
      console.error('[MessageService] getMembers error:', e);
      return { data: [] };
    }
  },

  /**
   * Khởi tạo hoặc lấy lại phòng chat 1-1 với một người dùng khác.
   * @param receiverId ID của người nhận.
   * @returns Đối tượng hội thoại hoặc null nếu lỗi.
   */
  getOrCreatePrivate: async (receiverId: string): Promise<{ data: ConversationItem | null }> => {
    try {
      const res = await apiPost<any>('/Conversation/private', { receiverId });
      const raw = res?.data || res;
      return { data: mapConversation(raw) };
    } catch (e) {
      console.error('[MessageService] getOrCreatePrivate error:', e);
      return { data: null };
    }
  },

  /**
   * Tạo một nhóm chat mới.
   * @param name Tên nhóm.
   * @param memberIds Danh sách ID các thành viên cần mời vào nhóm.
   * @returns Đối tượng hội thoại nhóm mới hoặc null nếu lỗi.
   */
  createGroup: async (name: string, memberIds: string[]): Promise<{ data: ConversationItem | null }> => {
    try {
      const res = await apiPost<any>('/Conversation/group', { name, memberIds });
      const raw = res?.data || res;
      return { data: mapConversation(raw) };
    } catch (e) {
      console.error('[MessageService] createGroup error:', e);
      return { data: null };
    }
  },

  /**
   * Gửi tin nhắn mới vào cuộc hội thoại.
   * @param conversationId ID hội thoại.
   * @param content Nội dung tin nhắn văn bản.
   * @returns Đối tượng tin nhắn đã gửi thành công hoặc null nếu lỗi.
   */
  sendMessage: async (conversationId: string, content: string): Promise<{ data: MessageItem | null }> => {
    try {
      const formData = new FormData();
      formData.append('ConversationId', conversationId);
      formData.append('Content', content);
      formData.append('Type', 'Text');
      const res = await apiPost<any>('/Message/send', formData);
      const raw = res?.data || res;
      return { data: mapMessage(raw) };
    } catch (e) {
      console.error('[MessageService] sendMessage error:', e);
      return { data: null };
    }
  },

  /**
   * Gửi tin nhắn kèm file đính kèm (ảnh) vào cuộc hội thoại.
   * @param conversationId ID hội thoại.
   * @param file File ảnh cần gửi.
   * @param content Nội dung text đi kèm (tuỳ chọn).
   * @returns Đối tượng tin nhắn đã gửi thành công hoặc null nếu lỗi.
   */
  sendMessageWithFile: async (conversationId: string, file: File, content?: string): Promise<{ data: MessageItem | null }> => {
    try {
      const formData = new FormData();
      formData.append('ConversationId', conversationId);
      formData.append('Content', content || '');
      formData.append('Type', 'Image');
      formData.append('File', file);
      const res = await apiPost<any>('/Message/send', formData);
      const raw = res?.data || res;
      return { data: mapMessage(raw) };
    } catch (e) {
      console.error('[MessageService] sendMessageWithFile error:', e);
      return { data: null };
    }
  },

  /**
   * Gửi tin nhắn hệ thống vào cuộc hội thoại.
   */
  sendSystemMessage: async (conversationId: string, content: string): Promise<{ data: MessageItem | null }> => {
    try {
      const formData = new FormData();
      formData.append('ConversationId', conversationId);
      formData.append('Content', content);
      formData.append('Type', 'SYSTEM');
      const res = await apiPost<any>('/Message/send', formData);
      const raw = res?.data || res;
      return { data: mapMessage(raw) };
    } catch (e) {
      console.error('[MessageService] sendSystemMessage error:', e);
      return { data: null };
    }
  },

  /**
   * Xóa một cuộc hội thoại khỏi danh sách của người dùng hiện tại (Soft delete).
   * @param conversationId ID hội thoại cần xóa.
   */
  deleteConversation: async (conversationId: string): Promise<void> => {
    try {
      await apiDelete(`/Conversation/${conversationId}`);
    } catch (e) {
      console.error('[MessageService] deleteConversation error:', e);
      throw e;
    }
  },

  /**
   * Tìm kiếm người dùng dựa theo tên hoặc số điện thoại để bắt đầu trò chuyện.
   * @param query Từ khóa tìm kiếm.
   * @returns Mảng kết quả người dùng phù hợp.
   */
  searchUsers: async (query: string): Promise<{ data: any[] }> => {
    try {
      const res = await apiGet<any>('/User', { limit: 20, searchTerm: query });
      return { data: res?.data || (Array.isArray(res) ? res : []) };
    } catch (e) {
      console.error('[MessageService] searchUsers error:', e);
      return { data: [] };
    }
  },

  /**
   * Truy xuất URL của SignalR Hub chính.
   * @returns URL hoàn chỉnh để khởi tạo HubConnection.
   */
  getHubUrl: (): string => {
    return BASE_URL.replace('/api', '') + '/chathub';
  },
};
