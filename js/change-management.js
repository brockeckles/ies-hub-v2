// ============================================================================
// CHANGE MANAGEMENT MODULE
// Extracted from index.html — all cm* functions for initiative/activity tracking
// ============================================================================

// ── CHANGE MANAGEMENT MODULE ──

// State management
let cmData = {
  initiatives: [],
  activities: [],
  flowcharts: []
};

let cmCurrentInitiative = null;
let cmCurrentFlowchart = null;
let cmCurrentView = 'board';
let cmFlowMode = 'canvas';
let cmFlowNodes = [];
let cmFlowEdges = [];
let cmSelectedNode = null;
let cmConnectMode = false;
let cmConnectFrom = null;
let cmDraggedNode = null;
let cmDragOffset = { x: 0, y: 0 };

// ── SAFE DOM ACCESS HELPERS ──
// Prevent crashes from missing form elements

function cmVal(id, fallback) {
  const el = document.getElementById(id);
  return el ? el.value : (fallback || '');
}

function cmSetVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function cmText(id) {
  const el = document.getElementById(id);
  return el ? el.textContent : '';
}

function cmSetText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '';
}

function cmSafeId(id) {
  return document.getElementById(id);
}

function cmSetDisplay(id, display) {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
}

function cmToggleClass(id, className, add) {
  const el = document.getElementById(id);
  if (el) {
    if (add) el.classList.add(className);
    else el.classList.remove(className);
  }
}

// ── INITIALIZATION ──

async function cmLoadAll() {
  try {
    const [initsRes, actsRes, flowRes] = await Promise.all([
      sb.from('change_initiatives').select('*').order('created_at', { ascending: false }),
      sb.from('change_activities').select('*').order('sort_order', { ascending: true }),
      sb.from('change_flowcharts').select('*').order('created_at', { ascending: false })
    ]);

    cmData.initiatives = initsRes.data || [];
    cmData.activities = actsRes.data || [];
    cmData.flowcharts = flowRes.data || [];

    cmRenderStats();
    cmRenderBoard();
  } catch (err) {
    console.error('Error loading change management data:', err);
  }
}

// ── STATS RENDERING ──

function cmRenderStats() {
  const total = cmData.initiatives.length;
  const inProgress = cmData.initiatives.filter(i => i.status === 'in_progress').length;
  const completed = cmData.initiatives.filter(i => i.status === 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  let totalScore = 0;
  cmData.initiatives.forEach(i => {
    const score = (i.awareness_score || 0) + (i.desire_score || 0) + (i.knowledge_score || 0) + (i.ability_score || 0) + (i.reinforcement_score || 0);
    totalScore += score / 5;
  });
  const avgAdkar = total > 0 ? Math.round(totalScore / total) : 0;

  cmSetText('cm-stat-total', total);
  cmSetText('cm-stat-inprogress', inProgress);
  cmSetText('cm-stat-completion', completionRate + '%');
  cmSetText('cm-stat-adkar', avgAdkar);
}

// ── VIEW MANAGEMENT ──

function cmSetView(view) {
  cmCurrentView = view;

  document.querySelectorAll('.cm-view-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');

  cmSetDisplay('cm-board-view', view === 'board' ? 'block' : 'none');
  cmSetDisplay('cm-list-view', view === 'list' ? 'block' : 'none');
  cmSetDisplay('cm-timeline-view', view === 'timeline' ? 'block' : 'none');

  if (view === 'board') cmRenderBoard();
  else if (view === 'list') cmRenderList();
  else if (view === 'timeline') cmRenderTimeline();
}

// ── BOARD VIEW (KANBAN) ──

function cmRenderBoard() {
  const phases = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'];
  const board = document.getElementById('cm-board');
  board.innerHTML = '';

  phases.forEach(phase => {
    const column = document.createElement('div');
    column.className = 'cm-phase-column';

    const header = document.createElement('div');
    header.className = `cm-phase-header ${phase}`;
    header.textContent = phase.charAt(0).toUpperCase() + phase.slice(1);
    column.appendChild(header);

    const container = document.createElement('div');
    container.className = 'cm-cards-container';

    const inits = cmData.initiatives.filter(i => i.current_phase === phase);
    inits.forEach(init => {
      const card = cmCreateInitiativeCard(init);
      container.appendChild(card);
    });

    column.appendChild(container);
    board.appendChild(column);
  });
}

function cmCreateInitiativeCard(init) {
  const card = document.createElement('div');
  card.className = 'cm-init-card';
  card.onclick = () => cmShowDetail(init.id);

  const title = document.createElement('div');
  title.className = 'cm-card-title';
  title.textContent = init.title;
  card.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'cm-card-meta';
  const owner = document.createElement('span');
  owner.className = 'cm-card-owner';
  owner.textContent = init.owner || 'Unassigned';
  const badge = document.createElement('span');
  badge.className = `cm-card-badge cm-badge-${init.status}`;
  badge.textContent = init.status.replace('_', ' ');
  meta.appendChild(owner);
  meta.appendChild(badge);
  card.appendChild(meta);

  const adkar = document.createElement('div');
  adkar.className = 'cm-adkar-mini';
  ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'].forEach(phase => {
    const seg = document.createElement('div');
    seg.className = `cm-adkar-segment ${phase}`;
    const score = init[`${phase}_score`] || 0;
    if (score > 50) seg.classList.add('filled');
    adkar.appendChild(seg);
  });
  card.appendChild(adkar);

  return card;
}

// ── LIST VIEW ──

