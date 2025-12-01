<?php
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $userModel;
    
    public function __construct($db) {
        $this->userModel = new User($db);
    }
    
    /**
     * POST /api/auth/register - Đăng ký tài khoản mới
     */
    public function register() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate password (ràng buộc thứ 10)
        if (strlen($data['password']) < 8 || 
            !preg_match('/[A-Z]/', $data['password']) ||
            !preg_match('/[a-z]/', $data['password']) ||
            !preg_match('/[0-9]/', $data['password'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Mật khẩu không đáp ứng yêu cầu']);
            return;
        }
        
        if ($this->userModel->emailExists($data['email'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email đã tồn tại']);
            return;
        }
        
        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        $data['role'] = 'customer';
        
        $result = $this->userModel->create($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Đăng ký thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Đăng ký thất bại']);
        }
    }
    
    /**
     * POST /api/auth/login - Đăng nhập
     */
    public function login() {
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Email và password là bắt buộc']);
                return;
            }
            
            $user = $this->userModel->getByEmail($data['email']);
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Email hoặc mật khẩu không đúng']);
                return;
            }
            
            if (!password_verify($data['password'], $user['password'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Email hoặc mật khẩu không đúng']);
                return;
            }
            
            if ($user['status'] !== 'Hoạt động' && $user['status'] !== 'active') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Tài khoản đã bị khóa']);
                return;
            }
            
            // Cập nhật last_login
            $this->userModel->updateLastLogin($user['id']);
            
            // Tạo token (JWT hoặc session)
            $token = $this->generateToken($user);
            
            // Format user data for response
            $userData = [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => trim(($user['fname'] ?? '') . ' ' . ($user['lname'] ?? '')),
                'fname' => $user['fname'] ?? '',
                'lname' => $user['lname'] ?? '',
                'phone' => $user['phone'] ?? '',
                'address' => $user['address'] ?? '',
                'role' => $user['role'] ?? 'customer',
                'status' => $user['status']
            ];
            
            http_response_code(200);
            echo json_encode([
                'success' => true, 
                'message' => 'Đăng nhập thành công',
                'data' => [
                    'user' => $userData,
                    'token' => $token
                ]
            ]);
        } catch (Exception $e) {
            error_log('Login error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
        }
    }
    
    /**
     * POST /api/auth/logout - Đăng xuất
     */
    public function logout() {
        // Xóa token/session
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Đăng xuất thành công']);
    }
    
    /**
     * GET /api/auth/me - Lấy thông tin user hiện tại
     */
    public function me() {
        // Lấy từ token/session
        $userId = $_SESSION['user_id'] ?? null;
        
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }
        
        $user = $this->userModel->getById($userId);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $user]);
    }
    
    private function generateToken($user) {
        // Implement JWT or session token
        return base64_encode(json_encode(['user_id' => $user['id'], 'exp' => time() + 86400]));
    }
}
