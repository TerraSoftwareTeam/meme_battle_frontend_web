import { useState, useRef, useEffect } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  useMemePack, 
  useSituationPack, 
  useUpdateMemePack, 
  useUpdateSituationPack,
  useDeleteMemePack,
  useDeleteSituationPack,
  useAddMemesToPack,
  useDeleteMemeFromPack,
  useAddSituationsToPack,
  useDeleteSituationFromPack,
  uploadImageMedia
} from '@/api/hooks/usePacks';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  Globe, 
  Lock, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentSafetyLevel } from '@/api/types/game';

export function EditPack() {
  const { packId } = useParams();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as 'memes' | 'situations' | null;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: memePackDetails, isLoading: isMemeLoading } = useMemePack(
    typeParam === 'memes' || !typeParam ? packId : undefined
  );
  const { data: situationPackDetails, isLoading: isSituationLoading } = useSituationPack(
    typeParam === 'situations' ? packId : undefined
  );

  const packType = typeParam || (situationPackDetails ? 'situations' : 'memes');
  const pack = packType === 'memes' ? memePackDetails?.pack : situationPackDetails?.pack;
  const existingMemes = memePackDetails?.memes || [];
  const existingSituations = situationPackDetails?.situations || [];

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [languageCode, setLanguageCode] = useState<'ru' | 'en'>('ru');
  const [safetyLevel, setSafetyLevel] = useState<ContentSafetyLevel>('family_friendly');

  // Pending new meme files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Pending new situation prompts
  const [newPrompts, setNewPrompts] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Mutations
  const { mutateAsync: updateMemePack } = useUpdateMemePack();
  const { mutateAsync: updateSituationPack } = useUpdateSituationPack();
  const { mutateAsync: deleteMemePack, isPending: isDeletingMemePack } = useDeleteMemePack();
  const { mutateAsync: deleteSituationPack, isPending: isDeletingSituationPack } = useDeleteSituationPack();
  const { mutateAsync: addMemesToPack } = useAddMemesToPack();
  const { mutateAsync: deleteMemeFromPack } = useDeleteMemeFromPack();
  const { mutateAsync: addSituationsToPack } = useAddSituationsToPack();
  const { mutateAsync: deleteSituationFromPack } = useDeleteSituationFromPack();

  const isDeletingPack = isDeletingMemePack || isDeletingSituationPack;

  // Initialize form once pack is loaded
  useEffect(() => {
    if (pack) {
      setName(pack.name || '');
      setDescription(pack.description || '');
      setIsPublic(pack.is_public ?? true);
      setLanguageCode((pack.language_code as 'ru' | 'en') || 'ru');
      setSafetyLevel(pack.safety_level || 'family_friendly');
    }
  }, [pack]);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    if (filesArray.length === 0) return;

    const newFiles = [...selectedFiles, ...filesArray];
    const newPreviews = [...previewUrls, ...filesArray.map(f => URL.createObjectURL(f))];

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePendingFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPrompt = () => {
    const trimmed = currentPrompt.trim();
    if (!trimmed) return;
    setNewPrompts(prev => [...prev, trimmed]);
    setCurrentPrompt('');
  };

  const handleRemovePendingPrompt = (index: number) => {
    setNewPrompts(prev => prev.filter((_, i) => i !== index));
  };

  // Immediate deletion of existing items from the pack
  const handleDeleteExistingMeme = async (memeId: string) => {
    if (!packId || deletingItemId) return;
    setDeletingItemId(memeId);
    try {
      await deleteMemeFromPack({ packId, memeId });
    } catch (err: any) {
      console.error('Failed to delete meme:', err);
      setErrorMessage(err?.message || 'Не удалось удалить мем из пака');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleDeleteExistingSituation = async (situationId: string) => {
    if (!packId || deletingItemId) return;
    setDeletingItemId(situationId);
    try {
      await deleteSituationFromPack({ packId, situationId });
    } catch (err: any) {
      console.error('Failed to delete situation:', err);
      setErrorMessage(err?.message || 'Не удалось удалить ситуацию из пака');
    } finally {
      setDeletingItemId(null);
    }
  };

  // Delete entire pack
  const handleDeletePack = async () => {
    if (!packId || isDeletingPack) return;
    try {
      if (packType === 'memes') {
        await deleteMemePack(packId);
      } else {
        await deleteSituationPack(packId);
      }
      navigate('/packs');
    } catch (err: any) {
      console.error('Failed to delete pack:', err);
      setErrorMessage(err?.message || 'Не удалось удалить пак');
      setShowDeleteModal(false);
    }
  };

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !packId || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (packType === 'memes') {
        // 1. Update metadata
        await updateMemePack({
          id: packId,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            is_public: isPublic,
            language_code: languageCode,
            safety_level: safetyLevel,
          },
        });

        // 2. Upload and add any new memes
        if (selectedFiles.length > 0) {
          const mediaIds: number[] = [];
          const total = selectedFiles.length;
          setUploadProgress({ current: 0, total });

          for (let i = 0; i < total; i++) {
            setUploadProgress({ current: i + 1, total });
            const file = selectedFiles[i];
            const media = await uploadImageMedia(file);
            mediaIds.push(media.id);
          }

          await addMemesToPack({ id: packId, mediaIds });
          setSelectedFiles([]);
          setPreviewUrls([]);
        }

        navigate(`/packs/${packId}?type=memes`);
      } else {
        // 1. Update metadata
        await updateSituationPack({
          id: packId,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            is_public: isPublic,
            language_code: languageCode,
            safety_level: safetyLevel,
          },
        });

        // 2. Add any new prompts
        if (newPrompts.length > 0) {
          await addSituationsToPack({ id: packId, prompts: newPrompts });
          setNewPrompts([]);
        }

        navigate(`/packs/${packId}?type=situations`);
      }
    } catch (err: any) {
      console.error('Failed to update pack:', err);
      setErrorMessage(err?.message || 'Не удалось сохранить изменения. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const isLoading = (packType === 'memes' && isMemeLoading) || (packType === 'situations' && isSituationLoading);

  if (isLoading) {
    return (
      <BaseLayout>
        <div className="w-full max-w-2xl flex items-center justify-center py-20 text-text-secondary">
          Загрузка пака...
        </div>
      </BaseLayout>
    );
  }

  if (!pack) {
    return (
      <BaseLayout>
        <div className="w-full max-w-2xl flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-text-secondary">Пак не найден или удален</p>
          <Button variant="surface" onClick={() => navigate('/packs')}>
            Вернуться в каталог
          </Button>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="w-full max-w-2xl flex flex-col gap-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <Button
              type="button"
              variant="surface"
              size="sm"
              onClick={() => navigate(`/packs/${packId}?type=${packType}`)}
              className="w-10 h-10 min-h-[40px] p-0 rounded-xl shrink-0"
              title="Назад к паку"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl text-white font-bold font-unbounded">Редактирование</h1>
              <p className="text-sm text-text-secondary">{pack.name}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="surface"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="w-10 h-10 min-h-[40px] p-0 rounded-xl text-danger hover:bg-danger/10 hover:border-danger/40 shrink-0"
            title="Удалить пак"
          >
            <Trash2 size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Basic Info */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-white">
                Название пака <span className="text-danger">*</span>
              </label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Название пака"
                maxLength={64}
                required
                className="bg-surface border-border text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-white">Описание (необязательно)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Расскажите, о чем этот пак..."
                rows={3}
                maxLength={256}
                className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Language & Safety */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-white">Язык</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={languageCode === 'ru' ? 'primary' : 'surface'}
                    className={languageCode === 'ru' ? '!text-[#16151A] font-bold flex-1' : 'flex-1'}
                    onClick={() => setLanguageCode('ru')}
                  >
                    Русский (RU)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={languageCode === 'en' ? 'primary' : 'surface'}
                    className={languageCode === 'en' ? '!text-[#16151A] font-bold flex-1' : 'flex-1'}
                    onClick={() => setLanguageCode('en')}
                  >
                    English (EN)
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-white">Возрастной ценз</label>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={safetyLevel === 'family_friendly' ? 'primary' : 'surface'}
                    className={safetyLevel === 'family_friendly' ? '!text-[#16151A] font-bold flex-1 text-xs' : 'flex-1 text-xs'}
                    onClick={() => setSafetyLevel('family_friendly')}
                  >
                    0+ Safe
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={safetyLevel === 'spicy' ? 'primary' : 'surface'}
                    className={safetyLevel === 'spicy' ? '!text-[#16151A] font-bold flex-1 text-xs' : 'flex-1 text-xs'}
                    onClick={() => setSafetyLevel('spicy')}
                  >
                    16+ Moderate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={safetyLevel === 'explicit' ? 'primary' : 'surface'}
                    className={safetyLevel === 'explicit' ? '!text-[#16151A] font-bold flex-1 text-xs' : 'flex-1 text-xs'}
                    onClick={() => setSafetyLevel('explicit')}
                  >
                    18+ Adult
                  </Button>
                </div>
              </div>
            </div>

            {/* Public / Private Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-white">Доступность пака</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setIsPublic(true)}
                  className={cn(
                    "cursor-pointer rounded-xl p-3.5 border-2 transition-all flex items-start gap-3 select-none",
                    isPublic
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-surface hover:border-text-secondary/60"
                  )}
                >
                  <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", isPublic ? "bg-primary text-[#16151A]" : "bg-elevated text-text-secondary")}>
                    <Globe size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Публичный</span>
                      {isPublic && <Check size={16} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">Виден всем игрокам в общем каталоге</p>
                  </div>
                </div>

                <div
                  onClick={() => setIsPublic(false)}
                  className={cn(
                    "cursor-pointer rounded-xl p-3.5 border-2 transition-all flex items-start gap-3 select-none",
                    !isPublic
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-surface hover:border-text-secondary/60"
                  )}
                >
                  <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", !isPublic ? "bg-primary text-[#16151A]" : "bg-elevated text-text-secondary")}>
                    <Lock size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Приватный</span>
                      {!isPublic && <Check size={16} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">Доступен только вам и в ваших играх</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Existing Items & Add New Items */}
          {packType === 'memes' ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                  Изображения мемов ({existingMemes.length + selectedFiles.length})
                </label>
                <Button
                  type="button"
                  variant="surface"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Plus size={16} />
                  <span>Добавить картинки</span>
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFilesSelect}
              />

              {/* Grid of existing + pending memes */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-3 bg-surface rounded-2xl border border-border">
                {/* Existing memes */}
                {existingMemes.map(meme => (
                  <div
                    key={meme.id}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-black/40"
                  >
                    <img src={meme.media_url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      disabled={deletingItemId === meme.id}
                      onClick={() => handleDeleteExistingMeme(meme.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 text-white hover:text-danger flex items-center justify-center transition-colors shadow-md"
                      title="Удалить мем из пака"
                    >
                      {deletingItemId === meme.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                ))}

                {/* Newly selected memes (pending upload) */}
                {previewUrls.map((url, i) => (
                  <div
                    key={`new-${i}`}
                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-primary/50 bg-black/40"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 left-1 bg-primary text-[#16151A] text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Новое
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingFile(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 text-white hover:text-danger flex items-center justify-center transition-colors"
                      title="Отменить добавление"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors bg-elevated/40 text-text-secondary hover:text-white"
                >
                  <Plus size={20} />
                  <span className="text-[11px] font-bold">Еще</span>
                </div>
              </div>
            </section>
          ) : (
            <section className="flex flex-col gap-4">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                Ситуации ({existingSituations.length + newPrompts.length})
              </label>

              {/* Add Prompt Input */}
              <div className="flex gap-2">
                <Input
                  value={currentPrompt}
                  onChange={e => setCurrentPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPrompt();
                    }
                  }}
                  placeholder="Введите новую ситуацию и нажмите Enter..."
                  className="bg-surface border-border text-white flex-1"
                />
                <Button
                  type="button"
                  variant="surface"
                  onClick={handleAddPrompt}
                  disabled={!currentPrompt.trim()}
                  className="shrink-0"
                >
                  <Plus size={16} />
                  <span>Добавить</span>
                </Button>
              </div>

              {/* Situations list */}
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 hide-scrollbar">
                {/* Existing situations */}
                {existingSituations.map((sit, i) => (
                  <div
                    key={sit.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <span className="text-xs font-bold text-text-secondary shrink-0 mt-0.5">#{i + 1}</span>
                      <span className="text-sm text-white break-words">{sit.prompt_text}</span>
                    </div>
                    <button
                      type="button"
                      disabled={deletingItemId === sit.id}
                      onClick={() => handleDeleteExistingSituation(sit.id)}
                      className="text-text-secondary hover:text-danger p-1 shrink-0 transition-colors"
                      title="Удалить ситуацию"
                    >
                      {deletingItemId === sit.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                ))}

                {/* Newly added prompts (pending save) */}
                {newPrompts.map((prompt, i) => (
                  <div
                    key={`new-${i}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/40"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <span className="text-xs font-bold text-primary shrink-0 mt-0.5">+</span>
                      <span className="text-sm text-white break-words">{prompt}</span>
                      <span className="text-[10px] bg-primary text-[#16151A] font-bold px-1.5 py-0.2 rounded shrink-0">
                        Новое
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingPrompt(i)}
                      className="text-text-secondary hover:text-danger p-1 shrink-0 transition-colors"
                      title="Отменить"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Progress bar during uploads */}
          {uploadProgress && (
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold text-white">
                <span>Загрузка новых мемов на сервер...</span>
                <span className="text-primary">{uploadProgress.current} / {uploadProgress.total}</span>
              </div>
              <div className="w-full bg-elevated h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="surface"
              size="lg"
              onClick={() => setShowDeleteModal(true)}
              className="sm:w-1/3 h-14 text-danger hover:bg-danger/10 hover:border-danger/40 border-danger/20 font-bold"
            >
              Удалить пак
            </Button>
            <Button
              type="submit"
              size="lg"
              variant="primary"
              disabled={!name.trim() || isSubmitting}
              className="flex-1 h-14 text-lg font-bold !text-[#16151A]"
            >
              {isSubmitting
                ? uploadProgress
                  ? `Загрузка мемов (${uploadProgress.current}/${uploadProgress.total})...`
                  : 'Сохранение...'
                : 'Сохранить изменения'}
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
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
                Вы действительно хотите удалить пак <strong className="text-white">«{pack.name}»</strong>? Все карточки в нем будут удалены безвозвратно.
              </p>

              <div className="flex gap-2 justify-end mt-2">
                <Button
                  type="button"
                  variant="surface"
                  size="sm"
                  disabled={isDeletingPack}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isDeletingPack}
                  onClick={handleDeletePack}
                  className="bg-danger hover:bg-danger/90 !text-white border-danger"
                >
                  {isDeletingPack ? 'Удаление...' : 'Да, удалить'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
