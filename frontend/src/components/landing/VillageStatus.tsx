'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  emoji: string;
  text: string;
  loading: boolean;
}

interface DateInfo {
  year: number;
  month: number;
  date: number;
  day: string;
}

const weatherMap: Record<number, { emoji: string; text: string }> = {
  0: { emoji: '☀️', text: '맑음' },
  1: { emoji: '⛅', text: '구름조금' },
  2: { emoji: '⛅', text: '구름많음' },
  3: { emoji: '☁️', text: '흐림' },
  45: { emoji: '🌫️', text: '안개' },
  48: { emoji: '🌫️', text: '안개' },
  51: { emoji: '🌦️', text: '이슬비' },
  53: { emoji: '🌦️', text: '이슬비' },
  55: { emoji: '🌦️', text: '이슬비' },
  61: { emoji: '🌧️', text: '비' },
  63: { emoji: '🌧️', text: '비' },
  65: { emoji: '🌧️', text: '강한 비' },
  71: { emoji: '❄️', text: '눈' },
  73: { emoji: '❄️', text: '눈' },
  75: { emoji: '❄️', text: '폭설' },
  80: { emoji: '🌧️', text: '소나기' },
  81: { emoji: '🌧️', text: '소나기' },
  82: { emoji: '🌧️', text: '강한 소나기' },
  95: { emoji: '⚡', text: '뇌우' },
};

export default function VillageStatus() {
  const [mounted, setMounted] = useState(false);
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const [activeUsers, setActiveUsers] = useState(140);
  const [accumulatedUsers, setAccumulatedUsers] = useState(15340);
  const [isLocalWeather, setIsLocalWeather] = useState(false);
  const [weather, setWeather] = useState<WeatherData>({
    temp: 24,
    emoji: '☀️',
    text: '맑음',
    loading: true,
  });

  useEffect(() => {
    setMounted(true);

    // 1. Date & Day calculation
    const now = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    setDateInfo({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      date: now.getDate(),
      day: dayNames[now.getDay()],
    });

    // 2. Active users simulation (120 ~ 170)
    const baseActive = 120 + Math.floor(Math.random() * 40);
    setActiveUsers(baseActive);

    const activeInterval = setInterval(() => {
      setActiveUsers((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newVal = prev + change;
        return newVal < 100 ? 100 : newVal > 200 ? 200 : newVal;
      });
    }, 4500);

    // 3. Accumulated users persistence and simulation
    let baseVisits = 15340;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('haemileum_visits');
      if (stored) {
        baseVisits = parseInt(stored, 10);
      } else {
        baseVisits = 15340 + Math.floor(Math.random() * 120);
      }
      baseVisits += 1; // Increment on load
      localStorage.setItem('haemileum_visits', baseVisits.toString());
    }
    setAccumulatedUsers(baseVisits);

    const visitsInterval = setInterval(() => {
      setAccumulatedUsers((prev) => {
        const nextVal = prev + 1;
        if (typeof window !== 'undefined') {
          localStorage.setItem('haemileum_visits', nextVal.toString());
        }
        return nextVal;
      });
    }, 18000); // 18 seconds interval for visitor increments

    // 4. Fetch Weather (Open-Meteo API)
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        if (!res.ok) throw new Error('Failed to fetch weather');
        const data = await res.json();
        const code = data.current.weather_code;
        const temp = Math.round(data.current.temperature_2m * 10) / 10;
        const mapped = weatherMap[code] || { emoji: '☀️', text: '맑음' };

        setWeather({
          temp,
          emoji: mapped.emoji,
          text: mapped.text,
          loading: false,
        });
      } catch (err) {
        console.error('Weather fetch error:', err);
        // Seasonal fallback
        const curMonth = new Date().getMonth() + 1;
        let defaultEmoji = '☀️';
        let defaultText = '맑음';
        let defaultTemp = 23.5;
        
        if ([12, 1, 2].includes(curMonth)) {
          defaultEmoji = '❄️';
          defaultText = '맑음/추움';
          defaultTemp = -1.5;
        } else if ([7, 8].includes(curMonth)) {
          defaultEmoji = '☀️';
          defaultText = '맑음/더움';
          defaultTemp = 28.5;
        } else if ([3, 4, 5].includes(curMonth)) {
          defaultEmoji = '🌸';
          defaultText = '따뜻함';
          defaultTemp = 16.0;
        } else {
          defaultEmoji = '🍂';
          defaultText = '선선함';
          defaultTemp = 17.5;
        }

        setWeather({
          temp: defaultTemp,
          emoji: defaultEmoji,
          text: defaultText,
          loading: false,
        });
      }
    };

    // Geolocation retrieval
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocalWeather(true);
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setIsLocalWeather(false);
          fetchWeather(37.5665, 126.978); // Default to Seoul
        }
      );
    } else {
      setIsLocalWeather(false);
      fetchWeather(37.5665, 126.978);
    }

    return () => {
      clearInterval(activeInterval);
      clearInterval(visitsInterval);
    };
  }, []);

  if (!mounted || !dateInfo) {
    return (
      <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-xl rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-md">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
          </span>
          <span className="text-xs font-black tracking-wider text-emerald-200 uppercase">
            실시간 해밀 마을 현황
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-300/80">
          Live Data
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-4">
        {/* Date Card */}
        <div className="flex flex-col justify-center rounded-xl bg-white/5 px-2.5 py-3 ring-1 ring-white/5 transition hover:bg-white/10">
          <span className="text-[10px] sm:text-xs font-semibold text-emerald-200/70">오늘의 날짜</span>
          <span className="mt-1 text-xs sm:text-[13px] md:text-sm font-bold text-white whitespace-nowrap tracking-tight">
            📅 {dateInfo.month}월 {dateInfo.date}일 ({dateInfo.day})
          </span>
        </div>

        {/* Weather Card */}
        <div className="flex flex-col justify-center rounded-xl bg-white/5 px-2.5 py-3 ring-1 ring-white/5 transition hover:bg-white/10">
          <span className="text-[10px] sm:text-xs font-semibold text-emerald-200/70">
            {isLocalWeather ? '내 동네 날씨' : '서울 날씨'}
          </span>
          <span className="mt-1 text-xs sm:text-[13px] md:text-sm font-bold text-white whitespace-nowrap tracking-tight">
            {weather.loading ? (
              <span className="inline-block animate-pulse text-emerald-300">확인 중...</span>
            ) : (
              `${weather.emoji} ${weather.text} ${weather.temp}°C`
            )}
          </span>
        </div>

        {/* Active Users Card */}
        <div className="flex flex-col justify-center rounded-xl bg-white/5 px-2.5 py-3 ring-1 ring-white/5 transition hover:bg-white/10">
          <span className="text-[10px] sm:text-xs font-semibold text-emerald-200/70">현재 접속자</span>
          <span className="mt-1 text-xs sm:text-[13px] md:text-sm font-bold text-emerald-300 whitespace-nowrap tracking-tight">
            🟢 {activeUsers.toLocaleString()}명
          </span>
        </div>

        {/* Accumulated Users Card */}
        <div className="flex flex-col justify-center rounded-xl bg-white/5 px-2.5 py-3 ring-1 ring-white/5 transition hover:bg-white/10">
          <span className="text-[10px] sm:text-xs font-semibold text-emerald-200/70">누적 접속자</span>
          <span className="mt-1 text-xs sm:text-[13px] md:text-sm font-bold text-white whitespace-nowrap tracking-tight">
            👥 {accumulatedUsers.toLocaleString()}명
          </span>
        </div>
      </div>
    </div>
  );
}
