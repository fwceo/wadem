'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Skeleton from '@/components/ui/Skeleton';
import { useCartStore } from '@/stores/cart';
import { useUIStore } from '@/stores/ui';
import SmartComboDice from '@/components/home/SmartComboDice';
import { Restaurant, MenuCategory, MenuItem, Customization, CustomizationOption } from '@/types';
import { SelectedCustomization } from '@/types/order';
import { formatDeliveryTime, formatPrice } from '@/lib/utils';

export default function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem, restaurantId, clearCart, items } = useCartStore();
  const { addToast } = useUIStore();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    Record<string, CustomizationOption[]>
  >({});
  const [showDiffRestaurantAlert, setShowDiffRestaurantAlert] = useState(false);
  const [pendingItem, setPendingItem] = useState<{
    item: MenuItem; qty: number; custs: SelectedCustomization[];
  } | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const picksRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryTabsRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  // Fetch restaurant info
  useEffect(() => {
    fetch(`/api/restaurants/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setRestaurant(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Fetch menu
  useEffect(() => {
    fetch(`/api/restaurants/${id}/menu`)
      .then((res) => res.json())
      .then((data) => {
        const cats = data.categories || [];
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
        setMenuLoading(false);
      })
      .catch(() => setMenuLoading(false));
  }, [id]);

  // Sticky header observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [restaurant]);

  // Auto-scroll category tabs as user scrolls menu
  useEffect(() => {
    if (categories.length === 0) return;
    const observers: IntersectionObserver[] = [];
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (isUserScrolling.current) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const catId = entry.target.getAttribute('data-cat-id');
          if (catId && catId !== activeCategory) {
            setActiveCategory(catId);
            // Scroll the tab into view
            const tabEl = categoryTabsRef.current?.querySelector(`[data-tab-id="${catId}"]`);
            tabEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      }
    };
    const obs = new IntersectionObserver(handleIntersect, {
      rootMargin: '-120px 0px -60% 0px',
      threshold: 0,
    });
    for (const cat of categories) {
      const el = categoryRefs.current[cat.id];
      if (el) {
        el.setAttribute('data-cat-id', cat.id);
        obs.observe(el);
      }
    }
    observers.push(obs);
    return () => observers.forEach((o) => o.disconnect());
  }, [categories, activeCategory]);

  // --- Cart Logic ---
  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    isUserScrolling.current = true;
    categoryRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Re-enable observer after scroll settles
    setTimeout(() => { isUserScrolling.current = false; }, 800);
  };

  const handleQuickAdd = (item: MenuItem) => {
    if (item.customizations.length > 0) {
      setSelectedItem(item);
      setQuantity(1);
      setSelectedCustomizations({});
      return;
    }
    attemptAddToCart(item, 1, []);
  };

  const handleAddFromSheet = () => {
    if (!selectedItem) return;
    const custs: SelectedCustomization[] = Object.entries(selectedCustomizations).map(
      ([custId, opts]) => {
        const cust = selectedItem.customizations.find((c) => c.id === custId);
        return {
          customizationId: custId,
          customizationName: cust?.name || '',
          selectedOptions: opts,
        };
      }
    );

    for (const c of selectedItem.customizations) {
      if (c.required && (!selectedCustomizations[c.id] || selectedCustomizations[c.id].length === 0)) {
        addToast({ type: 'error', message: `Please select ${c.name}` });
        // Scroll to the unfilled required addon
        const el = document.getElementById(`cust-${c.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    attemptAddToCart(selectedItem, quantity, custs);
    setSelectedItem(null);
    setQuantity(1);
    setSelectedCustomizations({});
  };

  const attemptAddToCart = (item: MenuItem, qty: number, custs: SelectedCustomization[]) => {
    if (!restaurant) return;
    if (restaurantId && restaurantId !== restaurant.id && items.length > 0) {
      setPendingItem({ item, qty, custs });
      setShowDiffRestaurantAlert(true);
      return;
    }
    addItem(item, qty, custs, restaurant.id, restaurant.name);
    addToast({ type: 'success', message: `${item.name} added to cart` });
  };

  const handleStartNewOrder = () => {
    if (!restaurant) return;
    clearCart();
    if (pendingItem) {
      addItem(pendingItem.item, pendingItem.qty, pendingItem.custs, restaurant.id, restaurant.name);
      addToast({ type: 'success', message: `${pendingItem.item.name} added to cart` });
    }
    setPendingItem(null);
    setShowDiffRestaurantAlert(false);
  };

  const getItemTotalPrice = () => {
    if (!selectedItem) return 0;
    let base = selectedItem.price;
    for (const opts of Object.values(selectedCustomizations)) {
      for (const opt of opts) base += opt.price;
    }
    return base * quantity;
  };

  const handleCustomizationChange = (customization: Customization, option: CustomizationOption) => {
    setSelectedCustomizations((prev) => {
      const current = prev[customization.id] || [];
      if (customization.type === 'radio') {
        return { ...prev, [customization.id]: [option] };
      }
      const exists = current.find((o) => o.id === option.id);
      if (exists) {
        return { ...prev, [customization.id]: current.filter((o) => o.id !== option.id) };
      }
      return { ...prev, [customization.id]: [...current, option] };
    });
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="-mt-14 md:-mt-16">
        <Skeleton className="h-56 md:h-72 w-full" />
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <span className="text-5xl mb-4">🍽️</span>
        <p className="text-text-secondary mb-4">Restaurant not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const discountPromo = restaurant.promos.find((p) => p.type === 'percentage' && p.value > 0);
  const hasMenu = categories.length > 0;

  return (
    <div className="-mt-14 md:-mt-16">
      {/* Sticky header */}
      <AnimatePresence>
        {showStickyHeader && (
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm h-14 md:h-16 flex items-center px-4"
          >
            <button onClick={() => router.back()} className="mr-3 p-1">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-bold text-secondary truncate">{restaurant.name}</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Image */}
      <div ref={heroRef} className="relative h-56 md:h-72 w-full bg-gray-100">
        {restaurant.image && <Image src={restaurant.image} alt={restaurant.name} fill className="object-cover" priority sizes="100vw" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {restaurant.logo && (
          <div className="absolute bottom-4 left-4 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-white">
            <Image src={restaurant.logo} alt="" fill className="object-cover" sizes="64px" />
          </div>
        )}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Restaurant Info */}
        <div className="px-4 md:px-6 py-4 bg-white -mt-4 relative rounded-t-2xl">
          <h1 className="text-xl md:text-2xl font-bold text-secondary mb-1">{restaurant.name}</h1>
          <p className="text-[13px] text-text-secondary mb-2">{restaurant.cuisine.join(' · ')}</p>
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <span className="flex items-center gap-1">
              <span className="bg-accent/10 text-accent text-xs font-bold px-1.5 py-0.5 rounded">★ {restaurant.rating.toFixed(1)}</span>
              {restaurant.reviewCount > 0 && <span className="text-text-secondary">({restaurant.reviewCount}+)</span>}
            </span>
            <span className="text-text-secondary">
              {formatDeliveryTime(restaurant.deliveryTime.min, restaurant.deliveryTime.max)}
            </span>
            <span className="text-text-secondary">
              {restaurant.deliveryFee === 0
                ? <span className="text-accent font-semibold">Free delivery</span>
                : `${restaurant.deliveryFee.toLocaleString()} IQD`}
            </span>
            {restaurant.distance !== undefined && (
              <span className="text-text-secondary">{restaurant.distance.toFixed(1)} km</span>
            )}
          </div>

          {(discountPromo || (restaurant.badges && restaurant.badges.length > 0)) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {discountPromo && (
                <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-md">{discountPromo.value}% OFF</span>
              )}
              {restaurant.badges?.filter((b) => b.badge_title && !b.badge_title.includes('%')).map((badge, i) => (
                <span key={i} className="text-xs font-semibold px-2 py-1 rounded-md"
                  style={{ backgroundColor: badge.badge_color || '#e2f6f0', color: badge.badge_text_color || '#008357' }}>
                  {badge.badge_title}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${restaurant.isOpen ? 'bg-accent' : 'bg-error'}`} />
            <span className={`text-sm font-medium ${restaurant.isOpen ? 'text-accent' : 'text-error'}`}>
              {restaurant.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Category Tabs — above everything */}
        {hasMenu && (
          <div className="sticky top-14 md:top-16 z-20 bg-white border-b border-border-light">
            <div className="flex items-center">
              {/* Menu nav button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMenuModal(true)}
                className="flex-shrink-0 px-3 py-3 border-r border-border-light"
                aria-label="Menu navigation"
              >
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>
              {/* Scrollable tabs — "Picks" first, then categories */}
              <div ref={categoryTabsRef} className="flex-1 overflow-x-auto no-scrollbar">
                <div className="flex px-2 gap-1">
                  <button
                    data-tab-id="__picks__"
                    onClick={() => {
                      setActiveCategory('__picks__');
                      isUserScrolling.current = true;
                      picksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setTimeout(() => { isUserScrolling.current = false; }, 800);
                    }}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeCategory === '__picks__'
                        ? 'border-secondary text-secondary'
                        : 'border-transparent text-text-secondary hover:text-secondary'
                    }`}
                  >
                    🎲 Picks
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      data-tab-id={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeCategory === cat.id
                          ? 'border-secondary text-secondary'
                          : 'border-transparent text-text-secondary hover:text-secondary'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smart Combo Dice — Picks for you */}
        {hasMenu && (
          <SmartComboDice
            ref={picksRef}
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            menuItems={categories.flatMap((c) => c.items)}
            onAddToCart={(item) => handleQuickAdd(item)}
          />
        )}

        {/* Menu */}
        <div className="bg-white">
          {menuLoading ? (
            <div className="px-4 md:px-6 py-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : hasMenu ? (
            categories.map((category) => (
              <div
                key={category.id}
                ref={(el) => { categoryRefs.current[category.id] = el; }}
                className="pt-2"
              >
                <div className="sticky top-[104px] md:top-[112px] z-10 bg-gray-50/90 backdrop-blur-sm border-y border-border-light px-4 md:px-6 py-2.5">
                  <h3 className="text-[15px] font-bold text-secondary">
                    {category.name}
                    <span className="text-text-tertiary text-sm font-normal ml-2">({category.items.length})</span>
                  </h3>
                </div>
                <div className="divide-y divide-border-light">
                  {category.items.map((item) => (
                    <div
                      key={`${category.id}-${item.id}`}
                      className="flex items-center gap-4 px-4 md:px-6 py-4 cursor-pointer active:bg-gray-50 hover:bg-gray-50/50 transition-colors"
                      onClick={() => {
                        setSelectedItem(item);
                        setQuantity(1);
                        setSelectedCustomizations({});
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-base font-semibold text-secondary">{item.name}</p>
                          {item.isPopular && (
                            <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">Popular</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-text-secondary line-clamp-2 mt-1">{item.description}</p>
                        )}
                        <p className="text-[15px] font-bold text-secondary mt-1.5">{formatPrice(item.price)}</p>
                      </div>
                      <div className="relative flex-shrink-0">
                        {item.image && (
                          <div className="w-24 h-24 rounded-xl overflow-hidden relative">
                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                          </div>
                        )}
                        {item.isAvailable ? (
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => { e.stopPropagation(); handleQuickAdd(item); }}
                            className="absolute -bottom-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-md"
                          >
                            <span className="text-white text-sm font-bold">+</span>
                          </motion.button>
                        ) : (
                          <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                            <span className="text-xs font-semibold text-error">Sold Out</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center">
              <span className="text-5xl block mb-4">📋</span>
              <h3 className="text-lg font-bold text-secondary mb-2">Menu Coming Soon</h3>
              <p className="text-sm text-text-secondary max-w-xs mx-auto">
                The full menu for {restaurant.name} is being prepared.
              </p>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="bg-white mt-2 px-4 md:px-6 py-4 mb-4">
          <h3 className="text-[15px] font-bold text-secondary mb-3">Restaurant Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Delivery Time</span><span className="text-secondary">{formatDeliveryTime(restaurant.deliveryTime.min, restaurant.deliveryTime.max)}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Delivery Fee</span><span className="text-secondary">{restaurant.deliveryFee === 0 ? 'Free' : formatPrice(restaurant.deliveryFee)}</span></div>
            {restaurant.distance !== undefined && <div className="flex justify-between"><span className="text-text-secondary">Distance</span><span className="text-secondary">{restaurant.distance.toFixed(1)} km</span></div>}
            <div className="flex justify-between"><span className="text-text-secondary">Rating</span><span className="text-secondary">★ {restaurant.rating.toFixed(1)} ({restaurant.reviewCount})</span></div>
          </div>
        </div>
      </div>

      {/* Item Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedItem}
        onClose={() => { setSelectedItem(null); setQuantity(1); setSelectedCustomizations({}); }}
      >
        {selectedItem && (
          <div className="flex flex-col">
            {selectedItem.image && (
              <div
                className="relative h-56 w-full cursor-pointer"
                onClick={() => setViewingPhoto(selectedItem.image)}
              >
                <Image src={selectedItem.image} alt={selectedItem.name} fill className="object-cover" sizes="100vw" />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  Tap to view
                </div>
              </div>
            )}
            <div className="px-4 py-4 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-secondary">{selectedItem.name}</h2>
                {selectedItem.description && (
                  <p className="text-sm text-text-secondary mt-1">{selectedItem.description}</p>
                )}
                <p className="text-lg font-bold text-secondary mt-2">{formatPrice(selectedItem.price)}</p>
              </div>

              {/* Customizations */}
              {selectedItem.customizations.map((cust) => (
                <div key={cust.id} id={`cust-${cust.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-[15px] font-semibold text-secondary">{cust.name}</h4>
                    {cust.required && (
                      <span className="text-[10px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">Required</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {cust.options.map((opt) => {
                      const isSelected = selectedCustomizations[cust.id]?.some((o) => o.id === opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleCustomizationChange(cust, opt)}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl border transition-colors ${
                            isSelected ? 'border-secondary bg-primary-light' : 'border-border bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-${cust.type === 'radio' ? 'full' : 'md'} border-2 flex items-center justify-center ${
                              isSelected ? 'border-secondary bg-secondary' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm text-secondary">{opt.name}</span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-sm text-text-secondary">+{formatPrice(opt.price)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div className="flex items-center justify-center py-2">
                <QuantitySelector
                  quantity={quantity}
                  onIncrement={() => setQuantity((q) => q + 1)}
                  onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
                />
              </div>
            </div>

            {/* Add to Cart CTA */}
            <div className="sticky bottom-0 p-4 bg-white border-t border-border-light">
              <Button fullWidth size="lg" onClick={handleAddFromSheet}>
                Add to Cart — {formatPrice(getItemTotalPrice())}
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Different Restaurant Alert */}
      <AnimatePresence>
        {showDiffRestaurantAlert && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowDiffRestaurantAlert(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-50 w-[85%] max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold text-secondary mb-2">Start a new order?</h3>
              <p className="text-sm text-text-secondary mb-6">
                Your cart has items from another restaurant. Adding this will clear your current cart.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => { setShowDiffRestaurantAlert(false); setPendingItem(null); }}>
                  Keep Current
                </Button>
                <Button className="flex-1" onClick={handleStartNewOrder}>
                  Start New
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Full-screen Photo Viewer */}
      <AnimatePresence>
        {viewingPhoto && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[60]"
              onClick={() => setViewingPhoto(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              onClick={() => setViewingPhoto(null)}
            >
              <div className="relative w-full max-w-lg aspect-square">
                <Image
                  src={viewingPhoto}
                  alt="Item photo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 512px"
                />
              </div>
              <button
                onClick={() => setViewingPhoto(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Navigation Modal */}
      <AnimatePresence>
        {showMenuModal && hasMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowMenuModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[70vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-secondary">Menu</h3>
                <button onClick={() => setShowMenuModal(false)} className="p-1">
                  <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(70vh-52px)] py-2">
                {categories.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      setShowMenuModal(false);
                      scrollToCategory(cat.id);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      activeCategory === cat.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {activeCategory === cat.id && (
                        <div className="w-1 h-6 bg-primary rounded-full" />
                      )}
                      <span className={`text-sm font-medium ${activeCategory === cat.id ? 'text-secondary font-bold' : 'text-text-primary'}`}>
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-xs text-text-tertiary">{cat.items.length} items</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
