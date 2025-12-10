<?php

include '../Config/db.php'; 
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'signup':
        SignUpUser();
        break;
    case 'verify_admin_credentials':
        verifyAdminCredentials();
        break;
    case 'check_admin_verifier':
        checkAdminVerifier();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function checkAdminVerifier() {
    global $connect;

    $stmt = $connect->prepare("SELECT COUNT(*) as count FROM admin_verifier WHERE is_active = 1");
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    echo json_encode([
        'type' => 'success',
        'hasAdminVerifier' => $row['count'] > 0
    ]);
}

function verifyAdminCredentials() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $username = isset($data['username']) ? trim($data['username']) : '';
    $password = isset($data['password']) ? $data['password'] : '';

    if (empty($username) || empty($password)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Username and password are required'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT COUNT(*) as count FROM admin_verifier WHERE is_active = 1");
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $row = $result->fetch_assoc();
    $checkStmt->close();

    if ($row['count'] == 0) {
        echo json_encode([
            'type' => 'success',
            'message' => 'Admin verification credentials accepted (first admin setup)',
            'is_first_admin' => true
        ]);
        return;
    }

    $stmt = $connect->prepare("SELECT av_id, username, password FROM admin_verifier WHERE username = ? AND is_active = 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid admin verification credentials'
        ]);
        return;
    }

    $adminVerifier = $result->fetch_assoc();
    $stmt->close();

    if (password_verify($password, $adminVerifier['password'])) {
        echo json_encode([
            'type' => 'success',
            'message' => 'Admin verification successful',
            'av_id' => $adminVerifier['av_id'],
            'is_first_admin' => false
        ]);
    } else {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid admin verification credentials'
        ]);
    }
}

