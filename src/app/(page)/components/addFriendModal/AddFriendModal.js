"use client"
import { useState } from 'react';
import styles from './AddFriendModal.module.css';
import Image from 'next/image';

export default function AddFriendModal({ onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await fetch(
        `/api/friends/search?query=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка поиска');
      }

      const data = await response.json();
      setSearchResults(data.map(user => ({
        ...user,
        isAdded: false
      })));
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId: userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось добавить друга');
      }

      setSearchResults(prev => prev.map(user => 
        user.user_id === userId ? { ...user, isAdded: true } : user
      ));
    } catch (err) {
      setError(err.message);
      console.error('Add friend error:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Добавить друга</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <Image
              src="/close-icon.svg"
              alt="Close"
              width={24}
              height={24}
            />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск по имени или никнейму..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
            autoFocus
          />
          <button 
            onClick={handleSearch}
            className={styles.searchButton}
            disabled={isLoading}
          >
            {isLoading ? 'Поиск...' : 'Найти'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.searchResults}>
          {searchResults.map(user => (
            <div key={user.user_id} className={styles.userItem}>
              <div className={styles.userInfo}>
                <Image
                  src={user.avatar_url || "/castle.jpg"}
                  alt={user.second_name || user.full_name}
                  width={40}
                  height={40}
                  className={styles.userAvatar}
                />
                <div className={styles.userDetails}>
                  <span className={styles.userName}>
                    {user.second_name || user.full_name}
                  </span>
                  {user.location && (
                    <span className={styles.userLocation}>{user.location}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleAddFriend(user.user_id)}
                className={`${styles.addButton} ${user.isAdded ? styles.added : ''}`}
                disabled={user.isAdded}
              >
                {user.isAdded ? 'Добавлен' : 'Добавить'}
              </button>
            </div>
          ))}
          
          {searchResults.length === 0 && !isLoading && searchQuery && (
            <div className={styles.noResults}>
              Пользователи не найдены
            </div>
          )}
        </div>
      </div>
    </div>
  );
}