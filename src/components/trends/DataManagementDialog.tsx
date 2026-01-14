'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Pencil, Trash2, Plus, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TimelineEntry, FitbitLog, PedometerLog } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface DataManagementDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    dataType: 'weight' | 'steps';
    data: (FitbitLog | PedometerLog)[];
    onSave: (entry: Partial<FitbitLog | PedometerLog>, id?: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export default function DataManagementDialog({
    isOpen,
    onOpenChange,
    dataType,
    data,
    onSave,
    onDelete,
}: DataManagementDialogProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('12:00');
    const [value, setValue] = useState(''); // Weight (kg) or Steps
    const [secondaryValue, setSecondaryValue] = useState(''); // Fat % or Calories Burned

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [data]);

    const resetForm = () => {
        setIsEditing(false);
        setEditingId(null);
        setDate(new Date());
        setTime(format(new Date(), 'HH:mm'));
        setValue('');
        setSecondaryValue('');
    };

    const handleEditClick = (entry: FitbitLog | PedometerLog) => {
        setIsEditing(true);
        setEditingId(entry.id);
        const entryDate = new Date(entry.timestamp);
        setDate(entryDate);
        setTime(format(entryDate, 'HH:mm'));

        if (dataType === 'weight') {
            const e = entry as FitbitLog;
            setValue(e.weight?.toString() || '');
            setSecondaryValue(e.fatPercent?.toString() || '');
        } else {
            const e = entry as FitbitLog; // or PedometerLog
            // Handle steps (some might be pedometer data)
            // We essentially treat manual entries as fitbit_data for simplicity as per plan
            setValue(e.steps?.toString() || '');
            if (entry.entryType === 'fitbit_data') {
                setSecondaryValue(entry.caloriesBurned?.toString() || '');
            } else if (entry.entryType === 'pedometer_data') {
                setSecondaryValue(entry.activeEnergy?.toString() || '');
            }
        }
    };

    const handleDeleteClick = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        setIsLoading(true);
        try {
            await onDelete(id);
            toast({ title: 'Entry deleted' });
        } catch (error) {
            toast({ title: 'Error deleting', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !value) return;

        setIsLoading(true);
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const timestamp = new Date(date);
            timestamp.setHours(hours, minutes);

            const payload: Partial<FitbitLog> = {
                timestamp,
                entryType: 'fitbit_data', // defaulting to fitbit data type for manual entries
            };

            if (dataType === 'weight') {
                payload.weight = parseFloat(value);
                if (secondaryValue) payload.fatPercent = parseFloat(secondaryValue);
            } else {
                payload.steps = parseInt(value);
                if (secondaryValue) payload.caloriesBurned = parseInt(secondaryValue);
            }

            await onSave(payload, editingId || undefined);
            toast({ title: isEditing ? 'Entry updated' : 'Entry added' });
            resetForm();
        } catch (error) {
            toast({ title: 'Error saving', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        if (isEditing) {
            resetForm();
        } else {
            setIsEditing(true);
            // Defaults for adding are already set by resetForm logic technically but explicit here
            setDate(new Date());
            setTime(format(new Date(), 'HH:mm'));
            setValue('');
            setSecondaryValue('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            onOpenChange(open);
        }}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage {dataType === 'weight' ? 'Weight' : 'Activity'} Data</DialogTitle>
                    <DialogDescription>
                        View history or manually {isEditing ? 'edit' : 'add'} entries.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-[300px] pr-2">

                    {/* Form Section */}
                    <div className={cn("mb-6 p-4 rounded-lg border border-border bg-muted/30", !isEditing && "hidden")}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold">{editingId ? 'Edit Entry' : 'Add New Entry'}</h3>
                            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d > new Date() || d < new Date("1900-01-01")} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Time</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="pl-9" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>{dataType === 'weight' ? 'Weight (kg)' : 'Steps'}</Label>
                                    <Input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder={dataType === 'weight' ? '80.5' : '5000'} required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{dataType === 'weight' ? 'Body Fat % (Optional)' : 'Calories Burned (Optional)'}</Label>
                                    <Input type="number" step="any" value={secondaryValue} onChange={(e) => setSecondaryValue(e.target.value)} placeholder={dataType === 'weight' ? '15.5' : '300'} />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingId ? 'Update Entry' : 'Add Entry'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Table Section */}
                    {!isEditing && (
                        <>
                            <div className="flex justify-end mb-4">
                                <Button onClick={toggleMode} size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Entry
                                </Button>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>{dataType === 'weight' ? 'Weight' : 'Steps'}</TableHead>
                                            <TableHead className="hidden sm:table-cell">{dataType === 'weight' ? 'Fat %' : 'Cals'}</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No history found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            sortedData.map((entry) => (
                                                <TableRow key={entry.id}>
                                                    <TableCell>{format(new Date(entry.timestamp), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">{format(new Date(entry.timestamp), 'h:mm a')}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {dataType === 'weight' ? (entry as FitbitLog).weight : (entry as any).steps}
                                                        <span className="text-muted-foreground text-xs font-normal ml-1">{dataType === 'weight' ? 'kg' : ''}</span>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                                                        {dataType === 'weight'
                                                            ? (entry as FitbitLog).fatPercent ? `${(entry as FitbitLog).fatPercent}%` : '-'
                                                            : (entry.entryType === 'fitbit_data' ? (entry as FitbitLog).caloriesBurned : (entry as any).activeEnergy) || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(entry)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(entry.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
