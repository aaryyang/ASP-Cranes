import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Cog, 
  FileText, 
  Truck,
  Users,
  WrenchIcon
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { getLeads } from '../services/leadService';
import { getJobs, getAllEquipment, getAllOperators } from '../services/jobService';
import { Lead } from '../types/lead';
import { Job } from '../types/job';
import { Link } from 'react-router-dom';

export function OperationsManagerDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [operatorCount, setOperatorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsData, jobsData, equipmentData, operatorsData] = await Promise.all([
          getLeads(),
          getJobs(),
          getAllEquipment(),
          getAllOperators(),
        ]);
        
        setLeads(leadsData);
        setJobs(jobsData);
        setEquipmentCount(equipmentData.length);
        setOperatorCount(operatorsData.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Count jobs by status
  const scheduledJobsCount = jobs.filter(job => job.status === 'scheduled').length;
  const completedJobsCount = jobs.filter(job => job.status === 'completed').length;
  
  if (isLoading) {
    return <div className="flex justify-center py-10">Loading dashboard...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Scheduled Jobs"
          value={scheduledJobsCount}
          icon={<Calendar className="h-5 w-5 text-secondary-600" />}
          variant="secondary"
        />
        <StatCard
          title="Equipment"
          value={equipmentCount}
          icon={<Truck className="h-5 w-5 text-accent-600" />}
          variant="accent"
        />
        <StatCard
          title="Operators"
          value={operatorCount}
          icon={<Users className="h-5 w-5 text-success-600" />}
          variant="success"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Won Leads</CardTitle>
                <Link to="/jobs">
                  <Button variant="outline" size="sm">Schedule Jobs</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No leads to schedule</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leads.slice(0, 5).map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{lead.customerName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{lead.serviceNeeded}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{lead.siteLocation}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button size="sm">Schedule</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link to="/config/equipment">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<Truck size={16} />}>
                    Manage Equipment
                  </Button>
                </Link>
                
                <Link to="/config/operators">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<Users size={16} />}>
                    Manage Operators
                  </Button>
                </Link>
                
                <Link to="/jobs">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<Calendar size={16} />}>
                    View Job Calendar
                  </Button>
                </Link>
                
                <Link to="/feedback">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<CheckCircle2 size={16} />}>
                    Review Completed Jobs
                  </Button>
                </Link>
                
                <Link to="/config">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<Cog size={16} />}>
                    System Configuration
                  </Button>
                </Link>
                
                <Link to="/config/maintenance">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<WrenchIcon size={16} />}>
                    Schedule Maintenance
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Job Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent job activity</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{job.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{job.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(job.startDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={job.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}