// ===== PARTNERS COMPONENT =====
// Módulo isolado para gerenciamento de sócios e participações
// Event delegation: lista → #content | formulários no modal → #modal-body

import { App, apiCall, openModal, closeModal, showToast, getCurrentUser } from '/app/script.js';

const PartnersComponent = {
    baseUrl: '/users',
    contentContainer: null,
    eventListenersAttached: false,
    modalListenersAttached: false,

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
            const partners = await apiCall(`${this.baseUrl}/partners`);

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h2>Meus Sócios</h2>
                        <small class="card-header-description">Vincule colaboradores como sócios e defina o percentual de participação de cada um. O sistema calcula a distribuição dos lucros automaticamente.</small>
                        <button class="btn btn-primary btn-sm" data-component="partners" data-action="add">+ Adicionar Sócio</button>
                    </div>
                    <div class="card-body">`;

            if (partners.length === 0) {
                html += `
                    <div class="empty-state">
                        <span class="empty-icon" aria-hidden="true">🤝</span>
                        <p class="empty-title">Nenhum sócio cadastrado</p>
                        <p class="empty-text">Adicione um sócio e defina sua participação nos lucros.</p>
                        <button class="btn btn-primary btn-sm" data-component="partners" data-action="add">+ Adicionar Sócio</button>
                    </div>`;
            } else {
                html += `
                    <table class="table">
                        <thead><tr><th>Nome</th><th>Percentual</th><th>Ações</th></tr></thead>
                        <tbody>`;

                partners.forEach(p => {
                    html += `<tr>
                        <td data-label="Nome">${p.partner_name}</td>
                        <td data-label="Percentual">${p.percentage}%</td>
                        <td data-label="Ações" class="td-actions">
                            <button class="btn btn-sm btn-secondary" data-component="partners" data-action="edit" data-id="${p.id}" data-pct="${p.percentage}">Editar</button>
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

    async showAddForm() {
        try {
            const allUsers = await apiCall(this.baseUrl);
            const me = getCurrentUser();

            let options = '<option value="">Escolha um usuário...</option>';
            allUsers.forEach(u => {
                const label = (u.id === me.id)
                    ? `${u.name} (${u.email}) - Admin (você)`
                    : `${u.name} (${u.email}) - ${u.role === 'client_admin' ? 'Admin' : 'Membro'}`;
                options += `<option value="${u.id}">${label}</option>`;
            });

            const form = `
                <h2>Adicionar Sócio e Definir Participação</h2>
                <p style="color:var(--text-secondary); margin-bottom:20px;">Selecione um usuário existente e defina sua porcentagem de participação nos lucros.</p>
                <form id="partner-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Selecionar Usuário *</label>
                            <select id="ptn-user" required>${options}</select>
                        </div>
                        <div class="form-group">
                            <label>Percentual de Participação (%) *</label>
                            <input type="number" id="ptn-pct" min="0" max="100" step="0.01" required placeholder="Ex: 50.00">
                            <small>Porcentagem dos lucros que este sócio receberá</small>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                        <button type="submit" class="btn btn-primary">Adicionar como Sócio</button>
                    </div>
                </form>`;

            openModal(form);
        } catch (error) {
            alert('Erro ao carregar usuários: ' + error.message);
        }
    },

    showEditForm(partnerId, currentPct) {
        const form = `
            <h2>Editar Participação</h2>
            <form id="edit-partner-form" data-id="${partnerId}">
                <div class="form-group">
                    <label>Percentual de Participação (%) *</label>
                    <input type="number" id="eptn-pct" min="0" max="100" step="0.01" value="${currentPct}" required>
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
            const btn = e.target.closest('[data-component="partners"]');
            if (!btn) return;
            e.preventDefault();

            const action = btn.getAttribute('data-action');
            const id     = btn.getAttribute('data-id');

            switch (action) {
                case 'add':
                    self.showAddForm();
                    break;
                case 'edit':
                    self.showEditForm(parseInt(id), btn.getAttribute('data-pct'));
                    break;
            }
        });
    },

    attachModalListeners() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        modalBody.addEventListener('submit', async function (e) {
            const formId = e.target.id;
            if (!['partner-form', 'edit-partner-form'].includes(formId)) return;
            e.preventDefault();

            try {
                if (formId === 'partner-form') {
                    const partnerUserId = parseInt(document.getElementById('ptn-user').value);
                    const percentage    = parseFloat(document.getElementById('ptn-pct').value);
                    const me = getCurrentUser();

                    if (partnerUserId === me.id && percentage !== 50) {
                        if (!confirm(`Você está adicionando a si mesmo com ${percentage}%. Deseja continuar?`)) return;
                    }

                    await apiCall(`${self.baseUrl}/partner-shares`, 'POST', { partnerUserId, percentage });
                } else {
                    const id  = e.target.dataset.id;
                    const pct = parseFloat(document.getElementById('eptn-pct').value);
                    await apiCall(`${self.baseUrl}/partner-shares/${id}`, 'PUT', { percentage: pct });
                }

                closeModal();
                showToast('Participação salva!', 'success');
                await self.renderList();
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });
    }
};

App.register('partners', PartnersComponent);
