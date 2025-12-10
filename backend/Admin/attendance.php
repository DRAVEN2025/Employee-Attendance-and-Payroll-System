<?php
include '../Config/db.php';
include '../Config/header.php';

require_once('../../tcpdf/tcpdf.php');

header('Content-Type: application/json');

date_default_timezone_set('Asia/Manila');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_attendance':
        getAttendance();
        break;
    case 'generate_attendance':
        generateAttendance();
        break;
    case 'update_status':
        updateAttendanceStatus();
        break;
    case 'export_report':
        exportReport();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getAttendance() {
    global $connect;

    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    $stmt = $connect->prepare("
        SELECT 
            ad.emp_id,
            CONCAT(e.first_name, ' ', e.last_name) as name,
            d.name as department,
            TIME(al.clock_in) as clock_in,
            TIME(al.clock_out) as clock_out,
            ad.hours_worked,
            ad.status
        FROM attendance_daily ad
        LEFT JOIN employees e ON ad.emp_id = e.emp_id
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        LEFT JOIN attendance_logs al ON ad.emp_id = al.emp_id AND DATE(al.clock_in) = ad.work_date
        WHERE ad.work_date = ?
        ORDER BY e.first_name, e.last_name
    ");
    $stmt->bind_param("s", $date);
    $stmt->execute();
    $result = $stmt->get_result();

    $attendance = [];
    while ($row = $result->fetch_assoc()) {
        $row['clock_in'] = $row['clock_in'] ? date('h:i A', strtotime($row['clock_in'])) : null;
        $row['clock_out'] = $row['clock_out'] ? date('h:i A', strtotime($row['clock_out'])) : null;
        $attendance[] = $row;
    }

    echo json_encode([
        'type' => 'success',
        'data' => $attendance
    ]);

    $stmt->close();
}

function generateAttendance() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $date = isset($data['date']) ? $data['date'] : date('Y-m-d');

    if (!DateTime::createFromFormat('Y-m-d', $date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid date format. Use YYYY-MM-DD'
        ]);
        return;
    }

    try {
        $connect->begin_transaction();

        $isHoliday = false;
        $holidayStmt = $connect->prepare("SELECT event FROM holidays WHERE date = ?");
        $holidayStmt->bind_param("s", $date);
        $holidayStmt->execute();
        $holidayResult = $holidayStmt->get_result();
        if ($holidayResult->num_rows > 0) {
            $isHoliday = true;
        }
        $holidayStmt->close();

        $employeesStmt = $connect->prepare("
            SELECT e.emp_id, e.first_name, e.last_name 
            FROM employees e
            WHERE e.is_active = 1
            AND e.emp_id NOT IN (
                SELECT ad.emp_id 
                FROM attendance_daily ad 
                WHERE ad.work_date = ?
            )
        ");
        $employeesStmt->bind_param("s", $date);
        $employeesStmt->execute();
        $employeesResult = $employeesStmt->get_result();

        $generatedCount = 0;
        $onLeaveCount = 0;
        $holidayCount = 0;
        $alreadyExistsCount = 0;

        while ($employee = $employeesResult->fetch_assoc()) {
            $emp_id = $employee['emp_id'];
            $status = '';
            $hours_worked = 0.00;
            $late_minutes = 0;

            $leaveStmt = $connect->prepare("
                SELECT el.leave_id 
                FROM employee_leaves el 
                WHERE el.emp_id = ? 
                AND el.status = 'Approved' 
                AND ? BETWEEN el.start_date AND el.end_date
                LIMIT 1
            ");
            $leaveStmt->bind_param("is", $emp_id, $date);
            $leaveStmt->execute();
            $leaveResult = $leaveStmt->get_result();

            if ($leaveResult->num_rows > 0) {
                $status = 'On Leave';
                $onLeaveCount++;
            } 
            elseif ($isHoliday) {
                $status = 'Holiday';
                $holidayCount++;
            }
            
            $leaveStmt->close();

            $dailyStmt = $connect->prepare("
                INSERT INTO attendance_daily (emp_id, work_date, hours_worked, overtime_hrs, late_minutes, early_minutes, status)
                VALUES (?, ?, ?, 0.00, ?, 0, ?)
            ");
            $dailyStmt->bind_param("isdds", $emp_id, $date, $hours_worked, $late_minutes, $status);
            $dailyStmt->execute();
            $dailyStmt->close();

            $generatedCount++;
        }

        $employeesStmt->close();

        $connect->commit();

        $message = "Successfully generated attendance records for {$generatedCount} employees";
        if ($generatedCount === 0) {
            $message = "All employees already have attendance records for this date";
        }

        echo json_encode([
            'type' => 'success',
            'message' => $message,
            'details' => [
                'generated' => $generatedCount,
                'on_leave' => $onLeaveCount,
                'holiday' => $holidayCount,
                'already_exists' => $alreadyExistsCount
            ],
            'count' => $generatedCount
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to generate attendance: ' . $e->getMessage()
        ]);
    }
}

function updateAttendanceStatus() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $date = isset($data['date']) ? $data['date'] : date('Y-m-d');

    if (!DateTime::createFromFormat('Y-m-d', $date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid date format. Use YYYY-MM-DD'
        ]);
        return;
    }

    try {
        $connect->begin_transaction();

        $workingHoursStmt = $connect->prepare("SELECT start_time, end_time FROM working_hours LIMIT 1");
        $workingHoursStmt->execute();
        $workingHoursResult = $workingHoursStmt->get_result();
        
        if ($workingHoursResult->num_rows === 0) {
            throw new Exception("Working hours not configured");
        }
        
        $workingHours = $workingHoursResult->fetch_assoc();
        $workingHoursStmt->close();

        $end_time_str = $date . ' ' . $workingHours['end_time'];
        $current_datetime = new DateTime('now', new DateTimeZone('Asia/Manila'));
        $end_datetime = new DateTime($end_time_str, new DateTimeZone('Asia/Manila'));

        if ($workingHours['end_time'] < $workingHours['start_time']) {
            $end_datetime->modify('+1 day');
        }

        error_log("Philippine Current time: " . $current_datetime->format('Y-m-d H:i:s'));
        error_log("Philippine End time: " . $end_datetime->format('Y-m-d H:i:s'));
        error_log("Current timestamp: " . $current_datetime->getTimestamp());
        error_log("End timestamp: " . $end_datetime->getTimestamp());

        if ($current_datetime < $end_datetime) {
            $time_remaining = $end_datetime->getTimestamp() - $current_datetime->getTimestamp();
            $minutes_remaining = ceil($time_remaining / 60);
            $hours_remaining = floor($minutes_remaining / 60);
            $mins_remaining = $minutes_remaining % 60;
            
            $time_display = "";
            if ($hours_remaining > 0) {
                $time_display .= "{$hours_remaining} hour" . ($hours_remaining > 1 ? "s" : "");
            }
            if ($mins_remaining > 0) {
                if ($time_display) $time_display .= " and ";
                $time_display .= "{$mins_remaining} minute" . ($mins_remaining > 1 ? "s" : "");
            }
            
            echo json_encode([
                'type' => 'error',
                'message' => "Cannot update status yet. Working hours are still ongoing. Time remaining: {$time_display}."
            ]);
            return;
        }

        $checkStmt = $connect->prepare("SELECT COUNT(*) as count FROM attendance_daily WHERE work_date = ?");
        $checkStmt->bind_param("s", $date);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $attendanceCount = $checkResult->fetch_assoc()['count'];
        $checkStmt->close();

        if ($attendanceCount === 0) {
            echo json_encode([
                'type' => 'error',
                'message' => 'No attendance records found for this date. Please generate attendance first.'
            ]);
            return;
        }

        $updateStmt = $connect->prepare("
            UPDATE attendance_daily ad
            LEFT JOIN attendance_logs al ON ad.emp_id = al.emp_id AND DATE(al.clock_in) = ad.work_date
            SET ad.status = 'Absent'
            WHERE ad.work_date = ? 
            AND ad.status NOT IN ('On Leave', 'Holiday')
            AND al.clock_in IS NULL
        ");
        $updateStmt->bind_param("s", $date);
        $updateStmt->execute();
        $affectedRows = $updateStmt->affected_rows;
        $updateStmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => "Successfully updated {$affectedRows} employees to Absent status",
            'updated_count' => $affectedRows
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to update attendance status: ' . $e->getMessage()
        ]);
    }
}

