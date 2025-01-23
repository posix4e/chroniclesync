import { ExtensionIdManager } from '../../src/utils/extensionId';

describe('ExtensionIdManager', () => {
    let extensionManager: ExtensionIdManager;

    beforeEach(() => {
        extensionManager = ExtensionIdManager.getInstance();
        extensionManager.clearExtensionId();
    });

    it('should be a singleton', () => {
        const instance1 = ExtensionIdManager.getInstance();
        const instance2 = ExtensionIdManager.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should throw error when chrome runtime is not available', () => {
        expect(() => {
            extensionManager.getExtensionId();
        }).toThrow('Chrome runtime not available');
    });

    it('should return extension id when set manually', () => {
        const testId = 'test-extension-id';
        extensionManager.setExtensionId(testId);
        expect(extensionManager.getExtensionId()).toBe(testId);
    });

    it('should clear extension id', () => {
        const testId = 'test-extension-id';
        extensionManager.setExtensionId(testId);
        extensionManager.clearExtensionId();
        expect(() => {
            extensionManager.getExtensionId();
        }).toThrow('Chrome runtime not available');
    });
});