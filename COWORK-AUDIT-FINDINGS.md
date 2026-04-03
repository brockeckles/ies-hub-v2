# IES Hub V2 — Cowork Design Tool Audit Findings
**Date:** 2026-04-03
**Audited by:** Cowork (parallel agents, one per tool)
**Scope:** All 7 design tools in v2 modular codebase

---

## Tier 1 — Data Integrity (Fix First)

### 1.1 WSC: Wrong Element IDs in wscCollectInputs()
**File:** `js/network-opt.js` lines 2506-2508
**Severity:** BLOCKER

`wscCollectInputs()` reads from non-existent element IDs:
```javascript
// CURRENT (broken):
var totalSfEl = document.getElementById('wsc-res-total-sqft');
var positionsEl = document.getElementById('wsc-res-positions');
var docksEl = document.getElementById('wsc-res-docks');

// CORRECT (actual IDs in HTML):
var totalSfEl = document.getElementById('wsc-r-sqft');
var positionsEl = document.getElementById('wsc-r-positions');
var docksEl = document.getElementById('wsc-r-docks');
```
**Impact:** Saved scenarios lose all result data — total sqft, positions, dock doors all save as 0.

---

### 1.2 Cost Model: Child Tables Not Persisted
**File:** `js/cost-model.js` lines 4457-4520
**Severity:** BLOCKER

Labor, equipment, overhead, VAS, startup, and volume line rows are NOT saved to Supabase. Users edit rows in UI, data stores in-memory only. On reload, all granular cost data is lost — only annual totals and pricing buckets survive.

**Affected tables:** `cost_model_labor`, `cost_model_equipment`, `cost_model_overhead`, `cost_model_vas`, `cost_model_volumes`

**Fix:** After project save, iterate through `projectData.laborLines[]`, `equipmentLines[]`, etc. and POST each to their respective Supabase tables.

---

### 1.3 Cost Model: deal_id vs deal_deals_id Mismatch
**File:** `js/cost-model.js` line 4514
**Severity:** BUG

Save function writes to `deal_id` column, but all load/fetch queries use `deal_deals_id`. Cost models don't appear as linked to deals.

**Fix:** Use `deal_deals_id` consistently throughout.

---

## Tier 2 — XSS Security Sweep

### 2.1 Global esc() Sweep Required
**Severity:** BLOCKER (across all modules)

Every tool has unescaped user/DB data in innerHTML. The `esc()` function exists in `core.js` but coverage is ~40%. Here is every location that needs wrapping:

#### network-opt.js
- Line 288: City dropdown — `matches[i].c` in onclick
- Lines 3687, 3692-3693: WSC scenario landing — `s.scenario_name`, `s.id` in onclick
- Lines 3737-3748: NET scenario landing — same pattern
- Lines 3790-3801: NetOpt scenario landing — `s.scenario_name`, `s.id`
- Lines 6221-6227: Allocation table — `row.demand`, `row.city`, `row.facility`
- Lines 5809, 5819, 5825, 5830, 5836: Recommendation panel — facility `.name` fields

#### cost-model.js
- Line 3644: `validateBucketAssignment()` — labor activity names, equipment names
- Line 2004: `cm.environment_type` in template literal
- Line 4627-4640: Some spots already use `esc()` — verify full coverage

#### fleet-modeler.js
- Line 42: `s.name` in landing card innerHTML
- Line 44: `s.notes` in landing card innerHTML
- Line 1103: `s.name` in renderScenariosListLocal template literal

#### most-standards.js (10+ locations)
- Line 449: `t.activity_name` in renderTemplateGrid
- Line 450: `t.equipment_type`, `t.wms_transaction`
- Line 503: `t.activity_name` in showDetail
- Line 504: `t.equipment_type`, `t.wms_transaction`, `t.uom`, `t.pick_method`
- Lines 552-570: `el.element_name`, `el.most_sequence`, `el.variable_driver`
- Lines 688-714: renderEditorTable — input values and onclick handlers
- Lines 970-975: renderAnalysisTable — `tmpl.activity_name`
- Lines 1172-1180: renderComposer — `tmpl.activity_name`
- Line 800, 870: Error messages with `err.message`

#### deal-management.js
- Line 92: `c.name` in customer filter options
- Lines 130, 182: `o.name` in pipeline kanban and list view
- Lines 594-595: `t.title`, `t.description` in task display
- Line 599: `t.assignee`

**Pattern to apply everywhere:**
```javascript
// WRONG:
html += '<div>' + row.name + '</div>';

// RIGHT:
html += '<div>' + esc(row.name) + '</div>';

// For onclick handlers, also escape:
'onclick="loadItem(\'' + esc(item.id) + '\')"'
```

