<?php

require_once __DIR__ . '/../services/ItemService.php';

/**
 * Item Controller
 * Handles HTTP requests for Item resources
 */
class ItemController {
    private $itemService;
    
    public function __construct($pdo) {
        $this->itemService = new ItemService($pdo);
    }
    
    public function handleRequest($request) {
        $method = $_SERVER['REQUEST_METHOD'];
        
        // GET /items - Get all items
        if ($request === '/items' && $method === 'GET') {
            $this->getItems();
            return;
        }
        
        // GET /items/{id} - Get item by ID
        if (preg_match('#^/items/(\d+)$#', $request, $matches) && $method === 'GET') {
            $itemId = (int)$matches[1];
            $this->getItem($itemId);
            return;
        }
        
        // POST /items - Create new item
        if ($request === '/items' && $method === 'POST') {
            $this->createItem();
            return;
        }
        
        // PUT /items/{id} - Update item
        if (preg_match('#^/items/(\d+)$#', $request, $matches) && $method === 'PUT') {
            $itemId = (int)$matches[1];
            $this->updateItem($itemId);
            return;
        }
        
        // DELETE /items/{id} - Delete item
        if (preg_match('#^/items/(\d+)$#', $request, $matches) && $method === 'DELETE') {
            $itemId = (int)$matches[1];
            $this->deleteItem($itemId);
            return;
        }
        
        // Not found
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
    }
    
    /**
     * Get all items with pagination
     */
    private function getItems() {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        
        $result = $this->itemService->getAllItems($page, $limit);
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }
        
        echo json_encode($result);
    }
    
    /**
     * Get single item by ID
     */
    private function getItem($id) {
        $result = $this->itemService->getItemById($id);
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(404);
        }
        
        echo json_encode($result);
    }
    
    /**
     * Create new item
     */
    private function createItem() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid JSON data'
            ]);
            return;
        }
        
        $result = $this->itemService->createItem($data);
        
        if ($result['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }
        
        echo json_encode($result);
    }
    
    /**
     * Update item
     */
    private function updateItem($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid JSON data'
            ]);
            return;
        }
        
        $result = $this->itemService->updateItem($id, $data);
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }
        
        echo json_encode($result);
    }
    
    /**
     * Delete item
     */
    private function deleteItem($id) {
        $result = $this->itemService->deleteItem($id);
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }
        
        echo json_encode($result);
    }
}
