"use client"
import Image from "next/image";
import styles from "./page.module.css";
import Profile from "../Profile/page";
import Friends from "../Friends/page";
import Chat from "../Chat/page";
import { useRouter } from 'next/navigation'; 
import { useState , useEffect} from 'react';
import { SocketProvider, useSocket } from "../components/context/SocketContext/SocketContext";
import { SessionProvider } from 'next-auth/react'
import IncomingCallModal from "../components/IncomingCallModal/IncomingCallModal";
import { CallProvider } from "../components/context/CallContext/CallContext";
import { useCall } from "../components/context/CallContext/CallContext";
import BellIcon from '../components/BellIcon';



function ProvidersWrapper({ children, userId }) {
  return (
    <SocketProvider userId={userId}>
      <CallProvider>
        {children}
      </CallProvider>
    </SocketProvider>
  );
}

// Обертка для провайдеров
function MainFrameWithProviders() {
  const [profile, setProfile] = useState({ id: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const userData = await response.json();
        setProfile({ id: userData.id });
      } catch (error) {
        console.error('Profile load error:', error);
      }
    };

    fetchProfile();
  }, []);

  if (!profile.id) return <div>Loading...</div>;

  return (
    <ProvidersWrapper userId={profile.id}>
      <MainFrameContent userId={profile.id} />
    </ProvidersWrapper>
  );
}

// Основной компонент с логикой
function MainFrameContent() {
  const socket = useSocket();
  const { setIncomingCall } = useCall();
  const router = useRouter();
  const [openProfile, setOpenProfile] = useState(false);
  const [openFriends, setOpenFriends] = useState(false);
  const [openChats, setOpenChat] = useState(false);
  const [profile, setProfile] = useState({
    id: '',
    secondlogin: '',
    avatar: '',
  });
  const [notificationCount, setNotificationCount] = useState(0);

  // Восстанавливаем состояние при загрузке
  useEffect(() => {
    // Получаем текущий URL
    const url = new URL(window.location.href);
    const module = url.searchParams.get('module');
    
    // Восстанавливаем состояние из URL параметра
    if (module) {
      switch(module) {
        case 'profile':
          setOpenProfile(true);
          setOpenFriends(false);
          setOpenChat(false);
          break;
        case 'friends':
          setOpenProfile(false);
          setOpenFriends(true);
          setOpenChat(false);
          break;
        case 'chats':
          setOpenProfile(false);
          setOpenFriends(false);
          setOpenChat(true);
          break;
      }
    } else {
      // Если нет параметра в URL, проверяем localStorage
      const savedModule = localStorage.getItem('lastOpenModule');
      if (savedModule) {
        switch(savedModule) {
          case 'profile':
            setOpenProfile(true);
            break;
          case 'friends':
            setOpenFriends(true);
            break;
          case 'chats':
            setOpenChat(true);
            break;
        }
      }
    }
  }, []);

  const updateModuleState = (module) => {
    // Сохраняем состояние в localStorage
    localStorage.setItem('lastOpenModule', module);
    // Обновляем URL
    router.push(`/MainFrame?module=${module}`, undefined, { shallow: true });
  };

  const handleOpenProfile = () => {
    setOpenProfile(true);
    setOpenChat(false);
    setOpenFriends(false);
    updateModuleState('profile');
  };
  
  const handleOpenFriends = () => {
    setOpenFriends(true);
    setOpenChat(false);
    setOpenProfile(false);
    updateModuleState('friends');
  };

  const handleOpenChats = () => {
    setOpenChat(true);
    setOpenFriends(false);
    setOpenProfile(false);
    updateModuleState('chats');
  };

  // Обработка входящего звонка
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = async ({ offer, callerId, callType, callerInfo }) => {
      try {
        console.log('Incoming call received:', { callerId, callType, callerInfo });
        // Используем всю информацию о звонящем из события напрямую
        setIncomingCall({
          offer,
          callerId,
          callType,
          socket,
          callerInfo: callerInfo || { name: 'Unknown', avatar: '/default-avatar.jpg' }
        });
      } catch (error) {
        console.error('Error handling incoming call:', error);
      }
    };

    socket.on('incoming-call', handleIncomingCall);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
    };
  }, [socket, setIncomingCall]);

 useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile')
        if (!response.ok) throw new Error('Failed to fetch profile')
        
        const userData = await response.json()
        setProfile(prev => ({
          id: userData.id,
          secondlogin: userData.secondlogin || 'User',
          avatar: userData.avatar || '/default-avatar.jpg'
        }))
      } catch (error) {
        console.error('Profile load error:', error)
      }
    }

    fetchProfile()
  }, [])
