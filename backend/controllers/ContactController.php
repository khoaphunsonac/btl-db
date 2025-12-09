<?php
require_once __DIR__ . '/../models/Contact.php';

class ContactController {
    private $contactModel;
    
    public function __construct($db) {
        $this->contactModel = new Contact($db);
    }
    
    /**
     * GET /api/contacts/stats
     * Lấy thống kê liên hệ (Admin)
     */
    public function stats() {
        $stats = $this->contactModel->getStats();
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $stats]);
    }
    
    /**
     * GET /api/contacts
     * Lấy danh sách yêu cầu liên hệ (Admin)
     */
    public function index() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $status = $_GET['status'] ?? null; // pending, processing, resolved
        
        $result = $this->contactModel->getAll($page, $limit, $status);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination']
        ]);
    }
    
    /**
     * GET /api/contacts/{id}
     * Lấy chi tiết yêu cầu liên hệ
     */
    public function show($id) {
        $contact = $this->contactModel->getById($id);
        
        if (!$contact) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Yêu cầu liên hệ không tồn tại']);
            return;
        }
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $contact]);
    }
    
    /**
     * POST /api/contacts
     * Tạo yêu cầu liên hệ mới
     */
    public function store() {
        // Get raw input
        $rawInput = file_get_contents("php://input");
        error_log("Contact POST raw input: " . $rawInput);
        
        $data = json_decode($rawInput, true);
        
        // Check JSON decode error
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Invalid JSON',
                'error' => json_last_error_msg()
            ]);
            return;
        }
        
        error_log("Contact POST decoded data: " . json_encode($data));
        
        // Validate
        $errors = $this->validateContact($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }
        
        $result = $this->contactModel->create($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode([
                'success' => true, 
                'message' => 'Gửi yêu cầu liên hệ thành công', 
                'data' => $result
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => 'Gửi yêu cầu liên hệ thất bại. Kiểm tra error log để biết chi tiết.'
            ]);
        }
    }
    
    /**
     * PUT /api/contacts/{id}/status
     * Cập nhật trạng thái xử lý (Admin)
     */
    public function updateStatus($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $status = $data['status'] ?? null;
        
        if (!$status) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Trạng thái không hợp lệ']);
            return;
        }
        
        $contact = $this->contactModel->getById($id);
        if (!$contact) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Yêu cầu liên hệ không tồn tại']);
            return;
        }
        
        $result = $this->contactModel->updateStatus($id, $status);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Cập nhật trạng thái thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật trạng thái thất bại']);
        }
    }
    
    /**
     * DELETE /api/contacts/{id}
     * Xóa yêu cầu liên hệ (Admin)
     */
    public function delete($id) {
        $result = $this->contactModel->delete($id);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Xóa yêu cầu liên hệ thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Xóa yêu cầu liên hệ thất bại']);
        }
    }
    
    /**
     * Validate dữ liệu liên hệ
     */
    private function validateContact($data) {
        $errors = [];
        
        if (empty($data['content']) && empty($data['message'])) {
            $errors['message'] = 'Nội dung không được để trống';
        }
        
        // Optional validation for customer_id
        if (isset($data['customer_id']) && !is_numeric($data['customer_id'])) {
            $errors['customer_id'] = 'ID khách hàng không hợp lệ';
        }
        
        return $errors;
    }
}
