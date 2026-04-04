// ═══════════════════════════════════════════════════════════════════════════════
// core.js — IES Intelligence Hub: Foundational Module
// ═══════════════════════════════════════════════════════════════════════════════
// This is the base module that ALL other modules depend on. It provides:
//   - Supabase client initialization
//   - Error banner utilities (showSectionError, clearSectionError)
//   - Landing empty-state toggle
//   - Vertical metadata (loadVerticalMeta, getVerticalLabel, getVerticalColor, getVerticalOptions)
//   - Chart/map instance variables and market pin declarations
//   - MARKET_PINS, MARKET_PINS_FALLBACK, loadMarketPins()
//   - Navigation system (navigate, kpiNav)
//   - Guided tour (TOUR_STEPS, startTour, closeTour, renderTourStep, etc.)
//   - Tab switching (switchTab)
//   - Global search (handleSearch, searchKeyNav, searchSelect, etc.)
//   - Signal feed filters, sector pulse toggle, data library toggle
//   - Market detail tabs, deal context bar
//   - Sources modal (showSources, closeSources)
//   - Timestamp & refresh (updateTimestamp, refreshData)
//   - Text utilities (esc, escAttr, stripHtml, LINK_SVG)
//
// IMPORTANT: Nothing here is wrapped in a module pattern. All declarations are
// global so that inline HTML handlers and other <script> modules can reach them.
// ═══════════════════════════════════════════════════════════════════════════════

// ── SUPABASE + MAP DATA (declared early to avoid TDZ issues) ──
var SUPABASE_URL = 'https://dklnwcshrpamzsybjlzb.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbG53Y3NocnBhbXpzeWJqbHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU3NzksImV4cCI6MjA5MDI5MTc3OX0.mj9TIj_rwxfbb9e2vBnA6hNYot5MX8-k1BbGfddAeJs';
var sb = null;
try { sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch(e) { console.warn('Supabase init failed:', e); setTimeout(function(){ showSectionError('sec-welcome', 'Database connection failed. Some features may be unavailable. Try refreshing the page.'); }, 500); }

// ── Number formatting utility ──
// fmtNum(12500)         → "12,500"
// fmtNum(12500.5, 1)    → "12,500.5"
// fmtNum(12500, 0, '$') → "$12,500"
function fmtNum(val, decimals, prefix) {
  if (val == null || isNaN(val)) return '—';
  var n = typeof decimals === 'number' ? Number(val).toFixed(decimals) : String(Math.round(Number(val)));
  var parts = n.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (prefix || '') + parts.join('.');
}

// ── User-facing error banner utility ──
function showSectionError(containerId, message) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var existing = container.querySelector('.hub-error-banner');
  if (existing) existing.remove();
  var banner = document.createElement('div');
  banner.className = 'hub-error-banner';
  banner.style.cssText = 'background:rgba(220,53,69,.06);border:1px solid rgba(220,53,69,.2);border-radius:8px;padding:14px 18px;margin:12px 0;display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ies-red);font-weight:500;';
  banner.innerHTML = '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
    '<span>' + esc(message) + '</span>' +
    '<button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:var(--ies-red);cursor:pointer;font-size:16px;line-height:1;padding:0 4px;">&times;</button>';
  container.prepend(banner);
}
function clearSectionError(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var existing = container.querySelector('.hub-error-banner');
  if (existing) existing.remove();
}

// ── Toggle landing empty state vs actions ──
function dtToggleLandingEmpty(actionsId, emptyId, isEmpty) {
  var actions = document.getElementById(actionsId);
  var empty = document.getElementById(emptyId);
  if (actions) actions.style.display = isEmpty ? 'none' : 'block';
  if (empty) empty.style.display = isEmpty ? 'block' : 'none';
}

// ── Global Vertical Metadata (fetched from master_verticals) ──
var verticalMeta = {}; // keyed by enum_key: { label, color, icon, id }
var verticalMetaLoaded = false;
async function loadVerticalMeta() {
  if (verticalMetaLoaded) return verticalMeta;
  try {
    var { data } = await sb.from('master_verticals').select('id,vertical_name,enum_key,color,icon,status').eq('status', 'active').order('vertical_name');
    if (data) {
      data.forEach(function(v) {
        if (v.enum_key) {
          verticalMeta[v.enum_key] = { label: v.vertical_name, color: v.color || '#6b7a90', icon: v.icon || '', id: v.id };
        }
      });
      // Also add 'other' fallback
      if (!verticalMeta.other) verticalMeta.other = { label: 'Other', color: '#6b7a90', icon: '', id: null };
    }
    verticalMetaLoaded = true;
  } catch(e) { console.warn('loadVerticalMeta error:', e); }
  return verticalMeta;
}
function getVerticalLabel(enumKey) { var m = verticalMeta[enumKey]; return m ? m.label : (enumKey || '').replace(/_/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); }); }
function getVerticalColor(enumKey) { var m = verticalMeta[enumKey]; return m ? m.color : '#6b7a90'; }
function getVerticalOptions(selected) {
  var html = '<option value="">Select...</option>';
  Object.keys(verticalMeta).forEach(function(key) {
    var v = verticalMeta[key];
    html += '<option value="' + key + '"' + (key === selected ? ' selected' : '') + '>' + v.label + '</option>';
  });
  return html;
}

