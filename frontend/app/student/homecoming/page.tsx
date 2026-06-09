"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef, useSyncExternalStore, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

type HomecomingPhase =
  | "confirm"
  | "locating"
  | "mode-select"
  | "bus-nav"
  | "walk-nav"
  | "completed";

type NavDirection = "forward" | "right" | "left" | "arrive" | "bus" | "bell" | "walk";

type NavStep = {
  text: string;
  subtext: string;
  voice: string;
  ieumiMsg: string;
  action: string;
  next: number;
  icon?: string;
  direction: NavDirection;
  latitude?: number;
  longitude?: number;
};

type HomecomingState = {
  studentName: string;
  status: string;
  updatedAt: string;
  message: string;
  isSos: boolean;
  phase: string;
  battery: number;
  latitude?: number;
  longitude?: number;
  currentStepIndex?: number;
  totalSteps?: number;
  waypoints?: string[];
  destination?: string;
  travelMode?: string;
  isSimulating?: boolean;
};

type RoutePlan = {
  homeAddress: string;
  destinationAddress: string;
  waypoints: string[];
  travelMode: "walking" | "transit" | "driving";
  note: string;
  updatedAt: string;
};

const ROUTE_PLAN_KEY = "haemileum_return_route_plan";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DEMO_START_LOCATION = { latitude: 37.5665, longitude: 126.978 }; // 서울시청

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

const getSelectedStudent = () =>
  (typeof window !== "undefined"
    ? localStorage.getItem("haemileum_selected_student")
    : "") || "학생";

const getRoutePlanStr = () =>
  typeof window !== "undefined"
    ? localStorage.getItem(ROUTE_PLAN_KEY) ?? ""
    : "";

