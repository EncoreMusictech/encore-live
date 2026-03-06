import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Crop, ZoomIn, Minimize2 } from 'lucide-react';

interface LogoCropperProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area, padding: number): Promise<Blob> {
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

  // Clear canvas (transparent background)
  ctx.clearRect(0, 0, size, size);

  // Calculate the drawable area after padding
  const pad = Math.round(size * (padding / 100));
  const drawSize = size - pad * 2;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    pad,
    pad,
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
  const [padding, setPadding] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropAreaComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels, padding);
    onCropComplete(blob);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" style={{ zIndex: 100 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-primary" />
            Crop Logo
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area, zoom, and padding to frame your logo perfectly.
          </DialogDescription>
        </DialogHeader>

        {imageSrc && (
          <div className="relative w-full h-[300px] bg-muted rounded-lg overflow-hidden">
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
              <Minimize2 className="h-4 w-4" /> Padding ({padding}%)
            </Label>
            <Slider
              value={[padding]}
              min={0}
              max={40}
              step={1}
              onValueChange={([v]) => setPadding(v)}
            />
            <p className="text-xs text-muted-foreground">
              Adds transparent space around the logo to make it appear smaller
            </p>
          </div>
        </div>

        {/* Live size preview */}
        {padding > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <div
              className="w-16 h-16 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center"
              style={{ padding: `${(padding / 100) * 64}px` }}
            >
              <div className="w-full h-full bg-primary/20 rounded-sm" />
            </div>
            <span className="text-xs text-muted-foreground">
              Logo will use {100 - padding * 2}% of the 512×512 frame
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Output: <strong>512×512px</strong> transparent PNG. For best results, use a transparent PNG source.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Apply Crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
