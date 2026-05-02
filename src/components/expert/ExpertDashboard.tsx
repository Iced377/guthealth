'use client';

import React, { useState } from 'react';
import LiquidWizardCard from '@/components/setup/LiquidWizardCard';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { 
    Users, 
    RefreshCcw, 
    UserPlus, 
    ChevronRight, 
    ShieldCheck, 
    CalendarDays,
    MessageSquare,
    Eye,
    Footprints,
    Utensils,
    UserCircle,
    Weight,
    Target,
    FileBarChart,
    Lock,
    Loader2
} from 'lucide-react';
import type { ExpertProfile, ExpertClientRelationship, ConsentDataCategory, ExpertConsentAuditEvent } from '@/types';

interface ExpertDashboardProps {
    expert: ExpertProfile;
    relationship: ExpertClientRelationship;
    onSwitchExpert: () => void;
    onRerunQuestionnaire: () => void;
}

const DATA_CATEGORIES: { id: ConsentDataCategory; label: string; icon: React.ComponentType<{ className?: string }>; desc: string; required?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: UserCircle, desc: 'Name, age, avatar', required: true },
    { id: 'goal', label: 'Goal', icon: Target, desc: 'Active nutrition goal' },
    { id: 'foodJournal', label: 'Food Journal', icon: Utensils, desc: 'Meal logs & macros', required: true },
    { id: 'weight', label: 'Weight', icon: Weight, desc: 'Weight history' },
    { id: 'steps', label: 'Steps', icon: Footprints, desc: 'Daily step count' },
    { id: 'foodRealityCapture', label: 'Food Reality Capture', icon: Eye, desc: '3-day food snapshot' },
    { id: 'foodRealityReport', label: 'Food Reality Report', icon: FileBarChart, desc: 'Generated insight report' },
];