var dieselChartInstance, laborChartInstance, pipelineChartInstance, freightChartInstance;
var mapInstance = null;
var marketCache = {};
var activeMarker = null;
/* MARKET_PINS — loaded dynamically from master_markets in initMap().
   Fallback hardcoded set used only if Supabase fetch fails. */
var MARKET_PINS = [];
var MARKET_PINS_FALLBACK = [
  { name: 'Inland Empire, CA', abbr: 'IE', lat: 33.95, lng: -117.40, reKey: 'Inland Empire', laborKey: 'Inland Empire' },
  { name: 'Phoenix, AZ', abbr: 'PHX', lat: 33.45, lng: -112.07, reKey: 'Phoenix', laborKey: 'Phoenix' },
  { name: 'Dallas, TX', abbr: 'DFW', lat: 32.78, lng: -96.80, reKey: 'Dallas', laborKey: 'Dallas' },
  { name: 'Memphis, TN', abbr: 'MEM', lat: 35.15, lng: -90.05, reKey: 'Memphis', laborKey: 'Memphis' },
  { name: 'Chicago, IL', abbr: 'CHI', lat: 41.88, lng: -87.63, reKey: 'Chicago', laborKey: 'Chicago' },
  { name: 'Indianapolis, IN', abbr: 'IND', lat: 39.77, lng: -86.16, reKey: 'Indianapolis', laborKey: 'Indianapolis' },
  { name: 'Atlanta, GA', abbr: 'ATL', lat: 33.75, lng: -84.39, reKey: 'Atlanta', laborKey: 'Atlanta' },
  { name: 'Columbus, OH', abbr: 'COL', lat: 39.96, lng: -82.99, reKey: 'Columbus', laborKey: 'Columbus' },
  { name: 'Savannah, GA', abbr: 'SAV', lat: 32.08, lng: -81.09, reKey: 'Savannah', laborKey: 'Savannah' },
  { name: 'Central PA, PA', abbr: 'CPA', lat: 40.27, lng: -76.88, reKey: 'Central PA', laborKey: 'Central PA' },
];

async function loadMarketPins() {
  if (!sb) return MARKET_PINS_FALLBACK;
  try {
    var res = await sb.from('master_markets').select('id,city,state,region,market_tier,gxo_presence,latitude,longitude,labor_key,re_key').eq('status', 'active').order('city');
    if (!res.data || res.data.length === 0) return MARKET_PINS_FALLBACK;
    return res.data.filter(function(m) { return m.latitude && m.longitude; }).map(function(m) {
      var displayName = m.city;
      /* Append state abbreviation for disambiguation when helpful */
      if (m.state && m.state.length === 2) displayName = m.city + ', ' + m.state;
      else if (m.state && m.city !== m.state) {
        /* Use first letters as abbr for display */
        var words = m.state.split(' ');
        var abbr = words.map(function(w) { return w.charAt(0); }).join('').toUpperCase();
        if (abbr.length <= 3) displayName = m.city;
      }
      return {
        id: m.id,
        name: displayName,
        abbr: m.city.substring(0, 3).toUpperCase(),
        lat: parseFloat(m.latitude),
        lng: parseFloat(m.longitude),
        reKey: m.re_key || displayName,
        laborKey: m.labor_key || displayName,
        tier: m.market_tier || 'Tier 3',
        presence: m.gxo_presence || 'no',
        region: m.region || ''
      };
    });
  } catch(e) {
    console.warn('loadMarketPins: falling back to hardcoded pins', e);
    return MARKET_PINS_FALLBACK;
  }
}

