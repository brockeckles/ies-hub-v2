// ============================================================================
// network-opt.js
// Network Optimization, Center of Gravity, Warehouse Sizing Calculator,
// and Enterprise Network Optimization modules
// Extracted from index.html
// ============================================================================

// ── WSC Number Input Formatter ──
// Formats number inputs with commas on blur, strips on focus
function wscFormatInputs() {
  var ids = ['wsc-peakunits','wsc-avgunits','wsc-inpal','wsc-outpal'];
  ids.forEach(function(id) {
    var inp = document.getElementById(id);
    if (!inp || inp.dataset.wscFmt) return;
    inp.dataset.wscFmt = '1';
    inp.type = 'text';
    inp.style.fontVariantNumeric = 'tabular-nums';
    // Format initial value
    var v = parseInt(inp.value.replace(/,/g,''), 10);
    if (!isNaN(v)) inp.value = v.toLocaleString();
    inp.addEventListener('focus', function() {
      var n = parseInt(this.value.replace(/,/g,''), 10);
      this.value = isNaN(n) ? '' : String(n);
      this.select();
    });
    inp.addEventListener('blur', function() {
      var n = parseInt(this.value.replace(/,/g,''), 10);
      if (!isNaN(n)) this.value = n.toLocaleString();
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// CENTER OF GRAVITY / NETWORK OPTIMIZATION TOOL
// ═══════════════════════════════════════════════════════════════

// ═══════════════════ NETWORK OPTIMIZATION TOOL ═══════════════════

// ── US CITY DATABASE (top ~120 logistics markets with lat/lng) ──
var NET_CITIES = [
  {c:'Atlanta, GA',s:'GA',lat:33.749,lng:-84.388},{c:'Austin, TX',s:'TX',lat:30.267,lng:-97.743},
  {c:'Baltimore, MD',s:'MD',lat:39.290,lng:-76.612},{c:'Birmingham, AL',s:'AL',lat:33.521,lng:-86.802},
  {c:'Boise, ID',s:'ID',lat:43.615,lng:-116.202},{c:'Boston, MA',s:'MA',lat:42.360,lng:-71.059},
  {c:'Buffalo, NY',s:'NY',lat:42.887,lng:-78.879},{c:'Charlotte, NC',s:'NC',lat:35.227,lng:-80.843},
  {c:'Charleston, SC',s:'SC',lat:32.777,lng:-79.931},{c:'Chattanooga, TN',s:'TN',lat:35.046,lng:-85.309},
  {c:'Chicago, IL',s:'IL',lat:41.878,lng:-87.630},{c:'Cincinnati, OH',s:'OH',lat:39.103,lng:-84.512},
  {c:'Cleveland, OH',s:'OH',lat:41.500,lng:-81.694},{c:'Colorado Springs, CO',s:'CO',lat:38.834,lng:-104.821},
  {c:'Columbia, SC',s:'SC',lat:34.000,lng:-81.035},{c:'Columbus, OH',s:'OH',lat:39.961,lng:-82.999},
  {c:'Dallas, TX',s:'TX',lat:32.777,lng:-96.797},{c:'Dayton, OH',s:'OH',lat:39.759,lng:-84.192},
  {c:'Denver, CO',s:'CO',lat:39.739,lng:-104.990},{c:'Des Moines, IA',s:'IA',lat:41.586,lng:-93.625},
  {c:'Detroit, MI',s:'MI',lat:42.331,lng:-83.046},{c:'El Paso, TX',s:'TX',lat:31.762,lng:-106.485},
  {c:'Fort Worth, TX',s:'TX',lat:32.756,lng:-97.331},{c:'Fresno, CA',s:'CA',lat:36.738,lng:-119.784},
  {c:'Grand Rapids, MI',s:'MI',lat:42.963,lng:-85.668},{c:'Greensboro, NC',s:'NC',lat:36.073,lng:-79.792},
  {c:'Greenville, SC',s:'SC',lat:34.852,lng:-82.394},{c:'Harrisburg, PA',s:'PA',lat:40.264,lng:-76.884},
  {c:'Hartford, CT',s:'CT',lat:41.764,lng:-72.685},{c:'Houston, TX',s:'TX',lat:29.760,lng:-95.370},
  {c:'Huntsville, AL',s:'AL',lat:34.730,lng:-86.586},{c:'Indianapolis, IN',s:'IN',lat:39.768,lng:-86.158},
  {c:'Jacksonville, FL',s:'FL',lat:30.332,lng:-81.656},{c:'Kansas City, MO',s:'MO',lat:39.100,lng:-94.579},
  {c:'Knoxville, TN',s:'TN',lat:35.964,lng:-83.921},{c:'Lakeland, FL',s:'FL',lat:28.040,lng:-81.950},
  {c:'Laredo, TX',s:'TX',lat:27.506,lng:-99.507},{c:'Las Vegas, NV',s:'NV',lat:36.169,lng:-115.140},
  {c:'Lehigh Valley, PA',s:'PA',lat:40.602,lng:-75.470},{c:'Little Rock, AR',s:'AR',lat:34.747,lng:-92.290},
  {c:'Los Angeles, CA',s:'CA',lat:34.052,lng:-118.244},{c:'Louisville, KY',s:'KY',lat:38.253,lng:-85.760},
  {c:'Memphis, TN',s:'TN',lat:35.150,lng:-90.049},{c:'Miami, FL',s:'FL',lat:25.762,lng:-80.192},
  {c:'Milwaukee, WI',s:'WI',lat:43.039,lng:-87.907},{c:'Minneapolis, MN',s:'MN',lat:44.978,lng:-93.265},
  {c:'Mobile, AL',s:'AL',lat:30.695,lng:-88.040},{c:'Nashville, TN',s:'TN',lat:36.163,lng:-86.782},
  {c:'New Orleans, LA',s:'LA',lat:29.951,lng:-90.072},{c:'New York, NY',s:'NY',lat:40.713,lng:-74.006},
  {c:'Newark, NJ',s:'NJ',lat:40.736,lng:-74.172},{c:'Norfolk, VA',s:'VA',lat:36.851,lng:-76.286},
  {c:'Oakland, CA',s:'CA',lat:37.805,lng:-122.272},{c:'Oklahoma City, OK',s:'OK',lat:35.468,lng:-97.516},
  {c:'Omaha, NE',s:'NE',lat:41.257,lng:-95.995},{c:'Orlando, FL',s:'FL',lat:28.538,lng:-81.379},
  {c:'Philadelphia, PA',s:'PA',lat:39.953,lng:-75.164},{c:'Phoenix, AZ',s:'AZ',lat:33.449,lng:-112.074},
  {c:'Pittsburgh, PA',s:'PA',lat:40.441,lng:-79.996},{c:'Portland, OR',s:'OR',lat:45.505,lng:-122.676},
  {c:'Raleigh, NC',s:'NC',lat:35.779,lng:-78.638},{c:'Reno, NV',s:'NV',lat:39.530,lng:-119.814},
  {c:'Richmond, VA',s:'VA',lat:37.541,lng:-77.434},{c:'Riverside, CA',s:'CA',lat:33.953,lng:-117.396},
  {c:'Rochester, NY',s:'NY',lat:43.157,lng:-77.616},{c:'Sacramento, CA',s:'CA',lat:38.582,lng:-121.494},
  {c:'Salt Lake City, UT',s:'UT',lat:40.761,lng:-111.891},{c:'San Antonio, TX',s:'TX',lat:29.425,lng:-98.494},
  {c:'San Diego, CA',s:'CA',lat:32.716,lng:-117.161},{c:'San Francisco, CA',s:'CA',lat:37.775,lng:-122.419},
  {c:'Savannah, GA',s:'GA',lat:32.081,lng:-81.091},{c:'Seattle, WA',s:'WA',lat:47.606,lng:-122.332},
  {c:'Shreveport, LA',s:'LA',lat:32.525,lng:-93.750},{c:'Spokane, WA',s:'WA',lat:47.659,lng:-117.426},
  {c:'Springfield, MO',s:'MO',lat:37.209,lng:-93.292},{c:'St. Louis, MO',s:'MO',lat:38.627,lng:-90.199},
  {c:'Syracuse, NY',s:'NY',lat:43.049,lng:-76.147},{c:'Tampa, FL',s:'FL',lat:27.951,lng:-82.458},
  {c:'Toledo, OH',s:'OH',lat:41.654,lng:-83.536},{c:'Tucson, AZ',s:'AZ',lat:32.222,lng:-110.975},
  {c:'Tulsa, OK',s:'OK',lat:36.154,lng:-95.993},{c:'Virginia Beach, VA',s:'VA',lat:36.853,lng:-75.978},
  {c:'Wichita, KS',s:'KS',lat:37.688,lng:-97.336},{c:'Wilmington, NC',s:'NC',lat:34.226,lng:-77.945},
  {c:'Inland Empire, CA',s:'CA',lat:33.95,lng:-117.40},{c:'Central PA (I-81)',s:'PA',lat:40.27,lng:-76.88},
  {c:'Allentown, PA',s:'PA',lat:40.608,lng:-75.490},{c:'Edison, NJ',s:'NJ',lat:40.519,lng:-74.412},
  {c:'Fort Myers, FL',s:'FL',lat:26.641,lng:-81.872},{c:'Greer, SC',s:'SC',lat:34.939,lng:-82.227},
  {c:'Joliet, IL',s:'IL',lat:41.525,lng:-88.082},{c:'Kenosha, WI',s:'WI',lat:42.585,lng:-87.821},
  {c:'Lathrop, CA',s:'CA',lat:37.823,lng:-121.277},{c:'Lebanon, TN',s:'TN',lat:36.208,lng:-86.291},
  {c:'Olive Branch, MS',s:'MS',lat:34.962,lng:-89.829},{c:'Patterson, CA',s:'CA',lat:37.472,lng:-121.130},
  {c:'Plainfield, IN',s:'IN',lat:39.704,lng:-86.399},{c:'Romeoville, IL',s:'IL',lat:41.648,lng:-88.090},
  {c:'San Bernardino, CA',s:'CA',lat:34.108,lng:-117.289},{c:'Sparks, NV',s:'NV',lat:39.535,lng:-119.752},
  {c:'West Jefferson, OH',s:'OH',lat:39.945,lng:-83.268},{c:'York, PA',s:'PA',lat:39.963,lng:-76.728}
];

// ── STATE VARIABLES ──
var netMap = null;
var netMarkers = [];
var netDCCount = 1;
var NET_CLUSTER_COLORS = ['#0047AB','#e11d48','#059669','#d97706','#7c3aed'];

// Default demand points (sample customer network)
var netDemandPoints = [
  {city:'New York, NY',volume:120000},{city:'Los Angeles, CA',volume:95000},
  {city:'Chicago, IL',volume:78000},{city:'Houston, TX',volume:62000},
  {city:'Atlanta, GA',volume:55000},{city:'Dallas, TX',volume:48000},
  {city:'Philadelphia, PA',volume:42000},{city:'Phoenix, AZ',volume:38000},
  {city:'Seattle, WA',volume:35000},{city:'Miami, FL',volume:32000}
];

// ── GEOCODING ──
function geocodeCity(name) {
  if (!name) return null;
  var lower = name.toLowerCase().trim();
  for (var i = 0; i < NET_CITIES.length; i++) {
    if (NET_CITIES[i].c.toLowerCase() === lower) return { lat: NET_CITIES[i].lat, lng: NET_CITIES[i].lng, name: NET_CITIES[i].c };
  }
  // Fuzzy: match city name without state
  var cityOnly = lower.replace(/,.*/, '').trim();
  for (var j = 0; j < NET_CITIES.length; j++) {
    if (NET_CITIES[j].c.toLowerCase().replace(/,.*/, '').trim() === cityOnly) return { lat: NET_CITIES[j].lat, lng: NET_CITIES[j].lng, name: NET_CITIES[j].c };
  }
  return null;
}

function getCityAutocomplete(partial) {
  if (!partial || partial.length < 2) return [];
  var lower = partial.toLowerCase();
  return NET_CITIES.filter(function(c) { return c.c.toLowerCase().indexOf(lower) !== -1; }).slice(0, 8);
}

// ── HAVERSINE DISTANCE (miles) ──
function haversine(lat1, lng1, lat2, lng2) {
  var R = 3959; // Earth radius in miles
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Road distance approximation (haversine × circuity factor)
function roadDist(lat1, lng1, lat2, lng2) {
  return haversine(lat1, lng1, lat2, lng2) * 1.2;
}

// ── WEIGHTED CENTER OF GRAVITY ──
function weightedCOG(points) {
  // points: [{lat, lng, weight}]
  var sumW = 0, sumLat = 0, sumLng = 0;
  for (var i = 0; i < points.length; i++) {
    sumW += points[i].weight;
    sumLat += points[i].lat * points[i].weight;
    sumLng += points[i].lng * points[i].weight;
  }
  if (sumW === 0) return { lat: 39.5, lng: -98.35 }; // US center
  return { lat: sumLat / sumW, lng: sumLng / sumW };
}

// ── K-MEANS CLUSTERING + COG ──
function kMeansCOG(points, k, maxIter) {
  maxIter = maxIter || 50;
  if (points.length <= k) {
    // Each point is its own cluster
    return points.map(function(p, i) {
      return { center: { lat: p.lat, lng: p.lng }, members: [i], totalWeight: p.weight };
    });
  }

  // Initialize centers using k-means++ style (spread out)
  var centers = [];
  var usedIdx = [];
  // First center = highest weight point
  var maxWIdx = 0;
  for (var m = 1; m < points.length; m++) { if (points[m].weight > points[maxWIdx].weight) maxWIdx = m; }
  centers.push({ lat: points[maxWIdx].lat, lng: points[maxWIdx].lng });
  usedIdx.push(maxWIdx);

  for (var c = 1; c < k; c++) {
    var bestIdx = -1, bestDist = -1;
    for (var p = 0; p < points.length; p++) {
      if (usedIdx.indexOf(p) !== -1) continue;
      var minD = Infinity;
      for (var ci = 0; ci < centers.length; ci++) {
        var d = haversine(points[p].lat, points[p].lng, centers[ci].lat, centers[ci].lng);
        if (d < minD) minD = d;
      }
      if (minD > bestDist) { bestDist = minD; bestIdx = p; }
    }
    if (bestIdx === -1) bestIdx = (usedIdx[usedIdx.length-1] + 1) % points.length;
    centers.push({ lat: points[bestIdx].lat, lng: points[bestIdx].lng });
    usedIdx.push(bestIdx);
  }

  // Iterate
  var assignments = new Array(points.length);
  for (var iter = 0; iter < maxIter; iter++) {
    // Assign each point to nearest center
    var changed = false;
    for (var pi = 0; pi < points.length; pi++) {
      var best = 0, bestD = Infinity;
      for (var ci2 = 0; ci2 < centers.length; ci2++) {
        var dd = haversine(points[pi].lat, points[pi].lng, centers[ci2].lat, centers[ci2].lng);
        if (dd < bestD) { bestD = dd; best = ci2; }
      }
      if (assignments[pi] !== best) { assignments[pi] = best; changed = true; }
    }
    if (!changed && iter > 0) break;

    // Recalculate centers as weighted COG of cluster members
    for (var ci3 = 0; ci3 < k; ci3++) {
      var clusterPts = [];
      for (var pi2 = 0; pi2 < points.length; pi2++) {
        if (assignments[pi2] === ci3) clusterPts.push(points[pi2]);
      }
      if (clusterPts.length > 0) {
        var cog = weightedCOG(clusterPts);
        centers[ci3] = cog;
      }
    }
  }

  // Build result
  var clusters = [];
  for (var ci4 = 0; ci4 < k; ci4++) {
    var members = [], tw = 0;
    for (var pi3 = 0; pi3 < points.length; pi3++) {
      if (assignments[pi3] === ci4) { members.push(pi3); tw += points[pi3].weight; }
    }
    clusters.push({ center: centers[ci4], members: members, totalWeight: tw });
  }
  return clusters;
}

// ── FIND NEAREST CITY TO A LAT/LNG ──
function nearestCity(lat, lng) {
  var best = null, bestD = Infinity;
  for (var i = 0; i < NET_CITIES.length; i++) {
    var d = haversine(lat, lng, NET_CITIES[i].lat, NET_CITIES[i].lng);
    if (d < bestD) { bestD = d; best = NET_CITIES[i]; }
  }
  return best ? best.c : (lat.toFixed(2) + ', ' + lng.toFixed(2));
}

// ── INITIALIZE LEAFLET MAP ──
function initNetworkMap() {
  if (netMap) { netMap.invalidateSize(); return; }
  var container = document.getElementById('net-map');
  if (!container) return;
  try {
    netMap = L.map('net-map', { zoomControl: true, scrollWheelZoom: true, attributionControl: false });
    netMap.setView([39.5, -98.35], 4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18, subdomains: 'abcd'
    }).addTo(netMap);
  } catch(e) { console.error('Network map init error:', e); }
}

// ── RENDER DEMAND POINT LIST ──
function renderDemandList() {
  var container = document.getElementById('net-demand-list');
  if (!container) return;
  var html = '';
  for (var i = 0; i < netDemandPoints.length; i++) {
    var dp = netDemandPoints[i];
    html += '<div style="display:flex;align-items:center;gap:6px;padding:8px 10px;background:var(--ies-gray-50);border-radius:8px;border:1px solid var(--ies-gray-100);" data-dp-idx="' + i + '">';
    html += '<div style="flex:1;position:relative;">';
    html += '<input type="text" value="' + (dp.city || '') + '" placeholder="City, State" ';
    html += 'oninput="updateDemandCity(' + i + ',this)" onfocus="showCityDropdown(' + i + ',this)" onblur="setTimeout(function(){hideCityDropdown(' + i + ')},200)" ';
    html += 'style="width:100%;padding:6px 8px;border:1px solid var(--ies-gray-200);border-radius:6px;font-size:12px;font-weight:600;color:var(--ies-navy);background:#fff;">';
    html += '<div id="net-dd-' + i + '" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid var(--ies-gray-200);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.12);z-index:100;max-height:160px;overflow-y:auto;margin-top:2px;"></div>';
    html += '</div>';
    html += '<input type="number" value="' + dp.volume + '" min="100" step="1000" ';
    html += 'onchange="updateDemandVol(' + i + ',this)" oninput="updateDemandVol(' + i + ',this)" ';
    html += 'style="width:80px;padding:6px 8px;border:1px solid var(--ies-gray-200);border-radius:6px;font-size:12px;font-weight:600;color:var(--ies-blue);text-align:right;background:#fff;" title="Annual volume (units)">';
    html += '<span style="font-size:9px;color:var(--ies-gray-400);width:24px;">units</span>';
    if (netDemandPoints.length > 2) {
      html += '<button onclick="removeDemandPoint(' + i + ')" style="background:none;border:none;cursor:pointer;padding:2px;color:var(--ies-gray-400);font-size:16px;line-height:1;" title="Remove">&times;</button>';
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

// ── DEMAND POINT CRUD ──
function addDemandPoint() {
  netDemandPoints.push({ city: '', volume: 10000 });
  renderDemandList();
}

function removeDemandPoint(idx) {
  netDemandPoints.splice(idx, 1);
  renderDemandList();
  runNetworkOptimization();
}

function updateDemandCity(idx, el) {
  netDemandPoints[idx].city = el.value;
  showCityDropdown(idx, el);
}

function updateDemandVol(idx, el) {
  netDemandPoints[idx].volume = parseInt(el.value, 10) || 0;
  runNetworkOptimization();
}

function showCityDropdown(idx, inputEl) {
  var dd = document.getElementById('net-dd-' + idx);
  if (!dd) return;
  var matches = getCityAutocomplete(inputEl.value);
  if (matches.length === 0) { dd.style.display = 'none'; return; }
  var html = '';
  for (var i = 0; i < matches.length; i++) {
    html += '<div onmousedown="selectCity(' + idx + ',\'' + esc(matches[i].c).replace(/'/g,"\\'") + '\')" style="padding:6px 10px;font-size:12px;cursor:pointer;border-bottom:1px solid var(--ies-gray-100);color:var(--ies-navy);" onmouseover="this.style.background=\'var(--ies-gray-50)\'" onmouseout="this.style.background=\'#fff\'">' + esc(matches[i].c) + '</div>';
  }
  dd.innerHTML = html;
  dd.style.display = 'block';
}

function hideCityDropdown(idx) {
  var dd = document.getElementById('net-dd-' + idx);
  if (dd) dd.style.display = 'none';
}

function selectCity(idx, cityName) {
  netDemandPoints[idx].city = cityName;
  renderDemandList();
  runNetworkOptimization();
}

function setNetDCs(n) {
  netDCCount = n;
  var btns = document.querySelectorAll('.net-dc-btn');
  btns.forEach(function(b, i) {
    if (i === n - 1) {
      b.style.background = 'var(--ies-blue)';
      b.style.borderColor = 'var(--ies-blue)';
      b.style.color = '#fff';
      b.classList.add('active');
    } else {
      b.style.background = '#fff';
      b.style.borderColor = 'var(--ies-gray-200)';
      b.style.color = 'var(--ies-navy)';
      b.classList.remove('active');
    }
  });
  runNetworkOptimization();
}

// ── MAIN OPTIMIZATION & RENDER ──
function runNetworkOptimization() {
  // Geocode all demand points
  var geoPoints = [];
  for (var i = 0; i < netDemandPoints.length; i++) {
    var geo = geocodeCity(netDemandPoints[i].city);
    if (geo && netDemandPoints[i].volume > 0) {
      geoPoints.push({ lat: geo.lat, lng: geo.lng, weight: netDemandPoints[i].volume, name: geo.name, idx: i });
    }
  }

  if (geoPoints.length < 1) {
    updateNetKPIs(0, 0, 0, 0, 0, 0);
    if (netMap) clearNetMap();
    return;
  }

  var rate = parseFloat(document.getElementById('net-rate').value) || 2.25;
  var loadsPerWeek = parseFloat(document.getElementById('net-loads').value) || 2;
  var totalVol = 0;
  for (var v = 0; v < geoPoints.length; v++) totalVol += geoPoints[v].weight;

  // Run k-means COG for current DC count
  var clusters = kMeansCOG(geoPoints, netDCCount);

  // Calculate metrics
  var totalWeightedDist = 0, totalShipments = 0;
  for (var ci = 0; ci < clusters.length; ci++) {
    for (var mi = 0; mi < clusters[ci].members.length; mi++) {
      var pt = geoPoints[clusters[ci].members[mi]];
      var dist = roadDist(pt.lat, pt.lng, clusters[ci].center.lat, clusters[ci].center.lng);
      var annualLoads = loadsPerWeek * 52;
      totalWeightedDist += dist * pt.weight;
      totalShipments += annualLoads;
    }
  }

  var avgDist = totalVol > 0 ? totalWeightedDist / totalVol : 0;
  var estFreight = 0;
  for (var ci2 = 0; ci2 < clusters.length; ci2++) {
    for (var mi2 = 0; mi2 < clusters[ci2].members.length; mi2++) {
      var pt2 = geoPoints[clusters[ci2].members[mi2]];
      var d2 = roadDist(pt2.lat, pt2.lng, clusters[ci2].center.lat, clusters[ci2].center.lng);
      estFreight += d2 * rate * loadsPerWeek * 52;
    }
  }
  var avgTransit = avgDist / 500; // ~500 mi/day average truck

  // Update KPIs
  updateNetKPIs(netDCCount, geoPoints.length, totalVol, avgDist, estFreight, avgTransit);

  // Render map
  renderNetMap(geoPoints, clusters);

  // Render DC results
  renderNetDCResults(clusters, geoPoints);

  // Run comparison across 1-5 DCs
  renderNetComparison(geoPoints, rate, loadsPerWeek);

  // Render recommendation
  renderNetRecommendation(geoPoints, rate, loadsPerWeek);

  // Sync panel heights
  setTimeout(syncNetPanelHeight, 100);

  // Trigger auto-save if a scenario is loaded
  netMarkChanged();
}

function updateNetKPIs(dcs, points, vol, avgDist, freight, transit) {
  document.getElementById('net-k-dcs').textContent = dcs || '—';
  document.getElementById('net-k-points').textContent = points || '—';
  document.getElementById('net-k-vol').textContent = vol > 0 ? (vol >= 1000000 ? fmtNum(vol/1000000, 1) + 'M' : fmtNum(vol/1000, 0) + 'K') : '—';
  document.getElementById('net-k-dist').textContent = avgDist > 0 ? Math.round(avgDist).toLocaleString() : '—';
  document.getElementById('net-k-cost').textContent = freight > 0 ? (freight >= 1000000 ? fmtNum(freight/1000000, 1, '$') + 'M' : fmtNum(freight/1000, 0, '$') + 'K') : '—';
  document.getElementById('net-k-transit').textContent = transit > 0 ? fmtNum(transit, 1) : '—';
}

function clearNetMap() {
  if (!netMap) return;
  netMarkers.forEach(function(m) { netMap.removeLayer(m); });
  netMarkers = [];
}

function renderNetMap(geoPoints, clusters) {
  if (!netMap) return;
  clearNetMap();

  // Draw assignment lines first (under markers)
  for (var ci = 0; ci < clusters.length; ci++) {
    var color = NET_CLUSTER_COLORS[ci % NET_CLUSTER_COLORS.length];
    for (var mi = 0; mi < clusters[ci].members.length; mi++) {
      var pt = geoPoints[clusters[ci].members[mi]];
      var line = L.polyline(
        [[pt.lat, pt.lng], [clusters[ci].center.lat, clusters[ci].center.lng]],
        { color: color, weight: 1.5, opacity: 0.25, dashArray: '4 4' }
      ).addTo(netMap);
      netMarkers.push(line);
    }
  }

  // Draw demand points
  for (var i = 0; i < geoPoints.length; i++) {
    // Find which cluster this point belongs to
    var ptColor = 'var(--ies-blue)';
    for (var ci2 = 0; ci2 < clusters.length; ci2++) {
      if (clusters[ci2].members.indexOf(i) !== -1) {
        ptColor = NET_CLUSTER_COLORS[ci2 % NET_CLUSTER_COLORS.length];
        break;
      }
    }
    var radius = Math.max(4, Math.min(12, Math.sqrt(geoPoints[i].weight / 5000)));
    var marker = L.circleMarker([geoPoints[i].lat, geoPoints[i].lng], {
      radius: radius, fillColor: ptColor, fillOpacity: 0.7, color: '#fff', weight: 1.5
    }).addTo(netMap);
    marker.bindTooltip(geoPoints[i].name + '<br>' + geoPoints[i].weight.toLocaleString() + ' units', { className: 'net-tooltip' });
    netMarkers.push(marker);
  }

  // Draw DC centers (diamond markers using divIcon)
  for (var ci3 = 0; ci3 < clusters.length; ci3++) {
    if (clusters[ci3].members.length === 0) continue;
    var cc = NET_CLUSTER_COLORS[ci3 % NET_CLUSTER_COLORS.length];
    var dcIcon = L.divIcon({
      className: '',
      html: '<div style="width:18px;height:18px;background:' + cc + ';border:2.5px solid #fff;border-radius:3px;transform:rotate(45deg);box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>',
      iconSize: [18, 18], iconAnchor: [9, 9]
    });
    var dcMarker = L.marker([clusters[ci3].center.lat, clusters[ci3].center.lng], { icon: dcIcon }).addTo(netMap);
    var nearCity = nearestCity(clusters[ci3].center.lat, clusters[ci3].center.lng);
    dcMarker.bindTooltip('DC ' + (ci3+1) + ': ' + nearCity + '<br>' + clusters[ci3].totalWeight.toLocaleString() + ' units served', { className: 'net-tooltip' });
    netMarkers.push(dcMarker);
  }

  // Fit bounds
  var allLatLngs = geoPoints.map(function(p) { return [p.lat, p.lng]; });
  clusters.forEach(function(cl) { allLatLngs.push([cl.center.lat, cl.center.lng]); });
  if (allLatLngs.length > 0) {
    netMap.fitBounds(L.latLngBounds(allLatLngs).pad(0.1));
  }
}

function renderNetDCResults(clusters, geoPoints) {
  var el = document.getElementById('net-dc-results');
  if (!el) return;
  var html = '';
  for (var ci = 0; ci < clusters.length; ci++) {
    if (clusters[ci].members.length === 0) continue;
    var color = NET_CLUSTER_COLORS[ci % NET_CLUSTER_COLORS.length];
    var nearCity = nearestCity(clusters[ci].center.lat, clusters[ci].center.lng);
    var avgD = 0;
    for (var mi = 0; mi < clusters[ci].members.length; mi++) {
      var pt = geoPoints[clusters[ci].members[mi]];
      avgD += roadDist(pt.lat, pt.lng, clusters[ci].center.lat, clusters[ci].center.lng);
    }
    avgD = clusters[ci].members.length > 0 ? avgD / clusters[ci].members.length : 0;

    html += '<div style="margin-bottom:12px;padding:10px 12px;border-left:3px solid ' + color + ';background:rgba(0,0,0,.02);border-radius:0 6px 6px 0;">';
    html += '<div style="font-weight:700;color:var(--ies-navy);margin-bottom:4px;">DC ' + (ci+1) + ': ' + nearCity + '</div>';
    html += '<div style="font-size:11px;color:var(--ies-gray-500);">';
    html += 'Serves ' + clusters[ci].members.length + ' locations &middot; ';
    html += clusters[ci].totalWeight.toLocaleString() + ' units &middot; ';
    html += 'Avg ' + Math.round(avgD) + ' mi';
    html += '</div>';
    // List served cities
    html += '<div style="font-size:10px;color:var(--ies-gray-400);margin-top:4px;">';
    var cityNames = clusters[ci].members.map(function(mi) { return geoPoints[mi].name; });
    html += cityNames.join(', ');
    html += '</div>';
    html += '</div>';
  }
  el.innerHTML = html;
}

function renderNetComparison(geoPoints, rate, loadsPerWeek) {
  var el = document.getElementById('net-comparison');
  if (!el) return;
  var html = '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
  html += '<tr style="border-bottom:1.5px solid var(--ies-gray-200);">';
  html += '<th style="text-align:left;padding:4px 6px;font-weight:600;color:var(--ies-gray-500);">DCs</th>';
  html += '<th style="text-align:right;padding:4px 6px;font-weight:600;color:var(--ies-gray-500);">Avg Dist</th>';
  html += '<th style="text-align:right;padding:4px 6px;font-weight:600;color:var(--ies-gray-500);">Est. Freight</th>';
  html += '<th style="text-align:right;padding:4px 6px;font-weight:600;color:var(--ies-gray-500);">Transit</th>';
  html += '<th style="text-align:right;padding:4px 6px;font-weight:600;color:var(--ies-gray-500);">Savings</th>';
  html += '</tr>';

  var results = [];
  for (var k = 1; k <= 5; k++) {
    var clusters = kMeansCOG(geoPoints, k);
    var totalVol = 0, totalWeightedDist = 0, estFreight = 0;
    for (var v = 0; v < geoPoints.length; v++) totalVol += geoPoints[v].weight;
    for (var ci = 0; ci < clusters.length; ci++) {
      for (var mi = 0; mi < clusters[ci].members.length; mi++) {
        var pt = geoPoints[clusters[ci].members[mi]];
        var dist = roadDist(pt.lat, pt.lng, clusters[ci].center.lat, clusters[ci].center.lng);
        totalWeightedDist += dist * pt.weight;
        estFreight += dist * rate * loadsPerWeek * 52;
      }
    }
    var avgDist = totalVol > 0 ? totalWeightedDist / totalVol : 0;
    var avgTransit = avgDist / 500;
    results.push({ k: k, avgDist: avgDist, freight: estFreight, transit: avgTransit });
  }

  var baseline = results[0].freight;
  for (var r = 0; r < results.length; r++) {
    var isActive = results[r].k === netDCCount;
    var savings = baseline > 0 ? ((baseline - results[r].freight) / baseline * 100) : 0;
    var bg = isActive ? 'background:rgba(0,71,171,.06);font-weight:700;' : '';
    html += '<tr style="border-bottom:1px solid var(--ies-gray-100);' + bg + '">';
    html += '<td style="padding:6px;color:' + (isActive ? 'var(--ies-blue)' : 'var(--ies-navy)') + ';font-weight:700;">';
    html += '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + NET_CLUSTER_COLORS[r] + ';margin-right:4px;"></span>';
    html += results[r].k + '</td>';
    html += '<td style="text-align:right;padding:6px;font-variant-numeric:tabular-nums;">' + Math.round(results[r].avgDist).toLocaleString() + ' mi</td>';
    html += '<td style="text-align:right;padding:6px;font-variant-numeric:tabular-nums;">' + (results[r].freight >= 1000000 ? fmtNum(results[r].freight/1000000, 1, '$') + 'M' : fmtNum(results[r].freight/1000, 0, '$') + 'K') + '</td>';
    html += '<td style="text-align:right;padding:6px;font-variant-numeric:tabular-nums;">' + fmtNum(results[r].transit, 1) + 'd</td>';
    html += '<td style="text-align:right;padding:6px;color:' + (savings > 0 ? 'var(--ies-green)' : 'var(--ies-gray-400)') + ';font-variant-numeric:tabular-nums;">';
    html += savings > 0 ? '-' + fmtNum(savings, 0) + '%' : '—';
    html += '</td></tr>';
  }
  html += '</table>';
  el.innerHTML = html;
}

function renderNetRecommendation(geoPoints, rate, loadsPerWeek) {
  var el = document.getElementById('net-reco');
  if (!el || geoPoints.length < 2) { if (el) el.innerHTML = '<span style="color:var(--ies-gray-400);">Add at least 2 demand locations to generate a recommendation.</span>'; return; }

  // Find the "elbow" — best cost/benefit DC count
  var results = [];
  for (var k = 1; k <= 5; k++) {
    var clusters = kMeansCOG(geoPoints, k);
    var estFreight = 0;
    for (var ci = 0; ci < clusters.length; ci++) {
      for (var mi = 0; mi < clusters[ci].members.length; mi++) {
        var pt = geoPoints[clusters[ci].members[mi]];
        var dist = roadDist(pt.lat, pt.lng, clusters[ci].center.lat, clusters[ci].center.lng);
        estFreight += dist * rate * loadsPerWeek * 52;
      }
    }
    results.push({ k: k, freight: estFreight });
  }

  // Find biggest marginal improvement
  var bestElbow = 1, bestDrop = 0;
  for (var r = 1; r < results.length; r++) {
    var marginalDrop = results[r-1].freight - results[r].freight;
    var marginalPct = results[r-1].freight > 0 ? marginalDrop / results[r-1].freight : 0;
    if (marginalPct > 0.08 && marginalDrop > bestDrop) { // At least 8% marginal improvement
      bestDrop = marginalDrop;
      bestElbow = results[r].k;
    }
  }

  var totalSavings = results[0].freight > 0 ? ((results[0].freight - results[bestElbow - 1].freight) / results[0].freight * 100) : 0;

  var html = '<div style="margin-bottom:8px;">';
  if (bestElbow === 1) {
    html += '<strong>Single DC recommended.</strong> With the current demand distribution, adding facilities shows diminishing returns. A single, centrally-located DC minimizes fixed costs while maintaining reasonable transit times.';
  } else {
    html += '<strong>' + bestElbow + ' DC network recommended.</strong> Moving from 1 to ' + bestElbow + ' facilities reduces estimated outbound freight by approximately ' + fmtNum(totalSavings, 0) + '% (' + (bestDrop >= 1000000 ? fmtNum(bestDrop/1000000, 1, '$') + 'M' : '$' + Math.round(bestDrop/1000) + 'K') + ' annually). Beyond ' + bestElbow + ' DCs, marginal transportation savings diminish relative to the added facility overhead.';
  }
  html += '</div>';
  html += '<div style="font-size:11px;color:var(--ies-gray-500);border-top:1px solid rgba(0,71,171,.08);padding-top:8px;margin-top:8px;">';
  html += '<strong>Note:</strong> This is a weighted center of gravity analysis using straight-line distance with a 1.2x circuity factor. It does not account for warehouse lease costs, labor market conditions, inbound freight, or capacity constraints. Use as a directional screening tool — validate with a full network optimization study for final decisions.';
  html += '</div>';
  el.innerHTML = html;
}

// ── SYNC INPUT PANEL HEIGHT WITH RIGHT COLUMN ──
function syncNetPanelHeight() {
  var panel = document.getElementById('net-input-panel');
  var row = document.getElementById('net-row-main');
  if (!panel || !row) return;
  var rightCol = row.children[1];
  if (!rightCol) return;
  panel.style.maxHeight = 'none';
  var rightH = rightCol.offsetHeight;
  if (rightH > 0) {
    panel.style.maxHeight = rightH + 'px';
  }
}

// ── RESET ──


// ── COG ENHANCEMENT 1: FREIGHT MODE PRESET ──
function netApplyFreightMode() {
  var mode = document.getElementById('net-freight-mode').value;
  var rates = {
    'tl': 2.50,
    'ltl': 4.00,
    'parcel': 8.00
  };
  if (mode !== 'custom' && rates[mode]) {
    document.getElementById('net-rate').value = rates[mode];
    document.getElementById('net-rate-val').textContent = fmtNum(rates[mode], 2, '$') + '/mi';
    runNetworkOptimization();
  }
}

// ── COG ENHANCEMENT 2: CSV EXPORT ──
function netExportResultsCSV() {
  var geoPoints = [];
  for (var i = 0; i < netDemandPoints.length; i++) {
    var geo = geocodeCity(netDemandPoints[i].city);
    if (geo && netDemandPoints[i].volume > 0) {
      geoPoints.push({ lat: geo.lat, lng: geo.lng, weight: netDemandPoints[i].volume, name: geo.name, idx: i });
    }
  }

  if (geoPoints.length < 1) {
    alert('No demand points to export');
    return;
  }

  var rate = parseFloat(document.getElementById('net-rate').value) || 2.25;
  var loadsPerWeek = parseFloat(document.getElementById('net-loads').value) || 2;
  var clusters = kMeansCOG(geoPoints, netDCCount);

  var csv = 'IES CENTER OF GRAVITY ANALYSIS — RESULTS EXPORT\n\n';
  csv += 'SCENARIO,' + (document.getElementById('net-scenario-name').value || 'Untitled') + '\n';
  csv += 'NUM_DCS,' + netDCCount + '\n';
  csv += 'OUTBOUND_RATE_PER_MI,' + rate + '\n';
  csv += 'LOADS_PER_WEEK_PER_POINT,' + loadsPerWeek + '\n\n';

  csv += 'DEMAND POINTS\n';
  csv += 'Name,Latitude,Longitude,Volume,Weight\n';
  for (var i = 0; i < geoPoints.length; i++) {
    csv += geoPoints[i].name + ',' + geoPoints[i].lat.toFixed(4) + ',' + geoPoints[i].lng.toFixed(4) + ',' + geoPoints[i].weight + ',' + geoPoints[i].weight + '\n';
  }

  csv += '\nCENTER OF GRAVITY LOCATIONS\n';
  csv += 'DC_ID,Latitude,Longitude,Assigned_Points,Total_Volume\n';
  for (var ci = 0; ci < clusters.length; ci++) {
    csv += 'DC ' + (ci + 1) + ',' + clusters[ci].center.lat.toFixed(4) + ',' + clusters[ci].center.lng.toFixed(4) + ',' + clusters[ci].members.length + ',' + clusters[ci].totalWeight + '\n';
  }

  csv += '\nDEMAND POINT ASSIGNMENTS\n';
  csv += 'Demand_Name,Assigned_DC,Distance_Miles,Annual_Transport_Cost\n';
  var totalFreightCost = 0;
  for (var ci2 = 0; ci2 < clusters.length; ci2++) {
    for (var mi = 0; mi < clusters[ci2].members.length; mi++) {
      var ptIdx = clusters[ci2].members[mi];
      var pt = geoPoints[ptIdx];
      var dist = roadDist(pt.lat, pt.lng, clusters[ci2].center.lat, clusters[ci2].center.lng);
      var annualCost = dist * rate * loadsPerWeek * 52;
      totalFreightCost += annualCost;
      csv += pt.name + ',DC ' + (ci2 + 1) + ',' + dist.toFixed(1) + ',' + annualCost.toFixed(0) + '\n';
    }
  }

  csv += '\nSUMMARY METRICS\n';
  csv += 'Metric,Value\n';
  csv += 'Total Demand Points,' + geoPoints.length + '\n';
  csv += 'Total Volume,' + geoPoints.reduce(function(sum, p) { return sum + p.weight; }, 0) + '\n';
  csv += 'Number of DCs,' + netDCCount + '\n';
  csv += 'Total Weighted Transport Cost,$' + totalFreightCost.toFixed(0) + '\n';

  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'cog_results_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function resetNetworkTool() {
  netDCCount = 1;
  netDemandPoints = [
    {city:'New York, NY',volume:120000},{city:'Los Angeles, CA',volume:95000},
    {city:'Chicago, IL',volume:78000},{city:'Houston, TX',volume:62000},
    {city:'Atlanta, GA',volume:55000},{city:'Dallas, TX',volume:48000},
    {city:'Philadelphia, PA',volume:42000},{city:'Phoenix, AZ',volume:38000},
    {city:'Seattle, WA',volume:35000},{city:'Miami, FL',volume:32000}
  ];
  document.getElementById('net-scenario-name').value = '';
  document.getElementById('net-rate').value = 2.25;
  document.getElementById('net-rate-val').textContent = '$2.25/mi';
  document.getElementById('net-loads').value = 2;
  setNetDCs(1);
  renderDemandList();
  runNetworkOptimization();
}

// ── EXPORT ──
function exportNetworkSummary() {
  var scenario = (document.getElementById('net-scenario-name').value || 'Untitled Network Scenario').trim();
  var lines = [
    'IES NETWORK OPTIMIZATION — ' + scenario,
    '='.repeat(50),
    '',
    'CONFIGURATION',
    '  DCs: ' + netDCCount,
    '  Outbound Rate: ' + document.getElementById('net-rate-val').textContent,
    '  Loads/Week per Location: ' + document.getElementById('net-loads').value,
    '',
    'RESULTS',
    '  Demand Points: ' + document.getElementById('net-k-points').textContent,
    '  Total Volume: ' + document.getElementById('net-k-vol').textContent,
    '  Avg Distance: ' + document.getElementById('net-k-dist').textContent + ' mi',
    '  Est. Annual Freight: ' + document.getElementById('net-k-cost').textContent,
    '  Avg Transit: ' + document.getElementById('net-k-transit').textContent + ' days',
    '',
    'DEMAND LOCATIONS'
  ];
  for (var i = 0; i < netDemandPoints.length; i++) {
    if (netDemandPoints[i].city) {
      lines.push('  ' + netDemandPoints[i].city.padEnd(25) + netDemandPoints[i].volume.toLocaleString().padStart(10) + ' units');
    }
  }
  lines.push('');
  lines.push('DC RECOMMENDATIONS');
  var geoPoints = [];
  for (var i2 = 0; i2 < netDemandPoints.length; i2++) {
    var geo = geocodeCity(netDemandPoints[i2].city);
    if (geo && netDemandPoints[i2].volume > 0) {
      geoPoints.push({ lat: geo.lat, lng: geo.lng, weight: netDemandPoints[i2].volume, name: geo.name });
    }
  }
  if (geoPoints.length > 0) {
    var clusters = kMeansCOG(geoPoints, netDCCount);
    for (var ci = 0; ci < clusters.length; ci++) {
      if (clusters[ci].members.length === 0) continue;
      var near = nearestCity(clusters[ci].center.lat, clusters[ci].center.lng);
      lines.push('  DC ' + (ci+1) + ': ' + near + ' — serves ' + clusters[ci].members.length + ' locations, ' + clusters[ci].totalWeight.toLocaleString() + ' units');
    }
  }
  lines.push('');
  lines.push('Method: Weighted Center of Gravity (k-means clustering + iterative COG)');
  lines.push('Generated by IES Intelligence Hub');

  var text = lines.join('\n');
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.querySelector('#dt-network .wsc-action-btn:nth-child(2)');
    if (btn) {
      var orig = btn.innerHTML;
      btn.innerHTML = '<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="var(--ies-green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!';
      btn.style.borderColor = 'var(--ies-green)';
      btn.style.color = 'var(--ies-green)';
      setTimeout(function() { btn.innerHTML = orig; btn.style.borderColor = ''; btn.style.color = ''; }, 2000);
    }
  }).catch(function(e){ console.error('Clipboard write failed:', e); });
}


// ═════════════════════════════════════════════════════════════
// WAREHOUSE SIZING CALCULATOR — Core Calculator Functions
// ═════════════════════════════════════════════════════════════


// ═══════════════════ FACILITY LAYOUT RENDERER ═══════════════════
var wscZoneChart = null;

// ═══════════════════ FACILITY LAYOUT RENDERER ═══════════════════
function renderLayout(p) {
  var svg = document.getElementById('wsc-layout-svg');
  if (!svg) return;

  // ── COLORS (high contrast, distinct per zone) ──
  var C = {
    storage: { fill:'rgba(37,99,235,0.18)', stroke:'rgba(37,99,235,0.5)', rack:'rgba(37,99,235,0.45)', text:'rgba(147,197,253,0.95)' },
    dock:    { fill:'rgba(14,165,233,0.15)', stroke:'rgba(14,165,233,0.4)', text:'rgba(125,211,252,0.9)' },
    recv:    { fill:'rgba(16,185,129,0.22)', stroke:'rgba(16,185,129,0.55)', text:'rgba(110,231,183,0.95)' },
    ship:    { fill:'rgba(249,115,22,0.22)', stroke:'rgba(249,115,22,0.55)', text:'rgba(253,186,116,0.95)' },
    office:  { fill:'rgba(139,92,246,0.22)', stroke:'rgba(139,92,246,0.55)', text:'rgba(196,181,253,0.95)' },
    opt:     { fill:'rgba(236,72,153,0.2)',  stroke:'rgba(236,72,153,0.5)',  text:'rgba(251,182,206,0.95)' },
    door:    { inb:'rgba(245,158,11,0.9)', outb:'rgba(234,88,12,0.8)' },
    dim:'rgba(255,255,255,0.4)', label:'rgba(255,255,255,0.8)',
    sub:'rgba(255,255,255,0.45)', aisle:'rgba(255,255,255,0.3)', grid:'rgba(255,255,255,0.04)'
  };

  // ── FONT SIZES ──
  var F = { title:10, zone:7, detail:5.5, aisle:5, dim:8, door:4.5, sub:5 };

  // ── BUILDING DIMENSIONS ──
  var twoDock = p.dockConfig === 'two';
  var isVert = p.rackDir === 'vertical';
  var dockFaceW = Math.max((twoDock ? Math.max(p.inDoors,p.outDoors) : p.totalDoors) * 14, 120);
  var bW = Math.max(dockFaceW, Math.ceil(Math.sqrt(p.totalSF * 2.2)));
  var bD = Math.max(100, Math.ceil(p.totalSF / bW));

  var dimEl = document.getElementById('wsc-layout-dims');
  if (dimEl) dimEl.textContent = bW.toLocaleString()+' ft × '+bD.toLocaleString()+' ft';

  // ── SVG SETUP ──
  var pad = 60;
  var mg = 4;

  // ── ZONE HEIGHTS (derived from actual SF values / building width) ──
  // Calculate first so we can tighten bD to actual content
  var dockH = Math.max(18, Math.min(Math.ceil(p.dockSF / bW * (twoDock ? 0.5 : 1)), bD * 0.12));
  var recvStH = Math.max(14, Math.min(Math.ceil(p.recvStagingSF / bW), bD * 0.10));
  var shipStH = Math.max(14, Math.min(Math.ceil(p.shipStagingSF / bW), bD * 0.10));

  // Tighten building depth to match actual zone requirements
  var requiredDepth = (twoDock ? dockH + recvStH : 0) + dockH + Math.max(recvStH, shipStH) + mg * 6 + 40;
  if (bD > requiredDepth + 20) {
    bD = requiredDepth + 10;
    if (dimEl) dimEl.textContent = bW.toLocaleString()+' ft × '+bD.toLocaleString()+' ft';
  }

  // Store tightened dimensions for 3D view to reuse
  wscTightenedBW = bW;
  wscTightenedBD = bD;

  var vW = bW+pad*2, vH = bD+pad*2;
  svg.setAttribute('viewBox','0 0 '+vW+' '+vH);
  var bX = pad, bY = pad;
  var s = '';

  // Grid
  var gs=50;
  s += '<defs><pattern id="grid" width="'+gs+'" height="'+gs+'" patternUnits="userSpaceOnUse"><path d="M '+gs+' 0 L 0 0 0 '+gs+'" fill="none" stroke="'+C.grid+'" stroke-width="0.5"/></pattern></defs>';
  s += '<rect x="0" y="0" width="'+vW+'" height="'+vH+'" fill="url(#grid)"/>';
  // Building outline
  s += '<rect x="'+bX+'" y="'+bY+'" width="'+bW+'" height="'+bD+'" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" rx="2"/>';
  var topDH = twoDock ? dockH : 0;
  var topSH = twoDock ? recvStH : 0;
  var botDY = bY+bD-dockH;
  var botSY = twoDock ? botDY-shipStH : botDY-Math.max(recvStH, shipStH);

  // ── OFFICE (top-right corner, sized from actual officeSF) ──
  // Estimate storage zone height for capping office depth
  var estStH = botSY - (bY + mg + topDH + topSH) - mg;
  var oW = 0, oD = 0;
  if (p.officeSF > 0) {
    // Target roughly square-ish office; width capped at 20% of building
    oW = Math.max(40, Math.min(bW * 0.20, Math.ceil(Math.sqrt(p.officeSF * 1.4))));
    oD = Math.max(30, Math.ceil(p.officeSF / oW));
    // Cap depth at 35% of storage area height so it doesn't dominate
    oD = Math.min(oD, estStH * 0.35);
    // Recalculate width if depth was capped
    if (oD > 0) oW = Math.max(oW, Math.ceil(p.officeSF / oD));
    oW = Math.min(oW, bW * 0.22);
  }
  var hasOffice = oW > 0 && oD > 0;

  // ── OPTIONAL ZONES (right side, below office) ──
  var optTotalSF = 0;
  for (var z = 0; z < p.addlItems.length; z++) optTotalSF += p.addlItems[z].sf;
  var hasOpt = p.addlItems.length > 0 && optTotalSF > 0;
  // Width scales with total optional SF, anchored to office width if present
  var optColW = 0;
  if (hasOpt) {
    var sfBasedW = Math.ceil(Math.sqrt(optTotalSF * 1.2));
    optColW = hasOffice ? Math.max(oW, Math.min(sfBasedW, bW * 0.22)) : Math.max(40, Math.min(sfBasedW, bW * 0.22));
  }

  // ── STORAGE AREA (full width, racks wrap around office+opt column) ──
  var stX = bX + mg;
  var stY = bY + mg + topDH + topSH;
  var stW = bW - mg*2;
  var stH = botSY - stY - mg;

  s += '<rect x="'+stX+'" y="'+stY+'" width="'+stW+'" height="'+stH+'" fill="'+C.storage.fill+'" stroke="'+C.storage.stroke+'" stroke-width="0.5" rx="1" data-zone="storage"/>';

  // ── OFFICE + OPTIONAL ZONES COLUMN (top-right, inside storage) ──
  var rightColW = Math.max(oW, optColW);
  var rightColX = bX + bW - rightColW - mg - 2;
  var rightColUsed = 0; // track how much vertical space the right column uses

  if (hasOffice) {
    var oX = rightColX, oY = stY + 2;
    s += '<rect x="'+oX+'" y="'+oY+'" width="'+rightColW+'" height="'+oD+'" fill="'+C.office.fill+'" stroke="'+C.office.stroke+'" stroke-width="0.6" rx="1" data-zone="office"/>';
    s += '<line x1="'+oX+'" y1="'+oY+'" x2="'+(oX+rightColW)+'" y2="'+(oY+oD)+'" stroke="'+C.office.stroke+'" stroke-width="0.2" opacity="0.3"/>';
    s += '<line x1="'+(oX+rightColW)+'" y1="'+oY+'" x2="'+oX+'" y2="'+(oY+oD)+'" stroke="'+C.office.stroke+'" stroke-width="0.2" opacity="0.3"/>';
    s += '<text x="'+(oX+rightColW/2)+'" y="'+(oY+oD/2-1)+'" text-anchor="middle" fill="'+C.office.text+'" font-size="'+F.zone+'" font-family="Montserrat,sans-serif" font-weight="700" data-zone-label="office">OFFICE</text>';
    s += '<text x="'+(oX+rightColW/2)+'" y="'+(oY+oD/2+10)+'" text-anchor="middle" fill="'+C.sub+'" font-size="'+F.detail+'" font-family="Montserrat,sans-serif" data-zone-label="office">'+p.officeSF.toLocaleString()+' sf</text>';
    rightColUsed = oD + 4;
  }

  if (hasOpt) {
    var ozX = rightColX;
    var ozY = stY + 2 + rightColUsed;
    var ozAvailH = stH - rightColUsed - 4;
    // Calculate each zone's height proportional to its SF value
    // Each zone: height = (zoneSF / rightColW), clamped to available space
    var ozHeights = [];
    var ozTotalRawH = 0;
    for (var oi = 0; oi < p.addlItems.length; oi++) {
      var rawH = Math.max(16, Math.ceil(p.addlItems[oi].sf / rightColW));
      ozHeights.push(rawH);
      ozTotalRawH += rawH;
    }
    // Scale heights to fit available space if they'd overflow
    var ozScale = ozTotalRawH > ozAvailH ? (ozAvailH / ozTotalRawH) : 1;
    var oyCursor = ozY;
    for (var oi = 0; oi < p.addlItems.length; oi++) {
      var itemH = Math.max(14, Math.floor(ozHeights[oi] * ozScale)) - 3;
      s += '<rect x="'+ozX+'" y="'+oyCursor+'" width="'+rightColW+'" height="'+itemH+'" fill="'+C.opt.fill+'" stroke="'+C.opt.stroke+'" stroke-width="0.4" rx="1" data-zone="opt-'+oi+'"/>';
      s += '<text x="'+(ozX+rightColW/2)+'" y="'+(oyCursor+itemH/2-1)+'" text-anchor="middle" fill="'+C.opt.text+'" font-size="'+F.detail+'" font-family="Montserrat,sans-serif" font-weight="600" data-zone-label="opt-'+oi+'">'+p.addlItems[oi].label.toUpperCase()+'</text>';
      s += '<text x="'+(ozX+rightColW/2)+'" y="'+(oyCursor+itemH/2+7)+'" text-anchor="middle" fill="'+C.sub+'" font-size="'+F.sub+'" font-family="Montserrat,sans-serif" data-zone-label="opt-'+oi+'">'+p.addlItems[oi].sf.toLocaleString()+' sf</text>';
      oyCursor += itemH + 3;
    }
    rightColUsed = oyCursor - (stY + 2); // update so rack area knows total column height
  }

  // ── RACK DRAWING AREA (wraps around right column) ──
  var rPad = 8;
  var rLabelH = 20;
  var hasRightCol = hasOffice || hasOpt;
  // Upper rack zone (beside right column) — height matches right column content
  var upperH = hasRightCol ? Math.max(rightColUsed, stH * 0.35) : 0;
  upperH = Math.min(upperH, stH - 30);
  // If right column is taller than storage, just use narrow width for whole area
  var rFullW = stW - rPad*2;
  var rNarrowW = stW - rPad*2 - (hasRightCol ? rightColW + 6 : 0);
  var raX = stX + rPad;
  var raY = stY + rLabelH;
  var raH = stH - rLabelH - 6;

  // Helper: draw rack rows in a rectangular region
  // modFt = back-to-back rack depth (8.5 for single, 16.5 for double)
  // aisleFt = aisle width between modules
  // fixedPitch = optional fixed SVG module width/height to align across sections
  // Uses geometry to calculate module COUNT, then distributes proportionally in SVG space
  function drawRacks(x, y, w, h, modFt, aisleFt, fixedPitch) {
    var totFt = modFt + aisleFt;
    var rackRatio = modFt / totFt;
    if (isVert) {
      // Vertical: racks run top-to-bottom, modules repeat left-to-right
      var mW, nm;
      if (fixedPitch) {
        mW = fixedPitch;
        nm = Math.max(1, Math.floor(w / mW));
      } else {
        nm = Math.max(2, Math.min(18, Math.floor(w / totFt)));
        mW = w / nm;
      }
      var rkW = mW * rackRatio;
      var hr = (rkW - 1) / 2;
      for (var i = 0; i < nm; i++) {
        var mx = x + i * mW;
        if (mx + rkW > x + w + 1) break; // don't draw past bounds
        s += '<rect x="'+mx+'" y="'+y+'" width="'+hr+'" height="'+h+'" fill="'+C.storage.rack+'" rx="0.5" data-rack="1"/>';
        s += '<rect x="'+(mx+hr+1)+'" y="'+y+'" width="'+hr+'" height="'+h+'" fill="'+C.storage.rack+'" rx="0.5" data-rack="1"/>';
        if (mW - rkW > 4 && i < nm-1) {
          var ax = mx + rkW + (mW - rkW)/2;
          s += '<text x="'+ax+'" y="'+(y+h/2)+'" text-anchor="middle" fill="'+C.aisle+'" font-size="'+F.aisle+'" font-family="Montserrat,sans-serif" data-rack="1" transform="rotate(90 '+ax+' '+(y+h/2)+')">'+aisleFt+'\' aisle</text>';
        }
      }
    } else {
      // Horizontal: racks run left-to-right, modules repeat top-to-bottom
      var mH, nm;
      if (fixedPitch) {
        mH = fixedPitch;
        nm = Math.max(1, Math.floor(h / mH));
      } else {
        nm = Math.max(2, Math.min(18, Math.floor(h / totFt)));
        mH = h / nm;
      }
      var rkH = mH * rackRatio;
      var hr = (rkH - 1) / 2;
      for (var i = 0; i < nm; i++) {
        var my = y + i * mH;
        if (my + rkH > y + h + 1) break;
        s += '<rect x="'+x+'" y="'+my+'" width="'+w+'" height="'+hr+'" fill="'+C.storage.rack+'" rx="0.5" data-rack="1"/>';
        s += '<rect x="'+x+'" y="'+(my+hr+1)+'" width="'+w+'" height="'+hr+'" fill="'+C.storage.rack+'" rx="0.5" data-rack="1"/>';
        if (mH - rkH > 4 && i < nm-1) {
          s += '<text x="'+(x+w/2)+'" y="'+(my+rkH+(mH-rkH)/2+2)+'" text-anchor="middle" fill="'+C.aisle+'" font-size="'+F.aisle+'" font-family="Montserrat,sans-serif" data-rack="1">'+aisleFt+'\' aisle</text>';
        }
      }
    }
  }

  function drawBulk(x, y, w, h) {
    // Bulk module geometry: 2 rows of bulkDepth pallets (each 4ft) back-to-back + 12ft aisle
    var bayDepthFt = p.bulkDepth * 4; // one side of back-to-back bay
    var bulkAisleFt = 12;
    var moduleFt = (2 * bayDepthFt) + bulkAisleFt; // full module depth
    var bayRatio = (2 * bayDepthFt) / moduleFt; // proportion that is bay vs aisle
    if (isVert) {
      // Bays run top-to-bottom, modules repeat left-to-right
      var nm = Math.max(1, Math.min(14, Math.floor(w / moduleFt)));
      var mW = w / Math.max(nm, 1);
      var bayW = mW * bayRatio;
      for (var b = 0; b < nm; b++) {
        var bx = x + b * mW;
        s += '<rect x="'+bx+'" y="'+y+'" width="'+bayW+'" height="'+h+'" fill="'+C.storage.rack+'" stroke="'+C.storage.stroke+'" stroke-width="0.3" rx="0.5" data-rack="1"/>';
        // Draw depth lines — one per pallet depth position
        var totalPallets = p.bulkDepth * 2; // both sides of back-to-back
        for (var d = 1; d < totalPallets; d++) {
          var lx = bx + (bayW / totalPallets) * d;
          var lineOpacity = (d === p.bulkDepth) ? 0.25 : 0.08; // center flue line brighter
          s += '<line x1="'+lx+'" y1="'+y+'" x2="'+lx+'" y2="'+(y+h)+'" stroke="rgba(255,255,255,'+lineOpacity+')" stroke-width="0.3" data-rack="1"/>';
        }
      }
    } else {
      // Bays run left-to-right, modules repeat top-to-bottom
      var nm = Math.max(1, Math.min(14, Math.floor(h / moduleFt)));
      var mH = h / Math.max(nm, 1);
      var bayH = mH * bayRatio;
      for (var b = 0; b < nm; b++) {
        var by = y + b * mH;
        s += '<rect x="'+x+'" y="'+by+'" width="'+w+'" height="'+bayH+'" fill="'+C.storage.rack+'" stroke="'+C.storage.stroke+'" stroke-width="0.3" rx="0.5" data-rack="1"/>';
        // Draw depth lines — one per pallet depth position
        var totalPallets = p.bulkDepth * 2;
        for (var d = 1; d < totalPallets; d++) {
          var ly = by + (bayH / totalPallets) * d;
          var lineOpacity = (d === p.bulkDepth) ? 0.25 : 0.08;
          s += '<line x1="'+x+'" y1="'+ly+'" x2="'+(x+w)+'" y2="'+ly+'" stroke="rgba(255,255,255,'+lineOpacity+')" stroke-width="0.3" data-rack="1"/>';
        }
      }
    }
  }

  // Draw racks — two regions if right column present: upper (narrow) + lower (full width)
  var storLabel = '';
  if (p.storeType === 'single') storLabel = 'SINGLE-DEEP SELECTIVE — '+p.rackLevels+' LEVELS ('+p.clearHeightFt+'\' CLR)';
  else if (p.storeType === 'double') storLabel = 'DOUBLE-DEEP — '+p.rackLevels+' LEVELS ('+p.clearHeightFt+'\' CLR)';
  else if (p.storeType === 'bulk') storLabel = 'BULK FLOOR — '+p.bulkDepth+'-DEEP × '+p.stackHi+' HIGH';
  else if (p.storeType === 'carton') storLabel = 'CARTON FLOW / SHELVING ('+p.clearHeightFt+'\' CLR)';
  else storLabel = 'MIXED — '+Math.round(p.mixRackPct*100)+'% RACK / '+Math.round((1-p.mixRackPct)*100)+'% BULK';

  s += '<text x="'+(raX+3)+'" y="'+(raY-5)+'" fill="'+C.storage.text+'" font-size="'+F.zone+'" font-family="Montserrat,sans-serif" font-weight="700" data-zone-label="storage">'+storLabel+'</text>';
  s += '<text x="'+(raX+3)+'" y="'+(raY-5+9)+'" fill="'+C.sub+'" font-size="'+F.sub+'" font-family="Montserrat,sans-serif" data-zone-label="storage">'+p.storageSF.toLocaleString()+' sf</text>';

  if (hasRightCol && upperH > 0 && upperH < raH - 20) {
    // Upper zone: narrow (beside office/opt)
    var uH = Math.min(upperH, raH * 0.6);
    // Lower zone: full width (below office/opt)
    var lY = raY + uH + 4;
    var lH = raH - uH - 4;

    // Pre-calculate shared module pitch from the NARROW section so aisles align
    // Both sections will use this same pitch; lower section just fits more modules
    function sharedPitch(modFt, aisleFt) {
      var totFt = modFt + aisleFt;
      if (isVert) {
        var nm = Math.max(2, Math.min(18, Math.floor(rNarrowW / totFt)));
        return rNarrowW / nm;
      } else {
        var nm = Math.max(2, Math.min(18, Math.floor(uH / totFt)));
        return uH / nm;
      }
    }

    if (p.storeType === 'single') {
      var sp = sharedPitch(8.5, p.aisleW);
      drawRacks(raX, raY, rNarrowW, uH, 8.5, p.aisleW, sp);
      drawRacks(raX, lY, rFullW, lH, 8.5, p.aisleW, sp);
    } else if (p.storeType === 'double') {
      var sp = sharedPitch(16.5, p.aisleW);
      drawRacks(raX, raY, rNarrowW, uH, 16.5, p.aisleW, sp);
      drawRacks(raX, lY, rFullW, lH, 16.5, p.aisleW, sp);
    } else if (p.storeType === 'bulk') {
      drawBulk(raX, raY, rNarrowW, uH);
      drawBulk(raX, lY, rFullW, lH);
    } else if (p.storeType === 'carton') {
      drawShelving(raX, raY, rNarrowW, uH);
      drawShelving(raX, lY, rFullW, lH);
    } else {
      // Mix: rack in upper, bulk in lower (natural split)
      var sp = sharedPitch(8.5, p.aisleW);
      drawRacks(raX, raY, rNarrowW, uH, 8.5, p.aisleW, sp);
      s += '<text x="'+(raX+3)+'" y="'+(lY-4)+'" fill="'+C.storage.text+'" font-size="'+F.detail+'" font-family="Montserrat,sans-serif" font-weight="600">BULK ('+Math.round((1-p.mixRackPct)*100)+'%)</text>';
      drawBulk(raX, lY, rFullW, lH);
      s += '<line x1="'+raX+'" y1="'+(lY-2)+'" x2="'+(raX+rFullW)+'" y2="'+(lY-2)+'" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-dasharray="4,4"/>';
    }
  } else {
    // No right column or it fills the whole height — use full width
    var useW = hasRightCol ? rNarrowW : rFullW;
    if (p.storeType === 'single') drawRacks(raX, raY, useW, raH, 8.5, p.aisleW);
    else if (p.storeType === 'double') drawRacks(raX, raY, useW, raH, 16.5, p.aisleW);
    else if (p.storeType === 'bulk') drawBulk(raX, raY, useW, raH);
    else if (p.storeType === 'carton') drawShelving(raX, raY, useW, raH);
    else {
      var rPct = p.mixRackPct;
      if (isVert) {
        var rW2 = useW*rPct-3, bX2 = raX+useW*rPct+3, bW2 = useW*(1-rPct)-3;
        drawRacks(raX, raY, rW2, raH, 8.5, p.aisleW);
        drawBulk(bX2, raY, bW2, raH);
        s += '<text x="'+(bX2+3)+'" y="'+(raY-5)+'" fill="'+C.storage.text+'" font-size="'+F.detail+'" font-family="Montserrat,sans-serif" font-weight="600">BULK</text>';
        s += '<line x1="'+(raX+rW2+3)+'" y1="'+raY+'" x2="'+(raX+rW2+3)+'" y2="'+(raY+raH)+'" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-dasharray="4,4"/>';
      } else {
        var rH2 = raH*rPct-3, bY2 = raY+raH*rPct+3, bH2 = raH*(1-rPct)-3;
        drawRacks(raX, raY, useW, rH2, 8.5, p.aisleW);
        drawBulk(raX, bY2, useW, bH2);
        s += '<text x="'+(raX+3)+'" y="'+(bY2-4)+'" fill="'+C.storage.text+'" font-size="'+F.detail+'" font-family="Montserrat,sans-serif" font-weight="600">BULK</text>';
        s += '<line x1="'+raX+'" y1="'+(raY+rH2+2)+'" x2="'+(raX+useW)+'" y2="'+(raY+rH2+2)+'" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-dasharray="4,4"/>';
      }
    }
  }

  // Draw carton flow / shelving modules
  function drawShelving(x, y, w, h) {
    // Shelving module: 4.5 ft back-to-back shelves + 5 ft pick aisle = 9.5 ft
    var shelfModFt = 9.5;
    var shelfRatio = 4.5 / 9.5; // shelf portion vs aisle
    var shelfColor = '#4a90d9'; // lighter blue to distinguish from pallet rack
    var shelfStroke = 'rgba(255,255,255,0.15)';
    if (isVert) {
      var nm = Math.max(1, Math.min(20, Math.floor(w / shelfModFt)));
      var mW = w / Math.max(nm, 1);
      var sW = mW * shelfRatio;
      for (var i = 0; i < nm; i++) {
        var sx = x + i * mW;
        s += '<rect x="'+sx+'" y="'+y+'" width="'+sW+'" height="'+h+'" fill="'+shelfColor+'" stroke="'+shelfStroke+'" stroke-width="0.3" rx="0.5" data-rack="1"/>';
        // Draw horizontal shelf dividers (~3ft apart to represent bays)
        var bayCount = Math.max(1, Math.floor(h / 3));
        for (var b = 1; b < bayCount; b++) {
          var ly = y + (h / bayCount) * b;
          s += '<line x1="'+sx+'" y1="'+ly+'" x2="'+(sx+sW)+'" y2="'+ly+'" stroke="rgba(255,255,255,0.12)" stroke-width="0.2" data-rack="1"/>';
        }
        // Center line for back-to-back
        var cx = sx + sW / 2;
        s += '<line x1="'+cx+'" y1="'+y+'" x2="'+cx+'" y2="'+(y+h)+'" stroke="rgba(255,255,255,0.2)" stroke-width="0.3" data-rack="1"/>';
      }
    } else {
      var nm = Math.max(1, Math.min(20, Math.floor(h / shelfModFt)));
      var mH = h / Math.max(nm, 1);
      var sH = mH * shelfRatio;
      for (var i = 0; i < nm; i++) {
        var sy = y + i * mH;
        s += '<rect x="'+x+'" y="'+sy+'" width="'+w+'" height="'+sH+'" fill="'+shelfColor+'" stroke="'+shelfStroke+'" stroke-width="0.3" rx="0.5" data-rack="1"/>';
        // Draw vertical shelf dividers
        var bayCount = Math.max(1, Math.floor(w / 3));
        for (var b = 1; b < bayCount; b++) {
          var lx = x + (w / bayCount) * b;
          s += '<line x1="'+lx+'" y1="'+sy+'" x2="'+lx+'" y2="'+(sy+sH)+'" stroke="rgba(255,255,255,0.12)" stroke-width="0.2" data-rack="1"/>';
        }
        // Center line for back-to-back
        var cy = sy + sH / 2;
        s += '<line x1="'+x+'" y1="'+cy+'" x2="'+(x+w)+'" y2="'+cy+'" stroke="rgba(255,255,255,0.2)" stroke-width="0.3" data-rack="1"/>';
      }
    }
  }

  // ── DOCK WALLS ──
  function drawDockWall(wy, wh, doors, isTop, lbl) {
    var dockZone = isTop ? 'dock-top' : 'dock-bot';
    s += '<rect x="'+bX+'" y="'+wy+'" width="'+bW+'" height="'+wh+'" fill="'+C.dock.fill+'" stroke="'+C.dock.stroke+'" stroke-width="0.3" data-zone="'+dockZone+'"/>';
    var dW = Math.min(12, (bW-10)/doors*0.55), dSp = bW/doors;
    for (var d = 0; d < doors; d++) {
      var dx = bX+(d+0.5)*dSp-dW/2, dy = isTop ? wy-3 : wy+wh-3;
      var isIn = twoDock ? isTop : (d < p.inDoors);
      s += '<rect x="'+dx+'" y="'+dy+'" width="'+dW+'" height="4" fill="'+(isIn?C.door.inb:C.door.outb)+'" rx="1"/>';
      if (dW > 5) s += '<text x="'+(dx+dW/2)+'" y="'+(wy+wh/2+2)+'" text-anchor="middle" fill="'+C.dock.text+'" font-size="'+F.door+'" font-family="Montserrat,sans-serif" font-weight="600">'+(isIn?'IN':'OUT')+'</text>';
    }
    // Place label INSIDE the dock rect (left-aligned) to avoid overlapping staging text
    s += '<text x="'+(bX+6)+'" y="'+(wy+wh/2+2)+'" text-anchor="start" fill="'+C.dock.text+'" font-size="'+F.detail+'" font-family="Montserrat,sans-serif" font-weight="600" data-zone-label="'+dockZone+'">'+lbl+'</text>';
  }

  if (twoDock) {
    drawDockWall(bY, dockH, p.inDoors, true, p.inDoors+' INBOUND DOORS');
    var rSY = bY+dockH;
    s += '<rect x="'+(bX+mg)+'" y="'+rSY+'" width="'+(bW-mg*2)+'" height="'+recvStH+'" fill="'+C.recv.fill+'" stroke="'+C.recv.stroke+'" stroke-width="0.3" rx="1" data-zone="recv"/>';
    s += '<text x="'+(bX+bW/2)+'" y="'+(rSY+recvStH/2+2)+'" text-anchor="middle" fill="'+C.recv.text+'" font-size="'+F.zone+'" font-family="Montserrat,sans-serif" font-weight="600" data-zone-label="recv">RECV STAGING — '+p.recvStagingSF.toLocaleString()+' sf</text>';
    drawDockWall(botDY, dockH, p.outDoors, false, p.outDoors+' OUTBOUND DOORS');
    s += '<rect x="'+(bX+mg)+'" y="'+botSY+'" width="'+(bW-mg*2)+'" height="'+shipStH+'" fill="'+C.ship.fill+'" stroke="'+C.ship.stroke+'" stroke-width="0.3" rx="1" data-zone="ship"/>';
    s += '<text x="'+(bX+bW/2)+'" y="'+(botSY+shipStH/2+2)+'" text-anchor="middle" fill="'+C.ship.text+'" font-size="'+F.zone+'" font-family="Montserrat,sans-serif" font-weight="600" data-zone-label="ship">SHIP STAGING — '+p.shipStagingSF.toLocaleString()+' sf</text>';
  } else {
    var combStH = Math.max(recvStH, shipStH);
    drawDockWall(botDY, dockH, p.totalDoors, false, p.totalDoors+' DOCK DOORS ('+p.inDoors+' IN / '+p.outDoors+' OUT)');
    var hW = (bW-mg*3)/2;
    s += '<rect x="'+(bX+mg)+'" y="'+botSY+'" width="'+hW+'" height="'+combStH+'" fill="'+C.recv.fill+'" stroke="'+C.recv.stroke+'" stroke-width="0.3" rx="1" data-zone="recv"/>';
    s += '<text x="'+(bX+mg+hW/2)+'" y="'+(botSY+combStH/2-1)+'" text-anchor="middle" fill="'+C.recv.text+'" font-size="'+F.zone+'" font-family="Montserrat,sans-serif" font-weight="600" data-zone-label="recv">RECV STAGING</text>';
    s += '<text x="'+(bX+mg+hW/2)+'" y="'+(botSY+combStH/2+7)+'" text-anchor="middle" fill="'+C.sub+'" font-size="'+F.sub+'" font-family="Montserrat,sans-serif" data-zone-label="recv">'+p.recvStagingSF.toLocaleString()+' sf</text>';
    var sX = bX+mg+hW+mg;
    s += '<rect x="'+sX+'" y="'+botSY+'" width="'+hW+'" height="'+combStH+'" fill="'+C.ship.fill+'" stroke="'+C.ship.stroke+'" stroke-width="0.3" rx="1" data-zone="ship"/>';
    s += '<text x="'+(sX+hW/2)+'" y="'+(botSY+combStH/2-1)+'" text-anchor="middle" fill="'+C.ship.text+'" font-size="'+F.zone+'" font-family="Montserrat,sans-serif" font-weight="600" data-zone-label="ship">SHIP STAGING</text>';
    s += '<text x="'+(sX+hW/2)+'" y="'+(botSY+combStH/2+7)+'" text-anchor="middle" fill="'+C.sub+'" font-size="'+F.sub+'" font-family="Montserrat,sans-serif" data-zone-label="ship">'+p.shipStagingSF.toLocaleString()+' sf</text>';
  }

  // ── DIMENSION LINES ──
  var dY = bY+bD+25;
  s += '<line x1="'+bX+'" y1="'+dY+'" x2="'+(bX+bW)+'" y2="'+dY+'" stroke="'+C.dim+'" stroke-width="0.5"/>';
  s += '<line x1="'+bX+'" y1="'+(dY-4)+'" x2="'+bX+'" y2="'+(dY+4)+'" stroke="'+C.dim+'" stroke-width="0.5"/>';
  s += '<line x1="'+(bX+bW)+'" y1="'+(dY-4)+'" x2="'+(bX+bW)+'" y2="'+(dY+4)+'" stroke="'+C.dim+'" stroke-width="0.5"/>';
  s += '<text x="'+(bX+bW/2)+'" y="'+(dY+14)+'" text-anchor="middle" fill="'+C.label+'" font-size="'+F.dim+'" font-family="Montserrat,sans-serif" font-weight="700">'+bW.toLocaleString()+' ft</text>';
  var dX = bX+bW+25;
  s += '<line x1="'+dX+'" y1="'+bY+'" x2="'+dX+'" y2="'+(bY+bD)+'" stroke="'+C.dim+'" stroke-width="0.5"/>';
  s += '<line x1="'+(dX-4)+'" y1="'+bY+'" x2="'+(dX+4)+'" y2="'+bY+'" stroke="'+C.dim+'" stroke-width="0.5"/>';
  s += '<line x1="'+(dX-4)+'" y1="'+(bY+bD)+'" x2="'+(dX+4)+'" y2="'+(bY+bD)+'" stroke="'+C.dim+'" stroke-width="0.5"/>';
  s += '<text x="'+(dX+7)+'" y="'+(bY+bD/2)+'" text-anchor="middle" fill="'+C.label+'" font-size="'+F.dim+'" font-family="Montserrat,sans-serif" font-weight="700" transform="rotate(90 '+(dX+7)+' '+(bY+bD/2)+')">'+bD.toLocaleString()+' ft</text>';

  // ── HEADER ──
  s += '<text x="'+(bX+bW/2)+'" y="'+(bY-15)+'" text-anchor="middle" fill="'+C.label+'" font-size="'+F.title+'" font-family="Montserrat,sans-serif" font-weight="800">'+p.totalSF.toLocaleString()+' SF FACILITY</text>';
  s += '<text x="'+(bX+bW/2)+'" y="'+(bY-4)+'" text-anchor="middle" fill="'+C.sub+'" font-size="'+F.detail+'" font-family="Montserrat,sans-serif">'+(twoDock?'Two-sided docks':'Single-sided docks')+' · '+(isVert?'Vertical':'Horizontal')+' rack orientation</text>';

  svg.innerHTML = s;

  // Save params for manual mode re-renders
  wscLastLayoutParams = p;

  // Enable drag handlers if in manual mode
  if (wscManualMode) {
    enableManualHandlers();
  }
}

function toggleStorageOptions() {
  var st = document.getElementById('wsc-storetype').value;
  document.getElementById('wsc-rack-opts').style.display = (st === 'single' || st === 'double' || st === 'mix') ? 'block' : 'none';
  document.getElementById('wsc-aisle-opts').style.display = (st === 'single' || st === 'double' || st === 'mix') ? 'block' : 'none';
  document.getElementById('wsc-bulk-opts').style.display = (st === 'bulk' || st === 'mix') ? 'block' : 'none';
  document.getElementById('wsc-mix-opts').style.display = (st === 'mix') ? 'block' : 'none';
  // Carton storage doesn't use rack/aisle/bulk options — all self-contained
}

// Enable/disable optional zone sqft inputs based on checkboxes
function toggleOptInputs() {
  var pairs = [['wsc-vas','wsc-vas-sf'],['wsc-ret','wsc-ret-sf'],['wsc-chg','wsc-chg-sf'],['wsc-stg','wsc-stg-sf']];
  for (var i = 0; i < pairs.length; i++) {
    var cb = document.getElementById(pairs[i][0]);
    var sf = document.getElementById(pairs[i][1]);
    if (cb && sf) sf.disabled = !cb.checked;
  }
}

// Balance storage mix to 100% — auto-adjust the third field
function balanceStorageMix(changed) {
  var fpEl = document.getElementById('wsc-pct-fullpal');
  var cpEl = document.getElementById('wsc-pct-ctnpal');
  var csEl = document.getElementById('wsc-pct-ctnshelv');
  var fp = parseInt(fpEl.value, 10) || 0;
  var cp = parseInt(cpEl.value, 10) || 0;
  var cs = parseInt(csEl.value, 10) || 0;

  // Clamp changed field to 0-100
  if (changed === 'fullpal') { fp = Math.max(0, Math.min(100, fp)); fpEl.value = fp; }
  if (changed === 'ctnpal') { cp = Math.max(0, Math.min(100, cp)); cpEl.value = cp; }
  if (changed === 'ctnshelv') { cs = Math.max(0, Math.min(100, cs)); csEl.value = cs; }

  // Auto-balance: adjust the field that was NOT just changed
  var total = fp + cp + cs;
  if (total !== 100) {
    var remainder = 100 - (changed === 'fullpal' ? fp : changed === 'ctnpal' ? cp : cs);
    if (changed === 'fullpal') {
      // Split remainder between cp and cs, proportionally
      var cpcs = cp + cs;
      if (cpcs > 0) { cp = Math.round(remainder * cp / cpcs); cs = remainder - cp; }
      else { cp = Math.round(remainder / 2); cs = remainder - cp; }
      cpEl.value = Math.max(0, cp); csEl.value = Math.max(0, cs);
    } else if (changed === 'ctnpal') {
      var fpcs = fp + cs;
      if (fpcs > 0) { fp = Math.round(remainder * fp / fpcs); cs = remainder - fp; }
      else { fp = Math.round(remainder / 2); cs = remainder - fp; }
      fpEl.value = Math.max(0, fp); csEl.value = Math.max(0, cs);
    } else {
      var fpcp = fp + cp;
      if (fpcp > 0) { fp = Math.round(remainder * fp / fpcp); cp = remainder - fp; }
      else { fp = Math.round(remainder / 2); cp = remainder - fp; }
      fpEl.value = Math.max(0, fp); cpEl.value = Math.max(0, cp);
    }
  }
}

// Toggle forward pick options panel visibility
function toggleFwdPick() {
  var cb = document.getElementById('wsc-fwd');
  var opts = document.getElementById('wsc-fwd-opts');
  if (opts) opts.style.display = cb && cb.checked ? 'block' : 'none';
}

// Toggle sprinkler custom input visibility (FIX 3)
function toggleSprinklerCustom() {
  var select = document.getElementById('wsc-sprinkler');
  var customInput = document.getElementById('wsc-sprinkler-custom');
  if (customInput) {
    customInput.style.display = (select && select.value === 'custom') ? 'block' : 'none';
  }
}

// Custom zones management
var wscCustomZoneCount = 0;

function addCustomZone() {
  wscCustomZoneCount++;
  var id = 'wsc-cz-' + wscCustomZoneCount;
  var container = document.getElementById('wsc-custom-zones');
  var row = document.createElement('label');
  row.id = id + '-row';
  row.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ies-gray-700);';
  row.innerHTML = '<input type="text" id="' + id + '-name" placeholder="Zone name..." value="Custom Zone ' + wscCustomZoneCount + '" oninput="calcWarehouse()" style="width:120px;padding:4px 6px;border:1.5px solid var(--ies-gray-200);border-radius:6px;font-size:12px;">' +
    '<input type="number" id="' + id + '-sf" value="2000" min="0" step="500" oninput="calcWarehouse()" onchange="calcWarehouse()" style="width:72px;padding:4px 6px;border:1.5px solid var(--ies-gray-200);border-radius:6px;font-size:12px;text-align:right;margin-left:auto;">' +
    '<span style="font-size:11px;color:var(--ies-gray-400);">sf</span>' +
    '<button onclick="removeCustomZone(\'' + id + '\')" style="background:none;border:none;color:#ef4444;font-size:16px;cursor:pointer;padding:0 4px;line-height:1;" title="Remove zone">&times;</button>';
  container.appendChild(row);
  calcWarehouse();
}

function removeCustomZone(id) {
  var row = document.getElementById(id + '-row');
  if (row) row.remove();
  calcWarehouse();
}

// ═══════════════════ LAYOUT MODE: AUTO vs MANUAL ═══════════════════
var wscManualMode = false;
var wscManualZones = {};
var wscAutoZones = {};  // snapshot of auto layout footprints for comparison
var wscDragState = null;
var wscLastLayoutParams = null; // saved for manual re-render
var wscTightenedBW = 0; // tightened building width from 2D render
var wscTightenedBD = 0; // tightened building depth from 2D render

// Redraw racks inside the storage zone using current manual bounds
function redrawManualRacks() {
  var svg = document.getElementById('wsc-layout-svg');
  var p = wscLastLayoutParams;
  if (!svg || !p) return;
  var sz = wscManualZones['storage'];
  if (!sz) return;

  // Remove old rack elements
  var old = svg.querySelectorAll('[data-rack]');
  for (var i = old.length - 1; i >= 0; i--) old[i].remove();

  // Build new rack SVG string
  var isVert = p.rackDir === 'vertical';
  var C_rack = 'rgba(37,99,235,0.45)';
  var C_stroke = 'rgba(37,99,235,0.5)';
  var C_aisle = 'rgba(255,255,255,0.3)';
  var rPad = 6, rLabelH = 0;
  var rx = sz.x + rPad, ry = sz.y + rPad;
  var rw = sz.w - rPad*2, rh = sz.h - rPad*2;
  if (rw < 20 || rh < 20) return;

  var s = '';
  function addRacks(x, y, w, h, modFt, aisleFt) {
    var totFt = modFt + aisleFt;
    var rackRatio = modFt / totFt;
    if (isVert) {
      var nm = Math.max(2, Math.min(18, Math.floor(w / totFt)));
      var mW = w / nm, rkW = mW * rackRatio, hr = (rkW-1)/2;
      for (var i = 0; i < nm; i++) {
        var mx = x + i*mW;
        if (mx + rkW > x + w + 1) break;
        s += '<rect x="'+mx+'" y="'+y+'" width="'+hr+'" height="'+h+'" fill="'+C_rack+'" rx="0.5" data-rack="1"/>';
        s += '<rect x="'+(mx+hr+1)+'" y="'+y+'" width="'+hr+'" height="'+h+'" fill="'+C_rack+'" rx="0.5" data-rack="1"/>';
        if (mW-rkW > 4 && i < nm-1) {
          var ax = mx+rkW+(mW-rkW)/2;
          s += '<text x="'+ax+'" y="'+(y+h/2)+'" text-anchor="middle" fill="'+C_aisle+'" font-size="5" font-family="Montserrat,sans-serif" data-rack="1" transform="rotate(90 '+ax+' '+(y+h/2)+')">'+aisleFt+'\' aisle</text>';
        }
      }
    } else {
      var nm = Math.max(2, Math.min(18, Math.floor(h / totFt)));
      var mH = h / nm, rkH = mH * rackRatio, hr = (rkH-1)/2;
      for (var i = 0; i < nm; i++) {
        var my = y + i*mH;
        if (my + rkH > y + h + 1) break;
        s += '<rect x="'+x+'" y="'+my+'" width="'+w+'" height="'+hr+'" fill="'+C_rack+'" rx="0.5" data-rack="1"/>';
        s += '<rect x="'+x+'" y="'+(my+hr+1)+'" width="'+w+'" height="'+hr+'" fill="'+C_rack+'" rx="0.5" data-rack="1"/>';
        if (mH-rkH > 4 && i < nm-1) {
          s += '<text x="'+(x+w/2)+'" y="'+(my+rkH+(mH-rkH)/2+2)+'" text-anchor="middle" fill="'+C_aisle+'" font-size="5" font-family="Montserrat,sans-serif" data-rack="1">'+aisleFt+'\' aisle</text>';
        }
      }
    }
  }

  function addBulk(x, y, w, h) {
    var bayDepthFt = p.bulkDepth * 4, bulkAisleFt = 12;
    var moduleFt = (2*bayDepthFt)+bulkAisleFt, bayRatio = (2*bayDepthFt)/moduleFt;
    if (isVert) {
      var nm = Math.max(1, Math.min(14, Math.floor(w/moduleFt)));
      var mW = w/Math.max(nm,1), bayW = mW*bayRatio;
      for (var b = 0; b < nm; b++) {
        var bx = x+b*mW;
        s += '<rect x="'+bx+'" y="'+y+'" width="'+bayW+'" height="'+h+'" fill="'+C_rack+'" stroke="'+C_stroke+'" stroke-width="0.3" rx="0.5" data-rack="1"/>';
      }
    } else {
      var nm = Math.max(1, Math.min(14, Math.floor(h/moduleFt)));
      var mH = h/Math.max(nm,1), bayH = mH*bayRatio;
      for (var b = 0; b < nm; b++) {
        var by = y+b*mH;
        s += '<rect x="'+x+'" y="'+by+'" width="'+w+'" height="'+bayH+'" fill="'+C_rack+'" stroke="'+C_stroke+'" stroke-width="0.3" rx="0.5" data-rack="1"/>';
      }
    }
  }

  function addShelving(x, y, w, h) {
    var shelfModFt = 9.5, shelfRatio = 4.5/9.5;
    var shelfColor = '#4a90d9';
    if (isVert) {
      var nm = Math.max(1, Math.min(20, Math.floor(w/shelfModFt)));
      var mW = w/Math.max(nm,1), sW = mW*shelfRatio;
      for (var i = 0; i < nm; i++) {
        var sx = x+i*mW;
        s += '<rect x="'+sx+'" y="'+y+'" width="'+sW+'" height="'+h+'" fill="'+shelfColor+'" stroke="rgba(255,255,255,0.15)" stroke-width="0.3" rx="0.5" data-rack="1"/>';
        var cx = sx+sW/2;
        s += '<line x1="'+cx+'" y1="'+y+'" x2="'+cx+'" y2="'+(y+h)+'" stroke="rgba(255,255,255,0.2)" stroke-width="0.3" data-rack="1"/>';
      }
    } else {
      var nm = Math.max(1, Math.min(20, Math.floor(h/shelfModFt)));
      var mH = h/Math.max(nm,1), sH = mH*shelfRatio;
      for (var i = 0; i < nm; i++) {
        var sy = y+i*mH;
        s += '<rect x="'+x+'" y="'+sy+'" width="'+w+'" height="'+sH+'" fill="'+shelfColor+'" stroke="rgba(255,255,255,0.15)" stroke-width="0.3" rx="0.5" data-rack="1"/>';
        var cy = sy+sH/2;
        s += '<line x1="'+x+'" y1="'+cy+'" x2="'+(x+w)+'" y2="'+cy+'" stroke="rgba(255,255,255,0.2)" stroke-width="0.3" data-rack="1"/>';
      }
    }
  }

  var modFt = p.storeType === 'double' ? 16.5 : 8.5;
  if (p.storeType === 'single' || p.storeType === 'double') {
    addRacks(rx, ry, rw, rh, modFt, p.aisleW);
  } else if (p.storeType === 'bulk') {
    addBulk(rx, ry, rw, rh);
  } else if (p.storeType === 'carton') {
    addShelving(rx, ry, rw, rh);
  } else { // mix
    var rPct = p.mixRackPct;
    if (isVert) { addRacks(rx, ry, rw*rPct, rh, 8.5, p.aisleW); addBulk(rx+rw*rPct+3, ry, rw*(1-rPct)-3, rh); }
    else { addRacks(rx, ry, rw, rh*rPct, 8.5, p.aisleW); addBulk(rx, ry+rh*rPct+3, rw, rh*(1-rPct)-3); }
  }

  // Insert rack elements before the manual overlays (highlights/handles)
  var firstHighlight = svg.querySelector('[data-highlight]');
  if (firstHighlight) {
    var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tmp.innerHTML = s;
    while (tmp.firstChild) svg.insertBefore(tmp.firstChild, firstHighlight);
  } else {
    // Fallback: append
    var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tmp.innerHTML = s;
    while (tmp.firstChild) svg.appendChild(tmp.firstChild);
  }
}

// Compute SF for a zone based on its manual bounds (width * height in SVG = sq ft)
function computeManualSF(zone) {
  var z = wscManualZones[zone];
  if (!z) return 0;
  return Math.round(z.w * z.h);
}

function toggleLayoutMode() {
  var cb = document.getElementById('wsc-layout-mode');
  var knob = document.getElementById('wsc-mode-knob');
  wscManualMode = cb.checked;
  var comparePanel = document.getElementById('wsc-manual-compare');

  if (wscManualMode) {
    knob.style.left = '18px';
    knob.style.background = 'var(--ies-blue)';
    if (comparePanel) comparePanel.style.display = 'block';
    captureAutoPositions();
    enableManualHandlers();
    updateManualCompare();
  } else {
    knob.style.left = '2px';
    knob.style.background = '#fff';
    if (comparePanel) comparePanel.style.display = 'none';
    wscManualZones = {};
    calcWarehouse(); // re-render in auto mode
  }
}

// Update the Manual vs Auto comparison KPIs (apples-to-apples: both use SVG rect footprints)
function updateManualCompare() {
  var p = wscLastLayoutParams;
  if (!p) return;

  // Manual zone SFs from current bounds (width × height = sq ft in SVG coords)
  var manualTotalSF = 0, manualStorageSF = 0;
  var mk = Object.keys(wscManualZones);
  for (var i = 0; i < mk.length; i++) {
    var z = wscManualZones[mk[i]];
    var sf = Math.round(z.w * z.h);
    manualTotalSF += sf;
    if (mk[i] === 'storage') manualStorageSF = sf;
  }

  // Auto zone SFs from snapshot rect footprints (same methodology as manual)
  var autoTotalSF = 0, autoStorageSF = 0;
  var ak = Object.keys(wscAutoZones);
  for (var i = 0; i < ak.length; i++) {
    var z = wscAutoZones[ak[i]];
    var sf = Math.round(z.w * z.h);
    autoTotalSF += sf;
    if (ak[i] === 'storage') autoStorageSF = sf;
  }

  // Estimate positions using auto calc's SF-per-floor-position ratio
  var autoCalcStorageSF = p.storageSF || 1;
  var autoCalcPositions = p.grossPositions || 0;
  var sfPerFloorPos = autoCalcPositions > 0 ? (autoCalcStorageSF / (autoCalcPositions / p.rackLevels)) : 30;

  var manualFloorPos = sfPerFloorPos > 0 ? Math.floor(manualStorageSF / sfPerFloorPos) : 0;
  var manualPositions = manualFloorPos * p.rackLevels;

  var autoFloorPos = sfPerFloorPos > 0 ? Math.floor(autoStorageSF / sfPerFloorPos) : 0;
  var autoPositions = autoFloorPos * p.rackLevels;

  var manualSFPerPos = manualPositions > 0 ? fmtNum(manualTotalSF / manualPositions, 1) : '—';
  var autoSFPerPos = autoPositions > 0 ? fmtNum(autoTotalSF / autoPositions, 1) : '—';

  // Calc'd Need values (from the functional calculator, for reference)
  var calcTotalSF = p.totalSF || 0;
  var calcStorageSF = p.storageSF || 0;
  var calcPositions = p.grossPositions || 0;
  var calcSFPerPos = calcPositions > 0 ? fmtNum(calcTotalSF / calcPositions, 1) : '—';

  // Helper: format delta (manual vs auto layout)
  function delta(manual, auto) {
    var d = manual - auto;
    var pct = auto > 0 ? Math.round((d / auto) * 100) : 0;
    var sign = d >= 0 ? '+' : '';
    var color = d > 0 ? '#34d399' : d < 0 ? '#f87171' : 'rgba(255,255,255,.4)';
    return '<span style="color:'+color+'">'+sign+d.toLocaleString()+' ('+sign+pct+'%)</span>';
  }

  // Update DOM
  var el = function(id) { return document.getElementById(id); };

  if (el('wsc-m-total')) el('wsc-m-total').textContent = manualTotalSF.toLocaleString();
  if (el('wsc-m-total-delta')) el('wsc-m-total-delta').innerHTML = delta(manualTotalSF, autoTotalSF);
  if (el('wsc-m-total-auto')) el('wsc-m-total-auto').textContent = autoTotalSF.toLocaleString();
  if (el('wsc-m-total-calc')) el('wsc-m-total-calc').textContent = calcTotalSF.toLocaleString();

  if (el('wsc-m-storage')) el('wsc-m-storage').textContent = manualStorageSF.toLocaleString();
  if (el('wsc-m-storage-delta')) el('wsc-m-storage-delta').innerHTML = delta(manualStorageSF, autoStorageSF);
  if (el('wsc-m-storage-auto')) el('wsc-m-storage-auto').textContent = autoStorageSF.toLocaleString();
  if (el('wsc-m-storage-calc')) el('wsc-m-storage-calc').textContent = calcStorageSF.toLocaleString();

  if (el('wsc-m-positions')) el('wsc-m-positions').textContent = manualPositions.toLocaleString();
  if (el('wsc-m-positions-delta')) el('wsc-m-positions-delta').innerHTML = delta(manualPositions, autoPositions);
  if (el('wsc-m-positions-auto')) el('wsc-m-positions-auto').textContent = autoPositions.toLocaleString();
  if (el('wsc-m-positions-calc')) el('wsc-m-positions-calc').textContent = calcPositions.toLocaleString();

  if (el('wsc-m-sfperpos')) el('wsc-m-sfperpos').textContent = manualSFPerPos;
  if (el('wsc-m-sfperpos-auto')) el('wsc-m-sfperpos-auto').textContent = autoSFPerPos;
  if (el('wsc-m-sfperpos-calc')) el('wsc-m-sfperpos-calc').textContent = calcSFPerPos;
  if (el('wsc-m-sfperpos-delta')) {
    var mSP = parseFloat(manualSFPerPos) || 0;
    var aSP = parseFloat(autoSFPerPos) || 0;
    if (mSP > 0 && aSP > 0) {
      var d = mSP - aSP;
      var color = d > 0 ? '#f87171' : d < 0 ? '#34d399' : 'rgba(255,255,255,.4)';
      el('wsc-m-sfperpos-delta').innerHTML = '<span style="color:'+color+'">'+(d>=0?'+':'')+fmtNum(d, 1)+'</span>';
    } else {
      el('wsc-m-sfperpos-delta').textContent = '';
    }
  }
}

function captureAutoPositions() {
  var svg = document.getElementById('wsc-layout-svg');
  if (!svg) return;
  var zones = svg.querySelectorAll('[data-zone]');
  wscManualZones = {};
  wscAutoZones = {};
  for (var i = 0; i < zones.length; i++) {
    var el = zones[i];
    var name = el.getAttribute('data-zone');
    var bounds = {
      x: parseFloat(el.getAttribute('x')),
      y: parseFloat(el.getAttribute('y')),
      w: parseFloat(el.getAttribute('width')),
      h: parseFloat(el.getAttribute('height'))
    };
    wscManualZones[name] = { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };
    wscAutoZones[name] = { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };
  }
}

function enableManualHandlers() {
  var svg = document.getElementById('wsc-layout-svg');
  if (!svg) return;

  // Get SVG coordinate transform helper
  var svgPt = svg.createSVGPoint ? svg.createSVGPoint() : null;
  function svgPoint(evt) {
    if (!svgPt) return { x: 0, y: 0 };
    var ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    svgPt.x = evt.clientX;
    svgPt.y = evt.clientY;
    var p = svgPt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  var ns = 'http://www.w3.org/2000/svg';
  var zones = svg.querySelectorAll('[data-zone]');

  // Add drag handles and visual indicators to each zone
  for (var i = 0; i < zones.length; i++) {
    (function(zoneEl) {
      var zn = zoneEl.getAttribute('data-zone');
      zoneEl.style.cursor = 'move';

      // Dashed highlight border to indicate draggable
      var zx = parseFloat(zoneEl.getAttribute('x'));
      var zy = parseFloat(zoneEl.getAttribute('y'));
      var zw = parseFloat(zoneEl.getAttribute('width'));
      var zh = parseFloat(zoneEl.getAttribute('height'));

      var highlight = document.createElementNS(ns, 'rect');
      highlight.setAttribute('x', zx); highlight.setAttribute('y', zy);
      highlight.setAttribute('width', zw); highlight.setAttribute('height', zh);
      highlight.setAttribute('fill', 'none');
      highlight.setAttribute('stroke', 'rgba(255,255,255,0.5)');
      highlight.setAttribute('stroke-width', '1');
      highlight.setAttribute('stroke-dasharray', '4,3');
      highlight.setAttribute('rx', '2');
      highlight.setAttribute('data-highlight', zn);
      highlight.setAttribute('pointer-events', 'none');
      svg.appendChild(highlight);

      // Resize handle (bottom-right corner)
      var handle = document.createElementNS(ns, 'rect');
      handle.setAttribute('x', zx + zw - 7);
      handle.setAttribute('y', zy + zh - 7);
      handle.setAttribute('width', 7);
      handle.setAttribute('height', 7);
      handle.setAttribute('fill', 'rgba(255,255,255,0.7)');
      handle.setAttribute('stroke', 'rgba(255,255,255,0.9)');
      handle.setAttribute('stroke-width', '0.5');
      handle.setAttribute('rx', '1.5');
      handle.setAttribute('data-resize', zn);
      handle.style.cursor = 'nwse-resize';
      svg.appendChild(handle);

      // Move icon (4 small arrows) in center of zone
      if (zw > 30 && zh > 20) {
        var cx = zx + zw/2, cy = zy + zh/2;
        var icon = document.createElementNS(ns, 'g');
        icon.setAttribute('pointer-events', 'none');
        icon.setAttribute('data-moveicon', zn);
        icon.setAttribute('opacity', '0.35');
        var a = 4; // arrow size
        // Four arrows (up, down, left, right)
        icon.innerHTML = '<path d="M'+cx+' '+(cy-a-1)+'l-2 3h4z M'+cx+' '+(cy+a+1)+'l-2-3h4z M'+(cx-a-1)+' '+cy+'l3-2v4z M'+(cx+a+1)+' '+cy+'l-3-2v4z" fill="rgba(255,255,255,0.8)"/>';
        svg.appendChild(icon);
      }

      // Drag handler
      zoneEl.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        var sp = svgPoint(e);
        wscDragState = {
          type: 'move', zone: zn, el: zoneEl,
          startX: sp.x, startY: sp.y,
          origX: parseFloat(zoneEl.getAttribute('x')),
          origY: parseFloat(zoneEl.getAttribute('y'))
        };
      });

      // Resize handler
      handle.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        var sp = svgPoint(e);
        wscDragState = {
          type: 'resize', zone: zn, el: zoneEl, handle: handle,
          startX: sp.x, startY: sp.y,
          origW: parseFloat(zoneEl.getAttribute('width')),
          origH: parseFloat(zoneEl.getAttribute('height'))
        };
      });
    })(zones[i]);
  }

  // Helper: update highlight, handle, and move icon positions for a zone
  function updateZoneVisuals(zn, x, y, w, h) {
    var hl = svg.querySelector('[data-highlight="' + zn + '"]');
    if (hl) { hl.setAttribute('x',x); hl.setAttribute('y',y); hl.setAttribute('width',w); hl.setAttribute('height',h); }
    var hd = svg.querySelector('[data-resize="' + zn + '"]');
    if (hd) { hd.setAttribute('x', x+w-7); hd.setAttribute('y', y+h-7); }
    var mi = svg.querySelector('[data-moveicon="' + zn + '"]');
    if (mi) {
      var cx = x+w/2, cy = y+h/2, a = 4;
      mi.innerHTML = '<path d="M'+cx+' '+(cy-a-1)+'l-2 3h4z M'+cx+' '+(cy+a+1)+'l-2-3h4z M'+(cx-a-1)+' '+cy+'l3-2v4z M'+(cx+a+1)+' '+cy+'l-3-2v4z" fill="rgba(255,255,255,0.8)"/>';
    }
  }

  // Recenter all labels for a zone within its current bounds
  function recenterLabels(zn, zx, zy, zw, zh, sf) {
    var labels = svg.querySelectorAll('[data-zone-label="' + zn + '"]');
    if (labels.length === 0) return;
    var anchor = labels[0].getAttribute('text-anchor') || 'middle';
    var isStart = (anchor === 'start');
    // Count labels to stack them vertically centered
    var lineH = 9; // approx line spacing
    var totalH = labels.length * lineH;
    var startY = zy + (zh - totalH) / 2 + lineH * 0.7;
    // For start-anchored labels (storage, dock), position at top-left inside zone
    if (isStart) {
      startY = zy + 10;
    }
    for (var l = 0; l < labels.length; l++) {
      if (isStart) {
        labels[l].setAttribute('x', zx + 4);
        labels[l].setAttribute('y', startY + l * lineH);
      } else {
        labels[l].setAttribute('x', zx + zw / 2);
        labels[l].setAttribute('y', startY + l * lineH);
      }
      // Update SF text if present
      if (sf !== undefined) {
        var txt = labels[l].textContent;
        if (txt.match(/[\d,]+ sf/)) {
          labels[l].textContent = txt.replace(/[\d,]+ sf/, sf.toLocaleString() + ' sf');
        }
      }
      // Clear any stale orig-x/orig-y from drag tracking so future drags use new positions
      labels[l].removeAttribute('data-orig-x');
      labels[l].removeAttribute('data-orig-y');
    }
  }

  // Global mouse handlers on SVG
  svg.addEventListener('mousemove', function(e) {
    if (!wscDragState) return;
    var sp = svgPoint(e);
    var d = wscDragState;
    var dx = sp.x - d.startX;
    var dy = sp.y - d.startY;

    if (d.type === 'move') {
      var nx = d.origX + dx;
      var ny = d.origY + dy;
      d.el.setAttribute('x', nx);
      d.el.setAttribute('y', ny);
      var zn = d.zone;
      var w = parseFloat(d.el.getAttribute('width'));
      var h = parseFloat(d.el.getAttribute('height'));
      updateZoneVisuals(zn, nx, ny, w, h);
      // Move associated text labels
      var texts = svg.querySelectorAll('[data-zone-label="' + zn + '"]');
      for (var t = 0; t < texts.length; t++) {
        var origTx = parseFloat(texts[t].getAttribute('data-orig-x') || texts[t].getAttribute('x'));
        var origTy = parseFloat(texts[t].getAttribute('data-orig-y') || texts[t].getAttribute('y'));
        if (!texts[t].getAttribute('data-orig-x')) {
          texts[t].setAttribute('data-orig-x', origTx);
          texts[t].setAttribute('data-orig-y', origTy);
        }
        texts[t].setAttribute('x', origTx + dx);
        texts[t].setAttribute('y', origTy + dy);
      }
    } else if (d.type === 'resize') {
      var nw = Math.max(20, d.origW + dx);
      var nh = Math.max(14, d.origH + dy);
      d.el.setAttribute('width', nw);
      d.el.setAttribute('height', nh);
      var rx = parseFloat(d.el.getAttribute('x'));
      var ry = parseFloat(d.el.getAttribute('y'));
      updateZoneVisuals(d.zone, rx, ry, nw, nh);
      // Live SF update + recenter labels within resized zone
      var liveSF = Math.round(nw * nh);
      recenterLabels(d.zone, rx, ry, nw, nh, liveSF);
    }
  });

  function finishDrag() {
    if (!wscDragState) return;
    var d = wscDragState;
    wscManualZones[d.zone] = {
      x: parseFloat(d.el.getAttribute('x')),
      y: parseFloat(d.el.getAttribute('y')),
      w: parseFloat(d.el.getAttribute('width')),
      h: parseFloat(d.el.getAttribute('height'))
    };

    // Re-render racks when storage zone is resized
    if (d.zone === 'storage' && d.type === 'resize') {
      redrawManualRacks();
    }

    // Recenter labels and update SF
    var zb = wscManualZones[d.zone];
    if (zb) {
      var sf = computeManualSF(d.zone);
      recenterLabels(d.zone, zb.x, zb.y, zb.w, zb.h, sf);
    }

    // Update the comparison KPI tile
    updateManualCompare();

    wscDragState = null;
  }
  svg.addEventListener('mouseup', finishDrag);
  svg.addEventListener('mouseleave', finishDrag);
}

// ── COLLAPSIBLE CALCULATOR SECTIONS ──
function toggleCalcSection(hdrEl) {
  var body = hdrEl.nextElementSibling;
  if (!body || !body.classList.contains('wsc-section-body')) return;
  var collapsed = body.classList.toggle('collapsed');
  hdrEl.classList.toggle('collapsed', collapsed);
  setTimeout(syncCalcPanelHeight, 50);
}

function toggleAllCalcSections() {
  var sections = document.querySelectorAll('#dt-warehouse [data-wsc-section]');
  if (!sections.length) return;
  // Check current state — if any are open, collapse all; if all collapsed, expand all
  var anyOpen = false;
  sections.forEach(function(sec) {
    var body = sec.querySelector('.wsc-section-body');
    if (body && !body.classList.contains('collapsed')) anyOpen = true;
  });
  sections.forEach(function(sec) {
    var hdr = sec.querySelector('.wsc-section-hdr');
    var body = sec.querySelector('.wsc-section-body');
    if (hdr && body) {
      if (anyOpen) {
        body.classList.add('collapsed');
        hdr.classList.add('collapsed');
      } else {
        body.classList.remove('collapsed');
        hdr.classList.remove('collapsed');
      }
    }
  });
  setTimeout(syncCalcPanelHeight, 50);
}

function resetCalculator() {
  var defaults = {
    'wsc-scenario-name': '', 'wsc-peakunits': 500000, 'wsc-avgunits': 350000,
    'wsc-pct-fullpal': 60, 'wsc-pct-ctnpal': 30, 'wsc-pct-ctnshelv': 10,
    'wsc-upp': 48, 'wsc-upc-pal': 6, 'wsc-cpp': 12, 'wsc-upc-shelv': 6, 'wsc-cpl': 4,
    'wsc-hcbuf': 10, 'wsc-clearht': 36, 'wsc-loadht': 54,
    'wsc-bulkdp': 4, 'wsc-stackhi': 3, 'wsc-mixrack': 60,
    'wsc-inpal': 400, 'wsc-outpal': 350, 'wsc-pdph': 12, 'wsc-dockhr': 10, 'wsc-office': 5,
    'wsc-fwd-skus': 2000, 'wsc-fwd-days': 3, 'wsc-ob-units': 5000000, 'wsc-op-days': 250
  };
  for (var id in defaults) {
    var el = document.getElementById(id);
    if (el) el.value = defaults[id];
  }
  // Reset dropdowns
  document.getElementById('wsc-storetype').value = 'single';
  document.getElementById('wsc-aisletype').value = 'narrow';
  document.getElementById('wsc-rackdir').value = 'horizontal';
  document.getElementById('wsc-dockconfig').value = 'one';
  document.getElementById('wsc-fwd-type').value = 'cartonflow';
  // Uncheck all optional zones
  ['wsc-fwd','wsc-vas','wsc-ret','wsc-chg','wsc-stg'].forEach(function(id) {
    var cb = document.getElementById(id); if (cb) cb.checked = false;
  });
  // Clear custom zones
  var cz = document.getElementById('wsc-custom-zones'); if (cz) cz.innerHTML = '';
  toggleStorageOptions(); toggleFwdPick(); toggleOptInputs(); calcWarehouse();
}

function exportCalculatorSummary() {
  var scenario = (document.getElementById('wsc-scenario-name').value || 'Untitled Scenario').trim();
  var sqft = document.getElementById('wsc-r-sqft').textContent;
  var positions = document.getElementById('wsc-r-positions').textContent;
  var docks = document.getElementById('wsc-r-docks').textContent;
  var height = document.getElementById('wsc-r-height').textContent;
  var levels = document.getElementById('wsc-r-levels').textContent;
  var util = document.getElementById('wsc-r-util').textContent;
  var sfpp = document.getElementById('wsc-r-sfperpos').textContent;
  var docksIn = document.getElementById('wsc-r-docks-in').textContent;
  var docksOut = document.getElementById('wsc-r-docks-out').textContent;

  var lines = [
    'IES WAREHOUSE SIZING — ' + scenario,
    '═'.repeat(50),
    '',
    'FACILITY SUMMARY',
    '  Total Facility:  ' + sqft + ' SF',
    '  Positions:       ' + positions + ' (' + util + ' utilization)',
    '  SF per Position: ' + sfpp,
    '  Clear Height:    ' + height + ' (' + levels + ' rack levels)',
    '  Dock Doors:      ' + docks + ' (' + docksIn + ' inbound / ' + docksOut + ' outbound)',
    '',
    'ZONE ALLOCATION',
  ];

  // Grab zone table data
  var rows = document.querySelectorAll('#wsc-zone-table tr');
  rows.forEach(function(row, i) {
    if (i === 0) return; // skip header
    var cells = row.querySelectorAll('td, th');
    if (cells.length >= 3) {
      var zone = cells[0].textContent.trim();
      var sf = cells[1].textContent.trim();
      var pct = cells[2].textContent.trim();
      lines.push('  ' + zone.padEnd(22) + sf.padStart(10) + '  ' + pct.padStart(5));
    }
  });

  lines.push('');
  lines.push('Generated by IES Intelligence Hub — ' + new Date().toLocaleDateString());

  var text = lines.join('\n');

  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      var btn = document.querySelector('.wsc-action-btn[onclick*="export"]');
      if (btn) { var orig = btn.innerHTML; btn.innerHTML = '<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!'; btn.style.color='var(--ies-green)'; btn.style.borderColor='var(--ies-green)'; setTimeout(function() { btn.innerHTML = orig; btn.style.color=''; btn.style.borderColor=''; }, 2000); }
    }).catch(function(e){ console.error('Clipboard write failed:', e); });
  }
}

function calcWarehouse() { try {
  // ── READ INPUTS ──
  var peakUnits = parseInt(document.getElementById('wsc-peakunits').value.replace(/,/g,''), 10) || 500000;
  var avgUnits = parseInt(document.getElementById('wsc-avgunits').value.replace(/,/g,''), 10) || 350000;

  // Storage mix percentages
  var pctFullPal = (parseInt(document.getElementById('wsc-pct-fullpal').value, 10) || 0) / 100;
  var pctCtnPal = (parseInt(document.getElementById('wsc-pct-ctnpal').value, 10) || 0) / 100;
  var pctCtnShelv = (parseInt(document.getElementById('wsc-pct-ctnshelv').value, 10) || 0) / 100;

  // Unit conversion factors
  var unitsPerPallet = parseInt(document.getElementById('wsc-upp').value, 10) || 48;
  var unitsPerCartonPal = parseInt(document.getElementById('wsc-upc-pal').value, 10) || 6;
  var cartonsPerPallet = parseInt(document.getElementById('wsc-cpp').value, 10) || 12;
  var unitsPerCartonShelv = parseInt(document.getElementById('wsc-upc-shelv').value, 10) || 6;
  var cartonsPerLocation = parseInt(document.getElementById('wsc-cpl').value, 10) || 4;

  var clearHeightFt = parseInt(document.getElementById('wsc-clearht').value, 10) || 36;
  var loadHeightIn = parseInt(document.getElementById('wsc-loadht').value, 10) || 48;

  var storeType = document.getElementById('wsc-storetype').value;
  var aisleType = document.getElementById('wsc-aisletype').value;
  var bulkDepth = parseInt(document.getElementById('wsc-bulkdp').value, 10) || 4;
  var stackHi = parseInt(document.getElementById('wsc-stackhi').value, 10) || 3;
  var mixRackPct = (parseInt(document.getElementById('wsc-mixrack').value, 10) || 70) / 100;

  var inPal = parseInt(document.getElementById('wsc-inpal').value.replace(/,/g,''), 10) || 200;
  var outPal = parseInt(document.getElementById('wsc-outpal').value.replace(/,/g,''), 10) || 200;
  var pdph = parseInt(document.getElementById('wsc-pdph').value, 10) || 20;
  var dockHrs = parseInt(document.getElementById('wsc-dockhr').value, 10) || 8;

  var officePct = parseInt(document.getElementById('wsc-office').value, 10) / 100;

  // Layout config
  var rackDir = document.getElementById('wsc-rackdir').value;   // 'horizontal' or 'vertical'
  var dockConfig = document.getElementById('wsc-dockconfig').value; // 'one' or 'two'

  // ── AISLE WIDTHS (feet) ──
  var aisleWidths = { wide: 12, narrow: 10, vna: 6 };
  var aisleW = aisleWidths[aisleType] || 10;

  // ── AUTO-CALCULATE RACK LEVELS from clear height & load height ──
  // FIX 3: Sprinkler clearance now configurable (was hardcoded 18")
  var sprinklerSelect = document.getElementById('wsc-sprinkler').value;
  var sprinklerClearanceIn = 18;
  if (sprinklerSelect === '24') sprinklerClearanceIn = 24;
  else if (sprinklerSelect === '36') sprinklerClearanceIn = 36;
  else if (sprinklerSelect === 'custom') {
    var customVal = parseInt(document.getElementById('wsc-sprinkler-custom').value, 10) || 18;
    sprinklerClearanceIn = Math.max(12, Math.min(48, customVal));
  }
  document.getElementById('wsc-sprinkler-val').textContent = sprinklerClearanceIn;

  // Tier height = pallet load height + 6" beam + 4" clearance = loadHeightIn + 10"
  // Usable height = (clear height in inches) - sprinkler clearance (configurable)
  // Levels = floor(usable height / tier height)
  var tierHeightIn = loadHeightIn + 10;
  var usableHeightIn = (clearHeightFt * 12) - sprinklerClearanceIn;
  var rackLevels = Math.min(7, Math.max(2, Math.floor(usableHeightIn / tierHeightIn)));

  // FIX 3: Display max stacking height (clear height minus sprinkler clearance)
  var maxStackHeightFt = (clearHeightFt * 12 - sprinklerClearanceIn) / 12;
  document.getElementById('wsc-max-stack-ht').textContent = fmtNum(maxStackHeightFt, 1) + ' ft';

  // Update displayed values
  document.getElementById('wsc-clearht-val').textContent = clearHeightFt;
  document.getElementById('wsc-loadht-val').textContent = loadHeightIn;
  document.getElementById('wsc-rackhi-val').textContent = rackLevels;
  document.getElementById('wsc-bulkdp-val').textContent = bulkDepth;
  document.getElementById('wsc-stackhi-val').textContent = stackHi;
  document.getElementById('wsc-mixrack-val').textContent = Math.round(mixRackPct * 100) + '%';
  document.getElementById('wsc-inpal-val').textContent = inPal.toLocaleString();
  document.getElementById('wsc-outpal-val').textContent = outPal.toLocaleString();
  document.getElementById('wsc-pdph-val').textContent = pdph;
  document.getElementById('wsc-dockhr-val').textContent = dockHrs;
  // Storage mix total indicator
  var mixTotal = Math.round((pctFullPal + pctCtnPal + pctCtnShelv) * 100);
  var mixEl = document.getElementById('wsc-mix-total');
  if (mixEl) { mixEl.textContent = '(' + mixTotal + '%)'; mixEl.style.color = mixTotal === 100 ? 'var(--ies-blue)' : 'var(--ies-red)'; }
  // Normalize mix percentages if they don't sum to 100%
  if (mixTotal > 0 && mixTotal !== 100) {
    var scale = 1 / (pctFullPal + pctCtnPal + pctCtnShelv);
    pctFullPal *= scale;
    pctCtnPal *= scale;
    pctCtnShelv *= scale;
  }
  document.getElementById('wsc-office-val').textContent = Math.round(officePct * 100) + '%';

  // ── INVENTORY → POSITIONS (unit-based model) ──
  // Full pallet units → pallet positions
  var fpUnits = Math.round(peakUnits * pctFullPal);
  var fullPalPositions = Math.ceil(fpUnits / unitsPerPallet);

  // Loose carton pallet units → pallet positions (units → cartons → pallets)
  var cpUnits = Math.round(peakUnits * pctCtnPal);
  var cpCartons = Math.ceil(cpUnits / unitsPerCartonPal);
  var ctnPalPositions = Math.ceil(cpCartons / cartonsPerPallet);

  // Carton shelving units → shelving locations (units → cartons → locations)
  var csUnits = Math.round(peakUnits * pctCtnShelv);
  var csCartons = Math.ceil(csUnits / unitsPerCartonShelv);
  var shelvPositions = Math.ceil(csCartons / cartonsPerLocation);

  // Total pallet-equivalent positions (full pal + loose carton pallets)
  var palletPositionsNeeded = fullPalPositions + ctnPalPositions;

  // Honeycomb / empty-position buffer (user-adjustable)
  var hcBufPct = parseInt(document.getElementById('wsc-hcbuf').value, 10) || 10;
  document.getElementById('wsc-hcbuf-val').textContent = hcBufPct + '%';
  var bufferFactor = 1 + (hcBufPct / 100);
  var grossPalletPositions = Math.ceil(palletPositionsNeeded * bufferFactor);
  var grossShelvPositions = Math.ceil(shelvPositions * bufferFactor);

  // FIX 2: Surge capacity buffer (additional positions for receiving surges)
  var surgeBufPct = parseInt(document.getElementById('wsc-surge').value, 10) || 20;
  document.getElementById('wsc-surge-val').textContent = surgeBufPct + '%';
  var surgePositions = Math.ceil((grossPalletPositions + grossShelvPositions) * (surgeBufPct / 100));
  var designedPositions = grossPalletPositions + grossShelvPositions;
  var grossPositions = designedPositions + surgePositions;

  // Avg inventory for utilization calc
  var avgPalletPos = Math.ceil((avgUnits * (pctFullPal + pctCtnPal)) / ((fpUnits > 0 ? fpUnits/fullPalPositions : unitsPerPallet) || unitsPerPallet) * bufferFactor);
  // Simpler: scale by ratio of avg to peak
  var peakToAvgRatio = peakUnits > 0 ? (avgUnits / peakUnits) : 0.7;

  // ── PALLET STORAGE FOOTPRINT (geometry-based) ──
  var POSITION_WIDTH = 4.33; // ft (52 inches)
  var LOSS_FACTOR = 1.20;    // cross-aisles, columns, fire lanes

  var palletStorageSF = 0;
  var storageDetailHtml = '';
  var floorPositions = 0;
  var sfPerFloorPos = 0;

  if (grossPalletPositions > 0) {
    if (storeType === 'single') {
      var moduleDepth = 8.5 + aisleW;
      var depthPerPos = moduleDepth / 2;
      sfPerFloorPos = Math.ceil(depthPerPos * POSITION_WIDTH * LOSS_FACTOR);
      floorPositions = Math.ceil(grossPalletPositions / rackLevels);
      palletStorageSF = floorPositions * sfPerFloorPos;

      storageDetailHtml = '<strong>Pallet Storage: Single-Deep Selective</strong> \u2014 ' + rackLevels + ' levels, ' + aisleType.replace('vna','VNA') + ' aisles (' + aisleW + ' ft)';
      storageDetailHtml += '<br>' + grossPalletPositions.toLocaleString() + ' pallet positions \u00f7 ' + rackLevels + ' levels = <strong>' + floorPositions.toLocaleString() + ' floor positions</strong>';
      storageDetailHtml += '<br>Module: 8.5 ft back-to-back + ' + aisleW + ' ft aisle = ' + moduleDepth + ' ft \u2192 ' + fmtNum(sfPerFloorPos, 0) + ' sf/floor position';

    } else if (storeType === 'double') {
      var ddModuleDepth = 16.5 + aisleW;
      floorPositions = Math.ceil(grossPalletPositions / rackLevels);
      sfPerFloorPos = Math.ceil((ddModuleDepth / 4) * POSITION_WIDTH * LOSS_FACTOR);
      palletStorageSF = Math.ceil(floorPositions * sfPerFloorPos);

      storageDetailHtml = '<strong>Pallet Storage: Double-Deep</strong> \u2014 ' + rackLevels + ' levels, ' + aisleW + ' ft aisles';
      storageDetailHtml += '<br>' + grossPalletPositions.toLocaleString() + ' pallet positions \u00f7 ' + rackLevels + ' levels = ' + floorPositions.toLocaleString() + ' floor positions';
      storageDetailHtml += '<br>Module: 16.5 ft + ' + aisleW + ' ft = ' + ddModuleDepth + ' ft \u2192 ' + fmtNum(sfPerFloorPos, 0) + ' sf/position';

    } else if (storeType === 'bulk') {
      var bulkAisle = 12;
      var rowDepth = bulkDepth * 4;
      var bulkModuleDepth = (2 * rowDepth) + bulkAisle;
      var posPerModuleCol = 2 * bulkDepth * stackHi;
      sfPerFloorPos = Math.ceil((bulkModuleDepth * POSITION_WIDTH * LOSS_FACTOR) / posPerModuleCol);
      floorPositions = grossPalletPositions;
      palletStorageSF = Math.ceil(grossPalletPositions * sfPerFloorPos);

      storageDetailHtml = '<strong>Pallet Storage: Bulk Floor</strong> \u2014 ' + bulkDepth + '-deep, stacked ' + stackHi + ' high';
      storageDetailHtml += '<br>' + fmtNum(grossPalletPositions) + ' pallet positions at ' + fmtNum(sfPerFloorPos, 0) + ' sf/position';

    } else if (storeType === 'carton') {
      // If storage type is carton, pallet positions still use single-deep selective as fallback
      var moduleDepth = 8.5 + aisleW;
      sfPerFloorPos = Math.ceil((moduleDepth / 2) * POSITION_WIDTH * LOSS_FACTOR);
      floorPositions = Math.ceil(grossPalletPositions / rackLevels);
      palletStorageSF = floorPositions * sfPerFloorPos;

      storageDetailHtml = '<strong>Pallet Storage: Single-Deep Selective</strong> (for pallet-stored units)';
      storageDetailHtml += '<br>' + grossPalletPositions.toLocaleString() + ' pallet positions in ' + palletStorageSF.toLocaleString() + ' sf';

    } else { // mix
      var rackPositions = Math.ceil(grossPalletPositions * mixRackPct);
      var bulkPositions = grossPalletPositions - rackPositions;

      var rackModuleDepth = 8.5 + aisleW;
      var rackSfPerFloor = Math.ceil((rackModuleDepth / 2) * POSITION_WIDTH * LOSS_FACTOR);
      var rackFloor = Math.ceil(rackPositions / rackLevels);
      var rackSF = rackFloor * rackSfPerFloor;

      var bulkAisle = 12, rowDepth = bulkDepth * 4;
      var bulkModuleDepth = (2 * rowDepth) + bulkAisle;
      var posPerModuleCol = 2 * bulkDepth * stackHi;
      var bulkSfPerPos = Math.ceil((bulkModuleDepth * POSITION_WIDTH * LOSS_FACTOR) / posPerModuleCol);
      var bulkSF = Math.ceil(bulkPositions * bulkSfPerPos);

      palletStorageSF = rackSF + bulkSF;
      floorPositions = rackFloor + Math.ceil(bulkPositions / (stackHi * bulkDepth));

      storageDetailHtml = '<strong>Pallet Storage: Mixed</strong> \u2014 ' + Math.round(mixRackPct * 100) + '% rack / ' + Math.round((1 - mixRackPct) * 100) + '% bulk';
      storageDetailHtml += '<br>Rack: ' + rackPositions.toLocaleString() + ' positions \u2192 ' + rackSF.toLocaleString() + ' sf';
      storageDetailHtml += '<br>Bulk: ' + bulkPositions.toLocaleString() + ' positions \u2192 ' + bulkSF.toLocaleString() + ' sf';
    }
  }

  // ── CARTON SHELVING FOOTPRINT (always calculated from shelving % regardless of storage type) ──
  var shelvStorageSF = 0;
  var shelfLevels = Math.min(7, Math.max(3, Math.floor((clearHeightFt - 1) / 5)));
  if (grossShelvPositions > 0) {
    var shelfModuleDepth = 9.5; // 4.5 ft back-to-back + 5 ft aisle
    var shelfPosWidth = 3;      // 36" bay
    var shelfSfPerFloor = Math.ceil((shelfModuleDepth / 2) * shelfPosWidth * LOSS_FACTOR);
    var shelfFloorPos = Math.ceil(grossShelvPositions / shelfLevels);
    shelvStorageSF = shelfFloorPos * shelfSfPerFloor;

    storageDetailHtml += '<br><br><strong>Carton Shelving</strong> \u2014 ' + shelfLevels + ' levels, 5 ft pick aisles';
    storageDetailHtml += '<br>' + grossShelvPositions.toLocaleString() + ' shelving locations \u00f7 ' + shelfLevels + ' levels = ' + shelfFloorPos.toLocaleString() + ' floor locations \u2192 ' + shelvStorageSF.toLocaleString() + ' sf';
  }

  var storageSF = palletStorageSF + shelvStorageSF;

  // Re-update levels display
  document.getElementById('wsc-rackhi-val').textContent = rackLevels;

  // ── DOCK SIZING ──
  var dockDivisor = Math.max(1, pdph) * Math.max(1, dockHrs);
  var inDoors = Math.max(2, Math.ceil(inPal / dockDivisor));
  var outDoors = Math.max(2, Math.ceil(outPal / dockDivisor));

  // FIX 1: Dock sizing formula updated - 700 SF per door (accounts for apron depth)
  // FIX 1: Apply 25% buffer to door count for surge tolerance
  var adjustedDoors = Math.ceil((inDoors + outDoors) * 1.25);
  var totalDoors = adjustedDoors;

  // Dock area: 700 sf per door (10ft door width + 6-8ft apron depth for loading/unloading)
  // Two-sided docks need dock apron on both walls
  var dockSF = adjustedDoors * 700;
  if (dockConfig === 'two') dockSF = Math.ceil(dockSF * 1.15); // extra apron on second wall

  // FIX 4: Dock wall feasibility validator
  var dockWallValidation = '';
  var availableDockWall = parseInt(document.getElementById('wsc-dock-wall').value, 10) || 0;
  if (availableDockWall > 0) {
    var requiredWallLength = adjustedDoors * 12; // 12 ft on-center standard
    if (requiredWallLength > availableDockWall) {
      dockWallValidation = '<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:12px;margin-top:12px;color:#991b1b;font-size:12px;"><strong>⚠ Dock Wall Constraint:</strong> Required dock wall (' + requiredWallLength + ' ft for ' + adjustedDoors + ' doors at 12\' spacing) exceeds available wall length (' + availableDockWall + ' ft). Consider reducing doors or adding a second dock face.</div>';
    }
  }

  // ── RECEIVING & SHIPPING STAGING ──
  // ~15% of daily volume staged at any given time, at ~18 sf per staged pallet (floor + aisle)
  // Two-sided config needs ~25% more staging (separate zones on opposite ends, less shared space)
  var stagingFactor = dockConfig === 'two' ? 1.25 : 1.0;
  var recvStagingSF = Math.ceil(inPal * 0.15 * 18 * stagingFactor);
  var shipStagingSF = Math.ceil(outPal * 0.15 * 18 * stagingFactor);

  // ── ADDITIONAL AREAS ──
  var addlSF = 0;
  var addlItems = [];
  var optZones = [
    // Forward pick is now calculated separately below
    { cb: 'wsc-vas', sf: 'wsc-vas-sf', label: 'VAS / Kitting' },
    { cb: 'wsc-ret', sf: 'wsc-ret-sf', label: 'Returns / QC' },
    { cb: 'wsc-chg', sf: 'wsc-chg-sf', label: 'Charging / Maint.' },
    { cb: 'wsc-stg', sf: 'wsc-stg-sf', label: 'Staging / Sortation' }
  ];
  for (var i = 0; i < optZones.length; i++) {
    if (document.getElementById(optZones[i].cb).checked) {
      var sf = parseInt(document.getElementById(optZones[i].sf).value, 10) || 0;
      addlSF += sf;
      addlItems.push({ label: optZones[i].label, sf: sf });
    }
  }

  // Forward pick area (calculated from SKUs, pick type, days of inventory)
  var fwdPickSF = 0;
  if (document.getElementById('wsc-fwd').checked) {
    var fwdSkus = parseInt(document.getElementById('wsc-fwd-skus').value, 10) || 0;
    var fwdDays = parseInt(document.getElementById('wsc-fwd-days').value, 10) || 3;
    var fwdType = document.getElementById('wsc-fwd-type').value;
    var fwdPickPct = parseInt(document.getElementById('wsc-fwd-pct').value, 10) || 20;
    var obUnitsYr = parseInt(document.getElementById('wsc-ob-units').value, 10) || 0;
    var opDaysYr = parseInt(document.getElementById('wsc-op-days').value, 10) || 250;

    // Update Active Pick Face % display
    document.getElementById('wsc-fwd-pct-val').textContent = fwdPickPct + '%';

    // Active pick faces = total SKUs × active pick face % (ABC analysis: only fast movers get forward pick)
    var activeFaces = Math.ceil(fwdSkus * (fwdPickPct / 100));

    // SF per location by pick type
    var sfPerLoc = fwdType === 'pallet' ? 45 : 12; // pallet pick face vs carton flow

    // Forward pick area SF = active pick faces × sf per location
    fwdPickSF = activeFaces * sfPerLoc;

    // Daily units through forward pick = outbound units / operating days × days of inventory
    var dailyUnits = opDaysYr > 0 ? Math.round(obUnitsYr / opDaysYr) : 0;
    var fwdInventoryUnits = dailyUnits * fwdDays;

    // Update calculated display
    var fwdCalcEl = document.getElementById('wsc-fwd-calc');
    if (fwdCalcEl) {
      fwdCalcEl.innerHTML = fwdSkus.toLocaleString() + ' total SKUs &times; ' + fwdPickPct + '% = <strong>' + activeFaces.toLocaleString() + ' active faces</strong> &times; ' + sfPerLoc + ' sf = <strong>' + fwdPickSF.toLocaleString() + ' sf</strong>' +
        ' &middot; ' + dailyUnits.toLocaleString() + ' units/day &times; ' + fwdDays + ' days = ' + fwdInventoryUnits.toLocaleString() + ' units stocked';
    }

    addlSF += fwdPickSF;
    addlItems.push({ label: 'Forward Pick', sf: fwdPickSF });
  }

  // Collect custom zones
  var customRows = document.getElementById('wsc-custom-zones').children;
  for (var c = 0; c < customRows.length; c++) {
    var row = customRows[c];
    var nameEl = row.querySelector('input[type="text"]');
    var sfEl = row.querySelector('input[type="number"]');
    if (nameEl && sfEl) {
      var sf = parseInt(sfEl.value, 10) || 0;
      if (sf > 0) {
        addlSF += sf;
        addlItems.push({ label: nameEl.value || 'Custom Zone', sf: sf });
      }
    }
  }

  // ── WAREHOUSE OPERATIONAL FOOTPRINT ──
  var warehouseOpSF = storageSF + dockSF + recvStagingSF + shipStagingSF + addlSF;

  // Office as % of operational footprint
  var officeSF = Math.ceil(warehouseOpSF * officePct);

  // ── TOTAL FACILITY ──
  var totalSqFt = warehouseOpSF + officeSF;

  // Avg utilization: avg inventory positions vs designed capacity (before surge)
  var avgPositions = Math.ceil((avgUnits * pctFullPal / unitsPerPallet) + (avgUnits * pctCtnPal / unitsPerCartonPal / cartonsPerPallet) + (avgUnits * pctCtnShelv / unitsPerCartonShelv / cartonsPerLocation));
  var utilPct = designedPositions > 0 ? Math.min(100, Math.round((avgPositions / designedPositions) * 100)) : 0;

  // SF per pallet position (total facility)
  var sfPerPos = grossPositions > 0 ? fmtNum(totalSqFt / grossPositions, 1) : '—';

  // ── UPDATE KPI TILES ──
  document.getElementById('wsc-r-sqft').textContent = totalSqFt.toLocaleString();
  document.getElementById('wsc-r-positions').textContent = grossPositions.toLocaleString();
  document.getElementById('wsc-r-util').textContent = utilPct + '%';
  document.getElementById('wsc-r-sfperpos').textContent = sfPerPos;
  document.getElementById('wsc-r-docks').textContent = totalDoors;
  document.getElementById('wsc-r-docks-in').textContent = inDoors;
  document.getElementById('wsc-r-docks-out').textContent = outDoors;
  document.getElementById('wsc-r-height').textContent = clearHeightFt + ' ft';
  document.getElementById('wsc-r-levels').textContent = rackLevels;

  // ── ZONE BREAKDOWN TABLE + CHART ──
  var zoneLabels = ['Storage', 'Dock Area', 'Recv Staging', 'Ship Staging', 'Office'];
  var zoneSqFts = [storageSF, dockSF, recvStagingSF, shipStagingSF, officeSF];
  var zoneColors = ['#2563eb', '#0ea5e9', '#10b981', '#f97316', '#8b5cf6'];

  for (var j = 0; j < addlItems.length; j++) {
    zoneLabels.push(addlItems[j].label);
    zoneSqFts.push(addlItems[j].sf);
    var extraColors = ['#ec4899','#f59e0b','#6366f1','#14b8a6','#e11d48'];
    zoneColors.push(extraColors[j % extraColors.length]);
  }

  var zonePcts = zoneSqFts.map(function(s) { return totalSqFt > 0 ? Math.round((s / totalSqFt) * 100) : 0; });

  // Stacked bar visualization
  var barHtml = '<div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:14px;">';
  for (var b = 0; b < zoneLabels.length; b++) {
    if (zonePcts[b] > 0) barHtml += '<div style="width:' + zonePcts[b] + '%;background:' + zoneColors[b] + ';min-width:2px;" title="' + zoneLabels[b] + ': ' + zonePcts[b] + '%"></div>';
  }
  barHtml += '</div>';

  var tableHtml = barHtml + '<table style="width:100%;border-collapse:collapse;">';
  tableHtml += '<tr style="border-bottom:1.5px solid var(--ies-gray-200);"><th style="text-align:left;padding:5px 8px;font-size:11px;color:var(--ies-gray-500);font-weight:600;">Zone</th><th style="text-align:right;padding:5px 8px;font-size:11px;color:var(--ies-gray-500);font-weight:600;">Sq Ft</th><th style="text-align:right;padding:5px 8px;font-size:11px;color:var(--ies-gray-500);font-weight:600;">%</th></tr>';
  for (var z = 0; z < zoneLabels.length; z++) {
    tableHtml += '<tr style="border-bottom:1px solid var(--ies-gray-100);">';
    tableHtml += '<td style="padding:6px 8px;font-size:12px;"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + zoneColors[z] + ';margin-right:8px;vertical-align:middle;"></span>' + zoneLabels[z] + '</td>';
    tableHtml += '<td style="text-align:right;padding:6px 8px;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;">' + zoneSqFts[z].toLocaleString() + '</td>';
    tableHtml += '<td style="text-align:right;padding:6px 8px;font-size:12px;color:var(--ies-gray-500);font-variant-numeric:tabular-nums;">' + zonePcts[z] + '%</td>';
    tableHtml += '</tr>';
  }
  tableHtml += '<tr style="border-top:2px solid var(--ies-gray-300);"><td style="padding:6px 8px;font-size:12px;font-weight:700;">Total</td>';
  tableHtml += '<td style="text-align:right;padding:6px 8px;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;">' + totalSqFt.toLocaleString() + '</td>';
  tableHtml += '<td style="text-align:right;padding:6px 8px;font-size:12px;font-weight:700;">100%</td></tr>';
  tableHtml += '</table>';
  document.getElementById('wsc-zone-table').innerHTML = tableHtml;

  // Doughnut chart
  try {
  var ctx = document.getElementById('wsc-chart-zones');
  if (ctx) {
    if (wscZoneChart) { wscZoneChart.destroy(); wscZoneChart = null; }
    wscZoneChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: zoneLabels,
        datasets: [{
          data: zoneSqFts,
          backgroundColor: zoneColors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(c) { return c.label + ': ' + c.raw.toLocaleString() + ' sf (' + zonePcts[c.dataIndex] + '%)'; }
            }
          }
        }
      }
    });
  }
  } catch(chartErr) { console.warn('WSC chart render skipped:', chartErr); }

  // Storage detail card
  var detailSummary = '<br><br><span style="color:var(--ies-gray-500);font-size:12px;">Inventory: ' + peakUnits.toLocaleString() + ' peak units \u2192 ';
  detailSummary += fullPalPositions.toLocaleString() + ' full pallet pos (' + Math.round(pctFullPal*100) + '%) + ';
  detailSummary += ctnPalPositions.toLocaleString() + ' carton pallet pos (' + Math.round(pctCtnPal*100) + '%) + ';
  detailSummary += shelvPositions.toLocaleString() + ' shelving loc (' + Math.round(pctCtnShelv*100) + '%)';
  detailSummary += ' \u00b7 ' + hcBufPct + '% honeycomb + ' + surgeBufPct + '% surge \u00b7 <strong>' + grossPositions.toLocaleString() + ' gross positions</strong>';
  detailSummary += ' \u00b7 ' + sfPerPos + ' sf/position</span>';
  document.getElementById('wsc-storage-detail').innerHTML = storageDetailHtml + detailSummary;

  // ── RECOMMENDATION ──
  var reco = '';
  var storeNames = { single: 'single-deep selective rack', double: 'double-deep rack', bulk: 'bulk floor storage', carton: 'carton flow / shelving', mix: 'mixed rack and bulk' };
  reco += '<strong>' + totalSqFt.toLocaleString() + ' SF Facility \u2014 ' + (storeNames[storeType] || storeType) + '</strong><br>';
  reco += 'Based on <strong>' + peakUnits.toLocaleString() + ' peak units</strong> on-hand (' + Math.round(pctFullPal * 100) + '% full pallet, ' + Math.round(pctCtnPal * 100) + '% carton pallet, ' + Math.round(pctCtnShelv * 100) + '% shelving), ';
  reco += 'IES sizes <strong>' + designedPositions.toLocaleString() + ' positions</strong>';
  if (surgeBufPct > 0) reco += ' + <strong>' + surgePositions.toLocaleString() + ' surge positions (' + surgeBufPct + '%)</strong>';
  reco += ' in ' + storageSF.toLocaleString() + ' sf of storage (' + rackLevels + ' levels at ' + clearHeightFt + ' ft clear). ';
  reco += 'Dock requirements: <strong>' + fmtNum(totalDoors) + ' doors</strong> (' + fmtNum(inDoors) + ' inbound, ' + fmtNum(outDoors) + ' outbound; adjusted to ' + fmtNum(adjustedDoors) + ' with 25% surge buffer) based on ' + fmtNum(inPal) + '/' + fmtNum(outPal) + ' daily pallets at ' + fmtNum(pdph) + ' pallets/door/hr over ' + fmtNum(dockHrs) + ' hrs.';

  // FIX 2: Utilization warning if average utilization > 85%
  if (utilPct > 85) {
    reco += '<br><br><div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;color:#92400e;font-size:12px;"><strong>⚠ High Utilization:</strong> Average utilization is ' + utilPct + '%. This leaves limited operational flexibility for receiving surges and seasonal peaks. Consider increasing facility size or reducing peak inventory assumptions.</div>';
  } else if (utilPct < 70) {
    reco += '<br><br><span style="color:#d97706;font-weight:600;">\u26a0 Note:</span> Average utilization is ' + utilPct + '%. The gap between avg (' + avgUnits.toLocaleString() + ') and peak (' + peakUnits.toLocaleString() + ') units is significant \u2014 consider whether the facility is sized for the right scenario.';
  } else if (utilPct > 90) {
    reco += '<br><br><span style="color:#d97706;font-weight:600;">\u26a0 Note:</span> Average utilization is ' + utilPct + '%. This leaves limited flex capacity for receiving surges or seasonal peaks.';
  }

  // Append dock wall validation warning if applicable (FIX 4)
  if (dockWallValidation) {
    reco += dockWallValidation;
  }

  if (storeType === 'double') {
    reco += '<br><br><strong>Design note:</strong> Double-deep rack reduces total storage footprint vs. single-deep but requires a reach truck and limits selectivity to ~50%. Best when you have 2+ pallets per SKU on-hand.';
  } else if (storeType === 'bulk') {
    reco += '<br><br><strong>Design note:</strong> Bulk floor storage minimizes infrastructure cost and maximizes density for homogeneous, high-velocity product. Not suitable for each-pick operations.';
  } else if (storeType === 'carton') {
    reco += '<br><br><strong>Design note:</strong> Carton flow / shelving is optimized for each-pick and piece-level fulfillment. Positions represent individual shelf bays (36" wide). Narrow 5\' aisles accommodate pick carts. Best for high-SKU-count operations with carton or piece-level order profiles.';
  }

  document.getElementById('wsc-reco').innerHTML = reco;

  // ── RENDER FACILITY LAYOUT ──
  var p = {
    totalSF: totalSqFt,
    storageSF: storageSF,
    dockSF: dockSF,
    officeSF: officeSF,
    totalDoors: totalDoors,
    inDoors: inDoors,
    outDoors: outDoors,
    storeType: storeType,
    aisleW: aisleW,
    aisleType: aisleType,
    rackLevels: rackLevels,
    clearHeightFt: clearHeightFt,
    floorPositions: floorPositions,
    grossPositions: grossPositions,
    bulkDepth: bulkDepth,
    stackHi: stackHi,
    mixRackPct: mixRackPct,
    addlItems: addlItems,
    recvStagingSF: recvStagingSF,
    shipStagingSF: shipStagingSF,
    rackDir: rackDir,
    dockConfig: dockConfig
  };
  renderLayout(p);
  // Store params for CM integration and show button
  window._lastWscParams = { totalSF: totalSqFt, storageSF: storageSF, dockSF: dockSF, officeSF: officeSF,
    totalDoors: totalDoors, inDoors: inDoors, outDoors: outDoors, clearHeightFt: clearHeightFt,
    recvStagingSF: recvStagingSF, shipStagingSF: shipStagingSF, storeType: storeType,
    rackLevels: rackLevels, aisleW: aisleW };
  var cmBtn = document.getElementById('wsc-cm-integration');
  if (cmBtn) cmBtn.style.display = 'block';
  // Update 3D/elevation view if active
  if (wscViewMode === '3d' && typeof render3DLayout === 'function') render3DLayout(p);
  if (wscViewMode === 'elevation' && typeof renderElevationView === 'function') renderElevationView(p);
  // Sync input panel height with right column
  syncCalcPanelHeight();

  // Trigger auto-save if a scenario is loaded
  wscFormatInputs();
  wscMarkChanged();
  return p;
} catch(err) {
  console.error('calcWarehouse error:', err);
  var errEl = document.getElementById('wsc-storage-detail');
  if (errEl) errEl.innerHTML = '<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:16px;color:#991b1b;font-size:13px;"><strong>Calculation Error:</strong> ' + (err.message || 'Unknown error') + '. Check your inputs and try again.</div>';
} }

function syncCalcPanelHeight() {
  var panel = document.getElementById('wsc-input-panel');
  var row = document.getElementById('wsc-row3');
  if (!panel || !row) return;
  // Get the right column (second child of the grid)
  var rightCol = row.children[1];
  if (!rightCol) return;
  // Temporarily remove max-height to measure natural height
  panel.style.maxHeight = 'none';
  var rightH = rightCol.offsetHeight;
  var panelNatural = panel.scrollHeight;
  // If input content is shorter than right column, let it match right column height
  // If input content is taller, cap at right column height and scroll
  if (rightH > 0) {
    panel.style.maxHeight = Math.max(rightH, 400) + 'px';
  }
}

// ═════════════════════════════════════════════════════════════
// WAREHOUSE SIZING CALCULATOR — Scenario Save/Load Functions
// ═════════════════════════════════════════════════════════════

// Global variable to track active scenario for auto-save
var wscActiveScenarioId = null;
var wscAutoSaveTimer = null;

// Collect all WSC inputs into an object
function wscCollectInputs() {
    var data = {};

    // Numeric inputs
    var numInputIds = [
        'wsc-peakunits','wsc-avgunits',
        'wsc-pct-fullpal','wsc-pct-ctnpal','wsc-pct-ctnshelv',
        'wsc-upp','wsc-upc-pal','wsc-cpp','wsc-upc-shelv','wsc-cpl',
        'wsc-hcbuf','wsc-surge',
        'wsc-clearht','wsc-loadht',
        'wsc-bulkdp','wsc-stackhi','wsc-mixrack',
        'wsc-inpal','wsc-outpal','wsc-pdph','wsc-dockhr','wsc-office',
        'wsc-fwd-skus','wsc-fwd-days','wsc-ob-units','wsc-op-days',
        'wsc-fwd-pct','wsc-dock-wall'
    ];

    // Map from HTML ID to DB column name
    var idToColumn = {
        'wsc-peakunits': 'peak_units', 'wsc-avgunits': 'avg_units',
        'wsc-pct-fullpal': 'pct_full_pallet', 'wsc-pct-ctnpal': 'pct_carton_pallet', 'wsc-pct-ctnshelv': 'pct_carton_shelving',
        'wsc-upp': 'units_per_pallet', 'wsc-upc-pal': 'units_per_carton_pal', 'wsc-cpp': 'cartons_per_pallet',
        'wsc-upc-shelv': 'units_per_carton_shelv', 'wsc-cpl': 'cartons_per_level',
        'wsc-hcbuf': 'headcount_buffer', 'wsc-surge': 'surge_buffer_pct',
        'wsc-clearht': 'clear_height', 'wsc-loadht': 'load_height',
        'wsc-bulkdp': 'bulk_deep', 'wsc-stackhi': 'stack_high', 'wsc-mixrack': 'mix_rack',
        'wsc-inpal': 'inbound_pallets', 'wsc-outpal': 'outbound_pallets', 'wsc-pdph': 'pallets_per_dock_per_hour',
        'wsc-dockhr': 'dock_hours', 'wsc-office': 'office_pct',
        'wsc-fwd-skus': 'fwd_pick_skus', 'wsc-fwd-days': 'fwd_pick_days', 'wsc-ob-units': 'outbound_units', 'wsc-op-days': 'operating_days',
        'wsc-fwd-pct': 'fwd_pick_pct', 'wsc-dock-wall': 'dock_wall_length'
    };

    for (var i = 0; i < numInputIds.length; i++) {
        var id = numInputIds[i];
        var el = document.getElementById(id);
        if (el) {
            var val = parseFloat(el.value.replace(/,/g,'')) || 0;
            var colName = idToColumn[id] || id.replace('wsc-', '').replace(/-/g, '_');
            data[colName] = val;
        }
    }

    // Dropdowns
    var dropdownIds = ['wsc-storetype','wsc-aisletype','wsc-rackdir','wsc-dockconfig','wsc-fwd-type','wsc-sprinkler'];
    var dropdownToColumn = {
        'wsc-storetype': 'storage_type', 'wsc-aisletype': 'aisle_type', 'wsc-rackdir': 'rack_direction',
        'wsc-dockconfig': 'dock_config', 'wsc-fwd-type': 'fwd_pick_type', 'wsc-sprinkler': 'sprinkler_clearance_mode'
    };

    for (var j = 0; j < dropdownIds.length; j++) {
        var id = dropdownIds[j];
        var el = document.getElementById(id);
        if (el) {
            var colName = dropdownToColumn[id] || id.replace('wsc-', '').replace(/-/g, '_');
            data[colName] = el.value;
        }
    }

    // Checkboxes
    var checkboxIds = ['wsc-fwd','wsc-vas','wsc-ret','wsc-chg','wsc-stg'];
    var checkboxToColumn = {
        'wsc-fwd': 'has_forward_pick', 'wsc-vas': 'has_vas', 'wsc-ret': 'has_returns',
        'wsc-chg': 'has_charging', 'wsc-stg': 'has_staging'
    };

    for (var k = 0; k < checkboxIds.length; k++) {
        var id = checkboxIds[k];
        var el = document.getElementById(id);
        if (el) {
            var colName = checkboxToColumn[id] || id.replace('wsc-', '').replace(/-/g, '_');
            data[colName] = el.checked;
        }
    }

    // Custom zones (stored as JSON)
    var customZonesEl = document.getElementById('wsc-custom-zones');
    if (customZonesEl) {
        var zones = [];
        var zoneInputs = customZonesEl.querySelectorAll('[data-custom-zone]');
        zoneInputs.forEach(function(input) {
            var name = input.getAttribute('data-custom-zone-name') || '';
            var sf = parseFloat(input.value) || 0;
            if (name) zones.push({ name: name, sf: sf });
        });
        data.custom_zones = JSON.stringify(zones);
    } else {
        data.custom_zones = JSON.stringify([]);
    }

    // Capture current calculation results
    var totalSfEl = document.getElementById('wsc-r-sqft');
    var positionsEl = document.getElementById('wsc-r-positions');
    var docksEl = document.getElementById('wsc-r-docks');

    data.facility_sqft = totalSfEl ? parseFloat(totalSfEl.textContent.replace(/[^0-9.]/g, '')) || 0 : 0;
    data.result_positions = positionsEl ? parseFloat(positionsEl.textContent.replace(/[^0-9.]/g, '')) || 0 : 0;
    data.result_dock_doors = docksEl ? parseFloat(docksEl.textContent.replace(/[^0-9.]/g, '')) || 0 : 0;

    return data;
}

// Apply an object of inputs to the WSC form
function wscApplyInputs(data) {
    if (!data) return;

    // Map DB column names back to HTML IDs
    var columnToId = {
        'peak_units': 'wsc-peakunits', 'avg_units': 'wsc-avgunits',
        'pct_full_pallet': 'wsc-pct-fullpal', 'pct_carton_pallet': 'wsc-pct-ctnpal', 'pct_carton_shelving': 'wsc-pct-ctnshelv',
        'units_per_pallet': 'wsc-upp', 'units_per_carton_pal': 'wsc-upc-pal', 'cartons_per_pallet': 'wsc-cpp',
        'units_per_carton_shelv': 'wsc-upc-shelv', 'cartons_per_level': 'wsc-cpl',
        'headcount_buffer': 'wsc-hcbuf', 'surge_buffer_pct': 'wsc-surge',
        'clear_height': 'wsc-clearht', 'load_height': 'wsc-loadht',
        'bulk_deep': 'wsc-bulkdp', 'stack_high': 'wsc-stackhi', 'mix_rack': 'wsc-mixrack',
        'inbound_pallets': 'wsc-inpal', 'outbound_pallets': 'wsc-outpal', 'pallets_per_dock_per_hour': 'wsc-pdph',
        'dock_hours': 'wsc-dockhr', 'office_pct': 'wsc-office',
        'fwd_pick_skus': 'wsc-fwd-skus', 'fwd_pick_days': 'wsc-fwd-days', 'outbound_units': 'wsc-ob-units', 'operating_days': 'wsc-op-days',
        'fwd_pick_pct': 'wsc-fwd-pct', 'dock_wall_length': 'wsc-dock-wall',
        'sprinkler_clearance_mode': 'wsc-sprinkler',
        'storage_type': 'wsc-storetype', 'aisle_type': 'wsc-aisletype', 'rack_direction': 'wsc-rackdir',
        'dock_config': 'wsc-dockconfig', 'fwd_pick_type': 'wsc-fwd-type',
        'has_forward_pick': 'wsc-fwd', 'has_vas': 'wsc-vas', 'has_returns': 'wsc-ret',
        'has_charging': 'wsc-chg', 'has_staging': 'wsc-stg'
    };

    // Apply numeric and dropdown/checkbox fields
    for (var key in columnToId) {
        var elId = columnToId[key];
        var el = document.getElementById(elId);
        if (el && data[key] !== undefined && data[key] !== null) {
            if (el.type === 'checkbox') {
                el.checked = data[key];
            } else if (el.type === 'radio') {
                el.checked = data[key];
            } else {
                el.value = data[key];
            }
            // Trigger change event for dependent calculations
            if (el.dispatchEvent) {
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    // Apply custom zones
    if (data.custom_zones) {
        var customZonesEl = document.getElementById('wsc-custom-zones');
        if (customZonesEl) {
            customZonesEl.innerHTML = '';
            try {
                var zones = typeof data.custom_zones === 'string' ? JSON.parse(data.custom_zones) : data.custom_zones;
                zones.forEach(function(zone) {
                    var html = '<label class="wsc-checkbox-label" style="margin-bottom:6px;">' +
                        '<input type="number" data-custom-zone="true" data-custom-zone-name="' + (zone.name || '') + '" value="' + (zone.sf || 0) + '" min="0" step="500" oninput="calcWarehouse()" class="wsc-input" style="width:72px;" disabled>' +
                        '<span style="font-size:11px;color:var(--ies-gray-600);margin-left:8px;">' + (zone.name || 'Zone') + '</span>' +
                        '<span style="font-size:11px;color:var(--ies-gray-500);">sf</span>' +
                        '<button onclick="this.parentElement.remove();calcWarehouse()" style="margin-left:auto;background:none;border:none;color:var(--ies-gray-400);cursor:pointer;padding:4px;">&times;</button>' +
                        '</label>';
                    customZonesEl.insertAdjacentHTML('beforeend', html);
                });
            } catch(e) {
                console.error('Error parsing custom zones:', e);
            }
        }
    }

    // Re-trigger calculations
    toggleStorageOptions();
    toggleFwdPick();
    toggleOptInputs();
    calcWarehouse();
    wscFormatInputs();
}

// Save current WSC state to Supabase
async function wscSaveScenario(projectId, scenarioName) {
    try {
        var name = scenarioName || (document.getElementById('wsc-scenario-name').value || 'Untitled Scenario').trim();
        if (!name) {
            alert('Please enter a scenario name');
            return;
        }

        var inputs = wscCollectInputs();

        var payload = {
            scenario_name: name,
            is_active: true,
            ...inputs
        };
        // facility_sqft already captured by wscCollectInputs() from DOM
        // Recalculate just in case DOM is stale
        try { calcWarehouse(); } catch(e) { console.error('calcWarehouse auto-calc error:', e.message); }
        if (projectId) payload.project_id = projectId;

        var resp = await cmApiPost('warehouse_sizing_scenarios', payload);
        wscActiveScenarioId = resp[0].id;

        // Update UI
        document.getElementById('wsc-scenario-name').value = name;
        var saveBtn = document.querySelector('#wsc-scenario-bar .wsc-action-btn:nth-child(1)');
        if (saveBtn) {
            var orig = saveBtn.innerHTML;
            saveBtn.innerHTML = '<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="var(--ies-green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Saved!';
            saveBtn.style.borderColor = 'var(--ies-green)';
            saveBtn.style.color = 'var(--ies-green)';
            setTimeout(function() { saveBtn.innerHTML = orig; saveBtn.style.borderColor = ''; saveBtn.style.color = ''; }, 2000);
        }

        // Refresh scenario list
        wscRefreshScenarioList(projectId);
    } catch(error) {
        console.error('WSC save error:', error);
        alert('Error saving scenario: ' + error.message);
    }
}

// Load a WSC scenario from Supabase
async function wscLoadScenario(scenarioId) {
    try {
        var scenarios = await cmFetchTable('warehouse_sizing_scenarios', 'id=eq.' + scenarioId);
        if (scenarios.length === 0) {
            alert('Scenario not found');
            return;
        }

        var scenario = scenarios[0];
        wscActiveScenarioId = scenario.id;

        // Update scenario name
        document.getElementById('wsc-scenario-name').value = scenario.scenario_name || '';

        // Apply all inputs
        wscApplyInputs(scenario);

    } catch(error) {
        console.error('WSC load error:', error);
        alert('Error loading scenario: ' + error.message);
    }
}

// List scenarios for a project (or standalone if no projectId)
async function wscListScenarios(projectId) {
    try {
        var filter = projectId ? 'project_id=eq.' + projectId : 'project_id=is.null';
        var scenarios = await cmFetchTable('warehouse_sizing_scenarios', filter);
        return scenarios;
    } catch(error) {
        console.error('WSC list error:', error);
        return [];
    }
}

// Delete a scenario
async function wscDeleteScenario(scenarioId) {
    try {
        if (!confirm('Delete this scenario?')) return;

        await cmApiDelete('warehouse_sizing_scenarios', scenarioId);
        if (wscActiveScenarioId === scenarioId) {
            wscActiveScenarioId = null;
        }

        // Refresh list
        wscRefreshScenarioList(window.activeCostModelProjectId || null);
    } catch(error) {
        console.error('WSC delete error:', error);
        alert('Error deleting scenario: ' + error.message);
    }
}

// Refresh scenario dropdown
async function wscRefreshScenarioList(projectId) {
    try {
        var scenarios = await wscListScenarios(projectId);
        var select = document.getElementById('wsc-scenario-select');
        if (select) {
            select.innerHTML = '<option value="">-- Select scenario --</option>';
            scenarios.forEach(function(s) {
                var opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.scenario_name;
                select.appendChild(opt);
            });
        }
    } catch(error) {
        console.error('Error refreshing scenario list:', error);
    }
}

// Auto-save debounced function
function wscMarkChanged() {
    if (!wscActiveScenarioId) return;

    clearTimeout(wscAutoSaveTimer);
    wscAutoSaveTimer = setTimeout(function() {
        wscAutoSaveCurrentScenario();
    }, 1000);
}

// Auto-save the current scenario
async function wscAutoSaveCurrentScenario() {
    if (!wscActiveScenarioId) return;

    try {
        var inputs = wscCollectInputs();
        var name = (document.getElementById('wsc-scenario-name').value || 'Untitled Scenario').trim();

        var payload = {
            scenario_name: name,
            ...inputs
        };

        await cmApiPatch('warehouse_sizing_scenarios', wscActiveScenarioId, payload);
    } catch(error) {
        console.error('Auto-save error:', error);
    }
}

// ═════════════════════════════════════════════════════════════
// NETWORK OPTIMIZATION — Scenario Save/Load Functions
// ═════════════════════════════════════════════════════════════

var netActiveScenarioId = null;
var netAutoSaveTimer = null;

// Collect all network optimization inputs
function netCollectInputs() {
    var data = {
        dc_count: netDCCount || 1,
        freight_rate_per_mile: parseFloat(document.getElementById('net-rate').value) || 2.25,
        loads_per_week: parseFloat(document.getElementById('net-loads').value) || 2,
        demand_points: JSON.stringify(netDemandPoints || []),
        result_avg_distance: 0,
        result_est_freight: 0,
        result_avg_transit: 0,
        result_recommended_dcs: 0
    };

    // Capture calculation results if available
    var distEl = document.getElementById('net-res-dist');
    var freightEl = document.getElementById('net-res-freight');
    var transitEl = document.getElementById('net-res-transit');

    if (distEl) data.result_avg_distance = parseFloat(distEl.textContent.replace(/[^0-9.]/g, '')) || 0;
    if (freightEl) data.result_est_freight = parseFloat(freightEl.textContent.replace(/[^0-9.]/g, '')) || 0;
    if (transitEl) data.result_avg_transit = parseFloat(transitEl.textContent.replace(/[^0-9.]/g, '')) || 0;

    return data;
}

// Apply network optimization inputs
function netApplyInputs(data) {
    if (!data) return;

    netDCCount = data.dc_count || 1;
    document.getElementById('net-rate').value = data.freight_rate_per_mile || 2.25;
    document.getElementById('net-loads').value = data.loads_per_week || 2;

    // Update rate display
    document.getElementById('net-rate-val').textContent = fmtNum(parseFloat(data.freight_rate_per_mile || 2.25), 2, '$') + '/mi';

    // Restore demand points
    try {
        netDemandPoints = typeof data.demand_points === 'string' ? JSON.parse(data.demand_points) : (data.demand_points || []);
    } catch(e) {
        netDemandPoints = [];
    }

    // Re-render and recalculate
    renderDemandList();
    runNetworkOptimization();
}

// Save current network scenario to Supabase
async function netSaveScenario(projectId, scenarioName) {
    try {
        var name = scenarioName || (document.getElementById('net-scenario-name').value || 'Untitled Network Scenario').trim();
        if (!name) {
            alert('Please enter a scenario name');
            return;
        }

        var inputs = netCollectInputs();

        var payload = {
            scenario_name: name,
            is_active: true,
            ...inputs
        };
        if (projectId) payload.project_id = projectId;

        var resp = await cmApiPost('network_optimization_scenarios', payload);
        netActiveScenarioId = resp[0].id;

        // Update UI
        document.getElementById('net-scenario-name').value = name;
        var saveBtn = document.querySelector('#net-scenario-bar .wsc-action-btn:nth-child(1)');
        if (saveBtn) {
            var orig = saveBtn.innerHTML;
            saveBtn.innerHTML = '<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="var(--ies-green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Saved!';
            saveBtn.style.borderColor = 'var(--ies-green)';
            saveBtn.style.color = 'var(--ies-green)';
            setTimeout(function() { saveBtn.innerHTML = orig; saveBtn.style.borderColor = ''; saveBtn.style.color = ''; }, 2000);
        }

        // Refresh scenario list
        netRefreshScenarioList(projectId);
    } catch(error) {
        console.error('Network save error:', error);
        alert('Error saving scenario: ' + error.message);
    }
}

// Load a network scenario from Supabase
async function netLoadScenario(scenarioId) {
    try {
        var scenarios = await cmFetchTable('network_optimization_scenarios', 'id=eq.' + scenarioId);
        if (scenarios.length === 0) {
            alert('Scenario not found');
            return;
        }

        var scenario = scenarios[0];
        netActiveScenarioId = scenario.id;

        // Update scenario name
        document.getElementById('net-scenario-name').value = scenario.scenario_name || '';

        // Apply all inputs
        netApplyInputs(scenario);

    } catch(error) {
        console.error('Network load error:', error);
        alert('Error loading scenario: ' + error.message);
    }
}

// List scenarios (standalone or project-linked)
async function netListScenarios(projectId) {
    try {
        var filter = projectId ? 'project_id=eq.' + projectId : 'project_id=is.null';
        var scenarios = await cmFetchTable('network_optimization_scenarios', filter);
        return scenarios;
    } catch(error) {
        console.error('Network list error:', error);
        return [];
    }
}

// Delete a scenario
async function netDeleteScenario(scenarioId) {
    try {
        if (!confirm('Delete this scenario?')) return;

        await cmApiDelete('network_optimization_scenarios', scenarioId);
        if (netActiveScenarioId === scenarioId) {
            netActiveScenarioId = null;
        }

        netRefreshScenarioList(window.activeCostModelProjectId || null);
    } catch(error) {
        console.error('Network delete error:', error);
        alert('Error deleting scenario: ' + error.message);
    }
}

// Refresh scenario dropdown
async function netRefreshScenarioList(projectId) {
    try {
        var scenarios = await netListScenarios(projectId);
        var select = document.getElementById('net-scenario-select');
        if (select) {
            select.innerHTML = '<option value="">-- Select scenario --</option>';
            scenarios.forEach(function(s) {
                var opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.scenario_name;
                select.appendChild(opt);
            });
        }
    } catch(error) {
        console.error('Error refreshing scenario list:', error);
    }
}

// Auto-save debounced function
function netMarkChanged() {
    if (!netActiveScenarioId) return;

    clearTimeout(netAutoSaveTimer);
    netAutoSaveTimer = setTimeout(function() {
        netAutoSaveCurrentScenario();
    }, 1000);
}

// Auto-save the current scenario
async function netAutoSaveCurrentScenario() {
    if (!netActiveScenarioId) return;

    try {
        var inputs = netCollectInputs();
        var name = (document.getElementById('net-scenario-name').value || 'Untitled Network Scenario').trim();

        var payload = {
            scenario_name: name,
            ...inputs
        };

        await cmApiPatch('network_optimization_scenarios', netActiveScenarioId, payload);
    } catch(error) {
        console.error('Network auto-save error:', error);
    }
}

// ═════════════════════════════════════════════════════════════
// NETWORK OPTIMIZATION (ENTERPRISE) — Scenario Save/Load
// ═════════════════════════════════════════════════════════════

var netoptActiveScenarioId = null;

// Collect all netopt state into a JSON-friendly object
function netoptCollectInputs() {
    return {
        facilities: JSON.parse(JSON.stringify(netoptState.facilities)),
        demands: JSON.parse(JSON.stringify(netoptState.demands)),
        suppliers: JSON.parse(JSON.stringify(netoptState.suppliers || [])),
        transport: JSON.parse(JSON.stringify(netoptState.transport)),
        constraints: JSON.parse(JSON.stringify(netoptState.constraints)),
        solver_mode: netoptState.solverMode || 'heuristic'
    };
}

// Apply saved state back into netopt
function netoptApplyInputs(data) {
    if (data.facilities) { netoptState.facilities = data.facilities; netoptRenderFacilitiesTable(); }
    if (data.demands) { netoptState.demands = data.demands; netoptRenderDemandsTable(); }
    if (data.suppliers) { netoptState.suppliers = data.suppliers; netoptRenderSuppliersTable(); }
    if (data.transport) {
        Object.assign(netoptState.transport, data.transport);
        var tl = document.getElementById('netopt-tl-rate');
        if (tl && data.transport.outboundPerUnitMile) {
            var unitsPer = parseFloat(document.getElementById('netopt-units-per-tl').value) || 800;
            tl.value = (data.transport.outboundPerUnitMile * unitsPer).toFixed(2);
        }
        document.getElementById('netopt-truck-speed').value = data.transport.truckSpeedMiPerDay || 500;
        // Restore mode mix if saved
        if (data.transport.modeMix) {
          document.getElementById('netopt-mode-tl-pct').value = Math.round((data.transport.modeMix.tl || 0) * 100);
          document.getElementById('netopt-mode-ltl-pct').value = Math.round((data.transport.modeMix.ltl || 0) * 100);
          document.getElementById('netopt-mode-parcel-pct').value = Math.round((data.transport.modeMix.parcel || 0) * 100);
        }
        netoptRecalcAllCosts();
    }
    if (data.constraints) {
        Object.assign(netoptState.constraints, data.constraints);
        document.getElementById('netopt-service-target').value = data.constraints.serviceLevelPct || 95;
        document.getElementById('netopt-service-target-val').textContent = (data.constraints.serviceLevelPct || 95) + '%';
        document.getElementById('netopt-min-facilities').value = data.constraints.minFacilities || 1;
        document.getElementById('netopt-max-facilities').value = data.constraints.maxFacilities || 5;
        document.getElementById('netopt-budget-cap').value = data.constraints.budgetCap || '';
        document.getElementById('netopt-inventory-carry').value = data.constraints.inventoryCarryPct || 15;
    }
    if (data.solver_mode) {
        netoptSetSolverMode(data.solver_mode);
    }
    netoptRecalcUnitMileCost();
    netoptUpdateKPI();
}

// Save netopt scenario to Supabase
async function netoptSaveScenario(projectId, scenarioName) {
    try {
        var name = scenarioName || (document.getElementById('netopt-scenario-name').value || 'Network Optimization Scenario').trim();
        if (!name) { alert('Please enter a scenario name'); return; }

        var inputs = netoptCollectInputs();
        var payload = {
            scenario_name: name,
            is_active: true,
            facilities: inputs.facilities,
            demands: inputs.demands,
            transport: inputs.transport,
            constraints: inputs.constraints,
            solver_mode: inputs.solver_mode
        };
        if (projectId) payload.project_id = projectId;

        // Save results if available
        if (netoptState.results) {
            payload.result_total_cost = netoptState.results.totalCost;
            payload.result_avg_distance = netoptState.results.avgDistance;
            payload.result_service_level = netoptState.results.serviceLevel;
            payload.result_open_facilities = netoptState.results.openFacilities;
        }

        var resp = await cmApiPost('netopt_scenarios', payload);
        netoptActiveScenarioId = resp[0].id;

        document.getElementById('netopt-scenario-name').value = name;

        // Auto-link to deal if selected
        var dealIdStr = document.getElementById('netoptDealSelector')?.value;
        if (dealIdStr && typeof sb !== 'undefined' && sb) {
            var dealIdNum = parseInt(dealIdStr, 10);
            if (!isNaN(dealIdNum)) {
                try {
                    // Check if already linked
                    var { data: existing } = await sb.from('deal_artifacts')
                        .select('id').eq('deal_id', dealIdNum)
                        .eq('artifact_type', 'netopt_scenario')
                        .eq('artifact_id', String(netoptActiveScenarioId)).limit(1);
                    if (!existing || existing.length === 0) {
                        await sb.from('deal_artifacts').insert({
                            deal_id: dealIdNum,
                            artifact_type: 'netopt_scenario',
                            artifact_id: String(netoptActiveScenarioId),
                            artifact_name: name,
                            created_by: 'IES Hub'
                        });
                    }
                } catch(e) {
                    console.warn('Could not auto-link to deal:', e);
                }
            }
        }

        var saveBtn = document.querySelector('#netopt-scenario-bar .wsc-action-btn:nth-child(1)');
        if (saveBtn) {
            var orig = saveBtn.innerHTML;
            saveBtn.innerHTML = '<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="var(--ies-green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Saved!';
            saveBtn.style.borderColor = 'var(--ies-green)';
            saveBtn.style.color = 'var(--ies-green)';
            setTimeout(function() { saveBtn.innerHTML = orig; saveBtn.style.borderColor = ''; saveBtn.style.color = ''; }, 2000);
        }

        netoptRefreshScenarioList(projectId);
    } catch(error) {
        console.error('Netopt save error:', error);
        alert('Error saving scenario: ' + error.message);
    }
}

// Load a netopt scenario from Supabase
async function netoptLoadScenario(scenarioId) {
    try {
        var scenarios = await cmFetchTable('netopt_scenarios', 'id=eq.' + scenarioId);
        if (scenarios.length === 0) { alert('Scenario not found'); return; }

        var scenario = scenarios[0];
        netoptActiveScenarioId = scenario.id;
        document.getElementById('netopt-scenario-name').value = scenario.scenario_name || '';

        netoptApplyInputs(scenario);
    } catch(error) {
        console.error('Netopt load error:', error);
        alert('Error loading scenario: ' + error.message);
    }
}

// List netopt scenarios
async function netoptListScenarios(projectId) {
    try {
        var filter = projectId ? 'project_id=eq.' + projectId : 'project_id=is.null';
        return await cmFetchTable('netopt_scenarios', filter);
    } catch(error) {
        console.error('Netopt list error:', error);
        return [];
    }
}

// Delete a netopt scenario
async function netoptDeleteScenario(scenarioId) {
    try {
        if (!confirm('Delete this scenario?')) return;
        await cmApiDelete('netopt_scenarios', scenarioId);
        if (netoptActiveScenarioId === scenarioId) netoptActiveScenarioId = null;
        netoptRefreshScenarioList(window.activeCostModelProjectId || null);
    } catch(error) {
        console.error('Netopt delete error:', error);
        alert('Error deleting scenario: ' + error.message);
    }
}

// Refresh netopt scenario dropdown
async function netoptRefreshScenarioList(projectId) {
    try {
        var scenarios = await netoptListScenarios(projectId);
        var select = document.getElementById('netopt-scenario-select');
        if (select) {
            select.innerHTML = '<option value="">-- Select scenario --</option>';
            scenarios.forEach(function(s) {
                var opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.scenario_name;
                select.appendChild(opt);
            });
        }
    } catch(error) {
        console.error('Error refreshing netopt scenario list:', error);
    }
}

// Initialize calculator on first view
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('wsc-peakunits')) {
    toggleStorageOptions();
    toggleFwdPick();
    calcWarehouse();

    // Bind ALL calculator inputs via JS (backup for inline oninput)
    var calcInputIds = [
      'wsc-peakunits','wsc-avgunits',
      'wsc-pct-fullpal','wsc-pct-ctnpal','wsc-pct-ctnshelv',
      'wsc-upp','wsc-upc-pal','wsc-cpp','wsc-upc-shelv','wsc-cpl',
      'wsc-hcbuf',
      'wsc-clearht','wsc-loadht',
      'wsc-bulkdp','wsc-stackhi','wsc-mixrack',
      'wsc-inpal','wsc-outpal','wsc-pdph','wsc-dockhr','wsc-office',
      'wsc-fwd-skus','wsc-fwd-days','wsc-ob-units','wsc-op-days'
    ];
    for (var i = 0; i < calcInputIds.length; i++) {
      var el = document.getElementById(calcInputIds[i]);
      if (el) {
        el.addEventListener('input', calcWarehouse);
        el.addEventListener('change', calcWarehouse);
      }
    }
    // Also bind dropdowns
    var selIds = ['wsc-storetype','wsc-aisletype','wsc-rackdir','wsc-dockconfig','wsc-fwd-type'];
    for (var j = 0; j < selIds.length; j++) {
      var sel = document.getElementById(selIds[j]);
      if (sel) sel.addEventListener('change', function() { toggleStorageOptions(); calcWarehouse(); });
    }
    // Bind checkboxes
    var cbIds = ['wsc-fwd','wsc-vas','wsc-ret','wsc-chg','wsc-stg'];
    for (var k = 0; k < cbIds.length; k++) {
      var cb = document.getElementById(cbIds[k]);
      if (cb) cb.addEventListener('change', calcWarehouse);
    }
  }

  // Initialize Network Optimization demand list
  if (document.getElementById('net-demand-list')) {
    renderDemandList();
  }
}); // end DOMContentLoaded

// ═══════════════════════════════════════════════════════════════
// ENTERPRISE NETWORK OPTIMIZATION (NETOPT) — Full Module
// ═══════════════════════════════════════════════════════════════

// ── NETWORK OPTIMIZATION MODULE ──

var netoptState = {
  facilities: [],
  demands: [],
  suppliers: [],   // B5: Inbound origin points
  transport: {
    outboundPerUnitMile: 0.00296,
    inboundPerUnitMile: 0.00178,
    ltlSurcharge: 25,
    truckSpeedMiPerDay: 500
  },
  constraints: {
    serviceLevelPct: 95,
    minFacilities: 1,
    maxFacilities: 5,
    budgetCap: null,
    inventoryCarryPct: 15,
    globalMaxDays: 3,
    hardConstraint: false,
    targetServicePct: 95
  },
  results: null,
  activeTab: 'setup',
  solverMode: 'heuristic',
  mapInitialized: false,
  netoptMap: null,
  mapMarkers: [],
  mapPolylines: [],
  heatLayer: null,
  zoneLayers: [],
  mapMode: 'markers' // 'markers', 'heat', 'both', 'zones'
};

var netoptRateMode = 'market'; // 'market' or 'manual'
var netoptMarketRates = { datContract: null, datSpot: null, diesel: null, fscPct: null, lastUpdated: null };
var NETOPT_DIESEL_BASELINE = 2.50; // DOE baseline for fuel surcharge calculation

// Fetch live freight rates from Supabase
async function netoptFetchFreightRates() {
  var freshEl = document.getElementById('netopt-rate-freshness');
  if (freshEl) freshEl.textContent = 'Loading…';
  try {
    var [rates, fuels] = await Promise.all([
      cmFetchTable('freight_rates', 'order=report_date.desc&limit=10'),
      cmFetchTable('fuel_prices', 'order=report_date.desc&limit=5')
    ]);

    // Extract latest truck rates
    var datContract = rates.find(r => r.index_name && r.index_name.indexOf('Contract Van') >= 0);
    var datSpot = rates.find(r => r.index_name && r.index_name.indexOf('Spot Van') >= 0);
    var diesel = fuels.find(f => f.fuel_type && f.fuel_type.toLowerCase().indexOf('diesel') >= 0);

    netoptMarketRates.datContract = datContract ? parseFloat(datContract.rate) : null;
    netoptMarketRates.datSpot = datSpot ? parseFloat(datSpot.rate) : null;
    netoptMarketRates.diesel = diesel ? parseFloat(diesel.price_per_gallon) : null;
    netoptMarketRates.lastUpdated = datContract ? datContract.report_date : null;

    // Calculate fuel surcharge: (current - baseline) / baseline * fuel-portion-of-linehaul
    // Industry standard: fuel ~30% of linehaul cost, surcharge covers delta
    if (netoptMarketRates.diesel && netoptMarketRates.diesel > NETOPT_DIESEL_BASELINE) {
      netoptMarketRates.fscPct = Math.round(((netoptMarketRates.diesel - NETOPT_DIESEL_BASELINE) / NETOPT_DIESEL_BASELINE) * 100 * 10) / 10;
    } else {
      netoptMarketRates.fscPct = 0;
    }

    // Update market rate display cards
    var el;
    el = document.getElementById('netopt-rate-dat-contract');
    if (el) el.textContent = netoptMarketRates.datContract ? fmtNum(netoptMarketRates.datContract, 2, '$') : '—';
    el = document.getElementById('netopt-rate-dat-contract-chg');
    if (el && datContract && datContract.wow_change != null) {
      var chg = parseFloat(datContract.wow_change);
      el.textContent = (chg >= 0 ? '▲' : '▼') + ' ' + fmtNum(Math.abs(chg), 1) + '% WoW';
      el.style.color = chg >= 0 ? 'var(--ies-green)' : 'var(--ies-red)';
    }

    el = document.getElementById('netopt-rate-dat-spot');
    if (el) el.textContent = netoptMarketRates.datSpot ? fmtNum(netoptMarketRates.datSpot, 2, '$') : '—';
    el = document.getElementById('netopt-rate-dat-spot-chg');
    if (el && datSpot && datSpot.wow_change != null) {
      var chg2 = parseFloat(datSpot.wow_change);
      el.textContent = (chg2 >= 0 ? '▲' : '▼') + ' ' + fmtNum(Math.abs(chg2), 1) + '% WoW';
      el.style.color = chg2 >= 0 ? 'var(--ies-green)' : 'var(--ies-red)';
    }

    el = document.getElementById('netopt-rate-diesel');
    if (el) el.textContent = netoptMarketRates.diesel ? fmtNum(netoptMarketRates.diesel, 2, '$') : '—';
    el = document.getElementById('netopt-rate-diesel-chg');
    if (el && diesel && diesel.week_over_week_change != null) {
      var chg3 = parseFloat(diesel.week_over_week_change);
      el.textContent = (chg3 >= 0 ? '▲' : '▼') + ' ' + fmtNum(Math.abs(chg3), 3, '$') + ' WoW';
      el.style.color = chg3 >= 0 ? 'var(--ies-red)' : 'var(--ies-green)'; // Red = higher fuel cost
    }

    el = document.getElementById('netopt-rate-fsc');
    if (el) el.textContent = netoptMarketRates.fscPct != null ? fmtNum(netoptMarketRates.fscPct, 1) + '%' : '—';

    // Update freshness indicator
    if (freshEl && netoptMarketRates.lastUpdated) {
      var d = new Date(netoptMarketRates.lastUpdated);
      freshEl.textContent = 'Updated ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      freshEl.style.color = 'var(--ies-green)';
    }

    // Auto-populate rate fields if in market mode
    if (netoptRateMode === 'market') {
      netoptApplyMarketRates();
    }

  } catch(err) {
    console.error('Failed to fetch freight rates:', err);
    if (freshEl) { freshEl.textContent = 'Failed to load'; freshEl.style.color = 'var(--ies-red)'; }
  }
}

// Apply market rates to input fields
function netoptApplyMarketRates() {
  if (netoptMarketRates.datContract) {
    document.getElementById('netopt-tl-rate').value = netoptMarketRates.datContract.toFixed(2);
    document.getElementById('netopt-tl-rate-source').textContent = 'Source: DAT Contract Van (live)';
  }
  if (netoptMarketRates.fscPct != null) {
    document.getElementById('netopt-fuel-surcharge').value = netoptMarketRates.fscPct.toFixed(1);
    document.getElementById('netopt-fsc-source').textContent = 'Diesel ' + fmtNum(netoptMarketRates.diesel || 0, 2, '$') + ' vs ' + fmtNum(NETOPT_DIESEL_BASELINE, 2, '$') + ' baseline';
  }
  netoptRecalcAllCosts();
}

// Toggle between market rates, manual, and CSV
function netoptSetRateMode(mode) {
  netoptRateMode = mode;
  var mBtn = document.getElementById('netopt-rate-mode-market');
  var oBtn = document.getElementById('netopt-rate-mode-manual');
  var cBtn = document.getElementById('netopt-rate-mode-csv');
  var desc = document.getElementById('netopt-rate-mode-desc');
  var csvPanel = document.getElementById('netopt-csv-upload-panel');
  var tlInput = document.getElementById('netopt-tl-rate');
  var fscInput = document.getElementById('netopt-fuel-surcharge');

  // Reset all buttons
  [mBtn, oBtn, cBtn].forEach(function(b) { if (b) { b.style.background = '#fff'; b.style.color = 'var(--ies-navy)'; }});

  if (mode === 'market') {
    mBtn.style.background = 'var(--ies-blue)'; mBtn.style.color = '#fff';
    desc.textContent = 'Using latest DAT linehaul rates + fuel surcharge';
    csvPanel.style.display = 'none';
    tlInput.style.background = '#f1f5f9'; fscInput.style.background = '#f1f5f9';
    netoptApplyMarketRates();
  } else if (mode === 'csv') {
    cBtn.style.background = 'var(--ies-blue)'; cBtn.style.color = '#fff';
    desc.textContent = 'Using uploaded carrier rate cards';
    csvPanel.style.display = 'block';
    tlInput.style.background = ''; fscInput.style.background = '';
  } else {
    oBtn.style.background = 'var(--ies-blue)'; oBtn.style.color = '#fff';
    desc.textContent = 'Enter your own contracted or negotiated rates';
    csvPanel.style.display = 'none';
    tlInput.style.background = ''; fscInput.style.background = '';
    document.getElementById('netopt-tl-rate-source').textContent = 'Source: Manual entry';
    document.getElementById('netopt-fsc-source').textContent = 'Manual fuel surcharge';
  }
}

// ── Parcel Zone Rate Tables (published GRI-adjusted 2025/2026 estimates) ──
// Rows: weight brackets. Columns: zone 2-8. Values: $/package (UPS Ground published)
var NETOPT_PARCEL_RATES = {
  ups: {
    weights: [1, 2, 3, 5, 10, 15, 20, 30, 40, 50, 70],
    zones: [2, 3, 4, 5, 6, 7, 8],
    rates: [
      [8.45, 8.85, 9.35, 10.20, 11.10, 12.25, 13.80],  // 1 lb
      [8.90, 9.45, 10.05, 10.95, 12.00, 13.35, 15.10],  // 2 lb
      [9.35, 10.00, 10.75, 11.75, 12.90, 14.45, 16.40],  // 3 lb
      [10.25, 11.10, 12.10, 13.30, 14.70, 16.65, 19.00],  // 5 lb
      [12.50, 13.85, 15.30, 17.10, 19.20, 22.00, 25.50],  // 10 lb
      [14.75, 16.60, 18.50, 20.90, 23.70, 27.35, 32.00],  // 15 lb
      [17.00, 19.35, 21.70, 24.70, 28.20, 32.70, 38.50],  // 20 lb
      [21.50, 24.85, 28.10, 32.30, 37.20, 43.40, 51.50],  // 30 lb
      [26.00, 30.35, 34.50, 39.90, 46.20, 54.10, 64.50],  // 40 lb
      [30.50, 35.85, 40.90, 47.50, 55.20, 64.80, 77.50],  // 50 lb
      [39.50, 46.85, 53.70, 62.70, 73.20, 86.20, 103.50]  // 70 lb
    ]
  },
  fedex: {
    weights: [1, 2, 3, 5, 10, 15, 20, 30, 40, 50, 70],
    zones: [2, 3, 4, 5, 6, 7, 8],
    rates: [
      [8.30, 8.70, 9.20, 10.05, 10.90, 12.05, 13.55],
      [8.75, 9.30, 9.90, 10.80, 11.85, 13.15, 14.85],
      [9.20, 9.85, 10.60, 11.55, 12.70, 14.20, 16.10],
      [10.10, 10.95, 11.95, 13.10, 14.50, 16.40, 18.70],
      [12.30, 13.65, 15.10, 16.85, 18.95, 21.70, 25.10],
      [14.50, 16.35, 18.25, 20.60, 23.40, 26.95, 31.50],
      [16.75, 19.05, 21.40, 24.35, 27.80, 32.20, 37.90],
      [21.15, 24.45, 27.70, 31.80, 36.60, 42.70, 50.70],
      [25.60, 29.85, 33.95, 39.30, 45.50, 53.30, 63.50],
      [30.00, 35.30, 40.30, 46.80, 54.40, 63.80, 76.30],
      [38.90, 46.10, 52.90, 61.70, 72.10, 84.90, 101.90]
    ]
  },
  usps: {
    weights: [1, 2, 3, 5, 10, 15, 20, 30, 40, 50, 70],
    zones: [2, 3, 4, 5, 6, 7, 8],
    rates: [
      [7.90, 8.10, 8.40, 8.90, 9.50, 10.30, 11.20],
      [8.10, 8.40, 8.80, 9.40, 10.10, 11.00, 12.10],
      [8.30, 8.70, 9.20, 9.90, 10.70, 11.70, 13.00],
      [8.90, 9.50, 10.20, 11.10, 12.20, 13.50, 15.20],
      [10.50, 11.50, 12.60, 13.90, 15.50, 17.50, 20.00],
      [12.20, 13.50, 14.90, 16.70, 18.80, 21.50, 24.80],
      [13.90, 15.50, 17.20, 19.50, 22.10, 25.50, 29.60],
      [17.30, 19.50, 21.80, 25.10, 28.70, 33.50, 39.20],
      [20.70, 23.50, 26.40, 30.70, 35.30, 41.50, 48.80],
      [24.10, 27.50, 31.00, 36.30, 41.90, 49.50, 58.40],
      [30.90, 35.50, 40.20, 47.50, 55.10, 65.50, 77.60]
    ]
  }
};

// Custom rates holder (populated by CSV upload)
NETOPT_PARCEL_RATES.custom = JSON.parse(JSON.stringify(NETOPT_PARCEL_RATES.ups));

// LTL base tariff rates ($/cwt by class, 500mi average — simplified CZAR-lite)
var NETOPT_LTL_TARIFF = {
  // class: base $/CWT at different weight breaks (500lb, 1000lb, 2000lb, 5000lb, 10000lb, 20000lb)
  '50':  [22.50, 18.00, 14.50, 11.00, 8.50, 6.80],
  '55':  [25.00, 20.00, 16.10, 12.20, 9.45, 7.55],
  '60':  [27.50, 22.00, 17.70, 13.40, 10.40, 8.30],
  '65':  [30.00, 24.00, 19.30, 14.65, 11.35, 9.05],
  '70':  [32.50, 26.00, 20.90, 15.85, 12.30, 9.80],
  '77.5':[36.00, 28.80, 23.15, 17.55, 13.60, 10.85],
  '85':  [39.50, 31.60, 25.40, 19.25, 14.90, 11.90],
  '92.5':[43.00, 34.40, 27.65, 20.95, 16.25, 12.95],
  '100': [46.50, 37.20, 29.90, 22.70, 17.60, 14.00],
  '110': [51.00, 40.80, 32.80, 24.90, 19.30, 15.35],
  '125': [57.00, 45.60, 36.65, 27.80, 21.55, 17.15],
  '150': [65.00, 52.00, 41.80, 31.70, 24.55, 19.55],
  '175': [73.00, 58.40, 46.95, 35.60, 27.55, 21.95],
  '200': [81.00, 64.80, 52.10, 39.50, 30.60, 24.35],
  '250': [97.00, 77.60, 62.40, 47.30, 36.65, 29.15],
  '300': [113.00, 90.40, 72.70, 55.15, 42.75, 34.00],
  '400': [145.00, 116.00, 93.30, 70.75, 54.85, 43.60],
  '500': [177.00, 141.60, 113.85, 86.35, 66.90, 53.20]
};

// Distance-to-zone mapping for parcel (rough: miles → UPS/FedEx zone)
function netoptMilesToZone(miles) {
  if (miles <= 150) return 2;
  if (miles <= 300) return 3;
  if (miles <= 600) return 4;
  if (miles <= 1000) return 5;
  if (miles <= 1400) return 6;
  if (miles <= 1800) return 7;
  return 8;
}

// Distance multiplier for LTL (base tariff is ~500mi; scale for actual distance)
function netoptLTLDistMultiplier(miles) {
  if (miles <= 100) return 0.55;
  if (miles <= 250) return 0.70;
  if (miles <= 500) return 1.00;
  if (miles <= 750) return 1.20;
  if (miles <= 1000) return 1.40;
  if (miles <= 1500) return 1.65;
  return 1.90;
}

// Get parcel cost for a specific zone and weight
function netoptGetParcelRate(carrier, weightLbs, zone) {
  var table = NETOPT_PARCEL_RATES[carrier] || NETOPT_PARCEL_RATES.ups;
  var zoneIdx = zone - 2; // zones start at 2
  if (zoneIdx < 0) zoneIdx = 0;
  if (zoneIdx >= table.zones.length) zoneIdx = table.zones.length - 1;

  // Find weight bracket
  var rowIdx = 0;
  for (var i = 0; i < table.weights.length; i++) {
    if (weightLbs >= table.weights[i]) rowIdx = i;
  }
  return table.rates[rowIdx][zoneIdx];
}

// Get LTL cost for a specific class, weight, and distance
function netoptGetLTLRate(freightClass, weightLbs, miles) {
  var tariff = NETOPT_LTL_TARIFF[String(freightClass)] || NETOPT_LTL_TARIFF['70'];
  // Find weight break index: 500, 1000, 2000, 5000, 10000, 20000
  var breaks = [500, 1000, 2000, 5000, 10000, 20000];
  var breakIdx = 0;
  for (var i = 0; i < breaks.length; i++) {
    if (weightLbs >= breaks[i]) breakIdx = i;
  }
  var baseCWT = tariff[breakIdx]; // $/CWT at this break
  var distMult = netoptLTLDistMultiplier(miles);
  var cwt = weightLbs / 100;
  return baseCWT * cwt * distMult; // total $ for this shipment before discount/FSC
}

// Balance mode mix to 100%
function netoptBalanceModeMix(changed) {
  var tl = parseFloat(document.getElementById('netopt-mode-tl-pct').value) || 0;
  var ltl = parseFloat(document.getElementById('netopt-mode-ltl-pct').value) || 0;
  var parcel = parseFloat(document.getElementById('netopt-mode-parcel-pct').value) || 0;
  var total = tl + ltl + parcel;
  var warn = document.getElementById('netopt-mode-mix-warn');
  if (Math.abs(total - 100) > 0.5) {
    warn.style.display = 'block';
    warn.textContent = 'Mode mix totals ' + total + '% — must equal 100%';
  } else {
    warn.style.display = 'none';
  }
  // Update labels
  var tlLabel = document.getElementById('netopt-tl-pct-label');
  var ltlLabel = document.getElementById('netopt-ltl-pct-label');
  var parcelLabel = document.getElementById('netopt-parcel-pct-label');
  if (tlLabel) tlLabel.textContent = tl + '% of volume';
  if (ltlLabel) ltlLabel.textContent = ltl + '% of volume';
  if (parcelLabel) parcelLabel.textContent = parcel + '% of volume';
  netoptRecalcAllCosts();
}

// Populate parcel zone rate table display
function netoptRenderParcelRateTable() {
  var carrier = document.getElementById('netopt-parcel-carrier').value || 'ups';
  var table = NETOPT_PARCEL_RATES[carrier] || NETOPT_PARCEL_RATES.ups;
  var discount = parseFloat(document.getElementById('netopt-parcel-discount').value) || 0;
  var tbody = document.getElementById('netopt-parcel-rate-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var labels = ['1 lb','2 lb','3 lb','5 lb','10 lb','15 lb','20 lb','30 lb','40 lb','50 lb','70 lb'];
  table.rates.forEach(function(row, i) {
    var tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--ies-gray-100)';
    var html = '<td style="padding:6px 10px;font-weight:600;color:var(--ies-navy);">' + labels[i] + '</td>';
    row.forEach(function(rate) {
      var net = rate * (1 - discount / 100);
      html += '<td style="padding:6px 10px;text-align:right;color:var(--ies-gray-600);">' + fmtNum(net, 2, '$') + '</td>';
    });
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

// CSV rate card parser
function netoptParseRateCSV(mode, input) {
  var file = input.files[0];
  if (!file) return;
  var status = document.getElementById('netopt-csv-' + mode + '-status');
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var lines = e.target.result.split('\n').filter(function(l) { return l.trim(); });
      if (mode === 'parcel' && lines.length > 1) {
        // Parse parcel CSV: header is weight,zone2,zone3,...zone8
        var rates = [];
        var weights = [];
        var parseErrors = [];
        var expectedCols = lines[0].split(',').length;
        for (var i = 1; i < lines.length; i++) {
          var cols = lines[i].split(',').map(function(c) { return parseFloat(c.trim()); });
          if (cols.length < expectedCols) {
            parseErrors.push('Row ' + i + ': expected ' + expectedCols + ' columns, got ' + cols.length);
            continue;
          }
          if (isNaN(cols[0]) || cols[0] <= 0) {
            parseErrors.push('Row ' + i + ': invalid weight "' + lines[i].split(',')[0].trim() + '"');
            continue;
          }
          var rowRates = cols.slice(1);
          var hasNaN = rowRates.some(function(v) { return isNaN(v) || v < 0; });
          if (hasNaN) {
            parseErrors.push('Row ' + i + ': contains non-numeric or negative rate values');
            continue;
          }
          weights.push(cols[0]);
          rates.push(rowRates);
        }
        if (weights.length === 0) {
          status.textContent = 'No valid rows found' + (parseErrors.length ? ': ' + parseErrors[0] : '');
          status.style.color = 'var(--ies-red)';
          return;
        }
        // Verify weights are ascending
        for (var w = 1; w < weights.length; w++) {
          if (weights[w] <= weights[w-1]) {
            parseErrors.push('Warning: weights not ascending at row ' + (w+1));
            break;
          }
        }
        NETOPT_PARCEL_RATES.custom = { weights: weights, zones: [2,3,4,5,6,7,8], rates: rates };
        document.getElementById('netopt-parcel-carrier').value = 'custom';
        var msg = weights.length + ' rows loaded';
        if (parseErrors.length) msg += ' (' + parseErrors.length + ' skipped)';
        status.textContent = msg;
        status.style.color = parseErrors.length ? 'var(--ies-orange)' : 'var(--ies-green)';
      } else if (mode === 'tl' && lines.length > 1) {
        // Simple avg: take mean of rate column
        var total = 0, count = 0;
        for (var i = 1; i < lines.length; i++) {
          var cols = lines[i].split(',');
          var rate = parseFloat(cols[cols.length - 1]);
          if (!isNaN(rate)) { total += rate; count++; }
        }
        if (count > 0) {
          document.getElementById('netopt-tl-rate').value = (total / count).toFixed(2);
          status.textContent = count + ' lanes, avg ' + fmtNum(total / count, 2, '$') + '/mi';
          status.style.color = 'var(--ies-green)';
        }
      } else if (mode === 'ltl' && lines.length > 1) {
        status.textContent = (lines.length - 1) + ' rate entries loaded';
        status.style.color = 'var(--ies-green)';
      }
      netoptRecalcAllCosts();
    } catch(err) {
      status.textContent = 'Parse error: ' + err.message;
      status.style.color = 'var(--ies-red)';
    }
  };
  reader.readAsText(file);
}

// Download CSV template
function netoptDownloadRateTemplate() {
  var tl = 'origin_city,origin_state,dest_city,dest_state,rate_per_mile\nAtlanta,GA,New York,NY,2.45\nChicago,IL,Los Angeles,CA,2.60\n';
  var ltl = 'freight_class,weight_break_lbs,rate_per_cwt\n70,500,32.50\n70,1000,26.00\n100,500,46.50\n';
  var parcel = 'weight_lbs,zone2,zone3,zone4,zone5,zone6,zone7,zone8\n1,8.45,8.85,9.35,10.20,11.10,12.25,13.80\n5,10.25,11.10,12.10,13.30,14.70,16.65,19.00\n';
  var combined = '--- TL RATE CARD ---\n' + tl + '\n--- LTL RATE CARD ---\n' + ltl + '\n--- PARCEL RATE CARD ---\n' + parcel;
  var blob = new Blob([combined], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rate_card_templates.csv';
  a.click();
}

// ── Master cost recalculation (replaces old netoptRecalcUnitMileCost) ──
function netoptRecalcUnitMileCost() { netoptRecalcAllCosts(); }

function netoptRecalcAllCosts() {
  // TL cost per unit-mile
  var tlRate = parseFloat(document.getElementById('netopt-tl-rate').value) || 2.37;
  var fscPct = parseFloat(document.getElementById('netopt-fuel-surcharge').value) || 0;
  var unitsPer = parseFloat(document.getElementById('netopt-units-per-tl').value) || 800;
  var inboundRatio = parseFloat(document.getElementById('netopt-inbound-ratio').value) || 60;
  var tlAllIn = tlRate * (1 + fscPct / 100);
  var tlUnitMile = tlAllIn / unitsPer;

  // Display TL $/unit-mile
  var tlDisplay = document.getElementById('netopt-tl-unit-mile');
  if (tlDisplay) tlDisplay.textContent = fmtNum(tlUnitMile, 5, '$');

  // LTL cost per unit-mile (at reference distance of 500mi)
  var ltlWeight = parseFloat(document.getElementById('netopt-ltl-avg-weight').value) || 1500;
  var ltlClass = document.getElementById('netopt-ltl-class').value || '70';
  var ltlDiscount = parseFloat(document.getElementById('netopt-ltl-discount').value) || 65;
  var ltlFsc = parseFloat(document.getElementById('netopt-ltl-fsc').value) || 28;
  var ltlUnits = parseFloat(document.getElementById('netopt-units-per-ltl').value) || 150;
  var ltlShipmentCost = netoptGetLTLRate(ltlClass, ltlWeight, 500); // base at 500mi
  ltlShipmentCost = ltlShipmentCost * (1 - ltlDiscount / 100) * (1 + ltlFsc / 100);
  var ltlUnitMile = ltlShipmentCost / ltlUnits / 500; // per unit per mile

  var ltlDisplay = document.getElementById('netopt-ltl-unit-mile');
  if (ltlDisplay) ltlDisplay.textContent = fmtNum(ltlUnitMile, 5, '$');

  // Parcel cost per unit (at reference zone 5)
  var carrier = document.getElementById('netopt-parcel-carrier').value || 'ups';
  var parcelWeight = parseFloat(document.getElementById('netopt-parcel-avg-weight').value) || 5;
  var parcelDiscount = parseFloat(document.getElementById('netopt-parcel-discount').value) || 35;
  var resiCharge = parseFloat(document.getElementById('netopt-parcel-resi').value) || 4.50;
  var resiPct = parseFloat(document.getElementById('netopt-parcel-resi-pct').value) || 75;
  var zone5Rate = netoptGetParcelRate(carrier, parcelWeight, 5);
  var parcelUnitCost = zone5Rate * (1 - parcelDiscount / 100) + (resiCharge * resiPct / 100);

  var parcelDisplay = document.getElementById('netopt-parcel-unit-cost');
  if (parcelDisplay) parcelDisplay.textContent = fmtNum(parcelUnitCost, 2, '$');

  // Render parcel rate table
  netoptRenderParcelRateTable();

  // Mode mix
  var tlPct = parseFloat(document.getElementById('netopt-mode-tl-pct').value) || 0;
  var ltlPct = parseFloat(document.getElementById('netopt-mode-ltl-pct').value) || 0;
  var parcelPct = parseFloat(document.getElementById('netopt-mode-parcel-pct').value) || 0;

  // Blended outbound $/unit-mile
  // TL and LTL are distance-based ($/unit-mile), parcel is zone-based ($/unit flat + distance component)
  // For optimizer: convert parcel to $/unit-mile equivalent at avg 500mi haul
  var parcelPerUnitMile = parcelUnitCost / 500;
  var blendedUnitMile = (tlUnitMile * tlPct / 100) + (ltlUnitMile * ltlPct / 100) + (parcelPerUnitMile * parcelPct / 100);
  var inboundUnitMile = blendedUnitMile * (inboundRatio / 100);

  // Update blended display
  var blendTl = document.getElementById('netopt-blend-tl');
  var blendLtl = document.getElementById('netopt-blend-ltl');
  var blendParcel = document.getElementById('netopt-blend-parcel');
  var blendTotal = document.getElementById('netopt-blend-total');
  if (blendTl) blendTl.textContent = fmtNum(tlUnitMile * tlPct / 100, 5, '$');
  if (blendLtl) blendLtl.textContent = fmtNum(ltlUnitMile * ltlPct / 100, 5, '$');
  if (blendParcel) blendParcel.textContent = fmtNum(parcelPerUnitMile * parcelPct / 100, 5, '$');
  if (blendTotal) blendTotal.textContent = fmtNum(blendedUnitMile, 5, '$');

  // Update hidden inputs for the optimizer
  document.getElementById('netopt-outbound-cost').value = blendedUnitMile.toFixed(6);
  document.getElementById('netopt-inbound-cost').value = inboundUnitMile.toFixed(6);

  // Store mode-specific rates on netoptState.transport for detailed solver
  netoptState.transport.tlUnitMile = tlUnitMile;
  netoptState.transport.ltlUnitMile = ltlUnitMile;
  netoptState.transport.parcelUnitCost = parcelUnitCost;
  netoptState.transport.modeMix = { tl: tlPct / 100, ltl: ltlPct / 100, parcel: parcelPct / 100 };
  netoptState.transport.parcelCarrier = carrier;
  netoptState.transport.parcelDiscount = parcelDiscount;
  netoptState.transport.parcelWeight = parcelWeight;
  netoptState.transport.parcelResi = resiCharge;
  netoptState.transport.parcelResiPct = resiPct;
  netoptState.transport.ltlClass = ltlClass;
  netoptState.transport.ltlWeight = ltlWeight;
  netoptState.transport.ltlDiscount = ltlDiscount;
  netoptState.transport.ltlFsc = ltlFsc;
  netoptState.transport.ltlUnits = ltlUnits;

  netoptUpdateKPI();
}

// ══════════════════════════════════════════════════════════════════════
// DESIGN TOOLS LANDING PAGES — Scenario Management
// ══════════════════════════════════════════════════════════════════════

// ── WAREHOUSE SIZING CALCULATOR LANDING ──
async function wscShowLanding() {
  var landing = document.getElementById('wsc-landing');
  var tool = document.getElementById('wsc-tool');
  if (landing) landing.style.display = 'block';
  if (tool) tool.style.display = 'none';
  await wscLoadScenariosList();
}

async function wscShowTool() {
  var landing = document.getElementById('wsc-landing');
  var tool = document.getElementById('wsc-tool');
  if (landing) landing.style.display = 'none';
  if (tool) tool.style.display = 'block';
}

async function wscLoadScenariosList() {
  try {
    var scenarios = await wscListScenarios(window.activeCostModelProjectId || null);
    var grid = document.getElementById('wsc-landing-grid');

    if (!grid) return;

    if (scenarios.length === 0) {
      grid.innerHTML = '';
      dtToggleLandingEmpty('wsc-landing-actions', 'wsc-empty-state', true);
      return;
    }

    dtToggleLandingEmpty('wsc-landing-actions', 'wsc-empty-state', false);

    grid.innerHTML = scenarios.map(function(s) {
      return '<div class="dt-landing-card">' +
        '<div onclick="wscLoadScenario(\'' + esc(s.id) + '\'); wscShowTool()" style="cursor:pointer;">' +
        '<div class="dt-landing-card-name">' + esc(s.scenario_name || 'Untitled') + '</div>' +
        '<div class="dt-landing-card-meta">' + (s.created_at ? new Date(s.created_at).toLocaleDateString() : '') + '</div>' +
        '<div class="dt-landing-card-metric">SF: ' + (s.facility_sqft ? fmtNum(s.facility_sqft) : '—') + '</div>' +
        '</div>' +
        '<div class="dt-landing-card-actions">' +
        '<button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario(\'warehouse_sizing_scenarios\',\'' + esc(s.id) + '\',\'wsc\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>' +
        '<button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario(\'warehouse_sizing_scenarios\',\'' + esc(s.id) + '\',\'wsc\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>' +
        '</div></div>';
    }).join('');
  } catch (e) {
    console.error('Error loading scenarios:', e);
  }
}

function wscNewScenario() {
  resetCalculator();
  wscShowTool();
}

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
  // Initialize Leaflet map (or invalidateSize if already init'd)
  setTimeout(function(){ initNetworkMap(); }, 100);
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
        '<div onclick="netLoadScenario(\'' + esc(s.id) + '\'); netShowTool()" style="cursor:pointer;">' +
        '<div class="dt-landing-card-name">' + esc(s.scenario_name || 'Untitled') + '</div>' +
        '<div class="dt-landing-card-meta">' + (s.created_at ? new Date(s.created_at).toLocaleDateString() : '') + '</div>' +
        '<div class="dt-landing-card-metric">DCs: ' + (s.dc_count || '—') + ' | Freight: $' + (s.result_est_freight ? s.result_est_freight.toLocaleString(undefined, {maximumFractionDigits: 0}) : '—') + '</div>' +
        '</div>' +
        '<div class="dt-landing-card-actions">' +
        '<button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario(\'network_optimization_scenarios\',\'' + esc(s.id) + '\',\'net\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>' +
        '<button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario(\'network_optimization_scenarios\',\'' + esc(s.id) + '\',\'net\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>' +
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
        '<div onclick="netoptLoadScenario(\'' + esc(s.id) + '\'); netoptShowTool()" style="cursor:pointer;">' +
        '<div class="dt-landing-card-name">' + esc(s.scenario_name || 'Untitled') + '</div>' +
        '<div class="dt-landing-card-meta">' + (s.created_at ? new Date(s.created_at).toLocaleDateString() : '') + '</div>' +
        '<div class="dt-landing-card-metric">Cost: $' + (s.result_total_cost ? s.result_total_cost.toLocaleString(undefined, {maximumFractionDigits: 0}) : '—') + ' | Mode: ' + (s.solver_mode || '—') + '</div>' +
        '</div>' +
        '<div class="dt-landing-card-actions">' +
        '<button class="dt-card-btn-copy" onclick="event.stopPropagation(); dtCopyScenario(\'netopt_scenarios\',\'' + esc(s.id) + '\',\'netopt\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/></svg> Copy</button>' +
        '<button class="dt-card-btn-delete" onclick="event.stopPropagation(); dtDeleteScenario(\'netopt_scenarios\',\'' + esc(s.id) + '\',\'netopt\')"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Delete</button>' +
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
// DEMAND DATA GENERATOR — Business Archetypes at 3-Digit ZIP Level
// ══════════════════════════════════════════════════════════════════════

// Compressed US 3-digit ZIP database: [zip3, city, state, lat, lng, population_index]
// population_index is relative weight 1-100 (100 = NYC metro area density)
var NETOPT_ZIP3_DB = [
  // Northeast Corridor
  ['100','New York','NY',40.71,-74.01,100],['101','New York','NY',40.75,-73.98,45],['102','New York','NY',40.80,-73.95,30],
  ['103','Staten Is','NY',40.58,-74.15,22],['104','Bronx','NY',40.85,-73.87,35],['105','Westchester','NY',41.03,-73.76,25],
  ['106','White Plains','NY',41.03,-73.77,18],['107','Yonkers','NY',40.93,-73.90,20],['108','New Rochelle','NY',40.91,-73.78,15],
  ['110','Queens','NY',40.73,-73.79,40],['111','Long Island City','NY',40.74,-73.92,28],['112','Brooklyn','NY',40.65,-73.95,42],
  ['113','Brooklyn','NY',40.63,-73.93,30],['114','Jamaica','NY',40.69,-73.79,25],['115','W Nassau','NY',40.72,-73.64,20],
  ['116','Long Island','NY',40.75,-73.41,18],['117','Hicksville','NY',40.77,-73.52,16],['118','Hauppauge','NY',40.82,-73.20,12],
  ['119','Riverhead','NY',40.92,-72.66,8],
  ['070','Newark','NJ',40.73,-74.17,35],['071','Newark','NJ',40.74,-74.16,28],['072','Elizabeth','NJ',40.66,-74.21,22],
  ['073','Jersey City','NJ',40.73,-74.08,30],['074','Paterson','NJ',40.92,-74.17,20],['075','Paterson','NJ',40.91,-74.16,15],
  ['076','Hackensack','NJ',40.89,-74.04,18],['077','Red Bank','NJ',40.35,-74.06,12],['078','Dover','NJ',40.88,-74.56,10],
  ['079','Summit','NJ',40.72,-74.36,14],['080','S Jersey','NJ',39.95,-75.12,16],['081','Camden','NJ',39.94,-75.12,18],
  ['085','Trenton','NJ',40.22,-74.76,14],['086','Trenton','NJ',40.23,-74.77,10],['087','Toms River','NJ',39.95,-74.20,12],
  ['088','New Brunswick','NJ',40.49,-74.45,16],['089','New Brunswick','NJ',40.50,-74.44,12],
  ['060','Hartford','CT',41.76,-72.68,18],['061','Hartford','CT',41.77,-72.67,12],['062','Middletown','CT',41.46,-72.82,8],
  ['063','New London','CT',41.36,-72.10,7],['064','New Haven','CT',41.31,-72.92,15],['065','New Haven','CT',41.30,-72.93,12],
  ['066','Bridgeport','CT',41.19,-73.19,18],['067','Waterbury','CT',41.56,-73.04,10],['068','Stamford','CT',41.05,-73.54,16],
  ['010','Springfield','MA',42.10,-72.59,12],['011','Springfield','MA',42.11,-72.58,8],['012','Pittsfield','MA',42.45,-73.26,5],
  ['013','Greenfield','MA',42.59,-72.60,4],['014','Worcester','MA',42.26,-71.80,14],['015','Worcester','MA',42.27,-71.79,10],
  ['016','Worcester','MA',42.28,-71.78,8],['017','Framingham','MA',42.28,-71.42,12],['018','Middleboro','MA',41.89,-70.91,8],
  ['019','Lynn','MA',42.47,-70.95,10],['020','Brockton','MA',42.08,-71.02,14],['021','Boston','MA',42.36,-71.06,38],
  ['022','Boston','MA',42.35,-71.07,30],['023','Brockton','MA',42.08,-71.01,10],['024','Lexington','MA',42.45,-71.23,14],
  ['025','Buzzards Bay','MA',41.74,-70.62,6],['026','Cape Cod','MA',41.67,-70.30,5],['027','Providence','RI',41.82,-71.41,16],
  ['028','Providence','RI',41.83,-71.40,12],['029','Providence','RI',41.84,-71.39,8],
  ['030','Manchester','NH',43.00,-71.45,10],['031','Manchester','NH',43.01,-71.44,8],['032','Concord','NH',43.21,-71.54,6],
  ['033','Concord','NH',43.22,-71.53,4],['034','Keene','NH',42.93,-72.28,3],['035','Littleton','NH',44.31,-71.77,2],
  ['036','Claremont','NH',43.38,-72.35,2],['037','White River','VT',43.65,-72.32,3],['038','Portsmouth','NH',43.08,-70.76,6],
  ['039','Portsmouth','NH',43.07,-70.77,4],
  ['040','Portland','ME',43.66,-70.26,8],['041','Portland','ME',43.67,-70.25,6],['042','Lewiston','ME',44.10,-70.21,4],
  ['043','Augusta','ME',44.31,-69.78,4],['044','Bangor','ME',44.80,-68.77,4],['045','Bath','ME',43.91,-69.82,3],
  ['046','Machias','ME',44.71,-67.46,1],['047','Houlton','ME',46.13,-67.84,1],['048','Rockland','ME',44.10,-69.11,2],
  ['049','Waterville','ME',44.55,-69.63,3],
  ['050','White River','VT',43.65,-72.32,3],['051','Bellows Falls','VT',43.13,-72.44,2],['052','Bennington','VT',42.88,-73.20,2],
  ['053','Brattleboro','VT',42.85,-72.56,3],['054','Burlington','VT',44.48,-73.21,6],['056','Montpelier','VT',44.26,-72.58,3],
  // Mid-Atlantic
  ['150','Pittsburgh','PA',40.44,-80.00,18],['151','Pittsburgh','PA',40.43,-79.99,14],['152','Pittsburgh','PA',40.45,-80.01,12],
  ['153','Washington','PA',40.17,-80.25,6],['154','Uniontown','PA',39.90,-79.72,4],['155','Johnstown','PA',40.33,-78.92,4],
  ['156','Greensburg','PA',40.30,-79.54,5],['157','Bedford','PA',40.02,-78.50,2],['158','DuBois','PA',41.12,-78.76,3],
  ['159','Johnstown','PA',40.34,-78.91,3],['160','New Castle','PA',41.00,-80.35,4],['161','New Castle','PA',41.01,-80.34,3],
  ['162','Sharon','PA',41.23,-80.50,3],['163','Oil City','PA',41.43,-79.70,2],['164','Erie','PA',42.13,-80.09,8],
  ['165','Erie','PA',42.14,-80.08,5],['166','Altoona','PA',40.52,-78.40,4],['167','Bradford','PA',41.96,-78.64,2],
  ['168','State College','PA',40.79,-77.86,5],['169','Williamsport','PA',41.24,-77.00,4],
  ['170','Harrisburg','PA',40.27,-76.88,10],['171','Harrisburg','PA',40.28,-76.87,7],['172','Chambersburg','PA',39.94,-77.66,4],
  ['173','York','PA',39.96,-76.73,6],['174','York','PA',39.97,-76.72,4],['175','Lancaster','PA',40.04,-76.31,8],
  ['176','Lancaster','PA',40.05,-76.30,6],['177','Williamsport','PA',41.25,-76.99,3],['178','Sunbury','PA',40.86,-76.79,3],
  ['179','Pottsville','PA',40.68,-76.20,4],['180','Lehigh Valley','PA',40.60,-75.49,14],['181','Allentown','PA',40.61,-75.47,12],
  ['182','Hazleton','PA',40.96,-75.97,4],['183','Stroudsburg','PA',41.00,-75.20,5],['184','Scranton','PA',41.41,-75.66,8],
  ['185','Scranton','PA',41.42,-75.65,6],['186','Wilkes-Barre','PA',41.25,-75.88,6],['187','Wilkes-Barre','PA',41.26,-75.87,4],
  ['188','Scranton','PA',41.40,-75.67,4],['189','Doylestown','PA',40.31,-75.13,8],['190','Philadelphia','PA',39.95,-75.17,32],
  ['191','Philadelphia','PA',39.94,-75.16,28],['192','Philadelphia','PA',39.93,-75.18,18],['193','SE PA','PA',40.10,-75.30,14],
  ['194','SE PA','PA',40.20,-75.40,10],['195','Reading','PA',40.34,-75.93,8],['196','Reading','PA',40.33,-75.94,6],
  ['197','Wilmington','DE',39.74,-75.55,10],['198','Wilmington','DE',39.75,-75.54,8],['199','Dover','DE',39.16,-75.52,4],
  ['200','Washington','DC',38.90,-77.04,22],['201','Dulles','VA',38.95,-77.45,15],['202','Washington','DC',38.91,-77.03,18],
  ['203','Washington','DC',38.89,-77.05,12],['204','Fredericksburg','VA',38.30,-77.46,6],['205','Richmond','VA',37.54,-77.44,4],
  ['206','Richmond','VA',37.55,-77.43,3],['207','Richmond','VA',37.56,-77.42,2],['208','Merrifield','VA',38.87,-77.24,14],
  ['209','Silver Spring','MD',39.00,-77.02,12],['210','Linthicum','MD',39.20,-76.67,10],['211','Columbia','MD',39.22,-76.85,12],
  ['212','Baltimore','MD',39.29,-76.61,20],['214','Annapolis','MD',38.98,-76.49,8],['215','Cumberland','MD',39.65,-78.76,3],
  ['216','Easton','MD',38.77,-76.08,3],['217','Frederick','MD',39.41,-77.41,6],['218','Salisbury','MD',38.37,-75.60,4],
  ['219','Baltimore','MD',39.28,-76.62,5],
  // Southeast
  ['220','Fairfax','VA',38.85,-77.31,16],['221','Arlington','VA',38.88,-77.10,14],['222','Arlington','VA',38.87,-77.11,12],
  ['223','Alexandria','VA',38.80,-77.05,10],['224','Staunton','VA',38.15,-79.07,4],['225','Farmville','VA',37.30,-78.39,2],
  ['226','Winchester','VA',39.19,-78.16,4],['227','Culpeper','VA',38.47,-78.01,3],['228','Charlottesville','VA',38.03,-78.48,5],
  ['229','Charlottesville','VA',38.04,-78.47,3],['230','Richmond','VA',37.54,-77.43,14],['231','Richmond','VA',37.55,-77.42,10],
  ['232','Richmond','VA',37.53,-77.44,8],['233','Norfolk','VA',36.85,-76.29,10],['234','Virginia Beach','VA',36.85,-75.98,12],
  ['235','Norfolk','VA',36.86,-76.28,6],['236','Newport News','VA',37.09,-76.47,8],['237','Newport News','VA',37.08,-76.48,5],
  ['238','Richmond','VA',37.52,-77.45,4],['239','Farmville','VA',37.30,-78.39,2],['240','Roanoke','VA',37.27,-79.94,6],
  ['241','Roanoke','VA',37.28,-79.93,4],['242','Bristol','VA',36.60,-82.19,3],['243','Pulaski','VA',37.05,-80.78,2],
  ['244','Charlottesville','VA',38.04,-78.47,3],['245','Lynchburg','VA',37.41,-79.14,5],['246','Bluefield','WV',37.27,-81.22,2],
  ['247','Bluefield','WV',37.26,-81.23,2],['248','Clarksburg','WV',39.28,-80.34,3],['249','Lewisburg','WV',37.80,-80.43,1],
  ['250','Charleston','WV',38.35,-81.63,6],['251','Charleston','WV',38.34,-81.64,4],['252','Charleston','WV',38.36,-81.62,3],
  ['253','Huntington','WV',38.42,-82.45,4],['254','Martinsburg','WV',39.46,-77.96,3],['255','Huntington','WV',38.41,-82.44,3],
  ['256','Huntington','WV',38.43,-82.43,2],['257','Huntington','WV',38.42,-82.46,2],['258','Beckley','WV',37.78,-81.19,2],
  ['259','Beckley','WV',37.77,-81.20,1],['260','Wheeling','WV',40.06,-80.72,3],['261','Parkersburg','WV',39.27,-81.56,3],
  ['262','Clarksburg','WV',39.28,-80.34,2],['263','Clarksburg','WV',39.27,-80.35,2],['264','Clarksburg','WV',39.29,-80.33,1],
  ['265','Clarksburg','WV',39.30,-80.32,1],['266','Gassaway','WV',38.67,-80.77,1],['267','Cumberland','MD',39.65,-78.76,2],
  ['268','Petersburg','WV',38.99,-79.12,1],
  ['270','Greensboro','NC',36.07,-79.79,10],['271','Winston-Salem','NC',36.10,-80.24,10],['272','Greensboro','NC',36.08,-79.78,8],
  ['273','Greensboro','NC',36.06,-79.80,6],['274','Greensboro','NC',36.09,-79.77,4],['275','Raleigh','NC',35.78,-78.64,14],
  ['276','Raleigh','NC',35.77,-78.65,12],['277','Durham','NC',35.99,-78.90,10],['278','Rocky Mount','NC',35.94,-77.79,4],
  ['279','Rocky Mount','NC',35.93,-77.80,3],['280','Charlotte','NC',35.23,-80.84,16],['281','Charlotte','NC',35.22,-80.85,12],
  ['282','Charlotte','NC',35.24,-80.83,10],['283','Fayetteville','NC',35.05,-78.88,6],['284','Wilmington','NC',34.23,-77.94,6],
  ['285','Kinston','NC',35.26,-77.58,3],['286','Hickory','NC',35.73,-81.34,4],['287','Asheville','NC',35.60,-82.55,6],
  ['288','Asheville','NC',35.59,-82.56,4],['289','Gastonia','NC',35.26,-81.19,5],
  ['290','Columbia','SC',34.00,-81.03,8],['291','Columbia','SC',33.99,-81.04,6],['292','Columbia','SC',34.01,-81.02,5],
  ['293','Greenville','SC',34.85,-82.40,10],['294','Charleston','SC',32.78,-79.93,10],['295','Florence','SC',34.20,-79.76,3],
  ['296','Greenville','SC',34.84,-82.41,6],['297','Charlotte','NC',35.21,-80.86,4],['298','Hilton Head','SC',32.22,-80.75,3],
  ['299','Savannah','GA',32.08,-81.09,6],
  ['300','Atlanta','GA',33.75,-84.39,20],['301','Atlanta','GA',33.74,-84.40,15],['302','Atlanta','GA',33.76,-84.38,12],
  ['303','Atlanta','GA',33.73,-84.41,18],['304','Swainsboro','GA',32.60,-82.33,2],['305','Athens','GA',33.96,-83.38,5],
  ['306','Athens','GA',33.97,-83.37,3],['307','Chattanooga','TN',35.05,-85.31,6],['308','Augusta','GA',33.47,-81.97,5],
  ['309','Augusta','GA',33.48,-81.96,4],['310','Macon','GA',32.84,-83.63,4],['311','Atlanta','GA',33.77,-84.37,10],
  ['312','Macon','GA',32.83,-83.64,3],['313','Savannah','GA',32.08,-81.10,5],['314','Savannah','GA',32.07,-81.11,4],
  ['315','Waycross','GA',31.21,-82.35,2],['316','Valdosta','GA',30.83,-83.28,3],['317','Albany','GA',31.58,-84.16,2],
  ['318','Columbus','GA',32.46,-84.99,4],['319','Columbus','GA',32.47,-84.98,3],
  ['320','Jacksonville','FL',30.33,-81.66,10],['321','Daytona Beach','FL',29.21,-81.02,5],['322','Jacksonville','FL',30.32,-81.65,8],
  ['323','Tallahassee','FL',30.44,-84.28,5],['324','Panama City','FL',30.16,-85.66,3],['325','Pensacola','FL',30.44,-87.19,5],
  ['326','Gainesville','FL',29.65,-82.32,5],['327','Orlando','FL',28.54,-81.38,14],['328','Orlando','FL',28.53,-81.39,12],
  ['329','Melbourne','FL',28.08,-80.61,5],['330','Miami','FL',25.76,-80.19,20],['331','Miami','FL',25.77,-80.18,15],
  ['332','Miami','FL',25.75,-80.20,14],['333','Fort Lauderdale','FL',26.12,-80.14,16],['334','W Palm Beach','FL',26.71,-80.05,10],
  ['335','Tampa','FL',27.95,-82.46,14],['336','Tampa','FL',27.94,-82.47,10],['337','St Petersburg','FL',27.77,-82.64,10],
  ['338','Lakeland','FL',28.04,-81.95,5],['339','Fort Myers','FL',26.64,-81.87,6],['340','Fort Myers','FL',26.63,-81.88,4],
  ['341','Fort Myers','FL',26.65,-81.86,3],['342','Sarasota','FL',27.34,-82.53,6],['344','Gainesville','FL',29.64,-82.33,3],
  ['346','Tampa','FL',27.96,-82.45,6],['347','Orlando','FL',28.55,-81.37,5],['349','West Palm','FL',26.72,-80.04,4],
  // South Central
  ['350','Birmingham','AL',33.52,-86.81,8],['351','Birmingham','AL',33.51,-86.82,6],['352','Tuscaloosa','AL',33.21,-87.57,4],
  ['354','Tuscaloosa','AL',33.22,-87.56,3],['355','Birmingham','AL',33.53,-86.80,4],['356','Huntsville','AL',34.73,-86.59,6],
  ['357','Huntsville','AL',34.74,-86.58,4],['358','Huntsville','AL',34.75,-86.57,3],['359','Gadsden','AL',34.01,-86.01,2],
  ['360','Montgomery','AL',32.38,-86.31,5],['361','Montgomery','AL',32.37,-86.32,3],['362','Anniston','AL',33.66,-85.83,2],
  ['363','Dothan','AL',31.22,-85.39,3],['364','Evergreen','AL',31.43,-86.95,1],['365','Mobile','AL',30.69,-88.04,5],
  ['366','Mobile','AL',30.70,-88.03,3],['367','Selma','AL',32.41,-87.02,2],['368','Selma','AL',32.42,-87.01,1],
  ['369','Meridian','MS',32.35,-88.70,2],['370','Nashville','TN',36.16,-86.78,12],['371','Nashville','TN',36.17,-86.77,8],
  ['372','Nashville','TN',36.15,-86.79,6],['373','Chattanooga','TN',35.05,-85.31,6],['374','Chattanooga','TN',35.06,-85.30,4],
  ['375','Memphis','TN',35.15,-90.05,8],['376','Johnson City','TN',36.31,-82.35,3],['377','Knoxville','TN',35.96,-83.92,7],
  ['378','Knoxville','TN',35.97,-83.91,5],['379','Knoxville','TN',35.98,-83.90,3],['380','Memphis','TN',35.14,-90.06,10],
  ['381','Memphis','TN',35.16,-90.04,6],['382','McKenzie','TN',36.13,-88.52,2],['383','Jackson','TN',35.61,-88.81,3],
  ['384','Columbia','TN',35.62,-87.04,2],['385','Cookeville','TN',36.16,-85.50,2],
  ['386','Jackson','MS',32.30,-90.18,5],['387','Greenville','MS',33.41,-91.06,2],['388','Tupelo','MS',34.26,-88.70,2],
  ['389','Grenada','MS',33.77,-89.81,1],['390','Jackson','MS',32.31,-90.17,4],['391','Jackson','MS',32.29,-90.19,3],
  ['392','Hattiesburg','MS',31.33,-89.29,3],['393','Meridian','MS',32.36,-88.69,2],['394','Laurel','MS',31.69,-89.13,2],
  ['395','Biloxi','MS',30.40,-88.88,4],['396','McComb','MS',31.24,-90.45,1],['397','Columbus','MS',33.50,-88.43,2],
  // Midwest
  ['400','Louisville','KY',38.25,-85.76,8],['401','Louisville','KY',38.26,-85.75,6],['402','Louisville','KY',38.24,-85.77,5],
  ['403','Lexington','KY',38.04,-84.50,6],['404','Lexington','KY',38.03,-84.51,4],['405','Lexington','KY',38.05,-84.49,3],
  ['406','Frankfort','KY',38.20,-84.87,3],['410','Cincinnati','OH',39.10,-84.51,10],['411','Covington','KY',39.08,-84.51,6],
  ['420','Paducah','KY',37.08,-88.60,2],['421','Bowling Green','KY',36.99,-86.44,3],['422','Danville','KY',37.65,-84.77,2],
  ['423','Pikeville','KY',37.48,-82.52,2],['424','Somerset','KY',37.09,-84.60,2],['425','London','KY',37.13,-84.08,2],
  ['426','Somerset','KY',37.10,-84.59,1],['427','Elizabethtown','KY',37.69,-85.86,2],
  ['430','Columbus','OH',39.96,-83.00,12],['431','Columbus','OH',39.97,-82.99,8],['432','Columbus','OH',39.95,-83.01,6],
  ['433','Marion','OH',40.59,-83.13,3],['434','Toledo','OH',41.66,-83.56,6],['435','Toledo','OH',41.67,-83.55,4],
  ['436','Toledo','OH',41.65,-83.57,3],['437','Zanesville','OH',39.94,-82.01,2],['438','Zanesville','OH',39.95,-82.00,2],
  ['439','Steubenville','OH',40.36,-80.63,3],['440','Cleveland','OH',41.50,-81.69,14],['441','Cleveland','OH',41.49,-81.70,10],
  ['442','Akron','OH',41.08,-81.52,8],['443','Akron','OH',41.09,-81.51,6],['444','Youngstown','OH',41.10,-80.65,5],
  ['445','Youngstown','OH',41.11,-80.64,3],['446','Canton','OH',40.80,-81.38,5],['447','Canton','OH',40.81,-81.37,3],
  ['448','Mansfield','OH',40.76,-82.52,3],['449','Mansfield','OH',40.77,-82.51,2],['450','Cincinnati','OH',39.10,-84.51,12],
  ['451','Cincinnati','OH',39.11,-84.50,8],['452','Cincinnati','OH',39.09,-84.52,6],['453','Dayton','OH',39.76,-84.19,8],
  ['454','Dayton','OH',39.77,-84.18,5],['455','Springfield','OH',39.92,-83.81,4],['456','Chillicothe','OH',39.33,-82.98,2],
  ['457','Athens','OH',39.33,-82.10,2],['458','Lima','OH',40.74,-84.11,3],['459','Cincinnati','OH',39.12,-84.49,4],
  ['460','Indianapolis','IN',39.77,-86.16,12],['461','Indianapolis','IN',39.78,-86.15,8],['462','Indianapolis','IN',39.76,-86.17,6],
  ['463','Gary','IN',41.59,-87.35,6],['464','Gary','IN',41.60,-87.34,4],['465','South Bend','IN',41.68,-86.25,5],
  ['466','South Bend','IN',41.69,-86.24,3],['467','Fort Wayne','IN',41.08,-85.14,6],['468','Fort Wayne','IN',41.09,-85.13,4],
  ['469','Kokomo','IN',40.49,-86.13,3],['470','Cincinnati','OH',39.10,-84.52,4],['471','Louisville','KY',38.25,-85.76,3],
  ['472','Columbus','IN',39.20,-85.92,3],['473','Muncie','IN',40.19,-85.39,3],['474','Bloomington','IN',39.17,-86.53,4],
  ['475','Terre Haute','IN',39.47,-87.41,3],['476','Evansville','IN',37.97,-87.56,4],['477','Evansville','IN',37.98,-87.55,3],
  ['478','Terre Haute','IN',39.48,-87.40,2],['479','Lafayette','IN',40.42,-86.87,4],
  ['480','Royal Oak','MI',42.49,-83.14,12],['481','Detroit','MI',42.33,-83.05,16],['482','Detroit','MI',42.34,-83.04,12],
  ['483','Royal Oak','MI',42.50,-83.13,8],['484','Flint','MI',43.01,-83.69,6],['485','Flint','MI',43.02,-83.68,4],
  ['486','Saginaw','MI',43.42,-83.95,4],['487','Saginaw','MI',43.43,-83.94,3],['488','Lansing','MI',42.73,-84.56,6],
  ['489','Lansing','MI',42.74,-84.55,4],['490','Kalamazoo','MI',42.29,-85.59,5],['491','Kalamazoo','MI',42.30,-85.58,3],
  ['492','Jackson','MI',42.25,-84.40,3],['493','Grand Rapids','MI',42.96,-85.66,8],['494','Grand Rapids','MI',42.97,-85.65,5],
  ['495','Grand Rapids','MI',42.98,-85.64,4],['496','Traverse City','MI',44.76,-85.62,3],['497','Gaylord','MI',45.03,-84.67,1],
  ['498','Iron Mountain','MI',45.82,-88.07,1],['499','Iron Mountain','MI',45.83,-88.06,1],
  ['500','Des Moines','IA',41.59,-93.62,6],['501','Des Moines','IA',41.60,-93.61,4],['502','Des Moines','IA',41.58,-93.63,3],
  ['503','Des Moines','IA',41.61,-93.60,2],['504','Mason City','IA',43.15,-93.20,2],['505','Fort Dodge','IA',42.50,-94.17,2],
  ['506','Waterloo','IA',42.49,-92.34,3],['507','Waterloo','IA',42.50,-92.33,2],['508','Creston','IA',41.06,-94.36,1],
  ['509','Des Moines','IA',41.57,-93.64,2],['510','Sioux City','IA',42.50,-96.40,3],['511','Sioux City','IA',42.51,-96.39,2],
  ['512','Sheldon','IA',43.18,-95.86,1],['513','Spencer','IA',43.14,-95.14,1],['514','Carroll','IA',42.07,-94.87,1],
  ['515','Omaha','NE',41.26,-95.94,5],['516','Omaha','NE',41.27,-95.93,3],['520','Dubuque','IA',42.50,-90.66,3],
  ['521','Decorah','IA',43.30,-91.79,1],['522','Cedar Rapids','IA',42.03,-91.64,5],['523','Cedar Rapids','IA',42.04,-91.63,3],
  ['524','Cedar Rapids','IA',42.02,-91.65,2],['525','Ottumwa','IA',41.02,-92.41,2],['526','Burlington','IA',40.81,-91.11,2],
  ['527','Rock Island','IL',41.51,-90.58,4],['528','Davenport','IA',41.52,-90.58,5],
  ['530','Milwaukee','WI',43.04,-87.91,10],['531','Milwaukee','WI',43.03,-87.92,8],['532','Milwaukee','WI',43.05,-87.90,6],
  ['534','Racine','WI',42.73,-87.78,5],['535','Madison','WI',43.07,-89.40,6],['537','Madison','WI',43.08,-89.39,4],
  ['538','Madison','WI',43.06,-89.41,3],['539','Portage','WI',43.54,-89.46,2],['540','St Paul','MN',44.94,-93.09,4],
  ['541','Green Bay','WI',44.51,-88.02,5],['542','Green Bay','WI',44.52,-88.01,3],['543','Green Bay','WI',44.50,-88.03,2],
  ['544','Wausau','WI',44.96,-89.63,2],['545','Rhinelander','WI',45.64,-89.41,1],['546','La Crosse','WI',43.80,-91.24,3],
  ['547','Eau Claire','WI',44.81,-91.50,3],['548','Spooner','WI',45.82,-91.89,1],['549','Oshkosh','WI',44.02,-88.54,3],
  ['550','St Paul','MN',44.95,-93.09,10],['551','St Paul','MN',44.96,-93.10,8],['553','Minneapolis','MN',44.98,-93.27,14],
  ['554','Minneapolis','MN',44.97,-93.26,10],['555','Minneapolis','MN',44.99,-93.28,6],['556','Duluth','MN',46.79,-92.10,3],
  ['557','Duluth','MN',46.80,-92.09,2],['558','Duluth','MN',46.78,-92.11,2],['559','Rochester','MN',44.02,-92.47,4],
  ['560','Mankato','MN',44.16,-94.00,2],['561','Mankato','MN',44.17,-93.99,2],['562','Willmar','MN',45.12,-95.04,1],
  ['563','St Cloud','MN',45.56,-94.16,3],['564','Brainerd','MN',46.36,-94.20,2],['565','Detroit Lakes','MN',46.82,-95.84,1],
  ['566','Bemidji','MN',47.47,-94.88,1],['567','Thief River','MN',48.12,-96.18,1],
  ['570','Sioux Falls','SD',43.55,-96.70,4],['571','Sioux Falls','SD',43.56,-96.69,3],['572','Watertown','SD',44.89,-97.12,1],
  ['573','Mitchell','SD',43.71,-98.03,1],['574','Aberdeen','SD',45.46,-98.49,1],['575','Pierre','SD',44.37,-100.35,1],
  ['576','Mobridge','SD',45.54,-100.43,1],['577','Rapid City','SD',44.08,-103.23,2],
  ['580','Fargo','ND',46.88,-96.79,3],['581','Fargo','ND',46.87,-96.80,2],['582','Grand Forks','ND',47.93,-97.03,2],
  ['583','Devils Lake','ND',48.11,-98.86,1],['584','Jamestown','ND',46.91,-98.71,1],['585','Bismarck','ND',46.81,-100.78,2],
  ['586','Dickinson','ND',46.88,-102.79,1],['587','Minot','ND',48.23,-101.29,1],['588','Williston','ND',48.15,-103.62,1],
  ['590','Billings','MT',45.78,-108.50,2],['591','Billings','MT',45.79,-108.49,2],['592','Wolf Point','MT',48.09,-105.64,1],
  ['593','Miles City','MT',46.41,-105.84,1],['594','Great Falls','MT',47.50,-111.30,2],['595','Havre','MT',48.55,-109.68,1],
  ['596','Helena','MT',46.59,-112.04,2],['597','Butte','MT',46.00,-112.53,2],['598','Missoula','MT',46.87,-114.00,3],
  ['599','Kalispell','MT',48.19,-114.32,2],
  // Chicago / Illinois
  ['600','Palatine','IL',42.11,-88.03,14],['601','Carol Stream','IL',41.91,-88.13,12],['602','Evanston','IL',42.04,-87.68,10],
  ['603','Oak Park','IL',41.89,-87.79,12],['604','S Suburbs','IL',41.52,-87.70,10],['605','SW Suburbs','IL',41.64,-87.73,10],
  ['606','Chicago','IL',41.88,-87.63,22],['607','Chicago','IL',41.87,-87.64,16],['608','Chicago','IL',41.86,-87.65,12],
  ['609','Kankakee','IL',41.12,-87.86,3],['610','Rockford','IL',42.27,-89.09,5],['611','Rockford','IL',42.28,-89.08,3],
  ['612','Rock Island','IL',41.51,-90.58,4],['613','La Salle','IL',41.34,-89.09,2],['614','Galesburg','IL',40.95,-90.37,2],
  ['615','Peoria','IL',40.69,-89.59,5],['616','Peoria','IL',40.70,-89.58,3],['617','Bloomington','IL',40.48,-88.99,4],
  ['618','Champaign','IL',40.12,-88.24,4],['619','Champaign','IL',40.11,-88.25,3],['620','E St Louis','IL',38.62,-90.15,6],
  ['622','E St Louis','IL',38.63,-90.14,4],['623','Quincy','IL',39.93,-91.38,2],['624','Effingham','IL',39.12,-88.54,2],
  ['625','Springfield','IL',39.80,-89.65,5],['626','Springfield','IL',39.81,-89.64,3],['627','Springfield','IL',39.79,-89.66,2],
  ['628','Centralia','IL',38.53,-89.13,2],['629','Carbondale','IL',37.73,-89.22,3],
  // Texas
  ['700','New Orleans','LA',29.95,-90.07,10],['701','New Orleans','LA',29.96,-90.06,8],['703','Thibodaux','LA',29.80,-90.82,3],
  ['704','Hammond','LA',30.50,-90.46,3],['706','Lake Charles','LA',30.23,-93.22,3],['707','Baton Rouge','LA',30.45,-91.19,6],
  ['708','Baton Rouge','LA',30.46,-91.18,4],['710','Shreveport','LA',32.51,-93.75,4],['711','Shreveport','LA',32.52,-93.74,3],
  ['712','Monroe','LA',32.51,-92.12,3],['713','Alexandria','LA',31.31,-92.45,2],['714','Alexandria','LA',31.32,-92.44,2],
  ['716','Pine Bluff','AR',34.23,-92.00,2],['717','Camden','AR',33.58,-92.83,1],['718','Texarkana','AR',33.44,-94.05,2],
  ['719','Hot Springs','AR',34.50,-93.06,2],['720','Little Rock','AR',34.75,-92.29,5],['721','Little Rock','AR',34.74,-92.30,4],
  ['722','Little Rock','AR',34.76,-92.28,3],['723','Memphis','TN',35.13,-90.07,3],['724','Jonesboro','AR',35.84,-90.70,2],
  ['725','Batesville','AR',35.77,-91.64,1],['726','Harrison','AR',36.23,-93.11,1],['727','Fayetteville','AR',36.06,-94.16,3],
  ['728','Russellville','AR',35.28,-93.13,2],['729','Fort Smith','AR',35.39,-94.40,3],
  ['730','Oklahoma City','OK',35.47,-97.52,6],['731','Oklahoma City','OK',35.48,-97.51,4],['733','Austin TX','TX',30.27,-97.74,2],
  ['734','Ardmore','OK',34.17,-97.14,2],['735','Lawton','OK',34.60,-98.39,2],['736','Clinton','OK',35.52,-99.00,1],
  ['737','Enid','OK',36.40,-97.88,2],['738','Woodward','OK',36.43,-99.39,1],['739','Guymon','OK',36.69,-101.48,1],
  ['740','Tulsa','OK',36.15,-95.99,6],['741','Tulsa','OK',36.16,-95.98,4],['743','Tulsa','OK',36.14,-96.00,3],
  ['744','Muskogee','OK',35.75,-95.37,2],['745','McAlester','OK',34.93,-95.77,2],['746','Ponca City','OK',36.71,-97.09,2],
  ['747','Durant','OK',34.00,-96.39,1],['748','Shawnee','OK',35.33,-96.93,2],['749','Poteau','OK',35.05,-94.62,1],
  ['750','Dallas','TX',32.78,-96.80,16],['751','Dallas','TX',32.79,-96.79,10],['752','Dallas','TX',32.77,-96.81,8],
  ['753','Dallas','TX',32.80,-96.78,6],['754','Greenville','TX',33.14,-96.11,2],['755','Texarkana','TX',33.43,-94.05,2],
  ['756','Longview','TX',32.50,-94.74,3],['757','Tyler','TX',32.35,-95.30,3],['758','Palestine','TX',31.76,-95.63,1],
  ['759','Lufkin','TX',31.34,-94.73,2],['760','Fort Worth','TX',32.75,-97.33,12],['761','Fort Worth','TX',32.76,-97.32,8],
  ['762','Denton','TX',33.21,-97.13,5],['763','Wichita Falls','TX',33.91,-98.49,2],['764','Stephenville','TX',32.22,-98.20,1],
  ['765','Waco','TX',31.55,-97.15,4],['766','Waco','TX',31.56,-97.14,3],['767','Waco','TX',31.54,-97.16,2],
  ['768','Abilene','TX',32.45,-99.73,2],['769','San Angelo','TX',31.46,-100.44,2],
  ['770','Houston','TX',29.76,-95.37,18],['771','Houston','TX',29.77,-95.36,14],['772','Houston','TX',29.75,-95.38,10],
  ['773','Conroe','TX',30.31,-95.46,5],['774','Richmond','TX',29.58,-95.76,4],['775','Galveston','TX',29.30,-94.80,4],
  ['776','Beaumont','TX',30.09,-94.10,4],['777','Beaumont','TX',30.10,-94.09,3],['778','Bryan','TX',30.67,-96.37,3],
  ['779','Victoria','TX',28.81,-96.99,2],['780','San Antonio','TX',29.42,-98.49,10],['781','San Antonio','TX',29.43,-98.48,8],
  ['782','San Antonio','TX',29.44,-98.47,6],['783','Corpus Christi','TX',27.80,-97.40,4],['784','Corpus Christi','TX',27.81,-97.39,3],
  ['785','McAllen','TX',26.20,-98.23,4],['786','Austin','TX',30.27,-97.74,10],['787','Austin','TX',30.28,-97.73,8],
  ['788','San Marcos','TX',29.88,-97.94,3],['789','Giddings','TX',30.18,-96.94,1],['790','Amarillo','TX',35.22,-101.83,2],
  ['791','Amarillo','TX',35.23,-101.82,2],['792','Childress','TX',34.43,-100.20,1],['793','Lubbock','TX',33.58,-101.85,3],
  ['794','Lubbock','TX',33.57,-101.86,2],['795','Abilene','TX',32.45,-99.74,2],['796','Abilene','TX',32.44,-99.75,1],
  ['797','Midland','TX',31.99,-102.08,2],['798','El Paso','TX',31.76,-106.49,5],['799','El Paso','TX',31.77,-106.48,4],
  // West
  ['800','Denver','CO',39.74,-104.99,10],['801','Denver','CO',39.73,-105.00,8],['802','Denver','CO',39.75,-104.98,6],
  ['803','Boulder','CO',40.01,-105.27,5],['804','Denver','CO',39.76,-104.97,4],['805','Longmont','CO',40.17,-105.10,3],
  ['806','Denver','CO',39.72,-105.01,3],['807','Denver','CO',39.71,-105.02,2],['808','Colorado Springs','CO',38.83,-104.82,5],
  ['809','Colorado Springs','CO',38.84,-104.81,3],['810','Colorado Springs','CO',38.82,-104.83,2],['811','Alamosa','CO',37.47,-105.87,1],
  ['812','Salida','CO',38.53,-106.00,1],['813','Durango','CO',37.28,-107.88,1],['814','Grand Junction','CO',39.06,-108.55,2],
  ['815','Grand Junction','CO',39.07,-108.54,1],['816','Glenwood Springs','CO',39.55,-107.32,1],
  ['820','Cheyenne','WY',41.14,-104.82,2],['821','Yellowstone','WY',44.43,-110.59,1],['822','Wheatland','WY',42.05,-104.95,1],
  ['823','Rawlins','WY',41.79,-107.24,1],['824','Worland','WY',44.02,-107.95,1],['825','Riverton','WY',42.86,-108.38,1],
  ['826','Casper','WY',42.87,-106.31,2],['827','Gillette','WY',44.29,-105.50,1],['828','Sheridan','WY',44.80,-106.96,1],['829','Rock Springs','WY',41.59,-109.22,1],
  ['830','Salt Lake','UT',40.76,-111.89,8],['831','Salt Lake','UT',40.77,-111.88,5],['832','Pocatello','ID',42.87,-112.44,2],
  ['833','Twin Falls','ID',42.56,-114.47,2],['834','Idaho Falls','ID',43.47,-112.03,2],['835','Lewiston','ID',46.42,-117.02,2],
  ['836','Boise','ID',43.62,-116.21,4],['837','Boise','ID',43.63,-116.20,3],['838','Spokane','WA',47.66,-117.43,4],
  ['840','Salt Lake','UT',40.75,-111.90,6],['841','Salt Lake','UT',40.74,-111.91,4],['842','Ogden','UT',41.22,-111.97,3],
  ['843','Ogden','UT',41.23,-111.96,2],['844','Ogden','UT',41.21,-111.98,2],['845','Provo','UT',40.23,-111.66,4],
  ['846','Provo','UT',40.24,-111.65,3],['847','Provo','UT',40.22,-111.67,2],
  ['850','Phoenix','AZ',33.45,-112.07,12],['852','Phoenix','AZ',33.44,-112.08,10],['853','Phoenix','AZ',33.43,-112.09,8],
  ['855','Globe','AZ',33.39,-110.79,1],['856','Tucson','AZ',32.22,-110.93,5],['857','Tucson','AZ',32.23,-110.92,3],
  ['859','Show Low','AZ',34.25,-110.03,1],['860','Phoenix','AZ',33.46,-112.06,5],['863','Prescott','AZ',34.54,-112.47,2],
  ['864','Kingman','AZ',35.19,-114.05,1],['865','Flagstaff','AZ',35.20,-111.65,2],
  ['870','Albuquerque','NM',35.08,-106.65,5],['871','Albuquerque','NM',35.09,-106.64,3],['872','Albuquerque','NM',35.07,-106.66,2],
  ['873','Gallup','NM',35.53,-108.74,1],['874','Farmington','NM',36.73,-108.22,1],['875','Santa Fe','NM',35.69,-105.94,3],
  ['877','Las Vegas','NM',35.60,-105.22,1],['878','Socorro','NM',34.06,-106.89,1],['879','Truth or Cons','NM',33.13,-107.25,1],
  ['880','Las Cruces','NM',32.35,-106.76,3],['881','Clovis','NM',34.40,-103.20,1],['882','Roswell','NM',33.39,-104.52,2],
  ['883','Carrizozo','NM',33.64,-105.88,1],['884','Tucumcari','NM',35.17,-103.73,1],
  ['889','Las Vegas','NV',36.17,-115.14,10],['890','Las Vegas','NV',36.16,-115.15,8],['891','Las Vegas','NV',36.18,-115.13,5],
  ['893','Ely','NV',39.25,-114.89,1],['894','Reno','NV',39.53,-119.81,4],['895','Reno','NV',39.54,-119.80,3],
  ['897','Carson City','NV',39.16,-119.77,2],['898','Elko','NV',40.83,-115.76,1],
  // Pacific
  ['900','Los Angeles','CA',34.05,-118.24,22],['901','Los Angeles','CA',34.04,-118.25,18],['902','Inglewood','CA',33.96,-118.35,14],
  ['903','Inglewood','CA',33.95,-118.36,10],['904','Santa Monica','CA',34.02,-118.49,12],['905','Torrance','CA',33.84,-118.34,10],
  ['906','Whittier','CA',33.98,-118.03,8],['907','Long Beach','CA',33.77,-118.19,12],['908','Long Beach','CA',33.78,-118.18,8],
  ['910','Pasadena','CA',34.15,-118.14,8],['911','Pasadena','CA',34.14,-118.15,6],['912','Glendale','CA',34.14,-118.26,8],
  ['913','Van Nuys','CA',34.19,-118.45,10],['914','Van Nuys','CA',34.18,-118.46,8],['915','Burbank','CA',34.18,-118.31,6],
  ['916','N Hollywood','CA',34.17,-118.38,6],['917','Alhambra','CA',34.10,-118.13,6],['918','Alhambra','CA',34.09,-118.14,5],
  ['919','San Gabriel','CA',34.10,-118.10,5],['920','San Diego','CA',32.72,-117.16,12],['921','San Diego','CA',32.71,-117.17,10],
  ['922','Escondido','CA',33.12,-117.09,5],['923','San Bernardino','CA',34.11,-117.29,6],['924','San Bernardino','CA',34.10,-117.30,5],
  ['925','Riverside','CA',33.95,-117.40,8],['926','Santa Ana','CA',33.75,-117.87,10],['927','Santa Ana','CA',33.74,-117.88,8],
  ['928','Anaheim','CA',33.84,-117.91,10],['930','Ventura','CA',34.28,-119.29,4],['931','Santa Barbara','CA',34.42,-119.70,4],
  ['932','Bakersfield','CA',35.37,-119.02,5],['933','Bakersfield','CA',35.38,-119.01,3],['934','Santa Barbara','CA',34.41,-119.71,3],
  ['935','Mojave','CA',35.05,-118.17,1],['936','Fresno','CA',36.74,-119.77,6],['937','Fresno','CA',36.75,-119.76,4],
  ['938','Fresno','CA',36.73,-119.78,3],['939','Salinas','CA',36.67,-121.66,3],['940','San Francisco','CA',37.77,-122.42,14],
  ['941','San Francisco','CA',37.78,-122.41,12],['942','Sacramento','CA',38.58,-121.49,3],['943','Palo Alto','CA',37.44,-122.14,8],
  ['944','San Mateo','CA',37.56,-122.32,8],['945','Oakland','CA',37.80,-122.27,10],['946','Oakland','CA',37.81,-122.26,8],
  ['947','Berkeley','CA',37.87,-122.27,6],['948','Richmond','CA',37.94,-122.35,5],['949','San Rafael','CA',37.97,-122.53,4],
  ['950','San Jose','CA',37.34,-121.89,12],['951','San Jose','CA',37.33,-121.90,8],['952','Stockton','CA',37.95,-121.29,5],
  ['953','Stockton','CA',37.96,-121.28,3],['954','Santa Rosa','CA',38.44,-122.71,4],['955','Eureka','CA',40.80,-124.16,2],
  ['956','Sacramento','CA',38.58,-121.49,8],['957','Sacramento','CA',38.59,-121.48,5],['958','Sacramento','CA',38.57,-121.50,4],
  ['959','Marysville','CA',39.15,-121.59,2],['960','Redding','CA',40.59,-122.39,2],['961','Reno','NV',39.53,-119.81,2],
  // Pacific NW / Hawaii / Alaska
  ['970','Portland','OR',45.52,-122.68,8],['971','Portland','OR',45.53,-122.67,6],['972','Portland','OR',45.51,-122.69,5],
  ['973','Salem','OR',44.94,-123.03,4],['974','Eugene','OR',44.05,-123.09,4],['975','Medford','OR',42.33,-122.87,3],
  ['976','Klamath Falls','OR',42.19,-121.74,1],['977','Bend','OR',44.06,-121.31,2],['978','Pendleton','OR',45.67,-118.79,1],
  ['979','Boise','ID',43.61,-116.22,2],
  ['980','Seattle','WA',47.61,-122.33,12],['981','Seattle','WA',47.62,-122.32,10],['982','Everett','WA',47.98,-122.20,5],
  ['983','Tacoma','WA',47.25,-122.44,6],['984','Tacoma','WA',47.26,-122.43,4],['985','Olympia','WA',47.04,-122.90,3],
  ['986','Portland','OR',45.52,-122.67,3],['988','Wenatchee','WA',47.42,-120.31,1],['989','Yakima','WA',46.60,-120.51,2],
  ['990','Spokane','WA',47.66,-117.43,4],['991','Spokane','WA',47.67,-117.42,3],['992','Spokane','WA',47.65,-117.44,2],
  ['993','Pasco','WA',46.24,-119.10,2],['994','Lewiston','ID',46.42,-117.01,1],
  ['967','Honolulu','HI',21.31,-157.86,6],['968','Honolulu','HI',21.30,-157.87,4],
  ['995','Anchorage','AK',61.22,-149.90,3],['996','Anchorage','AK',61.21,-149.91,2],['997','Fairbanks','AK',64.84,-147.72,1],['998','Juneau','AK',58.30,-134.42,1],['999','Ketchikan','AK',55.34,-131.64,1]
];

// ── Business Archetype Definitions ──
var NETOPT_ARCHETYPES = {
  dtc_national: {
    name: 'DTC E-Commerce — National',
    desc: 'Population-weighted, national',
    modeMix: { tl: 5, ltl: 10, parcel: 85 },
    topRegion: 'Northeast 28%',
    zipCount: 200,
    regionWeights: { ne: 1.3, se: 1.0, mw: 0.9, sw: 0.8, w: 1.1 },
    popExponent: 1.1, maxDays: 3
  },
  dtc_east: {
    name: 'DTC E-Commerce — East Coast Heavy',
    desc: 'Concentrated East Coast / BosWash corridor',
    modeMix: { tl: 5, ltl: 8, parcel: 87 },
    topRegion: 'Northeast 45%',
    zipCount: 180,
    regionWeights: { ne: 2.2, se: 1.2, mw: 0.5, sw: 0.3, w: 0.4 },
    popExponent: 1.2, maxDays: 2
  },
  dtc_west: {
    name: 'DTC E-Commerce — West Coast Heavy',
    desc: 'Concentrated West Coast / CA+WA+OR',
    modeMix: { tl: 5, ltl: 8, parcel: 87 },
    topRegion: 'West 48%',
    zipCount: 180,
    regionWeights: { ne: 0.5, se: 0.4, mw: 0.3, sw: 0.6, w: 2.5 },
    popExponent: 1.2, maxDays: 2
  },
  cpg_bigbox: {
    name: 'CPG → Big Box Retail',
    desc: 'Walmart/Target/Costco store distribution',
    modeMix: { tl: 60, ltl: 30, parcel: 10 },
    topRegion: 'South 30%',
    zipCount: 120,
    regionWeights: { ne: 0.9, se: 1.2, mw: 1.1, sw: 1.0, w: 0.8 },
    popExponent: 0.7, maxDays: 5
  },
  cpg_grocery: {
    name: 'CPG → Grocery Chains',
    desc: 'Kroger/Publix/Albertsons DC distribution',
    modeMix: { tl: 55, ltl: 35, parcel: 10 },
    topRegion: 'Midwest 25%',
    zipCount: 100,
    regionWeights: { ne: 1.0, se: 1.1, mw: 1.2, sw: 0.8, w: 0.9 },
    popExponent: 0.6, maxDays: 5
  },
  industrial: {
    name: 'Industrial / MRO Distribution',
    desc: 'Manufacturing belt heavy, B2B',
    modeMix: { tl: 30, ltl: 50, parcel: 20 },
    topRegion: 'Midwest 35%',
    zipCount: 150,
    regionWeights: { ne: 0.8, se: 0.7, mw: 1.8, sw: 0.6, w: 0.5 },
    popExponent: 0.5, maxDays: 5
  },
  food_bev: {
    name: 'Food & Beverage',
    desc: 'Population-weighted, cold chain',
    modeMix: { tl: 45, ltl: 40, parcel: 15 },
    topRegion: 'Northeast 28%',
    zipCount: 160,
    regionWeights: { ne: 1.2, se: 1.1, mw: 1.0, sw: 0.8, w: 1.0 },
    popExponent: 1.0, maxDays: 2
  },
  healthcare: {
    name: 'Healthcare / Pharma',
    desc: 'Hospital & pharmacy distribution',
    modeMix: { tl: 15, ltl: 25, parcel: 60 },
    topRegion: 'Northeast 30%',
    zipCount: 180,
    regionWeights: { ne: 1.4, se: 1.0, mw: 0.9, sw: 0.7, w: 1.0 },
    popExponent: 1.1, maxDays: 1
  },
  auto_parts: {
    name: 'Auto Parts / Aftermarket',
    desc: 'Broad distribution, vehicle-density weighted',
    modeMix: { tl: 35, ltl: 40, parcel: 25 },
    topRegion: 'South 28%',
    zipCount: 170,
    regionWeights: { ne: 0.9, se: 1.2, mw: 1.1, sw: 1.0, w: 0.9 },
    popExponent: 0.8, maxDays: 3
  },
  bto_tech: {
    name: 'Build-to-Order / Tech',
    desc: 'Tech hubs + metro areas, high parcel mix',
    modeMix: { tl: 10, ltl: 15, parcel: 75 },
    topRegion: 'West 35%',
    zipCount: 160,
    regionWeights: { ne: 1.1, se: 0.7, mw: 0.6, sw: 0.8, w: 1.6 },
    popExponent: 1.3, maxDays: 3
  }
};

// Determine region from state abbreviation
function netoptGetRegion(state) {
  var ne = ['CT','DE','DC','MA','MD','ME','NH','NJ','NY','PA','RI','VT','VA','WV'];
  var se = ['AL','FL','GA','KY','LA','MS','NC','SC','TN','AR'];
  var mw = ['IA','IL','IN','KS','MI','MN','MO','ND','NE','OH','OK','SD','WI'];
  var sw = ['AZ','NM','TX'];
  var w = ['AK','CA','CO','HI','ID','MT','NV','OR','UT','WA','WY'];
  if (ne.indexOf(state) >= 0) return 'ne';
  if (se.indexOf(state) >= 0) return 'se';
  if (mw.indexOf(state) >= 0) return 'mw';
  if (sw.indexOf(state) >= 0) return 'sw';
  if (w.indexOf(state) >= 0) return 'w';
  return 'mw'; // default
}

// Update archetype preview card
function netoptUpdateArchetypePreview() {
  var arch = NETOPT_ARCHETYPES[document.getElementById('netopt-demo-archetype').value];
  if (!arch) return;
  var distDesc = document.getElementById('netopt-demo-dist-desc');
  var modeDesc = document.getElementById('netopt-demo-mode-desc');
  var zipCount = document.getElementById('netopt-demo-zip-count');
  var topRegion = document.getElementById('netopt-demo-top-region');
  if (distDesc) distDesc.textContent = arch.desc;
  if (modeDesc) modeDesc.textContent = arch.modeMix.tl + '% / ' + arch.modeMix.ltl + '% / ' + arch.modeMix.parcel + '%';
  if (zipCount) zipCount.textContent = '~' + arch.zipCount + ' demand points';
  if (topRegion) topRegion.textContent = arch.topRegion;
}

// Generate demo demand data
function netoptGenerateDemoDemand() {
  var archetypeKey = document.getElementById('netopt-demo-archetype').value;
  var totalVolume = parseFloat(document.getElementById('netopt-demo-volume').value) || 5000000;
  var sla = parseFloat(document.getElementById('netopt-demo-sla').value) || 500;
  var arch = NETOPT_ARCHETYPES[archetypeKey];
  if (!arch) return;

  var status = document.getElementById('netopt-demo-status');
  if (status) status.textContent = 'Generating...';

  // Step 1: Calculate weighted scores for each ZIP3
  var scored = [];
  NETOPT_ZIP3_DB.forEach(function(z) {
    var zip3 = z[0], city = z[1], state = z[2], lat = z[3], lng = z[4], popIdx = z[5];
    var region = netoptGetRegion(state);
    var regionWeight = arch.regionWeights[region] || 1.0;
    var score = Math.pow(popIdx, arch.popExponent) * regionWeight;
    // Add small random noise (±15%) for realism
    score *= (0.85 + Math.random() * 0.30);
    if (score > 0.5) { // min threshold
      scored.push({ zip3: zip3, city: city, state: state, lat: lat, lng: lng, score: score });
    }
  });

  // Step 2: Sort by score, take top N
  scored.sort(function(a, b) { return b.score - a.score; });
  var maxPoints = Math.min(arch.zipCount, scored.length);
  var selected = scored.slice(0, maxPoints);

  // Step 3: Normalize scores and distribute volume
  var totalScore = selected.reduce(function(s, z) { return s + z.score; }, 0);
  var demandPoints = [];
  selected.forEach(function(z, i) {
    var pct = z.score / totalScore;
    var volume = Math.round(totalVolume * pct / 1000); // Convert to K units
    if (volume < 1) volume = 1;
    demandPoints.push({
      id: 'dem-' + Date.now() + '-' + i,
      city: z.city + ', ' + z.state,
      state: z.state,
      volume: volume,
      maxMiles: sla,
      maxDays: arch.maxDays || 3,
      lat: z.lat,
      lng: z.lng,
      zip3: z.zip3
    });
  });

  // Step 4: Apply to netoptState
  netoptState.demands = demandPoints;
  netoptRenderDemandsTable();
  netoptUpdateKPI();

  // Step 5: Set mode mix from archetype
  document.getElementById('netopt-mode-tl-pct').value = arch.modeMix.tl;
  document.getElementById('netopt-mode-ltl-pct').value = arch.modeMix.ltl;
  document.getElementById('netopt-mode-parcel-pct').value = arch.modeMix.parcel;
  netoptBalanceModeMix('tl');

  if (status) {
    status.textContent = 'Generated ' + demandPoints.length + ' demand points (' + fmtNum(totalVolume / 1000000, 1) + 'M units). Mode mix set to ' + arch.modeMix.tl + '/' + arch.modeMix.ltl + '/' + arch.modeMix.parcel + ' (TL/LTL/Parcel).';
    status.style.color = 'var(--ies-green)';
  }

  // Auto-switch to Demand tab after 1.5s
  setTimeout(function() { netoptSwitchTab('demand'); }, 1500);
}

// Pre-defined facility candidates (10 major US warehouse cities)
var NETOPT_FACILITY_CANDIDATES = [
  {name: 'Atlanta', city: 'Atlanta, GA', capacity: 800, fixedCost: 3.2, varCost: 0.25},
  {name: 'Chicago', city: 'Chicago, IL', capacity: 750, fixedCost: 3.0, varCost: 0.24},
  {name: 'Dallas', city: 'Dallas, TX', capacity: 650, fixedCost: 2.8, varCost: 0.23},
  {name: 'Los Angeles', city: 'Los Angeles, CA', capacity: 700, fixedCost: 3.1, varCost: 0.26},
  {name: 'Memphis', city: 'Memphis, TN', capacity: 600, fixedCost: 2.5, varCost: 0.22},
  {name: 'Columbus', city: 'Columbus, OH', capacity: 550, fixedCost: 2.4, varCost: 0.21},
  {name: 'Indianapolis', city: 'Indianapolis, IN', capacity: 550, fixedCost: 2.3, varCost: 0.20},
  {name: 'Allentown', city: 'Allentown, PA', capacity: 600, fixedCost: 2.7, varCost: 0.25},
  {name: 'Savannah', city: 'Savannah, GA', capacity: 500, fixedCost: 2.2, varCost: 0.21},
  {name: 'Reno', city: 'Reno, NV', capacity: 400, fixedCost: 1.8, varCost: 0.24}
];

// Pre-defined major demand points (15 cities)
var NETOPT_DEMAND_POINTS = [
  {city: 'New York, NY', volume: 320},
  {city: 'Los Angeles, CA', volume: 280},
  {city: 'Chicago, IL', volume: 210},
  {city: 'Houston, TX', volume: 180},
  {city: 'Phoenix, AZ', volume: 150},
  {city: 'Philadelphia, PA', volume: 140},
  {city: 'San Antonio, TX', volume: 130},
  {city: 'San Diego, CA', volume: 120},
  {city: 'Dallas, TX', volume: 150},
  {city: 'San Jose, CA', volume: 110},
  {city: 'Austin, TX', volume: 95},
  {city: 'Jacksonville, FL', volume: 100},
  {city: 'Fort Worth, TX', volume: 90},
  {city: 'Columbus, OH', volume: 85},
  {city: 'Charlotte, NC', volume: 95}
];

// Initialize Network Optimization tool
function netoptInit() {
  netoptState.facilities = [];
  netoptState.demands = [];
  netoptUpdateKPI();
}

// Load quick-start template
function netoptLoadTemplate(templateName) {
  netoptState.facilities = [];
  netoptState.demands = [];

  if (templateName === 'us-2dc') {
    // Atlanta, Chicago
    netoptState.facilities = [
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Atlanta'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Chicago')
    ].map((f, i) => ({...f, id: 'fac-' + i, status: 'Candidate', lat: null, lng: null}));
    netoptState.demands = NETOPT_DEMAND_POINTS.slice(0, 8).map((d, i) => ({...d, id: 'dem-' + i, state: '', maxMiles: 500, lat: null, lng: null}));
  } else if (templateName === 'us-3dc') {
    // Atlanta, Chicago, LA
    netoptState.facilities = [
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Atlanta'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Chicago'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Los Angeles')
    ].map((f, i) => ({...f, id: 'fac-' + i, status: 'Candidate', lat: null, lng: null}));
    netoptState.demands = NETOPT_DEMAND_POINTS.slice(0, 10).map((d, i) => ({...d, id: 'dem-' + i, state: '', maxMiles: 500, lat: null, lng: null}));
  } else if (templateName === 'us-4dc') {
    // Atlanta, Chicago, LA, Dallas
    netoptState.facilities = [
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Atlanta'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Chicago'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Los Angeles'),
      NETOPT_FACILITY_CANDIDATES.find(f => f.name === 'Dallas')
    ].map((f, i) => ({...f, id: 'fac-' + i, status: 'Candidate', lat: null, lng: null}));
    netoptState.demands = NETOPT_DEMAND_POINTS.map((d, i) => ({...d, id: 'dem-' + i, state: '', maxMiles: 500, lat: null, lng: null}));
  } else if (templateName === 'custom') {
    netoptState.facilities = [];
    netoptState.demands = [];
  }

  // Geocode coordinates
  netoptState.facilities.forEach(f => {
    var g = geocodeCity(f.city);
    if (g) { f.lat = g.lat; f.lng = g.lng; }
  });
  netoptState.demands.forEach(d => {
    var parts = d.city.split(', ');
    if (parts.length === 2) { d.state = parts[1]; }
    var g = geocodeCity(d.city);
    if (g) { d.lat = g.lat; d.lng = g.lng; }
  });

  netoptRenderTables();
  netoptUpdateKPI();
  netoptSwitchTab('facilities');
}

// Switch tab
function netoptSwitchTab(tabName) {
  netoptState.activeTab = tabName;

  // Hide all tabs
  document.querySelectorAll('.netopt-tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('#netopt-tabs .wsc-tab').forEach(el => el.classList.remove('active'));

  // Show active tab
  var tabEl = document.getElementById('netopt-tab-' + tabName);
  if (tabEl) tabEl.style.display = 'block';

  // Mark tab button as active
  var btns = document.querySelectorAll('#netopt-tabs .wsc-tab');
  var btnNames = ['setup', 'facilities', 'demand', 'transportation', 'constraints', 'results'];
  btns.forEach((btn, i) => {
    if (btnNames[i] === tabName) btn.classList.add('active');
  });

  // Initialize map on first results view
  if (tabName === 'results' && !netoptState.mapInitialized && netoptState.results) {
    setTimeout(() => netoptInitializeMap(), 100);
  }

  // Auto-fetch freight rates on first Transportation tab visit
  if (tabName === 'transportation' && !netoptMarketRates.lastUpdated) {
    netoptFetchFreightRates();
  }
}

// Render facilities table
function netoptRenderFacilitiesTable() {
  var tbody = document.getElementById('netopt-facilities-tbody');
  tbody.innerHTML = '';
  netoptState.facilities.forEach(f => {
    var row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--ies-gray-200)';
    var fid = esc(f.id);
    row.innerHTML = `
      <td style="padding:12px 16px;"><input type="text" value="${esc(f.name)}" class="wsc-input" style="width:100%;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).name=this.value;"></td>
      <td style="padding:12px 16px;"><input type="text" value="${esc(f.city)}" class="wsc-input" style="width:100%;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).city=this.value;netoptGeocodeFacility('${fid}');"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${f.capacity}" min="100" step="50" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).capacity=parseFloat(this.value);netoptUpdateKPI();"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${f.fixedCost}" min="0" step="0.1" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).fixedCost=parseFloat(this.value);netoptUpdateKPI();"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${f.varCost}" min="0" step="0.01" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).varCost=parseFloat(this.value);netoptUpdateKPI();"></td>
      <td style="padding:12px 16px;text-align:center;">
        <select class="wsc-select" style="width:100%;font-size:12px;" onchange="netoptState.facilities.find(function(x){return x.id==='${fid}'}).status=this.value;">
          <option ${f.status==='Candidate'?'selected':''}>Candidate</option>
          <option ${f.status==='Locked Open'?'selected':''}>Locked Open</option>
        </select>
      </td>
      <td style="padding:12px 16px;text-align:center;"><button onclick="netoptRemoveFacility('${fid}')" style="padding:4px 8px;background:#fff;border:1px solid var(--ies-red);color:var(--ies-red);border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">Remove</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Render demands table
function netoptRenderDemandsTable() {
  var tbody = document.getElementById('netopt-demands-tbody');
  tbody.innerHTML = '';
  netoptState.demands.forEach(d => {
    var row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--ies-gray-200)';
    var did = esc(d.id);
    row.innerHTML = `
      <td style="padding:12px 16px;"><input type="text" value="${esc(d.city)}" class="wsc-input" style="width:100%;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).city=this.value;netoptGeocideDemand('${did}');"></td>
      <td style="padding:12px 16px;"><input type="text" value="${esc(d.state)}" class="wsc-input" style="width:100%;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).state=this.value;"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${d.volume}" min="1" step="10" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).volume=parseFloat(this.value);netoptUpdateKPI();"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${d.maxMiles}" min="50" step="50" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).maxMiles=parseFloat(this.value);"></td>
      <td style="padding:12px 16px;text-align:right;"><input type="number" value="${d.maxDays || 3}" min="1" max="7" step="1" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="netoptState.demands.find(function(x){return x.id==='${did}'}).maxDays=parseInt(this.value, 10);"></td>
      <td style="padding:12px 16px;text-align:center;"><button onclick="netoptRemoveDemand('${did}')" style="padding:4px 8px;background:#fff;border:1px solid var(--ies-red);color:var(--ies-red);border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">Remove</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Render both tables
function netoptRenderTables() {
  netoptRenderFacilitiesTable();
  netoptRenderDemandsTable();
}

// Add facility row
function netoptAddFacility() {
  var id = 'fac-' + Date.now();
  netoptState.facilities.push({
    id: id,
    name: 'New Facility',
    city: 'Atlanta, GA',
    capacity: 500,
    fixedCost: 2.5,
    varCost: 0.23,
    status: 'Candidate',
    lat: null,
    lng: null
  });
  netoptRenderFacilitiesTable();
  var g = geocodeCity('Atlanta, GA');
  if (g) {
    var f = netoptState.facilities.find(x => x.id === id);
    f.lat = g.lat;
    f.lng = g.lng;
  }
}

// Add demand row
function netoptAddDemandPoint() {
  var id = 'dem-' + Date.now();
  netoptState.demands.push({
    id: id,
    city: 'New York, NY',
    state: 'NY',
    volume: 100,
    maxMiles: 500,
    maxDays: 3,
    lat: null,
    lng: null
  });
  netoptRenderDemandsTable();
  var g = geocodeCity('New York, NY');
  if (g) {
    var d = netoptState.demands.find(x => x.id === id);
    d.lat = g.lat;
    d.lng = g.lng;
  }
}

// Remove facility
function netoptRemoveFacility(id) {
  netoptState.facilities = netoptState.facilities.filter(f => f.id !== id);
  netoptRenderFacilitiesTable();
  netoptUpdateKPI();
}

// Remove demand
function netoptRemoveDemand(id) {
  netoptState.demands = netoptState.demands.filter(d => d.id !== id);
  netoptRenderDemandsTable();
  netoptUpdateKPI();
}

// B5: Supplier/Origin point management
function netoptAddSupplier() {
  var id = 'sup-' + Date.now();
  netoptState.suppliers.push({
    id: id,
    city: 'Los Angeles, CA',
    volume: 200,
    mode: 'TL',
    lat: null,
    lng: null
  });
  netoptRenderSuppliersTable();
  var g = geocodeCity('Los Angeles, CA');
  if (g) {
    var s = netoptState.suppliers.find(function(x) { return x.id === id; });
    if (s) { s.lat = g.lat; s.lng = g.lng; }
  }
}

function netoptRemoveSupplier(id) {
  netoptState.suppliers = netoptState.suppliers.filter(function(s) { return s.id !== id; });
  netoptRenderSuppliersTable();
}

function netoptRenderSuppliersTable() {
  var tbody = document.getElementById('netopt-suppliers-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  netoptState.suppliers.forEach(function(s) {
    var row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--ies-gray-200)';
    var sid = esc(s.id);
    row.innerHTML =
      '<td style="padding:12px 16px;"><input type="text" value="' + esc(s.city) + '" class="wsc-input" style="width:100%;font-size:12px;" onchange="var sup=netoptState.suppliers.find(function(x){return x.id===\'' + sid + '\'});if(sup){sup.city=this.value;var g=geocodeCity(this.value);if(g){sup.lat=g.lat;sup.lng=g.lng;}}"></td>' +
      '<td style="padding:12px 16px;text-align:right;"><input type="number" value="' + s.volume + '" min="1" step="10" class="wsc-input" style="width:100%;text-align:right;font-size:12px;" onchange="var sup=netoptState.suppliers.find(function(x){return x.id===\'' + sid + '\'});if(sup)sup.volume=parseFloat(this.value);"></td>' +
      '<td style="padding:12px 16px;text-align:center;">' +
        '<select class="wsc-select" style="width:100%;font-size:12px;" onchange="var sup=netoptState.suppliers.find(function(x){return x.id===\'' + sid + '\'});if(sup)sup.mode=this.value;">' +
        '<option' + (s.mode === 'TL' ? ' selected' : '') + '>TL</option>' +
        '<option' + (s.mode === 'LTL' ? ' selected' : '') + '>LTL</option>' +
        '</select></td>' +
      '<td style="padding:12px 16px;text-align:center;"><button onclick="netoptRemoveSupplier(\'' + sid + '\')" style="padding:4px 8px;background:#fff;border:1px solid var(--ies-red);color:var(--ies-red);border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">Remove</button></td>';
    tbody.appendChild(row);
  });
}

function netoptGeocodeSupplier(id) {
  var s = netoptState.suppliers.find(function(x) { return x.id === id; });
  if (s) {
    var g = geocodeCity(s.city);
    if (g) { s.lat = g.lat; s.lng = g.lng; }
  }
}

// ── MARKET PICKER (select from 10 pre-defined markets) ──
function netoptShowMarketPicker() {
  var picker = document.getElementById('netopt-market-picker');
  var grid = document.getElementById('netopt-market-grid');
  // Determine which markets are already added
  var existingCities = netoptState.facilities.map(function(f) { return f.city.toLowerCase().trim(); });
  grid.innerHTML = '';
  NETOPT_FACILITY_CANDIDATES.forEach(function(m, idx) {
    var alreadyAdded = existingCities.indexOf(m.city.toLowerCase().trim()) !== -1;
    var card = document.createElement('label');
    card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid ' + (alreadyAdded ? 'var(--ies-gray-200,#e5e7eb)' : 'var(--ies-gray-300,#d1d5db)') + ';border-radius:8px;cursor:' + (alreadyAdded ? 'default' : 'pointer') + ';background:' + (alreadyAdded ? '#f3f4f6' : '#fff') + ';transition:border-color .15s,box-shadow .15s;opacity:' + (alreadyAdded ? '0.55' : '1') + ';';
    if (!alreadyAdded) {
      card.onmouseenter = function() { this.style.borderColor = 'var(--ies-blue)'; this.style.boxShadow = '0 0 0 2px rgba(0,71,171,.1)'; };
      card.onmouseleave = function() { var cb = this.querySelector('input'); this.style.borderColor = cb && cb.checked ? 'var(--ies-blue)' : 'var(--ies-gray-300,#d1d5db)'; this.style.boxShadow = 'none'; };
    }
    var checkbox = '<input type="checkbox" data-market-idx="' + idx + '" ' + (alreadyAdded ? 'disabled checked' : '') + ' style="width:16px;height:16px;accent-color:var(--ies-blue);cursor:' + (alreadyAdded ? 'default' : 'pointer') + ';">';
    var info = '<div style="flex:1;min-width:0;">' +
      '<div style="font-weight:700;font-size:12px;color:var(--ies-navy);">' + m.name + '</div>' +
      '<div style="font-size:10px;color:#6b7280;">' + m.city + ' &middot; ' + m.capacity + 'K cap &middot; ' + fmtNum(m.fixedCost, 1, '$') + 'M fixed</div>' +
      (alreadyAdded ? '<div style="font-size:9px;color:var(--ies-blue);font-weight:600;margin-top:2px;">Already added</div>' : '') +
      '</div>';
    card.innerHTML = checkbox + info;
    grid.appendChild(card);
  });
  picker.style.display = 'block';
}

function netoptCloseMarketPicker() {
  document.getElementById('netopt-market-picker').style.display = 'none';
}

function netoptMarketPickerSelectAll() {
  var cbs = document.querySelectorAll('#netopt-market-grid input[type="checkbox"]:not(:disabled)');
  cbs.forEach(function(cb) { cb.checked = true; cb.closest('label').style.borderColor = 'var(--ies-blue)'; });
}

function netoptMarketPickerClear() {
  var cbs = document.querySelectorAll('#netopt-market-grid input[type="checkbox"]:not(:disabled)');
  cbs.forEach(function(cb) { cb.checked = false; cb.closest('label').style.borderColor = 'var(--ies-gray-300,#d1d5db)'; });
}

function netoptAddSelectedMarkets() {
  var cbs = document.querySelectorAll('#netopt-market-grid input[type="checkbox"]:checked:not(:disabled)');
  var count = 0;
  cbs.forEach(function(cb) {
    var idx = parseInt(cb.getAttribute('data-market-idx'), 10);
    var m = NETOPT_FACILITY_CANDIDATES[idx];
    if (!m) return;
    var id = 'fac-' + Date.now() + '-' + idx;
    var g = geocodeCity(m.city);
    netoptState.facilities.push({
      id: id,
      name: m.name,
      city: m.city,
      capacity: m.capacity,
      fixedCost: m.fixedCost,
      varCost: m.varCost,
      status: 'Candidate',
      lat: g ? g.lat : null,
      lng: g ? g.lng : null
    });
    count++;
  });
  netoptCloseMarketPicker();
  netoptRenderFacilitiesTable();
  netoptUpdateKPI();
  if (count > 0) {
    netoptShowToast(count + ' market' + (count > 1 ? 's' : '') + ' added as facility candidates');
  }
}

// ── AUTO-RECOMMEND FACILITIES FROM DEMAND ──
function netoptAutoRecommendFacilities() {
  if (netoptState.demands.length === 0) {
    alert('Please add demand points first. The system needs demand data to recommend facility locations.');
    return;
  }

  // Build weighted demand points for clustering
  var demandPts = [];
  netoptState.demands.forEach(function(d) {
    var lat = d.lat, lng = d.lng;
    if (!lat || !lng) {
      var g = geocodeCity(d.city + (d.state ? ', ' + d.state : ''));
      if (g) { lat = g.lat; lng = g.lng; d.lat = lat; d.lng = lng; }
    }
    if (lat && lng) {
      demandPts.push({ lat: lat, lng: lng, weight: d.volume || 100 });
    }
  });

  if (demandPts.length === 0) {
    alert('Could not geocode any demand points. Please check city names.');
    return;
  }

  // Determine cluster count: min 2, max 6, scale with demand points
  var k = Math.min(Math.max(2, Math.ceil(demandPts.length / 15)), 6);
  // Respect constraints if set
  if (netoptState.constraints.maxFacilities) {
    k = Math.min(k, netoptState.constraints.maxFacilities);
  }

  // Run k-means clustering (reuse existing kMeansCOG)
  var clusters = kMeansCOG(demandPts, k, 50);

  // Map each cluster center to the nearest real city, then find closest NETOPT market
  var recommended = [];
  var usedNames = {};
  clusters.forEach(function(cl) {
    // Find nearest city in NET_CITIES
    var nc = nearestCity(cl.center.lat, cl.center.lng);
    // Try to match to a NETOPT_FACILITY_CANDIDATES entry
    var matched = null;
    var bestDist = Infinity;
    NETOPT_FACILITY_CANDIDATES.forEach(function(cand) {
      var candGeo = geocodeCity(cand.city);
      if (candGeo) {
        var d = haversine(cl.center.lat, cl.center.lng, candGeo.lat, candGeo.lng);
        if (d < bestDist) { bestDist = d; matched = cand; }
      }
    });

    // Use matched market if within 300 miles, otherwise use nearest city with estimated costs
    var facName, facCity, facCapacity, facFixed, facVar;
    if (matched && bestDist < 300) {
      facName = matched.name;
      facCity = matched.city;
      facCapacity = matched.capacity;
      facFixed = matched.fixedCost;
      facVar = matched.varCost;
    } else {
      facName = nc.replace(/,.*/, '').trim();
      facCity = nc;
      facCapacity = Math.round(cl.totalWeight * 1.2);
      facFixed = 2.5;
      facVar = 0.23;
    }

    // Avoid duplicates
    if (usedNames[facName]) {
      facName = facName + ' (' + (Object.keys(usedNames).length + 1) + ')';
    }
    usedNames[facName] = true;

    var geo = geocodeCity(facCity);
    recommended.push({
      name: facName,
      city: facCity,
      capacity: facCapacity,
      fixedCost: facFixed,
      varCost: facVar,
      lat: geo ? geo.lat : cl.center.lat,
      lng: geo ? geo.lng : cl.center.lng,
      clusterWeight: cl.totalWeight,
      clusterSize: cl.members.length
    });
  });

  // Check for existing facilities and warn
  var existingCities = netoptState.facilities.map(function(f) { return f.city.toLowerCase().trim(); });
  var newRecs = recommended.filter(function(r) { return existingCities.indexOf(r.city.toLowerCase().trim()) === -1; });
  var skipped = recommended.length - newRecs.length;

  if (newRecs.length === 0) {
    alert('All recommended locations are already in your facility list.');
    return;
  }

  // Add recommended facilities
  newRecs.forEach(function(r) {
    netoptState.facilities.push({
      id: 'fac-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: r.name,
      city: r.city,
      capacity: r.capacity,
      fixedCost: r.fixedCost,
      varCost: r.varCost,
      status: 'Candidate',
      lat: r.lat,
      lng: r.lng
    });
  });

  netoptRenderFacilitiesTable();
  netoptUpdateKPI();

  var msg = newRecs.length + ' facility location' + (newRecs.length > 1 ? 's' : '') + ' recommended based on demand clustering';
  if (skipped > 0) msg += ' (' + skipped + ' already existed)';
  netoptShowToast(msg);
}

// Small toast helper for NetOpt
function netoptShowToast(message) {
  var toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--ies-navy,#1c1c2e);color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.25);transition:opacity .3s;';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; setTimeout(function() { toast.remove(); }, 300); }, 3000);
}

// Geocode facility
function netoptGeocodeFacility(id) {
  var f = netoptState.facilities.find(x => x.id === id);
  if (f) {
    var g = geocodeCity(f.city);
    if (g) { f.lat = g.lat; f.lng = g.lng; }
  }
}

// Geocode demand
function netoptGeocideDemand(id) {
  var d = netoptState.demands.find(x => x.id === id);
  if (d) {
    var g = geocodeCity(d.city);
    if (g) { d.lat = g.lat; d.lng = g.lng; }
  }
}

// Update KPI strip
function netoptUpdateKPI() {
  var transport = netoptState.transport;
  transport.outboundPerUnitMile = parseFloat(document.getElementById('netopt-outbound-cost').value) || 0.0025;
  transport.inboundPerUnitMile = parseFloat(document.getElementById('netopt-inbound-cost').value) || 0.0015;
  transport.truckSpeedMiPerDay = parseFloat(document.getElementById('netopt-truck-speed').value) || 500;

  var constraints = netoptState.constraints;
  constraints.serviceLevelPct = parseFloat(document.getElementById('netopt-service-target').value) || 95;
  constraints.minFacilities = parseFloat(document.getElementById('netopt-min-facilities').value) || 1;
  constraints.maxFacilities = parseFloat(document.getElementById('netopt-max-facilities').value) || 5;
  constraints.budgetCap = document.getElementById('netopt-budget-cap').value ? parseFloat(document.getElementById('netopt-budget-cap').value) : null;
  constraints.inventoryCarryPct = parseFloat(document.getElementById('netopt-inventory-carry').value) || 15;

  // Calculate summary KPIs
  var totalDemand = netoptState.demands.reduce((s, d) => s + (d.volume || 0), 0) * 1000; // Convert K to units
  var openCount = netoptState.results ? (netoptState.results.openFacilities || []).length : 0;
  var totalCost = netoptState.results ? netoptState.results.totalCost : 0;
  var avgDist = netoptState.results ? netoptState.results.avgDistance : 0;
  var servicePct = netoptState.results ? netoptState.results.serviceLevel : 0;

  document.getElementById('netopt-k-open').textContent = openCount || '—';
  document.getElementById('netopt-k-demand').textContent = totalDemand ? (totalDemand >= 1000000 ? fmtNum(totalDemand / 1000000, 1) + 'M' : fmtNum(totalDemand / 1000, 0) + 'K') : '—';
  document.getElementById('netopt-k-cost').textContent = totalCost ? fmtNum(totalCost, 1, '$') + 'M' : '—';
  document.getElementById('netopt-k-service').textContent = servicePct ? fmtNum(servicePct, 0) + '%' : '—';
  document.getElementById('netopt-k-dist').textContent = avgDist ? Math.round(avgDist).toLocaleString('en-US') : '—';
}

// Set solver mode
function netoptSetSolverMode(mode) {
  netoptState.solverMode = mode;
  var hBtn = document.getElementById('netopt-mode-heuristic');
  var eBtn = document.getElementById('netopt-mode-exact');
  var desc = document.getElementById('netopt-solver-desc');

  if (mode === 'heuristic') {
    hBtn.style.background = 'var(--ies-blue)';
    hBtn.style.color = '#fff';
    eBtn.style.background = '#fff';
    eBtn.style.color = 'var(--ies-navy)';
    desc.textContent = 'Greedy addition — 80-90% optimal, <100ms';
  } else {
    eBtn.style.background = 'var(--ies-blue)';
    eBtn.style.color = '#fff';
    hBtn.style.background = '#fff';
    hBtn.style.color = 'var(--ies-navy)';
    desc.textContent = 'Exhaustive enumeration — provably optimal, <3s';
  }
}

// Run optimization
function netoptRunOptimization() {
  if (netoptState.facilities.length === 0 && netoptState.demands.length === 0) {
    alert('Please add at least one facility candidate and one demand point before running optimization.');
    return;
  }
  if (netoptState.facilities.length === 0) {
    alert('Please add at least one facility candidate. Use "Select from Markets" to choose from pre-defined locations, "Auto-Recommend" to suggest locations based on your demand, or "+ Add Facility" to add manually.');
    return;
  }
  if (netoptState.demands.length === 0) {
    alert('Please add at least one demand point before running optimization.');
    return;
  }

  // Geocode any missing coordinates
  netoptState.facilities.forEach(f => {
    if (!f.lat || !f.lng) {
      var g = geocodeCity(f.city);
      if (g) { f.lat = g.lat; f.lng = g.lng; }
    }
  });
  netoptState.demands.forEach(d => {
    if (!d.lat || !d.lng) {
      var g = geocodeCity(d.city);
      if (g) { d.lat = g.lat; d.lng = g.lng; }
    }
  });

  // Run selected solver
  var startTime = performance.now();
  var results;
  if (netoptState.solverMode === 'exact') {
    results = netoptExactOptimize(
      netoptState.facilities,
      netoptState.demands,
      netoptState.transport,
      netoptState.constraints
    );
  } else {
    results = netoptGreedyOptimize(
      netoptState.facilities,
      netoptState.demands,
      netoptState.transport,
      netoptState.constraints
    );
  }
  var elapsed = performance.now() - startTime;
  results.solverMode = netoptState.solverMode;
  results.solveTimeMs = elapsed;

  // Show solve time
  var timeEl = document.getElementById('netopt-solve-time');
  if (timeEl) {
    timeEl.style.display = 'inline';
    timeEl.textContent = 'Solved in ' + fmtNum(elapsed, 0) + 'ms (' + (netoptState.solverMode === 'exact' ? 'exact' : 'heuristic') + ')';
  }

  netoptState.results = results;
  netoptRenderResults();
  netoptUpdateKPI();

  // Switch to results tab
  document.getElementById('netopt-results-empty').style.display = 'none';
  document.getElementById('netopt-results-content').style.display = 'block';
  netoptSwitchTab('results');
}

// Greedy Facility Addition Heuristic
function netoptGreedyOptimize(facilities, demands, transport, constraints) {
  var scenarios = [];
  var minFacs = constraints.minFacilities || 1;
  var maxFacs = Math.min(constraints.maxFacilities || 5, facilities.length);

  // Evaluate each facility count from 1 to maxFacs
  for (var numFacs = 1; numFacs <= maxFacs; numFacs++) {
    // Find best numFacs facilities
    var bestConfig = netoptFindBestConfig(facilities, demands, transport, constraints, numFacs);
    scenarios.push(bestConfig);
  }

  // Tag best-cost and best-service scenarios
  var bestCostIdx = 0, bestServiceIdx = 0;
  for (var si = 0; si < scenarios.length; si++) {
    if (scenarios[si].totalCost < scenarios[bestCostIdx].totalCost) bestCostIdx = si;
    if (scenarios[si].avgDeliveryDays < scenarios[bestServiceIdx].avgDeliveryDays) bestServiceIdx = si;
  }
  scenarios.forEach(function(s, i) {
    s._isBestCost = (i === bestCostIdx);
    s._isBestService = (i === bestServiceIdx);
    // Hard constraint enforcement: mark scenarios below target service as infeasible
    var targetPct = constraints.targetServicePct || constraints.serviceLevelPct || 95;
    if (constraints.hardConstraint && s.serviceLevel < targetPct) {
      s._hardConstraintFail = true;
      s._hardConstraintReason = 'Service ' + fmtNum(s.serviceLevel, 1) + '% < ' + targetPct + '% target';
    }
  });

  // Default recommended = best cost among feasible (backward compatible)
  var bestScenario = scenarios.reduce((best, curr) => {
    if (constraints.budgetCap && curr.totalCost > constraints.budgetCap) return best;
    if (curr.serviceLevel < constraints.serviceLevelPct) return best;
    return curr.totalCost < best.totalCost ? curr : best;
  }, scenarios[0] || {});

  bestScenario.allScenarios = scenarios;
  bestScenario.bestCostIdx = bestCostIdx;
  bestScenario.bestServiceIdx = bestServiceIdx;
  return bestScenario;
}

// Find best facility configuration for a given count
function netoptFindBestConfig(facilities, demands, transport, constraints, numFacs) {
  var best = null;
  var lockedFacs = facilities.filter(f => f.status === 'Locked Open');
  var candidateFacs = facilities.filter(f => f.status === 'Candidate');

  // Greedy: add highest-impact candidates
  var config = lockedFacs.slice();
  var remaining = candidateFacs.slice();

  while (config.length < numFacs && remaining.length > 0) {
    var bestAdd = null;
    var bestCost = Infinity;
    var bestIdx = -1;

    for (var i = 0; i < remaining.length; i++) {
      var testConfig = config.concat([remaining[i]]);
      var cost = netoptCalculateTotalCost(testConfig, demands, transport, constraints);
      if (cost < bestCost) {
        bestCost = cost;
        bestAdd = remaining[i];
        bestIdx = i;
      }
    }

    if (bestAdd) {
      config.push(bestAdd);
      remaining.splice(bestIdx, 1);
    } else {
      break;
    }
  }

  return netoptEvaluateConfig(config, demands, transport, constraints);
}

// Calculate total cost for a configuration
function netoptCalculateTotalCost(config, demands, transport, constraints) {
  var fixedCost = config.reduce((s, f) => s + (f.fixedCost || 0), 0) * 1000000; // Convert M$ to $
  var transportCost = 0;
  var mix = transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };

  demands.forEach(d => {
    if (config.length > 0) {
      var closest = config[0];
      var minDist = roadDist(d.lat, d.lng, closest.lat, closest.lng);
      for (var i = 1; i < config.length; i++) {
        var dist = roadDist(d.lat, d.lng, config[i].lat, config[i].lng);
        if (dist < minDist) {
          minDist = dist;
          closest = config[i];
        }
      }
      var vol = (d.volume || 0) * 1000; // K to units
      // Multi-mode cost: TL and LTL are distance-based, parcel is zone-based
      var tlCost = vol * mix.tl * minDist * (transport.tlUnitMile || transport.outboundPerUnitMile || 0.0025);
      var ltlCost = vol * mix.ltl * minDist * (transport.ltlUnitMile || transport.outboundPerUnitMile || 0.0040);
      var parcelCost = vol * mix.parcel * (transport.parcelUnitCost || 8.50); // flat per unit for parcel
      transportCost += tlCost + ltlCost + parcelCost;
    }
  });

  return (fixedCost + transportCost) / 1000000; // Return in M$
}

// Reusable transit day estimation helper
function estimateTransitDays(distMiles, transport) {
  var speed = (transport && transport.truckSpeedMiPerDay) || 500;
  var mix = (transport && transport.modeMix) || { tl: 0.7, ltl: 0.2, parcel: 0.1 };
  var groundDays = distMiles <= 150 ? 1 : Math.ceil(distMiles / speed) + 1;
  var parcelDays = distMiles <= 50 ? 1 : distMiles <= 150 ? 2 : distMiles <= 400 ? 3 : distMiles <= 800 ? 4 : 5;
  var groundPct = (mix.tl || 0) + (mix.ltl || 0);
  var parcelPct = mix.parcel || 0;
  var total = groundPct + parcelPct;
  if (total === 0) return groundDays;
  return Math.max(1, Math.round(((groundDays * groundPct + parcelDays * parcelPct) / total) * 10) / 10);
}

// Evaluate a configuration
function netoptEvaluateConfig(config, demands, transport, constraints) {
  var fixedCost = config.reduce((s, f) => s + (f.fixedCost || 0), 0);
  var transportCost = 0;
  var assignedVolume = {};
  var distances = [];
  var serviceCt = 0;
  var slaMet = 0;
  var slaTotal = 0;
  var truckSpeed = transport.truckSpeedMiPerDay || 500;

  // Delivery day buckets: volume-weighted (units in K)
  var dayBuckets = { d1: 0, d2: 0, d3: 0, d4: 0, d5plus: 0 };
  var totalVolume = 0;
  var weightedDaySum = 0;

  // B1: Track demand-to-facility assignments for flow visualization and allocation table
  var demandAssignments = [];

  config.forEach(f => assignedVolume[f.id] = 0);

  // B1: First pass — assign demands to nearest facility, track assignments
  var pendingAssignments = [];
  demands.forEach(function(d) {
    if (config.length === 0) return;
    // Sort facilities by distance, penalizing those that violate transit SLA
    var maxD = d.maxDays || (constraints && constraints.globalMaxDays) || 999;
    var sorted = config.map(function(f) {
      var dist = roadDist(d.lat, d.lng, f.lat, f.lng);
      var days = estimateTransitDays(dist, transport);
      return { facility: f, dist: dist, transitDays: days };
    }).sort(function(a, b) {
      var penA = a.transitDays > maxD ? 1e6 : 0;
      var penB = b.transitDays > maxD ? 1e6 : 0;
      return (a.dist + penA) - (b.dist + penB);
    });
    pendingAssignments.push({ demand: d, sortedFacs: sorted });
  });

  // B1: Capacity-aware assignment with overflow
  // Pass 1: assign to nearest; Pass 2: overflow excess to next-nearest
  var capacityK = {};
  config.forEach(function(f) { capacityK[f.id] = f.capacity || Infinity; });

  pendingAssignments.forEach(function(pa) {
    var d = pa.demand;
    var vol = d.volume || 0;
    var remaining = vol;

    for (var fi = 0; fi < pa.sortedFacs.length && remaining > 0; fi++) {
      var sf = pa.sortedFacs[fi];
      var fac = sf.facility;
      var dist = sf.dist;
      var available = capacityK[fac.id] - (assignedVolume[fac.id] || 0);

      if (available <= 0) continue;

      var allocated = Math.min(remaining, available);
      assignedVolume[fac.id] = (assignedVolume[fac.id] || 0) + allocated;
      remaining -= allocated;

      // Transport cost for this allocation
      var volUnits = allocated * 1000;
      var mix = transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };
      var tlCost = volUnits * mix.tl * dist * (transport.tlUnitMile || transport.outboundPerUnitMile || 0.0025);
      var ltlCost = volUnits * mix.ltl * dist * (transport.ltlUnitMile || transport.outboundPerUnitMile || 0.0040);
      var parcelCost = volUnits * mix.parcel * (transport.parcelUnitCost || 8.50);
      transportCost += tlCost + ltlCost + parcelCost;
      distances.push(dist);

      // Service level: check both distance AND transit day SLA
      var transitDays = estimateTransitDays(dist, transport);
      var demandMaxDays = d.maxDays || (constraints && constraints.globalMaxDays) || 999;
      var meetsDistance = dist <= (d.maxMiles || 9999);
      var meetsDays = transitDays <= demandMaxDays;
      if (meetsDistance && meetsDays) serviceCt += (allocated / vol);

      totalVolume += allocated;
      weightedDaySum += transitDays * allocated;

      if (transitDays <= 1.5) dayBuckets.d1 += allocated;
      else if (transitDays <= 2.5) dayBuckets.d2 += allocated;
      else if (transitDays <= 3.5) dayBuckets.d3 += allocated;
      else if (transitDays <= 4.5) dayBuckets.d4 += allocated;
      else dayBuckets.d5plus += allocated;

      // Track assignment for flow visualization
      demandAssignments.push({
        demandId: d.id, demandCity: d.city, demandLat: d.lat, demandLng: d.lng,
        facilityId: fac.id, facilityName: fac.name, facilityLat: fac.lat, facilityLng: fac.lng,
        volume: allocated, distance: dist, transitDays: transitDays,
        transportCost: (tlCost + ltlCost + parcelCost) / 1000000
      });
    }

    // If still remaining after all facilities full, assign to nearest anyway (infeasible overflow)
    if (remaining > 0 && pa.sortedFacs.length > 0) {
      var nearest = pa.sortedFacs[0];
      assignedVolume[nearest.facility.id] = (assignedVolume[nearest.facility.id] || 0) + remaining;
      var volUnits = remaining * 1000;
      var mix = transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };
      transportCost += volUnits * mix.tl * nearest.dist * (transport.tlUnitMile || transport.outboundPerUnitMile || 0.0025);
      transportCost += volUnits * mix.ltl * nearest.dist * (transport.ltlUnitMile || transport.outboundPerUnitMile || 0.0040);
      transportCost += volUnits * mix.parcel * (transport.parcelUnitCost || 8.50);
      distances.push(nearest.dist);
      totalVolume += remaining;

      demandAssignments.push({
        demandId: d.id, demandCity: d.city, demandLat: d.lat, demandLng: d.lng,
        facilityId: nearest.facility.id, facilityName: nearest.facility.name,
        facilityLat: nearest.facility.lat, facilityLng: nearest.facility.lng,
        volume: remaining, distance: nearest.dist, transitDays: 0, transportCost: 0
      });
    }

    // Track SLA compliance per demand point
    slaTotal++;
    var demandMaxD = d.maxDays || (constraints && constraints.globalMaxDays) || 999;
    // Check if primary assignment meets SLA (use first assignment for this demand)
    var primaryAssign = demandAssignments.filter(function(a) { return a.demandId === d.id; })[0];
    if (primaryAssign && primaryAssign.transitDays <= demandMaxD && primaryAssign.distance <= (d.maxMiles || 9999)) {
      slaMet++;
    }
  });

  var varCost = config.reduce((s, f) => {
    var vol = assignedVolume[f.id] || 0;
    return s + (vol * 1000 * (f.varCost || 0) / 1000000);
  }, 0);

  // B5: Inbound transport cost from suppliers to facilities
  var inboundCost = 0;
  var suppliers = netoptState.suppliers || [];
  if (suppliers.length > 0 && config.length > 0) {
    var inboundRate = transport.inboundPerUnitMile || 0.00178;
    suppliers.forEach(function(sup) {
      if (!sup.lat || !sup.lng) return;
      var supVol = (sup.volume || 0) * 1000; // K to units
      // Distribute supplier volume proportionally across facilities by their assigned demand
      var totalAssigned = config.reduce(function(s, f) { return s + (assignedVolume[f.id] || 0); }, 0) || 1;
      config.forEach(function(f) {
        var facShare = (assignedVolume[f.id] || 0) / totalAssigned;
        var dist = roadDist(sup.lat, sup.lng, f.lat, f.lng);
        var supMix = sup.mode === 'LTL' ? { tl: 0, ltl: 1 } : { tl: 1, ltl: 0 };
        var tlRate = transport.tlUnitMile || inboundRate;
        var ltlRate = transport.ltlUnitMile || inboundRate * 1.6;
        inboundCost += supVol * facShare * dist * (supMix.tl * tlRate + supMix.ltl * ltlRate);
      });
    });
  }

  var inventoryCost = (fixedCost + varCost) * (constraints.inventoryCarryPct || 15) / 100 / 12; // Monthly carry
  var totalCost = fixedCost + (transportCost / 1000000) + (inboundCost / 1000000) + varCost + inventoryCost;
  var avgDistance = distances.length > 0 ? distances.reduce((a, b) => a + b) / distances.length : 0;
  var serviceLevel = demands.length > 0 ? (serviceCt / demands.length) * 100 : 0;
  var avgDeliveryDays = totalVolume > 0 ? weightedDaySum / totalVolume : 0;

  // Convert day buckets to percentages
  var dayPct = {
    d1: totalVolume > 0 ? (dayBuckets.d1 / totalVolume * 100) : 0,
    d2: totalVolume > 0 ? (dayBuckets.d2 / totalVolume * 100) : 0,
    d3: totalVolume > 0 ? (dayBuckets.d3 / totalVolume * 100) : 0,
    d4: totalVolume > 0 ? (dayBuckets.d4 / totalVolume * 100) : 0,
    d5plus: totalVolume > 0 ? (dayBuckets.d5plus / totalVolume * 100) : 0
  };

  // B1: Compute utilization and feasibility per facility
  var utilization = {};
  var feasibility = 'green'; // green = all OK, yellow = some 80-100%, red = over capacity
  config.forEach(function(f) {
    var vol = assignedVolume[f.id] || 0;
    var cap = f.capacity || Infinity;
    var pct = cap !== Infinity ? (vol / cap * 100) : 0;
    utilization[f.id] = { volume: vol, capacity: cap, pct: pct };
    if (pct > 100 && feasibility !== 'red') feasibility = 'red';
    else if (pct >= 80 && feasibility === 'green') feasibility = 'yellow';
  });

  return {
    openFacilities: config,
    assignedVolume: assignedVolume,
    demandAssignments: demandAssignments,
    utilization: utilization,
    feasibility: feasibility,
    fixedCostM: fixedCost,
    transportCostM: transportCost / 1000000,
    inboundCostM: inboundCost / 1000000,
    varCostM: varCost,
    inventoryCostM: inventoryCost,
    totalCost: totalCost,
    avgDistance: avgDistance,
    serviceLevel: serviceLevel,
    avgDeliveryDays: avgDeliveryDays,
    dayPct: dayPct,
    slaMet: slaMet,
    slaTotal: slaTotal
  };
}

// Exact solver: enumerate all facility combinations to find provably optimal
function netoptExactOptimize(facilities, demands, transport, constraints) {
  var candidateCount = facilities.filter(f => f.status === 'Candidate').length;
  if (candidateCount > 20) {
    var proceed = confirm('Exact solver with ' + candidateCount + ' candidate facilities may take a long time or hang the browser.\n\nRecommend using Heuristic mode for 15+ candidates.\n\nContinue anyway?');
    if (!proceed) return [];
  }
  var minFacs = constraints.minFacilities || 1;
  var maxFacs = Math.min(constraints.maxFacilities || 5, facilities.length);
  var lockedFacs = facilities.filter(f => f.status === 'Locked Open');
  var candidateFacs = facilities.filter(f => f.status === 'Candidate');

  var allScenarios = [];
  var globalBest = null;

  for (var numFacs = minFacs; numFacs <= maxFacs; numFacs++) {
    // Number of candidates we need to add beyond locked facilities
    var needed = numFacs - lockedFacs.length;
    if (needed < 0) needed = 0;
    if (needed > candidateFacs.length) continue;

    // Generate all C(n, k) combinations of candidates
    var combos = getCombinations(candidateFacs, needed);
    var bestForThisCount = null;

    combos.forEach(combo => {
      var config = lockedFacs.concat(combo);
      var result = netoptEvaluateConfig(config, demands, transport, constraints);

      if (!bestForThisCount || result.totalCost < bestForThisCount.totalCost) {
        bestForThisCount = result;
      }
    });

    if (bestForThisCount) {
      allScenarios.push(bestForThisCount);
      if (!globalBest || bestForThisCount.totalCost < globalBest.totalCost) {
        if (!constraints.budgetCap || bestForThisCount.totalCost <= constraints.budgetCap) {
          if (bestForThisCount.serviceLevel >= constraints.serviceLevelPct) {
            globalBest = bestForThisCount;
          }
        }
      }
    }
  }

  // Tag best-cost and best-service scenarios
  var bestCostIdx = 0, bestServiceIdx = 0;
  for (var si = 0; si < allScenarios.length; si++) {
    if (allScenarios[si].totalCost < allScenarios[bestCostIdx].totalCost) bestCostIdx = si;
    if (allScenarios[si].avgDeliveryDays < allScenarios[bestServiceIdx].avgDeliveryDays) bestServiceIdx = si;
  }
  allScenarios.forEach(function(s, i) {
    s._isBestCost = (i === bestCostIdx);
    s._isBestService = (i === bestServiceIdx);
  });

  if (!globalBest && allScenarios.length > 0) globalBest = allScenarios[0];
  if (globalBest) {
    globalBest.allScenarios = allScenarios;
    globalBest.bestCostIdx = bestCostIdx;
    globalBest.bestServiceIdx = bestServiceIdx;
  }
  if (!globalBest) globalBest = { openFacilities: [], totalCost: Infinity, allScenarios: allScenarios };
  return globalBest;
}

// Generate all combinations of k items from array
function getCombinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  var results = [];
  function combine(start, chosen) {
    if (chosen.length === k) { results.push(chosen.slice()); return; }
    for (var i = start; i <= arr.length - (k - chosen.length); i++) {
      chosen.push(arr[i]);
      combine(i + 1, chosen);
      chosen.pop();
    }
  }
  combine(0, []);
  return results;
}

// Render results
function netoptRenderResults() {
  var r = netoptState.results;
  if (!r) return;

  // Intelligent recommendation
  netoptRenderRecommendation(r);

  // Cost breakdown
  var tbody = document.getElementById('netopt-cost-breakdown');
  tbody.innerHTML = `
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Facility Fixed Costs</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.fixedCostM, 2, '$')}M</td>
    </tr>
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Outbound Transport</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.transportCostM, 2, '$')}M</td>
    </tr>
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Inbound Transport</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.inboundCostM || 0, 2, '$')}M</td>
    </tr>
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Variable Handling</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.varCostM, 2, '$')}M</td>
    </tr>
    <tr style="border-bottom:1px solid var(--ies-gray-200);">
      <td style="padding:10px 0;font-weight:600;">Inventory Carrying</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;color:var(--ies-blue);">${fmtNum(r.inventoryCostM, 2, '$')}M</td>
    </tr>
    <tr style="border-top:2px solid var(--ies-navy);">
      <td style="padding:10px 0;font-weight:700;color:var(--ies-navy);">TOTAL ANNUAL COST</td>
      <td style="padding:10px 0;text-align:right;font-weight:900;color:var(--ies-navy);font-size:14px;">${fmtNum(r.totalCost, 2, '$')}M</td>
    </tr>
  `;

  // Delivery Performance card
  var spBody = document.getElementById('netopt-service-profile-body');
  if (spBody && r.dayPct) {
    var dp = r.dayPct;
    var barColors = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
    var barLabels = ['1 Day', '2 Day', '3 Day', '4 Day', '5+ Day'];
    var barVals = [dp.d1, dp.d2, dp.d3, dp.d4, dp.d5plus];

    var avgDaysDisplay = r.avgDeliveryDays ? fmtNum(r.avgDeliveryDays, 1) : '—';
    var cumul2Day = fmtNum(dp.d1 + dp.d2, 0);
    var cumul3Day = fmtNum(dp.d1 + dp.d2 + dp.d3, 0);
    var slaHtml = (r.slaMet != null && r.slaTotal > 0) ?
      '<div style="margin-top:8px;font-size:10px;font-weight:600;color:' + (r.slaMet === r.slaTotal ? '#059669' : r.slaMet >= r.slaTotal * 0.9 ? '#d97706' : '#dc2626') + ';">' + r.slaMet + '/' + r.slaTotal + ' demand points meet SLA</div>' : '';
    var svcColor = r.serviceLevel >= (netoptState.constraints.targetServicePct || 95) ? '#059669' : r.serviceLevel >= (netoptState.constraints.targetServicePct || 95) - 5 ? '#d97706' : '#dc2626';

    spBody.innerHTML = `
      <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">
        <div style="flex:0 0 auto;text-align:center;padding:8px 20px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border-radius:10px;">
          <div style="font-size:28px;font-weight:800;color:var(--ies-navy);">${avgDaysDisplay}</div>
          <div style="font-size:10px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;letter-spacing:.5px;">Avg Days</div>
          <div style="margin-top:6px;font-size:10px;color:var(--ies-gray-500);">${cumul2Day}% within 2 days &middot; ${cumul3Day}% within 3 days</div>
          <div style="margin-top:4px;font-size:14px;font-weight:700;color:${svcColor};">${r.serviceLevel ? fmtNum(r.serviceLevel, 1) : '—'}% Service</div>
          ${slaHtml}
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:10px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">% of Orders by Delivery Day</div>
          ${barVals.map(function(val, bi) {
            return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
              '<div style="width:42px;font-size:10px;font-weight:600;color:var(--ies-gray-600);text-align:right;">' + barLabels[bi] + '</div>' +
              '<div style="flex:1;height:18px;background:#f1f3f5;border-radius:4px;overflow:hidden;position:relative;">' +
                '<div style="height:100%;width:' + Math.max(val, 0.5) + '%;background:' + barColors[bi] + ';border-radius:4px;transition:width .3s;"></div>' +
              '</div>' +
              '<div style="width:36px;font-size:11px;font-weight:700;color:var(--ies-navy);text-align:right;">' + fmtNum(val, 0) + '%</div>' +
            '</div>';
          }).join('')}
        </div>
      </div>
    `;
  }

  // Scenario comparison — clickable rows with cost/service badges
  if (r.allScenarios) {
    var cBody = document.getElementById('netopt-comparison-tbody');
    cBody.innerHTML = '';
    var selectedIdx = netoptState.selectedScenarioIdx != null ? netoptState.selectedScenarioIdx : r.allScenarios.indexOf(r);
    if (selectedIdx < 0) selectedIdx = r.allScenarios.findIndex(s => s.openFacilities.length === r.openFacilities.length);

    // B3: Baseline is the 1-DC scenario for delta calculation
    var baseline = r.allScenarios[0];

    r.allScenarios.forEach((scenario, i) => {
      var numDCs = scenario.openFacilities.length;
      var facNames = scenario.openFacilities.map(f => f.name).join(', ');
      var isSelected = (i === selectedIdx);

      // Build verdict badges
      var badges = [];
      if (scenario._isBestCost) badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(16,185,129,.12);color:#059669;">BEST COST</span>');
      if (scenario._isBestService) badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(59,130,246,.12);color:#2563eb;">BEST SERVICE</span>');
      if (scenario._hardConstraintFail) badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(239,68,68,.12);color:#dc2626;">SLA FAIL</span>');
      if (scenario.feasibility === 'red') badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(239,68,68,.12);color:#dc2626;">INFEASIBLE</span>');
      else if (scenario.feasibility === 'yellow') badges.push('<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(245,158,11,.12);color:#d97706;">AT CAPACITY</span>');
      var verdictHtml = badges.length > 0 ? badges.join(' ') : '<span style="color:var(--ies-gray-400);font-size:10px;">—</span>';

      // B3: Delta from baseline
      var deltaPct = baseline && baseline.totalCost > 0 ? ((scenario.totalCost - baseline.totalCost) / baseline.totalCost * 100) : 0;
      var deltaHtml = i === 0 ? '<span style="color:var(--ies-gray-400);">base</span>' :
        (deltaPct <= 0 ? '<span style="color:#059669;">' + fmtNum(deltaPct, 1) + '%</span>' :
         '<span style="color:#dc2626;">+' + fmtNum(deltaPct, 1) + '%</span>');

      // B1: Feasibility icon
      var feasIcon = scenario.feasibility === 'green' ? '&#x1f7e2;' : scenario.feasibility === 'yellow' ? '&#x1f7e1;' : scenario.feasibility === 'red' ? '&#x1f534;' : '&#x1f7e2;';

      var row = document.createElement('tr');
      row.style.borderBottom = '1px solid var(--ies-gray-200)';
      row.style.cursor = 'pointer';
      row.style.transition = 'all .15s';
      if (isSelected) {
        row.style.background = 'rgba(0,71,171,.08)';
        row.style.borderLeft = '3px solid var(--ies-blue)';
      }
      row.onmouseover = function() { if (!isSelected) this.style.background = 'rgba(0,71,171,.03)'; };
      row.onmouseout = function() { if (!isSelected) this.style.background = ''; };
      row.onclick = (function(idx) { return function() { netoptSelectScenario(idx); }; })(i);
      row.innerHTML =
        '<td style="padding:10px 14px;font-weight:600;">' + numDCs + '</td>' +
        '<td style="padding:10px 14px;font-size:11px;">' + esc(facNames) + '</td>' +
        '<td style="padding:10px 14px;text-align:right;font-weight:600;">' + fmtNum(scenario.totalCost, 2, '$') + 'M</td>' +
        '<td style="padding:10px 14px;text-align:right;">' + fmtNum(scenario.fixedCostM, 2, '$') + 'M</td>' +
        '<td style="padding:10px 14px;text-align:right;">' + fmtNum(scenario.transportCostM, 2, '$') + 'M</td>' +
        '<td style="padding:10px 14px;text-align:right;">' + (scenario.avgDistance ? fmtNum(scenario.avgDistance, 0) : '—') + '</td>' +
        '<td style="padding:10px 14px;text-align:right;">' + (scenario.serviceLevel ? fmtNum(scenario.serviceLevel, 0) + '%' : '—') + '</td>' +
        '<td style="padding:10px 14px;text-align:right;font-weight:600;">' + (scenario.avgDeliveryDays ? fmtNum(scenario.avgDeliveryDays, 1) : '—') + '</td>' +
        '<td style="padding:10px 14px;text-align:right;font-weight:600;">' + deltaHtml + '</td>' +
        '<td style="padding:10px 14px;text-align:center;font-size:11px;">' + (scenario.slaMet != null ? scenario.slaMet + '/' + scenario.slaTotal : '—') + '</td>' +
        '<td style="padding:10px 14px;text-align:center;">' + feasIcon + '</td>' +
        '<td style="padding:10px 14px;text-align:center;">' + verdictHtml + '</td>';
      cBody.appendChild(row);
    });
  }

  // B1: Render capacity utilization card
  netoptRenderUtilization(r);

  // Render new enhancement features
  netoptRenderAllocationTable();
}

// B1: Render facility utilization bars and feasibility flag
function netoptRenderUtilization(r) {
  var container = document.getElementById('netopt-utilization-card');
  if (!container) {
    // Create utilization card if it doesn't exist yet — insert before allocation table
    var allocCard = document.getElementById('netopt-allocation-card');
    if (!allocCard) return;
    container = document.createElement('div');
    container.id = 'netopt-utilization-card';
    container.style.cssText = 'margin-bottom:16px;';
    allocCard.parentNode.insertBefore(container, allocCard);
  }

  if (!r || !r.utilization) { container.innerHTML = ''; return; }

  var feasIcon = r.feasibility === 'green' ? '&#x1f7e2;' : r.feasibility === 'yellow' ? '&#x1f7e1;' : '&#x1f534;';
  var feasLabel = r.feasibility === 'green' ? 'All facilities within capacity' :
                  r.feasibility === 'yellow' ? 'Some facilities nearing capacity (80-100%)' :
                  'Capacity exceeded — network infeasible';

  var html = '<div style="background:#fff;border:1px solid var(--ies-gray-200);border-radius:10px;padding:16px;border-left:3px solid ' +
    (r.feasibility === 'green' ? '#10b981' : r.feasibility === 'yellow' ? '#f59e0b' : '#ef4444') + ';">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
  html += '<div style="font-size:11px;font-weight:700;color:var(--ies-navy);text-transform:uppercase;letter-spacing:.6px;">Facility Utilization</div>';
  html += '<div style="font-size:12px;">' + feasIcon + ' <span style="font-weight:600;">' + feasLabel + '</span></div>';
  html += '</div>';

  r.openFacilities.forEach(function(f) {
    var u = r.utilization[f.id];
    if (!u) return;
    var pct = Math.min(u.pct, 120); // cap bar display at 120%
    var barColor = u.pct <= 80 ? '#10b981' : u.pct <= 100 ? '#f59e0b' : '#ef4444';
    var capLabel = u.capacity !== Infinity ? u.capacity.toLocaleString() + 'K' : 'No limit';

    html += '<div style="margin-bottom:8px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">';
    html += '<span style="font-size:11px;font-weight:600;color:var(--ies-navy);">' + esc(f.name) + '</span>';
    html += '<span style="font-size:10px;color:var(--ies-gray-500);">' + (u.volume || 0).toLocaleString() + 'K / ' + capLabel + ' (' + fmtNum(u.pct, 0) + '%)</span>';
    html += '</div>';
    html += '<div style="height:10px;background:#f1f3f5;border-radius:5px;overflow:hidden;">';
    html += '<div style="height:100%;width:' + Math.min(pct, 100) + '%;background:' + barColor + ';border-radius:5px;transition:width .3s;"></div>';
    html += '</div></div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

// Switch active scenario when user clicks a row in the comparison table
function netoptSelectScenario(idx) {
  var allScenarios = netoptState.results ? netoptState.results.allScenarios : null;
  if (!allScenarios || !allScenarios[idx]) return;

  var scenario = allScenarios[idx];
  netoptState.selectedScenarioIdx = idx;

  // Update the active results to reflect the selected scenario (keep allScenarios intact)
  var prevAll = netoptState.results.allScenarios;
  var prevMode = netoptState.results.solverMode;
  var prevTime = netoptState.results.solveTimeMs;
  var prevBestCost = netoptState.results.bestCostIdx;
  var prevBestService = netoptState.results.bestServiceIdx;
  netoptState.results = scenario;
  netoptState.results.allScenarios = prevAll;
  netoptState.results.solverMode = prevMode;
  netoptState.results.solveTimeMs = prevTime;
  netoptState.results.bestCostIdx = prevBestCost;
  netoptState.results.bestServiceIdx = prevBestService;

  // Re-render everything for the selected scenario
  netoptRenderResults();
  netoptUpdateKPI();
  if (netoptState.mapInitialized) netoptRenderMap();
}

// Initialize map (lazy load on first Results tab view)
function netoptInitializeMap() {
  if (netoptState.mapInitialized) return;

  var mapDiv = document.getElementById('netopt-map');
  if (!mapDiv || !mapDiv.offsetParent) return; // Not visible

  var centerLat = 39.8283, centerLng = -98.5795; // US center
  netoptState.netoptMap = L.map('netopt-map').setView([centerLat, centerLng], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(netoptState.netoptMap);

  netoptRenderMap();
  netoptState.mapInitialized = true;
}

// Render map visualization
function netoptRenderMap() {
  if (!netoptState.netoptMap || !netoptState.results) return;

  var mode = netoptState.mapMode || 'markers';
  var showMarkers = (mode === 'markers' || mode === 'both');
  var showZones = (mode === 'zones');

  // Clear old layers
  netoptState.mapMarkers.forEach(m => m.remove());
  netoptState.mapPolylines.forEach(p => p.remove());
  netoptState.zoneLayers.forEach(z => z.remove());
  netoptState.mapMarkers = [];
  netoptState.mapPolylines = [];
  netoptState.zoneLayers = [];

  var r = netoptState.results;

  // Draw service zones FIRST (behind everything)
  if (showZones) {
    netoptDrawServiceZones(r.openFacilities);
  }

  // Always draw facilities (they're the solver output — always relevant)
  r.openFacilities.forEach(f => {
    var marker = L.circleMarker([f.lat, f.lng], {
      radius: 10,
      fillColor: '#10b981',
      color: '#fff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(netoptState.netoptMap);
    marker.bindPopup('<strong>' + f.name + '</strong><br>Open Facility');
    netoptState.mapMarkers.push(marker);
  });

  if (showMarkers) {
    // B4: Enhanced flow visualization using demandAssignments
    var facColors = ['#0047ab', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    var facColorMap = {};
    r.openFacilities.forEach(function(f, fi) { facColorMap[f.id] = facColors[fi % facColors.length]; });

    // Find max volume for width scaling
    var assignments = r.demandAssignments || [];
    var maxFlowVol = 1;
    assignments.forEach(function(a) { if (a.volume > maxFlowVol) maxFlowVol = a.volume; });

    // Draw demand points
    netoptState.demands.forEach(function(d) {
      if (!d.lat || !d.lng) return;
      var marker = L.circleMarker([d.lat, d.lng], {
        radius: 5,
        fillColor: '#0047ab',
        color: '#fff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(netoptState.netoptMap);
      marker.bindPopup('<strong>' + esc(d.city) + '</strong><br>' + d.volume + 'K units');
      netoptState.mapMarkers.push(marker);
    });

    // B4: Draw flow lines from demand-to-facility assignments
    assignments.forEach(function(a) {
      if (!a.demandLat || !a.demandLng || !a.facilityLat || !a.facilityLng) return;
      var lineColor = facColorMap[a.facilityId] || 'rgba(0,71,171,.5)';
      var lineWidth = 1 + (a.volume / maxFlowVol) * 5; // 1px to 6px
      var isLongDist = a.distance > 500;
      var dashArray = isLongDist ? '8, 5' : null;
      var costStr = a.transportCost ? '$' + (a.transportCost * 1000000).toLocaleString('en-US', {maximumFractionDigits:0}) : '—';

      var polyline = L.polyline([[a.demandLat, a.demandLng], [a.facilityLat, a.facilityLng]], {
        color: lineColor,
        weight: Math.min(lineWidth, 6),
        opacity: 0.55,
        dashArray: dashArray
      }).addTo(netoptState.netoptMap);

      polyline.bindTooltip(
        '<strong>' + esc(a.demandCity) + '</strong> → <strong>' + esc(a.facilityName) + '</strong><br>' +
        a.volume.toLocaleString() + 'K units · ' + Math.round(a.distance) + ' mi · ' + costStr,
        { sticky: true, className: 'netopt-flow-tooltip' }
      );
      netoptState.mapPolylines.push(polyline);
    });

    // B4: Flow legend
    netoptRenderFlowLegend(r.openFacilities, facColorMap);
  }

  // In zones mode, also show demand dots (small, semi-transparent) for context
  if (showZones) {
    netoptState.demands.forEach(d => {
      if (!d.lat || !d.lng) return;
      var marker = L.circleMarker([d.lat, d.lng], {
        radius: 3,
        fillColor: '#1c1c2e',
        color: 'transparent',
        weight: 0,
        fillOpacity: 0.35
      }).addTo(netoptState.netoptMap);
      marker.bindPopup('<strong>' + d.city + '</strong><br>' + d.volume + 'K units');
      netoptState.mapMarkers.push(marker);
    });
  }

  // Update heatmap layer
  netoptUpdateHeatLayer();
}

// B4: Flow legend on the map
function netoptRenderFlowLegend(facilities, colorMap) {
  // Remove existing legend if any
  if (netoptState._flowLegend) {
    netoptState.netoptMap.removeControl(netoptState._flowLegend);
    netoptState._flowLegend = null;
  }
  if (!facilities || facilities.length === 0) return;

  var legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function() {
    var div = L.DomUtil.create('div', 'netopt-flow-legend');
    div.style.cssText = 'background:rgba(255,255,255,.92);padding:8px 12px;border-radius:8px;font-size:10px;box-shadow:0 2px 8px rgba(0,0,0,.15);max-width:180px;';
    var html = '<div style="font-weight:700;margin-bottom:4px;color:#1c1c2e;">Facility Flows</div>';
    facilities.forEach(function(f) {
      var color = colorMap[f.id] || '#0047ab';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">' +
        '<div style="width:16px;height:3px;background:' + color + ';border-radius:2px;"></div>' +
        '<span>' + esc(f.name) + '</span></div>';
    });
    html += '<div style="margin-top:4px;border-top:1px solid #e5e7eb;padding-top:4px;color:#6b7280;">';
    html += '<div style="display:flex;align-items:center;gap:6px;"><span style="border-bottom:2px solid #999;width:16px;display:inline-block;"></span> &lt;500mi</div>';
    html += '<div style="display:flex;align-items:center;gap:6px;"><span style="border-bottom:2px dashed #999;width:16px;display:inline-block;"></span> &gt;500mi</div>';
    html += '</div>';
    div.innerHTML = html;
    return div;
  };
  legend.addTo(netoptState.netoptMap);
  netoptState._flowLegend = legend;
}

// ── SERVICE ZONE CIRCLES ──
function netoptGetDeliveryDayThresholds() {
  // Compute max road-distance (miles) for each delivery day bucket
  // Using the same logic as the solver's transit-day calculation
  var transport = netoptState.transport || {};
  var truckSpeed = transport.truckSpeedMiPerDay || 500;
  var mix = transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };
  var groundPct = (mix.tl || 0) + (mix.ltl || 0);
  var parcelPct = mix.parcel || 0;
  var totalPct = groundPct + parcelPct;
  if (totalPct === 0) { groundPct = 1; totalPct = 1; }

  // Thresholds must match the solver's transit day calculation:
  // Ground: <=150mi = 1 day, then ceil(dist/speed)+1
  // Parcel: <=50mi = 1 day, <=150mi = 2 day, <=400mi = 3 day, <=800mi = 4 day
  // Blend by mode mix

  var thresholds = []; // [{day: 1, maxMiles: X}, ...]
  for (var day = 1; day <= 5; day++) {
    // Ground: 1 day ≤ 150mi; 2 day ≤ 500mi; 3 day ≤ 1000mi; etc.
    var groundMax;
    if (day <= 1) groundMax = 150;
    else groundMax = (day - 1) * truckSpeed;
    // Parcel: zone-based brackets (matching solver)
    var parcelMax;
    if (day <= 1) parcelMax = 50;
    else if (day <= 2) parcelMax = 150;
    else if (day <= 3) parcelMax = 400;
    else if (day <= 4) parcelMax = 800;
    else parcelMax = 1200; // 5+ day outer ring

    // Weighted blend
    var blended = totalPct > 0
      ? (groundMax * groundPct + parcelMax * parcelPct) / totalPct
      : groundMax;

    if (blended > 0) {
      thresholds.push({ day: day, maxMiles: blended });
    }
  }
  return thresholds;
}

// Simplified continental US boundary for zone clipping (~45 points)
var CONUS_BOUNDARY = [
  [49.0,-124.7],[48.0,-123.0],[46.3,-124.1],[43.0,-124.4],[40.0,-124.3],[38.0,-123.0],
  [35.0,-120.5],[33.5,-118.5],[32.6,-117.1],[32.5,-114.7],[31.3,-111.1],[31.3,-108.2],
  [31.8,-106.4],[29.4,-103.2],[26.0,-97.2],[27.8,-96.8],[29.0,-95.0],[29.5,-93.5],
  [29.8,-90.0],[30.0,-88.0],[30.2,-85.5],[29.9,-84.0],[25.0,-80.5],[27.0,-80.0],
  [30.3,-81.2],[32.0,-80.8],[34.5,-77.0],[36.5,-75.5],[37.5,-75.5],[38.5,-75.0],
  [39.5,-74.0],[40.5,-74.0],[41.0,-72.0],[41.5,-70.5],[42.0,-70.0],[43.5,-70.0],
  [44.5,-67.0],[47.0,-67.8],[47.5,-69.0],[45.0,-71.5],[45.0,-74.8],[43.5,-79.0],
  [42.0,-83.0],[41.5,-84.8],[46.5,-84.5],[48.0,-88.0],[46.8,-90.8],[46.8,-92.0],
  [49.0,-95.0],[49.0,-124.7]
];

function netoptPointInConus(lat, lng) {
  var inside = false;
  for (var i = 0, j = CONUS_BOUNDARY.length - 1; i < CONUS_BOUNDARY.length; j = i++) {
    var xi = CONUS_BOUNDARY[i][1], yi = CONUS_BOUNDARY[i][0];
    var xj = CONUS_BOUNDARY[j][1], yj = CONUS_BOUNDARY[j][0];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function netoptMakeClippedZone(centerLat, centerLng, radiusMiles) {
  var pts = [];
  var R = 3959;
  var numPts = 72;
  for (var a = 0; a < 360; a += (360 / numPts)) {
    var rad = a * Math.PI / 180;
    var latR = centerLat * Math.PI / 180;
    var lngR = centerLng * Math.PI / 180;
    var d = radiusMiles / R;
    var newLat = Math.asin(Math.sin(latR) * Math.cos(d) + Math.cos(latR) * Math.sin(d) * Math.cos(rad));
    var newLng = lngR + Math.atan2(Math.sin(rad) * Math.sin(d) * Math.cos(latR), Math.cos(d) - Math.sin(latR) * Math.sin(newLat));
    var lat = newLat * 180 / Math.PI;
    var lng = newLng * 180 / Math.PI;
    if (netoptPointInConus(lat, lng)) {
      pts.push([lat, lng]);
    } else {
      // Snap to nearest CONUS boundary point
      var bestDist = Infinity, bestPt = null;
      for (var bi = 0; bi < CONUS_BOUNDARY.length; bi++) {
        var bd = (lat - CONUS_BOUNDARY[bi][0]) * (lat - CONUS_BOUNDARY[bi][0]) + (lng - CONUS_BOUNDARY[bi][1]) * (lng - CONUS_BOUNDARY[bi][1]);
        if (bd < bestDist) { bestDist = bd; bestPt = CONUS_BOUNDARY[bi]; }
      }
      if (bestPt) pts.push([bestPt[0], bestPt[1]]);
    }
  }
  return pts;
}

function netoptDrawServiceZones(openFacilities) {
  if (!netoptState.netoptMap || !openFacilities || openFacilities.length === 0) return;
  if (netoptState._zoneLegend) { netoptState._zoneLegend.remove(); netoptState._zoneLegend = null; }

  var thresholds = netoptGetDeliveryDayThresholds();

  // Distinct colors: saturated border + pastel fill for clear differentiation
  var zoneStyles = [
    { day: 5, color: '#dc2626', fill: '#fecaca', label: '5+ Day' },
    { day: 4, color: '#ea580c', fill: '#fed7aa', label: '4 Day' },
    { day: 3, color: '#ca8a04', fill: '#fef08a', label: '3 Day' },
    { day: 2, color: '#2563eb', fill: '#bfdbfe', label: '2 Day' },
    { day: 1, color: '#059669', fill: '#a7f3d0', label: '1 Day' }
  ];

  // Draw outermost first, inner zones overlay on top
  zoneStyles.forEach(function(zs) {
    var th = thresholds.find(function(t) { return t.day === zs.day; });
    if (!th || th.maxMiles <= 0) return;

    openFacilities.forEach(function(f) {
      if (!f.lat || !f.lng) return;

      var pts = netoptMakeClippedZone(f.lat, f.lng, th.maxMiles);
      if (pts.length < 3) return;

      var polygon = L.polygon(pts, {
        fillColor: zs.fill,
        fillOpacity: 0.5,
        color: zs.color,
        weight: 2,
        opacity: 0.8
      }).addTo(netoptState.netoptMap);

      polygon.bindPopup('<strong>' + f.name + '</strong><br>' + zs.label + ' delivery zone<br>' + fmtNum(th.maxMiles, 0) + ' mi radius');
      netoptState.zoneLayers.push(polygon);
    });
  });

  // Add a small legend overlay in the bottom-right of the map
  var legendId = 'netopt-zone-legend';
  var existing = document.getElementById(legendId);
  if (existing) existing.remove();

  var legend = L.control({ position: 'bottomright' });
  legend.onAdd = function() {
    var div = document.createElement('div');
    div.id = legendId;
    div.style.cssText = 'background:rgba(255,255,255,.92);backdrop-filter:blur(4px);padding:8px 12px;border-radius:8px;font-size:10px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.15);line-height:1.7;';
    div.innerHTML =
      '<div style="font-weight:700;font-size:11px;margin-bottom:4px;color:var(--ies-navy);">Delivery Zones</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#a7f3d0;border:1.5px solid #059669;margin-right:6px;vertical-align:-2px;"></span>1 Day</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#bfdbfe;border:1.5px solid #2563eb;margin-right:6px;vertical-align:-2px;"></span>2 Day</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#fef08a;border:1.5px solid #ca8a04;margin-right:6px;vertical-align:-2px;"></span>3 Day</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#fed7aa;border:1.5px solid #ea580c;margin-right:6px;vertical-align:-2px;"></span>4 Day</div>' +
      '<div><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#fecaca;border:1.5px solid #dc2626;margin-right:6px;vertical-align:-2px;"></span>5+ Day</div>';
    return div;
  };
  legend.addTo(netoptState.netoptMap);
  // Store legend control so we can remove it when switching modes
  netoptState._zoneLegend = legend;
}

// Override netoptUpdateHeatLayer to also clean up zone legend when not in zones mode

// ── INTELLIGENT RECOMMENDATION ENGINE ──
function netoptRenderRecommendation(r) {
  var panel = document.getElementById('netopt-recommendation-panel');
  if (!panel || !r || !r.allScenarios || r.allScenarios.length === 0) return;

  var scenarios = r.allScenarios;
  var bestCostIdx = r.bestCostIdx != null ? r.bestCostIdx : 0;
  var bestServiceIdx = r.bestServiceIdx != null ? r.bestServiceIdx : scenarios.length - 1;
  var costScen = scenarios[bestCostIdx];
  var serviceScen = scenarios[bestServiceIdx];
  var sameScenario = (bestCostIdx === bestServiceIdx);
  var totalVol = netoptState.demands.reduce(function(s, d) { return s + d.volume; }, 0);
  var solverLabel = r.solverMode === 'exact' ? 'Exact solver' : 'Heuristic solver';

  // Analyze trade-off
  var costDelta = serviceScen.totalCost - costScen.totalCost;
  var costDeltaPct = costScen.totalCost > 0 ? (costDelta / costScen.totalCost * 100) : 0;
  var daysDelta = costScen.avgDeliveryDays - serviceScen.avgDeliveryDays;
  var twoDayImprove = (serviceScen.dayPct.d1 + serviceScen.dayPct.d2) - (costScen.dayPct.d1 + costScen.dayPct.d2);

  // Find balanced scenario: best cost-per-day-improvement ratio
  var balancedIdx = bestCostIdx;
  if (!sameScenario && scenarios.length > 2) {
    var bestRatio = Infinity;
    for (var si = 0; si < scenarios.length; si++) {
      if (si === bestCostIdx) continue;
      var extraCost = scenarios[si].totalCost - costScen.totalCost;
      var daysGained = costScen.avgDeliveryDays - scenarios[si].avgDeliveryDays;
      if (daysGained > 0.05) {
        var ratio = extraCost / daysGained; // $/day improved
        // Penalize if diminishing returns (less improvement per $)
        var twoDayGained = (scenarios[si].dayPct.d1 + scenarios[si].dayPct.d2) - (costScen.dayPct.d1 + costScen.dayPct.d2);
        var serviceScore = daysGained + (twoDayGained / 50); // bonus for 2-day coverage
        var adjRatio = extraCost / serviceScore;
        if (adjRatio < bestRatio) {
          bestRatio = adjRatio;
          balancedIdx = si;
        }
      }
    }
  }
  var balancedScen = scenarios[balancedIdx];
  var hasBalanced = !sameScenario && balancedIdx !== bestCostIdx && balancedIdx !== bestServiceIdx;

  // Determine what to recommend and why
  var recIdx, recRationale, recType;

  if (sameScenario) {
    // Same scenario is both cheapest and fastest — easy call
    recIdx = bestCostIdx;
    recType = 'optimal';
    recRationale = 'This configuration is both the lowest cost and fastest delivery option — it dominates all other scenarios.';
  } else if (costDeltaPct < 8 && daysDelta > 0.3) {
    // Service upgrade is cheap (<8% more cost) for meaningful improvement
    recIdx = bestServiceIdx;
    recType = 'service';
    recRationale = 'The best-service network is only ' + fmtNum(costDeltaPct, 0) + '% more expensive (' + fmtNum(costDelta, 2, '$') + 'M/yr) but improves avg delivery by ' + fmtNum(daysDelta, 1) + ' days. The marginal cost is well justified by the service improvement.';
  } else if (costDeltaPct > 30 && daysDelta < 0.5) {
    // Service upgrade is expensive for minimal improvement
    recIdx = bestCostIdx;
    recType = 'cost';
    recRationale = 'Adding facilities improves delivery by only ' + fmtNum(daysDelta, 1) + ' days but costs ' + fmtNum(costDeltaPct, 0) + '% more (' + fmtNum(costDelta, 2, '$') + 'M/yr). The cost-optimized network is recommended unless SLA requirements dictate otherwise.';
  } else if (hasBalanced) {
    // There's a meaningful middle ground
    var balCostDelta = balancedScen.totalCost - costScen.totalCost;
    var balCostPct = costScen.totalCost > 0 ? (balCostDelta / costScen.totalCost * 100) : 0;
    var balDaysGain = costScen.avgDeliveryDays - balancedScen.avgDeliveryDays;
    var bal2Day = fmtNum(balancedScen.dayPct.d1 + balancedScen.dayPct.d2, 0);
    recIdx = balancedIdx;
    recType = 'balanced';
    recRationale = 'This configuration strikes the best balance — ' + fmtNum(balCostPct, 0) + '% more than the lowest-cost option (' + fmtNum(balCostDelta, 2, '$') + 'M/yr) but ' + fmtNum(balDaysGain, 1) + ' days faster with ' + bal2Day + '% of orders within 2 days. It offers the best cost-per-day-improved ratio across all scenarios.';
  } else {
    // Default: recommend based on whether the trade-off favors cost or service
    if (costDeltaPct < 15) {
      recIdx = bestServiceIdx;
      recType = 'service';
      recRationale = 'For ' + fmtNum(costDeltaPct, 0) + '% additional cost (' + fmtNum(costDelta, 2, '$') + 'M/yr), the service-optimized network delivers ' + fmtNum(daysDelta, 1) + ' fewer avg days with ' + fmtNum(twoDayImprove, 0) + ' percentage points more orders in the 2-day window.';
    } else {
      recIdx = bestCostIdx;
      recType = 'cost';
      recRationale = 'The service upgrade costs ' + fmtNum(costDeltaPct, 0) + '% more (' + fmtNum(costDelta, 2, '$') + 'M/yr) for ' + fmtNum(daysDelta, 1) + ' days improvement. The cost-optimized network is recommended unless faster delivery is a competitive requirement.';
    }
  }

  var recScen = scenarios[recIdx];
  var recFacNames = recScen.openFacilities.map(function(f) { return esc(f.name); }).join(', ');
  var rec2Day = fmtNum(recScen.dayPct.d1 + recScen.dayPct.d2, 0);

  // Determine badge color/label based on recommendation type
  var badgeColor, badgeLabel;
  if (recType === 'optimal') { badgeColor = '#10b981'; badgeLabel = 'OPTIMAL'; }
  else if (recType === 'balanced') { badgeColor = '#8b5cf6'; badgeLabel = 'BALANCED'; }
  else if (recType === 'service') { badgeColor = '#3b82f6'; badgeLabel = 'SERVICE-DRIVEN'; }
  else { badgeColor = '#10b981'; badgeLabel = 'COST-DRIVEN'; }

  // Build the panel HTML
  var html = '';

  // Main recommendation
  html += '<div style="background:linear-gradient(135deg,#f8fafc,#f0f4ff);padding:16px 18px 14px;">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">';
  html += '<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" stroke="' + badgeColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="' + badgeColor + '" stroke-width="2"/></svg>';
  html += '<span style="font-weight:700;color:' + badgeColor + ';font-size:13px;">RECOMMENDED</span>';
  html += '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:' + badgeColor + '18;color:' + badgeColor + ';letter-spacing:.5px;">' + badgeLabel + '</span>';
  html += '<span style="margin-left:auto;font-size:10px;color:var(--ies-gray-400);">' + solverLabel + '</span>';
  html += '</div>';

  // Key metrics row
  html += '<div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;">';
  var metrics = [
    { label: 'Facilities', value: recScen.openFacilities.length + ' DCs' },
    { label: 'Total Cost', value: fmtNum(recScen.totalCost, 2, '$') + 'M/yr' },
    { label: 'Avg Delivery', value: fmtNum(recScen.avgDeliveryDays, 1) + ' days' },
    { label: '≤2 Day', value: rec2Day + '%' }
  ];
  metrics.forEach(function(m) {
    html += '<div style="text-align:center;padding:6px 14px;background:rgba(255,255,255,.7);border-radius:6px;border:1px solid rgba(0,0,0,.04);">';
    html += '<div style="font-size:16px;font-weight:800;color:var(--ies-navy);">' + m.value + '</div>';
    html += '<div style="font-size:9px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;letter-spacing:.4px;">' + m.label + '</div>';
    html += '</div>';
  });
  html += '</div>';

  html += '<div style="font-size:12px;color:var(--ies-gray-600);line-height:1.6;">';
  html += '<strong>' + recScen.openFacilities.length + '-DC network:</strong> ' + recFacNames + '. ';
  html += recRationale;
  html += '</div>';
  html += '</div>';

  // If cost and service are different, show the comparison strip
  if (!sameScenario) {
    html += '<div style="display:flex;border-top:1px solid rgba(0,0,0,.06);font-size:11px;">';

    // Cost-optimal mini card
    var cFacs = costScen.openFacilities.map(function(f) { return esc(f.name); }).join(', ');
    var c2Day = fmtNum(costScen.dayPct.d1 + costScen.dayPct.d2, 0);
    html += '<div style="flex:1;padding:10px 16px;border-right:1px solid rgba(0,0,0,.06);' + (recIdx === bestCostIdx ? 'background:rgba(16,185,129,.04);' : '') + '">';
    html += '<div style="font-weight:700;color:#059669;font-size:10px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">';
    html += '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#10b981;margin-right:4px;vertical-align:0px;"></span>Lowest Cost</div>';
    html += '<div style="color:var(--ies-navy);font-weight:600;">' + costScen.openFacilities.length + ' DCs — ' + fmtNum(costScen.totalCost, 2, '$') + 'M/yr</div>';
    html += '<div style="color:var(--ies-gray-500);font-size:10px;">' + cFacs + '</div>';
    html += '<div style="color:var(--ies-gray-500);font-size:10px;">' + fmtNum(costScen.avgDeliveryDays, 1) + ' avg days &middot; ' + c2Day + '% ≤2 day</div>';
    html += '</div>';

    // Service-optimal mini card
    var sFacs = serviceScen.openFacilities.map(function(f) { return esc(f.name); }).join(', ');
    var s2Day = fmtNum(serviceScen.dayPct.d1 + serviceScen.dayPct.d2, 0);
    html += '<div style="flex:1;padding:10px 16px;' + (recIdx === bestServiceIdx ? 'background:rgba(59,130,246,.04);' : '') + '">';
    html += '<div style="font-weight:700;color:#2563eb;font-size:10px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">';
    html += '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#3b82f6;margin-right:4px;vertical-align:0px;"></span>Best Service</div>';
    html += '<div style="color:var(--ies-navy);font-weight:600;">' + serviceScen.openFacilities.length + ' DCs — ' + fmtNum(serviceScen.totalCost, 2, '$') + 'M/yr</div>';
    html += '<div style="color:var(--ies-gray-500);font-size:10px;">' + sFacs + '</div>';
    html += '<div style="color:var(--ies-gray-500);font-size:10px;">' + fmtNum(serviceScen.avgDeliveryDays, 1) + ' avg days &middot; ' + s2Day + '% ≤2 day</div>';
    html += '</div>';

    html += '</div>';
  }

  panel.innerHTML = html;
}

// ── NETOPT HEATMAP ──

function netoptSetMapMode(mode) {
  netoptState.mapMode = mode;
  // Remove zone legend if leaving zones mode
  if (mode !== 'zones' && netoptState._zoneLegend) {
    netoptState._zoneLegend.remove();
    netoptState._zoneLegend = null;
  }
  // Update toggle button styles
  ['markers', 'heat', 'both', 'zones'].forEach(function(m) {
    var btn = document.getElementById('netopt-map-mode-' + m);
    if (!btn) return;
    if (m === mode) {
      btn.style.background = 'var(--ies-blue)';
      btn.style.color = '#fff';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--ies-gray-600,#4b5563)';
    }
  });
  netoptRenderMap();
}

function netoptBuildHeatData() {
  // Build [lat, lng, intensity] array from demand points
  // Use square-root scaling so high-volume points dominate visually
  // while low-volume points still register as cool spots
  var heatData = [];
  var maxVol = 1;
  netoptState.demands.forEach(function(d) {
    if ((d.volume || 0) > maxVol) maxVol = d.volume;
  });
  var sqrtMax = Math.sqrt(maxVol);
  netoptState.demands.forEach(function(d) {
    if (!d.lat || !d.lng) return;
    var vol = d.volume || 1;
    // Square-root scaling spreads the range: a 320K point vs a 50K point
    // becomes 0.97 vs 0.38 instead of linear 1.0 vs 0.16
    var intensity = Math.sqrt(vol) / sqrtMax;
    // Floor at 0.08 so even tiny demand shows as a cool spot
    intensity = Math.max(0.08, intensity);
    heatData.push([d.lat, d.lng, intensity]);
  });
  return heatData;
}

function netoptUpdateHeatLayer() {
  if (!netoptState.netoptMap) return;
  var show = (netoptState.mapMode === 'heat' || netoptState.mapMode === 'both');

  // Remove old heat layer
  if (netoptState.heatLayer) {
    netoptState.netoptMap.removeLayer(netoptState.heatLayer);
    netoptState.heatLayer = null;
  }

  if (!show) return;

  var heatData = netoptBuildHeatData();
  if (heatData.length === 0) return;

  // Create heat layer with tuned settings for US-scale network view
  // Larger radius + moderate blur = overlapping demand in dense regions merges into hot zones
  netoptState.heatLayer = L.heatLayer(heatData, {
    radius: 45,
    blur: 30,
    maxZoom: 10,
    max: 1.0,
    minOpacity: 0.15,
    gradient: {
      0.0:  '#3b4cc0',
      0.1:  '#5977e3',
      0.2:  '#7b9ff9',
      0.3:  '#9ebeff',
      0.4:  '#c0d4f5',
      0.5:  '#f2cbb7',
      0.6:  '#f0a582',
      0.7:  '#e67a5b',
      0.8:  '#d1462f',
      0.9:  '#b40426',
      1.0:  '#8b0000'
    }
  }).addTo(netoptState.netoptMap);
}

// ── NETOPT ENHANCEMENT 1: CSV EXPORT ──
function netoptExportResults() {
  var r = netoptState.results;
  if (!r) { alert('Run optimization first'); return; }

  var csv = 'Network Optimization Results Export\n';
  csv += 'Generated,' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '\n';
  csv += 'Solver Mode,' + (r.solverMode || 'heuristic') + '\n';
  csv += 'Solve Time (ms),' + (r.solveTimeMs || '-') + '\n\n';

  // Section 1: Summary
  csv += '--- SUMMARY ---\n';
  csv += 'Metric,Value\n';
  csv += 'Total Annual Cost ($M),' + r.totalCost.toFixed(2) + '\n';
  csv += 'Facility Count,' + r.openFacilities.length + '\n';
  csv += 'Service Level (%),' + (r.serviceLevel ? r.serviceLevel.toFixed(1) : '-') + '\n';
  csv += 'Avg Delivery Days,' + (r.avgDeliveryDays ? r.avgDeliveryDays.toFixed(1) : '-') + '\n';
  csv += 'Avg Distance (mi),' + (r.avgDistance ? r.avgDistance.toFixed(0) : '-') + '\n';
  csv += 'Feasibility,' + (r.feasibility || 'green') + '\n\n';

  // Section 2: Scenario Comparison
  csv += '--- SCENARIO COMPARISON ---\n';
  csv += 'Num DCs,Total Cost ($M),Fixed ($M),Transport ($M),Avg Distance (mi),Service %,Avg Days,Delta vs 1DC %,Feasibility,Verdict\n';
  if (r.allScenarios) {
    var baseline = r.allScenarios[0];
    r.allScenarios.forEach(function(s, i) {
      var verdict = '';
      if (s._isBestCost) verdict = 'BEST COST';
      if (s._isBestService) verdict = (verdict ? verdict + '/' : '') + 'BEST SERVICE';
      var delta = baseline && baseline.totalCost > 0 ? ((s.totalCost - baseline.totalCost) / baseline.totalCost * 100).toFixed(1) : '0';
      csv += s.openFacilities.length + ',' + s.totalCost.toFixed(2) + ',' + s.fixedCostM.toFixed(2) + ',' + s.transportCostM.toFixed(2);
      csv += ',' + (s.avgDistance ? s.avgDistance.toFixed(0) : '-') + ',' + (s.serviceLevel ? s.serviceLevel.toFixed(1) : '-');
      csv += ',' + (s.avgDeliveryDays ? s.avgDeliveryDays.toFixed(1) : '-') + ',' + delta + ',' + (s.feasibility || 'green') + ',' + (verdict || '-') + '\n';
    });
  }

  // Section 3: Facility Detail with utilization
  csv += '\n--- FACILITY DETAIL ---\n';
  csv += 'Name,City,Status,Capacity (K),Fixed Cost ($M),Var Cost ($/unit),Assigned Volume (K),Utilization %\n';
  r.openFacilities.forEach(function(f) {
    var vol = r.assignedVolume && r.assignedVolume[f.id] ? r.assignedVolume[f.id] : 0;
    var util = r.utilization && r.utilization[f.id] ? r.utilization[f.id].pct : 0;
    csv += f.name + ',' + f.city + ',Open,' + (f.capacity || '-') + ',' + (f.fixedCost || 0).toFixed(2);
    csv += ',' + (f.varCost || 0).toFixed(3) + ',' + vol.toFixed(0) + ',' + util.toFixed(1) + '\n';
  });

  // Section 4: Demand Allocation (from demandAssignments)
  csv += '\n--- DEMAND ALLOCATION ---\n';
  csv += 'Demand City,Volume (K),Assigned Facility,Distance (mi),Transport Cost ($),Delivery Days\n';
  var assignments = r.demandAssignments || [];
  if (assignments.length > 0) {
    assignments.forEach(function(a) {
      csv += a.demandCity + ',' + a.volume.toFixed(0) + ',' + a.facilityName + ',' + Math.round(a.distance);
      csv += ',' + (a.transportCost ? (a.transportCost * 1000000).toFixed(0) : '0') + ',' + (a.transitDays ? a.transitDays.toFixed(1) : '-') + '\n';
    });
  }

  // Section 5: Cost Breakdown
  csv += '\n--- COST BREAKDOWN ---\n';
  csv += 'Component,Amount ($M)\n';
  csv += 'Facility Fixed Costs,' + r.fixedCostM.toFixed(2) + '\n';
  csv += 'Outbound Transport,' + r.transportCostM.toFixed(2) + '\n';
  csv += 'Inbound Transport,' + (r.inboundCostM || 0).toFixed(2) + '\n';
  csv += 'Variable Handling,' + r.varCostM.toFixed(2) + '\n';
  csv += 'Inventory Carrying,' + r.inventoryCostM.toFixed(2) + '\n';
  csv += 'TOTAL ANNUAL COST,' + r.totalCost.toFixed(2) + '\n';

  // Section 6: Service Profile
  csv += '\n--- SERVICE PROFILE ---\n';
  csv += 'Delivery Window,Volume %\n';
  if (r.dayPct) {
    csv += '1-Day,' + r.dayPct.d1.toFixed(1) + '\n';
    csv += '2-Day,' + r.dayPct.d2.toFixed(1) + '\n';
    csv += '3-Day,' + r.dayPct.d3.toFixed(1) + '\n';
    csv += '4-Day,' + r.dayPct.d4.toFixed(1) + '\n';
    csv += '5+ Day,' + r.dayPct.d5plus.toFixed(1) + '\n';
  }

  // Section 7: Sensitivity Data (if available)
  if (netoptState.sensitivityData) {
    csv += '\n--- SENSITIVITY ANALYSIS ---\n';
    csv += 'Parameter,-20%,-10%,Base,+10%,+20%\n';
    netoptState.sensitivityData.forEach(function(s) {
      csv += s.label + ',' + s.values.map(function(v) { return v.toFixed(2); }).join(',') + '\n';
    });
  }

  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'netopt_results_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
}

// ── NETOPT ENHANCEMENT 2: SENSITIVITY ANALYSIS ──
function netoptRunSensitivityAnalysis() {
  var r = netoptState.results;
  if (!r) { alert('Run optimization first'); return; }

  var loadingEl = document.getElementById('netopt-sensitivity-loading');
  var emptyEl = document.getElementById('netopt-sensitivity-empty');
  var containerEl = document.getElementById('netopt-sensitivity-chart-container');

  if (loadingEl) loadingEl.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';
  if (containerEl) containerEl.style.display = 'none';

  // Run sensitivity analysis asynchronously
  setTimeout(function() {
    var baseCost = r.totalCost;
    var results = [];

    // Test parameter variations: -20%, -10%, base, +10%, +20%
    var variations = [-0.20, -0.10, 0, 0.10, 0.20];

    // 1. Demand volume sensitivity
    var demandImpacts = [];
    variations.forEach(function(pct) {
      var testDemands = netoptState.demands.map(function(d) {
        return { ...d, volume: d.volume * (1 + pct) };
      });
      var testResult = netoptEvaluateConfig(r.openFacilities, testDemands, netoptState.transport, netoptState.constraints);
      demandImpacts.push(testResult.totalCost);
    });
    results.push({ name: 'Demand Volume', impacts: demandImpacts, base: baseCost });

    // 2. Transportation cost rate sensitivity
    var transportImpacts = [];
    variations.forEach(function(pct) {
      var testTransport = { ...netoptState.transport };
      testTransport.outboundPerUnitMile = testTransport.outboundPerUnitMile * (1 + pct);
      testTransport.inboundPerUnitMile = testTransport.inboundPerUnitMile * (1 + pct);
      var testResult = netoptEvaluateConfig(r.openFacilities, netoptState.demands, testTransport, netoptState.constraints);
      transportImpacts.push(testResult.totalCost);
    });
    results.push({ name: 'Transport Rate', impacts: transportImpacts, base: baseCost });

    // 3. Facility fixed costs sensitivity
    var facilityImpacts = [];
    variations.forEach(function(pct) {
      var testFacilities = r.openFacilities.map(function(f) {
        return { ...f, fixedCost: f.fixedCost * (1 + pct) };
      });
      var testResult = netoptEvaluateConfig(testFacilities, netoptState.demands, netoptState.transport, netoptState.constraints);
      facilityImpacts.push(testResult.totalCost);
    });
    results.push({ name: 'Facility Fixed Costs', impacts: facilityImpacts, base: baseCost });

    // 4. Variable handling costs sensitivity
    var varImpacts = [];
    variations.forEach(function(pct) {
      var testFacilities = r.openFacilities.map(function(f) {
        return { ...f, varCost: f.varCost * (1 + pct) };
      });
      var testResult = netoptEvaluateConfig(testFacilities, netoptState.demands, netoptState.transport, netoptState.constraints);
      varImpacts.push(testResult.totalCost);
    });
    results.push({ name: 'Variable Handling', impacts: varImpacts, base: baseCost });

    // Render tornado chart
    netoptRenderSensitivityChart(results);

    if (loadingEl) loadingEl.style.display = 'none';
  }, 100);
}

function netoptRenderSensitivityChart(sensitivityResults) {
  if (!window.Chart) {
    alert('Chart.js not available. Please ensure Chart.js is loaded.');
    return;
  }

  var chartEl = document.getElementById('netopt-sensitivity-chart');
  var containerEl = document.getElementById('netopt-sensitivity-chart-container');
  var emptyEl = document.getElementById('netopt-sensitivity-empty');
  if (emptyEl) emptyEl.style.display = 'none';

  if (!chartEl || !containerEl) return;
  containerEl.style.display = 'block';

  // Calculate ranges for each parameter
  var labels = [];
  var lowValues = [];
  var highValues = [];
  var colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  var datasetColors = [];

  sensitivityResults.forEach(function(param, idx) {
    labels.push(param.name);
    var baseIdx = 2; // Base is at index 2 (0% variation)
    var minCost = Math.min.apply(null, param.impacts);
    var maxCost = Math.max.apply(null, param.impacts);
    var baseCost = param.impacts[baseIdx];
    lowValues.push(baseCost - minCost);
    highValues.push(maxCost - baseCost);
    datasetColors.push(colors[idx % colors.length]);
  });

  // Destroy old chart if exists
  if (chartEl.chart) {
    chartEl.chart.destroy();
  }

  // Create horizontal bar chart (tornado style)
  chartEl.chart = new Chart(chartEl, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cost Decrease',
          data: lowValues,
          backgroundColor: datasetColors.map(c => c + '80'),
          borderColor: datasetColors,
          borderWidth: 1
        },
        {
          label: 'Cost Increase',
          data: highValues,
          backgroundColor: datasetColors.map(c => c + 'cc'),
          borderColor: datasetColors,
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: 'Impact on Total Cost ($M)', font: { size: 12, weight: 'bold' } },
          ticks: { callback: function(v) { return '$' + (v/1000000).toFixed(1) + 'M'; } }
        },
        y: { stacked: true }
      },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
        title: { display: false }
      }
    }
  });
}

// ── NETOPT ENHANCEMENT 3: DEMAND-TO-FACILITY ALLOCATION TABLE ──
function netoptRenderAllocationTable() {
  var r = netoptState.results;
  if (!r || !r.openFacilities) {
    var tbody = document.getElementById('netopt-allocation-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--ies-gray-600);">No allocation data available</td></tr>';
    return;
  }

  var tbody = document.getElementById('netopt-allocation-tbody');
  tbody.innerHTML = '';

  var rows = [];
  netoptState.demands.forEach(function(d) {
    if (r.openFacilities.length === 0) return;

    var closest = r.openFacilities[0];
    var minDist = roadDist(d.lat, d.lng, closest.lat, closest.lng);
    for (var i = 1; i < r.openFacilities.length; i++) {
      var dist = roadDist(d.lat, d.lng, r.openFacilities[i].lat, r.openFacilities[i].lng);
      if (dist < minDist) {
        minDist = dist;
        closest = r.openFacilities[i];
      }
    }

    var vol = (d.volume || 0) * 1000;
    var mix = netoptState.transport.modeMix || { tl: 1, ltl: 0, parcel: 0 };
    var tlCost = vol * mix.tl * minDist * (netoptState.transport.tlUnitMile || netoptState.transport.outboundPerUnitMile || 0.0025);
    var ltlCost = vol * mix.ltl * minDist * (netoptState.transport.ltlUnitMile || netoptState.transport.outboundPerUnitMile || 0.0040);
    var parcelCost = vol * mix.parcel * (netoptState.transport.parcelUnitCost || 8.50);
    var transportCost = tlCost + ltlCost + parcelCost;

    var truckSpeed = netoptState.transport.truckSpeedMiPerDay || 500;
    var groundDays = minDist <= 150 ? 1 : Math.ceil(minDist / truckSpeed) + 1;
    var parcelDays = minDist <= 50 ? 1 : minDist <= 150 ? 2 : minDist <= 400 ? 3 : minDist <= 800 ? 4 : 5;
    var groundPct = (mix.tl || 0) + (mix.ltl || 0);
    var parcelPct = mix.parcel || 0;
    var transitDays = groundPct > 0 || parcelPct > 0
      ? (groundDays * groundPct + parcelDays * parcelPct) / (groundPct + parcelPct)
      : groundDays;
    transitDays = Math.max(1, Math.round(transitDays * 10) / 10);

    rows.push({
      demand: d.name,
      city: d.city,
      volume: d.volume || 0,
      facility: closest.name,
      distance: minDist,
      cost: transportCost,
      days: transitDays
    });
  });

  rows.forEach(function(row) {
    var tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--ies-gray-200)';
    tr.innerHTML = '<td style="padding:10px 14px;">' + esc(row.demand) + '</td>' +
      '<td style="padding:10px 14px;">' + esc(row.city) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.volume, 0) + '</td>' +
      '<td style="padding:10px 14px;">' + esc(row.facility) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.distance, 0) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.cost / 1000, 0, '$') + 'K</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.days, 1) + '</td>';
    tbody.appendChild(tr);
  });

  // Store rows for sorting
  tbody.dataset.rows = JSON.stringify(rows);
}

function netoptSortAllocationTable(btn, field) {
  var tbody = document.getElementById('netopt-allocation-tbody');
  if (!tbody.dataset.rows) return;

  var rows = JSON.parse(tbody.dataset.rows);
  var isAscending = btn.dataset.sort !== 'asc-' + field;

  if (field) {
    rows.sort(function(a, b) {
      var aVal = a[field];
      var bVal = b[field];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      return isAscending ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }

  // Update button state
  document.querySelectorAll('#netopt-allocation-table th').forEach(function(th) { th.style.fontWeight = '700'; });
  btn.style.fontWeight = '800';
  btn.dataset.sort = (isAscending ? 'asc-' : 'desc-') + (field || '');

  tbody.innerHTML = '';
  rows.forEach(function(row) {
    var tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--ies-gray-200)';
    tr.innerHTML = '<td style="padding:10px 14px;">' + esc(row.demand) + '</td>' +
      '<td style="padding:10px 14px;">' + esc(row.city) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.volume, 0) + '</td>' +
      '<td style="padding:10px 14px;">' + esc(row.facility) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.distance, 0) + '</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.cost / 1000, 0, '$') + 'K</td>' +
      '<td style="padding:10px 14px;text-align:right;">' + fmtNum(row.days, 1) + '</td>';
    tbody.appendChild(tr);
  });
}

// ═══════════════════════════════════════════════════════════════════
// WAREHOUSE SIZING → COST MODEL INTEGRATION
// ═══════════════════════════════════════════════════════════════════

function wscUseInCostModel() {
  var p = window._lastWscParams;
  if (!p) { alert('Run the calculator first.'); return; }

  // If CM project open, confirm before overwriting facility fields
  if (typeof cmApp !== 'undefined' && cmApp.projectData && cmApp.projectData.id) {
    if (!confirm('Populate facility section of "' + (cmApp.projectData.project_name || 'current project') + '" with WSC results?')) return;
  }

  // Populate CM facility fields
  var fields = {
    totalSqft: p.totalSF || '',
    clearHeight: p.clearHeightFt || '',
    dockDoors: p.totalDoors || '',
    stagingSqft: (p.recvStagingSF || 0) + (p.shipStagingSF || 0),
    officeSqft: p.officeSF || ''
  };
  Object.keys(fields).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.value = fields[id]; el.dispatchEvent(new Event('input', { bubbles: true })); }
  });

  // Navigate to Cost Model → Facility section
  if (typeof navigate === 'function') navigate('costmodel');
  if (typeof cmApp !== 'undefined') {
    setTimeout(function() {
      cmApp.updateFacilityMetrics();
      cmApp.switchSection('facility');
      cmApp.markChanged();
    }, 200);
  }
}

// ═══════════════════════════════════════════════════════════════════
// WAREHOUSE SIZING — 3D VIEW (Three.js r128) + ELEVATION VIEW
// ═══════════════════════════════════════════════════════════════════

var wscViewMode = '2d'; // '2d', '3d', 'elevation'
var wsc3dScene = null;
var wsc3dCamera = null;
var wsc3dRenderer = null;
var wsc3dAnimationId = null;
var wsc3dCameraTheta = Math.PI / 4;
var wsc3dCameraPhi = Math.PI / 5;
var wsc3dCameraDist = 600;
var wsc3dCameraTarget = null;
var wsc3dMouseDown = false;
var wsc3dMouseBtn = 0;
var wsc3dLastMouse = { x: 0, y: 0 };
var wsc3dWallMeshes = [];
var wsc3dWallsVisible = true;

function _initWsc3dTarget() {
  if (!wsc3dCameraTarget && typeof THREE !== 'undefined') {
    wsc3dCameraTarget = new THREE.Vector3(0, 0, 0);
  }
}

// ── Wall/roof toggle ──
function wsc3dToggleWalls() {
  wsc3dWallsVisible = !wsc3dWallsVisible;
  wsc3dWallMeshes.forEach(function(m) { m.visible = wsc3dWallsVisible; });
  var btn = document.getElementById('wsc-3d-walls-btn');
  if (btn) btn.textContent = wsc3dWallsVisible ? 'Hide Walls' : 'Show Walls';
}

// ── 3-way view switcher ──
function wscSetView(mode) {
  wscViewMode = mode;
  var svgEl = document.getElementById('wsc-layout-svg');
  var container3d = document.getElementById('wsc-3d-container');
  var containerElev = document.getElementById('wsc-elevation-container');
  var btn2d = document.getElementById('wsc-view-2d');
  var btn3d = document.getElementById('wsc-view-3d');
  var btnElev = document.getElementById('wsc-view-elev');
  if (!svgEl || !container3d) return;

  // Hide all
  svgEl.style.display = 'none';
  container3d.style.display = 'none';
  if (containerElev) containerElev.style.display = 'none';
  dispose3DView();

  // Reset button styles (base style + inactive, overwrite to avoid accumulation)
  var baseStyle = 'font-size:11px;padding:4px 12px;border:none;cursor:pointer;transition:.2s;';
  var activeStyle = baseStyle + 'background:rgba(59,130,246,.3);color:#93c5fd;font-weight:600;';
  var inactiveStyle = baseStyle + 'background:rgba(255,255,255,.06);color:rgba(255,255,255,.5);font-weight:400;';
  [btn2d, btn3d, btnElev].forEach(function(b) { if (b) b.style.cssText = inactiveStyle; });

  // Show/hide wall toggle button
  var wallBtn = document.getElementById('wsc-3d-walls-btn');
  if (wallBtn) wallBtn.style.display = (mode === '3d') ? 'inline-block' : 'none';

  if (mode === '3d') {
    container3d.style.display = 'block';
    if (btn3d) btn3d.style.cssText = activeStyle;
    var p = wscLastLayoutParams;
    if (p) render3DLayout(p);
  } else if (mode === 'elevation') {
    if (containerElev) containerElev.style.display = 'block';
    if (btnElev) btnElev.style.cssText = activeStyle;
    var p = wscLastLayoutParams;
    if (p) renderElevationView(p);
  } else {
    svgEl.style.display = 'block';
    if (btn2d) btn2d.style.cssText = activeStyle;
  }
}

// Keep legacy toggle working
function toggleWsc3DView() { wscSetView(wscViewMode === '3d' ? '2d' : '3d'); }

function dispose3DView() {
  if (wsc3dAnimationId) { cancelAnimationFrame(wsc3dAnimationId); wsc3dAnimationId = null; }
  if (wsc3dRenderer) {
    // Remove event listeners before disposing
    var canvas = wsc3dRenderer.domElement;
    if (canvas) {
      canvas.removeEventListener('mousedown', wsc3dOnMouseDown);
      canvas.removeEventListener('mousemove', wsc3dOnMouseMove);
      canvas.removeEventListener('mouseup', wsc3dOnMouseUp);
      canvas.removeEventListener('mouseleave', wsc3dOnMouseUp);
      canvas.removeEventListener('wheel', wsc3dOnWheel);
    }
    wsc3dRenderer.dispose();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    wsc3dRenderer = null;
  }
  if (window._wsc3dResizeHandler) {
    window.removeEventListener('resize', window._wsc3dResizeHandler);
    window._wsc3dResizeHandler = null;
  }
  // Dispose all geometries and materials to free WebGL memory
  if (wsc3dScene) {
    wsc3dScene.traverse(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { if (m.map) m.map.dispose(); m.dispose(); });
        } else {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      }
    });
  }
  wsc3dScene = null;
  wsc3dCamera = null;
  wsc3dWallMeshes = [];
  wsc3dWallsVisible = true;
}

// ── Helper: create positioned mesh ──
function _wsc3dMakeMesh(geo, mat, pos) {
  var m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ── Pallet color picker ──
function _wscPickPalletColor() {
  var colors = [0xDEB887, 0xD2B48C, 0xF5DEB3, 0xFFE4C4, 0xC8A882, 0xE8D5B7];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ── Seeded random for deterministic pallet placement ──
var _wsc3dSeed = 42;
function _wsc3dRand() {
  _wsc3dSeed = (_wsc3dSeed * 16807 + 0) % 2147483647;
  return (_wsc3dSeed & 0x7fffffff) / 2147483647;
}

// ── Build rack row with uprights, beams, pallets ──
function _wsc3dBuildRackRow(scene, x, z, length, rackLevels, clearHeight, direction, rackDepth) {
  var bayWidth = 8;
  var beamH = clearHeight / Math.max(rackLevels, 1);
  var depth = rackDepth || 4;
  var numBays = Math.max(1, Math.floor(length / bayWidth));

  var uprightMat = new THREE.MeshStandardMaterial({ color: 0x4444cc, roughness: 0.5 });
  var beamMat = new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.5 });

  for (var bay = 0; bay < numBays; bay++) {
    var bx = bay * bayWidth;
    var uprightGeo = new THREE.BoxGeometry(0.3, clearHeight, 0.3);

    // Uprights per bay — double-deep gets intermediate upright at back-to-back point
    var uprightPositions = [0, depth];
    if (depth >= 8) {
      uprightPositions = [0, depth / 2, depth];
    }
    for (var ui = 0; ui < uprightPositions.length; ui++) {
      var upright = new THREE.Mesh(uprightGeo, uprightMat);
      if (direction === 'vertical') {
        upright.position.set(x + uprightPositions[ui], clearHeight / 2, z + bx);
      } else {
        upright.position.set(x + bx, clearHeight / 2, z + uprightPositions[ui]);
      }
      upright.castShadow = true;
      scene.add(upright);
    }

    // Beams per level
    for (var lvl = 1; lvl <= rackLevels; lvl++) {
      var beamY = lvl * beamH;
      if (depth >= 8) {
        // Double-deep: two separate beams (front half + back half)
        var halfDepth = depth / 2;
        var beamGeoHalf;
        if (direction === 'vertical') {
          beamGeoHalf = new THREE.BoxGeometry(halfDepth, 0.2, 0.2);
        } else {
          beamGeoHalf = new THREE.BoxGeometry(0.2, 0.2, halfDepth);
        }
        // Front beam pair
        var bf1 = new THREE.Mesh(beamGeoHalf, beamMat);
        var bf2 = new THREE.Mesh(beamGeoHalf, beamMat);
        // Back beam pair
        var bb1 = new THREE.Mesh(beamGeoHalf, beamMat);
        var bb2 = new THREE.Mesh(beamGeoHalf, beamMat);
        if (direction === 'vertical') {
          bf1.position.set(x + halfDepth / 2, beamY, z + bx);
          bf2.position.set(x + halfDepth / 2, beamY, z + bx + bayWidth);
          bb1.position.set(x + halfDepth + halfDepth / 2, beamY, z + bx);
          bb2.position.set(x + halfDepth + halfDepth / 2, beamY, z + bx + bayWidth);
        } else {
          bf1.position.set(x + bx, beamY, z + halfDepth / 2);
          bf2.position.set(x + bx + bayWidth, beamY, z + halfDepth / 2);
          bb1.position.set(x + bx, beamY, z + halfDepth + halfDepth / 2);
          bb2.position.set(x + bx + bayWidth, beamY, z + halfDepth + halfDepth / 2);
        }
        scene.add(bf1); scene.add(bf2); scene.add(bb1); scene.add(bb2);
      } else {
        // Single-deep: one beam spanning full depth
        var beamGeo;
        if (direction === 'vertical') {
          beamGeo = new THREE.BoxGeometry(depth, 0.2, 0.2);
        } else {
          beamGeo = new THREE.BoxGeometry(0.2, 0.2, depth);
        }
        // Front beam
        var beam1 = new THREE.Mesh(beamGeo, beamMat);
        if (direction === 'vertical') {
          beam1.position.set(x + depth / 2, beamY, z + bx);
        } else {
          beam1.position.set(x + bx, beamY, z + depth / 2);
        }
        scene.add(beam1);
        // Back beam
        var beam2 = new THREE.Mesh(beamGeo, beamMat);
        if (direction === 'vertical') {
          beam2.position.set(x + depth / 2, beamY, z + bx + bayWidth);
        } else {
          beam2.position.set(x + bx + bayWidth, beamY, z + depth / 2);
        }
        scene.add(beam2);
      }

      // Pallets on this level (3 per bay)
      var palletBottom = (lvl - 1) * beamH + 0.5;
      for (var pp = 0; pp < 3; pp++) {
        if (_wsc3dRand() < 0.85) {
          var pColor = _wscPickPalletColor();
          var pMat = new THREE.MeshStandardMaterial({ color: pColor, roughness: 0.7 });
          var pH = beamH * 0.65;
          var pGeo = new THREE.BoxGeometry(2.2, pH, Math.min(depth - 0.5, 3.2));
          var pallet = new THREE.Mesh(pGeo, pMat);
          if (direction === 'vertical') {
            pallet.position.set(x + depth / 2, palletBottom + pH / 2, z + bx + 1.3 + pp * 2.5);
          } else {
            pallet.position.set(x + bx + 1.3 + pp * 2.5, palletBottom + pH / 2, z + depth / 2);
          }
          pallet.castShadow = true;
          scene.add(pallet);
        }
      }
    }
  }
}

// ── Build dock door with frame, leveler, bumpers, dock platform ──
function _wsc3dBuildDockDoor(scene, x, z, facing) {
  var frameMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5 });
  var levelerMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3, roughness: 0.4 });
  var bumperMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  var dockMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.7, metalness: 0.1 });
  var zDir = facing === 'top' ? -1 : 1;

  // Dock platform (4ft high concrete pad extending outside building)
  var platDepth = 8;
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(14, 4, platDepth), dockMat, [x, 2, z + (platDepth / 2 + 1) * zDir]));

  // Top beam (door frame at 14ft)
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(12, 1, 1), frameMat, [x, 14, z]));
  // Side posts (from dock height to top beam)
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(1, 14, 1), frameMat, [x - 5.5, 7, z]));
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(1, 14, 1), frameMat, [x + 5.5, 7, z]));
  // Dock leveler (at building floor level, extending outward)
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(10, 0.3, 6), levelerMat, [x, 4.15, z + 3 * zDir]));
  // Bumpers (at dock face, at dock height)
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(1, 2, 0.5), bumperMat, [x - 4, 3, z + 0.3 * zDir]));
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(1, 2, 0.5), bumperMat, [x + 4, 3, z + 0.3 * zDir]));
}

// ── Build truck trailer (on exterior grade, 4ft below building floor) ──
function _wsc3dBuildTrailer(scene, x, z, facing) {
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });
  var wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
  var chassisMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
  // Trailer extends AWAY from building: bottom dock → +z, top dock → -z
  var zDir = (facing === 'bottom') ? 1 : -1;
  // Exterior grade is 4ft below building floor (Y=0), so grade = Y=-4
  // Trailer floor at Y=0 (backed up level with dock), body extends up
  var body = _wsc3dMakeMesh(new THREE.BoxGeometry(8, 9.5, 40), bodyMat, [x, 4.75, z + 25 * zDir]);
  scene.add(body);
  // Chassis/undercarriage
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(6, 1, 42), chassisMat, [x, -2.5, z + 25 * zDir]));

  // Rear wheels (on exterior grade, Y=-4 + wheel radius)
  var wGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 8);
  var w1 = new THREE.Mesh(wGeo, wheelMat);
  w1.rotation.z = Math.PI / 2;
  w1.position.set(x - 4.5, -2.5, z + 35 * zDir);
  scene.add(w1);
  var w2 = new THREE.Mesh(wGeo, wheelMat);
  w2.rotation.z = Math.PI / 2;
  w2.position.set(x + 4.5, -2.5, z + 35 * zDir);
  scene.add(w2);
  // Front wheels
  var w3 = new THREE.Mesh(wGeo, wheelMat);
  w3.rotation.z = Math.PI / 2;
  w3.position.set(x - 4.5, -2.5, z + 12 * zDir);
  scene.add(w3);
  var w4 = new THREE.Mesh(wGeo, wheelMat);
  w4.rotation.z = Math.PI / 2;
  w4.position.set(x + 4.5, -2.5, z + 12 * zDir);
  scene.add(w4);
}

// ── Build forklift ──
function _wsc3dBuildForklift(scene, x, z, rotation) {
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.4 });
  var mastMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.4, roughness: 0.5 });
  var forkMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.4 });
  var wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

  var group = new THREE.Group();
  // Body
  group.add(_wsc3dMakeMesh(new THREE.BoxGeometry(4, 3, 6), bodyMat, [0, 2.5, 0]));
  // Mast
  group.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.5, 10, 0.5), mastMat, [-1.5, 5, 3.5]));
  group.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.5, 10, 0.5), mastMat, [1.5, 5, 3.5]));
  // Forks
  group.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.3, 0.2, 4), forkMat, [-0.8, 0.5, 5]));
  group.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.3, 0.2, 4), forkMat, [0.8, 0.5, 5]));
  // Counterweight
  group.add(_wsc3dMakeMesh(new THREE.BoxGeometry(3.5, 2, 1.5), bodyMat, [0, 2, -3.5]));
  // Wheels
  var wGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8);
  var positions = [[-1.5, -2.5], [1.5, -2.5], [-1.5, 2], [1.5, 2]];
  for (var wi = 0; wi < positions.length; wi++) {
    var wheel = new THREE.Mesh(wGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(positions[wi][0], 0.8, positions[wi][1]);
    group.add(wheel);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation || 0;
  group.scale.set(0.8, 0.8, 0.8);
  scene.add(group);
}

// ── Build staging area with floor pallets and safety lines ──
function _wsc3dBuildStaging(scene, zoneX, zoneZ, zoneW, zoneH) {
  // Safety lines (yellow perimeter)
  var lineMat = new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.5 });
  // Top line
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(zoneW, 0.05, 0.3), lineMat, [zoneX + zoneW / 2, 0.15, zoneZ + 0.15]));
  // Bottom line
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(zoneW, 0.05, 0.3), lineMat, [zoneX + zoneW / 2, 0.15, zoneZ + zoneH - 0.15]));
  // Left line
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.3, 0.05, zoneH), lineMat, [zoneX + 0.15, 0.15, zoneZ + zoneH / 2]));
  // Right line
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.3, 0.05, zoneH), lineMat, [zoneX + zoneW - 0.15, 0.15, zoneZ + zoneH / 2]));

  // Floor pallets
  var palletGeo = new THREE.BoxGeometry(3.5, 3, 3.5);
  var rows = Math.max(1, Math.floor(zoneH / 5));
  var cols = Math.max(1, Math.floor(zoneW / 5));
  for (var row = 0; row < rows; row++) {
    for (var col = 0; col < cols; col++) {
      if (_wsc3dRand() < 0.7) {
        var pMat = new THREE.MeshStandardMaterial({ color: _wscPickPalletColor(), roughness: 0.7 });
        var pallet = new THREE.Mesh(palletGeo, pMat);
        pallet.position.set(zoneX + col * 5 + 2.5, 1.5, zoneZ + row * 5 + 2.5);
        pallet.castShadow = true;
        scene.add(pallet);
      }
    }
  }
}

// ── Build office mezzanine ──
function _wsc3dBuildOffice(scene, zoneX, zoneZ, zoneW, zoneH) {
  var officeH = 10;
  var officeMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d8, roughness: 0.6 });
  var glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccee, transparent: true, opacity: 0.4, metalness: 0.1, roughness: 0.3 });
  var roofMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.5 });

  // 4 walls
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(zoneW, officeH, 0.5), officeMat, [zoneX + zoneW / 2, officeH / 2, zoneZ]));
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(zoneW, officeH, 0.5), officeMat, [zoneX + zoneW / 2, officeH / 2, zoneZ + zoneH]));
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.5, officeH, zoneH), officeMat, [zoneX, officeH / 2, zoneZ + zoneH / 2]));
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.5, officeH, zoneH), officeMat, [zoneX + zoneW, officeH / 2, zoneZ + zoneH / 2]));

  // Windows along one wall (front)
  var numWindows = Math.max(1, Math.floor(zoneW / 8));
  var winSpacing = zoneW / (numWindows + 1);
  for (var wi = 0; wi < numWindows; wi++) {
    var wx = zoneX + winSpacing * (wi + 1);
    scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(4, 4, 0.2), glassMat, [wx, 6, zoneZ - 0.3]));
  }

  // Roof
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(zoneW, 0.5, zoneH), roofMat, [zoneX + zoneW / 2, officeH, zoneZ + zoneH / 2]));
}

// ── Build zone sign post ──
function _wsc3dBuildSign(scene, text, x, z, color) {
  var postMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
  scene.add(_wsc3dMakeMesh(new THREE.CylinderGeometry(0.2, 0.2, 12, 6), postMat, [x, 6, z]));
  var signColor = color || 0x333333;
  var signMat = new THREE.MeshStandardMaterial({ color: signColor, roughness: 0.4 });
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(14, 4, 0.3), signMat, [x, 13, z]));

  // Text sprite on the sign — high-res for readability
  var sprite = wsc3dMakeTextSprite(text, 0xffffff);
  sprite.position.set(x, 13, z + 0.3);
  sprite.scale.set(24, 12, 1);
  scene.add(sprite);
}

// ── Text sprite helper ──
function wsc3dMakeTextSprite(text, color) {
  var canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 512);
  // Dark semi-transparent background for contrast
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 1024, 512);
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#' + ('000000' + (color || 0xffffff).toString(16)).slice(-6);
  var lines = text.split('\n');
  for (var i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 512, 160 + i * 100);
  }
  var tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  return new THREE.Sprite(mat);
}

// ═══════════════════════════════════════════════════════════════════
// MAIN 3D RENDER FUNCTION
// ═══════════════════════════════════════════════════════════════════

function render3DLayout(p) {
  if (typeof THREE === 'undefined') { console.warn('Three.js not loaded'); return; }
  var container = document.getElementById('wsc-3d-container');
  if (!container) return;

  dispose3DView();
  _initWsc3dTarget();
  _wsc3dSeed = 42; // Reset deterministic random

  var cW = container.clientWidth || 800;
  var cH = container.clientHeight || 480;

  // ── Building dimensions — use tightened values from 2D render ──
  var twoDock = p.dockConfig === 'two';
  var dockFaceW = Math.max((twoDock ? Math.max(p.inDoors, p.outDoors) : p.totalDoors) * 14, 120);
  var bW, bD;
  if (wscTightenedBW > 0 && wscTightenedBD > 0) {
    bW = wscTightenedBW;
    bD = wscTightenedBD;
  } else {
    // Fallback: calculate and tighten inline (same logic as 2D renderLayout)
    bW = Math.max(dockFaceW, Math.ceil(Math.sqrt(p.totalSF * 2.2)));
    bD = Math.max(100, Math.ceil(p.totalSF / bW));
    var mg = 4;
    var dockH = Math.max(18, Math.min(Math.ceil(p.dockSF / bW * (twoDock ? 0.5 : 1)), bD * 0.12));
    var recvStH = Math.max(14, Math.min(Math.ceil(p.recvStagingSF / bW), bD * 0.10));
    var shipStH = Math.max(14, Math.min(Math.ceil(p.shipStagingSF / bW), bD * 0.10));
    var reqD = (twoDock ? dockH + recvStH : 0) + dockH + Math.max(recvStH, shipStH) + mg * 6 + 40;
    if (bD > reqD + 20) bD = reqD + 10;
  }
  var clearH = p.clearHeightFt || 32;
  var pad = 60;

  // ── Scene ──
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Sky blue

  // ── Camera ──
  var camera = new THREE.PerspectiveCamera(45, cW / cH, 1, bW * 10);
  wsc3dCameraDist = Math.max(bW, bD) * 1.4;
  wsc3dCameraTarget.set(bW / 2, clearH / 4, bD / 2);

  // ── Renderer with shadows ──
  var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(cW, cH);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  wsc3dScene = scene;
  wsc3dCamera = camera;
  wsc3dRenderer = renderer;

  // ── Lighting ──
  var ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(bW * 0.6, clearH * 4, bD * 0.3);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = Math.max(bW, bD) * 6;
  dirLight.shadow.camera.left = -bW;
  dirLight.shadow.camera.right = bW;
  dirLight.shadow.camera.top = bD;
  dirLight.shadow.camera.bottom = -bD;
  scene.add(dirLight);

  var fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-bW * 0.5, clearH * 2, -bD * 0.3);
  scene.add(fillLight);

  // ── Building floor (concrete slab at Y=0) ──
  var floorGeo = new THREE.PlaneGeometry(bW, bD);
  var floorMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.8, metalness: 0.1 });
  var floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(bW / 2, 0, bD / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  // ── Exterior ground (asphalt at Y=-4, 4ft below building floor) ──
  var extGeo = new THREE.PlaneGeometry(bW + 200, bD + 200);
  var extMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0.05 });
  var extFloor = new THREE.Mesh(extGeo, extMat);
  extFloor.rotation.x = -Math.PI / 2;
  extFloor.position.set(bW / 2, -4, bD / 2);
  extFloor.receiveShadow = true;
  scene.add(extFloor);

  // ── Building slab edge (shows 4ft elevation) ──
  var slabEdgeMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.7 });
  // Front slab edge
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(bW, 4, 1), slabEdgeMat, [bW / 2, -2, bD + 0.5]));
  // Back slab edge
  scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(bW, 4, 1), slabEdgeMat, [bW / 2, -2, -0.5]));

  // Grid on exterior grade
  var gridHelper = new THREE.GridHelper(Math.max(bW, bD) + 100, 40, 0xbbbbbb, 0xcccccc);
  gridHelper.position.set(bW / 2, -3.9, bD / 2);
  scene.add(gridHelper);

  // ── Walls (solid, light gray) — tagged for hide/show toggle ──
  var wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.6, metalness: 0.05 });
  var wallT = 2;
  wsc3dWallMeshes = [];
  // Back wall
  var wBack = _wsc3dMakeMesh(new THREE.BoxGeometry(bW, clearH, wallT), wallMat, [bW / 2, clearH / 2, 0]);
  wsc3dWallMeshes.push(wBack); scene.add(wBack);
  // Left wall
  var wLeft = _wsc3dMakeMesh(new THREE.BoxGeometry(wallT, clearH, bD), wallMat, [0, clearH / 2, bD / 2]);
  wsc3dWallMeshes.push(wLeft); scene.add(wLeft);
  // Right wall
  var wRight = _wsc3dMakeMesh(new THREE.BoxGeometry(wallT, clearH, bD), wallMat, [bW, clearH / 2, bD / 2]);
  wsc3dWallMeshes.push(wRight); scene.add(wRight);
  // Front wall (semi-transparent for visibility)
  var wFront = _wsc3dMakeMesh(new THREE.BoxGeometry(bW, clearH, wallT), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.6, metalness: 0.05, transparent: true, opacity: 0.35 }), [bW / 2, clearH / 2, bD]);
  wsc3dWallMeshes.push(wFront); scene.add(wFront);

  // ── Roof (subtle, semi-transparent) ──
  var roofMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.15, roughness: 0.5 });
  var roof = _wsc3dMakeMesh(new THREE.BoxGeometry(bW, 0.5, bD), roofMat, [bW / 2, clearH, bD / 2]);
  wsc3dWallMeshes.push(roof); scene.add(roof);

  // ── Read zone positions ──
  var zones = wscManualMode ? wscManualZones : wscAutoZones;
  if (!zones || Object.keys(zones).length === 0) {
    zones = {};
    var svg = document.getElementById('wsc-layout-svg');
    if (svg) {
      var rects = svg.querySelectorAll('[data-zone]');
      rects.forEach(function(r) {
        var name = r.getAttribute('data-zone');
        zones[name] = {
          x: parseFloat(r.getAttribute('x')),
          y: parseFloat(r.getAttribute('y')),
          w: parseFloat(r.getAttribute('width')),
          h: parseFloat(r.getAttribute('height'))
        };
      });
    }
  }

  // ── Zone colors for signs ──
  var zoneSignColors = {
    'storage': 0x2563EB, 'recv': 0x10B981, 'ship': 0xF97316,
    'office': 0x8B5CF6, 'dock-top': 0x0EA5E3, 'dock-bot': 0x0EA5E3, 'opt': 0xEC4899
  };

  // ── Floor tinting for non-storage zones ──
  var zoneTintColors = {
    'recv': 0xd1fae5, 'ship': 0xffedd5, 'dock-top': 0xe0f2fe, 'dock-bot': 0xe0f2fe, 'opt': 0xfce7f3
  };

  // ── Render each zone ──
  Object.keys(zones).forEach(function(name) {
    var z = zones[name];
    if (!z || !z.w || !z.h) return;

    var x3d = z.x - pad;
    var z3d = z.y - pad;
    var w3d = z.w;
    var d3d = z.h;

    var colorKey = name;
    if (name.indexOf('opt') === 0) colorKey = 'opt';

    // Zone sign
    var label = name.replace('dock-top', 'DOCK (IN)').replace('dock-bot', 'DOCK (OUT)')
      .replace('recv', 'RECEIVING').replace('ship', 'SHIPPING').replace(/opt-\d/, 'OPTIONAL').toUpperCase();
    if (name === 'storage') label = 'STORAGE';
    if (name === 'office') label = 'OFFICE';
    var sf = Math.round(w3d * d3d);
    _wsc3dBuildSign(scene, label + '\n' + sf.toLocaleString() + ' SF', x3d + w3d / 2, z3d + 2, zoneSignColors[colorKey] || 0x888888);

    // Storage zone → rack structures
    if (name === 'storage') {
      var aisleW = p.aisleW || 10;
      var rackDepth = (p.storeType === 'double') ? 8 : 4;
      var rackLevels = p.rackLevels || 4;
      var isVert = p.rackDir === 'vertical';

      // Clip storage area to exclude office zone (office overlaps storage in 2D)
      var effW = w3d, effD = d3d;
      if (zones['office']) {
        var oz = zones['office'];
        var ox3d = oz.x - pad;
        // Office is at the right edge of storage — reduce effective width
        if (ox3d > x3d && ox3d < x3d + w3d) {
          effW = ox3d - x3d - 2; // 2ft gap between racks and office
        }
      }

      if (p.storeType === 'bulk') {
        // Bulk storage — back-to-back pallet rows with 12ft forklift aisles
        var palletGeo = new THREE.BoxGeometry(3.5, 4, 3.5);
        var stackHi = p.stackHi || 3;
        var bulkDepth = p.bulkDepth || 4;
        var bayDepthFt = bulkDepth * 4;
        var bulkAisle = 12;
        var moduleFt = bayDepthFt * 2 + bulkAisle;
        var lineMat = new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.5 });

        if (isVert) {
          var moduleCount = Math.max(1, Math.floor(effW / moduleFt));
          var laneLen = effD;
          for (var mod = 0; mod < moduleCount; mod++) {
            var modStart = mod * moduleFt;
            // Left bay
            for (var br = 0; br < bulkDepth; br++) {
              var palletCount = Math.max(1, Math.floor(laneLen / 5));
              for (var bc = 0; bc < palletCount; bc++) {
                if (_wsc3dRand() < 0.8) {
                  var layers = Math.ceil(_wsc3dRand() * stackHi);
                  for (var sl = 0; sl < layers; sl++) {
                    var pMat = new THREE.MeshStandardMaterial({ color: _wscPickPalletColor(), roughness: 0.7 });
                    var pal = new THREE.Mesh(palletGeo, pMat);
                    pal.position.set(x3d + modStart + br * 4 + 2, sl * 4.5 + 2, z3d + bc * 5 + 2.5);
                    pal.castShadow = true;
                    scene.add(pal);
                  }
                }
              }
            }
            // Aisle safety lines
            var aisleStart = modStart + bayDepthFt;
            scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.3, 0.05, laneLen), lineMat, [x3d + aisleStart, 0.15, z3d + laneLen / 2]));
            scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.3, 0.05, laneLen), lineMat, [x3d + aisleStart + bulkAisle, 0.15, z3d + laneLen / 2]));
            // Right bay
            var rightStart = aisleStart + bulkAisle;
            for (var br2 = 0; br2 < bulkDepth; br2++) {
              var palletCount2 = Math.max(1, Math.floor(laneLen / 5));
              for (var bc2 = 0; bc2 < palletCount2; bc2++) {
                if (_wsc3dRand() < 0.8) {
                  var layers2 = Math.ceil(_wsc3dRand() * stackHi);
                  for (var sl2 = 0; sl2 < layers2; sl2++) {
                    var pMat2 = new THREE.MeshStandardMaterial({ color: _wscPickPalletColor(), roughness: 0.7 });
                    var pal2 = new THREE.Mesh(palletGeo, pMat2);
                    pal2.position.set(x3d + rightStart + br2 * 4 + 2, sl2 * 4.5 + 2, z3d + bc2 * 5 + 2.5);
                    pal2.castShadow = true;
                    scene.add(pal2);
                  }
                }
              }
            }
          }
        } else {
          var moduleCount = Math.max(1, Math.floor(effD / moduleFt));
          var laneLen = effW;
          for (var mod = 0; mod < moduleCount; mod++) {
            var modStart = mod * moduleFt;
            for (var br = 0; br < bulkDepth; br++) {
              var palletCount = Math.max(1, Math.floor(laneLen / 5));
              for (var bc = 0; bc < palletCount; bc++) {
                if (_wsc3dRand() < 0.8) {
                  var layers = Math.ceil(_wsc3dRand() * stackHi);
                  for (var sl = 0; sl < layers; sl++) {
                    var pMat = new THREE.MeshStandardMaterial({ color: _wscPickPalletColor(), roughness: 0.7 });
                    var pal = new THREE.Mesh(palletGeo, pMat);
                    pal.position.set(x3d + bc * 5 + 2.5, sl * 4.5 + 2, z3d + modStart + br * 4 + 2);
                    pal.castShadow = true;
                    scene.add(pal);
                  }
                }
              }
            }
            var aisleStart = modStart + bayDepthFt;
            scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(laneLen, 0.05, 0.3), lineMat, [x3d + laneLen / 2, 0.15, z3d + aisleStart]));
            scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(laneLen, 0.05, 0.3), lineMat, [x3d + laneLen / 2, 0.15, z3d + aisleStart + bulkAisle]));
            var rightStart = aisleStart + bulkAisle;
            for (var br2 = 0; br2 < bulkDepth; br2++) {
              var palletCount2 = Math.max(1, Math.floor(laneLen / 5));
              for (var bc2 = 0; bc2 < palletCount2; bc2++) {
                if (_wsc3dRand() < 0.8) {
                  var layers2 = Math.ceil(_wsc3dRand() * stackHi);
                  for (var sl2 = 0; sl2 < layers2; sl2++) {
                    var pMat2 = new THREE.MeshStandardMaterial({ color: _wscPickPalletColor(), roughness: 0.7 });
                    var pal2 = new THREE.Mesh(palletGeo, pMat2);
                    pal2.position.set(x3d + bc2 * 5 + 2.5, sl2 * 4.5 + 2, z3d + rightStart + br2 * 4 + 2);
                    pal2.castShadow = true;
                    scene.add(pal2);
                  }
                }
              }
            }
          }
        }
      } else if (p.storeType === 'carton') {
        // Carton flow — shorter shelving with angled shelves and small cartons
        var shelfHeight = 7;
        var shelfLevels = 5;
        var levelH = shelfHeight / shelfLevels;
        var shelfModuleFt = 9.5; // 4.5ft shelves + 5ft pick aisle
        var shelfDepth = 4.5;
        var uprightColor = 0x4a90d9;
        var shelfColor = 0xcccccc;
        var cartonColors = [0xFFE4B5, 0xDEB887, 0xF5DEB3, 0xFAEBD7, 0xEEE8AA];

        if (isVert) {
          var moduleCount = Math.max(1, Math.floor(effW / shelfModuleFt));
          for (var mod = 0; mod < moduleCount; mod++) {
            var modX = x3d + mod * shelfModuleFt;
            // Uprights
            var upGeo = new THREE.BoxGeometry(0.2, shelfHeight, 0.2);
            var upMat = new THREE.MeshStandardMaterial({ color: uprightColor, roughness: 0.5 });
            for (var side = 0; side < 2; side++) {
              var up = new THREE.Mesh(upGeo, upMat);
              up.position.set(modX + side * shelfDepth, shelfHeight / 2, z3d + effD / 2);
              up.castShadow = true;
              scene.add(up);
            }
            // Shelves per level (slightly tilted)
            for (var lvl = 0; lvl < shelfLevels; lvl++) {
              var shelfY = lvl * levelH + 0.5;
              var shelfGeo = new THREE.BoxGeometry(shelfDepth - 0.4, 0.1, effD * 0.9);
              var shelfMat = new THREE.MeshStandardMaterial({ color: shelfColor, metalness: 0.1, roughness: 0.5 });
              var shelf = new THREE.Mesh(shelfGeo, shelfMat);
              shelf.position.set(modX + shelfDepth / 2, shelfY, z3d + effD / 2);
              shelf.rotation.z = 0.05;
              scene.add(shelf);
              // Small cartons
              var cartonCount = Math.max(1, Math.floor(effD / 1.5));
              for (var ci = 0; ci < cartonCount; ci++) {
                if (_wsc3dRand() < 0.75) {
                  var cGeo = new THREE.BoxGeometry(1.0, 0.8, 1.2);
                  var cMat = new THREE.MeshStandardMaterial({ color: cartonColors[Math.floor(_wsc3dRand() * cartonColors.length)], roughness: 0.8 });
                  var carton = new THREE.Mesh(cGeo, cMat);
                  carton.position.set(modX + 1 + _wsc3dRand() * 2, shelfY + 0.5, z3d + ci * 1.5 + 0.75);
                  scene.add(carton);
                }
              }
            }
          }
        } else {
          var moduleCount = Math.max(1, Math.floor(effD / shelfModuleFt));
          for (var mod = 0; mod < moduleCount; mod++) {
            var modZ = z3d + mod * shelfModuleFt;
            var upGeo = new THREE.BoxGeometry(0.2, shelfHeight, 0.2);
            var upMat = new THREE.MeshStandardMaterial({ color: uprightColor, roughness: 0.5 });
            for (var side = 0; side < 2; side++) {
              var up = new THREE.Mesh(upGeo, upMat);
              up.position.set(x3d + effW / 2, shelfHeight / 2, modZ + side * shelfDepth);
              up.castShadow = true;
              scene.add(up);
            }
            for (var lvl = 0; lvl < shelfLevels; lvl++) {
              var shelfY = lvl * levelH + 0.5;
              var shelfGeo = new THREE.BoxGeometry(effW * 0.9, 0.1, shelfDepth - 0.4);
              var shelfMat = new THREE.MeshStandardMaterial({ color: shelfColor, metalness: 0.1, roughness: 0.5 });
              var shelf = new THREE.Mesh(shelfGeo, shelfMat);
              shelf.position.set(x3d + effW / 2, shelfY, modZ + shelfDepth / 2);
              shelf.rotation.x = -0.05;
              scene.add(shelf);
              var cartonCount = Math.max(1, Math.floor(effW / 1.5));
              for (var ci = 0; ci < cartonCount; ci++) {
                if (_wsc3dRand() < 0.75) {
                  var cGeo = new THREE.BoxGeometry(1.2, 0.8, 1.0);
                  var cMat = new THREE.MeshStandardMaterial({ color: cartonColors[Math.floor(_wsc3dRand() * cartonColors.length)], roughness: 0.8 });
                  var carton = new THREE.Mesh(cGeo, cMat);
                  carton.position.set(x3d + ci * 1.5 + 0.75, shelfY + 0.5, modZ + 1 + _wsc3dRand() * 2);
                  scene.add(carton);
                }
              }
            }
          }
        }
      } else if (p.storeType === 'mix') {
        // Mixed — rack portion + bulk portion with yellow separator
        var rackPct = (p.mixRackPct || 60) / 100;
        var rackW, bulkW;
        if (isVert) {
          rackW = effW * rackPct;
          bulkW = effW - rackW;
        } else {
          rackW = effD * rackPct;
          bulkW = effD - rackW;
        }
        // Rack section
        if (isVert) {
          var step = aisleW + rackDepth;
          var numRows = Math.max(1, Math.floor((rackW - aisleW) / step));
          for (var rv = 0; rv < numRows; rv++) {
            var rx = x3d + aisleW + rv * step;
            _wsc3dBuildRackRow(scene, rx, z3d + 4, effD - 8, rackLevels, clearH * 0.9, 'vertical', rackDepth);
          }
        } else {
          var step = aisleW + rackDepth;
          var numRows = Math.max(1, Math.floor((rackW - aisleW) / step));
          for (var rh = 0; rh < numRows; rh++) {
            var rz = z3d + aisleW + rh * step;
            _wsc3dBuildRackRow(scene, x3d + 4, rz, effW - 8, rackLevels, clearH * 0.9, 'horizontal', rackDepth);
          }
        }
        // Yellow separator
        var sepMat = new THREE.MeshStandardMaterial({ color: 0xFFCC00, transparent: true, opacity: 0.5 });
        if (isVert) {
          scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(0.2, clearH * 0.3, effD), sepMat, [x3d + rackW, clearH * 0.15, z3d + effD / 2]));
        } else {
          scene.add(_wsc3dMakeMesh(new THREE.BoxGeometry(effW, clearH * 0.3, 0.2), sepMat, [x3d + effW / 2, clearH * 0.15, z3d + rackW]));
        }
        // Bulk section (simplified stacked pallets with aisles)
        var palletGeo = new THREE.BoxGeometry(3.5, 4, 3.5);
        var stackHi = p.stackHi || 3;
        var bulkDepth = p.bulkDepth || 4;
        var bayDepthFt = bulkDepth * 4;
        var bulkAisle = 12;
        var moduleFt = bayDepthFt * 2 + bulkAisle;
        if (isVert) {
          var bulkStartX = x3d + rackW + 3;
          var moduleCount = Math.max(1, Math.floor(bulkW / moduleFt));
          for (var bmod = 0; bmod < moduleCount; bmod++) {
            for (var br = 0; br < bulkDepth; br++) {
              var palletCount = Math.max(1, Math.floor(effD / 5));
              for (var bc = 0; bc < palletCount; bc++) {
                if (_wsc3dRand() < 0.8) {
                  var layers = Math.ceil(_wsc3dRand() * stackHi);
                  for (var sl = 0; sl < layers; sl++) {
                    var pMat = new THREE.MeshStandardMaterial({ color: _wscPickPalletColor(), roughness: 0.7 });
                    var pal = new THREE.Mesh(palletGeo, pMat);
                    pal.position.set(bulkStartX + bmod * moduleFt + br * 4 + 2, sl * 4.5 + 2, z3d + bc * 5 + 2.5);
                    pal.castShadow = true;
                    scene.add(pal);
                  }
                }
              }
            }
          }
        } else {
          var bulkStartZ = z3d + rackW + 3;
          var moduleCount = Math.max(1, Math.floor(bulkW / moduleFt));
          for (var bmod = 0; bmod < moduleCount; bmod++) {
            for (var br = 0; br < bulkDepth; br++) {
              var palletCount = Math.max(1, Math.floor(effW / 5));
              for (var bc = 0; bc < palletCount; bc++) {
                if (_wsc3dRand() < 0.8) {
                  var layers = Math.ceil(_wsc3dRand() * stackHi);
                  for (var sl = 0; sl < layers; sl++) {
                    var pMat = new THREE.MeshStandardMaterial({ color: _wscPickPalletColor(), roughness: 0.7 });
                    var pal = new THREE.Mesh(palletGeo, pMat);
                    pal.position.set(x3d + bc * 5 + 2.5, sl * 4.5 + 2, bulkStartZ + bmod * moduleFt + br * 4 + 2);
                    pal.castShadow = true;
                    scene.add(pal);
                  }
                }
              }
            }
          }
        }
      } else {
        // Standard rack storage (single or double) — back-to-back pairs
        // Module = back-to-back rack pair + aisle (matches 2D: 8.5ft for single, 16.5ft for double)
        var modDepth = (p.storeType === 'double') ? 16.5 : 8.5;
        var pairStep = aisleW + modDepth;
        if (isVert) {
          var numPairs = Math.max(1, Math.floor((effW - aisleW) / pairStep));
          for (var rv = 0; rv < numPairs; rv++) {
            var rx = x3d + aisleW + rv * pairStep;
            _wsc3dBuildRackRow(scene, rx, z3d + 4, effD - 8, rackLevels, clearH * 0.9, 'vertical', rackDepth);
            _wsc3dBuildRackRow(scene, rx + rackDepth + 0.5, z3d + 4, effD - 8, rackLevels, clearH * 0.9, 'vertical', rackDepth);
            // Aisle label (floor-level sign between rack pairs)
            if (rv < numPairs - 1) {
              var aisleCenter = rx + modDepth + aisleW / 2;
              var aisleLabelSprite = wsc3dMakeTextSprite('Aisle ' + (rv + 1) + '\n' + aisleW + "' wide", 0x2563EB);
              aisleLabelSprite.position.set(aisleCenter, 1.5, z3d + effD / 2);
              aisleLabelSprite.scale.set(16, 8, 1);
              scene.add(aisleLabelSprite);
            }
          }
        } else {
          var numPairs = Math.max(1, Math.floor((effD - aisleW) / pairStep));
          for (var rh = 0; rh < numPairs; rh++) {
            var rz = z3d + aisleW + rh * pairStep;
            _wsc3dBuildRackRow(scene, x3d + 4, rz, effW - 8, rackLevels, clearH * 0.9, 'horizontal', rackDepth);
            _wsc3dBuildRackRow(scene, x3d + 4, rz + rackDepth + 0.5, effW - 8, rackLevels, clearH * 0.9, 'horizontal', rackDepth);
            // Aisle label
            if (rh < numPairs - 1) {
              var aisleCenter = rz + modDepth + aisleW / 2;
              var aisleLabelSprite = wsc3dMakeTextSprite('Aisle ' + (rh + 1) + '\n' + aisleW + "' wide", 0x2563EB);
              aisleLabelSprite.position.set(x3d + effW / 2, 1.5, aisleCenter);
              aisleLabelSprite.scale.set(16, 8, 1);
              scene.add(aisleLabelSprite);
            }
          }
        }
      }
      return; // Skip generic floor tint for storage
    }

    // Recv/Ship staging zones → floor pallets + safety lines
    if (name === 'recv' || name === 'ship') {
      _wsc3dBuildStaging(scene, x3d, z3d, w3d, d3d);
      return;
    }

    // Office → mezzanine with windows + purple floor tint
    if (name === 'office') {
      // Floor tint so office area is visible even from above
      var officeTintGeo = new THREE.PlaneGeometry(w3d, d3d);
      var officeTintMat = new THREE.MeshStandardMaterial({ color: 0xd8b4fe, roughness: 0.9, transparent: true, opacity: 0.6 });
      var officeTint = new THREE.Mesh(officeTintGeo, officeTintMat);
      officeTint.rotation.x = -Math.PI / 2;
      officeTint.position.set(x3d + w3d / 2, 0.2, z3d + d3d / 2);
      scene.add(officeTint);
      _wsc3dBuildOffice(scene, x3d, z3d, w3d, d3d);
      return;
    }

    // Dock and optional zones → floor tint
    var tintColor = zoneTintColors[colorKey];
    if (tintColor) {
      var tintGeo = new THREE.PlaneGeometry(w3d, d3d);
      var tintMat = new THREE.MeshStandardMaterial({ color: tintColor, roughness: 0.9, transparent: true, opacity: 0.5 });
      var tint = new THREE.Mesh(tintGeo, tintMat);
      tint.rotation.x = -Math.PI / 2;
      tint.position.set(x3d + w3d / 2, 0.15, z3d + d3d / 2);
      scene.add(tint);
    }
  });

  // ── Dock doors with trucks ──
  var dockZone = zones['dock-bot'];
  if (dockZone) {
    var dX = dockZone.x - pad;
    var dZ = dockZone.y - pad;
    var dW = dockZone.w;
    var totalDoors = p.totalDoors || 10;
    var doorCount = p.dockConfig === 'two' ? (p.outDoors || Math.ceil(totalDoors / 2)) : totalDoors;
    var spacing = dW / (doorCount + 1);
    for (var di = 0; di < doorCount; di++) {
      var dx = dX + spacing * (di + 1);
      _wsc3dBuildDockDoor(scene, dx, bD, 'bottom');
      if (_wsc3dRand() < 0.6) {
        _wsc3dBuildTrailer(scene, dx, bD + 8, 'bottom');
      }
    }
  }

  var dockTop = zones['dock-top'];
  if (dockTop) {
    var dtX = dockTop.x - pad;
    var dtZ = dockTop.y - pad;
    var dtW = dockTop.w;
    var doors2 = p.inDoors || Math.ceil((p.totalDoors || 10) / 2);
    var spacing2 = dtW / (doors2 + 1);
    for (var d2 = 0; d2 < doors2; d2++) {
      var dx2 = dtX + spacing2 * (d2 + 1);
      _wsc3dBuildDockDoor(scene, dx2, 0, 'top');
      if (_wsc3dRand() < 0.6) {
        _wsc3dBuildTrailer(scene, dx2, -8, 'top');
      }
    }
  }

  // ── Forklifts (1–3 in staging/aisle areas) ──
  var recvZone = zones['recv'];
  var shipZone = zones['ship'];
  if (recvZone) {
    var rx = recvZone.x - pad + recvZone.w / 2;
    var rz = recvZone.y - pad + recvZone.h / 2;
    _wsc3dBuildForklift(scene, rx + 8, rz, Math.PI * 0.3);
  }
  if (shipZone) {
    var sx = shipZone.x - pad + shipZone.w / 2;
    var sz = shipZone.y - pad + shipZone.h / 2;
    _wsc3dBuildForklift(scene, sx - 6, sz, -Math.PI * 0.4);
  }
  // One in storage aisle
  var storZ = zones['storage'];
  if (storZ) {
    var aX = storZ.x - pad + (p.aisleW || 10) / 2;
    var aZ = storZ.y - pad + storZ.h / 2;
    _wsc3dBuildForklift(scene, aX, aZ, 0);
  }

  // ── Camera position ──
  updateWsc3dCamera();

  // ── Mouse controls ──
  var canvas = renderer.domElement;
  canvas.addEventListener('mousedown', wsc3dOnMouseDown);
  canvas.addEventListener('mousemove', wsc3dOnMouseMove);
  canvas.addEventListener('mouseup', wsc3dOnMouseUp);
  canvas.addEventListener('mouseleave', wsc3dOnMouseUp);
  canvas.addEventListener('wheel', wsc3dOnWheel, { passive: false });
  canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  // ── Animation loop ──
  function animate() {
    wsc3dAnimationId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  // ── Resize handler ──
  if (!window._wsc3dResizeHandler) {
    window._wsc3dResizeHandler = function() {
      if (wscViewMode !== '3d' || !wsc3dRenderer) return;
      var c = document.getElementById('wsc-3d-container');
      if (!c) return;
      var w = c.clientWidth;
      var h = c.clientHeight || 480;
      wsc3dCamera.aspect = w / h;
      wsc3dCamera.updateProjectionMatrix();
      wsc3dRenderer.setSize(w, h);
    };
    window.addEventListener('resize', window._wsc3dResizeHandler);
  }
}

// ── Camera update ──
function updateWsc3dCamera() {
  if (!wsc3dCamera) return;
  var dist = wsc3dCameraDist;
  var theta = wsc3dCameraTheta;
  var phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, wsc3dCameraPhi));
  wsc3dCameraPhi = phi;
  wsc3dCamera.position.set(
    wsc3dCameraTarget.x + dist * Math.sin(theta) * Math.cos(phi),
    wsc3dCameraTarget.y + dist * Math.sin(phi),
    wsc3dCameraTarget.z + dist * Math.cos(theta) * Math.cos(phi)
  );
  wsc3dCamera.lookAt(wsc3dCameraTarget);
}

// ── Mouse handlers ──
function wsc3dOnMouseDown(e) {
  wsc3dMouseDown = true;
  wsc3dMouseBtn = e.button;
  wsc3dLastMouse.x = e.clientX;
  wsc3dLastMouse.y = e.clientY;
}
function wsc3dOnMouseUp() { wsc3dMouseDown = false; }
function wsc3dOnMouseMove(e) {
  if (!wsc3dMouseDown) return;
  var dx = e.clientX - wsc3dLastMouse.x;
  var dy = e.clientY - wsc3dLastMouse.y;
  wsc3dLastMouse.x = e.clientX;
  wsc3dLastMouse.y = e.clientY;

  if (wsc3dMouseBtn === 0 && !e.shiftKey) {
    wsc3dCameraTheta -= dx * 0.005;
    wsc3dCameraPhi += dy * 0.005;
    updateWsc3dCamera();
  } else {
    var panScale = wsc3dCameraDist * 0.002;
    var right = new THREE.Vector3();
    var up = new THREE.Vector3(0, 1, 0);
    right.crossVectors(wsc3dCamera.getWorldDirection(new THREE.Vector3()), up).normalize();
    wsc3dCameraTarget.addScaledVector(right, -dx * panScale);
    wsc3dCameraTarget.y += dy * panScale;
    updateWsc3dCamera();
  }
}
function wsc3dOnWheel(e) {
  if (wscViewMode !== '3d') return;
  var canvas = wsc3dRenderer ? wsc3dRenderer.domElement : null;
  if (!canvas) return;
  var rect = canvas.getBoundingClientRect();
  if (rect.height === 0) return;
  var overCanvas = (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom);
  if (!overCanvas) return;
  e.preventDefault();
  e.stopPropagation();
  wsc3dCameraDist *= (1 + e.deltaY * 0.001);
  wsc3dCameraDist = Math.max(50, Math.min(5000, wsc3dCameraDist));
  updateWsc3dCamera();
}

// ═══════════════════════════════════════════════════════════════════
// CROSS-SECTION ELEVATION VIEW (2D Canvas)
// ═══════════════════════════════════════════════════════════════════

function renderElevationView(p) {
  var container = document.getElementById('wsc-elevation-container');
  if (!container) return;
  container.innerHTML = '';
  container.style.display = 'block';

  var canvas = document.createElement('canvas');
  var W = container.clientWidth || 800;
  var H = 440;
  canvas.width = W * 2;
  canvas.height = H * 2;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  var ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  container.appendChild(canvas);

  var clearH = p.clearHeightFt || 32;
  var rackLevels = p.rackLevels || 4;
  var aisleW = p.aisleW || 10;
  var rackDepth = (p.storeType === 'double') ? 8 : 4;
  var storeType = p.storeType || 'single';

  // Building dimensions
  var twoDock = p.dockConfig === 'two';
  var dockFaceW = Math.max((twoDock ? Math.max(p.inDoors || 0, p.outDoors || 0) : (p.totalDoors || 10)) * 14, 120);
  var bldgW = Math.max(dockFaceW, Math.ceil(Math.sqrt((p.totalSF || 50000) * 2.2)));
  var maxHeight = clearH + 5;
  var exteriorGrade = -4;

  // Zone widths (approximate proportions from SF)
  var officeSF = p.officeSF || 0;
  var bldgD = Math.max(100, Math.ceil((p.totalSF || 50000) / bldgW));
  var officeW = officeSF > 0 ? Math.ceil(officeSF / bldgD) : 0;
  var dockDepth = 40;
  var stagingW = 30;
  // Dock is now OUTSIDE, so don't include it in building width
  var storageW = bldgW - officeW - stagingW * 2;
  if (storageW < 50) storageW = 50;

  // Drawing area with wider right padding for exterior elements
  var padL = 60, padR = 140, padT = 40, padB = 75;
  var drawW = W - padL - padR;
  var drawH = H - padT - padB;

  // Scale to accommodate building + dock/trailer outside
  var totalExtent = bldgW + dockDepth + 25;
  var scaleX = totalExtent > 0 ? drawW / totalExtent : 1;
  var scaleY = (maxHeight - exteriorGrade) > 0 ? drawH / (maxHeight - exteriorGrade) : 1;

  function toX(ft) { return padL + ft * scaleX; }
  function toY(ft) { return padT + drawH - (ft - exteriorGrade) * scaleY; }

  // ── Background ──
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, W, H);

  // ── Title ──
  ctx.fillStyle = '#333';
  ctx.font = 'bold 13px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Cross-Section Elevation View', padL, 20);

  // ── Roof structure ──
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(clearH));
  ctx.lineTo(toX(bldgW / 2), toY(clearH + 3));
  ctx.lineTo(toX(bldgW), toY(clearH));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Clear height line ──
  ctx.strokeStyle = '#1a73e8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(clearH));
  ctx.lineTo(toX(bldgW), toY(clearH));
  ctx.stroke();
  ctx.fillStyle = '#1a73e8';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Clear Height: ' + clearH + ' ft', toX(bldgW / 2), toY(clearH) - 6);

  // ── Walls ──
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(0));
  ctx.lineTo(toX(0), toY(clearH + 3));
  ctx.moveTo(toX(bldgW), toY(0));
  ctx.lineTo(toX(bldgW), toY(clearH + 3));
  ctx.stroke();

  // ── Floor slab ──
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(toX(0), toY(0), bldgW * scaleX, 12);
  // Hatching
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 0.5;
  var floorTop = toY(0);
  for (var hx = 0; hx < bldgW * scaleX; hx += 6) {
    ctx.beginPath();
    ctx.moveTo(toX(0) + hx, floorTop);
    ctx.lineTo(toX(0) + hx + 6, floorTop + 12);
    ctx.stroke();
  }

  // ── Zone layout (left to right): Office | Staging | Storage | Staging | Dock ──
  var cursor = 0;

  // Office mezzanine
  if (officeW > 0) {
    var offH = 10;
    ctx.fillStyle = '#e8e0f0';
    ctx.fillRect(toX(cursor), toY(offH), officeW * scaleX, offH * scaleY);
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(toX(cursor), toY(offH), officeW * scaleX, offH * scaleY);
    // Windows
    ctx.fillStyle = 'rgba(136,204,238,0.4)';
    var numWin = Math.max(1, Math.floor(officeW / 10));
    var winSpace = officeW / (numWin + 1);
    for (var ow = 0; ow < numWin; ow++) {
      var wx = cursor + winSpace * (ow + 1);
      ctx.fillRect(toX(wx - 2), toY(7), 4 * scaleX, 4 * scaleY);
    }
    // Label
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Office', toX(cursor + officeW / 2), toY(offH / 2) + 4);
    cursor += officeW;

    // Divider
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(toX(cursor), toY(0));
    ctx.lineTo(toX(cursor), toY(clearH));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Receiving staging
  ctx.fillStyle = 'rgba(16,185,129,0.08)';
  ctx.fillRect(toX(cursor), toY(clearH), stagingW * scaleX, clearH * scaleY);
  // Floor pallets
  var numPallets = Math.max(1, Math.floor(stagingW / 5));
  for (var sp = 0; sp < numPallets; sp++) {
    if (sp % 2 === 0) {
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(toX(cursor + sp * 5 + 0.5), toY(3.5), 4 * scaleX, 3.5 * scaleY);
      ctx.strokeStyle = '#C8A882';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(toX(cursor + sp * 5 + 0.5), toY(3.5), 4 * scaleX, 3.5 * scaleY);
    }
  }
  ctx.fillStyle = '#10b981';
  ctx.font = '9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Recv Staging', toX(cursor + stagingW / 2), toY(0) - 8);
  cursor += stagingW;

  // ── Storage section (the main event) ──
  var storageStart = cursor;
  var storageEnd = cursor + storageW;
  var beamH = clearH / Math.max(rackLevels, 1);

  if (storeType === 'bulk') {
    // Bulk storage — stacked pallets
    var stackHi = p.stackHi || 3;
    var numStacks = Math.max(1, Math.floor(storageW / 5));
    for (var bs = 0; bs < numStacks; bs++) {
      var stackX = storageStart + bs * 5 + 0.5;
      var layers = Math.ceil((bs % 3 + 1) * stackHi / 3);
      for (var bl = 0; bl < layers; bl++) {
        var bBot = bl * 5;
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(toX(stackX), toY(bBot + 4.5), 4 * scaleX, 4.5 * scaleY);
        ctx.strokeStyle = '#C8A882';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(toX(stackX), toY(bBot + 4.5), 4 * scaleX, 4.5 * scaleY);
      }
    }
    // Stack height dim
    _elevDimV(ctx, toX(storageEnd) + 15, toY(0), toY(stackHi * 5), 'Stack ' + stackHi + ' Hi');
  } else if (storeType === 'carton') {
    // Carton flow — shorter shelves
    var shelfH = 7;
    var shelfLevels = 4;
    var shelfBeamH = shelfH / shelfLevels;
    var rackSpacing = aisleW + rackDepth;
    var numRacks = Math.max(1, Math.floor(storageW / rackSpacing));
    for (var cr = 0; cr < numRacks; cr++) {
      var rackX = storageStart + cr * rackSpacing;
      // Uprights
      ctx.strokeStyle = '#4444cc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toX(rackX), toY(0)); ctx.lineTo(toX(rackX), toY(shelfH));
      ctx.moveTo(toX(rackX + rackDepth), toY(0)); ctx.lineTo(toX(rackX + rackDepth), toY(shelfH));
      ctx.stroke();
      // Beams and cartons
      for (var cl = 1; cl <= shelfLevels; cl++) {
        var cBeamY = cl * shelfBeamH;
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(toX(rackX), toY(cBeamY));
        ctx.lineTo(toX(rackX + rackDepth), toY(cBeamY));
        ctx.stroke();
        var cBot = (cl - 1) * shelfBeamH + 0.2;
        ctx.fillStyle = '#e8d5b7';
        ctx.fillRect(toX(rackX + 0.3), toY(cBot + shelfBeamH * 0.8), (rackDepth - 0.6) * scaleX, shelfBeamH * 0.7 * scaleY);
      }
      // Aisle label
      if (cr < numRacks - 1) {
        ctx.fillStyle = '#2563eb';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Aisle ' + aisleW + "'", toX(rackX + rackDepth + aisleW / 2), toY(0) - 5);
      }
    }
    ctx.fillStyle = '#2563eb';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Carton Flow', toX(storageStart + storageW / 2), toY(shelfH) - 8);
  } else if (storeType === 'mix') {
    // Mixed — rack left, bulk right
    var mixPct = (p.mixRackPct || 70) / 100;
    var rackW = storageW * mixPct;
    var bulkW = storageW - rackW;

    // Rack section
    var rackSpacing = aisleW + rackDepth;
    var numRacks = Math.max(1, Math.floor(rackW / rackSpacing));
    for (var mr = 0; mr < numRacks; mr++) {
      var rackX = storageStart + mr * rackSpacing;
      _elevDrawRack(ctx, toX, toY, rackX, rackDepth, rackLevels, beamH, clearH);
      if (mr < numRacks - 1) {
        ctx.fillStyle = '#2563eb';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Aisle ' + aisleW + "'", toX(rackX + rackDepth + aisleW / 2), toY(0) - 5);
      }
    }

    // Divider
    var divX = storageStart + rackW;
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(divX), toY(0)); ctx.lineTo(toX(divX), toY(clearH * 0.5));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#666';
    ctx.font = '8px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Rack ←→ Bulk', toX(divX), toY(clearH * 0.5) - 8);

    // Bulk section
    var stackHi = p.stackHi || 3;
    var numStacks = Math.max(1, Math.floor(bulkW / 5));
    for (var mb = 0; mb < numStacks; mb++) {
      var stackX = divX + mb * 5 + 0.5;
      var layers = Math.ceil((mb % 3 + 1) * stackHi / 3);
      for (var ml = 0; ml < layers; ml++) {
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(toX(stackX), toY(ml * 5 + 4.5), 4 * scaleX, 4.5 * scaleY);
        ctx.strokeStyle = '#C8A882';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(toX(stackX), toY(ml * 5 + 4.5), 4 * scaleX, 4.5 * scaleY);
      }
    }
  } else {
    // Standard rack (single or double)
    var rackSpacing = aisleW + rackDepth;
    var numRacks = Math.max(1, Math.floor(storageW / rackSpacing));
    for (var ri = 0; ri < numRacks; ri++) {
      var rackX = storageStart + ri * rackSpacing;
      _elevDrawRack(ctx, toX, toY, rackX, rackDepth, rackLevels, beamH, clearH);
      if (ri < numRacks - 1) {
        ctx.fillStyle = '#2563eb';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Aisle ' + aisleW + "'", toX(rackX + rackDepth + aisleW / 2), toY(0) - 5);
      }
    }
  }

  // Storage label
  ctx.fillStyle = '#2563eb';
  ctx.font = '9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Storage', toX(storageStart + storageW / 2), toY(0) - 8);
  cursor = storageEnd;

  // Sprinkler clearance line
  if (storeType !== 'bulk') {
    var topOfLoad = (rackLevels - 1) * beamH + beamH * 0.8;
    var sprinklerY = topOfLoad + 3;
    if (sprinklerY < clearH) {
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toX(storageStart), toY(sprinklerY));
      ctx.lineTo(toX(storageEnd), toY(sprinklerY));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e53935';
      ctx.font = '9px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('Sprinkler clearance', toX(storageEnd) + 5, toY(sprinklerY) + 3);
    }
  }

  // Shipping staging
  ctx.fillStyle = 'rgba(249,115,22,0.08)';
  ctx.fillRect(toX(cursor), toY(clearH), stagingW * scaleX, clearH * scaleY);
  for (var sp2 = 0; sp2 < numPallets; sp2++) {
    if (sp2 % 2 === 0) {
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(toX(cursor + sp2 * 5 + 0.5), toY(3.5), 4 * scaleX, 3.5 * scaleY);
      ctx.strokeStyle = '#C8A882';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(toX(cursor + sp2 * 5 + 0.5), toY(3.5), 4 * scaleX, 3.5 * scaleY);
    }
  }
  ctx.fillStyle = '#f97316';
  ctx.font = '9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Ship Staging', toX(cursor + stagingW / 2), toY(0) - 8);
  cursor += stagingW;

  // ── BUILDING RIGHT WALL (before exterior area) ──
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(toX(bldgW), toY(0));
  ctx.lineTo(toX(bldgW), toY(clearH + 3));
  ctx.stroke();

  // ── EXTERIOR GRADE LEVEL (4 feet below building floor) ──
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(toX(bldgW), toY(exteriorGrade), (dockDepth + 25) * scaleX, 4 * scaleY);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(toX(bldgW), toY(exteriorGrade), (dockDepth + 25) * scaleX, 4 * scaleY);

  // ── STEP-DOWN from building floor to exterior grade ──
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(toX(bldgW), toY(0));
  ctx.lineTo(toX(bldgW), toY(exteriorGrade));
  ctx.stroke();

  // ── Dock area with truck trailer profile (OUTSIDE building) ──
  var dockStart = bldgW;
  var dockEnd = dockStart + dockDepth;

  // Dock platform: from exterior grade (Y=-4) to building floor (Y=0)
  ctx.fillStyle = '#d0d0d0';
  ctx.fillRect(toX(dockStart), toY(0), dockDepth * scaleX, 4 * scaleY);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.strokeRect(toX(dockStart), toY(0), dockDepth * scaleX, 4 * scaleY);
  // "DOCK" label on platform
  ctx.fillStyle = '#666';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('DOCK', toX(dockStart + dockDepth / 2), toY(-2) + 3);

  // Dock door opening: in the building wall (Y=0 to Y=14)
  ctx.fillStyle = '#fff';
  ctx.fillRect(toX(bldgW - 1), toY(14), 2 * scaleX, 14 * scaleY);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.strokeRect(toX(bldgW - 1), toY(14), 2 * scaleX, 14 * scaleY);

  // Truck trailer profile (on exterior grade, behind dock)
  var trailerStart = dockEnd;
  var trailerWidth = 53;
  ctx.fillStyle = '#e8e0d8';
  ctx.fillRect(toX(trailerStart), toY(13.5), trailerWidth * scaleX, 13.5 * scaleY);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(toX(trailerStart), toY(13.5), trailerWidth * scaleX, 13.5 * scaleY);
  // "TRAILER" label inside
  ctx.fillStyle = '#777';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('TRAILER', toX(trailerStart + trailerWidth / 2), toY(7));
  // Wheels on exterior grade (Y=-4)
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(toX(trailerStart + 15), toY(exteriorGrade), 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(toX(trailerStart + trailerWidth - 15), toY(exteriorGrade), 3, 0, Math.PI * 2);
  ctx.fill();

  // Dock zone label (below dock)
  ctx.fillStyle = '#0ea5e9';
  ctx.font = '9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Dock', toX(dockStart + dockDepth / 2), toY(exteriorGrade) - 8);

  // Dock height dimension (4' from exterior grade to dock surface)
  _elevDimV(ctx, toX(dockEnd) + 8, toY(exteriorGrade), toY(0), "4' dock ht");

  // ── RIGHT-SIDE BUILDING DIMENSIONS (stacked outward from building edge) ──
  var roofPeak = 4;
  var rightDims = [];
  rightDims.push({ y1: 0, y2: clearH, label: clearH + "' clear" });
  rightDims.push({ y1: 0, y2: clearH + roofPeak, label: (clearH + roofPeak) + "' roof" });
  if (storeType !== 'bulk') {
    var tos = beamH * rackLevels - beamH * 0.25;
    rightDims.push({ y1: 0, y2: tos, label: tos.toFixed(1) + "' TOS" });
    if (clearH - tos > 2) {
      rightDims.push({ y1: tos, y2: clearH, label: (clearH - tos).toFixed(1) + "' gap", dash: true, color: '#e53935' });
    }
  }
  // Sort by endpoint height (y2) ascending for cleaner spacing
  rightDims.sort(function(a, b) { return a.y2 - b.y2; });
  var baseX = toX(bldgW) + 20;
  var dimSpacing = 45;  // Reduced from 55 for tighter spacing
  for (var di = 0; di < rightDims.length; di++) {
    rightDims[di].x = baseX + di * dimSpacing;
  }
  for (var di = 0; di < rightDims.length; di++) {
    var rd = rightDims[di];
    if (rd.dash || rd.color) {
      ctx.save();
      if (rd.dash) ctx.setLineDash([4, 3]);
      if (rd.color) ctx.strokeStyle = rd.color;
      _elevDimV(ctx, rd.x, toY(rd.y1), toY(rd.y2), rd.label);
      ctx.restore();
    } else {
      _elevDimV(ctx, rd.x, toY(rd.y1), toY(rd.y2), rd.label);
    }
  }

  // ── EXTERIOR DOCK/TRAILER DIMENSIONS (outside building, near trailer) ──
  var truckDimX = toX(trailerStart + trailerWidth + 10);
  _elevDimV(ctx, truckDimX, toY(0), toY(13.5), "13.5' trailer");
  _elevDimV(ctx, truckDimX + dimSpacing, toY(0), toY(14), "14' door clr");

  // Sprinkler gap dimension (between TOS and sprinkler line)
  if (storeType !== 'bulk') {
    var tos = beamH * rackLevels - beamH * 0.25;
    var sprinklerGap = clearH - tos;
    if (sprinklerGap > 1) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#e53935';
      _elevDimV(ctx, toX(storageStart + rackDepth * 1.5 + aisleW * 0.5), toY(tos), toY(clearH), sprinklerGap.toFixed(1) + "' sprinkler gap");
      ctx.restore();
    }
  }

  // ── INTERNAL DIMENSIONS ──
  // Pallet load height (inside first rack bay) — only if >= 4 ft
  if (storeType !== 'bulk') {
    var loadH = beamH * 0.75;
    if (loadH >= 4) {
      _elevDimV(ctx, toX(storageStart + rackDepth + 2), toY(0.5), toY(0.5 + loadH), loadH.toFixed(1) + "'");
    }
    // Beam height per level (inside storage, offset from pallet load)
    _elevDimV(ctx, toX(storageStart + rackDepth * 2 + aisleW + 2), toY(0), toY(beamH), beamH.toFixed(1) + "' / level");
  }
  // Office height
  if (officeW > 0) {
    _elevDimV(ctx, toX(0) - 15, toY(0), toY(10), "10' office");
  }
  // Aisle width (between first two racks, if applicable)
  if (storeType !== 'bulk' && storeType !== 'carton') {
    var rackSpacingDim = aisleW + rackDepth;
    if (storageW > rackSpacingDim * 2) {
      var aisle1Start = storageStart + rackDepth;
      var aisle1End = aisle1Start + aisleW;
      _elevDimH(ctx, toX(aisle1Start), toX(aisle1End), toY(0) + 50, aisleW + "' aisle");
    }
  }
  // Storage zone width
  _elevDimH(ctx, toX(storageStart), toX(storageEnd), toY(0) + 65, Math.round(storageEnd - storageStart) + "' storage");
  // Building width (bottom)
  _elevDimH(ctx, toX(0), toX(bldgW), toY(0) + 35, 'Building Width: ' + Math.round(bldgW) + ' ft');

  // ── Legend (horizontal strip below floor line) ──
  _elevDrawLegend(ctx, W, toY(0) + 85);

  // Store resize handler
  if (!window._wscElevResizeHandler) {
    window._wscElevResizeHandler = function() {
      if (wscViewMode !== 'elevation') return;
      var p2 = wscLastLayoutParams;
      if (p2) renderElevationView(p2);
    };
    window.addEventListener('resize', window._wscElevResizeHandler);
  }
}

// ── Elevation helper: draw rack cross-section ──
function _elevDrawRack(ctx, toX, toY, rackX, rackDepth, rackLevels, beamH, clearH) {
  // Uprights (blue)
  ctx.strokeStyle = '#4444cc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toX(rackX), toY(0)); ctx.lineTo(toX(rackX), toY(clearH * 0.95));
  ctx.moveTo(toX(rackX + rackDepth), toY(0)); ctx.lineTo(toX(rackX + rackDepth), toY(clearH * 0.95));
  ctx.stroke();

  // Beams and pallets per level
  for (var lvl = 1; lvl <= rackLevels; lvl++) {
    var beamY = lvl * beamH;
    // Beams (orange)
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(toX(rackX), toY(beamY));
    ctx.lineTo(toX(rackX + rackDepth), toY(beamY));
    ctx.stroke();

    // Pallet load
    var loadBot = (lvl - 1) * beamH + 0.3;
    var loadH = beamH * 0.75;
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(toX(rackX + 0.3), toY(loadBot + loadH), (rackDepth - 0.6) * (toX(1) - toX(0)), loadH * (toY(0) - toY(1)));
    ctx.strokeStyle = '#C8A882';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(toX(rackX + 0.3), toY(loadBot + loadH), (rackDepth - 0.6) * (toX(1) - toX(0)), loadH * (toY(0) - toY(1)));
  }
}

// ── Elevation helper: vertical dimension line ──
function _elevDimV(ctx, x, y1, y2, label) {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y1); ctx.lineTo(x, y2);
  ctx.stroke();
  // Tick marks
  ctx.beginPath();
  ctx.moveTo(x - 4, y1); ctx.lineTo(x + 4, y1);
  ctx.moveTo(x - 4, y2); ctx.lineTo(x + 4, y2);
  ctx.stroke();
  // Arrows
  ctx.beginPath();
  ctx.moveTo(x, y1); ctx.lineTo(x - 3, y1 - 5); ctx.moveTo(x, y1); ctx.lineTo(x + 3, y1 - 5);
  ctx.moveTo(x, y2); ctx.lineTo(x - 3, y2 + 5); ctx.moveTo(x, y2); ctx.lineTo(x + 3, y2 + 5);
  ctx.stroke();
  // Label (rotated)
  ctx.save();
  ctx.translate(x + 12, (y1 + y2) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#333';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

// ── Elevation helper: horizontal dimension line ──
function _elevDimH(ctx, x1, x2, y, label, color) {
  ctx.strokeStyle = color || '#333';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y); ctx.lineTo(x2, y);
  ctx.stroke();
  // Arrows
  ctx.beginPath();
  ctx.moveTo(x1, y); ctx.lineTo(x1 + 5, y - 3); ctx.moveTo(x1, y); ctx.lineTo(x1 + 5, y + 3);
  ctx.moveTo(x2, y); ctx.lineTo(x2 - 5, y - 3); ctx.moveTo(x2, y); ctx.lineTo(x2 - 5, y + 3);
  ctx.stroke();
  // Ticks
  ctx.beginPath();
  ctx.moveTo(x1, y - 4); ctx.lineTo(x1, y + 4);
  ctx.moveTo(x2, y - 4); ctx.lineTo(x2, y + 4);
  ctx.stroke();
  ctx.fillStyle = color || '#333';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(label, (x1 + x2) / 2, y - 6);
}

// ── Elevation legend (horizontal strip below floor) ──
function _elevDrawLegend(ctx, canvasW, y) {
  var items = [
    { type: 'line', color: '#1a73e8', width: 1.5, label: 'Clear Height' },
    { type: 'dash', color: '#e53935', width: 1, label: 'Sprinkler Clr' },
    { type: 'rect', fill: '#DEB887', stroke: '#C8A882', label: 'Pallet Load' },
    { type: 'vert', color: '#4444cc', width: 2, label: 'Rack Upright' },
    { type: 'line', color: '#ff8800', width: 1.5, label: 'Rack Beam' },
    { type: 'rect', fill: '#e0e0e0', stroke: '#ccc', label: 'Floor Slab' }
  ];
  ctx.font = '9px system-ui';
  ctx.textAlign = 'left';
  // Measure total width: 16px swatch + 4px gap + text + 20px item gap
  var totalW = 0;
  for (var i = 0; i < items.length; i++) {
    totalW += 20 + ctx.measureText(items[i].label).width + (i < items.length - 1 ? 20 : 0);
  }
  var lx = (canvasW - totalW) / 2;

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (it.type === 'line') {
      ctx.strokeStyle = it.color; ctx.lineWidth = it.width; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx + 16, y); ctx.stroke();
    } else if (it.type === 'dash') {
      ctx.strokeStyle = it.color; ctx.lineWidth = it.width; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx + 16, y); ctx.stroke();
      ctx.setLineDash([]);
    } else if (it.type === 'rect') {
      ctx.fillStyle = it.fill; ctx.fillRect(lx, y - 4, 12, 8);
      ctx.strokeStyle = it.stroke; ctx.lineWidth = 0.5; ctx.strokeRect(lx, y - 4, 12, 8);
    } else if (it.type === 'vert') {
      ctx.strokeStyle = it.color; ctx.lineWidth = it.width;
      ctx.beginPath(); ctx.moveTo(lx + 6, y - 5); ctx.lineTo(lx + 6, y + 5); ctx.stroke();
    }
    ctx.fillStyle = '#333';
    ctx.fillText(it.label, lx + 20, y + 3);
    lx += 20 + ctx.measureText(it.label).width + 20;
  }
}

