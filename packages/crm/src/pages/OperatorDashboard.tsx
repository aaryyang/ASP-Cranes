import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck, 
  UserCircle, 
  XCircle 
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { getJobsByOperator, getEquipmentById } from '../services/jobService';
import { useAuthStore } from '../store/authStore';
import { Job, Equipment } from '../types/job';
import { Toast } from '../components/common/Toast';

export function OperatorDashboard() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipment, setEquipment] = useState<Record<string, Equipment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
  }>({ show: false, title: '' });
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const jobsData = await getJobsByOperator(user.id);
        setJobs(jobsData);
        
        // Fetch equipment for each job
        const equipmentData: Record<string, Equipment> = {};
        for (const job of jobsData) {
          if (!equipmentData[job.equipmentId]) {
            const equipmentInfo = await getEquipmentById(job.equipmentId);
            if (equipmentInfo) {
              equipmentData[job.equipmentId] = equipmentInfo;
            }
          }
        }
        setEquipment(equipmentData);
      } catch (error) {
        console.error('Error fetching operator data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const handleJobAction = (jobId: string, action: 'accept' | 'reject' | 'complete') => {
    setJobs(prev => 
      prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: action === 'accept' 
                ? 'accepted' 
                : action === 'reject' 
                  ? 'rejected' 
                  : 'completed' 
            }
          : job
      )
    );
    
    // Show toast notification
    setToast({
      show: true,
      title: action === 'accept' 
        ? 'Job Accepted' 
        : action === 'reject' 
          ? 'Job Rejected' 
          : 'Job Completed',
      description: `Job for ${jobs.find(j => j.id === jobId)?.customerName} has been ${action}ed.`,
      variant: action === 'reject' ? 'warning' : 'success',
    });
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };
  
  // Count jobs by status
  const scheduledJobsCount = jobs.filter(job => job.status === 'scheduled').length;
  const acceptedJobsCount = jobs.filter(job => job.status === 'accepted').length;
  const completedJobsCount = jobs.filter(job => job.status === 'completed').length;
  
  // Get upcoming jobs (scheduled or accepted)
  const upcomingJobs = jobs.filter(job => 
    job.status === 'scheduled' || job.status === 'accepted'
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  if (isLoading) {
    return <div className="flex justify-center py-10">Loading dashboard...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Scheduled Jobs"
          value={scheduledJobsCount}
          icon={<Calendar className="h-5 w-5 text-primary-600" />}
          variant="primary"
        />
        <StatCard
          title="Accepted Jobs"
          value={acceptedJobsCount}
          icon={<CheckCircle2 className="h-5 w-5 text-success-600" />}
          variant="success"
        />
        <StatCard
          title="Completed Jobs"
          value={completedJobsCount}
          icon={<Clock className="h-5 w-5 text-secondary-600" />}
          variant="secondary"
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming jobs</p>
          ) : (
            <div className="space-y-4">
              {upcomingJobs.map((job) => (
                <Card key={job.id} variant="bordered" className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-4 md:p-6 flex-1">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-semibold">{job.customerName}</h3>
                        <StatusBadge status={job.status} />
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Truck className="mr-2 h-4 w-4 text-gray-400" />
                          <span>{equipment[job.equipmentId]?.name || 'Equipment'}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                          <span>{job.location}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-2 h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(job.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(job.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t md:border-t-0 md:border-l border-gray-200 p-4 bg-gray-50 flex flex-row md:flex-col justify-center space-x-2 md:space-x-0 md:space-y-2">
                      {job.status === 'scheduled' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            leftIcon={<CheckCircle2 size={16} />}
                            onClick={() => handleJobAction(job.id, 'accept')}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            leftIcon={<XCircle size={16} />}
                            onClick={() => handleJobAction(job.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {job.status === 'accepted' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<CheckCircle2 size={16} />}
                          onClick={() => handleJobAction(job.id, 'complete')}
                        >
                          Mark Complete
                        </Button>
                      )}
                      
                      {job.status === 'completed' && (
                        <p className="text-sm text-gray-500 italic">Completed</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Equipment Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(equipment).map((item) => (
                <div key={item.id} className="flex items-start p-3 border rounded-md">
                  <Truck className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
              
              {Object.keys(equipment).length === 0 && (
                <p className="text-gray-500 text-center py-4">No equipment assigned</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Operator Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center p-4 bg-gray-50 rounded-md">
              <div className="mr-4">
                <UserCircle className="h-16 w-16 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">{user?.name}</h3>
                <p className="text-gray-500">{user?.email}</p>
                <p className="text-gray-500 mt-1">Specialization: Mobile & Tower Cranes</p>
                <p className="text-gray-500">License: #CR-2023-456</p>
              </div>
            </div>
            
            <div className="mt-4">
              <Button variant="outline" size="sm" fullWidth>
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}