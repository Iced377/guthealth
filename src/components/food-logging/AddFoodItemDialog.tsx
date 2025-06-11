
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LoggedFoodItem } from '@/types';
import { Sprout, Loader2, CalendarIcon, ClockIcon } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


const manualEntrySchema = z.object({
  name: z.string().min(1, { message: 'Food name is required' }),
  ingredients: z.string().min(1, { message: 'Ingredients are required (comma-separated)' }),
  portionSize: z.string().min(1, { message: 'Portion size is required (e.g., 1, 0.5, 100)'}),
  portionUnit: z.string().min(1, { message: 'Portion unit is required (e.g., slice, cup, g)'}),
});

export type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

interface AddFoodItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitFoodItem: (foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType'>, newDate?: Date) => Promise<void>;
  isEditing?: boolean;
  initialValues?: Partial<ManualEntryFormValues>;
  initialTimestamp?: Date; 
}

const formatTimeToHHMM = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const combineDateAndTime = (date: Date, time: string): Date => {
  const [hours, minutesValue] = time.split(':');
  const newDate = new Date(date);
  newDate.setHours(parseInt(hours, 10), parseInt(minutesValue, 10), 0, 0);
  return newDate;
};

export default function AddFoodItemDialog({
  isOpen,
  onOpenChange,
  onSubmitFoodItem,
  isEditing = false,
  initialValues,
  initialTimestamp, 
}: AddFoodItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(formatTimeToHHMM(new Date()));


  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: initialValues || {
      name: '',
      ingredients: '',
      portionSize: '',
      portionUnit: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      const baseTimestamp = initialTimestamp ? new Date(initialTimestamp) : new Date();
      setSelectedDate(baseTimestamp);
      setSelectedTime(formatTimeToHHMM(baseTimestamp));

      if (isEditing && initialValues) {
        form.reset(initialValues);
      } else if (!isEditing) {
        form.reset({ name: '', ingredients: '', portionSize: '', portionUnit: '' });
      }
    }
  }, [isOpen, isEditing, initialValues, initialTimestamp, form]);

  const handleFormSubmit = async (data: ManualEntryFormValues) => {
    setIsLoading(true);
    try {
      let finalTimestamp: Date | undefined = undefined;
      if (selectedDate && selectedTime) {
        finalTimestamp = combineDateAndTime(selectedDate, selectedTime);
      } else {
        finalTimestamp = new Date(); // Fallback
      }

      await onSubmitFoodItem({
        name: data.name,
        ingredients: data.ingredients,
        portionSize: data.portionSize,
        portionUnit: data.portionUnit,
      }, finalTimestamp);

      if (!isEditing) form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} food item from dialog:`, error);
      toast({ title: 'Error', description: `Could not ${isEditing ? 'update' : 'add'} food item.`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const dialogTitleText = isEditing ? "Edit Food Item" : "Log Food Item (Manual)";
  const submitButtonText = isLoading
    ? (isEditing ? 'Updating...' : 'Adding...')
    : (isEditing ? 'Update Food Item' : 'Add to Timeline');
  const labelClasses = cn("text-sm font-medium", "text-foreground");


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <Sprout className="mr-2 h-6 w-6 text-gray-400" /> {dialogTitleText}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update the details, date, and time of this food item." : "Manually enter the details, date, and time of your food item below."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-2 max-h-[calc(80vh-120px)] overflow-y-auto pr-2">
           <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="logDateManual" className={labelClasses}>Log Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                      initialFocus={isEditing}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="logTimeManual" className={labelClasses}>Log Time</Label>
                <Input
                  id="logTimeManual"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className={cn("mt-1 w-full", "bg-input text-foreground placeholder:text-muted-foreground")}
                />
              </div>
            </div>

          <div>
            <Label htmlFor="name" className={labelClasses}>Food Name</Label>
            <Input id="name" {...form.register('name')} placeholder="e.g., Chicken Salad Sandwich" className="mt-1 bg-input text-foreground placeholder:text-muted-foreground" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="portionSize" className={labelClasses}>Portion Size</Label>
              <Input id="portionSize" {...form.register('portionSize')} placeholder="e.g., 1, 0.5, 100" className="mt-1 bg-input text-foreground placeholder:text-muted-foreground" />
              {form.formState.errors.portionSize && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.portionSize.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="portionUnit" className={labelClasses}>Portion Unit</Label>
              <Input id="portionUnit" {...form.register('portionUnit')} placeholder="e.g., slice, cup, g" className="mt-1 bg-input text-foreground placeholder:text-muted-foreground" />
              {form.formState.errors.portionUnit && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.portionUnit.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="ingredients" className={labelClasses}>Ingredients (comma-separated)</Label>
            <Controller
              name="ingredients"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="ingredients"
                  placeholder="e.g., chicken, lettuce, tomato, mayonnaise, wheat bread"
                  className="mt-1 bg-input text-foreground placeholder:text-muted-foreground"
                  rows={3}
                />
              )}
            />
            {form.formState.errors.ingredients && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.ingredients.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2 sticky bottom-0 bg-inherit">
             <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