function cmRenderList() {
  const tbody = document.getElementById('cm-table-body');
  tbody.innerHTML = '';

  cmData.initiatives.forEach(init => {
    const row = document.createElement('tr');
    row.onclick = () => cmShowDetail(init.id);
    row.innerHTML = `
      <td>${init.title}</td>
      <td>${init.owner || 'Unassigned'}</td>
      <td><span style="text-transform: capitalize;">${init.current_phase}</span></td>
      <td><span class="cm-card-badge cm-badge-${init.status}" style="margin: 0;">${init.status.replace('_', ' ')}</span></td>
      <td><span style="text-transform: capitalize;">${init.priority || 'normal'}</span></td>
      <td>${init.target_date ? new Date(init.target_date).toLocaleDateString() : '—'}</td>
    `;
    tbody.appendChild(row);
  });
}

// ── TIMELINE VIEW ──

function cmRenderTimeline() {
  const chart = document.getElementById('cm-timeline-chart');
  chart.innerHTML = '';

  if (cmData.initiatives.length === 0) {
    chart.innerHTML = '<p style="color: var(--ies-gray-500); text-align: center; padding: 2rem;">No initiatives to display</p>';
    return;
  }

  const minDate = new Date(Math.min(...cmData.initiatives.map(i => new Date(i.start_date || new Date()))));
  const maxDate = new Date(Math.max(...cmData.initiatives.map(i => new Date(i.target_date || new Date()))));
  const span = maxDate - minDate || 86400000;

  cmData.initiatives.forEach(init => {
    const row = document.createElement('div');
    row.className = 'cm-timeline-row';

    const label = document.createElement('div');
    label.className = 'cm-timeline-label';
    label.textContent = init.title;
    row.appendChild(label);

    const container = document.createElement('div');
    container.className = 'cm-timeline-bar-container';

    const startDate = new Date(init.start_date || minDate);
    const endDate = new Date(init.target_date || maxDate);
    const left = ((startDate - minDate) / span) * 100;
    const width = ((endDate - startDate) / span) * 100;

    const bar = document.createElement('div');
    bar.className = 'cm-timeline-bar';
    bar.style.left = Math.max(0, left) + '%';
    bar.style.width = Math.max(5, width) + '%';
    bar.style.background = cmGetInitiativeColor(init);
    bar.textContent = init.title.substring(0, 10);
    bar.onclick = (e) => {
      e.stopPropagation();
      cmShowDetail(init.id);
    };

    container.appendChild(bar);
    row.appendChild(container);
    chart.appendChild(row);
  });
}

function cmGetInitiativeColor(init) {
  const colors = {
    awareness: '#6366f1',
    desire: '#f59e0b',
    knowledge: '#06b6d4',
    ability: '#10b981',
    reinforcement: '#8b5cf6'
  };
  return colors[init.current_phase] || '#6366f1';
}

// ── DETAIL PANEL ──

async function cmShowDetail(id) {
  try {
    cmCurrentInitiative = id;
    const init = cmData.initiatives.find(i => i.id === id);
    if (!init) return;

    cmSetText('cm-detail-title', init.title);
    cmToggleClass('cm-detail-panel', 'active', true);

    cmUpdateADKARBars(init);
    cmRenderDetailOverview(init);
    await cmRenderActivities(init);
    cmRenderDetailTimeline(init);
    cmRenderFlowcharts(init);

    document.querySelectorAll('.cm-tab').forEach(tab => {
      tab.classList.remove('active');
      tab.onclick = () => cmShowTab(tab.textContent.toLowerCase());
    });
    document.querySelector('.cm-tab').classList.add('active');
    cmToggleClass('cm-tab-overview', 'active', true);
  } catch (err) {
    console.error('Error in cmShowDetail:', err);
  }
}

function cmBackToBoard() {
  cmToggleClass('cm-detail-panel', 'active', false);
  cmCurrentInitiative = null;
}

function cmUpdateADKARBars(init) {
  const phases = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'];
  phases.forEach(phase => {
    const score = init[`${phase}_score`] || 0;
    const el = document.getElementById(`cm-adkar-${phase}`);
    if (el) el.style.width = score + '%';
    cmSetText(`cm-adkar-${phase}-value`, score + '%');
  });
}

// ── DETAIL TAB: OVERVIEW ──

function cmRenderDetailOverview(init) {
  cmSetText('cm-overview-description', init.description || '(No description)');
  cmSetText('cm-overview-owner', init.owner || '—');
  cmSetText('cm-overview-category', init.category || '—');
  cmSetText('cm-overview-priority', (init.priority || 'normal').toUpperCase());
  cmSetText('cm-overview-status', (init.status || 'draft').replace('_', ' ').toUpperCase());
  cmSetText('cm-overview-start', init.start_date ? new Date(init.start_date).toLocaleDateString() : '—');
  cmSetText('cm-overview-target', init.target_date ? new Date(init.target_date).toLocaleDateString() : '—');
  cmSetText('cm-overview-completed', init.completed_date ? new Date(init.completed_date).toLocaleDateString() : '—');

  const impacts = document.getElementById('cm-overview-impacts');
  if (impacts) {
    impacts.innerHTML = '';
    if (init.impact_areas && Array.isArray(init.impact_areas)) {
      init.impact_areas.forEach(area => {
        const tag = document.createElement('span');
        tag.className = 'cm-impact-tag';
        tag.textContent = area;
        impacts.appendChild(tag);
      });
    } else {
      impacts.innerHTML = '<span style="color: var(--ies-gray-500);">(None specified)</span>';
    }
  }
}

// ── DETAIL TAB: ACTIVITIES ──

