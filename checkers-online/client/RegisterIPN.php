<?php
include 'accesstoken.php'; // This should define $token

// Define environment
$ipn_ENVIRONMENT = 'live'; // or 'sandbox'

// Set your public IPN URL
$ipn_url = "https://c3b5d5ca6fdd.ngrok-free.app/x/Checker-main/checkers-online/client/callback.php";


// Set the registration URL based on environment
if ($ipn_ENVIRONMENT == "sandbox") {
    $ipnRegistrationUrl = "https://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN";
} elseif ($ipn_ENVIRONMENT == "live") {
    $ipnRegistrationUrl = "https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN";
} else {
    exit("Invalid APP_ENVIRONMENT");
}

// Make sure token exists
if (!isset($token)) {
    exit("Error: Token not set from accesstoken.php");
}

// Prepare headers
$headers = array(
    "Accept: application/json",
    "Content-Type: application/json",
    "Authorization: Bearer $token"
);

// Data to send
$data = array(
    "url" => $ipn_url,
    "ipn_notification_type" => "POST"
);

// Send request
$ch = curl_init($ipnRegistrationUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$responseCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Handle the response
if ($responseCode != 200) {
    exit("Error: IPN registration failed with status code $responseCode\nResponse: $response");
}

$data = json_decode($response);

if (isset($data->ipn_id)) {
    $pin_id = $data->ipn_id;
    echo "IPN Registered successfully. IPN ID: $pin_id";
} else {
    exit("IPN registration failed. Response: $response");
}
?>
