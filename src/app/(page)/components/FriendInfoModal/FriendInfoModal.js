"use client"
import Image from 'next/image';
import styles from './FriendInfoModal.module.css';
import { useState } from 'react';

export default function FriendInfoModal({ friend, onClose }) {
  const [activeTab, setActiveTab] = useState('about'); // 'about' или 'friends'

  const mutualFriends = [
    { id: 1, name: 'Buusty', avatar: '/default-avatar.png' },
    { id: 2, name: 'gazl', avatar: '/default-avatar.png' },
    { id: 3, name: 'aacholbd', avatar: '/default-avatar.png' },
    { id: 4, name: 'MMM228666', avatar: '/default-avatar.png' },
    { id: 5, name: 'савва', avatar: '/default-avatar.png' },
    { id: 6, name: 'GalahaD', avatar: '/default-avatar.png' },
    { id: 7, name: 'фары приоры', avatar: '/default-avatar.png' },
    { id: 8, name: '☠DUNGEON MASTER☠', avatar: '/default-avatar.png' },
    { id: 9, name: 'Vlad1K_2005', avatar: '/default-avatar.png' },
    { id: 10, name: 'firsatimus', avatar: '/default-avatar.png' },
  ];

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
              width={120}
              height={120}
              className={styles.avatar}
            />
            <div className={styles.onlineStatus}>
              <span className={`${styles.statusDot} ${styles.online}`}></span>
              Целый экран, пока онлайн
            </div>
          </div>

          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{friend.nameFriend}</h2>
            <div className={styles.userTag}>@{friend.secondName || 'username'}</div>
            <div className={styles.joinDate}>
              В числе участников с {friend.joinDate || '9 дек. 2017 г.'}
            </div>
          </div>
        </div>

         <div className={styles.tabsContainer}>
          <div 
            className={`${styles.tab} ${activeTab === 'about' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('about')}
          >
            Обо мне
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
                  <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Интеграции</h3>
          <div className={styles.integrations}>
            {integrations.map(integration => (
              <div key={integration.id} className={styles.integrationItem}>
                <Image
                  src={integration.icon}
                  alt={integration.name}
                  width={24}
                  height={24}
                  className={styles.integrationIcon}
                />
                <div className={styles.integrationInfo}>
                  <div className={styles.integrationName}>{integration.name}</div>
                  <div className={styles.integrationUsername}>{integration.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
              {friend.about || 'MILFhunter'}
            </div>
          )}
          
          {activeTab === 'friends' && (
            <div className={styles.friendsList}>
              {mutualFriends.map(friend => (
                <div key={friend.id} className={styles.friendItem}>
                  <Image
                    src={friend.avatar}
                    alt={friend.name}
                    width={40}
                    height={40}
                    className={styles.friendAvatar}
                  />
                  <div className={styles.friendName}>{friend.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 