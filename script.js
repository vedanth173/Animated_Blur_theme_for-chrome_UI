// =========================================
// 1. Live Clock, Date & Dynamic Greeting
// =========================================

const clockHours = document.getElementById('clock-hours');
const clockMins = document.getElementById('clock-mins');
const dateDisplay = document.getElementById('date-display');
const greetingText = document.getElementById('greeting-text');
const greetingSub = document.getElementById('greeting-sub');

function updateClockAndGreeting() {
  const now = new Date();

  // Format 12-hour time with leading zero
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const displayHours = String(hours % 12 || 12).padStart(2, '0');

  if (clockHours && clockMins) {
    clockHours.textContent = displayHours;
    clockMins.textContent = minutes;
  }

  // Format Date (e.g., Monday, October 26)
  if (dateDisplay) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('en-US', options);
  }

  // Dynamic Greeting based on time of day
  if (greetingText && greetingSub) {
    let timeGreeting = 'Good Evening';
    let subMessage = 'Time to unwind and recharge.';

    if (hours >= 5 && hours < 12) {
      timeGreeting = 'Good Morning';
      subMessage = "Let's build something great today.";
    } else if (hours >= 12 && hours < 17) {
      timeGreeting = 'Good Afternoon';
      subMessage = 'Keep the momentum going.';
    } else if (hours >= 17 && hours < 21) {
      timeGreeting = 'Good Evening';
      subMessage = 'Wrapping up the day strong.';
    }

    greetingText.textContent = `${timeGreeting}`;
    greetingSub.textContent = subMessage;
  }
}

updateClockAndGreeting();
setInterval(updateClockAndGreeting, 1000);

// =========================================
// 2. Search Bar Focus Dimming & Smart URL Navigation
// =========================================

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

if (searchInput) {
  searchInput.addEventListener('focus', () => {
    document.body.classList.add('search-focused');
  });

  searchInput.addEventListener('blur', () => {
    document.body.classList.remove('search-focused');
  });
}

if (searchForm && searchInput) {
  searchForm.addEventListener('submit', (e) => {
    const query = searchInput.value.trim();
    if (!query) {
      e.preventDefault();
      return;
    }

    // Check if the input looks like a direct URL or domain
    const isUrl = /^(https?:\/\/)/i.test(query) ||
                  (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(query) && !query.includes(' '));

    if (isUrl) {
      e.preventDefault();
      const targetUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
      window.location.href = targetUrl;
    }
  });
}

// =========================================
// 3. Custom Wallpaper Management (IndexedDB for Large Files)
// =========================================

const bgVideo = document.getElementById('bg-video');
const editBgBtn = document.getElementById('edit-bg-btn');
const bgMenu = document.getElementById('bg-menu');
const uploadImgBtn = document.getElementById('upload-img-btn');
const uploadVidBtn = document.getElementById('upload-vid-btn');
const resetBgBtn = document.getElementById('reset-bg-btn');
const bgImgInput = document.getElementById('bg-img-input');
const bgVidInput = document.getElementById('bg-vid-input');

const DB_NAME = 'NewTabWallpaperDB';
const STORE_NAME = 'wallpapers';
let currentObjectUrl = null;

function openWallpaperDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveWallpaperToDB(type, blob) {
  const db = await openWallpaperDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ type, blob }, 'currentWallpaper');
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function getWallpaperFromDB() {
  const db = await openWallpaperDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('currentWallpaper');
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function clearWallpaperFromDB() {
  const db = await openWallpaperDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('currentWallpaper');
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

function applyWallpaper(type, blob) {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  if (!type || !blob) {
    document.body.style.backgroundImage = 'none';
    if (bgVideo) {
      bgVideo.pause();
      bgVideo.removeAttribute('src');
      bgVideo.classList.add('hidden');
    }
    return;
  }

  currentObjectUrl = URL.createObjectURL(blob);

  if (type === 'image') {
    if (bgVideo) {
      bgVideo.pause();
      bgVideo.removeAttribute('src');
      bgVideo.classList.add('hidden');
    }
    document.body.style.backgroundImage = `url("${currentObjectUrl}")`;
  } else if (type === 'video' && bgVideo) {
    document.body.style.backgroundImage = 'none';
    bgVideo.src = currentObjectUrl;
    bgVideo.classList.remove('hidden');
    bgVideo.play().catch(() => {});
  }
}

async function initWallpaper() {
  try {
    const saved = await getWallpaperFromDB();
    if (saved && saved.type && saved.blob) {
      applyWallpaper(saved.type, saved.blob);
    }
  } catch (err) {
    console.error('Failed to load wallpaper from IndexedDB:', err);
  }
}

initWallpaper();

// Toggle Bottom-Right Edit Menu on Click
if (editBgBtn && bgMenu) {
  editBgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bgMenu.classList.toggle('hidden');
    editBgBtn.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!bgMenu.contains(e.target) && !editBgBtn.contains(e.target)) {
      bgMenu.classList.add('hidden');
      editBgBtn.classList.remove('active');
    }
  });
}

