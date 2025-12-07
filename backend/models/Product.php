<?php
require_once __DIR__ . '/BaseModel.php';

class Product extends BaseModel {
    protected $table = 'Product';

    /** Lấy tất cả product với pagination + filters */
    public function getAll($page = 1, $limit = 10, $filters = []) {
        $offset = ($page - 1) * $limit;
        $params = [];
        $whereClauses = [];

        if (!empty($filters['search'])) {
            $whereClauses[] = "name LIKE :search";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $whereSQL = !empty($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';
        $orderBy = 'id DESC';
        if (!empty($filters['sortBy'])) {
            switch ($filters['sortBy']) {
                case 'price-asc': $orderBy = 'cost_current ASC'; break;
                case 'price-desc': $orderBy = 'cost_current DESC'; break;
            }
        }

        $sql = "SELECT * FROM {$this->table} $whereSQL ORDER BY $orderBy LIMIT :limit OFFSET :offset";
        $stmt = $this->pdo->prepare($sql);

        foreach ($params as $key => $value) $stmt->bindValue($key, $value);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll();

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

    /** Lấy product theo ID kèm attribute */
    public function getById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE id=:id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $product = $stmt->fetch();
        if (!$product) return null;

        // Lấy attribute
        $stmtAttr = $this->pdo->prepare("SELECT name, value FROM Product_attribute WHERE product_id=:id");
        $stmtAttr->bindValue(':id', $id, PDO::PARAM_INT);
        $stmtAttr->execute();
        $product['attributes'] = $stmtAttr->fetchAll();

        return $product;
    }

    public function getAllTest($page = 1, $limit = 10, $filters = []) {
        $search = $filters['search'] ?? '';
        $status = $filters['status'] ?? '';
        $sort   = $filters['sortBy'] ?? 'id-desc';
    
        // 1. Gọi stored procedure có tham số
        $stmt = $this->pdo->prepare("
            CALL get_all_products(:search, :status, :sort)
        ");
        $stmt->bindValue(':search', $search);
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':sort', $sort);
        $stmt->execute();
    
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor(); // VERY IMPORTANT: tránh lỗi “Commands out of sync”
    
        // 2. Gom product + list color
        $products = [];
    
        foreach ($rows as $row) {
            $pid = $row['product_id'];
    
            if (!isset($products[$pid])) {
                $products[$pid] = [
                    'id' => $row['product_id'],
                    'name' => $row['product_name'],
                    'trademark' => $row['product_trademark'],
                    'cost_current' => $row['product_cost_current'],
                    'cost_old' => $row['product_cost_old'],
                    'description' => $row['product_description'],
                    'status' => $row['product_status'],
                    'overall_rating_star' => $row['product_rating_star'],
                    'rating_count' => $row['product_rating_count'],
                    'colors' => []
                ];
            }
    
            if (!empty($row['variant_color'])) {
                $products[$pid]['colors'][] = $row['variant_color'];
            }
        }
    
        // 3. Convert indexed array
        $products = array_values($products);
    
        // 4. Pagination
        $total = count($products);
        $totalPages = ceil($total / $limit);
        $offset = ($page - 1) * $limit;
    
        $pagedData = array_slice($products, $offset, $limit);
    
        // 5. Return chuẩn API
        return [
            'data' => $pagedData,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total_items' => (int)$total,
                'total_pages' => (int)$totalPages,
                'from' => $offset + 1,
                'to' => min($offset + $limit, $total)
            ]
        ];
    }            

    public function getTest($id) {
        $stmt = $this->pdo->prepare("CALL get_product(:id)");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
        if (empty($rows)) return null;
    
        // Lấy info product từ dòng đầu tiên
        $product = [
            "id" => $rows[0]["product_id"],
            "name" => $rows[0]["product_name"],
            "trademark" => $rows[0]["product_trademark"],
            "cost_current" => $rows[0]["product_cost_current"],
            "cost_old" => $rows[0]["product_cost_old"],
            "description" => $rows[0]["product_description"],
            "status" => $rows[0]["product_status"],
            "rating_star" => $rows[0]["product_rating_star"],
            "rating_count" => $rows[0]["product_rating_count"],
            "variants" => [],
            "attributes" => []
        ];
    
        // Dùng map để tránh duplicate
        $variantMap = [];
        $attrMap = [];
    
        foreach ($rows as $r) {
    
            // Gom variant nếu chưa có
            if (!isset($variantMap[$r["variant_id"]])) {
                $variantMap[$r["variant_id"]] = [
                    "id" => $r["variant_id"],
                    "color" => $r["variant_color"],
                    "quantity" => $r["variant_quantity"],
                    "status" => $r["variant_status"]
                ];
            }
    
            // Gom attribute nếu chưa có
            if (!isset($attrMap[$r["attribute_id"]])) {
                $attrMap[$r["attribute_id"]] = [
                    "id" => $r["attribute_id"],
                    "name" => $r["attribute_name"],
                    "value" => $r["attribute_value"]
                ];
            }
        }
    
        // Turn map → array
        $product["variants"] = array_values($variantMap);
        $product["attributes"] = array_values($attrMap);
    
        return $product;
    }    

    /** Tạo product + attributes */
    public function create($data) {
        $this->pdo->beginTransaction();
    
        try {
            // Gọi stored procedure
            $stmt = $this->pdo->prepare("
                CALL insert_product_safe(
                    :name, :trademark, :cost_current, :cost_old, :description, :status
                )
            ");
    
            $stmt->execute([
                ':name' => $data['name'],
                ':trademark' => $data['trademark'],
                ':cost_current' => $data['cost_current'],
                ':cost_old' => null,
                ':description' => $data['description'],
                ':status' => $data['status'] ?? 'Chưa mở bán',
            ]);
    
            // Lấy ID vừa insert
            $productId = $this->pdo->lastInsertId();
    
            // Insert attributes (nếu có)
            if (!empty($data['attributes']) && is_array($data['attributes'])) {
                $stmtAttr = $this->pdo->prepare("
                    INSERT INTO Product_attribute (id, product_id, name, value)
                    VALUES (NULL, :product_id, :name, :value)
                ");
    
                foreach ($data['attributes'] as $attr) {
                    $stmtAttr->execute([
                        ':product_id' => $productId,
                        ':name' => $attr['name'],
                        ':value' => $attr['value'],
                    ]);
                }
            }
    
            $this->pdo->commit();
    
            return [
                'success' => true,
                'message' => 'Thêm sản phẩm thành công',
                'product_id' => $productId
            ];
    
        } catch (PDOException $e) {
            $this->pdo->rollBack();
    
            // Lấy thông báo từ SIGNAL trong MySQL
            $msg = $e->getMessage();
            $errors = [];
    
            if (preg_match('/Không thể thêm sản phẩm: (.+)/', $msg, $matches)) {
                // Lưu vào errors.message
                $errors['message'] = 'Không thể thêm sản phẩm: ' . $matches[1];
            } else {
                // Lỗi khác
                $errors['general'] = 'Lỗi cơ sở dữ liệu: ' . $msg;
            }
    
            return [
                'success' => false,
                'errors'  => $errors
            ];
        }
    }    

    /** Update product + attributes */
    public function update($id, $data) {
        $this->pdo->beginTransaction();
    
        try {
            $stmt = $this->pdo->prepare("
                CALL update_product_safe(
                    :id,
                    :name,
                    :trademark,
                    :cost_current,
                    :description,
                    :status
                )
            ");
    
            $stmt->execute([
                ':id'            => $id,
                ':name'          => $data['name'],
                ':trademark'     => $data['trademark'],
                ':cost_current'  => $data['cost_current'],
                ':description'   => $data['description'],
                ':status'        => $data['status'] ?? 'Còn hàng'
            ]);
    
            // Xóa và thêm lại attributes như trước
            $stmtDel = $this->pdo->prepare("DELETE FROM Product_attribute WHERE product_id = :id");
            $stmtDel->execute([':id' => $id]);

            // Lấy MAX(id) của product này
            $stmtMax = $this->pdo->prepare("
                SELECT MAX(id) AS max_id
                FROM Product_attribute
                WHERE product_id = :product_id
            ");
            $stmtMax->execute([':product_id' => $id]);
            $maxId = (int)$stmtMax->fetchColumn(); // null -> 0

            // id mới sẽ tăng dần
            $newId = $maxId + 1;

            // Thêm attribute mới
            if (!empty($data['attributes']) && is_array($data['attributes'])) {
                $stmtAttr = $this->pdo->prepare("
                    INSERT INTO Product_attribute (id, product_id, name, `value`)
                    VALUES (:id, :product_id, :name, :value)
                ");

                foreach ($data['attributes'] as $attr) {

                    $stmtAttr->execute([
                        ':id'         => $newId,
                        ':product_id' => $id,
                        ':name'       => $attr['name'],
                        ':value'      => $attr['value']
                    ]);

                    $newId++; // mỗi attribute tăng 1
                }
            }
    
            $this->pdo->commit();
    
            return ['success' => true];
    
        } catch (PDOException $e) {
            $this->pdo->rollBack();
    
            // Lấy thông báo từ SIGNAL trong MySQL
            $msg = $e->getMessage();
            $errors = [];
    
            if (preg_match('/Không thể cập nhật: (.+)/', $msg, $matches)) {
                // Lưu vào errors.message
                $errors['message'] = 'Không thể cập nhật: ' . $matches[1];
            } else {
                // Lỗi khác
                $errors['general'] = 'Lỗi cơ sở dữ liệu: ' . $msg;
            }
    
            return [
                'success' => false,
                'errors'  => $errors
            ];
        }
    }
    
    /** Xóa product (có cascade xóa attribute nếu FK ON DELETE CASCADE) */
    public function delete($id) {
        try {
            $stmt = $this->pdo->prepare("CALL delete_product_safe(:id)");
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
    
            return [
                'success' => true,
                'message' => 'Xóa thành công'
            ];
        } catch (PDOException $e) {
    
            // Lấy thông báo từ SIGNAL trong MySQL
            $msg = $e->getMessage();
            $errors = [];
    
            if (preg_match('/Không thể xoá: (.+)/', $msg, $matches)) {
                // Lưu vào errors.message
                $errors['message'] = 'Không thể xoá: ' . $matches[1];
            } else {
                // Lỗi khác
                $errors['general'] = 'Lỗi cơ sở dữ liệu: ' . $msg;
            }
    
            return [
                'success' => false,
                'errors'  => $errors
            ];
        }
    }
    
}
