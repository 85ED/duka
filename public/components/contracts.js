// ===== CONTRACTS COMPONENT =====
// Módulo isolado para gerenciamento de contratos
// Event delegation: lista → #content | formulários no modal → #modal-body

import { App, apiCall, openModal, closeModal, showToast, formatCurrency, formatDate } from '/app/script.js';

const ContractsComponent = {
    baseUrl: '/contracts',
    contentContainer: null,
    eventListenersAttached: false,
    modalListenersAttached: false,

    /**
     * Inicializa o componente.
     * Registra delegação no #content (lista) e no #modal-body (formulários).
     */
    init: function() {
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

    /**
     * Renderiza a lista de contratos em #content.
     * Autossuficiente: garante init().
     */
    renderList: async function() {
        if (!this.contentContainer) {
            this.init();
        }

        try {
            const contracts = await apiCall(this.baseUrl);

            let html = '<div class="card">';
            html += '<div class="card-header">';
            html += '<h2>Meus Contratos</h2>';
            html += '<small class="card-header-description">Os aluguéis. Veja quanto tempo cada um mora, o valor e quando é hora de reajustar o preço.</small>';
            html += '<button class="btn btn-primary btn-sm" data-component="contracts" data-action="add">+ Novo Contrato</button>';
            html += '</div>';
            html += '<div class="card-body">';

            if (contracts.length === 0) {
                html += `
                    <div class="empty-state">
                        <span class="empty-icon" aria-hidden="true">📋</span>
                        <p class="empty-title">Nenhum contrato por aqui</p>
                        <p class="empty-text">Crie um contrato para começar a cobrar seu inquilino.</p>
                        <button class="btn btn-primary btn-sm" data-component="contracts" data-action="add">+ Criar contrato</button>
                    </div>`;
            } else {
                html += '<table class="table">';
                html += '<thead><tr><th>Local</th><th>Inquilino</th><th>Valor</th><th>Permanência</th><th>Início – Vigência</th><th>Ações</th></tr></thead>';
                html += '<tbody>';

                contracts.forEach(c => {
                    const location = c.location_name || c.property_address || '-';
                    const inicio = new Date(c.start_date);
                    const agora = new Date();

                    const anos = Math.floor((agora - inicio) / (365.25 * 24 * 60 * 60 * 1000));
                    const meses = Math.floor(((agora - inicio) % (365.25 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000));
                    let permanencia;
                    if (anos > 0) {
                        permanencia = `${anos} ano${anos > 1 ? 's' : ''} ${meses}m`;
                    } else if (meses > 0) {
                        permanencia = `${meses} mês${meses > 1 ? 'es' : ''}`;
                    } else {
                        permanencia = 'Novo';
                    }

                    const alertaReajuste = anos > 0
                        ? ' <span class="badge badge-danger"><i class="fa-solid fa-rotate"></i> Reajuste</span>'
                        : '';

                    let vigencia;
                    if (!c.end_date) {
                        vigencia = '<span class="badge badge-success"><i class="fa-solid fa-infinity"></i> Indeterminado</span>';
                    } else {
                        const fim = new Date(c.end_date);
                        const diasAte = Math.floor((fim - agora) / (24 * 60 * 60 * 1000));
                        if (diasAte < 0) {
                            vigencia = '<span class="badge badge-success"><i class="fa-solid fa-infinity"></i> Indeterminado</span>';
                        } else if (diasAte < 90) {
                            vigencia = `<span class="badge badge-warning"><i class="fa-regular fa-clock"></i> ${diasAte} dias</span>`;
                        } else {
                            vigencia = '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Vigente</span>';
                        }
                    }

                    html += `<tr>
                        <td data-label="Local"><strong>${location}</strong></td>
                        <td data-label="Inquilino">${c.tenant_name}</td>
                        <td data-label="Valor">${formatCurrency(c.rent_amount)}</td>
                        <td data-label="Permanência">${permanencia}${alertaReajuste}</td>
                        <td data-label="Vigência">
                            ${formatDate(c.start_date)} até ${c.end_date ? formatDate(c.end_date) : '—'}
                            <br><small>${vigencia}</small>
                        </td>
                        <td data-label="Ações" class="table-actions td-actions">
                            ${c.contract_url ? `<a href="${c.contract_url}" target="_blank" class="btn btn-sm btn-primary doc-link"><i class="fa-solid fa-file-pdf"></i> PDF</a>` : ''}
                            <button class="btn btn-sm btn-secondary" data-component="contracts" data-action="edit" data-id="${c.id}">
                                <i class="fa-solid fa-pen"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-secondary" data-component="contracts" data-action="services" data-id="${c.id}">
                                Serviços
                            </button>
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

    /**
     * Abre modal de criação de contrato.
     * Carrega unidades vagas e inquilinos disponíveis.
     */
    showForm: async function() {
        try {
            const [units, tenants] = await Promise.all([
                apiCall('/units'),
                apiCall('/tenants')
            ]);

            const availableUnits = units.filter(u => u.unit_status === 'vacant');

            let unitOptions = '<option value="">Selecione...</option>';
            availableUnits.forEach(u => {
                unitOptions += `<option value="${u.id}">${u.enterprise_name} - ${u.identifier}</option>`;
            });
            if (availableUnits.length === 0) {
                unitOptions += '<option value="" disabled>Nenhuma unidade disponível</option>';
            }

            let tenantOptions = '<option value="">Selecione...</option>';
            tenants.forEach(t => {
                tenantOptions += `<option value="${t.id}">${t.name}</option>`;
            });

            const form = `
                <h2>Novo Contrato</h2>
                <form id="contract-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Unidade *</label>
                            <select id="unit-id" required>${unitOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>Inquilino *</label>
                            <select id="tenant-id" required>${tenantOptions}</select>
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
                            <label>Endereço do contrato</label>
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
        } catch (error) {
            alert('Erro ao carregar dados: ' + error.message);
        }
    },

    /**
     * Abre modal de edição de contrato.
     * @param {string|number} contractId
     */
    showEditForm: async function(contractId) {
        try {
            const contract = await apiCall(`${this.baseUrl}/${contractId}`);

            const hoje = new Date();
            const fim = contract.end_date ? new Date(contract.end_date) : null;
            let statusContrato = 'Vigente';

            if (!fim) {
                statusContrato = '<i class="fa-solid fa-infinity"></i> Vigente por prazo indeterminado';
            } else if (fim < hoje) {
                statusContrato = '<i class="fa-solid fa-infinity"></i> Vigente por prazo indeterminado (convertido automaticamente)';
            } else {
                const diasAte = Math.floor((fim - hoje) / (24 * 60 * 60 * 1000));
                if (diasAte < 90) {
                    statusContrato = `<i class="fa-regular fa-clock"></i> Vence em ${diasAte} dias`;
                }
            }

            const contractAddress = contract.contract_address || 'Não informado';
            const contractLinkHtml = contract.contract_url
                ? `<a href="${contract.contract_url}" target="_blank" rel="noopener" class="doc-link">
                       <i class="fa-solid fa-file-pdf"></i> Ver PDF
                   </a>`
                : '<span class="text-secondary">Não vinculado</span>';

            const form = `
                <h2>Contrato: ${contract.location_name || contract.property_address}</h2>
                <p><strong>Inquilino:</strong> ${contract.tenant_name}</p>
                <p><strong>Endereço:</strong> ${contractAddress}</p>
                <p><strong>Link:</strong> ${contractLinkHtml}</p>
                <p><strong>Status:</strong> ${statusContrato}</p>
                <hr>
                <form id="edit-contract-form" data-contract-id="${contractId}">
                    <div class="form-group">
                        <label>Link do Contrato (URL do PDF)</label>
                        <input type="url" id="edit-contract-url"
                               placeholder="https://exemplo.com/contrato.pdf"
                               value="${contract.contract_url || ''}">
                        <small>Cole o link para o contrato em PDF (Google Drive, OneDrive, etc.)</small>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Data Inicial</label>
                            <input type="date" id="edit-start-date" value="${contract.start_date}" readonly>
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
                            <label>Dia do Vencimento (1–31)</label>
                            <input type="number" id="edit-due-day" min="1" max="31" value="${contract.due_day || 10}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Juros Diário (%) — padrão 0.0333 (≈1%/mês)</label>
                            <input type="number" id="edit-late-fee" step="0.0001" value="${contract.late_fee_daily || 0.0333}">
                        </div>
                        <div class="form-group">
                            <label>Multa por Atraso (%) — padrão 2%</label>
                            <input type="number" id="edit-late-fee-percent" step="0.01" value="${contract.late_fee_percent || 2}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                    </div>
                </form>`;

            openModal(form);
        } catch (error) {
            alert('Erro ao carregar contrato: ' + error.message);
        }
    },

    /**
     * Abre modal de serviços vinculados ao contrato.
     * @param {string|number} contractId
     */
    showServices: async function(contractId) {
        try {
            const [contract, services, contractServices] = await Promise.all([
                apiCall(`${this.baseUrl}/${contractId}`),
                apiCall('/services'),
                apiCall(`${this.baseUrl}/${contractId}/services`)
            ]);

            let listHtml = '<p class="empty-state">Nenhum serviço ativo</p>';
            if (contractServices.length > 0) {
                listHtml  = '<table class="table">';
                listHtml += '<thead><tr><th>Serviço</th><th>Valor</th><th>Início</th><th>Status</th><th>Ações</th></tr></thead>';
                listHtml += '<tbody>';
                contractServices.forEach(cs => {
                    const valor = cs.price !== null ? cs.price : cs.default_price;
                    const statusBadge = cs.status === 'active'
                        ? '<span class="badge badge-success">Ativo</span>'
                        : '<span class="badge badge-gray">Inativo</span>';
                    const cancelBtn = cs.status === 'active'
                        ? `<button class="btn btn-sm btn-secondary"
                                   data-action="cancel-service"
                                   data-contract-id="${contractId}"
                                   data-cs-id="${cs.id}">Remover</button>`
                        : '-';
                    listHtml += `<tr>
                        <td data-label="Serviço">${cs.service_name}</td>
                        <td data-label="Valor">${formatCurrency(valor)}</td>
                        <td data-label="Início">${formatDate(cs.start_date)}</td>
                        <td data-label="Status">${statusBadge}</td>
                        <td data-label="Ações" class="table-actions td-actions">${cancelBtn}</td>
                    </tr>`;
                });
                listHtml += '</tbody></table>';
            }

            let serviceOptions = '<option value="">Selecione...</option>';
            services.filter(s => s.status === 'active').forEach(s => {
                serviceOptions += `<option value="${s.id}" data-price="${s.default_price}">${s.name} (${formatCurrency(s.default_price)})</option>`;
            });

            const form = `
                <h2>Serviços — ${contract.location_name || contract.property_address}</h2>
                <p><strong>Inquilino:</strong> ${contract.tenant_name}</p>
                <hr>
                <h3>Serviços Ativos</h3>
                ${listHtml}
                <hr>
                <h3>Adicionar Serviço</h3>
                <form id="contract-service-form" data-contract-id="${contractId}">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Serviço *</label>
                            <select id="cs-service" required>${serviceOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>Valor</label>
                            <input type="number" id="cs-price" step="0.01" placeholder="Deixe vazio para usar o padrão">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Começa em</label>
                            <input type="date" id="cs-start-date" value="${new Date().toISOString().slice(0, 10)}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Fechar</button>
                        <button type="submit" class="btn btn-primary">Adicionar</button>
                    </div>
                </form>`;

            openModal(form);

            // Auto-preenche valor do serviço ao selecionar
            const serviceSelect = document.getElementById('cs-service');
            if (serviceSelect) {
                serviceSelect.addEventListener('change', () => {
                    const price = serviceSelect.options[serviceSelect.selectedIndex]?.getAttribute('data-price');
                    if (price) document.getElementById('cs-price').value = price;
                });
            }
        } catch (error) {
            alert('Erro ao carregar serviços: ' + error.message);
        }
    },

    // ─── Handlers de formulário ───────────────────────────────────────────────

    _submitNewContract: async function() {
        await apiCall('/contracts', 'POST', {
            unitId:          parseInt(document.getElementById('unit-id').value),
            tenantId:        parseInt(document.getElementById('tenant-id').value),
            startDate:       document.getElementById('start-date').value,
            endDate:         document.getElementById('end-date').value,
            rentAmount:      parseFloat(document.getElementById('rent-amount').value),
            contractAddress: document.getElementById('contract-address').value,
            contractUrl:     document.getElementById('contract-url').value
        });
        closeModal();
        await this.renderList();
    },

    _submitEditContract: async function(form) {
        const contractId = form.getAttribute('data-contract-id');
        await apiCall(`${this.baseUrl}/${contractId}`, 'PUT', {
            contractUrl:      document.getElementById('edit-contract-url').value || null,
            rentAmount:       parseFloat(document.getElementById('edit-rent-amount').value),
            endDate:          document.getElementById('edit-end-date').value || null,
            dueDay:           parseInt(document.getElementById('edit-due-day').value),
            lateFeeDaily:     parseFloat(document.getElementById('edit-late-fee').value),
            lateFeePencent:   parseFloat(document.getElementById('edit-late-fee-percent').value)
        });
        closeModal();
        showToast('Contrato atualizado com sucesso!', 'success');
        await this.renderList();
    },

    _submitContractService: async function(form) {
        const contractId = form.getAttribute('data-contract-id');
        const priceValue = document.getElementById('cs-price').value;
        await apiCall(`${this.baseUrl}/${contractId}/services`, 'POST', {
            serviceId: parseInt(document.getElementById('cs-service').value),
            price:     priceValue ? parseFloat(priceValue) : undefined,
            startDate: document.getElementById('cs-start-date').value
        });
        await this.showServices(parseInt(contractId));
    },

    _cancelService: async function(contractId, contractServiceId) {
        await apiCall(`${this.baseUrl}/${contractId}/services/${contractServiceId}`, 'PUT');
        await this.showServices(contractId);
    },

    // ─── Event Listeners ─────────────────────────────────────────────────────

    /**
     * Delegação sobre #content → ações da listagem (add / edit / services).
     */
    attachEventListeners: function() {
        const self = this;

        this.contentContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-component="contracts"]');
            if (!btn) return;

            e.preventDefault();
            const action = btn.getAttribute('data-action');
            const id     = btn.getAttribute('data-id');

            switch (action) {
                case 'add':
                    self.showForm();
                    break;
                case 'edit':
                    self.showEditForm(id);
                    break;
                case 'services':
                    self.showServices(id);
                    break;
            }
        });
    },

    /**
     * Delegação sobre #modal-body → submits e ações internas dos modais.
     * Registrada UMA vez: #modal-body é estático no DOM.
     */
    attachModalListeners: function() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        // Submits dos 3 formulários de contratos
        modalBody.addEventListener('submit', async function(e) {
            // Filtra apenas formulários de contratos
            const knownForms = ['contract-form', 'edit-contract-form', 'contract-service-form'];
            if (!knownForms.includes(e.target.id)) return;

            e.preventDefault();
            try {
                switch (e.target.id) {
                    case 'contract-form':
                        await self._submitNewContract();
                        break;
                    case 'edit-contract-form':
                        await self._submitEditContract(e.target);
                        break;
                    case 'contract-service-form':
                        await self._submitContractService(e.target);
                        break;
                }
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });

        // Clique em "Remover" dentro da lista de serviços do modal
        modalBody.addEventListener('click', async function(e) {
            const btn = e.target.closest('[data-action="cancel-service"]');
            if (!btn) return;

            e.preventDefault();
            const contractId = parseInt(btn.getAttribute('data-contract-id'));
            const csId       = parseInt(btn.getAttribute('data-cs-id'));

            try {
                await self._cancelService(contractId, csId);
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });
    },

    /**
     * Recarrega a lista sem reativar listeners.
     */
    refresh: async function() {
        await this.renderList();
    }
};

// ✅ Registrar componente no App
App.register('contracts', ContractsComponent);
