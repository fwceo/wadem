'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useUIStore } from '@/stores/ui';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Recommendation[];
}

interface Recommendation {
  restaurantId: string;
  restaurantName: string;
  restaurantLogo?: string;
  itemId: string;
  itemName: string;
  price: number;
  deliveryTime: string;
  rating: number;
  reason: string;
  tag: string;
}

const quickPrompts = [
  'Something quick and cheap',
  'Best burger nearby',
  'Best rated near me',
  "I'm feeling adventurous",
  'Pizza for the team',
  'Shawarma or kebab',
];

export default function AIChat() {
  const router = useRouter();
  const { isAIOpen, closeAI } = useUIStore();
  const user = useUserStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            userName: user?.name || '',
            currentTime: new Date().toLocaleTimeString(),
          },
        }),
      });
      const data = await res.json();

      const aiMessage: Message = {
        role: 'assistant',
        content: data.message || "Here are some options for you!",
        recommendations: data.recommendations || [],
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that. Try again!",
      }]);
    }

    setIsTyping(false);
  };

  const handleGoToRestaurant = (rec: Recommendation) => {
    closeAI();
    router.push(`/restaurant/${rec.restaurantId}`);
  };

  return (
    <BottomSheet isOpen={isAIOpen} onClose={closeAI} height="85vh">
      <div className="flex flex-col" style={{ height: 'calc(85vh - 40px)' }}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm">🧑‍🍳</span>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-text-primary">Wadem AI</h3>
            <p className="text-[11px] text-text-secondary">Your personal food concierge</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <span className="text-5xl block mb-3">✨</span>
              <h3 className="text-lg font-bold text-text-primary mb-1">
                Hey{user?.name ? ` ${user.name}` : ''}! What are you craving?
              </h3>
              <p className="text-sm text-text-secondary">
                I&apos;ll find the perfect meal for you
              </p>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`${
                  msg.role === 'user'
                    ? 'max-w-[85%] bg-primary text-white rounded-2xl rounded-br-md px-4 py-2.5'
                    : 'w-full space-y-2'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5">
                    <p className="text-sm text-text-primary">{msg.content}</p>
                  </div>
                )}
                {msg.role === 'user' && (
                  <p className="text-sm">{msg.content}</p>
                )}
                {msg.recommendations?.map((rec, ri) => (
                  <motion.div
                    key={`${rec.restaurantId}-${ri}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: ri * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGoToRestaurant(rec)}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Merchant logo */}
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-gray-100">
                        {rec.restaurantLogo ? (
                          <Image
                            src={rec.restaurantLogo}
                            alt={rec.restaurantName}
                            width={44}
                            height={44}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg text-gray-300">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded">
                            {rec.tag}
                          </span>
                        </div>
                        <p className="text-[13px] font-bold text-text-primary truncate">
                          {rec.restaurantName}
                        </p>
                        {rec.itemName && (
                          <p className="text-xs text-text-secondary truncate">{rec.itemName}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-text-secondary">
                          {rec.rating > 0 && <span>⭐ {rec.rating}</span>}
                          <span>🕐 {rec.deliveryTime}</span>
                          {rec.price > 0 && (
                            <span className="font-semibold text-text-primary">
                              {formatPrice(rec.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🧑‍🍳</span>
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-1">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <div className="flex-shrink-0 px-4 pb-2">
            <div className="flex flex-wrap gap-2 pb-2">
              {quickPrompts.map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-xs"
                />
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="What are you in the mood for?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" size="sm" disabled={!input.trim() || isTyping}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </form>
        </div>
      </div>
    </BottomSheet>
  );
}