// ── NAVIGATION ──
var _navSections = null;
var _navItems = null;
function navigate(section, el) {
  if (!_navSections) _navSections = document.querySelectorAll('.section');
  if (!_navItems) _navItems = document.querySelectorAll('.nav-item');
  _navSections.forEach(s => s.classList.remove('active'));
  _navItems.forEach(n => n.classList.remove('active'));
  var secEl = document.getElementById('sec-' + section);
  if (secEl) secEl.classList.add('active');
  if (el) el.classList.add('active');

  // Cost Model and Fleet Modeler are children of Design Tools — keep sidebar highlighting
  if ((section === 'costmodel' || section === 'fleet' || section === 'most') && !el) {
    var dtNav = document.querySelector('[data-section=designtools]');
    if (dtNav) dtNav.classList.add('active');
  }

  // Sync tool tabs when entering costmodel, fleet, most, or returning to designtools
  if (section === 'costmodel' && typeof dtSyncActiveTab === 'function') dtSyncActiveTab('Cost Model');
  if (section === 'fleet' && typeof dtSyncActiveTab === 'function') dtSyncActiveTab('Fleet Modeler');
  if (section === 'most' && typeof dtSyncActiveTab === 'function') dtSyncActiveTab('MOST Standards');
  if (section === 'designtools' && typeof dtSyncActiveTab === 'function') {
    dtSyncActiveTab('All Tools');
    // Show the landing panel
    var dtPanels = document.querySelectorAll('.dt-panel');
    for (var dp = 0; dp < dtPanels.length; dp++) dtPanels[dp].style.display = 'none';
    var dtLanding = document.getElementById('dt-landing');
    if (dtLanding) dtLanding.style.display = 'block';
  }

  // Scroll to top of content area
  window.scrollTo(0, 0);
  var main = document.querySelector('.main');
  if (main) main.scrollTop = 0;

  // Leaflet needs a visible container — init or resize when Market Map is shown
  if (section === 'marketmap') {
    setTimeout(function() {
      try {
        if (!mapInstance) { initMap(); }
        else { mapInstance.invalidateSize(); }
        setTimeout(function() { if (mapInstance) mapInstance.invalidateSize(); }, 500);
      } catch(e) {
        document.getElementById('leafletMap').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#dc3545;font-weight:600;font-size:14px;">Map error: ' + e.message + '</div>';
      }
    }, 300);
  }

  // Load default wiki page when Training is shown
  if (section === 'training') {
    var wc = document.getElementById('wikiContent');
    if (wc && !wc.innerHTML.trim()) showWiki('scc-g2p');
  }

  // Reset Deals view when navigating to it
  if (section === 'deals') {
    pmBackToPipeline();
    pmLoadAll();
    dmLoadDeals();
  }

  // Load Command Center data when navigating to overview
  if (section === 'overview') {
    if (typeof loadAllData === 'function') loadAllData();
  }

  // Load Change Management data when navigating to it
  if (section === 'changemanagement') {
    cmLoadAll();
  }

  // Load Analytics dashboard
  if (section === 'analytics') {
    anLoadDashboard();
  }

  // Load feedback data when navigating to feedback section
  if (section === 'feedback') {
    fbLoadAll();
  }

  // Load admin panel when navigating to it
  if (section === 'admin') {
    if (typeof loadAdminPanel === 'function') {
      loadAdminPanel();
    }
  }

  // Cost Model: reset to landing page and refresh project list
  if (section === 'costmodel') {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('editorContainer').style.display = 'none';
    document.getElementById('topbarControls').style.display = 'none';
    cmApp.loadProjects();
  }

  // Fleet Modeler: show landing page when section is opened
  if (section === 'fleet') {
    fmShowLanding();
  }

  // MOST Standards: init and show landing
  if (section === 'most') {
    mostApp.init();
  }

  // Track page view for analytics
  anTrackPageView(section);
}

// Scroll to a chart on the Command Center page
function kpiNav(chartId) {
  var el = document.getElementById(chartId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Brief highlight flash on the parent card
    var card = el.closest('.card, .hub-card');
    if (card) {
      card.style.boxShadow = '0 0 0 2px var(--ies-orange)';
      setTimeout(function() { card.style.boxShadow = ''; }, 1500);
    }
  }
}


