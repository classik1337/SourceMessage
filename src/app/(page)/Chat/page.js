"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FriendChat from "../components/friendChat/chat";
import NewChatModal from '../components/NewChatModal';
import { useSocket } from '../components/context/SocketContext/SocketContext';
import GroupChat from '../components/groupChat/chat';

const formatMessageTime = (timestamp) => {
  const messageDate = new Date(timestamp);
  const today = new Date();
  
  // Сброс времени для сравнения только дат
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (messageDay.getTime() === todayDay.getTime()) {
    // Если сообщение сегодня, показываем только время
    return messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } else {
    // Если другой день, показываем дату в формате дд мм
    return messageDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  }
};
// useEffect(() => {
//   const fetchGroups = async () => {
//     try {
//       setLoading(true);
      
//       // Получаем токен из localStorage
//       const token = localStorage.getItem('authToken');
//       if (!token) {
//         throw new Error('User not authenticated');
//       }

//       const response = await fetch('/api/chat/chatGroups', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch groups');
//       }

//       const data = await response.json();
//       setGroups(data);
//     } catch (err) {
//       setError(err.message);
//       console.error('Error fetching groups:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchGroups();
// }, []);
const MessageItem = ({ 
  type = 'personal',
  avatarSrc = "/castle.jpg", 
  nameFriend = "NameFriends",
  nameGroup,
  idFriend = "#1",
  idGroup,
  timestamp,
  timeMessage,
  contentMessage = "Hello, how are you?",
  lastMessage,
  lastMessageTime,
  membersCount,
  isActive = false,
  isMyMessage = false,
  isRead = false,
  unreadCount = 0,
  onClick
}) => (
  <div 
    className={`${styles.chatContainer} ${isActive ? styles.active : ''}`}
    onClick={onClick}
  >
    <div className={styles.avatarContainer}>
      <Image
        className={styles.avatar}
        aria-hidden
        src={avatarSrc}
        alt="Avatar"
        width={50}
        height={50}
      />
    </div>
    <div className={styles.messageContent}>
      <div className={styles.messageHeader}>
        <span className={styles.senderName}>
          {type === 'group' ? nameGroup : nameFriend}
        </span>
        <span className={styles.messageTime}>
          {type === 'group' ? (lastMessageTime ? formatMessageTime(lastMessageTime) : '') : timeMessage}
        </span>
      </div>
      <div className={styles.messageBottom}>
        <div className={styles.lastMessage}>
          {type === 'group'
            ? (lastMessage || 'Нет сообщений')
            : (isMyMessage ? <span style={{color: 'var(--accent)', fontWeight: 500}}>Вы: </span> : null)}{type === 'group' ? '' : contentMessage}
        </div>
        {type === 'group' && (
          <div className={styles.groupInfo}>
            <span>Участников: {membersCount}</span>
          </div>
        )}
        <div className={styles.messageStatus}>
          {unreadCount > 0 && !isMyMessage && (
            <div className={styles.unreadBadge}>
              {unreadCount}
            </div>
          )}
          {isMyMessage && (
            <div className={styles.readStatus}>
              <Image
                src={isRead ? "/double-check-icon.svg" : "/single-check-icon.svg"}
                alt={isRead ? "Прочитано" : "Отправлено"}
                width={16}
                height={16}
                className={isRead ? styles.readIcon : styles.unreadIcon}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompressed, setIsCompressed] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentFriend, setCurrentFriend] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const socket = useSocket();

  const handleMessageClick = (message) => {
    // Logic for group chats
    if (message.type === 'group') {
      // If the same group chat is clicked, close it
      if (currentGroup && currentGroup.idGroup === message.idGroup) {
        setShowGroupChat(false);
        setCurrentGroup(null);
        setIsCompressed(false);
      } else {
        // Close personal chat window if open
        setShowChat(false);
        setCurrentFriend(null);
        setCurrentChatId(null);
        // Open group chat
        setCurrentGroup(message);
        setShowGroupChat(true);
        setIsCompressed(true);
      }
    } 
    // Logic for personal chats
    else {
      // If the same personal chat is clicked, close it
      if (currentFriend && currentFriend.idFriend === message.idFriend) {
        setShowChat(false);
        setCurrentFriend(null);
        setIsCompressed(false);
        setCurrentChatId(null);
      } else {
        // Close group chat window if open
        setShowGroupChat(false);
        setCurrentGroup(null);
        // Open personal chat
        setCurrentFriend({
          idFriend: message.idFriend,
          nameFriend: message.nameFriend,
          avatarSrc: message.avatarSrc
        });
        setShowChat(true);
        setIsCompressed(true);
        setCurrentChatId(message.chatId);
        setMessages(prev => prev.map(msg =>
          msg.idFriend === message.idFriend ? { ...msg, unreadCount: 0 } : msg
        ));
      }
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setCurrentFriend(null);
    setIsCompressed(false);
    setCurrentChatId(null);
  };

  const handleCloseGroupChat = () => {
    setShowGroupChat(false);
    setCurrentGroup(null);
    setIsCompressed(false);
  };

  const handleNewChat = () => {
    console.log('Opening new chat modal');
    setShowNewChatModal(true);
  };

  const handleSelectFriend = (friend) => {
    // Проверяем, нет ли уже открытого чата с этим другом
    const existingChat = messages.find(msg => msg.idFriend === friend.idFriend);
    if (existingChat) {
      handleMessageClick(existingChat);
    } else {
      // Просто открываем FriendChat с этим другом, chatId = null
      setCurrentFriend({
        idFriend: friend.idFriend,
        nameFriend: friend.nameFriend,
        avatarSrc: friend.avatarSrc
      });
      setShowChat(true);
      setIsCompressed(true);
      setCurrentChatId(null);
    }
    setShowNewChatModal(false);
  };

  const filteredMessages = messages.filter(message => {
    const chatName = message.type === 'group' ? message.nameGroup : message.nameFriend;
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    const fetchAllChats = async () => {
      setLoading(true);
      try {
        // 1. Личные чаты
        const response = await fetch('/api/chat/chatChecker', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        const personalChats = (data.messages || []).map(msg => ({
          ...msg,
          type: 'personal'
        }));
        // Фильтруем только уникальные чаты по idFriend (оставляем самый новый)
        const uniquePersonalMap = new Map();
        personalChats.forEach(msg => {
          if (!uniquePersonalMap.has(msg.idFriend) || new Date(msg.timestamp) > new Date(uniquePersonalMap.get(msg.idFriend).timestamp)) {
            uniquePersonalMap.set(msg.idFriend, msg);
          }
        });
        const uniquePersonalChats = Array.from(uniquePersonalMap.values());

        // 2. Групповые чаты
        const token = localStorage.getItem('token');
        const groupRes = await fetch('/api/chat/chatGroup', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!groupRes.ok) throw new Error('Failed to fetch group chats');
        const groupData = await groupRes.json();
        const groupChats = (groupData || []).map(group => ({
          idGroup: group.group_id,
          nameGroup: group.group_name,
          lastMessage: group.last_message_content,
          lastMessageTime: group.last_message_time,
          membersCount: group.members_count,
          type: 'group',
          avatarSrc: '/group.svg'
        }));
        // Фильтруем только уникальные групповые чаты по idGroup
        const uniqueGroupMap = new Map();
        groupChats.forEach(group => {
          if (!uniqueGroupMap.has(group.idGroup)) {
            uniqueGroupMap.set(group.idGroup, group);
          }
        });
        const uniqueGroupChats = Array.from(uniqueGroupMap.values());

        // 3. Объединяем
        setMessages([...uniquePersonalChats, ...uniqueGroupChats]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllChats();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = ({ message }) => {
      if (!message) return;
      setMessages(prev => {
        const idx = prev.findIndex(
          m => m.chatId === message.chat_id || m.idFriend === message.sender_id || m.idFriend === message.receiver_id
        );
        if (idx !== -1) {
          const isActive = currentFriend && (prev[idx].idFriend === currentFriend.idFriend);
          return prev.map((msg, i) =>
            i === idx
              ? {
                  ...msg,
                  contentMessage: message.content || message.text,
                  timestamp: message.sent_at || new Date().toISOString(),
                  unreadCount: isActive ? 0 : (msg.unreadCount || 0) + 1,
                  isRead: isActive ? true : msg.isRead
                }
              : msg
          );
        } else {
          return [
            {
              idFriend: message.sender_id,
              nameFriend: message.senderName || 'Новый пользователь',
              avatarSrc: message.avatar || '/castle.jpg',
              chatId: message.chat_id,
              contentMessage: message.content || message.text,
              timestamp: message.sent_at || new Date().toISOString(),
              isMyMessage: false,
              isRead: false,
              unreadCount: 1
            },
            ...prev
          ];
        }
      });
    };
    socket.on('new-message', handleNewMessage);
    return () => socket.off('new-message', handleNewMessage);
  }, [socket, currentFriend]);

  if (loading) {
    return <div className={styles.loading}>Loading messages...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.main_Container}>
      <div className={styles.mainFrame}>
        <div className={`${styles.mainFrameChatContainer} ${isCompressed ? styles.compressed : ''}`}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Поиск или новый чат..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className={styles.addChatButton} onClick={handleNewChat}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="11" fill="#00ff9f" fillOpacity="0.18"/>
                <path d="M11 6V16" stroke="#00ff9f" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M6 11H16" stroke="#00ff9f" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className={styles.chatList}>
            {filteredMessages.length > 0 ? (
              filteredMessages.map(message => (
                <MessageItem
                  key={message.type === 'group' ? `group-${message.idGroup}` : message.idFriend}
                  type={message.type}
                  avatarSrc={message.avatarSrc}
                  nameFriend={message.nameFriend}
                  nameGroup={message.nameGroup}
                  idFriend={message.idFriend}
                  idGroup={message.idGroup}
                  timestamp={message.timestamp}
                  timeMessage={formatMessageTime(message.timestamp)}
                  contentMessage={message.contentMessage}
                  lastMessage={message.lastMessage}
                  lastMessageTime={message.lastMessageTime}
                  membersCount={message.membersCount}
                  isActive={currentFriend?.idFriend === message.idFriend}
                  isMyMessage={message.isMyMessage}
                  isRead={message.isRead}
                  unreadCount={message.unreadCount}
                  onClick={() => handleMessageClick(message)}
                />
              ))
            ) : (
              <div className={styles.noMessages}>Чаты не найдены</div>
            )}
          </div>
        </div>
        {showChat && currentFriend && (
          <FriendChat 
            key={currentFriend.idFriend}
            idFriend={currentFriend.idFriend}
            nameFriend={currentFriend.nameFriend}
            avatarSrc={currentFriend.avatarSrc}
            onClose={handleCloseChat}
            chatId={currentChatId}
          />
        )}
        {showGroupChat && currentGroup && (
          <GroupChat
            key={currentGroup.idGroup}
            idFriend={null}
            nameFriend={currentGroup.nameGroup}
            avatarSrc={currentGroup.avatarSrc}
            onClose={handleCloseGroupChat}
            chatId={currentGroup.idGroup}
          />
        )}
      </div>
      {showNewChatModal && (
        <NewChatModal
          onClose={() => {
            console.log('Closing modal');
            setShowNewChatModal(false);
          }}
          onSelectFriend={handleSelectFriend}
        />
      )}
    </div>
  );
}