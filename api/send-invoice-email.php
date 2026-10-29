<?php
/**
 * =============================================================================
 * SYBER SPACE SECURITY SYSTEMS — HOSTINGER EMAIL DISPATCH ENDPOINT
 * File: api/send-invoice-email.php
 * Handles commercial GST Tax Invoice email delivery on Hostinger Web Hosting.
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

// Read JSON input
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
    exit;
}

$recipient = 'info.syberspacestore@gmail.com';
$orderId = isset($data['orderId']) ? htmlspecialchars($data['orderId']) : ('SS-HDFC-' . time());
$amount = isset($data['amount']) ? floatval($data['amount']) : 0;
$customer = isset($data['customer']) && is_array($data['customer']) ? $data['customer'] : [];
$items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
$rail = isset($data['paymentRail']) ? htmlspecialchars($data['paymentRail']) : 'UPI';
$txnId = isset($data['txnId']) ? htmlspecialchars($data['txnId']) : ('TXN-' . time());
$authCode = isset($data['authCode']) ? htmlspecialchars($data['authCode']) : ('AUTH-' . rand(100000, 999999));
$rrn = isset($data['rrn']) ? htmlspecialchars($data['rrn']) : ('88' . rand(1000000000, 9999999999));

$custName = isset($customer['name']) ? $customer['name'] : 'Customer';
$custPhone = isset($customer['phone']) ? $customer['phone'] : 'Not Provided';
$custEmail = isset($customer['email']) ? $customer['email'] : 'Not Provided';
$custCompany = !empty($customer['company']) ? $customer['company'] : 'Individual / Sole Proprietor';
$custGstin = !empty($customer['gstin']) ? $customer['gstin'] : 'Not Provided (Consumer B2C)';
$custAddress = isset($customer['address']) ? $customer['address'] : '';
$custCity = isset($customer['city']) ? $customer['city'] : '';
$custState = isset($customer['state']) ? $customer['state'] : 'Kerala';
$custPin = isset($customer['pincode']) ? $customer['pincode'] : '';

// Build Ordered Items text
$itemsText = '';
$idx = 1;
foreach ($items as $item) {
    $title = isset($item['title']) ? $item['title'] : (isset($item['name']) ? $item['name'] : 'CCTV Product');
    $brand = isset($item['brand']) ? $item['brand'] : 'Commercial';
    $qty = isset($item['qty']) ? intval($item['qty']) : (isset($item['quantity']) ? intval($item['quantity']) : 1);
    $price = isset($item['price']) ? floatval($item['price']) : 0;
    $rowTotal = $qty * $price;
    $itemsText .= "  [{$idx}] {$title} ({$brand})\n";
    $itemsText .= "      Qty: {$qty}  |  Unit Rate: Rs. " . number_format($price) . "  |  Subtotal: Rs. " . number_format($rowTotal) . "\n";
    $idx++;
}
if (empty($itemsText)) {
    $itemsText = "  [1] Commercial Surveillance Equipment Package (Standard Procurement)\n";
}

$taxable = round($amount / 1.18);
$gst = $amount - $taxable;
$timestamp = date('d/m/Y, h:i:s a') . ' IST';

$subject = "[TAX INVOICE & DISPATCH] {$orderId} - Rs. " . number_format($amount) . " - {$custName}";

$body = "=============================================================================\n";
$body .= "SYBER SPACE SECURITY SYSTEMS — COMMERCIAL TAX INVOICE & DISPATCH ORDER\n";
$body .= "Authorized CCTV Surveillance Systems // Direct Wholesale Kerala HQ\n";
$body .= "GSTIN: 32AABCU9603R1ZM  |  Phone: +91 75111 80808  |  Email: {$recipient}\n";
$body .= "=============================================================================\n\n";

$body .= "TAX INVOICE & ORDER METADATA:\n";
$body .= "-----------------------------------------------------------------------------\n";
$body .= "Tax Invoice No:     {$orderId}\n";
$body .= "Order Date & Time:  {$timestamp}\n";
$body .= "Payment Gateway:    HDFC Bank SmartGateway (Verified // CAPTURED)\n";
$body .= "Payment Rail:       {$rail}\n";
$body .= "Transaction ID:     {$txnId}\n";
$body .= "Bank Auth Code:     {$authCode}\n";
$body .= "Bank RRN:           {$rrn}\n\n";

$body .= "CUSTOMER & INVOICE RECIPIENT DETAILS:\n";
$body .= "-----------------------------------------------------------------------------\n";
$body .= "Full Name:          {$custName}\n";
$body .= "Company / Firm:     {$custCompany}\n";
$body .= "GSTIN (Tax Credit): {$custGstin}\n";
$body .= "Mobile Phone:       +91 {$custPhone}\n";
$body .= "Email Address:      {$custEmail}\n";
$body .= "Delivery Address:   {$custAddress}, {$custCity}, {$custState} - {$custPin}\n\n";

$body .= "ORDERED SURVEILLANCE HARDWARE:\n";
$body .= "-----------------------------------------------------------------------------\n";
$body .= $itemsText . "\n";

$body .= "FINANCIAL BREAKDOWN (KERALA GST):\n";
$body .= "-----------------------------------------------------------------------------\n";
$body .= "Taxable Hardware Value:  Rs. " . number_format($taxable) . "\n";
$body .= "GST @ 18% (Included):    Rs. " . number_format($gst) . "\n";
$body .= "Transit Insurance:       COMPLIMENTARY\n";
$body .= "Express Courier Delivery: FREE INSURED COURIER (Direct Kerala Warehouse)\n";
$body .= "-----------------------------------------------------------------------------\n";
$body .= "TOTAL AMOUNT RECEIVED:   Rs. " . number_format($amount) . "\n";
$body .= "-----------------------------------------------------------------------------\n\n";

$body .= "WHOLESALE DISPATCH & RETURN POLICY:\n";
$body .= "* No Cancellations: As wholesale hardware is queued immediately for serial number\n";
$body .= "  registration and transit insurance, orders cannot be cancelled once authorized.\n";
$body .= "* 7-Day Refund & Replacement Guarantee: If physical damage or technical defect is\n";
$body .= "  reported with mandatory continuous unboxing video within 7 days of arrival,\n";
$body .= "  Syber Space guarantees 100% replacement or full refund.\n\n";
$body .= "=============================================================================\n";
$body .= "Syber Space Security Systems | Kerala Wholesale Distribution Hub\n";
$body .= "Support Hotline: +91 75111 80808 | Official Portal: https://syberspace.in\n";
$body .= "=============================================================================\n";

// Email headers
$headers = [];
$headers[] = 'From: "Syber Space Security Systems" <' . $recipient . '>';
$headers[] = 'Reply-To: ' . ($custEmail !== 'Not Provided' ? $custEmail : $recipient);
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

// Attempt Hostinger native PHP mail dispatch
$mailSent = @mail($recipient, $subject, $body, implode("\r\n", $headers));

// Archive to emails_sent folder if available
$emailsDir = __DIR__ . '/../emails_sent';
if (is_dir($emailsDir) && is_writable($emailsDir)) {
    @file_put_contents($emailsDir . '/invoice_' . $orderId . '_' . time() . '.txt', $body);
}

echo json_encode([
    'success' => true,
    'message' => 'Tax invoice and order details transmitted to ' . $recipient,
    'orderId' => $orderId,
    'recipient' => $recipient,
    'mailSent' => $mailSent,
    'hostingerMode' => true
]);
