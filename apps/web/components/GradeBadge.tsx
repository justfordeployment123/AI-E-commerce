import React from 'react';
import { getGradeConfig } from '../lib/grades';
import { Sparkles, ShieldCheck, CheckCircle2, Wrench, HelpCircle } from 'lucide-react';

interface GradeBadgeProps {
  condition: string;
  /** sm = compact card overlay (default) · lg = prominent detail-page badge */
  size?: 'sm' | 'lg';
  className?: string;
}

const getGradeIcon = (condition: string) => {
  const norm = condition.toUpperCase();
  if (norm.includes('NEW')) return Sparkles;
  if (norm === 'A' || norm.includes('A GRADE') || norm.includes('PRISTINE')) return ShieldCheck;
  if (norm === 'B' || norm.includes('B GRADE') || norm.includes('EXCELLENT')) return CheckCircle2;
  if (norm === 'C' || norm.includes('C GRADE') || norm.includes('GOOD')) return CheckCircle2;
  if (norm === 'F' || norm.includes('F GRADE') || norm.includes('PARTS')) return Wrench;
  return HelpCircle;
};

export function GradeBadge({ condition, size = 'sm', className = '' }: GradeBadgeProps) {
  const grade = getGradeConfig(condition);
  const Icon = getGradeIcon(condition);

  if (size === 'lg') {
    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-default ${grade.badgeClass} ${className}`}
      >
        <Icon className="w-4 h-4 shrink-0 opacity-90" />
        <span>{grade.label}</span>
        {grade.forParts && (
          <span className="ml-1 font-semibold normal-case tracking-normal text-[10px] opacity-80 bg-rose-500/10 dark:bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/20">
            For Parts
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border font-bold text-[9px] sm:text-[10px] uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-default ${grade.badgeClass} ${className}`}
    >
      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 opacity-90" />
      <span>
        <span className="sm:hidden">{grade.label.replace(" Grade", "")}</span>
        <span className="hidden sm:inline">{grade.label}</span>
      </span>
      {grade.forParts && (
        <span className="font-semibold normal-case tracking-normal text-[8px] opacity-80 bg-rose-500/10 dark:bg-rose-500/20 px-1 rounded">
          Parts
        </span>
      )}
    </span>
  );
}
