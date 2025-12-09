// ==========================================
// POSTMAN SCRIPTS - INSERT CONTACTS
// ==========================================

// ==========================================
// 1. PRE-REQUEST SCRIPT
// ==========================================
// Copy script này vào tab "Pre-request Script" của Collection

// Tạo timestamp động
pm.environment.set("timestamp", new Date().toISOString());

// Random customer_id từ 1-10
pm.environment.set("random_customer_id", Math.floor(Math.random() * 10) + 1);

console.log("Pre-request: Đã set timestamp và random customer_id");


// ==========================================
// 2. TESTS SCRIPT (Tests Tab)
// ==========================================
// Copy script này vào tab "Tests" của Collection hoặc từng Request

// Test 1: Kiểm tra status code
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});

// Test 2: Kiểm tra response có trường success
pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

// Test 3: Kiểm tra success = true
pm.test("Success is true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

// Test 4: Kiểm tra có message
pm.test("Response has message", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('message');
});

// Test 5: Kiểm tra có data
pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
});

// Test 6: Kiểm tra data có id
pm.test("Data has id field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('id');
});

// Test 7: Kiểm tra id là số
pm.test("ID is a number", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.id).to.be.a('number');
});

// Test 8: Kiểm tra content đã được lưu
pm.test("Content is saved correctly", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('content');
});

// Test 9: Response time < 500ms
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// Test 10: Content-Type là JSON
pm.test("Content-Type is application/json", function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

// Lưu ID vừa tạo vào environment (để dùng cho các request khác)
var jsonData = pm.response.json();
if (jsonData.success && jsonData.data && jsonData.data.id) {
    pm.environment.set("last_contact_id", jsonData.data.id);
    console.log("Saved contact ID: " + jsonData.data.id);
}


// ==========================================
// 3. COLLECTION PRE-REQUEST SCRIPT
// ==========================================
// Dùng cho Collection Runner - thêm vào Collection Settings

// Setup base URL
pm.collectionVariables.set("base_url", "http://localhost/btl-db/backend/routes/api.php");

// Setup headers
pm.request.headers.add({
    key: 'Content-Type',
    value: 'application/json'
});

console.log("Collection Pre-request: Base URL and Headers set");


// ==========================================
// 4. DYNAMIC DATA GENERATOR
// ==========================================
// Generate random contact content

const contactTemplates = [
    "Tôi muốn hỏi về sản phẩm {product}",
    "Khi nào có {product} về?",
    "Giá {product} bao nhiêu?",
    "{product} còn hàng không?",
    "Tôi muốn đặt {product}",
    "Chất lượng {product} như thế nào?",
    "{product} có bảo hành không?",
    "Phí ship cho {product} là bao nhiêu?",
    "Tôi có thể xem {product} trước khi mua không?",
    "{product} có màu nào khác không?"
];

const products = [
    "balo học sinh",
    "túi xách công sở",
    "ba lô du lịch",
    "túi đeo chéo",
    "cặp sách",
    "túi laptop",
    "balo thời trang",
    "túi đựng giày",
    "túi tote",
    "ví cầm tay"
];

function generateRandomContact() {
    const template = contactTemplates[Math.floor(Math.random() * contactTemplates.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    return template.replace("{product}", product);
}

// Sử dụng trong Pre-request Script
pm.environment.set("random_content", generateRandomContact());


// ==========================================
// 5. BULK INSERT SCRIPT
// ==========================================
// Script để insert nhiều contacts cùng lúc

const numberOfContacts = 10; // Số lượng contacts muốn tạo

const bulkContacts = [];
for (let i = 1; i <= numberOfContacts; i++) {
    bulkContacts.push({
        customer_id: Math.floor(Math.random() * 10) + 1,
        content: generateRandomContact()
    });
}

pm.environment.set("bulk_contacts", JSON.stringify(bulkContacts));
console.log("Generated " + numberOfContacts + " contacts for bulk insert");


// ==========================================
// 6. ERROR HANDLING TEST
// ==========================================
// Test cho các trường hợp lỗi

if (pm.response.code !== 201) {
    pm.test("Error response has message", function () {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('message');
    });
    
    if (pm.response.code === 400) {
        pm.test("400 - Bad Request has errors", function () {
            var jsonData = pm.response.json();
            pm.expect(jsonData).to.have.property('errors');
        });
    }
    
    if (pm.response.code === 500) {
        pm.test("500 - Internal Server Error", function () {
            console.error("Server error occurred");
        });
    }
}


// ==========================================
// 7. DATA VALIDATION
// ==========================================
// Validate dữ liệu trước khi gửi (Pre-request Script)

var requestBody = JSON.parse(pm.request.body.raw);

// Validate content không rỗng
if (!requestBody.content && !requestBody.message) {
    console.error("ERROR: Content is required!");
    throw new Error("Content is required");
}

// Validate content length
const content = requestBody.content || requestBody.message;
if (content.length > 255) {
    console.error("ERROR: Content too long (max 255 characters)");
    throw new Error("Content exceeds maximum length");
}

// Validate customer_id là số hoặc null
if (requestBody.customer_id !== null && 
    requestBody.customer_id !== undefined && 
    typeof requestBody.customer_id !== 'number') {
    console.error("ERROR: customer_id must be a number or null");
    throw new Error("Invalid customer_id");
}

console.log("✓ Data validation passed");


// ==========================================
// 8. PERFORMANCE MONITORING
// ==========================================
// Monitor API performance

var responseTime = pm.response.responseTime;

if (responseTime < 100) {
    console.log("⚡ Excellent performance: " + responseTime + "ms");
} else if (responseTime < 300) {
    console.log("✓ Good performance: " + responseTime + "ms");
} else if (responseTime < 500) {
    console.log("⚠ Acceptable performance: " + responseTime + "ms");
} else {
    console.log("🐌 Slow performance: " + responseTime + "ms");
}

// Lưu performance metrics
pm.environment.set("avg_response_time", responseTime);


// ==========================================
// 9. AUTO INCREMENT CUSTOMER ID
// ==========================================
// Tự động tăng customer_id cho mỗi request

var currentCustomerId = pm.environment.get("current_customer_id") || 1;
pm.environment.set("current_customer_id", (currentCustomerId % 10) + 1);


// ==========================================
// 10. CONSOLE LOGGING
// ==========================================
// Pretty print response

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📩 REQUEST");
console.log("URL:", pm.request.url.toString());
console.log("Method:", pm.request.method);
console.log("Body:", pm.request.body.raw);

console.log("\n📬 RESPONSE");
console.log("Status:", pm.response.code, pm.response.status);
console.log("Time:", pm.response.responseTime + "ms");
console.log("Body:", JSON.stringify(pm.response.json(), null, 2));
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");


// ==========================================
// HƯỚNG DẪN SỬ DỤNG:
// ==========================================
// 1. Copy từng script vào đúng tab tương ứng trong Postman
// 2. Pre-request Script: Chạy TRƯỚC khi gửi request
// 3. Tests Script: Chạy SAU khi nhận response
// 4. Collection Script: Áp dụng cho toàn bộ Collection
// 5. Environment Variables cần tạo:
//    - base_url
//    - timestamp
//    - random_customer_id
//    - random_content
//    - last_contact_id
//    - current_customer_id
