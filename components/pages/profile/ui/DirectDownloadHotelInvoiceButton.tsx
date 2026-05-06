'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface Props {
  bookingId: string;
}

export function DirectDownloadHotelInvoiceButton({ bookingId }: Props) {
  const handleDirectDownload = async () => {
    try {
      // 1. Fetch the invoice page
      const res = await fetch(`/user/my_bookings/hotels/${bookingId}/invoice`);
      if (!res.ok) throw new Error('Invoice page not found');
      const htmlText = await res.text();

      // 2. Parse the HTML and extract #hotel-invoice
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const invoiceEl = doc.getElementById('hotel-invoice');
      if (!invoiceEl) throw new Error('Invoice element missing');

      // 3. Dynamically import html2pdf and generate the PDF
      const html2pdf = (await import('html2pdf.js')).default;

      // Clean up any lab() colors that might come from the styles
      invoiceEl.querySelectorAll('style').forEach(s => s.remove());
      invoiceEl.querySelectorAll('link[rel="stylesheet"]').forEach(l => l.remove());
      invoiceEl.style.cssText = `
        background: #ffffff !important;
        color: #000000 !important;
        font-family: Arial, sans-serif;
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      `;
      invoiceEl.querySelectorAll('*').forEach((el: any) => {
        const tag = el.tagName?.toLowerCase();
        if (tag === 'table' || tag === 'th' || tag === 'td') {
          el.style.border = '1px solid #ccc';
          el.style.borderCollapse = 'collapse';
        }
        if (tag !== 'a') {
          el.style.color = '#000000';
          el.style.backgroundColor = 'transparent';
        }
        if (el.style.backgroundColor) el.style.backgroundColor = 'transparent';
        el.style.boxShadow = 'none';
      });

      const opt = {
        margin: 0,
        filename: `hotel_invoice_${bookingId}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff', logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(invoiceEl).save();
    } catch (error) {
      console.error('Direct download failed:', error);
      // Fallback: open invoice page in new tab
      window.open(`/user/my_bookings/hotels/${bookingId}/invoice`, '_blank');
    }
  };

  return (
    <Button title="Download Invoice" size="sm" className="text-wrap" onClick={handleDirectDownload}>
      <Download className="mr h-4 w-4" />
    </Button>
  );
}