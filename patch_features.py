import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert CSS
css_to_add = '''
    /* ── Progress bar ── */
    .task-progress-wrap { display:flex; align-items:center; gap:8px; margin:4px 0; }
    .task-progress-bar { flex:1; height:5px; background:var(--bg); border-radius:3px; overflow:hidden; min-width:40px; }
    .task-progress-bar--lg { height:8px; }
    .task-progress-fill { height:100%; background:linear-gradient(90deg, var(--accent), #8b5cf6); border-radius:3px; transition:width 0.4s ease; }
    .task-progress-text { font-size:0.6875rem; font-weight:700; color:var(--accent); white-space:nowrap; min-width:28px; text-align:right; }

    /* ── Routine badge ── */
    .routine-badge { display:inline-flex; align-items:center; gap:3px; font-size:0.625rem; font-weight:700; padding:2px 6px; border-radius:4px; background:rgba(79,110,247,0.1); color:var(--accent); letter-spacing:0.02em; }

    /* ── ETA badge ── */
    .eta-badge { display:inline-flex; align-items:center; gap:3px; font-size:0.625rem; font-weight:700; padding:2px 6px; border-radius:4px; }
    .eta-badge--eta-ok { background:rgba(34,197,94,0.1); color:var(--low); }
    .eta-badge--eta-at-risk { background:rgba(245,158,11,0.1); color:var(--medium); }
    .eta-badge--eta-overdue { background:rgba(239,68,68,0.1); color:var(--danger); }

    /* ── Done tab badge ── */
    .done-tab-count { display:inline-flex; align-items:center; justify-content:center; min-width:16px; height:16px; background:var(--low); color:#fff; font-size:0.5rem; font-weight:800; border-radius:8px; padding:0 3px; margin-left:3px; line-height:1; vertical-align:middle; }

    /* ── Logs timeline ── */
    #logsList { list-style:none; padding:0; margin:0; }
    .log-timeline-item { display:flex; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); }
    .log-timeline-item:last-child { border-bottom:none; }
    .log-timeline-dot { width:28px; height:28px; border-radius:50%; background:var(--accent-light); display:flex; align-items:center; justify-content:center; font-size:0.875rem; flex-shrink:0; border:2px solid var(--border); }
    .log-timeline-content { flex:1; min-width:0; }
    .log-message { font-size:0.875rem; color:var(--text); line-height:1.4; }
    .log-time { font-size:0.6875rem; color:var(--text-muted); margin-top:3px; }
    .log-task-info { padding:12px 14px; background:var(--accent-light); border-radius:var(--radius-sm); margin-bottom:14px; font-size:0.8125rem; display:flex; flex-direction:column; gap:5px; border-left:3px solid var(--accent); }

    /* ── Cal routine dot ── */
    .cal-dot-routine { box-shadow:0 0 0 1px var(--accent); }
'''
if "task-progress-wrap" not in content:
    content = content.replace('  </style>', css_to_add + '\n  </style>')

# 2. Done Tab Badge
if 'id="doneTabBadge"' not in content:
    content = content.replace('<span class="view-label">Done</span>', '<span class="view-label">Done</span><span class="done-tab-count" id="doneTabBadge" style="display:none">0</span>')

# 3. Add JS helper functions before render()
helpers = '''
    function updateDoneTabBadge() {
      const cnt = tasks.filter(t => t.status === 'completed').length;
      const el  = document.getElementById('doneTabBadge');
      if (el) { el.textContent = cnt; el.style.display = cnt > 0 ? '' : 'none'; }
    }

    function etaStatus(task) {
      if (!task.etaDate || task.status === 'completed') return null;
      const today = todayStr();
      const days = Math.round((new Date(task.etaDate+'T00:00:00') - new Date(today+'T00:00:00')) / 86400000);
      if (task.etaDate < today) return { label: 'ETA overdue', cls: 'eta-overdue', icon: '⏳' };
      if (days <= 3)            return { label: `ETA in ${days}d`, cls: 'eta-at-risk', icon: '⏳' };
      return                           { label: formatShort(task.etaDate), cls: 'eta-ok', icon: '⏳' };
    }

    function progressBarHtml(task) {
      if (task.status !== 'in_progress') return '';
      const pct = task.progress || 0;
      return `<div class="task-progress-wrap"><div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div><span class="task-progress-text">${pct}%</span></div>`;
    }

    function routineBadgeHtml(task) {
      if (!task.routineType || task.routineType === 'none') return '';
      const lbl = { daily:'🔁 Daily', weekly:'🔁 Weekly', monthly:'🔁 Monthly' };
      return `<span class="routine-badge">${lbl[task.routineType] || task.routineType}</span>`;
    }

    function etaBadgeHtml(task) {
      const s = etaStatus(task);
      if (!s) return '';
      return `<span class="eta-badge eta-badge--${s.cls}">${s.icon} ${s.label}</span>`;
    }
'''
if "updateDoneTabBadge" not in content:
    content = content.replace('    function render() {', helpers + '\n    function render() {')

