<?php
/**
 * Base Model for NEMTHUNG E-commerce
 * All models extend from this base class
 */

abstract class BaseModel
{
    protected $pdo;
    protected $table;
    protected $dateColumn = 'created_at';


    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    
    /**
     * Get all records with pagination
     */
    public function getAll($limit = 10, $offset = 0, $conditions = [])
    {
        $where = '';
        $params = [];
        
        if (!empty($conditions)) {
            $whereClauses = [];
            foreach ($conditions as $key => $value) {
                $whereClauses[] = "$key = :$key";
                $params[":$key"] = $value;
            }
            $where = 'WHERE ' . implode(' AND ', $whereClauses);
        }
        
        $sql = "SELECT * FROM {$this->table} $where 
                ORDER BY {$this->dateColumn} DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get total count
     */
    public function getTotalCount($conditions = [])
    {
        $where = '';
        $params = [];
        
        if (!empty($conditions)) {
            $whereClauses = [];
            foreach ($conditions as $key => $value) {
                $whereClauses[] = "$key = :$key";
                $params[":$key"] = $value;
            }
            $where = 'WHERE ' . implode(' AND ', $whereClauses);
        }
        
        $sql = "SELECT COUNT(*) as total FROM {$this->table} $where";
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $result = $stmt->fetch();
        
        return (int)$result['total'];
    }
    
    /**
     * Get single record by ID
     */
    public function getById($id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Create new record
     */
    public function create($data)
    {
        $keys = array_keys($data);
        $fields = implode(', ', $keys);
        $placeholders = ':' . implode(', :', $keys);
        
        $sql = "INSERT INTO {$this->table} ($fields) VALUES ($placeholders)";
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($data as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        
        $stmt->execute();
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Update record
     */
    public function update($id, $data)
    {
        $setParts = [];
        foreach (array_keys($data) as $key) {
            $setParts[] = "$key = :$key";
        }
        $setClause = implode(', ', $setParts);
        
        $sql = "UPDATE {$this->table} SET $setClause WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($data as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    /**
     * Delete record
     */
    public function delete($id)
    {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    /**
     * Search records
     */
    public function search($keyword, $searchFields = [], $limit = 10, $offset = 0)
    {
        if (empty($searchFields)) {
            return $this->getAll($limit, $offset);
        }
        
        $conditions = [];
        foreach ($searchFields as $field) {
            $conditions[] = "$field LIKE :keyword";
        }
        $whereClause = implode(' OR ', $conditions);
        
        $sql = "SELECT * FROM {$this->table} 
                WHERE $whereClause 
                ORDER BY {$this->dateColumn} DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':keyword', "%$keyword%");
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Execute raw query
     */
    protected function query($sql, $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        return $stmt;
    }
}
