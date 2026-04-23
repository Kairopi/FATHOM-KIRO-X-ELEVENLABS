import { Swords, Dumbbell, Lightbulb, Drama, Atom, Popcorn, CookingPot, Compass, type LucideProps } from 'lucide-react';

type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;

const ICON_MAP: Record<string, IconComponent> = {
  Swords,
  Dumbbell,
  Lightbulb,
  Drama,
  Atom,
  Popcorn,
  CookingPot,
  Compass,
};

interface LensIconProps {
  iconName: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function LensIcon({ iconName, className, size = 16, strokeWidth = 1.75, color }: LensIconProps) {
  const IconComponent = ICON_MAP[iconName];
  if (!IconComponent) return null;
  return <IconComponent className={className} size={size} strokeWidth={strokeWidth} color={color} />;
}
