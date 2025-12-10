import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Download,
  Plus, 
  Minus,
  Loader,
  CreditCard,
  Calendar,
  User,
  Building,
  Briefcase
} from "lucide-react";
import axios from "axios";

const EmployeePayroll = () => {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Employee/employeepayroll.php';

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    tap: { scale: 0.95 },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  useEffect(() => {
    fetchPayrollHistory();
  }, []);

  const fetchPayrollHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error("User not authenticated");
      }

      const response = await axios.get(`${apiBase}?action=get_payroll_history&user_id=${user_id}`);
      if (response.data.type === 'success') {
        setPayrollHistory(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch payroll history");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Fetch payroll history error:", err);
      setError("An error occurred while fetching payroll history");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleDownloadPayslip = async (payrollId) => {
    setDownloadLoading(true);
    clearMessages();
    
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        setError("User not authenticated");
        setTimeout(() => setError(""), 3000);
        return;
      }

      const response = await axios.get(
        `${apiBase}?action=download_payslip&payroll_id=${payrollId}&user_id=${user_id}`,
        { timeout: 15000 }
      );

      if (response.data.type === 'success') {
        const { pdf_content, filename } = response.data.data;
        
        const byteCharacters = atob(pdf_content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccess("Payslip downloaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to download payslip");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Download payslip error:", err);
      if (err.code === 'ECONNABORTED') {
        setError("Download request timed out. Please try again.");
      } else {
        setError("An error occurred while downloading the payslip");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleRecordClick = (record) => {
    if (selectedRecord?.payroll_id === record.payroll_id) {
      setSelectedRecord(null);
    } else {
      setSelectedRecord(record);
    }
  };

  const handleCloseDetails = () => {
    setSelectedRecord(null);
  };

  const getCurrentMonthRecord = () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    return payrollHistory.find(record => 
      record.month === currentMonth && record.status === 'Paid'
    );
  };

  const currentMonthRecord = getCurrentMonthRecord();

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div className="mb-6 flex-shrink-0" variants={itemVariants}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Payroll</h1>
            <p className="text-gray-600 mt-1">View your salary details and payment history</p>
          </div>
        </div>

        {/* Error and Success Messages */}
        {(error || success) && (
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {success}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Current Month Summary */}
      {currentMonthRecord && (
        <motion.div 
          className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Current Month - {currentMonthRecord.month}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Basic Salary</p>
              <p className="text-2xl font-bold text-gray-900">₱{currentMonthRecord.basic_pay}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-1">
                <Plus size={16} className="text-green-600" />
                <p className="text-sm text-gray-600 mb-1">Allowances</p>
              </div>
              <p className="text-2xl font-bold text-green-600">₱{currentMonthRecord.allowances}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-1">
                <Minus size={16} className="text-red-600" />
                <p className="text-sm text-gray-600 mb-1">Deductions</p>
              </div>
              <p className="text-2xl font-bold text-red-600">₱{currentMonthRecord.deductions}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Net Pay</p>
              <p className="text-2xl font-bold text-blue-600">₱{currentMonthRecord.net_pay}</p>
            </div>
          </div>
          <motion.button 
            onClick={() => handleDownloadPayslip(currentMonthRecord.payroll_id)}
            disabled={downloadLoading}
            className="mt-6 bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            variants={buttonVariants}
            whileHover={!downloadLoading ? "hover" : undefined}
            whileTap={!downloadLoading ? "tap" : undefined}
          >
            {downloadLoading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={20} />
                Download Payslip
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Payroll History */}
      <motion.div 
        className="flex gap-6 flex-1 overflow-hidden"
        variants={itemVariants}
      >
        {/* Payroll History List */}
        <div className={`transition-all duration-300 flex flex-col overflow-hidden ${selectedRecord ? 'w-2/3' : 'w-full'}`}>
          <motion.div 
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col"
            variants={cardVariants}
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Payroll History</h2>
            </div>
            
            {/* Payroll List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 p-4">
              {payrollHistory.map((record, index) => (
                <motion.div
                  key={record.payroll_id}
                  onClick={() => handleRecordClick(record)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    selectedRecord?.payroll_id === record.payroll_id
                      ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                  style={{
                    animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                        <CreditCard size={20} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base">{record.month}</h3>
                        <p className="text-sm text-gray-600">
                          Period: {record.start_date} to {record.end_date}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500">
                            Net Pay: <strong className="text-gray-900">₱{record.net_pay}</strong>
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            record.status === 'Paid' 
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'Calculated'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPayslip(record.payroll_id);
                        }}
                        disabled={downloadLoading}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {downloadLoading ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                        Download
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {payrollHistory.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No payroll records found</h3>
                  <p className="text-gray-500">
                    Your payroll history will appear here once processed
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Side - Payroll Details */}
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-1/3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-y-auto flex-shrink-0"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Payroll Details</h2>
                <p className="text-gray-600 text-sm mt-1">Complete compensation information</p>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Minus size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Pay Period */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Calendar size={16} />
                  Pay Period
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Month</span>
                    <span className="text-gray-900 font-medium">{selectedRecord.month}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Start Date</span>
                    <span className="text-gray-900">{selectedRecord.start_date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">End Date</span>
                    <span className="text-gray-900">{selectedRecord.end_date}</span>
                  </div>
                </div>
              </div>

              {/* Employee Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <User size={16} />
                  Employee Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Name</span>
                    <span className="text-gray-900 font-medium">{selectedRecord.employee_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Building size={14} />
                      Department
                    </span>
                    <span className="text-gray-900">{selectedRecord.department || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Briefcase size={14} />
                      Position
                    </span>
                    <span className="text-gray-900">{selectedRecord.position || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Salary Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Regular Hours</span>
                    <span className="font-semibold text-gray-900">{selectedRecord.regular_hours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Overtime Hours</span>
                    <span className="font-semibold text-gray-900">{selectedRecord.overtime_hours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Basic Pay</span>
                    <span className="font-semibold text-gray-900">₱{selectedRecord.basic_pay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Overtime Pay</span>
                    <span className="font-semibold text-gray-900">₱{selectedRecord.overtime_pay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Allowances</span>
                    <span className="font-semibold text-green-600">+₱{selectedRecord.allowances}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Deductions</span>
                    <span className="font-semibold text-red-600">-₱{selectedRecord.deductions}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="text-gray-900 font-bold">Net Pay</span>
                    <span className="text-xl font-bold text-gray-900">₱{selectedRecord.net_pay}</span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Additional Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedRecord.status === 'Paid' 
                        ? 'bg-green-100 text-green-800'
                        : selectedRecord.status === 'Calculated'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedRecord.status}
                    </span>
                  </div>
                  {selectedRecord.paid_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Paid Date</span>
                      <span className="text-gray-900">{selectedRecord.paid_date}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Record ID</span>
                    <span className="text-gray-900">PAY-{selectedRecord.payroll_id.toString().padStart(3, '0')}</span>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="pt-4 border-t border-gray-200">
                <motion.button
                  onClick={() => handleDownloadPayslip(selectedRecord.payroll_id)}
                  disabled={downloadLoading}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileHover={!downloadLoading ? { scale: 1.02 } : undefined}
                  whileTap={!downloadLoading ? { scale: 0.98 } : undefined}
                >
                  {downloadLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download Payslip
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default EmployeePayroll;