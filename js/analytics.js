// ============================================================================
// ANALYTICS — Tracking Engine + Dashboard
// Extracted from index.html — session tracking, page views, dashboard rendering
// ============================================================================

/* ═══════════════════════════════════════════════════════
   ANALYTICS — Tracking Engine + Dashboard
   ═══════════════════════════════════════════════════════ */

// ── Tracking Engine ──
var anSessionId = null;
var anCurrentSection = null;
var anSectionEnteredAt = null;

function anGenerateSessionId() {
  return 'ses_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

function anParseUA() {
  var ua = navigator.userAgent;
  var browser = 'Unknown';
  if (ua.indexOf('Edg/') > -1) browser = 'Edge';
  else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Safari') > -1) browser = 'Chrome';
  else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Safari') > -1) browser = 'Safari';
  else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) browser = 'IE';

  var os = 'Unknown';
  if (ua.indexOf('Windows') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

  var deviceType = 'desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet';

  return { browser: browser, os: os, deviceType: deviceType };
}

async function anStartSession() {
  anSessionId = anGenerateSessionId();
  var info = anParseUA();
  try {
    await sb.from('analytics_sessions').insert({
      session_id: anSessionId,
      user_agent: navigator.userAgent,
      browser: info.browser,
      os: info.os,
      device_type: info.deviceType,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      referrer: document.referrer || null,
      is_active: true
    });
  } catch(e) { /* analytics session error */ }
}

async function anTrackPageView(section) {
  if (!anSessionId) return;

  // Close previous page view
  if (anCurrentSection && anSectionEnteredAt) {
    var dur = Math.round((Date.now() - anSectionEnteredAt) / 1000);
    try {
      await sb.from('analytics_page_views')
        .update({ exited_at: new Date().toISOString(), duration_seconds: dur })
        .eq('session_id', anSessionId)
        .eq('section', anCurrentSection)
        .is('exited_at', null);
    } catch(e) { console.error('Error:', e); }
  }

  anCurrentSection = section;
  anSectionEnteredAt = Date.now();

  try {
    await sb.from('analytics_page_views').insert({
      session_id: anSessionId,
      section: section
    });
  } catch(e) { /* analytics pageview error */ }

  // Update session page count
  try {
    var { data } = await sb.from('analytics_page_views')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', anSessionId);
  } catch(e) { console.error('Error:', e); }
}

// Heartbeat — update session duration every 30s
setInterval(async function() {
  if (!anSessionId) return;
  var elapsed = Math.round((Date.now() - window.anSessionStart) / 1000);
  try {
    var { count } = await sb.from('analytics_page_views')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', anSessionId);
    await sb.from('analytics_sessions')
      .update({ duration_seconds: elapsed, ended_at: new Date().toISOString(), page_count: count || 0 })
      .eq('session_id', anSessionId);
  } catch(e) { console.error('Error:', e); }
}, 30000);

// End session on page unload
window.addEventListener('beforeunload', function() {
  if (!anSessionId) return;
  var elapsed = Math.round((Date.now() - window.anSessionStart) / 1000);
  var payload = JSON.stringify({
    duration_seconds: elapsed,
    ended_at: new Date().toISOString(),
    is_active: false
  });
  // Use sendBeacon for reliable delivery on tab close
  navigator.sendBeacon(
    'https://dklnwcshrpamzsybjlzb.supabase.co/rest/v1/analytics_sessions?session_id=eq.' + anSessionId,
    new Blob([payload], { type: 'application/json' })
  );
});

// Init tracking after auth
function anInitTracking() {
  window.anSessionStart = Date.now();
  anStartSession().then(function() {
    anTrackPageView('welcome');
  }).catch(function(e){ console.error('Failed to start analytics session:', e); });
}

// ── Dashboard Logic ──
var anRange = 'today';
var anSectionNames = {
  welcome: 'Hub Guide',
  overview: 'Command Center',
  marketmap: 'Market Explorer',
  deals: 'Deal Management',
  designtools: 'Design Tools',
  changemanagement: 'Change Management',
  training: 'Training Wiki',
  costmodel: 'Cost Model Builder',
  fleet: 'Fleet Modeler',
  netopt: 'Network Optimization',
  feedback: 'Ideas & Feedback',
  security: 'Security',
  analytics: 'Analytics'
};

function anSetRange(range) {
  anRange = range;
  document.querySelectorAll('.an-range-btn').forEach(function(b) { b.classList.remove('active'); });
  event.target.classList.add('active');
  anLoadDashboard();
}

function anGetRangeFilter() {
  var now = new Date();
  if (anRange === 'today') {
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return start.toISOString();
  } else if (anRange === '7d') {
    return new Date(now.getTime() - 7 * 86400000).toISOString();
  } else if (anRange === '30d') {
    return new Date(now.getTime() - 30 * 86400000).toISOString();
  }
  return '2020-01-01T00:00:00Z';
}

function anFormatDuration(secs) {
  if (!secs || secs < 1) return '0s';
  if (secs < 60) return secs + 's';
  if (secs < 3600) return Math.floor(secs / 60) + 'm ' + (secs % 60) + 's';
  return Math.floor(secs / 3600) + 'h ' + Math.floor((secs % 3600) / 60) + 'm';
}

function anFormatTime(iso) {
  var d = new Date(iso);
  var now = new Date();
  var diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

async function anLoadDashboard() {
  var since = anGetRangeFilter();

  try {
    // Fetch sessions
    var { data: sessions } = await sb.from('analytics_sessions')
      .select('*')
      .gte('started_at', since)
      .order('started_at', { ascending: false });

    // Fetch page views
    var { data: views } = await sb.from('analytics_page_views')
      .select('*')
      .gte('entered_at', since)
      .order('entered_at', { ascending: false });

    sessions = sessions || [];
    views = views || [];

    // ── Top Stats ──
    document.getElementById('anTotalSessions').textContent = sessions.length;
    document.getElementById('anTotalViews').textContent = views.length;

    var uniqueDays = new Set(sessions.map(function(s) { return s.started_at.split('T')[0]; }));
    document.getElementById('anUniqueDays').textContent = 'Across ' + uniqueDays.size + ' day' + (uniqueDays.size !== 1 ? 's' : '');

    var avgViews = sessions.length ? (views.length / sessions.length).toFixed(1) : '0';
    document.getElementById('anViewsPerSession').textContent = avgViews + ' views/session';

    var totalDur = sessions.reduce(function(sum, s) { return sum + (s.duration_seconds || 0); }, 0);
    var avgDur = sessions.length ? Math.round(totalDur / sessions.length) : 0;
    document.getElementById('anAvgDuration').textContent = anFormatDuration(avgDur);
    document.getElementById('anTotalTime').textContent = anFormatDuration(totalDur) + ' total';

    // Active now (sessions updated in last 5 min)
    var fiveAgo = new Date(Date.now() - 300000).toISOString();
    var { data: activeSessions } = await sb.from('analytics_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('ended_at', fiveAgo)
      .eq('is_active', true);
    // Use count from response or fallback
    var activeCount = 0;
    try {
      var { count } = await sb.from('analytics_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('ended_at', fiveAgo);
      activeCount = count || 0;
    } catch(e) { console.error('Error:', e); }
    document.getElementById('anActiveNow').textContent = activeCount;

    // ── Daily Sessions Chart ──
    var dailyCounts = {};
    sessions.forEach(function(s) {
      var day = s.started_at.split('T')[0];
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });
    var days = Object.keys(dailyCounts).sort();
    if (days.length === 0) {
      days = [new Date().toISOString().split('T')[0]];
      dailyCounts[days[0]] = 0;
    }
    // Pad to at least 7 days for visual
    while (days.length < 7) {
      var first = new Date(days[0]);
      first.setDate(first.getDate() - 1);
      var key = first.toISOString().split('T')[0];
      days.unshift(key);
      dailyCounts[key] = 0;
    }
    var maxCount = Math.max.apply(null, days.map(function(d) { return dailyCounts[d] || 0; }));
    if (maxCount === 0) maxCount = 1;

    var chartHtml = '';
    var labelsHtml = '';
    days.forEach(function(d) {
      var c = dailyCounts[d] || 0;
      var h = Math.max(4, (c / maxCount) * 156);
      var label = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartHtml += '<div class="an-chart-bar" style="height:' + h + 'px"><div class="an-chart-bar-tooltip">' + label + ': ' + c + '</div></div>';
      labelsHtml += '<span>' + label + '</span>';
    });
    document.getElementById('anDailyChart').innerHTML = chartHtml;
    document.getElementById('anDailyLabels').innerHTML = labelsHtml;

    // ── Most Visited Sections ──
    var sectionCounts = {};
    views.forEach(function(v) {
      if (v.section === 'analytics') return; // exclude analytics page itself
      sectionCounts[v.section] = (sectionCounts[v.section] || 0) + 1;
    });
    var sortedSections = Object.entries(sectionCounts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 8);
    var maxSec = sortedSections.length ? sortedSections[0][1] : 1;
    var pageBarsHtml = '';
    sortedSections.forEach(function(entry) {
      var name = anSectionNames[entry[0]] || entry[0];
      var pct = (entry[1] / maxSec) * 100;
      pageBarsHtml += '<div class="an-bar-row"><div class="an-bar-label">' + name + '</div><div class="an-bar-track"><div class="an-bar-fill" style="width:' + pct + '%"></div></div><div class="an-bar-count">' + entry[1] + '</div></div>';
    });
    document.getElementById('anPageBars').innerHTML = pageBarsHtml || '<div style="color:var(--ies-gray-500);font-size:13px;">No data yet</div>';

    // ── Avg Time per Section ──
    var sectionTimes = {};
    var sectionTimeCounts = {};
    views.forEach(function(v) {
      if (v.duration_seconds && v.section !== 'analytics') {
        sectionTimes[v.section] = (sectionTimes[v.section] || 0) + v.duration_seconds;
        sectionTimeCounts[v.section] = (sectionTimeCounts[v.section] || 0) + 1;
      }
    });
    var avgTimes = Object.keys(sectionTimes).map(function(k) {
      return { section: k, avg: Math.round(sectionTimes[k] / sectionTimeCounts[k]) };
    }).sort(function(a, b) { return b.avg - a.avg; }).slice(0, 8);
    var maxTime = avgTimes.length ? avgTimes[0].avg : 1;
    var timeBarsHtml = '';
    avgTimes.forEach(function(entry) {
      var name = anSectionNames[entry.section] || entry.section;
      var pct = (entry.avg / maxTime) * 100;
      timeBarsHtml += '<div class="an-bar-row"><div class="an-bar-label">' + name + '</div><div class="an-bar-track"><div class="an-bar-fill" style="width:' + pct + '%;background:#6366f1"></div></div><div class="an-bar-count">' + anFormatDuration(entry.avg) + '</div></div>';
    });
    document.getElementById('anTimeBars').innerHTML = timeBarsHtml || '<div style="color:var(--ies-gray-500);font-size:13px;">No data yet</div>';

    // ── Browser & Device Breakdown ──
    var browserCounts = {};
    var deviceCounts = {};
    sessions.forEach(function(s) {
      browserCounts[s.browser || 'Unknown'] = (browserCounts[s.browser || 'Unknown'] || 0) + 1;
      deviceCounts[s.device_type || 'desktop'] = (deviceCounts[s.device_type || 'desktop'] || 0) + 1;
    });
    var deviceHtml = '<div style="margin-bottom:14px;font-size:12px;font-weight:600;color:var(--ies-gray-500);">DEVICES</div>';
    var sortedDevices = Object.entries(deviceCounts).sort(function(a, b) { return b[1] - a[1]; });
    var maxDev = sortedDevices.length ? sortedDevices[0][1] : 1;
    sortedDevices.forEach(function(entry) {
      var badgeClass = 'an-badge-' + entry[0];
      var pct = (entry[1] / maxDev) * 100;
      deviceHtml += '<div class="an-bar-row"><div class="an-bar-label"><span class="an-badge ' + badgeClass + '">' + entry[0] + '</span></div><div class="an-bar-track"><div class="an-bar-fill" style="width:' + pct + '%;background:#10b981"></div></div><div class="an-bar-count">' + entry[1] + '</div></div>';
    });
    deviceHtml += '<div style="margin:14px 0 10px;font-size:12px;font-weight:600;color:var(--ies-gray-500);">BROWSERS</div>';
    var sortedBrowsers = Object.entries(browserCounts).sort(function(a, b) { return b[1] - a[1]; });
    var maxBr = sortedBrowsers.length ? sortedBrowsers[0][1] : 1;
    sortedBrowsers.forEach(function(entry) {
      var pct = (entry[1] / maxBr) * 100;
      deviceHtml += '<div class="an-bar-row"><div class="an-bar-label">' + entry[0] + '</div><div class="an-bar-track"><div class="an-bar-fill" style="width:' + pct + '%;background:#f59e0b"></div></div><div class="an-bar-count">' + entry[1] + '</div></div>';
    });
    document.getElementById('anDeviceBars').innerHTML = deviceHtml || '<div style="color:var(--ies-gray-500);font-size:13px;">No data yet</div>';

    // ── Recent Sessions Table ──
    var tableHtml = '';
    sessions.slice(0, 20).forEach(function(s) {
      var badgeClass = 'an-badge-' + (s.device_type || 'desktop');
      tableHtml += '<tr>' +
        '<td>' + anFormatTime(s.started_at) + '</td>' +
        '<td>' + anFormatDuration(s.duration_seconds || 0) + '</td>' +
        '<td>' + (s.page_count || 0) + '</td>' +
        '<td>' + (s.browser || '—') + '</td>' +
        '<td><span class="an-badge ' + badgeClass + '">' + (s.device_type || 'desktop') + '</span></td>' +
        '<td>' + (s.screen_width || '—') + '×' + (s.screen_height || '—') + '</td>' +
        '</tr>';
    });
    document.getElementById('anSessionBody').innerHTML = tableHtml || '<tr><td colspan="6" style="text-align:center;color:var(--ies-gray-500);">No sessions yet</td></tr>';

    // ── Activity Heatmap (last 4 weeks) ──
    var heatmapData = {};
    var hmStart = new Date();
    hmStart.setDate(hmStart.getDate() - 27);
    hmStart.setHours(0, 0, 0, 0);
    // Align to Monday
    while (hmStart.getDay() !== 1) hmStart.setDate(hmStart.getDate() - 1);

    var { data: hmViews } = await sb.from('analytics_page_views')
      .select('entered_at')
      .gte('entered_at', hmStart.toISOString());

    (hmViews || []).forEach(function(v) {
      var day = v.entered_at.split('T')[0];
      heatmapData[day] = (heatmapData[day] || 0) + 1;
    });
    var hmMax = Math.max.apply(null, Object.values(heatmapData).concat([1]));

    var hmHtml = '';
    var cursor = new Date(hmStart);
    for (var w = 0; w < 4; w++) {
      for (var d = 0; d < 7; d++) {
        var key = cursor.toISOString().split('T')[0];
        var count = heatmapData[key] || 0;
        var intensity = count === 0 ? 0 : Math.max(0.15, count / hmMax);
        var bg = count === 0 ? 'var(--ies-gray-100)' : 'rgba(255,58,0,' + intensity + ')';
        var label = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ': ' + count + ' views';
        hmHtml += '<div class="an-heatmap-cell" style="background:' + bg + '" data-tip="' + label + '"></div>';
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    document.getElementById('anHeatmap').innerHTML = hmHtml;

    document.getElementById('anLastUpdated').textContent = 'Updated ' + new Date().toLocaleTimeString();

  } catch(e) {
    console.error('Analytics dashboard error:', e);
  }
}

// Secret access: append #analytics to URL to open dashboard
// e.g. https://brockeckles.github.io/ies-hub/#analytics
function anCheckHashAccess() {
  if (window.location.hash === '#analytics') {
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    document.getElementById('sec-analytics').classList.add('active');
    window.scrollTo(0, 0);
    var main = document.querySelector('.main');
    if (main) main.scrollTop = 0;
    anLoadDashboard();
  }
}
window.addEventListener('hashchange', anCheckHashAccess);
window.addEventListener('load', function() { setTimeout(anCheckHashAccess, 1000); });

