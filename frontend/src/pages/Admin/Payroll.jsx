import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Download,
  Filter,
  X,
  Save,
  Loader,
  User,
  Wallet,
  TrendingUp,
  Clock,
  Calculator,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import axios from "axios";

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [overtimeStatus, setOvertimeStatus] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    payroll_id: "",
    emp_id: "",
    employee_name: "",
    start_date: "",
    end_date: "",
    basic_salary: "",
    hourly_rate: "",
    regular_hours: "",
    overtime_hours: "",
    allowances: "",
    deductions: "",
    gross_pay: "",
    net_pay: "",
    basic_pay: "",
    overtime_pay: "",
    late_minutes: ""
  });

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/payroll.php';

  // Animation variants
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

  useEffect(() => {
    fetchPayrollData();
  }, []);

  useEffect(() => {
    if (employeeSearch.length > 2) {
      searchEmployees();
    } else {
      setEmployees([]);
    }
  }, [employeeSearch]);

  const fetchPayrollData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${apiBase}?action=get_payroll_records`);
      if (response.data.type === 'success') {
        setPayrollData(response.data.data);
      } else {
        setError("Failed to fetch payroll data");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Fetch payroll error:", err);
      setError("An error occurred while fetching payroll data");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const searchEmployees = async () => {
    try {
      const response = await axios.get(`${apiBase}?action=get_employees&search=${employeeSearch}`);
      if (response.data.type === 'success') {
        setEmployees(response.data.data);
        setShowEmployeeDropdown(true);
      }
    } catch (err) {
      console.error("Search employees error:", err);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
    setOvertimeStatus("");
    setDuplicateError("");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredRecords = payrollData.filter(record =>
    record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const openCreateModal = () => {
    setFormData({
      payroll_id: "",
      emp_id: "",
      employee_name: "",
      start_date: "",
      end_date: "",
      basic_salary: "",
      hourly_rate: "",
      regular_hours: "",
      overtime_hours: "",
      allowances: "",
      deductions: "",
      gross_pay: "",
      net_pay: "",
      basic_pay: "",
      overtime_pay: "",
      late_minutes: ""
    });
    setEmployeeSearch("");
    setIsModalOpen(true);
    clearMessages();
  };

  const openEditModal = async (record) => {
    try {
      const response = await axios.get(`${apiBase}?action=get_payroll_record&payroll_id=${record.payroll_id}`);
      if (response.data.type === 'success') {
        const payrollRecord = response.data.data;
        setFormData({
          payroll_id: payrollRecord.payroll_id,
          emp_id: payrollRecord.emp_id,
          employee_name: payrollRecord.employee_name,
          start_date: payrollRecord.start_date,
          end_date: payrollRecord.end_date,
          basic_salary: payrollRecord.salary_monthly,
          hourly_rate: payrollRecord.hourly_rate,
          regular_hours: payrollRecord.regular_hours,
          overtime_hours: payrollRecord.overtime_hours,
          allowances: payrollRecord.allowances,
          deductions: payrollRecord.deductions,
          gross_pay: payrollRecord.gross_pay,
          net_pay: payrollRecord.net_pay,
          basic_pay: "",
          overtime_pay: "",
          late_minutes: ""
        });
        setEmployeeSearch(payrollRecord.employee_name);
        setIsModalOpen(true);
        clearMessages();
      } else {
        setError("Failed to fetch payroll record details");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Fetch payroll record error:", err);
      setError("An error occurred while fetching payroll record details");
      setTimeout(() => setError(""), 3000);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      payroll_id: "",
      emp_id: "",
      employee_name: "",
      start_date: "",
      end_date: "",
      basic_salary: "",
      hourly_rate: "",
      regular_hours: "",
      overtime_hours: "",
      allowances: "",
      deductions: "",
      gross_pay: "",
      net_pay: "",
      basic_pay: "",
      overtime_pay: "",
      late_minutes: ""
    });
    setEmployeeSearch("");
    setShowEmployeeDropdown(false);
    clearMessages();
  };

  const openDeleteModal = (record) => {
    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
    clearMessages();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRecordToDelete(null);
    clearMessages();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'start_date' || name === 'end_date' || name === 'emp_id') {
      setDuplicateError("");
    }
  };

  const handleEmployeeSelect = (employee) => {
    setFormData(prev => ({
      ...prev,
      emp_id: employee.emp_id,
      employee_name: employee.name,
      basic_salary: employee.salary_monthly,
      hourly_rate: employee.hourly_rate
    }));
    setEmployeeSearch(employee.name);
    setShowEmployeeDropdown(false);
    setDuplicateError("");
  };

  const checkDuplicateRecord = async () => {
    if (!formData.emp_id || !formData.start_date || !formData.end_date) {
      return false;
    }

    try {
      const response = await axios.post(`${apiBase}?action=check_duplicate_payroll`, {
        emp_id: formData.emp_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        payroll_id: formData.payroll_id || 0
      });

      return response.data.type === 'success' && response.data.is_duplicate;
    } catch (err) {
      console.error("Check duplicate error:", err);
      return false;
    }
  };

  const calculatePayroll = async () => {
    if (!formData.emp_id || !formData.start_date || !formData.end_date) {
      setError("Employee, start date, and end date are required for calculation");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const isDuplicate = await checkDuplicateRecord();
    if (isDuplicate) {
      setDuplicateError("A payroll record already exists for this employee and pay period. Please choose a different period or employee.");
      return;
    }

    setCalculating(true);
    clearMessages();

    try {
      const response = await axios.post(`${apiBase}?action=calculate_payroll`, {
        emp_id: formData.emp_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        allowances: parseFloat(formData.allowances) || 0
      });

      if (response.data.type === 'success') {
        const calculation = response.data.data;
        setFormData(prev => ({
          ...prev,
          regular_hours: calculation.regular_hours,
          overtime_hours: calculation.overtime_hours,
          basic_pay: calculation.basic_pay,
          overtime_pay: calculation.overtime_pay,
          deductions: calculation.late_deductions,
          gross_pay: calculation.gross_pay,
          net_pay: calculation.net_pay,
          late_minutes: calculation.late_minutes,
          hourly_rate: calculation.hourly_rate
        }));

        if (calculation.has_overtime_requests) {
          setOvertimeStatus(`✓ Approved overtime requests found: ${calculation.approved_overtime_hours} hours included in calculation`);
          setTimeout(() => setOvertimeStatus(""), 5000);
        } else {
          setOvertimeStatus("ℹ️ No approved overtime requests found for this period. Overtime pay set to 0.");
          setTimeout(() => setOvertimeStatus(""), 5000);
        }

        setSuccess("Payroll calculated successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Calculate payroll error:", err);
      setError("An error occurred while calculating payroll");
      setTimeout(() => setError(""), 3000);
    } finally {
      setCalculating(false);
    }
  };

  const refreshPayrollData = async () => {
    setRefreshing(true);
    clearMessages();
    
    try {
      const recordsToRefresh = payrollData.filter(record => 
        record.status === 'Calculated' || record.status === 'Paid'
      );

      if (recordsToRefresh.length === 0) {
        setSuccess("No payroll records available for refresh");
        setTimeout(() => setSuccess(""), 3000);
        setRefreshing(false);
        return;
      }

      let updatedCount = 0;
      
      for (const record of recordsToRefresh) {
        try {
          const response = await axios.post(`${apiBase}?action=calculate_payroll`, {
            emp_id: record.emp_id,
            start_date: record.start_date,
            end_date: record.end_date,
            allowances: parseFloat(record.allowances) || 0
          });

          if (response.data.type === 'success') {
            const calculation = response.data.data;
            
            const updateResponse = await axios.post(`${apiBase}?action=update_payroll`, {
              payroll_id: record.payroll_id,
              emp_id: record.emp_id,
              start_date: record.start_date,
              end_date: record.end_date,
              regular_hours: calculation.regular_hours,
              overtime_hours: calculation.overtime_hours,
              allowances: record.allowances,
              gross_pay: calculation.gross_pay,
              deductions: calculation.late_deductions,
              net_pay: calculation.net_pay,
              basic_pay: calculation.basic_pay,
              overtime_pay: calculation.overtime_pay
            });

            if (updateResponse.data.type === 'success') {
              updatedCount++;
            }
          }
        } catch (err) {
          console.error(`Error refreshing record ${record.payroll_id}:`, err);
        }
      }

      await fetchPayrollData();
      
      setSuccess(`Successfully refreshed ${updatedCount} payroll records`);
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      console.error("Refresh payroll error:", err);
      setError("An error occurred while refreshing payroll data");
      setTimeout(() => setError(""), 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isDuplicate = await checkDuplicateRecord();
    if (isDuplicate) {
      setDuplicateError("A payroll record already exists for this employee and pay period. Please choose a different period or employee.");
      return;
    }

    if (!formData.net_pay || parseFloat(formData.net_pay) <= 0) {
      setError("Please calculate payroll first before saving");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setFormLoading(true);
    clearMessages();

    try {
      const url = formData.payroll_id 
        ? `${apiBase}?action=update_payroll`
        : `${apiBase}?action=create_payroll`;

      const payload = {
        payroll_id: formData.payroll_id,
        emp_id: formData.emp_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        regular_hours: parseFloat(formData.regular_hours) || 0,
        overtime_hours: parseFloat(formData.overtime_hours) || 0,
        allowances: parseFloat(formData.allowances) || 0,
        gross_pay: parseFloat(formData.gross_pay) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        net_pay: parseFloat(formData.net_pay) || 0,
        basic_pay: parseFloat(formData.basic_pay) || 0,
        overtime_pay: parseFloat(formData.overtime_pay) || 0
      };

      const response = await axios.post(url, payload);

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        
        await fetchPayrollData();
        
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setError(response.data.message || "Failed to save payroll record");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Save payroll error:", err);
      setError("An error occurred while saving the payroll record");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    setFormLoading(true);
    clearMessages();

    try {
      const response = await axios.post(`${apiBase}?action=delete_payroll`, {
        payroll_id: recordToDelete.payroll_id
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchPayrollData();
        if (selectedRecord?.payroll_id === recordToDelete.payroll_id) {
          setSelectedRecord(null);
        }
        closeDeleteModal();
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Delete payroll error:", err);
      setError("An error occurred while deleting the payroll record");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFormLoading(false);
    }
  };

  const processPayroll = async () => {
    setLoading(true);
    clearMessages();
    
    try {
      const payrollIds = payrollData.filter(record => record.status === 'Calculated').map(record => record.payroll_id);
      
      if (payrollIds.length === 0) {
        setError("No payroll records available for processing");
        setTimeout(() => setError(""), 3000);
        setLoading(false);
        return;
      }

      const response = await axios.post(`${apiBase}?action=process_payroll`, {
        payroll_ids: payrollIds
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchPayrollData();
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Process payroll error:", err);
      setError("An error occurred while processing payroll");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (payrollId) => {
    setDownloadLoading(true);
    clearMessages();
    
    try {
      const response = await axios.get(
        `${apiBase}?action=download_payslip&payroll_id=${payrollId}`,
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
        setTimeout(() => setError(""), 3000);
      } else {
        setError("An error occurred while downloading the payslip");
        setTimeout(() => setError(""), 3000);
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalPayroll = payrollData.reduce((sum, record) => sum + parseFloat(record.net_pay || 0), 0);
    const processedCount = payrollData.filter(record => record.status === 'Paid').length;
    const pendingCount = payrollData.filter(record => record.status === 'Calculated').length;
    
    return {
      totalPayroll: totalPayroll.toLocaleString('en-US', { style: 'currency', currency: 'PHP' }),
      processedCount,
      pendingCount
    };
  };

  const totals = calculateTotals();

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
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600 mt-1">Manage employee salaries and compensation</p>
          </div>
          <div className="flex gap-3">
            {/* Refresh Button */}
            <motion.button 
              onClick={refreshPayrollData}
              disabled={refreshing}
              className="bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              variants={buttonVariants}
              whileHover={!refreshing ? "hover" : undefined}
              whileTap={!refreshing ? "tap" : undefined}
            >
              {refreshing ? <Loader size={20} className="animate-spin" /> : <RefreshCw size={20} />}
              Refresh
            </motion.button>
            <motion.button 
              onClick={processPayroll}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              variants={buttonVariants}
              whileHover={!loading ? "hover" : undefined}
              whileTap={!loading ? "tap" : undefined}
            >
              {loading ? <Loader size={20} className="animate-spin" /> : <TrendingUp size={20} />}
              Process Payroll
            </motion.button>
            <motion.button 
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Plus size={20} />
              Add Record
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search payroll records by employee name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
          <motion.button
            className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter size={20} />
            Filter
          </motion.button>
        </div>
      </motion.div>

      {/* Error and Success Messages */}
      {(error || success || overtimeStatus || duplicateError) && (
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
          {duplicateError && (
            <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
              {duplicateError}
            </div>
          )}
          {overtimeStatus && (
            <div className={`p-3 border rounded-lg flex items-center gap-2 ${
              overtimeStatus.includes('✓') 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {overtimeStatus.includes('✓') ? (
                <CheckCircle size={16} className="text-green-600" />
              ) : (
                <AlertCircle size={16} className="text-blue-600" />
              )}
              {overtimeStatus}
            </div>
          )}
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6" variants={itemVariants}>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <Wallet size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900">{totals.totalPayroll}</p>
              <p className="text-sm text-gray-500 mt-1">This Period</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
              <User size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600">{totals.processedCount}</p>
              <p className="text-sm text-gray-500 mt-1">Employees Paid</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{totals.pendingCount}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting Processing</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div className="flex gap-6 flex-1 overflow-hidden" variants={itemVariants}>
        {/* Left Side - Payroll List */}
        <div className={`transition-all duration-300 flex flex-col overflow-hidden ${selectedRecord ? 'w-2/3' : 'w-full'}`}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading payroll data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Payroll List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {filteredRecords.map((record, index) => (
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
                          <h3 className="font-semibold text-gray-900 text-base">{record.employee_name}</h3>
                          <p className="text-sm text-gray-600">{record.email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-500">
                              Period: {record.start_date} to {record.end_date}
                            </span>
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
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(record);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(record);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Empty State */}
              {filteredRecords.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No payroll records found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? "Try adjusting your search terms" : "Get started by processing payroll or adding records"}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
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
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Employee Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Employee Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                      <User size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedRecord.employee_name}</h4>
                      <p className="text-sm text-gray-600">{selectedRecord.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay Period */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Pay Period</h3>
                <div className="space-y-3">
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

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <motion.button
                  onClick={() => handleDownloadPayslip(selectedRecord.payroll_id)}
                  disabled={downloadLoading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Create/Edit Payroll Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {formData.payroll_id ? 'Edit Payroll Record' : 'Add New Payroll Record'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={formLoading}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Duplicate Error Message */}
              {duplicateError && (
                <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
                  {duplicateError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee
                  </label>
                  {formData.payroll_id ? (
                    <input
                      type="text"
                      value={employeeSearch}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        placeholder="Search employee by name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={formLoading}
                      />
                      {showEmployeeDropdown && employees.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {employees.map(employee => (
                            <div
                              key={employee.emp_id}
                              onClick={() => handleEmployeeSelect(employee)}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-600">{employee.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={formLoading}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={formLoading}
                  />
                </div>

                {/* Basic Salary (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Basic Salary (Monthly)
                  </label>
                  <input
                    type="number"
                    value={formData.basic_salary}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                {/* Hourly Rate (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    value={formData.hourly_rate}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                {/* Allowances */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowances
                  </label>
                  <input
                    type="number"
                    name="allowances"
                    value={formData.allowances}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={formLoading}
                  />
                </div>

                {/* Calculate Button */}
                <div className="md:col-span-2">
                  <motion.button
                    type="button"
                    onClick={calculatePayroll}
                    disabled={!formData.emp_id || !formData.start_date || !formData.end_date || calculating || formLoading}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    variants={buttonVariants}
                    whileHover={!calculating && !formLoading ? "hover" : undefined}
                    whileTap={!calculating && !formLoading ? "tap" : undefined}
                  >
                    {calculating ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator size={16} />
                        Calculate Payroll
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Calculation Results */}
                {formData.regular_hours !== "" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Regular Hours
                      </label>
                      <input
                        type="number"
                        name="regular_hours"
                        value={formData.regular_hours}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overtime Hours
                      </label>
                      <input
                        type="number"
                        name="overtime_hours"
                        value={formData.overtime_hours}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Basic Pay
                      </label>
                      <input
                        type="number"
                        name="basic_pay"
                        value={formData.basic_pay}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overtime Pay
                      </label>
                      <input
                        type="number"
                        name="overtime_pay"
                        value={formData.overtime_pay}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Minutes
                      </label>
                      <input
                        type="number"
                        name="late_minutes"
                        value={formData.late_minutes}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deductions
                      </label>
                      <input
                        type="number"
                        name="deductions"
                        value={formData.deductions}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gross Pay
                      </label>
                      <input
                        type="number"
                        name="gross_pay"
                        value={formData.gross_pay}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Net Pay
                      </label>
                      <input
                        type="number"
                        name="net_pay"
                        value={formData.net_pay}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={formLoading || !formData.net_pay || duplicateError || parseFloat(formData.net_pay) <= 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  variants={buttonVariants}
                  whileHover={!formLoading ? "hover" : undefined}
                  whileTap={!formLoading ? "tap" : undefined}
                >
                  {formLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      {formData.payroll_id ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {formData.payroll_id ? 'Update Record' : 'Create Record'}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && recordToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Payroll Record</h3>
                  <p className="text-gray-600 text-sm">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the payroll record for <strong>{recordToDelete.employee_name}</strong>? 
                This will permanently remove the compensation data.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleDelete}
                  disabled={formLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  variants={buttonVariants}
                  whileHover={!formLoading ? "hover" : undefined}
                  whileTap={!formLoading ? "tap" : undefined}
                >
                  {formLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Record
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Payroll;