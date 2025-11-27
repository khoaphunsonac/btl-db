<?php

/**
 * Item Model
 * Sample model for demonstrating MVC structure
 */
class Item {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Get all items with pagination
     */
    public function getAll($limit = 10, $offset = 0) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM items 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }
    
    /**
     * Get item by ID
     */
    public function getById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM items WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    /**
     * Create new item
     */
    public function create($data) {
        $stmt = $this->pdo->prepare("
            INSERT INTO items (name, description, status)
            VALUES (?, ?, ?)
        ");
        
        $stmt->execute([
            $data['name'],
            $data['description'] ?? null,
            $data['status'] ?? 'active'
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Update item
     */
    public function update($id, $data) {
        $stmt = $this->pdo->prepare("
            UPDATE items 
            SET name = ?, description = ?, status = ?, updated_at = NOW()
            WHERE id = ?
        ");
        
        return $stmt->execute([
            $data['name'],
            $data['description'] ?? null,
            $data['status'] ?? 'active',
            $id
        ]);
    }
    
    /**
     * Delete item
     */
    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM items WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    /**
     * Count total items
     */
    public function count() {
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM items");
        $result = $stmt->fetch();
        return $result['total'];
    }
}
