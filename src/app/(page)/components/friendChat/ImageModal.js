"use client"
import { useEffect } from 'react';
import Image from 'next/image';
import styles from './ImageModal.module.css';

export default function ImageModal({ image, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.src;
    link.download = image.fileName || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.fileInfo}>
            <h3 className={styles.fileName}>{image.fileName}</h3>
            <div className={styles.fileDetails}>
              <span className={styles.fileDate}>{image.time}</span>
              {image.fileSize && (
                <span className={styles.fileSize}>{formatFileSize(image.fileSize)}</span>
              )}
            </div>
          </div>
          <div className={styles.modalActions}>
            <button 
              className={styles.downloadButton}
              onClick={handleDownload}
              title="Скачать изображение"
            >
              <Image src="/download-icon.svg" alt="Скачать" width={20} height={20} />
            </button>
            <button 
              className={styles.closeButton}
              onClick={onClose}
              title="Закрыть"
            >
              <Image src="/close-icon.svg" alt="Закрыть" width={20} height={20} />
            </button>
          </div>
        </div>
        <div className={styles.imageContainer}>
          <img 
            src={image.src} 
            alt={image.fileName || 'Изображение'} 
            className={styles.fullImage}
          />
        </div>
      </div>
    </div>
  );
} 