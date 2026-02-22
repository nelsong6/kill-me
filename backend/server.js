import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CosmosClient } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { workoutDays, loggedWorkouts, exercises } from './seed-data.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS Configuration
// Allow requests from the frontend Static Web App
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL] 
  : ['http://localhost:5173']; // Fallback for local development

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan('combined'));

// Environment variables
const COSMOS_ENDPOINT = process.env.COSMOS_DB_ENDPOINT;
const DATABASE_NAME = process.env.COSMOS_DB_DATABASE_NAME || 'WorkoutTrackerDB';
const CONTAINER_NAME = process.env.COSMOS_DB_CONTAINER_NAME || 'workouts';

// Initialize Cosmos DB client with Azure Identity (passwordless!)
let container;
try {
  const credential = new DefaultAzureCredential();
  const client = new CosmosClient({
    endpoint: COSMOS_ENDPOINT,
    aadCredentials: credential
  });
  
  const database = client.database(DATABASE_NAME);
  container = database.container(CONTAINER_NAME);
  console.log('✅ Connected to Cosmos DB using Azure Identity');
} catch (error) {
  console.error('❌ Failed to connect to Cosmos DB:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: DATABASE_NAME,
    container: CONTAINER_NAME
  });
});

// Database initialization endpoint (admin only)
app.post('/api/admin/init-database', requireAuth, async (req, res) => {
  try {
    const credential = new DefaultAzureCredential();
    const client = new CosmosClient({
      endpoint: COSMOS_ENDPOINT,
      aadCredentials: credential
    });

    // Create database if it doesn't exist
    const { database } = await client.databases.createIfNotExists({
      id: DATABASE_NAME
    });

    // Create container if it doesn't exist
    const { container: newContainer } = await database.containers.createIfNotExists({
      id: CONTAINER_NAME,
      partitionKey: {
        paths: ['/userId']
      }
    });

    // Seed data
    const seededData = {
      workoutDays: 0,
      loggedWorkouts: 0,
      exercises: 0
    };

    // Seed workout day definitions
    for (const day of workoutDays) {
      try {
        const dayDoc = {
          id: `workout-day-${day.dayNumber}`,
          type: 'workout-day-definition',
          ...day,
          createdAt: new Date().toISOString()
        };
        await newContainer.items.upsert(dayDoc);
        seededData.workoutDays++;
      } catch (err) {
        console.error(`Failed to seed workout day ${day.dayNumber}:`, err.message);
      }
    }

    // Seed logged workouts (historical data)
    for (const workout of loggedWorkouts) {
      try {
        const workoutDoc = {
          id: `logged-workout-${workout.date}-day${workout.dayNumber}`,
          type: 'logged-workout',
          userId: workout.userId,
          dayNumber: workout.dayNumber,
          dayName: workout.dayName,
          date: workout.date,
          timestamp: new Date(workout.date).toISOString(),
          createdAt: new Date().toISOString()
        };
        await newContainer.items.upsert(workoutDoc);
        seededData.loggedWorkouts++;
      } catch (err) {
        console.error(`Failed to seed logged workout for ${workout.date}:`, err.message);
      }
    }

    // Seed exercise library
    for (const exercise of exercises) {
      try {
        const exerciseDoc = {
          id: `exercise-${exercise.dayNumber}-${exercise.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          type: 'exercise',
          ...exercise,
          createdAt: new Date().toISOString()
        };
        await newContainer.items.upsert(exerciseDoc);
        seededData.exercises++;
      } catch (err) {
        console.error(`Failed to seed exercise ${exercise.name}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: 'Database initialized and seeded successfully',
      database: DATABASE_NAME,
      container: CONTAINER_NAME,
      created: {
        database: database ? true : false,
        container: newContainer ? true : false
      },
      seeded: seededData
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize database',
      message: error.message
    });
  }
});

// Get workout day definition by day number
app.get('/api/workout-days/:dayNumber', async (req, res) => {
  try {
    const dayNumber = parseInt(req.params.dayNumber);
    
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 12) {
      return res.status(400).json({ error: 'Invalid day number. Must be between 1 and 12.' });
    }
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.dayNumber = @dayNumber',
      parameters: [
        { name: '@type', value: 'workout-day-definition' },
        { name: '@dayNumber', value: dayNumber }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    
    if (resources.length === 0) {
      return res.status(404).json({ error: 'Workout day not found' });
    }
    
    res.json({ workoutDay: resources[0] });
  } catch (error) {
    console.error('Error fetching workout day:', error);
    res.status(500).json({ error: 'Failed to fetch workout day', message: error.message });
  }
});

// Get exercises for a specific day
app.get('/api/exercises/day/:dayNumber', async (req, res) => {
  try {
    const dayNumber = parseInt(req.params.dayNumber);
    
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 12) {
      return res.status(400).json({ error: 'Invalid day number. Must be between 1 and 12.' });
    }
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.dayNumber = @dayNumber',
      parameters: [
        { name: '@type', value: 'exercise' },
        { name: '@dayNumber', value: dayNumber }
      ]
    };
    
    const { resources: exercises } = await container.items.query(querySpec).fetchAll();
    
    res.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises', message: error.message });
  }
});

// Get logged workouts for a user
app.get('/api/logged-workouts', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.userId = @userId ORDER BY c.date DESC',
      parameters: [
        { name: '@type', value: 'logged-workout' },
        { name: '@userId', value: userId }
      ]
    };
    
    const { resources: workouts } = await container.items.query(querySpec).fetchAll();
    
    res.json({ workouts });
  } catch (error) {
    console.error('Error fetching logged workouts:', error);
    res.status(500).json({ error: 'Failed to fetch logged workouts', message: error.message });
  }
});