export default function ExpertDashboard({ 
    expert, 
    relationship, 
    onSwitchExpert, 
    onRerunQuestionnaire 
}: ExpertDashboardProps) {
    const { isDarkMode } = useTheme();
    const { toast } = useToast();
    const [updatingCat, setUpdatingCat] = useState<string | null>(null);
    const [localCategories, setLocalCategories] = useState<ConsentDataCategory[]>(relationship.consentedDataCategories);

    const handleToggleCategory = async (catId: ConsentDataCategory) => {
        const cat = DATA_CATEGORIES.find(c => c.id === catId);
        if (cat?.required) return;
        
        setUpdatingCat(catId);
        try {
            const isRemoving = localCategories.includes(catId);
            const nextCategories = isRemoving 
                ? localCategories.filter(id => id !== catId)
                : [...localCategories, catId];
            
            const relRef = doc(db, 'expertClientRelationships', relationship.id);
            const now = Timestamp.now();
            
            // 1. Update relationship
            await updateDoc(relRef, {
                consentedDataCategories: nextCategories,
                updatedAt: now
            });

            // 2. Audit event
            const auditEvent: Omit<ExpertConsentAuditEvent, 'id'> = {
                relationshipId: relationship.id,
                clientUserId: relationship.clientUserId,
                expertId: relationship.expertId,
                eventType: isRemoving ? 'revoked' : 'granted',
                dataCategories: [catId],
                consentVersion: relationship.consentVersion,
                timestamp: now,
            };
            await addDoc(collection(db, 'expertConsentAuditEvents'), auditEvent);

            setLocalCategories(nextCategories);
            toast({
                title: isRemoving ? 'Access Revoked' : 'Access Granted',
                description: `${cat?.label} sharing has been updated.`,
            });
        } catch (e) {
            console.error('Failed to update category:', e);
            toast({
                title: 'Update Failed',
                description: 'Could not change permissions. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setUpdatingCat(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-20 pb-32 px-4">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                        My Expert
                    </h1>
                </motion.div>

                {/* Expert Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                        "rounded-[2.5rem] p-6 shadow-xl border relative overflow-hidden",
                        isDarkMode ? "bg-zinc-900/50 border-white/5" : "bg-white border-zinc-100"
                    )}
                >
                    <div className="absolute top-0 right-0 p-4">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                            {relationship.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            {expert.profilePictureUrl ? (
                                <img 
                                    src={expert.profilePictureUrl} 
                                    alt={expert.displayName}
                                    className="w-20 h-20 rounded-3xl object-cover shadow-lg"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {expert.displayName.charAt(0)}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-900 shadow-sm" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-none mb-1">
                                {expert.displayName}
                            </h2>
                            <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">
                                {expert.headline}
                            </p>
                        </div>
                    </div>

                    {expert.specialityTags && expert.specialityTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-6">
                            {expert.specialityTags.map(tag => (
                                <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className={cn(
                            "p-3 rounded-2xl flex flex-col gap-1",
                            isDarkMode ? "bg-white/5" : "bg-zinc-50"
                        )}>
                            <div className="flex items-center gap-2 text-emerald-500">
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Assigned</span>
                            </div>
                            <p className="text-sm font-bold">
                                {relationship.createdAt instanceof Date 
                                    ? relationship.createdAt.toLocaleDateString()
                                    : 'Recently'}
                            </p>
                        </div>
                        <div className={cn(
                            "p-3 rounded-2xl flex flex-col gap-1",
                            isDarkMode ? "bg-white/5" : "bg-zinc-50"
                        )}>
                            <div className="flex items-center gap-2 text-emerald-500">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Sharing</span>
                            </div>
                            <p className="text-sm font-bold">
                                {localCategories.length} Categories
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Permissions Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    <div className="flex items-center justify-between px-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Data Access Permissions</p>
                        <Lock className="w-3 h-3 text-zinc-500" />
                    </div>
                    
                    <div className={cn(
                        "rounded-[2.5rem] p-2 border overflow-hidden",
                        isDarkMode ? "bg-zinc-900/50 border-white/5" : "bg-white border-zinc-100"
                    )}>
                        {DATA_CATEGORIES.map((cat, i) => {
                            const isShared = localCategories.includes(cat.id);
                            const Icon = cat.icon;
                            const isUpdating = updatingCat === cat.id;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => handleToggleCategory(cat.id)}
                                    disabled={cat.required || !!updatingCat}
                                    className={cn(
                                        "w-full p-4 rounded-[1.8rem] flex items-center justify-between transition-all relative group mb-1 last:mb-0",
                                        isShared 
                                            ? (isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50")
                                            : "hover:bg-zinc-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                            isShared 
                                                ? "bg-emerald-500 text-white" 
                                                : (isDarkMode ? "bg-white/5 text-zinc-500" : "bg-zinc-100 text-zinc-400")
                                        )}>
                                            {isUpdating ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Icon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center gap-1.5">
                                                <p className={cn(
                                                    "font-bold text-sm",
                                                    isShared ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
                                                )}>
                                                    {cat.label}
                                                </p>
                                                {cat.required && (
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-black uppercase tracking-tighter">Required</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{cat.desc}</p>
                                        </div>
                                    </div>
                                    
                                    {!cat.required && (
                                        <div className={cn(
                                            "w-10 h-5 rounded-full relative transition-colors duration-300",
                                            isShared ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                                        )}>
                                            <motion.div 
                                                animate={{ x: isShared ? 22 : 2 }}
                                                className="absolute top-1 left-0 w-3 h-3 rounded-full bg-white shadow-sm"
                                            />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Management Actions */}
                <div className="space-y-3">
                    <div className="px-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Expert Management</p>
                    </div>
                    
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={onRerunQuestionnaire}
                        className={cn(
                            "w-full p-5 rounded-[2rem] flex items-center justify-between group transition-all active:scale-[0.98]",
                            isDarkMode ? "bg-white/5 border border-white/5 hover:bg-white/10" : "bg-white border border-zinc-100 hover:bg-zinc-50"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <RefreshCcw className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-zinc-900 dark:text-white">Rerun Questionnaire</p>
                                <p className="text-xs text-zinc-500">Update your data and restart 3-day capture</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-amber-500 transition-colors" />
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        onClick={onSwitchExpert}
                        className={cn(
                            "w-full p-5 rounded-[2rem] flex items-center justify-between group transition-all active:scale-[0.98]",
                            isDarkMode ? "bg-white/5 border border-white/5 hover:bg-white/10" : "bg-white border border-zinc-100 hover:bg-zinc-50"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-zinc-900 dark:text-white">Switch Expert</p>
                                <p className="text-xs text-zinc-500">Connect with a different nutrition specialist</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                    </motion.button>
                </div>

                {/* Footer Info */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3"
                >
                    <MessageSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-500/80 leading-relaxed">
                        Your expert will review your Food Reality Capture and provide feedback directly in your timeline. You can revoke access at any time from this dashboard.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
