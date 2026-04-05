// ============================================================================
// design-tools.js
// Design Tools Framework — Landing Pages, Scenario Management, Section Tours,
// Nav Group Collapse/Expand, Import COG Results
// Extracted from index.html
// ============================================================================

// NOTE: dtToggleLandingEmpty is defined in core.js

// ══════════════════════════════════════════════════════════════════════
// DESIGN TOOLS — Scenario Copy/Delete/Refresh Infrastructure
// ══════════════════════════════════════════════════════════════════════

var dtRefreshMap = {
  wsc: function() { wscLoadScenariosList(); },
  net: function() { netLoadScenariosList(); },
  netopt: function() { netoptLoadScenariosList(); },
  fleet: function() { fmLoadScenariosList(); },
  costmodel: function() { cmApp.loadProjects(); },
  deal: function() { dealApp.loadDeals(); }
};

// Name field varies by table
var dtNameField = {
  warehouse_sizing_scenarios: 'scenario_name',
  network_optimization_scenarios: 'scenario_name',
  netopt_scenarios: 'scenario_name',
  fleet_scenarios: 'name',
  cost_model_projects: 'name',
  deal_deals: 'deal_name'
};

async function dtDeleteScenario(table, id, toolKey) {
  var label = (table === 'deal_deals') ? 'deal' : (table === 'cost_model_projects') ? 'model' : 'scenario';
  if (!confirm('Delete this ' + label + '? This cannot be undone.')) return;
  try {
    await cmApiDelete(table, id);
    // Also clean up linked data for cost models
    if (table === 'cost_model_projects') {
      // Remove deal_artifacts referencing this model
      try {
        await fetch(SUPABASE_URL + '/rest/v1/deal_artifacts?artifact_type=eq.cost_model&artifact_id=eq.' + id, {
          method: 'DELETE', headers: API_HEADERS
        });
      } catch(e) { console.error('Error:', e); }
    }
    // Also clean up fleet lanes for fleet scenarios
    if (table === 'fleet_scenarios') {
      try {
        await fetch(SUPABASE_URL + '/rest/v1/fleet_lanes?scenario_id=eq.' + id, {
          method: 'DELETE', headers: API_HEADERS
        });
      } catch(e) { console.error('Error:', e); }
    }
    if (dtRefreshMap[toolKey]) dtRefreshMap[toolKey]();
    if (typeof netoptToast === 'function') netoptToast('Deleted');
  } catch(e) {
    console.error('Delete error:', e);
    alert('Error deleting: ' + (e.message || e));
  }
}

async function dtCopyScenario(table, id, toolKey) {
  try {
    // Fetch the original record
    var records = await cmFetchTable(table, 'id=eq.' + id);
    if (!records || records.length === 0) { alert('Record not found'); return; }
    var original = records[0];

    // Build the copy — strip system fields
    var copy = {};
    var skipFields = ['id', 'created_at', 'updated_at'];
    Object.keys(original).forEach(function(k) {
      if (skipFields.indexOf(k) === -1 && original[k] !== undefined) {
        copy[k] = original[k];
      }
    });

    // Rename with " (Copy)" suffix
    var nameField = dtNameField[table] || 'name';
    if (copy[nameField]) {
      copy[nameField] = copy[nameField] + ' (Copy)';
    }

    // Clear deal linkage on cost model copies so they're independent
    if (table === 'cost_model_projects') {
      if (copy.deal_id) copy.deal_id = null;
      if (copy.deal_deals_id) copy.deal_deals_id = null;
    }

    // Insert the copy
    var result = await cmApiPost(table, copy);

    // For fleet scenarios, also copy fleet_lanes
    if (table === 'fleet_scenarios' && result && result[0]) {
      var newId = result[0].id;
      try {
        var lanes = await cmFetchTable('fleet_lanes', 'scenario_id=eq.' + id);
        for (var i = 0; i < lanes.length; i++) {
          var laneCopy = {};
          Object.keys(lanes[i]).forEach(function(k) {
            if (skipFields.indexOf(k) === -1) laneCopy[k] = lanes[i][k];
          });
          laneCopy.scenario_id = newId;
          await cmApiPost('fleet_lanes', laneCopy);
        }
      } catch(e) { console.warn('Could not copy fleet lanes:', e); }
    }

    // Refresh the landing page
    if (dtRefreshMap[toolKey]) dtRefreshMap[toolKey]();
    if (typeof netoptToast === 'function') netoptToast('Copied');
  } catch(e) {
    console.error('Copy error:', e);
    alert('Error copying: ' + (e.message || e));
  }
}

