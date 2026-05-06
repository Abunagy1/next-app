'use client';

import { Button } from '@/components/ui/button';

interface DownloadFlightInvoiceButtonProps {
  documentId: string;
  bookingId: string;
}

export default function DownloadFlightInvoiceButton({ documentId, bookingId }: DownloadFlightInvoiceButtonProps) {
  async function handleDownload(e: React.MouseEvent<HTMLButtonElement>) {
    const button = e.currentTarget as HTMLButtonElement;
    button.disabled = true;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const original = document.getElementById(documentId);
      if (!original) {
        button.disabled = false;
        return;
      }

      const clone = original.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove());
      clone.style.cssText = `
        background: #ffffff !important;
        color: #000000 !important;
        font-family: Arial, sans-serif;
        padding: 2rem;
        display: block;
        width: ${original.offsetWidth || 700}px;
        min-height: ${original.offsetHeight || 900}px;
      `;
      clone.querySelectorAll('*').forEach((el: any) => {
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

      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);

      await new Promise(r => setTimeout(r, 200));

      const opt = {
        margin: 0,
        filename: `flight_booking_${bookingId}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff', logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(clone).save();
      document.body.removeChild(clone);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      button.disabled = false;
    }
  }

  return <Button onClick={handleDownload}>Download Booking PDF</Button>;
}