// ═══════════════════════════════════════════════════
// GUIDED TOUR
// ═══════════════════════════════════════════════════
var TOUR_STEPS = [
  { icon: '\u{1F44B}', title: 'Welcome to the IES Intelligence Hub', desc: 'This platform brings together real-time market data, competitive intelligence, training resources, project tracking, and change management \u2014 everything the IES Solutions Design team needs in one place.' },
  { icon: '\u{1F4CA}', title: 'Command Center', desc: 'Your operational nerve center. Live KPIs, diesel/labor/freight charts, a unified signal feed aggregating competitor, tariff, and account intelligence, plus Sector Pulse cards for automation, verticals, and macro trends.' },
  { icon: '\u{1F4CD}', title: 'Market Explorer', desc: 'Interactive map of key GXO markets with tabbed detail panels (Labor, Real Estate, Freight, Deals, News). Toggle the Data Library below the map for full tables on real estate, labor, utilities, materials, and construction costs.' },
  { icon: '\u{1F4CB}', title: 'Deal Management', desc: 'Stage-gated deal pipeline with kanban views, activity tracking per stage, forecast vs. actual hours, deal progression tracking, and deal strategy development. Backed by Supabase with structured stage workflows.' },
  { icon: '\u{1F504}', title: 'Change Management', desc: 'Track team changes through the ADKAR methodology \u2014 Awareness, Desire, Knowledge, Ability, Reinforcement. Manage sub-activities, build process flowcharts, and watch initiatives auto-advance as work completes.' },
  { icon: '\u{1F4D6}', title: 'Training Wiki', desc: '23+ page reference library covering 12 Solutions Competency Centers, Blue Yonder WMS, conveyor systems, warehouse design, MOST work measurement, 3PL commercial structure, and win strategy development.' },
  { icon: '\u{1F680}', title: 'What\'s Coming Next', desc: 'The roadmap includes Supabase Auth migration (replacing access codes), mobile responsive design, audit logging, Salesforce/Snowflake integrations, and enterprise Azure AD SSO. Check the roadmap on the Welcome page for the full plan.' },
];
var tourStep = 0;

function startTour() {
  tourStep = 0;
  renderTourStep();
  document.getElementById('tourOverlay').classList.add('active');
}
function closeTour() {
  document.getElementById('tourOverlay').classList.remove('active');
}
function tourNext() {
  if (tourStep < TOUR_STEPS.length - 1) { tourStep++; renderTourStep(); }
  else { closeTour(); }
}
function tourPrev() {
  if (tourStep > 0) { tourStep--; renderTourStep(); }
}
var _tourEls = null;
function _getTourEls() {
  if (!_tourEls) _tourEls = { icon: document.getElementById('tourIcon'), stepLabel: document.getElementById('tourStepLabel'), title: document.getElementById('tourTitle'), desc: document.getElementById('tourDesc'), nextBtn: document.getElementById('tourNextBtn'), dots: document.getElementById('tourDots') };
  return _tourEls;
}
function renderTourStep() {
  var s = TOUR_STEPS[tourStep];
  var el = _getTourEls();
  el.icon.textContent = s.icon;
  el.stepLabel.textContent = 'Step ' + (tourStep + 1) + ' of ' + TOUR_STEPS.length;
  el.title.textContent = s.title;
  el.desc.textContent = s.desc;
  el.nextBtn.textContent = tourStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next';
  var dotParts = [];
  for (var i = 0; i < TOUR_STEPS.length; i++) {
    dotParts.push('<div class="tour-dot' + (i === tourStep ? ' active' : '') + '"></div>');
  }
  el.dots.innerHTML = dotParts.join('');
}

// ── TABS ──
function switchTab(group, tab, el) {
  document.querySelectorAll(`[id^="${group}-"]`).forEach(t => t.classList.remove('active'));
  el.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`${group}-${tab}`).classList.add('active');
  el.classList.add('active');
}

// ── GLOBAL SEARCH ──
var _searchStaticIndex = null;
var _searchHighlight = -1;

