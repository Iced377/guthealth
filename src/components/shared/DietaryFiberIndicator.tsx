'use client';

import type { DietaryFiberInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Leaf } from 'lucide-react';

interface DietaryFiberIndicatorProps {
  fiberInfo?: DietaryFiberInfo;
}

export default function DietaryFiberIndicator({ fiberInfo }: DietaryFiberIndicatorProps) {
  if (!fiberInfo || typeof fiberInfo.amountGrams !== 'number') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground flex items-center gap-1 cursor-pointer">
            <Leaf className="h-3.5 w-3.5" /> Fiber: N/A
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-auto bg-popover text-popover-foreground border-border p-3">
          <p className="text-sm">Dietary Fiber data not available.</p>
        </PopoverContent>
      </Popover>
    );
  }

  const { amountGrams, quality } = fiberInfo;

  // Determine color based on quality, or a default if no quality
  let colorClass = 'border-blue-500/50 text-blue-700 dark:text-blue-400 bg-blue-500/10'; // Default/Adequate
  let iconColor = 'text-blue-500';

  if (quality === 'Low') {
    colorClass = 'border-orange-500/50 text-orange-700 dark:text-orange-400 bg-orange-500/10';
    iconColor = 'text-orange-500';
  } else if (quality === 'High') {
    colorClass = 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10';
    iconColor = 'text-green-500';
  }


  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge variant="outline" className={`text-xs flex items-center gap-1 cursor-pointer ${colorClass}`}>
          <Leaf className={`h-3.5 w-3.5 ${iconColor}`} /> {amountGrams.toFixed(1)}g Fiber
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-popover text-popover-foreground border-border p-3">
        <div className="space-y-1">
          <p className="font-semibold text-sm">Dietary Fiber</p>
          <p className="text-sm">Amount: {amountGrams.toFixed(1)}g</p>
          {quality && <p className="text-sm">Quality: {quality}</p>}
          <p className="text-xs text-muted-foreground mt-2 leading-tight">General guide: &lt;2g Low, 2-4g Adequate, &gt;5g High per item.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
