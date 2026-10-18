import { BaseLayout } from '@/components/layout/BaseLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function Home() {
  const navigate = useNavigate();

  return (
    <BaseLayout>
      <div className="flex flex-col items-center justify-center flex-1 w-full gap-8 py-8">

        {/* Hero */}
        <motion.div
          className="text-center flex flex-col items-center gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 220 }}
        >
          {/* Title with animated floating emojis */}
          <div className="relative inline-block">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black font-unbounded leading-none select-none">
              <span className="text-white">MEME</span>
              <br />
              <span className="shimmer-text-green">BATTLE</span>
            </h1>

            <motion.span
              className="absolute -top-3 -right-6 sm:-right-8 text-3xl sm:text-4xl pointer-events-none select-none"
              animate={{ rotate: [0, 15, -10, 15, 0], y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            >
              🔥
            </motion.span>
            <motion.span
              className="absolute -bottom-2 -left-6 sm:-left-8 text-2xl sm:text-3xl pointer-events-none select-none"
              animate={{ rotate: [0, -15, 10, -15, 0], y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
            >
              💀
            </motion.span>
          </div>

          {/* Punchy, high-contrast slogan badge */}
          <p className="mt-3 text-lg sm:text-xl font-black text-white text-center tracking-wide">
            докажи, что ты{' '}
            <span className="inline-block px-3 py-0.5 rounded-xl bg-primary text-[#16151A] font-black shadow-[0_3px_0_0_#46A302] transform -rotate-1 select-none">
              настоящий клоун
            </span>
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col w-full max-w-sm gap-3.5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Button onClick={() => navigate('/game/new')} className="text-lg h-15 font-black" size="lg">
              Создать игру
            </Button>
          </motion.div>
          <motion.div variants={item}>
            <Button variant="secondary" onClick={() => navigate('/lobbies')} className="text-lg h-15 font-black" size="lg">
              Войти в лобби
            </Button>
          </motion.div>
          <motion.div variants={item}>
            <Button variant="surface" onClick={() => navigate('/packs')} className="text-lg h-15 font-black" size="lg">
              Каталог паков
            </Button>
          </motion.div>
        </motion.div>

      </div>
    </BaseLayout>
  );
}
