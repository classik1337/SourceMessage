"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './AddToChatModal.module.css';

export default function AddToChatModal({ onClose }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/friends/linkFriends', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }

        const friendsData = await response.json();
        
        // Проверяем, является ли ответ сообщением об отсутствии друзей
        if (friendsData.message === 'У вас пока нет друзей') {
          setFriends([]);
          return;
        }

        const formattedFriends = friendsData.map(friend => ({
          id: friend.friend_id,
          name: friend.secondlogin || 'Пользователь',
          username: friend.secondlogin || '',
          avatar: friend.avatar || '/castle.jpg',
          isOnline: false // В будущем можно добавить статус онлайн
        }));
        
        setFriends(formattedFriends);
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, []);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  const handleCreateGroupChat = async () => {
    if (selectedFriends.length === 0) return;

    try {
      const selectedFriendsData = friends.filter(friend => 
        selectedFriends.includes(friend.id)
      );
      
      console.log('Creating group chat with:', selectedFriendsData);
      // Здесь будет API запрос для создания группового чата
      
      onClose();
    } catch (error) {
      console.error('Error creating group chat:', error);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Выберите друзей</h2>
          <p className={styles.subtitle}>
            {selectedFriends.length === 0 
              ? 'Вы можете добавить ещё 8 друзей.'
              : `Выбрано: ${selectedFriends.length}`
            }
          </p>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Введите имя пользователя вашего друга"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        <div className={styles.friendsList}>
          {isLoading ? (
            <div className={styles.loadingText}>Загрузка списка друзей...</div>
          ) : filteredFriends.length > 0 ? (
            filteredFriends.map(friend => (
              <div key={friend.id} className={styles.friendItem}>
                <div className={styles.friendInfo}>
                  <div className={styles.avatarContainer}>
                    <Image
                      src={friend.avatar}
                      alt={friend.name}
                      width={40}
                      height={40}
                      className={styles.avatar}
                    />
                    {friend.isOnline && <div className={styles.onlineStatus} />}
                  </div>
                  <div className={styles.friendName}>
                    <span>{friend.name}</span>
                    <span className={styles.username}>{friend.username}</span>
                  </div>
                </div>
                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => toggleFriendSelection(friend.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkmark}></span>
                </label>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              Друзья не найдены
            </div>
          )}
        </div>

        <button
          className={styles.createButton}
          onClick={handleCreateGroupChat}
          disabled={selectedFriends.length === 0}
        >
          Создать ЛС
        </button>
      </div>
    </div>
  );
} 