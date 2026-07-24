import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add progress group to HTML form in taskModal
progress_html = '''
           <div class="form-group" id="progressGroup" style="display:none">
             <label for="taskProgress">Progress: <strong><span id="progressVal">0</span>%</strong></label>
             <input type="range" id="taskProgress" min="0" max="100" value="0" style="width:100%" oninput="document.getElementById('progressVal').innerText = this.value">
           </div>'''

if 'id="progressGroup"' not in content:
    # We replace the status segment to include onchange events and add progressGroup right after it
    old_status_html = '''<div class="segmented status">
              <label><input type="radio" name="status" value="not_started" checked><span>Not started</span></label>
              <label><input type="radio" name="status" value="in_progress"><span>In progress</span></label>
              <label><input type="radio" name="status" value="on_hold"><span>On hold</span></label>
              <label><input type="radio" name="status" value="completed"><span>Completed</span></label>
            </div>
          </div>'''
    
    new_status_html = '''<div class="segmented status">
              <label><input type="radio" name="status" value="not_started" checked onchange="document.getElementById('progressGroup').style.display='none'"><span>Not started</span></label>
              <label><input type="radio" name="status" value="in_progress" onchange="document.getElementById('progressGroup').style.display=''"><span>In progress</span></label>
              <label><input type="radio" name="status" value="on_hold" onchange="document.getElementById('progressGroup').style.display='none'"><span>On hold</span></label>
              <label><input type="radio" name="status" value="completed" onchange="document.getElementById('progressGroup').style.display='none'"><span>Completed</span></label>
            </div>
          </div>''' + progress_html

    # In case on_hold isn't in the original, use regex
    content = re.sub(r'<div class="segmented status">.*?</label>\s*</div>\s*</div>', new_status_html, content, flags=re.DOTALL)

# 2. Add ETA and Routine fields to HTML form
extra_fields_html = '''
          <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <label for="taskRoutine">Repeat Routine</label>
              <select id="taskRoutine" style="width:100%;padding:10px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg);color:var(--text);">
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label for="taskEta">Target ETA Date</label>
              <input type="date" id="taskEta" style="width:100%;padding:10px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg);color:var(--text);">
            </div>
          </div>
'''
if 'id="taskRoutine"' not in content:
    content = content.replace('<div class="form-group">\n            <label>Assign to</label>', extra_fields_html + '\n          <div class="form-group">\n            <label>Assign to</label>')


# 3. Update openEditModal to set values
if 'document.getElementById(\'taskProgress\').value' not in content:
    edit_modal_injection = '''
      const pv = task.progress || 0;
      const progEl = document.getElementById('taskProgress');
      if (progEl) { progEl.value = pv; document.getElementById('progressVal').textContent = pv; }
      const progGrp = document.getElementById('progressGroup');
      if (progGrp) progGrp.style.display = task.status === 'in_progress' ? '' : 'none';
      const etaEl = document.getElementById('taskEta');
      if (etaEl) etaEl.value = task.etaDate || '';
      const routEl = document.getElementById('taskRoutine');
      if (routEl) routEl.value = task.routineType || 'none';
'''
    content = content.replace("document.getElementById('taskLocation').value = task.locationText || '';", edit_modal_injection + "\n      document.getElementById('taskLocation').value = task.locationText || '';")


# 4. Update handleSubmit to get values
if 'routineType:' not in content:
    submit_replacement_old = '''const status = document.querySelector('input[name="status"]:checked').value;
      const locationText = document.getElementById('taskLocation').value.trim() || null;'''
    
    submit_replacement_new = '''const status = document.querySelector('input[name="status"]:checked').value;
      const routineType = document.getElementById('taskRoutine') ? (document.getElementById('taskRoutine').value || 'none') : 'none';
      const progress = status === 'in_progress' && document.getElementById('taskProgress') ? parseInt(document.getElementById('taskProgress').value) : 0;
      const etaDate = document.getElementById('taskEta') ? (document.getElementById('taskEta').value || null) : null;
      const locationText = document.getElementById('taskLocation').value.trim() || null;'''
    
    content = content.replace(submit_replacement_old, submit_replacement_new)
    
    # Also inject into the body of the fetch requests
    content = content.replace('status, assignedTo, locationText, locationLat, locationLng', 'status, assignedTo, routineType, progress, etaDate, locationText, locationLat, locationLng')

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Modal patched successfully.")
