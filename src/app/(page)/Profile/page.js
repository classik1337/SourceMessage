"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect } from 'react';
import Settingprofile from "../components/settings/setProfile/setProfile";




export default function Profile() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className={styles.main_Container}>
      <div className={styles.mainFrame}>
        <div className={styles.profilePage}>
         <div className={styles.leftProfile}>
         <div className={styles.settingProfile}>
         <div className={styles.settingPrimary}>
  {/* Раздел "Аккаунт" */}
  <a className={styles.settingPrimaryHelper}>ACCOUNT SETTINGS</a>
  <div className={styles.menuSetting}>
    <a className={styles.primary} onClick={() => setShowProfile(!showProfile)}><span>Profile Information</span></a>
    <a className={styles.primary}><span>Contact Details</span></a>
    <a className={styles.primary}><span>Social Connections</span></a>
    <a className={styles.primary}><span>Account Preferences</span></a>
  </div>
  
  <div className={styles.divider} />
  
  {/* Раздел "Безопасность" */}
  <a className={styles.settingPrimaryHelper}>SECURITY</a>
  <div className={styles.menuSetting}>
    <a className={styles.primary}><span>Password & Authentication</span></a>
    <a className={styles.primary}><span>Two-Factor Auth</span></a>
    <a className={styles.primary}><span>Connected Devices</span></a>
    <a className={styles.primary}><span>Login History</span></a>
  </div>
  
  <div className={styles.divider} />
  
  {/* Раздел "Внешний вид" */}
  <a className={styles.settingPrimaryHelper}>APPEARANCE</a>
  <div className={styles.menuSetting}>
    <a className={styles.primary}><span>Theme & Colors</span></a>
    <a className={styles.primary}><span>Font Size</span></a>
    <a className={styles.primary}><span>Display Options</span></a>
    <a className={styles.primary}><span>Language</span></a>
  </div>
  
  <div className={styles.divider} />
  
  {/* Раздел "Уведомления" */}
  <a className={styles.settingPrimaryHelper}>NOTIFICATIONS</a>
  <div className={styles.menuSetting}>
    <a className={styles.primary}><span>Email Notifications</span></a>
    <a className={styles.primary}><span>Push Notifications</span></a>
    <a className={styles.primary}><span>Sound Alerts</span></a>
    <a className={styles.primary}><span>Do Not Disturb</span></a>
  </div>
</div>
        </div>
         </div>
         <div className={styles.rightProfile}>
         {showProfile && <Settingprofile />}
          {/* <a className={styles.overviewText}>Overview your profile</a>
          
          <div className={styles.userProfileTest}>
            <div className={styles.headProfile}></div>
            <Image
              className={styles.avatar}
              src={profile.avatar}
              alt="Avatar user"
              width={60}
              height={60}
              priority
            />
            
            <div className={styles.infoProfile}>
            <h3 className={styles.username}>{profile.login}</h3>
            <p className={styles.description}>{profile.description}</p>
            </div>
          </div> */}
         </div>
        </div>
      </div>
    </div>
  )};
