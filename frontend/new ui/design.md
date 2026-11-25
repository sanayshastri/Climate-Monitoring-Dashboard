# Design Blueprint — Climate Warning Dashboard (macOS Weather Reference)

> Reverse-engineered layout specification derived from a macOS Weather app screenshot.
> Structure and interaction patterns only — not a pixel-exact clone of any proprietary asset.

---

## 1. Layout Geometry

### 1.1 Grid Structure
- **Two-region split layout**: fixed-width left sidebar + fluid main content pane.
  - Sidebar: ~360px fixed width, full viewport height, dark translucent panel.
  - Main content: fluid width, scrollable vertically, background is a full-bleed dynamic weather illustration (rain/clouds) behind translucent glass cards.
- **Main content sub-grid**: 3-column responsive grid for module cards below the hero zone.
  - Row 1 (wide modules): 3 columns — `10-Day Forecast` (tall, spans full row height) | `Air Quality` + `Wind` (stacked) | `Precipitation Map` (tall, spans full row height).
  - Row 2 (compact modules): 4-column grid — `UV Index`, `Sunset`, `Feels Like`, `Precipitation` (24h).
  - Row 3 (compact modules): 4-column grid — `Moon Phase`, `Humidity`, `Visibility`, `Pressure`.
- **Card container pattern**: all module cards share a consistent rounded-rectangle, semi-transparent dark glassmorphic background with subtle blur, uniform corner radius, and consistent internal padding (~16–20px).
- **Spacing rhythm**: ~16px gutter between cards horizontally and vertically; consistent baseline grid across all module rows.

### 1.2 Region Map (top to bottom)
> Note: macOS window traffic-light controls are OS chrome, not app UI — excluded from this spec.
1. **Sidebar toggle icon** — top-right of sidebar.
2. **Sidebar search bar** — pill-shaped search input, full sidebar width.
3. **Sidebar location list** — vertically stacked location cards (scrollable list).
4. **Dynamic background layer** — full-bleed animated illustration sitting behind every other element (see Section 4.1).
5. **Hero zone** (main pane, top, centered) — location label, current temp (large numeral), condition, high/low.
6. **Alert/summary strip** — full-width translucent bar directly below hero, single-line advisory text.
7. **Hourly forecast rail** — horizontal scrolling row of time/icon/percentage/temp columns.
8. **Module grid** — three rows of card-based data modules (described in 1.1).

---

## 2. Typographic Hierarchy

| Level | Element | Style |
|---|---|---|
| 1 (Hero) | Current temperature ("29°") | Extra-large, ultralight weight, white — dominant focal point of hero zone |
| 2 | City name ("Mumbai") | Large, regular weight, white |
| 3 | Eyebrow label ("MY LOCATION") | Small, uppercase, letter-spaced, muted gray — sits above city name |
| 3 | Condition + H/L ("Rain · H:29° L:27°") | Medium, regular weight, light gray |
| 4 | Module card titles ("10-DAY FORECAST", "AIR QUALITY") | Small, uppercase, letter-spaced, muted gray, paired with a small leading icon |
| 4 | Module hero values (e.g. "63", "5", "9 km", "80%") | Large, bold/semibold, white — anchors each compact card |
| 5 | Module body/help text | Small, regular weight, muted gray, 1–2 line descriptive sentence |
| 5 | Data table rows (10-day list, hourly rail) | Small-medium, regular weight, white for primary values, blue accent for percentages |
| Accent | Percentage values (rain chance) | Same small size as body text but colored blue for differentiation |

**Hierarchy logic**: uppercase muted labels always precede a bold/large numeric or primary value, followed by smaller descriptive gray text — this 3-tier (label → value → description) pattern repeats consistently across every module card.

---

## 3. Primary Interaction Nodes

| Node | Location | Inferred Interaction |
|---|---|---|
| Sidebar toggle icon | Top-right of sidebar | Collapse/expand the sidebar panel |
| Search bar | Top of sidebar | Click to focus, type to search/add a new location |
| Location cards (list) | Sidebar, stacked | Click to switch main pane to that location's data; active card is visually highlighted (lighter/blue-tinted background vs. others) |
| Hourly rail items | Below alert strip | Likely scrollable (drag/swipe horizontally); possibly hover/click to highlight a specific hour |
| 10-Day forecast rows | Left module, main grid | Click a row to expand into hourly breakdown for that day (standard Weather app pattern) |
| Air Quality card | Main grid | Click to expand into detailed pollutant breakdown |
| Wind compass dial | Main grid | Static visualization; direction/speed likely updates live, non-interactive beyond display |
| Precipitation map card | Main grid | Click/drag to pan or zoom the embedded radar map; nearby place labels are likely tappable pins |
| Compact stat cards (UV, Sunset, Feels Like, Precipitation, Moon, Humidity, Visibility, Pressure) | Rows 2–3 | Click to expand into a detail view/graph for that metric (consistent with all-card-expandable pattern) |

