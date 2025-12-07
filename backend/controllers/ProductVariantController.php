<?php
require_once __DIR__ . '/../models/ProductVariant.php';

class ProductVariantController {
    private $variantModel;

    public function __construct($db) {
        $this->variantModel = new ProductVariant($db);
    }

    // GET /api/product-variants?product_id=&page=&limit=&color=&status=&sortBy=
    public function index() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $filters = [
            'product_id' => $_GET['product_id'] ?? null,
            'color'      => $_GET['color'] ?? null,
            'status'     => $_GET['status'] ?? null,
            'sortBy'     => $_GET['sortBy'] ?? null
        ];

        $result = $this->variantModel->getAll($page, $limit, $filters);
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination']
        ]);
    }

    // GET /api/product-variants/{id}
    public function show($id) {
        $variant = $this->variantModel->getById($id);
        if (!$variant) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Variant không tồn tại']);
            return;
        }

        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $variant]);
    }

    // POST /api/product-variants
    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);

        $result = $this->variantModel->create($data);
        http_response_code($result['success'] ? 200 : 400);
        echo json_encode($result);
    }

    // PUT /api/product-variants/{id}
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);

        $variant = $this->variantModel->getById($id);
        if (!$variant) {
            http_response_code(404);
            echo json_encode(['success' => false, 'errors' => 'Variant không tồn tại']);
            return;
        }

        $result = $this->variantModel->update($id, $data);
        http_response_code($result['success'] ? 200 : 400);
        echo json_encode($result);
    }

    // DELETE /api/product-variants/{id}
    public function delete($id) {
        $variant = $this->variantModel->getById($id);
        if (!$variant) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Variant không tồn tại']);
            return;
        }

        $result = $this->variantModel->delete($id);
        http_response_code($result['success'] ? 200 : 400);
        echo json_encode($result);
    }
}
