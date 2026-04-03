// ============================================================================
// ADMIN PANEL — Reference Data Management
// Extracted from index.html — admin CRUD for accounts, competitors, markets, verticals
// ============================================================================

// ── ADMIN PANEL — Reference Data Management ──
async function loadAdminPanel() {
  var tabsContainer = document.getElementById('admin-tabs-container');
  var tableContainer = document.getElementById('admin-table-container');

  if (!tabsContainer || !tableContainer) return;

  var tables = ['accounts', 'competitors', 'markets', 'verticals'];
  var tabsHtml = '<div class="admin-table-header"><input type="text" class="admin-search" placeholder="Search..." oninput="filterAdminTable(this.value)"/><button class="hub-btn" style="padding:var(--sp-10) var(--sp-16);font-size:13px;" onclick="showAdminFormModal(curAdminTable, null)">+ Add ' + tables[0] + '</button></div><div class="admin-tabs">';

  tables.forEach(function(table) {
    tabsHtml += '<button class="admin-tab-btn' + (table === 'accounts' ? ' active' : '') + '" onclick="switchAdminTab(\'' + table + '\')">' + table.charAt(0).toUpperCase() + table.slice(1) + '</button>';
  });
  tabsHtml += '</div>';

  tabsContainer.innerHTML = tabsHtml;

  window.curAdminTable = 'accounts';
  await loadAdminTable('accounts');
}

async function switchAdminTab(table) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  window.curAdminTable = table;
  var addBtn = document.querySelector('.admin-search').parentElement.querySelector('.hub-btn');
  addBtn.textContent = '+ Add ' + table.slice(0, -1);

  await loadAdminTable(table);
}

async function loadAdminTable(table) {
  var res;
  try {
    res = await sb.from('master_' + table).select('*').order('id', { ascending: true });
  } catch(e) {
    console.error('Error loading admin table:', e);
    showSectionError('sec-admin', 'Failed to load ' + table + ' data. Check your connection and try refreshing.');
    return;
  }
  if (res.error) {
    console.error('Error loading admin table:', res.error);
    showSectionError('sec-admin', 'Failed to load ' + table + ': ' + res.error.message);
    return;
  }
  clearSectionError('sec-admin');

  var rows = res.data || [];
  var html = '<table class="admin-data-table"><tbody>';

  if (table === 'accounts') {
    html += '<tr><th>Name</th><th>Vertical</th><th>Region</th><th>Type</th><th>Status</th><th>Actions</th></tr>';
    rows.forEach(function(row) {
      html += '<tr class="data-row"><td><strong>' + esc(row.name) + '</strong></td><td>' + esc(row.vertical || '—') + '</td><td>' + esc(row.region || '—') + '</td><td><span class="admin-badge">' + esc(row.account_type || 'prospect') + '</span></td><td><span class="status-dot status-' + (row.status === 'active' ? 'green' : 'gray') + '"></span></td><td><button class="admin-btn-sm" onclick="showAdminFormModal(\'accounts\', ' + row.id + ')">Edit</button> <button class="admin-btn-sm admin-btn-danger" onclick="deleteAdminRow(\'accounts\', ' + row.id + ')">Delete</button></td></tr>';
    });
  } else if (table === 'competitors') {
    html += '<tr><th>Name</th><th>Vertical</th><th>HQ Location</th><th>Status</th><th>Actions</th></tr>';
    rows.forEach(function(row) {
      html += '<tr class="data-row"><td><strong>' + esc(row.name) + '</strong></td><td>' + esc(row.primary_vertical || '—') + '</td><td>' + esc(row.hq_location || '—') + '</td><td><span class="status-dot status-' + (row.status === 'active' ? 'green' : 'gray') + '"></span></td><td><button class="admin-btn-sm" onclick="showAdminFormModal(\'competitors\', ' + row.id + ')">Edit</button> <button class="admin-btn-sm admin-btn-danger" onclick="deleteAdminRow(\'competitors\', ' + row.id + ')">Delete</button></td></tr>';
    });
  } else if (table === 'markets') {
    html += '<tr><th>City, State</th><th>Region</th><th>Tier</th><th>GXO Presence</th><th>Actions</th></tr>';
    rows.forEach(function(row) {
      html += '<tr class="data-row"><td><strong>' + esc(row.city) + ', ' + esc(row.state) + '</strong></td><td>' + esc(row.region || '—') + '</td><td><span class="admin-badge">' + esc(row.market_tier || '—') + '</span></td><td>' + esc(row.gxo_presence || '—') + '</td><td><button class="admin-btn-sm" onclick="showAdminFormModal(\'markets\', ' + row.id + ')">Edit</button> <button class="admin-btn-sm admin-btn-danger" onclick="deleteAdminRow(\'markets\', ' + row.id + ')">Delete</button></td></tr>';
    });
  } else if (table === 'verticals') {
    html += '<tr><th>Vertical</th><th>GXO Focus</th><th>Status</th><th>Actions</th></tr>';
    rows.forEach(function(row) {
      html += '<tr class="data-row"><td><strong>' + esc(row.vertical_name) + '</strong></td><td><span class="admin-badge">' + esc(row.gxo_focus_level || '—') + '</span></td><td><span class="status-dot status-' + (row.status === 'active' ? 'green' : 'gray') + '"></span></td><td><button class="admin-btn-sm" onclick="showAdminFormModal(\'verticals\', ' + row.id + ')">Edit</button> <button class="admin-btn-sm admin-btn-danger" onclick="deleteAdminRow(\'verticals\', ' + row.id + ')">Delete</button></td></tr>';
    });
  }

  html += '</tbody></table>';
  document.getElementById('admin-table-container').innerHTML = html;
}

