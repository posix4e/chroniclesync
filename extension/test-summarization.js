document.addEventListener('DOMContentLoaded', () => {
    console.log('Test summarization page loaded');
    
    document.getElementById('summarize').addEventListener('click', async () => {
        const url = document.getElementById('url').value.trim();
        const resultDiv = document.getElementById('result');
        
        if (!url) {
            resultDiv.innerHTML = '<p class="error">Please enter a URL</p>';
            return;
        }
        
        resultDiv.innerHTML = '<p class="loading">Generating summary... (check the console for detailed logs)</p>';
        
        try {
            console.log('Sending test summarization request for URL:', url);
            chrome.runtime.sendMessage(
                { type: 'testSummarize', url },
                (response) => {
                    console.log('Received response:', response);
                    
                    if (response.error) {
                        resultDiv.innerHTML = `<p class="error">Error: ${response.error}</p>`;
                    } else if (response.summary) {
                        resultDiv.innerHTML = `
                            <p class="success">Summary generated successfully!</p>
                            <h3>Summary:</h3>
                            <p>${response.summary}</p>
                        `;
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
                }
            );
        } catch (error) {
            console.error('Error sending message:', error);
            resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    });
});