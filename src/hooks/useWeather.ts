'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/user';
import { useUIStore } from '@/stores/ui';

export interface WeatherData {
  condition: string;
  description: string;
  temp: number;
  icon: string;
  sunrise: number;
  sunset: number;
}

const OPENWEATHER_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';
const CACHE_KEY = 'wadem-weather';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Erbil default coords — fallback when user has no address
const ERBIL_LAT = 36.191;
const ERBIL_LNG = 44.009;

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useUserStore((s) => s.user);
  const setDarkMode = useUIStore((s) => s.setDarkMode);

  useEffect(() => {
    const lat = (user?.address?.lat && user.address.lat !== 0) ? user.address.lat : ERBIL_LAT;
    const lng = (user?.address?.lng && user.address.lng !== 0) ? user.address.lng : ERBIL_LNG;

    if (!OPENWEATHER_KEY) {
      setLoading(false);
      return;
    }

    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setWeather(data);
          updateDarkMode(data.sunrise, data.sunset);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    // Fetch fresh data
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHER_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.weather?.[0]) {
          const w: WeatherData = {
            condition: data.weather[0].main,
            description: data.weather[0].description,
            temp: Math.round(data.main.temp),
            icon: data.weather[0].icon,
            sunrise: data.sys.sunrise,
            sunset: data.sys.sunset,
          };
          setWeather(w);
          updateDarkMode(w.sunrise, w.sunset);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: w, ts: Date.now() }));
          } catch { /* ignore */ }
        }
      })
      .catch(() => { /* silent fail */ })
      .finally(() => setLoading(false));

    function updateDarkMode(sunrise: number, sunset: number) {
      const now = Math.floor(Date.now() / 1000);
      const isDark = now < sunrise || now > sunset;
      setDarkMode(isDark);
    }
  }, [user?.address?.lat, user?.address?.lng, setDarkMode]);

  const timeOfDay = getTimeOfDay();

  return { weather, loading, timeOfDay };
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