/* ---------- Admin form helpers ---------- */
var adminFormStates = {
  US: ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'],
  CA: ['AB','BC','MB','NB','NL','NT','NS','NU','ON','PE','QC','SK','YT'],
  MX: ['AGU','BCN','BCS','CAM','CHP','CHH','CMX','COA','COL','DUR','GUA','GRO','HID','JAL','MEX','MIC','MOR','NAY','NLE','OAX','PUE','QUE','ROO','SLP','SIN','SON','TAB','TAM','TLA','VER','YUC','ZAC']
};
var adminFormStateNames = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
  AB:'Alberta',BC:'British Columbia',MB:'Manitoba',NB:'New Brunswick',NL:'Newfoundland',NT:'Northwest Territories',NS:'Nova Scotia',NU:'Nunavut',ON:'Ontario',PE:'Prince Edward Island',QC:'Quebec',SK:'Saskatchewan',YT:'Yukon'
};
/* State abbreviation → region auto-map */
var adminStateRegion = {
  CT:'Northeast',ME:'Northeast',MA:'Northeast',NH:'Northeast',NJ:'Northeast',NY:'Northeast',PA:'Northeast',RI:'Northeast',VT:'Northeast',DE:'Northeast',MD:'Northeast',
  IL:'Midwest',IN:'Midwest',IA:'Midwest',KS:'Midwest',MI:'Midwest',MN:'Midwest',MO:'Midwest',NE:'Midwest',ND:'Midwest',OH:'Midwest',SD:'Midwest',WI:'Midwest',
  AL:'Southeast',AR:'Southeast',FL:'Southeast',GA:'Southeast',KY:'Southeast',LA:'Southeast',MS:'Southeast',NC:'Southeast',SC:'Southeast',TN:'Southeast',VA:'Southeast',WV:'Southeast',
  AZ:'Southwest',NM:'Southwest',OK:'Southwest',TX:'Southwest',
  AK:'West',CA:'West',CO:'West',HI:'West',ID:'West',MT:'West',NV:'West',OR:'West',UT:'West',WA:'West',WY:'West'
};
var adminFormRegions = { US: ['Northeast','Midwest','Southeast','Southwest','West'], CA: ['Eastern Canada','Western Canada','Northern Canada'], MX: ['Northern Mexico','Central Mexico','Southern Mexico'] };
/* US cities database for autocomplete — city, state abbrev */
var adminCityDB = [
  ['Akron','OH'],['Albany','NY'],['Albuquerque','NM'],['Allentown','PA'],['Amarillo','TX'],['Anaheim','CA'],['Anchorage','AK'],['Ann Arbor','MI'],['Atlanta','GA'],['Augusta','GA'],['Aurora','CO'],['Austin','TX'],
  ['Bakersfield','CA'],['Baltimore','MD'],['Baton Rouge','LA'],['Beaumont','TX'],['Birmingham','AL'],['Boise','ID'],['Boston','MA'],['Bridgeport','CT'],['Brownsville','TX'],['Buffalo','NY'],
  ['Canton','OH'],['Cedar Rapids','IA'],['Central PA','PA'],['Charleston','SC'],['Charleston','WV'],['Charlotte','NC'],['Chattanooga','TN'],['Chicago','IL'],['Cincinnati','OH'],['Cleveland','OH'],['Colorado Springs','CO'],['Columbia','SC'],['Columbus','GA'],['Columbus','OH'],['Corpus Christi','TX'],
  ['Dallas','TX'],['Davenport','IA'],['Dayton','OH'],['Denver','CO'],['Des Moines','IA'],['Detroit','MI'],['Durham','NC'],
  ['El Paso','TX'],['Erie','PA'],['Eugene','OR'],['Evansville','IN'],
  ['Fayetteville','AR'],['Fort Lauderdale','FL'],['Fort Wayne','IN'],['Fort Worth','TX'],['Fresno','CA'],
  ['Grand Rapids','MI'],['Greensboro','NC'],['Greenville','SC'],['Gulfport','MS'],
  ['Harrisburg','PA'],['Hartford','CT'],['Henderson','NV'],['Honolulu','HI'],['Houston','TX'],['Huntsville','AL'],
  ['Indianapolis','IN'],['Inland Empire','CA'],['Irving','TX'],
  ['Jackson','MS'],['Jacksonville','FL'],['Jersey City','NJ'],
  ['Kansas City','KS'],['Kansas City','MO'],['Knoxville','TN'],
  ['Lafayette','LA'],['Lakeland','FL'],['Lancaster','PA'],['Laredo','TX'],['Las Vegas','NV'],['Lehigh Valley','PA'],['Lexington','KY'],['Lincoln','NE'],['Little Rock','AR'],['Long Beach','CA'],['Los Angeles','CA'],['Louisville','KY'],['Lubbock','TX'],
  ['Macon','GA'],['Madison','WI'],['McAllen','TX'],['Memphis','TN'],['Mesa','AZ'],['Miami','FL'],['Milwaukee','WI'],['Minneapolis','MN'],['Mobile','AL'],['Montgomery','AL'],
  ['Nashville','TN'],['New Haven','CT'],['New Orleans','LA'],['New York','NY'],['Newark','NJ'],['Norfolk','VA'],
  ['Oakland','CA'],['Oklahoma City','OK'],['Omaha','NE'],['Ontario','CA'],['Orlando','FL'],
  ['Palm Beach','FL'],['Pensacola','FL'],['Peoria','IL'],['Philadelphia','PA'],['Phoenix','AZ'],['Pittsburgh','PA'],['Portland','ME'],['Portland','OR'],['Providence','RI'],
  ['Raleigh','NC'],['Reno','NV'],['Richmond','VA'],['Riverside','CA'],['Rochester','NY'],['Rockford','IL'],
  ['Sacramento','CA'],['Salt Lake City','UT'],['San Antonio','TX'],['San Bernardino','CA'],['San Diego','CA'],['San Francisco','CA'],['San Jose','CA'],['Santa Fe','NM'],['Savannah','GA'],['Scranton','PA'],['Seattle','WA'],['Shreveport','LA'],['Sioux Falls','SD'],['South Bend','IN'],['Spokane','WA'],['Springfield','IL'],['Springfield','MO'],['St. Louis','MO'],['St. Paul','MN'],['Stockton','CA'],['Syracuse','NY'],
  ['Tacoma','WA'],['Tallahassee','FL'],['Tampa','FL'],['Toledo','OH'],['Tracy','CA'],['Trenton','NJ'],['Tucson','AZ'],['Tulsa','OK'],
  ['Virginia Beach','VA'],
  ['Waco','TX'],['Washington','DC'],['West Palm Beach','FL'],['Wichita','KS'],['Wilmington','DE'],['Wilmington','NC'],['Winston-Salem','NC'],['Worcester','MA'],
  ['York','PA'],['Youngstown','OH']
];
var adminFormVerticals = [];
async function adminGetVerticals() {
  if (adminFormVerticals.length) return adminFormVerticals;
  var r = await sb.from('master_verticals').select('vertical_name').eq('status','active').order('vertical_name');
  adminFormVerticals = (r.data || []).map(function(v) { return v.vertical_name; });
  return adminFormVerticals;
}

