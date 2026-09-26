import { BaseLayout } from '@/components/layout/BaseLayout';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <BaseLayout>
      <div className="w-full max-w-md flex flex-col gap-6 pt-8">
        <h1 className="text-3xl font-bold text-primary-shadow font-unbounded">Профиль</h1>

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
