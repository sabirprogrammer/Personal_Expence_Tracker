/**
 * api.js — Shared API Utilities
 * Loaded before script.js and admin.js on every authenticated page.
 * Provides: API_BASE_URL, authFetch(), logout(), getInitials()
 */

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
