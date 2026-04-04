// ═══════════════════════════════════════════════════════════════
// command-center.js
// Command Center module — Sector Pulse loaders, signal feed,
// chart initialization, KPI strip, alerts, and refresh logic.
// Extracted from index.html (IES Hub V2)
// ═══════════════════════════════════════════════════════════════

// Chart instances (global so they can be destroyed/recreated)
var dieselChartInstance, laborChartInstance, pipelineChartInstance, freightChartInstance;

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

// ── SECTOR PULSE LOADERS (live data modules) ──
async function loadSPCompetitors() {
  try {
    var { data: competitors } = await sb.from('master_competitors').select('name, intelligence_score, primary_vertical, status').eq('status', 'active').order('intelligence_score', { ascending: false, nullsFirst: false });
    var c = document.getElementById('spCompetitors');
    if (!c || !competitors || !competitors.length) return;
    // Also get latest news count per competitor
    var { data: newsCounts } = await sb.from('competitor_news').select('competitor');
    var countMap = {};
    if (newsCounts) newsCounts.forEach(function(n) { countMap[n.competitor] = (countMap[n.competitor] || 0) + 1; });

    c.innerHTML = competitors.map(function(comp) {
      var score = comp.intelligence_score || 0;
      var scoreColor = score >= 75 ? 'var(--ies-green)' : score >= 50 ? '#f59e0b' : 'var(--ies-red)';
      var newsCount = countMap[comp.name] || 0;
      var barWidth = Math.min(score, 100);
      return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--ies-gray-50);">' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:12px;font-weight:600;color:var(--ies-navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(comp.name) + '</div>' +
          '<div style="font-size:10px;color:var(--ies-gray-400);">' + newsCount + ' signals</div>' +
        '</div>' +
        '<div style="width:80px;">' +
          '<div style="height:6px;background:var(--ies-gray-100);border-radius:3px;overflow:hidden;">' +
            '<div style="height:100%;width:' + barWidth + '%;background:' + scoreColor + ';border-radius:3px;transition:width .3s;"></div>' +
          '</div>' +
        '</div>' +
        '<div style="width:32px;text-align:right;font-size:13px;font-weight:700;color:' + scoreColor + ';">' + (score || '\u2014') + '</div>' +
      '</div>';
    }).join('');
  } catch(e) { console.warn('loadSPCompetitors error:', e); }
}

async function loadSectorPulse() {
  if (!sb) return;
  await Promise.all([
    loadSPAutomation(),
    loadSPSupplyChain(),
    loadSPLabor(),
    loadSPTariffTrade()
  ]);
}

