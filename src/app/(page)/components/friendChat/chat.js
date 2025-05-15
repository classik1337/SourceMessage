"use client"
import Image from "next/image"
import styles from "./page.module.css"
import { useState, useRef, useEffect } from "react";
import CallFriend from "../callFriend/CallFriend";
import { useSocket } from '../context/SocketContext/SocketContext';
import { useCall } from '../context/CallContext/CallContext';
import FriendInfoModal from '../FriendInfoModal/FriendInfoModal';

export default function FriendChat({ idFriend, nameFriend, avatarSrc, onClose, chatId }) {
  // Состояния
  const [profile, setProfile] = useState({ id: '', avatar: "", secondlogin: "" });
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState(null);
  const [showFriendInfo, setShowFriendInfo] = useState(false);
  
  const socket = useSocket();
  const { activeCall, setActiveCall } = useCall();

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

        if (!response.ok) throw new Error('Ошибка загрузки сообщений');
        
        const data = await response.json();
        
        // Проверяем наличие сообщений, если их нет - устанавливаем пустой массив
        const messages = data.messages || [];

        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          text: msg.content,
          time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMine: msg.sender_id === profile.id,
          isRead: msg.is_read,
          chatId: msg.chat_id
        }));
        
        setMessages(formattedMessages);
      } catch (err) {
        console.error('Ошибка:', err);
        // В случае ошибки устанавливаем пустой массив сообщений вместо показа ошибки
        setMessages([]);
      }
    };
    
    fetchMessages();
  }, [profile.id, idFriend]);

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
      id: idFriend,
      name: nameFriend,
      avatar: avatarSrc
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      const tempMessage = {
        id: Date.now(),
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        isRead: false
      };
      
      // Добавляем сообщение в начало массива
      setMessages(prev => [tempMessage, ...prev]);
      setMessageText('');
      
      const response = await fetch('/api/chat/chatSender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: messageText,
          senderId: profile.id,
          receiverId: idFriend,
          chatId: chatId // Добавляем chatId если он есть
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка отправки');
      }

      // Получаем обновленные данные от сервера
      const data = await response.json();
      
      // Обновляем сообщение с данными с сервера
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? {
              ...msg,
              id: data.messageId, // Используем ID с сервера
              chatId: data.chatId // Обновляем chatId
            }
          : msg
      ));

    } catch (error) {
      console.error('Ошибка отправки:', error);
      // Удаляем временное сообщение в случае ошибки
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage?.id));
      if (tempMessage) setMessageText(tempMessage.text);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const unreadMessages = messages.filter(msg => !msg.isMine && !msg.isRead);
      if (unreadMessages.length === 0) return;

      const messageIds = unreadMessages.map(msg => msg.id);
      
      // Проверяем наличие chatId
      if (!chatId) return;

      const response = await fetch('/api/chat/markAsRead', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          chatId: chatId,
          messageIds,
          userId: profile.id
        })
      });

      if (!response.ok) throw new Error('Ошибка обновления статуса');
      
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
      ));
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
    }
  };

  useEffect(() => {
    if (messages.length > 0 && idFriend) {
      markMessagesAsRead();
    }
  }, [messages, idFriend]);

  // Следим за активным звонком
  useEffect(() => {
    console.log('FriendChat: Active call changed:', activeCall);
    
    if (activeCall) {
      // Если это входящий звонок и он от текущего друга
      if (activeCall.isIncoming && activeCall.friendInfo.id === idFriend) {
        console.log('FriendChat: Activating incoming call view');
        setIsCallActive(true);
        setCallType(activeCall.callType);
      }
      // Если это исходящий звонок к текущему другу
      else if (activeCall.targetId === idFriend) {
        console.log('FriendChat: Activating outgoing call view');
        setIsCallActive(true);
        setCallType(activeCall.callType);
      }
    } else {
      console.log('FriendChat: Deactivating call view');
      setIsCallActive(false);
      setCallType(null);
    }
  }, [activeCall, idFriend]);

  if (error) {
    return (
      <div className={styles.rightFriendChat}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  const handleCallStart = async (type) => {
    if (!socket || !profile.id) return;

    try {
      console.log('Starting call:', { type, targetId: idFriend });
      setIsCallActive(true);
      setCallType(type);

      // Создаем RTCPeerConnection и получаем offer
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });

      // Получаем медиа поток
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });

      // Добавляем треки в peer connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Создаем offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Отправляем событие начала звонка
      socket.emit('call-initiate', {
        targetUserId: idFriend,
        offer: offer,
        callerId: profile.id,
        callType: type
      });

      // Инициализируем состояние звонка
      setActiveCall({
        callerId: profile.id,
        targetId: idFriend,
        callType: type,
        status: 'calling',
        socket,
        peerConnection: pc,
        localStream: stream
      });

    } catch (error) {
      console.error('Error starting call:', error);
      setIsCallActive(false);
      setCallType(null);
    }
  };

  // Обработчик завершения звонка
  const handleCallEnd = () => {
    console.log('FriendChat: Call ended');
    setIsCallActive(false);
    setCallType(null);
  };
  
  return (
    <>
      <div className={`${styles.rightFriendChat} ${styles.friendChat}`}>
        {!isCallActive && (
          <div className={styles.headFriendChat}>
            <div className={styles.infoFriend}>
              <div 
                className={styles.avatarFriendContiner}
                onClick={() => setShowFriendInfo(true)}
                style={{ cursor: 'pointer' }}
              >
                <Image
                  className={styles.avatarFriend}
                  src={avatarSrc}
                  alt="Аватар"
                  width={30}
                  height={30}
                  priority
                />
              </div>
              <div 
                className={styles.usernameFriend}
                onClick={() => setShowFriendInfo(true)}
                style={{ cursor: 'pointer' }}
              >
                {nameFriend}
              </div>
            </div>
            <div className={styles.clickIconsHelp}>
              <div 
                className={styles.menu_icon} 
                onClick={() => handleCallStart('audio')}
                role="button"
                aria-label="Аудиозвонок"
              >
                <Image
                  className={styles.iconFriend}
                  src="/phone.svg"
                  alt="Телефон"
                  width={30}
                  height={30}
                  priority
                />
              </div>
              <div 
                className={styles.menu_icon} 
                onClick={() => handleCallStart('video')}
                role="button"
                aria-label="Видеозвонок"
              >
                <Image
                  className={styles.iconFriend}
                  src="/video.svg"
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
        )}

        <div className={`${styles.mainChat} ${isCallActive ? styles.callActive : ''}`}>
          {isCallActive && (
            <div className={styles.callSection}>
              <CallFriend 
                profile={profile}
                idFriend={idFriend}
                avatarSrc={avatarSrc}
                onEndCall={handleCallEnd}
                isIncoming={activeCall?.isIncoming}
                offer={activeCall?.offer}
              />
            </div>
          )}
          <div className={styles.mainChatContiner}>
            <>
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
                              src="/double-check-icon.svg" 
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
                <div className={styles.noMessages}>Начните общение прямо сейчас</div>
              )}
              <div ref={messagesEndRef} />
            </>
          </div>
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

      {showFriendInfo && (
        <FriendInfoModal
          friend={{
            idFriend,
            nameFriend,
            avatarSrc,
            secondName: nameFriend.toLowerCase().replace(/\s+/g, '_'),
            about: 'MILFhunter',
            joinDate: '9 дек. 2017 г.'
          }}
          onClose={() => setShowFriendInfo(false)}
        />
      )}
    </>
  );
}