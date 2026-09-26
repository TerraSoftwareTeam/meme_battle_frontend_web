import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMemePack, useSituationPack } from '@/api/hooks/usePacks';

export function PackDetails() {
  const { packId } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') as 'memes' | 'situations' | null;
  const navigate = useNavigate();

  const { data: memePackDetails, isLoading: isMemeLoading, isError: isMemeError } = useMemePack(type === 'memes' ? packId : undefined);
  const { data: situationPackDetails, isLoading: isSituationLoading, isError: isSituationError } = useSituationPack(type === 'situations' ? packId : undefined);

  const isLoading = (type === 'memes' && isMemeLoading) || (type === 'situations' && isSituationLoading);
  const isError = (type === 'memes' && isMemeError) || (type === 'situations' && isSituationError) || (!type);

  const pack = type === 'memes' ? memePackDetails?.pack : situationPackDetails?.pack;
  const memes = memePackDetails?.memes || [];
  const situations = situationPackDetails?.situations || [];
  const itemsCount = type === 'memes' ? memes.length : situations.length;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-surface md:rounded-2xl md:border border-border shadow-xl overflow-hidden p-8 items-center justify-center">
        <span className="text-text-secondary">Загрузка...</span>
      </div>
    );
  }

  if (isError || !pack) {
    return (
      <div className="flex flex-col h-full bg-surface md:rounded-2xl md:border border-border shadow-xl overflow-hidden p-8 items-center justify-center">
        <span className="text-text-secondary">Не удалось загрузить пак</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface md:rounded-2xl md:border border-border shadow-xl overflow-hidden">
      <div className="flex items-center gap-4 p-4 border-b border-border bg-black/20 shrink-0">
        <button 
          className="md:hidden p-2 -ml-2 rounded-full hover:bg-black/20 transition-colors"
          onClick={() => navigate('/packs')}
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col overflow-hidden">
          <h2 className="text-xl font-bold truncate">{pack.name}</h2>
          <span className="text-xs text-text-secondary">{itemsCount} элементов</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-base">
        {pack.description && (
          <p className="text-sm text-text-secondary mb-2">{pack.description}</p>
        )}
        
        <div className={type === 'memes' ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
          {type === 'memes' && memes.map(meme => (
            <div key={meme.id} className="aspect-square bg-black/40 rounded-xl overflow-hidden border border-border">
              <img src={meme.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}

          {type === 'situations' && situations.map(sit => (
            <div key={sit.id} className="p-3 bg-black/40 rounded-xl border border-border text-sm">
              {sit.prompt_text}
            </div>
          ))}
          
          {itemsCount === 0 && (
            <div className="col-span-full py-8 text-center text-text-secondary text-sm">
              В этом паке пока ничего нет
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border bg-surface shrink-0">
        <Button 
          className="w-full" 
          onClick={() => navigate(`/game/new?${type === 'memes' ? 'memePack' : 'situationPack'}=${packId}`)}
        >
          Добавить в свою игру
        </Button>
      </div>
    </div>
  );
}
