const noteForm = document.getElementById('note-form');
const noteInput = document.getElementById('note-input');
const notesList = document.getElementById('notes-list');
const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');
let recognition;
let recognizing = false;

// Load notes from storage
function loadNotes() {
  chrome.storage.local.get(['notes'], (result) => {
    const notes = result.notes || [];
    renderNotes(notes);
  });
}

// Render notes to the list
function renderNotes(notes) {
  notesList.innerHTML = '';
  notes.forEach((note, idx) => {
    const li = document.createElement('li');
    li.className = 'note-item';
    const noteText = document.createElement('span');
    noteText.textContent = note;
    li.appendChild(noteText);

    // Actions container
    const actions = document.createElement('div');
    actions.className = 'note-actions';

    // Edit button with SVG icon
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.title = 'Edit note';
    editBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>`;
    editBtn.onclick = () => editNote(idx, note);

    // Delete button with SVG icon
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.title = 'Delete note';
    delBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
    delBtn.onclick = () => deleteNote(idx);

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(actions);
    notesList.appendChild(li);
  });
}

// Add note
noteForm.onsubmit = (e) => {
  e.preventDefault();
  const newNote = noteInput.value.trim();
  if (!newNote) return;
  chrome.storage.local.get(['notes'], (result) => {
    const notes = result.notes || [];
    notes.push(newNote);
    chrome.storage.local.set({ notes }, loadNotes);
    noteInput.value = '';
  });
};

// Edit note
function editNote(idx, oldNote) {
  const newNote = prompt('Edit your note:', oldNote);
  if (newNote !== null) {
    chrome.storage.local.get(['notes'], (result) => {
      const notes = result.notes || [];
      notes[idx] = newNote;
      chrome.storage.local.set({ notes }, loadNotes);
    });
  }
}

// Delete note
function deleteNote(idx) {
  chrome.storage.local.get(['notes'], (result) => {
    const notes = result.notes || [];
    notes.splice(idx, 1);
    chrome.storage.local.set({ notes }, loadNotes);
  });
}

function showMicStatus(message, isError = false, isListening = false) {
  micStatus.textContent = message;
  micStatus.className = 'mic-badge';
  if (isError) micStatus.classList.add('error');
  else if (isListening) micStatus.classList.add('listening');
}

// Request microphone permission when popup opens
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => {
    showMicStatus('Click the mic to dictate a note.');
  })
  .catch((err) => {
    showMicStatus('Microphone blocked. Click the lock icon and allow microphone.', true);
    micBtn.disabled = true;
    micBtn.title = 'Microphone blocked. Click the lock icon and allow microphone.';
    console.warn('Microphone permission denied or not available:', err);
  });

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    recognizing = true;
    micBtn.textContent = '🛑';
    micBtn.title = 'Stop listening';
    micBtn.style.background = '#fbc02d';
    showMicStatus('Listening... Speak now!', false, true);
  };
  recognition.onend = () => {
    recognizing = false;
    micBtn.textContent = '🎤';
    micBtn.title = 'Speak your note';
    micBtn.style.background = '';
    showMicStatus('Click the mic to dictate a note.');
  };
  recognition.onerror = (event) => {
    recognizing = false;
    micBtn.textContent = '🎤';
    micBtn.title = 'Speak your note';
    micBtn.style.background = '';
    let msg = 'Speech recognition error: ' + event.error;
    if (event.error === 'not-allowed') {
      msg = 'Microphone access denied. Click the lock icon and allow microphone.';
      micBtn.disabled = true;
    }
    showMicStatus(msg, true);
    alert(msg);
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    noteInput.value = transcript;
    showMicStatus('Transcription complete. Edit if needed, then add your note.');
  };

  micBtn.onclick = () => {
    if (micBtn.disabled) return;
    if (recognizing) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };
} else {
  micBtn.disabled = true;
  micBtn.title = 'Speech recognition not supported in this browser';
  showMicStatus('Speech recognition not supported in this browser.', true);
}

// Initial load
loadNotes(); 