import { useState, useRef } from 'react';
import { CreditCard as Edit2, Trash2 } from 'lucide-react';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { formatCurrency, formatDate, isOverdue, getStatusLabel } from '../../lib/formatters';

interface Charge {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  tenant_name?: string;
  property_name?: string;
}

interface ChargeCardProps {
  charge: Charge;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChargeCard({ charge, onEdit, onDelete }: ChargeCardProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    if (Math.abs(diff) > 10) {
      setOffset(Math.max(-160, Math.min(0, diff)));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;

    if (offset < -80) {
      setOffset(-160);
    } else {
      setOffset(0);
    }
  };

  const getActualStatus = () => {
    if (charge.status === 'pending' && isOverdue(charge.due_date, charge.paid_date)) {
      return 'overdue';
    }
    return charge.status;
  };

  const actualStatus = getActualStatus();

  return (
    <div className="swipeable-card">
      <div className="card-actions-right">
        <button
          className="action-btn action-edit"
          onClick={() => {
            onEdit(charge.id);
            setOffset(0);
          }}
        >
          <Edit2 size={20} />
        </button>
        <button
          className="action-btn action-delete"
          onClick={() => {
            onDelete(charge.id);
            setOffset(0);
          }}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <Card
        className="charge-card-content"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="charge-header">
            <h3 className="charge-property">{charge.property_name || 'Imóvel'}</h3>
            <Badge status={actualStatus}>{getStatusLabel(actualStatus)}</Badge>
          </div>

          <div className="charge-tenant">
            <span className="charge-label">INQUILINO</span>
            <span className="charge-value">{charge.tenant_name || 'Não informado'}</span>
          </div>

          <div className="charge-details">
            <div className="charge-detail-item">
              <span className="charge-label">VALOR</span>
              <span className="charge-amount">{formatCurrency(charge.amount)}</span>
            </div>

            <div className="charge-detail-item">
              <span className="charge-label">VENCIMENTO</span>
              <span className="charge-value">{formatDate(charge.due_date)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
