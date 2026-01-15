
const { formatISO, parseISO } = require('date-fns');

// Mock Data
const mockEntries = [
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
        steps: 5000
    },
    {
        id: '2',
        timestamp: new Date('2026-01-13T15:00:00'),
        entryType: 'fitbit_data',
        weight: 66.7,
        fatPercent: 11.873
    }
];

const aggregateGenericByDay = (entries, mapper) => {
    const groupedByDay = {};
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

const weightEntries = mockEntries.filter(e => e.entryType === 'fitbit_data');

console.log("Raw Entries for Jan 14:", weightEntries.filter(e => e.timestamp.getDate() === 14));

const result = aggregateGenericByDay(weightEntries, (date, items) => {
    const sortedItems = items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log(`Processing Date: ${date}`);
    console.log(`Sorted Items:`, sortedItems.map(i => ({ t: i.timestamp.toISOString(), w: i.weight })));

    const latestWeightEntry = sortedItems.find(i => i.weight && i.weight > 0);
    const effectiveEntry = latestWeightEntry || sortedItems[0];

    const weight = effectiveEntry?.weight || 0;
    return {
        date,
        weight
    };
}).filter(p => {
    if (p.weight <= 0) console.log("Filtered out zero weight for date:", p.date);
    return p.weight > 0;
});

console.log("FINAL RESULT:", result);