function adminMakeGroup(labelText, inputEl, hint) {
  var g = document.createElement('div');
  g.className = 'admin-form-group';
  var lbl = document.createElement('label');
  lbl.textContent = labelText;
  g.appendChild(lbl);
  g.appendChild(inputEl);
  if (hint) { var h = document.createElement('div'); h.className = 'admin-form-hint'; h.textContent = hint; g.appendChild(h); }
  var err = document.createElement('div'); err.className = 'admin-form-error'; g.appendChild(err);
  return g;
}
function adminMakeInput(id, placeholder, value) {
  var inp = document.createElement('input');
  inp.type = 'text'; inp.id = id; inp.placeholder = placeholder || ''; inp.value = value || '';
  return inp;
}
function adminMakeSelect(id, options, selected) {
  var sel = document.createElement('select');
  sel.id = id;
  var ph = document.createElement('option'); ph.value = ''; ph.textContent = '— Select —'; ph.disabled = true;
  if (!selected) ph.selected = true;
  sel.appendChild(ph);
  options.forEach(function(opt) {
    var o = document.createElement('option');
    o.value = opt; o.textContent = opt;
    if (opt === selected) o.selected = true;
    sel.appendChild(o);
  });
  return sel;
}
function adminMakeTextarea(id, placeholder, value) {
  var ta = document.createElement('textarea');
  ta.id = id; ta.placeholder = placeholder || ''; ta.value = value || '';
  return ta;
}

