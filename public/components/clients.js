// ===== CLIENTS COMPONENT (Admin) =====
// Módulo isolado para gerenciamento de clientes (admin only)
// Event delegation: lista → #content  |  formulários no modal → #modal-body

import { App, apiCall, openModal, closeModal, formatDate, formatCurrency, updatePageTitle } from '/app/script.js';

const ClientsComponent = {
    contentContainer: null,
    eventListenersAttached: false,
    modalListenersAttached: false,
    _currentClientData: { id: null, users: [] },

    init() {
        this.contentContainer = document.getElementById('content');
        if (this.contentContainer && !this.eventListenersAttached) {
            this.attachEventListeners();
            this.eventListenersAttached = true;
        }
        if (!this.modalListenersAttached) {
            this.attachModalListeners();
            this.modalListenersAttached = true;
        }
    },

    async renderList() {
        if (!this.contentContainer) this.init();
        updatePageTitle('Gerenciar Clientes');

        try {
            const clients = await apiCall('/admin/clients');

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h2>Clientes Ativos</h2>
                        <button class="btn btn-primary btn-small" data-component="clients" data-action="add">+ Novo Cliente</button>
                    </div>
                    <div class="card-body">`;

            if (clients.length === 0) {
                html += '<p style="text-align: center; color: var(--text-secondary);">Nenhum cliente cadastrado</p>';
            } else {
                html += `<table class="table">
                    <thead><tr><th>Cliente</th><th>Criado em</th><th>Usuários</th><th>Propriedades</th><th>Ações</th></tr></thead>
                    <tbody>`;
                clients.forEach(c => {
                    const created = new Date(c.created_at).toLocaleDateString('pt-BR');
                    html += `<tr>
                        <td data-label="Cliente"><strong>${c.name}</strong></td>
                        <td data-label="Criado em">${created}</td>
                        <td data-label="Usuários">${c.users_count}</td>
                        <td data-label="Propriedades">${c.properties_count}</td>
                        <td data-label="Ações" class="td-actions">
                            <button class="btn btn-small btn-secondary" data-component="clients" data-action="view" data-id="${c.id}">Ver</button>
                            <button class="btn btn-small btn-secondary" data-component="clients" data-action="edit" data-id="${c.id}">Editar</button>
                            <button class="btn btn-small btn-danger" data-component="clients" data-action="delete" data-id="${c.id}">Deletar</button>
                        </td>
                    </tr>`;
                });
                html += '</tbody></table>';
            }

            html += '</div></div>';
            this.contentContainer.innerHTML = html;
        } catch (error) {
            this.contentContainer.innerHTML = `<div class="error-message show">${error.message}</div>`;
        }
    },

    // ── Criar cliente ────────────────────────────────────────────

    showCreateForm() {
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
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                    <button type="submit" class="btn btn-primary">Criar Cliente</button>
                </div>
            </form>`;

        openModal(form);
    },

    // ── Ver detalhes ─────────────────────────────────────────────

    async viewClient(id) {
        try {
            const client = await apiCall(`/admin/clients/${id}`);

            let usersHtml = '<p>Carregando usuários...</p>';
            try {
                const users = await apiCall(`/admin/clients/${id}/users`);
                this._currentClientData = { id, users };

                if (users.length === 0) {
                    usersHtml = '<p style="color: var(--text-secondary);">Nenhum usuário cadastrado</p>';
                } else {
                    usersHtml = `<table class="table" style="margin-top: 10px;">
                        <thead><tr><th>Nome</th><th>Email</th><th>Tipo</th><th>Ações</th></tr></thead><tbody>`;
                    users.forEach(u => {
                        const roleLabel = u.role === 'client_admin' ? 'Admin' : 'Membro';
                        usersHtml += `<tr>
                            <td data-label="Nome">${u.name}</td>
                            <td data-label="Email">${u.email}</td>
                            <td data-label="Tipo"><span class="badge badge-${u.role === 'client_admin' ? 'active' : 'pending'}">${roleLabel}</span></td>
                            <td data-label="Ações" class="td-actions">
                                <button class="btn btn-small btn-primary" data-component="clients" data-modal-action="edit-user" data-user-id="${u.id}">Editar</button>
                                <button class="btn btn-small btn-secondary" data-component="clients" data-modal-action="reset-pwd" data-user-id="${u.id}" data-user-email="${u.email}">Senha</button>
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
                <button class="btn btn-small btn-primary" style="margin-top: 10px;" data-component="clients" data-modal-action="add-user" data-client-id="${id}">+ Novo Usuário</button>
                <hr style="margin-top: 20px;">
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Fechar</button>
                    <button type="button" class="btn btn-primary" data-component="clients" data-modal-action="edit-name" data-id="${id}">Editar Nome</button>
                </div>`;

            openModal(html);
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    // ── Editar nome do cliente ───────────────────────────────────

    async editClient(id) {
        try {
            const client = await apiCall(`/admin/clients/${id}`);
            const form = `<h2>Editar Cliente</h2>
                <form id="edit-client-form" data-id="${id}">
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
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    // ── Editar usuário do cliente ────────────────────────────────

    showEditUserForm(userId) {
        const user = this._currentClientData.users.find(u => u.id === userId);
        if (!user) return;
        const clientId = this._currentClientData.id;

        const form = `<h2>Editar Usuário</h2>
            <form id="edit-client-user-form" data-user-id="${userId}" data-client-id="${clientId}">
                <div class="form-row">
                    <div class="form-group"><label>Nome *</label><input type="text" id="edit-user-name" value="${user.name}" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Email *</label><input type="email" id="edit-user-email" value="${user.email}" required></div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-component="clients" data-modal-action="back-view" data-client-id="${clientId}">Voltar</button>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </div>
            </form>`;
        openModal(form);
    },

    // ── Adicionar usuário ao cliente ─────────────────────────────

    showAddUserForm(clientId) {
        const form = `<h2>Novo Usuário do Cliente</h2>
            <form id="add-client-user-form" data-client-id="${clientId}">
                <div class="form-row"><div class="form-group"><label>Nome *</label><input type="text" id="new-user-name" required></div></div>
                <div class="form-row"><div class="form-group"><label>Email *</label><input type="email" id="new-user-email" required></div></div>
                <div class="form-row"><div class="form-group"><label>Senha *</label><input type="password" id="new-user-password" placeholder="Mínimo 6 caracteres" required></div></div>
                <div class="form-row">
                    <div class="form-group"><label>Tipo *</label>
                        <select id="new-user-role" required>
                            <option value="client_member">Membro (apenas visualiza)</option>
                            <option value="client_admin">Admin (gerencia tudo)</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-component="clients" data-modal-action="back-view" data-client-id="${clientId}">Voltar</button>
                    <button type="submit" class="btn btn-primary">Criar Usuário</button>
                </div>
            </form>`;
        openModal(form);
    },

    // ── Reset de senha ───────────────────────────────────────────

    async resetUserPassword(userId, email) {
        const newPassword = prompt(`Nova senha para ${email}:\n(mínimo 6 caracteres)`);
        if (!newPassword) return;
        if (newPassword.length < 6) { alert('Senha deve ter pelo menos 6 caracteres'); return; }

        try {
            await apiCall(`/admin/users/${userId}/reset-password`, 'POST', { newPassword });
            alert(`Senha alterada com sucesso!\n\nEmail: ${email}\nNova senha: ${newPassword}`);
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    // ── Deletar cliente ──────────────────────────────────────────

    async deleteClient(id) {
        if (!confirm('Tem certeza que deseja deletar este cliente?')) return;
        try {
            await apiCall(`/admin/clients/${id}`, 'DELETE');
            await this.renderList();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    // ── Event Listeners ──────────────────────────────────────────

    attachEventListeners() {
        const self = this;
        this.contentContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-component="clients"]');
            if (!btn) return;
            e.preventDefault();

            const action = btn.getAttribute('data-action');
            const id     = btn.getAttribute('data-id');

            switch (action) {
                case 'add':    self.showCreateForm(); break;
                case 'view':   self.viewClient(parseInt(id)); break;
                case 'edit':   self.editClient(parseInt(id)); break;
                case 'delete': self.deleteClient(parseInt(id)); break;
            }
        });
    },

    attachModalListeners() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        // ── Click delegation inside modal ──
        modalBody.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-component="clients"][data-modal-action]');
            if (!btn) return;
            e.preventDefault();

            const action   = btn.getAttribute('data-modal-action');
            const userId   = btn.getAttribute('data-user-id');
            const clientId = btn.getAttribute('data-client-id') || btn.getAttribute('data-id');

            switch (action) {
                case 'edit-user':
                    self.showEditUserForm(parseInt(userId));
                    break;
                case 'reset-pwd':
                    self.resetUserPassword(parseInt(userId), btn.getAttribute('data-user-email'));
                    break;
                case 'add-user':
                    self.showAddUserForm(parseInt(clientId));
                    break;
                case 'edit-name':
                    self.editClient(parseInt(clientId));
                    break;
                case 'back-view':
                    self.viewClient(parseInt(clientId));
                    break;
            }
        });

        // ── Form submissions inside modal ──
        modalBody.addEventListener('submit', async function (e) {
            const formId = e.target.id;

            if (formId === 'create-client-form') {
                e.preventDefault();
                try {
                    const data = await apiCall('/admin/clients', 'POST', {
                        clientName:    document.getElementById('client-name').value,
                        adminName:     document.getElementById('admin-name').value,
                        adminEmail:    document.getElementById('admin-email').value,
                        adminPassword: document.getElementById('admin-password').value
                    });
                    alert(`Cliente criado com sucesso!\n\nEmail: ${data.account.adminEmail}\nSenha: (informada)`);
                    closeModal();
                    await self.renderList();
                } catch (error) {
                    alert('Erro: ' + error.message);
                }
                return;
            }

            if (formId === 'edit-client-form') {
                e.preventDefault();
                const id = e.target.dataset.id;
                try {
                    await apiCall(`/admin/clients/${id}`, 'PUT', {
                        name: document.getElementById('edit-client-name').value
                    });
                    alert('Cliente atualizado com sucesso!');
                    closeModal();
                    await self.renderList();
                } catch (error) {
                    alert('Erro: ' + error.message);
                }
                return;
            }

            if (formId === 'edit-client-user-form') {
                e.preventDefault();
                const userId   = e.target.dataset.userId;
                const clientId = e.target.dataset.clientId;
                try {
                    await apiCall(`/admin/users/${userId}`, 'PUT', {
                        name:  document.getElementById('edit-user-name').value,
                        email: document.getElementById('edit-user-email').value
                    });
                    alert('Usuário atualizado com sucesso!');
                    self.viewClient(parseInt(clientId));
                } catch (error) {
                    alert('Erro: ' + error.message);
                }
                return;
            }

            if (formId === 'add-client-user-form') {
                e.preventDefault();
                const clientId = e.target.dataset.clientId;
                try {
                    await apiCall(`/admin/clients/${clientId}/users`, 'POST', {
                        name:     document.getElementById('new-user-name').value,
                        email:    document.getElementById('new-user-email').value,
                        password: document.getElementById('new-user-password').value,
                        role:     document.getElementById('new-user-role').value
                    });
                    alert('Usuário criado com sucesso!');
                    self.viewClient(parseInt(clientId));
                } catch (error) {
                    alert('Erro: ' + error.message);
                }
                return;
            }
        });
    }
};

App.register('clients', ClientsComponent);
