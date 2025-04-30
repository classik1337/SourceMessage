"use client"
import Image from "next/image";
import styles from "./page.module.css";
import Profile from "../Profile/page";
import { useRouter } from 'next/navigation'; 
import { useState } from 'react';



export default function MainFrame() {
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
            href="" //src to link friends
            target="_blank"
            rel="noopener noreferrer"
          >
            
            Friends
          </a>
          <a
            className={styles.primary}
            href="" //src to link chat
            target="_blank"
            rel="noopener noreferrer"
          >
           
            Chat
          </a>
          <a
            href=""
            target="_blank"
            rel="noopener noreferrer"
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
                  <a href="#" className={styles.menu_item}>Мой профиль</a>
                  <a href="#" className={styles.menu_item}>Настройки</a>
                  <a href="#" onClick={handleLogout} className={styles.menu_item}>Выйти</a>
                </div>
              </div>
            </div>
            <div className={styles.main_right_container}>
              <Profile></Profile>
            </div>
          </div>
      </main>
    </div>
  );
}
