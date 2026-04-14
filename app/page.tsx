'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Zap,
  Activity,
  Wind,
  MapPin,
  Globe as GlobeIcon,
} from 'lucide-react';

interface Earthquake {
  geometry: { coordinates: [number, number, number] };
  properties: { mag: number; place: string; time: number };
}

interface Flight {
  icao24: string;
  callsign: string;
  origin_country: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
}

interface TelemetryResponse {
  earthquakes: { features: Earthquake[] };
  flights: { states: Flight[] };
}

export default function Home() {
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState('0');
  const [monthlyActivity, setMonthlyActivity] = useState('0');
  const [yearlyActivity, setYearlyActivity] = useState('0');
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'REGIONAL' | 'NATIONAL' | 'LOCAL'>('GLOBAL');
  const [globeReady, setGlobeReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [isCriticalOnly, setIsCriticalOnly] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [currentSensorIndex, setCurrentSensorIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const sensorLocations = [
    { name: 'Tokyo', lat: 35.67, lng: 139.65, altitude: 0.7 },
    { name: 'Berlin', lat: 52.52, lng: 13.4, altitude: 0.7 },
    { name: 'Oslo', lat: 59.91, lng: 10.75, altitude: 0.7 },
    { name: 'Seattle', lat: 47.6, lng: -122.33, altitude: 0.7 },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-clear system message after 3 seconds
  useEffect(() => {
    if (systemMessage) {
      const timer = setTimeout(() => {
        setSystemMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [systemMessage]);

  // Fetch telemetry data from BFF API (Removed duplicate instance)
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch('/api/telemetry');
        const data: TelemetryResponse = await response.json();

        if (data.earthquakes?.features) {
          setEarthquakes(data.earthquakes.features);
          const totalEQ = data.earthquakes.features.length;
          setTotalEvents((totalEQ + (data.flights?.states?.length || 0)).toLocaleString());

          setMonthlyActivity((totalEQ * 12.5).toLocaleString());
          setYearlyActivity((totalEQ * 450).toLocaleString());
        }

        if (data.flights?.states) {
          setFlights(data.flights.states);
        }
      } catch (error) {
        console.error('Error fetching telemetry:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Globe (Runs only once)
  useEffect(() => {
    if (!globeContainerRef.current || globeRef.current) return;

    const initGlobe = async () => {
      try {
        const GlobeLib = (await import('globe.gl')).default;
        const container = globeContainerRef.current!;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const globe = new GlobeLib(container)
          .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
          .backgroundColor('rgba(11, 14, 20, 0)')
          .width(width)
          .height(height);

        globeRef.current = globe;
        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.5;
        globe.pointOfView({ altitude: 2.5 });

        setGlobeReady(true);
      } catch (err) {
        console.error('Globe init error:', err);
      }
    };

    initGlobe();
  }, []); // Empty dependency array ensures this doesn't re-trigger

  // Dedicated Resize Listener (Stays active permanently)
  useEffect(() => {
    const handleResize = () => {
      if (globeRef.current) {
        // Bind strictly to the window dimensions for full-screen 
        globeRef.current.width(window.innerWidth);
        globeRef.current.height(window.innerHeight);
      }
    };

    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    
    // Force an initial resize check
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Update globe data
  useEffect(() => {
    if (!globeRef.current) return;

    let earthquakePoints = earthquakes.map((quake) => ({
      lat: quake.geometry.coordinates[1],
      lng: quake.geometry.coordinates[0],
      size: Math.pow(quake.properties.mag, 2.5) * 0.5,
      color: quake.properties.mag > 5 ? '#ff006e' : '#00f0ff',
    }));

    // Filter to critical earthquakes only if enabled
    if (isCriticalOnly) {
      earthquakePoints = earthquakePoints.filter((_, idx) => earthquakes[idx].properties.mag > 5);
    }

    const flightPoints = flights.map((flight) => ({
      lat: flight.latitude,
      lng: flight.longitude,
      size: 0.3,
      color: '#a4fa00',
    }));

    const allPoints = [...earthquakePoints, ...flightPoints];

    globeRef.current
      .pointsData(allPoints)
      .pointAltitude('size')
      .pointColor('color')
      .pointRadius(0.3);
  }, [earthquakes, flights, isCriticalOnly]);

  const getTrend = () => '+14.2%';

  // Toggle rotation
  const toggleRotation = () => {
    setIsRotating(!isRotating);
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = !isRotating;
    }
  };

  // Focus on sensor location
  const focusOnSensor = () => {
    if (globeRef.current) {
      const sensor = sensorLocations[currentSensorIndex];
      globeRef.current.pointOfView(
        { lat: sensor.lat, lng: sensor.lng, altitude: sensor.altitude },
        2000
      );
      setCurrentSensorIndex((prev) => (prev + 1) % sensorLocations.length);
    }
  };

  // Toggle critical events only
  const toggleCriticalOnly = () => {
    setIsCriticalOnly(!isCriticalOnly);
  };

  // Breadcrumb Handlers
  const resetToGlobalView = () => {
    // Reset camera to global view
    if (globeRef.current) {
      globeRef.current.pointOfView({ altitude: 2.5 }, 1000);
      // Turn on auto-rotation
      if (!isRotating) {
        setIsRotating(true);
        globeRef.current.controls().autoRotate = true;
      }
    }
  };

  const resetFilters = () => {
    // Reset critical mode filter
    if (isCriticalOnly) {
      setIsCriticalOnly(false);
    }
    // Set camera to regional altitude (closer view to see events)
    if (globeRef.current) {
      globeRef.current.pointOfView({ altitude: 1.5 }, 1000);
    }
  };

  const triggerDataRefresh = () => {
    // Show toast notification
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim() || !globeRef.current) return;

    const searchLower = query.toLowerCase();
    const matchedSensor = sensorLocations.find(
      (sensor) => sensor.name.toLowerCase().includes(searchLower)
    );

    if (matchedSensor) {
      globeRef.current.pointOfView(
        { lat: matchedSensor.lat, lng: matchedSensor.lng, altitude: matchedSensor.altitude },
        2000
      );
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Handle navigation click with camera animation
  const handleNavClick = (tabName: 'GLOBAL' | 'REGIONAL' | 'NATIONAL' | 'LOCAL', altitude: number) => {
    setActiveTab(tabName);
    if (globeRef.current) {
      globeRef.current.pointOfView({ altitude }, 1000);
    }
  };

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden font-body text-on-surface">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-cyan-500/20 border border-cyan-400 rounded-full">
          <div className="flex items-center gap-2 text-cyan-400 font-headline text-sm uppercase tracking-wide">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>Telemetric Data Refreshed</span>
          </div>
        </div>
      )}

      {/* BACKGROUND: Full Screen Globe */}
      <div className="fixed inset-0 z-0 w-screen h-screen overflow-hidden flex items-center justify-center bg-black pointer-events-auto">
        <div
          ref={globeContainerRef}
          className="absolute inset-0 w-full h-full pointer-events-auto"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 z-10 pointer-events-none"></div>
        {/* Pulsing Nodes */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse neon-glow-cyan z-5"></div>
        <div className="absolute top-1/2 left-2/3 w-3 h-3 sm:w-4 sm:h-4 bg-secondary rounded-full animate-pulse neon-glow-lime z-5"></div>
        <div className="absolute top-3/4 left-1/3 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full animate-pulse neon-glow-cyan z-5"></div>
      </div>

      {/* TOP HEADER */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/40 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-cyan-900/20">
        {/* Header Row 1 - Logo, Title, Actions */}
        <div className="flex justify-between items-center w-full gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8 py-3">
          {/* Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <GlobeIcon size={20} className="sm:w-6 sm:h-6 text-cyan-400" />
            <div className="hidden sm:flex items-center text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-widest text-slate-400 font-headline whitespace-nowrap gap-1 sm:gap-2">
              <span
                onClick={resetToGlobalView}
                className="cursor-pointer hover:text-white transition-colors"
              >
                Map
              </span>
              <span className="pointer-events-none">/</span>
              <span
                onClick={resetFilters}
                className="cursor-pointer hover:text-white transition-colors"
              >
                Global Events
              </span>
              <span className="pointer-events-none">/</span>
              <span
                onClick={triggerDataRefresh}
                className="text-cyan-400 cursor-pointer hover:text-white transition-colors"
              >
                Status
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-cyan-400 drop-shadow-[0_0_12px_rgba(0,242,255,0.8)] font-black tracking-widest uppercase text-sm sm:text-lg lg:text-2xl font-headline flex-1 text-center" style={{ textShadow: '0 0 12px rgba(0, 242, 255, 0.8)' }}>
            PROJECT CHRONOS
          </h1>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 relative">
            {searchOpen && (
              <input
                type="text"
                placeholder="Search locations..."
                className="absolute right-12 px-3 py-1 rounded bg-slate-900/50 border border-cyan-500/30 text-cyan-400 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 w-48"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
              />
            )}
            <Search
              size={18}
              className="sm:w-5 sm:h-5 text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              onClick={() => setSearchOpen(!searchOpen)}
            />
          </div>
        </div>

        {/* Header Row 2 - Status Pills Below Title */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-3 flex" style={{ justifyContent: 'center' }}>
          <div className="flex gap-2" style={{ marginRight: 'auto', marginLeft: 'calc(50% - 20px)' }}>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-cyan-400 uppercase tracking-tighter whitespace-nowrap">
              Premium Tier Active
            </span>
            <span className="px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-lime-400 uppercase tracking-tighter whitespace-nowrap">
              Latency Status Sync
            </span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT CONTAINER */}
      <div className="relative z-20 min-h-screen w-full pt-28 sm:pt-32 lg:pt-28 px-3 sm:px-6 lg:px-8 pb-20 sm:pb-24 overflow-y-auto pointer-events-none">
        {/* RESPONSIVE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto h-full">

          {/* LEFT PANEL - Desktop Only */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
            {/* Total Events */}
            <section className="glass-panel rounded-3xl p-6 border border-white/10">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-headline font-bold mb-1">Total Events</h2>
              <div className="flex justify-between items-end mb-4">
                <div className="text-3xl sm:text-4xl font-headline font-bold text-cyan-400 neon-glow-cyan">
                  {totalEvents}+
                </div>
                <div className="text-[10px] text-secondary font-bold font-headline uppercase tracking-widest">
                  {getTrend()}
                </div>
              </div>
              <div className="h-24 w-full flex items-end gap-1">
                {[20, 35, 25, 60, 45, 80, 65, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${h}%`,
                      backgroundColor: 'rgb(0, 242, 255)',
                      opacity: 0.3 + h / 100 * 0.7,
                      boxShadow: i === 7 ? '0 0 15px rgba(0, 242, 255, 0.4)' : 'none',
                    }}
                  />
                ))}
              </div>
            </section>

            {/* Active Sensor Nodes */}
            <section className="glass-panel rounded-3xl p-6 border border-white/10">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-headline font-bold mb-4">Active Sensor Nodes</h2>
              <div className="grid grid-cols-1 gap-2">
                {['[OSLO_STN_04]', '[BERLIN_CORE]', '[TOKYO_V3]', '[SEA_ARC_01]'].map((node, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 rounded text-[10px] font-mono font-bold text-center border bg-surface-container-highest"
                    style={{
                      borderColor: idx % 2 === 0 ? 'rgba(153, 247, 255, 0.3)' : 'rgba(164, 250, 0, 0.3)',
                      color: idx % 2 === 0 ? '#99f7ff' : '#a4fa00',
                    }}
                  >
                    {node}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* CENTER AREA - Globe (Pointer events pass through so user can rotate globe) */}
          <div className="col-span-1 md:col-span-12 lg:col-span-6 flex flex-col justify-center items-center pointer-events-auto">
            {/* Left Controls - Visible on md+ */}
            <div className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 flex-col gap-3 lg:gap-4 pointer-events-auto z-20">
              {/* Lightning Bolt - Critical Events */}
              <button
                onClick={toggleCriticalOnly}
                className={`glass-panel rounded-full flex items-center justify-center transition-all shadow-lg w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${
                  isCriticalOnly
                    ? 'bg-cyan-400 text-black'
                    : 'text-cyan-400 hover:bg-white/10'
                }`}
              >
                <Zap size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>

              {/* Heartbeat - Rotation Toggle */}
              <button
                onClick={toggleRotation}
                className={`glass-panel rounded-full flex items-center justify-center text-cyan-400 hover:bg-white/10 transition-all shadow-lg w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${
                  isRotating ? 'animate-pulse border border-cyan-400' : ''
                }`}
              >
                <Activity size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>

              {/* Map Pin - Sensor Focus */}
              <button
                onClick={focusOnSensor}
                className="glass-panel rounded-full flex items-center justify-center text-cyan-400 hover:bg-white/10 transition-all shadow-lg w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"
              >
                <MapPin size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
          </div>

          {/* RIGHT PANEL - Desktop Only */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
            {/* Live Telemetry */}
            <section className="glass-panel rounded-3xl p-6 border border-white/10 h-full">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-headline font-bold mb-6">Live Telemetry</h2>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-400/20 transition-all">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Monthly Activity</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-headline font-bold text-on-surface">{monthlyActivity}</span>
                    <div className="flex items-center text-secondary text-xs font-bold gap-1">
                      <span>↑</span>
                      <span>10%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-400/20 transition-all">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Yearly Cumulative</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-headline font-bold text-on-surface">{yearlyActivity}</span>
                    <div className="flex items-center text-secondary text-xs font-bold gap-1">
                      <span>↑</span>
                      <span>12%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* MOBILE & TABLET BOTTOM DRAWER */}
          <div className="block lg:hidden col-span-12 fixed inset-x-0 bottom-20 sm:bottom-24 z-30 px-3 sm:px-4 pointer-events-none">
            <div className="glass-panel rounded-[2.5rem] p-4 sm:p-6 shadow-2xl border-t border-white/20 max-w-2xl mx-auto pointer-events-auto">
              {/* Handle */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:mb-6"></div>

              <div className="flex flex-col md:flex-row md:gap-6">
                {/* Total Events */}
                <section className="mb-4 md:mb-0 md:flex-1">
                  <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-headline font-bold mb-1">Total Events</h2>
                  <div className="flex justify-between items-end mb-3">
                    <div className="text-3xl sm:text-4xl font-headline font-bold text-cyan-400 neon-glow-cyan">{totalEvents}+</div>
                    <div className="text-[10px] text-secondary font-bold font-headline uppercase">{getTrend()}</div>
                  </div>
                  <div className="h-16 sm:h-20 w-full flex items-end gap-1">
                    {[20, 35, 25, 60, 45, 80, 65, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          backgroundColor: 'rgb(0, 242, 255)',
                          opacity: 0.3 + h / 100 * 0.7,
                        }}
                      />
                    ))}
                  </div>
                </section>

                {/* Live Telemetry */}
                <section className="md:flex-1">
                  <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-headline font-bold mb-3">Live Telemetry</h2>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    <div className="min-w-[120px] sm:min-w-[140px] md:flex-1 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[9px] text-slate-400 uppercase mb-1">Monthly</div>
                      <div className="text-sm sm:text-base font-bold">{monthlyActivity}</div>
                    </div>
                    <div className="min-w-[120px] sm:min-w-[140px] md:flex-1 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[9px] text-slate-400 uppercase mb-1">Yearly</div>
                      <div className="text-sm sm:text-base font-bold">{yearlyActivity}</div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-center items-center h-16 sm:h-20 lg:h-24 px-4 bg-slate-950/60 backdrop-blur-2xl z-50 rounded-t-3xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center w-full max-w-2xl lg:max-w-3xl">
          {(['GLOBAL', 'REGIONAL', 'NATIONAL', 'LOCAL'] as const).map((tab) => (
            <NavButton
              key={tab}
              icon={
                tab === 'GLOBAL' ? <GlobeIcon size={20} /> :
                tab === 'REGIONAL' ? <Activity size={20} /> :
                tab === 'NATIONAL' ? <Wind size={20} /> :
                <MapPin size={20} />
              }
              label={tab}
              isActive={activeTab === tab}
              onClick={() => {
                const altitudes = { GLOBAL: 2.0, REGIONAL: 1.2, NATIONAL: 0.8, LOCAL: 0.3 };
                handleNavClick(tab, altitudes[tab]);
              }}
            />
          ))}
        </div>
      </nav>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
            <p className="text-cyan-400 text-sm sm:text-base">Initializing Project Chronos...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .neon-glow-cyan {
          filter: drop-shadow(0 0 8px rgba(0, 242, 255, 0.6));
        }
        .neon-glow-lime {
          filter: drop-shadow(0 0 8px rgba(164, 250, 0, 0.4));
        }
      `}</style>
    </main>
  );
}

function NavButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center transition-all gap-1 ${
        isActive
          ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,242,255,0.5)] scale-110'
          : 'text-slate-500 saturate-50 hover:text-cyan-300'
      }`}
    >
      {icon}
      <span className="font-headline font-bold tracking-widest uppercase text-[9px] sm:text-[10px] lg:text-xs">
        {label}
      </span>
    </button>
  );
}