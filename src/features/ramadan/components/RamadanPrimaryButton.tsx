"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RamadanPrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

export default function RamadanPrimaryButton({
  children,
  onClick,
  className,
  type = 'button',
}: RamadanPrimaryButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={cn(
        "rounded-full bg-primary text-primary-foreground font-bold px-6 py-2 shadow-md shadow-primary/20 hover:bg-primary/90",
        className
      )}
      whileTap={{ scale: 1.25 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 8 }}
    >
      {children}
    </motion.button>
  );
}
