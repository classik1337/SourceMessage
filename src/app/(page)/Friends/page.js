import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect } from "react"; // Добавлен импорт useState и useEffect
import FriendChat from "../components/friendChat/chat";

export default function Friends() {
  const [friends, setFriends] = useState([]); // Переименовано из profile в friends
  const [error, setError] = useState(null); // Добавлено состояние для ошибок

  // Компонент MenuItem вынесен внутрь Friends, чтобы иметь доступ к состоянию
  const MenuItem = ({ 
    avatarSrc = "/castle.jpg", 
    nameFriend = "NameFriends",
    idFriend = "#1",
  }) => (
    <div className={styles.menuItem}>
      <Image
        className={styles.avatar}
        src={avatarSrc}
        alt={"userAvatar"}
        width={30}
        height={30}
        priority
      />
      <a className={styles.menuText} href={`#${idFriend}`}>{nameFriend}</a>
    </div>
  );

  // Получение данных друзей
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch('/api/friends/linkFriends');
        if (!response.ok) throw new Error('Failed to fetch friends');
        
        const friendsData = await response.json();
        
        // Предполагаем, что API возвращает массив друзей
        setFriends(friendsData);
      } catch (error) {
        console.error('Friends load error:', error);
        setError('Failed to load friends data');
      }
    };

    fetchFriends();
  }, []);

  return (
    <div className={styles.main_Container}>
      <div className={styles.mainFrame}>
        <div className={styles.friendsPage}>
          <div className={styles.leftFriends}>
            <div className={styles.settingFriends}>
              <div className={styles.settingPrimary}>
                <a className={styles.settingPrimaryHelper}>YOUR FRIENDS</a>
                
                {/* Отображение списка друзей */}
                {error ? (
                  <div className={styles.error}>{error}</div>
                ) : friends.length > 0 ? (
                  friends.map(friend => (
                    <MenuItem 
                      // key={friend.friend_id}
                      avatarSrc={friend.avatar || "/castle.jpg"}
                      nameFriend={friend.secondlogin || "No name"}
                      idFriend={friend.friend_id}
                    />
                  ))
                ) : (
                  <div>No friends found</div>
                )}
                
                <div className={styles.divider} />
              </div>
            </div>
          </div>
          <div className={styles.rightFriend}>
            <FriendChat/>
          </div>
        </div>
      </div>
    </div>
  );
}