console.log(profile.id, "it is my id")

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Удаляем токен из localStorage
      localStorage.removeItem('token');

      if (response.ok) {
        router.push('/Regestration'); // редирект на страницу входа
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const myId = profile.id;

  // Проверка токена при монтировании MainFrameContent
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/Regestration');
    }
  }, []);

  return (
      <div className={styles.page}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <main className={styles.mainGlass}>
          <div className={styles.left_Container}>
            <div className={styles.left_head_container}>
              <div className={styles.logoBlock}>
                <svg className={styles.frogLogo} width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="19" cy="19" rx="16" ry="14" fill="#111" stroke="#00ff9f" strokeWidth="2.5"/>
                  <ellipse cx="13" cy="13" rx="3" ry="3.5" fill="#00ff9f" stroke="#00bfff" strokeWidth="1.2"/>
                  <ellipse cx="25" cy="13" rx="3" ry="3.5" fill="#00ff9f" stroke="#00bfff" strokeWidth="1.2"/>
                  <ellipse cx="19" cy="25" rx="7" ry="3.5" fill="#222" stroke="#00ff9f" strokeWidth="1.2"/>
                  <rect x="17.5" y="19" width="3" height="7" rx="1.2" fill="#00bfff" stroke="#00ff9f" strokeWidth="0.8"/>
                  <circle cx="19" cy="27.5" r="1.2" fill="#00ff9f"/>
                  <rect x="21.5" y="22" width="6" height="2.2" rx="1.1" fill="#00bfff" stroke="#00ff9f" strokeWidth="0.7"/>
                </svg>
                <span className={styles.logoText}>JabberJolt</span>
              </div>
            </div>
            <div className={styles.left_main_container}>
              <div className={styles.left_main}>
                <div className={styles.ctas}>
                  <a className={`${styles.primary} ${openFriends ? styles.active : ''}`} href="#" onClick={handleOpenFriends}>
                    Friends
                  </a>
                  <a className={`${styles.primary} ${openChats ? styles.active : ''}`} href="#" onClick={handleOpenChats}>
                    Chat
                  </a>
                  <a href="#" className={`${styles.primary} ${openProfile ? styles.active : ''}`}>
                    Server
                  </a>
                </div>
              </div>
            </div>
            <div className={styles.profileMenuBottom}>
              <div className={styles.profile_menu}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button className={styles.bellButton} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 0 }}>
                    <BellIcon color={notificationCount > 0 ? '#ff3b3b' : '#fff'} />
                    {notificationCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ff3b3b',
                        color: '#fff',
                        borderRadius: '50%',
                        fontSize: '12px',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        fontWeight: 700,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                      }}>{notificationCount}</span>
                    )}
                  </button>
                  <button className={styles.profile_button} onClick={handleOpenProfile}>
                    <Image
                      className={styles.profile_avatar}
                      src={profile.avatar}
                      alt="Profile avatar"
                      width={32}
                      height={32}
                    />
                    <span className={styles.profile_name}>{profile.secondlogin}</span>
                  </button>
                </div>
                <button className={styles.logout_button} onClick={handleLogout}>
                  Выйти
                </button>
              </div>
            </div>
          </div>
          <div className={styles.right_Container}>
            <div className={styles.right_head_container}>
              <div className={styles.search_container}>
                <input type="text" placeholder="Поиск..." className={styles.search_input}/>
              </div>
            </div>
            <div className={styles.main_right_container}>
            
              {openProfile && <Profile/>}
              {openFriends && <Friends/>}
              {openChats && <Chat/>}
            </div>
          </div>
        </main>
      </div>
  );
}

// Экспортируем обернутый компонент
export default function MainFrame() {
  return <MainFrameWithProviders />;
}