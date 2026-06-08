import { getGradeConfig } from '../lib/grades';

interface GradeBadgeProps {
  condition: string;
  /** sm = compact card overlay (default) · lg = prominent detail-page badge */
  size?: 'sm' | 'lg';
  className?: string;
}

export function GradeBadge({ condition, size = 'sm', className = '' }: GradeBadgeProps) {
  const grade = getGradeConfig(condition);

  if (size === 'lg') {
    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-black text-xs uppercase tracking-widest ${grade.badgeClass} ${className}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${grade.dotClass}`} />
        {grade.label}
        {grade.forParts && (
          <span className="ml-0.5 font-medium normal-case tracking-normal text-[10px] opacity-70">
            · For Parts
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-black text-[10px] uppercase tracking-widest ${grade.badgeClass} ${className}`}
    >
      {grade.label}
      {grade.forParts && (
        <span className="font-medium normal-case tracking-normal opacity-70">· Parts</span>
      )}
    </span>
  );
}
