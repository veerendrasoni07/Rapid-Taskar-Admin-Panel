import { Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex flex-1 items-center">
        {/* Search bar removed as per request */}
      </div>
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        <button type="button" className="-m-2.5 p-2.5 text-secondary hover:text-text">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

        <div className="flex items-center gap-x-4">
          <button type="button" className="flex items-center p-1.5">
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <span className="ml-3 hidden text-sm font-semibold leading-6 text-text lg:block">
              Admin User
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
