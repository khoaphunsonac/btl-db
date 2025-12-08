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
require_once __DIR__ . '/../controllers/CartController.php';

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
                    
                    if ($method === 'GET') {
                        // KIỂM TRA ROUTE TÌM KIẾM: /api/products/search?q=...
                        // Giả định $segments[1] là 'products' và $segments[2] là 'search'
                        if (isset($segments[2]) && $segments[2] === 'search') { 
                            $controller->search(); 
                            break;
                        }
                        
                        // Logic cũ (index/show)
                        if ($id) {
                            $controller->show($id);
                        } else {
                            $controller->index();
                        }
                    }
                    
                    
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
                


                case 'carts': // Endpoint: /api/carts
                    $controller = new CartController($pdo);
                    switch ($method) {
                        case 'GET':
                            if ($id) {
                                // GET /api/carts/{order_id} (Chi tiết giỏ hàng/đơn hàng đang chờ xử lý)
                                $controller->get($id); 
                            } else {
                                // GET /api/carts (Danh sách các giỏ hàng/đơn hàng đang chờ xử lý)
                                $controller->index(); 
                            }
                            break;
                        default:
                            http_response_code(405);
                            echo json_encode(['success' => false, 'message' => 'Method not allowed for Carts']);
                            break;
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
                    
                    // GET /api/ratings/stats
                    if ($method === 'GET' && $id === 'stats') {
                        $controller->stats();
                    }
                    // GET /api/ratings/customers
                    elseif ($method === 'GET' && $id === 'customers') {
                        $controller->getCustomers();
                    }
                    // GET /api/ratings/products
                    elseif ($method === 'GET' && $id === 'products') {
                        $controller->getProducts();
                    }
                    // GET /api/ratings
                    elseif ($method === 'GET' && !$id) {
                        $controller->index();
                    }
                    // POST /api/ratings
                    elseif ($method === 'POST' && !$id) {
                        $controller->store();
                    }
                    // GET /api/ratings/{id}
                    elseif ($method === 'GET' && $id) {
                        $controller->show($id);
                    }
                    // PUT /api/ratings/{id}
                    elseif ($method === 'PUT' && $id) {
                        $controller->update($id);
                    }
                    // DELETE /api/ratings/{id}
                    elseif ($method === 'DELETE' && $id) {
                        $controller->delete($id);
                    }
                    // POST /api/ratings/{id}/images - Upload images for rating
                    elseif ($method === 'POST' && $id && $action === 'images') {
                        $controller->uploadImages($id);
                    }
                    // DELETE /api/ratings/{id}/images/{imageId} - Delete specific image
                    elseif ($method === 'DELETE' && $id && $action === 'images' && isset($segments[4])) {
                        $controller->deleteImage($id, $segments[4]);
                    }
                    else {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                    }
                    break;
                
                // ============ CONTACT ROUTES ============
                case 'contacts':
                    $controller = new ContactController($pdo);
                    if ($method === 'GET' && $id === 'stats') {
                        $controller->stats();
                    } elseif ($method === 'GET' && !$id) {
                        $controller->index();
                    } elseif ($method === 'GET' && $id && $id !== 'stats') {
                        $controller->show($id);
                    } elseif ($method === 'POST' && !$id) {
                        $controller->store();
                    } elseif ($method === 'PUT' && $id && $action === 'status') {
                        $controller->updateStatus($id);
                    } elseif ($method === 'PUT' && $id && !$action) {
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
