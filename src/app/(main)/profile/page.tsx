'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BottomSheet from '@/components/ui/BottomSheet';
import { useUserStore } from '@/stores/user';
import { useUIStore } from '@/stores/ui';
import { SavedAddress } from '@/types/user';
import {
  HomeIcon, ApartmentIcon, OfficeIcon, PinIcon,
  FoodPrefsIcon, NotificationIcon, GlobeIcon, TermsIcon, SupportIcon,
} from '@/components/icons/ThemedIcons';

const MapPicker = dynamic(() => import('@/components/ui/MapPicker'), { ssr: false });

const ADDRESS_TYPE_META = {
  home: { icon: <HomeIcon size={22} />, label: 'Home' },
  apartment: { icon: <ApartmentIcon size={22} />, label: 'Apt' },
  office: { icon: <OfficeIcon size={22} />, label: 'Office' },
  other: { icon: <PinIcon size={22} />, label: 'Other' },
};

const DIETARY_OPTIONS = [
  'Halal', 'Vegetarian', 'Vegan', 'Gluten-Free',
  'Dairy-Free', 'Nut-Free', 'Low Carb', 'Keto',
];

const CUISINE_PREFS = [
  'Kurdish', 'Arabic', 'Turkish', 'Italian', 'American',
  'Asian', 'Indian', 'Mexican', 'Healthy', 'Fast Food',
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateProfile, addSavedAddress, removeSavedAddress, setDefaultAddress } = useUserStore();
  const { addToast } = useUIStore();

  // Edit profile sheet
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Add address sheet
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrType, setNewAddrType] = useState<'home' | 'apartment' | 'office' | 'other'>('home');
  const [newAddrBuilding, setNewAddrBuilding] = useState('');
  const [newAddrFloor, setNewAddrFloor] = useState('');
  const [newAddrUnit, setNewAddrUnit] = useState('');
  const [newAddrMap, setNewAddrMap] = useState<{ lat: number; lng: number; formatted: string } | null>(null);
  const [newAddrDefault, setNewAddrDefault] = useState(false);

  // Preferences sheet
  const [showPrefsSheet, setShowPrefsSheet] = useState(false);

  // Settings
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const savedAddresses = user?.savedAddresses || [];

  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setEditEmail(user?.email || '');
    setShowEditProfile(true);
  };

  const handleSaveProfile = () => {
    updateProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
    });
    setShowEditProfile(false);
    addToast({ type: 'success', message: 'Profile updated' });
  };

  const resetAddressForm = () => {
    setNewAddrLabel('');
    setNewAddrType('home');
    setNewAddrBuilding('');
    setNewAddrFloor('');
    setNewAddrUnit('');
    setNewAddrMap(null);
    setNewAddrDefault(false);
  };

  const handleAddAddress = () => {
    const formatted = newAddrMap?.formatted || `${newAddrBuilding}, Floor ${newAddrFloor || '1'}`;
    if (!formatted.trim() && !newAddrBuilding.trim() && !newAddrMap) return;

    const addr: SavedAddress = {
      id: Date.now().toString(),
      label: newAddrLabel.trim() || ADDRESS_TYPE_META[newAddrType].label,
      formatted,
      lat: newAddrMap?.lat || 0,
      lng: newAddrMap?.lng || 0,
      building: newAddrBuilding,
      floor: newAddrFloor,
      unit: newAddrUnit,
      addressType: newAddrType,
      isDefault: newAddrDefault || savedAddresses.length === 0,
    };
    addSavedAddress(addr);
    setShowAddAddress(false);
    resetAddressForm();
    addToast({ type: 'success', message: 'Address added' });
  };

  const handleTogglePref = (pref: string, type: 'preferences' | 'dietaryRestrictions') => {
    const current = user?.[type] || [];
    const updated = current.includes(pref)
      ? current.filter((p) => p !== pref)
      : [...current, pref];
    updateProfile({ [type]: updated });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="px-4 pt-4 pb-24">
      <h1 className="text-[28px] font-extrabold text-text-primary mb-5">Profile</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* ─── User Card ─── */}
        <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-secondary">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-primary truncate">{user?.name || 'Guest'}</h2>
            <p className="text-sm text-text-secondary truncate">{user?.email || user?.phone || 'Not signed in'}</p>
            {user?.phone && user?.email && (
              <p className="text-xs text-text-tertiary truncate">{user.phone}</p>
            )}
          </div>
          <button
            onClick={openEditProfile}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xl font-extrabold text-secondary">{user?.totalOrders || 0}</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Orders</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xl font-extrabold text-secondary">
              {Math.round((user?.totalSpent || 0) / 1000)}K
            </p>
            <p className="text-[11px] text-text-secondary mt-0.5">IQD spent</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xl font-extrabold text-secondary">{savedAddresses.length}</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Addresses</p>
          </div>
        </div>

        {/* ─── Saved Addresses ─── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="text-[15px] font-bold text-text-primary">Saved Addresses</h3>
            <button
              onClick={() => { resetAddressForm(); setShowAddAddress(true); }}
              className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              + Add
            </button>
          </div>
          {savedAddresses.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <span className="text-3xl block mb-2">📍</span>
              <p className="text-sm text-text-secondary">No saved addresses yet</p>
              <button
                onClick={() => { resetAddressForm(); setShowAddAddress(true); }}
                className="text-sm font-semibold text-primary mt-2"
              >
                Add your first address
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex-shrink-0">
                    {ADDRESS_TYPE_META[addr.addressType || 'other'].icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary truncate">{addr.label}</p>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">DEFAULT</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate">{addr.formatted}</p>
                    {addr.building && (
                      <p className="text-[11px] text-text-tertiary truncate">
                        {addr.building}{addr.floor ? `, Floor ${addr.floor}` : ''}{addr.unit ? `, ${addr.unit}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => { setDefaultAddress(addr.id); addToast({ type: 'info', message: 'Default address updated' }); }}
                        className="text-xs text-primary font-medium px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => { removeSavedAddress(addr.id); addToast({ type: 'info', message: 'Address removed' }); }}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors text-text-tertiary hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Food Preferences ─── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowPrefsSheet(true)}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <div className="flex items-center gap-3">
              <FoodPrefsIcon size={22} />
              <div className="text-left">
                <p className="text-[15px] font-semibold text-text-primary">Food Preferences</p>
                <p className="text-xs text-text-secondary">
                  {(user?.preferences?.length || 0) + (user?.dietaryRestrictions?.length || 0) > 0
                    ? [...(user?.preferences || []), ...(user?.dietaryRestrictions || [])].slice(0, 3).join(', ')
                      + ((user?.preferences?.length || 0) + (user?.dietaryRestrictions?.length || 0) > 3 ? '...' : '')
                    : 'Set your dietary needs & cuisines'}
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ─── Referral Code ─── */}
        <div className="bg-secondary rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary">Your Referral Code</h3>
              <p className="text-2xl font-extrabold mt-1">{user?.referralCode || 'N/A'}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user?.referralCode || '');
                addToast({ type: 'success', message: 'Referral code copied!' });
              }}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-white/60 mt-2">Share with coworkers — both get 10,000 IQD off!</p>
        </div>

        {/* ─── Settings Section ─── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <NotificationIcon size={22} />
            <span className="text-[15px] font-medium text-text-primary flex-1 text-left">Notifications</span>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <GlobeIcon size={22} />
            <span className="text-[15px] font-medium text-text-primary flex-1 text-left">Language</span>
            <span className="text-sm text-text-secondary mr-1">English</span>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <TermsIcon size={22} />
            <span className="text-[15px] font-medium text-text-primary flex-1 text-left">Terms & Privacy</span>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <SupportIcon size={22} />
            <span className="text-[15px] font-medium text-text-primary flex-1 text-left">Help & Support</span>
            <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ─── Sign Out + Delete ─── */}
        <div className="space-y-2">
          <Button variant="secondary" fullWidth onClick={handleLogout}>
            Sign Out
          </Button>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-center text-sm text-red-400 hover:text-red-500 py-2 transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 rounded-xl p-3 flex items-center justify-between overflow-hidden"
            >
              <span className="text-sm text-red-700">Are you sure?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-sm font-medium text-text-secondary px-3 py-1 rounded-lg bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { handleLogout(); addToast({ type: 'info', message: 'Account deleted' }); }}
                  className="text-sm font-medium text-white px-3 py-1 rounded-lg bg-red-500"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* App version */}
        <p className="text-center text-xs text-text-tertiary pb-4">
          Wadem v1.0.0
        </p>
      </motion.div>

      {/* ─── Edit Profile Bottom Sheet ─── */}
      <BottomSheet isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1 block">Full Name</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1 block">Email</label>
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="Email address"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1 block">Phone</label>
            <Input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+964 xxx xxx xxxx"
            />
          </div>
          <Button fullWidth size="lg" onClick={handleSaveProfile} disabled={!editName.trim()}>
            Save Changes
          </Button>
        </div>
      </BottomSheet>

      {/* ─── Add Address Bottom Sheet ─── */}
      <BottomSheet isOpen={showAddAddress} onClose={() => setShowAddAddress(false)} title="Add Address">
        <div className="px-4 py-4 space-y-3">
          {/* Map instruction — matches onboarding flow */}
          <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2">
            <span className="text-lg">📍</span>
            <p className="text-sm font-medium text-secondary">
              {newAddrMap ? 'Pin set! You can tap again to move it.' : 'Tap the map to drop your delivery pin'}
            </p>
          </div>
          <MapPicker
            onLocationSelect={(loc) => {
              setNewAddrMap(loc);
            }}
          />
          <Input
            value={newAddrLabel}
            onChange={(e) => setNewAddrLabel(e.target.value)}
            placeholder="Label (e.g. Home, Work)"
          />
          {/* Address Type Selector */}
          <div className="grid grid-cols-4 gap-2">
            {(['home', 'apartment', 'office', 'other'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNewAddrType(type)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  newAddrType === type
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span>{ADDRESS_TYPE_META[type].icon}</span>
                <span className={`text-[11px] font-medium ${newAddrType === type ? 'text-primary-dark' : 'text-text-secondary'}`}>
                  {ADDRESS_TYPE_META[type].label}
                </span>
              </button>
            ))}
          </div>
          <Input value={newAddrBuilding} onChange={(e) => setNewAddrBuilding(e.target.value)} placeholder="Building / Complex" />
          <div className="flex gap-3">
            <Input value={newAddrFloor} onChange={(e) => setNewAddrFloor(e.target.value)} placeholder="Floor" />
            <Input value={newAddrUnit} onChange={(e) => setNewAddrUnit(e.target.value)} placeholder="Unit / Door #" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newAddrDefault}
              onChange={(e) => setNewAddrDefault(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-text-primary">Set as default address</span>
          </label>
          <Button
            fullWidth
            size="lg"
            onClick={handleAddAddress}
            disabled={!newAddrMap && !newAddrBuilding.trim()}
          >
            Save Address
          </Button>
        </div>
      </BottomSheet>

      {/* ─── Food Preferences Bottom Sheet ─── */}
      <BottomSheet isOpen={showPrefsSheet} onClose={() => setShowPrefsSheet(false)} title="Food Preferences">
        <div className="px-4 py-4 space-y-5">
          {/* Dietary Restrictions */}
          <div>
            <h4 className="text-sm font-bold text-text-primary mb-2">Dietary Needs</h4>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => {
                const active = user?.dietaryRestrictions?.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => handleTogglePref(opt, 'dietaryRestrictions')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                      active
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-white border-gray-200 text-text-secondary hover:border-gray-300'
                    }`}
                  >
                    {active && '✓ '}{opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cuisine Preferences */}
          <div>
            <h4 className="text-sm font-bold text-text-primary mb-2">Favorite Cuisines</h4>
            <div className="flex flex-wrap gap-2">
              {CUISINE_PREFS.map((opt) => {
                const active = user?.preferences?.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => handleTogglePref(opt, 'preferences')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                      active
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-white border-gray-200 text-text-secondary hover:border-gray-300'
                    }`}
                  >
                    {active && '✓ '}{opt}
                  </button>
                );
              })}
            </div>
          </div>

          <Button fullWidth size="lg" onClick={() => { setShowPrefsSheet(false); addToast({ type: 'success', message: 'Preferences saved' }); }}>
            Done
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
