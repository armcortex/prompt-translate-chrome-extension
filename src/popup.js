'use strict';

// wrap sendMessage into a print function
function print(msg) {
  chrome.runtime.sendMessage(
    {type: "msg", sender: "popup.js", msg: msg});
}

// Submit
document.getElementById("key-submit").addEventListener("click", () => {
  const apiKey = document.getElementById("openai-api-key").value;
  const selectLang = document.getElementById("target-lang-select").value;
  const payload = {
    "openai_api_key": apiKey,
    "target_lang": selectLang
  }

  // Save data to cloud storage
  chrome.storage.sync.set(payload);
});

// Restore data when popup is opened, stored in cloud storage
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(null, function(data) {
    document.getElementById("openai-api-key").value = data.openai_api_key;
    document.getElementById("target-lang-select").value = data.target_lang;
  });
});
