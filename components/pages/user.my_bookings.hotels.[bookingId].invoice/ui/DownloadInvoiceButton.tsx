// 'use client';
// import { Button } from '@/components/ui/button';
// interface DownloadInvoiceButtonProps {
//   documentId: string;
//   bookingId: string;
// }
// export default function DownloadInvoiceButton({ documentId, bookingId }: DownloadInvoiceButtonProps) {
//   async function handleDownload(e: React.MouseEvent<HTMLButtonElement>) {
//     const button = e.currentTarget as HTMLButtonElement;
//     button.disabled = true;
//     try {
//       const html2pdf = (await import('html2pdf.js')).default;
//       const original = document.getElementById(documentId);
//       if (!original) {
//         button.disabled = false;
//         return;
//       }
//       // 1. Deep clone, preserving everything except lab-causing styles
//       const clone = original.cloneNode(true) as HTMLElement;
//       // 2. Remove external stylesheets and <style> tags
//       clone.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove());
//       // 3. Force black text on white, clear any lab colors
//       clone.style.cssText = `
//         background: #ffffff !important;
//         color: #000000 !important;
//         font-family: Arial, sans-serif;
//         padding: 2rem;
//       `;
//       clone.querySelectorAll('*').forEach((el: any) => {
//         const tag = el.tagName?.toLowerCase();
//         if (tag === 'table' || tag === 'th' || tag === 'td') {
//           el.style.border = '1px solid #ccc';
//           el.style.borderCollapse = 'collapse';
//         }
//         if (tag !== 'a') {
//           el.style.color = '#000000';
//           el.style.backgroundColor = 'transparent';
//         }
//         if (el.style.backgroundColor) el.style.backgroundColor = 'transparent';
//         el.style.boxShadow = 'none';
//       });
//       // 4. Position offscreen but preserve original dimensions
//       clone.style.position = 'absolute';
//       clone.style.left = '-9999px';
//       clone.style.top = '0';
//       clone.style.width = (original.offsetWidth || 700) + 'px';
//       clone.style.minHeight = (original.offsetHeight || 900) + 'px';
//       clone.style.display = 'block';
//       document.body.appendChild(clone);
//       await new Promise(r => setTimeout(r, 200));
//       const opt = {
//         margin: 0,
//         filename: `hotel_invoice_${bookingId}.pdf`,
//         image: { type: 'jpeg' as const, quality: 0.98 },
//         html2canvas: { scale: 2, backgroundColor: '#ffffff', logging: false },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
//       };
//       await html2pdf().set(opt).from(clone).save();
//       document.body.removeChild(clone);
//     } catch (err) {
//       console.error('PDF generation failed:', err);
//     } finally {
//       button.disabled = false;
//     }
//   }
//   return <Button onClick={handleDownload}>Download Invoice</Button>;
// }
'use client';

import { Button } from '@/components/ui/button';

interface DownloadInvoiceButtonProps {
  documentId: string;
  bookingId: string;
}

export default function DownloadInvoiceButton({ documentId, bookingId }: DownloadInvoiceButtonProps) {
  async function handleDownload(e: React.MouseEvent<HTMLButtonElement>) {
    const button = e.currentTarget as HTMLButtonElement;
    button.disabled = true;

    try {
      // 1. Fetch the current invoice page again (clean HTML)
      const res = await fetch(window.location.href);
      if (!res.ok) throw new Error('Failed to fetch invoice page');
      const htmlText = await res.text();

      // 2. Parse and locate the #hotel-invoice element
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const invoiceEl = doc.getElementById(documentId);
      if (!invoiceEl) throw new Error('Invoice element not found');

      // 3. Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;

      // 4. Clean up all styles and apply safe, black-on-white defaults
      invoiceEl.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
      invoiceEl.setAttribute('style', `
        background: #ffffff !important;
        color: #000000 !important;
        font-family: Arial, sans-serif;
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      `);
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
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      button.disabled = false;
    }
  }

  return <Button onClick={handleDownload}>Download Invoice</Button>;
}