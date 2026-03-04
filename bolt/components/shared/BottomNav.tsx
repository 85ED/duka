import { Home, Receipt, TrendingDown, Menu } from 'lucide-react';

interface BottomNavProps {
  activeView: 'dashboard' | 'charges' | 'expenses' | 'more';
  onViewChange: (view: 'dashboard' | 'charges' | 'expenses' | 'more') => void;
}

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Início' },
    { id: 'charges' as const, icon: Receipt, label: 'Cobranças' },
    { id: 'expenses' as const, icon: TrendingDown, label: 'Despesas' },
    { id: 'more' as const, icon: Menu, label: 'Mais' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <Icon className="nav-icon" size={24} />
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
