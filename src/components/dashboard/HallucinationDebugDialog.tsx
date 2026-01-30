'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bug, Loader2 } from 'lucide-react';
import { verifyFoodAnalysisFlow } from '@/ai/flows/verify-food-analysis';
import { useToast } from '@/hooks/use-toast';

export default function HallucinationDebugDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Default to the "High Fructose Corn Syrup" contradictions
    const [foodName, setFoodName] = useState("High Fructose Corn Syrup");
    const [ingredients, setIngredients] = useState("High Fructose Corn Syrup");
    const [claim, setClaim] = useState("Green");
    const [reason, setReason] = useState("AI says this is safe (Simulated).");

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const result = await verifyFoodAnalysisFlow({
                foodItemName: foodName,
                ingredients: ingredients,
                portionSize: "1",
                portionUnit: "serving",
                claimedFodmapRisk: claim,
                claimedReason: reason,
                claimedHealthTags: { isKeto: true } // Force extra lie
            });

            if (!result.verified) {
                toast({
                    title: "Success: Hallucination Caught!",
                    description: "The Critic caught the lie. Check Admin Hub.",
                    variant: "default" // or success style if available
                });
                setOpen(false);
            } else {
                toast({
                    title: "Failed: Critic Missed It",
                    description: "The Critic verified this data as TRUE.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Simulation failed to run.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="absolute top-20 right-4 z-50">
                    <Button variant="destructive" size="icon" title="Simulate Hallucination">
                        <Bug className="w-4 h-4" />
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Simulate Hallucination</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Force a lie to test if the "Critic" catches it.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Food Name</Label>
                        <Input value={foodName} onChange={e => setFoodName(e.target.value)} className="bg-zinc-900 border-white/10" />
                    </div>
                    <div className="space-y-2">
                        <Label>Ingredients</Label>
                        <Input value={ingredients} onChange={e => setIngredients(e.target.value)} className="bg-zinc-900 border-white/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Claimed Risk</Label>
                            <Input value={claim} onChange={e => setClaim(e.target.value)} className="bg-zinc-900 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input value={reason} onChange={e => setReason(e.target.value)} className="bg-zinc-900 border-white/10" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="border-white/10 hover:bg-white/5 text-white">Cancel</Button>
                    <Button variant="destructive" onClick={handleSimulate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simulate Lie
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
