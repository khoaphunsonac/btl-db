<?php
require_once __DIR__ . '/../models/Discount.php';

class DiscountController {
    private $discountModel;
    
    public function __construct($db) {
        $this->discountModel = new Discount($db);
    }
    
    /**
     * GET /api/discounts
     * Lấy danh sách mã giảm giá
     */
    public function index() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $status = $_GET['status'] ?? null; // active, expired, all
        
        $result = $this->discountModel->getAll($page, $limit, $status);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination']
        ]);
    }
    
    /**
     * GET /api/discounts/{id}
     * Lấy chi tiết mã giảm giá
     */
    public function show($id) {
        $discount = $this->discountModel->getById($id);
        
        if (!$discount) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Mã giảm giá không tồn tại']);
            return;
        }
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $discount]);
    }
    
    /**
     * POST /api/discounts/validate
     * Kiểm tra mã giảm giá có hợp lệ không
     */
    public function validate() {
        $data = json_decode(file_get_contents("php://input"), true);
        $code = $data['code'] ?? null;
        $orderAmount = $data['order_amount'] ?? 0;
        
        if (!$code) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Mã giảm giá không được để trống']);
            return;
        }
        
        $discount = $this->discountModel->validateCode($code, $orderAmount);
        
        if ($discount) {
            http_response_code(200);
            echo json_encode([
                'success' => true, 
                'message' => 'Mã giảm giá hợp lệ',
                'data' => $discount
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Mã giảm giá không hợp lệ hoặc không đáp ứng điều kiện'
            ]);
        }
    }
    
    /**
     * POST /api/discounts
     * Tạo mã giảm giá mới
     */
    public function store() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate
        $errors = $this->validateDiscount($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }
        
        // Kiểm tra mã code duy nhất (ràng buộc thứ 2)
        if ($this->discountModel->codeExists($data['code'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Mã giảm giá đã tồn tại']);
            return;
        }
        
        $result = $this->discountModel->create($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Tạo mã giảm giá thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Tạo mã giảm giá thất bại']);
        }
    }
    
    /**
     * PUT /api/discounts/{id}
     * Cập nhật mã giảm giá
     */
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $discount = $this->discountModel->getById($id);
        if (!$discount) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Mã giảm giá không tồn tại']);
            return;
        }
        
        $result = $this->discountModel->update($id, $data);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Cập nhật mã giảm giá thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật mã giảm giá thất bại']);
        }
    }
    
    /**
     * DELETE /api/discounts/{id}
     * Xóa mã giảm giá
     */
    public function delete($id) {
        $result = $this->discountModel->delete($id);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Xóa mã giảm giá thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Xóa mã giảm giá thất bại']);
        }
    }
    
    /**
     * PUT /api/discounts/{id}/toggle
     * Bật/tắt mã giảm giá
     */
    public function toggle($id) {
        $discount = $this->discountModel->getById($id);
        
        if (!$discount) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Mã giảm giá không tồn tại']);
            return;
        }
        
        $newStatus = $discount['is_active'] ? 0 : 1;
        $result = $this->discountModel->updateStatus($id, $newStatus);
        
        if ($result) {
            http_response_code(200);
            echo json_encode([
                'success' => true, 
                'message' => $newStatus ? 'Kích hoạt mã giảm giá thành công' : 'Vô hiệu hóa mã giảm giá thành công'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật trạng thái thất bại']);
        }
    }
    
    /**
     * Validate dữ liệu mã giảm giá
     */
    private function validateDiscount($data) {
        $errors = [];
        
        if (empty($data['code'])) {
            $errors['code'] = 'Mã giảm giá không được để trống';
        }
        
        if (empty($data['discount_type']) || !in_array($data['discount_type'], ['percentage', 'fixed'])) {
            $errors['discount_type'] = 'Loại giảm giá không hợp lệ';
        }
        
        if (!isset($data['discount_value']) || $data['discount_value'] <= 0) {
            $errors['discount_value'] = 'Giá trị giảm phải lớn hơn 0';
        }
        
        if ($data['discount_type'] === 'percentage' && $data['discount_value'] > 100) {
            $errors['discount_value'] = 'Giá trị giảm theo % không được vượt quá 100';
        }
        
        if (empty($data['start_date'])) {
            $errors['start_date'] = 'Ngày bắt đầu không được để trống';
        }
        
        if (empty($data['end_date'])) {
            $errors['end_date'] = 'Ngày kết thúc không được để trống';
        }
        
        if (!empty($data['start_date']) && !empty($data['end_date'])) {
            if (strtotime($data['end_date']) < strtotime($data['start_date'])) {
                $errors['end_date'] = 'Ngày kết thúc phải sau ngày bắt đầu';
            }
        }
        
        return $errors;
    }
}
