// Express API server for the Synergy 12 workout tracker.
//
// Startup is async because config comes from Azure App Configuration and
// Key Vault (fetched at runtime via managed identity). The server cannot
// register auth-protected routes until those values are available, so all
// route registration happens inside startServer() after config is resolved.
//
// All data lives in a single Cosmos DB container partitioned by /userId.
// Document types (workout-day-definition, exercise, logged-workout, settings,
// account) share the container and are distinguished by a `type` field in queries.
//
// Auth model: Microsoft sign-in via MSAL.js. Anyone can view (GET endpoints
// are public). Only the whitelisted admin email can write (POST/PUT/DELETE
// endpoints require auth + admin role).

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CosmosClient } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { workoutDays, loggedWorkouts, exercises } from './seed-data.js';
import { sorenessSeedData } from './seed-soreness.js';
import { createRequireAuth, requireAdmin } from './middleware/auth.js';
import { createMicrosoftRoutes } from './auth/microsoft-routes.js';
import { fetchAppConfig } from './startup/appConfig.js';

// Legacy userId from the previous auth provider. After running the migrate-data
// endpoint, all documents will be re-partitioned under the new Microsoft userId.
const LEGACY_USER_ID = 'cf57d57d-1411-4f59-b517-e9a8600b140a';

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}
app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

