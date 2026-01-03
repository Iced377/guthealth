
import type { FodmapScore } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge'; // Added Badge import

interface FodmapIndicatorProps {
  score?: FodmapScore;
  reason?: string;
}

export default function FodmapIndicator({ score, reason }: FodmapIndicatorProps) {
  if (!score) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground flex items-center gap-1 cursor-pointer">
            <HelpCircle className="h-3 w-3" /> FODMAP: N/A
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-auto bg-popover text-popover-foreground border-border p-3">
          <p className="text-sm">FODMAP analysis pending or not available.</p>
        </PopoverContent>
      </Popover>
    );
  }

  const indicatorMap = {
    Green: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, text: 'Low FODMAP', colorClass: 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10' },
    Yellow: { icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, text: 'Mod. FODMAP', colorClass: 'border-orange-500/50 text-orange-700 dark:text-orange-400 bg-orange-500/10' }, // Shortened "Moderate"
    Red: { icon: <XCircle className="h-4 w-4 text-red-500" />, text: 'High FODMAP', colorClass: 'border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/10' },
  };

  const currentIndicator = indicatorMap[score];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge variant="outline" className={`text-xs flex items-center gap-1 cursor-pointer ${currentIndicator.colorClass}`}>
          {currentIndicator.icon}
          {currentIndicator.text}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-popover text-popover-foreground border-border p-3">
        <div className="space-y-1">
          <p className={`font-semibold text-sm ${score === 'Green' ? 'text-green-600 dark:text-green-400' : score === 'Yellow' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
            }`}>{indicatorMap[score].text}</p> {/* Use full text from map for tooltip title */}
          {reason ? (
            <p className="text-sm text-muted-foreground mt-2 leading-tight">{reason}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2 leading-tight">This item is rated as {score.toLowerCase()} FODMAP.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