async function loadSPAutomation() {
  try {
    var [metricsRes, newsRes] = await Promise.all([
      sb.from('automation_metrics').select('*').order('as_of_date', { ascending: false }).limit(5),
      sb.from('automation_news').select('vendor, headline, published_date, source_url').order('published_date', { ascending: false }).limit(5)
    ]);
    // Render metrics
    var mc = document.getElementById('spAutoMetrics');
    if (mc && metricsRes.data && metricsRes.data.length) {
      mc.innerHTML = metricsRes.data.map(function(m) {
        var delta = m.period_change || '';
        var cls = delta.indexOf('+') === 0 ? 'up' : (delta.indexOf('-') === 0 ? 'down' : '');
        var mv = m.metric_value;
        var mvStr = (!isNaN(mv) && mv !== null && mv !== '') ? fmtNum(Number(mv)) : esc(String(mv));
        return '<div class="sp-metric"><div class="sp-metric-value">' + mvStr + '<span style="font-size:10px;font-weight:600;color:var(--ies-gray-400);margin-left:2px;">' + esc(m.metric_unit || '') + '</span></div><div class="sp-metric-label">' + esc(m.metric_name) + '</div>' + (delta ? '<div class="sp-metric-delta ' + cls + '">' + esc(delta) + '</div>' : '') + '</div>';
      }).join('');
    }
    // Render news
    var nc = document.getElementById('spAutoNews');
    if (nc && newsRes.data && newsRes.data.length) {
      nc.innerHTML = newsRes.data.map(function(n) {
        var d = n.published_date ? new Date(n.published_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        var vendor = n.vendor || '';
        var colors = { 'Locus': 'rgba(220,53,69,.1)', 'Symbotic': 'rgba(0,71,171,.1)', 'AutoStore': 'rgba(25,135,84,.1)', '6 River': 'rgba(255,193,7,.12)', 'Blue Yonder': 'rgba(0,71,171,.1)' };
        var bg = colors[vendor] || 'rgba(107,122,144,.1)';
        var titleHtml = n.source_url ? '<a href="' + esc(n.source_url) + '" target="_blank" rel="noopener" style="color:var(--ies-gray-600);text-decoration:none;">' + esc(stripHtml(n.headline)) + ' ' + LINK_SVG + '</a>' : esc(stripHtml(n.headline));
        return '<li class="sp-news-item"><span class="sp-news-vendor" style="background:' + bg + ';color:var(--ies-gray-600);">' + esc(vendor) + '</span><span style="flex:1;">' + titleHtml + '</span><span class="sp-news-date">' + d + '</span></li>';
      }).join('');
    }
  } catch(e) { console.warn('loadSPAutomation error:', e); }
}

async function loadSPVerticals() {
  try {
    var { data } = await sb.from('vertical_spotlights').select('*').order('as_of_date', { ascending: false });
    var c = document.getElementById('spVerticals');
    if (!c || !data || !data.length) return;
    c.innerHTML = data.map(function(v) {
      var name = getVerticalLabel(v.vertical);
      var color = getVerticalColor(v.vertical);
      var pipeline = v.pipeline_value ? '$' + (v.pipeline_value / 1e6).toFixed(0) + 'M' : '\u2014';
      return '<div class="sp-vertical-row">' +
        '<div class="sp-vertical-name" style="color:' + color + ';">' + esc(name) + '</div>' +
        '<div class="sp-vertical-stat"><strong>' + pipeline + '</strong> pipeline</div>' +
        '<div class="sp-vertical-stat"><strong>' + (v.active_opportunities || 0) + '</strong> opps</div>' +
        '<div class="sp-vertical-stat"><strong>' + (v.close_rate || 0) + '%</strong> close</div>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--ies-gray-500);padding:0 0 8px;border-bottom:1px solid var(--ies-gray-50);">' + esc(v.headline || '') + '</div>';
    }).join('');
  } catch(e) { console.warn('loadSPVerticals error:', e); }
}

async function loadSPSupplyChain() {
  try {
    var [portsRes, reshoringRes] = await Promise.all([
      sb.from('port_status').select('*').order('report_date', { ascending: false }),
      sb.from('reshoring_activity').select('*').order('published_date', { ascending: false }).limit(4)
    ]);
    // Port congestion table
    var pt = document.querySelector('#spPorts tbody');
    if (pt && portsRes.data && portsRes.data.length) {
      pt.innerHTML = portsRes.data.map(function(p) {
        var statusClass = 'sp-status-' + (p.status || 'normal').toLowerCase();
        var delta = parseFloat(p.delta_vs_normal);
        var deltaStr = delta > 0 ? '+' + delta.toFixed(1) + 'd' : delta.toFixed(1) + 'd';
        var deltaColor = delta > 1 ? 'var(--ies-red)' : (delta > 0.5 ? '#b58a00' : 'var(--ies-green)');
        return '<tr><td style="font-weight:600;">' + esc(p.port_name) + '</td><td>' + p.avg_dwell_days + 'd</td><td style="color:' + deltaColor + ';font-weight:600;">' + deltaStr + '</td><td><span class="sp-status ' + statusClass + '">' + esc(p.status) + '</span></td></tr>';
      }).join('');
    }
    // Reshoring headlines
    var rc = document.getElementById('spReshoring');
    if (rc && reshoringRes.data && reshoringRes.data.length) {
      rc.innerHTML = reshoringRes.data.map(function(r) {
        var d = r.published_date ? new Date(r.published_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        var tags = (r.tags || []).map(function(t) { return '<span style="font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;background:rgba(25,135,84,.08);color:var(--ies-green);margin-left:4px;">' + esc(t) + '</span>'; }).join('');
        return '<li class="sp-news-item"><span style="flex:1;font-weight:600;">' + esc(r.headline) + tags + '</span><span class="sp-news-date">' + esc(r.investment_amount || '') + ' \u00b7 ' + d + '</span></li>';
      }).join('');
    }
  } catch(e) { console.warn('loadSPSupplyChain error:', e); }
}

async function loadSPLabor() {
  try {
    var { data } = await sb.from('union_activity').select('*').order('event_date', { ascending: false }).limit(6);
    var tb = document.querySelector('#spLabor tbody');
    if (!tb || !data || !data.length) return;
    tb.innerHTML = data.map(function(u) {
      var impactClass = 'sp-status-' + (u.impact || 'low').toLowerCase();
      var statusMap = { 'Strike vote': 'sp-status-elevated', 'Negotiating': 'sp-status-moderate', 'Filed': 'sp-status-moderate', 'Organizing': 'sp-status-moderate', 'Ratified': 'sp-status-normal' };
      var statusClass = statusMap[u.status] || 'sp-status-normal';
      return '<tr><td style="font-weight:600;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + esc(u.event_description) + '">' + esc(u.event_description) + '</td><td>' + esc(u.company || '') + '</td><td>' + esc(u.location || '') + '</td><td><span class="sp-status ' + impactClass + '">' + esc(u.impact) + '</span></td><td><span class="sp-status ' + statusClass + '">' + esc(u.status) + '</span></td></tr>';
    }).join('');
  } catch(e) { console.warn('loadSPLabor error:', e); }
}

async function loadSPTariffTrade() {
  try {
    var { data } = await sb.from('tariff_developments').select('*').order('published_date', { ascending: false }).limit(5);
    var el = document.getElementById('spTariffTrade');
    if (!el || !data || !data.length) return;
    el.innerHTML = data.map(function(t) {
      var d = t.published_date ? new Date(t.published_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      var effDate = t.effective_date ? new Date(t.effective_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      var statusColors = { 'Proposed': 'rgba(255,193,7,.12)', 'Enacted': 'rgba(220,53,69,.1)', 'Effective': 'rgba(220,53,69,.15)', 'Under Review': 'rgba(59,130,246,.1)' };
      var statusTextColors = { 'Proposed': '#b58a00', 'Enacted': 'var(--ies-red)', 'Effective': 'var(--ies-red)', 'Under Review': 'var(--ies-blue)' };
      var stBg = statusColors[t.status] || 'rgba(107,122,144,.1)';
      var stTx = statusTextColors[t.status] || 'var(--ies-gray-600)';
      var titleHtml = t.source_url ? '<a href="' + esc(t.source_url) + '" target="_blank" rel="noopener" style="color:var(--ies-gray-600);text-decoration:none;">' + esc(stripHtml(t.title)) + ' ' + LINK_SVG + '</a>' : esc(stripHtml(t.title));
      return '<li class="sp-news-item"><span class="sp-news-vendor" style="background:' + stBg + ';color:' + stTx + ';">' + esc(t.status || '') + '</span><span style="flex:1;">' + titleHtml + '</span><span class="sp-news-date">' + (effDate ? 'Eff ' + effDate : d) + '</span></li>';
    }).join('');
  } catch(e) { console.warn('loadSPTariffTrade error:', e); }
}

// ── UNIFIED SIGNAL FEED LOADER (Command Center) ──
async function loadSignalFeed() {
  var feed = document.getElementById('signalFeed');
  if (!feed || !sb) return;
  try {
    // Load from multiple tables in parallel
    var [compRes, tariffRes, accountRes, rfpRes] = await Promise.all([
      sb.from('competitor_news').select('*').order('published_date', { ascending: false }).limit(8),
      sb.from('tariff_developments').select('*').order('published_date', { ascending: false }).limit(5),
      sb.from('account_signals').select('*').order('signal_date', { ascending: false }).limit(5),
      sb.from('rfp_signals').select('*').order('created_at', { ascending: false }).limit(5)
    ]);
    var items = [];
    if (compRes.data) compRes.data.forEach(function(r) {
      items.push({ type: 'competitor', title: r.headline || r.title, excerpt: r.summary, date: r.published_date, source: r.source, url: r.source_url });
    });
    if (tariffRes.data) tariffRes.data.forEach(function(r) {
      items.push({ type: 'tariff', title: r.title, excerpt: r.summary, date: r.published_date || r.effective_date, source: 'Trade Policy', url: r.source_url });
    });
    if (accountRes.data) accountRes.data.forEach(function(r) {
      items.push({ type: 'account', title: r.account_name + ': ' + (r.signal_type || 'Signal'), excerpt: r.detail, date: r.signal_date, source: r.source || 'Account Intel', url: r.source_url });
    });
    if (rfpRes.data) rfpRes.data.forEach(function(r) {
      items.push({ type: 'rfp', title: r.company + ': ' + (r.signal_type || 'RFP Signal'), excerpt: r.detail, date: r.created_at, source: r.vertical || 'RFP Intel' });
    });
    // Sort by date descending
    items.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
    if (items.length === 0) {
      feed.innerHTML = '<div class="signal-item" style="text-align:center;color:var(--ies-gray-400);padding:24px;">No signals found. Data will populate from Supabase feeds.</div>';
      return;
    }
    feed.innerHTML = items.map(function(item) {
      var dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      var linkSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="display:inline-block;vertical-align:-1px;opacity:.4;margin-left:4px;"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var safeUrl = item.url && /^https?:\/\//i.test(item.url) ? esc(item.url) : '';
      var titleHtml = safeUrl ? '<a href="' + safeUrl + '" target="_blank" rel="noopener">' + esc(item.title || 'Signal') + linkSvg + '</a>' : esc(item.title || 'Signal');
      // Skip excerpt if it's a near-duplicate of the title (Google News auto-snippets)
      var showExcerpt = false;
      if (item.excerpt) {
        var norm = function(s) { return s.replace(/&nbsp;/g, ' ').replace(/[-\u2013\u2014|]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase(); };
        var cleanExcerpt = norm(item.excerpt);
        var cleanTitle = norm(item.title || '');
        // Show excerpt only if it adds meaningful content beyond the title
        var titleCore = cleanTitle.replace(/\s+\w[\w\s]*$/, ''); // strip trailing source name
        showExcerpt = cleanExcerpt.length > 0 && !titleCore.startsWith(cleanExcerpt.substring(0, 25)) && !cleanExcerpt.startsWith(cleanTitle.substring(0, 25));
      }
      return '<div class="signal-item" data-signal-type="' + esc(item.type) + '">' +
        '<div class="signal-header"><span class="signal-type signal-type-' + esc(item.type) + '">' + esc(item.type) + '</span><span class="signal-date">' + esc(dateStr) + '</span></div>' +
        '<div class="signal-title">' + titleHtml + '</div>' +
        (showExcerpt ? '<div class="signal-excerpt">' + esc(stripHtml(item.excerpt)) + '</div>' : '') +
        '</div>';
    }).join('');
  } catch(e) {
    feed.innerHTML = '<div class="signal-item" style="color:var(--ies-gray-400);padding:16px;">Signal feed loading\u2026 Connect Supabase tables for live data.</div>';
  }
}

// ── SOURCES MODAL ──
function showSources() {
  document.getElementById('sourcesModal').style.display = 'flex';
}
function closeSources() {
  document.getElementById('sourcesModal').style.display = 'none';
}

// ═══════════════════════════════════════════════════
// TIMESTAMP & REFRESH
// ═══════════════════════════════════════════════════

function updateTimestamp() {
  const now = new Date();
  document.getElementById('headerTimestamp').textContent = 'Last updated: ' + now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

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
// DATA LOADING — pulls from Supabase tables
// ═══════════════════════════════════════════════════
async function loadAllData() {
  await Promise.all([
    loadVerticalMeta(),
    loadDieselChart(),
    loadLaborChart(),
    loadFreightChart(),
    loadKPIStrip(),
    loadAlerts(),
    loadSignalFeed(),
    loadSectorPulse(),
  ]);
}

// ── Diesel Chart (live from fuel_prices) ──
async function loadDieselChart() {
  const { data } = await sb.from('fuel_prices')
    .select('report_date, price_per_gallon')
    .eq('fuel_type', 'diesel')
    .order('report_date', { ascending: true });
  if (!data || !data.length) return;

  const labels = data.map(r => {
    const d = new Date(r.report_date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const prices = data.map(r => parseFloat(r.price_per_gallon));

  const ctx = document.getElementById('dieselChart');
  if (dieselChartInstance) dieselChartInstance.destroy();
  dieselChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Diesel ($/gal)', data: prices,
        borderColor: '#e07a2f', backgroundColor: 'rgba(224,122,47,.08)',
        fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false, ticks: { callback: v => '$' + v.toFixed(2) } } } }
  });
}

// ── Labor Availability Chart (live from labor_markets) ──
async function loadLaborChart() {
  const { data } = await sb.from('labor_markets')
    .select('msa, availability_score')
    .order('availability_score', { ascending: true });
  if (!data || !data.length) return;

  const labels = data.map(r => r.msa.replace(', CA','').replace(', OH','').replace(', TX',''));
  const scores = data.map(r => r.availability_score);
  const colors = scores.map(s => s < 45 ? '#e74c3c' : s < 65 ? '#f39c12' : '#2ecc71');

  const ctx = document.getElementById('laborHeatChart');
  if (laborChartInstance) laborChartInstance.destroy();
  laborChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Labor Availability Score', data: scores, backgroundColor: colors, borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { max: 100 } } }
  });
}

// ── Pipeline by Vertical (live from proposal_benchmarks) ──
async function loadPipelineChart() {
  const { data } = await sb.from('proposal_benchmarks')
    .select('vertical, avg_deal_size, sample_size')
    .eq('period', 'TTM')
    .order('avg_deal_size', { ascending: false });
  if (!data || !data.length) return;

  const labels = data.map(r => getVerticalLabel(r.vertical));
  const values = data.map(r => parseFloat(r.avg_deal_size) / 1000000);
  const colors = data.map(r => getVerticalColor(r.vertical));

  const ctx = document.getElementById('pipelineChart');
  if (pipelineChartInstance) pipelineChartInstance.destroy();
  pipelineChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }
  });
}

