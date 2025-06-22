"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './NewChatModal.module.css';
import FriendList from '../friendsList/page';

export default function NewChatModal({ onClose, onSelectFriend }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch('/api/friends/linkFriends', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch friends');
        const data = await response.json();
        setFriends(data.friends || []);
      } catch (err) {
        console.error('Error fetching friends:', err);
        setError('Failed to load friends list');
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const filteredFriends = friends.filter(friend =>
    (friend.secondlogin || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectFriend = (friend) => {
    onSelectFriend({
      idFriend: friend.friend_id,
      nameFriend: friend.secondlogin,
      avatarSrc: friend.avatar || '/castle.jpg'
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Выберите друга для чата</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск друзей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.friendsList}>
          {loading ? (
            <div className={styles.loading}>Загрузка списка друзей...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : filteredFriends.length === 0 ? (
            <div className={styles.noFriends}>
              {searchQuery ? 'Друзья не найдены' : 'У вас пока нет друзей'}
            </div>
          ) : (
            filteredFriends.map(friend => (
              <div
                key={friend.friend_id}
                className={styles.friendItem}
                onClick={() => handleSelectFriend(friend)}
              >
                <Image
                  src={friend.avatar || '/castle.jpg'}
                  alt={friend.secondlogin}
                  width={40}
                  height={40}
                  className={styles.friendAvatar}
                />
                <div className={styles.friendInfo}>
                  <div className={styles.friendName}>{friend.secondlogin}</div>
                  <div className={styles.friendUsername}>@{friend.friend_id}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 