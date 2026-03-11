// ==========================
// APP REGISTRY CENTRAL
// ==========================

export const App = {
    components: {},

    register(name, component) {
        this.components[name] = component;
    },

    get(name) {
        return this.components[name];
    },

    async loadComponent(name) {
        if (this.components[name]) {
            return this.components[name];
        }

        try {
            // cache-bust: evita que o browser sirva JS estale do disk-cache
            const bust = `v=${Date.now()}`;
            await import(`/components/${name}.js?${bust}`);
            return this.components[name];
        } catch (err) {
            console.error(`Erro ao carregar componente ${name}`, err);
            return null;
        }
    }
};

// ===== CONFIG =====
const API_BASE = '/api';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

/** Getter exportável para componentes que precisam do usuário logado */
export function getCurrentUser() { return currentUser; }

// ===== AUTH SECTION =====
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        console.log(`[LOGIN] Enviando credenciais para: ${email}`);
        
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log(`[LOGIN] Response status: ${res.status}`);
        let data;
        try {
            data = await res.json();
        } catch (parseErr) {
            console.error(`[LOGIN] Erro ao fazer parse JSON:`, parseErr);
            showError('login-error', 'Erro ao processar resposta do servidor');
            return;
        }
        
        console.log(`[LOGIN] Response data:`, data);
        
        if (!res.ok) {
            const errorMsg = data.error || `Erro ${res.status}: ${res.statusText}`;
            console.error(`[LOGIN] Erro na resposta:`, errorMsg);
            showError('login-error', errorMsg);
            alert(`Erro ao fazer login: ${errorMsg}`);
            return;
        }

        if (!data.token || !data.user) {
            console.error(`[LOGIN] Resposta incompleta:`, data);
            showError('login-error', 'Resposta incompleta do servidor');
            alert('Erro: Resposta incompleta do servidor');
            return;
        }

        token = data.token;
        currentUser = data.user;
        console.log(`[LOGIN] Autenticação bem-sucedida para user_id: ${currentUser.id}`);
        
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        console.log(`[LOGIN] LocalStorage atualizado`);

        showApp();
    } catch (error) {
        console.error(`[LOGIN] Erro não capturado:`, error);
        showError('login-error', `Erro: ${error.message}`);
        alert(`Erro ao fazer login: ${error.message}`);
    }
});

function showApp() {
    if (!token || !currentUser || !currentUser.id) {
        console.error(`[SHOWAPP] Sem autenticação válida`);
        showError('login-error', 'Autenticação inválida. Faça login novamente.');
        return;
    }
    
    console.log(`[SHOWAPP] Exibindo app para user: ${currentUser.name}`);
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('app-section').classList.add('active');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-name').textContent = currentUser.name;
   
    // Esconder todos os menus primeiro
    const allMenus = ['dashboard-menu', 'clients-menu', 'enterprises-menu', 'units-menu', 
                      'tenants-menu', 'contracts-menu', 'services-menu', 'charges-menu', 'properties-menu',
                      'expenses-menu', 'partners-menu', 'users-menu'];
    allMenus.forEach(m => {
        const el = document.getElementById(m);
        if (el) el.style.display = 'none';
    });

    // Mostrar menus baseado no role
    if (currentUser.role === 'platform_admin') {
        // Platform Admin - apenas clientes
        document.getElementById('dashboard-menu').style.display = 'block';
        document.getElementById('clients-menu').style.display = 'block';
        loadClients();
    } else {
        // Todos os outros roles: menu completo
        document.getElementById('dashboard-menu').style.display = 'block';
        document.getElementById('enterprises-menu').style.display = 'block';
        document.getElementById('units-menu').style.display = 'block';
        document.getElementById('tenants-menu').style.display = 'block';
        document.getElementById('contracts-menu').style.display = 'block';
        document.getElementById('services-menu').style.display = 'block';
        document.getElementById('charges-menu').style.display = 'block';
        document.getElementById('expenses-menu').style.display = 'block';
        document.getElementById('partners-menu').style.display = 'block';
        document.getElementById('users-menu').style.display = 'block';
        loadDashboard();
    }
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        token = null;
        currentUser = {};
        document.getElementById('app-section').classList.remove('active');
        document.getElementById('app-section').classList.add('hidden');
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('login-section').classList.add('active');
    }
}

