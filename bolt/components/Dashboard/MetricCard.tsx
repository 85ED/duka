import { Card } from '../shared/Card';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'danger';
}

export function MetricCard({ label, value, trend, variant = 'default' }: MetricCardProps) {
  const variantClass = variant !== 'default' ? `metric-${variant}` : '';

  return (
    <Card className={`metric-card ${variantClass}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {trend && (
        <span className={`metric-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </Card>
  );
}
