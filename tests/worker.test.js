const request = require('supertest');
const express = require('express');
const historyRoutes = require('../worker/history');

const app = express();
app.use(express.json());
app.use('/api/history', historyRoutes);

describe('History API', () => {
    const testHistory = {
        deviceId: 'test_device_1',
        items: [
            {
                url: 'https://example.com',
                title: 'Example Domain',
                lastVisitTime: Date.now(),
                visitCount: 1
            },
            {
                url: 'https://google.com',
                title: 'Google',
                lastVisitTime: Date.now(),
                visitCount: 5
            }
        ]
    };

    test('POST /api/history/sync - should sync history items', async () => {
        const response = await request(app)
            .post('/api/history/sync')
            .send(testHistory);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.itemCount).toBe(2);
    });

    test('GET /api/history/devices - should return list of devices', async () => {
        // First sync some data
        await request(app)
            .post('/api/history/sync')
            .send(testHistory);

        const response = await request(app)
            .get('/api/history/devices');

        expect(response.status).toBe(200);
        expect(response.body.devices).toContain('test_device_1');
    });

    test('GET /api/history/:deviceId - should return device history', async () => {
        // First sync some data
        await request(app)
            .post('/api/history/sync')
            .send(testHistory);

        const response = await request(app)
            .get('/api/history/test_device_1');

        expect(response.status).toBe(200);
        expect(response.body.history).toHaveLength(2);
        expect(response.body.history[0].url).toBe('https://example.com');
        expect(response.body.history[1].url).toBe('https://google.com');
    });
});