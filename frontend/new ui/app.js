/* ==========================================================================
   Climate Warning Dashboard & Weather Landing Page — Application Logic
   Handles: Canvas Weather Animation Engine, Live Location Switching,
   Hazard Radar Canvas Rendering, Sidebar Controls, and Progressive Disclosure Modals
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. DATA MODEL FOR LOCATIONS
  // ==========================================================================
  const locationsData = [
    {
      id: 'mumbai',
      name: 'Mumbai',
      eyebrow: 'MY LOCATION',
      time: '14:18 PM',
      temp: 29,
      condition: 'Torrential Rain & Monsoon Storm',
      hl: 'H: 29° · L: 27°',
      weatherState: 'thunderstorm', // 'rain', 'thunderstorm', 'sunny', 'cloudy', 'drizzle'
      alert: {
        severity: 'extreme', // 'extreme', 'warning', 'watch', 'advisory'
        badge: 'RED ALERT',
        title: 'EXTREME FLASH FLOOD & MONSOON WARNING',
        body: 'Severe rainfall exceeding 180mm expected within next 6 hours. High risk of urban inundation and coastal storm surges.',
        action: 'Evacuation & Safety Plan'
      },
      aqi: { val: 63, status: 'Moderate Air Quality', desc: 'PM2.5 concentration is 18.2 µg/m³. Sensitive groups should limit prolonged outdoor exertion.', marker: '35%' },
      wind: { speed: '38 km/h', dirText: 'Southwest · Gusts to 54 km/h', angle: 225 },
      uv: { val: 3, desc: 'Moderate protection required. Wear sunglasses and sunblock.', marker: '30%' },
      sunset: { time: '7:14 PM', sunrise: 'Sunrise tomorrow: 6:08 AM' },
      feelsLike: { val: '33°', desc: 'High relative humidity is making it feel significantly warmer than actual temperature.' },
      precip: { val: '42 mm', desc: 'Heavy rain accumulation over past 24h. Expected +60mm in next 12 hours.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '92%', dew: 'The dew point is 26° right now. Near saturation level.' },
      visibility: { val: '3.2 km', desc: 'Heavy rain mist and clouds are reducing visibility significantly. Drive with caution.' },
      pressure: { val: '1004 hPa', desc: 'Rapidly falling pressure indicating severe convective storm activity.' },
      hourly: [
        { time: 'Now', pop: '95%', temp: '29°', icon: 'rain' },
        { time: '15:00', pop: '90%', temp: '29°', icon: 'thunder' },
        { time: '16:00', pop: '85%', temp: '28°', icon: 'thunder' },
        { time: '17:00', pop: '70%', temp: '28°', icon: 'rain' },
        { time: '18:00', pop: '60%', temp: '27°', icon: 'rain' },
        { time: '19:00', pop: '40%', temp: '27°', icon: 'cloud' },
        { time: '20:00', pop: '30%', temp: '27°', icon: 'cloud' },
        { time: '21:00', pop: '20%', temp: '27°', icon: 'cloud' },
        { time: '22:00', pop: '15%', temp: '26°', icon: 'cloud' },
        { time: '23:00', pop: '10%', temp: '26°', icon: 'night' }
      ],
      tenDay: [
        { day: 'Today', pop: '95%', low: '27°', high: '29°', fillLow: '20%', fillWidth: '60%' },
        { day: 'Fri', pop: '80%', low: '26°', high: '30°', fillLow: '25%', fillWidth: '55%' },
        { day: 'Sat', pop: '65%', low: '26°', high: '31°', fillLow: '30%', fillWidth: '50%' },
        { day: 'Sun', pop: '40%', low: '27°', high: '32°', fillLow: '40%', fillWidth: '45%' },
        { day: 'Mon', pop: '20%', low: '27°', high: '33°', fillLow: '45%', fillWidth: '40%' },
        { day: 'Tue', pop: '30%', low: '26°', high: '32°', fillLow: '35%', fillWidth: '50%' },
        { day: 'Wed', pop: '50%', low: '26°', high: '31°', fillLow: '30%', fillWidth: '55%' },
        { day: 'Thu', pop: '70%', low: '25°', high: '29°', fillLow: '15%', fillWidth: '65%' },
        { day: 'Fri', pop: '85%', low: '25°', high: '28°', fillLow: '10%', fillWidth: '70%' },
        { day: 'Sat', pop: '60%', low: '26°', high: '30°', fillLow: '25%', fillWidth: '60%' }
      ]
    },
    {
      id: 'dubai',
      name: 'Dubai',
      eyebrow: 'PERSIAN GULF',
      time: '12:48 PM',
      temp: 43,
      condition: 'Extreme Desert Heat & Dust Haze',
      hl: 'H: 44° · L: 35°',
      weatherState: 'sunny',
      alert: {
        severity: 'extreme',
        badge: 'EXTREME HEAT ALERT',
        title: 'RECORD DESERT HEATWAVE WARNING',
        body: 'Heat index reaching 52°C. Severe danger of heatstroke during midday hours. Outdoor labor restricted.',
        action: 'Hydration & Cooling Protocol'
      },
      aqi: { val: 245, status: 'Very Unhealthy Air Quality', desc: 'PM10 mineral dust particles suspended in lower atmosphere. Limit outdoor exposure.', marker: '75%' },
      wind: { speed: '28 km/h', dirText: 'North-Northwest · Blowing dust', angle: 337 },
      uv: { val: 11, desc: 'Extreme UV level. Protection mandatory; skin burn time under 10 minutes.', marker: '95%' },
      sunset: { time: '7:08 PM', sunrise: 'Sunrise tomorrow: 5:40 AM' },
      feelsLike: { val: '52°', desc: 'High humidity over Persian Gulf elevating perceived heat index to dangerous thresholds.' },
      precip: { val: '0 mm', desc: 'Arid desert climate; no rain recorded over last 90 days.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '62%', dew: 'The dew point is 28° right now.' },
      visibility: { val: '4.0 km', desc: 'Dust haze reducing sky clarity across coastal towers.' },
      pressure: { val: '998 hPa', desc: 'Thermal low pressure centered over Arabian Peninsula.' },
      hourly: [
        { time: 'Now', pop: '0%', temp: '43°', icon: 'sun' },
        { time: '13:00', pop: '0%', temp: '44°', icon: 'sun' },
        { time: '14:00', pop: '0%', temp: '44°', icon: 'sun' },
        { time: '15:00', pop: '0%', temp: '43°', icon: 'sun' },
        { time: '16:00', pop: '0%', temp: '42°', icon: 'sun' },
        { time: '17:00', pop: '0%', temp: '40°', icon: 'sun' },
        { time: '18:00', pop: '0%', temp: '38°', icon: 'sun' },
        { time: '19:00', pop: '0%', temp: '37°', icon: 'night' },
        { time: '20:00', pop: '0%', temp: '36°', icon: 'night' },
        { time: '21:00', pop: '0%', temp: '35°', icon: 'night' }
      ],
      tenDay: [
        { day: 'Today', pop: '0%', low: '35°', high: '44°', fillLow: '75%', fillWidth: '25%' },
        { day: 'Fri', pop: '0%', low: '34°', high: '43°', fillLow: '70%', fillWidth: '30%' },
        { day: 'Sat', pop: '0%', low: '33°', high: '42°', fillLow: '65%', fillWidth: '35%' },
        { day: 'Sun', pop: '0%', low: '34°', high: '43°', fillLow: '70%', fillWidth: '30%' },
        { day: 'Mon', pop: '0%', low: '35°', high: '45°', fillLow: '75%', fillWidth: '25%' },
        { day: 'Tue', pop: '0%', low: '34°', high: '44°', fillLow: '70%', fillWidth: '30%' },
        { day: 'Wed', pop: '0%', low: '33°', high: '42°', fillLow: '65%', fillWidth: '35%' },
        { day: 'Thu', pop: '0%', low: '33°', high: '41°', fillLow: '65%', fillWidth: '35%' },
        { day: 'Fri', pop: '0%', low: '32°', high: '40°', fillLow: '60%', fillWidth: '40%' },
        { day: 'Sat', pop: '0%', low: '33°', high: '42°', fillLow: '65%', fillWidth: '35%' }
      ]
    },
    {
      id: 'new-delhi',
      name: 'New Delhi',
      eyebrow: 'CAPITAL REGION',
      time: '14:18 PM',
      temp: 34,
      condition: 'Severe Heatwave & Hazardous Air',
      hl: 'H: 36° · L: 28°',
      weatherState: 'sunny',
      alert: {
        severity: 'warning',
        badge: 'ORANGE WATCH',
        title: 'SEVERE HEATWAVE & AIR QUALITY WATCH',
        body: 'Ambient AQI exceeding 340. Extreme heat advisory in effect with index reaching 42°C.',
        action: 'View Cooling Centers'
      },
      aqi: { val: 342, status: 'Hazardous Air Quality', desc: 'PM2.5 is 290 µg/m³. Everyone should avoid all outdoor physical activity.', marker: '85%' },
      wind: { speed: '12 km/h', dirText: 'West · Light dust haze', angle: 270 },
      uv: { val: 9, desc: 'Very High UV level. Sun protection essential between 10am and 4pm.', marker: '80%' },
      sunset: { time: '7:02 PM', sunrise: 'Sunrise tomorrow: 5:48 AM' },
      feelsLike: { val: '39°', desc: 'Radiant heat from urban concrete surfaces elevating perceived temperature.' },
      precip: { val: '0 mm', desc: 'No precipitation reported over last 24h. Arid conditions prevailing.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '48%', dew: 'The dew point is 21° right now.' },
      visibility: { val: '1.5 km', desc: 'Dense smog envelope significantly reducing horizontal visibility.' },
      pressure: { val: '1010 hPa', desc: 'Stable high-pressure ridge maintaining heat dome.' },
      hourly: [
        { time: 'Now', pop: '0%', temp: '34°', icon: 'sun' },
        { time: '15:00', pop: '0%', temp: '36°', icon: 'sun' },
        { time: '16:00', pop: '0%', temp: '35°', icon: 'sun' },
        { time: '17:00', pop: '5%', temp: '34°', icon: 'cloud' },
        { time: '18:00', pop: '5%', temp: '33°', icon: 'cloud' },
        { time: '19:00', pop: '0%', temp: '31°', icon: 'night' },
        { time: '20:00', pop: '0%', temp: '30°', icon: 'night' },
        { time: '21:00', pop: '0%', temp: '29°', icon: 'night' },
        { time: '22:00', pop: '0%', temp: '29°', icon: 'night' },
        { time: '23:00', pop: '0%', temp: '28°', icon: 'night' }
      ],
      tenDay: [
        { day: 'Today', pop: '0%', low: '28°', high: '36°', fillLow: '50%', fillWidth: '45%' },
        { day: 'Fri', pop: '5%', low: '29°', high: '37°', fillLow: '55%', fillWidth: '40%' },
        { day: 'Sat', pop: '10%', low: '29°', high: '38°', fillLow: '55%', fillWidth: '45%' },
        { day: 'Sun', pop: '20%', low: '28°', high: '36°', fillLow: '50%', fillWidth: '45%' },
        { day: 'Mon', pop: '35%', low: '27°', high: '34°', fillLow: '45%', fillWidth: '40%' },
        { day: 'Tue', pop: '50%', low: '27°', high: '33°', fillLow: '45%', fillWidth: '35%' },
        { day: 'Wed', pop: '40%', low: '26°', high: '32°', fillLow: '40%', fillWidth: '40%' },
        { day: 'Thu', pop: '20%', low: '27°', high: '34°', fillLow: '45%', fillWidth: '40%' },
        { day: 'Fri', pop: '10%', low: '28°', high: '35°', fillLow: '50%', fillWidth: '40%' },
        { day: 'Sat', pop: '5%', low: '28°', high: '36°', fillLow: '50%', fillWidth: '45%' }
      ]
    },
    {
      id: 'paris',
      name: 'Paris',
      eyebrow: 'ILE-DE-FRANCE',
      time: '10:48 AM',
      temp: 33,
      condition: 'Heatwave & Bright Sunshine',
      hl: 'H: 34° · L: 22°',
      weatherState: 'sunny',
      alert: {
        severity: 'watch',
        badge: 'HEATWAVE WATCH',
        title: 'METEO-FRANCE HEATWAVE ALERT',
        body: 'High temperatures persisting across Ile-de-France. Misting stations active in city plazas.',
        action: 'Urban Cooling Map'
      },
      aqi: { val: 78, status: 'Moderate Air Quality', desc: 'Ozone accumulation during peak sunlight hours. Limit heavy exercise in afternoon.', marker: '40%' },
      wind: { speed: '14 km/h', dirText: 'East-Southeast · Mild breeze', angle: 112 },
      uv: { val: 8, desc: 'High UV index. Sun protection strongly recommended.', marker: '75%' },
      sunset: { time: '9:22 PM', sunrise: 'Sunrise tomorrow: 6:24 AM' },
      feelsLike: { val: '35°', desc: 'Moderate humidity elevating perceived temperature.' },
      precip: { val: '0 mm', desc: 'Clear conditions; no rainfall over last 24h.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '45%', dew: 'The dew point is 18° right now.' },
      visibility: { val: '10.0 km', desc: 'Clear sky visibility across Seine riverfront.' },
      pressure: { val: '1014 hPa', desc: 'High pressure system dominating western Europe.' },
      hourly: [
        { time: 'Now', pop: '0%', temp: '33°', icon: 'sun' },
        { time: '11:00', pop: '0%', temp: '34°', icon: 'sun' },
        { time: '12:00', pop: '0%', temp: '34°', icon: 'sun' },
        { time: '13:00', pop: '0%', temp: '34°', icon: 'sun' },
        { time: '14:00', pop: '0%', temp: '33°', icon: 'sun' },
        { time: '15:00', pop: '0%', temp: '32°', icon: 'sun' },
        { time: '16:00', pop: '0%', temp: '31°', icon: 'sun' },
        { time: '17:00', pop: '0%', temp: '30°', icon: 'sun' },
        { time: '18:00', pop: '0%', temp: '28°', icon: 'sun' },
        { time: '19:00', pop: '0%', temp: '26°', icon: 'night' }
      ],
      tenDay: [
        { day: 'Today', pop: '0%', low: '22°', high: '34°', fillLow: '45%', fillWidth: '45%' },
        { day: 'Fri', pop: '10%', low: '21°', high: '32°', fillLow: '40%', fillWidth: '45%' },
        { day: 'Sat', pop: '20%', low: '20°', high: '30°', fillLow: '35%', fillWidth: '45%' },
        { day: 'Sun', pop: '30%', low: '19°', high: '28°', fillLow: '30%', fillWidth: '45%' },
        { day: 'Mon', pop: '15%', low: '18°', high: '27°', fillLow: '25%', fillWidth: '45%' },
        { day: 'Tue', pop: '5%', low: '18°', high: '28°', fillLow: '25%', fillWidth: '45%' },
        { day: 'Wed', pop: '0%', low: '19°', high: '29°', fillLow: '30%', fillWidth: '45%' },
        { day: 'Thu', pop: '0%', low: '20°', high: '31°', fillLow: '35%', fillWidth: '45%' },
        { day: 'Fri', pop: '10%', low: '21°', high: '32°', fillLow: '40%', fillWidth: '45%' },
        { day: 'Sat', pop: '15%', low: '21°', high: '33°', fillLow: '40%', fillWidth: '45%' }
      ]
    },
    {
      id: 'tokyo',
      name: 'Tokyo',
      eyebrow: 'KANTO REGION',
      time: '17:48 PM',
      temp: 24,
      condition: 'Approaching Typhoon & Gale Winds',
      hl: 'H: 25° · L: 21°',
      weatherState: 'rain',
      alert: {
        severity: 'extreme',
        badge: 'TYPHOON WARNING',
        title: 'CAT 3 TYPHOON APPROACHING COAST',
        body: 'Gale force wind gusts up to 110 km/h. Coastal evacuations initiated for low-lying bays.',
        action: 'Coastal Shelter Map'
      },
      aqi: { val: 28, status: 'Good Air Quality', desc: 'Air quality is excellent due to strong atmospheric scrubbing.', marker: '15%' },
      wind: { speed: '65 km/h', dirText: 'East-Northeast · Severe Gusts 110 km/h', angle: 67 },
      uv: { val: 2, desc: 'Low UV index under dense cyclone cloud deck.', marker: '15%' },
      sunset: { time: '6:42 PM', sunrise: 'Sunrise tomorrow: 4:54 AM' },
      feelsLike: { val: '22°', desc: 'Strong wind chill effect reducing perceived temperature.' },
      precip: { val: '88 mm', desc: 'Torrential typhoon rainfall bands hitting eastern seaboard.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '95%', dew: 'The dew point is 23° right now.' },
      visibility: { val: '2.8 km', desc: 'Blowing rain spray severely obstructing maritime and road visibility.' },
      pressure: { val: '988 hPa', desc: 'Extremely deep pressure drop near cyclone core.' },
      hourly: [
        { time: 'Now', pop: '99%', temp: '24°', icon: 'thunder' },
        { time: '18:00', pop: '95%', temp: '24°', icon: 'rain' },
        { time: '19:00', pop: '90%', temp: '23°', icon: 'rain' },
        { time: '20:00', pop: '80%', temp: '23°', icon: 'rain' },
        { time: '21:00', pop: '60%', temp: '22°', icon: 'cloud' },
        { time: '22:00', pop: '40%', temp: '22°', icon: 'cloud' },
        { time: '23:00', pop: '30%', temp: '21°', icon: 'cloud' },
        { time: '00:00', pop: '20%', temp: '21°', icon: 'cloud' },
        { time: '01:00', pop: '10%', temp: '21°', icon: 'night' },
        { time: '02:00', pop: '5%', temp: '21°', icon: 'night' }
      ],
      tenDay: [
        { day: 'Today', pop: '99%', low: '21°', high: '25°', fillLow: '15%', fillWidth: '75%' },
        { day: 'Fri', pop: '60%', low: '21°', high: '27°', fillLow: '20%', fillWidth: '65%' },
        { day: 'Sat', pop: '30%', low: '22°', high: '29°', fillLow: '30%', fillWidth: '55%' },
        { day: 'Sun', pop: '15%', low: '22°', high: '30°', fillLow: '35%', fillWidth: '50%' },
        { day: 'Mon', pop: '10%', low: '23°', high: '31°', fillLow: '40%', fillWidth: '45%' },
        { day: 'Tue', pop: '20%', low: '23°', high: '30°', fillLow: '35%', fillWidth: '50%' },
        { day: 'Wed', pop: '40%', low: '22°', high: '28°', fillLow: '25%', fillWidth: '60%' },
        { day: 'Thu', pop: '50%', low: '21°', high: '27°', fillLow: '20%', fillWidth: '65%' },
        { day: 'Fri', pop: '30%', low: '22°', high: '28°', fillLow: '25%', fillWidth: '60%' },
        { day: 'Sat', pop: '10%', low: '22°', high: '29°', fillLow: '30%', fillWidth: '55%' }
      ]
    },
    {
      id: 'london',
      name: 'London',
      eyebrow: 'GREATER LONDON',
      time: '09:48 AM',
      temp: 18,
      condition: 'Overcast & Intermittent Drizzle',
      hl: 'H: 19° · L: 14°',
      weatherState: 'drizzle',
      alert: {
        severity: 'advisory',
        badge: 'COASTAL ADVISORY',
        title: 'HIGH TIDE & SWELL ADVISORY',
        body: 'Thames Barrier deployment monitoring active for spring high tide.',
        action: 'Tide Schedule'
      },
      aqi: { val: 32, status: 'Good Air Quality', desc: 'Clean Atlantic air circulation bringing fresh air.', marker: '20%' },
      wind: { speed: '22 km/h', dirText: 'Southwest · Moderate breeze', angle: 220 },
      uv: { val: 4, desc: 'Moderate UV index during sunny intervals.', marker: '35%' },
      sunset: { time: '8:30 PM', sunrise: 'Sunrise tomorrow: 5:32 AM' },
      feelsLike: { val: '17°', desc: 'Cool damp air feels slightly lower than actual temperature.' },
      precip: { val: '6 mm', desc: 'Light misting drizzle accumulated over past 24h.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '81%', dew: 'The dew point is 15° right now.' },
      visibility: { val: '8.0 km', desc: 'Light haze; generally good visibility across inner boroughs.' },
      pressure: { val: '1016 hPa', desc: 'Steady atmospheric pressure.' },
      hourly: [
        { time: 'Now', pop: '40%', temp: '18°', icon: 'cloud' },
        { time: '10:00', pop: '45%', temp: '18°', icon: 'rain' },
        { time: '11:00', pop: '50%', temp: '19°', icon: 'rain' },
        { time: '12:00', pop: '35%', temp: '19°', icon: 'cloud' },
        { time: '13:00', pop: '20%', temp: '19°', icon: 'cloud' },
        { time: '14:00', pop: '15%', temp: '18°', icon: 'sun' },
        { time: '15:00', pop: '10%', temp: '18°', icon: 'sun' },
        { time: '16:00', pop: '10%', temp: '17°', icon: 'cloud' },
        { time: '17:00', pop: '15%', temp: '16°', icon: 'cloud' },
        { time: '18:00', pop: '20%', temp: '15°', icon: 'night' }
      ],
      tenDay: [
        { day: 'Today', pop: '40%', low: '14°', high: '19°', fillLow: '10%', fillWidth: '40%' },
        { day: 'Fri', pop: '50%', low: '13°', high: '18°', fillLow: '10%', fillWidth: '35%' },
        { day: 'Sat', pop: '60%', low: '12°', high: '17°', fillLow: '5%', fillWidth: '35%' },
        { day: 'Sun', pop: '30%', low: '13°', high: '19°', fillLow: '10%', fillWidth: '40%' },
        { day: 'Mon', pop: '20%', low: '14°', high: '20°', fillLow: '15%', fillWidth: '45%' },
        { day: 'Tue', pop: '15%', low: '14°', high: '21°', fillLow: '15%', fillWidth: '50%' },
        { day: 'Wed', pop: '25%', low: '13°', high: '19°', fillLow: '10%', fillWidth: '40%' },
        { day: 'Thu', pop: '35%', low: '13°', high: '18°', fillLow: '10%', fillWidth: '35%' },
        { day: 'Fri', pop: '45%', low: '12°', high: '17°', fillLow: '5%', fillWidth: '35%' },
        { day: 'Sat', pop: '30%', low: '13°', high: '19°', fillLow: '10%', fillWidth: '40%' }
      ]
    },
    {
      id: 'singapore',
      name: 'Singapore',
      eyebrow: 'SOUTHEAST ASIA',
      time: '16:48 PM',
      temp: 31,
      condition: 'Tropical Thunderstorm & High Humidity',
      hl: 'H: 32° · L: 26°',
      weatherState: 'thunderstorm',
      alert: {
        severity: 'warning',
        badge: 'SQUALL WARNING',
        title: 'SUMATRA SQUALL & FLASH FLOOD ADVISORY',
        body: 'Intense rain bands producing 40mm/hr precipitation. Flash flood risk in low-lying urban drains.',
        action: 'Water Management Advisory'
      },
      aqi: { val: 45, status: 'Good Air Quality', desc: 'Rain scrubbing keeping urban particulate levels low.', marker: '25%' },
      wind: { speed: '28 km/h', dirText: 'Southwest · Gusts in squalls to 48 km/h', angle: 215 },
      uv: { val: 6, desc: 'High UV during break in thunderstorm clouds.', marker: '60%' },
      sunset: { time: '7:16 PM', sunrise: 'Sunrise tomorrow: 7:04 AM' },
      feelsLike: { val: '38°', desc: 'Extreme relative humidity (90%) elevating heat index.' },
      precip: { val: '54 mm', desc: 'Heavy tropical monsoon downpours over past 12h.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '90%', dew: 'The dew point is 27° right now.' },
      visibility: { val: '4.5 km', desc: 'Torrential squalls reducing visibility along Straits of Singapore.' },
      pressure: { val: '1008 hPa', desc: 'Equatorial low pressure trough.' },
      hourly: [
        { time: 'Now', pop: '85%', temp: '31°', icon: 'thunder' },
        { time: '17:00', pop: '80%', temp: '30°', icon: 'rain' },
        { time: '18:00', pop: '60%', temp: '29°', icon: 'rain' },
        { time: '19:00', pop: '40%', temp: '28°', icon: 'cloud' },
        { time: '20:00', pop: '30%', temp: '27°', icon: 'cloud' },
        { time: '21:00', pop: '20%', temp: '27°', icon: 'night' },
        { time: '22:00', pop: '15%', temp: '26°', icon: 'night' },
        { time: '23:00', pop: '10%', temp: '26°', icon: 'night' },
        { time: '00:00', pop: '10%', temp: '26°', icon: 'night' },
        { time: '01:00', pop: '15%', temp: '26°', icon: 'night' }
      ],
      tenDay: [
        { day: 'Today', pop: '85%', low: '26°', high: '32°', fillLow: '30%', fillWidth: '55%' },
        { day: 'Fri', pop: '75%', low: '26°', high: '32°', fillLow: '30%', fillWidth: '55%' },
        { day: 'Sat', pop: '60%', low: '26°', high: '33°', fillLow: '35%', fillWidth: '55%' },
        { day: 'Sun', pop: '50%', low: '26°', high: '33°', fillLow: '35%', fillWidth: '55%' },
        { day: 'Mon', pop: '65%', low: '25°', high: '32°', fillLow: '25%', fillWidth: '60%' },
        { day: 'Tue', pop: '80%', low: '25°', high: '31°', fillLow: '25%', fillWidth: '60%' },
        { day: 'Wed', pop: '70%', low: '26°', high: '32°', fillLow: '30%', fillWidth: '55%' },
        { day: 'Thu', pop: '60%', low: '26°', high: '32°', fillLow: '30%', fillWidth: '55%' },
        { day: 'Fri', pop: '50%', low: '26°', high: '33°', fillLow: '35%', fillWidth: '55%' },
        { day: 'Sat', pop: '65%', low: '26°', high: '32°', fillLow: '30%', fillWidth: '55%' }
      ]
    },
    {
      id: 'new-york',
      name: 'New York',
      eyebrow: 'TRI-STATE AREA',
      time: '04:48 AM',
      temp: 27,
      condition: 'Clear Skies & Gentle Breeze',
      hl: 'H: 28° · L: 20°',
      weatherState: 'sunny',
      alert: {
        severity: 'advisory',
        badge: 'GREEN NORMAL',
        title: 'NO ACTIVE CLIMATE WARNINGS',
        body: 'Conditions are stable across all five boroughs. Mild sea breeze along coastal beaches.',
        action: 'Weather History'
      },
      aqi: { val: 41, status: 'Good Air Quality', desc: 'Air pollution levels are low and safe for all activity.', marker: '25%' },
      wind: { speed: '14 km/h', dirText: 'Northwest · Gentle breeze', angle: 315 },
      uv: { val: 7, desc: 'High UV rating expected around midday.', marker: '65%' },
      sunset: { time: '8:10 PM', sunrise: 'Sunrise tomorrow: 6:02 AM' },
      feelsLike: { val: '28°', desc: 'Pleasant summer conditions with comfortable humidity levels.' },
      precip: { val: '0 mm', desc: 'Zero rainfall recorded in past 24 hours.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '55%', dew: 'The dew point is 17° right now.' },
      visibility: { val: '10.0 km', desc: 'Crystal clear visibility across the metropolitan skyline.' },
      pressure: { val: '1020 hPa', desc: 'High pressure system ensuring clear sky conditions.' },
      hourly: [
        { time: 'Now', pop: '0%', temp: '27°', icon: 'sun' },
        { time: '05:00', pop: '0%', temp: '26°', icon: 'sun' },
        { time: '06:00', pop: '0%', temp: '25°', icon: 'sun' },
        { time: '07:00', pop: '0%', temp: '25°', icon: 'sun' },
        { time: '08:00', pop: '0%', temp: '26°', icon: 'sun' },
        { time: '09:00', pop: '0%', temp: '27°', icon: 'sun' },
        { time: '10:00', pop: '0%', temp: '28°', icon: 'sun' },
        { time: '11:00', pop: '0%', temp: '28°', icon: 'sun' },
        { time: '12:00', pop: '5%', temp: '28°', icon: 'sun' },
        { time: '13:00', pop: '5%', temp: '27°', icon: 'sun' }
      ],
      tenDay: [
        { day: 'Today', pop: '0%', low: '20°', high: '28°', fillLow: '30%', fillWidth: '50%' },
        { day: 'Fri', pop: '10%', low: '21°', high: '29°', fillLow: '35%', fillWidth: '50%' },
        { day: 'Sat', pop: '20%', low: '22°', high: '30°', fillLow: '40%', fillWidth: '50%' },
        { day: 'Sun', pop: '40%', low: '21°', high: '27°', fillLow: '35%', fillWidth: '45%' },
        { day: 'Mon', pop: '15%', low: '19°', high: '26°', fillLow: '25%', fillWidth: '45%' },
        { day: 'Tue', pop: '5%', low: '19°', high: '27°', fillLow: '25%', fillWidth: '50%' },
        { day: 'Wed', pop: '0%', low: '20°', high: '28°', fillLow: '30%', fillWidth: '50%' },
        { day: 'Thu', pop: '10%', low: '21°', high: '29°', fillLow: '35%', fillWidth: '50%' },
        { day: 'Fri', pop: '15%', low: '22°', high: '30°', fillLow: '40%', fillWidth: '50%' },
        { day: 'Sat', pop: '20%', low: '21°', high: '28°', fillLow: '35%', fillWidth: '45%' }
      ]
    },
    {
      id: 'sydney',
      name: 'Sydney',
      eyebrow: 'NEW SOUTH WALES',
      time: '18:48 PM',
      temp: 16,
      condition: 'Clear Winter Sky & Strong Swells',
      hl: 'H: 17° · L: 11°',
      weatherState: 'sunny',
      alert: {
        severity: 'advisory',
        badge: 'COASTAL SWELL WATCH',
        title: 'HAZARDOUS SURF & HIGH SWELL ADVISORY',
        body: 'Southerly swells reaching 4.5 meters. Rock fishing and boating hazardous along south beaches.',
        action: 'Beach Safety Report'
      },
      aqi: { val: 22, status: 'Good Air Quality', desc: 'Pristine ocean air quality across coastal suburbs.', marker: '15%' },
      wind: { speed: '32 km/h', dirText: 'South-Southwest · Fresh gusty breeze', angle: 202 },
      uv: { val: 3, desc: 'Moderate UV index during winter midday hours.', marker: '25%' },
      sunset: { time: '5:18 PM', sunrise: 'Sunrise tomorrow: 6:48 AM' },
      feelsLike: { val: '14°', desc: 'Southerly wind chill lowering perceived temperature.' },
      precip: { val: '0 mm', desc: 'No precipitation recorded in past 24 hours.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '58%', dew: 'The dew point is 8° right now.' },
      visibility: { val: '10.0 km', desc: 'Clear visibility across Sydney Harbour and heads.' },
      pressure: { val: '1024 hPa', desc: 'Strong high pressure system extending over Tasman Sea.' },
      hourly: [
        { time: 'Now', pop: '0%', temp: '16°', icon: 'sun' },
        { time: '19:00', pop: '0%', temp: '15°', icon: 'night' },
        { time: '20:00', pop: '0%', temp: '14°', icon: 'night' },
        { time: '21:00', pop: '0%', temp: '13°', icon: 'night' },
        { time: '22:00', pop: '0%', temp: '12°', icon: 'night' },
        { time: '23:00', pop: '0%', temp: '12°', icon: 'night' },
        { time: '00:00', pop: '0%', temp: '11°', icon: 'night' },
        { time: '01:00', pop: '0%', temp: '11°', icon: 'night' },
        { time: '02:00', pop: '0%', temp: '11°', icon: 'night' },
        { time: '03:00', pop: '0%', temp: '11°', icon: 'night' }
      ],
      tenDay: [
        { day: 'Today', pop: '0%', low: '11°', high: '17°', fillLow: '10%', fillWidth: '35%' },
        { day: 'Fri', pop: '10%', low: '10°', high: '18°', fillLow: '5%', fillWidth: '40%' },
        { day: 'Sat', pop: '20%', low: '11°', high: '19°', fillLow: '10%', fillWidth: '40%' },
        { day: 'Sun', pop: '40%', low: '12°', high: '18°', fillLow: '15%', fillWidth: '35%' },
        { day: 'Mon', pop: '30%', low: '11°', high: '17°', fillLow: '10%', fillWidth: '35%' },
        { day: 'Tue', pop: '15%', low: '10°', high: '18°', fillLow: '5%', fillWidth: '40%' },
        { day: 'Wed', pop: '5%', low: '10°', high: '19°', fillLow: '5%', fillWidth: '45%' },
        { day: 'Thu', pop: '0%', low: '11°', high: '20°', fillLow: '10%', fillWidth: '45%' },
        { day: 'Fri', pop: '10%', low: '11°', high: '19°', fillLow: '10%', fillWidth: '40%' },
        { day: 'Sat', pop: '20%', low: '12°', high: '18°', fillLow: '15%', fillWidth: '35%' }
      ]
    },
    {
      id: 'reykjavik',
      name: 'Reykjavik',
      eyebrow: 'CAPITAL REGION',
      time: '08:48 AM',
      temp: 4,
      condition: 'Arctic Gale & Cold Drizzle',
      hl: 'H: 5° · L: 1°',
      weatherState: 'drizzle',
      alert: {
        severity: 'warning',
        badge: 'ARCTIC GALE WARNING',
        title: 'NORTH ATLANTIC GALE & SNOW FLURRY WATCH',
        body: 'Wind gusts up to 75 km/h along coast. Icy road surfaces across mountain passes.',
        action: 'Icelandic Road & Wind Status'
      },
      aqi: { val: 12, status: 'Excellent Air Quality', desc: 'Pristine sub-polar air masses.', marker: '10%' },
      wind: { speed: '45 km/h', dirText: 'North-Northwest · Gale gusts 75 km/h', angle: 340 },
      uv: { val: 1, desc: 'Low UV index near Arctic circle.', marker: '10%' },
      sunset: { time: '10:42 PM', sunrise: 'Sunrise tomorrow: 4:12 AM' },
      feelsLike: { val: '-2°', desc: 'Sub-zero wind chill temperature due to gale force Arctic winds.' },
      precip: { val: '14 mm', desc: 'Mixed cold rain, sleet, and mountain snow precipitation.' },
      moon: { phase: 'Waning Gibbous', illumination: '84% Illuminated' },
      humidity: { val: '86%', dew: 'The dew point is 2° right now.' },
      visibility: { val: '6.0 km', desc: 'Blowing rain spray and mist over Faxaflói bay.' },
      pressure: { val: '992 hPa', desc: 'Deep sub-polar low pressure system.' },
      hourly: [
        { time: 'Now', pop: '60%', temp: '4°', icon: 'cloud' },
        { time: '09:00', pop: '70%', temp: '4°', icon: 'rain' },
        { time: '10:00', pop: '65%', temp: '5°', icon: 'rain' },
        { time: '11:00', pop: '50%', temp: '5°', icon: 'cloud' },
        { time: '12:00', pop: '40%', temp: '5°', icon: 'cloud' },
        { time: '13:00', pop: '30%', temp: '4°', icon: 'cloud' },
        { time: '14:00', pop: '20%', temp: '4°', icon: 'cloud' },
        { time: '15:00', pop: '15%', temp: '3°', icon: 'cloud' },
        { time: '16:00', pop: '10%', temp: '3°', icon: 'night' },
        { time: '17:00', pop: '5%', temp: '2°', icon: 'night' }
      ],
      tenDay: [
        { day: 'Today', pop: '60%', low: '1°', high: '5°', fillLow: '5%', fillWidth: '20%' },
        { day: 'Fri', pop: '80%', low: '0°', high: '4°', fillLow: '0%', fillWidth: '20%' },
        { day: 'Sat', pop: '90%', low: '-1°', high: '3°', fillLow: '0%', fillWidth: '15%' },
        { day: 'Sun', pop: '50%', low: '0°', high: '4°', fillLow: '0%', fillWidth: '20%' },
        { day: 'Mon', pop: '30%', low: '1°', high: '5°', fillLow: '5%', fillWidth: '20%' },
        { day: 'Tue', pop: '20%', low: '2°', high: '6°', fillLow: '10%', fillWidth: '20%' },
        { day: 'Wed', pop: '40%', low: '1°', high: '5°', fillLow: '5%', fillWidth: '20%' },
        { day: 'Thu', pop: '60%', low: '0°', high: '4°', fillLow: '0%', fillWidth: '20%' },
        { day: 'Fri', pop: '70%', low: '-1°', high: '3°', fillLow: '0%', fillWidth: '15%' },
        { day: 'Sat', pop: '50%', low: '0°', high: '4°', fillLow: '0%', fillWidth: '20%' }
      ]
    }
  ];

  let activeLocationId = 'mumbai';

  // ==========================================================================
  // 2. CANVAS DYNAMIC WEATHER BACKGROUND ENGINE
  // ==========================================================================
  const canvas = document.getElementById('weather-canvas');
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Particle System Parameters
  const rainParticles = [];
  const cloudParticles = [];

  const maxRain = 220;
  for (let i = 0; i < maxRain; i++) {
    rainParticles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 25 + 15,
      speed: Math.random() * 14 + 10,
      opacity: Math.random() * 0.4 + 0.2,
      thickness: Math.random() * 1.5 + 0.5
    });
  }

  // Cloud Particles
  for (let i = 0; i < 6; i++) {
    cloudParticles.push({
      x: Math.random() * width,
      y: Math.random() * (height * 0.4),
      radius: Math.random() * 180 + 120,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.15 + 0.05
    });
  }

  // Lightning Flash state
  let lightningOpacity = 0;
  let nextLightningFrame = 0;

  let currentCondition = 'thunderstorm';
  let currentTemp = 29;

  // RGB Color Interpolation state for smooth transitions
  let currRGBTop = [7, 11, 20];
  let currRGBMid = [15, 23, 42];
  let currRGBBot = [9, 13, 22];

  function getTargetGradientRGB(temp, condition) {
    // 1. Extreme Heat (> 33°C) - Fiery Amber & Copper dome
    if (temp >= 33) {
      if (condition === 'sunny' || condition === 'cloudy') {
        return {
          top: [69, 26, 3],     // #451a03 deep amber
          mid: [124, 45, 18],   // #7c2d12 crimson ember
          bot: [24, 14, 4]      // #180e04 dark copper
        };
      }
    }
    
    // 2. Warm (26°C - 32°C)
    if (temp >= 26 && temp < 33) {
      if (condition === 'sunny') {
        return {
          top: [30, 27, 75],    // #1e1b4b deep violet indigo
          mid: [67, 20, 7],     // #431407 burnt amber
          bot: [15, 23, 42]     // #0f172a navy slate
        };
      }
    }

    // 3. Cool / Moderate (18°C - 25°C)
    if (temp >= 18 && temp < 26) {
      if (condition === 'sunny' || condition === 'cloudy' || condition === 'drizzle') {
        return {
          top: [15, 43, 72],    // #0f2b48 deep sapphire
          mid: [30, 58, 138],   // #1e3a8a oceanic blue
          bot: [9, 13, 22]      // #090d16 slate midnight
        };
      }
    }

    // 4. Cold (< 18°C)
    if (temp < 18) {
      return {
        top: [3, 43, 67],      // #032b43 glacial cyan
        mid: [7, 89, 133],     // #075985 ice blue
        bot: [5, 14, 26]       // #050e1a dark ocean
      };
    }

    // Default Condition Fallbacks (Storm / Heavy Rain)
    if (condition === 'thunderstorm') {
      return {
        top: [7, 11, 20],
        mid: [15, 23, 42],
        bot: [9, 13, 22]
      };
    } else if (condition === 'rain') {
      return {
        top: [12, 21, 39],
        mid: [30, 41, 59],
        bot: [15, 23, 42]
      };
    }

    return {
      top: [15, 23, 42],
      mid: [30, 41, 59],
      bot: [9, 13, 22]
    };
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);

    // Compute target RGB color stops based on active temperature and condition
    const targetRGB = getTargetGradientRGB(currentTemp, currentCondition);

    // Smoothly interpolate (lerp) current colors toward target colors
    const lerpFactor = 0.04;
    for (let i = 0; i < 3; i++) {
      currRGBTop[i] += (targetRGB.top[i] - currRGBTop[i]) * lerpFactor;
      currRGBMid[i] += (targetRGB.mid[i] - currRGBMid[i]) * lerpFactor;
      currRGBBot[i] += (targetRGB.bot[i] - currRGBBot[i]) * lerpFactor;
    }

    // Draw dynamic background gradient
    let grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, `rgb(${Math.round(currRGBTop[0])}, ${Math.round(currRGBTop[1])}, ${Math.round(currRGBTop[2])})`);
    grad.addColorStop(0.5, `rgb(${Math.round(currRGBMid[0])}, ${Math.round(currRGBMid[1])}, ${Math.round(currRGBMid[2])})`);
    grad.addColorStop(1, `rgb(${Math.round(currRGBBot[0])}, ${Math.round(currRGBBot[1])}, ${Math.round(currRGBBot[2])})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Render Sun Rays if sunny
    if (currentCondition === 'sunny') {
      ctx.save();
      // Sun aura color adapts to temperature: golden-red if hot, bright yellow if moderate
      const rayColor1 = currentTemp >= 33 ? 'rgba(249, 115, 22, 0.08)' : 'rgba(251, 191, 36, 0.04)';
      const rayColor2 = currentTemp >= 33 ? 'rgba(239, 68, 68, 0.04)' : 'rgba(251, 191, 36, 0.02)';

      ctx.fillStyle = rayColor1;
      ctx.beginPath();
      ctx.arc(width * 0.8, 0, 450, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = rayColor2;
      ctx.beginPath();
      ctx.arc(width * 0.8, 0, 700, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    cloudParticles.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      c.x += c.speed;
      if (c.x - c.radius > width) c.x = -c.radius;
    });

    // Render Rain / Drizzle / Thunderstorm streaks
    if (currentCondition === 'rain' || currentCondition === 'thunderstorm' || currentCondition === 'drizzle') {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
      ctx.lineCap = 'round';

      const densityMultiplier = currentCondition === 'drizzle' ? 0.3 : (currentCondition === 'thunderstorm' ? 1.0 : 0.7);
      const speedMult = currentCondition === 'drizzle' ? 0.5 : 1.0;

      const activeCount = Math.floor(maxRain * densityMultiplier);

      for (let i = 0; i < activeCount; i++) {
        const p = rainParticles[i];
        ctx.lineWidth = p.thickness;
        ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 3, p.y + p.length);
        ctx.stroke();

        p.y += p.speed * speedMult;
        p.x -= 1;

        if (p.y > height) {
          p.y = -p.length;
          p.x = Math.random() * width;
        }
      }
    }

    // Handle Periodic Lightning Flashes in Thunderstorm state
    if (currentCondition === 'thunderstorm') {
      nextLightningFrame++;
      if (nextLightningFrame % 280 === 0 && Math.random() > 0.3) {
        lightningOpacity = 0.45;
      }
      if (lightningOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${lightningOpacity})`;
        ctx.fillRect(0, 0, width, height);
        lightningOpacity -= 0.03;
      }
    }

    requestAnimationFrame(animateCanvas);
  }

  animateCanvas();

  // ==========================================================================
  // 3. HAZARD RADAR CANVAS ANIMATION ENGINE
  // ==========================================================================
  const mapCanvas = document.getElementById('hazard-map-canvas');
  const mapCtx = mapCanvas.getContext('2d');

  function resizeMapCanvas() {
    const parent = mapCanvas.parentElement;
    mapCanvas.width = parent.clientWidth;
    mapCanvas.height = parent.clientHeight || 340;
  }
  resizeMapCanvas();
  window.addEventListener('resize', resizeMapCanvas);

  let scanAngle = 0;
  let mapZoom = 1.0;

  document.getElementById('map-zoom-in')?.addEventListener('click', (e) => {
    e.stopPropagation();
    mapZoom = Math.min(mapZoom + 0.2, 2.0);
  });
  document.getElementById('map-zoom-out')?.addEventListener('click', (e) => {
    e.stopPropagation();
    mapZoom = Math.max(mapZoom - 0.2, 0.6);
  });

  function renderHazardMap() {
    const mw = mapCanvas.width;
    const mh = mapCanvas.height;

    mapCtx.clearRect(0, 0, mw, mh);

    // Map background mesh
    mapCtx.fillStyle = '#0a101d';
    mapCtx.fillRect(0, 0, mw, mh);

    mapCtx.save();
    mapCtx.translate(mw / 2, mh / 2);
    mapCtx.scale(mapZoom, mapZoom);

    // Radar Concentric Circles
    mapCtx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    mapCtx.lineWidth = 1;
    [40, 80, 120, 160, 200].forEach(r => {
      mapCtx.beginPath();
      mapCtx.arc(0, 0, r, 0, Math.PI * 2);
      mapCtx.stroke();
    });

    // Crosshairs
    mapCtx.beginPath();
    mapCtx.moveTo(-220, 0); mapCtx.lineTo(220, 0);
    mapCtx.moveTo(0, -220); mapCtx.lineTo(0, 220);
    mapCtx.stroke();

    // Hazard Heatmap Blobs (Animated)
    const time = Date.now() * 0.002;

    // Extreme Rain Blob
    let grad1 = mapCtx.createRadialGradient(-30, -20, 10, -30, -20, 80);
    grad1.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
    grad1.addColorStop(0.5, 'rgba(249, 115, 22, 0.35)');
    grad1.addColorStop(1, 'rgba(239, 68, 68, 0)');
    mapCtx.fillStyle = grad1;
    mapCtx.beginPath();
    mapCtx.arc(-30 + Math.sin(time) * 5, -20 + Math.cos(time) * 5, 75, 0, Math.PI * 2);
    mapCtx.fill();

    // High Precip Blob
    let grad2 = mapCtx.createRadialGradient(50, 40, 5, 50, 40, 60);
    grad2.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    grad2.addColorStop(1, 'rgba(56, 189, 248, 0)');
    mapCtx.fillStyle = grad2;
    mapCtx.beginPath();
    mapCtx.arc(50, 40, 60, 0, Math.PI * 2);
    mapCtx.fill();

    // Rotating Radar Scan Sweep Beam
    scanAngle += 0.015;
    mapCtx.save();
    mapCtx.rotate(scanAngle);
    let sweepGrad = mapCtx.createConicGradient(0, 0, 0);
    sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
    sweepGrad.addColorStop(0.15, 'rgba(56, 189, 248, 0)');
    sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    mapCtx.fillStyle = sweepGrad;
    mapCtx.beginPath();
    mapCtx.moveTo(0, 0);
    mapCtx.arc(0, 0, 220, 0, Math.PI * 0.3);
    mapCtx.closePath();
    mapCtx.fill();
    mapCtx.restore();

    // Map Location Pins
    const pins = [
      { name: 'Mumbai (Core Risk)', x: -30, y: -20, active: activeLocationId === 'mumbai' },
      { name: 'Thane Coast', x: 20, y: -60, active: false },
      { name: 'Navi Mumbai', x: 45, y: 30, active: false }
    ];

    pins.forEach(pin => {
      mapCtx.fillStyle = pin.active ? '#ef4444' : '#38bdf8';
      mapCtx.beginPath();
      mapCtx.arc(pin.x, pin.y, 6, 0, Math.PI * 2);
      mapCtx.fill();

      // Pulsing ring
      const pulseR = 6 + (Math.sin(Date.now() * 0.005) + 1) * 4;
      mapCtx.strokeStyle = pin.active ? 'rgba(239, 68, 68, 0.6)' : 'rgba(56, 189, 248, 0.6)';
      mapCtx.lineWidth = 1.5;
      mapCtx.beginPath();
      mapCtx.arc(pin.x, pin.y, pulseR, 0, Math.PI * 2);
      mapCtx.stroke();

      // Pin Label
      mapCtx.fillStyle = '#ffffff';
      mapCtx.font = '10px Outfit, sans-serif';
      mapCtx.fillText(pin.name, pin.x + 10, pin.y + 3);
    });

    mapCtx.restore();

    requestAnimationFrame(renderHazardMap);
  }
  renderHazardMap();

  // ==========================================================================
  // 4. SIDEBAR & LOCATION LIST RENDER
  // ==========================================================================
  const locationListEl = document.getElementById('location-list');

  function renderSidebarLocations() {
    locationListEl.innerHTML = '';
    locationsData.forEach(loc => {
      const card = document.createElement('div');
      card.className = `location-card ${loc.id === activeLocationId ? 'active' : ''}`;
      card.dataset.id = loc.id;

      let badgeHtml = '';
      if (loc.alert) {
        badgeHtml = `<div class="warning-badge ${loc.alert.severity}">${loc.alert.badge}</div>`;
      }

      card.innerHTML = `
        <div class="location-card-top">
          <div>
            <div class="location-name">${loc.name}</div>
            <div class="location-time">${loc.time}</div>
            ${badgeHtml}
          </div>
          <div class="location-temp">${loc.temp}°</div>
        </div>
        <div class="location-card-bottom">
          <div class="location-condition">${loc.condition}</div>
          <div class="location-hl">${loc.hl.split('·')[0]}</div>
        </div>
      `;

      card.addEventListener('click', () => switchLocation(loc.id));
      locationListEl.appendChild(card);
    });
  }

  // ==========================================================================
  // 5. UPDATE DASHBOARD CONTENT ON LOCATION SWITCH
  // ==========================================================================
  function switchLocation(id) {
    const loc = locationsData.find(l => l.id === id);
    if (!loc) return;

    activeLocationId = id;
    currentCondition = loc.weatherState;
    currentTemp = loc.temp;

    renderSidebarLocations();

    // Hero Zone Update
    document.getElementById('hero-eyebrow').innerText = loc.eyebrow;
    document.getElementById('hero-city').innerText = loc.name;
    document.getElementById('hero-temp').innerText = `${loc.temp}°`;
    document.getElementById('hero-condition').innerText = loc.condition;
    document.getElementById('hero-hl').innerHTML = `<span>${loc.hl.split('·')[0]}</span><span>${loc.hl.split('·')[1] || ''}</span>`;

    // Alert Strip Update
    const alertStrip = document.getElementById('alert-strip');
    alertStrip.className = `alert-strip ${loc.alert.severity}`;
    document.getElementById('alert-headline').innerHTML = `${loc.alert.title} <span class="alert-headline-badge">${loc.alert.badge}</span>`;
    document.getElementById('alert-body').innerText = loc.alert.body;
    document.getElementById('alert-action-btn').innerText = loc.alert.action;

    // Hourly Rail Update
    const hourlyContainer = document.getElementById('hourly-scroll-container');
    hourlyContainer.innerHTML = loc.hourly.map(item => `
      <div class="hourly-item">
        <div class="hourly-time">${item.time}</div>
        <svg class="hourly-icon" viewBox="0 0 24 24" fill="none" stroke="${item.icon === 'thunder' ? '#f97316' : '#38bdf8'}" stroke-width="2">
          ${item.icon === 'sun' ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>' : '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 15.25"/>'}
        </svg>
        <div class="hourly-pop">${item.pop}</div>
        <div class="hourly-temp">${item.temp}</div>
      </div>
    `).join('');

    // 10-Day Forecast List Update
    const tenDayContainer = document.getElementById('ten-day-list');
    tenDayContainer.innerHTML = loc.tenDay.map(row => `
      <div class="forecast-row">
        <div class="forecast-day">${row.day}</div>
        <div class="forecast-pop">${row.pop}</div>
        <svg class="forecast-icon" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 15.25"/>
        </svg>
        <div class="forecast-temp-range">
          <span class="temp-low">${row.low}</span>
          <div class="temp-bar-bg">
            <div class="temp-bar-fill" style="left: ${row.fillLow}; width: ${row.fillWidth};"></div>
          </div>
          <span class="temp-high">${row.high}</span>
        </div>
      </div>
    `).join('');

    // AQI Update
    document.getElementById('aqi-val').innerText = loc.aqi.val;
    document.getElementById('aqi-status').innerText = loc.aqi.status;
    document.getElementById('aqi-desc').innerText = loc.aqi.desc;
    document.getElementById('aqi-marker').style.left = loc.aqi.marker;

    // Wind Update
    document.getElementById('wind-speed').innerText = loc.wind.speed;
    document.getElementById('wind-direction').innerText = loc.wind.dirText;
    document.getElementById('wind-dial').style.transform = `rotate(${loc.wind.angle}deg)`;

    // UV Update
    document.getElementById('uv-val').innerText = loc.uv.val;
    document.getElementById('uv-desc').innerText = loc.uv.desc;
    document.getElementById('uv-marker').style.left = loc.uv.marker;

    // Compact Modules Update
    document.getElementById('sunset-val').innerText = loc.sunset.time;
    document.getElementById('sunrise-val').innerText = loc.sunset.sunrise;

    document.getElementById('feels-val').innerText = loc.feelsLike.val;
    document.getElementById('feels-desc').innerText = loc.feelsLike.desc;

    document.getElementById('precip-val').innerText = loc.precip.val;
    document.getElementById('precip-desc').innerText = loc.precip.desc;

    document.getElementById('moon-phase-name').innerText = loc.moon.phase;
    document.getElementById('moon-illumination').innerText = loc.moon.illumination;

    document.getElementById('humidity-val').innerText = loc.humidity.val;
    document.getElementById('dewpoint-val').innerText = loc.humidity.dew;

    document.getElementById('vis-val').innerText = loc.visibility.val;
    document.getElementById('vis-desc').innerText = loc.visibility.desc;

    document.getElementById('pressure-val').innerText = loc.pressure.val;
    document.getElementById('pressure-desc').innerText = loc.pressure.desc;
  }

  // Initialize
  renderSidebarLocations();
  switchLocation('mumbai');

  // ==========================================================================
  // 6. SIDEBAR CONTROLS & SEARCH FILTER
  // ==========================================================================
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapse-sidebar-btn');
  const expandBtn = document.getElementById('expand-sidebar-btn');
  const searchInput = document.getElementById('search-input');

  collapseBtn.addEventListener('click', () => {
    sidebar.classList.add('collapsed');
    expandBtn.style.display = 'flex';
  });

  expandBtn.addEventListener('click', () => {
    sidebar.classList.remove('collapsed');
    expandBtn.style.display = 'none';
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const cards = locationListEl.querySelectorAll('.location-card');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? 'block' : 'none';
    });
  });

  // Keyboard shortcut (⌘S / Ctrl+S) to toggle sidebar
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      sidebar.classList.toggle('collapsed');
      expandBtn.style.display = sidebar.classList.contains('collapsed') ? 'flex' : 'none';
    }
  });

  // ==========================================================================
  // 7. PROGRESSIVE DISCLOSURE MODAL POPUPS
  // ==========================================================================
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  document.querySelectorAll('.glass-card[data-modal-type]').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.modal-type;
      const loc = locationsData.find(l => l.id === activeLocationId);

      modalTitle.innerText = `${type.toUpperCase().replace('-', ' ')} DETAIL — ${loc.name}`;

      if (type === 'ten-day') {
        modalBody.innerHTML = `
          <p>Extended 10-day meteorological trend model for <strong>${loc.name}</strong>.</p>
          <p style="margin-top: 10px;">Primary weather driver: <em>${loc.condition}</em> with high precipitation confidence exceeding 85% over the next 48 hours.</p>
        `;
      } else if (type === 'aqi') {
        modalBody.innerHTML = `
          <p><strong>Air Quality Index (AQI): ${loc.aqi.val}</strong> — ${loc.aqi.status}</p>
          <p style="margin-top: 10px;">${loc.aqi.desc}</p>
          <p style="margin-top: 10px;">Pollutant Breakdown: PM2.5 (18 µg/m³), PM10 (42 µg/m³), NO2 (12 ppb), O3 (24 ppb).</p>
        `;
      } else if (type === 'map') {
        modalBody.innerHTML = `
          <p><strong>Interactive Hazard Radar Map</strong></p>
          <p style="margin-top: 10px;">Real-time doppler scan showing convective precipitation cells and flood warning risk boundaries across the ${loc.name} metropolitan region.</p>
        `;
      } else {
        modalBody.innerHTML = `
          <p>Detailed telemetry and historical distribution graph for <strong>${type.toUpperCase()}</strong> in ${loc.name}.</p>
          <p style="margin-top: 10px;">Current telemetry status matches active warning parameters.</p>
        `;
      }

      modalOverlay.classList.add('active');
    });
  });

  modalCloseBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
  });

});
