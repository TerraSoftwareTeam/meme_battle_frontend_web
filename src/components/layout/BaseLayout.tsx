import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { motion } from 'framer-motion';

export function BaseLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isGuest, isLoading, fetchMe } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchMe();
    }
  }, [isAuthenticated, user, fetchMe]);

  return (
    <div className="min-h-screen bg-base text-text-primary font-nunito flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center h-16 border-b border-border/50 bg-surface/85 backdrop-blur-md w-full shrink-0 px-4 sm:px-6 sticky top-0 z-50 shadow-[0_2px_16px_rgba(0,0,0,0.35)]">
        {/* Telegram Social Button */}
        <a
          href="https://t.me/skyfly_io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-elevated/70 border border-border/70 hover:border-[#24A1DE]/60 hover:bg-[#24A1DE]/10 transition-all group select-none"
          title="Наш Telegram-канал"
        >
          {/* Official Telegram Logo */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 transition-transform group-hover:scale-110 duration-150">
            <circle cx="12" cy="12" r="12" fill="#24A1DE"/>
            <path d="M5.4 11.96C8.94 10.42 11.3 9.41 12.48 8.92C15.86 7.52 16.56 7.27 17.02 7.26C17.12 7.26 17.35 7.29 17.49 7.41C17.61 7.51 17.65 7.64 17.66 7.74C17.68 7.83 17.7 8.05 17.68 8.22C17.5 10.11 16.73 14.68 16.33 16.78C16.17 17.67 15.84 17.97 15.52 18C14.83 18.06 14.3 17.55 13.64 17.11C12.59 16.42 12 15.99 10.98 15.33C9.81 14.55 10.57 14.13 11.24 13.43C11.41 13.25 14.45 10.49 14.51 10.24C14.52 10.21 14.52 10.1 14.45 10.03C14.38 9.97 14.28 9.99 14.21 10.01C14.1 10.03 12.42 11.14 9.16 13.34C8.68 13.67 8.25 13.83 7.86 13.82C7.44 13.81 6.62 13.58 6.01 13.38C5.26 13.14 4.66 13.01 4.71 12.6C4.74 12.38 5.04 12.16 5.4 11.96Z" fill="white"/>
          </svg>
          <span className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-white transition-colors">
            Мы в соцсетях
          </span>
        </a>

        {/* Right side: Auth / Profile */}
        <div className="flex gap-3 items-center">
          {isAuthenticated && !isGuest && user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-elevated/70 rounded-full border border-border/70">
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white">{user.username}</span>
              </div>
              <Button
                variant="surface"
                size="sm"
                onClick={() => navigate('/profile')}
                disabled={isLoading}
                className="w-auto"
              >
                Профиль
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAuthModalOpen(true)}
              disabled={isLoading}
              className="w-auto"
            >
              Войти
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        <motion.div
          className="w-full flex flex-col items-center flex-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}
    </div>
  );
}
