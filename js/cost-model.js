// ═══════════════════════════════════════════════════════════════════
// COST MODEL BUILDER  —  extracted from index.html
// Contains: cmFetchTable, cmApiPost, cmApiPatch, cmApiDelete,
//           cmToggleDealGroup, cmInitDragDrop, cmCombineModels,
//           cmShowCombineModal, cmFinishCombine, dtRefreshMap,
//           dtNameField, dtDeleteScenario, dtCopyScenario,
//           dtSyncActiveTab, showDesignTool, cmApp, dealApp,
//           and DOMContentLoaded initialization.
// ═══════════════════════════════════════════════════════════════════

// ═══════════ COST MODEL DEAL GROUPING — DRAG & DROP + COMBINE ═══════════

function cmToggleDealGroup(dealId) {
  var exp = document.getElementById('cm-deal-expand-' + dealId);
  if (!exp) return;
  var stack = exp.previousElementSibling; // the .dt-deal-group-stack
  if (exp.style.display === 'none') {
    exp.style.display = 'block';
    if (stack) stack.style.display = 'none';
    // Re-init drag handlers inside expanded view
    cmInitDragDrop();
  } else {
    exp.style.display = 'none';
    if (stack) stack.style.display = 'block';
  }
}

function cmInitDragDrop() {
  var cards = document.querySelectorAll('#projectsList .dt-landing-card[draggable=true]');
  cards.forEach(function(card) {
    card.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', card.dataset.cmId);
      card.classList.add('cm-dragging');
      // Highlight potential drop targets
      setTimeout(function() {
        document.querySelectorAll('#projectsList .dt-landing-card[draggable=true], #projectsList .dt-deal-group').forEach(function(el) {
          if (el !== card) el.style.transition = 'all 0.2s ease';
        });
      }, 0);
    });
    card.addEventListener('dragend', function() {
      card.classList.remove('cm-dragging');
      document.querySelectorAll('.cm-drag-over').forEach(function(el) { el.classList.remove('cm-drag-over'); });
    });
    card.addEventListener('dragover', function(e) {
      e.preventDefault();
      if (!card.classList.contains('cm-dragging')) card.classList.add('cm-drag-over');
    });
    card.addEventListener('dragleave', function() {
      card.classList.remove('cm-drag-over');
    });
    card.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove('cm-drag-over');
      var dragId = parseInt(e.dataTransfer.getData('text/plain'), 10);
      var dropId = parseInt(card.dataset.cmId, 10);
      var dropDealId = card.dataset.dealId || null;
      if (dragId && dropId && dragId !== dropId) {
        cmCombineModels(dragId, dropId, dropDealId);
      }
    });
  });
}

async function cmCombineModels(dragId, dropId, existingDealId) {
  // If either model already has a deal, auto-merge into that deal
  if (existingDealId) {
    try {
      var resp = await fetch(SUPABASE_URL + '/rest/v1/cost_model_projects?id=eq.' + dragId, {
        method: 'PATCH', headers: API_HEADERS, body: JSON.stringify({ deal_deals_id: existingDealId })
      });
      if (!resp.ok) throw new Error('Failed to link model to deal');
      if (typeof netoptToast === 'function') netoptToast('Added to deal');
      if (typeof cmApp !== 'undefined' && cmApp.loadProjects) cmApp.loadProjects();
    } catch(e) {
      console.error('Error adding to deal:', e);
      alert('Error adding to deal: ' + (e.message || e));
    }
    return;
  }

  // Check if the dragged model has a deal
  try {
    var dragProjects = await cmFetchTable('cost_model_projects', 'id=eq.' + dragId);
    if (dragProjects.length > 0 && dragProjects[0].deal_deals_id) {
      // Auto-merge the drop model into the drag model's deal
      var resp = await fetch(SUPABASE_URL + '/rest/v1/cost_model_projects?id=eq.' + dropId, {
        method: 'PATCH', headers: API_HEADERS, body: JSON.stringify({ deal_deals_id: dragProjects[0].deal_deals_id })
      });
      if (!resp.ok) throw new Error('Failed to merge model into deal');
      if (typeof netoptToast === 'function') netoptToast('Added to deal');
      if (typeof cmApp !== 'undefined' && cmApp.loadProjects) cmApp.loadProjects();
      return;
    }
  } catch(e) { console.error('Error:', e); }

  // Neither has a deal — show the combine modal
  cmShowCombineModal(dragId, dropId);
}

async function cmShowCombineModal(modelAId, modelBId) {
  // Get model names from the cards
  var nameA = ''; var nameB = '';
  document.querySelectorAll('#projectsList .dt-landing-card[draggable=true]').forEach(function(c) {
    var id = parseInt(c.dataset.cmId, 10);
    var nameEl = c.querySelector('.dt-landing-card-name');
    if (id === modelAId && nameEl) nameA = nameEl.textContent;
    if (id === modelBId && nameEl) nameB = nameEl.textContent;
  });

  // Fetch existing client names for datalist
  var clientOptions = '';
  try {
    var existingDeals = await cmFetchTable('deal_deals', 'order=client_name.asc');
    var seenClients = {};
    existingDeals.forEach(function(d) {
      if (d.client_name && !seenClients[d.client_name]) {
        seenClients[d.client_name] = true;
        clientOptions += '<option value="' + d.client_name.replace(/"/g, '&quot;') + '">';
      }
    });
  } catch(e) { console.error('Error:', e); }

  var overlay = document.createElement('div');
  overlay.className = 'cm-combine-overlay';
  overlay.id = 'cmCombineOverlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML =
    '<div class="cm-combine-modal">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">' +
    '<div style="width:44px;height:44px;background:linear-gradient(135deg,var(--ies-blue),#1e5bb8);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
    '<svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7a2 2 0 012-2h14a2 2 0 012 2" stroke="#fff" stroke-width="1.5"/><path d="M9 11v6M15 11v6" stroke="#fff" stroke-width="1.2" opacity=".6"/></svg>' +
    '</div>' +
    '<div><div style="font-weight:700;font-size:16px;color:var(--ies-navy);">Create Deal</div>' +
    '<div style="font-size:12px;color:var(--ies-gray-500);">Combine cost models into a multi-site deal</div></div>' +
    '</div>' +
    '<div style="background:var(--ies-gray-50);border-radius:8px;padding:12px;margin-bottom:20px;font-size:12px;color:var(--ies-gray-600);">' +
    '<div style="font-weight:600;margin-bottom:4px;">Models to combine:</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
    '<span style="padding:3px 8px;background:#fff;border:1px solid var(--ies-gray-200);border-radius:6px;font-weight:500;">' + (nameA || 'Model ' + modelAId) + '</span>' +
    '<span style="padding:3px 8px;background:#fff;border:1px solid var(--ies-gray-200);border-radius:6px;font-weight:500;">' + (nameB || 'Model ' + modelBId) + '</span>' +
    '</div></div>' +
    '<div style="margin-bottom:14px;">' +
    '<label style="display:block;font-size:12px;font-weight:600;color:var(--ies-gray-600);text-transform:uppercase;margin-bottom:6px;">Deal Name</label>' +
    '<input type="text" id="cmCombineDealName" style="width:100%;padding:10px 12px;border:1px solid var(--ies-gray-300);border-radius:8px;font-family:Montserrat,sans-serif;font-size:14px;box-sizing:border-box;" placeholder="e.g., Acme Corp Multi-DC" autofocus>' +
    '</div>' +
    '<div style="margin-bottom:20px;">' +
    '<label style="display:block;font-size:12px;font-weight:600;color:var(--ies-gray-600);text-transform:uppercase;margin-bottom:6px;">Client Name</label>' +
    '<input type="text" id="cmCombineClientName" list="cmClientDatalist" style="width:100%;padding:10px 12px;border:1px solid var(--ies-gray-300);border-radius:8px;font-family:Montserrat,sans-serif;font-size:14px;box-sizing:border-box;" placeholder="e.g., Acme Corporation">' +
    '<datalist id="cmClientDatalist">' + clientOptions + '</datalist>' +
    '</div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
    '<button onclick="document.getElementById(\'cmCombineOverlay\').remove()" style="padding:10px 20px;background:var(--ies-gray-100);color:var(--ies-gray-600);border:1px solid var(--ies-gray-200);border-radius:8px;font-family:Montserrat,sans-serif;font-weight:600;font-size:13px;cursor:pointer;">Cancel</button>' +
    '<button onclick="cmFinishCombine(' + modelAId + ',' + modelBId + ')" style="padding:10px 20px;background:var(--ies-orange);color:#fff;border:none;border-radius:8px;font-family:Montserrat,sans-serif;font-weight:600;font-size:13px;cursor:pointer;">Create Deal</button>' +
    '</div></div>';

  document.body.appendChild(overlay);
  setTimeout(function() { var inp = document.getElementById('cmCombineDealName'); if (inp) inp.focus(); }, 100);
}

async function cmFinishCombine(modelAId, modelBId) {
  var dealName = (document.getElementById('cmCombineDealName').value || '').trim();
  var clientName = (document.getElementById('cmCombineClientName').value || '').trim();
  if (!dealName) { alert('Please enter a deal name'); return; }

  try {
    // Create the deal in deal_deals
    var result = await cmApiPost('deal_deals', {
      deal_name: dealName,
      client_name: clientName || null,
      deal_owner: null,
      status: 'Draft',
      notes: null
    });
    var newDealId = result[0].id;

    // Link both cost models to the deal
    var rA = await fetch(SUPABASE_URL + '/rest/v1/cost_model_projects?id=eq.' + modelAId, {
      method: 'PATCH', headers: API_HEADERS, body: JSON.stringify({ deal_deals_id: newDealId })
    });
    if (!rA.ok) console.error('Failed to link model A:', await rA.text());
    var rB = await fetch(SUPABASE_URL + '/rest/v1/cost_model_projects?id=eq.' + modelBId, {
      method: 'PATCH', headers: API_HEADERS, body: JSON.stringify({ deal_deals_id: newDealId })
    });
    if (!rB.ok) console.error('Failed to link model B:', await rB.text());

    // Close modal and refresh
    var overlay = document.getElementById('cmCombineOverlay');
    if (overlay) overlay.remove();

    if (typeof netoptToast === 'function') netoptToast('Deal created');
    cmApp.loadProjects();
  } catch(e) {
    console.error('Error creating deal:', e);
    alert('Error creating deal: ' + (e.message || e));
  }
}

// ═══════════ UNIFIED COPY & DELETE FOR ALL DESIGN TOOL LANDING CARDS ═══════════

// Map tool keys to their landing-page refresh functions
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

function dtSyncActiveTab(toolName) {
  // Sync active state across ALL tab bars (dt-tabs, cm tabs, fleet tabs)
  var allTabs = document.querySelectorAll('.dt-tab');
  for (var i = 0; i < allTabs.length; i++) {
    allTabs[i].classList.remove('active');
    // Match by trimmed text content (ignore badge spans)
    var label = allTabs[i].childNodes[0] ? allTabs[i].childNodes[0].textContent.trim() : allTabs[i].textContent.trim();
    if (label === toolName) {
      allTabs[i].classList.add('active');
    }
  }
}

function showDesignTool(panelId, tabEl) {
  // Cost model and fleet modeler redirect to their dedicated sections
  if (panelId === 'dt-costmodel') {
    dtSyncActiveTab('Cost Model');
    navigate('costmodel', document.querySelector('[data-section=costmodel]'));
    return;
  }
  if (panelId === 'dt-fleet') {
    dtSyncActiveTab('Fleet Modeler');
    navigate('fleet', document.querySelector('[data-section=designtools]'));
    return;
  }
  if (panelId === 'dt-most') {
    dtSyncActiveTab('MOST Standards');
    navigate('most', document.querySelector('[data-section=designtools]'));
    return;
  }
  var panels = document.querySelectorAll('.dt-panel');
  for (var i = 0; i < panels.length; i++) panels[i].style.display = 'none';
  var target = document.getElementById(panelId);
  if (target) target.style.display = 'block';

  // Determine tool name for syncing
  var toolNames = {
    'dt-landing': 'All Tools',
    'dt-network': 'Center of Gravity',
    'dt-netopt': 'Network Optimization',
    'dt-warehouse': 'Warehouse Sizing',
    'dt-deals': 'Multi-Site Deals'
  };
  if (toolNames[panelId]) {
    dtSyncActiveTab(toolNames[panelId]);
  } else {
    // Fallback: use the clicked tab element
    var tabs = document.querySelectorAll('.dt-tab');
    for (var j = 0; j < tabs.length; j++) {
      tabs[j].classList.remove('active');
    }
    if (tabEl) {
      tabEl.classList.add('active');
    }
  }
  // If switching to warehouse, show landing page
  if (panelId === 'dt-warehouse') { wscShowLanding(); }
  // If switching to network tool, show landing page
  if (panelId === 'dt-network') { netShowLanding(); }
  // If switching to netopt, show landing page
  if (panelId === 'dt-netopt') { netoptShowLanding(); }
  // If switching to deals, refresh deal list
  if (panelId === 'dt-deals') { dealApp.loadDeals(); }
}

// ═══════════ COST MODEL BUILDER JAVASCRIPT ═══════════
// SUPABASE_URL already declared in Hub globals above
const CM_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbG53Y3NocnBhbXpzeWJqbHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU3NzksImV4cCI6MjA5MDI5MTc3OX0.mj9TIj_rwxfbb9e2vBnA6hNYot5MX8-k1BbGfddAeJs';
const API_HEADERS = {
    'apikey': CM_SUPABASE_ANON,
    'Authorization': 'Bearer ' + CM_SUPABASE_ANON,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

async function cmFetchTable(tableName, params) {
    var url = SUPABASE_URL + '/rest/v1/' + tableName + '?select=*&order=id.asc';
    if (params) url += '&' + params;
    var resp = await fetch(url, { headers: API_HEADERS });
    if (!resp.ok) throw new Error(await resp.text());
    return await resp.json();
}

async function cmApiPost(table, body) {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
        method: 'POST', headers: Object.assign({}, API_HEADERS, {'Prefer':'return=representation'}),
        body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error(await resp.text());
    return await resp.json();
}

async function cmApiPatch(table, id, body) {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
        method: 'PATCH', headers: API_HEADERS, body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error(await resp.text());
}

async function cmApiDelete(table, id) {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
        method: 'DELETE', headers: API_HEADERS
    });
    if (!resp.ok) throw new Error(await resp.text());
}

// Global variable to track active cost model project for scenario linking
var activeCostModelProjectId = null;

// Main application
const cmApp = {
    currentProject: null,
    refData: {
        markets: [],
        allowanceProfiles: [],
        mostTemplates: [],
        mostElements: [],
        laborRates: [],
        facilityRates: [],
        utilityRates: [],
        equipmentCatalog: [],
        overheadRates: []
    },
    projectData: {
        laborLines: [],
        indirectLaborLines: [],
        equipmentLines: [],
        overheadLines: [],
        vasLines: [],
        startupLines: [],
        pricingBuckets: [],
        volumeLines: []
    },
    saveTimeout: null,

    // Formatting helpers
    fmtNum: function(val, decimals) {
        const n = parseFloat(val);
        if (isNaN(n)) return val || '—';
        return n.toLocaleString('en-US', { minimumFractionDigits: decimals || 0, maximumFractionDigits: decimals || 0 });
    },
    fmtCurrency: function(val) {
        const n = parseFloat(val);
        if (isNaN(n)) return '—';
        return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },
    fmtPercent: function(val, decimals) {
        const n = parseFloat(val);
        if (isNaN(n)) return '—';
        return n.toLocaleString('en-US', { minimumFractionDigits: decimals || 1, maximumFractionDigits: decimals || 1 }) + '%';
    },

    async init() {
        try {
            // Load all reference data
            await Promise.all([
                this.loadRefData('ref_markets', 'markets'),
                this.loadRefData('master_markets', 'masterMarkets'),
                this.loadRefData('ref_allowance_profiles', 'allowanceProfiles'),
                this.loadRefData('ref_most_templates', 'mostTemplates'),
                this.loadRefData('ref_most_elements', 'mostElements'),
                this.loadRefData('ref_labor_rates', 'laborRates'),
                this.loadRefData('ref_facility_rates', 'facilityRates'),
                this.loadRefData('ref_utility_rates', 'utilityRates'),
                this.loadRefData('ref_equipment', 'equipmentCatalog'),
                this.loadRefData('ref_overhead_rates', 'overheadRates')
            ]);

            // Seed default reference data if tables are empty
            this.seedDefaultReferenceData();

            // Safe helper — some elements may not exist if section hasn't rendered
            const _el = (id) => document.getElementById(id);
            const _on = (id, evt, fn) => { const el = _el(id); if (el) el.addEventListener(evt, fn); };

            // Setup event listeners
            _on('newModelBtn', 'click', () => this.newModel());
            _on('newModelBtnLanding', 'click', () => this.newModel());
            _on('projectSelector', 'change', (e) => this.openProject(e.target.value));

            // Setup sidebar navigation
            document.querySelectorAll('.cm-nav-item').forEach(item => {
                item.addEventListener('click', () => this.switchSection(item.dataset.section));
            });

            // Setup input listeners
            _on('modelName', 'input', () => this.markChanged());
            _on('modelDescription', 'input', () => this.markChanged());
            _on('market', 'change', () => { this.updateMarketInfo(); this.markChanged(); });
            _on('environment', 'change', () => this.markChanged());
            _on('allowanceProfile', 'change', () => { this.updateAllowanceInfo(); this.markChanged(); });

            // Volume inputs
            ['palletsReceived', 'casesReceived', 'palletsPutaway', 'casesPutaway', 'replenishments',
             'eachesPicked', 'casesPicked', 'palletsPicked', 'ordersPacked', 'palletsShipped',
             'returnsProcessed', 'vasUnits'].forEach(id => {
                _on(id, 'input', () => { this.updateVolumeDailyValues(); this.updateSqftSuggestion(); this.markChanged(); });
            });

            // Order profile
            ['linesPerOrder', 'unitsPerLine', 'orderWeight', 'singleLineOrderPct'].forEach(id => {
                _on(id, 'input', () => { this.updateOrderMetrics(); this.markChanged(); });
            });

            // Facility
            ['totalSqft', 'clearHeight', 'dockDoors', 'stagingSqft', 'officeSqft'].forEach(id => {
                _on(id, 'input', () => { this.updateFacilityMetrics(); this.markChanged(); });
            });

            // Shifts
            ['shiftsPerDay', 'hoursPerShift', 'daysPerWeek', 'weeksPerYear'].forEach(id => {
                _on(id, 'input', () => { this.updateShiftMetrics(); this.markChanged(); });
            });

            // Financial + Labor Cost Adjustments + Ramp
            ['targetMargin', 'contractTerm', 'volumeGrowth', 'startupCosts', 'pricingModel',
             'discountRate', 'reinvestRate', 'laborEscalation',
             'threshGrossMargin', 'threshEbitda', 'threshEbit', 'threshRoic', 'threshMirr', 'threshPayback',
             'overtimePct', 'benefitLoadPct', 'bonusPct', 'rampWeeksLow', 'rampWeeksMed', 'rampWeeksHigh'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', () => this.markChanged());
                    el.addEventListener('change', () => this.markChanged());
                }
            });

            // Seasonality inputs
            document.querySelectorAll('.cm-seasonality').forEach(inp => {
                inp.addEventListener('change', () => { this.updateSeasonalitySummary(); this.markChanged(); });
                inp.addEventListener('input', () => { this.updateSeasonalitySummary(); });
            });

            // Populate dropdowns
            this.populateMarketDropdown();
            this.populateAllowanceDropdown();

            // Load projects list
            await this.loadProjects();

        } catch (error) {
            console.warn('Cost Model init warning:', error.message);
        }
    },

    async loadRefData(table, key) {
        try {
            this.refData[key] = await cmFetchTable(table);
        } catch (error) {
            console.error(`Error loading ${table}:`, error);
            this.refData[key] = [];
        }
    },

    seedDefaultReferenceData() {
        if (this.refData.facilityRates.length === 0) {
            this.refData.facilityRates = [
                { market_id: 'northeast', region: 'Northeast', lease_rate_psf_yr: 8.50, cam_rate_psf_yr: 2.00, tax_rate_psf_yr: 1.50, insurance_rate_psf_yr: 0.50 },
                { market_id: 'southeast', region: 'Southeast', lease_rate_psf_yr: 5.75, cam_rate_psf_yr: 1.50, tax_rate_psf_yr: 1.00, insurance_rate_psf_yr: 0.50 },
                { market_id: 'midwest', region: 'Midwest', lease_rate_psf_yr: 5.00, cam_rate_psf_yr: 1.25, tax_rate_psf_yr: 1.00, insurance_rate_psf_yr: 0.25 },
                { market_id: 'west-coast', region: 'West Coast', lease_rate_psf_yr: 10.50, cam_rate_psf_yr: 2.50, tax_rate_psf_yr: 1.50, insurance_rate_psf_yr: 0.50 },
                { market_id: 'southwest', region: 'Southwest', lease_rate_psf_yr: 6.50, cam_rate_psf_yr: 1.50, tax_rate_psf_yr: 1.00, insurance_rate_psf_yr: 0.50 }
            ];
        }
        if (this.refData.laborRates.length === 0) {
            this.refData.laborRates = [
                { market_id: 'northeast', role_category: 'Direct', role_name: 'Picker', hourly_rate: 19.50, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'northeast', role_category: 'Direct', role_name: 'Receiver', hourly_rate: 19.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'northeast', role_category: 'Indirect', role_name: 'Team Lead', hourly_rate: 24.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'northeast', role_category: 'Indirect', role_name: 'Supervisor', hourly_rate: 28.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'northeast', role_category: 'Indirect', role_name: 'Manager', hourly_rate: 42.00, burden_pct: 32, default_benefit_load_pct: 32, default_bonus_pct: 5 },
                { market_id: 'northeast', role_category: 'Support', role_name: 'Inventory Control', hourly_rate: 20.50, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southeast', role_category: 'Direct', role_name: 'Picker', hourly_rate: 17.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southeast', role_category: 'Direct', role_name: 'Receiver', hourly_rate: 16.75, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southeast', role_category: 'Indirect', role_name: 'Team Lead', hourly_rate: 22.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southeast', role_category: 'Indirect', role_name: 'Supervisor', hourly_rate: 26.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southeast', role_category: 'Indirect', role_name: 'Manager', hourly_rate: 40.00, burden_pct: 32, default_benefit_load_pct: 32, default_bonus_pct: 5 },
                { market_id: 'southeast', role_category: 'Support', role_name: 'Inventory Control', hourly_rate: 18.50, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'midwest', role_category: 'Direct', role_name: 'Picker', hourly_rate: 18.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'midwest', role_category: 'Direct', role_name: 'Receiver', hourly_rate: 17.75, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'midwest', role_category: 'Indirect', role_name: 'Team Lead', hourly_rate: 23.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'midwest', role_category: 'Indirect', role_name: 'Supervisor', hourly_rate: 27.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'midwest', role_category: 'Indirect', role_name: 'Manager', hourly_rate: 40.50, burden_pct: 32, default_benefit_load_pct: 32, default_bonus_pct: 5 },
                { market_id: 'midwest', role_category: 'Support', role_name: 'Inventory Control', hourly_rate: 19.50, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'west-coast', role_category: 'Direct', role_name: 'Picker', hourly_rate: 21.50, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'west-coast', role_category: 'Direct', role_name: 'Receiver', hourly_rate: 21.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'west-coast', role_category: 'Indirect', role_name: 'Team Lead', hourly_rate: 26.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'west-coast', role_category: 'Indirect', role_name: 'Supervisor', hourly_rate: 30.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'west-coast', role_category: 'Indirect', role_name: 'Manager', hourly_rate: 45.00, burden_pct: 32, default_benefit_load_pct: 32, default_bonus_pct: 5 },
                { market_id: 'west-coast', role_category: 'Support', role_name: 'Inventory Control', hourly_rate: 22.50, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southwest', role_category: 'Direct', role_name: 'Picker', hourly_rate: 17.50, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southwest', role_category: 'Direct', role_name: 'Receiver', hourly_rate: 17.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southwest', role_category: 'Indirect', role_name: 'Team Lead', hourly_rate: 22.50, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southwest', role_category: 'Indirect', role_name: 'Supervisor', hourly_rate: 26.50, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 },
                { market_id: 'southwest', role_category: 'Indirect', role_name: 'Manager', hourly_rate: 40.50, burden_pct: 32, default_benefit_load_pct: 32, default_bonus_pct: 5 },
                { market_id: 'southwest', role_category: 'Support', role_name: 'Inventory Control', hourly_rate: 19.00, burden_pct: 35, default_benefit_load_pct: 35, default_bonus_pct: 0 }
            ];
        }
        if (this.refData.utilityRates.length === 0) {
            this.refData.utilityRates = [
                { market_id: 'ambient', environment: 'Ambient', avg_monthly_per_sqft: 0.125 },
                { market_id: 'cooler', environment: 'Cooler', avg_monthly_per_sqft: 0.292 },
                { market_id: 'freezer', environment: 'Freezer', avg_monthly_per_sqft: 0.500 }
            ];
        }
        if (this.refData.equipmentCatalog.length === 0) {
            this.refData.equipmentCatalog = [
                { category: 'Material Handling', equipment_name: 'Forklift (Sit-Down)', monthly_lease: 750, monthly_maintenance: 150, acquisition_cost: 0 },
                { category: 'Material Handling', equipment_name: 'Reach Truck', monthly_lease: 950, monthly_maintenance: 175, acquisition_cost: 0 },
                { category: 'Material Handling', equipment_name: 'Pallet Jack (Electric)', monthly_lease: 350, monthly_maintenance: 75, acquisition_cost: 0 },
                { category: 'Material Handling', equipment_name: 'Order Picker', monthly_lease: 1100, monthly_maintenance: 200, acquisition_cost: 0 },
                { category: 'Material Handling', equipment_name: 'Walkie Stacker', monthly_lease: 600, monthly_maintenance: 125, acquisition_cost: 0 },
                { category: 'IT Equipment', equipment_name: 'RF Scanner', monthly_lease: 85, monthly_maintenance: 15, acquisition_cost: 0 },
                { category: 'IT Equipment', equipment_name: 'Mobile Computer (Vehicle Mount)', monthly_lease: 120, monthly_maintenance: 25, acquisition_cost: 0 },
                { category: 'IT Equipment', equipment_name: 'Pick-to-Light Module', monthly_lease: 200, monthly_maintenance: 50, acquisition_cost: 0 }
            ];
        }
        if (this.refData.overheadRates.length === 0) {
            this.refData.overheadRates = [
                { category: 'Facilities', description: 'Janitorial, HVAC maint, pest control (IFMA benchmark)', monthly_cost: 0.15, cost_type: 'monthly' },
                { category: 'Facilities', description: 'Property & general liability insurance (Insureon benchmark)', monthly_cost: 0.25, cost_type: 'monthly' },
                { category: 'Administration', description: 'Office supplies, postage, small tools', annual_cost: 5000, cost_type: 'annual' },
                { category: 'IT Systems', description: 'WMS license, RF terminals, network infrastructure', annual_cost: 35000, cost_type: 'annual' },
                { category: 'Compliance', description: 'Safety training, certifications, compliance audit', annual_cost: 8000, cost_type: 'annual' },
                { category: 'Quality', description: 'Cycle counts, audits, quality assurance programs', annual_cost: 12000, cost_type: 'annual' }
            ];
        }
    },

    async loadProjects() {
        try {
            const projects = await cmFetchTable('cost_model_projects', 'limit=100');
            // Also fetch deals for grouping
            var deals = [];
            try { deals = await cmFetchTable('deal_deals', 'order=deal_name.asc'); } catch(e) { console.error('Error:', e); }
            var dealMap = {};
            deals.forEach(function(d) { dealMap[d.id] = d; });

            const selector = document.getElementById('projectSelector');
            selector.innerHTML = '<option value="">-- New Model --</option>';

            const projectsList = document.getElementById('projectsList');
            projectsList.innerHTML = '';

            if (projects.length === 0) {
                dtToggleLandingEmpty('cm-landing-actions', 'emptyState', true);
            } else {
                dtToggleLandingEmpty('cm-landing-actions', 'emptyState', false);

                // Populate project selector (all projects, flat)
                projects.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.name;
                    selector.appendChild(opt);
                });

                // Group projects by deal_deals_id (UUID link to deal_deals)
                var grouped = {}; // deal_deals_id → [projects]
                var ungrouped = [];
                projects.forEach(function(p) {
                    if (p.deal_deals_id && dealMap[p.deal_deals_id]) {
                        if (!grouped[p.deal_deals_id]) grouped[p.deal_deals_id] = [];
                        grouped[p.deal_deals_id].push(p);
                    } else {
                        ungrouped.push(p);
                    }
                });

                // Render deal group cards first
                var self = this;
                Object.keys(grouped).forEach(function(dealId) {
                    var deal = dealMap[dealId];
                    var models = grouped[dealId];
                    var totalCost = models.reduce(function(s,m){ return s + (parseFloat(m.total_annual_cost) || 0); }, 0);

                    var groupEl = document.createElement('div');
                    groupEl.className = 'dt-deal-group';
                    groupEl.dataset.dealId = dealId;
                    groupEl.setAttribute('data-cm-group', 'true');

                    // Drag-over support for groups (to add models to existing deals)
                    groupEl.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('cm-drag-over'); });
                    groupEl.addEventListener('dragleave', function(e) { this.classList.remove('cm-drag-over'); });
                    groupEl.addEventListener('drop', function(e) {
                        e.preventDefault();
                        this.classList.remove('cm-drag-over');
                        var dragId = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (dragId) cmCombineModels(dragId, null, dealId);
                    });

                    var modelPills = models.map(function(m) {
                        return '<span>' + (m.name || 'Untitled') + '</span>';
                    }).join('');

                    groupEl.innerHTML =
                        '<div class="dt-deal-group-stack" onclick="cmToggleDealGroup(\'' + dealId + '\')">' +
                        '<div class="dt-deal-group-card">' +
                        '<div class="dt-deal-group-badge"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7a2 2 0 012-2h14a2 2 0 012 2" stroke="currentColor" stroke-width="1.5"/></svg> Multi-Site Deal &middot; ' + models.length + ' Sites</div>' +
                        '<div style="font-weight:800;font-size:17px;color:var(--ies-navy);margin-bottom:4px;">' + esc(deal.deal_name || 'Deal') + '</div>' +
                        '<div class="dt-landing-card-metric" style="font-weight:700;color:var(--ies-navy);font-size:15px;margin-bottom:6px;">$' + totalCost.toLocaleString('en-US', {maximumFractionDigits: 0}) + '/yr <span style="font-size:11px;font-weight:500;color:var(--ies-gray-500);">combined cost</span></div>' +
                        '<div class="dt-landing-card-meta">' + (deal.client_name || '') + (deal.status ? ' &middot; <span style="font-weight:700;">' + deal.status + '</span>' : '') + '</div>' +
                        '<div class="dt-deal-group-models">' + modelPills + '</div>' +
                        '</div></div>';

                    // Expanded view (hidden initially)
                    var expandEl = document.createElement('div');
                    expandEl.id = 'cm-deal-expand-' + dealId;
                    expandEl.className = 'dt-deal-group-expanded';
                    expandEl.style.display = 'none';

                    var expandHeader = '<div class="dt-deal-group-expanded-header">' +
                        '<div><span style="font-weight:700;font-size:14px;color:var(--ies-navy);">' + (deal.deal_name || 'Deal') + '</span>' +
                        '<span style="font-size:12px;color:var(--ies-gray-500);margin-left:8px;">' + models.length + ' model' + (models.length > 1 ? 's' : '') + '</span></div>' +
                        '<div style="display:flex;gap:8px;">' +
                        '<button onclick="navigate(\'designtools\'); setTimeout(function(){ showDesignTool(\'dt-deals\', document.querySelectorAll(\'#dt-tabs .dt-tab\')[2]); setTimeout(function(){ dealApp.openDeal(\'' + dealId + '\'); },100); },50)" style="padding:4px 12px;background:var(--ies-blue);color:#fff;border:none;border-radius:6px;font-family:Montserrat,sans-serif;font-size:11px;font-weight:600;cursor:pointer;">Open in Multi-Site Deals</button>' +
                        '<button onclick="cmToggleDealGroup(\'' + dealId + '\')" style="padding:4px 12px;background:var(--ies-gray-100);color:var(--ies-gray-600);border:1px solid var(--ies-gray-200);border-radius:6px;font-family:Montserrat,sans-serif;font-size:11px;font-weight:600;cursor:pointer;">Collapse</button>' +
                        '</div></div>';

                    var expandGrid = '<div class="dt-deal-group-expanded-grid">';
                    models.forEach(function(m) {
                        var market = self.getMarketDisplayName(m.market_id);
                        expandGrid += '<div class="dt-landing-card" draggable="true" data-cm-id="' + m.id + '" data-deal-id="' + dealId + '">' +
                            '<div style="cursor:pointer;" onclick="cmApp.openProject(' + m.id + ')">' +
                            '<div class="dt-landing-card-name">' + (m.name || 'Untitled') + '</div>' +
                            '<div class="dt-landing-card-meta">' + market + '</div>' +
                            '<div class="dt-landing-card-metric">$' + (m.total_annual_cost || 0).toLocaleString('en-US', {maximumFractionDigits: 0}) + '/yr</div>' +
                            '<div class="dt-landing-card-meta">' + new Date(m.created_at).toLocaleDateString() + '</div>' +
                            '</div>' +
                            '<div class="dt-landing-card-actions">' +
                            '<button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario(\'cost_model_projects\',' + m.id + ',\'costmodel\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>' +
                            '<button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario(\'cost_model_projects\',' + m.id + ',\'costmodel\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>' +
                            '</div></div>';
                    });
                    expandGrid += '</div>';
                    expandEl.innerHTML = expandHeader + expandGrid;

                    groupEl.appendChild(expandEl);
                    projectsList.appendChild(groupEl);
                });

                // Render ungrouped cards (draggable)
                ungrouped.forEach(p => {
                    var market = this.getMarketDisplayName(p.market_id);
                    const card = document.createElement('div');
                    card.className = 'dt-landing-card';
                    card.setAttribute('draggable', 'true');
                    card.dataset.cmId = p.id;
                    card.dataset.dealId = '';
                    card.innerHTML = `
                        <div style="cursor:pointer;" onclick="cmApp.openProject(${p.id})">
                        <div class="dt-landing-card-name">${esc(p.name || 'Untitled')}</div>
                        <div class="dt-landing-card-meta">${esc(market)}</div>
                        <div class="dt-landing-card-metric">$${(p.total_annual_cost || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}/yr</div>
                        <div class="dt-landing-card-meta">${new Date(p.created_at).toLocaleDateString()}</div>
                        </div>
                        <div class="dt-landing-card-actions">
                        <button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario('cost_model_projects',${p.id},'costmodel')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>
                        <button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario('cost_model_projects',${p.id},'costmodel')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>
                        </div>
                    `;
                    projectsList.appendChild(card);
                });

                // Attach drag handlers to all draggable cards
                cmInitDragDrop();
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            showSectionError('sec-costmodel', 'Failed to load cost model projects. Check your connection and try refreshing.');
        }
    },

    async newModel() {
        this.currentProject = null;
        this.projectData = {
            laborLines: [],
            indirectLaborLines: [],
            equipmentLines: [],
            overheadLines: [],
            vasLines: [],
            startupLines: [],
            pricingBuckets: [],
            volumeLines: [],
            facilityRateOverrides: {}
        };
        this.preseedVolumeLines();
        this.initDefaultBuckets();

        // Clear all inputs
        document.getElementById('modelName').value = '';
        document.getElementById('modelDescription').value = '';
        document.getElementById('market').value = '';
        document.getElementById('environment').value = 'ambient';
        document.getElementById('allowanceProfile').value = '';

        ['palletsReceived', 'casesReceived', 'palletsPutaway', 'casesPutaway', 'replenishments',
         'eachesPicked', 'casesPicked', 'palletsPicked', 'ordersPacked', 'palletsShipped',
         'returnsProcessed', 'vasUnits', 'linesPerOrder', 'unitsPerLine', 'orderWeight', 'singleLineOrderPct',
         'totalSqft', 'clearHeight', 'dockDoors', 'stagingSqft', 'officeSqft',
         'shiftsPerDay', 'hoursPerShift', 'daysPerWeek', 'weeksPerYear',
         'targetMargin', 'contractTerm', 'volumeGrowth', 'startupCosts'].forEach(id => {
            document.getElementById(id).value = '';
        });

        document.getElementById('landingPage').style.display = 'none';
        document.getElementById('topbarControls').style.display = 'flex';
        document.getElementById('editorContainer').style.display = 'flex';
        document.getElementById('projectSelector').value = '';

        // Clear project context for scenario linking
        activeCostModelProjectId = null;
        wscActiveScenarioId = null;
        netActiveScenarioId = null;

        // Hide project link indicators (bars stay visible for standalone use)
        var wscLink = document.getElementById('wsc-project-link');
        var netLink = document.getElementById('net-project-link');
        if (wscLink) wscLink.style.display = 'none';
        if (netLink) netLink.style.display = 'none';

        // Refresh scenario lists to show standalone scenarios
        wscRefreshScenarioList(null);
        netRefreshScenarioList(null);
        netoptRefreshScenarioList(null);

        this.switchSection('setup');
    },

    goBackToLanding() {
        document.getElementById('editorContainer').style.display = 'none';
        document.getElementById('landingPage').style.display = 'block';
        document.getElementById('topbarControls').style.display = 'none';
        this.loadProjects();
    },

    async openProject(id) {
        try {
            const projects = await cmFetchTable('cost_model_projects', 'id=eq.' + id);
            if (projects.length === 0) return;

            const p = projects[0];
            this.currentProject = p;

            // Load project data
            await this.loadProjectData(id);

            // Migrate legacy volumes to volume lines if needed
            if (this.projectData.volumeLines.length === 0) {
                const legacyMap = [
                    { name: 'Pallets Received', uom: 'pallet', process_area: 'Receiving', field: 'vol_pallets_received' },
                    { name: 'Cases Received', uom: 'case', process_area: 'Receiving', field: 'vol_cases_received' },
                    { name: 'Pallets Putaway', uom: 'pallet', process_area: 'Putaway', field: 'vol_pallets_putaway' },
                    { name: 'Cases Putaway', uom: 'case', process_area: 'Putaway', field: 'vol_cases_putaway' },
                    { name: 'Replenishments', uom: 'pallet', process_area: 'Replenishment', field: 'vol_replenishments' },
                    { name: 'Eaches Picked', uom: 'each', process_area: 'Picking', field: 'vol_eaches_picked' },
                    { name: 'Cases Picked', uom: 'case', process_area: 'Picking', field: 'vol_cases_picked' },
                    { name: 'Pallets Picked', uom: 'pallet', process_area: 'Picking', field: 'vol_pallets_picked' },
                    { name: 'Orders Packed', uom: 'order', process_area: 'Packing', field: 'vol_orders_packed' },
                    { name: 'Pallets Shipped', uom: 'pallet', process_area: 'Shipping', field: 'vol_pallets_shipped' },
                    { name: 'Returns Processed', uom: 'each', process_area: 'Returns', field: 'vol_returns_processed' },
                    { name: 'VAS Units', uom: 'unit', process_area: 'VAS', field: 'vol_vas_units' }
                ];
                legacyMap.forEach(m => {
                    const val = parseFloat(p[m.field]) || 0;
                    if (val > 0) {
                        this.projectData.volumeLines.push({
                            name: m.name, uom: m.uom, process_area: m.process_area,
                            annual_volume: val, daily_volume: 0
                        });
                    }
                });
                // If no volumes migrated, seed with defaults
                if (this.projectData.volumeLines.length === 0) {
                    this.preseedVolumeLines();
                }
            }

            // Populate form
            document.getElementById('modelName').value = p.name || '';
            document.getElementById('modelDescription').value = p.description || '';
            document.getElementById('market').value = p.market_id || '';
            document.getElementById('environment').value = p.environment_type || 'ambient';
            document.getElementById('allowanceProfile').value = p.allowance_profile_id || '';

            // Volumes
            document.getElementById('palletsReceived').value = p.vol_pallets_received || '';
            document.getElementById('casesReceived').value = p.vol_cases_received || '';
            document.getElementById('palletsPutaway').value = p.vol_pallets_putaway || '';
            document.getElementById('casesPutaway').value = p.vol_cases_putaway || '';
            document.getElementById('replenishments').value = p.vol_replenishments || '';
            document.getElementById('eachesPicked').value = p.vol_eaches_picked || '';
            document.getElementById('casesPicked').value = p.vol_cases_picked || '';
            document.getElementById('palletsPicked').value = p.vol_pallets_picked || '';
            document.getElementById('ordersPacked').value = p.vol_orders_packed || '';
            document.getElementById('palletsShipped').value = p.vol_pallets_shipped || '';
            document.getElementById('returnsProcessed').value = p.vol_returns_processed || '';
            document.getElementById('vasUnits').value = p.vol_vas_units || '';

            // Order profile
            document.getElementById('linesPerOrder').value = p.avg_lines_per_order || '';
            document.getElementById('unitsPerLine').value = p.avg_units_per_line || '';
            document.getElementById('orderWeight').value = p.avg_order_weight_lbs || '';
            document.getElementById('singleLineOrderPct').value = p.pct_single_line_orders || '';

            // Facility
            document.getElementById('totalSqft').value = p.facility_sqft || '';
            document.getElementById('clearHeight').value = p.clear_height_ft || '';
            document.getElementById('dockDoors').value = p.dock_doors || '';
            document.getElementById('stagingSqft').value = p.staging_sqft || '';
            document.getElementById('officeSqft').value = p.office_sqft || '';

            // Shifts
            document.getElementById('shiftsPerDay').value = p.shifts_per_day || '';
            document.getElementById('hoursPerShift').value = p.hours_per_shift || '';
            document.getElementById('daysPerWeek').value = p.days_per_week || '';
            document.getElementById('weeksPerYear').value = p.operating_weeks_per_year || '';

            // Shift premiums & absence
            document.getElementById('shift2Premium').value = p.shift_2_premium != null ? (p.shift_2_premium * 100) : '';
            document.getElementById('shift3Premium').value = p.shift_3_premium != null ? (p.shift_3_premium * 100) : '';
            document.getElementById('absenceAllowance').value = p.absence_allowance_pct != null ? (p.absence_allowance_pct * 100) : '';

            // Facility rate overrides
            try {
                this.projectData.facilityRateOverrides = typeof p.facility_rate_overrides === 'string' ? JSON.parse(p.facility_rate_overrides) : (p.facility_rate_overrides || {});
            } catch(e) { console.warn('Failed to parse facility_rate_overrides, resetting to defaults:', e.message); this.projectData.facilityRateOverrides = {}; }

            // Financial
            document.getElementById('targetMargin').value = p.target_margin_pct || '';
            document.getElementById('contractTerm').value = p.contract_term_years || '';
            document.getElementById('volumeGrowth').value = p.annual_volume_growth_pct || '';
            document.getElementById('startupCosts').value = p.startup_cost || '';
            document.getElementById('pricingModel').value = p.pricing_model || 'all-in';

            // Labor cost adjustments
            document.getElementById('overtimePct').value = p.overtime_pct != null ? p.overtime_pct : 5;
            document.getElementById('benefitLoadPct').value = p.benefit_load_pct != null ? p.benefit_load_pct : 35;
            document.getElementById('bonusPct').value = p.bonus_pct != null ? p.bonus_pct : 0;
            document.getElementById('laborEscalation').value = p.labor_escalation_pct != null ? p.labor_escalation_pct : 3;
            document.getElementById('rampWeeksLow').value = p.ramp_weeks_low || 2;
            document.getElementById('rampWeeksMed').value = p.ramp_weeks_med || 4;
            document.getElementById('rampWeeksHigh').value = p.ramp_weeks_high || 8;

            // Seasonality
            try {
                var sp = typeof p.seasonality_profile === 'string' ? JSON.parse(p.seasonality_profile) : p.seasonality_profile;
                this.setSeasonalityProfile(sp);
            } catch(e) { console.warn('Failed to parse seasonality_profile, resetting:', e.message); this.setSeasonalityProfile(null); }

            // Update computed values
            this.updateVolumeDailyValues();
            this.updateOrderMetrics();
            this.updateFacilityMetrics();
            this.updateShiftMetrics();
            this.updateMarketInfo();
            this.updateAllowanceInfo();

            // Render tables and run full recalculation chain
            this.renderVolumeLines();
            this.recalculateLabor();
            this.renderLaborTable();
            this.renderIndirectLaborTable();
            this.updateLaborTotals();
            this.autoGenerateEquipment();
            this.renderEquipmentTable();
            this.autoGenerateOverhead();
            this.renderOverheadTable();
            this.renderVasTable();
            this.autoGenerateStartup();
            this.renderStartupTable();
            this.initDefaultBuckets();
            this.renderPricingBuckets();

            // Show editor
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('topbarControls').style.display = 'flex';
            document.getElementById('editorContainer').style.display = 'flex';
            document.getElementById('projectSelector').value = id;

            // Update status
            const statusMap = { draft: 'cm-status-draft', in_review: 'cm-status-review', approved: 'cm-status-approved' };
            const badge = document.getElementById('statusBadge');
            badge.className = 'cm-status-badge ' + (statusMap[p.status] || 'cm-status-draft');
            badge.textContent = (p.status || 'draft').toUpperCase();
            badge.style.visibility = 'visible';

            // Set active project context for scenario linking
            activeCostModelProjectId = id;

            // Set deal selector if project is linked to a deal
            // Ensure deals are loaded first (they may not be if page just loaded)
            var cmDealSel = document.getElementById('cmDealSelector');
            if (cmDealSel && p.deal_deals_id) {
                // If selector has no options yet, reload deals first
                if (cmDealSel.options.length <= 1) {
                    await daLoadDealsForSelector();
                }
                cmDealSel.value = String(p.deal_deals_id);
                // If value didn't stick (option doesn't exist), try once more after a delay
                if (cmDealSel.value !== String(p.deal_deals_id)) {
                    setTimeout(function() {
                        cmDealSel.value = String(p.deal_deals_id);
                    }, 500);
                }
            } else if (cmDealSel) {
                cmDealSel.value = '';
            }

            // Show project link indicators for WSC and Network tools
            var wscLink = document.getElementById('wsc-project-link');
            var netLink = document.getElementById('net-project-link');
            if (wscLink) {
                wscLink.style.display = 'block';
                document.getElementById('wsc-project-link-name').textContent = p.name || 'Project';
            }
            if (netLink) {
                netLink.style.display = 'block';
                document.getElementById('net-project-link-name').textContent = p.name || 'Project';
            }

            // Load existing scenarios for all tools
            wscRefreshScenarioList(id);
            netRefreshScenarioList(id);
            netoptRefreshScenarioList(id);

            this.switchSection('setup');

        } catch (error) {
            console.error('Error opening project:', error);
            alert('Error loading project');
        }
    },

    async loadProjectData(projectId) {
        try {
            const [labor, equipment, overhead, vas, volumes] = await Promise.all([
                cmFetchTable('cost_model_labor', 'project_id=eq.' + projectId),
                cmFetchTable('cost_model_equipment', 'project_id=eq.' + projectId),
                cmFetchTable('cost_model_overhead', 'project_id=eq.' + projectId),
                cmFetchTable('cost_model_vas', 'project_id=eq.' + projectId),
                cmFetchTable('cost_model_volumes', 'project_id=eq.' + projectId).catch(() => [])
            ]);

            this.projectData.laborLines = labor;
            this.projectData.indirectLaborLines = []; // generated by MOST engine, not stored separately
            this.projectData.equipmentLines = equipment;
            this.projectData.overheadLines = overhead;
            this.projectData.vasLines = vas;
            this.projectData.volumeLines = volumes || [];
        } catch (error) {
            console.error('Error loading project data:', error);
        }
    },

    // Resolve market display name from UUID — checks master_markets first, then ref_markets
    getMarketDisplayName(marketUuid) {
        if (!marketUuid) return 'N/A';
        // Try master_markets via ref_market_uuid
        const mm = (this.refData.masterMarkets || []).find(m => m.ref_market_uuid === marketUuid);
        if (mm) return mm.city + ', ' + (mm.state || '');
        // Fallback to ref_markets
        const rm = (this.refData.markets || []).find(m => m.id === marketUuid);
        if (rm) return rm.name;
        return 'N/A';
    },

    populateMarketDropdown() {
        const select = document.getElementById('market');
        // Use master_markets (admin-managed) as source of truth, map to ref_market_uuid for rate lookups
        const mm = (this.refData.masterMarkets || []).slice().sort((a, b) => (a.city || '').localeCompare(b.city || ''));
        if (mm.length > 0) {
            mm.forEach(m => {
                if (!m.ref_market_uuid) return; // skip markets without rate data bridge
                const opt = document.createElement('option');
                opt.value = m.ref_market_uuid; // UUID for rate table compatibility
                opt.textContent = m.city + ', ' + (m.state || '');
                opt.dataset.masterId = m.id;
                select.appendChild(opt);
            });
        } else {
            // Fallback to legacy ref_markets if master_markets not available
            this.refData.markets.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name;
                select.appendChild(opt);
            });
        }
    },

    populateAllowanceDropdown() {
        const select = document.getElementById('allowanceProfile');
        this.refData.allowanceProfiles.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.profile_name;
            select.appendChild(opt);
        });
    },

    updateMarketInfo() {
        const marketId = document.getElementById('market').value; // UUID from ref_markets
        const info = this.refData.markets.find(m => m.id == marketId);
        const masterInfo = (this.refData.masterMarkets || []).find(m => m.ref_market_uuid == marketId);
        const card = document.getElementById('marketInfo');

        if (info || masterInfo) {
            // Pull facility and labor data for this market (using UUID)
            const facilityRate = this.refData.facilityRates.find(f => f.market_id == marketId);
            const marketLabor = this.refData.laborRates.filter(r => r.market_id == marketId);
            const avgRate = marketLabor.length > 0 ? marketLabor.reduce((s, r) => s + parseFloat(r.hourly_rate || 0), 0) / marketLabor.length : 0;
            const totalOccupancy = facilityRate ? (parseFloat(facilityRate.lease_rate_psf_yr || 0) + parseFloat(facilityRate.cam_rate_psf_yr || 0) + parseFloat(facilityRate.tax_rate_psf_yr || 0) + parseFloat(facilityRate.insurance_rate_psf_yr || 0)) : 0;

            // Auto-populate market defaults for OT% and benefit load%
            const defaultOT = (info && info.default_overtime_pct != null) ? info.default_overtime_pct : 5;
            const avgBenefitLoad = marketLabor.length > 0 ? marketLabor.reduce((s, r) => s + parseFloat(r.default_benefit_load_pct || 35), 0) / marketLabor.length : 35;
            const avgBonus = marketLabor.length > 0 ? marketLabor.reduce((s, r) => s + parseFloat(r.default_bonus_pct || 0), 0) / marketLabor.length : 0;
            document.getElementById('overtimePct').value = defaultOT;
            document.getElementById('benefitLoadPct').value = avgBenefitLoad.toFixed(1);
            document.getElementById('bonusPct').value = avgBonus.toFixed(1);

            // Display name from master_markets (City, ST — Region) or fallback to ref_markets
            const displayName = masterInfo ? (masterInfo.city + ', ' + (masterInfo.state || '')) : (info ? info.name : '');
            const region = masterInfo ? (masterInfo.region || '') : (info ? (info.region || '') : '');
            const hasRates = marketLabor.length > 0 || facilityRate;

            card.innerHTML = `
                <div class="cm-info-card-title">${displayName}${region ? ' — ' + region : ''}</div>
                ${hasRates ? `<div>Avg Labor Rate: ${fmtNum(avgRate, 2, '$')}/hr (${marketLabor.length} roles)</div>
                <div>Occupancy Cost: ${fmtNum(totalOccupancy, 2, '$')}/sqft/yr</div>
                <div>Default OT: ${defaultOT}% · Benefit Load: ${fmtNum(avgBenefitLoad, 1)}%</div>` :
                `<div style="color:var(--ies-gray-500);font-style:italic;">No rate data yet — add rates in Admin &gt; Reference Data</div>`}
            `;
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    },

    updateAllowanceInfo() {
        const profileId = document.getElementById('allowanceProfile').value;
        const info = this.refData.allowanceProfiles.find(a => a.id == profileId);
        const card = document.getElementById('allowanceInfo');

        if (info) {
            const totalPfd = (info.total_pfd_pct || 0) + (info.ergonomic_adjustment_pct || 0);
            card.innerHTML = `
                <div class="cm-info-card-title">${info.profile_name}</div>
                <div>Total PFD: ${fmtNum(totalPfd, 1)}%</div>
                <div>Base PFD: ${info.total_pfd_pct || 0}% + Ergonomic: ${info.ergonomic_adjustment_pct || 0}%</div>
            `;
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    },

    updateVolumeDailyValues() {
        const operatingDays = this.getOperatingDays();
        const volumes = {
            palletsReceived: 'palletsReceivedDaily',
            casesReceived: 'casesReceivedDaily',
            palletsPutaway: 'palletsPutawayDaily',
            casesPutaway: 'casesPutawayDaily',
            replenishments: 'replenishmentsDaily',
            eachesPicked: 'eachesPickedDaily',
            casesPicked: 'casesPickedDaily',
            palletsPicked: 'palletsPickedDaily',
            ordersPacked: 'ordersPackedDaily',
            palletsShipped: 'palletsShippedDaily',
            returnsProcessed: 'returnsProcessedDaily',
            vasUnits: 'vasUnitsDaily'
        };

        Object.entries(volumes).forEach(([inputId, outputId]) => {
            const val = parseFloat(document.getElementById(inputId).value) || 0;
            const daily = operatingDays > 0 ? fmtNum(val / operatingDays, 0) : 0;
            document.getElementById(outputId).textContent = daily + '/day';
        });
    },

    updateSqftSuggestion() {
        const pallets = parseFloat(document.getElementById('palletsReceived').value) || 0;
        const eaches = parseFloat(document.getElementById('eachesPicked').value) || 0;
        const orders = parseFloat(document.getElementById('ordersPacked').value) || 0;
        const el = document.getElementById('sqftSuggestion');
        if (!el || (pallets === 0 && orders === 0)) { if (el) el.style.display = 'none'; return; }

        // Heuristic: estimate facility SF from annual throughput volumes
        // Assume ~18 inventory turns/yr (moderate velocity DC)
        const avgOnHand = pallets / 18;
        // ~20 SF per pallet position (includes aisle allocation, 6-level rack)
        const palletArea = avgOnHand * 20;
        // Pick area: ~5 SF per SKU slot (carton flow / pick module)
        const skuSlots = eaches > 0 ? Math.max(200, eaches / 500) : 0;
        const pickArea = skuSlots * 5;
        // Support: staging (15%), dock (5%), office (5%) = 25% uplift
        const supportArea = (palletArea + pickArea) * 0.25;
        const suggested = Math.round((palletArea + pickArea + supportArea) / 1000) * 1000;
        if (suggested > 5000) {
            el.textContent = '\u2192 Suggested: ~' + suggested.toLocaleString() + ' sqft based on volume inputs';
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    },

    updateOrderMetrics() {
        const orders = parseFloat(document.getElementById('ordersPacked').value) || 0;
        const lines = parseFloat(document.getElementById('linesPerOrder').value) || 1;
        const units = parseFloat(document.getElementById('unitsPerLine').value) || 1;

        const totalOrders = orders;
        const totalPicks = totalOrders * lines * units;

        document.getElementById('totalOrders').textContent = fmtNum(totalOrders, 0);
        document.getElementById('totalPicks').textContent = fmtNum(totalPicks, 0);
    },

    updateFacilityMetrics() {
        const total = parseFloat(document.getElementById('totalSqft').value) || 0;
        const staging = parseFloat(document.getElementById('stagingSqft').value) || 0;
        const office = parseFloat(document.getElementById('officeSqft').value) || 0;

        const warehouse = total - staging - office;
        var wsEl = document.getElementById('warehousingSpace');
        if (wsEl) wsEl.textContent = fmtNum(Math.max(0, warehouse), 0) + ' sqft (warehouse)';
        var tfEl = document.getElementById('totalFacilitySpace');
        if (tfEl) tfEl.textContent = fmtNum(total, 0) + ' sqft (total facility)';
        this.renderFacilityCostCard();
    },

    launchWSC() {
        // Navigate to WSC in Design Tools
        if (typeof navigate === 'function') navigate('designtools');
        setTimeout(function() {
            if (typeof showDesignTool === 'function') showDesignTool('dt-warehouse');
            // Pre-fill WSC inputs from CM project data if available
            setTimeout(function() {
                var pd = cmApp.projectData || {};
                var clearEl = document.getElementById('wsc-clearht');
                if (clearEl && pd.clear_height_ft) clearEl.value = pd.clear_height_ft;
            }, 200);
        }, 100);
    },

    renderFacilityCostCard() {
        var card = document.getElementById('facilityCostCard');
        if (!card) return;
        // Preserve overrides panel open state across re-renders
        var panelWasOpen = false;
        var existingPanel = document.getElementById('facilityOverridesPanel');
        if (existingPanel && existingPanel.style.display !== 'none') panelWasOpen = true;

        var sqft = parseFloat(document.getElementById('totalSqft').value) || 0;
        if (sqft <= 0) {
            card.innerHTML = '<div class="cm-card-title">Facility Cost Breakdown</div>' +
                '<div style="font-size:12px;color:var(--ies-gray-500);padding:8px 0;">Enter square footage above to see cost breakdown.</div>';
            return;
        }
        var marketId = document.getElementById('market').value;
        var envType = (document.getElementById('environment').value || 'ambient').toLowerCase();
        var facilityRate = this.refData.facilityRates.find(function(r) { return r.market_id === marketId; }) || {};
        // Map environment to utility rate key
        var utilEnv = envType === 'cold' || envType === 'cooler' ? 'cooler' : (envType === 'frozen' || envType === 'freezer' ? 'freezer' : 'ambient');
        var utilityRate = this.refData.utilityRates.find(function(r) { return r.market_id === marketId; }) || {};
        // Try environment-specific utility column, fallback to avg
        var utilPerSfMo = utilityRate['utility_' + utilEnv + '_per_sqft_per_month'] || utilityRate.avg_monthly_per_sqft || utilityRate.utility_cost_per_sqft_per_month || 0;

        // Overrides from projectData (if user has set them)
        var ov = this.projectData.facilityRateOverrides || {};
        var leaseRate = ov.lease != null ? ov.lease : (facilityRate.lease_rate_psf_yr || facilityRate.lease_rate_per_sqft || 0);
        var camRate = ov.cam != null ? ov.cam : (facilityRate.cam_rate_psf_yr || facilityRate.cam_rate_per_sqft || 0);
        var taxRate = ov.tax != null ? ov.tax : (facilityRate.tax_rate_psf_yr || facilityRate.tax_rate_per_sqft || 0);
        var insRate = ov.insurance != null ? ov.insurance : (facilityRate.insurance_rate_psf_yr || facilityRate.insurance_rate_per_sqft || 0);
        var utilRate = ov.utility != null ? ov.utility : utilPerSfMo;

        // Cold storage premium on lease
        var coldMult = envType === 'cold' || envType === 'cooler' ? 1.25 : (envType === 'frozen' || envType === 'freezer' ? 1.50 : 1.0);
        var adjLease = leaseRate * coldMult;

        // Maintenance: % of lease or fixed $/SF
        var maintMode = ov.maint_mode || 'pct';
        var maintPct = ov.maint_pct != null ? ov.maint_pct : 0.02;
        var maintFixed = ov.maint_fixed != null ? ov.maint_fixed : 0;
        var maintPerSf = maintMode === 'fixed' ? maintFixed : (adjLease * maintPct);

        var lease = sqft * adjLease;
        var cam = sqft * camRate;
        var tax = sqft * taxRate;
        var ins = sqft * insRate;
        var util = sqft * utilRate * 12;
        var maint = sqft * maintPerSf;
        var total = lease + cam + tax + ins + util + maint;

        var fmt = function(v) { return '$' + v.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0}); };
        var fmtRate = function(v) { return fmtNum(v, 2, '$'); };
        var line = function(label, rate, unit, annual, overrideKey) {
            var isOverridden = ov[overrideKey] != null;
            return '<div style="display:grid;grid-template-columns:1fr 200px 120px;align-items:center;padding:4px 0;border-bottom:1px solid var(--ies-gray-100);font-size:12px;gap:8px;">' +
                '<span style="color:var(--ies-gray-600);">' + esc(label) + (isOverridden ? ' <span style="color:#f59e0b;font-size:10px;">overridden</span>' : '') + '</span>' +
                '<span style="color:var(--ies-gray-500);font-size:11px;text-align:right;">' + fmtRate(rate) + unit + ' &times; ' + sqft.toLocaleString() + ' SF</span>' +
                '<span style="font-weight:600;text-align:right;">' + fmt(annual) + '/yr</span>' +
            '</div>';
        };

        var coldNote = coldMult > 1 ? ' <span style="font-size:10px;color:#3b82f6;">(' + fmtNum((coldMult - 1) * 100, 0) + '% cold premium)</span>' : '';

        card.innerHTML =
            '<div class="cm-card-title">Facility Cost Breakdown</div>' +
            line('Lease' + coldNote, adjLease, '/SF/yr', lease, 'lease') +
            line('CAM', camRate, '/SF/yr', cam, 'cam') +
            line('Property Tax', taxRate, '/SF/yr', tax, 'tax') +
            line('Insurance', insRate, '/SF/yr', ins, 'insurance') +
            line('Utilities (' + esc(utilEnv) + ')', utilRate, '/SF/mo', util, 'utility') +
            line('Maintenance (' + (maintMode === 'fixed' ? 'fixed' : fmtNum(maintPct * 100, 0) + '% of lease') + ')', maintPerSf, '/SF/yr', maint, 'maint_fixed') +
            '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:700;border-top:2px solid var(--ies-navy);margin-top:4px;">' +
                '<span>Total Facility Cost</span><span style="color:var(--ies-navy);">' + fmt(total) + '/yr</span>' +
            '</div>' +
            '<div style="margin-top:8px;">' +
                '<button class="cm-btn-small" onclick="cmApp.toggleFacilityOverrides()" style="font-size:11px;">Edit Rate Overrides</button>' +
            '</div>' +
            '<div id="facilityOverridesPanel" style="display:' + (panelWasOpen ? 'block' : 'none') + ';margin-top:8px;padding:10px;background:#f8f9fb;border-radius:6px;font-size:12px;">' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
                    this._facilityOverrideField('Lease $/SF/yr', 'lease', leaseRate) +
                    this._facilityOverrideField('CAM $/SF/yr', 'cam', camRate) +
                    this._facilityOverrideField('Tax $/SF/yr', 'tax', taxRate) +
                    this._facilityOverrideField('Insurance $/SF/yr', 'insurance', insRate) +
                    this._facilityOverrideField('Utility $/SF/mo', 'utility', utilRate) +
                    this._facilityOverrideField('Maint % of Lease', 'maint_pct', maintPct * 100) +
                '</div>' +
                '<div style="margin-top:8px;text-align:right;">' +
                    '<button class="cm-btn-small cm-btn-small-danger" onclick="cmApp.clearFacilityOverrides()" style="font-size:10px;">Clear All Overrides</button>' +
                '</div>' +
            '</div>';
    },

    _facilityOverrideField(label, key, currentVal) {
        var ov = this.projectData.facilityRateOverrides || {};
        var isSet = ov[key] != null;
        return '<div><label style="font-size:10px;color:var(--ies-gray-500);">' + esc(label) + '</label>' +
            '<input type="number" step="0.01" id="facilityOverride_' + key + '" value="' + (isSet ? ov[key] : currentVal) + '" ' +
            'style="width:100%;font-size:12px;padding:4px 6px;border:1px solid ' + (isSet ? '#f59e0b' : 'var(--ies-gray-200)') + ';border-radius:4px;" ' +
            'oninput="cmApp.updateFacilityOverride(\'' + key + '\',this.value)"></div>';
    },

    toggleFacilityOverrides() {
        var panel = document.getElementById('facilityOverridesPanel');
        if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    },

    updateFacilityOverride(key, value) {
        if (!this.projectData.facilityRateOverrides) this.projectData.facilityRateOverrides = {};
        var num = parseFloat(value);
        if (key === 'maint_pct') {
            this.projectData.facilityRateOverrides.maint_pct = isNaN(num) ? null : num / 100;
            this.projectData.facilityRateOverrides.maint_mode = 'pct';
        } else {
            this.projectData.facilityRateOverrides[key] = isNaN(num) ? null : num;
        }
        this.renderFacilityCostCard();
        // Restore focus to the input that was just edited
        var inp = document.getElementById('facilityOverride_' + key);
        if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
        this.markChanged();
    },

    clearFacilityOverrides() {
        this.projectData.facilityRateOverrides = {};
        this.renderFacilityCostCard();
        this.markChanged();
    },

    updateShiftMetrics() {
        const shifts = parseFloat(document.getElementById('shiftsPerDay').value) || 1;
        const hours = parseFloat(document.getElementById('hoursPerShift').value) || 8;
        const days = parseFloat(document.getElementById('daysPerWeek').value) || 5;
        const weeks = parseFloat(document.getElementById('weeksPerYear').value) || 52;

        const operatingDays = days * weeks;
        const operatingHours = operatingDays * hours;
        const totalAvailable = operatingHours * shifts;

        document.getElementById('operatingDays').textContent = fmtNum(operatingDays, 0);
        document.getElementById('annualHours').textContent = fmtNum(operatingHours, 0);
        document.getElementById('totalAvailableHours').textContent = fmtNum(totalAvailable, 0);
    },

    getOperatingDays() {
        const days = parseFloat(document.getElementById('daysPerWeek').value) || 5;
        const weeks = parseFloat(document.getElementById('weeksPerYear').value) || 52;
        return days * weeks;
    },

    _sectionOrder: ['setup','volumes','facility','shifts','labor','equipment','overhead','vas','financial','startup','pricing','summary'],
    _sectionLabels: {setup:'Setup',volumes:'Volumes & Profile',facility:'Facility',shifts:'Shifts',labor:'Labor',equipment:'Equipment',overhead:'Overhead',vas:'VAS',financial:'Financial',startup:'Startup',pricing:'Pricing',summary:'Summary'},

    switchSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.cm-section').forEach(s => s.classList.remove('active'));
        // Show active section
        var sectionEl = document.getElementById(sectionId + 'Section');
        sectionEl.classList.add('active');

        // Update nav
        document.querySelectorAll('.cm-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionId) item.classList.add('active');
        });

        // Inject section nav footer
        var existingNav = sectionEl.querySelector('.cm-section-nav');
        if (existingNav) existingNav.remove();
        var idx = this._sectionOrder.indexOf(sectionId);
        if (idx >= 0) {
            var nav = document.createElement('div');
            nav.className = 'cm-section-nav';
            var prevHtml = '';
            var nextHtml = '';
            if (idx > 0) {
                var prevId = this._sectionOrder[idx - 1];
                prevHtml = '<button class="cm-nav-prev" onclick="cmApp.switchSection(\'' + prevId + '\')"><svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> ' + this._sectionLabels[prevId] + '</button>';
            } else {
                prevHtml = '<div></div>';
            }
            if (idx < this._sectionOrder.length - 1) {
                var nextId = this._sectionOrder[idx + 1];
                nextHtml = '<button class="cm-nav-next" onclick="cmApp.switchSection(\'' + nextId + '\')">' + this._sectionLabels[nextId] + ' <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
            } else {
                nextHtml = '<div></div>';
            }
            nav.innerHTML = prevHtml + nextHtml;
            sectionEl.appendChild(nav);
        }

        // Render labor and summary if needed
        if (sectionId === 'labor') {
            this.recalculateLabor();
            this.renderLaborTable();
            this.renderIndirectLaborTable();
        } else if (sectionId === 'equipment') {
            this.autoGenerateEquipment();
            this.renderEquipmentTable();
        } else if (sectionId === 'overhead') {
            this.autoGenerateOverhead();
            this.renderOverheadTable();
        } else if (sectionId === 'startup') {
            this.autoGenerateStartup();
            this.renderStartupTable();
            this.renderImplementationTimeline();
        } else if (sectionId === 'financial') {
            this.renderMultiYearBudget();
            this.renderFinancialMetrics();
        } else if (sectionId === 'pricing') {
            this.initDefaultBuckets();
            this.renderPricingBuckets();
            this.renderPricingSchedule();
        } else if (sectionId === 'summary') {
            this.recalculateSummary();
        }

        // Scroll to top of content area
        var contentEl = sectionEl.closest('.cm-content');
        if (contentEl) contentEl.scrollTop = 0;
    },

    autoGenerateEquipment() {
        // Only auto-generate if no manually-added lines exist
        if (this.projectData.equipmentLines.some(l => l.source === 'manual')) return;
        if (this.projectData.laborLines.length === 0) return;

        const equipCatalog = this.refData.equipmentCatalog || [];
        const newLines = [];
        const spareFactor = 1.15; // 15% spare capacity

        // Helper: find catalog item by keyword
        const findCatalog = (keyword) => equipCatalog.find(e =>
            e.name && e.name.toLowerCase().includes(keyword.toLowerCase())
        ) || equipCatalog.find(e =>
            (e.subcategory || '').toLowerCase().includes(keyword.toLowerCase())
        );

        const addEquip = (name, category, qty, catalogItem, drivenBy) => {
            if (qty <= 0) return;
            newLines.push({
                equipment_name: catalogItem ? catalogItem.name : name,
                category: catalogItem ? catalogItem.category : category,
                quantity: qty,
                acquisition_type: 'lease',
                monthly_cost: catalogItem ? parseFloat(catalogItem.monthly_lease_cost || 0) : 0,
                monthly_maintenance: catalogItem ? parseFloat(catalogItem.monthly_maintenance || 0) : 0,
                acquisition_cost: catalogItem ? parseFloat(catalogItem.purchase_cost || 0) * qty : 0,
                amort_years: 5,
                driven_by: drivenBy,
                source: 'auto',
                equipment_id: catalogItem ? catalogItem.id : null
            });
        };

        // =====================================================================
        // 1. MHE — Driven by labor row assignments + MOST template fallback
        // =====================================================================
        const equipNeeds = {};

        // First: honor explicit MHE / IT assignments from labor rows
        this.projectData.laborLines.forEach(line => {
            const operHours = this.getOperatingHours();
            const fte = operHours > 0 ? (line.annual_hours || 0) / operHours : 0;
            line.fte = fte; // store for downstream use

            // Explicit MHE assignment
            if (line.mhe_equipment_id) {
                if (!equipNeeds[line.mhe_equipment_id]) equipNeeds[line.mhe_equipment_id] = { fte: 0, activities: [], catalogId: line.mhe_equipment_id };
                equipNeeds[line.mhe_equipment_id].fte += fte;
                equipNeeds[line.mhe_equipment_id].activities.push(line.activity_name || 'Direct labor');
            }
            // Explicit IT equipment assignment
            if (line.it_equipment_id) {
                if (!equipNeeds[line.it_equipment_id]) equipNeeds[line.it_equipment_id] = { fte: 0, activities: [], catalogId: line.it_equipment_id };
                equipNeeds[line.it_equipment_id].fte += fte;
                equipNeeds[line.it_equipment_id].activities.push(line.activity_name || 'Direct labor');
            }

            // Fallback: MOST template equipment types (only if no explicit MHE assigned)
            if (!line.mhe_equipment_id) {
                const template = (this.refData.mostTemplates || []).find(t => t.id === line.most_template_id);
                if (template && template.equipment_type) {
                    const equipTypes = template.equipment_type.split('+').map(s => s.trim());
                    equipTypes.forEach(eqType => {
                        if (!equipNeeds[eqType]) equipNeeds[eqType] = { fte: 0, activities: [] };
                        equipNeeds[eqType].fte += fte;
                        equipNeeds[eqType].activities.push(line.activity_name);
                    });
                }
            }
        });

        Object.keys(equipNeeds).forEach(key => {
            const need = equipNeeds[key];
            const qty = Math.max(1, Math.ceil(need.fte * spareFactor));
            // If catalogId is set, look up by ID; otherwise search by name keyword
            const catalogItem = need.catalogId
                ? equipCatalog.find(e => e.id === need.catalogId)
                : findCatalog(key);
            const name = catalogItem ? catalogItem.name : key;
            const cat = catalogItem ? catalogItem.category : 'MHE';
            addEquip(name, cat, qty, catalogItem, need.activities.join(', '));
        });

        // =====================================================================
        // 2. IT EQUIPMENT — RF Scanners, Label Printers, WiFi APs
        //    (skip RF/scanners if any labor rows have explicit IT assignments)
        // =====================================================================
        const hasExplicitIT = this.projectData.laborLines.some(l => l.it_equipment_id);
        const totalDirectFte = this.projectData.laborLines.reduce((s, l) => s + (l.fte || 0), 0);
        const totalIndirectHC = this.projectData.indirectLaborLines.reduce((s, l) => s + (l.headcount || 0), 0);
        const totalHC = Math.ceil(totalDirectFte) + totalIndirectHC;
        const sqft = parseFloat(document.getElementById('totalSqft').value) || 0;

        // RF scanners / mobile computers — only auto-add if no explicit IT assignments
        if (totalDirectFte > 0 && !hasExplicitIT) {
            const rfItem = findCatalog('rf terminal') || findCatalog('rf scanner');
            const rfQty = Math.ceil(totalDirectFte * spareFactor);
            addEquip('RF Terminal / Mobile Computer', 'Systems', rfQty, rfItem, 'All direct labor (15% spare)');
        }

        // Label printers: 1 per pack station + 1 per shipping dock + 1 per receiving
        const packFte = this.projectData.laborLines.filter(l => l.activity_name && l.activity_name.toLowerCase().includes('pack')).reduce((s,l) => s + (l.fte || 0), 0);
        const labelPrinters = Math.max(1, Math.ceil(packFte)) + 2; // pack stations + recv + ship
        const printerItem = findCatalog('label printer');
        addEquip('Label Printer (Thermal)', 'Systems', labelPrinters, printerItem, 'Pack stations + Recv/Ship desks');

        // WiFi APs: 1 per 10,000 sqft (industry heuristic for warehouse coverage)
        if (sqft > 0) {
            const wifiQty = Math.max(2, Math.ceil(sqft / 10000));
            const wifiItem = findCatalog('wifi');
            addEquip('WiFi Access Point', 'Systems', wifiQty, wifiItem, sqft.toLocaleString() + ' sqft @ 1 per 10K sqft');
        }

        // =====================================================================
        // 3. RACKING — Driven by pallet positions needed
        // =====================================================================
        // Heuristic: pallet positions = (avg daily pallets on hand) * safety factor
        // Avg on hand = annual pallets received / inventory turns per year
        const annualPalletsIn = parseFloat(document.getElementById('palletsReceived').value) || 0;
        const turnsPerYear = 12; // default assumption: monthly turns
        if (annualPalletsIn > 0) {
            const avgPalletsOnHand = Math.ceil(annualPalletsIn / turnsPerYear);
            const rackPositions = Math.ceil(avgPalletsOnHand * 1.15); // 15% buffer
            const selectiveItem = findCatalog('selective');
            addEquip('Selective Pallet Rack', 'Racking', rackPositions, selectiveItem,
                avgPalletsOnHand.toLocaleString() + ' avg pallets on hand (12 turns/yr + 15% buffer)');
        }

        // Forward pick locations: driven by SKU count estimate
        // Heuristic: eaches picking needs forward pick slots. Approx 1 slot per 2 sqft of pick area
        const eachesPicked = parseFloat(document.getElementById('eachesPicked').value) || 0;
        if (eachesPicked > 0) {
            // Estimate active SKUs from pick volume (heuristic: ~500-2000 active SKUs typical)
            const estimatedSKUs = Math.min(3000, Math.max(200, Math.ceil(eachesPicked / 5000)));
            const flowRackBays = Math.ceil(estimatedSKUs / 8); // ~8 SKUs per bay
            const flowItem = findCatalog('carton flow');
            addEquip('Carton Flow Rack (bay)', 'Racking', flowRackBays, flowItem,
                estimatedSKUs + ' est. active SKUs @ 8 per bay');
        }

        // =====================================================================
        // 4. DOCK EQUIPMENT — Driven by throughput volume
        // =====================================================================
        // Heuristic: dock doors = peak daily pallets / pallets per door per day (~80-100)
        const annualPalletsOut = parseFloat(document.getElementById('palletsShipped').value) || 0;
        const daysPerYear = (parseFloat(document.getElementById('daysPerWeek').value) || 5) * 52;
        const dailyPalletsTotal = (annualPalletsIn + annualPalletsOut) / daysPerYear;
        if (dailyPalletsTotal > 0) {
            const dockDoors = Math.max(2, Math.ceil(dailyPalletsTotal / 90));
            const inboundDoors = Math.max(1, Math.ceil(dockDoors * 0.4));
            const outboundDoors = dockDoors - inboundDoors;
            const levelerItem = findCatalog('dock leveler');
            addEquip('Dock Leveler (Hydraulic)', 'MHE', dockDoors, levelerItem,
                fmtNum(dailyPalletsTotal, 0) + ' daily pallets / 90 per door = ' + dockDoors + ' doors (' + inboundDoors + ' in/' + outboundDoors + ' out)');
        }

        // =====================================================================
        // 5. MHE CHARGING — Driven by electric forklift count
        // =====================================================================
        const forkliftCount = newLines.filter(l =>
            l.equipment_name.toLowerCase().includes('forklift') ||
            l.equipment_name.toLowerCase().includes('reach') ||
            l.equipment_name.toLowerCase().includes('order picker') ||
            l.equipment_name.toLowerCase().includes('turret')
        ).reduce((s, l) => s + l.quantity, 0);

        if (forkliftCount > 0) {
            // 1 charging station (6-unit) per 6 electric MHE
            const chargingStations = Math.max(1, Math.ceil(forkliftCount / 6));
            const chargingItem = findCatalog('charging');
            addEquip('Battery Charging Station (6-unit)', 'MHE', chargingStations, chargingItem,
                forkliftCount + ' electric MHE units');
        }

        // Electric pallet jacks also need charging
        const pjCount = newLines.filter(l => l.equipment_name.toLowerCase().includes('pallet jack') && l.equipment_name.toLowerCase().includes('electric')).reduce((s, l) => s + l.quantity, 0);
        if (pjCount >= 3) {
            const pjChargingItem = findCatalog('charging');
            addEquip('Pallet Jack Charging Station', 'MHE', Math.ceil(pjCount / 6), pjChargingItem,
                pjCount + ' electric pallet jacks');
        }

        // =====================================================================
        // 6. OFFICE BUILD-OUT — Driven by indirect HC
        // =====================================================================
        if (totalIndirectHC > 0) {
            // Heuristic: ~120 sqft per office worker, plus 200 sqft break room, 100 sqft conf room
            const officeSqft = Math.ceil(totalIndirectHC * 120);
            const officeItem = findCatalog('office modular');
            addEquip('Office Build-Out (sqft)', 'Facility', officeSqft, officeItem,
                totalIndirectHC + ' indirect HC @ 120 sqft/person');

            // Break room: 15 sqft per total HC, min 200 sqft
            const breakSqft = Math.max(200, Math.ceil(totalHC * 15));
            const breakItem = findCatalog('break room');
            addEquip('Break Room Build-Out (sqft)', 'Facility', breakSqft, breakItem,
                totalHC + ' total HC @ 15 sqft/person');
        }

        // =====================================================================
        // 7. SECURITY SYSTEMS — Driven by facility size
        // =====================================================================
        if (sqft >= 50000) {
            // Camera systems: 1 per 30K sqft (8-camera package covers ~30K sqft)
            const cameraSystems = Math.max(1, Math.ceil(sqft / 30000));
            const cameraItem = findCatalog('security camera');
            addEquip('Security Camera System (8-cam)', 'Facility', cameraSystems, cameraItem,
                sqft.toLocaleString() + ' sqft @ 1 system per 30K sqft');

            // Access control: 1 system per facility
            const accessItem = findCatalog('access control');
            addEquip('Access Control System', 'Facility', 1, accessItem, 'Facility entry/exit');
        }

        // =====================================================================
        // 8. CONVEYOR — Only if high-volume ecommerce (>500K orders/yr)
        // =====================================================================
        const annualOrders = parseFloat(document.getElementById('ordersPacked').value) || 0;
        if (annualOrders >= 500000) {
            // Heuristic: ~200 LF belt conveyor for transport + sortation
            const conveyorLF = Math.min(500, Math.max(100, Math.ceil(annualOrders / 5000)));
            const beltItem = findCatalog('belt conveyor');
            addEquip('Belt Conveyor (linear ft)', 'Conveyor', conveyorLF, beltItem,
                annualOrders.toLocaleString() + ' orders/yr — transport from pack to ship');

            // Sortation diverts: 1 per outbound carrier/lane, estimate 4-8
            if (annualOrders >= 1000000) {
                const diverts = Math.min(12, Math.max(4, Math.ceil(annualOrders / 200000)));
                const sortItem = findCatalog('sortation');
                addEquip('Sortation Divert', 'Conveyor', diverts, sortItem,
                    'Carrier lane sortation for ' + annualOrders.toLocaleString() + ' orders/yr');
            }
        }

        this.projectData.equipmentLines = newLines;
    },

    autoGenerateOverhead() {
        // Only auto-generate if no manually-added lines exist
        if (this.projectData.overheadLines.some(l => l.source === 'manual')) return;

        const sqft = parseFloat(document.getElementById('totalSqft').value) || 0;
        const totalDirectFte = this.projectData.laborLines.reduce((s, l) => s + (l.fte || 0), 0);
        const totalIndirectFte = this.projectData.indirectLaborLines.reduce((s, l) => s + (l.headcount || 0), 0);
        const totalHC = Math.ceil(totalDirectFte + totalIndirectFte);
        const annualOrders = parseFloat(document.getElementById('ordersPacked').value) || 0;
        const annualPalletsShipped = parseFloat(document.getElementById('palletsShipped').value) || 0;
        const annualUnitsShipped = annualOrders + annualPalletsShipped;

        // Warehouse turnover factor — BLS JOLTS data, warehousing & storage sector
        const turnoverPct = 0.43;
        const annualHires = Math.ceil(totalHC * turnoverPct);

        const lines = [];

        // =========================================================================
        // PER-SQFT SCALERS (facility-driven)
        // Sources: IFMA O&M Benchmarking Report, BOMA Industrial OBR,
        //          Colliers Industrial Market Report, CBRE FM Cost Trends
        // =========================================================================
        if (sqft > 0) {
            // IFMA reports warehouse janitorial at $0.50-$1.00/sqft (less intensive
            // than office); HVAC maint $0.10-$0.25/sqft; pest control ~$0.03/sqft;
            // general repairs $0.15-$0.30/sqft. Combined: $0.75-$1.50/sqft.
            // Using $1.00/sqft as mid-range for industrial/warehouse.
            lines.push({
                category: 'Facility Maintenance',
                description: 'Janitorial, HVAC maint, pest control, general repairs (IFMA benchmark)',
                scaling_driver: 'per_sqft',
                rate: 1.00,
                quantity: sqft,
                annual_cost: sqft * 1.00,
                monthly_cost: (sqft * 1.00) / 12,
                cost_type: 'per_sqft',
                source: 'heuristic'
            });
            // Kisi/Deep Sentinel: monitoring $40-$120/mo; access control amortized
            // ~$0.01-$0.03/sqft; camera systems amortized ~$0.03-$0.05/sqft.
            // Total $0.08-$0.15/sqft for tech-only security (no on-site guards).
            lines.push({
                category: 'Security',
                description: 'Monitoring, camera systems, access control (no guards)',
                scaling_driver: 'per_sqft',
                rate: 0.12,
                quantity: sqft,
                annual_cost: sqft * 0.12,
                monthly_cost: (sqft * 0.12) / 12,
                cost_type: 'per_sqft',
                source: 'heuristic'
            });
            // Insureon/Next: warehouse property + GL typically $0.25-$0.50/sqft
            // depending on contents value, construction type, fire protection.
            // NNN lease insurance component benchmarks $0.20-$0.40/sqft.
            lines.push({
                category: 'Property & Liability Insurance',
                description: 'Property, general liability, umbrella (Insureon/Next benchmarks)',
                scaling_driver: 'per_sqft',
                rate: 0.35,
                quantity: sqft,
                annual_cost: sqft * 0.35,
                monthly_cost: (sqft * 0.35) / 12,
                cost_type: 'per_sqft',
                source: 'heuristic'
            });
            // Ryan Fire Protection: annual sprinkler inspection $1,500-$3,500
            // for 50K-200K sqft = ~$0.02-$0.03/sqft; extinguisher service adds
            // ~$0.01/sqft. Total $0.03-$0.05/sqft.
            lines.push({
                category: 'Fire & Life Safety',
                description: 'Sprinkler inspection, fire suppression, extinguisher service',
                scaling_driver: 'per_sqft',
                rate: 0.04,
                quantity: sqft,
                annual_cost: sqft * 0.04,
                monthly_cost: (sqft * 0.04) / 12,
                cost_type: 'per_sqft',
                source: 'heuristic'
            });
        }

        // =========================================================================
        // PER-HEADCOUNT SCALERS (people-driven)
        // Sources: ExploreWMS Cost Guide, SHRM 2025 Benchmarking Report,
        //          Gartner HR Cost Survey 2024, BLS ECEC, Kickstand Insurance
        // =========================================================================
        if (totalHC > 0) {
            // ExploreWMS/ShipHero: cloud WMS $100-$300/user/mo enterprise tier;
            // BY (Blue Yonder) enterprise licensing ~$150-$250/user/mo.
            // Plus RF device mgmt, networking, printers, telecom: ~$50/user/mo.
            // Total $2,400-$3,600/user/yr. Using $2,500 mid-range.
            lines.push({
                category: 'IT / WMS Licensing',
                description: 'BY WMS licenses, RF mgmt, networking, printers, telecom',
                scaling_driver: 'per_hc',
                rate: 2500,
                quantity: totalHC,
                annual_cost: totalHC * 2500,
                monthly_cost: (totalHC * 2500) / 12,
                cost_type: 'per_headcount',
                source: 'heuristic'
            });
            // Gartner 2024: HR function spends ~$2,500-$2,908/employee/yr.
            // SHRM 2025: avg cost-per-hire $4,700 (recruiting, screening, onboarding).
            // Blended: $2,500/yr ongoing + $4,700 per replacement hire.
            lines.push({
                category: 'HR & Recruiting',
                description: 'Payroll admin, benefits, onboarding + replacement hires (SHRM/Gartner)',
                scaling_driver: 'per_hc',
                rate: 2500,
                quantity: totalHC + annualHires,
                annual_cost: (totalHC * 2500) + (annualHires * 4700),
                monthly_cost: ((totalHC * 2500) + (annualHires * 4700)) / 12,
                cost_type: 'per_headcount',
                source: 'heuristic'
            });
            // Kickstand/BLS: avg $1,128/employee/yr; warehouse (moderate hazard)
            // runs 10-20% above average. Using $1,250/employee.
            lines.push({
                category: 'Workers Comp Insurance',
                description: 'Workers compensation premiums, warehouse risk class (BLS/Kickstand)',
                scaling_driver: 'per_hc',
                rate: 1250,
                quantity: totalHC,
                annual_cost: totalHC * 1250,
                monthly_cost: (totalHC * 1250) / 12,
                cost_type: 'per_headcount',
                source: 'heuristic'
            });
            lines.push({
                category: 'Safety & Compliance',
                description: 'OSHA compliance, training programs, safety supplies',
                scaling_driver: 'per_hc',
                rate: 800,
                quantity: totalHC,
                annual_cost: totalHC * 800,
                monthly_cost: (totalHC * 800) / 12,
                cost_type: 'per_headcount',
                source: 'heuristic'
            });
            lines.push({
                category: 'Uniforms & PPE',
                description: 'Safety vests, gloves, boots, hard hats, eye protection',
                scaling_driver: 'per_hc',
                rate: 400,
                quantity: totalHC + annualHires,
                annual_cost: (totalHC + annualHires) * 400,
                monthly_cost: ((totalHC + annualHires) * 400) / 12,
                cost_type: 'per_headcount',
                source: 'heuristic'
            });
        }

        // =========================================================================
        // PER-UNIT / THROUGHPUT SCALERS (volume-driven)
        // =========================================================================
        if (annualUnitsShipped > 0) {
            lines.push({
                category: 'Supplies & Consumables',
                description: 'Stretch wrap, labels, tape, dunnage, pallets, cleaning',
                scaling_driver: 'per_unit',
                rate: 0.15,
                quantity: annualUnitsShipped,
                annual_cost: annualUnitsShipped * 0.15,
                monthly_cost: (annualUnitsShipped * 0.15) / 12,
                cost_type: 'per_unit',
                source: 'heuristic'
            });
        }
        if (annualOrders > 0) {
            lines.push({
                category: 'Quality & Inspection',
                description: 'QC inspection labor overhead, quality systems, audit costs',
                scaling_driver: 'per_order',
                rate: 0.25,
                quantity: annualOrders,
                annual_cost: annualOrders * 0.25,
                monthly_cost: (annualOrders * 0.25) / 12,
                cost_type: 'per_order',
                source: 'heuristic'
            });
        }

        this.projectData.overheadLines = lines;
    },

    recalculateLabor() {
        if (!this.currentProject) return;

        const marketId = document.getElementById('market').value;
        const allowanceId = document.getElementById('allowanceProfile').value;
        if (!marketId || !allowanceId) return;

        const allowance = this.refData.allowanceProfiles.find(a => a.id == allowanceId);
        if (!allowance) return;

        const totalPfdPct = (parseFloat(allowance.personal_pct) || 0) +
                            (parseFloat(allowance.fatigue_pct) || 0) +
                            (parseFloat(allowance.delay_pct) || 0) +
                            (parseFloat(allowance.ergonomic_adjustment_pct) || 0);

        // Map volumes to process areas and pick methods
        const volumeMap = [
            { vol: parseFloat(document.getElementById('palletsReceived').value) || 0, process: 'Receiving', uom: 'pallet', field: 'vol_pallets_received' },
            { vol: parseFloat(document.getElementById('casesReceived').value) || 0, process: 'Receiving', uom: 'case', field: 'vol_cases_received' },
            { vol: parseFloat(document.getElementById('palletsPutaway').value) || 0, process: 'Putaway', uom: 'pallet', field: 'vol_pallets_putaway' },
            { vol: parseFloat(document.getElementById('casesPutaway').value) || 0, process: 'Putaway', uom: 'case', field: 'vol_cases_putaway' },
            { vol: parseFloat(document.getElementById('replenishments').value) || 0, process: 'Replenishment', uom: 'pallet', field: 'vol_replenishments' },
            { vol: parseFloat(document.getElementById('eachesPicked').value) || 0, process: 'Picking', uom: 'each', field: 'vol_eaches_picked' },
            { vol: parseFloat(document.getElementById('casesPicked').value) || 0, process: 'Picking', uom: 'case', field: 'vol_cases_picked' },
            { vol: parseFloat(document.getElementById('palletsPicked').value) || 0, process: 'Picking', uom: 'pallet', field: 'vol_pallets_picked' },
            { vol: parseFloat(document.getElementById('ordersPacked').value) || 0, process: 'Packing', uom: 'order', field: 'vol_orders_packed' },
            { vol: parseFloat(document.getElementById('palletsShipped').value) || 0, process: 'Shipping', uom: 'pallet', field: 'vol_pallets_shipped' },
            { vol: parseFloat(document.getElementById('returnsProcessed').value) || 0, process: 'Returns', uom: 'each', field: 'vol_returns_processed' },
        ];

        const pickMethod = this.currentProject.pick_method || 'discrete';
        const avgPickTravel = parseFloat(this.currentProject.avg_pick_travel_ft) || 20;
        const avgPutawayTravel = parseFloat(this.currentProject.avg_putaway_travel_ft) || 120;
        const avgReplenTravel = parseFloat(this.currentProject.avg_replen_travel_ft) || 150;
        const slotHeight = this.currentProject.avg_slot_height || 'waist';
        const linesPerOrder = parseFloat(document.getElementById('linesPerOrder').value) || 3;
        const singleLinePct = parseFloat(document.getElementById('singleLineOrderPct').value) || 40;

        // Slot height multipliers
        const slotMultiplier = { floor: 1.5, waist: 1.0, overhead: 1.8, mixed: 1.3 };
        const slotMult = slotMultiplier[slotHeight] || 1.0;

        // Operating hours per person per year
        const hoursPerShift = parseFloat(document.getElementById('hoursPerShift').value) || 8;
        const daysPerWeek = parseFloat(document.getElementById('daysPerWeek').value) || 5;
        const weeksPerYear = parseFloat(document.getElementById('weeksPerYear').value) || 52;
        const annualHoursPerPerson = hoursPerShift * daysPerWeek * weeksPerYear;

        // Get labor rates for this market
        const marketLaborRates = this.refData.laborRates.filter(r => r.market_id == marketId);

        // Build labor lines
        const newLaborLines = [];

        volumeMap.forEach(vm => {
            if (vm.vol <= 0) return;

            // Find matching MOST templates
            let templates = this.refData.mostTemplates.filter(t =>
                t.process_area === vm.process && t.uom === vm.uom && t.is_active !== false
            );

            // For picking, filter by pick method
            if (vm.process === 'Picking' && vm.uom === 'each') {
                const methodTemplate = templates.find(t => t.pick_method === pickMethod);
                if (methodTemplate) templates = [methodTemplate];
                else templates = templates.slice(0, 1); // fallback to first match
            } else {
                templates = templates.slice(0, 1); // take first match for non-picking
            }

            if (templates.length === 0) return;

            const template = templates[0];
            const elements = this.refData.mostElements.filter(e => e.template_id === template.id);

            // Calculate adjusted TMU
            let totalTmu = 0;
            elements.forEach(el => {
                let tmu = parseFloat(el.tmu_value) || 0;

                if (el.is_variable && el.variable_driver) {
                    switch (el.variable_driver) {
                        case 'travel_distance':
                            // Base A-index travel assumptions: A6=20ft, A10=40ft, A16=80ft
                            let baseFt = 20; // default A6
                            if (tmu >= 160) baseFt = 80;
                            else if (tmu >= 100) baseFt = 40;
                            else if (tmu >= 60) baseFt = 20;
                            else if (tmu >= 30) baseFt = 8;

                            let actualFt = avgPickTravel;
                            if (vm.process === 'Putaway') actualFt = avgPutawayTravel;
                            else if (vm.process === 'Replenishment') actualFt = avgReplenTravel;
                            else if (vm.process === 'Shipping') actualFt = (avgPutawayTravel + avgPickTravel) / 2;

                            tmu = tmu * (actualFt / baseFt);
                            break;

                        case 'slot_height':
                            tmu = tmu * slotMult;
                            break;

                        case 'lines_per_order':
                            tmu = tmu * (linesPerOrder / 4); // base assumes ~4 lines
                            break;

                        case 'trailer_depth':
                        case 'container_depth':
                            // Use midpoint — no adjustment
                            break;
                    }
                }
                totalTmu += tmu;
            });

            if (totalTmu <= 0) totalTmu = parseFloat(template.total_tmu_base) || 100;

            const baseUph = 100000 / totalTmu;
            const adjustedUph = baseUph * (1 - totalPfdPct / 100);
            const annualHours = vm.vol / adjustedUph;
            const fte = annualHours / annualHoursPerPerson;

            // Find matching labor rate — look for role that matches this process area
            let laborRate = marketLaborRates.find(r =>
                r.role_name && r.role_name.toLowerCase().includes(vm.process.toLowerCase().substring(0, 4))
            );
            if (!laborRate) laborRate = marketLaborRates.find(r => r.role_category === 'Direct');
            if (!laborRate) laborRate = { hourly_rate: 18, burden_pct: 30, benefits_per_hour: 3 };

            const hourlyRate = parseFloat(laborRate.hourly_rate) || 18;
            const burdenPct = parseFloat(laborRate.burden_pct) || 30;
            const benefitsPerHour = parseFloat(laborRate.benefits_per_hour) || 3;
            const fullyLoadedRate = hourlyRate * (1 + burdenPct / 100) + benefitsPerHour;
            const annualCost = annualHours * fullyLoadedRate;

            newLaborLines.push({
                activity_name: template.activity_name,
                most_template_name: template.wms_transaction || template.activity_name,
                most_template_id: template.id,
                volume: vm.vol,
                base_uph: baseUph,
                adjusted_uph: adjustedUph,
                annual_hours: annualHours,
                fte: fte,
                hourly_rate: hourlyRate,
                burden_pct: burdenPct,
                benefits_per_hour: benefitsPerHour,
                fully_loaded_rate: fullyLoadedRate,
                annual_cost: annualCost,
                auto_calculated: true
            });
        });

        this.projectData.laborLines = newLaborLines;

        // =====================================================================
        // AUTO-GENERATE INDIRECT & CLERICAL LABOR
        // Heuristics: management span-of-control, clerical per volume/HC
        // =====================================================================
        const totalDirectFte = newLaborLines.reduce((sum, l) => sum + (l.fte || 0), 0);

        if (totalDirectFte > 0 && this.projectData.indirectLaborLines.length === 0) {
            const findRate = (keyword) => marketLaborRates.find(r => r.role_name && r.role_name.toLowerCase().includes(keyword));
            const supRate = findRate('super');
            const leadRate = findRate('lead');
            const mgrRate = findRate('manager');
            const icRate = findRate('inventory');
            const defaultBurden = 30;

            this.projectData.indirectLaborLines = [];

            const addIndirect = (role, hc, hourly, burden) => {
                burden = burden || defaultBurden;
                this.projectData.indirectLaborLines.push({
                    role_name: role,
                    headcount: hc,
                    hourly_rate: hourly,
                    burden_pct: burden,
                    annual_hours: annualHoursPerPerson * hc,
                    annual_cost: annualHoursPerPerson * hc * hourly * (1 + burden/100)
                });
            };

            // --- MANAGEMENT LAYER ---
            // Team Leads: 1 per 8 direct FTEs (span-of-control heuristic)
            if (totalDirectFte >= 3) {
                addIndirect('Team Lead', Math.ceil(totalDirectFte / 8), leadRate ? parseFloat(leadRate.hourly_rate) : 22);
            }
            // Supervisors: 1 per 15 direct FTEs
            if (totalDirectFte >= 8) {
                addIndirect('Supervisor', Math.ceil(totalDirectFte / 15), supRate ? parseFloat(supRate.hourly_rate) : 28, 35);
            }
            // Operations Manager: 1 for 20+ FTEs, 2 for 80+
            if (totalDirectFte >= 20) {
                const mgrCount = totalDirectFte >= 80 ? 2 : 1;
                addIndirect('Operations Manager', mgrCount, mgrRate ? parseFloat(mgrRate.hourly_rate) : 42, 32);
            }

            // --- CLERICAL / SUPPORT STAFF ---
            // Scale clerical with operation size — fractional for small ops
            const sqft = parseFloat(document.getElementById('totalSqft').value) || 0;
            const annualOrders = parseFloat(document.getElementById('ordersPacked').value) || 0;
            const annualReturns = parseFloat(document.getElementById('returnsProcessed').value) || 0;
            const shifts = parseFloat(document.getElementById('shiftsPerDay').value) || 1;
            const hasInbound = (parseFloat(document.getElementById('palletsReceived').value) || 0) > 0;
            const hasOutbound = (parseFloat(document.getElementById('palletsShipped').value) || 0) > 0;

            // Inventory Control: 1 per 25 direct FTEs, fractional for <10 FTEs
            if (totalDirectFte >= 3) {
                const icCount = totalDirectFte < 10 ? 0.5 : Math.max(1, Math.ceil(totalDirectFte / 25));
                addIndirect('Inventory Control', icCount, icRate ? parseFloat(icRate.hourly_rate) : 20.50);
            }

            // Receiving/Shipping Clerk: 1 per shift for 10+ FTEs, 0.5 for small ops
            if (hasInbound || hasOutbound) {
                const clerkCount = totalDirectFte >= 10 ? Math.max(1, Math.round(shifts)) : 0.5;
                addIndirect('Receiving/Shipping Clerk', clerkCount, 19);
            }

            // Customer Service Rep: 1 per 500K orders/yr — only for 100K+ orders
            if (annualOrders >= 100000) {
                const csCount = Math.max(1, Math.ceil(annualOrders / 500000));
                addIndirect('Customer Service Rep', csCount, 20, 35);
            }

            // Returns Processor: 1 per 100K returns/yr — only for 50K+
            if (annualReturns >= 50000) {
                const retCount = Math.max(1, Math.ceil(annualReturns / 100000));
                addIndirect('Returns Processor', retCount, 18);
            }

            // IT Support: fractional — only for 15+ FTEs
            if (totalDirectFte >= 15) {
                const itCount = totalDirectFte >= 80 ? 2 : totalDirectFte >= 30 ? 1 : 0.5;
                addIndirect('IT Support Specialist', itCount, 28, 35);
            }

            // Maintenance Tech: 1 for 100K+ sqft, 2 for 300K+
            if (sqft >= 100000) {
                const maintCount = sqft >= 300000 ? 2 : 1;
                addIndirect('Maintenance Technician', maintCount, 22);
            }

            // Janitorial: 1 per 150K sqft — only for 75K+
            if (sqft >= 75000) {
                const janCount = Math.max(1, Math.ceil(sqft / 150000));
                addIndirect('Janitorial Staff', janCount, 16);
            }

            // Account Manager — fractional for small ops (<10 FTEs = shared 0.5)
            const acctMgrHC = totalDirectFte < 10 ? 0.5 : 1;
            addIndirect('Account Manager', acctMgrHC, 38, 32);

            // General Manager: 1 for 50+ total FTEs
            const totalIndirectSoFar = this.projectData.indirectLaborLines.reduce((s,l) => s + l.headcount, 0);
            if ((totalDirectFte + totalIndirectSoFar) >= 50) {
                addIndirect('General Manager', 1, 55, 32);
            }
        }

        this.renderLaborTable();
        this.renderIndirectLaborTable();
        this.updateLaborTotals();
    },

    getOvertimePct() {
        return (parseFloat(document.getElementById('overtimePct').value) || 0) / 100;
    },
    getBenefitLoadPct() {
        return (parseFloat(document.getElementById('benefitLoadPct').value) || 35) / 100;
    },
    getBonusPct() {
        return (parseFloat(document.getElementById('bonusPct').value) || 0) / 100;
    },
    getLaborEscalationPct() {
        return (parseFloat(document.getElementById('laborEscalation').value) || 3) / 100;
    },

    // Seasonality helpers
    getSeasonalityProfile() {
        var inputs = document.querySelectorAll('.cm-seasonality');
        var profile = [];
        inputs.forEach(function(inp) { profile.push(parseFloat(inp.value) || 1.0); });
        return profile.length === 12 ? profile : [1,1,1,1,1,1,1,1,1,1,1,1];
    },
    setSeasonalityProfile(profile) {
        var inputs = document.querySelectorAll('.cm-seasonality');
        inputs.forEach(function(inp, i) { inp.value = (profile && profile[i] != null) ? profile[i] : 1.0; });
        this.updateSeasonalitySummary();
    },
    updateSeasonalitySummary() {
        var profile = this.getSeasonalityProfile();
        var peak = Math.max.apply(null, profile);
        var avg = profile.reduce(function(s,v){return s+v;},0) / 12;
        var el = document.getElementById('seasonalitySummary');
        if (el) el.textContent = 'Peak: ' + fmtNum(peak, 2) + 'x | Avg: ' + fmtNum(avg, 2) + 'x';
    },
    applySeasonalityPreset(preset) {
        var profiles = {
            flat:         [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
            ecommerce:    [0.70, 0.65, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00, 1.10, 1.20, 1.50, 1.60],
            retail:       [0.80, 0.75, 0.85, 0.90, 0.95, 0.90, 0.85, 0.95, 1.00, 1.15, 1.40, 1.50],
            backtoschool: [0.80, 0.80, 0.85, 0.90, 1.00, 1.20, 1.40, 1.50, 1.10, 0.85, 0.80, 0.80]
        };
        this.setSeasonalityProfile(profiles[preset] || profiles.flat);
        this.markChanged();
    },

    // Learning curve: average productivity factor for Year 1
    getLearningCurveFactor(complexityTier) {
        var rampMap = {
            low: parseInt(document.getElementById('rampWeeksLow').value) || 2,
            medium: parseInt(document.getElementById('rampWeeksMed').value) || 4,
            high: parseInt(document.getElementById('rampWeeksHigh').value) || 8
        };
        var rampWeeks = rampMap[complexityTier || 'medium'] || 4;
        // Productivity curve: starts at 60%, reaches 95% at end of ramp, 100% after
        // Average productivity during ramp = (0.60 + 0.95) / 2 = 0.775
        // For Year 1 (52 weeks): weighted avg = (rampWeeks * 0.775 + (52 - rampWeeks) * 1.0) / 52
        var avgRampProductivity = 0.775;
        var steadyWeeks = Math.max(0, 52 - rampWeeks);
        return (rampWeeks * avgRampProductivity + steadyWeeks * 1.0) / 52;
    },

    updateLaborTotals() {
        const otPct = this.getOvertimePct();
        const benefitLoad = this.getBenefitLoadPct();
        let directTotal = 0;
        let indirectTotal = 0;

        this.projectData.laborLines.forEach(line => {
            const hours = line.annual_hours || 0;
            const rate = line.hourly_rate || 0;
            const burden = line.burden_pct != null ? (line.burden_pct / 100) : benefitLoad;
            // OT premium: otPct of hours paid at 1.5x, rest at 1.0x
            const effectiveRate = rate * (1 + burden) * (1 + otPct * 0.5);
            directTotal += hours * effectiveRate;
        });

        this.projectData.indirectLaborLines.forEach(line => {
            const hours = this.getOperatingHours();
            const rate = line.hourly_rate || 0;
            const burden = line.burden_pct != null ? (line.burden_pct / 100) : benefitLoad;
            const bonusMult = 1 + this.getBonusPct();
            indirectTotal += (line.headcount || 0) * hours * rate * (1 + burden) * bonusMult;
        });

        const totalLaborCost = directTotal + indirectTotal;

        // Update labor totals display elements
        const directElement = document.getElementById('laborTotalDirect');
        const indirectElement = document.getElementById('laborTotalIndirect');
        const totalElement = document.getElementById('laborTotalAmount');

        if (directElement) directElement.textContent = '$' + directTotal.toLocaleString('en-US', {maximumFractionDigits: 0});
        if (indirectElement) indirectElement.textContent = '$' + indirectTotal.toLocaleString('en-US', {maximumFractionDigits: 0});
        if (totalElement) totalElement.textContent = '$' + totalLaborCost.toLocaleString('en-US', {maximumFractionDigits: 0});

        // Update total FTEs (avg and peak)
        const ftesElement = document.getElementById('laborTotalFtes');
        if (ftesElement) ftesElement.textContent = fmtNum(this.getTotalFtes(), 0);

        // Update card-level summary elements
        const opHours = this.getOperatingHours();
        const directFtes = opHours > 0 ? this.projectData.laborLines.reduce((s, l) => s + (l.annual_hours || 0), 0) / opHours : 0;
        const indirectFtes = this.projectData.indirectLaborLines.reduce((s, l) => s + (l.headcount || 0), 0);

        // Peak staffing from seasonality
        const seasonality = this.getSeasonalityProfile();
        const peakMult = Math.max.apply(null, seasonality);
        const peakDirectFtes = directFtes * peakMult;
        const peakTotal = peakDirectFtes + indirectFtes;

        const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        el('totalDirectFtes', fmtNum(directFtes, 1));
        el('totalIndirectFtes', fmtNum(indirectFtes, 1));
        el('totalHeadcount', fmtNum(directFtes + indirectFtes, 0));
        el('peakHeadcount', fmtNum(peakTotal, 0));
        el('totalLaborCost', '$' + totalLaborCost.toLocaleString('en-US', {maximumFractionDigits: 0}));
    },

    _cmInp(type, val, idx, arr, key, opts) {
        const w = (opts && opts.w) || 80;
        const step = (opts && opts.step) || (type === 'number' ? '0.01' : undefined);
        const ph = (opts && opts.ph) || '';
        // Text inputs: update on blur only (avoid re-render stealing focus)
        // Number inputs: update on input for live calculated column updates
        const events = type === 'number'
            ? 'onchange="cmApp._updateLine(\'' + arr + '\',' + idx + ',\'' + key + '\',this.value,\'' + type + '\')" ' +
              'oninput="cmApp._updateLine(\'' + arr + '\',' + idx + ',\'' + key + '\',this.value,\'' + type + '\')"'
            : 'onchange="cmApp._updateLine(\'' + arr + '\',' + idx + ',\'' + key + '\',this.value,\'' + type + '\')" ' +
              'onblur="cmApp._updateLine(\'' + arr + '\',' + idx + ',\'' + key + '\',this.value,\'' + type + '\')"';
        return '<input type="' + type + '" class="cm-input" style="width:' + w + 'px;padding:4px 6px;font-size:12px;" ' +
            'value="' + (val === 0 && type === 'number' ? '' : (val || '').toString().replace(/"/g, '&quot;')) + '" placeholder="' + ph + '" ' +
            (step ? 'step="' + step + '" ' : '') +
            events + '>';
    },
    // Fields that trigger calculated column updates (require re-render)
    _calcFields: {
        laborLines: ['volume','base_uph','hourly_rate','burden_pct','mhe_equipment_id','it_equipment_id','most_template_id'],
        indirectLaborLines: ['headcount','hourly_rate','burden_pct'],
        equipmentLines: ['quantity','monthly_cost','monthly_maintenance','amort_years'],
        overheadLines: ['monthly_cost','annual_cost'],
        vasLines: ['volume','rate','monthly_cost'],
        startupLines: ['one_time_cost'],
        volumeLines: ['annual_volume']
    },

    _updateLine(arr, idx, key, val, type) {
        const line = this.projectData[arr][idx];
        if (!line) return;
        line[key] = type === 'number' ? (parseFloat(val) || 0) : val;

        // Check if this field affects calculated columns
        const needsRender = (this._calcFields[arr] || []).indexOf(key) !== -1;

        // Recalculate labor hours if relevant fields changed
        if (arr === 'laborLines' && (key === 'volume' || key === 'adjusted_uph')) {
            line.annual_hours = line.adjusted_uph > 0 ? (line.volume || 0) / line.adjusted_uph : 0;
        }
        if (arr === 'laborLines' && key === 'base_uph') {
            const profile = this.refData.allowanceProfiles.find(p => p.id == document.getElementById('allowanceProfile').value);
            const allowancePct = profile ? (profile.total_allowance_pct || 15) : 15;
            line.adjusted_uph = line.base_uph * (1 - allowancePct / 100);
            line.annual_hours = line.adjusted_uph > 0 ? (line.volume || 0) / line.adjusted_uph : 0;
        }

        // Only re-render if a calculated field changed; text-only edits just save data
        if (needsRender) {
            if (arr === 'laborLines') {
                // Inline update computed cells instead of full re-render (prevents focus loss)
                const operatingHours = this.getOperatingHours();
                const fte = operatingHours > 0 ? (line.annual_hours || 0) / operatingHours : 0;
                const annualCost = (line.annual_hours || 0) * (line.hourly_rate || 0) * (1 + (line.burden_pct || 0) / 100);
                const volCell = document.getElementById('labor-vol-' + idx);
                const auphCell = document.getElementById('labor-auph-' + idx);
                const hrsCell = document.getElementById('labor-hrs-' + idx);
                const fteCell = document.getElementById('labor-fte-' + idx);
                const costCell = document.getElementById('labor-cost-' + idx);
                if (volCell) volCell.textContent = Math.round(line.volume || 0).toLocaleString('en-US');
                if (auphCell) auphCell.textContent = Math.round(line.adjusted_uph || 0).toLocaleString('en-US');
                if (hrsCell) hrsCell.textContent = (line.annual_hours || 0).toLocaleString('en-US', {minimumFractionDigits:1, maximumFractionDigits:1});
                if (fteCell) fteCell.textContent = fmtNum(fte, 2);
                if (costCell) costCell.textContent = '$' + annualCost.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                this.updateLaborTotals();
            }
            else if (arr === 'indirectLaborLines') {
                // Inline update computed cell instead of full re-render
                const hrs = (line.headcount || 0) * this.getOperatingHours();
                line.annual_hours = hrs;
                const annualCost = hrs * (line.hourly_rate || 0) * (1 + (line.burden_pct || 0) / 100);
                const costCell = document.getElementById('indirect-cost-' + idx);
                if (costCell) costCell.textContent = '$' + annualCost.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                this.updateLaborTotals();
            }
            else if (arr === 'equipmentLines') {
                // Inline update: recompute with lease/buy logic
                var ownType = line.ownership_type || line.acquisition_type || 'lease';
                var eqAnnualCost;
                if (ownType === 'purchase') {
                    var amYrs = line.amort_years || 5;
                    var acq = line.acquisition_cost || 0;
                    var mPct = line.maintenance_pct || 0.10;
                    eqAnnualCost = ((acq / amYrs) + (acq * mPct)) * (line.quantity || 1);
                } else {
                    eqAnnualCost = ((line.monthly_cost || 0) + (line.monthly_maintenance || 0)) * (line.quantity || 1) * 12;
                }
                const costCell = document.getElementById('equip-cost-' + idx);
                if (costCell) costCell.textContent = '$' + eqAnnualCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                const eqTotal = this.calculateEquipmentCost();
                const eqEl = document.getElementById('totalEquipmentCost');
                if (eqEl) eqEl.textContent = '$' + eqTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                this.renderEquipmentSummaryCard();
            }
            else if (arr === 'overheadLines') {
                // Inline update computed cell instead of full re-render
                const annualCost = line.annual_cost || ((line.monthly_cost || 0) * 12);
                const costCell = document.getElementById('overhead-cost-' + idx);
                if (costCell) costCell.textContent = '$' + annualCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                const totalAnnual = this.calculateOverheadCost();
                const totalEl = document.getElementById('totalOverheadCost');
                if (totalEl) totalEl.textContent = '$' + totalAnnual.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
            else if (arr === 'vasLines') {
                // VAS uses card rendering — re-render full cards on any field change
                this.renderVasTable();
            }
            else if (arr === 'volumeLines') {
                // Update daily volume cell inline instead of full re-render (prevents focus loss)
                const opDays = this.getOperatingDays();
                const daily = opDays > 0 ? (line.annual_volume || 0) / opDays : 0;
                line.daily_volume = daily;
                const dailyCell = document.getElementById('vol-daily-' + idx);
                if (dailyCell) dailyCell.textContent = daily.toLocaleString('en-US', {minimumFractionDigits:1, maximumFractionDigits:1});
                this.syncVolumesToLegacy();
            }
            else if (arr === 'startupLines') {
                if (key === 'one_time_cost') {
                    const termYears = parseFloat(document.getElementById('contractTerm').value) || 3;
                    line.annual_amort = termYears > 0 ? line.one_time_cost / termYears : 0;
                    line.monthly_amort = line.annual_amort / 12;
                }
                // Inline update computed cells instead of full re-render
                const moCell = document.getElementById('startup-mo-' + idx);
                const yrCell = document.getElementById('startup-yr-' + idx);
                if (moCell) moCell.textContent = '$' + (line.monthly_amort || 0).toLocaleString('en-US', {maximumFractionDigits:0});
                if (yrCell) yrCell.textContent = '$' + (line.annual_amort || 0).toLocaleString('en-US', {maximumFractionDigits:0});
                // Update summary totals
                let totalCapital = 0, totalAnnualAmort = 0;
                this.projectData.startupLines.forEach(l => { totalCapital += l.one_time_cost || 0; totalAnnualAmort += l.annual_amort || 0; });
                const investEl = document.getElementById('totalCapitalInvestment');
                const amortEl = document.getElementById('totalAnnualAmortization');
                if (investEl) investEl.textContent = '$' + totalCapital.toLocaleString('en-US', {maximumFractionDigits:0});
                if (amortEl) amortEl.textContent = '$' + totalAnnualAmort.toLocaleString('en-US', {maximumFractionDigits:0});
            }
        }
        this.markChanged();
    },

    _mostSelectHtml(idx, currentId) {
        var templates = (this.refData.mostTemplates || []).filter(function(t) { return t.is_active !== false; });
        var html = '<div style="display:flex;align-items:center;gap:4px;">';
        html += '<select class="cm-input" style="width:115px;padding:4px 6px;font-size:11px;" onchange="cmApp._updateLine(\'laborLines\',' + idx + ',\'most_template_id\',this.value,\'text\');cmApp._applyMostTemplate(' + idx + ',this.value)">';
        html += '<option value="">— Select —</option>';
        // Group by process_area
        var groups = {};
        templates.forEach(function(t) {
            var area = t.process_area || 'Other';
            if (!groups[area]) groups[area] = [];
            groups[area].push(t);
        });
        var areaOrder = ['Receiving','Putaway','Replenishment','Picking','Packing','Shipping','Returns','VAS'];
        var sortedKeys = areaOrder.filter(function(k) { return groups[k]; });
        Object.keys(groups).forEach(function(k) { if (sortedKeys.indexOf(k) === -1) sortedKeys.push(k); });
        sortedKeys.forEach(function(area) {
            html += '<optgroup label="' + area + '">';
            groups[area].forEach(function(t) {
                var selected = (String(t.id) === String(currentId)) ? ' selected' : '';
                var name = t.wms_transaction || t.activity_name || 'Template ' + t.id;
                if (name.length > 30) name = name.substring(0, 28) + '…';
                html += '<option value="' + t.id + '"' + selected + '>' + name + '</option>';
            });
            html += '</optgroup>';
        });
        html += '</select>';
        // Info icon to view template details (only shown when a template is selected)
        if (currentId) {
            html += '<button onclick="cmApp.viewMostTemplate(' + currentId + ')" title="View MOST template details" style="background:none;border:none;cursor:pointer;padding:2px;display:flex;align-items:center;opacity:0.5;transition:opacity 0.15s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ies-blue,#2563eb)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>';
        }
        html += '</div>';
        return html;
    },

    _applyMostTemplate(idx, templateId) {
        var line = this.projectData.laborLines[idx];
        if (!templateId) {
            line.most_template_id = '';
            line.most_template_name = '';
            return;
        }
        var template = (this.refData.mostTemplates || []).find(function(t) { return String(t.id) === String(templateId); });
        if (template) {
            line.most_template_id = template.id;
            line.most_template_name = template.wms_transaction || template.activity_name || '';
            // Auto-fill activity name if blank
            if (!line.activity_name) {
                line.activity_name = template.activity_name || template.wms_transaction || '';
            }
            // Auto-fill base UPH from template if available and current is 0
            if ((!line.base_uph || line.base_uph === 0) && template.standard_uph) {
                line.base_uph = template.standard_uph;
            }
            // Auto-fill UOM from template
            if (template.uom) {
                line.uom = template.uom;
            }
        }
        this.renderLaborTable();
        this.updateLaborTotals();
    },

    viewMostTemplate(templateId) {
        var template = (this.refData.mostTemplates || []).find(function(t) { return t.id === templateId; });
        if (!template) return;

        var elements = (this.refData.mostElements || []).filter(function(e) { return e.template_id === templateId; }).sort(function(a,b) { return (a.sequence_order || 0) - (b.sequence_order || 0); });
        var totalTmu = elements.reduce(function(s,e) { return s + (e.tmu_value || 0); }, 0);
        var uph = totalTmu > 0 ? Math.round(100000 / (totalTmu * 0.6)) : (template.units_per_hour_base || 0);

        // Build the popout content
        var overlay = document.getElementById('cmPopoutOverlay');
        var popout = document.getElementById('cmPopout');
        var body = document.getElementById('cmPopoutBody');
        var titleEl = document.getElementById('cmPopoutTitle');

        this._popoutSource = 'mostDetail';
        titleEl.textContent = 'MOST Template — ' + (template.activity_name || template.wms_transaction || 'Template');

        var html = '';
        // Header info card
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">';
        html += '<div style="background:var(--ies-gray-50,#f9fafb);border-radius:8px;padding:16px;">';
        html += '<div style="font-size:11px;color:var(--ies-gray-400);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Template Info</div>';
        html += '<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:13px;">';
        html += '<span style="color:var(--ies-gray-400);">Activity:</span><span style="font-weight:600;">' + (template.activity_name || '—') + '</span>';
        html += '<span style="color:var(--ies-gray-400);">WMS Transaction:</span><span>' + (template.wms_transaction || '—') + '</span>';
        html += '<span style="color:var(--ies-gray-400);">Process Area:</span><span>' + (template.process_area || '—') + '</span>';
        html += '<span style="color:var(--ies-gray-400);">Equipment:</span><span>' + (template.equipment_type || 'None') + '</span>';
        html += '<span style="color:var(--ies-gray-400);">UOM:</span><span>' + (template.uom || '—') + '</span>';
        html += '</div></div>';

        html += '<div style="background:var(--ies-gray-50,#f9fafb);border-radius:8px;padding:16px;">';
        html += '<div style="font-size:11px;color:var(--ies-gray-400);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Performance</div>';
        html += '<div style="display:flex;gap:24px;align-items:baseline;">';
        html += '<div><span style="font-size:28px;font-weight:700;color:var(--ies-blue,#2563eb);">' + (template.units_per_hour_base || uph || 0) + '</span><span style="font-size:12px;color:var(--ies-gray-400);margin-left:4px;">UPH</span></div>';
        html += '<div><span style="font-size:28px;font-weight:700;color:var(--ies-gray-600);">' + (template.total_tmu_base || totalTmu) + '</span><span style="font-size:12px;color:var(--ies-gray-400);margin-left:4px;">TMU</span></div>';
        html += '</div>';
        if (template.description) {
            html += '<div style="margin-top:12px;font-size:12px;color:var(--ies-gray-500);line-height:1.5;">' + template.description + '</div>';
        }
        html += '</div></div>';

        // Elements breakdown table
        if (elements.length > 0) {
            html += '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">MOST Element Breakdown (' + elements.length + ' steps)</div>';
            html += '<div style="overflow-x:auto;border:1px solid var(--ies-gray-200,#e5e7eb);border-radius:8px;">';
            html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
            html += '<thead><tr style="background:var(--ies-gray-50,#f9fafb);">';
            html += '<th style="padding:8px 10px;text-align:left;font-weight:600;border-bottom:1px solid var(--ies-gray-200,#e5e7eb);">#</th>';
            html += '<th style="padding:8px 10px;text-align:left;font-weight:600;border-bottom:1px solid var(--ies-gray-200,#e5e7eb);">Element</th>';
            html += '<th style="padding:8px 10px;text-align:left;font-weight:600;border-bottom:1px solid var(--ies-gray-200,#e5e7eb);">MOST Sequence</th>';
            html += '<th style="padding:8px 10px;text-align:left;font-weight:600;border-bottom:1px solid var(--ies-gray-200,#e5e7eb);">Type</th>';
            html += '<th style="padding:8px 10px;text-align:right;font-weight:600;border-bottom:1px solid var(--ies-gray-200,#e5e7eb);">TMU</th>';
            html += '<th style="padding:8px 10px;text-align:center;font-weight:600;border-bottom:1px solid var(--ies-gray-200,#e5e7eb);">Variable?</th>';
            html += '</tr></thead><tbody>';

            elements.forEach(function(el, i) {
                var rowBg = i % 2 === 0 ? '' : 'background:var(--ies-gray-50,#f9fafb);';
                var varBadge = el.is_variable
                    ? '<span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:4px;font-size:11px;">' + (el.variable_driver || 'Yes') + '</span>'
                    : '<span style="color:var(--ies-gray-300);">—</span>';
                var seqType = (el.sequence_type || '').replace(/_/g, ' ');
                html += '<tr style="' + rowBg + '">';
                html += '<td style="padding:6px 10px;border-bottom:1px solid var(--ies-gray-100,#f3f4f6);color:var(--ies-gray-400);">' + (el.sequence_order || (i + 1)) + '</td>';
                html += '<td style="padding:6px 10px;border-bottom:1px solid var(--ies-gray-100,#f3f4f6);font-weight:500;">' + (el.element_name || '—') + '</td>';
                html += '<td style="padding:6px 10px;border-bottom:1px solid var(--ies-gray-100,#f3f4f6);font-family:monospace;font-size:11px;color:var(--ies-gray-500);">' + (el.most_sequence || '—') + '</td>';
                html += '<td style="padding:6px 10px;border-bottom:1px solid var(--ies-gray-100,#f3f4f6);font-size:11px;color:var(--ies-gray-400);text-transform:capitalize;">' + seqType + '</td>';
                html += '<td style="padding:6px 10px;border-bottom:1px solid var(--ies-gray-100,#f3f4f6);text-align:right;font-weight:600;">' + (el.tmu_value || 0) + '</td>';
                html += '<td style="padding:6px 10px;border-bottom:1px solid var(--ies-gray-100,#f3f4f6);text-align:center;">' + varBadge + '</td>';
                html += '</tr>';
            });

            // Total row
            html += '<tr style="background:var(--ies-gray-100,#f3f4f6);font-weight:600;">';
            html += '<td colspan="4" style="padding:8px 10px;text-align:right;">Total TMU</td>';
            html += '<td style="padding:8px 10px;text-align:right;">' + totalTmu + '</td>';
            html += '<td></td></tr>';
            html += '</tbody></table></div>';
        } else {
            html += '<div style="padding:24px;text-align:center;color:var(--ies-gray-400);font-size:13px;">No MOST elements defined for this template yet.</div>';
        }

        // Notes
        if (template.notes) {
            html += '<div style="margin-top:16px;padding:12px;background:#eff6ff;border-radius:8px;font-size:12px;color:var(--ies-blue,#2563eb);line-height:1.5;">';
            html += '<strong>Notes:</strong> ' + template.notes + '</div>';
        }

        body.innerHTML = html;
        overlay.classList.add('open');
        popout.classList.add('open');
        document.body.style.overflow = 'hidden';
    },

    _equipSelectHtml(category, idx, currentId, fieldKey) {
        var catalog = (this.refData.equipmentCatalog || []).filter(function(e) { return e.category === category; });
        var html = '<select class="cm-input" style="width:120px;padding:4px 6px;font-size:11px;" onchange="cmApp._updateLine(\'laborLines\',' + idx + ',\'' + fieldKey + '\',this.value,\'text\')">';
        html += '<option value="">— None —</option>';
        // Group by subcategory
        var groups = {};
        catalog.forEach(function(e) {
            var sub = e.subcategory || 'Other';
            if (!groups[sub]) groups[sub] = [];
            groups[sub].push(e);
        });
        Object.keys(groups).sort().forEach(function(sub) {
            html += '<optgroup label="' + sub + '">';
            groups[sub].forEach(function(e) {
                var selected = (e.id === currentId) ? ' selected' : '';
                var shortName = e.name.length > 28 ? e.name.substring(0, 26) + '…' : e.name;
                html += '<option value="' + e.id + '"' + selected + '>' + shortName + '</option>';
            });
            html += '</optgroup>';
        });
        html += '</select>';
        return html;
    },

    _uomSelectHtml(idx, current) {
        var uoms = ['each','case','carton','pallet','order','line','unit','lb','cu ft'];
        var html = '<select class="cm-input" style="width:70px;padding:4px 4px;font-size:11px;" onchange="cmApp._updateLine(\'laborLines\',' + idx + ',\'uom\',this.value,\'text\')">';
        html += '<option value="">—</option>';
        uoms.forEach(function(u) {
            html += '<option value="' + u + '"' + (u === current ? ' selected' : '') + '>' + u + '</option>';
        });
        html += '</select>';
        return html;
    },

    _volumeSourceSelectHtml(idx, currentId) {
        let html = '<select class="cm-input" style="width:100px;padding:4px 4px;font-size:11px;" onchange="cmApp.onVolumeSourceChange(' + idx + ', this.value)">';
        html += '<option value="">-- Manual --</option>';
        this.projectData.volumeLines.forEach(vl => {
            const sel = (vl.name === currentId) ? ' selected' : '';
            html += '<option value="' + vl.name + '"' + sel + '>' + vl.name + '</option>';
        });
        html += '</select>';
        return html;
    },

    onVolumeSourceChange(idx, volumeLineName) {
        const volumeLine = this.projectData.volumeLines.find(v => v.name === volumeLineName);
        const line = this.projectData.laborLines[idx];
        if (volumeLine) {
            line.volume_line_id = volumeLineName;
            line.volume = volumeLine.annual_volume;
            // Auto-update UOM to match if there's a mismatch (but allow override)
        } else {
            line.volume_line_id = '';
        }
        this.renderLaborTable();
        this.markChanged();
    },

    _complexitySelectHtml(idx, current) {
        var tiers = [{v:'low',l:'Low'},{v:'medium',l:'Med'},{v:'high',l:'High'}];
        var html = '<select class="cm-input" style="width:60px;padding:4px 4px;font-size:11px;" onchange="cmApp._updateLine(\'laborLines\',' + idx + ',\'complexity_tier\',this.value,\'text\')">';
        tiers.forEach(function(t) {
            html += '<option value="' + t.v + '"' + (t.v === (current || 'medium') ? ' selected' : '') + '>' + t.l + '</option>';
        });
        html += '</select>';
        return html;
    },

    renderLaborTable() {
        const tbody = document.getElementById('laborTable');
        tbody.innerHTML = '';
        const operatingHours = this.getOperatingHours();

        var shiftsPerDay = parseFloat(document.getElementById('shiftsPerDay').value) || 1;
        var shift2Prem = (parseFloat(document.getElementById('shift2Premium').value) || 0) / 100;
        var shift3Prem = (parseFloat(document.getElementById('shift3Premium').value) || 0) / 100;
        var totalLines = this.projectData.laborLines.length;

        this.projectData.laborLines.forEach((line, idx) => {
            // Assign shift based on position in line list and shifts per day
            var shiftNum = 1;
            if (shiftsPerDay >= 3 && totalLines >= 3) {
                var third = Math.ceil(totalLines / 3);
                if (idx >= third * 2) shiftNum = 3;
                else if (idx >= third) shiftNum = 2;
            } else if (shiftsPerDay >= 2 && totalLines >= 2) {
                if (idx >= Math.ceil(totalLines / 2)) shiftNum = 2;
            }
            line.shift_num = shiftNum;

            var diffPct = shiftNum === 3 ? shift3Prem : (shiftNum === 2 ? shift2Prem : 0);
            var adjRate = (line.hourly_rate || 0) * (1 + diffPct);
            var annualCost = (line.annual_hours || 0) * adjRate * (1 + (line.burden_pct || 0) / 100);
            const fte = operatingHours > 0 ? (line.annual_hours || 0) / operatingHours : 0;
            const uomLabel = line.uom ? '<span style="font-size:11px;color:var(--ies-gray-400);">/' + line.uom + '</span>' : '';

            // Volume source: auto-populate from named volume line if selected
            let volumeSourceHtml = this._volumeSourceSelectHtml(idx, line.volume_line_id, line.uom);

            // UOM mismatch warning
            let uomWarning = '';
            if (line.volume_line_id) {
                const volumeLine = this.projectData.volumeLines.find(v => v.name === line.volume_line_id);
                if (volumeLine && volumeLine.uom !== line.uom) {
                    uomWarning = '<span style="display:inline-block;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;font-size:11px;margin-left:4px;font-weight:600;">UOM !</span>';
                }
            }

            var shiftLabel = shiftNum === 1 ? 'Day' : (shiftNum === 2 ? 'Eve' : 'Night');

            const row = document.createElement('tr');
            row.innerHTML =
                '<td>' + this._cmInp('text', line.activity_name, idx, 'laborLines', 'activity_name', {w:100, ph:'Activity'}) + '</td>' +
                '<td>' + this._mostSelectHtml(idx, line.most_template_id) + '</td>' +
                '<td>' + this._uomSelectHtml(idx, line.uom) + '</td>' +
                '<td>' + volumeSourceHtml + '</td>' +
                '<td class="cm-table-number" id="labor-vol-' + idx + '">' + Math.round(line.volume || 0).toLocaleString('en-US') + '</td>' +
                '<td><div style="display:flex;align-items:center;gap:2px;">' + this._cmInp('number', line.base_uph, idx, 'laborLines', 'base_uph', {w:55, step:'1', ph:'UPH'}) + uomLabel + '</div></td>' +
                '<td class="cm-table-number" id="labor-auph-' + idx + '">' + Math.round(line.adjusted_uph || 0).toLocaleString('en-US') + '</td>' +
                '<td>' + this._complexitySelectHtml(idx, line.complexity_tier) + '</td>' +
                '<td class="cm-table-number" id="labor-hrs-' + idx + '">' + (line.annual_hours || 0).toLocaleString('en-US', {minimumFractionDigits:1, maximumFractionDigits:1}) + '</td>' +
                '<td class="cm-table-number" id="labor-fte-' + idx + '">' + fmtNum(fte, 2) + '</td>' +
                '<td style="text-align:center;font-size:11px;">' + esc(shiftLabel) + '</td>' +
                '<td class="cm-table-number" style="font-size:11px;">' + fmtNum(diffPct * 100, 0) + '%</td>' +
                '<td class="cm-table-number" style="font-size:11px;">' + fmtNum(adjRate, 2, '$') + '</td>' +
                '<td>' + this._equipSelectHtml('MHE', idx, line.mhe_equipment_id, 'mhe_equipment_id') + '</td>' +
                '<td>' + this._equipSelectHtml('Systems', idx, line.it_equipment_id, 'it_equipment_id') + '</td>' +
                '<td>' + this._cmInp('number', line.hourly_rate, idx, 'laborLines', 'hourly_rate', {w:60, ph:'$/hr'}) + '</td>' +
                '<td class="cm-table-number" id="labor-cost-' + idx + '" style="font-weight:600;">$' + annualCost.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0}) + uomWarning + '</td>' +
                '<td>' + this.bucketSelectHtml('labor', idx, line.pricing_bucket) + '</td>' +
                '<td class="cm-table-actions"><button class="cm-btn-small cm-btn-small-danger" onclick="cmApp.deleteLaborLine(' + idx + ')">Delete</button></td>';
            tbody.appendChild(row);
        });

        // Update effective hours per FTE after absence allowance
        var absencePct = (parseFloat(document.getElementById('absenceAllowance').value) || 0) / 100;
        var effectiveHrs = operatingHours * (1 - absencePct);
        var effEl = document.getElementById('effectiveHoursPerFte');
        if (effEl) effEl.textContent = effectiveHrs.toLocaleString('en-US', {maximumFractionDigits: 0});
    },

    renderIndirectLaborTable() {
        const tbody = document.getElementById('indirectLaborTable');
        tbody.innerHTML = '';

        this.projectData.indirectLaborLines.forEach((line, idx) => {
            const hrs = (line.headcount || 0) * this.getOperatingHours();
            line.annual_hours = hrs;
            const annualCost = hrs * (line.hourly_rate || 0) * (1 + (line.burden_pct || 0) / 100);
            const row = document.createElement('tr');
            row.innerHTML =
                '<td>' + this._cmInp('text', line.role_name, idx, 'indirectLaborLines', 'role_name', {w:120, ph:'Role'}) + '</td>' +
                '<td>' + this._cmInp('number', line.headcount, idx, 'indirectLaborLines', 'headcount', {w:50, step:'1', ph:'#'}) + '</td>' +
                '<td>' + this._cmInp('number', line.hourly_rate, idx, 'indirectLaborLines', 'hourly_rate', {w:60, ph:'$/hr'}) + '</td>' +
                '<td class="cm-table-number" id="indirect-cost-' + idx + '" style="font-weight:600;">$' + annualCost.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0}) + '</td>' +
                '<td>' + this.bucketSelectHtml('indirect', idx, line.pricing_bucket) + '</td>' +
                '<td class="cm-table-actions"><button class="cm-btn-small cm-btn-small-danger" onclick="cmApp.deleteIndirectLaborLine(' + idx + ')">Delete</button></td>';
            tbody.appendChild(row);
        });
    },

    renderEquipmentTable() {
        const tbody = document.getElementById('equipmentTable');
        tbody.innerHTML = '';

        this.projectData.equipmentLines.forEach((line, idx) => {
            var ownType = line.ownership_type || line.acquisition_type || 'lease';
            var annualCost;
            if (ownType === 'purchase') {
                var amortYrs = line.amort_years || 5;
                var acqCost = line.acquisition_cost || 0;
                var maintPct = line.maintenance_pct || 0.10;
                annualCost = ((acqCost / amortYrs) + (acqCost * maintPct)) * (line.quantity || 1);
            } else {
                var monthlyTotal = ((line.monthly_cost || 0) + (line.monthly_maintenance || 0)) * (line.quantity || 1);
                annualCost = monthlyTotal * 12;
            }
            const row = document.createElement('tr');
            row.innerHTML =
                '<td>' + this._cmInp('text', line.equipment_name, idx, 'equipmentLines', 'equipment_name', {w:110, ph:'Equipment'}) + '</td>' +
                '<td>' + this._cmInp('text', line.category, idx, 'equipmentLines', 'category', {w:80, ph:'Category'}) + '</td>' +
                '<td>' + this._cmInp('number', line.quantity, idx, 'equipmentLines', 'quantity', {w:45, step:'1', ph:'Qty'}) + '</td>' +
                '<td><select class="cm-input" style="width:75px;font-size:12px;" onchange="cmApp._updateField(\'equipmentLines\',' + idx + ',\'ownership_type\',this.value);cmApp.renderEquipmentTable();">' +
                    '<option value="lease"' + (ownType === 'lease' ? ' selected' : '') + '>Lease</option>' +
                    '<option value="purchase"' + (ownType === 'purchase' ? ' selected' : '') + '>Purchase</option>' +
                '</select></td>' +
                '<td>' + this._cmInp('number', line.monthly_cost, idx, 'equipmentLines', 'monthly_cost', {w:65, ph:'$/mo'}) + '</td>' +
                '<td>' + this._cmInp('number', line.monthly_maintenance, idx, 'equipmentLines', 'monthly_maintenance', {w:65, ph:'Maint'}) + '</td>' +
                '<td>' + this._cmInp('number', line.acquisition_cost, idx, 'equipmentLines', 'acquisition_cost', {w:70, ph:'$0'}) + '</td>' +
                '<td>' + this._cmInp('number', line.amort_years, idx, 'equipmentLines', 'amort_years', {w:45, step:'1', ph:'5'}) + '</td>' +
                '<td class="cm-table-number" id="equip-cost-' + idx + '" style="font-weight:600;">$' + annualCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</td>' +
                '<td>' + this._cmInp('text', line.driven_by, idx, 'equipmentLines', 'driven_by', {w:80, ph:'Driver'}) + '</td>' +
                '<td>' + this.bucketSelectHtml('equipment', idx, line.pricing_bucket) + '</td>' +
                '<td class="cm-table-actions"><button class="cm-btn-small cm-btn-small-danger" onclick="cmApp.deleteEquipmentLine(' + idx + ')">Delete</button></td>';
            tbody.appendChild(row);
        });
        const eqTotal = this.calculateEquipmentCost();
        const eqEl = document.getElementById('totalEquipmentCost');
        if (eqEl) eqEl.textContent = '$' + eqTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        this.renderEquipmentSummaryCard();
    },

    renderEquipmentSummaryCard() {
        var card = document.getElementById('equipmentSummaryCard');
        if (!card) return;
        var lines = this.projectData.equipmentLines;
        if (!lines || lines.length === 0) {
            card.innerHTML = '<div class="cm-card-title">Equipment Summary</div>' +
                '<div style="font-size:12px;color:var(--ies-gray-500);">Add equipment below to see summary.</div>';
            return;
        }
        var totalLease = 0, totalMaint = 0, totalCapital = 0, totalAmort = 0;
        lines.forEach(function(line) {
            var ownType = line.ownership_type || line.acquisition_type || 'lease';
            var qty = line.quantity || 1;
            if (ownType === 'purchase') {
                var acq = (line.acquisition_cost || 0) * qty;
                var amYrs = line.amort_years || 5;
                var mPct = line.maintenance_pct || 0.10;
                totalCapital += acq;
                totalAmort += acq / amYrs;
                totalMaint += acq * mPct;
            } else {
                totalLease += (line.monthly_cost || 0) * qty;
                totalMaint += (line.monthly_maintenance || 0) * qty * 12;
            }
        });
        var fmt = function(v) { return '$' + v.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0}); };
        card.innerHTML =
            '<div class="cm-card-title">Equipment Summary</div>' +
            '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px;">' +
                '<div style="padding:8px 12px;background:#f0f9ff;border-radius:6px;">' +
                    '<div style="font-size:10px;color:var(--ies-gray-500);text-transform:uppercase;">Monthly Lease</div>' +
                    '<div style="font-size:16px;font-weight:700;color:var(--ies-navy);">' + fmt(totalLease) + '/mo</div>' +
                '</div>' +
                '<div style="padding:8px 12px;background:#f0fdf4;border-radius:6px;">' +
                    '<div style="font-size:10px;color:var(--ies-gray-500);text-transform:uppercase;">Annual Maintenance</div>' +
                    '<div style="font-size:16px;font-weight:700;color:#059669;">' + fmt(totalMaint) + '/yr</div>' +
                '</div>' +
                '<div style="padding:8px 12px;background:#fefce8;border-radius:6px;">' +
                    '<div style="font-size:10px;color:var(--ies-gray-500);text-transform:uppercase;">Total Capital (Purchases)</div>' +
                    '<div style="font-size:16px;font-weight:700;color:#b45309;">' + fmt(totalCapital) + '</div>' +
                '</div>' +
                '<div style="padding:8px 12px;background:#faf5ff;border-radius:6px;">' +
                    '<div style="font-size:10px;color:var(--ies-gray-500);text-transform:uppercase;">Amortized Annual Capital</div>' +
                    '<div style="font-size:16px;font-weight:700;color:#7c3aed;">' + fmt(totalAmort) + '/yr</div>' +
                '</div>' +
            '</div>';
    },

    renderOverheadTable() {
        const tbody = document.getElementById('overheadTable');
        tbody.innerHTML = '';

        this.projectData.overheadLines.forEach((line, idx) => {
            const annualCost = line.annual_cost || ((line.monthly_cost || 0) * 12);
            const row = document.createElement('tr');
            row.innerHTML =
                '<td>' + this._cmInp('text', line.category, idx, 'overheadLines', 'category', {w:110, ph:'Category'}) + '</td>' +
                '<td>' + this._cmInp('text', line.description, idx, 'overheadLines', 'description', {w:100, ph:'Description'}) + '</td>' +
                '<td>' + this._cmInp('number', line.rate, idx, 'overheadLines', 'rate', {w:60, ph:'Rate'}) + '</td>' +
                '<td>' + this._cmInp('number', line.quantity, idx, 'overheadLines', 'quantity', {w:50, step:'1', ph:'Qty'}) + '</td>' +
                '<td>' + this._cmInp('number', line.monthly_cost, idx, 'overheadLines', 'monthly_cost', {w:70, ph:'$/mo'}) + '</td>' +
                '<td class="cm-table-number" id="overhead-cost-' + idx + '" style="font-weight:600;">$' + annualCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</td>' +
                '<td>' + this.bucketSelectHtml('overhead', idx, line.pricing_bucket) + '</td>' +
                '<td class="cm-table-actions"><button class="cm-btn-small cm-btn-small-danger" onclick="cmApp.deleteOverheadLine(' + idx + ')">Delete</button></td>';
            tbody.appendChild(row);
        });

        const totalAnnual = this.calculateOverheadCost();
        const totalEl = document.getElementById('totalOverheadCost');
        if (totalEl) totalEl.textContent = '$' + totalAnnual.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    },

    renderVasTable() {
        const container = document.getElementById('vasCardsContainer');
        if (!container) return;
        // Clear all children except the empty hint
        var hint = document.getElementById('vasEmptyHint');
        container.innerHTML = '';
        if (hint) container.appendChild(hint);

        if (this.projectData.vasLines.length === 0) {
            if (hint) hint.style.display = 'block';
        } else {
            if (hint) hint.style.display = 'none';
            var self = this;
            this.projectData.vasLines.forEach(function(line, idx) {
                var laborCost = 0, materialCost = 0, spaceCost = 0;
                var vol = line.volume || 0;
                // Labor: volume / UPH * rate * (1 + burden)
                if (line.uph && line.uph > 0 && line.labor_rate) {
                    var burden = (line.burden_pct || 35) / 100;
                    laborCost = (vol / line.uph) * line.labor_rate * (1 + burden);
                }
                // Material
                if (line.material_cost) materialCost = vol * line.material_cost;
                // Space: allocated SF * facility cost per SF
                if (line.space_sf && line.space_sf > 0) {
                    var totalSqft = parseFloat(document.getElementById('totalSqft').value) || 1;
                    var facCost = self.calculateFacilityCost();
                    spaceCost = line.space_sf * (facCost / Math.max(1, totalSqft));
                }
                var totalLineCost = laborCost + materialCost + spaceCost;
                // Fallback: if no breakdown fields, use simple rate * volume
                if (totalLineCost === 0) totalLineCost = (line.rate || 0) * vol;
                line.labor_cost = laborCost;
                line.total_cost = totalLineCost;

                var isExpanded = line._expanded ? true : false;
                var card = document.createElement('div');
                card.className = 'cm-card';
                card.style.cssText = 'margin-bottom:8px;border-left:3px solid var(--ies-blue);';
                card.innerHTML =
                    '<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="cmApp.toggleVasCard(' + idx + ')">' +
                        '<div style="display:flex;align-items:center;gap:12px;">' +
                            '<span style="font-size:10px;color:var(--ies-gray-400);">' + (isExpanded ? '&#9660;' : '&#9654;') + '</span>' +
                            '<strong style="font-size:13px;">' + esc(line.service_name || 'New Service') + '</strong>' +
                            '<span style="font-size:11px;color:var(--ies-gray-500);">' + esc(line.service_type || 'custom') + '</span>' +
                        '</div>' +
                        '<div style="display:flex;align-items:center;gap:16px;">' +
                            '<span id="vas-cost-' + idx + '" style="font-weight:700;font-size:13px;color:var(--ies-navy);">$' + totalLineCost.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0}) + '/yr</span>' +
                            '<button class="cm-btn-small cm-btn-small-danger" onclick="event.stopPropagation();cmApp.deleteVasLine(' + idx + ')">Delete</button>' +
                        '</div>' +
                    '</div>';
                if (isExpanded) {
                    card.innerHTML +=
                        '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--ies-gray-100);display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;font-size:12px;">' +
                            '<div class="cm-field-group"><label class="cm-field-label">Service Name</label>' + self._cmInp('text', line.service_name, idx, 'vasLines', 'service_name', {w:'100%', ph:'Service Name'}) + '</div>' +
                            '<div class="cm-field-group"><label class="cm-field-label">Service Type</label><select class="cm-input" style="width:100%;font-size:12px;" onchange="cmApp._updateField(\'vasLines\',' + idx + ',\'service_type\',this.value)">' +
                                '<option value="custom"' + (line.service_type === 'custom' ? ' selected' : '') + '>Custom</option>' +
                                '<option value="copacking"' + (line.service_type === 'copacking' ? ' selected' : '') + '>Co-packing / Kitting</option>' +
                                '<option value="labeling"' + (line.service_type === 'labeling' ? ' selected' : '') + '>Labeling / Ticketing</option>' +
                                '<option value="giftwrap"' + (line.service_type === 'giftwrap' ? ' selected' : '') + '>Gift Wrap / Packaging</option>' +
                                '<option value="returns"' + (line.service_type === 'returns' ? ' selected' : '') + '>Returns Processing</option>' +
                                '<option value="qc"' + (line.service_type === 'qc' ? ' selected' : '') + '>Quality Inspection</option>' +
                                '<option value="lottrack"' + (line.service_type === 'lottrack' ? ' selected' : '') + '>Lot Tracking</option>' +
                                '<option value="tempmon"' + (line.service_type === 'tempmon' ? ' selected' : '') + '>Temp Monitoring</option>' +
                                '<option value="datecode"' + (line.service_type === 'datecode' ? ' selected' : '') + '>Date Coding</option>' +
                            '</select></div>' +
                            '<div class="cm-field-group"><label class="cm-field-label">Rate ($/unit)</label>' + self._cmInp('number', line.rate, idx, 'vasLines', 'rate', {w:'100%', ph:'$/unit'}) + '</div>' +
                            '<div class="cm-field-group"><label class="cm-field-label">UOM</label>' + self._cmInp('text', line.uom, idx, 'vasLines', 'uom', {w:'100%', ph:'UOM'}) + '</div>' +
                            '<div class="cm-field-group"><label class="cm-field-label">Volume</label>' + self._cmInp('number', line.volume, idx, 'vasLines', 'volume', {w:'100%', step:'1', ph:'Volume'}) + '</div>' +
                            '<div class="cm-field-group"><label class="cm-field-label">UPH</label>' + self._cmInp('number', line.uph, idx, 'vasLines', 'uph', {w:'100%', step:'1', ph:'Units/hour'}) + '</div>' +
                            '<div class="cm-field-group"><label class="cm-field-label">Labor Rate ($/hr)</label>' + self._cmInp('number', line.labor_rate, idx, 'vasLines', 'labor_rate', {w:'100%', ph:'$/hr'}) + '</div>' +
                            '<div class="cm-field-group"><label class="cm-field-label">Material ($/unit)</label>' + self._cmInp('number', line.material_cost, idx, 'vasLines', 'material_cost', {w:'100%', ph:'$/unit'}) + '</div>' +
                            '<div class="cm-field-group"><label class="cm-field-label">Space (SF)</label>' + self._cmInp('number', line.space_sf, idx, 'vasLines', 'space_sf', {w:'100%', step:'1', ph:'SF'}) + '</div>' +
                            '<div class="cm-field-group"><label class="cm-field-label">Bucket</label>' + self.bucketSelectHtml('vas', idx, line.pricing_bucket) + '</div>' +
                        '</div>' +
                        '<div style="margin-top:10px;padding:8px 12px;background:#f8f9fb;border-radius:6px;font-size:11px;display:flex;gap:20px;color:var(--ies-gray-600);">' +
                            '<span>Labor: $' + laborCost.toLocaleString('en-US', {maximumFractionDigits:0}) + '</span>' +
                            '<span>Material: $' + materialCost.toLocaleString('en-US', {maximumFractionDigits:0}) + '</span>' +
                            '<span>Space: $' + spaceCost.toLocaleString('en-US', {maximumFractionDigits:0}) + '</span>' +
                            '<span style="font-weight:700;">Total: $' + totalLineCost.toLocaleString('en-US', {maximumFractionDigits:0}) + '/yr</span>' +
                        '</div>';
                }
                container.appendChild(card);
            });
        }
        var vasTotal = this.calculateVasCost();
        var vasEl = document.getElementById('totalVasCost');
        if (vasEl) vasEl.textContent = '$' + vasTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    },

    toggleVasCard(idx) {
        var line = this.projectData.vasLines[idx];
        if (line) { line._expanded = !line._expanded; }
        this.renderVasTable();
    },

    autoGenerateVas() {
        var env = (document.getElementById('environment').value || 'ambient').toLowerCase();
        var lines = [];
        if (env === 'cold' || env === 'frozen' || env === 'cooler' || env === 'freezer') {
            lines = [
                { service_name: 'Lot Tracking', service_type: 'lottrack', rate: 0.05, uom: 'each', volume: 0, uph: 120, labor_rate: 18, material_cost: 0, space_sf: 0 },
                { service_name: 'Temp Monitoring', service_type: 'tempmon', rate: 0.08, uom: 'pallet', volume: 0, uph: 60, labor_rate: 18, material_cost: 0.02, space_sf: 0 },
                { service_name: 'Date Coding', service_type: 'datecode', rate: 0.04, uom: 'each', volume: 0, uph: 200, labor_rate: 17, material_cost: 0.01, space_sf: 0 }
            ];
        } else {
            lines = [
                { service_name: 'Labeling / Relabeling', service_type: 'labeling', rate: 0.12, uom: 'each', volume: 0, uph: 150, labor_rate: 17, material_cost: 0.03, space_sf: 200 },
                { service_name: 'Quality Inspection', service_type: 'qc', rate: 0.25, uom: 'each', volume: 0, uph: 80, labor_rate: 19, material_cost: 0, space_sf: 100 },
                { service_name: 'Returns Processing', service_type: 'returns', rate: 1.50, uom: 'each', volume: 0, uph: 20, labor_rate: 18, material_cost: 0.10, space_sf: 300 },
                { service_name: 'Gift Wrap', service_type: 'giftwrap', rate: 2.00, uom: 'each', volume: 0, uph: 30, labor_rate: 17, material_cost: 0.75, space_sf: 150 }
            ];
        }
        // Don't overwrite manual lines
        if (this.projectData.vasLines.some(function(l) { return l.source === 'manual'; })) return;
        lines.forEach(function(l) { l.source = 'auto'; l._expanded = false; });
        this.projectData.vasLines = lines;
        this.renderVasTable();
        this.markChanged();
    },

    // =====================================================================
    // START-UP / CAPITAL AMORTIZATION
    // =====================================================================
    autoGenerateStartup() {
        if (this.projectData.startupLines.some(l => l.source === 'manual')) return;

        const contractYears = parseFloat(document.getElementById('contractTermYears').value) || 3;
        const contractMonths = contractYears * 12;
        const lines = [];
        const sqft = parseFloat(document.getElementById('totalSqft').value) || 0;
        const totalDirectFte = this.projectData.laborLines.reduce((s, l) => s + (l.fte || 0), 0);

        // 1. Racking capital — from equipment lines with purchase_cost > 0
        this.projectData.equipmentLines.forEach(line => {
            if (line.category === 'Racking' || line.category === 'Conveyor') {
                const unitCost = line.acquisition_cost ? line.acquisition_cost / Math.max(1, line.quantity) : 0;
                const totalCost = unitCost > 0 ? line.acquisition_cost :
                    (line.category === 'Racking' ? line.quantity * 85 : line.quantity * 200); // default per-unit install cost
                if (totalCost > 0) {
                    lines.push({
                        category: line.category,
                        description: line.equipment_name + ' (' + line.quantity + ' units)',
                        one_time_cost: totalCost,
                        monthly_amort: totalCost / contractMonths,
                        annual_amort: totalCost / contractYears,
                        source: 'heuristic'
                    });
                }
            }
        });

        // 2. Office & Break Room Build-Out
        this.projectData.equipmentLines.forEach(line => {
            if (line.category === 'Facility' && (line.equipment_name.includes('Office') || line.equipment_name.includes('Break Room'))) {
                const costPerSqft = line.equipment_name.includes('Office') ? 45 : 30; // $45/sqft office, $30 break room
                const totalCost = line.quantity * costPerSqft;
                lines.push({
                    category: 'Build-Out',
                    description: line.equipment_name + ' — ' + line.quantity + ' sqft @ $' + costPerSqft + '/sqft',
                    one_time_cost: totalCost,
                    monthly_amort: totalCost / contractMonths,
                    annual_amort: totalCost / contractYears,
                    source: 'heuristic'
                });
            }
        });

        // 3. IT Infrastructure Build
        if (sqft > 0) {
            // Network cabling: $0.50/sqft for warehouse, more for office
            const cableCost = Math.ceil(sqft * 0.50);
            lines.push({
                category: 'IT Infrastructure',
                description: 'Network cabling, patch panels, switches — ' + sqft.toLocaleString() + ' sqft',
                one_time_cost: cableCost,
                monthly_amort: cableCost / contractMonths,
                annual_amort: cableCost / contractYears,
                source: 'heuristic'
            });
        }

        // WMS Implementation: $50K base + $2K per user
        if (totalDirectFte > 0) {
            const wmsImplCost = 50000 + (Math.ceil(totalDirectFte) * 2000);
            lines.push({
                category: 'IT Infrastructure',
                description: 'WMS implementation, config, testing, go-live (' + Math.ceil(totalDirectFte) + ' users)',
                one_time_cost: wmsImplCost,
                monthly_amort: wmsImplCost / contractMonths,
                annual_amort: wmsImplCost / contractYears,
                source: 'heuristic'
            });
        }

        // EDI / Integration setup
        lines.push({
            category: 'IT Infrastructure',
            description: 'EDI setup, customer integration, testing (2-4 trading partners)',
            one_time_cost: 15000,
            monthly_amort: 15000 / contractMonths,
            annual_amort: 15000 / contractYears,
            source: 'heuristic'
        });

        // 4. Dock Equipment Installation (power, leveler install)
        const dockLines = this.projectData.equipmentLines.filter(l => l.equipment_name && l.equipment_name.includes('Dock Leveler'));
        if (dockLines.length > 0) {
            const dockCount = dockLines.reduce((s, l) => s + l.quantity, 0);
            const dockInstallCost = dockCount * 4500; // $4,500 per dock door install
            lines.push({
                category: 'Facility',
                description: 'Dock leveler installation — ' + dockCount + ' doors @ $4,500/door',
                one_time_cost: dockInstallCost,
                monthly_amort: dockInstallCost / contractMonths,
                annual_amort: dockInstallCost / contractYears,
                source: 'heuristic'
            });
        }

        // 5. Power Drops for MHE Charging
        const chargingLines = this.projectData.equipmentLines.filter(l => l.equipment_name && l.equipment_name.includes('Charging'));
        if (chargingLines.length > 0) {
            const chargingUnits = chargingLines.reduce((s, l) => s + l.quantity, 0);
            const powerDropCost = chargingUnits * 3500; // $3,500 per power drop
            lines.push({
                category: 'Facility',
                description: 'Power drops for MHE charging — ' + chargingUnits + ' stations @ $3,500',
                one_time_cost: powerDropCost,
                monthly_amort: powerDropCost / contractMonths,
                annual_amort: powerDropCost / contractYears,
                source: 'heuristic'
            });
        }

        // 6. High-Bay LED Lighting
        if (sqft >= 50000) {
            const lightingCost = Math.ceil(sqft * 1.25); // $1.25/sqft for LED high-bay upgrade
            lines.push({
                category: 'Facility',
                description: 'High-bay LED lighting — ' + sqft.toLocaleString() + ' sqft @ $1.25/sqft',
                one_time_cost: lightingCost,
                monthly_amort: lightingCost / contractMonths,
                annual_amort: lightingCost / contractYears,
                source: 'heuristic'
            });
        }

        // 7. Guard Rail / Safety Barriers
        if (sqft >= 50000) {
            const guardRailCost = Math.ceil(sqft * 0.15); // $0.15/sqft estimate
            lines.push({
                category: 'Facility',
                description: 'Guard rail, bollards, safety barriers, signage',
                one_time_cost: guardRailCost,
                monthly_amort: guardRailCost / contractMonths,
                annual_amort: guardRailCost / contractYears,
                source: 'heuristic'
            });
        }

        // 8. Initial Training / Go-Live Support (ramp-up premium)
        if (totalDirectFte > 0) {
            const rampWeeks = parseFloat(document.getElementById('rampUpWeeks').value) || 8;
            const hoursPerShift = parseFloat(document.getElementById('hoursPerShift').value) || 8;
            const daysPerWeek = parseFloat(document.getElementById('daysPerWeek').value) || 5;
            // Training cost: additional 30% labor premium during ramp (learning curve inefficiency)
            const rampHours = rampWeeks * daysPerWeek * hoursPerShift;
            const avgRate = 20; // blended rate
            const rampPremium = Math.ceil(totalDirectFte * rampHours * avgRate * 0.30);
            lines.push({
                category: 'Ramp-Up',
                description: 'Training premium — ' + rampWeeks + ' wks x ' + fmtNum(totalDirectFte, 0) + ' FTEs x 30% inefficiency',
                one_time_cost: rampPremium,
                monthly_amort: rampPremium / contractMonths,
                annual_amort: rampPremium / contractYears,
                source: 'heuristic'
            });

            // Go-live support team (project manager + IT + trainer for 4 weeks)
            const goLiveCost = 4 * 40 * (75 + 60 + 45); // 4 wks x 40 hrs x (PM + IT + Trainer)
            lines.push({
                category: 'Ramp-Up',
                description: 'Go-live support team (PM + IT + Trainer) — 4 weeks',
                one_time_cost: goLiveCost,
                monthly_amort: goLiveCost / contractMonths,
                annual_amort: goLiveCost / contractYears,
                source: 'heuristic'
            });
        }

        // 9. Contingency (5% of all other start-up costs)
        const subtotal = lines.reduce((s, l) => s + l.one_time_cost, 0);
        const contingency = Math.ceil(subtotal * 0.05);
        lines.push({
            category: 'Contingency',
            description: 'Risk contingency — 5% of total capital',
            one_time_cost: contingency,
            monthly_amort: contingency / contractMonths,
            annual_amort: contingency / contractYears,
            source: 'heuristic'
        });

        this.projectData.startupLines = lines;
    },

    renderStartupTable() {
        const tbody = document.getElementById('startupTable');
        if (!tbody) return;
        tbody.innerHTML = '';

        let totalCapital = 0;
        let totalAnnualAmort = 0;

        this.projectData.startupLines.forEach((line, idx) => {
            totalCapital += line.one_time_cost || 0;
            totalAnnualAmort += line.annual_amort || 0;

            const sourceTag = line.source === 'heuristic' ? '<span style="color:var(--ies-orange);font-size:11px;font-weight:600;">AUTO</span> ' : '';
            const row = document.createElement('tr');
            row.innerHTML =
                '<td>' + sourceTag + this._cmInp('text', line.category, idx, 'startupLines', 'category', {w:90, ph:'Category'}) + '</td>' +
                '<td>' + this._cmInp('text', line.description, idx, 'startupLines', 'description', {w:120, ph:'Description'}) + '</td>' +
                '<td>' + this._cmInp('number', line.one_time_cost, idx, 'startupLines', 'one_time_cost', {w:70, step:'100', ph:'CapEx'}) + '</td>' +
                '<td class="cm-table-number" id="startup-mo-' + idx + '">$' + (line.monthly_amort || 0).toLocaleString('en-US', {maximumFractionDigits:0}) + '</td>' +
                '<td class="cm-table-number" id="startup-yr-' + idx + '" style="font-weight:600;">$' + (line.annual_amort || 0).toLocaleString('en-US', {maximumFractionDigits:0}) + '</td>' +
                '<td>' + this.bucketSelectHtml('startup', idx, line.pricing_bucket) + '</td>' +
                '<td class="cm-table-actions"><button class="cm-btn-small cm-btn-small-danger" onclick="cmApp.deleteStartupLine(' + idx + ')">Delete</button></td>';
            tbody.appendChild(row);
        });

        // Update summary totals
        const investEl = document.getElementById('totalCapitalInvestment');
        const amortEl = document.getElementById('totalAnnualAmortization');
        if (investEl) investEl.textContent = '$' + totalCapital.toLocaleString('en-US', {maximumFractionDigits:0});
        if (amortEl) amortEl.textContent = '$' + totalAnnualAmort.toLocaleString('en-US', {maximumFractionDigits:0});

        // Ramp-up premium (sum of ramp-up category)
        const rampTotal = this.projectData.startupLines
            .filter(l => l.category === 'Ramp-Up')
            .reduce((s, l) => s + (l.one_time_cost || 0), 0);
        const rampEl = document.getElementById('rampUpPremium');
        if (rampEl) rampEl.textContent = '$' + rampTotal.toLocaleString('en-US', {maximumFractionDigits:0});
    },

    renderImplementationTimeline() {
        const el = document.getElementById('implementationTimeline');
        if (!el) return;

        const rampWeeks = parseFloat(document.getElementById('rampUpWeeks').value) || 8;
        const totalDirectFte = this.projectData.laborLines.reduce((s, l) => s + (l.fte || 0), 0);
        const contractYears = parseFloat(document.getElementById('contractTermYears').value) || 3;

        // Get learning curve from allowance profile
        const allowanceId = document.getElementById('allowanceProfile').value;
        const allowance = this.refData.allowanceProfiles.find(a => a.id == allowanceId) || {};

        el.innerHTML = `
            <div style="margin-bottom:12px;font-weight:600;">Typical ${contractYears}-Year Implementation Timeline:</div>
            <div style="display:grid;grid-template-columns:100px 1fr;gap:4px 12px;">
                <span style="font-weight:600;">Wk -12 to -8</span><span>Site selection, lease execution, permit applications</span>
                <span style="font-weight:600;">Wk -8 to -4</span><span>Racking installation, office build-out, IT infrastructure</span>
                <span style="font-weight:600;">Wk -4 to -2</span><span>WMS config & testing, EDI integration, MHE delivery</span>
                <span style="font-weight:600;">Wk -2 to 0</span><span>Staff hiring, initial training, dry-run receiving</span>
                <span style="font-weight:600;">Wk 1</span><span>Go-live — ${allowance.learning_curve_wk1 || 65}% productivity (learning curve)</span>
                <span style="font-weight:600;">Wk 2</span><span>Stabilization — ${allowance.learning_curve_wk2 || 75}% productivity</span>
                <span style="font-weight:600;">Wk 4</span><span>Ramp — ${allowance.learning_curve_wk4 || 85}% productivity</span>
                <span style="font-weight:600;">Wk 8</span><span>Near-standard — ${allowance.learning_curve_wk8 || 95}% productivity</span>
                <span style="font-weight:600;">Wk 12</span><span>Full standard — 100% productivity, ${fmtNum(totalDirectFte, 0)} FTEs at rate</span>
                <span style="font-weight:600;">Year 1+</span><span>Steady-state operations, ${(parseFloat(document.getElementById('annualEscalation').value) || 3)}% annual escalation</span>
            </div>
        `;
    },

    addStartupRow() {
        this.projectData.startupLines.push({
            category: '',
            description: '',
            one_time_cost: 0,
            monthly_amort: 0,
            annual_amort: 0,
            source: 'manual'
        });
        this.renderStartupTable();
    },

    deleteStartupLine(idx) {
        this.projectData.startupLines.splice(idx, 1);
        this.renderStartupTable();
    },

    calculateStartupAmortization() {
        let cost = 0;
        this.projectData.startupLines.forEach(line => {
            cost += line.annual_amort || 0;
        });
        return cost;
    },

    recalculateSummary() {
        // Calculate all totals
        const laborCost = this.calculateLaborCost();
        const facilityCost = this.calculateFacilityCost();
        const equipmentCost = this.calculateEquipmentCost();
        const overheadCost = this.calculateOverheadCost();
        const vasCost = this.calculateVasCost();
        const startupAmort = this.calculateStartupAmortization();

        const totalCost = laborCost + facilityCost + equipmentCost + overheadCost + vasCost + startupAmort;
        const margin = parseFloat(document.getElementById('targetMargin').value) || 0;
        const totalRevenue = totalCost * (1 + margin / 100);

        // Update metric cards
        document.getElementById('summaryTotalCost').textContent = '$' + totalCost.toLocaleString('en-US', {maximumFractionDigits: 0});
        document.getElementById('summaryTotalRevenue').textContent = '$' + totalRevenue.toLocaleString('en-US', {maximumFractionDigits: 0});
        document.getElementById('summaryTotalFtes').textContent = fmtNum(this.getTotalFtes(), 0);

        const ordersPerYear = parseFloat(document.getElementById('ordersPacked').value) || 1;
        const costPerOrder = totalCost / ordersPerYear;
        document.getElementById('summaryCostPerOrder').textContent = fmtNum(costPerOrder, 2, '$');

        // Cost breakdown
        const costBreakdown = [
            { label: 'laborBarPct', value: laborCost, segment: 'laborBarSegment' },
            { label: 'facilityBarPct', value: facilityCost, segment: 'facilityBarSegment' },
            { label: 'equipmentBarPct', value: equipmentCost, segment: 'equipmentBarSegment' },
            { label: 'overheadBarPct', value: overheadCost, segment: 'overheadBarSegment' },
            { label: 'vasBarPct', value: vasCost, segment: 'vasBarSegment' },
            { label: 'startupBarPct', value: startupAmort, segment: 'startupBarSegment' }
        ];

        costBreakdown.forEach(item => {
            const pct = totalCost > 0 ? (item.value / totalCost * 100) : 0;
            document.getElementById(item.label).textContent = fmtNum(pct, 0) + '%';
            document.getElementById(item.segment).style.width = pct + '%';
            if (pct > 0) document.getElementById(item.segment).textContent = fmtNum(pct, 0) + '%';
        });

        // Unit metrics
        const palletsPerYear = (parseFloat(document.getElementById('palletsReceived').value) || 0) +
                              (parseFloat(document.getElementById('palletsShipped').value) || 0);
        const casesPerYear = (parseFloat(document.getElementById('casesReceived').value) || 0) +
                            (parseFloat(document.getElementById('casesPicked').value) || 0);
        const eachesPerYear = parseFloat(document.getElementById('eachesPicked').value) || 0;
        const sqftYear = parseFloat(document.getElementById('totalSqft').value) || 1;

        document.getElementById('unitCostPerOrder').textContent = fmtNum(costPerOrder, 2, '$');

        // Fixed vs Variable breakdown
        this.initDefaultBuckets();
        this.autoAssignBuckets();
        const { bucketCosts } = this.calculatePricingSchedule();
        const fixedAnnual = bucketCosts['mgmt_fee'] || 0;
        const variableAnnual = totalCost - fixedAnnual;
        const variableCostPerOrder = ordersPerYear > 0 ? variableAnnual / ordersPerYear : 0;
        document.getElementById('unitVarCostPerOrder').textContent = fmtNum(variableCostPerOrder, 2, '$');

        document.getElementById('unitCostPerPallet').textContent = fmtNum(palletsPerYear > 0 ? totalCost / palletsPerYear : 0, 2, '$');
        document.getElementById('unitCostPerCase').textContent = fmtNum(casesPerYear > 0 ? totalCost / casesPerYear : 0, 2, '$');
        document.getElementById('unitCostPerEach').textContent = fmtNum(eachesPerYear > 0 ? totalCost / eachesPerYear : 0, 4, '$');
        document.getElementById('unitCostPerSqft').textContent = fmtNum(totalCost / sqftYear, 2, '$');
        document.getElementById('unitRevenuePerOrder').textContent = fmtNum(totalRevenue / ordersPerYear, 2, '$');

        const fixedMonthly = fixedAnnual / 12;
        const varPerOrder = variableCostPerOrder;

        const fmEl = document.getElementById('summaryFixedMonthly');
        const vpEl = document.getElementById('summaryVarPerOrder');
        const fpEl = document.getElementById('summaryFixedPct');
        const vPctEl = document.getElementById('summaryVarPct');
        if (fmEl) fmEl.textContent = '$' + fixedMonthly.toLocaleString('en-US', {maximumFractionDigits:0});
        if (vpEl) vpEl.textContent = fmtNum(varPerOrder, 2, '$');
        if (fpEl) fpEl.textContent = totalCost > 0 ? fmtNum(fixedAnnual / totalCost * 100, 0) + '%' : '0%';
        if (vPctEl) vPctEl.textContent = totalCost > 0 ? fmtNum(variableAnnual / totalCost * 100, 0) + '%' : '0%';

        // Generate decision support heuristics
        this.generateHeuristics({
            laborCost, facilityCost, equipmentCost, overheadCost, vasCost, startupAmort,
            totalCost, costPerOrder, ordersPerYear, sqft: sqftYear,
            palletsPerYear, casesPerYear, eachesPerYear
        });

        // Render sensitivity analysis
        this.renderSensitivityAnalysis();
    },

    // =====================================================================
    // SENSITIVITY ANALYSIS
    // =====================================================================

    renderSensitivityAnalysis() {
        const tbody = document.getElementById('sensitivityBody');
        if (!tbody) return;

        const baseLaborCost = this.calculateLaborCost();
        const baseFacilityCost = this.calculateFacilityCost();
        const baseEquipmentCost = this.calculateEquipmentCost();
        const baseOverheadCost = this.calculateOverheadCost();
        const baseVasCost = this.calculateVasCost();
        const baseStartupAmort = this.calculateStartupAmortization();
        const baseTotalCost = baseLaborCost + baseFacilityCost + baseEquipmentCost + baseOverheadCost + baseVasCost + baseStartupAmort;
        const baseOrders = parseFloat(document.getElementById('ordersPacked').value) || 1;
        const baseCostPerOrder = baseTotalCost / baseOrders;

        // Helper to calculate costs with adjusted parameters
        const calcCostWithAdjustment = (adjType, adjustment) => {
            let laborCost = baseLaborCost;
            let facilityCost = baseFacilityCost;
            let equipmentCost = baseEquipmentCost;
            let overheadCost = baseOverheadCost;
            let vasCost = baseVasCost;
            let startupAmort = baseStartupAmort;
            let orders = baseOrders;

            if (adjType === 'volume') {
                orders = baseOrders * (1 + adjustment);
            } else if (adjType === 'labor_rate') {
                // Adjust all labor costs by percentage
                laborCost = baseLaborCost * (1 + adjustment);
            } else if (adjType === 'sqft') {
                // Adjust facility cost by sqft adjustment
                facilityCost = baseFacilityCost * (1 + adjustment);
            } else if (adjType === 'burden') {
                // Burden % adjustment - recalculate labor with adjusted burden
                const laborLines = this.projectData.laborLines || [];
                const indirectLines = this.projectData.indirectLaborLines || [];
                let adjLaborCost = 0;
                laborLines.forEach(l => {
                    const baseBurden = l.burden_pct || 0;
                    const adjBurden = baseBurden + (baseBurden * adjustment);
                    const fullyLoaded = (l.hourly_rate || 0) * (1 + adjBurden / 100) + (l.benefits_per_hour || 0);
                    adjLaborCost += (l.annual_hours || 0) * fullyLoaded;
                });
                const opHours = this.getOperatingHours();
                indirectLines.forEach(l => {
                    const baseBurden = l.burden_pct || 0;
                    const adjBurden = baseBurden + (baseBurden * adjustment);
                    const fullyLoaded = (l.hourly_rate || 0) * (1 + adjBurden / 100) + (l.benefits_per_hour || 0);
                    adjLaborCost += (l.headcount || 0) * opHours * fullyLoaded;
                });
                laborCost = adjLaborCost;
            } else if (adjType === 'overhead') {
                overheadCost = baseOverheadCost * (1 + adjustment);
            }

            const totalCost = laborCost + facilityCost + equipmentCost + overheadCost + vasCost + startupAmort;
            const costPerOrder = orders > 0 ? totalCost / orders : 0;
            return { totalCost, costPerOrder };
        };

        // Define variables to test
        const variables = [
            { name: 'Order Volume', type: 'volume' },
            { name: 'Labor Rate', type: 'labor_rate' },
            { name: 'Facility Size (sqft)', type: 'sqft' },
            { name: 'Burden %', type: 'burden' },
            { name: 'Overhead Rates', type: 'overhead' }
        ];

        let html = '';
        variables.forEach(v => {
            const negResult = calcCostWithAdjustment(v.type, -0.1);
            const posResult = calcCostWithAdjustment(v.type, 0.1);
            const impactRange = Math.abs(posResult.costPerOrder - negResult.costPerOrder);
            const baseResult = { totalCost: baseTotalCost, costPerOrder: baseCostPerOrder };

            html += '<tr>' +
                '<td>' + v.name + '</td>' +
                '<td style="text-align:right;">' + fmtNum(negResult.costPerOrder, 2, '$') + '</td>' +
                '<td style="text-align:right;">' + fmtNum(baseResult.costPerOrder, 2, '$') + '</td>' +
                '<td style="text-align:right;">' + fmtNum(posResult.costPerOrder, 2, '$') + '</td>' +
                '<td style="text-align:right;font-weight:600;color:' + (impactRange > 1 ? '#ef4444' : '#10b981') + ';">' + fmtNum(impactRange, 2, '$') + '</td>' +
            '</tr>';
        });

        tbody.innerHTML = html;
    },

    // =====================================================================
    // MULTI-YEAR BUDGET & FINANCIAL METRICS
    // =====================================================================

    getContractYears() {
        return Math.max(1, Math.round(parseFloat(document.getElementById('contractTerm').value) || 3));
    },

    buildYearlyProjections() {
        const years = this.getContractYears();
        const volGrowth = (parseFloat(document.getElementById('volumeGrowth').value) || 0) / 100;
        const laborEsc = this.getLaborEscalationPct();
        const costEsc = (parseFloat(document.getElementById('annualEscalation').value) || 3) / 100;
        const margin = (parseFloat(document.getElementById('targetMargin').value) || 0) / 100;

        const baseLaborCost = this.calculateLaborCost();
        const baseFacilityCost = this.calculateFacilityCost();
        const baseEquipmentCost = this.calculateEquipmentCost();
        const baseOverheadCost = this.calculateOverheadCost();
        const baseVasCost = this.calculateVasCost();
        const startupAmort = this.calculateStartupAmortization();
        const startupCapital = this.projectData.startupLines.reduce((s, l) => s + (l.one_time_cost || 0), 0);
        const baseOrders = parseFloat(document.getElementById('ordersPacked').value) || 0;

        // Learning curve: compute weighted avg productivity factor for Year 1
        let yr1LearningFactor = 1.0;
        if (this.projectData.laborLines.length > 0) {
            let totalHours = 0, weightedFactor = 0;
            this.projectData.laborLines.forEach(line => {
                const h = line.annual_hours || 0;
                const f = this.getLearningCurveFactor(line.complexity_tier || 'medium');
                totalHours += h;
                weightedFactor += h * f;
            });
            yr1LearningFactor = totalHours > 0 ? weightedFactor / totalHours : 1.0;
        }

        const projections = [];
        for (let yr = 1; yr <= years; yr++) {
            const volMult = Math.pow(1 + volGrowth, yr - 1);
            const laborMult = Math.pow(1 + laborEsc, yr - 1);
            const costMult = Math.pow(1 + costEsc, yr - 1);

            // Year 1 labor is higher due to learning curve (lower productivity = more hours)
            const learningMult = yr === 1 ? (1 / yr1LearningFactor) : 1.0;
            const labor = baseLaborCost * laborMult * volMult * learningMult;
            const facility = baseFacilityCost * costMult;
            const equipment = baseEquipmentCost * costMult;
            const overhead = baseOverheadCost * costMult * Math.pow(1 + volGrowth * 0.3, yr - 1);
            const vas = baseVasCost * volMult;
            const startup = startupAmort;
            const totalCost = labor + facility + equipment + overhead + vas + startup;
            const revenue = totalCost * (1 + margin);
            const grossProfit = revenue - totalCost;
            const depreciation = startupAmort;
            const ebitda = grossProfit + depreciation;
            const ebit = grossProfit;
            const orders = baseOrders * volMult;

            // Cash flow components
            const taxes = Math.max(0, ebit * 0.25); // 25% effective tax rate
            const netIncome = ebit - taxes;
            const capex = yr === 1 ? startupCapital : 0; // startup capital in Year 1
            const workingCapitalChange = yr === 1 ? (revenue * 0.08) : (revenue * volGrowth * 0.08); // ~30 days DSO
            const operatingCashFlow = netIncome + depreciation - workingCapitalChange;
            const freeCashFlow = operatingCashFlow - capex;

            projections.push({
                year: yr, orders, labor, facility, equipment, overhead, vas, startup,
                totalCost, revenue, grossProfit, ebitda, ebit, depreciation,
                taxes, netIncome, capex, workingCapitalChange, operatingCashFlow, freeCashFlow,
                learningMult,
                // Balance sheet building blocks (cumulative computed below)
                _revenue: revenue, _capex: capex, _workingCapitalChange: workingCapitalChange,
                _netIncome: netIncome, _depreciation: depreciation
            });
        }

        // Balance Sheet: compute cumulative values per year
        let cumCash = 0, cumRetainedEarnings = 0, cumCapex = 0, cumDepreciation = 0;
        projections.forEach(p => {
            cumCapex += p._capex;
            cumDepreciation += p._depreciation;
            cumRetainedEarnings += p._netIncome;
            cumCash += p.freeCashFlow;

            // Assets
            p.bsCash = cumCash;
            p.bsAccountsReceivable = p._revenue / 12; // ~30 days DSO
            p.bsNetPPE = cumCapex - cumDepreciation;
            p.bsTotalAssets = p.bsCash + p.bsAccountsReceivable + p.bsNetPPE;

            // Liabilities
            p.bsAccountsPayable = p.totalCost / 12; // ~30 days DPO
            p.bsTotalLiabilities = p.bsAccountsPayable;

            // Equity
            p.bsRetainedEarnings = cumRetainedEarnings;
            p.bsTotalEquity = p.bsRetainedEarnings;
            p.bsTotalLiabEquity = p.bsTotalLiabilities + p.bsTotalEquity;
        });

        return { projections, startupCapital, margin };
    },

    renderMultiYearBudget() {
        const { projections, startupCapital } = this.buildYearlyProjections();
        const thead = document.getElementById('multiYearBudgetHead');
        const tbody = document.getElementById('multiYearBudgetBody');
        if (!thead || !tbody) return;

        const fmt = (v) => '$' + Math.round(v).toLocaleString('en-US');
        const fmtPct = (v) => (v * 100).toFixed(1) + '%';

        // Header
        thead.innerHTML = '<tr><th style="min-width:160px;">Line Item</th>' +
            projections.map(p => '<th style="text-align:right;">Year ' + p.year + '</th>').join('') +
            '<th style="text-align:right;">Total</th></tr>';

        const rows = [
            { label: '── INCOME STATEMENT ──', section: true },
            { label: 'Revenue', key: 'revenue', bold: true },
            { label: 'Labor', key: 'labor' },
            { label: 'Facility', key: 'facility' },
            { label: 'Equipment', key: 'equipment' },
            { label: 'Overhead', key: 'overhead' },
            { label: 'VAS', key: 'vas' },
            { label: 'Start-Up Amort.', key: 'startup' },
            { label: 'Total Cost', key: 'totalCost', bold: true, border: true },
            { label: 'Gross Profit', key: 'grossProfit', bold: true },
            { label: 'EBITDA', key: 'ebitda' },
            { label: 'EBIT', key: 'ebit' },
            { label: 'Taxes (25%)', key: 'taxes' },
            { label: 'Net Income', key: 'netIncome', bold: true, border: true },
            { label: 'Gross Margin %', key: null, calc: p => p.revenue > 0 ? p.grossProfit / p.revenue : 0, format: 'pct' },
            { label: '── CASH FLOW ──', section: true },
            { label: 'Net Income', key: 'netIncome' },
            { label: '+ Depreciation/Amort.', key: 'depreciation' },
            { label: '- Working Capital Chg', key: 'workingCapitalChange' },
            { label: 'Operating Cash Flow', key: 'operatingCashFlow', bold: true, border: true },
            { label: '- Capital Expenditures', key: 'capex' },
            { label: 'Free Cash Flow', key: 'freeCashFlow', bold: true, border: true },
            { label: '── BALANCE SHEET ──', section: true },
            { label: 'Cash', key: 'bsCash', snapshot: true },
            { label: 'Accounts Receivable', key: 'bsAccountsReceivable', snapshot: true },
            { label: 'Net PP&E', key: 'bsNetPPE', snapshot: true },
            { label: 'Total Assets', key: 'bsTotalAssets', bold: true, border: true, snapshot: true },
            { label: 'Accounts Payable', key: 'bsAccountsPayable', snapshot: true },
            { label: 'Total Liabilities', key: 'bsTotalLiabilities', bold: true, border: true, snapshot: true },
            { label: 'Retained Earnings', key: 'bsRetainedEarnings', snapshot: true },
            { label: 'Total Equity', key: 'bsTotalEquity', bold: true, snapshot: true },
            { label: 'Total Liab. + Equity', key: 'bsTotalLiabEquity', bold: true, border: true, snapshot: true },
            { label: '── KEY METRICS ──', section: true },
            { label: 'Orders', key: 'orders', format: 'int' },
            { label: 'Cost/Order', key: null, calc: p => p.totalCost / (p.orders || 1), format: 'dollar2' },
            { label: 'Learning Curve Mult.', key: null, calc: p => p.learningMult || 1.0, format: 'mult' }
        ];

        const colCount = projections.length + 2; // label + years + total
        tbody.innerHTML = rows.map(r => {
            // Section header rows
            if (r.section) {
                return '<tr><td colspan="' + colCount + '" style="font-size:11px;font-weight:700;color:var(--ies-blue,#2563eb);padding-top:14px;letter-spacing:0.5px;">' + r.label + '</td></tr>';
            }
            const style = (r.bold ? 'font-weight:600;' : '') + (r.border ? 'border-top:2px solid var(--gray-200);' : '');
            const vals = projections.map(p => {
                const v = r.calc ? r.calc(p) : p[r.key];
                if (r.format === 'int') return Math.round(v).toLocaleString('en-US');
                if (r.format === 'dollar2') return '$' + v.toFixed(2);
                if (r.format === 'pct') return fmtPct(v);
                if (r.format === 'mult') return v !== 1.0 ? v.toFixed(3) + 'x' : '—';
                return fmt(v);
            });
            const total = r.format === 'mult' ? '—' : r.snapshot
                ? fmt(projections[projections.length - 1][r.key])
                : (r.calc
                ? (r.format === 'pct' ? fmtPct(projections.reduce((s, p) => s + (r.calc(p) || 0), 0) / projections.length)
                   : r.format === 'dollar2' ? '$' + (projections.reduce((s, p) => s + r.calc(p), 0) / projections.length).toFixed(2)
                   : '')
                : (r.format === 'int' ? Math.round(projections.reduce((s, p) => s + p[r.key], 0)).toLocaleString('en-US')
                   : fmt(projections.reduce((s, p) => s + p[r.key], 0))));

            return '<tr style="' + style + '"><td>' + r.label + '</td>' +
                vals.map(v => '<td style="text-align:right;">' + v + '</td>').join('') +
                '<td style="text-align:right;font-weight:600;">' + total + '</td></tr>';
        }).join('');
    },

    renderFinancialMetrics() {
        const { projections, startupCapital, margin } = this.buildYearlyProjections();
        const panel = document.getElementById('financialMetricsPanel');
        if (!panel) return;

        const years = projections.length;
        if (years === 0 || projections[0].totalCost === 0) {
            panel.innerHTML = '<div class="cm-fin-metric neutral"><div class="label">No Data</div><div class="value">—</div></div>';
            return;
        }

        // Thresholds
        const th = {
            grossMargin: parseFloat(document.getElementById('threshGrossMargin').value) || 12,
            ebitda: parseFloat(document.getElementById('threshEbitda').value) || 8,
            ebit: parseFloat(document.getElementById('threshEbit').value) || 5,
            roic: parseFloat(document.getElementById('threshRoic').value) || 15,
            mirr: parseFloat(document.getElementById('threshMirr').value) || 10,
            payback: parseFloat(document.getElementById('threshPayback').value) || 24
        };

        // Calculations
        const totalRevenue = projections.reduce((s, p) => s + p.revenue, 0);
        const totalCost = projections.reduce((s, p) => s + p.totalCost, 0);
        const totalGrossProfit = totalRevenue - totalCost;
        const totalEbitda = projections.reduce((s, p) => s + p.ebitda, 0);
        const totalEbit = projections.reduce((s, p) => s + p.ebit, 0);

        const avgGrossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue * 100) : 0;
        const avgEbitdaMargin = totalRevenue > 0 ? (totalEbitda / totalRevenue * 100) : 0;
        const avgEbitMargin = totalRevenue > 0 ? (totalEbit / totalRevenue * 100) : 0;

        // ROIC = avg annual EBIT / invested capital
        const avgAnnualEbit = totalEbit / years;
        const investedCapital = startupCapital > 0 ? startupCapital : totalCost * 0.1;
        const roic = investedCapital > 0 ? (avgAnnualEbit / investedCapital * 100) : 0;

        // MIRR calculation
        const discountRate = (parseFloat(document.getElementById('discountRate').value) || 10) / 100;
        const reinvestRate = (parseFloat(document.getElementById('reinvestRate').value) || 8) / 100;
        // Cash flows: year 0 = -startup capital, years 1..n = gross profit
        const cashFlows = [-startupCapital, ...projections.map(p => p.grossProfit)];
        let mirr = 0;
        if (startupCapital > 0 && cashFlows.length > 1) {
            // PV of negative cash flows at discount rate
            let pvNeg = 0;
            cashFlows.forEach((cf, i) => {
                if (cf < 0) pvNeg += cf / Math.pow(1 + discountRate, i);
            });
            // FV of positive cash flows at reinvestment rate
            const n = cashFlows.length - 1;
            let fvPos = 0;
            cashFlows.forEach((cf, i) => {
                if (cf > 0) fvPos += cf * Math.pow(1 + reinvestRate, n - i);
            });
            if (pvNeg < 0 && fvPos > 0) {
                mirr = (Math.pow(fvPos / (-pvNeg), 1 / n) - 1) * 100;
            }
        }

        // NPV
        let npv = 0;
        cashFlows.forEach((cf, i) => {
            npv += cf / Math.pow(1 + discountRate, i);
        });

        // Payback period (months)
        let paybackMonths = years * 12; // default to full term if never paid back
        let cumCash = -startupCapital;
        for (let yr = 0; yr < years; yr++) {
            const monthlyProfit = projections[yr].grossProfit / 12;
            for (let m = 0; m < 12; m++) {
                cumCash += monthlyProfit;
                if (cumCash >= 0) {
                    paybackMonths = yr * 12 + m + 1;
                    yr = years; // break outer
                    break;
                }
            }
        }

        // Revenue per FTE
        const totalFtes = this.getTotalFtes();
        const revenuePerFte = totalFtes > 0 ? projections[0].revenue / totalFtes : 0;

        // Contribution margin per order
        const yr1 = projections[0];
        const contribPerOrder = yr1.orders > 0 ? yr1.grossProfit / yr1.orders : 0;

        // Operating leverage (fixed cost as % of total)
        this.initDefaultBuckets();
        this.autoAssignBuckets();
        const { bucketCosts } = this.calculatePricingSchedule();
        const fixedCost = bucketCosts['mgmt_fee'] || 0;
        const opLeverage = yr1.totalCost > 0 ? (fixedCost / yr1.totalCost * 100) : 0;

        // Render metrics with threshold coloring
        const mc = (label, value, fmt, threshold, higherIsBetter, sub) => {
            let cls = 'neutral';
            if (threshold !== null && value !== null) {
                if (higherIsBetter) cls = value >= threshold ? 'green' : 'red';
                else cls = value <= threshold ? 'green' : 'red';
            }
            return '<div class="cm-fin-metric ' + cls + '">' +
                '<div class="label">' + label + '</div>' +
                '<div class="value">' + fmt + '</div>' +
                (sub ? '<div class="sub">' + sub + '</div>' : '') +
                '</div>';
        };

        panel.innerHTML = [
            mc('Gross Margin', avgGrossMargin, fmtNum(avgGrossMargin, 1) + '%', th.grossMargin, true, 'Target: \u2265' + th.grossMargin + '%'),
            mc('EBITDA Margin', avgEbitdaMargin, fmtNum(avgEbitdaMargin, 1) + '%', th.ebitda, true, 'Target: \u2265' + th.ebitda + '%'),
            mc('EBIT Margin', avgEbitMargin, fmtNum(avgEbitMargin, 1) + '%', th.ebit, true, 'Target: \u2265' + th.ebit + '%'),
            mc('ROIC', roic, fmtNum(roic, 1) + '%', th.roic, true, 'Target: \u2265' + th.roic + '%'),
            mc('MIRR', startupCapital > 0 ? mirr : th.mirr, startupCapital > 0 ? fmtNum(mirr, 1) + '%' : 'N/A', th.mirr, true, startupCapital > 0 ? 'Target: \u2265' + th.mirr + '%' : 'No start-up capital'),
            mc('Payback Period', paybackMonths, paybackMonths + ' mo', th.payback, false, 'Target: \u2264' + th.payback + ' mo'),
            mc('NPV', npv, '$' + Math.round(npv).toLocaleString('en-US'), 0, true, 'At ' + (discountRate * 100) + '% discount'),
            mc('Revenue / FTE', revenuePerFte, '$' + Math.round(revenuePerFte).toLocaleString('en-US'), null, true, 'Year 1'),
            mc('Contribution / Order', contribPerOrder, fmtNum(contribPerOrder, 2, '$'), null, true, 'Year 1 gross'),
            mc('Operating Leverage', opLeverage, fmtNum(opLeverage, 0) + '%', null, null, 'Fixed cost % of total'),
            mc('Contract Value', totalRevenue, '$' + Math.round(totalRevenue).toLocaleString('en-US'), null, null, years + '-year total revenue'),
            mc('Total Investment', startupCapital, '$' + Math.round(startupCapital).toLocaleString('en-US'), null, null, 'Start-up capital')
        ].join('');
    },

    // =====================================================================
    // PRICING BUCKETS
    // =====================================================================

    bucketSelectHtml(lineType, idx, currentBucket) {
        this.initDefaultBuckets();
        const opts = this.projectData.pricingBuckets.map(b =>
            '<option value="' + b.id + '"' + (currentBucket === b.id ? ' selected' : '') + '>' + b.name + '</option>'
        ).join('');
        return '<select class="cm-input" style="padding:2px 4px;font-size:11px;width:120px;" ' +
            'onchange="cmApp.setBucketForLine(\'' + lineType + '\',' + idx + ',this.value)">' +
            opts + '<option value=""' + (!currentBucket ? ' selected' : '') + '>(none)</option></select>';
    },

    setBucketForLine(lineType, idx, bucketId) {
        const map = {
            labor: 'laborLines', indirect: 'indirectLaborLines', equipment: 'equipmentLines',
            overhead: 'overheadLines', vas: 'vasLines', startup: 'startupLines'
        };
        const arr = this.projectData[map[lineType]];
        if (arr && arr[idx]) arr[idx].pricing_bucket = bucketId;
    },

    initDefaultBuckets() {
        if (this.projectData.pricingBuckets.length > 0) return;
        this.projectData.pricingBuckets = [
            { id: 'mgmt_fee', name: 'Management Fee', type: 'fixed', uom: 'month', volume_field: null, editable: true },
            { id: 'storage', name: 'Storage', type: 'variable', uom: 'pallet-position/mo', volume_field: 'palletsStored', editable: true },
            { id: 'inbound', name: 'Inbound Handling', type: 'variable', uom: 'pallet', volume_field: 'palletsReceived', editable: true },
            { id: 'pick_pack', name: 'Pick & Pack', type: 'variable', uom: 'order', volume_field: 'ordersPacked', editable: true },
            { id: 'each_pick', name: 'Each Pick', type: 'variable', uom: 'each', volume_field: 'eachesPicked', editable: true },
            { id: 'outbound', name: 'Outbound Handling', type: 'variable', uom: 'pallet', volume_field: 'palletsShipped', editable: true },
            { id: 'vas', name: 'Value-Added Services', type: 'variable', uom: 'unit', volume_field: 'vasUnits', editable: true },
            { id: 'case_pick', name: 'Case Pick', type: 'variable', uom: 'case', volume_field: 'casesPicked', editable: true }
        ];
    },

    getBucketOptions() {
        return this.projectData.pricingBuckets.map(b =>
            '<option value="' + b.id + '">' + b.name + '</option>'
        ).join('') + '<option value="">(unassigned)</option>';
    },

    getBucketVolume(bucket) {
        if (!bucket || bucket.type === 'fixed') return 12; // 12 months for fixed
        if (!bucket.volume_field) return 1;
        // Special case: palletsStored = avg on-hand
        if (bucket.volume_field === 'palletsStored') {
            const recv = parseFloat(document.getElementById('palletsReceived').value) || 0;
            return Math.ceil(recv / 12) * 12; // avg monthly pallet positions * 12
        }
        const el = document.getElementById(bucket.volume_field);
        return el ? (parseFloat(el.value) || 0) : 0;
    },

    addPricingBucket() {
        const id = 'custom_' + Date.now();
        this.projectData.pricingBuckets.push({
            id: id, name: 'New Bucket', type: 'variable', uom: 'unit',
            volume_field: 'ordersPacked', editable: true
        });
        this.renderPricingBuckets();
    },

    deletePricingBucket(idx) {
        const bucket = this.projectData.pricingBuckets[idx];
        if (!bucket) return;
        // Unassign any lines pointing to this bucket
        const id = bucket.id;
        [this.projectData.laborLines, this.projectData.indirectLaborLines,
         this.projectData.equipmentLines, this.projectData.overheadLines,
         this.projectData.vasLines, this.projectData.startupLines].forEach(arr => {
            arr.forEach(l => { if (l.pricing_bucket === id) l.pricing_bucket = ''; });
        });
        this.projectData.pricingBuckets.splice(idx, 1);
        this.renderPricingBuckets();
    },

    updateBucketField(idx, field, value) {
        if (this.projectData.pricingBuckets[idx]) {
            this.projectData.pricingBuckets[idx][field] = value;
            if (field === 'type' && value === 'fixed') {
                this.projectData.pricingBuckets[idx].uom = 'month';
                this.projectData.pricingBuckets[idx].volume_field = null;
            }
        }
    },

    renderPricingBuckets() {
        const tbody = document.getElementById('pricingBucketsBody');
        if (!tbody) return;

        const volumeFields = [
            { value: '', label: '(none)' },
            { value: 'palletsReceived', label: 'Pallets Received' },
            { value: 'palletsStored', label: 'Pallet Positions (avg)' },
            { value: 'casesReceived', label: 'Cases Received' },
            { value: 'eachesPicked', label: 'Eaches Picked' },
            { value: 'casesPicked', label: 'Cases Picked' },
            { value: 'palletsPicked', label: 'Pallets Picked' },
            { value: 'ordersPacked', label: 'Orders Packed' },
            { value: 'palletsShipped', label: 'Pallets Shipped' },
            { value: 'returnsProcessed', label: 'Returns Processed' },
            { value: 'vasUnits', label: 'VAS Units' }
        ];

        tbody.innerHTML = this.projectData.pricingBuckets.map((b, idx) => {
            const volOpts = volumeFields.map(vf =>
                '<option value="' + vf.value + '"' + (b.volume_field === vf.value ? ' selected' : '') + '>' + vf.label + '</option>'
            ).join('');
            const vol = this.getBucketVolume(b);
            const volDisplay = b.type === 'fixed' ? '12 months' : vol.toLocaleString();
            return '<tr>' +
                '<td><input type="text" class="cm-input" value="' + (b.name || '') + '" style="width:140px;padding:3px 6px;" onchange="cmApp.updateBucketField(' + idx + ',\'name\',this.value)"></td>' +
                '<td><select class="cm-input" style="padding:3px 6px;" onchange="cmApp.updateBucketField(' + idx + ',\'type\',this.value);cmApp.renderPricingBuckets()">' +
                    '<option value="fixed"' + (b.type === 'fixed' ? ' selected' : '') + '>Fixed (monthly)</option>' +
                    '<option value="variable"' + (b.type === 'variable' ? ' selected' : '') + '>Variable (per unit)</option>' +
                '</select></td>' +
                '<td><input type="text" class="cm-input" value="' + (b.uom || '') + '" style="width:100px;padding:3px 6px;" onchange="cmApp.updateBucketField(' + idx + ',\'uom\',this.value)"></td>' +
                '<td>' + (b.type === 'fixed' ? '<span style="color:#64748b;">n/a</span>' :
                    '<select class="cm-input" style="padding:3px 6px;" onchange="cmApp.updateBucketField(' + idx + ',\'volume_field\',this.value);cmApp.renderPricingBuckets()">' + volOpts + '</select>') +
                '</td>' +
                '<td style="text-align:right;">' + volDisplay + '</td>' +
                '<td style="text-align:center;"><button class="cm-btn-icon" onclick="cmApp.deletePricingBucket(' + idx + ')" title="Delete">\u00d7</button></td>' +
            '</tr>';
        }).join('');
    },

    // Auto-suggest a default bucket for a cost line based on context
    suggestBucket(lineType, line) {
        if (lineType === 'labor') {
            const area = (line.activity_name || '').toLowerCase();
            if (area.includes('receive') || area.includes('unload') || area.includes('putaway') || area.includes('devan'))
                return 'inbound';
            if (area.includes('pick') && area.includes('case')) return 'case_pick';
            if (area.includes('pick')) return 'each_pick';
            if (area.includes('pack')) return 'pick_pack';
            if (area.includes('stage') || area.includes('load') || area.includes('ship'))
                return 'outbound';
            if (area.includes('replen')) return 'storage';
            return 'pick_pack';
        }
        if (lineType === 'indirect') {
            const role = (line.role_name || '').toLowerCase();
            if (role.includes('manager') || role.includes('lead') || role.includes('supervisor') ||
                role.includes('account') || role.includes('general') || role.includes('it') ||
                role.includes('janitor') || role.includes('maint'))
                return 'mgmt_fee';
            if (role.includes('inventory')) return 'storage';
            if (role.includes('receiv') || role.includes('ship') || role.includes('clerk'))
                return 'inbound';
            if (role.includes('customer') || role.includes('return'))
                return 'pick_pack';
            return 'mgmt_fee';
        }
        if (lineType === 'equipment') {
            const cat = (line.category || '').toLowerCase();
            const name = (line.equipment_name || '').toLowerCase();
            if (name.includes('rack') || name.includes('shelv')) return 'storage';
            if (name.includes('conveyor') || name.includes('sort')) return 'pick_pack';
            if (cat.includes('it') || name.includes('wifi') || name.includes('printer'))
                return 'mgmt_fee';
            if (name.includes('forklift') || name.includes('pallet jack'))
                return 'inbound';
            return 'mgmt_fee';
        }
        if (lineType === 'overhead') {
            const cat = (line.category || '').toLowerCase();
            const desc = (line.description || '').toLowerCase();
            if (desc.includes('suppli')) return 'pick_pack';
            if (desc.includes('quality')) return 'pick_pack';
            return 'mgmt_fee';
        }
        if (lineType === 'vas') return 'vas';
        if (lineType === 'startup') return 'mgmt_fee';
        if (lineType === 'facility') return 'storage';
        return 'mgmt_fee';
    },

    // Assign default buckets to all lines that don't have one
    autoAssignBuckets() {
        const assign = (arr, type) => arr.forEach(l => {
            if (!l.pricing_bucket) l.pricing_bucket = this.suggestBucket(type, l);
        });
        assign(this.projectData.laborLines, 'labor');
        assign(this.projectData.indirectLaborLines, 'indirect');
        assign(this.projectData.equipmentLines, 'equipment');
        assign(this.projectData.overheadLines, 'overhead');
        assign(this.projectData.vasLines, 'vas');
        assign(this.projectData.startupLines, 'startup');
    },

    calculatePricingSchedule() {
        this.autoAssignBuckets();

        const margin = parseFloat(document.getElementById('targetMargin').value) || 0;
        const bucketCosts = {};
        this.projectData.pricingBuckets.forEach(b => { bucketCosts[b.id] = 0; });
        bucketCosts['_unassigned'] = 0;

        const addCost = (bucketId, amount) => {
            if (bucketId && bucketCosts[bucketId] !== undefined) bucketCosts[bucketId] += amount;
            else bucketCosts['_unassigned'] += amount;
        };

        // Direct labor
        this.projectData.laborLines.forEach(l => {
            const fullyLoaded = (l.hourly_rate || 0) * (1 + (l.burden_pct || 0) / 100) + (l.benefits_per_hour || 0);
            addCost(l.pricing_bucket, (l.annual_hours || 0) * fullyLoaded);
        });

        // Indirect labor
        const opHours = this.getOperatingHours();
        this.projectData.indirectLaborLines.forEach(l => {
            const fullyLoaded = (l.hourly_rate || 0) * (1 + (l.burden_pct || 0) / 100) + (l.benefits_per_hour || 0);
            addCost(l.pricing_bucket, (l.headcount || 0) * opHours * fullyLoaded);
        });

        // Equipment
        this.projectData.equipmentLines.forEach(l => {
            const annual = ((l.monthly_cost || 0) + (l.monthly_maintenance || 0)) * 12 + (l.acquisition_cost || 0);
            addCost(l.pricing_bucket, annual);
        });

        // Overhead
        this.projectData.overheadLines.forEach(l => {
            const annual = l.cost_type === 'monthly' ? (l.monthly_cost || 0) * 12 : (l.annual_cost || 0);
            addCost(l.pricing_bucket, annual);
        });

        // VAS
        this.projectData.vasLines.forEach(l => {
            addCost(l.pricing_bucket, (l.rate || 0) * (l.volume || 0));
        });

        // Startup amortization
        this.projectData.startupLines.forEach(l => {
            addCost(l.pricing_bucket, l.annual_amort || 0);
        });

        // Facility cost — assign to storage bucket
        const facilityCost = this.calculateFacilityCost();
        addCost('storage', facilityCost);

        // Roll unassigned into mgmt_fee
        if (bucketCosts['_unassigned'] > 0) {
            bucketCosts['mgmt_fee'] = (bucketCosts['mgmt_fee'] || 0) + bucketCosts['_unassigned'];
        }

        return { bucketCosts, margin };
    },

    renderPricingSchedule() {
        const { bucketCosts, margin } = this.calculatePricingSchedule();
        const tbody = document.getElementById('pricingScheduleBody');
        if (!tbody) return;

        const totalCost = Object.entries(bucketCosts)
            .filter(([k]) => k !== '_unassigned')
            .reduce((s, [, v]) => s + v, 0);

        let html = '';
        this.projectData.pricingBuckets.forEach(b => {
            const cost = bucketCosts[b.id] || 0;
            if (cost === 0) return;
            const pct = totalCost > 0 ? (cost / totalCost * 100) : 0;
            const vol = this.getBucketVolume(b);
            let rateDisplay, rateWithMargin;
            if (b.type === 'fixed') {
                const monthly = cost / 12;
                rateDisplay = '$' + monthly.toLocaleString('en-US', { maximumFractionDigits: 0 }) + '/mo';
                rateWithMargin = '$' + (monthly * (1 + margin / 100)).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '/mo';
            } else {
                const rate = vol > 0 ? cost / vol : 0;
                rateDisplay = '$' + rate.toFixed(rate >= 1 ? 2 : 4);
                rateWithMargin = '$' + (rate * (1 + margin / 100)).toFixed(rate >= 1 ? 2 : 4);
            }

            html += '<tr>' +
                '<td>' + b.name + ' <span style="color:#64748b;font-size:13px;">(' + (b.type === 'fixed' ? 'fixed' : 'variable') + ')</span></td>' +
                '<td style="text-align:right;">$' + cost.toLocaleString('en-US', { maximumFractionDigits: 0 }) + '</td>' +
                '<td style="text-align:right;">' + pct.toFixed(1) + '%</td>' +
                '<td style="text-align:right;font-weight:600;">' + rateDisplay + '</td>' +
                '<td>per ' + b.uom + '</td>' +
                '<td style="text-align:right;color:#10b981;">' + rateWithMargin + '</td>' +
            '</tr>';
        });

        tbody.innerHTML = html;
        document.getElementById('pricingScheduleTotal').textContent =
            '$' + totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 });

        // Show unassigned items
        this.renderUnassignedCosts();
    },

    renderUnassignedCosts() {
        const el = document.getElementById('unassignedCostsList');
        if (!el) return;
        const items = [];
        const bucketIds = this.projectData.pricingBuckets.map(b => b.id);

        this.projectData.laborLines.forEach(l => {
            if (!l.pricing_bucket || !bucketIds.includes(l.pricing_bucket))
                items.push('Labor: ' + esc(l.activity_name || 'Unknown'));
        });
        this.projectData.indirectLaborLines.forEach(l => {
            if (!l.pricing_bucket || !bucketIds.includes(l.pricing_bucket))
                items.push('Indirect: ' + esc(l.role_name || 'Unknown'));
        });
        this.projectData.equipmentLines.forEach(l => {
            if (!l.pricing_bucket || !bucketIds.includes(l.pricing_bucket))
                items.push('Equipment: ' + esc(l.equipment_name || 'Unknown'));
        });
        this.projectData.overheadLines.forEach(l => {
            if (!l.pricing_bucket || !bucketIds.includes(l.pricing_bucket))
                items.push('Overhead: ' + esc(l.description || 'Unknown'));
        });

        if (items.length === 0) {
            el.innerHTML = '<span style="color:#10b981;">All cost items assigned to pricing buckets.</span>';
        } else {
            el.innerHTML = items.map(i => '<div style="padding:2px 0;">\u26a0\ufe0f ' + i + '</div>').join('');
        }
    },

    generateHeuristics(m) {
        const hints = [];
        const h = (type, icon, title, detail) => hints.push({type, icon, title, detail});
        const pct = (part, whole) => whole > 0 ? (part / whole * 100) : 0;
        const ftes = this.getTotalFtes();
        const sqft = m.sqft || 1;
        const orders = m.ordersPerYear || 1;

        // --- 1. Cost structure ratios vs industry benchmarks ---
        const laborPct = pct(m.laborCost, m.totalCost);
        if (m.totalCost > 0) {
            if (laborPct < 35)
                h('warn', '\u26a0\ufe0f', 'Labor % below typical range (' + laborPct.toFixed(0) + '%)',
                    'Industry benchmark: 40-60% of total cost. Low labor share may indicate under-staffing or missing indirect roles.');
            else if (laborPct > 65)
                h('warn', '\u26a0\ufe0f', 'Labor % above typical range (' + laborPct.toFixed(0) + '%)',
                    'Industry benchmark: 40-60%. High labor may indicate over-staffing or low automation.');
            else
                h('ok', '\u2705', 'Labor cost share looks healthy (' + laborPct.toFixed(0) + '%)',
                    'Within the 40-60% industry range for 3PL warehousing.');
        }

        const facilityPct = pct(m.facilityCost, m.totalCost);
        if (m.totalCost > 0 && facilityPct > 38)
            h('warn', '\u26a0\ufe0f', 'Facility cost high (' + facilityPct.toFixed(0) + '%)',
                'Benchmark: 20-35%. Consider higher-density storage (narrow aisle, mezzanine) or renegotiating lease.');
        else if (m.totalCost > 0 && facilityPct > 0)
            h('ok', '\u2705', 'Facility cost share in range (' + facilityPct.toFixed(0) + '%)', 'Within 20-35% benchmark.');

        // --- 2. Facility size suggestion from volumes ---
        if (m.ordersPerYear > 0) {
            const palletsStored = (m.palletsPerYear / 2) / 12; // rough avg on-hand
            const eachSKUs = Math.max(500, (m.eachesPerYear || 0) / 200); // rough SKU estimate
            // Pallet positions need ~40 sqft each (including aisle), pick area ~0.5 sqft/SKU slot, staging 10%
            const estPalletArea = palletsStored * 40;
            const estPickArea = eachSKUs * 1.5;
            const estStagingDock = sqft * 0.10;
            const suggestedSqft = Math.round((estPalletArea + estPickArea + estStagingDock) / 1000) * 1000;
            if (suggestedSqft > 0 && Math.abs(suggestedSqft - sqft) / sqft > 0.30)
                h('info', '\ud83d\udccf', 'Suggested facility size: ~' + suggestedSqft.toLocaleString() + ' sqft',
                    'Based on pallet storage density and pick SKU slots. Current: ' + sqft.toLocaleString() + ' sqft (' +
                    (sqft > suggestedSqft ? 'may be oversized' : 'may be undersized') + ').');
        }

        // --- 3. Throughput density ---
        const ordersPerSqft = orders / sqft;
        if (ordersPerSqft < 1.5)
            h('info', '\ud83d\udce6', 'Low throughput density: ' + ordersPerSqft.toFixed(1) + ' orders/sqft/yr',
                'Typical ecommerce 3PL: 3-8 orders/sqft/yr. Low density drives up per-unit facility cost.');
        else if (ordersPerSqft > 12)
            h('warn', '\u26a0\ufe0f', 'Very high throughput density: ' + ordersPerSqft.toFixed(1) + ' orders/sqft/yr',
                'May need conveyor/sortation or multi-shift to handle volume in this footprint.');

        // --- 4. Cost per order benchmark ---
        if (m.costPerOrder > 0) {
            if (m.costPerOrder < 1.50)
                h('warn', '\u26a0\ufe0f', 'Cost/order very low ($' + m.costPerOrder.toFixed(2) + ')',
                    'Below $1.50/order is unusual for full-service 3PL. Check for missing cost components.');
            else if (m.costPerOrder > 8.00)
                h('warn', '\u26a0\ufe0f', 'Cost/order above typical range ($' + m.costPerOrder.toFixed(2) + ')',
                    'Benchmark: $3-6 for high-volume ecommerce. Higher cost common for B2B or low-volume accounts.');
            else
                h('ok', '\u2705', 'Cost/order within range ($' + m.costPerOrder.toFixed(2) + ')',
                    '$3-6 range is typical for high-volume ecommerce 3PL.');
        }

        // --- 5. Staffing ratio checks ---
        if (ftes > 0) {
            const sqftPerFte = sqft / ftes;
            if (sqftPerFte > 15000)
                h('info', '\ud83d\udc65', 'Low staffing density: ' + Math.round(sqftPerFte).toLocaleString() + ' sqft/FTE',
                    'Typical: 3,000-10,000 sqft/FTE. May indicate high automation or under-staffing.');
            else if (sqftPerFte < 2000)
                h('warn', '\u26a0\ufe0f', 'High staffing density: ' + Math.round(sqftPerFte).toLocaleString() + ' sqft/FTE',
                    'Below 2,000 sqft/FTE is crowded. Consider expanding footprint or adding shifts.');
        }

        // --- 6. Indirect labor ratio ---
        const indirectHC = this.projectData.indirectLaborLines.reduce((s, l) => s + (l.headcount || 0), 0);
        const directFtes = ftes - indirectHC;
        if (directFtes > 0 && indirectHC > 0) {
            const indirectRatio = indirectHC / directFtes;
            if (indirectRatio > 0.35)
                h('warn', '\u26a0\ufe0f', 'Indirect:Direct ratio high (' + (indirectRatio * 100).toFixed(0) + '%)',
                    'Benchmark: 15-25%. High ratio increases overhead burden per productive hour.');
            else if (indirectRatio < 0.10 && directFtes > 10)
                h('warn', '\u26a0\ufe0f', 'Indirect:Direct ratio low (' + (indirectRatio * 100).toFixed(0) + '%)',
                    'Below 10% with ' + directFtes.toFixed(0) + ' direct FTEs may lack supervisory coverage.');
        }

        // --- 7. Equipment cost reasonableness ---
        if (m.equipmentCost > 0 && ftes > 0) {
            const equipPerFte = m.equipmentCost / ftes;
            if (equipPerFte > 25000)
                h('info', '\ud83d\ude9c', 'Equipment cost/FTE: $' + Math.round(equipPerFte).toLocaleString(),
                    'Above $25K/FTE suggests high mechanization. Verify MHE counts align with operational needs.');
        }

        // --- 8. Overhead as % of total ---
        const ohPct = pct(m.overheadCost, m.totalCost);
        if (m.totalCost > 0 && ohPct > 20)
            h('warn', '\u26a0\ufe0f', 'Overhead share high (' + ohPct.toFixed(0) + '%)',
                'Benchmark: 8-15% of total cost. Review line items for consolidation opportunities.');

        // --- 9. Missing component warnings ---
        if (m.totalCost > 0 && m.vasCost === 0)
            h('info', '\ud83d\udcdd', 'No VAS costs entered',
                'If this account requires kitting, labeling, or returns processing, add VAS line items to capture true cost.');
        if (m.totalCost > 0 && m.startupAmort === 0 && this.projectData.startupLines.length === 0)
            h('info', '\ud83d\udcdd', 'No start-up capital captured',
                'Navigate to Start-Up section to auto-generate racking, IT, build-out, and implementation costs.');

        // --- 10. Margin sanity ---
        const margin = parseFloat(document.getElementById('targetMargin').value) || 0;
        if (margin < 8)
            h('warn', '\u26a0\ufe0f', 'Target margin low (' + margin + '%)',
                'Typical 3PL target: 10-18%. Below 8% leaves little room for volume variance and risk.');
        else if (margin > 25)
            h('info', '\ud83d\udcb0', 'Target margin: ' + margin + '%',
                'Above 25% may reduce competitiveness. Typical 3PL new business: 12-18%.');

        // Render
        const panel = document.getElementById('heuristicsPanel');
        if (!panel) return;
        if (hints.length === 0) {
            panel.innerHTML = '<div class="cm-heuristic cm-heuristic-info"><div class="icon">\u2139\ufe0f</div><div class="body"><div class="title">Enter project parameters to see design guidance</div></div></div>';
            return;
        }
        panel.innerHTML = hints.map(h =>
            '<div class="cm-heuristic cm-heuristic-' + h.type + '">' +
            '<div class="icon">' + h.icon + '</div>' +
            '<div class="body"><div class="title">' + h.title + '</div>' +
            '<div class="detail">' + h.detail + '</div></div></div>'
        ).join('');
    },

    calculateLaborCost() {
        const otPct = this.getOvertimePct();
        const benefitLoad = this.getBenefitLoadPct();
        const bonusPct = this.getBonusPct();
        var shift2Prem = (parseFloat(document.getElementById('shift2Premium').value) || 0) / 100;
        var shift3Prem = (parseFloat(document.getElementById('shift3Premium').value) || 0) / 100;
        let cost = 0;
        this.projectData.laborLines.forEach(line => {
            const hours = line.annual_hours || 0;
            const rate = line.hourly_rate || 0;
            const burden = line.burden_pct != null ? (line.burden_pct / 100) : benefitLoad;
            var shiftPrem = line.shift_num === 3 ? shift3Prem : (line.shift_num === 2 ? shift2Prem : 0);
            const effectiveRate = rate * (1 + shiftPrem) * (1 + burden) * (1 + otPct * 0.5);
            cost += hours * effectiveRate;
        });
        this.projectData.indirectLaborLines.forEach(line => {
            const hours = this.getOperatingHours();
            const rate = line.hourly_rate || 0;
            const burden = line.burden_pct != null ? (line.burden_pct / 100) : benefitLoad;
            const bonusMult = 1 + bonusPct;
            cost += (line.headcount || 0) * hours * rate * (1 + burden) * bonusMult;
        });
        return cost;
    },

    calculateFacilityCost() {
        const sqft = parseFloat(document.getElementById('totalSqft').value) || 0;
        const marketId = document.getElementById('market').value;
        const envType = (document.getElementById('environment').value || 'ambient').toLowerCase();
        const facilityRate = this.refData.facilityRates.find(r => r.market_id === marketId) || {};
        const utilityRate = this.refData.utilityRates.find(r => r.market_id === marketId) || {};

        // Environment-specific utility rate
        var utilEnv = envType === 'cold' || envType === 'cooler' ? 'cooler' : (envType === 'frozen' || envType === 'freezer' ? 'freezer' : 'ambient');
        var utilPerSfMo = utilityRate['utility_' + utilEnv + '_per_sqft_per_month'] || utilityRate.avg_monthly_per_sqft || utilityRate.utility_cost_per_sqft_per_month || 0;

        // Apply user overrides (same logic as renderFacilityCostCard)
        var ov = this.projectData.facilityRateOverrides || {};
        var leaseRate = ov.lease != null ? ov.lease : (facilityRate.lease_rate_psf_yr || facilityRate.lease_rate_per_sqft || 0);
        var camRate = ov.cam != null ? ov.cam : (facilityRate.cam_rate_psf_yr || facilityRate.cam_rate_per_sqft || 0);
        var taxRate = ov.tax != null ? ov.tax : (facilityRate.tax_rate_psf_yr || facilityRate.tax_rate_per_sqft || 0);
        var insRate = ov.insurance != null ? ov.insurance : (facilityRate.insurance_rate_psf_yr || facilityRate.insurance_rate_per_sqft || 0);
        var utilRate = ov.utility != null ? ov.utility : utilPerSfMo;

        // Cold storage premium (same as renderFacilityCostCard)
        var coldMult = envType === 'cold' || envType === 'cooler' ? 1.25 : (envType === 'frozen' || envType === 'freezer' ? 1.50 : 1.0);
        var adjLease = leaseRate * coldMult;

        // Maintenance
        var maintMode = ov.maint_mode || 'pct';
        var maintPct = ov.maint_pct != null ? ov.maint_pct : 0.02;
        var maintFixed = ov.maint_fixed != null ? ov.maint_fixed : 0;
        var maintPerSf = maintMode === 'fixed' ? maintFixed : (adjLease * maintPct);

        return (sqft * adjLease) + (sqft * camRate) + (sqft * taxRate) + (sqft * insRate) + (sqft * utilRate * 12) + (sqft * maintPerSf);
    },

    calculateEquipmentCost() {
        let cost = 0;
        this.projectData.equipmentLines.forEach(line => {
            var ownType = line.ownership_type || line.acquisition_type || 'lease';
            if (ownType === 'purchase') {
                var amortYrs = line.amort_years || 5;
                var acqCost = line.acquisition_cost || 0;
                var maintPct = line.maintenance_pct || 0.10;
                cost += ((acqCost / amortYrs) + (acqCost * maintPct)) * (line.quantity || 1);
            } else {
                var monthly = ((line.monthly_cost || 0) + (line.monthly_maintenance || 0)) * (line.quantity || 1);
                cost += monthly * 12;
            }
        });
        return cost;
    },

    calculateOverheadCost() {
        let cost = 0;
        this.projectData.overheadLines.forEach(line => {
            if (line.cost_type === 'monthly') {
                cost += (line.monthly_cost || 0) * 12;
            } else {
                cost += line.annual_cost || 0;
            }
        });
        return cost;
    },

    calculateVasCost() {
        let cost = 0;
        this.projectData.vasLines.forEach(line => {
            // Use computed total_cost if available (from renderVasTable breakdown), else fallback
            cost += line.total_cost || ((line.rate || 0) * (line.volume || 0));
        });
        return cost;
    },

    getTotalFtes() {
        let ftes = 0;
        const hours = this.getOperatingHours();
        this.projectData.laborLines.forEach(line => {
            if (hours > 0) ftes += (line.annual_hours || 0) / hours;
        });
        this.projectData.indirectLaborLines.forEach(line => {
            ftes += line.headcount || 0;
        });
        return ftes;
    },

    getOperatingHours() {
        const shifts = parseFloat(document.getElementById('shiftsPerDay').value) || 1;
        const hours = parseFloat(document.getElementById('hoursPerShift').value) || 8;
        const days = parseFloat(document.getElementById('daysPerWeek').value) || 5;
        const weeks = parseFloat(document.getElementById('weeksPerYear').value) || 52;

        return hours * days * weeks;
    },

    addLaborRow() {
        this.projectData.laborLines.push({
            activity_name: '',
            most_template_name: '',
            most_template_id: '',
            volume: 0,
            base_uph: 0,
            adjusted_uph: 0,
            annual_hours: 0,
            hourly_rate: 0,
            burden_pct: 0,
            mhe_equipment_id: '',
            it_equipment_id: '',
            volume_line_id: '',
            uom: 'each'
        });
        this.renderLaborTable();
    },

    deleteLaborLine(idx) {
        this.projectData.laborLines.splice(idx, 1);
        this.renderLaborTable();
        this.markChanged();
    },

    addIndirectLaborRow() {
        this.projectData.indirectLaborLines.push({
            role_name: '',
            headcount: 1,
            hourly_rate: 0,
            burden_pct: 35,
            annual_hours: 0,
            pricing_bucket: ''
        });
        this.renderIndirectLaborTable();
    },

    deleteIndirectLaborLine(idx) {
        this.projectData.indirectLaborLines.splice(idx, 1);
        this.renderIndirectLaborTable();
        this.markChanged();
    },

    // =====================================================================
    // VOLUME LINES
    // =====================================================================
    addVolumeLine() {
        this.projectData.volumeLines.push({
            process_area: '',
            name: '',
            uom: 'each',
            annual_volume: 0,
            daily_volume: 0
        });
        this.renderVolumeLines();
        this.markChanged();
    },

    renderVolumeLines() {
        const tbody = document.getElementById('volumeLinesBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const operatingDays = this.getOperatingDays();
        const processAreas = ['Receiving', 'Putaway', 'Replenishment', 'Picking', 'Packing', 'Shipping', 'Returns', 'VAS'];

        this.projectData.volumeLines.forEach((line, idx) => {
            const dailyVolume = operatingDays > 0 ? (line.annual_volume || 0) / operatingDays : 0;
            line.daily_volume = dailyVolume;
            const row = document.createElement('tr');

            // Build process area select
            let processAreaHtml = '<select class="cm-input" style="width:120px;padding:4px 4px;font-size:11px;" onchange="cmApp._updateLine(\'volumeLines\',' + idx + ',\'process_area\',this.value,\'text\'); cmApp.syncVolumesToLegacy(); cmApp.markChanged();">';
            processAreaHtml += '<option value=""' + (!line.process_area ? ' selected' : '') + '>(Select)</option>';
            processAreas.forEach(pa => {
                const sel = pa === line.process_area ? ' selected' : '';
                processAreaHtml += '<option value="' + pa + '"' + sel + '>' + pa + '</option>';
            });
            processAreaHtml += '</select>';

            row.innerHTML =
                '<td>' + processAreaHtml + '</td>' +
                '<td>' + this._cmInp('text', line.name, idx, 'volumeLines', 'name', {w:150, ph:'e.g., Cases Shipped'}) + '</td>' +
                '<td>' + this._volumeUomSelectHtml(idx, line.uom) + '</td>' +
                '<td class="cm-table-number">' + this._cmInp('number', line.annual_volume, idx, 'volumeLines', 'annual_volume', {w:100, ph:'0'}) + '</td>' +
                '<td class="cm-table-number" id="vol-daily-' + idx + '">' + dailyVolume.toLocaleString('en-US', {minimumFractionDigits:1, maximumFractionDigits:1}) + '</td>' +
                '<td class="cm-table-actions"><button class="cm-btn-small cm-btn-small-danger" onclick="cmApp.deleteVolumeLine(' + idx + ')">Delete</button></td>';
            tbody.appendChild(row);
        });

        // Sync to legacy fields at end of render
        this.syncVolumesToLegacy();
    },

    deleteVolumeLine(idx) {
        this.projectData.volumeLines.splice(idx, 1);
        this.renderVolumeLines();
        this.renderLaborTable(); // Re-render labor table to update volume source dropdowns
        this.markChanged();
    },

    preseedVolumeLines() {
        // Clear and populate with standard 12 default volume lines
        this.projectData.volumeLines = [
            { process_area: 'Receiving', name: 'Pallets Received', uom: 'pallet', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Receiving', name: 'Cases Received', uom: 'case', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Putaway', name: 'Pallets Putaway', uom: 'pallet', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Putaway', name: 'Cases Putaway', uom: 'case', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Replenishment', name: 'Replenishments', uom: 'pallet', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Picking', name: 'Eaches Picked', uom: 'each', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Picking', name: 'Cases Picked', uom: 'case', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Picking', name: 'Pallets Picked', uom: 'pallet', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Packing', name: 'Orders Packed', uom: 'order', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Shipping', name: 'Pallets Shipped', uom: 'pallet', annual_volume: 0, daily_volume: 0 },
            { process_area: 'Returns', name: 'Returns Processed', uom: 'each', annual_volume: 0, daily_volume: 0 },
            { process_area: 'VAS', name: 'VAS Units', uom: 'unit', annual_volume: 0, daily_volume: 0 }
        ];
        this.renderVolumeLines();
        this.markChanged();
    },

    syncVolumesToLegacy() {
        // Map volume line names to legacy field IDs
        const map = {
            'Pallets Received': 'palletsReceived',
            'Cases Received': 'casesReceived',
            'Pallets Putaway': 'palletsPutaway',
            'Cases Putaway': 'casesPutaway',
            'Replenishments': 'replenishments',
            'Eaches Picked': 'eachesPicked',
            'Cases Picked': 'casesPicked',
            'Pallets Picked': 'palletsPicked',
            'Orders Packed': 'ordersPacked',
            'Pallets Shipped': 'palletsShipped',
            'Returns Processed': 'returnsProcessed',
            'VAS Units': 'vasUnits'
        };

        // Reset all to 0
        Object.values(map).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = 0;
        });

        // Set from volume lines
        this.projectData.volumeLines.forEach(vl => {
            const fieldId = map[vl.name];
            if (fieldId) {
                const el = document.getElementById(fieldId);
                if (el) el.value = vl.annual_volume || 0;
            }
        });

        // Trigger downstream updates
        this.updateVolumeDailyValues();
        this.updateOrderMetrics();
        this.updateFacilityMetrics();
    },

    _volumeUomSelectHtml(idx, currentUom) {
        const uoms = ['each', 'case', 'carton', 'pallet', 'order', 'line', 'unit', 'lb', 'cu ft'];
        let html = '<select class="cm-input" style="width:100px;padding:4px 4px;font-size:11px;" onchange="cmApp._updateLine(\'volumeLines\',' + idx + ',\'uom\',this.value,\'text\'); cmApp.renderLaborTable(); cmApp.markChanged();">';
        uoms.forEach(u => {
            const sel = u === currentUom ? ' selected' : '';
            html += '<option value="' + u + '"' + sel + '>' + u + '</option>';
        });
        html += '</select>';
        return html;
    },

    deleteEquipmentLine(idx) {
        this.projectData.equipmentLines.splice(idx, 1);
        this.renderEquipmentTable();
        this.markChanged();
    },

    deleteOverheadLine(idx) {
        this.projectData.overheadLines.splice(idx, 1);
        this.renderOverheadTable();
        this.markChanged();
    },

    deleteVasLine(idx) {
        this.projectData.vasLines.splice(idx, 1);
        this.renderVasTable();
        this.markChanged();
    },

    showEquipmentCatalog() {
        // For now, just add an empty row - in a full implementation,
        // this would show a modal with the equipment catalog
        this.projectData.equipmentLines.push({
            equipment_name: '',
            category: '',
            quantity: 1,
            acquisition_cost: 0,
            monthly_cost: 0,
            monthly_maintenance: 0,
            amort_years: 5
        });
        this.renderEquipmentTable();
    },

    addOverheadRow() {
        this.projectData.overheadLines.push({
            category: '',
            description: '',
            monthly_cost: 0,
            cost_type: 'monthly',
            annual_cost: 0,
            source: 'manual'
        });
        this.renderOverheadTable();
    },

    addVasRow() {
        this.projectData.vasLines.push({
            service_name: '',
            service_type: 'custom',
            rate: 0,
            uom: 'each',
            volume: 0,
            uph: 0,
            labor_rate: 0,
            material_cost: 0,
            space_sf: 0,
            source: 'manual',
            _expanded: true
        });
        this.renderVasTable();
    },

    // ── SIDEBAR TOGGLE ──
    toggleSidebar() {
        var container = document.getElementById('editorContainer');
        var sidebar = document.getElementById('cmSidebar');
        var toggle = document.getElementById('cmSidebarToggle');
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            container.classList.remove('sidebar-collapsed');
            toggle.style.left = '248px';
        } else {
            sidebar.classList.add('collapsed');
            container.classList.add('sidebar-collapsed');
            toggle.style.left = '4px';
        }
    },

    // ── TABLE POPOUT (fullscreen view for data-heavy tables) ──
    _popoutSource: null,

    openPopout(tableType) {
        var overlay = document.getElementById('cmPopoutOverlay');
        var popout = document.getElementById('cmPopout');
        var body = document.getElementById('cmPopoutBody');
        var title = document.getElementById('cmPopoutTitle');
        this._popoutSource = tableType;

        if (tableType === 'labor') {
            title.textContent = 'Direct Labor (MOST-Based) — Expanded View';
            // Clone the labor table into the popout (not move, so original stays)
            var origTable = document.getElementById('laborTable').closest('table');
            var clone = origTable.cloneNode(true);
            clone.style.minWidth = 'auto';
            clone.id = 'laborTablePopout';
            body.innerHTML = '';
            body.appendChild(clone);
            // Add the "Add Row" button
            var btnDiv = document.createElement('div');
            btnDiv.style.cssText = 'margin-top:16px;';
            btnDiv.innerHTML = '<button class="cm-btn cm-btn-secondary" onclick="cmApp.addLaborRow();cmApp.refreshPopout();">+ Add Labor Row</button>';
            body.appendChild(btnDiv);
        }

        overlay.classList.add('open');
        popout.classList.add('open');
        document.body.style.overflow = 'hidden';
    },

    refreshPopout() {
        if (this._popoutSource) {
            this.closePopout();
            this.openPopout(this._popoutSource);
        }
    },

    closePopout() {
        var overlay = document.getElementById('cmPopoutOverlay');
        var popout = document.getElementById('cmPopout');
        overlay.classList.remove('open');
        popout.classList.remove('open');
        document.body.style.overflow = '';
        this._popoutSource = null;
        // Re-render the original table to reflect any changes
        this.renderLaborTable();
        this.updateLaborTotals();
    },

    // ── TOOL DRAWER (embeds Calculator & Network tools inside Cost Model) ──
    _drawerSource: null,       // 'calculator' or 'network'
    _drawerOrigParent: null,   // where the panel lived before we moved it
    _drawerOrigDisplay: null,  // original display value

    openDrawer(tool) {
        var overlay = document.getElementById('cmDrawerOverlay');
        var drawer  = document.getElementById('cmDrawer');
        var body    = document.getElementById('cmDrawerBody');
        var title   = document.getElementById('cmDrawerTitle');

        // Determine which panel to relocate
        var panelId, label, iconSvg;
        if (tool === 'calculator') {
            panelId = 'dt-warehouse';
            label = 'Warehouse Sizing Calculator';
            iconSvg = '<svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="2" stroke="var(--ies-blue)" stroke-width="1.5"/><path d="M3 12h18M8 8v12M16 8v12" stroke="var(--ies-blue)" stroke-width="1.2" opacity=".5"/><path d="M7 5l5-2 5 2" stroke="var(--ies-blue)" stroke-width="1.5" stroke-linecap="round"/></svg>';
        } else if (tool === 'network') {
            panelId = 'dt-network';
            label = 'Center of Gravity';
            iconSvg = '<svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.5" stroke="var(--ies-blue)" stroke-width="1.5"/><circle cx="18" cy="6" r="2.5" stroke="var(--ies-blue)" stroke-width="1.5"/><circle cx="12" cy="18" r="2.5" stroke="var(--ies-blue)" stroke-width="1.5"/><path d="M8 7l4 9M16 7l-4 9M8.5 6h7" stroke="var(--ies-blue)" stroke-width="1.2" opacity=".5"/></svg>';
        } else { return; }

        var panel = document.getElementById(panelId);
        if (!panel) return;

        // Remember where it came from
        this._drawerSource = tool;
        this._drawerOrigParent = panel.parentNode;
        this._drawerOrigDisplay = panel.style.display;

        // Move into drawer body
        body.innerHTML = '';
        body.appendChild(panel);
        panel.style.display = 'block';

        // Set title
        title.innerHTML = iconSvg + ' ' + label;

        // Fire initial calc so values are current
        if (tool === 'calculator' && typeof calcWarehouse === 'function') {
            try { calcWarehouse(); } catch(e) { console.error('Error:', e); }
        }
        if (tool === 'network' && typeof runNetworkOptimization === 'function') {
            try { runNetworkOptimization(); } catch(e) { console.error('Error:', e); }
        }

        // Open
        overlay.classList.add('open');
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Leaflet maps need invalidateSize after container moves
        setTimeout(function() {
            if (tool === 'network' && typeof netMap !== 'undefined' && netMap && netMap.invalidateSize) {
                netMap.invalidateSize();
            }
            if (tool === 'calculator' && typeof mapInstance !== 'undefined' && mapInstance && mapInstance.invalidateSize) {
                mapInstance.invalidateSize();
            }
        }, 350);
    },

    closeDrawer() {
        var overlay = document.getElementById('cmDrawerOverlay');
        var drawer  = document.getElementById('cmDrawer');
        var body    = document.getElementById('cmDrawerBody');

        // Move panel back to original location
        if (this._drawerOrigParent && body.firstElementChild) {
            var panel = body.firstElementChild;
            panel.style.display = this._drawerOrigDisplay || 'none';
            this._drawerOrigParent.appendChild(panel);
        }

        // Import values based on which tool was open
        if (this._drawerSource === 'calculator') {
            this.importFromCalculator();
        } else if (this._drawerSource === 'network') {
            this.importFromNetwork();
        }

        // Close
        overlay.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
        this._drawerSource = null;
        this._drawerOrigParent = null;
    },

    // ── TOOL INTEGRATIONS (import helpers called by closeDrawer) ──
    importFromCalculator() {
        const sqftEl = document.getElementById('wsc-r-sqft');
        const docksEl = document.getElementById('wsc-r-docks');
        const heightEl = document.getElementById('wsc-r-height');

        if (!sqftEl || sqftEl.textContent.trim() === '—') {
            const empty = document.getElementById('wscImportEmpty');
            if (empty) { empty.innerHTML = '<span style="color:var(--ies-orange);font-weight:600;">⚠ No calculator results found.</span> Open the Warehouse Sizing Calculator from Design Tools and run a calculation first.'; }
            return;
        }

        // Parse values from calculator KPI strip
        const sqft = parseInt(sqftEl.textContent.replace(/[^0-9]/g, '')) || 0;
        const docks = parseInt(docksEl.textContent.replace(/[^0-9]/g, '')) || 0;
        const height = parseInt(heightEl.textContent.replace(/[^0-9]/g, '')) || 0;

        // Positions & utilization
        const posEl = document.getElementById('wsc-r-positions');
        const positions = posEl ? parseInt(posEl.textContent.replace(/[^0-9]/g, '')) || 0 : 0;

        // Set values in Cost Model facility fields
        if (sqft > 0) document.getElementById('totalSqft').value = sqft;
        if (docks > 0) document.getElementById('dockDoors').value = docks;
        if (height > 0) document.getElementById('clearHeight').value = height;

        // Update calculated values
        this.updateFacilityMetrics();
        this.updateSqftSuggestion();
        this.markChanged();

        // Show preview
        const preview = document.getElementById('wscImportPreview');
        const valuesEl = document.getElementById('wscImportValues');
        const empty = document.getElementById('wscImportEmpty');
        if (preview && valuesEl) {
            valuesEl.innerHTML =
                '<div><span style="font-weight:600;color:var(--ies-gray-500);font-size:10px;text-transform:uppercase;letter-spacing:.5px;">Total SF</span><div style="font-weight:700;font-size:16px;color:var(--ies-navy);">' + sqft.toLocaleString() + '</div></div>' +
                '<div><span style="font-weight:600;color:var(--ies-gray-500);font-size:10px;text-transform:uppercase;letter-spacing:.5px;">Dock Doors</span><div style="font-weight:700;font-size:16px;color:var(--ies-navy);">' + docks + '</div></div>' +
                '<div><span style="font-weight:600;color:var(--ies-gray-500);font-size:10px;text-transform:uppercase;letter-spacing:.5px;">Clear Height</span><div style="font-weight:700;font-size:16px;color:var(--ies-navy);">' + height + ' ft</div></div>';
            preview.style.display = 'block';
            if (empty) empty.innerHTML = '<span style="color:var(--ies-green, #198754);font-weight:600;">✓ Values imported successfully</span>';
        }
    },

    importFromNetwork() {
        const dcsEl = document.getElementById('net-k-dcs');
        const dcResultsEl = document.getElementById('net-dc-results');

        if (!dcsEl || dcsEl.textContent.trim() === '—') {
            const empty = document.getElementById('netImportEmpty');
            if (empty) { empty.innerHTML = '<span style="color:var(--ies-orange);font-weight:600;">⚠ No network results found.</span> Open the Center of Gravity tool from Design Tools and run an analysis first.'; }
            return;
        }

        // Parse key network metrics
        const numDCs = parseInt(dcsEl.textContent) || 0;
        const distEl = document.getElementById('net-k-dist');
        const costEl = document.getElementById('net-k-cost');
        const avgDist = distEl ? distEl.textContent.trim() : '—';
        const transCost = costEl ? costEl.textContent.trim() : '—';

        // Try to extract DC location info from results panel
        let locationInfo = '';
        if (dcResultsEl) {
            const text = dcResultsEl.textContent || '';
            // Extract first DC location mention
            const match = text.match(/DC\s*#?\d*[:\s]+([A-Za-z\s,]+(?:,\s*[A-Z]{2}))/);
            if (match) locationInfo = match[1].trim();
        }

        // Show preview
        const preview = document.getElementById('netImportPreview');
        const valuesEl = document.getElementById('netImportValues');
        const empty = document.getElementById('netImportEmpty');
        if (preview && valuesEl) {
            let html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">';
            html += '<div><span style="font-weight:600;color:var(--ies-gray-500);font-size:10px;text-transform:uppercase;letter-spacing:.5px;">DCs</span><div style="font-weight:700;font-size:16px;color:var(--ies-navy);">' + numDCs + '</div></div>';
            html += '<div><span style="font-weight:600;color:var(--ies-gray-500);font-size:10px;text-transform:uppercase;letter-spacing:.5px;">Avg Distance</span><div style="font-weight:700;font-size:16px;color:var(--ies-navy);">' + avgDist + '</div></div>';
            html += '<div><span style="font-weight:600;color:var(--ies-gray-500);font-size:10px;text-transform:uppercase;letter-spacing:.5px;">Transport Cost</span><div style="font-weight:700;font-size:16px;color:var(--ies-navy);">' + transCost + '</div></div>';
            html += '</div>';
            if (locationInfo) {
                html += '<div style="margin-top:8px;padding:8px 12px;background:rgba(0,71,171,0.06);border-radius:6px;font-size:12px;"><strong>Recommended Location:</strong> ' + locationInfo + '</div>';
            }
            html += '<div style="margin-top:8px;font-size:11px;color:var(--ies-gray-500);">Use these insights to select the appropriate market and inform facility decisions.</div>';
            valuesEl.innerHTML = html;
            preview.style.display = 'block';
            if (empty) empty.innerHTML = '<span style="color:var(--ies-green, #198754);font-weight:600;">✓ Network data imported</span>';
        }

        this.markChanged();
    },

    markChanged() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);

        const indicator = document.getElementById('saveIndicator');
        indicator.textContent = 'Saving...';

        this.saveTimeout = setTimeout(() => {
            this.saveProject();
        }, 1000);
    },

    exportToExcel() {
        const projectName = document.getElementById('modelName').value || 'Cost Model';
        const today = new Date().toLocaleDateString('en-US');

        // Build CSV sections
        let csv = 'Cost Model Export\n';
        csv += 'Project: ' + projectName + '\n';
        csv += 'Date: ' + today + '\n\n';

        // --- Cost Summary ---
        csv += '--- Cost Summary ---\n';
        csv += 'Category\tAnnual Cost\t% of Total\n';

        const laborCost = this.calculateLaborCost();
        const facilityCost = this.calculateFacilityCost();
        const equipmentCost = this.calculateEquipmentCost();
        const overheadCost = this.calculateOverheadCost();
        const vasCost = this.calculateVasCost();
        const startupAmort = this.calculateStartupAmortization();
        const totalCost = laborCost + facilityCost + equipmentCost + overheadCost + vasCost + startupAmort;

        const fmtCost = (v) => '$' + Math.round(v).toLocaleString('en-US');
        const fmtPct = (v) => totalCost > 0 ? (v / totalCost * 100).toFixed(1) + '%' : '0%';

        csv += 'Labor\t' + fmtCost(laborCost) + '\t' + fmtPct(laborCost) + '\n';
        csv += 'Facility\t' + fmtCost(facilityCost) + '\t' + fmtPct(facilityCost) + '\n';
        csv += 'Equipment\t' + fmtCost(equipmentCost) + '\t' + fmtPct(equipmentCost) + '\n';
        csv += 'Overhead\t' + fmtCost(overheadCost) + '\t' + fmtPct(overheadCost) + '\n';
        csv += 'VAS\t' + fmtCost(vasCost) + '\t' + fmtPct(vasCost) + '\n';
        csv += 'Start-Up Amort\t' + fmtCost(startupAmort) + '\t' + fmtPct(startupAmort) + '\n';
        csv += 'TOTAL\t' + fmtCost(totalCost) + '\t100%\n\n';

        // --- Pricing Schedule ---
        csv += '--- Pricing Schedule ---\n';
        csv += 'Bucket\tType\tAnnual Cost\tRate\tUOM\n';

        const { bucketCosts } = this.calculatePricingSchedule();
        this.projectData.pricingBuckets.forEach(b => {
            const cost = bucketCosts[b.id] || 0;
            if (cost === 0) return;
            const vol = this.getBucketVolume(b);
            let rateDisplay;
            if (b.type === 'fixed') {
                rateDisplay = '$' + (cost / 12).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '/month';
            } else {
                const rate = vol > 0 ? cost / vol : 0;
                rateDisplay = '$' + rate.toFixed(rate >= 1 ? 2 : 4);
            }
            csv += b.name + '\t' + (b.type === 'fixed' ? 'Fixed' : 'Variable') + '\t' + fmtCost(cost) + '\t' + rateDisplay + '\t' + b.uom + '\n';
        });
        csv += '\n';

        // --- Multi-Year Budget ---
        csv += '--- Multi-Year Budget ---\n';
        const { projections } = this.buildYearlyProjections();
        if (projections && projections.length > 0) {
            csv += 'Line Item\t' + projections.map(p => 'Year ' + p.year).join('\t') + '\n';

            const rows = [
                { label: 'Revenue', key: 'revenue' },
                { label: 'Labor', key: 'labor' },
                { label: 'Facility', key: 'facility' },
                { label: 'Equipment', key: 'equipment' },
                { label: 'Overhead', key: 'overhead' },
                { label: 'VAS', key: 'vas' },
                { label: 'Start-Up Amort', key: 'startup' },
                { label: 'Total Cost', key: 'totalCost' },
                { label: 'Gross Profit', key: 'grossProfit' },
                { label: 'EBITDA', key: 'ebitda' }
            ];

            rows.forEach(r => {
                csv += r.label + '\t' + projections.map(p => fmtCost(p[r.key])).join('\t') + '\n';
            });
        }
        csv += '\n';

        // --- Financial Metrics ---
        csv += '--- Financial Metrics ---\n';
        csv += 'Metric\tValue\n';
        const { projections: finProj } = this.buildYearlyProjections();
        if (finProj && finProj.length > 0) {
            const p = finProj[0];
            const grossMargin = p.revenue > 0 ? (p.grossProfit / p.revenue * 100).toFixed(1) : '0';
            const roi = p.totalCost > 0 ? (p.grossProfit / p.totalCost * 100).toFixed(1) : '0';
            csv += 'Gross Margin %\t' + grossMargin + '%\n';
            csv += 'ROI %\t' + roi + '%\n';
            csv += 'Year 1 Revenue\t' + fmtCost(p.revenue) + '\n';
            csv += 'Year 1 Total Cost\t' + fmtCost(p.totalCost) + '\n';
            csv += 'Year 1 Gross Profit\t' + fmtCost(p.grossProfit) + '\n';
        }

        // Create and download blob
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'cost_model_export.csv');
        link.click();
    },

    async saveProject() {
        try {
            const nameVal = document.getElementById('modelName').value.trim();
            if (!nameVal) {
                document.getElementById('saveIndicator').textContent = 'Name required';
                setTimeout(() => { document.getElementById('saveIndicator').textContent = ''; }, 3000);
                return;
            }
            const projectData = {
                name: nameVal,
                description: document.getElementById('modelDescription').value,
                market_id: document.getElementById('market').value || null,
                environment_type: document.getElementById('environment').value || 'ambient',
                allowance_profile_id: document.getElementById('allowanceProfile').value ? parseInt(document.getElementById('allowanceProfile').value) : null,
                vol_pallets_received: parseFloat(document.getElementById('palletsReceived').value) || 0,
                vol_cases_received: parseFloat(document.getElementById('casesReceived').value) || 0,
                vol_pallets_putaway: parseFloat(document.getElementById('palletsPutaway').value) || 0,
                vol_cases_putaway: parseFloat(document.getElementById('casesPutaway').value) || 0,
                vol_replenishments: parseFloat(document.getElementById('replenishments').value) || 0,
                vol_eaches_picked: parseFloat(document.getElementById('eachesPicked').value) || 0,
                vol_cases_picked: parseFloat(document.getElementById('casesPicked').value) || 0,
                vol_pallets_picked: parseFloat(document.getElementById('palletsPicked').value) || 0,
                vol_orders_packed: parseFloat(document.getElementById('ordersPacked').value) || 0,
                vol_pallets_shipped: parseFloat(document.getElementById('palletsShipped').value) || 0,
                vol_returns_processed: parseFloat(document.getElementById('returnsProcessed').value) || 0,
                vol_vas_units: parseFloat(document.getElementById('vasUnits').value) || 0,
                avg_lines_per_order: parseFloat(document.getElementById('linesPerOrder').value) || 0,
                avg_units_per_line: parseFloat(document.getElementById('unitsPerLine').value) || 0,
                avg_order_weight_lbs: parseFloat(document.getElementById('orderWeight').value) || 0,
                pct_single_line_orders: parseFloat(document.getElementById('singleLineOrderPct').value) || 0,
                facility_sqft: parseFloat(document.getElementById('totalSqft').value) || 0,
                clear_height_ft: parseFloat(document.getElementById('clearHeight').value) || 0,
                dock_doors: parseFloat(document.getElementById('dockDoors').value) || 0,
                staging_sqft: parseFloat(document.getElementById('stagingSqft').value) || 0,
                office_sqft: parseFloat(document.getElementById('officeSqft').value) || 0,
                pick_method: document.getElementById('pickMethod') ? document.getElementById('pickMethod').value : null,
                avg_pick_travel_ft: parseFloat(document.getElementById('avgPickTravel')?.value) || null,
                avg_putaway_travel_ft: parseFloat(document.getElementById('avgPutawayTravel')?.value) || null,
                avg_replen_travel_ft: parseFloat(document.getElementById('avgReplenTravel')?.value) || null,
                shifts_per_day: parseFloat(document.getElementById('shiftsPerDay').value) || 1,
                hours_per_shift: parseFloat(document.getElementById('hoursPerShift').value) || 8,
                days_per_week: parseFloat(document.getElementById('daysPerWeek').value) || 5,
                operating_weeks_per_year: parseFloat(document.getElementById('weeksPerYear').value) || 52,
                shift_2_premium: (parseFloat(document.getElementById('shift2Premium').value) || 0) / 100,
                shift_3_premium: (parseFloat(document.getElementById('shift3Premium').value) || 0) / 100,
                absence_allowance_pct: (parseFloat(document.getElementById('absenceAllowance').value) || 0) / 100,
                target_margin_pct: parseFloat(document.getElementById('targetMargin').value) || 0,
                contract_term_years: parseFloat(document.getElementById('contractTerm').value) || 1,
                annual_volume_growth_pct: parseFloat(document.getElementById('volumeGrowth').value) || 0,
                startup_cost: (this.projectData.startupLines || []).reduce(function(sum, l) { return sum + (parseFloat(l.amount) || 0); }, 0) || parseFloat(document.getElementById('startupCosts')?.value || document.getElementById('startupCost')?.value || '0') || 0,
                pricing_model: document.getElementById('pricingModel').value || 'hybrid',
                overtime_pct: parseFloat(document.getElementById('overtimePct').value) || 5,
                benefit_load_pct: parseFloat(document.getElementById('benefitLoadPct').value) || 35,
                bonus_pct: parseFloat(document.getElementById('bonusPct').value) || 0,
                labor_escalation_pct: parseFloat(document.getElementById('laborEscalation').value) || 3,
                ramp_weeks_low: parseInt(document.getElementById('rampWeeksLow').value) || 2,
                ramp_weeks_med: parseInt(document.getElementById('rampWeeksMed').value) || 4,
                ramp_weeks_high: parseInt(document.getElementById('rampWeeksHigh').value) || 8,
                facility_rate_overrides: JSON.stringify(this.projectData.facilityRateOverrides || {}),
                seasonality_profile: JSON.stringify(this.getSeasonalityProfile()),
                total_annual_cost: this.calculateLaborCost() + this.calculateFacilityCost() +
                                  this.calculateEquipmentCost() + this.calculateOverheadCost() +
                                  this.calculateVasCost(),
                pricing_buckets: JSON.stringify(this.projectData.pricingBuckets || []),
                status: 'draft',
                deal_deals_id: (function() { var v = document.getElementById('cmDealSelector')?.value || ''; var n = parseInt(v, 10); return isNaN(n) ? null : n; })()
            };

            if (this.currentProject) {
                await cmApiPatch('cost_model_projects', this.currentProject.id, projectData);
            } else {
                const created = await cmApiPost('cost_model_projects', projectData);
                this.currentProject = created[0];
            }

            // Auto-link to deal workspace if deal is selected
            if (projectData.deal_deals_id && this.currentProject && typeof sb !== 'undefined' && sb) {
                try {
                    var { data: existing } = await sb.from('deal_artifacts')
                        .select('id').eq('deal_id', projectData.deal_deals_id)
                        .eq('artifact_type', 'cost_model')
                        .eq('artifact_id', String(this.currentProject.id)).limit(1);
                    if (!existing || existing.length === 0) {
                        var parts = [];
                        if (projectData.total_annual_cost) parts.push('$' + Number(projectData.total_annual_cost).toLocaleString() + '/yr');
                        if (projectData.facility_sqft) parts.push(Number(projectData.facility_sqft).toLocaleString() + ' SF');
                        if (projectData.environment_type) parts.push(projectData.environment_type);
                        await sb.from('deal_artifacts').insert({
                            deal_id: projectData.deal_deals_id,
                            artifact_type: 'cost_model',
                            artifact_id: String(this.currentProject.id),
                            artifact_name: projectData.name,
                            artifact_notes: parts.join(' · ') || null,
                            created_by: 'IES Hub'
                        });
                    }
                } catch(e) { console.warn('Could not auto-link cost model to deal:', e); }
            }

            // ── Persist child tables ──
            const pid = this.currentProject.id;

            // Helper: delete-then-insert pattern for child tables
            const persistChildTable = async (tableName, rows) => {
                // Delete existing rows for this project
                try {
                    const existing = await cmFetchTable(tableName, 'project_id=eq.' + pid);
                    for (const row of existing) {
                        await cmApiDelete(tableName, row.id);
                    }
                } catch(e) { /* table may be empty */ }
                // Insert current rows
                if (rows && rows.length > 0) {
                    for (const row of rows) {
                        const clean = Object.assign({}, row);
                        delete clean.id; // let DB assign new IDs
                        clean.project_id = pid;
                        await cmApiPost(tableName, clean);
                    }
                }
            };

            try {
                await Promise.all([
                    persistChildTable('cost_model_labor', this.projectData.laborLines),
                    persistChildTable('cost_model_equipment', this.projectData.equipmentLines),
                    persistChildTable('cost_model_overhead', this.projectData.overheadLines),
                    persistChildTable('cost_model_vas', this.projectData.vasLines),
                    persistChildTable('cost_model_volumes', this.projectData.volumeLines)
                ]);
            } catch(e) { console.warn('Child table save error:', e); }

            const indicator = document.getElementById('saveIndicator');
            indicator.textContent = 'Saved';
            setTimeout(() => { indicator.textContent = ''; }, 2000);

        } catch (error) {
            console.error('Save error:', error);
            document.getElementById('saveIndicator').textContent = 'Error saving';
        }
    }
};

// Deal Manager Application
const dealApp = {
    currentDeal: null,
    deals: [],

    fmt: {
        currency: function(val) {
            const n = parseFloat(val);
            if (isNaN(n)) return '—';
            return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        },
        num: function(val, decimals) {
            const n = parseFloat(val);
            if (isNaN(n)) return '—';
            return n.toLocaleString('en-US', { minimumFractionDigits: decimals || 0, maximumFractionDigits: decimals || 0 });
        },
        percent: function(val) {
            const n = parseFloat(val);
            if (isNaN(n)) return '—';
            return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
        }
    },

    async loadDeals() {
        try {
            this.deals = await cmFetchTable('deal_deals', 'order=updated_at.desc');
            this.renderDealList();
        } catch (error) {
            console.error('Error loading deals:', error);
            this.deals = [];
            this.renderDealList();
        }
    },

    renderDealList() {
        const listView = document.getElementById('dealListView');
        const emptyState = document.getElementById('deal-empty-state');
        const detailView = document.getElementById('dealDetailView');
        const landing = document.getElementById('deal-landing');

        // Show landing, hide detail
        if (landing) landing.style.display = 'block';
        if (detailView) detailView.style.display = 'none';

        if (this.deals.length === 0) {
            listView.style.display = 'none';
            dtToggleLandingEmpty('deal-landing-actions', 'deal-empty-state', true);
            return;
        }

        dtToggleLandingEmpty('deal-landing-actions', 'deal-empty-state', false);
        listView.style.display = '';
        listView.innerHTML = '';
        this.deals.forEach(deal => {
            const card = document.createElement('div');
            card.className = 'dt-landing-card';

            const statusColors = {
                'Draft': 'background:rgba(107,114,128,.1);color:rgb(107,114,128)',
                'In Progress': 'background:rgba(37,99,235,.1);color:rgb(37,99,235)',
                'Proposal Sent': 'background:rgba(251,146,60,.1);color:rgb(251,146,60)',
                'Won': 'background:rgba(34,197,94,.1);color:rgb(34,197,94)',
                'Lost': 'background:rgba(239,68,68,.1);color:rgb(239,68,68)'
            };

            card.innerHTML = `
                <div style="cursor:pointer;" onclick="dealApp.openDeal('${esc(deal.id)}')">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
                    <div style="font-weight:700;font-size:15px;color:var(--ies-navy);flex:1;margin-right:12px;">${esc(deal.deal_name)}</div>
                    <span style="padding:4px 10px;border-radius:4px;font-size:11px;font-weight:600;${statusColors[deal.status] || statusColors['Draft']};white-space:nowrap;">${esc(deal.status)}</span>
                </div>
                <div style="font-size:12px;color:var(--ies-gray-600);margin-bottom:8px;"><strong>Client:</strong> ${esc(deal.client_name || '—')}</div>
                <div style="font-size:12px;color:var(--ies-gray-600);margin-bottom:12px;"><strong>Owner:</strong> ${esc(deal.deal_owner || '—')}</div>
                <div style="padding-top:12px;border-top:1px solid var(--ies-gray-200);display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
                    <div>
                        <div style="color:var(--ies-gray-500);font-weight:500;margin-bottom:2px;">Sites</div>
                        <div id="card-sites-${esc(deal.id)}" style="font-weight:600;color:var(--ies-navy);">—</div>
                    </div>
                    <div>
                        <div style="color:var(--ies-gray-500);font-weight:500;margin-bottom:2px;">Total Cost</div>
                        <div id="card-cost-${esc(deal.id)}" style="font-weight:600;color:var(--ies-orange);">—</div>
                    </div>
                </div>
                </div>
                <div class="dt-landing-card-actions">
                <button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario('deal_deals','${esc(deal.id)}','deal')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>
                <button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario('deal_deals','${esc(deal.id)}','deal')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>
                </div>
            `;
            listView.appendChild(card);
        });

        // Load site counts and costs for each deal
        this.deals.forEach(deal => this.updateDealCardMetrics(deal.id));

        listView.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        if (detailView) detailView.style.display = 'none';
    },

    async updateDealCardMetrics(dealId) {
        try {
            const sites = await cmFetchTable('cost_model_projects', `deal_deals_id=eq.${dealId}`);
            const siteCount = sites.length;
            let totalCost = 0;

            sites.forEach(site => {
                if (site.metadata && site.metadata.projections && site.metadata.projections.length > 0) {
                    const y1 = site.metadata.projections[0];
                    totalCost += (parseFloat(y1.totalCost) || 0);
                }
            });

            const siteEl = document.getElementById(`card-sites-${dealId}`);
            const costEl = document.getElementById(`card-cost-${dealId}`);
            if (siteEl) siteEl.textContent = siteCount + ' site' + (siteCount !== 1 ? 's' : '');
            if (costEl) costEl.textContent = this.fmt.currency(totalCost);
        } catch (error) {
            console.warn('Error updating deal card metrics:', error);
        }
    },

    async openDeal(dealId) {
        try {
            // Fetch deal details
            const deals = await cmFetchTable('deal_deals', `id=eq.${dealId}`);
            if (deals.length === 0) return;

            this.currentDeal = deals[0];

            // Fetch linked sites
            const sites = await cmFetchTable('cost_model_projects', `deal_deals_id=eq.${dealId}`);
            this.currentDeal.sites = sites;

            this.renderDealDetail();
        } catch (error) {
            console.error('Error opening deal:', error);
            alert('Error loading deal details');
        }
    },

    renderDealDetail() {
        const deal = this.currentDeal;
        document.getElementById('deal-landing').style.display = 'none';
        document.getElementById('dealDetailView').style.display = 'block';

        // Populate header form
        document.getElementById('dealEditName').value = deal.deal_name || '';
        document.getElementById('dealEditClient').value = deal.client_name || '';
        document.getElementById('dealEditOwner').value = deal.deal_owner || '';
        document.getElementById('dealEditStatus').value = deal.status || 'Draft';
        document.getElementById('dealEditCloseDate').value = deal.target_close_date || '';
        document.getElementById('dealEditNotes').value = deal.notes || '';
        document.getElementById('dealValidationErrors').innerHTML = '';

        // Populate client datalist
        this.populateClientDatalist();

        // Load summary data and show Summary tab by default
        this.switchTab('summary', document.querySelector('#dealDetailTabs .dt-tab'));

        // Also fetch detailed data for financials/pricing (child tables)
        this.loadDealChildData();
    },

    switchTab(tabName, tabEl) {
        // Hide all tab panels
        document.querySelectorAll('.deal-tab-panel').forEach(p => p.style.display = 'none');
        // Show selected
        var panel = document.getElementById('dealTab-' + tabName);
        if (panel) panel.style.display = 'block';
        // Sync tab buttons
        document.querySelectorAll('#dealDetailTabs .dt-tab').forEach(t => t.classList.remove('active'));
        if (tabEl) tabEl.classList.add('active');
        // Render tab content on demand
        if (tabName === 'summary') this.renderSummaryTab();
        if (tabName === 'pipeline') this.renderPipelineTab();
        if (tabName === 'sites') this.renderSitesTable();
        if (tabName === 'financials') this.renderFinancialsTab();
        if (tabName === 'pricing') this.renderPricingTab();
    },

    async populateClientDatalist() {
        try {
            var deals = await cmFetchTable('deal_deals', 'order=client_name.asc');
            var dl = document.getElementById('dealClientDatalist');
            if (!dl) return;
            dl.innerHTML = '';
            var seen = {};
            deals.forEach(function(d) {
                if (d.client_name && !seen[d.client_name]) {
                    seen[d.client_name] = true;
                    dl.innerHTML += '<option value="' + d.client_name.replace(/"/g, '&quot;') + '">';
                }
            });
        } catch(e) { console.error('Error:', e); }
    },

    async loadDealChildData() {
        // No child tables to fetch — all data is on cost_model_projects rows
        // Pre-compute deal-level aggregates from site data
        this.dealAggregates = { totalCost: 0, totalSqft: 0, totalStartup: 0, totalMargin: 0, marginCount: 0, sites: [] };
        var sites = this.currentDeal.sites || [];
        var self = this;
        sites.forEach(function(s) {
            var cost = parseFloat(s.total_annual_cost) || 0;
            var sqft = parseFloat(s.facility_sqft) || 0;
            var startup = parseFloat(s.startup_cost) || 0;
            var margin = parseFloat(s.target_margin_pct) || 0;
            self.dealAggregates.totalCost += cost;
            self.dealAggregates.totalSqft += sqft;
            self.dealAggregates.totalStartup += startup;
            if (margin > 0) { self.dealAggregates.totalMargin += margin; self.dealAggregates.marginCount++; }

            // Parse pricing buckets
            var buckets = [];
            try { buckets = typeof s.pricing_buckets === 'string' ? JSON.parse(s.pricing_buckets) : (s.pricing_buckets || []); } catch(e) { console.error('Error:', e); }

            self.dealAggregates.sites.push({
                id: s.id,
                name: s.name || 'Untitled',
                cost: cost,
                sqft: sqft,
                startup: startup,
                margin: margin,
                contractYears: parseInt(s.contract_term_years) || 3,
                pricingModel: s.pricing_model || 'all-in',
                environment: s.environment_type || '—',
                volumeGrowth: parseFloat(s.annual_volume_growth_pct) || 0,
                orders: parseFloat(s.vol_orders_packed) || 0,
                palletsReceived: parseFloat(s.vol_pallets_received) || 0,
                palletsShipped: parseFloat(s.vol_pallets_shipped) || 0,
                eachesPicked: parseFloat(s.vol_eaches_picked) || 0,
                casesPicked: parseFloat(s.vol_cases_picked) || 0,
                vasUnits: parseFloat(s.vol_vas_units) || 0,
                buckets: buckets
            });
        });
        this.dealAggregates.avgMargin = this.dealAggregates.marginCount > 0
            ? this.dealAggregates.totalMargin / this.dealAggregates.marginCount : 0;
    },

    async renderSummaryTab() {
        if (!this.dealAggregates) await this.loadDealChildData();
        var agg = this.dealAggregates;
        var sites = agg.sites;
        var self = this;

        var revenueNeeded = agg.avgMargin > 0 ? agg.totalCost / (1 - agg.avgMargin / 100) : agg.totalCost;
        var avgContractYears = sites.length > 0 ? (sites.reduce(function(s,x){ return s + x.contractYears; }, 0) / sites.length).toFixed(1) : '—';
        var costPerSqft = agg.totalSqft > 0 ? agg.totalCost / agg.totalSqft : 0;

        // KPI Cards
        var metricsEl = document.getElementById('dealSummaryMetrics');

        // Check if close date is overdue
        var closeDate = self.currentDeal.target_close_date;
        var closeDateDisplay = '—';
        var closeDateColor = 'var(--ies-gray-400)';
        var overdueHtml = '';
        if (closeDate) {
            var closeDay = new Date(closeDate);
            var today = new Date();
            var isOverdue = closeDay < today && self.currentDeal.status !== 'Won' && self.currentDeal.status !== 'Lost';
            closeDateDisplay = closeDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            closeDateColor = isOverdue ? 'var(--ies-orange)' : 'var(--ies-blue)';
            if (isOverdue) {
                overdueHtml = '<span style="background:rgba(251,146,60,0.15);color:rgb(251,146,60);padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;margin-left:8px;display:inline-block;">OVERDUE</span>';
            }
        }

        var kpis = [
            { label: 'Total Annual Cost', value: self.fmt.currency(agg.totalCost), color: 'var(--ies-orange)' },
            { label: 'Sites', value: sites.length, color: 'var(--ies-blue)' },
            { label: 'Total Square Footage', value: self.fmt.num(agg.totalSqft, 0) + ' SF', color: 'var(--ies-blue)' },
            { label: 'Avg Target Margin', value: self.fmt.percent(agg.avgMargin), color: 'var(--ies-green)' },
            { label: 'Est. Revenue Needed', value: self.fmt.currency(revenueNeeded), color: 'var(--ies-green)' },
            { label: 'Startup Investment', value: self.fmt.currency(agg.totalStartup), color: 'var(--ies-orange)' },
            { label: 'Avg Contract Term', value: avgContractYears + ' yrs', color: 'var(--ies-navy)' },
            { label: 'Cost / Sqft', value: costPerSqft > 0 ? self.fmt.currency(costPerSqft) : '—', color: 'var(--ies-navy)' },
            { label: 'Target Close Date', value: closeDateDisplay + overdueHtml, color: closeDateColor }
        ];
        metricsEl.innerHTML = kpis.map(function(k) {
            return '<div style="background:#fff;border-radius:10px;border:1px solid var(--ies-gray-200);padding:16px 20px;border-left:4px solid ' + k.color + ';">' +
                '<div style="font-size:11px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;margin-bottom:6px;">' + k.label + '</div>' +
                '<div style="font-size:20px;font-weight:700;color:var(--ies-navy);">' + k.value + '</div></div>';
        }).join('');

        // Cost by site bar chart
        var breakdownEl = document.getElementById('dealSummaryCostBreakdown');
        var maxCost = Math.max.apply(null, sites.map(function(s){ return s.cost; })) || 1;
        if (sites.length === 0) {
            breakdownEl.innerHTML = '<div style="color:var(--ies-gray-500);font-size:13px;">No sites to display.</div>';
        } else {
            var colors = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
            breakdownEl.innerHTML = sites.map(function(s, i) {
                var pct = (s.cost / maxCost * 100).toFixed(0);
                var c = colors[i % colors.length];
                return '<div style="margin-bottom:14px;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--ies-gray-700);margin-bottom:4px;"><span>' + s.name + '</span><span>' + self.fmt.currency(s.cost) + '</span></div>' +
                    '<div style="background:var(--ies-gray-100);border-radius:6px;height:10px;overflow:hidden;"><div style="background:' + c + ';height:100%;width:' + pct + '%;border-radius:6px;transition:width 0.4s;"></div></div></div>';
            }).join('');
        }

        // Site comparison table
        var compEl = document.getElementById('dealSummarySiteComparison');
        if (sites.length === 0) {
            compEl.innerHTML = '<div style="color:var(--ies-gray-500);font-size:13px;">No sites to compare.</div>';
        } else {
            var html = '<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="border-bottom:2px solid var(--ies-gray-200);background:var(--ies-gray-50);">' +
                '<th style="padding:10px;text-align:left;">Site</th><th style="padding:10px;text-align:left;">Env.</th><th style="padding:10px;text-align:right;">Annual Cost</th><th style="padding:10px;text-align:right;">Sqft</th><th style="padding:10px;text-align:right;">$/Sqft</th><th style="padding:10px;text-align:right;">Margin</th><th style="padding:10px;text-align:left;">Pricing</th></tr></thead><tbody>';
            sites.forEach(function(s) {
                var perSqft = s.sqft > 0 ? s.cost / s.sqft : 0;
                html += '<tr style="border-bottom:1px solid var(--ies-gray-100);">' +
                    '<td style="padding:10px;font-weight:600;">' + s.name + '</td>' +
                    '<td style="padding:10px;">' + s.environment + '</td>' +
                    '<td style="padding:10px;text-align:right;">' + self.fmt.currency(s.cost) + '</td>' +
                    '<td style="padding:10px;text-align:right;">' + self.fmt.num(s.sqft, 0) + '</td>' +
                    '<td style="padding:10px;text-align:right;">' + self.fmt.currency(perSqft) + '</td>' +
                    '<td style="padding:10px;text-align:right;">' + (s.margin > 0 ? s.margin + '%' : '—') + '</td>' +
                    '<td style="padding:10px;">' + s.pricingModel + '</td></tr>';
            });
            // Totals row
            html += '<tr style="border-top:2px solid var(--ies-gray-300);font-weight:700;background:var(--ies-gray-50);">' +
                '<td style="padding:10px;">TOTAL</td><td></td>' +
                '<td style="padding:10px;text-align:right;">' + self.fmt.currency(agg.totalCost) + '</td>' +
                '<td style="padding:10px;text-align:right;">' + self.fmt.num(agg.totalSqft, 0) + '</td>' +
                '<td style="padding:10px;text-align:right;">' + (agg.totalSqft > 0 ? self.fmt.currency(agg.totalCost / agg.totalSqft) : '—') + '</td>' +
                '<td style="padding:10px;text-align:right;">' + self.fmt.percent(agg.avgMargin) + '</td><td></td></tr>';
            html += '</tbody></table>';
            compEl.innerHTML = html;
        }
    },

    renderSitesTable() {
        const tbody = document.getElementById('dealSitesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!this.currentDeal.sites || this.currentDeal.sites.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--ies-gray-500);">No sites linked to this deal. Add one to get started.</td></tr>';
            return;
        }

        var self = this;
        this.currentDeal.sites.forEach(function(site) {
            var market = '—';
            if (site.market_id && cmApp.refData) {
                market = cmApp.getMarketDisplayName(site.market_id);
                if (market === 'N/A') market = '—';
            }
            var row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--ies-gray-100)';
            row.innerHTML =
                '<td style="padding:12px;"><strong>' + esc(site.name || '(Untitled)') + '</strong></td>' +
                '<td style="padding:12px;">' + market + '</td>' +
                '<td style="padding:12px;">' + esc(site.environment_type || '—') + '</td>' +
                '<td style="padding:12px;text-align:right;">' + self.fmt.num(parseFloat(site.facility_sqft) || 0, 0) + '</td>' +
                '<td style="padding:12px;text-align:right;">' + self.fmt.currency(parseFloat(site.total_annual_cost) || 0) + '</td>' +
                '<td style="padding:12px;text-align:right;">' + (site.target_margin_pct ? site.target_margin_pct + '%' : '—') + '</td>' +
                '<td style="padding:12px;text-align:center;">' +
                '<button onclick="cmApp.openProject(' + site.id + '); navigate(\'costmodel\', document.querySelector(\'[data-section=costmodel]\'));" style="padding:4px 10px;background:var(--ies-blue);color:#fff;border:none;border-radius:4px;font-size:11px;cursor:pointer;margin-right:4px;font-weight:600;">Edit</button>' +
                '<button onclick="dealApp.unlinkSite(' + site.id + ')" style="padding:4px 10px;background:#dc3545;color:#fff;border:none;border-radius:4px;font-size:11px;cursor:pointer;font-weight:600;">Unlink</button></td>';
            tbody.appendChild(row);
        });
    },

    async renderFinancialsTab() {
        if (!this.dealAggregates) await this.loadDealChildData();
        var agg = this.dealAggregates;
        var sites = agg.sites;
        var self = this;

        // Determine max contract years across all sites
        var maxYears = Math.max.apply(null, sites.map(function(s){ return s.contractYears; }).concat([3]));
        var laborEsc = cmApp.getLaborEscalationPct(); // Read from input instead of hardcoded

        // Build multi-year projections for the deal
        var projections = [];
        for (var yr = 1; yr <= maxYears; yr++) {
            var p = { year: yr, totalCost: 0, revenue: 0, grossProfit: 0, ebitda: 0, ebit: 0, taxes: 0, netIncome: 0, startup: 0, orders: 0 };
            sites.forEach(function(s) {
                if (yr > s.contractYears) return; // site's contract ended
                var volMult = Math.pow(1 + (s.volumeGrowth / 100), yr - 1);
                var costMult = Math.pow(1 + laborEsc, yr - 1);
                var siteCost = s.cost * costMult * (yr === 1 ? 1 : (1 + (s.volumeGrowth / 100 * 0.3)));
                var siteStartup = yr === 1 ? (s.startup / s.contractYears) : (s.startup / s.contractYears);
                var siteMargin = s.margin / 100;
                var siteRevenue = (siteCost + siteStartup) * (1 + siteMargin);
                p.totalCost += siteCost + siteStartup;
                p.revenue += siteRevenue;
                p.startup += siteStartup;
                p.orders += s.orders * volMult;
            });
            p.grossProfit = p.revenue - p.totalCost;
            p.ebitda = p.grossProfit + p.startup; // add back amortization
            p.ebit = p.grossProfit;
            p.taxes = Math.max(0, p.ebit * 0.25);
            p.netIncome = p.ebit - p.taxes;
            projections.push(p);
        }

        // Financial Metric Cards (with threshold coloring)
        var totalRevenue = projections.reduce(function(s,p){ return s + p.revenue; }, 0);
        var totalCostAll = projections.reduce(function(s,p){ return s + p.totalCost; }, 0);
        var totalGrossProfit = totalRevenue - totalCostAll;
        var totalEbitda = projections.reduce(function(s,p){ return s + p.ebitda; }, 0);
        var avgGrossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue * 100) : 0;
        var avgEbitdaMargin = totalRevenue > 0 ? (totalEbitda / totalRevenue * 100) : 0;
        var totalNetIncome = projections.reduce(function(s,p){ return s + p.netIncome; }, 0);
        var contractValue = totalRevenue;

        // NPV calculation
        var discountRate = 0.10;
        var npv = -agg.totalStartup;
        projections.forEach(function(p, i) { npv += p.grossProfit / Math.pow(1 + discountRate, i + 1); });

        // Payback period
        var paybackMonths = maxYears * 12;
        var cumCash = -agg.totalStartup;
        for (var pyr = 0; pyr < projections.length; pyr++) {
            var monthlyProfit = projections[pyr].grossProfit / 12;
            for (var pm = 0; pm < 12; pm++) {
                cumCash += monthlyProfit;
                if (cumCash >= 0) { paybackMonths = pyr * 12 + pm + 1; pyr = projections.length; break; }
            }
        }

        var mc = function(label, value, fmt, threshold, higherIsBetter, sub) {
            var cls = 'neutral';
            if (threshold !== null && value !== null && !isNaN(value)) {
                cls = higherIsBetter ? (value >= threshold ? 'green' : 'red') : (value <= threshold ? 'green' : 'red');
            }
            return '<div class="cm-fin-metric ' + cls + '">' +
                '<div class="label">' + label + '</div>' +
                '<div class="value">' + fmt + '</div>' +
                (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
        };

        var fmEl = document.getElementById('dealFinancialMetrics');
        fmEl.innerHTML = [
            mc('Total Contract Value', contractValue, self.fmt.currency(contractValue), null, true, maxYears + '-year total revenue'),
            mc('Gross Margin', avgGrossMargin, avgGrossMargin.toFixed(1) + '%', 12, true, 'Target: ≥12%'),
            mc('EBITDA Margin', avgEbitdaMargin, avgEbitdaMargin.toFixed(1) + '%', 8, true, 'Target: ≥8%'),
            mc('Net Income (' + maxYears + 'yr)', totalNetIncome, self.fmt.currency(totalNetIncome), null, true, 'After 25% tax'),
            mc('NPV', npv, self.fmt.currency(npv), 0, true, 'At 10% discount rate'),
            mc('Payback Period', paybackMonths, paybackMonths + ' mo', 24, false, 'Target: ≤24 mo'),
            mc('Total Startup', agg.totalStartup, self.fmt.currency(agg.totalStartup), null, null, 'Across all sites'),
            mc('Avg Orders/Year', sites.length > 0 ? projections[0].orders : 0, self.fmt.num(projections.length > 0 ? projections[0].orders : 0, 0), null, null, 'Year 1 combined')
        ].join('');

        // Multi-Year P&L Table (matches CM Builder format)
        var plEl = document.getElementById('dealMultiYearPL');
        var fmt = function(v) { return '$' + Math.round(v).toLocaleString('en-US'); };
        var fmtPct = function(v) { return (v * 100).toFixed(1) + '%'; };

        var rows = [
            { label: '── INCOME STATEMENT ──', section: true },
            { label: 'Revenue', key: 'revenue', bold: true },
            { label: 'Total Operating Cost', key: 'totalCost' },
            { label: 'Start-Up Amort.', key: 'startup' },
            { label: 'Gross Profit', key: 'grossProfit', bold: true, border: true },
            { label: 'EBITDA', key: 'ebitda' },
            { label: 'EBIT', key: 'ebit' },
            { label: 'Taxes (25%)', key: 'taxes' },
            { label: 'Net Income', key: 'netIncome', bold: true, border: true },
            { label: 'Gross Margin %', key: null, calc: function(p){ return p.revenue > 0 ? p.grossProfit / p.revenue : 0; }, format: 'pct' },
            { label: 'EBITDA Margin %', key: null, calc: function(p){ return p.revenue > 0 ? p.ebitda / p.revenue : 0; }, format: 'pct' },
            { label: '── KEY METRICS ──', section: true },
            { label: 'Orders', key: 'orders', format: 'int' },
            { label: 'Cost/Order', key: null, calc: function(p){ return p.orders > 0 ? p.totalCost / p.orders : 0; }, format: 'dollar2' },
            { label: 'Revenue/Order', key: null, calc: function(p){ return p.orders > 0 ? p.revenue / p.orders : 0; }, format: 'dollar2' },
            { label: 'Profit/Order', key: null, calc: function(p){ return p.orders > 0 ? p.grossProfit / p.orders : 0; }, format: 'dollar2' }
        ];

        var colCount = projections.length + 2;
        var plHtml = '<table class="cm-table" style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="min-width:160px;padding:10px;text-align:left;">Line Item</th>' +
            projections.map(function(p){ return '<th style="text-align:right;padding:10px;">Year ' + p.year + '</th>'; }).join('') +
            '<th style="text-align:right;padding:10px;font-weight:700;">Total</th></tr></thead><tbody>';

        rows.forEach(function(r) {
            if (r.section) {
                plHtml += '<tr><td colspan="' + colCount + '" style="font-size:11px;font-weight:700;color:var(--ies-blue);padding-top:14px;letter-spacing:0.5px;">' + r.label + '</td></tr>';
                return;
            }
            var style = (r.bold ? 'font-weight:600;' : '') + (r.border ? 'border-top:2px solid var(--ies-gray-200);' : '');
            var vals = projections.map(function(p) {
                var v = r.calc ? r.calc(p) : p[r.key];
                if (r.format === 'int') return Math.round(v).toLocaleString('en-US');
                if (r.format === 'dollar2') return '$' + (v || 0).toFixed(2);
                if (r.format === 'pct') return fmtPct(v);
                return fmt(v);
            });

            var total;
            if (r.format === 'pct') {
                total = fmtPct(projections.reduce(function(s,p){ return s + (r.calc(p) || 0); }, 0) / projections.length);
            } else if (r.format === 'dollar2') {
                total = '$' + (projections.reduce(function(s,p){ return s + (r.calc ? r.calc(p) : 0); }, 0) / projections.length).toFixed(2);
            } else if (r.format === 'int') {
                total = Math.round(projections.reduce(function(s,p){ return s + p[r.key]; }, 0)).toLocaleString('en-US');
            } else if (r.calc) {
                total = '';
            } else {
                total = fmt(projections.reduce(function(s,p){ return s + p[r.key]; }, 0));
            }

            plHtml += '<tr style="' + style + '"><td style="padding:10px;">' + r.label + '</td>' +
                vals.map(function(v){ return '<td style="text-align:right;padding:10px;">' + v + '</td>'; }).join('') +
                '<td style="text-align:right;padding:10px;font-weight:600;">' + total + '</td></tr>';
        });
        plHtml += '</tbody></table>';
        plEl.innerHTML = plHtml;

        // Site Cost Comparison Table
        var scEl = document.getElementById('dealSiteCostTable');
        var scHtml = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="border-bottom:2px solid var(--ies-gray-200);background:var(--ies-gray-50);">' +
            '<th style="padding:12px;text-align:left;">Site</th>' +
            '<th style="padding:12px;text-align:right;">Annual Cost</th>' +
            '<th style="padding:12px;text-align:right;">% of Total</th>' +
            '<th style="padding:12px;text-align:right;">Revenue (w/ Margin)</th>' +
            '<th style="padding:12px;text-align:right;">Gross Profit</th>' +
            '<th style="padding:12px;text-align:right;">Margin %</th>' +
            '<th style="padding:12px;text-align:right;">Startup</th>' +
            '</tr></thead><tbody>';
        sites.forEach(function(s) {
            var rev = s.margin > 0 ? s.cost / (1 - s.margin / 100) : s.cost;
            var gp = rev - s.cost;
            var pctTotal = agg.totalCost > 0 ? (s.cost / agg.totalCost * 100) : 0;
            scHtml += '<tr style="border-bottom:1px solid var(--ies-gray-100);">' +
                '<td style="padding:12px;font-weight:600;">' + s.name + '</td>' +
                '<td style="padding:12px;text-align:right;">' + self.fmt.currency(s.cost) + '</td>' +
                '<td style="padding:12px;text-align:right;">' + pctTotal.toFixed(1) + '%</td>' +
                '<td style="padding:12px;text-align:right;">' + self.fmt.currency(rev) + '</td>' +
                '<td style="padding:12px;text-align:right;color:' + (gp >= 0 ? '#10b981' : '#ef4444') + ';">' + self.fmt.currency(gp) + '</td>' +
                '<td style="padding:12px;text-align:right;">' + (s.margin > 0 ? s.margin + '%' : '—') + '</td>' +
                '<td style="padding:12px;text-align:right;">' + self.fmt.currency(s.startup) + '</td></tr>';
        });
        // Totals row
        var totalRev = agg.avgMargin > 0 ? agg.totalCost / (1 - agg.avgMargin / 100) : agg.totalCost;
        scHtml += '<tr style="border-top:2px solid var(--ies-gray-300);font-weight:700;background:var(--ies-gray-50);">' +
            '<td style="padding:12px;">TOTAL</td>' +
            '<td style="padding:12px;text-align:right;">' + self.fmt.currency(agg.totalCost) + '</td>' +
            '<td style="padding:12px;text-align:right;">100%</td>' +
            '<td style="padding:12px;text-align:right;">' + self.fmt.currency(totalRev) + '</td>' +
            '<td style="padding:12px;text-align:right;color:#10b981;">' + self.fmt.currency(totalRev - agg.totalCost) + '</td>' +
            '<td style="padding:12px;text-align:right;">' + self.fmt.percent(agg.avgMargin) + '</td>' +
            '<td style="padding:12px;text-align:right;">' + self.fmt.currency(agg.totalStartup) + '</td></tr>';
        scHtml += '</tbody></table>';
        scEl.innerHTML = scHtml;

        // Unit Economics table
        var ueEl = document.getElementById('dealUnitEconomics');
        var yr1 = projections[0] || { totalCost: 0, revenue: 0, orders: 0, grossProfit: 0 };
        var totalOrders = yr1.orders;
        var totalPallets = sites.reduce(function(s,x){ return s + x.palletsShipped; }, 0);
        var totalEaches = sites.reduce(function(s,x){ return s + x.eachesPicked; }, 0);
        var totalCases = sites.reduce(function(s,x){ return s + x.casesPicked; }, 0);

        var ueRows = [
            { label: 'Cost per Order', value: totalOrders > 0 ? self.fmt.currency(agg.totalCost / totalOrders) : '—', cls: 'cm-text-orange' },
            { label: 'Revenue per Order', value: totalOrders > 0 ? self.fmt.currency(totalRev / totalOrders) : '—', cls: 'cm-text-success' },
            { label: 'Profit per Order', value: totalOrders > 0 ? self.fmt.currency((totalRev - agg.totalCost) / totalOrders) : '—', cls: 'cm-text-success' },
            { label: 'Cost per Pallet Shipped', value: totalPallets > 0 ? self.fmt.currency(agg.totalCost / totalPallets) : '—', cls: 'cm-text-orange' },
            { label: 'Cost per Each Picked', value: totalEaches > 0 ? '$' + (agg.totalCost / totalEaches).toFixed(4) : '—', cls: 'cm-text-orange' },
            { label: 'Cost per Case Picked', value: totalCases > 0 ? self.fmt.currency(agg.totalCost / totalCases) : '—', cls: 'cm-text-orange' },
            { label: 'Cost per Sq Ft', value: agg.totalSqft > 0 ? self.fmt.currency(agg.totalCost / agg.totalSqft) : '—', cls: 'cm-text-orange' },
            { label: 'Monthly Management Fee (est.)', value: self.fmt.currency(agg.totalCost / 12), cls: 'cm-text-orange' }
        ];
        ueEl.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;max-width:500px;"><tbody>' +
            ueRows.map(function(r) {
                return '<tr style="border-bottom:1px solid var(--ies-gray-100);"><td style="padding:12px;">' + r.label + '</td>' +
                    '<td style="padding:12px;text-align:right;font-weight:600;" class="' + r.cls + '">' + r.value + '</td></tr>';
            }).join('') + '</tbody></table>';
    },

    async renderPricingTab() {
        if (!this.dealAggregates) await this.loadDealChildData();
        var agg = this.dealAggregates;
        var sites = agg.sites;
        var self = this;

        // === Per-Site Pricing Schedule ===
        var tEl = document.getElementById('dealPricingTable');

        if (sites.length === 0 || sites.every(function(s){ return !s.buckets || s.buckets.length === 0; })) {
            tEl.innerHTML = '<div style="color:var(--ies-gray-500);font-size:13px;padding:8px;">No pricing data available. Configure pricing buckets in each site\'s Cost Model.</div>';
        } else {
            // Render one pricing table per site
            var allHtml = '';
            sites.forEach(function(s) {
                if (!s.buckets || s.buckets.length === 0) return;
                var margin = s.margin / 100;
                allHtml += '<div style="margin-bottom:24px;"><div style="font-weight:600;font-size:13px;color:var(--ies-navy);margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid var(--ies-gray-200);">' + s.name + ' <span style="font-weight:400;color:var(--ies-gray-500);font-size:12px;">(' + s.pricingModel + ')</span></div>';
                allHtml += '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:var(--ies-gray-50);border-bottom:1px solid var(--ies-gray-200);">' +
                    '<th style="padding:10px;text-align:left;">Bucket</th>' +
                    '<th style="padding:10px;text-align:right;">Type</th>' +
                    '<th style="padding:10px;text-align:right;">UOM</th>' +
                    '<th style="padding:10px;text-align:right;">Rate / Fee</th>' +
                    '<th style="padding:10px;text-align:right;">With Margin (' + s.margin + '%)</th>' +
                    '</tr></thead><tbody>';
                s.buckets.forEach(function(b) {
                    var rateDisplay = '—';
                    var rateWithMargin = '—';
                    if (b.type === 'fixed') {
                        rateDisplay = 'Monthly Fee';
                        rateWithMargin = 'Monthly Fee';
                    } else {
                        rateDisplay = 'per ' + (b.uom || 'unit');
                        rateWithMargin = 'per ' + (b.uom || 'unit');
                    }
                    allHtml += '<tr style="border-bottom:1px solid var(--ies-gray-100);">' +
                        '<td style="padding:10px;font-weight:500;">' + (b.name || '—') + '</td>' +
                        '<td style="padding:10px;text-align:right;"><span style="padding:2px 8px;background:' + (b.type === 'fixed' ? '#dbeafe' : '#dcfce7') + ';color:' + (b.type === 'fixed' ? '#1e40af' : '#166534') + ';border-radius:4px;font-size:11px;font-weight:600;">' + (b.type || '—') + '</span></td>' +
                        '<td style="padding:10px;text-align:right;">' + (b.uom || '—') + '</td>' +
                        '<td style="padding:10px;text-align:right;">—</td>' +
                        '<td style="padding:10px;text-align:right;">—</td></tr>';
                });
                allHtml += '</tbody></table></div>';
            });
            tEl.innerHTML = allHtml;
        }

        // === Combined Deal Pricing ===
        var cEl = document.getElementById('dealPricingCombined');
        // Collect all unique bucket names
        var allBucketNames = [];
        var bucketTypeMap = {};
        var bucketUomMap = {};
        sites.forEach(function(s) {
            (s.buckets || []).forEach(function(b) {
                if (b.name && allBucketNames.indexOf(b.name) === -1) {
                    allBucketNames.push(b.name);
                    bucketTypeMap[b.name] = b.type || 'variable';
                    bucketUomMap[b.name] = b.uom || 'unit';
                }
            });
        });

        if (allBucketNames.length === 0) {
            cEl.innerHTML = '<div style="color:var(--ies-gray-500);font-size:13px;">No pricing buckets configured.</div>';
        } else {
            var cHtml = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:var(--ies-gray-50);border-bottom:2px solid var(--ies-gray-200);">' +
                '<th style="padding:12px;text-align:left;">Bucket</th><th style="padding:12px;text-align:right;">Type</th><th style="padding:12px;text-align:right;">UOM</th>';
            sites.forEach(function(s) { cHtml += '<th style="padding:12px;text-align:center;">' + s.name + '</th>'; });
            cHtml += '</tr></thead><tbody>';

            allBucketNames.forEach(function(name) {
                cHtml += '<tr style="border-bottom:1px solid var(--ies-gray-100);">';
                cHtml += '<td style="padding:12px;font-weight:600;">' + name + '</td>';
                cHtml += '<td style="padding:12px;text-align:right;"><span style="padding:2px 8px;background:' + (bucketTypeMap[name] === 'fixed' ? '#dbeafe' : '#dcfce7') + ';color:' + (bucketTypeMap[name] === 'fixed' ? '#1e40af' : '#166534') + ';border-radius:4px;font-size:11px;font-weight:600;">' + bucketTypeMap[name] + '</span></td>';
                cHtml += '<td style="padding:12px;text-align:right;">' + bucketUomMap[name] + '</td>';
                sites.forEach(function(s) {
                    var found = (s.buckets || []).some(function(b){ return b.name === name; });
                    cHtml += '<td style="padding:12px;text-align:center;">' + (found ? '<span style="color:#10b981;font-weight:600;">✓</span>' : '<span style="color:var(--ies-gray-300);">—</span>') + '</td>';
                });
                cHtml += '</tr>';
            });
            cHtml += '</tbody></table>';
            cEl.innerHTML = cHtml;
        }

        // === Deal-Level Summary Cards ===
        var sEl = document.getElementById('dealPricingSummary');
        var totalCost = agg.totalCost;
        var revenue = agg.avgMargin > 0 ? totalCost / (1 - agg.avgMargin / 100) : totalCost;
        var marginAmt = revenue - totalCost;
        var monthlyRevenue = revenue / 12;

        sEl.innerHTML =
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">' +
            '<div style="background:var(--ies-gray-50);border-radius:8px;padding:16px;border-left:4px solid var(--ies-orange);">' +
            '<div style="font-size:11px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;margin-bottom:4px;">Total Annual Cost</div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--ies-navy);">' + self.fmt.currency(totalCost) + '</div></div>' +
            '<div style="background:var(--ies-gray-50);border-radius:8px;padding:16px;border-left:4px solid var(--ies-green);">' +
            '<div style="font-size:11px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;margin-bottom:4px;">Target Annual Revenue</div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--ies-navy);">' + self.fmt.currency(revenue) + '</div></div>' +
            '<div style="background:var(--ies-gray-50);border-radius:8px;padding:16px;border-left:4px solid var(--ies-green);">' +
            '<div style="font-size:11px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;margin-bottom:4px;">Target Margin (' + agg.avgMargin.toFixed(1) + '%)</div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--ies-navy);">' + self.fmt.currency(marginAmt) + '</div></div>' +
            '<div style="background:var(--ies-gray-50);border-radius:8px;padding:16px;border-left:4px solid var(--ies-blue);">' +
            '<div style="font-size:11px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;margin-bottom:4px;">Monthly Revenue</div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--ies-navy);">' + self.fmt.currency(monthlyRevenue) + '</div></div></div>';
    },

    validateDealHeader() {
        const errors = [];
        const dealName = document.getElementById('dealEditName').value.trim();

        if (!dealName) {
            errors.push('Deal name is required');
        } else if (dealName.length < 3) {
            errors.push('Deal name must be at least 3 characters');
        }

        const errDiv = document.getElementById('dealValidationErrors');
        if (errors.length > 0) {
            errDiv.innerHTML = errors.map(e => '<div style="color:#dc3545;font-size:12px;margin-bottom:6px;">• ' + e + '</div>').join('');
            return false;
        }
        errDiv.innerHTML = '';
        return true;
    },

    async saveDealHeader() {
        try {
            // Validate inputs
            if (!this.validateDealHeader()) return;

            const updates = {
                deal_name: document.getElementById('dealEditName').value.trim(),
                client_name: document.getElementById('dealEditClient').value.trim() || null,
                deal_owner: document.getElementById('dealEditOwner').value.trim() || null,
                status: document.getElementById('dealEditStatus').value,
                target_close_date: document.getElementById('dealEditCloseDate').value || null,
                notes: document.getElementById('dealEditNotes').value.trim() || null,
                updated_at: new Date().toISOString()
            };

            await cmApiPatch('deal_deals', this.currentDeal.id, updates);

            // Update in memory
            Object.assign(this.currentDeal, updates);

            alert('Deal details saved successfully');
        } catch (error) {
            console.error('Error saving deal:', error);
            alert('Error saving deal details');
        }
    },

    async cloneDeal() {
        if (!confirm('Clone this deal? A new deal will be created with "Copy of" prepended to the name and close date reset to 90 days from today.')) return;

        try {
            const today = new Date();
            const closeDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
            const closeDateStr = closeDate.toISOString().split('T')[0];

            const newDealData = {
                deal_name: 'Copy of ' + (this.currentDeal.deal_name || 'Untitled'),
                client_name: this.currentDeal.client_name || null,
                deal_owner: this.currentDeal.deal_owner || null,
                status: 'Draft',
                target_close_date: closeDateStr,
                notes: this.currentDeal.notes || null,
                created_at: new Date().toISOString()
            };

            const result = await cmApiPost('deal_deals', newDealData);
            const clonedDeal = result[0];

            alert('Deal cloned successfully');

            // Navigate to the new deal's detail view
            this.currentDeal = clonedDeal;
            this.currentDeal.sites = [];
            this.renderDealDetail();
        } catch (error) {
            console.error('Error cloning deal:', error);
            alert('Error cloning deal');
        }
    },

    async unlinkSite(siteId) {
        if (!confirm('Remove this site from the deal?')) return;

        try {
            await cmApiPatch('cost_model_projects', siteId, { deal_deals_id: null });

            // Remove from sites array and re-render
            this.currentDeal.sites = this.currentDeal.sites.filter(s => s.id !== siteId);
            this.renderSitesTable();
            this.renderSummaryTab();
        } catch (error) {
            console.error('Error unlinking site:', error);
            alert('Error unlinking site');
        }
    },

    showNewDealModal() {
        const name = prompt('Enter deal name:');
        if (!name) return;

        const client = prompt('Enter client name:');
        const owner = prompt('Enter deal owner (optional):');

        this.createNewDeal(name, client, owner);
    },

    async createNewDeal(dealName, clientName, dealOwner) {
        try {
            // Calculate close date as 90 days from today
            const today = new Date();
            const closeDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
            const closeDateStr = closeDate.toISOString().split('T')[0];

            const newDeal = {
                deal_name: dealName,
                client_name: clientName || null,
                deal_owner: dealOwner || null,
                status: 'Draft',
                target_close_date: closeDateStr,
                notes: null
            };

            const result = await cmApiPost('deal_deals', newDeal);
            this.currentDeal = result[0];
            this.currentDeal.sites = [];
            this.renderDealDetail();
        } catch (error) {
            console.error('Error creating deal:', error);
            alert('Error creating deal');
        }
    },

    showAddSiteModal() {
        const siteName = prompt('Enter site name:');
        if (!siteName) return;

        this.createNewSiteInDeal(siteName);
    },

    async createNewSiteInDeal(siteName) {
        try {
            const newSite = {
                name: siteName,
                deal_deals_id: this.currentDeal.id,
                created_at: new Date().toISOString()
            };

            const result = await cmApiPost('cost_model_projects', newSite);
            const newProject = result[0];

            // Add to current deal
            this.currentDeal.sites.push(newProject);
            this.renderSitesTable();
            this.renderSummaryTab();

            // Open the new site in cost model
            cmApp.openProject(newProject.id);
        } catch (error) {
            console.error('Error creating site:', error);
            alert('Error creating site');
        }
    },

    showLinkExistingModal() {
        this.loadUnlinkedProjects();
    },

    async loadUnlinkedProjects() {
        try {
            const allProjects = await cmFetchTable('cost_model_projects', 'limit=100');
            const unlinked = allProjects.filter(p => !p.deal_deals_id);

            if (unlinked.length === 0) {
                alert('No unlinked cost model projects available. Create one first.');
                return;
            }

            const options = unlinked.map(p => `${p.name || '(Untitled)'} (ID: ${p.id.substring(0, 8)})`).join('\n');
            const selectedText = prompt('Select a project to link:\n\n' + options);

            if (selectedText) {
                const projectId = selectedText.match(/\(ID: ([a-f0-9]+)\)/)?.[1];
                if (projectId) {
                    this.linkProjectToDeal(projectId);
                }
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            alert('Error loading projects');
        }
    },

    async linkProjectToDeal(projectId) {
        try {
            await cmApiPatch('cost_model_projects', projectId, { deal_deals_id: this.currentDeal.id });

            // Reload deal
            await this.openDeal(this.currentDeal.id);
            alert('Site linked successfully');
        } catch (error) {
            console.error('Error linking project:', error);
            alert('Error linking site');
        }
    },

    // ═══════════ DOS PIPELINE TAB ═══════════
    dosStages: [],
    dosElements: [],

    async renderPipelineTab() {
        if (!this.currentDeal) return;
        var self = this;

        // Load stages (cache after first fetch)
        if (this.dosStages.length === 0) {
            try {
                this.dosStages = await cmFetchTable('stages', 'order=stage_number.asc');
            } catch(e) { console.error('Error loading DOS stages:', e); return; }
        }

        var deal = this.currentDeal;
        var currentStageId = deal.current_stage_id || null;
        var dosProjectId = deal.dos_project_id || null;

        // Load project elements if we have a DOS project
        this.dosElements = [];
        if (dosProjectId) {
            try {
                this.dosElements = await cmFetchTable('project_elements', 'project_id=eq.' + dosProjectId + '&order=stage_number.asc,sort_order.asc');
            } catch(e) { console.error('Error loading DOS elements:', e); }
        }

        // Determine current stage info
        var currentStage = currentStageId ? this.dosStages.find(function(s){ return s.id === currentStageId; }) : null;
        var currentStageNum = currentStage ? currentStage.stage_number : 0;

        // Render stage stepper
        this.renderStageStepper(currentStageNum);

        // Render current stage activities
        this.renderStageActivities(currentStage, currentStageNum);

        // Render completed stage history
        this.renderStageHistory(currentStageNum);
    },

    renderStageStepper(currentStageNum) {
        var el = document.getElementById('dosStageStepper');
        if (!el) return;
        var self = this;

        el.innerHTML = this.dosStages.map(function(stage, i) {
            var num = stage.stage_number;
            var isActive = num === currentStageNum;
            var isComplete = num < currentStageNum;
            var isFuture = num > currentStageNum;
            var isFirst = i === 0;

            var bgColor = isComplete ? 'var(--ies-green,#10b981)' : isActive ? 'var(--ies-blue)' : 'var(--ies-gray-200)';
            var textColor = (isComplete || isActive) ? '#fff' : 'var(--ies-gray-500)';
            var nameColor = isActive ? 'var(--ies-navy)' : isComplete ? 'var(--ies-green,#10b981)' : 'var(--ies-gray-400)';
            var nameWeight = isActive ? '700' : '600';

            // Count elements for this stage
            var stageElements = self.dosElements.filter(function(e){ return e.stage_number === num; });
            var completed = stageElements.filter(function(e){ return e.element_status === 'complete'; }).length;
            var total = stageElements.length;

            var connector = isFirst ? '' :
                '<div style="flex:1;height:3px;background:' + (isComplete ? 'var(--ies-green,#10b981)' : isActive ? 'var(--ies-blue)' : 'var(--ies-gray-200)') + ';min-width:20px;margin:0 -4px;align-self:center;"></div>';

            var checkOrNum = isComplete ?
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' :
                num;

            return connector +
                '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;min-width:90px;cursor:' + (isComplete || isActive ? 'pointer' : 'default') + ';" onclick="' + (isComplete || isActive ? 'dealApp.viewStageActivities(' + stage.id + ',' + num + ')' : '') + '">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:' + bgColor + ';color:' + textColor + ';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;font-family:Montserrat,sans-serif;flex-shrink:0;">' + checkOrNum + '</div>' +
                    '<div style="font-size:11px;font-weight:' + nameWeight + ';color:' + nameColor + ';text-align:center;line-height:1.3;max-width:100px;">' + stage.stage_name + '</div>' +
                    (total > 0 ? '<div style="font-size:10px;color:var(--ies-gray-400);font-weight:600;">' + completed + '/' + total + '</div>' : '') +
                '</div>';
        }).join('');
    },

    renderStageActivities(currentStage, currentStageNum) {
        var labelEl = document.getElementById('dosCurrentStageLabel');
        var nameEl = document.getElementById('dosCurrentStageName');
        var activateBtn = document.getElementById('dosActivateBtn');
        var advanceBtn = document.getElementById('dosAdvanceBtn');
        var listEl = document.getElementById('dosActivityList');

        if (!currentStage || currentStageNum === 0) {
            // No stage activated yet
            labelEl.textContent = 'NO STAGE ACTIVE';
            nameEl.textContent = 'Activate Stage 1 to begin the deal process';
            activateBtn.style.display = '';
            activateBtn.textContent = 'Activate Stage 1: Pre-Sales Engagement';
            advanceBtn.style.display = 'none';
            document.getElementById('dosProgressLabel').textContent = '—';
            document.getElementById('dosProgressPct').textContent = '';
            document.getElementById('dosProgressBar').style.width = '0%';
            listEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--ies-gray-400);font-size:13px;">Click "Activate Stage 1" to populate the standard IES activities for this deal.</div>';
            return;
        }

        labelEl.textContent = 'STAGE ' + currentStageNum + ' OF 6';
        nameEl.textContent = currentStage.stage_name;

        // Get elements for current stage
        var stageElements = this.dosElements.filter(function(e){ return e.stage_number === currentStageNum; });
        var completed = stageElements.filter(function(e){ return e.element_status === 'complete'; }).length;
        var total = stageElements.length;
        var pct = total > 0 ? Math.round(completed / total * 100) : 0;

        document.getElementById('dosProgressLabel').textContent = completed + ' / ' + total + ' Complete';
        document.getElementById('dosProgressPct').textContent = pct + '%';
        document.getElementById('dosProgressBar').style.width = pct + '%';

        // Show/hide buttons
        activateBtn.style.display = 'none';
        advanceBtn.style.display = (pct === 100 && currentStageNum < 6) ? '' : 'none';

        // Workstream color map
        var wsColors = {
            'solutions': { bg: 'rgba(37,99,235,.08)', color: 'var(--ies-blue)', label: 'Solutions' },
            'engineering': { bg: 'rgba(139,92,246,.08)', color: '#8b5cf6', label: 'Engineering' },
            'commercial': { bg: 'rgba(251,146,60,.08)', color: '#f59e0b', label: 'Commercial' },
            'commercial_lead': { bg: 'rgba(251,146,60,.08)', color: '#f59e0b', label: 'Commercial Lead' },
            'finance_pricing': { bg: 'rgba(16,185,129,.08)', color: '#10b981', label: 'Finance / Pricing' },
            'legal': { bg: 'rgba(107,114,128,.08)', color: '#6b7280', label: 'Legal' },
            'elt': { bg: 'rgba(239,68,68,.08)', color: '#ef4444', label: 'ELT' },
            'operations': { bg: 'rgba(6,182,212,.08)', color: '#06b6d4', label: 'Operations' },
            'shared': { bg: 'rgba(107,114,128,.08)', color: '#6b7280', label: 'Shared' }
        };

        // Element type icons
        var typeIcons = {
            'internal_meeting': '📋', 'customer_meeting': '🤝', 'governance_document': '📜',
            'legal_document': '⚖️', 'rfp_document': '📄', 'team_assignment': '👥',
            'timeline': '📅', 'design_artifact': '✏️', 'cost_model': '💰',
            'response': '📨', 'presentation': '📊', 'loi': '✍️', 'paf': '📋',
            'cod': '🏗️', 'document': '📄', 'meeting': '📋', 'deliverable': '📦',
            'approval': '✅', 'review': '🔍', 'milestone': '🏁', 'other': '📎'
        };

        // Status badge config
        var statusConfig = {
            'not_started': { bg: 'var(--ies-gray-100)', color: 'var(--ies-gray-500)', label: 'Not Started' },
            'in_progress': { bg: 'rgba(37,99,235,.1)', color: 'var(--ies-blue)', label: 'In Progress' },
            'complete': { bg: 'rgba(16,185,129,.1)', color: '#10b981', label: 'Complete' },
            'blocked': { bg: 'rgba(239,68,68,.1)', color: '#ef4444', label: 'Blocked' },
            'na': { bg: 'var(--ies-gray-100)', color: 'var(--ies-gray-400)', label: 'N/A' },
            'skipped': { bg: 'var(--ies-gray-100)', color: 'var(--ies-gray-400)', label: 'Skipped' }
        };

        if (stageElements.length === 0) {
            listEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--ies-gray-400);font-size:13px;">No activities loaded for this stage.</div>';
            return;
        }

        listEl.innerHTML = stageElements.map(function(elem) {
            var ws = wsColors[elem.responsible_workstream] || wsColors['shared'];
            var icon = typeIcons[elem.element_type] || '📎';
            var st = statusConfig[elem.element_status] || statusConfig['not_started'];
            var isComplete = elem.element_status === 'complete';

            return '<div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--ies-gray-100);">' +
                // Checkbox
                '<div onclick="dealApp.toggleElementStatus(\'' + elem.id + '\',\'' + elem.element_status + '\')" style="cursor:pointer;flex-shrink:0;width:24px;height:24px;border-radius:6px;border:2px solid ' + (isComplete ? '#10b981' : 'var(--ies-gray-300)') + ';background:' + (isComplete ? '#10b981' : '#fff') + ';display:flex;align-items:center;justify-content:center;">' +
                    (isComplete ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
                '</div>' +
                // Icon + Name + Description
                '<div style="flex:1;min-width:0;">' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">' +
                        '<span style="font-size:14px;">' + icon + '</span>' +
                        '<span style="font-size:13px;font-weight:600;color:var(--ies-navy);' + (isComplete ? 'text-decoration:line-through;opacity:0.6;' : '') + '">' + elem.element_name + '</span>' +
                    '</div>' +
                    (elem.description ? '<div style="font-size:11px;color:var(--ies-gray-500);margin-left:26px;line-height:1.4;' + (isComplete ? 'text-decoration:line-through;opacity:0.5;' : '') + '">' + elem.description + '</div>' : '') +
                '</div>' +
                // Workstream badge
                '<div style="flex-shrink:0;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;background:' + ws.bg + ';color:' + ws.color + ';text-transform:uppercase;letter-spacing:0.5px;">' + ws.label + '</div>' +
                // Status dropdown
                '<select onchange="dealApp.updateElementStatus(\'' + elem.id + '\',this.value)" style="flex-shrink:0;padding:6px 10px;border:1px solid var(--ies-gray-200);border-radius:6px;font-family:Montserrat,sans-serif;font-size:11px;font-weight:600;color:' + st.color + ';background:' + st.bg + ';cursor:pointer;min-width:100px;">' +
                    '<option value="not_started"' + (elem.element_status === 'not_started' ? ' selected' : '') + '>Not Started</option>' +
                    '<option value="in_progress"' + (elem.element_status === 'in_progress' ? ' selected' : '') + '>In Progress</option>' +
                    '<option value="complete"' + (elem.element_status === 'complete' ? ' selected' : '') + '>Complete</option>' +
                    '<option value="blocked"' + (elem.element_status === 'blocked' ? ' selected' : '') + '>Blocked</option>' +
                    '<option value="na"' + (elem.element_status === 'na' ? ' selected' : '') + '>N/A</option>' +
                    '<option value="skipped"' + (elem.element_status === 'skipped' ? ' selected' : '') + '>Skipped</option>' +
                '</select>' +
            '</div>';
        }).join('');
    },

    renderStageHistory(currentStageNum) {
        var el = document.getElementById('dosStageHistory');
        if (!el) return;
        var self = this;

        // Show collapsed cards for completed stages
        var completedStages = this.dosStages.filter(function(s){ return s.stage_number < currentStageNum; });

        if (completedStages.length === 0) {
            el.innerHTML = '';
            return;
        }

        el.innerHTML = '<div style="font-size:11px;font-weight:700;color:var(--ies-gray-500);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Completed Stages</div>' +
            completedStages.map(function(stage) {
                var elements = self.dosElements.filter(function(e){ return e.stage_number === stage.stage_number; });
                var completed = elements.filter(function(e){ return e.element_status === 'complete'; }).length;
                return '<div style="background:#fff;border-radius:10px;border:1px solid var(--ies-gray-200);padding:16px 20px;cursor:pointer;" onclick="dealApp.viewStageActivities(' + stage.id + ',' + stage.stage_number + ')">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                        '<div style="display:flex;align-items:center;gap:12px;">' +
                            '<div style="width:28px;height:28px;border-radius:50%;background:var(--ies-green,#10b981);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' +
                                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                            '</div>' +
                            '<div><div style="font-size:13px;font-weight:700;color:var(--ies-navy);">Stage ' + stage.stage_number + ': ' + stage.stage_name + '</div></div>' +
                        '</div>' +
                        '<div style="font-size:11px;font-weight:600;color:var(--ies-green,#10b981);">' + completed + '/' + elements.length + ' ✓</div>' +
                    '</div>' +
                '</div>';
            }).join('');
    },

    viewStageActivities(stageId, stageNum) {
        var stage = this.dosStages.find(function(s){ return s.id === stageId; });
        if (!stage) return;
        this.renderStageActivities(stage, stageNum);
    },

    async activateCurrentStage() {
        if (!this.currentDeal) return;
        var self = this;
        var deal = this.currentDeal;

        try {
            // Determine which stage to activate
            // If no stage yet, start at Stage 1; if already activated, allow re-activation at current stage
            var targetStageNum = 1;
            if (deal.current_stage_id) {
                var existingStage = this.dosStages.find(function(s){ return s.id === deal.current_stage_id; });
                if (existingStage) targetStageNum = existingStage.stage_number;
            }

            var targetStage = this.dosStages.find(function(s){ return s.stage_number === targetStageNum; });
            if (!targetStage) return;

            // Create DOS project if needed
            var dosProjectId = deal.dos_project_id;
            if (!dosProjectId) {
                var result = await cmApiPost('projects', {
                    project_name: deal.deal_name,
                    current_stage_id: targetStage.id,
                    project_status: 'active',
                    template_version_id: 1
                });
                dosProjectId = result[0].id;

                // Link project to deal
                await cmApiPatch('deal_deals', deal.id, {
                    dos_project_id: dosProjectId,
                    current_stage_id: targetStage.id,
                    updated_at: new Date().toISOString()
                });
                deal.dos_project_id = dosProjectId;
                deal.current_stage_id = targetStage.id;
            }

            // Instantiate stage elements via RPC
            var resp = await fetch(SUPABASE_URL + '/rest/v1/rpc/instantiate_stage_elements', {
                method: 'POST',
                headers: API_HEADERS,
                body: JSON.stringify({ p_project_id: dosProjectId, p_stage_id: targetStage.id })
            });
            if (!resp.ok) throw new Error(await resp.text());

            // Re-render
            await this.renderPipelineTab();
        } catch(e) {
            console.error('Error activating stage:', e);
            alert('Error activating stage: ' + e.message);
        }
    },

    async advanceStage() {
        if (!this.currentDeal) return;
        var deal = this.currentDeal;
        var currentStage = this.dosStages.find(function(s){ return s.id === deal.current_stage_id; });
        if (!currentStage || currentStage.stage_number >= 6) return;

        var nextStage = this.dosStages.find(function(s){ return s.stage_number === currentStage.stage_number + 1; });
        if (!nextStage) return;

        if (!confirm('Advance to Stage ' + nextStage.stage_number + ': ' + nextStage.stage_name + '?\n\nThis will create all standard activities for the new stage.')) return;

        try {
            // Update deal's current stage
            await cmApiPatch('deal_deals', deal.id, {
                current_stage_id: nextStage.id,
                updated_at: new Date().toISOString()
            });
            deal.current_stage_id = nextStage.id;

            // Instantiate elements for the new stage
            var resp = await fetch(SUPABASE_URL + '/rest/v1/rpc/instantiate_stage_elements', {
                method: 'POST',
                headers: API_HEADERS,
                body: JSON.stringify({ p_project_id: deal.dos_project_id, p_stage_id: nextStage.id })
            });
            if (!resp.ok) throw new Error(await resp.text());

            // Re-render
            await this.renderPipelineTab();
        } catch(e) {
            console.error('Error advancing stage:', e);
            alert('Error advancing stage: ' + e.message);
        }
    },

    async toggleElementStatus(elementId, currentStatus) {
        var newStatus = currentStatus === 'complete' ? 'not_started' : 'complete';
        await this.updateElementStatus(elementId, newStatus);
    },

    async updateElementStatus(elementId, newStatus) {
        try {
            var resp = await fetch(SUPABASE_URL + '/rest/v1/project_elements?id=eq.' + elementId, {
                method: 'PATCH',
                headers: API_HEADERS,
                body: JSON.stringify({
                    element_status: newStatus,
                    completed_at: newStatus === 'complete' ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                })
            });
            if (!resp.ok) console.error('Failed to update element status:', await resp.text());

            // Update local state
            var elem = this.dosElements.find(function(e){ return e.id == elementId; });
            if (elem) {
                elem.element_status = newStatus;
                elem.completed_at = newStatus === 'complete' ? new Date().toISOString() : null;
            }

            // Re-render the current view
            var deal = this.currentDeal;
            var currentStage = deal.current_stage_id ? this.dosStages.find(function(s){ return s.id === deal.current_stage_id; }) : null;
            var currentStageNum = currentStage ? currentStage.stage_number : 0;

            this.renderStageStepper(currentStageNum);
            this.renderStageActivities(currentStage, currentStageNum);
        } catch(e) {
            console.error('Error updating element status:', e);
            alert('Error updating status');
        }
    },

    backToDealList() {
        document.getElementById('deal-landing').style.display = 'block';
        document.getElementById('dealDetailView').style.display = 'none';
        this.loadDeals();
        this.currentDeal = null;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    cmApp.init();
    fmApp.init();
    dealApp.loadDeals();
});