function _buildSearchIndex() {
  // Static items are cached; dynamic items rebuild each time from live data
  if (!_searchStaticIndex) {
    _searchStaticIndex = [];

  // Sections (sidebar navigation)
  var sections = [
    { label: 'Command Center', desc: 'KPIs, alerts, signals, charts', section: 'overview', cat: 'Pages' },
    { label: 'Market Explorer', desc: 'Interactive map, labor, real estate, freight data', section: 'marketmap', cat: 'Pages' },
    { label: 'Deal Management', desc: 'Pipeline, DOS stages, deck generation', section: 'deals', cat: 'Pages' },
    { label: 'Design Tools', desc: 'Warehouse sizing, COG, network optimization, fleet, cost model, MOST, deal manager', section: 'designtools', cat: 'Pages' },
    { label: 'Training Wiki', desc: 'SCCs, automation, robotics, warehouse design, commercial structure', section: 'training', cat: 'Pages' },
    { label: 'Change Management', desc: 'Roadmap, release notes, implementation plan', section: 'changemanagement', cat: 'Pages' },
    { label: 'Hub Guide', desc: 'Welcome tour, feature overview, getting started', section: 'welcome', cat: 'Pages' },
    { label: 'Ideas & Feedback', desc: 'Submit ideas, vote, track enhancements', section: 'feedback', cat: 'Pages' },
    { label: 'Security', desc: 'Access control, data protection, compliance', section: 'security', cat: 'Pages' }
  ];
  sections.forEach(function(s) { _searchStaticIndex.push(s); });

  // Design Tools
  var tools = [
    { label: 'Cost Model Builder', desc: 'Labor, equipment, real estate, overhead, pricing, P&L projections', section: 'costmodel', cat: 'Design Tools' },
    { label: 'Deal Manager', desc: 'Multi-site cost model grouping, financials, pricing', section: 'designtools', action: function(){ navigate('designtools', document.querySelector('[data-section=designtools]')); setTimeout(function(){ showDesignTool('dt-deals', document.querySelectorAll('#dt-tabs .dt-tab')[2]); },100); }, cat: 'Design Tools' },
    { label: 'Warehouse Sizing Calculator', desc: 'Calculate facility size, pallet positions, dock doors', section: 'designtools', action: function(){ navigate('designtools', document.querySelector('[data-section=designtools]')); setTimeout(function(){ showDesignTool('dt-warehouse', document.querySelectorAll('#dt-tabs .dt-tab')[3]); },100); }, cat: 'Design Tools' },
    { label: 'MOST Labor Standards', desc: 'Time studies, template library, quick analysis, FTE calculation', section: 'designtools', action: function(){ navigate('designtools', document.querySelector('[data-section=designtools]')); setTimeout(function(){ showDesignTool('dt-most', document.querySelectorAll('#dt-tabs .dt-tab')[4]); },100); }, cat: 'Design Tools' },
    { label: 'Center of Gravity', desc: 'Optimal facility location analysis', section: 'designtools', action: function(){ navigate('designtools', document.querySelector('[data-section=designtools]')); setTimeout(function(){ showDesignTool('dt-network', document.querySelectorAll('#dt-tabs .dt-tab')[5]); },100); }, cat: 'Design Tools' },
    { label: 'Network Optimization', desc: 'Multi-mode transport, heatmap, service zones, demand', section: 'designtools', action: function(){ navigate('designtools', document.querySelector('[data-section=designtools]')); setTimeout(function(){ showDesignTool('dt-netopt', document.querySelectorAll('#dt-tabs .dt-tab')[6]); },100); }, cat: 'Design Tools' },
    { label: 'Fleet Modeler', desc: 'Fleet sizing, cost comparison, route mapping', section: 'designtools', action: function(){ navigate('designtools', document.querySelector('[data-section=designtools]')); setTimeout(function(){ showDesignTool('dt-fleet', document.querySelectorAll('#dt-tabs .dt-tab')[7]); },100); }, cat: 'Design Tools' }
  ];
  tools.forEach(function(t) { _searchStaticIndex.push(t); });

  // Wiki pages
  var wikiPages = [
    { label: 'G2P Order Fulfillment', desc: 'Goods-to-person systems, automation', wiki: 'scc-g2p', cat: 'Wiki' },
    { label: 'G2P Vendors', desc: 'Hai Robotics, AutoStore, Exotec comparison', wiki: 'robotics-g2p', cat: 'Wiki' },
    { label: 'P2G Order Fulfillment', desc: 'Person-to-goods picking systems', wiki: 'scc-p2g', cat: 'Wiki' },
    { label: 'Cobots', desc: 'Collaborative robots for warehousing', wiki: 'robotics-cobots', cat: 'Wiki' },
    { label: 'Light/Voice/Vision', desc: 'Pick-to-light, voice picking, vision systems', wiki: 'scc-lvv', cat: 'Wiki' },
    { label: 'Pallet AS/RS & Shuttles', desc: 'Automated storage and retrieval for pallets', wiki: 'scc-pallet-asrs', cat: 'Wiki' },
    { label: 'AMR/AGV Movement & Sort', desc: 'Autonomous mobile robots, automated guided vehicles', wiki: 'scc-amr-agv', cat: 'Wiki' },
    { label: 'Conveyor & Sortation', desc: 'Conveyor systems overview', wiki: 'conveyors-overview', cat: 'Wiki' },
    { label: 'Conveyor Types', desc: 'Belt, roller, crossbelt, tilt-tray', wiki: 'conveyors-types', cat: 'Wiki' },
    { label: 'Sortation Systems', desc: 'Crossbelt, sliding shoe, bomb bay sorters', wiki: 'conveyors-sortation', cat: 'Wiki' },
    { label: 'Conveyor Design Fundamentals', desc: 'Layout, throughput, speed calculations', wiki: 'conveyors-design', cat: 'Wiki' },
    { label: 'Conveyor Maintenance', desc: 'Preventive maintenance, spare parts', wiki: 'conveyors-maintenance', cat: 'Wiki' },
    { label: 'Robotic Picking & Palletizing', desc: 'Robot arms, mixed-case palletizing', wiki: 'scc-pick-pal', cat: 'Wiki' },
    { label: 'Rack/Shelving/VLMs', desc: 'Racking systems, vertical lift modules', wiki: 'scc-rack-vlm', cat: 'Wiki' },
    { label: 'Trailer Loading & Unloading', desc: 'Dock operations, automated loading', wiki: 'scc-trailer', cat: 'Wiki' },
    { label: 'Scan, PANDA, Wearables', desc: 'Scanning technology, wearable devices', wiki: 'scc-scan-panda', cat: 'Wiki' },
    { label: 'Packout Technology', desc: 'Auto-boxing, right-size packaging', wiki: 'scc-packout', cat: 'Wiki' },
    { label: 'Yard & Inventory Control', desc: 'Yard management, cycle counting, drones', wiki: 'scc-yard', cat: 'Wiki' },
    { label: 'Blue Yonder WMS', desc: 'Warehouse management system overview', wiki: 'blueyonder-wms', cat: 'Wiki' },
    { label: 'Warehouse Design & Sizing', desc: 'Facility planning, layout optimization', wiki: 'wh-design', cat: 'Wiki' },
    { label: 'MOST Work Measurement', desc: 'Maynard operation sequence technique', wiki: 'most-overview', cat: 'Wiki' },
    { label: '3PL Commercial Structure', desc: 'Pricing models, cost components, rate building', wiki: 'commercial-structure', cat: 'Wiki' },
    { label: 'Win Strategy Development', desc: 'Proposal strategy, competitive positioning', wiki: 'win-strategy', cat: 'Wiki' }
  ];
    wikiPages.forEach(function(w) { _searchStaticIndex.push(w); });
  }

  // Start with static items
  var index = _searchStaticIndex.slice();

  // Dynamic: Deals / Opportunities (from pmData)
  if (typeof pmData !== 'undefined' && pmData.opportunities) {
    pmData.opportunities.forEach(function(opp) {
      var custName = (typeof pmGetCustomerName === 'function') ? pmGetCustomerName(opp.customer_id) : '';
      var stageName = (opp.stage || '').replace(/_/g, ' ');
      index.push({
        label: opp.name || 'Untitled Deal',
        desc: [custName, opp.location, stageName, opp.status].filter(Boolean).join(' \u00b7 '),
        section: 'deals',
        action: (function(id) { return function() {
          navigate('deals', document.querySelector('[data-section=deals]'));
          setTimeout(function() { if (typeof pmOpenDetail === 'function') pmOpenDetail(id); }, 200);
        }; })(opp.id),
        cat: 'Deals'
      });
    });
  }

  // Dynamic: Customers (from pmData)
  if (typeof pmData !== 'undefined' && pmData.customers) {
    pmData.customers.forEach(function(cust) {
      var dealCount = (pmData.opportunities || []).filter(function(o) { return String(o.customer_id) === String(cust.id); }).length;
      index.push({
        label: cust.name || 'Unnamed Customer',
        desc: (cust.industry || 'Customer') + (dealCount ? ' \u00b7 ' + dealCount + ' deal' + (dealCount > 1 ? 's' : '') : ''),
        section: 'deals',
        cat: 'Customers'
      });
    });
  }

  // Dynamic: Cost Models (from daData)
  if (typeof daData !== 'undefined' && daData.costModels) {
    daData.costModels.forEach(function(cm) {
      index.push({
        label: cm.name || 'Untitled Cost Model',
        desc: 'Cost Model' + (cm.created_at ? ' \u00b7 ' + new Date(cm.created_at).toLocaleDateString() : ''),
        section: 'costmodel',
        action: (function(id) { return function() {
          navigate('costmodel', document.querySelector('[data-section=costmodel]'));
          setTimeout(function() {
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('editorContainer').style.display = 'flex';
            document.getElementById('topbarControls').style.display = 'flex';
            if (typeof cmApp !== 'undefined') cmApp.openProject(id);
          }, 100);
        }; })(cm.id),
        cat: 'Cost Models'
      });
    });
  }

  // Dynamic: NetOpt Scenarios (from daData)
  if (typeof daData !== 'undefined' && daData.netoptScenarios) {
    daData.netoptScenarios.forEach(function(ns) {
      index.push({
        label: ns.scenario_name || ns.name || 'Untitled Scenario',
        desc: 'Network Optimization' + (ns.created_at ? ' \u00b7 ' + new Date(ns.created_at).toLocaleDateString() : ''),
        section: 'designtools',
        action: (function(id) { return function() {
          navigate('designtools', document.querySelector('[data-section=designtools]'));
          setTimeout(function() { showDesignTool('dt-netopt', document.querySelectorAll('#dt-tabs .dt-tab')[6]); }, 100);
          setTimeout(function() { if (typeof netoptLoadScenario === 'function') netoptLoadScenario(id); }, 300);
        }; })(ns.id),
        cat: 'Scenarios'
      });
    });
  }

  // Dynamic: Signal feed items (competitor news, tariffs, etc.)
  document.querySelectorAll('#signalFeed .signal-item').forEach(function(el) {
    var title = (el.querySelector('.signal-title') || el.querySelector('strong') || {}).textContent || '';
    var type = el.dataset.signalType || 'signal';
    if (title) {
      index.push({
        label: title,
        desc: type.charAt(0).toUpperCase() + type.slice(1) + ' signal \u00b7 Command Center',
        section: 'overview',
        cat: 'Intelligence'
      });
    }
  });

  // Dynamic: Intelligence feed items
  document.querySelectorAll('.feed-card, .feed-item').forEach(function(el) {
    var title = (el.querySelector('.feed-title') || el.querySelector('.feed-card-title') || {}).textContent || '';
    var source = (el.querySelector('.feed-source') || el.querySelector('.feed-card-source') || {}).textContent || '';
    if (title && title.length > 5) {
      index.push({
        label: title.substring(0, 80) + (title.length > 80 ? '\u2026' : ''),
        desc: (source || 'News') + ' \u00b7 Command Center',
        section: 'overview',
        cat: 'Intelligence'
      });
    }
  });

  return index;
}

