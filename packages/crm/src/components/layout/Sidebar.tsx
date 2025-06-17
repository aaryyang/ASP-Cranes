import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clipboard, 
  Cog, 
  CreditCard, 
  FileText,
  Home, 
  Image,
  MessageSquare, 
  Settings, 
  Users,
  Building2, 
  X,
  Handshake,
  LogOut,
  Bot
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

import logo from '../../assets/asp-logo.jpg';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  roles: string[];
  end?: boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <Home size={20} />,
    href: '/dashboard',
    roles: ['admin', 'sales_agent', 'operations_manager', 'operator'],
    end: true,
  },
  {
    label: 'Leads',
    icon: <Clipboard size={20} />,
    href: '/leads',
    roles: ['admin', 'sales_agent'],
  },
  {
    label: 'Deals',
    icon: <Handshake size={20} />,
    href: '/deals',
    roles: ['admin', 'sales_agent'],
  },
  {
    label: 'Quotations',
    icon: <CreditCard size={20} />,
    href: '/quotations',
    roles: ['admin', 'sales_agent'],
  },
  {
    label: 'Customers',
    icon: <Building2 size={20} />,
    href: '/customers',
    roles: ['admin', 'sales_agent', 'operations_manager'],
  },
  {
    label: 'Job Scheduling',
    icon: <Calendar size={20} />,
    href: '/jobs',
    roles: ['admin', 'operations_manager', 'operator'],
  },
  {
    label: 'Site Assessment',
    icon: <Image size={20} />,
    href: '/site-assessment',
    roles: ['admin', 'operations_manager'],
  },
  {
    label: 'Configuration',
    icon: <Cog size={20} />,
    href: '/config',
    roles: ['admin', 'operations_manager'],
  },
  {
    label: 'User Management',
    icon: <Users size={20} />,
    href: '/config/users',
    roles: ['admin'],
  },
  {
    label: 'Equipment',
    icon: <Settings size={20} />,
    href: '/config/equipment',
    roles: ['admin', 'operations_manager'],
  },
  {
    label: 'Services',
    icon: <FileText size={20} />,
    href: '/config/services',
    roles: ['admin', 'operations_manager'],
  },
  {
    label: 'Feedback',
    icon: <MessageSquare size={20} />,
    href: '/feedback',
    roles: ['admin', 'operations_manager'],
  },
  {
    label: 'Templates',
    icon: <FileText size={20} />,
    href: '/templates',
    roles: ['admin', 'sales_agent'],
  },
  {
    label: 'AI Assistance',
    icon: <Bot size={20} />,
    href: '/assistance',
    roles: ['admin', 'sales_agent', 'operations_manager', 'operator'],
  },
];

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!user) return null;
  
  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));
  
  const isActive = (href: string, end?: boolean) => {
    if (end) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
    // Mobile overlay
  const mobileOverlay = (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
          <motion.div 
            className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85%] bg-white shadow-xl overflow-y-auto lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {renderSidebarContent(false)}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
  
  // Desktop sidebar
  const desktopSidebar = (
    <div 
      className={`hidden lg:block w-${isCollapsed ? '20' : '64'} flex-shrink-0 transition-all duration-300`}
    >
      <div className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 overflow-y-auto">
        {renderSidebarContent(isCollapsed)}
      </div>
    </div>
  );
  
  return (
    <>
      {mobileOverlay}
      {desktopSidebar}
    </>
  );
    function renderSidebarContent(collapsed: boolean) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <Link to="/dashboard" className="flex items-center">
            <img 
              src={logo} 
              alt="ASP Cranes" 
              className={`h-10 sm:h-12 w-auto object-contain ${collapsed ? 'mx-auto' : ''}`}
            />
          </Link>
          {!collapsed && onMobileClose && (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-md hover:bg-gray-100 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
          {!collapsed && !onMobileClose && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-md hover:bg-gray-100 hidden lg:block"
              aria-label="Collapse menu"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto pt-2 pb-4">
          <ul className="space-y-0.5 px-2 sm:px-3">
            {filteredNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center ${
                    collapsed ? 'justify-center px-2' : 'space-x-3 px-3'
                  } py-2.5 sm:py-2 rounded-md transition-colors group relative ${
                    isActive(item.href, item.end)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={onMobileClose}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="text-sm sm:text-base">{item.label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transform translate-x-2 group-hover:translate-x-0 transition-all z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
          <div className={`p-3 sm:p-4 border-t mt-auto ${collapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="flex-shrink-0">
              <img
                src={user?.avatar || 'https://images.pexels.com/photos/4126743/pexels-photo-4126743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'}
                alt={user?.name || 'User'}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-gray-200"
              />
            </div>
            {!collapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role.replace('_', ' ')}</p>
                <div className="mt-1">
                  <button 
                    onClick={() => {
                      if (onMobileClose) onMobileClose();
                      // Simulate logout functionality
                      const logoutEvent = new CustomEvent('sidebar-logout');
                      document.dispatchEvent(logoutEvent);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 inline-flex items-center"
                  >
                    <LogOut className="h-3 w-3 mr-1.5" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}