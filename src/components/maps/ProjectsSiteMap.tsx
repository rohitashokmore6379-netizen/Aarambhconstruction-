/// <reference types="google.maps" />
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Building2,
  HardHat,
  Calendar,
  Layers,
  Search,
  Filter,
  Maximize2,
  Navigation,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  Compass,
} from 'lucide-react';
import { Project, Site } from '../../types.ts';
import { formatCurrency, getStatusBadgeClass } from '../../utils/formatters.ts';

interface MapSiteItem {
  id: string;
  name: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  location: string;
  owner?: string;
  ownerPhone?: string;
  totalCost: number;
  progressPercentage: number;
  siteStatus: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ON_HOLD';
  projectStatus: string;
  coordinates: { lat: number; lng: number };
  rawSite?: Site;
  rawProject?: Project;
}

interface ProjectsSiteMapProps {
  projects: Project[];
  sites: Site[];
  onSelectProject?: (projectId: string) => void;
  className?: string;
}

// Known regional location anchors for instant robust fallback positioning
const REGIONAL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  shengaon: { lat: 16.315, lng: 74.148 },
  kadgaon: { lat: 16.292, lng: 74.178 },
  gargoti: { lat: 16.309, lng: 74.135 },
  bhudargad: { lat: 16.315, lng: 74.148 },
  kolhapur: { lat: 16.705, lng: 74.243 },
  'tarabai park': { lat: 16.715, lng: 74.238 },
  'nagala park': { lat: 16.718, lng: 74.231 },
  rajarampuri: { lat: 16.69, lng: 74.25 },
  kadamwadi: { lat: 16.72, lng: 74.26 },
  pune: { lat: 18.5204, lng: 73.8567 },
  mumbai: { lat: 19.076, lng: 72.8777 },
};

