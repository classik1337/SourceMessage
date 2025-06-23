"use client"
import Image from 'next/image';
import styles from './FriendInfoModal.module.css';
import { useState, useEffect } from 'react';

export default function FriendInfoModal({ friend, onClose }) {
  const [activeTab, setActiveTab] = useState('about'); // 'about' или 'friends'
  const [mutualFriends, setMutualFriends] = useState([]);

  useEffect(() => {
    if (activeTab === 'friends' && friend.user_id) {
      fetch(`/api/chat/chatGroup?mutualFriends=${friend.user_id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => setMutualFriends(data.mutualFriends || []));
    }
  }, [activeTab, friend.user_id]);

  const integrations = [
    { 
      id: 'discord',
      name: 'Discord',
      username: friend.discord || 'Не подключено',
      icon: '/discord-icon.svg'
    },
    { 
      id: 'steam',
      name: 'Steam',
      username: friend.steam || 'Не подключено',
      icon: '/steam-icon.svg'
    },
    { 
      id: 'twitch',
      name: 'Twitch',
      username: friend.twitch || 'Не подключено',
      icon: '/twitch-icon.svg'
    }
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <div className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            <Image
              src={friend.avatarSrc || '/default-avatar.png'}
              alt={friend.nameFriend}
              width={100}
              height={100}
              className={styles.avatar}
            />
          </div>
          <div className={styles.userInfo}>
            <h2 className={styles.userSecondName}>{friend.second_name || friend.secondName || 'username'}</h2>
            <div className={styles.userTag}>@{friend.nameFriend || friend.username}</div>
            <div className={styles.joinDate}>
              В числе участников с {friend.joinDate || ''}
            </div>
          </div>
        </div>
        <div className={styles.tabsContainer}>
          <div
            className={`${styles.tab} ${activeTab === 'about' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('about')}
          >
            Личная информация
          </div>
          <div
            className={`${styles.tab} ${activeTab === 'friends' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Общие друзья
          </div>
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'about' && (
            <div className={styles.aboutMe}>
              <div className={styles.infoBlock}>
                <div className={styles.infoLabel}>Локация</div>
                <div className={styles.infoValue}>{friend.location || 'Не указано'}</div>
              </div>
              <div className={styles.infoBlock}>
                <div className={styles.infoLabel}>Описание пользователя</div>
                <div className={styles.infoValue}>{friend.about || friend.bio || 'Информация отсутствует'}</div>
              </div>
            </div>
          )}
          {activeTab === 'friends' && (
            <div className={styles.friendsList}>
              {mutualFriends.length === 0 && <div className={styles.infoValue}>Нет общих друзей</div>}
              {mutualFriends.map(f => (
                <div key={f.id} className={styles.friendItem}>
                  <Image
                    src={f.avatar_url || '/default-avatar.png'}
                    alt={f.login || f.second_name || ''}
                    width={40}
                    height={40}
                    className={styles.friendAvatar}
                  />
                  <div className={styles.friendName}>{f.second_name || f.login}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 