<?php
/**
 * Script to automatically fix passwords in database
 * This will hash all plain text passwords
 */

require_once __DIR__ . '/config/database.php';

// Connect to database
$database = Database::getInstance();
$db = $database->getConnection();

echo "<h2>Fix Database Passwords</h2>";
echo "<p>This script will update all admin passwords to use bcrypt hashing</p>";

// Default password for all admins
$defaultPassword = '123456';
$hashedPassword = password_hash($defaultPassword, PASSWORD_DEFAULT);

echo "<div style='background: #fff3cd; padding: 15px; margin: 10px 0; border: 1px solid #ffc107;'>";
echo "<strong>⚠️ WARNING:</strong> This will update ALL admin passwords to: <code>$defaultPassword</code>";
echo "</div>";

// Get all admin accounts
$sql = "SELECT ua.id, ua.email, ua.password, a.role 
        FROM User_Account ua
        INNER JOIN Admin a ON ua.id = a.id";
$stmt = $db->query($sql);
$admins = $stmt->fetchAll();

echo "<h3>Admin Accounts Found: " . count($admins) . "</h3>";

if (count($admins) > 0) {
    echo "<table border='1' cellpadding='5' style='border-collapse: collapse; margin: 10px 0;'>";
    echo "<tr><th>ID</th><th>Email</th><th>Role</th><th>Current Password Status</th></tr>";
    
    foreach ($admins as $admin) {
        $isHashed = strlen($admin['password']) >= 60;
        $status = $isHashed ? '<span style="color: green;">Already Hashed ✓</span>' : '<span style="color: red;">Needs Update ✗</span>';
        
        echo "<tr>";
        echo "<td>{$admin['id']}</td>";
        echo "<td>{$admin['email']}</td>";
        echo "<td>{$admin['role']}</td>";
        echo "<td>$status</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Button to fix
    echo "<form method='post' onsubmit='return confirm(\"Are you sure you want to update all admin passwords?\");'>";
    echo "<input type='hidden' name='fix_passwords' value='1'>";
    echo "<button type='submit' style='padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; font-size: 16px;'>";
    echo "🔧 Fix All Passwords";
    echo "</button>";
    echo "</form>";
}

// Process fix
if (isset($_POST['fix_passwords'])) {
    echo "<hr>";
    echo "<h3>Updating Passwords...</h3>";
    
    try {
        $db->beginTransaction();
        
        $sqlUpdate = "UPDATE User_Account SET password = :password WHERE id = :id";
        $stmtUpdate = $db->prepare($sqlUpdate);
        
        $updated = 0;
        foreach ($admins as $admin) {
            $newHash = password_hash($defaultPassword, PASSWORD_DEFAULT);
            $stmtUpdate->execute([
                ':password' => $newHash,
                ':id' => $admin['id']
            ]);
            $updated++;
            
            echo "<div style='color: green;'>✓ Updated: {$admin['email']} (ID: {$admin['id']})</div>";
        }
        
        $db->commit();
        
        echo "<div style='background: #d4edda; padding: 15px; margin: 15px 0; border: 1px solid #28a745; border-radius: 4px;'>";
        echo "<strong>✓ SUCCESS!</strong><br>";
        echo "Updated $updated admin account(s)<br>";
        echo "All admins can now login with password: <code>$defaultPassword</code>";
        echo "</div>";
        
        echo "<p><a href='test-login.php' style='padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;'>Test Login Now →</a></p>";
        
    } catch (Exception $e) {
        $db->rollBack();
        echo "<div style='background: #f8d7da; padding: 15px; margin: 15px 0; border: 1px solid #dc3545; border-radius: 4px;'>";
        echo "<strong>✗ ERROR!</strong><br>";
        echo "Failed to update passwords: " . $e->getMessage();
        echo "</div>";
    }
}
?>
