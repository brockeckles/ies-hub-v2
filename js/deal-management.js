// ═══════════════════════════════════════════════════════════════════════════════
// DEAL MANAGEMENT MODULE
// IES Hub V2 — Deal & Project Management, Pipeline, Hours Tracking,
//               Tasks, Timesheet, Win Strategy, Deal Stages, Deal Artifacts
// Extracted from index.html
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// DEAL & PROJECT MANAGEMENT MODULES
// ═══════════════════════════════════════════════════
var PM_STAGES = [
  { key:'pre_sales', label:'Pre-Sales Engagement' },
  { key:'deal_qualification', label:'Deal Qualification' },
  { key:'solution_design', label:'Kick-Off & Solution Design' },
  { key:'ops_review', label:'Operations Review' },
  { key:'exec_review', label:'Executive Review' },
  { key:'delivery_handover', label:'Delivery Handover' },
  { key:'closed_won', label:'Closed Won' },
  { key:'closed_lost', label:'Closed Lost' },
  { key:'on_hold', label:'On Hold' }
];
var PM_ACTIVE_STAGES = ['pre_sales','deal_qualification','solution_design','ops_review','exec_review','delivery_handover'];
var PM_HOURS_TYPES = ['solutions_design','engineering','deal_management','site_visit','customer_meeting','internal_review','documentation','other'];
var PM_STATUS_COLORS = {
  active:'background:rgba(25,135,84,.08);color:var(--ies-green)',
  on_hold:'background:rgba(255,193,7,.12);color:#b38600',
  completed:'background:rgba(0,71,171,.08);color:var(--ies-blue)',
  cancelled:'background:rgba(220,53,69,.08);color:var(--ies-red)'
};

var pmData = { customers:[], opportunities:[], hours:[], updates:[], tasks:[], generalHours:[] };
var pmCurrentOpp = null;
var pmViewMode = 'kanban'; // kanban | list

async function pmLoadAll() {
  if (!sb) { showSectionError('sec-deals', 'Database connection unavailable. Deal data cannot be loaded.'); return; }
  clearSectionError('sec-deals');
  try {
    var [custRes, oppRes, hrsRes, updRes, taskRes, genRes] = await Promise.all([
      sb.from('customers').select('*').order('name'),
      sb.from('opportunities').select('*').order('created_at', {ascending:false}),
      sb.from('project_hours').select('*').order('week_start', {ascending:false}),
      sb.from('project_updates').select('*').order('update_date', {ascending:false}),
      sb.from('opportunity_tasks').select('*').order('sort_order'),
      sb.from('general_hours').select('*').order('week_start', {ascending:false})
    ]);
    pmData.customers = (custRes.data || []);
    pmData.opportunities = (oppRes.data || []);
    pmData.hours = (hrsRes.data || []);
    pmData.updates = (updRes.data || []);
    pmData.tasks = (taskRes.data || []);
    pmData.generalHours = (genRes.data || []);
    pmRenderStats();
    pmRenderPipeline();
    pmPopulateCustomerFilter();
  } catch(e) { console.error('PM load error:', e); showSectionError('sec-deals', 'Failed to load deal data. Check your connection and try refreshing.'); }
}

function pmGetCustomerName(id) {
  var c = pmData.customers.find(function(x){ return String(x.id) === String(id); });
  return c ? c.name : 'Unknown';
}

function pmOppHours(oppId, cat) {
  // cat = 'forecast' or 'actual' (maps to hours.category enum)
  return pmData.hours.filter(function(h){ return h.opportunity_id === oppId && (!cat || h.category === cat); })
    .reduce(function(sum, h){ return sum + Number(h.hours || 0); }, 0);
}

function pmRenderStats() {
  var active = pmData.opportunities.filter(function(o){ return PM_ACTIVE_STAGES.indexOf(o.stage) >= 0; });
  var totalForecast = 0, totalActual = 0;
  active.forEach(function(o){
    totalForecast += pmOppHours(o.id, 'forecast');
    totalActual += pmOppHours(o.id, 'actual');
  });
  var custWithActive = new Set(active.map(function(o){ return o.customer_id; }));
  document.getElementById('pm-stat-active').textContent = active.length;
  document.getElementById('pm-stat-active-sub').textContent = pmData.opportunities.length + ' total';
  document.getElementById('pm-stat-forecast').textContent = totalForecast.toLocaleString();
  document.getElementById('pm-stat-actual').textContent = totalActual.toLocaleString();
  var delta = totalActual - totalForecast;
  document.getElementById('pm-stat-actual-sub').textContent = (delta >= 0 ? '+' : '') + delta.toLocaleString() + ' vs forecast';
  document.getElementById('pm-stat-customers').textContent = custWithActive.size;
  document.getElementById('pm-stat-customers-sub').textContent = pmData.customers.length + ' total';
}

function pmPopulateCustomerFilter() {
  var sel = document.getElementById('pm-filter-customer');
  if (!sel) return;
  var html = '<option value="">All Customers</option>';
  pmData.customers.forEach(function(c){ html += '<option value="'+c.id+'">'+esc(c.name)+'</option>'; });
  sel.innerHTML = html;
}

function pmRenderPipeline() {
  var container = document.getElementById('pm-pipeline');
  if (!container) return;
  var searchVal = (document.getElementById('pm-search') || {}).value || '';
  searchVal = searchVal.toLowerCase();
  var custFilter = (document.getElementById('pm-filter-customer') || {}).value || '';
  // Only show active stages in kanban
  var displayStages = PM_STAGES.filter(function(s){ return PM_ACTIVE_STAGES.indexOf(s.key) >= 0; });
  var html = '';
  displayStages.forEach(function(stage) {
    var opps = pmData.opportunities.filter(function(o){
      if (o.stage !== stage.key) return false;
      if (custFilter && String(o.customer_id) !== String(custFilter)) return false;
      if (searchVal) {
        var name = (o.name || '').toLowerCase();
        var cust = pmGetCustomerName(o.customer_id).toLowerCase();
        if (name.indexOf(searchVal) < 0 && cust.indexOf(searchVal) < 0) return false;
      }
      return true;
    });
    html += '<div class="pm-stage-col"><div class="pm-stage-hdr">' + stage.label + '<span class="pm-stage-count">' + opps.length + '</span></div>';
    if (opps.length === 0) {
      html += '<div style="text-align:center;padding:20px 10px;color:var(--ies-gray-300);font-size:12px;">No opportunities</div>';
    }
    opps.forEach(function(o){
      var forecast = pmOppHours(o.id, 'forecast');
      var actual = pmOppHours(o.id, 'actual');
      var statusLabel = (o.status || 'active').replace(/_/g,' ');
      var statusStyle = PM_STATUS_COLORS[o.status || 'active'] || PM_STATUS_COLORS.active;
      var oppTasks = pmData.tasks.filter(function(t){ return t.opportunity_id == o.id; });
      var tasksDone = oppTasks.filter(function(t){ return t.status==='done'; }).length;
      var tasksBlocked = oppTasks.filter(function(t){ return t.status==='blocked'; }).length;
      html += '<div class="pm-card" onclick="pmOpenDetail(\''+o.id+'\')">';
      html += '<div class="pm-card-customer">' + pmGetCustomerName(o.customer_id) + '</div>';
      html += '<div class="pm-card-title">' + esc(o.name || 'Untitled') + '</div>';
      if (o.facility_type || o.state) {
        html += '<div style="font-size:11px;color:var(--ies-gray-400);margin-bottom:6px;">';
        if (o.facility_type) html += o.facility_type;
        if (o.facility_type && o.state) html += ' · ';
        if (o.state) html += o.state;
        if (o.total_sqft) html += ' · ' + Number(o.total_sqft).toLocaleString() + ' sqft';
        html += '</div>';
      }
      html += '<div class="pm-card-meta">';
      if (forecast > 0) html += '<span class="pm-card-tag pm-tag-hours">' + forecast + 'h F</span>';
      if (actual > 0) html += '<span class="pm-card-tag pm-tag-hours">' + actual + 'h A</span>';
      if (oppTasks.length > 0) html += '<span class="pm-card-tag" style="background:var(--ies-gray-100);color:var(--ies-gray-600);">' + tasksDone + '/' + oppTasks.length + ' tasks</span>';
      if (tasksBlocked > 0) html += '<span class="pm-card-tag" style="background:rgba(220,53,69,.08);color:var(--ies-red);">' + tasksBlocked + ' blocked</span>';
      html += '<span class="pm-card-tag" style="' + statusStyle + '">' + statusLabel + '</span>';
      if (o.due_date) {
        var daysLeft = Math.ceil((new Date(o.due_date+'T00:00:00') - new Date()) / 86400000);
        var dueColor = daysLeft < 0 ? 'var(--ies-red)' : (daysLeft < 14 ? '#b38600' : 'var(--ies-gray-400)');
        html += '<span style="font-size:10px;font-weight:600;color:'+dueColor+';">' + (daysLeft < 0 ? Math.abs(daysLeft)+'d overdue' : daysLeft+'d left') + '</span>';
      }
      html += '</div></div>';
    });
    html += '</div>';
  });
  container.innerHTML = html;
  // Also render list view
  pmRenderListView(searchVal, custFilter);
}

function pmRenderListView(searchVal, custFilter) {
  var body = document.getElementById('pm-list-body');
  if (!body) return;
  var opps = pmData.opportunities.filter(function(o){
    if (custFilter && String(o.customer_id) !== String(custFilter)) return false;
    if (searchVal) {
      var name = (o.name || '').toLowerCase();
      var cust = pmGetCustomerName(o.customer_id).toLowerCase();
      if (name.indexOf(searchVal) < 0 && cust.indexOf(searchVal) < 0) return false;
    }
    return true;
  });
  var html = '';
  opps.forEach(function(o){
    var forecast = pmOppHours(o.id, 'forecast');
    var actual = pmOppHours(o.id, 'actual');
    var delta = actual - forecast;
    var stageLabel = (PM_STAGES.find(function(s){return s.key===o.stage;}) || {}).label || o.stage;
    var statusLabel = (o.status || 'active').replace(/_/g,' ');
    var statusStyle = PM_STATUS_COLORS[o.status || 'active'] || PM_STATUS_COLORS.on_track;
    var deltaClass = delta > 0 ? 'pm-delta-neg' : (delta < 0 ? 'pm-delta-pos' : '');
    html += '<tr style="cursor:pointer;" onclick="pmOpenDetail(\''+o.id+'\')">';
    html += '<td style="font-weight:600;">' + pmGetCustomerName(o.customer_id) + '</td>';
    html += '<td>' + esc(o.name || 'Untitled') + '</td>';
    html += '<td><span class="pm-card-tag" style="background:var(--ies-gray-100);color:var(--ies-gray-600);">' + stageLabel + '</span></td>';
    html += '<td><span class="pm-card-tag" style="' + statusStyle + '">' + statusLabel + '</span></td>';
    html += '<td style="text-align:right;font-weight:600;">' + (forecast || '—') + '</td>';
    html += '<td style="text-align:right;font-weight:600;">' + (actual || '—') + '</td>';
    html += '<td style="text-align:right;" class="' + deltaClass + '">' + (delta !== 0 ? (delta > 0 ? '+' : '') + delta : '—') + '</td>';
    html += '</tr>';
  });
  body.innerHTML = html || '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--ies-gray-400);">No opportunities found</td></tr>';
}

function pmFilterPipeline() { pmRenderPipeline(); }

function pmToggleView() {
  var btn = document.getElementById('pm-view-toggle');
  if (pmViewMode === 'kanban') {
    pmViewMode = 'list';
    document.getElementById('pm-pipeline-view').style.display = 'none';
    document.getElementById('pm-list-view').style.display = 'block';
    if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Kanban View';
  } else {
    pmViewMode = 'kanban';
    document.getElementById('pm-pipeline-view').style.display = 'block';
    document.getElementById('pm-list-view').style.display = 'none';
    if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>List View';
  }
}

// ── DETAIL PANEL ──
function pmOpenDetail(oppId) {
  pmCurrentOpp = pmData.opportunities.find(function(o){ return String(o.id) === String(oppId); });
  if (!pmCurrentOpp) return;
  // Hide pipeline/list, show detail
  document.getElementById('pm-pipeline-view').style.display = 'none';
  document.getElementById('pm-list-view').style.display = 'none';
  document.getElementById('pm-stats').style.display = 'none';
  document.querySelector('#sec-deals .pm-toolbar').style.display = 'none';
  var detail = document.getElementById('pm-detail');
  if (!detail) return;
  detail.classList.add('active');
  // Populate header
  document.getElementById('pm-detail-customer').textContent = pmGetCustomerName(pmCurrentOpp.customer_id);
  document.getElementById('pm-detail-title').textContent = pmCurrentOpp.name || 'Untitled';
  // Reset to overview tab
  pmShowDetailTab('overview', document.querySelector('#pm-detail .pm-tab'));
  pmRenderOverview();
  pmRenderWinStrategy();
  pmRenderTaskSummary();
  pmRenderTasks();
  pmLoadHours();
  pmLoadUpdates();
}

function pmBackToPipeline() {
  pmCurrentOpp = null;
  var detail = document.getElementById('pm-detail');
  if (detail) detail.classList.remove('active');
  var stats = document.getElementById('pm-stats');
  if (stats) stats.style.display = '';
  var toolbar = document.querySelector('#sec-deals .pm-toolbar');
  if (toolbar) toolbar.style.display = '';
  var pipelineView = document.getElementById('pm-pipeline-view');
  var listView = document.getElementById('pm-list-view');
  if (pmViewMode === 'kanban') {
    if (pipelineView) pipelineView.style.display = 'block';
    if (listView) listView.style.display = 'none';
  } else {
    if (pipelineView) pipelineView.style.display = 'none';
    if (listView) listView.style.display = 'block';
  }
  pmRenderPipeline();
}

