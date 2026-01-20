const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../capacitor.config.ts');
const args = process.argv.slice(2);
const mode = args[0]; // 'local', 'staging', 'prod', or a custom URL

if (!mode) {
    console.error('Usage: node scripts/set-capacitor-url.js <local|staging|prod|URL>');
    process.exit(1);
}

try {
    let content = fs.readFileSync(configPath, 'utf8');
    let newUrl = '';

    // 1. Determine the URL
    if (mode === 'local') {
        newUrl = 'http://192.168.100.188:9002'; // Your local dev IP
    } else if (mode === 'prod') {
        newUrl = 'https://mygutcheck.app';
    } else if (mode === 'staging') {
        // Ideally this would be fetched from env or args, but for now we'll ask user to input it or paste it
        console.log('For staging, please provide the full URL (e.g., https://guthealth-staging.web.app)');
        console.log('Re-run with: node scripts/set-capacitor-url.js <YOUR_STAGING_URL>');
        process.exit(0);
    } else {
        // Assume argument is a custom URL
        newUrl = mode;
    }

    // 2. Update or Add 'server' block
    // We use Regex to comfortably replace the server object or insert it.

    const serverBlockRegex = /server:\s*{[^}]*}/;
    const newServerBlock = `server: {
    androidScheme: 'https',
    url: '${newUrl}',
    cleartext: true,
  }`;

    if (serverBlockRegex.test(content)) {
        content = content.replace(serverBlockRegex, newServerBlock);
    } else {
        // Insert before the last closing brace
        const lastBraceIndex = content.lastIndexOf('};');
        if (lastBraceIndex !== -1) {
            content = content.slice(0, lastBraceIndex) + '  ' + newServerBlock + '\n' + content.slice(lastBraceIndex);
        } else {
            console.error("Could not parse capacitor.config.ts structure.");
            process.exit(1);
        }
    }

    fs.writeFileSync(configPath, content, 'utf8');
    console.log(`✅ capacitor.config.ts updated to point to: ${newUrl}`);

} catch (err) {
    console.error('Error updating config:', err);
    process.exit(1);
}