function handleSearch(query) {
  var container = document.getElementById('searchResults');
  if (!container) return;
  if (!query || query.length < 2) { container.style.display = 'none'; _searchHighlight = -1; return; }

  var index = _buildSearchIndex();
  var q = query.toLowerCase();
  var matches = index.filter(function(item) {
    return item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
  });

  if (matches.length === 0) {
    container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--ies-gray-500);font-size:13px;">No results for "' + query.replace(/</g,'&lt;') + '"</div>';
    container.style.display = 'block';
    _searchHighlight = -1;
    return;
  }

  // Group by category
  var groups = {};
  matches.forEach(function(m) {
    if (!groups[m.cat]) groups[m.cat] = [];
    groups[m.cat].push(m);
  });

  var html = '';
  var idx = 0;
  var maxPerCat = 5;
  // Flatten for keyboard nav after limiting
  var flatMatches = [];
  Object.keys(groups).forEach(function(cat) {
    var items = groups[cat].slice(0, maxPerCat);
    var overflow = groups[cat].length - items.length;
    html += '<div style="padding:6px 14px 3px;font-size:10px;font-weight:700;color:var(--ies-gray-500);text-transform:uppercase;letter-spacing:.5px;">' + cat + ' <span style="font-weight:400;">(' + groups[cat].length + ')</span></div>';
    items.forEach(function(item) {
      flatMatches.push(item);
      var labelHtml = item.label.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi'), '<mark style="background:rgba(243,112,33,.2);color:inherit;padding:0 1px;border-radius:2px;">$1</mark>');
      html += '<div class="search-result-item" data-idx="' + idx + '" onmousedown="searchSelect(' + idx + ')" onmouseenter="_searchHighlight=' + idx + ';_searchHighlightUI()" style="padding:8px 14px;cursor:pointer;display:flex;flex-direction:column;gap:1px;transition:background .15s;">';
      html += '<div style="font-size:13px;font-weight:600;color:var(--ies-navy);">' + labelHtml + '</div>';
      html += '<div style="font-size:11px;color:var(--ies-gray-500);line-height:1.3;">' + item.desc + '</div>';
      html += '</div>';
      idx++;
    });
    if (overflow > 0) {
      html += '<div style="padding:4px 14px 6px;font-size:11px;color:var(--ies-gray-400);font-style:italic;">+' + overflow + ' more</div>';
    }
  });

  container.innerHTML = html;
  container.style.display = 'block';
  _searchHighlight = -1;

  // Use capped flat list for keyboard nav
  container._flatMatches = flatMatches;
}

