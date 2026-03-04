import { useEffect, useState } from 'react';
import { MetricCard } from './MetricCard';
import { formatCurrency } from '../../lib/formatters';
import { supabase } from '../../lib/supabase';

interface DashboardMetrics {
  toReceive: number;
  received: number;
  expenses: number;
  operationalResult: number;
  cashResult: number;
  defaultRate: number;
  defaultAccumulated: number;
  emptyUnits: number;
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    toReceive: 0,
    received: 0,
    expenses: 0,
    operationalResult: 0,
    cashResult: 0,
    defaultRate: 0,
    defaultAccumulated: 0,
    emptyUnits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      if (!properties || properties.length === 0) {
        setLoading(false);
        return;
      }

      const propertyIds = properties.map((p) => p.id);

      const { data: charges } = await supabase
        .from('charges')
        .select('*')
        .in('property_id', propertyIds)
        .gte('due_date', `${currentMonth}-01`)
        .lt('due_date', `${currentMonth}-31`);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .in('property_id', propertyIds)
        .gte('expense_date', `${currentMonth}-01`)
        .lt('expense_date', `${currentMonth}-31`);

      const toReceive = charges?.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
      const received = charges?.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const operationalResult = received - totalExpenses;
      const cashResult = toReceive - totalExpenses;

      const overdueCharges = charges?.filter((c) => c.status === 'overdue') || [];
      const totalCharges = charges?.length || 1;
      const defaultRate = (overdueCharges.length / totalCharges) * 100;

      setMetrics({
        toReceive,
        received,
        expenses: totalExpenses,
        operationalResult,
        cashResult,
        defaultRate,
        defaultAccumulated: overdueCharges.reduce((sum, c) => sum + c.amount, 0),
        emptyUnits: 0,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
        </div>
        <div className="metrics-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="metric-card skeleton">
              <div className="skeleton-line skeleton-text short"></div>
              <div className="skeleton-line skeleton-title"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Visão geral do mês</p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="A RECEBER NO MÊS"
          value={formatCurrency(metrics.toReceive)}
          variant="default"
        />

        <MetricCard
          label="RECEBIDO NO MÊS"
          value={formatCurrency(metrics.received)}
          variant="success"
        />

        <MetricCard
          label="DESPESAS DO MÊS"
          value={formatCurrency(metrics.expenses)}
          variant="danger"
        />

        <MetricCard
          label="RESULTADO OPERACIONAL"
          value={formatCurrency(metrics.operationalResult)}
          variant={metrics.operationalResult >= 0 ? 'success' : 'danger'}
        />

        <MetricCard
          label="RESULTADO DE CAIXA"
          value={formatCurrency(metrics.cashResult)}
          variant={metrics.cashResult >= 0 ? 'default' : 'danger'}
        />

        <MetricCard
          label="INADIMPLÊNCIA DO MÊS"
          value={`${metrics.defaultRate.toFixed(2)}%`}
          variant={metrics.defaultRate > 0 ? 'danger' : 'success'}
        />
      </div>
    </div>
  );
}
