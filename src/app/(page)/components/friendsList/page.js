"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../context/SocketContext/SocketContext";
import AddFriendModal from "../addFriendModal/AddFriendModal";

const tabs = [
  { id: 'friends', label: 'Друзья' },
  { id: 'online', label: 'В сети' },
  { id: 'all', label: 'Все' }
];

export default function FriendList({ friends, onFriendClick }) {
  const [activeTab, setActiveTab] = useState('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineStatus, setOnlineStatus] = useState({});
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }

    // Обработчик обновления статуса
    const handleStatusUpdate = (statuses) => {
      setOnlineStatus(prev => statuses);
    };

    // Подписываемся на обновления статуса
    socket.on('online-status-update', handleStatusUpdate);

    // Запрашиваем начальные статусы
    socket.emit('get-connection-info', { targetUserId: friends[0]?.friend_id }, (response) => {
      if (response?.allConnections) {
        const newStatuses = {};
        response.allConnections.forEach(conn => {
          // Проверяем и статус, и наличие активного сокета
          newStatuses[conn.userId] = conn.status === 'online' && Boolean(conn.socketId);
        });
        setOnlineStatus(newStatuses);
      }
    });

    return () => {
      socket.off('online-status-update', handleStatusUpdate);
    };
  }, [socket, friends]);

  // Обогащаем друзей информацией об онлайн-статусе
  const enrichedFriends = friends.map(friend => {
    const isOnline = Boolean(onlineStatus[friend.friend_id]);
    return {
      ...friend,
      isOnline
    };
  });

  // Фильтрация друзей
  const filteredFriends = enrichedFriends.filter(friend => {
    const matchesSearch = friend.secondlogin?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'online') {
      return matchesSearch && friend.isOnline;
    } else if (activeTab === 'all') {
      return matchesSearch;
    }
    return false;
  });

  // Сортируем друзей: сначала онлайн, потом оффлайн
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    if (a.isOnline === b.isOnline) {
      return a.secondlogin?.localeCompare(b.secondlogin) || 0;
    }
    return a.isOnline ? -1 : 1;
  });

  // Обработчик клика по сообщению
  const handleMessageClick = (e, friend) => {
    e.preventDefault();
    e.stopPropagation();
    onFriendClick({
      idFriend: friend.friend_id,
      nameFriend: friend.secondlogin,
      avatarSrc: friend.avatar || "/castle.jpg"
    });
  };

  // Обработчик клика по трем точкам
  const handleMoreClick = (e, friendId) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdown(activeDropdown === friendId ? null : friendId);
  };

  // Закрытие дропдауна при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.actionButton}`) && !event.target.closest(`.${styles.dropdownMenu}`)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
                  <button 
                    className={styles.addFriendButton}
                    onClick={() => setShowAddFriendModal(true)}
                  >
                    Добавить в друзья
                  </button>
                </div>

                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Поиск по нику"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <div className={styles.settingPrimaryHelper}>
                  В сети — {enrichedFriends.filter(f => f.isOnline).length}
                </div>
                
                <div className={styles.friendsListWrapper}>
                  <div className={styles.friendsList}>
                    {sortedFriends.map(friend => (
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
                            alt="userAvatar"
                            width={48}
                            height={48}
                            priority
                          />
                          <div className={`${styles.statusIndicator} ${friend.isOnline ? styles.online : styles.offline}`} />
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
                          <div className={styles.dropdownContainer}>
                            <button 
                              className={styles.actionButton}
                              onClick={(e) => handleMoreClick(e, friend.friend_id)}
                            >
                              <Image
                                src="/more-icon.svg"
                                alt="More"
                                width={24}
                                height={24}
                              />
                            </button>
                            {activeDropdown === friend.friend_id && (
                              <div className={styles.dropdownMenu}>
                                <button className={styles.dropdownItem}>
                                  <Image
                                    src="/video-call-icon.svg"
                                    alt="Video Call"
                                    width={20}
                                    height={20}
                                  />
                                  Начать видеозвонок
                                </button>
                                <button className={styles.dropdownItem}>
                                  <Image
                                    src="/voice-call-icon.svg"
                                    alt="Voice Call"
                                    width={20}
                                    height={20}
                                  />
                                  Начать голосовой звонок
                                </button>
                                <button className={`${styles.dropdownItem} ${styles.dangerItem}`}>
                                  <Image
                                    src="/remove-friend-icon.svg"
                                    alt="Remove Friend"
                                    width={20}
                                    height={20}
                                  />
                                  Удалить из друзей
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showAddFriendModal && (
        <AddFriendModal onClose={() => setShowAddFriendModal(false)} />
      )}
    </div>
  );
}