function pmShowDetailTab(tabId, tabEl) {
  document.querySelectorAll('#pm-detail .pm-tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('#pm-detail .pm-tab-panel').forEach(function(p){ p.classList.remove('active'); });
  if (tabEl) tabEl.classList.add('active');
  var panel = document.getElementById('pm-tab-' + tabId);
  if (panel) panel.classList.add('active');
  // Load workspace artifacts when workspace tab is clicked
  if (tabId === 'workspace' && pmCurrentOpp) {
    daLoadArtifacts(pmCurrentOpp.id);
  }
}

function pmRenderOverview() {
  if (!pmCurrentOpp) return;
  var o = pmCurrentOpp;
  var stageLabel = (PM_STAGES.find(function(s){return s.key===o.stage;}) || {}).label || o.stage;
  var statusLabel = (o.status || 'active').replace(/_/g,' ');
  var html = '';
  var fields = [
    { label:'Stage', value:stageLabel },
    { label:'Status', value:'<span class="pm-card-tag" style="' + (PM_STATUS_COLORS[o.status||'active']||'') + '">' + statusLabel + '</span>' },
    { label:'Facility Type', value:o.facility_type || '—' },
    { label:'Total Sqft', value:o.total_sqft ? Number(o.total_sqft).toLocaleString() : '—' },
    { label:'State', value:o.state || '—' },
    { label:'Solutions Lead', value:o.solutions_lead || '—' },
    { label:'Engineering Lead', value:o.engineering_lead || '—' },
    { label:'Due Date', value:o.due_date ? new Date(o.due_date+'T00:00:00').toLocaleDateString() : '—' },
    { label:'Round', value:o.round || '—' },
    { label:'Created', value:o.created_at ? new Date(o.created_at).toLocaleDateString() : '—' },
  ];
  if (o.notes) fields.push({ label:'Notes', value:o.notes });
  fields.forEach(function(f){
    html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ies-gray-100);">';
    html += '<span style="font-size:12px;font-weight:600;color:var(--ies-gray-400);">' + f.label + '</span>';
    html += '<span style="font-size:13px;font-weight:600;color:var(--ies-navy);text-align:right;">' + f.value + '</span>';
    html += '</div>';
  });
  document.getElementById('pm-detail-fields').innerHTML = html;

  // Hours summary
  var forecast = pmOppHours(o.id, 'forecast');
  var actual = pmOppHours(o.id, 'actual');
  var delta = actual - forecast;
  var pct = forecast > 0 ? Math.round((actual/forecast)*100) : 0;
  var barWidth = Math.min(pct, 150);
  var barColor = pct > 110 ? 'var(--ies-red)' : (pct > 90 ? 'var(--ies-yellow)' : 'var(--ies-blue)');
  var sumHtml = '';
  sumHtml += '<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="font-size:12px;color:var(--ies-gray-400);font-weight:600;">Forecast</span><span style="font-size:16px;font-weight:800;color:var(--ies-navy);">' + forecast + 'h</span></div>';
  sumHtml += '<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="font-size:12px;color:var(--ies-gray-400);font-weight:600;">Actual</span><span style="font-size:16px;font-weight:800;color:var(--ies-navy);">' + actual + 'h</span></div>';
  sumHtml += '<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span style="font-size:12px;color:var(--ies-gray-400);font-weight:600;">Delta</span><span style="font-size:16px;font-weight:800;' + (delta>0?'color:var(--ies-red)':'color:var(--ies-green)') + ';">' + (delta>=0?'+':'') + delta + 'h</span></div>';
  sumHtml += '<div style="background:var(--ies-gray-100);border-radius:6px;height:8px;overflow:hidden;"><div style="width:' + barWidth + '%;height:100%;background:' + barColor + ';border-radius:6px;transition:width .3s;"></div></div>';
  sumHtml += '<div style="text-align:center;font-size:11px;color:var(--ies-gray-400);margin-top:6px;">' + pct + '% of forecast used</div>';
  // By work type breakdown
  sumHtml += '<div style="margin-top:20px;border-top:1px solid var(--ies-gray-100);padding-top:16px;">';
  sumHtml += '<div style="font-size:12px;font-weight:700;color:var(--ies-gray-600);margin-bottom:10px;">By Work Type</div>';
  PM_HOURS_TYPES.forEach(function(ht){
    var htF = pmData.hours.filter(function(h){ return h.opportunity_id===o.id && h.category==='forecast' && h.hours_type===ht; }).reduce(function(s,h){return s+Number(h.hours);},0);
    var htA = pmData.hours.filter(function(h){ return h.opportunity_id===o.id && h.category==='actual' && h.hours_type===ht; }).reduce(function(s,h){return s+Number(h.hours);},0);
    if (htF === 0 && htA === 0) return;
    sumHtml += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;">';
    sumHtml += '<span style="color:var(--ies-gray-600);text-transform:capitalize;">' + ht.replace(/_/g,' ') + '</span>';
    sumHtml += '<span style="font-weight:600;color:var(--ies-navy);">' + htA + ' / ' + htF + '</span></div>';
  });
  sumHtml += '</div>';
  document.getElementById('pm-detail-hours-summary').innerHTML = sumHtml;
}

// ── HOURS TAB ──
function pmLoadHours() {
  if (!pmCurrentOpp) return;
  var typeFilter = (document.getElementById('pm-hours-category') || {}).value || '';
  var hrs = pmData.hours.filter(function(h){ return h.opportunity_id === pmCurrentOpp.id; });
  if (typeFilter) hrs = hrs.filter(function(h){ return h.hours_type === typeFilter; });

  // Group by week + hours_type: merge forecast and actual into same row
  var grouped = {};
  hrs.forEach(function(h){
    var key = h.week_start + '|' + h.hours_type;
    if (!grouped[key]) grouped[key] = { week:h.week_start, workType:h.hours_type, forecast:0, actual:0 };
    grouped[key][h.category] += Number(h.hours || 0);
  });
  var rows = Object.values(grouped).sort(function(a,b){ return b.week.localeCompare(a.week) || a.workType.localeCompare(b.workType); });

  var body = document.getElementById('pm-hours-body');
  var empty = document.getElementById('pm-hours-empty');
  if (rows.length === 0) {
    body.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  var html = '';
  rows.forEach(function(r){
    var delta = r.actual - r.forecast;
    var deltaClass = delta > 0 ? 'pm-delta-neg' : (delta < 0 ? 'pm-delta-pos' : '');
    html += '<tr>';
    html += '<td style="font-weight:600;">' + r.week + '</td>';
    html += '<td style="text-transform:capitalize;">' + r.workType.replace(/_/g,' ') + '</td>';
    html += '<td style="text-align:right;font-weight:600;">' + r.forecast + '</td>';
    html += '<td style="text-align:right;font-weight:600;">' + r.actual + '</td>';
    html += '<td style="text-align:right;" class="' + deltaClass + '">' + (delta !== 0 ? (delta>0?'+':'') + delta : '—') + '</td>';
    html += '<td style="text-align:right;"><button class="pm-btn pm-btn-outline pm-btn-sm" onclick="event.stopPropagation();pmDeleteHoursRow(\''+r.week+'\',\''+r.workType+'\')" style="padding:4px 8px;font-size:11px;color:var(--ies-red);border-color:var(--ies-red);">×</button></td>';
    html += '</tr>';
  });
  body.innerHTML = html;
}

function pmAddHoursRow(hrsCategory) {
  if (!pmCurrentOpp) return;
  hrsCategory = hrsCategory || 'actual';
  var isForecast = hrsCategory === 'forecast';
  var tagColor = isForecast ? 'background:rgba(0,71,171,.08);color:var(--ies-blue)' : 'background:rgba(25,135,84,.08);color:var(--ies-green)';
  // Get current Monday
  var now = new Date();
  var day = now.getDay();
  var diff = now.getDate() - day + (day === 0 ? -6 : 1);
  var monday = new Date(now.getFullYear(), now.getMonth(), diff);
  var weekStr = monday.toISOString().split('T')[0];

  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title" style="display:flex;align-items:center;gap:10px;">Log Hours <span class="pm-card-tag" style="'+tagColor+';font-size:11px;font-weight:700;padding:3px 10px;text-transform:uppercase;">'+hrsCategory+'</span></div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group"><label class="pm-form-label">Week Starting</label><input type="date" class="pm-form-input" id="pm-hrs-week" value="'+weekStr+'"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Work Type</label><select class="pm-form-input" id="pm-hrs-type">';
  PM_HOURS_TYPES.forEach(function(t){ html += '<option value="'+t+'" style="text-transform:capitalize;">'+t.replace(/_/g,' ')+'</option>'; });
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Resource</label><input type="text" class="pm-form-input" id="pm-hrs-resource" value="Brock Eckles"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Hours</label><input type="number" class="pm-form-input" id="pm-hrs-hours" min="0" step="0.5" value="0"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Notes</label><input type="text" class="pm-form-input" id="pm-hrs-notes" placeholder="Optional description..."></div>';
  html += '</div>';
  html += '<input type="hidden" id="pm-hrs-cat" value="'+hrsCategory+'">';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveHours()">Save Hours</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveHours() {
  if (!sb || !pmCurrentOpp) return;
  var hours = parseFloat(document.getElementById('pm-hrs-hours').value) || 0;
  if (hours <= 0) { alert('Please enter hours greater than 0.'); return; }
  var week = document.getElementById('pm-hrs-week').value;
  var workType = document.getElementById('pm-hrs-type').value;
  var resource = document.getElementById('pm-hrs-resource').value.trim() || null;
  var category = document.getElementById('pm-hrs-cat').value;
  try {
    var row = { opportunity_id:pmCurrentOpp.id, week_start:week, hours_type:workType, category:category, hours:hours, resource:resource, notes:(document.getElementById('pm-hrs-notes').value.trim()||null) };
    var res = await sb.from('project_hours').insert(row);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
    pmShowDetailTab('hours', document.querySelectorAll('#pm-detail .pm-tab')[1]);
  } catch(e) { alert('Error saving hours: ' + e.message); }
}

async function pmDeleteHoursRow(week, workType) {
  if (!sb || !pmCurrentOpp) return;
  if (!confirm('Delete hours for ' + week + ' (' + workType.replace(/_/g,' ') + ')?')) return;
  try {
    var res = await sb.from('project_hours').delete()
      .eq('opportunity_id', pmCurrentOpp.id)
      .eq('week_start', week)
      .eq('hours_type', workType);
    if (res.error) throw res.error;
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
    pmShowDetailTab('hours', document.querySelectorAll('#pm-detail .pm-tab')[1]);
  } catch(e) { alert('Error deleting hours: ' + e.message); }
}

// ── UPDATES TAB ──
function pmLoadUpdates() {
  if (!pmCurrentOpp) return;
  var upds = pmData.updates.filter(function(u){ return u.opportunity_id === pmCurrentOpp.id; });
  var container = document.getElementById('pm-updates-list');
  var empty = document.getElementById('pm-updates-empty');
  if (upds.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  var html = '';
  upds.forEach(function(u){
    html += '<div class="pm-update-card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<div class="pm-update-date">' + new Date(u.update_date+'T00:00:00').toLocaleDateString('en-US', {weekday:'short', year:'numeric', month:'short', day:'numeric'}) + '</div>';
    if (u.author) html += '<span style="font-size:11px;color:var(--ies-gray-400);font-weight:600;">' + u.author + '</span>';
    html += '</div>';
    html += '<div class="pm-update-body" style="margin-top:8px;">' + (u.body || '').replace(/\n/g,'<br>') + '</div>';
    if (u.next_steps) {
      html += '<div style="margin-top:10px;padding:10px 12px;background:rgba(0,71,171,.04);border-radius:8px;border-left:3px solid var(--ies-blue);">';
      html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--ies-blue);margin-bottom:4px;">Next Steps</div>';
      html += '<div style="font-size:12px;color:var(--ies-gray-800);">' + u.next_steps.replace(/\n/g,'<br>') + '</div></div>';
    }
    if (u.blockers) {
      html += '<div style="margin-top:8px;padding:10px 12px;background:rgba(220,53,69,.04);border-radius:8px;border-left:3px solid var(--ies-red);">';
      html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--ies-red);margin-bottom:4px;">Blockers</div>';
      html += '<div style="font-size:12px;color:var(--ies-gray-800);">' + u.blockers.replace(/\n/g,'<br>') + '</div></div>';
    }
    html += '<div style="display:flex;justify-content:flex-end;margin-top:8px;">';
    html += '<button class="pm-btn pm-btn-outline pm-btn-sm" onclick="pmDeleteUpdate(\''+u.id+'\')" style="padding:4px 10px;font-size:11px;color:var(--ies-red);border-color:var(--ies-red);">Delete</button>';
    html += '</div></div>';
  });
  container.innerHTML = html;
}

function pmShowNewUpdate() {
  if (!pmCurrentOpp) return;
  var today = new Date().toISOString().split('T')[0];
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title">New Weekly Update</div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group"><label class="pm-form-label">Date</label><input type="date" class="pm-form-input" id="pm-upd-date" value="'+today+'"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Author</label><input type="text" class="pm-form-input" id="pm-upd-author" value="Brock Eckles"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Update</label><textarea class="pm-form-input" id="pm-upd-body" rows="4" placeholder="What happened this week?"></textarea></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Next Steps</label><textarea class="pm-form-input" id="pm-upd-next" rows="2" placeholder="What\'s planned next?"></textarea></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Blockers (optional)</label><textarea class="pm-form-input" id="pm-upd-blockers" rows="2" placeholder="Any blockers or risks?"></textarea></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveUpdate()">Post Update</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveUpdate() {
  if (!sb || !pmCurrentOpp) return;
  var date = document.getElementById('pm-upd-date').value;
  var author = document.getElementById('pm-upd-author').value.trim() || null;
  var body = document.getElementById('pm-upd-body').value.trim();
  var nextSteps = document.getElementById('pm-upd-next').value.trim() || null;
  var blockers = document.getElementById('pm-upd-blockers').value.trim() || null;
  if (!body) { alert('Please enter an update.'); return; }
  try {
    var res = await sb.from('project_updates').insert({ opportunity_id:pmCurrentOpp.id, update_date:date, author:author, body:body, next_steps:nextSteps, blockers:blockers });
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
    pmShowDetailTab('updates', document.querySelectorAll('#pm-detail .pm-tab')[2]);
  } catch(e) { alert('Error saving update: ' + e.message); }
}

async function pmDeleteUpdate(id) {
  if (!sb) return;
  if (!confirm('Delete this update?')) return;
  try {
    var res = await sb.from('project_updates').delete().eq('id', id);
    if (res.error) throw res.error;
    await pmLoadAll();
    if (pmCurrentOpp) { pmOpenDetail(pmCurrentOpp.id); pmShowDetailTab('updates', document.querySelectorAll('#pm-detail .pm-tab')[2]); }
  } catch(e) { alert('Error deleting update: ' + e.message); }
}

// ── TASKS / ACTIVITIES TAB ──
var PM_TASK_STATUS_TAGS = { todo:'pm-task-tag-todo', in_progress:'pm-task-tag-inprog', done:'pm-task-tag-done', blocked:'pm-task-tag-blocked' };
var PM_PRIORITY_TAGS = { low:'pm-task-tag-low', medium:'pm-task-tag-medium', high:'pm-task-tag-high', critical:'pm-task-tag-critical' };

