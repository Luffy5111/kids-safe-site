const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// الاتصال بقاعدة بيانات MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ddke3661_db_user:0gqGPerHWxF6P0O@cluster0.lxa8yjm.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// 1. تعريف النماذج (Schemas) المتوافقة تماماً مع الواجهة
const childSchema = new mongoose.Schema({
  name: String,
  gender: { type: String, default: 'boy' },
  screen_time_limit: { type: Number, default: 30 }, // بالدقائق
  used_time_seconds: { type: Number, default: 0 }
});
const Child = mongoose.model('Child', childSchema);

const contentSchema = new mongoose.Schema({
  title: String,
  youtube_video_id: String,
  createdAt: { type: Date, default: Date.now }
});
const Content = mongoose.model('Content', contentSchema);

const watchHistorySchema = new mongoose.Schema({
  child_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
  content_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  watched_at: { type: Date, default: Date.now }
});
const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

// 2. المسارات (Endpoints)

// جلب الأطفال
app.get('/api/children', async (req, res) => {
  try {
    const children = await Child.find({});
    res.json(children);
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب بيانات الأطفال' });
  }
});

// إضافة طفل جديد (التي كانت ناقصة لديك)
app.post('/api/children', async (req, res) => {
  try {
    const { name, gender, screen_time_limit } = req.body;
    const newChild = new Child({
      name,
      gender: gender || 'boy',
      screen_time_limit: Number(screen_time_limit) || 30,
      used_time_seconds: 0
    });
    await newChild.save();
    res.status(201).json({ message: 'تمت إضافة الطفل بنجاح', child: newChild });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في حفظ بيانات الطفل' });
  }
});

// تحديث الوقت المستهلك للطفل
app.post('/api/children/:id/update-time', async (req, res) => {
  try {
    const { seconds } = req.body;
    await Child.findByIdAndUpdate(req.params.id, {
      $inc: { used_time_seconds: seconds || 5 }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في تحديث الوقت' });
  }
});

// إعادة تعيين وقت الطفل (إعادة فتح الوقت)
app.post('/api/children/:id/reset-time', async (req, res) => {
  try {
    await Child.findByIdAndUpdate(req.params.id, { used_time_seconds: 0 });
    res.json({ message: 'تم إعادة فتح الوقت بنجاح للطفل 🔓' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في إعادة تعيين الوقت' });
  }
});

// جلب المحتوى (الفيديوهات)
app.get('/api/content', async (req, res) => {
  try {
    const contents = await Content.find({});
    res.json(contents);
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب المحتوى' });
  }
});

// إضافة فيديو جديد
app.post('/api/content', async (req, res) => {
  try {
    const { title, youtube_video_id } = req.body;
    const newContent = new Content({ title, youtube_video_id });
    await newContent.save();
    res.json({ message: 'تمت إضافة الفيديو بنجاح', success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في حفظ المحتوى' });
  }
});

// تعديل فيديو موجود
app.put('/api/content/:id', async (req, res) => {
  try {
    const { title, youtube_video_id } = req.body;
    await Content.findByIdAndUpdate(req.params.id, { title, youtube_video_id });
    res.json({ message: 'تم تحديث الفيديو بنجاح ✏️️', success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في تحديث الفيديو' });
  }
});

// حذف فيديو
app.delete('/api/content/:id', async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الفيديو', success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الحذف' });
  }
});

// تسجيل مشاهدة فيديو
app.post('/api/watch-history', async (req, res) => {
  try {
    const { child_id, content_id } = req.body;
    const history = new WatchHistory({ child_id, content_id });
    await history.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في تسجيل المشاهدة' });
  }
});

// جلب سجل المشاهدات لطفل معين
app.get('/api/watch-history/:child_id', async (req, res) => {
  try {
    const history = await WatchHistory.find({ child_id: req.params.child_id })
      .populate('content_id')
      .sort({ watched_at: -1 });
    
    const formatted = history.map(h => ({
      title: h.content_id ? h.content_id.title : 'فيديو محذوف',
      watched_at: h.watched_at
    }));
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب سجل المشاهدات' });
  }
});

// 3. تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});