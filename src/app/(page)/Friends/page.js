"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect } from "react";
import FriendChat from "../components/friendChat/chat";
import FriendList from "../components/friendsList/page";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [currentFriend, setCurrentFriend] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);

  const handleFriendClick = (friendData) => {
    setCurrentFriend(friendData);
    setCurrentChatId(friendData.chatId || null);
    setShowChat(true);
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch('/api/friends/linkFriends');
        if (!response.ok) throw new Error('Failed to fetch friends');
        
        const friendsData = await response.json();
        setFriends(friendsData.friends || []);
      } catch (error) {
        console.error('Friends load error:', error);
        setError('Failed to load friends data');
      }
    };

    fetchFriends();
  }, []);

  return (
    <div className={styles.main_Container}>
      <div className={styles.mainFrame}>
        <div className={styles.friendsPage}>
          <div className={styles.rightFriend}>
            {showChat && currentFriend ? (
              <FriendChat 
                key={currentFriend.idFriend}
                idFriend={currentFriend.idFriend}
                nameFriend={currentFriend.nameFriend}
                avatarSrc={currentFriend.avatarSrc}
                onClose={() => setShowChat(false)}
                chatId={currentChatId}
              />
            ) : (
              <FriendList 
                friends={friends} 
                onFriendClick={handleFriendClick} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}