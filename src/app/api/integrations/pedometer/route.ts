
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    console.log('[PedometerImport] Starting request');
    try {
        const adminApp = getAdminApp();
        console.log('[PedometerImport] Admin App initialized:', !!adminApp);

        const adminAuth = getAuth(adminApp);
        const adminDb = getFirestore(adminApp);
        console.log('[PedometerImport] Auth/DB initialized');

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const { csvContent } = await req.json();

        if (!csvContent || typeof csvContent !== 'string') {
            return NextResponse.json({ error: 'Invalid CSV content' }, { status: 400 });
        }

        const lines = csvContent.split(/\r?\n/);
        if (lines.length < 2) {
            return NextResponse.json({ error: 'CSV file is empty or missing data' }, { status: 400 });
        }

        // Attempt to parse headers
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));

        // Heuristic for column indices
        let dateIndex = headers.findIndex(h => h.includes('date') || h.includes('day'));
        let stepsIndex = headers.findIndex(h => h.includes('steps') || h.includes('count'));
        const distanceIndex = headers.findIndex(h => h.includes('distance'));
        const floorsIndex = headers.findIndex(h => h.includes('floors'));
        const energyIndex = headers.findIndex(h => h.includes('active') || h.includes('cal'));

        // If headers aren't clear, assume default Pedometer++ export format:
        // Date, Steps, Distance, Floors... (often just first two are critical)
        if (dateIndex === -1 && stepsIndex === -1) {
            dateIndex = 0;
            stepsIndex = 1;
        }

        const entriesToSave = [];
        const dataLines = lines.slice(1);
        const skippedErrors = [];

        for (const line of dataLines) {
            if (!line.trim()) continue;

            const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));

            // Use found indices or defaults
            const dateStr = cols[dateIndex];
            const stepsStr = cols[stepsIndex];

            if (!dateStr || !stepsStr) {
                skippedErrors.push(`Missing date or steps in line: ${line}`);
                continue;
            }

            // Parsing logic customized for likely formats
            // Handle M/D/YY format (e.g. 1/1/26) directly if Date() constructor fails or is ambiguous
            const dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) {
                console.log('[PedometerImport] Skipping line (invalid date):', dateStr);
                continue;
            }

            // Fix for 2-digit years if interpreted as 19xx
            const year = dateObj.getFullYear();
            if (year < 2000) {
                dateObj.setFullYear(year + 100);
            }

            const steps = parseInt(stepsStr.replace(/,/g, ''), 10);
            if (isNaN(steps)) {
                console.log('[PedometerImport] Skipping line (invalid steps):', stepsStr);
                continue;
            }

            // Check distance for 'km' or 'mi'
            // Screenshot shows "3.4km"
            let distStr = distanceIndex !== -1 ? cols[distanceIndex] : '0';
            if (distStr) {
                distStr = distStr.toLowerCase().replace('km', '').replace('mi', '').trim();
            }
            const dist = parseFloat(distStr);

            const floors = floorsIndex !== -1 ? parseFloat(cols[floorsIndex]) : 0;
            const energy = energyIndex !== -1 ? parseFloat(cols[energyIndex]) : 0;

            console.log(`[PedometerImport] Parsed: ${dateStr} -> ${dateObj.toISOString()}, Steps: ${steps}`);

            // Create doc ID based on time
            const docId = `pedometer_${dateObj.getTime()}`;

            entriesToSave.push({
                ref: adminDb.collection('users').doc(uid).collection('timelineEntries').doc(docId),
                data: {
                    id: docId,
                    timestamp: Timestamp.fromDate(dateObj),
                    entryType: 'pedometer_data',
                    steps: steps,
                    distance: isNaN(dist) ? 0 : dist,
                    floorsAscended: isNaN(floors) ? 0 : floors,
                    activeEnergy: isNaN(energy) ? 0 : energy,
                    source: 'pedometer_plus_plus',
                }
            });
        }

        // Batch Process
        const batchSize = 400;
        const batches = [];

        console.log(`[PedometerImport] Processing ${entriesToSave.length} entries with batch size ${batchSize}`);

        for (let i = 0; i < entriesToSave.length; i += batchSize) {
            const batch = adminDb.batch();
            const chunk = entriesToSave.slice(i, i + batchSize);
            chunk.forEach(item => {
                batch.set(item.ref, item.data, { merge: true });
            });
            batches.push(batch.commit());
        }

        console.log('[PedometerImport] Committing batches...');
        await Promise.all(batches);
        console.log('[PedometerImport] Batches committed successfully');

        return NextResponse.json({
            success: true,
            count: entriesToSave.length,
            message: `Successfully imported ${entriesToSave.length} entries.`
        });

    } catch (error: any) {
        console.error('Error importing Pedometer CSV:', error);
        return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
    }
}
