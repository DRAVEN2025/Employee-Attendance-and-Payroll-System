<?php
include '../Config/db.php';
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_settings':
        getSettings();
        break;
    case 'update_settings':
        updateSettings();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getSettings() {
    global $connect;

    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    $settings = [];

    try {
        $companyStmt = $connect->prepare("SELECT company_name, email FROM company_information LIMIT 1");
        $companyStmt->execute();
        $companyResult = $companyStmt->get_result();
        
        if ($companyResult->num_rows > 0) {
            $companyData = $companyResult->fetch_assoc();
            $settings['company_name'] = $companyData['company_name'];
            $settings['company_email'] = $companyData['email'];
        } else {
            $settings['company_name'] = '';
            $settings['company_email'] = '';
        }
        $companyStmt->close();

        $hoursStmt = $connect->prepare("SELECT start_time, end_time, late_mins, deductions FROM working_hours LIMIT 1");
        $hoursStmt->execute();
        $hoursResult = $hoursStmt->get_result();
        
        if ($hoursResult->num_rows > 0) {
            $hoursData = $hoursResult->fetch_assoc();
            $settings['start_time'] = $hoursData['start_time'];
            $settings['end_time'] = $hoursData['end_time'];
            $settings['late_mins'] = $hoursData['late_mins'];
            $settings['deductions'] = $hoursData['deductions'];
        } else {
            $settings['start_time'] = '09:00:00';
            $settings['end_time'] = '18:00:00';
            $settings['late_mins'] = 0;
            $settings['deductions'] = 0.00;
        }
        $hoursStmt->close();

        $adminStmt = $connect->prepare("SELECT username, email, password FROM users WHERE user_id = ? AND user_type = 'Admin'");
        $adminStmt->bind_param("i", $user_id);
        $adminStmt->execute();
        $adminResult = $adminStmt->get_result();
        
        if ($adminResult->num_rows > 0) {
            $adminData = $adminResult->fetch_assoc();
            $settings['admin_username'] = $adminData['username'];
            $settings['admin_email'] = $adminData['email'];
            $settings['admin_password'] = '';
        } else {
            $settings['admin_username'] = '';
            $settings['admin_email'] = '';
            $settings['admin_password'] = '';
        }
        $adminStmt->close();

        $verifierStmt = $connect->prepare("SELECT username, password FROM admin_verifier WHERE is_active = 1 LIMIT 1");
        $verifierStmt->execute();
        $verifierResult = $verifierStmt->get_result();
        
        if ($verifierResult->num_rows > 0) {
            $verifierData = $verifierResult->fetch_assoc();
            $settings['verifier_username'] = $verifierData['username'];
            $settings['verifier_password'] = '';
        } else {
            $settings['verifier_username'] = '';
            $settings['verifier_password'] = '';
        }
        $verifierStmt->close();

        echo json_encode([
            'type' => 'success',
            'data' => $settings
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to fetch settings: ' . $e->getMessage()
        ]);
    }
}

function updateSettings() {
    global $connect;

    $input = json_decode(file_get_contents('php://input'), true);
    
    $user_id = isset($input['user_id']) ? intval($input['user_id']) : 0;
    $company_name = isset($input['companyName']) ? trim($input['companyName']) : '';
    $company_email = isset($input['email']) ? trim($input['email']) : '';
    $start_time = isset($input['startTime']) ? $input['startTime'] . ':00' : '09:00:00';
    $end_time = isset($input['endTime']) ? $input['endTime'] . ':00' : '18:00:00';
    $late_mins = isset($input['lateMins']) ? intval($input['lateMins']) : 0;
    $deductions = isset($input['deductions']) ? floatval($input['deductions']) : 0.00;
    $admin_username = isset($input['adminUsername']) ? trim($input['adminUsername']) : '';
    $admin_email = isset($input['adminEmail']) ? trim($input['adminEmail']) : '';
    $admin_password = isset($input['adminPassword']) ? trim($input['adminPassword']) : '';
    $verifier_username = isset($input['verifierUsername']) ? trim($input['verifierUsername']) : '';
    $verifier_password = isset($input['verifierPassword']) ? trim($input['verifierPassword']) : '';

    if ($user_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID'
        ]);
        return;
    }

    $connect->begin_transaction();

    try {
        $checkCompany = $connect->prepare("SELECT COUNT(*) as count FROM company_information");
        $checkCompany->execute();
        $companyCount = $checkCompany->get_result()->fetch_assoc()['count'];
        $checkCompany->close();

        if ($companyCount > 0) {
            $companyStmt = $connect->prepare("UPDATE company_information SET company_name = ?, email = ?");
            $companyStmt->bind_param("ss", $company_name, $company_email);
        } else {
            $companyStmt = $connect->prepare("INSERT INTO company_information (company_name, email) VALUES (?, ?)");
            $companyStmt->bind_param("ss", $company_name, $company_email);
        }
        $companyStmt->execute();
        $companyStmt->close();

        $checkHours = $connect->prepare("SELECT COUNT(*) as count FROM working_hours");
        $checkHours->execute();
        $hoursCount = $checkHours->get_result()->fetch_assoc()['count'];
        $checkHours->close();

        if ($hoursCount > 0) {
            $hoursStmt = $connect->prepare("UPDATE working_hours SET start_time = ?, end_time = ?, late_mins = ?, deductions = ?");
            $hoursStmt->bind_param("ssid", $start_time, $end_time, $late_mins, $deductions);
        } else {
            $hoursStmt = $connect->prepare("INSERT INTO working_hours (start_time, end_time, late_mins, deductions) VALUES (?, ?, ?, ?)");
            $hoursStmt->bind_param("ssid", $start_time, $end_time, $late_mins, $deductions);
        }
        $hoursStmt->execute();
        $hoursStmt->close();

        if (!empty($admin_password)) {
            $hashed_admin_password = password_hash($admin_password, PASSWORD_DEFAULT);
            $adminStmt = $connect->prepare("UPDATE users SET username = ?, email = ?, password = ? WHERE user_id = ? AND user_type = 'Admin'");
            $adminStmt->bind_param("sssi", $admin_username, $admin_email, $hashed_admin_password, $user_id);
        } else {
            $adminStmt = $connect->prepare("UPDATE users SET username = ?, email = ? WHERE user_id = ? AND user_type = 'Admin'");
            $adminStmt->bind_param("ssi", $admin_username, $admin_email, $user_id);
        }
        $adminStmt->execute();
        $adminStmt->close();

        if (!empty($verifier_password)) {
            $hashed_verifier_password = password_hash($verifier_password, PASSWORD_DEFAULT);
            $verifierStmt = $connect->prepare("UPDATE admin_verifier SET username = ?, password = ? WHERE is_active = 1");
            $verifierStmt->bind_param("ss", $verifier_username, $hashed_verifier_password);
        } else {
            $verifierStmt = $connect->prepare("UPDATE admin_verifier SET username = ? WHERE is_active = 1");
            $verifierStmt->bind_param("s", $verifier_username);
        }
        $verifierStmt->execute();
        $verifierStmt->close();

        $connect->commit();

        echo json_encode([
            'type' => 'success',
            'message' => 'Settings updated successfully'
        ]);

    } catch (Exception $e) {
        $connect->rollback();
        echo json_encode([
            'type' => 'error',
            'message' => 'Failed to update settings: ' . $e->getMessage()
        ]);
    }
}
?>