function adminPopulateStates(countryVal, stateEl, currentState) {
  var opts = adminFormStates[countryVal] || adminFormStates['US'];
  stateEl.innerHTML = '';
  var ph = document.createElement('option'); ph.value = ''; ph.textContent = '— Select State/Province —'; ph.disabled = true;
  if (!currentState) ph.selected = true;
  stateEl.appendChild(ph);
  opts.forEach(function(s) {
    var o = document.createElement('option'); o.value = s;
    o.textContent = (adminFormStateNames[s] || s) + ' (' + s + ')';
    if (s === currentState) o.selected = true;
    stateEl.appendChild(o);
  });
}
function adminPopulateRegions(countryVal, regionEl, currentRegion) {
  var opts = adminFormRegions[countryVal] || adminFormRegions['US'];
  regionEl.innerHTML = '';
  var ph = document.createElement('option'); ph.value = ''; ph.textContent = '— Select Region —'; ph.disabled = true;
  if (!currentRegion) ph.selected = true;
  regionEl.appendChild(ph);
  opts.forEach(function(r) {
    var o = document.createElement('option'); o.value = r; o.textContent = r;
    if (r === currentRegion) o.selected = true;
    regionEl.appendChild(o);
  });
}

function adminShowToast(msg, type) {
  var t = document.createElement('div');
  t.className = 'admin-toast toast-' + (type || 'success');
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function() { t.classList.add('toast-show'); });
  setTimeout(function() { t.classList.remove('toast-show'); setTimeout(function() { t.remove(); }, 300); }, 3000);
}

