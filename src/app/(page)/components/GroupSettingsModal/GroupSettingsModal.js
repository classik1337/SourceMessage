import { useState, useRef, useEffect } from 'react';
import styles from './GroupSettingsModal.module.css';
import AddToChatModal from '../AddToChatModal/AddToChatModal';
import FriendInfoModal from '../FriendInfoModal/FriendInfoModal';

export default function GroupSettingsModal({
  chatId,
  currentName,
  currentAvatar,
  onClose,
  onSave,
  userRole,
}) {
  const [name, setName] = useState(currentName);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar);
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef(null);

  // Новый функционал: загрузка участников группы
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Функция для обновления участников после добавления
  const refreshMembers = async () => {
    setLoadingMembers(true);
    setMembersError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/chat/chatGroup?members=${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ошибка загрузки участников');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (e) {
      setMembersError('Не удалось загрузить участников группы');
      setMembers([]);
    }
    setLoadingMembers(false);
  };

  useEffect(() => {
    if (!chatId) return;
    refreshMembers();
  }, [chatId]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ name, avatarFile });
      onClose();
    } catch (error) {
      console.error("Failed to save group settings:", error);
      // Тут можно показать ошибку пользователю
    } finally {
      setIsSaving(false);
    }
  };

  // Сортировка: создатель всегда первый, затем админы, затем участники по имени
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'creator') return -1;
    if (b.role === 'creator') return 1;
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    return (a.username || '').localeCompare(b.username || '');
  });

  // Удаление участника из группы (только для создателя)
  const handleRemoveMember = async (userId) => {
    if (!chatId || !userId) return;
    if (!confirm('Удалить этого пользователя из группы?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/chat/chatGroup`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId, userId })
      });
      if (!res.ok) throw new Error('Ошибка удаления участника');
      await refreshMembers();
    } catch (e) {
      alert('Не удалось удалить участника: ' + e.message);
    }
  };

  const [selectedMember, setSelectedMember] = useState(null);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Настройки группы</h2>
        {userRole === 'creator' ? (
          <>
            <div className={styles.content}>
              <div className={styles.avatarSection}>
                <img src={avatarPreview || '/group.svg'} alt="Avatar" className={styles.avatar} />
                <button
                  className={styles.changeAvatarButton}
                  onClick={() => avatarInputRef.current.click()}
                >
                  Сменить аватар
                </button>
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              <div className={styles.nameSection}>
                <label htmlFor="group-name">Название группы</label>
                <input
                  id="group-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.nameInput}
                />
              </div>
            </div>
            {/* --- кнопки: сохранить и отмена в одну строку, добавить участников ниже --- */}
            <div className={styles.actionsRowCompact}>
              <button onClick={onClose} className={styles.cancelButtonCompact} disabled={isSaving}>
                Отмена
              </button>
              <button onClick={handleSave} className={styles.saveButtonCompact} disabled={isSaving}>
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
            <button className={styles.addMembersButton} onClick={() => setShowAddModal(true)}>
              Добавить участников
            </button>
            {/* --- секция участников всегда внизу --- */}
            <div className={styles.membersSection}>
              <h3>Участники группы</h3>
              {loadingMembers ? (
                <div>Загрузка...</div>
              ) : membersError ? (
                <div className={styles.error}>{membersError}</div>
              ) : (
                <ul className={styles.membersList}>
                  {sortedMembers.map(member => (
                    <li key={member.user_id} className={
                      member.role === 'creator' ? styles.memberItemCreator : styles.memberItem
                    }>
                      <div
                        className={styles.memberInfoClickable}
                        onClick={() => setSelectedMember({
                          avatarSrc: member.avatar_url,
                          nameFriend: member.username,
                          secondName: member.username,
                          joinDate: member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '',
                          about: member.bio || ''
                        })}
                        title="Показать профиль"
                        style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}
                      >
                        <img
                          src={member.avatar_url || '/default-avatar.jpg'}
                          alt={member.username}
                          width={40}
                          height={40}
                          className={styles.memberAvatar}
                        />
                        <span className={styles.memberName}>{member.username}</span>
                        {member.role === 'creator' && <span className={styles.roleTagCreator}>Создатель</span>}
                        {member.role === 'admin' && <span className={styles.roleTagAdmin}>Админ</span>}
                      </div>
                      {userRole === 'creator' && member.role !== 'creator' && (
                        <button
                          className={styles.removeMemberButton}
                          onClick={() => handleRemoveMember(member.user_id)}
                          title="Удалить из чата"
                        >
                          Удалить
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* --- конец секции участников --- */}
          </>
        ) : (
          <>
            <div className={styles.readOnlyContainer}>
              <p className={styles.readOnlyMessage}>
                У вас нет прав для редактирования этого чата.
              </p>
            </div>
            <div className={styles.membersSection}>
              <h3>Участники группы</h3>
              {loadingMembers ? (
                <div>Загрузка...</div>
              ) : membersError ? (
                <div className={styles.error}>{membersError}</div>
              ) : (
                <ul className={styles.membersList}>
                  {sortedMembers.map(member => (
                    <li key={member.user_id} className={
                      member.role === 'creator' ? styles.memberItemCreator : styles.memberItem
                    }>
                      <div
                        className={styles.memberInfoClickable}
                        onClick={() => setSelectedMember({
                          avatarSrc: member.avatar_url,
                          nameFriend: member.username,
                          secondName: member.username,
                          joinDate: member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '',
                          about: member.bio || ''
                        })}
                        title="Показать профиль"
                        style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}
                      >
                        <img
                          src={member.avatar_url || '/default-avatar.jpg'}
                          alt={member.username}
                          width={40}
                          height={40}
                          className={styles.memberAvatar}
                        />
                        <span className={styles.memberName}>{member.username}</span>
                        {member.role === 'creator' && <span className={styles.roleTagCreator}>Создатель</span>}
                        {member.role === 'admin' && <span className={styles.roleTagAdmin}>Админ</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
        <button onClick={onClose} className={styles.closeButton}>×</button>
        {showAddModal && (
          <AddToChatModal
            onClose={() => { setShowAddModal(false); refreshMembers(); }}
            chatId={chatId}
          />
        )}
        {selectedMember && (
          <FriendInfoModal friend={selectedMember} onClose={() => setSelectedMember(null)} />
        )}
      </div>
    </div>
  );
} 