# 4. Modify render dispatcher
if "updateDoneTabBadge();" not in content:
    content = content.replace("const app = document.getElementById('app');", "const app = document.getElementById('app');\n      updateDoneTabBadge();")

# 5. Modify view renders to exclude completed
content = content.replace("const active  = applyFilters(tasks);", "const active  = applyFilters(tasks.filter(t => t.status !== 'completed'));")

# 6. Modify taskHtml
if "${progressBarHtml(task)}" not in content:
    # Insert badges into task-meta
    content = content.replace('${dateInfo}', '${dateInfo}\n              ${routineBadgeHtml(task)}\n              ${etaBadgeHtml(task)}')
    # Insert progress bar after task-body
    content = content.replace('</div>\n          <div class="task-actions">', '${progressBarHtml(task)}\n          </div>\n          <div class="task-actions">')
    # Insert log icon in actions
    log_btn = '''<button class="btn-icon" onclick="viewLogs('${task.id}')" aria-label="View history" title="View history">
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 14A6 6 0 108 2a6 6 0 000 12zM8 5v4l3 2" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>'''
    content = content.replace('aria-label="Edit task"', 'aria-label="Edit task"') # Dummy match to anchor
    content = content.replace('<button class="btn-icon btn-danger"', log_btn + '\\n            <button class="btn-icon btn-danger"')

# 7. Add viewLogs function
view_logs_fn = '''
    async function viewLogs(taskId) {
      const modal = document.getElementById('logsModal');
      if (!modal) return;
      const task  = tasks.find(t => t.id == taskId);
      const titleEl = modal.querySelector('h2');
      if (titleEl && task) titleEl.textContent = '📜 History: ' + task.text.slice(0,50) + (task.text.length>50?'…':'');
      modal.classList.add('open');
      const list = document.getElementById('logsList');
      if (list) list.innerHTML = '<li style="color:var(--text-muted);padding:12px 0">Loading…</li>';
      try {
        const logs = await api('/tasks/'+taskId+'/logs');
        let infoHtml = '';
        if (task) {
          const drift = task.originalStartDate && task.originalStartDate !== task.date
            ? Math.round(Math.abs(new Date(task.originalStartDate+'T00:00:00') - new Date(task.date+'T00:00:00')) / 86400000) : 0;
          infoHtml = `<li class="log-task-info">
            <div><strong>Status:</strong> <span class="status-badge ${task.status}" style="font-size:0.7rem">${STATUS_LABELS[task.status]}</span></div>
            ${task.originalStartDate?`<div><strong>Original start:</strong> ${formatShort(task.originalStartDate)}</div>`:''}
            ${task.etaDate?`<div><strong>ETA:</strong> ${formatShort(task.etaDate)} ${etaBadgeHtml(task)}</div>`:''}
            ${drift>0?`<div style="color:var(--medium)">⚠️ Schedule drifted by ${drift} day(s)</div>`:''}
          </li>`;
        }
        if (logs.length === 0) {
          list.innerHTML = infoHtml + '<li style="color:var(--text-muted);padding:8px 0">No history entries yet.</li>';
          return;
        }
        list.innerHTML = infoHtml + logs.map(l => {
          const msg = l.LOG_MESSAGE || l.log_message || '';
          const ts  = l.CREATED_AT || l.created_at || '';
          const fmt = ts ? new Date(ts).toLocaleString() : '';
          const icon= msg.includes('rolled over')?'🔁':msg.includes('date')||msg.includes('Date')?'📅':msg.includes('ETA')?'⏳':msg.includes('created')?'🆕':'📝';
          return `<li class="log-timeline-item">
            <div class="log-timeline-dot">${icon}</div>
            <div class="log-timeline-content"><div class="log-message">${escapeHtml(msg)}</div>${fmt?`<div class="log-time">${fmt}</div>`:''}</div>
          </li>`;
        }).join('');
      } catch(e) { if(list) list.innerHTML = '<li style="color:var(--danger)">Failed to load history.</li>'; }
    }
'''
if "function viewLogs" not in content:
    content = content.replace('// ── Status & Filters ──', view_logs_fn + '\n    // ── Status & Filters ──')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")
