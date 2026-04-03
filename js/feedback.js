// ============================================================================
// FEEDBACK SYSTEM
// Extracted from index.html — feedback modal, submission, voting, rendering
// ============================================================================

// ═══════════ FEEDBACK SYSTEM ═══════════
var fbData = [];
var fbCurrentFilter = 'all';
var fbCurrentSort = 'newest';
var fbCurrentSection = 'welcome';
var fbUserName = localStorage.getItem('fb_username') || '';

// Track current section for auto-tagging
(function() {
  var origNav = window.navigate;
  if (origNav) {
    window.navigate = function(section, el) {
      fbCurrentSection = section;
      origNav(section, el);
    };
  }
})();

// Section name mapping
var fbSectionNames = {
  welcome: 'Hub Guide', overview: 'Command Center', competitive: 'Competitive & Account',
  marketmap: 'Market Map', market: 'Market & Cost', labor: 'Labor Intel',
  macro: 'Macro & Trade', automation: 'Automation & Tech', verticals: 'Verticals',
  deals: 'Deal Management', changemanagement: 'Change Management',
  training: 'Training Wiki', designtools: 'Design Tools', costmodel: 'Cost Model',
  fleet: 'Fleet Modeler', feedback: 'Ideas & Feedback', security: 'Security', analytics: 'Analytics'
};

function fbOpenModal() {
  document.getElementById('fbOverlay').classList.add('active');
  document.getElementById('fbSectionTag').textContent = fbSectionNames[fbCurrentSection] || fbCurrentSection;
  if (fbUserName) document.getElementById('fbName').value = fbUserName;
  document.getElementById('fbTitle').focus();
}

function fbCloseModal() {
  document.getElementById('fbOverlay').classList.remove('active');
  document.getElementById('fbTitle').value = '';
  document.getElementById('fbDescription').value = '';
  document.getElementById('fbPriority').value = 'nice_to_have';
  // Reset type pills
  document.querySelectorAll('.fb-type-pill').forEach(function(p) { p.classList.remove('active'); });
  document.querySelector('.fb-type-pill[data-type="enhancement"]').classList.add('active');
}

function fbSelectType(el) {
  document.querySelectorAll('.fb-type-pill').forEach(function(p) { p.classList.remove('active'); });
  el.classList.add('active');
}

function fbGetSelectedType() {
  var active = document.querySelector('.fb-type-pill.active');
  return active ? active.dataset.type : 'enhancement';
}

async function fbSubmit() {
  var title = document.getElementById('fbTitle').value.trim();
  if (!title) { document.getElementById('fbTitle').style.borderColor = '#ef4444'; return; }
  document.getElementById('fbTitle').style.borderColor = '';

  var name = document.getElementById('fbName').value.trim() || 'Anonymous';
  localStorage.setItem('fb_username', name);
  fbUserName = name;

  var btn = document.getElementById('fbSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    var body = {
      type: fbGetSelectedType(),
      title: title,
      description: document.getElementById('fbDescription').value.trim() || null,
      priority: document.getElementById('fbPriority').value,
      submitted_by: name,
      section: fbSectionNames[fbCurrentSection] || fbCurrentSection,
      status: 'new',
      upvotes: []
    };

    var resp = await fetch(SUPABASE_URL + '/rest/v1/hub_feedback', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) throw new Error(await resp.text());

    fbCloseModal();
    fbShowToast('Thanks! Your feedback has been submitted.');
    fbLoadAll();
  } catch (err) {
    console.error('Feedback submit error:', err);
    fbShowToast('Error submitting — please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Feedback';
  }
}

