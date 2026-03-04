import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ExpenseCard } from './ExpenseCard';
import { Button } from '../shared/Button';
import { supabase } from '../../lib/supabase';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  status: 'pending' | 'paid' | 'canceled';
  property_name?: string;
}

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: properties } = await supabase
        .from('properties')
        .select('id, name')
        .eq('owner_id', user.id);

      if (!properties || properties.length === 0) {
        setLoading(false);
        return;
      }

      const propertyIds = properties.map((p) => p.id);
      const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p.name]));

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .in('property_id', propertyIds)
        .order('expense_date', { ascending: false });

      const enrichedExpenses = (expensesData || []).map((expense) => ({
        ...expense,
        property_name: propertyMap[expense.property_id],
      }));

      setExpenses(enrichedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (id: string) => {
    console.log('Edit expense:', id);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir esta despesa?');
    if (!confirmed) return;

    try {
      await supabase.from('expenses').delete().eq('id', id);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleCreate = () => {
    console.log('Create new expense');
  };

  if (loading) {
    return (
      <div className="expenses-container">
        <div className="expenses-header">
          <h1 className="expenses-title">Despesas</h1>
        </div>
        <div className="expenses-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card skeleton">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-text"></div>
              <div className="skeleton-line skeleton-text short"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="expenses-container">
        <div className="expenses-header">
          <h1 className="expenses-title">Despesas</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">💸</div>
          <h3 className="empty-title">Sem despesas este mês</h3>
          <p className="empty-text">Adicione gastos de manutenção, reparos, etc.</p>
          <Button icon={<Plus size={20} />} onClick={handleCreate}>
            Adicionar despesa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="expenses-container">
      <div className="expenses-header">
        <h1 className="expenses-title">Despesas</h1>
        <Button icon={<Plus size={20} />} onClick={handleCreate} size="sm">
          Nova
        </Button>
      </div>

      <div className="expenses-list">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
