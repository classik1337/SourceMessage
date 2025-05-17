"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FriendChat from "../components/friendChat/chat";
import NewChatModal from '../components/NewChatModal';

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
    // Если другой день, показываем дату
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
  avatarSrc = "/castle.jpg", 
  nameFriend = "NameFriends",
  idFriend = "#1",
  timestamp,
  timeMessage,
  contentMessage = "Hello, how are you?",
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
        alt="Friend Avatar"
        width={50}
        height={50}
      />
    </div>
    <div className={styles.messageContent}>
      <div className={styles.messageHeader}>
        <span className={styles.senderName}>
          {nameFriend}
        </span>
        <span className={styles.messageTime}>{timeMessage}</span>
      </div>
      <div className={styles.messageBottom}>
        <div className={styles.lastMessage}>
          {contentMessage}
        </div>
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

  const handleMessageClick = (message) => {
    if (currentFriend && currentFriend.idFriend === message.idFriend) {
      // Если кликнули на тот же чат - закрываем его
      setShowChat(false);
      setCurrentFriend(null);
      setIsCompressed(false);
      setCurrentChatId(null);
    } else {
      // Если кликнули на другой чат - открываем его
      setCurrentFriend({
        idFriend: message.idFriend,
        nameFriend: message.nameFriend,
        avatarSrc: message.avatarSrc
      });
      setShowChat(true);
      setIsCompressed(true);
      setCurrentChatId(message.chatId);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setCurrentFriend(null);
    setIsCompressed(false);
  };

  const handleNewChat = () => {
    console.log('Opening new chat modal');
    setShowNewChatModal(true);
  };

  const handleSelectFriend = async (friend) => {
    // Проверяем, нет ли уже открытого чата с этим другом
    const existingChat = messages.find(msg => msg.idFriend === friend.idFriend);
    
    if (existingChat) {
      handleMessageClick(existingChat);
    } else {
      // Создаем новый чат
      try {
        const response = await fetch('/api/chat/createChat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            friendId: friend.idFriend
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to create chat');
        }

        const data = await response.json();
        
        // Добавляем новый чат в список
        const newChat = {
          idFriend: friend.idFriend,
          nameFriend: friend.nameFriend,
          avatarSrc: friend.avatarSrc,
          chatId: data.chatId,
          contentMessage: '', // Пустое последнее сообщение для нового чата
          timestamp: new Date().toISOString(),
          isMyMessage: false,
          isRead: true
        };

        setMessages(prev => [newChat, ...prev]);
        handleMessageClick(newChat);
      } catch (err) {
        console.error('Error creating chat:', err);
      }
    }
    setShowNewChatModal(false);
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/chat/chatChecker', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
  
        const data = await response.json();
        const sortedMessages = (data.messages || []).sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setMessages(sortedMessages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMessages();
  }, []);

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
          <div 
            className={styles.newChatContainer} 
            onClick={() => {
              console.log('New chat container clicked');
              handleNewChat();
            }}
          >
            <span className={styles.chatText}>
              Начать новый чат с друзьями +
            </span>
          </div>
          {messages.length > 0 ? (
            messages.map(message => (
              <MessageItem
                key={message.idFriend}
                avatarSrc={message.avatarSrc}
                nameFriend={message.nameFriend}
                idFriend={message.idFriend}
                timestamp={message.timestamp}
                timeMessage={formatMessageTime(message.timestamp)}
                contentMessage={message.contentMessage}
                isActive={currentFriend?.idFriend === message.idFriend}
                isMyMessage={message.isMyMessage}
                isRead={message.isRead}
                unreadCount={message.unreadCount}
                onClick={() => handleMessageClick(message)}
              />
            ))
          ) : (
            <div className={styles.noMessages}>No messages found</div>
          )}
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