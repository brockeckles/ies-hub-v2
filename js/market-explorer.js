// ═══════════════════════════════════════════════════════════════════
// Market Explorer Module — Leaflet map, market pins, detail panels
// ═══════════════════════════════════════════════════════════════════
// Dependencies from core.js:
//   - sb                 (Supabase client)
//   - esc()              (HTML escaping utility)
//   - MARKET_PINS        (array, populated by loadMarketPins())
//   - MARKET_PINS_FALLBACK (hardcoded fallback pins)
//   - loadMarketPins()   (async loader from master_markets)
//   - mapInstance         (Leaflet map reference, declared in core)
//   - marketCache         (object cache for fetched market data)
//   - activeMarker        (currently highlighted Leaflet marker)
//   - LINK_SVG            (inline SVG for external link icon)
//   - switchMarketTab()   (tab switching for market detail panel)
// ═══════════════════════════════════════════════════════════════════

function getScoreColor(score) {
  if (score >= 60) return '#198754';
  if (score >= 45) return '#ffc107';
  return '#dc3545';
}

function getScoreCSSVar(score) {
  if (score >= 60) return 'var(--ies-green)';
  if (score >= 45) return 'var(--ies-yellow)';
  return 'var(--ies-red)';
}

async function initMap() {
  if (mapInstance) return; // already initialized

  const container = document.getElementById('leafletMap');
  if (!container) { console.error('initMap: #leafletMap not found'); return; }

  // Check Leaflet loaded
  if (typeof L === 'undefined') {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#dc3545;font-weight:600;">Leaflet library failed to load. Check your internet connection and refresh.</div>';
    console.error('initMap: Leaflet (L) is undefined');
    return;
  }

  try {
    mapInstance = L.map('leafletMap', {
      center: [37.5, -96],
      zoom: 4,
      minZoom: 3,
      maxZoom: 8,
      zoomControl: true,
      attributionControl: false,
      tap: false,           // Prevent Leaflet tap handler from swallowing clicks on circle markers
    });

    // Clean, light tile layer (CartoDB Positron — no API key needed)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Force a resize after a short delay to ensure tiles render
    setTimeout(() => { if (mapInstance) mapInstance.invalidateSize(); }, 300);
  } catch(e) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#dc3545;font-weight:600;">Map error: ' + e.message + '</div>';
    console.error('initMap error:', e);
    return;
  }

  // Dynamically load market pins from master_markets
  MARKET_PINS = await loadMarketPins();

  // Tier-based pin sizing
  var tierRadius = { 'Tier 1': 14, 'Tier 2': 11, 'Tier 3': 8 };
  var presenceColor = { yes: '#6c757d', no: '#bbb', planned: '#f59e0b' };

  // Add market pins with color-coded circles
  MARKET_PINS.forEach(pin => {
    const marker = L.circleMarker([pin.lat, pin.lng], {
      radius: tierRadius[pin.tier] || 10,
      fillColor: presenceColor[pin.presence] || '#6c757d',
      color: '#fff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.9,
      className: 'market-map-pin',
    }).addTo(mapInstance);

    // Tooltip on hover
    marker.bindTooltip(`<strong>${pin.name}</strong><br><span style="font-size:11px;">${pin.tier || ''} · Click for intelligence</span>`, {
      direction: 'top',
      offset: [0, -10],
      className: 'map-tooltip-custom',
    });

    // Click handler
    marker.on('click', () => selectMarket(pin.name, marker));

    // Store reference
    pin.marker = marker;
  });

  // Load labor scores to color the pins
  colorPinsByLabor();
}

async function colorPinsByLabor() {
  if (!sb) { console.warn('colorPinsByLabor: no Supabase client'); return; }
  try {
  var { data } = await sb.from('labor_markets')
    .select('msa, availability_score')
    .order('as_of_date', { ascending: false });
  } catch(e) { console.warn('colorPinsByLabor error:', e); return; }

  if (!data) return;

  // Build MSA → score lookup
  const scoreMap = {};
  data.forEach(r => { if (!scoreMap[r.msa]) scoreMap[r.msa] = r.availability_score; });

  MARKET_PINS.forEach(pin => {
    const score = scoreMap[pin.laborKey];
    if (score !== undefined && pin.marker) {
      pin.marker.setStyle({ fillColor: getScoreColor(score) });
      pin.marker.setTooltipContent(
        `<strong>${pin.name}</strong><br>` +
        `<span style="font-size:11px;">Labor Score: ${score}/100 · Click for detail</span>`
      );
    }
  });
}

