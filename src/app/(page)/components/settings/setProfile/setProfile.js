"use client"
import Image from "next/image"
import styles from "./page.module.css"
import { useState, useEffect } from 'react'
import EditProfileModal from "../moduleEditProfile/editProfileModal"

export default function SettingProfile() {
  const [activeTab, setActiveTab] = useState('about')
  const [profile, setProfile] = useState({
    id: '',
    login: '',
    role: '',
    email: '',
    description: '',
    avatar: "/castle.jpg",
    location: "",
    secondlogin: "",
    discord: "",
    steam: "",
    twitch: "",
    joinDate: ""
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeField, setActiveField] = useState('second_name')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const integrations = [
    { 
      id: 'discord',
      name: 'Discord',
      username: profile.discord || 'Не подключено',
      icon: '/discord-icon.svg'
    },
    { 
      id: 'steam',
      name: 'Steam',
      username: profile.steam || 'Не подключено',
      icon: '/steam-icon.svg'
    },
    { 
      id: 'twitch',
      name: 'Twitch',
      username: profile.twitch || 'Не подключено',
      icon: '/twitch-icon.svg'
    }
  ]

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile')
        if (!response.ok) throw new Error('Failed to fetch profile')
        
        const userData = await response.json()
        setProfile(prev => ({
          ...prev,
          ...userData,
          joinDate: new Date(userData.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        }))
      } catch (error) {
        console.error('Profile load error:', error)
        setError('Failed to load profile data')
      }
    }

    fetchProfile()
  }, [])

  const handleChangeClick = (field) => {
    setActiveField(field)
    setIsModalOpen(true)
    setError('')
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const newValue = document.querySelector(`.${styles.modalInput}`).value.trim()
      
      if (!newValue) throw new Error('Field cannot be empty')
      if (activeField === 'second_name' && newValue.length < 3) {
        throw new Error('Username must be at least 3 characters')
      }

      const response = await fetch('/api/profile/uprofile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: activeField,
          value: newValue,
          userId: profile.id
        }),
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Update failed')
      }

      setProfile(prev => ({
        ...prev,
        [activeField === 'second_name' ? 'secondlogin' : 'description']: newValue
      }))
      
      setIsModalOpen(false)
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.modalContent}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarContainer}>
        <Image
            src={profile.avatar || '/default-avatar.png'}
            alt={profile.secondlogin}
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
          <div className={styles.userNameContainer} onClick={() => handleChangeClick('second_name')}>
            <h2 className={styles.userName}>
              {profile.secondlogin}
            </h2>
            <Image
              src="/edit-icon.svg"
              width={20}
              height={20}
              alt="Edit"
              className={styles.editIcon}
            />
          </div>
          <div className={styles.userTag}>@{profile.login}</div>
          <div className={styles.joinDate}>
            В числе участников с {profile.joinDate || '9 дек. 2017 г.'}
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
          className={`${styles.tab} ${activeTab === 'personal' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Личная информация
            </div>
          </div>
          
      <div className={styles.tabContent}>
        {activeTab === 'about' && (
          <div className={styles.aboutContent}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Описание</h3>
              <div className={styles.aboutMeContainer} onClick={() => handleChangeClick('bio')}>
                <div className={styles.aboutMe}>
                  {profile.description || "MILFhunter"}
                </div>
                <Image
                  src="/edit-icon.svg"
                  width={20}
                  height={20}
                  alt="Edit"
                  className={styles.editIcon}
                />
              </div>
            </div>

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
          </div>
        )}
        
        {activeTab === 'personal' && (
          <div className={styles.personalInfo}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Email</div>
              <div className={styles.infoValue}>{profile.email}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Локация</div>
              <div className={styles.infoValue}>{profile.location || 'Не указано'}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Роль</div>
              <div className={styles.infoValue}>{profile.role || 'Пользователь'}</div>
            </div>
          </div>
        )}
      </div>

      <EditProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>Изменить {activeField === 'second_name' ? 'никнейм' : 'описание'}</h3>
        <input
          type="text"
          defaultValue={activeField === 'second_name' ? profile.secondlogin : profile.description}
          className={styles.modalInput}
        />
        {error && <div className={styles.errorText}>{error}</div>}
        <div className={styles.modalActions}>
          <button onClick={() => setIsModalOpen(false)} disabled={isLoading}>
            Отмена
          </button>
          <button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </EditProfileModal>
    </div>
  )
}