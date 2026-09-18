import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Layers, Info } from 'lucide-react';

interface GoogleMapsViewProps {
  height?: string;
}

interface SiteLocation {
  name: string;
  type: string;
  location: string;
  lat: number;
  lng: number;
  description: string;
}

const LOCATIONS: SiteLocation[] = [
  {
    name: 'Arambh Construction Head Office',
    type: 'Headquarters',
    location: 'Shengaon, Tal. Bhudargad, Kolhapur',
    lat: 16.2842,
    lng: 74.0784,
    description: 'Main Administrative Office & Er. Sudarshan Naik Studio',
  },
  {
    name: 'Gargoti Commercial Arcade Site',
    type: 'Commercial Project',
    location: 'Main Market Road, Gargoti',
    lat: 16.3125,
    lng: 74.1378,
    description: 'G+3 RCC Commercial Complex under active construction',
  },
  {
    name: 'Shengaon Villa Enclave',
    type: 'Residential Project',
    location: 'Near Old Gram Panchayat, Shengaon',
    lat: 16.281,
    lng: 74.081,
    description: 'Bespoke Bungalows & Modern Farmhouses',
  },
  {
    name: 'Radhanagari Highway Retaining Wall',
    type: 'Infrastructure',
    location: 'Radhanagari Ghat Section',
    lat: 16.4172,
    lng: 73.9936,
    description: 'Heavy Earthwork & Reinforced Concrete Retaining Structure',
  },
];

export function GoogleMapsView({ height = '460px' }: GoogleMapsViewProps) {
  const [selectedSite, setSelectedSite] = useState<SiteLocation>(LOCATIONS[0]);
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // m: roadmap, k: satellite

  // Shengaon, Kolhapur coordinates
  const centerLat = selectedSite.lat;
  const centerLng = selectedSite.lng;

  const embedUrl = `https://maps.google.com/maps?q=${centerLat},${centerLng}&t=${mapType}&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${centerLat},${centerLng}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
      {/* Top Location Selection Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Active Sites:
          </span>
          {LOCATIONS.map((site) => {
            const isSelected = selectedSite.name === site.name;
            return (
              <button
                key={site.name}
                onClick={() => setSelectedSite(site)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{site.name}</span>
                <span className={`text-[10px] opacity-80 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                  ({site.type})
                </span>
              </button>
            );
          })}
        </div>

        {/* Satellite vs Roadmap Toggle */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMapType('m')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                mapType === 'm' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMapType('k')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                mapType === 'k' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              Satellite
            </button>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1.5 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Get Directions</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Map Embed Container */}
      <div className="relative w-full" style={{ height }}>
        <iframe
          title="Arambh Construction Location Map"
          width="100%"
          height="100%"
          src={embedUrl}
          className="border-0 w-full h-full grayscale-[15%] contrast-[105%]"
          loading="lazy"
          allowFullScreen
        />

        {/* Overlay Card with Current Site Information */}
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              {selectedSite.type}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {selectedSite.lat.toFixed(4)}° N, {selectedSite.lng.toFixed(4)}° E
            </span>
          </div>
          <h4 className="text-sm font-black text-white">{selectedSite.name}</h4>
          <p className="text-slate-300 font-medium">{selectedSite.location}</p>
          <p className="text-slate-400 text-[11px]">{selectedSite.description}</p>
        </div>
      </div>
    </div>
  );
}

export default GoogleMapsView;
