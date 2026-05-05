/**
 * weather.js – Clima Mundo Gonzalo
 * Vanilla JS | Open-Meteo API (sin API key)
 * Geocoding: https://geocoding-api.open-meteo.com
 * Forecast:  https://api.open-meteo.com
 */

// ──────────────────────────────────────────────
// CONSTANTES
// ──────────────────────────────────────────────
const GEO_URL      = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL  = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM    = 'https://nominatim.openstreetmap.org/reverse';
const LS_KEY       = 'clima-mundo-cities';
const LS_LAST_KEY  = 'clima-mundo-lastcity';

// ──────────────────────────────────────────────
// ESTADO
// ──────────────────────────────────────────────
let map            = null;
let mapMarker      = null;
let debounceTimer  = null;
let currentCity    = null;   // { name, country, latitude, longitude, admin1 }

// ──────────────────────────────────────────────
// SELECCIÓN DE ELEMENTOS
// ──────────────────────────────────────────────
const searchForm       = document.getElementById('searchForm');
const searchInput      = document.getElementById('searchInput');
const searchClearBtn   = document.getElementById('searchClearBtn');
const suggestionsList  = document.getElementById('suggestionsList');
const searchMessage    = document.getElementById('searchMessage');
const loadingState     = document.getElementById('loadingState');
const currentWeatherEl = document.getElementById('currentWeather');
const forecastSection  = document.getElementById('forecastSection');
const emptyState       = document.getElementById('emptyState');
const forecastTrack    = document.getElementById('forecastTrack');
const forecastSubtitle = document.getElementById('forecastSubtitle');
const btnScrollLeft    = document.getElementById('btnScrollLeft');
const btnScrollRight   = document.getElementById('btnScrollRight');
const btnSaveCity      = document.getElementById('btnSaveCity');
const btnSaveCityIcon  = document.getElementById('btnSaveCityIcon');
const btnSaveCityText  = document.getElementById('btnSaveCityText');
const savedCitiesList  = document.getElementById('savedCitiesList');
const modalOverlay     = document.getElementById('modalOverlay');
const modalCitiesList  = document.getElementById('modalCitiesList');
const modalEmpty       = document.getElementById('modalEmpty');
const btnCloseModal    = document.getElementById('btnCloseModal');
const btnMenuMobile    = document.getElementById('btnMenuMobile');
const sidebar          = document.getElementById('sidebar');
const sidebarOverlay   = document.getElementById('sidebarOverlay');

// Botones que abren el modal
const modalTriggers = [
  document.getElementById('btnOpenModal'),
  document.getElementById('btnOpenModal2'),
  document.getElementById('btnOpenModal3'),
];

// ──────────────────────────────────────────────
// UTILIDADES
// ──────────────────────────────────────────────

/** Muestra/oculta elementos con [hidden] */
function show(el) { el.removeAttribute('hidden'); }
function hide(el) { el.setAttribute('hidden', ''); }

/** Crea un elemento con atributos y texto opcionales */
function createElement(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (text) el.textContent = text;
  return el;
}

/** Muestra un mensaje de error/info en el DOM */
function showMessage(text, type = 'error') {
  searchMessage.className = 'search-message' + (type === 'info' ? ' search-message--info' : '');
  searchMessage.textContent = text;
  show(searchMessage);
}

function hideMessage() { hide(searchMessage); }

// ──────────────────────────────────────────────
// LOCAL STORAGE – Ciudades guardadas
// ──────────────────────────────────────────────

function getSavedCities() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function saveCities(cities) {
  localStorage.setItem(LS_KEY, JSON.stringify(cities));
}

function isCitySaved(lat, lon) {
  return getSavedCities().some(c => c.latitude === lat && c.longitude === lon);
}

function addCity(city) {
  const cities = getSavedCities();
  const exists = cities.some(c => c.latitude === city.latitude && c.longitude === city.longitude);
  if (!exists) {
    cities.push(city);
    saveCities(cities);
  }
}

function removeCity(lat, lon) {
  const filtered = getSavedCities().filter(c => !(c.latitude === lat && c.longitude === lon));
  saveCities(filtered);
}

// ──────────────────────────────────────────────
// ICONOS DEL TIEMPO (Material Symbols)
// ──────────────────────────────────────────────

