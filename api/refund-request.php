<?php
/**
 * =============================================================================
 * SYBER SPACE SECURITY SYSTEMS — HOSTINGER REFUND/EXCHANGE REQUEST ENDPOINT
 * File: api/refund-request.php
 * Handles refund and hardware exchange notifications on Hostinger Web Hosting.
 * =============================================================================
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
    exit;
}

$recipient = 'info.syberspacestore@gmail.com';
$orderId = isset($data['orderId']) ? htmlspecialchars($data['orderId']) : 'UNKNOWN';
$requestType = isset($data['requestType']) ? htmlspecialchars($data['requestType']) : 'REFUND';
$reason = isset($data['reason']) ? htmlspecialchars($data['reason']) : 'Not Provided';
$notes = isset($data['notes']) ? htmlspecialchars($data['notes']) : 'No additional notes';
$hasVideo = !empty($data['unboxingVideoUploaded']) ? 'YES (Declared)' : 'Pending Verification';
$refundRef = 'REF-' . rand(100000, 999999);
$timestamp = date('d/m/Y, h:i:s a') . ' IST';

$subject = "[URGENT: {$requestType} REQUEST] Order #{$orderId} (Ref: {$refundRef})";

$body = "=============================================================================\n";
$body .= "SYBER SPACE SECURITY SYSTEMS — CUSTOMER {$requestType} DOCKET\n";
$body .= "Timestamp: {$timestamp}\n";
$body .= "=============================================================================\n\n";

$body .= "Reference ID:     {$refundRef}\n";
$body .= "Order ID:         #{$orderId}\n";
$body .= "Request Type:     {$requestType}\n";
$body .= "Stated Reason:    {$reason}\n";
$body .= "Unboxing Video:   {$hasVideo}\n\n";
$body .= "Customer Remarks:\n";
$body .= "{$notes}\n\n";

$body .= "=============================================================================\n";
$body .= "Action Required: Contact customer via phone/WhatsApp within 24-48 hours.\n";
$body .= "=============================================================================\n";

$headers = [];
$headers[] = 'From: "Syber Space Support Desk" <' . $recipient . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$mailSent = @mail($recipient, $subject, $body, implode("\r\n", $headers));

$emailsDir = __DIR__ . '/../emails_sent';
if (is_dir($emailsDir) && is_writable($emailsDir)) {
    @file_put_contents($emailsDir . '/refund_' . $refundRef . '_' . $orderId . '.txt', $body);
}

echo json_encode([
    'success' => true,
    'message' => 'Refund request logged and transmitted to support desk',
    'refundRef' => $refundRef,
    'orderId' => $orderId,
    'mailSent' => $mailSent
]);
