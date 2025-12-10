import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MapPin,
  Users,
  X,
  Save,
  Loader,
  Briefcase
} from "lucide-react";
import axios from "axios";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    dept_id: "",
    name: "",
    location: "",
    designations: [""]
  });

  const apiBase = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/Admin/departments.php';

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

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchDepartments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${apiBase}?action=get_departments`);
      if (response.data.type === 'success') {
        setDepartments(response.data.data);
      } else {
        setError("Failed to fetch departments");
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
      setError("An error occurred while fetching departments");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentDetails = async (dept_id) => {
    try {
      const response = await axios.get(`${apiBase}?action=get_department&dept_id=${dept_id}`);
      if (response.data.type === 'success') {
        return response.data.data;
      }
    } catch (err) {
      console.error("Fetch department details error:", err);
    }
    return null;
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.location && dept.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDepartmentClick = async (department) => {
    if (selectedDepartment?.dept_id === department.dept_id) {
      setSelectedDepartment(null);
    } else {
      const departmentDetails = await fetchDepartmentDetails(department.dept_id);
      if (departmentDetails) {
        setSelectedDepartment(departmentDetails);
      } else {
        setSelectedDepartment(department);
      }
    }
  };

  const handleCloseDetails = () => {
    setSelectedDepartment(null);
  };

  const openCreateModal = () => {
    setFormData({
      dept_id: "",
      name: "",
      location: "",
      designations: [""]
    });
    setIsModalOpen(true);
    clearMessages();
  };

  const openEditModal = async (department) => {
    const departmentDetails = await fetchDepartmentDetails(department.dept_id);
    
    if (departmentDetails) {
      const designationsArray = departmentDetails.positions 
        ? departmentDetails.positions.map(pos => pos.designation)
        : [""];
      
      setFormData({
        dept_id: department.dept_id,
        name: department.name,
        location: department.location || "",
        designations: designationsArray.length > 0 ? designationsArray : [""]
      });
    } else {
      setFormData({
        dept_id: department.dept_id,
        name: department.name,
        location: department.location || "",
        designations: [""]
      });
    }
    
    setIsModalOpen(true);
    clearMessages();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      dept_id: "",
      name: "",
      location: "",
      designations: [""]
    });
    clearMessages();
  };

  const openDeleteModal = (department) => {
    setDepartmentToDelete(department);
    setIsDeleteModalOpen(true);
    clearMessages();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDepartmentToDelete(null);
    clearMessages();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDesignationChange = (index, value) => {
    const newDesignations = [...formData.designations];
    newDesignations[index] = value;
    setFormData(prev => ({
      ...prev,
      designations: newDesignations
    }));
  };

  const addDesignation = () => {
    setFormData(prev => ({
      ...prev,
      designations: [...prev.designations, ""]
    }));
  };

  const removeDesignation = (index) => {
    if (formData.designations.length > 1) {
      const newDesignations = formData.designations.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        designations: newDesignations
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    clearMessages();

    if (!formData.name.trim()) {
      setError("Department name is required");
      setFormLoading(false);
      return;
    }

    const filteredDesignations = formData.designations.filter(designation => designation.trim() !== "");
    
    if (filteredDesignations.length === 0) {
      setError("At least one designation is required");
      setFormLoading(false);
      return;
    }

    try {
      const isEdit = !!formData.dept_id;
      const url = `${apiBase}?action=${isEdit ? 'update_department' : 'create_department'}`;
      
      const submitData = {
        ...formData,
        designations: filteredDesignations
      };
      
      const response = await axios.post(url, submitData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        fetchDepartments();
        setTimeout(() => {
          closeModal();
        }, 1000);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error("Save department error:", err);
      setError("An error occurred while saving the department");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;

    setFormLoading(true);
    clearMessages();

    try {
      const response = await axios.post(`${apiBase}?action=delete_department`, {
        dept_id: departmentToDelete.dept_id
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess(response.data.message);
        fetchDepartments();
        if (selectedDepartment?.dept_id === departmentToDelete.dept_id) {
          setSelectedDepartment(null);
        }
        closeDeleteModal();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error("Delete department error:", err);
      setError("An error occurred while deleting the department");
    } finally {
      setFormLoading(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
            <p className="text-gray-600 mt-1">Manage and organize company departments</p>
          </div>
          <motion.button 
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Plus size={20} />
            Add Department
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments by name or location..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
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

      {/* Content Area */}
      <motion.div className="flex gap-6 flex-1 overflow-hidden" variants={itemVariants}>
        {/* Left Side - Department List */}
        <div className={`transition-all duration-300 flex flex-col overflow-hidden ${selectedDepartment ? 'w-2/3' : 'w-full'}`}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading departments...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Department List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {filteredDepartments.map((department, index) => (
                  <motion.div
                    key={department.dept_id}
                    onClick={() => handleDepartmentClick(department)}
                    className={`bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      selectedDepartment?.dept_id === department.dept_id
                        ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                    }`}
                    style={{
                      animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                          <Building2 size={20} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base">{department.name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(department);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(department);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Empty State */}
              {filteredDepartments.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No departments found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first department"}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side - Department Details */}
        {selectedDepartment && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-1/3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-y-auto flex-shrink-0"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Department Details</h2>
                <p className="text-gray-600 text-sm mt-1">Complete information</p>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Department Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Department Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedDepartment.name}</h4>
                      <p className="text-sm text-gray-600">Department ID: DEPT-{selectedDepartment.dept_id.toString().padStart(3, '0')}</p>
                    </div>
                  </div>

                  {selectedDepartment.location && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin size={18} className="text-gray-400" />
                      <span className="text-sm">{selectedDepartment.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Positions */}
              {selectedDepartment.positions && selectedDepartment.positions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Positions ({selectedDepartment.positions.length})</h3>
                  <div className="space-y-2">
                    {selectedDepartment.positions.map((position) => (
                      <div key={position.p_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Briefcase size={16} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium">{position.designation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users size={14} className="text-gray-400" />
                          <span className="text-gray-600 font-medium">{position.employee_count ?? 0}</span>
                          <span className="text-gray-500">employee{position.employee_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Summary</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={18} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Total Employees</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{selectedDepartment.employee_count ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Create/Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {formData.dept_id ? 'Edit Department' : 'Add New Department'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Department Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Designations */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Positions/Designations *
                    </label>
                    <button
                      type="button"
                      onClick={addDesignation}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add Position
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.designations.map((designation, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => handleDesignationChange(index, e.target.value)}
                          placeholder={`Position ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {formData.designations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDesignation(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Add all positions/designations available in this department
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  variants={buttonVariants}
                  whileHover={!formLoading ? "hover" : undefined}
                  whileTap={!formLoading ? "tap" : undefined}
                >
                  {formLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      {formData.dept_id ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {formData.dept_id ? 'Update Department' : 'Create Department'}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Delete Department</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the department <strong>"{departmentToDelete?.name}"</strong>? 
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleDelete}
                  disabled={formLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  variants={buttonVariants}
                  whileHover={!formLoading ? "hover" : undefined}
                  whileTap={!formLoading ? "tap" : undefined}
                >
                  {formLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Departments;