// Log a completed workout (quick mode)
app.post('/api/log-workout', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const { dayNumber, dayName, mode, exercises: completedExercises } = req.body;
    
    if (!dayNumber) {
      return res.status(400).json({ error: 'Missing required field: dayNumber' });
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const workoutDoc = {
      id: `logged-workout-${today}-day${dayNumber}-${Date.now()}`,
      type: 'logged-workout',
      userId,
      dayNumber,
      dayName,
      date: today,
      mode: mode || 'quick', // 'quick' or 'detailed'
      exercises: completedExercises || [],
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const { resource } = await container.items.create(workoutDoc);
    
    res.status(201).json({ workout: resource });
  } catch (error) {
    console.error('Error logging workout:', error);
    res.status(500).json({ error: 'Failed to log workout', message: error.message });
  }
});

// Get all workouts for a user (legacy endpoint - returns old format)
app.get('/api/workouts', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.userId = @userId ORDER BY c.date DESC',
      parameters: [
        { name: '@type', value: 'logged-workout' },
        { name: '@userId', value: userId }
      ]
    };
    
    const { resources: loggedWorkouts } = await container.items
      .query(querySpec)
      .fetchAll();
    
    // Transform to old format for compatibility
    const workouts = loggedWorkouts.map(lw => ({
      id: lw.id,
      day: lw.dayNumber,
      dayName: lw.dayName,
      date: lw.timestamp || lw.date,
      exercises: lw.exercises || []
    }));
    
    res.json({ workouts });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts', message: error.message });
  }
});

// Get workouts by day
app.get('/api/workouts/day/:dayNumber', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const dayNumber = parseInt(req.params.dayNumber);
    
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 12) {
      return res.status(400).json({ error: 'Invalid day number. Must be between 1 and 12.' });
    }
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.dayNumber = @dayNumber ORDER BY c.timestamp DESC',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@dayNumber', value: dayNumber }
      ]
    };
    
    const { resources: workouts } = await container.items
      .query(querySpec)
      .fetchAll();
    
    res.json({ workouts });
  } catch (error) {
    console.error('Error fetching workouts by day:', error);
    res.status(500).json({ error: 'Failed to fetch workouts', message: error.message });
  }
});

// Create a new workout
app.post('/api/workouts', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const workout = req.body;
    
    // Validate required fields
    if (!workout.dayNumber || !workout.exercise) {
      return res.status(400).json({ error: 'Missing required fields: dayNumber and exercise' });
    }
    
    // Prepare workout document
    const workoutDoc = {
      id: crypto.randomUUID(),
      userId,
      ...workout,
      timestamp: workout.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const { resource: createdWorkout } = await container.items.create(workoutDoc);
    
    res.status(201).json({ workout: createdWorkout });
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: 'Failed to create workout', message: error.message });
  }
});

// Bulk import workouts (for migration)
app.post('/api/workouts/bulk', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const { workouts } = req.body;
    
    if (!Array.isArray(workouts)) {
      return res.status(400).json({ error: 'Request body must contain an array of workouts' });
    }
    
    const results = [];
    const errors = [];
    
    for (const workout of workouts) {
      try {
        const workoutDoc = {
          id: workout.id || crypto.randomUUID(),
          userId,
          ...workout,
          timestamp: workout.timestamp || new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        const { resource } = await container.items.create(workoutDoc);
        results.push(resource);
      } catch (error) {
        errors.push({ workout, error: error.message });
      }
    }
    
    res.status(201).json({
      success: results.length,
      failed: errors.length,
      workouts: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk importing workouts:', error);
    res.status(500).json({ error: 'Failed to import workouts', message: error.message });
  }
});

// Delete a workout
app.delete('/api/workouts/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const workoutId = req.params.id;
    
    // Delete the workout
    await container.item(workoutId, userId).delete();
    
    res.json({ message: 'Workout deleted successfully', id: workoutId });
  } catch (error) {
    if (error.code === 404) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout', message: error.message });
  }
});

// Get current day (user-specific)
app.get('/api/current-day', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    
    // Query for user settings document
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.type = @type',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@type', value: 'settings' }
      ]
    };
    
    const { resources: settings } = await container.items
      .query(querySpec)
      .fetchAll();
    
    const currentDay = settings[0]?.currentDay || 1;
    res.json({ currentDay });
  } catch (error) {
    console.error('Error fetching current day:', error);
    res.status(500).json({ error: 'Failed to fetch current day', message: error.message });
  }
});

// Update current day
app.put('/api/current-day', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const { currentDay } = req.body;
    
    if (!currentDay || currentDay < 1 || currentDay > 12) {
      return res.status(400).json({ error: 'Invalid day number. Must be between 1 and 12.' });
    }
    
    // Upsert user settings
    const settingsDoc = {
      id: `settings_${userId}`,
      userId,
      type: 'settings',
      currentDay,
      updatedAt: new Date().toISOString()
    };
    
    const { resource } = await container.items.upsert(settingsDoc);
    res.json({ currentDay: resource.currentDay });
  } catch (error) {
    console.error('Error updating current day:', error);
    res.status(500).json({ error: 'Failed to update current day', message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: ${DATABASE_NAME}`);
  console.log(`📦 Container: ${CONTAINER_NAME}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
