import { BaseLayout } from '@/components/layout/BaseLayout';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <BaseLayout>
      <div className="w-full max-w-md flex flex-col gap-6 pt-4 sm:pt-8">
        <div className="flex items-center gap-3.5">
          <Button
            type="button"
            variant="surface"
            size="sm"
            onClick={() => navigate('/')}
            className="w-10 h-10 min-h-[40px] p-0 rounded-xl shrink-0"
            title="Назад"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-unbounded">Профиль</h1>
        </div>

        {user ? (
          <div className="flex flex-col gap-4">
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-2xl font-bold text-primary">
                  {user.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{user.username}</p>
                  {user.is_guest && <p className="text-sm text-text-secondary">Гостевой аккаунт</p>}
                </div>
              </div>
            </div>

            <Button
              variant="surface"
              className="w-full text-danger hover:bg-danger/20"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Выйти из аккаунта
            </Button>
          </div>
        ) : (
          <p className="text-text-secondary">Вы не авторизованы.</p>
        )}
      </div>
    </BaseLayout>
  );
}
