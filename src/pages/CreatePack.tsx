import { useState, useRef } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useCreateMemePack, useCreateSituationPack, uploadImageMedia } from '@/api/hooks/usePacks';
import { ArrowLeft, Image as ImageIcon, MessageSquare, Plus, X, Upload, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentSafetyLevel } from '@/api/types/game';

type PackKind = 'memes' | 'situations';

export function CreatePack() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<PackKind>('memes');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [languageCode, setLanguageCode] = useState<'ru' | 'en'>('ru');
  const [safetyLevel, setSafetyLevel] = useState<ContentSafetyLevel>('family_friendly');

  // Meme files state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Situation prompts state
  const [prompts, setPrompts] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Upload & submission progress
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: createMemePack } = useCreateMemePack();
  const { mutateAsync: createSituationPack } = useCreateSituationPack();

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    if (filesArray.length === 0) return;

    const newFiles = [...selectedFiles, ...filesArray];
    const newPreviews = [...previewUrls, ...filesArray.map(f => URL.createObjectURL(f))];

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleAddPrompt = () => {
    const trimmed = currentPrompt.trim();
    if (!trimmed) return;
    setPrompts(prev => [...prev, trimmed]);
    setCurrentPrompt('');
  };

  const handleRemovePrompt = (index: number) => {
    setPrompts(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid =
    name.trim().length > 0 &&
    (kind === 'memes' ? selectedFiles.length > 0 : prompts.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (kind === 'memes') {
        const mediaIds: number[] = [];
        const total = selectedFiles.length;
        setUploadProgress({ current: 0, total });

        for (let i = 0; i < total; i++) {
          setUploadProgress({ current: i + 1, total });
          const file = selectedFiles[i];
          const media = await uploadImageMedia(file);
          mediaIds.push(media.id);
        }

        await createMemePack({
          name: name.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
          language_code: languageCode,
          safety_level: safetyLevel,
          media_ids: mediaIds,
        });

        navigate('/packs');
      } else {
        await createSituationPack({
          name: name.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
          language_code: languageCode,
          safety_level: safetyLevel,
          prompts,
        });

        navigate('/packs');
      }
    } catch (err: any) {
      console.error('Failed to create pack:', err);
      setErrorMessage(err?.message || 'Не удалось создать пак. Проверьте данные и попробуйте снова.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <BaseLayout>
      <div className="w-full max-w-2xl flex flex-col gap-6 py-4">
        {/* Header */}
        <div className="flex items-center gap-3.5">
          <Button
            type="button"
            variant="surface"
            size="sm"
            onClick={() => navigate('/packs')}
            className="w-10 h-10 min-h-[40px] p-0 rounded-xl shrink-0"
            title="Назад к пакам"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl text-white font-bold font-unbounded">Создать пак</h1>
            <p className="text-sm text-text-secondary">Добавьте собственный набор мемов или ситуаций</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Pack Type Selector */}
          <section className="flex flex-col gap-3">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Тип пака</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                className={cn(
                  'p-4 cursor-pointer border-2 transition-all flex items-center gap-3',
                  kind === 'memes'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-surface hover:border-text-secondary/60'
                )}
                onClick={() => setKind('memes')}
              >
                <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center shrink-0 text-primary">
                  <ImageIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">Мемы</h3>
                    {kind === 'memes' && <Check size={18} className="text-primary" />}
                  </div>
                  <p className="text-xs text-text-secondary">Коллекция картинок-мемов</p>
                </div>
              </Card>

              <Card
                className={cn(
                  'p-4 cursor-pointer border-2 transition-all flex items-center gap-3',
                  kind === 'situations'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-surface hover:border-text-secondary/60'
                )}
                onClick={() => setKind('situations')}
              >
                <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center shrink-0 text-primary">
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">Ситуации</h3>
                    {kind === 'situations' && <Check size={18} className="text-primary" />}
                  </div>
                  <p className="text-xs text-text-secondary">Коллекция текстовых ситуаций</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Basic Info */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-white">
                Название пака <span className="text-danger">*</span>
              </label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={kind === 'memes' ? 'Например: Топовые коты' : 'Например: Офисные будни'}
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

            {/* Public switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Публичный пак</span>
                <span className="text-xs text-text-secondary">Отображать в общем каталоге для всех игроков</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isPublic ? 'primary' : 'surface'}
                className={isPublic ? '!text-[#16151A] font-bold' : ''}
                onClick={() => setIsPublic(prev => !prev)}
              >
                {isPublic ? 'Публичный' : 'Приватный'}
              </Button>
            </div>
          </section>

          {/* Content Section (Memes or Situations) */}
          {kind === 'memes' ? (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                  Изображения мемов ({selectedFiles.length})
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

              {/* Dropzone */}
              {selectedFiles.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors bg-surface/50"
                >
                  <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center text-primary">
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white text-sm">Нажмите, чтобы выбрать изображения</p>
                    <p className="text-xs text-text-secondary mt-0.5">PNG, JPG, WEBP, GIF (до 35 МБ)</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-2 bg-surface rounded-2xl border border-border hide-scrollbar">
                  {previewUrls.map((url, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-black/40"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 text-white hover:text-danger flex items-center justify-center transition-colors"
                        title="Удалить"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors bg-elevated/40 text-text-secondary hover:text-white"
                  >
                    <Plus size={20} />
                    <span className="text-[11px] font-bold">Еще</span>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="flex flex-col gap-3">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                Ситуации ({prompts.length})
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
                  placeholder="Введите ситуацию и нажмите Enter..."
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

              {/* Prompts list */}
              {prompts.length === 0 ? (
                <div className="w-full border-2 border-dashed border-border rounded-2xl p-6 text-center text-text-secondary text-sm bg-surface/50">
                  В паке пока нет ситуаций. Напишите первую ситуацию выше и нажмите «Добавить».
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 hide-scrollbar">
                  {prompts.map((prompt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 pr-2">
                        <span className="text-xs font-bold text-text-secondary shrink-0 mt-0.5">#{i + 1}</span>
                        <span className="text-sm text-white break-words">{prompt}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePrompt(i)}
                        className="text-text-secondary hover:text-danger p-1 shrink-0 transition-colors"
                        title="Удалить ситуацию"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Progress bar during uploads */}
          {uploadProgress && (
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold text-white">
                <span>Загрузка изображений на сервер...</span>
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

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            variant="primary"
            disabled={!isFormValid || isSubmitting}
            className="w-full h-14 text-lg font-bold !text-[#16151A]"
          >
            {isSubmitting
              ? uploadProgress
                ? `Загрузка мемов (${uploadProgress.current}/${uploadProgress.total})...`
                : 'Создание пака...'
              : 'Создать пак'}
          </Button>
        </form>
      </div>
    </BaseLayout>
  );
}
