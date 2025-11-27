<?php
require_once __DIR__ . '/../models/User.php';

class UserController {
    private $userModel;
    
    public function __construct($db) {
        $this->userModel = new User($db);
    }
    
    /**
     * GET /api/users
     * Lấy danh sách người dùng (với phân trang, search, filter)
     */
    public function index() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        
        // Build filters array
        $filters = [];
        
        if (!empty($_GET['search'])) {
            $filters['search'] = trim($_GET['search']);
        }
        
        if (!empty($_GET['status'])) {
            $filters['status'] = $_GET['status'];
        }
        
        if (!empty($_GET['sortBy'])) {
            $filters['sortBy'] = $_GET['sortBy'];
        }
        
        $result = $this->userModel->getAll($page, $limit, $filters);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination']
        ]);
    }
    
    /**
     * GET /api/users/{id}
     * Lấy thông tin chi tiết người dùng
     */
    public function show($id) {
        $user = $this->userModel->getById($id);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Người dùng không tồn tại']);
            return;
        }
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $user]);
    }
    
    /**
     * POST /api/users
     * Tạo người dùng mới
     */
    public function store() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate
        $errors = $this->validateUser($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }
        
        $result = $this->userModel->create($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Tạo người dùng thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Tạo người dùng thất bại']);
        }
    }
    
    /**
     * PUT /api/users/{id}
     * Cập nhật thông tin người dùng
     */
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $user = $this->userModel->getById($id);
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Người dùng không tồn tại']);
            return;
        }
        
        $result = $this->userModel->update($id, $data);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Cập nhật thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật thất bại']);
        }
    }
    
    /**
     * DELETE /api/users/{id}
     * Xóa người dùng (kiểm tra ràng buộc đơn hàng)
     */
    public function delete($id) {
        // Kiểm tra đơn hàng đang xử lý
        if ($this->userModel->hasPendingOrders($id)) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Không thể xóa người dùng có đơn hàng đang xử lý'
            ]);
            return;
        }
        
        $result = $this->userModel->delete($id);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Xóa người dùng thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Xóa người dùng thất bại']);
        }
    }
    
    /**
     * PUT /api/users/{id}/status
     * Cập nhật trạng thái người dùng
     */
    public function updateStatus($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $status = $data['status'] ?? null;
        
        if (!$status) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Trạng thái không hợp lệ']);
            return;
        }
        
        $result = $this->userModel->updateStatus($id, $status);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Cập nhật trạng thái thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật trạng thái thất bại']);
        }
    }
    
    /**
     * GET /api/users/statistics
     * Lấy thống kê khách hàng
     */
    public function statistics() {
        try {
            $stats = $this->userModel->getStatistics();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $stats
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Lỗi khi lấy thống kê: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Validate dữ liệu người dùng
     */
    private function validateUser($data) {
        $errors = [];
        
        // Validate email
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email không hợp lệ';
        }
        
        // Validate password (ràng buộc thứ 10)
        if (!empty($data['password'])) {
            if (strlen($data['password']) < 8) {
                $errors['password'] = 'Mật khẩu phải có ít nhất 8 ký tự';
            } elseif (!preg_match('/[A-Z]/', $data['password'])) {
                $errors['password'] = 'Mật khẩu phải chứa ít nhất 1 ký tự hoa';
            } elseif (!preg_match('/[a-z]/', $data['password'])) {
                $errors['password'] = 'Mật khẩu phải chứa ít nhất 1 ký tự thường';
            } elseif (!preg_match('/[0-9]/', $data['password'])) {
                $errors['password'] = 'Mật khẩu phải chứa ít nhất 1 chữ số';
            }
        }
        
        return $errors;
    }
}
