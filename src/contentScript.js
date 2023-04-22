'use strict';

function print(msg) {
  chrome.runtime.sendMessage(
    {type: "msg", sender: "contentScript.js", msg: msg
  });
}

function escapeHTML(unsafeText) {
  const div = document.createElement('div');
  div.textContent = unsafeText;
  return div.innerHTML;
}

let popupContainer;

function InitUI() {
  // Remove the existing popup window
  const existingPopup = document.getElementById('translator-popup-container');
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }

  // Create the outer container for the popup window
  popupContainer = document.createElement('div');
  popupContainer.id = 'translator-popup-container';
  popupContainer.style.position = 'absolute';

  // Create the inner container for the popup window
  const popup = document.createElement('div');
  popup.id = 'translator-popup';
  popup.style.position = 'relative';

  // Create the header for the popup window, which is used to drag the popup
  const header = document.createElement('div');
  header.id = 'translator-header';
  header.textContent = "Drag me";
  header.style.cursor = 'move';
  header.style.backgroundColor = '#f1f1f1';
  header.style.padding = '5px';
  header.style.userSelect = 'none';

  // Create the close button
  const closeButton = document.createElement('span');
  closeButton.id = 'translator-close';
  closeButton.innerHTML = '&times;';
  closeButton.style.cursor = 'pointer';
  closeButton.style.float = 'right';
  closeButton.style.fontSize = '18px';
  closeButton.style.fontWeight = 'bold';
  closeButton.onclick = FinishUI;

  // Create the container for displaying the translation result
  const content = document.createElement('div');
  content.id = 'translator-content';
  content.style.padding = '5px';

  // Append the elements to the DOM
  header.appendChild(closeButton);
  popup.appendChild(header);
  popup.appendChild(content);
  popupContainer.appendChild(popup);
  document.body.appendChild(popupContainer);

  // Get the position of the selected text
  const selectedRange = window.getSelection().getRangeAt(0);
  const rect = selectedRange.getBoundingClientRect();

  // Position the popup window
  popupContainer.style.left = `${rect.left + window.scrollX}px`;
  popupContainer.style.top = `${rect.bottom + window.scrollY}px`;  
  popupContainer.style.backgroundColor = '#ffffff';
  popupContainer.style.border = '1px solid #cccccc';
  popupContainer.style.borderRadius = '3px';
  popupContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  popupContainer.style.padding = '5px';
  popupContainer.style.zIndex = '9999';
  popupContainer.style.maxWidth = `${Math.round(window.innerWidth/2)}px`;
  popupContainer.style.minWidth = '100px';

  // Draggable popup window implementation
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  header.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    offsetX = e.clientX - parseInt(popupContainer.style.left, 10);
    offsetY = e.clientY - parseInt(popupContainer.style.top, 10);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const newLeft = e.clientX - offsetX;
      const newTop = e.clientY - offsetY;
      popupContainer.style.left = `${Math.round(newLeft)}px`;
      popupContainer.style.top = `${Math.round(newTop)}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

function AppendTextUI(text) {
  const content = document.getElementById('translator-content');
  const escapedText = escapeHTML(text);
  content.innerHTML += `${escapedText}<br>`;
}

function FinishUI() {
  if (popupContainer) {
    document.body.removeChild(popupContainer);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == 'exec') {
    if (request.fn == 'init') {
      print(`Create Popup UI`);
      InitUI();
    } else if (request.fn == 'append') {
      print(`Append Text UI`);
      AppendTextUI(request.selectedText);
    } else if (request.fn == 'finish') {
      print(`Finish Popup UI`);
    }
  }
});




