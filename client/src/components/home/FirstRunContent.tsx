import { motion } from 'framer-motion';
import { SPRING_SNAPPY } from '@/lib/motion';
import { useStore } from '@/store';
import { getLensMetadata } from '@/lib/lenses';
import type { LearningLens } from '@/types';

const SUGGESTIONS: { text: string; lens: LearningLens }[] = [
  { text: 'Explain quantum computing like a gamer', lens: 'gamer' },
  { text: 'How does the stock market work?', lens: 'coach' },
  { text: 'The story behind the internet', lens: 'storyteller' },
  { text: 'Break down machine learning simply', lens: 'eli5' },
];

export function FirstRunContent() {
  const setContent = useStore((s) => s.setContent);
  const setSelectedLens = useStore((s) => s.setSelectedLens);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
      className="flex flex-wrap justify-center gap-1.5"
    >
      {SUGGESTIONS.map((s) => {
        const meta = getLensMetadata(s.lens);
        return (
          <motion.button
            key={s.text}
            type="button"
            variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
            transition={SPRING_SNAPPY}
            whileHover={{ borderColor: `${meta.accentColor}40` }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setContent(s.text); setSelectedLens(s.lens); }}
            className="px-3 py-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-full bg-transparent hover:bg-[var(--bg-secondary)] transition-all duration-150 cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
          >
            {s.text}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
