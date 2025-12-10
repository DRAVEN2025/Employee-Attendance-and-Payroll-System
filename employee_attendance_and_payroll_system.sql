-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 28, 2025 at 04:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `employee_attendance_and_payroll_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_verifier`
--

CREATE TABLE `admin_verifier` (
  `av_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_daily`
--

CREATE TABLE `attendance_daily` (
  `daily_id` bigint(20) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `hours_worked` decimal(5,2) DEFAULT 0.00,
  `overtime_hrs` decimal(5,2) DEFAULT 0.00,
  `late_minutes` int(11) DEFAULT 0,
  `early_minutes` int(11) DEFAULT 0,
  `status` enum('Present','Absent','Late','Half-Day','Holiday','On Leave') NOT NULL DEFAULT 'Absent'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_logs`
--

CREATE TABLE `attendance_logs` (
  `log_id` bigint(20) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `clock_in` datetime NOT NULL,
  `clock_out` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_information`
--

CREATE TABLE `company_information` (
  `company_name` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `dept_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`dept_id`, `name`, `location`) VALUES
(1, 'Human Resources', 'Main Building'),
(2, 'Information Technology', 'Tech Wing'),
(3, 'Finance', 'Administration Building'),
(4, 'Marketing', 'Creative Hub'),
(5, 'Operations', 'Production Floor'),
(6, 'Sales', 'Commercial Building'),
(7, 'Research & Development', 'Innovation Center');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `emp_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `dept_id` int(11) DEFAULT NULL,
  `position_id` int(11) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `hire_date` date NOT NULL,
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `salary_monthly` decimal(12,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_approvals`
--

CREATE TABLE `employee_approvals` (
  `approval_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_by` varchar(100) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_leaves`
--

CREATE TABLE `employee_leaves` (
  `leave_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `leave_type_id` tinyint(4) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days_requested` decimal(4,1) NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `approved_by` varchar(100) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `generate_report_logs`
--

CREATE TABLE `generate_report_logs` (
  `log_id` int(11) NOT NULL,
  `report_type` enum('attendance','payroll','leave','performance') NOT NULL,
  `report_name` varchar(255) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `department` varchar(100) DEFAULT 'all',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('completed','failed') DEFAULT 'completed',
  `generated_by` varchar(100) DEFAULT NULL,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `holidays`
--

CREATE TABLE `holidays` (
  `h_id` int(11) NOT NULL,
  `event` varchar(100) NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `holidays`
--

INSERT INTO `holidays` (`h_id`, `event`, `date`) VALUES
(1, 'New Year\'s Day', '2025-01-01'),
(2, 'Maundy Thursday', '2025-03-31'),
(3, 'Good Friday', '2025-04-01'),
(4, 'Araw ng Kagitingan', '2025-04-09'),
(5, 'Labor Day', '2025-05-01'),
(6, 'Independence Day', '2025-06-12'),
(7, 'Ninoy Aquino Day', '2025-08-25'),
(8, 'National Heroes Day', '2025-08-26'),
(9, 'All Saints\' Day', '2025-11-01'),
(10, 'Bonifacio Day', '2025-11-30'),
(11, 'Christmas Day', '2025-12-25'),
(12, 'Rizal Day', '2025-12-30');

-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `leave_type_id` tinyint(4) NOT NULL,
  `name` varchar(50) NOT NULL,
  `is_paid` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_types`
--

INSERT INTO `leave_types` (`leave_type_id`, `name`, `is_paid`) VALUES
(1, 'Vacation Leave', 1),
(2, 'Sick Leave', 1),
(3, 'Personal Leave', 0),
(4, 'Maternity Leave', 1),
(5, 'Paternity Leave', 1),
(6, 'Bereavement Leave', 1),
(7, 'Emergency Leave', 0);

-- --------------------------------------------------------

--
-- Table structure for table `overtime_requests`
--

CREATE TABLE `overtime_requests` (
  `ot_id` bigint(20) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `ot_type_id` tinyint(4) NOT NULL,
  `request_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `hours` decimal(5,2) GENERATED ALWAYS AS (time_to_sec(timediff(`end_time`,`start_time`)) / 3600) STORED,
  `reason` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `requested_by` int(11) NOT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `overtime_types`
--

CREATE TABLE `overtime_types` (
  `ot_type_id` tinyint(4) NOT NULL,
  `name` varchar(50) NOT NULL,
  `multiplier` decimal(4,2) DEFAULT 1.50
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `overtime_types`
--

INSERT INTO `overtime_types` (`ot_type_id`, `name`, `multiplier`) VALUES
(1, 'Regular Overtime', 1.50),
(2, 'Holiday Overtime', 2.00),
(3, 'Weekend Overtime', 1.75),
(4, 'Night Differential', 1.25);

-- --------------------------------------------------------

--
-- Table structure for table `payroll`
--

CREATE TABLE `payroll` (
  `payroll_id` bigint(20) NOT NULL,
  `period_id` int(11) DEFAULT NULL,
  `emp_id` int(11) NOT NULL,
  `regular_hours` decimal(6,2) DEFAULT 0.00,
  `overtime_hours` decimal(6,2) DEFAULT 0.00,
  `allowances` decimal(12,2) DEFAULT 0.00,
  `gross_pay` decimal(12,2) NOT NULL,
  `deductions` decimal(12,2) DEFAULT 0.00,
  `net_pay` decimal(12,2) NOT NULL,
  `paid_date` date DEFAULT NULL,
  `status` enum('Calculated','Paid','Void') DEFAULT 'Calculated',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payroll_components`
--

CREATE TABLE `payroll_components` (
  `pc_id` bigint(20) NOT NULL,
  `payroll_id` bigint(20) NOT NULL,
  `comp_id` tinyint(4) NOT NULL,
  `amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payroll_periods`
--

CREATE TABLE `payroll_periods` (
  `period_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `pay_date` date NOT NULL,
  `is_closed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pay_components`
--

CREATE TABLE `pay_components` (
  `comp_id` tinyint(4) NOT NULL,
  `name` varchar(50) NOT NULL,
  `is_addition` tinyint(1) DEFAULT 1,
  `is_taxable` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pay_components`
--

INSERT INTO `pay_components` (`comp_id`, `name`, `is_addition`, `is_taxable`) VALUES
(1, 'Basic Pay', 1, 1),
(2, 'Overtime Pay', 1, 1),
(3, 'Deductions', 0, 0),
(4, 'Allowances', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `p_id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `designation` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `positions`
--

INSERT INTO `positions` (`p_id`, `dept_id`, `designation`) VALUES
(1, 1, 'HR Manager'),
(2, 1, 'Recruitment Specialist'),
(3, 1, 'Training Coordinator'),
(4, 2, 'IT Manager'),
(5, 2, 'Software Developer'),
(6, 2, 'System Administrator'),
(7, 2, 'Network Engineer'),
(8, 3, 'Finance Manager'),
(9, 3, 'Accountant'),
(10, 3, 'Financial Analyst'),
(11, 4, 'Marketing Manager'),
(12, 4, 'Digital Marketing Specialist'),
(13, 4, 'Graphic Designer'),
(14, 5, 'Operations Manager'),
(15, 5, 'Production Supervisor'),
(16, 6, 'Sales Manager'),
(17, 6, 'Sales Representative'),
(18, 7, 'R&D Manager'),
(19, 7, 'Research Scientist');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `user_type` enum('Admin','Employee') NOT NULL DEFAULT 'Employee',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `working_hours`
--

CREATE TABLE `working_hours` (
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `late_mins` int(11) DEFAULT 0,
  `deductions` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_verifier`
--
ALTER TABLE `admin_verifier`
  ADD PRIMARY KEY (`av_id`),
  ADD UNIQUE KEY `uq_admin_verifier_username` (`username`);

--
-- Indexes for table `attendance_daily`
--
ALTER TABLE `attendance_daily`
  ADD PRIMARY KEY (`daily_id`),
  ADD UNIQUE KEY `uq_emp_date` (`emp_id`,`work_date`);

--
-- Indexes for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `emp_id` (`emp_id`),
  ADD KEY `idx_emp_date` (`emp_id`,`clock_in`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`dept_id`),
  ADD UNIQUE KEY `uq_dept_name` (`name`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`emp_id`),
  ADD KEY `dept_id` (`dept_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `employees_ibfk_position` (`position_id`);

--
-- Indexes for table `employee_approvals`
--
ALTER TABLE `employee_approvals`
  ADD PRIMARY KEY (`approval_id`),
  ADD UNIQUE KEY `uq_approval_username` (`username`),
  ADD UNIQUE KEY `uq_approval_email` (`email`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_submitted` (`submitted_at`);

--
-- Indexes for table `employee_leaves`
--
ALTER TABLE `employee_leaves`
  ADD PRIMARY KEY (`leave_id`),
  ADD KEY `emp_id` (`emp_id`),
  ADD KEY `leave_type_id` (`leave_type_id`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `generate_report_logs`
--
ALTER TABLE `generate_report_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_report_type` (`report_type`),
  ADD KEY `idx_generated_at` (`generated_at`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `holidays`
--
ALTER TABLE `holidays`
  ADD PRIMARY KEY (`h_id`),
  ADD UNIQUE KEY `uq_holiday_date` (`date`),
  ADD KEY `idx_holiday_date` (`date`);

--
-- Indexes for table `leave_types`
--
ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`leave_type_id`),
  ADD UNIQUE KEY `uq_leave_name` (`name`);

--
-- Indexes for table `overtime_requests`
--
ALTER TABLE `overtime_requests`
  ADD PRIMARY KEY (`ot_id`),
  ADD KEY `emp_id` (`emp_id`),
  ADD KEY `ot_type_id` (`ot_type_id`),
  ADD KEY `requested_by` (`requested_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_emp_date` (`emp_id`,`request_date`);

--
-- Indexes for table `overtime_types`
--
ALTER TABLE `overtime_types`
  ADD PRIMARY KEY (`ot_type_id`),
  ADD UNIQUE KEY `uq_ot_name` (`name`);

--
-- Indexes for table `payroll`
--
ALTER TABLE `payroll`
  ADD PRIMARY KEY (`payroll_id`),
  ADD UNIQUE KEY `uq_emp_period` (`emp_id`,`period_id`),
  ADD KEY `period_id` (`period_id`),
  ADD KEY `idx_payroll_dates` (`start_date`,`end_date`),
  ADD KEY `idx_payroll_employee` (`emp_id`,`start_date`,`end_date`);

--
-- Indexes for table `payroll_components`
--
ALTER TABLE `payroll_components`
  ADD PRIMARY KEY (`pc_id`),
  ADD KEY `payroll_id` (`payroll_id`),
  ADD KEY `comp_id` (`comp_id`);

--
-- Indexes for table `payroll_periods`
--
ALTER TABLE `payroll_periods`
  ADD PRIMARY KEY (`period_id`),
  ADD UNIQUE KEY `uq_period` (`start_date`,`end_date`);

--
-- Indexes for table `pay_components`
--
ALTER TABLE `pay_components`
  ADD PRIMARY KEY (`comp_id`),
  ADD UNIQUE KEY `uq_comp_name` (`name`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`p_id`),
  ADD KEY `dept_id` (`dept_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `unique_username_user_type` (`username`,`user_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_verifier`
--
ALTER TABLE `admin_verifier`
  MODIFY `av_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_daily`
--
ALTER TABLE `attendance_daily`
  MODIFY `daily_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  MODIFY `log_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `dept_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `emp_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_approvals`
--
ALTER TABLE `employee_approvals`
  MODIFY `approval_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_leaves`
--
ALTER TABLE `employee_leaves`
  MODIFY `leave_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `generate_report_logs`
--
ALTER TABLE `generate_report_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `holidays`
--
ALTER TABLE `holidays`
  MODIFY `h_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `leave_types`
--
ALTER TABLE `leave_types`
  MODIFY `leave_type_id` tinyint(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `overtime_requests`
--
ALTER TABLE `overtime_requests`
  MODIFY `ot_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `overtime_types`
--
ALTER TABLE `overtime_types`
  MODIFY `ot_type_id` tinyint(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `payroll`
--
ALTER TABLE `payroll`
  MODIFY `payroll_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payroll_components`
--
ALTER TABLE `payroll_components`
  MODIFY `pc_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payroll_periods`
--
ALTER TABLE `payroll_periods`
  MODIFY `period_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pay_components`
--
ALTER TABLE `pay_components`
  MODIFY `comp_id` tinyint(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `p_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance_daily`
--
ALTER TABLE `attendance_daily`
  ADD CONSTRAINT `attendance_daily_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD CONSTRAINT `attendance_logs_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`) ON DELETE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employees_ibfk_position` FOREIGN KEY (`position_id`) REFERENCES `positions` (`p_id`) ON DELETE SET NULL;

--
-- Constraints for table `employee_leaves`
--
ALTER TABLE `employee_leaves`
  ADD CONSTRAINT `employee_leaves_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_leaves_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`leave_type_id`);

--
-- Constraints for table `overtime_requests`
--
ALTER TABLE `overtime_requests`
  ADD CONSTRAINT `overtime_requests_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `overtime_requests_ibfk_2` FOREIGN KEY (`ot_type_id`) REFERENCES `overtime_types` (`ot_type_id`),
  ADD CONSTRAINT `overtime_requests_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `employees` (`emp_id`);

--
-- Constraints for table `payroll`
--
ALTER TABLE `payroll`
  ADD CONSTRAINT `payroll_ibfk_2` FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`);

--
-- Constraints for table `payroll_components`
--
ALTER TABLE `payroll_components`
  ADD CONSTRAINT `payroll_components_ibfk_1` FOREIGN KEY (`payroll_id`) REFERENCES `payroll` (`payroll_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payroll_components_ibfk_2` FOREIGN KEY (`comp_id`) REFERENCES `pay_components` (`comp_id`);

--
-- Constraints for table `positions`
--
ALTER TABLE `positions`
  ADD CONSTRAINT `positions_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
