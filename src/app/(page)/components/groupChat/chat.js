"use client"
import Image from "next/image"
import styles from "../friendChat/page.module.css"
import { useState, useRef, useEffect } from "react";
import { useSocket } from '../context/SocketContext/SocketContext';
import AddToChatModal from '../AddToChatModal/AddToChatModal';
import GroupSettingsModal from '../GroupSettingsModal/GroupSettingsModal';

export default function GroupChat({ nameFriend: initialName, avatarSrc: initialAvatar, onClose, chatId }) {
  // Состояния
  const [groupName, setGroupName] = useState(initialName);
  const [groupAvatar, setGroupAvatar] = useState(initialAvatar);
  const [profile, setProfile] = useState({ id: '', avatar: "", secondlogin: "" });
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [attachedFilePreviews, setAttachedFilePreviews] = useState([]);
  const [showAddToChatModal, setShowAddToChatModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userRole, setUserRole] = useState('member');
  
  const socket = useSocket();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const userData = await response.json();
        setProfile({ id: userData.id, avatar: userData.avatar, secondlogin: userData.secondlogin });
      } catch (error) {
        console.error('Profile load error:', error);
        setError('Failed to load profile data');
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!chatId) return;
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/chat/getRole?chatId=${chatId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user role');
        const data = await response.json();
        setUserRole(data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    fetchUserRole();
  }, [chatId]);

  useEffect(() => {
    if (!profile.id || !chatId) return;
    const fetchMessages = async () => {
      // Здесь должна быть логика загрузки сообщений для ГРУППОВОГО чата
      // Например: `/api/chat/groupMessages?chatId=${chatId}`
      // Пока что будет пустой массив
      setMessages([]); 
    };
    fetchMessages();
  }, [profile.id, chatId]);

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

  const sendMessage = async (text, type = 'text', fileData = null) => {
    if (!text && !fileData) return;
    
    const newMessage = {
      id: Date.now(),
      sender_id: profile.id,
      sender_name: profile.secondlogin,
      content: text,
      sent_at: new Date().toISOString(),
      type: type,
      avatar: profile.avatar
    };
    setMessages(prev => [...prev, newMessage]);

    if (type === 'text') {
      setMessageText('');
    }
  };

  const handleSaveSettings = async ({ name, avatarFile }) => {
    const formData = new FormData();
    formData.append('chatId', chatId);
    
    let nameChanged = false;
    let avatarChanged = false;

    if (name !== groupName) {
      formData.append('name', name);
      nameChanged = true;
    }
    if (avatarFile) {
      formData.append('avatar', avatarFile);
      avatarChanged = true;
    }

    if (!nameChanged && !avatarChanged) return;

    const token = localStorage.getItem('token');
    const response = await fetch('/api/chat/updateGroup', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update group settings');
    }

    const result = await response.json();

    if (result.newName) setGroupName(result.newName);
    if (result.newAvatarUrl) setGroupAvatar(result.newAvatarUrl);
    
    let systemMessage = `${profile.secondlogin}`;
    if (result.nameChanged && result.avatarChanged) {
        systemMessage += ' сменил(а) название и аватар группы.';
    } else if (result.nameChanged) {
        systemMessage += ` сменил(а) название группы на "${result.newName}".`;
    } else if (result.avatarChanged) {
        systemMessage += ' сменил(а) аватар группы.';
    }
    sendMessage(systemMessage, 'system');
  };

  const handleFileChange = (event) => {
    // Логика добавления файлов
  };

  const removeAttachedFile = (index) => {
    // Логика удаления файлов
  };

  if (error) {
    return <div className={styles.rightFriendChat}><div className={styles.errorMessage}>{error}</div></div>;
  }
  
  return (
    <>
      <div className={`${styles.rightFriendChat} ${styles.friendChat}`}>
        <div className={styles.headFriendChat}>
          <div className={styles.infoFriend}>
              <div className={styles.avatarFriendContiner} style={{ cursor: 'pointer' }}>
                <Image className={styles.avatarFriend} src={groupAvatar || '/group.svg'} alt="Аватар группы" width={30} height={30} priority />
              </div>
              <div className={styles.usernameFriend} style={{ cursor: 'pointer' }}>{groupName}</div>
          </div>
          <div className={styles.clickIconsHelp}>
            <div className={styles.menu_icon} onClick={() => setShowSettingsModal(true)} role="button" aria-label="Настройки группы">
              <Image className={styles.iconFriend} src="/settings-icon.svg" alt="Настройки" width={30} height={30} priority />
            </div>
            <div className={styles.menu_icon} onClick={() => setShowAddToChatModal(true)} role="button" aria-label="Добавить участников">
              <Image className={styles.iconFriend} src="/add-to-chat-icon.svg" alt="Добавить в чат" width={30} height={30} priority />
            </div>
            <div className={styles.menu_icon}>
              <button onClick={onClose} className={styles.closeButton}>×</button>
            </div>
          </div>
        </div>

        <div className={styles.mainChat}>
          <div className={styles.mainChatContiner}>
            <div className={styles.noMessages}>Сообщения в группе скоро появятся!</div>
            <div ref={messagesEndRef} />
          </div>
        </div>
      
        <div className={styles.inputArea}>
          {attachedFiles.length > 0 && (
            <div className={styles.attachedFileContainer}>
              {/* Рендер превью файлов */}
            </div>
          )}
          <div className={styles.bottomFriendChat}>
            <button type="button" className={styles.addButton} onClick={() => fileInputRef.current.click()}>
               <Image className={styles.svgPic} src="/plus-circle.svg" alt="Добавить" width={30} height={30} priority />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} multiple />
            <textarea
              ref={textareaRef}
              className={styles.inputMessage}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Написать сообщение в группу..."
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
        <AddToChatModal onClose={() => setShowAddToChatModal(false)} chatId={chatId} />
      )}
      
      {showSettingsModal && (
        <GroupSettingsModal
          chatId={chatId}
          currentName={groupName}
          currentAvatar={groupAvatar}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
          userRole={userRole}
        />
      )}
    </>
  );
}