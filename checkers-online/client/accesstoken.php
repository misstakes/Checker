<?php
define('APP_ENVIRONMENT', 'live'); // sandbox or live

if(APP_ENVIRONMENT == 'sandbox') {
    $apiUrl = "https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken"; // Sandbox URL
    $consumerKey = "qk1o1BGYAxt2o0fm7XSXnr0uzgEW";
    $consumerSecret = "o5Q36aR49xR0v9p0n1++rHs=";
} else if(APP_ENVIRONMENT == 'live') {
    $apiUrl = "https://pay.pesapal.com/v3/api/Auth/RequestToken"; // Live URL
    $consumerKey = "UYVetzaJafhuzSOAppC/vJEa8zbxOhxZ";
    $consumerSecret = "d+Cbt6sIRT3RGKgGggyWRQkSJB0=";
} else {
    exit("Invalid APP_ENVIRONMENT");
}

// Set headers
$headers = [
    "accept: application/json",
    "content-type: application/json"
];

// Data to send
$data = [
    "consumer_key" => $consumerKey,
    "consumer_secret" => $consumerSecret
];

// Initialize cURL
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Execute request
$response = curl_exec($ch);

// Check for curl errors
if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    curl_close($ch);
    exit("cURL Error: $error_msg");
}

// Check HTTP status code
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    exit("HTTP Error: $httpCode\nResponse: $response");
}

// Decode JSON safely
$data = json_decode($response);

if (isset($data->token)) {
    $token = $data->token;
    echo "Token: $token";
} else {
    exit("Error: Token not found in response\nResponse: $response");
}
?>
