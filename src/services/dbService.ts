import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Post, Comment, Group, ChatMessage, DirectChat, Sticker, AppNotification } from '../types';

// NOTIFICATIONS
export async function createNotification(notif: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>): Promise<void> {
  if (notif.targetUid === notif.senderUid) return; // Don't notify yourself
  try {
    const ref = collection(db, 'notifications');
    await addDoc(ref, {
      ...notif,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

export function getUserNotificationsRealtime(userUid: string, callback: (notifications: AppNotification[]) => void) {
  if (!userUid) return () => {};
  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('targetUid', '==', userUid));

  return onSnapshot(q, (snapshot) => {
    const list: AppNotification[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (err) => {
    console.error('Error listening to notifications:', err);
    callback([]);
  });
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  try {
    const notifRef = doc(db, 'notifications', notifId);
    await updateDoc(notifRef, { isRead: true });
  } catch (err) {
    console.error('Error marking notification read:', err);
  }
}

export async function markAllNotificationsAsRead(userUid: string, notifIds: string[]): Promise<void> {
  try {
    const promises = notifIds.map(id => updateDoc(doc(db, 'notifications', id), { isRead: true }));
    await Promise.all(promises);
  } catch (err) {
    console.error('Error marking all notifications read:', err);
  }
}

// USER PROFILES
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(userRef, {
      ...profile,
      onboarded: true,
      deactivated: false,
    }, { merge: true });

    // Also register username in usernames collection
    const cleanUsername = profile.username.toLowerCase().trim();
    if (cleanUsername) {
      await setDoc(doc(db, 'usernames', cleanUsername), { uid: profile.uid });
    }
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

export async function checkUsernameAvailable(username: string, currentUid?: string): Promise<boolean> {
  const clean = username.toLowerCase().trim();
  if (!clean || clean.length < 3) return false;
  try {
    const usernameDoc = await getDoc(doc(db, 'usernames', clean));
    if (!usernameDoc.exists()) return true;
    return usernameDoc.data()?.uid === currentUid;
  } catch (error) {
    console.error('Error checking username:', error);
    return true; // Fallback
  }
}

// POSTS
export function getPostsRealtime(callback: (posts: Post[]) => void) {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const posts: Post[] = [];
    snapshot.forEach((docSnap) => {
      posts.push({ id: docSnap.id, ...docSnap.data() } as Post);
    });

    // Sort pinned posts first, then by timestamp
    posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    callback(posts);
  }, (err) => {
    console.error('Error listening to posts:', err);
    callback([]);
  });
}

export async function createPost(postData: Omit<Post, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>): Promise<string | null> {
  try {
    const postsRef = collection(db, 'posts');
    const newPost = {
      ...postData,
      isPinned: postData.isPinned || false,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(postsRef, newPost);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

export async function toggleLikePost(
  postId: string,
  userUid: string,
  postAuthorUid?: string,
  actorName?: string,
  actorAvatar?: string
): Promise<boolean> {
  try {
    const likeRef = doc(db, 'posts', postId, 'likes', userUid);
    const postRef = doc(db, 'posts', postId);
    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { likesCount: increment(-1) });
      return false; // unliked
    } else {
      await setDoc(likeRef, { uid: userUid, createdAt: new Date().toISOString() });
      await updateDoc(postRef, { likesCount: increment(1) });
      
      if (postAuthorUid && postAuthorUid !== userUid && actorName) {
        createNotification({
          targetUid: postAuthorUid,
          senderUid: userUid,
          senderName: actorName,
          senderAvatar: actorAvatar || '',
          type: 'like',
          postId,
          text: 'вподобав(ла) ваш пост',
        });
      }
      return true; // liked
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return false;
  }
}

export function getUserLikesRealtime(postId: string, userUid: string, callback: (isLiked: boolean) => void) {
  if (!userUid) return () => {};
  const likeRef = doc(db, 'posts', postId, 'likes', userUid);
  return onSnapshot(likeRef, (snap) => {
    callback(snap.exists());
  });
}

// COMMENTS
export function getPostCommentsRealtime(postId: string, callback: (comments: Comment[]) => void) {
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((docSnap) => {
      comments.push({ id: docSnap.id, postId, ...docSnap.data() } as Comment);
    });
    callback(comments);
  });
}

export async function addComment(
  postId: string,
  commentData: Omit<Comment, 'id' | 'postId' | 'createdAt'>,
  postAuthorUid?: string
): Promise<boolean> {
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    await addDoc(commentsRef, {
      ...commentData,
      createdAt: new Date().toISOString(),
    });
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { commentsCount: increment(1) });

    if (postAuthorUid && postAuthorUid !== commentData.authorUid) {
      createNotification({
        targetUid: postAuthorUid,
        senderUid: commentData.authorUid,
        senderName: commentData.authorName,
        senderAvatar: commentData.authorAvatar,
        type: 'comment',
        postId,
        text: `залишив(ла) коментар: "${commentData.content ? (commentData.content.length > 25 ? commentData.content.slice(0, 25) + '...' : commentData.content) : 'стікер'}"`,
      });
    }

    return true;
  } catch (error) {
    console.error('Error adding comment:', error);
    return false;
  }
}

// GROUPS (ПУБЛІЧНІ ГРУПИ)
export function getGroupsRealtime(callback: (groups: Group[]) => void) {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const groups: Group[] = [];
    snapshot.forEach((docSnap) => {
      groups.push({ id: docSnap.id, ...docSnap.data() } as Group);
    });
    callback(groups);
  });
}

