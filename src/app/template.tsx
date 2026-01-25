'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <motion.div
            key={pathname} // Unmounts/Remounts on route change, triggering animation
            initial={{ opacity: 0, y: 10 }} // Start slightly lower and invisible
            animate={{ opacity: 1, y: 0 }}   // Float up and fade in
            exit={{ opacity: 0, y: -10 }}    // Optional: Float up and fade out (requires AnimatePresence in layout, usually too complex for App Router templates, sticking to entrance only is safer/smoother)
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 1,
            }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
}
