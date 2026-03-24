import { Link, useLocation } from 'react-router-dom'
import { Activity, Map, TrendingUp, BookOpen, Shield } from 'lucide-react'

const NAV_LINKS = [
  { path: '/dashboard',   label: 'Dashboard',    icon: Map },
  { path: '/trends',      label: 'Trends',       icon: TrendingUp }
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-50 border-b border-navy-500"
      style={{ background: 'rgba(7, 12, 24, 0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f4a261 0%, #e76f51 100%)' }}>
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-sm text-white leading-none block">SafeRoute AI</span>
            <span className="text-[10px] font-mono text-gray-500 leading-none">Hyderabad Risk Intelligence</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ path, label, icon: Icon }) => {
            const active = pathname === path
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-1.5 px-5 py-3 rounded-lg text-xs font-body font-medium transition-all duration-150
                  ${active
                    ? 'bg-navy-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-navy-600'
                  }`}
              >
                <Icon size={13} />
                {label}
              </Link>
            )
          })}
        </div>


      </div>
    </nav>
  )
}