function pmRenderTasks() {
  if (!pmCurrentOpp) return;
  var statusFilter = (document.getElementById('pm-task-filter') || {}).value || '';
  var assigneeFilter = (document.getElementById('pm-task-assignee-filter') || {}).value || '';
  var stageFilter = (document.getElementById('pm-task-stage-filter') || {}).value || '';
  var tasks = pmData.tasks.filter(function(t){ return t.opportunity_id == pmCurrentOpp.id; });
  // Populate assignee filter
  var assignees = {};
  tasks.forEach(function(t){ if(t.assignee) assignees[t.assignee] = true; });
  var asel = document.getElementById('pm-task-assignee-filter');
  if (asel) {
    var ahtml = '<option value="">All Assignees</option>';
    Object.keys(assignees).sort().forEach(function(a){ ahtml += '<option value="'+a+'"'+(a===assigneeFilter?' selected':'')+'>'+a+'</option>'; });
    asel.innerHTML = ahtml;
  }
  // Populate stage filter
  var stageSet = {};
  tasks.forEach(function(t){ if(t.dos_stage_number) stageSet[t.dos_stage_number] = t.dos_stage_name || 'Stage '+t.dos_stage_number; });
  var ssel = document.getElementById('pm-task-stage-filter');
  if (ssel) {
    var shtml = '<option value="">All Stages</option>';
    Object.keys(stageSet).sort(function(a,b){return a-b;}).forEach(function(n){ shtml += '<option value="'+n+'"'+(n===stageFilter?' selected':'')+'>Stage '+n+': '+stageSet[n]+'</option>'; });
    if (Object.keys(stageSet).length === 0) ssel.style.display = 'none'; else ssel.style.display = '';
    ssel.innerHTML = shtml;
  }
  // Apply filters
  if (statusFilter) tasks = tasks.filter(function(t){ return t.status === statusFilter; });
  if (assigneeFilter) tasks = tasks.filter(function(t){ return t.assignee === assigneeFilter; });
  if (stageFilter) tasks = tasks.filter(function(t){ return String(t.dos_stage_number) === stageFilter; });

  var container = document.getElementById('pm-tasks-list');
  var empty = document.getElementById('pm-tasks-empty');
  if (tasks.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  // Sort tasks by dos_stage_number (nulls last), then sort_order
  tasks.sort(function(a,b){
    var sa = a.dos_stage_number || 999, sb2 = b.dos_stage_number || 999;
    if (sa !== sb2) return sa - sb2;
    return (a.sort_order||0) - (b.sort_order||0);
  });

  var html = '';
  var currentStage = null;
  tasks.forEach(function(t){
    // Stage section header
    var stageKey = t.dos_stage_number || 0;
    if (stageKey !== currentStage) {
      currentStage = stageKey;
      if (t.dos_stage_number && t.dos_stage_name) {
        var stageTasks = tasks.filter(function(x){ return x.dos_stage_number === t.dos_stage_number; });
        var doneCnt = stageTasks.filter(function(x){ return x.status === 'done'; }).length;
        html += '<div style="display:flex;align-items:center;gap:12px;margin:' + (currentStage > 1 ? '24px' : '0') + ' 0 8px 0;padding-bottom:8px;border-bottom:2px solid var(--ies-navy,#1c1c2e);">';
        html += '<div style="background:var(--ies-navy,#1c1c2e);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;font-family:Montserrat,sans-serif;white-space:nowrap;">STAGE ' + t.dos_stage_number + '</div>';
        html += '<div style="font-size:14px;font-weight:700;color:var(--ies-navy,#1c1c2e);font-family:Montserrat,sans-serif;">' + t.dos_stage_name + '</div>';
        html += '<div style="font-size:11px;color:var(--ies-gray-400);margin-left:auto;font-family:Montserrat,sans-serif;">' + doneCnt + '/' + stageTasks.length + ' complete</div>';
        html += '</div>';
      } else if (!t.dos_stage_number) {
        html += '<div style="display:flex;align-items:center;gap:12px;margin:24px 0 8px 0;padding-bottom:8px;border-bottom:2px solid var(--ies-gray-200,#e5e7eb);">';
        html += '<div style="font-size:14px;font-weight:700;color:var(--ies-gray-400);font-family:Montserrat,sans-serif;">Custom Tasks</div>';
        html += '</div>';
      }
    }
    var isDone = t.status === 'done';
    var isBlocked = t.status === 'blocked';
    var isInProg = t.status === 'in_progress';
    var checkClass = isDone ? 'checked' : (isBlocked ? 'blocked-check' : (isInProg ? 'inprog-check' : ''));
    var checkIcon = isDone ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : (isBlocked ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ies-red)" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' : (isInProg ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--ies-blue);"></div>' : ''));
    html += '<div class="pm-task-card' + (isDone ? ' task-done' : '') + '">';
    html += '<div class="pm-task-row">';
    html += '<div class="pm-task-check ' + checkClass + '" onclick="pmCycleTaskStatus('+t.id+')">' + checkIcon + '</div>';
    html += '<div class="pm-task-body">';
    html += '<div class="pm-task-title' + (isDone ? ' done' : '') + '">' + esc(t.title) + '</div>';
    if (t.description) html += '<div class="pm-task-desc">' + esc(t.description) + '</div>';
    html += '<div class="pm-task-meta">';
    html += '<span class="pm-task-tag ' + (PM_TASK_STATUS_TAGS[t.status]||'') + '">' + t.status.replace(/_/g,' ') + '</span>';
    html += '<span class="pm-task-tag ' + (PM_PRIORITY_TAGS[t.priority]||'') + '">' + t.priority + '</span>';
    if (t.assignee) html += '<span style="font-size:11px;color:var(--ies-gray-400);">' + esc(t.assignee) + '</span>';
    if (t.due_date) {
      var overdue = !isDone && new Date(t.due_date+'T00:00:00') < new Date();
      html += '<span style="font-size:11px;color:' + (overdue?'var(--ies-red)':'var(--ies-gray-400)') + ';font-weight:'+(overdue?'700':'400')+';">Due ' + t.due_date + '</span>';
    }
    if (t.estimated_hours) {
      var actH = t.actual_hours || 0;
      html += '<span style="font-size:11px;color:var(--ies-gray-400);">' + actH + '/' + t.estimated_hours + 'h</span>';
    }
    html += '</div></div>';
    // Actions
    html += '<div style="display:flex;gap:4px;flex-shrink:0;align-items:center;">';
    // Generate Deck button for milestone activities
    var deckTypeMap = {
      'Solutions Qualifications Meeting': 'qualification',
      'Solutions Qualification Deck': 'qualification',
      'Operations Review': (t.dos_stage_number === 4) ? 'ops_review' : null,
      'Obtain ELT Approvals': 'elt_approval',
      'Prepare Presentation': 'customer_presentation'
    };
    var deckType = deckTypeMap[t.title] || null;
    if (deckType && typeof deckGen !== 'undefined') {
      html += '<button class="pm-btn pm-btn-sm" onclick="deckGen.generateDeck(\'' + deckType + '\',' + pmCurrentOpp.id + ')" style="padding:4px 10px;font-size:10px;font-weight:700;background:var(--ies-orange,#ff3a00);color:#fff;border:none;border-radius:6px;cursor:pointer;white-space:nowrap;" title="Auto-generate milestone deck"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" style="vertical-align:-1px;margin-right:3px;"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>Deck</button>';
    }
    html += '<button class="pm-btn pm-btn-outline pm-btn-sm" onclick="pmEditTask('+t.id+')" style="padding:4px 8px;font-size:11px;">Edit</button>';
    html += '<button class="pm-btn pm-btn-outline pm-btn-sm" onclick="pmDeleteTask('+t.id+')" style="padding:4px 8px;font-size:11px;color:var(--ies-red);border-color:var(--ies-red);">×</button>';
    html += '</div></div></div>';
  });
  container.innerHTML = html;
}

async function pmCycleTaskStatus(taskId) {
  if (!sb) return;
  var task = pmData.tasks.find(function(t){ return t.id == taskId; });
  if (!task) return;
  var cycle = { todo:'in_progress', in_progress:'done', done:'todo', blocked:'todo' };
  var next = cycle[task.status] || 'todo';
  try {
    var res = await sb.from('opportunity_tasks').update({ status:next }).eq('id', taskId);
    if (res.error) throw res.error;
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
    pmShowDetailTab('tasks', document.querySelectorAll('#pm-detail .pm-tab')[1]);
  } catch(e) { alert('Error updating task: ' + e.message); }
}

function pmShowNewTask() {
  if (!pmCurrentOpp) return;
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title">New Task</div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Title</label><input type="text" class="pm-form-input" id="pm-task-title" placeholder="e.g. Complete vendor evaluation report"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Description</label><textarea class="pm-form-input" id="pm-task-desc" rows="2" placeholder="Details about this task..."></textarea></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Assignee</label><input type="text" class="pm-form-input" id="pm-task-assignee" value="Brock Eckles"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Priority</label><select class="pm-form-input" id="pm-task-priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Due Date</label><input type="date" class="pm-form-input" id="pm-task-due"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Estimated Hours</label><input type="number" class="pm-form-input" id="pm-task-est" min="0" step="0.5"></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveNewTask()">Create Task</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveNewTask() {
  if (!sb || !pmCurrentOpp) return;
  var title = document.getElementById('pm-task-title').value.trim();
  if (!title) { alert('Please enter a task title.'); return; }
  var maxSort = pmData.tasks.filter(function(t){ return t.opportunity_id == pmCurrentOpp.id; }).reduce(function(m,t){ return Math.max(m, t.sort_order||0); }, 0);
  try {
    var row = {
      opportunity_id: pmCurrentOpp.id,
      title: title,
      description: document.getElementById('pm-task-desc').value.trim() || null,
      assignee: document.getElementById('pm-task-assignee').value.trim() || null,
      priority: document.getElementById('pm-task-priority').value,
      due_date: document.getElementById('pm-task-due').value || null,
      estimated_hours: parseFloat(document.getElementById('pm-task-est').value) || null,
      sort_order: maxSort + 1
    };
    var res = await sb.from('opportunity_tasks').insert(row);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
    pmShowDetailTab('tasks', document.querySelectorAll('#pm-detail .pm-tab')[1]);
  } catch(e) { alert('Error creating task: ' + e.message); }
}

// Stage Activity Population
async function pmPopulateDOSActivities() {
  if (!sb || !pmCurrentOpp) return;

  // Map pipeline stages to activity stage numbers
  var stageMap = {
    'pre_sales': [1],              // Pre-Sales Engagement
    'deal_qualification': [2],     // Deal Qualification
    'solution_design': [3],        // Kick-Off & Solution Design
    'ops_review': [4],             // Operations Review
    'exec_review': [5],            // Executive Review
    'delivery_handover': [6],      // Delivery Handover
    'closed_won': [6],
    'closed_lost': []
  };

  var oppStage = (pmCurrentOpp.stage || '').toLowerCase();
  var dosStageNums = stageMap[oppStage] || [];

  // Build selection modal
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal" style="max-width:520px;">';
  html += '<div class="pm-modal-title">Populate Stage Activities</div>';
  html += '<div style="font-size:13px;color:var(--ies-gray-600);margin-bottom:16px;">Select which IES stages to populate standard activities from. Activities will be added as tasks for this deal.</div>';
  html += '<div style="font-size:12px;color:var(--ies-gray-400);margin-bottom:12px;">Current stage: <strong style="color:var(--ies-navy);">' + (pmCurrentOpp.stage || '—') + '</strong></div>';

  var dosStageLabels = [
    { num: 1, name: 'Pre-Sales Engagement', count: 4 },
    { num: 2, name: 'Deal Qualification', count: 6 },
    { num: 3, name: 'Kick-Off & Solution Design', count: 15 },
    { num: 4, name: 'Operations Review', count: 2 },
    { num: 5, name: 'Executive Review', count: 5 },
    { num: 6, name: 'Delivery Handover', count: 6 }
  ];

  html += '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">';
  dosStageLabels.forEach(function(s) {
    var isRecommended = dosStageNums.indexOf(s.num) >= 0;
    html += '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid ' + (isRecommended ? 'var(--ies-blue)' : 'var(--ies-gray-200)') + ';border-radius:6px;cursor:pointer;background:' + (isRecommended ? 'rgba(37,99,235,.04)' : '#fff') + ';">';
    html += '<input type="checkbox" id="dos-stage-cb-' + s.num + '" value="' + s.num + '"' + (isRecommended ? ' checked' : '') + ' style="width:18px;height:18px;accent-color:var(--ies-blue);">';
    html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--ies-navy);">Stage ' + s.num + ': ' + s.name + '</div>';
    html += '<div style="font-size:11px;color:var(--ies-gray-500);">' + s.count + ' standard activities' + (isRecommended ? ' — <span style="color:var(--ies-blue);font-weight:600;">Recommended for current stage</span>' : '') + '</div>';
    html += '</div></label>';
  });
  html += '</div>';

  html += '<div style="display:flex;gap:10px;justify-content:flex-end;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmExecuteDOSPopulate()">Populate Activities</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmExecuteDOSPopulate() {
  if (!sb || !pmCurrentOpp) return;

  // Gather selected stage numbers
  var selectedStages = [];
  for (var i = 1; i <= 6; i++) {
    var cb = document.getElementById('dos-stage-cb-' + i);
    if (cb && cb.checked) selectedStages.push(i);
  }
  if (selectedStages.length === 0) { pmToast('Please select at least one stage.', 'warning'); return; }

  try {
    // Check for already-populated stages and skip them
    var existingTasks = pmData.tasks.filter(function(t){ return t.opportunity_id == pmCurrentOpp.id && t.dos_stage_number; });
    var existingStages = {};
    existingTasks.forEach(function(t){ existingStages[t.dos_stage_number] = true; });
    var skippedStages = selectedStages.filter(function(n){ return existingStages[n]; });
    selectedStages = selectedStages.filter(function(n){ return !existingStages[n]; });
    if (selectedStages.length === 0) {
      pmToast('Selected stages already populated. Uncheck them to add different stages.', 'warning');
      return;
    }
    if (skippedStages.length > 0) {
      pmToast('Skipped Stage ' + skippedStages.join(', ') + ' (already populated).', 'warning');
    }

    // DOS stage/template definitions (hardcoded — no public Supabase read needed)
    var DOS_TEMPLATES = [
      {sn:1,sname:'Pre-Sales Engagement',name:'Credit Check Form',desc:'Commercial Lead must run credit check and obtain appropriate approvals to proceed',ws:'commercial'},
      {sn:1,sname:'Pre-Sales Engagement',name:'Mutual NDA Form',desc:'GXO NDA template preferred',ws:'commercial'},
      {sn:1,sname:'Pre-Sales Engagement',name:'SCAN Documents',desc:'Required documents must be fully and effectively completed',ws:'commercial'},
      {sn:1,sname:'Pre-Sales Engagement',name:'Client RFP Files',desc:'Files must be uploaded to SCAN SharePoint',ws:'commercial'},
      {sn:2,sname:'Deal Qualification',name:'Solution Lead Assignment',desc:'Solutions Lead assignment',ws:'solutions'},
      {sn:2,sname:'Deal Qualification',name:'Solutions Qualification Template',desc:'Solutions Lead completes the SQ Template',ws:'solutions'},
      {sn:2,sname:'Deal Qualification',name:'Solutions Qualifications Meeting',desc:'Attendees include Solutions Lead, Solutions Leader, Division President, Commercial Lead, Sales Leader',ws:'solutions'},
      {sn:2,sname:'Deal Qualification',name:'Engineering Lead Assignment',desc:'Engineering Lead Assignment',ws:'engineering'},
      {sn:2,sname:'Deal Qualification',name:'Response Timeline',desc:'Must obtain Pursuit Team alignment on timeline',ws:'solutions'},
      {sn:2,sname:'Deal Qualification',name:'Solutions Qualification Deck',desc:'Includes Win Strategy, Value Prop Goals, Solution Architecture, and Pursuit Plan',ws:'solutions'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Kickoff Meeting',desc:'Attendee list dictated by RoE',ws:'solutions'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Engage SME Support',desc:'As dictated by RoE',ws:'solutions'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Solution Design Concept Meeting',desc:'Attendee list dictated by RoE',ws:'solutions'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Engineering Review Meeting',desc:'Attendee list dictated by RoE',ws:'engineering'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Cost Model Review Meeting',desc:'Attendee list dictated by RoE',ws:'solutions'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Site Visits',desc:'Should perform site visits whenever feasible',ws:'solutions'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Data Request Template',desc:'To be provided to customer if sufficient data is not available to develop solution',ws:'solutions'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Data Analysis',desc:'Use appropriate template (i.e., Rd 1, Rd 2, existing)',ws:'engineering'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Material Flow Diagram',desc:'Engineering-developed material flow analysis',ws:'engineering'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Labor Model',desc:'Utilization of MOST or existing site UPHs',ws:'engineering'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Engineering Workbook',desc:'Engineering analysis and specifications workbook',ws:'engineering'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Conceptual Layout (ROM)',desc:'Rough order of magnitude facility layout',ws:'engineering'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Customer Pricing Template',desc:'QA check to be performed by Pricing once Solutions have linked Cost Models to Customer Pricing Template',ws:'solutions'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Cost Model',desc:'Solutions leads development of Cost Model with inputs from key workstreams',ws:'solutions'},
      {sn:3,sname:'Kick-Off & Solution Design',name:'Implementation Timeline',desc:'Utilization of template in ROM rounds',ws:'solutions'},
      {sn:4,sname:'Operations Review',name:'Operations Review',desc:'PowerPoint-driven meeting conducted virtually or F2F if RoE requires it',ws:'solutions'},
      {sn:4,sname:'Operations Review',name:'PMO Timeline Draft',desc:'PMO-developed timeline that takes template timeline a level lower',ws:'solutions'},
      {sn:5,sname:'Executive Review',name:'Obtain ELT Approvals',desc:'PowerAutomate Email workflow for executive approvals',ws:'finance_pricing'},
      {sn:5,sname:'Executive Review',name:'Present Solution to Customer Decision Maker',desc:'Customer-facing presentation of proposed solution',ws:'solutions'},
      {sn:5,sname:'Executive Review',name:'Proposal Response',desc:'Formal proposal response document',ws:'commercial_lead'},
      {sn:5,sname:'Executive Review',name:'Prepare Presentation',desc:'Executive presentation preparation',ws:'commercial_lead'},
      {sn:5,sname:'Executive Review',name:'Risk Assessment',desc:'Solution and commercial risk assessment',ws:'solutions'},
      {sn:6,sname:'Delivery Handover',name:'Legal Review T&Cs',desc:'Legal review of terms and conditions',ws:'legal'},
      {sn:6,sname:'Delivery Handover',name:'Internal Planning Session (IPS)',desc:'Internal planning session for delivery preparation',ws:'solutions'},
      {sn:6,sname:'Delivery Handover',name:'Joint Planning Session (JPS)',desc:'Joint planning session with customer',ws:'solutions'},
      {sn:6,sname:'Delivery Handover',name:'Sign LOI',desc:'Letter of Intent execution',ws:'elt'},
      {sn:6,sname:'Delivery Handover',name:'Submit PAF',desc:'Project Approval Form submission',ws:'finance_pricing'},
      {sn:6,sname:'Delivery Handover',name:'Complete Development of Concept of Design (CoD)',desc:'Full Concept of Design document for implementation handoff',ws:'solutions'}
    ];

    // Filter to selected stages
    var templates = DOS_TEMPLATES.filter(function(t){ return selectedStages.indexOf(t.sn) !== -1; });

    if (templates.length === 0) { pmToast('No templates found for selected stages.', 'warning'); return; }

    // Get current max sort_order for this opportunity's tasks
    var existingTasks = pmData.tasks.filter(function(t){ return t.opportunity_id == pmCurrentOpp.id; });
    var maxSort = existingTasks.reduce(function(m,t){ return Math.max(m, t.sort_order||0); }, 0);

    // Build task rows
    var rows = templates.map(function(t, idx) {
      return {
        opportunity_id: pmCurrentOpp.id,
        title: t.name,
        description: t.desc || '',
        assignee: null,
        priority: 'medium',
        status: 'todo',
        sort_order: maxSort + idx + 1,
        dos_stage_number: t.sn,
        dos_stage_name: t.sname
      };
    });

    // Insert all at once
    var res = await sb.from('opportunity_tasks').insert(rows);
    if (res.error) throw res.error;

    // Close modal, reload
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
    pmShowDetailTab('tasks', document.querySelectorAll('#pm-detail .pm-tab')[1]);

    pmToast(templates.length + ' stage activities added as tasks.', 'success');
  } catch(e) {
    console.error('DOS populate error:', e);
    pmToast('Error populating activities: ' + e.message, 'error');
  }
}

