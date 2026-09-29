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

// 1. تعريف النماذج (Schemas) كاملة
const childSchema = new mongoose.Schema({
  name: String,
  avatar: String,
  pin: String
});
const Child = mongoose.model('Child', childSchema);

const contentSchema = new mongoose.Schema({
  title: String,
  youtube_video_id: String,
  video_id: String,
  createdAt: { type: Date, default: Date.now }
});
const Content = mongoose.model('Content', contentSchema);

const watchHistorySchema = new mongoose.Schema({
  child_id: mongoose.Schema.Types.ObjectId,
  content_id: mongoose.Schema.Types.ObjectId,
  watched_at: { type: Date, default: Date.now }
});
const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

// 2. المسارات (Endpoints) كاملة

// مسار جلب الأطفال (أحمد وسارة) - مع الإضافة التلقائية إذا كانت القاعدة فارغة
app.get('/api/children', async (req, res) => {
  try {
    let children = await Child.find({});
    if (children.length === 0) {
      children = await Child.insertMany([
        { name: 'أحمد', avatar: '', pin: '' },
        { name: 'سارة', avatar: '', pin: '' }
      ]);
    }
    res.json(children);
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب بيانات الأطفال' });
  }
});

// مسارات المحتوى (القديمة والجديدة)
app.get('/api/content', async (req, res) => {
  try {
    const contents = await Content.find({});
    res.json(contents);
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب المحتوى' });
  }
});

app.post('/api/content', async (req, res) => {
  try {
    const { title, youtube_video_id, video_id } = req.body;
    const newContent = new Content({ title, youtube_video_id, video_id });
    await newContent.save();
    res.json({ message: 'تم تحديث/حفظ الفيديو بنجاح', success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في حفظ المحتوى' });
  }
});

app.delete('/api/content/:id', async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الفيديو', success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الحذف' });
  }
});

// 3. تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});