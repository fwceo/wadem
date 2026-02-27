'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const defaultCenter = { lat: 36.1901, lng: 44.0091 }; // Erbil, Iraq

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

interface MapPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    formatted: string;
  }) => void;
  initialCenter?: { lat: number; lng: number };
}

function getAccuracy(zoom: number): { percent: number; label: string; color: string; hint: string } {
  if (zoom >= 19) return { percent: 100, label: 'Exact', color: '#22C55E', hint: 'Perfect! Your location is pinpointed.' };
  if (zoom >= 17) return { percent: 85, label: 'High', color: '#22C55E', hint: 'Great accuracy. Zoom in a bit more for exact.' };
  if (zoom >= 15) return { percent: 60, label: 'Good', color: '#FFC107', hint: 'Getting closer! Keep zooming in.' };
  if (zoom >= 13) return { percent: 35, label: 'Low', color: '#F59E0B', hint: 'Zoom in closer to your building.' };
  return { percent: 15, label: 'Very Low', color: '#EF4444', hint: 'Zoom in much closer to place pin accurately.' };
}

export default function MapPicker({ onLocationSelect, initialCenter }: MapPickerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
  });

  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(14);
  const [address, setAddress] = useState('');
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const accuracy = getAccuracy(zoom);
  const hasPinned = marker !== null;

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?key=${MAPS_API_KEY}&latlng=${lat},${lng}`
        );
        const data = await res.json();
        const formatted = data.results?.[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddress(formatted);
        onLocationSelect({ lat, lng, formatted });
      } catch {
        const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddress(fallback);
        onLocationSelect({ lat, lng, formatted: fallback });
      } finally {
        setIsGeocoding(false);
      }
    },
    [onLocationSelect]
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const handleZoomChanged = useCallback(() => {
    if (mapRef.current) {
      setZoom(mapRef.current.getZoom() || 14);
    }
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarker({ lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(17);
        setZoom(17);
        reverseGeocode(lat, lng);
        setIsGeolocating(false);
      },
      () => setIsGeolocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode]);

  if (!isLoaded) {
    return (
      <div className="w-full aspect-[4/3] rounded-2xl bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={marker || initialCenter || defaultCenter}
          zoom={zoom}
          onClick={handleMapClick}
          onLoad={onMapLoad}
          onZoomChanged={handleZoomChanged}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            styles: [
              { featureType: 'poi', stylers: [{ visibility: 'off' }] },
              { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            ],
          }}
        >
          {marker && (
            <Marker
              position={marker}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 24 24" fill="%23EF4444"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
                ),
                scaledSize: isLoaded ? new google.maps.Size(36, 48) : undefined,
                anchor: isLoaded ? new google.maps.Point(18, 48) : undefined,
              }}
            />
          )}
        </GoogleMap>

        {/* Center hint (before pin placed) */}
        {!hasPinned && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-1">
              <svg className="w-10 h-10 text-red-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <div className="bg-secondary/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg mt-1">
                Zoom in to set your pin
              </div>
            </div>
          </div>
        )}

        {/* Accuracy indicator — top left overlay */}
        {hasPinned && (
          <div className="absolute top-3 left-3 right-14 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-secondary">
                Accuracy: {accuracy.percent}%
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: accuracy.color }}
              >
                {accuracy.label}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${accuracy.percent}%`, backgroundColor: accuracy.color }}
              />
            </div>
            <p className="text-[10px] text-text-secondary mt-1">{accuracy.hint}</p>
          </div>
        )}

        {/* Locate me button */}
        <button
          onClick={handleLocateMe}
          disabled={isGeolocating}
          className="absolute bottom-3 right-3 bg-white shadow-lg rounded-full p-2.5 active:scale-95 transition-transform duration-100"
          title="Use my location"
        >
          {isGeolocating ? (
            <svg className="w-5 h-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
            </svg>
          )}
        </button>

        {/* Zoom in/out hint — bottom left */}
        {hasPinned && accuracy.percent < 85 && (
          <div className="absolute bottom-3 left-3 bg-secondary/90 text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-md">
            Pinch to zoom in closer
          </div>
        )}
      </div>

      {/* Address display */}
      {address && (
        <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-start gap-2">
          <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <div className="min-w-0">
            <p className="text-sm text-text-primary leading-snug">
              {isGeocoding ? 'Finding address...' : address}
            </p>
          </div>
        </div>
      )}

      {!hasPinned && (
        <p className="text-xs text-text-tertiary text-center">
          Zoom in and tap the map to place your pin, or use the location button
        </p>
      )}
    </div>
  );
}
