import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  List, 
  FolderTree, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  AlertTriangle,
  BarChart
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Professionals', href: '/professionals', icon: Briefcase },
  { name: 'Services', href: '/services', icon: List },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Pricing', href: '/pricing', icon: DollarSign },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Reviews', href: '/reviews', icon: MessageSquare },
  { name: 'Complaints', href: '/complaints', icon: AlertTriangle },
  { name: 'Reports', href: '/reports', icon: BarChart },
];

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="text-xl font-bold text-primary">RapidTaskar</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                twMerge(
                  clsx(
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-secondary hover:bg-background hover:text-text'
                  )
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
