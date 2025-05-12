import Image from "next/image";
import styles from "./page.module.css";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FriendChat from "../components/friendChat/chat";

const MessageItem = ({ 
  avatarSrc = "/castle.jpg", 
  nameFriend = "NameFriends",
  idFriend = "#1",
  timeMessage = "04:20",
  contentMessage = "Hello, how are you?",
  isActive = false,
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
        <span className={styles.senderName}>{nameFriend}</span>
        <span className={styles.messageTime}>{timeMessage}</span>
      </div>
      <div className={styles.messaheBottom}>
        <div className={styles.lastMessage}>
          {contentMessage}
        </div>
        <span className={styles.messageTime}>Read</span>
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

  // const handleContainerClick = () => {
  //   setIsCompressed(!isCompressed);
  // };
  // При нажатии на блок чата 20%
  const handleMessageClick = (message) => {
    setIsCompressed(!isCompressed);
    setCurrentFriend({
      idFriend: message.idFriend,
      nameFriend: message.nameFriend,
      avatarSrc: message.avatarSrc
    });
    setShowChat(true);
    setIsCompressed(true); // Устанавливаем флаг сжатия
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setCurrentFriend(null);
    setIsCompressed(false);
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/chat/chatChecker', {
          credentials: 'include' // Отправляем куки с запросом
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
  
        const data = await response.json();
        setMessages(data.messages || []);
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
          <div className={styles.newChatContainer}>
          <span href="#"className={styles.chatText}>Начать новый чат с друзьми +</span>
          </div>
          {messages.length > 0 ? (
            messages.map(message => (
              <MessageItem
                key={message.idFriend}
                avatarSrc={message.avatarSrc}
                nameFriend={message.nameFriend}
                idFriend={message.idFriend}
                timeMessage={message.timeMessage}
                contentMessage={message.contentMessage}
                isActive={isCompressed}
                onClick={() => {
                  handleMessageClick(message);
                  setCurrentChatId(message.chatId); // Сохраняем chatId при клике
                }}
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
    </div>
  );
}