<?php
require_once __DIR__ . '/BaseModel.php';

class User extends BaseModel
{
    protected $table = 'User_Account';
    
    /**
     * Override getAll to join with User and Customer tables
     * Support search, filter, and sorting
     */
    public function getAll($page = 1, $limit = 10, $filters = [])
    {
        $offset = ($page - 1) * $limit;
        $params = [];
        
        // Build WHERE clauses
        $whereClauses = [];
        
        // Search filter (name, email, phone)
        if (!empty($filters['search'])) {
            $searchTerm = '%' . $filters['search'] . '%';
            $whereClauses[] = "(CONCAT(u.fname, ' ', u.lname) LIKE :search 
                                OR ua.email LIKE :search 
                                OR u.phone LIKE :search)";
            $params[':search'] = $searchTerm;
        }
        
        // Status filter
        if (!empty($filters['status'])) {
            $whereClauses[] = "ua.status = :status";
            $params[':status'] = $filters['status'];
        }
        
        $whereSQL = !empty($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';
        
        // Build ORDER BY clause
        $orderBy = 'ua.id DESC'; // Default
        if (!empty($filters['sortBy'])) {
            switch ($filters['sortBy']) {
                case 'id-asc':
                    $orderBy = 'ua.id ASC';
                    break;
                case 'id-desc':
                    $orderBy = 'ua.id DESC';
                    break;
                case 'name-asc':
                    $orderBy = 'u.lname ASC, u.fname ASC';
                    break;
                case 'name-desc':
                    $orderBy = 'u.lname DESC, u.fname DESC';
                    break;
            }
        }
        
        // Build main query
        $sql = "SELECT 
                    ua.id,
                    ua.email,
                    ua.status,
                    ua.last_login,
                    u.fname,
                    u.lname,
                    u.address,
                    u.phone
                FROM User_Account ua
                INNER JOIN Customer c ON ua.id = c.id
                INNER JOIN User u ON ua.id = u.account_id
                $whereSQL
                ORDER BY $orderBy
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        
        // Bind filter params
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        // Bind pagination params
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $data = $stmt->fetchAll();
        
        // Get total count with same filters
        $sqlCount = "SELECT COUNT(*) as total 
                     FROM User_Account ua
                     INNER JOIN Customer c ON ua.id = c.id
                     INNER JOIN User u ON ua.id = u.account_id
                     $whereSQL";
        $stmtCount = $this->pdo->prepare($sqlCount);
        
        // Bind filter params for count
        foreach ($params as $key => $value) {
            $stmtCount->bindValue($key, $value);
        }
        
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
    
    /**
     * Override getById to get full customer info with statistics
     */
    public function getById($id)
    {
        $sql = "SELECT 
                    ua.id,
                    ua.email,
                    ua.status,
                    ua.last_login,
                    u.fname,
                    u.lname,
                    u.address,
                    u.phone,
                    COUNT(DISTINCT o.id) as total_orders,
                    COALESCE(SUM(CASE WHEN o.payment_status = 'Đã thanh toán' THEN o.total_cost ELSE 0 END), 0) as total_spent,
                    COUNT(DISTINCT CASE WHEN o.payment_status = 'Đã thanh toán' THEN o.id END) as completed_orders
                FROM User_Account ua
                LEFT JOIN Customer c ON ua.id = c.id
                LEFT JOIN User u ON ua.id = u.account_id
                LEFT JOIN `Order` o ON ua.id = o.customer_id
                WHERE ua.id = :id
                GROUP BY ua.id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Check if email exists
     */
    public function emailExists($email)
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE email = :email";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':email', $email);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
    
    /**
     * Get user by email
     */
    public function getByEmail($email)
    {
        $sql = "SELECT 
                    ua.*,
                    u.fname,
                    u.lname,
                    u.address,
                    u.phone,
                    CASE 
                        WHEN a.id IS NOT NULL THEN a.role
                        WHEN c.id IS NOT NULL THEN 'customer'
                        ELSE 'customer'
                    END as role
                FROM {$this->table} ua
                LEFT JOIN User u ON ua.id = u.account_id
                LEFT JOIN Admin a ON ua.id = a.id
                LEFT JOIN Customer c ON ua.id = c.id
                WHERE ua.email = :email";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':email', $email);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Get user by phone
     */
    public function getByPhone($phone)
    {
        $sql = "SELECT ua.*, u.fname, u.lname, u.address, u.phone
                FROM {$this->table} ua
                LEFT JOIN User u ON ua.id = u.account_id
                WHERE u.phone = :phone";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':phone', $phone);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Check if user has pending orders
     */
    public function hasPendingOrders($userId)
    {
        $sql = "SELECT COUNT(*) as count FROM `Order` 
                WHERE customer_id = :user_id 
                AND status IN ('pending', 'confirmed', 'shipping')";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
    
    /**
     * Update user status
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
     * Update last login timestamp
     */
    public function updateLastLogin($id)
    {
        $sql = "UPDATE {$this->table} SET last_login = NOW() WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    /**
     * Get inactive users (90+ days)
     */
    public function getInactiveUsers()
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE last_login < DATE_SUB(NOW(), INTERVAL 90 DAY)
                AND status = 'active'";
        
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Override create to insert into User_Account, Customer, and User tables
     */
    public function create($data)
    {
        try {
            $this->pdo->beginTransaction();
            
            // 1. Insert into User_Account
            $sqlAccount = "INSERT INTO User_Account (email, password, status, last_login) 
                          VALUES (:email, :password, :status, NOW())";
            $stmtAccount = $this->pdo->prepare($sqlAccount);
            $stmtAccount->execute([
                ':email' => $data['email'],
                ':password' => password_hash($data['password'], PASSWORD_DEFAULT),
                ':status' => $data['status'] ?? 'Hoạt động'
            ]);
            
            $accountId = $this->pdo->lastInsertId();
            
            // 2. Insert into Customer
            $sqlCustomer = "INSERT INTO Customer (id) VALUES (:id)";
            $stmtCustomer = $this->pdo->prepare($sqlCustomer);
            $stmtCustomer->execute([':id' => $accountId]);
            
            // 3. Insert into User
            $sqlUser = "INSERT INTO User (account_id, fname, lname, address, phone) 
                       VALUES (:account_id, :fname, :lname, :address, :phone)";
            $stmtUser = $this->pdo->prepare($sqlUser);
            $stmtUser->execute([
                ':account_id' => $accountId,
                ':fname' => $data['fname'],
                ':lname' => $data['lname'],
                ':address' => $data['address'],
                ':phone' => $data['phone']
            ]);
            
            $this->pdo->commit();
            return ['id' => $accountId];
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Override update to update User_Account and User tables
     */
    public function update($id, $data)
    {
        try {
            $this->pdo->beginTransaction();
            
            // 1. Update User_Account
            $sqlAccount = "UPDATE User_Account SET email = :email, status = :status";
            $params = [
                ':email' => $data['email'],
                ':status' => $data['status'] ?? 'Hoạt động',
                ':id' => $id
            ];
            
            // Add password if provided
            if (!empty($data['password'])) {
                $sqlAccount .= ", password = :password";
                $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            $sqlAccount .= " WHERE id = :id";
            $stmtAccount = $this->pdo->prepare($sqlAccount);
            $stmtAccount->execute($params);
            
            // 2. Update User
            $sqlUser = "UPDATE User 
                       SET fname = :fname, lname = :lname, address = :address, phone = :phone
                       WHERE account_id = :account_id";
            $stmtUser = $this->pdo->prepare($sqlUser);
            $stmtUser->execute([
                ':fname' => $data['fname'],
                ':lname' => $data['lname'],
                ':address' => $data['address'],
                ':phone' => $data['phone'],
                ':account_id' => $id
            ]);
            
            $this->pdo->commit();
            return true;
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Get customer statistics
     */
    public function getStatistics()
    {
        // Total customers
        $sqlTotal = "SELECT COUNT(*) as total FROM Customer";
        $stmtTotal = $this->pdo->query($sqlTotal);
        $total = $stmtTotal->fetch()['total'];
        
        // Active customers
        $sqlActive = "SELECT COUNT(*) as active 
                      FROM Customer c 
                      JOIN User_Account ua ON c.id = ua.id 
                      WHERE ua.status = 'Hoạt động'";
        $stmtActive = $this->pdo->query($sqlActive);
        $active = $stmtActive->fetch()['active'];
        
        // Inactive customers
        $inactive = $total - $active;
        
        // New customers this month
        $sqlNew = "SELECT COUNT(*) as new_count 
                   FROM Customer c 
                   JOIN User_Account ua ON c.id = ua.id 
                   WHERE MONTH(ua.last_login) = MONTH(CURRENT_DATE()) 
                   AND YEAR(ua.last_login) = YEAR(CURRENT_DATE())";
        $stmtNew = $this->pdo->query($sqlNew);
        $newThisMonth = $stmtNew->fetch()['new_count'];
        
        return [
            'total' => (int)$total,
            'active' => (int)$active,
            'inactive' => (int)$inactive,
            'new_this_month' => (int)$newThisMonth
        ];
    }
}
