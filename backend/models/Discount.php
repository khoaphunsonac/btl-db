<?php
require_once __DIR__ . '/BaseModel.php';

class Discount extends BaseModel
{
    protected $table = 'Discount';
    
    /**
     * Get discount by code
     */
    public function getByCode($code)
    {
        $sql = "SELECT * FROM {$this->table} WHERE discount_code = :code";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':code', $code);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Get active discounts
     */
    public function getActive()
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                AND valid_from <= NOW() 
                AND valid_to >= NOW() 
                ORDER BY created_at DESC";
        
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Validate discount
     */
    public function validate($code, $orderTotal)
    {
        $discount = $this->getByCode($code);
        
        if (!$discount) {
            return ['valid' => false, 'message' => 'Mã giảm giá không tồn tại'];
        }
        
        if (!$discount['is_active']) {
            return ['valid' => false, 'message' => 'Mã giảm giá đã bị vô hiệu hóa'];
        }
        
        $now = date('Y-m-d H:i:s');
        if ($now < $discount['valid_from']) {
            return ['valid' => false, 'message' => 'Mã giảm giá chưa có hiệu lực'];
        }
        
        if ($now > $discount['valid_to']) {
            return ['valid' => false, 'message' => 'Mã giảm giá đã hết hạn'];
        }
        
        if ($orderTotal < $discount['min_order_value']) {
            return [
                'valid' => false, 
                'message' => 'Giá trị đơn hàng tối thiểu: ' . number_format($discount['min_order_value']) . ' đ'
            ];
        }
        
        return [
            'valid' => true,
            'discount' => $discount,
            'message' => 'Mã giảm giá hợp lệ'
        ];
    }
    
    /**
     * Calculate discount amount
     */
    public function calculateAmount($discount, $orderTotal)
    {
        if ($discount['discount_type'] === 'percentage') {
            $amount = ($orderTotal * $discount['discount_value']) / 100;
            
            if ($discount['max_discount_value'] > 0) {
                $amount = min($amount, $discount['max_discount_value']);
            }
            
            return $amount;
        } else {
            return $discount['discount_value'];
        }
    }
    
    /**
     * Toggle active status
     */
    public function toggleActive($id)
    {
        $sql = "UPDATE {$this->table} 
                SET is_active = NOT is_active 
                WHERE id = :id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
}
