// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import { Button } from '@/components/ui/button';
// import Image from 'next/image';
// import locationIcon from '@/public/travel/icons/location.svg';

// // Fix Leaflet's default icon paths for Next.js
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
// });

// interface HotelMapProps {
//   lat?: number;
//   lon?: number;
//   address?: string;
// }

// export function HotelMap({ lat = 0, lon = 0, address = '' }: HotelMapProps) {
//   const mapRef = useRef<HTMLDivElement>(null);
//   const [map, setMap] = useState<L.Map | null>(null);
//   const [overlayVisible, setOverlayVisible] = useState(true);

//   // Initialize map
//   useEffect(() => {
//     if (!mapRef.current || map) return;

//     const leafletMap = L.map(mapRef.current).setView([lat, lon], 13);

//     L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
//       attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
//       subdomains: 'abcd',
//       maxZoom: 19,
//     }).addTo(leafletMap);

//     L.marker([lat, lon]).addTo(leafletMap).bindPopup(address).openPopup();

//     setMap(leafletMap);

//     return () => {
//       leafletMap.remove();
//     };
//   }, [lat, lon, address, map]);

//   const handleReset = () => {
//     if (map) {
//       map.setView([lat, lon], 13);
//       map.invalidateSize();
//     }
//   };

//   return (
//     <div className="space-y-3">
//       <div className="relative w-full overflow-hidden rounded-xl">
//         <div
//           ref={mapRef}
//           className="h-[350px] w-full rounded-xl border-none"
//           onClick={() => setOverlayVisible(false)}
//         />
//         {overlayVisible && (
//           <div
//             className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/30 font-semibold text-white backdrop-blur-sm transition hover:bg-black/20"
//             onClick={() => setOverlayVisible(false)}
//           >
//             Click to interact with map
//           </div>
//         )}
//         <Button
//           size="sm"
//           onClick={handleReset}
//           className="absolute right-2 top-2 z-20 rounded-md bg-white/90 px-3 py-1 text-sm shadow hover:bg-white"
//         >
//           Reset View
//         </Button>
//       </div>
//       <div className="flex items-center gap-2 text-sm text-gray-700">
//         <Image src={locationIcon} alt="location" width={16} height={16} />
//         <span className="opacity-75">{address}</span>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import locationIcon from "@/public/travel/icons/location.svg";
import { Button } from "@/components/ui/button";

interface MapProps {
  lat?: number;
  lon?: number;
  address?: string;
}

export function Map({ lat = 0, lon = 0, address = "" }: MapProps) {
  const [key, setKey] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(true);

  useEffect(() => {
    const handleClick = () => setOverlayVisible(true);
    const handleScroll = () => setOverlayVisible(true);
    document.body.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScroll);
    return () => {
      document.body.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleMapClick = () => setOverlayVisible(false);
  const handleReset = () => setKey((prev) => prev + 1);
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.002}%2C${lat - 0.001}%2C${lon + 0.002}%2C${lat + 0.001}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div className="space-y-3 dark:bg-gray-800 dark:text-white">
      <div className="relative w-full overflow-hidden rounded-xl">
        <iframe key={key} src={mapSrc} className="h-[350px] w-full rounded-xl border-none" loading="lazy"></iframe>
        {overlayVisible && (
          <div onClick={handleMapClick} className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/30 font-semibold text-white backdrop-blur-sm transition hover:bg-black/20">
            Click to interact with map
          </div>
        )}
        <Button size="sm" onClick={handleReset} className="absolute right-2 top-2 z-20 rounded-md bg-white/90 px-3 py-1 text-sm shadow hover:bg-white">Reset View</Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Image src={locationIcon} alt="location" width={16} height={16} />
        <span className="opacity-75">{address}</span>
      </div>
    </div>
  );
}