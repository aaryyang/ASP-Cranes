import { Notification, NotificationType } from '../types/notification';

// Mock Notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    userId: '3', // Mike Operator
    type: 'job_assigned',
    title: 'New Job Assigned',
    message: 'You have been assigned to a new job for Skyrise Developers',
    read: false,
    createdAt: '2023-09-25T14:35:00Z',
    link: '/operator/jobs/1',
  },
  {
    id: '2',
    userId: '2', // Sara Manager
    type: 'lead_status_change',
    title: 'Lead Status Updated',
    message: 'Lead "Skyrise Developers" has been marked as Won',
    read: true,
    createdAt: '2023-09-22T16:15:00Z',
    link: '/manager/leads/3',
  },
  {
    id: '3',
    userId: '1', // John Sales
    type: 'quotation_created',
    title: 'Quotation Created',
    message: 'A new quotation has been created for BuildRight Inc',
    read: false,
    createdAt: '2023-09-26T10:20:00Z',
    link: '/sales/quotations/1',
  },
];

// Get notifications for a user
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  return MOCK_NOTIFICATIONS.filter(n => n.userId === userId).map(n => ({ ...n }));
};

// Mark notification as read
export const markNotificationAsRead = async (id: string): Promise<Notification | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === id);
  if (index === -1) return null;
  
  MOCK_NOTIFICATIONS[index] = {
    ...MOCK_NOTIFICATIONS[index],
    read: true,
  };
  
  return { ...MOCK_NOTIFICATIONS[index] };
};

// Create notification
const createNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<Notification> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newNotification: Notification = {
    ...notification,
    id: Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
    read: false,
  };
  
  MOCK_NOTIFICATIONS.push(newNotification);
  return { ...newNotification };
};

// Get unread notifications count
const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const notifications = await getUserNotifications(userId);
  return notifications.filter(n => !n.read).length;
};