async function cmRenderActivities(init) {
  try {
    const list = document.getElementById('cm-activities-list');
    if (!list) {
      console.warn('cm-activities-list element not found');
      return;
    }
    list.innerHTML = '';

    const activities = cmData.activities.filter(a => a.initiative_id === init.id);
    if (activities.length === 0) {
      list.innerHTML = '<p style="color: var(--ies-gray-500); text-align: center; padding: 1rem;">No activities yet</p>';
      return;
    }

  // Phase gate progress indicators
  const gateBar = document.createElement('div');
  gateBar.style.cssText = 'display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;';
  CM_PHASE_ORDER.forEach(phase => {
    const phaseActs = activities.filter(a => a.adkar_phase === phase);
    if (phaseActs.length === 0) return;
    const doneCount = phaseActs.filter(a => a.status === 'done').length;
    const allDone = doneCount === phaseActs.length;
    const colors = {awareness:'#6366f1',desire:'#f59e0b',knowledge:'#06b6d4',ability:'#10b981',reinforcement:'#8b5cf6'};
    const gate = document.createElement('div');
    gate.style.cssText = `flex:1;min-width:120px;padding:8px 12px;border-radius:8px;border:1.5px solid ${allDone ? colors[phase] : 'var(--ies-gray-200)'};background:${allDone ? colors[phase]+'14' : '#fff'};text-align:center;`;
    gate.innerHTML = `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:${colors[phase]};margin-bottom:2px;">${phase}</div>` +
      `<div style="font-size:13px;font-weight:600;color:var(--ies-navy);">${doneCount}/${phaseActs.length}</div>` +
      (allDone ? `<div style="font-size:10px;color:${colors[phase]};margin-top:2px;">✓ Complete</div>` : '');
    gateBar.appendChild(gate);
  });
  list.appendChild(gateBar);

  activities.forEach(act => {
    const item = document.createElement('div');
    item.className = 'cm-activity-item';

    const header = document.createElement('div');
    header.className = 'cm-activity-header';

    const title = document.createElement('div');
    title.className = 'cm-activity-title';
    title.textContent = act.title;

    const status = document.createElement('button');
    status.className = `cm-activity-status cm-status-${act.status}`;
    status.textContent = act.status.replace('_', ' ');
    status.onclick = async (e) => {
      e.stopPropagation();
      const statuses = ['todo', 'in_progress', 'done', 'blocked'];
      const current = statuses.indexOf(act.status);
      const next = statuses[(current + 1) % statuses.length];
      await cmToggleActivityStatus(act.id, next);
      cmRenderActivities(init);
    };

    header.appendChild(title);
    header.appendChild(status);
    item.appendChild(header);

    if (act.description) {
      const desc = document.createElement('p');
      desc.style.cssText = 'margin: 0.5rem 0; font-size: 0.9rem; color: var(--ies-gray-700);';
      desc.textContent = act.description;
      item.appendChild(desc);
    }

    const phase = document.createElement('span');
    phase.className = 'cm-activity-phase';
    phase.textContent = act.adkar_phase || 'general';
    item.appendChild(phase);

    if (act.due_date) {
      const due = document.createElement('div');
      due.className = 'cm-activity-due';
      due.textContent = 'Due: ' + new Date(act.due_date).toLocaleDateString();
      item.appendChild(due);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'cm-btn cm-btn-small cm-btn-secondary';
    deleteBtn.style.cssText = 'margin-top: 0.75rem; background: rgba(220, 53, 69, 0.1); color: var(--ies-red); width: 100%;';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => cmDeleteActivity(act.id).then(() => cmRenderActivities(init)).catch(function(e){ console.error('Failed to delete activity:', e); });

    item.appendChild(deleteBtn);
    list.appendChild(item);
  });
  } catch (err) {
    console.error('Error in cmRenderActivities:', err);
  }
}

// ── DETAIL TAB: TIMELINE ──

function cmRenderDetailTimeline(init) {
  const timeline = document.getElementById('cm-detail-timeline');
  if (!timeline) {
    console.warn('cm-detail-timeline element not found');
    return;
  }
  timeline.innerHTML = '';

  const activities = cmData.activities.filter(a => a.initiative_id === init.id).sort((a, b) => {
    const phases = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'];
    return phases.indexOf(a.adkar_phase) - phases.indexOf(b.adkar_phase);
  });

  if (activities.length === 0) {
    timeline.innerHTML = '<p style="color: var(--ies-gray-500); text-align: center; padding: 1rem;">No timeline activities</p>';
    return;
  }

  activities.forEach((act, idx) => {
    const item = document.createElement('div');
    item.className = 'cm-timeline-item';

    const dot = document.createElement('div');
    dot.className = 'cm-timeline-dot';
    item.appendChild(dot);

    const phase = document.createElement('div');
    phase.className = 'cm-timeline-phase-label';
    phase.textContent = act.adkar_phase || 'general';
    item.appendChild(phase);

    const title = document.createElement('div');
    title.className = 'cm-timeline-item-title';
    title.textContent = act.title;
    item.appendChild(title);

    if (act.due_date) {
      const date = document.createElement('div');
      date.style.cssText = 'font-size: 0.8rem; color: var(--ies-gray-600); margin-top: 0.25rem;';
      date.textContent = new Date(act.due_date).toLocaleDateString();
      item.appendChild(date);
    }

    timeline.appendChild(item);
  });
}

// ── DETAIL TAB: FLOWCHARTS ──

function cmRenderFlowcharts(init) {
  const list = document.getElementById('cm-flowcharts-list');
  if (!list) {
    console.warn('cm-flowcharts-list element not found');
    return;
  }
  list.innerHTML = '';

  const charts = cmData.flowcharts.filter(f => f.initiative_id === init.id);
  if (charts.length === 0) {
    list.innerHTML = '<p style="color: var(--ies-gray-500); text-align: center; padding: 1rem;">No flowcharts yet</p>';
    return;
  }

  charts.forEach(chart => {
    const item = document.createElement('div');
    item.className = 'cm-flowchart-item';

    const info = document.createElement('div');
    const chartTitle = document.createElement('div');
    chartTitle.className = 'cm-flowchart-item-title';
    chartTitle.textContent = chart.title;
    info.appendChild(chartTitle);

    if (chart.description) {
      const desc = document.createElement('div');
      desc.className = 'cm-flowchart-item-desc';
      desc.textContent = chart.description;
      info.appendChild(desc);
    }

    item.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'cm-flowchart-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'cm-btn cm-btn-small cm-btn-secondary';
    editBtn.textContent = 'Edit';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      cmShowFlowchartEditor(chart.id);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'cm-btn cm-btn-small cm-btn-secondary';
    deleteBtn.style.background = 'rgba(220, 53, 69, 0.1)';
    deleteBtn.style.color = 'var(--ies-red)';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm('Delete this flowchart?')) {
        sb.from('change_flowcharts').delete().eq('id', chart.id).then(() => {
          cmLoadAll();
          cmShowDetail(init.id);
        }).catch(function(e){ console.error('Failed to delete flowchart:', e); });
      }
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

// ── TAB SWITCHING ──

function cmShowTab(tabName) {
  document.querySelectorAll('.cm-tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.cm-tab').forEach(btn => btn.classList.remove('active'));

  const tabMap = { overview: 'overview', activities: 'activities', timeline: 'timeline', flowcharts: 'flowcharts' };
  const tab = tabMap[tabName] || tabName;

  document.getElementById(`cm-tab-${tab}`).classList.add('active');
  event.target.classList.add('active');
}

// ── MODALS ──

function cmShowModal(title, content, actions) {
  const container = document.getElementById('cm-modal-container');
  const overlay = document.createElement('div');
  overlay.className = 'cm-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'cm-modal';

  const header = document.createElement('div');
  header.className = 'cm-modal-header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'cm-modal-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'cm-modal-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => overlay.remove();
  header.appendChild(closeBtn);

  modal.appendChild(header);

  const body = document.createElement('div');
  body.className = 'cm-modal-body';
  body.innerHTML = content;
  modal.appendChild(body);

  if (actions) {
    const footer = document.createElement('div');
    footer.className = 'cm-modal-footer';
    footer.innerHTML = actions;
    modal.appendChild(footer);
  }

  overlay.appendChild(modal);
  container.appendChild(overlay);

  return { overlay, modal, closeModal: () => overlay.remove() };
}

// ── NEW INITIATIVE MODAL ──

async function cmShowNewInitiative() {
  const content = `
    <div class="cm-form-field">
      <label>Initiative Title *</label>
      <input type="text" id="cm-init-title" placeholder="e.g., Implement New WMS System">
    </div>
    <div class="cm-form-field">
      <label>Description</label>
      <textarea id="cm-init-desc" placeholder="Describe the change initiative..."></textarea>
    </div>
    <div class="cm-form-field inline">
      <label>Owner</label>
      <input type="text" id="cm-init-owner" placeholder="Owner name">
    </div>
    <div class="cm-form-field inline">
      <label>Category</label>
      <select id="cm-init-category">
        <option value="">Select category</option>
        <option value="technology">Technology</option>
        <option value="process">Process</option>
        <option value="organizational">Organizational</option>
        <option value="cultural">Cultural</option>
      </select>
    </div>
    <div class="cm-form-field inline">
      <label>Priority</label>
      <select id="cm-init-priority">
        <option value="low">Low</option>
        <option value="normal" selected>Normal</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    </div>
    <div class="cm-form-field inline">
      <label>Start Date</label>
      <input type="date" id="cm-init-start">
    </div>
    <div class="cm-form-field inline">
      <label>Target Date</label>
      <input type="date" id="cm-init-target">
    </div>
    <div class="cm-form-field">
      <label>Impact Areas (comma separated)</label>
      <input type="text" id="cm-init-impacts" placeholder="e.g., Operations, IT, Training">
    </div>
  `;

  const actions = `
    <button class="cm-btn cm-btn-secondary" onclick="this.closest('.cm-modal-overlay').remove()">Cancel</button>
    <button class="cm-btn cm-btn-primary" onclick="cmSaveInitiative()">Create Initiative</button>
  `;

  cmShowModal('New Initiative', content, actions);
}

async function cmShowEditInitiative() {
  const init = cmData.initiatives.find(i => i.id === cmCurrentInitiative);
  if (!init) return;

  const impacts = (init.impact_areas || []).join(', ');

  const content = `
    <div class="cm-form-field">
      <label>Initiative Title *</label>
      <input type="text" id="cm-init-title" value="${esc(init.title)}">
    </div>
    <div class="cm-form-field">
      <label>Description</label>
      <textarea id="cm-init-desc">${esc(init.description || '')}</textarea>
    </div>
    <div class="cm-form-field inline">
      <label>Owner</label>
      <input type="text" id="cm-init-owner" value="${esc(init.owner || '')}">
    </div>
    <div class="cm-form-field inline">
      <label>Category</label>
      <select id="cm-init-category">
        <option value="">Select category</option>
        <option value="technology" ${init.category === 'technology' ? 'selected' : ''}>Technology</option>
        <option value="process" ${init.category === 'process' ? 'selected' : ''}>Process</option>
        <option value="organizational" ${init.category === 'organizational' ? 'selected' : ''}>Organizational</option>
        <option value="cultural" ${init.category === 'cultural' ? 'selected' : ''}>Cultural</option>
      </select>
    </div>
    <div class="cm-form-field inline">
      <label>Priority</label>
      <select id="cm-init-priority">
        <option value="low" ${init.priority === 'low' ? 'selected' : ''}>Low</option>
        <option value="normal" ${init.priority === 'normal' ? 'selected' : ''}>Normal</option>
        <option value="high" ${init.priority === 'high' ? 'selected' : ''}>High</option>
        <option value="critical" ${init.priority === 'critical' ? 'selected' : ''}>Critical</option>
      </select>
    </div>
    <div class="cm-form-field inline">
      <label>Current Phase</label>
      <select id="cm-init-phase">
        <option value="awareness" ${init.current_phase === 'awareness' ? 'selected' : ''}>Awareness</option>
        <option value="desire" ${init.current_phase === 'desire' ? 'selected' : ''}>Desire</option>
        <option value="knowledge" ${init.current_phase === 'knowledge' ? 'selected' : ''}>Knowledge</option>
        <option value="ability" ${init.current_phase === 'ability' ? 'selected' : ''}>Ability</option>
        <option value="reinforcement" ${init.current_phase === 'reinforcement' ? 'selected' : ''}>Reinforcement</option>
      </select>
    </div>
    <div class="cm-form-field inline">
      <label>Status</label>
      <select id="cm-init-status">
        <option value="draft" ${init.status === 'draft' ? 'selected' : ''}>Draft</option>
        <option value="in_progress" ${init.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
        <option value="on_track" ${init.status === 'on_track' ? 'selected' : ''}>On Track</option>
        <option value="at_risk" ${init.status === 'at_risk' ? 'selected' : ''}>At Risk</option>
        <option value="completed" ${init.status === 'completed' ? 'selected' : ''}>Completed</option>
      </select>
    </div>
    <div class="cm-form-field inline">
      <label>Start Date</label>
      <input type="date" id="cm-init-start" value="${init.start_date ? init.start_date.split('T')[0] : ''}">
    </div>
    <div class="cm-form-field inline">
      <label>Target Date</label>
      <input type="date" id="cm-init-target" value="${init.target_date ? init.target_date.split('T')[0] : ''}">
    </div>
    <div class="cm-form-field">
      <label>Impact Areas (comma separated)</label>
      <input type="text" id="cm-init-impacts" value="${impacts}">
    </div>
    <div class="cm-form-field" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem;">
      <div>
        <label>Awareness Score (0-100)</label>
        <input type="number" id="cm-init-awareness" min="0" max="100" value="${init.awareness_score || 0}">
      </div>
      <div>
        <label>Desire Score (0-100)</label>
        <input type="number" id="cm-init-desire" min="0" max="100" value="${init.desire_score || 0}">
      </div>
      <div>
        <label>Knowledge Score (0-100)</label>
        <input type="number" id="cm-init-knowledge" min="0" max="100" value="${init.knowledge_score || 0}">
      </div>
      <div>
        <label>Ability Score (0-100)</label>
        <input type="number" id="cm-init-ability" min="0" max="100" value="${init.ability_score || 0}">
      </div>
      <div>
        <label>Reinforcement Score (0-100)</label>
        <input type="number" id="cm-init-reinforcement" min="0" max="100" value="${init.reinforcement_score || 0}">
      </div>
    </div>
  `;

  const actions = `
    <button class="cm-btn cm-btn-secondary" onclick="this.closest('.cm-modal-overlay').remove()">Cancel</button>
    <button class="cm-btn cm-btn-primary" onclick="cmSaveInitiative(true)">Update Initiative</button>
  `;

  cmShowModal('Edit Initiative', content, actions);
}

async function cmSaveInitiative(isEdit = false) {
  try {
    const title = cmVal('cm-init-title', '').trim();
    if (!title) {
      alert('Please enter an initiative title');
      return;
    }

    const impacts = cmVal('cm-init-impacts', '')
      .split(',')
      .map(i => i.trim())
      .filter(i => i);

    const data = {
      title,
      description: cmVal('cm-init-desc', ''),
      owner: cmVal('cm-init-owner', ''),
      category: cmVal('cm-init-category', ''),
      priority: cmVal('cm-init-priority', 'normal'),
      current_phase: cmVal('cm-init-phase', 'awareness'),
      status: cmVal('cm-init-status', 'draft'),
      start_date: cmVal('cm-init-start', ''),
      target_date: cmVal('cm-init-target', ''),
      impact_areas: impacts,
      awareness_score: parseInt(cmVal('cm-init-awareness', '0')),
      desire_score: parseInt(cmVal('cm-init-desire', '0')),
      knowledge_score: parseInt(cmVal('cm-init-knowledge', '0')),
      ability_score: parseInt(cmVal('cm-init-ability', '0')),
      reinforcement_score: parseInt(cmVal('cm-init-reinforcement', '0')),
      updated_at: new Date().toISOString()
    };

    if (isEdit) {
      await sb.from('change_initiatives').update(data).eq('id', cmCurrentInitiative);
    } else {
      await sb.from('change_initiatives').insert({
        ...data,
        created_at: new Date().toISOString()
      });
    }

    document.querySelector('.cm-modal-overlay')?.remove();
    await cmLoadAll();
    if (isEdit) await cmShowDetail(cmCurrentInitiative);
  } catch (err) {
    console.error('Error saving initiative:', err);
    alert('Error saving initiative: ' + (err.message || 'Unknown error'));
  }
}

// ── DELETE INITIATIVE ──

async function cmDeleteInitiative(id) {
  if (!confirm('Are you sure? This will delete the initiative and all its activities.')) return;

  try {
    await sb.from('change_activities').delete().eq('initiative_id', id);
    await sb.from('change_flowcharts').delete().eq('initiative_id', id);
    await sb.from('change_initiatives').delete().eq('id', id);

    cmBackToBoard();
    await cmLoadAll();
  } catch (err) {
    console.error('Error deleting initiative:', err);
    alert('Error deleting initiative');
  }
}

// ── NEW ACTIVITY MODAL ──

async function cmShowNewActivity() {
  const content = `
    <div class="cm-form-field">
      <label>Activity Title *</label>
      <input type="text" id="cm-act-title" placeholder="e.g., Conduct Training Session">
    </div>
    <div class="cm-form-field">
      <label>Description</label>
      <textarea id="cm-act-desc" placeholder="Activity details..."></textarea>
    </div>
    <div class="cm-form-field inline">
      <label>Owner</label>
      <input type="text" id="cm-act-owner" placeholder="Owner name">
    </div>
    <div class="cm-form-field inline">
      <label>ADKAR Phase</label>
      <select id="cm-act-phase">
        <option value="awareness">Awareness</option>
        <option value="desire">Desire</option>
        <option value="knowledge">Knowledge</option>
        <option value="ability">Ability</option>
        <option value="reinforcement">Reinforcement</option>
      </select>
    </div>
    <div class="cm-form-field inline">
      <label>Status</label>
      <select id="cm-act-status">
        <option value="todo" selected>To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
        <option value="blocked">Blocked</option>
      </select>
    </div>
    <div class="cm-form-field inline">
      <label>Due Date</label>
      <input type="date" id="cm-act-due">
    </div>
  `;

  const actions = `
    <button class="cm-btn cm-btn-secondary" onclick="this.closest('.cm-modal-overlay').remove()">Cancel</button>
    <button class="cm-btn cm-btn-primary" onclick="cmSaveActivity()">Add Activity</button>
  `;

  cmShowModal('New Activity', content, actions);
}

async function cmSaveActivity() {
  try {
    const title = cmVal('cm-act-title', '').trim();
    if (!title) {
      alert('Please enter an activity title');
      return;
    }

    const data = {
      initiative_id: cmCurrentInitiative,
      title,
      description: cmVal('cm-act-desc', ''),
      owner: cmVal('cm-act-owner', ''),
      adkar_phase: cmVal('cm-act-phase', 'awareness'),
      status: cmVal('cm-act-status', 'todo'),
      due_date: cmVal('cm-act-due', ''),
      sort_order: cmData.activities.filter(a => a.initiative_id === cmCurrentInitiative).length,
      created_at: new Date().toISOString()
    };

    await sb.from('change_activities').insert(data);
    document.querySelector('.cm-modal-overlay')?.remove();
    await cmLoadAll();
    const init = cmData.initiatives.find(i => i.id === cmCurrentInitiative);
    if (init) await cmRenderActivities(init);
  } catch (err) {
    console.error('Error saving activity:', err);
    alert('Error saving activity: ' + (err.message || 'Unknown error'));
  }
}

// ── DELETE ACTIVITY ──

async function cmDeleteActivity(id) {
  try {
    await sb.from('change_activities').delete().eq('id', id);
    await cmLoadAll();
  } catch (err) {
    console.error('Error deleting activity:', err);
  }
}

// ── TOGGLE ACTIVITY STATUS ──

async function cmToggleActivityStatus(id, newStatus) {
  try {
    await sb.from('change_activities').update({
      status: newStatus,
      completed_date: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', id);
    // Find which initiative this activity belongs to and check phase progression
    const activity = cmData.activities.find(a => a.id === id);
    if (activity && newStatus === 'done') {
      await cmCheckPhaseProgression(activity.initiative_id);
    }
    await cmLoadAll();
    // Re-render detail if we're viewing one
    if (cmCurrentInitiative) cmShowDetail(cmCurrentInitiative);
  } catch (err) {
    console.error('Error updating activity:', err);
  }
}

// ── ADKAR AUTO-PROGRESSION ──

const CM_PHASE_ORDER = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'];

async function cmCheckPhaseProgression(initiativeId) {
  try {
    // Refresh activities for this initiative
    const { data: activities } = await sb.from('change_activities').select('*').eq('initiative_id', initiativeId);
    const init = cmData.initiatives.find(i => i.id === initiativeId);
    if (!init || !activities) return;

    const updates = {};
    let highestCompletePhase = -1;

    CM_PHASE_ORDER.forEach((phase, idx) => {
      const phaseActivities = activities.filter(a => a.adkar_phase === phase);
      if (phaseActivities.length === 0) return;

      const doneCount = phaseActivities.filter(a => a.status === 'done').length;
      const total = phaseActivities.length;
      const pct = Math.round((doneCount / total) * 100);

      // Update the phase score to reflect activity completion
      updates[`${phase}_score`] = pct;

      if (doneCount === total) {
        highestCompletePhase = idx;
      }
    });

    // Advance current_phase to the next incomplete phase
    if (highestCompletePhase >= 0) {
      const nextPhaseIdx = highestCompletePhase + 1;
      if (nextPhaseIdx < CM_PHASE_ORDER.length) {
        updates.current_phase = CM_PHASE_ORDER[nextPhaseIdx];
      } else {
        // All phases complete — mark the initiative as completed
        updates.current_phase = 'reinforcement';
        updates.status = 'completed';
        updates.completed_date = new Date().toISOString().split('T')[0];
      }
    }

    // Auto-set status to in_progress if it was not_started and we have progress
    if (init.status === 'not_started' && Object.values(updates).some(v => v > 0)) {
      updates.status = 'in_progress';
    }

    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length > 0) {
      await sb.from('change_initiatives').update(updates).eq('id', initiativeId);
    }
  } catch (err) {
    console.error('Error in cmCheckPhaseProgression:', err);
  }
}

// ── FLOWCHART EDITOR ──

async function cmShowFlowchartEditor(chartId) {
  try {
    cmCurrentFlowchart = chartId;
    const chart = cmData.flowcharts.find(f => f.id === chartId);

    if (chart) {
      cmFlowNodes = JSON.parse(JSON.stringify(chart.chart_data?.nodes || []));
      cmFlowEdges = JSON.parse(JSON.stringify(chart.chart_data?.edges || []));
      cmSetText('cm-flowchart-title', `Editing: ${chart.title}`);
    }

    cmToggleClass('cm-flowchart-editor', 'active', true);
    cmRenderFlowchartSVG();
  } catch (err) {
    console.error('Error in cmShowFlowchartEditor:', err);
  }
}

async function cmNewFlowchart() {
  cmCurrentFlowchart = null;
  cmFlowNodes = [];
  cmFlowEdges = [];
  cmSelectedNode = null;

  const content = `
    <div class="cm-form-field">
      <label>Flowchart Title *</label>
      <input type="text" id="cm-fc-title" placeholder="e.g., Change Implementation Process">
    </div>
    <div class="cm-form-field">
      <label>Description</label>
      <textarea id="cm-fc-desc" placeholder="Describe this flowchart..."></textarea>
    </div>
  `;

  const actions = `
    <button class="cm-btn cm-btn-secondary" onclick="this.closest('.cm-modal-overlay').remove()">Cancel</button>
    <button class="cm-btn cm-btn-primary" onclick="cmStartNewFlowchart()">Create & Edit</button>
  `;

  cmShowModal('New Flowchart', content, actions);
}

async function cmStartNewFlowchart() {
  try {
    const title = cmVal('cm-fc-title', '').trim();
    if (!title) {
      alert('Please enter a flowchart title');
      return;
    }

    const desc = cmVal('cm-fc-desc', '');

    const res = await sb.from('change_flowcharts').insert({
      initiative_id: cmCurrentInitiative,
      title,
      description: desc,
      chart_data: { nodes: [], edges: [] },
      created_at: new Date().toISOString()
    }).select();

    document.querySelector('.cm-modal-overlay')?.remove();
    cmCurrentFlowchart = res.data[0].id;
    cmFlowNodes = [];
    cmFlowEdges = [];

    cmSetText('cm-flowchart-title', `Creating: ${title}`);
    cmToggleClass('cm-flowchart-editor', 'active', true);
    cmRenderFlowchartSVG();
  } catch (err) {
    console.error('Error creating flowchart:', err);
    alert('Error creating flowchart: ' + (err.message || 'Unknown error'));
  }
}

function cmRenderFlowchartSVG() {
  const svg = document.getElementById('cm-canvas-svg');
  if (!svg) {
    console.warn('cm-canvas-svg element not found');
    return;
  }
  svg.innerHTML = '';

  cmFlowEdges.forEach(edge => {
    const fromNode = cmFlowNodes.find(n => n.id === edge.from);
    const toNode = cmFlowNodes.find(n => n.id === edge.to);

    if (fromNode && toNode) {
      const fromX = fromNode.x + 60;
      const fromY = fromNode.y + 40;
      const toX = toNode.x + 60;
      const toY = toNode.y;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const controlY = (fromY + toY) / 2;
      path.setAttribute('d', `M ${fromX} ${fromY} C ${fromX} ${controlY}, ${toX} ${controlY}, ${toX} ${toY}`);
      path.setAttribute('class', 'cm-flow-edge');
      path.addEventListener('click', (e) => {
        e.stopPropagation();
        cmFlowEdges = cmFlowEdges.filter(ed => !(ed.from === edge.from && ed.to === edge.to));
        cmRenderFlowchartSVG();
      });

      svg.appendChild(path);

      const arrowhead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      arrowhead.setAttribute('points', `${toX},${toY} ${toX - 8},${toY - 12} ${toX + 8},${toY - 12}`);
      arrowhead.setAttribute('class', 'cm-flow-arrowhead');
      svg.appendChild(arrowhead);
    }
  });

  cmFlowNodes.forEach(node => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `cm-flow-node ${cmSelectedNode?.id === node.id ? 'selected' : ''}`);
    g.style.cursor = 'move';

    let shape;
    if (node.type === 'process') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shape.setAttribute('x', node.x);
      shape.setAttribute('y', node.y);
      shape.setAttribute('width', '120');
      shape.setAttribute('height', '80');
      shape.setAttribute('rx', '4');
      shape.setAttribute('class', 'cm-flow-node-rect');
    } else if (node.type === 'decision') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      shape.setAttribute('points', `${node.x + 60},${node.y} ${node.x + 120},${node.y + 40} ${node.x + 60},${node.y + 80} ${node.x},${node.y + 40}`);
      shape.setAttribute('class', 'cm-flow-node-decision');
    } else if (node.type === 'start' || node.type === 'end') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      shape.setAttribute('cx', node.x + 60);
      shape.setAttribute('cy', node.y + 40);
      shape.setAttribute('r', '40');
      shape.setAttribute('class', 'cm-flow-node-terminal');
    }

    if (shape) {
      g.appendChild(shape);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x + 60);
      text.setAttribute('y', node.y + 40);
      text.setAttribute('class', 'cm-flow-node-text');
      text.textContent = node.label.substring(0, 15);
      g.appendChild(text);

      g.addEventListener('mousedown', (e) => cmDragStart(e, node.id));
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        cmSelectedNode = node;
        cmRenderFlowchartSVG();
        cmSetDisplay('cm-delete-btn', 'inline-block');
      });

      svg.appendChild(g);
    }
  });

  svg.addEventListener('mousemove', cmDrag);
  svg.addEventListener('mouseup', cmDragEnd);
  svg.addEventListener('click', () => {
    cmSelectedNode = null;
    cmRenderFlowchartSVG();
    cmSetDisplay('cm-delete-btn', 'none');
  });
}

