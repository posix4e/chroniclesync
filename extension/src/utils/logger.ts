export class Logger {
    private static instance: Logger | null = null;
    private devToolsConnected: boolean = false;

    private constructor() {
        // Listen for devtools connection
        chrome.runtime.onConnect.addListener((port) => {
            if (port.name === 'chroniclesync-devtools') {
                this.devToolsConnected = true;
                port.onDisconnect.addListener(() => {
                    this.devToolsConnected = false;
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
        chrome.runtime.sendMessage({
            source: 'chroniclesync',
            content,
            error,
            success
        }).catch(() => {
            // Ignore errors when devtools is not open
        });
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