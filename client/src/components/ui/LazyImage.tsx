import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  aspectRatio?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder, 
  className,
  aspectRatio = '16 / 9'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      setError(true);
    };
  }, [src]);

  if (error) {
    return (
      <div
        className={cn(
          'w-full rounded-[var(--radius-card)] bg-[var(--bg-tertiary)] flex items-center justify-center',
          className
        )}
        style={{ aspectRatio }}
      >
        <span className="text-xs text-[var(--text-tertiary)]">Failed to load image</span>
      </div>
    );
  }

  return (
    <motion.img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      animate={{ 
        opacity: isLoaded ? 1 : 0.5,
        filter: isLoaded ? 'none' : 'blur(10px)'
      }}
      transition={{ duration: 0.3 }}
      className={cn('w-full rounded-[var(--radius-card)]', className)}
      style={{ aspectRatio }}
    />
  );
}
