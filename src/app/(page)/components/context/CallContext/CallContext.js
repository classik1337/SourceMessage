// context/CallContext.js
"use client"
import { createContext, useState, useContext, useEffect } from 'react';
import IncomingCallModal from '../../IncomingCallModal/IncomingCallModal';
import { useSocket } from '../SocketContext/SocketContext';

const CallContext = createContext();

export function CallProvider({ children }) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const socket = useSocket();

  // Обработка входящего звонка
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = async ({ offer, callerId, callType, callerInfo }) => {
      console.log('CallContext: Incoming call received:', { callerId, callType, callerInfo });
      
      try {
        // Если уже есть активный звонок, отклоняем входящий
        if (activeCall) {
          console.log('CallContext: Rejecting call - user is busy');
          socket.emit('call-rejected', {
            targetUserId: callerId,
            reason: 'busy'
          });
          return;
        }

        // Устанавливаем входящий звонок
        setIncomingCall({
          offer,
          callerId,
          callType,
          socket,
          callerInfo
        });

      } catch (error) {
        console.error('CallContext: Error handling incoming call:', error);
      }
    };

    const handleCallCanceled = ({ callerId }) => {
      console.log('CallContext: Call canceled by caller:', callerId);
      // Если это тот звонок, который сейчас входящий - очищаем его
      if (incomingCall?.callerId === callerId) {
        setIncomingCall(null);
      }
    };

    const handleCallRejected = ({ reason }) => {
      console.log('CallContext: Call rejected:', reason);
      if (activeCall?.status === 'calling') {
        setActiveCall(null);
      }
    };

    const handleCallEnded = ({ endedBy }) => {
      console.log('CallContext: Call ended by:', endedBy);
      setIncomingCall(null);
      setActiveCall(null);
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-canceled', handleCallCanceled);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-canceled', handleCallCanceled);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket, activeCall, incomingCall]);

  const answerCall = () => {
    if (!incomingCall) {
      console.log('CallContext: Cannot answer call - no incoming call exists');
      return;
    }

    if (!socket || !socket.connected) {
      console.log('CallContext: Cannot answer call - no socket connection');
      setIncomingCall(null);
      return;
    }
    
    console.log('CallContext: Answering call:', incomingCall);
    
    // Передаем всю информацию о звонке в активный звонок
    setActiveCall({
      ...incomingCall,
      status: 'connected',
      isIncoming: true,
      friendInfo: {
        id: incomingCall.callerId,
        name: incomingCall.callerInfo.name,
        avatar: incomingCall.callerInfo.avatar
      }
    });
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    
    console.log('CallContext: Rejecting call from:', incomingCall.callerId);
    
    // Отправляем событие об отклонении звонка
    if (incomingCall.socket) {
      incomingCall.socket.emit('call-rejected', {
        targetUserId: incomingCall.callerId
      });
    }
    
    setIncomingCall(null);
  };

  const endCall = () => {
    console.log('CallContext: Ending call');
    
    if (activeCall) {
      console.log('CallContext: Cleaning up active call:', activeCall);
      
      // Очищаем ресурсы WebRTC
      if (activeCall.peerConnection) {
        activeCall.peerConnection.close();
      }
      if (activeCall.localStream) {
        activeCall.localStream.getTracks().forEach(track => track.stop());
      }
      
      // Отправляем событие завершения звонка
      if (activeCall.socket) {
        // Если звонок еще не начался (статус 'calling'), отправляем call-canceled
        if (activeCall.status === 'calling') {
          console.log('CallContext: Canceling outgoing call');
          activeCall.socket.emit('call-canceled', {
            targetUserId: activeCall.targetId || activeCall.callerId
          });
        } else {
          // Иначе отправляем call-end
          console.log('CallContext: Ending active call');
          activeCall.socket.emit('call-end', {
            targetUserId: activeCall.targetId || activeCall.callerId
          });
        }
      }
    }
    
    // Очищаем состояния
    setActiveCall(null);
    setIncomingCall(null);
  };

  return (
    <CallContext.Provider value={{ 
      incomingCall, 
      setIncomingCall,
      activeCall,
      setActiveCall,
      answerCall,
      rejectCall,
      endCall
    }}>
      {children}
      {incomingCall && (
        <IncomingCallModal
          callerInfo={incomingCall.callerInfo}
          onAccept={answerCall}
          onReject={rejectCall}
          callType={incomingCall.callType}
        />
      )}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}