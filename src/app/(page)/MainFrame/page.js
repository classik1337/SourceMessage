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
        
        // Используем информацию о звонящем из события напрямую
      setIncomingCall({
        offer,
        callerId,
        callType,
          socket,
        callerInfo: {
            name: callerInfo?.secondlogin || 'Unknown',
            avatar: callerInfo?.avatar || '/default-avatar.jpg'
        }
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

      if (response.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const myId = profile.id;

  return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.left_Container}>
            <div className={styles.left_head_container}>
              <div className={styles.logo_container}></div>
            </div>
            <div className={styles.left_main_container}>
              <div className={styles.left_main}>
                <div className={styles.ctas}>
                  <a className={styles.primary} href="#" onClick={handleOpenFriends}>
                    Friends
                  </a>
                  <a className={styles.primary} href="#" onClick={handleOpenChats}>
                    Chat
                  </a>
                  <a href="#" className={styles.primary}>
                    Server
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.right_Container}>
            <div className={styles.right_head_container}>
              <div className={styles.search_container}>
                <input type="text" placeholder="Поиск..." className={styles.search_input}/>
              </div>
              <div className={styles.profile_menu}>
                <button className={styles.profile_button}>
                  <Image
                  className={styles.profile_avatar}
                  src={profile.avatar}
                  alt="Profile avatar"
                  width={32}
                  height={32}
                  />
                <span className={styles.profile_name}>{profile.secondlogin}</span>
                </button>
                <div className={styles.dropdown_menu}>
                  <a href="#" onClick={handleOpenProfile} className={styles.menu_item}>Настройки</a>
                  <a href="#" onClick={handleLogout} className={styles.menu_item}>Выйти</a>
                </div>
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