if (uploadImgBtn && bgImgInput) {
  uploadImgBtn.addEventListener('click', () => {
    bgImgInput.click();
    bgMenu.classList.add('hidden');
    editBgBtn.classList.remove('active');
  });

  bgImgInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await saveWallpaperToDB('image', file);
      applyWallpaper('image', file);
    }
    bgImgInput.value = '';
  });
}

if (uploadVidBtn && bgVidInput) {
  uploadVidBtn.addEventListener('click', () => {
    bgVidInput.click();
    bgMenu.classList.add('hidden');
    editBgBtn.classList.remove('active');
  });

  bgVidInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await saveWallpaperToDB('video', file);
      applyWallpaper('video', file);
    }
    bgVidInput.value = '';
  });
}

if (resetBgBtn) {
  resetBgBtn.addEventListener('click', async () => {
    await clearWallpaperFromDB();
    applyWallpaper(null, null);
    bgMenu.classList.add('hidden');
    editBgBtn.classList.remove('active');
  });
}

// =========================================
// 4. Top-Right Hover / Click Custom Bookmark Bar
// =========================================

const bookmarkWrapper = document.getElementById('bookmark-wrapper');
const bookmarkBtn = document.getElementById('bookmark-toggle-btn');

if (bookmarkWrapper && bookmarkBtn) {
  bookmarkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bookmarkWrapper.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!bookmarkWrapper.contains(e.target)) {
      bookmarkWrapper.classList.remove('active');
    }
  });
}

// =========================================
// 5. Add & Delete Custom Shortcuts & Bookmarks
// =========================================

const addShortcutBtn = document.getElementById('add-shortcut-btn');
const addBookmarkBtn = document.getElementById('add-bookmark-btn');
const modalOverlay = document.getElementById('custom-modal-overlay');
const modalTitle = document.getElementById('modal-title');
const customItemForm = document.getElementById('custom-item-form');
const nameInput = document.getElementById('item-name-input');
const urlInput = document.getElementById('item-url-input');
const cancelBtn = document.getElementById('modal-cancel-btn');

const shortcutsGrid = document.querySelector('.shortcuts-grid');
const bookmarkBarContainer = document.getElementById('bookmark-bar');

let currentModalMode = 'shortcut'; // 'shortcut' or 'bookmark'

function formatUrl(url) {
  let cleaned = url.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return 'https://www.google.com/s2/favicons?domain=google.com&sz=64';
  }
}

function createShortcutElement(item, index) {
  const a = document.createElement('a');
  a.href = item.url;
  a.className = 'glass-tile';
  a.innerHTML = `
    <div class="tile-icon">
      <img src="${getFaviconUrl(item.url)}" alt="${item.name}" />
    </div>
    <span class="tile-title">${item.name}</span>
    <button class="delete-custom-btn" title="Remove">&times;</button>
  `;

  a.querySelector('.delete-custom-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('customShortcuts') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('customShortcuts', JSON.stringify(saved));
    renderCustomItems();
  });

  return a;
}

function createBookmarkElement(item, index) {
  const a = document.createElement('a');
  a.href = item.url;
  a.className = 'bookmark-item';
  a.style.paddingRight = '30px';
  a.innerHTML = `
    <span>${item.name}</span>
    <button class="delete-custom-btn" title="Remove">&times;</button>
  `;

  a.querySelector('.delete-custom-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('customBookmarks') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('customBookmarks', JSON.stringify(saved));
    renderCustomItems();
  });

  return a;
}

function renderCustomItems() {
  document.querySelectorAll('[data-custom-item="true"]').forEach((el) => el.remove());

  const customShortcuts = JSON.parse(localStorage.getItem('customShortcuts') || '[]');
  customShortcuts.forEach((item, index) => {
    if (shortcutsGrid) {
      const el = createShortcutElement(item, index);
      el.setAttribute('data-custom-item', 'true');
      shortcutsGrid.appendChild(el);
    }
  });

  const customBookmarks = JSON.parse(localStorage.getItem('customBookmarks') || '[]');
  customBookmarks.forEach((item, index) => {
    if (bookmarkBarContainer) {
      const el = createBookmarkElement(item, index);
      el.setAttribute('data-custom-item', 'true');
      bookmarkBarContainer.appendChild(el);
    }
  });
}

function openModal(mode) {
  currentModalMode = mode;
  modalTitle.textContent = mode === 'shortcut' ? 'Add Shortcut' : 'Add Bookmark';
  nameInput.value = '';
  urlInput.value = '';
  modalOverlay.classList.remove('hidden');
  if (bgMenu) bgMenu.classList.add('hidden');
  if (editBgBtn) editBgBtn.classList.remove('active');
  setTimeout(() => nameInput.focus(), 50);
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

if (addShortcutBtn) {
  addShortcutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal('shortcut');
  });
}

if (addBookmarkBtn) {
  addBookmarkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal('bookmark');
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', closeModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay && !modalOverlay.classList.contains('hidden')) {
    closeModal();
  }
});

if (customItemForm) {
  customItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const url = formatUrl(urlInput.value);

    if (!name || !url) return;

    const storageKey = currentModalMode === 'shortcut' ? 'customShortcuts' : 'customBookmarks';
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.push({ name, url });
    localStorage.setItem(storageKey, JSON.stringify(existing));

    renderCustomItems();
    closeModal();
  });
}

// Render saved shortcuts and bookmarks on load
renderCustomItems();

// =========================================
// Remove Custom Shortcuts & Bookmarks Logic
// =========================================

const removeShortcutBtn = document.getElementById('remove-shortcut-btn');
const removeBookmarkBtn = document.getElementById('remove-bookmark-btn');

function openRemoveModal(mode) {
  currentModalMode = mode;
  modalTitle.textContent = mode === 'shortcut' ? 'Remove Shortcut' : 'Remove Bookmark';
  
  // Temporarily repurpose the form inputs inside the modal to show a removal list
  const form = document.getElementById('custom-item-form');
  form.innerHTML = ''; // Clear default inputs

  const storageKey = mode === 'shortcut' ? 'customShortcuts' : 'customBookmarks';
  const items = JSON.parse(localStorage.getItem(storageKey) || '[]');

  if (items.length === 0) {
    const notice = document.createElement('div');
    notice.className = 'empty-notice';
    notice.textContent = `No custom ${mode}s found to remove.`;
    form.appendChild(notice);
  } else {
    const listContainer = document.createElement('div');
    listContainer.className = 'remove-list';

    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'remove-item-row';
      row.innerHTML = `
        <span>${item.name}</span>
        <button type="button">Delete</button>
      `;

      row.querySelector('button').addEventListener('click', () => {
        items.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(items));
        renderCustomItems();
        closeModal();
      });

      listContainer.appendChild(row);
    });

    form.appendChild(listContainer);
  }

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'modal-actions';
  actionsDiv.innerHTML = `<button type="button" id="modal-cancel-btn" class="modal-btn cancel-btn">Close</button>`;
  form.appendChild(actionsDiv);

  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  modalOverlay.classList.remove('hidden');
  if (bgMenu) bgMenu.classList.add('hidden');
  if (editBgBtn) editBgBtn.classList.remove('active');
}

if (removeShortcutBtn) {
  removeShortcutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openRemoveModal('shortcut');
  });
}

if (removeBookmarkBtn) {
  removeBookmarkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openRemoveModal('bookmark');
  });
}