// ── Freight Rate Chart (live from freight_rates) ──
async function loadFreightChart() {
  const { data: spotData } = await sb.from('freight_rates')
    .select('report_date, rate')
    .eq('index_name', 'DAT Spot Van')
    .order('report_date', { ascending: true });

  const { data: contractData } = await sb.from('freight_rates')
    .select('report_date, rate')
    .eq('index_name', 'DAT Contract Van')
    .order('report_date', { ascending: true });

  if (!spotData?.length) return;

  const labels = spotData.map(r => {
    const d = new Date(r.report_date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const ctx = document.getElementById('freightChart');
  if (freightChartInstance) freightChartInstance.destroy();
  freightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'DAT Spot Van', data: spotData.map(r => parseFloat(r.rate)), borderColor: '#00b4d8', tension: 0.3, pointRadius: 3, borderWidth: 2 },
        { label: 'Contract Van', data: (contractData || []).map(r => parseFloat(r.rate)), borderColor: '#6b7a90', tension: 0.3, pointRadius: 3, borderWidth: 2, borderDash: [5,5] }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } }, scales: { y: { beginAtZero: false, ticks: { callback: v => '$' + v.toFixed(2) } } } }
  });
}

// ── KPI Strip (live from multiple tables) ──
async function loadKPIStrip() {
  // Latest diesel
  const { data: diesel } = await sb.from('fuel_prices')
    .select('price_per_gallon, week_over_week_change, percentile_52wk')
    .eq('fuel_type', 'diesel')
    .order('report_date', { ascending: false }).limit(1).single();

  if (diesel) {
    const kpis = document.querySelectorAll('.kpi-card');
    if (kpis[0]) {
      kpis[0].querySelector('.kpi-value').textContent = fmtNum(parseFloat(diesel.price_per_gallon), 2, '$');
      const wow = diesel.week_over_week_change;
      const pct = ((wow / (parseFloat(diesel.price_per_gallon) - wow)) * 100).toFixed(1);
      var dieselSub = kpis[0].querySelector('.kpi-sub');
      dieselSub.textContent = (wow >= 0 ? '\u25B2 +' : '\u25BC ') + Math.abs(pct) + '% WoW';
      dieselSub.className = 'kpi-sub ' + (wow >= 0 ? 'change-up' : 'change-down');
    }
  }

  // Pipeline summary
  const { data: pipeline } = await sb.from('pipeline_summary')
    .select('metric_name, metric_value, period_change')
    .order('as_of_date', { ascending: false });

  if (pipeline) {
    const kpis = document.querySelectorAll('.kpi-card');
    const pipelineMetric = pipeline.find(m => m.metric_name === 'Active Pipeline');
    if (pipelineMetric && kpis[5]) {
      const val = parseFloat(pipelineMetric.metric_value) / 1000000;
      kpis[5].querySelector('.kpi-value').textContent = '$' + Math.round(val) + 'M';
      kpis[5].querySelector('.kpi-sub').textContent = '\u25B2 ' + (pipelineMetric.period_change || '');
    }
  }
}

// ── Alert Bar (live from hub_alerts) ──
async function loadAlerts() {
  const bar = document.querySelector('.alert-bar .alert-text');
  if (!bar) return;
  try {
    const { data: alerts, error } = await sb.from('hub_alerts')
      .select('title, severity, created_at, expires_at')
      .eq('is_active', true)
      .order('severity', { ascending: true })
      .limit(5);

    if (error) throw error;
    // Client-side filter: skip expired alerts
    const now = new Date();
    const live = (alerts || []).filter(a => !a.expires_at || new Date(a.expires_at) > now);
    if (live.length) {
      bar.innerHTML = '<strong>' + live.length + ' active alert' + (live.length > 1 ? 's' : '') + ':</strong> ' +
        live.map(a => a.title).join(' \u00b7 ');
    } else {
      bar.innerHTML = '<strong>No active alerts</strong> \u2014 all systems nominal';
    }
  } catch(e) {
    console.warn('loadAlerts error:', e);
    bar.innerHTML = '<strong>Alerts unavailable</strong> \u2014 refresh to retry';
  }
}
