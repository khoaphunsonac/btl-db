<?php

// Disable error display, but log them
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');
error_reporting(E_ALL);

// Set JSON header FIRST before any output
header("Content-Type: application/json; charset=UTF-8");

// Custom error handler to return JSON
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    
    error_log("PHP Error: $message in $file on line $line");
    
    if (!headers_sent()) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Server Error',
            'message' => 'An internal error occurred. Check server logs.'
        ]);
        exit;
    }
    return true;
});

// Custom exception handler
set_exception_handler(function($exception) {
    error_log("PHP Exception: " . $exception->getMessage());
    
    if (!headers_sent()) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Server Exception',
            'message' => $exception->getMessage()
        ]);
        exit;
    }
});

// CORS configuration
$allowedOrigins = [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://localhost:8080',
    'http://127.0.0.1',
    'http://127.0.0.1:5500'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Upload limits
ini_set('upload_max_filesize', '20M');
ini_set('post_max_size', '25M');
ini_set('max_execution_time', '300');

// Load database configuration
require_once __DIR__ . '/config/database.php';
$db = Database::getInstance();

// Load API routes
require_once __DIR__ . '/routes/api.php';

// Handle routing
handleRoute($db);
