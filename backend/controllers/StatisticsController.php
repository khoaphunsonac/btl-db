<?php
class StatisticsController {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * GET /api/statistics/dashboard
     * Lấy thống kê tổng quan cho dashboard
     */
    public function dashboard() {
        $data = [
            'total_revenue' => $this->getTotalRevenue(),
            'total_orders' => $this->getTotalOrders(),
            'total_customers' => $this->getTotalCustomers(),
            'total_products' => $this->getTotalProducts(),
            'pending_orders' => $this->getPendingOrders(),
            'low_stock_products' => $this->getLowStockProducts(),
            'revenue_chart' => $this->getRevenueChart(),
            'top_selling_products' => $this->getTopSellingProducts(),
            'recent_orders' => $this->getRecentOrders()
        ];
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $data]);
    }
    
    /**
     * GET /api/statistics/revenue
     * Thống kê doanh thu theo khoảng thời gian
     */
    public function revenue() {
        $fromDate = $_GET['from_date'] ?? date('Y-m-01');
        $toDate = $_GET['to_date'] ?? date('Y-m-d');
        $groupBy = $_GET['group_by'] ?? 'day'; // day, week, month
        
        $data = $this->getRevenueByPeriod($fromDate, $toDate, $groupBy);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $data]);
    }
    
    /**
     * GET /api/statistics/products
     * Thống kê sản phẩm bán chạy
     */
    public function products() {
        $limit = $_GET['limit'] ?? 10;
        $fromDate = $_GET['from_date'] ?? null;
        $toDate = $_GET['to_date'] ?? null;
        
        $data = $this->getTopSellingProducts($limit, $fromDate, $toDate);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $data]);
    }
    
    /**
     * GET /api/statistics/categories
     * Thống kê theo danh mục
     */
    public function categories() {
        $data = $this->getCategoryStatistics();
        
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $data]);
    }
    
    private function getTotalRevenue() {
        $query = "SELECT COALESCE(SUM(total_cost), 0) as total 
                  FROM `Order` o
                  WHERE payment_status = 'Đã thanh toán'";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    }
    
    private function getTotalOrders() {
        $query = "SELECT COUNT(*) as total FROM `Order`";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    }
    
    private function getTotalCustomers() {
        $query = "SELECT COUNT(*) as total FROM Customer";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    }
    
    private function getTotalProducts() {
        $query = "SELECT COUNT(*) as total FROM Product WHERE status = 'Còn hàng'";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    }
    
    private function getPendingOrders() {
        $query = "SELECT COUNT(DISTINCT o.id) as total 
                  FROM `Order` o
                  JOIN Order_status_log osl ON o.id = osl.order_id
                  WHERE osl.status = 'Chờ xử lí'
                  AND osl.time = (SELECT MAX(time) FROM Order_status_log WHERE order_id = o.id)";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    }
    
    private function getLowStockProducts($threshold = 10) {
        $query = "SELECT COUNT(*) as total FROM Product_variant WHERE quantity < :threshold";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':threshold', $threshold, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    }
    
    private function getRevenueChart() {
        $query = "SELECT DATE(date) as date, COALESCE(SUM(total_cost), 0) as revenue 
                  FROM `Order` 
                  WHERE payment_status = 'Đã thanh toán' AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                  GROUP BY DATE(date)
                  ORDER BY date";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getTopSellingProducts($limit = 10, $fromDate = null, $toDate = null) {
        $query = "SELECT p.id, p.name, SUM(od.quantity) as total_sold, SUM(od.total_cost) as revenue
                  FROM Product p
                  JOIN Product_variant pv ON p.id = pv.product_id
                  JOIN Order_detail od ON pv.id = od.product_variant_id
                  JOIN `Order` o ON od.order_id = o.id
                  WHERE o.payment_status = 'Đã thanh toán'";
        
        if ($fromDate) $query .= " AND o.date >= :from_date";
        if ($toDate) $query .= " AND o.date <= :to_date";
        
        $query .= " GROUP BY p.id ORDER BY total_sold DESC LIMIT :limit";
        
        $stmt = $this->db->prepare($query);
        if ($fromDate) $stmt->bindParam(':from_date', $fromDate);
        if ($toDate) $stmt->bindParam(':to_date', $toDate);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getRecentOrders($limit = 5) {
        $query = "SELECT o.*, CONCAT(u.fname, ' ', u.lname) as customer_name 
                  FROM `Order` o 
                  JOIN User u ON o.customer_id = u.account_id 
                  ORDER BY o.date DESC 
                  LIMIT :limit";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getRevenueByPeriod($fromDate, $toDate, $groupBy) {
        $dateFormat = $groupBy === 'month' ? '%Y-%m' : ($groupBy === 'week' ? '%Y-%u' : '%Y-%m-%d');
        
        $query = "SELECT DATE_FORMAT(date, :format) as period, COALESCE(SUM(total_cost), 0) as revenue, COUNT(*) as orders
                  FROM `Order` 
                  WHERE payment_status = 'Đã thanh toán' AND date BETWEEN :from_date AND :to_date
                  GROUP BY period
                  ORDER BY period";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':format', $dateFormat);
        $stmt->bindParam(':from_date', $fromDate);
        $stmt->bindParam(':to_date', $toDate);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getCategoryStatistics() {
        $query = "SELECT c.id, c.name, COUNT(DISTINCT p.id) as product_count, 
                  COALESCE(SUM(od.quantity), 0) as total_sold,
                  COALESCE(SUM(od.total_cost), 0) as revenue
                  FROM Category c
                  LEFT JOIN Product_categorize pc ON c.id = pc.category_id
                  LEFT JOIN Product p ON pc.product_id = p.id
                  LEFT JOIN Product_variant pv ON p.id = pv.product_id
                  LEFT JOIN Order_detail od ON pv.id = od.product_variant_id
                  LEFT JOIN `Order` o ON od.order_id = o.id AND o.payment_status = 'Đã thanh toán'
                  GROUP BY c.id
                  ORDER BY revenue DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
