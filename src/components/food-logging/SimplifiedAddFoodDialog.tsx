
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Sprout, Loader2, Edit, Info, CalendarIcon, ClockIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

const simplifiedFoodLogSchema = z.object({
  mealDescription: z.string().min(10, { message: 'Please describe your meal in more detail (at least 10 characters).' }),
  calories: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Calories must be positive").optional()
  ),
  protein: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Protein must be positive").optional()
  ),
  carbs: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Carbs must be positive").optional()
  ),
  fat: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Fat must be positive").optional()
  ),
});

export type SimplifiedFoodLogFormValues = z.infer<typeof simplifiedFoodLogSchema>;

interface SimplifiedAddFoodDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitLog: (data: SimplifiedFoodLogFormValues, userDidOverrideMacros: boolean, newDate?: Date) => Promise<void>;
  isGuestView?: boolean;
  isEditing?: boolean;
  initialValues?: Partial<SimplifiedFoodLogFormValues>;
  initialMacrosOverridden?: boolean;
  initialTimestamp?: Date;
}

const formatTimeToHHMM = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const combineDateAndTime = (date: Date, time: string): Date => {
  const [hours, minutesValue] = time.split(':');
  const newDate = new Date(date); // clone the date to avoid modifying the original
  newDate.setHours(parseInt(hours, 10), parseInt(minutesValue, 10), 0, 0); // Set seconds and ms to 0
  return newDate;
};


