<?php
include '../Config/db.php';
include '../Config/header.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_holidays':
        getHolidays();
        break;
    case 'get_holiday':
        getHoliday();
        break;
    case 'create_holiday':
        createHoliday();
        break;
    case 'update_holiday':
        updateHoliday();
        break;
    case 'delete_holiday':
        deleteHoliday();
        break;
    default:
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid action'
        ]);
        break;
}

function getHolidays() {
    global $connect;

    $year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
    
    $stmt = $connect->prepare("
        SELECT h_id, event, date 
        FROM holidays 
        WHERE YEAR(date) = ?
        ORDER BY date
    ");
    $stmt->bind_param("i", $year);
    $stmt->execute();
    $result = $stmt->get_result();

    $holidays = [];
    while ($row = $result->fetch_assoc()) {
        $holidays[] = $row;
    }

    echo json_encode([
        'type' => 'success',
        'data' => $holidays
    ]);

    $stmt->close();
}

function getHoliday() {
    global $connect;

    $h_id = isset($_GET['h_id']) ? intval($_GET['h_id']) : 0;

    if ($h_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid holiday ID'
        ]);
        return;
    }

    $stmt = $connect->prepare("SELECT h_id, event, date FROM holidays WHERE h_id = ?");
    $stmt->bind_param("i", $h_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $holiday = $result->fetch_assoc();
        
        echo json_encode([
            'type' => 'success',
            'data' => $holiday
        ]);
    } else {
        echo json_encode([
            'type' => 'error',
            'message' => 'Holiday not found'
        ]);
    }

    $stmt->close();
}

function createHoliday() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $event = isset($data['event']) ? trim($data['event']) : '';
    $date = isset($data['date']) ? trim($data['date']) : '';

    if (empty($event)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Event name is required'
        ]);
        return;
    }

    if (empty($date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Date is required'
        ]);
        return;
    }

    if (!DateTime::createFromFormat('Y-m-d', $date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid date format. Use YYYY-MM-DD'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT h_id FROM holidays WHERE date = ?");
    $checkStmt->bind_param("s", $date);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'A holiday already exists on this date'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $stmt = $connect->prepare("INSERT INTO holidays (event, date) VALUES (?, ?)");
        $stmt->bind_param("ss", $event, $date);
        
        if ($stmt->execute()) {
            echo json_encode([
                'type' => 'success',
                'message' => 'Holiday created successfully',
                'h_id' => $stmt->insert_id
            ]);
        } else {
            throw new Exception('Failed to create holiday: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function updateHoliday() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $h_id = isset($data['h_id']) ? intval($data['h_id']) : 0;
    $event = isset($data['event']) ? trim($data['event']) : '';
    $date = isset($data['date']) ? trim($data['date']) : '';

    if ($h_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid holiday ID'
        ]);
        return;
    }

    if (empty($event)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Event name is required'
        ]);
        return;
    }

    if (empty($date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Date is required'
        ]);
        return;
    }

    if (!DateTime::createFromFormat('Y-m-d', $date)) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid date format. Use YYYY-MM-DD'
        ]);
        return;
    }

    $checkStmt = $connect->prepare("SELECT h_id FROM holidays WHERE date = ? AND h_id != ?");
    $checkStmt->bind_param("si", $date, $h_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Another holiday already exists on this date'
        ]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    try {
        $stmt = $connect->prepare("UPDATE holidays SET event = ?, date = ? WHERE h_id = ?");
        $stmt->bind_param("ssi", $event, $date, $h_id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Holiday updated successfully'
                ]);
            } else {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'No changes made or holiday not found'
                ]);
            }
        } else {
            throw new Exception('Failed to update holiday: ' . $stmt->error);
        }
        
        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function deleteHoliday() {
    global $connect;

    $data = json_decode(file_get_contents('php://input'), true);
    $h_id = isset($data['h_id']) ? intval($data['h_id']) : 0;

    if ($h_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid holiday ID'
        ]);
        return;
    }

    try {
        $stmt = $connect->prepare("DELETE FROM holidays WHERE h_id = ?");
        $stmt->bind_param("i", $h_id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'type' => 'success',
                    'message' => 'Holiday deleted successfully'
                ]);
            } else {
                echo json_encode([
                    'type' => 'error',
                    'message' => 'Holiday not found'
                ]);
            }
        } else {
            throw new Exception('Failed to delete holiday: ' . $stmt->error);
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