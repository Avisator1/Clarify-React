const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'mood-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create journal entry
router.post('/entries', authenticateToken, upload.single('photo'), [
  body('mood').optional().isString(),
  body('notes').optional().isString(),
  body('emotions').optional().isString(),
  body('primary_emotion').optional().isString(),
  body('secondary_emotion').optional().isString(),
  body('intensity').optional().isInt({ min: 1, max: 10 }),
  body('insights').optional().isString(),
  body('tips').optional().isString(),
  body('confidence').optional().isInt({ min: 0, max: 100 }),
  body('quick_insight').optional().isString(),
  body('detailed_insights').optional().isString(),
  body('mood_trends').optional().isString(),
  body('chart_data').optional().isString(),
  body('analysis_summary').optional().isString(),
  body('additional_data').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const {
      mood,
      notes,
      emotions,
      primary_emotion,
      secondary_emotion,
      intensity,
      insights,
      tips,
      confidence,
      facial_analysis,
      mood_factors,
      wellness_indicators,
      recommendations,
      quick_insight,
      detailed_insights,
      mood_trends,
      chart_data,
      analysis_summary,
      additional_data
    } = req.body;

    const userId = req.user.id;
    const photoPath = req.file ? req.file.path : null;

    // Debug logging for received data
    console.log('Received journal entry data:', {
      mood,
      primary_emotion,
      secondary_emotion,
      intensity,
      insights,
      recommendations,
      detailed_insights,
      mood_trends,
      chart_data,
      analysis_summary,
      additional_data
    });

    const sql = `
      INSERT INTO journal_entries (
        user_id, photo_path, mood, notes, emotions, 
        primary_emotion, secondary_emotion, intensity, insights, tips, confidence,
        facial_analysis, mood_factors, wellness_indicators, recommendations,
        quick_insight, detailed_insights, mood_trends, chart_data, analysis_summary, additional_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      photoPath,
      mood,
      notes,
      emotions,
      primary_emotion,
      secondary_emotion,
      intensity,
      insights,
      tips,
      confidence,
      facial_analysis,
      mood_factors,
      wellness_indicators,
      recommendations,
      quick_insight,
      detailed_insights,
      mood_trends,
      chart_data,
      analysis_summary,
      additional_data
    ];

    console.log('Inserting values into database:', values);

    db.run(sql, values, function(err) {
      if (err) {
        console.error('Error creating journal entry:', err);
        console.error('SQL query:', sql);
        console.error('Values being inserted:', values);
        return res.status(500).json({ error: 'Failed to create journal entry' });
      }

      res.status(201).json({
        message: 'Journal entry created successfully',
        entry: {
          id: this.lastID,
          userId,
          photoPath,
          mood,
          notes,
          emotions: emotions ? JSON.parse(emotions) : [],
          primary_emotion,
          intensity,
          insights: insights ? JSON.parse(insights) : [],
          tips: tips ? JSON.parse(tips) : [],
          confidence,
          created_at: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Journal entry creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's journal entries
router.get('/entries', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let sql = `
      SELECT * FROM journal_entries 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    
    let params = [userId];

    // Filter by month and year if provided
    if (month && year) {
      sql = `
        SELECT * FROM journal_entries 
        WHERE user_id = ? 
        AND strftime('%m', created_at) = ? 
        AND strftime('%Y', created_at) = ?
        ORDER BY created_at DESC
      `;
      params = [userId, month.padStart(2, '0'), year];
    }

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching journal entries:', err);
        return res.status(500).json({ error: 'Failed to fetch journal entries' });
      }

      const entries = rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        photoPath: row.photo_path,
        mood: row.mood,
        notes: row.notes,
        emotions: row.emotions ? JSON.parse(row.emotions) : [],
        primary_emotion: row.primary_emotion,
        secondary_emotion: row.secondary_emotion,
        intensity: row.intensity,
        insights: row.insights ? JSON.parse(row.insights) : [],
        tips: row.tips ? JSON.parse(row.tips) : [],
        confidence: row.confidence,
        facial_analysis: row.facial_analysis,
        mood_factors: row.mood_factors,
        wellness_indicators: row.wellness_indicators,
        recommendations: row.recommendations ? JSON.parse(row.recommendations) : null,
        quick_insight: row.quick_insight,
        detailed_insights: row.detailed_insights ? JSON.parse(row.detailed_insights) : null,
        mood_trends: row.mood_trends ? JSON.parse(row.mood_trends) : null,
        chart_data: row.chart_data ? JSON.parse(row.chart_data) : null,
        analysis_summary: row.analysis_summary,
        additional_data: row.additional_data ? JSON.parse(row.additional_data) : null,
        created_at: row.created_at
      }));

      res.json({ entries });
    });
  } catch (error) {
    console.error('Journal entries fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get journal entry by ID
router.get('/entries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sql = `
      SELECT * FROM journal_entries 
      WHERE id = ? AND user_id = ?
    `;

    db.get(sql, [id, userId], (err, row) => {
      if (err) {
        console.error('Error fetching journal entry:', err);
        return res.status(500).json({ error: 'Failed to fetch journal entry' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }

      const entry = {
        id: row.id,
        userId: row.user_id,
        photoPath: row.photo_path,
        mood: row.mood,
        notes: row.notes,
        emotions: row.emotions ? JSON.parse(row.emotions) : [],
        primary_emotion: row.primary_emotion,
        secondary_emotion: row.secondary_emotion,
        intensity: row.intensity,
        insights: row.insights ? JSON.parse(row.insights) : [],
        tips: row.tips ? JSON.parse(row.tips) : [],
        confidence: row.confidence,
        facial_analysis: row.facial_analysis,
        mood_factors: row.mood_factors,
        wellness_indicators: row.wellness_indicators,
        recommendations: row.recommendations ? JSON.parse(row.recommendations) : null,
        quick_insight: row.quick_insight,
        detailed_insights: row.detailed_insights ? JSON.parse(row.detailed_insights) : null,
        mood_trends: row.mood_trends ? JSON.parse(row.mood_trends) : null,
        chart_data: row.chart_data ? JSON.parse(row.chart_data) : null,
        analysis_summary: row.analysis_summary,
        additional_data: row.additional_data ? JSON.parse(row.additional_data) : null,
        created_at: row.created_at
      };

      res.json({ entry });
    });
  } catch (error) {
    console.error('Journal entry fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete journal entry
router.delete('/entries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`Deleting entry ${id} for user ${userId}`);

    db.run(
      'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
      [id, userId],
      function(err) {
        if (err) {
          console.error('Error deleting journal entry:', err);
          return res.status(500).json({ error: 'Failed to delete journal entry' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Journal entry not found' });
        }

        res.json({ message: 'Journal entry deleted successfully' });
      }
    );
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

// Get analytics data
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'week' } = req.query;

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
    } else if (period === 'month') {
      dateFilter = "AND created_at >= datetime('now', '-30 days')";
    }

    const sql = `
      SELECT 
        primary_emotion,
        intensity,
        created_at,
        COUNT(*) as count
      FROM journal_entries 
      WHERE user_id = ? ${dateFilter}
      GROUP BY primary_emotion, DATE(created_at)
      ORDER BY created_at DESC
    `;

    db.all(sql, [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching analytics:', err);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
      }

      // Calculate statistics
      const totalEntries = rows.length;
      const avgIntensity = rows.length > 0 
        ? rows.reduce((sum, row) => sum + row.intensity, 0) / rows.length 
        : 0;
      
      const emotionCounts = {};
      rows.forEach(row => {
        emotionCounts[row.primary_emotion] = (emotionCounts[row.primary_emotion] || 0) + row.count;
      });

      const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b] ? a : b, 'Neutral'
      );

      res.json({
        totalEntries,
        avgIntensity: Math.round(avgIntensity * 10) / 10,
        mostCommonEmotion,
        emotionCounts,
        entries: rows.map(row => ({
          emotion: row.primary_emotion,
          intensity: row.intensity,
          date: row.created_at,
          count: row.count
        }))
      });
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
