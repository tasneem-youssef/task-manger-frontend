const express = require('express');
const router = express.Router();
const { pool } = require('../db.cjs');
const authMiddleware = require('../middleware/auth.cjs');

// add new task
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, dueDate } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, created_by, due_date, completed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, req.user, dueDate, false]
    );
    // Map Snake Case to Camel Case to match frontend expectations if necessary
    const task = result.rows[0];
    res.status(201).json({
        _id: task.id,
        title: task.title,
        description: task.description,
        createdBy: task.created_by,
        dueDate: task.due_date,
        completed: task.completed,
        createdAt: task.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get all tasks
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE created_by = $1',
      [req.user]
    );
    const tasks = result.rows.map(task => ({
        _id: task.id,
        title: task.title,
        description: task.description,
        createdBy: task.created_by,
        dueDate: task.due_date,
        completed: task.completed,
        createdAt: task.created_at
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get single task
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Task not found' });

    const task = result.rows[0];
    if (task.created_by !== req.user)
      return res.status(403).json({ msg: 'Not authorized' });

    res.json({
        _id: task.id,
        title: task.title,
        description: task.description,
        createdBy: task.created_by,
        dueDate: task.due_date,
        completed: task.completed,
        createdAt: task.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update task
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, completed, dueDate } = req.body;
  try {
    const checkResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ msg: 'Task not found' });

    const existingTask = checkResult.rows[0];
    if (existingTask.created_by !== req.user)
      return res.status(403).json({ msg: 'Not authorized' });

    const updatedTitle = title !== undefined ? title : existingTask.title;
    const updatedDescription = description !== undefined ? description : existingTask.description;
    const updatedCompleted = completed !== undefined ? completed : existingTask.completed;
    const updatedDueDate = dueDate !== undefined ? new Date(dueDate) : existingTask.due_date;

    const updateResult = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, completed = $3, due_date = $4 WHERE id = $5 RETURNING *',
      [updatedTitle, updatedDescription, updatedCompleted, updatedDueDate, req.params.id]
    );

    const task = updateResult.rows[0];
    res.json({
        _id: task.id,
        title: task.title,
        description: task.description,
        createdBy: task.created_by,
        dueDate: task.due_date,
        completed: task.completed,
        createdAt: task.created_at
    });
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const checkResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ msg: 'Task not found' });

    if (checkResult.rows[0].created_by !== req.user)
      return res.status(403).json({ msg: 'Not authorized' });

    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
