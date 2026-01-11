'use client';

import { Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GraphInfoButtonProps {
    title: string;
    description: string;
    benefit: string;
}

export default function GraphInfoButton({ title, description, benefit }: GraphInfoButtonProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full">
                    <Info className="h-5 w-5" />
                    <span className="sr-only">Info about {title}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[80vh]">
                    <div className="space-y-4 pt-2">
                        <div>
                            <h4 className="font-semibold text-foreground mb-1">How to Read This Graph</h4>
                            <DialogDescription className="text-base text-muted-foreground">
                                {description}
                            </DialogDescription>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <h4 className="font-semibold text-primary mb-1">Why It Matters</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                {benefit}
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
