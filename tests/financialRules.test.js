const assert = require('assert');
const rules = require('../src/services/financialRules');

function approxEqual(actual, expected, tolerance = 0.01) {
    assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${expected} got ${actual}`);
}

// Test 1: full month billing
{
    const contract = {
        id: 1,
        startDate: '2026-01-10',
        endDate: '2026-12-31',
        monthlyValue: 1120.00
    };
    const set = rules.buildSameDayReplacementSet([contract]);
    const result = rules.calcContractBillingForMonth(contract, 2026, 2, set);
    assert.strictEqual(result.daysActive, 28);
    approxEqual(result.roundedValue, 1120.00);
}

// Test 2: mid-month start
{
    const contract = {
        id: 2,
        startDate: '2026-02-10',
        endDate: '2026-12-31',
        monthlyValue: 1040.00
    };
    const set = rules.buildSameDayReplacementSet([contract]);
    const result = rules.calcContractBillingForMonth(contract, 2026, 2, set);
    assert.strictEqual(result.daysActive, 19);
    approxEqual(result.roundedValue, 705.71, 0.02);
}

// Test 3: mid-month end
{
    const contract = {
        id: 3,
        startDate: '2025-05-01',
        endDate: '2026-02-12',
        monthlyValue: 940.00
    };
    const set = rules.buildSameDayReplacementSet([contract]);
    const result = rules.calcContractBillingForMonth(contract, 2026, 2, set);
    assert.strictEqual(result.daysActive, 12);
    approxEqual(result.roundedValue, 402.86, 0.02);
}

// Test 4: same-day replacement (automatic rule)
{
    const oldContract = {
        id: 10,
        unit_id: 1,
        startDate: '2026-01-01',
        endDate: '2026-02-10',
        monthlyValue: 1000.00
    };
    const newContract = {
        id: 11,
        unit_id: 1,
        startDate: '2026-02-10',
        endDate: '2026-12-31',
        monthlyValue: 1000.00
    };
    const set = rules.buildSameDayReplacementSet([oldContract, newContract]);
    const oldResult = rules.calcContractBillingForMonth(oldContract, 2026, 2, set);
    const newResult = rules.calcContractBillingForMonth(newContract, 2026, 2, set);
    assert.strictEqual(oldResult.daysActive, 9);
    assert.strictEqual(newResult.daysActive, 19);
}

// Test 5: inadimplencia
{
    const rate = rules.calcInadimplenciaMes(9000.00, 900.00);
    approxEqual(rate, 10.00, 0.01);
}

// Test 6: inadimplencia com faturamento zero e divida
{
    const rate = rules.calcInadimplenciaMes(0, 100.00);
    assert.strictEqual(rate, null);
}

// Test 7: resultados
{
    const op = rules.calcResultadoOperacional(10000.00, 1500.00);
    const cx = rules.calcResultadoCaixa(8000.00, 1500.00);
    approxEqual(op, 8500.00, 0.01);
    approxEqual(cx, 6500.00, 0.01);
}

// Test 8: unidades adimplentes
{
    const pct = rules.calcUnidadesAdimplentesMes(8, 10);
    approxEqual(pct, 80.00, 0.01);
}

// Test 9: recebido so confirmado
{
    const received = rules.calcRecebidoMes([
        { amount: '100.00', status: 'confirmed' },
        { amount: '50.00', status: 'pending' },
        { amount: '20.00', status: 'void' }
    ]);
    approxEqual(received, 100.00, 0.01);
}

console.log('All financialRules tests passed.');
