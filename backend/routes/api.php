<?php
/**
 * API Routes for NEMTHUNG E-commerce System
 * 
 * Định nghĩa tất cả các route cho API Backend
 */

// Include controllers
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/ProductController.php';
require_once __DIR__ . '/../controllers/CategoryController.php';
require_once __DIR__ . '/../controllers/OrderController.php';
require_once __DIR__ . '/../controllers/DiscountController.php';
require_once __DIR__ . '/../controllers/RatingController.php';
require_once __DIR__ . '/../controllers/ContactController.php';
require_once __DIR__ . '/../controllers/StatisticsController.php';

function handleRoute($db) {
    // Get PDO connection from Database instance
    $pdo = $db->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = str_replace('/btl-db/backend/', '', $path);
    $segments = explode('/', trim($path, '/'));
    
    // Note: CORS headers already set in index.php
    // Don't set duplicate headers here
    
    if ($method === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
    
    // Route matching
    if ($segments[0] === 'api') {
        $resource = $segments[1] ?? '';
        $id = $segments[2] ?? null;
        $action = $segments[3] ?? null;
        
        try {
            switch ($resource) {
                // ============ AUTH ROUTES ============
                case 'auth':
                    $controller = new AuthController($pdo);
                    switch ($id) {
                        case 'register':
                            $controller->register();
                            break;
                        case 'login':
                            $controller->login();
                            break;
                        case 'logout':
                            $controller->logout();
                            break;
                        case 'me':
                            $controller->me();
                            break;
                        default:
                            http_response_code(404);
                            echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;
                
                // ============ USER ROUTES ============
                case 'users':
                    $controller = new UserController($pdo);
                    if ($method === 'GET' && $id === 'statistics') {
                        $controller->statistics();
                    } elseif ($method === 'GET' && !$id) {
                        $controller->index();
                    } elseif ($method === 'GET' && $id) {
                        $controller->show($id);
                    } elseif ($method === 'POST' && !$id) {
                        $controller->store();
                    } elseif ($method === 'PUT' && $id && !$action) {
                        $controller->update($id);
                    } elseif ($method === 'PUT' && $id && $action === 'status') {
                        $controller->updateStatus($id);
                    } elseif ($method === 'DELETE' && $id) {
                        $controller->delete($id);
                    } else {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;
                
                // ============ PRODUCT ROUTES ============
                case 'products':
                    $controller = new ProductController($pdo);
                    if ($method === 'GET' && !$id) {
                        $controller->index();
                    } elseif ($method === 'GET' && $id && !$action) {
                        $controller->show($id);
                    } elseif ($method === 'GET' && $id && $action === 'variants') {
                        $controller->getVariants($id);
                    } elseif ($method === 'POST' && $id && $action === 'variants') {
                        $controller->addVariant($id);
                    } elseif ($method === 'GET' && $id && $action === 'images') {
                        $controller->getImages($id);
                    } elseif ($method === 'POST' && $id && $action === 'images') {
                        $controller->uploadImage($id);
                    } elseif ($method === 'GET' && $id && $action === 'ratings') {
                        $ratingController = new RatingController($pdo);
                        $ratingController->getProductRatings($id);
                    } elseif ($method === 'POST' && $id && $action === 'ratings') {
                        $ratingController = new RatingController($pdo);
                        $ratingController->store($id);
                    } elseif ($method === 'POST' && !$id) {
                        $controller->store();
                    } elseif ($method === 'PUT' && $id) {
                        $controller->update($id);
                    } elseif ($method === 'DELETE' && $id) {
                        $controller->delete($id);
                    } else {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;
                
                // ============ CATEGORY ROUTES ============
                case 'categories':
                    $controller = new CategoryController($pdo);
                    if ($method === 'GET' && !$id) {
                        $controller->index();
                    } elseif ($method === 'GET' && $id && !$action) {
                        $controller->show($id);
                    } elseif ($method === 'GET' && $id && $action === 'children') {
                        $controller->getChildren($id);
                    } elseif ($method === 'GET' && $id === 'leaf') {
                        $controller->getLeafCategories();
                    } elseif ($method === 'POST' && !$id) {
                        $controller->store();
                    } elseif ($method === 'PUT' && $id) {
                        $controller->update($id);
                    } elseif ($method === 'DELETE' && $id) {
                        $controller->delete($id);
                    } else {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;
                
                // ============ ORDER ROUTES ============
                case 'orders':
                    $controller = new OrderController($pdo);
                    if ($method === 'GET' && !$id) {
                        $controller->index();
                    } elseif ($method === 'GET' && $id && !$action) {
                        $controller->show($id);
                    } elseif ($method === 'GET' && $id && $action === 'logs') {
                        $controller->getLogs($id);
                    } elseif ($method === 'POST' && !$id) {
                        $controller->store();
                    } elseif ($method === 'PUT' && $id && $action === 'status') {
                        $controller->updateStatus($id);
                    } elseif ($method === 'PUT' && $id && !$action) {
                        $controller->update($id);
                    } elseif ($method === 'DELETE' && $id) {
                        $controller->cancel($id);
                    } else {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;
                
                // ============ DISCOUNT ROUTES ============
                case 'discounts':
                    $controller = new DiscountController($pdo);

                    // GET /api/discounts
                    if ($method === 'GET' && !$id) {
                        $controller->index();
                    }

                    // GET /api/discounts/{id}
                    elseif ($method === 'GET' && $id) {
                        $controller->show($id);
                    }

                    // POST /api/discounts
                    elseif ($method === 'POST' && !$id) {
                        $controller->store();
                    }

                    // PUT /api/discounts/{id}
                    elseif ($method === 'PUT' && $id) {
                        $controller->update($id);
                    }

                    // DELETE /api/discounts/{id}
                    elseif ($method === 'DELETE' && $id) {
                        $controller->delete($id);
                    }

                    else {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;


                
                // ============ RATING ROUTES ============
                case 'ratings':
                    $controller = new RatingController($pdo);
                    if ($method === 'GET' && $id) {
                        $controller->show($id);
                    } elseif ($method === 'PUT' && $id) {
                        $controller->update($id);
                    } elseif ($method === 'DELETE' && $id) {
                        $controller->delete($id);
                    } else {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;
                
                // ============ CONTACT ROUTES ============
                case 'contacts':
                    $controller = new ContactController($pdo);
                    if ($method === 'GET' && !$id) {
                        $controller->index();
                    } elseif ($method === 'GET' && $id) {
                        $controller->show($id);
                    } elseif ($method === 'POST' && !$id) {
                        $controller->store();
                    } elseif ($method === 'PUT' && $id && $action === 'status') {
                        $controller->updateStatus($id);
                    } elseif ($method === 'DELETE' && $id) {
                        $controller->delete($id);
                    } else {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;
                
                // ============ STATISTICS ROUTES ============
                case 'statistics':
                    $controller = new StatisticsController($pdo);
                    switch ($id) {
                        case 'dashboard':
                            $controller->dashboard();
                            break;
                        case 'revenue':
                            $controller->revenue();
                            break;
                        case 'products':
                            $controller->products();
                            break;
                        case 'categories':
                            $controller->categories();
                            break;
                        default:
                            http_response_code(404);
                            echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;
                
                default:
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Resource not found']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invalid endpoint']);
    }
}
