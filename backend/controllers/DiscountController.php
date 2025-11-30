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
        $page = $_GET['page'] ?? 1; // http://example.com/index.php?page=2
        $limit = $_GET['limit'] ?? 2;

        // Lọc nâng cao
        $filters = [
            'search' => $_GET['search'] ?? null,
            'type'   => $_GET['type'] ?? null,
            'status' => $_GET['status'] ?? null, // active, expired, upcoming
            'sortBy' => $_GET['sortBy'] ?? null,
        ];

        $result = $this->discountModel->getAll($page, $limit, $filters);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination']
        ]);
    }

    /**
     * GET /api/discounts/{id}
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
     * POST /api/discounts
     * Tạo mới
     */
    public function store() {
        $data = json_decode(file_get_contents("php://input"), true);

        // validate input
        $errors = $this->validateDiscount($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }

        $result = $this->discountModel->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Tạo mã giảm giá thành công'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Tạo mã giảm giá thất bại'
            ]);
        }
    }

    /**
     * PUT /api/discounts/{id}
     * Cập nhật
     */
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);

        $discount = $this->discountModel->getById($id);
        if (!$discount) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Mã giảm giá không tồn tại']);
            return;
        }

        // validate input
        $errors = $this->validateDiscount($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            return;
        }

        $result = $this->discountModel->update($id, $data);

        if ($result) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Cập nhật mã giảm giá thành công'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Cập nhật mã giảm giá thất bại'
            ]);
        }
    }

    /**
     * DELETE /api/discounts/{id}
     */
    public function delete($id) {
        $result = $this->discountModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Xóa mã giảm giá thành công'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Xóa mã giảm giá thất bại'
            ]);
        }
    }

    /**
     * Validate dữ liệu Discount
     */
    private function validateDiscount($data) {
        $errors = [];

        if (!isset($data['value']) || $data['value'] <= 0) {
            $errors['value'] = 'Giá trị giảm phải lớn hơn 0';
        }

        if (empty($data['condition'])) {
            $errors['condition'] = 'Điều kiện áp dụng không được để trống';
        }

        if (empty($data['time_start'])) {
            $errors['time_start'] = 'Thời gian bắt đầu không được để trống';
        }

        if (empty($data['time_end'])) {
            $errors['time_end'] = 'Thời gian kết thúc không được để trống';
        }

        if (!empty($data['time_start']) && !empty($data['time_end'])) {
            if (strtotime($data['time_end']) < strtotime($data['time_start'])) {
                $errors['time_end'] = 'Ngày kết thúc phải sau ngày bắt đầu';
            }
        }

        if (empty($data['type']) || !in_array($data['type'], ['Phần trăm', 'Giá trị'])) {
            $errors['type'] = 'Loại giảm giá không hợp lệ';
        }

        return $errors;
    }
}
