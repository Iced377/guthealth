// src/hooks/useRamadanCards.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { RamadanTip, RAMADAN_SEED_DECK } from '@/data/ramadan-seed';
import { generateRamadanTipAction } from '@/app/explore/ramadan/actions';
import { db, auth } from '@/config/firebase'; // Import initialized instances
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';

const STORAGE_KEY_CACHE = 'ramadan_cards_cache';
const STORAGE_KEY_LIMIT = 'ramadan_daily_rate_limit';
const STORAGE_KEY_HISTORY = 'ramadan_cards_history';
const STORAGE_KEY_GOALS = 'ramadan_committed_goals';
const STORAGE_KEY_COMPLETIONS = 'ramadan_goal_completions';
const STORAGE_KEY_SAVED = 'ramadan_saved_cards';
const STORAGE_KEY_SAVED_LIST = 'ramadan_saved_cards_list';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DAILY_LIMIT = 10;
const BUFFER_SIZE = 4;
const HISTORY_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheData {
    cards: RamadanTip[];
    timestamp: number;
}

interface RateLimitData {
    count: number;
    date: string;
}

interface HistoryData {
    topics: string[];
    lastCategory?: RamadanTip['category'];
    timestamp: number;
}

interface CommittedGoal {
    id: string;
    title: string;
    actionItem?: string;
    category: RamadanTip['category'];
    createdAt: number;
    active: boolean;
}

type CompletionLog = Record<string, string[]>;

interface SavedCard extends RamadanTip {
    savedAt?: number;
}

const dedupeSavedCards = (cards: SavedCard[]) => {
    const seen = new Set<string>();
    const result: SavedCard[] = [];
    for (const card of cards) {
        if (!card.topicId || seen.has(card.topicId)) continue;
        seen.add(card.topicId);
        result.push(card);
    }
    return result;
};

const getRamadanPhaseFromLocalTime = (): {
    localTime: string;
    phase: 'PRE_SUHOOR' | 'SUHOOR' | 'FASTING_MORNING' | 'FASTING_AFTERNOON' | 'PRE_IFTAR' | 'IFTAR' | 'POST_IFTAR' | 'NIGHT';
} => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const localTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    if (hour >= 4 && hour < 6) {
        return { localTime, phase: 'SUHOOR' };
    }
    if (hour >= 6 && hour < 12) {
        return { localTime, phase: 'FASTING_MORNING' };
    }
    if (hour >= 12 && hour < 17) {
        return { localTime, phase: 'FASTING_AFTERNOON' };
    }
    if (hour >= 17 && hour < 19) {
        return { localTime, phase: 'PRE_IFTAR' };
    }
    if (hour >= 19 && hour < 21) {
        return { localTime, phase: 'IFTAR' };
    }
    if (hour >= 21 && hour < 24) {
        return { localTime, phase: 'POST_IFTAR' };
    }
    return { localTime, phase: 'NIGHT' };
};

