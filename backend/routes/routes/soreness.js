import { Router } from 'express';

/**
 * Soreness journal routes.
 *
 * Public:
 *   GET    /api/soreness
 *
 * Admin:
 *   POST   /api/soreness
 *   DELETE /api/soreness/:date
 */
export function createSorenessRoutes({ container, requireAuth, requireAdmin }) {
  const router = Router();

  // Get all soreness entries (public).
  router.get('/api/soreness', async (req, res) => {
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
  router.post('/api/soreness', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { date, muscles } = req.body;

      if (!date) {
        return res.status(400).json({ error: 'Missing required field: date' });
      }
      if (!muscles || !Array.isArray(muscles)) {
        return res.status(400).json({ error: 'Missing required field: muscles (array)' });
      }

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
  router.delete('/api/soreness/:date', requireAuth, requireAdmin, async (req, res) => {
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

  return router;
}
