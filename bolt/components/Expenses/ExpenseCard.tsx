import { useState, useRef } from 'react';
import { CreditCard as Edit2, Trash2 } from 'lucide-react';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { formatCurrency, formatDate, getStatusLabel } from '../../lib/formatters';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  status: 'pending' | 'paid' | 'canceled';
  property_name?: string;
}

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
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

  const statusMap: Record<string, 'pending' | 'paid' | 'overdue' | 'canceled'> = {
    pending: 'pending',
    paid: 'paid',
    canceled: 'canceled',
  };

  return (
    <div className="swipeable-card">
      <div className="card-actions-right">
        <button
          className="action-btn action-edit"
          onClick={() => {
            onEdit(expense.id);
            setOffset(0);
          }}
        >
          <Edit2 size={20} />
        </button>
        <button
          className="action-btn action-delete"
          onClick={() => {
            onDelete(expense.id);
            setOffset(0);
          }}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <Card
        className="expense-card-content"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="expense-header">
            <h3 className="expense-property">{expense.property_name || 'Geral'}</h3>
            <Badge status={statusMap[expense.status]}>{getStatusLabel(expense.status)}</Badge>
          </div>

          <div className="expense-category">
            <span className="expense-label">CATEGORIA</span>
            <span className="expense-value">{expense.category}</span>
          </div>

          <div className="expense-description">
            <span className="expense-label">DESCRIÇÃO</span>
            <span className="expense-value">{expense.description}</span>
          </div>

          <div className="expense-details">
            <div className="expense-detail-item">
              <span className="expense-label">VALOR</span>
              <span className="expense-amount">{formatCurrency(expense.amount)}</span>
            </div>

            <div className="expense-detail-item">
              <span className="expense-label">DATA</span>
              <span className="expense-value">{formatDate(expense.expense_date)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
