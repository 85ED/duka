// ===== CHARGES COMPONENT =====
// Módulo isolado para gerenciamento de cobranças
// Event delegation: lista → #content | formulários no modal → #modal-body

import { App, apiCall, openModal, closeModal, showToast, formatCurrency, formatDate } from '/app/script.js';

const ChargesComponent = {
    baseUrl: '/charges',
    contentContainer: null,
    eventListenersAttached: false,
    modalListenersAttached: false,
    isProcessing: false,

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

    // ─── Renderização ────────────────────────────────────────────

    async renderList() {
        if (!this.contentContainer) this.init();

        try {
            const charges = await apiCall(this.baseUrl);

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h2>Cobranças do Mês</h2>
                        <small class="card-header-description">Controle os pagamentos do mês. Gere cobranças, registre recebimentos e identifique quem está em atraso.</small>
                        <button class="btn btn-primary btn-sm" data-component="charges" data-action="add">+ Gerar Cobrança</button>
                    </div>
                    <div class="card-body">`;

            if (charges.length === 0) {
                html += `
                    <div class="empty-state">
                        <span class="empty-icon" aria-hidden="true">💰</span>
                        <p class="empty-title">Nenhuma cobrança</p>
                        <p class="empty-text">Gere a primeira cobrança a partir de um contrato ativo.</p>
                        <button class="btn btn-primary btn-sm" data-component="charges" data-action="add">+ Gerar Cobrança</button>
                    </div>`;
            } else {
                if (charges.length > 20) html += '<div style="max-height:600px; overflow-y:auto; border:1px solid var(--border-color); border-radius:8px;">';

                html += `
                    <table class="table">
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
                                <th style="text-align:center;">Pago?</th>
                                <th style="text-align:center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>`;

                charges.forEach(c => {
                    const diasAtraso   = parseInt(c.dias_atraso) || 0;
                    const juros        = parseFloat(c.juros) || 0;
                    const valorComJuros = parseFloat(c.valor_com_juros) || parseFloat(c.total_amount);
                    const isPaid       = c.status === 'paid';
                    const isOverdue    = (c.status === 'overdue' || diasAtraso > 0) && !isPaid;

                    const rowClass = isOverdue ? 'row-overdue' : '';

                    // Serviços ícones
                    let servicosHtml = '—';
                    if (c.services && c.services.length > 0) {
                        const icons = c.services.filter(s => s && s.icon).map(s => `<i class="${s.icon} service-icon"></i>`);
                        if (icons.length) {
                            servicosHtml = `<span title="${c.services.map(s => `${s.description}: +${formatCurrency(s.amount)}`).join(', ')}">${icons.join(' ')}</span>`;
                        }
                    }

                    const atrasoHtml = (diasAtraso > 0 && !isPaid)
                        ? `<span class="badge badge-danger">${diasAtraso} dias</span>` : '—';

                    const jurosHtml = (juros > 0 && !isPaid)
                        ? `<span style="color:var(--danger);">+${formatCurrency(juros)}</span>` : '—';

                    const totalHtml = (juros > 0 && !isPaid)
                        ? `<strong style="color:var(--danger);">${formatCurrency(valorComJuros)}</strong>`
                        : formatCurrency(c.total_amount);

                    const pagoHtml = isPaid
                        ? '<span class="check-paid" title="Pago"><i class="fa-solid fa-check"></i></span>'
                        : `<button class="btn-check" data-component="charges" data-action="quick-pay" data-id="${c.id}" title="Marcar como pago"><i class="fa-regular fa-square"></i></button>`;

                    const acoesHtml = isPaid ? '—' : `
                        <button class="btn btn-sm btn-secondary" data-component="charges" data-action="adjust" data-id="${c.id}">Ajustar</button>
                        <button class="btn btn-sm btn-danger" data-component="charges" data-action="void" data-id="${c.id}">Excluir</button>`;

                    html += `<tr class="${rowClass}">
                        <td data-label="Unidade">${c.property_address || 'N/A'}</td>
                        <td data-label="Inquilino">${c.tenant_name}</td>
                        <td data-label="Valor">${formatCurrency(c.total_amount)}</td>
                        <td data-label="Serviços">${servicosHtml}</td>
                        <td data-label="Vencimento">${formatDate(c.due_date)}</td>
                        <td data-label="Atraso">${atrasoHtml}</td>
                        <td data-label="Juros">${jurosHtml}</td>
                        <td data-label="Total c/ Juros">${totalHtml}</td>
                        <td data-label="Pago?" style="text-align:center;">${pagoHtml}</td>
                        <td data-label="Ações" class="td-actions" style="text-align:center;">${acoesHtml}</td>
                    </tr>`;
                });

                html += '</tbody></table>';
                if (charges.length > 20) html += '</div>';
            }

            html += '</div></div>';
            this.contentContainer.innerHTML = html;
        } catch (error) {
            this.contentContainer.innerHTML = `<div class="error-message show">${error.message}</div>`;
        }
    },

    // ─── Formulários / Modais ────────────────────────────────────

    async showChargeForm() {
        try {
            const contracts = await apiCall('/contracts');

            let options = '<option value="">Selecione...</option>';
            contracts.forEach(c => {
                options += `<option value="${c.id}">${c.property_address || c.location_name} - ${c.tenant_name}</option>`;
            });

            const form = `
                <h2>Gerar Cobrança</h2>
                <form id="charge-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Contrato *</label>
                            <select id="charge-contract" required>${options}</select>
                        </div>
                        <div class="form-group">
                            <label>Mês de Referência *</label>
                            <input type="month" id="charge-ref-month" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Data de Vencimento *</label>
                            <input type="date" id="charge-due-date" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                        <button type="submit" class="btn btn-primary">Gerar</button>
                    </div>
                </form>`;

            openModal(form);
        } catch (error) {
            alert('Erro ao carregar contratos: ' + error.message);
        }
    },

    async quickPay(chargeId) {
        try {
            const charges = await apiCall(this.baseUrl);
            const charge = charges.find(c => c.id === chargeId);
            if (!charge) { showToast('Cobrança não encontrada', 'error'); return; }

            const diasAtraso    = parseInt(charge.dias_atraso) || 0;
            const juros         = parseFloat(charge.juros) || 0;
            const valorOriginal = parseFloat(charge.total_amount);
            const valorComJuros = parseFloat(charge.valor_com_juros) || valorOriginal;

            this._showPaymentModal({
                chargeId,
                valorOriginal,
                diasAtraso,
                juros,
                valorComJuros,
                tenantName: charge.tenant_name,
                propertyAddress: charge.property_address,
                dueDate: charge.due_date,
                taxaDiaria: charge.late_fee_daily
            });
        } catch (error) {
            showToast('Erro: ' + error.message, 'error');
        }
    },

    _showPaymentModal({ chargeId, valorOriginal, diasAtraso, juros, valorComJuros, tenantName, propertyAddress, dueDate, taxaDiaria }) {
        const hoje = new Date().toISOString().split('T')[0];

        const form = `
            <h2>💵 Confirmar Pagamento</h2>
            <div class="payment-summary-box">
                <p class="payment-label">Inquilino</p>
                <p class="payment-value">${tenantName}</p>
                <p class="payment-label">Unidade</p>
                <p class="payment-value">${propertyAddress}</p>
            </div>

            <form id="payment-form"
                  data-charge-id="${chargeId}"
                  data-valor-original="${valorOriginal}"
                  data-juros="${juros}"
                  data-valor-com-juros="${valorComJuros}"
                  data-due-date="${dueDate}"
                  data-taxa="${taxaDiaria || 0.0333}">
                <div class="form-group">
                    <label><i class="fa-solid fa-calendar"></i> Data do Pagamento *</label>
                    <input type="date" id="pmt-date" value="${hoje}" required>
                    <small>Informe o dia real em que o pagamento foi efetuado</small>
                </div>

                <div class="payment-summary-box">
                    <div class="payment-row">
                        <span>Valor original:</span>
                        <strong>${formatCurrency(valorOriginal)}</strong>
                    </div>
                    <div class="payment-row" style="border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:12px;">
                        <span style="color:var(--danger-color);">
                            <i class="fa-solid fa-plus" style="font-size:10px;"></i>
                            Juros (<span id="pmt-dias">${diasAtraso}</span> dia${diasAtraso !== 1 ? 's' : ''}):
                        </span>
                        <strong style="color:var(--danger-color);" id="pmt-juros">+${formatCurrency(juros)}</strong>
                    </div>
                    <div class="payment-row" style="font-size:18px;">
                        <strong>Valor a pagar:</strong>
                        <strong style="color:var(--primary-color);" id="pmt-total">${formatCurrency(valorComJuros)}</strong>
                    </div>
                </div>

                <div class="form-group">
                    <label>Valor efetivamente pago (R$) *</label>
                    <input type="number" id="pmt-amount" step="0.01" value="${valorComJuros.toFixed(2)}" required>
                    <small>Altere se o valor pago foi diferente do calculado</small>
                </div>

                <div class="form-group">
                    <label>Método de Pagamento *</label>
                    <select id="pmt-method" required>
                        <option value="pix">PIX</option>
                        <option value="boleto">Boleto</option>
                        <option value="deposito">Depósito</option>
                        <option value="transferencia">Transferência</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cheque">Cheque</option>
                    </select>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Confirmar Pagamento</button>
                </div>
            </form>`;

        openModal(form);
    },

    showAdjustForm(chargeId) {
        const form = `
            <h2>Ajustar Cobrança</h2>
            <form id="adjust-charge-form" data-charge-id="${chargeId}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Descrição *</label>
                        <input type="text" id="adj-desc" placeholder="Ex: Desconto ou taxa extra" required>
                    </div>
                    <div class="form-group">
                        <label>Tipo *</label>
                        <select id="adj-type" required>
                            <option value="fee">Taxa extra</option>
                            <option value="discount">Desconto</option>
                            <option value="service">Serviço</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Valor *</label>
                        <input type="number" id="adj-amount" step="0.01" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar Ajuste</button>
                </div>
            </form>`;

        openModal(form);
    },

    async _voidCharge(chargeId) {
        if (!confirm('Deseja excluir esta cobrança?')) return;
        try {
            await apiCall(`${this.baseUrl}/${chargeId}/void`, 'PUT');
            showToast('Cobrança excluída com sucesso', 'success');
            await this.renderList();
        } catch (error) {
            showToast('Erro: ' + error.message, 'error');
        }
    },

    // ─── Recálculo de juros dinâmico ─────────────────────────────

    _recalcJuros() {
        const form = document.getElementById('payment-form');
        if (!form) return;

        const valorOriginal = parseFloat(form.dataset.valorOriginal);
        const dueDate       = form.dataset.dueDate;
        const taxa          = parseFloat(form.dataset.taxa) || 0.0333;
        const dataPago      = new Date(document.getElementById('pmt-date').value + 'T00:00:00');
        const dataParcela   = new Date(dueDate);

        let novosDias = 0, novosJuros = 0;
        if (dataPago > dataParcela) {
            novosDias  = Math.floor((dataPago - dataParcela) / (1000 * 60 * 60 * 24));
            novosJuros = valorOriginal * (taxa / 100) * novosDias;
        }
        const novoTotal = valorOriginal + novosJuros;

        const elDias  = document.getElementById('pmt-dias');
        const elJuros = document.getElementById('pmt-juros');
        const elTotal = document.getElementById('pmt-total');
        if (elDias)  elDias.textContent  = novosDias;
        if (elJuros) elJuros.textContent = `+${formatCurrency(novosJuros)}`;
        if (elTotal) elTotal.textContent = formatCurrency(novoTotal);

        const amountInput = document.getElementById('pmt-amount');
        const oldJuros = parseFloat(form.dataset.valorComJuros);
        if (amountInput && (amountInput.value === oldJuros.toFixed(2) || amountInput.value === (valorOriginal + parseFloat(form.dataset.juros)).toFixed(2))) {
            amountInput.value = novoTotal.toFixed(2);
        }
    },

    // ─── Event Listeners ─────────────────────────────────────────

    attachEventListeners() {
        const self = this;
        this.contentContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-component="charges"]');
            if (!btn) return;
            e.preventDefault();

            // Proteger contra double-click
            if (self.isProcessing) {
                console.warn('[CHARGES] Operação em andamento, aguarde...');
                return;
            }

            const action = btn.getAttribute('data-action');
            const id     = parseInt(btn.getAttribute('data-id'));

            self.isProcessing = true;
            btn.disabled = true;

            switch (action) {
                case 'add':       self.showChargeForm(); break;
                case 'quick-pay': self.quickPay(id); break;
                case 'adjust':    self.showAdjustForm(id); break;
                case 'void':      self._voidCharge(id); break;
            }

            // Reabilitar após 800ms
            setTimeout(() => {
                self.isProcessing = false;
                btn.disabled = false;
            }, 800);
        });
    },

    attachModalListeners() {
        const self = this;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        modalBody.addEventListener('submit', async function (e) {
            const formId = e.target.id;
            if (!['charge-form', 'payment-form', 'adjust-charge-form'].includes(formId)) return;
            e.preventDefault();

            try {
                switch (formId) {
                    case 'charge-form': {
                        await apiCall('/charges', 'POST', {
                            contractId:     parseInt(document.getElementById('charge-contract').value),
                            referenceMonth: document.getElementById('charge-ref-month').value + '-01',
                            dueDate:        document.getElementById('charge-due-date').value
                        });
                        closeModal();
                        showToast('Cobrança gerada!', 'success');
                        await self.renderList();
                        break;
                    }
                    case 'payment-form': {
                        const form       = e.target;
                        const chargeId   = parseInt(form.dataset.chargeId);
                        const valorPago  = parseFloat(document.getElementById('pmt-amount').value);
                        const valorOrig  = parseFloat(form.dataset.valorOriginal);

                        await apiCall(`/charges/${chargeId}/quick-pay`, 'POST', {
                            amountPaid:    valorPago,
                            paymentDate:   document.getElementById('pmt-date').value,
                            paymentMethod: document.getElementById('pmt-method').value
                        });
                        closeModal();

                        const diff = valorPago - valorOrig;
                        showToast(`Pagamento registrado!\nOriginal: ${formatCurrency(valorOrig)}\nJuros: ${formatCurrency(diff)}\nTotal pago: ${formatCurrency(valorPago)}`, 'success');
                        await self.renderList();
                        break;
                    }
                    case 'adjust-charge-form': {
                        const chargeId   = parseInt(e.target.dataset.chargeId);
                        const type       = document.getElementById('adj-type').value;
                        let amount       = parseFloat(document.getElementById('adj-amount').value);
                        if (type === 'discount' && amount > 0) amount *= -1;

                        await apiCall(`/charges/${chargeId}/items`, 'POST', {
                            description: document.getElementById('adj-desc').value,
                            amount,
                            type
                        });
                        closeModal();
                        showToast('Ajuste aplicado com sucesso', 'success');
                        await self.renderList();
                        break;
                    }
                }
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });

        // Recálculo dinâmico de juros ao mudar data de pagamento
        modalBody.addEventListener('change', function (e) {
            if (e.target.id === 'pmt-date') {
                self._recalcJuros();
            }
        });
    }
};

App.register('charges', ChargesComponent);
