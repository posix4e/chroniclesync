export class ExtensionIdManager {
    private static instance: ExtensionIdManager;
    private extensionId: string | null = null;

    private constructor() {}

    public static getInstance(): ExtensionIdManager {
        if (!ExtensionIdManager.instance) {
            ExtensionIdManager.instance = new ExtensionIdManager();
        }
        return ExtensionIdManager.instance;
    }

    public getExtensionId(): string {
        if (!this.extensionId) {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                this.extensionId = chrome.runtime.id;
            } else {
                throw new Error('Chrome runtime not available');
            }
        }
        return this.extensionId;
    }

    public setExtensionId(id: string): void {
        this.extensionId = id;
    }

    public clearExtensionId(): void {
        this.extensionId = null;
    }
}