import { RARITY_OPTIONS, type RarityCode } from '../firebase';

interface RarityBadgeListProps {
  rarities: RarityCode[];
  size?: 'sm' | 'md';
  className?: string;
}

export function RarityBadgeList({
  rarities,
  size = 'md',
  className = '',
}: RarityBadgeListProps) {
  if (!rarities || rarities.length === 0) return null;

  const sizeClass =
    size === 'sm'
      ? 'h-5 w-5 sm:h-5.5 sm:w-5.5'
      : 'h-7 w-7 sm:h-7.5 sm:w-7.5';

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label={`Свойства: ${rarities.join(', ')}`}
    >
      {rarities.map((code) => {
        const option = RARITY_OPTIONS.find((opt) => opt.code === code);
        if (!option) return null;
        return (
          <img
            key={code}
            src={option.iconSrc}
            alt={option.label}
            title={option.label}
            draggable={false}
            className={`${sizeClass} shrink-0 select-none object-contain drop-shadow-[0_2px_4px_rgba(91,59,42,0.28)]`}
          />
        );
      })}
    </div>
  );
}
