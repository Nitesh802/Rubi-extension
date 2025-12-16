// Admin Panel JavaScript
const API_BASE = '/api';
let authToken = null;
let csrfToken = null;
let currentOrgs = [];
let editingOrgId = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminScreen = document.getElementById('adminScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const adminInfo = document.getElementById('adminInfo');
const logoutBtn = document.getElementById('logoutBtn');
const refreshOrgsBtn = document.getElementById('refreshOrgsBtn');
const searchOrgs = document.getElementById('searchOrgs');
const orgsList = document.getElementById('orgsList');
const orgForm = document.getElementById('orgForm');
const cancelBtn = document.getElementById('cancelBtn');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const toast = document.getElementById('toast');
const formTitle = document.getElementById('formTitle');

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Authentication
async function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        authToken = token;
        try {
            const response = await fetch(`${API_BASE}/admin/auth/session`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                showAdminScreen(data.session);
            } else {
                showLoginScreen();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    loginScreen.classList.add('active');
    adminScreen.classList.remove('active');
    authToken = null;
    csrfToken = null;
    localStorage.removeItem('adminToken');
}

function showAdminScreen(session) {
    loginScreen.classList.remove('active');
    adminScreen.classList.add('active');
    adminInfo.textContent = `${session.userId} (${session.role})`;
    loadOrganizations();
}

// Event Listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            switchView(view);
        });
    });

    // Organizations
    refreshOrgsBtn.addEventListener('click', loadOrganizations);
    searchOrgs.addEventListener('input', filterOrganizations);

    // Form
    orgForm.addEventListener('submit', handleOrgFormSubmit);
    cancelBtn.addEventListener('click', () => switchView('list'));

    // Delete modal
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
}

// Login/Logout
async function handleLogin(e) {
    e.preventDefault();
    loginError.textContent = '';
    loginError.classList.remove('show');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/admin/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            csrfToken = data.csrfToken;
            localStorage.setItem('adminToken', authToken);
            
            showAdminScreen({
                userId: username,
                role: data.role
            });
            
            showToast('Login successful', 'success');
        } else {
            loginError.textContent = data.error || 'Login failed';
            loginError.classList.add('show');
        }
    } catch (error) {
        loginError.textContent = 'Network error. Please try again.';
        loginError.classList.add('show');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/admin/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    showLoginScreen();
    showToast('Logged out successfully', 'success');
}