function searchSelect(idx) {
  var container = document.getElementById('searchResults');
  if (!container || !container._flatMatches) return;
  var item = container._flatMatches[idx];
  if (!item) return;

  container.style.display = 'none';
  var _gs = document.getElementById('globalSearch'); if (_gs) _gs.value = '';
  _searchHighlight = -1;

  if (item.action) {
    item.action();
  } else if (item.wiki) {
    navigate('training', document.querySelector('[data-section=training]'));
    setTimeout(function() { showWiki(item.wiki); }, 100);
  } else if (item.section) {
    navigate(item.section, document.querySelector('[data-section=' + item.section + ']'));
  }
}

function searchKeyNav(e) {
  var container = document.getElementById('searchResults');
  if (!container || container.style.display === 'none' || !container._flatMatches) return;
  var count = container._flatMatches.length;
  if (count === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _searchHighlight = (_searchHighlight + 1) % count;
    _searchHighlightUI();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _searchHighlight = _searchHighlight <= 0 ? count - 1 : _searchHighlight - 1;
    _searchHighlightUI();
  } else if (e.key === 'Enter' && _searchHighlight >= 0) {
    e.preventDefault();
    searchSelect(_searchHighlight);
  } else if (e.key === 'Escape') {
    container.style.display = 'none';
    _searchHighlight = -1;
  }
}

