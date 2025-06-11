
import React from 'react';
import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements; // Allow specifying the HTML tag
}

const GradientText: React.FC<GradientTextProps> = ({ children, className, as: Component = 'span' }) => {
  return (
    <Component
      className={cn(
        'bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-400 bg-clip-text text-transparent',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default GradientText;
