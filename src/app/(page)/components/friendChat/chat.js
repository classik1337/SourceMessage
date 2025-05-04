"use client"
import Image from "next/image"
import styles from "./page.module.css"
import { useState, useRef, useEffect } from "react";



export default function FriendChat() {



  const messagesEndRef = useRef(null);
  const users = {
    me: {
      id: 1,
      name: "Вы",
      avatar: "/castle.jpg"
    },
    friend: {
      id: 2,
      name: "Друг",
      avatar: "/castle.jpg"
    }
  };
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! Got a minute to chat?", isMine: false },
    { id: 2, text: "Sure, what's up?", isMine: true },
    { id: 3, text: "Just wanted to check how the project is going", isMine: false },
    { id: 4, text: "Making good progress on the UI components", isMine: true },
    { id: 5, text: "That's great! Need any design feedback?", isMine: false },
    { id: 6, text: "Maybe later - still working on core functionality", isMine: true },
    { id: 7, text: "Understood. The API endpoints are ready when you need them", isMine: false },
    { id: 8, text: "Perfect, I'll integrate them tomorrow", isMine: true },
    { id: 9, text: "By the way, have you seen the new framework update?", isMine: false },
    { id: 10, text: "Not yet - worth checking out?", isMine: true },
    { id: 11, text: "Definitely! It has better TypeScript support now", isMine: false },
    { id: 12, text: "Nice! I'll update my dependencies this weekend", isMine: true },
    { id: 13, text: "How's the mobile responsiveness coming along?", isMine: false },
    { id: 14, text: "Almost done - just fixing some tablet layouts", isMine: true },
    { id: 15, text: "Awesome! Users will love the adaptive design", isMine: false },
    { id: 16, text: "Hope so! Mobile traffic is growing fast", isMine: true },
    { id: 17, text: "Exactly why we prioritized it. Smart move!", isMine: false },
    { id: 18, text: "Thanks! Your analytics reports helped make the case", isMine: true },
    { id: 19, text: "Data doesn't lie! Speaking of which, need any metrics?", isMine: false },
    { id: 20, text: "Could use conversion tracking on the new features", isMine: true },
    { id: 21, text: "I'll set up the event tracking this afternoon", isMine: false },
    { id: 22, text: "Appreciate it! That'll help with the investor demo", isMine: true },
    { id: 23, text: "About that - want to practice your pitch with me?", isMine: false },
    { id: 24, text: "That would be amazing! Free tomorrow at 2?", isMine: true },
    { id: 25, text: "Perfect, calendar invite sent", isMine: false },
    { id: 26, text: "Got it. I'll prepare some slides", isMine: true },
    { id: 27, text: "Keep it to 5 key metrics - investors love brevity", isMine: false },
    { id: 28, text: "Good tip! I'll focus on growth and retention", isMine: true },
    { id: 29, text: "Exactly. Maybe one technical differentiator too", isMine: false },
    { id: 30, text: "Our real-time algorithm would impress them", isMine: true },
    { id: 31, text: "100% - nobody else has that latency at our scale", isMine: false },
    { id: 32, text: "Our secret sauce! But shhh...", isMine: true },
    { id: 33, text: "Haha, patent pending! Anyway, lunch?", isMine: false },
    { id: 34, text: "Can't today - debugging session with the team", isMine: true },
    { id: 35, text: "No worries. Found those memory leaks yet?", isMine: false },
    { id: 36, text: "Three down, one nasty one still hiding", isMine: true },
    { id: 37, text: "Try the new profiler tool - saved me hours last week", isMine: false },
    { id: 38, text: "Will do! Thanks for the suggestion", isMine: true },
    { id: 39, text: "Anytime. Ping me if you hit a wall", isMine: false },
    { id: 40, text: "You're a lifesaver! Talk later", isMine: true }
  ]); // ваш массив сообщений

  // Функция для прокрутки вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Автопрокрутка при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Срабатывает при каждом изменении messages

  

  return (
    <div className={styles.rightFriendChat}>
    <div className={styles.userFriendChat}>
      <div className={styles.headFriendChat}>
        <div className={styles.infoFriend}>
          <div className={styles.avatarFriendContiner}>
          <Image
                className={styles.avatarFriend}
                src={"/castle.jpg"}
                alt="Аватар"
                width={30}
                height={30}
                priority
              />
          </div>
          <div className={styles.usernameFriend}>User</div>
        </div>
        <div className={styles.clickIconsHelp}>
          <div className={styles.menu_icon}>
            <Image
                className={styles.iconFriend}
                src={"/phone.svg"}
                alt="Аватар"
                width={30}
                height={30}
                priority
              />
              </div>
          <div className={styles.menu_icon}>
          <Image
                className={styles.iconFriend}
                src={"/phone.svg"}
                alt="Аватар"
                width={30}
                height={30}
                priority
              />
          </div>
          <div className={styles.menu_icon}>
          <Image
                className={styles.iconFriend}
                src={"/more-vertical.svg"}
                alt="Аватар"
                width={30}
                height={30}
                priority
              />
          </div>
        </div>
      </div>
      <div className={styles.mainChat}>
        {messages.map((message) => {
          const user = message.isMine ? users.me : users.friend;
          
          return message.isMine ? (
            // Правое сообщение (мое)
            <div key={message.id} className={`${styles.message} ${styles.rightMessage}`}>
              <div className={styles.messageContent}>
                <div className={styles.messageUsername}>{user.name}</div>
                <div className={styles.messageContentContainer}>
                  <div className={styles.messageText}>{message.text}</div>
                  <span className={styles.messageDate}>{message.time}</span>
                  <Image
                    className={styles.messageCheck}
                    src="/check.svg" 
                    alt="Прочитано"
                    width={15}
                    height={15}
                    priority
                  />
                </div>
              </div>
              <Image
                className={styles.avatar}
                src={user.avatar}
                alt="Аватар"
                width={30}
                height={30}
                priority
              />
            </div>
          ) : (
            // Левое сообщение (друга)
            <div key={message.id} className={`${styles.message} ${styles.leftMessage}`}>
              <Image
                className={styles.avatar}
                src={user.avatar}
                alt="Аватар"
                width={30}
                height={30}
                priority
              />
              <div className={styles.messageContent}>
                <div className={styles.messageUsername}>{user.name}</div>
                <div className={styles.messageContentContainer}>
                  <div className={styles.messageText}>{message.text}</div>
                  <span className={styles.messageDate}>{message.time}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
    
      <div className={styles.bottomFriendChat}>
        <a href="#add" className={styles.addButton}> 
          <Image
          className={styles.svgPic}
          src={"/plus-circle.svg"}
          alt={"userAvatar"}
          width={30}
          height={30}
          
          
          priority
          />
          </a>
        <input 
          className={styles.inputMessage}
          placeholder="Type a message..."
        />
        <a href="#send" className={styles.sendButton}>
          <Image
          className={styles.svgPic}
          src={"/arrow-right-circle.svg"}
          alt={"userAvatar"}
          width={30}
          height={30}
          priority
          /></a>
      </div>
    </div>
  </div>
  )
}