// ===== UTILITY FUNCTIONS =====
export function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (body) options.body = JSON.stringify(body);

    return fetch(`${API_BASE}${endpoint}`, options)
        .then(res => {
            // Log request details for debugging
            console.log(`[API] ${method} ${endpoint} → Status: ${res.status}`);
            
            // Check if response is ok
            if (!res.ok) {
                return res.json().then(data => {
                    const errorMsg = data.error || `HTTP ${res.status}: ${res.statusText}`;
                    console.error(`[API ERROR] ${method} ${endpoint}:`, errorMsg);
                    throw new Error(errorMsg);
                }).catch(err => {
                    // If response is not JSON, throw the status error
                    if (err instanceof SyntaxError) {
                        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    }
                    throw err;
                });
            }
            return res.json();
        })
        .catch(err => {
            console.error(`[API EXCEPTION] ${method} ${endpoint}:`, err);
            throw err;
        });
}

export function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
        setTimeout(() => errorEl.classList.remove('show'), 5000);
    }
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconMap = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${iconMap[type] || iconMap.info} toast-icon"></i>
        <div style="line-height: 1.5;">${String(message).replace(/\n/g, '<br>')}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function toastFromAlert(message) {
    const msg = String(message || '');
    const lower = msg.toLowerCase();
    let type = 'info';
    if (lower.startsWith('erro')) type = 'error';
    else if (lower.includes('sucesso')) type = 'success';
    else if (lower.includes('atencao') || lower.includes('atenção')) type = 'warning';
    showToast(msg, type);
}

window.alert = toastFromAlert;

export function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isActive = sidebar.classList.toggle('active');
    
    if (overlay) {
        if (isActive) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    
    // Controlar pointer-events apenas no mobile
    if (window.innerWidth <= 768) {
        sidebar.style.pointerEvents = isActive ? 'auto' : 'none';
    } else {
        sidebar.style.pointerEvents = 'auto';
    }
}

export function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Remove a classe active para animar o sidebar para fora
    sidebar.classList.remove('active');
    
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    // Desabilita pointer-events apenas no mobile (onde sidebar é overlay)
    if (window.innerWidth <= 768) {
        sidebar.style.pointerEvents = 'none';
    }
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

export function formatDate(dateString) {
    if (!dateString) return '-';
    // Fix timezone issue: parse YYYY-MM-DD as local date
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR');
}

export function openModal(content) {
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('active');
}

export function closeModal() {
    console.log('[APP] Closing modal');
    document.getElementById('modal').classList.remove('active');
    document.getElementById('modal').classList.add('hidden');
}


// ===== CLIENTS MANAGEMENT (Platform Admin Only) =====
async function loadClients() {
    updatePageTitle('Gerenciar Clientes');
    const comp = await App.loadComponent('clients');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList();
}

// ===== DASHBOARD =====
async function loadDashboard(selectedYear, selectedMonth) {
    updatePageTitle('Dashboard');
    const comp = await App.loadComponent('dashboard');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList(selectedYear, selectedMonth);
}

// ===== PROPERTIES =====
async function loadProperties() {
    const comp = await App.loadComponent('properties');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList();
}

// ===== CONTRACTS =====
async function loadContracts() {
    updatePageTitle('Contratos');
    const comp = await App.loadComponent('contracts');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList();
}

// ===== SERVICES =====
async function loadServices() {
    updatePageTitle('Servicos');
    const comp = await App.loadComponent('services');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList();
}

// ===== CHARGES =====
async function loadCharges() {
    updatePageTitle('Cobranças');
    const comp = await App.loadComponent('charges');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList();
}

// ===== EXPENSES =====
async function loadExpenses() {
    updatePageTitle('Despesas');
    const comp = await App.loadComponent('expenses');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList();
}

async function showPartnerShareManagement() {
    const comp = await App.loadComponent('partners');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList();
}

// Alias global para compatibilidade de navegação
function loadPartners() {
    return showPartnerShareManagement();
}

