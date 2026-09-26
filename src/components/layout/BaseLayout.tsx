import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/auth/AuthModal';

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
      <header className="flex justify-between items-center p-4 h-16 border-b border-border bg-surface w-full shrink-0 px-6">
        <Link to="/" className="text-xl md:text-2xl font-black font-unbounded flex gap-1 items-center">
          MEME<span className="text-primary-shadow">BATTLE</span>
        </Link>
        <div className="flex gap-3 items-center">
          <Button variant="ghost" className="hidden sm:flex" size="sm">RU</Button>

          {/* If real registered user — show username + Profile button */}
          {isAuthenticated && !isGuest && user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-text-secondary hidden sm:block">{user.username}</span>
              <Button
                variant="surface"
                size="sm"
                onClick={() => navigate('/profile')}
                disabled={isLoading}
              >
                Профиль
              </Button>
            </div>
          ) : (
            /* Guest or not authenticated — show single Auth button */
            <Button
              variant="surface"
              size="sm"
              onClick={() => setIsAuthModalOpen(true)}
              disabled={isLoading}
            >
              Авторизация
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        {children}
      </main>

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}
    </div>
  );
}
