<?php
include '../Config/db.php';
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_employees':
        getEmployees();
        break;
    case 'get_employee':
        getEmployee();
        break;
    case 'create_employee':
        createEmployee();
        break;
    case 'update_employee':
        updateEmployee();
        break;
    case 'delete_employee':
        deleteEmployee();
        break;
    case 'get_departments':
        getDepartmentsForSelect();
        break;
    case 'get_positions':
        getPositionsForSelect();
        break;
    case 'get_employee_approvals':
        getEmployeeApprovals();
        break;
    case 'update_approval_status':
        updateApprovalStatus();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getEmployees() {
    global $connect;

    $stmt = $connect->prepare("
        SELECT 
            e.emp_id, 
            e.user_id, 
            e.dept_id, 
            e.position_id,
            e.first_name, 
            e.last_name, 
            e.email, 
            e.phone, 
            e.hire_date, 
            e.hourly_rate, 
            e.salary_monthly, 
            e.is_active,
            d.name as department_name,
            p.designation as position_designation,
            u.username,
            u.user_type,
            u.created_at,
            u.updated_at
        FROM employees e
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        LEFT JOIN positions p ON e.position_id = p.p_id
        LEFT JOIN users u ON e.user_id = u.user_id
        ORDER BY e.first_name, e.last_name
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $employees = [];
    while ($row = $result->fetch_assoc()) {
        $employees[] = [
            'emp_id' => $row['emp_id'],
            'user_id' => $row['user_id'],
            'dept_id' => $row['dept_id'],
            'position_id' => $row['position_id'],
            'name' => $row['first_name'] . ' ' . $row['last_name'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'hire_date' => $row['hire_date'],
            'position' => $row['position_designation'],
            'position_designation' => $row['position_designation'],
            'department' => $row['department_name'],
            'hourly_rate' => $row['hourly_rate'],
            'salary_monthly' => $row['salary_monthly'],
            'status' => $row['is_active'] ? 'Active' : 'Inactive',
            'is_active' => $row['is_active'],
            'username' => $row['username'],
            'user_type' => $row['user_type'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }

    echo json_encode([
        'type' => 'success',
        'data' => $employees
    ]);

    $stmt->close();
}

function getEmployee() {
    global $connect;

    $emp_id = isset($_GET['emp_id']) ? intval($_GET['emp_id']) : 0;

    if ($emp_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid employee ID'
        ]);
        return;
    }

    $stmt = $connect->prepare("
        SELECT 
            e.emp_id, 
            e.user_id, 
            e.dept_id, 
            e.position_id,
            e.first_name, 
            e.last_name, 
            e.email, 
            e.phone, 
            e.hire_date, 
            e.hourly_rate, 
            e.salary_monthly, 
            e.is_active,
            d.name as department_name,
            p.designation as position_designation,
            u.username,
            u.user_type,
            u.created_at,
            u.updated_at
        FROM employees e
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        LEFT JOIN positions p ON e.position_id = p.p_id
        LEFT JOIN users u ON e.user_id = u.user_id
        WHERE e.emp_id = ?
    ");
    $stmt->bind_param("i", $emp_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();
        $employee = [
            'emp_id' => $row['emp_id'],
            'user_id' => $row['user_id'],
            'dept_id' => $row['dept_id'],
            'position_id' => $row['position_id'],
            'name' => $row['first_name'] . ' ' . $row['last_name'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'hire_date' => $row['hire_date'],
            'position' => $row['position_designation'],
            'position_designation' => $row['position_designation'],
            'department' => $row['department_name'],
            'hourly_rate' => $row['hourly_rate'],
            'salary_monthly' => $row['salary_monthly'],
            'status' => $row['is_active'] ? 'Active' : 'Inactive',
            'is_active' => $row['is_active'],
            'username' => $row['username'],
            'user_type' => $row['user_type'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
        
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
}

function createEmployee() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    
    $first_name = isset($data['first_name']) ? trim($data['first_name']) : '';
    $last_name = isset($data['last_name']) ? trim($data['last_name']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $phone = isset($data['phone']) ? trim($data['phone']) : '';
    $hire_date = isset($data['hire_date']) ? trim($data['hire_date']) : date('Y-m-d');
    $dept_id = isset($data['dept_id']) && !empty($data['dept_id']) ? intval($data['dept_id']) : null;
    $position_id = isset($data['position_id']) && !empty($data['position_id']) ? intval($data['position_id']) : null;
    $hourly_rate = isset($data['hourly_rate']) && $data['hourly_rate'] !== '' ? floatval($data['hourly_rate']) : null;
    $salary_monthly = isset($data['salary_monthly']) && $data['salary_monthly'] !== '' ? floatval($data['salary_monthly']) : null;
    $is_active = isset($data['is_active']) ? intval($data['is_active']) : 1;
    
    $username = isset($data['username']) ? trim($data['username']) : '';
    $password = isset($data['password']) ? trim($data['password']) : '';
    $user_type = 'Employee';

    if (empty($first_name) || empty($last_name) || empty($email) || empty($username) || empty($password)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'First name, last name, email, username, and password are required'
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

    $check_stmt = $connect->prepare("
        SELECT emp_id 
        FROM employees 
        WHERE email = ?
    ");
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Email already exists in employee records'
        ]);
        $check_stmt->close();
        return;
    }
    $check_stmt->close();

    $check_stmt = $connect->prepare("
        SELECT user_id 
        FROM users 
        WHERE username = ? AND user_type = 'Employee'
    ");
    $check_stmt->bind_param("s", $username);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Username already exists for another employee'
        ]);
        $check_stmt->close();
        return;
    }
    $check_stmt->close();

    $check_stmt = $connect->prepare("
        SELECT user_id 
        FROM users 
        WHERE email = ? AND user_type = 'Employee'
    ");
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Email already exists for another employee account'
        ]);
        $check_stmt->close();
        return;
    }
    $check_stmt->close();

    $connect->begin_transaction();

    try {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        $user_stmt = $connect->prepare("
            INSERT INTO users (username, password, email, user_type, is_active) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $user_stmt->bind_param("ssssi", $username, $hashed_password, $email, $user_type, $is_active);
        $user_stmt->execute();
        
        if ($user_stmt->affected_rows === 0) {
            throw new Exception("Failed to create user account");
        }
        
        $user_id = $connect->insert_id;
        $user_stmt->close();

        $emp_stmt = $connect->prepare("
            INSERT INTO employees (
                user_id, dept_id, position_id, first_name, last_name, email, phone, 
                hire_date, hourly_rate, salary_monthly, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $emp_stmt->bind_param(
            "iiisssssddi", 
            $user_id, $dept_id, $position_id, $first_name, $last_name, $email, $phone,
            $hire_date, $hourly_rate, $salary_monthly, $is_active
        );
        $emp_stmt->execute();
        
        if ($emp_stmt->affected_rows === 0) {
            throw new Exception("Failed to create employee record");
        }
        
        $emp_id = $connect->insert_id;
        $emp_stmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Employee created successfully',
            'data' => [
                'emp_id' => $emp_id,
                'user_id' => $user_id
            ]
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to create employee: ' . $e->getMessage()
        ]);
    }
}

function updateEmployee() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    
    $emp_id = isset($data['emp_id']) ? intval($data['emp_id']) : 0;
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
    
    $first_name = isset($data['first_name']) ? trim($data['first_name']) : '';
    $last_name = isset($data['last_name']) ? trim($data['last_name']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $phone = isset($data['phone']) ? trim($data['phone']) : '';
    $hire_date = isset($data['hire_date']) ? trim($data['hire_date']) : '';
    $dept_id = isset($data['dept_id']) && $data['dept_id'] !== '' ? intval($data['dept_id']) : null;
    $position_id = isset($data['position_id']) && $data['position_id'] !== '' ? intval($data['position_id']) : null;
    $hourly_rate = isset($data['hourly_rate']) && $data['hourly_rate'] !== '' ? floatval($data['hourly_rate']) : null;
    $salary_monthly = isset($data['salary_monthly']) && $data['salary_monthly'] !== '' ? floatval($data['salary_monthly']) : null;
    $is_active = isset($data['is_active']) ? intval($data['is_active']) : 1;
    
    $username = isset($data['username']) ? trim($data['username']) : '';
    $password = isset($data['password']) ? trim($data['password']) : '';
    $user_type = 'Employee';

    if ($emp_id <= 0 || $user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid employee or user ID'
        ]);
        return;
    }

    if (empty($first_name) || empty($last_name) || empty($email) || empty($username)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'First name, last name, email, and username are required'
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

    $check_stmt = $connect->prepare("
        SELECT emp_id 
        FROM employees 
        WHERE email = ? AND emp_id != ?
    ");
    $check_stmt->bind_param("si", $email, $emp_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Email already exists for another employee'
        ]);
        $check_stmt->close();
        return;
    }
    $check_stmt->close();

    $check_stmt = $connect->prepare("
        SELECT user_id 
        FROM users 
        WHERE username = ? AND user_id != ? AND user_type = 'Employee'
    ");
    $check_stmt->bind_param("si", $username, $user_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Username already exists for another employee'
        ]);
        $check_stmt->close();
        return;
    }
    $check_stmt->close();

    $check_stmt = $connect->prepare("
        SELECT user_id 
        FROM users 
        WHERE email = ? AND user_id != ? AND user_type = 'Employee'
    ");
    $check_stmt->bind_param("si", $email, $user_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Email already exists for another employee account'
        ]);
        $check_stmt->close();
        return;
    }
    $check_stmt->close();

    $connect->begin_transaction();

    try {
        if (!empty($password)) {
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $user_stmt = $connect->prepare("
                UPDATE users 
                SET username = ?, password = ?, email = ?, is_active = ? 
                WHERE user_id = ?
            ");
            $user_stmt->bind_param("sssii", $username, $hashed_password, $email, $is_active, $user_id);
        } else {
            $user_stmt = $connect->prepare("
                UPDATE users 
                SET username = ?, email = ?, is_active = ? 
                WHERE user_id = ?
            ");
            $user_stmt->bind_param("ssii", $username, $email, $is_active, $user_id);
        }
        
        $user_stmt->execute();
        
        if ($user_stmt->affected_rows === 0) {
            throw new Exception("No changes made to user account or user not found");
        }
        $user_stmt->close();

        $emp_stmt = $connect->prepare("
            UPDATE employees 
            SET dept_id = ?, position_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, 
                hire_date = ?, hourly_rate = ?, salary_monthly = ?, is_active = ?
            WHERE emp_id = ?
        ");
        
        $emp_stmt->bind_param(
            "iisssssddii", 
            $dept_id, $position_id, $first_name, $last_name, $email, $phone,
            $hire_date, $hourly_rate, $salary_monthly, $is_active, $emp_id
        );
        $emp_stmt->execute();
        
        if ($emp_stmt->affected_rows === 0) {
            throw new Exception("No changes made to employee record or employee not found");
        }
        $emp_stmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Employee updated successfully'
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to update employee: ' . $e->getMessage()
        ]);
    }
}

