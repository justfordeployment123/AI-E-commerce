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
    badgeClass: 'bg-zinc-950 text-white border-zinc-800 shadow-sm',
    dotClass: 'bg-zinc-500',
    textClass: 'text-zinc-900',
    bgClass: 'bg-zinc-100',
  },
  A: {
    label: 'A Grade',
    desc: 'Used but like new — zero visible marks.',
    badgeClass: 'bg-emerald-700 text-white border-emerald-800 shadow-sm',
    dotClass: 'bg-emerald-300',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
  },
  B: {
    label: 'B Grade',
    desc: 'Minor signs of usage, small scratches.',
    badgeClass: 'bg-blue-700 text-white border-blue-800 shadow-sm',
    dotClass: 'bg-blue-300',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
  },
  C: {
    label: 'C Grade',
    desc: 'Heavy scratches or marks, fully working.',
    badgeClass: 'bg-amber-600 text-white border-amber-700 shadow-sm',
    dotClass: 'bg-amber-200',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
  },
  F: {
    label: 'F Grade',
    desc: 'Non-working — for parts or repair only.',
    badgeClass: 'bg-red-700 text-white border-red-800 shadow-sm',
    dotClass: 'bg-red-300',
    textClass: 'text-red-700',
    bgClass: 'bg-red-50',
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
