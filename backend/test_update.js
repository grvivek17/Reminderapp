require('dotenv').config();
const db = require('./db');

async function test() {
  try {
    await db.initialize();
    
    // Check one task for user 2
    const check = await db.execute(
      `SELECT t.id, t.created_by, t.task_date, t.eta_date, t.status, t.routine_type FROM reminder_tasks t
       WHERE t.created_by = :userId AND ROWNUM = 1`,
      { userId: 2 }
    );
    console.log('Found task to update:', check.rows);
    if (check.rows.length === 0) {
      console.log('No tasks found for user 2');
      return;
    }

    const taskId = check.rows[0].ID;
    const text = 'Updated test note text';
    const date = '2026-08-05';
    const priority = 'high';
    const category = 'personal';
    const status = 'in_progress';
    const locationText = 'Office';
    const locationLat = 13.0827;
    const locationLng = 80.2707;
    const routineType = 'none';
    const progress = 50;
    const etaDate = '2026-08-10';

    console.log('Testing UPDATE statement...');
    const updateRes = await db.execute(
      `UPDATE reminder_tasks
       SET text = :taskText, task_date = :taskDate, priority = :taskPriority,
           category = :taskCategory, status = :taskStatus,
           location_text = :locationText, location_lat = :locationLat, location_lng = :locationLng,
           routine_type = :routineType, progress = :progress, eta_date = :etaDate,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      {
        taskText: text,
        taskDate: date,
        taskPriority: priority,
        taskCategory: category,
        taskStatus: status,
        locationText: locationText,
        locationLat: locationLat,
        locationLng: locationLng,
        routineType: routineType,
        progress: progress,
        etaDate: etaDate,
        id: taskId,
      }
    );
    console.log('Update result:', updateRes);

    console.log('Testing log insertion...');
    const logRes = await db.execute('INSERT INTO reminder_task_logs (task_id, log_message) VALUES (:taskId, :msg)', {
      taskId,
      msg: 'Test log entry'
    });
    console.log('Log insert result:', logRes);

  } catch (err) {
    console.error('Test update error:', err);
  } finally {
    await db.close();
  }
}

test();
