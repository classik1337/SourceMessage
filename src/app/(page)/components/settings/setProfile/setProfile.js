"use client"
import Image from "next/image"
import styles from "./page.module.css"
import { useState, useEffect, useRef } from 'react'
import EditProfileModal from "../moduleEditProfile/editProfileModal"

export default function SettingProfile() {
  // Состояния профиля
  const [profile, setProfile] = useState({
    id: '',
    login: '',
    role: '',
    email: '',
    description: '',//2table
    avatar: "",
    location: "",
    secondlogin: "",
  })

  // Состояния UI
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeField, setActiveField] = useState('second_name')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0);
  const inputRef = useRef()

  // Получение данных профиля
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile')
        if (!response.ok) throw new Error('Failed to fetch profile')
        
        const userData = await response.json()
        setProfile(prev => ({
          ...prev,
          email: userData.email,
          id: userData.id,
          login: userData.login,
          role: userData.role,
          description: userData.description,
          avatar: userData.avatar,
          location: userData.location,
          secondlogin: userData.secondlogin
        }))
      } catch (error) {
        console.error('Profile load error:', error)
        setError('Failed to load profile data')
      }
    }

    fetchProfile()
  }, [])

  

  // Обработчики
  const handleChangeClick = (field) => {
    setActiveField(field)
    setIsModalOpen(true)
    setError('')
  }

  const handleSave = async () => {
    setRefreshKey(prev => prev + 1);
    try {
      setIsLoading(true)
      const newValue = inputRef.current.value.trim()
      
      // Валидация
      if (!newValue) throw new Error('Field cannot be empty')
      if (activeField === 'second_name' && newValue.length < 3) {
        throw new Error('Username must be at least 3 characters')
      }

      // Отправка данных
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

      // Обновление состояния
      setProfile(prev => ({
        ...prev,
        [activeField === 'second_name' ? 'secondlogin' : 'bio']: newValue
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
    <div className={styles.rightProfile}>
      <a className={styles.overviewText}>Overview your profile</a>
      
      <div className={styles.userProfileTest}>
        <div className={styles.headProfile}></div>
        <Image
          className={styles.avatar}
          src={profile.avatar}
          alt="User avatar"
          width={60}
          height={60}
          priority
        />
        
        <div className={styles.checkInfoContainerName}>
          <a className={styles.username} onClick={() => handleChangeClick('second_name')}>
            {profile.secondlogin}
          </a>
          <a className={styles.description}>{profile.location}</a>
        </div>
        
        <div className={styles.infoProfile}>
          {/* Блок логина */}
          <div className={styles.infoProfileContainer}>
            <div className={styles.checkInfoContainer}>
              <a className={styles.overviewTextHelper}>Your unique login</a>
              <a className={styles.description}>{profile.login}</a>
            </div>
          </div>
          
          {/* Блок био */}
          <div className={styles.infoProfileContainer}>
            <div className={styles.checkInfoContainer}>
              <a className={styles.overviewTextHelper}>Your bio</a>
              <a className={styles.description}>{profile.description}</a>
            </div>
            <div className={styles.changeButton}> 
              <a onClick={() => handleChangeClick('bio')}>Change</a>
            </div>
          </div>
          
          {/* Блок email */}
          <div className={styles.infoProfileContainer}>
            <div className={styles.checkInfoContainer}>
              <a className={styles.overviewTextHelper}>Your Email</a>
              <a className={styles.description}>{profile.email}</a>
            </div>
            <div className={styles.changeButton}>
              <a>Change</a>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно редактирования */}
      <EditProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>Edit {activeField === 'second_name' ? 'Username' : 'bio'}</h3>
        
        <input
          ref={inputRef}
          type="text"
          defaultValue={activeField === 'second_name' ? profile.secondlogin : profile.description}
          className={styles.modalInput}
        />
        
        {error && <div className={styles.errorText}>{error}</div>}
        
        <div className={styles.modalActions}>
          <button 
            onClick={() => setIsModalOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </EditProfileModal>
    </div>
  )
}