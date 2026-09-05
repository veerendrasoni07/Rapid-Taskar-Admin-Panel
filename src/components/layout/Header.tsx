import { User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex flex-1 items-center">
        {/* Search bar removed as per request */}
      </div>
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        <div className="flex items-center gap-x-4">
          <div className="flex items-center p-1.5">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <span className="ml-3 hidden text-sm font-semibold leading-6 text-text lg:block">
              Admin User
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-x-2 rounded-lg bg-error/10 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/20 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