---

## Tier 3 — Functional Bugs

### 3.1 NetOpt: CSV Parcel Rate Parsing — No Validation
**File:** `js/network-opt.js` lines 3508-3520
**Severity:** BUG

`parseFloat()` silently returns NaN for non-numeric cells. No check that weights are ascending, no column count validation, no bounds checking. Malformed CSV breaks cost calculations silently.

**Fix:** Add numeric validation, column count check, and error feedback.

---

### 3.2 NetOpt: Transport Rate Inconsistency
**File:** `js/network-opt.js` lines 6191-6195
**Severity:** BUG

Allocation calculations use `netoptState.transport.outboundPerUnitMile` as fallback instead of the computed `tlUnitMile`/`ltlUnitMile`. LTL distance multiplier not applied in allocation calc.

**Fix:** Use `tlUnitMile` and `ltlUnitMile` consistently in allocation calculations. Apply distance multiplier for LTL.

---

### 3.3 Deal Manager: Wrong Column Name
**File:** `js/cost-model.js` line 5420
**Severity:** BUG

`p.project_name` referenced but `cost_model_projects` table uses `name`. Project names show as "(Untitled)" in prompt.

**Fix:** Change `p.project_name` to `p.name`.

---

### 3.4 Deal Manager: Stage Re-activation Logic
**File:** `js/cost-model.js` line 5681
**Severity:** BUG

`targetStageNum = deal.current_stage_id ? null : 1` — if current_stage_id exists, returns null, then line 5682 returns early. Stage 1 can only be activated once; re-activation silently fails.

---

### 3.5 Fleet Modeler: fmShowTool() Not Defined
**File:** `js/fleet-modeler.js`
**Severity:** BLOCKER

`fmShowTool()` is called from HTML (index.html lines 5816, 8002, 9068, 9357) but is NOT defined in fleet-modeler.js. Verify if it's in design-tools.js — if not, define it.

---

### 3.6 MOST: onclick Handler Quote Injection
**File:** `js/most-standards.js` lines 688-714
**Severity:** BUG

Editor table onclick handlers use string concatenation. Element names containing quotes (e.g., "John's Tool") break the handler syntax.

**Fix:** Use `escAttr()` or data attributes instead of string concatenation in onclick handlers.

---

### 3.7 MOST: Tour Not Registered
**File:** `js/design-tools.js` or `js/core.js`
**Severity:** BUG

`startSectionTour('most')` is called from HTML but no 'most' tour is registered in the tour engine. Button visible but non-functional.

---

### 3.8 Fleet Modeler: Division by Zero
**File:** `js/fleet-modeler.js` line 493
**Severity:** MINOR

If `config.utilization = 0`, `Math.ceil(vehiclesFromHours / 0)` = Infinity.

**Fix:** Add guard: `if (!this.config.utilization || this.config.utilization <= 0) this.config.utilization = 85;`

---

## Tier 4 — Architecture (Discuss with Brock)

### 4.1 Two Parallel Deal Systems
**Files:** `js/deal-management.js` + `js/cost-model.js`
**Severity:** BLOCKER (architectural)

Two separate systems with no cross-linking:
- **Opportunities** (deal-management.js) → `opportunities` table, PM-focused, hours-tracked
- **Deal Manager** (cost-model.js → dealApp) → `deal_deals` table, cost-model-focused, DOS project-gated

`deal_artifacts.deal_id` references EITHER table with no validation. Users must manually manage both.

**Recommendation:** Decide which is canonical. Either migrate opportunities → deal_deals or deprecate one system and bridge the other.

---

### 4.2 GLPK Not Actually Used
**File:** `js/network-opt.js`
**Severity:** INFO

GLPK.js is loaded via CDN but never called. NetOpt uses greedy + exhaustive heuristics. Works for small networks (<15 facilities) but exhaustive solver hangs on 50+ candidates.

**Recommendation:** Either implement GLPK LP formulation or add a warning when facility count exceeds threshold.

---

### 4.3 MOST Analysis Scenarios Not Persisted
**File:** `js/most-standards.js`
**Severity:** MINOR

`mostApp.scenarios` is in-memory only. Scenarios are lost on page reload.

**Recommendation:** Save to a `most_scenarios` Supabase table.

---

## Summary Count

| Severity | Count |
|----------|-------|
| BLOCKER | 5 (WSC IDs, CM child tables, CM deal_id, XSS sweep, fmShowTool) |
| BUG | 8 (CSV validation, transport rates, column names, stage logic, quote injection, tour, deal systems) |
| MINOR | 3 (division by zero, MOST persistence, GLPK) |

**Recommended fix order:** Tier 1 → Tier 2 → Tier 3 → Tier 4
