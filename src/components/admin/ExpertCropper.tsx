'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface ExpertCropperProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: any) => void;
  onCancel: () => void;
}

export function ExpertCropper({ imageSrc, onCropComplete, onCancel }: ExpertCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = useCallback((crop: { x: number, y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const handleCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = useCallback(() => {
    onCropComplete(croppedAreaPixels);
  }, [croppedAreaPixels, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button onClick={onCancel} className="p-2">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold">Crop Profile Picture</h2>
        <button onClick={handleConfirm} className="p-2 text-indigo-400">
          <Check className="w-6 h-6" />
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
          />
        </div>
        <Button onClick={handleConfirm} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-2xl">
          Apply Crop
        </Button>
      </div>
    </div>
  );
}
