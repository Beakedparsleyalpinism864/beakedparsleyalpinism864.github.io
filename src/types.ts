export interface UserProfile {
  uid: string;
  username: string; // e.g. "paw_master"
  displayName: string; // e.g. "Рексі"
  avatarUrl: string;
  bio?: string;
  fursona?: string; // e.g. "Лис", "Вовк", "Дракон"
  onboarded: boolean;
  createdAt: string;
  deactivated?: boolean;
}

export interface Post {
  id: string;
  authorUid: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  isPinned?: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  stickerUrl?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  creatorUid: string;
  membersCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  stickerUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface DirectChat {
  id: string;
  participants: string[];
  participantData: Record<string, { displayName: string; avatarUrl: string; username: string }>;
  lastMessage: string;
  updatedAt: string;
}

export interface Sticker {
  id: string;
  creatorUid: string;
  title?: string;
  imageUrl: string;
  isPublic: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  targetUid: string;
  senderUid: string;
  senderName: string;
  senderAvatar: string;
  type: 'like' | 'comment' | 'message';
  postId?: string;
  chatId?: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export type ActiveTab = 'feed' | 'search' | 'chats' | 'profile' | 'settings';

export type ThemeMode = 'light' | 'dark' | 'system';