export function useRamadanCards() {
    const [cards, setCards] = useState<RamadanTip[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const isFetching = useRef(false);
    const didInitRef = useRef(false);
    const isReadyRef = useRef(false);
    const [history, setHistory] = useState<string[]>([]);
    const [lastCategory, setLastCategory] = useState<RamadanTip['category'] | undefined>(undefined);
    const [committedGoals, setCommittedGoals] = useState<CommittedGoal[]>([]);
    const [completionLog, setCompletionLog] = useState<CompletionLog>({});
    const [overrideTodayKey, setOverrideTodayKey] = useState<string | null>(null);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
    const [savedDocIds, setSavedDocIds] = useState<Record<string, string>>({});

    const [dismissedStack, setDismissedStack] = useState<RamadanTip[]>([]);

    // Initialize from Cache or Seed (guarded to avoid double-init in dev)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (didInitRef.current) return;
        didInitRef.current = true;

        const goalsRaw = localStorage.getItem(STORAGE_KEY_GOALS);
        if (goalsRaw) {
            try {
                const parsed = JSON.parse(goalsRaw) as CommittedGoal[];
                if (Array.isArray(parsed)) {
                    setCommittedGoals(parsed);
                }
            } catch (e) {
                console.warn("Failed to parse ramadan goals", e);
            }
        }

        const savedRaw = localStorage.getItem(STORAGE_KEY_SAVED);
        if (savedRaw) {
            try {
                const parsed = JSON.parse(savedRaw) as string[];
                if (Array.isArray(parsed)) {
                    setSavedIds(new Set(parsed));
                }
            } catch (e) {
                console.warn("Failed to parse ramadan saved cards", e);
            }
        }

        const savedListRaw = localStorage.getItem(STORAGE_KEY_SAVED_LIST);
        if (savedListRaw) {
            try {
                const parsed = JSON.parse(savedListRaw) as SavedCard[];
                if (Array.isArray(parsed)) {
                    setSavedCards(dedupeSavedCards(parsed));
                }
            } catch (e) {
                console.warn("Failed to parse ramadan saved card list", e);
            }
        }

        const completionsRaw = localStorage.getItem(STORAGE_KEY_COMPLETIONS);
        if (completionsRaw) {
            try {
                const parsed = JSON.parse(completionsRaw) as CompletionLog;
                if (parsed && typeof parsed === 'object') {
                    setCompletionLog(parsed);
                }
            } catch (e) {
                console.warn("Failed to parse ramadan completions", e);
            }
        }

        const historyRaw = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (historyRaw) {
            try {
                const parsed: HistoryData = JSON.parse(historyRaw);
                if (Date.now() - parsed.timestamp < HISTORY_TTL) {
                    setHistory(parsed.topics || []);
                    setLastCategory(parsed.lastCategory);
                }
            } catch (e) {
                console.warn("Failed to parse ramadan history", e);
            }
        }

        const cached = localStorage.getItem(STORAGE_KEY_CACHE);
        if (cached) {
            try {
                const parsed: CacheData = JSON.parse(cached);
                const now = Date.now();
                if (now - parsed.timestamp < CACHE_TTL && parsed.cards.length > 0) {
                    setCards(parsed.cards);
                    // Extract history from cached cards to avoid repeating them immediately if we fetch more
                    setHistory((prev) => {
                        const merged = new Set([...prev, ...parsed.cards.map(c => c.topicId)]);
                        return Array.from(merged);
                    });
                    setIsReady(true);
                    return;
                }
            } catch (e) {
                console.warn("Failed to parse ramadan cache", e);
            }
        }
        // Fallback to seed
        setCards(RAMADAN_SEED_DECK);
        setIsReady(true);
    }, []);

    useEffect(() => {
        isReadyRef.current = isReady;
    }, [isReady]);

    // Persist to Cache whenever cards change
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (cards.length > 0) {
            const cache: CacheData = {
                cards,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(cache));
        }
    }, [cards]);

    // Persist history for multi-day novelty
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const payload: HistoryData = {
            topics: history.slice(-100), // keep last 100 for size control
            lastCategory,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(payload));
    }, [history, lastCategory]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(committedGoals));
    }, [committedGoals]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(completionLog));
    }, [completionLog]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(Array.from(savedIds)));
    }, [savedIds]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_SAVED_LIST, JSON.stringify(savedCards));
    }, [savedCards]);

    // Load saved cards from Firestore when logged in
    useEffect(() => {
        const loadSaved = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                const snapshot = await getDocs(collection(db, 'users', user.uid, 'saved_ramadan_cards'));
                const nextCards: SavedCard[] = [];
                const nextDocIds: Record<string, string> = {};
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data() as SavedCard;
                    if (data.topicId) {
                        nextDocIds[data.topicId] = docSnap.id;
                        nextCards.push({ ...data, savedAt: data.savedAt || Date.now() });
                    }
                });
                setSavedDocIds(nextDocIds);
                setSavedIds(new Set(Object.keys(nextDocIds)));
                if (nextCards.length > 0) {
                    setSavedCards(dedupeSavedCards(nextCards));
                }
            } catch (error) {
                console.error("Failed to load saved Ramadan cards:", error);
            }
        };
        loadSaved();
    }, []);


    // Check Rate Limit
    const checkRateLimit = useCallback((): boolean => {
        if (typeof window === 'undefined') return false;

        const today = new Date().toDateString();
        const stored = localStorage.getItem(STORAGE_KEY_LIMIT);
        let data: RateLimitData = { count: 0, date: today };

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.date === today) {
                    data = parsed;
                }
            } catch (e) {/* ignore */ }
        }

        if (data.count >= DAILY_LIMIT) return false;

        // Increment
        data.count++;
        localStorage.setItem(STORAGE_KEY_LIMIT, JSON.stringify(data));
        return true;
    }, []);

    // Fetch New Card
    const fetchNextCard = useCallback(async () => {
        if (!isReadyRef.current) return;
        if (isFetching.current) return;

        // 1. Check Rate Limit
        if (!checkRateLimit()) {
            console.log("Ramadan Cards: Rate limit reached, using seed.");
            // Pick a random seed card that isn't in current stack if possible
            const nextSeed = RAMADAN_SEED_DECK[Math.floor(Math.random() * RAMADAN_SEED_DECK.length)];
            setCards(prev => [...prev, { ...nextSeed, topicId: `${nextSeed.topicId}-${Date.now()}` }]); // append
            return;
        }

        isFetching.current = true;
        setIsLoading(true);

        try {
            // Context would ideally come from a user context hook, but for now we mock/stub what we can
            // In a real app, pass explicit UserProfile here
            const timeContext = getRamadanPhaseFromLocalTime();
            const context = {
                timeContext: {
                    localTime: timeContext.localTime,
                    phase: timeContext.phase,
                },
                history: {
                    lastCategory: lastCategory,
                    recentlySeenTopics: history,
                }
                // userProfile is optional in schema, can omit or pass defaults
            };

            const result = await generateRamadanTipAction(context);

            if (result.success && result.tip) {
                setCards(prev => [...prev, result.tip as RamadanTip]);
                setHistory(prev => [...prev, result.tip!.topicId]);
                setLastCategory(result.tip!.category);
            } else {
                console.warn("Ramadan Cards: AI generation failure, using seed.");
                // Fallback
                const nextSeed = RAMADAN_SEED_DECK[Math.floor(Math.random() * RAMADAN_SEED_DECK.length)];
                setCards(prev => [...prev, { ...nextSeed, topicId: `${nextSeed.topicId}-${Date.now()}` }]);
            }

        } catch (error) {
            console.error("Ramadan Cards: Fetch error", error);
        } finally {
            isFetching.current = false;
            setIsLoading(false);
        }

    }, [checkRateLimit, history]);

    // Monitor Buffer and Refill
    useEffect(() => {
        if (!isReadyRef.current) return;
        if (cards.length < BUFFER_SIZE && !isFetching.current) {
            fetchNextCard();
        }
    }, [cards.length, fetchNextCard]);

    const removeTopCard = useCallback(() => {
        setCards(prev => {
            const [removed, ...rest] = prev;
            if (removed) {
                setDismissedStack(d => [removed, ...d]); // Push to history
                setLastCategory(removed.category);
            }
            return rest;
        });
    }, []);

    const restoreLastCard = useCallback(() => {
        setDismissedStack(prev => {
            if (prev.length === 0) return prev;
            const [last, ...rest] = prev;
            setCards(c => [last, ...c]); // Bring back to top
            return rest;
        });
    }, []);

    const toggleSaveCard = useCallback(async (tip: RamadanTip) => {
        const user = auth.currentUser;
        const alreadySaved = savedIds.has(tip.topicId);

        // Local toggle (always)
        setSavedIds(prev => {
            const next = new Set(prev);
            if (alreadySaved) {
                next.delete(tip.topicId);
            } else {
                next.add(tip.topicId);
            }
            return next;
        });
        setSavedCards(prev => {
            if (alreadySaved) {
                return prev.filter(card => card.topicId !== tip.topicId);
            }
            const next: SavedCard = { ...tip, source: tip.source || 'seed', savedAt: Date.now() };
            return dedupeSavedCards([next, ...prev]);
        });

        if (!user) {
            console.warn("Cannot save card: User not logged in");
            return;
        }

        try {
            if (alreadySaved) {
                const docId = savedDocIds[tip.topicId];
                if (docId) {
                    await deleteDoc(doc(db, 'users', user.uid, 'saved_ramadan_cards', docId));
                }
                setSavedDocIds(prev => {
                    const next = { ...prev };
                    delete next[tip.topicId];
                    return next;
                });
                return;
            }

            const cardData = {
                topicId: tip.topicId,
                title: tip.title,
                content: tip.content,
                category: tip.category,
                actionItem: tip.actionItem || null,
                source: tip.source || 'ai',
                version: '1.0',
                savedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'users', user.uid, 'saved_ramadan_cards'), cardData);
            setSavedDocIds(prev => ({ ...prev, [tip.topicId]: docRef.id }));
        } catch (error) {
            console.error("Error saving card:", error);
        }
    }, [savedIds, savedDocIds]);

    const getTodayKey = () => overrideTodayKey ?? new Date().toISOString().slice(0, 10);

    const commitGoal = useCallback((tip: RamadanTip) => {
        const id = `goal-${tip.topicId}`;
        setCommittedGoals(prev => {
            const existing = prev.find(goal => goal.id === id);
            if (existing) {
                return prev.map(goal => goal.id === id ? { ...goal, active: true } : goal);
            }
            return [
                {
                    id,
                    title: tip.title,
                    actionItem: tip.actionItem,
                    category: tip.category,
                    createdAt: Date.now(),
                    active: true
                },
                ...prev
            ];
        });
    }, []);

    const uncommitGoal = useCallback((goalId: string) => {
        setCommittedGoals(prev => prev.map(goal => goal.id === goalId ? { ...goal, active: false } : goal));
        setCompletionLog(prev => {
            const next: CompletionLog = {};
            for (const [dateKey, goals] of Object.entries(prev)) {
                next[dateKey] = goals.filter(id => id !== goalId);
            }
            return next;
        });
    }, []);

    const toggleGoalForDate = useCallback((dateKey: string, goalId: string) => {
        setCompletionLog(prev => {
            const existing = prev[dateKey] || [];
            const has = existing.includes(goalId);
            const next = has ? existing.filter(id => id !== goalId) : [...existing, goalId];
            return { ...prev, [dateKey]: next };
        });
    }, []);

    const getCompletionForDate = useCallback((dateKey: string) => {
        const completed = completionLog[dateKey] || [];
        return completed;
    }, [completionLog]);

    return {
        cards,
        removeTopCard,
        restoreLastCard,
        canGoBack: dismissedStack.length > 0,
        saveCard: toggleSaveCard,
        isLoading,
        isReady,
        savedIds,
        savedCards,
        commitGoal,
        committedGoals,
        uncommitGoal,
        toggleGoalForDate,
        getCompletionForDate,
        setOverrideTodayKey
    };
}