export default function SimplifiedAddFoodDialog({
  isOpen,
  onOpenChange,
  onSubmitLog,
  isGuestView = false,
  isEditing = false,
  initialValues,
  initialMacrosOverridden = false,
  initialTimestamp,
}: SimplifiedAddFoodDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [userWantsToOverrideMacros, setUserWantsToOverrideMacros] = useState(initialMacrosOverridden);
  const { isDarkMode } = useTheme();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(formatTimeToHHMM(new Date()));


  const form = useForm<SimplifiedFoodLogFormValues>({
    resolver: zodResolver(simplifiedFoodLogSchema),
    defaultValues: {
      mealDescription: '',
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      ...(initialValues || {}),
    },
  });
  const { control, setValue, watch, reset, formState: { errors, isSubmitting, isValid, isSubmitted }, trigger, handleSubmit, getValues } = form;

  useEffect(() => {
    if (isOpen) {
      const baseTimestamp = initialTimestamp ? new Date(initialTimestamp) : new Date();
      setSelectedDate(baseTimestamp);
      setSelectedTime(formatTimeToHHMM(baseTimestamp));

      if (isEditing && initialValues) {
        reset({
          mealDescription: initialValues.mealDescription || '',
          calories: initialValues.calories,
          protein: initialValues.protein,
          carbs: initialValues.carbs,
          fat: initialValues.fat,
        });
        setUserWantsToOverrideMacros(initialMacrosOverridden);
      } else if (!isEditing) {
        reset({ mealDescription: '', calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
        setUserWantsToOverrideMacros(false);
      }
    }
  }, [isOpen, isEditing, initialValues, initialMacrosOverridden, initialTimestamp, reset]);


  const handleDialogSubmit = async (data: SimplifiedFoodLogFormValues) => {
    setIsLoading(true);
    try {
      let finalTimestamp: Date | undefined = undefined;
      if (selectedDate && selectedTime) {
        finalTimestamp = combineDateAndTime(selectedDate, selectedTime);
      } else {
        finalTimestamp = new Date(); // Fallback, though should ideally not happen with validation
      }

      await onSubmitLog(data, userWantsToOverrideMacros, finalTimestamp);
      if (!isEditing) {
        reset();
        setUserWantsToOverrideMacros(false);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error processing/updating meal description:", error);
      toast({
        title: `Error ${isEditing ? 'Updating' : 'Processing'} Meal`,
        description: error.message || `Could not ${isEditing ? 'update' : 'process'} your meal description.`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dialogContentClasses = cn("sm:max-w-lg", "bg-card text-card-foreground border-border");
  const titleClasses = cn("font-headline text-xl flex items-center", "text-foreground");
  const descriptionClasses = cn("text-muted-foreground");
  const sproutIconClasses = cn("mr-2 h-6 w-6", "text-gray-400");
  const sproutSubmitIconClasses = cn("mr-2 h-5 w-5");
  const textAreaClasses = cn("mt-1 text-base min-h-[100px]", "bg-input text-foreground placeholder:text-muted-foreground border-input focus:ring-ring focus:border-ring");
  const inputClasses = cn("mt-1", "bg-input text-foreground placeholder:text-muted-foreground");
  const submitButtonClasses = cn("bg-primary text-primary-foreground hover:bg-primary/80");
  const labelClasses = cn("text-sm font-medium", "text-foreground");
  const checkboxErrorClasses = cn("text-xs mt-1", "text-destructive");

  const dialogTitleText = isGuestView
    ? "What did you eat?"
    : (isEditing ? "Edit Meal Details" : "Log Food with Text");

  const submitButtonText = isLoading
    ? (isEditing ? 'Updating...' : 'Analyzing...')
    : (isGuestView ? 'Check Meal' : (isEditing ? 'Update Meal' : 'Analyze Meal'));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClasses}>
        <DialogHeader>
          <DialogTitle className={titleClasses}>
            <Sprout className={sproutIconClasses} /> {dialogTitleText}
          </DialogTitle>
          <DialogDescription className={descriptionClasses}>
            {isGuestView
              ? "Tell us what you ate, including ingredients and their approximate portion sizes."
              : (isEditing
                ? "Update the description, date, time, or nutritional info below."
                : "Describe your meal in natural language. The system will estimate nutritional info. You can also set the date and time.")
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleDialogSubmit)} className="space-y-4 pt-2 max-h-[calc(80vh-120px)] overflow-y-auto pr-2">
          {!isGuestView && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <Label htmlFor="logDateSimplified" className={labelClasses}>Log Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1 h-10", // Added h-10
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
              <div className="flex flex-col">
                <Label htmlFor="logTimeSimplified" className={labelClasses}>Log Time</Label>
                <Input
                  id="logTimeSimplified"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className={cn("mt-1 w-full h-10", inputClasses)} // Added h-10
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="mealDescription" className={labelClasses}>Meal Description</Label>
            <Controller
              name="mealDescription"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="mealDescription"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  placeholder={isGuestView
                    ? 'e.g., "A small glass of low-fat milk with 50g of Weetabix, and a handful of blueberries"'
                    : 'e.g., "Large bowl of spaghetti bolognese with garlic bread and a side salad."'}
                  className={textAreaClasses}
                  rows={isEditing ? 3 : 4}
                />
              )}
            />
            {errors.mealDescription && (
              <p className={checkboxErrorClasses}>{errors.mealDescription.message}</p>
            )}
          </div>

          {(!isGuestView) && (
            <div className="space-y-3 pt-3 border-t border-border/50 mt-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manualOverrideMacrosSimplified"
                  checked={userWantsToOverrideMacros}
                  onCheckedChange={(checked) => setUserWantsToOverrideMacros(Boolean(checked))}
                  className={cn("border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground")}
                />
                <Label htmlFor="manualOverrideMacrosSimplified" className={cn(labelClasses, "flex items-center cursor-pointer")}>
                  <Edit className="w-4 h-4 mr-2 text-muted-foreground" />
                  Manually set/override macronutrients
                </Label>
              </div>

              {userWantsToOverrideMacros && (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <Label htmlFor="caloriesSimplified" className={cn(labelClasses, "text-xs")}>Calories (kcal)</Label>
                      <Controller
                        name="calories"
                        control={control}
                        render={({ field }) => <Input id="caloriesSimplified" type="number" step="any" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 500" className={cn(inputClasses, "h-9 text-sm")} />}
                      />
                      {errors.calories && <p className={cn("text-xs text-destructive mt-1")}>{errors.calories.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="proteinSimplified" className={cn(labelClasses, "text-xs")}>Protein (g)</Label>
                      <Controller
                        name="protein"
                        control={control}
                        render={({ field }) => <Input id="proteinSimplified" type="number" step="any" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 30" className={cn(inputClasses, "h-9 text-sm")} />}
                      />
                      {errors.protein && <p className={cn("text-xs text-destructive mt-1")}>{errors.protein.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="carbsSimplified" className={cn(labelClasses, "text-xs")}>Carbs (g)</Label>
                      <Controller
                        name="carbs"
                        control={control}
                        render={({ field }) => <Input id="carbsSimplified" type="number" step="any" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 50" className={cn(inputClasses, "h-9 text-sm")} />}
                      />
                      {errors.carbs && <p className={cn("text-xs text-destructive mt-1")}>{errors.carbs.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="fatSimplified" className={cn(labelClasses, "text-xs")}>Fat (g)</Label>
                      <Controller
                        name="fat"
                        control={control}
                        render={({ field }) => <Input id="fatSimplified" type="number" step="any" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="e.g., 20" className={cn(inputClasses, "h-9 text-sm")} />}
                      />
                      {errors.fat && <p className={cn("text-xs text-destructive mt-1")}>{errors.fat.message}</p>}
                    </div>
                  </div>
                  <p className={cn("text-xs mt-1 flex items-start gap-1.5", "text-muted-foreground")}>
                    <Info className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>If checked, values entered here will override auto-estimates. If unchecked, system will recalculate macros on update.</span>
                  </p>
                </>
              )}
            </div>
          )}

          <DialogFooter className="pt-4 sticky bottom-0 bg-inherit">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className={submitButtonClasses} disabled={isLoading || (isSubmitting || !isValid && isSubmitted)}>
              {isLoading ? <Loader2 className={cn("animate-spin h-5 w-5 mr-2", isGuestView ? "text-primary" : "text-primary-foreground")} /> : <Sprout className={sproutSubmitIconClasses} />}
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
