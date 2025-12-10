import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar,
  Clock,
  FileText,
  Zap,
  Send,
  X,
  AlertCircle,
  CheckCircle,
  History,
  UserCheck,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import axios from "axios";

const EmployeeRequests = () => {
  const [activeTab, setActiveTab] = useState("leave");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [leaveForm, setLeaveForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    notes: ""
  });

  const [overtimeForm, setOvertimeForm] = useState({
    ot_type_id: "",
    request_date: "",
    start_time: "",
    end_time: "",
    reason: ""
  });

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [overtimeTypes, setOvertimeTypes] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Employee/employeerequests.php';

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

  useEffect(() => {
    fetchLeaveTypes();
    fetchOvertimeTypes();
    if (activeTab === "history") {
      fetchRequestHistory();
    }
  }, [activeTab]);

  const fetchLeaveTypes = async () => {
    try {
      const response = await axios.get(`${apiBase}?action=get_leave_types`);
      if (response.data.type === 'success') {
        setLeaveTypes(response.data.data);
      }
    } catch (err) {
      console.error("Fetch leave types error:", err);
    }
  };

  const fetchOvertimeTypes = async () => {
    try {
      const response = await axios.get(`${apiBase}?action=get_overtime_types`);
      if (response.data.type === 'success') {
        setOvertimeTypes(response.data.data);
      }
    } catch (err) {
      console.error("Fetch overtime types error:", err);
    }
  };

  const fetchRequestHistory = async () => {
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) return;

      const [leaveResponse, overtimeResponse] = await Promise.all([
        axios.get(`${apiBase}?action=get_leave_requests&user_id=${user_id}`),
        axios.get(`${apiBase}?action=get_overtime_requests&user_id=${user_id}`)
      ]);

      if (leaveResponse.data.type === 'success') {
        setLeaveRequests(leaveResponse.data.data);
      }
      if (overtimeResponse.data.type === 'success') {
        setOvertimeRequests(overtimeResponse.data.data);
      }
    } catch (err) {
      console.error("Fetch request history error:", err);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLeaveChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOvertimeChange = (e) => {
    const { name, value } = e.target;
    setOvertimeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateLeaveDays = () => {
    if (leaveForm.start_date && leaveForm.end_date) {
      const start = new Date(leaveForm.start_date);
      const end = new Date(leaveForm.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const validateLeaveForm = () => {
    if (!leaveForm.leave_type_id) {
      return "Please select a leave type";
    }
    
    if (!leaveForm.start_date || !leaveForm.end_date) {
      return "Please select start and end dates";
    }
    
    if (new Date(leaveForm.start_date) > new Date(leaveForm.end_date)) {
      return "End date cannot be before start date";
    }
    
    if (calculateLeaveDays() <= 0) {
      return "Invalid date range selected";
    }
    
    return null;
  };

  const validateOvertimeForm = () => {
    if (!overtimeForm.ot_type_id) {
      return "Please select an overtime type";
    }
    
    if (!overtimeForm.request_date) {
      return "Please select a date";
    }
    
    if (!overtimeForm.start_time || !overtimeForm.end_time) {
      return "Please select start and end times";
    }
    
    if (overtimeForm.start_time >= overtimeForm.end_time) {
      return "End time must be after start time";
    }
    
    if (!overtimeForm.reason.trim()) {
      return "Please provide a reason for overtime";
    }
    
    return null;
  };

  const submitLeaveRequest = async (e) => {
    e.preventDefault();
    clearMessages();
    
    const validationError = validateLeaveForm();
    if (validationError) {
      setError(validationError);
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    try {
      const user_id = localStorage.getItem('user_id');
      const submitData = {
        user_id: user_id,
        leave_type_id: leaveForm.leave_type_id,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        days_requested: calculateLeaveDays(),
        notes: leaveForm.notes
      };

      const response = await axios.post(`${apiBase}?action=submit_leave_request`, submitData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess("Leave request submitted successfully!");
        setLeaveForm({
          leave_type_id: "",
          start_date: "",
          end_date: "",
          notes: ""
        });
        if (activeTab === "history") {
          fetchRequestHistory();
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to submit leave request");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Submit leave request error:", err);
      setError("Failed to submit leave request. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const submitOvertimeRequest = async (e) => {
    e.preventDefault();
    clearMessages();
    
    const validationError = validateOvertimeForm();
    if (validationError) {
      setError(validationError);
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    try {
      const user_id = localStorage.getItem('user_id');
      const submitData = {
        user_id: user_id,
        ot_type_id: overtimeForm.ot_type_id,
        request_date: overtimeForm.request_date,
        start_time: overtimeForm.start_time,
        end_time: overtimeForm.end_time,
        reason: overtimeForm.reason
      };

      const response = await axios.post(`${apiBase}?action=submit_overtime_request`, submitData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess("Overtime request submitted successfully!");
        setOvertimeForm({
          ot_type_id: "",
          request_date: "",
          start_time: "",
          end_time: "",
          reason: ""
        });
        if (activeTab === "history") {
          fetchRequestHistory();
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to submit overtime request");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Submit overtime request error:", err);
      setError("Failed to submit overtime request. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setLeaveForm({
      leave_type_id: "",
      start_date: "",
      end_date: "",
      notes: ""
    });
    setOvertimeForm({
      ot_type_id: "",
      request_date: "",
      start_time: "",
      end_time: "",
      reason: ""
    });
    clearMessages();
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not approved';
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getApproverName = (request) => {
    if (request.approved_by_name) {
      return request.approved_by_name;
    }
    return request.approved_by ? `${request.approved_by}` : 'Not approved yet';
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'No notes';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
            <h1 className="text-3xl font-bold text-gray-900">Submit Request</h1>
            <p className="text-gray-600 mt-1">Create new leave or overtime requests</p>
          </div>
          <motion.button
            onClick={resetForms}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <X size={18} />
            Reset Forms
          </motion.button>
        </div>

        {/* Main Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("leave")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "leave"
                ? "border-green-500 text-green-600 bg-green-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Calendar size={18} />
            Leave Request
          </button>
          <button
            onClick={() => setActiveTab("overtime")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overtime"
                ? "border-green-500 text-green-600 bg-green-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Clock size={18} />
            Overtime Request
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "history"
                ? "border-green-500 text-green-600 bg-green-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <History size={18} />
            Request History
          </button>
        </div>
      </motion.div>

      {/* Error and Success Messages */}
      {(error || success) && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <div>
                <p className="font-medium">Submission Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} />
              <div>
                <p className="font-medium">Success!</p>
                <p className="text-sm">{success}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Form Content */}
      <motion.div 
        className="flex-1"
        variants={itemVariants}
      >
        {activeTab === "leave" ? (
          <motion.div
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            variants={cardVariants}
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="text-green-600" size={24} />
                New Leave Request
              </h2>
              <p className="text-gray-600 mt-1">Submit a request for time off work</p>
            </div>

            <form onSubmit={submitLeaveRequest} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Leave Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type *
                  </label>
                  <select
                    name="leave_type_id"
                    value={leaveForm.leave_type_id}
                    onChange={handleLeaveChange}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((type) => (
                      <option key={type.leave_type_id} value={type.leave_type_id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={leaveForm.start_date}
                    onChange={handleLeaveChange}
                    min={getMinDate()}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={leaveForm.end_date}
                    onChange={handleLeaveChange}
                    min={leaveForm.start_date || getMinDate()}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Duration Display */}
                <div className="md:col-span-2 p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Days Requested:</span>
                    <span className="text-lg font-bold text-green-600">
                      {calculateLeaveDays()} day{calculateLeaveDays() !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={leaveForm.notes}
                    onChange={handleLeaveChange}
                    rows={3}
                    placeholder="Additional notes or comments..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-end">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Leave Request
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : activeTab === "overtime" ? (
          <motion.div
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            variants={cardVariants}
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="text-green-600" size={24} />
                New Overtime Request
              </h2>
              <p className="text-gray-600 mt-1">Request approval for overtime work</p>
            </div>

            <form onSubmit={submitOvertimeRequest} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overtime Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Type *
                  </label>
                  <select
                    name="ot_type_id"
                    value={overtimeForm.ot_type_id}
                    onChange={handleOvertimeChange}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Overtime Type</option>
                    {overtimeTypes.map((type) => (
                      <option key={type.ot_type_id} value={type.ot_type_id}>
                        {type.name} (x{type.multiplier} rate)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Date *
                  </label>
                  <input
                    type="date"
                    name="request_date"
                    value={overtimeForm.request_date}
                    onChange={handleOvertimeChange}
                    min={getMinDate()}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      value={overtimeForm.start_time}
                      onChange={handleOvertimeChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      value={overtimeForm.end_time}
                      onChange={handleOvertimeChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Overtime *
                  </label>
                  <textarea
                    name="reason"
                    value={overtimeForm.reason}
                    onChange={handleOvertimeChange}
                    rows={3}
                    placeholder="Explain why you need to work overtime..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-end">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Overtime Request
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          // Request History Tab
          <motion.div
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            variants={cardVariants}
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <History className="text-green-600" size={24} />
                Request History
              </h2>
              <p className="text-gray-600 mt-1">View your previous leave and overtime requests</p>
            </div>

            <div className="p-6">
              {/* Leave Requests */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar size={20} className="text-green-600" />
                    Leave Requests
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {leaveRequests.length} request{leaveRequests.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {leaveRequests.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Period
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Days
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                            Notes
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                            Approved By
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Approved At
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Rejection Reason
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Submitted
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leaveRequests.map((request) => (
                          <tr key={request.leave_id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {request.leave_type}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex flex-col">
                                <span>{formatDate(request.start_date)}</span>
                                <span className="text-xs text-gray-400">to</span>
                                <span>{formatDate(request.end_date)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                {request.days_requested}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[200px]">
                              <div className="flex items-start gap-2">
                                <MessageSquare size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="break-words line-clamp-2">
                                  {request.notes || 'No notes'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <UserCheck size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{getApproverName(request)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-xs">{formatDateTime(request.approved_at)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[150px]">
                              {request.rejection_reason ? (
                                <div className="flex items-start gap-2">
                                  <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                                  <span className="break-words line-clamp-2 text-red-600">
                                    {request.rejection_reason}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="text-xs">{formatDateTime(request.submitted_at)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests</h3>
                    <p className="text-gray-500 mb-4">Get started by submitting a new leave request.</p>
                    <button
                      onClick={() => setActiveTab("leave")}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Submit Leave Request
                    </button>
                  </div>
                )}
              </div>

              {/* Overtime Requests */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock size={20} className="text-green-600" />
                    Overtime Requests
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {overtimeRequests.length} request{overtimeRequests.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {overtimeRequests.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Date & Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Hours
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                            Reason
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                            Approved By
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Approved At
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Rejection Reason
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Submitted
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {overtimeRequests.map((request) => (
                          <tr key={request.ot_id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div>
                                <div>{request.overtime_type}</div>
                                <div className="text-xs text-gray-500">x{request.multiplier} rate</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex flex-col">
                                <span>{formatDate(request.request_date)}</span>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span>{request.start_time}</span>
                                  <span className="mx-1">-</span>
                                  <span>{request.end_time}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              <span className="inline-flex items-center justify-center w-12 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {request.hours}h
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[200px]">
                              <div className="flex items-start gap-2">
                                <MessageSquare size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="break-words line-clamp-2">
                                  {request.reason}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <UserCheck size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{getApproverName(request)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-xs">{formatDateTime(request.approved_at)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[150px]">
                              {request.rejection_reason ? (
                                <div className="flex items-start gap-2">
                                  <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                                  <span className="break-words line-clamp-2 text-red-600">
                                    {request.rejection_reason}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="text-xs">{formatDateTime(request.submitted_at)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Clock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No overtime requests</h3>
                    <p className="text-gray-500 mb-4">Get started by submitting a new overtime request.</p>
                    <button
                      onClick={() => setActiveTab("overtime")}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Submit Overtime Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Help Text */}
      <motion.div 
        className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl"
        variants={itemVariants}
      >
        <div className="flex items-start gap-3">
          <FileText size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> All requests are subject to approval by your manager. 
              You will be notified once your request has been reviewed. 
              For urgent matters, please contact your supervisor directly.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmployeeRequests;