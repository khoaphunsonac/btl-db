<?php
require_once __DIR__ . '/../models/Category.php';

class CategoryController {
    private $categoryModel;
    
    public function __construct($db) {
        $this->categoryModel = new Category($db);
    }
    
    /**
     * GET /api/categories
     * Lấy danh sách danh mục (dạng cây phân cấp hoặc danh sách phẳng)
     */
    public function index() {
        $type = $_GET['type'] ?? 'tree'; // tree hoặc flat
        
        if ($type === 'tree') {
            $result = $this->categoryModel->getTree();
        } else {
            $result = $this->categoryModel->getAll();
        }
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $result]);
    }
    
    /**
     * GET /api/categories/{id}
     * Lấy thông tin chi tiết danh mục
     */
    public function show($id) {
        $category = $this->categoryModel->getById($id);
        
        if (!$category) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Danh mục không tồn tại']);
            return;
        }
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $category]);
    }
    
    /**
     * POST /api/categories
     * Tạo danh mục mới
     */
    public function store() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate
        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Tên danh mục không được để trống']);
            return;
        }
        
        $result = $this->categoryModel->create($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Tạo danh mục thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Tạo danh mục thất bại']);
        }
    }
    
    /**
     * PUT /api/categories/{id}
     * Cập nhật danh mục
     */
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $category = $this->categoryModel->getById($id);
        if (!$category) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Danh mục không tồn tại']);
            return;
        }
        
        $result = $this->categoryModel->update($id, $data);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Cập nhật danh mục thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật danh mục thất bại']);
        }
    }
    
    /**
     * DELETE /api/categories/{id}
     * Xóa danh mục (kiểm tra danh mục con và sản phẩm)
     */
    public function delete($id) {
        // Kiểm tra danh mục có danh mục con không
        if ($this->categoryModel->hasChildren($id)) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Không thể xóa danh mục có danh mục con'
            ]);
            return;
        }
        
        // Kiểm tra danh mục có sản phẩm không
        if ($this->categoryModel->hasProducts($id)) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Không thể xóa danh mục có sản phẩm'
            ]);
            return;
        }
        
        $result = $this->categoryModel->delete($id);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Xóa danh mục thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Xóa danh mục thất bại']);
        }
    }
    
    /**
     * GET /api/categories/{id}/children
     * Lấy danh sách danh mục con
     */
    public function getChildren($id) {
        $children = $this->categoryModel->getChildren($id);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $children]);
    }
    
    /**
     * GET /api/categories/leaf
     * Lấy danh sách danh mục lá (không có danh mục con)
     */
    public function getLeafCategories() {
        $categories = $this->categoryModel->getLeafCategories();
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $categories]);
    }
}
