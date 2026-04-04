/* ═══════════════════════════════════════════════════
   MOST LABOR STANDARDS MODULE
   Dependencies: sb (Supabase), esc(), showToast()
   ═══════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════
   MOST LABOR STANDARDS APPLICATION
   ═══════════════════════════════════════════════════ */
const mostApp = {
  templates: [],
  elements: [],
  initialized: false,
  currentMode: 'library',

  async init() {
    if (!this.initialized) {
      await this.loadData();
      this.initialized = true;
    }
    this.renderTemplateGrid();
    this.switchMode('library');
  },

  async loadData() {
    try {
      const [tRes, eRes] = await Promise.all([
        sb.from('ref_most_templates').select('*').order('process_area').order('activity_name'),
        sb.from('ref_most_elements').select('*').order('template_id').order('sequence_order')
      ]);
      this.templates = (tRes.data || []);
      this.elements = (eRes.data || []);

      // Seed new templates if they don't already exist (Session 2026-04-03)
      await this.seedNewTemplates();
    } catch(e) { console.error('MOST data load error:', e); }
  },

  async seedNewTemplates() {
    try {
      // New templates to add (12 total expanding from 18 to 30)
      const newTemplates = [
        // VAS / Value-Add Services (3 templates)
        {
          activity_name: 'Kitting / Assembly',
          process_area: 'VAS',
          uom: 'unit',
          equipment_type: 'Pack Station, RF Gun',
          wms_transaction: 'VAS Kitting',
          pick_method: null,
          labor_category: 'manual',
          description: 'Scan work order, gather components, assemble kit per spec, apply label/barcode, QC visual check, place in container',
          total_tmu_base: 800,
          units_per_hour_base: 45,
          is_active: true,
          elements: [
            { element_name: 'Scan work order', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Gather components (3-5 items)', most_sequence: 'G3/B3', sequence_type: 'general_move', tmu_value: 280, is_variable: true, variable_driver: 'component_count', variable_formula: '80 + (count * 50)' },
            { element_name: 'Assemble kit per spec', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 180, is_variable: false },
            { element_name: 'Apply label/barcode', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 100, is_variable: false },
            { element_name: 'QC visual check', most_sequence: 'A2', sequence_type: 'controlled_move', tmu_value: 120, is_variable: false },
            { element_name: 'Place in container', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 65, is_variable: false }
          ]
        },
        {
          activity_name: 'Relabeling / Rework',
          process_area: 'VAS',
          uom: 'unit',
          equipment_type: 'Label Printer, RF Gun',
          wms_transaction: 'VAS Relabel',
          pick_method: null,
          labor_category: 'manual',
          description: 'Scan item, remove old label, clean surface, apply new label, scan verify, place on conveyor',
          total_tmu_base: 600,
          units_per_hour_base: 60,
          is_active: true,
          elements: [
            { element_name: 'Scan item', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 70, is_variable: false },
            { element_name: 'Remove old label', most_sequence: 'A2', sequence_type: 'controlled_move', tmu_value: 140, is_variable: false },
            { element_name: 'Clean surface', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 100, is_variable: false },
            { element_name: 'Apply new label', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 120, is_variable: false },
            { element_name: 'Scan verify', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Place on conveyor', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 95, is_variable: false }
          ]
        },
        {
          activity_name: 'Gift Wrap / Special Packaging',
          process_area: 'VAS',
          uom: 'unit',
          equipment_type: 'Pack Station, Gift Supplies',
          wms_transaction: 'VAS Gift Wrap',
          pick_method: null,
          labor_category: 'manual',
          description: 'Scan order, select wrap material, wrap item, add ribbon/bow, insert card, place in gift box, apply shipping label',
          total_tmu_base: 1440,
          units_per_hour_base: 25,
          is_active: true,
          elements: [
            { element_name: 'Scan order', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Select wrap material', most_sequence: 'G3', sequence_type: 'general_move', tmu_value: 120, is_variable: false },
            { element_name: 'Wrap item', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 480, is_variable: false },
            { element_name: 'Add ribbon/bow', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 220, is_variable: false },
            { element_name: 'Insert card', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 80, is_variable: false },
            { element_name: 'Place in gift box', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 155, is_variable: false },
            { element_name: 'Apply shipping label', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 130, is_variable: false }
          ]
        },
        // Returns / Reverse Logistics (2 templates)
        {
          activity_name: 'Returns Receiving & Inspection',
          process_area: 'Returns',
          uom: 'each',
          equipment_type: 'RF Gun, Camera/Phone',
          wms_transaction: 'RMA Receive',
          pick_method: null,
          labor_category: 'manual',
          description: 'Scan RMA, open package, inspect item condition (A/B/C grade), photograph damage if applicable, update disposition in WMS, route to restock/refurb/scrap',
          total_tmu_base: 1200,
          units_per_hour_base: 30,
          is_active: true,
          elements: [
            { element_name: 'Scan RMA', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Open package', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 140, is_variable: false },
            { element_name: 'Inspect item condition (A/B/C grade)', most_sequence: 'A4', sequence_type: 'controlled_move', tmu_value: 320, is_variable: false },
            { element_name: 'Photograph damage if applicable', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 280, is_variable: true, variable_driver: 'has_damage', variable_formula: '0 if no_damage else 280' },
            { element_name: 'Update disposition in WMS', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 180, is_variable: false },
            { element_name: 'Route to restock/refurb/scrap', most_sequence: 'G3', sequence_type: 'general_move', tmu_value: 205, is_variable: false }
          ]
        },
        {
          activity_name: 'Returns Restock to Inventory',
          process_area: 'Returns',
          uom: 'each',
          equipment_type: 'Pallet Jack, RF Gun',
          wms_transaction: 'Returns Putaway',
          pick_method: null,
          labor_category: 'hybrid',
          description: 'Scan approved return, verify condition grade A, relabel if needed, RF-directed putaway location, travel to location, place in slot, confirm putaway',
          total_tmu_base: 1800,
          units_per_hour_base: 20,
          is_active: true,
          elements: [
            { element_name: 'Scan approved return', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Verify condition grade A', most_sequence: 'A2', sequence_type: 'controlled_move', tmu_value: 100, is_variable: false },
            { element_name: 'Relabel if needed', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 140, is_variable: true, variable_driver: 'needs_label', variable_formula: '0 if already_labeled else 140' },
            { element_name: 'RF-directed putaway location', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 85, is_variable: false },
            { element_name: 'Travel to location', most_sequence: 'B1', sequence_type: 'body_motion', tmu_value: 600, is_variable: true, variable_driver: 'distance_feet', variable_formula: '300 + (distance/100)*150' },
            { element_name: 'Place in slot', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 320, is_variable: false },
            { element_name: 'Confirm putaway', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 80, is_variable: false }
          ]
        },
        // Quality Control / Inventory (2 templates)
        {
          activity_name: 'Cycle Count - RF Directed',
          process_area: 'Picking',
          uom: 'location',
          equipment_type: 'RF Gun, Pallet Jack',
          wms_transaction: 'Cycle Count',
          pick_method: null,
          labor_category: 'hybrid',
          description: 'Receive RF task, travel to location, scan location barcode, count items, enter count in RF, confirm/recount if variance, move to next location',
          total_tmu_base: 900,
          units_per_hour_base: 40,
          is_active: true,
          elements: [
            { element_name: 'Receive RF task', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 50, is_variable: false },
            { element_name: 'Travel to location', most_sequence: 'B1', sequence_type: 'body_motion', tmu_value: 300, is_variable: true, variable_driver: 'distance_feet', variable_formula: '200 + (distance/100)*100' },
            { element_name: 'Scan location barcode', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Count items', most_sequence: 'A4', sequence_type: 'controlled_move', tmu_value: 200, is_variable: true, variable_driver: 'item_count', variable_formula: '80 + (count * 30)' },
            { element_name: 'Enter count in RF', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 85, is_variable: false },
            { element_name: 'Confirm/recount if variance', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 140, is_variable: true, variable_driver: 'has_variance', variable_formula: '0 if no_variance else 140' },
            { element_name: 'Move to next location', most_sequence: 'B1', sequence_type: 'body_motion', tmu_value: 50, is_variable: false }
          ]
        },
        {
          activity_name: 'Quality Audit - Inbound',
          process_area: 'Receiving',
          uom: 'pallet',
          equipment_type: 'RF Gun',
          wms_transaction: 'QA Inbound',
          pick_method: null,
          labor_category: 'manual',
          description: 'Select pallet from staging, scan PO/ASN, open cases (sample 10%), check quantity vs PO, check condition/damage, check lot/expiry dates, record results, apply QC pass/fail label',
          total_tmu_base: 1050,
          units_per_hour_base: 35,
          is_active: true,
          elements: [
            { element_name: 'Select pallet from staging', most_sequence: 'G3', sequence_type: 'general_move', tmu_value: 100, is_variable: false },
            { element_name: 'Scan PO/ASN', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Open cases (sample 10%)', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 180, is_variable: true, variable_driver: 'pallet_cases', variable_formula: '40 + (cases * 0.1 * 18)' },
            { element_name: 'Check quantity vs PO', most_sequence: 'A4', sequence_type: 'controlled_move', tmu_value: 200, is_variable: false },
            { element_name: 'Check condition/damage', most_sequence: 'A4', sequence_type: 'controlled_move', tmu_value: 180, is_variable: false },
            { element_name: 'Check lot/expiry dates', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 140, is_variable: true, variable_driver: 'is_perishable', variable_formula: '60 if not_perishable else 140' },
            { element_name: 'Record results', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 110, is_variable: false },
            { element_name: 'Apply QC pass/fail label', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 65, is_variable: false }
          ]
        },
        // Picking Variants (3 templates)
        {
          activity_name: 'Zone Pick - Conveyor Induction',
          process_area: 'Picking',
          uom: 'each',
          equipment_type: 'RF Gun, Conveyor',
          wms_transaction: 'Pick to Conveyor',
          pick_method: 'Zone Pick',
          labor_category: 'hybrid',
          description: 'Receive pick task, travel to pick face, scan location, pick item, scan item, place on conveyor/tote, confirm pick',
          total_tmu_base: 206,
          units_per_hour_base: 175,
          is_active: true,
          elements: [
            { element_name: 'Receive pick task', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 40, is_variable: false },
            { element_name: 'Travel to pick face', most_sequence: 'B1', sequence_type: 'body_motion', tmu_value: 35, is_variable: true, variable_driver: 'distance_feet', variable_formula: '20 + (distance/100)*20' },
            { element_name: 'Scan location', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 70, is_variable: false },
            { element_name: 'Pick item', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 100, is_variable: false },
            { element_name: 'Scan item', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 70, is_variable: false },
            { element_name: 'Place on conveyor/tote', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 85, is_variable: false },
            { element_name: 'Confirm pick', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 40, is_variable: false }
          ]
        },
        {
          activity_name: 'Cluster Pick - Multi-Order Cart',
          process_area: 'Picking',
          uom: 'each',
          equipment_type: 'RF Gun, Multi-Order Cart',
          wms_transaction: 'Cluster Pick',
          pick_method: 'Cluster',
          labor_category: 'hybrid',
          description: 'Receive batch assignment (4-8 orders), travel to first pick zone, scan location, pick item, scan item, sort to correct cart position, confirm pick',
          total_tmu_base: 240,
          units_per_hour_base: 150,
          is_active: true,
          elements: [
            { element_name: 'Receive batch assignment (4-8 orders)', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 60, is_variable: true, variable_driver: 'order_count', variable_formula: '30 + (count * 8)' },
            { element_name: 'Travel to first pick zone', most_sequence: 'B1', sequence_type: 'body_motion', tmu_value: 40, is_variable: false },
            { element_name: 'Scan location', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 70, is_variable: false },
            { element_name: 'Pick item', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 100, is_variable: false },
            { element_name: 'Scan item', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 70, is_variable: false },
            { element_name: 'Sort to correct cart position', most_sequence: 'A3', sequence_type: 'controlled_move', tmu_value: 120, is_variable: false },
            { element_name: 'Confirm pick', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 40, is_variable: false }
          ]
        },
        {
          activity_name: 'Put-to-Light Sorting',
          process_area: 'Picking',
          uom: 'each',
          equipment_type: 'Put-to-Light Wall, RF Gun',
          wms_transaction: 'Put-to-Light',
          pick_method: 'Put-to-Light',
          labor_category: 'hybrid',
          description: 'Scan tote/container, system lights target put location, pick item from tote, place in lit compartment, press confirm button, system updates next',
          total_tmu_base: 165,
          units_per_hour_base: 220,
          is_active: true,
          elements: [
            { element_name: 'Scan tote/container', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'System lights target put location', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 10, is_variable: false },
            { element_name: 'Pick item from tote', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 85, is_variable: false },
            { element_name: 'Place in lit compartment', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 80, is_variable: false },
            { element_name: 'Press confirm button', most_sequence: 'G1', sequence_type: 'general_move', tmu_value: 45, is_variable: false }
          ]
        },
        // Blue Yonder WMS-Specific (2 templates)
        {
          activity_name: 'BY LPN Consolidation',
          process_area: 'Putaway',
          uom: 'lpn',
          equipment_type: 'Forklift, RF Gun',
          wms_transaction: 'LPN Consolidate',
          pick_method: null,
          labor_category: 'hybrid',
          description: 'Receive consolidation task, travel to source LPN, scan source LPN, pick partial contents, travel to target LPN, scan target LPN, place items, confirm consolidation',
          total_tmu_base: 1440,
          units_per_hour_base: 25,
          is_active: true,
          elements: [
            { element_name: 'Receive consolidation task', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 50, is_variable: false },
            { element_name: 'Travel to source LPN', most_sequence: 'B2', sequence_type: 'body_motion', tmu_value: 250, is_variable: true, variable_driver: 'distance_feet', variable_formula: '150 + (distance/100)*100' },
            { element_name: 'Scan source LPN', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Pick partial contents', most_sequence: 'G3', sequence_type: 'general_move', tmu_value: 280, is_variable: true, variable_driver: 'item_count', variable_formula: '100 + (count * 45)' },
            { element_name: 'Travel to target LPN', most_sequence: 'B2', sequence_type: 'body_motion', tmu_value: 250, is_variable: true, variable_driver: 'distance_feet', variable_formula: '150 + (distance/100)*100' },
            { element_name: 'Scan target LPN', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Place items', most_sequence: 'G3', sequence_type: 'general_move', tmu_value: 200, is_variable: true, variable_driver: 'item_count', variable_formula: '80 + (count * 40)' },
            { element_name: 'Confirm consolidation', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 60, is_variable: false }
          ]
        },
        {
          activity_name: 'BY Directed Replenishment - Min/Max',
          process_area: 'Replenishment',
          uom: 'pallet',
          equipment_type: 'Forklift, RF Gun',
          wms_transaction: 'Directed Replen',
          pick_method: null,
          labor_category: 'mhe',
          description: 'Receive replen task from BY (auto-triggered at min), travel to reserve, scan reserve LPN, extract pallet, travel to forward pick, scan location, place pallet, confirm task',
          total_tmu_base: 2400,
          units_per_hour_base: 15,
          is_active: true,
          elements: [
            { element_name: 'Receive replen task from BY', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 50, is_variable: false },
            { element_name: 'Travel to reserve', most_sequence: 'B3', sequence_type: 'body_motion', tmu_value: 450, is_variable: true, variable_driver: 'distance_feet', variable_formula: '300 + (distance/100)*150' },
            { element_name: 'Scan reserve LPN', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Extract pallet (forklift)', most_sequence: 'B3', sequence_type: 'body_motion', tmu_value: 400, is_variable: false },
            { element_name: 'Travel to forward pick', most_sequence: 'B3', sequence_type: 'body_motion', tmu_value: 450, is_variable: true, variable_driver: 'distance_feet', variable_formula: '300 + (distance/100)*150' },
            { element_name: 'Scan location', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 75, is_variable: false },
            { element_name: 'Place pallet (forklift)', most_sequence: 'B3', sequence_type: 'body_motion', tmu_value: 380, is_variable: false },
            { element_name: 'Confirm task', most_sequence: 'G4', sequence_type: 'general_move', tmu_value: 60, is_variable: false }
          ]
        }
      ];

      // Check which templates already exist to avoid duplicates
      const existingNames = new Set(this.templates.map(t => t.activity_name));
      const templatesToAdd = newTemplates.filter(t => !existingNames.has(t.activity_name));

      if (templatesToAdd.length === 0) {
        // All MOST templates already exist; skipping seed
        return;
      }

      // Insert new templates with their elements
      for (const tmpl of templatesToAdd) {
        const elements = tmpl.elements;
        delete tmpl.elements;

        tmpl.is_active = true;
        tmpl.updated_at = new Date().toISOString();

        try {
          const iRes = await sb.from('ref_most_templates').insert([tmpl]).select();
          if (iRes.error) {
            console.error('Template insert error for ' + tmpl.activity_name + ':', iRes.error);
            continue;
          }

          const templateId = iRes.data[0].id;
          const elemRows = elements.map((el, idx) => ({
            template_id: templateId,
            sequence_order: idx + 1,
            element_name: el.element_name,
            most_sequence: el.most_sequence,
            sequence_type: el.sequence_type,
            tmu_value: el.tmu_value,
            is_variable: el.is_variable || false,
            variable_driver: el.variable_driver || null,
            variable_formula: el.variable_formula || null,
            notes: null
          }));

          const eRes = await sb.from('ref_most_elements').insert(elemRows);
          if (eRes.error) {
            console.error('Elements insert error for template ' + templateId + ':', eRes.error);
          } else {
            // Seeded template: tmpl.activity_name
          }
        } catch (err) {
          console.error('Seed error for ' + tmpl.activity_name + ':', err);
        }
      }

      // Reload data to include new templates
      if (templatesToAdd.length > 0) {
        const [tRes, eRes] = await Promise.all([
          sb.from('ref_most_templates').select('*').order('process_area').order('activity_name'),
          sb.from('ref_most_elements').select('*').order('template_id').order('sequence_order')
        ]);
        this.templates = (tRes.data || []);
        this.elements = (eRes.data || []);
        // MOST templates seeded
      }
    } catch (err) {
      console.error('MOST seed error:', err);
    }
  },


  switchMode(mode) {
    this.currentMode = mode;
    var libView = document.getElementById('mostLibraryView');
    var detView = document.getElementById('mostDetailView');
    var edView = document.getElementById('mostEditorView');
    var anaView = document.getElementById('mostAnalysisView');
    var compView = document.getElementById('mostComposerView');
    var libBtn = document.getElementById('mostModeLibrary');
    var anaBtn = document.getElementById('mostModeAnalysis');
    var compBtn = document.getElementById('mostModeComposer');
    if (libView) libView.style.display = mode === 'library' ? 'block' : 'none';
    if (detView) detView.style.display = 'none';
    if (edView) edView.style.display = 'none';
    if (anaView) anaView.style.display = mode === 'analysis' ? 'block' : 'none';
    if (compView) compView.style.display = mode === 'composer' ? 'block' : 'none';
    if (libBtn) libBtn.style.opacity = mode === 'library' ? '1' : '0.5';
    if (anaBtn) anaBtn.style.opacity = mode === 'analysis' ? '1' : '0.5';
    if (compBtn) compBtn.style.opacity = mode === 'composer' ? '1' : '0.5';
    if (mode === 'analysis') this.initAnalysis();
  },

  filterTemplates() {
    this.renderTemplateGrid();
  },

  getFilteredTemplates() {
    var search = (document.getElementById('mostSearchInput') || {}).value || '';
    var area = (document.getElementById('mostFilterArea') || {}).value || '';
    var uom = (document.getElementById('mostFilterUOM') || {}).value || '';
    var cat = (document.getElementById('mostFilterCategory') || {}).value || '';
    search = search.toLowerCase();
    return this.templates.filter(function(t) {
      if (area && t.process_area !== area) return false;
      if (uom && t.uom !== uom) return false;
      if (cat && t.labor_category !== cat) return false;
      if (search) {
        var haystack = (t.activity_name + ' ' + t.process_area + ' ' + t.equipment_type + ' ' + t.wms_transaction + ' ' + t.uom + ' ' + (t.labor_category || '')).toLowerCase();
        if (haystack.indexOf(search) === -1) return false;
      }
      return true;
    });
  },

  _areaColor(area) {
    var colors = {
      'Receiving': { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', text: '#3b82f6' },
      'Putaway': { bg: 'rgba(16,185,129,0.1)', border: '#10b981', text: '#10b981' },
      'Replenishment': { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', text: '#92400e' },
      'Picking': { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', text: '#ef4444' },
      'Packing': { bg: 'rgba(139,92,246,0.1)', border: '#8b5cf6', text: '#8b5cf6' },
      'Shipping': { bg: 'rgba(6,182,212,0.1)', border: '#06b6d4', text: '#06b6d4' }
    };
    return colors[area] || { bg: 'rgba(100,116,139,0.1)', border: '#64748b', text: '#64748b' };
  },

  renderTemplateGrid() {
    var grid = document.getElementById('mostTemplateGrid');
    var countEl = document.getElementById('mostTemplateCount');
    if (!grid) return;
    var filtered = this.getFilteredTemplates();
    if (countEl) countEl.textContent = filtered.length + ' template' + (filtered.length !== 1 ? 's' : '');

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ies-gray-400);font-size:14px;">No templates match your filters.</div>';
      return;
    }

    var self = this;
    grid.innerHTML = filtered.map(function(t) {
      var ac = self._areaColor(t.process_area);
      var elCount = self.elements.filter(function(e) { return e.template_id === t.id; }).length;
      var totalTmu = parseFloat(t.total_tmu_base) || 0;
      var uph = parseFloat(t.units_per_hour_base) || 0;
      var pickMethod = t.pick_method ? '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(100,116,139,0.1);color:var(--ies-gray-500);font-weight:600;">' + esc(t.pick_method) + '</span>' : '';
      var catColors = { manual: { bg: 'rgba(245,158,11,0.1)', text: '#92400e' }, mhe: { bg: 'rgba(59,130,246,0.1)', text: '#1e40af' }, hybrid: { bg: 'rgba(139,92,246,0.1)', text: '#6d28d9' } };
      var catC = catColors[t.labor_category] || catColors.manual;
      var catLabel = t.labor_category === 'mhe' ? 'MHE' : (t.labor_category === 'hybrid' ? 'Hybrid' : 'Manual');
      var catBadge = '<span style="font-size:10px;padding:2px 7px;border-radius:4px;background:' + catC.bg + ';color:' + catC.text + ';font-weight:600;text-transform:uppercase;letter-spacing:0.3px;">' + catLabel + '</span>';

      return '<div style="background:var(--ies-gray-50,#f9fafb);border-radius:10px;padding:20px;cursor:pointer;border:1px solid var(--ies-gray-100,#e5e7eb);transition:all 0.15s;" ' +
        'onmouseenter="this.style.borderColor=\'' + ac.border + '\';this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.08)\'" ' +
        'onmouseleave="this.style.borderColor=\'var(--ies-gray-100,#e5e7eb)\';this.style.boxShadow=\'none\'" ' +
        'onclick="mostApp.showDetail(' + t.id + ')">' +
        '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">' +
          '<div style="display:flex;gap:6px;align-items:center;">' +
            '<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;background:' + ac.bg + ';color:' + ac.text + ';text-transform:uppercase;letter-spacing:0.5px;">' + esc(t.process_area) + '</span>' +
            catBadge +
          '</div>' +
          pickMethod +
        '</div>' +
        '<div style="font-size:14px;font-weight:700;color:var(--ies-navy);margin-bottom:6px;">' + esc(t.activity_name) + '</div>' +
        '<div style="font-size:11px;color:var(--ies-gray-500);margin-bottom:14px;">' + esc(t.equipment_type || '') + (t.wms_transaction ? ' &middot; ' + esc(t.wms_transaction) : '') + '</div>' +
        '<div style="display:flex;gap:16px;align-items:center;">' +
          '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--ies-orange);">' + uph.toFixed(1) + '</div><div style="font-size:11px;color:var(--ies-gray-400);">UPH</div></div>' +
          '<div style="width:1px;height:28px;background:var(--ies-gray-200);"></div>' +
          '<div style="text-align:center;"><div style="font-size:14px;font-weight:600;color:var(--ies-navy);">' + totalTmu.toLocaleString() + '</div><div style="font-size:11px;color:var(--ies-gray-400);">TMU</div></div>' +
          '<div style="width:1px;height:28px;background:var(--ies-gray-200);"></div>' +
          '<div style="text-align:center;"><div style="font-size:14px;font-weight:600;color:var(--ies-navy);">' + esc(t.uom) + '</div><div style="font-size:11px;color:var(--ies-gray-400);">UOM</div></div>' +
          '<div style="width:1px;height:28px;background:var(--ies-gray-200);"></div>' +
          '<div style="text-align:center;"><div style="font-size:14px;font-weight:600;color:var(--ies-navy);">' + elCount + '</div><div style="font-size:11px;color:var(--ies-gray-400);">Elements</div></div>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  showDetail(templateId) {
    var t = this.templates.find(function(x) { return x.id === templateId; });
    if (!t) return;
    var els = this.elements.filter(function(e) { return e.template_id === templateId; });
    var ac = this._areaColor(t.process_area);
    var totalTmu = parseFloat(t.total_tmu_base) || 0;
    var uph = parseFloat(t.units_per_hour_base) || 0;
    var seconds = (totalTmu * 0.036).toFixed(1);
    var variableEls = els.filter(function(e) { return e.is_variable; });
    var fixedEls = els.filter(function(e) { return !e.is_variable; });

    var html = '';
    // Header
    html += '<div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:24px;">';
    html += '<div>';
    var detCatColors = { manual: { bg: 'rgba(245,158,11,0.1)', text: '#92400e' }, mhe: { bg: 'rgba(59,130,246,0.1)', text: '#1e40af' }, hybrid: { bg: 'rgba(139,92,246,0.1)', text: '#6d28d9' } };
    var detCatC = detCatColors[t.labor_category] || detCatColors.manual;
    var detCatLabel = t.labor_category === 'mhe' ? 'MHE' : (t.labor_category === 'hybrid' ? 'Hybrid' : 'Manual');
    html += '<div style="display:flex;gap:8px;align-items:center;">';
    html += '<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;background:' + ac.bg + ';color:' + ac.text + ';text-transform:uppercase;letter-spacing:0.5px;">' + esc(t.process_area) + '</span>';
    html += '<span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:4px;background:' + detCatC.bg + ';color:' + detCatC.text + ';text-transform:uppercase;letter-spacing:0.3px;">' + detCatLabel + '</span>';
    html += '</div>';
    html += '<div style="font-size:28px;font-weight:700;color:var(--ies-navy);margin-top:8px;">' + esc(t.activity_name) + '</div>';
    html += '<div style="font-size:13px;color:var(--ies-gray-500);margin-top:4px;">' + esc(t.equipment_type || '') + (t.wms_transaction ? ' &middot; ' + esc(t.wms_transaction) : '') + ' &middot; UOM: ' + esc(t.uom) + (t.pick_method ? ' &middot; Method: ' + esc(t.pick_method) : '') + '</div>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;align-items:center;">';
    html += '<button class="hub-btn" onclick="mostApp.duplicateTemplate(' + t.id + ')" style="padding:5px 12px;font-size:11px;font-weight:600;background:var(--ies-gray-100);color:var(--ies-navy);border:1px solid var(--ies-gray-200);border-radius:6px;cursor:pointer;">Duplicate</button>';
    html += '<button class="hub-btn" onclick="mostApp.showEditor(' + t.id + ')" style="padding:5px 12px;font-size:11px;font-weight:600;background:var(--ies-blue);color:#fff;border:none;border-radius:6px;cursor:pointer;">Edit</button>';
    html += '<span style="padding:4px 12px;border-radius:4px;font-size:11px;font-weight:600;background:' + (t.is_active ? 'rgba(16,185,129,0.1);color:#10b981' : 'rgba(239,68,68,0.1);color:#ef4444') + ';">' + (t.is_active ? 'Active' : 'Inactive') + '</span>';
    html += '</div>';
    html += '</div>';

    // Key metrics row
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">';
    var metrics = [
      { label: 'Base UPH', value: uph.toFixed(1), color: 'var(--ies-orange)' },
      { label: 'Total TMU', value: totalTmu.toLocaleString(), color: 'var(--ies-navy)' },
      { label: 'Cycle Time', value: seconds + 's', color: 'var(--ies-navy)' },
      { label: 'Elements', value: els.length, color: 'var(--ies-navy)' }
    ];
    metrics.forEach(function(m) {
      html += '<div style="background:var(--ies-gray-50);border-radius:10px;padding:16px;text-align:center;">';
      html += '<div style="font-size:28px;font-weight:700;color:' + m.color + ';">' + m.value + '</div>';
      html += '<div style="font-size:12px;color:var(--ies-gray-400);margin-top:4px;">' + m.label + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // TMU formula
    html += '<div style="background:var(--ies-gray-50);border-radius:10px;padding:16px;margin-bottom:24px;">';
    html += '<div style="font-size:12px;font-weight:600;color:var(--ies-gray-500);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">TMU Conversion</div>';
    html += '<div style="font-size:13px;color:var(--ies-navy);line-height:1.8;">';
    html += '1 TMU = 0.00001 hours = 0.036 seconds &nbsp;&middot;&nbsp; ';
    html += 'UPH = 100,000 &divide; Total TMU &nbsp;&middot;&nbsp; ';
    html += '<strong>' + totalTmu.toLocaleString() + ' TMU = ' + uph.toFixed(1) + ' UPH = ' + seconds + ' sec/cycle</strong>';
    html += '</div></div>';

    // Element sequence table
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:16px;font-weight:700;color:var(--ies-navy);margin-bottom:12px;">MOST Element Sequence</div>';
    html += '<div style="overflow-x:auto;"><table class="cm-table" style="width:100%;font-size:12px;">';
    html += '<thead><tr>';
    html += '<th style="width:30px;">#</th>';
    html += '<th>Element Name</th>';
    html += '<th>MOST Sequence</th>';
    html += '<th style="text-align:center;">Type</th>';
    html += '<th style="text-align:right;">TMU</th>';
    html += '<th style="text-align:center;">Variable</th>';
    html += '<th>Driver</th>';
    html += '</tr></thead><tbody>';

    els.forEach(function(el, idx) {
      var seqType = (el.sequence_type || '').replace(/_/g, ' ');
      var typeColor = seqType === 'general move' ? '#3b82f6' : seqType === 'controlled move' ? '#10b981' : '#f59e0b';
      var varBadge = el.is_variable
        ? '<span style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;">' + esc(el.variable_driver || 'Yes') + '</span>'
        : '<span style="color:var(--ies-gray-300);">&mdash;</span>';
      var rowBg = idx % 2 === 0 ? '' : 'background:var(--ies-gray-50,#f9fafb);';

      html += '<tr style="' + rowBg + '">';
      html += '<td style="font-weight:600;color:var(--ies-gray-400);">' + el.sequence_order + '</td>';
      html += '<td style="font-weight:600;color:var(--ies-navy);">' + esc(el.element_name) + '</td>';
      html += '<td><code style="font-family:Consolas,monospace;font-size:12px;background:var(--ies-gray-100);padding:2px 6px;border-radius:4px;">' + esc(el.most_sequence) + '</code></td>';
      html += '<td style="text-align:center;"><span style="font-size:11px;color:' + typeColor + ';font-weight:600;text-transform:capitalize;">' + seqType + '</span></td>';
      html += '<td style="text-align:right;font-weight:600;">' + parseFloat(el.tmu_value).toLocaleString() + '</td>';
      html += '<td style="text-align:center;">' + (el.is_variable ? '&#9679;' : '') + '</td>';
      html += '<td>' + varBadge + '</td>';
      html += '</tr>';
    });

    // Total row
    html += '<tr style="border-top:2px solid var(--ies-gray-200);font-weight:700;">';
    html += '<td></td><td>TOTAL</td><td></td><td></td>';
    html += '<td style="text-align:right;color:var(--ies-orange);">' + totalTmu.toLocaleString() + '</td>';
    html += '<td></td><td></td></tr>';
    html += '</tbody></table></div></div>';

    // Variable elements summary
    if (variableEls.length > 0) {
      html += '<div style="background:rgba(245,158,11,0.06);border-radius:10px;padding:16px;border-left:3px solid #f59e0b;">';
      html += '<div style="font-size:13px;font-weight:600;color:#92400e;margin-bottom:8px;">Variable Elements (' + variableEls.length + ' of ' + els.length + ')</div>';
      html += '<div style="font-size:12px;color:var(--ies-gray-600);line-height:1.8;">';
      html += 'These elements adjust dynamically based on site conditions: ';
      var drivers = {};
      variableEls.forEach(function(v) { if (v.variable_driver) drivers[v.variable_driver] = true; });
      html += Object.keys(drivers).map(function(d) {
        return '<strong>' + d.replace(/_/g, ' ') + '</strong>';
      }).join(', ');
      html += '. The Cost Model recalculates TMU for these elements using actual warehouse parameters.';
      html += '</div></div>';
    }

    // Cross-link to Cost Model
    html += '<div style="margin-top:20px;padding:14px 16px;background:rgba(0,71,171,0.06);border-radius:10px;border-left:3px solid var(--ies-blue);display:flex;align-items:center;justify-content:space-between;">';
    html += '<div style="font-size:13px;color:var(--ies-navy);">This template is available as a labor standard in the <strong>Cost Model Builder</strong>. Select it from the MOST Template dropdown on any labor line.</div>';
    html += '<button class="hub-btn" onclick="navigate(\'costmodel\', document.querySelector(\'[data-section=costmodel]\'))" style="padding:6px 14px;font-size:12px;font-weight:600;background:var(--ies-blue);color:#fff;border:none;border-radius:6px;cursor:pointer;white-space:nowrap;">Open Cost Model</button>';
    html += '</div>';

    document.getElementById('mostDetailContent').innerHTML = html;
    document.getElementById('mostLibraryView').style.display = 'none';
    document.getElementById('mostDetailView').style.display = 'block';
    window.scrollTo(0, 0);
    var main = document.querySelector('.main');
    if (main) main.scrollTop = 0;
  },

  backToLibrary() {
    document.getElementById('mostDetailView').style.display = 'none';
    document.getElementById('mostEditorView').style.display = 'none';
    document.getElementById('mostLibraryView').style.display = 'block';
  },

  // ═══ SESSION 2: TEMPLATE EDITOR ═══
  editingId: null,
  editorElements: [],

  showEditor(templateId) {
    this.editingId = templateId;
    var title = document.getElementById('mostEditorTitle');
    var delBtn = document.getElementById('mostDeleteBtn');
    var valDiv = document.getElementById('mostEdValidation');
    if (valDiv) valDiv.style.display = 'none';

    if (templateId) {
      // Edit existing
      var t = this.templates.find(function(x) { return x.id === templateId; });
      if (!t) return;
      title.textContent = 'Edit Template';
      delBtn.style.display = 'inline-block';
      document.getElementById('mostEdActivity').value = t.activity_name || '';
      document.getElementById('mostEdArea').value = t.process_area || '';
      document.getElementById('mostEdUOM').value = t.uom || 'each';
      document.getElementById('mostEdEquipment').value = t.equipment_type || '';
      document.getElementById('mostEdWMS').value = t.wms_transaction || '';
      document.getElementById('mostEdPickMethod').value = t.pick_method || '';
      document.getElementById('mostEdCategory').value = t.labor_category || 'manual';
      document.getElementById('mostEdDescription').value = t.description || '';
      // Clone elements for editing
      this.editorElements = this.elements
        .filter(function(e) { return e.template_id === templateId; })
        .map(function(e) { return Object.assign({}, e); });
    } else {
      // New template
      title.textContent = 'New Template';
      delBtn.style.display = 'none';
      document.getElementById('mostEdActivity').value = '';
      document.getElementById('mostEdArea').value = '';
      document.getElementById('mostEdUOM').value = 'each';
      document.getElementById('mostEdEquipment').value = '';
      document.getElementById('mostEdWMS').value = '';
      document.getElementById('mostEdPickMethod').value = '';
      document.getElementById('mostEdCategory').value = 'manual';
      document.getElementById('mostEdDescription').value = '';
      this.editorElements = [];
    }

    this.renderEditorTable();
    this._hideAllViews();
    document.getElementById('mostEditorView').style.display = 'block';
    var main = document.querySelector('.main');
    if (main) main.scrollTop = 0;
  },

  _hideAllViews() {
    ['mostLibraryView','mostDetailView','mostEditorView','mostAnalysisView'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  },

  cancelEditor() {
    this.editingId = null;
    this.editorElements = [];
    document.getElementById('mostEditorView').style.display = 'none';
    document.getElementById('mostLibraryView').style.display = 'block';
  },

  renderEditorTable() {
    var tbody = document.getElementById('mostEdTableBody');
    if (!tbody) return;
    var self = this;

    if (this.editorElements.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--ies-gray-400);font-size:13px;">No elements yet. Click "+ Add Element" to start building the MOST sequence.</td></tr>';
      this._updateEditorMetrics();
      return;
    }

    tbody.innerHTML = this.editorElements.map(function(el, idx) {
      var seq = idx + 1;
      var isVar = el.is_variable ? 'checked' : '';
      return '<tr data-idx="' + idx + '">' +
        '<td style="font-weight:600;color:var(--ies-gray-400);text-align:center;">' + seq + '</td>' +
        '<td><input type="text" class="cm-input most-ed-field" data-field="element_name" value="' + esc(el.element_name || '') + '" placeholder="Element name" style="width:100%;font-size:12px;padding:4px 8px;" onchange="mostApp.updateElement(' + idx + ',\'element_name\',this.value)"></td>' +
        '<td><input type="text" class="cm-input most-ed-field" data-field="most_sequence" value="' + esc(el.most_sequence || '') + '" placeholder="A1 B0 G1 A0..." style="width:100%;font-size:12px;padding:4px 8px;font-family:Consolas,monospace;" onchange="mostApp.updateElement(' + idx + ',\'most_sequence\',this.value)"></td>' +
        '<td><select class="cm-select most-ed-field" data-field="sequence_type" style="width:100%;font-size:12px;padding:4px 6px;" onchange="mostApp.updateElement(' + idx + ',\'sequence_type\',this.value)">' +
          '<option value="general_move"' + (el.sequence_type === 'general_move' ? ' selected' : '') + '>General Move</option>' +
          '<option value="controlled_move"' + (el.sequence_type === 'controlled_move' ? ' selected' : '') + '>Controlled Move</option>' +
          '<option value="tool_use"' + (el.sequence_type === 'tool_use' ? ' selected' : '') + '>Tool Use</option>' +
        '</select></td>' +
        '<td><input type="number" class="cm-input most-ed-field" data-field="tmu_value" value="' + (el.tmu_value || 0) + '" min="0" step="1" style="width:70px;font-size:12px;padding:4px 8px;text-align:right;" onchange="mostApp.updateElement(' + idx + ',\'tmu_value\',this.value)"></td>' +
        '<td style="text-align:center;"><input type="checkbox" ' + isVar + ' onchange="mostApp.updateElement(' + idx + ',\'is_variable\',this.checked)" style="cursor:pointer;"></td>' +
        '<td><input type="text" class="cm-input most-ed-field" data-field="variable_driver" value="' + esc(el.variable_driver || '') + '" placeholder="e.g., travel_dist" style="width:100%;font-size:12px;padding:4px 8px;" onchange="mostApp.updateElement(' + idx + ',\'variable_driver\',this.value)"' + (!el.is_variable ? ' disabled' : '') + '></td>' +
        '<td><input type="text" class="cm-input most-ed-field" data-field="variable_formula" value="' + esc(el.variable_formula || '') + '" placeholder="Formula" style="width:100%;font-size:12px;padding:4px 8px;" onchange="mostApp.updateElement(' + idx + ',\'variable_formula\',this.value)"' + (!el.is_variable ? ' disabled' : '') + '></td>' +
        '<td style="text-align:center;"><input type="text" class="cm-input most-ed-field" data-field="notes" value="' + esc(el.notes || '') + '" placeholder="—" style="width:60px;font-size:12px;padding:4px 6px;text-align:center;" onchange="mostApp.updateElement(' + idx + ',\'notes\',this.value)"></td>' +
        '<td style="text-align:center;">' +
          '<div style="display:flex;gap:2px;justify-content:center;">' +
            (idx > 0 ? '<button onclick="mostApp.moveElement(' + idx + ',-1)" style="background:none;border:none;cursor:pointer;padding:2px;font-size:14px;color:var(--ies-gray-400);" title="Move up">&#9650;</button>' : '<span style="width:18px;display:inline-block;"></span>') +
            (idx < self.editorElements.length - 1 ? '<button onclick="mostApp.moveElement(' + idx + ',1)" style="background:none;border:none;cursor:pointer;padding:2px;font-size:14px;color:var(--ies-gray-400);" title="Move down">&#9660;</button>' : '<span style="width:18px;display:inline-block;"></span>') +
            '<button onclick="mostApp.removeElement(' + idx + ')" style="background:none;border:none;cursor:pointer;padding:2px;font-size:14px;color:#dc2626;" title="Remove">&times;</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    this._updateEditorMetrics();
  },

  addElementRow() {
    this.editorElements.push({
      element_name: '',
      most_sequence: '',
      sequence_type: 'general_move',
      tmu_value: 0,
      is_variable: false,
      variable_driver: null,
      variable_formula: null,
      notes: null
    });
    this.renderEditorTable();
    // Focus the new row's name input
    var tbody = document.getElementById('mostEdTableBody');
    var lastRow = tbody.querySelector('tr:last-child');
    if (lastRow) {
      var nameInput = lastRow.querySelector('input[data-field="element_name"]');
      if (nameInput) nameInput.focus();
    }
  },

  updateElement(idx, field, value) {
    if (idx < 0 || idx >= this.editorElements.length) return;
    if (field === 'tmu_value') value = parseFloat(value) || 0;
    if (field === 'is_variable') {
      this.editorElements[idx].is_variable = !!value;
      // Re-render to toggle driver/formula disabled state
      this.renderEditorTable();
      return;
    }
    this.editorElements[idx][field] = value;
    this._updateEditorMetrics();
  },

  moveElement(idx, direction) {
    var newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= this.editorElements.length) return;
    var temp = this.editorElements[idx];
    this.editorElements[idx] = this.editorElements[newIdx];
    this.editorElements[newIdx] = temp;
    this.renderEditorTable();
  },

  removeElement(idx) {
    this.editorElements.splice(idx, 1);
    this.renderEditorTable();
  },

  _updateEditorMetrics() {
    var totalTmu = 0;
    this.editorElements.forEach(function(el) { totalTmu += parseFloat(el.tmu_value) || 0; });
    var uph = totalTmu > 0 ? (100000 / totalTmu) : 0;
    var seconds = totalTmu * 0.036;
    var el1 = document.getElementById('mostEdUPH');
    var el2 = document.getElementById('mostEdTotalTMU');
    var el3 = document.getElementById('mostEdCycleTime');
    var el4 = document.getElementById('mostEdElCount');
    if (el1) el1.textContent = uph.toFixed(1);
    if (el2) el2.textContent = totalTmu.toLocaleString();
    if (el3) el3.textContent = seconds.toFixed(1) + 's';
    if (el4) el4.textContent = this.editorElements.length;
  },

  _validateEditor() {
    var errors = [];
    var activity = (document.getElementById('mostEdActivity').value || '').trim();
    var area = (document.getElementById('mostEdArea').value || '').trim();
    if (!activity) errors.push('Activity Name is required.');
    if (!area) errors.push('Process Area is required.');
    if (this.editorElements.length === 0) errors.push('At least one MOST element is required.');
    this.editorElements.forEach(function(el, idx) {
      if (!(el.element_name || '').trim()) errors.push('Element #' + (idx+1) + ': Name is required.');
      if (!(el.most_sequence || '').trim()) errors.push('Element #' + (idx+1) + ': MOST Sequence is required.');
      if (!el.tmu_value || parseFloat(el.tmu_value) <= 0) errors.push('Element #' + (idx+1) + ': TMU must be greater than 0.');
    });
    return errors;
  },

  async saveTemplate() {
    var valDiv = document.getElementById('mostEdValidation');
    var errors = this._validateEditor();
    if (errors.length > 0) {
      valDiv.innerHTML = errors.join('<br>');
      valDiv.style.display = 'block';
      return;
    }
    valDiv.style.display = 'none';

    // Compute totals
    var totalTmu = 0;
    this.editorElements.forEach(function(el) { totalTmu += parseFloat(el.tmu_value) || 0; });
    var uph = totalTmu > 0 ? (100000 / totalTmu) : 0;

    var templateData = {
      activity_name: document.getElementById('mostEdActivity').value.trim(),
      process_area: document.getElementById('mostEdArea').value.trim(),
      uom: document.getElementById('mostEdUOM').value,
      equipment_type: document.getElementById('mostEdEquipment').value.trim() || null,
      wms_transaction: document.getElementById('mostEdWMS').value.trim() || null,
      pick_method: document.getElementById('mostEdPickMethod').value.trim() || null,
      labor_category: document.getElementById('mostEdCategory').value || 'manual',
      description: document.getElementById('mostEdDescription').value.trim() || null,
      total_tmu_base: totalTmu,
      units_per_hour_base: Math.round(uph * 10) / 10,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    try {
      var templateId;
      if (this.editingId) {
        // Update existing
        var uRes = await sb.from('ref_most_templates').update(templateData).eq('id', this.editingId).select();
        if (uRes.error) throw uRes.error;
        templateId = this.editingId;
        // Delete old elements
        await sb.from('ref_most_elements').delete().eq('template_id', templateId);
      } else {
        // Insert new
        var iRes = await sb.from('ref_most_templates').insert(templateData).select();
        if (iRes.error) throw iRes.error;
        templateId = iRes.data[0].id;
      }

      // Insert elements
      if (this.editorElements.length > 0) {
        var elemRows = this.editorElements.map(function(el, idx) {
          return {
            template_id: templateId,
            sequence_order: idx + 1,
            element_name: (el.element_name || '').trim(),
            most_sequence: (el.most_sequence || '').trim(),
            sequence_type: el.sequence_type || 'general_move',
            tmu_value: parseFloat(el.tmu_value) || 0,
            is_variable: !!el.is_variable,
            variable_driver: el.is_variable ? (el.variable_driver || '').trim() || null : null,
            variable_formula: el.is_variable ? (el.variable_formula || '').trim() || null : null,
            notes: (el.notes || '').trim() || null
          };
        });
        var eRes = await sb.from('ref_most_elements').insert(elemRows);
        if (eRes.error) throw eRes.error;
      }

      // Reload data and return to library
      this.initialized = false;
      await this.init();
      this.editingId = null;
      this.editorElements = [];
      showToast('Template saved successfully', 'success');
    } catch (err) {
      console.error('MOST save error:', err);
      valDiv.innerHTML = 'Save failed: ' + esc(err.message || 'Unknown error');
      valDiv.style.display = 'block';
    }
  },

  async deleteTemplate() {
    if (!this.editingId) return;
    if (!confirm('Delete this template and all its elements? This cannot be undone.')) return;
    try {
      await sb.from('ref_most_elements').delete().eq('template_id', this.editingId);
      await sb.from('ref_most_templates').delete().eq('id', this.editingId);
      this.initialized = false;
      await this.init();
      this.editingId = null;
      this.editorElements = [];
      showToast('Template deleted', 'success');
    } catch (err) {
      console.error('MOST delete error:', err);
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  },

  // ═══ SESSION 3: QUICK LABOR ANALYSIS ═══
  analysisLines: [],
  scenarios: [],
  allowanceProfiles: [],

  // Persist scenarios to localStorage
  _saveScenarios() {
    try { localStorage.setItem('most_scenarios', JSON.stringify(this.scenarios)); } catch(e) {}
  },
  _loadScenarios() {
    try {
      var saved = localStorage.getItem('most_scenarios');
      if (saved) this.scenarios = JSON.parse(saved);
    } catch(e) {}
  },

  async initAnalysis() {
    this._loadScenarios();
    if (this.scenarios.length > 0) this.renderScenarios();
    // Load allowance profiles for the dropdown
    if (this.allowanceProfiles.length === 0) {
      try {
        var res = await sb.from('ref_allowance_profiles').select('*').order('is_default', {ascending:false}).order('profile_name');
        this.allowanceProfiles = res.data || [];
      } catch(e) { console.error('Allowance profiles load error:', e); }
    }
    var sel = document.getElementById('qlaAllowance');
    if (sel && this.allowanceProfiles.length > 0) {
      sel.innerHTML = '<option value="0">None (0% PFD)</option>' +
        this.allowanceProfiles.map(function(p) {
          return '<option value="' + p.total_pfd_pct + '"' + (p.is_default ? ' selected' : '') + '>' + p.profile_name + ' (' + p.total_pfd_pct + '% PFD)</option>';
        }).join('');
    }
  },

  addAnalysisLine() {
    if (!this.templates.length) { showToast('Loading templates...', 'info'); return; }
    this.analysisLines.push({ templateId: '', volume: 0 });
    this.renderAnalysisTable();
  },

  removeAnalysisLine(idx) {
    this.analysisLines.splice(idx, 1);
    this.renderAnalysisTable();
    this.recalcAnalysis();
  },

  updateAnalysisLine(idx, field, value) {
    if (!this.analysisLines[idx]) return;
    this.analysisLines[idx][field] = field === 'volume' ? (parseFloat(value) || 0) : value;
    this.renderAnalysisTable();
    this.recalcAnalysis();
  },

  renderAnalysisTable() {
    var tbody = document.getElementById('qlaTableBody');
    var tfoot = document.getElementById('qlaTableFoot');
    if (!tbody) return;

    if (this.analysisLines.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--ies-gray-400);font-size:13px;">Click "+ Add Activity" to start modeling labor requirements.</td></tr>';
      if (tfoot) tfoot.style.display = 'none';
      var results = document.getElementById('qlaResults');
      if (results) results.style.display = 'none';
      return;
    }
    if (tfoot) tfoot.style.display = '';

    var self = this;
    var pfd = parseFloat(document.getElementById('qlaAllowance').value) || 0;
    var shiftHrs = parseFloat(document.getElementById('qlaShiftHours').value) || 8;
    var rate = parseFloat(document.getElementById('qlaHourlyRate').value) || 0;

    tbody.innerHTML = this.analysisLines.map(function(line, idx) {
      var t = line.templateId ? self.templates.find(function(x) { return String(x.id) === String(line.templateId); }) : null;
      var baseUph = t ? (parseFloat(t.units_per_hour_base) || 0) : 0;
      var adjUph = baseUph > 0 ? baseUph * (100 / (100 + pfd)) : 0;
      var vol = parseFloat(line.volume) || 0;
      var hours = adjUph > 0 ? vol / adjUph : 0;
      var ftes = shiftHrs > 0 ? hours / shiftHrs : 0;
      var cost = hours * rate;

      // Template dropdown
      var selHtml = '<select class="cm-select" style="width:100%;font-size:12px;padding:4px 6px;" onchange="mostApp.updateAnalysisLine(' + idx + ',\'templateId\',this.value)">';
      selHtml += '<option value="">Select template...</option>';
      var grouped = {};
      self.templates.forEach(function(tmpl) {
        if (tmpl.is_active === false) return;
        if (!grouped[tmpl.process_area]) grouped[tmpl.process_area] = [];
        grouped[tmpl.process_area].push(tmpl);
      });
      Object.keys(grouped).sort().forEach(function(area) {
        selHtml += '<optgroup label="' + esc(area) + '">';
        grouped[area].forEach(function(tmpl) {
          selHtml += '<option value="' + tmpl.id + '"' + (String(tmpl.id) === String(line.templateId) ? ' selected' : '') + '>' + esc(tmpl.activity_name) + ' (' + (parseFloat(tmpl.units_per_hour_base)||0).toFixed(0) + ' UPH)</option>';
        });
        selHtml += '</optgroup>';
      });
      selHtml += '</select>';

      return '<tr>' +
        '<td>' + selHtml + '</td>' +
        '<td style="text-align:right;color:var(--ies-gray-500);">' + (baseUph > 0 ? baseUph.toFixed(1) : '—') + '</td>' +
        '<td style="text-align:right;font-weight:600;">' + (adjUph > 0 ? adjUph.toFixed(1) : '—') + '</td>' +
        '<td><input type="number" class="cm-input" value="' + (vol || '') + '" min="0" step="1" style="width:90px;font-size:12px;padding:4px 8px;text-align:right;" onchange="mostApp.updateAnalysisLine(' + idx + ',\'volume\',this.value)" placeholder="0"></td>' +
        '<td style="text-align:right;">' + (hours > 0 ? hours.toFixed(1) : '—') + '</td>' +
        '<td style="text-align:right;font-weight:600;color:var(--ies-orange);">' + (ftes > 0 ? ftes.toFixed(2) : '—') + '</td>' +
        '<td style="text-align:right;">' + (cost > 0 ? fmtNum(cost, 0, '$') : '—') + '</td>' +
        '<td style="text-align:center;"><button onclick="mostApp.removeAnalysisLine(' + idx + ')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:16px;" title="Remove">&times;</button></td>' +
      '</tr>';
    }).join('');
  },

  recalcAnalysis() {
    if (this.analysisLines.length === 0) return;

    var pfd = parseFloat(document.getElementById('qlaAllowance').value) || 0;
    var shiftHrs = parseFloat(document.getElementById('qlaShiftHours').value) || 8;
    var rate = parseFloat(document.getElementById('qlaHourlyRate').value) || 0;
    var self = this;

    var totVol = 0, totHrs = 0, totCost = 0;
    this.analysisLines.forEach(function(line) {
      var t = line.templateId ? self.templates.find(function(x) { return String(x.id) === String(line.templateId); }) : null;
      var baseUph = t ? (parseFloat(t.units_per_hour_base) || 0) : 0;
      var adjUph = baseUph > 0 ? baseUph * (100 / (100 + pfd)) : 0;
      var vol = parseFloat(line.volume) || 0;
      var hours = adjUph > 0 ? vol / adjUph : 0;
      totVol += vol;
      totHrs += hours;
      totCost += hours * rate;
    });

    var totFtes = shiftHrs > 0 ? totHrs / shiftHrs : 0;

    // Update footer
    var el = function(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    el('qlaTotalVolume', totVol.toLocaleString());
    el('qlaTotalHours', totHrs.toFixed(1));
    el('qlaTotalFTEs', totFtes.toFixed(2));
    el('qlaTotalCost', fmtNum(totCost, 0, '$'));

    // Update summary cards
    el('qlaResFTEs', totFtes.toFixed(1));
    el('qlaResHeadcount', Math.ceil(totFtes));
    el('qlaResHours', totHrs.toFixed(1));
    el('qlaResDailyCost', '$' + totCost.toLocaleString(undefined, {maximumFractionDigits:0}));
    el('qlaResAnnualCost', '$' + (totCost * 260).toLocaleString(undefined, {maximumFractionDigits:0}));

    var results = document.getElementById('qlaResults');
    if (results) results.style.display = totHrs > 0 ? 'block' : 'none';

    // Re-render table rows (for adjusted UPH recalc)
    this.renderAnalysisTable();
  },

  saveScenario() {
    var pfd = parseFloat(document.getElementById('qlaAllowance').value) || 0;
    var shiftHrs = parseFloat(document.getElementById('qlaShiftHours').value) || 8;
    var rate = parseFloat(document.getElementById('qlaHourlyRate').value) || 0;
    var totHrs = parseFloat(document.getElementById('qlaResHours').textContent) || 0;
    var totFtes = parseFloat(document.getElementById('qlaResFTEs').textContent) || 0;
    var dailyCost = document.getElementById('qlaResDailyCost').textContent;
    var lineCount = this.analysisLines.filter(function(l) { return l.templateId && l.volume > 0; }).length;

    if (lineCount === 0) { showToast('Add at least one activity with volume first', 'info'); return; }

    this.scenarios.push({
      name: 'Scenario ' + (this.scenarios.length + 1),
      timestamp: new Date().toLocaleTimeString(),
      lines: lineCount,
      shiftHrs: shiftHrs,
      pfd: pfd,
      rate: rate,
      ftes: totFtes,
      headcount: Math.ceil(totFtes),
      hours: totHrs,
      dailyCost: dailyCost,
      annualCost: document.getElementById('qlaResAnnualCost').textContent
    });

    this._saveScenarios();
    this.renderScenarios();
    showToast('Scenario saved', 'success');
  },

  renderScenarios() {
    var grid = document.getElementById('qlaScenariosGrid');
    if (!grid) return;
    if (this.scenarios.length === 0) { grid.innerHTML = ''; return; }

    grid.innerHTML = this.scenarios.map(function(s, idx) {
      return '<div style="background:var(--ies-gray-50);border-radius:10px;padding:16px;border:1px solid var(--ies-gray-100);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
          '<div style="font-size:13px;font-weight:700;color:var(--ies-navy);">' + s.name + '</div>' +
          '<span style="font-size:11px;color:var(--ies-gray-400);">' + s.timestamp + '</span>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--ies-gray-500);margin-bottom:10px;">' + s.lines + (s.lines === 1 ? ' activity' : ' activities') + ' &middot; ' + s.shiftHrs + 'h shift &middot; ' + s.pfd + '% PFD &middot; $' + s.rate + '/hr</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
          '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--ies-orange);">' + s.ftes.toFixed(1) + '</div><div style="font-size:10px;color:var(--ies-gray-400);">FTEs</div></div>' +
          '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--ies-navy);">' + s.headcount + '</div><div style="font-size:10px;color:var(--ies-gray-400);">Headcount</div></div>' +
          '<div style="text-align:center;"><div style="font-size:14px;font-weight:600;color:var(--ies-navy);">' + s.dailyCost + '</div><div style="font-size:10px;color:var(--ies-gray-400);">Daily</div></div>' +
          '<div style="text-align:center;"><div style="font-size:14px;font-weight:600;color:var(--ies-navy);">' + s.annualCost + '</div><div style="font-size:10px;color:var(--ies-gray-400);">Annual</div></div>' +
        '</div>' +
        '<button onclick="mostApp.removeScenario(' + idx + ')" style="margin-top:8px;background:none;border:none;cursor:pointer;font-size:11px;color:var(--ies-gray-400);">Remove</button>' +
      '</div>';
    }).join('');
  },

  removeScenario(idx) {
    this.scenarios.splice(idx, 1);
    this._saveScenarios();
    this.renderScenarios();
  },

  // ═══ WORKFLOW COMPOSER ═══
  composerSteps: [],

  addComposerStep() {
    if (!this.templates.length) { showToast('Loading templates...', 'info'); return; }
    this.composerSteps.push({ templateId: '', stepName: 'Step ' + (this.composerSteps.length + 1), volumeMultiplier: 1 });
    this.renderComposer();
  },

  removeComposerStep(idx) {
    this.composerSteps.splice(idx, 1);
    this.composerSteps.forEach(function(s, i) { if (s.stepName.match(/^Step \d+$/)) s.stepName = 'Step ' + (i + 1); });
    this.renderComposer();
    this.recalcComposer();
  },

  moveComposerStep(idx, dir) {
    var newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= this.composerSteps.length) return;
    var temp = this.composerSteps[idx];
    this.composerSteps[idx] = this.composerSteps[newIdx];
    this.composerSteps[newIdx] = temp;
    this.renderComposer();
    this.recalcComposer();
  },

  updateComposerStep(idx, field, value) {
    if (!this.composerSteps[idx]) return;
    if (field === 'volumeMultiplier') value = parseFloat(value) || 1;
    this.composerSteps[idx][field] = value;
    this.recalcComposer();
  },

  clearComposer() {
    this.composerSteps = [];
    this.renderComposer();
    var res = document.getElementById('wcResults');
    if (res) res.style.display = 'none';
  },

  renderComposer() {
    var container = document.getElementById('wcStepsContainer');
    if (!container) return;

    if (this.composerSteps.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ies-gray-400);font-size:13px;border:2px dashed var(--ies-gray-200);border-radius:10px;">Click "+ Add Step" to build your warehouse workflow pipeline.</div>';
      return;
    }

    var self = this;
    var html = '<div style="display:flex;align-items:stretch;gap:0;overflow-x:auto;padding-bottom:8px;">';

    this.composerSteps.forEach(function(step, idx) {
      var t = step.templateId ? self.templates.find(function(x) { return String(x.id) === String(step.templateId); }) : null;
      var ac = t ? self._areaColor(t.process_area) : { bg: 'var(--ies-gray-50)', border: 'var(--ies-gray-200)', text: 'var(--ies-gray-400)' };
      var uph = t ? (parseFloat(t.units_per_hour_base) || 0) : 0;

      // Template dropdown
      var selHtml = '<select class="cm-select" style="width:100%;font-size:11px;padding:3px 6px;" onchange="mostApp.updateComposerStep(' + idx + ',\'templateId\',this.value)">';
      selHtml += '<option value="">Select template...</option>';
      var grouped = {};
      self.templates.forEach(function(tmpl) {
        if (tmpl.is_active === false) return;
        if (!grouped[tmpl.process_area]) grouped[tmpl.process_area] = [];
        grouped[tmpl.process_area].push(tmpl);
      });
      Object.keys(grouped).sort().forEach(function(area) {
        selHtml += '<optgroup label="' + esc(area) + '">';
        grouped[area].forEach(function(tmpl) {
          selHtml += '<option value="' + tmpl.id + '"' + (String(tmpl.id) === String(step.templateId) ? ' selected' : '') + '>' + esc(tmpl.activity_name) + '</option>';
        });
        selHtml += '</optgroup>';
      });
      selHtml += '</select>';

      // Arrow connector between steps
      if (idx > 0) {
        html += '<div style="display:flex;align-items:center;padding:0 4px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ies-gray-300)" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>';
      }

      // Step card
      html += '<div style="min-width:200px;max-width:240px;background:var(--ies-gray-50);border-radius:10px;padding:14px;border:2px solid ' + ac.border + ';flex-shrink:0;">';
      // Step header with move/delete controls
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
      html += '<input type="text" class="cm-input" value="' + esc(step.stepName || '') + '" onchange="mostApp.updateComposerStep(' + idx + ',\'stepName\',this.value)" style="font-size:12px;font-weight:700;color:var(--ies-navy);padding:2px 6px;width:100px;border:1px solid transparent;background:transparent;" onfocus="this.style.borderColor=\'var(--ies-gray-200)\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'">';
      html += '<div style="display:flex;gap:2px;">';
      if (idx > 0) html += '<button onclick="mostApp.moveComposerStep(' + idx + ',-1)" style="background:none;border:none;cursor:pointer;padding:2px;font-size:12px;color:var(--ies-gray-400);" title="Move left">&#9664;</button>';
      if (idx < self.composerSteps.length - 1) html += '<button onclick="mostApp.moveComposerStep(' + idx + ',1)" style="background:none;border:none;cursor:pointer;padding:2px;font-size:12px;color:var(--ies-gray-400);" title="Move right">&#9654;</button>';
      html += '<button onclick="mostApp.removeComposerStep(' + idx + ')" style="background:none;border:none;cursor:pointer;padding:2px;font-size:12px;color:#dc2626;" title="Remove">&times;</button>';
      html += '</div></div>';
      // Template selector
      html += selHtml;
      // Volume multiplier
      html += '<div style="margin-top:8px;"><label style="font-size:10px;color:var(--ies-gray-400);display:block;margin-bottom:2px;">Volume Ratio</label>';
      html += '<input type="number" class="cm-input" value="' + (step.volumeMultiplier || 1) + '" min="0.01" max="100" step="0.1" style="width:100%;font-size:11px;padding:3px 6px;" onchange="mostApp.updateComposerStep(' + idx + ',\'volumeMultiplier\',this.value)"></div>';
      // Quick metrics
      if (t) {
        var catColors = { manual: '#92400e', mhe: '#1e40af', hybrid: '#6d28d9' };
        var catLabel = t.labor_category === 'mhe' ? 'MHE' : (t.labor_category === 'hybrid' ? 'Hybrid' : 'Manual');
        html += '<div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;">';
        html += '<span style="font-size:18px;font-weight:700;color:var(--ies-orange);">' + uph.toFixed(0) + ' <span style="font-size:10px;font-weight:400;color:var(--ies-gray-400);">UPH</span></span>';
        html += '<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(100,116,139,0.1);color:' + (catColors[t.labor_category] || '#92400e') + ';font-weight:600;">' + catLabel + '</span>';
        html += '</div>';
      }
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  },

  recalcComposer() {
    var steps = this.composerSteps;
    if (steps.length === 0) { var r = document.getElementById('wcResults'); if (r) r.style.display = 'none'; return; }

    var self = this;
    var targetVol = parseFloat(document.getElementById('wcTargetVolume').value) || 5000;
    var shiftHrs = parseFloat(document.getElementById('wcShiftHours').value) || 8;
    var pfd = parseFloat(document.getElementById('wcPFD').value) || 0;
    var pfdFactor = 100 / (100 + pfd);

    var stepData = [];
    var minUph = Infinity;
    var bottleneckIdx = -1;
    var totalFtes = 0;
    var totalHours = 0;
    var catHours = { manual: 0, mhe: 0, hybrid: 0 };

    steps.forEach(function(step, idx) {
      var t = step.templateId ? self.templates.find(function(x) { return String(x.id) === String(step.templateId); }) : null;
      var baseUph = t ? (parseFloat(t.units_per_hour_base) || 0) : 0;
      var adjUph = baseUph > 0 ? baseUph * pfdFactor : 0;
      var stepVol = targetVol * (step.volumeMultiplier || 1);
      var hours = adjUph > 0 ? stepVol / adjUph : 0;
      var ftes = shiftHrs > 0 ? hours / shiftHrs : 0;
      var cycleSec = baseUph > 0 ? (3600 / baseUph) : 0;
      var cat = t ? (t.labor_category || 'manual') : 'manual';

      totalFtes += ftes;
      totalHours += hours;
      if (cat && hours > 0) catHours[cat] = (catHours[cat] || 0) + hours;

      if (adjUph > 0 && adjUph < minUph) { minUph = adjUph; bottleneckIdx = idx; }

      stepData.push({ step: step, template: t, baseUph: baseUph, adjUph: adjUph, stepVol: stepVol, hours: hours, ftes: ftes, cycleSec: cycleSec, category: cat, idx: idx });
    });

    // Effective throughput = bottleneck UPH
    var effectiveUph = minUph < Infinity ? minUph : 0;
    var totalHeadcount = Math.ceil(totalFtes);

    // Show results
    var res = document.getElementById('wcResults');
    if (res) res.style.display = stepData.some(function(s) { return s.template; }) ? 'block' : 'none';

    // Summary cards
    var cards = document.getElementById('wcSummaryCards');
    if (cards) {
      cards.innerHTML =
        '<div style="background:var(--ies-gray-50);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--ies-orange);">' + effectiveUph.toFixed(0) + '</div><div style="font-size:11px;color:var(--ies-gray-400);margin-top:4px;">Effective UPH</div></div>' +
        '<div style="background:var(--ies-gray-50);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--ies-navy);">' + totalFtes.toFixed(1) + '</div><div style="font-size:11px;color:var(--ies-gray-400);margin-top:4px;">Total FTEs</div></div>' +
        '<div style="background:var(--ies-gray-50);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--ies-navy);">' + totalHeadcount + '</div><div style="font-size:11px;color:var(--ies-gray-400);margin-top:4px;">Headcount</div></div>' +
        '<div style="background:var(--ies-gray-50);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--ies-navy);">' + totalHours.toFixed(1) + '</div><div style="font-size:11px;color:var(--ies-gray-400);margin-top:4px;">Hours/Day</div></div>' +
        '<div style="background:var(--ies-gray-50);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--ies-navy);">' + steps.length + '</div><div style="font-size:11px;color:var(--ies-gray-400);margin-top:4px;">Steps</div></div>';
    }

    // Bottleneck alert
    var alert = document.getElementById('wcBottleneckAlert');
    if (alert && bottleneckIdx >= 0) {
      var bn = stepData[bottleneckIdx];
      var bnName = bn.template ? bn.template.activity_name : bn.step.stepName;
      alert.style.display = 'block';
      alert.innerHTML = '<div style="display:flex;align-items:center;gap:10px;">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
        '<div><div style="font-size:13px;font-weight:700;color:#dc2626;">Bottleneck Detected: ' + bnName + '</div>' +
        '<div style="font-size:12px;color:var(--ies-gray-600);margin-top:2px;">This step has the lowest adjusted throughput at <strong>' + bn.adjUph.toFixed(0) + ' UPH</strong>, limiting overall workflow to <strong>' + effectiveUph.toFixed(0) + ' units/hour</strong>. Consider adding labor, changing equipment, or splitting the step.</div></div></div>';
    } else if (alert) { alert.style.display = 'none'; }

    // Bar chart
    var chart = document.getElementById('wcBarChart');
    if (chart && stepData.length > 0) {
      var maxUph = Math.max.apply(null, stepData.map(function(s) { return s.adjUph || 0; }));
      if (maxUph === 0) maxUph = 1;
      chart.innerHTML = stepData.map(function(s, i) {
        var pct = maxUph > 0 ? ((s.adjUph / maxUph) * 100) : 0;
        var isBottleneck = i === bottleneckIdx;
        var barColor = isBottleneck ? '#ef4444' : 'var(--ies-blue)';
        var label = s.step.stepName;
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;">' +
          '<div style="font-size:11px;font-weight:700;color:' + (isBottleneck ? '#ef4444' : 'var(--ies-navy)') + ';margin-bottom:4px;">' + (s.adjUph > 0 ? s.adjUph.toFixed(0) : '—') + '</div>' +
          '<div style="width:100%;max-width:60px;height:' + Math.max(pct, 3) + '%;background:' + barColor + ';border-radius:6px 6px 0 0;transition:height 0.3s;' + (isBottleneck ? 'box-shadow:0 0 8px rgba(239,68,68,0.3);' : '') + '"></div>' +
          '<div style="font-size:10px;color:var(--ies-gray-500);margin-top:6px;text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + label + '">' + label + '</div>' +
        '</div>';
      }).join('');
    }

    // Category breakdown
    var catDiv = document.getElementById('wcCategoryBreakdown');
    if (catDiv) {
      var catLabels = { manual: 'Manual Labor', mhe: 'MHE Operations', hybrid: 'Hybrid' };
      var catColorsBg = { manual: 'rgba(245,158,11,0.08)', mhe: 'rgba(59,130,246,0.08)', hybrid: 'rgba(139,92,246,0.08)' };
      var catColorsTx = { manual: '#92400e', mhe: '#1e40af', hybrid: '#6d28d9' };
      catDiv.innerHTML = ['manual', 'mhe', 'hybrid'].map(function(cat) {
        var hrs = catHours[cat] || 0;
        var pctOfTotal = totalHours > 0 ? ((hrs / totalHours) * 100) : 0;
        var ftesCat = shiftHrs > 0 ? hrs / shiftHrs : 0;
        return '<div style="background:' + catColorsBg[cat] + ';border-radius:10px;padding:16px;border-left:3px solid ' + catColorsTx[cat] + ';">' +
          '<div style="font-size:13px;font-weight:700;color:' + catColorsTx[cat] + ';margin-bottom:8px;">' + catLabels[cat] + '</div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:12px;color:var(--ies-gray-500);">Hours/Day</span><span style="font-size:12px;font-weight:600;color:var(--ies-navy);">' + hrs.toFixed(1) + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:12px;color:var(--ies-gray-500);">FTEs</span><span style="font-size:12px;font-weight:600;color:var(--ies-navy);">' + ftesCat.toFixed(1) + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;"><span style="font-size:12px;color:var(--ies-gray-500);">% of Total</span><span style="font-size:12px;font-weight:600;color:var(--ies-navy);">' + pctOfTotal.toFixed(0) + '%</span></div>' +
        '</div>';
      }).join('');
    }

    // Detail table
    var tbody = document.getElementById('wcDetailBody');
    if (tbody) {
      tbody.innerHTML = stepData.map(function(s, i) {
        var isBottleneck = i === bottleneckIdx;
        var catLabel = s.category === 'mhe' ? 'MHE' : (s.category === 'hybrid' ? 'Hybrid' : 'Manual');
        var catColor = { manual: '#92400e', mhe: '#1e40af', hybrid: '#6d28d9' }[s.category] || '#92400e';
        var rowStyle = isBottleneck ? 'background:rgba(239,68,68,0.04);' : (i % 2 === 1 ? 'background:var(--ies-gray-50);' : '');
        return '<tr style="' + rowStyle + '">' +
          '<td style="font-weight:600;color:var(--ies-gray-400);">' + (i + 1) + '</td>' +
          '<td style="font-weight:600;color:var(--ies-navy);">' + s.step.stepName + '</td>' +
          '<td>' + (s.template ? s.template.activity_name : '<span style="color:var(--ies-gray-300);">Not selected</span>') + '</td>' +
          '<td style="text-align:center;"><span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(100,116,139,0.1);color:' + catColor + ';font-weight:600;">' + catLabel + '</span></td>' +
          '<td style="text-align:right;">' + (s.baseUph > 0 ? s.baseUph.toFixed(1) : '—') + '</td>' +
          '<td style="text-align:right;font-weight:600;">' + (s.adjUph > 0 ? s.adjUph.toFixed(1) : '—') + '</td>' +
          '<td style="text-align:right;">' + (s.cycleSec > 0 ? s.cycleSec.toFixed(1) : '—') + '</td>' +
          '<td style="text-align:right;font-weight:600;color:var(--ies-orange);">' + (s.ftes > 0 ? s.ftes.toFixed(2) : '—') + '</td>' +
          '<td style="text-align:right;">' + (s.hours > 0 ? s.hours.toFixed(1) : '—') + '</td>' +
          '<td style="text-align:center;">' + (isBottleneck ? '<span style="font-size:11px;font-weight:700;color:#ef4444;padding:2px 8px;border-radius:4px;background:rgba(239,68,68,0.1);">BOTTLENECK</span>' : '') + '</td>' +
        '</tr>';
      }).join('');
    }
  },

  clearAnalysis() {
    this.analysisLines = [];
    this.renderAnalysisTable();
    var results = document.getElementById('qlaResults');
    if (results) results.style.display = 'none';
  },

  async duplicateTemplate(templateId) {
    var t = this.templates.find(function(x) { return x.id === templateId; });
    if (!t) return;
    try {
      var newData = {
        activity_name: t.activity_name + ' (Copy)',
        process_area: t.process_area,
        uom: t.uom,
        equipment_type: t.equipment_type,
        wms_transaction: t.wms_transaction,
        pick_method: t.pick_method,
        labor_category: t.labor_category || 'manual',
        description: t.description,
        total_tmu_base: t.total_tmu_base,
        units_per_hour_base: t.units_per_hour_base,
        is_active: true
      };
      var iRes = await sb.from('ref_most_templates').insert(newData).select();
      if (iRes.error) throw iRes.error;
      var newId = iRes.data[0].id;

      // Copy elements
      var srcEls = this.elements.filter(function(e) { return e.template_id === templateId; });
      if (srcEls.length > 0) {
        var newEls = srcEls.map(function(e) {
          return {
            template_id: newId,
            sequence_order: e.sequence_order,
            element_name: e.element_name,
            most_sequence: e.most_sequence,
            sequence_type: e.sequence_type,
            tmu_value: e.tmu_value,
            is_variable: e.is_variable,
            variable_driver: e.variable_driver,
            variable_formula: e.variable_formula,
            notes: e.notes
          };
        });
        var eRes = await sb.from('ref_most_elements').insert(newEls);
        if (eRes.error) throw eRes.error;
      }

      // Reload and open editor for new copy
      this.initialized = false;
      await this.loadData();
      this.initialized = true;
      this.showEditor(newId);
      showToast('Template duplicated — editing copy', 'success');
    } catch (err) {
      console.error('MOST duplicate error:', err);
      alert('Duplicate failed: ' + (err.message || 'Unknown error'));
    }
  }
};
