'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Plus, Tag, Loader2, MessageSquare } from 'lucide-react';
import type { ExpertNote } from '@/types';
import { useNavVisibility } from '@/components/navigation/useNavVisibilityController';

interface ExpertNotesDialogProps {
    expertId: string;
    clientUserId: string;
    relationshipId: string;
    onClose: () => void;
}

const TAG_OPTIONS = ['Follow-up', 'Pattern', 'Concern', 'Positive', 'Action Item', 'Question'];

export default function ExpertNotesDialog({ expertId, clientUserId, relationshipId, onClose }: ExpertNotesDialogProps) {
    const { isDarkMode } = useTheme();
    const { lockNav, unlockNav, setNavVisible } = useNavVisibility();
    const [notes, setNotes] = useState<ExpertNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New note form
    const [noteText, setNoteText] = useState('');
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        // Lock navigation when dialog opens
        lockNav('SHEET_OPEN');
        setNavVisible(false);

        const fetchNotes = async () => {
            try {
                const snap = await getDocs(
                    query(
                        collection(db, 'expertNotes'),
                        where('expertId', '==', expertId),
                        where('clientUserId', '==', clientUserId),
                        orderBy('createdAt', 'desc')
                    )
                );
                setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExpertNote)));
            } catch (e) {
                console.error('Failed to fetch notes:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchNotes();

        return () => {
            // Unlock navigation when dialog closes
            unlockNav('SHEET_OPEN');
            setNavVisible(true);
        };
    }, [expertId, clientUserId, lockNav, unlockNav, setNavVisible]);

    const handleSave = async () => {
        if (!noteText.trim()) return;
        setSaving(true);

        try {
            const now = Timestamp.now();
            const newNote: Omit<ExpertNote, 'id'> = {
                expertId,
                clientUserId,
                relationshipId,
                tags: Array.from(selectedTags),
                noteText: noteText.trim(),
                createdAt: now,
                updatedAt: now,
                visibility: 'expert_only',
            };

            const docRef = await addDoc(collection(db, 'expertNotes'), newNote);
            setNotes(prev => [{ id: docRef.id, ...newNote } as ExpertNote, ...prev]);
            setNoteText('');
            setSelectedTags(new Set());
            setShowForm(false);
        } catch (e) {
            console.error('Failed to save note:', e);
        } finally {
            setSaving(false);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => {
            const next = new Set(prev);
            if (next.has(tag)) next.delete(tag);
            else next.add(tag);
            return next;
        });
    };

    const formatDate = (d: any) => {
        try {
            const date = d?.toDate ? d.toDate() : new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                    "relative z-10 w-full max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col",
                    isDarkMode ? "bg-zinc-900" : "bg-white"
                )}
            >
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-between p-4 border-b shrink-0",
                    isDarkMode ? "border-zinc-800" : "border-zinc-100"
                )}>
                    <div>
                        <h2 className="text-lg font-bold">Expert Notes</h2>
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Private · Expert Only</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        </div>
                    ) : notes.length === 0 && !showForm ? (
                        <div className="text-center py-10">
                            <p className="text-sm text-muted-foreground">No notes yet.</p>
                        </div>
                    ) : (
                        notes.map((note, i) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    "rounded-2xl p-3 border",
                                    isDarkMode ? "bg-zinc-800/60 border-zinc-700/50" : "bg-zinc-50 border-zinc-200"
                                )}
                            >
                                {note.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {note.tags.map(tag => (
                                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-sm leading-relaxed">{note.noteText}</p>
                                <p className="text-[10px] text-muted-foreground/40 mt-2">{formatDate(note.createdAt)}</p>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* New Note Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className={cn(
                                "overflow-hidden border-t",
                                isDarkMode ? "border-zinc-800" : "border-zinc-100"
                            )}
                        >
                            <div className="p-4 space-y-3">
                                {/* Tags */}
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-1.5 flex items-center gap-1">
                                        <Tag className="w-3 h-3" /> Tags
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {TAG_OPTIONS.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={cn(
                                                    "text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors",
                                                    selectedTags.has(tag)
                                                        ? "bg-emerald-500 text-white"
                                                        : isDarkMode
                                                            ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                                )}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Note input (expert-only, so text input is allowed here) */}
                                <textarea
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    placeholder="Write your observation..."
                                    rows={3}
                                    className={cn(
                                        "w-full rounded-xl p-3 text-sm resize-none border focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
                                        isDarkMode ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-zinc-50 border-zinc-200"
                                    )}
                                />

                                <button
                                    onClick={handleSave}
                                    disabled={saving || !noteText.trim()}
                                    className={cn(
                                        "w-full py-3 rounded-xl font-bold text-sm transition-all",
                                        saving || !noteText.trim()
                                            ? "bg-emerald-500/30 text-white/50"
                                            : "bg-emerald-500 text-white active:scale-[0.97]"
                                    )}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Note'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating add button */}
                {!showForm && (
                    <div className={cn("p-4 border-t shrink-0", isDarkMode ? "border-zinc-800" : "border-zinc-100")}>
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-emerald-500 text-white active:scale-[0.97] transition-transform"
                        >
                            <Plus className="w-4 h-4" /> Add Note
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
