<?php
include '../Config/db.php';
include '../Config/header.php';

require_once('../../tcpdf/tcpdf.php');

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_payroll_records':
        getPayrollRecords();
        break;
    case 'get_payroll_record':
        getPayrollRecord();
        break;
    case 'get_employees':
        getEmployees();
        break;
    case 'get_employee_salary':
        getEmployeeSalary();
        break;
    case 'calculate_payroll':
        calculatePayroll();
        break;
    case 'create_payroll':
        createPayroll();
        break;
    case 'update_payroll':
        updatePayroll();
        break;
    case 'delete_payroll':
        deletePayroll();
        break;
    case 'process_payroll':
        processPayroll();
        break;
    case 'download_payslip':
        downloadPayslip();
        break;
    case 'check_duplicate_payroll':
        checkDuplicatePayroll();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getPayrollRecords() {
    global $connect;

    $stmt = $connect->prepare("
        SELECT 
            p.payroll_id,
            p.emp_id,
            e.first_name,
            e.last_name,
            e.email,
            p.start_date,
            p.end_date,
            p.regular_hours,
            p.overtime_hours,
            p.allowances,
            p.gross_pay,
            p.deductions,
            p.net_pay,
            p.status,
            p.paid_date
        FROM payroll p
        JOIN employees e ON p.emp_id = e.emp_id
        ORDER BY p.start_date DESC, p.created_at DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $payrollRecords = [];
    while ($row = $result->fetch_assoc()) {
        $row['employee_name'] = $row['first_name'] . ' ' . $row['last_name'];
        $row['regular_hours'] = floatval($row['regular_hours']);
        $row['overtime_hours'] = floatval($row['overtime_hours']);
        $row['allowances'] = floatval($row['allowances']);
        $row['gross_pay'] = floatval($row['gross_pay']);
        $row['deductions'] = floatval($row['deductions']);
        $row['net_pay'] = floatval($row['net_pay']);
        $payrollRecords[] = $row;
    }

    echo json_encode([
        'type' => 'success',
        'data' => $payrollRecords
    ]);

    $stmt->close();
}

function getPayrollRecord() {
    global $connect;

    $payroll_id = isset($_GET['payroll_id']) ? intval($_GET['payroll_id']) : 0;

    if ($payroll_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid payroll ID'
        ]);
        return;
    }

    $stmt = $connect->prepare("
        SELECT 
            p.*,
            e.first_name,
            e.last_name,
            e.email,
            e.salary_monthly,
            e.hourly_rate,
            d.name as department,
            pos.designation as position
        FROM payroll p
        JOIN employees e ON p.emp_id = e.emp_id
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        LEFT JOIN positions pos ON e.position_id = pos.p_id
        WHERE p.payroll_id = ?
    ");
    $stmt->bind_param("i", $payroll_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $payrollRecord = $result->fetch_assoc();
        $payrollRecord['employee_name'] = $payrollRecord['first_name'] . ' ' . $payrollRecord['last_name'];
        $payrollRecord['regular_hours'] = floatval($payrollRecord['regular_hours']);
        $payrollRecord['overtime_hours'] = floatval($payrollRecord['overtime_hours']);
        $payrollRecord['allowances'] = floatval($payrollRecord['allowances']);
        $payrollRecord['gross_pay'] = floatval($payrollRecord['gross_pay']);
        $payrollRecord['deductions'] = floatval($payrollRecord['deductions']);
        $payrollRecord['net_pay'] = floatval($payrollRecord['net_pay']);
        $payrollRecord['salary_monthly'] = floatval($payrollRecord['salary_monthly']);
        $payrollRecord['hourly_rate'] = floatval($payrollRecord['hourly_rate']);
        
        echo json_encode([
            'type' => 'success',
            'data' => $payrollRecord
        ]);
    } else {
        echo json_encode([
            'type' => 'error',
            'message' => 'Payroll record not found'
        ]);
    }

    $stmt->close();
}