// Haversine formula to calculate distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate bearing (angle) in degrees
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// ─── AR Direction Arrow ───────────────────────────────────────────────────────
function ArDirectionArrow({ direction }: { direction: NavDirection }) {
  const cfg: Record<NavDirection, { symbol: string; color: string }> = {
    forward: { symbol: "↑", color: "#10b981" },
    right: { symbol: "↗", color: "#10b981" },
    left: { symbol: "↖", color: "#10b981" },
    arrive: { symbol: "🏠", color: "#f59e0b" },
    bus: { symbol: "🚌", color: "#0ea5e9" },
    bell: { symbol: "🔔", color: "#f97316" },
    walk: { symbol: "🚶", color: "#10b981" },
  };
  const { symbol, color } = cfg[direction] || cfg.forward;

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      {/* Main arrow */}
      <div
        className="text-[96px] leading-none font-black drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)]"
        style={{ color, animation: "arPulse 1.8s ease-in-out infinite" }}
      >
        {symbol}
      </div>

      {/* Ripple rings */}
      <div className="relative flex items-center justify-center w-20 h-16 -mt-2">
        <div
          className="absolute w-14 h-14 rounded-full border-4 border-emerald-400/70"
          style={{ animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite" }}
        />
        <div
          className="absolute w-20 h-20 rounded-full border-2 border-emerald-400/40"
          style={{
            animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
            animationDelay: "0.35s",
          }}
        />
        <div
          className="w-3 h-3 rounded-full shadow-[0_0_16px_rgba(16,185,129,0.9)]"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// ─── 이음이 Mascot Row ─────────────────────────────────────────────────────────
function IeumiMascot({ text, speaking }: { text: string; speaking: boolean }) {
  return (
    <div className="flex items-end gap-3 px-2 select-none pointer-events-none max-w-full">
      {/* Character */}
      <div
        className="shrink-0 transition-transform duration-200"
        style={
          speaking
            ? {
                transform: "scale(1.12)",
                animation: "ieumiTalk 0.3s ease-in-out infinite alternate",
              }
            : {}
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/helper/ieumi.png"
          alt="이음이"
          className="w-16 h-16 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
        />
      </div>

      {/* Speech bubble */}
      <div
        className={`relative bg-white/90 backdrop-blur-md rounded-2xl rounded-bl-none px-4 py-3 shadow-xl border border-white/50 transition-all duration-300 max-w-[240px] ${
          speaking ? "scale-105" : "scale-100"
        }`}
      >
        <p className="text-sm font-black text-slate-900 leading-snug break-words">
          {text}
        </p>
        {/* Tail */}
        <div className="absolute -bottom-[9px] left-3 w-4 h-4 bg-white/90 rotate-45 border-b border-r border-white/50" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function HomecomingPageContent() {
  const searchParams = useSearchParams();
  const initSos = searchParams.get("sos") === "true";

  const studentName = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => "학생"
  );

  const routePlanText = useSyncExternalStore(
    subscribeToStorage,
    getRoutePlanStr,
    () => ""
  );

  const routePlan = useMemo(() => {
    if (!routePlanText) return null;
    try {
      return JSON.parse(routePlanText) as RoutePlan;
    } catch {
      return null;
    }
  }, [routePlanText]);

  const [phase, setPhase] = useState<HomecomingPhase>("confirm");
  const [isSos, setIsSos] = useState(initSos);
  const [navStep, setNavStep] = useState(0);
  const [arEnabled, setArEnabled] = useState(false);
  const [ieumiSpeaking, setIeumiSpeaking] = useState(false);
  const [ieumiText, setIeumiText] = useState("안녕! 이음이가 함께 갈게요 🏠");

  // Geolocation and Simulation states
  const [latitude, setLatitude] = useState(DEMO_START_LOCATION.latitude);
  const [longitude, setLongitude] = useState(DEMO_START_LOCATION.longitude);
  const [gpsSource, setGpsSource] = useState<"gps" | "demo">("demo");
  const [isSimulating, setIsSimulating] = useState(false);
  const [viewMode, setViewMode] = useState<"camera" | "map">("camera");
  const [heading, setHeading] = useState(0); // device orientation heading

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationWatchIdRef = useRef<number | null>(null);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state to parent dashboard
  const syncToParent = useCallback(
    (
      status: string,
      message: string,
      sosStatus = false,
      currentPhase: string = phase,
      stepIdx = navStep,
      simActive = isSimulating,
      currLat = latitude,
      currLng = longitude
    ) => {
      if (typeof window === "undefined") return;

      const waypoints = routePlan ? routePlan.waypoints : [];
      const destination = routePlan
        ? routePlan.destinationAddress || routePlan.homeAddress
        : "집";
      const travelMode = routePlan ? routePlan.travelMode : "walking";

      const state: HomecomingState = {
        studentName,
        status,
        updatedAt: new Date().toLocaleTimeString("ko-KR"),
        message,
        isSos: sosStatus,
        phase: currentPhase,
        battery: 88,
        latitude: currLat,
        longitude: currLng,
        currentStepIndex: stepIdx,
        waypoints,
        destination,
        travelMode,
        isSimulating: simActive,
      };

      // Also save to haemileum_return_data for safe-return component backward compatibility
      const legacyData = {
        studentName,
        phase: currentPhase === "completed" ? "arrived" : currentPhase,
        method: currentPhase === "bus-nav" ? "bus" : "walking",
        updatedAt: state.updatedAt,
        location: {
          latitude: currLat,
          longitude: currLng,
          source: gpsSource,
          capturedAt: new Date().toISOString(),
          note: simActive ? "시뮬레이션 구동 중" : "GPS 추적 중",
        },
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${currLat},${currLng}`,
      };

      localStorage.setItem("haemileum_homecoming_state", JSON.stringify(state));
      localStorage.setItem("haemileum_return_active", currentPhase === "completed" ? "false" : "true");
      localStorage.setItem("haemileum_return_data", JSON.stringify(legacyData));
      window.dispatchEvent(new Event("storage"));
    },
    [studentName, phase, navStep, isSimulating, latitude, longitude, routePlan, gpsSource]
  );

  const speak = useCallback(
    (text: string, ieumiMsg?: string) => {
      if (typeof window === "undefined") return;
      if (localStorage.getItem("haemileum_sound_muted") === "true") return;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (ieumiMsg) setIeumiText(ieumiMsg);
      setIeumiSpeaking(true);
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = setTimeout(() => setIeumiSpeaking(false), 3000);

      const gender =
        localStorage.getItem("haemileum_voice_gender") || "female";
      const audio = new Audio(
        `/api/tts?text=${encodeURIComponent(text)}&gender=${gender}`
      );
      audioRef.current = audio;
      audio.play().catch((e) => console.warn("TTS Play Failed", e));
    },
    []
  );

  const triggerSos = useCallback(() => {
    setIsSos(true);
    speak(
      "괜찮아요. 멈춰서 천천히 숨 쉬어요. 보호자에게 알렸어요.",
      "걱정 마요! 꼭 도와드릴게요 💙"
    );
    syncToParent("위험 상황", "아이가 SOS 버튼을 눌렀습니다!", true);
  }, [speak, syncToParent]);

  const cancelSos = () => {
    setIsSos(false);
    speak("다시 안내를 시작할게요.", "다시 같이 가요! 🏠");
    syncToParent(
      phase === "completed" ? "귀가 완료" : "귀가 중",
      "아이가 안정을 되찾았습니다.",
      false
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setArEnabled(true);
      speak("AR 카메라를 켰어요! 길 안내를 시작합니다.", "카메라를 켰어요! 같이 가요 🗺️");
      syncToParent("AR 모드 실행 중", "아이가 AR 카메라를 켜고 길을 찾고 있습니다.");
    } catch {
      alert("카메라를 켤 수 없습니다. (권한 거부 또는 기기 미지원)");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setArEnabled(false);
  };

  // Setup Device Orientation for Compass
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // absolute alpha if available, otherwise fallback
      const alpha = e.alpha;
      if (alpha !== null) {
        setHeading(360 - alpha);
      }
    };

    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
    };
  }, []);

  // Geolocation watch
  useEffect(() => {
    if (phase !== "confirm" && phase !== "locating") {
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            // Only update if not currently simulating to prevent coordinate jumps
            if (!isSimulating) {
              setLatitude(pos.coords.latitude);
              setLongitude(pos.coords.longitude);
              setGpsSource("gps");
            }
          },
          (err) => {
            console.warn("Geolocation watch error", err);
            setGpsSource("demo");
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        locationWatchIdRef.current = watchId;
      }
    }

    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
    };
  }, [phase, isSimulating]);

  // Generate Navigation Steps
  const dynamicSteps = useMemo<NavStep[]>(() => {
    const steps: NavStep[] = [];
    const waypoints = routePlan ? routePlan.waypoints : [];
    const destination = routePlan
      ? routePlan.destinationAddress || routePlan.homeAddress
      : "우리집";

    const getWaypointConfig = (name: string, idx: number) => {
      const text = name.toLowerCase();
      let direction: NavDirection = "forward";
      let icon = "🚶";

      if (text.includes("편의점") || text.includes("마트")) {
        icon = "🏪";
      } else if (text.includes("횡단보도") || text.includes("신호등") || text.includes("건너")) {
        icon = "🚦";
      } else if (text.includes("정류장") || text.includes("버스")) {
        icon = "🚌";
        direction = "bus";
      } else if (text.includes("학교") || text.includes("교문") || text.includes("정문")) {
        icon = "🏫";
      } else if (text.includes("아파트") || text.includes("집") || text.includes("동")) {
        icon = "🏠";
        direction = "arrive";
      }

      if (direction === "forward") {
        if (text.includes("왼") || text.includes("좌")) {
          direction = "left";
        } else if (text.includes("오른") || text.includes("우")) {
          direction = "right";
        } else {
          const dirs: NavDirection[] = ["forward", "right", "forward", "left"];
          direction = dirs[idx % dirs.length];
        }
      }

      return { direction, icon };
    };

    // Calculate simulated coordinates for testing progress
    const assignSimCoords = (idx: number, total: number) => {
      // Create a nice pathway heading North-East (zigzag)
      const latOffset = (idx + 1) * 0.0006 * Math.sin(((idx + 1) * Math.PI) / 4);
      const lngOffset = (idx + 1) * 0.0006 * Math.cos(((idx + 1) * Math.PI) / 4);
      return {
        latitude: DEMO_START_LOCATION.latitude + latOffset,
        longitude: DEMO_START_LOCATION.longitude + lngOffset,
      };
    };

    // Step 0: Start
    steps.push({
      text: "집으로 출발해요",
      subtext: waypoints.length > 0
        ? `첫 번째 목적지인 [${waypoints[0]}]으로 가요`
        : `목적지인 [${destination}]으로 가요`,
      voice: waypoints.length > 0
        ? `집으로 출발해요. 첫 번째 목적지인 ${waypoints[0]}으로 가요.`
        : `집으로 출발해요. 목적지인 ${destination}으로 가요.`,
      ieumiMsg: "오늘도 안전하게 귀가해요! 출발! 🚶",
      action: "출발했어요",
      next: 1,
      direction: "forward",
      icon: "🏫",
      ...DEMO_START_LOCATION,
    });

    // Step 1 to N: Waypoints
    waypoints.forEach((wp, idx) => {
      const { direction, icon } = getWaypointConfig(wp, idx);
      const isLastWp = idx === waypoints.length - 1;
      const nextTarget = isLastWp ? destination : waypoints[idx + 1];
      const coords = assignSimCoords(idx, waypoints.length);

      steps.push({
        text: `${wp}(으)로 가요`,
        subtext: `지나간 뒤 [${nextTarget}]으로 이동해요`,
        voice: `${wp}으로 가요. 주변 차와 오토바이를 조심해요.`,
        ieumiMsg: `${wp}에 도착하면 알려줘요! 📍`,
        action: isLastWp ? "도착 (집으로 가기)" : "여기 지나갔어요",
        next: idx + 2,
        direction,
        icon,
        ...coords,
      });
    });

    // Final Step: Destination
    const finalCoords = assignSimCoords(waypoints.length, waypoints.length);
    steps.push({
      text: `${destination}에 도착했어요`,
      subtext: "안전하게 집 안에 들어왔어요",
      voice: `축하해요! ${destination}에 도착했습니다. 오늘도 멋지게 해냈어요!`,
      ieumiMsg: "집이다! 정말 수고했어요! 🎉",
      action: "귀가 완료",
      next: waypoints.length + 2,
      direction: "arrive",
      icon: "🏠",
      ...finalCoords,
    });

    return steps;
  }, [routePlan]);

  const defaultBusSteps: NavStep[] = [
    {
      text: "정류장으로 가요",
      subtext: "걸어서 3분이에요",
      voice: "정류장으로 가요. 걸어서 3분이에요.",
      ieumiMsg: "정류장 보여요? 같이 가요! 🚏",
      action: "정류장 도착했어요",
      next: 1,
      direction: "forward",
      latitude: 37.5668,
      longitude: 126.9785,
    },
    {
      text: "23번 버스를 타요",
      subtext: "버스 번호를 꼭 확인해요",
      voice: "23번 버스를 타요. 버스 번호를 꼭 확인해요.",
      ieumiMsg: "23번 버스예요! 확인해요 🚌",
      action: "버스를 탔어요",
      next: 2,
      icon: "🚌",
      direction: "bus",
      latitude: 37.5672,
      longitude: 126.9790,
    },
    {
      text: "3정류장 뒤에 내려요",
      subtext: "○○시장 → ○○초등학교 → 우리집앞",
      voice: "3정류장 뒤에 내려요. 다음 정류장에서 내릴 준비를 해요.",
      ieumiMsg: "조금만 더! 내릴 준비해요 🔔",
      action: "하차벨 눌렀어요",
      next: 3,
      icon: "🔔",
      direction: "bell",
      latitude: 37.5675,
      longitude: 126.9782,
    },
    {
      text: "잘 내렸어요. 이제 집까지 걸어가요",
      subtext: "거의 다 왔어요",
      voice: "잘 내렸어요. 이제 집까지 천천히 걸어가요.",
      ieumiMsg: "거의 다 왔어요! 조금만요 🏠",
      action: "집 도착!",
      next: 4,
      icon: "🏠",
      direction: "walk",
      latitude: 37.5680,
      longitude: 126.9788,
    },
  ];

  const defaultWalkSteps: NavStep[] = [
    {
      text: "앞으로 조금 걸어요",
      subtext: "편의점 앞에서 오른쪽으로 가요",
      voice: "앞으로 조금 걸어요. 편의점 앞에서 오른쪽으로 가요.",
      ieumiMsg: "편의점 보이면 오른쪽이에요! ➡️",
      action: "다음",
      next: 1,
      direction: "forward",
      latitude: 37.5668,
      longitude: 126.9785,
    },
    {
      text: "횡단보도 앞에서 멈춰요",
      subtext: "파란불이 켜지면 건너요",
      voice: "횡단보도 앞에서 멈춰요. 파란불이 켜지면 건너요.",
      ieumiMsg: "파란불 꼭 확인해요! 🚦",
      action: "건넜어요",
      next: 2,
      direction: "forward",
      latitude: 37.5673,
      longitude: 126.9782,
    },
    {
      text: "우리 아파트가 보여요",
      subtext: "거의 다 왔어요",
      voice: "우리 아파트가 보여요. 천천히 걸어가요.",
      ieumiMsg: "아파트다! 거의 다 왔어요! 🏠",
      action: "집 도착!",
      next: 3,
      icon: "🏠",
      direction: "arrive",
      latitude: 37.5678,
      longitude: 126.9788,
    },
  ];

  const stepsArr = useMemo(() => {
    if (phase === "bus-nav") return defaultBusSteps;
    return routePlan ? dynamicSteps : defaultWalkSteps;
  }, [phase, routePlan, dynamicSteps]);

  const currentNav = stepsArr[navStep] as NavStep | undefined;

  // Active target coordinates
  const targetLat = currentNav?.latitude ?? DEMO_START_LOCATION.latitude;
  const targetLng = currentNav?.longitude ?? DEMO_START_LOCATION.longitude;

  // Calculate real-time distance and bearing to current waypoint
  const currentDistance = useMemo(() => {
    return Math.round(getDistance(latitude, longitude, targetLat, targetLng));
  }, [latitude, longitude, targetLat, targetLng]);

  const currentBearing = useMemo(() => {
    return Math.round(getBearing(latitude, longitude, targetLat, targetLng));
  }, [latitude, longitude, targetLat, targetLng]);

  // Simulation Walk logic loop
  useEffect(() => {
    if (isSimulating && currentNav) {
      simulationTimerRef.current = setInterval(() => {
        setLatitude((currLat) => {
          setLongitude((currLng) => {
            const dist = getDistance(currLat, currLng, targetLat, targetLng);
            if (dist <= 4) {
              // Arrived! Auto advance
              clearInterval(simulationTimerRef.current!);
              setIsSimulating(false);
              setTimeout(() => {
                advanceNav();
              }, 1000);
              return targetLng;
            }

            // Move 4 meters closer towards the target coordinate
            const stepRatio = 4 / dist;
            const nextLat = currLat + (targetLat - currLat) * stepRatio;
            const nextLng = currLng + (targetLng - currLng) * stepRatio;

            syncToParent(
              phase === "bus-nav" ? "버스 타고 가는 중" : "도보 귀가 중",
              `아이가 다음 장소로 걸어가고 있습니다: ${currentNav.text} (남은 거리: ${Math.round(dist)}m)`,
              false,
              phase,
              navStep,
              true,
              nextLat,
              nextLng
            );

            return nextLng;
          });

          // Lat update helper
          const dist = getDistance(currLat, longitude, targetLat, targetLng);
          if (dist <= 4) return targetLat;
          const stepRatio = 4 / dist;
          return currLat + (targetLat - currLat) * stepRatio;
        });
      }, 1000);
    }

    return () => {
      if (simulationTimerRef.current !== null) {
        clearInterval(simulationTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, navStep, targetLat, targetLng]);

  const advanceNav = () => {
    if (!currentNav) return;
    if (navStep < stepsArr.length - 1) {
      const next = stepsArr[navStep + 1];
      setNavStep(next.next);
      speak(next.voice, next.ieumiMsg);

      let parentStatus = "이동 중";
      let parentMsg = `아이가 다음 단계로 이동했습니다: ${next.text}`;

      if (next.action === "버스를 탔어요") {
        parentStatus = "정류장 대기";
        parentMsg = "아이가 23번 버스를 기다리고 있습니다.";
      } else if (next.action === "하차벨 눌렀어요") {
        parentStatus = "버스 탑승 중";
        parentMsg = "아이가 23번 버스에 탑승했다고 표시했습니다.";
      }

      // Snapping location to the completed waypoint coordinate in simulation
      if (isSimulating || gpsSource === "demo") {
        setLatitude(currentNav.latitude ?? DEMO_START_LOCATION.latitude);
        setLongitude(currentNav.longitude ?? DEMO_START_LOCATION.longitude);
      }

      syncToParent(
        parentStatus,
        parentMsg,
        false,
        phase,
        next.next,
        isSimulating,
        currentNav.latitude,
        currentNav.longitude
      );
    } else {
      handleComplete();
    }
  };

  const handleConfirm = () => {
    setPhase("locating");
    speak(
      "지금 있는 곳을 찾고 있어요. 잠시만 기다려요.",
      "위치 찾는 중... 조금만요! 📍"
    );
    syncToParent("위치 확인 중", "아이가 귀가를 위해 위치를 확인하고 있습니다.", false, "locating");

    setTimeout(() => {
      setPhase("mode-select");
      speak(
        "현재 위치를 찾았어요. 가장 쉬운 길을 추천해 줄게요.",
        "길을 찾았어요! 어떻게 갈까요? 🗺️"
      );
      syncToParent("경로 선택 대기", "아이가 귀가 방법을 선택하고 있습니다.", false, "mode-select");
    }, 2500);
  };

  const handleSelectBus = () => {
    setPhase("bus-nav");
    setNavStep(0);
    speak("정류장으로 가요. 걸어서 3분이에요.", "정류장까지 같이 가요! 🚏");
    syncToParent("정류장 이동 중", "아이가 버스 정류장으로 이동 중입니다.", false, "bus-nav");
  };

  const handleSelectWalk = () => {
    setPhase("walk-nav");
    setNavStep(0);
    speak(
      "앞으로 조금 걸어요. 지도를 확인하며 가요.",
      "걸어서 갈게요! 이음이도 함께예요 🚶"
    );
    syncToParent("도보 귀가 시작", "아이가 걸어서 집으로 이동하고 있습니다.", false, "walk-nav");
  };

  const handleComplete = () => {
    setPhase("completed");
    setIsSimulating(false);
    speak(
      "잘했어요! 집에 도착했습니다. 오늘도 멋지게 해냈어요!",
      "집이다! 정말 잘했어요! 🎉"
    );
    syncToParent("귀가 완료", "아이가 안전하게 집에 도착했습니다.", false, "completed");

    const prevXp = parseInt(
      localStorage.getItem(`haemileum_student_xp_${studentName}`) || "0",
      10
    );
    localStorage.setItem(
      `haemileum_student_xp_${studentName}`,
      String(prevXp + 100)
    );

    const saved: object[] = JSON.parse(
      localStorage.getItem("haemileum_results") || "[]"
    );
    saved.push({
      studentName,
      mission: "안심 귀가 동행",
      score: 100,
      status: "완료",
      emotion: "안정",
      completedAt: new Date().toLocaleString("ko-KR"),
    });
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
  };

  useEffect(() => {
    if (initSos) {
      triggerSos();
    } else {
      speak(
        "집으로 갈까요? 맞으면 네, 아니면 아니요를 눌러주세요.",
        "집에 갈까요? 🏠"
      );
    }
    return () => {
      stopCamera();
      if (audioRef.current) audioRef.current.pause();
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNavPhase = phase === "bus-nav" || phase === "walk-nav";

  return (
    <>
      <style>{`
        @keyframes arPulse {
          0%, 100% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.8; transform: translateY(-8px) scale(1.05); }
        }
        @keyframes ieumiTalk {
          from { transform: rotate(-3deg) scale(1.1); }
          to   { transform: rotate(3deg)  scale(1.15); }
        }
        @keyframes scanRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes floatSign {
          from { transform: translateY(0px) rotateX(10deg); }
          to   { transform: translateY(-6px) rotateX(15deg); }
        }
      `}</style>

      <main className="relative min-h-dvh bg-[#edf2ee] text-slate-900 font-sans overflow-x-hidden overflow-y-auto">
        {/* ── AR camera background ── */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`fixed inset-0 w-full h-full object-cover transition-opacity duration-700 z-0 ${
            arEnabled && viewMode === "camera" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        {arEnabled && viewMode === "camera" && (
          <div className="fixed inset-0 bg-black/25 pointer-events-none z-0" />
        )}

        {/* ── Main content (overlaid) ── */}
        <div
          className={`relative z-10 w-full min-h-dvh flex flex-col p-5 sm:p-6 max-w-md mx-auto ${
            arEnabled && viewMode === "camera" ? "text-white" : ""
          }`}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <Link
              href="/student/home"
              className={`text-xs font-black px-4 py-2.5 rounded-full backdrop-blur-md border shadow-sm transition active:scale-95 ${
                arEnabled && viewMode === "camera"
                  ? "bg-black/45 border-white/20 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              ← 홈으로
            </Link>

            <div className="flex items-center gap-2">
              <div
                className={`text-xs font-black px-4 py-2.5 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-sm ${
                  gpsSource === "gps"
                    ? "bg-emerald-500/80 text-white"
                    : "bg-amber-500/80 text-white"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                {gpsSource === "gps" ? "실시간 GPS" : "연습 모드"}
              </div>
            </div>
          </div>

          {/* Developer Walk Simulation Bar */}
          {isNavPhase && (
            <div className="mb-4 shrink-0 rounded-2xl bg-black/75 text-white p-3.5 backdrop-blur-lg border border-white/10 shadow-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400">🧪 모의 귀가 테스트</span>
                <span className="text-[10px] font-bold text-slate-400">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`flex-1 min-h-10 rounded-xl text-xs font-black transition active:scale-95 ${
                    isSimulating
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  {isSimulating ? "⏸️ 모의 걷기 정지" : "▶️ 모의 걷기 시작 (초속 4m)"}
                </button>

                {arEnabled && (
                  <button
                    onClick={() => setViewMode(viewMode === "camera" ? "map" : "camera")}
                    className="px-4 min-h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-black transition active:scale-95"
                  >
                    {viewMode === "camera" ? "🗺️ 지도 보기" : "📷 AR 보기"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phase content */}
          <div className="flex-1 flex flex-col justify-center gap-5">
            {/* ── CONFIRM ── */}
            {phase === "confirm" && (
              <div className="text-center p-8 rounded-3xl bg-white shadow-xl border-2 border-emerald-100 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/helper/ieumi.png"
                      alt="이음이"
                      className="w-20 h-20 object-contain animate-bounce"
                    />
                    <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full shadow">
                      안녕!
                    </span>
                  </div>
                </div>
                <h1 className="text-3xl font-black mb-2 text-slate-900">집으로 갈까요?</h1>
                <p className="text-base font-bold mb-8 text-slate-500">
                  이음이와 지도 가이드가 함께 길을 찾아줄게요
                </p>
                <div className="grid gap-4">
                  <button
                    onClick={handleConfirm}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-2xl font-black py-6 rounded-2xl transition active:scale-95 shadow-lg"
                  >
                    네, 집으로 갈래요
                  </button>
                  <Link
                    href="/student/home"
                    className="block bg-slate-200 hover:bg-slate-300 text-slate-800 text-xl font-bold py-5 rounded-2xl transition active:scale-95 text-center"
                  >
                    아니요 (종료)
                  </Link>
                </div>
              </div>
            )}

            {/* ── LOCATING ── */}
            {phase === "locating" && (
              <div className="text-center p-8 rounded-3xl bg-white shadow-xl border-2 border-emerald-100 animate-in fade-in zoom-in duration-300">
                <div className="text-6xl animate-bounce mb-6">📍</div>
                <h1 className="text-2xl font-black mb-4 text-slate-900">
                  지금 있는 곳을 찾고 있어요
                </h1>
                <p className="font-bold text-slate-500">
                  잠시만 기다려요...
                </p>
                <div className="flex justify-center gap-2 mt-5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-3 h-3 rounded-full bg-emerald-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── MODE SELECT ── */}
            {phase === "mode-select" && (
              <div className="p-7 rounded-3xl bg-white shadow-xl border-2 border-emerald-100 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/helper/ieumi.png"
                    alt="이음이"
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <h1 className="text-2xl font-black mb-1 text-center text-slate-900">
                  가장 쉬운 길을 찾았어요
                </h1>
                <p className="text-sm font-bold mb-6 text-center text-slate-500">
                  이음이와 함께 어떻게 갈까요?
                </p>

                <div className="grid gap-4">
                  <button
                    onClick={handleSelectBus}
                    className="relative bg-sky-50 hover:bg-sky-100 border-4 border-sky-400 text-sky-900 py-6 px-4 rounded-2xl transition active:scale-95 text-left flex items-center gap-4 shadow-sm"
                  >
                    <span className="text-5xl">🚌</span>
                    <div>
                      <span className="block text-xs font-black text-sky-600 mb-1">
                        👍 추천 경로
                      </span>
                      <span className="block text-2xl font-black">
                        버스 타고 가기
                      </span>
                      <span className="block text-xs font-bold mt-1 text-sky-700">
                        23번 버스를 타고 쉽게 안전하게 이동해요.
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleSelectWalk}
                    className="bg-emerald-50 hover:bg-emerald-100 border-4 border-emerald-400 text-emerald-950 py-6 px-4 rounded-2xl transition active:scale-95 text-left flex items-center gap-4 shadow-sm"
                  >
                    <span className="text-5xl">🚶</span>
                    <div>
                      <span className="block text-xs font-black text-emerald-600 mb-1">
                        {routePlan ? "보호자 공유 경로" : "기본 도보 경로"}
                      </span>
                      <span className="block text-2xl font-black">
                        걸어서 가기
                      </span>
                      <span className="block text-xs font-bold mt-1 text-emerald-700">
                        {routePlan ? "학부모가 설정한 웨이포인트를 따라가요." : "도보로 집까지 천천히 걸어가요."}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ── NAVIGATION ── */}
            {isNavPhase && currentNav && (
              <div className="flex flex-col gap-4">
                {/* Visual view toggler */}
                {viewMode === "camera" && arEnabled ? (
                  // CAMERA NAVIGATION OVERLAY
                  <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                    {/* AR direction arrow */}
                    <div className="flex justify-center py-2">
                      <ArDirectionArrow direction={currentNav.direction} />
                    </div>

                    {/* HUD Radar Compass overlay */}
                    <div className="flex items-center justify-between bg-black/65 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">
                      <div className="flex items-center gap-3">
                        {/* Circular Radar Compass */}
                        <div className="relative w-16 h-16 rounded-full border border-emerald-400/50 bg-emerald-950/20 flex items-center justify-center overflow-hidden">
                          {/* Compass rotating sweep grid */}
                          <div
                            className="absolute inset-0 border-t border-emerald-400/30 rounded-full"
                            style={{ animation: "scanRotate 4s linear infinite" }}
                          />
                          {/* Compass Needle */}
                          <div
                            className="w-1.5 h-12 bg-gradient-to-t from-transparent via-emerald-400 to-emerald-300 rounded-full transition-transform duration-300"
                            style={{ transform: `rotate(${currentBearing - heading}deg)` }}
                          />
                          {/* Pulse center */}
                          <div className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                        </div>

                        <div>
                          <p className="text-[10px] font-black text-emerald-400 tracking-wider">WAYPOINT RADAR</p>
                          <h3 className="text-base font-black text-white">{currentNav.text}</h3>
                          <p className="text-xs font-bold text-slate-300">방향각: {currentBearing}°</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400">REMAINING DIST</p>
                        <h4 className="text-2xl font-black text-emerald-400 animate-pulse">{currentDistance}m</h4>
                      </div>
                    </div>

                    {/* Spatial floating billboard sign */}
                    <div
                      className="rounded-2xl bg-gradient-to-br from-emerald-600/90 to-teal-700/90 text-white p-4 shadow-xl border border-white/20 select-none text-center transform-gpu"
                      style={{ animation: "floatSign 2s ease-in-out infinite alternate" }}
                    >
                      <span className="text-3xl inline-block mb-1">{currentNav.icon || "📍"}</span>
                      <h2 className="text-lg font-black">{currentNav.text}</h2>
                      <p className="text-xs font-semibold text-emerald-100">{currentNav.subtext}</p>
                    </div>

                    {/* 이음이 mascot – shown in AR mode */}
                    <IeumiMascot text={ieumiText} speaking={ieumiSpeaking} />
                  </div>
                ) : (
                  // MAP NAVIGATION VIEW (OR FALLBACK NON-AR)
                  <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                    <div className="overflow-hidden rounded-3xl border-2 border-emerald-500 bg-white shadow-xl">
                      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">안심귀가 지도 안내</span>
                        <span className="text-xs font-black text-emerald-600">목적지까지 {currentDistance}m</span>
                      </div>

                      {/* Map iframe or SVG visual tracker path */}
                      {GOOGLE_MAPS_API_KEY ? (
                        <div className="h-44 bg-slate-100">
                          <iframe
                            title="안심귀가 맵 경로"
                            src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${latitude},${longitude}&zoom=17&language=ko`}
                            className="h-full w-full border-0"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        // Customized HTML5 SVG Mini-Map showing dynamic path node list
                        <div className="relative h-44 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4">
                          <svg className="w-full h-full" viewBox="0 0 200 100">
                            {/* Dotted path grid */}
                            <path
                              d="M 20 50 Q 80 20, 100 50 T 180 50"
                              fill="none"
                              stroke="#cbd5e1"
                              strokeWidth="4"
                              strokeDasharray="6,6"
                            />
                            {/* Completed path segment */}
                            {navStep > 0 && (
                              <path
                                d={`M 20 50 Q 80 20, 100 50 T 180 50`}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="4"
                                strokeDasharray={String((navStep / stepsArr.length) * 200) + ", 200"}
                                className="transition-all duration-1000"
                              />
                            )}

                            {/* Node Points */}
                            <circle cx="20" cy="50" r="7" fill="#10b981" /> {/* School */}
                            {stepsArr.slice(1, -1).map((_, i) => {
                              const x = 50 + i * (100 / (stepsArr.length - 2));
                              const passed = i + 1 < navStep;
                              const current = i + 1 === navStep;
                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={current ? "35" : "50"}
                                  r={current ? "8" : "6"}
                                  fill={passed ? "#10b981" : current ? "#3b82f6" : "#94a3b8"}
                                  className={current ? "animate-pulse" : ""}
                                />
                              );
                            })}
                            <circle cx="180" cy="50" r="8" fill="#f59e0b" /> {/* Home */}

                            {/* Avatar Ping */}
                            <g transform={`translate(${20 + (navStep / (stepsArr.length - 1)) * 160}, 42)`}>
                              <circle cx="0" cy="0" r="10" fill="#3b82f6" fillOpacity="0.3" className="animate-ping" />
                              <circle cx="0" cy="0" r="6" fill="#2563eb" />
                            </g>
                          </svg>

                          <div className="absolute top-2 left-3 bg-white/80 rounded px-2 py-0.5 text-[9px] font-black text-slate-500 border border-slate-200">
                            출발
                          </div>
                          <div className="absolute top-2 right-3 bg-white/80 rounded px-2 py-0.5 text-[9px] font-black text-amber-600 border border-slate-200">
                            집 도착
                          </div>
                        </div>
                      )}

                      {/* Active Waypoint Info */}
                      <div className="p-4 grid gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400">CURRENT WAYPOINT</span>
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            단계 {navStep + 1} / {stepsArr.length}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900">{currentNav.text}</h2>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed">{currentNav.subtext}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nav Card Controllers */}
                <div
                  className={`p-6 sm:p-8 rounded-3xl ${
                    arEnabled && viewMode === "camera"
                      ? "bg-black/60 backdrop-blur-xl border border-white/20"
                      : "bg-white shadow-xl border-2 border-emerald-500"
                  }`}
                >
                  {/* Step dots */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1.5">
                      {stepsArr.map((_, i) => (
                        <span
                          key={i}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i < navStep
                              ? "w-5 bg-emerald-400"
                              : i === navStep
                              ? "w-8 bg-emerald-500 animate-pulse"
                              : "w-2 bg-slate-400/40"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        arEnabled && viewMode === "camera" ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {navStep + 1} / {stepsArr.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-5">
                    {currentNav.icon && (
                      <span className="text-5xl">{currentNav.icon}</span>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                      {currentNav.text}
                    </h1>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <button
                      onClick={advanceNav}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-black py-5 rounded-2xl transition active:scale-95 shadow-md"
                    >
                      {currentNav.action}
                    </button>
                    <button
                      onClick={() => speak(currentNav.voice, currentNav.ieumiMsg)}
                      className={`w-16 flex items-center justify-center rounded-2xl text-2xl transition ${
                        arEnabled && viewMode === "camera"
                          ? "bg-white/20 hover:bg-white/30"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                      aria-label="다시 듣기"
                    >
                      🔊
                    </button>
                  </div>
                </div>

                {/* 이음이 mascot in non-AR/Map mode – shown at bottom */}
                {(!arEnabled || viewMode === "map") && (
                  <div
                    className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 transition-all duration-300"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/helper/ieumi.png"
                      alt="이음이"
                      className={`w-14 h-14 object-contain shrink-0 ${
                        ieumiSpeaking ? "animate-bounce" : ""
                      }`}
                    />
                    <div>
                      <p className="text-xs font-black text-emerald-600 mb-1">
                        이음이의 안내
                      </p>
                      <p className="text-base font-black text-slate-900 leading-snug">
                        {ieumiText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── COMPLETED ── */}
            {phase === "completed" && (
              <div className="text-center p-8 rounded-3xl bg-white shadow-xl border-2 border-emerald-100 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/helper/ieumi.png"
                    alt="이음이"
                    className="w-20 h-20 object-contain animate-bounce"
                  />
                </div>
                <div className="text-5xl mb-4">🎉</div>
                <h1 className="text-3xl font-black mb-3 text-slate-900">
                  안전하게 도착했어요!
                </h1>
                <p className="font-bold mb-1 text-emerald-600">
                  이음이가 정말 자랑스러워요!
                </p>
                <p className="font-bold mb-8 text-slate-500">
                  오늘도 스스로 집까지 온 것을 칭찬해요.
                </p>
                <Link
                  href="/student/home"
                  className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-black py-5 rounded-2xl transition active:scale-95 shadow-lg text-center"
                >
                  홈으로 돌아가기 (+100 XP)
                </Link>
              </div>
            )}
          </div>

          {/* ── Bottom tools ── */}
          {!["confirm", "locating", "completed"].includes(phase) && !isSos && (
            <div className="mt-6 grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={arEnabled ? stopCamera : startCamera}
                className={`py-4 rounded-2xl font-black text-sm flex flex-col items-center gap-1.5 transition active:scale-95 border-2 ${
                  arEnabled
                    ? "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-50"
                    : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span className="text-2xl">{arEnabled ? "📷" : "👀"}</span>
                {arEnabled ? "AR 카메라 끄기" : "AR 카메라 켜기"}
              </button>
              <button
                onClick={triggerSos}
                className="bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl font-black text-sm flex flex-col items-center gap-1.5 transition active:scale-95 shadow-md"
              >
                <span className="text-2xl">🚨</span>
                도움 요청 (SOS)
              </button>
            </div>
          )}
        </div>

        {/* ── SOS overlay ── */}
        {isSos && (
          <div className="absolute inset-0 bg-rose-950/95 flex flex-col p-6 z-50 animate-in fade-in duration-300">
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full">
              <div className="w-24 h-24 bg-rose-600 rounded-full flex items-center justify-center text-5xl animate-pulse shadow-[0_0_50px_rgba(225,29,72,0.8)] mb-8">
                🆘
              </div>

              {/* 이음이 comforting */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/helper/ieumi.png"
                  alt="이음이"
                  className="w-14 h-14 object-contain animate-bounce"
                />
                <div className="bg-white/10 rounded-2xl px-4 py-2 text-left">
                  <p className="text-sm font-black text-white">
                    이음이가 여기 있어요
                  </p>
                  <p className="text-xs font-bold text-rose-200">
                    천천히 숨 쉬어요 💙
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-black text-white mb-4">
                도움이 필요해요
              </h2>
              <p className="text-lg font-bold text-rose-200 mb-8 leading-relaxed">
                괜찮아요.
                <br />
                멈춰서 천천히 숨을 쉬어요.
                <br />
                보호자에게 알렸어요.
              </p>

              <div className="w-full grid gap-4">
                <a
                  href="tel:01000000000"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white py-5 rounded-2xl font-black text-xl shadow-lg transition flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📞</span> 엄마/아빠에게 전화
                </a>
                <button
                  onClick={() => alert("주변 어른용 화면을 띄웁니다.")}
                  className="bg-white text-rose-900 py-5 rounded-2xl font-black text-xl shadow-lg transition flex flex-col items-center justify-center gap-1"
                >
                  주변 어른에게 보여주기
                  <span className="text-sm font-bold text-slate-500">
                    길을 잃었다는 문구를 화면에 크게 띄웁니다
                  </span>
                </button>
              </div>

              <button
                onClick={cancelSos}
                className="mt-8 px-6 py-3 rounded-full border-2 border-rose-400 text-rose-300 font-bold hover:bg-rose-900 transition"
              >
                마음이 괜찮아졌어요 (돌아가기)
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function HomecomingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f7f5] flex items-center justify-center">
          <div className="text-emerald-600 font-bold animate-pulse text-lg">로딩 중...</div>
        </div>
      }
    >
      <HomecomingPageContent />
    </Suspense>
  );
}
