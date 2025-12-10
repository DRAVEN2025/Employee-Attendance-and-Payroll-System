import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar,
  Clock,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Loader,
  FileText,
  Zap
} from "lucide-react";
import axios from "axios";

const RequestTypes = () => {
  const [activeTab, setActiveTab] = useState("leave");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [overtimeTypes, setOvertimeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    leave_type_id: "",
    leave_name: "",
    is_paid: true,
    ot_type_id: "",
    overtime_name: "",
    multiplier: 1.50
  });

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/requesttypes.php';

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
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "leave") {
        const response = await axios.get(`${apiBase}?action=get_leave_types`);
        if (response.data.type === 'success') {
          setLeaveTypes(response.data.data);
        } else {
          setError("Failed to fetch leave types");
          setTimeout(() => setError(""), 3000);
        }
      } else {
        const response = await axios.get(`${apiBase}?action=get_overtime_types`);
        if (response.data.type === 'success') {
          setOvertimeTypes(response.data.data);
        } else {
          setError("Failed to fetch overtime types");
          setTimeout(() => setError(""), 3000);
        }
      }
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("An error occurred while fetching data");
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
    setFormData({
      leave_type_id: "",
      leave_name: "",
      is_paid: true,
      ot_type_id: "",
      overtime_name: "",
      multiplier: 1.50
    });
    clearMessages();
  };

  const handleEdit = async (item) => {
    try {
      if (activeTab === "leave") {
        const response = await axios.get(`${apiBase}?action=get_leave_type&leave_type_id=${item.leave_type_id}`);
        if (response.data.type === 'success') {
          setFormData(prev => ({
            ...prev,
            leave_type_id: response.data.data.leave_type_id,
            leave_name: response.data.data.name,
            is_paid: response.data.data.is_paid
          }));
          setEditingId(item.leave_type_id);
          setIsAdding(false);
          clearMessages();
        } else {
          setError("Failed to fetch leave type details");
          setTimeout(() => setError(""), 3000);
        }
      } else {
        const response = await axios.get(`${apiBase}?action=get_overtime_type&ot_type_id=${item.ot_type_id}`);
        if (response.data.type === 'success') {
          setFormData(prev => ({
            ...prev,
            ot_type_id: response.data.data.ot_type_id,
            overtime_name: response.data.data.name,
            multiplier: response.data.data.multiplier
          }));
          setEditingId(item.ot_type_id);
          setIsAdding(false);
          clearMessages();
        } else {
          setError("Failed to fetch overtime type details");
          setTimeout(() => setError(""), 3000);
        }
      }
    } catch (err) {
      console.error("Fetch item error:", err);
      setError("An error occurred while fetching item details");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      leave_type_id: "",
      leave_name: "",
      is_paid: true,
      ot_type_id: "",
      overtime_name: "",
      multiplier: 1.50
    });
    clearMessages();
  };

  const handleSave = async () => {
    if (activeTab === "leave") {
      if (!formData.leave_name.trim()) {
        setError("Leave type name is required");
        setTimeout(() => setError(""), 3000);
        return;
      }
    } else {
      if (!formData.overtime_name.trim()) {
        setError("Overtime type name is required");
        setTimeout(() => setError(""), 3000);
        return;
      }
      if (!formData.multiplier || formData.multiplier <= 0) {
        setError("Multiplier must be greater than 0");
        setTimeout(() => setError(""), 3000);
        return;
      }
    }

    setFormLoading(true);
    clearMessages();

    try {
      let url, submitData;

      if (activeTab === "leave") {
        const isEdit = !!editingId;
        url = `${apiBase}?action=${isEdit ? 'update_leave_type' : 'create_leave_type'}`;
        submitData = isEdit 
          ? { 
              leave_type_id: editingId, 
              name: formData.leave_name, 
              is_paid: formData.is_paid 
            }
          : { 
              name: formData.leave_name, 
              is_paid: formData.is_paid 
            };
      } else {
        const isEdit = !!editingId;
        url = `${apiBase}?action=${isEdit ? 'update_overtime_type' : 'create_overtime_type'}`;
        submitData = isEdit 
          ? { 
              ot_type_id: editingId, 
              name: formData.overtime_name, 
              multiplier: parseFloat(formData.multiplier) 
            }
          : { 
              name: formData.overtime_name, 
              multiplier: parseFloat(formData.multiplier) 
            };
      }

      const response = await axios.post(url, submitData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        fetchData();
        setTimeout(() => {
          setSuccess("");
        }, 3000);
        setTimeout(() => {
          handleCancel();
        }, 1000);
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Save item error:", err);
      setError("An error occurred while saving the item");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const itemName = activeTab === "leave" ? item.name : item.name;
    if (!window.confirm(`Are you sure you want to delete the ${activeTab} type "${itemName}"?`)) {
      return;
    }

    setFormLoading(true);
    clearMessages();

    try {
      let url, submitData;

      if (activeTab === "leave") {
        url = `${apiBase}?action=delete_leave_type`;
        submitData = { leave_type_id: item.leave_type_id };
      } else {
        url = `${apiBase}?action=delete_overtime_type`;
        submitData = { ot_type_id: item.ot_type_id };
      }

      const response = await axios.post(url, submitData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => {
          setSuccess("");
        }, 3000);
        fetchData();
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Delete item error:", err);
      setError("An error occurred while deleting the item");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFormLoading(false);
    }
  };

  const currentTypes = activeTab === "leave" ? leaveTypes : overtimeTypes;

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
            <h1 className="text-3xl font-bold text-gray-900">Request Types Management</h1>
            <p className="text-gray-600 mt-1">Manage leave types and overtime types</p>
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

        {/* Main Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("leave")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "leave"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Calendar size={18} />
            Leave Types
          </button>
          <button
            onClick={() => setActiveTab("overtime")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overtime"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Clock size={18} />
            Overtime Types
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "leave" ? "Leave Types" : "Overtime Types"}
            </h2>
            <p className="text-gray-600 text-sm">
              {activeTab === "leave" 
                ? "Manage different types of leave available for employees"
                : "Manage different types of overtime and their pay multipliers"}
            </p>
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
            Add {activeTab === "leave" ? "Leave Type" : "Overtime Type"}
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
              {editingId ? `Edit ${activeTab === "leave" ? "Leave" : "Overtime"} Type` : `Add New ${activeTab === "leave" ? "Leave" : "Overtime"} Type`}
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={activeTab === "overtime" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {activeTab === "leave" ? "Leave Type Name *" : "Overtime Type Name *"}
              </label>
              <input
                type="text"
                value={activeTab === "leave" ? formData.leave_name : formData.overtime_name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  [activeTab === "leave" ? "leave_name" : "overtime_name"]: e.target.value 
                }))}
                placeholder={`Enter ${activeTab === "leave" ? "leave" : "overtime"} type name`}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {activeTab === "leave" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type
                </label>
                <select
                  value={formData.is_paid ? "paid" : "unpaid"}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    is_paid: e.target.value === "paid" 
                  }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
            ) : (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pay Multiplier *
                  </label>
                  <input
                    type="number"
                    value={formData.multiplier}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      multiplier: parseFloat(e.target.value) 
                    }))}
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    placeholder="e.g., 1.5"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard overtime is 1.5x, double time is 2.0x
                  </p>
                </div>
                {formData.multiplier && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Pay Rate</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formData.multiplier}x Base Rate
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              disabled={
                formLoading || 
                (activeTab === "leave" ? !formData.leave_name : !formData.overtime_name) ||
                (activeTab === "overtime" && (!formData.multiplier || formData.multiplier <= 0))
              }
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              variants={buttonVariants}
              whileHover={!formLoading ? "hover" : undefined}
              whileTap={!formLoading ? "tap" : undefined}
            >
              {formLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {editingId ? 'Update' : 'Save'} {activeTab === "leave" ? 'Leave Type' : 'Overtime Type'}
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
            label: activeTab === "leave" ? "Total Leave Types" : "Total Overtime Types", 
            value: currentTypes.length.toString(), 
            color: "text-blue-600", 
            bg: "bg-blue-50", 
            border: "border-blue-200", 
            icon: activeTab === "leave" ? <Calendar size={24} className="text-blue-600" /> : <Clock size={24} className="text-blue-600" />
          },
          { 
            label: activeTab === "leave" ? "Paid Leave Types" : "Standard Overtime", 
            value: activeTab === "leave" 
              ? currentTypes.filter(lt => lt.is_paid).length.toString()
              : currentTypes.filter(ot => ot.multiplier === 1.5).length.toString(), 
            color: "text-green-600", 
            bg: "bg-green-50", 
            border: "border-green-200", 
            icon: activeTab === "leave" ? <FileText size={24} className="text-green-600" /> : <Zap size={24} className="text-green-600" />
          },
          { 
            label: activeTab === "leave" ? "Unpaid Leave Types" : "Premium Overtime", 
            value: activeTab === "leave" 
              ? currentTypes.filter(lt => !lt.is_paid).length.toString()
              : currentTypes.filter(ot => ot.multiplier > 1.5).length.toString(), 
            color: "text-gray-600", 
            bg: "bg-gray-50", 
            border: "border-gray-200", 
            icon: activeTab === "leave" ? <FileText size={24} className="text-gray-600" /> : <Zap size={24} className="text-gray-600" />
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

      {/* Types List */}
      <motion.div 
        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col"
        variants={itemVariants}
      >
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">
                  Loading {activeTab === "leave" ? "leave types" : "overtime types"}...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        {activeTab === "leave" ? "Payment Type" : "Pay Multiplier"}
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentTypes.map((item, index) => (
                      <motion.tr 
                        key={activeTab === "leave" ? item.leave_type_id : item.ot_type_id}
                        className="hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4">
                          <div className="text-gray-900 font-medium">{item.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700">
                            {activeTab === "leave" ? (
                              item.is_paid ? "Paid" : "Unpaid"
                            ) : (
                              <span className="font-semibold">{item.multiplier}x Base Rate</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              "bg-green-100 text-green-800 border-green-200"
                            }`}
                          >
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => handleEdit(item)}
                              disabled={formLoading || isAdding || editingId}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit3 size={16} />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(item)}
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
              {currentTypes.length === 0 && !loading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === "leave" ? (
                        <Calendar size={32} className="text-gray-400" />
                      ) : (
                        <Clock size={32} className="text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No {activeTab === "leave" ? "leave types" : "overtime types"} found
                    </h3>
                    <p className="text-gray-500">
                      Get started by adding your first {activeTab === "leave" ? "leave type" : "overtime type"}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Table Footer */}
        {currentTypes.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-600">
              Showing {currentTypes.length} {activeTab === "leave" ? "leave types" : "overtime types"}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RequestTypes;