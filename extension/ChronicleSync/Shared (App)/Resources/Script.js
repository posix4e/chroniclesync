function show(platform, enabled, useSettingsInsteadOfPreferences) {
    document.body.classList.add(`platform-${platform}`);

    if (useSettingsInsteadOfPreferences) {
        document.getElementsByClassName('platform-mac state-on')[0].innerText = "ChronicleSync's extension is currently on. You can turn it off in the Extensions section of Safari Settings.";
        document.getElementsByClassName('platform-mac state-off')[0].innerText = "ChronicleSync's extension is currently off. You can turn it on in the Extensions section of Safari Settings.";
        document.getElementsByClassName('platform-mac state-unknown')[0].innerText = "You can turn on ChronicleSync's extension in the Extensions section of Safari Settings.";
        document.getElementsByClassName('platform-mac open-preferences')[0].innerText = "Quit and Open Safari Settings…";
    }

    if (typeof enabled === "boolean") {
        document.body.classList.toggle(`state-on`, enabled);
        document.body.classList.toggle(`state-off`, !enabled);
    } else {
        document.body.classList.remove(`state-on`);
        document.body.classList.remove(`state-off`);
    }
    
    // Set up iOS-specific buttons
    if (platform === 'ios') {
        setupIOSButtons();
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

function setupIOSButtons() {
    const settingsButton = document.querySelector("button.open-settings");
    if (settingsButton) {
        settingsButton.addEventListener("click", function() {
            webkit.messageHandlers.controller.postMessage("open-settings");
        });
    }
    
    const websiteButton = document.querySelector("button.open-website");
    if (websiteButton) {
        websiteButton.addEventListener("click", function() {
            webkit.messageHandlers.controller.postMessage("open-website");
        });
    }
}

// Set up Mac preferences button
const preferencesButton = document.querySelector("button.open-preferences");
if (preferencesButton) {
    preferencesButton.addEventListener("click", openPreferences);
}