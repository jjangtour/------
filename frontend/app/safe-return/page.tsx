"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";

type MainPhase =
  | "consent"
  | "confirm"
  | "finding"
  | "method"
  | "walking"
  | "bus-to-stop"
  | "bus-waiting"
  | "bus-arrived"
  | "bus-riding"
  | "bus-alighting"
  | "bus-walk-home"
  | "arrived";

type LocationStatus =
  | "idle"
  | "locating"
  | "ready"
  | "fallback"
  | "insecure"
  | "denied"
  | "unavailable"
  | "unsupported";

type LocationIssue = "insecure" | "denied" | "unavailable" | "timeout" | "unsupported";

type LocationSnapshot = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: "gps" | "demo";
  capturedAt: string;
  note?: string;
  issue?: LocationIssue;
};

type RoutePlan = {
  homeAddress: string;
  destinationAddress: string;
  waypoints: string[];
  travelMode: "walking" | "transit" | "driving";
  note: string;
  updatedAt: string;
};

const WALK_STEPS = [
  { arrow: "↑", main: "앞으로 조금 걸어요", landmark: "파란 편의점이 보이면 멈춰요", icon: "🏪" },
  { arrow: "→", main: "편의점에서 오른쪽으로 가요", landmark: "횡단보도가 나와요", icon: "🚦" },
  { arrow: "↑", main: "횡단보도를 건너요", landmark: "초록 신호를 꼭 확인해요", icon: "🟢" },
  { arrow: "→", main: "아파트 입구로 들어가요", landmark: "파란 간판이 보여요", icon: "🏠" },
];

const BUS_NUMBER = "23";
const BUS_STOP_NAME = "해밀학교앞";
const BUS_STOPS_LIST = ["○○시장", "○○초등학교", "우리집앞 정류장"];
const ROUTE_PLAN_KEY = "haemileum_return_route_plan";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DEMO_LOCATION = {
  latitude: 37.5665,
  longitude: 126.978,
  accuracy: 120,
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function toLocationSnapshot(position: GeolocationPosition): LocationSnapshot {
  return {
    latitude: Number(position.coords.latitude.toFixed(6)),
    longitude: Number(position.coords.longitude.toFixed(6)),
    accuracy: Math.round(position.coords.accuracy),
    source: "gps",
    capturedAt: new Date().toISOString(),
  };
}

function makeDemoLocation(note: string, issue: LocationIssue): LocationSnapshot {
  return {
    ...DEMO_LOCATION,
    source: "demo",
    capturedAt: new Date().toISOString(),
    note,
    issue,
  };
}

function requestCurrentLocation(): Promise<LocationSnapshot> {
  if (!window.isSecureContext) {
    return Promise.resolve(
      makeDemoLocation(
        "현재 접속 주소가 HTTPS가 아니라 브라우저가 실제 위치를 막고 있어요. HTTPS 주소로 접속해야 학생 GPS를 받을 수 있어요.",
        "insecure"
      )
    );
  }

  if (!navigator.geolocation) {
    return Promise.resolve(
      makeDemoLocation("이 브라우저에서는 위치 기능을 사용할 수 없어요.", "unsupported")
    );
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toLocationSnapshot(position)),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve(makeDemoLocation("위치 권한이 거부되어 실제 위치를 받을 수 없어요.", "denied"));
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          resolve(makeDemoLocation("기기의 위치 신호를 받을 수 없어 연습 위치로 안내하고 있어요.", "unavailable"));
          return;
        }

        resolve(makeDemoLocation("위치 응답 시간이 길어 연습 위치로 안내하고 있어요.", "timeout"));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 5000,
      }
    );
  });
}

function getLocationStatusFromSnapshot(snapshot: LocationSnapshot): LocationStatus {
  if (snapshot.source === "gps") return "ready";
  if (snapshot.issue === "insecure") return "insecure";
  if (snapshot.issue === "denied") return "denied";
  if (snapshot.issue === "unavailable" || snapshot.issue === "timeout") return "unavailable";
  if (snapshot.issue === "unsupported") return "unsupported";
  return "fallback";
}

