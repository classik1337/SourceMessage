"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './AddToChatModal.module.css';

export default function AddToChatModal({ onClose, chatId }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    // Получаем id текущего пользователя
    const fetchProfile = async () => {
      try {
        console.log('[AddToChatModal] Запрос профиля пользователя...');
        const response = await fetch('/api/auth/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const userData = await response.json();
        setMyId(userData.id);
        console.log('[AddToChatModal] Профиль загружен:', userData);
      } catch (error) {
        console.error('[AddToChatModal] Ошибка загрузки профиля:', error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        console.log('[AddToChatModal] Запрос списка друзей...');
        const response = await fetch('/api/friends/linkFriends', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }

        const friendsData = await response.json();
        
        console.log('[AddToChatModal] Список друзей получен:', friendsData);
        
        // Используем friendsData.friends для списка друзей
        if (!friendsData.friends || friendsData.friends.length === 0) {
          setFriends([]);
          return;
        }

        const formattedFriends = friendsData.friends.map(friend => ({
          id: friend.friend_id,
          name: friend.secondlogin || 'Пользователь',
          username: friend.secondlogin || '',
          avatar: friend.avatar || '/castle.jpg',
          isOnline: false // В будущем можно добавить статус онлайн
        }));
        
        setFriends(formattedFriends);
      } catch (error) {
        console.error('[AddToChatModal] Ошибка загрузки друзей:', error);
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
      const newSelected = prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId];
      console.log('[AddToChatModal] Изменён выбор друзей:', newSelected);
      return newSelected;
    });
  };

  const handleCreateGroupChat = async () => {
    if (selectedFriends.length < 1 || !myId || !chatId) {
      console.warn('[AddToChatModal] Не выбрано достаточно друзей или не определён чат.');
      return;
    }
    try {
      const userIds = [myId, chatId, ...selectedFriends];
      const groupName = 'друг + друг + друг';
      console.log('[AddToChatModal] Отправка запроса на создание группы:', { groupName, userIds });
      const response = await fetch('/api/chat/chatGroup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ name: groupName, userIds })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AddToChatModal] Сервер вернул ошибку:', errorData);
        throw new Error(errorData.error || 'Ошибка создания группы');
      }
      const data = await response.json();
      console.log('[AddToChatModal] Группа успешно создана:', data);
      onClose();
    } catch (error) {
      console.error('[AddToChatModal] Ошибка создания группового чата:', error);
      alert('Ошибка создания группового чата: ' + error.message);
    }
  };

  const handleAddToGroupChat = async () => {
    if (selectedFriends.length < 1 || !myId || !chatId) {
      console.warn('[AddToChatModal] Не выбрано достаточно друзей или не определён чат.');
      return;
    }
    try {
      console.log('[AddToChatModal] Отправка запроса на добавление в группу:', { chatId, userIds: selectedFriends });
      const response = await fetch('/api/chat/chatGroup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ chatId, userIds: selectedFriends })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AddToChatModal] Сервер вернул ошибку:', errorData);
        throw new Error(errorData.error || 'Ошибка добавления в групповой чат');
      }
      const data = await response.json();
      console.log('[AddToChatModal] Участники успешно добавлены в группу:', data);
      onClose();
    } catch (error) {
      console.error('[AddToChatModal] Ошибка добавления в групповой чат:', error);
      alert('Ошибка добавления в групповой чат: ' + error.message);
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
                  />
                  <span className={styles.checkmark}></span>
                </label>
              </div>
            ))
          ) : (
            <div className={styles.loadingText}>Нет друзей для добавления.</div>
          )}
        </div>

        <div className={styles.actions}>
          {chatId ? (
            <button className={styles.saveButton} onClick={handleAddToGroupChat} disabled={selectedFriends.length === 0}>
              Добавить в группу
            </button>
          ) : (
            <button className={styles.saveButton} onClick={handleCreateGroupChat} disabled={selectedFriends.length === 0}>
              Создать группу
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 