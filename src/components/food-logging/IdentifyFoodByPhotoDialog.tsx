'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, AlertTriangle, CheckCircle2, RefreshCw, X, Sparkles, ScanLine, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { identifyFoodFromImage, type IdentifyFoodFromImageOutput } from '@/ai/flows/identify-food-from-image-flow';
import { useTheme } from '@/contexts/ThemeContext';

export interface IdentifiedPhotoData {
  name: string;
  ingredients: string;
  portionSize: string;
  portionUnit: string;
}

interface IdentifyFoodByPhotoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFoodIdentified: (data: IdentifiedPhotoData) => void;
  initialFile?: File | null;
}

type ScanState = 'IDLE' | 'PREVIEW' | 'ANALYZING' | 'RESULT' | 'ERROR';

// --- Visual Viewport Hook (Reused from ComposeOverlay for keyboard safety) ---
function useVisualViewportMetrics() {
  const [metrics, setMetrics] = useState({
    vvHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    vvOffsetTop: 0,
    keyboardHeight: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateMetrics = () => {
      const vv = window.visualViewport;
      const vvHeight = vv?.height ?? window.innerHeight;
      const vvOffsetTop = vv?.offsetTop ?? 0;
      const keyboardHeight = Math.max(0, window.innerHeight - vvHeight - vvOffsetTop);

      setMetrics({ vvHeight, vvOffsetTop, keyboardHeight });
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateMetrics);
      window.visualViewport.addEventListener('scroll', updateMetrics);
    }
    window.addEventListener('resize', updateMetrics);
    updateMetrics();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateMetrics);
        window.visualViewport.removeEventListener('scroll', updateMetrics);
      }
      window.removeEventListener('resize', updateMetrics);
    };
  }, []);

  return metrics;
}