function getWeatherIcon(code, isDay = true) {
  if (code === 0) return isDay ? 'wb_sunny' : 'clear_night';
  if (code <= 2) return 'partly_cloudy_day';
  if (code === 3) return 'cloud';
  if (code <= 49) return 'foggy';
  if (code <= 59) return 'rainy';
  if (code <= 69) return 'snowing';
  if (code <= 79) return 'cloudy_snowing';
  if (code <= 82) return 'rainy';
  if (code <= 84) return 'snowing';
  if (code <= 86) return 'cloudy_snowing';
  if (code <= 99) return 'thunderstorm';
  return 'wb_cloudy';
}

function getWeatherDesc(code) {
  const map = {
    0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Niebla', 48: 'Niebla con escarcha',
    51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna densa',
    61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia intensa',
    71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada intensa',
    77: 'Granizo',
    80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos fuertes',
    85: 'Nevadas ligeras', 86: 'Nevadas intensas',
    95: 'Tormenta eléctrica', 96: 'Tormenta con granizo', 99: 'Tormenta intensa',
  };
  return map[code] || 'Desconocido';
}

// ──────────────────────────────────────────────
// API – Geocodificación
// ──────────────────────────────────────────────

async function fetchCitySuggestions(query) {
  const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=6&language=es&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error en geocodificación');
  const data = await res.json();
  return data.results || [];
}

// ──────────────────────────────────────────────
// API – Tiempo
// ──────────────────────────────────────────────

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    hourly: 'temperature_2m,weather_code,is_day',
    forecast_days: 2,
    timezone: 'auto',
    wind_speed_unit: 'kmh',
  });
  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error('Error al obtener el tiempo');
  return res.json();
}

// ──────────────────────────────────────────────
// RENDERIZADO – Clima actual
// ──────────────────────────────────────────────

function renderCurrentWeather(data, city) {
  const c = data.current;
  document.getElementById('currentCity').textContent = city.name + (city.country ? `, ${city.country}` : '');
  document.getElementById('currentTemp').textContent = `${Math.round(c.temperature_2m)}°`;
  document.getElementById('currentDesc').textContent = getWeatherDesc(c.weather_code);
  document.getElementById('currentIcon').textContent = getWeatherIcon(c.weather_code, c.is_day);
  document.getElementById('statFeelsLike').textContent = `${Math.round(c.apparent_temperature)}°C`;
  document.getElementById('statHumidity').textContent = `${c.relative_humidity_2m}%`;
  document.getElementById('statWind').textContent = `${Math.round(c.wind_speed_10m)} km/h`;

  updateSaveCityBtn();
  show(currentWeatherEl);
}

// ──────────────────────────────────────────────
// RENDERIZADO – Pronóstico horario
// ──────────────────────────────────────────────

function renderForecast(data, city) {
  forecastTrack.innerHTML = '';

  const now = new Date();
  const times  = data.hourly.time;
  const temps  = data.hourly.temperature_2m;
  const codes  = data.hourly.weather_code;
  const isdays = data.hourly.is_day;

  // Encontrar el índice de la hora actual
  let startIdx = 0;
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]) >= now) { startIdx = i; break; }
  }

  const slice = 24;
  const end = Math.min(startIdx + slice, times.length);

  for (let i = startIdx; i < end; i++) {
    const date  = new Date(times[i]);
    const isNow = i === startIdx;
    const label = isNow ? 'AHORA' : date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const card = createElement('li', { class: 'forecast-card' + (isNow ? ' forecast-card--active' : ''), role: 'listitem' });

    const timeEl = createElement('span', { class: 'forecast-card__time' }, label);
    const icon   = createElement('span', { class: 'forecast-card__icon material-symbols-outlined', 'aria-hidden': 'true' }, getWeatherIcon(codes[i], isdays[i]));
    const temp   = createElement('span', { class: 'forecast-card__temp' }, `${Math.round(temps[i])}°`);
    const desc   = createElement('span', { class: 'forecast-card__desc' }, getWeatherDesc(codes[i]));

    card.appendChild(timeEl);
    card.appendChild(icon);
    card.appendChild(temp);
    card.appendChild(desc);
    forecastTrack.appendChild(card);
  }

  forecastSubtitle.textContent = `Próximas 24 horas – ${city.name}`;
  show(forecastSection);
}

// ──────────────────────────────────────────────
// MAPA INTERACTIVO (Leaflet)
// ──────────────────────────────────────────────

