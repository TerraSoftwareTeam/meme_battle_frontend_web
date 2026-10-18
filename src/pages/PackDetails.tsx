import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Pencil, Trash2, Globe, Lock, AlertTriangle } from 'lucide-react';
import { useMemePack, useSituationPack, useDeleteMemePack, useDeleteSituationPack } from '@/api/hooks/usePacks';
import { useAuthStore } from '@/store/authStore';

export function PackDetails() {
  const { packId } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') as 'memes' | 'situations' | null;
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: memePackDetails, isLoading: isMemeLoading, isError: isMemeError } = useMemePack(type === 'memes' ? packId : undefined);
  const { data: situationPackDetails, isLoading: isSituationLoading, isError: isSituationError } = useSituationPack(type === 'situations' ? packId : undefined);

  const { mutateAsync: deleteMemePack, isPending: isDeletingMeme } = useDeleteMemePack();
  const { mutateAsync: deleteSituationPack, isPending: isDeletingSituation } = useDeleteSituationPack();
  const isDeleting = isDeletingMeme || isDeletingSituation;

  const isLoading = (type === 'memes' && isMemeLoading) || (type === 'situations' && isSituationLoading);
  const isError = (type === 'memes' && isMemeError) || (type === 'situations' && isSituationError) || (!type);

  const pack = type === 'memes' ? memePackDetails?.pack : situationPackDetails?.pack;
  const memes = memePackDetails?.memes || [];
  const situations = situationPackDetails?.situations || [];
  const itemsCount = type === 'memes' ? memes.length : situations.length;

  const isOwner = !!(user && pack?.author_id === user.id);

  const handleDeletePack = async () => {
    if (!packId || !type || isDeleting) return;
    try {
      if (type === 'memes') {
        await deleteMemePack(packId);
      } else {
        await deleteSituationPack(packId);
      }
      navigate('/packs');
    } catch (err) {
      console.error('Failed to delete pack:', err);
    }
  };

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
    <div className="flex flex-col h-full bg-surface md:rounded-2xl md:border border-border shadow-xl overflow-hidden relative">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-black/20 shrink-0 gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button 
            type="button"
            variant="surface"
            size="sm"
            className="md:hidden w-9 h-9 min-h-[36px] p-0 rounded-xl shrink-0"
            onClick={() => navigate('/packs')}
            title="Назад к пакам"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-lg sm:text-xl font-bold truncate text-white">{pack.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-text-secondary">{itemsCount} элементов</span>
              <span className="text-xs text-text-secondary">•</span>
              <span className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
                {pack.is_public ? (
                  <>
                    <Globe size={11} className="text-primary" /> Публичный
                  </>
                ) : (
                  <>
                    <Lock size={11} className="text-warning" /> Приватный
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <>
              <Button
                type="button"
                variant="surface"
                size="sm"
                onClick={() => navigate(`/packs/${packId}/edit?type=${type}`)}
                className="gap-1.5 h-9 text-xs font-bold"
                title="Редактировать пак"
              >
                <Pencil size={14} />
                <span className="hidden sm:inline">Изменить</span>
              </Button>
              <Button
                type="button"
                variant="surface"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-9 h-9 min-h-[36px] p-0 rounded-xl text-danger hover:bg-danger/10 hover:border-danger/40"
                title="Удалить пак"
              >
                <Trash2 size={15} />
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="surface"
            size="sm"
            className="hidden md:flex w-9 h-9 min-h-[36px] p-0 rounded-xl shrink-0"
            onClick={() => navigate('/packs')}
            title="Закрыть панель"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-base">
        {pack.description && (
          <p className="text-sm text-text-secondary bg-surface/50 p-3 rounded-xl border border-border/50">
            {pack.description}
          </p>
        )}
        
        <div className={type === 'memes' ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
          {type === 'memes' && memes.map(meme => (
            <div key={meme.id} className="aspect-square bg-black/40 rounded-xl overflow-hidden border border-border">
              <img src={meme.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}

          {type === 'situations' && situations.map(sit => (
            <div key={sit.id} className="p-3 bg-black/40 rounded-xl border border-border text-sm text-white">
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

      {/* Bottom Bar */}
      <div className="p-4 border-t border-border bg-surface shrink-0 flex gap-2">
        {isOwner && (
          <Button 
            variant="surface"
            className="flex-1"
            onClick={() => navigate(`/packs/${packId}/edit?type=${type}`)}
          >
            Редактировать
          </Button>
        )}
        <Button 
          className={isOwner ? "flex-1 !text-[#16151A] font-bold" : "w-full !text-[#16151A] font-bold"}
          variant="primary"
          onClick={() => navigate(`/game/new?${type === 'memes' ? 'memePack' : 'situationPack'}=${packId}`)}
        >
          В игру
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface border border-border p-5 flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Удалить пак?</h3>
                <p className="text-xs text-text-secondary">Это действие необратимо</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary">
              Вы действительно хотите удалить пак <strong className="text-white">«{pack.name}»</strong>? Все карточки в нем будут удалены.
            </p>

            <div className="flex gap-2 justify-end mt-2">
              <Button
                type="button"
                variant="surface"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeletePack}
                className="bg-danger hover:bg-danger/90 !text-white border-danger"
              >
                {isDeleting ? 'Удаление...' : 'Да, удалить'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
