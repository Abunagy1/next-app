"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import flightGoingIcon from "@/public/travel/icons/flightsGoing.svg";
import calenderMint from "@/public/travel/icons/calender-mint.svg";
import timerMint from "@/public/travel/icons/timer-mint.svg";
import doorMint from "@/public/travel/icons/door-closed-mint.svg";
import airLineSeatMint from "@/public/travel/icons/airline-seat-mint.svg";
import ShowTimeInClientSide from "@/components/helpers/ShowTimeInClientSide";
import NoSSR from "@/components/helpers/NoSSR";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Separator } from "@/components/ui/separator";
import { toDataURL } from "qrcode";
import { useEffect, useState } from "react";
interface TicketData {
  key: string;
  qrCodeStr: string;
  bookingStatus: string;
  paymentStatus: string;
  itineraryFlightNumber: string;
  totalFare: number;
  pnrCode: string;
  passengers: Array<{
    key: string;
    fullName: string;
    passengerType: string;
    seatNumber: string;
    seatClass: string;
  }>;
  segments: Array<{
    key: string;
    flightNumber: string;
    airplaneModelName: string;
    airlineName: string;
    airlineIataCode: string;
    departureDateTime: string;
    departureAirportIataCode: string;
    departureAirportName: string;
    arrivalDateTime: string;
    arrivalAirportIataCode: string;
    arrivalAirportName: string;
    flightDurationMinutes: number;
    gate: string;
    terminal: string;
  }>;
}

interface FlightTicketProps {
  ticketData: TicketData;
}

