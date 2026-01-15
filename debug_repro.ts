
import { formatISO, parseISO, startOfDay, subDays, endOfDay, getHours, format } from 'date-fns';

// Mock Interfaces
interface FitbitLog {
    id: string;
    timestamp: Date;
    entryType: 'fitbit_data';
    weight?: number;
    fatPercent?: number;
    steps?: number;
    caloriesBurned?: number;
}

// 1. Setup Mock Data based on Screenshot
// Jan 14, 2026, 3:00 PM: 65.5 kg
// Let's add a confusing "Steps only" entry for Jan 14 at 5:00 PM to simulate a sync
const mockEntries: FitbitLog[] = [
    {
        id: '1',
        timestamp: new Date('2026-01-14T15:00:00'), // 3 PM
        entryType: 'fitbit_data',
        weight: 65.5,
        fatPercent: 11.746
    },
    {
        id: '99',
        timestamp: new Date('2026-01-14T17:00:00'), // 5 PM - Later sync!
        entryType: 'fitbit_data',
        steps: 5000,
        // weight is undefined
    },
    {
        id: '2',
        timestamp: new Date('2026-01-13T15:00:00'),
        entryType: 'fitbit_data',
        weight: 66.7,
        fatPercent: 11.873
    }
];

// 2. The Aggregation Logic (Copied from TrendsPage)
const aggregateGenericByDay = <T extends { timestamp: Date }>(
    entries: T[],
    mapper: (date: string, itemsOnDate: T[]) => any
) => {
    const groupedByDay: Record<string, T[]> = {};
    entries.forEach(entry => {
        const dayKey = formatISO(entry.timestamp, { representation: 'date' });
        if (!groupedByDay[dayKey]) {
            groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(entry);
    });

    const sortedDays = Object.keys(groupedByDay).sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime());
    return sortedDays.map(dayKey => mapper(dayKey, groupedByDay[dayKey]));
};

// 3. Run the Logic
const weightEntries = mockEntries.filter(e => e.entryType === 'fitbit_data');

console.log("Raw Entries for Jan 14:", weightEntries.filter(e => e.timestamp.getDate() === 14));

const result = aggregateGenericByDay(weightEntries, (date, items) => {
    // Sort entries by time descending
    const sortedItems = items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log(`Processing Date: ${date}`);
    console.log(`Sorted Items:`, sortedItems.map(i => ({ t: i.timestamp.toISOString(), w: (i as any).weight })));

    // Find the latest entry that actually has a weight value.
    const latestWeightEntry = sortedItems.find(i => (i as any).weight && (i as any).weight > 0);

    // Use that entry, or fall back to the absolute latest if no weight exists (result will be 0)
    const effectiveEntry = latestWeightEntry || sortedItems[0];

    const weight = (effectiveEntry as any)?.weight || 0;
    const fatPercent = (effectiveEntry as any)?.fatPercent;
    const fatMass = (weight && fatPercent) ? (weight * fatPercent / 100) : undefined;
    return {
        date,
        weight,
        fatPercent,
        fatMass
    };
}).filter(p => {
    if (p.weight <= 0) console.log("Filtered out zero weight for date:", p.date);
    return p.weight > 0;
});

console.log("FINAL RESULT:", result);
