import { useState } from 'react';

export default function GisHeatmap({
  activeLocationName = 'Mumbai',
  lat = 19.0760,
  lon = 72.8777,
  dragHandle = null
}) {
  const [activeLayer, setActiveLayer] = useState('temp'); // 'temp' | 'heatIndex' | 'wind' | 'satellite' | 'rain'

  // Official Windy GIS Meteorological Heatmap API Embed URL
  const windyMapUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=%C2%B0C&metricWind=default&zoom=11&overlay=${activeLayer}&product=ecmwf&level=surface&lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&marker=true&pressure=true`;

  return (
    <div className="glass-card gis-heatmap-card" id="gis-heatmap-card">
      {/* Card Header & GIS API Layer Switcher */}
      <div className="gis-card-header">
        <div className="card-title">
          <div className="card-title-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>GIS HEATMAP (ECMWF API SERVICE)</span>
          </div>
        </div>

        {/* API Layer Switcher */}
        <div className="gis-layer-switcher">
          <button
            type="button"
            className={`gis-layer-btn ${activeLayer === 'temp' ? 'active' : ''}`}
            onClick={() => setActiveLayer('temp')}
            title="ECMWF High-Resolution Temperature Heatmap API"
          >
            LST THERMAL
          </button>
          <button
            type="button"
            className={`gis-layer-btn ${activeLayer === 'heatIndex' ? 'active' : ''}`}
            onClick={() => setActiveLayer('heatIndex')}
            title="ECMWF Apparent Heat Index & Humidity Stress API"
          >
            HEAT INDEX
          </button>
          <button
            type="button"
            className={`gis-layer-btn ${activeLayer === 'wind' ? 'active' : ''}`}
            onClick={() => setActiveLayer('wind')}
            title="Surface Wind Streamlines & Thermal Dispersion API"
          >
            SURFACE WIND
          </button>
          <button
            type="button"
            className={`gis-layer-btn ${activeLayer === 'satellite' ? 'active' : ''}`}
            onClick={() => setActiveLayer('satellite')}
            title="Real-time Satellite Infrared Thermal Radiance API"
          >
            SATELLITE IR
          </button>
          <button
            type="button"
            className={`gis-layer-btn ${activeLayer === 'rain' ? 'active' : ''}`}
            onClick={() => setActiveLayer('rain')}
            title="Doppler Radar & Precipitation Bands API"
          >
            RADAR RAIN
          </button>
        </div>

        {dragHandle}
      </div>

      {/* Map Display Viewport */}
      <div className="gis-map-viewport">
        <div className="gis-iframe-container">
          <iframe
            key={`${activeLocationName}-${activeLayer}-${lat}-${lon}`}
            src={windyMapUrl}
            title={`GIS Meteorological Heatmap for ${activeLocationName}`}
            className="gis-api-iframe"
            allow="geolocation"
            loading="eager"
          />
        </div>

        {/* Top Floating Bar: City Indicator */}
        <div className="gis-top-floating-bar">
          <div className="gis-city-tag">
            <span className="gis-city-pulse"></span>
            <span>{activeLocationName.toUpperCase()} · 11X URBAN ZOOM</span>
          </div>

          <div className="gis-view-actions">
            <a
              href={`https://www.windy.com/?${lat},${lon},11`}
              target="_blank"
              rel="noopener noreferrer"
              className="gis-action-chip"
              title="Open full-screen interactive GIS Map"
            >
              FULLSCREEN GIS
            </a>
          </div>
        </div>
      </div>

      {/* Card Footer Subtext with Real API Attribution */}
      <div className="card-subtext gis-footer-subtext">
        Real-time GIS Heatmap generated and served directly by <strong>ECMWF GIS Meteorological API</strong>. Centered on {activeLocationName} with 11x city focus.
      </div>
    </div>
  );
}
