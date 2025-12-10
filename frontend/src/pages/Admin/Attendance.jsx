import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar,
  CheckCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  XCircle, 
  Loader,
  Play,
  FileText,
  Filter,
  RefreshCw,
  Users
} from "lucide-react";
import axios from "axios";

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeDepartmentFilter, setActiveDepartmentFilter] = useState("All");
  const [companyInfo, setCompanyInfo] = useState({ company_name: "Computer Arts and Technological College Inc.", email: "" });
  const [departments, setDepartments] = useState([]);

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/attendance.php';

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

  useEffect(() => {
    fetchAttendance();
    fetchCompanyInfo();
    fetchDepartments();
  }, [selectedDate]);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, activeFilter, activeDepartmentFilter]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(`${apiBase}?action=export_report&date=${selectedDate}`);
      if (response.data.type === 'success' && response.data.data.company) {
        setCompanyInfo(response.data.data.company);
      }
    } catch (err) {
      console.error("Fetch company info error:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${apiBase}?action=get_attendance&date=${selectedDate}`);
      if (response.data.type === 'success') {
        const uniqueDepartments = [...new Set(response.data.data
          .map(record => record.department)
          .filter(dept => dept && dept !== '')
        )].sort();
        
        setDepartments(uniqueDepartments);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    clearMessages();
    try {
      const response = await axios.get(`${apiBase}?action=get_attendance&date=${selectedDate}`);
      if (response.data.type === 'success') {
        setAttendanceRecords(response.data.data);
        const uniqueDepartments = [...new Set(response.data.data
          .map(record => record.department)
          .filter(dept => dept && dept !== '')
        )].sort();
        setDepartments(uniqueDepartments);
      } else {
        setError("Failed to fetch attendance records");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Fetch attendance error:", err);
      setError("An error occurred while fetching attendance records");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = attendanceRecords;

    if (activeFilter !== "All") {
      filtered = filtered.filter(record => record.status === activeFilter);
    }

    if (activeDepartmentFilter !== "All") {
      filtered = filtered.filter(record => record.department === activeDepartmentFilter);
    }

    setFilteredRecords(filtered);
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  const handleDepartmentFilterClick = (department) => {
    setActiveDepartmentFilter(department);
  };

  const handleGenerate = async () => {
    setGenerateLoading(true);
    clearMessages();
    try {
      const response = await axios.post(`${apiBase}?action=generate_attendance`, {
        date: selectedDate
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchAttendance();
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Generate attendance error:", err);
      setError("An error occurred while generating attendance");
      setTimeout(() => setError(""), 3000);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdateLoading(true);
    clearMessages();
    try {
      const response = await axios.post(`${apiBase}?action=update_status`, {
        date: selectedDate
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchAttendance();
      } else {
        if (response.data.message && response.data.message.includes('Time remaining')) {
          setError(response.data.message);
          setTimeout(() => setError(""), 3000);
        } else {
          setError(response.data.message || "An error occurred while updating attendance status");
          setTimeout(() => setError(""), 3000);
        }
      }
    } catch (err) {
      console.error("Update status error:", err);
      setError("An error occurred while updating attendance status");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    clearMessages();
    
    try {
      const response = await axios.get(
        `${apiBase}?action=export_report&date=${selectedDate}`,
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
        
        setSuccess("PDF report downloaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to export report");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Export error:", err);
      if (err.code === 'ECONNABORTED') {
        setError("Export request timed out. Please try again.");
        setTimeout(() => setError(""), 3000);
      } else {
        setError("An error occurred while exporting the report");
        setTimeout(() => setError(""), 3000);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present":
        return <CheckCircle size={16} className="text-green-600" />;
      case "Late":
        return <Clock size={16} className="text-yellow-600" />;
      case "On Leave":
        return <CalendarIcon size={16} className="text-blue-600" />;
      case "Absent":
        return <XCircle size={16} className="text-red-600" />;
      case "Holiday":
        return <CalendarIcon size={16} className="text-purple-600" />;
      default:
        return <CheckCircle size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800 border-green-200";
      case "Late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "On Leave":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Absent":
        return "bg-red-100 text-red-800 border-red-200";
      case "Holiday":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCardColor = (status) => {
    switch (status) {
      case "Present":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-600",
          hover: "hover:bg-green-100"
        };
      case "Late":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-600",
          hover: "hover:bg-yellow-100"
        };
      case "On Leave":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-600",
          hover: "hover:bg-blue-100"
        };
      case "Absent":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-600",
          hover: "hover:bg-red-100"
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-600",
          hover: "hover:bg-gray-100"
        };
    }
  };

  const getDepartmentColor = (department) => {
    const colors = [
      { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600", hover: "hover:bg-indigo-100" },
      { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-600", hover: "hover:bg-pink-100" },
      { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-600", hover: "hover:bg-teal-100" },
      { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", hover: "hover:bg-orange-100" },
      { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", hover: "hover:bg-purple-100" },
      { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600", hover: "hover:bg-cyan-100" },
      { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", hover: "hover:bg-amber-100" },
    ];
    
    if (department === "All") {
      return { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600", hover: "hover:bg-gray-100" };
    }
    
    const index = departments.indexOf(department) % colors.length;
    return colors[index];
  };

  const summaryStats = {
    Present: attendanceRecords.filter(record => record.status === "Present").length,
    Late: attendanceRecords.filter(record => record.status === "Late").length,
    "On Leave": attendanceRecords.filter(record => record.status === "On Leave").length,
    Absent: attendanceRecords.filter(record => record.status === "Absent").length,
    Holiday: attendanceRecords.filter(record => record.status === "Holiday").length,
  };

  const departmentStats = {
    All: attendanceRecords.length,
    ...departments.reduce((acc, dept) => {
      acc[dept] = attendanceRecords.filter(record => record.department === dept).length;
      return acc;
    }, {})
  };

  const statusFilterButtons = [
    { label: "All", count: summaryStats.Present + summaryStats.Late + summaryStats["On Leave"] + summaryStats.Absent + summaryStats.Holiday, status: "All" },
    { label: "Present", count: summaryStats.Present, status: "Present" },
    { label: "Late", count: summaryStats.Late, status: "Late" },
    { label: "On Leave", count: summaryStats["On Leave"], status: "On Leave" },
    { label: "Absent", count: summaryStats.Absent, status: "Absent" },
  ];

  const departmentFilterButtons = [
    { label: "All", count: departmentStats.All, department: "All" },
    ...departments.map(dept => ({
      label: dept,
      count: departmentStats[dept] || 0,
      department: dept
    }))
  ];

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
            <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor and manage employee attendance records</p>
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

        {/* Date Selector and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <label className="text-gray-700 font-medium whitespace-nowrap">Select Date:</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <motion.button 
              onClick={handleGenerate}
              disabled={generateLoading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              variants={buttonVariants}
              whileHover={!generateLoading ? "hover" : undefined}
              whileTap={!generateLoading ? "tap" : undefined}
            >
              {generateLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Generate Attendance
                </>
              )}
            </motion.button>
            
            <motion.button 
              onClick={handleUpdateStatus}
              disabled={updateLoading}
              className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              variants={buttonVariants}
              whileHover={!updateLoading ? "hover" : undefined}
              whileTap={!updateLoading ? "tap" : undefined}
            >
              {updateLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Mark Absent
                </>
              )}
            </motion.button>
            
            <motion.button 
              onClick={handleExport}
              disabled={exportLoading || attendanceRecords.length === 0}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              variants={buttonVariants}
              whileHover={!exportLoading ? "hover" : undefined}
              whileTap={!exportLoading ? "tap" : undefined}
            >
              {exportLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Export Report
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs Section */}
      <motion.div 
        className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        {/* Status Filter Tabs */}
        <div className="border-b border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter by Status</h3>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {statusFilterButtons.map((filter) => {
                const isActive = activeFilter === filter.status;
                const colors = getCardColor(filter.status);
                return (
                  <motion.button
                    key={filter.status}
                    onClick={() => handleFilterClick(filter.status)}
                    className={`px-4 py-2.5 rounded-lg font-medium border transition-all flex items-center gap-2 ${
                      isActive 
                        ? `${colors.bg} ${colors.border} ${colors.text} border-2 shadow-md` 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {getStatusIcon(filter.status === "All" ? "All" : filter.status)}
                    <span className="font-semibold">{filter.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                    }`}>
                      {filter.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Department Filter Tabs */}
        <div>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter by Department</h3>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {departmentFilterButtons.map((filter) => {
                const isActive = activeDepartmentFilter === filter.department;
                const colors = getDepartmentColor(filter.department);
                return (
                  <motion.button
                    key={filter.department}
                    onClick={() => handleDepartmentFilterClick(filter.department)}
                    className={`px-4 py-2.5 rounded-lg font-medium border transition-all flex items-center gap-2 ${
                      isActive 
                        ? `${colors.bg} ${colors.border} ${colors.text} border-2 shadow-md` 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Users size={16} className={isActive ? colors.text : 'text-gray-600'} />
                    <span className="font-semibold">{filter.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                    }`}>
                      {filter.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Attendance Table */}
      <motion.div 
        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col"
        variants={itemVariants}
      >
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading attendance records...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Clock In
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Clock Out
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRecords.map((record, index) => (
                      <motion.tr 
                        key={record.emp_id}
                        className="hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4 text-gray-900 font-medium">{record.emp_id}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">{record.name}</td>
                        <td className="px-6 py-4 text-gray-700">{record.department || "-"}</td>
                        <td className="px-6 py-4 text-gray-700">{record.clock_in || "-"}</td>
                        <td className="px-6 py-4 text-gray-700">{record.clock_out || "-"}</td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{record.hours_worked || "0.00"}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}
                            >
                              {record.status}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {filteredRecords.length === 0 && !loading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {activeFilter === "All" && activeDepartmentFilter === "All" 
                        ? "No attendance records found" 
                        : `No matching records found`
                      }
                    </h3>
                    <p className="text-gray-500">
                      {activeFilter === "All" && activeDepartmentFilter === "All" 
                        ? `Click "Generate Attendance" to create attendance records for ${selectedDate}`
                        : `No employees match the current filters. Try adjusting your filter criteria.`
                      }
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Table Footer */}
        {filteredRecords.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-600">
              Showing {filteredRecords.length} records for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              {activeFilter !== "All" && ` • Status: ${activeFilter}`}
              {activeDepartmentFilter !== "All" && ` • Department: ${activeDepartmentFilter}`}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Attendance;