export default function IdentifyFoodByPhotoDialog({
  isOpen,
  onOpenChange,
  onFoodIdentified,
  initialFile
}: IdentifyFoodByPhotoDialogProps) {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const { keyboardHeight } = useVisualViewportMetrics();
  const [mounted, setMounted] = useState(false);

  // State
  const [scanState, setScanState] = useState<ScanState>('IDLE');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [contextText, setContextText] = useState('');
  const [identifiedData, setIdentifiedData] = useState<IdentifyFoodFromImageOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const processedFileRef = useRef<File | null>(null);

  // Mount check for Portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Scroll Lock
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      const y = top ? parseInt(top.replace('-', '').replace('px', ''), 10) : 0;
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  // Cleanup on Close
  const handleClose = () => {
    onOpenChange(false);
    // Reset state after transition (timeout or immediate?)
    // Immediate for now, state machine handles next open cleanly
    setTimeout(() => {
      setScanState('IDLE');
      setImagePreview(null);
      setContextText('');
      setIdentifiedData(null);
      setErrorMessage(null);
      processedFileRef.current = null;
    }, 300);
  };

  // Handle Initial File
  useEffect(() => {
    if (isOpen && initialFile && initialFile !== processedFileRef.current) {
      processFile(initialFile);
      processedFileRef.current = initialFile;
    }
  }, [isOpen, initialFile]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const uri = reader.result as string;
      setImagePreview(uri);
      setScanState('PREVIEW'); // Go to Preview/Context step
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    if (!imagePreview) return;

    setScanState('ANALYZING');
    try {
      const result = await identifyFoodFromImage({
        imageDataUri: imagePreview,
        additionalContext: contextText.trim() || undefined,
        userLocale: navigator.language
      });

      if (result.recognitionSuccess) {
        setIdentifiedData(result);
        setScanState('RESULT');
      } else {
        setErrorMessage(result.errorMessage || "Could not identify food.");
        setScanState('ERROR');
      }
    } catch (e) {
      setErrorMessage("An unexpected error occurred.");
      setScanState('ERROR');
    }
  };

  const handleRetry = () => {
    setScanState('PREVIEW'); // Go back to preview, keep context and image
    setIdentifiedData(null);
    setErrorMessage(null);
  };

  const handleConfirm = () => {
    if (identifiedData) {
      onFoodIdentified({
        name: identifiedData.identifiedFoodName || 'Unknown Food',
        ingredients: identifiedData.identifiedIngredients || 'Not specified',
        portionSize: identifiedData.estimatedPortionSize || '1',
        portionUnit: identifiedData.estimatedPortionUnit || 'serving',
      });
      handleClose();
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = ''; // Reset
      processFile(file);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
          style={{ touchAction: 'none' }}
        >
          {/* 1. Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute inset-0 cursor-default",
              isDarkMode ? "bg-black/60" : "bg-black/30"
            )}
            onClick={handleClose}
          >
            {/* Gradient Mesh Blur */}
            <div
              className="absolute inset-0 pointer-events-none backdrop-blur-[24px]"
              style={{
                background: isDarkMode
                  ? "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.08), rgba(0,0,0,0.4) 80%)"
                  : "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.7), rgba(255,255,255,0.2) 80%)"
              }}
            />
          </motion.div>

          {/* 2. Main Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: keyboardHeight > 0 ? -keyboardHeight / 2 : 0 // Shift up if keyboard open
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            className={cn(
              "relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto",
              isDarkMode
                ? "bg-black/40 border border-white/10"
                : "bg-white/60 border border-black/5"
            )}
            style={{
              backdropFilter: 'blur(40px)',
              maxHeight: '85vh' // Prevent overflowing tall screens
            }}
          >


            {/* --- CONTENT STATES --- */}

            {/* A. IDLE / SELECTION (If opened without file) */}
            {scanState === 'IDLE' && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6">
                <div className="p-6 rounded-full bg-primary/10 mb-2">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-headline font-bold mb-2">Identify Food</h2>
                  <p className="text-sm text-muted-foreground">Take a photo or upload to analyze.</p>
                </div>
                <Button
                  size="lg"
                  className="w-full max-w-[200px] rounded-full font-semibold shadow-lg shadow-primary/20"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  Select Photo
                </Button>
              </div>
            )}

            {/* B. PREVIEW & CONTEXT */}
            {scanState === 'PREVIEW' && (
              <div className="flex flex-col h-full">
                {/* Header Image Area */}
                <div className="relative w-full h-48 sm:h-56 bg-black/5 dark:bg-black/20 shrink-0">
                  {imagePreview && (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain p-4"
                    />
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                    <Camera className="w-4 h-4 text-white" />
                    <span className="text-xs font-medium text-white">Preview</span>
                  </div>
                </div>

                {/* Context Input Area */}
                <div className="p-6 space-y-4 bg-black/5 dark:bg-black/20 flex-1">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1 flex items-center gap-2">
                      Add Context (Optional)
                    </label>
                    <Textarea
                      placeholder="E.g. gluten-free, homemade, brand name..."
                      value={contextText}
                      onChange={(e) => setContextText(e.target.value)}
                      className={cn(
                        "resize-none rounded-xl border-0 ring-1 ring-inset focus-visible:ring-2",
                        isDarkMode
                          ? "bg-white/5 ring-white/10 focus-visible:ring-primary/50 placeholder:text-white/30"
                          : "bg-black/5 ring-black/10 focus-visible:ring-primary/50 placeholder:text-black/30"
                      )}
                      rows={3}
                    />
                    <p className="text-[11px] text-muted-foreground ml-1">
                      Adding details helps identify specific ingredients more accurately.
                    </p>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      className="flex-1 rounded-2xl h-10 font-semibold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
                      onClick={handleRunAnalysis}
                    >
                      <ScanLine className="w-4 h-4 mr-2" />
                      Analyze
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* C. ANALYZING */}
            {scanState === 'ANALYZING' && (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center h-[400px]">
                {/* Custom Pulse Loader */}
                <div className="relative mb-8">
                  <div className="absolute inset-y-0 left-[-20%] right-[-20%] h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-pulse-width" />
                  {/* Rotating Orb */}
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  {/* Inner Glow */}
                  <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl animate-pulse" />
                </div>

                <h3 className="text-lg font-headline font-bold mb-2 animate-pulse">Examining Meal...</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  Identifying ingredients and estimating portions.
                </p>
              </div>
            )}

            {/* D. RESULT */}
            {scanState === 'RESULT' && identifiedData && (
              <div className="flex flex-col h-full max-h-[80vh]">
                <div className="p-6 pb-0 pt-8 shrink-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg leading-tight">
                        {identifiedData.identifiedFoodName || "Unknown Food"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Based on image analysis
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto min-h-0 space-y-4">
                  {/* Ingredients Box */}
                  <div className={cn(
                    "p-4 rounded-2xl border backdrop-blur-md",
                    isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5"
                  )}>
                    <h4 className="text-xs font-bold uppercase opacity-60 mb-2">Ingredients</h4>
                    <p className="text-sm leading-relaxed">
                      {identifiedData.identifiedIngredients || "No ingredients listed."}
                    </p>
                  </div>

                  {/* Portion Box */}
                  <div className="flex gap-4">
                    <div className={cn(
                      "flex-1 p-3 rounded-2xl border text-center backdrop-blur-md",
                      isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5"
                    )}>
                      <h4 className="text-[10px] font-bold uppercase opacity-60 mb-1">SIZE</h4>
                      <p className="font-semibold">{identifiedData.estimatedPortionSize || "-"}</p>
                    </div>
                    <div className={cn(
                      "flex-1 p-3 rounded-2xl border text-center backdrop-blur-md",
                      isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5"
                    )}>
                      <h4 className="text-[10px] font-bold uppercase opacity-60 mb-1">UNIT</h4>
                      <p className="font-semibold">{identifiedData.estimatedPortionUnit || "-"}</p>
                    </div>
                  </div>

                  {/* Warning/Disclaimer */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground opacity-80 pt-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p>Verify details. You can edit entries after logging.</p>
                  </div>
                </div>

                <div className="p-6 pt-2 shrink-0 flex gap-3 mt-auto">
                  <Button variant="ghost" className="flex-1" onClick={handleRetry}>
                    Retry
                  </Button>
                  <Button
                    className="flex-[2] rounded-2xl font-bold shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleConfirm}
                  >
                    Log Meal <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* E. ERROR */}
            {scanState === 'ERROR' && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
                <div className="p-4 rounded-full bg-red-500/10 mb-2">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold">Analysis Failed</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {errorMessage || "Something went wrong."}
                </p>
                <div className="flex gap-3 w-full max-w-[240px]">
                  <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                  <Button className="flex-1" onClick={handleRetry}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Hidden Native Inputs */}
            <input
              type="file"
              accept="image/*"
              ref={uploadInputRef}
              className="hidden"
              onChange={handleImageFileChange}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