function deleteEmployee() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    
    $emp_id = isset($data['emp_id']) ? intval($data['emp_id']) : 0;
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;

    if ($emp_id <= 0 || $user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid employee or user ID'
        ]);
        return;
    }

    $connect->begin_transaction();

    try {
        $emp_stmt = $connect->prepare("DELETE FROM employees WHERE emp_id = ?");
        $emp_stmt->bind_param("i", $emp_id);
        $emp_stmt->execute();
        
        if ($emp_stmt->affected_rows === 0) {
            throw new Exception("Employee record not found");
        }
        $emp_stmt->close();

        $user_stmt = $connect->prepare("DELETE FROM users WHERE user_id = ?");
        $user_stmt->bind_param("i", $user_id);
        $user_stmt->execute();
        
        if ($user_stmt->affected_rows === 0) {
            throw new Exception("User account not found");
        }
        $user_stmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Employee deleted successfully'
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to delete employee: ' . $e->getMessage()
        ]);
    }
}

function getDepartmentsForSelect() {
    global $connect;

    $stmt = $connect->prepare("
        SELECT dept_id, name 
        FROM departments 
        ORDER BY name
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $departments = [];
    while ($row = $result->fetch_assoc()) {
        $departments[] = [
            'dept_id' => $row['dept_id'],
            'department_name' => $row['name']
        ];
    }

    echo json_encode([
        'type' => 'success',
        'data' => $departments
    ]);

    $stmt->close();
}

function getPositionsForSelect() {
    global $connect;

    $dept_id = isset($_GET['dept_id']) ? intval($_GET['dept_id']) : null;

    $sql = "SELECT p_id, designation, dept_id FROM positions WHERE 1=1";
    
    if ($dept_id) {
        $sql .= " AND dept_id = ?";
    }
    
    $sql .= " ORDER BY designation";

    $stmt = $connect->prepare($sql);
    
    if ($dept_id) {
        $stmt->bind_param("i", $dept_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    $positions = [];
    while ($row = $result->fetch_assoc()) {
        $positions[] = [
            'position_id' => $row['p_id'],
            'position_name' => $row['designation'],
            'dept_id' => $row['dept_id']
        ];
    }

    echo json_encode([
        'type' => 'success',
        'data' => $positions
    ]);

    $stmt->close();
}

function getEmployeeApprovals() {
    global $connect;

    $stmt = $connect->prepare("
        SELECT 
            approval_id,
            username,
            email,
            status,
            submitted_at,
            approved_by,
            approved_at
        FROM employee_approvals 
        ORDER BY 
            CASE 
                WHEN status = 'Pending' THEN 1
                WHEN status = 'Approved' THEN 2
                WHEN status = 'Rejected' THEN 3
            END,
            submitted_at DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $approvals = [];
    while ($row = $result->fetch_assoc()) {
        $approvals[] = [
            'approval_id' => $row['approval_id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'status' => $row['status'],
            'submitted_at' => $row['submitted_at'],
            'approved_by' => $row['approved_by'],
            'approved_at' => $row['approved_at']
        ];
    }

    echo json_encode([
        'type' => 'success',
        'data' => $approvals
    ]);

    $stmt->close();
}

function updateApprovalStatus() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    
    $approval_id = isset($data['approval_id']) ? intval($data['approval_id']) : 0;
    $status = isset($data['status']) ? trim($data['status']) : '';
    $approved_by = isset($data['approved_by']) ? trim($data['approved_by']) : '';

    if ($approval_id <= 0 || empty($status)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid approval ID or status'
        ]);
        return;
    }

    $connect->begin_transaction();

    try {
        $check_stmt = $connect->prepare("
            SELECT status FROM employee_approvals WHERE approval_id = ?
        ");
        $check_stmt->bind_param("i", $approval_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows === 0) {
            throw new Exception("Approval record not found");
        }
        
        $current_status = $check_result->fetch_assoc()['status'];
        $check_stmt->close();

        if ($current_status !== 'Pending') {
            throw new Exception("This approval has already been processed and cannot be modified");
        }

        $get_stmt = $connect->prepare("
            SELECT username, email, password 
            FROM employee_approvals 
            WHERE approval_id = ?
        ");
        $get_stmt->bind_param("i", $approval_id);
        $get_stmt->execute();
        $result = $get_stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("Approval record not found");
        }
        
        $approval_data = $result->fetch_assoc();
        $get_stmt->close();

        if ($status === 'Approved') {
            $check_user_stmt = $connect->prepare("
                SELECT user_id FROM users WHERE username = ? AND user_type = 'Employee'
            ");
            $check_user_stmt->bind_param("s", $approval_data['username']);
            $check_user_stmt->execute();
            $user_exists = $check_user_stmt->get_result()->num_rows > 0;
            $check_user_stmt->close();

            if ($user_exists) {
                throw new Exception("Username already exists in the system");
            }

            $check_email_stmt = $connect->prepare("
                SELECT user_id FROM users WHERE email = ? AND user_type = 'Employee'
            ");
            $check_email_stmt->bind_param("s", $approval_data['email']);
            $check_email_stmt->execute();
            $email_exists = $check_email_stmt->get_result()->num_rows > 0;
            $check_email_stmt->close();

            if ($email_exists) {
                throw new Exception("Email already exists in the system");
            }

            $hashed_password = password_hash($approval_data['password'], PASSWORD_DEFAULT);
            
            $user_stmt = $connect->prepare("
                INSERT INTO users (username, password, email, user_type, is_active) 
                VALUES (?, ?, ?, 'Employee', 1)
            ");
            $user_stmt->bind_param("sss", $approval_data['username'], $hashed_password, $approval_data['email']);
            $user_stmt->execute();
            
            if ($user_stmt->affected_rows === 0) {
                throw new Exception("Failed to create user account");
            }
            
            $user_id = $connect->insert_id;
            $user_stmt->close();

            $emp_stmt = $connect->prepare("
                INSERT INTO employees (user_id, first_name, last_name, email, hire_date, is_active) 
                VALUES (?, ?, ?, ?, CURDATE(), 1)
            ");
            
            $first_name = ucfirst($approval_data['username']);
            $last_name = 'User';
            
            $emp_stmt->bind_param("isss", $user_id, $first_name, $last_name, $approval_data['email']);
            $emp_stmt->execute();
            
            if ($emp_stmt->affected_rows === 0) {
                throw new Exception("Failed to create employee record");
            }
            $emp_stmt->close();
        }

        $update_stmt = $connect->prepare("
            UPDATE employee_approvals 
            SET status = ?, approved_by = ?, approved_at = NOW() 
            WHERE approval_id = ?
        ");
        $update_stmt->bind_param("ssi", $status, $approved_by, $approval_id);
        $update_stmt->execute();
        
        if ($update_stmt->affected_rows === 0) {
            throw new Exception("Failed to update approval record");
        }
        $update_stmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Approval status updated successfully'
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to update approval status: ' . $e->getMessage()
        ]);
    }
}
?>