export async function createGroup(groupData: Omit<Group, 'id' | 'membersCount' | 'createdAt'>): Promise<string | null> {
  try {
    const groupsRef = collection(db, 'groups');
    const docRef = await addDoc(groupsRef, {
      ...groupData,
      membersCount: 1,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    return null;
  }
}

export function getGroupMessagesRealtime(groupId: string, callback: (messages: ChatMessage[]) => void) {
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const msgs: ChatMessage[] = [];
    snapshot.forEach((docSnap) => {
      msgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
    });
    callback(msgs);
  });
}

export async function sendGroupMessage(groupId: string, messageData: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    await addDoc(messagesRef, {
      ...messageData,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error sending group message:', error);
    return false;
  }
}

// DIRECT CHATS (ОСОБИСТІ ПОВІДОМЛЕННЯ)
export function getDirectChatsRealtime(userUid: string, callback: (chats: DirectChat[]) => void) {
  if (!userUid) return () => {};
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', userUid));

  return onSnapshot(q, (snapshot) => {
    const chats: DirectChat[] = [];
    snapshot.forEach((docSnap) => {
      chats.push({ id: docSnap.id, ...docSnap.data() } as DirectChat);
    });
    chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    callback(chats);
  });
}

export async function createOrGetDirectChat(
  userA: { uid: string; name: string; avatar: string; username: string },
  userB: { uid: string; name: string; avatar: string; username: string }
): Promise<string> {
  const sortedIds = [userA.uid, userB.uid].sort();
  const chatId = `chat_${sortedIds[0]}_${sortedIds[1]}`;
  const chatRef = doc(db, 'chats', chatId);

  const existingSnap = await getDoc(chatRef);
  if (!existingSnap.exists()) {
    await setDoc(chatRef, {
      id: chatId,
      participants: [userA.uid, userB.uid],
      participantData: {
        [userA.uid]: { displayName: userA.name, avatarUrl: userA.avatar, username: userA.username },
        [userB.uid]: { displayName: userB.name, avatarUrl: userB.avatar, username: userB.username },
      },
      lastMessage: 'Розмову розпочато',
      updatedAt: new Date().toISOString(),
    });
  }
  return chatId;
}

export function getDirectChatMessagesRealtime(chatId: string, callback: (messages: ChatMessage[]) => void) {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const msgs: ChatMessage[] = [];
    snapshot.forEach((docSnap) => {
      msgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
    });
    callback(msgs);
  });
}

