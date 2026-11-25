import { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useNavigate, Link } from 'react-router-dom';
import UserInfoForm from './form/userform.jsx';
import AboutPage, { Team, Company, Contact } from './pages/AboutPage.jsx';
import WeatherCanvas from './components/WeatherCanvas.jsx';
import GisHeatmap from './components/GisHeatmap.jsx';
import Sidebar from './components/Sidebar.jsx';
import ModalOverlay from './components/ModalOverlay.jsx';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const fetchBackendLiveWeather = async (loc) => {
  try {
    const res = await fetch(`${API_BASE_URL}/weather/live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: loc.lat,
        lon: loc.lon,
        name: loc.name,
        eyebrow: loc.eyebrow,
        stationMeta: loc
      })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Backend Live Weather Error:', err);
    return null;
  }
};

const searchBackendCities = async (query) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/weather/search?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Backend City Search Error:', err);
    return [];
  }
};

const convertCtoF = (c) => Math.round(c * 1.8 + 32);

const formatTempStr = (val, unit) => {
  if (unit === 'C' || val === undefined || val === null) return val;
  if (typeof val === 'number') {
    return convertCtoF(val);
  }
  return String(val).replace(/(-?\d+)(?=°)/g, (match) => {
    const num = parseInt(match, 10);
    return isNaN(num) ? match : convertCtoF(num);
  });
};

const parseTempNum = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const match = String(val).match(/-?\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const computeCityTempBars = (tenDayList) => {
  if (!tenDayList || tenDayList.length === 0) return [];

  let minTemp = Infinity;
  let maxTemp = -Infinity;

  const parsed = tenDayList.map((row) => {
    const lowNum = parseTempNum(row.low);
    const highNum = parseTempNum(row.high);
    if (lowNum < minTemp) minTemp = lowNum;
    if (highNum > maxTemp) maxTemp = highNum;
    return { ...row, lowNum, highNum };
  });

  const rangeMin = minTemp - 3;
  const rangeMax = maxTemp + 3;
  const totalRange = Math.max(1, rangeMax - rangeMin);

  return parsed.map((row) => {
    const fillLowNum = Math.max(0, Math.min(90, ((row.lowNum - rangeMin) / totalRange) * 100));
    const fillWidthNum = Math.max(6, Math.min(100 - fillLowNum, ((row.highNum - row.lowNum) / totalRange) * 100));
    return {
      ...row,
      fillLow: `${fillLowNum.toFixed(1)}%`,
      fillWidth: `${fillWidthNum.toFixed(1)}%`
    };
  });
};

const generate24HourForecast = (hourlyList) => {
  if (!hourlyList || hourlyList.length === 0) return [];
  return hourlyList;
};

const EMPTY_LOCATION = {
  id: '',
  name: 'Loading...',
  condition: '',
  temp: '--',
  hl: '-- · --',
  weatherState: 'sunny',
  aqi: {},
  wind: {},
  uv: {},
  sunset: {},
  feelsLike: {},
  precip: {},
  humidity: {},
  visibility: {},
  pressure: {},
  hourly: [],
  tenDay: []
};

const loadCachedLocations = () => {
  try {
    const cached =
      localStorage.getItem('climate_guard_imd_india_v2') ||
      localStorage.getItem('climate_guard_imd_india_v1');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 1) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading cached IMD weather:', e);
  }
  return [];
};

const DEFAULT_CARD_ORDER = [
  'hourly',
  'seven-day',
  'aqi',
  'wind',
  'gis-map',
  'uv',
  'sunset',
  'feels-like',
  'precip',
  'climatology',
  'humidity',
  'visibility',
  'pressure'
];

const loadCachedCardOrder = () => {
  try {
    const saved = localStorage.getItem('climate_guard_card_order_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter((id) => DEFAULT_CARD_ORDER.includes(id));
        const missing = DEFAULT_CARD_ORDER.filter((id) => !valid.includes(id));
        return [...valid, ...missing];
      }
    }
  } catch (e) {
    console.error('Error loading cached card order:', e);
  }
  return DEFAULT_CARD_ORDER;
};

function DragHandle({ cardId, onDragStart, onDragEnd }) {
  return (
    <div
      className="card-drag-handle"
      title="Drag to rearrange card priority"
      aria-label="Drag to rearrange priority"
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, cardId)}
      onDragEnd={onDragEnd}
      onClick={(e) => e.stopPropagation()}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
      </svg>
    </div>
  );
}

function DashboardView({
  activeLocation,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenModal,
  userData,
  unit,
  onRefreshLive,
  isLoadingLive,
  locationsCount,
  climaticSeason
}) {
  const navigate = useNavigate();

  const [cardOrder, setCardOrder] = useState(loadCachedCardOrder);
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);
  const isDraggingRef = useRef(false);

  const isCustomOrder = JSON.stringify(cardOrder) !== JSON.stringify(DEFAULT_CARD_ORDER);

  const hourlyList = generate24HourForecast(activeLocation.hourly);
  const computedTenDay = computeCityTempBars(activeLocation.tenDay);
  const alertColor = activeLocation.alert?.colorAlert || 'green';
  const isHeatwaveSeason = Boolean(climaticSeason?.isHeatwaveSeason);

  const handleDragStart = (e, cardId) => {
    isDraggingRef.current = true;
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragOver = (e, cardId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (cardId !== dragOverCardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleDragEnter = (e, cardId) => {
    e.preventDefault();
    setDragOverCardId(cardId);
  };

  const handleDragLeave = (e, cardId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverCardId === cardId) {
      setDragOverCardId(null);
    }
  };

  const handleDrop = (e, targetCardId) => {
    e.preventDefault();
    const sourceCardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (sourceCardId && targetCardId && sourceCardId !== targetCardId) {
      setCardOrder((prev) => {
        const fromIdx = prev.indexOf(sourceCardId);
        const toIdx = prev.indexOf(targetCardId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        const next = [...prev];
        const [removed] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, removed);
        try {
          localStorage.setItem('climate_guard_card_order_v2', JSON.stringify(next));
        } catch (err) {
          console.error(err);
        }
        return next;
      });
    }
    setDraggedCardId(null);
    setDragOverCardId(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
  };

  const resetCardOrder = () => {
    setCardOrder(DEFAULT_CARD_ORDER);
    try {
      localStorage.removeItem('climate_guard_card_order_v2');
    } catch (e) {
      console.error(e);
    }
  };

  const getCardSpanClass = (cardId) => {
    switch (cardId) {
      case 'hourly':
        return 'card-span-full';
      case 'seven-day':
      case 'gis-map':
        return 'card-span-2';
      default:
        return 'card-span-1';
    }
  };

  const renderCard = (cardId) => {
    switch (cardId) {
      case 'hourly':
        return (
          <section className="hourly-rail-card">
            <div className="rail-header">
              <div className="rail-header-left">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>HOURLY SYNOPTIC EVOLUTION &amp; THERMAL LOAD (24H)</span>
              </div>
              <DragHandle cardId="hourly" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className="hourly-scroll-container">
              {hourlyList.map((item, idx) => (
                <div key={idx} className="hourly-item">
                  <div className="hourly-time">{item.time}</div>
                  <svg
                    className="hourly-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={
                      item.icon === 'thunder' ? '#f97316' :
                        item.icon === 'sun' ? '#fde047' :
                          item.icon === 'night' ? '#c084fc' :
                            item.icon === 'rain' ? '#38bdf8' : '#94a3b8'
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.icon === 'sun' ? (
                      <>
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="2" x2="12" y2="4" />
                        <line x1="12" y1="20" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="4" y2="12" />
                        <line x1="20" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                        <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                        <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
                      </>
                    ) : item.icon === 'night' ? (
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    ) : item.icon === 'thunder' ? (
                      <>
                        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 3 14" />
                        <polyline points="13 11 9 17 15 17 11 23" />
                      </>
                    ) : item.icon === 'rain' ? (
                      <>
                        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 14.25" />
                        <line x1="8" y1="19" x2="8" y2="21" />
                        <line x1="12" y1="19" x2="12" y2="21" />
                        <line x1="16" y1="19" x2="16" y2="21" />
                      </>
                    ) : (
                      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 15.25" />
                    )}
                  </svg>
                  <div className="hourly-pop">{item.pop}</div>
                  <div className="hourly-temp">{formatTempStr(item.temp, unit)}</div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'seven-day':
        return (
          <div
            className="glass-card ten-day-card"
            onClick={() => onOpenModal('seven-day')}
          >
            <div className="card-title">
              <div className="card-title-left">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>7-DAY IMD REGIONAL FORECAST</span>
              </div>
              <DragHandle cardId="seven-day" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className="forecast-list">
              {computedTenDay.map((row, i) => (
                <div key={i} className="forecast-row">
                  <div className="forecast-day">{row.day}</div>
                  <div className="forecast-pop">{row.pop}</div>
                  <svg
                    className="forecast-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={
                      row.icon === 'thunder' ? '#f97316' :
                        row.icon === 'sun' ? '#fde047' :
                          row.icon === 'rain' ? '#38bdf8' : '#94a3b8'
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {row.icon === 'sun' ? (
                      <>
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="2" x2="12" y2="4" />
                        <line x1="12" y1="20" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="4" y2="12" />
                        <line x1="20" y1="12" x2="22" y2="12" />
                      </>
                    ) : row.icon === 'thunder' ? (
                      <>
                        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 3 14" />
                        <polyline points="13 11 9 17 15 17 11 23" />
                      </>
                    ) : row.icon === 'rain' ? (
                      <>
                        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 14.25" />
                        <line x1="8" y1="19" x2="8" y2="21" />
                        <line x1="12" y1="19" x2="12" y2="21" />
                        <line x1="16" y1="19" x2="16" y2="21" />
                      </>
                    ) : (
                      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 15.25" />
                    )}
                  </svg>
                  <div className="forecast-temp-range">
                    <span className="temp-low">{formatTempStr(row.low, unit)}</span>
                    <div className="temp-bar-bg">
                      <div className="temp-bar-fill" style={{ left: row.fillLow, width: row.fillWidth }} />
                    </div>
                    <span className="temp-high">{formatTempStr(row.high, unit)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'aqi':
        return (
          <div
            className="glass-card aqi-card"
            onClick={() => onOpenModal('aqi')}
          >
            <div>
              <div className="card-title">
                <div className="card-title-left">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                    <path d="M12 6a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6z" />
                  </svg>
                  <span>CPCB AIR QUALITY INDEX</span>
                </div>
                <DragHandle cardId="aqi" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
              </div>
              <div className="card-hero-val">{activeLocation.aqi.val}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#fde047' }}>
                {activeLocation.aqi.status}
              </div>
              <div className="aqi-slider-bg">
                <div className="aqi-slider-marker" style={{ left: activeLocation.aqi.marker }} />
              </div>
            </div>
            <div className="card-subtext">{activeLocation.aqi.desc}</div>
          </div>
        );

      case 'wind':
        return (
          <div
            className="glass-card wind-card"
            onClick={() => onOpenModal('wind')}
          >
            <div>
              <div className="card-title">
                <div className="card-title-left">
                  <svg viewBox="0 0 24 24">
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                  </svg>
                  <span>SURFACE WIND &amp; GUSTS</span>
                </div>
                <DragHandle cardId="wind" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
              </div>
              <div className="wind-content">
                <div>
                  <div className="card-hero-val">{activeLocation.wind.speed}</div>
                  <div className="card-subtext">{activeLocation.wind.dirText}</div>
                </div>
                <div className="wind-compass-box">
                  <span className="compass-label compass-n">N</span>
                  <span className="compass-label compass-e">E</span>
                  <span className="compass-label compass-s">S</span>
                  <span className="compass-label compass-w">W</span>
                  <div className="wind-dial" style={{ transform: `rotate(${activeLocation.wind.angle}deg)` }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'gis-map':
        return (
          <GisHeatmap
            activeLocationName={activeLocation.name}
            lat={activeLocation.lat}
            lon={activeLocation.lon}
            dragHandle={<DragHandle cardId="gis-map" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />}
          />
        );

      case 'uv':
        return (
          <div
            className="glass-card compact-card"
            onClick={() => onOpenModal('uv')}
          >
            <div className="card-title">
              <div className="card-title-left">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                </svg>
                <span>SOLAR UV IRRADIANCE</span>
              </div>
              <DragHandle cardId="uv" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className="card-hero-val">{activeLocation.uv.val}</div>
            <div className="card-subtext">{activeLocation.uv.desc}</div>
            <div className="uv-slider-bg">
              <div className="uv-slider-marker" style={{ left: activeLocation.uv.marker }} />
            </div>
          </div>
        );

      case 'sunset':
        return (
          <div
            className="glass-card compact-card"
            onClick={() => onOpenModal('sunset')}
          >
            <div className="card-title">
              <div className="card-title-left">
                <svg viewBox="0 0 24 24">
                  <path d="M17 18a5 5 0 0 0-10 0" />
                  <line x1="12" y1="2" x2="12" y2="9" />
                  <polyline points="9 6 12 9 15 6" />
                  <line x1="2" y1="18" x2="22" y2="18" />
                </svg>
                <span>SUNSET &amp; DAWN</span>
              </div>
              <DragHandle cardId="sunset" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className="card-hero-val">{activeLocation.sunset.time}</div>
            <div className="card-subtext">{activeLocation.sunset.sunrise}</div>
          </div>
        );

      case 'feels-like':
        return (
          <div
            className="glass-card compact-card"
            onClick={() => onOpenModal('feelslike')}
          >
            <div className="card-title">
              <div className="card-title-left">
                <svg viewBox="0 0 24 24">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                </svg>
                <span>HEAT INDEX / FEELS LIKE</span>
              </div>
              <DragHandle cardId="feels-like" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className="card-hero-val">{formatTempStr(activeLocation.feelsLike.val, unit)}</div>
            <div className="card-subtext">{activeLocation.feelsLike.desc}</div>
          </div>
        );

      case 'precip':
        return (
          <div
            className="glass-card compact-card"
            onClick={() => onOpenModal('precip')}
          >
            <div className="card-title">
              <div className="card-title-left">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                <span>PRECIPITATION (24H)</span>
              </div>
              <DragHandle cardId="precip" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className="card-hero-val">{activeLocation.precip.val}</div>
            <div className="card-subtext">{activeLocation.precip.desc}</div>
          </div>
        );

      case 'climatology':
        return (
          <div
            className="glass-card compact-card imd-highlight-card"
            onClick={() => onOpenModal('imd-climatology')}
          >
            <div className="card-title">
              <div className="card-title-left">
                <svg viewBox="0 0 24 24">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
                <span>CLIMATOLOGICAL ANOMALY</span>
              </div>
              <DragHandle cardId="climatology" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className={`card-hero-val ${activeLocation.departure >= 4.5 ? 'alert-departure' : ''}`}>
              {activeLocation.departureStr || '+0.0°C'}
            </div>
            <div className="card-subtext">
              Normal: {activeLocation.normalMax || 38.0}°C · IMD Pune Grid Baseline (Click for rules)
            </div>
          </div>
        );

      case 'humidity':
        return (
          <div
            className="glass-card compact-card"
            onClick={() => onOpenModal('humidity')}
          >
            <div className="card-title">
              <div className="card-title-left">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                <span>RELATIVE HUMIDITY</span>
              </div>
              <DragHandle cardId="humidity" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className="card-hero-val">{activeLocation.humidity.val}</div>
            <div className="card-subtext">{formatTempStr(activeLocation.humidity.dew, unit)}</div>
          </div>
        );

      case 'visibility':
        return (
          <div
            className="glass-card compact-card"
            onClick={() => onOpenModal('visibility')}
          >
            <div className="card-title">
              <div className="card-title-left">
                <svg viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>ATMOSPHERIC VISIBILITY</span>
              </div>
              <DragHandle cardId="visibility" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className="card-hero-val">
              {unit === 'F' && activeLocation.visibility.valMiles ? activeLocation.visibility.valMiles : activeLocation.visibility.val}
            </div>
            <div className="card-subtext">{activeLocation.visibility.desc}</div>
          </div>
        );

      case 'pressure':
        return (
          <div
            className="glass-card compact-card"
            onClick={() => onOpenModal('pressure')}
          >
            <div className="card-title">
              <div className="card-title-left">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 12l-4-4-4 4" />
                  <line x1="12" y1="16" x2="12" y2="8" />
                </svg>
                <span>BAROMETRIC PRESSURE</span>
              </div>
              <DragHandle cardId="pressure" onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            </div>
            <div className="card-hero-val">{activeLocation.pressure.val}</div>
            <div className="card-subtext">{activeLocation.pressure.desc}</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="main-content" id="main-content">
      {/* Top Bar for Collapsed Restore & Live Telemetry Refresh */}
      <div className="main-top-bar">
        {isSidebarCollapsed && (
          <button className="open-sidebar-btn" onClick={onToggleSidebar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <path d="M12 10l3 3-3 3" />
            </svg>
            <span>Indian Stations ({locationsCount})</span>
          </button>
        )}

        <div className="imd-season-badge">
          <span className="season-icon">☀️</span>
          <span>SEASON: <strong>{activeLocation.climaticSeason || climaticSeason?.name || 'Post-Monsoon / Autumn'}</strong> {isHeatwaveSeason ? '(HEATWAVE WINDOW)' : ''}</span>
        </div>

        <div className="live-telemetry-badge-container">
          <span className={`live-pulse-dot dot-${alertColor}`}>●</span>
          <span className="last-updated">
            {isLoadingLive ? 'Syncing IMD Telemetry...' : 'IMD Telemetry Active'}
          </span>
          <button className="refresh-telemetry-btn" onClick={onRefreshLive} title="Refresh IMD Live Weather Data">
            ↻ Refresh IMD Live
          </button>
        </div>
      </div>

      {/* Active Observer Banner */}
      {userData && userData.name && (
        <div className="observer-banner">
          <div className="observer-info">
            <span className="badge-label">Active Field Observer:</span>
            <span>
              <strong>{userData.name.toUpperCase()}</strong> ({userData.role ? `${userData.role}, ` : ''}{userData.location})
            </span>
          </div>
          <button className="edit-profile-btn" onClick={() => navigate('/observer-form')}>
            Update Profile
          </button>
        </div>
      )}

      {/* HERO ZONE */}
      <section className="hero-zone">
        <div className="hero-left">
          <h1 className="hero-city">{activeLocation.name.toUpperCase()}</h1>
          <div className="hero-condition">{activeLocation.condition}</div>
        </div>
        <div className="hero-right">
          <div className="hero-temp">{formatTempStr(activeLocation.temp, unit)}°</div>
          <div className="hero-hl">
            <span>{formatTempStr(activeLocation.hl.split('·')[0], unit)}</span>
            <span>{formatTempStr(activeLocation.hl.split('·')[1] || '', unit)}</span>
          </div>
        </div>
      </section>

      {/* IMD SEVERITY-CODED WARNING STRIP */}
      {activeLocation.alert && (
        <section
          className={`alert-strip ${activeLocation.alert.severity} alert-theme-${alertColor}`}
          onClick={() => onOpenModal('imd-climatology')}
        >
          <div className="alert-left">
            <div className={`alert-icon-box icon-${alertColor}`}>
              <svg viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="alert-text-content">
              <div className="alert-headline">
                {activeLocation.alert.title}
                <span className={`alert-headline-badge badge-${alertColor}`}>
                  {activeLocation.alert.badge}
                </span>
              </div>
              <div className="alert-body">{activeLocation.alert.body}</div>
            </div>
          </div>
          <button
            className="alert-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal('imd-climatology');
            }}
          >
            {activeLocation.alert.action}
          </button>
        </section>
      )}

      {/* IMD SYNOPTIC INTELLIGENCE BAR (Placed below warning) */}
      <section className="imd-synoptic-bar" onClick={() => onOpenModal('imd-climatology')}>
        <div className="synoptic-item">
          <span className="synoptic-label">IMD REGIONAL ZONE</span>
          <span className="synoptic-val">{activeLocation.imdRegionName || activeLocation.eyebrow}</span>
        </div>
        <div className="synoptic-divider" />
        <div className="synoptic-item">
          <span className="synoptic-label">TERRAIN &amp; ELEVATION</span>
          <span className="synoptic-val">
            {(activeLocation.terrain || 'plains').toUpperCase()} STATION · {activeLocation.elevation || '100m'}
          </span>
        </div>
        <div className="synoptic-divider" />
        <div className="synoptic-item">
          <span className="synoptic-label">30-YR CLIMATOLOGICAL NORMAL</span>
          <span className="synoptic-val">{activeLocation.normalMax || 38.0}°C MAX</span>
        </div>
        <div className="synoptic-divider" />
        <div className="synoptic-item">
          <span className="synoptic-label">DEPARTURE FROM NORMAL (ΔT)</span>
          <span className={`synoptic-val ${activeLocation.departure >= 4.5 ? 'alert-departure' : 'normal-departure'}`}>
            {activeLocation.departureStr || '+0.0°C'}
          </span>
        </div>
        <button className="imd-info-chip" onClick={(e) => { e.stopPropagation(); onOpenModal('imd-climatology'); }}>
          Criteria Details ℹ️
        </button>
      </section>

      {/* Cards Reorder & Priority Toolbar */}
      {isCustomOrder && (
        <div className="cards-reorder-toolbar">
          <div className="reorder-toolbar-left">
            <span className="reorder-handle-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                <circle cx="5" cy="3" r="1.5" />
                <circle cx="11" cy="3" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="13" r="1.5" />
                <circle cx="11" cy="13" r="1.5" />
              </svg>
            </span>
            <span className="reorder-text">
              CUSTOM DASHBOARD PRIORITY ACTIVE · DRAG ANY CARD VIA 6-DOT HANDLES TO REARRANGE
            </span>
          </div>
          <button className="reset-order-btn" onClick={resetCardOrder} title="Reset dashboard cards to default arrangement">
            ↻ Reset Priority Order
          </button>
        </div>
      )}

      {/* MODULAR REORDERABLE GRID CONTAINER */}
      <div className="module-grid-container reorderable-grid">
        {cardOrder.map((cardId) => {
          const isBeingDragged = draggedCardId === cardId;
          const isTargeted = dragOverCardId === cardId && !isBeingDragged;
          const spanClass = getCardSpanClass(cardId);

          return (
            <div
              key={cardId}
              id={`card-item-${cardId}`}
              className={`draggable-card-wrapper ${spanClass} ${isBeingDragged ? 'is-dragging' : ''} ${isTargeted ? 'drag-over-card' : ''}`}
              onDragOver={(e) => handleDragOver(e, cardId)}
              onDragEnter={(e) => handleDragEnter(e, cardId)}
              onDragLeave={(e) => handleDragLeave(e, cardId)}
              onDrop={(e) => handleDrop(e, cardId)}
            >
              {renderCard(cardId)}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function App() {
  const [locationsList, setLocationsList] = useState(loadCachedLocations);
  const [imdRegions, setImdRegions] = useState([
    { id: 'all', name: 'All IMD Regions', code: 'ALL' }
  ]);
  const [climaticSeason, setClimaticSeason] = useState({
    name: 'Post-Monsoon / Autumn',
    isHeatwaveSeason: false
  });
  const [activeLocationId, setActiveLocationId] = useState('mumbai');
  const [selectedImdRegion, setSelectedImdRegion] = useState('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [modalData, setModalData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [unit, setUnit] = useState('C');
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  // Listen to window resize to automatically collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectLocation = (id) => {
    setActiveLocationId(id);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  };

  const activeLocation =
    locationsList.find((l) => l.id === activeLocationId) || locationsList[0] || EMPTY_LOCATION;

  const locationsRef = useRef(locationsList);
  useEffect(() => {
    locationsRef.current = locationsList;
    if (locationsList.length > 1) {
      try {
        localStorage.setItem('climate_guard_imd_india_v2', JSON.stringify(locationsList));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  }, [locationsList]);

  // Sync Live Weather instantly on Active Location Change via Backend
  useEffect(() => {
    let isMounted = true;
    const currentLoc = locationsRef.current.find((l) => l.id === activeLocationId);

    if (currentLoc && currentLoc.lat && currentLoc.lon) {
      setIsLoadingLive(true);
      fetchBackendLiveWeather(currentLoc).then((liveData) => {
        if (isMounted && liveData) {
          setLocationsList((prev) =>
            prev.map((item) =>
              item.id === currentLoc.id
                ? { ...item, ...liveData, lat: currentLoc.lat, lon: currentLoc.lon, isLive: true }
                : item
            )
          );
        }
        if (isMounted) setIsLoadingLive(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [activeLocationId]);

  // Fetch IMD Catalog, Regions, Season, and Batch Live Telemetry from Backend on App Mount
  useEffect(() => {
    let isMounted = true;

    async function initFromBackend() {
      try {
        const catalogRes = await fetch(`${API_BASE_URL}/weather/catalog`);
        if (!catalogRes.ok) return;
        const catalogData = await catalogRes.json();

        if (!isMounted) return;

        if (Array.isArray(catalogData.regions)) {
          setImdRegions(catalogData.regions);
        }
        if (catalogData.season) {
          setClimaticSeason(catalogData.season);
        }

        const backendStations = Array.isArray(catalogData.stations) ? catalogData.stations : [];
        let mergedLocations = locationsRef.current;

        if (backendStations.length > 0) {
          const existingMap = new Map(mergedLocations.map((item) => [item.id, item]));
          mergedLocations = backendStations.map((st) => {
            const cachedItem = existingMap.get(st.id);
            return cachedItem && cachedItem.temp !== '--'
              ? { ...st, ...cachedItem, region: st.region, regionName: st.regionName, imdRegion: st.region, imdRegionName: st.regionName }
              : st;
          });
          setLocationsList(mergedLocations);
        }

        // Fetch live weather for each station from backend and update progressively
        for (const loc of mergedLocations) {
          fetchBackendLiveWeather(loc).then((liveData) => {
            if (isMounted && liveData) {
              setLocationsList((prev) =>
                prev.map((item) =>
                  item.id === loc.id
                    ? { ...item, ...liveData, lat: loc.lat, lon: loc.lon, isLive: true }
                    : item
                )
              );
            }
          });
        }
      } catch (err) {
        console.error('Failed to initialize weather catalog from backend:', err);
      }
    }

    initFromBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handler when user adds a searched Indian city from Sidebar
  const handleAddLiveCity = async (searchResult) => {
    setIsLoadingLive(true);
    const liveData = await fetchBackendLiveWeather(searchResult);

    if (liveData) {
      const newLoc = { ...liveData, lat: searchResult.lat, lon: searchResult.lon, isLive: true };
      setLocationsList((prev) => {
        const filtered = prev.filter((p) => p.id !== newLoc.id);
        return [newLoc, ...filtered];
      });
      setActiveLocationId(newLoc.id);
    }
    setIsLoadingLive(false);
  };

  const handleSaveUser = async (data) => {
    setUserData(data);
    if (data.location) {
      const cityQuery = data.location.split('(')[0].trim();
      const results = await searchBackendCities(cityQuery);
      if (results.length > 0) {
        await handleAddLiveCity(results[0]);
      }
    }
  };

  const handleOpenModal = (type) => {
    setModalData({ type, location: activeLocation });
  };

  const handleCloseModal = () => {
    setModalData(null);
  };

  const handleRefreshLive = async () => {
    if (activeLocation && activeLocation.lat && activeLocation.lon) {
      setIsLoadingLive(true);
      const liveData = await fetchBackendLiveWeather(activeLocation);
      if (liveData) {
        setLocationsList((prev) =>
          prev.map((item) =>
            item.id === activeLocation.id
              ? { ...item, ...liveData, lat: activeLocation.lat, lon: activeLocation.lon, isLive: true }
              : item
          )
        );
      }
      setIsLoadingLive(false);
    }
  };

  return (
    <div className="app-root-shell">
      {/* Top Navbar */}
      <header className="glass-navbar">
        <div className="nav-left">
          <Link to="/" className="brand-logo-link">
            <div className="brand-text-stack">
              <span className="brand-name">Climate Guard</span>
              <span className="brand-tagline">IMD Heatwave Intelligence Platform</span>
            </div>
          </Link>
        </div>

        <div className="nav-center">
          <ul className="nav-menu desktop-nav-menu">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? 'main-nav-link active' : 'main-nav-link'
                }
                end
              >
                IMD Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/observer-form"
                className={({ isActive }) =>
                  isActive ? 'main-nav-link active' : 'main-nav-link'
                }
              >
                Observer Network
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  isActive ? 'main-nav-link active' : 'main-nav-link'
                }
              >
                About Us
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  isActive ? 'main-nav-link active' : 'main-nav-link'
                }
              >
                Contact
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="nav-right">
          <div className="unit-toggle-box">
            <button
              className={`unit-btn ${unit === 'C' ? 'active' : ''}`}
              onClick={() => setUnit('C')}
              title="Celsius (°C) — IMD Standard"
            >
              °C
            </button>
            <button
              className={`unit-btn ${unit === 'F' ? 'active' : ''}`}
              onClick={() => setUnit('F')}
              title="Fahrenheit (°F)"
            >
              °F
            </button>
          </div>

          <button
            type="button"
            className="hamburger-btn"
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="mobile-side-panel" aria-label="Mobile navigation menu">
            <div className="mobile-panel-header">
              <div className="brand-text-stack">
                <span className="brand-name">Climate Guard</span>
                <span className="brand-tagline">IMD Heatwave Intelligence Platform</span>
              </div>
              <button
                type="button"
                className="close-panel-btn"
                aria-label="Close menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <nav className="mobile-panel-nav">
              <button
                type="button"
                className="mobile-panel-link register-first"
                onClick={() => {
                  navigate('/observer-form');
                  setIsMobileMenuOpen(false);
                }}
              >
                + Register Observer
              </button>

              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? 'mobile-panel-link active' : 'mobile-panel-link'
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                IMD Dashboard
              </NavLink>

              <NavLink
                to="/observer-form"
                className={({ isActive }) =>
                  isActive ? 'mobile-panel-link active' : 'mobile-panel-link'
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Observer Network
              </NavLink>

              <NavLink
                to="/about"
                className={({ isActive }) =>
                  isActive ? 'mobile-panel-link active' : 'mobile-panel-link'
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Network
              </NavLink>

              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  isActive ? 'mobile-panel-link active' : 'mobile-panel-link'
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </NavLink>
            </nav>
          </aside>
        </>
      )}

      {/* App Main Layout */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="app-container">
              {/* Full-bleed Weather Canvas (Dashboard only) */}
              <WeatherCanvas
                condition={activeLocation.weatherState}
                temp={activeLocation.temp}
              />
              <Sidebar
                locationsData={locationsList}
                activeLocationId={activeLocationId}
                onSelectLocation={handleSelectLocation}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                userData={userData}
                onNavigateObserverForm={() => {
                  navigate('/observer-form');
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setIsSidebarCollapsed(true);
                  }
                }}
                formatTempStr={formatTempStr}
                unit={unit}
                onAddLiveCity={handleAddLiveCity}
                selectedImdRegion={selectedImdRegion}
                onSelectImdRegion={setSelectedImdRegion}
                imdRegions={imdRegions}
              />
              {!isSidebarCollapsed && (
                <div
                  className="sidebar-mobile-backdrop"
                  aria-hidden="true"
                  onClick={() => setIsSidebarCollapsed(true)}
                />
              )}
              <DashboardView
                activeLocation={activeLocation}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={() => setIsSidebarCollapsed(false)}
                onOpenModal={handleOpenModal}
                userData={userData}
                unit={unit}
                onRefreshLive={handleRefreshLive}
                isLoadingLive={isLoadingLive}
                locationsCount={locationsList.length}
                climaticSeason={climaticSeason}
              />
            </div>
          }
        />
        <Route
          path="/observer-form"
          element={
            <div className="page-content-wrapper">
              <UserInfoForm
                onSaveUser={handleSaveUser}
                userData={userData}
                locationsList={locationsList}
              />
            </div>
          }
        />
        <Route
          path="/about"
          element={
            <div className="page-content-wrapper">
              <AboutPage />
            </div>
          }
        >
          <Route index element={<Team />} />
          <Route path="team" element={<Team />} />
          <Route path="company" element={<Company />} />
        </Route>
        <Route
          path="/contact"
          element={
            <div className="page-content-wrapper">
              <Contact />
            </div>
          }
        />
      </Routes>

      {/* Progressive Disclosure Modal */}
      <ModalOverlay modalData={modalData} onClose={handleCloseModal} />
    </div>
  );
}

export default App;