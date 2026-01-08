'use client';

import type { SymptomLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TimelineSymptomCardProps {
  item: SymptomLog;
  onRemoveItem: (itemId: string) => void;
}

export default function TimelineSymptomCard({ item, onRemoveItem }: TimelineSymptomCardProps) {
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  const severityMap: { [key: number]: string } = {
    1: 'Mild',
    2: 'Slight',
    3: 'Moderate',
    4: 'Severe',
    5: 'Very Severe',
  }

  return (
    <Card className="mb-4 shadow-lg bg-card border-border hover:shadow-xl transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="px-4 py-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold font-headline flex items-center text-foreground">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-400" /> Symptoms Logged
          </CardTitle>
          <Badge variant="secondary" className="text-sm bg-muted text-muted-foreground border-muted-foreground/30">Severity: {item.severity ? `${item.severity}/5 (${severityMap[item.severity]})` : 'N/A'}</Badge>
        </div>
        <p className="text-sm text-muted-foreground pt-1">Logged: {timeAgo}</p>
      </CardHeader>
      <CardContent className="px-4 pt-2 pb-3 flex-grow">
        <div className="mb-2">
          <p className="text-sm font-medium text-foreground">Reported Symptoms:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.symptoms.map(symptom => (
              <Badge key={symptom.id} variant="outline" className="border-accent text-foreground text-sm">
                {symptom.name}
              </Badge>
            ))}
          </div>
        </div>
        {item.notes && (
          <div>
            <p className="text-sm font-medium text-foreground">Notes:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
        {item.linkedFoodItemIds && item.linkedFoodItemIds.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">Potentially linked to {item.linkedFoodItemIds.length} food item(s).</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end items-center px-4 pt-2 pb-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <span className="inline-block" tabIndex={-1}>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/20">
                <Trash2 className="mr-2 h-4 w-4" /> Remove Log
              </Button>
            </span>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card text-card-foreground border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Symptom Log?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this symptom log? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border hover:bg-muted text-foreground">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRemoveItem(item.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
