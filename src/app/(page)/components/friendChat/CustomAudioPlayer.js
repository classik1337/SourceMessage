"use client"
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './CustomAudioPlayer.module.css';

export default function CustomAudioPlayer({ src, fileName, fileSize }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.audioPlayer}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className={styles.audioInfo}>
        <div className={styles.fileName}>{fileName}</div>
        {fileSize && (
          <div className={styles.fileSize}>{formatFileSize(fileSize)}</div>
        )}
      </div>

      <div className={styles.controls}>
        <button 
          className={styles.playButton}
          onClick={togglePlay}
          title={isPlaying ? 'Пауза' : 'Воспроизвести'}
        >
          <Image 
            src={isPlaying ? "/pause-icon.svg" : "/play-icon.svg"} 
            alt={isPlaying ? "Пауза" : "Воспроизвести"} 
            width={24} 
            height={24} 
          />
        </button>

        <div className={styles.progressContainer}>
          <div className={styles.timeDisplay}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className={styles.progressBar} onClick={handleSeek}>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className={styles.volumeContainer}>
          <button 
            className={styles.volumeButton}
            onClick={toggleMute}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            <Image 
              src={isMuted ? "/volume-off-icon.svg" : "/volume-icon.svg"} 
              alt="Громкость" 
              width={20} 
              height={20} 
            />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
            title="Громкость"
          />
        </div>
      </div>
    </div>
  );
} 