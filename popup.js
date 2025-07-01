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
    li.textContent = note;
    li.className = 'note-item';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.onclick = () => editNote(idx, note);

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'delete-btn';
    delBtn.onclick = () => deleteNote(idx);

    li.appendChild(editBtn);
    li.appendChild(delBtn);
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

function showMicStatus(message, isError = false) {
  micStatus.textContent = message;
  micStatus.style.color = isError ? '#e53935' : '#1976d2';
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
    showMicStatus('Listening... Speak now!');
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