// ══════════════════════════════════════════════════════════════════════
// NAV GROUP COLLAPSE/EXPAND
// ══════════════════════════════════════════════════════════════════════

// ── NAV GROUP COLLAPSE/EXPAND ──
function cmToggleNavGroup(groupId) {
    var items = document.getElementById('group-' + groupId);
    var chevron = document.getElementById('chevron-' + groupId);
    if (!items) return;
    if (items.classList.contains('collapsed')) {
        items.classList.remove('collapsed');
        if (chevron) chevron.classList.remove('collapsed');
    } else {
        items.classList.add('collapsed');
        if (chevron) chevron.classList.add('collapsed');
    }
}

// ══════════════════════════════════════════════════════════════════════
// IMPORT COG RESULTS INTO NETWORK OPTIMIZATION
// ══════════════════════════════════════════════════════════════════════

// ── IMPORT COG RESULTS INTO NETWORK OPTIMIZATION ──
function netoptImportFromCOG() {
    var statusEl = document.getElementById('netopt-cog-import-status');
    if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = 'Checking COG data…'; statusEl.style.color = 'var(--ies-gray-500)'; }

    // Get COG demand points
    if (!window.netDemandPoints || netDemandPoints.length === 0) {
        if (statusEl) { statusEl.textContent = 'No COG demand data found. Please run the Center of Gravity tool first.'; statusEl.style.color = '#dc2626'; }
        return;
    }

    // Geocode COG demand points
    var geoPoints = [];
    for (var i = 0; i < netDemandPoints.length; i++) {
        var geo = geocodeCity(netDemandPoints[i].city);
        if (geo && netDemandPoints[i].volume > 0) {
            geoPoints.push({ lat: geo.lat, lng: geo.lng, weight: netDemandPoints[i].volume, name: geo.name, city: netDemandPoints[i].city, idx: i });
        }
    }

    if (geoPoints.length < 1) {
        if (statusEl) { statusEl.textContent = 'No geocodable demand points found in COG tool.'; statusEl.style.color = '#dc2626'; }
        return;
    }

    // Run COG for 1 through 5 DCs and find the optimal count (elbow method)
    var maxDCs = Math.min(5, geoPoints.length);
    var bestK = netDCCount || 2; // Use COG's selected DC count
    var clusters = kMeansCOG(geoPoints, bestK);

    // Convert cluster centers to facility candidates
    var facilities = [];
    for (var ci = 0; ci < clusters.length; ci++) {
        if (clusters[ci].members.length === 0) continue;
        var cityName = nearestCity(clusters[ci].center.lat, clusters[ci].center.lng);
        var geo2 = geocodeCity(cityName);

        // Try to match to a known facility candidate for realistic cost data
        var matched = NETOPT_FACILITY_CANDIDATES.find(function(f) {
            return cityName.toLowerCase().indexOf(f.name.toLowerCase()) >= 0;
        });

        facilities.push({
            id: 'cog-' + Date.now() + '-' + ci,
            name: cityName.split(',')[0],
            city: cityName,
            capacity: matched ? matched.capacity : 600,
            fixedCost: matched ? matched.fixedCost : 2.5,
            varCost: matched ? matched.varCost : 0.23,
            status: 'Candidate',
            lat: geo2 ? geo2.lat : clusters[ci].center.lat,
            lng: geo2 ? geo2.lng : clusters[ci].center.lng,
            cogSource: true
        });
    }

    // Also import demand points
    var demands = [];
    for (var di = 0; di < geoPoints.length; di++) {
        var gp = geoPoints[di];
        demands.push({
            id: 'dem-cog-' + Date.now() + '-' + di,
            city: gp.city,
            volume: Math.round(gp.weight / 1000), // Convert to K units for netopt
            maxMiles: 500, // Default service requirement
            lat: gp.lat,
            lng: gp.lng
        });
    }

    // Also add nearby major warehouse cities that weren't COG centers (diversify candidates)
    var existingCities = facilities.map(function(f) { return f.name.toLowerCase(); });
    NETOPT_FACILITY_CANDIDATES.forEach(function(cand) {
        if (existingCities.indexOf(cand.name.toLowerCase()) < 0) {
            var candGeo = geocodeCity(cand.city);
            // Check if this candidate is within 300mi of any demand point
            var relevant = false;
            for (var di2 = 0; di2 < geoPoints.length; di2++) {
                if (candGeo && roadDist(candGeo.lat, candGeo.lng, geoPoints[di2].lat, geoPoints[di2].lng) < 600) {
                    relevant = true;
                    break;
                }
            }
            if (relevant && candGeo) {
                facilities.push({
                    id: 'cand-' + Date.now() + '-' + cand.name,
                    name: cand.name,
                    city: cand.city,
                    capacity: cand.capacity,
                    fixedCost: cand.fixedCost,
                    varCost: cand.varCost,
                    status: 'Candidate',
                    lat: candGeo.lat,
                    lng: candGeo.lng,
                    cogSource: false
                });
            }
        }
    });

    // Populate netopt state
    netoptState.facilities = facilities;
    netoptState.demands = demands;
    netoptRenderFacilitiesTable();
    netoptRenderDemandsTable();
    netoptUpdateKPI();

    // Mark COG-sourced facilities in the table
    if (statusEl) {
        statusEl.textContent = 'Imported ' + clusters.length + ' COG-optimized locations + ' + (facilities.length - clusters.length) + ' nearby candidates, and ' + demands.length + ' demand points. Switch to Facilities tab to review.';
        statusEl.style.color = '#059669';
    }

    // Auto-switch to facilities tab after a brief delay
    setTimeout(function() { netoptSwitchTab('facilities'); }, 1500);
}