function SignUpUser() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $username = isset($data['username']) ? trim($data['username']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $password = isset($data['password']) ? $data['password'] : '';
    $user_type = isset($data['user_type']) ? trim($data['user_type']) : 'Employee';
    $admin_verifier_username = isset($data['admin_verifier_username']) ? trim($data['admin_verifier_username']) : '';
    $admin_verifier_password = isset($data['admin_verifier_password']) ? $data['admin_verifier_password'] : '';

    if (empty($username) || empty($email) || empty($password)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Username, email, and password are required'
        ]);
        return;
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    if ($user_type === 'Employee') {
        $checkUserStmt = $connect->prepare("SELECT user_id FROM users WHERE username = ? OR email = ?");
        $checkUserStmt->bind_param("ss", $username, $email);
        $checkUserStmt->execute();
        $checkUserStmt->store_result();
        
        if ($checkUserStmt->num_rows > 0) {
            $checkUserStmt->close();
            echo json_encode([
                'type' => 'error',
                'message' => 'Username or email already exists in the system'
            ]);
            return;
        }
        $checkUserStmt->close();

        $checkApprovalStmt = $connect->prepare("SELECT approval_id, status FROM employee_approvals WHERE (username = ? OR email = ?) AND status = 'Pending'");
        $checkApprovalStmt->bind_param("ss", $username, $email);
        $checkApprovalStmt->execute();
        $checkApprovalStmt->store_result();
        
        if ($checkApprovalStmt->num_rows > 0) {
            $checkApprovalStmt->close();
            echo json_encode([
                'type' => 'error',
                'message' => 'An approval request with this username or email is already pending'
            ]);
            return;
        }
        $checkApprovalStmt->close();

        $checkRejectedStmt = $connect->prepare("SELECT approval_id FROM employee_approvals WHERE (username = ? OR email = ?) AND status = 'Rejected'");
        $checkRejectedStmt->bind_param("ss", $username, $email);
        $checkRejectedStmt->execute();
        $checkRejectedResult = $checkRejectedStmt->get_result();
        
        $was_rejected = false;
        $approval_id = null;
        
        if ($checkRejectedResult->num_rows > 0) {
            $rejectedRow = $checkRejectedResult->fetch_assoc();
            $approval_id = $rejectedRow['approval_id'];
            $was_rejected = true;
        }
        $checkRejectedStmt->close();

        if ($was_rejected) {
            $updateStmt = $connect->prepare("UPDATE employee_approvals SET password = ?, status = 'Pending', submitted_at = CURRENT_TIMESTAMP WHERE approval_id = ?");
            $updateStmt->bind_param("si", $hashedPassword, $approval_id);

            if ($updateStmt->execute()) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Employee registration resubmitted successfully! Please wait for admin approval.',
                    'requires_approval' => true,
                    'was_rejected' => true
                ]);
            } else {
                error_log("MySQL Error: " . $updateStmt->error);
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Error resubmitting employee registration. Please try again.'
                ]);
            }
            $updateStmt->close();
        } else {
            $stmt = $connect->prepare("INSERT INTO employee_approvals (username, email, password, status) VALUES (?, ?, ?, 'Pending')");
            $stmt->bind_param("sss", $username, $email, $hashedPassword);

            if ($stmt->execute()) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Employee registration submitted successfully! Please wait for admin approval.',
                    'requires_approval' => true,
                    'was_rejected' => false
                ]);
            } else {
                error_log("MySQL Error: " . $stmt->error);
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Error submitting employee registration. Please try again.'
                ]);
            }
            $stmt->close();
        }
        return;
    }

    if ($user_type === 'Admin') {
        if (empty($admin_verifier_username) || empty($admin_verifier_password)) {
            echo json_encode([
                'type' => 'error',
                'message' => 'Admin verifier credentials are required'
            ]);
            return;
        }

        $debugStmt = $connect->prepare("SELECT COUNT(*) as count FROM admin_verifier");
        $debugStmt->execute();
        $debugResult = $debugStmt->get_result();
        $debugRow = $debugResult->fetch_assoc();
        $debugStmt->close();
        
        error_log("DEBUG: Current admin_verifier count: " . $debugRow['count']);

        $checkStmt = $connect->prepare("SELECT COUNT(*) as count FROM admin_verifier WHERE is_active = 1");
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $row = $result->fetch_assoc();
        $checkStmt->close();

        $hasAdminVerifier = $row['count'] > 0;
        
        error_log("DEBUG: Has active admin verifier: " . ($hasAdminVerifier ? 'YES' : 'NO'));

        if (!$hasAdminVerifier) {
            error_log("DEBUG: Creating first admin verifier with username: " . $admin_verifier_username);
            
            $hashedVerifierPassword = password_hash($admin_verifier_password, PASSWORD_BCRYPT);
            
            $checkVerifierStmt = $connect->prepare("SELECT av_id FROM admin_verifier WHERE username = ?");
            $checkVerifierStmt->bind_param("s", $admin_verifier_username);
            $checkVerifierStmt->execute();
            $checkVerifierStmt->store_result();
            
            if ($checkVerifierStmt->num_rows > 0) {
                $checkVerifierStmt->close();
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Admin verifier username already exists'
                ]);
                return;
            }
            $checkVerifierStmt->close();

            $insertStmt = $connect->prepare("INSERT INTO admin_verifier (username, password, is_active) VALUES (?, ?, 1)");
            $insertStmt->bind_param("ss", $admin_verifier_username, $hashedVerifierPassword);
            
            if ($insertStmt->execute()) {
                $newVerifierId = $connect->insert_id;
                error_log("SUCCESS: Admin verifier created with ID: " . $newVerifierId);
                $insertStmt->close();
                
                $verifyInsertStmt = $connect->prepare("SELECT av_id, username FROM admin_verifier WHERE av_id = ?");
                $verifyInsertStmt->bind_param("i", $newVerifierId);
                $verifyInsertStmt->execute();
                $verifyResult = $verifyInsertStmt->get_result();
                $verifyRow = $verifyResult->fetch_assoc();
                $verifyInsertStmt->close();
                
                error_log("VERIFICATION: Retrieved admin verifier - ID: " . $verifyRow['av_id'] . ", Username: " . $verifyRow['username']);
            } else {
                error_log("ERROR: Failed to create admin verifier: " . $insertStmt->error);
                $insertStmt->close();
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Error creating admin verifier: ' . $connect->error
                ]);
                return;
            }
        } else {
            error_log("DEBUG: Verifying against existing admin verifier");
            $verifyStmt = $connect->prepare("SELECT av_id, password FROM admin_verifier WHERE username = ? AND is_active = 1");
            $verifyStmt->bind_param("s", $admin_verifier_username);
            $verifyStmt->execute();
            $verifyResult = $verifyStmt->get_result();
            
            if ($verifyResult->num_rows === 0) {
                $verifyStmt->close();
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Invalid admin verification credentials'
                ]);
                return;
            }

            $adminVerifier = $verifyResult->fetch_assoc();
            $verifyStmt->close();

            if (!password_verify($admin_verifier_password, $adminVerifier['password'])) {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Invalid admin verification credentials'
                ]);
                return;
            }
        }

        $checkUserStmt = $connect->prepare("SELECT user_id FROM users WHERE username = ? OR email = ?");
        $checkUserStmt->bind_param("ss", $username, $email);
        $checkUserStmt->execute();
        $checkUserStmt->store_result();
        
        if ($checkUserStmt->num_rows > 0) {
            $checkUserStmt->close();
            echo json_encode([
                'type' => 'error',
                'message' => 'Username or email already exists. Please choose different credentials.'
            ]);
            return;
        }
        $checkUserStmt->close();

        $stmt = $connect->prepare("INSERT INTO users (username, email, password, user_type, is_active) VALUES (?, ?, ?, ?, 1)");
        $stmt->bind_param("ssss", $username, $email, $hashedPassword, $user_type);

        if ($stmt->execute()) {
            $userId = $connect->insert_id;
            error_log("SUCCESS: Admin user created with ID: " . $userId);
            
            echo json_encode([
                'type' => 'success',
                'message' => 'Admin Registered Successfully',
                'requires_approval' => false,
                'is_first_admin' => !$hasAdminVerifier
            ]);
        } else {
            error_log("ERROR: Failed to create admin user: " . $stmt->error);
            echo json_encode([
                'type' => 'error',
                'message' => 'Error Registering Admin: ' . $stmt->error
            ]);
        }

        $stmt->close();
    }
}

?>