"use client"
import Image from "next/image"
import styles from "./page.module.css"
import { useState, useRef, useEffect } from "react";
import CallFriend from "../callFriend/CallFriend";
import { useSocket } from '../context/SocketContext/SocketContext';
import { useCall } from '../context/CallContext/CallContext';
import FriendInfoModal from '../FriendInfoModal/FriendInfoModal';
import AddToChatModal from '../AddToChatModal/AddToChatModal';
import ImageModal from './ImageModal';
import CustomAudioPlayer from './CustomAudioPlayer';

export default function FriendChat({ idFriend, nameFriend, avatarSrc, onClose, chatId }) {
  // Состояния
  const [profile, setProfile] = useState({ id: '', avatar: "", secondlogin: "" });
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [attachedFilePreviews, setAttachedFilePreviews] = useState([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState(null);
  const [showFriendInfo, setShowFriendInfo] = useState(false);
  const [showAddToChatModal, setShowAddToChatModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const socket = useSocket();
  const { activeCall, setActiveCall } = useCall();

  // Функция для форматирования размера файла
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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

        const formattedMessages = messages.map(msg => {
          return {
            id: msg.id,
            text: msg.content, // Может быть null для сообщений только с файлами
            time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMine: msg.sender_id === profile.id,
            isRead: msg.is_read,
            chatId: msg.chat_id,
            type: msg.type || 'text',
            files: msg.files || [] // Массив файлов
          };
        });
        
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '20px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [messageText]);

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
    if ((!messageText.trim() && attachedFiles.length === 0) || !socket) return;
  
    const tempId = 'temp-' + Date.now();
    
    // Создаем временное сообщение для немедленного отображения в UI
    const tempMessage = {
      id: tempId,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      isRead: false,
      chatId: chatId,
      type: attachedFiles.length > 0 ? 'collection' : 'text',
      files: attachedFilePreviews.map(p => ({
        content: p.src, // Временный URL для превью
        fileName: p.name,
        fileType: p.type,
        fileSize: p.size
      }))
    };
    
    // Оптимистичное обновление UI
    setMessages(prev => [tempMessage, ...prev]);
    setMessageText('');
    setAttachedFiles([]);
    setAttachedFilePreviews([]);

    try {
      // 1. Собираем FormData
      const formData = new FormData();
      formData.append('senderId', profile.id);
      formData.append('receiverId', idFriend);
      formData.append('chatId', chatId);
      formData.append('text', messageText);
      attachedFiles.forEach(file => {
        formData.append('files', file);
      });

      // 2. Отправляем на новый бэкенд
      const response = await fetch('/api/chat/chatSender', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка отправки');
      }

      const data = await response.json();
      
      // 3. Обновляем временное сообщение реальными данными с сервера
      setMessages(prev => {
        // Удаляем все временные сообщения и все сообщения с этим id
        const filtered = prev.filter(
          msg => !String(msg.id).startsWith('temp-') && msg.id !== data.messageId
        );
        // Если уже есть настоящее сообщение с таким id, не добавляем дубликат
        if (filtered.some(msg => msg.id === data.messageId)) return filtered;
        return [{
          ...tempMessage,
          id: data.messageId,
          chatId: data.chatId,
          files: data.files.map(f => ({
            content: f.path,
            fileName: f.name,
            fileType: f.type,
            fileSize: f.size
          }))
        }, ...filtered];
      });

      // 4. Отправляем сообщение через сокет
      socket.emit('send-message', {
        chatId: data.chatId,
        receiverId: idFriend,
        message: {
          id: data.messageId,
          sender_id: profile.id,
          content: data.text,
          type: data.files.length > 0 ? 'collection' : 'text',
          files: data.files,
          sent_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Ошибка отправки:', error);
      // Откатываем UI в случае ошибки
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      // (Опционально) можно вернуть текст и файлы в поля ввода
    }
  };

  // Добавляем обработчик для подтверждения отправки сообщения
  useEffect(() => {
    if (!socket) return;

    const handleMessageSent = (data) => {
      console.log('Сообщение успешно отправлено:', data);
    };

    const handleMessageError = (error) => {
      console.error('Ошибка отправки сообщения:', error);
      setError('Ошибка отправки сообщения');
    };

    socket.on('message-sent', handleMessageSent);
    socket.on('message-error', handleMessageError);

    return () => {
      socket.off('message-sent', handleMessageSent);
      socket.off('message-error', handleMessageError);
    };
  }, [socket]);

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

  // Вспомогательная функция для приведения сообщения к нужному формату
  function formatMessage(msg) {
    return {
      id: msg.id,
      text: msg.text ?? msg.content ?? '',
      time: msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      isMine: msg.sender_id === profile.id,
      isRead: false,
      chatId: msg.chat_id,
      type: msg.type || 'text',
      files: msg.files || []
    };
  }

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (data) => {
      if (!data || !data.message) return;
      if (String(data.message.chat_id) !== String(chatId)) return;
      setMessages(prev => {
        // Удаляем все временные сообщения и все сообщения с этим id
        const filtered = prev.filter(
          msg => !String(msg.id).startsWith('temp-') && msg.id !== data.message.id
        );
        // Если уже есть настоящее сообщение с таким id, не добавляем дубликат
        if (filtered.some(msg => msg.id === data.message.id)) return filtered;
        return [formatMessage(data.message), ...filtered];
      });
    };
    socket.on('new-message', handleNewMessage);
    return () => socket.off('new-message', handleNewMessage);
  }, [socket, profile.id, chatId]);

  // Добавляем эффект для автоматической отметки сообщений как прочитанных
  useEffect(() => {
    if (messages.length > 0 && idFriend) {
      const unreadMessages = messages.filter(msg => !msg.isMine && !msg.isRead);
      if (unreadMessages.length > 0) {
        markMessagesAsRead();
      }
    }
  }, [messages, idFriend]);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    if (attachedFiles.length + files.length > 10) {
      alert('Можно прикрепить не более 10 файлов за раз.');
      return;
    }

    const newFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) { // 25MB
        alert(`Файл "${file.name}" слишком большой! Максимальный размер 25МБ.`);
        continue; // Пропускаем этот файл
      }
      
      newFiles.push(file);
      
      const preview = {
        name: file.name,
        size: file.size,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      };

      if (preview.type === 'image') {
        preview.src = URL.createObjectURL(file);
      }
      
      newPreviews.push(preview);
    }

    setAttachedFiles(prev => [...prev, ...newFiles]);
    setAttachedFilePreviews(prev => [...prev, ...newPreviews]);

    // Очищаем значение инпута, чтобы можно было выбрать те же файлы снова
    event.target.value = null; 
  };

  const removeAttachedFile = (indexToRemove) => {
    const previewToRemove = attachedFilePreviews[indexToRemove];
    if (previewToRemove.type === 'image' && previewToRemove.src) {
      URL.revokeObjectURL(previewToRemove.src);
    }
    
    setAttachedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setAttachedFilePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    formData.append('senderId', profile.id);
    formData.append('receiverId', idFriend);

    try {
      const response = await fetch('/api/chat/uploadFile', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка загрузки файла');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      setError('Не удалось загрузить файл.');
      throw error; // Пробрасываем ошибку, чтобы остановить отправку сообщения
    }
  };

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
            <div 
              className={styles.menu_icon}
              onClick={() => setShowAddToChatModal(true)}
              role="button"
              aria-label="Добавить участников"
            >
              <Image
                className={styles.iconFriend}
                src="/add-to-chat-icon.svg"
                alt="Добавить в чат"
                width={30}
                height={30}
                priority
              />
            </div>
            <div 
              className={styles.menu_icon}
              onClick={() => {/* Добавить обработчик закрепления профиля */}}
              role="button"
              aria-label="Закрепить профиль"
            >
              <Image
                className={styles.iconFriend}
                src="/pin-profile-icon.svg"
                alt="Закрепить профиль"
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
              
              const renderMessageContent = () => {
                if (message.type === 'collection') {
                  return (
                    <div className={styles.collectionContainer}>
                      <div className={styles.mediaGrid}>
                        {message.files.map((file, index) => {
                          if (file.fileType && file.fileType.startsWith('image/')) {
                            return (
                              <div key={index} className={styles.mediaGridItem}>
                                <Image
                                  src={file.content}
                                  alt={file.fileName}
                                  layout="fill"
                                  objectFit="cover"
                                  className={styles.gridImage}
                                  onClick={() => setSelectedImage({ src: file.content, fileName: file.fileName, time: message.time, fileSize: file.fileSize })}
                                />
                              </div>
                            );
                          } else if (file.fileType && file.fileType.startsWith('video/')) {
                            return (
                              <div key={index} className={styles.mediaGridItem}>
                                <video src={file.content} controls className={styles.gridVideo} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                              </div>
                            );
                          } else if (file.fileType && file.fileType.startsWith('audio/')) {
                            return (
                              <div key={index} className={styles.mediaGridItem}>
                                <audio src={file.content} controls className={styles.gridAudio} style={{ width: '100%' }} />
                              </div>
                            );
                          } else {
                            return (
                              <div key={index} className={styles.mediaGridItem}>
                                <a href={file.content} download className={styles.gridFile} target="_blank" rel="noopener noreferrer">
                                  <Image src="/file.svg" alt="file icon" width={24} height={24} />
                                  <span className={styles.gridFileName}>{file.fileName || 'Скачать файл'}</span>
                                </a>
                              </div>
                            );
                          }
                        })}
                      </div>
                      {message.text && message.text.trim() && (
                        <div className={styles.messageText}>{message.text}</div>
                      )}
                    </div>
                  );
                }

                // Старая логика для одиночных файлов (обратная совместимость)
                if (message.type === 'file' || message.type === 'image' || message.type === 'video' || message.type === 'audio') {
                  const file = {
                    content: message.text,
                    fileName: message.fileName,
                    fileType: message.type === 'file' ? 'application/octet-stream' : `${message.type}/`,
                    fileSize: message.fileSize
                  };
                  if (file.fileType.startsWith('image/')) {
                    return (
                      <div className={styles.imageMessage}>
                        <img 
                          src={file.content} 
                          alt={file.fileName || 'Изображение'} 
                          className={styles.messageImage}
                          onClick={() => setSelectedImage({ src: file.content, fileName: file.fileName, time: message.time, fileSize: file.fileSize })}
                        />
                        <div className={styles.imageFileName}>{file.fileName}</div>
                      </div>
                    );
                  } else if (file.fileType.startsWith('video/')) {
                    return (
                      <div className={styles.videoMessage}>
                        <video src={file.content} controls className={styles.messageVideo} preload="metadata" />
                        <div className={styles.mediaFileName}>{file.fileName}</div>
                      </div>
                    );
                  } else if (file.fileType.startsWith('audio/')) {
                    return (
                      <div className={styles.audioMessage}>
                        <audio src={file.content} controls className={styles.messageAudio} />
                      </div>
                    );
                  } else {
                    return (
                      <div className={styles.fileMessage}>
                        <a href={file.content} target="_blank" rel="noopener noreferrer" className={styles.fileLink} download>
                          <Image src="/file.svg" alt="file icon" width={20} height={20} />
                          <div className={styles.fileInfo}>
                            <span className={styles.fileName}>{file.fileName || 'Скачать файл'}</span>
                            {file.fileSize && (
                              <span className={styles.fileSize}>{formatFileSize(file.fileSize)}</span>
                            )}
                          </div>
                        </a>
                      </div>
                    );
                  }
                }

                return <div className={styles.messageText}>{message.text}</div>;
              };

              return message.isMine ? (
                <div key={message.id} className={`${styles.message} ${styles.rightMessage}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.messageUsername}>{user.name}</div>
                    <div className={styles.messageContentContainer}>
                      <div className={styles.lastMessage}>
                        {renderMessageContent()}
                        <span className={styles.messageDate}>{message.time}</span>
                        {message.isRead ? (
                          <Image
                            className={styles.messageCheck}
                            src="/double-check-icon.svg"
                            alt="Прочитано"
                            width={16}
                            height={16}
                            priority
                          />
                        ) : (
                          <Image
                            className={styles.unreadCheck}
                            src="/single-check-icon.svg"
                            alt="Не прочитано"
                            width={16}
                            height={16}
                            priority
                          />
                        )}
                      </div>
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
                      <div className={styles.lastMessage}>
                        {renderMessageContent()}
                        <span className={styles.messageDate}>{message.time}</span>
                      </div>
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
      
      <div className={styles.inputArea}>
        {attachedFiles.length > 0 && (
          <div className={styles.attachedFileContainer}>
            {attachedFilePreviews.map((preview, index) => (
              <div key={index} className={styles.filePreviewItem}>
                {preview.type === 'image' ? (
                  <div className={styles.imagePreviewContainer}>
                    <Image 
                      src={preview.src} 
                      alt="Preview" 
                      layout="fill"
                      objectFit="cover"
                      className={styles.imagePreview} 
                    />
                  </div>
                ) : (
                  <div className={styles.genericFilePreview}>
                    <Image src="/file.svg" alt="file icon" width={24} height={24} />
                    <span className={styles.attachedFileName}>{preview.name}</span>
                  </div>
                )}
                <button 
                  className={styles.removeAttachedFileButton} 
                  onClick={() => removeAttachedFile(index)}
                >
                  <Image src="/close-icon.svg" alt="remove file" width={12} height={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className={styles.bottomFriendChat}>
          <button type="button" className={styles.addButton} onClick={() => fileInputRef.current.click()}>
             <Image
               className={styles.svgPic}
               src="/plus-circle.svg"
               alt="Добавить"
               width={30}
               height={30}
               priority
             />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            style={{ display: 'none' }} 
            multiple
          />
          <textarea
            ref={textareaRef}
            className={styles.inputMessage}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Написать сообщение..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
          />
          <button className={styles.sendButton} onClick={sendMessage}>
            <img className={styles.svgPic} src="/message-icon.svg" alt="send" />
          </button>
        </div>
      </div>
    </div>
      
      {showAddToChatModal && (
        <AddToChatModal onClose={() => setShowAddToChatModal(false)} idFriend={idFriend} />
      )}

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

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}