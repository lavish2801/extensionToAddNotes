# Chrome Web Store — Permission & Feature Justification

Use the text below when the Chrome Web Store asks you to justify permissions or the new tab override.

---

## New tab override (`chrome_url_overrides.newtab`)

**Why we need it:**  
Quick Notes replaces the browser’s default new tab so users see their to-do list and the current date/time as soon as they open a new tab. Notes are stored locally and stay private. The custom new tab is the main way users see their tasks and open the extension to add or edit notes.

**User benefit:**  
Users get a focused, at-a-glance view of their tasks and a single place to open the note-taking UI without leaving the new tab.

---

## Tabs permission (`tabs`)

**Why we need it:**  
The extension needs the `tabs` permission to open the Quick Notes popup in a new tab when the user clicks **“Open Quick Notes”** on the custom new tab page. The browser does not allow opening the extension’s action popup programmatically from a new tab page, so we use `chrome.tabs.create()` to open the popup page in a tab instead. We do not read, modify, or access the content of other tabs; we only create one new tab to our own extension page.

**User benefit:**  
Users can go from the new tab dashboard directly into the full note-taking interface in one click.

---

## Short copy (for character-limited fields)

**New tab:**  
*Replaces the new tab so users see their to-do list and date/time when opening a new tab. Notes stay local and private.*

**Tabs:**  
*Used only to open the Quick Notes popup in a new tab when the user clicks “Open Quick Notes” on the new tab page. We do not read or modify other tabs.*
