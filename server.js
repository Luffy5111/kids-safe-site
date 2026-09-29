const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kids_safe_db'
});

db.connect((err) => {
    if (err) console.error('❌ خطأ الاتصال بقاعدة البيانات:', err);
    else console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
});

// === 1. إدارة الأطفال وتحديث الوقت ===
app.get('/api/children', (req, res) => {
    db.query('SELECT * FROM children', (err, results) => {
        if (err) return res.status(500).json({ error: 'خطأ في جلب البيانات' });
        res.json(results);
    });
});

app.post('/api/children', (req, res) => {
    const { name, gender, age, screen_time_limit } = req.body;
    const sql = 'INSERT INTO children (name, gender, age, screen_time_limit) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, gender, age, screen_time_limit], (err, result) => {
        if (err) return res.status(500).json({ error: 'فشل إضافة الطفل' });
        res.json({ message: 'تمت إضافة الطفل بنجاح 👦👧', id: result.insertId });
    });
});

app.post('/api/children/:id/update-time', (req, res) => {
    const childId = req.params.id;
    const { seconds } = req.body;
    const sql = 'UPDATE children SET used_time_seconds = used_time_seconds + ? WHERE id = ?';
    db.query(sql, [seconds, childId], (err, result) => {
        if (err) return res.status(500).json({ error: 'فشل تحديث الوقت' });
        res.json({ success: true });
    });
});

app.post('/api/children/:id/reset-time', (req, res) => {
    const childId = req.params.id;
    const sql = 'UPDATE children SET used_time_seconds = 0 WHERE id = ?';
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: 'فشل إعادة ضبط الوقت' });
        res.json({ message: 'تمت إعادة فتح وقت المشاهدة للطفل 🔓' });
    });
});

// === 2. إدارة المحتوى والفيديوهات (إضافة، تعديل، حذف) ===
app.get('/api/content', (req, res) => {
    db.query('SELECT * FROM content ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'خطأ جلب المحتوى' });
        res.json(results);
    });
});

app.post('/api/content', (req, res) => {
    const { title, youtube_video_id, min_age, max_age } = req.body;
    const sql = 'INSERT INTO content (title, youtube_video_id, min_age, max_age) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, youtube_video_id, min_age || 3, max_age || 12], (err, result) => {
        if (err) return res.status(500).json({ error: 'فشل إضافة الفيديو' });
        res.json({ message: 'تمت إضافة الفيديو بنجاح 🎬' });
    });
});

// 🔄 تعديل فيديو موجود (تحديث العنوان ورابط اليوتيوب)
app.put('/api/content/:id', (req, res) => {
    const { title, youtube_video_id } = req.body;
    const videoId = req.params.id;
    const sql = 'UPDATE content SET title = ?, youtube_video_id = ? WHERE id = ?';
    db.query(sql, [title, youtube_video_id, videoId], (err, result) => {
        if (err) return res.status(500).json({ error: 'فشل تحديث الفيديو' });
        res.json({ message: 'تم تحديث رابط الفيديو بنجاح ✏️' });
    });
});

// 🗑️ حذف فيديو
app.delete('/api/content/:id', (req, res) => {
    db.query('DELETE FROM content WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'فشل الحذف' });
        res.json({ message: 'تم حذف الفيديو 🗑️' });
    });
});

// === 3. سجل المشاهدات ===
app.post('/api/watch-history', (req, res) => {
    const { child_id, content_id } = req.body;
    const sql = 'INSERT INTO watch_history (child_id, content_id) VALUES (?, ?)';
    db.query(sql, [child_id, content_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'فشل تسجيل المشاهدة' });
        res.json({ success: true });
    });
});

app.get('/api/watch-history/:childId', (req, res) => {
    const sql = `
        SELECT watch_history.id, content.title, content.youtube_video_id, watch_history.watched_at 
        FROM watch_history 
        JOIN content ON watch_history.content_id = content.id 
        WHERE watch_history.child_id = ? 
        ORDER BY watch_history.watched_at DESC
    `;
    db.query(sql, [req.params.childId], (err, results) => {
        if (err) return res.status(500).json({ error: 'فشل جلب سجل المشاهدة' });
        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على: http://localhost:${PORT}`);
});