function initMap(lat, lon) {
  const mapContainer = document.getElementById('mapContainer');

  if (!window.L) {
    // Cargar Leaflet dinámicamente si no está cargado
    const cssLink = createElement('link', { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' });
    document.head.appendChild(cssLink);

    const script = createElement('script', { src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js' });
    script.addEventListener('load', () => renderMap(lat, lon, mapContainer));
    document.body.appendChild(script);
  } else {
    renderMap(lat, lon, mapContainer);
  }
}

function renderMap(lat, lon, container) {
  if (map) {
    map.setView([lat, lon], 11);
    if (mapMarker) mapMarker.setLatLng([lat, lon]);
    return;
  }

  map = L.map(container, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lon], 11);

  // Tiles claros: CartoDB Voyager (mucho más legible que el dark)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 19,
  }).addTo(map);

  // Marcador con anillo pulsante
  const pulseHtml = `
    <div style="position:relative;width:20px;height:20px;">
      <div style="position:absolute;inset:0;background:#38bdf8;border-radius:50%;border:2px solid #fff;box-shadow:0 0 10px #38bdf8;"></div>
      <div style="position:absolute;inset:-4px;border-radius:50%;background:#38bdf8;opacity:0.4;animation:mapPulse 2s ease-out infinite;"></div>
    </div>`;

  const customIcon = L.divIcon({
    className: '',
    html: pulseHtml,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  mapMarker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
}

// ──────────────────────────────────────────────
// BÚSQUEDA PRINCIPAL
// ──────────────────────────────────────────────

async function searchCity(query) {
  if (!query.trim()) return;

  hideSuggestions();
  hideMessage();
  hide(currentWeatherEl);
  hide(forecastSection);
  hide(emptyState);
  show(loadingState);

  try {
    const results = await fetchCitySuggestions(query);
    if (!results.length) {
      hide(loadingState);
      show(emptyState);
      showMessage('No se encontró ninguna ciudad con ese nombre.');
      return;
    }
    await loadCityWeather(results[0]);
  } catch (err) {
    hide(loadingState);
    show(emptyState);
    showMessage('Error de conexión. Comprueba tu internet e inténtalo de nuevo.');
  }
}

async function loadCityWeather(cityResult) {
  currentCity = {
    name: cityResult.name,
    country: cityResult.country || '',
    admin1: cityResult.admin1 || '',
    latitude: cityResult.latitude,
    longitude: cityResult.longitude,
  };

  // Persistir la última ciudad cargada
  localStorage.setItem(LS_LAST_KEY, JSON.stringify(currentCity));

  show(loadingState);
  hide(currentWeatherEl);
  hide(forecastSection);
  hide(emptyState);

  try {
    const data = await fetchWeather(currentCity.latitude, currentCity.longitude);
    hide(loadingState);
    renderCurrentWeather(data, currentCity);
    renderForecast(data, currentCity);
    initMap(currentCity.latitude, currentCity.longitude);
    hideMessage();
  } catch (err) {
    hide(loadingState);
    show(emptyState);
    showMessage('No se pudieron obtener los datos meteorológicos.');
  }
}

// ──────────────────────────────────────────────
// SUGERENCIAS
// ──────────────────────────────────────────────

function renderSuggestions(results) {
  suggestionsList.innerHTML = '';

  if (!results.length) {
    hideSuggestions();
    return;
  }

  results.forEach((r, idx) => {
    const li = createElement('li', {
      class: 'suggestion-item',
      role: 'option',
      'aria-selected': 'false',
      'data-idx': idx,
      tabindex: '0',
    });

    const icon = createElement('span', { class: 'suggestion-item__icon material-symbols-outlined', 'aria-hidden': 'true' }, 'location_on');
    const name = createElement('span', { class: 'suggestion-item__name' }, r.name);
    const country = createElement('span', { class: 'suggestion-item__country' }, [r.admin1, r.country].filter(Boolean).join(', '));

    li.appendChild(icon);
    li.appendChild(name);
    li.appendChild(country);

    li.addEventListener('click', () => {
      searchInput.value = r.name;
      hideSuggestions();
      loadCityWeather(r);
    });

    li.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        searchInput.value = r.name;
        hideSuggestions();
        loadCityWeather(r);
      }
    });

    suggestionsList.appendChild(li);
  });

  show(suggestionsList);
}

function hideSuggestions() {
  suggestionsList.innerHTML = '';
  hide(suggestionsList);
}

