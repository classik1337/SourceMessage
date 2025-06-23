"use client"
import { createContext, useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'

const SocketContext = createContext(null)

export function SocketProvider({ children, userId }) {
  const [socket, setSocket] = useState(null)
  const [profile, setProfile] = useState({
    id: '',
    login: '',
    avatar: "",
    secondlogin: "",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile')
        if (!response.ok) throw new Error('Failed to fetch profile')
        
        const userData = await response.json()
        setProfile(prev => ({
          id: userData.id,
          login: userData.login,
          avatar: userData.avatar,
          secondlogin: userData.secondlogin
        }))
      } catch (error) {
        console.error('Profile load error:', error)
        setError('Failed to load profile data')
      }
    }

    fetchProfile()
  }, [])


  useEffect(() => {
    if (!userId) return;

    const newSocket = io('http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket'],
      upgrade: false
    });
    
    newSocket.on('connect', () => {
      console.log('Connected with socket ID:', newSocket.id, "with user", userId);
      newSocket.emit('register-user', {
        userId: userId,
        login: profile.login,
        avatar: profile.avatar,
        secondlogin: profile.secondlogin
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [userId]);
  
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context.socket
}