<?php
include '../Config/db.php';
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_departments':
        getDepartments();
        break;
    case 'get_department':
        getDepartment();
        break;
    case 'create_department':
        createDepartment();
        break;
    case 'update_department':
        updateDepartment();
        break;
    case 'delete_department':
        deleteDepartment();
        break;
    case 'get_department_positions':
        getDepartmentPositions();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getDepartments() {
    global $connect;

    $stmt = $connect->prepare("
        SELECT d.dept_id, d.name, d.location, 
               COUNT(p.p_id) as positions_count
        FROM departments d 
        LEFT JOIN positions p ON d.dept_id = p.dept_id 
        GROUP BY d.dept_id, d.name, d.location 
        ORDER BY d.name
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $departments = [];
    while ($row = $result->fetch_assoc()) {
        $row['positions_count'] = intval($row['positions_count']);
        $departments[] = $row;
    }

    echo json_encode([
        'type' => 'success',
        'data' => $departments
    ]);

    $stmt->close();
}

function getDepartment() {
    global $connect;

    $dept_id = isset($_GET['dept_id']) ? intval($_GET['dept_id']) : 0;

    if ($dept_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid department ID'
        ]);
        return;
    }

    $stmt = $connect->prepare("
        SELECT d.dept_id, d.name, d.location,
               COUNT(DISTINCT p.p_id) as positions_count,
               COUNT(DISTINCT e.emp_id) as employee_count
        FROM departments d 
        LEFT JOIN positions p ON d.dept_id = p.dept_id 
        LEFT JOIN employees e ON d.dept_id = e.dept_id AND e.is_active = 1
        WHERE d.dept_id = ?
        GROUP BY d.dept_id, d.name, d.location
    ");
    $stmt->bind_param("i", $dept_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $department = $result->fetch_assoc();
        $department['positions_count'] = intval($department['positions_count']);
        $department['employee_count'] = intval($department['employee_count']);
        
        $positionsStmt = $connect->prepare("
            SELECT p.p_id, p.designation,
                   COUNT(e.emp_id) as employee_count
            FROM positions p
            LEFT JOIN employees e ON p.p_id = e.position_id AND e.is_active = 1
            WHERE p.dept_id = ?
            GROUP BY p.p_id, p.designation
            ORDER BY p.designation
        ");
        $positionsStmt->bind_param("i", $dept_id);
        $positionsStmt->execute();
        $positionsResult = $positionsStmt->get_result();
        
        $positions = [];
        while ($position = $positionsResult->fetch_assoc()) {
            $position['employee_count'] = intval($position['employee_count']);
            $positions[] = $position;
        }
        
        $department['positions'] = $positions;
        
        echo json_encode([
            'type' => 'success',
            'data' => $department
        ]);
        
        $positionsStmt->close();
    } else {
        echo json_encode([
            'type' => 'error',
            'message' => 'Department not found'
        ]);
    }

    $stmt->close();
}

function getDepartmentPositions() {
    global $connect;

    $dept_id = isset($_GET['dept_id']) ? intval($_GET['dept_id']) : 0;

    if ($dept_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid department ID'
        ]);
        return;
    }

    $stmt = $connect->prepare("
        SELECT p.p_id, p.designation,
               COUNT(e.emp_id) as employee_count
        FROM positions p
        LEFT JOIN employees e ON p.p_id = e.position_id AND e.is_active = 1
        WHERE p.dept_id = ?
        GROUP BY p.p_id, p.designation
        ORDER BY p.designation
    ");
    $stmt->bind_param("i", $dept_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $positions = [];
    while ($row = $result->fetch_assoc()) {
        $row['employee_count'] = intval($row['employee_count']);
        $positions[] = $row;
    }

    echo json_encode([
        'type' => 'success',
        'data' => $positions
    ]);

    $stmt->close();
}

function createDepartment() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $name = isset($data['name']) ? trim($data['name']) : '';
    $location = isset($data['location']) ? trim($data['location']) : '';
    $designations = isset($data['designations']) ? $data['designations'] : [];

    if (empty($name)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Department name is required'
        ]);
        return;
    }

    if (empty($designations)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'At least one designation is required'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT dept_id FROM departments WHERE name = ?");
    $checkStmt->bind_param("s", $name);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Department name already exists'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    $connect->begin_transaction();

    try {
        $stmt = $connect->prepare("INSERT INTO departments (name, location) VALUES (?, ?)");
        $stmt->bind_param("ss", $name, $location);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to create department: ' . $stmt->error);
        }
        
        $dept_id = $stmt->insert_id;
        $stmt->close();

        $positionStmt = $connect->prepare("INSERT INTO positions (dept_id, designation) VALUES (?, ?)");
        
        foreach ($designations as $designation) {
            $designation = trim($designation);
            if (!empty($designation)) {
                $positionStmt->bind_param("is", $dept_id, $designation);
                if (!$positionStmt->execute()) {
                    throw new Exception('Failed to create position: ' . $positionStmt->error);
                }
            }
        }
        
        $positionStmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Department created successfully',
            'dept_id' => $dept_id
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function updateDepartment() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $dept_id = isset($data['dept_id']) ? intval($data['dept_id']) : 0;
    $name = isset($data['name']) ? trim($data['name']) : '';
    $location = isset($data['location']) ? trim($data['location']) : '';
    $designations = isset($data['designations']) ? $data['designations'] : [];

    if ($dept_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid department ID'
        ]);
        return;
    }

    if (empty($name)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Department name is required'
        ]);
        return;
    }

    if (empty($designations)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'At least one designation is required'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT dept_id FROM departments WHERE name = ? AND dept_id != ?");
    $checkStmt->bind_param("si", $name, $dept_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Department name already exists'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    $connect->begin_transaction();

    try {
        $stmt = $connect->prepare("UPDATE departments SET name = ?, location = ? WHERE dept_id = ?");
        $stmt->bind_param("ssi", $name, $location, $dept_id);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to update department: ' . $stmt->error);
        }
        
        $stmt->close();

        $deleteStmt = $connect->prepare("DELETE FROM positions WHERE dept_id = ?");
        $deleteStmt->bind_param("i", $dept_id);
        
        if (!$deleteStmt->execute()) {
            throw new Exception('Failed to delete existing positions: ' . $deleteStmt->error);
        }
        
        $deleteStmt->close();

        $positionStmt = $connect->prepare("INSERT INTO positions (dept_id, designation) VALUES (?, ?)");
        
        foreach ($designations as $designation) {
            $designation = trim($designation);
            if (!empty($designation)) {
                $positionStmt->bind_param("is", $dept_id, $designation);
                if (!$positionStmt->execute()) {
                    throw new Exception('Failed to create position: ' . $positionStmt->error);
                }
            }
        }
        
        $positionStmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Department updated successfully'
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function deleteDepartment() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $dept_id = isset($data['dept_id']) ? intval($data['dept_id']) : 0;

    if ($dept_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid department ID'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT COUNT(*) as employee_count FROM employees WHERE dept_id = ?");
    $checkStmt->bind_param("i", $dept_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $employeeCount = $checkResult->fetch_assoc()['employee_count'];
    $checkStmt->close();

    if ($employeeCount > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Cannot delete department. There are ' . $employeeCount . ' employee(s) assigned to this department.'
        ]);
        return;
    }

    $connect->begin_transaction();

    try {
        $deletePositionsStmt = $connect->prepare("DELETE FROM positions WHERE dept_id = ?");
        $deletePositionsStmt->bind_param("i", $dept_id);
        
        if (!$deletePositionsStmt->execute()) {
            throw new Exception('Failed to delete positions: ' . $deletePositionsStmt->error);
        }
        
        $deletePositionsStmt->close();

        $stmt = $connect->prepare("DELETE FROM departments WHERE dept_id = ?");
        $stmt->bind_param("i", $dept_id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                $connect->commit();
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Department deleted successfully'
                ]);
            } else {
                $connect->rollback();
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Department not found'
                ]);
            }
        } else {
            throw new Exception('Failed to delete department: ' . $stmt->error);
        }

        $stmt->close();

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}
?>