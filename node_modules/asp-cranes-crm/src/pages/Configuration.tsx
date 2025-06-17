import React, { useState, useEffect } from 'react';
import { Settings, IndianRupee, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { Equipment } from '../types/equipment';
import { getEquipment, updateEquipment } from '../services/firestore/equipmentService';
import { formatCurrency } from '../utils/formatters';

export function Configuration() {
  const { user } = useAuthStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editedRates, setEditedRates] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const data = await getEquipment();
      setEquipment(data);
      // Initialize edited rates with current base rates
      const rates: Record<string, number> = {};
      data.forEach(eq => {
        rates[eq.id] = eq.baseRate;
      });
      setEditedRates(rates);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Error fetching equipment', 'error');
    }
  };

  const handleRateChange = (equipmentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedRates(prev => ({
      ...prev,
      [equipmentId]: numValue
    }));
  };

  const handleSave = async (equipmentId: string) => {
    try {
      const equipment = await updateEquipment(equipmentId, {
        baseRate: editedRates[equipmentId]
      });
      showToast('Base rate updated successfully', 'success');
      
      // Update local equipment state
      setEquipment(prev => prev.map(eq => 
        eq.id === equipmentId ? equipment : eq
      ));
    } catch (error) {
      console.error('Error updating base rate:', error);
      showToast('Error updating base rate', 'error');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Configuration</h1>
        <Settings className="h-6 w-6 text-gray-400" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Base Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading equipment...</div>
          ) : (
            <div className="space-y-4">
              {equipment.map(eq => (
                <div 
                  key={eq.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{eq.name}</div>
                    <div className="text-sm text-gray-500">{eq.equipmentId}</div>
                    <div className="text-sm text-gray-500">
                      Current Rate: {formatCurrency(eq.baseRate)}/hr
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={editedRates[eq.id]}
                        onChange={(e) => handleRateChange(eq.id, e.target.value)}
                        className="pl-9 w-32"
                        min={0}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave(eq.id)}
                      disabled={eq.baseRate === editedRates[eq.id]}
                      leftIcon={<Save size={16} />}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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