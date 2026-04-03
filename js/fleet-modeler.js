/* ═══════════════════════════════════════════════════════════════════
   FLEET MODELER
   Extracted from index.html — all symbols kept as globals.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Landing / Tool toggle helpers ── */

async function fmShowLanding() {
  var landing = document.getElementById('fm-landing');
  var tool = document.getElementById('fm-tool');
  if (landing) landing.style.display = 'block';
  if (tool) tool.style.display = 'none';
  await fmLoadScenariosList();
}

async function fmShowTool() {
  var landing = document.getElementById('fm-landing');
  var tool = document.getElementById('fm-tool');
  if (landing) landing.style.display = 'none';
  if (tool) tool.style.display = 'block';
}

async function fmLoadScenariosList() {
  try {
    var scenarios = await cmFetchTable('fleet_scenarios', 'order=created_at.desc');
    var grid = document.getElementById('fm-landing-grid');

    if (!grid) return;

    if (scenarios.length === 0) {
      grid.innerHTML = '';
      dtToggleLandingEmpty('fm-landing-actions', 'fm-empty-state', true);
      return;
    }

    dtToggleLandingEmpty('fm-landing-actions', 'fm-empty-state', false);

    grid.innerHTML = scenarios.map(function(s) {
      var sid = s.id;
      return '<div class="dt-landing-card">' +
        '<div onclick="fmLoadFleetScenario(\'' + sid + '\'); fmShowTool()" style="cursor:pointer;">' +
        '<div class="dt-landing-card-name">' + (s.name || 'Untitled') + '</div>' +
        '<div class="dt-landing-card-meta">' + (s.created_at ? new Date(s.created_at).toLocaleDateString() : '') + '</div>' +
        '<div class="dt-landing-card-metric">' + (s.notes ? s.notes.substring(0, 60) + '...' : 'Fleet scenario') + '</div>' +
        '</div>' +
        '<div class="dt-landing-card-actions">' +
        '<button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario(\'fleet_scenarios\',\'' + sid + '\',\'fleet\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>' +
        '<button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario(\'fleet_scenarios\',\'' + sid + '\',\'fleet\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>' +
        '</div></div>';
    }).join('');
  } catch (e) {
    console.error('Error loading scenarios:', e);
  }
}

function fmNewScenario() {
  // Reset fleet modeler for new scenario (if function exists)
  if (typeof fmClearAllScenarios === 'function') {
    fmClearAllScenarios();
  }
  fmShowTool();
}

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

/* ═══════════════════════════════════════════════════
   FLEET MODELER APPLICATION
   ═══════════════════════════════════════════════════ */