// ══════════════════════════════════════════════════════════════════════
// DESIGN TOOLS LANDING PAGES — Scenario Management
// ══════════════════════════════════════════════════════════════════════

// NOTE: wscShowLanding, wscShowTool, wscLoadScenariosList, wscNewScenario
// are defined in network-opt.js alongside the other wsc* functions.

// ── CENTER OF GRAVITY LANDING ──
async function netShowLanding() {
  var landing = document.getElementById('net-landing');
  var tool = document.getElementById('net-tool');
  if (landing) landing.style.display = 'block';
  if (tool) tool.style.display = 'none';
  await netLoadScenariosList();
}

async function netShowTool() {
  var landing = document.getElementById('net-landing');
  var tool = document.getElementById('net-tool');
  if (landing) landing.style.display = 'none';
  if (tool) tool.style.display = 'block';
}

async function netLoadScenariosList() {
  try {
    var scenarios = await netListScenarios(window.activeCostModelProjectId || null);
    var grid = document.getElementById('net-landing-grid');

    if (!grid) return;

    if (scenarios.length === 0) {
      grid.innerHTML = '';
      dtToggleLandingEmpty('net-landing-actions', 'net-empty-state', true);
      return;
    }

    dtToggleLandingEmpty('net-landing-actions', 'net-empty-state', false);

    grid.innerHTML = scenarios.map(function(s) {
      return '<div class="dt-landing-card">' +
        '<div onclick="netLoadScenario(\'' + s.id + '\'); netShowTool()" style="cursor:pointer;">' +
        '<div class="dt-landing-card-name">' + (s.scenario_name || 'Untitled') + '</div>' +
        '<div class="dt-landing-card-meta">' + (s.created_at ? new Date(s.created_at).toLocaleDateString() : '') + '</div>' +
        '<div class="dt-landing-card-metric">DCs: ' + (s.dc_count || '—') + ' | Freight: $' + ((s.result_est_freight || 0).toLocaleString(undefined, {maximumFractionDigits: 0})) + '</div>' +
        '</div>' +
        '<div class="dt-landing-card-actions">' +
        '<button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario(\'network_optimization_scenarios\',\'' + s.id + '\',\'net\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>' +
        '<button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario(\'network_optimization_scenarios\',\'' + s.id + '\',\'net\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>' +
        '</div></div>';
    }).join('');
  } catch (e) {
    console.error('Error loading scenarios:', e);
  }
}

function netNewScenario() {
  resetNetworkTool();
  netShowTool();
}

// ── NETWORK OPTIMIZATION LANDING ──
async function netoptShowLanding() {
  var landing = document.getElementById('netopt-landing');
  var tool = document.getElementById('netopt-tool');
  if (landing) landing.style.display = 'block';
  if (tool) tool.style.display = 'none';
  await netoptLoadScenariosList();
}

