import { Router } from 'express';

/**
 * Cardio session routes.
 *
 * Public:
 *   GET    /api/cardio-sessions
 *
 * Admin:
 *   POST   /api/cardio-sessions
 *   PUT    /api/cardio-sessions/:id
 *   DELETE /api/cardio-sessions/:id
 */
export function createCardioRoutes({ container, requireAuth, requireAdmin }) {
  const router = Router();

  // Get all cardio sessions (public).
  router.get('/api/cardio-sessions', async (req, res) => {
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
  router.post('/api/cardio-sessions', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { date, time, activity, durationMinutes, notes, treadmill, bike } = req.body;

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
        time: time || null,
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
  router.put('/api/cardio-sessions/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { date, time, activity, durationMinutes, notes, treadmill, bike } = req.body;

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
        ...(time !== undefined && { time }),
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
  router.delete('/api/cardio-sessions/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

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

  return router;
}