function fbShowToast(msg) {
  var t = document.getElementById('fbToast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

async function fbLoadAll() {
  try {
    var resp = await fetch(SUPABASE_URL + '/rest/v1/hub_feedback?select=*&order=created_at.desc', {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
    });
    if (!resp.ok) throw new Error(await resp.text());
    fbData = await resp.json();
    fbUpdateNavCount();
    fbRenderStats();
    fbRenderList();
  } catch (err) {
    console.warn('Feedback load error:', err.message);
  }
}

function fbUpdateNavCount() {
  var newCount = fbData.filter(function(f) { return f.status === 'new'; }).length;
  var badge = document.getElementById('fbNavCount');
  if (badge) {
    if (newCount > 0) {
      badge.textContent = newCount;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  }
}

function fbRenderStats() {
  var el = document.getElementById('fbStats');
  if (!el) return;
  var total = fbData.length;
  var newC = fbData.filter(function(f) { return f.status === 'new'; }).length;
  var inProg = fbData.filter(function(f) { return f.status === 'in_progress' || f.status === 'under_review'; }).length;
  var done = fbData.filter(function(f) { return f.status === 'completed'; }).length;
  var topUpvoted = fbData.reduce(function(max, f) { return (f.upvotes||[]).length > max ? (f.upvotes||[]).length : max; }, 0);

  el.innerHTML =
    '<div class="fb-stat-card"><div class="fb-stat-value">' + total + '</div><div class="fb-stat-label">Total Items</div></div>' +
    '<div class="fb-stat-card"><div class="fb-stat-value" style="color:#3b82f6;">' + newC + '</div><div class="fb-stat-label">New</div></div>' +
    '<div class="fb-stat-card"><div class="fb-stat-value" style="color:var(--ies-orange);">' + inProg + '</div><div class="fb-stat-label">In Progress</div></div>' +
    '<div class="fb-stat-card"><div class="fb-stat-value" style="color:#16a34a;">' + done + '</div><div class="fb-stat-label">Completed</div></div>' +
    '<div class="fb-stat-card"><div class="fb-stat-value" style="color:#8b5cf6;">' + topUpvoted + '</div><div class="fb-stat-label">Top Votes</div></div>';
}

function fbFilter(status, btn) {
  fbCurrentFilter = status;
  document.querySelectorAll('.fb-filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  fbRenderList();
}

function fbSort(val) {
  fbCurrentSort = val;
  fbRenderList();
}

function fbRenderList() {
  var el = document.getElementById('fbList');
  if (!el) return;

  var items = fbData.slice();

  // Filter
  if (fbCurrentFilter !== 'all') {
    items = items.filter(function(f) { return f.status === fbCurrentFilter; });
  }

  // Sort
  if (fbCurrentSort === 'newest') {
    items.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  } else if (fbCurrentSort === 'oldest') {
    items.sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at); });
  } else if (fbCurrentSort === 'upvotes') {
    items.sort(function(a, b) { return (b.upvotes||[]).length - (a.upvotes||[]).length; });
  } else if (fbCurrentSort === 'priority') {
    var pOrder = { critical: 0, important: 1, nice_to_have: 2 };
    items.sort(function(a, b) { return (pOrder[a.priority]||2) - (pOrder[b.priority]||2); });
  }

  if (items.length === 0) {
    el.innerHTML = '<div class="fb-empty"><div class="fb-empty-icon">&#x1f4ad;</div><div class="fb-empty-title">No feedback yet</div><div>Be the first to share an idea or question!</div></div>';
    return;
  }

  var html = '';
  items.forEach(function(item) {
    var date = new Date(item.created_at);
    var dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    var votes = (item.upvotes || []).length;
    var hasVoted = (item.upvotes || []).indexOf(fbUserName) !== -1;
    var statusLabel = (item.status || 'new').replace(/_/g, ' ');
    var priorityIcon = item.priority === 'critical' ? '&#x1f534;' : item.priority === 'important' ? '&#x1f7e1;' : '&#x26aa;';

    html += '<div class="fb-card">' +
      '<div class="fb-card-header">' +
        '<div style="flex:1;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
            '<span class="fb-badge fb-badge-' + item.type + '">' + item.type + '</span>' +
            '<span class="fb-badge fb-status-' + item.status + '">' + statusLabel + '</span>' +
          '</div>' +
          '<div class="fb-card-title">' + fbEsc(item.title) + '</div>' +
          (item.description ? '<div style="font-size:13px;color:var(--ies-gray-600);margin-top:6px;line-height:1.5;">' + fbEsc(item.description) + '</div>' : '') +
        '</div>' +
        '<button class="fb-upvote-btn' + (hasVoted ? ' voted' : '') + '" onclick="fbUpvote(\'' + item.id + '\')" title="Upvote this">' +
          '<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg> ' +
          votes +
        '</button>' +
      '</div>' +
      '<div class="fb-card-meta">' +
        '<span>' + priorityIcon + ' ' + (item.priority||'').replace(/_/g, ' ') + '</span>' +
        '<span>by ' + fbEsc(item.submitted_by) + '</span>' +
        (item.section ? '<span>in ' + fbEsc(item.section) + '</span>' : '') +
        '<span>' + dateStr + '</span>' +
      '</div>' +
      (item.admin_response ? '<div class="fb-admin-response"><strong>Response:</strong> ' + fbEsc(item.admin_response) + '</div>' : '') +
    '</div>';
  });

  el.innerHTML = html;
}

function fbEsc(s) {
  if (!s) return '';
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function fbUpvote(id) {
  var name = fbUserName || 'Anonymous';
  var item = fbData.find(function(f) { return f.id === id; });
  if (!item) return;

  var votes = item.upvotes || [];
  var idx = votes.indexOf(name);
  if (idx === -1) {
    votes.push(name);
  } else {
    votes.splice(idx, 1);
  }

  try {
    await fetch(SUPABASE_URL + '/rest/v1/hub_feedback?id=eq.' + id, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ upvotes: votes, updated_at: new Date().toISOString() })
    });
    item.upvotes = votes;
    fbRenderList();
    fbRenderStats();
  } catch (err) {
    console.error('Upvote error:', err);
  }
}

// Load feedback data on page load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(fbLoadAll, 1500);
});

