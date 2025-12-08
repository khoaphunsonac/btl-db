<?php
require_once __DIR__ . '/../models/Product.php';

class ProductController {
    private $productModel;

    public function __construct($db) {
        $this->productModel = new Product($db);
    }

    public function index() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $filters = [
            'search' => $_GET['search'] ?? null,
            'sortBy' => $_GET['sortBy'] ?? null
        ];

        $result = $this->productModel->getAll($page, $limit, $filters);
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination']
        ]);
    }

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

    public function store() {
        $data = json_decode(file_get_contents("php://input"), true);
    
        // Validate đầu vào
        $errors = $this->validateProduct($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'errors' => $errors
            ]);
            return;
        }
    
        // Gọi Model
        $result = $this->productModel->create($data);
    
        if ($result['success']) {
            http_response_code(200);
            echo json_encode([
                'success' => true
            ]);
        } else {
            http_response_code(400); // lỗi từ SP hoặc validate
            echo json_encode([
                'success' => false,
                'errors'  => $result['errors'] ?? 'Tạo sản phẩm thất bại'
            ]);
        }
    }    

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
    
        // Kiểm tra tồn tại sản phẩm
        $product = $this->productModel->getById($id);
        if (!$product) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'errors' => ['general' => 'Sản phẩm không tồn tại']
            ]);
            return;
        }
    
        // Validate input
        $errors = $this->validateProduct($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'errors'  => $errors
            ]);
            return;
        }
    
        // Update qua Model
        $result = $this->productModel->update($id, $data);
    
        if ($result['success']) {
            http_response_code(200);
            echo json_encode([
                'success' => true
            ]);
        } else {
            http_response_code(400); // lỗi từ SP hoặc validate
            echo json_encode([
                'success' => false,
                'errors'  => $result['errors'] 
            ]);
        }
    }
        

    public function delete($id) {
        $result = $this->productModel->delete($id);
    
        if ($result['success']) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                // 'message' => $result['message']
            ]);
        } else {
            http_response_code(400); // lỗi input, không phải 500 server
            echo json_encode([
                'success' => false,
                'errors' => $result['errors']  // message từ SP
            ]);
        }
    }    

    private function validateProduct($data) {
        $errors = [];

        if (empty($data['name'])) $errors['name'] = 'Tên sản phẩm không được để trống';
        if (!isset($data['trademark']) || !$data['trademark']) $errors['trademark'] = 'Thương hiệu không được để trống';
        if (!isset($data['cost_current']) || $data['cost_current'] <= 0) $errors['cost_current'] = 'Giá hiện tại phải lớn hơn 0';
        if (empty($data['description'])) $errors['description'] = 'Mô tả không được để trống';
        if (!empty($data['attributes']) && is_array($data['attributes'])) {
            foreach ($data['attributes'] as $i => $attr) {
                if (empty($attr['name']) || empty($attr['value'])) {
                    $errors["attributes_$i"] = 'Tên và giá trị thuộc tính không được để trống';
                }
            }
        }

        return $errors;
    }


    public function search() {
        $query = $_GET['q'] ?? '';
        
        if (empty($query)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Tham số tìm kiếm không được để trống']);
            return;
        }

        try {
            // Cần hàm searchProducts trong Product Model
            $products = $this->productModel->searchProducts($query); 
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $products]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Lỗi tìm kiếm hệ thống']);
        }
    }


}