// ===== USERS =====
async function loadUsers() {
    updatePageTitle('Usuários do Sistema');
    const comp = await App.loadComponent('users');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList();
}

// ===== ENTERPRISES (EMPREENDIMENTOS) =====
async function loadEnterprises() {
    updatePageTitle('Empreendimentos');
    const comp = await App.loadComponent('enterprises');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList();
}

// ===== UNITS (UNIDADES) =====
async function loadUnits(enterpriseId = null) {
    updatePageTitle('Unidades');
    const comp = await App.loadComponent('units');
    if (!comp) return;
    if (!comp.contentContainer) comp.init();
    await comp.renderList(enterpriseId);
}

// ===== TENANTS (INQUILINOS) - Carregamento Dinâmico =====
async function loadTenants() {
    updatePageTitle('Inquilinos');
    
    const comp = await App.loadComponent('tenants');
    if (!comp) return;

    // 🔥 Garante inicialização do componente
    if (!comp.contentContainer) {
        comp.init();
    }

    await comp.renderList();
}

function showTenantForm(tenant = null) {
    const comp = App.get('tenants');
    if (comp) {
        comp.showForm(tenant);
    }
}

// ===== HELPER FUNCTIONS =====
export function updatePageTitle(title) {
    document.getElementById('page-title').textContent = title;
}

// ===== EVENT LISTENERS INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Setar ano do footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Auth links (removido signup)
    const toggleMenuBtn = document.getElementById('toggle-menu-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (toggleMenuBtn) {
        toggleMenuBtn.addEventListener('click', toggleSidebar);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    // Fechar sidebar ao clicar no overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Navigation menu items
    const navLinks = document.querySelectorAll('.nav-link[data-action]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const action = link.getAttribute('data-action');
            
            // Fechar sidebar ao clicar em um link
            closeSidebar();
            
            // Update active class
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Execute action
            switch(action) {
                case 'dashboard': loadDashboard(); break;
                case 'clients': loadClients(); break;
                case 'enterprises': loadEnterprises(); break;
                case 'units': loadUnits(); break;
                case 'tenants': loadTenants(); break;
                case 'properties': loadProperties(); break;
                case 'contracts': loadContracts(); break;
                case 'services': loadServices(); break;
                case 'charges': loadCharges(); break;
                case 'expenses': loadExpenses(); break;
                case 'partners': loadPartners(); break;
                case 'users': loadUsers(); break;
                case 'logout': logout(); break;
            }
        });
    });

    // Bottom Navigation menu items (Mobile)
    const bottomNavLinks = document.querySelectorAll('.bottom-nav-item[data-action]');
    bottomNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const action = link.getAttribute('data-action');
            
            // Update active class
            document.querySelectorAll('.bottom-nav-item').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Execute action
            switch(action) {
                case 'dashboard': loadDashboard(); break;
                case 'charges': loadCharges(); break;
                case 'tenants': loadTenants(); break;
                case 'units': loadUnits(); break;
                case 'expenses': loadExpenses(); break;
                case 'contracts': loadContracts(); break;
                case 'services': loadServices(); break;
                case 'enterprises': loadEnterprises(); break;
                case 'users': loadUsers(); break;
                case 'partners': loadPartners(); break;
            }
        });
    });

    // Delegated event handlers for dynamic content
    // Todas as ações de componentes são tratadas via data-component nos próprios componentes.
    // Aqui resta apenas view-enterprise (sem data-component no enterprises.js).
    document.getElementById('content').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        switch(action) {
            case 'view-enterprise': loadUnits(id); break;
        }
    });

    // Close modal when clicking cancel button
    document.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-modal-cancel')) {
            e.preventDefault();
            closeModal();
        }
    });

    // Check if user is already logged in
    if (token && currentUser.id) {
        showApp();
    }
});

// ===== INITIAL LOAD =====
if (token && currentUser.id) {
    showApp();
}

// ===== EXPORT FUNCTIONS TO GLOBAL SCOPE =====
// Apenas funções utilitárias globais — toda lógica de tela está em /components/
window.closeModal = closeModal;
window.openModal = openModal;
window.toggleSidebar = toggleSidebar;
