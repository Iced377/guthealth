'use client';

import React, { useEffect, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Flag, Trophy, Rocket, Users, Heart, Star, Lock, CheckCircle2, Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { db } from '@/config/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { IconPicker, ICON_MAP } from './IconPicker';

// Definition of a Milestone Item
interface Milestone {
    id: string;
    title: string;
    date: string;
    description: string;
    iconName: string;
    status: 'locked' | 'current' | 'completed';
    color: string; // Tailwind class mostly? Storing "text-blue-400" is risky if we change themes. Let's store a key or just the string for now.
    bg?: string; // Derived usually
}

// Default Seed Data (Migration Source)
const DEFAULT_MILESTONES: Milestone[] = [
    {
        id: 'build',
        title: 'Project Inception',
        date: 'Jan 2026',
        description: 'The idea was born. Codebase initialized.',
        iconName: 'Rocket',
        status: 'completed',
        color: 'text-blue-400'
    },
    {
        id: 'beta',
        title: 'Internal Beta',
        date: 'Late Jan 2026',
        description: 'First test flight with core team. Bugs squashed.',
        iconName: 'Flag',
        status: 'completed',
        color: 'text-purple-400'
    },
    {
        id: 'submission',
        title: 'App Store Submission',
        date: 'Feb 2026',
        description: 'Preparing for liftoff. Final checks complete.',
        iconName: 'Trophy',
        status: 'current',
        color: 'text-yellow-400'
    },
    {
        id: 'first-download',
        title: 'First Download',
        date: '---',
        description: 'A stranger trusts us with their gut health.',
        iconName: 'Users',
        status: 'locked',
        color: 'text-green-400'
    },
    {
        id: 'first-review',
        title: 'First 5-Star Review',
        date: '---',
        description: 'Validation of value.',
        iconName: 'Star',
        status: 'locked',
        color: 'text-orange-400'
    },
    {
        id: '100-users',
        title: '100 Active Users',
        date: '---',
        description: 'The community begins to form.',
        iconName: 'Heart',
        status: 'locked',
        color: 'text-pink-400'
    }
];

export function AppJourneyTab() {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Dialog State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
        title: '', date: 'Soon', description: '', iconName: 'Star', status: 'locked', color: 'text-blue-400'
    });

    // Listen to Firestore
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'admin_settings', 'app_journey'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.milestones && Array.isArray(data.milestones)) {
                    setMilestones(data.milestones);
                }
            } else {
                // Migration: Seed if empty
                seedData();
            }
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    const seedData = async () => {
        try {
            // Check if we have OLD status data to preserve?
            // User might have clicked stuff in previous step.
            // Let's check `admin_settings/milestones` (from Step 325)
            const oldStatusSnap = await getDoc(doc(db, 'admin_settings', 'milestones'));
            const oldStatuses = oldStatusSnap.exists() ? oldStatusSnap.data() : {};

            const mergedFn = DEFAULT_MILESTONES.map(m => ({
                ...m,
                status: oldStatuses[m.id] || m.status
            }));

            await setDoc(doc(db, 'admin_settings', 'app_journey'), { milestones: mergedFn });
            setMilestones(mergedFn);
            toast({ title: "Journey Initialized", description: "Migrated default milestones to database." });
        } catch (e) {
            console.error("Migration failed", e);
        }
    };

    const saveMilestones = async (newMilestones: Milestone[]) => {
        // Optimistic
        setMilestones(newMilestones);
        try {
            await setDoc(doc(db, 'admin_settings', 'app_journey'), { milestones: newMilestones }, { merge: true });
        } catch (e) {
            console.error(e);
            toast({ title: "Error Saving", variant: "destructive" });
        }
    };

    const handleToggleStatus = (id: string) => {
        const nextStatus: Record<string, Milestone['status']> = {
            'locked': 'current',
            'current': 'completed',
            'completed': 'locked'
        };

        const updated = milestones.map(m => {
            if (m.id === id) {
                return { ...m, status: nextStatus[m.status]! };
            }
            return m;
        });

        saveMilestones(updated);
        // Also sync to legacy location? Maybe not needed anymore if we fully migrate.
        // Let's stick to single source of truth: `admin_settings/app_journey`
    };

    const handleUpdateDate = (id: string, newDate: string) => {
        const updated = milestones.map(m => m.id === id ? { ...m, date: newDate } : m);
        saveMilestones(updated);
    };

    const handleAddMilestone = () => {
        if (!newMilestone.title) return;

        const item: Milestone = {
            id: `milestone-${Date.now()}`,
            title: newMilestone.title || "New Milestone",
            description: newMilestone.description || "",
            date: newMilestone.date || "Pending",
            iconName: newMilestone.iconName || "Star",
            status: newMilestone.status || 'locked',
            color: newMilestone.color || 'text-white'
        };

        saveMilestones([...milestones, item]);
        setIsAddDialogOpen(false);
        setNewMilestone({ title: '', date: 'Soon', description: '', iconName: 'Star', status: 'locked', color: 'text-blue-400' });
        toast({ title: "Milestone Added" });
    };

    if (isLoading && milestones.length === 0) return <div className="p-12 text-center text-white/50">Loading Journey...</div>;

    return (
        <div className="w-full min-h-[600px] p-6 md:p-12 relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black border border-white/5 rounded-2xl">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
                <div className="text-center mb-16 space-y-2">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-5xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-white to-purple-400"
                    >
                        The Ascent
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-white/40 font-mono text-sm tracking-widest"
                    >
                        FROM ZERO TO IMPACT
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-white/5 transform -translate-x-1/2 rounded-full overflow-hidden">
                        <motion.div
                            className="w-full bg-gradient-to-b from-blue-500 via-purple-500 to-yellow-500"
                            initial={{ height: '0%' }}
                            animate={{ height: '50%' }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                    </div>

                    <div className="space-y-12 pb-24">
                        <Reorder.Group axis="y" values={milestones} onReorder={(newOrder) => {
                            setMilestones(newOrder); // Optimistic visual update
                        }}>
                            {milestones.map((milestone, index) => {
                                const isLocked = milestone.status === 'locked';
                                const isCurrent = milestone.status === 'current';
                                const isCompleted = milestone.status === 'completed';
                                const alignRight = index % 2 === 0;
                                const IconComponent = ICON_MAP[milestone.iconName] || Star;

                                return (
                                    <Reorder.Item
                                        key={milestone.id}
                                        value={milestone}
                                        onDragEnd={() => saveMilestones(milestones)} // Save on drop
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative"
                                    >
                                        <div className={cn(
                                            "relative flex md:items-center py-6", // Added py-6 to give spacing for drag
                                            alignRight ? "md:flex-row-reverse" : "md:flex-row"
                                        )}>
                                            {/* Timeline Node (Clickable) */}
                                            <div
                                                className="absolute left-4 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-20 cursor-pointer group"
                                                onClick={() => handleToggleStatus(milestone.id)}
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full border-4 flex items-center justify-center bg-black transition-all duration-500 relative",
                                                    isCurrent ? "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-125" :
                                                        isCompleted ? `border-${milestone.color.split('-')[1] || 'blue'}-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]` :
                                                            "border-white/10 opacity-50 group-hover:opacity-100 group-hover:border-white/30"
                                                )}>
                                                    {isLocked ? <Lock className="w-4 h-4 text-white/20" /> :
                                                        isCompleted ? <CheckCircle2 className={cn("w-6 h-6", milestone.color)} /> :
                                                            <IconComponent className={cn("w-5 h-5", milestone.color)} />
                                                    }

                                                    {/* Hover Hint */}
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-[10px] whitespace-nowrap border border-white/20 pointer-events-none">
                                                        Click to Toggle
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content Card with Drag Handle */}
                                            <div className={cn(
                                                "ml-16 md:ml-0 md:w-1/2 p-4",
                                                alignRight ? "md:pr-16 md:text-right" : "md:pl-16 md:text-left"
                                            )}>
                                                <Card className={cn(
                                                    "bg-white/5 border-white/10 p-6 backdrop-blur-sm hover:border-white/20 transition-all group/card relative",
                                                    isCurrent && "border-yellow-500/30 bg-yellow-500/5 ring-1 ring-yellow-500/20",
                                                    isCompleted && "border-green-500/30 bg-green-500/5",
                                                    isLocked && "opacity-40 grayscale"
                                                )}>
                                                    {/* Drag Handle - Only visible on hover or always? Let's make it visible on hover */}
                                                    <div className={cn(
                                                        "absolute top-2 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors z-30",
                                                        alignRight ? "left-2" : "right-2"
                                                    )} data-drag-handle>
                                                        <GripVertical className="w-5 h-5" />
                                                    </div>

                                                    <div className={cn("flex flex-col gap-1", alignRight && "md:items-end")}>
                                                        {/* Editable Date Badge */}
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <span className={cn(
                                                                    "text-xs font-bold uppercase tracking-wider py-0.5 px-2 rounded-full w-fit mb-2 cursor-pointer hover:bg-white/10 transition-colors",
                                                                    isCurrent ? "bg-yellow-500/20 text-yellow-300" :
                                                                        isCompleted ? "bg-green-500/20 text-green-300" :
                                                                            "bg-white/5 text-white/40"
                                                                )}>
                                                                    {milestone.date}
                                                                </span>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-48 p-2 bg-black border border-white/20">
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        defaultValue={milestone.date}
                                                                        className="h-8 text-xs"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleUpdateDate(milestone.id, e.currentTarget.value);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground mt-1 ml-1">Press Enter to save</p>
                                                            </PopoverContent>
                                                        </Popover>


                                                        <h3 className={cn("text-xl font-bold text-white", isCurrent && "text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500")}>
                                                            {milestone.title}
                                                        </h3>
                                                        <p className="text-white/60 text-sm leading-relaxed">
                                                            {milestone.description}
                                                        </p>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Spacer for opposite side */}
                                            <div className="hidden md:block md:w-1/2" />
                                        </div>
                                    </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>

                        {/* ADD NEW MILESTONE BUTTON */}
                        <div className="flex justify-center pt-8">
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="lg" className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md gap-2 text-white/60 hover:text-white">
                                        <Plus className="w-5 h-5" />
                                        Add Milestone
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>New Milestone</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={newMilestone.title}
                                                onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                                placeholder="e.g. 1000 Downloads"
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Date Label</Label>
                                                <Input
                                                    value={newMilestone.date}
                                                    onChange={e => setNewMilestone({ ...newMilestone, date: e.target.value })}
                                                    placeholder="e.g. Mar 2026"
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Icon</Label>
                                                <IconPicker
                                                    value={newMilestone.iconName || 'Star'}
                                                    onChange={icon => setNewMilestone({ ...newMilestone, iconName: icon })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={newMilestone.description}
                                                onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                                placeholder="What does this achievement mean?"
                                                className="bg-white/5 border-white/10 resize-none h-20"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleAddMilestone} className="bg-white text-black hover:bg-white/90">Add Milestone</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
