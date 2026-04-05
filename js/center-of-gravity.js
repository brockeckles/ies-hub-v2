// ============================================================================
// center-of-gravity.js
// Center of Gravity / Basic Network Optimization Tool — demand points,
// K-means clustering, Leaflet map, freight mode presets, CSV export
// ============================================================================

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



// ═══════════════════════════════════════════════════════════════════
// CENTER OF GRAVITY — SCENARIO MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════
// CENTER OF GRAVITY — LANDING PAGE
// ═══════════════════════════════════════════════════════════════════
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
