/**
 * api.js — Shared API Utilities
 * Loaded before script.js and admin.js on every authenticated page.
 * Provides: API_BASE_URL, authFetch(), logout(), getInitials()
 */
// Ye frontend common library configuration variables hold karti hai.
// Isme API endpoint URLs definition, secure authFetch utilities, custom dropdown selects creation overrides, custom proxy select observers, toast alert functions set hain.
// Ye user and admin scripts load hone se pehle shared utility functions access dene ke liye register hai.

const API_BASE_URL = 'http://localhost:5000/api';

const APP_ROUTES = {
  publicHome: '../public/index.html',
  login: '../user/login.html',
  signup: '../user/signup.html',
  userDashboard: '../user/dashboard.html',
  adminDashboard: '../admin/index.html'
};

function getRoute(name) {
  return APP_ROUTES[name] || APP_ROUTES.publicHome;
}

/**
 * Fetch wrapper that attaches JWT Authorization header and handles
 * 401/403 responses by logging the user out.
 */
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  options.headers = options.headers || {};
  options.credentials = 'include'; // Enable passing cross-origin cookies

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    const data = await response.json().catch(() => ({}));
    alert(data.message || 'Session expired or access denied. Please log in again.');
    logout();
    throw new Error('Unauthorized');
  }

  return response;
}

/**
 * Clears local auth state and redirects to the login page.
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = getRoute('login');
}

/**
 * Returns up to 2 uppercase initials from a full name.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  return (name || '')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Renders the sidebar avatar element based on user profile data.
 * @param {HTMLElement} avatarEl
 * @param {{ name: string, profileImage?: string }} user
 */
function renderSidebarAvatar(avatarEl, user) {
  if (!avatarEl) return;
  if (user.profileImage) {
    const imageUrl = user.profileImage.startsWith('http') || user.profileImage.startsWith('data:')
      ? user.profileImage
      : `${API_BASE_URL.replace('/api', '')}${user.profileImage}`;
    avatarEl.innerHTML = `<img src="${imageUrl}" alt="Profile" class="user-avatar">`;
  } else {
    avatarEl.innerHTML = `<div class="user-avatar-placeholder">${getInitials(user.name)}</div>`;
  }
}

