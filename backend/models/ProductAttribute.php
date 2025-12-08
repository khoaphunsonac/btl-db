<?php
require_once __DIR__ . '/BaseModel.php';

class ProductAttribute extends BaseModel {
    protected $table = 'product_attribute';

    /** Lấy attribute theo ID */
    public function getById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE id=:id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    // Tạo Attribute
    public function create($data) {
        $this->pdo->beginTransaction();

        try {
            $stmt = $this->pdo->prepare("CALL create_attribute_safe(:product_id, :name, :value)");
            $stmt->execute([
                ':product_id' => $data['product_id'],
                ':name' => $data['name'],
                ':value' => $data['value'],
            ]);

            $this->pdo->commit();

            return [
                'success' => true,
                'message' => 'Thêm thuộc tính thành công',
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();

            $msg = $e->getMessage();
            $errors = [];

            if (preg_match('/Không thể thêm thuộc tính: (.+)/', $msg, $matches)) {
                $errors['message'] = 'Không thể thêm thuộc tính: ' . $matches[1];
            } else {
                $errors['general'] = 'Lỗi cơ sở dữ liệu: ' . $msg;
            }

            return [
                'success' => false,
                'errors'  => $errors
            ];
        }
    }

    // Cập nhật Attribute
    public function update($id, $data) {
        try {
            $stmt = $this->pdo->prepare(
                "CALL update_attribute_safe(:id, :product_id, :name, :value)"
            );
            $stmt->execute([
                ':id' => $id,
                ':product_id' => $data['product_id'],
                ':name' => $data['name'],
                ':value' => $data['value'],
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

    // Xóa Attribute
    public function delete2($id, $product_id) {
        try {
            $stmt = $this->pdo->prepare(
                "CALL delete_attribute_safe(:id, :product_id)"
            );
    
            $stmt->execute([
                ':id' => $id,
                ':product_id' => $product_id,
            ]);
    
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
