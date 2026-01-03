
'use client';

import type { GutBacteriaImpactInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile, Frown, Meh, HelpCircle, Users, Dna } from 'lucide-react'; // Using Dna as a proxy for gut health

interface GutBacteriaIndicatorProps {
  gutImpact?: GutBacteriaImpactInfo;
}

export default function GutBacteriaIndicator({ gutImpact }: GutBacteriaIndicatorProps) {
  if (!gutImpact || !gutImpact.sentiment) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground flex items-center gap-1 cursor-pointer">
            <Users className="h-3 w-3" /> Gut Impact: N/A
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-auto bg-popover text-popover-foreground border-border p-3">
          <p className="text-sm">Gut Bacteria Impact data not available.</p>
        </PopoverContent>
      </Popover>
    );
  }

  const { sentiment, reasoning } = gutImpact;
  let IconComponent;
  let colorClass = 'border-muted-foreground/30 text-muted-foreground bg-muted/20';
  let iconColor = 'text-gray-500';
  let displayText: string = sentiment ?? 'Unknown';

  switch (sentiment) {
    case 'Positive':
      IconComponent = Smile;
      colorClass = 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10';
      iconColor = 'text-green-500';
      displayText = "+ Gut Health";
      break;
    case 'Negative':
      IconComponent = Frown;
      colorClass = 'border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/10';
      iconColor = 'text-red-500';
      displayText = "– Gut Health";
      break;
    case 'Neutral':
      IconComponent = Dna;
      colorClass = 'border-gray-500/50 text-gray-700 dark:text-gray-400 bg-gray-500/10';
      iconColor = 'text-gray-500';
      displayText = "Neutral Gut-Health";
      break;
    case 'Unknown':
    default:
      IconComponent = HelpCircle;
      colorClass = 'border-muted-foreground/30 text-muted-foreground bg-muted/20';
      iconColor = 'text-muted-foreground';
      displayText = "Impact Unknown";
      break;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge variant="outline" className={`text-xs flex items-center gap-1 cursor-pointer ${colorClass}`}>
          <IconComponent className={`h-3.5 w-3.5 ${iconColor}`} /> {displayText}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-popover text-popover-foreground border-border p-3">
        <div className="space-y-1">
          <p className="font-semibold text-sm">Gut Bacteria Impact: {sentiment}</p>
          {reasoning ? (
            <p className="text-sm text-muted-foreground mt-2 leading-tight">{reasoning}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2 leading-tight">General estimated impact on gut microbiota.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
