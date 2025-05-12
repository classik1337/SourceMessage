"use client"
import Image from "next/image";
import styles from "./page.module.css";
import Profile from "../Profile/page";
import Friends from "../Friends/page";
import Chat from "../Chat/page";
import { useRouter } from 'next/navigation'; 
import { useState } from 'react';



export default function MainFrame() {
  const [openProfile, setOpenProfile] = useState(false); // profile
  const [openFriends, setOpenFriends] = useState(false); // friends
  const [openChats, setOpenChat] = useState(false); // chat
  const handleOpenProfile = () => {
    setOpenProfile(true);
    setOpenChat(false);
    setOpenFriends(false); // Закрываем друзей при открытии профиля
  };
  
  const handleOpenFriends = () => {
    setOpenFriends(true);
    setOpenChat(false);
    setOpenProfile(false); // Закрываем профиль при открытии друзей
  };
  const handleOpenChats = () => {
    setOpenChat(true);
    setOpenFriends(false);
    setOpenProfile(false); 
    
  };
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Важно для httpOnly кук
      });

      if (response.ok) {
        router.push('/'); // Перенаправляем на страницу входа
        router.refresh(); // Обновляем данные страницы
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
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
          <a
          
            className={styles.primary}
            href="#" //src to link friends
            onClick={handleOpenFriends}
          >
            
            Friends
          </a>
          <a
            className={styles.primary}
            href="#" //src to link chat
            onClick={handleOpenChats}
          >
           
            Chat
          </a>
          <a
            href="#"
            className={styles.primary}
            
          >
            Server
          </a>
        </div>
            </div>
          </div>
        </div>
        <div className={styles.right_Container}>
        <div className={styles.right_head_container}>
        {/* Строка поиска */}
              <div className={styles.search_container}>
                <input type="text" placeholder="Поиск..." className={styles.search_input}/>
                
              </div>
              {/* Меню профиля */}
              <div className={styles.profile_menu}>
                <button className={styles.profile_button}>
                  <Image
                    aria-hidden
                    src="/file.svg"
                    alt="File icon"
                    width={16}
                    height={16}
                  />
                  <span className={styles.profile_name}>Имя пользователя</span>
                </button>
                
                {/* Выпадающее меню (появляется при клике/наведении) */}
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
