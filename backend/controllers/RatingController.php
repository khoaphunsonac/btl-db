<?php
require_once __DIR__ . '/../models/Rating.php';

class RatingController {
    private $ratingModel;
    
    public function __construct($db) {
        $this->ratingModel = new Rating($db);
    }
    
    /**
     * GET /api/ratings
     * Lấy danh sách tất cả đánh giá (cho admin)
     */
    public function index() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        
        // Properly filter empty parameters
        $filters = [];
        
        if (!empty($_GET['star'])) {
            $filters['star'] = $_GET['star'];
        }
        
        if (!empty($_GET['customer_id'])) {
            $filters['customer_id'] = $_GET['customer_id'];
        }
        
        if (!empty($_GET['product_id'])) {
            $filters['product_id'] = $_GET['product_id'];
        }
        
        if (!empty($_GET['search'])) {
            $filters['search'] = $_GET['search'];
        }
        
        $result = $this->ratingModel->getAll($page, $limit, $filters);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination']
        ]);
    }
    
    /**
     * GET /api/ratings/stats
     * Lấy thống kê đánh giá
     */
    public function stats() {
        $stats = $this->ratingModel->getStats();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    /**
     * GET /api/products/{productId}/ratings
     * Lấy danh sách đánh giá của sản phẩm
     */
    public function getProductRatings($productId) {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        
        $ratings = $this->ratingModel->getByProduct($productId, $limit, $offset);
        $average = $this->ratingModel->getAverageRating($productId);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $ratings,
            'summary' => $average
        ]);
    }
    
    /**
     * GET /api/ratings/{id}
     * Lấy chi tiết đánh giá
     */
    public function show($id) {
        $rating = $this->ratingModel->getById($id);
        
        if (!$rating) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Đánh giá không tồn tại']);
            return;
        }
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $rating]);
    }
    
    /**
     * POST /api/ratings
     * Tạo đánh giá mới (cho admin)
     */
    public function store() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate
        $errors = $this->validateRating($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }
        
        // Admin có thể tạo đánh giá mà không cần kiểm tra điều kiện mua hàng
        $isAdmin = $data['is_admin'] ?? false;
        
        if (!$isAdmin) {
            // Kiểm tra khách hàng đã mua sản phẩm chưa
            if (!$this->ratingModel->hasPurchased($data['customer_id'], $data['product_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Bạn chỉ có thể đánh giá sản phẩm đã mua thành công'
                ]);
                return;
            }
            
            // Kiểm tra đã đánh giá chưa
            if ($this->ratingModel->hasRated($data['customer_id'], $data['product_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Bạn đã đánh giá sản phẩm này rồi'
                ]);
                return;
            }
        }
        
        $result = $this->ratingModel->create($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Tạo đánh giá thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Tạo đánh giá thất bại']);
        }
    }

    /**
     * POST /api/products/{productId}/ratings
     * Tạo đánh giá mới cho sản phẩm (từ khách hàng)
     */
    public function storeForProduct($productId) {
        $data = json_decode(file_get_contents("php://input"), true);
        $data['product_id'] = $productId;
        
        // Validate
        $errors = $this->validateRating($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }
        
        // Kiểm tra khách hàng đã mua sản phẩm chưa
        if (!$this->ratingModel->hasPurchased($data['customer_id'], $productId)) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Bạn chỉ có thể đánh giá sản phẩm đã mua thành công'
            ]);
            return;
        }
        
        // Kiểm tra đã đánh giá chưa
        if ($this->ratingModel->hasRated($data['customer_id'], $productId)) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Bạn đã đánh giá sản phẩm này rồi'
            ]);
            return;
        }
        
        $result = $this->ratingModel->create($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Đánh giá thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Đánh giá thất bại']);
        }
    }
    
    /**
     * PUT /api/ratings/{id}
     * Cập nhật đánh giá (chỉ chủ đánh giá)
     */
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $rating = $this->ratingModel->getById($id);
        if (!$rating) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Đánh giá không tồn tại']);
            return;
        }
        
        // Kiểm tra quyền sở hữu
        if ($rating['customer_id'] != $data['customer_id']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Bạn không có quyền cập nhật đánh giá này']);
            return;
        }
        
        $result = $this->ratingModel->update($id, $data);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Cập nhật đánh giá thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật đánh giá thất bại']);
        }
    }
    
    /**
     * DELETE /api/ratings/{id}
     * Xóa đánh giá (chủ đánh giá hoặc admin)
     */
    public function delete($id) {
        $customerId = $_GET['customer_id'] ?? null;
        $isAdmin = $_GET['is_admin'] ?? false;
        
        $rating = $this->ratingModel->getById($id);
        if (!$rating) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Đánh giá không tồn tại']);
            return;
        }
        
        // Kiểm tra quyền
        if (!$isAdmin && $rating['customer_id'] != $customerId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Bạn không có quyền xóa đánh giá này']);
            return;
        }
        
        $result = $this->ratingModel->delete($id);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Xóa đánh giá thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Xóa đánh giá thất bại']);
        }
    }
    
    /**
     * GET /api/customers/{customerId}/ratings
     * Lấy danh sách đánh giá của khách hàng
     */
    public function getCustomerRatings($customerId) {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        
        $result = $this->ratingModel->getByCustomer($customerId, $limit, $offset);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result
        ]);
    }
    
    /**
     * GET /api/ratings/customers
     * Lấy danh sách khách hàng cho dropdown
     */
    public function getCustomers() {
        try {
            $customers = $this->ratingModel->getCustomers();
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $customers]);
        } catch (Exception $e) {
            error_log("Error getting customers: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Không thể tải danh sách khách hàng: ' . $e->getMessage()]);
        }
    }
    
    /**
     * GET /api/ratings/products
     * Lấy danh sách sản phẩm cho dropdown
     */
    public function getProducts() {
        try {
            $products = $this->ratingModel->getProducts();
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $products]);
        } catch (Exception $e) {
            error_log("Error getting products: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Không thể tải danh sách sản phẩm: ' . $e->getMessage()]);
        }
    }
    private function validateRating($data) {
        $errors = [];
        
        if (empty($data['customer_id'])) {
            $errors['customer_id'] = 'Khách hàng không được để trống';
        }
        
        if (empty($data['star']) || $data['star'] < 1 || $data['star'] > 5) {
            $errors['star'] = 'Số sao phải từ 1 đến 5';
        }
        
        if (empty($data['comment_content'])) {
            $errors['comment_content'] = 'Nội dung đánh giá không được để trống';
        }
        
        return $errors;
    }
}
?>
