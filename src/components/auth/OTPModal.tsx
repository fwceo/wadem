'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

interface OTPModalProps {
  isOpen: boolean;
  phone: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onClose: () => void;
  error?: string;
  loading?: boolean;
}

const RESEND_COOLDOWN = 30; // seconds

export default function OTPModal({ isOpen, phone, onVerify, onResend, onClose, error, loading }: OTPModalProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (!isOpen) return;
    setResendTimer(RESEND_COOLDOWN);
    setDigits(['', '', '', '']);
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }
  }, [isOpen]);

  const handleDigitChange = useCallback((index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3) {
      const code = newDigits.join('');
      if (code.length === 4) {
        onVerify(code);
      }
    }
  }, [digits, onVerify]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs.current[3]?.focus();
      onVerify(pasted);
    }
  }, [onVerify]);

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsResending(true);
    try {
      await onResend();
      setResendTimer(RESEND_COOLDOWN);
      setDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl max-w-lg mx-auto"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="px-6 pt-6 pb-8">
              <h2 className="text-xl font-extrabold text-secondary mb-1">Enter the 4-digit code</h2>
              <p className="text-sm text-text-secondary mb-6">
                Your code was sent to <span className="font-semibold text-secondary">{phone}</span>
              </p>

              {/* 4-digit OTP boxes */}
              <div className="flex justify-center gap-3 mb-4">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-colors ${
                      digit
                        ? 'border-primary bg-primary/5 text-secondary'
                        : 'border-gray-200 bg-white text-secondary'
                    } focus:border-primary focus:ring-2 focus:ring-primary/20`}
                  />
                ))}
              </div>

              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-error text-sm text-center mb-4"
                >
                  {error}
                </motion.p>
              )}

              {/* Resend */}
              <div className="text-center mb-6">
                {resendTimer > 0 ? (
                  <p className="text-sm text-text-secondary">
                    Didn&apos;t receive a code? <span className="text-text-tertiary">Resend ({resendTimer}s)</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    {isResending ? 'Sending...' : 'Resend code'}
                  </button>
                )}
              </div>

              {/* Verify button */}
              <Button
                fullWidth
                size="lg"
                onClick={() => {
                  const code = digits.join('');
                  if (code.length === 4) onVerify(code);
                }}
                loading={loading}
                disabled={digits.join('').length < 4}
              >
                Verify
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
