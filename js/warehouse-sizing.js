// ============================================================================
// warehouse-sizing.js
// Warehouse Sizing Calculator — layout renderer, calcWarehouse engine,
// 3D view (Three.js), elevation view, scenario management, CM integration
// ============================================================================

// ── WSC Number Input Formatter ──
// Formats number inputs with commas on blur, strips on focus
// Listeners attach once (guarded by dataset.wscFmt), but re-format runs every call
function wscFormatInputs() {
  var ids = ['wsc-peakunits','wsc-avgunits'];
  ids.forEach(function(id) {
    var inp = document.getElementById(id);
    if (!inp) return;
    // Attach listeners only once
    if (!inp.dataset.wscFmt) {
      inp.dataset.wscFmt = '1';
      inp.type = 'text';
      inp.style.fontVariantNumeric = 'tabular-nums';
      inp.addEventListener('focus', function() {
        var n = parseInt(this.value.replace(/,/g,''), 10);
        this.value = isNaN(n) ? '' : String(n);
        this.select();
      });
      inp.addEventListener('blur', function() {
        var n = parseInt(this.value.replace(/,/g,''), 10);
        if (!isNaN(n)) this.value = n.toLocaleString();
      });
    }
    // Always re-format current value (critical for scenario reload)
    var v = parseInt(inp.value.replace(/,/g,''), 10);
    if (!isNaN(v)) inp.value = v.toLocaleString();
  });
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
  var dockStagingGap = 6;
  var botSY = twoDock ? botDY-shipStH-dockStagingGap : botDY-Math.max(recvStH, shipStH)-dockStagingGap;

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
    var isDouble = modFt > 10; // 16.5 for double-deep vs 8.5 for single
    // Double-deep uses warm amber/orange — single-deep stays blue
    var ddFront = 'rgba(245,158,11,0.55)';  // amber front row
    var ddBack  = 'rgba(217,119,6,0.5)';    // darker amber back row
    var ddFlue  = 'rgba(255,60,60,0.6)';    // bright red flue line
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
      for (var i = 0; i < nm; i++) {
        var mx = x + i * mW;
        if (mx + rkW > x + w + 1) break;
        if (isDouble) {
          // Double-deep: wide module with 4 sub-strips [front][back] flue [back][front]
          var gap = 1.5;            // visible flue gap
          var halfRk = (rkW - gap) / 2;  // each half-module
          var frontW = halfRk * 0.5;
          var backW  = halfRk * 0.5;
          // Left half: front + back
          s += '<rect x="'+mx+'" y="'+y+'" width="'+frontW+'" height="'+h+'" fill="'+ddFront+'" rx="0.3" data-rack="1"/>';
          s += '<rect x="'+(mx+frontW)+'" y="'+y+'" width="'+backW+'" height="'+h+'" fill="'+ddBack+'" rx="0.3" data-rack="1"/>';
          // Center flue line — bright red
          var flueX = mx + halfRk;
          s += '<rect x="'+flueX+'" y="'+y+'" width="'+gap+'" height="'+h+'" fill="'+ddFlue+'" rx="0" data-rack="1"/>';
          // Right half: back + front
          s += '<rect x="'+(flueX+gap)+'" y="'+y+'" width="'+backW+'" height="'+h+'" fill="'+ddBack+'" rx="0.3" data-rack="1"/>';
          s += '<rect x="'+(flueX+gap+backW)+'" y="'+y+'" width="'+frontW+'" height="'+h+'" fill="'+ddFront+'" rx="0.3" data-rack="1"/>';
        } else {
          // Single-deep: 2 back-to-back strips (blue)
          var hr = (rkW - 1) / 2;
          s += '<rect x="'+mx+'" y="'+y+'" width="'+hr+'" height="'+h+'" fill="'+C.storage.rack+'" rx="0.5" data-rack="1"/>';
          s += '<rect x="'+(mx+hr+1)+'" y="'+y+'" width="'+hr+'" height="'+h+'" fill="'+C.storage.rack+'" rx="0.5" data-rack="1"/>';
        }
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
      for (var i = 0; i < nm; i++) {
        var my = y + i * mH;
        if (my + rkH > y + h + 1) break;
        if (isDouble) {
          var gap = 1.5;
          var halfRk = (rkH - gap) / 2;
          var frontH = halfRk * 0.5;
          var backH  = halfRk * 0.5;
          s += '<rect x="'+x+'" y="'+my+'" width="'+w+'" height="'+frontH+'" fill="'+ddFront+'" rx="0.3" data-rack="1"/>';
          s += '<rect x="'+x+'" y="'+(my+frontH)+'" width="'+w+'" height="'+backH+'" fill="'+ddBack+'" rx="0.3" data-rack="1"/>';
          var flueY = my + halfRk;
          s += '<rect x="'+x+'" y="'+flueY+'" width="'+w+'" height="'+gap+'" fill="'+ddFlue+'" rx="0" data-rack="1"/>';
          s += '<rect x="'+x+'" y="'+(flueY+gap)+'" width="'+w+'" height="'+backH+'" fill="'+ddBack+'" rx="0.3" data-rack="1"/>';
          s += '<rect x="'+x+'" y="'+(flueY+gap+backH)+'" width="'+w+'" height="'+frontH+'" fill="'+ddFront+'" rx="0.3" data-rack="1"/>';
        } else {
          var hr = (rkH - 1) / 2;
          s += '<rect x="'+x+'" y="'+my+'" width="'+w+'" height="'+hr+'" fill="'+C.storage.rack+'" rx="0.5" data-rack="1"/>';
          s += '<rect x="'+x+'" y="'+(my+hr+1)+'" width="'+w+'" height="'+hr+'" fill="'+C.storage.rack+'" rx="0.5" data-rack="1"/>';
        }
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
    // Place label below the dock rect (left-aligned, outside the zone)
    s += '<text x="'+(bX+3)+'" y="'+(wy+wh+10)+'" text-anchor="start" fill="'+C.dock.text+'" font-size="'+F.detail+'" font-family="Montserrat,sans-serif" font-weight="600" data-zone-label="'+dockZone+'">'+lbl+'</text>';
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
  if (typeof markDirty === 'function') markDirty('Warehouse Sizing');
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
  // Save scroll position before resizing
  var savedScroll = panel.scrollTop;
  // Temporarily remove max-height to measure natural height
  panel.style.maxHeight = 'none';
  var rightH = rightCol.offsetHeight;
  var panelNatural = panel.scrollHeight;
  // If input content is shorter than right column, let it match right column height
  // If input content is taller, cap at right column height and scroll
  if (rightH > 0) {
    panel.style.maxHeight = Math.max(rightH, 400) + 'px';
  }
  // Restore scroll position so panel doesn't jump to top
  panel.scrollTop = savedScroll;
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

        if (typeof markClean === 'function') markClean();
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
  wscFormatInputs();
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
// Each rack row is always a standard 4ft-deep frame.
// Double-deep is handled by the CALLER placing 4 rows per module.
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

    // 2 uprights per bay (front + back of this 4ft frame)
    var uprightPositions = [0, depth];
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

    // Beams + pallets per level
    for (var lvl = 1; lvl <= rackLevels; lvl++) {
      var beamY = lvl * beamH;
      var beamGeo = (direction === 'vertical')
        ? new THREE.BoxGeometry(depth, 0.2, 0.2)
        : new THREE.BoxGeometry(0.2, 0.2, depth);
      var beam1 = new THREE.Mesh(beamGeo, beamMat);
      var beam2 = new THREE.Mesh(beamGeo, beamMat);
      if (direction === 'vertical') {
        beam1.position.set(x + depth / 2, beamY, z + bx);
        beam2.position.set(x + depth / 2, beamY, z + bx + bayWidth);
      } else {
        beam1.position.set(x + bx, beamY, z + depth / 2);
        beam2.position.set(x + bx + bayWidth, beamY, z + depth / 2);
      }
      scene.add(beam1);
      scene.add(beam2);

      // Pallets (3 per bay per level)
      var palletBottom = (lvl - 1) * beamH + 0.5;
      var pH = beamH * 0.65;
      for (var pp = 0; pp < 3; pp++) {
        if (_wsc3dRand() < 0.85) {
          var pMat = new THREE.MeshStandardMaterial({ color: _wscPickPalletColor(), roughness: 0.7 });
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
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
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
      var rackDepth = 4; // always 4ft per individual rack frame
      var isDoubleDeep = (p.storeType === 'double');
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
        // Standard rack storage — back-to-back pairs
        // Single-deep module: [rack 4ft][rack 4ft] + aisle = 8.5 + aisle
        // Double-deep module: [rack 4][rack 4][gap 0.5][rack 4][rack 4] + aisle = 16.5 + aisle
        //   That's 4 individual 4ft rack frames arranged as 2 back-to-back pairs
        var modDepth = isDoubleDeep ? 16.5 : 8.5;
        var pairStep = aisleW + modDepth;
        var rd = 4; // each individual rack frame is always 4ft deep
        if (isVert) {
          var numPairs = Math.max(1, Math.floor(effW / pairStep));
          for (var rv = 0; rv < numPairs; rv++) {
            var rx = x3d + rv * pairStep;
            if (isDoubleDeep) {
              // 4 rack rows: [front A][back A] 0.5gap [back B][front B]
              _wsc3dBuildRackRow(scene, rx, z3d + 4, effD - 8, rackLevels, clearH * 0.9, 'vertical', rd);
              _wsc3dBuildRackRow(scene, rx + 4, z3d + 4, effD - 8, rackLevels, clearH * 0.9, 'vertical', rd);
              // 0.5ft flue gap
              _wsc3dBuildRackRow(scene, rx + 8.5, z3d + 4, effD - 8, rackLevels, clearH * 0.9, 'vertical', rd);
              _wsc3dBuildRackRow(scene, rx + 12.5, z3d + 4, effD - 8, rackLevels, clearH * 0.9, 'vertical', rd);
            } else {
              // 2 rack rows: [rack A][rack B] standard back-to-back
              _wsc3dBuildRackRow(scene, rx, z3d + 4, effD - 8, rackLevels, clearH * 0.9, 'vertical', rd);
              _wsc3dBuildRackRow(scene, rx + 4 + 0.5, z3d + 4, effD - 8, rackLevels, clearH * 0.9, 'vertical', rd);
            }
            // Aisle label
            if (rv < numPairs - 1) {
              var aisleCenter = rx + modDepth + aisleW / 2;
              var aisleLabelSprite = wsc3dMakeTextSprite('Aisle ' + (rv + 1) + '\n' + aisleW + "' wide", 0x2563EB);
              aisleLabelSprite.position.set(aisleCenter, 1.5, z3d + effD / 2);
              aisleLabelSprite.scale.set(16, 8, 1);
              scene.add(aisleLabelSprite);
            }
          }
        } else {
          var numPairs = Math.max(1, Math.floor(effD / pairStep));
          for (var rh = 0; rh < numPairs; rh++) {
            var rz = z3d + rh * pairStep;
            if (isDoubleDeep) {
              _wsc3dBuildRackRow(scene, x3d + 4, rz, effW - 8, rackLevels, clearH * 0.9, 'horizontal', rd);
              _wsc3dBuildRackRow(scene, x3d + 4, rz + 4, effW - 8, rackLevels, clearH * 0.9, 'horizontal', rd);
              _wsc3dBuildRackRow(scene, x3d + 4, rz + 8.5, effW - 8, rackLevels, clearH * 0.9, 'horizontal', rd);
              _wsc3dBuildRackRow(scene, x3d + 4, rz + 12.5, effW - 8, rackLevels, clearH * 0.9, 'horizontal', rd);
            } else {
              _wsc3dBuildRackRow(scene, x3d + 4, rz, effW - 8, rackLevels, clearH * 0.9, 'horizontal', rd);
              _wsc3dBuildRackRow(scene, x3d + 4, rz + 4 + 0.5, effW - 8, rackLevels, clearH * 0.9, 'horizontal', rd);
            }
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

  // ── Render-on-demand loop (perf fix: only render when dirty) ──
  window.wsc3dDirty = true;
  function animate() {
    wsc3dAnimationId = requestAnimationFrame(animate);
    if (!wsc3dRenderer) return;
    if (window.wsc3dDirty) {
      window.wsc3dDirty = false;
      renderer.render(scene, camera);
    }
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
      window.wsc3dDirty = true;
    };
    window.addEventListener('resize', window._wsc3dResizeHandler);
  }
}

// ── Camera update ──
function updateWsc3dCamera() {
  if (!wsc3dCamera) return;
  window.wsc3dDirty = true;
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
  var rackDepth = 4; // each individual rack frame is always 4ft deep
  var isDoubleDeep = (p.storeType === 'double');
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

  // Drawing area
  var padL = 60, padR = 100, padT = 40, padB = 110;
  var drawW = W - padL - padR;
  var drawH = H - padT - padB;

  // Scale to accommodate building + dock outside
  var totalExtent = bldgW + dockDepth + 10;
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

  // Office zone (advance cursor, no label)
  if (officeW > 0) {
    cursor += officeW;
  }

  // Receiving staging (advance cursor, no label)
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
      _elevDrawRack(ctx, toX, toY, rackX, rackDepth, rackLevels, beamH, clearH, storeType);
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
  } else if (isDoubleDeep) {
    // Double-deep: each module = [rack 4][rack 4][0.5 flue][rack 4][rack 4] + aisle
    // That's 4 individual standard rack frames per module
    var moduleW = 16.5 + aisleW; // 16.5ft of rack + aisle
    var numModules = Math.max(1, Math.floor(storageW / moduleW));
    for (var ri = 0; ri < numModules; ri++) {
      var modStart = storageStart + ri * moduleW;
      // Pair 1: front rack + back rack (back-to-back)
      _elevDrawRack(ctx, toX, toY, modStart, 4, rackLevels, beamH, clearH, 'single');
      _elevDrawRack(ctx, toX, toY, modStart + 4, 4, rackLevels, beamH, clearH, 'single');
      // 0.5ft flue gap (draw a thin red line)
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toX(modStart + 8.25), toY(0));
      ctx.lineTo(toX(modStart + 8.25), toY(clearH * 0.9));
      ctx.stroke();
      // Pair 2: back rack + front rack (back-to-back)
      _elevDrawRack(ctx, toX, toY, modStart + 8.5, 4, rackLevels, beamH, clearH, 'single');
      _elevDrawRack(ctx, toX, toY, modStart + 12.5, 4, rackLevels, beamH, clearH, 'single');
    }
    // Label
    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('DOUBLE-DEEP (back-to-back)', toX(storageStart + storageW / 2), toY(clearH * 0.95) - 6);
  } else {
    // Single-deep: standard back-to-back pairs
    var rackSpacing = aisleW + rackDepth;
    var numRacks = Math.max(1, Math.floor(storageW / rackSpacing));
    for (var ri = 0; ri < numRacks; ri++) {
      var rackX = storageStart + ri * rackSpacing;
      _elevDrawRack(ctx, toX, toY, rackX, rackDepth, rackLevels, beamH, clearH, 'single');
    }
  }

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

  // Shipping staging (advance cursor, no label)
  cursor += stagingW;

  // ── BUILDING RIGHT WALL (before exterior area) ──
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(toX(bldgW), toY(0));
  ctx.lineTo(toX(bldgW), toY(clearH + 3));
  ctx.stroke();

  // ── Dock area (simple platform edge outside building) ──
  var dockStart = bldgW;
  var dockEnd = dockStart + dockDepth;

  // Small dock platform lip (subtle, not large gray blocks)
  ctx.fillStyle = '#d0d0d0';
  ctx.fillRect(toX(dockStart), toY(0), 8 * scaleX, 4 * scaleY);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(toX(dockStart), toY(0), 8 * scaleX, 4 * scaleY);

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
  // Aisle width (between first two modules)
  if (storeType !== 'bulk') {
    var firstModW = isDoubleDeep ? 16.5 : rackDepth;
    var aisleStart = storageStart + firstModW;
    _elevDimH(ctx, toX(aisleStart), toX(aisleStart + aisleW), toY(0) + 35, aisleW + "' aisle");
  }
  // Storage zone width
  _elevDimH(ctx, toX(storageStart), toX(storageEnd), toY(0) + 55, Math.round(storageEnd - storageStart) + "' storage");
  // Building width (bottom)
  _elevDimH(ctx, toX(0), toX(bldgW), toY(0) + 75, 'Building Width: ' + Math.round(bldgW) + ' ft');

  // ── Legend (horizontal strip below floor line) ──
  _elevDrawLegend(ctx, W, toY(0) + 95);

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
function _elevDrawRack(ctx, toX, toY, rackX, rackDepth, rackLevels, beamH, clearH, storeType) {
  var unitPx = toX(1) - toX(0);
  var unitPy = toY(0) - toY(1);

  if (storeType === 'double') {
    // Double-deep: two 4ft bays back-to-back sharing center uprights
    var halfD = rackDepth / 2; // 4ft each side

    // Outer uprights — AMBER for double-deep (matches 2D + 3D)
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toX(rackX), toY(0)); ctx.lineTo(toX(rackX), toY(clearH * 0.95));
    ctx.moveTo(toX(rackX + rackDepth), toY(0)); ctx.lineTo(toX(rackX + rackDepth), toY(clearH * 0.95));
    ctx.stroke();

    // Center upright (shared back-to-back) — RED, thicker
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toX(rackX + halfD), toY(0)); ctx.lineTo(toX(rackX + halfD), toY(clearH * 0.95));
    ctx.stroke();

    // X-bracing on both bays — amber tint
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 0.6;
    for (var lvl = 1; lvl <= rackLevels; lvl++) {
      var bTop = lvl * beamH;
      var bBot = (lvl - 1) * beamH;
      // Left bay X
      ctx.beginPath();
      ctx.moveTo(toX(rackX), toY(bBot)); ctx.lineTo(toX(rackX + halfD), toY(bTop));
      ctx.moveTo(toX(rackX + halfD), toY(bBot)); ctx.lineTo(toX(rackX), toY(bTop));
      ctx.stroke();
      // Right bay X
      ctx.beginPath();
      ctx.moveTo(toX(rackX + halfD), toY(bBot)); ctx.lineTo(toX(rackX + rackDepth), toY(bTop));
      ctx.moveTo(toX(rackX + rackDepth), toY(bBot)); ctx.lineTo(toX(rackX + halfD), toY(bTop));
      ctx.stroke();
    }

    // Beams and pallets per level on both bays
    for (var lvl = 1; lvl <= rackLevels; lvl++) {
      var beamY = lvl * beamH;
      ctx.strokeStyle = '#F59E0B'; // amber beams for double-deep
      ctx.lineWidth = 1.5;
      // Left bay beam
      ctx.beginPath();
      ctx.moveTo(toX(rackX), toY(beamY)); ctx.lineTo(toX(rackX + halfD), toY(beamY));
      ctx.stroke();
      // Right bay beam
      ctx.beginPath();
      ctx.moveTo(toX(rackX + halfD), toY(beamY)); ctx.lineTo(toX(rackX + rackDepth), toY(beamY));
      ctx.stroke();

      // Pallet loads in both bays
      var loadBot = (lvl - 1) * beamH + 0.3;
      var loadH = beamH * 0.75;
      // Left bay pallet
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(toX(rackX + 0.3), toY(loadBot + loadH), (halfD - 0.6) * unitPx, loadH * unitPy);
      ctx.strokeStyle = '#C8A882';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(toX(rackX + 0.3), toY(loadBot + loadH), (halfD - 0.6) * unitPx, loadH * unitPy);
      // Right bay pallet
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(toX(rackX + halfD + 0.3), toY(loadBot + loadH), (halfD - 0.6) * unitPx, loadH * unitPy);
      ctx.strokeStyle = '#C8A882';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(toX(rackX + halfD + 0.3), toY(loadBot + loadH), (halfD - 0.6) * unitPx, loadH * unitPy);
    }
  } else {
    // Single-deep: standard rack with 2 uprights
    ctx.strokeStyle = '#4444cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(rackX), toY(0)); ctx.lineTo(toX(rackX), toY(clearH * 0.95));
    ctx.moveTo(toX(rackX + rackDepth), toY(0)); ctx.lineTo(toX(rackX + rackDepth), toY(clearH * 0.95));
    ctx.stroke();

    // X-bracing
    ctx.strokeStyle = '#7777cc';
    ctx.lineWidth = 0.6;
    for (var lvl = 1; lvl <= rackLevels; lvl++) {
      var bTop = lvl * beamH;
      var bBot = (lvl - 1) * beamH;
      ctx.beginPath();
      ctx.moveTo(toX(rackX), toY(bBot)); ctx.lineTo(toX(rackX + rackDepth), toY(bTop));
      ctx.moveTo(toX(rackX + rackDepth), toY(bBot)); ctx.lineTo(toX(rackX), toY(bTop));
      ctx.stroke();
    }

    // Beams and pallets per level
    for (var lvl = 1; lvl <= rackLevels; lvl++) {
      var beamY = lvl * beamH;
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(toX(rackX), toY(beamY));
      ctx.lineTo(toX(rackX + rackDepth), toY(beamY));
      ctx.stroke();

      var loadBot = (lvl - 1) * beamH + 0.3;
      var loadH = beamH * 0.75;
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(toX(rackX + 0.3), toY(loadBot + loadH), (rackDepth - 0.6) * unitPx, loadH * unitPy);
      ctx.strokeStyle = '#C8A882';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(toX(rackX + 0.3), toY(loadBot + loadH), (rackDepth - 0.6) * unitPx, loadH * unitPy);
    }
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

