'use strict';


// Init OpenAI API data structure
const OPENAI_DATA = {
  key: "",
  lang: ""
};

// Load json file
function loadJSON(filename) {
  fetch(chrome.runtime.getURL(filename))
    .then((response) => response.json())
    .then((data) => {
      // Set the global variable CONFIG
      globalThis.CONFIG = data;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

// Load the JSON file when the script starts
loadJSON('config.json');

function print(msg) {
  if (globalThis.CONFIG && globalThis.CONFIG["debug"] === true) {
    console.log(`[background.js] ${msg}`);
  }
}

function msg2ContentScript(msg, fn_name) {
  // Trigger contentScript.js
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    // Send message to contentScript.js
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'exec', 
      fn: fn_name,
      selectedText: msg
    });
  });
}

function splitString(string) {
  const regex = /([.\n:]+)/;   // Split by dot or newline
  const resultArray = string.split(regex);
  
  // Remove empty strings
  const filteredArray = resultArray.filter(item => item.trim() !== '');

  // combine strings that are not splited by dot or newline
  const combinedArray = filteredArray.reduce((accumulator, currentValue, index) => {
    if (index % 2 === 0) {
      accumulator.push(currentValue);
    } else {
      accumulator[accumulator.length - 1] += currentValue;
    }
    return accumulator;
  }, []);

  return combinedArray;
}

// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    "title": "Prompt Translator", 
    "id": "translate-id",
    "contexts": ['selection']
  });

  print(`Init OpenAI API`);
  chrome.storage.sync.get(null, function(data) {
    OPENAI_DATA.key = data.openai_api_key;
    OPENAI_DATA.lang = data.target_lang;
    print(`Restore API Key and Target Language`);
    print(`API Key: ${data.openai_api_key}`);
    print(`Target Language: ${data.target_lang}`);
  });
});

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  if (OPENAI_DATA.lang === "") {
    return;
  }

  if ((info.menuItemId === "translate-id") && (typeof info.selectionText !== "undefined")) { 
    print(`Selected Text: ${info.selectionText}`);
    
    // // Check if the selected text is too long
    // // gpt-3.5-turbo-0301 model input prompt token + output token limitation is 4096
    // const textCnt = Math.round(info.selectionText.length / 4);  // 1 token ~= 4 chars in English
    // if (textCnt > 2000) {
    //   msg2ContentScript(`Current selection ${textCnt} is too long. Please select a shorter text under 2000 characters.`);
    //   return;
    // }

    // UI init
    msg2ContentScript("", "init");

    let BASE_PROMPT = `I want you to act as an ${OPENAI_DATA.lang} translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in ${OPENAI_DATA.lang}. I want you to replace my simplified A0-level words and sentences with more beautiful and elegant, upper level ${OPENAI_DATA.lang} words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations, display ${OPENAI_DATA.lang} language only. Following is the text I want you to translate, correct and improve`
    let gpt_answer = "Please Try Again.";

    const texts = splitString(info.selectionText);
    print(`Split: \n ${texts}`);

    if (globalThis.CONFIG && globalThis.CONFIG["openai_query"] === true) {

      for (const text of texts) {
        print(`Text: ${text}`)
        
        // Query from OpenAI API GPT-3.5
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${OPENAI_DATA.key}`
              },
              body: JSON.stringify({
                  "model": "gpt-3.5-turbo-0301",
                  "max_tokens": 2000,
                  "messages": [
                    {"role": "system", "content": BASE_PROMPT},
                    {"role": "user", "content": `"${text}"`}]
              })
          });

          if (!response.ok) {
            const textCnt = Math.round(info.selectionText.length / 4);  // 1 token ~= 4 chars in English
            const errorMsg = `\n Current selection ${textCnt} is too long. Please select a shorter text under 2000 characters.`
            print(`Text Cnt: ${textCnt}`)
            msg2ContentScript(errorMsg, "append");
            throw new Error(`Failed to fetch. Status code: ${response.status}`);
          }

          // message extraction
          const response_data = await response.json();
          gpt_answer = response_data.choices[0].message.content;
          print(`Answer: ${gpt_answer}`);
          print(`Token Usage Prompt: ${response_data["usage"]["prompt_tokens"]}`)
          print(`Token Usage Complete: ${response_data["usage"]["completion_tokens"]}`)
          print(`Token Usage Total: ${response_data["usage"]["total_tokens"]}`)

          // UI Append Message
          msg2ContentScript(gpt_answer, "append");

        } catch (err) {
          print(`OpenAI Error: ${err}`);
        }
      }
    } else {
      print(`OpenAI API Query is disabled.`);
    }

    // UI finish
    msg2ContentScript("", "finish");
  }

  return false;
});

// Popup.js updated
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
    if (key === "openai_api_key") {
      OPENAI_DATA.key = newValue;
      print(`API Key is updated, from ${oldValue} to ${newValue}`)
    } else if (key === "target_lang") {
      OPENAI_DATA.lang = newValue;
      print(`Target Language is updated, from ${oldValue} to ${newValue}`)
    }
  }
});

// Message passing
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'msg') {
    if (globalThis.CONFIG && globalThis.CONFIG["debug"] === true) {
      console.log(`[${request.sender}] Msg: ${request.msg}`);
    }
  } 
});
