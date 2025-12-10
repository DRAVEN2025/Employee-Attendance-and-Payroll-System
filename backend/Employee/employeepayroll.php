<?php
include '../Config/db.php';
include '../Config/header.php';

require_once('../../tcpdf/tcpdf.php');

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = isset($input['action']) ? $input['action'] : '';
    
    switch ($action) {
        default:
            echo json_encode([
                'type' => 'error',
                'message' => 'Invalid action'
            ]);
            break;
    }
} else {
    switch ($action) {
        case 'get_payroll_history':
            getPayrollHistory();
            break;
        case 'download_payslip':
            downloadPayslip();
            break;
        case 'get_company_info':
            getCompanyInformation();
            break;
        default:
            echo json_encode([
                'type' => 'error',
                'message' => 'Invalid action'
            ]);
            break;
    }
}

function getPayrollHistory() {
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
        $empStmt = $connect->prepare("
            SELECT emp_id FROM employees WHERE user_id = ?
        ");
        $empStmt->bind_param("i", $user_id);
        $empStmt->execute();
        $empResult = $empStmt->get_result();

        if ($empResult->num_rows === 0) {
            echo json_encode([
                'type' => 'error',
                'message' => 'Employee not found'
            ]);
            $empStmt->close();
            return;
        }

        $employee = $empResult->fetch_assoc();
        $emp_id = $employee['emp_id'];
        $empStmt->close();

        $stmt = $connect->prepare("
            SELECT 
                p.payroll_id,
                p.emp_id,
                e.first_name,
                e.last_name,
                e.email,
                p.start_date,
                p.end_date,
                DATE_FORMAT(p.start_date, '%M %Y') as month,
                p.regular_hours,
                p.overtime_hours,
                p.allowances,
                p.gross_pay,
                p.deductions,
                p.net_pay,
                p.status,
                p.paid_date,
                d.name as department,
                pos.designation as position,
                pc_basic.amount as basic_pay,
                pc_overtime.amount as overtime_pay
            FROM payroll p
            JOIN employees e ON p.emp_id = e.emp_id
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN positions pos ON e.position_id = pos.p_id
            LEFT JOIN payroll_components pc_basic ON p.payroll_id = pc_basic.payroll_id AND pc_basic.comp_id = 1
            LEFT JOIN payroll_components pc_overtime ON p.payroll_id = pc_overtime.payroll_id AND pc_overtime.comp_id = 2
            WHERE e.user_id = ?
            ORDER BY p.start_date DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $payrollHistory = [];
        while ($row = $result->fetch_assoc()) {
            $row['employee_name'] = $row['first_name'] . ' ' . $row['last_name'];
            $row['regular_hours'] = floatval($row['regular_hours']);
            $row['overtime_hours'] = floatval($row['overtime_hours']);
            $row['allowances'] = floatval($row['allowances']);
            $row['gross_pay'] = floatval($row['gross_pay']);
            $row['deductions'] = floatval($row['deductions']);
            $row['net_pay'] = floatval($row['net_pay']);
            $row['basic_pay'] = floatval($row['basic_pay'] ?? $row['gross_pay'] - $row['allowances']);
            $row['overtime_pay'] = floatval($row['overtime_pay'] ?? 0);
            $payrollHistory[] = $row;
        }

        echo json_encode([
            'type' => 'success',
            'data' => $payrollHistory
        ]);

        $stmt->close();

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function downloadPayslip() {
    global $connect;

    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $payroll_id = isset($_GET['payroll_id']) ? intval($_GET['payroll_id']) : 0;

    if ($user_id <= 0 || $payroll_id <= 0) {
        echo json_encode([
            'type' => 'error',
            'message' => 'Invalid user ID or payroll ID'
        ]);
        return;
    }

    try {
        $verifyStmt = $connect->prepare("
            SELECT p.payroll_id 
            FROM payroll p
            JOIN employees e ON p.emp_id = e.emp_id
            WHERE e.user_id = ? AND p.payroll_id = ?
        ");
        $verifyStmt->bind_param("ii", $user_id, $payroll_id);
        $verifyStmt->execute();
        $verifyResult = $verifyStmt->get_result();

        if ($verifyResult->num_rows === 0) {
            echo json_encode([
                'type' => 'error',
                'message' => 'Payroll record not found or access denied'
            ]);
            $verifyStmt->close();
            return;
        }
        $verifyStmt->close();

        $stmt = $connect->prepare("
            SELECT 
                p.payroll_id,
                p.emp_id,
                e.first_name,
                e.last_name,
                e.email,
                p.start_date,
                p.end_date,
                DATE_FORMAT(p.start_date, '%M %Y') as month,
                p.regular_hours,
                p.overtime_hours,
                p.allowances,
                p.gross_pay,
                p.deductions,
                p.net_pay,
                p.status,
                p.paid_date,
                d.name as department,
                pos.designation as position,
                pc_basic.amount as basic_pay,
                pc_overtime.amount as overtime_pay
            FROM payroll p
            JOIN employees e ON p.emp_id = e.emp_id
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            LEFT JOIN positions pos ON e.position_id = pos.p_id
            LEFT JOIN payroll_components pc_basic ON p.payroll_id = pc_basic.payroll_id AND pc_basic.comp_id = 1
            LEFT JOIN payroll_components pc_overtime ON p.payroll_id = pc_overtime.payroll_id AND pc_overtime.comp_id = 2
            WHERE p.payroll_id = ?
        ");
        $stmt->bind_param("i", $payroll_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            throw new Exception('Payroll record not found');
        }

        $payrollData = $result->fetch_assoc();
        $stmt->close();

        $companyInfo = getCompanyInfo();
        $payrollData['company_name'] = $companyInfo['company_name'];
        $payrollData['company_email'] = $companyInfo['email'];

        $pdf = generatePayslipPDF($payrollData);
        
        $pdf_content = $pdf->Output('', 'S');
        
        $filename = "payslip_{$payrollData['first_name']}_{$payrollData['last_name']}_{$payrollData['month']}.pdf";
        $filename = str_replace(' ', '_', $filename);
        
        echo json_encode([
            'type' => 'success',
            'data' => [
                'pdf_content' => base64_encode($pdf_content),
                'filename' => $filename
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'type' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function generatePayslipPDF($payrollData) {
    $companyName = $payrollData['company_name'] ?? "Computer Arts and Technological College Inc.";
    $employeeName = $payrollData['first_name'] . ' ' . $payrollData['last_name'];
    $payPeriod = date('F j, Y', strtotime($payrollData['start_date'])) . ' to ' . date('F j, Y', strtotime($payrollData['end_date']));
    
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    
    $pdf->SetCreator('Employee Payroll System');
    $pdf->SetAuthor($companyName);
    $pdf->SetTitle("Payslip - {$employeeName} - {$payPeriod}");
    $pdf->SetSubject('Employee Payslip');
    
    $pdf->SetHeaderData('', 0, $companyName, "Employee Payslip");
    
    $pdf->setHeaderFont(Array('helvetica', '', 10));
    $pdf->setFooterFont(Array('helvetica', '', 8));
    
    $pdf->SetDefaultMonospacedFont('courier');
    
    $pdf->SetMargins(15, 25, 15);
    $pdf->SetHeaderMargin(10);
    $pdf->SetFooterMargin(10);
    
    $pdf->SetAutoPageBreak(TRUE, 15);
    
    $pdf->AddPage();
    
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->Cell(0, 10, 'EMPLOYEE PAYSLIP', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, $payPeriod, 0, 1, 'C');
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Employee Information', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $employee_info = array(
        'Employee Name' => $employeeName,
        'Employee ID' => $payrollData['emp_id'],
        'Department' => $payrollData['department'] ?? 'N/A',
        'Position' => $payrollData['position'] ?? 'N/A',
        'Email' => $payrollData['email']
    );
    
    foreach ($employee_info as $label => $value) {
        $pdf->Cell(50, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Earnings', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $earnings = array(
        'Basic Pay' => '₱' . number_format(floatval($payrollData['basic_pay'] ?? $payrollData['gross_pay'] - $payrollData['allowances']), 2),
        'Overtime Pay' => '₱' . number_format(floatval($payrollData['overtime_pay'] ?? 0), 2),
        'Regular Hours' => $payrollData['regular_hours'] . ' hrs',
        'Overtime Hours' => $payrollData['overtime_hours'] . ' hrs',
        'Allowances' => '₱' . number_format(floatval($payrollData['allowances']), 2)
    );
    
    foreach ($earnings as $label => $value) {
        $pdf->Cell(50, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Deductions', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $deductions = array(
        'Total Deductions' => '₱' . number_format(floatval($payrollData['deductions']), 2)
    );
    
    foreach ($deductions as $label => $value) {
        $pdf->Cell(50, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(8);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Payroll Summary', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $summary = array(
        'Gross Pay' => '₱' . number_format(floatval($payrollData['gross_pay']), 2),
        'Total Deductions' => '₱' . number_format(floatval($payrollData['deductions']), 2),
        'Net Pay' => '₱' . number_format(floatval($payrollData['net_pay']), 2)
    );
    
    $pdf->SetFillColor(240, 240, 240);
    foreach ($summary as $label => $value) {
        $pdf->Cell(50, 8, $label . ':', 1, 0, 'L', true);
        $pdf->Cell(40, 8, $value, 1, 1, 'R');
    }
    
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Payment Information', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    
    $payment_info = array(
        'Payroll ID' => 'PAY-' . str_pad($payrollData['payroll_id'], 3, '0', STR_PAD_LEFT),
        'Status' => $payrollData['status'],
        'Paid Date' => $payrollData['paid_date'] ? date('F j, Y', strtotime($payrollData['paid_date'])) : 'Pending'
    );
    
    foreach ($payment_info as $label => $value) {
        $pdf->Cell(40, 6, $label . ':', 0, 0);
        $pdf->Cell(0, 6, $value, 0, 1);
    }
    
    $pdf->Ln(15);
    
    $pdf->SetFont('helvetica', 'I', 8);
    $pdf->Cell(0, 10, 'Generated on: ' . date('F j, Y \a\t h:i A'), 0, 1, 'C');
    $pdf->Cell(0, 10, 'This is a computer-generated payslip. No signature is required.', 0, 1, 'C');
    
    return $pdf;
}

function getCompanyInfo() {
    global $connect;
    
    try {
        $stmt = $connect->prepare("SELECT company_name, email FROM company_information LIMIT 1");
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return $result->fetch_assoc();
        }
    } catch (Exception $e) {
    }
    
    return ['company_name' => 'Computer Arts and Technological College Inc.', 'email' => 'catcollege@gmail.com'];
}

function getCompanyInformation() {
    global $connect;

    try {
        $stmt = $connect->prepare("
            SELECT company_name, email 
            FROM company_information 
            LIMIT 1
        ");
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $companyInfo = $result->fetch_assoc();
            echo json_encode([
                'type' => 'success',
                'data' => $companyInfo
            ]);
        } else {
            echo json_encode([
                'type' => 'error',
                'message' => 'Company information not found'
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
?>