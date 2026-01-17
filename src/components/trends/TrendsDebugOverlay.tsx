import { useEffect, useState } from "react";
import { useTrendsMotionController } from "./useTrendsMotionController";

export default function TrendsDebugOverlay() {
    const { interactionMode, focusedSceneId, activeTooltip, requestFocus, requestBrowse } = useTrendsMotionController();
    const [isStressing, setIsStressing] = useState(false);

    useEffect(() => {
        if (!isStressing) return;
        let count = 0;

        // Start ensuring we are in BROWSE or FOCUS
        // interval toggles
        const interval = setInterval(() => {
            count++;
            if (count > 10) {
                setIsStressing(false);
                clearInterval(interval);
                return;
            }

            // Toggle
            // If we are currently focusing 'calories', go Browse. else Focus 'calories'.
            // Note: transition takes time, but we force requests.
            // Motion controller should handle rapid state changes or ignore if transition locked?
            // Actually, transition lock prevents new requests? 
            // `requestFocus` implementation checks `interactionMode === 'TRANSITION'`.
            // So we might need to wait longer than transition duration (500ms).
            // Let's set interval to 800ms.

            // Checking current state might be tricky if we are mid-transition.
            // We'll simplisticly toggle based on even/odd.
            if (count % 2 !== 0) {
                requestFocus('calories');
            } else {
                requestBrowse();
            }
        }, 800);

        return () => clearInterval(interval);
    }, [isStressing, requestFocus, requestBrowse]);

    if (process.env.NODE_ENV !== 'development') return null;

    return (
        <div className="fixed bottom-2 left-2 z-[9999] bg-black/80 text-white p-2 text-xs font-mono rounded pointer-events-auto border border-white/10 shadow-xl">
            <div className="mb-1 font-bold opacity-50">DEBUG CONTROLLER</div>
            <div className="space-y-0.5">
                <div className="flex justify-between gap-4">
                    <span>MODE:</span>
                    <span className={interactionMode === 'TRANSITION' ? 'text-red-400 font-bold' : 'text-green-400'}>
                        {interactionMode}
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>FOCUS:</span>
                    <span className="text-yellow-400">{focusedSceneId || 'null'}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>TOOLTIP:</span>
                    <span className={activeTooltip ? 'text-blue-400' : 'text-gray-500'}>
                        {activeTooltip ? 'ACTIVE' : 'NONE'}
                    </span>
                </div>
            </div>

            <div className="mt-2 pt-2 border-t border-white/10">
                <button
                    onClick={() => setIsStressing(true)}
                    disabled={isStressing}
                    className="w-full text-center text-[10px] bg-white/10 hover:bg-white/20 active:bg-white/30 px-2 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isStressing ? 'RUNNING STRESS TEST...' : 'STRESS TEST (10x)'}
                </button>
            </div>
        </div>
    );
}
