"use client"
import { useState } from 'react';
import Image from "next/image";
import styles from "./page.module.css";
import { useRouter } from 'next/navigation'; 
import { io } from 'socket.io-client';

export default function Registration() {
  const router = useRouter();
  const [error, setError] = useState('');
  const regMail = "Create your account — Start building today!";
  const logMail = "Welcome back! Log in to continue."
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
    
    if (!isLogin && !formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
        
        // Сохраняем токен и данные пользователя
      
        
        // Перенаправляем на главную страницу
        router.push('/MainFrame');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Authentication failed');
      }
    } catch (err) {

      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    switch(provider) {
      case 'vk':
        window.location.href = 'https://oauth.vk.com/authorize?client_id=YOUR_APP_ID&redirect_uri=YOUR_REDIRECT_URI&display=page&response_type=code';
        break;
      case 'google':
        window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=email profile';
        break;
      case 'github':
        window.location.href = 'https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=user';
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
      <div className={styles.header_container}>
        <div className={styles.header}>
          <div className={styles.header_logo_container}>
            <div className={styles.header_logo}>
            <Image
                className={styles.logo}
                src="/vkont.svg"
                alt="Next.js logo"
                width={40}
                height={40}
                priority
              />
            </div>
            <div className={styles.header_logo_name}>
            <a
            className={styles.menu_link}
            href=""
            target="_blank"
            rel="noopener noreferrer"
          >
            Bezdna
          </a>
            </div>
          </div>
          <div className={styles.header_menu_container}>
          <a
            className={styles.menu_link}
            href=""
            target="_blank"
            rel="noopener noreferrer"
          >
            About
          </a>
          <a
            className={styles.menu_link}
            href=""
            target="_blank"
            rel="noopener noreferrer"
          >
            About
          </a>
            <a
            className={styles.menu_link}
            href=""
            target="_blank"
            rel="noopener noreferrer"
          >
            About
          </a>
          </div>

        </div>
        <div className={styles.marquee}>
          <div className={styles.track}>
              <span>{isLogin ? logMail : regMail}</span>
              <span>{isLogin ? logMail : regMail}</span>
          </div>
        </div>
      </div>
        {/* Header section remains unchanged */}
        <div className={`${styles.container} ${isLogin ? styles.login : styles.register}`}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabButton} ${!isLogin ? styles.active : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign up
            </button>
            <button 
              className={`${styles.tabButton} ${isLogin ? styles.active : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Sign in
            </button>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            {!isLogin && (
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`${styles.input} ${errors.name ? styles.errorInput : ''}`}
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`${styles.input} ${errors.email ? styles.errorInput : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`${styles.input} ${errors.password ? styles.errorInput : ''}`}
                placeholder="Enter password (min. 6 characters)"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
            </div>
            
            {!isLogin && (
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`${styles.input} ${errors.confirmPassword ? styles.errorInput : ''}`}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
              </div>
            )}
            
            <div className={styles.formGroup}>
              <button 
                type="submit" 
                className={styles.button}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : isLogin ? 'Log in' : 'Register'}
              </button>
            </div>
            
            <label htmlFor="difference" className={styles.label}>Or</label>
            <div className={styles.formGroup2}>
              <button 
                type="button" 
                className={styles.buttonDiff}
                onClick={() => handleSocialLogin('vk')}
              >
                <Image
                  className={styles.logo}
                  src="/vkont.svg"
                  alt="VK logo"
                  width={40}
                  height={40}
                  priority
                />
              </button>
              
              <button 
                type="button" 
                className={styles.buttonDiff}
                onClick={() => handleSocialLogin('google')}
              >
                <Image
                  className={styles.logo}
                  src="/google.svg"
                  alt="Google logo"
                  width={40}
                  height={40}
                  priority
                />
              </button>
              
              <button 
                type="button" 
                className={styles.buttonDiff}
                onClick={() => handleSocialLogin('github')}
              >
                <Image
                  className={styles.logo}
                  src="/github.svg"
                  alt="GitHub logo"
                  width={40}
                  height={40}
                  priority
                />
              </button>
            </div>
          </form>
        </div>
        <div className={styles.footer_container}></div>
      </main>
    </div>
  );
}