function pmToast(message, type) {
  var bg = type === 'success' ? 'var(--ies-green,#10b981)' : type === 'error' ? 'var(--ies-red,#ef4444)' : 'var(--ies-navy,#1c1c2e)';
  var toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:' + bg + ';color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.25);transition:opacity .3s;font-family:Montserrat,sans-serif;';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; setTimeout(function() { toast.remove(); }, 300); }, 3000);
}

// Global toast utility (used by mostApp and other tools)
function showToast(message, type) { pmToast(message, type); }

function pmEditTask(taskId) {
  var t = pmData.tasks.find(function(x){ return x.id == taskId; });
  if (!t) return;
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title">Edit Task</div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Title</label><input type="text" class="pm-form-input" id="pm-edittask-title" value="' + esc(t.title||'') + '"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Description</label><textarea class="pm-form-input" id="pm-edittask-desc" rows="2">' + esc(t.description||'') + '</textarea></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Assignee</label><input type="text" class="pm-form-input" id="pm-edittask-assignee" value="' + esc(t.assignee||'') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Status</label><select class="pm-form-input" id="pm-edittask-status">';
  ['todo','in_progress','done','blocked'].forEach(function(s){ html += '<option value="'+s+'"'+(s===t.status?' selected':'')+'>'+s.replace(/_/g,' ')+'</option>'; });
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Priority</label><select class="pm-form-input" id="pm-edittask-priority">';
  ['low','medium','high','critical'].forEach(function(p){ html += '<option value="'+p+'"'+(p===t.priority?' selected':'')+'>'+p+'</option>'; });
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Due Date</label><input type="date" class="pm-form-input" id="pm-edittask-due" value="' + (t.due_date||'') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Estimated Hours</label><input type="number" class="pm-form-input" id="pm-edittask-est" min="0" step="0.5" value="' + (t.estimated_hours||'') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Actual Hours</label><input type="number" class="pm-form-input" id="pm-edittask-act" min="0" step="0.5" value="' + (t.actual_hours||'') + '"></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveEditTask('+t.id+')">Save Changes</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveEditTask(taskId) {
  if (!sb) return;
  try {
    var updates = {
      title: document.getElementById('pm-edittask-title').value.trim(),
      description: document.getElementById('pm-edittask-desc').value.trim() || null,
      assignee: document.getElementById('pm-edittask-assignee').value.trim() || null,
      status: document.getElementById('pm-edittask-status').value,
      priority: document.getElementById('pm-edittask-priority').value,
      due_date: document.getElementById('pm-edittask-due').value || null,
      estimated_hours: parseFloat(document.getElementById('pm-edittask-est').value) || null,
      actual_hours: parseFloat(document.getElementById('pm-edittask-act').value) || null
    };
    var res = await sb.from('opportunity_tasks').update(updates).eq('id', taskId);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
    pmShowDetailTab('tasks', document.querySelectorAll('#pm-detail .pm-tab')[1]);
  } catch(e) { alert('Error updating task: ' + e.message); }
}

async function pmDeleteTask(taskId) {
  if (!sb) return;
  if (!confirm('Delete this task?')) return;
  try {
    var res = await sb.from('opportunity_tasks').delete().eq('id', taskId);
    if (res.error) throw res.error;
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
    pmShowDetailTab('tasks', document.querySelectorAll('#pm-detail .pm-tab')[1]);
  } catch(e) { alert('Error deleting task: ' + e.message); }
}

function pmRenderTaskSummary() {
  if (!pmCurrentOpp) return;
  var tasks = pmData.tasks.filter(function(t){ return t.opportunity_id == pmCurrentOpp.id; });
  var bar = document.getElementById('pm-task-summary-bar');
  if (!bar) return;
  if (tasks.length === 0) {
    bar.innerHTML = '<div style="color:var(--ies-gray-400);font-size:13px;">No tasks created yet.</div>';
    return;
  }
  var counts = { todo:0, in_progress:0, done:0, blocked:0 };
  tasks.forEach(function(t){ counts[t.status] = (counts[t.status]||0) + 1; });
  var total = tasks.length;
  var pctDone = Math.round((counts.done / total) * 100);
  var pctInProg = Math.round((counts.in_progress / total) * 100);
  var pctBlocked = Math.round((counts.blocked / total) * 100);
  var pctTodo = 100 - pctDone - pctInProg - pctBlocked;

  var html = '<div style="display:flex;gap:16px;margin-bottom:12px;">';
  html += '<span style="font-size:12px;color:var(--ies-gray-400);"><strong style="color:var(--ies-navy);">' + counts.done + '</strong> done</span>';
  html += '<span style="font-size:12px;color:var(--ies-gray-400);"><strong style="color:var(--ies-blue);">' + counts.in_progress + '</strong> in progress</span>';
  html += '<span style="font-size:12px;color:var(--ies-gray-400);"><strong style="color:var(--ies-gray-600);">' + counts.todo + '</strong> to do</span>';
  if (counts.blocked > 0) html += '<span style="font-size:12px;color:var(--ies-gray-400);"><strong style="color:var(--ies-red);">' + counts.blocked + '</strong> blocked</span>';
  html += '</div>';
  html += '<div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--ies-gray-100);">';
  if (pctDone > 0) html += '<div style="width:'+pctDone+'%;background:var(--ies-green);"></div>';
  if (pctInProg > 0) html += '<div style="width:'+pctInProg+'%;background:var(--ies-blue);"></div>';
  if (pctBlocked > 0) html += '<div style="width:'+pctBlocked+'%;background:var(--ies-red);"></div>';
  if (pctTodo > 0) html += '<div style="width:'+pctTodo+'%;background:var(--ies-gray-200);"></div>';
  html += '</div>';
  html += '<div style="text-align:center;font-size:11px;color:var(--ies-gray-400);margin-top:6px;">' + pctDone + '% complete (' + counts.done + '/' + total + ' tasks)</div>';
  bar.innerHTML = html;
}

// ── SECTION SWITCHING (Pipeline vs Timesheet) ──
var pmCurrentSection = 'pipeline';
function pmShowSection(section, tabEl) {
  pmCurrentSection = section;
  document.querySelectorAll('#pm-section-tabs .pm-tab').forEach(function(t){ t.classList.remove('active'); });
  if (tabEl) tabEl.classList.add('active');
  document.getElementById('pm-section-pipeline').style.display = section === 'pipeline' ? 'block' : 'none';
  document.getElementById('pm-section-timesheet').style.display = section === 'timesheet' ? 'block' : 'none';
  if (section === 'timesheet') {
    pmPopulateTimesheetResources();
    pmRenderTimesheet();
  }
}

// ── TIMESHEET ──
var pmTimesheetWeek = null; // Date object for current Monday
var PM_GENERAL_CATEGORIES = ['admin','training','pto','travel','internal_meeting','business_development','mentoring','tool_development','other'];
var PM_GENERAL_CAT_LABELS = {
  admin:'Admin', training:'Training', pto:'PTO', travel:'Travel',
  internal_meeting:'Internal Meeting', business_development:'Business Dev',
  mentoring:'Mentoring', tool_development:'Tool Development', other:'Other'
};

function pmGetCurrentMonday() {
  var now = new Date();
  var day = now.getDay();
  var diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff);
}

function pmTimesheetNav(dir) {
  if (!pmTimesheetWeek) pmTimesheetWeek = pmGetCurrentMonday();
  pmTimesheetWeek = new Date(pmTimesheetWeek.getTime() + dir * 7 * 86400000);
  pmRenderTimesheet();
}

function pmTimesheetToday() {
  pmTimesheetWeek = pmGetCurrentMonday();
  pmRenderTimesheet();
}

function pmPopulateTimesheetResources() {
  // Gather all unique resources from project_hours and general_hours
  var resources = {};
  pmData.hours.forEach(function(h){ if(h.resource) resources[h.resource] = true; });
  pmData.generalHours.forEach(function(h){ if(h.resource) resources[h.resource] = true; });
  if (!resources['Brock Eckles']) resources['Brock Eckles'] = true;
  var sel = document.getElementById('pm-ts-resource');
  if (!sel) return;
  var current = sel.value || 'Brock Eckles';
  var html = '';
  Object.keys(resources).sort().forEach(function(r){
    html += '<option value="'+r+'"'+(r===current?' selected':'')+'>'+r+'</option>';
  });
  sel.innerHTML = html;
}

