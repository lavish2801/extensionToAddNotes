const noteForm = document.getElementById('note-form');
const noteInput = document.getElementById('note-input');
const notesList = document.getElementById('notes-list');
const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');
const clearNoteBtn = document.getElementById('clear-note-btn');
const keepDoneSelect = document.getElementById('keep-done');
let recognition;
let recognizing = false;

const KEEP_DONE_MS = {
  forever: Infinity,
  '1d': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '2w': 14 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000
};

// Normalize notes to { text, done, doneAt? } (migrate old string-only notes)
function normalizeNotes(raw) {
  if (!Array.isArray(raw)) return [];
  const now = Date.now();
  return raw.map((n) => {
    if (typeof n === 'string') return { text: n, done: false };
    const note = { text: n.text || '', done: !!n.done };
    if (note.done && (n.doneAt == null)) note.doneAt = now;
    else if (n.doneAt != null) note.doneAt = n.doneAt;
    return note;
  });
}

// Remove done notes older than retention; returns filtered array
function applyRetention(notes, keepDoneFor) {
  const maxAge = KEEP_DONE_MS[keepDoneFor];
  if (maxAge === Infinity) return notes;
  const now = Date.now();
  return notes.filter((n) => !n.done || (now - (n.doneAt || 0)) <= maxAge);
}

// Load notes from storage
function loadNotes() {
  chrome.storage.local.get(['notes', 'keepDoneFor'], (result) => {
    let notes = normalizeNotes(result.notes);
    const keepDoneFor = result.keepDoneFor || 'forever';
    if (notes.length && typeof (result.notes || [])[0] === 'string') {
      chrome.storage.local.set({ notes }, () => {});
    }
    notes = applyRetention(notes, keepDoneFor);
    const changed = notes.length !== normalizeNotes(result.notes).length;
    if (changed) chrome.storage.local.set({ notes }, () => renderNotes(notes, keepDoneFor));
    else renderNotes(notes, keepDoneFor);
    if (keepDoneSelect) keepDoneSelect.value = keepDoneFor;
  });
}

// Render notes: undone first (group), then done (group). Each item keeps original index for actions.
function renderNotes(notes, keepDoneFor) {
  notesList.innerHTML = '';
  const undone = notes.map((n, i) => ({ note: n, idx: i })).filter((x) => !x.note.done);
  const done = notes.map((n, i) => ({ note: n, idx: i })).filter((x) => x.note.done);

  function appendNote({ note, idx }) {
    const li = document.createElement('li');
    li.className = 'note-item' + (note.done ? ' note-item-done' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'note-checkbox';
    checkbox.checked = note.done;
    checkbox.title = note.done ? 'Mark as not done' : 'Mark as done';
    checkbox.setAttribute('aria-label', note.done ? 'Mark as not done' : 'Mark as done');
    checkbox.onchange = () => toggleDone(idx);

    const noteText = document.createElement('span');
    noteText.className = 'note-text';
    noteText.textContent = note.text;

    li.appendChild(checkbox);
    li.appendChild(noteText);

    const actions = document.createElement('div');
    actions.className = 'note-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.title = 'Edit note';
    editBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>`;
    editBtn.onclick = () => editNote(idx, note.text);
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.title = 'Delete note';
    delBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
    delBtn.onclick = () => deleteNote(idx);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(actions);
    notesList.appendChild(li);
  }

  if (undone.length > 0) {
    const toDoHead = document.createElement('li');
    toDoHead.className = 'notes-section-title';
    toDoHead.textContent = 'To do';
    notesList.appendChild(toDoHead);
    undone.forEach(appendNote);
  }
  if (done.length > 0) {
    const doneHead = document.createElement('li');
    doneHead.className = 'notes-section-title notes-section-title-done';
    doneHead.textContent = 'Done';
    notesList.appendChild(doneHead);
    done.forEach(appendNote);
  }
}

// Toggle done state of a note; set doneAt when marking done
function toggleDone(idx) {
  chrome.storage.local.get(['notes'], (result) => {
    const notes = normalizeNotes(result.notes);
    if (idx < 0 || idx >= notes.length) return;
    notes[idx].done = !notes[idx].done;
    if (notes[idx].done) notes[idx].doneAt = Date.now();
    chrome.storage.local.set({ notes }, loadNotes);
  });
}

// Add note
noteForm.onsubmit = (e) => {
  e.preventDefault();
  const newNote = noteInput.value.trim();
  if (!newNote) return;
  chrome.storage.local.get(['notes'], (result) => {
    const notes = normalizeNotes(result.notes);
    notes.push({ text: newNote, done: false });
    chrome.storage.local.set({ notes }, () => {
      loadNotes();
      // Play success sound
      const successSound = document.getElementById('success-sound');
      if (successSound) {
        successSound.currentTime = 0;
        successSound.play();
      }
    });
    noteInput.value = '';
  });
};

// Edit note
function editNote(idx, oldNote) {
  const newNote = prompt('Edit your note:', oldNote);
  if (newNote !== null) {
    chrome.storage.local.get(['notes'], (result) => {
      const notes = normalizeNotes(result.notes);
      if (idx >= 0 && idx < notes.length) notes[idx].text = newNote;
      chrome.storage.local.set({ notes }, loadNotes);
    });
  }
}

// Delete note
function deleteNote(idx) {
  chrome.storage.local.get(['notes'], (result) => {
    const notes = normalizeNotes(result.notes);
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

// Set initial guidance message
showMicStatus('Click the mic to dictate a note.');

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

    // Request mic access right before starting recognition, gated by user gesture
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        if (recognizing) {
          recognition.stop();
        } else {
          recognition.start();
        }
      })
      .catch(() => {
        micBtn.disabled = true;
        micBtn.style.opacity = 0.5;
        micBtn.title = 'Microphone permission denied. Check site settings and allow microphone.';
        showMicStatus('Microphone access required for dictation. Allow microphone in site settings.', true);
      });
  };

} else {
  micBtn.disabled = true;
  micBtn.title = 'Speech recognition not supported in this browser';
  showMicStatus('Speech recognition not supported in this browser.', true);
}

// Retention preference: save and re-apply cleanup
if (keepDoneSelect) {
  keepDoneSelect.addEventListener('change', () => {
    const keepDoneFor = keepDoneSelect.value;
    chrome.storage.local.set({ keepDoneFor }, () => {
      chrome.storage.local.get(['notes'], (result) => {
        const notes = normalizeNotes(result.notes);
        const filtered = applyRetention(notes, keepDoneFor);
        chrome.storage.local.set({ notes: filtered }, loadNotes);
      });
    });
  });
}

// Initial load
loadNotes();

// Listen for background commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === 'write-note') {
    noteInput.focus();
  } else if (message.command === 'mic-note') {
    if (!micBtn.disabled) {
      micBtn.click();
    }
  }
});

noteInput.addEventListener('input', () => {
  if (noteInput.value.trim()) {
    clearNoteBtn.style.display = '';
  } else {
    clearNoteBtn.style.display = 'none';
  }
});

clearNoteBtn.onclick = () => {
  noteInput.value = '';
  clearNoteBtn.style.display = 'none';
  noteInput.focus();
}; 