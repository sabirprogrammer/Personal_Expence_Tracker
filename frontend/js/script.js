// ============================================================
// script.js — User-scope application logic
// Depends on: api.js (loaded first)
// ============================================================

document.addEventListener('DOMContentLoaded', async function () {

  // ── Route Protection & Role Verification ────────────────────

  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const path = window.location.pathname;

  const isAuthPage   = path.endsWith('login.html') || path.endsWith('signup.html');
  const isAdminPage  = path.includes('/admin/');
  const isUserPage   = path.endsWith('dashboard.html')      ||
                       path.endsWith('transactions.html')   ||
                       path.endsWith('add-transaction.html')||
                       path.endsWith('profile.html')        ||
                       path.endsWith('reports.html');

  if (token && user) {
    if (isAuthPage) {
      window.location.href = user.role === 'admin' ? getRoute('adminDashboard') : getRoute('userDashboard');
      return;
    }
    if (isUserPage && user.role === 'admin') {
      window.location.href = getRoute('adminDashboard');
      return;
    }
    if (isAdminPage && user.role !== 'admin') {
      alert('Access Denied. Admin privileges required.');
      window.location.href = getRoute('userDashboard');
      return;
    }
  } else if (isUserPage || isAdminPage) {
    window.location.href = getRoute('login');
    return;
  }

  // ── Sidebar Initialisation ──────────────────────────────────

  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserRole = document.getElementById('sidebarUserRole');
  const sidebarAvatar   = document.getElementById('sidebarAvatar');

  if (user && sidebarUserName) {
    sidebarUserName.textContent = user.name;
    if (sidebarUserRole) sidebarUserRole.textContent = user.role;
    renderSidebarAvatar(sidebarAvatar, user);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => { e.preventDefault(); logout(); });
  }

  // ── Signup Form ─────────────────────────────────────────────

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const fullname       = document.getElementById('fullname').value.trim();
      const email          = document.getElementById('email').value;
      const password       = document.getElementById('password').value;
      const confirmPassword= document.getElementById('confirm_password').value;
      const gender         = document.querySelector('input[name="gender"]:checked')?.value || '';
      const dob            = document.getElementById('dob').value;
      const country        = document.getElementById('country').value;
      const terms          = document.getElementById('terms');

      if (!fullname) { alert('Full Name cannot be empty.'); return; }
      if (password.length < 6) { alert('Password must be at least 6 characters long.'); return; }
      if (password !== confirmPassword) { alert('Passwords do not match.'); return; }
      if (!terms.checked) { alert('You must accept the Terms and Conditions to continue.'); return; }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullname, email, password, gender, dob, country })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');

        alert('Account registered successfully! Redirecting to login.');
        window.location.href = getRoute('login');
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // ── Login Form ──────────────────────────────────────────────

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const email    = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        alert(`Welcome back, ${data.user.name}!`);
        window.location.href = data.user.role === 'admin' ? getRoute('adminDashboard') : getRoute('userDashboard');
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // ── Transaction Form (Add / Edit) ───────────────────────────

  const transactionForm = document.getElementById('transactionForm');
  if (transactionForm) {

    async function loadCategoryOptions(selectedCategory = '') {
      const categorySelect = document.getElementById('category');
      if (!categorySelect) return;

      try {
        const response = await authFetch(`${API_BASE_URL}/categories`);
        const categories = await response.json();

        categorySelect.innerHTML = '<option value="">-- Select Category --</option>';
        categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.name;
          option.textContent = cat.name;
          if (selectedCategory && cat.name.toLowerCase() === selectedCategory.toLowerCase()) {
            option.selected = true;
          }
          categorySelect.appendChild(option);
        });
      } catch (err) {
        // Silently fail — category dropdown will just remain empty
      }
    }

    async function loadTransactionForEdit(id) {
      try {
        const response = await authFetch(`${API_BASE_URL}/transactions/${id}`);
        const transaction = await response.json();

        document.getElementById('type').value = transaction.type.toLowerCase();
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('date').value = transaction.date;
        document.getElementById('description').value = transaction.description;

        const editIdEl = document.getElementById('editId');
        if (editIdEl) editIdEl.value = transaction.id;

        await loadCategoryOptions(transaction.category);

        const submitBtn = transactionForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Update Transaction';
      } catch (error) {
        alert(error.message);
      }
    }

    const editId = getParameterByName('edit');
    if (editId) {
      loadTransactionForEdit(editId);
    } else {
      loadCategoryOptions();
    }

    transactionForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const currentEditId = document.getElementById('editId')?.value || '';
      const type          = document.getElementById('type').value;
      const amount        = document.getElementById('amount').value;
      const category      = document.getElementById('category').value;
      const date          = document.getElementById('date').value;
      const description   = document.getElementById('description').value;

      if (!type)                              { alert('Please select a transaction type.'); return; }
      if (!amount || parseFloat(amount) <= 0) { alert('Amount must be greater than 0.'); return; }
      if (!category)                          { alert('Category cannot be empty.'); return; }
      if (!date)                              { alert('Please select a date.'); return; }

      const transactionData = { type, amount: parseFloat(amount), category, date, description: description || '' };

      try {
        if (currentEditId) {
          const response = await authFetch(`${API_BASE_URL}/transactions/${currentEditId}`, { method: 'PUT', body: transactionData });
          if (!response.ok) throw new Error('Failed to update transaction');
          alert('Transaction updated successfully!');
        } else {
          const response = await authFetch(`${API_BASE_URL}/transactions`, { method: 'POST', body: transactionData });
          if (!response.ok) throw new Error('Failed to add transaction');
          alert('Transaction added successfully!');
        }
        window.location.href = 'transactions.html';
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // ── Transaction History Table ────────────────────────────────

  const tableBody    = document.getElementById('transactionTableBody');
  const searchInput  = document.getElementById('searchInput');
  const filterType   = document.getElementById('filterType');
  const sortOption   = document.getElementById('sortOption');

  if (tableBody) {
    if (searchInput) searchInput.addEventListener('input', loadTransactions);
    if (filterType)  filterType.addEventListener('change', loadTransactions);
    if (sortOption)  sortOption.addEventListener('change', loadTransactions);

    async function loadTransactions() {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">Loading transactions...</td></tr>';

      const params = new URLSearchParams();
      const searchVal = searchInput?.value.trim() || '';
      const filterVal = filterType?.value || 'all';
      const sortVal   = sortOption?.value || 'date-newest';

      if (searchVal)           params.append('search', searchVal);
      if (filterVal !== 'all') params.append('type', filterVal);
      if (sortVal)             params.append('sort', sortVal);

      try {
        const response = await authFetch(`${API_BASE_URL}/transactions?${params.toString()}`);
        const transactions = await response.json();

        tableBody.innerHTML = '';

        if (transactions.length === 0) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="7" class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p>No transactions found.</p>
              </td>
            </tr>`;
          return;
        }

        transactions.forEach(t => {
          const row = document.createElement('tr');
          const isIncome = t.type.toLowerCase() === 'income';
          const typeBadge = isIncome ? 'badge-income' : 'badge-expense';
          const amountColor = isIncome ? 'var(--color-income)' : 'var(--color-expense)';

          row.innerHTML = `
            <td>#${t.id.substring(t.id.length - 6).toUpperCase()}</td>
            <td>${t.date}</td>
            <td><span class="badge ${typeBadge}">${t.type}</span></td>
            <td>${t.category}</td>
            <td class="amount-cell" style="color:${amountColor}">
              ${isIncome ? '+' : '-'} Rs: ${t.amount.toFixed(2)}
            </td>
            <td>${t.description || '<span class="text-muted">None</span>'}</td>
            <td class="action-cell">
              <button class="btn btn-secondary btn-sm edit-btn" data-id="${t.id}">Edit</button>
              <button class="btn btn-danger btn-sm delete-btn" data-id="${t.id}">Delete</button>
            </td>`;

          row.querySelector('.edit-btn').addEventListener('click', () => {
            window.location.href = `add-transaction.html?edit=${t.id}`;
          });
          row.querySelector('.delete-btn').addEventListener('click', () => deleteUserTransaction(t.id));

          tableBody.appendChild(row);
        });
      } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-expense)">Error loading data.</td></tr>';
      }
    }

    async function deleteUserTransaction(id) {
      if (!confirm('Are you sure you want to delete this transaction?')) return;
      try {
        const response = await authFetch(`${API_BASE_URL}/transactions/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete transaction');
        alert('Transaction deleted successfully!');
        loadTransactions();
      } catch (error) {
        alert(error.message);
      }
    }

    loadTransactions();
  }

  // ── User Dashboard Overview ──────────────────────────────────

  const totalIncomeEl      = document.getElementById('totalIncome');
  const totalExpensesEl    = document.getElementById('totalExpenses');
  const remainingBalanceEl = document.getElementById('remainingBalance');

  if (totalIncomeEl && totalExpensesEl && remainingBalanceEl) {
    async function updateDashboard() {
      try {
        const response = await authFetch(`${API_BASE_URL}/transactions`);
        const transactions = await response.json();

        let totalIncome   = 0;
        let totalExpenses = 0;
        let monthlyIncome   = 0;
        let monthlyExpenses = 0;
        const categoryTotals = {};

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear  = now.getFullYear();

        transactions.forEach(t => {
          const amt = t.amount;
          const tDate = new Date(t.date);
          const isCurrentMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
          const isIncome = t.type.toLowerCase() === 'income';

          if (isIncome) {
            totalIncome += amt;
            if (isCurrentMonth) monthlyIncome += amt;
          } else {
            totalExpenses += amt;
            if (isCurrentMonth) monthlyExpenses += amt;
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
          }
        });

        const formatAmount = v => 'Rs: ' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        totalIncomeEl.textContent      = formatAmount(totalIncome);
        totalExpensesEl.textContent    = formatAmount(totalExpenses);
        remainingBalanceEl.textContent = formatAmount(totalIncome - totalExpenses);

        const monthlyIncomeEl   = document.getElementById('monthlyIncome');
        const monthlyExpensesEl = document.getElementById('monthlyExpenses');
        const monthlyBalanceEl  = document.getElementById('monthlyBalance');
        if (monthlyIncomeEl)   monthlyIncomeEl.textContent   = formatAmount(monthlyIncome);
        if (monthlyExpensesEl) monthlyExpensesEl.textContent = formatAmount(monthlyExpenses);
        if (monthlyBalanceEl)  monthlyBalanceEl.textContent  = formatAmount(monthlyIncome - monthlyExpenses);

        // Category stats bars
        const categoryStatsEl = document.getElementById('categoryStats');
        if (categoryStatsEl) {
          const categories = Object.keys(categoryTotals);
          if (categories.length === 0) {
            categoryStatsEl.innerHTML = '<div class="empty-state"><p>No expense data available.</p></div>';
          } else {
            const maxVal = Math.max(...Object.values(categoryTotals));
            categoryStatsEl.innerHTML = categories.map(cat => {
              const amount = categoryTotals[cat];
              const pct = maxVal > 0 ? (amount / maxVal) * 100 : 0;
              return `
                <div class="category-stat-bar">
                  <div class="category-stat-info">
                    <span>${cat}</span>
                    <span>Rs: ${amount.toFixed(2)}</span>
                  </div>
                  <div class="category-stat-track">
                    <div class="category-stat-fill" style="width:${pct}%"></div>
                  </div>
                </div>`;
            }).join('');
          }
        }

        // Recent 5 transactions
        const recentTransactionsEl = document.getElementById('recentTransactions');
        if (recentTransactionsEl) {
          const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
          if (recent.length === 0) {
            recentTransactionsEl.innerHTML = '<div class="empty-state"><p>No transactions yet.</p></div>';
          } else {
            recentTransactionsEl.innerHTML = recent.map(t => {
              const isIncome = t.type.toLowerCase() === 'income';
              return `
                <div class="list-item-row" style="border-left:4px solid var(${isIncome ? '--color-income' : '--color-expense'})">
                  <span>
                    <div class="item-label">${t.category}</div>
                    <div class="text-muted-sm">${t.date}</div>
                  </span>
                  <span style="font-weight:700;color:var(${isIncome ? '--color-income' : '--color-expense'})">
                    ${isIncome ? '+ ' : '- '}Rs: ${t.amount.toFixed(2)}
                  </span>
                </div>`;
            }).join('');
          }
        }
      } catch (err) {
        // Silently fail — dashboard just shows zeros
      }
    }

    updateDashboard();
  }

  // ── User Profile Settings ────────────────────────────────────

  const profileForm           = document.getElementById('profileForm');
  const profilePicInput       = document.getElementById('profilePicInput');
  const profilePicImage       = document.getElementById('profilePicImage');
  const profilePicPlaceholder = document.getElementById('profilePicPlaceholder');

  if (profileForm) {
    let loadedImageBase64 = '';

    async function loadUserProfile() {
      try {
        const response = await authFetch(`${API_BASE_URL}/auth/profile`);
        const profile = await response.json();

        document.getElementById('profileName').value = profile.name;
        document.getElementById('profileEmail').value = profile.email;
        if (profile.gender) document.getElementById('profileGender').value = profile.gender;
        if (profile.dob)    document.getElementById('profileDob').value = profile.dob.split('T')[0];
        if (profile.country) document.getElementById('profileCountry').value = profile.country;

        if (profile.profileImage) {
          loadedImageBase64 = profile.profileImage;
          profilePicImage.src = profile.profileImage;
          profilePicImage.style.display = 'block';
          if (profilePicPlaceholder) profilePicPlaceholder.style.display = 'none';
        } else {
          if (profilePicPlaceholder) {
            profilePicPlaceholder.textContent = getInitials(profile.name);
            profilePicPlaceholder.style.display = 'flex';
          }
          profilePicImage.style.display = 'none';
        }
      } catch (err) {
        // Profile load failed — form remains empty
      }
    }

    loadUserProfile();

    if (profilePicInput) {
      profilePicInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
          loadedImageBase64 = evt.target.result;
          profilePicImage.src = loadedImageBase64;
          profilePicImage.style.display = 'block';
          if (profilePicPlaceholder) profilePicPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
      });
    }

    profileForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const name            = document.getElementById('profileName').value;
      const email           = document.getElementById('profileEmail').value;
      const gender          = document.getElementById('profileGender').value;
      const dob             = document.getElementById('profileDob').value;
      const country         = document.getElementById('profileCountry').value;
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword     = document.getElementById('newPassword').value;
      const confirmNewPassword = document.getElementById('confirmNewPassword').value;

      const profileData = { name, email, gender, dob, country, profileImage: loadedImageBase64 };

      if (newPassword) {
        if (!currentPassword) { alert('Current password is required to change password.'); return; }
        if (newPassword !== confirmNewPassword) { alert('New passwords do not match.'); return; }
        profileData.currentPassword = currentPassword;
        profileData.newPassword = newPassword;
      }

      try {
        const response = await authFetch(`${API_BASE_URL}/auth/profile`, { method: 'PUT', body: profileData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update profile');

        localStorage.setItem('user', JSON.stringify(data.user));

        // Update sidebar
        if (sidebarUserName) sidebarUserName.textContent = data.user.name;
        renderSidebarAvatar(sidebarAvatar, data.user);

        alert('Profile updated successfully!');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // ── Reports Charts (Chart.js) ────────────────────────────────

  const categoryChartCanvas = document.getElementById('categoryChart');
  const monthlyChartCanvas  = document.getElementById('monthlyChart');

  if (categoryChartCanvas && monthlyChartCanvas) {
    async function loadReportsCharts() {
      try {
        const response = await authFetch(`${API_BASE_URL}/transactions`);
        const transactions = await response.json();

        const categoryTotals = {};
        const monthlyData = {};

        transactions.forEach(t => {
          const typeLower = t.type.toLowerCase();

          if (typeLower === 'expense') {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
          }

          if (t.date) {
            const monthKey = t.date.substring(0, 7);
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expenses: 0 };
            if (typeLower === 'income') monthlyData[monthKey].income += t.amount;
            else monthlyData[monthKey].expenses += t.amount;
          }
        });

        const CHART_COLORS = ['#a855f7','#3b82f6','#10b981','#f59e0b','#f43f5e','#0ea5e9','#6366f1','#14b8a6','#ec4899','#84cc16'];
        const CHART_DEFAULTS = {
          legend: { position: 'right', labels: { color: '#f3f4f6' } },
          scale:  { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        };

        // Category doughnut chart
        const catLabels = Object.keys(categoryTotals);
        const catValues = Object.values(categoryTotals);
        if (catLabels.length === 0) {
          document.getElementById('categoryChartContainer').innerHTML = '<div class="empty-state"><p>No expense data available.</p></div>';
        } else {
          new Chart(categoryChartCanvas, {
            type: 'doughnut',
            data: { labels: catLabels, datasets: [{ data: catValues, backgroundColor: CHART_COLORS, borderWidth: 1, borderColor: 'var(--bg-surface)' }] },
            options: { responsive: true, plugins: { legend: CHART_DEFAULTS.legend } }
          });
        }

        // Monthly bar chart
        const sortedMonths = Object.keys(monthlyData).sort();
        if (sortedMonths.length === 0) {
          document.getElementById('monthlyChartContainer').innerHTML = '<div class="empty-state"><p>No monthly records found.</p></div>';
        } else {
          new Chart(monthlyChartCanvas, {
            type: 'bar',
            data: {
              labels: sortedMonths,
              datasets: [
                { label: 'Income',  data: sortedMonths.map(m => monthlyData[m].income),   backgroundColor: 'rgba(16,185,129,0.75)', borderColor: '#10b981', borderWidth: 1 },
                { label: 'Expense', data: sortedMonths.map(m => monthlyData[m].expenses), backgroundColor: 'rgba(244,63,94,0.75)',  borderColor: '#f43f5e', borderWidth: 1 }
              ]
            },
            options: {
              responsive: true,
              scales: { x: CHART_DEFAULTS.scale, y: CHART_DEFAULTS.scale },
              plugins: { legend: { labels: { color: '#f3f4f6' } } }
            }
          });
        }
      } catch (err) {
        // Charts silently fail — page still renders
      }
    }

    if (typeof Chart !== 'undefined') {
      loadReportsCharts();
    } else {
      setTimeout(loadReportsCharts, 1000);
    }
  }

});

// ── URL Helper ───────────────────────────────────────────────────

function getParameterByName(name) {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}