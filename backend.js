const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3001;
app.use(cors());
app.use(bodyParser.json());
const db = new sqlite3.Database('notifications.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    email TEXT,
    subject TEXT,
    status TEXT,
    timestamp TEXT,
    visitor_name TEXT,
    host_name TEXT,
    purpose TEXT,
    message TEXT
  )`);
});
app.post('/api/notifications', (req, res) => {
  const { type, email, subject, status, timestamp, visitor_name, host_name, purpose, message } = req.body;
  db.run(
    `INSERT INTO notifications (type, email, subject, status, timestamp, visitor_name, host_name, purpose, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [type, email, subject, status, timestamp, visitor_name, host_name, purpose, message],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});
app.get('/api/notifications', (req, res) => {
  db.all('SELECT * FROM notifications ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.get('/api/analytics', (req, res) => {
  db.all('SELECT status FROM notifications', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let sent = 0, pending = 0, failed = 0;
    rows.forEach(r => {
      if (r.status === 'sent') sent++;
      else if (r.status === 'pending') pending++;
      else if (r.status === 'failed') failed++;
    });
    const total = sent + pending + failed;
    const rate = total ? ((sent / total) * 100).toFixed(1) : 0;
    res.json({ sent, pending, failed, rate });
  });
});
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
}); 