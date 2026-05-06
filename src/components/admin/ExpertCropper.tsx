'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { X, Check, Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '../../lib/utils';

interface ExpertCropperProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: any) => Promise<void>;
  onCancel: () => void;
}

export function ExpertCropper({ imageSrc, onCropComplete, onCancel }: ExpertCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: { x: number, y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const handleCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (isProcessing || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      await onCropComplete(croppedAreaPixels);
    } catch (e) {
      console.error("Crop error:", e);
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, onCropComplete, isProcessing]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button onClick={onCancel} className="p-2" disabled={isProcessing}>
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold">Crop Profile Picture</h2>
        <button 
          onClick={handleConfirm} 
          className={cn("p-2 text-indigo-400 transition-opacity", (isProcessing || !croppedAreaPixels) && "opacity-50")}
          disabled={isProcessing || !croppedAreaPixels}
        >
          {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
        </button>
      </div>

      {/* Cropper Container */}
      <div className="relative flex-1 w-full bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onCropComplete={handleCropComplete}
          onZoomChange={onZoomChange}
        />
      </div>

      {/* Controls */}
      <div className="p-6 bg-black flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">Zoom</span>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(val) => setZoom(val[0])}
            className="flex-1"
            disabled={isProcessing}
          />
        </div>
        <Button 
          onClick={handleConfirm} 
          disabled={isProcessing || !croppedAreaPixels}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-2xl gap-2"
        >
          {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
          {isProcessing ? "Processing..." : "Apply Crop"}
        </Button>
      </div>
    </div>
  );
}