// View Navigation
function switchView(viewName) {
    // Update nav
    navLinks.forEach(link => {
        if (link.dataset.view === viewName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update views
    views.forEach(view => {
        view.classList.remove('active');
    });

    switch (viewName) {
        case 'list':
            document.getElementById('listView').classList.add('active');
            loadOrganizations();
            break;
        case 'create':
            document.getElementById('createView').classList.add('active');
            resetOrgForm();
            break;
        case 'stats':
            document.getElementById('statsView').classList.add('active');
            loadStatistics();
            break;
    }
}

// Organizations Management
async function loadOrganizations() {
    orgsList.innerHTML = '<div class="loading">Loading organizations...</div>';

    try {
        const response = await fetch(`${API_BASE}/admin/orgs`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentOrgs = data.orgs;
            renderOrganizations(currentOrgs);
        } else {
            orgsList.innerHTML = '<div class="error-message show">Failed to load organizations</div>';
        }
    } catch (error) {
        console.error('Load orgs error:', error);
        orgsList.innerHTML = '<div class="error-message show">Network error. Please refresh.</div>';
    }
}

function renderOrganizations(orgs) {
    if (orgs.length === 0) {
        orgsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;">No organizations found</div>';
        return;
    }

    orgsList.innerHTML = orgs.map(org => `
        <div class="org-card" data-org-id="${org.orgId}">
            <div class="org-card-header">
                <div>
                    <div class="org-card-title">${org.orgName}</div>
                    <div class="org-card-id">${org.orgId}</div>
                </div>
                <div class="org-card-badges">
                    <span class="badge badge-${org.planTier}">${org.planTier}</span>
                </div>
            </div>
            <div class="org-card-content">
                <div class="org-card-row">
                    <span class="org-card-label">Actions:</span>
                    <span class="org-card-value">${org.allowedActions.length} allowed</span>
                </div>
                <div class="org-card-row">
                    <span class="org-card-label">Provider:</span>
                    <span class="org-card-value">${org.modelPreferences.defaultProvider}</span>
                </div>
                <div class="org-card-row">
                    <span class="org-card-label">Tone:</span>
                    <span class="org-card-value">${org.toneProfile.style}</span>
                </div>
                <div class="org-card-row">
                    <span class="org-card-label">Created:</span>
                    <span class="org-card-value">${new Date(org.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="org-card-actions">
                <button class="btn btn-primary" onclick="editOrganization('${org.orgId}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteOrganization('${org.orgId}', '${org.orgName.replace(/'/g, "\\'")}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function filterOrganizations() {
    const searchTerm = searchOrgs.value.toLowerCase();
    const filtered = currentOrgs.filter(org => 
        org.orgId.toLowerCase().includes(searchTerm) ||
        org.orgName.toLowerCase().includes(searchTerm)
    );
    renderOrganizations(filtered);
}

// Edit Organization
async function editOrganization(orgId) {
    try {
        const response = await fetch(`${API_BASE}/admin/orgs/${orgId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const org = data.org;
            
            editingOrgId = orgId;
            formTitle.textContent = 'Edit Organization';
            
            // Populate form
            document.getElementById('orgId').value = org.orgId;
            document.getElementById('orgId').disabled = true;
            document.getElementById('orgName').value = org.orgName;
            document.getElementById('planTier').value = org.planTier;
            
            // Allowed actions
            document.querySelectorAll('input[name="allowedActions"]').forEach(checkbox => {
                checkbox.checked = org.allowedActions.includes(checkbox.value);
            });
            
            // Model preferences
            document.getElementById('defaultProvider').value = org.modelPreferences.defaultProvider;
            
            // Tone profile
            document.getElementById('toneId').value = org.toneProfile.id;
            document.getElementById('toneStyle').value = org.toneProfile.style;
            document.getElementById('localeOverride').value = org.toneProfile.localeOverride || '';
            
            // Feature flags
            Object.keys(org.featureFlags).forEach(flag => {
                const checkbox = document.getElementById(flag);
                if (checkbox) {
                    checkbox.checked = org.featureFlags[flag];
                }
            });
            
            // Limits
            document.getElementById('maxActionsPerPage').value = org.limits?.maxActionsPerPage || 10;
            document.getElementById('maxActionsPerSession').value = org.limits?.maxActionsPerSession || 100;
            document.getElementById('maxTokensPerAction').value = org.limits?.maxTokensPerAction || 4000;
            
            switchView('create');
        } else {
            showToast('Failed to load organization details', 'error');
        }
    } catch (error) {
        console.error('Edit org error:', error);
        showToast('Network error', 'error');
    }
}

// Delete Organization
function deleteOrganization(orgId, orgName) {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('active');
    modal.querySelector('.org-name-confirm').textContent = orgName;
    confirmDeleteBtn.dataset.orgId = orgId;
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('active');
}

async function handleConfirmDelete() {
    const orgId = confirmDeleteBtn.dataset.orgId;
    
    try {
        const response = await fetch(`${API_BASE}/admin/orgs/${orgId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'X-CSRF-Token': csrfToken
            }
        });

        if (response.ok) {
            showToast('Organization deleted successfully', 'success');
            closeDeleteModal();
            loadOrganizations();
        } else {
            showToast('Failed to delete organization', 'error');
        }
    } catch (error) {
        console.error('Delete org error:', error);
        showToast('Network error', 'error');
    }
}

// Form Handling
function resetOrgForm() {
    editingOrgId = null;
    formTitle.textContent = 'Create New Organization';
    orgForm.reset();
    document.getElementById('orgId').disabled = false;
    
    // Set defaults
    document.getElementById('planTier').value = 'free';
    document.getElementById('toneStyle').value = 'consultative';
    document.getElementById('enableDebugPanel').checked = true;
}

async function handleOrgFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(orgForm);
    
    // Build org config object
    const orgConfig = {
        orgId: formData.get('orgId'),
        orgName: formData.get('orgName'),
        planTier: formData.get('planTier'),
        allowedActions: Array.from(document.querySelectorAll('input[name="allowedActions"]:checked'))
            .map(cb => cb.value),
        modelPreferences: {
            defaultProvider: formData.get('defaultProvider'),
            perAction: {}
        },
        toneProfile: {
            id: formData.get('toneId'),
            style: formData.get('toneStyle'),
            localeOverride: formData.get('localeOverride') || undefined
        },
        featureFlags: {
            enableDebugPanel: document.getElementById('enableDebugPanel').checked,
            enableHistory: document.getElementById('enableHistory').checked,
            enableExperimentalActions: document.getElementById('enableExperimentalActions').checked,
            enableSalesforceBeta: document.getElementById('enableSalesforceBeta').checked,
            enableLinkedInDeepDive: document.getElementById('enableLinkedInDeepDive').checked,
            enableEmailToneStrictMode: document.getElementById('enableEmailToneStrictMode').checked
        },
        limits: {
            maxActionsPerPage: parseInt(formData.get('maxActionsPerPage')),
            maxActionsPerSession: parseInt(formData.get('maxActionsPerSession')),
            maxTokensPerAction: parseInt(formData.get('maxTokensPerAction'))
        }
    };
    
    try {
        const isEdit = editingOrgId !== null;
        const url = isEdit 
            ? `${API_BASE}/admin/orgs/${editingOrgId}`
            : `${API_BASE}/admin/orgs`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify(orgConfig)
        });

        if (response.ok) {
            showToast(`Organization ${isEdit ? 'updated' : 'created'} successfully`, 'success');
            switchView('list');
        } else {
            const data = await response.json();
            showToast(data.error || `Failed to ${isEdit ? 'update' : 'create'} organization`, 'error');
        }
    } catch (error) {
        console.error('Form submit error:', error);
        showToast('Network error', 'error');
    }
}

// Statistics
async function loadStatistics() {
    const statsContent = document.getElementById('statsContent');
    statsContent.innerHTML = '<div class="loading">Loading statistics...</div>';

    try {
        const response = await fetch(`${API_BASE}/admin/orgs/stats/summary`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderStatistics(data.stats);
        } else {
            statsContent.innerHTML = '<div class="error-message show">Failed to load statistics</div>';
        }
    } catch (error) {
        console.error('Load stats error:', error);
        statsContent.innerHTML = '<div class="error-message show">Network error</div>';
    }
}

function renderStatistics(stats) {
    const statsContent = document.getElementById('statsContent');
    
    statsContent.innerHTML = `
        <div class="stat-card">
            <h3>Total Organizations</h3>
            <div class="stat-value">${stats.total}</div>
        </div>
        
        <div class="stat-card">
            <h3>By Plan Tier</h3>
            <ul class="stat-list">
                <li><span>Free</span><span>${stats.byPlanTier.free}</span></li>
                <li><span>Pilot</span><span>${stats.byPlanTier.pilot}</span></li>
                <li><span>Enterprise</span><span>${stats.byPlanTier.enterprise}</span></li>
                <li><span>Custom</span><span>${stats.byPlanTier.custom}</span></li>
            </ul>
        </div>
        
        <div class="stat-card">
            <h3>Features Enabled</h3>
            <ul class="stat-list">
                <li><span>Debug Panel</span><span>${stats.featuresEnabled.debugPanel}</span></li>
                <li><span>History</span><span>${stats.featuresEnabled.history}</span></li>
                <li><span>Experimental Actions</span><span>${stats.featuresEnabled.experimentalActions}</span></li>
                <li><span>Salesforce Beta</span><span>${stats.featuresEnabled.salesforceBeta}</span></li>
                <li><span>LinkedIn Deep Dive</span><span>${stats.featuresEnabled.linkedInDeepDive}</span></li>
                <li><span>Email Tone Strict Mode</span><span>${stats.featuresEnabled.emailToneStrictMode}</span></li>
            </ul>
        </div>
    `;
}

// Toast Notifications
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Make functions globally accessible
window.editOrganization = editOrganization;
window.deleteOrganization = deleteOrganization;
window.closeDeleteModal = closeDeleteModal;