function pmRenderTimesheet() {
  if (!pmTimesheetWeek) pmTimesheetWeek = pmGetCurrentMonday();
  var monday = pmTimesheetWeek;
  var weekStr = monday.toISOString().split('T')[0];
  var resource = (document.getElementById('pm-ts-resource') || {}).value || 'Brock Eckles';

  // Update week label
  var weekEnd = new Date(monday.getTime() + 4 * 86400000);
  var label = monday.toLocaleDateString('en-US', {month:'short', day:'numeric'}) + ' – ' + weekEnd.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
  document.getElementById('pm-ts-week-label').textContent = 'Week of ' + label;

  // Filter project hours for this resource and week, split by category
  var allProjHrs = pmData.hours.filter(function(h){ return h.resource === resource && h.week_start === weekStr; });
  var projForecast = allProjHrs.filter(function(h){ return h.category === 'forecast'; });
  var projActual = allProjHrs.filter(function(h){ return h.category === 'actual'; });

  // Filter general hours, split by hours_category
  var allGenHrs = pmData.generalHours.filter(function(h){ return h.resource === resource && h.week_start === weekStr; });
  var genForecast = allGenHrs.filter(function(h){ return h.hours_category === 'forecast'; });
  var genActual = allGenHrs.filter(function(h){ return h.hours_category === 'actual'; });

  // Helper: render a project hours section
  function renderProjSection(rows, prefix) {
    var body = document.getElementById('pm-ts-'+prefix+'-body');
    var foot = document.getElementById('pm-ts-'+prefix+'-foot');
    var empty = document.getElementById('pm-ts-'+prefix+'-empty');
    var table = document.getElementById('pm-ts-'+prefix+'-table');
    if (rows.length === 0) {
      body.innerHTML = ''; foot.innerHTML = '';
      table.style.display = 'none'; empty.style.display = 'block';
    } else {
      table.style.display = ''; empty.style.display = 'none';
      var html = '', total = 0;
      rows.forEach(function(h){
        var opp = pmData.opportunities.find(function(o){ return o.id == h.opportunity_id; });
        var oppName = opp ? opp.name : 'Unknown';
        total += Number(h.hours || 0);
        html += '<tr>';
        html += '<td style="font-weight:600;">' + oppName + '</td>';
        html += '<td style="text-transform:capitalize;">' + (h.hours_type||'').replace(/_/g,' ') + '</td>';
        html += '<td style="text-align:right;font-weight:600;">' + Number(h.hours).toFixed(1) + '</td>';
        html += '<td style="font-size:12px;color:var(--ies-gray-400);">' + (h.notes || '—') + '</td>';
        html += '<td style="text-align:right;"><button class="pm-btn pm-btn-outline pm-btn-sm" onclick="pmDeleteProjectHoursRow('+h.id+')" style="padding:4px 8px;font-size:11px;color:var(--ies-red);border-color:var(--ies-red);">×</button></td>';
        html += '</tr>';
      });
      body.innerHTML = html;
      foot.innerHTML = '<tr style="background:var(--ies-gray-50);font-weight:700;"><td colspan="2">Total</td><td style="text-align:right;">' + total.toFixed(1) + '</td><td></td><td></td></tr>';
    }
  }

  // Helper: render a general hours section
  function renderGenSection(rows, prefix) {
    var body = document.getElementById('pm-ts-'+prefix+'-body');
    var foot = document.getElementById('pm-ts-'+prefix+'-foot');
    var empty = document.getElementById('pm-ts-'+prefix+'-empty');
    var table = document.getElementById('pm-ts-'+prefix+'-table');
    if (rows.length === 0) {
      body.innerHTML = ''; foot.innerHTML = '';
      table.style.display = 'none'; empty.style.display = 'block';
    } else {
      table.style.display = ''; empty.style.display = 'none';
      var html = '', total = 0;
      rows.forEach(function(h){
        total += Number(h.hours || 0);
        html += '<tr>';
        html += '<td style="font-weight:600;text-transform:capitalize;">' + (PM_GENERAL_CAT_LABELS[h.category] || h.category) + '</td>';
        html += '<td style="text-align:right;font-weight:600;">' + Number(h.hours).toFixed(1) + '</td>';
        html += '<td style="font-size:12px;color:var(--ies-gray-400);">' + (h.notes || '—') + '</td>';
        html += '<td style="text-align:right;"><button class="pm-btn pm-btn-outline pm-btn-sm" onclick="pmDeleteGeneralHours('+h.id+')" style="padding:4px 8px;font-size:11px;color:var(--ies-red);border-color:var(--ies-red);">×</button></td>';
        html += '</tr>';
      });
      body.innerHTML = html;
      foot.innerHTML = '<tr style="background:var(--ies-gray-50);font-weight:700;"><td>Total</td><td style="text-align:right;">' + total.toFixed(1) + '</td><td></td><td></td></tr>';
    }
  }

  renderProjSection(projForecast, 'proj-forecast');
  renderProjSection(projActual, 'proj-actual');
  renderGenSection(genForecast, 'gen-forecast');
  renderGenSection(genActual, 'gen-actual');

  // Stats — compute forecast and actual totals
  var projFcTotal = projForecast.reduce(function(s,h){ return s + Number(h.hours||0); }, 0);
  var projActTotal = projActual.reduce(function(s,h){ return s + Number(h.hours||0); }, 0);
  var genFcTotal = genForecast.reduce(function(s,h){ return s + Number(h.hours||0); }, 0);
  var genActTotal = genActual.reduce(function(s,h){ return s + Number(h.hours||0); }, 0);
  var totalFc = projFcTotal + genFcTotal;
  var totalAct = projActTotal + genActTotal;
  document.getElementById('pm-ts-project-hrs').innerHTML = projActTotal.toFixed(1) + '<span style="font-size:11px;color:var(--ies-gray-400);font-weight:400;"> / ' + projFcTotal.toFixed(1) + ' fc</span>';
  document.getElementById('pm-ts-general-hrs').innerHTML = genActTotal.toFixed(1) + '<span style="font-size:11px;color:var(--ies-gray-400);font-weight:400;"> / ' + genFcTotal.toFixed(1) + ' fc</span>';
  document.getElementById('pm-ts-total-hrs').innerHTML = totalAct.toFixed(1) + '<span style="font-size:11px;color:var(--ies-gray-400);font-weight:400;"> / ' + totalFc.toFixed(1) + ' fc</span>';
  document.getElementById('pm-ts-util').textContent = Math.round((totalAct / 40) * 100) + '%';
  document.getElementById('pm-ts-proj-pct').textContent = totalAct > 0 ? Math.round((projActTotal / totalAct) * 100) + '%' : '—';

  // 4-week summary
  pmRender4WeekSummary(resource);
}

