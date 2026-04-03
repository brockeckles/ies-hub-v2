// ═══════════════════════════════════════════════════════
// TOUR ENGINE v2 — Guided tours and onboarding flows
// ═══════════════════════════════════════════════════════

const TourEngine = {
  currentTour: null,
  currentStep: 0,
  isActive: false,
  spotlight: null,
  card: null,
  _initialized: false,
  _escHandler: null,

  init() {
    // Prevent double-init (script runs at end of body + DOMContentLoaded)
    if (this._initialized) return;
    this._initialized = true;

    // Spotlight — visual cutout with box-shadow, never blocks clicks
    this.spotlight = document.createElement('div');
    this.spotlight.className = 'tour-spotlight-v2';
    document.body.appendChild(this.spotlight);

    // Card — positioned tooltip with buttons, always clickable
    this.card = document.createElement('div');
    this.card.className = 'tour-card-v2';
    document.body.appendChild(this.card);

    // Escape key closes tour
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && TourEngine.isActive) TourEngine.closeTour();
    });
  },

  startTour(tourKey) {
    if (!TourDefinitions[tourKey]) {
      console.warn('Tour not found:', tourKey);
      return;
    }
    // Close any existing tour first
    if (this.isActive) this.closeTour();

    this.currentTour = TourDefinitions[tourKey];
    this.currentStep = 0;
    this.isActive = true;

    this.spotlight.classList.add('active');
    this.showStep();
  },

  showStep() {
    if (!this.currentTour || this.currentStep >= this.currentTour.steps.length) {
      this.closeTour();
      return;
    }

    var step = this.currentTour.steps[this.currentStep];
    var targetEl = document.querySelector(step.target);

    if (!targetEl) {
      console.warn('Tour: target not found, skipping:', step.target);
      this.currentStep++;
      if (this.currentStep < this.currentTour.steps.length) {
        this.showStep();
      } else {
        this.closeTour();
      }
      return;
    }

    // Scroll target into view
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    var self = this;
    setTimeout(function() {
      var rect = targetEl.getBoundingClientRect();
      var padding = step.padding || 8;

      // Position spotlight around target
      self.spotlight.style.top = (rect.top - padding) + 'px';
      self.spotlight.style.left = (rect.left - padding) + 'px';
      self.spotlight.style.width = (rect.width + padding * 2) + 'px';
      self.spotlight.style.height = (rect.height + padding * 2) + 'px';

      // Build card HTML with onclick handlers (no addEventListener needed)
      self.card.innerHTML = self.buildCardHTML(step);

      // Position card intelligently
      self.positionCard(rect);

      // Show card
      self.card.classList.add('active');
    }, 350);
  },

  positionCard(targetRect) {
    var cardWidth = 380;
    var cardHeight = 220;
    var gap = 16;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var top, left;

    // Try below target
    if (targetRect.bottom + gap + cardHeight < vh) {
      top = targetRect.bottom + gap;
    }
    // Try above target
    else if (targetRect.top - gap - cardHeight > 0) {
      top = targetRect.top - gap - cardHeight;
    }
    // Fallback: center vertically
    else {
      top = Math.max(16, (vh - cardHeight) / 2);
    }

    // Horizontal: center on target, clamped to viewport
    left = targetRect.left + (targetRect.width - cardWidth) / 2;
    left = Math.max(16, Math.min(vw - cardWidth - 16, left));

    // Use fixed positioning (no scrollY needed since position:fixed)
    this.card.style.top = top + 'px';
    this.card.style.left = left + 'px';
  },

  buildCardHTML(step) {
    var totalSteps = this.currentTour.steps.length;
    var stepNum = this.currentStep + 1;
    var isFirst = this.currentStep === 0;
    var isLast = this.currentStep === totalSteps - 1;

    // Progress dots
    var dots = '';
    for (var i = 0; i < totalSteps; i++) {
      dots += '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 3px;background:' + (i === this.currentStep ? 'var(--ies-blue)' : 'var(--ies-gray-200)') + ';transition:background 0.2s;"></span>';
    }

    return '<div style="text-align:center;">' +
      '<div class="tour-card-title" style="font-size:16px;font-weight:700;color:var(--ies-navy);margin-bottom:4px;">' + step.title + '</div>' +
      '<div style="font-size:11px;font-weight:700;color:var(--ies-blue);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">STEP ' + stepNum + ' OF ' + totalSteps + '</div>' +
      '<div style="font-size:13px;color:var(--ies-gray-600);line-height:1.6;margin-bottom:16px;">' + step.content + '</div>' +
      '<div style="margin-bottom:14px;">' + dots + '</div>' +
      '<div style="display:flex;gap:10px;justify-content:center;">' +
        '<button onclick="TourEngine.closeTour()" class="tour-btn" style="background:var(--ies-gray-100);color:var(--ies-gray-600);padding:8px 16px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:Montserrat,sans-serif;">Close</button>' +
        (isFirst ? '' : '<button onclick="TourEngine.prevStep()" class="tour-btn" style="background:var(--ies-gray-100);color:var(--ies-gray-600);padding:8px 16px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:Montserrat,sans-serif;">&larr; Back</button>') +
        '<button onclick="TourEngine.nextStep()" class="tour-btn" style="background:var(--ies-blue);color:#fff;padding:8px 20px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:Montserrat,sans-serif;">' + (isLast ? 'Done &rarr;' : 'Next &rarr;') + '</button>' +
      '</div>' +
    '</div>';
  },

  nextStep() {
    this.currentStep++;
    this.showStep();
  },

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep();
    }
  },

  closeTour() {
    this.isActive = false;
    this.currentTour = null;
    this.currentStep = 0;

    // Remove active states
    if (this.card) { this.card.classList.remove('active'); this.card.innerHTML = ''; }
    if (this.spotlight) this.spotlight.classList.remove('active');
  }
};

