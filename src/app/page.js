import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Зарегестрируйтесь и войдите.
          </li>
          <li>Скачайте приложение и начните.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href=""
            target="_blank"
            rel="noopener noreferrer"
          >
            Вход
          </a>
          <a
            className={styles.primary}
            href="/Regestration"
            target="_blank"
            rel="noopener noreferrer"
          >
            Регистрация
          </a>
          <a
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Скачать
          </a>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="/MainFrame"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Main Test
        </a>
        <a
          src=""
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Soon Test
        </a>
        <a
          href=""
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Soon Test →
        </a>
      </footer>
    </div>
  );
}
