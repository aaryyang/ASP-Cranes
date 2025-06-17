import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar,
  Clock,
  Download,
  FileText,
  MapPin,
  Send,
  Truck,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { TextArea } from '../components/common/TextArea';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { getJobById } from '../services/jobService';
import { Job } from '../types/job';

interface SafetyCheck {
  id: string;
  label: string;
  checked: boolean;
}

interface CustomerFeedback {
  rating: number;
  comments: string;
  submittedAt: string;
}

const SAFETY_CHECKS: SafetyCheck[] = [
  { id: 'ppe', label: 'PPE Used Correctly', checked: true },
  { id: 'site_clearance', label: 'Site Clearance Verified', checked: true },
  { id: 'emergency_contacts', label: 'Emergency Contact Shared', checked: true },
  { id: 'equipment_check', label: 'Equipment Pre-Check Complete', checked: true },
  { id: 'hazards_identified', label: 'Hazards Identified & Marked', checked: true },
  { id: 'communication', label: 'Communication Protocol Established', checked: true },
];

export function JobSummaryFeedback() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheck[]>(SAFETY_CHECKS);
  const [safetyNotes, setSafetyNotes] = useState('');
  const [isDiscountRequested, setIsDiscountRequested] = useState(false);
  const [discountReason, setDiscountReason] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<CustomerFeedback | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const jobData = await getJobById(id!);
      setJob(jobData);

      // Mock feedback data
      setFeedback({
        rating: 4.5,
        comments: "Great service, very professional team. Equipment arrived on time.",
        submittedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching job details:', error);
      showToast('Error fetching job details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSafetyCheckToggle = (checkId: string) => {
    setSafetyChecks(prev =>
      prev.map(check =>
        check.id === checkId
          ? { ...check, checked: !check.checked }
          : check
      )
    );
  };

  const handleSendFeedbackRequest = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Feedback request sent successfully', 'success');
    } catch (error) {
      showToast('Error sending feedback request', 'error');
    }
  };

  const handleDiscountRequest = async () => {
    if (!discountReason || !discountPercentage) {
      showToast('Please fill in all discount request fields', 'error');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Discount request submitted for approval', 'success');
    } catch (error) {
      showToast('Error submitting discount request', 'error');
    }
  };

  const handleDownloadSummary = () => {
    showToast('Summary downloaded successfully', 'success');
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  if (!user || (user.role !== 'admin' && user.role !== 'operations_manager' && user.role !== 'sales_agent' && user.role !== 'support')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 text-center">Loading job summary...</div>;
  }

  if (!job && !id) {
    return (
      <div className="p-6 text-center text-gray-500">
        Select a job to view its summary and feedback
      </div>
    );
  }

  if (!job) {
    return <div className="p-6 text-center text-gray-500">Job not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Job Summary & Feedback</h1>
          <p className="text-gray-500 mt-1">Job #{id}</p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Download size={16} />}
          onClick={handleDownloadSummary}
        >
          Download Summary
        </Button>
      </div>

      {/* Job Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                <p className="mt-1 text-lg">{job.customerName}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <div className="mt-1 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>{job.location}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Equipment</h3>
                <div className="mt-1 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <span>Tower Crane TC-80</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Operator</h3>
                <div className="mt-1 flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span>Mike Operator</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span>{new Date(job.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span>
                      {new Date(job.startDate).toLocaleTimeString()} - {new Date(job.endDate).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Observations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safetyChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-start gap-3"
                >
                  <button
                    className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 transition-colors ${
                      check.checked
                        ? 'border-success-500 bg-success-500'
                        : 'border-gray-300'
                    }`}
                    onClick={() => handleSafetyCheckToggle(check.id)}
                  >
                    {check.checked && (
                      <CheckCircle2 className="text-white h-4 w-4" />
                    )}
                  </button>
                  <span className="text-gray-700">{check.label}</span>
                </div>
              ))}
            </div>

            <TextArea
              label="Safety Notes"
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
              placeholder="Enter any additional safety observations..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Feedback */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Customer Feedback</CardTitle>
            <Button
              variant="outline"
              leftIcon={<Send size={16} />}
              onClick={handleSendFeedbackRequest}
            >
              Request Feedback
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {feedback ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${
                        star <= feedback.rating
                          ? 'text-warning-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-lg font-medium">{feedback.rating}</span>
              </div>

              <p className="text-gray-600">{feedback.comments}</p>

              <p className="text-sm text-gray-500">
                Submitted on {new Date(feedback.submittedAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No feedback received yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Discount Request */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requestDiscount"
                checked={isDiscountRequested}
                onChange={(e) => setIsDiscountRequested(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="requestDiscount" className="text-sm text-gray-700">
                Request discount approval
              </label>
            </div>

            {isDiscountRequested && (
              <div className="space-y-4">
                <TextArea
                  label="Reason for Discount"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Explain why a discount is being requested..."
                  rows={3}
                />

                <div className="w-48">
                  <Input
                    type="number"
                    label="Discount Percentage"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="Enter %"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleDiscountRequest}>
                    Submit for Approval
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}