export async function sendDirectChatMessage(
  chatId: string,
  messageData: Omit<ChatMessage, 'id' | 'createdAt'>,
  recipientUid?: string
): Promise<boolean> {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      ...messageData,
      createdAt: new Date().toISOString(),
    });
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: messageData.stickerUrl ? '[Стікер]' : messageData.content || '[Зображення]',
      updatedAt: new Date().toISOString(),
    });

    if (recipientUid && recipientUid !== messageData.senderUid) {
      createNotification({
        targetUid: recipientUid,
        senderUid: messageData.senderUid,
        senderName: messageData.senderName,
        senderAvatar: messageData.senderAvatar,
        type: 'message',
        chatId,
        text: 'надіслав(ла) нове повідомлення в ЛС',
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending direct message:', error);
    return false;
  }
}

// STICKERS (СТІКЕРИ)
export function getStickersRealtime(userUid: string, callback: (stickers: Sticker[]) => void) {
  const stickersRef = collection(db, 'stickers');
  const q = query(stickersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const stickers: Sticker[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Sticker;
      if (data.isPublic || data.creatorUid === userUid) {
        stickers.push({ id: docSnap.id, ...data });
      }
    });
    callback(stickers);
  });
}

export async function saveSticker(stickerData: Omit<Sticker, 'id' | 'createdAt'>): Promise<string | null> {
  try {
    const stickersRef = collection(db, 'stickers');
    const docRef = await addDoc(stickersRef, {
      ...stickerData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving sticker:', error);
    return null;
  }
}

export async function deleteSticker(stickerId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'stickers', stickerId));
    return true;
  } catch (error) {
    console.error('Error deleting sticker:', error);
    return false;
  }
}

// SEARCH (ПОШУК ПУБЛІЧНИХ АКАУНТІВ, ПОСТІВ ТА ГРУП)
export async function searchPublicContent(searchTerm: string) {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return { users: [], posts: [], groups: [] };

  try {
    const usersSnap = await getDocs(query(collection(db, 'users')));
    const postsSnap = await getDocs(query(collection(db, 'posts')));
    const groupsSnap = await getDocs(query(collection(db, 'groups')));

    const matchedUsers: UserProfile[] = [];
    usersSnap.forEach((docSnap) => {
      const u = docSnap.data() as UserProfile;
      if (!u.deactivated && u.onboarded) {
        if (
          u.username?.toLowerCase().includes(term) ||
          u.displayName?.toLowerCase().includes(term) ||
          u.fursona?.toLowerCase().includes(term)
        ) {
          matchedUsers.push(u);
        }
      }
    });

    const matchedPosts: Post[] = [];
    postsSnap.forEach((docSnap) => {
      const p = docSnap.data() as Post;
      if (
        p.content?.toLowerCase().includes(term) ||
        p.authorName?.toLowerCase().includes(term) ||
        p.authorUsername?.toLowerCase().includes(term)
      ) {
        matchedPosts.push({ id: docSnap.id, ...p });
      }
    });

    const matchedGroups: Group[] = [];
    groupsSnap.forEach((docSnap) => {
      const g = docSnap.data() as Group;
      if (
        g.name?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term)
      ) {
        matchedGroups.push({ id: docSnap.id, ...g });
      }
    });

    return { users: matchedUsers, posts: matchedPosts, groups: matchedGroups };
  } catch (error) {
    console.error('Error performing search:', error);
    return { users: [], posts: [], groups: [] };
  }
}

// DANGER ZONE / ACCOUNT DELETION
export async function deactivateOrDeleteAccount(userUid: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userUid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const uData = userSnap.data() as UserProfile;
      if (uData.username) {
        await deleteDoc(doc(db, 'usernames', uData.username.toLowerCase()));
      }
    }

    await updateDoc(userRef, {
      deactivated: true,
      onboarded: false,
      displayName: 'Видалений користувач',
      username: `deleted_${Date.now()}`,
      bio: 'Акаунт було деактивовано користувачем',
    });
    return true;
  } catch (error) {
    console.error('Error deactivating account:', error);
    return false;
  }
}
