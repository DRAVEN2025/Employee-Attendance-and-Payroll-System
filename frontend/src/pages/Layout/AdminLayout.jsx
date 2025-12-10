import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Building2,
  Calendar, 
  FileText,
  TrendingUp,
  PartyPopper, 
  CreditCard, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [adminData, setAdminData] = useState({
    user_id: '',
    username: '',
    email: '',
    initials: 'AU'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const sidebarVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        delay: 0.2,
      },
    },
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.02,
      x: 5,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  useEffect(() => {
    const checkAuthentication = () => {
      const user_id = localStorage.getItem('user_id');
      const username = localStorage.getItem('username');
      const email = localStorage.getItem('email');
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const userType = localStorage.getItem('user_type');
      
      if (!isLoggedIn || !user_id || userType !== 'Admin') {
        console.log("Authentication failed - Invalid user type or not logged in");
        localStorage.clear();
        navigate('/');
        return;
      }

      let initials = 'AU';
      if (username) {
        initials = username
          .split(' ')
          .map(name => name.charAt(0).toUpperCase())
          .join('')
          .slice(0, 2);
      }

      setAdminData({
        user_id: user_id || '',
        username: username || 'Admin User',
        email: email || '',
        initials: initials
      });
      
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuthentication();
  }, [navigate]);

  useEffect(() => {
    const handleRouteChange = () => {
      const userType = localStorage.getItem('user_type');
      if (userType !== 'Admin') {
        console.log("Unauthorized access detected - Redirecting to home");
        localStorage.clear();
        navigate('/');
      }
    };

    handleRouteChange();
  }, [location, navigate]);

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/admin/employees", label: "Employees", icon: <Users size={20} /> },
    { path: "/admin/departments", label: "Departments", icon: <Building2 size={20} /> },
    { path: "/admin/attendance", label: "Attendance", icon: <Calendar size={20} /> },
    { path: "/admin/requests", label: "Requests", icon: <FileText size={20} /> },
    { path: "/admin/requesttypes", label: "Request Types", icon: <TrendingUp size={20} /> },
    { path: "/admin/holidays", label: "Holidays", icon: <PartyPopper size={20} /> },
    { path: "/admin/payroll", label: "Payroll", icon: <CreditCard size={20} /> },
    { path: "/admin/reports", label: "Reports", icon: <BarChart3 size={20} /> },
    { path: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('user_type');
    localStorage.removeItem('isLoggedIn');
    
    console.log("Logging out...");
    setIsAuthenticated(false);
    window.location.href = "/";
  };

  const openLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const closeLogoutConfirm = () => {
    setShowLogoutConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 flex"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Sidebar */}
      <motion.aside
        className={`${isSidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed left-0 top-0 h-screen z-40`}
        variants={sidebarVariants}
      >
        <motion.div 
          className="p-6 border-b border-gray-200 flex-shrink-0"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-white font-bold text-sm">AP</span>
            </motion.div>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500 mt-1">HR Management</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto">
          {navItems.map((item, idx) => (
            <motion.div
              key={item.path}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              custom={idx}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  location.pathname === item.path
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className={`${
                  location.pathname === item.path 
                    ? "text-blue-600" 
                    : "text-gray-500"
                }`}>
                  {item.icon}
                </span>
                {isSidebarOpen && (
                  <span className={`font-medium ${
                    location.pathname === item.path ? "text-blue-700" : "text-gray-700"
                  }`}>
                    {item.label}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Admin Info */}
        {isSidebarOpen && (
          <motion.div 
            className="p-4 border-t border-gray-200 flex-shrink-0"
            variants={itemVariants}
          >
            <div className="flex items-center gap-3 px-2">
              <motion.div 
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-white font-bold text-sm">{adminData.initials}</span>
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {adminData.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {adminData.email || 'Administrator'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  ID: {adminData.user_id}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Logout Button */}
        <motion.div 
          className="p-4 border-t border-gray-200 flex-shrink-0"
          variants={itemVariants}
        >
          <motion.button
            onClick={openLogoutConfirm}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={20} className="text-gray-500" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </motion.button>
        </motion.div>

        <motion.button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-6 bg-white border border-gray-300 rounded-full p-1.5 hover:bg-gray-50 transition-colors shadow-sm z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isSidebarOpen ? (
            <ChevronLeft size={16} className="text-gray-600" />
          ) : (
            <ChevronRight size={16} className="text-gray-600" />
          )}
        </motion.button>
      </motion.aside>

      <motion.div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
        variants={contentVariants}
      >
        {/* Header */}
        <motion.header 
          className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center">
            <motion.h2 
              className="text-2xl font-semibold text-gray-900"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              HR Administrator
            </motion.h2>
            <div className="flex items-center gap-4">
              <motion.div 
                className="text-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm font-medium text-gray-900">{adminData.username}</p>
                <p className="text-xs text-gray-500">{adminData.email || 'Administrator'}</p>
                <p className="text-xs text-gray-400">ID: {adminData.user_id}</p>
              </motion.div>
              <motion.div 
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-white font-bold text-sm">{adminData.initials}</span>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </motion.div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="bg-white rounded-lg p-6 w-80 mx-4"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <LogOut size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout? You'll need to sign in again to access the admin panel.
            </p>
            
            <div className="flex gap-3 justify-end">
              <motion.button
                onClick={closeLogoutConfirm}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminLayout;