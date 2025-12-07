<?php
require_once __DIR__ . '/BaseModel.php';

class ProductVariant extends BaseModel {
    protected $table = 'Product_variant';

    /** Lấy tất cả variant của một product */
    public function getAllByProduct($productId) {
        $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE product_id=:product_id ORDER BY id ASC");
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /** Lấy variant theo ID */
    public function getById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE id=:id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    /** Lấy tất cả variant với pagination và filter */
    public function getAll($page = 1, $limit = 10, $filters = []) {
        $offset = ($page - 1) * $limit;
        $params = [];
        $whereClauses = [];

        // Filter theo product_id nếu có
        if (!empty($filters['product_id'])) {
            $whereClauses[] = "product_id = :product_id";
            $params[':product_id'] = $filters['product_id'];
        }

        // Filter theo màu
        if (!empty($filters['color'])) {
            $whereClauses[] = "color LIKE :color";
            $params[':color'] = '%' . $filters['color'] . '%';
        }

        // Filter theo status
        if (!empty($filters['status'])) {
            $whereClauses[] = "status = :status";
            $params[':status'] = $filters['status'];
        }

        $whereSQL = !empty($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';
        
        // Sort mặc định
        $orderBy = 'ORDER BY id ASC';

        if (!empty($filters['sortBy'])) {
            switch ($filters['sortBy']) {
                case 'id-asc':
                    $orderBy = 'ORDER BY product_id ASC';
                    break;
                case 'id-desc':
                    $orderBy = 'ORDER BY product_id DESC';
                    break;
            }
        }

        $sql = "SELECT * FROM {$this->table} $whereSQL $orderBy LIMIT :limit OFFSET :offset";
        $stmt = $this->pdo->prepare($sql);

        foreach ($params as $key => $value) $stmt->bindValue($key, $value);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll();

        // Count tổng số items
        $sqlCount = "SELECT COUNT(*) as total FROM {$this->table} $whereSQL";
        $stmtCount = $this->pdo->prepare($sqlCount);
        foreach ($params as $key => $value) $stmtCount->bindValue($key, $value);
        $stmtCount->execute();
        $total = $stmtCount->fetch()['total'];

        return [
            'data' => $data,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total_items' => (int)$total,
                'total_pages' => (int)ceil($total / $limit),
                'from' => $offset + 1,
                'to' => min($offset + $limit, $total)
            ]
        ];
    }

    /** Tạo variant */
    public function create($data) {
        $this->pdo->beginTransaction();
    
        try {
            // Gọi procedure
            $stmt = $this->pdo->prepare("CALL create_variant_safe(:product_id, :color, :quantity)");
            $stmt->execute([
                ':product_id' => $data['product_id'],
                ':color' => $data['color'],
                ':quantity' => $data['quantity'],
            ]);
    
            // Lấy ID mới
            $variantId = $this->pdo->lastInsertId();
    
            $this->pdo->commit();
    
            return [
                'success' => true,
                'message' => 'Thêm biến thể thành công',
                'variant_id' => $variantId
            ];
    
        } catch (PDOException $e) {
            $this->pdo->rollBack();
    
            $msg = $e->getMessage();
            $errors = [];
    
            if (preg_match('/Không thể thêm biến thể: (.+)/', $msg, $matches)) {
                $errors['message'] = 'Không thể thêm biến thể: ' . $matches[1];
            } else {
                $errors['general'] = 'Lỗi cơ sở dữ liệu: ' . $msg;
            }
    
            return [
                'success' => false,
                'errors'  => $errors
            ];
        }
    }
    
    /** Cập nhật variant */
    public function update($id, $data) {
        try {
            $stmt = $this->pdo->prepare("
                CALL update_variant_safe(:id, :quantity, :color)
            ");
            $stmt->execute([
                ':id'       => $id,
                ':quantity' => $data['quantity'],
                ':color'    => $data['color']
            ]);

            return ['success' => true];

        } catch (PDOException $e) {
            $msg = $e->getMessage();
            $errors = [];

            if (preg_match('/Không thể cập nhật: (.+)/', $msg, $matches)) {
                $errors['message'] = 'Không thể cập nhật: ' . $matches[1];
            } else {
                $errors['general'] = 'Lỗi cơ sở dữ liệu: ' . $msg;
            }

            return [
                'success' => false,
                'errors'  => $errors
            ];
        }
    }

    /** Xóa variant */
    public function delete($id) {
        try {
            $stmt = $this->pdo->prepare("CALL delete_variant_safe(:id)");
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            return ['success' => true];

        } catch (PDOException $e) {
            $msg = $e->getMessage();
            $errors = [];

            if (preg_match('/Không thể xoá: (.+)/', $msg, $matches)) {
                $errors['message'] = 'Không thể xoá: ' . $matches[1];
            } else {
                $errors['general'] = 'Lỗi cơ sở dữ liệu: ' . $msg;
            }

            return [
                'success' => false,
                'errors'  => $errors
            ];
        }
    }
}
