import Link from 'next/link';
import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.heroContainer}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              SourceMessage
            </h1>
            <p className={styles.description}>
              Общайтесь без границ. Наше приложение предлагает безопасный и удобный способ связи с друзьями и близкими, где бы вы ни находились.
            </p>
            <div className={styles.buttons}>
              <Link href="/Regestration" className={`${styles.button} ${styles.primary}`}>
                <Image src="/plus-circle.svg" alt="" width={22} height={22} />
                Регистрация
              </Link>
              <Link href="/Chat" className={`${styles.button} ${styles.secondary}`}>
                <Image src="/arrow-right-circle.svg" alt="" width={22} height={22} />
                Войти
              </Link>
              <Link href="https://github.com/your-repo" className={`${styles.button} ${styles.github}`}>
                <Image src="/github.svg" alt="GitHub" width={24} height={24} />
                GitHub
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.chatScreenshot}>
              <span>Предварительный просмотр чата</span>
            </div>
          </div>
        </div>
        <a href="#features" className={styles.scrollIndicator}>
          <div className={styles.arrow}></div>
        </a>
      </div>

      <section id="features" className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>Основные возможности</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <Image src="/message-icon.svg" alt="" width={40} height={40} className={styles.featureIcon} />
            <h3>Безопасные чаты</h3>
            <p>Общайтесь в личных и групповых чатах с end-to-end шифрованием.</p>
          </div>
          <div className={styles.featureCard}>
            <Image src="/phone.svg" alt="" width={40} height={40} className={styles.featureIcon} />
            <h3>Голосовые звонки</h3>
            <p>Совершайте кристально чистые и защищенные голосовые звонки по всему миру.</p>
          </div>
          <div className={styles.featureCard}>
            <Image src="/file.svg" alt="" width={40} height={40} className={styles.featureIcon} />
            <h3>Обмен файлами</h3>
            <p>Делитесь фотографиями, документами и другими файлами без ограничений.</p>
          </div>
          <div className={styles.featureCard}>
            <Image src="/friends.svg" alt="" width={40} height={40} className={styles.featureIcon} />
            <h3>Групповые чаты</h3>
            <p>Создавайте группы для общения с семьей, друзьями или коллегами.</p>
          </div>
        </div>
      </section>

      <section className={styles.showcaseSection}>
        <h2 className={styles.showcaseTitle}>Обзор приложения</h2>
        <div className={styles.showcaseItem}>
          <div className={styles.showcaseText}>
            <h3>Интуитивный интерфейс чата</h3>
            <p>Наслаждайтесь чистым и понятным интерфейсом, который не отвлекает от главного — общения. Все необходимые функции под рукой.</p>
          </div>
          <div className={styles.showcaseMockup}>
            <span>Макет страницы чата</span>
          </div>
        </div>
        <div className={`${styles.showcaseItem} ${styles.reversed}`}>
          <div className={styles.showcaseText}>
            <h3>Удобный список контактов</h3>
            <p>Легко находите друзей и управляйте своим списком контактов. Быстрый доступ к профилям и началу нового диалога.</p>
          </div>
          <div className={styles.showcaseMockup}>
            <span>Макет списка друзей</span>
          </div>
        </div>
        <div className={styles.showcaseItem}>
          <div className={styles.showcaseText}>
            <h3>Персонализация профиля</h3>
            <p>Настройте свой профиль, добавьте аватар и статус, чтобы ваши друзья всегда знали, как у вас дела.</p>
          </div>
          <div className={styles.showcaseMockup}>
            <span>Макет страницы профиля</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerColumn}>
            <h4>SourceMessage</h4>
            <p>&copy; {new Date().getFullYear()} Все права защищены.</p>
          </div>
          <div className={styles.footerColumn}>
            <h5>Документы</h5>
            <Link href="/privacy-policy" className={styles.footerLink}>Политика конфиденциальности</Link>
            <Link href="/terms-of-service" className={styles.footerLink}>Условия использования</Link>
          </div>
          <div className={styles.footerColumn}>
            <h5>Социальные сети</h5>
            <div className={styles.socialIcons}>
              <Link href="https://github.com/your-repo" className={styles.socialIconLink}>
                <Image src="/github.svg" alt="GitHub" width={24} height={24} />
              </Link>
              <Link href="https://telegram.org" className={styles.socialIconLink}>
                <Image src="/telegram.svg" alt="Telegram" width={24} height={24} />
              </Link>
              <Link href="https://vk.com" className={styles.socialIconLink}>
                <Image src="/vkont.svg" alt="VK" width={24} height={24} />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
