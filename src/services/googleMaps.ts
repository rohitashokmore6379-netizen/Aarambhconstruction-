import { Loader } from '@googlemaps/js-api-loader';

export const GOOGLE_MAPS_API_KEY = 'AIzaSyA1WcwSMiE0xkD9XA1Uq9fDeQNpd1qUPXQ';

let loaderInstance: Loader | null = null;

export function getGoogleMapsLoader(): Loader {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry', 'marker'],
    });
  }
  return loaderInstance;
}

export async function loadGoogleMaps() {
  const loader = getGoogleMapsLoader();
  return loader.load();
}

// Construction sites and HQ default coordinates (Shengaon, Taluka Bhudargad, Kolhapur)
export const ARAMBH_HQ_COORDS = {
  lat: 16.2731, // Shengaon, Bhudargad, Kolhapur region
  lng: 74.1524,
  address: 'At/Post Shengaon, Taluka: Bhudargad, District: Kolhapur, Maharashtra - PIN 416209',
  title: 'ARAMBH CONSTRUCTION HEADQUARTERS',
  director: 'Er. Sudarshan Bajrang Naik',
  phone: '+917796853434',
};

export interface ConstructionSiteMarker {
  id: string;
  name: string;
  projectCode: string;
  lat: number;
  lng: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  progress: number;
  contractValue: number;
  locationName: string;
  siteOwner?: string;
  ownerContact?: string;
}

export const INITIAL_CONSTRUCTION_SITES: ConstructionSiteMarker[] = [
  {
    id: 'site-1',
    name: 'PWD Rural Highway Widening & Asphalt Paving',
    projectCode: 'AR-PWD-2025-01',
    lat: 16.2815,
    lng: 74.1610,
    status: 'ACTIVE',
    progress: 72,
    contractValue: 8500000,
    locationName: 'Shengaon - Gargoti Road Sector 4',
    siteOwner: 'Public Works Department (PWD)',
    ownerContact: '+919822104523',
  },
  {
    id: 'site-2',
    name: 'RCC Commercial Complex & Shopping Arcade',
    projectCode: 'AR-COMM-2025-04',
    lat: 16.2542,
    lng: 74.1856,
    status: 'ACTIVE',
    progress: 45,
    contractValue: 12500000,
    locationName: 'Gargoti Market Yard, Bhudargad',
    siteOwner: 'Gargoti Vyapari Association',
    ownerContact: '+919423851234',
  },
  {
    id: 'site-3',
    name: 'Grampanchayat Community Hall & Water Tank',
    projectCode: 'AR-GOVT-2024-11',
    lat: 16.2905,
    lng: 74.1382,
    status: 'COMPLETED',
    progress: 100,
    contractValue: 4200000,
    locationName: 'Shengaon Central Village',
    siteOwner: 'Grampanchayat Shengaon',
    ownerContact: '+919850442211',
  },
  {
    id: 'site-4',
    name: 'Residential Bungalow - RCC Frame & Finishing',
    projectCode: 'AR-RES-2025-08',
    lat: 16.3120,
    lng: 74.1720,
    status: 'ACTIVE',
    progress: 30,
    contractValue: 6500000,
    locationName: 'Kadgaon Bypass, Bhudargad',
    siteOwner: 'Mr. Anandrao Patil',
    ownerContact: '+919765123987',
  },
  {
    id: 'site-5',
    name: 'Industrial Pre-Engineered Steel Shed',
    projectCode: 'AR-IND-2025-02',
    lat: 16.3750,
    lng: 74.2250,
    status: 'ACTIVE',
    progress: 58,
    contractValue: 9800000,
    locationName: 'Kagal MIDC Industrial Estate, Kolhapur',
    siteOwner: 'Kolhapur Agro Engineering Works',
    ownerContact: '+919921445566',
  },
];