async function startServer() {
  // Step 1: Fetch config from Azure App Configuration and Key Vault.
  const { cosmosDbEndpoint, jwtSigningSecret, microsoftClientId } = await fetchAppConfig();

  // Step 2: Build auth middleware with the JWT signing secret.
  const requireAuth = createRequireAuth({ jwtSecret: jwtSigningSecret });

  // Step 3: Initialize Cosmos DB client.
  const DATABASE_NAME = process.env.COSMOS_DB_DATABASE_NAME || 'WorkoutTrackerDB';
  const CONTAINER_NAME = process.env.COSMOS_DB_CONTAINER_NAME || 'workouts';

  let container;
  try {
    const credential = new DefaultAzureCredential();
    const client = new CosmosClient({
      endpoint: cosmosDbEndpoint,
      aadCredentials: credential
    });

    const database = client.database(DATABASE_NAME);
    container = database.container(CONTAINER_NAME);
    console.log('Connected to Cosmos DB using Azure Identity');
  } catch (error) {
    console.error('Failed to connect to Cosmos DB:', error);
    process.exit(1);
  }

  // Step 4: Mount Microsoft auth routes.
  app.use(createMicrosoftRoutes({ jwtSecret: jwtSigningSecret, microsoftClientId, container }));

  // Step 5: Register all routes.

  // --- Public endpoints (no auth required) ---

  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: DATABASE_NAME,
      container: CONTAINER_NAME
    });
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

  // Get all logged workouts (public — Nelson is the only user).
  // Cross-partition query by type; returns all workouts regardless of userId.
  app.get('/api/logged-workouts', async (req, res) => {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.type = @type ORDER BY c.date DESC',
        parameters: [
          { name: '@type', value: 'logged-workout' }
        ]
      };

      const { resources: workouts } = await container.items.query(querySpec).fetchAll();

      res.json({ workouts });
    } catch (error) {
      console.error('Error fetching logged workouts:', error);
      res.status(500).json({ error: 'Failed to fetch logged workouts', message: error.message });
    }
  });

  // Get current day in the 12-day cycle (public).
  // Cross-partition query by type; defaults to day 1 if no settings exist.
  app.get('/api/current-day', async (req, res) => {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.type = @type',
        parameters: [
          { name: '@type', value: 'settings' }
        ]
      };

      const { resources: settings } = await container.items.query(querySpec).fetchAll();

      const currentDay = settings[0]?.currentDay || 1;
      res.json({ currentDay });
    } catch (error) {
      console.error('Error fetching current day:', error);
      res.status(500).json({ error: 'Failed to fetch current day', message: error.message });
    }
  });

  // --- Admin endpoints (auth + admin role required) ---

  // Log a completed workout. Supports two modes:
  // - "quick": just records that the day was done (no exercise details)
  // - "detailed": includes per-exercise weight/reps/sets data
  app.post('/api/log-workout', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { dayNumber, dayName, mode, exercises: completedExercises } = req.body;

      if (!dayNumber) {
        return res.status(400).json({ error: 'Missing required field: dayNumber' });
      }

      const today = new Date().toISOString().split('T')[0];

      const workoutDoc = {
        id: `logged-workout-${today}-day${dayNumber}-${Date.now()}`,
        type: 'logged-workout',
        userId,
        dayNumber,
        dayName,
        date: today,
        mode: mode || 'quick',
        exercises: completedExercises || [],
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const { resource } = await container.items.create(workoutDoc);

      // Auto-advance currentDay if the logged workout matches the current day
      let advancedTo = null;
      const { resources: settings } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.type = @type',
        parameters: [{ name: '@type', value: 'settings' }]
      }).fetchAll();
      const currentDay = settings[0]?.currentDay || 1;
      if (dayNumber === currentDay) {
        const nextDay = currentDay >= 12 ? 1 : currentDay + 1;
        await container.items.upsert({
          ...settings[0],
          id: settings[0]?.id || `settings_${userId}`,
          userId,
          type: 'settings',
          currentDay: nextDay,
          updatedAt: new Date().toISOString()
        });
        advancedTo = nextDay;
      }

      res.status(201).json({ workout: resource, advancedTo });
    } catch (error) {
      console.error('Error logging workout:', error);
      res.status(500).json({ error: 'Failed to log workout', message: error.message });
    }
  });

  // Update a logged workout (date, day number, etc.)
  app.put('/api/logged-workouts/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { date, dayNumber, dayName, mode, exercises: updatedExercises } = req.body;

      // Cross-partition query to find the workout by id
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.type = @type',
        parameters: [
          { name: '@id', value: id },
          { name: '@type', value: 'logged-workout' }
        ]
      }).fetchAll();

      if (resources.length === 0) {
        return res.status(404).json({ error: 'Workout not found' });
      }

      const existing = resources[0];
      const updated = {
        ...existing,
        ...(date !== undefined && { date }),
        ...(dayNumber !== undefined && { dayNumber }),
        ...(dayName !== undefined && { dayName }),
        ...(mode !== undefined && { mode }),
        ...(updatedExercises !== undefined && { exercises: updatedExercises }),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await container.item(id, existing.userId).replace(updated);
      res.json({ workout: resource });
    } catch (error) {
      console.error('Error updating workout:', error);
      res.status(500).json({ error: 'Failed to update workout', message: error.message });
    }
  });

  // Delete a logged workout
  app.delete('/api/logged-workouts/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Cross-partition query to find the workout's partition key
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.type = @type',
        parameters: [
          { name: '@id', value: id },
          { name: '@type', value: 'logged-workout' }
        ]
      }).fetchAll();

      if (resources.length === 0) {
        return res.status(404).json({ error: 'Workout not found' });
      }

      await container.item(id, resources[0].userId).delete();
      res.status(204).send();
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ error: 'Workout not found' });
      }
      console.error('Error deleting workout:', error);
      res.status(500).json({ error: 'Failed to delete workout', message: error.message });
    }
  });

  // Update current day in the 12-day cycle
  app.put('/api/current-day', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { currentDay } = req.body;

      if (!currentDay || currentDay < 1 || currentDay > 12) {
        return res.status(400).json({ error: 'Invalid day number. Must be between 1 and 12.' });
      }

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

  // Database initialization endpoint (admin only).
  // Seeds the 12-day cycle definitions, historical workout logs, and exercise
  // library from seed-data.js. Idempotent — uses upsert so re-running is safe.
  app.post('/api/admin/init-database', requireAuth, requireAdmin, async (req, res) => {
    try {
      const credential = new DefaultAzureCredential();
      const client = new CosmosClient({
        endpoint: cosmosDbEndpoint,
        aadCredentials: credential
      });

      const { database } = await client.databases.createIfNotExists({
        id: DATABASE_NAME
      });

      const { container: newContainer } = await database.containers.createIfNotExists({
        id: CONTAINER_NAME,
        partitionKey: {
          paths: ['/userId']
        }
      });

      const seededData = {
        workoutDays: 0,
        loggedWorkouts: 0,
        exercises: 0
      };

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

  // Data migration endpoint (admin only).
  // Re-partitions all documents from the legacy userId to the authenticated
  // user's new Microsoft userId. Deletes the old documents after re-creating them.
  app.post('/api/admin/migrate-data', requireAuth, requireAdmin, async (req, res) => {
    try {
      const newUserId = req.user.sub;

      // Find all documents under the old userId
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [
          { name: '@userId', value: LEGACY_USER_ID }
        ]
      };

      const { resources: oldDocs } = await container.items
        .query(querySpec, { partitionKey: LEGACY_USER_ID })
        .fetchAll();

      let migrated = 0;
      const errors = [];

      for (const doc of oldDocs) {
        try {
          // Create new document with updated userId
          const { _rid, _self, _etag, _attachments, _ts, ...cleanDoc } = doc;
          const newDoc = { ...cleanDoc, userId: newUserId };

          // For settings docs, update the id to match the new userId
          if (doc.type === 'settings') {
            newDoc.id = `settings_${newUserId}`;
          }

          await container.items.upsert(newDoc);
          await container.item(doc.id, LEGACY_USER_ID).delete();
          migrated++;
        } catch (err) {
          errors.push({ id: doc.id, error: err.message });
        }
      }

      res.json({
        success: true,
        migrated,
        errors: errors.length > 0 ? errors : undefined,
        message: `Migrated ${migrated} documents from legacy userId to ${newUserId}`
      });
    } catch (error) {
      console.error('Error migrating data:', error);
      res.status(500).json({ error: 'Failed to migrate data', message: error.message });
    }
  });

  // Seed soreness journal from spreadsheet data (admin only).
  // Upserts all entries — safe to run multiple times.
  app.post('/api/admin/seed-soreness', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.sub;
      let seeded = 0;
      const errors = [];

      for (const entry of sorenessSeedData) {
        try {
          const doc = {
            id: `soreness-${entry.date}`,
            type: 'soreness-entry',
            userId,
            date: entry.date,
            muscles: entry.muscles,
            updatedAt: new Date().toISOString(),
          };
          await container.items.upsert(doc);
          seeded++;
        } catch (err) {
          errors.push({ date: entry.date, error: err.message });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${seeded} soreness entries`,
        seeded,
        total: sorenessSeedData.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('Error seeding soreness data:', error);
      res.status(500).json({ error: 'Failed to seed soreness data', message: error.message });
    }
  });

  // --- Soreness journal endpoints ---

  // Get all soreness entries (public — single user).
  // Cross-partition query by type; returns all entries newest first.
  app.get('/api/soreness', async (req, res) => {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.type = @type ORDER BY c.date DESC',
        parameters: [
          { name: '@type', value: 'soreness-entry' }
        ]
      };

      const { resources: entries } = await container.items.query(querySpec).fetchAll();
      res.json({ entries });
    } catch (error) {
      console.error('Error fetching soreness entries:', error);
      res.status(500).json({ error: 'Failed to fetch soreness entries', message: error.message });
    }
  });

  // Create or update a soreness entry for a given date (admin only).
  // Upserts by date — one entry per date, each containing an array of sore muscles.
  // Body: { date: "2026-01-15", muscles: [{ group, muscle, level }] }
  app.post('/api/soreness', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { date, muscles } = req.body;

      if (!date) {
        return res.status(400).json({ error: 'Missing required field: date' });
      }
      if (!muscles || !Array.isArray(muscles)) {
        return res.status(400).json({ error: 'Missing required field: muscles (array)' });
      }

      // Validate each muscle entry. muscle can be null for group-level soreness.
      for (const m of muscles) {
        if (!m.group || !m.level) {
          return res.status(400).json({ error: 'Each muscle entry requires group and level' });
        }
        if (m.level < 1 || m.level > 10) {
          return res.status(400).json({ error: 'Soreness level must be between 1 and 10' });
        }
      }

      const doc = {
        id: `soreness-${date}`,
        type: 'soreness-entry',
        userId,
        date,
        muscles,
        updatedAt: new Date().toISOString()
      };

      const { resource } = await container.items.upsert(doc);
      res.status(201).json({ entry: resource });
    } catch (error) {
      console.error('Error saving soreness entry:', error);
      res.status(500).json({ error: 'Failed to save soreness entry', message: error.message });
    }
  });

  // Delete a soreness entry by date (admin only).
  app.delete('/api/soreness/:date', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { date } = req.params;
      const id = `soreness-${date}`;

      await container.item(id, userId).delete();
      res.status(204).send();
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ error: 'Soreness entry not found' });
      }
      console.error('Error deleting soreness entry:', error);
      res.status(500).json({ error: 'Failed to delete soreness entry', message: error.message });
    }
  });

  // --- Cardio session endpoints ---

  // Get all cardio sessions (public — single user).
  // Cross-partition query by type; returns all sessions newest first.
  app.get('/api/cardio-sessions', async (req, res) => {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.type = @type ORDER BY c.date DESC',
        parameters: [
          { name: '@type', value: 'cardio-session' }
        ]
      };

      const { resources: sessions } = await container.items.query(querySpec).fetchAll();
      res.json({ sessions });
    } catch (error) {
      console.error('Error fetching cardio sessions:', error);
      res.status(500).json({ error: 'Failed to fetch cardio sessions', message: error.message });
    }
  });

  // Log a cardio session (admin only).
  // Body: { date, activity, durationMinutes, notes?, treadmill?, bike? }
  app.post('/api/cardio-sessions', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { date, activity, durationMinutes, notes, treadmill, bike } = req.body;

      if (!date) {
        return res.status(400).json({ error: 'Missing required field: date' });
      }
      if (!activity || !['treadmill', 'bike'].includes(activity)) {
        return res.status(400).json({ error: 'activity must be "treadmill" or "bike"' });
      }

      const doc = {
        id: `cardio-${date}-${activity}-${Date.now()}`,
        type: 'cardio-session',
        userId,
        date,
        activity,
        durationMinutes: durationMinutes || null,
        notes: notes || '',
        ...(treadmill && { treadmill }),
        ...(bike && { bike }),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const { resource } = await container.items.create(doc);
      res.status(201).json({ session: resource });
    } catch (error) {
      console.error('Error logging cardio session:', error);
      res.status(500).json({ error: 'Failed to log cardio session', message: error.message });
    }
  });

  // Update a cardio session (admin only).
  app.put('/api/cardio-sessions/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { date, activity, durationMinutes, notes, treadmill, bike } = req.body;

      // Cross-partition query to find the session by id
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.type = @type',
        parameters: [
          { name: '@id', value: id },
          { name: '@type', value: 'cardio-session' }
        ]
      }).fetchAll();

      if (resources.length === 0) {
        return res.status(404).json({ error: 'Cardio session not found' });
      }

      const existing = resources[0];
      const updated = {
        ...existing,
        ...(date !== undefined && { date }),
        ...(activity !== undefined && { activity }),
        ...(durationMinutes !== undefined && { durationMinutes }),
        ...(notes !== undefined && { notes }),
        ...(treadmill !== undefined && { treadmill }),
        ...(bike !== undefined && { bike }),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await container.item(id, existing.userId).replace(updated);
      res.json({ session: resource });
    } catch (error) {
      console.error('Error updating cardio session:', error);
      res.status(500).json({ error: 'Failed to update cardio session', message: error.message });
    }
  });

  // Delete a cardio session (admin only).
  app.delete('/api/cardio-sessions/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Cross-partition query to find the session's partition key
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.type = @type',
        parameters: [
          { name: '@id', value: id },
          { name: '@type', value: 'cardio-session' }
        ]
      }).fetchAll();

      if (resources.length === 0) {
        return res.status(404).json({ error: 'Cardio session not found' });
      }

      await container.item(id, resources[0].userId).delete();
      res.status(204).send();
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ error: 'Cardio session not found' });
      }
      console.error('Error deleting cardio session:', error);
      res.status(500).json({ error: 'Failed to delete cardio session', message: error.message });
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

  // Step 6: Start listening only after all setup is complete.
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database: ${DATABASE_NAME}`);
    console.log(`Container: ${CONTAINER_NAME}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});

export default app;
