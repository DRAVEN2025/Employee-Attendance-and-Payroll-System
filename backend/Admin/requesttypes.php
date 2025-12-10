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
    case 'get_leave_type':
        getLeaveType();
        break;
    case 'get_overtime_type':
        getOvertimeType();
        break;
    case 'create_leave_type':
        createLeaveType();
        break;
    case 'create_overtime_type':
        createOvertimeType();
        break;
    case 'update_leave_type':
        updateLeaveType();
        break;
    case 'update_overtime_type':
        updateOvertimeType();
        break;
    case 'delete_leave_type':
        deleteLeaveType();
        break;
    case 'delete_overtime_type':
        deleteOvertimeType();
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

    $stmt = $connect->prepare("
        SELECT leave_type_id, name, is_paid 
        FROM leave_types 
        ORDER BY name
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $leaveTypes = [];
    while ($row = $result->fetch_assoc()) {
        $leaveTypes[] = $row;
    }

    echo json_encode([
        'type' => 'success',
        'data' => $leaveTypes
    ]);

    $stmt->close();
}

function getOvertimeTypes() {
    global $connect;

    $stmt = $connect->prepare("
        SELECT ot_type_id, name, multiplier 
        FROM overtime_types 
        ORDER BY name
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $overtimeTypes = [];
    while ($row = $result->fetch_assoc()) {
        $row['multiplier'] = floatval($row['multiplier']);
        $overtimeTypes[] = $row;
    }

    echo json_encode([
        'type' => 'success',
        'data' => $overtimeTypes
    ]);

    $stmt->close();
}

function getLeaveType() {
    global $connect;

    $leave_type_id = isset($_GET['leave_type_id']) ? intval($_GET['leave_type_id']) : 0;

    if ($leave_type_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid leave type ID'
        ]);
        return;
    }

    $stmt = $connect->prepare("SELECT leave_type_id, name, is_paid FROM leave_types WHERE leave_type_id = ?");
    $stmt->bind_param("i", $leave_type_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $leaveType = $result->fetch_assoc();
        $leaveType['is_paid'] = boolval($leaveType['is_paid']);
        
        echo json_encode([
            'type' => 'success',
            'data' => $leaveType
        ]);
    } else {
        echo json_encode([
            'type' => 'error',
            'message' => 'Leave type not found'
        ]);
    }

    $stmt->close();
}

function getOvertimeType() {
    global $connect;

    $ot_type_id = isset($_GET['ot_type_id']) ? intval($_GET['ot_type_id']) : 0;

    if ($ot_type_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid overtime type ID'
        ]);
        return;
    }

    $stmt = $connect->prepare("SELECT ot_type_id, name, multiplier FROM overtime_types WHERE ot_type_id = ?");
    $stmt->bind_param("i", $ot_type_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $overtimeType = $result->fetch_assoc();
        $overtimeType['multiplier'] = floatval($overtimeType['multiplier']);
        
        echo json_encode([
            'type' => 'success',
            'data' => $overtimeType
        ]);
    } else {
        echo json_encode([
            'type' => 'error',
            'message' => 'Overtime type not found'
        ]);
    }

    $stmt->close();
}

