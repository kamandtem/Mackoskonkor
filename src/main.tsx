import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const AppSplash = () => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1050);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return <App />;
  return <div className="app-splash" dir="rtl" aria-label="در حال بارگذاری شمارش معکوس کنکور">
    <div className="app-splash-orbit orbit-a"/><div className="app-splash-orbit orbit-b"/>
    <img src="/branding/puzzle-icon-1024.png" alt="شمارش معکوس کنکور" />
    <span>شمارش معکوس کنکور</span><small>آرام شروع کن، پیوسته جلو برو</small>
  </div>;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppSplash />
  </StrictMode>,
);
