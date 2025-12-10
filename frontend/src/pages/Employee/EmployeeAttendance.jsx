import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Loader,
  FileText,
  LogIn,
  LogOut
} from "lucide-react";
import axios from "axios";

const EmployeeAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [summaryStats, setSummaryStats] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [canClockIn, setCanClockIn] = useState(true);
  const [clockInMessage, setClockInMessage] = useState("");
  const [companyInfo, setCompanyInfo] = useState(null);

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Employee/employeeattendance.php';

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
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
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
    const initializeData = async () => {
        try {
            await Promise.all([
                fetchAttendanceData(),
                fetchTodayAttendance(),
                fetchWorkingHours(),
                fetchCompanyInfo()
            ]);
        } catch (error) {
            console.error("Initialization error:", error);
            setError("Failed to load attendance data");
            setAttendanceData(getMockData());
            setSummaryStats(getMockSummaryStats());
            setWorkingHours(getMockWorkingHours());
            setCompanyInfo({ company_name: "Computer Arts and Technological College Inc." });
        } finally {
            setLoading(false);
        }
    };

    initializeData();

    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (workingHours) {
      checkClockInAvailability();
    }
  }, [currentTime, workingHours]);

  const checkClockInAvailability = () => {
    if (!workingHours) {
      setCanClockIn(true);
      setClockInMessage("Loading working hours...");
      return;
    }

    try {
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = workingHours.start_time.split(':').map(Number);
      const [endHour, endMinute] = workingHours.end_time.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      const isWithinWorkingHours = currentTimeInMinutes >= startTimeInMinutes && 
                                  currentTimeInMinutes <= endTimeInMinutes;
      
      if (currentTimeInMinutes < startTimeInMinutes) {
        const minutesUntilStart = startTimeInMinutes - currentTimeInMinutes;
        setClockInMessage(`Clock-in available in ${minutesUntilStart} minutes`);
        setCanClockIn(false);
      } else if (currentTimeInMinutes > endTimeInMinutes) {
        setClockInMessage('Working hours have ended for today');
        setCanClockIn(false);
      } else {
        setClockInMessage('Clock-in available');
        setCanClockIn(true);
      }
    } catch (error) {
      console.error("Error checking clock-in availability:", error);
      setCanClockIn(true);
      setClockInMessage("Clock-in available");
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const fetchWorkingHours = async () => {
    try {
      const response = await axios.get(
        `${apiBase}?action=get_working_hours`,
        { timeout: 5000 }
      );

      if (response.data.type === 'success') {
        setWorkingHours(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch working hours');
      }
    } catch (err) {
      console.error("Fetch working hours error:", err);
      setWorkingHours(getMockWorkingHours());
    }
  };

  const fetchAttendanceData = async () => {
    clearMessages();
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error("User not authenticated");
      }

      const [attendanceResponse, summaryResponse] = await Promise.all([
        axios.get(
          `${apiBase}?action=get_attendance_data&user_id=${user_id}&month=${currentMonth}&year=${currentYear}`,
          { timeout: 10000 }
        ),
        axios.get(
          `${apiBase}?action=get_attendance_summary&user_id=${user_id}&month=${currentMonth}&year=${currentYear}`,
          { timeout: 10000 }
        )
      ]);

      if (attendanceResponse.data.type === 'success') {
        setAttendanceData(attendanceResponse.data.data || []);
      } else {
        throw new Error(attendanceResponse.data.message || "Failed to fetch attendance data");
      }

      if (summaryResponse.data.type === 'success') {
        const summary = summaryResponse.data.data;
        updateSummaryStats(summary);
      }

    } catch (err) {
      console.error("Fetch attendance data error:", err);
      setError("An error occurred while fetching attendance data");
      setTimeout(() => setError(""), 3000);
      setAttendanceData(getMockData());
      setSummaryStats(getMockSummaryStats());
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        return;
      }

      const response = await axios.get(
        `${apiBase}?action=get_today_attendance&user_id=${user_id}`,
        { timeout: 5000 }
      );

      if (response.data.type === 'success') {
        setTodayAttendance(response.data.data);
      }
    } catch (err) {
      console.error("Fetch today attendance error:", err);
    }
  };

  const updateSummaryStats = (summary) => {
    const stats = [
      {
        label: "This Month",
        value: `${summary.present_days} Days`,
        icon: Calendar,
        color: "green",
        change: "+0%"
      },
      {
        label: "Total Hours",
        value: `${Math.round(summary.total_hours)} hrs`,
        icon: Clock,
        color: "green",
        change: "+0%"
      },
      {
        label: "Late Arrivals",
        value: `${summary.late_days}`,
        icon: AlertTriangle,
        color: "yellow",
        change: "0"
      },
      {
        label: "Absences",
        value: `${summary.absent_days}`,
        icon: CheckCircle,
        color: summary.absent_days > 0 ? "red" : "green",
        change: "0"
      }
    ];
    setSummaryStats(stats);
  };

  const handleClockIn = async () => {
    setClockLoading(true);
    clearMessages();
    
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error("User not authenticated");
      }

      const now = new Date();
      const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      const clockInTime = phTime.toISOString().slice(0, 19).replace('T', ' ');
      
      const response = await axios.post(
        `${apiBase}?action=clock_in`,
        { 
          user_id,
          clock_in_time: clockInTime
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.type === 'success') {
        const message = response.data.is_late 
          ? `Clocked in successfully! (Marked as Late - ${response.data.late_minutes} minutes late)`
          : 'Clocked in successfully!';
        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
        await Promise.all([
          fetchTodayAttendance(),
          fetchAttendanceData()
        ]);
      } else {
        setError(response.data.message || "Failed to clock in");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Clock in error:", err);
      if (err.code === 'ECONNABORTED') {
        setError("Clock-in request timed out. Please try again.");
      } else {
        setError("An error occurred while clocking in");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    clearMessages();
    
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error("User not authenticated");
      }

      const now = new Date();
      const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      const clockOutTime = phTime.toISOString().slice(0, 19).replace('T', ' ');

      const response = await axios.post(
        `${apiBase}?action=clock_out`,
        { 
          user_id,
          clock_out_time: clockOutTime
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.type === 'success') {
        let message = 'Clocked out successfully!';
        if (response.data.is_half_day) {
          message += ' (Marked as Half-Day)';
        }
        if (parseFloat(response.data.overtime_hrs) > 0) {
          message += ` (${response.data.overtime_hrs} hours overtime)`;
        }
        
        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
        await Promise.all([
          fetchTodayAttendance(),
          fetchAttendanceData()
        ]);
      } else {
        setError(response.data.message || "Failed to clock out");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Clock out error:", err);
      if (err.code === 'ECONNABORTED') {
        setError("Clock-out request timed out. Please try again.");
      } else {
        setError("An error occurred while clocking out");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setClockLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    clearMessages();

    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error("User not authenticated");
      }

      const response = await axios.get(
        `${apiBase}?action=export_report&user_id=${user_id}&month=${currentMonth}&year=${currentYear}&format=pdf`,
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
      setError("An error occurred while exporting the report");
      setTimeout(() => setError(""), 3000);
    } finally {
      setExportLoading(false);
    }
  };
  
  const fetchCompanyInfo = async () => {
    try {
        const response = await axios.get(
            `${apiBase}?action=get_company_info`,
            { timeout: 5000 }
        );

        if (response.data.type === 'success') {
            setCompanyInfo(response.data.data);
        }
    } catch (err) {
        console.error("Fetch company info error:", err);
        setCompanyInfo({ company_name: "Computer Arts and Technological College Inc." });
    }
  };

  const getMockData = () => {
    return [
      { 
        id: 1, 
        date: "2025-01-10", 
        clockIn: "08:45 AM", 
        clockOut: "05:30 PM", 
        hours: "8.75", 
        status: "Present",
        overtime: "0.75"
      },
      { 
        id: 2, 
        date: "2025-01-09", 
        clockIn: "09:00 AM", 
        clockOut: "06:00 PM", 
        hours: "9.00", 
        status: "Present",
        overtime: "1.00"
      },
      { 
        id: 3, 
        date: "2025-01-08", 
        clockIn: "09:15 AM", 
        clockOut: "05:45 PM", 
        hours: "8.50", 
        status: "Late",
        overtime: "0.50"
      },
    ];
  };

  const getMockSummaryStats = () => {
    return [
      {
        label: "This Month",
        value: "22 Days",
        icon: Calendar,
        color: "green",
        change: "+2%"
      },
      {
        label: "Total Hours",
        value: "176 hrs",
        icon: Clock,
        color: "green",
        change: "+5%"
      },
      {
        label: "Late Arrivals",
        value: "3",
        icon: AlertTriangle,
        color: "yellow",
        change: "-1"
      },
      {
        label: "Absences",
        value: "0",
        icon: CheckCircle,
        color: "green",
        change: "0"
      }
    ];
  };

  const getMockWorkingHours = () => {
    return {
      start_time: "08:00:00",
      end_time: "18:00:00",
      late_mins: 30,
      deductions: "10.00"
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800 border-green-200";
      case "Late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Half-Day":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Holiday":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "On Leave":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Absent":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present":
        return <CheckCircle size={16} className="text-green-600" />;
      case "Late":
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case "Half-Day":
        return <AlertTriangle size={16} className="text-blue-600" />;
      case "Holiday":
        return <Calendar size={16} className="text-purple-600" />;
      case "On Leave":
        return <Calendar size={16} className="text-orange-600" />;
      case "Absent":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Calendar size={16} className="text-gray-600" />;
    }
  };

  const handleMonthChange = (increment) => {
    setCurrentMonth(prev => {
      let newMonth = prev + increment;
      let newYear = currentYear;
      
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      
      setCurrentYear(newYear);
      return newMonth;
    });
  };

  const getMonthName = (month) => {
    return new Date(currentYear, month - 1).toLocaleString('default', { month: 'long' });
  };

  const getFormattedTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const getWorkingHoursInfo = () => {
    if (!workingHours) return null;
    
    const startTime = new Date(`2000-01-01T${workingHours.start_time}`);
    const endTime = new Date(`2000-01-01T${workingHours.end_time}`);
    
    return {
      start: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      end: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      lateMins: workingHours.late_mins
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  const workingHoursInfo = getWorkingHoursInfo();

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
            <p className="text-gray-600 mt-1">Track your attendance records and working hours</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
              <motion.button 
                onClick={() => handleMonthChange(-1)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <span className="font-medium text-gray-700 min-w-32 text-center">
                {getMonthName(currentMonth)} {currentYear}
              </span>
              <motion.button 
                onClick={() => handleMonthChange(1)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>

            {/* Export Button */}
            <motion.button 
              onClick={handleExport}
              disabled={exportLoading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {exportLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <FileText size={20} />
              )}
              {exportLoading ? "Generating PDF..." : "Export Report"}
            </motion.button>
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
      </div>

      {/* Clock In/Out Section */}
      <motion.div 
        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6"
        variants={itemVariants}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Today's Attendance</h2>
            <p className="text-gray-600">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Clock size={16} className="text-gray-500" />
              <p className="text-sm font-medium text-gray-700">
                Current time: <span className="text-green-600 font-bold">{getFormattedTime()}</span>
              </p>
            </div>
            
            {workingHoursInfo && (
              <div className="mt-2 text-sm text-gray-600">
                <p><strong>Working Hours:</strong> {workingHoursInfo.start} - {workingHoursInfo.end}</p>
                <p><strong>Grace Period:</strong> {workingHoursInfo.lateMins} minutes</p>
                <p className={`text-sm font-medium mt-1 ${
                  canClockIn ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {clockInMessage}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            {/* Clock In Button */}
            <motion.button
              onClick={handleClockIn}
              disabled={clockLoading || todayAttendance?.clock_in || !canClockIn}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                todayAttendance?.clock_in 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : !canClockIn
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              whileHover={{ 
                scale: (todayAttendance?.clock_in || !canClockIn) ? 1 : 1.05 
              }}
              whileTap={{ 
                scale: (todayAttendance?.clock_in || !canClockIn) ? 1 : 0.95 
              }}
            >
              {clockLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {todayAttendance?.clock_in ? 'Clocked In' : 
               !canClockIn ? 'Outside Hours' : 'Clock In'}
            </motion.button>

            {/* Clock Out Button */}
            <motion.button
              onClick={handleClockOut}
              disabled={clockLoading || !todayAttendance?.clock_in || todayAttendance?.clock_out}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                !todayAttendance?.clock_in || todayAttendance?.clock_out
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              whileHover={{ scale: (!todayAttendance?.clock_in || todayAttendance?.clock_out) ? 1 : 1.05 }}
              whileTap={{ scale: (!todayAttendance?.clock_in || todayAttendance?.clock_out) ? 1 : 0.95 }}
            >
              {clockLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <LogOut size={20} />
              )}
              {todayAttendance?.clock_out ? 'Clocked Out' : 'Clock Out'}
            </motion.button>
          </div>
        </div>

        {/* Today's Status */}
        {todayAttendance && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Clock In Time</p>
                <p className="font-semibold text-gray-900">
                  {todayAttendance.clock_in || 'Not clocked in yet'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clock Out Time</p>
                <p className="font-semibold text-gray-900">
                  {todayAttendance.clock_out || 'Not clocked out yet'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Status</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(todayAttendance.status)}
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(todayAttendance.status)}`}>
                    {todayAttendance.status}
                  </span>
                </div>
              </div>
              {todayAttendance.late_minutes > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Late Minutes</p>
                  <p className="font-semibold text-yellow-600">
                    {todayAttendance.late_minutes} minutes
                  </p>
                </div>
              )}
              {todayAttendance.overtime_hrs > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Overtime Hours</p>
                  <p className="font-semibold text-blue-600">
                    {todayAttendance.overtime_hrs} hours
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {summaryStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            custom={index}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                stat.color === 'green' ? 'bg-green-100' :
                stat.color === 'yellow' ? 'bg-yellow-100' :
                stat.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <stat.icon size={24} className={
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'yellow' ? 'text-yellow-600' :
                  stat.color === 'red' ? 'text-red-600' : 'text-gray-600'
                } />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.change.startsWith('+') ? 'text-green-600' :
                stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
              }`}>
                <TrendingUp size={16} />
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Attendance History */}
      <motion.div 
        className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Attendance History - {getMonthName(currentMonth)} {currentYear}</h2>
          <p className="text-gray-600 text-sm mt-1">Your recent attendance records</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Regular Hours
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Overtime
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Late Minutes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceData.map((record, index) => (
                <motion.tr 
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{record.clockIn}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{record.clockOut}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{record.hours} hrs</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      parseFloat(record.overtime) > 0 ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {record.overtime} hrs
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      record.late_minutes > 0 ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {record.late_minutes > 0 ? `${record.late_minutes} mins` : '-'}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {attendanceData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No attendance records</h3>
            <p className="text-gray-500 text-center max-w-md">
              No attendance records found for {getMonthName(currentMonth)} {currentYear}.
            </p>
          </div>
        )}
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div 
        className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {attendanceData.slice(0, 2).map((record, index) => (
            <div 
              key={index}
              className={`flex items-center gap-3 p-3 border rounded-lg ${
                record.status === 'Present' ? 'bg-green-50 border-green-200' :
                record.status === 'Late' ? 'bg-yellow-50 border-yellow-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              {getStatusIcon(record.status)}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {record.status === 'Present' ? 'Clocked in successfully' :
                   record.status === 'Late' ? 'Late arrival noted' :
                   record.status}
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(record.date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })} at {record.clockIn}
                  {record.late_minutes > 0 && ` (${record.late_minutes} minutes late)`}
                  {parseFloat(record.overtime) > 0 && ` (${record.overtime} hours overtime)`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmployeeAttendance;