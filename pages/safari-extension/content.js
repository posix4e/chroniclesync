// Safari Extension Content Script
document.addEventListener('DOMContentLoaded', function() {
    // Listen for messages from the React app
    window.addEventListener('message', function(event) {
        if (event.data.type === 'chroniclesync') {
            // Forward messages to the Safari extension
            safari.extension.dispatchMessage('syncHistory', {
                data: event.data.payload
            });
        }
    });
});