function pmRender4WeekSummary(resource) {
  var container = document.getElementById('pm-ts-4week');
  if (!container) return;
  var weeks = [];
  for (var i = 3; i >= 0; i--) {
    var mon = new Date(pmTimesheetWeek.getTime() - i * 7 * 86400000);
    var ws = mon.toISOString().split('T')[0];
    var projFc = pmData.hours.filter(function(h){ return h.resource === resource && h.week_start === ws && h.category === 'forecast'; }).reduce(function(s,h){ return s + Number(h.hours||0); }, 0);
    var projAct = pmData.hours.filter(function(h){ return h.resource === resource && h.week_start === ws && h.category === 'actual'; }).reduce(function(s,h){ return s + Number(h.hours||0); }, 0);
    var genFc = pmData.generalHours.filter(function(h){ return h.resource === resource && h.week_start === ws && h.hours_category === 'forecast'; }).reduce(function(s,h){ return s + Number(h.hours||0); }, 0);
    var genAct = pmData.generalHours.filter(function(h){ return h.resource === resource && h.week_start === ws && (h.hours_category === 'actual' || !h.hours_category); }).reduce(function(s,h){ return s + Number(h.hours||0); }, 0);
    var totalFc = projFc + genFc;
    var totalAct = projAct + genAct;
    weeks.push({ label: mon.toLocaleDateString('en-US',{month:'short',day:'numeric'}), forecast:totalFc, actual:totalAct });
  }
  var maxH = Math.max(40, Math.max.apply(null, weeks.map(function(w){ return Math.max(w.forecast, w.actual); })));
  var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">';
  weeks.forEach(function(w){
    var fcPct = (w.forecast / maxH) * 100;
    var actPct = (w.actual / maxH) * 100;
    var targetLine = (40 / maxH) * 100;
    html += '<div style="text-align:center;">';
    html += '<div style="height:120px;position:relative;display:flex;align-items:flex-end;justify-content:center;gap:4px;margin-bottom:8px;">';
    html += '<div style="position:absolute;bottom:'+targetLine+'%;left:0;right:0;border-top:2px dashed var(--ies-gray-300);z-index:1;"></div>';
    // Forecast bar
    html += '<div style="width:24px;height:'+fcPct+'%;background:var(--ies-blue);opacity:0.4;border-radius:4px 4px 0 0;position:relative;z-index:2;min-height:'+(w.forecast>0?'4px':'0')+';"></div>';
    // Actual bar
    html += '<div style="width:24px;height:'+actPct+'%;background:var(--ies-green);border-radius:4px 4px 0 0;position:relative;z-index:2;min-height:'+(w.actual>0?'4px':'0')+';"></div>';
    html += '</div>';
    html += '<div style="font-size:12px;font-weight:700;color:var(--ies-navy);">' + w.actual.toFixed(1) + 'h</div>';
    html += '<div style="font-size:10px;color:var(--ies-gray-400);">fc: ' + w.forecast.toFixed(1) + 'h</div>';
    html += '<div style="font-size:11px;color:var(--ies-gray-400);">' + w.label + '</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div style="display:flex;gap:16px;justify-content:center;margin-top:12px;">';
  html += '<span style="font-size:11px;color:var(--ies-gray-400);"><span style="display:inline-block;width:10px;height:10px;background:var(--ies-blue);opacity:0.4;border-radius:2px;vertical-align:-1px;margin-right:4px;"></span>Forecast</span>';
  html += '<span style="font-size:11px;color:var(--ies-gray-400);"><span style="display:inline-block;width:10px;height:10px;background:var(--ies-green);border-radius:2px;vertical-align:-1px;margin-right:4px;"></span>Actual</span>';
  html += '<span style="font-size:11px;color:var(--ies-gray-400);"><span style="display:inline-block;width:16px;border-top:2px dashed var(--ies-gray-300);vertical-align:middle;margin-right:4px;"></span>40h Target</span>';
  html += '</div>';
  container.innerHTML = html;
}

// ── TIMESHEET: ADD PROJECT HOURS ──
function pmShowAddProjectHours(hrsCategory) {
  if (!pmTimesheetWeek) pmTimesheetWeek = pmGetCurrentMonday();
  var weekStr = pmTimesheetWeek.toISOString().split('T')[0];
  var resource = (document.getElementById('pm-ts-resource') || {}).value || 'Brock Eckles';
  var isForecast = hrsCategory === 'forecast';
  var tagColor = isForecast ? 'background:rgba(0,71,171,.08);color:var(--ies-blue)' : 'background:rgba(25,135,84,.08);color:var(--ies-green)';
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title" style="display:flex;align-items:center;gap:10px;">Log Project Hours <span class="pm-card-tag" style="'+tagColor+';font-size:11px;font-weight:700;padding:3px 10px;text-transform:uppercase;">'+hrsCategory+'</span></div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group"><label class="pm-form-label">Opportunity</label><select class="pm-form-input" id="pm-tsh-opp">';
  var activeOpps = pmData.opportunities.filter(function(o){ return o.status==='active'; });
  activeOpps.forEach(function(o){ html += '<option value="'+o.id+'">'+o.name+'</option>'; });
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Work Type</label><select class="pm-form-input" id="pm-tsh-type">';
  PM_HOURS_TYPES.forEach(function(t){ html += '<option value="'+t+'" style="text-transform:capitalize;">'+t.replace(/_/g,' ')+'</option>'; });
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Week Starting</label><input type="date" class="pm-form-input" id="pm-tsh-week" value="'+weekStr+'"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Resource</label><input type="text" class="pm-form-input" id="pm-tsh-resource" value="'+resource+'"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Hours</label><input type="number" class="pm-form-input" id="pm-tsh-hours" min="0" step="0.5" value="0"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Notes</label><input type="text" class="pm-form-input" id="pm-tsh-notes" placeholder="Optional description..."></div>';
  html += '</div>';
  html += '<input type="hidden" id="pm-tsh-cat" value="'+hrsCategory+'">';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveProjectHoursTS()">Save Hours</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveProjectHoursTS() {
  if (!sb) return;
  var hours = parseFloat(document.getElementById('pm-tsh-hours').value) || 0;
  if (hours <= 0) { alert('Please enter hours greater than 0.'); return; }
  try {
    var row = {
      opportunity_id: parseInt(document.getElementById('pm-tsh-opp').value),
      week_start: document.getElementById('pm-tsh-week').value,
      hours_type: document.getElementById('pm-tsh-type').value,
      category: document.getElementById('pm-tsh-cat').value,
      hours: hours,
      resource: document.getElementById('pm-tsh-resource').value.trim(),
      notes: document.getElementById('pm-tsh-notes').value.trim() || null
    };
    var res = await sb.from('project_hours').insert(row);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmRenderTimesheet();
  } catch(e) { alert('Error saving hours: ' + e.message); }
}

async function pmDeleteProjectHoursRow(id) {
  if (!sb) return;
  if (!confirm('Delete this hours entry?')) return;
  try {
    var res = await sb.from('project_hours').delete().eq('id', id);
    if (res.error) throw res.error;
    await pmLoadAll();
    pmRenderTimesheet();
  } catch(e) { alert('Error deleting hours: ' + e.message); }
}

// ── TIMESHEET: COPY LAST WEEK (PROJECT) ──
async function pmCopyLastWeekProject(hrsCategory) {
  if (!sb || !pmTimesheetWeek) return;
  var resource = (document.getElementById('pm-ts-resource') || {}).value || 'Brock Eckles';
  var currentWeekStr = pmTimesheetWeek.toISOString().split('T')[0];
  var lastMonday = new Date(pmTimesheetWeek.getTime() - 7 * 86400000);
  var lastWeekStr = lastMonday.toISOString().split('T')[0];

  // Find last week's entries for this resource + category
  var lastWeekRows = pmData.hours.filter(function(h){
    return h.resource === resource && h.week_start === lastWeekStr && h.category === hrsCategory;
  });
  if (lastWeekRows.length === 0) {
    alert('No ' + hrsCategory + ' project hours found for last week (' + lastWeekStr + ').');
    return;
  }
  // Check for existing entries this week to avoid duplicates
  var existingRows = pmData.hours.filter(function(h){
    return h.resource === resource && h.week_start === currentWeekStr && h.category === hrsCategory;
  });
  if (existingRows.length > 0) {
    if (!confirm('There are already ' + existingRows.length + ' ' + hrsCategory + ' project entries this week. Copy ' + lastWeekRows.length + ' entries from last week anyway?')) return;
  } else {
    if (!confirm('Copy ' + lastWeekRows.length + ' ' + hrsCategory + ' project entries from last week?')) return;
  }
  try {
    var inserts = lastWeekRows.map(function(h){
      return {
        opportunity_id: h.opportunity_id,
        week_start: currentWeekStr,
        hours_type: h.hours_type,
        category: h.category,
        hours: h.hours,
        resource: h.resource,
        notes: h.notes
      };
    });
    var res = await sb.from('project_hours').insert(inserts);
    if (res.error) throw res.error;
    await pmLoadAll();
    pmRenderTimesheet();
  } catch(e) { alert('Error copying hours: ' + e.message); }
}

// ── TIMESHEET: ADD GENERAL HOURS ──
function pmShowAddGeneralHours(hrsCategory) {
  if (!pmTimesheetWeek) pmTimesheetWeek = pmGetCurrentMonday();
  var weekStr = pmTimesheetWeek.toISOString().split('T')[0];
  var resource = (document.getElementById('pm-ts-resource') || {}).value || 'Brock Eckles';
  hrsCategory = hrsCategory || 'actual';
  var isForecast = hrsCategory === 'forecast';
  var tagColor = isForecast ? 'background:rgba(0,71,171,.08);color:var(--ies-blue)' : 'background:rgba(25,135,84,.08);color:var(--ies-green)';
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title" style="display:flex;align-items:center;gap:10px;">Log General Hours <span class="pm-card-tag" style="'+tagColor+';font-size:11px;font-weight:700;padding:3px 10px;text-transform:uppercase;">'+hrsCategory+'</span></div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group"><label class="pm-form-label">Week Starting</label><input type="date" class="pm-form-input" id="pm-gen-week" value="'+weekStr+'"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Resource</label><input type="text" class="pm-form-input" id="pm-gen-resource" value="'+resource+'"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Category</label><select class="pm-form-input" id="pm-gen-cat">';
  PM_GENERAL_CATEGORIES.forEach(function(c){ html += '<option value="'+c+'">'+PM_GENERAL_CAT_LABELS[c]+'</option>'; });
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Hours</label><input type="number" class="pm-form-input" id="pm-gen-hours" min="0" step="0.5" value="0"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Notes</label><input type="text" class="pm-form-input" id="pm-gen-notes" placeholder="Optional description..."></div>';
  html += '</div>';
  html += '<input type="hidden" id="pm-gen-hrscat" value="'+hrsCategory+'">';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveGeneralHours()">Save Hours</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveGeneralHours() {
  if (!sb) return;
  var hours = parseFloat(document.getElementById('pm-gen-hours').value) || 0;
  if (hours <= 0) { alert('Please enter hours greater than 0.'); return; }
  try {
    var row = {
      resource: document.getElementById('pm-gen-resource').value.trim(),
      week_start: document.getElementById('pm-gen-week').value,
      category: document.getElementById('pm-gen-cat').value,
      hours: hours,
      hours_category: document.getElementById('pm-gen-hrscat').value,
      notes: document.getElementById('pm-gen-notes').value.trim() || null
    };
    var res = await sb.from('general_hours').insert(row);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmRenderTimesheet();
  } catch(e) { alert('Error saving hours: ' + e.message); }
}

async function pmDeleteGeneralHours(id) {
  if (!sb) return;
  if (!confirm('Delete this hours entry?')) return;
  try {
    var res = await sb.from('general_hours').delete().eq('id', id);
    if (res.error) throw res.error;
    await pmLoadAll();
    pmRenderTimesheet();
  } catch(e) { alert('Error deleting hours: ' + e.message); }
}

// ── TIMESHEET: COPY LAST WEEK (GENERAL) ──
async function pmCopyLastWeekGeneral(hrsCategory) {
  if (!sb || !pmTimesheetWeek) return;
  var resource = (document.getElementById('pm-ts-resource') || {}).value || 'Brock Eckles';
  var currentWeekStr = pmTimesheetWeek.toISOString().split('T')[0];
  var lastMonday = new Date(pmTimesheetWeek.getTime() - 7 * 86400000);
  var lastWeekStr = lastMonday.toISOString().split('T')[0];

  var lastWeekRows = pmData.generalHours.filter(function(h){
    return h.resource === resource && h.week_start === lastWeekStr && h.hours_category === hrsCategory;
  });
  if (lastWeekRows.length === 0) {
    alert('No ' + hrsCategory + ' general hours found for last week (' + lastWeekStr + ').');
    return;
  }
  var existingRows = pmData.generalHours.filter(function(h){
    return h.resource === resource && h.week_start === currentWeekStr && h.hours_category === hrsCategory;
  });
  if (existingRows.length > 0) {
    if (!confirm('There are already ' + existingRows.length + ' ' + hrsCategory + ' general entries this week. Copy ' + lastWeekRows.length + ' entries from last week anyway?')) return;
  } else {
    if (!confirm('Copy ' + lastWeekRows.length + ' ' + hrsCategory + ' general entries from last week?')) return;
  }
  try {
    var inserts = lastWeekRows.map(function(h){
      return {
        resource: h.resource,
        week_start: currentWeekStr,
        category: h.category,
        hours_category: hrsCategory,
        hours: h.hours,
        notes: h.notes
      };
    });
    var res = await sb.from('general_hours').insert(inserts);
    if (res.error) throw res.error;
    await pmLoadAll();
    pmRenderTimesheet();
  } catch(e) { alert('Error copying hours: ' + e.message); }
}

// ── WIN STRATEGY ──
function pmRenderWinStrategy() {
  if (!pmCurrentOpp) return;
  var o = pmCurrentOpp;
  var card = document.getElementById('pm-win-strategy-card');
  var container = document.getElementById('pm-win-strategy-content');
  if (!container) return;
  // Hide card if no strategy data at all
  var hasData = o.win_strategy || o.differentiators || o.risks || o.competitive_position || o.pricing_strategy;
  if (!hasData) {
    container.innerHTML = '<div style="color:var(--ies-gray-400);font-size:13px;">No win strategy defined yet. Click "Edit Strategy" to add one.</div>';
    return;
  }
  var sections = [
    { label:'Strategy', value:o.win_strategy, color:'var(--ies-blue)' },
    { label:'Differentiators', value:o.differentiators, color:'var(--ies-green)' },
    { label:'Competitive Position', value:o.competitive_position, color:'var(--ies-navy)' },
    { label:'Risks', value:o.risks, color:'var(--ies-red)' },
    { label:'Pricing Strategy', value:o.pricing_strategy, color:'#b38600' }
  ];
  var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
  sections.forEach(function(sec, i){
    if (!sec.value) return;
    var fullWidth = (i === 0) ? ' style="grid-column:1/-1;"' : '';
    html += '<div class="pm-strategy-section"' + fullWidth + '>';
    html += '<div class="pm-strategy-label" style="color:' + sec.color + ';">' + sec.label + '</div>';
    html += '<div class="pm-strategy-text">' + sec.value + '</div>';
    html += '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

function pmEditWinStrategy() {
  if (!pmCurrentOpp) return;
  var o = pmCurrentOpp;
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal" style="max-width:680px;">';
  html += '<div class="pm-modal-title">Edit Win Strategy</div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Win Strategy</label><textarea class="pm-form-input" id="pm-ws-strategy" rows="3" placeholder="How do we win this deal? Key positioning and approach...">' + (o.win_strategy||'') + '</textarea></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Differentiators</label><textarea class="pm-form-input" id="pm-ws-diff" rows="3" placeholder="What makes GXO the best choice? Unique capabilities...">' + (o.differentiators||'') + '</textarea></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Competitive Position</label><textarea class="pm-form-input" id="pm-ws-comp" rows="2" placeholder="Where do we stand vs. competitors? Who else is bidding?">' + (o.competitive_position||'') + '</textarea></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Risks</label><textarea class="pm-form-input" id="pm-ws-risks" rows="2" placeholder="What could go wrong? Key concerns or blockers...">' + (o.risks||'') + '</textarea></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Pricing Strategy</label><textarea class="pm-form-input" id="pm-ws-pricing" rows="2" placeholder="Pricing approach, cost structure, gainshare models...">' + (o.pricing_strategy||'') + '</textarea></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveWinStrategy()">Save Strategy</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveWinStrategy() {
  if (!sb || !pmCurrentOpp) return;
  try {
    var updates = {
      win_strategy: document.getElementById('pm-ws-strategy').value.trim() || null,
      differentiators: document.getElementById('pm-ws-diff').value.trim() || null,
      competitive_position: document.getElementById('pm-ws-comp').value.trim() || null,
      risks: document.getElementById('pm-ws-risks').value.trim() || null,
      pricing_strategy: document.getElementById('pm-ws-pricing').value.trim() || null
    };
    var res = await sb.from('opportunities').update(updates).eq('id', pmCurrentOpp.id);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
  } catch(e) { alert('Error saving strategy: ' + e.message); }
}

// ── NEW / EDIT OPPORTUNITY ──
function pmShowNewOpportunity() {
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title">New Opportunity</div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Customer</label><select class="pm-form-input" id="pm-opp-customer">';
  if (pmData.customers.length === 0) {
    html += '<option value="">— No customers yet —</option>';
  } else {
    pmData.customers.forEach(function(c){ html += '<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>'; });
  }
  html += '</select>';
  html += '<div style="margin-top:6px;"><a href="#" onclick="event.preventDefault();document.getElementById(\'pm-modal-container\').innerHTML=\'\';pmShowNewCustomer(true);" style="font-size:12px;color:var(--ies-blue);font-weight:600;">+ Add New Customer</a></div>';
  html += '</div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Opportunity Name</label><input type="text" class="pm-form-input" id="pm-opp-name" placeholder="e.g. Southeast Distribution Center RFP"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Stage</label><select class="pm-form-input" id="pm-opp-stage">';
  PM_STAGES.forEach(function(s){ html += '<option value="'+s.key+'"' + (s.key==='pre_sales'?' selected':'') + '>'+s.label+'</option>'; });
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Status</label><select class="pm-form-input" id="pm-opp-status">';
  html += '<option value="active">Active</option><option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>';
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Facility Type</label><input type="text" class="pm-form-input" id="pm-opp-facility" placeholder="e.g. Cold Storage, MFC, Cross-Dock"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Total Sqft</label><input type="number" class="pm-form-input" id="pm-opp-sqft" placeholder="e.g. 500000"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">State</label><input type="text" class="pm-form-input" id="pm-opp-state" placeholder="e.g. GA, TN, NY"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Due Date</label><input type="date" class="pm-form-input" id="pm-opp-due"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Solutions Lead</label><input type="text" class="pm-form-input" id="pm-opp-slead" value="Brock Eckles"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Engineering Lead</label><input type="text" class="pm-form-input" id="pm-opp-elead" placeholder="e.g. Chris Barber"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Notes</label><textarea class="pm-form-input" id="pm-opp-notes" rows="3" placeholder="Any additional context..."></textarea></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveNewOpportunity()">Create Opportunity</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveNewOpportunity() {
  if (!sb) return;
  var custId = document.getElementById('pm-opp-customer').value;
  var name = document.getElementById('pm-opp-name').value.trim();
  if (!custId) { alert('Please select a customer.'); return; }
  if (!name) { alert('Please enter an opportunity name.'); return; }
  try {
    var row = {
      customer_id: custId,
      name: name,
      stage: document.getElementById('pm-opp-stage').value,
      status: document.getElementById('pm-opp-status').value,
      facility_type: document.getElementById('pm-opp-facility').value.trim() || null,
      total_sqft: parseInt(document.getElementById('pm-opp-sqft').value) || null,
      state: document.getElementById('pm-opp-state').value.trim() || null,
      due_date: document.getElementById('pm-opp-due').value || null,
      solutions_lead: document.getElementById('pm-opp-slead').value.trim() || null,
      engineering_lead: document.getElementById('pm-opp-elead').value.trim() || null,
      notes: document.getElementById('pm-opp-notes').value.trim() || null
    };
    var res = await sb.from('opportunities').insert(row);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
  } catch(e) { alert('Error creating opportunity: ' + e.message); }
}

function pmEditOpportunity() {
  if (!pmCurrentOpp) return;
  var o = pmCurrentOpp;
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title">Edit Opportunity</div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Opportunity Name</label><input type="text" class="pm-form-input" id="pm-edit-name" value="' + esc(o.name||'') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Stage</label><select class="pm-form-input" id="pm-edit-stage">';
  PM_STAGES.forEach(function(s){ html += '<option value="'+s.key+'"' + (s.key===o.stage?' selected':'') + '>'+s.label+'</option>'; });
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Status</label><select class="pm-form-input" id="pm-edit-status">';
  ['active','on_hold','completed','cancelled'].forEach(function(st){
    html += '<option value="'+st+'"' + (st===o.status?' selected':'') + '>'+st.replace(/_/g,' ')+'</option>';
  });
  html += '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Facility Type</label><input type="text" class="pm-form-input" id="pm-edit-facility" value="' + esc(o.facility_type||'') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Total Sqft</label><input type="number" class="pm-form-input" id="pm-edit-sqft" value="' + esc(o.total_sqft||'') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">State</label><input type="text" class="pm-form-input" id="pm-edit-state" value="' + esc(o.state||'') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Due Date</label><input type="date" class="pm-form-input" id="pm-edit-due" value="' + esc(o.due_date||'') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Solutions Lead</label><input type="text" class="pm-form-input" id="pm-edit-slead" value="' + esc(o.solutions_lead||'') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Engineering Lead</label><input type="text" class="pm-form-input" id="pm-edit-elead" value="' + esc(o.engineering_lead||'') + '"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Notes</label><textarea class="pm-form-input" id="pm-edit-notes" rows="3">' + esc(o.notes||'') + '</textarea></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove()">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveEditOpportunity()">Save Changes</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveEditOpportunity() {
  if (!sb || !pmCurrentOpp) return;
  try {
    var updates = {
      name: document.getElementById('pm-edit-name').value.trim(),
      stage: document.getElementById('pm-edit-stage').value,
      status: document.getElementById('pm-edit-status').value,
      facility_type: document.getElementById('pm-edit-facility').value.trim() || null,
      total_sqft: parseInt(document.getElementById('pm-edit-sqft').value) || null,
      state: document.getElementById('pm-edit-state').value.trim() || null,
      due_date: document.getElementById('pm-edit-due').value || null,
      solutions_lead: document.getElementById('pm-edit-slead').value.trim() || null,
      engineering_lead: document.getElementById('pm-edit-elead').value.trim() || null,
      notes: document.getElementById('pm-edit-notes').value.trim() || null
    };
    var res = await sb.from('opportunities').update(updates).eq('id', pmCurrentOpp.id);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmOpenDetail(pmCurrentOpp.id);
  } catch(e) { alert('Error updating opportunity: ' + e.message); }
}

async function pmDeleteOpportunity() {
  if (!sb || !pmCurrentOpp) return;
  if (!confirm('Delete "' + pmCurrentOpp.name + '"? This will also delete all associated hours and updates.')) return;
  try {
    // Delete children first
    await sb.from('project_hours').delete().eq('opportunity_id', pmCurrentOpp.id);
    await sb.from('project_updates').delete().eq('opportunity_id', pmCurrentOpp.id);
    var res = await sb.from('opportunities').delete().eq('id', pmCurrentOpp.id);
    if (res.error) throw res.error;
    pmCurrentOpp = null;
    document.getElementById('pm-detail').classList.remove('active');
    document.getElementById('pm-stats').style.display = '';
    document.querySelector('#sec-deals .pm-toolbar').style.display = '';
    document.getElementById('pm-pipeline-view').style.display = 'block';
    await pmLoadAll();
  } catch(e) { alert('Error deleting opportunity: ' + e.message); }
}

// ── CUSTOMER MANAGEMENT ──
function pmShowCustomers() {
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal" style="max-width:640px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">';
  html += '<div class="pm-modal-title" style="margin-bottom:0;">Customers</div>';
  html += '<button class="pm-btn pm-btn-primary pm-btn-sm" onclick="pmShowNewCustomer(false)">+ Add Customer</button>';
  html += '</div>';
  html += '<div id="pm-customer-list">';
  if (pmData.customers.length === 0) {
    html += '<div class="pm-empty"><div style="font-size:14px;font-weight:600;">No customers yet</div><div style="font-size:12px;">Click "Add Customer" to create your first customer record.</div></div>';
  } else {
    pmData.customers.forEach(function(c){
      var oppCount = pmData.opportunities.filter(function(o){ return o.customer_id === c.id; }).length;
      html += '<div style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid var(--ies-gray-100);">';
      html += '<div style="flex:1;"><div style="font-weight:700;color:var(--ies-navy);font-size:14px;">' + c.name + '</div>';
      if (c.vertical) html += '<div style="font-size:12px;color:var(--ies-gray-400);text-transform:capitalize;">' + c.vertical.replace(/_/g,' ') + '</div>';
      html += '</div>';
      html += '<span style="font-size:12px;color:var(--ies-gray-400);margin-right:16px;">' + oppCount + ' opp' + (oppCount!==1?'s':'') + '</span>';
      html += '<button class="pm-btn pm-btn-outline pm-btn-sm" onclick="pmEditCustomer(\''+c.id+'\')" style="margin-right:6px;padding:4px 10px;font-size:11px;">Edit</button>';
      html += '<button class="pm-btn pm-btn-outline pm-btn-sm" onclick="pmDeleteCustomer(\''+c.id+'\')" style="padding:4px 10px;font-size:11px;color:var(--ies-red);border-color:var(--ies-red);">×</button>';
      html += '</div>';
    });
  }
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

function pmShowNewCustomer(returnToOpp) {
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title">New Customer</div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Customer Name</label><input type="text" class="pm-form-input" id="pm-cust-name" placeholder="e.g. Acme Corp"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Vertical</label><select class="pm-form-input" id="pm-cust-vertical">' + getVerticalOptions('') + '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Contact</label><input type="text" class="pm-form-input" id="pm-cust-contact" placeholder="e.g. Jane Smith"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Notes</label><textarea class="pm-form-input" id="pm-cust-notes" rows="2" placeholder="Any notes about this customer..."></textarea></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove();' + (returnToOpp ? 'pmShowNewOpportunity();' : 'pmShowCustomers();') + '">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveNewCustomer(' + returnToOpp + ')">Create Customer</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveNewCustomer(returnToOpp) {
  if (!sb) return;
  var name = document.getElementById('pm-cust-name').value.trim();
  if (!name) { alert('Please enter a customer name.'); return; }
  try {
    var row = {
      name: name,
      vertical: document.getElementById('pm-cust-vertical').value || null,
      primary_contact: document.getElementById('pm-cust-contact').value.trim() || null,
      notes: document.getElementById('pm-cust-notes').value.trim() || null
    };
    var res = await sb.from('customers').insert(row);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    if (returnToOpp) pmShowNewOpportunity();
    else pmShowCustomers();
  } catch(e) { alert('Error creating customer: ' + e.message); }
}

function pmEditCustomer(id) {
  var c = pmData.customers.find(function(x){ return String(x.id) === String(id); });
  if (!c) return;
  var html = '<div class="pm-modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="pm-modal">';
  html += '<div class="pm-modal-title">Edit Customer</div>';
  html += '<div class="pm-form-grid">';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Customer Name</label><input type="text" class="pm-form-input" id="pm-editcust-name" value="' + (c.name||'').replace(/"/g,'&quot;') + '"></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Vertical</label><select class="pm-form-input" id="pm-editcust-vertical">' + getVerticalOptions(c.vertical) + '</select></div>';
  html += '<div class="pm-form-group"><label class="pm-form-label">Contact</label><input type="text" class="pm-form-input" id="pm-editcust-contact" value="' + (c.primary_contact||'').replace(/"/g,'&quot;') + '"></div>';
  html += '<div class="pm-form-group full"><label class="pm-form-label">Notes</label><textarea class="pm-form-input" id="pm-editcust-notes" rows="2">' + (c.notes||'') + '</textarea></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">';
  html += '<button class="pm-btn pm-btn-outline" onclick="this.closest(\'.pm-modal-overlay\').remove();pmShowCustomers();">Cancel</button>';
  html += '<button class="pm-btn pm-btn-primary" onclick="pmSaveEditCustomer(\''+id+'\')">Save Changes</button>';
  html += '</div></div></div>';
  document.getElementById('pm-modal-container').innerHTML = html;
}

async function pmSaveEditCustomer(id) {
  if (!sb) return;
  try {
    var updates = {
      name: document.getElementById('pm-editcust-name').value.trim(),
      vertical: document.getElementById('pm-editcust-vertical').value || null,
      primary_contact: document.getElementById('pm-editcust-contact').value.trim() || null,
      notes: document.getElementById('pm-editcust-notes').value.trim() || null
    };
    var res = await sb.from('customers').update(updates).eq('id', id);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmShowCustomers();
  } catch(e) { alert('Error updating customer: ' + e.message); }
}

async function pmDeleteCustomer(id) {
  if (!sb) return;
  var oppCount = pmData.opportunities.filter(function(o){ return String(o.customer_id) === String(id); }).length;
  if (oppCount > 0) {
    alert('Cannot delete: this customer has ' + oppCount + ' opportunity' + (oppCount!==1?'ies':'y') + '. Delete those first.');
    return;
  }
  if (!confirm('Delete this customer?')) return;
  try {
    var res = await sb.from('customers').delete().eq('id', id);
    if (res.error) throw res.error;
    document.getElementById('pm-modal-container').innerHTML = '';
    await pmLoadAll();
    pmShowCustomers();
  } catch(e) { alert('Error deleting customer: ' + e.message); }
}

// ═══════════ DEAL MANAGEMENT ═══════════
// Stage-gated deal workflow with activity tracking

var dmData = {
  deals: [],
  stages: [],
  elements: {}
};

async function dmLoadDeals() {
  if (!sb) return;
  try {
    const deals = await sb.from('deal_deals').select('*').order('name', {ascending: true});
    dmData.deals = deals.data || [];
    dmRenderDealSelect();
  } catch(e) {
    console.error('Error loading deals:', e);
    showSectionError('sec-deals', 'Failed to load deal list. Check your connection and try refreshing.');
  }
}

function dmRenderDealSelect() {
  const select = document.getElementById('dm-deal-select');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="">-- No deal selected --</option>';

  dmData.deals.forEach(deal => {
    const opt = document.createElement('option');
    opt.value = deal.id;
    opt.textContent = deal.name;
    select.appendChild(opt);
  });

  select.value = currentVal;
}

async function dmLoadDealStages() {
  const dealId = document.getElementById('dm-deal-select').value;
  if (!dealId) {
    document.getElementById('dm-stages-container').style.display = 'none';
    document.getElementById('dm-no-deal').style.display = 'block';
    return;
  }

  if (!sb) return;
  try {
    // Load stages in order
    const stages = await sb
      .from('stages')
      .select('*')
      .order('stage_number', {ascending: true});

    dmData.stages = stages.data || [];

    // Load all elements for this deal
    const elements = await sb
      .from('project_elements')
      .select('*, stage_element_templates(*)')
      .eq('project_id', dealId)
      .order('stage_number', {ascending: true});

    // Organize elements by stage
    dmData.elements = {};
    (elements.data || []).forEach(el => {
      if (!dmData.elements[el.stage_number]) {
        dmData.elements[el.stage_number] = [];
      }
      dmData.elements[el.stage_number].push(el);
    });

    dmRenderStagesPipeline(dealId);
    document.getElementById('dm-no-deal').style.display = 'none';
    document.getElementById('dm-stages-container').style.display = 'block';
  } catch(e) {
    console.error('Error loading deal stages:', e);
    alert('Error loading deal stages: ' + e.message);
  }
}

function dmRenderStagesPipeline(dealId) {
  const container = document.getElementById('dm-stages-pipeline');
  if (!container) return;

  container.innerHTML = '';

  dmData.stages.forEach(stage => {
    const stageElements = dmData.elements[stage.stage_number] || [];
    const completed = stageElements.filter(el =>
      el.parent_element_id === null &&
      ['complete', 'na', 'skipped'].includes(el.element_status)
    ).length;
    const total = stageElements.filter(el => el.parent_element_id === null).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const stageDiv = document.createElement('div');
    stageDiv.className = 'dm-stage-container';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'dm-stage-header';
    headerDiv.onclick = function() {
      this.classList.toggle('expanded');
      const content = this.nextElementSibling;
      if (content) content.classList.toggle('expanded');
    };

    headerDiv.innerHTML = `
      <div class="dm-stage-title">
        <div class="dm-stage-number">${stage.stage_number}</div>
        <div class="dm-stage-name">${stage.stage_name}</div>
      </div>
      <div class="dm-stage-progress">
        <div class="dm-progress-bar">
          <div class="dm-progress-fill" style="width: ${percent}%"></div>
        </div>
        <div class="dm-progress-text">${completed}/${total}</div>
      </div>
      <div class="dm-stage-expand-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    `;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'dm-stage-content';

    const elementsList = document.createElement('div');
    elementsList.className = 'dm-elements-list';

    stageElements.filter(el => el.parent_element_id === null).forEach(element => {
      const elDiv = document.createElement('div');
      elDiv.className = 'dm-element-item';

      const statusClass = `dm-element-status ${element.element_status}`;
      const workstreamDisplay = element.responsible_workstream ?
        `<span class="dm-element-workstream">${element.responsible_workstream}</span>` : '';

      elDiv.innerHTML = `
        <input type="checkbox" class="dm-element-checkbox"
          ${['complete', 'na', 'skipped'].includes(element.element_status) ? 'checked' : ''}
          onchange="dmToggleElementStatus(${element.id}, this.checked)">
        <div class="dm-element-info">
          <div class="dm-element-name">${element.element_name}</div>
          ${element.description ? `<div class="dm-element-description">${element.description}</div>` : ''}
          <div class="dm-element-meta">
            <span class="dm-element-type-badge">${element.element_type}</span>
            ${workstreamDisplay}
            <span class="${statusClass}" onclick="dmToggleStatus(${element.id}, event)">${element.element_status.replace(/_/g, ' ')}</span>
          </div>
        </div>
      `;

      elementsList.appendChild(elDiv);
    });

    contentDiv.appendChild(elementsList);

    // Add stage stats
    const statsDiv = document.createElement('div');
    statsDiv.className = 'dm-stage-stats';
    statsDiv.innerHTML = `
      <div class="dm-stat">
        <div class="dm-stat-label">Total Items</div>
        <div class="dm-stat-value">${total}</div>
      </div>
      <div class="dm-stat">
        <div class="dm-stat-label">Complete</div>
        <div class="dm-stat-value">${completed}</div>
      </div>
      <div class="dm-stat">
        <div class="dm-stat-label">In Progress</div>
        <div class="dm-stat-value">${stageElements.filter(el => el.parent_element_id === null && el.element_status === 'in_progress').length}</div>
      </div>
      <div class="dm-stat">
        <div class="dm-stat-label">Blocked</div>
        <div class="dm-stat-value">${stageElements.filter(el => el.parent_element_id === null && el.element_status === 'blocked').length}</div>
      </div>
    `;

    contentDiv.appendChild(statsDiv);

    stageDiv.appendChild(headerDiv);
    stageDiv.appendChild(contentDiv);
    container.appendChild(stageDiv);
  });
}

async function dmToggleElementStatus(elementId, isComplete) {
  if (!sb) return;
  try {
    const newStatus = isComplete ? 'complete' : 'not_started';
    await sb.from('project_elements')
      .update({element_status: newStatus, updated_at: new Date().toISOString()})
      .eq('id', elementId);

    const dealId = document.getElementById('dm-deal-select').value;
    await dmLoadDealStages();
  } catch(e) {
    console.error('Error updating element status:', e);
  }
}

async function dmToggleStatus(elementId, event) {
  event.stopPropagation();
  if (!sb) return;

  const statusCycle = ['not_started', 'in_progress', 'complete', 'blocked', 'na'];

  try {
    // Get current status
    const result = await sb.from('project_elements').select('element_status').eq('id', elementId).single();
    const currentStatus = result.data?.element_status || 'not_started';

    const currentIdx = statusCycle.indexOf(currentStatus);
    const nextIdx = (currentIdx + 1) % statusCycle.length;
    const nextStatus = statusCycle[nextIdx];

    await sb.from('project_elements')
      .update({element_status: nextStatus, updated_at: new Date().toISOString()})
      .eq('id', elementId);

    const dealId = document.getElementById('dm-deal-select').value;
    await dmLoadDealStages();
  } catch(e) {
    console.error('Error cycling status:', e);
  }
}

// ═══════════════════════════════════════════════════
// DEAL ARTIFACTS (Workspace)
// ═══════════════════════════════════════════════════
var daData = {
  artifacts: [],
  deals: [],
  costModels: [],
  netoptScenarios: [],
  currentDealId: null
};

async function daLoadArtifacts(dealId) {
  if (!sb) return;
  try {
    daData.currentDealId = dealId;
    const result = await sb.from('deal_artifacts')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', {ascending: false});

    daData.artifacts = result.data || [];

    // Enrich cost model artifacts with summary data
    const cmArtifacts = daData.artifacts.filter(a => a.artifact_type === 'cost_model' && a.artifact_id);
    if (cmArtifacts.length > 0) {
      const cmIds = cmArtifacts.map(a => a.artifact_id);
      const { data: cmDetails } = await sb.from('cost_model_projects')
        .select('id, name, total_annual_cost, facility_sqft, environment_type, pricing_model, target_margin_pct, contract_term_years')
        .in('id', cmIds);
      if (cmDetails) {
        const cmMap = {};
        cmDetails.forEach(cm => { cmMap[String(cm.id)] = cm; });
        cmArtifacts.forEach(a => { a._cmDetail = cmMap[String(a.artifact_id)] || null; });
      }
    }

    daRenderArtifacts();
  } catch(e) {
    console.error('Error loading artifacts:', e);
  }
}

function daRenderArtifacts() {
  const grid = document.getElementById('da-artifacts-grid');
  const empty = document.getElementById('da-artifacts-empty');

  if (!grid || !empty) return;

  grid.innerHTML = '';

  if (daData.artifacts.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.style.display = 'grid';

  daData.artifacts.forEach(artifact => {
    const card = document.createElement('div');
    card.className = 'da-card';

    const typeInfo = daGetTypeInfo(artifact.artifact_type);
    const dateStr = new Date(artifact.created_at).toLocaleDateString();

    let html = '<div class="da-card-header">';
    html += `<div class="da-card-icon ${artifact.artifact_type}">${typeInfo.icon}</div>`;
    html += '<div style="flex:1;min-width:0;">';
    html += `<div class="da-card-title">${artifact.artifact_name}</div>`;
    html += `<div class="da-card-meta">${typeInfo.label} • ${dateStr}</div>`;
    html += '</div></div>';

    // Show cost model summary if available
    if (artifact._cmDetail) {
      const cm = artifact._cmDetail;
      html += '<div style="background:var(--ies-gray-50);border-radius:8px;padding:10px 12px;margin:8px 0;font-size:11px;line-height:1.6;">';
      if (cm.total_annual_cost) {
        html += `<div style="display:flex;justify-content:space-between;"><span style="color:var(--ies-gray-600);">Annual Cost</span><strong style="color:var(--ies-navy);">$${Number(cm.total_annual_cost).toLocaleString()}</strong></div>`;
      }
      if (cm.facility_sqft) {
        html += `<div style="display:flex;justify-content:space-between;"><span style="color:var(--ies-gray-600);">Facility</span><span style="color:var(--ies-navy);">${Number(cm.facility_sqft).toLocaleString()} SF</span></div>`;
      }
      if (cm.environment_type) {
        html += `<div style="display:flex;justify-content:space-between;"><span style="color:var(--ies-gray-600);">Type</span><span style="color:var(--ies-navy);">${cm.environment_type}</span></div>`;
      }
      if (cm.pricing_model) {
        html += `<div style="display:flex;justify-content:space-between;"><span style="color:var(--ies-gray-600);">Pricing</span><span style="color:var(--ies-navy);">${cm.pricing_model}</span></div>`;
      }
      if (cm.target_margin_pct) {
        html += `<div style="display:flex;justify-content:space-between;"><span style="color:var(--ies-gray-600);">Target Margin</span><span style="color:var(--ies-navy);">${cm.target_margin_pct}%</span></div>`;
      }
      if (cm.contract_term_years) {
        html += `<div style="display:flex;justify-content:space-between;"><span style="color:var(--ies-gray-600);">Term</span><span style="color:var(--ies-navy);">${cm.contract_term_years} yr</span></div>`;
      }
      html += '</div>';
    } else if (artifact.artifact_notes) {
      html += `<div style="font-size:12px;color:var(--ies-gray-600);line-height:1.4;">${esc(artifact.artifact_notes)}</div>`;
    }

    html += '<div class="da-card-actions">';
    html += `<button class="da-btn-open" onclick="daOpenArtifact('${esc(artifact.artifact_type)}', '${esc(artifact.artifact_id || '')}')">Open</button>`;
    html += `<button class="da-btn-remove" onclick="daRemoveArtifact('${esc(artifact.id)}')">Remove</button>`;
    html += '</div>';

    card.innerHTML = html;
    grid.appendChild(card);
  });
}

function daGetTypeInfo(type) {
  const types = {
    cost_model: { icon: '\uD83D\uDCCA', label: 'Cost Model' },
    netopt_scenario: { icon: '\uD83D\uDDFA\uFE0F', label: 'Network Scenario' },
    fleet_scenario: { icon: '\uD83D\uDE9A', label: 'Fleet Scenario' },
    presentation: { icon: '\uD83D\uDCD1', label: 'Presentation' },
    document: { icon: '\uD83D\uDCC4', label: 'Document' },
    other: { icon: '\uD83D\uDCCE', label: 'Other' }
  };
  return types[type] || types.other;
}

async function daShowLinkExistingModal() {
  if (!daData.currentDealId) {
    alert('No deal selected');
    return;
  }

  if (!sb) return;

  try {
    // Load cost models and netopt scenarios
    const [cmResult, noResult, fsResult] = await Promise.all([
      sb.from('cost_model_projects').select('id, name, created_at, total_annual_cost, facility_sqft, environment_type, pricing_model').order('name'),
      sb.from('netopt_scenarios').select('id, scenario_name, created_at').order('scenario_name'),
      sb.from('fleet_scenarios').select('id, scenario_name, created_at').order('scenario_name').then(r => r).catch(() => ({ data: [] }))
    ]);

    daData.costModels = cmResult.data || [];
    daData.netoptScenarios = noResult.data || [];

    let html = '<div class="da-modal-overlay" onclick="if(event.target===this)document.getElementById(\'da-modal-container\').innerHTML=\'\'">';
    html += '<div class="da-modal">';
    html += '<div class="da-modal-title">Link Existing Design Artifact</div>';

    // Cost Models section
    if (daData.costModels.length > 0) {
      html += '<div class="da-modal-section">';
      html += '<label class="da-modal-label">Cost Models</label>';
      html += '<div class="da-modal-list">';
      daData.costModels.forEach(cm => {
        const dateStr = new Date(cm.created_at).toLocaleDateString();
        const cmParts = [];
        if (cm.total_annual_cost) cmParts.push('$' + Number(cm.total_annual_cost).toLocaleString() + '/yr');
        if (cm.facility_sqft) cmParts.push(Number(cm.facility_sqft).toLocaleString() + ' SF');
        if (cm.environment_type) cmParts.push(cm.environment_type);
        const cmNote = cmParts.join(' \u00B7 ');
        const escapedNote = cmNote.replace(/'/g, "\\'");
        html += `<div class="da-modal-item" onclick="daLinkArtifact('cost_model', '${cm.id}', '${cm.name}', '${escapedNote}')">`;
        html += `<div class="da-modal-item-icon" style="background:linear-gradient(135deg,#2196F3,#1976D2);">\uD83D\uDCCA</div>`;
        html += '<div class="da-modal-item-info">';
        html += `<div class="da-modal-item-name">${cm.name}</div>`;
        html += `<div class="da-modal-item-meta">${cmNote ? cmNote + ' \u2022 ' : ''}Created ${dateStr}</div>`;
        html += '</div></div>';
      });
      html += '</div></div>';
    }

    // NetOpt scenarios section
    if (daData.netoptScenarios.length > 0) {
      html += '<div class="da-modal-section">';
      html += '<label class="da-modal-label">Network Optimization Scenarios</label>';
      html += '<div class="da-modal-list">';
      daData.netoptScenarios.forEach(no => {
        const dateStr = new Date(no.created_at).toLocaleDateString();
        html += `<div class="da-modal-item" onclick="daLinkArtifact('netopt_scenario', '${no.id}', '${no.scenario_name}')">`;
        html += `<div class="da-modal-item-icon" style="background:linear-gradient(135deg,#4CAF50,#388E3C);">\uD83D\uDDFA\uFE0F</div>`;
        html += '<div class="da-modal-item-info">';
        html += `<div class="da-modal-item-name">${no.scenario_name}</div>`;
        html += `<div class="da-modal-item-meta">Created ${dateStr}</div>`;
        html += '</div></div>';
      });
      html += '</div></div>';
    }

    if (daData.costModels.length === 0 && daData.netoptScenarios.length === 0) {
      html += '<div style="padding:40px 20px;text-align:center;color:var(--ies-gray-400);">No design artifacts available. Create one first.</div>';
    }

    html += '</div></div>';

    document.getElementById('da-modal-container').innerHTML = html;
  } catch(e) {
    console.error('Error loading artifacts modal:', e);
    alert('Error loading artifacts');
  }
}

async function daShowCreateNewModal() {
  let html = '<div class="da-modal-overlay" onclick="if(event.target===this)document.getElementById(\'da-modal-container\').innerHTML=\'\'">';
  html += '<div class="da-modal">';
  html += '<div class="da-modal-title">Create New Design Artifact</div>';

  html += '<div class="da-modal-section">';
  html += '<label class="da-modal-label">Choose Type</label>';
  html += '<div style="display:flex;flex-direction:column;gap:8px;">';
  html += '<button class="pm-btn pm-btn-outline pm-btn-sm" onclick="daCreateNew(\'cost_model\')" style="text-align:left;justify-content:flex-start;padding:12px;">\uD83D\uDCCA New Cost Model</button>';
  html += '<button class="pm-btn pm-btn-outline pm-btn-sm" onclick="daCreateNew(\'netopt_scenario\')" style="text-align:left;justify-content:flex-start;padding:12px;">\uD83D\uDDFA\uFE0F New Network Optimization Scenario</button>';
  html += '</div>';
  html += '</div>';

  html += '</div></div>';

  document.getElementById('da-modal-container').innerHTML = html;
}

async function daLinkArtifact(artifactType, artifactId, artifactName, artifactNotes) {
  if (!sb || !daData.currentDealId) return;

  try {
    const record = {
      deal_id: daData.currentDealId,
      artifact_type: artifactType,
      artifact_id: artifactId,
      artifact_name: artifactName,
      created_by: 'IES Hub'
    };
    if (artifactNotes) record.artifact_notes = artifactNotes;
    await sb.from('deal_artifacts').insert(record);

    document.getElementById('da-modal-container').innerHTML = '';
    await daLoadArtifacts(daData.currentDealId);
  } catch(e) {
    console.error('Error linking artifact:', e);
    alert('Error linking artifact: ' + e.message);
  }
}

async function daRemoveArtifact(artifactId) {
  if (!sb) return;

  if (!confirm('Remove this artifact from the deal?')) return;

  try {
    await sb.from('deal_artifacts').delete().eq('id', artifactId);
    await daLoadArtifacts(daData.currentDealId);
  } catch(e) {
    console.error('Error removing artifact:', e);
    alert('Error removing artifact');
  }
}

function daOpenArtifact(artifactType, artifactId) {
  if (artifactType === 'cost_model' && artifactId) {
    // Capture deal context from the workspace before navigating away
    var sourceDealId = daData.currentDealId || null;
    // Bypass navigate() to avoid landing page reset — directly show section + open project
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-costmodel').classList.add('active');
    var cmNav = document.querySelector('[data-section=costmodel]');
    if (cmNav) {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      cmNav.classList.add('active');
    }
    // Show editor directly, skip landing page
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('editorContainer').style.display = 'flex';
    document.getElementById('topbarControls').style.display = 'flex';
    // Open the project, then ensure deal selector reflects the deal context
    cmApp.openProject(parseInt(artifactId, 10) || artifactId).then(function() {
      if (sourceDealId) {
        // Ensure deals are loaded, then set the value with retry for slow Supabase
        daLoadDealsForSelector().then(function() {
          function trySetDealSelector(attempts) {
            var cmDealSel = document.getElementById('cmDealSelector');
            if (cmDealSel && cmDealSel.options.length > 1) {
              cmDealSel.value = String(sourceDealId);
              // Also update the project record if deal_id wasn't set
              if (cmApp.currentProject && !cmApp.currentProject.deal_id) {
                cmApp.currentProject.deal_id = sourceDealId;
                if (sb) {
                  sb.from('cost_model_projects').update({ deal_id: sourceDealId }).eq('id', cmApp.currentProject.id).then(function(){}).catch(function(e){ console.error('Failed to update deal_id:', e); });
                }
              }
            } else if (attempts > 0) {
              setTimeout(function() { trySetDealSelector(attempts - 1); }, 300);
            }
          }
          trySetDealSelector(5);
        });
      }
    });
  } else if (artifactType === 'netopt_scenario' && artifactId) {
    // Navigate to Design Tools > Network Optimization tab, then load scenario
    navigate('designtools', document.querySelector('[data-section=designtools]'));
    setTimeout(() => {
      showDesignTool('dt-netopt', document.querySelectorAll('#dt-tabs .dt-tab')[6]);
      setTimeout(() => { netoptLoadScenario(parseInt(artifactId, 10) || artifactId); }, 200);
    }, 200);
  } else if (artifactType === 'fleet_scenario' && artifactId) {
    // Bypass navigate() to show fleet section directly and open scenario
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-fleet').classList.add('active');
    var dtNav = document.querySelector('[data-section=designtools]');
    if (dtNav) {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      dtNav.classList.add('active');
    }
    fmShowTool();
    // Load the specific scenario by ID
    fmLoadFleetScenario(parseInt(artifactId, 10) || artifactId);
  } else if (artifactType === 'presentation') {
    // Presentation artifacts are downloaded files — show info toast
    showToast('This presentation was downloaded when generated. Check your Downloads folder.', 'info');
  } else {
    alert('Cannot open this artifact type yet');
  }
}

function daCreateNew(artifactType) {
  if (artifactType === 'cost_model') {
    // Bypass navigate() landing reset — go directly to editor
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-costmodel').classList.add('active');
    var cmNav = document.querySelector('[data-section=costmodel]');
    if (cmNav) {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      cmNav.classList.add('active');
    }
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('editorContainer').style.display = 'flex';
    document.getElementById('topbarControls').style.display = 'flex';
    cmApp.newModel();
    document.getElementById('da-modal-container').innerHTML = '';
  } else if (artifactType === 'netopt_scenario') {
    navigate('designtools', document.querySelector('[data-section=designtools]'));
    setTimeout(() => {
      showDesignTool('dt-netopt', document.querySelectorAll('#dt-tabs .dt-tab')[6]);
      document.getElementById('da-modal-container').innerHTML = '';
    }, 100);
  }
}

async function daLoadDealsForSelector() {
  if (!sb) return;
  try {
    const result = await sb.from('opportunities').select('id, name, stage, status').order('name', {ascending: true});
    daData.deals = (result.data || []).map(function(o) { return { id: o.id, name: o.name, stage: o.stage, status: o.status }; });
    daPopulateDealSelectors();
  } catch(e) {
    console.error('Error loading deals for selector:', e);
  }
}

function daPopulateDealSelectors() {
  const selectors = ['cmDealSelector', 'netoptDealSelector'];
  selectors.forEach(selectorId => {
    const sel = document.getElementById(selectorId);
    if (sel) {
      sel.innerHTML = '<option value="">-- Select Deal --</option>';
      daData.deals.forEach(deal => {
        const opt = document.createElement('option');
        opt.value = deal.id;
        opt.textContent = deal.name;
        sel.appendChild(opt);
      });
    }
  });
}

async function daLinkCostModelToDeal() {
  const dealIdStr = document.getElementById('cmDealSelector')?.value;
  if (!dealIdStr || !sb) return;
  const dealId = parseInt(dealIdStr, 10);
  if (isNaN(dealId)) return;

  // Must have a saved cost model to link
  if (!cmApp.currentProject || !cmApp.currentProject.id) {
    alert('Please save the cost model first before linking to a deal.');
    document.getElementById('cmDealSelector').value = '';
    return;
  }

  const projId = cmApp.currentProject.id;

  // Store the deal_id on the current project for saving
  cmApp.currentProject.deal_id = dealId;

  // Update cost_model_projects.deal_id in Supabase
  try {
    await sb.from('cost_model_projects').update({ deal_id: dealId }).eq('id', projId);
  } catch(e) { console.warn('Could not update cost_model_projects.deal_id:', e); }

  // Create deal_artifacts record so it shows in the workspace
  try {
    // Check if already linked to avoid duplicates
    const { data: existing } = await sb.from('deal_artifacts')
      .select('id')
      .eq('deal_id', dealId)
      .eq('artifact_type', 'cost_model')
      .eq('artifact_id', String(projId))
      .limit(1);

    if (!existing || existing.length === 0) {
      // Build a summary note from the cost model data
      const proj = cmApp.currentProject;
      const parts = [];
      if (proj.total_annual_cost) parts.push('$' + Number(proj.total_annual_cost).toLocaleString() + '/yr');
      if (proj.facility_sqft) parts.push(Number(proj.facility_sqft).toLocaleString() + ' SF');
      if (proj.environment_type) parts.push(proj.environment_type);
      if (proj.pricing_model) parts.push(proj.pricing_model + ' pricing');

      const { error } = await sb.from('deal_artifacts').insert({
        deal_id: dealId,
        artifact_type: 'cost_model',
        artifact_id: String(projId),
        artifact_name: proj.name || 'Untitled Cost Model',
        artifact_notes: parts.join(' \u00B7 ') || null,
        created_by: 'IES Hub'
      });
      if (error) throw error;
      // Show confirmation
      if (typeof netoptToast === 'function') netoptToast('Cost model linked to deal');
    } else {
      if (typeof netoptToast === 'function') netoptToast('Already linked');
    }
    // Cost model linked to deal
  } catch(e) {
    console.error('Error creating deal_artifacts record for cost model:', e);
    alert('Error linking cost model: ' + (e.message || e));
  }
}

async function daLinkNetoptToDeal() {
  const dealIdStr = document.getElementById('netoptDealSelector')?.value;
  if (!dealIdStr || !sb) return;
  const dealId = parseInt(dealIdStr, 10);
  if (isNaN(dealId)) return;

  if (typeof netoptState !== 'undefined') {
    netoptState.linkedDealId = dealId;
  }

  // For NetOpt, we need a scenario ID — check if one is saved
  const scenarioName = netoptState?.scenarioName || 'Unsaved Scenario';
  const scenarioId = netoptState?.currentScenarioId;
  if (!scenarioId) {
    alert('Please save the scenario first before linking to a deal.');
    document.getElementById('netoptDealSelector').value = '';
    return;
  }

  try {
    const { data: existing } = await sb.from('deal_artifacts')
      .select('id')
      .eq('deal_id', dealId)
      .eq('artifact_type', 'netopt_scenario')
      .eq('artifact_id', String(scenarioId))
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error } = await sb.from('deal_artifacts').insert({
        deal_id: dealId,
        artifact_type: 'netopt_scenario',
        artifact_id: String(scenarioId),
        artifact_name: scenarioName,
        created_by: 'IES Hub'
      });
      if (error) throw error;
      if (typeof netoptToast === 'function') netoptToast('Scenario linked to deal');
    } else {
      if (typeof netoptToast === 'function') netoptToast('Already linked');
    }
    // NetOpt scenario linked to deal
  } catch(e) {
    console.error('Error creating deal_artifacts record for netopt:', e);
    alert('Error linking scenario: ' + (e.message || e));
  }
}
