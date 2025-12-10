<?php
include '../Config/db.php';
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_leave_requests':
        getLeaveRequests();
        break;
    case 'get_overtime_requests':
        getOvertimeRequests();
        break;
    case 'update_request_status':
        updateRequestStatus();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getLeaveRequests() {
    global $connect;

    $stmt = $connect->prepare("
        SELECT 
            el.leave_id as id,
            el.emp_id as employee_id,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            lt.name as leave_type,
            el.start_date,
            el.end_date,
            el.days_requested,
            el.notes as reason,
            LOWER(el.status) as status,
            el.created_at,
            d.name as department,
            e.hourly_rate,
            el.approved_by,
            el.approved_at,
            el.rejection_reason
        FROM employee_leaves el
        JOIN employees e ON el.emp_id = e.emp_id
        JOIN leave_types lt ON el.leave_type_id = lt.leave_type_id
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        ORDER BY el.created_at DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $leaveRequests = [];
    while ($row = $result->fetch_assoc()) {
        $leaveRequests[] = [
            'id' => $row['id'],
            'employee_id' => $row['employee_id'],
            'employee_name' => $row['employee_name'],
            'leave_type' => $row['leave_type'],
            'start_date' => $row['start_date'],
            'end_date' => $row['end_date'],
            'days_requested' => $row['days_requested'],
            'reason' => $row['reason'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'department' => $row['department'],
            'hourly_rate' => $row['hourly_rate'],
            'approved_by' => $row['approved_by'],
            'approved_at' => $row['approved_at'],
            'rejection_reason' => $row['rejection_reason']
        ];
    }

    echo json_encode([
        'type' => 'success',
        'data' => $leaveRequests
    ]);

    $stmt->close();
}

function getOvertimeRequests() {
    global $connect;

    $stmt = $connect->prepare("
        SELECT 
            ot.ot_id as id,
            ot.emp_id as employee_id,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            ot_type.name as overtime_type,
            ot.request_date,
            ot.start_time,
            ot.end_time,
            ot.hours,
            ot.reason,
            LOWER(ot.status) as status,
            ot.created_at,
            d.name as department,
            e.hourly_rate,
            ot.approved_by,
            ot.approved_at,
            ot.rejection_reason
        FROM overtime_requests ot
        JOIN employees e ON ot.emp_id = e.emp_id
        JOIN overtime_types ot_type ON ot.ot_type_id = ot_type.ot_type_id
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        ORDER BY ot.created_at DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $overtimeRequests = [];
    while ($row = $result->fetch_assoc()) {
        $overtimeRequests[] = [
            'id' => $row['id'],
            'employee_id' => $row['employee_id'],
            'employee_name' => $row['employee_name'],
            'overtime_type' => $row['overtime_type'],
            'request_date' => $row['request_date'],
            'start_time' => $row['start_time'],
            'end_time' => $row['end_time'],
            'hours' => $row['hours'],
            'reason' => $row['reason'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'department' => $row['department'],
            'hourly_rate' => $row['hourly_rate'],
            'approved_by' => $row['approved_by'],
            'approved_at' => $row['approved_at'],
            'rejection_reason' => $row['rejection_reason']
        ];
    }

    echo json_encode([
        'type' => 'success',
        'data' => $overtimeRequests
    ]);

    $stmt->close();
}

function updateRequestStatus() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    
    $request_id = isset($data['request_id']) ? intval($data['request_id']) : 0;
    $status = isset($data['status']) ? trim($data['status']) : '';
    $approved_by = isset($data['approved_by']) ? trim($data['approved_by']) : '';
    $request_type = isset($data['request_type']) ? trim($data['request_type']) : '';
    $rejection_reason = isset($data['rejection_reason']) ? trim($data['rejection_reason']) : '';

    if ($request_id <= 0 || empty($status) || empty($request_type)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid request data'
        ]);
        return;
    }

    $valid_statuses = ['approved', 'rejected'];
    if (!in_array($status, $valid_statuses)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid status'
        ]);
        return;
    }

    $connect->begin_transaction();

    try {
        if ($request_type === 'leave') {
            $table = 'employee_leaves';
            $id_column = 'leave_id';
            $status_column = 'status';
        } else if ($request_type === 'overtime') {
            $table = 'overtime_requests';
            $id_column = 'ot_id';
            $status_column = 'status';
        } else {
            throw new Exception("Invalid request type");
        }

        $check_stmt = $connect->prepare("
            SELECT $status_column, approved_by 
            FROM $table 
            WHERE $id_column = ?
        ");
        $check_stmt->bind_param("i", $request_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows === 0) {
            throw new Exception("Request not found");
        }
        
        $current_data = $check_result->fetch_assoc();
        $current_status = $current_data[$status_column];
        $check_stmt->close();

        if (strtolower($current_status) !== 'pending') {
            throw new Exception("This request has already been processed and cannot be modified");
        }

        if ($status === 'rejected') {
            $update_stmt = $connect->prepare("
                UPDATE $table 
                SET $status_column = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ?
                WHERE $id_column = ?
            ");
            $db_status = ucfirst($status);
            $update_stmt->bind_param("sssi", $db_status, $approved_by, $rejection_reason, $request_id);
        } else {
            $update_stmt = $connect->prepare("
                UPDATE $table 
                SET $status_column = ?, approved_by = ?, approved_at = NOW(), rejection_reason = NULL
                WHERE $id_column = ?
            ");
            $db_status = ucfirst($status);
            $update_stmt->bind_param("ssi", $db_status, $approved_by, $request_id);
        }
        
        $update_stmt->execute();
        
        if ($update_stmt->affected_rows === 0) {
            throw new Exception("Failed to update request status");
        }
        $update_stmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Request status updated successfully'
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to update request status: ' . $e->getMessage()
        ]);
    }
}
?>