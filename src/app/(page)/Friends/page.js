import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect } from "react";
import FriendChat from "../components/friendChat/chat";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [currentFriend, setCurrentFriend] = useState(null);

  const handleFriendClick = (friendData) => {
    setCurrentFriend(friendData);
    setShowChat(true);
  };

  const MenuItem = ({ 
    avatarSrc = "/castle.jpg", 
    nameFriend = "NameFriends",
    idFriend = "#1",
    onClick
  }) => (
    <div className={styles.menuItem}>
      <Image
        className={styles.avatar}
        src={avatarSrc}
        alt={"userAvatar"}
        width={30}
        height={30}
        priority
      />
      <a 
        className={styles.menuText} 
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }} 
        href={`#${idFriend}`}
      >
        {nameFriend}
      </a>
    </div>
  );

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch('/api/friends/linkFriends');
        if (!response.ok) throw new Error('Failed to fetch friends');
        
        const friendsData = await response.json();
        setFriends(friendsData);
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
          <div className={styles.leftFriends}>
            <div className={styles.settingFriends}>
              <div className={styles.settingPrimary}>
                <a className={styles.settingPrimaryHelper}>YOUR FRIENDS</a>
                
                {error ? (
                  <div className={styles.error}>{error}</div>
                ) : friends.length > 0 ? (
                  friends.map(friend => (
                    <MenuItem 
                      key={friend.friend_id}
                      avatarSrc={friend.avatar || "/castle.jpg"}
                      nameFriend={friend.secondlogin || "No name"}
                      idFriend={friend.friend_id}
                      onClick={() => {
                        handleFriendClick({
                          idFriend: friend.friend_id,
                          nameFriend: friend.secondlogin,
                          avatarSrc: friend.avatar || "/castle.jpg"
                        });
                        
                      }}
                    />
                  ))
                ) : (
                  <div>No friends found</div>
                )}
                
                <div className={styles.divider} />
              </div>
            </div>
          </div>
          <div className={styles.rightFriend}>
            {showChat && currentFriend && (
              <FriendChat 
                key={currentFriend.idFriend}
                idFriend={currentFriend.idFriend}
                nameFriend={currentFriend.nameFriend}
                avatarSrc={currentFriend.avatarSrc}
                onClose={() => setShowChat(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}