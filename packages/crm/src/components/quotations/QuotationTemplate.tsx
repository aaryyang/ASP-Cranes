import React from 'react';
import { IndianRupee } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { Quotation } from '../../types/quotation';
import logo from '../../assets/asp-logo.jpg';

interface QuotationTemplateProps {
  quotation: Quotation;
  showPrices?: boolean;
  showHeader?: boolean;
}

export function QuotationTemplate({ quotation, showPrices = true, showHeader = true }: QuotationTemplateProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Header */}
      {showHeader && (
        <div className="flex justify-between items-start mb-8">
          <div>
            <img src={logo} alt="ASP Cranes" className="h-16 w-auto" />
            <div className="mt-2">
              <h1 className="text-2xl font-bold text-gray-900">ASP CRANES</h1>
              <p className="text-sm text-gray-600">
                123 Construction Avenue<br />
                Industrial Area, Phase 1<br />
                Mumbai, Maharashtra 400001<br />
                India
              </p>
              <p className="text-sm text-gray-600 mt-2">
                GST: 27AABCS1429B1ZB<br />
                PAN: AABCS1429B
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">QUOTATION</h2>
            <p className="text-gray-600 mt-1">#{quotation.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-gray-600">Date: {formatDate(quotation.createdAt)}</p>
            <p className="text-gray-600">Valid Until: {formatDate(new Date(new Date(quotation.createdAt).setDate(new Date(quotation.createdAt).getDate() + 30)).toISOString())}</p>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="border-t border-b border-gray-200 py-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
        <div className="text-gray-600">
          <p className="font-medium text-gray-900">{quotation.customerContact.name}</p>
          <p>{quotation.customerContact.designation}</p>
          <p>{quotation.customerContact.company}</p>
          <p>{quotation.customerContact.address}</p>
          <p>Phone: {quotation.customerContact.phone}</p>
          <p>Email: {quotation.customerContact.email}</p>
        </div>
      </div>

      {/* Equipment Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Details</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left font-medium text-gray-600">Description</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Specifications</th>
              {showPrices && (
                <>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Rate</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Amount</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3">{quotation.selectedEquipment.name}</td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <p>Duration: {quotation.numberOfDays} days</p>
                  <p>Working Hours: {quotation.workingHours} hours/day</p>
                  <p>Shift Type: {quotation.shift === 'double' ? 'Double Shift' : 'Single Shift'}</p>
                  <p>Time: {quotation.dayNight === 'day' ? 'Day Shift' : 'Night Shift'}</p>
                </div>
              </td>
              {showPrices && (
                <>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end">
                      <IndianRupee className="h-3.5 w-3.5 text-gray-500 mr-1" />
                      {formatCurrency(quotation.baseRate)}
                      <span className="text-gray-500 ml-1">
                        /{quotation.orderType === 'monthly' || quotation.orderType === 'yearly' ? 'month' : 'hour'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end">
                      <IndianRupee className="h-3.5 w-3.5 text-gray-500 mr-1" />
                      {formatCurrency(quotation.baseRate * quotation.numberOfDays * quotation.workingHours)}
                    </div>
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Additional Charges */}
      {showPrices && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Charges</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3">Mobilization & Demobilization</td>
                <td className="px-4 py-3">
                  <div className="space-y-1 text-gray-600">
                    <p>Distance: {quotation.siteDistance} km</p>
                    <p>Running Cost: ₹{quotation.runningCostPerKm}/km</p>
                    <p>Relaxation: {quotation.mobRelaxation}%</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end">
                    <IndianRupee className="h-3.5 w-3.5 text-gray-500 mr-1" />
                    {formatCurrency(quotation.mobDemob)}
                  </div>
                </td>
              </tr>
              {(quotation.foodResources > 0 || quotation.accomResources > 0) && (
                <tr>
                  <td className="px-4 py-3">Food & Accommodation</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1 text-gray-600">
                      {quotation.foodResources > 0 && (
                        <p>Food for {quotation.foodResources} person(s)</p>
                      )}
                      {quotation.accomResources > 0 && (
                        <p>Accommodation for {quotation.accomResources} person(s)</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end">
                      <IndianRupee className="h-3.5 w-3.5 text-gray-500 mr-1" />
                      {formatCurrency((quotation.foodResources * 2500) + (quotation.accomResources * 4000))}
                    </div>
                  </td>
                </tr>
              )}
              {quotation.extraCharge > 0 && (
                <tr>
                  <td className="px-4 py-3">Extra Charges</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end">
                      <IndianRupee className="h-3.5 w-3.5 text-gray-500 mr-1" />
                      {formatCurrency(quotation.extraCharge)}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Terms & Conditions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Payment Terms: 50% advance, balance against monthly bills</li>
          <li>GST @18% will be charged extra as applicable</li>
          <li>Mobilization charges will be billed extra based on distance</li>
          <li>Working hours: Standard 8-hour shift. Additional hours will be charged extra</li>
          <li>Operator & fuel will be provided by ASP Cranes</li>
          <li>Client to provide necessary permissions & clearances</li>
          <li>Rate validity: 30 days from quotation date</li>
          <li>Insurance coverage as per standard terms</li>
          <li>Minimum billing period applies as per selected package</li>
          <li>Cancellation charges applicable as per company policy</li>
        </ol>
      </div>

      {/* Footer */}
      <div className="mt-12">
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bank Details:</h4>
              <div className="text-sm text-gray-600 mt-1">
                <p>Bank Name: HDFC Bank</p>
                <p>Account Number: XXXX XXXX XXXX 1234</p>
                <p>IFSC Code: HDFC0001234</p>
                <p>Branch: Mumbai Main Branch</p>
              </div>
            </div>
            {showPrices && (
              <div className="text-right">
                <div className="space-y-2">
                  <div className="flex justify-end items-center">
                    <span className="text-gray-600 mr-12">Subtotal:</span>
                    <div className="flex items-center w-32">
                      <IndianRupee className="h-3.5 w-3.5 text-gray-500 mr-1" />
                      {formatCurrency(quotation.totalRent / (quotation.includeGst ? 1.18 : 1))}
                    </div>
                  </div>
                  {quotation.includeGst && (
                    <div className="flex justify-end items-center">
                      <span className="text-gray-600 mr-12">GST (18%):</span>
                      <div className="flex items-center w-32">
                        <IndianRupee className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        {formatCurrency(quotation.totalRent - (quotation.totalRent / 1.18))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end items-center text-lg font-semibold">
                    <span className="text-gray-900 mr-12">Total:</span>
                    <div className="flex items-center w-32">
                      <IndianRupee className="h-4 w-4 text-gray-900 mr-1" />
                      {formatCurrency(quotation.totalRent)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Thank you for your business!</p>
          <p className="mt-1">For any queries, please contact us at +91 98765 43210 or email at info@aspcranes.com</p>
        </div>
      </div>
    </div>
  );
} 