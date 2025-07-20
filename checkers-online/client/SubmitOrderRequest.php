<?php
// Fetch POST data with basic validation
$phone = $_POST['phone'] ?? '';
$amount = $_POST['amount'] ?? 0;
$redirectAfterPayment = $_POST['redirect'] ?? '';

// Include token and IPN logic (must define $token and $ipn_id)
include 'RegisterIPN.php';

// Validate required fields
if (empty($phone) || empty($amount) || !is_numeric($amount) || $amount <= 0) {
    die("Invalid phone number or amount.");
}

// Create a unique merchant reference
$merchant_reference = uniqid('order_');

// Payment meta
$currency = "KES";
$description = "Payment for game entry";

// Ensure callback URL is a full URL
if (!empty($redirectAfterPayment) && filter_var($redirectAfterPayment, FILTER_VALIDATE_URL)) {
    $callbackurl = $redirectAfterPayment;
} else {
    // Fallback to your actual domain and path here
    $callbackurl = 'https://checker-3lvc.onrender.com/lobby.html/lobby.html';
}

// Billing details - you can customize these or fetch dynamically
$first_name = "Alvin";
$middle_name = "Odari";
$last_name = "Kiveu";
$email_address = "mwanginewto12@gmail.com";
$branch = "PlayersKe";

// SubmitOrderRequest endpoint
$submitOrderUrl = "https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest";

// Authorization headers
$headers = [
    "Accept: application/json",
    "Content-Type: application/json",
    "Authorization: Bearer $token"
];

// Prepare data payload
$data = [
    "id" => $merchant_reference,
    "currency" => $currency,
    "amount" => (float)$amount,
    "description" => $description,
    "callback_url" => $callbackurl,
    "notification_id" => $pin_id,  // corrected variable name
    "branch" => $branch,
    "billing_address" => [
        "email_address" => $email_address,
        "phone_number" => $phone,
        "country_code" => "KE",
        "first_name" => $first_name,
        "middle_name" => $middle_name,
        "last_name" => $last_name,
        "line_1" => "Pesapal Ltd",
        "line_2" => "",
        "city" => "Nairobi",
        "state" => "",
        "postal_code" => ""
    ]
];

// Initialize cURL
$ch = curl_init($submitOrderUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Decode JSON response
$result = json_decode($response);

if ($httpCode === 200 && isset($result->redirect_url)) {
    // Redirect user to payment URL
    header("Location: " . $result->redirect_url);
    exit;
} else {
    // Show error details
    echo "<h3>Payment initiation failed.</h3>";
    echo "<strong>HTTP Status:</strong> $httpCode<br>";
    echo "<strong>Response:</strong><br><pre>" . htmlspecialchars($response) . "</pre>";
    exit;
}
?>
