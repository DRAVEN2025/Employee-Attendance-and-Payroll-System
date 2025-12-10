<?php

include '../Config/db.php'; 
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'signin':
        SignInUser();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function SignInUser() {
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

    $stmt = $connect->prepare("SELECT user_id, username, email, password, user_type, is_active FROM users WHERE (username = ? OR email = ?)");
    $stmt->bind_param("ss", $username, $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        if ($user['is_active'] == 0) {
            echo json_encode([
                'type' => 'error',
                'message' => 'Your account is deactivated. Please contact administrator.'
            ]);
            return;
        }
        
        if (password_verify($password, $user['password'])) {
            echo json_encode([
                'type' => 'success',
                'message' => 'Sign in successful',
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'user_type' => $user['user_type']
            ]);
        } else {
            echo json_encode([
                'type' => 'error',
                'message' => 'Invalid password'
            ]);
        }
        
        $stmt->close();
        return;
    }

    $stmt->close();

    $checkApprovalStmt = $connect->prepare("SELECT approval_id, status FROM employee_approvals WHERE (username = ? OR email = ?)");
    $checkApprovalStmt->bind_param("ss", $username, $username);
    $checkApprovalStmt->execute();
    $approvalResult = $checkApprovalStmt->get_result();

    if ($approvalResult->num_rows === 1) {
        $approval = $approvalResult->fetch_assoc();
        $checkApprovalStmt->close();
        
        if ($approval['status'] === 'Pending') {
            echo json_encode([
                'type' => 'error',
                'message' => 'Your employee account is pending approval. Please wait for administrator approval.'
            ]);
            return;
        } elseif ($approval['status'] === 'Rejected') {
            echo json_encode([
                'type' => 'error',
                'message' => 'Your employee application was rejected. You can resubmit your registration.'
            ]);
            return;
        }
    }
    $checkApprovalStmt->close();

    echo json_encode([
        'type' => 'error',
        'message' => 'User not found'
    ]);
}

?>