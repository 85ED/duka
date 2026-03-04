import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ChargeCard } from './ChargeCard';
import { Button } from '../shared/Button';
import { supabase } from '../../lib/supabase';

interface Charge {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  tenant_name?: string;
  property_name?: string;
}

export function Charges() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharges();
  }, []);

  async function loadCharges() {
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

      const { data: chargesData } = await supabase
        .from('charges')
        .select(`
          id,
          amount,
          due_date,
          paid_date,
          status,
          property_id,
          contract_id
        `)
        .in('property_id', propertyIds)
        .order('due_date', { ascending: false });

      const enrichedCharges = (chargesData || []).map((charge) => ({
        ...charge,
        property_name: propertyMap[charge.property_id],
        tenant_name: 'Inquilino',
      }));

      setCharges(enrichedCharges);
    } catch (error) {
      console.error('Error loading charges:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (id: string) => {
    console.log('Edit charge:', id);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir esta cobrança?');
    if (!confirmed) return;

    try {
      await supabase.from('charges').delete().eq('id', id);
      setCharges(charges.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Error deleting charge:', error);
    }
  };

  const handleCreate = () => {
    console.log('Create new charge');
  };

  if (loading) {
    return (
      <div className="charges-container">
        <div className="charges-header">
          <h1 className="charges-title">Cobranças</h1>
        </div>
        <div className="charges-list">
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

  if (charges.length === 0) {
    return (
      <div className="charges-container">
        <div className="charges-header">
          <h1 className="charges-title">Cobranças</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3 className="empty-title">Nenhuma cobrança por aqui ainda</h3>
          <p className="empty-text">Adicione a primeira cobrança para começar</p>
          <Button icon={<Plus size={20} />} onClick={handleCreate}>
            Adicionar cobrança
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="charges-container">
      <div className="charges-header">
        <h1 className="charges-title">Cobranças</h1>
        <Button icon={<Plus size={20} />} onClick={handleCreate} size="sm">
          Nova
        </Button>
      </div>

      <div className="charges-list">
        {charges.map((charge) => (
          <ChargeCard
            key={charge.id}
            charge={charge}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
