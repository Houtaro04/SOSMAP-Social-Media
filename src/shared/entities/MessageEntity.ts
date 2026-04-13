export class ParticipantItem {
  userId: string = '';
  fullName: string = '';
  avatarUrl?: string = '';
  role: string = '';
  joinedAt: string = '';

  constructor(init?: Partial<ParticipantItem>) {
    if (init) Object.assign(this, init);
  }
}

export class ConversationItem {
  id: string = '';
  type: string = '';
  name: string = '';
  avatarUrl?: string = '';
  lastMessageText?: string = '';
  lastMessageTime?: string = '';
  lastMessageTimeRaw?: string = '';
  unreadCount?: number = 0;
  isOnline?: boolean = false;
  otherUserId?: string = '';
  otherUserName?: string = '';
  otherUserAvatarUrl?: string = '';
  role?: string = '';
  address?: string = '';
  participants?: ParticipantItem[] = [];

  status?: string = 'OPEN'; // OPEN, COMPLETED

  constructor(init?: Partial<ConversationItem>) {
    if (init) Object.assign(this, init);
  }
}

export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
};

export class MessageItem {
  id: string = '';
  conversationId: string = '';
  senderId: string = '';
  senderName: string = '';
  senderAvatarUrl?: string = '';
  type: string = '';
  content: string = '';
  fileUrl?: string = '';
  createdAt: string = '';
  createdAtRaw: string = '';
  isMine?: boolean = false;

  constructor(init?: Partial<MessageItem>) {
    if (init) Object.assign(this, init);
  }
}

// Exporting types for compatibility
export type ConversationResponse = ConversationItem;
export type MessageResponse = MessageItem;

