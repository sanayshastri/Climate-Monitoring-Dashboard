import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getStationRegion = (loc) => {
  if (!loc) return 'central';
  return loc.region || loc.imdRegion || 'central';
};

const getStationRegionName = (loc) => {
  if (!loc) return 'IMD Station';
  return loc.regionName || loc.imdRegionName || loc.eyebrow || 'IMD Station';
};

export default function Sidebar({
  locationsData,
  activeLocationId,
  onSelectLocation,
  isCollapsed,
  onToggleCollapse,
  userData,
  onNavigateObserverForm,
  formatTempStr,
  unit,
  onAddLiveCity,
  selectedImdRegion,
  onSelectImdRegion,
  imdRegions = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse]);

  // Debounced Backend Geocoding API Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/weather/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        const results = res.ok ? await res.json() : [];
        if (isMounted) {
          setSearchResults(Array.isArray(results) ? results : []);
          setIsSearchingApi(false);
        }
      } catch (err) {
        console.error('Backend City Search Error:', err);
        if (isMounted) {
          setSearchResults([]);
          setIsSearchingApi(false);
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setIsSearchingApi(false);
    }
  };

  const localFiltered = locationsData.filter((loc) => {
    const locRegion = getStationRegion(loc);
    const locRegionName = getStationRegionName(loc);

    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.state || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      locRegionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.condition || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion =
      !selectedImdRegion ||
      selectedImdRegion === 'all' ||
      locRegion === selectedImdRegion;

    return matchesSearch && matchesRegion;
  });

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-top-bar">
          <div className="app-brand">
            <svg className="brand-icon" viewBox="0 0 24 24">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <div>
              <span className="brand-title">Climate Guard</span>
              <div className="brand-sub-badge">IMD METEOROLOGICAL NETWORK</div>
            </div>
          </div>
          <button
            className="sidebar-toggle-btn"
            id="collapse-sidebar-btn"
            onClick={onToggleCollapse}
            title="Toggle Sidebar (⌘S)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <path d="M15 10l-3 3 3 3" />
            </svg>
          </button>
        </div>

        {userData && userData.name && (
          <div className="observer-sidebar-badge" onClick={onNavigateObserverForm}>
            <span className="badge-dot">●</span>
            <span>Observer: <strong>{userData.name}</strong> ({userData.location})</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search Indian cities & stations..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* IMD 7-Region Filter Bar */}
        <div className="imd-region-filter-bar">
          <div className="filter-label-row">
            <span>IMD ZONAL FILTER ({localFiltered.length} CITIES &amp; STATIONS)</span>
          </div>
          <div className="region-pills-scroll">
            {imdRegions.map((reg) => {
              const count =
                reg.id === 'all'
                  ? locationsData.length
                  : locationsData.filter((l) => getStationRegion(l) === reg.id).length;
              return (
                <button
                  key={reg.id}
                  className={`region-pill-btn ${selectedImdRegion === reg.id ? 'active' : ''}`}
                  onClick={() => onSelectImdRegion && onSelectImdRegion(reg.id)}
                >
                  <span>{reg.name}</span>
                  <span className="region-pill-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Location List */}
      <div className="location-list" id="location-list">
        {/* Live Search API Results section */}
        {searchQuery.trim().length >= 2 && (
          <div className="api-search-section">
            <div className="search-section-title">
              {isSearchingApi ? 'Searching Indian Cities & Stations...' : 'Indian Cities & Stations'}
            </div>
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="search-result-card"
                onClick={() => {
                  onAddLiveCity(result);
                  setSearchQuery('');
                }}
              >
                <div>
                  <div className="search-result-name">{result.name}</div>
                  <div className="search-result-country">
                    {result.state ? `${result.state} · ` : ''}{result.eyebrow}
                  </div>
                </div>
                <div className="search-result-add-badge">+ Add City</div>
              </div>
            ))}
          </div>
        )}

        {/* Local Saved Cities Section */}
        {localFiltered.length === 0 ? (
          <div className="no-stations-found">
            No stations found in {imdRegions.find((r) => r.id === selectedImdRegion)?.name || 'this region'}.
          </div>
        ) : (
          localFiltered.map((loc) => {
            const isActive = loc.id === activeLocationId;
            const alertColor = loc.alert?.colorAlert || 'green';
            return (
              <div
                key={loc.id}
                className={`location-card ${isActive ? 'active' : ''}`}
                onClick={() => onSelectLocation(loc.id)}
              >
                <div className="location-card-top">
                  <div>
                    <div className="location-name-row">
                      <span className={`station-status-dot dot-${alertColor}`}>●</span>
                      <span className="location-name">{loc.name}</span>
                      {loc.terrain && (
                        <span className={`terrain-badge ${loc.terrain}`}>
                          {loc.terrain.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="location-region-tag">
                      {getStationRegionName(loc)}
                    </div>
                    {loc.alert && loc.alert.category !== 'NORMAL' && (
                      <div className={`warning-badge ${loc.alert.severity} badge-${alertColor}`}>
                        {loc.alert.badge}
                      </div>
                    )}
                  </div>
                  <div className="location-temp-col">
                    <div className="location-temp">{formatTempStr(loc.temp, unit)}°</div>
                  </div>
                </div>
                <div className="location-card-bottom">
                  <div className="location-condition">{loc.condition}</div>
                  <div className="location-hl">
                    {formatTempStr((loc.hl || '').split('·')[0], unit)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
