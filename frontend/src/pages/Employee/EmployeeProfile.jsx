import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Calendar, 
  Lock, 
  Save, 
  Camera,
  Loader
} from "lucide-react";
import axios from "axios";

const EmployeeProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    hire_date: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Employee/employeeprofile.php';

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

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    setLoading(true);
    setError("");
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error("User not authenticated");
      }

      const response = await axios.get(`${apiBase}?action=get_employee_data&user_id=${user_id}`);
      if (response.data.type === 'success') {
        const employeeData = response.data.data;
        setFormData({
          first_name: employeeData.first_name || "",
          last_name: employeeData.last_name || "",
          email: employeeData.email || "",
          phone: employeeData.phone || "",
          department: employeeData.department_name || "Not assigned",
          position: employeeData.position_name || "Not assigned",
          hire_date: employeeData.hire_date ? formatDateForDisplay(employeeData.hire_date) : ""
        });
      } else {
        setError(response.data.message || "Failed to fetch employee data");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Fetch employee data error:", err);
      setError("An error occurred while fetching employee data");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateForSubmit = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setError("First name, last name, and email are required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      const user_id = localStorage.getItem('user_id');
      const submitData = {
        user_id: user_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone
      };

      const response = await axios.post(`${apiBase}?action=update_employee_data`, submitData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess("Profile updated successfully");
        setIsEditing(false);
        fetchEmployeeData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to update profile");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setError("An error occurred while updating profile");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError("Current password and new password are required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      const user_id = localStorage.getItem('user_id');
      const submitData = {
        user_id: user_id,
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      };

      const response = await axios.post(`${apiBase}?action=update_password`, submitData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess("Password updated successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to update password");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Update password error:", err);
      setError("An error occurred while updating password");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const first = formData.first_name ? formData.first_name.charAt(0).toUpperCase() : 'E';
    const last = formData.last_name ? formData.last_name.charAt(0).toUpperCase() : 'M';
    return first + last;
  };

  const getFullName = () => {
    return `${formData.first_name} ${formData.last_name}`.trim() || "Employee";
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your personal information and account settings</p>
          </div>
          {!isEditing && (
            <motion.button 
              onClick={() => setIsEditing(true)}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Save size={20} />
              Edit Profile
            </motion.button>
          )}
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
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Profile Card */}
        <motion.div 
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          variants={cardVariants}
        >
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto flex items-center justify-center text-4xl text-white font-bold">
                {getInitials()}
              </div>
              <motion.button
                className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Camera size={16} />
              </motion.button>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{getFullName()}</h2>
            <p className="text-gray-600 mb-2">{formData.position}</p>
            <p className="text-gray-500 text-sm mb-4">
              ID: {localStorage.getItem('user_id') || 'N/A'}
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-3 text-gray-600">
                <Building size={16} className="text-gray-400" />
                <span className="text-sm">{formData.department}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm">Hired {formData.hire_date}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div 
          className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          variants={cardVariants}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            {isEditing && (
              <div className="flex gap-2">
                <motion.button
                  onClick={() => {
                    setIsEditing(false);
                    fetchEmployeeData(); // Reset form data
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  variants={buttonVariants}
                  whileHover={!saving ? "hover" : undefined}
                  whileTap={!saving ? "tap" : undefined}
                >
                  {saving ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    isEditing 
                      ? "border-gray-300 bg-white text-gray-900" 
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    isEditing 
                      ? "border-gray-300 bg-white text-gray-900" 
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    isEditing 
                      ? "border-gray-300 bg-white text-gray-900" 
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    isEditing 
                      ? "border-gray-300 bg-white text-gray-900" 
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Building size={16} className="text-gray-400" />
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Briefcase size={16} className="text-gray-400" />
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  Hire Date
                </label>
                <input
                  type="text"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                />
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Change Password */}
      <motion.div 
        className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        variants={itemVariants}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
        <form onSubmit={handlePasswordUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Lock size={16} className="text-gray-400" />
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Lock size={16} className="text-gray-400" />
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                placeholder="Enter new password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Lock size={16} className="text-gray-400" />
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          
          <motion.button 
            type="submit"
            disabled={saving}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            variants={buttonVariants}
            whileHover={!saving ? "hover" : undefined}
            whileTap={!saving ? "tap" : undefined}
          >
            {saving ? (
              <>
                <Loader size={20} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Lock size={20} />
                Change Password
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default EmployeeProfile;