function exportReport() {
    global $connect;

    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

    if (!DateTime::createFromFormat('Y-m-d', $date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid date format. Use YYYY-MM-DD'
        ]);
        return;
    }

    try {
        $companyInfo = getCompanyInfo();
        
        $stmt = $connect->prepare("
            SELECT 
                ad.emp_id,
                CONCAT(e.first_name, ' ', e.last_name) as name,
                d.name as department,
                TIME(al.clock_in) as clock_in,
                TIME(al.clock_out) as clock_out,
                ad.hours_worked,
                ad.overtime_hrs,
                ad.late_minutes,
                ad.status
            FROM attendance_daily ad
            LEFT JOIN employees e ON ad.emp_id = e.emp_id
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN attendance_logs al ON ad.emp_id = al.emp_id AND DATE(al.clock_in) = ad.work_date
            WHERE ad.work_date = ?
            ORDER BY e.first_name, e.last_name
        ");
        $stmt->bind_param("s", $date);
        $stmt->execute();
        $result = $stmt->get_result();

        $attendanceData = [];
        $summary = [
            'total_employees' => 0,
            'present_count' => 0,
            'late_count' => 0,
            'on_leave_count' => 0,
            'absent_count' => 0,
            'holiday_count' => 0,
            'total_hours' => 0,
            'total_overtime' => 0
        ];

        while ($row = $result->fetch_assoc()) {
            $attendanceData[] = [
                'emp_id' => $row['emp_id'],
                'name' => $row['name'],
                'department' => $row['department'],
                'clock_in' => $row['clock_in'] ? date('h:i A', strtotime($row['clock_in'])) : '-',
                'clock_out' => $row['clock_out'] ? date('h:i A', strtotime($row['clock_out'])) : '-',
                'hours_worked' => number_format(floatval($row['hours_worked']), 2),
                'overtime_hrs' => number_format(floatval($row['overtime_hrs']), 2),
                'late_minutes' => $row['late_minutes'],
                'status' => $row['status']
            ];

            $summary['total_employees']++;
            $summary['total_hours'] += floatval($row['hours_worked']);
            $summary['total_overtime'] += floatval($row['overtime_hrs']);
            
            switch ($row['status']) {
                case 'Present':
                    $summary['present_count']++;
                    break;
                case 'Late':
                    $summary['late_count']++;
                    break;
                case 'On Leave':
                    $summary['on_leave_count']++;
                    break;
                case 'Absent':
                    $summary['absent_count']++;
                    break;
                case 'Holiday':
                    $summary['holiday_count']++;
                    break;
            }
        }
        $stmt->close();

        $attended = $summary['present_count'] + $summary['late_count'];
        $summary['attendance_rate'] = $summary['total_employees'] > 0 ? 
            round(($attended / $summary['total_employees']) * 100, 2) : 0;

        $report_data = [
            'company' => $companyInfo,
            'date' => $date,
            'summary' => $summary,
            'attendance_data' => $attendanceData
        ];

        $pdf = generatePDF($report_data);
        
        $pdf_content = $pdf->Output('', 'S');
        
        echo json_encode([
            'type' => 'success',
            'data' => [
                'pdf_content' => base64_encode($pdf_content),
                'filename' => "daily_attendance_report_" . date('Y_m_d', strtotime($date)) . ".pdf"
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function generatePDF($report_data) {
    $companyName = $report_data['company']['company_name'] ?? "Computer Arts and Technological College Inc.";
    $formattedDate = date('F j, Y', strtotime($report_data['date']));
    
    $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
    
    $pdf->SetCreator('Employee Attendance System');
    $pdf->SetAuthor($companyName);
    $pdf->SetTitle("Daily Attendance Report - {$formattedDate}");
    $pdf->SetSubject('Daily Attendance Report');
    
    $pdf->SetHeaderData('', 0, $companyName, "Employee Attendance and Payroll System\nDaily Attendance Report - {$formattedDate}");
    
    $pdf->setHeaderFont(Array('helvetica', '', 10));
    $pdf->setFooterFont(Array('helvetica', '', 8));
    
    $pdf->SetDefaultMonospacedFont('courier');
    
    $pdf->SetMargins(15, 25, 15);
    $pdf->SetHeaderMargin(10);
    $pdf->SetFooterMargin(10);
    
    $pdf->SetAutoPageBreak(TRUE, 15);
    
    $pdf->AddPage();
    
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->Cell(0, 10, 'DAILY ATTENDANCE REPORT', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, $formattedDate, 0, 1, 'C');
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Summary', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $summary_info = array(
        'Total Employees' => $report_data['summary']['total_employees'],
        'Present' => $report_data['summary']['present_count'],
        'Late' => $report_data['summary']['late_count'],
        'On Leave' => $report_data['summary']['on_leave_count'],
        'Absent' => $report_data['summary']['absent_count'],
        'Holiday' => $report_data['summary']['holiday_count'],
        'Attendance Rate' => $report_data['summary']['attendance_rate'] . '%',
        'Total Hours Worked' => number_format($report_data['summary']['total_hours'], 2) . ' hrs',
        'Total Overtime' => number_format($report_data['summary']['total_overtime'], 2) . ' hrs'
    );
    
    $pdf->SetFillColor(240, 240, 240);
    foreach ($summary_info as $label => $value) {
        $pdf->Cell(60, 6, $label . ':', 1, 0, 'L', true);
        $pdf->Cell(40, 6, $value, 1, 1, 'C');
    }
    
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Employee Attendance Details', 0, 1);
    
    $pdf->SetFont('helvetica', 'B', 9);
    $header = array('ID', 'Name', 'Department', 'Clock In', 'Clock Out', 'Hours', 'Overtime', 'Late (mins)', 'Status');
    $widths = array(15, 40, 35, 25, 25, 20, 20, 20, 25);
    
    $pdf->SetFillColor(240, 240, 240);
    
    for ($i = 0; $i < count($header); $i++) {
        $pdf->Cell($widths[$i], 7, $header[$i], 1, 0, 'C', true);
    }
    $pdf->Ln();
    
    $pdf->SetFont('helvetica', '', 8);
    $pdf->SetFillColor(255, 255, 255);
    
    foreach ($report_data['attendance_data'] as $record) {
        if ($pdf->GetY() > 180) {
            $pdf->AddPage();
            $pdf->SetFont('helvetica', 'B', 9);
            for ($i = 0; $i < count($header); $i++) {
                $pdf->Cell($widths[$i], 7, $header[$i], 1, 0, 'C', true);
            }
            $pdf->Ln();
            $pdf->SetFont('helvetica', '', 8);
        }
        
        $pdf->Cell($widths[0], 6, $record['emp_id'], 1, 0, 'C');
        $pdf->Cell($widths[1], 6, $record['name'], 1, 0, 'L');
        $pdf->Cell($widths[2], 6, $record['department'] ?: '-', 1, 0, 'L');
        $pdf->Cell($widths[3], 6, $record['clock_in'], 1, 0, 'C');
        $pdf->Cell($widths[4], 6, $record['clock_out'], 1, 0, 'C');
        $pdf->Cell($widths[5], 6, $record['hours_worked'], 1, 0, 'C');
        $pdf->Cell($widths[6], 6, $record['overtime_hrs'], 1, 0, 'C');
        $pdf->Cell($widths[7], 6, $record['late_minutes'] > 0 ? $record['late_minutes'] : '-', 1, 0, 'C');
        
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
            case 'On Leave':
                $pdf->SetTextColor(0, 0, 255);
                break;
            case 'Holiday':
                $pdf->SetTextColor(128, 0, 128);
                break;
            default:
                $pdf->SetTextColor(0, 0, 0);
        }
        $pdf->Cell($widths[8], 6, $status, 1, 1, 'C');
        $pdf->SetTextColor(0, 0, 0);
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
?>