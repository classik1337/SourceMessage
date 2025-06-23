"use client"
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import { useSocket } from '../context/SocketContext/SocketContext';
import { useCall } from '../context/CallContext/CallContext';

export default function CallFriend({ profile, idFriend, avatarSrc, onEndCall, isIncoming, offer }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const socket = useSocket();
  const { activeCall, setActiveCall, endCall } = useCall();
  const [peerConnection, setPeerConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [callType, setCallType] = useState(activeCall?.callType || 'video');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const cleanupFunctionsRef = useRef([]);

  useEffect(() => {
    if (isIncoming && offer) {
      handleIncomingCall({ offer, callType: activeCall?.callType });
    }
  }, [isIncoming, offer]);

  // Добавляем эффект для инициализации звонка
  useEffect(() => {
    if (!isIncoming && activeCall?.status === 'calling') {
      startCall(activeCall.callType || 'audio');
    }
  }, [activeCall?.status]);

  // Инициализация WebRTC
  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetUserId: idFriend,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = async (event) => {
      const stream = event.streams[0];
      
      if (event.track.kind === 'audio') {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          try {
            await remoteAudioRef.current.play();
          } catch (error) {
            console.error('Error playing remote audio:', error);
          }
        }
        
        setRemoteStream(stream);
        setupVoiceDetection(stream, true);
      }
      
      if (event.track.kind === 'video') {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setHasRemoteVideo(true);
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  const setupVoiceDetection = (stream, isRemote) => {
    try {
      if (!stream || stream.getAudioTracks().length === 0) {
        return;
      }

      // Создаем новый AudioContext только если его еще нет
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      
      analyser.fftSize = 2048;
      analyser.minDecibels = -70;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.2;
      
      source.connect(analyser);

      // Подключаем gainNode только для удаленного аудио
      if (isRemote) {
        source.connect(gainNode);
        gainNode.gain.value = 1.0;
        gainNode.connect(audioContext.destination);
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let animationFrame;
      let speakingTimeout;

      const checkAudioLevel = () => {
        if ((isRemote && !remoteStream) || (!isRemote && !localStream)) {
          cancelAnimationFrame(animationFrame);
          return;
        }

        // Проверяем состояние треков
        const tracks = isRemote ? remoteStream.getAudioTracks() : localStream.getAudioTracks();
        if (tracks.length === 0 || !tracks[0].enabled) {
          if (isRemote) {
            setIsRemoteSpeaking(false);
          } else {
            setIsLocalSpeaking(false);
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        const average = Array.from(dataArray).reduce((a, b) => a + b) / dataArray.length;
        const isSpeaking = average > 25;

        if (isRemote) {
          if (isSpeaking) {
            clearTimeout(speakingTimeout);
            setIsRemoteSpeaking(true);
          } else {
            clearTimeout(speakingTimeout);
            speakingTimeout = setTimeout(() => setIsRemoteSpeaking(false), 500);
          }
        } else {
          if (isSpeaking && !isAudioMuted) {
            clearTimeout(speakingTimeout);
            setIsLocalSpeaking(true);
          } else {
            clearTimeout(speakingTimeout);
            speakingTimeout = setTimeout(() => setIsLocalSpeaking(false), 500);
          }
        }

        animationFrame = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();

      const cleanup = () => {
        cancelAnimationFrame(animationFrame);
        clearTimeout(speakingTimeout);
        source.disconnect();
        if (isRemote) {
          gainNode.disconnect();
        }
        analyser.disconnect();
      };

      cleanupFunctionsRef.current.push(cleanup);
      return cleanup;
    } catch (error) {
      console.error('Error in setupVoiceDetection:', error);
    }
  };

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current = [];
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Обновляем функцию startCall
  const startCall = async (type = 'video') => {
    if (!socket) {
      console.error('Socket connection not available');
      return;
    }

    try {
      setCallType(type);
      
      // Проверяем поддержку getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Проверяем, запущен ли сайт в безопасном контексте
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('getUserMedia requires secure context (HTTPS or localhost)');
      }

      console.log('Requesting media access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: type === 'video'
      });

      console.log('Media access granted:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      });

      const pc = initializePeerConnection();
      setLocalStream(stream);

      // Настраиваем локальное видео
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }

      // Добавляем треки в peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', {
          kind: track.kind,
          id: track.id,
          enabled: track.enabled
        });
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video'
      });

      await pc.setLocalDescription(offer);

      console.log('Emitting call-initiate event:', {
        targetUserId: idFriend,
        callType: type
      });

      socket.emit('call-initiate', {
        targetUserId: idFriend,
        offer: offer,
        callerId: profile.id,
        callType: type
      });

      // Обновляем состояние звонка
      setActiveCall(prev => ({
        ...prev,
        targetId: idFriend,
        callType: type,
        status: 'calling',
        peerConnection: pc,
        localStream: stream
      }));

    } catch (error) {
      console.error('Error starting call:', error);
      cleanupResources();
      if (onEndCall) onEndCall();
      
      // Показываем пользователю понятное сообщение об ошибке
      let errorMessage = 'Не удалось начать звонок: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Необходимо разрешить доступ к камере и микрофону';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Камера или микрофон не найдены';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Камера или микрофон уже используются другим приложением';
      } else {
        errorMessage += error.message || 'Неизвестная ошибка';
      }
      
      // Здесь можно добавить вывод ошибки пользователю через UI
      console.error(errorMessage);
    }
  };

  // Обновляем функцию cleanupResources
  const cleanupResources = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    setRemoteStream(null);
  };

  // Обновляем handleEndCall
  const handleEndCall = () => {
    if (socket && (activeCall?.targetId || activeCall?.callerId)) {
      socket.emit('call-end', {
        targetUserId: activeCall.targetId || activeCall.callerId
      });
    }

    // Очищаем все ресурсы
    cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    cleanupFunctionsRef.current = [];

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    endCall();
    if (onEndCall) onEndCall();
  };

  // Ответ на входящий звонок
  const handleIncomingCall = async ({ offer, callType }) => {
    try {
      setCallType(callType);
      
      // Проверяем поддержку getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      console.log('Requesting media access for incoming call...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: callType === 'video'
      });
      
      console.log('Media access granted for incoming call:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      });
      
      const pc = initializePeerConnection();
      setLocalStream(stream);

      // Настраиваем локальное видео для видеозвонка
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }

      // Добавляем треки в peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track to peer connection for incoming call:', {
          kind: track.kind,
          id: track.id,
          enabled: track.enabled
        });
        pc.addTrack(track, stream);
      });

      console.log('Setting remote description for incoming call...');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      console.log('Creating answer...');
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });
      
      console.log('Setting local description...');
      await pc.setLocalDescription(answer);

      console.log('Sending call-answer event...');
      socket.emit('call-answer', {
        targetUserId: idFriend,
        answer
      });

      // Обновляем состояние звонка
      setActiveCall(prev => ({
        ...prev,
        status: 'connected',
        peerConnection: pc,
        localStream: stream
      }));

    } catch (error) {
      console.error('Error handling incoming call:', error);
      
      // Показываем пользователю понятное сообщение об ошибке
      let errorMessage = 'Не удалось принять звонок: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Необходимо разрешить доступ к камере и микрофону';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Камера или микрофон не найдены';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Камера или микрофон уже используются другим приложением';
      } else {
        errorMessage += error.message || 'Неизвестная ошибка';
      }
      
      console.error(errorMessage);
      handleEndCall();
    }
  };

  // Переключение видео/аудио
  const toggleMedia = (type) => {
    try {
      if (!localStream) {
        return;
      }

      const tracks = type === 'video' 
        ? localStream.getVideoTracks() 
        : localStream.getAudioTracks();

      if (tracks.length === 0) {
        return;
      }

      const newEnabled = !tracks[0].enabled;

      // Отключаем все треки данного типа
      tracks.forEach(track => {
        track.enabled = newEnabled;
      });

      if (type === 'video') {
        setIsVideoMuted(!newEnabled);
      } else {
        setIsAudioMuted(!newEnabled);
        
        // При изменении состояния микрофона
        if (!newEnabled) {
          // Выключение микрофона
          setIsLocalSpeaking(false);
        } else {
          // Включение микрофона - пересоздаем определение голоса
          if (localStream) {
            cleanupFunctionsRef.current.forEach(cleanup => cleanup());
            cleanupFunctionsRef.current = [];
            const cleanup = setupVoiceActivityDetection(localStream, setIsLocalSpeaking, false);
            if (cleanup) cleanupFunctionsRef.current.push(cleanup);
          }
        }
        
        // Отправляем состояние микрофона другому участнику
        if (socket) {
          socket.emit('audio-state-change', {
            targetUserId: idFriend,
            isMuted: !newEnabled
          });
        }
      }

    } catch (error) {
      console.error('Error toggling media:', error);
    }
  };

  // Эффекты для обработки событий сокета
  useEffect(() => {
    if (!socket) return;

    const handlers = {
      'call-answer': ({ answer }) => {
        if (peerConnection && activeCall?.status === 'calling') {
          peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
            .then(() => {
              setActiveCall(prev => ({ ...prev, status: 'connected' }));
            })
            .catch(console.error);
        }
      },
      'ice-candidate': ({ candidate }) => {
        if (peerConnection && candidate) {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(console.error);
        }
      },
      'call-rejected': () => {
        cleanupResources();
        endCall();
        if (onEndCall) {
          onEndCall();
        }
      },
      'call-end': () => {
        cleanupResources();
        endCall();
        if (onEndCall) {
          onEndCall();
        }
      },
      'remote-video-status': ({ hasVideo }) => setHasRemoteVideo(hasVideo),
      'audio-state-change': ({ isMuted }) => {
        if (remoteStream) {
          const audioTracks = remoteStream.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = !isMuted;
          });
          
          if (isMuted) {
            setIsRemoteSpeaking(false);
          }
          
          if (audioContextRef.current) {
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = isMuted ? 0 : 1;
          }
        }
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, peerConnection, activeCall, onEndCall, endCall, remoteStream]);

  // Обработка входящего звонка при монтировании компонента
  useEffect(() => {
    if (activeCall?.status === 'incoming' && activeCall.offer) {
      handleIncomingCall(activeCall);
    }
  }, [activeCall]);

  // Добавляем функцию диагностики
  const diagnoseAudioIssues = async () => {
    console.group('🎤 Audio Diagnostic Report');
    
    try {
      // Проверяем состояние ICE соединения
      if (peerConnection) {
        console.log('Connection Details:', {
          iceConnectionState: peerConnection.iceConnectionState,
          iceGatheringState: peerConnection.iceGatheringState,
          connectionState: peerConnection.connectionState,
          signalingState: peerConnection.signalingState
        });

        // Получаем статистику соединения
        const stats = await peerConnection.getStats();
        const connectionStats = {
          candidates: [],
          pairs: [],
          inboundRtp: [],
          outboundRtp: []
        };

        stats.forEach(report => {
          if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
            connectionStats.candidates.push({
              type: report.type,
              protocol: report.protocol,
              address: report.address,
              port: report.port,
              candidateType: report.candidateType
            });
          } else if (report.type === 'candidate-pair') {
            connectionStats.pairs.push({
              selected: report.selected,
              state: report.state,
              localCandidateId: report.localCandidateId,
              remoteCandidateId: report.remoteCandidateId
            });
          } else if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            connectionStats.inboundRtp.push({
              packetsReceived: report.packetsReceived,
              packetsLost: report.packetsLost,
              jitter: report.jitter
            });
          } else if (report.type === 'outbound-rtp' && report.kind === 'audio') {
            connectionStats.outboundRtp.push({
              packetsSent: report.packetsSent,
              bytesSent: report.bytesSent
            });
          }
        });

        console.log('WebRTC Connection Stats:', connectionStats);
      }

      // Проверяем локальный поток
      if (localStream) {
        const localAudioTracks = localStream.getAudioTracks();
        console.log('Local Stream Details:', {
          exists: true,
          active: localStream.active,
          id: localStream.id,
          audioTracks: localAudioTracks.map(track => ({
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            label: track.label,
            constraints: track.getConstraints(),
            settings: track.getSettings()
          }))
        });
      }

      // Проверяем удаленный поток
      if (remoteStream) {
        const remoteAudioTracks = remoteStream.getAudioTracks();
        console.log('Remote Stream Details:', {
          exists: true,
          active: remoteStream.active,
          id: remoteStream.id,
          audioTracks: remoteAudioTracks.map(track => ({
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            label: track.label
          }))
        });
      }

      // Проверяем аудио элемент
      if (remoteAudioRef.current) {
        const audioEl = remoteAudioRef.current;
        const srcObject = audioEl.srcObject;
        
        console.log('Audio Element Details:', {
          paused: audioEl.paused,
          currentTime: audioEl.currentTime,
          volume: audioEl.volume,
          muted: audioEl.muted,
          readyState: audioEl.readyState,
          srcObject: srcObject ? {
            active: srcObject.active,
            id: srcObject.id,
            trackCount: srcObject.getTracks().length,
            audioTracks: srcObject.getAudioTracks().map(track => ({
              id: track.id,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              label: track.label
            }))
          } : 'missing'
        });

        // Проверяем уровень звука только если есть srcObject
        if (srcObject && srcObject.getAudioTracks().length > 0) {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(srcObject);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            console.log('Audio Level:', {
              average,
              peak: Math.max(...dataArray),
              hasSound: average > 0
            });

            // Очищаем ресурсы
            source.disconnect();
            audioContext.close();
          } catch (error) {
            console.error('Error analyzing audio level:', error);
          }
        } else {
          console.log('Cannot analyze audio level: no valid audio source');
        }
      }

    } catch (error) {
      console.error('Error during diagnosis:', error);
    } finally {
      console.groupEnd();
    }
  };

  // Обновляем панель диагностики
  const DiagnosticPanel = () => (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      padding: '10px',
      borderRadius: '5px',
      color: 'white',
      fontSize: '12px'
    }}>
      <div>Audio Debug Panel</div>
      <div style={{ marginTop: '5px' }}>
        <button 
          onClick={diagnoseAudioIssues}
          style={{ marginRight: '5px', padding: '5px' }}
        >
          Run Diagnostic
        </button>
        <button 
          onClick={() => {
            if (remoteAudioRef.current && remoteStream) {
              // Создаем новый MediaStream только для аудио
              const audioTracks = remoteStream.getAudioTracks();
              if (audioTracks.length > 0) {
                const audioStream = new MediaStream(audioTracks);
                initializeAudioElement(remoteAudioRef.current, audioStream);
                console.log('Forced audio reinitialize with new stream');
                diagnoseAudioIssues();
              }
            }
          }}
          style={{ marginRight: '5px', padding: '5px' }}
        >
          Reinitialize Audio
        </button>
        <button
          onClick={() => {
            if (remoteStream) {
              const audioTracks = remoteStream.getAudioTracks();
              audioTracks.forEach(track => {
                track.enabled = true;
                console.log(`Enabled track ${track.id}`);
              });
              
              if (remoteAudioRef.current) {
                remoteAudioRef.current.volume = 1.0;
                remoteAudioRef.current.muted = false;
                remoteAudioRef.current.play().catch(console.error);
              }
              
              console.log('Forced audio unmute');
              diagnoseAudioIssues();
            }
          }}
          style={{ padding: '5px' }}
        >
          Force Unmute
        </button>
      </div>
      <div style={{ marginTop: '5px' }}>
        Connection: {peerConnection?.connectionState || 'N/A'}
      </div>
      <div>
        Audio Tracks: {remoteStream?.getAudioTracks().length || 0}
      </div>
      <div>
        ICE State: {peerConnection?.iceConnectionState || 'N/A'}
      </div>
      <div>
        Audio State: {remoteAudioRef.current ? 
          (remoteAudioRef.current.paused ? 'Paused' : 'Playing') : 'N/A'}
      </div>
    </div>
  );

  const initializeAudioElement = (audioEl, stream) => {
    if (!audioEl || !stream) {
      console.error('Missing audio element or stream:', { audioEl: !!audioEl, stream: !!stream });
      return;
    }
    
    console.log('Initializing audio element with stream:', {
      streamActive: stream.active,
      audioTracks: stream.getAudioTracks().map(track => ({
        id: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      }))
    });

    try {
      // Создаем новый элемент audio
      const newAudio = document.createElement('audio');
      newAudio.autoplay = true;
      newAudio.playsInline = true;
      newAudio.controls = true;
      newAudio.volume = 1.0;
      
      // Копируем стили и позицию
      Object.assign(newAudio.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: '1000'
      });
      
      // Подключаем поток к новому элементу
      newAudio.srcObject = stream;
      
      // Добавляем обработчики событий
      newAudio.onloadedmetadata = () => {
        console.log('Audio metadata loaded, attempting to play');
        newAudio.play().catch(e => console.error('Error playing after metadata loaded:', e));
      };

      newAudio.oncanplay = () => {
        console.log('Audio can play, attempting to play');
        newAudio.play().catch(e => console.error('Error playing when ready:', e));
      };

      newAudio.onplaying = () => {
        console.log('Audio started playing successfully');
        console.log('Audio state after playing started:', {
          paused: newAudio.paused,
          currentTime: newAudio.currentTime,
          volume: newAudio.volume,
          muted: newAudio.muted,
          readyState: newAudio.readyState
        });
      };

      newAudio.onwaiting = () => console.log('Audio is waiting for more data');
      newAudio.onstalled = () => console.log('Audio playback has stalled');
      newAudio.onerror = (e) => console.error('Audio error:', e);

      // Заменяем старый элемент новым
      if (audioEl.parentNode) {
        audioEl.parentNode.replaceChild(newAudio, audioEl);
        remoteAudioRef.current = newAudio;
      }

      // Пробуем воспроизвести
      const playPromise = newAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
          // Пробуем воспроизвести после короткой задержки
          setTimeout(() => {
            newAudio.play().catch(e => {
              console.error('Still cannot play audio after delay:', e);
              // Пробуем альтернативный подход с новым контекстом воспроизведения
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const source = audioContext.createMediaStreamSource(stream);
              const dest = audioContext.createMediaStreamDestination();
              source.connect(dest);
              newAudio.srcObject = dest.stream;
              newAudio.play().catch(console.error);
            });
          }, 1000);
        });
      }

    } catch (error) {
      console.error('Error initializing audio element:', error);
    }
  };

  const monitorAudioStream = (stream) => {
    if (!stream) {
      console.error('No stream provided for monitoring');
      return null;
    }
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Проверяем наличие аудиотреков
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.error('No audio tracks in stream');
        return null;
      }

      console.log('Setting up audio monitoring for tracks:', audioTracks.map(track => ({
        id: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      })));

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudio = () => {
        if (audioContext.state === 'closed') {
          console.log('AudioContext was closed, stopping monitoring');
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        if (average > 0) {
          console.log('Audio level detected:', {
            average,
            peak: Math.max(...dataArray),
            time: new Date().toISOString()
          });
        }
        
        requestAnimationFrame(checkAudio);
      };
      
      checkAudio();
      
      return () => {
        try {
          source.disconnect();
          audioContext.close();
          console.log('Audio monitoring cleaned up successfully');
        } catch (error) {
          console.error('Error cleaning up audio monitoring:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up audio monitoring:', error);
      return null;
    }
  };

  const setupVoiceActivityDetection = (stream, setIsSpeaking, isRemote = false) => {
    try {
      if (!stream || !stream.getAudioTracks().length) {
        return null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      const gainNode = ctx.createGain();
      
      analyser.fftSize = 256;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      source.connect(analyser);
      if (isRemote) {
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.value = 1.0;
      }
      
      let speaking = false;
      let animationFrameId = null;
      
      const checkAudioLevel = () => {
        const tracks = stream.getAudioTracks();
        const isEnabled = tracks.some(track => track.enabled);
        
        if (!isEnabled || !stream.active || ctx.state === 'closed') {
          if (speaking) {
            speaking = false;
            setIsSpeaking(false);
          }
          animationFrameId = requestAnimationFrame(checkAudioLevel);
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const isSpeakingNow = average > 15;
        
        if (isSpeakingNow !== speaking) {
          speaking = isSpeakingNow;
          setIsSpeaking(speaking);
        }
        
        animationFrameId = requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
      
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        source.disconnect();
        gainNode.disconnect();
        setIsSpeaking(false);
      };
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (localStream) {
      console.log('Setting up local stream monitoring:', {
        streamActive: localStream.active,
        audioTracks: localStream.getAudioTracks().length
      });
      const cleanup = setupVoiceActivityDetection(localStream, setIsLocalSpeaking, false);
      if (cleanup) cleanupFunctionsRef.current.push(cleanup);
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      console.log('Setting up remote stream monitoring:', {
        streamActive: remoteStream.active,
        audioTracks: remoteStream.getAudioTracks().length
      });
      const cleanup = setupVoiceActivityDetection(remoteStream, setIsRemoteSpeaking, true);
      if (cleanup) cleanupFunctionsRef.current.push(cleanup);
    }
  }, [remoteStream]);

  return (
    <div className={styles.callContainer}>
      <div className={styles.callVideoContainer}>
        {/* Аудио элемент для удаленного звука */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
        />
        
        {callType === 'video' ? (
          <div className={styles.videoStream}>
            <div className={styles.remoteVideoWrapper}>
              {hasRemoteVideo ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={styles.remoteVideo}
                />
              ) : (
                <div className={styles.videoPlaceholder}>
                  <Image
                    src={avatarSrc}
                    alt="Аватар друга"
                    width={200}
                    height={200}
                    className={`${styles.videoAvatar} ${!isIncoming && activeCall?.status === 'calling' ? styles.pulsing : ''} ${isRemoteSpeaking ? styles.speaking : ''}`}
                  />
                </div>
              )}
            </div>

            <div className={styles.localVideoWrapper}>
              {localStream && callType === 'video' && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={styles.localVideo}
                />
              )}
            </div>
          </div>
        ) : (
          <div className={styles.audioCallContainer}>
            <div className={styles.audioAvatars}>
              <div className={`${styles.avatarWrapper} ${isLocalSpeaking && !isAudioMuted ? styles.speaking : ''}`}>
                <Image
                  src={profile.avatar}
                  alt="Мой аватар"
                  width={120}
                  height={120}
                  className={styles.audioAvatar}
                />
                {isAudioMuted && (
                  <div className={styles.mutedIndicator}>
                    <Image  
                      src="/mic-off.svg"
                      alt="Микрофон выключен"
                      width={24}
                      height={24}
                    />
                  </div>
                )}
              </div>
              <div className={`${styles.avatarWrapper} ${isRemoteSpeaking ? styles.speaking : ''}`}>
                <Image
                  src={avatarSrc}
                  alt="Аватар друга"
                  width={120}
                  height={120}
                  className={`${styles.audioAvatar} ${!isIncoming && activeCall?.status === 'calling' ? styles.pulsing : ''}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.callControls}>
        <button className={styles.callButton} onClick={handleEndCall}>
          <Image src="/phone-off.svg" alt="Завершить" width={30} height={30} />
        </button>
        
        {callType === 'video' && (
          <button 
            className={`${styles.callButton} ${isVideoMuted ? styles.muted : ''}`} 
            onClick={() => toggleMedia('video')}
          >
            <Image 
              src={isVideoMuted ? "/video-off.svg" : "/video.svg"} 
              alt={isVideoMuted ? "Включить видео" : "Выключить видео"} 
              width={30} 
              height={30} 
            />
          </button>
        )}
        
        <button 
          className={`${styles.callButton} ${isAudioMuted ? styles.muted : ''}`} 
          onClick={() => toggleMedia('audio')}
        >
          <Image 
            src={isAudioMuted ? "/mic-off.svg" : "/mic.svg"} 
            alt={isAudioMuted ? "Включить микрофон" : "Выключить микрофон"} 
            width={30} 
            height={30} 
          />
        </button>
      </div>
    </div>
  );
}