function cmDragStart(e, nodeId) {
  cmDraggedNode = nodeId;
  const svg = document.getElementById('cm-canvas-svg');
  const rect = svg.getBoundingClientRect();
  cmDragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function cmDrag(e) {
  if (!cmDraggedNode) return;

  const svg = document.getElementById('cm-canvas-svg');
  const rect = svg.getBoundingClientRect();
  const node = cmFlowNodes.find(n => n.id === cmDraggedNode);

  if (node) {
    node.x = Math.max(0, e.clientX - rect.left - 60);
    node.y = Math.max(0, e.clientY - rect.top - 40);
    cmRenderFlowchartSVG();
  }
}

function cmDragEnd() {
  cmDraggedNode = null;
}

function cmAddFlowNode(type) {
  const id = Math.random().toString(36).substr(2, 9);
  let label = 'New Step';

  if (type === 'decision') label = 'Decision?';
  else if (type === 'start') label = 'Start';
  else if (type === 'end') label = 'End';

  cmFlowNodes.push({
    id,
    type,
    label,
    x: 100 + (cmFlowNodes.length * 20),
    y: 100 + (cmFlowNodes.length * 20)
  });

  cmRenderFlowchartSVG();
}

function cmAddStepBased() {
  const type = cmVal('cm-step-type', 'process');
  const label = cmVal('cm-step-label', '').trim();

  if (!label) {
    alert('Please enter a label');
    return;
  }

  cmAddFlowNode(type);
  const lastNode = cmFlowNodes[cmFlowNodes.length - 1];
  lastNode.label = label;

  if (cmFlowNodes.length > 1) {
    const prevNode = cmFlowNodes[cmFlowNodes.length - 2];
    cmFlowEdges.push({
      from: prevNode.id,
      to: lastNode.id
    });
  }

  cmSetVal('cm-step-label', '');
  cmRenderFlowchartSVG();
}

function cmDeleteSelectedNode() {
  if (!cmSelectedNode) return;

  cmFlowNodes = cmFlowNodes.filter(n => n.id !== cmSelectedNode.id);
  cmFlowEdges = cmFlowEdges.filter(e => e.from !== cmSelectedNode.id && e.to !== cmSelectedNode.id);
  cmSelectedNode = null;

  cmRenderFlowchartSVG();
  cmSetDisplay('cm-delete-btn', 'none');
}

function cmToggleFlowMode(mode) {
  cmFlowMode = mode;
  const canvas = document.querySelector('.cm-canvas-main');
  const builder = document.getElementById('cm-step-builder');

  if (mode === 'canvas') {
    if (canvas) canvas.style.display = 'flex';
    if (builder) builder.style.display = 'none';
  } else {
    if (canvas) canvas.style.display = 'none';
    if (builder) builder.style.display = 'block';
  }

  document.querySelectorAll('.cm-mode-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
}

async function cmSaveFlowchart() {
  try {
    const chart = cmData.flowcharts.find(f => f.id === cmCurrentFlowchart);
    if (!chart) return;

    await sb.from('change_flowcharts').update({
      chart_data: {
        nodes: cmFlowNodes,
        edges: cmFlowEdges
      },
      updated_at: new Date().toISOString()
    }).eq('id', cmCurrentFlowchart);

    await cmLoadAll();
    cmCloseFlowchartEditor();
    if (cmCurrentInitiative) await cmShowDetail(cmCurrentInitiative);
  } catch (err) {
    console.error('Error saving flowchart:', err);
    alert('Error saving flowchart: ' + (err.message || 'Unknown error'));
  }
}

function cmCloseFlowchartEditor() {
  cmToggleClass('cm-flowchart-editor', 'active', false);
  cmCurrentFlowchart = null;
  cmFlowNodes = [];
  cmFlowEdges = [];
  cmSelectedNode = null;
}

// ── ADKAR GUIDE MODAL ──

function cmShowADKARGuide() {
  const content = `
    <div style="line-height: 1.8; color: var(--ies-gray-700);">
      <h3 style="color: var(--ies-navy); margin-top: 0;">ADKAR Change Model</h3>
      <p>A research-based framework for managing the people side of change. Each phase builds on the previous one.</p>

      <h4 style="color: #6366f1; margin-top: 1.5rem;">1. Awareness</h4>
      <p>Create awareness of the need for change. Help stakeholders understand why change is necessary and what problems it will solve.</p>
      <ul style="margin-left: 1rem;">
        <li>Communicate the business case</li>
        <li>Share relevant data and trends</li>
        <li>Involve key influencers</li>
      </ul>

      <h4 style="color: #f59e0b; margin-top: 1.5rem;">2. Desire</h4>
      <p>Build desire to support and participate in the change. Help people understand "what's in it for me?"</p>
      <ul style="margin-left: 1rem;">
        <li>Show benefits clearly</li>
        <li>Address concerns openly</li>
        <li>Create peer networks</li>
      </ul>

      <h4 style="color: #06b6d4; margin-top: 1.5rem;">3. Knowledge</h4>
      <p>Provide knowledge on how to change. Ensure people understand what new behaviors are expected.</p>
      <ul style="margin-left: 1rem;">
        <li>Deliver targeted training</li>
        <li>Create reference materials</li>
        <li>Enable hands-on practice</li>
      </ul>

      <h4 style="color: #10b981; margin-top: 1.5rem;">4. Ability</h4>
      <p>Build the ability to implement the change. Ensure people can perform new roles and behaviors.</p>
      <ul style="margin-left: 1rem;">
        <li>Provide coaching and support</li>
        <li>Build communities of practice</li>
        <li>Track and reinforce progress</li>
      </ul>

      <h4 style="color: #8b5cf6; margin-top: 1.5rem;">5. Reinforcement</h4>
      <p>Reinforce the changes to sustain them. Ensure the organization sticks with the new ways of working.</p>
      <ul style="margin-left: 1rem;">
        <li>Celebrate wins</li>
        <li>Adjust systems and processes</li>
        <li>Measure and communicate results</li>
      </ul>
    </div>
  `;

  const actions = `
    <button class="cm-btn cm-btn-primary" onclick="this.closest('.cm-modal-overlay').remove()">Close</button>
  `;

  cmShowModal('ADKAR Change Model', content, actions);
}

// ── INITIALIZATION ON PAGE LOAD ──

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cmLoadAll);
} else {
  cmLoadAll();
}

