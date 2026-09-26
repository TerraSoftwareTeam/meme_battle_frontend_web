import { useState, useEffect } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { Button } from '@/components/ui/button';
import { PackCard, PackCardKind } from '@/components/ui/PackCard';
import { useNavigate, Outlet, useParams } from 'react-router-dom';
import { useMemePacks, useSituationPacks } from '@/api/hooks/usePacks';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

type PackFilter = 'all' | 'my' | 'memes' | 'situations';

export function Packs() {
  const navigate = useNavigate();
  const { packId } = useParams();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<PackFilter>('all');

  const { data: memePacks, isLoading: isMemesLoading } = useMemePacks();
  const { data: situationPacks, isLoading: isSituationsLoading } = useSituationPacks();

  let allPacks = [
    ...(memePacks?.map(p => ({ ...p, type: 'memes' as PackCardKind })) || []),
    ...(situationPacks?.map(p => ({ ...p, type: 'situations' as PackCardKind })) || [])
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (filter === 'memes') allPacks = allPacks.filter(p => p.type === 'memes');
  else if (filter === 'situations') allPacks = allPacks.filter(p => p.type === 'situations');
  else if (filter === 'my' && user) allPacks = allPacks.filter(p => p.author_id === user.id);

  const hasDetail = !!packId;
  const isLoading = isMemesLoading || isSituationsLoading;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const masterGrid = (
    <div className="flex flex-col gap-4 h-full w-full overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-3xl text-primary-shadow font-bold">Каталог паков</h1>
        <Button variant="secondary" className="w-auto" size="sm" onClick={() => navigate('/packs/new')}>
          Создать пак
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 hide-scrollbar">
        <Button variant={filter === 'all' ? 'primary' : 'surface'} size="sm" onClick={() => setFilter('all')}>Все</Button>
        {user && <Button variant={filter === 'my' ? 'primary' : 'surface'} size="sm" onClick={() => setFilter('my')}>Мои паки</Button>}
        <Button variant={filter === 'memes' ? 'primary' : 'surface'} size="sm" onClick={() => setFilter('memes')}>Мемы</Button>
        <Button variant={filter === 'situations' ? 'primary' : 'surface'} size="sm" onClick={() => setFilter('situations')}>Ситуации</Button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-8">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 p-3">
          {isLoading ? (
            <div className="text-text-secondary col-span-full">Загрузка...</div>
          ) : allPacks.length === 0 ? (
            <div className="text-text-secondary col-span-full">Паки не найдены</div>
          ) : allPacks.map(pack => (
            <PackCard
              key={pack.id}
              name={pack.name}
              packType={pack.type}
              languageCode={pack.language_code}
              safetyLevel={pack.safety_level}
              isOfficial={pack.is_official}
              onClick={() => navigate(`/packs/${pack.id}?type=${pack.type}`)}
              className={packId === pack.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-base' : ''}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <BaseLayout>
      <div className="w-full h-[calc(100vh-100px)] overflow-hidden flex">

        {/* Mobile layout */}
        {isMobile ? (
          <div className="w-full h-full relative">
            <div className={cn('absolute inset-0', hasDetail && 'invisible pointer-events-none')}>
              {masterGrid}
            </div>
            {hasDetail && (
              <div className="absolute inset-0 bg-base z-10">
                <Outlet />
              </div>
            )}
          </div>
        ) : (
          /* Desktop: CSS-only split, no library */
          <>
            {/* LEFT — master grid, always visible */}
            <div
              className="h-full overflow-hidden flex-shrink-0 transition-[width] duration-200"
              style={{ width: hasDetail ? '58%' : '100%' }}
            >
              {masterGrid}
            </div>

            {/* DIVIDER */}
            {hasDetail && (
              <div className="h-full w-px bg-border mx-3 shrink-0" />
            )}

            {/* RIGHT — detail, always in DOM but zero-width when closed */}
            <div
              className="h-full overflow-hidden transition-[width] duration-200"
              style={{ width: hasDetail ? '42%' : '0%' }}
            >
              <div className="w-full h-full overflow-hidden" style={{ minWidth: '350px' }}>
                <Outlet />
              </div>
            </div>
          </>
        )}

      </div>
    </BaseLayout>
  );
}
