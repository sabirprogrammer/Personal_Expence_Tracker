// ============================================================
// admin.js — Admin-scope application logic
// Depends on: api.js (loaded first)
// ============================================================

document.addEventListener('DOMContentLoaded', async function () {

  // ── Admin Route Protection ───────────────────────────────────

  const token   = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user    = userJson ? JSON.parse(userJson) : null;

  if (!token || !user || user.role !== 'admin') {
    alert('Access Denied. Administrator role required.');
    window.location.href = getRoute('login');
    return;
  }

  // ── Theme Initialisation ──────────────────────────────────
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }

  // ── Sidebar Initialisation ───────────────────────────────────
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarAvatar   = document.getElementById('sidebarAvatar');

  if (sidebarUserName) sidebarUserName.textContent = user.name;
  renderSidebarAvatar(sidebarAvatar, user);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => { e.preventDefault(); logout(); });
  }

  // Sidebar Collapse Toggle
  const sidebar = document.querySelector('.sidebar');
  const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
  const savedSidebarState = localStorage.getItem('sidebar-collapsed');

  if (savedSidebarState === 'true' && sidebar) {
    sidebar.classList.add('collapsed');
  }

  if (sidebarCollapseBtn && sidebar) {
    sidebarCollapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    });
  }

  // Theme Toggle Button Event
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      localStorage.setItem('theme', currentTheme);
      // Reload page to refresh Chart.js canvas themes cleanly
      window.location.reload();
    });
  }

  // Header Menu Dropdowns
  const profileDropdownBtn = document.getElementById('profileDropdownBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  const notificationsBtn = document.getElementById('notificationsBtn');
  const notificationsDropdown = document.getElementById('notificationsDropdown');

  function closeAllDropdowns() {
    if (profileDropdown) profileDropdown.classList.remove('show');
    if (notificationsDropdown) notificationsDropdown.classList.remove('show');
  }

  if (profileDropdownBtn && profileDropdown) {
    profileDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willShow = !profileDropdown.classList.contains('show');
      closeAllDropdowns();
      if (willShow) profileDropdown.classList.add('show');
    });
  }

  if (notificationsBtn && notificationsDropdown) {
    notificationsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willShow = !notificationsDropdown.classList.contains('show');
      closeAllDropdowns();
      if (willShow) notificationsDropdown.classList.add('show');
    });
  }

  document.addEventListener('click', () => {
    closeAllDropdowns();
  });

  if (profileDropdown) {
    profileDropdown.addEventListener('click', (e) => e.stopPropagation());
  }
  if (notificationsDropdown) {
    notificationsDropdown.addEventListener('click', (e) => e.stopPropagation());
  }

  // Set Profile Dropdown User info
  const dropdownUserName = document.getElementById('dropdownUserName');
  const dropdownUserEmail = document.getElementById('dropdownUserEmail');
  const headerAvatar = document.getElementById('headerAvatar');

  if (user) {
    if (dropdownUserName) dropdownUserName.textContent = user.name;
    if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
    if (headerAvatar) {
      renderSidebarAvatar(headerAvatar, user);
    }
  }

  const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', e => { e.preventDefault(); logout(); });
  }

  // Clear Notifications Alert
  const clearNotifications = document.getElementById('clearNotifications');
  if (clearNotifications) {
    clearNotifications.addEventListener('click', (e) => {
      e.preventDefault();
      const badge = document.querySelector('.notification-badge');
      if (badge) badge.style.display = 'none';
      const list = document.querySelector('.dropdown-list');
      if (list) {
        list.innerHTML = `
          <li style="text-align: center; color: var(--text-muted); padding: 16px 0;">
            No new system alerts
          </li>
        `;
      }
    });
  }

  // ── Admin Dashboard (index.html) ─────────────────────────────

  const adminTotalUsers        = document.getElementById('adminTotalUsers');
  const adminTotalTransactions = document.getElementById('adminTotalTransactions');

  if (adminTotalUsers && adminTotalTransactions) {
    async function loadAdminDashboard() {
      try {
        const response = await authFetch(`${API_BASE_URL}/admin/reports`);
        const reports  = await response.json();
        const { metrics, categoryStats, monthlyReports, recentUsers, recentTransactions } = reports;

        // Metric cards
        adminTotalUsers.textContent        = metrics.totalUsers;
        document.getElementById('adminActiveUsers').textContent   = metrics.activeUsers;
        document.getElementById('adminDisabledUsers').textContent = metrics.inactiveUsers;
        adminTotalTransactions.textContent = metrics.totalTransactions;

        const formatRs = v => 'Rs: ' + v.toLocaleString(undefined, { minimumFractionDigits: 2 });
        document.getElementById('adminTotalIncome').textContent   = formatRs(metrics.totalIncome);
        document.getElementById('adminTotalExpenses').textContent = formatRs(metrics.totalExpenses);

        const netEl = document.getElementById('adminNetBalance');
        netEl.textContent = formatRs(metrics.netBalance);
        netEl.style.color = metrics.netBalance >= 0 ? 'var(--color-income)' : 'var(--color-expense)';

        // Recent registered users
        const recentUsersEl = document.getElementById('adminRecentUsers');
        if (recentUsersEl) {
          if (recentUsers.length === 0) {
            recentUsersEl.innerHTML = '<p class="empty-state">No users registered.</p>';
          } else {
            recentUsersEl.innerHTML = recentUsers.map(u => {
              const statusBadge = u.status === 'active'
                ? '<span class="badge badge-active">Active</span>'
                : '<span class="badge badge-disabled">Disabled</span>';
              const createdDate = new Date(u.createdAt).toISOString().split('T')[0];
              return `
                <div class="list-item-row">
                  <div>
                    <div class="item-label">${u.name}</div>
                    <div class="text-muted-sm">${u.email} &bull; Reg: ${createdDate}</div>
                  </div>
                  <div>${statusBadge}</div>
                </div>`;
            }).join('');
          }
        }

        // Recent transactions across all users
        const recentTransEl = document.getElementById('adminRecentTransactions');
        if (recentTransEl) {
          if (recentTransactions.length === 0) {
            recentTransEl.innerHTML = '<p class="empty-state">No recent activity.</p>';
          } else {
            recentTransEl.innerHTML = recentTransactions.map(t => {
              const isIncome = t.type.toLowerCase() === 'income';
              return `
                <div class="list-item-row" style="border-left:4px solid var(${isIncome ? '--color-income' : '--color-expense'})">
                  <div>
                    <div class="item-label">${t.category} (${t.userName})</div>
                    <div class="text-muted-sm">${t.date}</div>
                  </div>
                  <div style="font-weight:700;color:var(${isIncome ? '--color-income' : '--color-expense'})">
                    ${isIncome ? '+' : '-'} Rs: ${t.amount.toFixed(2)}
                  </div>
                </div>`;
            }).join('');
          }
        }

        // Charts
        if (typeof Chart !== 'undefined') {
          const isLight = document.body.classList.contains('light-theme');
          const textColor = isLight ? '#0f172a' : '#f3f4f6';
          const labelColor = isLight ? '#475569' : '#9ca3af';
          const gridColor = isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255, 255, 255, 0.05)';
          const borderColor = isLight ? '#ffffff' : '#151f32';

          const CHART_COLORS = ['#a855f7','#3b82f6','#10b981','#f59e0b','#f43f5e','#0ea5e9','#6366f1'];

          const catLabels = Object.keys(categoryStats);
          const catValues = Object.values(categoryStats);
          const adminCategoryChartCanvas = document.getElementById('adminCategoryChart');
          if (adminCategoryChartCanvas && catLabels.length > 0) {
            new Chart(adminCategoryChartCanvas, {
              type: 'doughnut',
              data: { 
                labels: catLabels, 
                datasets: [{ 
                  data: catValues, 
                  backgroundColor: CHART_COLORS, 
                  borderWidth: 2, 
                  borderColor: borderColor 
                }] 
              },
              options: { 
                responsive: true, 
                cutout: '75%',
                plugins: { 
                  legend: { 
                    position: 'right', 
                    labels: { 
                      color: textColor,
                      font: { family: 'Inter', size: 12, weight: '500' },
                      padding: 16,
                      usePointStyle: true,
                      pointStyle: 'circle'
                    } 
                  } 
                } 
              }
            });
          }

          const months   = Object.keys(monthlyReports).sort();
          const adminMonthlyChartCanvas = document.getElementById('adminMonthlyChart');
          if (adminMonthlyChartCanvas && months.length > 0) {
            new Chart(adminMonthlyChartCanvas, {
              type: 'bar',
              data: {
                labels: months,
                datasets: [
                  { 
                    label: 'Income',  
                    data: months.map(m => monthlyReports[m].income),   
                    backgroundColor: 'rgba(16,185,129,0.85)', 
                    borderColor: '#10b981', 
                    borderWidth: 1,
                    borderRadius: 6
                  },
                  { 
                    label: 'Expense', 
                    data: months.map(m => monthlyReports[m].expenses), 
                    backgroundColor: 'rgba(244,63,94,0.85)',  
                    borderColor: '#f43f5e', 
                    borderWidth: 1,
                    borderRadius: 6
                  }
                ]
              },
              options: {
                responsive: true,
                scales: {
                  x: { 
                    ticks: { color: labelColor, font: { family: 'Inter' } }, 
                    grid: { color: gridColor } 
                  },
                  y: { 
                    ticks: { color: labelColor, font: { family: 'Inter' } }, 
                    grid: { color: gridColor } 
                  }
                },
                plugins: { 
                  legend: { 
                    labels: { 
                      color: textColor,
                      font: { family: 'Inter', size: 12, weight: '500' },
                      usePointStyle: true,
                      pointStyle: 'circle'
                    } 
                  } 
                }
              }
            });
          }
        }
      } catch (err) {
        // Dashboard silently fails — metrics remain at defaults
      }
    }

    loadAdminDashboard();
  }

  // ── User Management (users.html) ─────────────────────────────

  const adminUsersTableBody = document.getElementById('adminUsersTableBody');
  const editUserModalBackdrop = document.getElementById('editUserModalBackdrop');
  const editUserForm = document.getElementById('editUserForm');

  if (adminUsersTableBody) {
    const userSearchInput  = document.getElementById('userSearchInput');
    const userFilterStatus = document.getElementById('userFilterStatus');
    const userFilterRole   = document.getElementById('userFilterRole');

    if (userSearchInput)  userSearchInput.addEventListener('input', loadUsersList);
    if (userFilterStatus) userFilterStatus.addEventListener('change', loadUsersList);
    if (userFilterRole)   userFilterRole.addEventListener('change', loadUsersList);

    async function loadUsersList() {
      adminUsersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">Loading users...</td></tr>';

      const params = new URLSearchParams();
      const search = userSearchInput?.value.trim() || '';
      const status = userFilterStatus?.value || '';
      const role   = userFilterRole?.value || '';

      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (role)   params.append('role', role);

      try {
        const response = await authFetch(`${API_BASE_URL}/admin/users?${params.toString()}`);
        const users = await response.json();

        adminUsersTableBody.innerHTML = '';

        if (users.length === 0) {
          adminUsersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">No users found.</td></tr>';
          return;
        }

        users.forEach(u => {
          const tr = document.createElement('tr');
          const createdDate  = new Date(u.createdAt).toISOString().split('T')[0];
          const statusBadge  = u.status === 'active' ? 'badge-active' : 'badge-disabled';
          const roleBadge    = u.role === 'admin' ? 'badge-admin' : 'badge-user';

          tr.innerHTML = `
            <td>#${u._id.substring(u._id.length - 6).toUpperCase()}</td>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge ${roleBadge}">${u.role}</span></td>
            <td><span class="badge ${statusBadge}">${u.status}</span></td>
            <td>${createdDate}</td>
            <td class="action-cell">
              <button class="btn btn-secondary btn-sm edit-user-btn" data-id="${u._id}">Edit</button>
              <button class="btn btn-danger btn-sm delete-user-btn" data-id="${u._id}">Delete</button>
            </td>`;

          tr.querySelector('.edit-user-btn').addEventListener('click', () => openEditUserModal(u));
          tr.querySelector('.delete-user-btn').addEventListener('click', () => deleteUserAccount(u._id, u.name));

          adminUsersTableBody.appendChild(tr);
        });
      } catch (err) {
        adminUsersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-expense)">Error loading users.</td></tr>';
      }
    }

    function openEditUserModal(u) {
      document.getElementById('editUserId').value = u._id;
      document.getElementById('editUserName').value = u.name;
      document.getElementById('editUserEmail').value = u.email;
      document.getElementById('editUserRoleSelect').value = u.role;
      document.getElementById('editUserStatusSelect').value = u.status;
      document.getElementById('editUserPassword').value = '';
      editUserModalBackdrop.classList.add('open');
    }

    function closeEditUserModal() {
      editUserModalBackdrop.classList.remove('open');
    }

    document.getElementById('editUserCloseBtn')?.addEventListener('click', closeEditUserModal);
    document.getElementById('cancelEditUserBtn')?.addEventListener('click', closeEditUserModal);

    if (editUserForm) {
      editUserForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id       = document.getElementById('editUserId').value;
        const name     = document.getElementById('editUserName').value;
        const email    = document.getElementById('editUserEmail').value;
        const role     = document.getElementById('editUserRoleSelect').value;
        const status   = document.getElementById('editUserStatusSelect').value;
        const password = document.getElementById('editUserPassword').value;

        const updateBody = { name, email, role, status };
        if (password) updateBody.password = password;

        try {
          const res  = await authFetch(`${API_BASE_URL}/admin/users/${id}`, { method: 'PUT', body: updateBody });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to update user');

          alert('User updated successfully!');
          closeEditUserModal();
          loadUsersList();

          // Update localStorage if admin edited their own profile
          if (id === user._id) {
            const updatedUser = { ...user, name, email, role, status };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (sidebarUserName) sidebarUserName.textContent = name;
          }
        } catch (err) {
          alert(err.message);
        }
      });
    }

    async function deleteUserAccount(id, name) {
      if (!confirm(`CAUTION: Delete "${name}"? This permanently removes their account and all transactions.`)) return;
      try {
        const res  = await authFetch(`${API_BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete user');
        alert('User account deleted successfully.');
        loadUsersList();
      } catch (err) {
        alert(err.message);
      }
    }

    loadUsersList();
  }

  // ── Category Management (categories.html) ────────────────────

  const adminCategoriesTableBody = document.getElementById('adminCategoriesTableBody');
  const editCatModalBackdrop     = document.getElementById('editCatModalBackdrop');
  const editCatForm              = document.getElementById('editCatForm');

  if (adminCategoriesTableBody) {
    async function loadCategoriesList() {
      adminCategoriesTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center">Loading categories...</td></tr>';

      try {
        const response   = await authFetch(`${API_BASE_URL}/categories`);
        const categories = await response.json();

        adminCategoriesTableBody.innerHTML = '';

        if (categories.length === 0) {
          adminCategoriesTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center">No categories found.</td></tr>';
          return;
        }

        categories.forEach(cat => {
          const tr = document.createElement('tr');
          const statusBadge = cat.status === 'active' ? 'badge-active' : 'badge-disabled';

          tr.innerHTML = `
            <td>#${cat._id.substring(cat._id.length - 6).toUpperCase()}</td>
            <td><strong>${cat.name}</strong></td>
            <td><span class="badge ${statusBadge}">${cat.status}</span></td>
            <td class="action-cell">
              <button class="btn btn-secondary btn-sm edit-cat-btn" data-id="${cat._id}">Edit</button>
              <button class="btn btn-danger btn-sm delete-cat-btn" data-id="${cat._id}">Delete</button>
            </td>`;

          tr.querySelector('.edit-cat-btn').addEventListener('click', () => openEditCatModal(cat));
          tr.querySelector('.delete-cat-btn').addEventListener('click', () => deleteCategory(cat._id, cat.name));

          adminCategoriesTableBody.appendChild(tr);
        });
      } catch (err) {
        adminCategoriesTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--color-expense)">Error loading categories.</td></tr>';
      }
    }

    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
      addCategoryForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const catNameInput = document.getElementById('newCategoryName');
        const name = catNameInput.value.trim();
        if (!name) return;

        try {
          const response = await authFetch(`${API_BASE_URL}/categories`, { method: 'POST', body: { name, status: 'active' } });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Failed to create category');
          alert('Category created successfully!');
          catNameInput.value = '';
          loadCategoriesList();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    function openEditCatModal(cat) {
      document.getElementById('editCatId').value = cat._id;
      document.getElementById('editCatName').value = cat.name;
      document.getElementById('editCatStatusSelect').value = cat.status;
      editCatModalBackdrop.classList.add('open');
    }

    function closeEditCatModal() {
      editCatModalBackdrop.classList.remove('open');
    }

    document.getElementById('editCatCloseBtn')?.addEventListener('click', closeEditCatModal);
    document.getElementById('cancelEditCatBtn')?.addEventListener('click', closeEditCatModal);

    if (editCatForm) {
      editCatForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id     = document.getElementById('editCatId').value;
        const name   = document.getElementById('editCatName').value;
        const status = document.getElementById('editCatStatusSelect').value;

        try {
          const res  = await authFetch(`${API_BASE_URL}/categories/${id}`, { method: 'PUT', body: { name, status } });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to update category');
          alert('Category updated successfully!');
          closeEditCatModal();
          loadCategoriesList();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    async function deleteCategory(id, name) {
      if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
      try {
        const res  = await authFetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete category');
        alert('Category deleted successfully.');
        loadCategoriesList();
      } catch (err) {
        alert(err.message);
      }
    }

    loadCategoriesList();
  }

  // ── Transaction Monitor (reports.html — admin section) ───────

  const adminTransTableBody = document.getElementById('adminTransTableBody');

  if (adminTransTableBody) {
    const transSearchInput = document.getElementById('transSearchInput');
    const transFilterType  = document.getElementById('transFilterType');

    if (transSearchInput) transSearchInput.addEventListener('input', loadAdminTransactionsList);
    if (transFilterType)  transFilterType.addEventListener('change', loadAdminTransactionsList);

    async function loadAdminTransactionsList() {
      adminTransTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">Loading transactions...</td></tr>';

      const params = new URLSearchParams();
      const search = transSearchInput?.value.trim() || '';
      const type   = transFilterType?.value || '';

      if (search)           params.append('search', search);
      if (type && type !== 'all') params.append('type', type);

      try {
        const response     = await authFetch(`${API_BASE_URL}/admin/transactions?${params.toString()}`);
        const transactions = await response.json();

        adminTransTableBody.innerHTML = '';

        if (transactions.length === 0) {
          adminTransTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">No transactions found.</td></tr>';
          return;
        }

        transactions.forEach(t => {
          const tr = document.createElement('tr');
          const isIncome  = t.type.toLowerCase() === 'income';
          const typeBadge = isIncome ? 'badge-income' : 'badge-expense';

          tr.innerHTML = `
            <td>#${t.id.substring(t.id.length - 6).toUpperCase()}</td>
            <td><strong>${t.user.name}</strong><br><span class="text-muted-sm">${t.user.email}</span></td>
            <td>${t.date}</td>
            <td><span class="badge ${typeBadge}">${t.type}</span></td>
            <td>${t.category}</td>
            <td class="amount-cell" style="color:var(${isIncome ? '--color-income' : '--color-expense'})">
              ${isIncome ? '+' : '-'} Rs: ${t.amount.toFixed(2)}
            </td>
            <td>
              <button class="btn btn-danger btn-sm delete-trans-btn" data-id="${t.id}">Delete</button>
            </td>`;

          tr.querySelector('.delete-trans-btn').addEventListener('click', () => deleteAdminTransaction(t.id));

          adminTransTableBody.appendChild(tr);
        });
      } catch (err) {
        adminTransTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-expense)">Error loading transactions.</td></tr>';
      }
    }

    async function deleteAdminTransaction(id) {
      if (!confirm('CAUTION: Permanently delete this transaction?')) return;
      try {
        const res  = await authFetch(`${API_BASE_URL}/admin/transactions/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete transaction');
        alert('Transaction deleted by administrator.');
        loadAdminTransactionsList();
      } catch (err) {
        alert(err.message);
      }
    }

    loadAdminTransactionsList();
  }

});
