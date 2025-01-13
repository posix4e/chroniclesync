describe('Chrome Extension', () => {
    it('should load the extension popup', async () => {
        await browser.url('chrome-extension://[extension-id]/popup.html');
        const title = await browser.$('h1');
        await expect(title).toHaveText('ChronicleSync');
    });
});