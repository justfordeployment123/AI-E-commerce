export type GradeKey = 'NEW' | 'A' | 'B' | 'C' | 'F';

export interface GradeConfig {
  label: string;
  desc: string;
  badgeClass: string;
  dotClass: string;
  textClass: string;
  bgClass: string;
  forParts?: boolean;
}

export const GRADE_CONFIG: Record<GradeKey, GradeConfig> = {
  NEW: {
    label: 'New',
    desc: 'Brand new, sealed or equivalent.',
    badgeClass: 'bg-amber-500/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-400/30 backdrop-blur-md shadow-[0_2px_8px_rgba(245,158,11,0.08)]',
    dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    textClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/5 dark:bg-amber-500/10',
  },
  A: {
    label: 'A Grade',
    desc: 'Used but like new — zero visible marks.',
    badgeClass: 'bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/30 backdrop-blur-md shadow-[0_2px_8px_rgba(16,185,129,0.08)]',
    dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/5 dark:bg-emerald-500/10',
  },
  B: {
    label: 'B Grade',
    desc: 'Minor signs of usage, small scratches.',
    badgeClass: 'bg-blue-500/10 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 dark:border-blue-400/30 backdrop-blur-md shadow-[0_2px_8px_rgba(59,130,246,0.08)]',
    dotClass: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
    textClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/5 dark:bg-blue-500/10',
  },
  C: {
    label: 'C Grade',
    desc: 'Heavy scratches or marks, fully working.',
    badgeClass: 'bg-orange-500/10 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 dark:border-orange-400/30 backdrop-blur-md shadow-[0_2px_8px_rgba(245,158,11,0.08)]',
    dotClass: 'bg-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    textClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-500/5 dark:bg-orange-500/10',
  },
  F: {
    label: 'F Grade',
    desc: 'Non-working — for parts or repair only.',
    badgeClass: 'bg-rose-500/10 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 dark:border-rose-400/30 backdrop-blur-md shadow-[0_2px_8px_rgba(244,63,94,0.08)]',
    dotClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
    textClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500/5 dark:bg-rose-500/10',
    forParts: true,
  },
};

/** Returns the config for a grade key, with a safe fallback. */
export function getGradeConfig(condition: string): GradeConfig {
  return GRADE_CONFIG[condition as GradeKey] ?? {
    label: condition,
    desc: '',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dotClass: 'bg-zinc-400',
    textClass: 'text-zinc-700',
    bgClass: 'bg-zinc-100',
  };
}
