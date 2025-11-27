<?php
require_once __DIR__ . '/BaseModel.php';

class Contact extends BaseModel
{
    protected $table = 'Contact';
    
    /**
     * Get contacts by status
     */
    public function getByStatus($status, $limit = 10, $offset = 0)
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE status = :status 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get pending contacts
     */
    public function getPending($limit = 10, $offset = 0)
    {
        return $this->getByStatus('pending', $limit, $offset);
    }
    
    /**
     * Update status
     */
    public function updateStatus($id, $status)
    {
        $sql = "UPDATE {$this->table} SET status = :status WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    /**
     * Count by status
     */
    public function countByStatus($status)
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE status = :status";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':status', $status);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return (int)$result['count'];
    }
}
