'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

export default function ColorSlide() {
    const { toast } = useToast();

    const colors = [
        { name: 'Primary Green', var: '--primary', hex: '#27AE60', class: 'bg-primary' },
        { name: 'Secondary Green', var: '--secondary', hex: '#D9F0E5', class: 'bg-secondary' },
        { name: 'Background', var: '--background', hex: '#F7F7F7', class: 'bg-background border border-white/10' },
        { name: 'Destructive', var: '--destructive', hex: '#EB5757', class: 'bg-destructive' },
    ];

    const charts = [
        { name: 'Chart 1', class: 'bg-[hsl(var(--chart-1))]', var: '--chart-1' },
        { name: 'Chart 2', class: 'bg-[hsl(var(--chart-2))]', var: '--chart-2' },
        { name: 'Chart 3', class: 'bg-[hsl(var(--chart-3))]', var: '--chart-3' },
        { name: 'Chart 4', class: 'bg-[hsl(var(--chart-4))]', var: '--chart-4' },
        { name: 'Chart 5', class: 'bg-[hsl(var(--chart-5))]', var: '--chart-5' },
    ]

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: `${text} copied to clipboard.` });
    };

    return (
        <div className="w-full h-full p-8 md:p-12 flex flex-col">
            <div className="mb-12">
                <h2 className="text-4xl font-bold text-white mb-2">Color Palette</h2>
                <p className="text-white/60">Functional, accessible, and vibrant.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {colors.map((c, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer shadow-lg"
                        onClick={() => copyToClipboard(c.hex)}
                    >
                        <div className={`absolute inset-0 ${c.class}`} />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Copy className="text-white w-8 h-8" />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/30 backdrop-blur-md">
                            <p className="font-bold text-white">{c.name}</p>
                            <p className="font-mono text-xs text-white/70">{c.hex}</p>
                            <p className="font-mono text-[10px] text-white/50">{c.var}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <h3 className="text-xl font-bold text-white mb-6">Data Visualization</h3>
            <div className="flex gap-4">
                {charts.map((c, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ scale: 1.1 }}
                        className="flex-1 h-32 rounded-2xl relative overflow-hidden cursor-pointer group"
                        onClick={() => copyToClipboard(`hsl(${getComputedStyle(document.documentElement).getPropertyValue(c.var)})`)} // Note: real reading of var needs client side trick, simplifying for now
                    >
                        <div className={`absolute inset-0 ${c.class}`} />
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-black/20 backdrop-blur-sm text-center">
                            <span className="text-xs text-white font-mono">{c.name}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
