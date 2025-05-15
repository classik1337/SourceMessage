"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useState } from "react";

export default function FriendList({ friends, onFriendClick }) {
  const [activeTab, setActiveTab] = useState('online');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'friends', label: 'Друзья' },
    { id: 'online', label: 'В сети' },
    { id: 'all', label: 'Все' }
  ];

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.secondlogin?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'online') {
      return matchesSearch && friend.status === 'online';
    }
    return matchesSearch;
  });

  const handleMessageClick = (e, friend) => {
    e.preventDefault();
    e.stopPropagation();
    onFriendClick({
      idFriend: friend.friend_id,
      nameFriend: friend.secondlogin,
      avatarSrc: friend.avatar || "/castle.jpg"
    });
  };

  return (
    <div className={styles.rightFriendChat}>
      <div className={styles.mainFrame}>
        <div className={styles.friendsPage}>
          <div className={styles.leftFriends}>
            <div className={styles.settingFriends}>
              <div className={styles.settingPrimary}>
                <div className={styles.tabsContainer}>
                  <div className={styles.friendsLabel}>Друзья</div>
                  <div className={styles.tabs}>
                    {tabs.map(tab => {
                      if (tab.id === 'friends') return null;
                      return (
                        <button
                          key={tab.id}
                          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  <button className={styles.addFriendButton}>
                    Добавить в друзья
                  </button>
                </div>

                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Поиск"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <div className={styles.settingPrimaryHelper}>
                  В сети — {filteredFriends.filter(f => f.status === 'online').length}
                </div>
                
                <div className={styles.friendsList}>
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map(friend => (
                      <div 
                        className={styles.menuItem} 
                        key={friend.friend_id}
                        onClick={() => onFriendClick({
                          idFriend: friend.friend_id,
                          nameFriend: friend.secondlogin,
                          avatarSrc: friend.avatar || "/castle.jpg"
                        })}
                      >
                        <div className={styles.statusContainer}>
                          <Image
                            className={styles.avatar}
                            src={friend.avatar || "/castle.jpg"}
                            alt={"userAvatar"}
                            width={48}
                            height={48}
                            priority
                          />
                          <div className={`${styles.statusIndicator} ${styles[friend.status || 'offline']}`} />
                        </div>
                        <span className={styles.menuText}>
                          {friend.secondlogin || "No name"}
                        </span>
                        <div className={styles.actions}>
                          <button 
                            className={styles.actionButton}
                            onClick={(e) => handleMessageClick(e, friend)}
                          >
                            <Image
                              src="/message-icon.svg"
                              alt="Message"
                              width={24}
                              height={24}
                            />
                          </button>
                          <button className={styles.actionButton}>
                            <Image
                              src="/more-icon.svg"
                              alt="More"
                              width={24}
                              height={24}
                            />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>Друзей не найдено</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}