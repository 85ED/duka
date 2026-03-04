interface BadgeProps {
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  children: React.ReactNode;
}

export function Badge({ status, children }: BadgeProps) {
  const getStatusClass = () => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'overdue':
        return 'badge-danger';
      case 'canceled':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  };

  return <span className={`badge ${getStatusClass()}`}>{children}</span>;
}
