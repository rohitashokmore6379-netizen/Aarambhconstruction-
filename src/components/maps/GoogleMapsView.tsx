import React, { useEffect, useRef, useState } from 'react';
import {
  loadGoogleMaps,
  ARAMBH_HQ_COORDS,
  ConstructionSiteMarker,
  INITIAL_CONSTRUCTION_SITES,
} from '../../services/googleMaps.ts';
import {
  MapPin,
  Navigation,
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
  RotateCcw,
} from 'lucide-react';

interface GoogleMapsViewProps {
  sites?: ConstructionSiteMarker[];
  selectedSiteId?: string | null;
  onSelectSite?: (site: ConstructionSiteMarker | null) => void;
  height?: string;
  showControls?: boolean;
}

export function GoogleMapsView({
  sites = INITIAL_CONSTRUCTION_SITES,
  selectedSiteId,
  onSelectSite,
  height = '600px',
  showControls = true,
}: GoogleMapsViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSite, setActiveSite] = useState<ConstructionSiteMarker | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('roadmap');
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        const google = await loadGoogleMaps();
        if (!isMounted || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: ARAMBH_HQ_COORDS.lat, lng: ARAMBH_HQ_COORDS.lng },
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }],
            },
          ],
        });

        googleMapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();

        // Directions Renderer
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#f59e0b',
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        // Add Arambh HQ Marker
        const hqMarker = new google.maps.Marker({
          position: { lat: ARAMBH_HQ_COORDS.lat, lng: ARAMBH_HQ_COORDS.lng },
          map,
          title: ARAMBH_HQ_COORDS.title,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: '#d97706',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
          },
        });

        hqMarker.addListener('click', () => {
          infoWindowRef.current.setContent(`
            <div style="color: #0f172a; padding: 6px; font-family: sans-serif; max-width: 260px;">
              <div style="font-weight: 800; font-size: 13px; color: #b45309;">🏛️ ARAMBH CONSTRUCTION HQ</div>
              <div style="font-size: 11px; font-weight: 600; margin-top: 2px;">Director: Er. Sudarshan Bajrang Naik</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 4px;">${ARAMBH_HQ_COORDS.address}</div>
              <div style="font-size: 10px; color: #0284c7; margin-top: 4px; font-weight: 600;">📞 ${ARAMBH_HQ_COORDS.phone}</div>
            </div>
          `);
          infoWindowRef.current.open(map, hqMarker);
        });

        // Autocomplete Search
        if (searchInputRef.current && google.maps.places) {
          const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: 'in' },
            fields: ['geometry', 'name', 'formatted_address'],
          });
          autocomplete.bindTo('bounds', map);

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) return;

            if (place.geometry.viewport) {
              map.fitBounds(place.geometry.viewport);
            } else {
              map.setCenter(place.geometry.location);
              map.setZoom(15);
            }
          });
        }

        setMapLoaded(true);
      } catch (err: any) {
        console.error('Google Maps loading error:', err);
        if (isMounted) setLoadError(err.message || 'Failed to load Google Maps');
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Markers when sites change or map loads
  useEffect(() => {
    if (!mapLoaded || !googleMapInstanceRef.current || !window.google) return;
    const google = window.google;
    const map = googleMapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Add site markers
    sites.forEach((site) => {
      const isCompleted = site.status === 'COMPLETED';
      const markerColor = isCompleted ? '#10b981' : '#f59e0b';

      const marker = new google.maps.Marker({
        position: { lat: site.lat, lng: site.lng },
        map,
        title: site.name,
        label: {
          text: `${site.progress}%`,
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: markerColor,
          fillOpacity: 0.95,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
      });

      marker.addListener('click', () => {
        setActiveSite(site);
        if (onSelectSite) onSelectSite(site);

        infoWindowRef.current.setContent(`
          <div style="color: #0f172a; padding: 8px; font-family: sans-serif; max-width: 280px;">
            <div style="font-size: 10px; font-weight: 700; color: #f59e0b; text-transform: uppercase;">${site.projectCode}</div>
            <div style="font-weight: 700; font-size: 13px; margin-top: 2px;">${site.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">📍 ${site.locationName}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; font-size: 11px; font-weight: 600;">
              <span>Progress: <strong>${site.progress}%</strong></span>
              <span>₹${(site.contractValue / 100000).toFixed(1)} Lakhs</span>
            </div>
            ${site.siteOwner ? `<div style="font-size: 10px; color: #475569; margin-top: 4px;">Client: ${site.siteOwner}</div>` : ''}
          </div>
        `);
        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  }, [mapLoaded, sites, onSelectSite]);

  // Handle selected site externally
  useEffect(() => {
    if (!selectedSiteId || !mapLoaded || !googleMapInstanceRef.current) return;
    const target = sites.find((s) => s.id === selectedSiteId);
    if (target) {
      setActiveSite(target);
      googleMapInstanceRef.current.panTo({ lat: target.lat, lng: target.lng });
      googleMapInstanceRef.current.setZoom(14);
    }
  }, [selectedSiteId, mapLoaded, sites]);

  // Calculate Route from HQ to selected site
  const calculateRoute = async (site: ConstructionSiteMarker) => {
    if (!window.google || !googleMapInstanceRef.current || !directionsRendererRef.current) return;
    const google = window.google;
    setIsRouting(true);

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: ARAMBH_HQ_COORDS.lat, lng: ARAMBH_HQ_COORDS.lng },
        destination: { lat: site.lat, lng: site.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        setIsRouting(false);
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0].legs[0];
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
          });
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  };

  const clearRoute = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
      setRouteInfo(null);
    }
  };

  const handleMapTypeChange = (type: 'roadmap' | 'satellite' | 'terrain' | 'hybrid') => {
    setMapType(type);
    if (googleMapInstanceRef.current && window.google) {
      googleMapInstanceRef.current.setMapTypeId(type);
    }
  };

  const resetView = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setCenter({ lat: ARAMBH_HQ_COORDS.lat, lng: ARAMBH_HQ_COORDS.lng });
      googleMapInstanceRef.current.setZoom(12);
      clearRoute();
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl flex flex-col">
      {/* Top Map Controls Bar */}
      {showControls && (
        <div className="p-3 bg-slate-900/95 border-b border-slate-800 backdrop-blur flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search plot, city, village, MIDC area..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={resetView}
              title="Recenter on HQ"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Recenter HQ</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Map Type Switcher */}
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => handleMapTypeChange('roadmap')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  mapType === 'roadmap' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => handleMapTypeChange('satellite')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  mapType === 'satellite' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => handleMapTypeChange('terrain')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  mapType === 'terrain' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Terrain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="relative w-full" style={{ height }}>
        {loadError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
            <MapPin className="w-10 h-10 text-rose-500 mb-2" />
            <h3 className="text-white font-bold text-sm">Google Maps Initialization Notice</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-md">{loadError}</p>
          </div>
        )}

        <div ref={mapRef} className="w-full h-full" />

        {/* Selected Site Float Card */}
        {activeSite && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-slate-900/95 border border-amber-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md z-10">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {activeSite.projectCode}
                </span>
                <h4 className="text-white font-bold text-sm mt-1">{activeSite.name}</h4>
                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  {activeSite.locationName}
                </p>
              </div>
              <button
                onClick={() => setActiveSite(null)}
                className="text-slate-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px]">Progress</span>
                <div className="text-white font-bold">{activeSite.progress}%</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Contract Value</span>
                <div className="text-amber-400 font-bold">
                  ₹{(activeSite.contractValue / 100000).toFixed(2)} Lakhs
                </div>
              </div>
            </div>

            {/* Route info if active */}
            {routeInfo && (
              <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between text-amber-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Navigation className="w-3.5 h-3.5" />
                  From Arambh HQ
                </span>
                <span className="font-bold">
                  {routeInfo.distance} • {routeInfo.duration}
                </span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => calculateRoute(activeSite)}
                disabled={isRouting}
                className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                {isRouting ? 'Routing...' : 'Drive from HQ'}
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeSite.lat},${activeSite.lng}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
                title="Open in Google Maps App"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
