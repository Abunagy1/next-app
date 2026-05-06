'use client';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
export function ShareHotelButton() {
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch {
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success('URL copied (sharing not supported)');
    }
  };
  return (
    <Button
      variant="outline"
      className="flex items-center justify-center rounded-lg text-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
      onClick={handleShare}
    >
      <Share2 className="h-5 w-5" />
    </Button>
  );
}