export function ProjectsSiteMap({
  projects,
  sites,
  onSelectProject,
  className = '',
}: ProjectsSiteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const navigate = useNavigate();

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  // Unified items list merging Sites with parent Projects
  const mappedSites: MapSiteItem[] = useMemo(() => {
    const list: MapSiteItem[] = [];

    // Helper to resolve coordinates deterministically
    const getCoordinates = (loc: string, index: number): { lat: number; lng: number } => {
      const lower = loc.toLowerCase();
      let base = { lat: 16.315, lng: 74.148 }; // Default Shengaon/Bhudargad

      for (const [key, coords] of Object.entries(REGIONAL_COORDINATES)) {
        if (lower.includes(key)) {
          base = coords;
          break;
        }
      }

      // Add slight procedural jitter (approx 150m - 500m) so multiple sites in the same area don't overlap exactly
      const angle = (index * 137.5 * Math.PI) / 180; // Golden angle
      const radius = 0.0035 + (index % 5) * 0.0018; // ~350m to 1km radius
      return {
        lat: Number((base.lat + Math.cos(angle) * radius).toFixed(5)),
        lng: Number((base.lng + Math.sin(angle) * radius).toFixed(5)),
      };
    };

    let idxCounter = 0;

    // 1. Process Sites if available
    sites.forEach((site) => {
      const parentProject =
        typeof site.projectId === 'object' && site.projectId !== null
          ? (site.projectId as any)
          : projects.find((p) => p._id === site.projectId);

      const projId = parentProject?._id || (site.projectId as string) || '';
      const projName = parentProject?.projectName || 'Project Site';
      const projCode = parentProject?.projectCode || 'AR-PRJ';
      const projStatus = parentProject?.status || 'IN_PROGRESS';

      let siteStatus: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ON_HOLD' = 'ACTIVE';
      if (site.status === 'COMPLETED' || site.progressPercentage === 100) {
        siteStatus = 'COMPLETED';
      } else if (site.status === 'ACTIVE') {
        siteStatus = 'ACTIVE';
      } else if (projStatus === 'PLANNING' || site.progressPercentage === 0) {
        siteStatus = 'UPCOMING';
      } else {
        siteStatus = 'ACTIVE';
      }

      const locStr = site.location || site.address || parentProject?.location || 'Shengaon, Kolhapur';
      const coords = getCoordinates(locStr, idxCounter++);

      list.push({
        id: site._id,
        name: site.siteName,
        projectId: projId,
        projectCode: projCode,
        projectName: projName,
        location: locStr,
        owner: site.siteOwner || parentProject?.client?.name,
        ownerPhone: site.ownerContact || parentProject?.client?.phone,
        totalCost: site.totalCost || parentProject?.contractValue || 0,
        progressPercentage: site.progressPercentage || 0,
        siteStatus,
        projectStatus: projStatus,
        coordinates: coords,
        rawSite: site,
        rawProject: parentProject,
      });
    });

    // 2. Also ensure every Project without explicit sites has a geographic anchor pin
    projects.forEach((proj) => {
      const hasSite = list.some((s) => s.projectId === proj._id);
      if (!hasSite) {
        let siteStatus: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ON_HOLD' = 'ACTIVE';
        if (proj.status === 'COMPLETED' || proj.progressPercentage === 100) {
          siteStatus = 'COMPLETED';
        } else if (proj.status === 'PLANNING') {
          siteStatus = 'UPCOMING';
        } else {
          siteStatus = 'ACTIVE';
        }

        const locStr = proj.location || 'Shengaon, Kolhapur';
        const coords = getCoordinates(locStr, idxCounter++);

        list.push({
          id: `proj-${proj._id}`,
          name: `${proj.projectName} (Main Site)`,
          projectId: proj._id,
          projectCode: proj.projectCode,
          projectName: proj.projectName,
          location: locStr,
          owner: proj.client?.name,
          ownerPhone: proj.client?.phone,
          totalCost: proj.contractValue || 0,
          progressPercentage: proj.progressPercentage || 0,
          siteStatus,
          projectStatus: proj.status,
          coordinates: coords,
          rawProject: proj,
        });
      }
    });

    return list;
  }, [projects, sites]);

  // Filtered sites for current filter & search
  const filteredSites = useMemo(() => {
    return mappedSites.filter((s) => {
      if (statusFilter !== 'ALL' && s.siteStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.projectName.toLowerCase().includes(q) ||
          s.projectCode.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.owner?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mappedSites, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = mappedSites.length;
    const active = mappedSites.filter((s) => s.siteStatus === 'ACTIVE').length;
    const upcoming = mappedSites.filter((s) => s.siteStatus === 'UPCOMING').length;
    const completed = mappedSites.filter((s) => s.siteStatus === 'COMPLETED').length;
    return { total, active, upcoming, completed };
  }, [mappedSites]);

  // Initialize Google Map Instance
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;

      try {
        const apiKey =
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
          'AIzaSyA1WcwSMiE0xkD9XA1Uq9fDeQNpd1qUPXQ';

        setOptions({
          key: apiKey,
          v: 'weekly',
        });

        await importLibrary('maps');
        await importLibrary('marker');
        if (!isMounted || !mapContainerRef.current) return;
        const google = window.google;
        if (!google) return;

        // Determine center from mapped sites
        const center =
          mappedSites.length > 0
            ? mappedSites[0].coordinates
            : { lat: 16.315, lng: 74.148 };

        // Dark aesthetic map styling matching the Arambh Construction ERP
        const darkThemeStyles: google.maps.MapTypeStyle[] = [
          { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#090d16' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f59e0b' }],
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#64748b' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#1e293b' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#334155' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#f59e0b25' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#d9770650' }],
          },
          {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#1e293b' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0369a120' }],
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#38bdf8' }],
          },
        ];

        const mapOptions: google.maps.MapOptions = {
          center,
          zoom: 13,
          mapTypeId: mapType === 'hybrid' ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP,
          styles: mapType === 'roadmap' ? darkThemeStyles : undefined,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
        };

        const map = new google.maps.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;

        // Create InfoWindow
        infoWindowRef.current = new google.maps.InfoWindow({
          maxWidth: 340,
        });

        setMapLoaded(true);
      } catch (err: any) {
        console.error('Failed to initialize Google Maps:', err);
        if (isMounted) {
          setMapError(err.message || 'Unable to load Google Maps Platform');
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Map Type (Roadmap vs Satellite Hybrid)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    mapInstanceRef.current.setMapTypeId(
      mapType === 'hybrid'
        ? google.maps.MapTypeId.HYBRID
        : google.maps.MapTypeId.ROADMAP
    );
  }, [mapType]);

  // Update Markers whenever filtered sites change or map loads
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google) return;

    const map = mapInstanceRef.current;
    const google = window.google;

    // Clear previous markers
    markersRef.current.forEach((m) => {
      if (typeof m.setMap === 'function') {
        m.setMap(null);
      } else if (m.map) {
        m.map = null;
      }
    });
    markersRef.current = [];

    if (filteredSites.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    filteredSites.forEach((site) => {
      const isSelected = selectedSiteId === site.id;
      const isActive = site.siteStatus === 'ACTIVE';
      const isUpcoming = site.siteStatus === 'UPCOMING';
      const isCompleted = site.siteStatus === 'COMPLETED';

      // Pin Colors
      const bgColor = isActive ? '#f59e0b' : isUpcoming ? '#3b82f6' : '#10b981';
      const borderColor = isActive ? '#b45309' : isUpcoming ? '#1d4ed8' : '#047857';

      // Custom DOM Element Marker for maximum visual fidelity & pulsing active construction site state
      const pinContainer = document.createElement('div');
      pinContainer.className = 'custom-map-pin cursor-pointer relative group';
      pinContainer.setAttribute('title', site.name);

      // Inner HTML for the pin
      pinContainer.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
          ${
            isActive
              ? `<div style="position: absolute; width: 44px; height: 44px; top: -7px; border-radius: 9999px; background: rgba(245, 158, 11, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : isUpcoming
              ? `<div style="position: absolute; width: 40px; height: 40px; top: -5px; border-radius: 9999px; background: rgba(59, 130, 246, 0.2); animation: pulse 2.5s infinite;"></div>`
              : ''
          }
          <div style="
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: ${bgColor};
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="transform: rotate(45deg); font-size: ${isSelected ? '14px' : '12px'}; font-weight: bold; color: #ffffff; display: flex; align-items: center; justify-content: center;">
              ${isActive ? '🏗️' : isUpcoming ? '📐' : '✓'}
            </div>
          </div>
          <div style="
            margin-top: 4px;
            background: rgba(9, 13, 22, 0.95);
            color: #ffffff;
            border: 1px solid rgba(51, 65, 85, 0.8);
            border-radius: 6px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="color: ${bgColor}; font-family: ui-monospace, monospace;">${site.projectCode}</span>
            <span>• ${site.progressPercentage}%</span>
          </div>
        </div>
      `;

      let marker: any = null;

      // Try using AdvancedMarkerElement if available
      if (google.maps.marker && (google.maps.marker as any).AdvancedMarkerElement) {
        marker = new (google.maps.marker as any).AdvancedMarkerElement({
          map,
          position: site.coordinates,
          title: site.name,
          content: pinContainer,
        });
      } else {
        // Fallback to standard Marker with svg symbol
        marker = new google.maps.Marker({
          map,
          position: site.coordinates,
          title: site.name,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: bgColor,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      }

      // Marker click handler: open InfoWindow & highlight
      const handleMarkerClick = () => {
        setSelectedSiteId(site.id);
        openInfoWindow(site, marker);
      };

      if (typeof marker.addListener === 'function') {
        marker.addListener('click', handleMarkerClick);
      } else {
        pinContainer.addEventListener('click', handleMarkerClick);
      }

      markersRef.current.push(marker);
      bounds.extend(site.coordinates);
    });

    // Fit map bounds to encompass all pins smoothly
    if (filteredSites.length > 1) {
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else if (filteredSites.length === 1) {
      map.setCenter(filteredSites[0].coordinates);
      map.setZoom(15);
    }
  }, [filteredSites, mapLoaded, selectedSiteId]);

  // Open rich InfoWindow for a site
  const openInfoWindow = (site: MapSiteItem, markerTarget: any) => {
    if (!infoWindowRef.current || !mapInstanceRef.current) return;

    const isActive = site.siteStatus === 'ACTIVE';
    const isUpcoming = site.siteStatus === 'UPCOMING';
    const statusLabel = isActive
      ? 'Active Construction Site'
      : isUpcoming
      ? 'Upcoming / Planned Project Site'
      : 'Completed Project Site';

    const statusBadgeClass = isActive
      ? 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);'
      : isUpcoming
      ? 'background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);'
      : 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);';

    const contentHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; color: #ffffff; background: #0b0f19; padding: 12px; border-radius: 12px; font-size: 11px; line-height: 1.5; min-width: 250px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
          <span style="font-family: ui-monospace, monospace; font-size: 10px; font-weight: bold; color: #f59e0b;">${site.projectCode}</span>
          <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 6px; ${statusBadgeClass}">
            ${site.siteStatus}
          </span>
        </div>

        <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #ffffff;">${site.name}</h4>
        <div style="color: #94a3b8; font-size: 11px; margin-bottom: 8px;">${site.projectName}</div>

        <div style="display: flex; align-items: flex-start; gap: 6px; color: #cbd5e1; font-size: 10px; margin-bottom: 8px;">
          <span style="color: #f59e0b;">📍</span>
          <span>${site.location}</span>
        </div>

        <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 8px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10px;">
            <span style="color: #64748b;">Client/Owner:</span>
            <span style="color: #ffffff; font-weight: 600;">${site.owner || 'Arambh Construction'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 10px;">
            <span style="color: #64748b;">Contract Value:</span>
            <span style="font-family: ui-monospace, monospace; color: #f59e0b; font-weight: bold;">${formatCurrency(site.totalCost)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; font-size: 10px;">
            <span style="color: #94a3b8;">Physical Progress:</span>
            <span style="font-family: ui-monospace, monospace; color: #10b981; font-weight: bold;">${site.progressPercentage}%</span>
          </div>
          <div style="width: 100%; height: 5px; background: #1e293b; border-radius: 9999px; overflow: hidden;">
            <div style="width: ${site.progressPercentage}%; height: 100%; background: #10b981; border-radius: 9999px;"></div>
          </div>
        </div>

        <div style="display: flex; gap: 6px;">
          <button id="btn-view-project-${site.projectId}" style="flex: 1; padding: 6px 10px; background: #f59e0b; color: #020617; border: none; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span>Project Ledger & Gantt</span> &rarr;
          </button>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.location)}" target="_blank" rel="noreferrer" style="padding: 6px 8px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 8px; font-size: 11px; text-decoration: none; display: flex; align-items: center; justify-content: center;" title="Open in Google Maps">
            ↗
          </a>
        </div>
      </div>
    `;

    infoWindowRef.current.setContent(contentHtml);
    infoWindowRef.current.open({
      anchor: markerTarget,
      map: mapInstanceRef.current,
      shouldFocus: false,
    });

    // Attach click listener for the view project button inside InfoWindow
    setTimeout(() => {
      const btn = document.getElementById(`btn-view-project-${site.projectId}`);
      if (btn) {
        btn.onclick = () => {
          if (onSelectProject) {
            onSelectProject(site.projectId);
          } else {
            navigate(`/admin/projects/${site.projectId}`);
          }
        };
      }
    }, 50);
  };

  // Center map on a specific site card click
  const handleSiteCardClick = (site: MapSiteItem) => {
    setSelectedSiteId(site.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(site.coordinates);
      mapInstanceRef.current.setZoom(16);

      // Find marker and open InfoWindow
      const index = filteredSites.findIndex((s) => s.id === site.id);
      if (index !== -1 && markersRef.current[index]) {
        openInfoWindow(site, markersRef.current[index]);
      }
    }
  };

  // Reset Bounds to show all sites
  const handleFitAll = () => {
    if (!mapInstanceRef.current || !window.google || filteredSites.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    filteredSites.forEach((s) => bounds.extend(s.coordinates));
    mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Map Controls & Filter Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>Geographic Construction Sites Map</span>
            </h3>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Google Maps
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time geospatial tracking for active and upcoming construction plots, infrastructure road stretches, and civil projects.
          </p>
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 block uppercase">Mapped Sites</span>
            <strong className="text-white text-xs">{stats.total}</strong>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-amber-400 block uppercase">Active Pins</span>
            <strong className="text-amber-400 text-xs">{stats.active}</strong>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-blue-400 block uppercase">Upcoming</span>
            <strong className="text-blue-400 text-xs">{stats.upcoming}</strong>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-emerald-400 block uppercase">Completed</span>
            <strong className="text-emerald-400 text-xs">{stats.completed}</strong>
          </div>
        </div>
      </div>

      {/* 2. Interactive Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
        {/* Left Side: Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({mappedSites.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-amber-400/80 hover:text-amber-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Active ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                statusFilter === 'UPCOMING'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-blue-400/80 hover:text-blue-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Upcoming ({stats.upcoming})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'COMPLETED'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-emerald-400/80 hover:text-emerald-400'
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>

          {/* Map Layer Toggle (Roadmap vs Satellite) */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                mapType === 'roadmap'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Map
            </button>
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                mapType === 'hybrid'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite Terrain
            </button>
          </div>

          <button
            onClick={handleFitAll}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Fit all construction site pins within view"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Fit All Sites</span>
          </button>
        </div>

        {/* Right Side: Quick Site Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search site, project, plot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 3. Main Map Canvas with Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[580px]">
        {/* Google Maps Viewport Container */}
        <div className="lg:col-span-8 xl:col-span-9 relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0b0f19] shadow-2xl">
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

          {/* Loading Overlay */}
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300 font-mono text-xs">
                Initializing Google Maps Platform & plotting pins...
              </p>
            </div>
          )}

          {/* Error Banner if API error */}
          {mapError && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
              <MapPin className="w-10 h-10 text-rose-500 mx-auto" />
              <div className="font-bold text-white text-sm">Google Maps Initialization Notice</div>
              <p className="text-slate-400 text-xs max-w-md">{mapError}</p>
              <p className="text-[11px] text-amber-400 font-mono">
                Verify Google Maps API credentials in Settings.
              </p>
            </div>
          )}

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-2 text-[10px] text-slate-300 shadow-xl flex items-center gap-3 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-amber-400 font-bold">Active Site</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-blue-400 font-bold">Upcoming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 font-bold">Completed</span>
            </div>
          </div>
        </div>

        {/* Interactive Site Pins List Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Site Directory ({filteredSites.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Click to focus pin</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
            {filteredSites.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No construction sites found matching current filter.
              </div>
            ) : (
              filteredSites.map((site) => {
                const isSelected = selectedSiteId === site.id;
                const isActive = site.siteStatus === 'ACTIVE';
                const isUpcoming = site.siteStatus === 'UPCOMING';
                const isCompleted = site.siteStatus === 'COMPLETED';

                return (
                  <div
                    key={site.id}
                    onClick={() => handleSiteCardClick(site)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-amber-400">
                        {site.projectCode}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isUpcoming
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {site.siteStatus}
                      </span>
                    </div>

                    <h5 className="font-bold text-white text-xs line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {site.name}
                    </h5>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                      {site.location}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-500">Progress:</span>
                        <span className="font-bold text-emerald-400">
                          {site.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : isUpcoming
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${site.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">
                        {formatCurrency(site.totalCost)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectProject) {
                            onSelectProject(site.projectId);
                          } else {
                            navigate(`/admin/projects/${site.projectId}`);
                          }
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Ledger & Gantt</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
