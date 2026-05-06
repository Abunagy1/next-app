'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HotelImagesGalleryProps {
  images: string[];
}

export function HotelImagesGallery({ images }: HotelImagesGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [open, setOpen] = useState(false);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-[400px]">
        {images.slice(0, 5).map((img, i) => (
          <div key={img} className={`relative ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
            <Image
              src={img}
              alt="Hotel"
              fill
              className="object-cover cursor-pointer"
              onClick={() => {
                setSelectedIndex(i);
                setOpen(true);
              }}
            />
          </div>
        ))}
      </div>
      {images.length > 5 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="absolute bottom-4 right-4">
              View all photos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <div className="relative h-[80vh]">
              <Image src={images[selectedIndex]} alt="Hotel" fill className="object-contain" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSelectedIndex((prev) => (prev + 1) % images.length)}
              >
                <ChevronRight />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}