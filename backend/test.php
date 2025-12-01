<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'success' => true,
    'message' => 'Backend is working!',
    'server_info' => [
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? '',
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? '',
        'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? '',
        'PHP_SELF' => $_SERVER['PHP_SELF'] ?? ''
    ]
]);
