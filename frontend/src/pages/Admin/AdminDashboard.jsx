import { motion } from "framer-motion";
import { 
  Users, 
  CheckCircle, 
  Calendar, 
  XCircle,
  TrendingUp,
  Clock,
  Loader
} from "lucide-react";
import axios from "axios";
import { useState, useEffect } from "react";

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { 
      label: "Total Employees", 
      value: "0", 
      icon: <Users size={24} className="text-white" />, 
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      change: "+0%",
      trend: "up"
    },
    { 
      label: "Present Today", 
      value: "0", 
      icon: <CheckCircle size={24} className="text-white" />, 
      color: "bg-gradient-to-br from-green-500 to-green-600",
      change: "+0%",
      trend: "up"
    },
    { 
      label: "On Leave", 
      value: "0", 
      icon: <Calendar size={24} className="text-white" />, 
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      change: "+0",
      trend: "up"
    },
    { 
      label: "Absent", 
      value: "0", 
      icon: <XCircle size={24} className="text-white" />, 
      color: "bg-gradient-to-br from-red-500 to-red-600",
      change: "+0%",
      trend: "up"
    },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/admindashboard.php';

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
    fetchDashboardData();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    clearMessages();
    try {
      const response = await axios.get(`${apiBase}?action=get_dashboard_data`);
      if (response.data.type === 'success') {
        const data = response.data.data;
        
        setStats([
          { 
            label: "Total Employees", 
            value: data.totalEmployees.toString(), 
            icon: <Users size={24} className="text-white" />, 
            color: "bg-gradient-to-br from-blue-500 to-blue-600",
            change: "+0%",
            trend: "up"
          },
          { 
            label: "Present Today", 
            value: data.presentToday.toString(), 
            icon: <CheckCircle size={24} className="text-white" />, 
            color: "bg-gradient-to-br from-green-500 to-green-600",
            change: "+0%",
            trend: "up"
          },
          { 
            label: "On Leave", 
            value: data.onLeave.toString(), 
            icon: <Calendar size={24} className="text-white" />, 
            color: "bg-gradient-to-br from-orange-500 to-orange-600",
            change: "+0",
            trend: "up"
          },
          { 
            label: "Absent", 
            value: data.absentToday.toString(), 
            icon: <XCircle size={24} className="text-white" />, 
            color: "bg-gradient-to-br from-red-500 to-red-600",
            change: "+0%",
            trend: "up"
          },
        ]);

        setRecentActivity(data.recentActivity || []);
        setSuccess("Dashboard data refreshed successfully!");
        
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        setError("Failed to fetch dashboard data");
        
        setTimeout(() => {
          setError("");
        }, 3000);
      }
    } catch (err) {
      console.error("Fetch dashboard error:", err);
      setError("An error occurred while fetching dashboard data");
      
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700 border-green-200";
      case "warning":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "pending":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Clocked In":
        return "bg-green-100 text-green-700 border-green-200";
      case "Clocked Out":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Late":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Absent":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTrendIcon = (trend) => {
    return trend === "up" ? <TrendingUp size={16} /> : <TrendingUp size={16} className="transform rotate-180" />;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getAvatarInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        
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

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={itemVariants}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-sm`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {getTrendIcon(stat.trend)}
                <span>{stat.change}</span>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader size={20} className="animate-spin text-blue-600" />
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ) : (
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            )}
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div 
        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <p className="text-gray-600 text-sm mt-1">Latest employee activities</p>
          </div>
          <motion.button
            onClick={fetchDashboardData}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Clock size={16} />
            Refresh
          </motion.button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={32} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                      {getAvatarInitials(activity.first_name, activity.last_name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {activity.first_name} {activity.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(activity.time)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(activity.status)}`}
                    >
                      {activity.status}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
                <p className="text-gray-500">Employee activities will appear here</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;