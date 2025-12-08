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
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get low stock products
     */
    public function getLowStock($threshold = 10)
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE stock <= :threshold AND stock > 0 
                ORDER BY stock ASC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':threshold', $threshold, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Update stock
     */
    public function updateStock($id, $quantity)
    {
        $sql = "UPDATE {$this->table} 
                SET stock = stock + :quantity 
                WHERE id = :id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':quantity', $quantity, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    /**
     * Get product variants
     */
    public function getVariants($productId)
    {
        $sql = "SELECT * FROM Product_Variant WHERE product_id = :product_id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get product images
     */
    public function getImages($productId)
    {
        $sql = "SELECT * FROM Product_Image 
                WHERE product_id = :product_id 
                ORDER BY priority ASC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
}