function createLeaveType() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $name = isset($data['name']) ? trim($data['name']) : '';
    $is_paid = isset($data['is_paid']) ? boolval($data['is_paid']) : true;

    if (empty($name)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Leave type name is required'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT leave_type_id FROM leave_types WHERE name = ?");
    $checkStmt->bind_param("s", $name);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'A leave type with this name already exists'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $stmt = $connect->prepare("INSERT INTO leave_types (name, is_paid) VALUES (?, ?)");
        $stmt->bind_param("si", $name, $is_paid);
        
        if ($stmt->execute()) {
            echo json_encode([
                'type' => 'success',
                'message' => 'Leave type created successfully',
                'leave_type_id' => $stmt->insert_id
            ]);
        } else {
            throw new Exception('Failed to create leave type: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function createOvertimeType() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $name = isset($data['name']) ? trim($data['name']) : '';
    $multiplier = isset($data['multiplier']) ? floatval($data['multiplier']) : 1.50;

    if (empty($name)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Overtime type name is required'
        ]);
        return;
    }

    if ($multiplier <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Multiplier must be greater than 0'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT ot_type_id FROM overtime_types WHERE name = ?");
    $checkStmt->bind_param("s", $name);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'An overtime type with this name already exists'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $stmt = $connect->prepare("INSERT INTO overtime_types (name, multiplier) VALUES (?, ?)");
        $stmt->bind_param("sd", $name, $multiplier);
        
        if ($stmt->execute()) {
            echo json_encode([
                'type' => 'success',
                'message' => 'Overtime type created successfully',
                'ot_type_id' => $stmt->insert_id
            ]);
        } else {
            throw new Exception('Failed to create overtime type: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function updateLeaveType() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $leave_type_id = isset($data['leave_type_id']) ? intval($data['leave_type_id']) : 0;
    $name = isset($data['name']) ? trim($data['name']) : '';
    $is_paid = isset($data['is_paid']) ? boolval($data['is_paid']) : true;

    if ($leave_type_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid leave type ID'
        ]);
        return;
    }

    if (empty($name)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Leave type name is required'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT leave_type_id FROM leave_types WHERE name = ? AND leave_type_id != ?");
    $checkStmt->bind_param("si", $name, $leave_type_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Another leave type with this name already exists'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $stmt = $connect->prepare("UPDATE leave_types SET name = ?, is_paid = ? WHERE leave_type_id = ?");
        $stmt->bind_param("sii", $name, $is_paid, $leave_type_id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Leave type updated successfully'
                ]);
            } else {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'No changes made or leave type not found'
                ]);
            }
        } else {
            throw new Exception('Failed to update leave type: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function updateOvertimeType() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $ot_type_id = isset($data['ot_type_id']) ? intval($data['ot_type_id']) : 0;
    $name = isset($data['name']) ? trim($data['name']) : '';
    $multiplier = isset($data['multiplier']) ? floatval($data['multiplier']) : 1.50;

    if ($ot_type_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid overtime type ID'
        ]);
        return;
    }

    if (empty($name)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Overtime type name is required'
        ]);
        return;
    }

    if ($multiplier <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Multiplier must be greater than 0'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT ot_type_id FROM overtime_types WHERE name = ? AND ot_type_id != ?");
    $checkStmt->bind_param("si", $name, $ot_type_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Another overtime type with this name already exists'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $stmt = $connect->prepare("UPDATE overtime_types SET name = ?, multiplier = ? WHERE ot_type_id = ?");
        $stmt->bind_param("sdi", $name, $multiplier, $ot_type_id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Overtime type updated successfully'
                ]);
            } else {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'No changes made or overtime type not found'
                ]);
            }
        } else {
            throw new Exception('Failed to update overtime type: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function deleteLeaveType() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $leave_type_id = isset($data['leave_type_id']) ? intval($data['leave_type_id']) : 0;

    if ($leave_type_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid leave type ID'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT leave_id FROM employee_leaves WHERE leave_type_id = ? LIMIT 1");
    $checkStmt->bind_param("i", $leave_type_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Cannot delete leave type. It is currently being used by employee leave requests.'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $stmt = $connect->prepare("DELETE FROM leave_types WHERE leave_type_id = ?");
        $stmt->bind_param("i", $leave_type_id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Leave type deleted successfully'
                ]);
            } else {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Leave type not found'
                ]);
            }
        } else {
            throw new Exception('Failed to delete leave type: ' . $stmt->error);
        }

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function deleteOvertimeType() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $ot_type_id = isset($data['ot_type_id']) ? intval($data['ot_type_id']) : 0;

    if ($ot_type_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid overtime type ID'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT ot_id FROM overtime_requests WHERE ot_type_id = ? LIMIT 1");
    $checkStmt->bind_param("i", $ot_type_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Cannot delete overtime type. It is currently being used by overtime requests.'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $stmt = $connect->prepare("DELETE FROM overtime_types WHERE ot_type_id = ?");
        $stmt->bind_param("i", $ot_type_id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Overtime type deleted successfully'
                ]);
            } else {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Overtime type not found'
                ]);
            }
        } else {
            throw new Exception('Failed to delete overtime type: ' . $stmt->error);
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