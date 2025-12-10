<?php
include '../Config/db.php';
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_dashboard_data':
        getDashboardData();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getDashboardData() {
    global $connect;

    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    try {
        $empStmt = $connect->prepare("
            SELECT emp_id FROM employees WHERE user_id = ?
        ");
        $empStmt->bind_param("i", $user_id);
        $empStmt->execute();
        $empResult = $empStmt->get_result();

        if ($empResult->num_rows === 0) {
            echo json_encode([
                'type' => 'error',
                'message' => 'Employee not found'
            ]);
            $empStmt->close();
            return;
        }

        $employee = $empResult->fetch_assoc();
        $emp_id = $employee['emp_id'];
        $empStmt->close();

        $current_month = date('n');
        $current_year = date('Y');
        $today = date('Y-m-d');

        $summary = getMonthlySummary($emp_id, $current_month, $current_year);
        
        $today_leave_status = getTodayLeaveStatus($emp_id, $today);
        
        $last_payroll = getLastPayroll($emp_id);
        
        $today_attendance = getTodayAttendance($emp_id, $today);
        
        $recent_activities = getRecentActivities($emp_id);

        echo json_encode([
            'type' => 'success',
            'data' => [
                'summary' => $summary,
                'today_leave_status' => $today_leave_status,
                'last_payroll' => $last_payroll,
                'today_attendance' => $today_attendance,
                'recent_activities' => $recent_activities
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function getMonthlySummary($emp_id, $month, $year) {
    global $connect;

    $start_date = "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01";
    $end_date = date("Y-m-t", strtotime($start_date));

    $stmt = $connect->prepare("
        SELECT 
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
            SUM(CASE WHEN status = 'Half-Day' THEN 1 ELSE 0 END) as half_days,
            SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as leave_days,
            SUM(hours_worked) as total_hours,
            SUM(overtime_hrs) as total_overtime
        FROM attendance_daily 
        WHERE emp_id = ? 
            AND work_date BETWEEN ? AND ?
    ");
    $stmt->bind_param("iss", $emp_id, $start_date, $end_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $summary = $result->fetch_assoc();
    $stmt->close();

    return $summary ?: [
        'total_days' => 0,
        'present_days' => 0,
        'late_days' => 0,
        'absent_days' => 0,
        'half_days' => 0,
        'leave_days' => 0,
        'total_hours' => 0,
        'total_overtime' => 0
    ];
}

function getTodayLeaveStatus($emp_id, $today) {
    global $connect;

    $stmt = $connect->prepare("
        SELECT 
            el.leave_id,
            lt.name as leave_type,
            el.start_date,
            el.end_date,
            el.status,
            el.days_requested
        FROM employee_leaves el
        LEFT JOIN leave_types lt ON el.leave_type_id = lt.leave_type_id
        WHERE el.emp_id = ? 
            AND el.status = 'Approved'
            AND ? BETWEEN el.start_date AND el.end_date
        LIMIT 1
    ");
    $stmt->bind_param("is", $emp_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $leave_status = [
        'is_on_leave' => false,
        'leave_type' => 'Working',
        'leave_details' => null
    ];

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $leave_status = [
            'is_on_leave' => true,
            'leave_type' => $row['leave_type'],
            'leave_details' => $row
        ];
    }
    $stmt->close();

    return $leave_status;
}

function getLastPayroll($emp_id) {
    global $connect;

    $stmt = $connect->prepare("
        SELECT 
            p.net_pay,
            p.gross_pay,
            p.deductions,
            p.paid_date,
            p.start_date,
            p.end_date,
            pp.pay_date,
            GROUP_CONCAT(CONCAT(pc.name, ': ₱', pcomp.amount) SEPARATOR ', ') as components
        FROM payroll p
        LEFT JOIN payroll_periods pp ON p.period_id = pp.period_id
        LEFT JOIN payroll_components pcomp ON p.payroll_id = pcomp.payroll_id
        LEFT JOIN pay_components pc ON pcomp.comp_id = pc.comp_id
        WHERE p.emp_id = ? 
            AND p.status = 'Paid'
        ORDER BY p.end_date DESC 
        LIMIT 1
    ");
    $stmt->bind_param("i", $emp_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $payroll = null;
    if ($result->num_rows > 0) {
        $payroll = $result->fetch_assoc();
        
        if ($payroll['net_pay']) {
            $payroll['net_pay'] = number_format(floatval($payroll['net_pay']), 2, '.', '');
        }
        if ($payroll['gross_pay']) {
            $payroll['gross_pay'] = number_format(floatval($payroll['gross_pay']), 2, '.', '');
        }
    }
    $stmt->close();

    return $payroll;
}

function getTodayAttendance($emp_id, $today) {
    global $connect;

    $stmt = $connect->prepare("
        SELECT 
            ad.status,
            ad.late_minutes,
            ad.overtime_hrs,
            al.clock_in,
            al.clock_out
        FROM attendance_daily ad
        LEFT JOIN attendance_logs al ON ad.emp_id = al.emp_id 
            AND DATE(al.clock_in) = ad.work_date
        WHERE ad.emp_id = ? 
            AND ad.work_date = ?
    ");
    $stmt->bind_param("is", $emp_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $attendance = null;
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $attendance = [
            'status' => $row['status'],
            'clock_in' => $row['clock_in'] ? date('h:i A', strtotime($row['clock_in'])) : null,
            'clock_out' => $row['clock_out'] ? date('h:i A', strtotime($row['clock_out'])) : null,
            'late_minutes' => $row['late_minutes'],
            'overtime_hrs' => $row['overtime_hrs']
        ];
    } else {
        $leave_status = getTodayLeaveStatus($emp_id, $today);
        if ($leave_status['is_on_leave']) {
            $attendance = [
                'status' => 'On Leave',
                'clock_in' => null,
                'clock_out' => null,
                'late_minutes' => 0,
                'overtime_hrs' => 0
            ];
        } else {
            $attendance = [
                'status' => 'Not Clocked In',
                'clock_in' => null,
                'clock_out' => null,
                'late_minutes' => 0,
                'overtime_hrs' => 0
            ];
        }
    }
    $stmt->close();

    return $attendance;
}

function getRecentActivities($emp_id) {
    global $connect;

    $activities = [];

    $clockStmt = $connect->prepare("
        SELECT 
            clock_in,
            clock_out,
            notes
        FROM attendance_logs 
        WHERE emp_id = ? 
            AND clock_in >= DATE_SUB(NOW(), INTERVAL 3 DAY)
        ORDER BY clock_in DESC 
        LIMIT 5
    ");
    $clockStmt->bind_param("i", $emp_id);
    $clockStmt->execute();
    $clockResult = $clockStmt->get_result();

    while ($row = $clockResult->fetch_assoc()) {
        $time_ago = getTimeAgo($row['clock_in']);
        $action = $row['clock_out'] ? 'Clocked Out' : 'Clocked In';
        $activities[] = [
            'action' => $action,
            'time' => $time_ago,
            'icon' => 'Clock',
            'status' => 'completed'
        ];
    }
    $clockStmt->close();

    $leaveStmt = $connect->prepare("
        SELECT 
            el.status,
            el.created_at,
            lt.name as leave_type
        FROM employee_leaves el
        LEFT JOIN leave_types lt ON el.leave_type_id = lt.leave_type_id
        WHERE el.emp_id = ? 
            AND el.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY el.created_at DESC 
        LIMIT 3
    ");
    $leaveStmt->bind_param("i", $emp_id);
    $leaveStmt->execute();
    $leaveResult = $leaveStmt->get_result();

    while ($row = $leaveResult->fetch_assoc()) {
        $time_ago = getTimeAgo($row['created_at']);
        $activities[] = [
            'action' => "{$row['leave_type']} Request {$row['status']}",
            'time' => $time_ago,
            'icon' => 'FileText',
            'status' => strtolower($row['status'])
        ];
    }
    $leaveStmt->close();

    $payslipStmt = $connect->prepare("
        SELECT 
            p.created_at,
            p.status,
            p.paid_date,
            DATE_FORMAT(p.start_date, '%M %Y') as month,
            p.net_pay
        FROM payroll p
        WHERE p.emp_id = ? 
            AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY p.created_at DESC 
        LIMIT 3
    ");
    $payslipStmt->bind_param("i", $emp_id);
    $payslipStmt->execute();
    $payslipResult = $payslipStmt->get_result();

    while ($row = $payslipResult->fetch_assoc()) {
        $time_ago = getTimeAgo($row['created_at']);
        $action = "Payslip Generated - {$row['month']}";
        
        if ($row['status'] === 'Paid' && $row['paid_date']) {
            $action = "Payslip Paid - {$row['month']}";
        }
        
        $activities[] = [
            'action' => $action,
            'time' => $time_ago,
            'icon' => 'CreditCard',
            'status' => strtolower($row['status']) === 'paid' ? 'processed' : 'generated'
        ];
    }
    $payslipStmt->close();

    usort($activities, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });

    return array_slice($activities, 0, 5);
}

function getTimeAgo($datetime) {
    $time = strtotime($datetime);
    $now = time();
    $diff = $now - $time;

    if ($diff < 60) {
        return 'Just now';
    } elseif ($diff < 3600) {
        $mins = floor($diff / 60);
        return $mins . ' min ago';
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 604800) {
        $days = floor($diff / 86400);
        return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
    } else {
        return date('M j', $time);
    }
}
?>