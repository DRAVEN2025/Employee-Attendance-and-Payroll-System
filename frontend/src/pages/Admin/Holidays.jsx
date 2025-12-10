import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Loader
} from "lucide-react";
import axios from "axios";

const Holidays = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    h_id: "",
    event: "",
    date: ""
  });

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/holidays.php';

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
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${apiBase}?action=get_holidays&year=${selectedYear}`);
      if (response.data.type === 'success') {
        setHolidays(response.data.data);
      } else {
        setError("Failed to fetch holidays");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Fetch holidays error:", err);
      setError("An error occurred while fetching holidays");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ h_id: "", event: "", date: "" });
    clearMessages();
  };

  const handleEdit = async (holiday) => {
    try {
      const response = await axios.get(`${apiBase}?action=get_holiday&h_id=${holiday.h_id}`);
      if (response.data.type === 'success') {
        setFormData(response.data.data);
        setEditingId(holiday.h_id);
        setIsAdding(false);
        clearMessages();
      } else {
        setError("Failed to fetch holiday details");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Fetch holiday error:", err);
      setError("An error occurred while fetching holiday details");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ h_id: "", event: "", date: "" });
    clearMessages();
  };

  const handleSave = async () => {
    if (!formData.event || !formData.date) {
      setError("Event name and date are required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setFormLoading(true);
    clearMessages();

    try {
      const isEdit = !!editingId;
      const url = `${apiBase}?action=${isEdit ? 'update_holiday' : 'create_holiday'}`;
      
      const submitData = isEdit 
        ? { h_id: editingId, event: formData.event, date: formData.date }
        : { event: formData.event, date: formData.date };

      const response = await axios.post(url, submitData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchHolidays();
        setTimeout(() => {
          handleCancel();
        }, 1000);
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Save holiday error:", err);
      setError("An error occurred while saving the holiday");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (holiday) => {
    if (!window.confirm(`Are you sure you want to delete the holiday "${holiday.event}"?`)) {
      return;
    }

    setFormLoading(true);
    clearMessages();

    try {
      const response = await axios.post(`${apiBase}?action=delete_holiday`, {
        h_id: holiday.h_id
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchHolidays();
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Delete holiday error:", err);
      setError("An error occurred while deleting the holiday");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(dateString);
    holidayDate.setHours(0, 0, 0, 0);
    const diffTime = holidayDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < 0) return "Passed";
    return "";
  };

  const isUpcoming = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(dateString);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate >= today;
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
            <h1 className="text-3xl font-bold text-gray-900">Holidays Management</h1>
            <p className="text-gray-600 mt-1">Manage and track company holidays</p>
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

        {/* Year Selector and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <label className="text-gray-700 font-medium whitespace-nowrap">Select Year:</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="pl-10 pr-8 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          <motion.button 
            onClick={handleAddNew}
            disabled={isAdding || editingId}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            variants={buttonVariants}
            whileHover={!(isAdding || editingId) ? "hover" : undefined}
            whileTap={!(isAdding || editingId) ? "tap" : undefined}
          >
            <Plus size={18} />
            Add Holiday
          </motion.button>
        </div>
      </motion.div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <motion.div 
          className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Holiday" : "Add New Holiday"}
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                value={formData.event}
                onChange={(e) => setFormData(prev => ({ ...prev, event: e.target.value }))}
                placeholder="Enter holiday name"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-6">
            <motion.button
              onClick={handleCancel}
              className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleSave}
              disabled={!formData.event || !formData.date || formLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              variants={buttonVariants}
              whileHover={!(formLoading || !formData.event || !formData.date) ? "hover" : undefined}
              whileTap={!(formLoading || !formData.event || !formData.date) ? "tap" : undefined}
            >
              {formLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {editingId ? 'Update Holiday' : 'Save Holiday'}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        variants={itemVariants}
      >
        {[
          { 
            label: "Total Holidays", 
            value: holidays.length.toString(), 
            color: "text-blue-600", 
            bg: "bg-blue-50", 
            border: "border-blue-200", 
            icon: <Calendar size={24} className="text-blue-600" /> 
          },
          { 
            label: "Upcoming Holidays", 
            value: holidays.filter(h => isUpcoming(h.date)).length.toString(), 
            color: "text-green-600", 
            bg: "bg-green-50", 
            border: "border-green-200", 
            icon: <Calendar size={24} className="text-green-600" /> 
          },
          { 
            label: "Passed Holidays", 
            value: holidays.filter(h => !isUpcoming(h.date)).length.toString(), 
            color: "text-gray-600", 
            bg: "bg-gray-50", 
            border: "border-gray-200", 
            icon: <Calendar size={24} className="text-gray-600" /> 
          },
        ].map((card, index) => (
          <motion.div
            key={card.label}
            className={`${card.bg} ${card.border} border rounded-xl p-6 shadow-sm`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">{card.label}</p>
              {card.icon}
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Holidays List */}
      <motion.div 
        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col"
        variants={itemVariants}
      >
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading holidays...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Days Until
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {holidays.map((holiday, index) => (
                      <motion.tr 
                        key={holiday.h_id}
                        className="hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4">
                          <div className="text-gray-900 font-medium">{holiday.event}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700">{formatDate(holiday.date)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              isUpcoming(holiday.date)
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {isUpcoming(holiday.date) ? "Upcoming" : "Passed"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">
                          {getDaysUntil(holiday.date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => handleEdit(holiday)}
                              disabled={formLoading || isAdding || editingId}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit3 size={16} />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(holiday)}
                              disabled={formLoading || isAdding || editingId}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {holidays.length === 0 && !loading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No holidays found</h3>
                    <p className="text-gray-500">
                      {selectedYear === new Date().getFullYear() 
                        ? "Get started by adding your first holiday" 
                        : `No holidays found for ${selectedYear}`}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Table Footer */}
        {holidays.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-600">
              Showing {holidays.length} holidays for {selectedYear}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Holidays;