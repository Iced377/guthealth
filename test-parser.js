
// Mock of the parser logic from the API route
const csvContent = `Date,Steps,Distance,Floors Ascended
1/1/26,4913,3.4km,1
12/31/25,6424,4.4km,7
12/30/25,8008,5.6km,7
12/29/25,7938,5.5km,0
12/28/25,5356,3.7km,1
12/27/25,6688,4.7km,2`;

function parse(content) {
    const lines = content.split(/\r?\n/);
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));

    console.log('Headers:', headers);

    let dateIndex = headers.findIndex(h => h.includes('date') || h.includes('day'));
    let stepsIndex = headers.findIndex(h => h.includes('steps') || h.includes('count'));
    const distanceIndex = headers.findIndex(h => h.includes('distance'));
    const floorsIndex = headers.findIndex(h => h.includes('floors'));
    const energyIndex = headers.findIndex(h => h.includes('active') || h.includes('cal'));

    console.log(`Indices: Date=${dateIndex}, Steps=${stepsIndex}, Dist=${distanceIndex}, Floors=${floorsIndex}`);

    if (dateIndex === -1 || stepsIndex === -1) {
        console.log('Using default indices 0, 1');
        dateIndex = 0;
        stepsIndex = 1;
    }

    const dataLines = lines.slice(1);
    for (const line of dataLines) {
        if (!line.trim()) continue;
        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));

        const dateStr = cols[dateIndex];
        const stepsStr = cols[stepsIndex];

        if (!dateStr || !stepsStr) {
            console.log('Skipping missing:', line);
            continue;
        }

        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) {
            console.log('Invalid Date:', dateStr);
            continue;
        }

        const year = dateObj.getFullYear();
        if (year < 2000) {
            dateObj.setFullYear(year + 100);
        }

        const steps = parseInt(stepsStr.replace(/,/g, ''), 10);
        if (isNaN(steps)) {
            console.log('Invalid Steps:', stepsStr);
            continue;
        }

        let distStr = distanceIndex !== -1 ? cols[distanceIndex] : '0';
        if (distStr) {
            distStr = distStr.toLowerCase().replace('km', '').replace('mi', '').trim();
        }
        const dist = parseFloat(distStr);

        console.log(`SUCCESS: ${dateStr} -> ${dateObj.toISOString()} | Steps: ${steps} | Dist: ${dist}`);
    }
}

parse(csvContent);
