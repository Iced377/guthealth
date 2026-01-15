import React from 'react';

export const FitbitLogo = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Fitbit Dot Pattern: 13 dots forming a diamond/arrow shape */}
        <circle cx="20.35" cy="12" r="1.65" />
        <circle cx="14.35" cy="12" r="1.65" />
        <circle cx="14.35" cy="6" r="1.65" />
        <circle cx="14.35" cy="18" r="1.65" />
        <circle cx="8.35" cy="12" r="1.65" />
        <circle cx="8.35" cy="6" r="1.65" />
        <circle cx="8.35" cy="18" r="1.65" />
        <circle cx="8.35" cy="24" r="1.65" />
        <circle cx="8.35" cy="0" r="1.65" />
        <circle cx="2.35" cy="12" r="1.65" />
        <circle cx="2.35" cy="18" r="1.65" />
        <circle cx="2.35" cy="6" r="1.65" />
        <circle cx="2.35" cy="12" r="1.65" opacity="0" /> {/* Spacer */}
    </svg>
);

// Improved Fitbit Path based on popular sets (FontAwesome/SimpleIcons usually have the specific path)
// Let's use a path-based version if the circles one is too manual.
// SimpleIcons Fitbit:
export const FitbitIcon = ({ className }: { className?: string }) => (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M18.847 11.239a1.616 1.616 0 1 1-3.232 0 1.616 1.616 0 0 1 3.232 0zM12.986 7.026a1.616 1.616 0 1 1-3.23 0 1.616 1.616 0 0 1 3.231 0zm0 11.644a1.616 1.616 0 1 1-3.23 0 1.616 1.616 0 0 1 3.231 0zm0-5.82a1.616 1.616 0 1 1-3.23 0 1.616 1.616 0 0 1 3.231 0zm-5.86 2.91a1.616 1.616 0 1 1-3.232 0 1.616 1.616 0 0 1 3.232 0zm0 5.823a1.616 1.616 0 1 1-3.232 0 1.616 1.616 0 0 1 3.232 0zm0-11.645a1.616 1.616 0 1 1-3.232 0 1.616 1.616 0 0 1 3.232 0zm-5.863 5.822a1.616 1.616 0 1 1-3.232 0 1.616 1.616 0 0 1 3.232 0z" />
    </svg>
);


export const AppleHealthIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* White background square/rounded rect often sits behind, but here we usually just want the heart shape if it's an icon */}
        {/* Apple Health Heart Shape */}
        <path d="M12 21.3501L10.55 20.0301C5.4 15.3601 2 12.2801 2 8.50005C2 5.42005 4.42 3.00005 7.5 3.00005C9.24 3.00005 10.91 3.81005 12 5.09005C13.09 3.81005 14.76 3.00005 16.5 3.00005C19.58 3.00005 22 5.42005 22 8.50005C22 12.2801 18.6 15.3601 13.45 20.0401L12 21.3501Z" fill="currentColor" />
    </svg>
);
