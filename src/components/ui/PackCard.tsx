import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

export type PackCardKind = 'memes' | 'situations';
export type PackSafetyLevel = 'family_friendly' | 'spicy' | 'explicit';

export interface PackCardProps {
  name: string;
  languageCode: string;
  safetyLevel: PackSafetyLevel;
  packType: PackCardKind;
  isOfficial?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PackCard({ name, languageCode, safetyLevel, packType, isOfficial, onClick, className }: PackCardProps) {
  const safetyInfo = {
    family_friendly: { text: '0+', bg: 'bg-[#43A047]', textCol: 'text-white' },
    spicy: { text: '16+', bg: 'bg-[#FFD54F]', textCol: 'text-[#3E2723]' },
    explicit: { text: '18+', bg: 'bg-[#E53935]', textCol: 'text-white' }
  }[safetyLevel] || { text: '?', bg: 'bg-gray-500', textCol: 'text-white' };

  const displayName = name.trim() ? name : (languageCode.toLowerCase() === 'ru' ? 'Без названия' : 'Unnamed');

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative w-full aspect-[1/1.4] rounded-[20px] border border-border bg-surface flex flex-col overflow-visible cursor-pointer shadow-lg hover:border-primary transition-colors",
        className
      )}
    >
      {/* Inner clip container to prevent card fan clipping */}
      <div className="absolute inset-0 rounded-[20px] overflow-hidden flex flex-col">
        {/* Official badge */}
        {isOfficial && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
            <BadgeCheck size={10} />
            Официально
          </div>
        )}

        {/* Top half with gradient backdrop and Card Fan */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-elevated to-transparent pt-4 pb-2">
          <div className="relative w-full h-[90px] flex items-center justify-center">
            {Array.from({ length: 3 }).map((_, i) => {
              const distanceFromMiddle = i - 1;
              const rotation = distanceFromMiddle * 15;
              const translationX = distanceFromMiddle * 22;
              const translationY = Math.abs(distanceFromMiddle) * 8;
              const zIndex = 3 - Math.abs(distanceFromMiddle);

              return (
                <motion.div
                  key={i}
                  className="absolute w-[64px] h-[88px] rounded-[10px] shadow-md origin-bottom flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-300"
                  style={{
                    zIndex,
                    rotate: `${rotation}deg`,
                    x: translationX,
                    y: translationY,
                    backgroundColor: '#1C1A22',
                    border: '1px solid #35333C'
                  }}
                >
                  <div className="rotate-90 text-[10px] font-bold tracking-[0.2em] uppercase opacity-30 text-white">
                    {packType === 'memes' ? 'MEME' : 'SITUATION'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom info section */}
        <div className="h-[72px] px-3 py-2 flex flex-col justify-between shrink-0">
          <div className="flex justify-between items-start">
            <span className="font-bold text-sm text-white line-clamp-2 leading-tight mr-2">{displayName}</span>
            <div className="bg-elevated px-1.5 py-0.5 rounded text-[10px] font-bold text-text-secondary uppercase mt-0.5 shrink-0">
              {languageCode}
            </div>
          </div>

          <div className="flex justify-between items-center mt-1">
            <div className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", safetyInfo.bg, safetyInfo.textCol)}>
              {safetyInfo.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
