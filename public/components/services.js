// ===== SERVICES COMPONENT =====
// Módulo isolado para gerenciamento de serviços (catálogo)
// Event delegation: lista → #content | formulários no modal → #modal-body

import { App, apiCall, openModal, closeModal, showToast, formatCurrency } from '/app/script.js';

const ICON_OPTIONS = [
    { value: 'fa-solid fa-wifi',           label: 'Wi-Fi / Internet' },
    { value: 'fa-solid fa-motorcycle',     label: 'Garagem / Moto' },
    { value: 'fa-solid fa-car',            label: 'Garagem / Carro' },
    { value: 'fa-solid fa-water',          label: 'Água' },
    { value: 'fa-solid fa-lightbulb',      label: 'Energia' },
    { value: 'fa-solid fa-fire',           label: 'Gás' },
    { value: 'fa-solid fa-building',       label: 'Condomínio' },
    { value: 'fa-solid fa-broom',          label: 'Limpeza' },
    { value: 'fa-solid fa-shield-halved',  label: 'Seguro' },
    { value: 'fa-solid fa-tv',             label: 'TV / Streaming' },
    { value: 'fa-solid fa-circle-check',   label: 'Padrão' }
];

const ServicesComponent = {
    baseUrl: '/services',
    contentContainer: null,
    eventListenersAttached: false,
    modalListenersAttached: false,
    _services: [], // cache local

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
            const services = await apiCall(this.baseUrl);
            this._services = services;

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h2>Serviços</h2>
                        <small class="card-header-description">Cadastre serviços extras como garagem e internet. Depois vincule ao contrato de cada inquilino.</small>
                        <button class="btn btn-primary btn-sm" data-component="services" data-action="add">+ Novo Serviço</button>
                    </div>
                    <div class="card-body">`;

            if (services.length === 0) {
                html += `
                    <div class="empty-state">
                        <span class="empty-icon" aria-hidden="true">🛠️</span>
                        <p class="empty-title">Nenhum serviço cadastrado</p>
                        <p class="empty-text">Crie um serviço para poder vincular aos contratos.</p>
                        <button class="btn btn-primary btn-sm" data-component="services" data-action="add">+ Criar serviço</button>
                    </div>`;
            } else {
                html += `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Ícone</th>
                                <th>Nome</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>`;

                services.forEach(s => {
                    const icon = s.icon || 'fa-solid fa-circle-check';
                    const isActive = s.status === 'active';
                    const statusBadge = isActive
                        ? '<span class="badge badge-success">Ativo</span>'
                        : '<span class="badge badge-gray">Inativo</span>';
                    const toggleLabel = isActive ? 'Desativar' : 'Ativar';
                    const nextStatus = isActive ? 'inactive' : 'active';

                    html += `<tr>
                        <td data-label="Ícone"><i class="${icon}" style="font-size:1.2em; color:var(--primary-color);"></i></td>
                        <td data-label="Nome">${s.name}</td>
                        <td data-label="Valor">${formatCurrency(s.default_price)}</td>
                        <td data-label="Status">${statusBadge}</td>
                        <td data-label="Ações" class="td-actions">
                            <button class="btn btn-sm btn-secondary" data-component="services" data-action="toggle" data-id="${s.id}" data-status="${nextStatus}">${toggleLabel}</button>
                            <button class="btn btn-sm btn-primary" data-component="services" data-action="edit" data-id="${s.id}">Editar</button>
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

    _buildIconSelect(selected = 'fa-solid fa-circle-check') {
        return ICON_OPTIONS.map(o =>
            `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`
        ).join('');
    },

    showForm(service = null) {
        const isEdit = service !== null;
        const iconSelect = this._buildIconSelect(service?.icon);
        const currentIcon = service?.icon || 'fa-solid fa-circle-check';

        const form = `
            <h2>${isEdit ? 'Editar' : 'Novo'} Serviço</h2>
            <form id="service-form" ${isEdit ? `data-id="${service.id}"` : ''}>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" id="svc-name" value="${service?.name || ''}" placeholder="Ex: Internet Fibra" required>
                    </div>
                    <div class="form-group">
                        <label>Valor *</label>
                        <input type="number" id="svc-price" step="0.01" value="${service?.default_price || ''}" placeholder="Ex: 100.00" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Ícone *</label>
                        <select id="svc-icon" required>${iconSelect}</select>
                        <div style="margin-top:8px;">
                            <i id="svc-icon-preview" class="${currentIcon}" style="font-size:2em; color:var(--primary-color);"></i>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </div>
            </form>`;

        openModal(form);
    },

    async _handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const id = form.getAttribute('data-id');

        try {
            const data = {
                name: document.getElementById('svc-name').value,
                icon: document.getElementById('svc-icon').value,
                defaultPrice: parseFloat(document.getElementById('svc-price').value)
            };

            if (id) {
                await apiCall(`${this.baseUrl}/${id}`, 'PUT', data);
            } else {
                await apiCall(this.baseUrl, 'POST', data);
            }

            closeModal();
            showToast('Serviço salvo com sucesso!', 'success');
            await this.renderList();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    async _toggleStatus(id, newStatus) {
        try {
            await apiCall(`${this.baseUrl}/${id}`, 'PUT', { status: newStatus });
            showToast(`Serviço ${newStatus === 'active' ? 'ativado' : 'desativado'}`, 'success');
            await this.renderList();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    },

    // ─── Event Listeners ─────────────────────────────────────────

    attachEventListeners() {
        const self = this;
        this.contentContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-component="services"]');
            if (!btn) return;
            e.preventDefault();

            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');

            switch (action) {
                case 'add':
                    self.showForm();
                    break;
                case 'edit': {
                    const svc = self._services.find(s => s.id === parseInt(id));
                    if (svc) self.showForm(svc);
                    break;
                }
                case 'toggle':
                    self._toggleStatus(parseInt(id), btn.getAttribute('data-status'));
                    break;
            }
        });
    },

    attachModalListeners() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        modalBody.addEventListener('submit', function (e) {
            if (e.target.id === 'service-form') {
                self._handleFormSubmit(e);
            }
        });

        // Icon preview
        modalBody.addEventListener('change', function (e) {
            if (e.target.id === 'svc-icon') {
                const preview = document.getElementById('svc-icon-preview');
                if (preview) preview.className = e.target.value;
            }
        });
    }
};

App.register('services', ServicesComponent);
