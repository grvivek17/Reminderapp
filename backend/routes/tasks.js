const express = require('express');
const oracledb = require('oracledb');
const db = require('../db');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

const router = express.Router();

// Helper: build task object from DB row + assignments
function rowToTask(row, assignedTo = []) {
  // Normalize date to YYYY-MM-DD string (Oracle may return Date objects)
  let dateVal = row.TASK_DATE;
  if (dateVal instanceof Date) {
    dateVal = dateVal.toISOString().slice(0, 10);
  }
  return {
    id: row.ID,
    text: row.TEXT,
    date: dateVal,
    priority: row.PRIORITY,
    category: row.CATEGORY,
    status: row.STATUS,
    createdBy: row.CREATED_BY,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT,
    locationText: row.LOCATION_TEXT || null,
    locationLat: row.LOCATION_LAT != null ? Number(row.LOCATION_LAT) : null,
    locationLng: row.LOCATION_LNG != null ? Number(row.LOCATION_LNG) : null,
    routineType: row.ROUTINE_TYPE || 'none',
    progress: row.PROGRESS || 0,
    etaDate: row.ETA_DATE || null,
    originalStartDate: row.ORIGINAL_START_DATE || null,
    assignedTo,
  };
}

// GET /api/tasks -- list tasks visible to the current user (own + assigned)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.execute(
      `SELECT DISTINCT t.id, t.text, t.task_date, t.priority, t.category,
              t.status, t.created_by, t.created_at, t.updated_at,
              t.location_text, t.location_lat, t.location_lng,
              t.routine_type, t.progress, t.eta_date, t.original_start_date
       FROM reminder_tasks t
       LEFT JOIN reminder_task_assignments a ON t.id = a.task_id
       WHERE t.created_by = :userId OR a.user_id = :userId
       ORDER BY t.task_date, t.created_at`,
      { userId }
    );

    // Fetch assignments for all returned tasks
    const taskIds = result.rows.map(r => r.ID);
    let assignmentsMap = {};
    if (taskIds.length > 0) {
      // Batch fetch assignments
      const aResult = await db.execute(
        `SELECT task_id, user_id FROM reminder_task_assignments
         WHERE task_id IN (${taskIds.join(',')})` // safe: IDs are numbers from our own query
      );
      for (const a of aResult.rows) {
        if (!assignmentsMap[a.TASK_ID]) assignmentsMap[a.TASK_ID] = [];
        assignmentsMap[a.TASK_ID].push(a.USER_ID);
      }
    }

    const tasks = result.rows.map(r => rowToTask(r, assignmentsMap[r.ID] || []));
    res.json(tasks);
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/geocode -- proxy geocoding to bypass CORS/User-Agent blocks
router.get('/geocode', auth, async (req, res) => {
  try {
    const { q, lat, lon } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query string q is required' });
    }
    let viewboxParam = '';
    if (lat && lon) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lon);
      const delta = 0.5;
      viewboxParam = `&viewbox=${uLng - delta},${uLat + delta},${uLng + delta},${uLat - delta}&bounded=0`;
    }
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=3&countrycodes=in${viewboxParam}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SmartReminderApp/1.0 (grvivek17@gmail.com)'
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Geocoding service error' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy geocoding error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks -- create a task
router.post('/', auth, async (req, res) => {
  try {
    const { text, date, priority, category, status, assignedTo, locationText, locationLat, locationLng, routineType, progress, etaDate } = req.body;
    if (!text || !date) {
      return res.status(400).json({ error: 'Text and date are required' });
    }

    const result = await db.execute(
      `INSERT INTO reminder_tasks (text, task_date, priority, category, status, created_by, location_text, location_lat, location_lng, routine_type, progress, eta_date, original_start_date)
       VALUES (:taskText, :taskDate, :taskPriority, :taskCategory, :taskStatus, :createdBy, :locationText, :locationLat, :locationLng, :routineType, :progress, :etaDate, :originalStartDate)
       RETURNING id INTO :id`,
      {
        taskText: text,
        taskDate: date,
        taskPriority: priority || 'medium',
        taskCategory: category || 'personal',
        taskStatus: status || 'not_started',
        createdBy: req.user.id,
        locationText: locationText || null,
        locationLat: locationLat != null ? locationLat : null,
        locationLng: locationLng != null ? locationLng : null,
        routineType: routineType || 'none',
        progress: progress || 0,
        etaDate: etaDate || null,
        originalStartDate: date,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    const taskId = result.outBinds.id[0];

    // Initial log entry
    await db.execute('INSERT INTO reminder_task_logs (task_id, log_message) VALUES (:taskId, :msg)', {
      taskId, msg: `Task created for ${date}.`
    });

    // Insert assignments
    const assignees = assignedTo || [];
    for (const userId of assignees) {
      await db.execute(
        'INSERT INTO reminder_task_assignments (task_id, user_id) VALUES (:taskId, :userId)',
        { taskId, userId }
      );
    }

    // Return the created task
    const taskResult = await db.execute(
      'SELECT * FROM reminder_tasks WHERE id = :id',
      { id: taskId }
    );
    res.status(201).json(rowToTask(taskResult.rows[0], assignees));
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id -- update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { text, date, priority, category, status, assignedTo, locationText, locationLat, locationLng, routineType, progress, etaDate } = req.body;

    // Verify ownership or assignment and fetch old data
    const check = await db.execute(
      `SELECT t.id, t.created_by, t.task_date, t.eta_date, t.status, t.routine_type FROM reminder_tasks t
       LEFT JOIN reminder_task_assignments a ON t.id = a.task_id AND a.user_id = :userId
       WHERE t.id = :taskId AND (t.created_by = :userId OR a.user_id IS NOT NULL)`,
      { taskId, userId: req.user.id }
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }
    const oldTask = check.rows[0];

    // Handle Routine rollover if completed
    let finalDate = date;
    let finalEta = etaDate || null;
    let finalStatus = status || 'not_started';
    let didRollover = false;
    const finalRoutineType = routineType || 'none';

    if (finalStatus === 'completed' && ['daily', 'weekly', 'monthly'].includes(finalRoutineType)) {
      const oldD = new Date(finalDate);
      if (!isNaN(oldD)) {
        if (finalRoutineType === 'daily') oldD.setDate(oldD.getDate() + 1);
        if (finalRoutineType === 'weekly') oldD.setDate(oldD.getDate() + 7);
        if (finalRoutineType === 'monthly') oldD.setMonth(oldD.getMonth() + 1);
        finalDate = oldD.toISOString().slice(0, 10);
        
        if (finalEta) {
          const etaD = new Date(finalEta);
          if (!isNaN(etaD)) {
            if (finalRoutineType === 'daily') etaD.setDate(etaD.getDate() + 1);
            if (finalRoutineType === 'weekly') etaD.setDate(etaD.getDate() + 7);
            if (finalRoutineType === 'monthly') etaD.setMonth(etaD.getMonth() + 1);
            finalEta = etaD.toISOString().slice(0, 10);
          }
        }
        finalStatus = 'not_started';
        didRollover = true;
      }
    }

    const logsToInsert = [];
    if (didRollover) {
      logsToInsert.push(`Task completed and rolled over. Next due: ${finalDate}`);
    } else {
      const oldTaskDate = oldTask.TASK_DATE instanceof Date ? oldTask.TASK_DATE.toISOString().slice(0,10) : oldTask.TASK_DATE;
      const oldEtaDate = oldTask.ETA_DATE instanceof Date ? oldTask.ETA_DATE.toISOString().slice(0,10) : oldTask.ETA_DATE;
      if (oldTaskDate !== finalDate) {
        logsToInsert.push(`Start date changed from ${oldTaskDate || 'none'} to ${finalDate}`);
      }
      if (oldEtaDate !== finalEta && (oldEtaDate || finalEta)) {
        logsToInsert.push(`ETA changed from ${oldEtaDate || 'none'} to ${finalEta || 'none'}`);
      }
    }

    await db.execute(
      `UPDATE reminder_tasks
       SET text = :taskText, task_date = :taskDate, priority = :taskPriority,
           category = :taskCategory, status = :taskStatus,
           location_text = :locationText, location_lat = :locationLat, location_lng = :locationLng,
           routine_type = :routineType, progress = :progress, eta_date = :etaDate,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      {
        taskText: text,
        taskDate: finalDate,
        taskPriority: priority || 'medium',
        taskCategory: category || 'personal',
        taskStatus: finalStatus,
        locationText: locationText || null,
        locationLat: locationLat != null ? locationLat : null,
        locationLng: locationLng != null ? locationLng : null,
        routineType: finalRoutineType,
        progress: progress || 0,
        etaDate: finalEta,
        id: taskId,
      }
    );

    for (const msg of logsToInsert) {
      await db.execute('INSERT INTO reminder_task_logs (task_id, log_message) VALUES (:taskId, :msg)', { taskId, msg });
    }

    // Update assignments: delete old, insert new
    if (assignedTo !== undefined) {
      await db.execute(
        'DELETE FROM reminder_task_assignments WHERE task_id = :taskId',
        { taskId }
      );
      for (const userId of assignedTo) {
        await db.execute(
          'INSERT INTO reminder_task_assignments (task_id, user_id) VALUES (:taskId, :userId)',
          { taskId, userId }
        );
      }
    }

    // Return updated task
    const taskResult = await db.execute('SELECT * FROM reminder_tasks WHERE id = :id', { id: taskId });
    const aResult = await db.execute(
      'SELECT user_id FROM reminder_task_assignments WHERE task_id = :taskId',
      { taskId }
    );
    res.json(rowToTask(taskResult.rows[0], aResult.rows.map(r => r.USER_ID)));
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id -- delete a task (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    const check = await db.execute(
      'SELECT id FROM reminder_tasks WHERE id = :taskId',
      { taskId }
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Assignments cascade-delete automatically
    await db.execute('DELETE FROM reminder_tasks WHERE id = :id', { id: taskId });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id/status -- quick status update
router.put('/:id/status', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const check = await db.execute('SELECT task_date, eta_date, routine_type FROM reminder_tasks WHERE id = :id', { id: taskId });
    if (check.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    
    const task = check.rows[0];
    let finalStatus = status;
    let finalDate = task.TASK_DATE instanceof Date ? task.TASK_DATE.toISOString().slice(0, 10) : task.TASK_DATE;
    let finalEta = task.ETA_DATE instanceof Date ? task.ETA_DATE.toISOString().slice(0, 10) : task.ETA_DATE;
    const routineType = task.ROUTINE_TYPE || 'none';
    
    let logsToInsert = [];
    if (finalStatus === 'completed' && ['daily', 'weekly', 'monthly'].includes(routineType)) {
      const oldD = new Date(finalDate);
      if (!isNaN(oldD)) {
        if (routineType === 'daily') oldD.setDate(oldD.getDate() + 1);
        if (routineType === 'weekly') oldD.setDate(oldD.getDate() + 7);
        if (routineType === 'monthly') oldD.setMonth(oldD.getMonth() + 1);
        finalDate = oldD.toISOString().slice(0, 10);
        
        if (finalEta) {
          const etaD = new Date(finalEta);
          if (!isNaN(etaD)) {
            if (routineType === 'daily') etaD.setDate(etaD.getDate() + 1);
            if (routineType === 'weekly') etaD.setDate(etaD.getDate() + 7);
            if (routineType === 'monthly') etaD.setMonth(etaD.getMonth() + 1);
            finalEta = etaD.toISOString().slice(0, 10);
          }
        }
        finalStatus = 'not_started';
        logsToInsert.push(`Task completed and rolled over. Next due: ${finalDate}`);
      }
    }

    await db.execute(
      'UPDATE reminder_tasks SET status = :taskStatus, task_date = :taskDate, eta_date = :etaDate, updated_at = CURRENT_TIMESTAMP WHERE id = :id',
      { taskStatus: finalStatus, taskDate: finalDate, etaDate: finalEta, id: taskId }
    );
    
    for (const msg of logsToInsert) {
      await db.execute('INSERT INTO reminder_task_logs (task_id, log_message) VALUES (:taskId, :msg)', { taskId, msg });
    }

    res.json({ success: true, status: finalStatus, newDate: finalDate });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks/:id/assign -- update task assignments
router.post('/:id/assign', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { assignedTo } = req.body;
    if (!Array.isArray(assignedTo)) {
      return res.status(400).json({ error: 'assignedTo must be an array' });
    }

    await db.execute('DELETE FROM reminder_task_assignments WHERE task_id = :taskId', { taskId });
    for (const userId of assignedTo) {
      await db.execute(
        'INSERT INTO reminder_task_assignments (task_id, user_id) VALUES (:taskId, :userId)',
        { taskId, userId }
      );
    }
    res.json({ success: true, assignedTo });
  } catch (err) {
    console.error('Assign error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

// GET /api/tasks/:id/logs -- get task history logs
router.get('/:id/logs', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const result = await db.execute(
      'SELECT id, log_message, created_at FROM reminder_task_logs WHERE task_id = :taskId ORDER BY created_at ASC',
      { taskId }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
