import { cn } from '@/lib/utils';

type Tone = 'success' | 'pending' | 'declined' | 'flagged' | 'info' | 'warn';

const tones: Record<Tone, string> = {
  success: 'bg-accent/12 text-accent border-accent/25',
  pending: 'bg-primary/12 text-primary border-primary/25',
  declined: 'bg-danger/12 text-danger border-danger/25',
  flagged: 'bg-warn/12 text-warn border-warn/25',
  info: 'bg-secondary/12 text-secondary border-secondary/25',
  warn: 'bg-warn/12 text-warn border-warn/25',
};

export function StatusBadge({
  tone,
  children,
  className,
  dot = true,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
        tones[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
