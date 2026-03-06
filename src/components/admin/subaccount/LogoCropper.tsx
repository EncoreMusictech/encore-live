import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Crop, ZoomIn, Maximize2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LogoCropperProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

function getImageDimensions(imageSrc: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = imageSrc;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area, scale: number): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // scale: 100 = fill entire frame, 50 = half size centered
  const drawSize = Math.round(size * (scale / 100));
  const offset = Math.round((size - drawSize) / 2);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    offset,
    offset,
    drawSize,
    drawSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
      1
    );
  });
}

export function LogoCropper({ open, imageSrc, onClose, onCropComplete }: LogoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [scale, setScale] = useState(100);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropAreaComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      let cropArea = croppedAreaPixels;

      // Fallback: if user never moved/zoomed, crop the entire image
      if (!cropArea) {
        const dims = await getImageDimensions(imageSrc);
        const minSide = Math.min(dims.width, dims.height);
        cropArea = {
          x: Math.round((dims.width - minSide) / 2),
          y: Math.round((dims.height - minSide) / 2),
          width: minSide,
          height: minSide,
        };
      }

      const blob = await getCroppedImg(imageSrc, cropArea, scale);
      onCropComplete(blob);
    } catch (err) {
      console.error('Crop failed:', err);
      toast.error('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl" style={{ zIndex: 100 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-primary" />
            Crop Logo
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area, zoom, and scale to frame your logo perfectly.
          </DialogDescription>
        </DialogHeader>

        {imageSrc && (
          <div className="relative w-full h-[450px] bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropAreaComplete}
              cropShape="rect"
              showGrid={false}
              objectFit="contain"
              style={{
                containerStyle: { borderRadius: '0.5rem' },
                mediaStyle: { objectFit: 'contain' },
              }}
            />
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <ZoomIn className="h-4 w-4" /> Zoom
            </Label>
            <Slider
              value={[zoom]}
              min={1}
              max={10}
              step={0.05}
              onValueChange={([v]) => setZoom(v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <Maximize2 className="h-4 w-4" /> Scale ({scale}%)
            </Label>
            <Slider
              value={[scale]}
              min={50}
              max={100}
              step={1}
              onValueChange={([v]) => setScale(v)}
            />
            <p className="text-xs text-muted-foreground">
              100% = logo fills the full frame. Lower values add transparent space around the logo.
            </p>
          </div>
        </div>

        {scale < 100 && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <div
              className="w-16 h-16 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center"
            >
              <div
                className="bg-primary/20 rounded-sm"
                style={{ width: `${(scale / 100) * 64}px`, height: `${(scale / 100) * 64}px` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Logo will use {scale}% of the 512×512 frame
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Output: <strong>512×512px</strong> transparent PNG. For best results, use a transparent PNG source.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
