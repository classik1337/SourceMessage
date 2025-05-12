"use client"
import Image from "next/image"
import styles from "./page.module.css"
import { useState, useRef, useEffect } from "react";



export default function FriendChat({ idFriend, nameFriend, avatarSrc, onClose, chatId }) {
  const [profile, setProfile] = useState({ id: '', avatar: "", secondlogin: "", });
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const socketRef = useRef(null);
console.log(idFriend, nameFriend, avatarSrc, onClose, chatId)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const userData = await response.json();
        setProfile({
          id: userData.id,
          avatar: userData.avatar,
          secondlogin: userData.secondlogin
        });
      } catch (error) {
        console.error('Profile load error:', error);
        setError('Failed to load profile data');
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!profile.id || !idFriend) return;
    
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/chat/chatMain?myId=${profile.id}&friendId=${idFriend}`,
          {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            credentials: 'include'
          }
        );

        if (!response.ok) {
          throw new Error('Ошибка загрузки сообщений');
        }
        
        const data = await response.json();
        
        if (!data.messages) {
          throw new Error('Некорректный формат ответа от сервера');
        }

        const formattedMessages = data.messages.map(msg => ({
          id: msg.id,
          text: msg.content,
          time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMine: msg.sender_id === profile.id,
          isRead: msg.is_read
        }));
        
        setMessages(formattedMessages);
      } catch (err) {
        console.error('Ошибка:', err);
        setError('Не удалось загрузить сообщения');
      }
    };
    
    fetchMessages();
  }, [profile.id, idFriend.idFriend]);




  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const users = {
    me: {
      id: profile.id,
      name: profile.secondlogin,
      avatar: profile.avatar
    },
    friend: {
      id: idFriend.idFriend,
      name: nameFriend,
      avatar: avatarSrc
    }
  };

  if (error) {
    return (
      <div className={styles.rightFriendChat}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }





  
  const sendMessage = async () => {
    if (!messageText.trim()) return; // Не отправляем пустые сообщения
    
    try {
      // 1. Создаем временное сообщение (для мгновенного отображения)
      const tempMessage = {
        id: Date.now(), // Временный ID
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        isRead: false
      };
      
      setMessages(prev => [tempMessage, ...prev ]);
      setMessageText(''); // Очищаем input
      
      // 2. Отправляем на сервер
      const response = await fetch('/api/chat/chatSender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: messageText,
          senderId: profile.id, // отправитель
          receiverId: idFriend //получатель
        })
      });
      console.log(messageText,profile.id,idFriend)
      if (!response.ok) throw new Error('Ошибка отправки1');
      

      
    } catch (error) {
      console.error('Ошибка отправки2:', error);
      // Удаляем временное сообщение при ошибке
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setMessageText(tempMessage.text); // Возвращаем текст в input
    }
  };


// Функция для обновления статуса прочтения сообщений
const markMessagesAsRead = async () => {
  try {
    // Получаем непрочитанные сообщения от друга
    const unreadMessages = messages.filter(
      msg => !msg.isMine && !msg.isRead
    );

    if (unreadMessages.length === 0) return;

    // Подготавливаем данные для запроса
    const messageIds = unreadMessages.map(msg => msg.id);
    const requestData = {
      chatId: chatId, // Должен быть получен из состояния
      messageIds,
      userId: profile.id
    };

    // Отправляем запрос на сервер
    const response = await fetch('/api/chat/markAsRead', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error('Ошибка обновления статуса сообщений');
    }

    // Обновляем локальное состояние
    setMessages(prev => prev.map(msg => 
      messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
    ));

  } catch (err) {
    console.error('Ошибка при обновлении статуса прочтения:', err);
  }
};

// Используем этот эффект для вызова функции при монтировании и изменении сообщений
useEffect(() => {
  if (messages.length > 0 && idFriend.idFriend) {
    markMessagesAsRead();
  }
}, [messages, idFriend.idFriend]);



  


markMessagesAsRead();
  return (
    <div className={styles.rightFriendChat}>
      <div className={styles.userFriendChat}>
        <div className={styles.headFriendChat}>
          <div className={styles.infoFriend}>
            <div className={styles.avatarFriendContiner}>
              <Image
                className={styles.avatarFriend}
                src={avatarSrc}
                alt="Аватар"
                width={30}
                height={30}
                priority
              />
            </div>
            <div className={styles.usernameFriend}>{nameFriend}</div>
          </div>
          <div className={styles.clickIconsHelp}>
            <div className={styles.menu_icon}>
              <Image
                className={styles.iconFriend}
                src="/phone.svg"
                alt="Телефон"
                width={30}
                height={30}
                priority
              />
            </div>
            <div className={styles.menu_icon}>
              <Image
                className={styles.iconFriend}
                src="/phone.svg"
                alt="Видеозвонок"
                width={30}
                height={30}
                priority
              />
            </div>
            <div className={styles.menu_icon}>
              <Image
                className={styles.iconFriend}
                src="/more-vertical.svg"
                alt="Меню"
                width={30}
                height={30}
                priority
              />
            </div>
            <div className={styles.menu_icon}>
              <button onClick={onClose} className={styles.closeButton}>×</button>
            </div>
          </div>
        </div>

        <div className={styles.mainChat}>
        {messages.length > 0 ? (
        [...messages].reverse().map((message) => {
        const user = message.isMine ? users.me : users.friend;
              
              return message.isMine ? (
                <div key={message.id} className={`${styles.message} ${styles.rightMessage}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.messageUsername}>{user.name}</div>
                    <div className={styles.messageContentContainer}>
                      <div className={styles.messageText}>{message.text}</div>
                      <span className={styles.messageDate}>{message.time}</span>
                      {message.isRead && (
                        <Image
                          className={styles.messageCheck}
                          src="/check.svg" 
                          alt="Прочитано"
                          width={15}
                          height={15}
                          priority
                        />
                      )}
                    </div>
                  </div>
                  <Image
                    className={styles.avatar}
                    src={user.avatar}
                    alt="Аватар"
                    width={30}
                    height={30}
                    priority
                  />
                </div>
              ) : (
                <div key={message.id} className={`${styles.message} ${styles.leftMessage}`}>
                  <Image
                    className={styles.avatar}
                    src={user.avatar}
                    alt="Аватар"
                    width={30}
                    height={30}
                    priority
                  />
                  <div className={styles.messageContent}>
                    <div className={styles.messageUsername}>{user.name}</div>
                    <div className={styles.messageContentContainer}>
                      <div className={styles.messageText}>{message.text}</div>
                      <span className={styles.messageDate}>{message.time}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noMessages}>Нет сообщений</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.bottomFriendChat}>
          <a href="#" className={styles.addButton}>
            <Image
              className={styles.svgPic}
              src="/plus-circle.svg"
              alt="Добавить"
              width={30}
              height={30}
              priority
            />
          </a>
          <input 
             className={styles.inputMessage}
             placeholder="Напишите сообщение..."
             value={messageText}
             onChange={(e) => setMessageText(e.target.value)}
             onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <a href="#" onClick={sendMessage} className={styles.sendButton}>
            <Image
              className={styles.svgPic}
              src="/arrow-right-circle.svg"
              alt="Отправить"
              width={30}
              height={30}
              priority
            />
          </a>
        </div>
      </div>
    </div>
  );
}