function getMapUrl(location: LocationSnapshot) {
  const params = new URLSearchParams({
    api: "1",
    query: `${location.latitude},${location.longitude}`,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function getMapEmbedUrl(location: LocationSnapshot) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const params = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY,
    q: `${location.latitude},${location.longitude}`,
    zoom: "17",
    language: "ko",
    region: "KR",
  });

  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function getLocationExtra(location: LocationSnapshot | null) {
  return location ? { location, mapUrl: getMapUrl(location) } : {};
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getRoutePlanStr() {
  return typeof window !== "undefined"
    ? localStorage.getItem(ROUTE_PLAN_KEY) ?? ""
    : "";
}

function parseRoutePlan(value: string): RoutePlan | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as RoutePlan;
  } catch {
    return null;
  }
}

function getRouteDestination(plan: RoutePlan) {
  return plan.destinationAddress || plan.homeAddress;
}

function getTravelModeLabel(mode: RoutePlan["travelMode"]) {
  if (mode === "transit") return "대중교통";
  if (mode === "driving") return "차량";
  return "도보";
}

function getGoogleDirectionsUrl(plan: RoutePlan, origin?: LocationSnapshot | null) {
  const params = new URLSearchParams({
    api: "1",
    destination: getRouteDestination(plan),
    travelmode: plan.travelMode,
  });

  if (origin) {
    params.set("origin", `${origin.latitude},${origin.longitude}`);
  }

  if (plan.waypoints.length > 0) {
    params.set("waypoints", plan.waypoints.join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getGoogleDirectionsEmbedUrl(plan: RoutePlan, origin?: LocationSnapshot | null) {
  if (!GOOGLE_MAPS_API_KEY || !origin) return null;

  const params = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY,
    origin: `${origin.latitude},${origin.longitude}`,
    destination: getRouteDestination(plan),
    mode: plan.travelMode,
    language: "ko",
    region: "KR",
  });

  if (plan.waypoints.length > 0) {
    params.set("waypoints", plan.waypoints.join("|"));
  }

  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}

function saveStatus(phase: string, method: string, studentName: string, extra?: object) {
  const data = {
    studentName,
    phase,
    method,
    updatedAt: new Date().toLocaleTimeString("ko-KR"),
    ...extra,
  };
  localStorage.setItem("haemileum_return_active", "true");
  localStorage.setItem("haemileum_return_data", JSON.stringify(data));
  window.dispatchEvent(new Event("storage"));
}

function clearStatus() {
  localStorage.setItem("haemileum_return_active", "false");
  localStorage.removeItem("haemileum_return_data");
  window.dispatchEvent(new Event("storage"));
}

export default function SafeReturnPage() {
  const [phase, setPhase] = useState<MainPhase>("consent");
  const [method, setMethod] = useState<"walking" | "bus">("bus");
  const [walkIndex, setWalkIndex] = useState(0);
  const [stopsLeft, setStopsLeft] = useState(BUS_STOPS_LIST.length);
  const [busCountdown, setBusCountdown] = useState(180);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [studentName] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("haemileum_selected_student") || "학생"
      : "학생"
  );
  const [location, setLocation] = useState<LocationSnapshot | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const timerRef = useRef<number | null>(null);
  const locationWatchRef = useRef<number | null>(null);
  const sharedPhaseRef = useRef<string>("finding");
  const sharedMethodRef = useRef<string>("선택 전");
  const studentNameRef = useRef(studentName);
  const statusExtraRef = useRef<Record<string, unknown>>({});
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const routePlanText = useSyncExternalStore(
    subscribeToStorage,
    getRoutePlanStr,
    () => ""
  );
  const routePlan = useMemo(() => parseRoutePlan(routePlanText), [routePlanText]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const saveReturnStatus = useCallback(
    (
      nextPhase: string,
      nextMethod: string,
      extra: Record<string, unknown> = {},
      nextLocation: LocationSnapshot | null = location
    ) => {
      sharedPhaseRef.current = nextPhase;
      sharedMethodRef.current = nextMethod;
      statusExtraRef.current = extra;
      saveStatus(nextPhase, nextMethod, studentNameRef.current, {
        ...extra,
        ...getLocationExtra(nextLocation),
      });
    },
    [location]
  );

  useEffect(() => {
    if (!isSharingLocation) return;

    if (!window.isSecureContext) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const snapshot = toLocationSnapshot(position);
        setLocation(snapshot);
        setLocationStatus("ready");
        saveStatus(
          sharedPhaseRef.current,
          sharedMethodRef.current,
          studentNameRef.current,
          {
            ...statusExtraRef.current,
            ...getLocationExtra(snapshot),
          }
        );
      },
      (error) => {
        setLocationStatus((current) => {
          if (current === "ready") return current;
          if (error.code === error.PERMISSION_DENIED) return "denied";
          return "unavailable";
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000,
      }
    );

    locationWatchRef.current = watchId;

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (locationWatchRef.current === watchId) {
        locationWatchRef.current = null;
      }
    };
  }, [isSharingLocation]);

  const startBusTimer = useCallback(() => {
    setBusCountdown(180);
    timerRef.current = window.setInterval(() => {
      setBusCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase("bus-arrived");
          saveReturnStatus("bus-arrived", "bus", { busNumber: BUS_NUMBER });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [saveReturnStatus]);

  const handleConsent = () => setPhase("confirm");

  const handleConfirm = async () => {
    setPhase("finding");
    setLocationStatus("locating");
    setIsSharingLocation(true);
    saveReturnStatus("finding", "선택 전");

    const [snapshot] = await Promise.all([requestCurrentLocation(), wait(2500)]);
    setLocation(snapshot);
    setLocationStatus(getLocationStatusFromSnapshot(snapshot));
    setPhase("method");
    saveReturnStatus("method", "선택 전", {}, snapshot);
  };

  const handleMethod = (selected: "walking" | "bus") => {
    setMethod(selected);
    if (selected === "walking") {
      setWalkIndex(0);
      setPhase("walking");
      saveReturnStatus("walking", "walking", { step: WALK_STEPS[0].main });
    } else {
      setPhase("bus-to-stop");
      saveReturnStatus("bus-to-stop", "bus", { busNumber: BUS_NUMBER });
    }
  };

  const handleNextWalkStep = () => {
    const next = walkIndex + 1;
    if (next >= WALK_STEPS.length) {
      setPhase("arrived");
      setIsSharingLocation(false);
      clearStatus();
    } else {
      setWalkIndex(next);
      saveReturnStatus("walking", "walking", { step: WALK_STEPS[next].main });
    }
  };

  const handleAtStop = () => {
    setPhase("bus-waiting");
    saveReturnStatus("bus-waiting", "bus", { busNumber: BUS_NUMBER });
    startBusTimer();
  };

  const handleBoardBus = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStopsLeft(BUS_STOPS_LIST.length);
    setPhase("bus-riding");
    saveReturnStatus("bus-riding", "bus", { busNumber: BUS_NUMBER, stopsLeft: BUS_STOPS_LIST.length });
  };

  const handleNextStop = () => {
    const next = stopsLeft - 1;
    if (next <= 0) {
      setPhase("bus-alighting");
      saveReturnStatus("bus-alighting", "bus", { busNumber: BUS_NUMBER });
    } else {
      setStopsLeft(next);
      saveReturnStatus("bus-riding", "bus", { busNumber: BUS_NUMBER, stopsLeft: next });
    }
  };

  const handleAlight = () => {
    setPhase("bus-walk-home");
    saveReturnStatus("bus-walk-home", "bus");
  };

  const handleArrivedHome = () => {
    setPhase("arrived");
    setIsSharingLocation(false);
    clearStatus();
  };

  const formatMin = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `약 ${m}분 ${s}초` : `${s}초`;
  };

  const currentStopIndex = BUS_STOPS_LIST.length - stopsLeft;
  const showSosButton = phase !== "consent" && phase !== "arrived" && phase !== "confirm";

  return (
    <main className="min-h-screen bg-[#f0faf4] text-slate-900">
      {/* Top bar */}
      {showSosButton && (
        <header className="sticky top-[113px] z-40 flex items-center justify-between gap-3 border-b border-emerald-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md lg:top-[65px]">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-black">집</span>
            <span className="text-base font-black text-slate-900">{studentName}의 안심귀가</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {location?.source === "gps" ? "위치 공유 중" : "위치 확인 중"}
            </span>
            <button
              type="button"
              onClick={() => setIsSosOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white font-black text-sm shadow-md hover:bg-red-700"
            >
              SOS
            </button>
          </div>
        </header>
      )}

      <div className="mx-auto max-w-md px-4 py-8">
        {showSosButton && (
          <>
            <LocationShareCard location={location} status={locationStatus} />
            {routePlan && (
              <SharedRouteCard plan={routePlan} location={location} />
            )}
          </>
        )}

        {/* CONSENT */}
        {phase === "consent" && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-5xl">
              🏠
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              내 위치를 엄마/아빠에게<br />알려줘도 될까요?
            </h1>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              길을 잃었을 때 도와주기 위한 거예요.<br />
              보호자만 볼 수 있어요.
            </p>
            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={handleConsent}
                className="w-full rounded-xl bg-emerald-600 py-5 text-xl font-black text-white hover:bg-emerald-700"
              >
                네, 좋아요
              </button>
              <Link
                href="/student/home"
                className="block w-full rounded-xl border border-slate-200 bg-white py-4 text-base font-black text-slate-700 hover:bg-slate-50 text-center"
              >
                아니요, 나중에 할게요
              </Link>
            </div>
          </div>
        )}

        {/* CONFIRM */}
        {phase === "confirm" && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-5xl">
              🏠
            </div>
            <h1 className="text-3xl font-black text-slate-900">집으로 갈까요?</h1>
            <p className="mt-3 text-base font-semibold text-slate-500">
              버튼을 누르면 길을 안내해 줄게요.
            </p>
            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full rounded-xl bg-emerald-600 py-5 text-xl font-black text-white hover:bg-emerald-700"
              >
                네, 집으로 갈래요
              </button>
              <Link
                href="/student/home"
                className="block w-full rounded-xl border border-slate-200 bg-white py-4 text-base font-black text-slate-700 hover:bg-slate-50 text-center"
              >
                아니요
              </Link>
            </div>
          </div>
        )}

        {/* FINDING LOCATION */}
        {phase === "finding" && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-4xl animate-pulse">
              📍
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              지금 있는 곳을 찾고 있어요
            </h1>
            <p className="mt-3 text-base font-semibold text-slate-500">잠시만 기다려요.</p>
            <div className="mt-6 flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-3 w-3 animate-bounce rounded-full bg-emerald-500"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* METHOD SELECT */}
        {phase === "method" && (
          <div>
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm">
              <span className="text-3xl">📍</span>
              <h1 className="mt-3 text-xl font-black text-slate-900">
                현재 위치를 찾았어요.<br />
                가장 쉬운 길을 찾았어요.
              </h1>
            </div>
            <div className="grid gap-4">
              <button
                type="button"
                onClick={() => handleMethod("bus")}
                className="relative w-full rounded-2xl border-2 border-sky-300 bg-sky-50 p-6 text-left shadow-sm hover:bg-sky-100"
              >
                <span className="absolute right-4 top-4 rounded-full bg-sky-500 px-3 py-1 text-xs font-black text-white">
                  추천
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-200 text-4xl">
                    🚌
                  </span>
                  <div>
                    <p className="text-xl font-black text-sky-900">버스 타고 가기</p>
                    <p className="mt-1 text-sm font-bold text-sky-700">
                      {BUS_NUMBER}번 버스 · 약 15분
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleMethod("walking")}
                className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-left shadow-sm hover:bg-emerald-100"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-200 text-4xl">
                    🚶
                  </span>
                  <div>
                    <p className="text-xl font-black text-emerald-900">걸어서 가기</p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">약 20분</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* WALKING NAVIGATION */}
        {phase === "walking" && (
          <div>
            <div className="mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-200">
              <span className="text-sm font-bold text-slate-600">
                걷는 중 · {walkIndex + 1}/{WALK_STEPS.length}단계
              </span>
              <span className="text-sm font-bold text-emerald-700">
                집까지 약 {(WALK_STEPS.length - walkIndex) * 3}분
              </span>
            </div>

            <div className="rounded-2xl border-2 border-emerald-300 bg-white p-8 shadow-sm text-center">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                지금 할 일
              </p>
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 text-7xl font-black text-emerald-700">
                {WALK_STEPS[walkIndex].arrow}
              </div>
              <h2 className="text-3xl font-black text-slate-900">
                {WALK_STEPS[walkIndex].main}
              </h2>
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3">
                <span className="text-2xl">{WALK_STEPS[walkIndex].icon}</span>
                <p className="text-base font-bold text-amber-900">
                  {WALK_STEPS[walkIndex].landmark}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={handleNextWalkStep}
                className="w-full rounded-xl bg-emerald-600 py-5 text-xl font-black text-white hover:bg-emerald-700"
              >
                {walkIndex < WALK_STEPS.length - 1 ? "다음" : "집에 도착했어요!"}
              </button>
              <button
                type="button"
                onClick={() => setIsSosOpen(true)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-base font-black text-slate-600 hover:bg-slate-50"
              >
                잘 모르겠어요
              </button>
            </div>

            {/* Step progress dots */}
            <div className="mt-6 flex justify-center gap-2">
              {WALK_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${i <= walkIndex ? "bg-emerald-500" : "bg-slate-200"}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* BUS: TO STOP */}
        {phase === "bus-to-stop" && (
          <div>
            <div className="mb-4 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-center">
              <p className="text-sm font-bold text-sky-700">
                {BUS_NUMBER}번 버스를 탈 거예요
              </p>
            </div>
            <div className="rounded-2xl border-2 border-sky-300 bg-white p-8 shadow-sm text-center">
              <span className="text-5xl">🚏</span>
              <h2 className="mt-4 text-2xl font-black text-slate-900">
                {BUS_STOP_NAME} 정류장으로 가요
              </h2>
              <p className="mt-3 text-base font-bold text-slate-600">
                걸어서 약 2분이에요
              </p>
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">
                <p className="text-sm font-bold text-amber-900">
                  💡 학교 정문 나와서 오른쪽으로 가요
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={handleAtStop}
                className="w-full rounded-xl bg-sky-600 py-5 text-xl font-black text-white hover:bg-sky-700"
              >
                정류장에 도착했어요
              </button>
              <button
                type="button"
                onClick={() => setIsSosOpen(true)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-base font-black text-slate-600 hover:bg-slate-50"
              >
                잘 모르겠어요
              </button>
            </div>
          </div>
        )}

        {/* BUS: WAITING */}
        {phase === "bus-waiting" && (
          <div>
            <div className="mb-4 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-center">
              <p className="text-sm font-bold text-sky-700">버스를 기다리는 중이에요</p>
            </div>
            <div className="rounded-2xl border-2 border-sky-300 bg-white p-8 shadow-sm text-center">
              <p className="text-sm font-black text-sky-600 mb-2">탈 버스</p>
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-sky-100">
                <span className="text-4xl font-black text-sky-800">{BUS_NUMBER}번</span>
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-900">
                {BUS_NUMBER}번 버스가 오고 있어요
              </h2>
              <p className="mt-2 text-3xl font-black text-sky-600">
                {formatMin(busCountdown)}
              </p>
              <p className="mt-3 text-sm font-bold text-slate-500">
                버스 앞 번호를 꼭 확인해요
              </p>
              {busCountdown <= 30 && (
                <div className="mt-4 rounded-xl bg-orange-100 px-4 py-3">
                  <p className="text-base font-black text-orange-900">
                    곧 탈 준비를 해요! 교통카드를 꺼내요
                  </p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsSosOpen(true)}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-3 text-base font-black text-slate-600 hover:bg-slate-50"
            >
              버스를 놓쳤어요
            </button>
          </div>
        )}

        {/* BUS: ARRIVED (BUS AT STOP) */}
        {phase === "bus-arrived" && (
          <div>
            <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-8 shadow-sm text-center animate-pulse">
              <span className="text-5xl">🚌</span>
              <h2 className="mt-4 text-3xl font-black text-orange-900">
                {BUS_NUMBER}번 버스가 왔어요!
              </h2>
              <p className="mt-3 text-base font-bold text-orange-700">
                교통카드를 꺼내요
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={handleBoardBus}
                className="w-full rounded-xl bg-orange-500 py-5 text-xl font-black text-white hover:bg-orange-600"
              >
                버스를 탔어요
              </button>
              <button
                type="button"
                onClick={() => setIsSosOpen(true)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-base font-black text-slate-600 hover:bg-slate-50"
              >
                잘 모르겠어요
              </button>
            </div>
          </div>
        )}

        {/* BUS: RIDING */}
        {phase === "bus-riding" && (
          <div>
            <div className="mb-4 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-bold text-sky-700">
                {BUS_NUMBER}번 버스 탑승 중
              </span>
              <span className="text-sm font-bold text-sky-900">
                {stopsLeft}정류장 뒤 내려요
              </span>
            </div>
            <div className="rounded-2xl border-2 border-sky-300 bg-white p-6 shadow-sm">
              <p className="text-center text-sm font-black text-slate-500 mb-4">정류장 안내</p>
              <div className="space-y-2">
                {BUS_STOPS_LIST.map((stop, i) => {
                  const passed = i < currentStopIndex;
                  const current = i === currentStopIndex;
                  const isHome = i === BUS_STOPS_LIST.length - 1;
                  return (
                    <div
                      key={stop}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                        isHome && !passed
                          ? "border-2 border-emerald-400 bg-emerald-50"
                          : passed
                          ? "bg-slate-100 opacity-50"
                          : current
                          ? "border-2 border-sky-400 bg-sky-50"
                          : "bg-slate-50"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${passed ? "bg-slate-400" : current ? "bg-sky-500 animate-pulse" : isHome ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className={`text-base font-black ${passed ? "text-slate-400" : isHome ? "text-emerald-800" : "text-slate-900"}`}>
                        {stop}
                        {isHome && " 🏠"}
                      </span>
                      {passed && <span className="ml-auto text-xs font-bold text-slate-400">지났어요</span>}
                      {current && <span className="ml-auto text-xs font-bold text-sky-600">지금 여기</span>}
                    </div>
                  );
                })}
              </div>

              {stopsLeft === 1 && (
                <div className="mt-4 rounded-xl bg-orange-100 px-4 py-3 text-center">
                  <p className="text-base font-black text-orange-900">
                    다음 정류장에서 내려요! 하차벨을 눌러요
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextStop}
              className="mt-4 w-full rounded-xl bg-sky-600 py-5 text-xl font-black text-white hover:bg-sky-700"
            >
              {stopsLeft === 1 ? "하차벨 눌렀어요" : "다음 정류장 지났어요"}
            </button>
          </div>
        )}

        {/* BUS: ALIGHTING */}
        {phase === "bus-alighting" && (
          <div>
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-8 shadow-sm text-center">
              <span className="text-5xl">🔔</span>
              <h2 className="mt-4 text-2xl font-black text-slate-900">
                다음 정류장에서 내려요
              </h2>
              <p className="mt-3 text-base font-bold text-emerald-800">
                하차벨을 눌러요
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                버스가 멈추면 차례로 내려요
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={handleAlight}
                className="w-full rounded-xl bg-emerald-600 py-5 text-xl font-black text-white hover:bg-emerald-700"
              >
                내렸어요!
              </button>
            </div>
          </div>
        )}

        {/* BUS: WALK HOME */}
        {phase === "bus-walk-home" && (
          <div>
            <div className="rounded-2xl border-2 border-emerald-300 bg-white p-8 shadow-sm text-center">
              <span className="text-5xl">🚶</span>
              <h2 className="mt-4 text-2xl font-black text-slate-900">
                잘 내렸어요!<br />이제 집까지 걸어가요
              </h2>
              <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3">
                <p className="text-base font-bold text-emerald-900">
                  → 아파트 입구로 걸어가요<br />
                  파란 간판이 보이면 다 왔어요
                </p>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-500">약 2분이에요</p>
            </div>
            <button
              type="button"
              onClick={handleArrivedHome}
              className="mt-4 w-full rounded-xl bg-emerald-600 py-5 text-xl font-black text-white hover:bg-emerald-700"
            >
              집에 도착했어요!
            </button>
          </div>
        )}

        {/* ARRIVED */}
        {phase === "arrived" && (
          <div className="rounded-2xl border-2 border-emerald-400 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-5xl">
              🏠
            </div>
            <h1 className="text-3xl font-black text-emerald-800">
              집에 도착했어요!
            </h1>
            <p className="mt-3 text-xl font-black text-slate-900">
              잘했어요, {studentName}!
            </p>
            <p className="mt-2 text-base font-semibold text-slate-600">
              보호자에게 도착 알림을 보냈어요.
            </p>
            <div className="mt-6 grid gap-3">
              <Link
                href="/student/home"
                className="block w-full rounded-xl bg-emerald-600 py-4 text-xl font-black text-white text-center hover:bg-emerald-700"
              >
                학생 홈으로 가기
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* SOS OVERLAY */}
      {isSosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border-2 border-red-300 bg-white p-8 shadow-2xl text-center">
            <h2 className="text-2xl font-black text-slate-900">괜찮아요.</h2>
            <p className="mt-2 text-xl font-bold text-slate-700">
              멈춰서 천천히 숨 쉬어요.
            </p>
            <p className="mt-1 text-base font-semibold text-slate-500">
              보호자에게 알렸어요.
            </p>

            <div className="mt-6 grid gap-3">
              <a
                href="tel:010-0000-0000"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-600 py-5 text-xl font-black text-white hover:bg-red-700"
              >
                📞 엄마/아빠에게 전화
              </a>
              <button
                type="button"
                onClick={() => {
                  saveReturnStatus("sos", method);
                  setIsSosOpen(false);
                }}
                className="w-full rounded-xl border-2 border-slate-300 bg-white py-4 text-base font-black text-slate-700 hover:bg-slate-50"
              >
                내 위치 보내기
              </button>
              <button
                type="button"
                className="w-full rounded-xl bg-amber-500 py-4 text-base font-black text-white hover:bg-amber-600"
                onClick={() => setIsSosOpen(false)}
              >
                <span className="block text-lg font-black">주변 어른에게 보여주기</span>
                <span className="block text-sm mt-1">화면을 어른에게 보여주세요</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSosOpen(false)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                돌아가기
              </button>
            </div>

            {/* Help card for nearby adults */}
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left">
              <p className="text-xs font-black text-amber-700 mb-2">어른분께 보여주는 화면</p>
              <p className="text-base font-black text-slate-900">도움이 필요해요.</p>
              <p className="text-base font-black text-slate-900">저는 길을 잃었어요.</p>
              <p className="text-sm font-bold text-slate-700 mt-1">보호자에게 연락해 주세요.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function LocationShareCard({
  location,
  status,
}: {
  location: LocationSnapshot | null;
  status: LocationStatus;
}) {
  const mapEmbedUrl = location ? getMapEmbedUrl(location) : null;
  const isBlocked = status === "insecure" || status === "denied" || status === "unavailable" || status === "unsupported";
  const statusText =
    status === "locating"
      ? "현재 위치를 찾고 있어요"
      : status === "insecure"
      ? "HTTPS 접속이 아니라 실제 위치를 받을 수 없어요"
      : status === "denied"
      ? "위치 권한이 거부되어 실제 위치를 받을 수 없어요"
      : status === "unsupported"
      ? "이 브라우저에서는 위치 기능을 사용할 수 없어요"
      : status === "unavailable"
      ? "위치 신호를 다시 기다리고 있어요"
      : location?.source === "gps"
      ? "보호자에게 실제 위치를 보내고 있어요"
      : location?.source === "demo"
      ? "실제 위치 대신 연습 위치를 표시하고 있어요"
      : "위치 신호를 기다리고 있어요";

  return (
    <section className={`mb-4 overflow-hidden rounded-2xl border bg-white shadow-sm ${isBlocked ? "border-amber-300" : "border-emerald-200"}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className={`text-xs font-black uppercase tracking-wider ${isBlocked ? "text-amber-700" : "text-emerald-700"}`}>
            Google Maps
          </p>
          <h2 className="text-base font-black text-slate-900">{statusText}</h2>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${isBlocked ? "bg-amber-100" : "bg-emerald-100"}`}>
          {isBlocked ? "!" : "📍"}
        </span>
      </div>

      {location ? (
        <>
          {mapEmbedUrl && (
            <div className="h-40 border-y border-emerald-100 bg-slate-100">
              <iframe
                title="안심귀가 현재 위치 Google 지도"
                src={mapEmbedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
          <div className="grid gap-2 px-4 py-3 text-sm font-bold text-slate-600">
            <p>
              {location.source === "gps" ? "GPS 실제 위치" : "연습 위치"}
              {location.accuracy ? ` · 정확도 약 ${location.accuracy}m` : ""}
            </p>
            {location.note && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-100">{location.note}</p>}
            {status === "insecure" && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700 ring-1 ring-slate-200">
                지금 주소처럼 HTTP IP로 접속하면 GPS 권한 창이 뜨지 않습니다. HTTPS 도메인으로 배포하거나, 테스트는 학생 기기에서 localhost가 아닌 HTTPS 주소로 열어야 해요.
              </p>
            )}
            <a
              href={getMapUrl(location)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-center font-black text-white hover:bg-emerald-700"
            >
              Google 지도 열기
            </a>
          </div>
        </>
      ) : (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-5 text-sm font-bold leading-6 text-emerald-900">
          위치 권한 창이 뜨면 허용을 눌러 주세요. 실제 학생 위치를 보내려면 HTTPS 주소에서 접속해야 해요.
        </div>
      )}
    </section>
  );
}

function SharedRouteCard({
  plan,
  location,
}: {
  plan: RoutePlan;
  location: LocationSnapshot | null;
}) {
  const embedUrl = getGoogleDirectionsEmbedUrl(plan, location);
  const directionsUrl = getGoogleDirectionsUrl(plan, location);
  const routeItems = ["지금 있는 곳", ...plan.waypoints, getRouteDestination(plan)];

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-sky-700">
            보호자 경로
          </p>
          <h2 className="text-base font-black text-slate-900">
            정해준 길을 보며 갈 수 있어요
          </h2>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xl">
          🧭
        </span>
      </div>

      {embedUrl && (
        <div className="h-48 border-y border-sky-100 bg-slate-100">
          <iframe
            title="보호자 경로 Google 지도"
            src={embedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      <div className="grid gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sky-50 px-3 py-2 ring-1 ring-sky-100">
          <p className="text-sm font-black text-sky-900">
            {getTravelModeLabel(plan.travelMode)}
          </p>
          <p className="text-xs font-bold text-sky-700">
            {plan.updatedAt}
          </p>
        </div>

        <div className="grid gap-2">
          {routeItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 ring-1 ring-slate-200"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                index === routeItems.length - 1
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-sky-100 text-sky-800"
              }`}
              >
                {index === routeItems.length - 1 ? "집" : index + 1}
              </span>
              <p className="min-w-0 break-words text-sm font-black text-slate-800">
                {item}
              </p>
            </div>
          ))}
        </div>

        {plan.note && (
          <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm font-bold leading-6 text-amber-900 ring-1 ring-amber-100">
            {plan.note}
          </p>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-center text-base font-black text-white hover:bg-sky-700"
        >
          Google 지도에서 길 보기
        </a>
      </div>
    </section>
  );
}
