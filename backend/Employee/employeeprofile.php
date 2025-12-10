<?php
include '../Config/db.php';
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_employee_data':
        getEmployeeData();
        break;
    case 'update_employee_data':
        updateEmployeeData();
        break;
    case 'update_password':
        updatePassword();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getEmployeeData() {
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
                e.emp_id,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                e.hire_date,
                d.name as department_name,
                p.designation as position_name
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN positions p ON e.position_id = p.p_id
            WHERE e.user_id = ?
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $employee = $result->fetch_assoc();
            
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

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function updateEmployeeData() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $first_name = isset($data['first_name']) ? trim($data['first_name']) : '';
    $last_name = isset($data['last_name']) ? trim($data['last_name']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $phone = isset($data['phone']) ? trim($data['phone']) : '';

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    if (empty($first_name)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'First name is required'
        ]);
        return;
    }

    if (empty($last_name)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Last name is required'
        ]);
        return;
    }

    if (empty($email)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Email is required'
        ]);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid email format'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("
        SELECT emp_id FROM employees 
        WHERE email = ? AND user_id != ?
    ");
    $checkStmt->bind_param("si", $email, $user_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Email already exists for another employee'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $stmt = $connect->prepare("
            UPDATE employees 
            SET first_name = ?, last_name = ?, email = ?, phone = ?
            WHERE user_id = ?
        ");
        $stmt->bind_param("ssssi", $first_name, $last_name, $email, $phone, $user_id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Profile updated successfully'
                ]);
            } else {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'No changes made or employee not found'
                ]);
            }
        } else {
            throw new Exception('Failed to update profile: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function updatePassword() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $current_password = isset($data['current_password']) ? trim($data['current_password']) : '';
    $new_password = isset($data['new_password']) ? trim($data['new_password']) : '';

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    if (empty($current_password)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Current password is required'
        ]);
        return;
    }

    if (empty($new_password)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'New password is required'
        ]);
        return;
    }

    if (strlen($new_password) < 6) {
        echo json_encode([
            'type' => 'error',
            'message' => 'New password must be at least 6 characters long'
        ]);
        return;
    }

    try {
        $verifyStmt = $connect->prepare("
            SELECT password FROM users WHERE user_id = ?
        ");
        $verifyStmt->bind_param("i", $user_id);
        $verifyStmt->execute();
        $verifyResult = $verifyStmt->get_result();

        if ($verifyResult->num_rows === 1) {
            $user = $verifyResult->fetch_assoc();
            
            if (!password_verify($current_password, $user['password'])) {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Current password is incorrect'
                ]);
                $verifyStmt->close();
                return;
            }
        } else {
            echo json_encode([
                'type' => 'error',
                'message' => 'User not found'
            ]);
            $verifyStmt->close();
            return;
        }
        $verifyStmt->close();

        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        $updateStmt = $connect->prepare("
            UPDATE users SET password = ? WHERE user_id = ?
        ");
        $updateStmt->bind_param("si", $hashed_password, $user_id);
        
        if ($updateStmt->execute()) {
            if ($updateStmt->affected_rows > 0) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Password updated successfully'
                ]);
            } else {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'No changes made'
                ]);
            }
        } else {
            throw new Exception('Failed to update password: ' . $updateStmt->error);
        }
        
        $updateStmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}
?>