function _searchHighlightUI() {
  var items = document.querySelectorAll('.search-result-item');
  items.forEach(function(el, i) {
    el.style.background = parseInt(el.dataset.idx) === _searchHighlight ? 'rgba(33,150,243,.08)' : '';
  });
  // Scroll highlighted item into view
  if (_searchHighlight >= 0 && items[_searchHighlight]) {
    items[_searchHighlight].scrollIntoView({ block: 'nearest' });
  }
}

// ── SIGNAL FEED FILTERS (Command Center) ──
function filterSignals(type, el) {
  el.parentElement.querySelectorAll('.signal-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('#signalFeed .signal-item').forEach(item => {
    if (type === 'all') { item.style.display = ''; }
    else { item.style.display = item.dataset.signalType === type ? '' : 'none'; }
  });
}

// ── SECTOR PULSE TOGGLE (Command Center) ──
function toggleSectorCard(card) {
  var body = card.querySelector('.sector-pulse-card-body');
  var expand = card.querySelector('.sector-pulse-expand');
  if (body.classList.contains('collapsed')) {
    body.classList.remove('collapsed');
    if (expand) expand.textContent = 'Show less \u2191';
  } else {
    body.classList.add('collapsed');
    if (expand) expand.textContent = 'Read more \u2193';
  }
}

// ── DATA LIBRARY TOGGLE (Market Explorer) ──
function toggleDataLibrary(el) {
  el.classList.toggle('open');
  var content = document.getElementById('dataLibraryContent');
  content.classList.toggle('open');
}

function switchDataLibTab(tab, el) {
  el.parentElement.querySelectorAll('.data-library-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.data-lib-panel').forEach(p => p.style.display = 'none');
  var panel = document.getElementById('dataLib-' + tab);
  if (panel) panel.style.display = 'block';
}

// ── MARKET DETAIL TABS (Market Explorer) ──
function switchMarketTab(tab, el) {
  el.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  window.activeMarketTab = tab;
  document.querySelectorAll('.market-tab-panel').forEach(function(p) {
    p.style.display = p.dataset.tab === tab ? '' : 'none';
  });
}

// ── DEAL CONTEXT BAR (breadcrumb support) ──
var _dealNavContext = null;
function setDealContext(dealId, dealName, section) {
  _dealNavContext = { dealId: dealId, dealName: dealName };
  var ctx = document.getElementById(section === 'costmodel' ? 'cmDealContext' : 'fmDealContext');
  var name = document.getElementById(section === 'costmodel' ? 'cmDealContextName' : 'fmDealContextName');
  if (ctx && name) {
    name.textContent = dealName;
    ctx.style.display = 'flex';
  }
}
function clearDealContext() {
  _dealNavContext = null;
  ['cmDealContext', 'fmDealContext'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
function navigateBackToDeal() {
  if (_dealNavContext) {
    navigate('deals', document.querySelector('[data-section=deals]'));
    setTimeout(function() { pmOpenDetail(_dealNavContext.dealId); }, 200);
    clearDealContext();
  }
}

// ── SOURCES MODAL ──
function showSources() {
  document.getElementById('sourcesModal').style.display = 'flex';
}
function closeSources() {
  document.getElementById('sourcesModal').style.display = 'none';
}

// ── TIMESTAMP ──
function updateTimestamp() {
  const now = new Date();
  document.getElementById('headerTimestamp').textContent = 'Last updated: ' + now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── REFRESH — now pulls live from Supabase ──
async function refreshData() {
  const btn = document.querySelector('.header-refresh');
  btn.textContent = '\u27F3 Refreshing\u2026';
  btn.disabled = true;
  try {
    await loadAllData();
    updateTimestamp();
  } catch(e) { console.error('Refresh failed:', e); }
  btn.textContent = '\u27F3 Refresh';
  btn.disabled = false;
}

// ═══════════════════════════════════════════════════
// TEXT UTILITIES & FEED HELPERS
// ═══════════════════════════════════════════════════

// Sanitize text from RSS feeds to prevent broken HTML rendering
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escAttr(str) {
  /* Escape for use inside HTML attribute values (including single-quoted onclick handlers) */
  return esc(str);
}
// Strip HTML tags + encoded entities from RSS content
function stripHtml(str) {
  if (!str) return '';
  // First decode HTML entities, then strip tags, then remove bare URLs
  return str
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
var LINK_SVG = '<svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

// ── Sidebar scroll-leak guard ──
