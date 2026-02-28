'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUserStore } from '@/stores/user';
import { HomeIcon, ApartmentIcon, OfficeIcon, PinIcon } from '@/components/icons/ThemedIcons';

const MapPicker = dynamic(() => import('@/components/ui/MapPicker'), { ssr: false });

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setName, setAddress, addSavedAddress } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'name' | 'location'>('name');

  // After Zustand hydrates, skip name step if user has a name
  useEffect(() => {
    setMounted(true);
    if (user?.name) setStep('location');
  }, [user?.name]);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [addressTitle, setAddressTitle] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [addressType, setAddressType] = useState<'home' | 'apartment' | 'office' | 'other'>('home');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [unit, setUnit] = useState('');
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number; formatted: string } | null>(null);
  const [mapAccuracy, setMapAccuracy] = useState(15);

  const handleNameSubmit = () => {
    if (!nameInput.trim()) return;
    setName(nameInput.trim());
    setStep('location');
  };

  const handleConfirmAddress = () => {
    const formatted = mapLocation?.formatted || addressInput || `${building}, Floor ${floor || '1'}`;
    if (!formatted.trim() && !building.trim() && !mapLocation) return;
    if (mapLocation && mapAccuracy < 80) return;

    const addressData = {
      formatted,
      lat: mapLocation?.lat || 0,
      lng: mapLocation?.lng || 0,
      building,
      floor,
      unit,
      addressType,
    };

    // Set as active delivery address
    setAddress(addressData);

    // Also save to saved addresses list
    const label = addressTitle.trim() || (addressType === 'home' ? 'Home' : addressType === 'office' ? 'Office' : addressType === 'apartment' ? 'Apartment' : 'Address');
    addSavedAddress({
      id: Date.now().toString(),
      label,
      ...addressData,
      isDefault: true,
    });

    router.push('/');
  };

  const hasValidAddress = !!(mapLocation && mapAccuracy >= 80);

  return (
    <div className="relative min-h-screen flex flex-col items-center px-6 pt-16 pb-10 overflow-hidden">
      {/* Background — warm gradient with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-primary-dark z-0" />
      <div className="absolute inset-0 z-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #111 1px, transparent 1px), radial-gradient(circle at 70% 80%, #111 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <AnimatePresence mode="wait">
        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="relative z-10 w-full max-w-sm login-entrance"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl text-center">
              <h1 className="text-[28px] font-extrabold text-secondary mb-2">
                What should we call you?
              </h1>
              <p className="text-text-secondary text-[15px] mb-8">
                Just your first name is fine
              </p>
              <Input
                placeholder="Your name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-lg py-4 text-center mb-4"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              />
              <Button fullWidth size="lg" onClick={handleNameSubmit} disabled={!nameInput.trim()}>
                Get Started
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'location' && (
          <motion.div
            key="location"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="relative z-10 w-full max-w-md login-entrance"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl">
              <div className="text-center mb-4">
                <h1 className="text-[28px] font-extrabold text-secondary mb-2">
                  Where should we deliver?
                </h1>
                <p className="text-text-secondary text-[15px]">
                  Pick your location on the map or search
                </p>
              </div>

              <div className="space-y-3 text-left">
                {/* Map instruction */}
                <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2">
                  <span className="text-lg">📍</span>
                  <p className="text-sm font-medium text-secondary">
                    {mapLocation ? 'Pin set! You can tap again to move it.' : 'Tap the map to drop your delivery pin'}
                  </p>
                </div>
                {/* Map Picker */}
                <MapPicker
                  onLocationSelect={(loc) => {
                    setMapLocation(loc);
                    setAddressInput(loc.formatted);
                  }}
                  onAccuracyChange={(percent) => setMapAccuracy(percent)}
                />

                {/* Accuracy warning */}
                {mapLocation && mapAccuracy < 80 && (
                  <div className="flex items-center gap-2 bg-error/10 rounded-xl px-3 py-2">
                    <span className="text-sm">⚠️</span>
                    <p className="text-xs font-medium text-error">
                      Zoom in more for at least 80% accuracy to confirm your address
                    </p>
                  </div>
                )}

                {/* Address Title */}
                <Input
                  placeholder="Address title (e.g. My Home, Work)"
                  value={addressTitle}
                  onChange={(e) => setAddressTitle(e.target.value)}
                />

                {/* Address Type Selector */}
                <div className="grid grid-cols-4 gap-2">
                  {(['home', 'apartment', 'office', 'other'] as const).map((type) => {
                    const icons = { home: <HomeIcon size={22} />, apartment: <ApartmentIcon size={22} />, office: <OfficeIcon size={22} />, other: <PinIcon size={22} /> };
                    const labels = { home: 'Home', apartment: 'Apt', office: 'Office', other: 'Other' };
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressType(type)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                          addressType === type
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span>{icons[type]}</span>
                        <span className={`text-xs font-medium ${addressType === type ? 'text-primary-dark' : 'text-text-secondary'}`}>
                          {labels[type]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Input
                  placeholder="Building / Complex name"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                />
                <div className="flex gap-3">
                  <Input
                    placeholder="Floor"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                  />
                  <Input
                    placeholder={addressType === 'office' ? 'Desk / Room #' : 'Unit / Door #'}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleConfirmAddress}
                  disabled={!hasValidAddress}
                >
                  Confirm Address
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
