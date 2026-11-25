export default function ModalOverlay({ modalData, onClose }) {
  if (!modalData) return null;

  const { type, location } = modalData;

  const renderModalBody = () => {
    if (!location) return null;

    if (type === 'imd-climatology' || type === 'climatology') {
      const departureVal = location.departure ?? 0;
      const normalMax = location.normalMax ?? 38.0;
      const currentTemp = location.temp ?? '--';
      const terrain = (location.terrain || 'plains').toUpperCase();

      return (
        <div className="imd-modal-content">
          <div className="imd-modal-station-header">
            <div>
              <h4>{location.name} Station ({location.state || 'India'})</h4>
              <span className="station-sub-text">
                IMD Region: <strong>{location.imdRegionName || location.eyebrow}</strong> · Elevation: {location.elevation || '100m'}
              </span>
            </div>
            <span className={`terrain-pill-large ${location.terrain || 'plains'}`}>
              {terrain} STATION
            </span>
          </div>

          <div className="imd-metrics-summary-grid">
            <div className="imd-summary-stat-box">
              <span className="stat-label">Observed Max Temp</span>
              <span className="stat-value">{currentTemp}°C</span>
              <span className="stat-hint">Live Synoptic Telemetry</span>
            </div>

            <div className="imd-summary-stat-box">
              <span className="stat-label">30-Yr Climatological Normal</span>
              <span className="stat-value">{normalMax}°C</span>
              <span className="stat-hint">IMD Long-Term Baseline</span>
            </div>

            <div className={`imd-summary-stat-box ${departureVal >= 4.5 ? 'alert-box' : ''}`}>
              <span className="stat-label">Departure from Normal (ΔT)</span>
              <span className={`stat-value ${departureVal >= 0 ? 'text-pos' : 'text-neg'}`}>
                {location.departureStr || `${departureVal > 0 ? '+' : ''}${departureVal}°C`}
              </span>
              <span className="stat-hint">
                {departureVal >= 6.4 ? 'Severe Heatwave Anomaly' : departureVal >= 4.5 ? 'Heatwave Anomaly' : 'Normal Seasonal Variation'}
              </span>
            </div>
          </div>

          <div className="imd-criteria-table-card">
            <h5>Official IMD Heatwave Declaration Criteria</h5>
            <table className="imd-rules-table">
              <thead>
                <tr>
                  <th>Terrain Category</th>
                  <th>Heatwave Criteria (Orange)</th>
                  <th>Severe Heatwave Criteria (Red)</th>
                </tr>
              </thead>
              <tbody>
                <tr className={location.terrain === 'plains' ? 'active-row' : ''}>
                  <td><strong>Plains</strong></td>
                  <td>Max Temp ≥ 40°C &amp; Departure ≥ +4.5°C to +6.4°C (or Max Temp ≥ 45°C)</td>
                  <td>Departure &gt; +6.4°C (or Max Temp ≥ 47°C)</td>
                </tr>
                <tr className={location.terrain === 'coastal' ? 'active-row' : ''}>
                  <td><strong>Coastal</strong></td>
                  <td>Max Temp ≥ 37°C &amp; Departure ≥ +4.5°C</td>
                  <td>Departure &gt; +6.4°C &amp; Max Temp ≥ 37°C</td>
                </tr>
                <tr className={location.terrain === 'hilly' ? 'active-row' : ''}>
                  <td><strong>Hilly Regions</strong></td>
                  <td>Max Temp ≥ 30°C &amp; Departure ≥ +4.5°C</td>
                  <td>Departure &gt; +6.4°C &amp; Max Temp ≥ 30°C</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="imd-data-source-footer">
            <span className="source-label">METEOROLOGICAL DATA REPOSITORY:</span>
            <span>
              India Meteorological Department (IMD) Pune — Daily 0.5° × 0.5° Gridded Temperature Dataset (
              <a href="https://imdpune.gov.in/lrfindex.php" target="_blank" rel="noopener noreferrer">
                imdpune.gov.in/lrfindex.php
              </a>
              )
            </span>
          </div>
        </div>
      );
    } else if (type === 'seven-day' || type === 'ten-day') {
      return (
        <div>
          <p>Extended 7-day meteorological forecast model for <strong>{location.name}</strong> ({location.imdRegionName}).</p>
          <p style={{ marginTop: '10px' }}>
            Current synoptic condition: <em>{location.condition}</em> with historical normal max of <strong>{location.normalMax || 38}°C</strong>.
          </p>
          <div style={{ marginTop: '15px' }}>
            <button className="primary-action-btn" onClick={() => renderModalBody()}>
              Inspect Climatological Departure
            </button>
          </div>
        </div>
      );
    } else if (type === 'aqi') {
      return (
        <div>
          <p><strong>Central Pollution Control Board (CPCB) &amp; Open-Meteo AQI: {location?.aqi?.val}</strong> — {location?.aqi?.status}</p>
          <p style={{ marginTop: '10px' }}>{location?.aqi?.desc}</p>
          <p style={{ marginTop: '10px' }}>
            Pollutant telemetry tracking PM2.5, PM10, Nitrogen Dioxide (NO₂), and Ozone (O₃) concentrations across the {location.name} urban air basin.
          </p>
        </div>
      );
    } else if (type === 'map') {
      return (
        <div>
          <p><strong>Interactive GIS Heatmap &amp; Meteorological Radar (ECMWF)</strong></p>
          <p style={{ marginTop: '10px' }}>
            High-resolution GIS meteorological simulation and live satellite telemetry displaying land surface temperature (LST), apparent heat index, surface wind streamlines, and precipitation bands for the {location.name} urban sector.
          </p>
        </div>
      );
    }

    return (
      <div>
        <p>Detailed telemetry and historical distribution for <strong>{type.toUpperCase()}</strong> at {location.name} ({location.imdRegionName}).</p>
        <p style={{ marginTop: '10px' }}>Current telemetry status matches active IMD monitoring standards.</p>
      </div>
    );
  };

  const formattedType =
    type === 'imd-climatology' || type === 'climatology'
      ? 'IMD CLIMATOLOGICAL BASELINE & HEATWAVE ANALYSIS'
      : type === 'seven-day' || type === 'ten-day'
      ? '7-DAY IMD FORECAST MODEL'
      : type.toUpperCase().replace('-', ' ');

  return (
    <div className={`modal-overlay ${modalData ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <h3 className="modal-title">
          {type ? `${formattedType} — ${location?.name}` : 'IMD Telemetry Overview'}
        </h3>
        <div className="modal-body">
          {renderModalBody()}
        </div>
      </div>
    </div>
  );
}
