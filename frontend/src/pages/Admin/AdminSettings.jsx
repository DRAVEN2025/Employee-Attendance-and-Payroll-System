import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Save, 
  Building2, 
  Mail, 
  Clock, 
  User,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Wallet
} from "lucide-react";
import axios from "axios";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    companyName: "",
    email: "",
    startTime: "09:00",
    endTime: "18:00",
    lateMins: 0,
    deductions: 0.00,
    adminUsername: "",
    adminEmail: "",
    adminPassword: "",
    verifierUsername: "",
    verifierPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showVerifierPassword, setShowVerifierPassword] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/adminsettings.php';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        setError("User not authenticated");
        return;
      }

      const response = await axios.get(`${apiBase}?action=get_settings&user_id=${user_id}`);
      if (response.data.type === 'success') {
        const data = response.data.data;
        setSettings({
          companyName: data.company_name || "",
          email: data.company_email || "",
          startTime: data.start_time ? data.start_time.substring(0, 5) : "09:00",
          endTime: data.end_time ? data.end_time.substring(0, 5) : "18:00",
          lateMins: data.late_mins || 0,
          deductions: data.deductions || 0.00,
          adminUsername: data.admin_username || "",
          adminEmail: data.admin_email || "",
          adminPassword: "••••••••",
          verifierUsername: data.verifier_username || "",
          verifierPassword: "••••••••"
        });
        setOriginalSettings({
          adminUsername: data.admin_username || "",
          adminEmail: data.admin_email || "",
          verifierUsername: data.verifier_username || ""
        });
      } else {
        setError("Failed to fetch settings");
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
      setError("An error occurred while fetching settings");
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if ((name === 'adminPassword' || name === 'verifierPassword') && value === "••••••••") {
      setSettings(prev => ({
        ...prev,
        [name]: ""
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
    clearMessages();
  };

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'lateMins') {
      setSettings(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else if (name === 'deductions') {
      setSettings(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0.00
      }));
    }
    clearMessages();
  };

  const handlePasswordFocus = (fieldName) => {
    if (settings[fieldName] === "••••••••") {
      setSettings(prev => ({
        ...prev,
        [fieldName]: ""
      }));
    }
  };

  const handlePasswordBlur = (fieldName) => {
    if (settings[fieldName] === "") {
      setSettings(prev => ({
        ...prev,
        [fieldName]: "••••••••"
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const submitData = {
        user_id: parseInt(user_id),
        companyName: settings.companyName,
        email: settings.email,
        startTime: settings.startTime,
        endTime: settings.endTime,
        lateMins: parseInt(settings.lateMins),
        deductions: parseFloat(settings.deductions),
        adminUsername: settings.adminUsername,
        adminEmail: settings.adminEmail,
        verifierUsername: settings.verifierUsername
      };

      if (settings.adminPassword && settings.adminPassword !== "••••••••") {
        submitData.adminPassword = settings.adminPassword;
      }

      if (settings.verifierPassword && settings.verifierPassword !== "••••••••") {
        submitData.verifierPassword = settings.verifierPassword;
      }

      const response = await axios.post(apiBase, JSON.stringify(submitData), {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          action: 'update_settings'
        }
      });

      if (response.data.type === 'success') {
        setSuccess("Settings updated successfully!");
        
        setSettings(prev => ({
          ...prev,
          adminPassword: "••••••••",
          verifierPassword: "••••••••"
        }));

        setOriginalSettings({
          adminUsername: settings.adminUsername,
          adminEmail: settings.adminEmail,
          verifierUsername: settings.verifierUsername
        });
        
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        setError(response.data.message || "Failed to update settings");
      }
    } catch (err) {
      console.error("Update settings error:", err);
      if (err.response) {
        setError(`Server error: ${err.response.data.message || err.response.statusText}`);
      } else {
        setError("An error occurred while updating settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordFieldType = (showPassword, currentValue) => {
    if (currentValue === "••••••••") {
      return "password";
    }
    return showPassword ? "text" : "password";
  };

  const getPasswordInputClass = (currentValue) => {
    const baseClass = "w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
    return currentValue === "••••••••" ? `${baseClass} text-gray-500` : baseClass;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Manage system-wide configurations and preferences</p>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {(error || success) && (
        <motion.div 
          className="mb-6"
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

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto">
        {/* Company Information */}
        <motion.div 
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
              <p className="text-gray-600 text-sm">Basic company details and contact information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter company email"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Working Hours */}
        <motion.div 
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Working Hours Configuration</h2>
              <p className="text-gray-600 text-sm">Set standard working hours and late policies</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={settings.startTime}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={settings.endTime}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Allowance (Minutes)
              </label>
              <div className="relative">
                <AlertCircle size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="lateMins"
                  value={settings.lateMins}
                  onChange={handleNumberInputChange}
                  min="0"
                  max="120"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minutes allowed before counting as late</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Deduction Amount
              </label>
              <div className="relative">
                <Wallet size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="deductions"
                  value={settings.deductions}
                  onChange={handleNumberInputChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Amount deducted per late occurrence</p>
            </div>
          </div>
        </motion.div>

        {/* Admin Information */}
        <motion.div 
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Admin Information</h2>
              <p className="text-gray-600 text-sm">Manage your admin account details</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="adminUsername"
                value={settings.adminUsername}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter admin username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="adminEmail"
                  value={settings.adminEmail}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter admin email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={getPasswordFieldType(showAdminPassword, settings.adminPassword)}
                  name="adminPassword"
                  value={settings.adminPassword}
                  onChange={handleInputChange}
                  onFocus={() => handlePasswordFocus('adminPassword')}
                  onBlur={() => handlePasswordBlur('adminPassword')}
                  className={getPasswordInputClass(settings.adminPassword)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter new password to change, leave as dots to keep current</p>
            </div>
          </div>
        </motion.div>

        {/* Admin Verification */}
        <motion.div 
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Admin Verification</h2>
              <p className="text-gray-600 text-sm">Manage admin verification credentials</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verifier Username
              </label>
              <input
                type="text"
                name="verifierUsername"
                value={settings.verifierUsername}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter verifier username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verifier Password
              </label>
              <div className="relative">
                <input
                  type={getPasswordFieldType(showVerifierPassword, settings.verifierPassword)}
                  name="verifierPassword"
                  value={settings.verifierPassword}
                  onChange={handleInputChange}
                  onFocus={() => handlePasswordFocus('verifierPassword')}
                  onBlur={() => handlePasswordBlur('verifierPassword')}
                  className={getPasswordInputClass(settings.verifierPassword)}
                  placeholder="Enter verifier password"
                />
                <button
                  type="button"
                  onClick={() => setShowVerifierPassword(!showVerifierPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showVerifierPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter new password to change, leave as dots to keep current</p>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button 
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            variants={buttonVariants}
            whileHover={!loading ? "hover" : undefined}
            whileTap={!loading ? "tap" : undefined}
          >
            <Save size={20} />
            {loading ? "Saving Changes..." : "Save Changes"}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
};

export default AdminSettings;