/**
 * Styled Toast notification constructor.
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-content">${message}</div>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Intercept default browser alerts and replace with premium toasts
window.alert = function (message) {
  let type = 'info';
  const lowercaseMsg = message.toLowerCase();
  
  if (lowercaseMsg.includes('error') || lowercaseMsg.includes('failed') || lowercaseMsg.includes('incorrect') || lowercaseMsg.includes('invalid') || lowercaseMsg.includes('denied') || lowercaseMsg.includes('expired') || lowercaseMsg.includes('unauthorized')) {
    type = 'error';
  } else if (lowercaseMsg.includes('success') || lowercaseMsg.includes('welcome') || lowercaseMsg.includes('registered') || lowercaseMsg.includes('saved') || lowercaseMsg.includes('updated') || lowercaseMsg.includes('added') || lowercaseMsg.includes('deleted')) {
    type = 'success';
  } else if (lowercaseMsg.includes('warning') || lowercaseMsg.includes('caution') || lowercaseMsg.includes('sure') || lowercaseMsg.includes('required')) {
    type = 'warning';
  }
  
  showToast(message, type);
};

// ============================================================
// Custom Select Dropdown UI Engine
// ============================================================

// Intercept programmatic select assignments to synchronize custom dropdowns
(function() {
  const originalValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  const originalIndex = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');

  if (originalValue && originalIndex) {
    Object.defineProperty(HTMLSelectElement.prototype, 'value', {
      set: function(val) {
        const prev = this.value;
        originalValue.set.call(this, val);
        if (prev !== val) {
          this.dispatchEvent(new Event('change', { bubbles: true }));
        }
      },
      get: function() {
        return originalValue.get.call(this);
      }
    });

    Object.defineProperty(HTMLSelectElement.prototype, 'selectedIndex', {
      set: function(val) {
        const prev = this.selectedIndex;
        originalIndex.set.call(this, val);
        if (prev !== val) {
          this.dispatchEvent(new Event('change', { bubbles: true }));
        }
      },
      get: function() {
        return originalIndex.get.call(this);
      }
    });
  }
})();

window.initializeCustomSelects = function() {
  const selects = document.querySelectorAll('select:not(.custom-select-hidden)');
  selects.forEach(select => {
    // Hide original select visually
    select.classList.add('custom-select-hidden');
    select.style.display = 'none';

    // Create custom wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    if (select.id) {
      wrapper.id = 'custom-wrapper-' + select.id;
    }
    
    // Copy inline width if any
    if (select.style.width) {
      wrapper.style.width = select.style.width;
    }

    // Insert wrapper before native select and put select inside wrapper
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    // Create trigger box
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.tabIndex = 0;
    
    const triggerText = document.createElement('span');
    trigger.appendChild(triggerText);
    
    // Add SVG Chevron arrow
    trigger.innerHTML += `
      <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
    const span = trigger.querySelector('span');
    wrapper.appendChild(trigger);

    // Create options list popup
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';
    wrapper.appendChild(optionsContainer);

    let highlightedIndex = -1;

    // Render option list elements
    function renderOptions() {
      optionsContainer.innerHTML = '';
      const options = select.options;
      
      const selectedOption = select.options[select.selectedIndex];
      span.textContent = selectedOption ? selectedOption.textContent : 'Select option';

      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const optDiv = document.createElement('div');
        optDiv.className = 'custom-select-option';
        if (i === select.selectedIndex) {
          optDiv.classList.add('selected');
        }
        optDiv.textContent = option.textContent;
        optDiv.dataset.value = option.value;
        optDiv.dataset.index = i;

        optDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          select.selectedIndex = i;
          
          // Trigger change listeners
          select.dispatchEvent(new Event('change', { bubbles: true }));
          select.dispatchEvent(new Event('input', { bubbles: true }));
          
          closeDropdown();
        });

        optionsContainer.appendChild(optDiv);
      }
    }

    renderOptions();

    // Set up MutationObserver to automatically update custom options when native options change
    const observer = new MutationObserver(() => {
      renderOptions();
    });
    observer.observe(select, { childList: true, characterData: true, subtree: true });

    // Toggle dropdown state
    function toggleDropdown() {
      const isOpen = wrapper.classList.contains('open');
      document.querySelectorAll('.custom-select-wrapper.open').forEach(other => {
        if (other !== wrapper) other.classList.remove('open');
      });
      
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }

    function openDropdown() {
      wrapper.classList.add('open');
      highlightedIndex = select.selectedIndex;
      updateHighlighting();
      
      const activeOpt = optionsContainer.children[highlightedIndex];
      if (activeOpt) {
        activeOpt.scrollIntoView({ block: 'nearest' });
      }
    }

    function closeDropdown() {
      wrapper.classList.remove('open');
      highlightedIndex = -1;
      updateHighlighting();
    }

    function updateHighlighting() {
      Array.from(optionsContainer.children).forEach((opt, idx) => {
        if (idx === highlightedIndex) {
          opt.classList.add('highlighted');
        } else {
          opt.classList.remove('highlighted');
        }
      });
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    // Handle updates when other scripts change the select programmatically
    select.addEventListener('change', () => {
      renderOptions();
    });

    document.addEventListener('click', () => {
      closeDropdown();
    });

    // Keyboard support
    trigger.addEventListener('keydown', (e) => {
      const options = optionsContainer.children;
      const isOpen = wrapper.classList.contains('open');

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            select.selectedIndex = highlightedIndex;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.dispatchEvent(new Event('input', { bubbles: true }));
          }
          closeDropdown();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          highlightedIndex = (highlightedIndex + 1) % options.length;
          updateHighlighting();
          options[highlightedIndex].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          highlightedIndex = (highlightedIndex - 1 + options.length) % options.length;
          updateHighlighting();
          options[highlightedIndex].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          closeDropdown();
        }
      } else if (e.key === 'Tab') {
        closeDropdown();
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  window.initializeCustomSelects();
});
