<?php
include '../Config/db.php';
include '../Config/header.php';

require_once('../../tcpdf/tcpdf.php');

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'generate_attendance_report':
        generateAttendanceReport();
        break;
    case 'generate_payroll_report':
        generatePayrollReport();
        break;
    case 'generate_leave_report':
        generateLeaveReport();
        break;
    case 'generate_performance_report':
        generatePerformanceReport();
        break;
    case 'get_report_history':
        getReportHistory();
        break;
    case 'get_report_data':
        getReportData();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function generateAttendanceReport() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $start_date = isset($data['start_date']) ? $data['start_date'] : '';
    $end_date = isset($data['end_date']) ? $data['end_date'] : '';
    $department = isset($data['department']) ? $data['department'] : 'all';

    if (empty($start_date) || empty($end_date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Start date and end date are required'
        ]);
        return;
    }

    try {
        $query = "
            SELECT 
                e.emp_id,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                d.name as department,
                pos.designation as position,
                COUNT(ad.daily_id) as total_days,
                SUM(CASE WHEN ad.status IN ('Present', 'Late') THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN ad.status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN ad.status = 'Late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN ad.status = 'Half-Day' THEN 1 ELSE 0 END) as half_days,
                COALESCE(SUM(ad.hours_worked), 0) as total_hours_worked,
                COALESCE(SUM(ad.overtime_hrs), 0) as total_overtime_hours,
                COALESCE(SUM(ad.late_minutes), 0) as total_late_minutes,
                COALESCE(AVG(ad.hours_worked), 0) as avg_daily_hours
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN positions pos ON e.position_id = pos.p_id
            LEFT JOIN attendance_daily ad ON e.emp_id = ad.emp_id 
                AND ad.work_date BETWEEN ? AND ?
            WHERE e.is_active = 1
        ";

        $params = [$start_date, $end_date];
        $types = "ss";

        if ($department !== 'all') {
            $query .= " AND d.name = ?";
            $params[] = $department;
            $types .= "s";
        }

        $query .= " GROUP BY e.emp_id, e.first_name, e.last_name, d.name, pos.designation
                   ORDER BY d.name, employee_name";

        $stmt = $connect->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $attendanceData = [];
        $summary = [
            'total_employees' => 0,
            'total_present_days' => 0,
            'total_absent_days' => 0,
            'total_late_days' => 0,
            'total_hours_worked' => 0,
            'total_overtime_hours' => 0,
            'attendance_rate' => 0
        ];

        while ($row = $result->fetch_assoc()) {
            $attendanceData[] = $row;
            $summary['total_employees']++;
            $summary['total_present_days'] += $row['present_days'];
            $summary['total_absent_days'] += $row['absent_days'];
            $summary['total_late_days'] += $row['late_days'];
            $summary['total_hours_worked'] += $row['total_hours_worked'];
            $summary['total_overtime_hours'] += $row['total_overtime_hours'];
        }

        if ($summary['total_present_days'] + $summary['total_absent_days'] > 0) {
            $summary['attendance_rate'] = ($summary['total_present_days'] / ($summary['total_present_days'] + $summary['total_absent_days'])) * 100;
        }

        $pdf = generateAttendancePDF($attendanceData, $summary, $start_date, $end_date, $department);
        $pdf_content = $pdf->Output('', 'S');
        
        $month_name = date('F_Y', strtotime($start_date));
        $filename = "attendance_report_{$month_name}.pdf";
        
        $report_name = "Attendance Report - " . date('F Y', strtotime($start_date));
        logReportGeneration('attendance', $report_name, $filename, $department, $start_date, $end_date, 'completed');
        
        echo json_encode([
            'type' => 'success',
            'data' => [
                'pdf_content' => base64_encode($pdf_content),
                'filename' => $filename
            ]
        ]);

        $stmt->close();

    } catch (Exception $e) {
        $report_name = "Attendance Report - " . date('F Y', strtotime($start_date));
        logReportGeneration('attendance', $report_name, '', $department, $start_date, $end_date, 'failed');
        
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function generatePayrollReport() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $start_date = isset($data['start_date']) ? $data['start_date'] : '';
    $end_date = isset($data['end_date']) ? $data['end_date'] : '';
    $department = isset($data['department']) ? $data['department'] : 'all';

    if (empty($start_date) || empty($end_date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Start date and end date are required'
        ]);
        return;
    }

    try {
        $query = "
            SELECT 
                p.payroll_id,
                p.emp_id,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                d.name as department,
                pos.designation as position,
                p.start_date,
                p.end_date,
                COALESCE(p.regular_hours, 0) as regular_hours,
                COALESCE(p.overtime_hours, 0) as overtime_hours,
                COALESCE(p.allowances, 0) as allowances,
                COALESCE(p.gross_pay, 0) as gross_pay,
                COALESCE(p.deductions, 0) as deductions,
                COALESCE(p.net_pay, 0) as net_pay,
                p.status,
                p.paid_date
            FROM payroll p
            JOIN employees e ON p.emp_id = e.emp_id
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN positions pos ON e.position_id = pos.p_id
            WHERE (
                (p.start_date BETWEEN ? AND ?) 
                OR (p.end_date BETWEEN ? AND ?)
                OR (? BETWEEN p.start_date AND p.end_date)
            )
        ";

        $params = [$start_date, $end_date, $start_date, $end_date, $start_date];
        $types = "sssss";

        if ($department !== 'all') {
            $query .= " AND d.name = ?";
            $params[] = $department;
            $types .= "s";
        }

        $query .= " ORDER BY d.name, employee_name";

        $stmt = $connect->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $payrollData = [];
        $summary = [
            'total_employees' => 0,
            'total_gross_pay' => 0,
            'total_net_pay' => 0,
            'total_deductions' => 0,
            'total_allowances' => 0,
            'total_regular_hours' => 0,
            'total_overtime_hours' => 0
        ];

        while ($row = $result->fetch_assoc()) {
            $payrollData[] = $row;
            $summary['total_employees']++;
            $summary['total_gross_pay'] += $row['gross_pay'];
            $summary['total_net_pay'] += $row['net_pay'];
            $summary['total_deductions'] += $row['deductions'];
            $summary['total_allowances'] += $row['allowances'];
            $summary['total_regular_hours'] += $row['regular_hours'];
            $summary['total_overtime_hours'] += $row['overtime_hours'];
        }

        $pdf = generatePayrollPDF($payrollData, $summary, $start_date, $end_date, $department);
        $pdf_content = $pdf->Output('', 'S');
        
        $month_name = date('F_Y', strtotime($start_date));
        $filename = "payroll_report_{$month_name}.pdf";
        
        $report_name = "Payroll Report - " . date('F Y', strtotime($start_date));
        logReportGeneration('payroll', $report_name, $filename, $department, $start_date, $end_date, 'completed');
        
        echo json_encode([
            'type' => 'success',
            'data' => [
                'pdf_content' => base64_encode($pdf_content),
                'filename' => $filename
            ]
        ]);

        $stmt->close();

    } catch (Exception $e) {
        $report_name = "Payroll Report - " . date('F Y', strtotime($start_date));
        logReportGeneration('payroll', $report_name, '', $department, $start_date, $end_date, 'failed');
        
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function generateLeaveReport() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $start_date = isset($data['start_date']) ? $data['start_date'] : '';
    $end_date = isset($data['end_date']) ? $data['end_date'] : '';
    $department = isset($data['department']) ? $data['department'] : 'all';

    if (empty($start_date) || empty($end_date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Start date and end date are required'
        ]);
        return;
    }

    try {
        $query = "
            SELECT 
                el.leave_id,
                el.emp_id,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                d.name as department,
                pos.designation as position,
                lt.name as leave_type,
                el.start_date,
                el.end_date,
                el.days_requested,
                el.status,
                el.approved_by,
                el.approved_at,
                el.rejection_reason,
                el.created_at
            FROM employee_leaves el
            JOIN employees e ON el.emp_id = e.emp_id
            JOIN leave_types lt ON el.leave_type_id = lt.leave_type_id
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN positions pos ON e.position_id = pos.p_id
            WHERE (
                (el.start_date BETWEEN ? AND ?) 
                OR (el.end_date BETWEEN ? AND ?)
                OR (? BETWEEN el.start_date AND el.end_date)
                OR (? BETWEEN el.start_date AND el.end_date)
            )
        ";

        $params = [$start_date, $end_date, $start_date, $end_date, $start_date, $end_date];
        $types = "ssssss";

        if ($department !== 'all') {
            $query .= " AND d.name = ?";
            $params[] = $department;
            $types .= "s";
        }

        $query .= " ORDER BY d.name, employee_name, el.created_at DESC";

        $stmt = $connect->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $leaveData = [];
        $summary = [
            'total_requests' => 0,
            'approved_requests' => 0,
            'pending_requests' => 0,
            'rejected_requests' => 0,
            'total_days' => 0,
            'approval_rate' => 0
        ];

        while ($row = $result->fetch_assoc()) {
            $leaveData[] = $row;
            $summary['total_requests']++;
            $summary['total_days'] += $row['days_requested'];
            
            switch ($row['status']) {
                case 'Approved':
                    $summary['approved_requests']++;
                    break;
                case 'Pending':
                    $summary['pending_requests']++;
                    break;
                case 'Rejected':
                    $summary['rejected_requests']++;
                    break;
            }
        }

        if ($summary['total_requests'] > 0) {
            $summary['approval_rate'] = ($summary['approved_requests'] / $summary['total_requests']) * 100;
        }

        $pdf = generateLeavePDF($leaveData, $summary, $start_date, $end_date, $department);
        $pdf_content = $pdf->Output('', 'S');
        
        $month_name = date('F_Y', strtotime($start_date));
        $filename = "leave_report_{$month_name}.pdf";
        
        $report_name = "Leave Report - " . date('F Y', strtotime($start_date));
        logReportGeneration('leave', $report_name, $filename, $department, $start_date, $end_date, 'completed');
        
        echo json_encode([
            'type' => 'success',
            'data' => [
                'pdf_content' => base64_encode($pdf_content),
                'filename' => $filename
            ]
        ]);

        $stmt->close();

    } catch (Exception $e) {
        $report_name = "Leave Report - " . date('F Y', strtotime($start_date));
        logReportGeneration('leave', $report_name, '', $department, $start_date, $end_date, 'failed');
        
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function generatePerformanceReport() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $start_date = isset($data['start_date']) ? $data['start_date'] : '';
    $end_date = isset($data['end_date']) ? $data['end_date'] : '';
    $department = isset($data['department']) ? $data['department'] : 'all';

    if (empty($start_date) || empty($end_date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Start date and end date are required'
        ]);
        return;
    }

    try {
        $attendanceQuery = "
            SELECT 
                e.emp_id,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                d.name as department,
                pos.designation as position,
                COUNT(ad.daily_id) as total_days,
                SUM(CASE WHEN ad.status IN ('Present', 'Late') THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN ad.status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN ad.status = 'Late' THEN 1 ELSE 0 END) as late_days,
                COALESCE(SUM(ad.hours_worked), 0) as total_hours_worked,
                COALESCE(SUM(ad.overtime_hrs), 0) as total_overtime_hours,
                COALESCE(AVG(ad.hours_worked), 0) as avg_daily_hours,
                CASE 
                    WHEN COUNT(ad.daily_id) > 0 THEN 
                        (SUM(CASE WHEN ad.status IN ('Present', 'Late') THEN 1 ELSE 0 END) / COUNT(ad.daily_id)) * 100 
                    ELSE 0 
                END as attendance_rate
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN positions pos ON e.position_id = pos.p_id
            LEFT JOIN attendance_daily ad ON e.emp_id = ad.emp_id 
                AND ad.work_date BETWEEN ? AND ?
            WHERE e.is_active = 1
        ";

        $params = [$start_date, $end_date];
        $types = "ss";

        if ($department !== 'all') {
            $attendanceQuery .= " AND d.name = ?";
            $params[] = $department;
            $types .= "s";
        }

        $attendanceQuery .= " GROUP BY e.emp_id, e.first_name, e.last_name, d.name, pos.designation
                            ORDER BY attendance_rate DESC, total_hours_worked DESC";

        $stmt = $connect->prepare($attendanceQuery);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $performanceData = [];
        $summary = [
            'total_employees' => 0,
            'avg_attendance_rate' => 0,
            'avg_daily_hours' => 0,
            'total_overtime_hours' => 0,
            'top_performers' => []
        ];

        $total_attendance_rate = 0;
        $total_daily_hours = 0;
        $employees_with_attendance = 0;

        while ($row = $result->fetch_assoc()) {
            $performanceData[] = $row;
            $summary['total_employees']++;
            
            if ($row['total_days'] > 0) {
                $total_attendance_rate += $row['attendance_rate'];
                $total_daily_hours += $row['avg_daily_hours'];
                $employees_with_attendance++;
            }
            
            $summary['total_overtime_hours'] += $row['total_overtime_hours'];

            if ($row['attendance_rate'] >= 95 && $row['total_days'] > 0) {
                $summary['top_performers'][] = $row['employee_name'];
            }
        }

        if ($employees_with_attendance > 0) {
            $summary['avg_attendance_rate'] = $total_attendance_rate / $employees_with_attendance;
            $summary['avg_daily_hours'] = $total_daily_hours / $employees_with_attendance;
        }

        $pdf = generatePerformancePDF($performanceData, $summary, $start_date, $end_date, $department);
        $pdf_content = $pdf->Output('', 'S');
        
        $month_name = date('F_Y', strtotime($start_date));
        $filename = "performance_report_{$month_name}.pdf";
        
        $report_name = "Performance Report - " . date('F Y', strtotime($start_date));
        logReportGeneration('performance', $report_name, $filename, $department, $start_date, $end_date, 'completed');
        
        echo json_encode([
            'type' => 'success',
            'data' => [
                'pdf_content' => base64_encode($pdf_content),
                'filename' => $filename
            ]
        ]);

        $stmt->close();

    } catch (Exception $e) {
        $report_name = "Performance Report - " . date('F Y', strtotime($start_date));
        logReportGeneration('performance', $report_name, '', $department, $start_date, $end_date, 'failed');
        
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function getReportHistory() {
    global $connect;

    try {
        $query = "
            SELECT 
                log_id,
                report_type,
                report_name,
                filename,
                department,
                start_date,
                end_date,
                status,
                generated_by,
                generated_at
            FROM generate_report_logs 
            ORDER BY generated_at DESC 
            LIMIT 50
        ";

        $result = $connect->query($query);
        $reportHistory = [];

        while ($row = $result->fetch_assoc()) {
            $reportHistory[] = $row;
        }

        echo json_encode([
            'type' => 'success',
            'data' => $reportHistory
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function logReportGeneration($report_type, $report_name, $filename, $department, $start_date, $end_date, $status) {
    global $connect;

    try {
        $query = "
            INSERT INTO generate_report_logs 
            (report_type, report_name, filename, department, start_date, end_date, status, generated_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ";

        $stmt = $connect->prepare($query);
        $generated_by = 'Admin';
        $stmt->bind_param("ssssssss", $report_type, $report_name, $filename, $department, $start_date, $end_date, $status, $generated_by);
        $stmt->execute();
        $stmt->close();

        return true;
    } catch (Exception $e) {
        error_log("Error logging report generation: " . $e->getMessage());
        return false;
    }
}

function getReportData() {
    global $connect;

    $report_type = isset($_GET['report_type']) ? $_GET['report_type'] : '';
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';

    if (empty($report_type) || empty($start_date) || empty($end_date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Report type, start date, and end date are required'
        ]);
        return;
    }

    try {
        switch ($report_type) {
            case 'attendance':
                $query = "
                    SELECT 
                        DATE(work_date) as date,
                        COUNT(*) as total_employees,
                        SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) as present_count,
                        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
                        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count
                    FROM attendance_daily 
                    WHERE work_date BETWEEN ? AND ?
                    GROUP BY DATE(work_date)
                    ORDER BY date
                ";
                break;

            case 'payroll':
                $query = "
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(*) as total_payrolls,
                        SUM(gross_pay) as total_gross_pay,
                        SUM(net_pay) as total_net_pay,
                        AVG(net_pay) as avg_net_pay
                    FROM payroll 
                    WHERE created_at BETWEEN ? AND ?
                    GROUP BY DATE(created_at)
                    ORDER BY date
                ";
                break;

            case 'leave':
                $query = "
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(*) as total_requests,
                        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
                        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
                        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count
                    FROM employee_leaves 
                    WHERE created_at BETWEEN ? AND ?
                    GROUP BY DATE(created_at)
                    ORDER BY date
                ";
                break;

            default:
                throw new Exception("Invalid report type");
        }

        $stmt = $connect->prepare($query);
        $stmt->bind_param("ss", $start_date, $end_date);
        $stmt->execute();
        $result = $stmt->get_result();

        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        echo json_encode([
            'type' => 'success',
            'data' => $data
        ]);

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function generateAttendancePDF($data, $summary, $start_date, $end_date, $department) {
    $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
    setupPDF($pdf, "Attendance Report");
    
    $pdf->AddPage();
    
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->Cell(0, 12, 'ATTENDANCE REPORT', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    
    $report_month = date('F Y', strtotime($start_date));
    $pdf->Cell(0, 8, $report_month, 0, 1, 'C');
    
    if ($department !== 'all') {
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(0, 8, 'Department: ' . $department, 0, 1, 'C');
    }
    $pdf->Ln(8);

    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Summary', 0, 1);
    
    $pdf->SetFont('helvetica', '', 11);
    
    $summary_data = [
        'Total Employees' => $summary['total_employees'],
        'Total Present Days' => $summary['total_present_days'],
        'Total Absent Days' => $summary['total_absent_days'],
        'Total Late Days' => $summary['total_late_days'],
        'Total Hours Worked' => number_format($summary['total_hours_worked'], 1),
        'Total Overtime Hours' => number_format($summary['total_overtime_hours'], 1),
        'Attendance Rate' => number_format($summary['attendance_rate'], 1) . '%'
    ];
    
    $pdf->SetFillColor(245, 245, 245);
    $pdf->SetDrawColor(200, 200, 200);
    $pdf->Rect(10, $pdf->GetY(), 277, 40, 'DF');
    
    $col1_x = 15;
    $col2_x = 150;
    $start_y = $pdf->GetY() + 5;
    
    $pdf->SetXY($col1_x, $start_y);
    $pdf->Cell(60, 6, 'Total Employees:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Employees'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 8);
    $pdf->Cell(60, 6, 'Total Present Days:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Present Days'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 16);
    $pdf->Cell(60, 6, 'Total Absent Days:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Absent Days'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 24);
    $pdf->Cell(60, 6, 'Total Late Days:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Late Days'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y);
    $pdf->Cell(60, 6, 'Total Hours Worked:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Hours Worked'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y + 8);
    $pdf->Cell(60, 6, 'Total Overtime Hours:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Overtime Hours'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y + 16);
    $pdf->Cell(60, 6, 'Attendance Rate:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Attendance Rate'], 0, 1);
    
    $pdf->SetY($pdf->GetY() + 25);

    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Attendance Details', 0, 1);
    $pdf->Ln(3);

    $pdf->SetFillColor(70, 130, 180);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', 'B', 9);
    
    $widths = [40, 35, 35, 18, 18, 18, 20, 22, 22, 28];
    $headers = ['Employee Name', 'Department', 'Position', 'Present', 'Absent', 'Late', 'Half Days', 'Total Hours', 'Overtime', 'Avg Hours/Day'];
    
    for ($i = 0; $i < count($headers); $i++) {
        $pdf->Cell($widths[$i], 10, $headers[$i], 1, 0, 'C', true);
    }
    $pdf->Ln();
    
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetFont('helvetica', '', 8);
    $fill = false;
    
    foreach ($data as $row) {
        if ($pdf->GetY() > 170) {
            $pdf->AddPage();
            $pdf->SetFillColor(70, 130, 180);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->SetFont('helvetica', 'B', 9);
            for ($i = 0; $i < count($headers); $i++) {
                $pdf->Cell($widths[$i], 10, $headers[$i], 1, 0, 'C', true);
            }
            $pdf->Ln();
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 8);
            $fill = false;
        }
        
        if ($fill) {
            $pdf->SetFillColor(245, 245, 245);
        } else {
            $pdf->SetFillColor(255, 255, 255);
        }
        $fill = !$fill;
        
        $employee_name = (strlen($row['employee_name']) > 35) ? substr($row['employee_name'], 0, 32) . '...' : $row['employee_name'];
        $pdf->Cell($widths[0], 8, $employee_name, 1, 0, 'L', $fill);
        
        $dept = (strlen($row['department']) > 25) ? substr($row['department'], 0, 22) . '...' : $row['department'];
        $pdf->Cell($widths[1], 8, $dept, 1, 0, 'L', $fill);
        
        $position = (strlen($row['position']) > 25) ? substr($row['position'], 0, 22) . '...' : $row['position'];
        $pdf->Cell($widths[2], 8, $position, 1, 0, 'L', $fill);
        
        $pdf->Cell($widths[3], 8, $row['present_days'] ?? 0, 1, 0, 'C', $fill);
        
        $pdf->Cell($widths[4], 8, $row['absent_days'] ?? 0, 1, 0, 'C', $fill);
        
        $pdf->Cell($widths[5], 8, $row['late_days'] ?? 0, 1, 0, 'C', $fill);
        
        $pdf->Cell($widths[6], 8, $row['half_days'] ?? 0, 1, 0, 'C', $fill);
        
        $total_hours = isset($row['total_hours_worked']) ? number_format(floatval($row['total_hours_worked']), 1) : '0.0';
        $pdf->Cell($widths[7], 8, $total_hours, 1, 0, 'C', $fill);
        
        $overtime = isset($row['total_overtime_hours']) ? number_format(floatval($row['total_overtime_hours']), 1) : '0.0';
        $pdf->Cell($widths[8], 8, $overtime, 1, 0, 'C', $fill);
        
        $avg_hours = isset($row['avg_daily_hours']) ? number_format(floatval($row['avg_daily_hours']), 1) : '0.0';
        $pdf->Cell($widths[9], 8, $avg_hours, 1, 0, 'C', $fill);
        
        $pdf->Ln();
    }
    
    addPDFFooter($pdf);
    return $pdf;
}

function generatePayrollPDF($data, $summary, $start_date, $end_date, $department) {
    $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
    setupPDF($pdf, "Payroll Report");
    
    $pdf->AddPage();
    
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->Cell(0, 12, 'PAYROLL REPORT', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    
    $report_month = date('F Y', strtotime($start_date));
    $pdf->Cell(0, 8, $report_month, 0, 1, 'C');
    
    if ($department !== 'all') {
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(0, 8, 'Department: ' . $department, 0, 1, 'C');
    }
    $pdf->Ln(8);

    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Summary', 0, 1);
    
    $pdf->SetFont('helvetica', '', 11);
    
    $summary_data = [
        'Total Employees' => $summary['total_employees'],
        'Total Gross Pay' => '₱' . number_format($summary['total_gross_pay'], 2),
        'Total Net Pay' => '₱' . number_format($summary['total_net_pay'], 2),
        'Total Deductions' => '₱' . number_format($summary['total_deductions'], 2),
        'Total Allowances' => '₱' . number_format($summary['total_allowances'], 2),
        'Total Regular Hours' => number_format($summary['total_regular_hours'], 1),
        'Total Overtime Hours' => number_format($summary['total_overtime_hours'], 1)
    ];
    
    $pdf->SetFillColor(245, 245, 245);
    $pdf->SetDrawColor(200, 200, 200);
    $pdf->Rect(10, $pdf->GetY(), 277, 40, 'DF');
    
    $col1_x = 15;
    $col2_x = 150;
    $start_y = $pdf->GetY() + 5;
    
    $pdf->SetXY($col1_x, $start_y);
    $pdf->Cell(60, 6, 'Total Employees:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Employees'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 8);
    $pdf->Cell(60, 6, 'Total Gross Pay:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Gross Pay'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 16);
    $pdf->Cell(60, 6, 'Total Net Pay:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Net Pay'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 24);
    $pdf->Cell(60, 6, 'Total Deductions:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Deductions'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y);
    $pdf->Cell(60, 6, 'Total Allowances:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Allowances'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y + 8);
    $pdf->Cell(60, 6, 'Total Regular Hours:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Regular Hours'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y + 16);
    $pdf->Cell(60, 6, 'Total Overtime Hours:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Overtime Hours'], 0, 1);
    
    $pdf->SetY($pdf->GetY() + 25);

    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Payroll Details', 0, 1);
    $pdf->Ln(3);

    $pdf->SetFillColor(70, 130, 180);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', 'B', 9);
    
    $widths = [38, 30, 25, 18, 18, 25, 28, 28, 28, 18];
    $headers = ['Employee', 'Department', 'Period', 'Reg Hrs', 'OT Hrs', 'Allowances', 'Gross Pay', 'Deductions', 'Net Pay', 'Status'];
    
    for ($i = 0; $i < count($headers); $i++) {
        $pdf->Cell($widths[$i], 10, $headers[$i], 1, 0, 'C', true);
    }
    $pdf->Ln();
    
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetFont('helvetica', '', 8);
    $fill = false;
    
    foreach ($data as $row) {
        if ($pdf->GetY() > 170) {
            $pdf->AddPage();
            $pdf->SetFillColor(70, 130, 180);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->SetFont('helvetica', 'B', 9);
            for ($i = 0; $i < count($headers); $i++) {
                $pdf->Cell($widths[$i], 10, $headers[$i], 1, 0, 'C', true);
            }
            $pdf->Ln();
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 8);
            $fill = false;
        }
        
        if ($fill) {
            $pdf->SetFillColor(245, 245, 245);
        } else {
            $pdf->SetFillColor(255, 255, 255);
        }
        $fill = !$fill;
        
        $employee_name = (strlen($row['employee_name']) > 30) ? substr($row['employee_name'], 0, 27) . '...' : $row['employee_name'];
        $pdf->Cell($widths[0], 8, $employee_name, 1, 0, 'L', $fill);
        
        $dept = (strlen($row['department']) > 20) ? substr($row['department'], 0, 17) . '...' : $row['department'];
        $pdf->Cell($widths[1], 8, $dept, 1, 0, 'L', $fill);
        
        $start_date_formatted = date('m/d/y', strtotime($row['start_date']));
        $end_date_formatted = date('m/d/y', strtotime($row['end_date']));
        $period = $start_date_formatted . ' - ' . $end_date_formatted;
        $pdf->Cell($widths[2], 8, $period, 1, 0, 'C', $fill);
        
        $reg_hours = isset($row['regular_hours']) ? number_format(floatval($row['regular_hours']), 1) : '0.0';
        $pdf->Cell($widths[3], 8, $reg_hours, 1, 0, 'C', $fill);
        
        $ot_hours = isset($row['overtime_hours']) ? number_format(floatval($row['overtime_hours']), 1) : '0.0';
        $pdf->Cell($widths[4], 8, $ot_hours, 1, 0, 'C', $fill);
        
        $allowances = '₱' . number_format(floatval($row['allowances'] ?? 0), 2);
        $pdf->Cell($widths[5], 8, $allowances, 1, 0, 'R', $fill);
        
        $gross_pay = '₱' . number_format(floatval($row['gross_pay'] ?? 0), 2);
        $pdf->Cell($widths[6], 8, $gross_pay, 1, 0, 'R', $fill);
        
        $deductions = '₱' . number_format(floatval($row['deductions'] ?? 0), 2);
        $pdf->Cell($widths[7], 8, $deductions, 1, 0, 'R', $fill);
        
        $net_pay = '₱' . number_format(floatval($row['net_pay'] ?? 0), 2);
        $pdf->Cell($widths[8], 8, $net_pay, 1, 0, 'R', $fill);
        
        $status = $row['status'] ?? 'Calculated';
        if ($status === 'Paid') {
            $pdf->SetTextColor(0, 128, 0);
        } elseif ($status === 'Void') {
            $pdf->SetTextColor(255, 0, 0);
        } else {
            $pdf->SetTextColor(255, 165, 0);
        }
        $pdf->Cell($widths[9], 8, $status, 1, 0, 'C', $fill);
        $pdf->SetTextColor(0, 0, 0);
        
        $pdf->Ln();
    }
    
    addPDFFooter($pdf);
    return $pdf;
}

function generateLeavePDF($data, $summary, $start_date, $end_date, $department) {
    $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
    setupPDF($pdf, "Leave Report");
    
    $pdf->AddPage();
    
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->Cell(0, 12, 'LEAVE REPORT', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    
    $report_month = date('F Y', strtotime($start_date));
    $pdf->Cell(0, 8, $report_month, 0, 1, 'C');
    
    if ($department !== 'all') {
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(0, 8, 'Department: ' . $department, 0, 1, 'C');
    }
    $pdf->Ln(12);

    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Summary', 0, 1);
    
    $pdf->SetFont('helvetica', '', 11);
    
    $summary_data = [
        'Total Requests' => $summary['total_requests'],
        'Approved Requests' => $summary['approved_requests'],
        'Pending Requests' => $summary['pending_requests'],
        'Rejected Requests' => $summary['rejected_requests'],
        'Total Days Requested' => $summary['total_days'],
        'Approval Rate' => number_format($summary['approval_rate'], 1) . '%'
    ];
    
    $pdf->SetFillColor(245, 245, 245);
    $pdf->SetDrawColor(200, 200, 200);
    $summary_box_height = 35;
    $pdf->Rect(15, $pdf->GetY(), 260, $summary_box_height, 'DF');
    
    $col1_x = 25;
    $col2_x = 150;
    $start_y = $pdf->GetY() + 8;
    
    $pdf->SetXY($col1_x, $start_y);
    $pdf->Cell(60, 6, 'Total Requests:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Requests'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 8);
    $pdf->Cell(60, 6, 'Approved Requests:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Approved Requests'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 16);
    $pdf->Cell(60, 6, 'Pending Requests:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Pending Requests'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y);
    $pdf->Cell(60, 6, 'Rejected Requests:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Rejected Requests'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y + 8);
    $pdf->Cell(60, 6, 'Total Days Requested:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Days Requested'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y + 16);
    $pdf->Cell(60, 6, 'Approval Rate:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Approval Rate'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetY($pdf->GetY() + $summary_box_height - 15);

    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Leave Request Details', 0, 1);
    $pdf->Ln(5);

    $pdf->SetFillColor(70, 130, 180);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', 'B', 10);
    
    $widths = [40, 35, 32, 28, 28, 18, 22, 28, 28];
    
    $headers = ['Employee', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Approved By', 'Request Date'];
    
    for ($i = 0; $i < count($headers); $i++) {
        $pdf->Cell($widths[$i], 10, $headers[$i], 1, 0, 'C', true);
    }
    $pdf->Ln();
    
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetFont('helvetica', '', 9);
    $fill = false;
    
    foreach ($data as $row) {
        if ($fill) {
            $pdf->SetFillColor(245, 245, 245);
        } else {
            $pdf->SetFillColor(255, 255, 255);
        }
        $fill = !$fill;
        
        if ($pdf->GetY() > 170) {
            $pdf->AddPage();
            $pdf->SetFillColor(70, 130, 180);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->SetFont('helvetica', 'B', 10);
            for ($i = 0; $i < count($headers); $i++) {
                $pdf->Cell($widths[$i], 10, $headers[$i], 1, 0, 'C', true);
            }
            $pdf->Ln();
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 9);
            $fill = false;
        }
        
        $pdf->Cell($widths[0], 8, $row['employee_name'], 1, 0, 'L', $fill);
        
        $pdf->Cell($widths[1], 8, $row['department'], 1, 0, 'L', $fill);
        
        $pdf->Cell($widths[2], 8, $row['leave_type'], 1, 0, 'L', $fill);
        
        $pdf->Cell($widths[3], 8, date('M j, Y', strtotime($row['start_date'])), 1, 0, 'C', $fill);
        
        $pdf->Cell($widths[4], 8, date('M j, Y', strtotime($row['end_date'])), 1, 0, 'C', $fill);
        
        $pdf->Cell($widths[5], 8, $row['days_requested'], 1, 0, 'C', $fill);
        
        $status = $row['status'];
        if ($status === 'Approved') {
            $pdf->SetTextColor(0, 128, 0);
        } elseif ($status === 'Rejected') {
            $pdf->SetTextColor(255, 0, 0);
        } else {
            $pdf->SetTextColor(255, 165, 0);
        }
        $pdf->Cell($widths[6], 8, $status, 1, 0, 'C', $fill);
        $pdf->SetTextColor(0, 0, 0);
        
        $approved_by = $row['approved_by'] ?: '-';
        $pdf->Cell($widths[7], 8, $approved_by, 1, 0, 'C', $fill);
        
        $pdf->Cell($widths[8], 8, date('M j, Y', strtotime($row['created_at'])), 1, 0, 'C', $fill);
        
        $pdf->Ln();
    }
    
    addPDFFooter($pdf);
    return $pdf;
}

function generatePerformancePDF($data, $summary, $start_date, $end_date, $department) {
    $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
    setupPDF($pdf, "Performance Report");
    
    $pdf->AddPage();
    
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->Cell(0, 12, 'PERFORMANCE REPORT', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    
    $report_month = date('F Y', strtotime($start_date));
    $pdf->Cell(0, 8, $report_month, 0, 1, 'C');
    
    if ($department !== 'all') {
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(0, 8, 'Department: ' . $department, 0, 1, 'C');
    }
    $pdf->Ln(8);

    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Performance Summary', 0, 1);
    
    $pdf->SetFont('helvetica', '', 11);
    
    $summary_data = [
        'Total Employees' => $summary['total_employees'],
        'Average Attendance Rate' => number_format($summary['avg_attendance_rate'], 1) . '%',
        'Average Daily Hours' => number_format($summary['avg_daily_hours'], 1),
        'Total Overtime Hours' => number_format($summary['total_overtime_hours'], 1),
        'Top Performers (≥95%)' => count($summary['top_performers'])
    ];
    
    $pdf->SetFillColor(245, 245, 245);
    $pdf->SetDrawColor(200, 200, 200);
    $pdf->Rect(10, $pdf->GetY(), 277, 35, 'DF');
    
    $col1_x = 15;
    $col2_x = 150;
    $start_y = $pdf->GetY() + 5;
    
    $pdf->SetXY($col1_x, $start_y);
    $pdf->Cell(60, 6, 'Total Employees:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Employees'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 8);
    $pdf->Cell(60, 6, 'Avg Attendance Rate:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Average Attendance Rate'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col1_x, $start_y + 16);
    $pdf->Cell(60, 6, 'Avg Daily Hours:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Average Daily Hours'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y);
    $pdf->Cell(60, 6, 'Total Overtime Hours:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Total Overtime Hours'], 0, 1);
    $pdf->SetFont('helvetica', '', 11);
    
    $pdf->SetXY($col2_x, $start_y + 8);
    $pdf->Cell(60, 6, 'Top Performers:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 6, $summary_data['Top Performers (≥95%)'], 0, 1);
    
    $pdf->SetY($pdf->GetY() + 20);

    if (!empty($summary['top_performers'])) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'Top Performers (Attendance Rate ≥ 95%)', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        $performers_per_line = 3;
        $performer_count = count($summary['top_performers']);
        
        for ($i = 0; $i < $performer_count; $i += $performers_per_line) {
            $line = '';
            for ($j = 0; $j < $performers_per_line && ($i + $j) < $performer_count; $j++) {
                if ($j > 0) $line .= '    ';
                $line .= '• ' . $summary['top_performers'][$i + $j];
            }
            $pdf->Cell(0, 6, $line, 0, 1);
        }
        $pdf->Ln(5);
    }

    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Employee Performance Details', 0, 1);
    $pdf->Ln(3);

    $pdf->SetFillColor(70, 130, 180);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', 'B', 8);
    
    $widths = [32, 28, 28, 18, 16, 16, 16, 20, 20, 22, 30];
    $headers = ['Employee', 'Department', 'Position', 'Total Days', 'Present', 'Absent', 'Late', 'Total Hours', 'Overtime', 'Avg Hours', 'Attendance Rate'];
    
    for ($i = 0; $i < count($headers); $i++) {
        $pdf->Cell($widths[$i], 10, $headers[$i], 1, 0, 'C', true);
    }
    $pdf->Ln();
    
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetFont('helvetica', '', 7);
    $fill = false;
    
    foreach ($data as $row) {
        $attendance_rate = ($row['present_days'] / max($row['total_days'], 1)) * 100;
        
        if ($pdf->GetY() > 170) {
            $pdf->AddPage();
            $pdf->SetFillColor(70, 130, 180);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->SetFont('helvetica', 'B', 8);
            for ($i = 0; $i < count($headers); $i++) {
                $pdf->Cell($widths[$i], 10, $headers[$i], 1, 0, 'C', true);
            }
            $pdf->Ln();
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 7);
            $fill = false;
        }
        
        if ($fill) {
            $pdf->SetFillColor(245, 245, 245);
        } else {
            $pdf->SetFillColor(255, 255, 255);
        }
        $fill = !$fill;
        
        $employee_name = (strlen($row['employee_name']) > 28) ? substr($row['employee_name'], 0, 25) . '...' : $row['employee_name'];
        $pdf->Cell($widths[0], 8, $employee_name, 1, 0, 'L', $fill);
        
        $dept = (strlen($row['department']) > 20) ? substr($row['department'], 0, 17) . '...' : $row['department'];
        $pdf->Cell($widths[1], 8, $dept, 1, 0, 'L', $fill);
        
        $position = (strlen($row['position']) > 20) ? substr($row['position'], 0, 17) . '...' : $row['position'];
        $pdf->Cell($widths[2], 8, $position, 1, 0, 'L', $fill);
        
        $pdf->Cell($widths[3], 8, $row['total_days'] ?? 0, 1, 0, 'C', $fill);
        
        $pdf->Cell($widths[4], 8, $row['present_days'] ?? 0, 1, 0, 'C', $fill);
        
        $pdf->Cell($widths[5], 8, $row['absent_days'] ?? 0, 1, 0, 'C', $fill);
        
        $pdf->Cell($widths[6], 8, $row['late_days'] ?? 0, 1, 0, 'C', $fill);
        
        $total_hours = isset($row['total_hours_worked']) ? number_format(floatval($row['total_hours_worked']), 1) : '0.0';
        $pdf->Cell($widths[7], 8, $total_hours, 1, 0, 'C', $fill);
        
        $overtime = isset($row['total_overtime_hours']) ? number_format(floatval($row['total_overtime_hours']), 1) : '0.0';
        $pdf->Cell($widths[8], 8, $overtime, 1, 0, 'C', $fill);
        
        $avg_hours = isset($row['avg_daily_hours']) ? number_format(floatval($row['avg_daily_hours']), 1) : '0.0';
        $pdf->Cell($widths[9], 8, $avg_hours, 1, 0, 'C', $fill);
        
        if ($attendance_rate >= 95) {
            $pdf->SetTextColor(0, 128, 0);
        } elseif ($attendance_rate >= 80) {
            $pdf->SetTextColor(255, 165, 0);
        } else {
            $pdf->SetTextColor(255, 0, 0);
        }
        $pdf->Cell($widths[10], 8, number_format($attendance_rate, 1) . '%', 1, 0, 'C', $fill);
        $pdf->SetTextColor(0, 0, 0);
        
        $pdf->Ln();
    }
    
    addPDFFooter($pdf);
    return $pdf;
}

function setupPDF($pdf, $title) {
    $pdf->SetCreator('Employee Management System');
    $pdf->SetAuthor('EMS');
    $pdf->SetTitle($title);
    $pdf->SetSubject($title);
    
    $pdf->setHeaderFont(Array('helvetica', '', 10));
    $pdf->setFooterFont(Array('helvetica', '', 8));
    
    $pdf->SetDefaultMonospacedFont('courier');
    $pdf->SetMargins(10, 25, 10);
    $pdf->SetHeaderMargin(10);
    $pdf->SetFooterMargin(10);
    $pdf->SetAutoPageBreak(TRUE, 15);
}

function addPDFFooter($pdf) {
    $pdf->SetY(-15);
    $pdf->SetFont('helvetica', 'I', 8);
    $pdf->Cell(0, 10, 'Generated on: ' . date('F j, Y \a\t h:i A'), 0, 0, 'C');
}
?>