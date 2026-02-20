// ===== CONFIG =====
const API_BASE = '/api';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// ===== AUTH SECTION =====
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showApp();
    } catch (error) {
        showError('login-error', error.message);
    }
});

function showApp() {
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
    } else if (currentUser.role === 'client_admin') {
        // Client Admin - menu completo do cliente
        document.getElementById('dashboard-menu').style.display = 'block';
        document.getElementById('enterprises-menu').style.display = 'block';
        document.getElementById('units-menu').style.display = 'block';
        document.getElementById('tenants-menu').style.display = 'block';
        document.getElementById('contracts-menu').style.display = 'block';
        document.getElementById('services-menu').style.display = 'block';
        document.getElementById('charges-menu').style.display = 'block';
        document.getElementById('partners-menu').style.display = 'block';
        document.getElementById('users-menu').style.display = 'block';
        loadDashboard();
    } else if (currentUser.role === 'client_member') {
        // Client Member (Sócio) - menu limitado
        document.getElementById('dashboard-menu').style.display = 'block';
        document.getElementById('enterprises-menu').style.display = 'block';
        document.getElementById('units-menu').style.display = 'block';
        document.getElementById('tenants-menu').style.display = 'block';
        document.getElementById('contracts-menu').style.display = 'block';
        document.getElementById('services-menu').style.display = 'block';
        document.getElementById('charges-menu').style.display = 'block';
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
function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (body) options.body = JSON.stringify(body);

    return fetch(`${API_BASE}${endpoint}`, options).then(res => res.json());
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
        setTimeout(() => errorEl.classList.remove('show'), 5000);
    }
}

function showToast(message, type = 'info') {
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
        <div>${String(message).replace(/\n/g, '<br>')}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
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

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    // Fix timezone issue: parse YYYY-MM-DD as local date
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR');
}

function openModal(content) {
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('active');
    
    // Add listeners for cancel buttons in modal
    const modalCancelBtns = document.querySelectorAll('#modal-body button[type="button"].btn-secondary');
    modalCancelBtns.forEach(btn => {
        btn.addEventListener('click', () => closeModal());
    });
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.getElementById('modal').classList.add('hidden');
}

