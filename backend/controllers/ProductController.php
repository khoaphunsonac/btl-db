<?php
require_once __DIR__ . '/../models/Product.php';

class ProductController {
    private $productModel;
    
    public function __construct($db) {
        $this->productModel = new Product($db);
    }
    
    /**
     * GET /api/products
     * Lấy danh sách sản phẩm (có filter, search, sort)
     */
    public function index() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 12;
        $category = $_GET['category'] ?? null;
        $brand = $_GET['brand'] ?? null;
        $search = $_GET['search'] ?? null;
        $minPrice = $_GET['min_price'] ?? null;
        $maxPrice = $_GET['max_price'] ?? null;
        $sort = $_GET['sort'] ?? 'newest';
        
        $result = $this->productModel->getAll([
            'page' => $page,
            'limit' => $limit,
            'category' => $category,
            'brand' => $brand,
            'search' => $search,
            'min_price' => $minPrice,
            'max_price' => $maxPrice,
            'sort' => $sort
        ]);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination']
        ]);
    }
    
    /**
     * GET /api/products/{id}
     * Lấy chi tiết sản phẩm (bao gồm variants, images, ratings)
     */
    public function show($id) {
        $product = $this->productModel->getById($id);
        
        if (!$product) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Sản phẩm không tồn tại']);
            return;
        }
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $product]);
    }
    
    /**
     * POST /api/products
     * Tạo sản phẩm mới
     */
    public function store() {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate
        $errors = $this->validateProduct($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }
        
        // Kiểm tra danh mục phải là danh mục lá (ràng buộc thứ 8)
        if (!empty($data['category_id'])) {
            if (!$this->productModel->isLeafCategory($data['category_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Chỉ được phép gán sản phẩm vào danh mục lá (không có danh mục con)'
                ]);
                return;
            }
        }
        
        $result = $this->productModel->create($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Tạo sản phẩm thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Tạo sản phẩm thất bại']);
        }
    }
    
    /**
     * PUT /api/products/{id}
     * Cập nhật sản phẩm
     */
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $product = $this->productModel->getById($id);
        if (!$product) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Sản phẩm không tồn tại']);
            return;
        }
        
        // Kiểm tra danh mục phải là danh mục lá
        if (!empty($data['category_id'])) {
            if (!$this->productModel->isLeafCategory($data['category_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Chỉ được phép gán sản phẩm vào danh mục lá'
                ]);
                return;
            }
        }
        
        $result = $this->productModel->update($id, $data);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Cập nhật sản phẩm thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Cập nhật sản phẩm thất bại']);
        }
    }
    
    /**
     * DELETE /api/products/{id}
     * Xóa sản phẩm
     */
    public function delete($id) {
        $result = $this->productModel->delete($id);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Xóa sản phẩm thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Xóa sản phẩm thất bại']);
        }
    }
    
    /**
     * GET /api/products/{id}/variants
     * Lấy danh sách biến thể của sản phẩm
     */
    public function getVariants($id) {
        $variants = $this->productModel->getVariants($id);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $variants]);
    }
    
    /**
     * POST /api/products/{id}/variants
     * Thêm biến thể sản phẩm
     */
    public function addVariant($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $data['product_id'] = $id;
        
        // Validate giá và tồn kho (ràng buộc thứ 1)
        if ($data['price'] <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Giá phải lớn hơn 0']);
            return;
        }
        
        if ($data['stock'] < 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Tồn kho không được âm']);
            return;
        }
        
        $result = $this->productModel->addVariant($data);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Thêm biến thể thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Thêm biến thể thất bại']);
        }
    }
    
    /**
     * GET /api/products/{id}/images
     * Lấy danh sách hình ảnh của sản phẩm
     */
    public function getImages($id) {
        $images = $this->productModel->getImages($id);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $images]);
    }
    
    /**
     * POST /api/products/{id}/images
     * Upload hình ảnh cho sản phẩm
     */
    public function uploadImage($id) {
        // Handle file upload
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Không có file được tải lên']);
            return;
        }
        
        $result = $this->productModel->uploadImage($id, $_FILES['image']);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Upload hình ảnh thành công', 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Upload hình ảnh thất bại']);
        }
    }
    
    /**
     * Validate dữ liệu sản phẩm
     */
    private function validateProduct($data) {
        $errors = [];
        
        if (empty($data['name'])) {
            $errors['name'] = 'Tên sản phẩm không được để trống';
        }
        
        if (empty($data['brand'])) {
            $errors['brand'] = 'Thương hiệu không được để trống';
        }
        
        return $errors;
    }
}
