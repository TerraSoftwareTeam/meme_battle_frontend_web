import { useState } from 'react';
import React from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateGame } from '@/api/hooks/useCreateGame';
import { useMemePacks, useSituationPacks } from '@/api/hooks/usePacks';
import { GameMode } from '@/api/types/game';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PackCard, PackCardKind } from '@/components/ui/PackCard';
import { useAuthStore } from '@/store/authStore';

function PackSelectionModal({ 
  isOpen, 
  onClose, 
  title, 
  packs, 
  selectedIds, 
  onToggle 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  packs: any[]; 
  selectedIds: Set<string>; 
  onToggle: (id: string) => void; 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-5xl h-[80vh] rounded-[24px] bg-surface border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
          <h2 className="text-2xl font-unbounded text-white">{title} <span className="text-primary">({selectedIds.size})</span></h2>
          <button onClick={onClose} className="text-text-secondary hover:text-white text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {packs.map(pack => (
              <PackCard
                key={pack.id}
                name={pack.name}
                packType={pack.type}
                languageCode={pack.language_code}
                safetyLevel={pack.safety_level}
                isOfficial={pack.is_official}
                onClick={() => onToggle(pack.id)}
                className={selectedIds.has(pack.id) ? "ring-4 ring-primary border-primary scale-[1.02]" : "opacity-80 hover:opacity-100"}
              />
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-border shrink-0">
          <Button className="w-full h-12 text-lg" onClick={onClose}>Готово</Button>
        </div>
      </div>
    </div>
  );
}

export function CreateGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate: createGame, isPending } = useCreateGame();
  const { isGuest } = useAuthStore();
  
  const { data: memePacks } = useMemePacks();
  const { data: situationPacks } = useSituationPacks();

  const [lobbyName, setLobbyName] = useState('');
  const [handle, setHandle] = useState('');
  const [mode, setMode] = useState<GameMode>('situation_to_meme');
  const [maxRounds, setMaxRounds] = useState(5);
  const [handSize, setHandSize] = useState(5);
  
  const initMemePack = searchParams.get('memePack');
  const initSituationPack = searchParams.get('situationPack');

  const [selectedMemePacks, setSelectedMemePacks] = useState<Set<string>>(
    new Set(initMemePack ? [initMemePack] : [])
  );
  const [selectedSituationPacks, setSelectedSituationPacks] = useState<Set<string>>(
    new Set(initSituationPack ? [initSituationPack] : [])
  );
  
  const [isMemeModalOpen, setIsMemeModalOpen] = useState(false);
  const [isSituationModalOpen, setIsSituationModalOpen] = useState(false);

  const handleToggleMemePack = (id: string) => {
    const next = new Set(selectedMemePacks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMemePacks(next);
  };

  const handleToggleSituationPack = (id: string) => {
    const next = new Set(selectedSituationPacks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSituationPacks(next);
  };

  const isFormValid = lobbyName.trim().length > 0 && selectedMemePacks.size > 0 && selectedSituationPacks.size > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    createGame({
      mode,
      name: lobbyName.trim(),
      handle: handle.trim() || undefined,
      max_rounds: maxRounds,
      hand_size: handSize,
      selected_meme_pack_ids: Array.from(selectedMemePacks),
      selected_situation_pack_ids: Array.from(selectedSituationPacks),
    }, {
      onSuccess: (game) => {
        navigate(`/game/${game.id}`);
      }
    });
  };

  return (
    <BaseLayout>
      <form onSubmit={handleSubmit} className="w-full max-w-3xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-primary-shadow font-unbounded mb-2">Создание игры</h1>
          <p className="text-text-secondary">Настройте правила и выберите паки для игры.</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Lobby name + handle */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Основное</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Название лобби *</label>
                <Input
                  type="text"
                  placeholder="Весёлая компания"
                  value={lobbyName}
                  onChange={e => setLobbyName(e.target.value)}
                  maxLength={50}
                  required
                  className="bg-surface"
                />
              </div>
              {isGuest && (
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Ваш ник в игре</label>
                  <Input
                    type="text"
                    placeholder="meme_lord"
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    maxLength={20}
                    className="bg-surface"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Режим игры</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                className={cn("p-4 cursor-pointer border-2 transition-all", mode === 'situation_to_meme' ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(88,204,2,0.15)] scale-[1.02]" : "border-border hover:border-text-secondary")}
                onClick={() => setMode('situation_to_meme')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-white">Ситуация → Мем</h3>
                  {mode === 'situation_to_meme' && <Check className="text-primary" />}
                </div>
                <p className="text-sm text-text-secondary">Игра выдаёт ситуацию, игроки подбирают самый смешной мем из своих карт.</p>
              </Card>

              <Card 
                className={cn("p-4 cursor-pointer border-2 transition-all", mode === 'meme_to_situation' ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(88,204,2,0.15)] scale-[1.02]" : "border-border hover:border-text-secondary")}
                onClick={() => setMode('meme_to_situation')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-white">Мем → Ситуация</h3>
                  {mode === 'meme_to_situation' && <Check className="text-primary" />}
                </div>
                <p className="text-sm text-text-secondary">Игра выдаёт картинку-мем, игроки придумывают или выбирают самую смешную ситуацию.</p>
              </Card>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Настройки</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Количество раундов</label>
                <Input 
                  type="number" 
                  min={1} max={20} 
                  value={maxRounds} 
                  onChange={e => setMaxRounds(parseInt(e.target.value) || 5)} 
                  className="bg-surface"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Карт в руке</label>
                <Input 
                  type="number" 
                  min={3} max={15} 
                  value={handSize} 
                  onChange={e => setHandSize(parseInt(e.target.value) || 5)} 
                  className="bg-surface"
                />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Паки</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="button"
                variant="secondary" 
                className="flex-1 h-14"
                onClick={() => setIsMemeModalOpen(true)}
              >
                Выбрать паки мемов {selectedMemePacks.size > 0 && <span className="text-primary ml-2">({selectedMemePacks.size})</span>}
              </Button>
              <Button 
                type="button"
                variant="secondary" 
                className="flex-1 h-14"
                onClick={() => setIsSituationModalOpen(true)}
              >
                Выбрать паки ситуаций {selectedSituationPacks.size > 0 && <span className="text-primary ml-2">({selectedSituationPacks.size})</span>}
              </Button>
            </div>
          </section>
        </div>

        <Button 
          type="submit" 
          disabled={!isFormValid || isPending}
          className="w-full h-16 text-xl mt-4 shadow-xl font-unbounded"
        >
          {isPending ? 'Создание...' : 'СОЗДАТЬ ИГРУ'}
        </Button>
      </form>

      <PackSelectionModal 
        isOpen={isMemeModalOpen} 
        onClose={() => setIsMemeModalOpen(false)} 
        title="Паки мемов"
        packs={memePacks?.map(p => ({ ...p, type: 'memes' as PackCardKind })) || []}
        selectedIds={selectedMemePacks}
        onToggle={handleToggleMemePack}
      />

      <PackSelectionModal 
        isOpen={isSituationModalOpen} 
        onClose={() => setIsSituationModalOpen(false)} 
        title="Паки ситуаций"
        packs={situationPacks?.map(p => ({ ...p, type: 'situations' as PackCardKind })) || []}
        selectedIds={selectedSituationPacks}
        onToggle={handleToggleSituationPack}
      />
    </BaseLayout>
  );
}
