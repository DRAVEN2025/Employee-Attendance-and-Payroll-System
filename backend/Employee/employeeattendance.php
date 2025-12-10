<?php
include '../Config/db.php';
include '../Config/header.php';

require_once('../../tcpdf/tcpdf.php');

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($action) {
        case 'clock_in':
            clockIn($input);
            break;
        case 'clock_out':
            clockOut($input);
            break;
        case 'get_company_info':
            getCompanyInformation();
            break;
        default:
            echo json_encode([
                'type' => 'error',
                'message' => 'Invalid action'
            ]);
            break;
    }
} else {
    switch ($action) {
        case 'get_attendance_data':
            getAttendanceData();
            break;
        case 'get_attendance_summary':
            getAttendanceSummary();
            break;
        case 'get_today_attendance':
            getTodayAttendance();
            break;
        case 'get_working_hours':
            getWorkingHours();
            break;
        case 'export_report':
            exportReport();
            break;
        case 'get_current_time':
            getCurrentTime();
            break;
        default:
            echo json_encode([
                'type' => 'error',
                'message' => 'Invalid action'
            ]);
            break;
    }
}

function getAttendanceData() {
    global $connect;

    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $month = isset($_GET['month']) ? intval($_GET['month']) : date('n');
    $year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');

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

        $start_date = "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01";
        $end_date = date("Y-m-t", strtotime($start_date));

        $stmt = $connect->prepare("
            SELECT 
                ad.daily_id,
                ad.work_date,
                ad.hours_worked,
                ad.overtime_hrs,
                ad.late_minutes,
                ad.early_minutes,
                ad.status,
                al.clock_in,
                al.clock_out,
                al.notes
            FROM attendance_daily ad
            LEFT JOIN attendance_logs al ON ad.emp_id = al.emp_id 
                AND DATE(al.clock_in) = ad.work_date
            WHERE ad.emp_id = ? 
                AND ad.work_date BETWEEN ? AND ?
            ORDER BY ad.work_date DESC
        ");
        $stmt->bind_param("iss", $emp_id, $start_date, $end_date);
        $stmt->execute();
        $result = $stmt->get_result();

        $attendanceData = [];
        while ($row = $result->fetch_assoc()) {
            $attendanceData[] = [
                'id' => $row['daily_id'],
                'date' => $row['work_date'],
                'clockIn' => $row['clock_in'] ? date('h:i A', strtotime($row['clock_in'])) : '-',
                'clockOut' => $row['clock_out'] ? date('h:i A', strtotime($row['clock_out'])) : '-',
                'hours' => number_format(floatval($row['hours_worked']), 2),
                'overtime' => number_format(floatval($row['overtime_hrs']), 2),
                'late_minutes' => $row['late_minutes'],
                'early_minutes' => $row['early_minutes'],
                'status' => $row['status'],
                'notes' => $row['notes']
            ];
        }

        echo json_encode([
            'type' => 'success',
            'data' => $attendanceData
        ]);

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function getAttendanceSummary() {
    global $connect;

    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $month = isset($_GET['month']) ? intval($_GET['month']) : date('n');
    $year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');

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

        $start_date = "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01";
        $end_date = date("Y-m-t", strtotime($start_date));

        $summaryStmt = $connect->prepare("
            SELECT 
                COUNT(*) as total_days,
                SUM(hours_worked) as total_hours,
                SUM(overtime_hrs) as total_overtime,
                SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days
            FROM attendance_daily 
            WHERE emp_id = ? 
                AND work_date BETWEEN ? AND ?
        ");
        $summaryStmt->bind_param("iss", $emp_id, $start_date, $end_date);
        $summaryStmt->execute();
        $summaryResult = $summaryStmt->get_result();

        $summary = $summaryResult->fetch_assoc();
        $summaryStmt->close();

        echo json_encode([
            'type' => 'success',
            'data' => [
                'total_days' => $summary['total_days'] ?? 0,
                'total_hours' => $summary['total_hours'] ?? 0,
                'total_overtime' => $summary['total_overtime'] ?? 0,
                'late_days' => $summary['late_days'] ?? 0,
                'absent_days' => $summary['absent_days'] ?? 0,
                'present_days' => $summary['present_days'] ?? 0
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function getTodayAttendance() {
    global $connect;

    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $today = date('Y-m-d');

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

        $attendanceStmt = $connect->prepare("
            SELECT 
                ad.daily_id,
                ad.work_date,
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
        $attendanceStmt->bind_param("is", $emp_id, $today);
        $attendanceStmt->execute();
        $attendanceResult = $attendanceStmt->get_result();

        if ($attendanceResult->num_rows > 0) {
            $attendance = $attendanceResult->fetch_assoc();
            echo json_encode([
                'type' => 'success',
                'data' => [
                    'clock_in' => $attendance['clock_in'] ? date('h:i A', strtotime($attendance['clock_in'])) : null,
                    'clock_out' => $attendance['clock_out'] ? date('h:i A', strtotime($attendance['clock_out'])) : null,
                    'status' => $attendance['status'],
                    'late_minutes' => $attendance['late_minutes'] ?? 0,
                    'overtime_hrs' => $attendance['overtime_hrs'] ?? 0
                ]
            ]);
        } else {
            echo json_encode([
                'type' => 'success',
                'data' => null
            ]);
        }

        $attendanceStmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function getWorkingHours() {
    global $connect;

    try {
        $stmt = $connect->prepare("
            SELECT start_time, end_time, late_mins, deductions 
            FROM working_hours 
            LIMIT 1
        ");
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $workingHours = $result->fetch_assoc();
            echo json_encode([
                'type' => 'success',
                'data' => $workingHours
            ]);
        } else {
            echo json_encode([
                'type' => 'error',
                'message' => 'Working hours not configured'
            ]);
        }

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function getCurrentTime() {
    $ph_timezone = new DateTimeZone('Asia/Manila');
    $current_time = new DateTime('now', $ph_timezone);
    
    echo json_encode([
        'type' => 'success',
        'data' => [
            'time' => $current_time->format('h:i:s A'),
            'date' => $current_time->format('l, F j, Y')
        ]
    ]);
}

function clockIn($input) {
    global $connect;

    $user_id = isset($input['user_id']) ? intval($input['user_id']) : 0;
    
    $current_time = isset($input['clock_in_time']) ? $input['clock_in_time'] : '';
    $today = date('Y-m-d');

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    if (empty($current_time)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Clock-in time is required'
        ]);
        return;
    }

    try {
        $connect->begin_transaction();

        $empStmt = $connect->prepare("
            SELECT emp_id FROM employees WHERE user_id = ?
        ");
        $empStmt->bind_param("i", $user_id);
        $empStmt->execute();
        $empResult = $empStmt->get_result();

        if ($empResult->num_rows === 0) {
            throw new Exception('Employee not found');
        }

        $employee = $empResult->fetch_assoc();
        $emp_id = $employee['emp_id'];
        $empStmt->close();

        $clock_in_date = date('Y-m-d', strtotime($current_time));

        $holidayStmt = $connect->prepare("
            SELECT event FROM holidays WHERE date = ?
        ");
        $holidayStmt->bind_param("s", $clock_in_date);
        $holidayStmt->execute();
        $holidayResult = $holidayStmt->get_result();

        if ($holidayResult->num_rows > 0) {
            $holiday = $holidayResult->fetch_assoc();
            throw new Exception('Cannot clock in today. Today is a holiday: ' . $holiday['event']);
        }
        $holidayStmt->close();

        $leaveStmt = $connect->prepare("
            SELECT lt.name as leave_type 
            FROM employee_leaves el 
            JOIN leave_types lt ON el.leave_type_id = lt.leave_type_id 
            WHERE el.emp_id = ? 
            AND el.status = 'Approved' 
            AND ? BETWEEN el.start_date AND el.end_date
        ");
        $leaveStmt->bind_param("is", $emp_id, $clock_in_date);
        $leaveStmt->execute();
        $leaveResult = $leaveStmt->get_result();

        if ($leaveResult->num_rows > 0) {
            $leave = $leaveResult->fetch_assoc();
            throw new Exception('Cannot clock in today. You are on ' . $leave['leave_type']);
        }
        $leaveStmt->close();

        $checkStmt = $connect->prepare("
            SELECT log_id FROM attendance_logs 
            WHERE emp_id = ? AND DATE(clock_in) = ?
        ");
        $checkStmt->bind_param("is", $emp_id, $clock_in_date);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();

        if ($checkResult->num_rows > 0) {
            throw new Exception('You have already clocked in today');
        }
        $checkStmt->close();

        $workingHoursStmt = $connect->prepare("
            SELECT start_time, end_time, late_mins FROM working_hours LIMIT 1
        ");
        $workingHoursStmt->execute();
        $workingHoursResult = $workingHoursStmt->get_result();
        
        if ($workingHoursResult->num_rows === 0) {
            throw new Exception('Working hours not configured');
        }
        
        $workingHours = $workingHoursResult->fetch_assoc();
        $workingHoursStmt->close();

        $start_time = $workingHours['start_time'];
        $end_time = $workingHours['end_time'];
        $late_mins = $workingHours['late_mins'];
        
        $clock_in_time = strtotime($current_time);
        $expected_start_time = strtotime($clock_in_date . ' ' . $start_time);
        $expected_end_time = strtotime($clock_in_date . ' ' . $end_time);
        $grace_period_end = $expected_start_time + ($late_mins * 60);
        
        if ($clock_in_time < $expected_start_time) {
            throw new Exception('Clock-in is only allowed during working hours (Starting from ' . date('h:i A', $expected_start_time) . ')');
        }
        
        if ($clock_in_time > $expected_end_time) {
            throw new Exception('Clock-in is not allowed after working hours (Ends at ' . date('h:i A', $expected_end_time) . ')');
        }
        
        $is_late = false;
        $late_minutes = 0;
        $status = 'Present';
        
        if ($clock_in_time > $grace_period_end) {
            $is_late = true;
            $status = 'Late';
            $late_minutes = round(($clock_in_time - $grace_period_end) / 60);
        }

        $logStmt = $connect->prepare("
            INSERT INTO attendance_logs (emp_id, clock_in, notes) 
            VALUES (?, ?, ?)
        ");
        $notes = $is_late ? "Clocked in late - {$late_minutes} minutes after grace period" : "Clocked in for the day";
        $logStmt->bind_param("iss", $emp_id, $current_time, $notes);
        $logStmt->execute();
        $logStmt->close();

        $dailyCheckStmt = $connect->prepare("
            SELECT daily_id FROM attendance_daily 
            WHERE emp_id = ? AND work_date = ?
        ");
        $dailyCheckStmt->bind_param("is", $emp_id, $clock_in_date);
        $dailyCheckStmt->execute();
        $dailyCheckResult = $dailyCheckStmt->get_result();

        if ($dailyCheckResult->num_rows === 0) {
            $dailyStmt = $connect->prepare("
                INSERT INTO attendance_daily (emp_id, work_date, status, late_minutes) 
                VALUES (?, ?, ?, ?)
            ");
            $dailyStmt->bind_param("issi", $emp_id, $clock_in_date, $status, $late_minutes);
            $dailyStmt->execute();
            $dailyStmt->close();
        } else {
            $dailyUpdateStmt = $connect->prepare("
                UPDATE attendance_daily 
                SET status = ?, late_minutes = ? 
                WHERE emp_id = ? AND work_date = ?
            ");
            $dailyUpdateStmt->bind_param("siis", $status, $late_minutes, $emp_id, $clock_in_date);
            $dailyUpdateStmt->execute();
            $dailyUpdateStmt->close();
        }
        $dailyCheckStmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Clocked in successfully',
            'clock_in_time' => date('h:i A', strtotime($current_time)),
            'is_late' => $is_late,
            'late_minutes' => $late_minutes,
            'status' => $status
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function clockOut($input) {
    global $connect;

    $user_id = isset($input['user_id']) ? intval($input['user_id']) : 0;
    
    $current_time = isset($input['clock_out_time']) ? $input['clock_out_time'] : '';
    $today = date('Y-m-d');

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    if (empty($current_time)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Clock-out time is required'
        ]);
        return;
    }

    try {
        $connect->begin_transaction();

        $empStmt = $connect->prepare("
            SELECT emp_id FROM employees WHERE user_id = ?
        ");
        $empStmt->bind_param("i", $user_id);
        $empStmt->execute();
        $empResult = $empStmt->get_result();

        if ($empResult->num_rows === 0) {
            throw new Exception('Employee not found');
        }

        $employee = $empResult->fetch_assoc();
        $emp_id = $employee['emp_id'];
        $empStmt->close();

        $clock_out_date = date('Y-m-d', strtotime($current_time));

        $checkStmt = $connect->prepare("
            SELECT log_id, clock_in FROM attendance_logs 
            WHERE emp_id = ? AND DATE(clock_in) = ? AND clock_out IS NULL
        ");
        $checkStmt->bind_param("is", $emp_id, $clock_out_date);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();

        if ($checkResult->num_rows === 0) {
            throw new Exception('You need to clock in first or you have already clocked out');
        }

        $attendanceLog = $checkResult->fetch_assoc();
        $log_id = $attendanceLog['log_id'];
        $clock_in = $attendanceLog['clock_in'];
        $checkStmt->close();

        $workingHoursStmt = $connect->prepare("
            SELECT start_time, end_time FROM working_hours LIMIT 1
        ");
        $workingHoursStmt->execute();
        $workingHoursResult = $workingHoursStmt->get_result();
        
        if ($workingHoursResult->num_rows === 0) {
            throw new Exception('Working hours not configured');
        }
        
        $workingHours = $workingHoursResult->fetch_assoc();
        $workingHoursStmt->close();

        $clock_in_time = strtotime($clock_in);
        $clock_out_time = strtotime($current_time);
        $hours_worked = ($clock_out_time - $clock_in_time) / 3600;

        $scheduled_end_time = strtotime($clock_out_date . ' ' . $workingHours['end_time']);
        $overtime_hrs = 0;

        if ($clock_out_time > $scheduled_end_time) {
            $overtime_seconds = $clock_out_time - $scheduled_end_time;
            $overtime_hrs = max(0, $overtime_seconds / 3600);
            
            $overtime_hrs = min($overtime_hrs, $hours_worked);
        }

        $clock_out_hour = date('H:i', $clock_out_time);
        $is_half_day = false;
        $status = 'Present';

        $statusStmt = $connect->prepare("
            SELECT status FROM attendance_daily 
            WHERE emp_id = ? AND work_date = ?
        ");
        $statusStmt->bind_param("is", $emp_id, $clock_out_date);
        $statusStmt->execute();
        $statusResult = $statusStmt->get_result();
        
        if ($statusResult->num_rows > 0) {
            $current_status = $statusResult->fetch_assoc();
            $status = $current_status['status'];
        }
        $statusStmt->close();

        if ($clock_out_hour === '12:00') {
            $is_half_day = true;
            $status = 'Half-Day';
        }

        $logStmt = $connect->prepare("
            UPDATE attendance_logs 
            SET clock_out = ?, notes = CONCAT(COALESCE(notes, ''), ' | Clocked out') 
            WHERE log_id = ?
        ");
        $logStmt->bind_param("si", $current_time, $log_id);
        $logStmt->execute();
        $logStmt->close();

        $dailyStmt = $connect->prepare("
            UPDATE attendance_daily 
            SET hours_worked = ?, overtime_hrs = ?, status = ? 
            WHERE emp_id = ? AND work_date = ?
        ");
        $dailyStmt->bind_param("ddsis", $hours_worked, $overtime_hrs, $status, $emp_id, $clock_out_date);
        $dailyStmt->execute();
        $dailyStmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Clocked out successfully',
            'clock_out_time' => date('h:i A', strtotime($current_time)),
            'hours_worked' => number_format($hours_worked, 2),
            'overtime_hrs' => number_format($overtime_hrs, 2),
            'is_half_day' => $is_half_day,
            'status' => $status
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function exportReport() {
    global $connect;

    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $month = isset($_GET['month']) ? intval($_GET['month']) : date('n');
    $year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    try {
        $empStmt = $connect->prepare("
            SELECT e.emp_id, e.first_name, e.last_name, e.email, 
                   d.name as department, p.designation as position
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN positions p ON e.position_id = p.p_id
            WHERE e.user_id = ?
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

        $start_date = "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01";
        $end_date = date("Y-m-t", strtotime($start_date));
        $month_name = date("F", strtotime($start_date));

        $stmt = $connect->prepare("
            SELECT 
                ad.work_date,
                ad.hours_worked,
                ad.overtime_hrs,
                ad.late_minutes,
                ad.early_minutes,
                ad.status,
                al.clock_in,
                al.clock_out
            FROM attendance_daily ad
            LEFT JOIN attendance_logs al ON ad.emp_id = al.emp_id 
                AND DATE(al.clock_in) = ad.work_date
            WHERE ad.emp_id = ? 
                AND ad.work_date BETWEEN ? AND ?
            ORDER BY ad.work_date
        ");
        $stmt->bind_param("iss", $emp_id, $start_date, $end_date);
        $stmt->execute();
        $result = $stmt->get_result();

        $attendanceData = [];
        $total_hours = 0;
        $total_overtime = 0;
        $present_days = 0;

        while ($row = $result->fetch_assoc()) {
            $attendanceData[] = [
                'work_date' => $row['work_date'],
                'clock_in' => $row['clock_in'] ? date('h:i A', strtotime($row['clock_in'])) : '-',
                'clock_out' => $row['clock_out'] ? date('h:i A', strtotime($row['clock_out'])) : '-',
                'hours_worked' => number_format(floatval($row['hours_worked']), 2),
                'overtime_hrs' => number_format(floatval($row['overtime_hrs']), 2),
                'late_minutes' => $row['late_minutes'],
                'status' => $row['status']
            ];

            $total_hours += floatval($row['hours_worked']);
            $total_overtime += floatval($row['overtime_hrs']);
            if ($row['status'] === 'Present') {
                $present_days++;
            }
        }
        $stmt->close();

        $summaryStmt = $connect->prepare("
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days
            FROM attendance_daily 
            WHERE emp_id = ? 
                AND work_date BETWEEN ? AND ?
        ");
        $summaryStmt->bind_param("iss", $emp_id, $start_date, $end_date);
        $summaryStmt->execute();
        $summaryResult = $summaryStmt->get_result();
        $summary = $summaryResult->fetch_assoc();
        $summaryStmt->close();

        $report_data = [
            'employee' => [
                'name' => $employee['first_name'] . ' ' . $employee['last_name'],
                'department' => $employee['department'],
                'position' => $employee['position'],
                'email' => $employee['email']
            ],
            'period' => [
                'month' => $month_name,
                'year' => $year,
                'start_date' => $start_date,
                'end_date' => $end_date
            ],
            'summary' => [
                'total_days' => $summary['total_days'] ?? 0,
                'present_days' => $summary['present_days'] ?? 0,
                'late_days' => $summary['late_days'] ?? 0,
                'absent_days' => $summary['absent_days'] ?? 0,
                'total_hours' => number_format($total_hours, 2),
                'total_overtime' => number_format($total_overtime, 2)
            ],
            'attendance_data' => $attendanceData
        ];

        $pdf = generatePDF($report_data, $month_name, $year);
        
        $pdf_content = $pdf->Output('', 'S');
        
        echo json_encode([
            'type' => 'success',
            'data' => [
                'pdf_content' => base64_encode($pdf_content),
                'filename' => "attendance_report_{$month_name}_{$year}.pdf"
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function generatePDF($report_data, $month_name, $year) {
    $companyInfo = getCompanyInfo();
    $companyName = $companyInfo['company_name'] ?? "Computer Arts and Technological College Inc.";
    
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    
    $pdf->SetCreator('Employee Attendance System');
    $pdf->SetAuthor($companyName);
    $pdf->SetTitle("Attendance Report - {$month_name} {$year}");
    $pdf->SetSubject('Employee Attendance Report');
    
    $pdf->SetHeaderData('', 0, $companyName, "Employee Attendance and Payroll System\nAttendance Report - {$month_name} {$year}");
    
    $pdf->setHeaderFont(Array('helvetica', '', 10));
    $pdf->setFooterFont(Array('helvetica', '', 8));
    
    $pdf->SetDefaultMonospacedFont('courier');
    
    $pdf->SetMargins(15, 25, 15);
    $pdf->SetHeaderMargin(10);
    $pdf->SetFooterMargin(10);
    
    $pdf->SetAutoPageBreak(TRUE, 15);
    
    $pdf->AddPage();
    
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->Cell(0, 10, 'ATTENDANCE REPORT', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, "{$month_name} {$year}", 0, 1, 'C');
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Employee Information', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $employee_info = array(
        'Name' => $report_data['employee']['name'],
        'Department' => $report_data['employee']['department'],
        'Position' => $report_data['employee']['position'],
        'Email' => $report_data['employee']['email'],
        'Period' => $report_data['period']['start_date'] . ' to ' . $report_data['period']['end_date']
    );
    
    foreach ($employee_info as $label => $value) {
        $pdf->Cell(40, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Summary', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $summary_data = array(
        'Total Working Days' => $report_data['summary']['total_days'],
        'Present Days' => $report_data['summary']['present_days'],
        'Late Days' => $report_data['summary']['late_days'],
        'Absent Days' => $report_data['summary']['absent_days'],
        'Total Hours Worked' => $report_data['summary']['total_hours'] . ' hrs',
        'Total Overtime' => $report_data['summary']['total_overtime'] . ' hrs'
    );
    
    foreach ($summary_data as $label => $value) {
        $pdf->Cell(50, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Daily Attendance Records', 0, 1);
    
    $pdf->SetFont('helvetica', 'B', 9);
    $header = array('Date', 'Clock In', 'Clock Out', 'Hours', 'Overtime', 'Status', 'Late (mins)');
    $widths = array(25, 25, 25, 20, 20, 25, 25);
    
    $pdf->SetFillColor(240, 240, 240);
    
    for ($i = 0; $i < count($header); $i++) {
        $pdf->Cell($widths[$i], 7, $header[$i], 1, 0, 'C', true);
    }
    $pdf->Ln();
    
    $pdf->SetFont('helvetica', '', 8);
    $pdf->SetFillColor(255, 255, 255);
    
    foreach ($report_data['attendance_data'] as $record) {
        if ($pdf->GetY() > 250) {
            $pdf->AddPage();
            $pdf->SetFont('helvetica', 'B', 9);
            for ($i = 0; $i < count($header); $i++) {
                $pdf->Cell($widths[$i], 7, $header[$i], 1, 0, 'C', true);
            }
            $pdf->Ln();
            $pdf->SetFont('helvetica', '', 8);
        }
        
        $pdf->Cell($widths[0], 6, date('M j', strtotime($record['work_date'])), 1, 0, 'C');
        $pdf->Cell($widths[1], 6, $record['clock_in'], 1, 0, 'C');
        $pdf->Cell($widths[2], 6, $record['clock_out'], 1, 0, 'C');
        $pdf->Cell($widths[3], 6, $record['hours_worked'], 1, 0, 'C');
        $pdf->Cell($widths[4], 6, $record['overtime_hrs'], 1, 0, 'C');
        
        $status = $record['status'];
        switch ($status) {
            case 'Present':
                $pdf->SetTextColor(0, 128, 0);
                break;
            case 'Late':
                $pdf->SetTextColor(255, 165, 0);
                break;
            case 'Absent':
                $pdf->SetTextColor(255, 0, 0);
                break;
            case 'Half-Day':
                $pdf->SetTextColor(0, 0, 255);
                break;
            default:
                $pdf->SetTextColor(0, 0, 0);
        }
        $pdf->Cell($widths[5], 6, $status, 1, 0, 'C');
        $pdf->SetTextColor(0, 0, 0);
        
        $pdf->Cell($widths[6], 6, $record['late_minutes'] > 0 ? $record['late_minutes'] : '-', 1, 1, 'C');
    }
    
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'I', 8);
    $pdf->Cell(0, 10, 'Generated on: ' . date('F j, Y \a\t h:i A'), 0, 1, 'C');
    $pdf->Cell(0, 10, 'This is a computer-generated report. No signature is required.', 0, 1, 'C');
    
    return $pdf;
}

function getCompanyInfo() {
    global $connect;
    
    try {
        $stmt = $connect->prepare("SELECT company_name, email FROM company_information LIMIT 1");
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return $result->fetch_assoc();
        }
    } catch (Exception $e) {
    }
    
    return ['company_name' => 'Computer Arts and Technological College Inc.', 'email' => 'catcollege@gmail.com'];
}

function getCompanyInformation() {
    global $connect;

    try {
        $stmt = $connect->prepare("
            SELECT company_name, email 
            FROM company_information 
            LIMIT 1
        ");
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $companyInfo = $result->fetch_assoc();
            echo json_encode([
                'type' => 'success',
                'data' => $companyInfo
            ]);
        } else {
            echo json_encode([
                'type' => 'error',
                'message' => 'Company information not found'
            ]);
        }

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}
?>