async function getMarketData(market) {
  if (marketCache[market]) return marketCache[market];

  const pin = MARKET_PINS.find(p => p.name === market);
  const reKey = pin?.reKey || market;
  const laborKey = pin?.laborKey || market;
  /* Also try city-only key for matching (e.g., "Tracy" from "Tracy, CA") */
  const cityOnly = market.split(',')[0].split('\u2013')[0].trim();

  const [laborRes, reRes, newsRes, dealsRes, freightRes] = await Promise.all([
    sb.from('labor_markets').select('*').eq('msa', cityOnly).order('as_of_date', { ascending: false }).limit(1).maybeSingle(),
    sb.from('industrial_real_estate').select('*').eq('market', cityOnly).order('quarter', { ascending: false }).limit(1).maybeSingle(),
    sb.from('competitor_news').select('headline, competitor, published_date, tags, source_url').order('published_date', { ascending: false }).limit(10),
    sb.from('pipeline_deals').select('deal_name, stage, tcv, vertical').ilike('market', `%${cityOnly}%`),
    sb.from('market_freight').select('*').eq('market', cityOnly).order('as_of_date', { ascending: false }).limit(1).maybeSingle(),
  ]);

  // Filter news for market relevance
  const marketKeywords = market.toLowerCase().split(/[,\u2013\s]+/).filter(w => w.length > 2);
  const relevantNews = (newsRes.data || []).filter(n => {
    const text = (n.headline + ' ' + (n.tags || []).join(' ')).toLowerCase();
    return marketKeywords.some(kw => text.includes(kw));
  }).slice(0, 3);
  const newsToShow = relevantNews.length > 0 ? relevantNews : (newsRes.data || []).slice(0, 3);

  /* Also fetch basic market profile from master_markets for the overview */
  var profileRes = await sb.from('master_markets').select('*').eq('city', cityOnly).eq('status', 'active').limit(1).maybeSingle();

  const result = {
    labor: laborRes.data,
    realEstate: reRes.data,
    freight: freightRes.data,
    news: newsToShow,
    deals: dealsRes.data || [],
    profile: profileRes.data
  };
  marketCache[market] = result;
  return result;
}

