export class Logger {
    private static instance: Logger | null = null;
    private ports: Map<string, chrome.runtime.Port> = new Map();

    private constructor() {
        // Listen for devtools connection
        chrome.runtime.onConnect.addListener((port) => {
            if (port.name === 'cs-dev-tools') {
                port.onMessage.addListener((message) => {
                    if (message.name === 'init') {
                        this.ports.set(message.tabId.toString(), port);
                        console.log('DevTools connected for tab:', message.tabId);
                    }
                });

                port.onDisconnect.addListener(() => {
                    // Find and remove the disconnected port
                    for (const [tabId, p] of this.ports.entries()) {
                        if (p === port) {
                            this.ports.delete(tabId);
                            console.log('DevTools disconnected for tab:', tabId);
                            break;
                        }
                    }
                });
            }
        });
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private sendToDevTools(content: string, error: boolean = false, success: boolean = false) {
        const message = {
            source: 'chroniclesync',
            content,
            error,
            success
        };

        // Send to all connected DevTools instances
        for (const port of this.ports.values()) {
            try {
                port.postMessage(message);
            } catch (e) {
                console.warn('Failed to send message to DevTools:', e);
            }
        }
    }

    public info(message: string) {
        console.log(`[ChronicleSync] ${message}`);
        this.sendToDevTools(message);
    }

    public success(message: string) {
        console.log(`[ChronicleSync] ✓ ${message}`);
        this.sendToDevTools(message, false, true);
    }

    public error(message: string, error?: any) {
        const errorMessage = error ? `${message}: ${error.message || error}` : message;
        console.error(`[ChronicleSync] ✗ ${errorMessage}`);
        this.sendToDevTools(errorMessage, true);
    }
}