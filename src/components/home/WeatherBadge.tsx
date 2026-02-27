'use client';

import { useWeather, getTimeOfDay } from '@/hooks/useWeather';

const WEATHER_ICONS: Record<string, string> = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
  Haze: '🌫️',
  Dust: '🌪️',
  Sand: '🌪️',
};

const TIME_OF_DAY_META: Record<string, { icon: string; label: string }> = {
  morning: { icon: '🌅', label: 'Good morning' },
  afternoon: { icon: '☀️', label: 'Good afternoon' },
  evening: { icon: '🌇', label: 'Good evening' },
  night: { icon: '🌙', label: 'Good night' },
};

export default function WeatherBadge() {
  const { weather, loading } = useWeather();
  const timeOfDay = getTimeOfDay();

  if (loading) return null;

  // If we have weather data, show full badge
  if (weather) {
    const icon = WEATHER_ICONS[weather.condition] || '🌤️';
    return (
      <div className="inline-flex items-center gap-1.5 bg-secondary/15 backdrop-blur-sm rounded-full px-3 py-1 animate-fade-in-up">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold text-secondary">
          {weather.temp}°C
        </span>
        <span className="text-[10px] text-secondary/60 capitalize">
          {weather.description}
        </span>
      </div>
    );
  }

  // Fallback: show time-of-day badge when no API key
  const tod = TIME_OF_DAY_META[timeOfDay];
  return (
    <div className="inline-flex items-center gap-1.5 bg-secondary/15 backdrop-blur-sm rounded-full px-3 py-1 animate-fade-in-up">
      <span className="text-sm">{tod.icon}</span>
      <span className="text-xs font-semibold text-secondary">
        {tod.label}
      </span>
    </div>
  );
}