async function selectMarket(market, marker) {
  // Highlight active marker
  if (activeMarker) activeMarker.setStyle({ weight: 2.5, color: '#fff' });
  if (marker) { marker.setStyle({ weight: 3.5, color: '#ff3a00' }); activeMarker = marker; }

  document.getElementById('detailMarketName').textContent = market;
  document.getElementById('detailMarketSub').textContent = 'Loading\u2026';
  document.getElementById('marketDetailBody').innerHTML = '<div style="padding:20px;color:var(--ies-gray-600);">Loading market intelligence\u2026</div>';

  try {
    if (!sb) throw new Error('Supabase client not connected');
    var data = await getMarketData(market);
  } catch(e) {
    document.getElementById('detailMarketSub').textContent = '';
    document.getElementById('marketDetailBody').innerHTML = '<div style="padding:20px;color:#dc3545;font-size:13px;"><strong>Data load error:</strong> ' + e.message + '</div>';
    return;
  }

  const scoreColor = data.labor ? getScoreCSSVar(data.labor.availability_score) : 'var(--ies-gray-600)';
  if (data.labor) {
    document.getElementById('detailMarketSub').innerHTML =
      `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${scoreColor};margin-right:4px;"></span>${data.labor.availability_status} labor market \u00b7 Score: ${data.labor.availability_score}/100`;
  } else if (data.profile) {
    var p = data.profile;
    var parts = [];
    if (p.region) parts.push(p.region);
    if (p.market_tier) parts.push(p.market_tier);
    if (p.gxo_presence === 'yes') parts.push('GXO Active');
    else if (p.gxo_presence === 'planned') parts.push('GXO Planned');
    document.getElementById('detailMarketSub').textContent = parts.join(' \u00b7 ') || 'Market added \u2014 intelligence data pending';
  } else {
    document.getElementById('detailMarketSub').textContent = 'No intelligence data yet';
  }

  // Show the tabs bar
  var tabsBar = document.getElementById('marketDetailTabs');
  if (tabsBar) tabsBar.style.display = 'flex';

  // Determine active tab (default: labor)
  var activeTab = window.activeMarketTab || 'labor';

  let html = '';

  // ── Labor tab ──
  html += '<div class="market-tab-panel" data-tab="labor" style="' + (activeTab !== 'labor' ? 'display:none;' : '') + '">';
  if (data.labor) {
    const l = data.labor;
    html += `<div class="map-detail-section">
      <div class="map-detail-label">Labor Intelligence</div>
      <div class="map-detail-row"><span>Avg Warehouse Wage</span><span class="map-detail-value">$${parseFloat(l.avg_warehouse_wage).toFixed(2)}/hr</span></div>
      <div class="map-detail-row"><span>Availability Score <span class="info-tip" tabindex="0">i</span></span><span class="map-detail-value" style="color:${scoreColor}">${l.availability_score}/100</span></div>
      <div class="map-detail-row"><span>Time to Fill</span><span class="map-detail-value">${l.avg_time_to_fill_days || '\u2014'} days</span></div>
      <div class="map-detail-row"><span>Turnover Rate</span><span class="map-detail-value">${l.turnover_rate || '\u2014'}%</span></div>
      <div class="map-detail-row"><span>Trend</span><span class="map-detail-value">${l.trend === 'up' ? '\u25b2 improving' : l.trend === 'down' ? '\u25bc worsening' : '\u2500 stable'}</span></div>
    </div>`;
  } else {
    html += '<div class="map-detail-section"><div class="map-detail-label">Labor Intelligence</div>';
    html += '<div style="font-size:12px;color:var(--ies-gray-400);padding:8px 0;">No labor data available yet for this market</div>';
    if (data.profile) {
      var p = data.profile;
      html += '<div class="map-detail-label" style="margin-top:12px;">Market Profile</div>';
      if (p.region) html += '<div class="map-detail-row"><span>Region</span><span class="map-detail-value">' + esc(p.region) + '</span></div>';
      if (p.market_tier) html += '<div class="map-detail-row"><span>Market Tier</span><span class="map-detail-value">' + esc(p.market_tier) + '</span></div>';
      if (p.gxo_presence) html += '<div class="map-detail-row"><span>GXO Presence</span><span class="map-detail-value" style="text-transform:capitalize;">' + esc(p.gxo_presence) + '</span></div>';
      if (p.metro_area) html += '<div class="map-detail-row"><span>Metro Area</span><span class="map-detail-value">' + esc(p.metro_area) + '</span></div>';
      if (p.estimated_population) html += '<div class="map-detail-row"><span>Est. Population</span><span class="map-detail-value">' + Number(p.estimated_population).toLocaleString() + '</span></div>';
    }
    html += '</div>';
  }
  html += '</div>';

  // ── Real Estate tab ──
  html += '<div class="market-tab-panel" data-tab="realestate" style="' + (activeTab !== 'realestate' ? 'display:none;' : '') + '">';
  if (data.realEstate) {
    const r = data.realEstate;
    html += `<div class="map-detail-section">
      <div class="map-detail-label">Industrial Real Estate</div>
      <div class="map-detail-row"><span>Lease Rate</span><span class="map-detail-value">$${parseFloat(r.lease_rate_psf).toFixed(2)} PSF/yr</span></div>
      <div class="map-detail-row"><span>Vacancy Rate</span><span class="map-detail-value">${r.vacancy_rate}%</span></div>
      <div class="map-detail-row"><span>YoY Change</span><span class="map-detail-value" style="color:${parseFloat(r.yoy_change) > 0 ? 'var(--ies-red)' : 'var(--ies-green)'}">${parseFloat(r.yoy_change) > 0 ? '+' : ''}${r.yoy_change}%</span></div>
      <div class="map-detail-row"><span>Source</span><span style="font-size:11px;color:var(--ies-gray-600)">${r.source} \u00b7 ${r.quarter}</span></div>
    </div>`;
  } else {
    html += '<div style="font-size:12px;color:var(--ies-gray-400);padding:12px 0;">No real estate data available for this market</div>';
  }
  html += '</div>';

  // ── Freight tab ──
  html += '<div class="market-tab-panel" data-tab="freight" style="' + (activeTab !== 'freight' ? 'display:none;' : '') + '">';
  if (data.freight) {
    const f = data.freight;
    const capacityColor = f.tl_capacity === 'Tight' ? 'var(--ies-red)' : (f.tl_capacity === 'Balanced' ? '#b58a00' : 'var(--ies-green)');
    html += `<div class="map-detail-section">
      <div class="map-detail-label">Freight & Transportation</div>
      <div class="map-detail-row"><span>Avg Outbound Rate (TL)</span><span class="map-detail-value">$${parseFloat(f.avg_outbound_rate_per_mile || 0).toFixed(2)}/mi</span></div>
      <div class="map-detail-row"><span>Avg Inbound Rate (TL)</span><span class="map-detail-value">$${parseFloat(f.avg_inbound_rate_per_mile || 0).toFixed(2)}/mi</span></div>
      <div class="map-detail-row"><span>TL Capacity</span><span class="map-detail-value" style="color:${capacityColor};font-weight:700;">${f.tl_capacity || '\u2014'}</span></div>
      <div class="map-detail-row"><span>LTL Avg Transit</span><span class="map-detail-value">${f.ltl_transit_days || '\u2014'} days</span></div>
      <div class="map-detail-row"><span>Intermodal</span><span class="map-detail-value">${f.intermodal_available ? '\u2713 Available' : '\u2717 Limited'}</span></div>
      <div class="map-detail-row"><span>Nearest Port</span><span class="map-detail-value">${f.nearest_port || '\u2014'} (${f.port_dwell_days || '\u2014'}d dwell)</span></div>
    </div>`;
    if (f.top_lanes && f.top_lanes.length) {
      html += `<div class="map-detail-section"><div class="map-detail-label">Top Outbound Lanes</div>`;
      f.top_lanes.forEach(lane => { html += `<div class="map-detail-row" style="font-size:12px;"><span>${lane}</span></div>`; });
      html += `</div>`;
    }
    if (f.notes) {
      html += `<div class="map-detail-section"><div class="map-detail-label">Market Notes</div><div style="font-size:12px;color:var(--ies-gray-600);line-height:1.5;">${esc(f.notes)}</div></div>`;
    }
    html += `<div style="font-size:10px;color:var(--ies-gray-400);margin-top:8px;">Source: ${esc(f.source || '')} \u00b7 As of ${f.as_of_date || ''}</div>`;
  } else {
    html += '<div style="font-size:12px;color:var(--ies-gray-400);padding:12px 0;">No freight data available for this market</div>';
  }
  html += '</div>';

  // ── Deals tab ──
  html += '<div class="market-tab-panel" data-tab="deals" style="' + (activeTab !== 'deals' ? 'display:none;' : '') + '">';
  if (data.deals && data.deals.length > 0) {
    html += `<div class="map-detail-section"><div class="map-detail-label">Active Deals in Market</div>`;
    data.deals.forEach(d => {
      html += `<div class="map-detail-row"><span>${d.deal_name}</span><span class="map-detail-value">$${(d.tcv/1000000).toFixed(1)}M</span></div>`;
    });
    html += `</div>`;
  } else {
    html += '<div style="font-size:12px;color:var(--ies-gray-400);padding:12px 0;">No active deals in this market</div>';
  }
  html += '</div>';

  // ── News tab ──
  html += '<div class="market-tab-panel" data-tab="news" style="' + (activeTab !== 'news' ? 'display:none;' : '') + '">';
  html += `<div class="map-detail-section"><div class="map-detail-label">Latest Intelligence</div>`;
  if (data.news && data.news.length > 0) {
    data.news.forEach(n => {
      var safeHeadline = esc(n.headline);
      var titleHtml = n.source_url
        ? '<a href="' + esc(n.source_url) + '" target="_blank" rel="noopener" class="map-news-title" style="color:var(--ies-navy);text-decoration:none;">' + safeHeadline + ' ' + LINK_SVG + '</a>'
        : '<div class="map-news-title">' + safeHeadline + '</div>';
      html += '<div class="map-news-item">' + titleHtml +
        '<div class="map-news-meta">' + esc(n.competitor || 'Industry') + ' \u00b7 ' + (n.published_date || '') + '</div></div>';
    });
  } else {
    html += '<div style="font-size:12px;color:var(--ies-gray-400);padding:8px 0;">No market-specific news this week</div>';
  }
  html += '</div></div>';

  document.getElementById('marketDetailBody').innerHTML = html;
}
