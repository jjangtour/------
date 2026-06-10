"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface MapMarker {
  latitude: number;
  longitude: number;
  title?: string;
  iconHtml?: string; // HTML string for custom marker (e.g., emojis)
}

interface NaverMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  fallbackText?: string;
}

export default function NaverMap({
  latitude,
  longitude,
  zoom = 16,
  markers = [],
  className = "w-full h-full min-h-[200px] rounded-lg",
  fallbackText = "네이버 지도를 불러올 수 없습니다. API 키를 확인해 주세요.",
}: NaverMapProps) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);

  // Check if SDK already loaded globally (e.g. from previous mounts)
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).naver?.maps) {
      setIsSdkLoaded(true);
    }
  }, []);

  // Initialize and update map
  useEffect(() => {
    if (!isSdkLoaded || !mapContainerRef.current || typeof window === "undefined") return;

    const naver = (window as any).naver;
    if (!naver || !naver.maps) return;

    const mapOptions = {
      center: new naver.maps.LatLng(latitude, longitude),
      zoom: zoom,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
    };

    // If map not initialized yet, create it
    if (!mapRef.current) {
      mapRef.current = new naver.maps.Map(mapContainerRef.current, mapOptions);
    } else {
      // If already initialized, update center and zoom
      mapRef.current.setCenter(new naver.maps.LatLng(latitude, longitude));
      mapRef.current.setZoom(zoom);
    }

    const map = mapRef.current;

    // Clear old markers
    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const position = new naver.maps.LatLng(markerData.latitude, markerData.longitude);
      
      const markerOptions: any = {
        position,
        map,
        title: markerData.title,
      };

      // Handle custom emoji or HTML markers
      if (markerData.iconHtml) {
        markerOptions.icon = {
          content: markerData.iconHtml,
          size: new naver.maps.Size(32, 32),
          anchor: new naver.maps.Point(16, 16),
        };
      }

      const naverMarker = new naver.maps.Marker(markerOptions);
      markerRefs.current.push(naverMarker);
    });

  }, [isSdkLoaded, latitude, longitude, zoom, markers]);

  // Clean up markers on unmount
  useEffect(() => {
    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
    };
  }, []);

  // Handle client-side check for SDK loading
  const handleScriptLoad = () => {
    setIsSdkLoaded(true);
  };

  const handleScriptError = () => {
    setSdkError(true);
  };

  // Render Fallback if no Client ID or SDK error occurred
  if (!clientId || sdkError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 p-4 border border-slate-200 text-slate-500 text-center font-bold text-sm ${className}`}>
        <p className="mb-2">⚠️ {fallbackText}</p>
        {!clientId && (
          <p className="text-xs font-semibold text-slate-400">
            (.env.local 파일에 NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID를 추가해야 합니다)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[inherit]">
      <Script
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        strategy="afterInteractive"
      />
      <div ref={mapContainerRef} className={className} />
    </div>
  );
}
