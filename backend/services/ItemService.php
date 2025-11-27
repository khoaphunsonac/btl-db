<?php

require_once __DIR__ . '/../models/Item.php';

/**
 * Item Service
 * Business logic layer for Item operations
 */
class ItemService {
    private $itemModel;
    
    public function __construct($pdo) {
        $this->itemModel = new Item($pdo);
    }
    
    /**
     * Get all items with pagination
     */
    public function getAllItems($page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        $items = $this->itemModel->getAll($limit, $offset);
        $total = $this->itemModel->count();
        
        return [
            'success' => true,
            'data' => $items,
            'pagination' => [
                'current_page' => $page,
                'total_items' => $total,
                'total_pages' => ceil($total / $limit),
                'items_per_page' => $limit
            ]
        ];
    }
    
    /**
     * Get item by ID
     */
    public function getItemById($id) {
        $item = $this->itemModel->getById($id);
        
        if (!$item) {
            return [
                'success' => false,
                'error' => 'Item not found'
            ];
        }
        
        return [
            'success' => true,
            'data' => $item
        ];
    }
    
    /**
     * Create new item
     */
    public function createItem($data) {
        // Validation
        if (empty($data['name'])) {
            return [
                'success' => false,
                'error' => 'Name is required'
            ];
        }
        
        try {
            $itemId = $this->itemModel->create($data);
            return [
                'success' => true,
                'message' => 'Item created successfully',
                'data' => ['id' => $itemId]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to create item: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update item
     */
    public function updateItem($id, $data) {
        // Check if item exists
        $existingItem = $this->itemModel->getById($id);
        if (!$existingItem) {
            return [
                'success' => false,
                'error' => 'Item not found'
            ];
        }
        
        // Validation
        if (empty($data['name'])) {
            return [
                'success' => false,
                'error' => 'Name is required'
            ];
        }
        
        try {
            $this->itemModel->update($id, $data);
            return [
                'success' => true,
                'message' => 'Item updated successfully'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to update item: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Delete item
     */
    public function deleteItem($id) {
        // Check if item exists
        $existingItem = $this->itemModel->getById($id);
        if (!$existingItem) {
            return [
                'success' => false,
                'error' => 'Item not found'
            ];
        }
        
        try {
            $this->itemModel->delete($id);
            return [
                'success' => true,
                'message' => 'Item deleted successfully'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to delete item: ' . $e->getMessage()
            ];
        }
    }
}
