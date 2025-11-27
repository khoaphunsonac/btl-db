<?php
require_once __DIR__ . '/../models/Rating.php';

class RatingController {
    private $ratingModel;
    
    public function __construct($db) {
        $this->ratingModel = new Rating($db);
    }
    
    /**
     * GET /api/products/{productId}/ratings
     * Lấy danh sách đánh giá của sản phẩm
     */
    public function getProductRatings($productId) {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $rating = $_GET['rating'] ?? null; // Filter theo số sao
        
        $result = $this->ratingModel->getByProduct($productId, $page, $limit, $rating);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination'],
            'summary' => $result['summary'] // Thống kê tổng quan (trung bình sao, số lượng theo từng mức sao)
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
     * POST /api/products/{productId}/ratings
     * Tạo đánh giá mới cho sản phẩm
     */
    public function store($productId) {
        $data = json_decode(file_get_contents("php://input"), true);
        $data['product_id'] = $productId;
        
        // Validate
        $errors = $this->validateRating($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }
        
        // Ràng buộc thứ 9: Kiểm tra khách hàng đã mua sản phẩm chưa
        if (!$this->ratingModel->hasUserPurchasedProduct($data['user_id'], $productId)) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Bạn chỉ có thể đánh giá sản phẩm đã mua thành công'
            ]);
            return;
        }
        
        // Kiểm tra user đã đánh giá sản phẩm này chưa
        if ($this->ratingModel->hasUserRatedProduct($data['user_id'], $productId)) {
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
        if ($rating['user_id'] != $data['user_id']) {
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
        $userId = $_GET['user_id'] ?? null;
        $isAdmin = $_GET['is_admin'] ?? false;
        
        $rating = $this->ratingModel->getById($id);
        if (!$rating) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Đánh giá không tồn tại']);
            return;
        }
        
        // Kiểm tra quyền
        if (!$isAdmin && $rating['user_id'] != $userId) {
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
     * GET /api/users/{userId}/ratings
     * Lấy danh sách đánh giá của người dùng
     */
    public function getUserRatings($userId) {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        
        $result = $this->ratingModel->getByUser($userId, $page, $limit);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination']
        ]);
    }
    
    /**
     * Validate dữ liệu đánh giá
     */
    private function validateRating($data) {
        $errors = [];
        
        if (empty($data['user_id'])) {
            $errors['user_id'] = 'Người dùng không được để trống';
        }
        
        if (empty($data['rating']) || $data['rating'] < 1 || $data['rating'] > 5) {
            $errors['rating'] = 'Số sao phải từ 1 đến 5';
        }
        
        if (empty($data['comment'])) {
            $errors['comment'] = 'Nội dung đánh giá không được để trống';
        }
        
        return $errors;
    }
}