// ──────────────────────────────────────────────
// GUARDAR CIUDAD
// ──────────────────────────────────────────────

function updateSaveCityBtn() {
  if (!currentCity) return;
  const saved = isCitySaved(currentCity.latitude, currentCity.longitude);
  if (saved) {
    btnSaveCity.classList.add('btn-save-city--saved');
    btnSaveCityIcon.textContent = 'bookmark';
    btnSaveCityText.textContent = 'Ciudad guardada';
  } else {
    btnSaveCity.classList.remove('btn-save-city--saved');
    btnSaveCityIcon.textContent = 'bookmark_add';
    btnSaveCityText.textContent = 'Guardar ciudad';
  }
}

function toggleSaveCity() {
  if (!currentCity) return;
  if (isCitySaved(currentCity.latitude, currentCity.longitude)) {
    removeCity(currentCity.latitude, currentCity.longitude);
  } else {
    addCity(currentCity);
  }
  updateSaveCityBtn();
  renderSavedCitiesSidebar();
  renderModalCities();
}

// ──────────────────────────────────────────────
// RENDERIZADO – Sidebar con ciudades guardadas
// ──────────────────────────────────────────────

function renderSavedCitiesSidebar() {
  savedCitiesList.innerHTML = '';
  const cities = getSavedCities();

  cities.forEach(city => {
    const li = createElement('li', { class: 'saved-city-item', tabindex: '0', 'aria-label': `Ver clima de ${city.name}` });

    const info = document.createElement('div');
    const nameEl = createElement('span', { class: 'saved-city-item__name' }, city.name);
    const countryEl = createElement('span', { class: 'saved-city-item__country' }, city.country);
    info.appendChild(nameEl);
    info.appendChild(countryEl);

    const delBtn = createElement('button', { class: 'saved-city-item__delete', type: 'button', 'aria-label': `Eliminar ${city.name}` });
    const delIcon = createElement('span', { class: 'material-symbols-outlined' }, 'delete');
    delBtn.appendChild(delIcon);

    li.appendChild(info);
    li.appendChild(delBtn);

    li.addEventListener('click', e => {
      if (e.target.closest('.saved-city-item__delete')) {
        e.stopPropagation();
        removeCity(city.latitude, city.longitude);
        renderSavedCitiesSidebar();
        renderModalCities();
        updateSaveCityBtn();
      } else {
        loadCityWeather(city);
        closeSidebarMobile();
      }
    });

    li.addEventListener('keydown', e => {
      if (e.key === 'Enter') { loadCityWeather(city); closeSidebarMobile(); }
    });

    savedCitiesList.appendChild(li);
  });
}

// ──────────────────────────────────────────────
// RENDERIZADO – Modal ciudades
// ──────────────────────────────────────────────

function renderModalCities() {
  modalCitiesList.innerHTML = '';
  const cities = getSavedCities();

  if (!cities.length) {
    show(modalEmpty);
    return;
  }
  hide(modalEmpty);

  cities.forEach(city => {
    const li = createElement('li', { class: 'modal-city-item', tabindex: '0', 'aria-label': `Ver clima de ${city.name}` });

    const icon = createElement('span', { class: 'modal-city-item__icon material-symbols-outlined', 'aria-hidden': 'true' }, 'location_city');

    const infoDiv = document.createElement('div');
    infoDiv.className = 'modal-city-item__info';
    const nameEl    = createElement('p', { class: 'modal-city-item__name' }, city.name);
    const countryEl = createElement('p', { class: 'modal-city-item__country' }, [city.admin1, city.country].filter(Boolean).join(', '));
    infoDiv.appendChild(nameEl);
    infoDiv.appendChild(countryEl);

    const delBtn = createElement('button', { class: 'modal-city-item__delete', type: 'button', 'aria-label': `Eliminar ${city.name}` });
    const delIcon = createElement('span', { class: 'material-symbols-outlined' }, 'delete');
    delBtn.appendChild(delIcon);

    li.appendChild(icon);
    li.appendChild(infoDiv);
    li.appendChild(delBtn);

    li.addEventListener('click', e => {
      if (e.target.closest('.modal-city-item__delete')) {
        e.stopPropagation();
        removeCity(city.latitude, city.longitude);
        renderModalCities();
        renderSavedCitiesSidebar();
        updateSaveCityBtn();
      } else {
        loadCityWeather(city);
        closeModal();
      }
    });

    li.addEventListener('keydown', e => {
      if (e.key === 'Enter') { loadCityWeather(city); closeModal(); }
    });

    modalCitiesList.appendChild(li);
  });
}