// ═══════════════════════════════════════════════════════
// TOUR DEFINITIONS — Step-by-step guides for each section
// ═══════════════════════════════════════════════════════

// Tour Definitions
const TourDefinitions = {
  overview: {
    name: 'Overview & Command Center',
    steps: [
      {
        target: '.kpi-strip',
        title: 'Key Performance Indicators',
        content: 'Track critical supply chain metrics at a glance — diesel prices, warehouse rates, wages, freight costs, and active RFP signals. Click any KPI card to explore that market in the Market Explorer.',
        padding: 12
      },
      {
        target: '.signal-feed',
        title: 'Intelligence Feed',
        content: 'Real-time market signals filtered by type: Competitor moves, Account news, Tariff changes, and RFP activity. Use the filter tabs to focus on what matters to your current deals.',
        padding: 12
      },
      {
        target: '#ccAlertBar',
        title: 'Active Alerts',
        content: 'Priority alerts for critical supply chain events — diesel surges, port congestion, competitor expansions. Check here first each morning for anything that impacts active deals.',
        padding: 8
      }
    ]
  },

  wiki: {
    name: 'Training Wiki',
    steps: [
      {
        target: '.wiki-sidebar',
        title: 'Topic Navigation',
        content: 'Browse the knowledge base by topic. Each category contains articles on IES processes, supply chain concepts, and operational best practices. Click any topic to load its content.',
        padding: 8
      },
      {
        target: '.wiki-nav-item',
        title: 'Article Selection',
        content: 'Select specific articles within each topic. Articles cover everything from cost modeling methodology to warehouse design principles and Blue Yonder WMS workflows.',
        padding: 8
      },
      {
        target: '#wikiContent',
        title: 'Article Content',
        content: 'Full article content with formatted text, tables, callouts, and specifications. Use this as your reference library when building proposals and cost models.',
        padding: 12
      }
    ]
  },

  deals: {
    name: 'Deal Management',
    steps: [
      {
        target: '.pm-pipeline',
        title: 'Pipeline Board',
        content: 'Your deal pipeline organized in a kanban view. Six stages from Pre-Sales Engagement through Delivery Handover. Each column shows deal count and you can see status at a glance.',
        padding: 12
      },
      {
        target: '.pm-stage-col',
        title: 'Stage Columns',
        content: 'Each column represents an IES process stage. Cards show the customer, deal type, facility size, hours tracked, task progress, and days remaining. Click any deal card to open its full detail view.',
        padding: 8
      },
      {
        target: '.pm-stat-card',
        title: 'Pipeline Metrics',
        content: 'Key pipeline stats: active opportunities, total forecast hours, actual hours YTD, and customer count. Use these to understand team capacity and workload distribution.',
        padding: 8
      },
      {
        target: '.pm-tab',
        title: 'Pipeline & Hours Tabs',
        content: 'Switch between Pipeline view and My Hours. The Hours tab tracks forecast vs. actual time across all deals — critical for capacity planning and accurate project scoping.',
        padding: 8
      }
    ]
  },

  designtools: {
    name: 'Design Tools Suite',
    steps: [
      {
        target: '#dt-tabs',
        title: 'Tool Navigation',
        content: 'Access all 7 design tools from these tabs: Center of Gravity, Network Optimization, Warehouse Sizing, Cost Model Builder, Multi-Site Analyzer, Fleet Modeler, and MOST Standards.',
        padding: 8
      },
      {
        target: '#dt-landing',
        title: 'Tool Browser',
        content: 'The landing page shows all available tools with descriptions. Click any tool card to open its full interface. Each tool is purpose-built for IES solution design workflows.',
        padding: 12
      },
      {
        target: '.dt-panel',
        title: 'Active Tool Interface',
        content: 'When a tool is open, this area shows its input panels, calculation engine, and results. Tools can export data and link to the Cost Model Builder for integrated pricing.',
        padding: 12
      }
    ]
  },

  cog: {
    name: 'Center of Gravity',
    steps: [
      {
        target: '#net-landing .dt-landing-header',
        title: 'Center of Gravity Overview',
        content: 'Find optimal distribution center locations using demand-weighted analysis. Input your customer locations and shipment volumes to calculate the ideal facility placement.',
        padding: 12
      },
      {
        target: '#net-landing .dt-landing-actions',
        title: 'Create a Scenario',
        content: 'Click here to start a new Center of Gravity scenario. Add demand points, set constraints, and run the optimizer to find the best facility locations for your network.',
        padding: 8
      },
      {
        target: '#net-landing .dt-landing-grid',
        title: 'Saved Scenarios',
        content: 'Your saved scenarios appear here as cards. Load any previous analysis to review results, adjust inputs, or compare alternatives side by side.',
        padding: 12
      }
    ]
  },

  netopt: {
    name: 'Network Optimization',
    steps: [
      {
        target: '#netopt-landing .dt-landing-header',
        title: 'Network Optimization Overview',
        content: 'Optimize multi-mode transportation across TL, LTL, and Parcel. Upload rate cards, define service zones, and model demand to find the lowest-cost shipping network.',
        padding: 12
      },
      {
        target: '#netopt-landing .dt-landing-actions',
        title: 'Create a Scenario',
        content: 'Click here to start a new network optimization scenario. Define lanes, upload CSV rate cards, and generate demand profiles for 6 business archetypes.',
        padding: 8
      },
      {
        target: '#netopt-landing .dt-landing-grid',
        title: 'Saved Scenarios',
        content: 'Your saved scenarios appear here. Load any previous optimization to review cost breakdowns, heatmaps, and service zone coverage.',
        padding: 12
      }
    ]
  },

  warehouse: {
    name: 'Warehouse Sizing Calculator',
    steps: [
      {
        target: '#wsc-landing .dt-landing-header',
        title: 'Warehouse Sizing Overview',
        content: 'Design optimal warehouse layouts and estimate facility sizing requirements. Input SKU profiles, throughput volumes, and storage types to calculate the space you need.',
        padding: 12
      },
      {
        target: '#wsc-landing .dt-landing-actions',
        title: 'Create a Scenario',
        content: 'Click here to start a new sizing scenario. Define your storage zones, dock requirements, and operational parameters to generate a complete facility layout.',
        padding: 8
      },
      {
        target: '#wsc-landing .dt-landing-grid',
        title: 'Saved Scenarios',
        content: 'Your saved scenarios appear here as cards. Load any previous analysis to review layouts, adjust parameters, or compare facility configurations.',
        padding: 12
      }
    ]
  },

  multisite: {
    name: 'Multi-Site Analyzer',
    steps: [
      {
        target: '#deal-landing .dt-landing-header',
        title: 'Multi-Site Analyzer Overview',
        content: 'Group multiple cost models into a single deal to see aggregate financials across locations. Perfect for multi-site RFPs where you need a consolidated pricing view.',
        padding: 12
      },
      {
        target: '#deal-landing .dt-landing-actions',
        title: 'Create a Deal',
        content: 'Click here to create a new multi-site deal. Add individual cost models as sites, then view combined financials, pricing summaries, and site-by-site comparisons.',
        padding: 8
      },
      {
        target: '#deal-landing .dt-landing-grid',
        title: 'Saved Deals',
        content: 'Your saved deals appear here. Deals group cost models together — click any deal to open its detail view with Summary, Sites, Financials, and Pricing tabs.',
        padding: 12
      }
    ]
  },

  costmodel: {
    name: 'Cost Model Builder',
    steps: [
      {
        target: '#sec-costmodel .dt-tabs-bar',
        title: 'Tool Navigation',
        content: 'Quick-switch between all design tools directly from the Cost Model Builder. Jump to Network Optimization, Warehouse Sizing, Fleet Modeler, or back to the full Design Tools suite.',
        padding: 8
      },
      {
        target: '#landingPage .dt-landing-header',
        title: 'Cost Model Overview',
        content: 'The Cost Model Builder provides engineered warehouse costing for 3PL operations. Create models with 13 cost sections — from Setup and Labor through Pricing and P&L Summary.',
        padding: 12
      },
      {
        target: '#newModelBtnLanding',
        title: 'Create a Model',
        content: 'Click here to start a new cost model. Once inside, you\'ll see a sidebar with 13 sections, input fields for each cost category, and a live summary that updates as you build.',
        padding: 8
      }
    ]
  },

  security: {
    name: 'Security & Compliance',
    steps: [
      {
        target: '#sec-security .wiki-sidebar',
        title: 'Security Topics',
        content: 'Six security reference areas: Architecture Overview, Access Control, Data Protection, Compliance, Incident Response, and Security Roadmap. Click any topic to view its full documentation.',
        padding: 8
      },
      {
        target: '#sec-security .wiki-content',
        title: 'Security Documentation',
        content: 'Detailed security documentation covering current architecture, authentication methods, data encryption, RLS policies, compliance frameworks, and the planned enterprise integration roadmap.',
        padding: 12
      }
    ]
  },

  analytics: {
    name: 'Analytics & Dashboards',
    steps: [
      {
        target: '.an-stats',
        title: 'Key Analytics Metrics',
        content: 'Top-level metrics showing deal performance, tool usage, and team activity. These update in real-time from your Supabase data.',
        padding: 12
      },
      {
        target: '.an-grid',
        title: 'Dashboard Panels',
        content: 'Interactive charts and heatmaps covering deal velocity, win rates, hours by stage, and tool adoption. Use the time range controls to adjust the analysis window.',
        padding: 12
      },
      {
        target: '.an-controls',
        title: 'Time Range Controls',
        content: 'Filter analytics by time period — 7 days, 30 days, 90 days, or year-to-date. Charts and metrics update automatically when you change the range.',
        padding: 8
      }
    ]
  },

  changemanagement: {
    name: 'Change Management',
    steps: [
      {
        target: '.cm-board',
        title: 'Change Request Board',
        content: 'All active change initiatives displayed in a kanban board. Cards show status, owner, priority, and ADKAR progress. Click any card to view full details.',
        padding: 12
      },
      {
        target: '.cm-header-actions',
        title: 'Actions & Views',
        content: 'Create new change requests, switch between board and list views, or open the visual flowchart editor to map change dependencies.',
        padding: 8
      },
      {
        target: '.cm-cards-container',
        title: 'Change Cards',
        content: 'Each card tracks a change initiative with ADKAR scoring (Awareness, Desire, Knowledge, Ability, Reinforcement), owner assignment, and status badges.',
        padding: 8
      }
    ]
  },

  feedback: {
    name: 'Ideas & Feedback',
    steps: [
      {
        target: '#fbFab',
        title: 'Quick Feedback Button',
        content: 'Click the orange button anytime from any page to submit a new idea, report a bug, ask a question, or share general feedback. Your input directly shapes the Hub roadmap.',
        padding: 8
      },
      {
        target: '.fb-filters',
        title: 'Feedback Categories',
        content: 'Filter feedback by type: All, Enhancements, Bugs, Questions, and General. See what the team has submitted and what\'s being worked on.',
        padding: 8
      },
      {
        target: '.fb-card',
        title: 'Feedback Cards',
        content: 'Each card shows the feedback type, status, priority, and upvote count. Upvote ideas you support to help prioritize the development roadmap.',
        padding: 8
      }
    ]
  },

  fleet: {
    name: 'Fleet Modeler & Optimizer',
    steps: [
      {
        target: '#sec-fleet .dt-tabs-bar',
        title: 'Tool Navigation',
        content: 'Quick-switch between all design tools directly from the Fleet Modeler. Jump to Network Optimization, Warehouse Sizing, Cost Model Builder, or back to the full Design Tools suite.',
        padding: 8
      },
      {
        target: '#fm-landing .dt-landing-header',
        title: 'Fleet Modeler Overview',
        content: 'The Fleet Modeler helps you design optimal fleet configurations. Create scenarios to compare private fleet, dedicated carrier, and common carrier options across your lane network.',
        padding: 12
      },
      {
        target: '#fm-landing .dt-landing-actions',
        title: 'Create a Scenario',
        content: 'Click here to start a new fleet scenario. Define your lanes, shipment volumes, and vehicle types — then run the optimizer to see cost comparisons and recommended fleet configurations.',
        padding: 8
      }
    ]
  },

  most: {
    name: 'MOST Labor Standards',
    steps: [
      {
        target: '#sec-most .dt-tabs-bar',
        title: 'Tool Navigation',
        content: 'Quick-switch between all 7 design tools directly from the MOST Standards tool, or head back to the full Design Tools suite.',
        padding: 8
      },
      {
        target: '#mostModeTabs',
        title: 'Two Modes',
        content: 'Template Library lets you browse, inspect, edit, and create MOST time standards. Quick Labor Analysis lets you model FTEs and labor cost from templates and volumes — without building a full Cost Model.',
        padding: 12
      },
      {
        target: '#mostTemplateGrid',
        title: 'Template Library',
        content: 'Each card is an engineered labor standard built from MOST element sequences with TMU values. Click any card to see the full breakdown. Use the "+ New Template" button to create standards, or "Edit" and "Duplicate" from the detail view.',
        padding: 8
      },
      {
        target: '#mostSearchInput',
        title: 'Search & Filter',
        content: 'Search by activity name, equipment, or WMS transaction. Filter by process area (Receiving, Picking, Packing, etc.) and UOM to quickly find the standard you need.',
        padding: 8
      }
    ]
  },

  marketexplorer: {
    name: 'Market Explorer',
    steps: [
      {
        target: '#leafletMap',
        title: 'Interactive Market Map',
        content: 'Click any market pin to load detailed intelligence. Pins are color-coded by labor availability: green (available), yellow (moderate), and red (tight). Zoom and pan to explore regions.',
        padding: 12
      },
      {
        target: '#marketDetailPanel',
        title: 'Market Detail Panel',
        content: 'Five tabs of market intelligence: Labor (wages, availability), Real Estate (lease rates, vacancy), Freight (lane rates), Deals (active opportunities), and News (local developments).',
        padding: 8
      },
      {
        target: '.data-library',
        title: 'Data Library',
        content: 'Expand for full market comparison tables: Real Estate, Labor & Wages, Utilities, Materials, and Construction costs across all markets. Essential for benchmarking and proposal support.',
        padding: 8
      }
    ]
  }
};

// Initialize tour engine (guarded against double-init)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { TourEngine.init(); });
} else {
  TourEngine.init();
}
