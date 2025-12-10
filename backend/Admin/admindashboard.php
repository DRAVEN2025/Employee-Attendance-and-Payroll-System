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

    try {
        $today = date('Y-m-d');
        
        $totalEmployees = getTotalEmployees();
        
        $attendanceStats = getTodayAttendanceStats($today);
        
        $recentActivity = getRecentActivity($today);

        echo json_encode([
            'type' => 'success',
            'data' => [
                'totalEmployees' => $totalEmployees,
                'presentToday' => $attendanceStats['present'],
                'onLeave' => $attendanceStats['on_leave'],
                'absentToday' => $attendanceStats['absent'],
                'recentActivity' => $recentActivity
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to fetch dashboard data: ' . $e->getMessage()
        ]);
    }
}

function getTotalEmployees() {
    global $connect;
    
    $stmt = $connect->prepare("
        SELECT COUNT(*) as total 
        FROM employees 
        WHERE is_active = 1
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    
    return $row['total'];
}

function getTodayAttendanceStats($today) {
    global $connect;
    
    $stats = [
        'present' => 0,
        'absent' => 0,
        'on_leave' => 0
    ];
    
    $stmt = $connect->prepare("
        SELECT status, COUNT(*) as count 
        FROM attendance_daily 
        WHERE work_date = ? 
        GROUP BY status
    ");
    $stmt->bind_param("s", $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        if (in_array($row['status'], ['Present', 'Late', 'Half-Day'])) {
            $stats['present'] += $row['count'];
        } elseif ($row['status'] === 'On Leave') {
            $stats['on_leave'] += $row['count'];
        } elseif ($row['status'] === 'Absent') {
            $stats['absent'] += $row['count'];
        }
    }
    $stmt->close();
    
    $totalPresent = $stats['present'] + $stats['on_leave'] + $stats['absent'];
    if ($totalPresent === 0) {
        $totalEmployees = getTotalEmployees();
        $stats['absent'] = $totalEmployees;
    }
    
    return $stats;
}

function getRecentActivity($today) {
    global $connect;
    
    $activity = [];
    
    $stmt = $connect->prepare("
        SELECT 
            al.log_id,
            al.emp_id,
            al.clock_in,
            al.clock_out,
            e.first_name,
            e.last_name,
            d.name as department,
            CASE 
                WHEN al.clock_in IS NOT NULL AND al.clock_out IS NULL THEN 'Clocked In'
                WHEN al.clock_in IS NOT NULL AND al.clock_out IS NOT NULL THEN 'Clocked Out'
                ELSE 'Unknown'
            END as action,
            CASE 
                WHEN al.clock_in IS NOT NULL AND al.clock_out IS NULL THEN 'success'
                WHEN al.clock_in IS NOT NULL AND al.clock_out IS NOT NULL THEN 'success'
                ELSE 'pending'
            END as status
        FROM attendance_logs al
        INNER JOIN employees e ON al.emp_id = e.emp_id
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        WHERE DATE(al.clock_in) = ? OR DATE(al.clock_out) = ?
        ORDER BY GREATEST(al.clock_in, al.clock_out) DESC
        LIMIT 10
    ");
    $stmt->bind_param("ss", $today, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $activity[] = [
            'log_id' => $row['log_id'],
            'emp_id' => $row['emp_id'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'department' => $row['department'],
            'action' => $row['action'],
            'status' => $row['status'],
            'time' => $row['clock_out'] ?: $row['clock_in']
        ];
    }
    $stmt->close();
    
    if (empty($activity)) {
        $activity = getTodayAttendanceActivity($today);
    }
    
    return $activity;
}

function getTodayAttendanceActivity($today) {
    global $connect;
    
    $activity = [];
    
    $stmt = $connect->prepare("
        SELECT 
            ad.emp_id,
            e.first_name,
            e.last_name,
            d.name as department,
            ad.status as action,
            ad.status,
            ? as time
        FROM attendance_daily ad
        INNER JOIN employees e ON ad.emp_id = e.emp_id
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        WHERE ad.work_date = ?
        ORDER BY ad.emp_id
        LIMIT 10
    ");
    $stmt->bind_param("ss", $today, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $activity[] = [
            'emp_id' => $row['emp_id'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'department' => $row['department'],
            'action' => $row['action'],
            'status' => $row['status'],
            'time' => $row['time']
        ];
    }
    $stmt->close();
    
    return $activity;
}
?>