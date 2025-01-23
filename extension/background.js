import HistoryManager from './history.js';

const generateDeviceId = () => {
    return 'device_' + Math.random().toString(36).substr(2, 9);
};

const getOrCreateDeviceId = async () => {
    const stored = await chrome.storage.local.get('deviceId');
    if (stored.deviceId) {
        return stored.deviceId;
    }
    const deviceId = generateDeviceId();
    await chrome.storage.local.set({ deviceId });
    return deviceId;
};

async function init() {
    const deviceId = await getOrCreateDeviceId();
    const historyManager = new HistoryManager(deviceId);
    await historyManager.initialize();
}

init().catch(console.error);