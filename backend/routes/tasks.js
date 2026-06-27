const express = require('express');
const oracledb = require('oracledb');
const db = require('../db');
const auth = require('../middleware/auth');

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
    assignedTo,
  };
}

// GET /api/tasks -- list tasks visible to the current user (own + assigned)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.execute(
      `SELECT DISTINCT t.id, t.text, t.task_date, t.priority, t.category,
              t.status, t.created_by, t.created_at, t.updated_at
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

// POST /api/tasks -- create a task
router.post('/', auth, async (req, res) => {
  try {
    const { text, date, priority, category, status, assignedTo } = req.body;
    if (!text || !date) {
      return res.status(400).json({ error: 'Text and date are required' });
    }

    const result = await db.execute(
      `INSERT INTO reminder_tasks (text, task_date, priority, category, status, created_by)
       VALUES (:taskText, :taskDate, :taskPriority, :taskCategory, :taskStatus, :createdBy)
       RETURNING id INTO :id`,
      {
        taskText: text,
        taskDate: date,
        taskPriority: priority || 'medium',
        taskCategory: category || 'personal',
        taskStatus: status || 'not_started',
        createdBy: req.user.id,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    const taskId = result.outBinds.id[0];

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
    const { text, date, priority, category, status, assignedTo } = req.body;

    // Verify ownership or assignment
    const check = await db.execute(
      `SELECT t.id, t.created_by FROM reminder_tasks t
       LEFT JOIN reminder_task_assignments a ON t.id = a.task_id AND a.user_id = :userId
       WHERE t.id = :taskId AND (t.created_by = :userId OR a.user_id IS NOT NULL)`,
      { taskId, userId: req.user.id }
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    await db.execute(
      `UPDATE reminder_tasks
       SET text = :taskText, task_date = :taskDate, priority = :taskPriority,
           category = :taskCategory, status = :taskStatus,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      {
        taskText: text,
        taskDate: date,
        taskPriority: priority || 'medium',
        taskCategory: category || 'personal',
        taskStatus: status || 'not_started',
        id: taskId,
      }
    );

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

// DELETE /api/tasks/:id -- delete a task (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    // Only owner can delete
    const check = await db.execute(
      'SELECT id FROM reminder_tasks WHERE id = :taskId AND created_by = :userId',
      { taskId, userId: req.user.id }
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or not owner' });
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

    await db.execute(
      'UPDATE reminder_tasks SET status = :taskStatus, updated_at = CURRENT_TIMESTAMP WHERE id = :id',
      { taskStatus: status, id: taskId }
    );
    res.json({ success: true, status });
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
