import { useState, useRef } from 'react';
import styles from './GroupSettingsModal.module.css';

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
            <div className={styles.actions}>
              <button onClick={onClose} className={styles.cancelButton} disabled={isSaving}>
                Отмена
              </button>
              <button onClick={handleSave} className={styles.saveButton} disabled={isSaving}>
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.readOnlyContainer}>
            <p className={styles.readOnlyMessage}>
              У вас нет прав для редактирования этого чата.
            </p>
          </div>
        )}

        <button onClick={onClose} className={styles.closeButton}>×</button>
      </div>
    </div>
  );
} 