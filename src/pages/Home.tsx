import { BaseLayout } from '@/components/layout/BaseLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();

  return (
    <BaseLayout>
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md gap-8">
        
        <div className="flex flex-col w-full gap-4">
          <Button onClick={() => navigate('/game/new')} className="text-xl h-16">Создать игру</Button>
          <Button variant="secondary" onClick={() => navigate('/lobbies')} className="text-xl h-16">Список лобби</Button>
          <Button variant="surface" onClick={() => navigate('/packs')} className="text-xl h-16">Каталог паков</Button>
        </div>
      </div>
    </BaseLayout>
  );
}
