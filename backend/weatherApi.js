import mongoose from 'mongoose';

// ============================================================================
// 1. MONGODB SCHEMAS & MODELS (All Weather Reference & Live Data in MongoDB)
// ============================================================================

const regionSchema = new mongoose.Schema(
  {
    order: { type: Number, default: 0 },
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    states: { type: [String], default: [] },
    terrain: { type: String, default: 'plains' },
    normalMax: { type: Number, default: 38.0 },
    elevation: { type: String, default: '200m' }
  },
  { timestamps: true }
);

const seasonSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    months: { type: [Number], required: true },
    isHeatwaveSeason: { type: Boolean, default: false },
    period: { type: String }
  },
  { timestamps: true }
);

const wmoCodeSchema = new mongoose.Schema(
  {
    minCode: { type: Number, required: true },
    maxCode: { type: Number, required: true },
    condition: { type: String, required: true },
    state: { type: String, required: true },
    icon: { type: String, required: true }
  },
  { timestamps: true }
);

const alertRuleSchema = new mongoose.Schema(
  {
    ruleKey: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    severity: { type: String, required: true },
    colorAlert: { type: String, required: true },
    badge: { type: String, required: true },
    title: { type: String, required: true },
    action: { type: String, required: true }
  },
  { timestamps: true }
);

