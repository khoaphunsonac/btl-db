<?php
require_once __DIR__ . '/BaseModel.php';

class Product extends BaseModel
{
    protected $table = 'Product';
    
    /**
     * Get product by code
     */
    public function getByCode($code)
    {
        $sql = "SELECT * FROM {$this->table} WHERE product_code = :code";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':code', $code);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Get products by category
     */
    public function getByCategory($categoryId, $limit = 10, $offset = 0)
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE category_id = :category_id 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get products by brand
     */
    public function getByBrand($brand, $limit = 10, $offset = 0)
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE brand = :brand 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':brand', $brand);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
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
