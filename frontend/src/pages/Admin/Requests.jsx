import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Search,
  Filter,
  Loader,
  AlertCircle,
  ClockIcon,
  Zap,
  UserCheck,
  CalendarCheck
} from "lucide-react";
import axios from "axios";

const Requests = () => {
  const [activeTab, setActiveTab] = useState("leave");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/requests.php';

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
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const [leaveResponse, overtimeResponse] = await Promise.all([
        axios.get(`${apiBase}?action=get_leave_requests`),
        axios.get(`${apiBase}?action=get_overtime_requests`)
      ]);

      if (leaveResponse.data.type === 'success') {
        setLeaveRequests(leaveResponse.data.data);
      } else {
        setError("Failed to load leave requests");
      }

      if (overtimeResponse.data.type === 'success') {
        setOvertimeRequests(overtimeResponse.data.data);
      } else {
        setError("Failed to load overtime requests");
      }
    } catch (err) {
      console.error("Fetch requests error:", err);
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const openRejectionModal = (request) => {
    setCurrentRequest(request);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setCurrentRequest(null);
    setRejectionReason("");
  };

  const handleStatusUpdate = async (requestId, status, type, reason = "") => {
    setActionLoading(requestId);
    clearMessages();

    try {
      const adminUsername = localStorage.getItem('username') || 'admin';
      
      const response = await axios.post(`${apiBase}?action=update_request_status`, {
        request_id: requestId,
        status: status,
        approved_by: adminUsername,
        request_type: type,
        rejection_reason: reason
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(`Request ${status} successfully`);
        fetchRequests();
        if (status === 'rejected') {
          closeRejectionModal();
        }
        
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        setError(response.data.message);
        
        setTimeout(() => {
          setError("");
        }, 3000);
      }
    } catch (err) {
      console.error("Update request error:", err);
      setError("Failed to update request status");
      
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithReason = () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      
      setTimeout(() => {
        setError("");
      }, 3000);
      return;
    }
    handleStatusUpdate(currentRequest.id, 'rejected', activeTab, rejectionReason);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'rejected':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon size={16} className="text-yellow-600" />;
      case 'approved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <ClockIcon size={16} className="text-gray-600" />;
    }
  };

  const getFilteredRequests = () => {
    const requests = activeTab === "leave" ? leaveRequests : overtimeRequests;
    
    let filtered = requests.filter(request =>
      request.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    return filtered;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const calculateOvertimePay = (hours, hourlyRate) => {
    return (hours * hourlyRate).toFixed(2);
  };

  const getCounts = () => {
    const requests = activeTab === "leave" ? leaveRequests : overtimeRequests;
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  };

  const counts = getCounts();

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Request
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this {activeTab} request for {currentRequest?.employee_name}:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeRejectionModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWithReason}
                disabled={actionLoading === currentRequest?.id || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === currentRequest?.id ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Confirm Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <motion.div className="mb-6 flex-shrink-0" variants={itemVariants}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Requests Management</h1>
            <p className="text-gray-600 mt-1">Review and manage employee leave and overtime requests</p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("leave")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "leave"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calendar size={18} />
            Leave Requests ({leaveRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("overtime")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overtime"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock size={18} />
            Overtime Requests ({overtimeRequests.length})
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              statusFilter === "all"
                ? "border-gray-500 text-gray-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All ({counts.total})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              statusFilter === "pending"
                ? "border-yellow-500 text-yellow-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClockIcon size={16} />
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              statusFilter === "approved"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CheckCircle size={16} />
            Approved ({counts.approved})
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              statusFilter === "rejected"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <XCircle size={16} />
            Rejected ({counts.rejected})
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'leave' ? 'leave' : 'overtime'} requests by employee name, ID, or department...`}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter size={16} />
            <span>Filtered by: {statusFilter === 'all' ? 'All Status' : statusFilter}</span>
          </div>
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

      {/* Requests List */}
      <motion.div 
        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col"
        variants={itemVariants}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading requests...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Employee
                    </th>
                    {activeTab === "leave" ? (
                      <>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Leave Details
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Duration
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Overtime Details
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Compensation
                        </th>
                      </>
                    )}
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Approved By
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Approved At
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Rejection Reason
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getFilteredRequests().map((request, index) => (
                    <motion.tr 
                      key={request.id}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {request.employee_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{request.employee_name}</div>
                            <div className="text-sm text-gray-500">EMP-{request.employee_id.toString().padStart(3, '0')}</div>
                            <div className="text-xs text-gray-400">{request.department}</div>
                          </div>
                        </div>
                      </td>

                      {activeTab === "leave" ? (
                        <>
                          <td className="px-6 py-4">
                            <div className="text-gray-900 font-medium">{request.leave_type}</div>
                            <div className="text-sm text-gray-600 mt-1">{request.reason}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-700">
                              {formatDate(request.start_date)} - {formatDate(request.end_date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.days_requested} day{request.days_requested !== 1 ? 's' : ''}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div className="text-gray-900 font-medium">{request.overtime_type}</div>
                            <div className="text-sm text-gray-600 mt-1">{request.reason}</div>
                            <div className="text-sm text-gray-500">
                              Date: {formatDate(request.request_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-700 font-medium">
                              {request.hours} hour{request.hours !== 1 ? 's' : ''}
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                              ₱{calculateOvertimePay(request.hours, request.hourly_rate)}
                            </div>
                          </td>
                        </>
                      )}

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStatusColor(request.status)}`}
                        >
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-700 text-sm">
                        {formatDateTime(request.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        {request.approved_by ? (
                          <div className="flex items-center gap-2">
                            <UserCheck size={16} className="text-green-600" />
                            <span className="text-sm text-gray-700">{request.approved_by}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {request.approved_at ? (
                          <div className="flex items-center gap-2">
                            <CalendarCheck size={16} className="text-blue-600" />
                            <span className="text-sm text-gray-700">
                              {formatDateTime(request.approved_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        {request.rejection_reason ? (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            {request.rejection_reason}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {request.status === 'pending' && (
                            <>
                              <motion.button
                                onClick={() => handleStatusUpdate(request.id, 'approved', activeTab)}
                                disabled={actionLoading === request.id}
                                className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm flex items-center gap-1"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {actionLoading === request.id ? (
                                  <Loader size={14} className="animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle size={14} />
                                    Approve
                                  </>
                                )}
                              </motion.button>
                              <motion.button
                                onClick={() => openRejectionModal(request)}
                                disabled={actionLoading === request.id}
                                className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm flex items-center gap-1"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <XCircle size={14} />
                                Reject
                              </motion.button>
                            </>
                          )}
                          {request.status !== 'pending' && (
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

            {/* Empty State */}
            {getFilteredRequests().length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === "leave" ? (
                      <Calendar size={32} className="text-gray-400" />
                    ) : (
                      <Zap size={32} className="text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No {statusFilter !== 'all' ? statusFilter : ''} requests found
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? "Try adjusting your search terms" 
                      : `No ${activeTab} requests match the current filters`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-600">
            Showing {getFilteredRequests().length} of {counts.total} {activeTab} requests
            {statusFilter !== 'all' && ` (filtered by ${statusFilter})`}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Requests;