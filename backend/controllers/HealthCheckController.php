<?php

/**
 * Health Check Controller
 * Simple endpoint to verify API is running
 */
class HealthCheckController {
    public function handleRequest($request) {
        if ($request === "/" && $_SERVER["REQUEST_METHOD"] === "GET") {
            echo json_encode([
                "success" => true,
                "message" => "BTL-DB API is running",
                "timestamp" => date('Y-m-d H:i:s')
            ]);
            exit;
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Not found"]);
            exit;
        }
    }
}
