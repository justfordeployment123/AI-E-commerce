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
    badgeClass: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 border-amber-300 shadow-[0_4px_14px_rgba(245,158,11,0.35)]',
    dotClass: 'bg-zinc-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    textClass: 'text-amber-500',
    bgClass: 'bg-zinc-950',
  },
  A: {
    label: 'A Grade',
    desc: 'Used but like new — zero visible marks.',
    badgeClass: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white border-emerald-400/20 shadow-[0_4px_14px_rgba(16,185,129,0.35)]',
    dotClass: 'bg-white shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    textClass: 'text-emerald-500',
    bgClass: 'bg-emerald-950/20',
  },
  B: {
    label: 'B Grade',
    desc: 'Minor signs of usage, small scratches.',
    badgeClass: 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white border-blue-400/20 shadow-[0_4px_14px_rgba(59,130,246,0.35)]',
    dotClass: 'bg-white shadow-[0_0_8px_rgba(59,130,246,0.5)]',
    textClass: 'text-blue-500',
    bgClass: 'bg-blue-950/20',
  },
  C: {
    label: 'C Grade',
    desc: 'Heavy scratches or marks, fully working.',
    badgeClass: 'bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 text-white border-amber-400/20 shadow-[0_4px_14px_rgba(245,158,11,0.3)]',
    dotClass: 'bg-white shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    textClass: 'text-amber-500',
    bgClass: 'bg-amber-950/20',
  },
  F: {
    label: 'F Grade',
    desc: 'Non-working — for parts or repair only.',
    badgeClass: 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white border-rose-400/20 shadow-[0_4px_14px_rgba(244,63,94,0.3)]',
    dotClass: 'bg-white shadow-[0_0_8px_rgba(244,63,94,0.5)]',
    textClass: 'text-rose-500',
    bgClass: 'bg-rose-950/20',
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