---

## 4. Component Behaviors

### 4.1 Dynamic Weather-Reactive Background (core signature feature)
This is the standout system in the app and deserves its own spec, since it's the emotional/atmospheric anchor of the whole UI — the background isn't decorative, it's a live data visualization in itself.

- **Architecture**: a full-bleed animated layer sits *behind* the sidebar and all glassmorphic cards. Cards use blur + translucency specifically so the background animation remains partially visible through them, tying every module visually back to current conditions.
- **Condition → visual mapping** (state machine, one visual state per condition):
  | Condition | Background behavior |
  |---|---|
  | Rain | Heavier, denser rain streaks animating downward across the full canvas (as seen in the current screenshot) + darker, denser cloud cover |
  | Drizzle | Same rain-streak system but lighter density/opacity and slower fall speed — a visually "dialed down" variant of the Rain state, not a separate asset |
  | Cloudy / Mostly Cloudy | Rain streaks removed; soft, slow-drifting layered cloud shapes fill the canvas (matches the "New Delhi — Mostly Cloudy" sidebar entry) |
  | Sunny / Clear | Animated sun rays/light rendering, typically a warm gradient sky with radiating light beams |
  | Thunderstorm | Rain streak system remains, with added periodic lightning flash animation (brief full-canvas brightness pulse, likely paired with a subtle screen-flicker or glow burst) |
  | Night variants | Each condition state likely has a corresponding darker/night palette (implied by the app's typical day/night cycle behavior, not directly visible here) |
- **Transition behavior**: the background is state-driven off whatever location/condition is currently selected — switching the active sidebar location card should crossfade or transition the background to match that location's live condition rather than hard-cutting.
- **Design intent**: this turns an otherwise data-dense dashboard into something that *feels* like the weather, reinforcing the current condition emotionally/atmospherically before the user reads a single number — a pattern worth carrying directly into the climate warning module (Section 5).

### 4.2 Other Component Behaviors
- **Glassmorphic elevation**: all cards use translucency + blur to sit "above" the animated weather background, unifying the visual system regardless of module content type.
- **Progressive disclosure**: compact cards show a single headline metric + one-line context; clicking (inferred) reveals expanded historical/predictive detail — consistent with the label→value→description pattern noted in Section 2.
- **Live/dynamic elements**:
  - Wind compass needle and speed readout imply real-time data binding.
  - Moon phase illustration renders dynamically based on current lunar cycle.
- **Color-as-data-encoding**: 
  - Air Quality bar uses a green→yellow→red gradient slider with a marker for current AQI position.
  - UV Index uses a similar gradient bar (green→pink) for scale position.
  - 10-day forecast uses horizontal bars scaled between low/high temps per day, colored by intensity.
- **List selection state**: the currently active sidebar location card is visually distinguished (highlighted background) from the others, indicating single-selection state management.
- **Responsive card sizing**: taller cards (10-Day Forecast, Precipitation Map) span the full height of a row while adjacent narrower cards (Air Quality + Wind) stack vertically to match that height — a common two-column-within-one-column composition technique.
- **Consistent iconography system**: every module title is paired with a small line-icon representing its data type (calendar for forecast, wind lines for air quality, droplet for precipitation, etc.), reinforcing scannability at a glance.

---

## 5. Adapting This Blueprint to a Climate Warning Module

To repurpose this structure for a dedicated **climate warning system**:
- Replace the "alert/summary strip" (currently a neutral advisory line) with a **severity-coded banner** (color-shifts by advisory/watch/warning/extreme level).
- Convert the Precipitation Map card into a **hazard overlay map** (flood zones, cyclone tracking, heat zones) using the same card chrome and pin-label pattern already present.
- Reuse the compact-card grid pattern (Section 1.1, Row 2–3) for warning-specific metrics: risk level, affected radius, time-to-impact, evacuation status — each following the same label→bold-value→description typographic formula.
- Keep the sidebar location-list pattern to let users monitor warnings across multiple saved locations simultaneously.
- **Extend the dynamic background system (4.1) into a severity-reactive one**: instead of (or in addition to) condition-based states, drive the background off warning severity — e.g. calm gradient for "no active warning," intensifying color/motion/particle density as severity escalates to advisory → watch → warning → extreme. This preserves the app's core strength — communicating urgency atmospherically, before the user reads any text — and is arguably even more valuable in a warning system than in a plain forecast app.
