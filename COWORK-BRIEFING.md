# IES Intelligence Hub V2 — Cowork Briefing

## What Changed

The IES Hub has been modularized from a single 37,708-line `index.html` into a thin HTML shell + 15 separate JavaScript files. The original monolith (V1) remains live and untouched at its existing URL. V2 is deployed separately at:

- **V2 URL:** https://brockeckles.github.io/ies-hub-v2/
- **V2 Repo:** https://github.com/brockeckles/ies-hub-v2

No functionality was changed. All features, logic, and UI work identically to V1.

---

## Architecture

### index.html (10,699 lines)
Contains **only**:
- All HTML structure (the DOM)
- All CSS (~5,100 lines of embedded styles)
- A small inline auth check script (Supabase session validation)
- 15 `<script src="js/...">` tags that load the JS modules

**index.html has zero application logic.** All JavaScript was extracted into the `js/` directory.

### js/ Directory — 15 Modules (26,555 lines total)

Files load in this order via `<script>` tags (order matters — dependencies must load first):

| # | File | Lines | What It Contains |
|---|------|-------|-----------------|
| 1 | `core.js` | 726 | Supabase client init, `esc()` XSS helper, `showSectionError()`/`clearSectionError()` error banners, `verticalMeta`, `MARKET_PINS`, `navigate()`, search, guided tour, tab switching, deal context bar, `refreshData()`, `updateTimestamp()` |
| 2 | `wiki-content.js` | 3,018 | All 24 `WIKI_PAGES` + 6 `SECURITY_PAGES` data assignments, `showWiki()`, `showSecurityPage()` |
| 3 | `command-center.js` | 455 | `loadSPCompetitors`, `loadSPAutomation`, `loadSPVerticals`, `loadSPSupplyChain`, `loadSPLabor`, `loadSPTariffTrade`, `loadSectorPulse`, `loadSignalFeed`, diesel/labor/pipeline/freight charts, KPI strip, alerts, `loadAllData()` |
| 4 | `market-explorer.js` | 316 | `initMap()`, `colorPinsByLabor()`, `getMarketData()`, `selectMarket()`, score color helpers |
| 5 | `deal-management.js` | 2,398 | Project Management (`PM_STAGES`, all `pm*` functions), Deal Management (`dm*` functions), Deal Analytics (`da*` functions) |
| 6 | `design-tools.js` | 489 | Landing page show/hide for all design tools, scenario copy/delete helpers, `cmToggleNavGroup()`, `netoptImportFromCOG()`, `startSectionTour()` |
| 7 | `network-opt.js` | 5,843 | **Largest module.** Center of Gravity tool, Warehouse Sizing Calculator (full calculator + layout engine + manual mode + scenario persistence), Simple Network tool, Enterprise Network Optimization (GLPK solver, sensitivity analysis, heatmap) |
| 8 | `change-management.js` | 1,299 | ADKAR methodology tracker, initiatives, activities, flowchart editor |
| 9 | `analytics.js` | 401 | Session tracking, page view tracking, 30-second heartbeat, analytics dashboard rendering |
| 10 | `feedback.js` | 282 | `fbOpenModal()`, `fbSubmit()`, `fbLoadAll()`, `fbRenderCards()`, `fbUpvote()` |
| 11 | `cost-model.js` | 5,809 | `cmFetchTable()`, `cmApp` object (~4,000 lines), `dealApp` object (~1,100 lines), `cmToggleDealGroup()`, `dtSyncActiveTab()`, `showDesignTool()` |
| 12 | `fleet-modeler.js` | 1,510 | `fmApp` object with all methods, `fmShowLanding()`, `fmShowTool()`, `fmNewScenario()` |
| 13 | `most-standards.js` | 1,391 | `mostApp` object with all methods (init, switchMode, filterTemplates, etc.) |
| 14 | `deck-generator.js` | 2,027 | `deckGen` object with PptxGenJS integration, 4 deck types |
| 15 | `admin-panel.js` | 591 | `loadAdminPanel()`, `switchAdminTab()`, `loadAdminTable()`, `showAdminFormModal()`, `saveAdminRow()`, `deleteAdminRow()` |

---

## Critical Rules for Making Changes

### 1. All functions are global
There are no ES modules, no `import`/`export`. Every function defined in any JS file is a global. This is intentional — the HTML has hundreds of inline `onclick="functionName()"` handlers that reference these globals directly.

**When you add a new function, it must be a global.** Do not wrap code in IIFEs or module patterns.

### 2. Load order matters
The `<script>` tags in `index.html` load synchronously in order. If module B calls a function from module A, module A must load first. The current order is already correct. If you add a new module, place its `<script>` tag after any modules it depends on.

