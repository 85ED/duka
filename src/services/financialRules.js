const SCALE = 100000000n;

function parseDate(value) {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function maxDate(a, b) {
    return a > b ? a : b;
}

function minDate(a, b) {
    return a < b ? a : b;
}

function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}

function diffDaysInclusive(startDate, endDate) {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((endDate - startDate) / msPerDay) + 1;
}

function buildSameDayReplacementSet(contracts) {
    const startsByKey = new Map();
    contracts.forEach(c => {
        const key = c.unit_id ? `u:${c.unit_id}` : `p:${c.property_id}`;
        const set = startsByKey.get(key) || new Set();
        if (c.startDate) set.add(c.startDate);
        startsByKey.set(key, set);
    });

    const exclusiveSet = new Set();
    contracts.forEach(c => {
        if (!c.endDate) return;
        const key = c.unit_id ? `u:${c.unit_id}` : `p:${c.property_id}`;
        const set = startsByKey.get(key);
        if (set && set.has(c.endDate)) {
            exclusiveSet.add(c.id);
        }
    });

    return exclusiveSet;
}

function getActiveDaysInMonth(contract, year, month, sameDayReplacementSet) {
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month - 1, daysInMonth(year, month)));

    const start = parseDate(contract.startDate);
    if (!start) return 0;

    let end = contract.endDate ? parseDate(contract.endDate) : monthEnd;
    if (sameDayReplacementSet && sameDayReplacementSet.has(contract.id) && end) {
        end = addDays(end, -1);
    }

    const activeStart = maxDate(start, monthStart);
    const activeEnd = minDate(end, monthEnd);

    if (activeEnd < activeStart) return 0;
    return diffDaysInclusive(activeStart, activeEnd);
}

function parseToCents(value) {
    if (value === null || value === undefined) return 0n;
    const raw = String(value).trim().replace(',', '.');
    const negative = raw.startsWith('-');
    const normalized = negative ? raw.slice(1) : raw;
    const [intPart, fracPart = ''] = normalized.split('.');
    const frac = (fracPart + '00').slice(0, 2);
    const cents = BigInt(intPart || '0') * 100n + BigInt(frac || '0');
    return negative ? -cents : cents;
}

function centsToNumber(cents) {
    return Number(cents) / 100;
}

function roundScaledToCents(rawScaled) {
    if (rawScaled >= 0n) {
        return (rawScaled + SCALE / 2n) / SCALE;
    }
    return (rawScaled - SCALE / 2n) / SCALE;
}

function calcDailyValue(monthlyValueCents, year, month) {
    const dim = daysInMonth(year, month);
    return (monthlyValueCents * SCALE) / BigInt(dim);
}

function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
}

function calcContractBillingForMonth(contract, year, month, sameDayReplacementSet) {
    const monthlyCents = parseToCents(contract.monthlyValue);
    const dailyScaled = calcDailyValue(monthlyCents, year, month);
    const daysActive = getActiveDaysInMonth(contract, year, month, sameDayReplacementSet);
    const rawScaled = dailyScaled * BigInt(daysActive);
    const roundedCents = roundScaledToCents(rawScaled);

    return {
        daysActive,
        dailyScaled,
        rawScaled,
        roundedCents,
        roundedValue: centsToNumber(roundedCents)
    };
}

function calcFaturamentoMes(contracts, year, month) {
    const sameDayReplacementSet = buildSameDayReplacementSet(contracts);
    const details = contracts.map(c => calcContractBillingForMonth(c, year, month, sameDayReplacementSet));
    const rawTotalScaled = details.reduce((sum, d) => sum + d.rawScaled, 0n);
    const roundedTotalCents = roundScaledToCents(rawTotalScaled);
    return {
        rawTotalScaled,
        roundedTotalCents,
        roundedTotal: centsToNumber(roundedTotalCents),
        details
    };
}

function calcRecebidoMes(payments) {
    const totalCents = payments.reduce((sum, p) => {
        const status = String(p.status || '').toLowerCase();
        if (status && status !== 'confirmed') return sum;
        const cents = parseToCents(p.amount);
        if (cents <= 0n) return sum;
        return sum + cents;
    }, 0n);
    return centsToNumber(totalCents);
}

function calcInadimplenciaMes(faturamentoMes, naoPagoMes) {
    if (!faturamentoMes || faturamentoMes <= 0) {
        return naoPagoMes > 0 ? null : 0;
    }
    const ratio = (naoPagoMes / faturamentoMes) * 100;
    return roundTo(ratio, 2);
}

function calcResultadoOperacional(faturamentoMes, despesasMes) {
    return roundTo(faturamentoMes - despesasMes, 2);
}

function calcResultadoCaixa(recebidoMes, despesasMes) {
    return roundTo(recebidoMes - despesasMes, 2);
}

function calcUnidadesAdimplentesMes(contratosSemAtraso, contratosAtivos) {
    if (!contratosAtivos || contratosAtivos <= 0) return 0;
    const ratio = (contratosSemAtraso / contratosAtivos) * 100;
    return roundTo(ratio, 2);
}

module.exports = {
    daysInMonth,
    buildSameDayReplacementSet,
    getActiveDaysInMonth,
    parseToCents,
    centsToNumber,
    calcDailyValue,
    calcContractBillingForMonth,
    calcFaturamentoMes,
    calcRecebidoMes,
    calcInadimplenciaMes,
    calcResultadoOperacional,
    calcResultadoCaixa,
    calcUnidadesAdimplentesMes,
    roundTo
};
