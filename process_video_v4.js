const ffmpeg = require('ffmpeg-static');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const inputFile = 'public/temp-vid.mp4';
const outputFile = 'public/iphone_mock.mp4';
const desktopFile = path.join(require('os').homedir(), 'Desktop', 'iphone_mock.mp4');
const maskFile = 'public/mask.png';

// Dimensions
const circleSize = 1000;
const targetWidth = 1170;
const targetHeight = 2532;
const originalHeight = 720;

// Step 1: Generate Mask (White Circle on Transparent Background)
// Using 'geq' filter on a transparent input.
// r,g,b=255 (White). a=255 if inside circle, else 0.
const maskCmd = [
    ffmpeg,
    '-f lavfi',
    `-i color=c=black@0:s=${circleSize}x${circleSize}`,
    `-vf "format=rgba,geq=r=255:g=255:b=255:a='if(lte(pow(X-W/2,2)+pow(Y-H/2,2),pow((W/2)-2,2)),255,0)'"`,
    '-frames:v 1',
    '-y',
    maskFile
].join(' ');

console.log('Generating mask...');
exec(maskCmd, (err, stdout, stderr) => {
    if (err) {
        console.error('Mask Error:', stderr);
        process.exit(1);
    }

    // Step 2: Process Video
    // [0:v] Video -> Crop Square -> Scale 1000x1000 -> Set format RGBA [vid]
    // [1:v] Mask Image -> Loop 1 -> Set format RGBA [mask]
    // [vid][mask] alphamerge [masked_vid]
    // [bg] color white [white_bg]
    // [white_bg][masked_vid] overlay [out]

    const filter = `
    [0:v]crop=${originalHeight}:${originalHeight}:(iw-${originalHeight})/2:0,scale=${circleSize}:${circleSize},format=rgba[vid];
    [1:v]format=rgba[mask];
    [vid][mask]alphamerge[masked_vid];
    color=c=white:s=${targetWidth}x${targetHeight}[white_bg];
    [white_bg][masked_vid]overlay=x=(W-w)/2:y=(H-h)/2:shortest=1
  `.replace(/\n/g, '').replace(/\s+/g, ' ');

    const vidCmd = [
        ffmpeg,
        `-i ${inputFile}`,
        '-loop 1',
        `-i ${maskFile}`,
        `-filter_complex "${filter}"`,
        '-c:v libx264',
        '-pix_fmt yuv420p', // Important for compatibility
        '-c:a aac',
        '-t 10', // Max 10 seconds
        '-y',
        outputFile
    ].join(' ');

    console.log('Processing video...');
    exec(vidCmd, (err, vidOut, vidErr) => {
        // Cleanup mask
        try { fs.unlinkSync(maskFile); } catch (e) { }

        if (err) {
            console.error('Video Error:', vidErr);
            process.exit(1);
        }

        console.log(`Success: ${outputFile}`);

        // Copy to Desktop
        fs.copyFileSync(outputFile, desktopFile);
        console.log(`Copied to Desktop: ${desktopFile}`);
    });
});
