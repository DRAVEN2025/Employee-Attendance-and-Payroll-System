import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  Briefcase, 
  User, 
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  Loader,
  Clock,
  Users,
  UserCheck,
  CheckCircle,
  XCircle,
  ClockIcon,
  MoreHorizontal,
  AlertCircle
} from "lucide-react";
import axios from "axios";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employeeApprovals, setEmployeeApprovals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("employees"); // "employees" or "approvals"
  const [approvalStatusTab, setApprovalStatusTab] = useState("pending"); // "pending", "approved", "rejected"

  const [formData, setFormData] = useState({
    emp_id: "",
    user_id: "",
    dept_id: "",
    position_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    hire_date: "",
    hourly_rate: "",
    salary_monthly: "",
    is_active: 1,
    username: "",
    password: ""
  });

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    password: ""
  });

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/employees.php';

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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchEmployeeApprovals();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${apiBase}?action=get_employees`);
      if (response.data.type === 'success') {
        setEmployees(response.data.data);
      } else {
        setError("Failed to fetch employees");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
      setError("An error occurred while fetching employees");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeApprovals = async () => {
    try {
      const response = await axios.get(`${apiBase}?action=get_employee_approvals`);
      if (response.data.type === 'success') {
        setEmployeeApprovals(response.data.data);
      }
    } catch (err) {
      console.error("Fetch employee approvals error:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${apiBase}?action=get_departments`);
      if (response.data.type === 'success') {
        setDepartments(response.data.data);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  const fetchPositions = async (deptId = null) => {
    try {
      const url = deptId 
        ? `${apiBase}?action=get_positions&dept_id=${deptId}`
        : `${apiBase}?action=get_positions`;
      
      const response = await axios.get(url);
      if (response.data.type === 'success') {
        setPositions(response.data.data);
      }
    } catch (err) {
      console.error("Fetch positions error:", err);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
    setFieldErrors({
      email: "",
      username: "",
      first_name: "",
      last_name: "",
      password: ""
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredApprovals = () => {
    let filtered = employeeApprovals.filter(approval =>
      approval.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (approvalStatusTab === 'pending') {
      filtered = filtered.filter(approval => approval.status === 'Pending');
    } else if (approvalStatusTab === 'approved') {
      filtered = filtered.filter(approval => approval.status === 'Approved');
    } else if (approvalStatusTab === 'rejected') {
      filtered = filtered.filter(approval => approval.status === 'Rejected');
    }

    return filtered;
  };

  const handleEmployeeClick = (employee) => {
    if (selectedEmployee?.emp_id === employee.emp_id) {
      setSelectedEmployee(null);
    } else {
      setSelectedEmployee(employee);
    }
  };

  const handleCloseDetails = () => {
    setSelectedEmployee(null);
  };

  const openCreateModal = () => {
    setFormData({
      emp_id: "",
      user_id: "",
      dept_id: "",
      position_id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      hire_date: new Date().toISOString().split('T')[0],
      hourly_rate: "",
      salary_monthly: "",
      is_active: 1,
      username: "",
      password: ""
    });
    setIsModalOpen(true);
    clearMessages();
    fetchPositions();
  };

  const openEditModal = (employee) => {
    setFormData({
      emp_id: employee.emp_id,
      user_id: employee.user_id,
      dept_id: employee.dept_id || "",
      position_id: employee.position_id || "",
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || "",
      hire_date: employee.hire_date,
      hourly_rate: employee.hourly_rate || "",
      salary_monthly: employee.salary_monthly || "",
      is_active: employee.is_active,
      username: employee.username.replace(/\s/g, ''),
      password: ""
    });
    setIsModalOpen(true);
    clearMessages();
    
    if (employee.dept_id) {
      fetchPositions(employee.dept_id);
    } else {
      fetchPositions();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      emp_id: "",
      user_id: "",
      dept_id: "",
      position_id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      hire_date: new Date().toISOString().split('T')[0],
      hourly_rate: "",
      salary_monthly: "",
      is_active: 1,
      username: "",
      password: ""
    });
    clearMessages();
  };

  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
    clearMessages();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEmployeeToDelete(null);
    clearMessages();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'username') {
      const cleanedValue = value.replace(/\s/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: cleanedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }

    if (name === 'dept_id') {
      fetchPositions(value || null);
    }
  };

  const handleUsernamePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain').replace(/\s/g, '');
    document.execCommand('insertText', false, text);
  };

  const validateForm = () => {
    const errors = {
      email: "",
      username: "",
      first_name: "",
      last_name: "",
      password: ""
    };

    let isValid = true;

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
      isValid = false;
    }

    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email format is invalid";
      isValid = false;
    }

    if (!formData.username.trim()) {
      errors.username = "Username is required";
      isValid = false;
    }

    if (!formData.emp_id && !formData.password.trim()) {
      errors.password = "Password is required for new employees";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    clearMessages();

    if (!validateForm()) {
      setFormLoading(false);
      return;
    }

    try {
      const isEdit = !!formData.emp_id;
      const url = `${apiBase}?action=${isEdit ? 'update_employee' : 'create_employee'}`;
      
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchEmployees();
        setTimeout(() => {
          closeModal();
          if (isEdit && selectedEmployee?.emp_id === formData.emp_id) {
            setSelectedEmployee(null);
          }
        }, 1000);
      } else {
        const errorMessage = response.data.message.toLowerCase();
        
        if (errorMessage.includes('email') && errorMessage.includes('already exists')) {
          setFieldErrors(prev => ({
            ...prev,
            email: "This email is already registered to another employee"
          }));
        } else if (errorMessage.includes('username') && errorMessage.includes('already exists')) {
          setFieldErrors(prev => ({
            ...prev,
            username: "This username is already taken by another employee"
          }));
        } else {
          setError(response.data.message);
          setTimeout(() => setError(""), 3000);
        }
      }
    } catch (err) {
      console.error("Save employee error:", err);
      if (err.response && err.response.data) {
        const errorMessage = err.response.data.message.toLowerCase();
        
        if (errorMessage.includes('email') && errorMessage.includes('already exists')) {
          setFieldErrors(prev => ({
            ...prev,
            email: "This email is already registered to another employee"
          }));
        } else if (errorMessage.includes('username') && errorMessage.includes('already exists')) {
          setFieldErrors(prev => ({
            ...prev,
            username: "This username is already taken by another employee"
          }));
        } else {
          setError(err.response.data.message || "An error occurred while saving the employee");
          setTimeout(() => setError(""), 3000);
        }
      } else {
        setError("An error occurred while saving the employee");
        setTimeout(() => setError(""), 3000);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    setFormLoading(true);
    clearMessages();

    try {
      const response = await axios.post(`${apiBase}?action=delete_employee`, {
        emp_id: employeeToDelete.emp_id,
        user_id: employeeToDelete.user_id
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchEmployees();
        if (selectedEmployee?.emp_id === employeeToDelete.emp_id) {
          setSelectedEmployee(null);
        }
        closeDeleteModal();
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Delete employee error:", err);
      setError("An error occurred while deleting the employee");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprovalAction = async (approvalId, status) => {
    setFormLoading(true);
    clearMessages();

    try {
      const adminUsername = localStorage.getItem('username') || 'admin';
      
      const response = await axios.post(`${apiBase}?action=update_approval_status`, {
        approval_id: approvalId,
        status: status,
        approved_by: adminUsername
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchEmployeeApprovals();
        if (status === 'Approved') {
          fetchEmployees();
        }
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Update approval status error:", err);
      setError("An error occurred while updating approval status");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'Approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'Rejected':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <ClockIcon size={16} className="text-yellow-600" />;
      case 'Approved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'Rejected':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <ClockIcon size={16} className="text-gray-600" />;
    }
  };

  const getFilteredPositions = () => {
    if (!formData.dept_id) {
      return positions;
    }
    return positions.filter(position => position.dept_id == formData.dept_id);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const approvalCounts = {
    pending: employeeApprovals.filter(a => a.status === 'Pending').length,
    approved: employeeApprovals.filter(a => a.status === 'Approved').length,
    rejected: employeeApprovals.filter(a => a.status === 'Rejected').length,
    total: employeeApprovals.length
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-1">Manage and view all employees</p>
          </div>
          <motion.button 
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Plus size={20} />
            Add Employee
          </motion.button>
        </div>

        {/* Main Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("employees")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "employees"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Employees ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors relative ${
              activeTab === "approvals"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Employee Approvals ({approvalCounts.total})
            {approvalCounts.pending > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {approvalCounts.pending}
              </span>
            )}
          </button>
        </div>

        {/* Approval Status Tabs - Only show when approvals tab is active */}
        {activeTab === "approvals" && (
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setApprovalStatusTab("pending")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                approvalStatusTab === "pending"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <ClockIcon size={16} />
              Pending ({approvalCounts.pending})
            </button>
            <button
              onClick={() => setApprovalStatusTab("approved")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                approvalStatusTab === "approved"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <CheckCircle size={16} />
              Approved ({approvalCounts.approved})
            </button>
            <button
              onClick={() => setApprovalStatusTab("rejected")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                approvalStatusTab === "rejected"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <XCircle size={16} />
              Rejected ({approvalCounts.rejected})
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={
              activeTab === "employees" 
                ? "Search employees by name, department, position, or email..."
                : `Search ${approvalStatusTab} approvals by username or email...`
            }
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
      </motion.div>

      {/* Error and Success Messages */}
      {(error || success) && (
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle size={18} />
              {success}
            </div>
          )}
        </motion.div>
      )}

      {/* Content Area */}
      <motion.div className="flex-1 overflow-hidden flex flex-col" variants={itemVariants}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">
                {activeTab === "employees" ? "Loading employees..." : "Loading approvals..."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Employee List - Card Style */}
            {activeTab === "employees" && (
              <div className={`transition-all duration-300 flex gap-6 flex-1 overflow-hidden`}>
                {/* Left Side - Employee List */}
                <div className={`flex flex-col overflow-hidden ${selectedEmployee ? 'w-2/3' : 'w-full'}`}>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {filteredEmployees.map((employee, index) => (
                      <motion.div
                        key={employee.emp_id}
                        onClick={() => handleEmployeeClick(employee)}
                        className={`bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          selectedEmployee?.emp_id === employee.emp_id
                            ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
                            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                        }`}
                        style={{
                          animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                              <span className="text-white font-semibold text-base">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base">{employee.name}</h3>
                              <p className="text-sm text-gray-600">{employee.position_designation || employee.position}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{employee.department || 'No Department'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              employee.is_active 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {employee.status}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(employee);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(employee);
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

                  {/* Empty State for Employees */}
                  {filteredEmployees.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <User size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No employees found
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm 
                            ? "Try adjusting your search terms" 
                            : "Get started by creating your first employee"
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side - Employee Details */}
                {selectedEmployee && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="w-1/3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-y-auto flex-shrink-0"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Employee Details</h2>
                        <p className="text-gray-600 text-sm mt-1">Complete information</p>
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
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-white font-semibold text-lg">
                                {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{selectedEmployee.name}</h4>
                              <p className="text-sm text-gray-600">Employee ID: EMP-{selectedEmployee.emp_id.toString().padStart(3, '0')}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600">
                            <Mail size={18} className="text-gray-400" />
                            <span className="text-sm">{selectedEmployee.email}</span>
                          </div>

                          {selectedEmployee.phone && (
                            <div className="flex items-center gap-3 text-gray-600">
                              <Phone size={18} className="text-gray-400" />
                              <span className="text-sm">{selectedEmployee.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Employment Information */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Employment Details</h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-gray-600">
                            <Building2 size={18} className="text-gray-400" />
                            <span className="text-sm">{selectedEmployee.department || 'No Department'}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-gray-600">
                            <Briefcase size={18} className="text-gray-400" />
                            <span className="text-sm">{selectedEmployee.position_designation || selectedEmployee.position}</span>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600">
                            <Calendar size={18} className="text-gray-400" />
                            <span className="text-sm">Hired: {new Date(selectedEmployee.hire_date).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600">
                            <Users size={18} className="text-gray-400" />
                            <span className="text-sm">Status: {selectedEmployee.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Compensation Information */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Compensation</h3>
                        <div className="space-y-4">
                          {selectedEmployee.hourly_rate && (
                            <div className="flex items-center gap-3 text-gray-600">
                              <Clock size={18} className="text-gray-400" />
                              <span className="text-sm">₱{selectedEmployee.hourly_rate}/hour</span>
                            </div>
                          )}
                          
                          {selectedEmployee.salary_monthly && (
                            <div className="flex items-center gap-3 text-gray-600">
                              <User size={18} className="text-gray-400" />
                              <span className="text-sm">₱{selectedEmployee.salary_monthly}/month</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Account Information */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Account Information</h3>
                        <div className="space-y-4">
                          <div className="text-gray-600">
                            <span className="text-sm font-medium">Username: </span>
                            <span className="text-sm">{selectedEmployee.username}</span>
                          </div>
                          
                          {selectedEmployee.created_at && (
                            <div className="text-gray-600">
                              <span className="text-sm font-medium">Account Created: </span>
                              <span className="text-sm">
                                {new Date(selectedEmployee.created_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          {selectedEmployee.updated_at && (
                            <div className="text-gray-600">
                              <span className="text-sm font-medium">Last Updated: </span>
                              <span className="text-sm">
                                {new Date(selectedEmployee.updated_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Approvals List - Table Style */}
            {activeTab === "approvals" && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            User
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Submitted
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Approved By
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Approved At
                          </th>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getFilteredApprovals().map((approval, index) => (
                          <motion.tr 
                            key={approval.approval_id}
                            className="hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                  <User size={18} className="text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{approval.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-gray-900">{approval.email}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-sm">
                              {formatDateTime(approval.submitted_at)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStatusColor(approval.status)}`}
                              >
                                {getStatusIcon(approval.status)}
                                {approval.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-sm">
                              {approval.approved_by || '-'}
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-sm">
                              {approval.approved_at ? formatDateTime(approval.approved_at) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {approval.status === 'Pending' && (
                                  <>
                                    <motion.button
                                      onClick={() => handleApprovalAction(approval.approval_id, 'Approved')}
                                      disabled={formLoading}
                                      className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm flex items-center gap-1"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      {formLoading ? (
                                        <Loader size={14} className="animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle size={14} />
                                          Approve
                                        </>
                                      )}
                                    </motion.button>
                                    <motion.button
                                      onClick={() => handleApprovalAction(approval.approval_id, 'Rejected')}
                                      disabled={formLoading}
                                      className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm flex items-center gap-1"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      {formLoading ? (
                                        <Loader size={14} className="animate-spin" />
                                      ) : (
                                        <>
                                          <XCircle size={14} />
                                          Reject
                                        </>
                                      )}
                                    </motion.button>
                                  </>
                                )}
                                {approval.status !== 'Pending' && (
                                  <motion.button
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <MoreHorizontal size={16} />
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Empty State for Approvals */}
                  {getFilteredApprovals().length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UserCheck size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No {approvalStatusTab} approvals found
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm 
                            ? "Try adjusting your search terms" 
                            : `No ${approvalStatusTab} employee registrations found`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Table Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                  <p className="text-sm text-gray-600">
                    Showing {getFilteredApprovals().length} of {approvalCounts.total} approval requests
                    {approvalStatusTab !== 'all' && ` (filtered by ${approvalStatusTab})`}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Create/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {formData.emp_id ? 'Edit Employee' : 'Add New Employee'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {fieldErrors.first_name && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.first_name}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {fieldErrors.last_name && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.last_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      setFormData(prev => ({
                        ...prev,
                        username: value
                      }));
                    }}
                    onKeyPress={(e) => {
                      if (e.key === ' ') {
                        e.preventDefault();
                      }
                    }}
                    onPaste={handleUsernamePaste}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {fieldErrors.username && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {!formData.emp_id && '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={formData.emp_id ? "Leave blank to keep current password" : ""}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Hire Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    name="dept_id"
                    value={formData.dept_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.dept_id} value={dept.dept_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    name="position_id"
                    value={formData.position_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.dept_id}
                  >
                    <option value="">Select Position</option>
                    {getFilteredPositions().map(position => (
                      <option key={position.position_id} value={position.position_id}>
                        {position.position_name}
                      </option>
                    ))}
                  </select>
                  {!formData.dept_id && (
                    <p className="text-gray-500 text-xs mt-1">Select a department first</p>
                  )}
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (₱)
                  </label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Monthly Salary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Salary (₱)
                  </label>
                  <input
                    type="number"
                    name="salary_monthly"
                    value={formData.salary_monthly}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="is_active"
                    value={formData.is_active}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      {formData.emp_id ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {formData.emp_id ? 'Update Employee' : 'Create Employee'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Employee</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{employeeToDelete?.name}</strong>? This action cannot be undone and will permanently remove all associated data.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={formLoading}
                  className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Employees;