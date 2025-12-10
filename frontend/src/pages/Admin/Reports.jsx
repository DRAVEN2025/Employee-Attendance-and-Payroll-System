import { motion } from "framer-motion";
import { 
  BarChart3,
  FileText, 
  Calendar, 
  Wallet,
  Loader,
  AlertCircle,
  CheckCircle,
  FileBarChart,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [allReportsLoading, setAllReportsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [department, setDepartment] = useState("all");
  const [recentReports, setRecentReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const reportTypes = [
    { 
      title: "Attendance Report", 
      description: "Monthly attendance summary for all employees", 
      icon: <Calendar size={24} className="text-white" />,
      color: "from-blue-500 to-blue-600",
      type: "attendance"
    },
    { 
      title: "Payroll Report", 
      description: "Detailed payroll breakdown and statistics", 
      icon: <Wallet size={24} className="text-white" />,
      color: "from-green-500 to-green-600",
      type: "payroll"
    },
    { 
      title: "Leave Report", 
      description: "Leave balance and usage analytics", 
      icon: <Calendar size={24} className="text-white" />,
      color: "from-purple-500 to-purple-600",
      type: "leave"
    },
    { 
      title: "Performance Report", 
      description: "Employee performance metrics and KPIs", 
      icon: <BarChart3 size={24} className="text-white" />,
      color: "from-orange-500 to-orange-600",
      type: "performance"
    },
  ];

  const departments = [
    { value: "all", label: "All Departments" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Information Technology", label: "Information Technology" },
    { value: "Finance", label: "Finance" },
    { value: "Marketing", label: "Marketing" },
    { value: "Operations", label: "Operations" },
    { value: "Sales", label: "Sales" },
    { value: "Research & Development", label: "Research & Development" }
  ];

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

  const reportCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        delay: index * 0.1,
      },
    }),
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/reports.php';

  useEffect(() => {
    fetchReportHistory();
  }, []);

  const fetchReportHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${apiBase}?action=get_report_history`);
      if (response.data.type === 'success') {
        setRecentReports(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching report history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const getMonthDateRange = (monthString) => {
    if (!monthString) return { start_date: "", end_date: "" };
    
    const [year, month] = monthString.split('-');
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate)
    };
  };

  const generateReport = async (reportType) => {
    if (!selectedMonth) {
      setError("Please select a month");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      let action = 'generate_attendance_report';
      switch (reportType) {
        case 'attendance':
          action = 'generate_attendance_report';
          break;
        case 'payroll':
          action = 'generate_payroll_report';
          break;
        case 'leave':
          action = 'generate_leave_report';
          break;
        case 'performance':
          action = 'generate_performance_report';
          break;
        default:
          throw new Error('Invalid report type');
      }

      const dateRange = getMonthDateRange(selectedMonth);
      
      console.log('Generating report for:', {
        selectedMonth,
        dateRange,
        department
      });

      const response = await axios.post(`${apiBase}?action=${action}`, {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        department: department
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });

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
        
        await fetchReportHistory();
        
        setSuccess(`${reportTypes.find(r => r.type === reportType)?.title} generated successfully!`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to generate report");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Generate report error:", err);
      if (err.code === 'ECONNABORTED') {
        setError("Report generation timed out. Please try again.");
      } else {
        setError("An error occurred while generating the report");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const generateAllReports = async () => {
    if (!selectedMonth) {
      setError("Please select a month");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setAllReportsLoading(true);
    clearMessages();

    try {
      const dateRange = getMonthDateRange(selectedMonth);
      
      const reportsToGenerate = [
        { type: 'attendance', title: 'Attendance Report' },
        { type: 'payroll', title: 'Payroll Report' },
        { type: 'leave', title: 'Leave Report' },
        { type: 'performance', title: 'Performance Report' }
      ];

      let successCount = 0;

      for (const report of reportsToGenerate) {
        try {
          const action = `generate_${report.type}_report`;
          const response = await axios.post(`${apiBase}?action=${action}`, {
            start_date: dateRange.start_date,
            end_date: dateRange.end_date,
            department: department
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000
          });

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
            
            successCount++;
          }
        } catch (err) {
          console.error(`Error generating ${report.title}:`, err);
        }
      }

      await fetchReportHistory();
      
      if (successCount === reportsToGenerate.length) {
        setSuccess("All reports generated successfully!");
      } else if (successCount > 0) {
        setSuccess(`${successCount} out of ${reportsToGenerate.length} reports generated successfully. Some reports may have failed.`);
      } else {
        setError("Failed to generate all reports. Please try again.");
      }
      
      setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);

    } catch (err) {
      console.error("Generate all reports error:", err);
      setError("An error occurred while generating reports");
      setTimeout(() => setError(""), 3000);
    } finally {
      setAllReportsLoading(false);
    }
  };

  const getMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthString = `${year}-${month}`;
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      months.push({ value: monthString, label: monthName });
    }
    
    return months;
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'attendance':
        return <Calendar size={16} className="text-blue-500" />;
      case 'payroll':
        return <Wallet size={16} className="text-green-500" />;
      case 'leave':
        return <FileText size={16} className="text-purple-500" />;
      case 'performance':
        return <BarChart3 size={16} className="text-orange-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Completed
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          Failed
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Generate and manage various reports</p>
          </div>
        </div>
      </motion.div>

      {/* Month and Department Filters */}
      <motion.div 
        className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
        variants={itemVariants}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
          <motion.button 
            onClick={generateAllReports}
            disabled={allReportsLoading || !selectedMonth}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            variants={buttonVariants}
            whileHover={!allReportsLoading ? "hover" : undefined}
            whileTap={!allReportsLoading ? "tap" : undefined}
          >
            {allReportsLoading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <FileBarChart size={16} />
            )}
            {allReportsLoading ? "Generating All..." : "Generate All Reports"}
          </motion.button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month *
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Month</option>
              {getMonthOptions().map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            {selectedMonth && (
              <p className="text-sm text-gray-500 mt-1">
                Selected: {getMonthOptions().find(m => m.value === selectedMonth)?.label}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
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

      {/* Report Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        variants={itemVariants}
      >
        {reportTypes.map((report, index) => (
          <motion.div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
            variants={reportCardVariants}
            custom={index}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${report.color} rounded-full flex items-center justify-center shadow-sm`}>
                {report.icon}
              </div>
              <motion.button 
                onClick={() => generateReport(report.type)}
                disabled={loading || !selectedMonth}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                variants={buttonVariants}
                whileHover={!loading ? "hover" : undefined}
                whileTap={!loading ? "tap" : undefined}
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <BarChart3 size={16} />
                )}
                {loading ? "Generating..." : "Generate"}
              </motion.button>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{report.title}</h3>
            <p className="text-gray-600">{report.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Report Generation History */}
      <motion.div 
        className="bg-white border border-gray-200 rounded-xl p-6"
        variants={itemVariants}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Report Generation History</h2>
            <p className="text-gray-600 text-sm mt-1">Recently generated reports and their status</p>
          </div>
          <motion.button
            onClick={fetchReportHistory}
            disabled={loadingHistory}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <RefreshCw size={16} className={loadingHistory ? "animate-spin" : ""} />
            Refresh
          </motion.button>
        </div>
        
        {loadingHistory ? (
          <div className="flex justify-center items-center py-12">
            <Loader size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {recentReports.map((report, index) => (
              <motion.div 
                key={report.log_id}
                className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getReportIcon(report.report_type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{report.report_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-500">
                        {formatDate(report.generated_at)}
                      </p>
                      <p className="text-sm text-gray-500">
                        • {report.department === 'all' ? 'All Departments' : report.department}
                      </p>
                      {getStatusBadge(report.status)}
                    </div>
                    {report.filename && (
                      <p className="text-xs text-gray-400 mt-1">
                        File: {report.filename}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State for Recent Reports */}
        {!loadingHistory && recentReports.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No report history</h3>
            <p className="text-gray-500">Generate your first report to see it here</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Reports;