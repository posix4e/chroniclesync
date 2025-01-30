console.log('Settings page loading...');
import Settings from './settings.js';
console.log('Settings module imported');
const settings = new Settings();
console.log('Settings instance created');
settings.init().catch(error => {
  console.error('Error initializing settings:', error);
});
console.log('Settings initialization started');