const stationSchema = new mongoose.Schema(
  {
    order: { type: Number, default: 0 },
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    state: { type: String, default: 'India' },
    eyebrow: { type: String },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    region: { type: String, required: true },
    regionName: { type: String, required: true },
    imdRegion: { type: String },
    imdRegionName: { type: String },
    terrain: { type: String, default: 'plains' },
    normalMax: { type: Number, default: 38.0 },
    elevation: { type: String, default: '100m' },
    departure: { type: Number, default: 0 },
    departureStr: { type: String, default: '+0.0°C' },
    climaticSeason: { type: String },
    time: { type: String, default: '--:--' },
    temp: { type: mongoose.Schema.Types.Mixed, default: '--' },
    condition: { type: String, default: 'Syncing IMD live telemetry...' },
    hl: { type: String, default: 'H: --° · L: --°' },
    weatherState: { type: String, default: 'sunny' },
    alert: { type: mongoose.Schema.Types.Mixed, default: null },
    aqi: { type: mongoose.Schema.Types.Mixed },
    wind: { type: mongoose.Schema.Types.Mixed },
    uv: { type: mongoose.Schema.Types.Mixed },
    sunset: { type: mongoose.Schema.Types.Mixed },
    feelsLike: { type: mongoose.Schema.Types.Mixed },
    precip: { type: mongoose.Schema.Types.Mixed },
    moon: { type: mongoose.Schema.Types.Mixed },
    humidity: { type: mongoose.Schema.Types.Mixed },
    visibility: { type: mongoose.Schema.Types.Mixed },
    pressure: { type: mongoose.Schema.Types.Mixed },
    hourly: { type: Array, default: [] },
    tenDay: { type: Array, default: [] },
    isLive: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Region = mongoose.model('Region', regionSchema);
export const Season = mongoose.model('Season', seasonSchema);
export const WmoCode = mongoose.model('WmoCode', wmoCodeSchema);
export const AlertRule = mongoose.model('AlertRule', alertRuleSchema);
export const Station = mongoose.model('Station', stationSchema);

// ============================================================================
// 2. MONGODB DATA FETCHERS (Catalog, Seasons, WMO Codes, Alert Rules, Regions)
// ============================================================================

export async function getClimaticSeason() {
  const month = new Date().getMonth();
  const seasonDoc = await Season.findOne({ months: month }, { _id: 0, __v: 0 }).lean();
  return (
    seasonDoc || {
      name: 'Post-Monsoon / Autumn',
      isHeatwaveSeason: false,
      code: 'POST_MONSOON',
      period: 'October – December'
    }
  );
}

export async function getCatalogFromDB() {
  const [regions, stations, season] = await Promise.all([
    Region.find({}, { _id: 0, __v: 0 }).sort({ order: 1 }).lean(),
    Station.find({}, { _id: 0, __v: 0 }).sort({ order: 1 }).lean(),
    getClimaticSeason()
  ]);

  return { regions, season, stations };
}

export function matchWmoCode(code, wmoList = []) {
  const matched = wmoList.find((item) => code >= item.minCode && code <= item.maxCode);
  return matched
    ? { condition: matched.condition, state: matched.state, icon: matched.icon }
    : { condition: 'Clear Sky', state: 'sunny', icon: 'sun' };
}

export async function resolveImdRegionForCity(name, state = '', lat = 20.5937, lon = 78.9629) {
  // 1. Check Station collection in MongoDB
  if (name) {
    const dbStation = await Station.findOne({
      name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }).lean();

    if (dbStation) {
      return {
        region: dbStation.region,
        regionName: dbStation.regionName,
        terrain: dbStation.terrain,
        normalMax: dbStation.normalMax,
        elevation: dbStation.elevation
      };
    }
  }

  // 2. Match against Region rules stored in MongoDB
  const regions = await Region.find({ id: { $ne: 'all' } }).sort({ order: 1 }).lean();
  const sLower = (state || '').toLowerCase();

  for (const reg of regions) {
    const stateMatched = (reg.states || []).some((kw) => sLower.includes(kw));
    if (stateMatched) {
      return {
        region: reg.id,
        regionName: reg.name,
        terrain: reg.terrain,
        normalMax: reg.normalMax,
        elevation: reg.elevation
      };
    }
  }

  // 3. Coordinate fallback using Region documents from MongoDB
  const fallbackId =
    lat > 30.5
      ? 'western-himalayas'
      : lon > 84.5 && lat > 20.0
      ? 'east-northeast'
      : lat < 18.0
      ? 'south-interior'
      : 'central';

  const fallbackReg = regions.find((r) => r.id === fallbackId) || regions[0] || {};
  return {
    region: fallbackReg.id || 'central',
    regionName: fallbackReg.name || 'Central India',
    terrain: fallbackReg.terrain || 'plains',
    normalMax: fallbackReg.normalMax || 41.0,
    elevation: fallbackReg.elevation || '320m'
  };
}

// ============================================================================
// 3. IMD HEATWAVE & ALERT EVALUATION (Using AlertRule Documents from MongoDB)
// ============================================================================

export function classifyImdHeatwave(maxTemp, normalTemp = 38.0, terrain = 'plains', rulesMap = {}) {
  const departure = Math.round((maxTemp - normalTemp) * 10) / 10;
  const departureStr = departure >= 0 ? `+${departure.toFixed(1)}°C` : `${departure.toFixed(1)}°C`;

  let ruleKey = 'NORMAL';

  if (terrain === 'hilly') {
    if (maxTemp >= 30.0 && departure > 6.4) ruleKey = 'SEVERE_HEATWAVE';
    else if (maxTemp >= 30.0 && departure >= 4.5) ruleKey = 'HEATWAVE';
    else if (maxTemp >= 27.0 && departure >= 3.0) ruleKey = 'HEAT_WATCH';
  } else if (terrain === 'coastal') {
    if (maxTemp >= 37.0 && departure > 6.4) ruleKey = 'SEVERE_HEATWAVE';
    else if (maxTemp >= 37.0 && departure >= 4.5) ruleKey = 'HEATWAVE';
    else if (maxTemp >= 35.0 && departure >= 3.0) ruleKey = 'HEAT_WATCH';
  } else {
    if (maxTemp >= 47.0 || (maxTemp >= 40.0 && departure > 6.4)) ruleKey = 'SEVERE_HEATWAVE';
    else if (maxTemp >= 45.0 || (maxTemp >= 40.0 && departure >= 4.5)) ruleKey = 'HEATWAVE';
    else if (maxTemp >= 42.0 || (maxTemp >= 38.0 && departure >= 3.0)) ruleKey = 'HEAT_WATCH';
  }

  const rule = rulesMap[ruleKey] || {
    category: ruleKey.replace('_', ' '),
    severity: 'advisory',
    colorAlert: 'green',
    badge: 'IMD GREEN · NO WARNING',
    title: 'NORMAL CLIMATOLOGICAL CONDITIONS',
    action: 'IMD Telemetry Analysis'
  };

  const bodyMap = {
    SEVERE_HEATWAVE: `Extreme temperature reaching ${maxTemp}°C (${departureStr} departure from normal ${normalTemp}°C). High probability of heat stroke across all age groups. Complete restriction on outdoor manual labor.`,
    HEATWAVE: `Ambient maximum temperature reaching ${maxTemp}°C (${departureStr} vs normal ${normalTemp}°C). High risk of heat illness for outdoor workers and vulnerable populations. Maintain active hydration.`,
    HEAT_WATCH: `Temperature of ${maxTemp}°C is ${departureStr} above climatological normal. Moderate heat conditions; vulnerable groups should avoid direct afternoon sun.`,
    NORMAL: `Current temperature ${maxTemp}°C is within normal seasonal bounds (${departureStr} from normal ${normalTemp}°C). No heatwave criteria triggered.`
  };

  return {
    category: rule.category,
    severity: rule.severity,
    colorAlert: rule.colorAlert,
    badge: rule.badge,
    title: rule.title,
    body: bodyMap[ruleKey],
    action: rule.action,
    departure,
    departureStr,
    normalTemp,
    terrain
  };
}

export function generateLiveAlert(
  temp,
  windSpeed,
  precip,
  aqiVal,
  wmoCode,
  normalTemp = 38.0,
  terrain = 'plains',
  rulesMap = {}
) {
  const heatwaveAlert = classifyImdHeatwave(temp, normalTemp, terrain, rulesMap);
  if (heatwaveAlert.category !== 'NORMAL') {
    return heatwaveAlert;
  }

  if (wmoCode >= 95 || (windSpeed > 55 && precip > 15)) {
    const r = rulesMap.SEVERE_MONSOON || {};
    return {
      ...r,
      body: `Severe convective storm with gusts up to ${Math.round(windSpeed)} km/h and heavy rainfall. High urban inundation risk.`,
      departure: 0,
      departureStr: '+0.0°C',
      normalTemp,
      terrain
    };
  }

  if (windSpeed > 40) {
    const r = rulesMap.GALE_WARNING || {};
    return {
      ...r,
      body: `Strong sustained winds of ${Math.round(windSpeed)} km/h. Coastal waters hazardous for small craft.`,
      departure: 0,
      departureStr: '+0.0°C',
      normalTemp,
      terrain
    };
  }

  if (aqiVal > 200) {
    const r = rulesMap.HAZARDOUS_AQI || {};
    return {
      ...r,
      body: `Ambient AQI index reaching ${aqiVal}. High PM2.5 particulate loading. Vulnerable populations must wear N95 filtration masks.`,
      departure: 0,
      departureStr: '+0.0°C',
      normalTemp,
      terrain
    };
  }

  if (precip > 15) {
    const r = rulesMap.HEAVY_RAIN || {};
    return {
      ...r,
      body: `Rainfall accumulation reaching ${precip}mm. Localized waterlogging possible on low-lying transit corridors.`,
      departure: 0,
      departureStr: '+0.0°C',
      normalTemp,
      terrain
    };
  }

  return heatwaveAlert;
}

// ============================================================================
// 4. GEOCODING SEARCH & LIVE WEATHER TELEMETRY (Synced with MongoDB)
// ============================================================================

export async function searchGeocodingCities(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=10&language=en&format=json&country_code=in`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return await Promise.all(
      data.results.map(async (item) => {
        const resolved = await resolveImdRegionForCity(
          item.name,
          item.admin1 || '',
          item.latitude,
          item.longitude
        );

        return {
          id: `${item.name.toLowerCase().replace(/\s+/g, '-')}-${item.id}`,
          name: item.name,
          state: item.admin1 || 'India',
          eyebrow: `IMD ${item.admin1 ? item.admin1.toUpperCase() : 'INDIA'} · ${resolved.terrain.toUpperCase()}`,
          lat: item.latitude,
          lon: item.longitude,
          country: 'India',
          region: resolved.region,
          regionName: resolved.regionName,
          imdRegion: resolved.region,
          imdRegionName: resolved.regionName,
          terrain: resolved.terrain,
          normalMax: resolved.normalMax,
          elevation: resolved.elevation || `${Math.round(item.elevation || 100)}m`
        };
      })
    );
  } catch (err) {
    console.error('Geocoding Search Error:', err);
    return [];
  }
}

export async function fetchLiveWeatherData(
  lat,
  lon,
  cityName,
  eyebrowName = 'IMD STATION',
  stationMeta = null
) {
  try {
    // Load reference tables & station baseline from MongoDB concurrently
    const orConditions = [];
    if (stationMeta?.id) orConditions.push({ id: stationMeta.id });
    if (cityName) {
      orConditions.push({
        name: { $regex: new RegExp(`^${cityName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
    }

    const [dbStation, wmoList, alertRulesList, currentSeason] = await Promise.all([
      orConditions.length > 0 ? Station.findOne({ $or: orConditions }).lean() : null,
      WmoCode.find().lean(),
      AlertRule.find().lean(),
      getClimaticSeason()
    ]);

    const rulesMap = Object.fromEntries(alertRulesList.map((r) => [r.ruleKey, r]));

    // Fetch live Open-Meteo & CPCB telemetry
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,visibility&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset&forecast_days=7&timezone=Asia/Kolkata`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10`;

    const [forecastRes, aqiData] = await Promise.all([
      fetch(forecastUrl),
      fetch(aqiUrl)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    ]);

    if (!forecastRes.ok) {
      throw new Error(`Forecast API HTTP ${forecastRes.status}`);
    }

    const data = await forecastRes.json();
    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    const temp = Math.round(current.temperature_2m ?? 28);
    const humidityVal = Math.round(current.relative_humidity_2m ?? 55);
    const feelsLikeVal = Math.round(current.apparent_temperature ?? temp);
    const windSpeed = Math.round(current.wind_speed_10m ?? 12);
    const windAngle = Math.round(current.wind_direction_10m ?? 180);
    const pressureVal = Math.round(current.surface_pressure ?? 1010);
    const precipVal = Math.round(current.precipitation ?? 0);
    const wmoCode = current.weather_code ?? 0;

    const parsedCond = matchWmoCode(wmoCode, wmoList);

    const visMeters = current.visibility ?? 8000;
    const visKm = (visMeters / 1000).toFixed(1);
    const visMiles = (visMeters * 0.000621371).toFixed(1);
    const visDesc =
      visMeters < 1000
        ? 'Dense fog or heavy industrial haze limiting visibility severely.'
        : visMeters < 4000
        ? 'Atmospheric haze and particulate load reducing visibility.'
        : visMeters < 8000
        ? 'Moderate urban haze affecting horizon clarity.'
        : 'Clear atmospheric visibility across the monitoring basin.';

    const usAqi = Math.round(aqiData?.current?.us_aqi ?? 55);
    const pm25 = Math.round(aqiData?.current?.pm2_5 ?? 18);
    const aqiStatus =
      usAqi > 300
        ? 'Severe / Hazardous AQI'
        : usAqi > 200
        ? 'Very Poor AQI'
        : usAqi > 100
        ? 'Poor Air Quality'
        : usAqi > 50
        ? 'Moderate Air Quality'
        : 'Satisfactory AQI';
    const aqiMarker =
      usAqi > 300 ? '95%' : usAqi > 200 ? '80%' : usAqi > 100 ? '60%' : usAqi > 50 ? '40%' : '30%';

    const uvVal = Math.round(daily.uv_index_max?.[0] ?? 7);
    const uvDesc =
      uvVal >= 11
        ? 'Extreme solar irradiance. Heat stroke index elevated.'
        : uvVal >= 8
        ? 'Very High UV level. Seek shade during peak hours (11am-3pm).'
        : 'High solar radiation level. Sun protection recommended.';
    const uvMarker = uvVal >= 11 ? '95%' : uvVal >= 8 ? '80%' : '60%';

    const formatTimeStr = (isoStr) =>
      isoStr ? new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

    const sunsetStr = formatTimeStr(daily.sunset?.[0]);
    const sunriseStr = `Sunrise tomorrow: ${formatTimeStr(daily.sunrise?.[1] || daily.sunrise?.[0])}`;

    const highTemp = Math.round(daily.temperature_2m_max?.[0] ?? temp + 3);
    const lowTemp = Math.round(daily.temperature_2m_min?.[0] ?? temp - 4);

    // Resolve station metadata from MongoDB Station or Region collections
    let resolvedMeta = dbStation;
    if (!resolvedMeta) {
      resolvedMeta = await resolveImdRegionForCity(
        cityName,
        stationMeta?.state || '',
        Number(lat),
        Number(lon)
      );
    }

    const normalMax = resolvedMeta.normalMax ?? 38.0;
    const terrain = resolvedMeta.terrain || 'plains';
    const regionId = resolvedMeta.region || 'central';
    const regionName = resolvedMeta.regionName || 'Central India';
    const elevation = resolvedMeta.elevation || '200m';

    const alertBanner = generateLiveAlert(
      highTemp,
      windSpeed,
      precipVal,
      usAqi,
      wmoCode,
      normalMax,
      terrain,
      rulesMap
    );

    // 24-Hour Forecast
    const hourlyItems = [];
    const hourlyTimes = hourly.time || [];
    const hourlyTemps = hourly.temperature_2m || [];
    const hourlyPops = hourly.precipitation_probability || [];
    const hourlyCodes = hourly.weather_code || [];

    const currentHourPrefix = (current.time || '').substring(0, 13);
    const foundIdx = currentHourPrefix ? hourlyTimes.findIndex((t) => t.startsWith(currentHourPrefix)) : 0;
    const startIdx = foundIdx !== -1 ? foundIdx : 0;

    for (let i = startIdx; i < Math.min(startIdx + 24, hourlyTimes.length); i++) {
      const hTimeStr = hourlyTimes[i];
      const hourPart = hTimeStr.includes('T') ? hTimeStr.split('T')[1] : '00:00';
      const hourNum = parseInt(hourPart.split(':')[0], 10);
      const hourLabel = i === startIdx ? 'Now' : `${String(hourNum).padStart(2, '0')}:00`;
      const hCond = matchWmoCode(hourlyCodes[i] ?? 0, wmoList);
      const iconName = (hourNum >= 20 || hourNum < 6) && hCond.icon === 'sun' ? 'night' : hCond.icon;

      hourlyItems.push({
        time: hourLabel,
        pop: `${Math.round(hourlyPops[i] ?? 0)}%`,
        temp: `${Math.round(hourlyTemps[i] ?? temp)}°`,
        icon: iconName
      });
    }

    // 7-Day Forecast
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rawDailyList = [];
    const dailyTimes = daily.time || [];
    const dailyMaxes = daily.temperature_2m_max || [];
    const dailyMins = daily.temperature_2m_min || [];
    const dailyPrecip = daily.precipitation_sum || [];
    const dailyCodes = daily.weather_code || [];

    let cityMinTemp = Infinity;
    let cityMaxTemp = -Infinity;

    for (let i = 0; i < Math.min(7, dailyTimes.length); i++) {
      const parts = (dailyTimes[i] || '').split('-').map(Number);
      const dDate = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
      const dayLabel = i === 0 ? 'Today' : daysOfWeek[dDate.getDay()];
      const dMax = Math.round(dailyMaxes[i] ?? temp + 2);
      const dMin = Math.round(dailyMins[i] ?? temp - 3);
      const dPrecip = dailyPrecip[i] ?? 0;
      const popPercent = dPrecip > 5 ? '80%' : dPrecip > 1 ? '40%' : dPrecip > 0.1 ? '20%' : '10%';
      const dWmo = matchWmoCode(dailyCodes[i] ?? 0, wmoList);

      if (dMin < cityMinTemp) cityMinTemp = dMin;
      if (dMax > cityMaxTemp) cityMaxTemp = dMax;

      rawDailyList.push({
        day: dayLabel,
        pop: popPercent,
        dMin,
        dMax,
        icon: dWmo.icon,
        condition: dWmo.condition
      });
    }

    const rangeMin = cityMinTemp - 3;
    const rangeMax = cityMaxTemp + 3;
    const totalRange = Math.max(1, rangeMax - rangeMin);

    const tenDayItems = rawDailyList.map((item) => {
      const fillLowNum = Math.max(0, Math.min(90, ((item.dMin - rangeMin) / totalRange) * 100));
      const fillWidthNum = Math.max(6, Math.min(100 - fillLowNum, ((item.dMax - item.dMin) / totalRange) * 100));
      return {
        day: item.day,
        pop: item.pop,
        low: `${item.dMin}°`,
        high: `${item.dMax}°`,
        fillLow: `${fillLowNum.toFixed(1)}%`,
        fillWidth: `${fillWidthNum.toFixed(1)}%`,
        icon: item.icon,
        condition: item.condition
      };
    });

    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stationId =
      (dbStation && dbStation.id) ||
      (stationMeta && stationMeta.id) ||
      cityName.toLowerCase().replace(/\s+/g, '-');

    const weatherPayload = {
      id: stationId,
      name: (dbStation && dbStation.name) || cityName,
      state: (dbStation && dbStation.state) || (stationMeta && stationMeta.state) || 'India',
      lat: Number(lat),
      lon: Number(lon),
      eyebrow:
        eyebrowName && eyebrowName !== 'IMD STATION'
          ? eyebrowName
          : `${regionName.toUpperCase()} · ${terrain.toUpperCase()}`,
      time: currentTimeStr,
      temp,
      condition: parsedCond.condition,
      hl: `H: ${highTemp}° · L: ${lowTemp}°`,
      weatherState: parsedCond.state,
      alert: alertBanner,
      imdRegion: regionId,
      imdRegionName: regionName,
      region: regionId,
      regionName: regionName,
      terrain,
      normalMax,
      elevation,
      departure: alertBanner.departure,
      departureStr: alertBanner.departureStr,
      climaticSeason: currentSeason.name,
      aqi: {
        val: usAqi,
        status: aqiStatus,
        desc: `PM2.5 concentration is ${pm25} µg/m³. CPCB & Open-Meteo telemetry synced.`,
        marker: aqiMarker
      },
      wind: {
        speed: `${windSpeed} km/h`,
        dirText: `Live Wind · Angle ${windAngle}°`,
        angle: windAngle
      },
      uv: { val: uvVal, desc: uvDesc, marker: uvMarker },
      sunset: { time: sunsetStr, sunrise: sunriseStr },
      feelsLike: {
        val: `${feelsLikeVal}°`,
        desc: `Relative humidity is ${humidityVal}%, with heat index computed at ${feelsLikeVal}°C.`
      },
      precip: {
        val: `${precipVal} mm`,
        desc: `Precipitation rate of ${precipVal}mm over active recording window.`
      },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: {
        val: `${humidityVal}%`,
        dew: `The dew point is ${Math.round(temp - ((100 - humidityVal) / 5))}° right now.`
      },
      visibility: {
        val: `${visKm} km`,
        valMiles: `${visMiles} mi`,
        desc: visDesc
      },
      pressure: { val: `${pressureVal} hPa`, desc: 'IMD Barometric surface pressure observation.' },
      hourly: hourlyItems,
      tenDay: tenDayItems,
      isLive: true
    };

    // Update the station document in MongoDB
    await Station.findOneAndUpdate(
      { id: stationId },
      { $set: weatherPayload },
      { upsert: true, new: true }
    );

    return weatherPayload;
  } catch (err) {
    console.error('Fetch Live Weather Error:', err);
    return null;
  }
}
