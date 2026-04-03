// ═══════════════════════════════════════════════════════════════════════
// wiki-content.js
// Training Wiki + Security Section content and display functions
// Extracted from index.html
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// TRAINING WIKI CONTENT
// ═══════════════════════════════════════════════════
var WIKI_PAGES = {};

// ═══════════════════════════════════════════════════
// SCC: G2P ORDER FULFILLMENT (Cube-Based AS/RS, Rack & Shelf Picker, ACRs)
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-g2p'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Order Fulfillment / G2P</div>' +
  '<h2>G2P Order Fulfillment</h2>' +
  '<p>Goods-to-Person (G2P) systems bring inventory to the operator, eliminating walk time — the single largest non-value-add activity in warehousing. This SCC covers Cube-Based AS/RS (AutoStore, Hai Robotics), Rack & Shelf Picker systems (Exotec Skypod), and Autonomous Case-handling Robots (ACRs). IES designers should consider G2P whenever the profile involves high-SKU each-picking with throughput targets above 150 lines/hr per station.</p>' +

  // Category cards
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Cube-Based AS/RS</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">AutoStore, Hai Robotics — dense cube storage with robot-on-top retrieval. Best for small-to-medium items, highest density per sq ft.</div></div>' +
    '<div style="background:linear-gradient(135deg,#2d1a3e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #8b5cf6;">' +
    '<div style="color:#8b5cf6;font-weight:700;font-size:14px;margin-bottom:8px;">Rack & Shelf 2Picker</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Exotec Skypod — robots climb racking to retrieve bins from any level. Combines high density with high throughput.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">ACRs</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Autonomous Case-handling Robots navigate existing racking to pull totes/cases. Lower infrastructure investment, retrofit-friendly.</div></div>' +
  '</div>' +

  // Comparison matrix
  '<h3>G2P System Comparison</h3>' +
  '<table class="wiki-spec-table"><tr><th>System</th><th>Throughput / Station</th><th>Storage Density</th><th>Best For</th><th>Capital Range</th></tr>' +
  '<tr><td>AutoStore</td><td>65–120 bins/hr</td><td>4× vs. shelving</td><td>Small items, e-commerce</td><td>$3M–$15M+</td></tr>' +
  '<tr><td>Hai Robotics (HAIPICK)</td><td>80–120 totes/hr</td><td>3× vs. shelving</td><td>Multi-deep tote storage</td><td>$2M–$10M</td></tr>' +
  '<tr><td>Exotec Skypod</td><td>400+ bins/hr</td><td>5× vs. shelving</td><td>High-throughput + density</td><td>$5M–$20M+</td></tr>' +
  '<tr><td>ACRs (various)</td><td>40–80 totes/hr</td><td>1.5–2× vs. manual</td><td>Retrofit, mixed operations</td><td>$1M–$5M</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">When to Recommend G2P</div>' +
  '<p style="font-size:13px;">G2P wins when: SKU count > 5,000, each-pick dominant, labor market is tight (score < 50), client needs 200+ lines/hr/station, and facility has ceiling height for dense storage. It loses when the profile is case-pick or pallet-pick dominant, or when throughput needs are below 100 lines/hr.</p></div>' +

  // ── Sizing Methodology ──
  '<h3>G2P Sizing Methodology</h3>' +
  '<div class="wiki-callout"><div class="wiki-callout-title">Booth Count Formula</div>' +
  '<p style="font-size:12px;font-family:monospace;background:#0f172a;padding:12px;border-radius:6px;color:#e2e8f0;">Stations Required = (Daily Lines ÷ Lines per Wave) ÷ (Station Throughput/hr × Hours per Shift) × Safety Factor (1.15–1.25)</p>' +
  '<p style="font-size:12px;margin-top:8px;"><strong>Example:</strong> 40,000 lines/day, 400-line waves, Exotec at 350 lines/hr, 8-hr shift → (40,000 ÷ 400) ÷ (350 × 8) × 1.2 = <strong>~43 stations needed</strong> (or ~5–6 with continuous flow). For AutoStore at 100 lines/hr: (40,000) ÷ (100 × 8) × 1.2 = <strong>60 stations</strong>.</p></div>' +

  // ── Implementation Timeline ──
  '<h3>Implementation Timeline</h3>' +
  '<table class="wiki-spec-table"><tr><th>Phase</th><th>Duration</th><th>Key Activities</th></tr>' +
  '<tr><td>Design & Engineering</td><td>3–4 months</td><td>Layout modeling, simulation, WMS integration spec, power/structural assessment</td></tr>' +
  '<tr><td>Procurement</td><td>3–6 months</td><td>Vendor selection, contract negotiation, equipment manufacturing (Exotec 14–16 wk lead, Hai 10–12 wk, AutoStore 12–16 wk)</td></tr>' +
  '<tr><td>Site Preparation</td><td>2–3 months</td><td>Floor remediation (flatness ±3mm/3m), power upgrades (500–800 kW typical), fire suppression review</td></tr>' +
  '<tr><td>Installation & Commissioning</td><td>2–4 months</td><td>Racking install, robot deployment, WCS/WMS integration testing, safety validation</td></tr>' +
  '<tr><td>Ramp & Optimization</td><td>1–2 months</td><td>Operator training, throughput ramp (start at 60%, target 95% within 6 weeks), slotting optimization</td></tr>' +
  '<tr style="font-weight:700;background:#1e293b;"><td>Total</td><td>12–18 months</td><td>Critical path: equipment lead time + floor prep (concurrent)</td></tr></table>' +

  // ── Facility Requirements ──
  '<h3>Facility Requirements</h3>' +
  '<table class="wiki-spec-table"><tr><th>Requirement</th><th>AutoStore</th><th>Hai Robotics (ACR)</th><th>Exotec Skypod</th></tr>' +
  '<tr><td>Min. Ceiling Height</td><td>16 ft (5.5m grid)</td><td>12 ft (standard rack)</td><td>36 ft (up to 12m rack)</td></tr>' +
  '<tr><td>Floor Load Capacity</td><td>3,000 lbs/ft² (grid load)</td><td>Standard warehouse</td><td>Standard warehouse</td></tr>' +
  '<tr><td>Floor Flatness</td><td>FM2 (±3mm/3m)</td><td>Standard FM3</td><td>FM2 (±3mm/3m)</td></tr>' +
  '<tr><td>Power (typical install)</td><td>200–500 kW</td><td>100–300 kW</td><td>300–800 kW</td></tr>' +
  '<tr><td>Fire Suppression</td><td>In-rack ESFR required</td><td>Standard sprinkler</td><td>In-rack sprinkler recommended</td></tr>' +
  '<tr><td>Temperature Range</td><td>32–104°F (0–40°C)</td><td>32–104°F</td><td>32–113°F (0–45°C)</td></tr></table>' +

  // ── BY WMS Integration ──
  '<h3>Blue Yonder WMS Integration</h3>' +
  '<div class="wiki-callout"><div class="wiki-callout-title">BY Configuration Checklist for G2P</div>' +
  '<p style="font-size:12px;line-height:1.7;"><strong>1. Wave Planning:</strong> Configure micro-waves (50–100 orders) optimized for G2P station batch size. BY wave engine must account for robot travel time, not aisle walk time.<br>' +
  '<strong>2. Task Interleaving:</strong> Enable putaway-during-pick interleaving — G2P robots can return bins to storage while delivering new pick bins.<br>' +
  '<strong>3. Slotting:</strong> Configure velocity-based slotting with A/B/C zones. AutoStore: fast-movers near top of grid. Exotec: fast-movers at mid-height (fastest robot access).<br>' +
  '<strong>4. Inventory Sync:</strong> Real-time bin-level inventory via WCS API. BY must reconcile robot-reported counts with WMS expected counts every cycle.<br>' +
  '<strong>5. Exception Handling:</strong> Configure short-pick workflows — when robot presents bin with insufficient qty, BY must trigger replenishment task and re-queue the pick.</p></div>' +

  // ── ROI Example ──
  '<h3>ROI Worked Example</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:13px;color:#e2e8f0;line-height:1.7;">' +
  '<strong>Scenario:</strong> 40,000 lines/day, 8,000 SKU facility, manual picking today<br>' +
  '<strong>Current State:</strong> 45 pickers × $18/hr × 2,080 hrs = $1.68M labor/yr + $200K indirect = <strong>$1.88M/yr</strong><br>' +
  '<strong>G2P State (AutoStore):</strong> 12 stations × $18/hr × 2,080 hrs = $449K labor + $150K maintenance + $80K power = <strong>$679K/yr</strong><br>' +
  '<strong>Annual Savings:</strong> $1.88M − $679K = <strong>$1.2M/yr</strong><br>' +
  '<strong>System Cost:</strong> $6.5M installed (6,000-bin AutoStore)<br>' +
  '<strong>Simple Payback:</strong> $6.5M ÷ $1.2M = <strong>5.4 years</strong> (acceptable for 7+ year contracts)<br>' +
  '<em>Note: RaaS/OpEx models from Hai Robotics can reduce upfront capital to ~$2M + $300K/yr, improving cash flow.</em></div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=iHC9ec591lI" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> AutoStore Introduction</a>' +
    '<a href="https://www.youtube.com/watch?v=b9wqVs_sS70" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Hai Robotics ACR at JD.com</a>' +
    '<a href="https://www.youtube.com/watch?v=5EOECJ39g0k" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Exotec Skypod System</a>' +
  '</div>' +

  '<p style="margin-top:16px;"><strong>Deep Dives:</strong> Select <em>Goods-to-Person Vendors</em> in the sidebar for detailed vendor specs, SVG diagrams, and additional video resources for each G2P system.</p>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: P2G ORDER FULFILLMENT (Cobots, Smart Carts, AGV/AMR)
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-p2g'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Order Fulfillment / P2G</div>' +
  '<h2>P2G Order Fulfillment</h2>' +
  '<p>Person-to-Goods (P2G) keeps the operator moving through the warehouse but augments them with cobots, smart carts, and AMR transport to reduce walk time and increase pick accuracy. P2G is the most common automation entry point for 3PL operations — lower capital than G2P, faster deployment, and easier to flex for multi-client environments.</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Collaborative Robots</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Locus, 6 River Systems (Shopify) — follow-me bots that carry picked items, direct the operator via screen, and transport completed orders.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">Smart Carts</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Powered carts with screens/scanners that guide picks and transport totes. Lower tech, lower cost, good for smaller operations.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">AGV/AMR Pallet, Bin, Case</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">AMRs that move pallets, bins, or cases between zones — receiving to storage, storage to pick, pick to pack. Replaces forklift/tugger runs.</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>Solution</th><th>Productivity Lift</th><th>Capital Cost</th><th>Deploy Time</th><th>Best For</th></tr>' +
  '<tr><td>Cobots (Locus/6RS)</td><td>2–3× picks/hr</td><td>RaaS $1–3K/bot/mo</td><td>4–8 weeks</td><td>E-comm each-pick, multi-client</td></tr>' +
  '<tr><td>Smart Carts</td><td>1.3–1.5× picks/hr</td><td>$2K–$5K/cart</td><td>1–2 weeks</td><td>Small ops, low-tech entry</td></tr>' +
  '<tr><td>Pallet AMR</td><td>Replaces 2–3 forklift FTEs</td><td>$50K–$150K/unit</td><td>8–12 weeks</td><td>Long transport runs, putaway</td></tr>' +
  '<tr><td>Bin/Case AMR</td><td>1.5–2× transport efficiency</td><td>$25K–$80K/unit</td><td>6–10 weeks</td><td>Zone-to-zone tote movement</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">When to Recommend P2G</div>' +
  '<p style="font-size:13px;">P2G is the default starting point when: client is new to automation, contract term is &lt;5 years (RaaS flexibility), multi-client shared space, or throughput targets are 80–200 lines/hr. Upgrade to G2P when density or throughput requirements exceed P2G ceilings.</p></div>' +

  // ── Vendor Overview ──
  '<h3>P2G Vendor Landscape</h3>' +
  '<table class="wiki-spec-table"><tr><th>Vendor</th><th>Platform</th><th>Payload</th><th>Pricing Model</th><th>Differentiator</th></tr>' +
  '<tr><td>Locus Robotics</td><td>LocusBot (Origin, Vector)</td><td>40–80 lbs</td><td>RaaS $1,500–$2,500/bot/mo</td><td>Market leader in 3PL; multi-bot orchestration; BY WMS certified</td></tr>' +
  '<tr><td>6 River Systems (Shopify)</td><td>Chuck</td><td>70 lbs</td><td>RaaS ~$2,000/bot/mo</td><td>Strong e-commerce integration; Shopify fulfillment network native</td></tr>' +
  '<tr><td>Geek+</td><td>PopPick, MovBot</td><td>Up to 1,000 kg</td><td>CapEx + maintenance</td><td>Versatile — sortation + picking + transport in one platform</td></tr>' +
  '<tr><td>inVia Robotics</td><td>PickerWall</td><td>40 lbs</td><td>RaaS per pick</td><td>Hybrid P2G/G2P — robots bring inventory to a fixed pick wall</td></tr></table>' +

  // ── Scaling Path ──
  '<h3>P2G → G2P Scaling Path</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:12px;color:#e2e8f0;line-height:1.8;">' +
  '<strong>Phase 1 (0–12 months):</strong> Deploy 5–8 cobots in highest-volume pick zone. Target: 2× productivity lift, prove ROI, train operators. Investment: ~$15K/mo RaaS.<br>' +
  '<strong>Phase 2 (12–24 months):</strong> Scale to 15–25 cobots across all pick zones. Add AMR transport for putaway/replenishment. Investment: ~$45K/mo RaaS.<br>' +
  '<strong>Decision Gate (24–36 months):</strong> If daily lines exceed 50,000 and SKU count >3,000, evaluate G2P upgrade. P2G cobots can be returned (RaaS) or redeployed to secondary zones while G2P handles primary volume.<br>' +
  '<strong>Hybrid Model:</strong> Many mature sites run P2G cobots in low-velocity zones + G2P for high-velocity zones — this is often the optimal long-term architecture.</div>' +

  // ── Floor Layout ──
  '<h3>Floor Space & Layout Requirements</h3>' +
  '<table class="wiki-spec-table"><tr><th>Zone</th><th>Space Required</th><th>Key Considerations</th></tr>' +
  '<tr><td>Pick Zone</td><td>2,000–3,000 m² per 10 cobots</td><td>Standard aisle widths (8–10 ft); cobots need 4 ft clearance for passing</td></tr>' +
  '<tr><td>Charging Area</td><td>10 m² per cobot</td><td>Near pick zone entry; opportunity charging during idle; 80% charge in 30 min</td></tr>' +
  '<tr><td>Staging/Induction</td><td>15 m² per cobot</td><td>Order handoff area where cobots queue completed totes for transport</td></tr>' +
  '<tr><td>Maintenance Bay</td><td>20–30 m² total</td><td>Spare parts, diagnostics workstation, wheel/sensor replacement</td></tr></table>' +

  // ── ROI ──
  '<h3>ROI Worked Example</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:13px;color:#e2e8f0;line-height:1.7;">' +
  '<strong>Scenario:</strong> 15,000 lines/day, 20 manual pickers at $17/hr<br>' +
  '<strong>Current Cost:</strong> 20 pickers × $17/hr × 2,080 hrs = <strong>$707K/yr</strong><br>' +
  '<strong>With 10 Locus Cobots (RaaS):</strong> 8 pickers × $17/hr × 2,080 hrs + 10 bots × $2K/mo × 12 = $283K + $240K = <strong>$523K/yr</strong><br>' +
  '<strong>Annual Savings:</strong> $707K − $523K = <strong>$184K/yr</strong> (26% reduction)<br>' +
  '<strong>Bonus:</strong> Zero CapEx with RaaS; scale up/down monthly; ROI from month 1.</div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=oRMclnyD3gc" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Locus Robotics Fulfillment</a>' +
    '<a href="https://www.youtube.com/watch?v=ZkiieY1nz58" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> 6 River Systems Chuck Demo</a>' +
    '<a href="https://www.youtube.com/watch?v=X8V5xvpF2nE" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Locus: Makro Spain Case Study</a>' +
  '</div>' +

  '<p style="margin-top:16px;"><strong>Deep Dive:</strong> Select <em>Collaborative Robots</em> in the sidebar for detailed cobot specs, workflow diagrams, and additional video resources.</p>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: LIGHT/VOICE/VISION DIRECTED FULFILLMENT
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-lvv'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Order Fulfillment / Light-Voice-Vision</div>' +
  '<h2>Light/Voice/Vision Directed Fulfillment</h2>' +
  '<p>Directed fulfillment technologies guide operators through tasks hands-free, reducing errors and improving speed without the capital investment of full robotics. These are often the highest-ROI automation investments for 3PL operations — fast to deploy, easy to scale, and compatible with any facility layout.</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Voice Directed</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Headset + microphone — WMS speaks pick instructions, operator confirms verbally. Hands-free, eyes-free. 15–25% productivity gain over RF scanning.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">Pick-to-Light / Put-to-Light</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">LED modules on rack faces light up to indicate pick/put locations and quantities. Ideal for high-speed batch sorting and zone-based put-walls.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">Vision Systems</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">AR glasses or head-mounted displays project pick instructions into the operator\'s field of view. Emerging technology — best for complex kitting and VAS tasks.</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>Technology</th><th>Productivity Gain</th><th>Error Reduction</th><th>Cost/Station</th><th>Deploy Time</th></tr>' +
  '<tr><td>Voice Directed</td><td>15–25%</td><td>50–70% fewer errors</td><td>$2K–$4K</td><td>2–4 weeks</td></tr>' +
  '<tr><td>Pick-to-Light</td><td>30–50%</td><td>99.9%+ accuracy</td><td>$150–$300/position</td><td>4–8 weeks</td></tr>' +
  '<tr><td>Put-to-Light (put-wall)</td><td>2–3× vs. manual sort</td><td>99.9%+ accuracy</td><td>$100–$200/position</td><td>3–6 weeks</td></tr>' +
  '<tr><td>Vision/AR Glasses</td><td>10–20%</td><td>40–60% fewer errors</td><td>$3K–$8K/unit</td><td>6–12 weeks</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">IES Recommendation</div>' +
  '<p style="font-size:13px;">Voice is the default for any pick operation not already using it — fast ROI, minimal infrastructure. Put-to-light wins for batch sort and e-commerce put-walls. Pick-to-light is ideal for high-velocity forward pick zones. Vision/AR is emerging — pilot only for now, best for complex kitting with many SKUs.</p></div>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: PALLET AS/RS & SHUTTLES
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-pallet-asrs'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Storage & Retrieval / Pallet AS/RS & Shuttles</div>' +
  '<h2>Pallet AS/RS & Shuttles</h2>' +
  '<p>Automated Storage & Retrieval Systems for pallets and cases are the backbone of high-density, high-throughput distribution. This SCC covers crane-based pallet AS/RS, pallet shuttles (single-deep, double-deep, and heavy-load), case shuttles, and traditional stacker cranes. These are major capital investments — typically $10M+ — but deliver transformative density and labor savings.</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Case Shuttles</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Multi-level shuttle systems for case/tote storage and sequenced retrieval. Very high throughput for case-pick operations. Vendors: Dematic, TGW, KNAPP.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">Pallet Shuttles</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">SD (single-deep), DD (double-deep), and heavy-load variants. Robots move pallets within deep-lane racking. High density for homogeneous SKUs.</div></div>' +
    '<div style="background:linear-gradient(135deg,#2d1a3e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #8b5cf6;">' +
    '<div style="color:#8b5cf6;font-weight:700;font-size:14px;margin-bottom:8px;">Traditional Pallet AS/RS</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Crane-based systems with 100+ ft reach. Highest density, lowest labor, but longest lead times (12–18 months). Vendors: Daifuku, Mecalux, SSI Schaefer.</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>System</th><th>Throughput</th><th>Density Gain</th><th>Capital Range</th><th>Lead Time</th></tr>' +
  '<tr><td>Case Shuttle</td><td>500–1,500 cases/hr/aisle</td><td>3–5× vs. manual</td><td>$8M–$30M+</td><td>12–18 months</td></tr>' +
  '<tr><td>Pallet Shuttle (SD)</td><td>40–80 pallets/hr/aisle</td><td>2–3× vs. selective</td><td>$500K–$2M/aisle</td><td>6–12 months</td></tr>' +
  '<tr><td>Pallet Shuttle (DD)</td><td>30–60 pallets/hr/aisle</td><td>3–4× vs. selective</td><td>$600K–$2.5M/aisle</td><td>6–12 months</td></tr>' +
  '<tr><td>Crane AS/RS</td><td>20–40 pallets/hr/aisle</td><td>5–8× vs. floor stack</td><td>$10M–$50M+</td><td>12–24 months</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">When to Recommend</div>' +
  '<p style="font-size:13px;">Pallet AS/RS makes sense for: contract terms 7+ years, stable high-volume throughput, land/building constraints requiring vertical density, cold chain (reduces conditioned space), and operations with 10,000+ pallet positions. The capital is significant — always model the labor savings against a 7–10 year horizon.</p></div>' +

  // ── Vendor Landscape ──
  '<h3>Vendor Landscape</h3>' +
  '<table class="wiki-spec-table"><tr><th>Vendor</th><th>Specialty</th><th>Typical System Cost</th><th>Lead Time</th><th>Key Differentiator</th></tr>' +
  '<tr><td>Daifuku</td><td>Crane AS/RS, unit load</td><td>$15M–$50M+</td><td>18–24 months</td><td>Largest MH company globally; deep cold-chain expertise</td></tr>' +
  '<tr><td>Dematic (KION)</td><td>Multishuttle, case AS/RS</td><td>$8M–$30M</td><td>12–18 months</td><td>Strong in case-level G2P; Pouch system for apparel</td></tr>' +
  '<tr><td>SSI Schaefer</td><td>Full range (crane + shuttle)</td><td>$10M–$40M</td><td>14–20 months</td><td>European market leader; modular designs</td></tr>' +
  '<tr><td>TGW Logistics</td><td>Case shuttle, e-commerce</td><td>$8M–$25M</td><td>12–18 months</td><td>FlashPick shuttle platform; strong NA growth</td></tr>' +
  '<tr><td>Mecalux</td><td>Pallet shuttle, racking</td><td>$3M–$15M</td><td>8–14 months</td><td>Lower-cost option; integrated racking + shuttle</td></tr></table>' +

  // ── Implementation Timeline ──
  '<h3>Implementation Timeline</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:12px;color:#e2e8f0;line-height:1.8;">' +
  '<strong>Phase 1 — Design & Engineering (3–4 months):</strong> System simulation (throughput modeling, bottleneck analysis), structural engineering (floor load verification, seismic if applicable), WCS specification, fire code review.<br>' +
  '<strong>Phase 2 — Procurement (4–8 months):</strong> Longest lead item is typically the crane/shuttle itself (16–24 weeks manufacturing). Racking lead time: 8–12 weeks. WCS software: concurrent development.<br>' +
  '<strong>Phase 3 — Site Prep (2–3 months, concurrent):</strong> Floor remediation to FM2 flatness (±1.5mm/3m for crane systems), power infrastructure (500kW–2MW), fire suppression (ESFR or in-rack), temperature control for cold chain.<br>' +
  '<strong>Phase 4 — Installation (3–6 months):</strong> Racking first, then crane/shuttle install, followed by conveyor integration. Commissioning: 4–6 weeks of testing per aisle.<br>' +
  '<strong>Phase 5 — Ramp (2–3 months):</strong> Start at 40% throughput, ramp to 95% over 8–12 weeks. Operator training for exception handling and maintenance.<br>' +
  '<strong>Total: 14–24 months depending on system complexity and whether cold chain is involved.</strong></div>' +

  // ── Facility Requirements ──
  '<h3>Facility Requirements</h3>' +
  '<table class="wiki-spec-table"><tr><th>Requirement</th><th>Crane AS/RS</th><th>Pallet Shuttle</th><th>Case Shuttle</th></tr>' +
  '<tr><td>Ceiling Height</td><td>60–130 ft (18–40m)</td><td>30–60 ft (9–18m)</td><td>40–80 ft (12–24m)</td></tr>' +
  '<tr><td>Floor Flatness</td><td>FM1 (±1.5mm/3m)</td><td>FM2 (±3mm/3m)</td><td>FM2 (±3mm/3m)</td></tr>' +
  '<tr><td>Floor Load</td><td>5,000–8,000 lbs/ft²</td><td>3,000–5,000 lbs/ft²</td><td>2,000–4,000 lbs/ft²</td></tr>' +
  '<tr><td>Power</td><td>500kW–2MW per system</td><td>200–500kW per aisle</td><td>300–800kW per system</td></tr>' +
  '<tr><td>Fire Suppression</td><td>In-rack ESFR mandatory</td><td>In-rack sprinkler</td><td>In-rack sprinkler</td></tr>' +
  '<tr><td>Temperature</td><td>-22°F to 104°F (-30°C to 40°C)</td><td>32–104°F</td><td>32–104°F</td></tr></table>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=GLZHylIMmKw" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Dexion ASRS System</a>' +
    '<a href="https://www.youtube.com/watch?v=oHmlktFOguI" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Kardex Shuttle XP VLM</a>' +
    '<a href="https://www.youtube.com/watch?v=iHC9ec591lI" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> AutoStore Introduction</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: RACK/SHELVING/VLMs
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-rack-vlm'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Storage & Retrieval / Rack, Shelving & VLMs</div>' +
  '<h2>Rack/Shelving/VLMs</h2>' +
  '<p>Storage media is the foundation of every warehouse layout. Selecting the right racking type, shelving configuration, and vertical lift modules (VLMs) directly impacts storage density, pick efficiency, and facility cost. This SCC is relevant to every single IES design — there is no project without storage.</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Racking</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Selective, double-deep, push-back, drive-in/drive-through, pallet flow, cantilever. Each optimizes for different density/access trade-offs.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">Pick Modules</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Multi-level mezzanine structures with integrated shelving, conveyors, and pick zones. Maximizes vertical space for each-pick operations.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">VLMs (Vertical Lift Modules)</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Enclosed vertical carousels that deliver trays to an ergonomic pick window. 70–90% floor space savings for small parts. Vendors: Kardex, Modula, Hänel.</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>Type</th><th>Access</th><th>Density</th><th>Best For</th><th>Cost/Position</th></tr>' +
  '<tr><td>Selective Rack</td><td>100% (every pallet)</td><td>Low</td><td>High SKU variety, fast rotation</td><td>$40–$80</td></tr>' +
  '<tr><td>Double-Deep</td><td>50%</td><td>Medium</td><td>2+ pallets/SKU, moderate rotation</td><td>$50–$90</td></tr>' +
  '<tr><td>Push-Back (3–5 deep)</td><td>LIFO, front face only</td><td>High</td><td>Moderate SKU count, bulk storage</td><td>$80–$150</td></tr>' +
  '<tr><td>Drive-In</td><td>LIFO, first lane only</td><td>Very High</td><td>Few SKUs, high pallet count</td><td>$60–$100</td></tr>' +
  '<tr><td>Pallet Flow</td><td>FIFO</td><td>High</td><td>Date-sensitive, food/beverage</td><td>$150–$300</td></tr>' +
  '<tr><td>Pick Module</td><td>100%</td><td>2–3× floor pick</td><td>E-commerce each-pick</td><td>$20–$50/sq ft</td></tr>' +
  '<tr><td>VLM</td><td>Single-tray delivery</td><td>70–90% floor savings</td><td>Small parts, slow movers</td><td>$80K–$200K/unit</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">IES Designer Rule of Thumb</div>' +
  '<p style="font-size:13px;">Start with selective rack (maximum flexibility), then optimize: if pallets/SKU > 3, consider double-deep or push-back. If SKU count is low and volume is high, drive-in. If FIFO is required (food, pharma), pallet flow. VLMs are a niche solution — use for slow-moving small parts with high SKU counts where floor space is at a premium.</p></div>' +

  // ── Density Benchmarks ──
  '<h3>Storage Density Benchmarks</h3>' +
  '<table class="wiki-spec-table"><tr><th>Rack Type</th><th>Pallets per 1,000 ft²</th><th>SKU Accessibility</th><th>Aisle Width Required</th><th>Best Use Case</th></tr>' +
  '<tr><td>Selective (single-deep)</td><td>60–80</td><td>100% — every pallet accessible</td><td>10–12 ft (wide aisle)</td><td>High SKU variety, A/B/C velocity zones</td></tr>' +
  '<tr><td>Narrow Aisle (VNA)</td><td>90–110</td><td>100%</td><td>6–7 ft (turret truck required)</td><td>Space-constrained, high SKU count</td></tr>' +
  '<tr><td>Double-Deep</td><td>100–130</td><td>50% (front face only)</td><td>10–12 ft</td><td>2+ pallets/SKU, moderate rotation</td></tr>' +
  '<tr><td>Push-Back (3–5 deep)</td><td>130–170</td><td>LIFO, front face only</td><td>10–12 ft</td><td>Seasonal buffer, bulk storage</td></tr>' +
  '<tr><td>Drive-In (6–10 deep)</td><td>170–220</td><td>LIFO, first lane only</td><td>Single entry (12 ft min)</td><td>Homogeneous SKUs, high pallet count</td></tr>' +
  '<tr><td>Pallet Flow (FIFO)</td><td>140–180</td><td>FIFO</td><td>Entry/exit aisles (12 ft each)</td><td>Date-sensitive products, food/beverage</td></tr></table>' +

  // ── Vendor Overview ──
  '<h3>Key Vendors</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:12px;color:#e2e8f0;line-height:1.8;">' +
  '<strong>Pallet Racking:</strong> Ridg-U-Rak (US market leader, 4–6 week lead), Mecalux (global, integrated with shuttle systems), Steel King (heavy-duty, structural), Frazier (structural, seismic-rated).<br>' +
  '<strong>Shelving/Pick Modules:</strong> SSI Schaefer (modular pick modules), Dematic (integrated with conveyors), Unarco (general shelving).<br>' +
  '<strong>VLMs:</strong> Kardex Remstar ($80K–$200K/unit, 8–12 week lead), Modula ($70K–$180K/unit, 6–10 week lead), Hänel ($90K–$220K/unit, premium quality).<br>' +
  '<strong>Lead Times:</strong> Standard rack 4–6 weeks; custom/structural 6–10 weeks; VLMs 8–12 weeks; pick modules 10–14 weeks.</div>' +

  // ── Automation Compatibility ──
  '<h3>Automation Compatibility Matrix</h3>' +
  '<table class="wiki-spec-table"><tr><th>Rack Type</th><th>G2P Compatible?</th><th>P2G Cobots?</th><th>Conveyor Integration</th><th>Notes</th></tr>' +
  '<tr><td>Selective</td><td>ACRs (Hai) — yes; Exotec — yes</td><td>Locus/6RS — yes</td><td>Pick module conveyor — yes</td><td>Most flexible foundation</td></tr>' +
  '<tr><td>VNA</td><td>ACRs — limited height</td><td>No (aisle too narrow for cobots)</td><td>End-of-aisle — yes</td><td>Requires turret or order picker lift</td></tr>' +
  '<tr><td>Double-Deep</td><td>ACRs — yes (multi-deep capable)</td><td>Locus — yes</td><td>End-of-aisle — yes</td><td>Requires reach truck or deep-reach ACR</td></tr>' +
  '<tr><td>VLM</td><td>N/A (self-contained G2P)</td><td>N/A</td><td>Conveyor to/from window — yes</td><td>VLM is its own G2P system for small parts</td></tr></table>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=oHmlktFOguI" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Kardex Remstar VLM</a>' +
    '<a href="https://www.youtube.com/watch?v=nh2q22Gl2XE" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Automated Shuttle XP VLM</a>' +
    '<a href="https://www.youtube.com/watch?v=-SPz9F-BYWU" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Warehouse Design Principles</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: AMR/AGV MOVEMENT & SORTATION
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-amr-agv'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Movement & Sortation / AMR-AGV</div>' +
  '<h2>AMR/AGV Movement & Sortation</h2>' +
  '<p>Autonomous Mobile Robots (AMRs) and Automated Guided Vehicles (AGVs) handle material transport and robotic sortation — replacing forklifts, tuggers, and manual cart runs. This SCC also covers AMR-based sortation platforms where small robots replace fixed conveyor sorters. The AMR market is the fastest-growing segment of warehouse automation.</p>' +

  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">AMR (Autonomous Mobile Robot)</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Uses LIDAR/vision to navigate dynamically. No fixed infrastructure. Can reroute around obstacles. Vendors: Locus, Vecna, MiR, OTTO, Boston Dynamics (Stretch).</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">AGV (Automated Guided Vehicle)</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Follows fixed paths (magnetic tape, embedded wire, painted lines). Predictable, reliable, lower cost per unit. Best for repetitive point-to-point routes.</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>Application</th><th>AMR or AGV?</th><th>Payload</th><th>Typical Fleet Size</th><th>ROI Horizon</th></tr>' +
  '<tr><td>Pallet transport (dock → storage)</td><td>AGV or Heavy AMR</td><td>2,000–4,000 lbs</td><td>5–20 units</td><td>2–3 years</td></tr>' +
  '<tr><td>Tote/bin transport (zone to zone)</td><td>AMR</td><td>50–200 lbs</td><td>10–50 units</td><td>1–2 years</td></tr>' +
  '<tr><td>AMR Sortation platform</td><td>AMR swarm</td><td>5–30 lbs/item</td><td>50–500+ robots</td><td>2–4 years</td></tr>' +
  '<tr><td>Tugger/cart train</td><td>AGV</td><td>5,000+ lbs (train)</td><td>3–10 units</td><td>2–3 years</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">AMR vs. AGV Decision</div>' +
  '<p style="font-size:13px;">AMR for dynamic environments with changing layouts, mixed traffic, and multi-client flexibility. AGV for fixed, high-volume routes where predictability and cost-per-unit matter most. AMR sortation (e.g., Tompkins, Geek+) competes with fixed conveyor sorters when demand is variable or space is limited.</p></div>' +

  // ── Vendor Landscape ──
  '<h3>Vendor Landscape</h3>' +
  '<table class="wiki-spec-table"><tr><th>Vendor</th><th>Type</th><th>Payload</th><th>Price Range</th><th>Differentiator</th></tr>' +
  '<tr><td>OTTO Motors (Rockwell)</td><td>Heavy AMR</td><td>Up to 3,300 lbs</td><td>$80K–$120K/unit</td><td>Market leader in heavy-payload AMR; OTTO 1500/OTTO Lifter; BY WMS integration available</td></tr>' +
  '<tr><td>MiR (Teradyne)</td><td>Medium AMR</td><td>200–2,200 lbs</td><td>$30K–$80K/unit</td><td>Strong European presence; modular top-modules; fleet management software included</td></tr>' +
  '<tr><td>Vecna Robotics</td><td>Heavy AMR</td><td>Up to 4,500 lbs</td><td>$100K–$150K/unit</td><td>Pallet jack/forklift form factor; Pivotal orchestration software</td></tr>' +
  '<tr><td>Geek+ (Sortation)</td><td>AMR swarm</td><td>5–30 lbs/item</td><td>$100–$150/item/hr capacity</td><td>Sortation platform: 50–500 robots replace fixed sorters; strong in Asia/EU</td></tr>' +
  '<tr><td>Tompkins Robotics</td><td>AMR sortation</td><td>15 lbs/item</td><td>$150–$200/item/hr capacity</td><td>tSort platform; 20–200 robots; modular, relocatable</td></tr>' +
  '<tr><td>Wire-Guided AGV (various)</td><td>Traditional AGV</td><td>2,000–10,000 lbs</td><td>$40K–$80K/unit</td><td>Lowest cost, most reliable, but requires fixed infrastructure (wire/tape)</td></tr></table>' +

  // ── AMR Sortation Deep Dive ──
  '<h3>AMR Sortation vs. Fixed Conveyor Sorters</h3>' +
  '<table class="wiki-spec-table"><tr><th>Factor</th><th>AMR Sortation (Geek+, Tompkins)</th><th>Fixed Sorter (Dematic, Beumer)</th></tr>' +
  '<tr><td>Throughput</td><td>3,000–15,000 items/hr (scales with fleet size)</td><td>4,000–20,000+ items/hr (fixed capacity)</td></tr>' +
  '<tr><td>Destinations</td><td>100–1,000+ (each robot can reach any chute)</td><td>50–200 (physical chute limit)</td></tr>' +
  '<tr><td>Capital Cost</td><td>$1.5M–$8M (50–300 robots)</td><td>$3M–$15M+ (conveyor + sorter infrastructure)</td></tr>' +
  '<tr><td>Flexibility</td><td>Relocatable; add robots for peak; remove for low season</td><td>Fixed infrastructure; cannot scale down</td></tr>' +
  '<tr><td>Space</td><td>20–40% less floor space (no conveyor runs)</td><td>Large footprint for induction + conveyor loop</td></tr>' +
  '<tr><td>Best For</td><td>&lt;5M items/yr, 100+ destinations, seasonal demand</td><td>&gt;5M items/yr, stable demand, &lt;50 destinations</td></tr></table>' +

  // ── Safety & Integration ──
  '<h3>Safety & Integration</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:12px;color:#e2e8f0;line-height:1.8;">' +
  '<strong>Pedestrian Safety:</strong> All AMRs must comply with ANSI/RIA R15.08 (mobile robot safety). LIDAR-based AMRs maintain 360° awareness and auto-stop within 0.5–1.0m of obstacles. Facilities must establish traffic management zones, speed limits (typically 1.5 m/s max in mixed areas), and dedicated AMR lanes for high-density deployments.<br>' +
  '<strong>Fleet Management:</strong> 10+ AMRs require fleet management software (vendor-provided or third-party). Software handles traffic coordination, charging schedules, task prioritization, and deadlock resolution.<br>' +
  '<strong>WMS Integration:</strong> AMRs receive tasks via WMS/WCS API integration. BY WMS supports OTTO, MiR, and Vecna through certified connectors. Task types: transport (A→B), induction (dock→storage), replenishment (reserve→forward).<br>' +
  '<strong>Charging:</strong> Opportunity charging (2–5 min top-ups during idle) preferred over shift-based charging. Plan 1 charging station per 3–4 AMRs. Charging bays: 2m × 3m each, near pick zones.</div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=qahujJ-8vdk" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> AMR vs AGV Solutions</a>' +
    '<a href="https://www.youtube.com/watch?v=aAOSgrWr4pg" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> OTTO Lifter Autonomous Forklift</a>' +
    '<a href="https://www.youtube.com/watch?v=8iKaq6jP8to" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Dematic Sortation Simulation</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: ROBOTIC PICKING & PALLETIZING
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-pick-pal'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Robotic Systems / Picking & Palletizing</div>' +
  '<h2>Robotic Picking & Palletizing</h2>' +
  '<p>Robotic arms and gantry systems that automate the physical act of picking items and building pallets. This SCC covers gantry/overhead picking systems, mixed-case palletizing robots, and 6-axis industrial arms for depalletizing, induction, and high-speed case handling. These systems address the hardest-to-fill labor roles — repetitive, physically demanding, and high-turnover.</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Gantry Systems</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Overhead bridge cranes with robotic end-effectors. Cover large areas for layer-picking and pallet building. Vendors: Bastian (Symbotic integration), Honeywell.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">Mixed-Case Palletizing</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">AI-driven robots that build stable, store-friendly mixed-SKU pallets. Reduces store labor, improves truck cube utilization. Vendors: Mujin, Dematic, Symbotic.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">6-Axis Robots</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Industrial robotic arms for depalletizing, induction, singulation, and high-speed case handling. GXO has 6 active Symbotic deployments using these systems.</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>Application</th><th>Throughput</th><th>Typical ROI</th><th>Capital Range</th><th>Key Challenge</th></tr>' +
  '<tr><td>Mixed-Case Palletizing</td><td>500–1,200 cases/hr</td><td>2–4 years</td><td>$1.5M–$5M/cell</td><td>SKU variety, pallet stability algorithms</td></tr>' +
  '<tr><td>Depalletizing</td><td>800–1,500 cases/hr</td><td>1.5–3 years</td><td>$500K–$2M/cell</td><td>Damaged packaging, case orientation</td></tr>' +
  '<tr><td>Piece Picking (arm)</td><td>400–1,000 picks/hr</td><td>3–5 years</td><td>$300K–$1M/cell</td><td>Grip reliability, SKU variety</td></tr>' +
  '<tr><td>Gantry Pallet Build</td><td>200–600 cases/hr</td><td>3–5 years</td><td>$2M–$8M</td><td>Large footprint, integration complexity</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">When to Recommend</div>' +
  '<p style="font-size:13px;">Robotic palletizing wins when: store-friendly pallet requirements exist, labor turnover in palletizing exceeds 100%/year, or the client ships 50+ mixed-SKU pallets/day. Piece-picking robots are still maturing — recommend for constrained SKU profiles (< 1,000 SKUs) with predictable item geometry.</p></div>' +

  // ── Vendor Landscape ──
  '<h3>Vendor Landscape</h3>' +
  '<table class="wiki-spec-table"><tr><th>Vendor</th><th>Specialty</th><th>Throughput</th><th>Cost Range</th><th>Notes</th></tr>' +
  '<tr><td>Symbotic (GXO partner)</td><td>End-to-end AS/RS + palletizing</td><td>1,000+ cases/hr</td><td>System: $50M+</td><td>GXO has 6 active deployments; deep integration</td></tr>' +
  '<tr><td>Mujin</td><td>AI-driven mixed-case palletizing</td><td>500–1,200 cases/hr</td><td>$1.5M–$5M/cell</td><td>Best-in-class pallet stability algorithms; 3D vision</td></tr>' +
  '<tr><td>FANUC</td><td>6-axis industrial arms</td><td>800–1,500 cases/hr</td><td>$300K–$1.5M/cell</td><td>Industry standard for depalletizing; proven reliability</td></tr>' +
  '<tr><td>ABB</td><td>6-axis + FlexPicker</td><td>400–1,000 picks/hr</td><td>$500K–$2M/cell</td><td>Strong in piece-picking with integrated vision</td></tr>' +
  '<tr><td>Bastian Solutions</td><td>Gantry systems, integration</td><td>200–600 cases/hr</td><td>$2M–$8M</td><td>System integrator; combines gantry + conveyor + palletizer</td></tr></table>' +

  // ── Vision Systems ──
  '<h3>Vision Systems & End Effectors</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:12px;color:#e2e8f0;line-height:1.8;">' +
  '<strong>2D Vision (barcode/pattern):</strong> $10K–$30K per camera system. Adequate for homogeneous case picking where case dimensions are known. 99.5%+ reliability on standard brown boxes.<br>' +
  '<strong>3D Vision (depth sensing):</strong> $50K–$200K per system. Required for mixed-SKU, varied-geometry picking. Uses structured light or time-of-flight cameras. Mujin and ABB lead in 3D vision integration.<br>' +
  '<strong>Vacuum Grippers:</strong> Standard for cases/cartons. $5K–$15K per end-effector. Best for flat, regular surfaces. 95%+ pick success rate.<br>' +
  '<strong>Mechanical Grippers:</strong> For irregular shapes (bottles, bags, tubes). $15K–$40K. Lower pick rate but handles more SKU variety.<br>' +
  '<strong>Hybrid Grippers:</strong> Combine vacuum + mechanical + soft robotics. $30K–$80K. Emerging technology; best pick success for mixed SKU profiles.</div>' +

  // ── Cost per Pick ──
  '<h3>Cost-per-Pick Comparison</h3>' +
  '<table class="wiki-spec-table"><tr><th>Method</th><th>Cost per Pick</th><th>Speed</th><th>Accuracy</th><th>When It Wins</th></tr>' +
  '<tr><td>Manual Labor</td><td>$0.15–$0.25</td><td>60–120 picks/hr</td><td>99.0–99.5%</td><td>Low volume, high SKU variety, short contract</td></tr>' +
  '<tr><td>Robot (6-axis)</td><td>$0.08–$0.15</td><td>400–1,000 picks/hr</td><td>99.5–99.9%</td><td>High volume, constrained SKU, 24/7 operation</td></tr>' +
  '<tr><td>Robot (gantry)</td><td>$0.10–$0.20</td><td>200–600 picks/hr</td><td>99.5%+</td><td>Layer/pallet-level picks, large footprint available</td></tr></table>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=ecftHVqxRpg" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Advanced Warehouse Robots</a>' +
    '<a href="https://www.youtube.com/watch?v=U2AGLeJBFNg" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Advanced Robotic Warehouse</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: TRAILER LOADING & UNLOADING
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-trailer'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Robotic Systems / Trailer Loading & Unloading</div>' +
  '<h2>Trailer Loading & Unloading</h2>' +
  '<p>Dock operations are among the most physically demanding and injury-prone tasks in warehousing. This SCC covers automated trailer loading/unloading systems (ATLS), fixed conveyor-based dock systems, and autonomous dock/yard movers. Automating the dock addresses both labor scarcity and worker safety — two pain points that resonate strongly in client conversations.</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Fixed Conveyor Systems</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Telescopic conveyors extend into the trailer for continuous loading/unloading. Reduces manual handling, increases throughput 30–50%. Vendors: Stewart-Glapat, Caljan.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">ATLS</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Automated Trailer Loading Systems — robotic platforms that build complete pallet loads inside the trailer. Reduces dock labor by 60–80%. Vendors: Ancra, BEUMER.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">Dock/Yard Movers</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Autonomous or semi-autonomous yard tractors that spot trailers at dock doors. Replaces dedicated yard jockey labor. Vendors: Outrider, Phantom Auto, TICO.</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>Solution</th><th>Labor Savings</th><th>Throughput Impact</th><th>Capital Range</th><th>Best For</th></tr>' +
  '<tr><td>Telescopic Conveyor</td><td>1–2 FTEs/door/shift</td><td>+30–50% unload speed</td><td>$30K–$80K/unit</td><td>High-volume floor-load receiving</td></tr>' +
  '<tr><td>ATLS</td><td>2–4 FTEs/door/shift</td><td>+50–80% load speed</td><td>$500K–$2M/door</td><td>Repetitive full-TL shipping</td></tr>' +
  '<tr><td>Autonomous Yard Tractor</td><td>1–3 yard jockeys</td><td>24/7 availability</td><td>$300K–$600K/unit</td><td>Large yards, 50+ door facilities</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">When to Recommend</div>' +
  '<p style="font-size:13px;">Telescopic conveyors are low-risk, high-ROI — recommend for any floor-load unloading operation with 10+ trailers/day. ATLS is best for outbound with repetitive pallet-load patterns. Autonomous yard tractors make sense at facilities with 50+ doors and 3+ dedicated yard jockey shifts.</p></div>' +

  // ── Dock Throughput ──
  '<h3>Dock Throughput Calculations</h3>' +
  '<div class="wiki-callout"><div class="wiki-callout-title">Dock Capacity Formula</div>' +
  '<p style="font-size:12px;font-family:monospace;background:#0f172a;padding:12px;border-radius:6px;color:#e2e8f0;">Daily Trailer Capacity = Dock Doors × (Operating Hours ÷ Avg Load/Unload Time) × Door Utilization %</p>' +
  '<p style="font-size:12px;margin-top:8px;"><strong>Example (manual):</strong> 20 doors × (16 hrs ÷ 2.5 hr/trailer) × 75% utilization = <strong>96 trailers/day</strong><br>' +
  '<strong>Example (with telescopic conveyor):</strong> 20 doors × (16 hrs ÷ 1.5 hr/trailer) × 80% utilization = <strong>171 trailers/day</strong> (78% improvement)<br>' +
  '<strong>Example (with ATLS):</strong> 10 ATLS doors × (16 hrs ÷ 0.75 hr/trailer) × 85% = <strong>181 trailers/day from 10 doors</strong></p></div>' +

  // ── Safety & OSHA ──
  '<h3>Safety & OSHA Considerations</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:12px;color:#e2e8f0;line-height:1.8;">' +
  '<strong>Trailer Restraints:</strong> Every automated dock door requires vehicle restraint systems (hook/wheel chock). OSHA 1910.178 compliance mandatory. Interlock with ATLS/conveyor — system cannot start until trailer is secured.<br>' +
  '<strong>Dock Levelers:</strong> Hydraulic levelers recommended for ATLS; air-bag levelers adequate for conveyor-only. Ensure 6-inch height range coverage (48–54 inch trailer beds).<br>' +
  '<strong>Lighting:</strong> 50 foot-candles minimum at dock face; LED flood lights inside trailer for floor-load operations. ATLS systems have integrated lighting.<br>' +
  '<strong>Ergonomics:</strong> Telescopic conveyors reduce manual lifting by 80%+. Key selling point for clients with OSHA recordable injury concerns at the dock.</div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=RfPYa9_XP8c" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Automated Truck Loading (ATLS)</a>' +
    '<a href="https://www.youtube.com/watch?v=JfZddt6CRH8" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> ATLS Case Study</a>' +
    '<a href="https://www.youtube.com/watch?v=XDh88V3eRlw" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Europa ATLS Systems</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: SCAN, PANDA, WEARABLES
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-scan-panda'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Technology & Controls / Scan, PANDA, Wearables</div>' +
  '<h2>Scan, PANDA, Wearables</h2>' +
  '<p>Data capture technology is the nervous system of warehouse operations — every item must be identified, measured, weighed, and tracked. This SCC covers barcode/RFID scanning, in-line dimensioning and weighing (PANDA — Parcel AND Article measurement), and wearable devices that keep operators connected to the WMS without holding a device.</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">In-Line Cubing/Weighing</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Automated dimensioning + weighing stations on conveyors. Capture L×W×H and weight at line speed. Critical for parcel billing accuracy and carrier compliance.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">PANDA Solutions</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Parcel measurement and identification platforms that combine scanning, dimensioning, and imaging in a single tunnel. Enables data-driven slotting and billing optimization.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">Handhelds & Wearables</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">RF guns, ring scanners, wrist-mounted displays, smart gloves. Hands-free scanning increases pick speed 10–15%. Vendors: Zebra, Honeywell, ProGlove.</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>Technology</th><th>Use Case</th><th>Throughput Impact</th><th>Cost</th></tr>' +
  '<tr><td>RF Handheld Scanner</td><td>General pick/pack/ship</td><td>Baseline</td><td>$1K–$3K/unit</td></tr>' +
  '<tr><td>Ring Scanner</td><td>Each-pick, hands-free</td><td>+10–15% vs. RF gun</td><td>$500–$1.5K/unit</td></tr>' +
  '<tr><td>Smart Glove (ProGlove)</td><td>Scan + gesture recognition</td><td>+15–20% vs. RF gun</td><td>$300–$700/unit</td></tr>' +
  '<tr><td>In-Line Dimensioner</td><td>Parcel billing, compliance</td><td>1,500–3,000 parcels/hr</td><td>$50K–$200K/station</td></tr>' +
  '<tr><td>RFID Tunnel</td><td>Bulk inventory reads</td><td>100% inventory in seconds</td><td>$20K–$80K/portal</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">IES Recommendation</div>' +
  '<p style="font-size:13px;">Ring scanners should be standard for any each-pick operation — ROI is weeks, not months. In-line dimensioning is required for any parcel operation billing by DIM weight. RFID is emerging for inventory accuracy in apparel and high-value goods but not yet cost-effective for general warehouse use.</p></div>' +

  // ── Vendor Landscape ──
  '<h3>Vendor Landscape</h3>' +
  '<table class="wiki-spec-table"><tr><th>Category</th><th>Vendor</th><th>Key Product</th><th>Cost Range</th><th>Notes</th></tr>' +
  '<tr><td>Handheld Scanners</td><td>Zebra Technologies</td><td>TC52/TC72, MC series</td><td>$1K–$3K/unit</td><td>Market leader; Android-based; BY WMS certified</td></tr>' +
  '<tr><td>Handheld Scanners</td><td>Honeywell</td><td>CT60, CK65</td><td>$1.2K–$3.5K/unit</td><td>Strong in cold chain; rugged options for freezer</td></tr>' +
  '<tr><td>Ring Scanners</td><td>Zebra</td><td>RS5100</td><td>$500–$1K/unit</td><td>Bluetooth; pairs with wrist-mount display; best-in-class</td></tr>' +
  '<tr><td>Smart Gloves</td><td>ProGlove</td><td>MARK Display/Basic</td><td>$300–$700/unit</td><td>Scan on finger point; display on back of hand; fastest scan-to-next cycle</td></tr>' +
  '<tr><td>Dimensioners</td><td>SICK</td><td>DWS (Dimension/Weight/Scan)</td><td>$50K–$200K/station</td><td>In-line dimensioning leader; ±5mm accuracy; certified legal-for-trade</td></tr>' +
  '<tr><td>Dimensioners</td><td>Mettler-Toledo</td><td>DWS systems</td><td>$60K–$250K/station</td><td>Integrated weight + dimension + label reading; carrier-certified</td></tr>' +
  '<tr><td>RFID</td><td>Zebra</td><td>FX series readers, AT870 handhelds</td><td>$20K–$80K/portal</td><td>Best for apparel cycle counting; 99.5%+ read rate on tagged items</td></tr></table>' +

  // ── Integration ──
  '<h3>BY WMS Integration Notes</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:12px;color:#e2e8f0;line-height:1.8;">' +
  '<strong>RF Scanning:</strong> BY supports all major Zebra/Honeywell devices via telnet or browser-based RF screens. Key config: scan validation rules, check digits, substitution logic.<br>' +
  '<strong>PANDA/Dimensioning:</strong> DWS output (L×W×H, weight, barcode) feeds directly to BY via API or flat file. Used for: cartonization decisions, carrier selection, billing DIM weight, slotting optimization.<br>' +
  '<strong>RFID:</strong> BY supports RFID reads at dock-door portals for receiving (bulk pallet/case reads) and cycle counting. RFID tag encoding/printing integrated with pack station. Enable in BY: RFID device config → zone mapping → inventory adjustment rules.<br>' +
  '<strong>Wearables:</strong> Ring scanners and smart gloves connect via Bluetooth to mobile computers running BY RF. No special WMS config needed — they function as standard scan input devices.</div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=cblm3kxAmsE" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Zebra RFID Warehouse Walkthrough</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: PACKOUT TECHNOLOGY
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-packout'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Technology & Controls / Packout Technology</div>' +
  '<h2>Packout Technology</h2>' +
  '<p>Packing is where order accuracy, presentation, and shipping cost converge. This SCC covers auto-baggers, case erectors, right-size boxing systems, auto-tapers, and pack station design. Packout automation reduces labor, minimizes void fill waste, and improves truck cube utilization — directly impacting the client\'s transportation spend.</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Auto-Baggers</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Automated poly-bagging machines for apparel, soft goods, and small items. 500–1,500 bags/hr. Vendors: Sealed Air, PAC Machinery, Pregis.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">Case Erectors</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Machines that form, fold, and tape cartons automatically. Essential for high-volume shipping lines. 10–30 cases/min. Vendors: Wexxar, Lantech, Combi.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">Right-Size Boxing</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Systems that create custom-fit boxes per order, eliminating void fill. Reduces DIM weight 30–50%. Vendors: Packsize, CMC, Sparck (Sealed Air).</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>Technology</th><th>Throughput</th><th>Labor Savings</th><th>Cost</th><th>Key Benefit</th></tr>' +
  '<tr><td>Auto-Bagger</td><td>500–1,500/hr</td><td>1–2 FTEs/shift</td><td>$80K–$300K</td><td>Speed + consistency for soft goods</td></tr>' +
  '<tr><td>Case Erector</td><td>10–30 cases/min</td><td>1 FTE/shift</td><td>$30K–$150K</td><td>Eliminates manual box forming</td></tr>' +
  '<tr><td>Right-Size Boxing</td><td>400–1,000 boxes/hr</td><td>1–2 FTEs + void fill</td><td>$300K–$1M</td><td>30–50% DIM weight reduction</td></tr>' +
  '<tr><td>Auto-Taper/Sealer</td><td>15–40 cases/min</td><td>0.5 FTE/shift</td><td>$15K–$60K</td><td>Consistent seal, no tape waste</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">IES Recommendation</div>' +
  '<p style="font-size:13px;">Right-size boxing is the highest-ROI packout investment — the DIM weight savings alone often pay for the machine in 12–18 months. Case erectors are table stakes for any operation shipping 5,000+ cartons/day. Auto-baggers are essential for apparel and poly-bag e-commerce fulfillment.</p></div>' +

  // ── Vendor Landscape ──
  '<h3>Vendor Landscape</h3>' +
  '<table class="wiki-spec-table"><tr><th>Category</th><th>Vendor</th><th>Product</th><th>Throughput</th><th>Cost</th></tr>' +
  '<tr><td>Right-Size Boxing</td><td>Packsize</td><td>X7</td><td>700–1,000 boxes/hr</td><td>$500K–$1M (lease ~$15K/mo)</td></tr>' +
  '<tr><td>Right-Size Boxing</td><td>CMC / Sparck (Sealed Air)</td><td>CVP Everest</td><td>500–1,100 boxes/hr</td><td>$600K–$1.2M</td></tr>' +
  '<tr><td>Auto-Bagger</td><td>Pregis</td><td>Sharp Bagger</td><td>500–1,000/hr</td><td>$80K–$200K</td></tr>' +
  '<tr><td>Auto-Bagger</td><td>PAC Machinery</td><td>Rollbag series</td><td>600–1,500/hr</td><td>$50K–$150K</td></tr>' +
  '<tr><td>Case Erector</td><td>Wexxar / BEL (ProMach)</td><td>DELTA series</td><td>10–25 cases/min</td><td>$30K–$100K</td></tr>' +
  '<tr><td>Case Erector</td><td>Lantech</td><td>C-series</td><td>15–30 cases/min</td><td>$40K–$150K</td></tr>' +
  '<tr><td>Auto-Taper</td><td>3M-Matic</td><td>8000a series</td><td>15–40 cases/min</td><td>$15K–$60K</td></tr></table>' +

  // ── ROI Example ──
  '<h3>ROI Worked Example: Right-Size Boxing</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:13px;color:#e2e8f0;line-height:1.7;">' +
  '<strong>Scenario:</strong> E-commerce DC shipping 8,000 parcels/day; currently using 5 box sizes + void fill<br>' +
  '<strong>Current Costs:</strong> 4 pack stations × 3 FTEs × $17/hr × 2,080 hrs = $425K labor + $180K void fill/boxes = <strong>$605K/yr</strong><br>' +
  '<strong>With Right-Size Boxing (Packsize X7):</strong> 2 machines × 1 operator each × $17/hr × 2,080 = $71K labor + $80K cardboard + $180K lease = <strong>$331K/yr</strong><br>' +
  '<strong>DIM Weight Savings:</strong> Average 35% box size reduction → carrier DIM weight savings of $0.15/parcel × 2M parcels = <strong>$300K/yr additional savings</strong><br>' +
  '<strong>Total Annual Savings:</strong> ($605K - $331K) + $300K DIM = <strong>$574K/yr</strong><br>' +
  '<strong>Payback on $1M lease: ~21 months (outstanding ROI)</strong></div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=gJEdTzd6Uak" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Compact Case Erector Demo</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// SCC: YARD & INVENTORY CONTROL
// ═══════════════════════════════════════════════════
WIKI_PAGES['scc-yard'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Technology & Controls / Yard & Inventory Control</div>' +
  '<h2>Yard & Inventory Control</h2>' +
  '<p>Visibility beyond the four walls. This SCC covers yard management systems, autonomous yard tractors, drone-based inventory counting, machine vision for quality and counting, and emerging AI/ML applications for inventory optimization. These technologies close the gap between what the WMS thinks and what actually exists.</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Electric Yard Tractors</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">EV yard trucks reduce emissions and fuel cost. Increasingly autonomous-ready. Lower TCO than diesel over 5+ year life. Vendors: Orange EV, BYD, Kalmar.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">Drones</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Autonomous indoor drones for cycle counting in high-bay racking. Count 100× faster than manual. Vendors: Gather AI, Ware (Stow Group), Verity.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">Machine Vision & AI</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Cameras + ML models for damage detection, count verification, label reading, and quality inspection. GXO deploys these for quality inspection across network.</div></div>' +
  '</div>' +

  '<table class="wiki-spec-table"><tr><th>Technology</th><th>Use Case</th><th>ROI Impact</th><th>Capital Range</th><th>Maturity</th></tr>' +
  '<tr><td>Yard Management System (YMS)</td><td>Trailer tracking, dock scheduling</td><td>10–20% dock utilization gain</td><td>$50K–$200K license</td><td>Mature</td></tr>' +
  '<tr><td>Electric Yard Tractor</td><td>Trailer spotting</td><td>40–60% fuel savings</td><td>$200K–$350K/unit</td><td>Mature</td></tr>' +
  '<tr><td>Inventory Drones</td><td>Cycle counting</td><td>80–90% labor reduction</td><td>$100K–$500K</td><td>Growing</td></tr>' +
  '<tr><td>Machine Vision QC</td><td>Damage/count/label check</td><td>50–70% inspection labor</td><td>$50K–$300K/station</td><td>Growing</td></tr>' +
  '<tr><td>Curing Technology/AI</td><td>Predictive slotting, demand</td><td>5–15% efficiency gain</td><td>$100K–$500K</td><td>Emerging</td></tr></table>' +

  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">IES Recommendation</div>' +
  '<p style="font-size:13px;">YMS is a baseline requirement for any facility with 30+ dock doors — without it, yard operations are invisible. Inventory drones are ready for production use in high-bay environments and should be included in any new-build proposal. Machine vision QC is ideal for clients with strict SLA penalties on accuracy.</p></div>' +

  // ── Vendor Landscape ──
  '<h3>Vendor Landscape</h3>' +
  '<table class="wiki-spec-table"><tr><th>Category</th><th>Vendor</th><th>Key Product</th><th>Cost Range</th><th>Notes</th></tr>' +
  '<tr><td>YMS</td><td>Manhattan Associates</td><td>Yard Management</td><td>$80K–$250K license</td><td>Best integration with Manhattan WMS; strong in large-yard operations</td></tr>' +
  '<tr><td>YMS</td><td>FourKites / Descartes</td><td>Yard Visibility</td><td>$50K–$150K license</td><td>Real-time trailer tracking; carrier integration; lighter-weight option</td></tr>' +
  '<tr><td>Autonomous Yard</td><td>Outrider</td><td>Autonomous yard trucks</td><td>$300K–$600K/unit</td><td>Leader in autonomous yard automation; automates trailer moves, hookup/disconnect, charging</td></tr>' +
  '<tr><td>Autonomous Yard</td><td>ISEE AI</td><td>Autonomous trucking platform</td><td>$250K–$500K/unit</td><td>AI-powered; yard and on-road autonomous; growing US presence</td></tr>' +
  '<tr><td>Electric Yard Truck</td><td>Orange EV</td><td>e-TRIEVER, T-Series</td><td>$200K–$350K/unit</td><td>Pure-electric yard truck; zero emissions; 80% lower energy cost vs diesel</td></tr>' +
  '<tr><td>Inventory Drones</td><td>Gather AI</td><td>Inventory intelligence</td><td>$100K–$300K</td><td>AI-powered drone counting; reads labels in high-bay racking; 100× faster than manual</td></tr>' +
  '<tr><td>Inventory Drones</td><td>Verity</td><td>Autonomous drone inventory</td><td>$150K–$500K</td><td>Swiss-made; certified for indoor autonomous flight; integrates with SAP/BY</td></tr></table>' +

  // ── YMS ROI ──
  '<h3>YMS ROI Model</h3>' +
  '<div style="background:#0f172a;border-radius:8px;padding:16px;margin:12px 0;font-size:13px;color:#e2e8f0;line-height:1.7;">' +
  '<strong>Scenario:</strong> 60-door distribution center, 150 trailers/day, 4 yard jockeys<br>' +
  '<strong>Without YMS:</strong> Average trailer dwell time 4.2 hours; 12% of dock time lost to trailer search/positioning; 3 stranded trailer incidents/week (pallets found 24+ hrs late).<br>' +
  '<strong>With YMS:</strong> Trailer dwell reduced to 2.8 hours (33% reduction); dock search time eliminated; stranded trailers reduced to &lt;1/month.<br>' +
  '<strong>Annual Savings:</strong> 1 FTE yard coordinator ($55K) + dock utilization gain worth 2 additional doors ($200K equivalent) + detention fee reduction ($30K/yr) = <strong>$285K/yr</strong><br>' +
  '<strong>YMS Cost:</strong> $150K license + $30K/yr maintenance = <strong>Payback in 7 months</strong></div>' +

  // ── BY WMS Integration ──
  '<h3>BY WMS Integration Notes</h3>' +
  '<div class="wiki-callout"><div class="wiki-callout-title">Yard-to-WMS Data Flow</div>' +
  '<p style="font-size:12px;line-height:1.7;"><strong>Inbound:</strong> Carrier check-in → YMS assigns yard slot → trailer spotted at dock door → BY receives ASN confirmation → receiving tasks generated.<br>' +
  '<strong>Outbound:</strong> BY generates load plan → YMS reserves dock door → yard tractor spots empty trailer → loading tasks begin → BY confirms ship → YMS releases trailer to carrier.<br>' +
  '<strong>Autonomous Integration:</strong> Outrider/ISEE systems receive move commands from YMS via API. YMS manages queue priority; autonomous truck executes moves. Human oversight via remote monitoring station.</p></div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=K3_lmGu5SF8" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Autonomous Yard Trucks</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// EXISTING: ROBOTICS OVERVIEW (now serves as automation overview reference)
// ═══════════════════════════════════════════════════
WIKI_PAGES['robotics-overview'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Robotics</div>' +
  '<h2>Warehouse Robotics Overview</h2>' +
  '<p>Warehouse robotics has transformed 3PL fulfillment by reducing labor dependency, improving accuracy, and increasing throughput. There are two primary categories of picking robots used in modern distribution operations, each suited to different operational profiles.</p>' +

  // ── Visual: Two-column overview cards ──
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1c1c1c,#2a2a2a);border-radius:12px;padding:24px;color:#fff;">' +
      '<div style="margin-bottom:8px;"><svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M2 22h20M6 22V6l6-4 6 4v16M10 22v-6h4v6M10 10h.01M14 10h.01M10 14h.01M14 14h.01" stroke="#ff3a00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:6px;">Goods-to-Person (G2P)</div>' +
      '<div style="font-size:13px;color:rgba(255,255,255,.7);line-height:1.5;">Inventory comes to the picker. Automated systems retrieve totes/bins from high-density storage and deliver them to ergonomic workstations. Zero walking time.</div>' +
      '<div style="margin-top:12px;font-size:12px;color:#ff3a00;font-weight:600;">400–500+ lines/hr per station</div>' +
    '</div>' +
    '<div style="background:linear-gradient(135deg,#1c1c1c,#2a2a2a);border-radius:12px;padding:24px;color:#fff;">' +
      '<div style="font-size:28px;margin-bottom:8px;">🤝</div>' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:6px;">Collaborative Robots (Cobots)</div>' +
      '<div style="font-size:13px;color:rgba(255,255,255,.7);line-height:1.5;">Robots work alongside pickers. AMRs carry totes through the warehouse and optimize routes via AI. Pickers focus on picking, robots handle navigation.</div>' +
      '<div style="margin-top:12px;font-size:12px;color:#ff3a00;font-weight:600;">2–3x productivity gain over manual</div>' +
    '</div>' +
  '</div>' +

  // ── Decision Framework ──
  '<h3>When to Recommend Each Type</h3>' +
  '<div class="wiki-callout"><div class="wiki-callout-title">Decision Framework for Client Conversations</div>' +
  '<p style="margin-bottom:8px;">Ask these four questions to quickly narrow the recommendation:</p>' +
  '<ol style="margin-left:18px;">' +
  '<li><strong>Is the client willing to invest in infrastructure?</strong> Yes → G2P. No → Cobots.</li>' +
  '<li><strong>Is footprint a constraint?</strong> Severe constraint → G2P (75% reduction). Adequate space → Either.</li>' +
  '<li><strong>What\'s the SKU count?</strong> High SKU (5,000+) → G2P shines. Moderate → Either works.</li>' +
  '<li><strong>Is demand seasonal or variable?</strong> Highly variable → Cobots (scale fleet up/down). Steady-state → G2P.</li>' +
  '</ol></div>' +

  // ── Comparison Table ──
  '<h3>Side-by-Side Comparison</h3>' +
  '<table class="wiki-spec-table"><tr><th>Factor</th><th>Goods-to-Person</th><th>Cobots (AMR)</th></tr>' +
  '<tr><td>How It Works</td><td>Inventory delivered to fixed stations</td><td>Robot navigates alongside picker</td></tr>' +
  '<tr><td>Best For</td><td>High-density, high-SKU, space-constrained</td><td>Flexible ops, seasonal peaks, existing layouts</td></tr>' +
  '<tr><td>Throughput</td><td>400–500+ lines/hr/station</td><td>175–200 UPH per picker</td></tr>' +
  '<tr><td>Capital Cost</td><td>$750K–$2M+</td><td>$15K–$80K/robot (RaaS available)</td></tr>' +
  '<tr><td>Infrastructure</td><td>Racking or grid required</td><td>None — works in existing layout</td></tr>' +
  '<tr><td>Deployment Time</td><td>3–6 months</td><td>2–6 weeks</td></tr>' +
  '<tr><td>Footprint Impact</td><td>Up to 75% reduction</td><td>Minimal change</td></tr>' +
  '<tr><td>Labor Impact</td><td>Eliminates walking entirely</td><td>Reduces walking 80%+</td></tr>' +
  '<tr><td>Scalability</td><td>Add stations/robots within grid</td><td>Add/remove robots as needed</td></tr></table>' +

  // ── Scenario Cards ──
  '<h3>Real-World Scenarios</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">' +
    '<div style="border:1px solid #dee2e6;border-radius:10px;padding:16px;background:#fff;">' +
      '<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#ff3a00;font-weight:700;margin-bottom:6px;">Scenario A</div>' +
      '<div style="font-size:13px;font-weight:700;color:#1c1c1c;margin-bottom:6px;">E-commerce client, 200K SF, 15K SKUs, consistent volume</div>' +
      '<div style="font-size:13px;color:#6c757d;line-height:1.5;">Recommend <strong>G2P (AutoStore or Exotec)</strong>. High SKU count and steady volume justify infrastructure investment. Footprint reduction could allow a smaller, cheaper facility.</div>' +
    '</div>' +
    '<div style="border:1px solid #dee2e6;border-radius:10px;padding:16px;background:#fff;">' +
      '<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#ff3a00;font-weight:700;margin-bottom:6px;">Scenario B</div>' +
      '<div style="font-size:13px;font-weight:700;color:#1c1c1c;margin-bottom:6px;">Retail client, 500K SF, seasonal peaks 3x baseline</div>' +
      '<div style="font-size:13px;color:#6c757d;line-height:1.5;">Recommend <strong>Cobots (Locus)</strong>. Seasonal variability means fixed infrastructure would be underutilized 9 months/year. Scale robot fleet for peak, reduce for off-peak. RaaS model keeps CapEx low.</div>' +
    '</div>' +
  '</div>' +

  // ── Video Resources ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:12px 0;">' +
    '<a href="https://www.youtube.com/watch?v=2ZBmR9hD0Eg" target="_blank" rel="noopener" style="text-decoration:none;border:1px solid #dee2e6;border-radius:8px;padding:12px;display:block;transition:.15s;">' +
      '<div style="font-size:12px;font-weight:700;color:#1c1c1c;">AutoStore System Overview</div>' +
      '<div style="font-size:11px;color:#6c757d;margin-top:4px;">See the cube grid and robot fleet in action — 2 min</div>' +
    '</a>' +
    '<a href="https://www.youtube.com/watch?v=EfnSMzMBMI4" target="_blank" rel="noopener" style="text-decoration:none;border:1px solid #dee2e6;border-radius:8px;padding:12px;display:block;transition:.15s;">' +
      '<div style="font-size:12px;font-weight:700;color:#1c1c1c;">Exotec Skypod Demo</div>' +
      '<div style="font-size:11px;color:#6c757d;margin-top:4px;">Watch 3D climbing robots retrieve inventory — 3 min</div>' +
    '</a>' +
    '<a href="https://www.youtube.com/watch?v=8gy9cGMBSSM" target="_blank" rel="noopener" style="text-decoration:none;border:1px solid #dee2e6;border-radius:8px;padding:12px;display:block;transition:.15s;">' +
      '<div style="font-size:12px;font-weight:700;color:#1c1c1c;">Locus Robotics in a 3PL</div>' +
      '<div style="font-size:11px;color:#6c757d;margin-top:4px;">Cobots working alongside pickers at scale — 2 min</div>' +
    '</a>' +
  '</div>' +
'</div>';

WIKI_PAGES['robotics-g2p'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Robotics / Goods-to-Person</div>' +
  '<h2>Goods-to-Person (G2P) Systems</h2>' +
  '<p>G2P systems automate inventory retrieval, delivering products directly to human pickers at ergonomic workstations. This eliminates unproductive walking time (typically 40–50% of a picker\'s shift) and dramatically improves both speed and accuracy.</p>' +

  // ── How G2P Works diagram ──
  '<h3>How G2P Works</h3>' +
  '<svg viewBox="0 0 700 160" style="width:100%;max-width:700px;margin:16px auto;display:block;" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#ff3a00"/></marker></defs>' +
    '<rect x="10" y="30" width="140" height="100" rx="10" fill="#f0f0f0" stroke="#dee2e6"/>' +
    '<text x="80" y="70" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="11" font-weight="700" fill="#1c1c1c">High-Density</text>' +
    '<text x="80" y="86" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="11" font-weight="700" fill="#1c1c1c">Storage</text>' +
    '<text x="80" y="110" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" fill="#6c757d">Grid / Rack / Cube</text>' +
    '<line x1="155" y1="80" x2="230" y2="80" stroke="#ff3a00" stroke-width="2" marker-end="url(#ah)"/>' +
    '<text x="192" y="72" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#ff3a00">Robot retrieves</text>' +
    '<rect x="235" y="30" width="140" height="100" rx="10" fill="#1c1c1c"/>' +
    '<text x="305" y="65" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="11" font-weight="700" fill="#fff">Autonomous</text>' +
    '<text x="305" y="81" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="11" font-weight="700" fill="#fff">Robot</text>' +
    '<text x="305" y="105" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" fill="#ff3a00">ACR / Skypod / R5</text>' +
    '<line x1="380" y1="80" x2="455" y2="80" stroke="#ff3a00" stroke-width="2" marker-end="url(#ah)"/>' +
    '<text x="417" y="72" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#ff3a00">Delivers bin</text>' +
    '<rect x="460" y="30" width="140" height="100" rx="10" fill="#fff" stroke="#ff3a00" stroke-width="2"/>' +
    '<text x="530" y="65" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="11" font-weight="700" fill="#1c1c1c">Pick Station</text>' +
    '<text x="530" y="85" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" fill="#6c757d">Ergonomic height</text>' +
    '<text x="530" y="100" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" fill="#6c757d">Zero walking</text>' +
    '<text x="530" y="115" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" fill="#198754" font-weight="600">400–500 lines/hr</text>' +
    '<line x1="605" y1="80" x2="680" y2="80" stroke="#ff3a00" stroke-width="2" marker-end="url(#ah)"/>' +
    '<text x="642" y="72" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#ff3a00">To pack</text>' +
  '</svg>' +

  // ── Three systems side by side ──
  '<h3>Hai Robotics — Autonomous Case-Handling Robots (ACR)</h3>' +
  // Hai diagram
  '<svg viewBox="0 0 500 200" style="width:100%;max-width:500px;margin:12px auto;display:block;" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="30" y="10" width="200" height="180" rx="6" fill="#f0f0f0" stroke="#dee2e6"/>' +
    '<text x="130" y="30" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#6c757d">STANDARD RACKING (up to 12m)</text>' +
    // Shelves
    '<rect x="50" y="40" width="160" height="8" rx="2" fill="#ced4da"/>' +
    '<rect x="50" y="70" width="160" height="8" rx="2" fill="#ced4da"/>' +
    '<rect x="50" y="100" width="160" height="8" rx="2" fill="#ced4da"/>' +
    '<rect x="50" y="130" width="160" height="8" rx="2" fill="#ced4da"/>' +
    '<rect x="50" y="160" width="160" height="8" rx="2" fill="#ced4da"/>' +
    // Totes on shelves
    '<rect x="60" y="45" width="20" height="22" rx="2" fill="#0dcaf0" opacity=".6"/>' +
    '<rect x="85" y="45" width="20" height="22" rx="2" fill="#0dcaf0" opacity=".6"/>' +
    '<rect x="120" y="75" width="20" height="22" rx="2" fill="#0dcaf0" opacity=".6"/>' +
    '<rect x="155" y="75" width="20" height="22" rx="2" fill="#ff3a00" opacity=".4"/>' +
    '<rect x="60" y="105" width="20" height="22" rx="2" fill="#0dcaf0" opacity=".6"/>' +
    '<rect x="155" y="135" width="20" height="22" rx="2" fill="#0dcaf0" opacity=".6"/>' +
    // Robot climbing
    '<rect x="110" y="108" width="30" height="20" rx="4" fill="#1c1c1c"/>' +
    '<text x="125" y="122" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#ff3a00" font-weight="700">ACR</text>' +
    '<line x1="125" y1="128" x2="125" y2="160" stroke="#1c1c1c" stroke-width="1.5" stroke-dasharray="3,3"/>' +
    // Arrow to station
    '<line x1="235" y1="100" x2="290" y2="100" stroke="#ff3a00" stroke-width="2" marker-end="url(#ah)"/>' +
    // Pick station
    '<rect x="295" y="70" width="100" height="60" rx="8" fill="#fff" stroke="#ff3a00" stroke-width="1.5"/>' +
    '<text x="345" y="95" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#1c1c1c">Pick Station</text>' +
    '<text x="345" y="115" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#6c757d">500 pcs/hr</text>' +
  '</svg>' +
  '<p>Hai Robotics\' ACR robots operate within <strong>standard racking structures</strong>, climbing vertically and horizontally to retrieve totes from heights up to 12m. This is the lowest-infrastructure G2P option — it works with existing cross-bar racking.</p>' +
  '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
  '<tr><td>Storage Density</td><td>Up to 45,000 totes per 1,000 m2; footprint reduction up to 75%</td></tr>' +
  '<tr><td>Throughput</td><td>500 pieces/hr per station; 4,000+ deliveries/hr system-wide</td></tr>' +
  '<tr><td>Storage Height</td><td>Up to 12m (39 ft); aisle widths as narrow as 900mm</td></tr>' +
  '<tr><td>Product Types</td><td>Plastic totes, carton boxes, shelves, pallets</td></tr></table>' +
  '<div class="wiki-callout"><div class="wiki-callout-title">When to Recommend Hai Robotics</div><p>Best for clients with <strong>existing standard racking</strong> who want G2P without ripping out infrastructure. Ideal for e-commerce fulfillment (2,000+ SKUs), automotive parts, and multi-client 3PL where you need high density without a full grid buildout.</p></div>' +

  '<h3>Exotec — Skypod 3D Autonomous Robots</h3>' +
  // Exotec diagram
  '<svg viewBox="0 0 500 200" style="width:100%;max-width:500px;margin:12px auto;display:block;" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="30" y="10" width="200" height="180" rx="6" fill="#f0f0f0" stroke="#dee2e6"/>' +
    '<text x="130" y="30" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#6c757d">3D CLIMBING STRUCTURE</text>' +
    // Vertical rails
    '<line x1="60" y1="38" x2="60" y2="185" stroke="#ced4da" stroke-width="3"/>' +
    '<line x1="130" y1="38" x2="130" y2="185" stroke="#ced4da" stroke-width="3"/>' +
    '<line x1="200" y1="38" x2="200" y2="185" stroke="#ced4da" stroke-width="3"/>' +
    // Horizontal rails
    '<line x1="55" y1="60" x2="205" y2="60" stroke="#ced4da" stroke-width="1.5"/>' +
    '<line x1="55" y1="95" x2="205" y2="95" stroke="#ced4da" stroke-width="1.5"/>' +
    '<line x1="55" y1="130" x2="205" y2="130" stroke="#ced4da" stroke-width="1.5"/>' +
    '<line x1="55" y1="165" x2="205" y2="165" stroke="#ced4da" stroke-width="1.5"/>' +
    // Bins
    '<rect x="65" y="63" width="25" height="28" rx="2" fill="#0dcaf0" opacity=".5"/>' +
    '<rect x="135" y="63" width="25" height="28" rx="2" fill="#0dcaf0" opacity=".5"/>' +
    '<rect x="65" y="98" width="25" height="28" rx="2" fill="#0dcaf0" opacity=".5"/>' +
    '<rect x="135" y="133" width="25" height="28" rx="2" fill="#0dcaf0" opacity=".5"/>' +
    // Skypod robot (on rails, mid-climb)
    '<rect x="90" y="98" width="35" height="28" rx="5" fill="#1c1c1c"/>' +
    '<text x="107" y="116" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="7" fill="#ff3a00" font-weight="700">SKYPOD</text>' +
    // Movement arrows
    '<line x1="107" y1="95" x2="107" y2="68" stroke="#ff3a00" stroke-width="1.5" stroke-dasharray="3,2"/>' +
    '<polygon points="103,70 107,62 111,70" fill="#ff3a00"/>' +
    '<line x1="125" y1="112" x2="133" y2="112" stroke="#ff3a00" stroke-width="1.5" stroke-dasharray="3,2"/>' +
    // Arrow to station
    '<line x1="235" y1="100" x2="290" y2="100" stroke="#ff3a00" stroke-width="2" marker-end="url(#ah)"/>' +
    '<text x="262" y="92" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#ff3a00">~2 min</text>' +
    // Pick station
    '<rect x="295" y="70" width="100" height="60" rx="8" fill="#fff" stroke="#ff3a00" stroke-width="1.5"/>' +
    '<text x="345" y="95" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#1c1c1c">Pick Station</text>' +
    '<text x="345" y="115" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#6c757d">400 lines/hr</text>' +
  '</svg>' +
  '<p>Skypods move in three dimensions — driving horizontally across the floor while <strong>climbing vertical racks up to 12m</strong>. The key differentiator: retrieval time is consistent (~2 min) regardless of where the item is stored. No "hot zone" or velocity-based slotting needed.</p>' +
  '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
  '<tr><td>Retrieval Time</td><td>~2 min from any location (consistent regardless of depth)</td></tr>' +
  '<tr><td>Throughput</td><td>Up to 400 lines/hr per picking station</td></tr>' +
  '<tr><td>Storage Height</td><td>Up to 12m (39+ ft)</td></tr>' +
  '<tr><td>Key Advantage</td><td>No performance degradation from item depth or popularity</td></tr></table>' +
  '<div class="wiki-callout"><div class="wiki-callout-title">When to Recommend Exotec</div><p>Best when the client has a <strong>wide range of product sizes</strong> and doesn\'t want to worry about slotting velocity. The consistent 2-minute retrieval makes it ideal for mixed-SKU operations where demand patterns are unpredictable.</p></div>' +

  '<h3>AutoStore — Cube-Based Compact Storage</h3>' +
  // AutoStore diagram
  '<svg viewBox="0 0 500 200" style="width:100%;max-width:500px;margin:12px auto;display:block;" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="30" y="10" width="200" height="180" rx="6" fill="#f0f0f0" stroke="#dee2e6"/>' +
    '<text x="130" y="28" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#6c757d">ALUMINUM GRID</text>' +
    // Grid of stacked bins
    '<rect x="45" y="55" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".4"/>' +
    '<rect x="45" y="82" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".5"/>' +
    '<rect x="45" y="109" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".6"/>' +
    '<rect x="45" y="136" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".7"/>' +
    '<rect x="80" y="55" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".4"/>' +
    '<rect x="80" y="82" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".5"/>' +
    '<rect x="80" y="109" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".6"/>' +
    '<rect x="80" y="136" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".7"/>' +
    '<rect x="115" y="55" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".4"/>' +
    '<rect x="115" y="82" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".5"/>' +
    '<rect x="115" y="109" width="30" height="25" rx="2" fill="#ff3a00" opacity=".3"/>' +
    '<rect x="115" y="136" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".7"/>' +
    '<rect x="150" y="55" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".4"/>' +
    '<rect x="150" y="82" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".5"/>' +
    '<rect x="150" y="109" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".6"/>' +
    '<rect x="150" y="136" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".7"/>' +
    '<rect x="185" y="55" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".4"/>' +
    '<rect x="185" y="82" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".5"/>' +
    '<rect x="185" y="109" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".6"/>' +
    '<rect x="185" y="136" width="30" height="25" rx="2" fill="#0dcaf0" opacity=".7"/>' +
    // Grid top rail
    '<line x1="42" y1="50" x2="218" y2="50" stroke="#343a40" stroke-width="2"/>' +
    // Robot on top
    '<rect x="110" y="35" width="36" height="14" rx="4" fill="#1c1c1c"/>' +
    '<text x="128" y="45" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="7" fill="#ff3a00" font-weight="700">R5</text>' +
    // Digging arrow
    '<line x1="128" y1="50" x2="128" y2="108" stroke="#ff3a00" stroke-width="1.5" stroke-dasharray="3,2"/>' +
    '<polygon points="124,105 128,113 132,105" fill="#ff3a00"/>' +
    // Arrow to port
    '<line x1="235" y1="100" x2="290" y2="100" stroke="#ff3a00" stroke-width="2" marker-end="url(#ah)"/>' +
    '<text x="262" y="92" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#ff3a00">to port</text>' +
    // Pick port
    '<rect x="295" y="70" width="100" height="60" rx="8" fill="#fff" stroke="#ff3a00" stroke-width="1.5"/>' +
    '<text x="345" y="90" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#1c1c1c">Pick Port</text>' +
    '<text x="345" y="108" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#198754" font-weight="600">20K+ picks/hr</text>' +
    '<text x="345" y="122" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#6c757d">(system-wide)</text>' +
  '</svg>' +
  '<p>AutoStore uses a unique <strong>cube grid</strong> where bins stack tightly with no aisles. Small robots operate on top of the grid, digging down to retrieve target bins. It achieves the highest storage density of any G2P technology — up to 400% better than traditional shelving.</p>' +
  '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
  '<tr><td>Storage Density</td><td>75% footprint reduction; 400% better than traditional shelving</td></tr>' +
  '<tr><td>Throughput</td><td>20,000+ picks/hr system-wide</td></tr>' +
  '<tr><td>Robot Uptime</td><td>99.5% average across high-throughput installations</td></tr>' +
  '<tr><td>Scalability</td><td>Add robots/ports without infrastructure redesign</td></tr></table>' +
  '<div class="wiki-callout"><div class="wiki-callout-title">When to Recommend AutoStore</div><p>Best for clients where <strong>space is the primary constraint</strong> and volume is high. Ideal for e-commerce, apparel, and returns processing. Caveat: bins buried deeper take longer to retrieve, so fast-movers should be near the top. Highest CapEx of the three — model ROI carefully against facility lease savings.</p></div>' +

  // ── Head-to-head comparison ──
  '<h3>G2P Comparison Matrix</h3>' +
  '<table class="wiki-spec-table"><tr><th>Factor</th><th>Hai Robotics</th><th>Exotec Skypod</th><th>AutoStore</th></tr>' +
  '<tr><td>Best For</td><td>Existing racking, high SKU</td><td>Mixed-size, consistent retrieval</td><td>Max density, high volume</td></tr>' +
  '<tr><td>How It Stores</td><td>Standard cross-bar racking</td><td>3D climbing rack structure</td><td>Cube grid — bins stacked</td></tr>' +
  '<tr><td>Footprint Reduction</td><td>Up to 75%</td><td>Up to 75%</td><td>Up to 75%</td></tr>' +
  '<tr><td>Throughput</td><td>500 pph / 4K del/hr</td><td>400 lines/hr</td><td>20K+ picks/hr (system)</td></tr>' +
  '<tr><td>Retrieval Consistency</td><td>Very consistent</td><td>Most consistent (2 min)</td><td>Varies by bin depth</td></tr>' +
  '<tr><td>Infrastructure Reuse</td><td>Works with existing racking</td><td>New structure required</td><td>New grid required</td></tr>' +
  '<tr><td>Capital Cost</td><td>$750K–$1.5M+</td><td>$750K–$1.5M+</td><td>$1M–$2M+</td></tr>' +
  '<tr><td>Deployment Time</td><td>3–5 months</td><td>4–6 months</td><td>4–6 months</td></tr></table>' +

  // ── Video links ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:12px 0;">' +
    '<a href="https://www.youtube.com/watch?v=cLVCGEmkJs0" target="_blank" rel="noopener" style="text-decoration:none;border:1px solid #dee2e6;border-radius:8px;padding:12px;display:block;">' +
      '<div style="font-size:12px;font-weight:700;color:#1c1c1c;">Hai Robotics ACR System</div>' +
      '<div style="font-size:11px;color:#6c757d;margin-top:4px;">Robots climbing racking to retrieve totes</div>' +
    '</a>' +
    '<a href="https://www.youtube.com/watch?v=EfnSMzMBMI4" target="_blank" rel="noopener" style="text-decoration:none;border:1px solid #dee2e6;border-radius:8px;padding:12px;display:block;">' +
      '<div style="font-size:12px;font-weight:700;color:#1c1c1c;">Exotec Skypod in Action</div>' +
      '<div style="font-size:11px;color:#6c757d;margin-top:4px;">3D climbing and picking station workflow</div>' +
    '</a>' +
    '<a href="https://www.youtube.com/watch?v=2ZBmR9hD0Eg" target="_blank" rel="noopener" style="text-decoration:none;border:1px solid #dee2e6;border-radius:8px;padding:12px;display:block;">' +
      '<div style="font-size:12px;font-weight:700;color:#1c1c1c;">AutoStore Cube Grid</div>' +
      '<div style="font-size:11px;color:#6c757d;margin-top:4px;">How robots dig through stacked bins</div>' +
    '</a>' +
  '</div>' +
'</div>';

WIKI_PAGES['robotics-cobots'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Robotics / Collaborative Robots</div>' +
  '<h2>Collaborative Mobile Robots (Cobots)</h2>' +
  '<p>Cobots are autonomous mobile robots (AMRs) that work alongside human pickers. Unlike G2P systems where inventory comes to the person, cobots follow a "robot-to-goods" model — the robot navigates the warehouse and the picker walks alongside, focused entirely on picking.</p>' +

  // ── Workflow diagram ──
  '<h3>How Cobot Picking Works</h3>' +
  '<svg viewBox="0 0 700 180" style="width:100%;max-width:700px;margin:16px auto;display:block;" xmlns="http://www.w3.org/2000/svg">' +
    // Step 1
    '<rect x="5" y="30" width="120" height="110" rx="10" fill="#f0f0f0" stroke="#dee2e6"/>' +
    '<text x="65" y="24" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" font-weight="700" fill="#ff3a00">1. AI ASSIGNS</text>' +
    '<text x="65" y="60" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="24">🤖</text>' +
    '<text x="65" y="85" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#1c1c1c">Robot gets order</text>' +
    '<text x="65" y="100" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#6c757d">AI optimizes route</text>' +
    '<text x="65" y="115" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#6c757d">to minimize travel</text>' +
    // Arrow
    '<line x1="130" y1="85" x2="155" y2="85" stroke="#ff3a00" stroke-width="2" marker-end="url(#ah)"/>' +
    // Step 2
    '<rect x="160" y="30" width="120" height="110" rx="10" fill="#f0f0f0" stroke="#dee2e6"/>' +
    '<text x="220" y="24" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" font-weight="700" fill="#ff3a00">2. NAVIGATE</text>' +
    '<text x="220" y="62" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="22">🤖➜📦</text>' +
    '<text x="220" y="88" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#1c1c1c">Robot leads picker</text>' +
    '<text x="220" y="103" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#6c757d">to next location</text>' +
    '<text x="220" y="118" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#6c757d">in optimal sequence</text>' +
    // Arrow
    '<line x1="285" y1="85" x2="310" y2="85" stroke="#ff3a00" stroke-width="2" marker-end="url(#ah)"/>' +
    // Step 3
    '<rect x="315" y="30" width="120" height="110" rx="10" fill="#fff" stroke="#ff3a00" stroke-width="1.5"/>' +
    '<text x="375" y="24" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" font-weight="700" fill="#ff3a00">3. PICK</text>' +
    '<text x="375" y="62" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="22">👷→📦</text>' +
    '<text x="375" y="88" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#1c1c1c">Picker selects items</text>' +
    '<text x="375" y="103" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#6c757d">into robot\'s tote</text>' +
    '<text x="375" y="118" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#6c757d">scan to confirm</text>' +
    // Arrow
    '<line x1="440" y1="85" x2="465" y2="85" stroke="#ff3a00" stroke-width="2" marker-end="url(#ah)"/>' +
    // Step 4
    '<rect x="470" y="30" width="120" height="110" rx="10" fill="#f0f0f0" stroke="#dee2e6"/>' +
    '<text x="530" y="24" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" font-weight="700" fill="#ff3a00">4. REPEAT / DELIVER</text>' +
    '<text x="530" y="62" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="22">🔄✅</text>' +
    '<text x="530" y="88" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" fill="#1c1c1c">Next pick or deliver</text>' +
    '<text x="530" y="103" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#6c757d">Full tote → pack station</text>' +
    '<text x="530" y="118" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="#198754" font-weight="600">175–200 UPH</text>' +
  '</svg>' +

  '<h3>Locus Robotics — Origin Platform</h3>' +
  '<p>The market leader in collaborative warehouse robots. Locus Origin robots navigate aisles guided by the LocusONE AI platform. The AI continuously re-optimizes pick sequences based on order mix, warehouse layout, and real-time congestion.</p>' +
  '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
  '<tr><td>Global Scale</td><td>250+ sites worldwide; 3+ million picks daily</td></tr>' +
  '<tr><td>Productivity Gain</td><td>2–3x over baseline (100 UPH → 175–200 UPH)</td></tr>' +
  '<tr><td>Training Impact</td><td>Double-digit reductions in onboarding time</td></tr>' +
  '<tr><td>Physical Load</td><td>50%+ reduction in worker physical burden</td></tr>' +
  '<tr><td>Cost Model</td><td>$15K–$80K per robot, or RaaS subscription</td></tr></table>' +

  // ── Before/After comparison ──
  '<h3>Productivity Impact: Before vs. After</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;">' +
    '<div style="border:2px solid #dee2e6;border-radius:10px;padding:18px;text-align:center;">' +
      '<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6c757d;font-weight:700;margin-bottom:10px;">Traditional Pick-to-Cart</div>' +
      '<div style="font-size:36px;font-weight:800;color:#dc3545;">100</div>' +
      '<div style="font-size:12px;color:#6c757d;">units per hour</div>' +
      '<div style="margin-top:10px;font-size:12px;color:#6c757d;line-height:1.5;">40–50% of shift is walking<br>High fatigue, high turnover<br>Manual route decisions</div>' +
    '</div>' +
    '<div style="border:2px solid #198754;border-radius:10px;padding:18px;text-align:center;">' +
      '<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#198754;font-weight:700;margin-bottom:10px;">With Locus Cobots</div>' +
      '<div style="font-size:36px;font-weight:800;color:#198754;">200</div>' +
      '<div style="font-size:12px;color:#6c757d;">units per hour</div>' +
      '<div style="margin-top:10px;font-size:12px;color:#6c757d;line-height:1.5;">Minimal walking (robot leads)<br>Reduced fatigue, lower turnover<br>AI-optimized routes</div>' +
    '</div>' +
  '</div>' +

  '<div class="wiki-callout"><div class="wiki-callout-title">When to Recommend Cobots</div>' +
  '<p>Cobots are the <strong>fastest path to automation for 3PL</strong>. Recommend when:</p>' +
  '<ul>' +
  '<li><strong>No infrastructure budget</strong> — works in existing layout, no racking changes</li>' +
  '<li><strong>Seasonal demand swings</strong> — scale fleet up for peak, down for off-peak</li>' +
  '<li><strong>Tight labor market</strong> — force-multiply existing workforce rather than hiring 2x</li>' +
  '<li><strong>Fast deployment needed</strong> — live in 2–6 weeks vs. months for G2P</li>' +
  '<li><strong>Client wants OpEx not CapEx</strong> — RaaS subscription available</li>' +
  '</ul></div>' +

  // ── Video ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;">' +
    '<a href="https://www.youtube.com/watch?v=8gy9cGMBSSM" target="_blank" rel="noopener" style="text-decoration:none;border:1px solid #dee2e6;border-radius:8px;padding:12px;display:block;">' +
      '<div style="font-size:12px;font-weight:700;color:#1c1c1c;">Locus Robotics in a 3PL Warehouse</div>' +
      '<div style="font-size:11px;color:#6c757d;margin-top:4px;">See cobots working alongside pickers at scale</div>' +
    '</a>' +
    '<a href="https://www.youtube.com/watch?v=KNOxjNKvHn8" target="_blank" rel="noopener" style="text-decoration:none;border:1px solid #dee2e6;border-radius:8px;padding:12px;display:block;">' +
      '<div style="font-size:12px;font-weight:700;color:#1c1c1c;">How AMR Picking Changes Warehouse Ops</div>' +
      '<div style="font-size:11px;color:#6c757d;margin-top:4px;">Industry overview of cobot impact on labor and throughput</div>' +
    '</a>' +
  '</div>' +
'</div>';

WIKI_PAGES['conveyors-overview'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Conveyors</div>' +
  '<h2>Warehouse Conveyor Systems Overview</h2>' +
  '<p>Conveyor systems form the backbone of warehouse automation, moving products through the facility from receiving through shipping. For IES Solutions Designers, conveyors appear in nearly every automation scope — understanding the categories, capabilities, and integration points is critical to designing effective material handling solutions.</p>' +

  // ── System Architecture SVG ──
  '<div style="margin:24px 0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px;padding:28px 20px;">' +
  '<div style="text-align:center;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Typical Warehouse Conveyor Flow</div>' +
  '<svg viewBox="0 0 800 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:800px;display:block;margin:0 auto;">' +
    '<defs><linearGradient id="cvFlow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs>' +
    // Receiving
    '<rect x="10" y="50" width="120" height="80" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>' +
    '<text x="70" y="82" text-anchor="middle" fill="#3b82f6" font-size="11" font-weight="700">RECEIVING</text>' +
    '<text x="70" y="100" text-anchor="middle" fill="#94a3b8" font-size="9">Inbound Dock</text>' +
    '<text x="70" y="114" text-anchor="middle" fill="#64748b" font-size="8">Gravity Roller</text>' +
    // Arrow 1
    '<line x1="135" y1="90" x2="175" y2="90" stroke="url(#cvFlow)" stroke-width="2" stroke-dasharray="6,3"/>' +
    '<polygon points="175,85 185,90 175,95" fill="#3b82f6"/>' +
    // Transport
    '<rect x="190" y="50" width="120" height="80" rx="10" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>' +
    '<text x="250" y="82" text-anchor="middle" fill="#8b5cf6" font-size="11" font-weight="700">TRANSPORT</text>' +
    '<text x="250" y="100" text-anchor="middle" fill="#94a3b8" font-size="9">Zone-to-Zone</text>' +
    '<text x="250" y="114" text-anchor="middle" fill="#64748b" font-size="8">Belt / Powered Roller</text>' +
    // Arrow 2
    '<line x1="315" y1="90" x2="355" y2="90" stroke="url(#cvFlow)" stroke-width="2" stroke-dasharray="6,3"/>' +
    '<polygon points="355,85 365,90 355,95" fill="#8b5cf6"/>' +
    // Pick / Pack
    '<rect x="370" y="50" width="120" height="80" rx="10" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>' +
    '<text x="430" y="82" text-anchor="middle" fill="#f59e0b" font-size="11" font-weight="700">PICK & PACK</text>' +
    '<text x="430" y="100" text-anchor="middle" fill="#94a3b8" font-size="9">Workstations</text>' +
    '<text x="430" y="114" text-anchor="middle" fill="#64748b" font-size="8">Accumulation Conv.</text>' +
    // Arrow 3
    '<line x1="495" y1="90" x2="535" y2="90" stroke="url(#cvFlow)" stroke-width="2" stroke-dasharray="6,3"/>' +
    '<polygon points="535,85 545,90 535,95" fill="#f59e0b"/>' +
    // Sortation
    '<rect x="550" y="50" width="120" height="80" rx="10" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
    '<text x="610" y="82" text-anchor="middle" fill="#ef4444" font-size="11" font-weight="700">SORTATION</text>' +
    '<text x="610" y="100" text-anchor="middle" fill="#94a3b8" font-size="9">Route to Lanes</text>' +
    '<text x="610" y="114" text-anchor="middle" fill="#64748b" font-size="8">Shoe / Crossbelt</text>' +
    // Arrow 4
    '<line x1="675" y1="90" x2="715" y2="90" stroke="url(#cvFlow)" stroke-width="2" stroke-dasharray="6,3"/>' +
    '<polygon points="715,85 725,90 715,95" fill="#ef4444"/>' +
    // Shipping
    '<rect x="730" y="50" width="60" height="80" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>' +
    '<text x="760" y="85" text-anchor="middle" fill="#10b981" font-size="11" font-weight="700">SHIP</text>' +
    '<text x="760" y="100" text-anchor="middle" fill="#94a3b8" font-size="8">Outbound</text>' +
    // Top label
    '<text x="400" y="25" text-anchor="middle" fill="#475569" font-size="10">WCS / PLC Coordination Layer</text>' +
    '<line x1="70" y1="35" x2="760" y2="35" stroke="#334155" stroke-width="1" stroke-dasharray="4,4"/>' +
  '</svg></div>' +

  // ── Category Cards ──
  '<h3>Conveyor Categories at a Glance</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +

    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="font-size:22px;margin-bottom:8px;">🔵</div>' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:6px;">Transport</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Belt, Powered Roller, Gravity Roller — move product between zones at 50–500+ fpm</div></div>' +

    '<div style="background:linear-gradient(135deg,#3b1f2b 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #ef4444;">' +
    '<div style="font-size:22px;margin-bottom:8px;">🔴</div>' +
    '<div style="color:#ef4444;font-weight:700;font-size:14px;margin-bottom:6px;">Sortation</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Shoe, Crossbelt, Tilt-Tray, Bomb Bay — route items to destinations at 6K–25K UPH</div></div>' +

    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="font-size:22px;margin-bottom:8px;">🟢</div>' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:6px;">Vertical</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Spiral conveyors and vertical lifts — multi-level movement in minimal footprint</div></div>' +

    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="font-size:22px;margin-bottom:8px;">🟡</div>' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:6px;">Accumulation</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Zero-pressure and pressure — buffer, queue, and balance flow between speed zones</div></div>' +

  '</div>' +

  // ── Decision Framework ──
  '<div class="wiki-callout" style="border-left-color:#8b5cf6;"><div class="wiki-callout-title" style="color:#8b5cf6;">Decision Framework: Which Category Do You Need?</div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">' +
    '<div style="background:rgba(59,130,246,.1);padding:12px;border-radius:8px;font-size:12px;"><strong style="color:#3b82f6;">1. Moving A→B?</strong><br/>Transport conveyor. Belt for fragile/small, roller for cases/pallets.</div>' +
    '<div style="background:rgba(239,68,68,.1);padding:12px;border-radius:8px;font-size:12px;"><strong style="color:#ef4444;">2. Routing to many lanes?</strong><br/>Sortation conveyor. Choose type by item profile and throughput.</div>' +
    '<div style="background:rgba(16,185,129,.1);padding:12px;border-radius:8px;font-size:12px;"><strong style="color:#10b981;">3. Changing levels?</strong><br/>Vertical conveyor. Spiral for continuous, lift for intermittent.</div>' +
    '<div style="background:rgba(245,158,11,.1);padding:12px;border-radius:8px;font-size:12px;"><strong style="color:#f59e0b;">4. Need to buffer?</strong><br/>Accumulation conveyor. Zero-pressure for fragile, pressure for simple.</div>' +
  '</div></div>' +

  // ── Key Vendors ──
  '<h3>Key Vendors</h3>' +
  '<p><span class="wiki-tag wiki-tag-vendor">Dematic</span> <span class="wiki-tag wiki-tag-vendor">Honeywell Intelligrated</span> <span class="wiki-tag wiki-tag-vendor">TGW</span> <span class="wiki-tag wiki-tag-vendor">Beumer</span> <span class="wiki-tag wiki-tag-vendor">Interroll</span> <span class="wiki-tag wiki-tag-vendor">Hytrol</span> <span class="wiki-tag wiki-tag-vendor">Dorner</span></p>' +

  // ── Hybrid Integration Callout ──
  '<div class="wiki-callout"><div class="wiki-callout-title">Integration with Robotics</div><p>Modern warehouses use hybrid systems: G2P robots deliver totes to picking stations, then conveyors transport picked orders to packing and sortation. A centralized Warehouse Control System (WCS) coordinates handoffs between robot zones and conveyor lines via PLC logic and sensor confirmation.</p></div>' +

  // ── Video Resources ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=8iKaq6jP8to" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Warehouse Conveyor Fundamentals</a>' +
    '<a href="https://www.youtube.com/watch?v=FakZoxSBNVU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Sortation Systems in Action</a>' +
    '<a href="https://www.youtube.com/watch?v=IRwyOPO6KR4" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Hybrid Robotics + Conveyors</a>' +
  '</div>' +
'</div>';

WIKI_PAGES['conveyors-types'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Conveyors / Conveyor Types</div>' +
  '<h2>Conveyor Types</h2>' +
  '<p>Each conveyor type serves a specific role in the material handling system. Understanding their mechanics, strengths, and limits helps IES designers select the right conveyor for each zone in a facility layout.</p>' +

  // ── Belt Conveyor ──
  '<h3>Belt Conveyors</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p>Products move on a continuous belt driven by powered rollers. Belt material is typically rubber or PVC over idler rollers. Excellent for small-to-medium products, fragile items, and incline/decline movement.</p>' +
    '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
    '<tr><td>Belt Speed</td><td>50–500 fpm</td></tr>' +
    '<tr><td>Belt Width</td><td>12" to 60"+</td></tr>' +
    '<tr><td>Belt Material</td><td>Rubber, PVC, canvas, modular plastic</td></tr>' +
    '<tr><td>Max Incline</td><td>15–30° (anti-slip surface required)</td></tr>' +
    '<tr><td>Best For</td><td>Fragile items, precise positioning, incline/decline</td></tr></table></div>' +
    // Belt cross-section SVG
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Belt Conveyor — Cross Section</div>' +
    '<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Frame
      '<rect x="20" y="110" width="280" height="8" rx="2" fill="#334155"/>' +
      // Idler rollers
      '<circle cx="60" cy="100" r="12" fill="#475569" stroke="#64748b" stroke-width="1"/><circle cx="60" cy="100" r="3" fill="#1e293b"/>' +
      '<circle cx="160" cy="100" r="12" fill="#475569" stroke="#64748b" stroke-width="1"/><circle cx="160" cy="100" r="3" fill="#1e293b"/>' +
      '<circle cx="260" cy="100" r="12" fill="#475569" stroke="#64748b" stroke-width="1"/><circle cx="260" cy="100" r="3" fill="#1e293b"/>' +
      // Belt
      '<path d="M40,88 L280,88" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>' +
      '<text x="160" y="82" text-anchor="middle" fill="#3b82f6" font-size="9" font-weight="600">BELT SURFACE</text>' +
      // Product
      '<rect x="120" y="58" width="80" height="26" rx="4" fill="#f59e0b" opacity="0.8"/>' +
      '<text x="160" y="75" text-anchor="middle" fill="#1a1a2e" font-size="9" font-weight="600">PRODUCT</text>' +
      // Drive roller label
      '<text x="60" y="140" text-anchor="middle" fill="#64748b" font-size="8">Drive</text>' +
      '<text x="160" y="140" text-anchor="middle" fill="#64748b" font-size="8">Idler</text>' +
      '<text x="260" y="140" text-anchor="middle" fill="#64748b" font-size="8">Tail</text>' +
      // Direction arrow
      '<line x1="80" y1="30" x2="240" y2="30" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrowBlue)"/>' +
      '<text x="160" y="24" text-anchor="middle" fill="#3b82f6" font-size="8">DIRECTION OF TRAVEL</text>' +
      '<defs><marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0,0 8,3 0,6" fill="#3b82f6"/></marker></defs>' +
    '</svg></div>' +
  '</div>' +

  // ── Gravity Roller ──
  '<h3>Gravity Roller Conveyors</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p>Products roll freely over unpowered cylinders on a slight incline (2–5% slope typical). Zero operating cost — gravity does the work. Ideal for manual sortation, staging areas, and buffering between powered sections.</p>' +
    '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
    '<tr><td>Slope</td><td>2–5% (¼" to ⅝" per foot)</td></tr>' +
    '<tr><td>Roller Diameter</td><td>1.375"–1.9" typical</td></tr>' +
    '<tr><td>Load Capacity</td><td>Up to 75 lbs/ft (light-medium duty)</td></tr>' +
    '<tr><td>Operating Cost</td><td>Zero — no power needed</td></tr>' +
    '<tr><td>Best For</td><td>Staging, buffering, manual sort areas</td></tr></table></div>' +
    // Gravity roller SVG
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Gravity Roller — Side View</div>' +
    '<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Inclined frame
      '<line x1="30" y1="60" x2="290" y2="90" stroke="#334155" stroke-width="3"/>' +
      '<line x1="30" y1="70" x2="290" y2="100" stroke="#334155" stroke-width="3"/>' +
      // Rollers along incline
      '<circle cx="60" cy="61" r="8" fill="#475569" stroke="#10b981" stroke-width="1"/>' +
      '<circle cx="100" cy="64" r="8" fill="#475569" stroke="#10b981" stroke-width="1"/>' +
      '<circle cx="140" cy="68" r="8" fill="#475569" stroke="#10b981" stroke-width="1"/>' +
      '<circle cx="180" cy="72" r="8" fill="#475569" stroke="#10b981" stroke-width="1"/>' +
      '<circle cx="220" cy="76" r="8" fill="#475569" stroke="#10b981" stroke-width="1"/>' +
      '<circle cx="260" cy="80" r="8" fill="#475569" stroke="#10b981" stroke-width="1"/>' +
      // Product sliding down
      '<rect x="85" y="36" width="60" height="22" rx="3" fill="#f59e0b" opacity="0.8" transform="rotate(2.2,115,47)"/>' +
      '<text x="115" y="51" text-anchor="middle" fill="#1a1a2e" font-size="8" font-weight="600">CARTON</text>' +
      // Gravity arrow
      '<text x="270" y="60" fill="#10b981" font-size="9" font-weight="600">↓ Gravity</text>' +
      // Slope label
      '<text x="160" y="125" text-anchor="middle" fill="#64748b" font-size="9">2–5% slope (no power required)</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Powered Roller ──
  '<h3>Powered Roller Conveyors</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p>Individually motorized or chain-driven rollers handle heavy loads (100+ lbs), move products uphill, and support high-speed transport up to 500+ fpm. The workhorse of pallet and case handling across every major warehouse.</p>' +
    '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
    '<tr><td>Roller Diameter</td><td>2"–4" typical</td></tr>' +
    '<tr><td>Roller Spacing</td><td>3"–6" (closer for smaller products)</td></tr>' +
    '<tr><td>Drive Types</td><td>Direct-drive motors, chain drive, belt drive</td></tr>' +
    '<tr><td>Speed</td><td>200–400+ fpm typical for high-volume</td></tr>' +
    '<tr><td>Load Capacity</td><td>100+ lbs per linear foot</td></tr></table></div>' +
    // Powered roller SVG
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Powered Roller — MDR Zone</div>' +
    '<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      '<rect x="20" y="85" width="280" height="8" rx="2" fill="#334155"/>' +
      // Zone 1
      '<rect x="30" y="68" width="80" height="20" rx="3" fill="none" stroke="#8b5cf6" stroke-width="1" stroke-dasharray="4,2"/>' +
      '<circle cx="50" cy="78" r="9" fill="#475569" stroke="#8b5cf6" stroke-width="1.5"/><circle cx="50" cy="78" r="2" fill="#8b5cf6"/>' +
      '<circle cx="75" cy="78" r="9" fill="#475569" stroke="#64748b" stroke-width="1"/><circle cx="75" cy="78" r="2" fill="#1e293b"/>' +
      '<circle cx="100" cy="78" r="9" fill="#475569" stroke="#64748b" stroke-width="1"/><circle cx="100" cy="78" r="2" fill="#1e293b"/>' +
      '<text x="75" y="60" text-anchor="middle" fill="#8b5cf6" font-size="8">ZONE 1</text>' +
      // Zone 2
      '<rect x="120" y="68" width="80" height="20" rx="3" fill="none" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4,2"/>' +
      '<circle cx="140" cy="78" r="9" fill="#475569" stroke="#3b82f6" stroke-width="1.5"/><circle cx="140" cy="78" r="2" fill="#3b82f6"/>' +
      '<circle cx="165" cy="78" r="9" fill="#475569" stroke="#64748b" stroke-width="1"/><circle cx="165" cy="78" r="2" fill="#1e293b"/>' +
      '<circle cx="190" cy="78" r="9" fill="#475569" stroke="#64748b" stroke-width="1"/><circle cx="190" cy="78" r="2" fill="#1e293b"/>' +
      '<text x="165" y="60" text-anchor="middle" fill="#3b82f6" font-size="8">ZONE 2</text>' +
      // Zone 3
      '<rect x="210" y="68" width="80" height="20" rx="3" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="4,2"/>' +
      '<circle cx="230" cy="78" r="9" fill="#475569" stroke="#10b981" stroke-width="1.5"/><circle cx="230" cy="78" r="2" fill="#10b981"/>' +
      '<circle cx="255" cy="78" r="9" fill="#475569" stroke="#64748b" stroke-width="1"/><circle cx="255" cy="78" r="2" fill="#1e293b"/>' +
      '<circle cx="280" cy="78" r="9" fill="#475569" stroke="#64748b" stroke-width="1"/><circle cx="280" cy="78" r="2" fill="#1e293b"/>' +
      '<text x="255" y="60" text-anchor="middle" fill="#10b981" font-size="8">ZONE 3</text>' +
      // Labels
      '<text x="160" y="115" text-anchor="middle" fill="#64748b" font-size="9">Motor-Driven Roller (MDR) — each zone independently controlled</text>' +
      '<text x="160" y="30" text-anchor="middle" fill="#94a3b8" font-size="9">Colored dots = motorized drive rollers</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Spiral / Vertical ──
  '<h3>Spiral / Vertical Conveyors</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p>Continuous belt spiraling vertically to transport items between warehouse levels. Minimal floor footprint (10–60+ ft rise), quiet operation, and high continuous capacity. Essential for multi-level facilities with limited floor space.</p>' +
    '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
    '<tr><td>Rise Height</td><td>10–60+ ft</td></tr>' +
    '<tr><td>Footprint</td><td>6×6 ft to 12×12 ft typical</td></tr>' +
    '<tr><td>Throughput</td><td>Up to 2,000 cartons/hr continuous</td></tr>' +
    '<tr><td>Noise Level</td><td>< 70 dB (much quieter than lifts)</td></tr>' +
    '<tr><td>Best For</td><td>Multi-level facilities, mezzanines</td></tr></table></div>' +
    // Spiral SVG
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Spiral Conveyor — Side View</div>' +
    '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Center column
      '<rect x="150" y="20" width="20" height="140" rx="3" fill="#334155"/>' +
      // Spiral wraps (ellipses at different heights)
      '<ellipse cx="160" cy="145" rx="60" ry="14" fill="none" stroke="#3b82f6" stroke-width="2"/>' +
      '<ellipse cx="160" cy="120" rx="58" ry="13" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.85"/>' +
      '<ellipse cx="160" cy="95" rx="56" ry="12" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.7"/>' +
      '<ellipse cx="160" cy="70" rx="54" ry="11" fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.55"/>' +
      '<ellipse cx="160" cy="45" rx="52" ry="10" fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.4"/>' +
      // Up arrow
      '<line x1="250" y1="140" x2="250" y2="40" stroke="#10b981" stroke-width="2" marker-end="url(#arrowGreen)"/>' +
      '<text x="265" y="90" fill="#10b981" font-size="9" font-weight="600" transform="rotate(-90,265,90)">ELEVATION</text>' +
      '<defs><marker id="arrowGreen" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0,0 8,3 0,6" fill="#10b981"/></marker></defs>' +
      // Labels
      '<text x="70" y="150" text-anchor="middle" fill="#64748b" font-size="8">Level 1</text>' +
      '<text x="70" y="50" text-anchor="middle" fill="#64748b" font-size="8">Level 2+</text>' +
      '<text x="160" y="175" text-anchor="middle" fill="#94a3b8" font-size="8">6×6 ft footprint — 60 ft rise</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Accumulation ──
  '<h3>Accumulation Conveyors</h3>' +
  '<p>Accumulation conveyors stop items individually while maintaining gaps — critical for buffering between zones running at different speeds. Two main types:</p>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;">' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">Zero-Pressure</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.6;">Products stop without touching each other. Photo-eye sensors detect gaps. Best for fragile items, glass, electronics. Higher cost but zero product damage risk.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">Pressure (Minimum Pressure)</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.6;">Products touch and gently push against each other. Simpler design, lower cost. Acceptable for durable cartons/totes. Risk of product damage with fragile goods.</div></div>' +
  '</div>' +

  // ── When to Recommend callout ──
  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">When to Recommend Each Type</div>' +
  '<table class="wiki-spec-table"><tr><th>Scenario</th><th>Best Conveyor Type</th><th>Why</th></tr>' +
  '<tr><td>E-commerce small parcel, multi-level</td><td>Belt + Spiral</td><td>Handles small items gently, moves between mezzanine levels</td></tr>' +
  '<tr><td>Case-pick DC, high volume</td><td>Powered Roller (MDR)</td><td>Handles heavy cases, zone control for accumulation</td></tr>' +
  '<tr><td>Manual pack stations</td><td>Gravity Roller</td><td>Zero power cost, operators push cartons to staging</td></tr>' +
  '<tr><td>Mixed-use 3PL, variable clients</td><td>Belt + Zero-Pressure Accum.</td><td>Flexibility for changing product profiles</td></tr>' +
  '<tr><td>Pallet handling, receiving to storage</td><td>Chain-Driven Roller</td><td>Heavy-duty, handles 2,000+ lb pallets</td></tr></table></div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=0OeStxbzKsM" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Belt Conveyor Basics</a>' +
    '<a href="https://www.youtube.com/watch?v=8iKaq6jP8to" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Motor-Driven Rollers (MDR)</a>' +
    '<a href="https://www.youtube.com/watch?v=FakZoxSBNVU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Spiral Conveyors in Action</a>' +
    '<a href="https://www.youtube.com/watch?v=-SPz9F-BYWU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Zero-Pressure Accumulation</a>' +
  '</div>' +
'</div>';

WIKI_PAGES['conveyors-sortation'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Conveyors / Sortation Systems</div>' +
  '<h2>Conveyor Sortation Systems</h2>' +
  '<p>Sortation conveyors are the high-throughput engines of distribution — routing items to correct lanes, chutes, or destinations at speeds that manual sorting cannot match. Choosing the right sortation technology is one of the highest-impact decisions in a warehouse design.</p>' +

  // ── Sortation Loop Overview SVG ──
  '<div style="margin:24px 0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px;padding:28px 20px;">' +
  '<div style="text-align:center;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Sortation Loop Architecture</div>' +
  '<svg viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;display:block;margin:0 auto;">' +
    // Main loop track
    '<rect x="80" y="60" width="540" height="80" rx="40" fill="none" stroke="#3b82f6" stroke-width="3"/>' +
    // Induction point
    '<rect x="40" y="140" width="80" height="30" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>' +
    '<text x="80" y="159" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="600">INDUCTION</text>' +
    '<line x1="80" y1="140" x2="120" y2="120" stroke="#f59e0b" stroke-width="1.5"/>' +
    // Scanner
    '<rect x="140" y="145" width="70" height="25" rx="5" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>' +
    '<text x="175" y="162" text-anchor="middle" fill="#8b5cf6" font-size="8" font-weight="600">SCAN / ID</text>' +
    '<line x1="175" y1="145" x2="175" y2="125" stroke="#8b5cf6" stroke-width="1" stroke-dasharray="3,2"/>' +
    // Divert points (chutes)
    '<rect x="260" y="10" width="60" height="40" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
    '<text x="290" y="30" text-anchor="middle" fill="#ef4444" font-size="8" font-weight="600">CHUTE 1</text>' +
    '<text x="290" y="42" text-anchor="middle" fill="#64748b" font-size="7">Zone A</text>' +
    '<line x1="290" y1="50" x2="290" y2="60" stroke="#ef4444" stroke-width="1.5"/>' +

    '<rect x="370" y="10" width="60" height="40" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
    '<text x="400" y="30" text-anchor="middle" fill="#ef4444" font-size="8" font-weight="600">CHUTE 2</text>' +
    '<text x="400" y="42" text-anchor="middle" fill="#64748b" font-size="7">Zone B</text>' +
    '<line x1="400" y1="50" x2="400" y2="60" stroke="#ef4444" stroke-width="1.5"/>' +

    '<rect x="480" y="10" width="60" height="40" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
    '<text x="510" y="30" text-anchor="middle" fill="#ef4444" font-size="8" font-weight="600">CHUTE 3</text>' +
    '<text x="510" y="42" text-anchor="middle" fill="#64748b" font-size="7">Zone C</text>' +
    '<line x1="510" y1="50" x2="510" y2="60" stroke="#ef4444" stroke-width="1.5"/>' +

    // Recirculation label
    '<text x="580" y="195" fill="#3b82f6" font-size="9" font-weight="600">Recirculation →</text>' +
    // Direction arrows on loop
    '<polygon points="350,58 358,52 358,64" fill="#3b82f6"/>' +
    '<polygon points="350,142 342,136 342,148" fill="#3b82f6"/>' +
    // Labels
    '<text x="350" y="210" text-anchor="middle" fill="#475569" font-size="9">Items loop until diverted • No-read items recirculate • WCS controls divert timing</text>' +
  '</svg></div>' +

  // ── Tilt-Tray ──
  '<h3>Tilt-Tray Sorter</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p>Trays on a continuous loop tilt at the correct destination, sliding items into chutes below. Proven and reliable technology for uniform small-to-medium parcels. The tilt mechanism is pneumatic or mechanical, triggered by the WCS based on scanned destination.</p>' +
    '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
    '<tr><td>Throughput</td><td>6,000–14,000 units/hr</td></tr>' +
    '<tr><td>Item Types</td><td>Small to medium parcels, books, flats</td></tr>' +
    '<tr><td>Destinations</td><td>50–200+ chutes typical</td></tr>' +
    '<tr><td>Capital Cost</td><td>$5M–$10M+ for complete system</td></tr>' +
    '<tr><td>Footprint</td><td>Large — loop design requires significant floor space</td></tr></table></div>' +
    // Tilt-tray mechanism SVG
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Tilt-Tray Mechanism</div>' +
    '<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Track
      '<line x1="20" y1="100" x2="280" y2="100" stroke="#334155" stroke-width="4"/>' +
      // Flat tray (before tilt)
      '<rect x="40" y="70" width="60" height="6" rx="2" fill="#3b82f6"/>' +
      '<rect x="50" y="52" width="40" height="18" rx="3" fill="#f59e0b" opacity="0.8"/>' +
      '<text x="70" y="65" text-anchor="middle" fill="#1a1a2e" font-size="7" font-weight="600">ITEM</text>' +
      '<rect x="55" y="76" width="8" height="24" rx="2" fill="#475569"/><rect x="77" y="76" width="8" height="24" rx="2" fill="#475569"/>' +
      '<text x="70" y="125" text-anchor="middle" fill="#64748b" font-size="8">Carrying</text>' +
      // Tilted tray (at divert)
      '<rect x="160" y="62" width="60" height="6" rx="2" fill="#ef4444" transform="rotate(25,190,65)"/>' +
      '<rect x="173" y="76" width="8" height="24" rx="2" fill="#475569"/><rect x="195" y="76" width="8" height="24" rx="2" fill="#475569"/>' +
      // Item falling
      '<rect x="220" y="55" width="30" height="15" rx="3" fill="#f59e0b" opacity="0.6" transform="rotate(15,235,62)"/>' +
      '<text x="250" y="50" fill="#ef4444" font-size="8" font-weight="600">→ CHUTE</text>' +
      '<text x="190" y="125" text-anchor="middle" fill="#64748b" font-size="8">Tilting</text>' +
      // Direction
      '<line x1="110" y1="90" x2="145" y2="90" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrowBlue2)"/>' +
      '<defs><marker id="arrowBlue2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0,0 8,3 0,6" fill="#3b82f6"/></marker></defs>' +
    '</svg></div>' +
  '</div>' +

  // ── Crossbelt ──
  '<h3>Crossbelt Sorter</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p>Small motorized belt conveyors on carts moving along a main loop. Each belt activates independently to move items perpendicular to the main flow. Handles the widest variety of item sizes and shapes — the premium choice for high-volume e-commerce.</p>' +
    '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
    '<tr><td>Throughput</td><td>Up to 25,000 units/hr</td></tr>' +
    '<tr><td>Item Types</td><td>Wide variety — parcels, apparel, irregular shapes</td></tr>' +
    '<tr><td>Destinations</td><td>100–300+ chutes</td></tr>' +
    '<tr><td>Key Advantage</td><td>Gentle handling, mixed-size capability</td></tr>' +
    '<tr><td>Capital Cost</td><td>$8M–$15M+ (highest among sorters)</td></tr></table></div>' +
    // Crossbelt mechanism SVG
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Crossbelt Mechanism</div>' +
    '<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Main track
      '<line x1="20" y1="100" x2="280" y2="100" stroke="#334155" stroke-width="4"/>' +
      // Cart 1 (carrying)
      '<rect x="40" y="80" width="50" height="20" rx="3" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>' +
      '<line x1="48" y1="85" x2="82" y2="85" stroke="#8b5cf6" stroke-width="2"/>' +
      '<text x="65" y="94" text-anchor="middle" fill="#3b82f6" font-size="7">BELT</text>' +
      '<rect x="50" y="62" width="30" height="18" rx="3" fill="#f59e0b" opacity="0.8"/>' +
      '<text x="65" y="74" text-anchor="middle" fill="#1a1a2e" font-size="6" font-weight="600">ITEM</text>' +
      // Cart 2 (discharging)
      '<rect x="150" y="80" width="50" height="20" rx="3" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
      '<line x1="158" y1="85" x2="192" y2="85" stroke="#ef4444" stroke-width="2"/>' +
      // Belt arrows showing perpendicular discharge
      '<line x1="175" y1="80" x2="175" y2="55" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,2"/>' +
      '<rect x="210" y="55" width="25" height="14" rx="3" fill="#f59e0b" opacity="0.6"/>' +
      '<text x="240" y="50" fill="#ef4444" font-size="8" font-weight="600">→ CHUTE</text>' +
      '<text x="175" y="125" text-anchor="middle" fill="#64748b" font-size="8">Belt fires ⟂ to loop</text>' +
      // Travel direction
      '<text x="120" y="112" text-anchor="middle" fill="#3b82f6" font-size="8">→ Loop Direction →</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Shoe Sorter ──
  '<h3>Shoe Sorter (Sliding Shoe)</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p>Rows of small divert "shoes" (pusher blocks) slide across the conveyor surface at a diagonal, gently pushing items off the side into divert lanes. Handles larger, heavier items than tilt-tray — the standard for carton and tote sortation in retail distribution.</p>' +
    '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
    '<tr><td>Throughput</td><td>7,500–15,000 units/hr</td></tr>' +
    '<tr><td>Item Types</td><td>Cartons, boxes, totes (flat-bottom required)</td></tr>' +
    '<tr><td>Divert Angle</td><td>15°–30° typical</td></tr>' +
    '<tr><td>Key Advantage</td><td>Gentle push, handles heavier items</td></tr>' +
    '<tr><td>Capital Cost</td><td>$4M–$8M+ for complete system</td></tr></table></div>' +
    // Shoe sorter SVG
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Sliding Shoe — Top View</div>' +
    '<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Main conveyor surface (top view)
      '<rect x="20" y="40" width="260" height="70" rx="4" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>' +
      // Shoes (diagonal line of small blocks)
      '<rect x="130" y="45" width="8" height="8" rx="1" fill="#8b5cf6"/>' +
      '<rect x="140" y="53" width="8" height="8" rx="1" fill="#8b5cf6"/>' +
      '<rect x="150" y="61" width="8" height="8" rx="1" fill="#8b5cf6"/>' +
      '<rect x="160" y="69" width="8" height="8" rx="1" fill="#8b5cf6"/>' +
      '<rect x="170" y="77" width="8" height="8" rx="1" fill="#8b5cf6"/>' +
      '<rect x="180" y="85" width="8" height="8" rx="1" fill="#8b5cf6"/>' +
      '<rect x="190" y="93" width="8" height="8" rx="1" fill="#8b5cf6"/>' +
      // Item being diverted
      '<rect x="95" y="52" width="35" height="25" rx="3" fill="#f59e0b" opacity="0.8"/>' +
      '<text x="112" y="68" text-anchor="middle" fill="#1a1a2e" font-size="7" font-weight="600">BOX</text>' +
      // Divert lane
      '<rect x="200" y="95" width="80" height="30" rx="4" fill="#1e293b" stroke="#ef4444" stroke-width="1" stroke-dasharray="4,2"/>' +
      '<text x="240" y="114" text-anchor="middle" fill="#ef4444" font-size="8">DIVERT LANE</text>' +
      // Direction arrows
      '<text x="50" y="30" fill="#3b82f6" font-size="9">Travel →</text>' +
      '<text x="160" y="140" text-anchor="middle" fill="#8b5cf6" font-size="8">Shoes slide diagonally → push item off</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Bomb Bay ──
  '<h3>Bomb Bay Sorter</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p>Floor panels open beneath the conveyor to drop items into chutes below. Named for the trap-door mechanism. Space-efficient (uses vertical space instead of floor space) and very gentle for soft goods. Not suitable for heavy or rigid fragile items.</p>' +
    '<table class="wiki-spec-table"><tr><th>Spec</th><th>Value</th></tr>' +
    '<tr><td>Throughput</td><td>6,000–14,000 units/hr</td></tr>' +
    '<tr><td>Best For</td><td>Apparel, poly bags, books, flats, lightweight parcels</td></tr>' +
    '<tr><td>Key Advantage</td><td>Space-efficient, uses vertical space below</td></tr>' +
    '<tr><td>Limitation</td><td>Not for heavy/rigid/fragile items</td></tr>' +
    '<tr><td>Capital Cost</td><td>$3M–$7M (lower than crossbelt/tilt-tray)</td></tr></table></div>' +
    // Bomb bay SVG
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Bomb Bay — Side View</div>' +
    '<svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Conveyor frame
      '<rect x="20" y="40" width="260" height="8" rx="2" fill="#334155"/>' +
      // Closed panels
      '<rect x="30" y="48" width="50" height="5" rx="1" fill="#3b82f6"/>' +
      '<rect x="90" y="48" width="50" height="5" rx="1" fill="#3b82f6"/>' +
      // Open panels (bomb bay doors)
      '<line x1="150" y1="48" x2="160" y2="70" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="200" y1="48" x2="190" y2="70" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>' +
      // Item falling through
      '<rect x="165" y="72" width="20" height="14" rx="2" fill="#f59e0b" opacity="0.7" transform="rotate(5,175,79)"/>' +
      '<rect x="168" y="95" width="18" height="12" rx="2" fill="#f59e0b" opacity="0.4"/>' +
      // Chute below
      '<line x1="155" y1="55" x2="140" y2="130" stroke="#475569" stroke-width="1.5"/>' +
      '<line x1="205" y1="55" x2="220" y2="130" stroke="#475569" stroke-width="1.5"/>' +
      '<rect x="130" y="130" width="100" height="20" rx="4" fill="#1e293b" stroke="#10b981" stroke-width="1"/>' +
      '<text x="180" y="144" text-anchor="middle" fill="#10b981" font-size="8" font-weight="600">COLLECTION BIN</text>' +
      // More closed panels
      '<rect x="210" y="48" width="50" height="5" rx="1" fill="#3b82f6"/>' +
      // Item on closed section
      '<rect x="95" y="26" width="30" height="15" rx="3" fill="#f59e0b" opacity="0.8"/>' +
      // Labels
      '<text x="70" y="68" fill="#3b82f6" font-size="7">Closed</text>' +
      '<text x="175" y="60" text-anchor="middle" fill="#ef4444" font-size="7">OPEN</text>' +
      '<text x="235" y="68" fill="#3b82f6" font-size="7">Closed</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Decision Framework ──
  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">Sortation Selection Decision Framework</div>' +
  '<p style="font-size:13px;margin-bottom:12px;">Answer these questions to narrow your recommendation:</p>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;color:#334155;">' +
    '<div style="background:rgba(59,130,246,.1);padding:12px;border-radius:8px;font-size:13px;"><strong style="color:#3b82f6;">1. What are the items?</strong><br/>Soft goods/apparel → Bomb Bay or Crossbelt<br/>Flat-bottom cartons → Shoe Sorter<br/>Mixed sizes → Crossbelt<br/>Uniform small parcels → Tilt-Tray</div>' +
    '<div style="background:rgba(139,92,246,.1);padding:12px;border-radius:8px;font-size:13px;"><strong style="color:#8b5cf6;">2. What throughput?</strong><br/>&lt; 10K UPH → Tilt-Tray or Bomb Bay<br/>10K–15K UPH → Shoe Sorter<br/>15K+ UPH → Crossbelt</div>' +
    '<div style="background:rgba(245,158,11,.1);padding:12px;border-radius:8px;font-size:13px;"><strong style="color:#f59e0b;">3. Budget constraint?</strong><br/>Tightest → Bomb Bay ($3–7M)<br/>Moderate → Shoe Sorter ($4–8M)<br/>Available → Tilt-Tray ($5–10M)<br/>Premium → Crossbelt ($8–15M+)</div>' +
    '<div style="background:rgba(16,185,129,.1);padding:12px;border-radius:8px;font-size:13px;"><strong style="color:#10b981;">4. Space available?</strong><br/>Limited floor → Bomb Bay (uses vertical)<br/>Full loop space → Tilt-Tray / Crossbelt<br/>Linear layout → Shoe Sorter</div>' +
  '</div></div>' +

  // ── Comparison Matrix ──
  '<h3>Sortation Comparison Matrix</h3>' +
  '<table class="wiki-spec-table"><tr><th>System</th><th>Throughput</th><th>Best Item Type</th><th>Destinations</th><th>Capital Cost</th><th>Floor Space</th></tr>' +
  '<tr><td>Tilt-Tray</td><td>6K–14K UPH</td><td>Small parcels, flats</td><td>50–200+</td><td>$5–10M</td><td>Large (loop)</td></tr>' +
  '<tr><td>Crossbelt</td><td>Up to 25K UPH</td><td>Mixed sizes, e-commerce</td><td>100–300+</td><td>$8–15M+</td><td>Large (loop)</td></tr>' +
  '<tr><td>Shoe Sorter</td><td>7.5K–15K UPH</td><td>Cartons, totes</td><td>20–100+</td><td>$4–8M</td><td>Medium (linear)</td></tr>' +
  '<tr><td>Bomb Bay</td><td>6K–14K UPH</td><td>Soft goods, apparel</td><td>50–200+</td><td>$3–7M</td><td>Small (vertical)</td></tr></table>' +

  // ── Scenario Cards ──
  '<h3>Real-World Scenarios</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:16px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:12px;margin-bottom:8px;">E-Commerce Fulfillment</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">20K+ orders/day, mixed item sizes (electronics, apparel, books). Need 200+ destinations.</div>' +
    '<div style="color:#10b981;font-size:11px;font-weight:600;margin-top:8px;">→ Crossbelt Sorter</div></div>' +

    '<div style="background:linear-gradient(135deg,#3b1f2b 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #ef4444;">' +
    '<div style="color:#ef4444;font-weight:700;font-size:12px;margin-bottom:8px;">Apparel Returns Processing</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">High-volume poly-bagged returns, 150 store destinations. Tight floor plan.</div>' +
    '<div style="color:#10b981;font-size:11px;font-weight:600;margin-top:8px;">→ Bomb Bay Sorter</div></div>' +

    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:12px;margin-bottom:8px;">Retail Store Replenishment</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">Standard cartons (shoes, general merch), 50 store lanes, 12K UPH target.</div>' +
    '<div style="color:#10b981;font-size:11px;font-weight:600;margin-top:8px;">→ Shoe Sorter</div></div>' +

    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:12px;margin-bottom:8px;">Parcel Hub / Last-Mile Sort</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">Uniform small parcels, 8K UPH, 100+ zip-code destinations, proven reliability needed.</div>' +
    '<div style="color:#10b981;font-size:11px;font-weight:600;margin-top:8px;">→ Tilt-Tray Sorter</div></div>' +
  '</div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=8iKaq6jP8to" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Crossbelt Sorter Deep Dive</a>' +
    '<a href="https://www.youtube.com/watch?v=FakZoxSBNVU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Tilt-Tray in Action</a>' +
    '<a href="https://www.youtube.com/watch?v=qahujJ-8vdk" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Shoe Sorter Operation</a>' +
    '<a href="https://www.youtube.com/watch?v=IRwyOPO6KR4" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Bomb Bay Sorter Demo</a>' +
  '</div>' +
'</div>';

WIKI_PAGES['conveyors-design'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Conveyors / Design Fundamentals</div>' +
  '<h2>Conveyor System Design Fundamentals</h2>' +
  '<p>Designing conveyor systems requires balancing throughput targets, product characteristics, facility constraints, and budget. These fundamentals equip IES designers to validate vendor proposals and catch sizing errors before they become costly change orders.</p>' +

  // ── Throughput Calculation ──
  '<h3>Throughput Calculation</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p><strong>Unit-Load Conveyors</strong> (cartons, totes, pallets) — the most common in 3PL design:</p>' +
    '<div class="wiki-callout" style="border-left-color:#3b82f6;"><div class="wiki-callout-title" style="color:#3b82f6;">UPH Formula</div>' +
    '<div style="background:#0f172a;border-radius:6px;padding:10px 14px;margin:8px 0;"><p style="font-family:monospace;font-size:14px;color:#e2e8f0;margin:0;">UPH = (Belt Speed ÷ Item Spacing) × 60</p></div>' +
    '<p style="font-size:13px;color:#334155;margin-top:8px;">Example: 200 fpm ÷ 1 ft spacing = 200 UPM = 12,000 UPH<br/>Apply 70–90% efficiency factor for real-world conditions → <strong>8,400–10,800 effective UPH</strong></p></div>' +
    '<p><strong>Bulk Material Conveyors</strong> (less common in 3PL):</p>' +
    '<div class="wiki-callout"><div class="wiki-callout-title">TPH Formula</div>' +
    '<div style="background:#0f172a;border-radius:6px;padding:10px 14px;margin:8px 0;"><p style="font-family:monospace;font-size:14px;color:#e2e8f0;margin:0;">TPH = (Width″ × Speed fpm × Density lb/ft³) ÷ 2,000</p></div></div>' +
    '</div>' +
    // Visual throughput diagram
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Unit Spacing → Throughput</div>' +
    '<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Conveyor belt
      '<rect x="20" y="70" width="280" height="6" rx="2" fill="#334155"/>' +
      // Items with spacing markers
      '<rect x="40" y="48" width="30" height="22" rx="3" fill="#3b82f6" opacity="0.8"/>' +
      '<rect x="100" y="48" width="30" height="22" rx="3" fill="#3b82f6" opacity="0.8"/>' +
      '<rect x="160" y="48" width="30" height="22" rx="3" fill="#3b82f6" opacity="0.8"/>' +
      '<rect x="220" y="48" width="30" height="22" rx="3" fill="#3b82f6" opacity="0.8"/>' +
      // Spacing arrows
      '<line x1="70" y1="90" x2="100" y2="90" stroke="#f59e0b" stroke-width="1.5"/>' +
      '<line x1="70" y1="86" x2="70" y2="94" stroke="#f59e0b" stroke-width="1"/>' +
      '<line x1="100" y1="86" x2="100" y2="94" stroke="#f59e0b" stroke-width="1"/>' +
      '<text x="85" y="105" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="600">Spacing</text>' +
      // Speed arrow
      '<line x1="40" y1="30" x2="250" y2="30" stroke="#10b981" stroke-width="1.5" marker-end="url(#arrowG2)"/>' +
      '<text x="145" y="24" text-anchor="middle" fill="#10b981" font-size="9" font-weight="600">Belt Speed (fpm)</text>' +
      '<defs><marker id="arrowG2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0,0 8,3 0,6" fill="#10b981"/></marker></defs>' +
      // Result
      '<text x="160" y="135" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700">↓ Tighter spacing = Higher UPH ↓</text>' +
      '<text x="160" y="150" text-anchor="middle" fill="#64748b" font-size="9">Min gap = product length + 2–4 inches</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Motor Sizing ──
  '<h3>Motor Sizing</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<div class="wiki-callout" style="border-left-color:#8b5cf6;"><div class="wiki-callout-title" style="color:#8b5cf6;">Horsepower Formula</div>' +
    '<div style="background:#0f172a;border-radius:6px;padding:10px 14px;margin:8px 0;"><p style="font-family:monospace;font-size:14px;color:#e2e8f0;margin:0;">HP = (Belt Tension × Belt Speed) ÷ 33,000</p></div>' +
    '<p style="font-size:13px;color:#334155;margin-top:8px;">Belt tension = f(product weight, belt weight, friction coeff 0.4–0.8, incline angle)</p></div>' +
    '<p><strong>Best Practices for Motor Sizing:</strong></p>' +
    '<table class="wiki-spec-table"><tr><th>Rule</th><th>Application</th></tr>' +
    '<tr><td>80% Running Load</td><td>Size motor so normal operation is 80% of rated capacity</td></tr>' +
    '<tr><td>+25% Startup Torque</td><td>Additional margin for loaded startup conditions</td></tr>' +
    '<tr><td>+10–15% Accel/Decel</td><td>Losses during speed changes and zone transitions</td></tr>' +
    '<tr><td>VFD Recommended</td><td>Variable Frequency Drive allows speed tuning without motor swap</td></tr></table></div>' +
    // Motor sizing visual
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Motor Capacity Allocation</div>' +
    '<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Stacked bar
      '<rect x="60" y="20" width="160" height="30" rx="4" fill="#3b82f6"/>' +
      '<text x="140" y="39" text-anchor="middle" fill="#fff" font-size="9" font-weight="600">Normal Load — 80%</text>' +
      '<rect x="60" y="55" width="160" height="20" rx="0" fill="#8b5cf6"/>' +
      '<text x="140" y="69" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">Startup Torque — +25%</text>' +
      '<rect x="60" y="80" width="160" height="15" rx="0" fill="#f59e0b"/>' +
      '<text x="140" y="91" text-anchor="middle" fill="#1a1a2e" font-size="8" font-weight="600">Accel/Decel — +10–15%</text>' +
      '<rect x="60" y="100" width="160" height="10" rx="0 0 4 4" fill="#10b981"/>' +
      '<text x="140" y="109" text-anchor="middle" fill="#1a1a2e" font-size="7" font-weight="600">Safety Margin</text>' +
      // Bracket
      '<line x1="230" y1="20" x2="240" y2="20" stroke="#94a3b8" stroke-width="1"/>' +
      '<line x1="240" y1="20" x2="240" y2="110" stroke="#94a3b8" stroke-width="1"/>' +
      '<line x1="230" y1="110" x2="240" y2="110" stroke="#94a3b8" stroke-width="1"/>' +
      '<text x="255" y="70" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">Rated</text>' +
      '<text x="255" y="82" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">HP</text>' +
      // Warning
      '<text x="140" y="140" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="600">⚠ Undersized motors = #1 cause of conveyor downtime</text>' +
      '<text x="140" y="155" text-anchor="middle" fill="#64748b" font-size="8">Always verify vendor motor specs against loaded calculations</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Incline / Decline ──
  '<h3>Incline / Decline Considerations</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<table class="wiki-spec-table"><tr><th>Direction</th><th>Max Angle</th><th>Key Considerations</th></tr>' +
    '<tr><td>Incline (uphill)</td><td>15–30°</td><td>Anti-slip belt surface required; 50–100% more motor power; slower speeds (50–100 fpm)</td></tr>' +
    '<tr><td>Decline (downhill)</td><td>10–20°</td><td>EM braking required; speed control critical; higher product damage risk</td></tr>' +
    '<tr><td>Horizontal</td><td>N/A</td><td>Minimum friction only; lighter-duty motors adequate</td></tr></table>' +
    '<div class="wiki-callout" style="border-left-color:#ef4444;"><div class="wiki-callout-title" style="color:#ef4444;">Common Design Mistake</div>' +
    '<p style="font-size:13px;">Specifying a standard smooth belt for an incline section. Products slide back at angles above 10°. Always specify cleated or rough-top belt surfaces for inclines, and verify the motor is sized for the added gravitational load.</p></div></div>' +
    // Incline diagram
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Incline vs. Decline</div>' +
    '<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Incline section
      '<line x1="20" y1="110" x2="150" y2="50" stroke="#3b82f6" stroke-width="3"/>' +
      '<rect x="60" y="65" width="30" height="18" rx="3" fill="#f59e0b" opacity="0.8" transform="rotate(-23,75,74)"/>' +
      '<text x="85" y="30" fill="#3b82f6" font-size="9" font-weight="600">INCLINE</text>' +
      '<text x="85" y="42" fill="#64748b" font-size="7">15–30° max</text>' +
      '<text x="85" y="130" fill="#64748b" font-size="7">Anti-slip belt + extra HP</text>' +
      // Angle arc
      '<path d="M50,110 A30,30 0 0,1 66,96" fill="none" stroke="#f59e0b" stroke-width="1"/>' +
      '<text x="62" y="115" fill="#f59e0b" font-size="8">θ</text>' +
      // Decline section
      '<line x1="180" y1="50" x2="300" y2="110" stroke="#ef4444" stroke-width="3"/>' +
      '<rect x="220" y="68" width="30" height="18" rx="3" fill="#f59e0b" opacity="0.8" transform="rotate(23,235,77)"/>' +
      '<text x="240" y="30" fill="#ef4444" font-size="9" font-weight="600">DECLINE</text>' +
      '<text x="240" y="42" fill="#64748b" font-size="7">10–20° max</text>' +
      '<text x="240" y="130" fill="#64748b" font-size="7">EM braking required</text>' +
      // Gravity arrows
      '<line x1="75" y1="80" x2="75" y2="100" stroke="#10b981" stroke-width="1" marker-end="url(#arrowG3)"/>' +
      '<line x1="235" y1="80" x2="235" y2="100" stroke="#10b981" stroke-width="1" marker-end="url(#arrowG3)"/>' +
      '<text x="160" y="95" text-anchor="middle" fill="#10b981" font-size="7">gravity</text>' +
      '<defs><marker id="arrowG3" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0,0 6,2.5 0,5" fill="#10b981"/></marker></defs>' +
    '</svg></div>' +
  '</div>' +

  // ── G2P + Conveyor Integration Workflow ──
  '<h3>Integration with Robotics</h3>' +
  '<div style="margin:20px 0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px;padding:24px 20px;">' +
  '<div style="text-align:center;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Typical G2P + Conveyor Hybrid Workflow</div>' +
  '<svg viewBox="0 0 750 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:750px;display:block;margin:0 auto;">' +
    // Step boxes
    '<rect x="5" y="20" width="120" height="60" rx="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>' +
    '<text x="65" y="45" text-anchor="middle" fill="#8b5cf6" font-size="9" font-weight="700">G2P Robot</text>' +
    '<text x="65" y="58" text-anchor="middle" fill="#94a3b8" font-size="7">Delivers tote to</text>' +
    '<text x="65" y="68" text-anchor="middle" fill="#94a3b8" font-size="7">pick station</text>' +
    '<line x1="130" y1="50" x2="155" y2="50" stroke="#475569" stroke-width="1.5" marker-end="url(#arrowG4)"/>' +

    '<rect x="160" y="20" width="120" height="60" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>' +
    '<text x="220" y="45" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="700">Pick Station</text>' +
    '<text x="220" y="58" text-anchor="middle" fill="#94a3b8" font-size="7">Picker fills tote,</text>' +
    '<text x="220" y="68" text-anchor="middle" fill="#94a3b8" font-size="7">places on conveyor</text>' +
    '<line x1="285" y1="50" x2="310" y2="50" stroke="#475569" stroke-width="1.5" marker-end="url(#arrowG4)"/>' +

    '<rect x="315" y="20" width="120" height="60" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>' +
    '<text x="375" y="45" text-anchor="middle" fill="#3b82f6" font-size="9" font-weight="700">Transport Conv.</text>' +
    '<text x="375" y="58" text-anchor="middle" fill="#94a3b8" font-size="7">Moves to pack</text>' +
    '<text x="375" y="68" text-anchor="middle" fill="#94a3b8" font-size="7">station</text>' +
    '<line x1="440" y1="50" x2="465" y2="50" stroke="#475569" stroke-width="1.5" marker-end="url(#arrowG4)"/>' +

    '<rect x="470" y="20" width="120" height="60" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>' +
    '<text x="530" y="45" text-anchor="middle" fill="#10b981" font-size="9" font-weight="700">Pack Station</text>' +
    '<text x="530" y="58" text-anchor="middle" fill="#94a3b8" font-size="7">Auto-notified of</text>' +
    '<text x="530" y="68" text-anchor="middle" fill="#94a3b8" font-size="7">incoming order</text>' +
    '<line x1="595" y1="50" x2="620" y2="50" stroke="#475569" stroke-width="1.5" marker-end="url(#arrowG4)"/>' +

    '<rect x="625" y="20" width="120" height="60" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
    '<text x="685" y="45" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="700">Sortation</text>' +
    '<text x="685" y="58" text-anchor="middle" fill="#94a3b8" font-size="7">Routes to shipping</text>' +
    '<text x="685" y="68" text-anchor="middle" fill="#94a3b8" font-size="7">lane</text>' +

    '<defs><marker id="arrowG4" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0,0 8,3 0,6" fill="#475569"/></marker></defs>' +
  '</svg>' +
  '<div style="text-align:center;color:#475569;font-size:9px;margin-top:12px;">WCS coordinates all handoffs • Sensors confirm each transfer • PLC logic manages zone speeds</div>' +
  '</div>' +

  // ── Design Checklist ──
  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">IES Designer Checklist — Conveyor Design Review</div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;font-size:12px;">' +
    '<div style="background:rgba(59,130,246,.1);padding:12px;border-radius:8px;"><strong style="color:#3b82f6;">Throughput</strong><br/>☐ UPH target confirmed with client<br/>☐ Efficiency factor applied (70–90%)<br/>☐ Peak vs. sustained rates specified</div>' +
    '<div style="background:rgba(139,92,246,.1);padding:12px;border-radius:8px;"><strong style="color:#8b5cf6;">Motors</strong><br/>☐ HP calc includes loaded startup<br/>☐ VFDs specified for speed flexibility<br/>☐ Running at ≤80% rated capacity</div>' +
    '<div style="background:rgba(245,158,11,.1);padding:12px;border-radius:8px;"><strong style="color:#f59e0b;">Layout</strong><br/>☐ Inclines have anti-slip belts<br/>☐ Declines have EM braking<br/>☐ Accumulation zones sized for peak</div>' +
    '<div style="background:rgba(16,185,129,.1);padding:12px;border-radius:8px;"><strong style="color:#10b981;">Integration</strong><br/>☐ WCS handoff points identified<br/>☐ Sensor confirmation at each transfer<br/>☐ Robot-conveyor speed matching verified</div>' +
  '</div></div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=-SPz9F-BYWU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Conveyor Design Basics</a>' +
    '<a href="https://www.youtube.com/watch?v=0OeStxbzKsM" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Motor Sizing Explained</a>' +
    '<a href="https://www.youtube.com/watch?v=eyTkJtyqFUs" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> WCS Integration Deep Dive</a>' +
  '</div>' +
'</div>';

WIKI_PAGES['conveyors-maintenance'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Conveyors / Maintenance</div>' +
  '<h2>Conveyor Maintenance Guide</h2>' +
  '<p>Maintenance planning directly impacts total cost of ownership — a factor IES designers must account for when building business cases. Clients often underestimate maintenance burden, leading to unexpected downtime and cost overruns. This guide arms you with the benchmarks and frameworks to set realistic expectations.</p>' +

  // ── PM Schedule with visual timeline ──
  '<h3>Preventive Maintenance Schedule</h3>' +
  '<div style="margin:20px 0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px;padding:24px 20px;">' +
  '<div style="text-align:center;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">PM Frequency Timeline</div>' +
  '<svg viewBox="0 0 700 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;display:block;margin:0 auto;">' +
    // Timeline bar
    '<rect x="50" y="55" width="600" height="6" rx="3" fill="#334155"/>' +
    // Daily
    '<circle cx="100" cy="58" r="14" fill="#3b82f6"/>' +
    '<text x="100" y="62" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">D</text>' +
    '<text x="100" y="30" text-anchor="middle" fill="#3b82f6" font-size="9" font-weight="600">Daily</text>' +
    '<text x="100" y="90" text-anchor="middle" fill="#64748b" font-size="7">Visual inspect</text>' +
    '<text x="100" y="100" text-anchor="middle" fill="#64748b" font-size="7">Listen for noise</text>' +
    '<text x="100" y="110" text-anchor="middle" fill="#64748b" font-size="7">Belt alignment</text>' +
    // Weekly
    '<circle cx="230" cy="58" r="14" fill="#8b5cf6"/>' +
    '<text x="230" y="62" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">W</text>' +
    '<text x="230" y="30" text-anchor="middle" fill="#8b5cf6" font-size="9" font-weight="600">Weekly</text>' +
    '<text x="230" y="90" text-anchor="middle" fill="#64748b" font-size="7">Lubricate bearings</text>' +
    '<text x="230" y="100" text-anchor="middle" fill="#64748b" font-size="7">Clean surfaces</text>' +
    '<text x="230" y="110" text-anchor="middle" fill="#64748b" font-size="7">Sensor check</text>' +
    // Monthly
    '<circle cx="370" cy="58" r="14" fill="#f59e0b"/>' +
    '<text x="370" y="62" text-anchor="middle" fill="#1a1a2e" font-size="8" font-weight="700">M</text>' +
    '<text x="370" y="30" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="600">Monthly</text>' +
    '<text x="370" y="90" text-anchor="middle" fill="#64748b" font-size="7">Full belt inspect</text>' +
    '<text x="370" y="100" text-anchor="middle" fill="#64748b" font-size="7">Motor performance</text>' +
    '<text x="370" y="110" text-anchor="middle" fill="#64748b" font-size="7">Safety guards</text>' +
    // Quarterly
    '<circle cx="500" cy="58" r="14" fill="#ef4444"/>' +
    '<text x="500" y="62" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">Q</text>' +
    '<text x="500" y="30" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="600">Quarterly</text>' +
    '<text x="500" y="90" text-anchor="middle" fill="#64748b" font-size="7">Pro alignment</text>' +
    '<text x="500" y="100" text-anchor="middle" fill="#64748b" font-size="7">Vibration analysis</text>' +
    '<text x="500" y="110" text-anchor="middle" fill="#64748b" font-size="7">Safety audit</text>' +
    // Annual
    '<circle cx="610" cy="58" r="14" fill="#10b981"/>' +
    '<text x="610" y="62" text-anchor="middle" fill="#1a1a2e" font-size="8" font-weight="700">A</text>' +
    '<text x="610" y="30" text-anchor="middle" fill="#10b981" font-size="9" font-weight="600">Annual</text>' +
    '<text x="610" y="90" text-anchor="middle" fill="#64748b" font-size="7">Full evaluation</text>' +
    '<text x="610" y="100" text-anchor="middle" fill="#64748b" font-size="7">Motor overhaul</text>' +
    '<text x="610" y="110" text-anchor="middle" fill="#64748b" font-size="7">Replace wear items</text>' +
  '</svg></div>' +

  // ── Failure Modes with severity indicators ──
  '<h3>Common Failure Modes</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin:16px 0;">' +

    '<div style="background:linear-gradient(135deg,#3b1f2b 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #ef4444;">' +
    '<div style="color:#ef4444;font-weight:700;font-size:13px;margin-bottom:6px;">Belt Slip</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;"><strong style="color:#f59e0b;">Cause:</strong> Low tension, wet/oily surface<br/><strong style="color:#10b981;">Prevention:</strong> Regular tension checks, keep surfaces clean<br/><strong style="color:#ef4444;">Impact:</strong> Throughput drop, product pile-ups</div></div>' +

    '<div style="background:linear-gradient(135deg,#3b1f2b 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #ef4444;">' +
    '<div style="color:#ef4444;font-weight:700;font-size:13px;margin-bottom:6px;">Motor Burnout</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;"><strong style="color:#f59e0b;">Cause:</strong> Overload, inadequate cooling<br/><strong style="color:#10b981;">Prevention:</strong> Monitor current draw, ensure ventilation<br/><strong style="color:#ef4444;">Impact:</strong> Full line stoppage, days to replace</div></div>' +

    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:13px;margin-bottom:6px;">Bearing Failure</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;"><strong style="color:#f59e0b;">Cause:</strong> Lack of lubrication, contamination<br/><strong style="color:#10b981;">Prevention:</strong> Regular greasing, seal inspection<br/><strong style="color:#ef4444;">Impact:</strong> Noise → heat → seizure</div></div>' +

    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:13px;margin-bottom:6px;">Belt Wear</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;"><strong style="color:#f59e0b;">Cause:</strong> Misalignment, debris, overload<br/><strong style="color:#10b981;">Prevention:</strong> Alignment inspection, conveyor sweeps<br/><strong style="color:#ef4444;">Impact:</strong> Gradual degradation → belt failure</div></div>' +

    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:13px;margin-bottom:6px;">Sensor Failure</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;"><strong style="color:#f59e0b;">Cause:</strong> Misalignment, dirty optics<br/><strong style="color:#10b981;">Prevention:</strong> Clean optics, realign quarterly<br/><strong style="color:#ef4444;">Impact:</strong> Missed diverts, recirculation loops</div></div>' +

    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:13px;margin-bottom:6px;">Product Jams</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;"><strong style="color:#f59e0b;">Cause:</strong> Debris, product overlap, sizing errors<br/><strong style="color:#10b981;">Prevention:</strong> Guards, overflow sensors, proper gapping<br/><strong style="color:#ef4444;">Impact:</strong> Manual clearing → labor + downtime</div></div>' +

  '</div>' +

  // ── Cost Benchmarks ──
  '<h3>Maintenance Cost Benchmarks</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<table class="wiki-spec-table"><tr><th>Cost Category</th><th>Benchmark</th></tr>' +
    '<tr><td>Preventive Maintenance</td><td>2–5% of equipment cost / year</td></tr>' +
    '<tr><td>Spare Parts Inventory</td><td>3–5% of total conveyor cost</td></tr>' +
    '<tr><td>Maintenance Labor</td><td>0.5–1.5 techs per 10K sq ft conveyor</td></tr>' +
    '<tr><td>Unplanned Downtime Cost</td><td>$5K–$25K+ per hour (varies by facility)</td></tr>' +
    '<tr><td>Belt Replacement Cycle</td><td>3–7 years (depends on load and environment)</td></tr></table>' +
    '<div class="wiki-callout" style="border-left-color:#10b981;"><div class="wiki-callout-title" style="color:#10b981;">ROI of PM Programs</div>' +
    '<p style="font-size:13px;">Facilities with structured PM programs see 25–40% less unplanned downtime and 15–20% longer equipment lifespan. When building a client business case, include PM costs from day one — surprises here erode trust faster than anything else.</p></div></div>' +
    // Cost impact visual
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Reactive vs. Preventive Cost Impact</div>' +
    '<svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      // Reactive bar
      '<rect x="40" y="30" width="80" height="100" rx="6" fill="#ef4444" opacity="0.8"/>' +
      '<text x="80" y="75" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">5–10×</text>' +
      '<text x="80" y="90" text-anchor="middle" fill="#fff" font-size="8">higher cost</text>' +
      '<text x="80" y="145" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="600">Reactive</text>' +
      '<text x="80" y="156" text-anchor="middle" fill="#64748b" font-size="7">(fix when broken)</text>' +
      // Preventive bar
      '<rect x="160" y="100" width="80" height="30" rx="6" fill="#10b981" opacity="0.8"/>' +
      '<text x="200" y="120" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">1×</text>' +
      '<text x="200" y="145" text-anchor="middle" fill="#10b981" font-size="9" font-weight="600">Preventive</text>' +
      '<text x="200" y="156" text-anchor="middle" fill="#64748b" font-size="7">(scheduled PM)</text>' +
      // Baseline
      '<line x1="30" y1="132" x2="250" y2="132" stroke="#334155" stroke-width="1"/>' +
    '</svg></div>' +
  '</div>' +

  // ── IES Designer Callout ──
  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">What IES Designers Need to Know</div>' +
  '<p style="font-size:13px;">When scoping automation for a client, always include maintenance planning in the proposal:</p>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;font-size:12px;">' +
    '<div style="background:rgba(59,130,246,.1);padding:12px;border-radius:8px;"><strong style="color:#3b82f6;">In the Business Case</strong><br/>Include annual PM cost (2–5% of equipment), spare parts budget, and maintenance FTE requirements. Clients who plan for this upfront have 3× higher satisfaction.</div>' +
    '<div style="background:rgba(245,158,11,.1);padding:12px;border-radius:8px;"><strong style="color:#f59e0b;">In Vendor Evaluation</strong><br/>Ask vendors about MTBF (Mean Time Between Failures), recommended PM schedules, spare parts lead times, and whether they offer service contracts.</div>' +
  '</div></div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=8iKaq6jP8to" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Conveyor PM Best Practices</a>' +
    '<a href="https://www.youtube.com/watch?v=FakZoxSBNVU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Belt Tracking & Alignment</a>' +
    '<a href="https://www.youtube.com/watch?v=-SPz9F-BYWU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Automation Maintenance Planning</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// WAREHOUSE DESIGN & SIZING
// ═══════════════════════════════════════════════════
WIKI_PAGES['wh-design'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Warehouse Design</div>' +
  '<h2>Warehouse Design & Sizing</h2>' +
  '<p>Facility design is the foundation of every IES solution. Whether responding to an RFP or proactively scoping an opportunity, designers must translate throughput requirements into a physical footprint — balancing clear height, dock capacity, column spacing, and operational zones. Getting this wrong means rework, client frustration, and margin erosion.</p>' +

  // ── Facility Layout SVG ──
  '<div style="margin:24px 0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px;padding:28px 20px;">' +
  '<div style="text-align:center;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Typical Warehouse Zone Layout</div>' +
  '<svg viewBox="0 0 760 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:760px;display:block;margin:0 auto;">' +
    // Building outline
    '<rect x="20" y="20" width="720" height="280" rx="6" fill="none" stroke="#334155" stroke-width="2"/>' +
    // Dock doors (top = inbound)
    '<rect x="60" y="14" width="200" height="14" rx="3" fill="#3b82f6" opacity="0.6"/>' +
    '<text x="160" y="10" text-anchor="middle" fill="#3b82f6" font-size="9" font-weight="600">INBOUND DOCKS (12–20 doors)</text>' +
    // Dock doors (bottom = outbound)
    '<rect x="460" y="292" width="240" height="14" rx="3" fill="#ef4444" opacity="0.6"/>' +
    '<text x="580" y="320" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="600">OUTBOUND DOCKS (16–30 doors)</text>' +
    // Receiving zone
    '<rect x="40" y="40" width="200" height="70" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>' +
    '<text x="140" y="70" text-anchor="middle" fill="#3b82f6" font-size="11" font-weight="700">RECEIVING</text>' +
    '<text x="140" y="86" text-anchor="middle" fill="#64748b" font-size="8">QC, putaway staging</text>' +
    '<text x="140" y="98" text-anchor="middle" fill="#64748b" font-size="8">~10–15% of floor</text>' +
    // Storage zone
    '<rect x="40" y="125" width="320" height="90" rx="6" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>' +
    '<text x="200" y="160" text-anchor="middle" fill="#8b5cf6" font-size="12" font-weight="700">BULK STORAGE</text>' +
    '<text x="200" y="178" text-anchor="middle" fill="#64748b" font-size="8">Racking, bulk floor, VNA — 40–55% of floor</text>' +
    '<text x="200" y="192" text-anchor="middle" fill="#64748b" font-size="8">Clear height: 32–40 ft modern spec</text>' +
    // Pick / Pack
    '<rect x="380" y="40" width="170" height="100" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>' +
    '<text x="465" y="75" text-anchor="middle" fill="#f59e0b" font-size="11" font-weight="700">PICK & PACK</text>' +
    '<text x="465" y="93" text-anchor="middle" fill="#64748b" font-size="8">Workstations, conveyors</text>' +
    '<text x="465" y="105" text-anchor="middle" fill="#64748b" font-size="8">~15–25% of floor</text>' +
    // VAS
    '<rect x="570" y="40" width="150" height="100" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>' +
    '<text x="645" y="75" text-anchor="middle" fill="#10b981" font-size="11" font-weight="700">VAS</text>' +
    '<text x="645" y="93" text-anchor="middle" fill="#64748b" font-size="8">Kitting, labeling,</text>' +
    '<text x="645" y="105" text-anchor="middle" fill="#64748b" font-size="8">returns processing</text>' +
    // Sortation / Shipping
    '<rect x="380" y="155" width="340" height="60" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
    '<text x="550" y="182" text-anchor="middle" fill="#ef4444" font-size="11" font-weight="700">SORTATION & SHIPPING</text>' +
    '<text x="550" y="198" text-anchor="middle" fill="#64748b" font-size="8">Sort lanes, staging, manifest — 10–15% of floor</text>' +
    // Office / Mezzanine
    '<rect x="40" y="230" width="160" height="55" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>' +
    '<text x="120" y="255" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">OFFICE / MEZZ</text>' +
    '<text x="120" y="270" text-anchor="middle" fill="#64748b" font-size="8">IT, breakroom, mgmt</text>' +
    // Charging / Maintenance
    '<rect x="220" y="230" width="140" height="55" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>' +
    '<text x="290" y="255" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">MHE / CHARGING</text>' +
    '<text x="290" y="270" text-anchor="middle" fill="#64748b" font-size="8">Forklift, battery</text>' +
    // Yard
    '<rect x="380" y="230" width="340" height="55" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>' +
    '<text x="550" y="255" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">YARD / TRAILER STAGING</text>' +
    '<text x="550" y="270" text-anchor="middle" fill="#64748b" font-size="8">Drop trailers, container staging</text>' +
    // Flow arrows
    '<line x1="140" y1="112" x2="140" y2="122" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#whArrow)"/>' +
    '<line x1="250" y1="170" x2="375" y2="170" stroke="#8b5cf6" stroke-width="1.5" marker-end="url(#whArrow)"/>' +
    '<line x1="465" y1="142" x2="465" y2="152" stroke="#f59e0b" stroke-width="1.5" marker-end="url(#whArrow)"/>' +
    '<defs><marker id="whArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0,0 8,3 0,6" fill="#94a3b8"/></marker></defs>' +
  '</svg></div>' +

  // ── Key Dimensions Table ──
  '<h3>Critical Building Specifications</h3>' +
  '<table class="wiki-spec-table"><tr><th>Dimension</th><th>Modern Class A Spec</th><th>Why It Matters</th></tr>' +
  '<tr><td>Clear Height</td><td>32–40 ft</td><td>More vertical storage = smaller footprint; each +4 ft ≈ 15–20% more pallet positions</td></tr>' +
  '<tr><td>Column Spacing</td><td>50×52 ft or 56×60 ft</td><td>Wider spacing = more flexible racking layout; fewer dead zones</td></tr>' +
  '<tr><td>Floor Slab</td><td>6–8" reinforced, FF/FL 50/30+</td><td>Flatness critical for VNA turret trucks and AS/RS systems</td></tr>' +
  '<tr><td>Dock Doors</td><td>1 per 5,000–10,000 sq ft</td><td>Ratio depends on throughput velocity; e-commerce needs more doors</td></tr>' +
  '<tr><td>Truck Courts</td><td>120–135 ft depth</td><td>Full trailer turning radius; 185 ft for double-loaded yards</td></tr>' +
  '<tr><td>Sprinkler (ESFR)</td><td>Required for 28 ft+ rack</td><td>In-rack sprinklers add $2–4/sq ft but required by code above thresholds</td></tr>' +
  '<tr><td>Power</td><td>2,000–4,000 amps</td><td>Automation + MHE charging can require 3× standard warehouse power</td></tr></table>' +

  // ── Sizing Methodology ──
  '<h3>Sizing Methodology</h3>' +
  '<div style="margin:20px 0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px;padding:24px 20px;">' +
  '<div style="text-align:center;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">IES Sizing Workflow</div>' +
  '<svg viewBox="0 0 750 90" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:750px;display:block;margin:0 auto;">' +
    '<rect x="5" y="15" width="130" height="60" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>' +
    '<text x="70" y="40" text-anchor="middle" fill="#3b82f6" font-size="9" font-weight="700">1. THROUGHPUT</text>' +
    '<text x="70" y="54" text-anchor="middle" fill="#94a3b8" font-size="7">Units/day, lines/hr,</text>' +
    '<text x="70" y="64" text-anchor="middle" fill="#94a3b8" font-size="7">peak multiplier</text>' +
    '<line x1="140" y1="45" x2="158" y2="45" stroke="#475569" stroke-width="1.5" marker-end="url(#whA2)"/>' +
    '<rect x="162" y="15" width="130" height="60" rx="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>' +
    '<text x="227" y="40" text-anchor="middle" fill="#8b5cf6" font-size="9" font-weight="700">2. STORAGE</text>' +
    '<text x="227" y="54" text-anchor="middle" fill="#94a3b8" font-size="7">SKU count, cube,</text>' +
    '<text x="227" y="64" text-anchor="middle" fill="#94a3b8" font-size="7">days of supply</text>' +
    '<line x1="297" y1="45" x2="315" y2="45" stroke="#475569" stroke-width="1.5" marker-end="url(#whA2)"/>' +
    '<rect x="319" y="15" width="130" height="60" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>' +
    '<text x="384" y="40" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="700">3. LABOR MODEL</text>' +
    '<text x="384" y="54" text-anchor="middle" fill="#94a3b8" font-size="7">Headcount, shifts,</text>' +
    '<text x="384" y="64" text-anchor="middle" fill="#94a3b8" font-size="7">productivity rates</text>' +
    '<line x1="454" y1="45" x2="472" y2="45" stroke="#475569" stroke-width="1.5" marker-end="url(#whA2)"/>' +
    '<rect x="476" y="15" width="130" height="60" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>' +
    '<text x="541" y="40" text-anchor="middle" fill="#10b981" font-size="9" font-weight="700">4. LAYOUT</text>' +
    '<text x="541" y="54" text-anchor="middle" fill="#94a3b8" font-size="7">Zone allocation,</text>' +
    '<text x="541" y="64" text-anchor="middle" fill="#94a3b8" font-size="7">flow optimization</text>' +
    '<line x1="611" y1="45" x2="629" y2="45" stroke="#475569" stroke-width="1.5" marker-end="url(#whA2)"/>' +
    '<rect x="633" y="15" width="110" height="60" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
    '<text x="688" y="40" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="700">5. VALIDATE</text>' +
    '<text x="688" y="54" text-anchor="middle" fill="#94a3b8" font-size="7">Sim model, cost</text>' +
    '<text x="688" y="64" text-anchor="middle" fill="#94a3b8" font-size="7">per unit check</text>' +
    '<defs><marker id="whA2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0,0 8,3 0,6" fill="#475569"/></marker></defs>' +
  '</svg></div>' +

  // ── Storage Calculation ──
  '<div class="wiki-callout" style="border-left-color:#8b5cf6;"><div class="wiki-callout-title" style="color:#8b5cf6;">Quick Storage Sizing Formula</div>' +
  '<div style="background:#0f172a;border-radius:6px;padding:10px 14px;margin:8px 0;"><p style="font-family:monospace;font-size:14px;color:#e2e8f0;margin:0;">Pallet Positions = (Avg Inventory in Pallets × Safety Stock Factor) ÷ Storage Utilization</p></div>' +
  '<p style="font-size:13px;color:#334155;margin-top:8px;">Example: 8,000 avg pallets × 1.25 safety × ÷ 0.85 utilization = <strong>11,765 positions needed</strong><br/>At 2 pallets/rack-bay × 5 levels = 10 positions/bay → 1,177 bays → ~180,000 sq ft racking zone</p></div>' +

  // ── Decision Framework ──
  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">Design Decision Framework</div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;font-size:13px;color:#334155;">' +
    '<div style="background:rgba(59,130,246,.1);padding:12px;border-radius:8px;"><strong style="color:#3b82f6;">E-Commerce / DTC</strong><br/>High dock ratio, large pick/pack zone (30%+), sortation critical, consider mezzanine for pick modules</div>' +
    '<div style="background:rgba(139,92,246,.1);padding:12px;border-radius:8px;"><strong style="color:#8b5cf6;">Retail Replenishment</strong><br/>High-cube bulk storage, cross-dock capability, case-pick focus, fewer VAS requirements</div>' +
    '<div style="background:rgba(245,158,11,.1);padding:12px;border-radius:8px;"><strong style="color:#f59e0b;">Cold Chain / Food</strong><br/>Insulated panels, multi-temp zones, shorter clear height (28 ft max), higher power for refrigeration</div>' +
    '<div style="background:rgba(16,185,129,.1);padding:12px;border-radius:8px;"><strong style="color:#10b981;">Returns / Reverse</strong><br/>Large VAS area (25%+), QC stations, flexible storage, lower clear height acceptable</div>' +
  '</div></div>' +

  // ── Scenario Cards ──
  '<h3>Sizing Scenarios</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:16px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:12px;margin-bottom:8px;">Small E-Comm Startup</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">2,000 orders/day, 5,000 SKUs, each-pick<br/>Peak: 2.5× during Q4</div>' +
    '<div style="color:#10b981;font-size:11px;font-weight:600;margin-top:8px;">→ 80–120K sq ft, 32 ft clear, 12 docks</div></div>' +
    '<div style="background:linear-gradient(135deg,#3b1f2b 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #ef4444;">' +
    '<div style="color:#ef4444;font-weight:700;font-size:12px;margin-bottom:8px;">National Retail DC</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">50,000 cases/day, 15,000 SKUs, case-pick + pallet<br/>Steady volume, slight holiday bump</div>' +
    '<div style="color:#10b981;font-size:11px;font-weight:600;margin-top:8px;">→ 500K–800K sq ft, 36 ft clear, 80+ docks</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:12px;margin-bottom:8px;">Multi-Client 3PL</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">4–6 clients sharing space, mixed profiles<br/>Need flexible zoning, shared sortation</div>' +
    '<div style="color:#10b981;font-size:11px;font-weight:600;margin-top:8px;">→ 250–400K sq ft, 36 ft, modular racking</div></div>' +
  '</div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=-SPz9F-BYWU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Warehouse Layout Fundamentals</a>' +
    '<a href="https://www.youtube.com/watch?v=0OeStxbzKsM" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Clear Height & Racking</a>' +
    '<a href="https://www.youtube.com/watch?v=oHmlktFOguI" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Sizing for 3PL Operations</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// MOST WORK MEASUREMENT
// ═══════════════════════════════════════════════════
WIKI_PAGES['most-overview'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Engineering / MOST Work Measurement</div>' +
  '<h2>MOST Work Measurement</h2>' +
  '<p>Maynard Operation Sequence Technique (MOST) is the industry-standard method for establishing engineered labor standards in warehouse operations. IES designers use MOST-based standards to build accurate labor models, validate client productivity claims, and scope automation ROI. If you cannot quantify how long a task takes, you cannot price it — and you cannot improve it.</p>' +

  // ── MOST Sequence Model SVG ──
  '<div style="margin:24px 0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px;padding:28px 20px;">' +
  '<div style="text-align:center;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">MOST General Move Sequence</div>' +
  '<svg viewBox="0 0 750 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:750px;display:block;margin:0 auto;">' +
    '<rect x="5" y="25" width="100" height="60" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>' +
    '<text x="55" y="48" text-anchor="middle" fill="#3b82f6" font-size="20" font-weight="800">A</text>' +
    '<text x="55" y="65" text-anchor="middle" fill="#94a3b8" font-size="8">Action Distance</text>' +
    '<text x="55" y="75" text-anchor="middle" fill="#64748b" font-size="7">(walk/reach)</text>' +
    '<line x1="110" y1="55" x2="125" y2="55" stroke="#475569" stroke-width="1.5"/>' +

    '<rect x="130" y="25" width="100" height="60" rx="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>' +
    '<text x="180" y="48" text-anchor="middle" fill="#8b5cf6" font-size="20" font-weight="800">B</text>' +
    '<text x="180" y="65" text-anchor="middle" fill="#94a3b8" font-size="8">Body Motion</text>' +
    '<text x="180" y="75" text-anchor="middle" fill="#64748b" font-size="7">(bend/stoop)</text>' +
    '<line x1="235" y1="55" x2="250" y2="55" stroke="#475569" stroke-width="1.5"/>' +

    '<rect x="255" y="25" width="100" height="60" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>' +
    '<text x="305" y="48" text-anchor="middle" fill="#f59e0b" font-size="20" font-weight="800">G</text>' +
    '<text x="305" y="65" text-anchor="middle" fill="#94a3b8" font-size="8">Gain Control</text>' +
    '<text x="305" y="75" text-anchor="middle" fill="#64748b" font-size="7">(grasp item)</text>' +
    '<line x1="360" y1="55" x2="375" y2="55" stroke="#475569" stroke-width="1.5"/>' +

    '<rect x="380" y="25" width="100" height="60" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>' +
    '<text x="430" y="48" text-anchor="middle" fill="#3b82f6" font-size="20" font-weight="800">A</text>' +
    '<text x="430" y="65" text-anchor="middle" fill="#94a3b8" font-size="8">Action Distance</text>' +
    '<text x="430" y="75" text-anchor="middle" fill="#64748b" font-size="7">(move to dest)</text>' +
    '<line x1="485" y1="55" x2="500" y2="55" stroke="#475569" stroke-width="1.5"/>' +

    '<rect x="505" y="25" width="100" height="60" rx="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>' +
    '<text x="555" y="48" text-anchor="middle" fill="#8b5cf6" font-size="20" font-weight="800">B</text>' +
    '<text x="555" y="65" text-anchor="middle" fill="#94a3b8" font-size="8">Body Motion</text>' +
    '<text x="555" y="75" text-anchor="middle" fill="#64748b" font-size="7">(place height)</text>' +
    '<line x1="610" y1="55" x2="625" y2="55" stroke="#475569" stroke-width="1.5"/>' +

    '<rect x="630" y="25" width="100" height="60" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
    '<text x="680" y="48" text-anchor="middle" fill="#ef4444" font-size="20" font-weight="800">P</text>' +
    '<text x="680" y="65" text-anchor="middle" fill="#94a3b8" font-size="8">Placement</text>' +
    '<text x="680" y="75" text-anchor="middle" fill="#64748b" font-size="7">(position/align)</text>' +

    '<text x="375" y="110" text-anchor="middle" fill="#475569" font-size="9">General Move: A  B  G  A  B  P  A — each parameter gets an index value → TMUs</text>' +
  '</svg></div>' +

  // ── TMU Basics ──
  '<h3>Understanding TMUs</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<p>MOST measures time in <strong>Time Measurement Units (TMUs)</strong>. One TMU = 0.00001 hours = 0.036 seconds. MOST index values map directly to TMU counts.</p>' +
    '<table class="wiki-spec-table"><tr><th>TMUs</th><th>Seconds</th><th>Minutes</th><th>Example Activity</th></tr>' +
    '<tr><td>10</td><td>0.36</td><td>0.006</td><td>Simple reach (6–12 inches)</td></tr>' +
    '<tr><td>100</td><td>3.6</td><td>0.06</td><td>Walk 3–4 steps, pick item</td></tr>' +
    '<tr><td>1,000</td><td>36</td><td>0.6</td><td>Walk to location, pick, return, place</td></tr>' +
    '<tr><td>10,000</td><td>360</td><td>6.0</td><td>Full order pick cycle (multi-line)</td></tr></table></div>' +
    // TMU conversion visual
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">MOST Index → TMU Conversion</div>' +
    '<svg viewBox="0 0 280 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      '<text x="140" y="25" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700">Index × 10 = TMUs</text>' +
      '<rect x="40" y="40" width="200" height="40" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>' +
      '<text x="80" y="63" text-anchor="middle" fill="#3b82f6" font-size="14" font-weight="800">A₆</text>' +
      '<text x="140" y="63" text-anchor="middle" fill="#94a3b8" font-size="12">→</text>' +
      '<text x="195" y="63" text-anchor="middle" fill="#f59e0b" font-size="14" font-weight="800">60 TMU</text>' +
      '<rect x="40" y="90" width="200" height="40" rx="6" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>' +
      '<text x="80" y="113" text-anchor="middle" fill="#8b5cf6" font-size="14" font-weight="800">B₃</text>' +
      '<text x="140" y="113" text-anchor="middle" fill="#94a3b8" font-size="12">→</text>' +
      '<text x="195" y="113" text-anchor="middle" fill="#f59e0b" font-size="14" font-weight="800">30 TMU</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Three Sequence Models ──
  '<h3>The Three MOST Sequence Models</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:16px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">General Move</div>' +
    '<div style="font-family:monospace;color:#e2e8f0;font-size:12px;margin-bottom:8px;">A B G A B P A</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">Object moved freely through space. Covers 85%+ of warehouse activities: walking, picking, placing, carrying.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3b1f2b 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #ef4444;">' +
    '<div style="color:#ef4444;font-weight:700;font-size:14px;margin-bottom:8px;">Controlled Move</div>' +
    '<div style="font-family:monospace;color:#e2e8f0;font-size:12px;margin-bottom:8px;">A B G M X I A</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">Object remains in contact with surface or attached to another object. Pushing carts, cranking handles, operating levers.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">Tool Use</div>' +
    '<div style="font-family:monospace;color:#e2e8f0;font-size:12px;margin-bottom:8px;">A B G A B P _ A B P A</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.5;">Covers fastening, cutting, surface treat, measuring, recording, thinking. Includes scanning, labeling, taping.</div></div>' +
  '</div>' +

  // ── Warehouse Application ──
  '<h3>MOST in Warehouse Operations</h3>' +
  '<table class="wiki-spec-table"><tr><th>Operation</th><th>Typical Standard (UPH)</th><th>Key MOST Drivers</th><th>Improvement Levers</th></tr>' +
  '<tr><td>Each-Pick (shelf)</td><td>80–150 lines/hr</td><td>Walk distance, pick height, search time</td><td>Slotting optimization, pick-to-light</td></tr>' +
  '<tr><td>Case-Pick</td><td>120–250 cases/hr</td><td>Pallet build pattern, walk distance</td><td>Voice-directed, zone picking</td></tr>' +
  '<tr><td>Pallet Put-Away</td><td>12–20 pallets/hr</td><td>Travel distance, lift height, dock staging</td><td>Directed putaway, VNA turrets</td></tr>' +
  '<tr><td>Pack Station</td><td>40–80 orders/hr</td><td>Box selection, void fill, label/manifest</td><td>Right-size boxing, auto-tape</td></tr>' +
  '<tr><td>Receiving (floor load)</td><td>200–400 cartons/hr</td><td>Container position, convey distance</td><td>Powered conveyor from container</td></tr></table>' +

  // ── IES Designer Callout ──
  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">How IES Uses MOST Standards</div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;font-size:12px;">' +
    '<div style="background:rgba(59,130,246,.1);padding:12px;border-radius:8px;"><strong style="color:#3b82f6;">Pricing Labor</strong><br/>MOST standards × volume forecast = required hours → headcount → labor cost. This is the backbone of every 3PL pricing model.</div>' +
    '<div style="background:rgba(139,92,246,.1);padding:12px;border-radius:8px;"><strong style="color:#8b5cf6;">Validating Client Data</strong><br/>Clients often overstate productivity. MOST gives you an objective benchmark to pressure-test their claims during due diligence.</div>' +
    '<div style="background:rgba(245,158,11,.1);padding:12px;border-radius:8px;"><strong style="color:#f59e0b;">Scoping Automation ROI</strong><br/>Compare current MOST-based labor cost against automated throughput to calculate payback period and justify capital investment.</div>' +
    '<div style="background:rgba(16,185,129,.1);padding:12px;border-radius:8px;"><strong style="color:#10b981;">Continuous Improvement</strong><br/>After go-live, re-measure with MOST to identify drift and target process improvements. 5–15% gains are common in Year 1.</div>' +
  '</div></div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=-SPz9F-BYWU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> MOST Fundamentals</a>' +
    '<a href="https://www.youtube.com/watch?v=0OeStxbzKsM" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Engineered Labor Standards</a>' +
    '<a href="https://www.youtube.com/watch?v=eyTkJtyqFUs" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Warehouse Time Studies</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// 3PL COMMERCIAL STRUCTURE
// ═══════════════════════════════════════════════════
WIKI_PAGES['commercial-structure'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Commercial / 3PL Commercial Structure</div>' +
  '<h2>3PL Commercial Structure</h2>' +
  '<p>Understanding how 3PL deals are priced, structured, and measured is essential for every IES designer. Your technical solution must map to a commercial model that works for both GXO and the client. A brilliant warehouse design that cannot be profitably priced is worthless — and a profitable deal with a bad design erodes trust. This section bridges operations and finance.</p>' +

  // ── Pricing Model Comparison SVG ──
  '<div style="margin:24px 0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px;padding:28px 20px;">' +
  '<div style="text-align:center;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">3PL Pricing Model Spectrum</div>' +
  '<svg viewBox="0 0 700 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;display:block;margin:0 auto;">' +
    // Spectrum bar
    '<defs><linearGradient id="specGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#10b981"/></linearGradient></defs>' +
    '<rect x="50" y="50" width="600" height="10" rx="5" fill="url(#specGrad)"/>' +
    // Labels
    '<text x="50" y="35" fill="#3b82f6" font-size="9" font-weight="600">LOW CLIENT RISK</text>' +
    '<text x="650" y="35" text-anchor="end" fill="#10b981" font-size="9" font-weight="600">HIGH CLIENT RISK</text>' +
    '<text x="50" y="90" fill="#3b82f6" font-size="9">LOW 3PL MARGIN</text>' +
    '<text x="650" y="90" text-anchor="end" fill="#10b981" font-size="9">HIGH 3PL MARGIN</text>' +
    // Model markers
    '<circle cx="120" cy="55" r="18" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>' +
    '<text x="120" y="59" text-anchor="middle" fill="#3b82f6" font-size="8" font-weight="700">C+</text>' +
    '<text x="120" y="112" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">Cost-Plus</text>' +

    '<circle cx="280" cy="55" r="18" fill="#1e293b" stroke="#8b5cf6" stroke-width="2"/>' +
    '<text x="280" y="59" text-anchor="middle" fill="#8b5cf6" font-size="8" font-weight="700">OB</text>' +
    '<text x="280" y="112" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">Open Book</text>' +

    '<circle cx="430" cy="55" r="18" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>' +
    '<text x="430" y="59" text-anchor="middle" fill="#f59e0b" font-size="8" font-weight="700">FP</text>' +
    '<text x="430" y="112" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">Fixed Price</text>' +

    '<circle cx="570" cy="55" r="18" fill="#1e293b" stroke="#10b981" stroke-width="2"/>' +
    '<text x="570" y="59" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">GS</text>' +
    '<text x="570" y="112" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">Gain-Share</text>' +
  '</svg></div>' +

  // ── Model Deep Dive Cards ──
  '<h3>Pricing Models</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin:16px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Cost-Plus</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.6;"><strong style="color:#e2e8f0;">How it works:</strong> Client pays all direct costs + management fee (5–12%).<br/><strong style="color:#e2e8f0;">Pros:</strong> Transparent, low 3PL risk, easy to sell<br/><strong style="color:#e2e8f0;">Cons:</strong> No incentive to optimize, margin capped<br/><strong style="color:#e2e8f0;">Best for:</strong> New relationships, complex/unpredictable profiles</div></div>' +

    '<div style="background:linear-gradient(135deg,#2d1a3e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #8b5cf6;">' +
    '<div style="color:#8b5cf6;font-weight:700;font-size:14px;margin-bottom:8px;">Open Book</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.6;"><strong style="color:#e2e8f0;">How it works:</strong> Full cost visibility, shared savings when targets beaten.<br/><strong style="color:#e2e8f0;">Pros:</strong> Builds trust, aligns incentives<br/><strong style="color:#e2e8f0;">Cons:</strong> Admin-heavy, requires strong reporting<br/><strong style="color:#e2e8f0;">Best for:</strong> Strategic partnerships, large-volume clients</div></div>' +

    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">Fixed Price (per unit)</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.6;"><strong style="color:#e2e8f0;">How it works:</strong> $/case, $/pallet, $/order — client pays per transaction.<br/><strong style="color:#e2e8f0;">Pros:</strong> Predictable client cost, 3PL upside on efficiency<br/><strong style="color:#e2e8f0;">Cons:</strong> Volume risk on 3PL, must nail the standard<br/><strong style="color:#e2e8f0;">Best for:</strong> Stable, well-understood profiles</div></div>' +

    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">Gain-Share</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.6;"><strong style="color:#e2e8f0;">How it works:</strong> Fixed base rate + shared upside from productivity gains.<br/><strong style="color:#e2e8f0;">Pros:</strong> Maximum alignment, funds automation investment<br/><strong style="color:#e2e8f0;">Cons:</strong> Complex to measure, baseline disputes<br/><strong style="color:#e2e8f0;">Best for:</strong> Automation-heavy, long-term contracts (5+ yr)</div></div>' +
  '</div>' +

  // ── P&L Anatomy ──
  '<h3>3PL Warehouse P&L Anatomy</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin:16px 0;">' +
    '<div>' +
    '<table class="wiki-spec-table"><tr><th>Line Item</th><th>% of Revenue</th><th>Notes</th></tr>' +
    '<tr><td><strong>Revenue</strong></td><td>100%</td><td>Management fees + transaction fees + storage</td></tr>' +
    '<tr><td>Labor (direct)</td><td>45–60%</td><td>Largest cost — MOST standards drive this</td></tr>' +
    '<tr><td>Facility (rent/lease)</td><td>12–18%</td><td>Triple-net lease, CAM, taxes, insurance</td></tr>' +
    '<tr><td>MHE / Equipment</td><td>3–6%</td><td>Forklifts, conveyors, racking (lease or deprec.)</td></tr>' +
    '<tr><td>IT / WMS</td><td>2–4%</td><td>WMS license, integrations, hardware</td></tr>' +
    '<tr><td>Supplies / Consumables</td><td>2–4%</td><td>Boxes, tape, labels, shrink wrap</td></tr>' +
    '<tr><td>Management Overhead</td><td>4–8%</td><td>Site GM, supervisors, HR, safety</td></tr>' +
    '<tr><td><strong style="color:#10b981;">Operating Margin</strong></td><td><strong style="color:#10b981;">5–12%</strong></td><td>Target varies by contract type</td></tr></table></div>' +
    // P&L visual
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;">' +
    '<div style="text-align:center;color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Typical 3PL Cost Stack</div>' +
    '<svg viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;">' +
      '<rect x="60" y="10" width="160" height="100" rx="4" fill="#ef4444" opacity="0.8"/>' +
      '<text x="140" y="55" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">LABOR</text>' +
      '<text x="140" y="72" text-anchor="middle" fill="#fff" font-size="9">45–60%</text>' +
      '<rect x="60" y="110" width="160" height="30" rx="0" fill="#f59e0b" opacity="0.8"/>' +
      '<text x="140" y="130" text-anchor="middle" fill="#1a1a2e" font-size="9" font-weight="700">FACILITY 12–18%</text>' +
      '<rect x="60" y="140" width="160" height="20" rx="0" fill="#8b5cf6" opacity="0.8"/>' +
      '<text x="140" y="154" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">MHE + IT + SUPPLIES 7–14%</text>' +
      '<rect x="60" y="160" width="160" height="15" rx="0" fill="#3b82f6" opacity="0.8"/>' +
      '<text x="140" y="171" text-anchor="middle" fill="#fff" font-size="7" font-weight="600">MGMT OVERHEAD 4–8%</text>' +
      '<rect x="60" y="175" width="160" height="15" rx="0 0 4 4" fill="#10b981" opacity="0.9"/>' +
      '<text x="140" y="186" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">MARGIN 5–12%</text>' +
    '</svg></div>' +
  '</div>' +

  // ── Rate Structure ──
  '<h3>Common Rate Structures</h3>' +
  '<table class="wiki-spec-table"><tr><th>Rate Type</th><th>Unit</th><th>Typical Range</th><th>When Used</th></tr>' +
  '<tr><td>Storage</td><td>$/pallet position/month</td><td>$8–$18</td><td>All warehousing contracts</td></tr>' +
  '<tr><td>Handling In</td><td>$/pallet or $/case</td><td>$3–$8 / $0.15–$0.50</td><td>Receiving, putaway</td></tr>' +
  '<tr><td>Handling Out</td><td>$/order or $/line</td><td>$2–$6 / $0.50–$2.00</td><td>Pick, pack, ship</td></tr>' +
  '<tr><td>VAS</td><td>$/unit or $/hour</td><td>Varies widely</td><td>Kitting, labeling, returns</td></tr>' +
  '<tr><td>Management Fee</td><td>% of cost or flat $/month</td><td>5–12% or $15K–$50K/mo</td><td>Cost-plus contracts</td></tr>' +
  '<tr><td>Minimum Commitment</td><td>$/month floor</td><td>80–90% of projected revenue</td><td>Protects 3PL from volume shortfall</td></tr></table>' +

  // ── Designer Callout ──
  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">What IES Designers Must Know</div>' +
  '<p style="font-size:13px;">Every design decision has a P&L impact. When you add a mezzanine, you increase CapEx but reduce floor space cost. When you specify G2P robots, you reduce labor but add MHE depreciation and IT cost. <strong>Always map your design to the cost model</strong> — your solutions engineering lead and the commercial team need to see the numbers, not just the layout.</p></div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=-SPz9F-BYWU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> 3PL Pricing Models Explained</a>' +
    '<a href="https://www.youtube.com/watch?v=0OeStxbzKsM" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Warehouse P&L Structure</a>' +
    '<a href="https://www.youtube.com/watch?v=eyTkJtyqFUs" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Gain-Share Contracts</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// WIN STRATEGY DEVELOPMENT
// ═══════════════════════════════════════════════════
WIKI_PAGES['win-strategy'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / Commercial / Win Strategy Development</div>' +
  '<h2>Win Strategy Development</h2>' +
  '<p>A win strategy is the deliberate plan for how GXO will differentiate and win a specific opportunity. It goes beyond responding to requirements — it shapes how the client perceives us relative to the competition. IES designers play a critical role because the technical solution IS the differentiator in most 3PL pursuits. This section covers the frameworks, tools, and habits that turn good proposals into winning ones.</p>' +

  // ── Win Strategy Process SVG ──
  '<div style="margin:24px 0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px;padding:28px 20px;">' +
  '<div style="text-align:center;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Win Strategy Development Process</div>' +
  '<svg viewBox="0 0 750 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:750px;display:block;margin:0 auto;">' +
    '<rect x="5" y="15" width="120" height="65" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>' +
    '<text x="65" y="38" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="700">1. QUALIFY</text>' +
    '<text x="65" y="52" text-anchor="middle" fill="#94a3b8" font-size="7">Go/No-Go decision</text>' +
    '<text x="65" y="62" text-anchor="middle" fill="#94a3b8" font-size="7">Win probability</text>' +
    '<line x1="130" y1="47" x2="148" y2="47" stroke="#475569" stroke-width="1.5" marker-end="url(#wsA)"/>' +

    '<rect x="152" y="15" width="120" height="65" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>' +
    '<text x="212" y="38" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="700">2. DISCOVER</text>' +
    '<text x="212" y="52" text-anchor="middle" fill="#94a3b8" font-size="7">Client pain points</text>' +
    '<text x="212" y="62" text-anchor="middle" fill="#94a3b8" font-size="7">Decision criteria</text>' +
    '<line x1="277" y1="47" x2="295" y2="47" stroke="#475569" stroke-width="1.5" marker-end="url(#wsA)"/>' +

    '<rect x="299" y="15" width="120" height="65" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>' +
    '<text x="359" y="38" text-anchor="middle" fill="#3b82f6" font-size="9" font-weight="700">3. POSITION</text>' +
    '<text x="359" y="52" text-anchor="middle" fill="#94a3b8" font-size="7">Differentiators</text>' +
    '<text x="359" y="62" text-anchor="middle" fill="#94a3b8" font-size="7">Ghost competition</text>' +
    '<line x1="424" y1="47" x2="442" y2="47" stroke="#475569" stroke-width="1.5" marker-end="url(#wsA)"/>' +

    '<rect x="446" y="15" width="120" height="65" rx="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>' +
    '<text x="506" y="38" text-anchor="middle" fill="#8b5cf6" font-size="9" font-weight="700">4. PROPOSE</text>' +
    '<text x="506" y="52" text-anchor="middle" fill="#94a3b8" font-size="7">Solution + pricing</text>' +
    '<text x="506" y="62" text-anchor="middle" fill="#94a3b8" font-size="7">aligned to themes</text>' +
    '<line x1="571" y1="47" x2="589" y2="47" stroke="#475569" stroke-width="1.5" marker-end="url(#wsA)"/>' +

    '<rect x="593" y="15" width="120" height="65" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>' +
    '<text x="653" y="38" text-anchor="middle" fill="#10b981" font-size="9" font-weight="700">5. CLOSE</text>' +
    '<text x="653" y="52" text-anchor="middle" fill="#94a3b8" font-size="7">Oral presentation</text>' +
    '<text x="653" y="62" text-anchor="middle" fill="#94a3b8" font-size="7">Negotiation</text>' +
    '<defs><marker id="wsA" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0,0 8,3 0,6" fill="#475569"/></marker></defs>' +
  '</svg></div>' +

  // ── Qualification Framework ──
  '<h3>Go/No-Go Qualification</h3>' +
  '<p>Not every RFP deserves a response. Pursuing low-probability opportunities wastes IES design capacity and dilutes focus. Use this framework to score opportunities before committing resources:</p>' +
  '<table class="wiki-spec-table"><tr><th>Factor</th><th>Weight</th><th>Green (3)</th><th>Yellow (2)</th><th>Red (1)</th></tr>' +
  '<tr><td>Client Relationship</td><td>25%</td><td>Existing client, sponsor</td><td>Known, no sponsor</td><td>Cold / incumbent strong</td></tr>' +
  '<tr><td>Solution Fit</td><td>25%</td><td>Core competency</td><td>Stretch but doable</td><td>Outside wheelhouse</td></tr>' +
  '<tr><td>Deal Size</td><td>20%</td><td>$5M+ annual revenue</td><td>$2–5M</td><td>&lt;$2M</td></tr>' +
  '<tr><td>Timeline</td><td>15%</td><td>4+ weeks to respond</td><td>2–4 weeks</td><td>&lt;2 weeks</td></tr>' +
  '<tr><td>Competitive Position</td><td>15%</td><td>Top 2 known</td><td>Mid-pack</td><td>Column fodder</td></tr></table>' +
  '<div class="wiki-callout" style="border-left-color:#f59e0b;"><div class="wiki-callout-title" style="color:#f59e0b;">Scoring</div><p style="font-size:13px;">Weighted score ≥ 2.5 → <strong style="color:#10b981;">GO</strong> | 2.0–2.4 → <strong style="color:#f59e0b;">Conditional</strong> (needs sponsor approval) | &lt;2.0 → <strong style="color:#ef4444;">NO-GO</strong></p></div>' +

  // ── Win Themes ──
  '<h3>Developing Win Themes</h3>' +
  '<p>Win themes are the 3–4 core messages that run through every element of your proposal. They connect the client\'s pain to your differentiated solution. Each theme should follow this structure:</p>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:16px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:12px;margin-bottom:8px;">Theme Template</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.6;"><strong style="color:#e2e8f0;">Pain:</strong> [Client problem]<br/><strong style="color:#e2e8f0;">Solution:</strong> [Our specific approach]<br/><strong style="color:#e2e8f0;">Proof:</strong> [Evidence / case study]<br/><strong style="color:#e2e8f0;">Benefit:</strong> [Quantified outcome]</div></div>' +

    '<div style="background:linear-gradient(135deg,#3b1f2b 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #ef4444;">' +
    '<div style="color:#ef4444;font-weight:700;font-size:12px;margin-bottom:8px;">Example: Scalability</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.6;"><strong style="color:#e2e8f0;">Pain:</strong> 300% peak-to-trough swings<br/><strong style="color:#e2e8f0;">Solution:</strong> Flexible labor model + scalable G2P robotics<br/><strong style="color:#e2e8f0;">Proof:</strong> [Client X] — 2.8× peak handled<br/><strong style="color:#e2e8f0;">Benefit:</strong> Zero SLA misses during Q4</div></div>' +

    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:18px;border-top:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:12px;margin-bottom:8px;">Example: Technology</div>' +
    '<div style="color:#cbd5e1;font-size:12px;line-height:1.6;"><strong style="color:#e2e8f0;">Pain:</strong> No visibility into inventory accuracy<br/><strong style="color:#e2e8f0;">Solution:</strong> Real-time WMS dashboard + cycle count automation<br/><strong style="color:#e2e8f0;">Proof:</strong> GXO avg 99.8% accuracy across network<br/><strong style="color:#e2e8f0;">Benefit:</strong> $2M+ annual shrink reduction</div></div>' +
  '</div>' +

  // ── Ghosting the Competition ──
  '<h3>Competitive Positioning (Ghosting)</h3>' +
  '<p>"Ghosting" means subtly highlighting your strengths in areas where competitors are weak — without naming them. It plants doubt while staying professional.</p>' +
  '<table class="wiki-spec-table"><tr><th>If Competitor Is...</th><th>Ghost Statement</th><th>IES Design Lever</th></tr>' +
  '<tr><td>Asset-light / labor broker</td><td>"Our dedicated site model ensures continuity and accountability"</td><td>Show full site staffing plan with named roles</td></tr>' +
  '<tr><td>No automation capability</td><td>"Our in-house automation engineering team designs solutions, not subcontracts"</td><td>Include detailed automation layout + ROI model</td></tr>' +
  '<tr><td>Regional only</td><td>"Our 900+ sites across 27 countries enable seamless network expansion"</td><td>Map multi-site growth path in proposal</td></tr>' +
  '<tr><td>Weak technology stack</td><td>"Our WMS integration team has 200+ active EDI connections"</td><td>Include IT integration timeline + test plan</td></tr>' +
  '<tr><td>No vertical expertise</td><td>"We operate 50+ sites in [vertical] with proven SOPs"</td><td>Show vertical-specific metrics and references</td></tr></table>' +

  // ── Proposal Structure ──
  '<h3>Winning Proposal Structure</h3>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0;font-size:12px;">' +
    '<div style="background:rgba(59,130,246,.1);padding:12px;border-radius:8px;"><strong style="color:#3b82f6;">1. Executive Summary</strong><br/>Win themes + quantified value proposition. Client should be able to choose you from this page alone.</div>' +
    '<div style="background:rgba(139,92,246,.1);padding:12px;border-radius:8px;"><strong style="color:#8b5cf6;">2. Understanding</strong><br/>Prove you listened. Restate their challenges in their language. Show site visit insights.</div>' +
    '<div style="background:rgba(245,158,11,.1);padding:12px;border-radius:8px;"><strong style="color:#f59e0b;">3. Solution Design</strong><br/>IES layout, automation plan, staffing model, technology stack. THIS is where you win.</div>' +
    '<div style="background:rgba(16,185,129,.1);padding:12px;border-radius:8px;"><strong style="color:#10b981;">4. Implementation</strong><br/>Phased timeline, risk mitigation, go-live criteria. Show you have done this before.</div>' +
    '<div style="background:rgba(239,68,68,.1);padding:12px;border-radius:8px;"><strong style="color:#ef4444;">5. Commercial</strong><br/>Pricing tied to win themes. Show value, not just cost. Include gain-share options.</div>' +
    '<div style="background:rgba(148,163,184,.1);padding:12px;border-radius:8px;"><strong style="color:#94a3b8;">6. Proof Points</strong><br/>Case studies, references, KPIs from similar operations. Social proof closes deals.</div>' +
  '</div>' +

  // ── Designer Callout ──
  '<div class="wiki-callout" style="border-left-color:#ff3a00;"><div class="wiki-callout-title" style="color:#ff3a00;">IES Designer\'s Role in Win Strategy</div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;font-size:12px;">' +
    '<div style="background:rgba(59,130,246,.1);padding:12px;border-radius:8px;"><strong style="color:#3b82f6;">During Discovery</strong><br/>Join site visits. Observe current operations. Identify waste the client doesn\'t see. Your observations become win themes.</div>' +
    '<div style="background:rgba(245,158,11,.1);padding:12px;border-radius:8px;"><strong style="color:#f59e0b;">During Solutioning</strong><br/>Design the layout and automation plan that delivers on win themes. If the theme is "scalability," your design must show how it scales.</div>' +
    '<div style="background:rgba(139,92,246,.1);padding:12px;border-radius:8px;"><strong style="color:#8b5cf6;">During Orals</strong><br/>Present the technical solution. You are the credibility. Practice the demo, know every number, anticipate technical questions.</div>' +
    '<div style="background:rgba(16,185,129,.1);padding:12px;border-radius:8px;"><strong style="color:#10b981;">After the Win</strong><br/>Ensure the solution as-built matches what was sold. Nothing destroys a client relationship faster than a bait-and-switch.</div>' +
  '</div></div>' +

  // ── Videos ──
  '<h3>Video Resources</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0;">' +
    '<a href="https://www.youtube.com/watch?v=-SPz9F-BYWU" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> RFP Response Strategy</a>' +
    '<a href="https://www.youtube.com/watch?v=0OeStxbzKsM" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Ghosting the Competition</a>' +
    '<a href="https://www.youtube.com/watch?v=eyTkJtyqFUs" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#1e293b;border-radius:8px;text-decoration:none;color:#cbd5e1;font-size:13px;border:1px solid #334155;"><span style="color:#ef4444;font-size:18px;">▶</span> Winning Oral Presentations</a>' +
  '</div>' +
'</div>';

// ═══════════════════════════════════════════════════
// WMS PLATFORMS: BLUE YONDER WMS
// ═══════════════════════════════════════════════════
WIKI_PAGES['blueyonder-wms'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Training Wiki / WMS Platforms / Blue Yonder</div>' +
  '<h2>Blue Yonder WMS</h2>' +
  '<p>Blue Yonder WMS is an enterprise warehouse management platform used across GXO\'s network and throughout the 3PL industry. Originally JDA Software\'s flagship WMS, the product was renamed after JDA acquired German AI firm Blue Yonder GmbH in 2018 and rebranded the entire company in February 2020. Panasonic subsequently acquired Blue Yonder for $7.1B in April 2021. Today Blue Yonder is a Gartner Magic Quadrant Leader for WMS (2024) and a Nucleus Research Leader for three consecutive years. The platform combines traditional WMS capabilities with a cognitive AI layer for predictive labor planning, demand-driven slotting, and autonomous task optimization.</p>' +

  '<h3>Overview & Architecture</h3>' +
  '<p>Blue Yonder WMS supports both cloud-native SaaS and on-premises deployment, though the strategic direction is firmly cloud. The cognitive AI features — the most compelling differentiator — are <strong>SaaS-only</strong> starting with the 2025.2 release. IES designers should understand these three deployment tiers:</p>' +

  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #3b82f6;">' +
    '<div style="color:#3b82f6;font-weight:700;font-size:14px;margin-bottom:8px;">Cloud-Native SaaS</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Multi-tenant or dedicated instances. Quarterly feature releases, elastic scaling, automatic patching. All AI/cognitive features available. Recommended for new implementations.</div></div>' +
    '<div style="background:linear-gradient(135deg,#3a351a 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #f59e0b;">' +
    '<div style="color:#f59e0b;font-weight:700;font-size:14px;margin-bottom:8px;">On-Premises (Legacy)</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Licensed software on customer data centers. Full customization control but no AI features. Security patches and bug fixes only. Migration path available to SaaS.</div></div>' +
    '<div style="background:linear-gradient(135deg,#1a3a2e 0%,#1a1a2e 100%);border-radius:12px;padding:20px;border-left:3px solid #10b981;">' +
    '<div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:8px;">Cognitive WMS (AI Layer)</div>' +
    '<div style="color:#cbd5e1;font-size:13px;line-height:1.5;">Agentic AI for demand-driven slotting, predictive congestion, ML task interleaving, and autonomous labor scheduling. SaaS-only. Requires 6-12 weeks of model training on facility data.</div></div>' +
  '</div>' +

  '<h3>Core Modules</h3>' +
  '<p>Blue Yonder WMS is modular — organizations select and configure the modules that align with their operational model. Below are the primary modules and their design implications for IES:</p>' +
  '<table class="wiki-spec-table">' +
    '<tr><th>Module</th><th>Key Capabilities</th><th>Design Impact</th></tr>' +
    '<tr><td><strong>Receiving & Putaway</strong></td><td>ASN matching, blind receipt, vendor compliance, system-directed putaway strategies (nearest open, by SKU profile, cross-dock), inbound appointment scheduling</td><td>Requires clear receiving zone design, staging areas, and location coding. RF/voice at dock. Affects inbound labor hours by 20-35%.</td></tr>' +
    '<tr><td><strong>Inventory & Slotting</strong></td><td>Cycle counting, ABC slotting, AI demand-driven slotting (DDS), zone rules, reserve/active split, lot/serial tracking, expiration management</td><td>Critical for facility zoning. DDS requires 12+ weeks historical data. Zone design (fast/med/slow) drives 15-25% picking productivity gains.</td></tr>' +
    '<tr><td><strong>Wave Planning</strong></td><td>Order allocation, wave building (time/size/customer-based), wave sequencing, order consolidation, replenishment triggers</td><td>Wave optimization reduces shipping delays by 10-15%. Integration with TMS for dock door assignment. Requires clear packing rules.</td></tr>' +
    '<tr><td><strong>Pick/Pack/Ship</strong></td><td>RF-directed, batch/zone/cluster picking, voice-directed, pick-to-light, confirmation logic, label generation, manifest, cartonization</td><td>Picking is 50-65% of warehouse labor. BY directed work reduces time per pick by 25-40% and errors by 95% vs. paper-based.</td></tr>' +
    '<tr><td><strong>Labor Management</strong></td><td>Task interleaving via ML, labor standards by activity, real-time tracking, variance analysis, headcount planning, shift optimization, utilization reporting</td><td>Foundation for staffing model design. Task interleaving yields 15-30% productivity gains. Requires accurate labor standards by activity code.</td></tr>' +
    '<tr><td><strong>Yard Management</strong></td><td>Dock scheduling, door assignment, trailer positioning, detention management, cross-dock staging, computer vision integration</td><td>Reduces dock congestion and truck wait time. Requires TMS integration. Impacts facility layout and traffic flow design.</td></tr>' +
    '<tr><td><strong>Returns & Reverse</strong></td><td>RMA processing, return receipt, sort/disposition routing (Smart Disposition via Optoro acquisition), refurbish workflows, restocking</td><td>Returns can be 5-15% of volume. Requires separate processing area. Smart Disposition engine routes returns to most profitable channel.</td></tr>' +
    '<tr><td><strong>Billing (3PL)</strong></td><td>Activity-based billing, rate engine, storage/pick/labor/shipping charges, invoice generation, multi-client reporting, client portal</td><td>Critical for 3PL operations. BY rates every transaction. Requires clear contract definitions. Misconfigured billing = revenue leakage.</td></tr>' +
  '</table>' +

  '<h3>MOST & Labor Impact</h3>' +
  '<p>Blue Yonder WMS fundamentally changes warehouse labor by moving from paper-based ad-hoc task assignment to WMS-directed optimized work. Understanding MOST (Method, Operation, Sequence, Time) impact is essential for IES staffing models and proposals.</p>' +
  '<table class="wiki-spec-table">' +
    '<tr><th>MOST Dimension</th><th>Paper-Based</th><th>RF-Only (Non-Directed)</th><th>BY WMS Directed Work</th></tr>' +
    '<tr><td><strong>Method</strong></td><td>Paper picks, manual pen updates, supervisor calls out next task</td><td>RF gun confirms transactions but no task direction; operator chooses next pick</td><td>RF/voice device delivers directed task queue with optimized pick sequence per trip</td></tr>' +
    '<tr><td><strong>Operation</strong></td><td>Picks, bins, labels performed independently; no chaining</td><td>Picks confirmed in WMS but operations remain isolated</td><td>Picks, replenishments, packs flow through directed workflow; interleaved multi-task sequences</td></tr>' +
    '<tr><td><strong>Sequence</strong></td><td>Random, inefficient; travel time 30-40% of task</td><td>Operator-optimized based on zone knowledge; variable results</td><td>WMS sequences by zone, aisle, level; interleaves with packing/staging; 15-30% fewer trips</td></tr>' +
    '<tr><td><strong>Time</strong></td><td>Avg. 120-180 sec/pick (search + travel + confirm)</td><td>Avg. 80-120 sec/pick (travel still variable)</td><td>Avg. 45-75 sec/pick (optimized path, dead time eliminated)</td></tr>' +
    '<tr><td><strong>Productivity</strong></td><td>~80-100 picks/FTE/hr</td><td>~120-160 picks/FTE/hr</td><td>~200-280 picks/FTE/hr (voice: +17% vs RF; AI: +25% vs standard WMS)</td></tr>' +
    '<tr><td><strong>Utilization</strong></td><td>50-65% productive time</td><td>65-75% productive time</td><td>85-95% productive time (task interleaving keeps workers continuously engaged)</td></tr>' +
  '</table>' +
  '<p><strong>Key metrics for IES proposals:</strong> Task interleaving delivers 15-30% productivity gains by combining picks, packs, and stages in single trips. Voice-directed picking adds 17% over RF scanning. BY WMS can drive utilization to 85-95% — every 10% utilization gain equals 8-10% more volume without additional FTEs.</p>' +

  '<h3>Staffing Model Implications</h3>' +
  '<p>BY WMS shifts the staffing paradigm from purely variable labor to a hybrid of baseline (system management, supervision, training) plus variable (picking, packing, receiving). With 25-40% productivity gains, equivalent volume can be handled with 30-35% fewer pickers. However, you add system administrators, data quality roles, and continuous optimization resources. Net effect: typical 3PL facility reduces labor cost by 15-22% but shifts from hourly ops to hybrid ops/tech roles.</p>' +
  '<p><strong>Shift Design:</strong> Paper-based ops typically run 1-2 shifts; BY WMS enables 3-shift operations with the same headcount due to higher utilization. Peak-hour flexibility is easier — WMS absorbs 10-15% surge without additional staff via utilization creep.</p>' +
  '<p><strong>Training:</strong> RF/voice training requires 3-5 days vs. 1-2 for paper, but it\'s standardized — new hires follow WMS prompts, reducing supervisor burden. Cross-trained workers become 10-15% more productive because they understand the full workflow.</p>' +
  '<p><strong>Supervisor Ratio:</strong> BY WMS reduces task management burden by 40-50%. Typical ratio: 1 supervisor per 12-18 directed ops (vs. 1 per 8-10 on paper).</p>' +
  '<div class="wiki-callout" style="border-left-color:#f59e0b;"><div class="wiki-callout-title" style="color:#f59e0b;">Design Rule of Thumb: Staffing Model</div>' +
  '<p style="font-size:13px;">For a greenfield 3PL facility on Blue Yonder WMS: baseline 15-20% overhead staff (supervisors, planners, admins, QA), 80-85% directed operational labor. Assume 200-280 picks/FTE/hour. Size dock/receiving assuming 30-40% inbound labor reduction vs. paper. Plan 3-shift capability with 1.8× base FTE (overlaps, sick leave, training). Every 10% utilization gain = 8-10% more volume without additional FTEs.</p></div>' +

  '<h3>Design Implications for IES</h3>' +
  '<p><strong>Facility Layout:</strong> BY WMS requires explicit zone design (fast/medium/slow tiers by velocity). Layout must support efficient zone traversal — narrow aisles (5-6 ft) in high-velocity zones, wider in slow zones. Zone distance from packing should be minimized (20-40 ft max). Location coding follows Zone-Aisle-Level-Position convention (e.g., A1-03-02-05); design your location master upfront as migration later is costly.</p>' +
  '<p><strong>Automation Hierarchy (WMS → WES → WCS):</strong> Blue Yonder WMS sits atop a three-tier control architecture. Understanding this is critical for automation-heavy designs:</p>' +
  '<table class="wiki-spec-table">' +
    '<tr><th>Layer</th><th>System</th><th>Responsibility</th><th>IES Implication</th></tr>' +
    '<tr><td><strong>WMS</strong></td><td>Blue Yonder WMS</td><td>Order fulfillment logic, inventory allocation, task assignment, labor tracking, billing</td><td>Owns customer contracts, SLAs, multi-client visibility. IES designs around WMS data model.</td></tr>' +
    '<tr><td><strong>WES</strong></td><td>BY WES or 3rd-party (Körber, etc.)</td><td>Conveyor flow, sortation logic, equipment sequencing, congestion management</td><td>Bridges WMS and physical automation. IES must design material flow to match WES logic.</td></tr>' +
    '<tr><td><strong>WCS</strong></td><td>Device controllers (PLCs, AS/RS controllers)</td><td>Real-time device motion, safety, error recovery, sensor integration</td><td>IES specifies device architecture (conveyor speed, sorter capacity); WCS implements.</td></tr>' +
  '</table>' +
  '<p><strong>Multi-Client 3PL Considerations:</strong> BY WMS runs multi-client with separate inventory, orders, and billing per client while sharing physical flows (conveyor, dock, receiving). IES design must account for: client-specific zone allocation, dock door assignment by client, separation of picking zones to minimize cross-client travel, and billing complexity (activity codes tagged by client).</p>' +

  '<h3>Automation Integration</h3>' +
  '<p><strong>Conveyor & Sortation:</strong> WMS sends divert instructions to sorters and receives real-time feedback for congestion avoidance. <strong>AS/RS:</strong> WMS requests putaway/retrieval locations; AS/RS scheduler optimizes crane movements. Integrates with Vanderlande, Dematic, Körber via API. <strong>AMR:</strong> WMS integrates with fleet managers (MiR, Locus, Fetch) for zone-to-zone tote transport.</p>' +
  '<p><strong>Robotics Hub:</strong> Blue Yonder\'s middleware layer for managing mixed-vendor AMR fleets through a single API. Critical for large 3PLs with heterogeneous robot populations across facilities.</p>' +
  '<div class="wiki-callout" style="border-left-color:#10b981;"><div class="wiki-callout-title" style="color:#10b981;">GXO-Specific Benefits</div>' +
  '<p style="font-size:13px;">GXO\'s scale benefits from BY WMS automation integration: (1) Shared automation serves multiple clients seamlessly via WMS client codes; (2) Idle pickers from one client can be reassigned to another via WMS task queue; (3) WMS analytics show which clients justify dedicated automation investment; (4) Cognitive layer predicts demand spikes for proactive AMR deployment.</p></div>' +

  '<h3>Competitive Landscape</h3>' +
  '<p>Blue Yonder competes in the enterprise tier. Here\'s how it stacks up for IES decision-making:</p>' +
  '<table class="wiki-spec-table">' +
    '<tr><th>Dimension</th><th>Blue Yonder</th><th>Manhattan Active WM</th><th>SAP EWM</th><th>Oracle WMS Cloud</th><th>Körber</th></tr>' +
    '<tr><td><strong>AI/ML</strong></td><td>Leader — cognitive WMS, agentic AI, ML slotting (SaaS-only)</td><td>Good — AIMS labor scheduling</td><td>Limited — enterprise AI, slow to deploy</td><td>Minimal — transactional focus</td><td>Strong WES-layer AI for automation</td></tr>' +
    '<tr><td><strong>3PL Support</strong></td><td>Excellent — designed for service providers, multi-client, flexible billing</td><td>Good — multi-tenancy but less flexible contracts</td><td>Weak — enterprise focus</td><td>Weak — corporate warehouses</td><td>Moderate — strong with automation</td></tr>' +
    '<tr><td><strong>Integration</strong></td><td>Excellent — ERP-agnostic REST/SOAP APIs, open ecosystem</td><td>Good — tends toward closed Manhattan ecosystem</td><td>Limited — SAP-native coupling</td><td>Oracle-centric</td><td>Best-in-class open architecture, hardware-agnostic</td></tr>' +
    '<tr><td><strong>Implementation</strong></td><td>Medium — 8-16 weeks mid-market</td><td>Medium-High — 10-20 weeks</td><td>High — 16-36 weeks, SAP expertise required</td><td>Medium — 6-14 weeks</td><td>High — 12-24 weeks, deep automation expertise</td></tr>' +
    '<tr><td><strong>UI/UX</strong></td><td>Good — functional but less polished</td><td>Excellent — modern, intuitive</td><td>Fair — enterprise-heavy</td><td>Fair</td><td>Good</td></tr>' +
    '<tr><td><strong>Time-to-Value</strong></td><td>18-36 months full ROI</td><td>20-32 months</td><td>30-48 months</td><td>12-18 months</td><td>36-48 months</td></tr>' +
  '</table>' +

  '<h3>Value Proposition & ROI</h3>' +
  '<p>For a typical 3PL facility (30K+ SKUs, 300+ orders/day, 15-20 staff):</p>' +
  '<ul>' +
    '<li><strong>Fulfillment cost reduction:</strong> 10-15% (WMS alone) → 25-35% (+ conveyor + slotting) → 40-50% (full automation + AI)</li>' +
    '<li><strong>Labor productivity:</strong> 15-20% (paper→RF/voice) → 25-35% (+ interleaving + standards) → 40-45% (+ AI scheduling + DDS)</li>' +
    '<li><strong>Inventory accuracy:</strong> 99%+ (vs. 94-97% paper) — reduces write-offs, enables smaller buffer stock</li>' +
    '<li><strong>Shipping accuracy:</strong> 99.7%+ (vs. 97-98% paper) — reduces chargebacks and damage claims</li>' +
    '<li><strong>ROI timeline:</strong> SaaS 12-24 month breakeven, on-prem 24-36 months</li>' +
  '</ul>' +
  '<div class="wiki-callout" style="border-left-color:#ef4444;"><div class="wiki-callout-title" style="color:#ef4444;">When to Recommend Blue Yonder WMS</div>' +
  '<p style="font-size:13px;"><strong>Strong Fit:</strong> Multi-client 3PL, 30K+ SKUs, 300+ orders/day, labor optimization needed, automation integration planned, cloud-preferred, 6-12 month optimization commitment. BY WMS is GXO\'s strategic platform.</p>' +
  '<p style="font-size:13px;"><strong>Weak Fit:</strong> Single-client with &lt;10K SKUs and &lt;100 orders/day (overhead too high), existing Oracle WMS lock-in, extreme customization requirements, or budget requires &lt;12-month breakeven. Evaluate Manhattan Active WM as an alternative in these cases.</p></div>' +

  '<h3>Key Limitations & Gotchas</h3>' +
  '<ul>' +
    '<li><strong>Implementation complexity:</strong> 12-20 weeks realistic for mid-market 3PLs. Plan 3-4 weeks of data remediation upfront — clean customer masters, location masters, and SKU setup are prerequisites.</li>' +
    '<li><strong>UI/UX gap:</strong> Manhattan\'s operator interface is more intuitive. BY requires more training and has a steeper learning curve, especially for voice picking.</li>' +
    '<li><strong>AI is SaaS-only:</strong> Cognitive WMS modules (DDS, labor prediction) require SaaS. On-prem customers are stuck with rules-based engine — a major limitation for automation ROI.</li>' +
    '<li><strong>Customization debt:</strong> BY is 80% configurable, 20% customizable. Heavy customization (&gt;$200K) triggers technical debt and slower upgrades. SaaS updates can break custom code. Always recommend configuration-first approach.</li>' +
    '<li><strong>SaaS uptime:</strong> Typically 99.5% — translates to ~4 hours/month potential downtime. No local failover. Plan for downtime windows in your operational model.</li>' +
    '<li><strong>Reporting:</strong> Broad but not deep. Custom KPIs require BI tool integration (Tableau, Power BI). Budget 6-8 weeks for a custom reporting layer.</li>' +
  '</ul>' +

  '<h3>Configuration Essentials for IES</h3>' +
  '<p>IES designers don\'t configure BY WMS directly, but understanding these areas helps you design proper requirements:</p>' +
  '<ul>' +
    '<li><strong>Activity Codes:</strong> Every task (Receive, Putaway, Pick, Pack, Ship, Repack, Return) gets an activity code that drives labor standards, billing, and reporting. Design your taxonomy upfront: Category → Task → SubTask.</li>' +
    '<li><strong>Work Types:</strong> Define pick methodologies (RF-Directed, Voice-Directed, Pick-to-Light, Batch, Zone). Each has different labor rates. Configure by zone — fast zone = voice, slow zone = RF.</li>' +
    '<li><strong>Location Types:</strong> Define hierarchy (Region → Zone → Aisle → Level → Position) with capacity, height clearance, hazmat flags, and client assignment attributes. These drive putaway rules and picking eligibility.</li>' +
    '<li><strong>Zones:</strong> Group locations for operational efficiency. Typical: Fast-Moving (A), Medium (B), Slow (C), Oversize, Hazmat, Returns, Staging, QA. Zone sequencing rules directly impact pick travel time.</li>' +
    '<li><strong>Wave Rules:</strong> Define order grouping — time-based, size-based, customer-based, or manual. Directly impacts dock processing time and labor distribution.</li>' +
    '<li><strong>Billing Rules:</strong> Define chargeable events: storage (per day/location/pallet), picks (per pick/SKU/order), labor (per hour/activity), shipping (per weight tier). Misconfigured billing = revenue leakage.</li>' +
  '</ul>' +
'</div>';

function showWiki(page) {
  var content = WIKI_PAGES[page];
  if (!content) return;
  document.getElementById('wikiContent').innerHTML = content;
  // Scroll to top of wiki content
  var wc = document.getElementById('wikiContent');
  if (wc) wc.scrollTop = 0;
  var main = document.querySelector('.main');
  if (main) main.scrollTop = 0;
  window.scrollTo(0, 0);
  // Also scroll the section header into view as fallback
  var hdr = document.querySelector('#sec-training .section-header');
  if (hdr) hdr.scrollIntoView({ behavior: 'instant', block: 'start' });
  // Update active nav
  document.querySelectorAll('.wiki-nav-item').forEach(function(item) { item.classList.remove('active'); });
  try {
    var clicked = window.event && window.event.target;
    if (clicked && clicked.classList.contains('wiki-nav-item')) clicked.classList.add('active');
  } catch(e) { /* called programmatically, no event */ }
}

// ═══════════════════════════════════════════════════════════════════════
// SECURITY SECTION
// ═══════════════════════════════════════════════════════════════════════

var SECURITY_PAGES = {};

// ─ OVERVIEW PAGE ─
SECURITY_PAGES['sec-overview'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Security / Overview</div>' +
  '<h2>Security Overview</h2>' +
  '<p>The IES Intelligence Hub is built on a modern, encrypted SaaS architecture designed to protect sensitive supply chain data. We prioritize security by default across every layer — from browser to database — and maintain continuous compliance with enterprise standards.</p>' +

  '<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:20px;margin:24px 0;">' +
    '<div style="display:flex;align-items:flex-start;gap:12px;">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 15 9"/></svg>' +
      '<div><strong style="color:#15803d;">Security is foundational, not an afterthought.</strong> We encrypt data in transit and at rest, enforce role-based access control, and audit all access logs.</div>' +
    '</div>' +
  '</div>' +

  '<h3 style="margin-top:32px;margin-bottom:16px;">Architecture Overview</h3>' +
  '<p style="margin-bottom:20px;font-size:13px;color:var(--ies-gray-600);">End-to-end encryption across all layers:</p>' +

  '<div style="background:#fff;border:1px solid var(--ies-gray-200);border-radius:10px;padding:24px;margin:20px 0;">' +
    '<div style="display:flex;flex-direction:column;gap:16px;font-size:13px;">' +
      // Browser layer
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div style="background:#0047ab;color:#fff;padding:8px 12px;border-radius:6px;font-weight:600;width:140px;text-align:center;font-size:12px;">Browser / SPA</div>' +
        '<div style="flex:1;height:2px;background:linear-gradient(90deg,#0047ab,#0047ab 50%,transparent 50%);position:relative;">' +
          '<svg style="position:absolute;right:-6px;top:-6px;width:14px;height:14px;" viewBox="0 0 24 24" fill="#0047ab"><polygon points="12,2 15,8 21,8 16.5,12 18,18 12,14 6,18 7.5,12 3,8 9,8"/></svg>' +
        '</div>' +
      '</div>' +
      '<div style="color:var(--ies-gray-600);font-size:11px;margin-left:140px;">React/SPA with secure session storage</div>' +

      // HTTPS/JWT layer
      '<div style="display:flex;align-items:center;gap:12px;margin-top:12px;">' +
        '<div style="background:#ff6b35;color:#fff;padding:8px 12px;border-radius:6px;font-weight:600;width:140px;text-align:center;font-size:12px;">HTTPS / JWT</div>' +
        '<div style="flex:1;height:2px;background:linear-gradient(90deg,#ff6b35,#ff6b35 50%,transparent 50%);position:relative;">' +
          '<svg style="position:absolute;right:-6px;top:-6px;width:14px;height:14px;" viewBox="0 0 24 24" fill="#ff6b35"><polygon points="12,2 15,8 21,8 16.5,12 18,18 12,14 6,18 7.5,12 3,8 9,8"/></svg>' +
        '</div>' +
      '</div>' +
      '<div style="color:var(--ies-gray-600);font-size:11px;margin-left:140px;">TLS 1.2+ encryption + JWT bearer tokens</div>' +

      // Supabase API layer
      '<div style="display:flex;align-items:center;gap:12px;margin-top:12px;">' +
        '<div style="background:#1c1c2e;color:#fff;padding:8px 12px;border-radius:6px;font-weight:600;width:140px;text-align:center;font-size:12px;">Supabase REST API</div>' +
        '<div style="flex:1;height:2px;background:linear-gradient(90deg,#1c1c2e,#1c1c2e 50%,transparent 50%);position:relative;">' +
          '<svg style="position:absolute;right:-6px;top:-6px;width:14px;height:14px;" viewBox="0 0 24 24" fill="#1c1c2e"><polygon points="12,2 15,8 21,8 16.5,12 18,18 12,14 6,18 7.5,12 3,8 9,8"/></svg>' +
        '</div>' +
      '</div>' +
      '<div style="color:var(--ies-gray-600);font-size:11px;margin-left:140px;">Authentication & authorization gateway</div>' +

      // Database layer
      '<div style="display:flex;align-items:center;gap:12px;margin-top:12px;">' +
        '<div style="background:#10b981;color:#fff;padding:8px 12px;border-radius:6px;font-weight:600;width:140px;text-align:center;font-size:12px;">PostgreSQL (RLS)</div>' +
        '<div style="flex:1;height:2px;background:linear-gradient(90deg,#10b981,#10b981 50%,transparent 50%);position:relative;">' +
          '<svg style="position:absolute;right:-6px;top:-6px;width:14px;height:14px;" viewBox="0 0 24 24" fill="#10b981"><polygon points="12,2 15,8 21,8 16.5,12 18,18 12,14 6,18 7.5,12 3,8 9,8"/></svg>' +
        '</div>' +
      '</div>' +
      '<div style="color:var(--ies-gray-600);font-size:11px;margin-left:140px;">AES-256 encryption + row-level security policies</div>' +
    '</div>' +
  '</div>' +

  '<h3 style="margin-top:32px;margin-bottom:16px;">Security Posture</h3>' +
  '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin:20px 0;">' +
    '<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:16px;text-align:center;">' +
      '<div style="font-size:32px;margin-bottom:8px;">🔐</div>' +
      '<div style="font-weight:600;color:#15803d;font-size:13px;margin-bottom:4px;">SOC 2 Type II</div>' +
      '<div style="font-size:11px;color:var(--ies-gray-600);">Supabase certified</div>' +
    '</div>' +
    '<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:16px;text-align:center;">' +
      '<div style="font-size:32px;margin-bottom:8px;">🔑</div>' +
      '<div style="font-weight:600;color:#15803d;font-size:13px;margin-bottom:4px;">AES-256</div>' +
      '<div style="font-size:11px;color:var(--ies-gray-600);">Data at rest encryption</div>' +
    '</div>' +
    '<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:16px;text-align:center;">' +
      '<div style="font-size:32px;margin-bottom:8px;">🔒</div>' +
      '<div style="font-weight:600;color:#15803d;font-size:13px;margin-bottom:4px;">TLS 1.2+</div>' +
      '<div style="font-size:11px;color:var(--ies-gray-600);">Data in transit encryption</div>' +
    '</div>' +
    '<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:16px;text-align:center;">' +
      '<div style="font-size:32px;margin-bottom:8px;">🗺️</div>' +
      '<div style="font-weight:600;color:#15803d;font-size:13px;margin-bottom:4px;">US Data</div>' +
      '<div style="font-size:11px;color:var(--ies-gray-600);">AWS us-east-1 region</div>' +
    '</div>' +
  '</div>' +
'</div>';

// ─ ACCESS CONTROL PAGE ─
SECURITY_PAGES['sec-access'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Security / Access Control & Authentication</div>' +
  '<h2>Access Control & Authentication</h2>' +
  '<p>We are transitioning from shared access codes (legacy) to enterprise-grade authentication with planned Azure AD SSO integration.</p>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Current State: Shared Access Codes</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-bottom:16px;">The Hub currently uses shared HTTP Basic Auth credentials for simplicity. This approach is being phased out in favor of user-specific authentication.</p>' +
  '<div style="background:#fff3cd;border:1px solid #ffecb5;border-radius:10px;padding:16px;margin:16px 0;display:flex;gap:12px;">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#856404" stroke-width="2" style="flex-shrink:0;margin-top:2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
    '<div style="font-size:13px;color:#856404;"><strong>Migration in Progress:</strong> Shared codes will be deprecated. User-specific accounts with role-based access control are coming in Phase 1.</div>' +
  '</div>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Future State: Supabase Auth + Azure AD SSO</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-bottom:16px;">Phase 1 (1–2 weeks) introduces user email accounts with temporary passwords. Phase 2 (4–6 weeks) brings Azure AD SSO integration for enterprise customers.</p>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Role-Based Access Control (RBAC)</h3>' +
  '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;border:1px solid var(--ies-gray-200);border-radius:8px;overflow:hidden;">' +
    '<tr style="background:var(--ies-gray-100);border-bottom:1px solid var(--ies-gray-200);">' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Role</th>' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Purpose</th>' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Permissions</th>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;font-weight:600;">Designer</td>' +
      '<td style="padding:12px;">Solutions architects & IES leads</td>' +
      '<td style="padding:12px;">Full access: all tools, all deals, audit logs</td>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;font-weight:600;">Leadership</td>' +
      '<td style="padding:12px;">Regional & program managers</td>' +
      '<td style="padding:12px;">View all deals & analytics; edit own records</td>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;font-weight:600;">Analyst</td>' +
      '<td style="padding:12px;">Finance & project teams</td>' +
      '<td style="padding:12px;">View own assigned records; run reports</td>' +
    '</tr>' +
    '<tr>' +
      '<td style="padding:12px;font-weight:600;">Viewer</td>' +
      '<td style="padding:12px;">Client stakeholders & advisors</td>' +
      '<td style="padding:12px;">Read-only access to assigned deal(s)</td>' +
    '</tr>' +
  '</table>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Session Management</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-bottom:12px;">Sessions are managed by Supabase:</p>' +
  '<ul style="font-size:13px;color:var(--ies-gray-600);margin-left:20px;margin-bottom:16px;">' +
    '<li>JWT tokens expire after 1 hour of inactivity</li>' +
    '<li>Refresh tokens allow re-authentication without re-entering credentials</li>' +
    '<li>Sessions are tied to specific browser/device (IP validation in roadmap)</li>' +
  '</ul>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Multi-Factor Authentication (MFA)</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);"><strong>Status:</strong> Planned for Phase 2. MFA via TOTP (authenticator apps) will be mandatory for Designer and Leadership roles.</p>' +
'</div>';

// ─ DATA PROTECTION PAGE ─
SECURITY_PAGES['sec-data'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Security / Data Protection</div>' +
  '<h2>Data Protection</h2>' +
  '<p>All sensitive data — financial models, client negotiations, supply chain intelligence — is encrypted at rest and in transit using industry-standard cryptography.</p>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Encryption at Rest</h3>' +
  '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin:16px 0;">' +
    '<div style="font-weight:600;color:#0369a1;margin-bottom:8px;">AES-256 Encryption</div>' +
    '<p style="font-size:13px;color:#0369a1;">All database tables are encrypted by Supabase using AWS KMS (Key Management Service). The encryption keys are managed by AWS and isolated from the application.</p>' +
  '</div>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-top:12px;">Files uploaded to the Hub (cost models, designs, attachments) are stored in Supabase Storage with the same encryption standard.</p>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Encryption in Transit</h3>' +
  '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin:16px 0;">' +
    '<div style="font-weight:600;color:#0369a1;margin-bottom:8px;">TLS 1.2+ (HTTPS)</div>' +
    '<p style="font-size:13px;color:#0369a1;">All communication between browser and server is encrypted using TLS 1.2 or higher. Outdated SSL/TLS versions are blocked.</p>' +
  '</div>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-top:12px;"><strong>Certificate:</strong> The site uses a valid SSL/TLS certificate issued by AWS Certificate Manager, renewed automatically.</p>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Data Residency</h3>' +
  '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;border:1px solid var(--ies-gray-200);border-radius:8px;overflow:hidden;">' +
    '<tr style="background:var(--ies-gray-100);border-bottom:1px solid var(--ies-gray-200);">' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Component</th>' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Location</th>' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Provider</th>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;font-weight:600;">Database (PostgreSQL)</td>' +
      '<td style="padding:12px;">AWS us-east-1 (N. Virginia)</td>' +
      '<td style="padding:12px;">Supabase/AWS</td>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;font-weight:600;">Storage (Files/Uploads)</td>' +
      '<td style="padding:12px;">AWS us-east-1 (N. Virginia)</td>' +
      '<td style="padding:12px;">Supabase/AWS S3</td>' +
    '</tr>' +
    '<tr>' +
      '<td style="padding:12px;font-weight:600;">CDN (Static Content)</td>' +
      '<td style="padding:12px;">Global with US primary</td>' +
      '<td style="padding:12px;">GitHub Pages / CDN</td>' +
    '</tr>' +
  '</table>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-top:16px;"><strong>All data is stored within the United States.</strong> If you require data residency outside the US, please contact the security team.</p>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Backups & Recovery</h3>' +
  '<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:16px;margin:16px 0;">' +
    '<div style="font-weight:600;color:#15803d;margin-bottom:8px;">Automatic Daily Backups</div>' +
    '<ul style="font-size:13px;color:#15803d;margin-left:20px;">' +
      '<li>Supabase performs daily automated backups of the entire database</li>' +
      '<li>Point-in-time recovery (PITR) available up to 7 days</li>' +
      '<li>Backup data is encrypted using the same AES-256 standard</li>' +
      '<li>RTO (Recovery Time Objective): &lt;4 hours</li>' +
    '</ul>' +
  '</div>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Data Retention & Deletion</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-bottom:12px;">Data retention policies follow GXO\s internal standards:</p>' +
  '<ul style="font-size:13px;color:var(--ies-gray-600);margin-left:20px;margin-bottom:16px;">' +
    '<li><strong>Active Records:</strong> Kept indefinitely unless deleted by user or GXO legal request</li>' +
    '<li><strong>Deleted Records:</strong> Soft-deleted (marked as deleted); hard-deleted after 90 days</li>' +
    '<li><strong>Audit Logs:</strong> Retained for 12 months for compliance</li>' +
    '<li><strong>User Data Deletion Requests:</strong> Processed within 30 days of formal request</li>' +
  '</ul>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Row-Level Security (RLS)</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-bottom:12px;">RLS is a database-level access control mechanism that ensures users can only access data they are authorized to see, regardless of the application logic.</p>' +
  '<div style="background:#f3e8ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px;margin:16px 0;font-size:13px;color:#6b21a8;">' +
    '<strong>Current Status:</strong> RLS is enabled on the <code>deals</code> and <code>projects</code> tables. Full RLS coverage for all tables is coming in Phase 2.' +
  '</div>' +
'</div>';

// ─ COMPLIANCE PAGE ─
SECURITY_PAGES['sec-compliance'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Security / Compliance & Standards</div>' +
  '<h2>Compliance & Standards</h2>' +
  '<p>The IES Intelligence Hub leverages Supabase\s SOC 2 Type II certification and is designed to meet enterprise data governance requirements.</p>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Supabase SOC 2 Type II Certification</h3>' +
  '<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:16px;margin:16px 0;">' +
    '<div style="font-weight:600;color:#15803d;margin-bottom:8px;">✓ Certified & Audited</div>' +
    '<p style="font-size:13px;color:#15803d;">Supabase has completed a SOC 2 Type II audit, covering:<ul style="margin-left:20px;margin-top:8px;"><li>Security: Access controls, encryption, vulnerability management</li><li>Availability: 99.9% uptime SLA</li><li>Integrity: Data accuracy and consistency</li><li>Confidentiality: Data protection measures</li></ul></p>' +
  '</div>' +
  '<p style="font-size:12px;color:var(--ies-gray-600);margin-top:12px;"><a href="https://supabase.com/security" target="_blank" style="color:var(--ies-blue);text-decoration:none;">View Supabase Security Center</a></p>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Data Classification Framework</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-bottom:16px;">All data in the Hub is classified into tiers, each with distinct handling and retention requirements:</p>' +
  '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;border:1px solid var(--ies-gray-200);border-radius:8px;overflow:hidden;">' +
    '<tr style="background:var(--ies-gray-100);border-bottom:1px solid var(--ies-gray-200);">' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Classification</th>' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Examples</th>' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Access</th>' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Encryption</th>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;"><span style="background:#e0e7ff;color:#3730a3;padding:2px 6px;border-radius:4px;font-weight:600;font-size:11px;">General</span></td>' +
      '<td style="padding:12px;font-size:12px;">Training wiki, general guides</td>' +
      '<td style="padding:12px;font-size:12px;">Authenticated users</td>' +
      '<td style="padding:12px;font-size:12px;">In transit (HTTPS)</td>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;"><span style="background:#dbeafe;color:#0c4a6e;padding:2px 6px;border-radius:4px;font-weight:600;font-size:11px;">Internal</span></td>' +
      '<td style="padding:12px;font-size:12px;">Deal summaries, project templates</td>' +
      '<td style="padding:12px;font-size:12px;">GXO staff only</td>' +
      '<td style="padding:12px;font-size:12px;">Rest + transit</td>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;"><span style="background:#fce7f3;color:#831843;padding:2px 6px;border-radius:4px;font-weight:600;font-size:11px;">Confidential</span></td>' +
      '<td style="padding:12px;font-size:12px;">Financial models, cost data, contracts</td>' +
      '<td style="padding:12px;font-size:12px;">IES team + authorized client</td>' +
      '<td style="padding:12px;font-size:12px;">Rest + transit + RLS</td>' +
    '</tr>' +
    '<tr>' +
      '<td style="padding:12px;"><span style="background:#fee2e2;color:#7c2d12;padding:2px 6px;border-radius:4px;font-weight:600;font-size:11px;">Restricted</span></td>' +
      '<td style="padding:12px;font-size:12px;">Audit logs, credentials, PII</td>' +
      '<td style="padding:12px;font-size:12px;">Security team only</td>' +
      '<td style="padding:12px;font-size:12px;">Rest + transit + RLS + audit</td>' +
    '</tr>' +
  '</table>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Row-Level Security (RLS) Status</h3>' +
  '<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:16px;margin:16px 0;">' +
    '<div style="font-weight:600;color:#15803d;margin-bottom:8px;">Status: Partial (Phase 1) → Full (Phase 2)</div>' +
    '<ul style="font-size:13px;color:#15803d;margin-left:20px;">' +
      '<li><strong>Phase 1 (Current):</strong> RLS enabled on <code>deals</code>, <code>projects</code>, <code>feedback</code> tables</li>' +
      '<li><strong>Phase 2:</strong> RLS enabled on all data tables; granular field-level access controls</li>' +
    '</ul>' +
  '</div>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Data Processing Agreement (DPA)</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-bottom:12px;">A Data Processing Agreement is available upon request and outlines how GXO and Supabase handle personal and sensitive data in compliance with privacy regulations.</p>' +
  '<div style="background:#fff3cd;border:1px solid #ffecb5;border-radius:10px;padding:12px;font-size:12px;color:#856404;">To request the DPA, contact the GXO Security Team.</div>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Third-Party Integrations</h3>' +
  '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;border:1px solid var(--ies-gray-200);border-radius:8px;overflow:hidden;">' +
    '<tr style="background:var(--ies-gray-100);border-bottom:1px solid var(--ies-gray-200);">' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Service</th>' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Purpose</th>' +
      '<th style="padding:12px;text-align:left;font-weight:700;">Compliance</th>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;font-weight:600;">Supabase</td>' +
      '<td style="padding:12px;">Database, auth, storage</td>' +
      '<td style="padding:12px;">SOC 2 Type II, DPA available</td>' +
    '</tr>' +
    '<tr style="border-bottom:1px solid var(--ies-gray-200);">' +
      '<td style="padding:12px;font-weight:600;">GitHub Pages</td>' +
      '<td style="padding:12px;">Static content hosting</td>' +
      '<td style="padding:12px;">Enterprise agreement, HIPAA eligible</td>' +
    '</tr>' +
    '<tr>' +
      '<td style="padding:12px;font-weight:600;">Azure AD (Planned)</td>' +
      '<td style="padding:12px;">Single sign-on (Phase 2)</td>' +
      '<td style="padding:12px;">SOC 2 Type II, DPA available</td>' +
    '</tr>' +
  '</table>' +
'</div>';

// ─ INCIDENT RESPONSE PAGE ─
SECURITY_PAGES['sec-incident'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Security / Incident Response</div>' +
  '<h2>Incident Response</h2>' +
  '<p>We maintain a clear process for reporting, investigating, and resolving security incidents to minimize impact and maintain transparency.</p>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">How to Report a Security Issue</h3>' +
  '<div style="background:#fef2f2;border:1px solid #fee2e2;border-radius:10px;padding:16px;margin:16px 0;">' +
    '<div style="font-weight:600;color:#991b1b;margin-bottom:12px;">Do not post security vulnerabilities publicly.</div>' +
    '<p style="font-size:13px;color:#991b1b;margin-bottom:12px;">If you discover a potential security vulnerability, please report it directly to the GXO Security Team:</p>' +
    '<div style="background:rgba(255,255,255,0.5);border-left:3px solid #991b1b;padding:12px;border-radius:4px;font-family:monospace;font-size:12px;color:#1c1c2e;">security@gxo.com</div>' +
    '<p style="font-size:12px;color:#991b1b;margin-top:12px;">Include: vulnerability description, affected component, steps to reproduce, and your contact information.</p>' +
  '</div>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Investigation Process</h3>' +
  '<ol style="font-size:13px;color:var(--ies-gray-600);margin-left:20px;">' +
    '<li><strong>Initial Assessment (0–4 hours):</strong> Security team confirms receipt and determines severity</li>' +
    '<li><strong>Containment (4–24 hours):</strong> Affected systems are isolated; data access logs are reviewed</li>' +
    '<li><strong>Remediation (24–72 hours):</strong> Fix is developed, tested, and deployed</li>' +
    '<li><strong>Verification:</strong> Patch is validated; no regression is confirmed</li>' +
    '<li><strong>Post-Incident Review:</strong> Root cause analysis and process improvements documented</li>' +
  '</ol>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Notification Timeline</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-bottom:16px;">If an incident affects user data, affected parties are notified within 72 hours of discovery, as required by data protection regulations:</p>' +
  '<ul style="font-size:13px;color:var(--ies-gray-600);margin-left:20px;margin-bottom:16px;">' +
    '<li><strong>High severity:</strong> Within 24 hours</li>' +
    '<li><strong>Medium severity:</strong> Within 48 hours</li>' +
    '<li><strong>Low severity:</strong> Within 72 hours (or if no PII exposure)</li>' +
  '</ul>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Data Deletion Requests</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);margin-bottom:12px;">To request deletion of personal data or an entire deal record:</p>' +
  '<ol style="font-size:13px;color:var(--ies-gray-600);margin-left:20px;margin-bottom:16px;">' +
    '<li>Submit a formal request to <span style="font-family:monospace;color:var(--ies-blue);">security@gxo.com</span></li>' +
    '<li>Specify the data to be deleted and reason for deletion</li>' +
    '<li>Security team reviews and approves within 5 business days</li>' +
    '<li>Data is deleted; confirmation is provided</li>' +
    '<li>Deletion is verified by a second team member</li>' +
  '</ol>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Post-Incident Review</h3>' +
  '<p style="font-size:13px;color:var(--ies-gray-600);">After any security incident, a blameless post-incident review is conducted to:</p>' +
  '<ul style="font-size:13px;color:var(--ies-gray-600);margin-left:20px;">' +
    '<li>Document what happened and why</li>' +
    '<li>Identify systemic improvements to prevent recurrence</li>' +
    '<li>Update security documentation and procedures</li>' +
    '<li>Share lessons learned (anonymized) with the team</li>' +
  '</ul>' +
'</div>';

// ─ ROADMAP PAGE ─
SECURITY_PAGES['sec-roadmap'] = '<div class="wiki-article">' +
  '<div class="wiki-breadcrumb">Security / Security Roadmap</div>' +
  '<h2>Security Roadmap</h2>' +
  '<p>We are implementing a phased security hardening program to reach enterprise-grade controls. The roadmap below outlines our 2026 plans.</p>' +

  '<h3 style="margin-top:28px;margin-bottom:24px;display:flex;align-items:center;gap:10px;">' +
    '<span style="display:inline-block;background:#10b981;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">1</span>' +
    'Phase 1: Authentication & Audit (1–2 Weeks)' +
  '</h3>' +
  '<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:20px;margin:16px 0;">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px;">' +
      '<div>' +
        '<div style="font-weight:600;color:#15803d;margin-bottom:8px;">📋 Tasks</div>' +
        '<ul style="font-size:13px;color:#15803d;margin-left:16px;">' +
          '<li>Deploy Supabase Auth email/password</li>' +
          '<li>Create roles table (Designer, Leadership, Analyst, Viewer)</li>' +
          '<li>Enable RLS on all core tables</li>' +
          '<li>Implement audit logging (login, data access, modifications)</li>' +
          '<li>Publish Security section to hub</li>' +
        '</ul>' +
      '</div>' +
      '<div>' +
        '<div style="font-weight:600;color:#15803d;margin-bottom:8px;">✓ Deliverables</div>' +
        '<ul style="font-size:13px;color:#15803d;margin-left:16px;">' +
          '<li>User accounts with role-based permissions</li>' +
          '<li>Audit log table with 12-month retention</li>' +
          '<li>Security documentation (this section)</li>' +
          '<li>RLS policies on all tables</li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div style="border-top:1px solid #dcfce7;padding-top:12px;font-size:12px;color:#15803d;"><strong>Effort:</strong> 40–50 hours | <strong>Cost:</strong> Supabase standard plan upgrade</div>' +
  '</div>' +

  '<h3 style="margin-top:28px;margin-bottom:24px;display:flex;align-items:center;gap:10px;">' +
    '<span style="display:inline-block;background:#0047ab;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">2</span>' +
    'Phase 2: Enterprise Architecture (4–6 Weeks)' +
  '</h3>' +
  '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px;margin:16px 0;">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px;">' +
      '<div>' +
        '<div style="font-weight:600;color:#0369a1;margin-bottom:8px;">📋 Tasks</div>' +
        '<ul style="font-size:13px;color:#0369a1;margin-left:16px;">' +
          '<li>Migrate to dedicated Supabase project (prod-only)</li>' +
          '<li>Implement custom security headers (CSP, HSTS)</li>' +
          '<li>Deploy Azure AD SSO integration</li>' +
          '<li>Field-level RLS (masking sensitive fields)</li>' +
          '<li>Implement MFA for Designer role</li>' +
        '</ul>' +
      '</div>' +
      '<div>' +
        '<div style="font-weight:600;color:#0369a1;margin-bottom:8px;">✓ Deliverables</div>' +
        '<ul style="font-size:13px;color:#0369a1;margin-left:16px;">' +
          '<li>Azure AD SSO in production</li>' +
          '<li>Custom security headers active</li>' +
          '<li>MFA enforcement for high-risk roles</li>' +
          '<li>Field-level encryption for sensitive data</li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div style="border-top:1px solid #bae6fd;padding-top:12px;font-size:12px;color:#0369a1;"><strong>Effort:</strong> 80–100 hours | <strong>Cost:</strong> Azure AD Premium licensing + security consulting</div>' +
  '</div>' +

  '<h3 style="margin-top:28px;margin-bottom:24px;display:flex;align-items:center;gap:10px;">' +
    '<span style="display:inline-block;background:#ff6b35;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">3</span>' +
    'Phase 3: Ongoing Hardening' +
  '</h3>' +
  '<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:20px;margin:16px 0;">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px;">' +
      '<div>' +
        '<div style="font-weight:600;color:#92400e;margin-bottom:8px;">📋 Continuous Tasks</div>' +
        '<ul style="font-size:13px;color:#92400e;margin-left:16px;">' +
          '<li>Quarterly penetration testing</li>' +
          '<li>Annual third-party security audit</li>' +
          '<li>SIEM integration (CloudTrail, VPC Flow Logs)</li>' +
          '<li>Vulnerability scanning (Snyk, Dependabot)</li>' +
          '<li>Incident response drills</li>' +
        '</ul>' +
      '</div>' +
      '<div>' +
        '<div style="font-weight:600;color:#92400e;margin-bottom:8px;">✓ Outcomes</div>' +
        '<ul style="font-size:13px;color:#92400e;margin-left:16px;">' +
          '<li>Zero-trust architecture</li>' +
          '<li>Real-time threat detection</li>' +
          '<li>Compliance ready for SOC 2 renewal</li>' +
          '<li>Enterprise security posture</li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div style="border-top:1px solid #fcd34d;padding-top:12px;font-size:12px;color:#92400e;"><strong>Effort:</strong> Ongoing (10–15 hrs/quarter) | <strong>Cost:</strong> ~$2K–5K/year for tooling</div>' +
  '</div>' +

  '<h3 style="margin-top:28px;margin-bottom:16px;">Summary Timeline</h3>' +
  '<div style="background:#fff;border:1px solid var(--ies-gray-200);border-radius:10px;overflow:hidden;margin:16px 0;">' +
    '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:1px solid var(--ies-gray-200);">' +
      '<div style="padding:12px;text-align:center;border-right:1px solid var(--ies-gray-200);font-weight:600;color:var(--ies-navy);">Phase</div>' +
      '<div style="padding:12px;text-align:center;border-right:1px solid var(--ies-gray-200);font-weight:600;color:var(--ies-navy);">Timeline</div>' +
      '<div style="padding:12px;text-align:center;font-weight:600;color:var(--ies-navy);">Status</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:1px solid var(--ies-gray-200);">' +
      '<div style="padding:12px;border-right:1px solid var(--ies-gray-200);">Phase 1</div>' +
      '<div style="padding:12px;border-right:1px solid var(--ies-gray-200);font-size:12px;">1–2 weeks</div>' +
      '<div style="padding:12px;"><span style="background:#dcfce7;color:#15803d;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;">IN PROGRESS</span></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:1px solid var(--ies-gray-200);">' +
      '<div style="padding:12px;border-right:1px solid var(--ies-gray-200);">Phase 2</div>' +
      '<div style="padding:12px;border-right:1px solid var(--ies-gray-200);font-size:12px;">4–6 weeks</div>' +
      '<div style="padding:12px;"><span style="background:#bae6fd;color:#0369a1;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;">PLANNED</span></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));">' +
      '<div style="padding:12px;border-right:1px solid var(--ies-gray-200);">Phase 3</div>' +
      '<div style="padding:12px;border-right:1px solid var(--ies-gray-200);font-size:12px;">Ongoing</div>' +
      '<div style="padding:12px;"><span style="background:#fce7f3;color:#831843;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;">QUEUED</span></div>' +
    '</div>' +
  '</div>' +
'</div>';

function showSecurityPage(page) {
  var content = SECURITY_PAGES[page];
  if (!content) return;
  document.getElementById('securityContent').innerHTML = content;
  // Scroll to top
  var sc = document.getElementById('securityContent');
  if (sc) sc.scrollTop = 0;
  window.scrollTo(0, 0);
  // Update active nav
  document.querySelectorAll('#sec-security .wiki-nav-item').forEach(function(item) { item.classList.remove('active'); });
  try {
    var clicked = window.event && window.event.target;
    if (clicked && clicked.classList.contains('wiki-nav-item')) clicked.classList.add('active');
  } catch(e) { /* called programmatically, no event */ }
}

// Initialize with Overview page on load
document.addEventListener('DOMContentLoaded', function() {
  try {
    showSecurityPage('sec-overview');
  } catch(e) { console.error('Error:', e); }
});
