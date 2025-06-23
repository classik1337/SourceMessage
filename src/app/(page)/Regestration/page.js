"use client"
import { useState } from 'react';
import Image from "next/image";
import styles from "./page.module.css";
import { useRouter } from 'next/navigation'; 

export default function Registration() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!isLogin && !formData.name.trim()) newErrors.name = 'Требуется имя';
    if (!formData.email.trim()) {
      newErrors.email = 'Требуется email';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }
    if (!formData.password) {
      newErrors.password = 'Требуется пароль';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать не менее 6 символов';
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;
    
    setIsSubmitting(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email: formData.email, password: formData.password }
      : { 
          name: formData.name, 
          email: formData.email, 
          password: formData.password 
        };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.socket && data.socket.token) {
          localStorage.setItem('token', data.socket.token);
        }
        router.push('/MainFrame');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Ошибка аутентификации');
      }
    } catch (err) {
      setError('Ошибка сети. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Логика для входа через соцсети
  };

  return (
    <div className={styles.page}>
        <div className={styles.marquee}>
            <div className={styles.track}>
                <p>Добро пожаловать в SourceMessage • Безопасное общение • Обмен файлами • Голосовые звонки •</p>
                <p>Добро пожаловать в SourceMessage • Безопасное общение • Обмен файлами • Голосовые звонки •</p>
            </div>
        </div>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <a href="/" className={styles.backLink}>
            &larr; На главную
        </a>
        <div className={styles.container}>
          <div className={styles.logoWrapper}>
              <Image src="/message-icon.svg" alt="SourceMessage Logo" width={32} height={32} />
          </div>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabButton} ${!isLogin ? styles.active : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Регистрация
            </button>
            <button 
              className={`${styles.tabButton} ${isLogin ? styles.active : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Вход
            </button>
          </div>

          <h2 className={styles.title}>{isLogin ? 'С возвращением!' : 'Создайте аккаунт'}</h2>
          <p className={styles.subtitle}>{isLogin ? 'Войдите, чтобы продолжить' : 'Присоединяйтесь к нам сегодня'}</p>

          {error && <div className={styles.errorMessageGlobal}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            {!isLogin && (
              <div className={styles.formGroup}>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`${styles.input} ${errors.name ? styles.errorInput : ''}`}
                  placeholder=" "
                  value={formData.name}
                  onChange={handleChange}
                />
                <label htmlFor="name" className={styles.label}>Имя</label>
                {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
              </div>
            )}
            
            <div className={styles.formGroup}>
              <input
                type="email"
                id="email"
                name="email"
                className={`${styles.input} ${errors.email ? styles.errorInput : ''}`}
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
              />
              <label htmlFor="email" className={styles.label}>Email</label>
              {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <input
                type="password"
                id="password"
                name="password"
                className={`${styles.input} ${errors.password ? styles.errorInput : ''}`}
                placeholder=" "
                value={formData.password}
                onChange={handleChange}
              />
              <label htmlFor="password" className={styles.label}>Пароль</label>
              {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
            </div>
            
            {!isLogin && (
              <div className={styles.formGroup}>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`${styles.input} ${errors.confirmPassword ? styles.errorInput : ''}`}
                  placeholder=" "
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <label htmlFor="confirmPassword" className={styles.label}>Подтвердите пароль</label>
                {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
              </div>
            )}
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Выполняется...' : isLogin ? 'Войти' : 'Создать аккаунт'}
            </button>
            
            <div className={styles.divider}>
                <span>Или войдите с помощью</span>
            </div>

            <div className={styles.socialLogins}>
              <button 
                type="button" 
                className={styles.socialButton}
                onClick={() => handleSocialLogin('google')}
              >
                <Image src="/google.svg" alt="Google" width={24} height={24}/>
              </button>
              
              <button 
                type="button" 
                className={styles.socialButton}
                onClick={() => handleSocialLogin('github')}
              >
                <Image src="/github.svg" alt="GitHub" width={24} height={24} />
              </button>

              <button 
                type="button" 
                className={styles.socialButton}
                onClick={() => handleSocialLogin('vk')}
              >
                <Image src="/vkont.svg" alt="VK" width={24} height={24} />
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}