<?php
include '../Config/db.php';
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_leave_types':
        getLeaveTypes();
        break;
    case 'get_overtime_types':
        getOvertimeTypes();
        break;
    case 'submit_leave_request':
        submitLeaveRequest();
        break;
    case 'submit_overtime_request':
        submitOvertimeRequest();
        break;
    case 'get_leave_requests':
        getLeaveRequests();
        break;
    case 'get_overtime_requests':
        getOvertimeRequests();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getLeaveTypes() {
    global $connect;

    try {
        $stmt = $connect->prepare("SELECT leave_type_id, name FROM leave_types WHERE is_paid = 1");
        $stmt->execute();
        $result = $stmt->get_result();

        $leave_types = [];
        while ($row = $result->fetch_assoc()) {
            $leave_types[] = $row;
        }

        echo json_encode([
            'type' => 'success',
            'data' => $leave_types
        ]);

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function getOvertimeTypes() {
    global $connect;

    try {
        $stmt = $connect->prepare("SELECT ot_type_id, name, multiplier FROM overtime_types");
        $stmt->execute();
        $result = $stmt->get_result();

        $overtime_types = [];
        while ($row = $result->fetch_assoc()) {
            $overtime_types[] = $row;
        }

        echo json_encode([
            'type' => 'success',
            'data' => $overtime_types
        ]);

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function submitLeaveRequest() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $leave_type_id = isset($data['leave_type_id']) ? intval($data['leave_type_id']) : 0;
    $start_date = isset($data['start_date']) ? trim($data['start_date']) : '';
    $end_date = isset($data['end_date']) ? trim($data['end_date']) : '';
    $days_requested = isset($data['days_requested']) ? floatval($data['days_requested']) : 0;
    $notes = isset($data['notes']) ? trim($data['notes']) : '';

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    if ($leave_type_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Please select a valid leave type'
        ]);
        return;
    }

    if (empty($start_date) || empty($end_date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Start date and end date are required'
        ]);
        return;
    }

    if ($days_requested <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid date range'
        ]);
        return;
    }

    try {
        $empStmt = $connect->prepare("SELECT emp_id FROM employees WHERE user_id = ?");
        $empStmt->bind_param("i", $user_id);
        $empStmt->execute();
        $empResult = $empStmt->get_result();

        if ($empResult->num_rows === 1) {
            $employee = $empResult->fetch_assoc();
            $emp_id = $employee['emp_id'];

            $stmt = $connect->prepare("
                INSERT INTO employee_leaves (emp_id, leave_type_id, start_date, end_date, days_requested, notes, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())
            ");
            $stmt->bind_param("iissds", $emp_id, $leave_type_id, $start_date, $end_date, $days_requested, $notes);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Leave request submitted successfully'
                ]);
            } else {
                throw new Exception('Failed to submit leave request: ' . $stmt->error);
            }
            
            $stmt->close();
        } else {
            echo json_encode([
                'type' => 'error',
                'message' => 'Employee not found'
            ]);
        }
        
        $empStmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function submitOvertimeRequest() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $ot_type_id = isset($data['ot_type_id']) ? intval($data['ot_type_id']) : 0;
    $request_date = isset($data['request_date']) ? trim($data['request_date']) : '';
    $start_time = isset($data['start_time']) ? trim($data['start_time']) : '';
    $end_time = isset($data['end_time']) ? trim($data['end_time']) : '';
    $reason = isset($data['reason']) ? trim($data['reason']) : '';

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    if ($ot_type_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Please select a valid overtime type'
        ]);
        return;
    }

    if (empty($request_date) || empty($start_time) || empty($end_time)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Date, start time, and end time are required'
        ]);
        return;
    }

    if (empty($reason)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Reason is required'
        ]);
        return;
    }

    try {
        $empStmt = $connect->prepare("SELECT emp_id FROM employees WHERE user_id = ?");
        $empStmt->bind_param("i", $user_id);
        $empStmt->execute();
        $empResult = $empStmt->get_result();

        if ($empResult->num_rows === 1) {
            $employee = $empResult->fetch_assoc();
            $emp_id = $employee['emp_id'];

            $stmt = $connect->prepare("
                INSERT INTO overtime_requests (emp_id, ot_type_id, request_date, start_time, end_time, reason, status, requested_by)
                VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
            ");
            $stmt->bind_param("iissssi", $emp_id, $ot_type_id, $request_date, $start_time, $end_time, $reason, $emp_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Overtime request submitted successfully'
                ]);
            } else {
                throw new Exception('Failed to submit overtime request: ' . $stmt->error);
            }
            
            $stmt->close();
        } else {
            echo json_encode([
                'type' => 'error',
                'message' => 'Employee not found'
            ]);
        }
        
        $empStmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function getLeaveRequests() {
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
        $stmt = $connect->prepare("
            SELECT 
                el.leave_id,
                lt.name as leave_type,
                el.start_date,
                el.end_date,
                el.days_requested,
                el.status,
                el.notes,
                el.created_at as submitted_at,
                el.approved_by,
                el.approved_at,
                el.rejection_reason,
                CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name
            FROM employee_leaves el
            INNER JOIN leave_types lt ON el.leave_type_id = lt.leave_type_id
            INNER JOIN employees e ON el.emp_id = e.emp_id
            LEFT JOIN employees approver ON el.approved_by = approver.emp_id
            WHERE e.user_id = ?
            ORDER BY el.created_at DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $leave_requests = [];
        while ($row = $result->fetch_assoc()) {
            $leave_requests[] = $row;
        }

        echo json_encode([
            'type' => 'success',
            'data' => $leave_requests
        ]);

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function getOvertimeRequests() {
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
        $stmt = $connect->prepare("
            SELECT 
                ot.ot_id,
                ott.name as overtime_type,
                ott.multiplier,
                ot.request_date,
                ot.start_time,
                ot.end_time,
                ot.hours,
                ot.reason,
                ot.status,
                ot.created_at as submitted_at,
                ot.approved_by,
                ot.approved_at,
                ot.rejection_reason,
                CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name
            FROM overtime_requests ot
            INNER JOIN overtime_types ott ON ot.ot_type_id = ott.ot_type_id
            INNER JOIN employees e ON ot.emp_id = e.emp_id
            LEFT JOIN employees approver ON ot.approved_by = approver.emp_id
            WHERE e.user_id = ?
            ORDER BY ot.created_at DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $overtime_requests = [];
        while ($row = $result->fetch_assoc()) {
            $overtime_requests[] = $row;
        }

        echo json_encode([
            'type' => 'success',
            'data' => $overtime_requests
        ]);

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}
?>