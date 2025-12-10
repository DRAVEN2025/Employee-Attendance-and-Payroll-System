import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

/* Layout */
import MainLayout from "./pages/Layout/MainLayout";
import AdminLayout from "./pages/Layout/AdminLayout";
import EmployeeLayout from "./pages/Layout/EmployeeLayout";

/* Main Pages */
import Home from "./pages/MainPage/Home";
import Features from "./pages/MainPage/Features";
import About from "./pages/MainPage/About";
import NotFound from "./pages/MainPage/NotFound";
import UserSignIn from "./pages/MainPage/User";

/* Admin */
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Employees from "./pages/Admin/Employees";
import Departments from "./pages/Admin/Departments";
import Attendance from "./pages/Admin/Attendance";
import Requests from "./pages/Admin/Requests";
import RequestTypes from "./pages/Admin/RequestTypes";
import Holidays from "./pages/Admin/Holidays";
import Payroll from "./pages/Admin/Payroll";
import Reports from "./pages/Admin/Reports";
import AdminSettings from "./pages/Admin/AdminSettings";

/* Employee */
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import EmployeeAttendance from "./pages/Employee/EmployeeAttendance";
import EmployeeRequests from "./pages/Employee/EmployeeRequests";
import EmployeePayroll from "./pages/Employee/EmployeePayroll";
import EmployeeProfile from "./pages/Employee/EmployeeProfile";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/user/signin" element={<UserSignIn />} />
        </Route>
        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/employees" element={<Employees />} />
          <Route path="/admin/departments" element={<Departments />} />
          <Route path="/admin/attendance" element={<Attendance />} />
          <Route path="/admin/requests" element={<Requests />} />
          <Route path="/admin/requesttypes" element={<RequestTypes />} />
          <Route path="/admin/holidays" element={<Holidays />} />
          <Route path="/admin/payroll" element={<Payroll />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
        {/* Employee */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/attendance" element={<EmployeeAttendance />} />
          <Route path="/employee/requests" element={<EmployeeRequests />} />
          <Route path="/employee/payroll" element={<EmployeePayroll />} />
          <Route path="/employee/profile" element={<EmployeeProfile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App;
