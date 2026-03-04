// ===== USERS COMPONENT =====
// Módulo isolado para gerenciamento de usuários do sistema (nível cliente)
// Event delegation: lista → #content | formulários no modal → #modal-body

import { App, apiCall, openModal, closeModal, showToast } from '/app/script.js';

const UsersComponent = {
    baseUrl: '/users',
    contentContainer: null,
    eventListenersAttached: false,
    modalListenersAttached: false,
    _users: [],

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

        try {
            const users = await apiCall(this.baseUrl);
            this._users = users;

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h2>Todos os Usuários</h2>
                        <small class="card-header-description">Controle quem tem acesso à plataforma. Crie contas para colaboradores e defina o nível de permissão de cada um.</small>
                    </div>
                    <div class="card-body">`;

            if (users.length === 0) {
                html += `
                    <div class="empty-state">
                        <span class="empty-icon" aria-hidden="true">👤</span>
                        <p class="empty-title">Nenhum usuário</p>
                        <p class="empty-text">Crie o primeiro usuário para gerenciar a plataforma.</p>
                    </div>`;
            } else {
                html += `
                    <table class="table">
                        <thead>
                            <tr><th>Nome</th><th>E-mail</th><th>Função</th><th>Ações</th></tr>
                        </thead>
                        <tbody>`;

                users.forEach(u => {
                    const role = u.role === 'admin' ? 'Administrador' : 'Membro';
                    html += `<tr>
                        <td data-label="Nome">${u.name}</td>
                        <td data-label="E-mail">${u.email}</td>
                        <td data-label="Função">${role}</td>
                        <td data-label="Ações" class="td-actions">
                            <button class="btn btn-sm btn-secondary" data-component="users" data-action="edit" data-id="${u.id}">Editar</button>
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

    showEditForm(user) {
        const form = `
            <h2>Editar Usuário</h2>
            <form id="edit-user-form" data-id="${user.id}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" id="eu-name" value="${user.name}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>E-mail *</label>
                        <input type="email" id="eu-email" value="${user.email}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Função *</label>
                        <select id="eu-role" required>
                            <option value="member" ${user.role === 'member' ? 'selected' : ''}>Membro</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </div>
            </form>`;

        openModal(form);
    },

    // ─── Event Listeners ─────────────────────────────────────────

    attachEventListeners() {
        const self = this;
        this.contentContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-component="users"]');
            if (!btn) return;
            e.preventDefault();

            const action = btn.getAttribute('data-action');
            const id     = parseInt(btn.getAttribute('data-id'));

            if (action === 'edit') {
                const user = self._users.find(u => u.id === id);
                if (user) self.showEditForm(user);
            }
        });
    },

    attachModalListeners() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        modalBody.addEventListener('submit', async function (e) {
            if (e.target.id !== 'edit-user-form') return;
            e.preventDefault();

            const userId = e.target.dataset.id;
            try {
                await apiCall(`${self.baseUrl}/${userId}`, 'PUT', {
                    name:  document.getElementById('eu-name').value,
                    email: document.getElementById('eu-email').value,
                    role:  document.getElementById('eu-role').value
                });
                closeModal();
                showToast('Usuário atualizado!', 'success');
                await self.renderList();
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });
    }
};

App.register('users', UsersComponent);