function getEmployees() {
    global $connect;

    $search = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : '%';
    
    $stmt = $connect->prepare("
        SELECT 
            emp_id,
            first_name,
            last_name,
            email,
            salary_monthly,
            hourly_rate
        FROM employees 
        WHERE CONCAT(first_name, ' ', last_name) LIKE ? 
           OR email LIKE ?
           OR emp_id LIKE ?
        AND is_active = 1
        ORDER BY first_name, last_name
        LIMIT 20
    ");
    $stmt->bind_param("sss", $search, $search, $search);
    $stmt->execute();
    $result = $stmt->get_result();

    $employees = [];
    while ($row = $result->fetch_assoc()) {
        $row['name'] = $row['first_name'] . ' ' . $row['last_name'];
        $row['salary_monthly'] = floatval($row['salary_monthly']);
        $row['hourly_rate'] = floatval($row['hourly_rate']);
        $employees[] = $row;
    }

    echo json_encode([
        'type' => 'success',
        'data' => $employees
    ]);

    $stmt->close();
}

function getEmployeeSalary() {
    global $connect;

    $emp_id = isset($_GET['emp_id']) ? intval($_GET['emp_id']) : 0;

    if ($emp_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid employee ID'
        ]);
        return;
    }

    $stmt = $connect->prepare("
        SELECT 
            emp_id,
            first_name,
            last_name,
            salary_monthly,
            hourly_rate
        FROM employees 
        WHERE emp_id = ?
    ");
    $stmt->bind_param("i", $emp_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $employee = $result->fetch_assoc();
        $employee['salary_monthly'] = floatval($employee['salary_monthly']);
        $employee['hourly_rate'] = floatval($employee['hourly_rate']);
        
        echo json_encode([
            'type' => 'success',
            'data' => $employee
        ]);
    } else {
        echo json_encode([
            'type' => 'error',
            'message' => 'Employee not found'
        ]);
    }

    $stmt->close();
}