async function netoptShowTool() {
  var landing = document.getElementById('netopt-landing');
  var tool = document.getElementById('netopt-tool');
  if (landing) landing.style.display = 'none';
  if (tool) tool.style.display = 'block';
}

async function netoptLoadScenariosList() {
  try {
    var scenarios = await netoptListScenarios(window.activeCostModelProjectId || null);
    var grid = document.getElementById('netopt-landing-grid');

    if (!grid) return;

    if (scenarios.length === 0) {
      grid.innerHTML = '';
      dtToggleLandingEmpty('netopt-landing-actions', 'netopt-empty-state', true);
      return;
    }

    dtToggleLandingEmpty('netopt-landing-actions', 'netopt-empty-state', false);

    grid.innerHTML = scenarios.map(function(s) {
      return '<div class="dt-landing-card">' +
        '<div onclick="netoptLoadScenario(\'' + s.id + '\'); netoptShowTool()" style="cursor:pointer;">' +
        '<div class="dt-landing-card-name">' + (s.scenario_name || 'Untitled') + '</div>' +
        '<div class="dt-landing-card-meta">' + (s.created_at ? new Date(s.created_at).toLocaleDateString() : '') + '</div>' +
        '<div class="dt-landing-card-metric">Cost: $' + ((s.result_total_cost || 0).toLocaleString(undefined, {maximumFractionDigits: 0})) + ' | Mode: ' + (s.solver_mode || '—') + '</div>' +
        '</div>' +
        '<div class="dt-landing-card-actions">' +
        '<button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario(\'netopt_scenarios\',\'' + s.id + '\',\'netopt\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>' +
        '<button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario(\'netopt_scenarios\',\'' + s.id + '\',\'netopt\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>' +
        '</div></div>';
    }).join('');
  } catch (e) {
    console.error('Error loading scenarios:', e);
  }
}

function netoptNewScenario() {
  // Clear netopt state for new scenario
  if (typeof netoptState !== 'undefined') {
    netoptState.facilities = [];
    netoptState.demands = [];
    netoptState.results = null;
    netoptRenderFacilitiesTable();
    netoptRenderDemandsTable();
  }
  netoptShowTool();
}

// NOTE: fmShowLanding, fmShowTool, fmLoadScenariosList, fmNewScenario
// are defined in fleet-modeler.js alongside the other fm* functions.

async function fmLoadFleetScenario(id) {
  try {
    // Fetch scenario and its lanes from Supabase
    var scenarios = await cmFetchTable('fleet_scenarios', 'id=eq.' + id);
    if (!scenarios || scenarios.length === 0) { showToast('Scenario not found', 'error'); return; }
    var scenario = scenarios[0];
    var lanes = await cmFetchTable('fleet_lanes', 'scenario_id=eq.' + id + '&order=id.asc');

    // Map Supabase lanes into fmApp lane format (snake_case to match renderLanesTable)
    fmApp.lanes = (lanes || []).map(function(l) {
      return {
        origin: l.origin || '',
        destination: l.destination || '',
        weekly_shipments: l.weekly_shipments || 0,
        avg_weight: l.avg_weight_lbs || 0,
        avg_cube: l.avg_cube_ft3 || 0,
        delivery_window: l.delivery_window || '',
        distance_miles: l.distance_miles || 0
      };
    });

    // Restore config if stored on scenario
    if (scenario.config && typeof scenario.config === 'object') {
      fmApp.config = JSON.parse(JSON.stringify(scenario.config));
      fmApp.renderVehicleChecks();
    }

    // Re-render lanes table
    fmApp.renderLanesTable();
    fmApp.results = null;
    document.getElementById('fm-no-results').style.display = 'block';
    document.getElementById('fm-results-content').style.display = 'none';
    fmShowTab('lanes');

    showToast('Loaded scenario: ' + (scenario.scenario_name || scenario.name || 'Untitled'), 'success');
  } catch (e) {
    console.error('Error loading fleet scenario:', e);
    showToast('Error loading scenario', 'error');
  }
}

// ══════════════════════════════════════════════════════════════════════
// SECTION TOUR LAUNCHER
// ══════════════════════════════════════════════════════════════════════

// Section tour launcher — called from Guided Tour buttons
function startSectionTour(tourKey) {
  TourEngine.startTour(tourKey);
}
