'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '@/stores/user';
import { useWeather, getTimeOfDay } from '@/hooks/useWeather';

const REFRESH_INTERVAL = 45_000; // 45 seconds

export default function TypewriterGreeting() {
  const user = useUserStore((s) => s.user);
  const { weather } = useWeather();
  const [displayText, setDisplayText] = useState('');
  const [fullText, setFullText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const mountedRef = useRef(false);

  const fetchGreeting = useCallback(() => {
    const timeOfDay = getTimeOfDay();

    fetch('/api/ai/greeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: user?.name || null,
        timeOfDay,
        weatherCondition: weather?.condition || undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.greeting) {
          setFullText(data.greeting);
          setIsTyping(true);
        }
      })
      .catch(() => {
        const name = user?.name || 'Guest';
        const fallback =
          timeOfDay === 'morning'
            ? `Good morning, ${name}!`
            : timeOfDay === 'afternoon'
            ? `Hey ${name}! Time to fuel up.`
            : timeOfDay === 'evening'
            ? `Evening, ${name}!`
            : `Late craving, ${name}?`;
        setFullText(fallback);
        setIsTyping(true);
      });
  }, [user?.name, weather?.condition]);

  // Fetch on mount + refresh every REFRESH_INTERVAL
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchGreeting();
    }

    const interval = setInterval(fetchGreeting, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchGreeting]);

  // Typewriter effect
  useEffect(() => {
    if (!isTyping || !fullText) return;

    let i = 0;
    setDisplayText('');
    const interval = setInterval(() => {
      i++;
      setDisplayText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [isTyping, fullText]);

  if (!fullText && !displayText) return null;

  return (
    <div className="animate-fade-in-up h-6 overflow-hidden">
      <p className="text-[15px] md:text-base font-medium text-secondary/80 leading-6 truncate">
        {displayText}
        {isTyping && (
          <span className="inline-block w-[2px] h-4 bg-secondary/60 ml-0.5 align-middle animate-pulse" />
        )}
      </p>
    </div>
  );
}