function checkDuplicatePayroll() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $emp_id = isset($data['emp_id']) ? intval($data['emp_id']) : 0;
    $start_date = isset($data['start_date']) ? $data['start_date'] : '';
    $end_date = isset($data['end_date']) ? $data['end_date'] : '';
    $payroll_id = isset($data['payroll_id']) ? intval($data['payroll_id']) : 0;

    if ($emp_id <= 0 || empty($start_date) || empty($end_date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Employee ID, start date, and end date are required'
        ]);
        return;
    }

    if ($payroll_id > 0) {
        $stmt = $connect->prepare("
            SELECT payroll_id 
            FROM payroll 
            WHERE emp_id = ? 
            AND start_date = ? 
            AND end_date = ?
            AND payroll_id != ?
        ");
        $stmt->bind_param("issi", $emp_id, $start_date, $end_date, $payroll_id);
    } else {
        $stmt = $connect->prepare("
            SELECT payroll_id 
            FROM payroll 
            WHERE emp_id = ? 
            AND start_date = ? 
            AND end_date = ?
        ");
        $stmt->bind_param("iss", $emp_id, $start_date, $end_date);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    
    $is_duplicate = $result->num_rows > 0;
    
    echo json_encode([
        'type' => 'success',
        'is_duplicate' => $is_duplicate,
        'message' => $is_duplicate ? 'Duplicate payroll record found' : 'No duplicate found'
    ]);

    $stmt->close();
}

function calculatePayroll() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $emp_id = isset($data['emp_id']) ? intval($data['emp_id']) : 0;
    $start_date = isset($data['start_date']) ? $data['start_date'] : '';
    $end_date = isset($data['end_date']) ? $data['end_date'] : '';
    $allowances = isset($data['allowances']) ? floatval($data['allowances']) : 0;

    if ($emp_id <= 0 || empty($start_date) || empty($end_date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Employee ID, start date, and end date are required'
        ]);
        return;
    }

    $employeeStmt = $connect->prepare("SELECT salary_monthly, hourly_rate FROM employees WHERE emp_id = ?");
    $employeeStmt->bind_param("i", $emp_id);
    $employeeStmt->execute();
    $employeeResult = $employeeStmt->get_result();
    
    if ($employeeResult->num_rows === 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Employee not found'
        ]);
        $employeeStmt->close();
        return;
    }
    
    $employee = $employeeResult->fetch_assoc();
    $salary_monthly = floatval($employee['salary_monthly']);
    $hourly_rate = floatval($employee['hourly_rate']);
    $employeeStmt->close();

    $workingHoursStmt = $connect->prepare("SELECT start_time, end_time, late_mins, deductions FROM working_hours LIMIT 1");
    $workingHoursStmt->execute();
    $workingHoursResult = $workingHoursStmt->get_result();
    $workingHours = $workingHoursResult->fetch_assoc();
    $workingHoursStmt->close();

    $standard_start = $workingHours['start_time'];
    $standard_end = $workingHours['end_time'];
    $late_minutes_threshold = intval($workingHours['late_mins']);
    $late_deduction_rate = floatval($workingHours['deductions']);

    $start_time = new DateTime($standard_start);
    $end_time = new DateTime($standard_end);
    $time_diff = $start_time->diff($end_time);
    $standard_hours_per_day = $time_diff->h + ($time_diff->i / 60);

    $start = new DateTime($start_date);
    $end = new DateTime($end_date);
    $total_days = $start->diff($end)->days + 1;
    
    $attendanceStmt = $connect->prepare("
        SELECT 
            work_date,
            hours_worked,
            overtime_hrs,
            late_minutes,
            status
        FROM attendance_daily 
        WHERE emp_id = ? 
          AND work_date BETWEEN ? AND ?
        ORDER BY work_date
    ");
    $attendanceStmt->bind_param("iss", $emp_id, $start_date, $end_date);
    $attendanceStmt->execute();
    $attendanceResult = $attendanceStmt->get_result();
    
    $attendanceData = [];
    $total_regular_hours = 0;
    $total_overtime_hours = 0;
    $total_late_minutes = 0;
    $present_days = 0;
    
    while ($row = $attendanceResult->fetch_assoc()) {
        $attendanceData[] = $row;
        $total_regular_hours += floatval($row['hours_worked']);
        $total_overtime_hours += floatval($row['overtime_hrs']);
        $total_late_minutes += intval($row['late_minutes']);
        
        if ($row['status'] === 'Present' || $row['status'] === 'Late') {
            $present_days++;
        }
    }
    $attendanceStmt->close();

    $hourly_rate_calculated = $salary_monthly / ($total_days * $standard_hours_per_day);

    $overtimeStmt = $connect->prepare("
        SELECT 
            SUM(ot.hours) as total_overtime_hours,
            ot.ot_type_id,
            ot_type.multiplier
        FROM overtime_requests ot
        JOIN overtime_types ot_type ON ot.ot_type_id = ot_type.ot_type_id
        WHERE ot.emp_id = ? 
          AND ot.request_date BETWEEN ? AND ?
          AND ot.status = 'Approved'
        GROUP BY ot.ot_type_id, ot_type.multiplier
    ");
    $overtimeStmt->bind_param("iss", $emp_id, $start_date, $end_date);
    $overtimeStmt->execute();
    $overtimeResult = $overtimeStmt->get_result();
    
    $approved_overtime_hours = 0;
    $overtime_pay = 0;
    
    if ($overtimeResult->num_rows > 0) {
        while ($overtimeRow = $overtimeResult->fetch_assoc()) {
            $overtime_hours = floatval($overtimeRow['total_overtime_hours']);
            $approved_overtime_hours += $overtime_hours;
            $multiplier = floatval($overtimeRow['multiplier']);
            
            $overtime_pay += $overtime_hours * $hourly_rate_calculated * $multiplier;
        }
    }
    $overtimeStmt->close();

    $basic_pay = $total_regular_hours * $hourly_rate_calculated;

    $actual_salary = ($present_days / $total_days) * $salary_monthly;

    $late_deductions = 0;
    if ($total_late_minutes > 0) {
        $late_hours = $total_late_minutes / 60;
        $late_deductions = $late_hours * $late_deduction_rate;
    }

    $gross_pay = $basic_pay + $overtime_pay + $allowances;

    $net_pay = $gross_pay - $late_deductions;

    echo json_encode([
        'type' => 'success',
        'data' => [
            'total_days' => $total_days,
            'present_days' => $present_days,
            'regular_hours' => round($total_regular_hours, 2),
            'overtime_hours' => round($approved_overtime_hours, 2),
            'basic_pay' => round($basic_pay, 2),
            'overtime_pay' => round($overtime_pay, 2),
            'allowances' => round($allowances, 2),
            'late_minutes' => $total_late_minutes,
            'late_deductions' => round($late_deductions, 2),
            'gross_pay' => round($gross_pay, 2),
            'net_pay' => round($net_pay, 2),
            'hourly_rate' => round($hourly_rate_calculated, 2),
            'actual_salary' => round($actual_salary, 2),
            'standard_hours_per_day' => round($standard_hours_per_day, 2),
            'has_overtime_requests' => $approved_overtime_hours > 0,
            'approved_overtime_hours' => round($approved_overtime_hours, 2)
        ]
    ]);
}

function createPayroll() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $emp_id = isset($data['emp_id']) ? intval($data['emp_id']) : 0;
    $start_date = isset($data['start_date']) ? $data['start_date'] : '';
    $end_date = isset($data['end_date']) ? $data['end_date'] : '';
    $regular_hours = isset($data['regular_hours']) ? floatval($data['regular_hours']) : 0;
    $overtime_hours = isset($data['overtime_hours']) ? floatval($data['overtime_hours']) : 0;
    $allowances = isset($data['allowances']) ? floatval($data['allowances']) : 0;
    $gross_pay = isset($data['gross_pay']) ? floatval($data['gross_pay']) : 0;
    $deductions = isset($data['deductions']) ? floatval($data['deductions']) : 0;
    $net_pay = isset($data['net_pay']) ? floatval($data['net_pay']) : 0;
    $basic_pay = isset($data['basic_pay']) ? floatval($data['basic_pay']) : 0;
    $overtime_pay = isset($data['overtime_pay']) ? floatval($data['overtime_pay']) : 0;

    if ($emp_id <= 0 || empty($start_date) || empty($end_date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Employee ID, start date, and end date are required'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("
        SELECT payroll_id FROM payroll 
        WHERE emp_id = ? AND start_date = ? AND end_date = ?
    ");
    $checkStmt->bind_param("iss", $emp_id, $start_date, $end_date);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'A payroll record already exists for this employee and pay period. Please choose a different period or employee.'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $periodCheckStmt = $connect->prepare("
            SELECT period_id FROM payroll_periods 
            WHERE start_date = ? AND end_date = ?
        ");
        $periodCheckStmt->bind_param("ss", $start_date, $end_date);
        $periodCheckStmt->execute();
        $periodCheckResult = $periodCheckStmt->get_result();
        
        if ($periodCheckResult->num_rows > 0) {
            $periodRecord = $periodCheckResult->fetch_assoc();
            $period_id = $periodRecord['period_id'];
        } else {
            $pay_date = date('Y-m-d', strtotime($end_date . ' +7 days'));
            $periodStmt = $connect->prepare("
                INSERT INTO payroll_periods (start_date, end_date, pay_date, is_closed) 
                VALUES (?, ?, ?, 0)
            ");
            $periodStmt->bind_param("sss", $start_date, $end_date, $pay_date);
            
            if (!$periodStmt->execute()) {
                throw new Exception('Failed to create payroll period: ' . $periodStmt->error);
            }
            
            $period_id = $periodStmt->insert_id;
            $periodStmt->close();
        }
        $periodCheckStmt->close();

        $stmt = $connect->prepare("
            INSERT INTO payroll (
                period_id, emp_id, start_date, end_date, regular_hours, 
                overtime_hours, allowances, gross_pay, deductions, net_pay, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Calculated')
        ");
        $stmt->bind_param(
            "iissdddddd", 
            $period_id, $emp_id, $start_date, $end_date, $regular_hours,
            $overtime_hours, $allowances, $gross_pay, $deductions, $net_pay
        );
        
        if ($stmt->execute()) {
            $payroll_id = $stmt->insert_id;

            addPayrollComponents($payroll_id, $data);

            echo json_encode([
                'type' => 'success',
                'message' => 'Payroll record created successfully',
                'payroll_id' => $payroll_id
            ]);
        } else {
            throw new Exception('Failed to create payroll record: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function addPayrollComponents($payroll_id, $data) {
    global $connect;

    $checkComponentsStmt = $connect->prepare("SELECT comp_id FROM pay_components WHERE comp_id IN (1,2,3,4)");
    $checkComponentsStmt->execute();
    $checkResult = $checkComponentsStmt->get_result();
    $existingComponents = [];
    while ($row = $checkResult->fetch_assoc()) {
        $existingComponents[] = $row['comp_id'];
    }
    $checkComponentsStmt->close();

    $componentsToInsert = [
        ['comp_id' => 1, 'name' => 'Basic Pay', 'is_addition' => 1, 'is_taxable' => 1],
        ['comp_id' => 2, 'name' => 'Overtime Pay', 'is_addition' => 1, 'is_taxable' => 1],
        ['comp_id' => 3, 'name' => 'Deductions', 'is_addition' => 0, 'is_taxable' => 0],
        ['comp_id' => 4, 'name' => 'Allowances', 'is_addition' => 1, 'is_taxable' => 1],
    ];

    foreach ($componentsToInsert as $component) {
        if (!in_array($component['comp_id'], $existingComponents)) {
            $insertStmt = $connect->prepare("
                INSERT INTO pay_components (comp_id, name, is_addition, is_taxable) 
                VALUES (?, ?, ?, ?)
            ");
            $insertStmt->bind_param("isii", 
                $component['comp_id'], 
                $component['name'], 
                $component['is_addition'], 
                $component['is_taxable']
            );
            $insertStmt->execute();
            $insertStmt->close();
        }
    }

    $components = [
        ['comp_id' => 1, 'amount' => $data['basic_pay'] ?? 0],
        ['comp_id' => 2, 'amount' => $data['overtime_pay'] ?? 0],
        ['comp_id' => 3, 'amount' => $data['deductions'] ?? 0],
        ['comp_id' => 4, 'amount' => $data['allowances'] ?? 0],
    ];

    foreach ($components as $component) {
        if ($component['amount'] > 0) {
            $stmt = $connect->prepare("
                INSERT INTO payroll_components (payroll_id, comp_id, amount) 
                VALUES (?, ?, ?)
            ");
            $stmt->bind_param("iid", $payroll_id, $component['comp_id'], $component['amount']);
            if (!$stmt->execute()) {
                error_log("Failed to insert payroll component: " . $stmt->error);
            }
            $stmt->close();
        }
    }
}

function updatePayroll() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $payroll_id = isset($data['payroll_id']) ? intval($data['payroll_id']) : 0;
    $emp_id = isset($data['emp_id']) ? intval($data['emp_id']) : 0;
    $start_date = isset($data['start_date']) ? $data['start_date'] : '';
    $end_date = isset($data['end_date']) ? $data['end_date'] : '';
    $regular_hours = isset($data['regular_hours']) ? floatval($data['regular_hours']) : 0;
    $overtime_hours = isset($data['overtime_hours']) ? floatval($data['overtime_hours']) : 0;
    $allowances = isset($data['allowances']) ? floatval($data['allowances']) : 0;
    $gross_pay = isset($data['gross_pay']) ? floatval($data['gross_pay']) : 0;
    $deductions = isset($data['deductions']) ? floatval($data['deductions']) : 0;
    $net_pay = isset($data['net_pay']) ? floatval($data['net_pay']) : 0;
    $basic_pay = isset($data['basic_pay']) ? floatval($data['basic_pay']) : 0;
    $overtime_pay = isset($data['overtime_pay']) ? floatval($data['overtime_pay']) : 0;

    if ($payroll_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid payroll ID'
        ]);
        return;
    }

    try {
        $stmt = $connect->prepare("
            UPDATE payroll 
            SET regular_hours = ?, overtime_hours = ?, allowances = ?, 
                gross_pay = ?, deductions = ?, net_pay = ? 
            WHERE payroll_id = ?
        ");
        $stmt->bind_param("ddddddi", 
            $regular_hours, $overtime_hours, $allowances, 
            $gross_pay, $deductions, $net_pay, $payroll_id
        );
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                updatePayrollComponents($payroll_id, $data);

                echo json_encode([
                    'type' => 'success',
                    'message' => 'Payroll record updated successfully'
                ]);
            } else {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'No changes made or payroll record not found'
                ]);
            }
        } else {
            throw new Exception('Failed to update payroll record: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function updatePayrollComponents($payroll_id, $data) {
    global $connect;

    $deleteStmt = $connect->prepare("DELETE FROM payroll_components WHERE payroll_id = ?");
    $deleteStmt->bind_param("i", $payroll_id);
    $deleteStmt->execute();
    $deleteStmt->close();

    addPayrollComponents($payroll_id, $data);
}

function deletePayroll() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $payroll_id = isset($data['payroll_id']) ? intval($data['payroll_id']) : 0;

    if ($payroll_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid payroll ID'
        ]);
        return;
    }

    try {
        $connect->begin_transaction();

        $getPeriodStmt = $connect->prepare("SELECT period_id FROM payroll WHERE payroll_id = ?");
        $getPeriodStmt->bind_param("i", $payroll_id);
        $getPeriodStmt->execute();
        $periodResult = $getPeriodStmt->get_result();
        
        if ($periodResult->num_rows === 0) {
            $connect->rollback();
            echo json_encode([
                'type' => 'error',
                'message' => 'Payroll record not found'
            ]);
            $getPeriodStmt->close();
            return;
        }
        
        $payrollRecord = $periodResult->fetch_assoc();
        $period_id = $payrollRecord['period_id'];
        $getPeriodStmt->close();

        $deleteComponentsStmt = $connect->prepare("DELETE FROM payroll_components WHERE payroll_id = ?");
        $deleteComponentsStmt->bind_param("i", $payroll_id);
        $deleteComponentsStmt->execute();
        $deleteComponentsStmt->close();

        $deletePayrollStmt = $connect->prepare("DELETE FROM payroll WHERE payroll_id = ?");
        $deletePayrollStmt->bind_param("i", $payroll_id);
        $deletePayrollStmt->execute();
        
        if ($deletePayrollStmt->affected_rows === 0) {
            $connect->rollback();
            echo json_encode([
                'type' => 'error',
                'message' => 'Payroll record not found'
            ]);
            $deletePayrollStmt->close();
            return;
        }
        $deletePayrollStmt->close();

        $checkPeriodStmt = $connect->prepare("SELECT COUNT(*) as count FROM payroll WHERE period_id = ?");
        $checkPeriodStmt->bind_param("i", $period_id);
        $checkPeriodStmt->execute();
        $checkResult = $checkPeriodStmt->get_result();
        $periodCount = $checkResult->fetch_assoc()['count'];
        $checkPeriodStmt->close();

        if ($periodCount == 0) {
            $deletePeriodStmt = $connect->prepare("DELETE FROM payroll_periods WHERE period_id = ?");
            $deletePeriodStmt->bind_param("i", $period_id);
            $deletePeriodStmt->execute();
            $deletePeriodStmt->close();
        }

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Payroll record deleted successfully'
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function processPayroll() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $payroll_ids = isset($data['payroll_ids']) ? $data['payroll_ids'] : [];

    if (empty($payroll_ids)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'No payroll records selected for processing'
        ]);
        return;
    }

    try {
        $placeholders = str_repeat('?,', count($payroll_ids) - 1) . '?';
        $stmt = $connect->prepare("
            UPDATE payroll 
            SET status = 'Paid', paid_date = CURDATE() 
            WHERE payroll_id IN ($placeholders)
        ");
        
        $types = str_repeat('i', count($payroll_ids));
        $stmt->bind_param($types, ...$payroll_ids);
        
        if ($stmt->execute()) {
            echo json_encode([
                'type' => 'success',
                'message' => 'Payroll processed successfully. ' . $stmt->affected_rows . ' records updated.'
            ]);
        } else {
            throw new Exception('Failed to process payroll: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function downloadPayslip() {
    global $connect;

    $payroll_id = isset($_GET['payroll_id']) ? intval($_GET['payroll_id']) : 0;

    if ($payroll_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid payroll ID'
        ]);
        return;
    }

    try {
        $stmt = $connect->prepare("
            SELECT 
                p.*,
                e.first_name,
                e.last_name,
                e.email,
                e.salary_monthly,
                e.hourly_rate,
                d.name as department,
                pos.designation as position,
                c.company_name,
                c.email as company_email
            FROM payroll p
            JOIN employees e ON p.emp_id = e.emp_id
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN positions pos ON e.position_id = pos.p_id
            CROSS JOIN company_information c
            WHERE p.payroll_id = ?
        ");
        $stmt->bind_param("i", $payroll_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode([
                'type' => 'error',
                'message' => 'Payroll record not found'
            ]);
            return;
        }

        $payrollData = $result->fetch_assoc();
        $stmt->close();

        $pdf = generatePayslipPDF($payrollData);
        
        $pdf_content = $pdf->Output('', 'S');
        
        $filename = "payslip_" . $payrollData['first_name'] . "_" . $payrollData['last_name'] . "_" . date('Y_m_d', strtotime($payrollData['start_date'])) . "_to_" . date('Y_m_d', strtotime($payrollData['end_date'])) . ".pdf";
        
        echo json_encode([
            'type' => 'success',
            'data' => [
                'pdf_content' => base64_encode($pdf_content),
                'filename' => $filename
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function generatePayslipPDF($payrollData) {
    $companyName = $payrollData['company_name'] ?? "Computer Arts and Technological College Inc.";
    $employeeName = $payrollData['first_name'] . ' ' . $payrollData['last_name'];
    $payPeriod = date('F j, Y', strtotime($payrollData['start_date'])) . ' to ' . date('F j, Y', strtotime($payrollData['end_date']));
    
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    
    $pdf->SetCreator('Employee Payroll System');
    $pdf->SetAuthor($companyName);
    $pdf->SetTitle("Payslip - {$employeeName} - {$payPeriod}");
    $pdf->SetSubject('Employee Payslip');
    
    $pdf->SetHeaderData('', 0, $companyName, "Employee Payslip");
    
    $pdf->setHeaderFont(Array('helvetica', '', 10));
    $pdf->setFooterFont(Array('helvetica', '', 8));
    
    $pdf->SetDefaultMonospacedFont('courier');
    
    $pdf->SetMargins(15, 25, 15);
    $pdf->SetHeaderMargin(10);
    $pdf->SetFooterMargin(10);
    
    $pdf->SetAutoPageBreak(TRUE, 15);
    
    $pdf->AddPage();
    
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->Cell(0, 10, 'EMPLOYEE PAYSLIP', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, $payPeriod, 0, 1, 'C');
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Employee Information', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $employee_info = array(
        'Employee Name' => $employeeName,
        'Employee ID' => $payrollData['emp_id'],
        'Department' => $payrollData['department'] ?? 'N/A',
        'Position' => $payrollData['position'] ?? 'N/A',
        'Email' => $payrollData['email']
    );
    
    foreach ($employee_info as $label => $value) {
        $pdf->Cell(50, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Earnings', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $earnings = array(
        'Basic Salary' => number_format(floatval($payrollData['salary_monthly']), 2),
        'Regular Hours' => $payrollData['regular_hours'] . ' hrs',
        'Overtime Hours' => $payrollData['overtime_hours'] . ' hrs',
        'Allowances' => '₱' . number_format(floatval($payrollData['allowances']), 2)
    );
    
    foreach ($earnings as $label => $value) {
        $pdf->Cell(50, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Deductions', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $deductions = array(
        'Late Deductions' => '₱' . number_format(floatval($payrollData['deductions']), 2)
    );
    
    foreach ($deductions as $label => $value) {
        $pdf->Cell(50, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Payroll Summary', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $summary = array(
        'Gross Pay' => '₱' . number_format(floatval($payrollData['gross_pay']), 2),
        'Total Deductions' => '₱' . number_format(floatval($payrollData['deductions']), 2),
        'Net Pay' => '₱' . number_format(floatval($payrollData['net_pay']), 2)
    );
    
    $pdf->SetFillColor(240, 240, 240);
    foreach ($summary as $label => $value) {
        $pdf->Cell(50, 8, $label . ':', 1, 0, 'L', true);
        $pdf->Cell(40, 8, $value, 1, 1, 'R');
    }
    
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Payment Information', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $payment_info = array(
        'Payroll ID' => 'PAY-' . str_pad($payrollData['payroll_id'], 3, '0', STR_PAD_LEFT),
        'Status' => $payrollData['status'],
        'Paid Date' => $payrollData['paid_date'] ? date('F j, Y', strtotime($payrollData['paid_date'])) : 'Pending'
    );
    
    foreach ($payment_info as $label => $value) {
        $pdf->Cell(40, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(15);
    
    $pdf->SetFont('helvetica', 'I', 8);
    $pdf->Cell(0, 10, 'Generated on: ' . date('F j, Y \a\t h:i A'), 0, 1, 'C');
    $pdf->Cell(0, 10, 'This is a computer-generated payslip. No signature is required.', 0, 1, 'C');
    
    return $pdf;
}
?>