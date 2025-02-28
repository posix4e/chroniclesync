document.addEventListener('DOMContentLoaded', () => {
    console.log('Test summarization page loaded');
    
    // Set up error handling for runtime.lastError
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Received message in content script:', message);
        return false; // Don't keep the message channel open
    });
    
    document.getElementById('summarize').addEventListener('click', async () => {
        const url = document.getElementById('url').value.trim();
        const resultDiv = document.getElementById('result');
        
        if (!url) {
            resultDiv.innerHTML = '<p class="error">Please enter a URL</p>';
            return;
        }
        
        resultDiv.innerHTML = '<p class="loading">Generating summary... (check the console for detailed logs)</p>';
        
        // Set a timeout to update the UI if we don't get a response
        const timeoutId = setTimeout(() => {
            console.warn('No response received after 35 seconds');
            resultDiv.innerHTML = `
                <p class="error">No response received from the background script after 35 seconds.</p>
                <p>This could be due to:</p>
                <ul>
                    <li>The background script is still processing</li>
                    <li>The background script crashed or was restarted</li>
                    <li>The message port closed before a response was received</li>
                </ul>
                <p>Please check the background page console for errors.</p>
            `;
        }, 35000);
        
        try {
            console.log('Sending test summarization request for URL:', url);
            
            // Use a Promise wrapper around chrome.runtime.sendMessage
            const sendMessagePromise = new Promise((resolve) => {
                try {
                    chrome.runtime.sendMessage({ type: 'testSummarize', url }, (response) => {
                        // Check for runtime.lastError to avoid unchecked error
                        if (chrome.runtime.lastError) {
                            console.warn('Runtime error:', chrome.runtime.lastError.message);
                            resolve({ error: chrome.runtime.lastError.message });
                            return;
                        }
                        
                        console.log('Received response:', response);
                        resolve(response || { error: 'No response data received' });
                    });
                } catch (err) {
                    console.error('Error in sendMessage:', err);
                    resolve({ error: err.message });
                }
            });
            
            // Wait for the response with a timeout
            const response = await Promise.race([
                sendMessagePromise,
                new Promise(resolve => 
                    setTimeout(() => resolve({ error: 'Request timed out' }), 30000)
                )
            ]);
            
            // Clear the UI update timeout since we got a response
            clearTimeout(timeoutId);
            
            // Handle the response
            if (!response) {
                resultDiv.innerHTML = `
                    <p class="error">No response received from the background script.</p>
                    <p>Please check the background page console for errors.</p>
                `;
            } else if (response.error) {
                resultDiv.innerHTML = `<p class="error">Error: ${response.error}</p>`;
            } else if (response.summary) {
                resultDiv.innerHTML = `
                    <p class="success">Summary generated successfully!</p>
                    <h3>Summary:</h3>
                    <p>${response.summary}</p>
                `;
            } else if (response.message) {
                resultDiv.innerHTML = `<p class="error">${response.message}</p>`;
            } else {
                resultDiv.innerHTML = `
                    <p class="error">No summary was generated. This could be because:</p>
                    <ul>
                        <li>The URL couldn't be accessed</li>
                        <li>The content was too short</li>
                        <li>The model failed to generate a summary</li>
                    </ul>
                    <p>Check the console for detailed logs.</p>
                `;
            }
        } catch (error) {
            // Clear the UI update timeout
            clearTimeout(timeoutId);
            
            console.error('Error in summarization process:', error);
            resultDiv.innerHTML = `<p class="error">Error: ${error.message || 'Unknown error occurred'}</p>`;
        }
    });
});