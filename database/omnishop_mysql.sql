-- Settings table for storing VNPay and MoMo configuration
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_group VARCHAR(50) DEFAULT 'general',
  title VARCHAR(255) DEFAULT '',
  value JSON,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default payment gateway settings
INSERT INTO settings (setting_key, setting_group, title, value, status) VALUES
('vnpay_config', 'payment', 'VNPay Configuration', JSON_OBJECT(
  'tmnCode', '',
  'hashSecret', '',
  'url', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  'returnUrl', 'http://localhost:3000/api/payments/vnpay/return'
), 'active'),
('momo_config', 'payment', 'MoMo Configuration', JSON_OBJECT(
  'partnerCode', '',
  'accessKey', '',
  'secretKey', '',
  'endpoint', 'https://test-payment.momo.vn/v2/gateway/api/create',
  'returnUrl', 'http://localhost:3000/api/payments/momo/return',
  'ipnUrl', 'http://localhost:3000/api/payments/momo/ipn'
), 'active')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Orders table (if not exists)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  customer_address TEXT NOT NULL,
  items JSON NOT NULL,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  voucher_code_used VARCHAR(50),
  total_amount DECIMAL(12,2) NOT NULL,
  shipping_unit VARCHAR(100),
  payment_method ENUM('COD', 'vnpay', 'momo', 'visa', 'bank_transfer') DEFAULT 'COD',
  payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  order_status ENUM('pending', 'processing', 'shipping', 'completed', 'cancelled') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_order_status (order_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table for payment method configurations
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  logo_uri VARCHAR(500),
  status ENUM('active', 'inactive') DEFAULT 'active',
  config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default payment methods
INSERT INTO payments (code, title, status, config) VALUES
('COD', 'Thanh toán khi nhận hàng', 'active', JSON_OBJECT()),
('momo', 'Ví MoMo', 'active', JSON_OBJECT()),
('vnpay', 'VNPay', 'active', JSON_OBJECT()),
('visa', 'Visa / Thẻ quốc tế', 'active', JSON_OBJECT()),
('bank_transfer', 'Chuyển khoản ngân hàng', 'active', JSON_OBJECT())
ON DUPLICATE KEY UPDATE updated_at = NOW();