// ===== CLIENTS MANAGEMENT (Platform Admin Only) =====
async function loadClients() {
    updatePageTitle('Gerenciar Clientes');

    try {
        const clients = await apiCall('/admin/clients');

        let html = '<div class="card"><div class="card-header"><h2>Clientes Ativos</h2>';
        html += '<button class="btn btn-primary btn-small" data-action="add-client">+ Novo Cliente</button></div>';
        html += '<div class="card-body">';

        if (clients.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhum cliente cadastrado</p>';
        } else {
            html += `<table class="table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Criado em</th>
                        <th>Usuários</th>
                        <th>Propriedades</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>`;
            clients.forEach(c => {
                const created = new Date(c.created_at).toLocaleDateString('pt-BR');
                html += `<tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${created}</td>
                    <td>${c.users_count}</td>
                    <td>${c.properties_count}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" data-action="view-client" data-id="${c.id}">Ver</button>
                        <button class="btn btn-small btn-secondary" data-action="edit-client" data-id="${c.id}">Editar</button>
                        <button class="btn btn-small btn-danger" data-action="delete-client" data-id="${c.id}">Deletar</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

function showCreateClientForm() {
    const form = `<h2>Criar Novo Cliente</h2>
        <form id="create-client-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Nome da Empresa *</label>
                    <input type="text" id="client-name" placeholder="Ex: João Imóveis" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Nome do Admin *</label>
                    <input type="text" id="admin-name" placeholder="Ex: João Silva" required>
                </div>
                <div class="form-group">
                    <label>Email do Admin *</label>
                    <input type="email" id="admin-email" placeholder="joao@exemplo.com" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Senha do Admin *</label>
                    <input type="password" id="admin-password" placeholder="Mínimo 6 caracteres" required>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary">Criar Cliente</button>
            </div>
        </form>`;

    openModal(form);

    document.getElementById('create-client-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/admin/clients`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    clientName: document.getElementById('client-name').value,
                    adminName: document.getElementById('admin-name').value,
                    adminEmail: document.getElementById('admin-email').value,
                    adminPassword: document.getElementById('admin-password').value
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert(`Cliente criado com sucesso!\n\nEmail: ${data.account.adminEmail}\nSenha: (informada)`);
            closeModal();
            loadClients();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// Ver detalhes do cliente
async function viewClient(id) {
    try {
        const client = await apiCall(`/admin/clients/${id}`);
        
        // Buscar usuários do cliente
        let usersHtml = '<p>Carregando usuários...</p>';
        try {
            const users = await apiCall(`/admin/clients/${id}/users`);
            if (users.length === 0) {
                usersHtml = '<p style="color: var(--text-secondary);">Nenhum usuário cadastrado</p>';
            } else {
                usersHtml = '<table class="table" style="margin-top: 10px;"><thead><tr><th>Nome</th><th>Email</th><th>Tipo</th><th>Ações</th></tr></thead><tbody>';
                users.forEach(u => {
                    const roleLabel = u.role === 'client_admin' ? 'Admin' : 'Membro';
                    usersHtml += `<tr>
                        <td>${u.name}</td>
                        <td>${u.email}</td>
                        <td><span class="badge badge-${u.role === 'client_admin' ? 'active' : 'pending'}">${roleLabel}</span></td>
                        <td>
                            <button class="btn btn-small btn-primary" onclick="showEditUserForm(${u.id}, '${u.name}', '${u.email}', ${id})">Editar</button>
                            <button class="btn btn-small btn-secondary" onclick="resetUserPassword(${u.id}, '${u.email}')">Senha</button>
                        </td>
                    </tr>`;
                });
                usersHtml += '</tbody></table>';
            }
        } catch (e) {
            usersHtml = '<p style="color: red;">Erro ao carregar usuários</p>';
        }
        
        const html = `<h2>Detalhes do Cliente</h2>
            <div style="margin-bottom: 20px;">
                <p><strong>Nome:</strong> ${client.name}</p>
                <p><strong>Criado em:</strong> ${formatDate(client.created_at)}</p>
                <hr style="margin: 15px 0;">
                <p><strong>Empreendimentos:</strong> ${client.enterprises_count || 0}</p>
                <p><strong>Unidades:</strong> ${client.units_count || 0}</p>
                <p><strong>Contratos Ativos:</strong> ${client.contracts_count}</p>
                <p><strong>Receita Total:</strong> ${formatCurrency(client.total_revenue || 0)}</p>
            </div>
            <hr>
            <h3>Usuários do Cliente (${client.users_count})</h3>
            ${usersHtml}
            <button class="btn btn-small btn-primary" style="margin-top: 10px;" onclick="showAddClientUserForm(${id})">+ Novo Usuário</button>
            <hr style="margin-top: 20px;">
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" data-modal-cancel>Fechar</button>
                <button type="button" class="btn btn-primary" onclick="editClient(${id})">Editar Nome</button>
            </div>`;
        
        openModal(html);
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// Servicos recorrentes do contrato
async function showContractServices(contractId) {
    try {
        const [contract, services, contractServices] = await Promise.all([
            apiCall(`/contracts/${contractId}`),
            apiCall('/services'),
            apiCall(`/contracts/${contractId}/services`)
        ]);

        let listHtml = '<p style="color: var(--text-secondary);">Nenhum servico ativo</p>';
        if (contractServices.length > 0) {
            listHtml = '<table class="table"><thead><tr><th>Servico</th><th>Valor</th><th>Inicio</th><th>Status</th><th>Acoes</th></tr></thead><tbody>';
            contractServices.forEach(cs => {
                const valor = cs.price !== null ? cs.price : cs.default_price;
                const statusLabel = cs.status === 'active' ? 'Ativo' : 'Inativo';
                const cancelBtn = cs.status === 'active'
                    ? `<button class="btn btn-small btn-secondary" onclick="cancelContractService(${contractId}, ${cs.id})">Remover</button>`
                    : '-';
                listHtml += `<tr>
                    <td>${cs.service_name}</td>
                    <td>${formatCurrency(valor)}</td>
                    <td>${formatDate(cs.start_date)}</td>
                    <td>${statusLabel}</td>
                    <td>${cancelBtn}</td>
                </tr>`;
            });
            listHtml += '</tbody></table>';
        }

        let serviceOptions = '<option value="">Selecione...</option>';
        services.filter(s => s.status === 'active').forEach(s => {
            serviceOptions += `<option value="${s.id}" data-price="${s.default_price}">${s.name} (${formatCurrency(s.default_price)})</option>`;
        });

        const form = `
            <h2>Servicos - ${contract.location_name || contract.property_address}</h2>
            <p><strong>Inquilino:</strong> ${contract.tenant_name}</p>
            <hr>
            <h3 style="margin-top: 0;">Servicos Ativos</h3>
            ${listHtml}
            <hr>
            <h3>Adicionar Servico</h3>
            <form id="contract-service-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Servico *</label>
                        <select id="cs-service" required>
                            ${serviceOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Valor</label>
                        <input type="number" id="cs-price" step="0.01" placeholder="Deixe vazio para usar o padrao">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Comeca em</label>
                        <input type="date" id="cs-start-date" value="${new Date().toISOString().slice(0, 10)}">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Fechar</button>
                    <button type="submit" class="btn btn-primary">Adicionar</button>
                </div>
            </form>
        `;

        openModal(form);

        const serviceSelect = document.getElementById('cs-service');
        serviceSelect.addEventListener('change', () => {
            const price = serviceSelect.options[serviceSelect.selectedIndex]?.getAttribute('data-price');
            if (price) {
                document.getElementById('cs-price').value = price;
            }
        });

        document.getElementById('contract-service-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const serviceId = parseInt(document.getElementById('cs-service').value);
                const priceValue = document.getElementById('cs-price').value;
                const startDate = document.getElementById('cs-start-date').value;

                await apiCall(`/contracts/${contractId}/services`, 'POST', {
                    serviceId,
                    price: priceValue ? parseFloat(priceValue) : undefined,
                    startDate
                });
                showContractServices(contractId);
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

async function cancelContractService(contractId, contractServiceId) {
    try {
        await apiCall(`/contracts/${contractId}/services/${contractServiceId}`, 'PUT');
        showContractServices(contractId);
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// Resetar senha de usuário do cliente
async function resetUserPassword(userId, email) {
    const newPassword = prompt(`Nova senha para ${email}:\n(mínimo 6 caracteres)`);
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        alert('Senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    try {
        await apiCall(`/admin/users/${userId}/reset-password`, 'POST', { newPassword });
        alert(`Senha alterada com sucesso!\n\nEmail: ${email}\nNova senha: ${newPassword}`);
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// Editar nome/email de usuário do cliente
function showEditUserForm(userId, currentName, currentEmail, clientId) {
    const form = `<h2>Editar Usuário</h2>
        <form id="edit-user-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="edit-user-name" value="${currentName}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" id="edit-user-email" value="${currentEmail}" required>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="viewClient(${clientId})">Voltar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>`;
    
    openModal(form);
    
    document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall(`/admin/users/${userId}`, 'PUT', {
                name: document.getElementById('edit-user-name').value,
                email: document.getElementById('edit-user-email').value
            });
            
            alert('Usuário atualizado com sucesso!');
            viewClient(clientId);
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// Adicionar usuário ao cliente
function showAddClientUserForm(clientId) {
    const form = `<h2>Novo Usuário do Cliente</h2>
        <form id="add-client-user-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="new-user-name" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" id="new-user-email" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Senha *</label>
                    <input type="password" id="new-user-password" placeholder="Mínimo 6 caracteres" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tipo *</label>
                    <select id="new-user-role" required>
                        <option value="client_member">Membro (apenas visualiza)</option>
                        <option value="client_admin">Admin (gerencia tudo)</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="viewClient(${clientId})">Voltar</button>
                <button type="submit" class="btn btn-primary">Criar Usuário</button>
            </div>
        </form>`;
    
    openModal(form);
    
    document.getElementById('add-client-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall(`/admin/clients/${clientId}/users`, 'POST', {
                name: document.getElementById('new-user-name').value,
                email: document.getElementById('new-user-email').value,
                password: document.getElementById('new-user-password').value,
                role: document.getElementById('new-user-role').value
            });
            
            alert('Usuário criado com sucesso!');
            viewClient(clientId);
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// Editar cliente
async function editClient(id) {
    try {
        const client = await apiCall(`/admin/clients/${id}`);
        
        const form = `<h2>Editar Cliente</h2>
            <form id="edit-client-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome da Empresa *</label>
                        <input type="text" id="edit-client-name" value="${client.name}" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </div>
            </form>`;
        
        openModal(form);
        
        document.getElementById('edit-client-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await apiCall(`/admin/clients/${id}`, 'PUT', {
                    name: document.getElementById('edit-client-name').value
                });
                
                alert('Cliente atualizado com sucesso!');
                closeModal();
                loadClients();
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// ===== DASHBOARD =====
async function loadDashboard(selectedYear, selectedMonth) {
    updatePageTitle('Dashboard');
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const year = selectedYear || currentYear;
        const month = selectedMonth || currentMonth;
        const stats = await apiCall(`/financial/summary?year=${year}&month=${month}`);

        const inadimplenciaMesLabel = stats.inadimplencia_mes_pct === null
            ? 'Indefinida'
            : `${stats.inadimplencia_mes_pct.toFixed(2)}%`;

        const unidadeAdimplenteLabel = `${(stats.unidades_adimplentes_pct || 0).toFixed(2)}%`;

        const years = [];
        for (let y = currentYear - 2; y <= currentYear + 1; y += 1) {
            years.push(y);
        }

        let yearOptions = '';
        const periodYear = stats.period && stats.period.year ? stats.period.year : year;
        const periodMonth = stats.period && stats.period.month ? stats.period.month : month;

        years.forEach(y => {
            const selected = y === periodYear ? 'selected' : '';
            yearOptions += `<option value="${y}" ${selected}>${y}</option>`;
        });

        let monthOptions = '';
        for (let m = 1; m <= 12; m += 1) {
            const selected = m === periodMonth ? 'selected' : '';
            monthOptions += `<option value="${m}" ${selected}>${String(m).padStart(2, '0')}</option>`;
        }

        let html = '<p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">Visao financeira do mes selecionado.</p>';

        html += `
            <div class="dashboard-kpis">
                <div class="kpi-row">
                    <div class="kpi-card">
                        <div class="kpi-label">Faturamento do mes</div>
                        <div class="kpi-value">${formatCurrency(stats.faturamento_mes)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Recebido no mes</div>
                        <div class="kpi-value">${formatCurrency(stats.recebido_mes)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Despesas do mes</div>
                        <div class="kpi-value">${formatCurrency(stats.despesas_mes)}</div>
                    </div>
                </div>
                <div class="kpi-row">
                    <div class="kpi-card">
                        <div class="kpi-label">Resultado operacional</div>
                        <div class="kpi-value">${formatCurrency(stats.resultado_operacional)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Resultado de caixa</div>
                        <div class="kpi-value">${formatCurrency(stats.resultado_caixa)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Inadimplencia do mes</div>
                        <div class="kpi-value">${inadimplenciaMesLabel}</div>
                        <div class="kpi-subtext">Acumulada: ${formatCurrency(stats.inadimplencia_acumulada)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Unidades adimplentes</div>
                        <div class="kpi-value">${unidadeAdimplenteLabel}</div>
                        <div class="kpi-subtext">${stats.unidades_adimplentes.adimplentes}/${stats.unidades_adimplentes.total}</div>
                    </div>
                </div>
            </div>
        `;

        const receitaSeries = stats.receita_liquida_mensal || [];
        const maxReceita = Math.max(1, ...receitaSeries.map(s => Math.abs(s.value)));

        let receitaBars = '';
        receitaSeries.forEach(s => {
            const height = Math.round((Math.abs(s.value) / maxReceita) * 100);
            const signClass = s.value < 0 ? 'bar-negative' : 'bar-positive';
            receitaBars += `
                <div class="chart-bar">
                    <div class="bar ${signClass}" style="height: ${height}%"></div>
                    <div class="bar-label">${String(s.month).padStart(2, '0')}</div>
                </div>
            `;
        });

        html += `
            <div class="card">
                <div class="card-header card-header-flex">
                    <h2>Evolucao do negocio</h2>
                    <div class="dashboard-filters">
                        <label>Ano
                            <select id="dash-year">${yearOptions}</select>
                        </label>
                        <label>Mes
                            <select id="dash-month">${monthOptions}</select>
                        </label>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart" data-chart="receita">
                        ${receitaBars}
                    </div>
                </div>
            </div>
        `;

        const despesasSeries = stats.despesas_mensal || [];
        const maxDespesas = Math.max(1, ...despesasSeries.map(s => s.value));

        let despesasBars = '';
        despesasSeries.forEach(s => {
            const height = Math.round((s.value / maxDespesas) * 100);
            despesasBars += `
                <div class="chart-bar">
                    <div class="bar bar-neutral" style="height: ${height}%"></div>
                    <div class="bar-label">${String(s.month).padStart(2, '0')}</div>
                </div>
            `;
        });

        html += `
            <div class="card">
                <div class="card-header">
                    <h2>Despesas do ano</h2>
                </div>
                <div class="card-body">
                    <div class="chart" data-chart="despesas">
                        ${despesasBars}
                    </div>
                </div>
            </div>
        `;

        let riscoRows = '';
        (stats.risco_inquilinos || []).forEach(r => {
            riscoRows += `
                <tr>
                    <td>${r.tenant_name}</td>
                    <td style="text-align: right;">${formatCurrency(r.contract_value)}</td>
                    <td style="text-align: right;">${formatCurrency(r.overdue_value)}</td>
                    <td style="text-align: right;">${r.days_overdue}</td>
                    <td style="text-align: right;">${r.impact_pct.toFixed(2)}%</td>
                </tr>
            `;
        });

        html += `
            <div class="card">
                <div class="card-header">
                    <h2>Risco financeiro por inquilino</h2>
                </div>
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Inquilino</th>
                                <th style="text-align: right;">Valor do contrato</th>
                                <th style="text-align: right;">Valor vencido</th>
                                <th style="text-align: right;">Dias em atraso</th>
                                <th style="text-align: right;">Impacto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${riscoRows || '<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">Sem dados no periodo</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('content').innerHTML = html;

        const yearSelect = document.getElementById('dash-year');
        const monthSelect = document.getElementById('dash-month');
        const reload = async () => {
            const y = parseInt(yearSelect.value, 10);
            const m = parseInt(monthSelect.value, 10);
            await loadDashboard(y, m);
        };
        yearSelect.addEventListener('change', reload);
        monthSelect.addEventListener('change', reload);
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

// ===== PROPERTIES =====
async function loadProperties() {
    updatePageTitle('Propriedades');

    try {
        const properties = await apiCall('/properties');

        let html = '<div class="card"><div class="card-header"><h2>Minhas Propriedades</h2>';
        html += '<button class="btn btn-primary btn-small" data-action="add-property">+ Nova Propriedade</button></div>';
        html += '<div class="card-body">';

        if (properties.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhuma propriedade cadastrada</p>';
        } else {
            html += '<table class="table"><thead><tr><th>Endereço</th><th>Descrição</th><th>Ações</th></tr></thead><tbody>';
            properties.forEach(p => {
                html += `<tr><td>${p.address}</td><td>${p.description || '-'}</td><td>
                    <button class="btn btn-small btn-secondary" data-action="edit-property" data-id="${p.id}">Editar</button>
                </td></tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

function showPropertyForm() {
    const form = `<h2>Nova Propriedade</h2>
        <form id="property-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Endereço *</label>
                    <input type="text" id="prop-address" required>
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <input type="text" id="prop-description">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>`;
    openModal(form);

    document.getElementById('property-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/properties', 'POST', {
                address: document.getElementById('prop-address').value,
                description: document.getElementById('prop-description').value
            });
            closeModal();
            loadProperties();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// ===== CONTRACTS =====
async function loadContracts() {
    updatePageTitle('Meus Contratos');

    try {
        const contracts = await apiCall('/contracts');

        let html = '<div class="card"><div class="card-header"><h2>Meus Contratos</h2><small style="color: var(--text-secondary); font-weight: normal;">Os aluguéis. Veja quanto tempo cada um mora, o valor e quando é hora de reajustar o preço.</small>';
        html += '<button class="btn btn-primary btn-small" onclick="showContractForm()">+ Novo Contrato</button></div>';
        html += '<div class="card-body">';

        if (contracts.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhum contrato</p>';
        } else {
            html += `<table class="table">
                <thead>
                    <tr>
                        <th>Local</th>
                        <th>Inquilino</th>
                        <th>Valor</th>
                        <th>Permanência</th>
                        <th>Início - Fim</th>
                        <th style="text-align: center;">Ações</th>
                    </tr>
                </thead>
                <tbody>`;
            
            contracts.forEach(c => {
                const location = c.location_name || c.property_address || '-';
                const inicio = new Date(c.start_date);
                const agora = new Date();
                
                // Calcular tempo de permanência
                let permanencia = '';
                let anos = Math.floor((agora - inicio) / (365.25 * 24 * 60 * 60 * 1000));
                let meses = Math.floor(((agora - inicio) % (365.25 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000));
                
                if (anos > 0) {
                    permanencia = `${anos} ano${anos > 1 ? 's' : ''} ${meses}m`;
                } else if (meses > 0) {
                    permanencia = `${meses} mês${meses > 1 ? 'es' : ''}`;
                } else {
                    permanencia = 'Novo';
                }
                
                // Indicador de reajuste necessário (> 1 ano)
                let alertaReajuste = '';
                if (anos > 0) {
                    alertaReajuste = ' <span style="color: var(--danger-color); font-weight: bold; margin-left: 8px;"><i class="fa-solid fa-rotate"></i> Reajuste</span>';
                }
                
                // Indicador visual de vigência - contratos vencidos viram indeterminados
                let vigencia = '<span style="color: var(--success-color);"><i class="fa-solid fa-circle-check"></i> Vigente</span>';
                if (!c.end_date) {
                    vigencia = '<span style="color: var(--success-color);"><i class="fa-solid fa-infinity"></i> Indeterminado</span>';
                } else {
                    const fim = new Date(c.end_date);
                    const diasAte = Math.floor((fim - agora) / (24 * 60 * 60 * 1000));
                    if (diasAte < 0) {
                        // Contrato vencido → virou indeterminado por cláusula
                        vigencia = '<span style="color: var(--success-color);"><i class="fa-solid fa-infinity"></i> Indeterminado</span>';
                    } else if (diasAte < 90) {
                        vigencia = `<span style="color: var(--warning-color);"><i class="fa-regular fa-clock"></i> ${diasAte} dias</span>`;
                    }
                }
                
                html += `<tr>
                    <td><strong>${location}</strong></td>
                    <td>${c.tenant_name}</td>
                    <td>${formatCurrency(c.rent_amount)}</td>
                    <td>${permanencia}${alertaReajuste}</td>
                    <td>
                        ${formatDate(c.start_date)} até ${c.end_date ? formatDate(c.end_date) : '—'}
                        <br><small>${vigencia}</small>
                    </td>
                    <td style="text-align: center;">
                        <button class="btn btn-small btn-secondary" onclick="showEditContractForm(${c.id})"><i class="fa-solid fa-pen"></i> Editar</button>
                        <button class="btn btn-small btn-secondary" onclick="showContractServices(${c.id})">Servicos</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

async function showContractForm() {
    const units = await apiCall('/units');
    const tenants = await apiCall('/tenants');

    // Filtrar apenas unidades vagas
    const availableUnits = units.filter(u => u.unit_status === 'vacant');

    let form = `<h2>Novo Contrato</h2>
        <form id="contract-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Unidade *</label>
                    <select id="unit-id" required>
                        <option value="">Selecione...</option>`;
    availableUnits.forEach(u => {
        form += `<option value="${u.id}">${u.enterprise_name} - ${u.identifier}</option>`;
    });
    if (availableUnits.length === 0) {
        form += `<option value="" disabled>Nenhuma unidade disponível</option>`;
    }
    form += `</select>
                </div>
                <div class="form-group">
                    <label>Inquilino *</label>
                    <select id="tenant-id" required>
                        <option value="">Selecione...</option>`;
    tenants.forEach(t => {
        form += `<option value="${t.id}">${t.name}</option>`;
    });
    form += `</select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Data Inicial *</label>
                    <input type="date" id="start-date" required>
                </div>
                <div class="form-group">
                    <label>Data Final</label>
                    <input type="date" id="end-date">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Valor do Aluguel *</label>
                    <input type="number" id="rent-amount" step="0.01" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Endereco do contrato</label>
                    <input type="text" id="contract-address" placeholder="Ex: Rua X, 123 - Apto 45">
                </div>
                <div class="form-group">
                    <label>Link do contrato (PDF)</label>
                    <input type="url" id="contract-url" placeholder="https://...">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                <button type="submit" class="btn btn-primary">Criar Contrato</button>
            </div>
        </form>`;

    openModal(form);

    document.getElementById('contract-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/contracts', 'POST', {
                unitId: parseInt(document.getElementById('unit-id').value),
                tenantId: parseInt(document.getElementById('tenant-id').value),
                startDate: document.getElementById('start-date').value,
                endDate: document.getElementById('end-date').value,
                rentAmount: parseFloat(document.getElementById('rent-amount').value),
                contractAddress: document.getElementById('contract-address').value,
                contractUrl: document.getElementById('contract-url').value
            });
            closeModal();
            loadContracts();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// Editar/Renovar Contrato
async function showEditContractForm(contractId) {
    try {
        const contract = await apiCall(`/contracts/${contractId}`);
        
        const hoje = new Date();
        const fim = contract.end_date ? new Date(contract.end_date) : null;
        let statusContrato = 'Vigente';
        let botaoRenovar = '';
        
        if (!fim) {
            statusContrato = '<i class="fa-solid fa-infinity"></i> Vigente por prazo indeterminado';
        } else if (fim < hoje) {
            // Contrato vencido → virou indeterminado
            statusContrato = '<i class="fa-solid fa-infinity"></i> Vigente por prazo indeterminado (convertido automaticamente)';
        } else {
            const diasAte = Math.floor((fim - hoje) / (24 * 60 * 60 * 1000));
            if (diasAte < 90) {
                statusContrato = `<i class="fa-regular fa-clock"></i> Vence em ${diasAte} dias`;
            }
        }
        
        const contractAddress = contract.contract_address ? contract.contract_address : 'Nao informado';
        const contractLink = contract.contract_url
            ? `<a href="${contract.contract_url}" target="_blank" rel="noopener">Abrir contrato (PDF)</a>`
            : 'Nao informado';

        let form = `<h2>Contrato: ${contract.location_name || contract.property_address}</h2>
            <p><strong>Inquilino:</strong> ${contract.tenant_name}</p>
            <p><strong>Endereco do contrato:</strong> ${contractAddress}</p>
            <p><strong>Link do contrato:</strong> ${contractLink}</p>
            <p><strong>Status:</strong> ${statusContrato}</p>
            <hr>
            <form id="edit-contract-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Data Inicial</label>
                        <input type="date" id="edit-start-date" value="${contract.start_date}" readonly style="background-color: var(--gray-100);">
                    </div>
                    <div class="form-group">
                        <label>Data Final</label>
                        <input type="date" id="edit-end-date" value="${contract.end_date || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Valor do Aluguel</label>
                        <input type="number" id="edit-rent-amount" step="0.01" value="${contract.rent_amount}">
                    </div>
                    <div class="form-group">
                        <label>Dia do Vencimento (1-31)</label>
                        <input type="number" id="edit-due-day" min="1" max="31" value="${contract.due_day || 10}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Juros Diário (%) - padrão 0.0333 (≈1% mês)</label>
                        <input type="number" id="edit-late-fee" step="0.0001" value="${contract.late_fee_daily || 0.0333}">
                    </div>
                    <div class="form-group">
                        <label>Multa por Atraso (%) - padrão 2%</label>
                        <input type="number" id="edit-late-fee-percent" step="0.01" value="${contract.late_fee_percent || 2}">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    ${botaoRenovar}
                    <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                </div>
            </form>`;
        
        openModal(form);
        
        document.getElementById('edit-contract-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            // TODO: Implementar endpoint de atualização
            alert('Funcionalidade de edição será implementada em breve');
            closeModal();
        });
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// Renovar Contrato por 1 ano
async function renovarContrato(contractId) {
    const confirmacao = confirm('Renovar contrato por 1 ano?');
    if (!confirmacao) return;
    
    try {
        const contract = await apiCall(`/contracts/${contractId}`);
        const dataFim = new Date();
        dataFim.setFullYear(dataFim.getFullYear() + 1);
        const novaDataFim = dataFim.toISOString().split('T')[0];
        
        // TODO: Implementar endpoint de renovação
        alert(`Contrato renovado até ${novaDataFim}\n\nFuncionalidade será implementada em breve`);
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// ===== SERVICES =====
async function loadServices() {
    updatePageTitle('Servicos');

    try {
        const services = await apiCall('/services');

        let html = '<div class="card"><div class="card-header"><h2>Servicos</h2>';
        html += '<small style="color: var(--text-secondary); font-weight: normal;">Cadastre servicos extras como garagem e internet. Depois voce escolhe em qual inquilino usar.</small>';
        html += '<button class="btn btn-primary btn-small" onclick="showCreateServiceForm()">+ Novo Servico</button></div>';
        html += '<div class="card-body">';

        if (services.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhum servico cadastrado</p>';
        } else {
            html += '<table class="table"><thead><tr><th>Ícone</th><th>Nome</th><th>Valor</th><th>Status</th><th>Acoes</th></tr></thead><tbody>';
            services.forEach(s => {
                const statusLabel = s.status === 'active' ? 'Ativo' : 'Inativo';
                const actionLabel = s.status === 'active' ? 'Desativar' : 'Ativar';
                const nextStatus = s.status === 'active' ? 'inactive' : 'active';
                const icon = s.icon || 'fa-solid fa-circle-check';
                html += `<tr>
                    <td><i class="${icon}" style="font-size: 1.2em; color: var(--primary-color);"></i></td>
                    <td>${s.name}</td>
                    <td>${formatCurrency(s.default_price)}</td>
                    <td>${statusLabel}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="updateServiceStatus(${s.id}, '${nextStatus}')">${actionLabel}</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

function showCreateServiceForm() {
    const iconOptions = [
        { value: 'fa-solid fa-wifi', label: 'Wi-Fi / Internet', icon: 'fa-solid fa-wifi' },
        { value: 'fa-solid fa-motorcycle', label: 'Garagem / Moto', icon: 'fa-solid fa-motorcycle' },
        { value: 'fa-solid fa-car', label: 'Garagem / Carro', icon: 'fa-solid fa-car' },
        { value: 'fa-solid fa-water', label: 'Água', icon: 'fa-solid fa-water' },
        { value: 'fa-solid fa-lightbulb', label: 'Energia', icon: 'fa-solid fa-lightbulb' },
        { value: 'fa-solid fa-fire', label: 'Gás', icon: 'fa-solid fa-fire' },
        { value: 'fa-solid fa-building', label: 'Condomínio', icon: 'fa-solid fa-building' },
        { value: 'fa-solid fa-broom', label: 'Limpeza', icon: 'fa-solid fa-broom' },
        { value: 'fa-solid fa-shield-halved', label: 'Seguro', icon: 'fa-solid fa-shield-halved' },
        { value: 'fa-solid fa-tv', label: 'TV / Streaming', icon: 'fa-solid fa-tv' },
        { value: 'fa-solid fa-circle-check', label: 'Padrão', icon: 'fa-solid fa-circle-check' }
    ];

    let iconOptionsHtml = '';
    iconOptions.forEach(opt => {
        iconOptionsHtml += `<option value="${opt.value}">${opt.label}</option>`;
    });

    const form = `<h2>Novo Servico</h2>
        <form id="service-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="service-name" placeholder="Ex: Internet Fibra" required>
                </div>
                <div class="form-group">
                    <label>Valor *</label>
                    <input type="number" id="service-price" step="0.01" placeholder="Ex: 100.00" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Ícone *</label>
                    <select id="service-icon" required>
                        ${iconOptionsHtml}
                    </select>
                    <div style="margin-top: 8px;">
                        <i id="icon-preview" class="fa-solid fa-circle-check" style="font-size: 2em; color: var(--primary-color);"></i>
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>`;

    openModal(form);

    // Icon preview
    document.getElementById('service-icon').addEventListener('change', (e) => {
        const preview = document.getElementById('icon-preview');
        preview.className = e.target.value;
    });

    document.getElementById('service-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/services', 'POST', {
                name: document.getElementById('service-name').value,
                icon: document.getElementById('service-icon').value,
                defaultPrice: parseFloat(document.getElementById('service-price').value)
            });
            closeModal();
            loadServices();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

async function updateServiceStatus(id, status) {
    try {
        await apiCall(`/services/${id}`, 'PUT', { status });
        loadServices();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// ===== CHARGES =====
async function loadCharges() {
    updatePageTitle('Cobranças');

    try {
        const charges = await apiCall('/charges');

        let html = '<div class="card"><div class="card-header"><h2>Cobranças do Mês</h2><small style="color: var(--text-secondary); font-weight: normal;">As faturas do mês. Marque quem pagou, quem está atrasado e veja o vencimento de cada um.</small>';
        html += '<button class="btn btn-primary btn-small" onclick="showChargeForm()">+ Gerar Cobrança</button></div>';
        html += '<div class="card-body">';

        if (charges.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhuma cobrança</p>';
        } else {
            // Wrap table in scrollable container if more than 20 charges
            const needsScroll = charges.length > 20;
            if (needsScroll) {
                html += '<div style="max-height: 600px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">';
            }
            html += `<table class="table">
                <thead>
                    <tr>
                        <th>Unidade</th>
                        <th>Inquilino</th>
                        <th>Valor</th>
                        <th>Serviços</th>
                        <th>Vencimento</th>
                        <th>Atraso</th>
                        <th>Juros</th>
                        <th>Total c/ Juros</th>
                        <th style="text-align: center;">Pago?</th>
                        <th style="text-align: center;">Ações</th>
                    </tr>
                </thead>
                <tbody>`;
            
            charges.forEach(c => {
                const diasAtraso = parseInt(c.dias_atraso) || 0;
                const juros = parseFloat(c.juros) || 0;
                const valorComJuros = parseFloat(c.valor_com_juros) || parseFloat(c.total_amount);
                const isPaid = c.status === 'paid';
                const isOverdue = c.status === 'overdue' || diasAtraso > 0;
                
                // Classe da linha: pisca se atrasado
                const rowClass = isOverdue && !isPaid ? 'row-overdue' : '';
                
                // Coluna de serviços adicionais
                let servicosHtml = '-';
                if (c.services && c.services.length > 0) {
                    const icons = [];
                    c.services.forEach(s => {
                        if (s && s.icon) {
                            icons.push(`<i class="${s.icon} service-icon"></i>`);
                        }
                    });
                    if (icons.length > 0) {
                        servicosHtml = `<span title="${c.services.map(s => `${s.description}: +${formatCurrency(s.amount)}`).join(', ')}">${icons.join(' ')}</span>`;
                    }
                }
                
                // Coluna de atraso
                let atrasoHtml = '-';
                if (diasAtraso > 0 && !isPaid) {
                    atrasoHtml = `<span class="badge badge-overdue">${diasAtraso} dias</span>`;
                }
                
                // Coluna de juros
                let jurosHtml = '-';
                if (juros > 0 && !isPaid) {
                    jurosHtml = `<span style="color: var(--danger);">+${formatCurrency(juros)}</span>`;
                }
                
                // Coluna total com juros
                let totalHtml = formatCurrency(c.total_amount);
                if (juros > 0 && !isPaid) {
                    totalHtml = `<strong style="color: var(--danger);">${formatCurrency(valorComJuros)}</strong>`;
                }
                
                // Botão de pago (checkbox visual)
                let pagoHtml = '';
                if (isPaid) {
                    pagoHtml = `<span class="check-paid" title="Pago"><i class="fa-solid fa-check"></i></span>`;
                } else {
                    pagoHtml = `<button class="btn-check" onclick="quickPay(${c.id})" title="Marcar como pago (1 clique)"><i class="fa-regular fa-square"></i></button>`;
                }
                
                const acoesHtml = isPaid
                    ? '-'
                    : `<button class="btn btn-small btn-secondary" onclick="showAdjustChargeForm(${c.id})">Ajustar</button>
                       <button class="btn btn-small btn-danger" onclick="voidCharge(${c.id})">Excluir</button>`;

                html += `<tr class="${rowClass}">
                    <td>${c.property_address || 'N/A'}</td>
                    <td>${c.tenant_name}</td>
                    <td>${formatCurrency(c.total_amount)}</td>
                    <td>${servicosHtml}</td>
                    <td>${formatDate(c.due_date)}</td>
                    <td>${atrasoHtml}</td>
                    <td>${jurosHtml}</td>
                    <td>${totalHtml}</td>
                    <td style="text-align: center;">${pagoHtml}</td>
                    <td style="text-align: center;">${acoesHtml}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            
            // Close scroll wrapper if needed
            if (charges.length > 20) {
                html += '</div>';
            }
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

// Baixa rápida - 1 clique
async function quickPay(chargeId) {
    try {
        const result = await apiCall(`/charges/${chargeId}/quick-pay`, 'POST');
        
        // Feedback visual
        if (result.juros > 0) {
            alert(`Pagamento registrado!\\n\\nValor original: ${formatCurrency(result.valorOriginal)}\\nDias de atraso: ${result.diasAtraso}\\nJuros: ${formatCurrency(result.juros)}\\nTotal pago: ${formatCurrency(result.valorPago)}`);
        }
        
        loadCharges(); // Recarregar lista
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

async function voidCharge(chargeId) {
    const confirmed = confirm('Deseja excluir esta cobrança?');
    if (!confirmed) return;

    try {
        await apiCall(`/charges/${chargeId}/void`, 'PUT');
        showToast('Cobrança excluída com sucesso', 'success');
        loadCharges();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

function showAdjustChargeForm(chargeId) {
    const form = `<h2>Ajustar Cobrança</h2>
        <form id="adjust-charge-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Descricao *</label>
                    <input type="text" id="adjust-desc" placeholder="Ex: Desconto ou taxa extra" required>
                </div>
                <div class="form-group">
                    <label>Tipo *</label>
                    <select id="adjust-type" required>
                        <option value="fee">Taxa extra</option>
                        <option value="discount">Desconto</option>
                        <option value="service">Servico</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Valor *</label>
                    <input type="number" id="adjust-amount" step="0.01" required>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar Ajuste</button>
            </div>
        </form>`;

    openModal(form);

    document.getElementById('adjust-charge-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const description = document.getElementById('adjust-desc').value;
            const type = document.getElementById('adjust-type').value;
            let amount = parseFloat(document.getElementById('adjust-amount').value);

            if (type === 'discount' && amount > 0) {
                amount = amount * -1;
            }

            await apiCall(`/charges/${chargeId}/items`, 'POST', {
                description,
                amount,
                type
            });
            closeModal();
            showToast('Ajuste aplicado com sucesso', 'success');
            loadCharges();
        } catch (error) {
            showToast('Erro: ' + error.message, 'error');
        }
    });
}

// Baixar pagamento (manual)
function showPaymentForm(chargeId, valorRestante, inquilino) {
    const hoje = new Date().toISOString().split('T')[0];
    
    const form = `<h2>Baixar Pagamento</h2>
        <p><strong>Inquilino:</strong> ${inquilino}</p>
        <p><strong>Valor em aberto:</strong> ${formatCurrency(valorRestante)}</p>
        <form id="payment-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Valor Pago *</label>
                    <input type="number" id="payment-amount" step="0.01" value="${valorRestante.toFixed(2)}" required>
                </div>
                <div class="form-group">
                    <label>Data do Pagamento *</label>
                    <input type="date" id="payment-date" value="${hoje}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Forma de Pagamento</label>
                    <select id="payment-method">
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="transferencia">Transferência</option>
                        <option value="boleto">Boleto</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-success">Confirmar Pagamento</button>
            </div>
        </form>`;
    
    openModal(form);
    
    document.getElementById('payment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/payments', 'POST', {
                chargeId: chargeId,
                amountPaid: parseFloat(document.getElementById('payment-amount').value),
                paymentDate: document.getElementById('payment-date').value,
                paymentMethod: document.getElementById('payment-method').value
            });
            
            closeModal();
            alert('Pagamento registrado com sucesso!');
            loadCharges();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

async function showChargeForm() {
    const contracts = await apiCall('/contracts');

    let form = `<h2>Gerar Cobrança</h2>
        <form id="charge-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Contrato *</label>
                    <select id="contract-id" required>
                        <option value="">Selecione...</option>`;
    contracts.forEach(c => {
        form += `<option value="${c.id}">${c.property_address} - ${c.tenant_name}</option>`;
    });
    form += `</select>
                </div>
                <div class="form-group">
                    <label>Mês de Referência *</label>
                    <input type="month" id="ref-month" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Data de Vencimento *</label>
                    <input type="date" id="due-date" required>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Gerar</button>
            </div>
        </form>`;

    openModal(form);

    document.getElementById('charge-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/charges', 'POST', {
                contractId: parseInt(document.getElementById('contract-id').value),
                referenceMonth: document.getElementById('ref-month').value + '-01',
                dueDate: document.getElementById('due-date').value
            });
            closeModal();
            loadCharges();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// ===== EXPENSES =====
async function loadExpenses() {
    updatePageTitle('Despesas');

    try {
        const [expenses, properties] = await Promise.all([
            apiCall('/expenses'),
            apiCall('/properties')
        ]);

        let html = '<div class="card"><div class="card-header"><h2>Despesas</h2>';
        html += '<button class="btn btn-primary btn-small" onclick="showExpenseForm()">+ Nova Despesa</button></div>';
        html += '<div class="card-body">';

        if (expenses.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhuma despesa</p>';
        } else {
            html += '<table class="table"><thead><tr><th>Propriedade</th><th>Descrição</th><th>Valor</th><th>Data</th><th>Status</th></tr></thead><tbody>';
            expenses.forEach(ex => {
                const badge = `<span class="badge badge-${ex.status}">${ex.status}</span>`;
                html += `<tr><td>${ex.property_address}</td><td>${ex.description}</td><td>${formatCurrency(ex.amount)}</td><td>${formatDate(ex.expense_date)}</td><td>${badge}</td></tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

async function showExpenseForm() {
    const properties = await apiCall('/properties');

    let form = `<h2>Nova Despesa</h2>
        <form id="expense-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Propriedade *</label>
                    <select id="exp-prop-id" required>
                        <option value="">Selecione...</option>`;
    properties.forEach(p => {
        form += `<option value="${p.id}">${p.address}</option>`;
    });
    form += `</select>
                </div>
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="exp-category">
                        <option value="">Selecione...</option>
                        <option value="Água">Água</option>
                        <option value="Energia">Energia</option>
                        <option value="Internet">Internet</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Limpeza">Limpeza</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Descrição *</label>
                    <input type="text" id="exp-description" required>
                </div>
                <div class="form-group">
                    <label>Valor *</label>
                    <input type="number" id="exp-amount" step="0.01" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Data *</label>
                    <input type="date" id="exp-date" required>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Registrar</button>
            </div>
        </form>`;

    openModal(form);

    document.getElementById('expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/expenses', 'POST', {
                propertyId: parseInt(document.getElementById('exp-prop-id').value),
                description: document.getElementById('exp-description').value,
                amount: parseFloat(document.getElementById('exp-amount').value),
                expenseDate: document.getElementById('exp-date').value,
                category: document.getElementById('exp-category').value
            });
            closeModal();
            loadExpenses();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// ===== PARTNERS (ADMIN ONLY) =====
async function loadPartners() {
    updatePageTitle('Sócios & Compartilhamento');

    try {
        const partners = await apiCall('/users/partners');

        let html = '<div class="card"><div class="card-header"><h2>Meus Sócios</h2><small style="color: var(--text-secondary); font-weight: normal;">Selecione usuários existentes e defina sua participação nos lucros. O sistema calcula automaticamente.</small>';
        html += '<button class="btn btn-primary btn-small" onclick="showPartnerShareForm()">+ Adicionar Sócio</button></div>';
        html += '<div class="card-body">';

        if (partners.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhum sócio cadastrado</p>';
        } else {
            html += '<table class="table"><thead><tr><th>Nome</th><th>Percentual</th><th>Ações</th></tr></thead><tbody>';
            partners.forEach(p => {
                html += `<tr><td>${p.partner_name}</td><td>${p.percentage}%</td><td>
                    <button class="btn btn-small btn-secondary" onclick="editPartnerShare(${p.id}, ${p.percentage})">Editar</button>
                </td></tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

async function showPartnerShareForm() {
    const allUsers = await apiCall('/users');
    // Filter out current user only (any other user can become a partner)
    const availableUsers = allUsers.filter(u => u.id !== currentUser.id);

    let form = `<h2>Adicionar Sócio e Definir Participação</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Selecione um usuário existente e defina sua porcentagem de participação nos lucros.</p>
        <form id="partner-share-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Selecionar Usuário *</label>
                    <select id="share-partner-id" required>
                        <option value="">Escolha um usuário...</option>`;
    availableUsers.forEach(u => {
        form += `<option value="${u.id}">${u.name} (${u.email}) - ${u.role === 'client_admin' ? 'Admin' : 'Membro'}</option>`;
    });
    form += `</select>
                </div>
                <div class="form-group">
                    <label>Percentual de Participação (%) *</label>
                    <input type="number" id="share-percentage" min="0" max="100" step="0.01" required placeholder="Ex: 50.00">
                    <small style="color: var(--text-secondary);">Porcentagem dos lucros que este sócio receberá</small>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Adicionar como Sócio</button>
            </div>
        </form>`;

    openModal(form);

    document.getElementById('partner-share-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/users/partner-shares', 'POST', {
                partnerUserId: parseInt(document.getElementById('share-partner-id').value),
                percentage: parseFloat(document.getElementById('share-percentage').value)
            });
            closeModal();
            loadPartners();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// ===== USERS =====
async function loadUsers() {
    updatePageTitle('Usuários do Sistema');

    try {
        const users = await apiCall('/users');

        let html = '<div class="card"><div class="card-header"><h2>Todos os Usuários</h2><small style="color: var(--text-secondary); font-weight: normal;">Quem tem acesso ao sistema. Crie contas para assistentes ou gerenciadores de imóveis.</small></div>';
        html += '<div class="card-body">';

        if (users.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhum usuário</p>';
        } else {
            html += '<table class="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Função</th></tr></thead><tbody>';
            users.forEach(u => {
                const role = u.role === 'admin' ? 'Administrador' : 'Membro';
                html += `<tr><td>${u.name}</td><td>${u.email}</td><td>${role}</td></tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

// ===== ENTERPRISES (EMPREENDIMENTOS) =====
async function loadEnterprises() {
    updatePageTitle('Empreendimentos');

    try {
        const enterprises = await apiCall('/enterprises');

        let html = '<div class="card"><div class="card-header"><h2>Meus Empreendimentos</h2><small style="color: var(--text-secondary); font-weight: normal;">Seus imóveis ou condomínios. Adicione um novo ou clique para editar os dados.</small>';
        html += '<button class="btn btn-primary btn-small" data-action="add-enterprise">+ Novo Empreendimento</button></div>';
        html += '<div class="card-body">';

        if (enterprises.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhum empreendimento cadastrado</p>';
        } else {
            html += '<table class="table"><thead><tr><th>Nome</th><th>Endereço</th><th>Unidades</th><th>Ocupação</th><th>Ações</th></tr></thead><tbody>';
            enterprises.forEach(e => {
                const occupancy = e.units_count > 0 ? `${e.occupied_count}/${e.units_count}` : '0/0';
                html += `<tr>
                    <td><strong>${e.name}</strong></td>
                    <td>${e.address || '-'}</td>
                    <td>${e.units_count}</td>
                    <td>${occupancy}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" data-action="view-enterprise" data-id="${e.id}">Ver Unidades</button>
                        <button class="btn btn-small btn-secondary" data-action="edit-enterprise" data-id="${e.id}">Editar</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

function showEnterpriseForm(enterprise = null) {
    const isEdit = enterprise !== null;
    const form = `<h2>${isEdit ? 'Editar' : 'Novo'} Empreendimento</h2>
        <form id="enterprise-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="enterprise-name" value="${enterprise?.name || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Endereço</label>
                    <input type="text" id="enterprise-address" value="${enterprise?.address || ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea id="enterprise-description">${enterprise?.description || ''}</textarea>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>`;
    openModal(form);

    document.getElementById('enterprise-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = {
                name: document.getElementById('enterprise-name').value,
                address: document.getElementById('enterprise-address').value,
                description: document.getElementById('enterprise-description').value
            };
            
            if (isEdit) {
                await apiCall(`/enterprises/${enterprise.id}`, 'PUT', data);
            } else {
                await apiCall('/enterprises', 'POST', data);
            }
            closeModal();
            loadEnterprises();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// ===== UNITS (UNIDADES) =====
async function loadUnits(enterpriseId = null) {
    updatePageTitle('Unidades');

    try {
        let url = '/units';
        if (enterpriseId) url += `?enterpriseId=${enterpriseId}`;
        
        const units = await apiCall(url);
        const enterprises = await apiCall('/enterprises');

        let html = '<div class="card"><div class="card-header"><h2>Minhas Unidades</h2><small style="color: var(--text-secondary); font-weight: normal;">Cada casa ou apartamento que você aluga. Veja quem mora em cada uma e quando o contrato termina.</small>';
        html += '<button class="btn btn-primary btn-small" data-action="add-unit">+ Nova Unidade</button></div>';
        html += '<div class="card-body">';

        if (units.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhuma unidade cadastrada</p>';
        } else {
            html += '<table class="table"><thead><tr><th>Empreendimento</th><th>Unidade</th><th>Status</th><th>Inquilino</th><th>Aluguel</th><th>Ações</th></tr></thead><tbody>';
            units.forEach(u => {
                const statusBadge = getUnitStatusBadge(u.unit_status);
                html += `<tr>
                    <td>${u.enterprise_name}</td>
                    <td><strong>${u.identifier}</strong></td>
                    <td>${statusBadge}</td>
                    <td>${u.tenant_name || '-'}</td>
                    <td>${u.rent_amount ? formatCurrency(u.rent_amount) : '-'}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" data-action="edit-unit" data-id="${u.id}">Editar</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

function getUnitStatusBadge(status) {
    const badges = {
        'vacant': '<span class="badge badge-secondary">Vaga</span>',
        'occupied': '<span class="badge badge-active">Ocupada</span>',
        'overdue': '<span class="badge badge-overdue">Atrasada</span>',
        'expiring': '<span class="badge badge-pending">Vencendo</span>'
    };
    return badges[status] || badges['vacant'];
}

async function showUnitForm(unit = null) {
    const isEdit = unit !== null;
    const enterprises = await apiCall('/enterprises');
    
    let enterpriseOptions = enterprises.map(e => 
        `<option value="${e.id}" ${unit?.enterprise_id === e.id ? 'selected' : ''}>${e.name}</option>`
    ).join('');

    const form = `<h2>${isEdit ? 'Editar' : 'Nova'} Unidade</h2>
        <form id="unit-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Empreendimento *</label>
                    <select id="unit-enterprise" required ${isEdit ? 'disabled' : ''}>
                        <option value="">Selecione...</option>
                        ${enterpriseOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Identificador *</label>
                    <input type="text" id="unit-identifier" value="${unit?.identifier || ''}" placeholder="Ex: Apto 101, Sala 01" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Área (m²)</label>
                    <input type="number" step="0.01" id="unit-area" value="${unit?.area_sqm || ''}">
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <input type="text" id="unit-description" value="${unit?.description || ''}">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>`;
    openModal(form);

    document.getElementById('unit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = {
                enterpriseId: parseInt(document.getElementById('unit-enterprise').value),
                identifier: document.getElementById('unit-identifier').value,
                areaSqm: document.getElementById('unit-area').value || null,
                description: document.getElementById('unit-description').value
            };
            
            if (isEdit) {
                await apiCall(`/units/${unit.id}`, 'PUT', data);
            } else {
                await apiCall('/units', 'POST', data);
            }
            closeModal();
            loadUnits();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// ===== TENANTS (INQUILINOS) =====
async function loadTenants() {
    updatePageTitle('Inquilinos');

    try {
        const tenants = await apiCall('/tenants');

        let html = '<div class="card"><div class="card-header"><h2>Meus Inquilinos</h2><small style="color: var(--text-secondary); font-weight: normal;">Seus moradores. Guarde o nome, telefone e email para contatos importantes.</small>';
        html += '<button class="btn btn-primary btn-small" data-action="add-tenant">+ Novo Inquilino</button></div>';
        html += '<div class="card-body">';

        if (tenants.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Nenhum inquilino cadastrado</p>';
        } else {
            html += '<table class="table"><thead><tr><th>Nome</th><th>Documento</th><th>Email</th><th>Telefone</th><th>Ações</th></tr></thead><tbody>';
            tenants.forEach(t => {
                html += `<tr>
                    <td><strong>${t.name}</strong></td>
                    <td>${t.document || '-'}</td>
                    <td>${t.email || '-'}</td>
                    <td>${t.phone || '-'}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" data-action="edit-tenant" data-id="${t.id}">Editar</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '</div></div>';
        document.getElementById('content').innerHTML = html;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message show">${error.message}</div>`;
    }
}

function showTenantForm(tenant = null) {
    const isEdit = tenant !== null;
    const form = `<h2>${isEdit ? 'Editar' : 'Novo'} Inquilino</h2>
        <form id="tenant-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="tenant-name" value="${tenant?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Documento (CPF/CNPJ)</label>
                    <input type="text" id="tenant-document" value="${tenant?.document || ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="tenant-email" value="${tenant?.email || ''}">
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="text" id="tenant-phone" value="${tenant?.phone || ''}">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>`;
    openModal(form);

    document.getElementById('tenant-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = {
                name: document.getElementById('tenant-name').value,
                document: document.getElementById('tenant-document').value,
                email: document.getElementById('tenant-email').value,
                phone: document.getElementById('tenant-phone').value
            };
            
            // API ainda usa POST /tenants
            await apiCall('/tenants', 'POST', data);
            closeModal();
            loadTenants();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// ===== HELPER FUNCTIONS =====
function updatePageTitle(title) {
    document.getElementById('page-title').textContent = title;
}

function editProperty(id) {
    alert('Funcionalidade de edição em desenvolvimento');
}

function editContract(id) {
    alert('Funcionalidade de substituição de contratos em desenvolvimento');
}

function editPartnerShare(id, currentPercentage) {
    const newPercentage = prompt(`Novo percentual (atual: ${currentPercentage}%):`, currentPercentage);
    if (newPercentage === null) return;

    apiCall(`/users/partner-shares/${id}`, 'PUT', { percentage: parseFloat(newPercentage) })
        .then(() => {
            alert('Percentual atualizado com sucesso!');
            loadPartners();
        })
        .catch(err => alert('Erro: ' + err.message));
}

// ===== EVENT LISTENERS INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Auth links (removido signup)
    const toggleMenuBtn = document.getElementById('toggle-menu-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    if (toggleMenuBtn) {
        toggleMenuBtn.addEventListener('click', toggleSidebar);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    // Navigation menu items
    const navLinks = document.querySelectorAll('.nav-link[data-action]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const action = link.getAttribute('data-action');
            
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

    // Delegated event handlers for dynamic content
    document.getElementById('content').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        switch(action) {
            // Clients
            case 'add-client': showCreateClientForm(); break;
            case 'view-client': viewClient(id); break;
            case 'edit-client': editClient(id); break;
            case 'delete-client': 
                if (confirm('Tem certeza que deseja deletar este cliente?')) {
                    fetch(`${API_BASE}/admin/clients/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    .then(() => loadClients())
                    .catch(err => alert('Erro: ' + err.message));
                }
                break;
            // Enterprises
            case 'add-enterprise': showEnterpriseForm(); break;
            case 'edit-enterprise': 
                apiCall(`/enterprises/${id}`).then(e => showEnterpriseForm(e));
                break;
            case 'view-enterprise': loadUnits(id); break;
            // Units
            case 'add-unit': showUnitForm(); break;
            case 'edit-unit': 
                apiCall(`/units/${id}`).then(u => showUnitForm(u));
                break;
            // Tenants
            case 'add-tenant': showTenantForm(); break;
            case 'edit-tenant': alert('Edição de inquilino em desenvolvimento'); break;
            // Properties (legacy)
            case 'add-property': showPropertyForm(); break;
            case 'edit-property': editProperty(parseInt(id)); break;
            // Contracts
            case 'add-contract': showContractForm(); break;
            case 'edit-contract': editContract(parseInt(id)); break;
            // Charges
            case 'add-charge': showChargeForm(); break;
            // Expenses
            case 'add-expense': showExpenseForm(); break;
            // Partners
            case 'add-partner': showCreatePartnerForm(); break;
            case 'add-partner-share': showPartnerShareForm(); break;
            case 'edit-partner-share': editPartnerShare(parseInt(id), btn.getAttribute('data-percentage')); break;
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