// ──────────────────────────────────────────────
// MODAL – Abrir / Cerrar
// ──────────────────────────────────────────────

function openModal() {
  renderModalCities();
  show(modalOverlay);
  btnCloseModal.focus();
}

function closeModal() {
  hide(modalOverlay);
}

// ──────────────────────────────────────────────
// SIDEBAR MOBILE
// ──────────────────────────────────────────────

function openSidebarMobile() {
  sidebar.classList.add('sidebar--open');
  show(sidebarOverlay);
}

function closeSidebarMobile() {
  sidebar.classList.remove('sidebar--open');
  hide(sidebarOverlay);
}

// ──────────────────────────────────────────────
// EVENTOS
// ──────────────────────────────────────────────

// Búsqueda
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  searchCity(searchInput.value.trim());
});

// Sugerencias mientras escribe
searchInput.addEventListener('input', () => {
  const val = searchInput.value.trim();
  searchClearBtn.hidden = !val;

  clearTimeout(debounceTimer);
  if (val.length < 2) { hideSuggestions(); return; }

  debounceTimer = setTimeout(async () => {
    try {
      const results = await fetchCitySuggestions(val);
      renderSuggestions(results);
    } catch { hideSuggestions(); }
  }, 350);
});

// Limpiar input
searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchClearBtn.hidden = true;
  hideSuggestions();
  hideMessage();
  searchInput.focus();
});

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', e => {
  if (!e.target.closest('.search-section')) hideSuggestions();
});

// Scroll horizontal del forecast
btnScrollLeft.addEventListener('click', () => {
  forecastTrack.scrollBy({ left: -280, behavior: 'smooth' });
});
btnScrollRight.addEventListener('click', () => {
  forecastTrack.scrollBy({ left: 280, behavior: 'smooth' });
});

// Guardar ciudad
btnSaveCity.addEventListener('click', toggleSaveCity);

// Modal
modalTriggers.forEach(btn => { if (btn) btn.addEventListener('click', openModal); });
btnCloseModal.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

// Sidebar mobile
btnMenuMobile.addEventListener('click', openSidebarMobile);
sidebarOverlay.addEventListener('click', closeSidebarMobile);

// Tecla ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeSidebarMobile();
    hideSuggestions();
  }
});

// ──────────────────────────────────────────────
// GEOLOCALIZACIÓN AUTOMÁTICA
// ──────────────────────────────────────────────

async function reverseGeocode(lat, lon) {
  try {
    const url = `${NOMINATIM}?format=json&lat=${lat}&lon=${lon}&accept-language=es`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    const data = await res.json();
    const addr = data.address || {};
    return {
      name: addr.city || addr.town || addr.village || addr.county || 'Mi ubicación',
      country: addr.country || '',
      admin1: addr.state || '',
      latitude: lat,
      longitude: lon,
    };
  } catch {
    return { name: 'Mi ubicación', country: '', admin1: '', latitude: lat, longitude: lon };
  }
}

async function initGeolocation() {
  // 1. Si hay una ciudad persistida, cargarla primero
  try {
    const lastRaw = localStorage.getItem(LS_LAST_KEY);
    if (lastRaw) {
      const last = JSON.parse(lastRaw);
      if (last && last.latitude) {
        await loadCityWeather(last);
        return;
      }
    }
  } catch { /* ignorar */ }

  // 2. Sin ciudad guardada → pedir geolocalización al navegador
  if (!navigator.geolocation) {
    show(emptyState);
    showMessage('Tu navegador no soporta geolocalización. Busca una ciudad manualmente.', 'info');
    return;
  }

  show(loadingState);
  hide(emptyState);
  showMessage('Detectando tu ubicación...', 'info');

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      hideMessage();
      const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      await loadCityWeather(city);
    },
    () => {
      hide(loadingState);
      show(emptyState);
      showMessage('No se pudo obtener tu ubicación. Busca una ciudad manualmente.', 'info');
    },
    { timeout: 8000, maximumAge: 300000 }
  );
}

// ──────────────────────────────────────────────
// INICIO
// ──────────────────────────────────────────────

renderSavedCitiesSidebar();
initGeolocation();
