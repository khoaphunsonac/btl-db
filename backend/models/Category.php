<?php
require_once __DIR__ . '/BaseModel.php';

class Category extends BaseModel
{
    protected $table = 'Category';
    
    /**
     * Get category tree (hierarchical)
     */
    public function getTree($parentId = null)
    {
        $where = $parentId === null ? 'WHERE parent_id IS NULL' : 'WHERE parent_id = :parent_id';
        
        $sql = "SELECT * FROM {$this->table} $where ORDER BY name ASC";
        $stmt = $this->pdo->prepare($sql);
        
        if ($parentId !== null) {
            $stmt->bindValue(':parent_id', $parentId, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        $categories = $stmt->fetchAll();
        
        // Recursively get children
        foreach ($categories as &$category) {
            $category['children'] = $this->getTree($category['id']);
        }
        
        return $categories;
    }
    
    /**
     * Get leaf categories (categories without children)
     */
    public function getLeafCategories()
    {
        $sql = "SELECT c.* FROM {$this->table} c 
                WHERE NOT EXISTS (
                    SELECT 1 FROM {$this->table} c2 
                    WHERE c2.parent_id = c.id
                )
                ORDER BY c.name ASC";
        
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Check if category is leaf
     */
    public function isLeaf($id)
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE parent_id = :id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return $result['count'] == 0;
    }
    
    /**
     * Get children categories
     */
    public function getChildren($parentId)
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE parent_id = :parent_id 
                ORDER BY name ASC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':parent_id', $parentId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Check if category has products
     */
    public function hasProducts($id)
    {
        $sql = "SELECT COUNT(*) as count FROM Product 
                WHERE category_id = :id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
}