export default function FlightTicket({ ticketData }: FlightTicketProps) {
  const { segments, passengers, qrCodeStr, itineraryFlightNumber, pnrCode, totalFare } = ticketData;
  const [qrcodeImg, setQrcodeImg] = useState("");

  useEffect(() => {
    (async () => {
      const img = await toDataURL(qrCodeStr, { errorCorrectionLevel: "M", scale: 20, margin: 2 });
      setQrcodeImg(img);
    })();
  }, [qrCodeStr]);

async function handleDownload(key: string, passengerFullName: string, e?: React.MouseEvent) {
  const button = e?.currentTarget as HTMLButtonElement | null;
  if (button) button.disabled = true;

  try {
    const res = await fetch(window.location.href);
    if (!res.ok) throw new Error('Failed to fetch ticket page');
    const htmlText = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const ticketEl = doc.getElementById(`ticket-${key}`);
    if (!ticketEl) throw new Error('Ticket element not found');

    const html2pdf = (await import('html2pdf.js')).default;

    ticketEl.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
    ticketEl.setAttribute('style', `
      background: #ffffff !important;
      color: #000000 !important;
      font-family: Arial, sans-serif;
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    `);
    ticketEl.querySelectorAll('*').forEach((el: any) => {
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
      filename: `ticket_${key}_${passengerFullName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff', logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    };

    await html2pdf().set(opt).from(ticketEl).save();
  } catch (err) {
    console.error('Ticket PDF generation failed:', err);
  } finally {
    if (button) button.disabled = false;
  }
}

  async function downloadAll(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.disabled = true;
    const allTickets = passengers.map((p) => handleDownload(p.key, p.fullName.replace(" ", "_"), e));
    await Promise.all(allTickets);
    e.currentTarget.disabled = false;
  }

  return (
    <main className="mx-auto mb-[80px] mt-7 w-[90%] text-secondary">

      <div className="my-6 flex flex-col items-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-800">Total paid: ${Number(totalFare).toFixed(2)}</h3>
        <Button onClick={downloadAll} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition-colors">Download All</Button>
      </div>
      <div className="mx-auto max-w-[840px]">
        {passengers.map((p, idx) => (
          <div key={p.key || idx} id={`ticket-${p.key}`}>
            <div id={`ticket-${p.key}`} className="mb-3 border p-5">
              <div className="mb-3">
                <h3 className="text-2xl font-bold text-gray-800">FN {itineraryFlightNumber}</h3>
                <p className="text-sm font-semibold opacity-60">PNR {pnrCode}</p>
              </div>
              {segments.map((s, i) => (
                <div key={s.key || i} className="mb-3 space-y-2">
                  <div className="flex min-h-[350px] flex-col-reverse overflow-hidden rounded-lg border md:flex-row">
                    <div className="flex justify-between bg-[#EBF6F2] p-6 md:max-w-[300px] md:flex-col md:items-center dark:bg-gray-700 dark:text-white">
                      <div className="flex flex-col justify-center">
                        <h3 className="text-xl font-semibold"><NoSSR><ShowTimeInClientSide date={s.departureDateTime} formatStr="hh:mm a" /></NoSSR></h3>
                        <p className="text-center text-sm font-bold opacity-60">{s.departureAirportIataCode}</p>
                      </div>
                      <div className="flex justify-center"><Image src={flightGoingIcon} alt="flight_icon" className="my-4 rotate-90 md:rotate-0" /></div>
                      <div className="flex flex-col justify-center">
                        <h3 className="text-xl font-semibold"><NoSSR><ShowTimeInClientSide date={s.arrivalDateTime} formatStr="hh:mm a" /></NoSSR></h3>
                        <p className="text-center text-sm font-bold opacity-60">{s.arrivalAirportIataCode}</p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-3 border-l p-3 md:border-0">
                      <div className="flex items-center justify-between rounded-md bg-primary p-6 text-white">
                        <div className="text-secondary">
                          <h3 className="text-lg font-bold">{p.fullName}</h3>
                          <p className="text-sm">Boarding Pass N&apos; {p.fullName.slice(-4)}</p>
                        </div>
                        <h3 className="text-sm font-bold capitalize text-secondary">{p.seatClass} Class</h3>
                      </div>
                      <div className="flex flex-wrap gap-8 text-sm">
                        <TicketDetail icon={calenderMint} label="Date" value={<NoSSR><ShowTimeInClientSide date={s.departureDateTime} formatStr="d MMM yyyy" /></NoSSR>} />
                        <TicketDetail icon={timerMint} label="Flight time" value={<NoSSR><ShowTimeInClientSide date={s.departureDateTime} formatStr="hh:mm aaa" /></NoSSR>} />
                        <TicketDetail icon={doorMint} label="Gate" value={s.gate} />
                        <TicketDetail icon={airLineSeatMint} label="Seat" value={p.seatNumber} />
                      </div>
                      <div className="flex items-end justify-between text-sm">
                        <div>
                          <h2 className="text-2xl font-bold">{s.airlineIataCode}</h2>
                          <p className="font-medium opacity-60">{s.flightNumber}</p>
                          <p className="font-medium opacity-60">{s.airplaneModelName}</p>
                        </div>
                          {qrcodeImg ? (
                            <Image alt="barcode" width={70} height={70} src={qrcodeImg} />
                          ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-8">
                <h2 className="mb-[34px] text-[1.5rem] font-semibold">Terms and Conditions</h2>
                <h3 className="mb-[16px] text-[1.25rem] font-medium">Payments</h3>
                <ul className="list-disc pl-[16px] text-[0.875rem] leading-[1.25rem]">
                  <li className="mb-[16px]">All payments made via debit or credit card through our website are processed using a secure, encrypted payment gateway. Transactions may be subject to fraud screening protocols to ensure compliance with financial regulations.</li>
                  <li className="mb-[16px]">Providing incorrect billing details or cardholder information may result in booking failure or payment rejection. We reserve the right to cancel bookings without notice if payment is declined or fraudulent activity is detected.</li>
                  <li className="mb-[16px]">In case of any suspected fraudulent activity, including disputed or withheld payments, we reserve the right to cancel the booking and recover associated costs. Legal action may be pursued as deemed necessary.</li>
                  <li className="mb-[16px]">Additional verification may be required for certain transactions. The cardholder may be asked to complete a verification process online, at the airport, or at a designated GoBye service center.</li>
                  <li className="mb-[16px]">If the original payment card cannot be presented at check-in or ticket collection, GoBye reserves the right to deny boarding or require payment with an alternative method. Stored payment information is managed in a PCI-DSS compliant and secure environment.</li>
                </ul>
                <h3 className="mb-[16px] text-[1.25rem] font-medium">General Conditions</h3>
                <ul className="list-disc pl-[16px] text-[0.875rem] leading-[1.25rem]">
                  <li className="mb-[16px]">All tickets are non-transferable and non-refundable unless stated otherwise in the fare rules.</li>
                  <li className="mb-[16px]">Changes to booking details may incur additional charges and are subject to availability.</li>
                  <li className="mb-[16px]">Passengers must comply with all applicable immigration, customs, and travel regulations. GoBye is not responsible for denied boarding or entry due to incomplete documentation.</li>
                </ul>
                <h3 className="mb-[16px] text-[1.25rem] font-medium">Contact Us</h3>
                <address className="text-[0.875rem] not-italic leading-[1.25rem]">
                  <p>If you have any questions regarding these Terms and Conditions, please contact us at:</p>
                  <p className="mt-2 font-medium">GoBye Group Q.C.S.C</p>
                  <p>GoBye Tower</p>
                  <p>Doha, State of Qatar</p>
                  <p>For more information, visit: <Button asChild variant="link" className="h-auto p-0 text-tertiary"><Link href="/support">goBye.com/support</Link></Button></p>
                </address>
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500" onClick={(e) => handleDownload(p.key, p.fullName.replace(" ", "_"), e)}>Download</Button>
            </div>
            <Separator className="my-8" />
          </div>
        ))}
      </div>
    </main>
  );
}

function TicketDetail({ icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded bg-primary/20 p-1.5"><Image src={icon} alt={`${label}_icon`} width={24} height={24} /></div>
      <div><p className="font-semibold opacity-60">{label}</p><p className="font-medium">{value}</p></div>
    </div>
  );
}