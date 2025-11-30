<?php
require_once __DIR__ . '/BaseModel.php';

class Discount extends BaseModel
{
    protected $table = 'Discount';

    /**
     * Get all discounts with search, filter, sort, pagination
     */
    public function getAll($page = 1, $limit = 2, $filters = []) {
        $offset = ($page - 1) * $limit;
        $params = []; // lưu các ràng buộc
        $whereClauses = []; // điều kiện lọc (WHERE)

        // Search by condition
        if (!empty($filters['search'])) {
            $whereClauses[] = "d.condition LIKE :search";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        // Filter by type (Phần trăm, Giá trị)
        if (!empty($filters['type'])) {
            $whereClauses[] = "d.type = :type";
            $params[':type'] = $filters['type'];
        }

        // Filter by status: active, expired, upcoming
        if (!empty($filters['status'])) {
            switch ($filters['status']) {
                case 'active':
                    $whereClauses[] = "NOW() BETWEEN d.time_start AND d.time_end";
                    break;
                case 'expired':
                    $whereClauses[] = "d.time_end < NOW()";
                    break;
                case 'upcoming':
                    $whereClauses[] = "d.time_start > NOW()";
                    break;
            }
        }

        $whereSQL = !empty($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';

        // Sorting ORDER BY
        $orderBy = 'd.id DESC';
        if (!empty($filters['sortBy'])) {
            switch ($filters['sortBy']) {
                case 'value-asc':
                    $orderBy = 'd.value ASC';
                    break;
                case 'value-desc':
                    $orderBy = 'd.value DESC';
                    break;
                case 'time-start-asc':
                    $orderBy = 'd.time_start ASC';
                    break;
                case 'time-start-desc':
                    $orderBy = 'd.time_start DESC';
                    break;
            }
        }

        // Main query
        $sql = "SELECT 
                    d.id,
                    d.value,
                    d.condition,
                    d.time_start,
                    d.time_end,
                    d.type
                FROM Discount d
                $whereSQL
                ORDER BY $orderBy
                LIMIT :limit OFFSET :offset";

        $stmt = $this->pdo->prepare($sql); // Statement

        // Bind filter params
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        // Bind pagination
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();

        $data = $stmt->fetchAll();

        // Count total
        $sqlCount = "SELECT COUNT(*) AS total FROM Discount d $whereSQL";
        $stmtCount = $this->pdo->prepare($sqlCount);

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
     * Get discount by ID
     */
    public function getById($id)
    {
        $sql = "SELECT * FROM Discount WHERE id = :id";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Create discount
     */
    public function create($data)
    {
        $sql = "INSERT INTO Discount (value, `condition`, time_start, time_end, type)
                VALUES (:value, :condition, :time_start, :time_end, :type)";

        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute([
            ':value' => $data['value'],
            ':condition' => $data['condition'],
            ':time_start' => $data['time_start'],
            ':time_end' => $data['time_end'],
            ':type' => $data['type']
        ]);
    }

    /**
     * Update discount
     */
    public function update($id, $data)
    {
        $sql = "UPDATE Discount 
                SET value = :value,
                    `condition` = :condition,
                    time_start = :time_start,
                    time_end = :time_end,
                    type = :type
                WHERE id = :id";

        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute([
            ':value' => $data['value'],
            ':condition' => $data['condition'],
            ':time_start' => $data['time_start'],
            ':time_end' => $data['time_end'],
            ':type' => $data['type'],
            ':id' => $id
        ]);
    }

    /**
     * Delete discount
     */
    public function delete($id)
    {
        $sql = "DELETE FROM Discount WHERE id = :id";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }
}