async function showAdminFormModal(table, rowId) {
  var isNew = !rowId;
  var titleMap = { accounts: 'Account', competitors: 'Competitor', markets: 'Market', verticals: 'Vertical' };
  var title = (isNew ? 'Add ' : 'Edit ') + (titleMap[table] || table);
  var row = rowId ? (await sb.from('master_' + table).select('*').eq('id', rowId)).data[0] : null;

  var overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.onclick = closeAdminModal;

  var modal = document.createElement('div');
  modal.className = 'admin-modal';
  modal.onclick = function(e) { e.stopPropagation(); };

  var header = document.createElement('div');
  header.className = 'admin-modal-header';
  header.innerHTML = '<h3>' + title + '</h3><button onclick="closeAdminModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--ies-gray-600);">&times;</button>';

  var body = document.createElement('div');
  body.className = 'admin-modal-body';

  if (table === 'accounts') {
    var verts = await adminGetVerticals();
    body.appendChild(adminMakeGroup('Account Name', adminMakeInput('admin-form-name', 'e.g., Nike, PepsiCo', row?.name || '')));
    body.appendChild(adminMakeGroup('Vertical', adminMakeSelect('admin-form-vertical', verts, row?.vertical || '')));
    body.appendChild(adminMakeGroup('Region', adminMakeInput('admin-form-region', 'e.g., North America, EMEA', row?.region || '')));
    var row2 = document.createElement('div');
    row2.className = 'admin-form-row';
    row2.appendChild(adminMakeGroup('Account Type', adminMakeSelect('admin-form-type', ['prospect','customer','won','lost'], row?.account_type || '')));
    row2.appendChild(adminMakeGroup('Company Size', adminMakeSelect('admin-form-size', ['enterprise','mid-market','small'], row?.company_size || '')));
    body.appendChild(row2);
    var row3 = document.createElement('div');
    row3.className = 'admin-form-row';
    row3.appendChild(adminMakeGroup('Status', adminMakeSelect('admin-form-status', ['active','inactive'], row?.status || 'active')));
    body.appendChild(row3);

  } else if (table === 'competitors') {
    var verts2 = await adminGetVerticals();
    body.appendChild(adminMakeGroup('Competitor Name', adminMakeInput('admin-form-name', 'e.g., DHL Supply Chain', row?.name || '')));
    body.appendChild(adminMakeGroup('Primary Vertical', adminMakeSelect('admin-form-vertical', verts2, row?.primary_vertical || '')));
    body.appendChild(adminMakeGroup('HQ Location', adminMakeInput('admin-form-hq', 'e.g., Bonn, Germany', row?.hq_location || '')));
    var row4 = document.createElement('div');
    row4.className = 'admin-form-row';
    row4.appendChild(adminMakeGroup('Intelligence Score', (function() { var inp = adminMakeInput('admin-form-score', '0–100', row?.intelligence_score ?? ''); inp.type = 'number'; inp.min = 0; inp.max = 100; return inp; })(), 'Competitive threat assessment (0–100)'));
    row4.appendChild(adminMakeGroup('Status', adminMakeSelect('admin-form-status', ['active','inactive'], row?.status || 'active')));
    body.appendChild(row4);

  } else if (table === 'markets') {
    /* Detect current country from existing state if editing */
    var detectedCountry = 'US';
    if (row?.state) {
      if (adminFormStates.CA.indexOf(row.state) !== -1) detectedCountry = 'CA';
      else if (adminFormStates.MX.indexOf(row.state) !== -1) detectedCountry = 'MX';
    }
    var countryEl = adminMakeSelect('admin-form-country', ['US','CA','MX'], detectedCountry);
    body.appendChild(adminMakeGroup('Country', countryEl));

    /* City autocomplete input */
    var cityInput = adminMakeInput('admin-form-city', 'Start typing a city name…', row?.city || '');
    cityInput.setAttribute('autocomplete', 'off');
    var cityGroup = adminMakeGroup('City', cityInput);
    /* Autocomplete dropdown container */
    var acDropdown = document.createElement('div');
    acDropdown.className = 'admin-ac-dropdown';
    acDropdown.style.cssText = 'display:none;position:absolute;left:0;right:0;top:100%;background:#fff;border:1px solid var(--ies-gray-300);border-radius:var(--radius-sm);max-height:200px;overflow-y:auto;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.15);';
    /* Make the form group relatively positioned for dropdown */
    cityGroup.style.position = 'relative';
    cityGroup.appendChild(acDropdown);
    body.appendChild(cityGroup);

    var stateEl = adminMakeSelect('admin-form-state', [], null);
    adminPopulateStates(detectedCountry, stateEl, row?.state || '');
    body.appendChild(adminMakeGroup('State / Province', stateEl));

    var regionEl = adminMakeSelect('admin-form-region', [], null);
    adminPopulateRegions(detectedCountry, regionEl, row?.region || '');
    body.appendChild(adminMakeGroup('Region', regionEl));

    /* City autocomplete logic */
    var acSelectedIndex = -1;
    function acRender(matches) {
      acDropdown.innerHTML = '';
      if (!matches.length) { acDropdown.style.display = 'none'; return; }
      matches.forEach(function(m, idx) {
        var item = document.createElement('div');
        item.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid #f0f0f0;';
        item.innerHTML = '<strong>' + m[0] + '</strong>, ' + m[1] + ' <span style="color:var(--ies-gray-500);font-size:11px;margin-left:4px;">' + (adminStateRegion[m[1]] || '') + '</span>';
        item.onmouseenter = function() {
          acDropdown.querySelectorAll('div').forEach(function(d) { d.style.background = ''; });
          item.style.background = 'var(--ies-gray-100)';
          acSelectedIndex = idx;
        };
        item.onmouseleave = function() { item.style.background = ''; };
        item.onmousedown = function(e) { e.preventDefault(); acSelect(m); };
        acDropdown.appendChild(item);
      });
      acDropdown.style.display = 'block';
      acSelectedIndex = -1;
    }
    function acSelect(match) {
      cityInput.value = match[0];
      acDropdown.style.display = 'none';
      /* Auto-set state */
      var stAbbr = match[1];
      /* Ensure state option exists */
      if (!stateEl.querySelector('option[value="' + stAbbr + '"]')) {
        adminPopulateStates(countryEl.value, stateEl, stAbbr);
      }
      stateEl.value = stAbbr;
      /* Auto-set region from state */
      var autoRegion = adminStateRegion[stAbbr] || '';
      if (autoRegion) {
        regionEl.value = autoRegion;
      }
      /* Trigger geocode */
      tryGeocode();
    }
    cityInput.addEventListener('input', function() {
      var q = cityInput.value.trim().toLowerCase();
      if (q.length < 2) { acDropdown.style.display = 'none'; return; }
      var country = countryEl.value;
      var matches;
      if (country === 'US') {
        matches = adminCityDB.filter(function(c) { return c[0].toLowerCase().indexOf(q) === 0; }).slice(0, 8);
        /* Also include partial matches that don't start with q */
        if (matches.length < 8) {
          var partial = adminCityDB.filter(function(c) { return c[0].toLowerCase().indexOf(q) > 0; }).slice(0, 8 - matches.length);
          matches = matches.concat(partial);
        }
      } else {
        matches = [];
      }
      acRender(matches);
    });
    cityInput.addEventListener('keydown', function(e) {
      var items = acDropdown.querySelectorAll('div');
      if (!items.length || acDropdown.style.display === 'none') return;
      if (e.key === 'ArrowDown') { e.preventDefault(); acSelectedIndex = Math.min(acSelectedIndex + 1, items.length - 1); items.forEach(function(d,i) { d.style.background = i === acSelectedIndex ? 'var(--ies-gray-100)' : ''; }); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); acSelectedIndex = Math.max(acSelectedIndex - 1, 0); items.forEach(function(d,i) { d.style.background = i === acSelectedIndex ? 'var(--ies-gray-100)' : ''; }); }
      else if (e.key === 'Enter' && acSelectedIndex >= 0) {
        e.preventDefault();
        var q2 = cityInput.value.trim().toLowerCase();
        var country2 = countryEl.value;
        var m2 = country2 === 'US' ? adminCityDB.filter(function(c) { return c[0].toLowerCase().indexOf(q2) !== -1; }) : [];
        if (m2[acSelectedIndex]) acSelect(m2[acSelectedIndex]);
      }
      else if (e.key === 'Escape') { acDropdown.style.display = 'none'; }
    });
    cityInput.addEventListener('blur', function() { setTimeout(function() { acDropdown.style.display = 'none'; }, 200); });

    /* When country changes, repopulate state & region */
    countryEl.onchange = function() {
      adminPopulateStates(countryEl.value, stateEl, '');
      adminPopulateRegions(countryEl.value, regionEl, '');
    };

    /* When state changes manually, auto-set region */
    stateEl.addEventListener('change', function() {
      var autoReg = adminStateRegion[stateEl.value];
      if (autoReg) regionEl.value = autoReg;
      tryGeocode();
    });

    var row5 = document.createElement('div');
    row5.className = 'admin-form-row';
    row5.appendChild(adminMakeGroup('Market Tier', adminMakeSelect('admin-form-tier', ['Tier 1','Tier 2','Tier 3'], row?.market_tier || '')));
    row5.appendChild(adminMakeGroup('GXO Presence', adminMakeSelect('admin-form-presence', ['yes','no','planned'], row?.gxo_presence || '')));
    body.appendChild(row5);

    var row6 = document.createElement('div');
    row6.className = 'admin-form-row';
    row6.appendChild(adminMakeGroup('Status', adminMakeSelect('admin-form-status', ['active','inactive'], row?.status || 'active')));
    body.appendChild(row6);

    var row7m = document.createElement('div');
    row7m.className = 'admin-form-row';
    var latGroup = adminMakeGroup('Latitude', (function() { var inp = adminMakeInput('admin-form-lat', 'Auto-filled from city', row?.latitude ?? ''); inp.type = 'number'; inp.step = 'any'; return inp; })(), 'Auto-fills when city is selected');
    var lngGroup = adminMakeGroup('Longitude', (function() { var inp = adminMakeInput('admin-form-lng', 'Auto-filled from city', row?.longitude ?? ''); inp.type = 'number'; inp.step = 'any'; return inp; })(), 'Auto-fills when city is selected');
    row7m.appendChild(latGroup);
    row7m.appendChild(lngGroup);
    body.appendChild(row7m);

    /* Auto-geocode status */
    var geocodeStatus = document.createElement('div');
    geocodeStatus.id = 'admin-geocode-status';
    geocodeStatus.style.cssText = 'font-size:11px;color:var(--ies-gray-500);margin-top:-8px;min-height:16px;';
    body.appendChild(geocodeStatus);

    function tryGeocode() {
      var city = cityInput.value.trim();
      var state = stateEl.value;
      var country = countryEl.value;
      if (!city || !state) return;
      var latEl = latGroup.querySelector('input');
      var lngEl = lngGroup.querySelector('input');
      if (!latEl || !lngEl) return;
      if (latEl.value && lngEl.value && latEl.dataset.manual) return;
      var stateName = adminFormStateNames[state] || state;
      var countryCode = { US: 'us', CA: 'ca', MX: 'mx' }[country] || 'us';
      geocodeStatus.textContent = 'Looking up coordinates…';
      geocodeStatus.style.color = 'var(--ies-blue)';
      fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(city + ', ' + stateName + ', ' + countryCode), { headers: { 'Accept': 'application/json' } })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.length > 0) {
            latEl.value = parseFloat(data[0].lat).toFixed(4);
            lngEl.value = parseFloat(data[0].lon).toFixed(4);
            geocodeStatus.innerHTML = '&#10003; Coordinates found: ' + latEl.value + ', ' + lngEl.value;
            geocodeStatus.style.color = '#059669';
          } else {
            geocodeStatus.textContent = 'Could not find coordinates — enter manually';
            geocodeStatus.style.color = 'var(--ies-orange)';
          }
        })
        .catch(function() {
          geocodeStatus.textContent = 'Geocode lookup failed — enter coordinates manually';
          geocodeStatus.style.color = 'var(--ies-red)';
        });
    }
    var latInput = latGroup.querySelector('input');
    var lngInput = lngGroup.querySelector('input');
    if (latInput) latInput.addEventListener('input', function() { this.dataset.manual = '1'; });
    if (lngInput) lngInput.addEventListener('input', function() { this.dataset.manual = '1'; });

  } else if (table === 'verticals') {
    body.appendChild(adminMakeGroup('Vertical Name', adminMakeInput('admin-form-name', 'e.g., Food & Beverage', row?.vertical_name || '')));
    body.appendChild(adminMakeGroup('Description', adminMakeTextarea('admin-form-desc', 'Brief description of the vertical…', row?.description || '')));
    var row7 = document.createElement('div');
    row7.className = 'admin-form-row';
    row7.appendChild(adminMakeGroup('GXO Focus Level', adminMakeSelect('admin-form-focus', ['high','medium','low'], row?.gxo_focus_level || '')));
    row7.appendChild(adminMakeGroup('Status', adminMakeSelect('admin-form-status', ['active','inactive'], row?.status || 'active')));
    body.appendChild(row7);
  }

  var actions = document.createElement('div');
  actions.className = 'admin-modal-actions';
  var btnSave = document.createElement('button');
  btnSave.className = 'hub-btn hub-btn-primary';
  btnSave.textContent = isNew ? 'Add ' + (titleMap[table] || '') : 'Save Changes';
  btnSave.onclick = function() { saveAdminRow(table, rowId || null); };

  var btnCancel = document.createElement('button');
  btnCancel.className = 'hub-btn hub-btn-secondary';
  btnCancel.textContent = 'Cancel';
  btnCancel.onclick = closeAdminModal;

  actions.appendChild(btnCancel);
  actions.appendChild(btnSave);

  body.appendChild(actions);
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function closeAdminModal() {
  var modal = document.querySelector('.admin-modal-overlay');
  if (modal) modal.remove();
}

function adminVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function adminSetError(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  var grp = el.closest('.admin-form-group');
  if (grp) { grp.classList.add('has-error'); var err = grp.querySelector('.admin-form-error'); if (err) err.textContent = msg; }
}
function adminClearErrors() { document.querySelectorAll('.admin-form-group.has-error').forEach(function(g) { g.classList.remove('has-error'); }); }

async function saveAdminRow(table, rowId) {
  adminClearErrors();
  var isNew = !rowId;
  var data = {};
  var errors = [];

  if (table === 'accounts') {
    var name = adminVal('admin-form-name');
    if (!name) { errors.push('admin-form-name'); adminSetError('admin-form-name', 'Account name is required'); }
    data = {
      name: name,
      vertical: adminVal('admin-form-vertical'),
      region: adminVal('admin-form-region'),
      account_type: adminVal('admin-form-type') || 'prospect',
      company_size: adminVal('admin-form-size') || null,
      status: adminVal('admin-form-status') || 'active'
    };
  } else if (table === 'competitors') {
    var cname = adminVal('admin-form-name');
    if (!cname) { errors.push('admin-form-name'); adminSetError('admin-form-name', 'Competitor name is required'); }
    var score = adminVal('admin-form-score');
    if (score && (isNaN(+score) || +score < 0 || +score > 100)) { errors.push('admin-form-score'); adminSetError('admin-form-score', 'Must be 0–100'); }
    data = {
      name: cname,
      primary_vertical: adminVal('admin-form-vertical') || null,
      hq_location: adminVal('admin-form-hq') || null,
      intelligence_score: score ? +score : null,
      status: adminVal('admin-form-status') || 'active'
    };
  } else if (table === 'markets') {
    var city = adminVal('admin-form-city');
    var state = adminVal('admin-form-state');
    var region = adminVal('admin-form-region');
    if (!city) { errors.push('admin-form-city'); adminSetError('admin-form-city', 'City name is required'); }
    if (!state) { errors.push('admin-form-state'); adminSetError('admin-form-state', 'Please select a state/province'); }
    if (!region) { errors.push('admin-form-region'); adminSetError('admin-form-region', 'Please select a region'); }
    var latVal = adminVal('admin-form-lat');
    var lngVal = adminVal('admin-form-lng');
    data = {
      city: city,
      state: state,
      region: region,
      country: adminVal('admin-form-country') || 'US',
      market_tier: adminVal('admin-form-tier') || 'Tier 2',
      gxo_presence: adminVal('admin-form-presence') || 'no',
      latitude: latVal ? parseFloat(latVal) : null,
      longitude: lngVal ? parseFloat(lngVal) : null,
      labor_key: city,
      re_key: city,
      status: adminVal('admin-form-status') || 'active'
    };
  } else if (table === 'verticals') {
    var vname = adminVal('admin-form-name');
    if (!vname) { errors.push('admin-form-name'); adminSetError('admin-form-name', 'Vertical name is required'); }
    data = {
      vertical_name: vname,
      description: adminVal('admin-form-desc') || null,
      gxo_focus_level: adminVal('admin-form-focus') || 'medium',
      status: adminVal('admin-form-status') || 'active'
    };
  }

  if (errors.length) { document.getElementById(errors[0]).focus(); return; }

  var res;
  if (isNew) {
    res = await sb.from('master_' + table).insert([data]);
  } else {
    res = await sb.from('master_' + table).update(data).eq('id', rowId);
  }

  if (res.error) {
    adminShowToast('Save failed: ' + res.error.message, 'error');
  } else {
    adminShowToast((isNew ? 'Added' : 'Updated') + ' successfully', 'success');
    closeAdminModal();
    adminFormVerticals = []; /* bust cache if verticals changed */
    /* Bust market caches so Map Explorer picks up changes immediately */
    if (table === 'markets') {
      marketCache = {};
      MARKET_PINS = await loadMarketPins();
      /* If map is already initialized, refresh pins */
      if (typeof marketMap !== 'undefined' && marketMap) {
        marketMap.eachLayer(function(l) { if (l instanceof L.CircleMarker) marketMap.removeLayer(l); });
        MARKET_PINS.forEach(function(pin) {
          var tierSize = pin.tier === 'Tier 1' ? 10 : pin.tier === 'Tier 2' ? 7 : 5;
          var presColor = pin.presence === 'yes' ? '#00c853' : pin.presence === 'planned' ? '#ff9100' : '#90a4ae';
          var marker = L.circleMarker([pin.lat, pin.lng], {
            radius: tierSize, fillColor: presColor, color: '#fff', weight: 2.5,
            opacity: 1, fillOpacity: 0.85
          }).addTo(marketMap);
          marker.bindTooltip('<strong>' + pin.name + '</strong><br><span style="font-size:11px;">Click for detail</span>');
          marker.on('click', function() { selectMarket(pin.name, marker); });
          pin.marker = marker;
        });
        colorPinsByLabor();
      }
    }
    await loadAdminTable(table);
  }
}

async function deleteAdminRow(table, rowId) {
  if (!confirm('Delete this row? This cannot be undone.')) return;
  await sb.from('master_' + table).delete().eq('id', rowId);
  await loadAdminTable(table);
}

function filterAdminTable(query) {
  var rows = document.querySelectorAll('.data-row');
  rows.forEach(function(row) {
    var text = row.textContent.toLowerCase();
    row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
  });
}