The dependency chain is:
```
core.js (must be first — everything depends on esc(), navigate(), Supabase client)
  -> wiki-content.js (depends on core for showWiki shell)
  -> command-center.js (depends on core for Supabase, esc)
  -> market-explorer.js (depends on core for MARKET_PINS)
  -> deal-management.js (depends on core for Supabase, esc)
  -> design-tools.js (depends on deal-management, network-opt functions exist by call-time)
  -> network-opt.js (depends on core for Supabase, esc)
  -> change-management.js (depends on core)
  -> analytics.js (depends on core for Supabase)
  -> feedback.js (depends on core for Supabase, esc)
  -> cost-model.js (depends on core for Supabase, esc; design-tools for showDesignTool)
  -> fleet-modeler.js (depends on core)
  -> most-standards.js (depends on core)
  -> deck-generator.js (depends on core, may reference data from other modules)
  -> admin-panel.js (depends on core for Supabase, esc)
```

### 3. Where to put new code
- **New feature in an existing section?** Add it to that section's JS file.
- **New standalone tool/section?** Create a new `js/new-tool.js` file and add a `<script src="js/new-tool.js">` tag in `index.html` after its dependencies.
- **New HTML/CSS?** Goes in `index.html`. All markup and styles live there.
- **Shared utility function?** Add it to `core.js`.

### 4. XSS protection
All user-supplied or database-fetched strings inserted into innerHTML **must** be escaped with `esc()` (defined in `core.js`). This includes: names, descriptions, URLs, form values, table cell contents, card titles, etc.

```javascript
// WRONG — XSS vulnerability
el.innerHTML = '<div>' + row.name + '</div>';

// RIGHT
el.innerHTML = '<div>' + esc(row.name) + '</div>';
```

### 5. Error handling for API calls
Use `showSectionError(sectionId, message)` and `clearSectionError(sectionId)` (defined in `core.js`) to show user-facing error banners when Supabase calls fail. Don't let errors fail silently.

### 6. No build step
There is no bundler, no transpiler, no npm. Just plain HTML/CSS/JS served as static files via GitHub Pages. To deploy changes: commit, push to `main`, GitHub Pages rebuilds automatically.

---

## Security Fixes Applied (V1 + V2)

These were applied to V1 first, then carried into V2:

- **XSS escaping** via `esc()` across 20+ innerHTML injection points: signal feed URLs, network opt tables, fleet modeler tables, deal cards, opportunity/task forms, change management forms, admin panel rows, cost model cards, artifact buttons, competitor names, customer options
- **Enhanced `esc()` function** now escapes single quotes (`'` -> `&#39;`) in addition to `&`, `<`, `>`, `"`
- **`href="javascript:void(0)"`** on all 10 sidebar nav links (prevents page jump)

## Accessibility Fixes Applied

- `<main class="main" role="main">` semantic landmark (was `<div>`)
- ARIA labels on sidebar nav links
- `tabindex="0"` on interactive elements
- Proper `role` attributes on dynamic content areas

## Performance Fixes Applied

- **DOM query caching** in `navigate()` function (`_navSections`, `_navItems`)
- **Tour element caching** via `_getTourEls()`
- **CSS hover class** `.dt-tool-card` replacing 7 inline `onmouseover`/`onmouseout` JS handlers

---

## Backend (Unchanged)

- **Supabase PostgreSQL** with anonymous key (no RLS)
- Same project, same tables, same API
- The Supabase client is initialized in `core.js` with the same credentials

---

## File Locations

```
IES Hub V2/
  index.html              <- HTML shell + CSS (10,699 lines)
  index_original.html     <- Original monolith backup (local only, not in repo)
  .gitignore              <- Excludes index_original.html
  js/
    core.js               <- Shared utilities, nav, Supabase init
    wiki-content.js       <- Wiki/security page content
    command-center.js     <- Dashboard data loaders + charts
    market-explorer.js    <- Leaflet map + market data
    deal-management.js    <- PM, deals, deal analytics
    design-tools.js       <- Tool landing pages, scenario helpers
    network-opt.js        <- WSC, COG, network tools, GLPK solver
    change-management.js  <- ADKAR, initiatives, flowchart
    analytics.js          <- Usage tracking + dashboard
    feedback.js           <- Feedback modal + cards
    cost-model.js         <- Cost modeling + deal app
    fleet-modeler.js      <- Fleet optimization tool
    most-standards.js     <- MOST labor standards
    deck-generator.js     <- PowerPoint export
    admin-panel.js        <- Admin CRUD interface
```

---

## Testing Changes

Since there are no automated tests, after making changes:

1. Open the browser console (F12 -> Console)
2. Load the page — check for any red errors
3. Navigate to the section you changed
4. Test all interactive elements (buttons, forms, dropdowns, modals)
5. Check that data loads from Supabase correctly
6. Verify no console errors during interaction

---

## What This Is NOT

This is not a framework-based app. There is no React, Vue, Angular, or build toolchain. It is plain vanilla HTML/CSS/JS with global functions and inline event handlers. This is intentional for simplicity and zero-tooling deployment. Treat it accordingly — don't introduce patterns that assume a module system or build step.