const fmApp = {
  lanes: [],
  results: null,
  scenarios: [],
  config: {
    utilization: 85,
    deadhead: 15,
    serviceLevel: 95,
    vehicles: ['dry_van', 'reefer', 'straight_truck'],
    financingMode: 'purchase',  // 'purchase' or 'lease'
    teamDriving: false  // Enable team driving (2 drivers per truck)
  },
  vehicleSpecs: {
    dry_van: { name: 'Dry Van (53ft)', capacity_wgt: 45000, capacity_cube: 3500, mpg: 6.5, capital_cost: 130000, annual_fixed: 35000, insurance_premium: 1.0, fuel_surcharge: 0, tare_wgt: 10500 },
    reefer: { name: 'Reefer (53ft)', capacity_wgt: 42000, capacity_cube: 2800, mpg: 5.5, capital_cost: 165000, annual_fixed: 45000, insurance_premium: 1.2, fuel_surcharge: 0.08, tare_wgt: 13000 },
    flatbed: { name: 'Flatbed (48ft)', capacity_wgt: 48000, capacity_cube: 0, mpg: 6.0, capital_cost: 110000, annual_fixed: 30000, insurance_premium: 1.15, fuel_surcharge: 0, tare_wgt: 9500 },
    straight_truck: { name: 'Straight Truck (26ft)', capacity_wgt: 20000, capacity_cube: 1600, mpg: 7.0, capital_cost: 75000, annual_fixed: 25000, insurance_premium: 0.75, fuel_surcharge: 0, tare_wgt: 14000 },
    sprinter_van: { name: 'Sprinter Van', capacity_wgt: 3500, capacity_cube: 400, mpg: 14.0, capital_cost: 48000, annual_fixed: 15000, insurance_premium: 0.5, fuel_surcharge: 0, tare_wgt: 6500 }
  },
  costModel: {
    diesel_price_per_gal: 3.87,      // EIA 2026: Commercial diesel price ($/gal); affects fuel cost per mile per vehicle MPG
    maintenance_per_mile: 0.198,     // ATRI 2024: $0.198/mi
    driver_hourly_rate: 32,          // Base hourly (regional) — ATRI 2024 $0.79/mi ÷ 2.5 mi/hr avg + benefits load adjustment
    driver_benefits_pct: 30,         // Benefits load (health, PTO, 401k)
    payroll_tax_pct: 7.65,           // FICA (SS 6.2% + Medicare 1.45%)
    vehicle_lease_monthly: 2500,     // Average monthly lease/payment per vehicle
    depreciation_per_vehicle_yr: 18000, // Annual depreciation if owned
    annual_insurance_per_vehicle: 10750, // ATRI 2024: Updated to mid-range $10,500–$11,000/yr for Class 8; scaled per vehicle type via insurance_premium factor
    admin_overhead_pct: 10,
    // Financing mode parameters
    vehicle_useful_life: { dry_van: 7, reefer: 7, flatbed: 7, straight_truck: 5, sprinter_van: 4 }, // years
    vehicle_residual_pct: 0.15,      // Residual value as % of acquisition cost
    lease_monthly_rates: { dry_van: 2200, reefer: 2500, flatbed: 2300, straight_truck: 1500, sprinter_van: 800 }, // $/mo per vehicle type
    // Common carrier benchmark rates ($/mi)
    carrier_rate_dry_van: 2.85,      // Spot market dry van Feb 2026
    carrier_rate_reefer: 3.75,       // Spot market reefer
    carrier_rate_flatbed: 3.25,      // Spot market flatbed
    // GXO dedicated fleet markup/discount
    dedicated_margin_pct: 12,        // GXO margin on dedicated fleet
    // ATRI 2024 benchmarks ($/mi) for inline comparison
    atri_benchmarks: {
      total_cost_per_mile: 2.26,
      fuel_per_mile: 0.583,
      driver_wages_per_mile: 0.827,
      vehicle_lease_purchase_per_mile: 0.296,
      insurance_per_mile: 0.117,
      maintenance_per_mile: 0.198,
      tires_per_mile: 0.048,
      permits_licenses_per_mile: 0.043,
      tolls_per_mile: 0.114
    }
  },

  init() {
    this.renderVehicleChecks();
    this.renderCostParams();
    this.renderLanesTable();
    this.updateTeamDrivingDisplay();
  },

  renderVehicleChecks() {
    const container = document.getElementById('fm-vehicle-checks');
    const specsContainer = document.getElementById('fm-vehicle-specs-table');
    const keys = Object.keys(this.vehicleSpecs);
    // Hidden checkboxes for backward compat
    container.innerHTML = keys.map(key => `
      <input type="checkbox" data-vehicle="${key}" ${this.config.vehicles.includes(key) ? 'checked' : ''} style="display:none;" />
    `).join('');
    // Specs table
    specsContainer.innerHTML = `
      <table class="cm-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:30px;text-align:center;">Use</th>
          <th>Vehicle Type</th>
          <th style="text-align:right;">Payload (lbs)</th>
          <th style="text-align:right;">Cube (ft³)</th>
          <th style="text-align:right;">MPG</th>
          <th style="text-align:right;">Capital Cost</th>
          <th style="text-align:right;">Annual Fixed</th>
          <th style="text-align:right;">Ins. Factor</th>
          <th style="text-align:right;">Fuel Surcharge</th>
        </tr></thead>
        <tbody>${keys.map(key => {
          const s = this.vehicleSpecs[key];
          const checked = this.config.vehicles.includes(key);
          const k = esc(key);
          return `<tr style="${checked ? '' : 'opacity:0.5;'}">
            <td style="text-align:center;"><input type="checkbox" data-vspec="${k}" ${checked ? 'checked' : ''} onchange="fmApp.toggleVehicle('${k}',this.checked)" style="cursor:pointer;"></td>
            <td style="font-weight:600;color:var(--ies-navy);">${esc(s.name)}</td>
            <td style="text-align:right;"><input type="number" value="${s.capacity_wgt}" onchange="fmApp.vehicleSpecs['${k}'].capacity_wgt=parseFloat(this.value)" style="width:70px;padding:3px 6px;border:1px solid var(--ies-gray-200);border-radius:4px;font-size:11px;text-align:right;"></td>
            <td style="text-align:right;"><input type="number" value="${s.capacity_cube}" onchange="fmApp.vehicleSpecs['${k}'].capacity_cube=parseFloat(this.value)" style="width:60px;padding:3px 6px;border:1px solid var(--ies-gray-200);border-radius:4px;font-size:11px;text-align:right;"></td>
            <td style="text-align:right;"><input type="number" value="${s.mpg}" step="0.5" onchange="fmApp.vehicleSpecs['${k}'].mpg=parseFloat(this.value)" style="width:50px;padding:3px 6px;border:1px solid var(--ies-gray-200);border-radius:4px;font-size:11px;text-align:right;"></td>
            <td style="text-align:right;">$${s.capital_cost.toLocaleString()}</td>
            <td style="text-align:right;">$${s.annual_fixed.toLocaleString()}</td>
            <td style="text-align:right;">${s.insurance_premium.toFixed(2)}x</td>
            <td style="text-align:right;">${s.fuel_surcharge > 0 ? '+$' + s.fuel_surcharge.toFixed(2) + '/mi' : '—'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
      <div style="margin-top:8px;font-size:11px;color:var(--ies-gray-400);">Payload, cube, and MPG are editable. Insurance Factor multiplies the base insurance rate. Capital Cost and Annual Fixed show ATRI 2024 benchmarks.</div>
    `;
  },

  toggleVehicle(key, checked) {
    if (checked && !this.config.vehicles.includes(key)) {
      this.config.vehicles.push(key);
    } else if (!checked) {
      this.config.vehicles = this.config.vehicles.filter(v => v !== key);
    }
    this.renderVehicleChecks();
  },

  updateVehicleSelection() {
    const checks = document.querySelectorAll('#fm-vehicle-checks input[type=checkbox]');
    this.config.vehicles = Array.from(checks).filter(cb => cb.checked).map(cb => cb.getAttribute('data-vehicle'));
  },

  renderCostParams() {
    const container = document.getElementById('fm-cost-params');
    const cm = this.costModel;
    container.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:var(--ies-gray-400);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;grid-column:1/-1;">Financing Mode</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;grid-column:1/-1;">
        <span style="min-width:130px;">Mode</span>
        <select id="fm-financing-mode" onchange="fmApp.config.financingMode = this.value; fmApp.renderCostParams();" style="padding:6px 10px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:13px;">
          <option value="purchase" ${this.config.financingMode === 'purchase' ? 'selected' : ''}>Purchase (Depreciation)</option>
          <option value="lease" ${this.config.financingMode === 'lease' ? 'selected' : ''}>Lease (Monthly Payment)</option>
        </select>
      </label>
      ${this.config.financingMode === 'purchase' ? `
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ies-gray-600);grid-column:1/-1;margin-top:4px;">
        <span style="min-width:130px;">Useful Life (yrs)</span>
        <input type="text" value="Dry: 7, Straight: 5, Sprinter: 4" disabled style="padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:11px;background:var(--ies-gray-100);color:var(--ies-gray-500);cursor:not-allowed;">
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ies-gray-600);grid-column:1/-1;">
        <span style="min-width:130px;">Residual Value</span>
        <input type="text" value="${(cm.vehicle_residual_pct * 100).toFixed(0)}% of acquisition" disabled style="padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:11px;background:var(--ies-gray-100);color:var(--ies-gray-500);cursor:not-allowed;">
      </label>
      ` : `
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ies-gray-600);grid-column:1/-1;margin-top:4px;">
        <span style="min-width:130px;">Monthly Rates</span>
        <input type="text" value="Dry: $2,200, Straight: $1,500, Sprinter: $800" disabled style="padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:11px;background:var(--ies-gray-100);color:var(--ies-gray-500);cursor:not-allowed;width:250px;">
      </label>
      `}
      <div style="font-size:11px;font-weight:700;color:var(--ies-gray-400);text-transform:uppercase;letter-spacing:.5px;margin:12px 0 4px;grid-column:1/-1;">Variable Costs (per mile)</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Diesel ($/gal)</span>
        <input type="number" id="fm-diesel-price" value="${cm.diesel_price_per_gal}" step="0.01" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Maintenance ($/mi)</span>
        <input type="number" id="fm-maint-cost" value="${cm.maintenance_per_mile}" step="0.01" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
      <div style="font-size:11px;font-weight:700;color:var(--ies-gray-400);text-transform:uppercase;letter-spacing:.5px;margin:8px 0 4px;grid-column:1/-1;">Driver Costs</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Base Rate ($/hr)</span>
        <input type="number" id="fm-driver-rate" value="${cm.driver_hourly_rate}" step="0.5" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Benefits Load (%)</span>
        <input type="number" id="fm-driver-benefits" value="${cm.driver_benefits_pct}" step="1" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Payroll Tax (%)</span>
        <input type="number" id="fm-payroll-tax" value="${cm.payroll_tax_pct}" step="0.1" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
      <div style="font-size:11px;font-weight:700;color:var(--ies-gray-400);text-transform:uppercase;letter-spacing:.5px;margin:8px 0 4px;grid-column:1/-1;">Fixed Costs (per vehicle/year)</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Lease ($/mo)</span>
        <input type="number" id="fm-lease" value="${cm.vehicle_lease_monthly}" step="100" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Insurance ($/yr)</span>
        <input type="number" id="fm-insurance" value="${cm.annual_insurance_per_vehicle}" step="500" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Admin Overhead (%)</span>
        <input type="number" id="fm-admin" value="${cm.admin_overhead_pct}" step="0.1" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
      <div style="font-size:11px;font-weight:700;color:var(--ies-gray-400);text-transform:uppercase;letter-spacing:.5px;margin:8px 0 4px;grid-column:1/-1;">Common Carrier Rates ($/mi benchmark)</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Dry Van</span>
        <input type="number" id="fm-carrier-dry" value="${cm.carrier_rate_dry_van}" step="0.05" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="min-width:130px;">Reefer</span>
        <input type="number" id="fm-carrier-reefer" value="${cm.carrier_rate_reefer}" step="0.05" style="width:70px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;">
      </label>
    `;
  },

  updateTeamDrivingDisplay() {
    const checkbox = document.getElementById('fm-team-driving');
    if (checkbox) {
      checkbox.checked = this.config.teamDriving;
    }
  },

  renderLanesTable() {
    const tbody = document.getElementById('fm-lanes-tbody');
    tbody.innerHTML = this.lanes.length === 0
      ? '<tr><td colspan="8" style="padding:20px;text-align:center;color:var(--ies-gray-600);">No lanes added. Click "Add Lane" or "Load Demo Data"</td></tr>'
      : this.lanes.map((lane, idx) => `
        <tr style="border-bottom:1px solid var(--ies-gray-200);">
          <td style="padding:12px;"><input type="text" value="${esc(lane.origin)}" onchange="fmApp.lanes[${idx}].origin = this.value; fmApp.updateMapIfVisible();" style="width:100%;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:12px;" placeholder="e.g., Chicago"></td>
          <td style="padding:12px;"><input type="text" value="${esc(lane.destination)}" onchange="fmApp.lanes[${idx}].destination = this.value; fmApp.updateMapIfVisible();" style="width:100%;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:12px;" placeholder="e.g., Atlanta"></td>
          <td style="padding:12px;text-align:center;"><input type="number" value="${lane.weekly_shipments}" onchange="fmApp.lanes[${idx}].weekly_shipments = parseInt(this.value); fmApp.updateMapIfVisible();" style="width:80px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:12px;" min="1"></td>
          <td style="padding:12px;text-align:center;"><input type="number" value="${lane.avg_weight}" onchange="fmApp.lanes[${idx}].avg_weight = parseFloat(this.value)" style="width:80px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:12px;" step="100"></td>
          <td style="padding:12px;text-align:center;"><input type="number" value="${lane.avg_cube}" onchange="fmApp.lanes[${idx}].avg_cube = parseFloat(this.value)" style="width:80px;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:12px;" step="10"></td>
          <td style="padding:12px;"><select onchange="fmApp.lanes[${idx}].delivery_window = this.value" style="width:100%;padding:6px;border:1px solid var(--ies-gray-300);border-radius:4px;font-size:12px;">
            <option ${lane.delivery_window === 'same_day' ? 'selected' : ''}>same-day</option>
            <option ${lane.delivery_window === 'next_day' ? 'selected' : ''}>next-day</option>
            <option ${lane.delivery_window === '2_day' ? 'selected' : ''}>2-day</option>
            <option ${lane.delivery_window === '3_day' ? 'selected' : ''}>3-day+</option>
          </select></td>
          <td style="padding:12px;text-align:center;color:var(--ies-gray-600);font-size:12px;">${lane.distance_miles || '—'}</td>
          <td style="padding:12px;text-align:center;"><button onclick="fmApp.removeLane(${idx}); fmApp.updateMapIfVisible();" style="background:var(--ies-red);color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;">Remove</button></td>
        </tr>
      `).join('');
  },

  addLane() {
    this.lanes.push({
      origin: '',
      destination: '',
      weekly_shipments: 1,
      avg_weight: 5000,
      avg_cube: 300,
      delivery_window: 'next_day',
      distance_miles: null
    });
    this.renderLanesTable();
  },

  removeLane(idx) {
    this.lanes.splice(idx, 1);
    this.renderLanesTable();
  },

  loadDemoData() {
    this.lanes = [
      { origin: 'Chicago', destination: 'Atlanta', weekly_shipments: 8, avg_weight: 22000, avg_cube: 1800, delivery_window: 'next_day', distance_miles: 600 },
      { origin: 'Chicago', destination: 'Dallas', weekly_shipments: 6, avg_weight: 20000, avg_cube: 1500, delivery_window: 'next_day', distance_miles: 920 },
      { origin: 'Los Angeles', destination: 'Phoenix', weekly_shipments: 10, avg_weight: 25000, avg_cube: 2000, delivery_window: 'same_day', distance_miles: 370 },
      { origin: 'New York', destination: 'Boston', weekly_shipments: 12, avg_weight: 18000, avg_cube: 1200, delivery_window: '2_day', distance_miles: 220 },
      { origin: 'Dallas', destination: 'Houston', weekly_shipments: 7, avg_weight: 19000, avg_cube: 1400, delivery_window: 'same_day', distance_miles: 240 }
    ];
    this.renderLanesTable();
    this.showToast('Demo data loaded (5 lanes)');
  },

  uploadCSV() {
    document.getElementById('fm-csv-upload').click();
  },

  processCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      this.lanes = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = values[idx]; });
        if (obj.origin && obj.destination) {
          this.lanes.push({
            origin: obj.origin,
            destination: obj.destination,
            weekly_shipments: parseInt(obj.weekly_shipments) || 1,
            avg_weight: parseFloat(obj.avg_weight) || 5000,
            avg_cube: parseFloat(obj.avg_cube) || 300,
            delivery_window: obj.delivery_window || 'next_day',
            distance_miles: parseFloat(obj.distance_miles) || null
          });
        }
      }
      this.renderLanesTable();
      this.showToast(`Loaded ${this.lanes.length} lanes from CSV`);
    };
    reader.readAsText(file);
  },

  exportLanes() {
    const csv = ['origin,destination,weekly_shipments,avg_weight,avg_cube,delivery_window,distance_miles'];
    this.lanes.forEach(lane => {
      csv.push(`${lane.origin},${lane.destination},${lane.weekly_shipments},${lane.avg_weight},${lane.avg_cube},${lane.delivery_window},${lane.distance_miles || ''}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fleet_lanes.csv';
    a.click();
    this.showToast('Lanes exported to CSV');
  },

  calculateFleet() {
    if (this.lanes.length === 0) {
      this.showToast('Add lanes before calculating');
      return;
    }

    if (this.config.vehicles.length === 0) {
      this.showToast('Select at least one vehicle type');
      return;
    }

    this.costModel.diesel_price_per_gal = parseFloat(document.getElementById('fm-diesel-price')?.value) || 3.87;
    this.costModel.maintenance_per_mile = parseFloat(document.getElementById('fm-maint-cost')?.value) || 0.198;
    this.costModel.driver_hourly_rate = parseFloat(document.getElementById('fm-driver-rate')?.value) || 32;
    this.costModel.driver_benefits_pct = parseFloat(document.getElementById('fm-driver-benefits')?.value) || 30;
    this.costModel.payroll_tax_pct = parseFloat(document.getElementById('fm-payroll-tax')?.value) || 7.65;
    this.costModel.vehicle_lease_monthly = parseFloat(document.getElementById('fm-lease')?.value) || 2500;
    this.costModel.annual_insurance_per_vehicle = parseFloat(document.getElementById('fm-insurance')?.value) || 10750;
    this.costModel.admin_overhead_pct = parseFloat(document.getElementById('fm-admin')?.value) || 10;
    this.costModel.carrier_rate_dry_van = parseFloat(document.getElementById('fm-carrier-dry')?.value) || 2.85;
    this.costModel.carrier_rate_reefer = parseFloat(document.getElementById('fm-carrier-reefer')?.value) || 3.75;

    this.config.utilization = parseFloat(document.getElementById('fm-utilization')?.value) || 85;
    this.config.deadhead = parseFloat(document.getElementById('fm-deadhead')?.value) || 15;
    this.config.serviceLevel = parseFloat(document.getElementById('fm-service-level')?.value) || 95;

    // ── Intelligent vehicle-to-lane assignment ──
    const vehicleFleet = {};
    const laneAssignments = [];
    let totalMilesPerWeek = 0;
    let totalTripsPerWeek = 0;
    const cm = this.costModel;
    const availableVehicles = this.config.vehicles.map(k => ({ key: k, ...this.vehicleSpecs[k] }));

    this.config.vehicles.forEach(vtype => { vehicleFleet[vtype] = 0; });

    // Assign best vehicle per lane (smallest that fits weight+cube, preferring lower cost)
    this.lanes.forEach(lane => {
      const wgt = lane.avg_weight;
      const cube = lane.avg_cube || 0;
      // Find best fitting vehicle — smallest capacity that fits, or largest if none fits
      let best = availableVehicles[0];
      for (const v of availableVehicles) {
        if (v.capacity_wgt >= wgt && (v.capacity_cube >= cube || v.capacity_cube === 0)) {
          if (!best || v.capacity_wgt < best.capacity_wgt || (best.capacity_wgt < wgt)) best = v;
        }
      }
      if (!best) best = availableVehicles[availableVehicles.length - 1]; // fallback to largest

      const tripsPerShipment = wgt > 0 ? Math.ceil(wgt / best.capacity_wgt) : 1;
      const tripsNeeded = tripsPerShipment * lane.weekly_shipments;
      const milesPerTrip = lane.distance_miles || 500;
      const roundTripMiles = milesPerTrip * 2 * (1 + this.config.deadhead / 100);
      const laneMilesPerWeek = roundTripMiles * tripsNeeded;
      totalMilesPerWeek += laneMilesPerWeek;
      totalTripsPerWeek += tripsNeeded;

      laneAssignments.push({
        lane, vehicle: best.key, tripsPerWeek: tripsNeeded,
        milesPerWeek: laneMilesPerWeek, milesPerTrip
      });
    });

    // Count vehicles needed per type based on trip hours
    const daysPerWeek = 5;
    // Team driving doubles effective hours per day (20 hrs with mandatory breaks vs 10 hrs solo)
    const effectiveHoursPerDay = this.config.teamDriving ? 20 : 10;
    const availableHoursPerWeek = daysPerWeek * effectiveHoursPerDay;
    const avgSpeed = 55; // mph

    // Group by vehicle type and calculate vehicles needed
    const byType = {};
    laneAssignments.forEach(a => {
      if (!byType[a.vehicle]) byType[a.vehicle] = { trips: 0, miles: 0, hours: 0 };
      byType[a.vehicle].trips += a.tripsPerWeek;
      byType[a.vehicle].miles += a.milesPerWeek;
      const tripHours = (a.lane.distance_miles || 500) * 2 / avgSpeed;
      byType[a.vehicle].hours += a.tripsPerWeek * tripHours;
    });

    Object.keys(byType).forEach(vtype => {
      const data = byType[vtype];
      const vehiclesFromHours = Math.ceil(data.hours / availableHoursPerWeek);
      const vehiclesAdjusted = Math.ceil(vehiclesFromHours / (this.config.utilization / 100));
      vehicleFleet[vtype] = vehiclesAdjusted;
    });

    const totalVehicles = Object.values(vehicleFleet).reduce((a, b) => a + b, 0);
    // Team driving: 2 drivers per truck; solo: 1.3 drivers per truck (accounting for PTO, training, etc)
    const avgDriversPerVehicle = this.config.teamDriving ? 2.0 : 1.3;
    const totalDrivers = Math.ceil(totalVehicles * avgDriversPerVehicle);

    // ── Per-vehicle-type cost model ──
    const annualMiles = Math.round(totalMilesPerWeek * 52);
    const driverBurdenMult = 1 + (cm.driver_benefits_pct / 100) + (cm.payroll_tax_pct / 100);
    const burdenedDriverRate = cm.driver_hourly_rate * driverBurdenMult;
    const annualDriverCost = totalDrivers * burdenedDriverRate * 2080;

    // Fuel cost per vehicle type uses diesel price + per-vehicle MPG
    const dieselPricePerGal = cm.diesel_price_per_gal;
    let annualFuel = 0;
    let annualMaint = 0;
    let annualVehicleCost = 0; // Lease or depreciation depending on mode
    let annualInsurance = 0;
    const vehicleCostDetail = {};

    Object.entries(vehicleFleet).forEach(([vtype, count]) => {
      if (count === 0) return;
      const spec = this.vehicleSpecs[vtype];
      const typeMilesPerWeek = byType[vtype] ? byType[vtype].miles : 0;
      const typeMilesPerYear = typeMilesPerWeek * 52;
      const fuelPerMile = (dieselPricePerGal / spec.mpg) + (spec.fuel_surcharge || 0);
      const typeFuel = typeMilesPerYear * fuelPerMile;
      const typeMaint = typeMilesPerYear * cm.maintenance_per_mile;
      const typeInsurance = count * cm.annual_insurance_per_vehicle * spec.insurance_premium;

      // Calculate vehicle cost: lease or depreciation based on financing mode
      let typeVehicleCost = 0;
      if (this.config.financingMode === 'lease') {
        // Lease mode: use per-vehicle type monthly rates
        const monthlyRate = cm.lease_monthly_rates[vtype] || cm.vehicle_lease_monthly;
        typeVehicleCost = count * monthlyRate * 12;
      } else {
        // Purchase mode: calculate straight-line depreciation
        const usefulLife = cm.vehicle_useful_life[vtype] || 7;
        const residualValue = spec.capital_cost * cm.vehicle_residual_pct;
        const annualDepreciation = (spec.capital_cost - residualValue) / usefulLife;
        typeVehicleCost = count * annualDepreciation;
      }

      annualFuel += typeFuel;
      annualMaint += typeMaint;
      annualVehicleCost += typeVehicleCost;
      annualInsurance += typeInsurance;

      vehicleCostDetail[vtype] = {
        count, miles: typeMilesPerYear, fuel: typeFuel, maint: typeMaint,
        vehicleCost: typeVehicleCost, insurance: typeInsurance, fuelPerMile,
        total: typeFuel + typeMaint + typeVehicleCost + typeInsurance,
        financingMode: this.config.financingMode
      };
    });

    const annualFuelMaint = annualFuel + annualMaint;
    const subtotal = annualDriverCost + annualFuelMaint + annualVehicleCost + annualInsurance;
    const adminOverhead = subtotal * (cm.admin_overhead_pct / 100);
    const privateFleetTotal = subtotal + adminOverhead;
    const costPerMile = annualMiles > 0 ? privateFleetTotal / annualMiles : 0;

    // Common carrier cost: per-lane using vehicle-appropriate rates
    const carrierRateMap = { dry_van: cm.carrier_rate_dry_van, reefer: cm.carrier_rate_reefer, flatbed: cm.carrier_rate_flatbed || 3.25, straight_truck: cm.carrier_rate_dry_van * 0.85, sprinter_van: cm.carrier_rate_dry_van * 0.65 };
    let commonCarrierTotal = 0;
    laneAssignments.forEach(a => {
      const rate = carrierRateMap[a.vehicle] || cm.carrier_rate_dry_van;
      commonCarrierTotal += (a.milesPerWeek * 52) * rate;
    });
    const avgCarrierRate = annualMiles > 0 ? commonCarrierTotal / annualMiles : 0;

    // GXO dedicated: cost-plus model
    const gxoBaseCost = annualFuelMaint + annualVehicleCost + annualInsurance + (totalDrivers * cm.driver_hourly_rate * 1.25 * 2080);
    const dedicatedFleetTotal = gxoBaseCost * (1 + cm.dedicated_margin_pct / 100);

    this.results = {
      totalVehicles,
      totalDrivers,
      utilization: this.config.utilization,
      costPerMile,
      fleetMix: vehicleFleet,
      totalMilesPerWeek: Math.round(totalMilesPerWeek),
      annual_miles: annualMiles,
      laneAssignments: laneAssignments,
      vehicleCostDetail: vehicleCostDetail,
      costBreakdown: {
        driverCost: annualDriverCost,
        fuel: annualFuel,
        maintenance: annualMaint,
        fuelMaint: annualFuelMaint,
        vehicleCost: annualVehicleCost,
        insurance: annualInsurance,
        adminOverhead: adminOverhead,
        burdenedDriverRate: burdenedDriverRate
      },
      financingMode: this.config.financingMode,
      privateFleetCost: privateFleetTotal,
      dedicatedFleetCost: dedicatedFleetTotal,
      commonCarrierCost: commonCarrierTotal,
      avgCarrierRate: avgCarrierRate
    };

    this.renderResults();
    fmShowTab('results');
    this.showToast('Fleet calculation complete');
  },

  renderResults() {
    if (!this.results) return;

    document.getElementById('fm-results-content').style.display = 'block';
    document.getElementById('fm-no-results').style.display = 'none';

    document.getElementById('fm-res-total-vehicles').textContent = this.results.totalVehicles;
    document.getElementById('fm-res-total-drivers').textContent = this.results.totalDrivers;
    document.getElementById('fm-res-utilization').textContent = this.results.utilization.toFixed(0) + '%';
    document.getElementById('fm-res-cost-per-mile').textContent = '$' + this.results.costPerMile.toFixed(2);

    const tbody = document.getElementById('fm-fleet-mix-tbody');
    const vcd = this.results.vehicleCostDetail || {};
    tbody.innerHTML = Object.entries(this.results.fleetMix).filter(([,count]) => count > 0).map(([vtype, count]) => {
      const spec = this.vehicleSpecs[vtype];
      const detail = vcd[vtype] || {};
      const annualMilesType = detail.miles || 0;
      const fuelPerMi = detail.fuelPerMile || 0;
      const typeTotalCost = detail.total || 0;
      return `
        <tr style="border-bottom:1px solid var(--ies-gray-200);">
          <td style="padding:12px;font-weight:600;">${spec.name}</td>
          <td style="padding:12px;text-align:center;font-weight:600;">${count}</td>
          <td style="padding:12px;text-align:right;font-size:11px;">${spec.capacity_wgt.toLocaleString()} lbs / ${spec.capacity_cube.toLocaleString()} ft³</td>
          <td style="padding:12px;text-align:right;font-size:11px;">${spec.mpg} MPG</td>
          <td style="padding:12px;text-align:right;font-size:11px;">$${fuelPerMi.toFixed(3)}/mi</td>
          <td style="padding:12px;text-align:right;font-size:11px;">${(annualMilesType / 1000).toFixed(0)}K mi</td>
          <td style="padding:12px;text-align:center;font-weight:600;">$${(typeTotalCost / 1000).toFixed(0)}K</td>
        </tr>
      `;
    }).join('');

    const r = this.results;
    const bd = r.costBreakdown;
    const privateFleetCost = r.privateFleetCost;
    const dedicatedFleetCost = r.dedicatedFleetCost;
    const commonCarrierCost = r.commonCarrierCost;

    // Determine cheapest option
    const cheapest = Math.min(privateFleetCost, dedicatedFleetCost, commonCarrierCost);
    const privateIsLowest = privateFleetCost === cheapest;
    const dedicatedIsLowest = dedicatedFleetCost === cheapest;
    const carrierIsLowest = commonCarrierCost === cheapest;

    const fmtM = (v) => '$' + (v / 1000000).toFixed(2) + 'M';
    const fmtPct = (a, b) => b > 0 ? ((a - b) / b * 100).toFixed(1) + '%' : '—';
    const vehicleCostLabel = r.financingMode === 'lease' ? 'Lease' : 'Depreciation';

    document.getElementById('fm-cost-cards').innerHTML = `
      <div class="fm-cost-card" ${privateIsLowest ? 'style="border-color:var(--ies-green);background:linear-gradient(135deg,rgba(0,200,83,.04),rgba(0,200,83,.01));"' : ''}>
        <div class="fm-cost-card-title">Private Fleet ${privateIsLowest ? '<span style="color:var(--ies-green);font-size:10px;">✓ LOWEST</span>' : ''}</div>
        <div class="fm-cost-card-value">${fmtM(privateFleetCost)}</div>
        <div style="font-size:11px;color:var(--ies-gray-500);line-height:1.6;">
          Drivers: ${fmtM(bd.driverCost)}<br>
          Fuel: ${fmtM(bd.fuel || bd.fuelMaint * 0.6)}<br>
          Maint: ${fmtM(bd.maintenance || bd.fuelMaint * 0.4)}<br>
          ${vehicleCostLabel}: ${fmtM(bd.vehicleCost)}<br>
          Insurance: ${fmtM(bd.insurance)}<br>
          Overhead: ${fmtM(bd.adminOverhead)}
        </div>
        <div style="margin-top:6px;font-size:11px;color:var(--ies-gray-400);">All-in cost/mi: $${r.costPerMile.toFixed(2)}</div>
      </div>
      <div class="fm-cost-card" ${dedicatedIsLowest ? 'style="border-color:var(--ies-green);background:linear-gradient(135deg,rgba(0,200,83,.04),rgba(0,200,83,.01));"' : 'style="border-color:var(--ies-blue);background:linear-gradient(135deg, rgba(0,71,171,.05), rgba(0,71,171,.02));"'}>
        <div class="fm-cost-card-title">Dedicated Fleet (GXO) ${dedicatedIsLowest ? '<span style="color:var(--ies-green);font-size:10px;">✓ LOWEST</span>' : ''}</div>
        <div class="fm-cost-card-value" style="color:${dedicatedIsLowest ? 'var(--ies-green)' : 'var(--ies-blue)'};">${fmtM(dedicatedFleetCost)}</div>
        <div style="font-size:11px;color:var(--ies-gray-500);line-height:1.6;">
          GXO manages fleet, drivers, and maintenance.<br>
          ${this.costModel.dedicated_margin_pct}% management margin included.<br>
          Volume discounts on benefits and equipment.
        </div>
        ${dedicatedFleetCost < privateFleetCost ? '<div class="fm-cost-card-savings">Saves ' + fmtM(privateFleetCost - dedicatedFleetCost) + ' vs private (' + fmtPct(privateFleetCost, dedicatedFleetCost) + ')</div>' : '<div style="margin-top:6px;font-size:11px;color:var(--ies-red);">' + fmtPct(dedicatedFleetCost, privateFleetCost) + ' more than private</div>'}
      </div>
      <div class="fm-cost-card" ${carrierIsLowest ? 'style="border-color:var(--ies-green);background:linear-gradient(135deg,rgba(0,200,83,.04),rgba(0,200,83,.01));"' : ''}>
        <div class="fm-cost-card-title">Common Carrier ${carrierIsLowest ? '<span style="color:var(--ies-green);font-size:10px;">✓ LOWEST</span>' : ''}</div>
        <div class="fm-cost-card-value" style="color:${carrierIsLowest ? 'var(--ies-green)' : 'var(--ies-red)'};">${fmtM(commonCarrierCost)}</div>
        <div style="font-size:11px;color:var(--ies-gray-500);line-height:1.6;">
          Spot/contract market rates.<br>
          Avg rate: $${r.avgCarrierRate.toFixed(2)}/mi<br>
          No asset ownership or driver management.
        </div>
        ${commonCarrierCost > privateFleetCost ? '<div style="margin-top:6px;font-size:11px;color:var(--ies-red);">' + fmtPct(commonCarrierCost, privateFleetCost) + ' more than private</div>' : '<div class="fm-cost-card-savings">Saves ' + fmtM(privateFleetCost - commonCarrierCost) + ' vs private</div>'}
      </div>
    `;

    // Render ATRI Benchmark Comparison
    this.renderBenchmarkComparison();

    const annualShipments = this.lanes.reduce((sum, l) => sum + (l.weekly_shipments * 52), 0);
    const costPerShipment = privateFleetCost / Math.max(1, annualShipments);
    const totalWeight = this.lanes.reduce((sum, l) => sum + (l.avg_weight * l.weekly_shipments * 52), 0);
    const costPerPound = totalWeight > 0 ? privateFleetCost / totalWeight : 0;

    document.getElementById('fm-metrics-grid').innerHTML = `
      <div class="fm-metric-card">
        <div class="fm-metric-label">Cost per Shipment</div>
        <div class="fm-metric-value">$${costPerShipment.toFixed(0)}</div>
      </div>
      <div class="fm-metric-card">
        <div class="fm-metric-label">Cost per 1000 lbs</div>
        <div class="fm-metric-value">$${(costPerPound * 1000).toFixed(0)}</div>
      </div>
      <div class="fm-metric-card">
        <div class="fm-metric-label">Weekly Miles</div>
        <div class="fm-metric-value">${this.results.totalMilesPerWeek.toLocaleString()}</div>
      </div>
      <div class="fm-metric-card">
        <div class="fm-metric-label">Driver Util. Hrs/Wk</div>
        <div class="fm-metric-value">${Math.round(this.results.totalMilesPerWeek / 55)}</div>
      </div>
    `;

    this.renderSensitivityChart();
    this.renderLaneAssignments();
    this.renderCostWaterfall();
  },

  renderSensitivityChart() {
    const ctx = document.getElementById('fm-sensitivity-chart');
    if (!ctx) return;

    const baseCost = this.results.totalMilesPerWeek * this.results.costPerMile * 52;
    const scenarios = [
      { label: '-20% Vol', value: baseCost * 0.8 },
      { label: '-10% Vol', value: baseCost * 0.9 },
      { label: 'Base', value: baseCost },
      { label: '+10% Vol', value: baseCost * 1.1 },
      { label: '+20% Vol', value: baseCost * 1.2 }
    ];

    if (window.fmSensitivityChart) {
      window.fmSensitivityChart.destroy();
    }

    window.fmSensitivityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: scenarios.map(s => s.label),
        datasets: [{
          label: 'Annual Cost',
          data: scenarios.map(s => s.value / 1000000),
          backgroundColor: ['#dc3545', '#ffc107', '#0047AB', '#ffc107', '#dc3545'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  },

  renderLaneAssignments() {
    const tbody = document.getElementById('fm-lane-assignments-tbody');
    if (!tbody || !this.results || !this.results.laneAssignments) return;
    const vc = { dry_van: '#2563eb', reefer: '#06b6d4', flatbed: '#f97316', straight_truck: '#10b981', sprinter_van: '#8b5cf6' };
    tbody.innerHTML = this.results.laneAssignments.map(a => {
      const spec = this.vehicleSpecs[a.vehicle];
      const color = vc[a.vehicle] || '#64748b';
      return `<tr style="border-bottom:1px solid var(--ies-gray-200);">
        <td style="padding:10px;">${a.lane.origin}</td>
        <td style="padding:10px;">${a.lane.destination}</td>
        <td style="padding:10px;text-align:center;">${a.lane.weekly_shipments}</td>
        <td style="padding:10px;text-align:right;">${a.lane.avg_weight.toLocaleString()} lbs</td>
        <td style="padding:10px;text-align:center;"><span style="font-size:11px;padding:3px 8px;border-radius:4px;background:${color}15;color:${color};font-weight:600;">${spec.name}</span></td>
        <td style="padding:10px;text-align:center;font-weight:600;">${a.tripsPerWeek}</td>
        <td style="padding:10px;text-align:right;">${Math.round(a.milesPerWeek).toLocaleString()}</td>
      </tr>`;
    }).join('');
  },

  renderCostWaterfall() {
    const container = document.getElementById('fm-cost-waterfall');
    if (!container || !this.results) return;
    const bd = this.results.costBreakdown;
    const vehicleLabel = this.results.financingMode === 'lease' ? 'Lease' : 'Depreciation';
    const items = [
      { label: 'Drivers', value: bd.driverCost, color: '#2563eb' },
      { label: 'Fuel', value: bd.fuel, color: '#f59e0b' },
      { label: 'Maintenance', value: bd.maintenance, color: '#10b981' },
      { label: vehicleLabel, value: bd.vehicleCost, color: '#8b5cf6' },
      { label: 'Insurance', value: bd.insurance, color: '#ef4444' },
      { label: 'Overhead', value: bd.adminOverhead, color: '#64748b' }
    ];
    const maxVal = Math.max(...items.map(i => i.value));
    container.innerHTML = items.map(item => {
      const pct = maxVal > 0 ? (item.value / maxVal * 100) : 0;
      const totalPct = this.results.privateFleetCost > 0 ? (item.value / this.results.privateFleetCost * 100) : 0;
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;">
        <div style="font-size:10px;font-weight:700;color:var(--ies-navy);margin-bottom:2px;">$${(item.value/1000).toFixed(0)}K</div>
        <div style="font-size:9px;color:var(--ies-gray-400);margin-bottom:4px;">${totalPct.toFixed(0)}%</div>
        <div style="width:100%;max-width:50px;height:${Math.max(pct, 3)}%;background:${item.color};border-radius:6px 6px 0 0;transition:height 0.3s;"></div>
        <div style="font-size:10px;color:var(--ies-gray-500);margin-top:6px;text-align:center;">${item.label}</div>
      </div>`;
    }).join('');
  },

  renderBenchmarkComparison() {
    const container = document.getElementById('fm-benchmark-comparison');
    if (!container || !this.results) return;

    const r = this.results;
    const bd = r.costBreakdown;
    const ab = this.costModel.atri_benchmarks;
    const annualMiles = r.annual_miles;

    // Calculate actual per-mile costs
    const actual = {
      total: r.costPerMile,
      fuel: annualMiles > 0 ? bd.fuel / annualMiles : 0,
      driverWages: annualMiles > 0 ? bd.driverCost / annualMiles : 0,
      vehicleLeaseDepreciation: annualMiles > 0 ? bd.vehicleCost / annualMiles : 0,
      insurance: annualMiles > 0 ? bd.insurance / annualMiles : 0,
      maintenance: annualMiles > 0 ? bd.maintenance / annualMiles : 0
    };

    // Calculate variances (% difference from ATRI)
    const getVariance = (actual, benchmark) => benchmark > 0 ? ((actual - benchmark) / benchmark * 100) : 0;
    const getVarianceColor = (variance) => {
      if (Math.abs(variance) <= 10) return '#00c853';  // green
      if (Math.abs(variance) <= 25) return '#ffc107';  // yellow
      return '#f44336'; // red
    };

    const rows = [
      { category: 'Total Operating Cost', actual: actual.total, benchmark: ab.total_cost_per_mile },
      { category: 'Fuel', actual: actual.fuel, benchmark: ab.fuel_per_mile },
      { category: 'Driver Wages', actual: actual.driverWages, benchmark: ab.driver_wages_per_mile },
      { category: 'Vehicle Lease/Depreciation', actual: actual.vehicleLeaseDepreciation, benchmark: ab.vehicle_lease_purchase_per_mile },
      { category: 'Insurance', actual: actual.insurance, benchmark: ab.insurance_per_mile },
      { category: 'Maintenance', actual: actual.maintenance, benchmark: ab.maintenance_per_mile }
    ];

    container.innerHTML = `
      <div style="font-weight:600;margin-bottom:16px;color:var(--ies-navy);">ATRI Benchmark Comparison (2024)</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead style="background:var(--ies-gray-150);border-bottom:2px solid var(--ies-gray-300);">
            <tr>
              <th style="padding:12px;text-align:left;font-weight:600;">Category</th>
              <th style="padding:12px;text-align:right;font-weight:600;">Your Cost/Mi</th>
              <th style="padding:12px;text-align:right;font-weight:600;">ATRI Benchmark</th>
              <th style="padding:12px;text-align:right;font-weight:600;">Variance</th>
              <th style="padding:12px;text-align:center;font-weight:600;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => {
              const variance = getVariance(row.actual, row.benchmark);
              const varianceColor = getVarianceColor(variance);
              const statusText = Math.abs(variance) <= 10 ? 'On target' : (variance > 0 ? 'Above benchmark' : 'Below benchmark');
              return `
              <tr style="border-bottom:1px solid var(--ies-gray-200);">
                <td style="padding:12px;font-weight:500;color:var(--ies-navy);">${row.category}</td>
                <td style="padding:12px;text-align:right;font-weight:600;">$${row.actual.toFixed(3)}/mi</td>
                <td style="padding:12px;text-align:right;">$${row.benchmark.toFixed(3)}/mi</td>
                <td style="padding:12px;text-align:right;font-weight:600;color:${varianceColor};">${variance > 0 ? '+' : ''}${variance.toFixed(1)}%</td>
                <td style="padding:12px;text-align:center;">
                  <span style="padding:4px 10px;border-radius:4px;font-size:11px;font-weight:600;background:${varianceColor}20;color:${varianceColor};">
                    ${statusText}
                  </span>
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;padding:12px;background:var(--ies-gray-100);border-radius:6px;font-size:11px;color:var(--ies-gray-600);line-height:1.5;">
        <strong>ATRI Data Source:</strong> American Transportation Research Institute 2024. Green indicates within ±10% of benchmark, yellow ±10-25%, red &gt;25% variance.
      </div>
    `;
  },

  renderSensitivityMatrix() {
    if (!this.results) return;
    const container = document.getElementById('fm-sensitivity-matrix-container');
    if (!container) return;

    // Driver hourly rates to test: $25, $28, $30, $32, $35, $38
    const driverRates = [25, 28, 30, 32, 35, 38];
    // Diesel prices to test: $3.25, $3.50, $3.75, $4.00, $4.25, $4.50
    const dieselPrices = [3.25, 3.50, 3.75, 4.00, 4.25, 4.50];

    // Save current values
    const origDriverRate = this.costModel.driver_hourly_rate;
    const origDieselPrice = this.costModel.diesel_price_per_gal;

    // Current scenario location for highlighting
    let currentRowIdx = driverRates.indexOf(origDriverRate);
    let currentColIdx = dieselPrices.indexOf(origDieselPrice);

    // Find closest if exact match not found
    if (currentRowIdx === -1) {
      currentRowIdx = driverRates.reduce((nearest, rate, idx) =>
        Math.abs(rate - origDriverRate) < Math.abs(driverRates[nearest] - origDriverRate) ? idx : nearest, 0);
    }
    if (currentColIdx === -1) {
      currentColIdx = dieselPrices.reduce((nearest, price, idx) =>
        Math.abs(price - origDieselPrice) < Math.abs(dieselPrices[nearest] - origDieselPrice) ? idx : nearest, 0);
    }

    // Generate matrix data
    const matrix = driverRates.map((driverRate, rowIdx) => {
      return dieselPrices.map((dieselPrice, colIdx) => {
        // Temporarily set values
        this.costModel.driver_hourly_rate = driverRate;
        this.costModel.diesel_price_per_gal = dieselPrice;

        // Calculate cost per mile with current parameters
        // This is simplified — we use existing results structure
        const cm = this.costModel;
        const r = this.results;
        const bd = r.costBreakdown;

        // Recalculate affected costs
        const driverBurdenMult = 1 + (cm.driver_benefits_pct / 100) + (cm.payroll_tax_pct / 100);
        const burdenedRate = driverRate * driverBurdenMult;
        const driverCostAdjusted = r.totalDrivers * burdenedRate * 2080;

        // Calculate fuel cost based on vehicle mix
        let fuelAdjusted = 0;
        Object.entries(r.vehicleCostDetail || {}).forEach(([vtype, detail]) => {
          const spec = this.vehicleSpecs[vtype];
          const fuelPerMile = (dieselPrice / spec.mpg) + (spec.fuel_surcharge || 0);
          fuelAdjusted += detail.miles * fuelPerMile;
        });

        // Total cost adjusted
        const subtotal = driverCostAdjusted + fuelAdjusted + bd.maintenance + bd.vehicleCost + bd.insurance;
        const adminOverhead = subtotal * (cm.admin_overhead_pct / 100);
        const privateFleetTotal = subtotal + adminOverhead;
        const costPerMile = r.annual_miles > 0 ? privateFleetTotal / r.annual_miles : 0;

        return {
          driverRate,
          dieselPrice,
          costPerMile,
          isCurrentCell: rowIdx === currentRowIdx && colIdx === currentColIdx
        };
      });
    });

    // Restore original values
    this.costModel.driver_hourly_rate = origDriverRate;
    this.costModel.diesel_price_per_gal = origDieselPrice;

    // Color function
    const getCellColor = (costPerMile) => {
      if (costPerMile < 2.00) return '#00c853'; // green
      if (costPerMile < 2.50) return '#ffc107'; // yellow
      if (costPerMile < 3.00) return '#ff9800'; // orange
      return '#f44336'; // red
    };

    // Build table HTML
    let html = `<table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr>
          <th style="padding:8px;text-align:center;font-weight:600;border:1px solid var(--ies-gray-300);background:var(--ies-gray-150);">Driver Rate ($/hr)</th>`;

    dieselPrices.forEach(price => {
      html += `<th style="padding:8px;text-align:center;font-weight:600;border:1px solid var(--ies-gray-300);background:var(--ies-gray-150);">$${price.toFixed(2)}</th>`;
    });
    html += `</tr></thead><tbody>`;

    matrix.forEach((row, rowIdx) => {
      html += `<tr>
        <td style="padding:8px;text-align:center;font-weight:600;border:1px solid var(--ies-gray-300);background:var(--ies-gray-150);">$${driverRates[rowIdx]}</td>`;

      row.forEach(cell => {
        const bgColor = getCellColor(cell.costPerMile);
        const borderStyle = cell.isCurrentCell ? '2px solid var(--ies-navy)' : '1px solid var(--ies-gray-300)';
        const fontWeight = cell.isCurrentCell ? '700' : '500';
        html += `<td style="padding:8px;text-align:center;border:${borderStyle};background:${bgColor}20;font-weight:${fontWeight};">$${cell.costPerMile.toFixed(2)}</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    html += `<div style="margin-top:12px;font-size:11px;color:var(--ies-gray-600);line-height:1.5;">
      <strong>Note:</strong> <span style="color:#00c853;font-weight:600;">Green</span> = &lt;$2.00/mi (excellent),
      <span style="color:#ffc107;font-weight:600;">Yellow</span> = $2.00-2.50/mi (good),
      <span style="color:#ff9800;font-weight:600;">Orange</span> = $2.50-3.00/mi (fair),
      <span style="color:#f44336;font-weight:600;">Red</span> = &gt;$3.00/mi (high).
      <strong>Current scenario</strong> shown with navy border.
    </div>`;

    container.innerHTML = html;
    this.showToast('Sensitivity matrix generated');
  },

  exportResults() {
    if (!this.results) { this.showToast('Calculate fleet first'); return; }
    const r = this.results;
    const bd = r.costBreakdown;
    const fmtM = v => '$' + (v / 1000000).toFixed(3) + 'M';
    let csv = 'Fleet Modeler Results Export\n\n';
    csv += 'FLEET SUMMARY\n';
    csv += `Total Vehicles,${r.totalVehicles}\nTotal Drivers,${r.totalDrivers}\nAnnual Miles,${r.annual_miles}\nCost per Mile,$${r.costPerMile.toFixed(2)}\n\n`;
    const vehicleCostLabel = r.financingMode === 'lease' ? 'Lease Cost' : 'Depreciation Cost';
    csv += 'VEHICLE MIX\nType,Count,Annual Miles,Fuel Cost,Maint Cost,' + vehicleCostLabel + ',Insurance,Total\n';
    Object.entries(r.vehicleCostDetail || {}).forEach(([vtype, d]) => {
      csv += `${this.vehicleSpecs[vtype].name},${d.count},${d.miles},$${d.fuel.toFixed(0)},$${d.maint.toFixed(0)},$${d.vehicleCost.toFixed(0)},$${d.insurance.toFixed(0)},$${d.total.toFixed(0)}\n`;
    });
    csv += '\nCOST BREAKDOWN\n';
    csv += `Driver Cost,${fmtM(bd.driverCost)}\nFuel,${fmtM(bd.fuel)}\nMaintenance,${fmtM(bd.maintenance)}\n${vehicleCostLabel},${fmtM(bd.vehicleCost)}\nInsurance,${fmtM(bd.insurance)}\nOverhead,${fmtM(bd.adminOverhead)}\n`;
    csv += `\nPRIVATE FLEET TOTAL,${fmtM(r.privateFleetCost)}\nDEDICATED FLEET (GXO),${fmtM(r.dedicatedFleetCost)}\nCOMMON CARRIER,${fmtM(r.commonCarrierCost)}\n`;
    csv += '\nLANE ASSIGNMENTS\nOrigin,Destination,Ships/Wk,Avg Weight,Vehicle,Trips/Wk,Miles/Wk\n';
    (r.laneAssignments || []).forEach(a => {
      csv += `${a.lane.origin},${a.lane.destination},${a.lane.weekly_shipments},${a.lane.avg_weight},${this.vehicleSpecs[a.vehicle].name},${a.tripsPerWeek},${Math.round(a.milesPerWeek)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fleet_results_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    this.showToast('Results exported to CSV');
  },

  async saveScenario() {
    const name = prompt('Scenario name:');
    if (!name) return;

    try {
      // Save scenario to Supabase
      const scenarioData = {
        name: name,
        notes: this.config.description || '',
        config: JSON.parse(JSON.stringify(this.config)),
        results: this.results ? JSON.parse(JSON.stringify(this.results)) : null
      };

      const saved = await cmApiPost('fleet_scenarios', scenarioData);
      if (!saved || !saved[0]) { this.showToast('Failed to save scenario', 'error'); return; }
      const scenarioId = saved[0].id;

      // Save lanes to Supabase
      if (this.lanes && this.lanes.length > 0) {
        const lanesData = this.lanes.map(l => ({
          scenario_id: scenarioId,
          origin: l.origin || '',
          destination: l.destination || '',
          weekly_shipments: parseInt(l.weekly_shipments) || parseInt(l.weeklyShipments) || 0,
          avg_weight_lbs: parseFloat(l.avg_weight) || parseFloat(l.avg_weight_lbs) || parseFloat(l.avgWeight) || 0,
          avg_cube_ft3: parseFloat(l.avg_cube) || parseFloat(l.avg_cube_ft3) || parseFloat(l.avgCube) || 0,
          delivery_window: l.delivery_window || l.deliveryWindow || '',
          distance_miles: parseFloat(l.distance_miles) || parseFloat(l.distance) || 0
        }));
        await cmApiPost('fleet_lanes', lanesData);
      }

      // Also keep in local memory for the Scenarios tab
      this.scenarios.push({
        id: scenarioId,
        name,
        lanes: JSON.parse(JSON.stringify(this.lanes)),
        config: JSON.parse(JSON.stringify(this.config)),
        results: this.results ? JSON.parse(JSON.stringify(this.results)) : null,
        created_at: new Date().toLocaleString()
      });
      this.renderScenariosListLocal();
      this.showToast(`Scenario "${name}" saved`);
    } catch (e) {
      console.error('Error saving scenario:', e);
      this.showToast('Error saving: ' + e.message, 'error');
    }
  },

  clearScenario() {
    if (confirm('Clear all lanes and reset configuration?')) {
      this.lanes = [];
      this.results = null;
      this.renderLanesTable();
      document.getElementById('fm-no-results').style.display = 'block';
      document.getElementById('fm-results-content').style.display = 'none';
      this.showToast('Cleared');
    }
  },

  renderScenariosListLocal() {
    const container = document.getElementById('fm-scenarios-list');
    document.getElementById('fm-scenario-count').textContent = this.scenarios.length;

    if (this.scenarios.length === 0) {
      container.innerHTML = '<div style="color:var(--ies-gray-600);padding:20px;text-align:center;">No scenarios saved yet</div>';
      return;
    }

    container.innerHTML = this.scenarios.map(s => `
      <div class="fm-scenario-item">
        <div class="fm-scenario-info">
          <div class="fm-scenario-name">${s.name}</div>
          <div class="fm-scenario-meta">${s.lanes && s.lanes.length ? s.lanes.length + ' lanes • ' : ''}${s.created_at}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="fmApp.loadScenario('${s.id}')" class="fm-btn-primary" style="padding:6px 14px;font-size:12px;">Load</button>
          <button onclick="fmApp.deleteScenario('${s.id}')" style="background:var(--ies-red);color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Delete</button>
        </div>
      </div>
    `).join('');
  },

  async loadScenario(id) {
    // First check local array
    let scenario = this.scenarios.find(s => s.id === id);

    // If not found locally, fetch from Supabase
    if (!scenario) {
      try {
        const rows = await cmFetchTable('fleet_scenarios', 'id=eq.' + id);
        if (!rows || rows.length === 0) { this.showToast('Scenario not found', 'error'); return; }
        const s = rows[0];
        const lanesRows = await cmFetchTable('fleet_lanes', 'scenario_id=eq.' + id + '&order=id.asc');
        scenario = {
          id: s.id,
          name: s.name || 'Untitled',
          config: s.config || {},
          results: s.results || null,
          lanes: (lanesRows || []).map(function(l) {
            return {
              origin: l.origin || '',
              destination: l.destination || '',
              weekly_shipments: l.weekly_shipments || 0,
              avg_weight: l.avg_weight_lbs || 0,
              avg_cube: l.avg_cube_ft3 || 0,
              delivery_window: l.delivery_window || '',
              distance_miles: l.distance_miles || 0
            };
          }),
          created_at: s.created_at ? new Date(s.created_at).toLocaleString() : ''
        };
        // Cache locally
        this.scenarios.push(scenario);
      } catch (e) {
        console.error('Error loading scenario from Supabase:', e);
        this.showToast('Error loading scenario', 'error');
        return;
      }
    }

    this.lanes = JSON.parse(JSON.stringify(scenario.lanes));
    this.config = JSON.parse(JSON.stringify(scenario.config));
    this.results = scenario.results ? JSON.parse(JSON.stringify(scenario.results)) : null;

    this.renderLanesTable();
    this.renderVehicleChecks();
    if (this.results) {
      this.renderResults();
      fmShowTab('results');
    } else {
      fmShowTab('lanes');
    }
    this.showToast(`Loaded scenario "${scenario.name}"`);
  },

  async deleteScenario(id) {
    if (!confirm('Delete this scenario?')) return;
    try {
      // Delete from Supabase
      await fetch(SUPABASE_URL + '/rest/v1/fleet_lanes?scenario_id=eq.' + id, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
      });
      await fetch(SUPABASE_URL + '/rest/v1/fleet_scenarios?id=eq.' + id, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
      });
    } catch (e) { console.error('Error deleting from Supabase:', e); }
    this.scenarios = this.scenarios.filter(s => s.id !== id);
    this.renderScenariosListLocal();
    this.showToast('Scenario deleted');
  },

  showToast(message) {
    let toast = document.getElementById('fm-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'fm-toast';
      toast.className = 'fm-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
  },

  // ── ROUTE VISUALIZATION MAP ──
  cityCoordinates: {
    'Chicago': [41.8781, -87.6298],
    'Atlanta': [33.7490, -84.3880],
    'Dallas': [32.7767, -96.7970],
    'Houston': [29.7604, -95.3698],
    'Los Angeles': [34.0522, -118.2437],
    'Phoenix': [33.4484, -112.0742],
    'New York': [40.7128, -74.0060],
    'Boston': [42.3601, -71.0589],
    'Philadelphia': [39.9526, -75.1652],
    'Detroit': [42.3314, -83.0458],
    'San Francisco': [37.7749, -122.4194],
    'Seattle': [47.6062, -122.3321],
    'Denver': [39.7392, -104.9903],
    'Miami': [25.7617, -80.1918],
    'Minneapolis': [44.9778, -93.2650],
    'Charlotte': [35.2271, -80.8431],
    'Nashville': [36.1627, -86.7816],
    'Memphis': [35.1495, -90.0490],
    'St. Louis': [38.6270, -90.1994],
    'Kansas City': [39.0997, -94.5786],
    'Indianapolis': [39.7684, -86.1581],
    'Columbus': [39.9612, -82.9988],
    'Portland': [45.5152, -122.6784],
    'Las Vegas': [36.1699, -115.1398],
    'Salt Lake City': [40.7608, -111.8910],
    'Austin': [30.2672, -97.7431],
    'San Antonio': [29.4241, -98.4936],
    'Jacksonville': [30.3322, -81.6557],
    'Tampa': [27.9506, -82.4572],
    'Cleveland': [41.4993, -81.6944],
    'Cincinnati': [39.1582, -84.4555],
    'Pittsburgh': [40.4406, -79.9959],
    'Milwaukee': [43.0389, -87.9065],
    'Albuquerque': [35.0844, -106.6504],
    'Tucson': [32.2226, -110.9747],
    'Fresno': [36.7469, -119.7726],
    'Sacramento': [38.5816, -121.4944],
    'Oakland': [37.8044, -122.2712],
    'Long Beach': [33.7701, -118.1937],
    'San Diego': [32.7157, -117.1611],
    'Bakersfield': [35.3733, -119.0187],
    'Stockton': [37.9577, -121.2908],
    'Riverside': [33.9530, -117.2822],
    'Providence': [41.8240, -71.4128],
    'Hartford': [41.7658, -72.6734],
    'Buffalo': [42.8864, -78.8784],
    'Rochester': [43.1566, -77.6088],
    'Louisville': [38.2527, -85.7585],
    'Lexington': [38.2009, -84.8733],
    'New Orleans': [29.9511, -90.2623],
    'Baton Rouge': [30.4515, -91.1871],
  },

  vehicleColors: {
    dry_van: '#2563eb',       // blue
    reefer: '#06b6d4',        // teal
    flatbed: '#f97316',       // orange
    straight_truck: '#10b981', // green
    sprinter_van: '#8b5cf6'   // purple
  },

  renderMap() {
    if (this.lanes.length === 0) {
      document.getElementById('fm-map-no-data').style.display = 'block';
      document.getElementById('fm-map-container').style.display = 'none';
      return;
    }

    document.getElementById('fm-map-no-data').style.display = 'none';
    document.getElementById('fm-map-container').style.display = 'block';

    // Calculate bounds
    const coords = [];
    this.lanes.forEach(lane => {
      const orig = this.cityCoordinates[lane.origin];
      const dest = this.cityCoordinates[lane.destination];
      if (orig) coords.push(orig);
      if (dest) coords.push(dest);
    });

    if (coords.length === 0) {
      document.getElementById('fm-map-no-data').style.display = 'block';
      document.getElementById('fm-map-container').style.display = 'none';
      this.showToast('No valid cities found in lanes');
      return;
    }

    // Initialize or clear map
    const mapDiv = document.getElementById('fm-leaflet-map');
    if (window.fmLeafletMap) {
      window.fmLeafletMap.remove();
    }

    // Center on first coordinate
    const centerLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const centerLng = coords.reduce((s, c) => s + c[1], 0) / coords.length;

    window.fmLeafletMap = L.map('fm-leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
      fadeAnimation: false
    }).setView([centerLat, centerLng], 4);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: ''
    }).addTo(window.fmLeafletMap);

    // Track route endpoints for clustering
    const locations = {};

    // Draw routes
    this.lanes.forEach((lane, idx) => {
      const orig = this.cityCoordinates[lane.origin];
      const dest = this.cityCoordinates[lane.destination];

      if (!orig || !dest) return;

      // Track locations
      if (!locations[lane.origin]) locations[lane.origin] = { name: lane.origin, inbound: 0, outbound: 0, lat: orig[0], lng: orig[1] };
      if (!locations[lane.destination]) locations[lane.destination] = { name: lane.destination, inbound: 0, outbound: 0, lat: dest[0], lng: dest[1] };

      locations[lane.origin].outbound += lane.weekly_shipments;
      locations[lane.destination].inbound += lane.weekly_shipments;

      // Determine line color based on primary vehicle type
      const primaryVehicle = this.config.vehicles[0] || 'dry_van';
      const color = this.vehicleColors[primaryVehicle];

      // Line weight proportional to weekly shipments (5-20 pixels)
      const maxShipments = Math.max(...this.lanes.map(l => l.weekly_shipments));
      const minWeight = 2, maxWeight = 8;
      const weight = minWeight + (lane.weekly_shipments / maxShipments) * (maxWeight - minWeight);

      const polyline = L.polyline([orig, dest], {
        color: color,
        weight: weight,
        opacity: 0.7,
        dashArray: lane.weekly_shipments < 3 ? '5,5' : 'none'
      }).addTo(window.fmLeafletMap);

      const shipmentLabel = lane.weekly_shipments === 1 ? 'shipment' : 'shipments';
      const vehicleType = this.vehicleSpecs[primaryVehicle]?.name || 'Vehicle';
      polyline.bindPopup(
        `<strong>${lane.origin} → ${lane.destination}</strong><br/>` +
        `${lane.weekly_shipments} ${shipmentLabel}/week<br/>` +
        `${vehicleType}<br/>` +
        `${lane.distance_miles ? lane.distance_miles + ' mi' : 'Distance TBD'}`
      );
    });

    // Draw location markers with clustering logic
    Object.values(locations).forEach(loc => {
      const totalShipments = loc.inbound + loc.outbound;
      const radius = Math.min(15, 6 + (totalShipments / 20) * 8);

      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: radius,
        fillColor: '#0047ab',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(window.fmLeafletMap);

      marker.bindPopup(
        `<strong>${loc.name}</strong><br/>` +
        `Inbound: ${loc.inbound} shipments<br/>` +
        `Outbound: ${loc.outbound} shipments`
      );
    });

    // Render legend
    this.renderMapLegend();

    // Fit bounds
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      window.fmLeafletMap.fitBounds(bounds, { padding: [50, 50] });
    }
  },

  renderMapLegend() {
    const legend = document.getElementById('fm-map-legend');
    let html = '<div class="fm-map-legend-title">Fleet Summary</div>';

    const vehicleLabels = {
      dry_van: 'Dry Van (53ft)',
      reefer: 'Reefer (53ft)',
      flatbed: 'Flatbed (48ft)',
      straight_truck: 'Straight Truck (26ft)',
      sprinter_van: 'Sprinter Van'
    };

    // Vehicle types
    html += '<div style="margin-bottom:12px;border-bottom:1px solid rgba(0,0,0,.08);padding-bottom:8px;">';
    this.config.vehicles.forEach(vtype => {
      const label = vehicleLabels[vtype];
      const color = this.vehicleColors[vtype];
      const count = this.results?.fleetMix?.[vtype] || 0;
      html += `
        <div class="fm-map-legend-item">
          <div class="fm-map-legend-swatch" style="background:${color};"></div>
          <span>${label} ${count > 0 ? `(${count})` : ''}</span>
        </div>
      `;
    });
    html += '</div>';

    // Route stats
    const totalRoutes = this.lanes.length;
    const totalWeeklyShipments = this.lanes.reduce((s, l) => s + l.weekly_shipments, 0);
    const utilization = this.results?.utilization || '—';

    html += `
      <div style="font-size:11px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>Routes:</span> <strong>${totalRoutes}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>Weekly Ships:</span> <strong>${totalWeeklyShipments}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>Utilization:</span> <strong>${utilization}%</strong>
        </div>
      </div>
    `;

    legend.innerHTML = html;
  },

  updateMapIfVisible() {
    const mapTab = document.getElementById('fm-tab-map');
    if (mapTab && mapTab.style.display !== 'none') {
      this.renderMap();
    }
  }
};

/* ── Standalone tab / navigation functions ── */

function fmShowTab(tabName) {
  document.querySelectorAll('.fm-tab-content').forEach(el => { el.style.display = 'none'; });
  document.querySelectorAll('.fm-tab').forEach(el => { el.classList.remove('active'); });

  const tabEl = document.getElementById('fm-tab-' + tabName);
  if (tabEl) tabEl.style.display = 'block';

  // Highlight the matching tab button
  var tabBtns = document.querySelectorAll('.fm-tab');
  tabBtns.forEach(function(btn) { if (btn.textContent.trim().toLowerCase().replace(/\s+/g,'') === tabName.replace(/\s+/g,'')) btn.classList.add('active'); });
  if (typeof event !== 'undefined' && event && event.target && event.target.classList) event.target.classList.add('active');

  // Render map when map tab is clicked
  if (tabName === 'map') {
    // Delay slightly to ensure container is visible
    setTimeout(() => { fmApp.renderMap(); }, 100);
  }

  // Load scenarios from Supabase when Scenarios tab is opened
  if (tabName === 'scenarios') {
    fmLoadScenariosFromSupabase();
  }
}

async function fmLoadScenariosFromSupabase() {
  try {
    const rows = await cmFetchTable('fleet_scenarios', 'order=created_at.desc');
    if (!rows || rows.length === 0) {
      // Keep whatever is in local array (may have unsaved scenarios)
      fmApp.renderScenariosListLocal();
      return;
    }
    // Merge Supabase scenarios into local array (avoid duplicates by id)
    const localIds = new Set(fmApp.scenarios.map(s => s.id));
    for (const s of rows) {
      if (!localIds.has(s.id)) {
        fmApp.scenarios.push({
          id: s.id,
          name: s.name || 'Untitled',
          config: s.config || {},
          results: s.results || null,
          lanes: [], // lanes loaded on demand when Load is clicked
          created_at: s.created_at ? new Date(s.created_at).toLocaleString() : ''
        });
      }
    }
    fmApp.renderScenariosListLocal();
  } catch (e) {
    console.error('Error fetching scenarios from Supabase:', e);
  }
}

/* ── Convenience wrappers (called from inline HTML handlers) ── */

function fmAddLane() { fmApp.addLane(); }
function fmRemoveLane(idx) { fmApp.removeLane(idx); }
function fmLoadDemoData() { fmApp.loadDemoData(); }
function fmUploadCSV() { fmApp.uploadCSV(); }
function fmProcessCSVUpload(evt) { fmApp.processCSVUpload(evt); }
function fmExportLanes() { fmApp.exportLanes(); }
function fmCalculateFleet() { fmApp.calculateFleet(); }
function fmSaveScenario() { fmApp.saveScenario(); }
function fmClearScenario() { fmApp.clearScenario(); }

/* ── Initialize on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
    fmApp.init();
});
