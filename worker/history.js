const { Router } = require('express');
const router = Router();

// In-memory storage for demo purposes
// In production, this should use a proper database
let historyStore = new Map();

router.post('/sync', async (req, res) => {
    try {
        const { deviceId, items } = req.body;
        
        if (!deviceId || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid request format' });
        }

        // Store history items with device information
        items.forEach(item => {
            const key = `${item.url}_${item.lastVisitTime}`;
            historyStore.set(key, {
                ...item,
                deviceId,
                syncTimestamp: Date.now()
            });
        });

        res.json({ success: true, itemCount: items.length });
    } catch (error) {
        console.error('History sync error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/devices', async (req, res) => {
    try {
        const devices = new Set([...historyStore.values()].map(item => item.deviceId));
        res.json({ devices: Array.from(devices) });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const deviceHistory = [...historyStore.values()]
            .filter(item => item.deviceId === deviceId)
            .sort((a, b) => b.lastVisitTime - a.lastVisitTime);
        
        res.json({ history: deviceHistory });
    } catch (error) {
        console.error('Error fetching device history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;