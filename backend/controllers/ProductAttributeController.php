<?php
require_once __DIR__ . '/../models/ProductAttribute.php';

class ProductAttributeController {
    private $attributeModel;

    public function __construct($db) {
        $this->attributeModel = new ProductAttribute($db);
    }

    // POST /api/product-attributes
    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);

        $result = $this->attributeModel->create($data);
        http_response_code($result['success'] ? 200 : 400);
        echo json_encode($result);
    }

    // PUT /api/product-attributes/{id}
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);

        $attribute = $this->attributeModel->getById($id);
        if (!$attribute) {
            http_response_code(404);
            echo json_encode(['success' => false, 'errors' => 'Attribute không tồn tại']);
            return;
        }

        $result = $this->attributeModel->update($id, $data);
        http_response_code($result['success'] ? 200 : 400);
        echo json_encode($result);
    }

    // DELETE /api/product-attributes/{id}
    public function delete($id) {
        $attribute = $this->attributeModel->getById($id);
    
        if (!$attribute) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Attribute không tồn tại']);
            return;
        }
    
        // lấy product_id từ DB — CHUẨN NHẤT
        $product_id = $attribute['product_id'];
    
        $result = $this->attributeModel->delete2($id, $product_id);
    
        http_response_code($result['success'] ? 200 : 400);
        echo json_encode($result);
    }    
}