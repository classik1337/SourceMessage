"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../context/SocketContext/SocketContext";
import AddFriendModal from "../addFriendModal/AddFriendModal";
import CheckIcon from '/public/check-icon.svg';
import CloseIcon from '/public/close-icon.svg';

const tabs = [
  { id: 'friends', label: 'Друзья' },
  { id: 'online', label: 'В сети' },
  { id: 'all', label: 'Все' },
  { id: 'requests', label: 'Заявки' },
];

function RequestsTabContent() {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const fetchRequests = () => {
    setLoading(true);
    fetch('/api/friends/linkFriends')
      .then(res => res.json())
      .then(data => {
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (id) => {
    setActionLoading(id);
    setError("");
    const res = await fetch('/api/friends/acceptRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Ошибка');
    }
    setActionLoading(null);
    fetchRequests();
  };
  const handleDecline = async (id) => {
    setActionLoading(id);
    setError("");
    const res = await fetch('/api/friends/declineRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Ошибка');
    }
    setActionLoading(null);
    fetchRequests();
  };
  const handleCancel = async (id) => {
    setActionLoading(id);
    setError("");
    const res = await fetch('/api/friends/cancelRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Ошибка');
    }
    setActionLoading(null);
    fetchRequests();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      {error && <div style={{color:'#ed4245',marginBottom:8}}>{error}</div>}
      <div className={styles.requestsHeader}>Входящие заявки</div>
      {incomingRequests.length === 0 ? (
        <div className={styles.noFriends}>Нет входящих заявок</div>
      ) : (
        incomingRequests.map(req => (
          <div key={req.id} className={styles.menuItem}>
            <div className={styles.userInfo}>
              <img src={req.avatar} alt={req.second_name || req.full_name} className={styles.avatar} width={40} height={40} />
              <div className={styles.userDetails}>
                <div className={styles.userName}>{req.second_name || 'Без ника'}</div>
                <div className={styles.userLogin}>@{req.full_name}</div>
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.iconButton} onClick={() => handleAccept(req.id)} disabled={actionLoading === req.id} title="Принять">
                <Image src="/check-icon.svg" alt="Принять" width={24} height={24} />
              </button>
              <button className={styles.iconButton} onClick={() => handleDecline(req.id)} disabled={actionLoading === req.id} title="Отклонить">
                <Image src="/close-icon.svg" alt="Отклонить" width={24} height={24} />
              </button>
            </div>
          </div>
        ))
      )}
      <div className={styles.requestsHeader}>Исходящие заявки</div>
      {outgoingRequests.length === 0 ? (
        <div className={styles.noFriends}>Нет исходящих заявок</div>
      ) : (
        outgoingRequests.map(req => (
          <div key={req.id} className={styles.menuItem}>
            <div className={styles.userInfo}>
              <img src={req.avatar} alt={req.second_name || req.full_name} className={styles.avatar} width={40} height={40} />
              <div className={styles.userDetails}>
                <div className={styles.userName}>{req.second_name || 'Без ника'}</div>
                <div className={styles.userLogin}>@{req.full_name}</div>
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.iconButton} onClick={() => handleCancel(req.id)} disabled={actionLoading === req.id} title="Отменить">
                <Image src="/close-icon.svg" alt="Отменить" width={24} height={24} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function FriendList({ friends, onFriendClick }) {
  const safeFriends = Array.isArray(friends) ? friends : [];
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

    // Запрашиваем начальные статусы, только если есть друзья
    if (safeFriends.length > 0) {
      socket.emit('get-connection-info', { targetUserId: safeFriends[0].friend_id }, (response) => {
        if (response?.allConnections) {
          const newStatuses = {};
          response.allConnections.forEach(conn => {
            newStatuses[conn.userId] = conn.status === 'online' && Boolean(conn.socketId);
          });
          setOnlineStatus(newStatuses);
        }
      });
    }

    return () => {
      socket.off('online-status-update', handleStatusUpdate);
    };
  }, [socket, friends]);

  // Обогащаем друзей информацией об онлайн-статусе
  const enrichedFriends = safeFriends.map(friend => {
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
      return matchesSearch && friend.isOnline && friend.status === 'accepted';
    } else if (activeTab === 'all') {
      return matchesSearch && friend.status === 'accepted';
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
                    {activeTab === 'requests' ? (
                      <RequestsTabContent />
                    ) : (
                      sortedFriends.length === 0 ? (
                        <div className={styles.noFriends}>У вас пока нет друзей</div>
                      ) : (
                        sortedFriends.map(friend => (
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
                        ))
                      )
                    )}
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