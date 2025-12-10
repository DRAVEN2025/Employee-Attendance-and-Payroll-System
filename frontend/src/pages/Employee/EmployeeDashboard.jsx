import { motion } from "framer-motion";
import { 
  Calendar, 
  Wallet, 
  Clock, 
  TrendingUp,
  CheckCircle,
  FileText,
  ArrowUpRight,
  Loader,
  LogIn,
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

const EmployeeDashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workingHours, setWorkingHours] = useState(null);

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Employee/employeedashboard.php';

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
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error("User not authenticated");
      }

      const [dashboardResponse, workingHoursResponse] = await Promise.all([
        axios.get(
          `${apiBase}?action=get_dashboard_data&user_id=${user_id}`,
          { timeout: 10000 }
        ),
        axios.get(
          'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Employee/employeeattendance.php?action=get_working_hours',
          { timeout: 5000 }
        )
      ]);

      if (dashboardResponse.data.type === 'success') {
        const data = dashboardResponse.data.data;
        
        if (workingHoursResponse.data.type === 'success') {
          setWorkingHours(workingHoursResponse.data.data);
        }

        const newStats = [
          {
            title: "This Month",
            value: data.summary?.present_days?.toString() || "0",
            description: "Days Present",
            icon: <Calendar size={24} className="text-green-600" />,
            color: "bg-green-50 border-green-200",
            trend: `+${data.summary?.present_days || 0} from last month`
          },
          {
            title: "Today's Leave",
            value: data.today_leave_status?.is_on_leave ? "On Leave" : "Working",
            description: data.today_leave_status?.leave_type || "Status",
            icon: <TrendingUp size={24} className={data.today_leave_status?.is_on_leave ? "text-blue-600" : "text-green-600"} />,
            color: data.today_leave_status?.is_on_leave ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200",
            trend: data.today_leave_status?.is_on_leave ? "Leave Day" : "Active"
          },
          {
            title: "Last Payroll",
            value: `₱${parseFloat(data.last_payroll?.net_pay || 0).toLocaleString()}`,
            description: "Net Pay",
            icon: <Wallet size={24} className="text-green-600" />,
            color: "bg-green-50 border-green-200",
            trend: data.last_payroll?.paid_date ? `Paid on ${new Date(data.last_payroll.paid_date).getDate()}th` : "Not paid yet"
          }
        ];
        setStats(newStats);

        if (data.recent_activities) {
          setRecentActivities(data.recent_activities);
        }

        if (data.today_attendance) {
          const expectedClockOut = workingHoursResponse.data.type === 'success' 
            ? formatTime(workingHoursResponse.data.data.end_time)
            : '05:00 PM';
          
          setTodayStatus({
            ...data.today_attendance,
            expected_clock_out: expectedClockOut
          });
        }

      } else {
        throw new Error(dashboardResponse.data.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error("Fetch dashboard data error:", err);
      setError("An error occurred while loading dashboard data");
      setTimeout(() => setError(""), 3000);
      setStats(getMockStats());
      setRecentActivities(getMockActivities());
      setTodayStatus(getMockTodayStatus());
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '05:00 PM';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      const period = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '05:00 PM';
    }
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
        'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Employee/employeeattendance.php?action=clock_in',
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
        await fetchDashboardData();
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
        'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Employee/employeeattendance.php?action=clock_out',
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
        await fetchDashboardData();
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

  const getMockStats = () => {
    return [
      {
        title: "This Month",
        value: "22",
        description: "Days Present",
        icon: <Calendar size={24} className="text-green-600" />,
        color: "bg-green-50 border-green-200",
        trend: "+2 from last month"
      },
      {
        title: "Today's Leave",
        value: "Working",
        description: "Status",
        icon: <TrendingUp size={24} className="text-green-600" />,
        color: "bg-green-50 border-green-200",
        trend: "Active"
      },
      {
        title: "Last Payroll",
        value: "₱5,300",
        description: "Net Pay",
        icon: <Wallet size={24} className="text-green-600" />,
        color: "bg-green-50 border-green-200",
        trend: "Paid on 15th"
      }
    ];
  };

  const getMockActivities = () => {
    return [
      { 
        action: "Clocked In", 
        time: "Today at 08:45 AM",
        icon: <CheckCircle size={16} className="text-green-600" />,
        status: "completed"
      },
      { 
        action: "Leave Request Approved", 
        time: "Yesterday",
        icon: <FileText size={16} className="text-green-600" />,
        status: "approved"
      },
      { 
        action: "Payslip Generated", 
        time: "2 days ago",
        icon: <CreditCard size={16} className="text-green-600" />,
        status: "processed"
      },
    ];
  };

  const getMockTodayStatus = () => {
    return {
      clock_in: null,
      expected_clock_out: '05:00 PM',
      status: 'Not Clocked In'
    };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present":
        return <CheckCircle size={20} className="text-green-600" />;
      case "Late":
        return <CheckCircle size={20} className="text-yellow-600" />;
      case "Half-Day":
        return <CheckCircle size={20} className="text-blue-600" />;
      case "On Leave":
        return <CheckCircle size={20} className="text-purple-600" />;
      default:
        return <CheckCircle size={20} className="text-gray-400" />;
    }
  };

  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case 'Clock':
        return <Clock size={16} className="text-green-600" />;
      case 'FileText':
        return <FileText size={16} className="text-green-600" />;
      case 'CreditCard':
        return <CreditCard size={16} className="text-green-600" />;
      case 'Wallet':
        return <Wallet size={16} className="text-green-600" />;
      default:
        return <CheckCircle size={16} className="text-green-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
        <p className="text-gray-600">Here's your overview for today</p>
        
        {/* Error and Success Messages */}
        {(error || success) && (
          <motion.div 
            className="mt-4"
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className={`bg-white border rounded-xl p-6 shadow-sm ${stat.color}`}
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.description}</p>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {stat.icon}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Status */}
        <motion.div
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Today's Status</h2>
            <div className="flex items-center gap-2 text-green-600">
              {todayStatus ? getStatusIcon(todayStatus.status) : <CheckCircle size={20} className="text-gray-400" />}
              <span className="font-medium">{todayStatus?.status || 'Not Clocked In'}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Clock In</p>
                  <p className="text-xs text-gray-500">Morning session</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {todayStatus?.clock_in || 'Not clocked in'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {todayStatus?.clock_out ? 'Clock Out' : 'Expected Clock Out'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {todayStatus?.clock_out ? 'Evening session' : 'Based on schedule'}
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {todayStatus?.clock_out || todayStatus?.expected_clock_out || '05:00 PM'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {/* Clock In Button */}
            {!todayStatus?.clock_in && todayStatus?.status !== 'On Leave' && (
              <motion.button 
                onClick={handleClockIn}
                disabled={clockLoading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {clockLoading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                {clockLoading ? "Clocking In..." : "Clock In Now"}
              </motion.button>
            )}

            {/* Clock Out Button */}
            {todayStatus?.clock_in && !todayStatus?.clock_out && todayStatus?.status !== 'On Leave' && (
              <motion.button 
                onClick={handleClockOut}
                disabled={clockLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {clockLoading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Clock size={18} />
                )}
                {clockLoading ? "Clocking Out..." : "Clock Out Now"}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <motion.button
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
              whileHover={{ x: 3 }}
            >
              View All
              <ArrowUpRight size={16} />
            </motion.button>
          </div>

          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                    activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                    activity.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                    activity.status === 'generated' ? 'bg-blue-100 text-blue-800' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {activity.status}
                  </span>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No recent activities</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmployeeDashboard;