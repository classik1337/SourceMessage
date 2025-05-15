"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export default function IncomingCallModal({
  callerInfo,
  onAccept,
  onReject,
  callType
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [ringtone, setRingtone] = useState(null);

  // Обновляем инициализацию звука
  useEffect(() => {
    const audio = new Audio('/solanaflipper.mp3');
    audio.loop = true;
    
    // Добавляем обработчики событий
    audio.oncanplay = () => {
      console.log('Ringtone can play');
    };
    
    audio.onplay = () => {
      console.log('Ringtone started playing');
    };
    
    audio.onerror = (error) => {
      console.error('Ringtone error:', error);
    };
    
    // Предзагружаем аудио
    audio.load();
    
    setRingtone(audio);

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  // Обновляем эффект воспроизведения
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (ringtone) {
        // Пробуем воспроизвести с обработкой ошибок
        const playPromise = ringtone.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing ringtone:', error);
            // Пробуем повторно воспроизвести через небольшую задержку
            setTimeout(() => {
              ringtone.play().catch(console.error);
            }, 1000);
          });
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
      }
    };
  }, [ringtone]);

  // Автоматическое отклонение через 30 секунд
  useEffect(() => {
    if (timeLeft <= 0) {
      handleReject();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAccept = () => {
    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }
    setIsVisible(false);
    setTimeout(() => {
      onAccept();
    }, 300);
  };

  const handleReject = () => {
    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }
    setIsVisible(false);
    setTimeout(() => {
      onReject();
    }, 300);
  };

  return (
    <div className={`${styles.modalOverlay} ${isVisible ? styles.visible : ''}`}>
      {/* Добавляем кнопку для тестирования звука */}
      <button
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '5px',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1000
        }}
        onClick={() => {
          if (ringtone) {
            if (ringtone.paused) {
              ringtone.play().catch(console.error);
            } else {
              ringtone.pause();
              ringtone.currentTime = 0;
            }
          }
        }}
      >
        Test Sound
      </button>
      <div className={`${styles.modalContent} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.callerInfo}>
          <div className={styles.avatarContainer}>
            <Image 
              src={callerInfo?.avatar || '/default-avatar.jpg'} 
              alt={callerInfo?.name || 'Unknown caller'}
              width={100}
              height={100}
              className={styles.callerAvatar}
            />
            <div className={styles.callType}>
              <Image 
                src={callType === 'video' ? '/video.svg' : '/phone.svg'}
                alt={callType === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}
                width={24}
                height={24}
              />
            </div>
          </div>
          <h2 className={styles.callerName}>{callerInfo?.name || 'Unknown caller'}</h2>
          <p className={styles.callTypeText}>
            {callType === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}
          </p>
          <p className={styles.timer}>
            Автоотклонение через {timeLeft} сек
          </p>
        </div>

        <div className={styles.buttonsContainer}>
          <button 
            className={`${styles.callButton} ${styles.acceptButton}`}
            onClick={handleAccept}
          >
            <Image 
              src="/phone.svg"
              alt="Принять"
              width={24}
              height={24}
            />
            <span>Ответить</span>
          </button>
          <button 
            className={`${styles.callButton} ${styles.rejectButton}`}
            onClick={handleReject}
          >
            <Image 
              src="/phone-off.svg"
              alt="Отклонить"
              width={24}
              height={24}
            />
            <span>Отклонить</span>
          </button>
        </div>
      </div>
    </div>
  );
}