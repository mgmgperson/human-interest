import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/accounts',  label: 'Accounts' },
  { to: '/simulator', label: 'Simulator' },
];

/** Top navigation bar with logo and page links. */
export default function NavBar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
              <span className="text-white font-bold text-sm tracking-tight">H</span>
            </div>
            <span className="font-semibold text-slate-900">HSA Platform</span>
          </Link>

          {/* Page links */}
          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => {
              const active = pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
