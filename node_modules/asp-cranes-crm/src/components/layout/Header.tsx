import { useState, useEffect } from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { getUserNotifications, markNotificationAsRead } from '../../services/notificationService';
import { Notification } from '../../types/notification';
import { Badge } from '../common/Badge';

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);
  
  const fetchNotifications = async () => {
    if (user) {
      const userNotifications = await getUserNotifications(user.id);
      setNotifications(userNotifications);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      fetchNotifications();
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
    return (
    <header className="bg-white border-b border-gray-200 h-14 md:h-16 flex items-center justify-between px-2 sm:px-4 md:px-6 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center">
        {onMobileMenuClick && (
          <button
            onClick={onMobileMenuClick}
            className="p-1.5 rounded-md hover:bg-gray-100 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <div className="ml-2 text-sm md:text-base font-medium text-gray-800 hidden xs:block">
          ASP CRM
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-3">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 hover:bg-gray-100 rounded-full relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <Badge variant="error" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </button>
            {showNotifications && (
            <>
              <div 
                className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-[280px] sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-w-[calc(100vw-16px)]">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-500 p-1 rounded-full"
                    >
                      <span className="sr-only">Close</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">No notifications</p>
                  ) : (
                    <div className="mt-1 space-y-1.5 max-h-[60vh] overflow-y-auto">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left p-2 rounded-md hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
          <button
          onClick={handleLogout}
          className="p-1.5 hover:bg-gray-100 rounded-full flex items-center"
          title="Logout"
        >
          <LogOut className="h-5 w-5 text-gray-600" />
          <span className="ml-1.5 text-sm text-gray-700 hidden sm:inline">Logout</span>
        </button>
        
        {user?.avatar && (
          <div className="hidden sm:block ml-1">
            <img
              src={user.avatar || 'https://images.pexels.com/photos/4126743/pexels-photo-4126743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'}
              alt={user?.name || 'User'}
              className="h-8 w-8 rounded-full object-cover border border-gray-200"
            />
          </div>
        )}
      </div>
    </header>
  );
}