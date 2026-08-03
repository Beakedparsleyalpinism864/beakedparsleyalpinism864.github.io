import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Group, DirectChat, ChatMessage } from '../types';
import {
  getGroupsRealtime,
  createGroup,
  getGroupMessagesRealtime,
  sendGroupMessage,
  getDirectChatsRealtime,
  getDirectChatMessagesRealtime,
  sendDirectChatMessage,
} from '../services/dbService';
import { compressImage } from '../utils/imageCompressor';
import { Users, MessageSquare, Plus, Send, Image as ImageIcon, Sticker, X, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

interface ChatSystemProps {
  currentUser: UserProfile;
  activeChatIdParam?: string | null;
  onOpenStickerPicker: (onSelect: (url: string) => void) => void;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({
  currentUser,
  activeChatIdParam,
  onOpenStickerPicker,
}) => {
  const [subTab, setSubTab] = useState<'groups' | 'direct'>('groups');
  
  // Public Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Direct Chats state
  const [directChats, setDirectChats] = useState<DirectChat[]>([]);
  const [activeDirectChat, setActiveDirectChat] = useState<DirectChat | null>(null);
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);

  // Input states
  const [messageText, setMessageText] = useState('');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load Groups
  useEffect(() => {
    const unsub = getGroupsRealtime((list) => {
      setGroups(list);
      if (list.length > 0 && !activeGroup && subTab === 'groups') {
        setActiveGroup(list[0]);
      }
    });
    return () => unsub();
  }, [subTab]);

  // Load Direct Chats
  useEffect(() => {
    const unsub = getDirectChatsRealtime(currentUser.uid, (list) => {
      setDirectChats(list);
      if (activeChatIdParam) {
        const found = list.find((c) => c.id === activeChatIdParam);
        if (found) {
          setSubTab('direct');
          setActiveDirectChat(found);
        }
      } else if (list.length > 0 && !activeDirectChat && subTab === 'direct') {
        setActiveDirectChat(list[0]);
      }
    });
    return () => unsub();
  }, [currentUser.uid, activeChatIdParam, subTab]);

  // Load Group Messages
  useEffect(() => {
    if (!activeGroup || subTab !== 'groups') return;
    const unsub = getGroupMessagesRealtime(activeGroup.id, (msgs) => {
      setGroupMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });
    return () => unsub();
  }, [activeGroup, subTab]);

  // Load Direct Chat Messages
  useEffect(() => {
    if (!activeDirectChat || subTab !== 'direct') return;
    const unsub = getDirectChatMessagesRealtime(activeDirectChat.id, (msgs) => {
      setDirectMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });
    return () => unsub();
  }, [activeDirectChat, subTab]);

  // Image Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedSticker && !selectedFile) return;

    setIsSending(true);
    let compressedImageUrl = '';

    if (selectedFile) {
      try {
        compressedImageUrl = await compressImage(selectedFile, 1000, 1000, 0.8);
      } catch (err) {
        console.error('Failed to compress chat image:', err);
      }
    }

    const payload = {
      senderUid: currentUser.uid,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatarUrl,
      content: messageText.trim(),
      stickerUrl: selectedSticker || undefined,
      imageUrl: compressedImageUrl || undefined,
    };

    if (subTab === 'groups' && activeGroup) {
      await sendGroupMessage(activeGroup.id, payload);
    } else if (subTab === 'direct' && activeDirectChat) {
      const recipientUid = activeDirectChat.participants.find((p) => p !== currentUser.uid);
      await sendDirectChatMessage(activeDirectChat.id, payload, recipientUid);
    }

    setMessageText('');
    setSelectedSticker(null);
    setSelectedFile(null);
    setImagePreview(null);
    setIsSending(false);
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const groupId = await createGroup({
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || 'Фуррі-спільнота FurHubUA',
      creatorUid: currentUser.uid,
    });

    if (groupId) {
      setNewGroupName('');
      setNewGroupDesc('');
      setIsCreatingGroup(false);
    }
  };

  // Helper for partner in Direct Chat
  const getPartnerInfo = (chat: DirectChat) => {
    const partnerUid = chat.participants.find((p) => p !== currentUser.uid) || currentUser.uid;
    return chat.participantData[partnerUid] || { displayName: 'Користувач', avatarUrl: '', username: 'user' };
  };

  return (
    <div className="glass rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden flex flex-col md:flex-row h-[78vh]">
      
      {/* Left Sidebar: Tabs & Rooms/Contacts List */}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-white/10 flex flex-col bg-slate-50/90 dark:bg-slate-900/40 ${
        (activeGroup && subTab === 'groups') || (activeDirectChat && subTab === 'direct') ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Header Switcher */}
        <div className="p-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/70 dark:bg-white/5">
          <div className="flex bg-slate-200/80 dark:bg-black/30 p-1 rounded-xl w-full border border-slate-300 dark:border-white/10">
            <button
              onClick={() => setSubTab('groups')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                subTab === 'groups' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>Групи</span>
            </button>
            <button
              onClick={() => setSubTab('direct')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                subTab === 'direct' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>Особисті (DMs)</span>
            </button>
          </div>
        </div>

        {/* Action button if Groups tab */}
        {subTab === 'groups' && (
          <div className="p-3 border-b border-slate-200 dark:border-white/10">
            <button
              onClick={() => setIsCreatingGroup(!isCreatingGroup)}
              className="w-full py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md border border-white/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Створити нову групу</span>
            </button>

            {/* Create Group Inline Form */}
            {isCreatingGroup && (
              <form onSubmit={handleCreateGroupSubmit} className="mt-3 p-3 glass-card rounded-2xl border border-slate-200 dark:border-white/15 space-y-2">
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Назва групи..."
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-white/10"
                />
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Опис спільноти..."
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-white/10"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-lg shadow-md cursor-pointer"
                  >
                    Створити
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Rooms / Chats List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {subTab === 'groups' ? (
            groups.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-600 dark:text-slate-400">
                Тут поки порожньо, стань першим! Створіть нову групу!
              </div>
            ) : (
              groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup(g)}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                    activeGroup?.id === g.id
                      ? 'bg-sky-500/15 text-slate-900 dark:text-white font-bold border border-sky-400/40 shadow-md'
                      : 'hover:bg-slate-200/60 dark:hover:bg-white/5 text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    activeGroup?.id === g.id ? 'bg-sky-500 text-white' : 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-400/30'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">{g.name}</div>
                    <div className={`text-[11px] truncate ${activeGroup?.id === g.id ? 'text-sky-600 dark:text-sky-300 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                      {g.description}
                    </div>
                  </div>
                </button>
              ))
            )
          ) : directChats.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-600 dark:text-slate-400 px-4">
              Немає активних чатів. Скористайтеся пошуком або кнопкою "Написати в ЛС" під постом!
            </div>
          ) : (
            directChats.map((c) => {
              const partner = getPartnerInfo(c);
              const isActive = activeDirectChat?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveDirectChat(c)}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/15 text-slate-900 dark:text-white font-bold border border-sky-400/40 shadow-md'
                      : 'hover:bg-slate-200/60 dark:hover:bg-white/5 text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <img
                    src={partner.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={partner.displayName}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-sky-500/80"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">{partner.displayName}</div>
                    <div className={`text-[11px] truncate ${isActive ? 'text-sky-600 dark:text-sky-300 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                      {c.lastMessage}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Chat Room Panel */}
      <div className={`flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/60 ${
        (!activeGroup && subTab === 'groups') && (!activeDirectChat && subTab === 'direct') ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Active Room Header */}
        {subTab === 'groups' && activeGroup ? (
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/80 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveGroup(null)}
                className="md:hidden p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold border border-sky-400/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{activeGroup.name}</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">{activeGroup.description}</p>
              </div>
            </div>
          </div>
        ) : subTab === 'direct' && activeDirectChat ? (
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/80 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveDirectChat(null)}
                className="md:hidden p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img
                src={getPartnerInfo(activeDirectChat).avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt="Partner"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/80"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{getPartnerInfo(activeDirectChat).displayName}</h3>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">@{getPartnerInfo(activeDirectChat).username}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-600 dark:text-slate-400 text-sm">
            Оберіть групу або особистий чат зі списку ліворуч
          </div>
        )}

        {/* Message Stream */}
        {((subTab === 'groups' && activeGroup) || (subTab === 'direct' && activeDirectChat)) && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/30 dark:bg-black/20">
              {(subTab === 'groups' ? groupMessages : directMessages).length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-600 dark:text-slate-400">
                  Тут поки порожньо, стань першим! Напишіть щось приємне! ✨
                </div>
              ) : (
                (subTab === 'groups' ? groupMessages : directMessages).map((m) => {
                  const isMe = m.senderUid === currentUser.uid;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isMe && (
                        <img
                          src={m.senderAvatar}
                          alt={m.senderName}
                          className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-sky-500/60"
                        />
                      )}
                      <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 px-1">{m.senderName}</div>
                        )}
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-sky-500 text-white rounded-br-none shadow-md border border-white/10'
                            : 'glass-card text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-bl-none shadow-md bg-white dark:bg-slate-800'
                        }`}>
                          {m.content && <p>{m.content}</p>}
                          {m.stickerUrl && (
                            <img src={m.stickerUrl} alt="Стікер" className="w-24 h-24 object-contain mt-1" />
                          )}
                          {m.imageUrl && (
                            <img src={m.imageUrl} alt="Фото" className="max-w-full rounded-lg mt-1 max-h-48 object-cover border border-slate-200 dark:border-white/10" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-2">
              
              {/* Previews */}
              {selectedSticker && (
                <div className="relative inline-block glass p-1.5 rounded-xl border border-sky-400/50">
                  <img src={selectedSticker} alt="Стікер" className="w-14 h-14 object-contain" />
                  <button
                    type="button"
                    onClick={() => setSelectedSticker(null)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow-md cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              {imagePreview && (
                <div className="relative inline-block glass p-1 rounded-xl border border-sky-400/50">
                  <img src={imagePreview} alt="Прев'ю" className="w-16 h-16 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow-md cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Напишіть повідомлення..."
                  className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs focus:ring-1 focus:ring-sky-500 outline-none text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10"
                />

                {/* Attach Photo Button */}
                <label className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 glass hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl cursor-pointer transition-colors border border-slate-200 dark:border-white/10">
                  <ImageIcon className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>

                {/* Sticker Button */}
                <button
                  type="button"
                  onClick={() => onOpenStickerPicker((url) => setSelectedSticker(url))}
                  className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 glass hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
                >
                  <Sticker className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isSending || (!messageText.trim() && !selectedSticker && !selectedFile)}
                  className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-md transition-colors border border-white/10 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
