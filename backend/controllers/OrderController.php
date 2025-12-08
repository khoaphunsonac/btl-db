<?php
require_once __DIR__ . '/../models/Order.php';

class OrderController {
    private $orderModel;
    
    public function __construct($db) {
        $this->orderModel = new Order($db);
    }
    
    /**
     * GET /api/orders
     * Lấy danh sách đơn hàng (có filter theo status, user, date)
     */
    public function index() {
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 10);
        
        // Tính OFFSET dựa trên PAGE và LIMIT
        $offset = ($page - 1) * $limit; 
        
        $status = $_GET['status'] ?? null;
        $userId = $_GET['user_id'] ?? null;
        $fromDate = $_GET['from_date'] ?? null;
        $toDate = $_GET['to_date'] ?? null;
        
        // Chỉ truyền các filter không phải là pagination vào mảng conditions
        $conditions = [
            'status' => $status,
            'user_id' => $userId,
            'from_date' => $fromDate, // Sẽ được xử lý trong Order.php
            'to_date' => $toDate       // Sẽ được xử lý trong Order.php
        ];
        
        // GỌI PHƯƠNG THỨC VỚI CHỮ KÝ TƯƠNG THÍCH: ($limit, $offset, $conditions)
        $result = $this->orderModel->getAll($limit, $offset, $conditions);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination'] // Giả sử Order::getAll đã trả về đầy đủ
        ]);
    }
    
    /**
     * GET /api/orders/{id}
     * Lấy chi tiết đơn hàng (bao gồm items, logs)
     */
    public function show($id) {
        $order = $this->orderModel->getById($id); // Lấy thông tin đơn hàng chính
        
        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Đơn hàng không tồn tại']);
            return;
        }
        
        // Lấy chi tiết sản phẩm trong đơn hàng
        $items = $this->orderModel->getDetails($id); // Gọi hàm getDetails đã có sẵn
        
        // Gộp dữ liệu order và items lại
        $data = $order;
        $data['items'] = $items;
        
        // (Tùy chọn) Nếu muốn hiển thị logs:
        // $data['logs'] = $this->orderModel->getStatusLogs($id);

        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $data]);
    }
    
    /**
     * POST /api/orders
     * Tạo đơn hàng mới
     */
    public function store() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate
        $errors = $this->validateOrder($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }
        
        // Kiểm tra tồn kho
        foreach ($data['items'] as $item) {
            if (!$this->orderModel->checkStock($item['product_variant_id'], $item['quantity'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Sản phẩm không đủ hàng trong kho'
                ]);
                return;
            }
        }
        
        // Kiểm tra và áp dụng mã giảm giá (ràng buộc thứ 4)
        if (!empty($data['discount_code'])) {
            $discount = $this->orderModel->validateDiscount($data['discount_code'], $data['total_amount']);
            if (!$discount) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn']);
                return;
            }
            $data['discount_id'] = $discount['id'];
        }
        
        $result = $this->orderModel->create($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Đặt hàng thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Đặt hàng thất bại']);
        }
    }
    
    /**
     * PUT /api/orders/{id}/status
     * Cập nhật trạng thái đơn hàng
     * Xử lý trừ kho khi xác nhận và hoàn kho khi hủy (ràng buộc 5, 6)
     */
    public function updateStatus($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $newStatus = $data['status'] ?? null;
        
        if (!$newStatus) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Trạng thái không hợp lệ']);
            return;
        }
        
        $order = $this->orderModel->getById($id);
        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Đơn hàng không tồn tại']);
            return;
        }
        
        $oldStatus = $order['status'];
        
        // Ràng buộc thứ 3: Chỉ hoàn thành khi đã thanh toán
        if ($newStatus === 'completed' && $order['payment_status'] !== 'paid') {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Đơn hàng chỉ có thể hoàn thành khi đã thanh toán'
            ]);
            return;
        }
        
        // Ràng buộc thứ 5: Trừ kho khi xác nhận
        if ($oldStatus === 'pending' && $newStatus === 'confirmed') {
            if (!$this->orderModel->decreaseStock($id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Không đủ hàng trong kho']);
                return;
            }
        }
        
        // Ràng buộc thứ 6: Hoàn kho khi hủy đơn đã xác nhận
        if ($oldStatus === 'confirmed' && $newStatus === 'cancelled') {
            $this->orderModel->increaseStock($id);
        }
        
        $result = $this->orderModel->updateStatus($id, $newStatus, $data['note'] ?? null);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Cập nhật trạng thái thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật trạng thái thất bại']);
        }
    }
    
    /**
     * PUT /api/orders/{id}
     * Cập nhật thông tin đơn hàng
     */
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $order = $this->orderModel->getById($id);
        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Đơn hàng không tồn tại']);
            return;
        }
        
        // Chỉ cho phép cập nhật đơn hàng ở trạng thái pending
        if ($order['status'] !== 'pending') {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Chỉ có thể cập nhật đơn hàng đang chờ xử lý'
            ]);
            return;
        }
        
        $result = $this->orderModel->update($id, $data);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Cập nhật đơn hàng thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật đơn hàng thất bại']);
        }
    }
    
    /**
     * DELETE /api/orders/{id}
     * Hủy đơn hàng
     */
    public function cancel($id) {
        $order = $this->orderModel->getById($id);
        
        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Đơn hàng không tồn tại']);
            return;
        }
        
        // Chỉ cho phép hủy đơn hàng ở trạng thái pending hoặc confirmed
        if (!in_array($order['status'], ['pending', 'confirmed'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Không thể hủy đơn hàng ở trạng thái này'
            ]);
            return;
        }
        
        // Hoàn kho nếu đã xác nhận
        if ($order['status'] === 'confirmed') {
            $this->orderModel->increaseStock($id);
        }
        
        $result = $this->orderModel->updateStatus($id, 'cancelled');
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Hủy đơn hàng thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Hủy đơn hàng thất bại']);
        }
    }
    
    /**
     * GET /api/orders/{id}/logs
     * Lấy lịch sử trạng thái đơn hàng
     */
    public function getLogs($id) {
        $logs = $this->orderModel->getStatusLogs($id);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $logs]);
    }
    
    /**
     * Validate dữ liệu đơn hàng
     */
    private function validateOrder($data) {
        $errors = [];
        
        if (empty($data['user_id'])) {
            $errors['user_id'] = 'Người dùng không được để trống';
        }
        
        if (empty($data['items']) || !is_array($data['items'])) {
            $errors['items'] = 'Đơn hàng phải có ít nhất 1 sản phẩm';
        }
        
        if (empty($data['shipping_address'])) {
            $errors['shipping_address'] = 'Địa chỉ giao hàng không được để trống';
        }
        
        if (empty($data['payment_method'])) {
            $errors['payment_method'] = 'Phương thức thanh toán không được để trống';
        }
        
        return $errors;
    }


    public function updateStatusRoute($id) { 
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['status'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Trạng thái không được để trống']);
            return;
        }

        $status = $data['status'];
        // Đảm bảo không có logic lấy discount/note
        
        try {
            // GỌI MODEL CHỈ VỚI HAI THAM SỐ
            $result = $this->orderModel->updateStatus($id, $status);
            
            if ($result) {
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Cập nhật trạng thái thành công']);
            } else {
                http_response_code(500); 
                echo json_encode(['success' => false, 'message' => 'Cập nhật trạng thái thất bại (logic)']);
            }
        } catch (Exception $e) {
            error_log("Lỗi cập nhật trạng thái đơn hàng #{$id}: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật trạng thái thất bại (Server Error)']);
        }
    }

}
