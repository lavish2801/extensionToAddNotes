chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-extension') {
    chrome.action.openPopup();
  } else if (command === 'write-note' || command === 'mic-note') {
    // Send a message to the popup to focus input or activate mic
    chrome.runtime.sendMessage({ command });
  }
}); 