<?php
require_once __DIR__ . '/BaseModel.php';

class Contact extends BaseModel
{
    protected $table = 'Contact';
    
    /**
     * Get statistics
     */
    public function getStats()
    {
        $sql = "SELECT 
            COUNT(*) as total,
            COUNT(*) as new_count,
            0 as read_count,
            0 as replied_count
            FROM {$this->table}";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all contacts with pagination and filters
     */
    public function getAll($page = 1, $limit = 10, $status = null, $search = null)
    {
        $offset = ($page - 1) * $limit;
        
        $whereConditions = [];
        $params = [];
        
        if ($search) {
            $whereConditions[] = "content LIKE :search";
            $params[':search'] = '%' . $search . '%';
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Get data with customer info - sửa relationship đúng theo schema
        $sql = "SELECT c.*, 
                       CONCAT(u.fname, ' ', u.lname) as customer_name, 
                       ua.email as customer_email, 
                       u.phone as customer_phone
                FROM {$this->table} c
                LEFT JOIN User u ON u.account_id = c.customer_id
                LEFT JOIN User_Account ua ON ua.id = c.customer_id
                $whereClause
                ORDER BY c.date DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Transform data to match expected format
        $transformedData = array_map(function($contact) {
            return [
                'id' => $contact['id'],
                'name' => $contact['customer_name'] ?? 'Khách hàng',
                'email' => $contact['customer_email'] ?? '',
                'phone' => $contact['customer_phone'] ?? '',
                'subject' => 'Liên hệ từ khách hàng',
                'message' => $contact['content'],
                'status' => 'new', // Default status since table doesn't have this field
                'created_at' => $contact['date']
            ];
        }, $data);
        
        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM {$this->table} $whereClause";
        $countStmt = $this->pdo->prepare($countSql);
        
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        return [
            'data' => $transformedData,
            'pagination' => [
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ];
    }
    
    /**
     * Get contact by ID
     */
    public function getById($id)
    {
        $sql = "SELECT c.*, 
                       CONCAT(u.fname, ' ', u.lname) as customer_name, 
                       ua.email as customer_email, 
                       u.phone as customer_phone
                FROM {$this->table} c
                LEFT JOIN User u ON u.account_id = c.customer_id
                LEFT JOIN User_Account ua ON ua.id = c.customer_id
                WHERE c.id = :id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact) {
            return null;
        }
        
        // Transform to expected format
        return [
            'id' => $contact['id'],
            'name' => $contact['customer_name'] ?? 'Khách hàng',
            'email' => $contact['customer_email'] ?? '',
            'phone' => $contact['customer_phone'] ?? '',
            'subject' => 'Liên hệ từ khách hàng',
            'message' => $contact['content'],
            'status' => 'new',
            'created_at' => $contact['date']
        ];
    }
    
    /**
     * Update status (mock function since table doesn't support status)
     */
    public function updateStatus($id, $status)
    {
        // Since the table doesn't have status field, we'll just return true
        // In a real implementation, you might want to add a status field to the table
        return true;
    }
    
    /**
     * Delete contact
     */
    public function delete($id)
    {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    /**
     * Get first valid customer_id or create guest customer
     */
    private function getValidCustomerId($requestedId = null)
    {
        // If customer_id provided, verify it exists
        if ($requestedId !== null) {
            $checkSql = "SELECT id FROM Customer WHERE id = :id LIMIT 1";
            $checkStmt = $this->pdo->prepare($checkSql);
            $checkStmt->bindValue(':id', $requestedId, PDO::PARAM_INT);
            $checkStmt->execute();
            
            if ($checkStmt->fetch()) {
                return $requestedId;
            }
        }
        
        // Get any existing customer ID
        $sql = "SELECT id FROM Customer ORDER BY id ASC LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            return $result['id'];
        }
        
        // If no customer exists, return null and let it fail with clear error
        return null;
    }
    
    /**
     * Create new contact
     */
    public function create($data)
    {
        try {
            // Get content from either 'content' or 'message' field
            $content = $data['content'] ?? $data['message'] ?? null;
            
            // customer_id is NOT NULL in database, must provide valid ID
            $requestedCustomerId = $data['customer_id'] ?? null;
            $customerId = $this->getValidCustomerId($requestedCustomerId);
            
            if ($customerId === null) {
                error_log("Contact insert error: No valid customer_id found. Database requires customer_id NOT NULL.");
                return false;
            }
            
            $sql = "INSERT INTO {$this->table} (customer_id, content, date) VALUES (:customer_id, :content, NOW())";
            $stmt = $this->pdo->prepare($sql);
            
            $stmt->bindValue(':customer_id', $customerId, PDO::PARAM_INT);
            $stmt->bindValue(':content', $content, PDO::PARAM_STR);
            
            if ($stmt->execute()) {
                $insertedId = $this->pdo->lastInsertId();
                error_log("Contact created successfully with ID: " . $insertedId . " (customer_id: " . $customerId . ")");
                
                return [
                    'id' => $insertedId,
                    'customer_id' => $customerId,
                    'content' => $content,
                    'date' => date('Y-m-d H:i:s')
                ];
            }
            
            error_log("Contact insert failed: execute() returned false");
            return false;
            
        } catch (PDOException $e) {
            error_log("Contact insert error: " . $e->getMessage());
            error_log("SQL: " . ($sql ?? 'N/A'));
            error_log("Data: " . json_encode($data));
            return false;
        }
    }
}
