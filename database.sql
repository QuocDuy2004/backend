-- VeloCart Expo user schema
-- Source reviewed: E:\du-an-duymedia\velocart-expo-split
-- Supports auth/register/login, account profile editing, checkout defaults,
-- favorites/cart persistence, account metrics, and per-user vouchers.

DROP TABLE IF EXISTS user_vouchers;
DROP TABLE IF EXISTS user_address;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS user_notifications;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_cart;
DROP TABLE IF EXISTS user_favorites;
DROP TABLE IF EXISTS entity_change_logs;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  image TEXT NULL COMMENT 'Category cover image URL for CategoryCard.',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE KEY uq_categories_slug (slug),
  INDEX idx_categories_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE banners (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NULL,

  tag VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  note VARCHAR(255) NULL,
  cta VARCHAR(120) NOT NULL,

  target_path VARCHAR(255) NOT NULL DEFAULT '/(tabs)/catalog' COMMENT 'Expo Router path for CTA navigation.',
  target_params JSON NOT NULL DEFAULT (JSON_OBJECT()) COMMENT 'Optional Expo route params for category/product/url targets.',

  bg_class_name VARCHAR(120) NOT NULL,
  chip_class_name VARCHAR(120) NOT NULL,
  chip_text_class_name VARCHAR(120) NOT NULL,
  button_class_name VARCHAR(120) NOT NULL,
  button_text_color CHAR(7) NOT NULL,
  icon_name VARCHAR(60) NOT NULL COMMENT 'lucide-react-native icon token, for example BadgePercent.',
  detail_icon_name VARCHAR(60) NOT NULL COMMENT 'lucide-react-native icon token for the detail badge.',
  detail_label VARCHAR(120) NOT NULL,

  status ENUM('active', 'inactive', 'scheduled') NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_banners_category (category_id),
  INDEX idx_banners_status_sort (status, sort_order),
  INDEX idx_banners_schedule (starts_at, expires_at),

  CHECK (JSON_VALID(target_params)),
  CONSTRAINT fk_banners_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL COMMENT 'Payment method code used by Expo Order.paymentMethod.',
  title VARCHAR(160) NOT NULL,
  subtitle VARCHAR(255) NULL,
  logo_uri TEXT NULL,
  payment_status_on_order ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  config JSON NOT NULL DEFAULT (JSON_OBJECT()) COMMENT 'Provider-specific setup: VNPay, MoMo, bank transfer, or card merchant credentials.',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_payments_code (code),
  INDEX idx_payments_status_sort (status, sort_order),
  CHECK (JSON_VALID(config))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL,
  setting_group VARCHAR(80) NOT NULL DEFAULT 'general',
  title VARCHAR(160) NOT NULL,
  value JSON NOT NULL DEFAULT (JSON_OBJECT()),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_settings_key (setting_key),
  INDEX idx_settings_group_status (setting_group, status),
  CHECK (JSON_VALID(value))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,

  sku VARCHAR(80) NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL,
  brand VARCHAR(160) NOT NULL,

  images JSON NOT NULL DEFAULT (JSON_ARRAY()) COMMENT 'Product image URLs. First item is the primary image for Expo ProductCard.',

  original_price DECIMAL(14,2) NOT NULL,
  discount_price DECIMAL(14,2) NOT NULL,
  flash_sale_price DECIMAL(14,2) NULL,
  discount_percent INT UNSIGNED NOT NULL DEFAULT 0,

  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  stock INT UNSIGNED NOT NULL DEFAULT 0,

  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  attributes JSON NOT NULL DEFAULT (JSON_ARRAY()) COMMENT 'Expo ProductAttribute[]: name, values.',
  specification JSON NOT NULL DEFAULT (JSON_OBJECT()),
  description TEXT NULL,
  status ENUM('active', 'draft', 'archived') NOT NULL DEFAULT 'active',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_products_sku (sku),
  UNIQUE KEY uq_products_slug (slug),
  INDEX idx_products_category_status (category_id, status),
  INDEX idx_products_brand (brand),
  INDEX idx_products_price (discount_price),
  INDEX idx_products_flags (is_best_seller, is_new),

  CHECK (JSON_VALID(images)),
  CHECK (JSON_VALID(attributes)),
  CHECK (JSON_VALID(specification)),

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE entity_change_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('product', 'category', 'customer', 'banner') NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  entity_name VARCHAR(255) NULL,
  action ENUM('create', 'update', 'delete') NOT NULL,
  summary VARCHAR(255) NOT NULL,
  changes JSON NOT NULL DEFAULT (JSON_OBJECT()),
  actor_id VARCHAR(80) NULL,
  actor_name VARCHAR(160) NOT NULL DEFAULT 'Quản trị viên',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_entity_change_logs_entity (entity_type, entity_id, created_at),
  INDEX idx_entity_change_logs_action (action, created_at),
  CHECK (JSON_VALID(changes))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  username VARCHAR(80) NOT NULL,
  password CHAR(32) NOT NULL COMMENT 'Current backend auth uses MD5(password). Upgrade to password_hash when auth service changes.',

  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  image TEXT NULL COMMENT 'Profile image URL. Replaces avatar/avatarUrl/avatar_url.',

  role ENUM('member', 'seller', 'admin') NOT NULL DEFAULT 'member',
  status ENUM('active', 'blocked', 'deleted') NOT NULL DEFAULT 'active',

  loyalty_points INT UNSIGNED NOT NULL DEFAULT 0,
  orders_count INT UNSIGNED NOT NULL DEFAULT 0,

  last_login_at DATETIME NULL,
  password_changed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_phone (phone),
  INDEX idx_users_role_status (role, status),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_cart (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id VARCHAR(80) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_cart_user_product (user_id, product_id),
  INDEX idx_user_cart_user (user_id),
  INDEX idx_user_cart_product (product_id),

  CONSTRAINT fk_user_cart_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_favorites (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id VARCHAR(80) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_favorites_user_product (user_id, product_id),
  INDEX idx_user_favorites_user (user_id),
  INDEX idx_user_favorites_product (product_id),

  CONSTRAINT fk_user_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(60) NULL COMMENT 'Expo AppNotification.type, for example system or promo.',
  audience ENUM('all', 'user') NOT NULL DEFAULT 'all',
  target_path VARCHAR(255) NULL COMMENT 'Optional Expo Router path opened when the user taps the notification.',
  target_params JSON NOT NULL DEFAULT (JSON_OBJECT()),
  status ENUM('active', 'archived') NOT NULL DEFAULT 'active',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Maps to Expo AppNotification.date.',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_notifications_audience_status (audience, status),
  INDEX idx_notifications_type_date (type, created_at),
  INDEX idx_notifications_created_at (created_at),

  CHECK (JSON_VALID(target_params))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  notification_id INT UNSIGNED NOT NULL,

  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at DATETIME NULL,
  delivered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_notifications_user_notification (user_id, notification_id),
  INDEX idx_user_notifications_user_read (user_id, is_read),
  INDEX idx_user_notifications_notification (notification_id),

  CONSTRAINT fk_user_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_notifications_notification
    FOREIGN KEY (notification_id) REFERENCES notifications(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_address (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,

  city VARCHAR(120) NOT NULL,
  district VARCHAR(120) NOT NULL,
  ward VARCHAR(120) NOT NULL,
  address_detail TEXT NOT NULL COMMENT 'Dia chi cu the: so nha, ten duong, toa nha, ghi chu vi tri.',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_address_user (user_id),
  INDEX idx_user_address_location (city, district, ward),

  CONSTRAINT fk_user_address_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE support_tickets (
  id VARCHAR(80) PRIMARY KEY,
  customer_name VARCHAR(160) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  last_message TEXT NULL,
  status ENUM('open', 'pending', 'solved') NOT NULL DEFAULT 'open',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  sentiment ENUM('positive', 'neutral', 'negative') NOT NULL DEFAULT 'neutral',
  sentiment_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  intent VARCHAR(160) NOT NULL DEFAULT 'General Support',
  confidence_score INT UNSIGNED NOT NULL DEFAULT 0,
  assigned_to_ai TINYINT(1) NOT NULL DEFAULT 1,
  notes TEXT NULL,
  sla_minutes_remaining INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_support_tickets_customer_email (customer_email),
  INDEX idx_support_tickets_status (status, updated_at),
  INDEX idx_support_tickets_priority (priority, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE support_messages (
  id VARCHAR(80) PRIMARY KEY,
  ticket_id VARCHAR(80) NOT NULL,
  sender ENUM('customer', 'ai', 'agent') NOT NULL,
  message_text TEXT NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_support_messages_ticket_time (ticket_id, created_at),
  INDEX idx_support_messages_sender (sender, created_at),
  CONSTRAINT fk_support_messages_ticket
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(80) NULL,
  user_id INT UNSIGNED NULL,
  primary_product_id VARCHAR(80) NULL COMMENT 'First Expo OrderItem.productId for quick single-product checkout lookup.',
  payment_id INT UNSIGNED NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  customer_email VARCHAR(255) NULL,
  customer_address TEXT NOT NULL,
  items JSON NOT NULL,
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  voucher_code_used VARCHAR(80) NULL,
  shipping_unit VARCHAR(120) NOT NULL DEFAULT 'standard',
  payment_method ENUM('COD', 'vnpay', 'momo', 'visa', 'bank_transfer') NOT NULL DEFAULT 'COD',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  order_status ENUM('pending', 'processing', 'shipping', 'completed', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  note TEXT NULL,
  timeline JSON NOT NULL DEFAULT (JSON_ARRAY()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_orders_order_code (order_code),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_primary_product (primary_product_id),
  INDEX idx_orders_payment (payment_id),
  INDEX idx_orders_status_date (order_status, created_at),
  INDEX idx_orders_phone (customer_phone),

  CHECK (JSON_VALID(items)),
  CHECK (JSON_VALID(timeline)),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_orders_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id VARCHAR(80) NOT NULL COMMENT 'Expo OrderItem.productId; kept as text because app product ids are strings.',
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  price DECIMAL(14,2) NOT NULL DEFAULT 0,
  selected_color VARCHAR(120) NULL,
  selected_size VARCHAR(120) NULL,
  selected_version VARCHAR(120) NULL,
  line_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id),

  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,

  name VARCHAR(160) NOT NULL,
  images JSON NOT NULL DEFAULT (JSON_ARRAY()) COMMENT 'Review image URLs. Can store user avatar or review photos.',
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  status ENUM('approved', 'pending', 'hidden') NOT NULL DEFAULT 'approved',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_reviews_product_status (product_id, status),
  INDEX idx_reviews_user (user_id),
  INDEX idx_reviews_created_at (created_at),

  CHECK (JSON_VALID(images)),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (name, slug, image, status, sort_order) VALUES
(
  'Dien thoai & Laptop',
  'dien-thoai-laptop',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
  'active',
  1
),
(
  'Thoi trang',
  'thoi-trang',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80',
  'active',
  2
),
(
  'Gia dung',
  'gia-dung',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
  'active',
  3
),
(
  'Phu kien so',
  'phu-kien-so',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  'active',
  4
),
(
  'Lam dep',
  'lam-dep',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
  'active',
  5
);

INSERT INTO banners (
  category_id, tag, title, description, note, cta, target_path, target_params,
  bg_class_name, chip_class_name, chip_text_class_name,
  button_class_name, button_text_color, icon_name, detail_icon_name, detail_label,
  status, sort_order
) VALUES
(
  (SELECT id FROM categories WHERE slug = 'dien-thoai-laptop'),
  'HOT SALE',
  'Xa kho cong nghe, uu dai den 50%',
  'Dien thoai, laptop va phu kien dang duoc day len trang chu voi muc gia rat de chot don.',
  'Cap nhat deal moi luc 10:00 va 20:00 moi ngay',
  'Xem deal cong nghe',
  '/(tabs)/catalog',
  JSON_OBJECT('categorySlug', 'dien-thoai-laptop'),
  'bg-amber-700',
  'bg-amber-300',
  'text-amber-950',
  'bg-white',
  '#18181b',
  'BadgePercent',
  'ShieldCheck',
  'Hang chinh hang',
  'active',
  1
),
(
  (SELECT id FROM categories WHERE slug = 'thoi-trang'),
  'FASHION WEEK',
  'Thoi trang he, phoi san pham gon va de mua',
  'Ao khoac gio, dam midi va phu kien duoc gom thanh nhom banner de khach vuot danh muc nhanh hon.',
  'Bo suu tap moi them hang vao thu 2, 4, 6',
  'Kham pha thoi trang',
  '/(tabs)/catalog',
  JSON_OBJECT('categorySlug', 'thoi-trang'),
  'bg-rose-700',
  'bg-rose-200',
  'text-rose-950',
  'bg-zinc-950',
  '#ffffff',
  'Shirt',
  'Sparkles',
  'Phong cach moi',
  'active',
  2
),
(
  NULL,
  'FREESHIP MAX',
  'Giao nhanh toan quoc, giam phi cho don tu 150K',
  'Nhom banner van chuyen giup dia voucher, mua hang nhanh va thong tin giao nhan len vung nhan dau tien.',
  'Ap dung voi nhieu gian hang tham gia chuong trinh',
  'Lay ma freeship',
  '/(tabs)/catalog',
  JSON_OBJECT('campaign', 'freeship-max'),
  'bg-emerald-700',
  'bg-emerald-200',
  'text-emerald-950',
  'bg-white',
  '#064e3b',
  'Truck',
  'Truck',
  'Giao 2H noi thanh',
  'active',
  3
);

INSERT INTO payments (
  code, title, subtitle, logo_uri, payment_status_on_order, status, sort_order, config
) VALUES
(
  'COD',
  'Thanh toan khi nhan hang',
  'Kiem tra don roi moi thanh toan',
  NULL,
  'pending',
  'active',
  1,
  JSON_OBJECT(
    'guide', 'Khach hang thanh toan tien mat khi nhan hang.',
    'requiresOnlineCheckout', FALSE
  )
),
(
  'momo',
  'Vi MoMo',
  'Thanh toan nhanh bang vi dien tu',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/MoMo_Logo_App.svg/960px-MoMo_Logo_App.svg.png',
  'paid',
  'active',
  2,
  JSON_OBJECT(
    'partnerCode', '',
    'accessKey', '',
    'secretKey', '',
    'environment', 'sandbox',
    'urlEndpoint', 'https://test-payment.momo.vn/v2/gateway/api/create',
    'requiresOnlineCheckout', TRUE
  )
),
(
  'vnpay',
  'VNPay',
  'Quet ma hoac thanh toan online',
  'https://images.seeklogo.com/logo-png/42/1/vnpay-logo-png_seeklogo-428006.png',
  'paid',
  'active',
  3,
  JSON_OBJECT(
    'vnp_TmnCode', '',
    'vnp_HashSecret', '',
    'urlEndpoint', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    'environment', 'sandbox',
    'requiresOnlineCheckout', TRUE
  )
),
(
  'visa',
  'Visa / Mastercard',
  'The tin dung va the ghi no',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Visa_Brandmark_2021.svg/960px-Visa_Brandmark_2021.svg.png',
  'paid',
  'active',
  4,
  JSON_OBJECT(
    'merchantId', '',
    'secretKey', '',
    'environment', 'sandbox',
    'requiresOnlineCheckout', TRUE
  )
),
(
  'bank_transfer',
  'Chuyen khoan ngan hang',
  'Nhan thong tin tai khoan sau khi dat hang',
  'https://api.vietqr.io/img/VCB.png',
  'pending',
  'active',
  5,
  JSON_OBJECT(
    'bankType', 'Vietcombank',
    'bankLogo', 'https://api.vietqr.io/img/VCB.png',
    'accountNumber', '',
    'accountName', 'VELOCart',
    'transferGuide', 'Vui long chuyen khoan dung noi dung: Ma don hang + so dien thoai.',
    'requiresOnlineCheckout', FALSE
  )
);

INSERT INTO settings (setting_key, setting_group, title, value, status)
VALUES
(
  'ai_customer_support',
  'ai',
  'Cau hinh CSKH bang AI',
  JSON_OBJECT(
    'enabled', TRUE,
    'provider', 'gemini',
    'fallbackProvider', 'chatgpt',
    'language', 'vi',
    'autoReply', FALSE,
    'maxContextMessages', 20,
    'handoffKeywords', JSON_ARRAY('hoan tien', 'khieu nai', 'doi tra', 'gap nhan vien', 'complaint', 'refund'),
    'systemPrompt', 'Ban la tro ly CSKH cua VeloCart. Tra loi ngan gon, lich su, uu tien tieng Viet, hoi them ma don hang khi can.',
    'gemini', JSON_OBJECT(
      'apiKey', '',
      'model', 'gemini-3.5-flash',
      'temperature', 0.4,
      'maxOutputTokens', 1024
    ),
    'chatgpt', JSON_OBJECT(
      'apiKey', '',
      'baseUrl', 'https://api.openai.com/v1',
      'model', 'gpt-4o-mini',
      'temperature', 0.4,
      'maxOutputTokens', 1024
    )
  ),
  'active'
),
(
  'contact_information',
  'contact',
  'Thong tin lien he app thuong mai dien tu',
  JSON_OBJECT(
    'storeName', 'VeloCart',
    'legalName', 'Cong ty TNHH VeloCart Viet Nam',
    'hotline', '0900000000',
    'supportEmail', 'support@velocart.vn',
    'salesEmail', 'sales@velocart.vn',
    'headOfficeAddress', '25 Nguyen Hue, Phuong Ben Nghe, Quan 1, TP.HCM',
    'warehouseAddress', '88 Lang Ha, Quan Dong Da, Ha Noi',
    'supportHours', '08:00 - 21:00 hang ngay',
    'chatChannels', JSON_OBJECT(
      'zalo', '',
      'facebookMessenger', '',
      'liveChat', TRUE
    ),
    'socialLinks', JSON_OBJECT(
      'facebook', '',
      'tiktok', '',
      'instagram', '',
      'youtube', ''
    ),
    'policyContacts', JSON_OBJECT(
      'returnExchange', 'returns@velocart.vn',
      'warranty', 'warranty@velocart.vn',
      'deliverySupport', 'shipping@velocart.vn',
      'complaint', 'complaint@velocart.vn'
    ),
    'returnAddress', 'Kho doi tra VeloCart, 88 Lang Ha, Quan Dong Da, Ha Noi',
    'website', 'https://velocart.vn',
    'appScheme', 'velocart://',
    'mapUrl', '',
    'taxCode', '',
    'businessLicense', ''
  ),
  'active'
);

INSERT INTO products (
  category_id, sku, name, slug, brand, images,
  original_price, discount_price, flash_sale_price, discount_percent,
  rating, review_count, stock, is_new, is_best_seller,
  attributes, specification, description, status
) VALUES
(
  (SELECT id FROM categories WHERE slug = 'dien-thoai-laptop'),
  'IP15PM-256',
  'iPhone 15 Pro Max 256GB chinh hang VN/A1',
  'iphone-15-pro-max-256gb-chinh-hang-vna',
  'Apple',
  JSON_ARRAY(
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80'
  ),
  34990000, 29990000, 28990000, 14,
  4.80, 124, 45, FALSE, TRUE,
  JSON_ARRAY(
    JSON_OBJECT('name', 'Mau sac', 'values', JSON_ARRAY('Titan tu nhien', 'Titan den', 'Titan xanh')),
    JSON_OBJECT('name', 'Dung luong', 'values', JSON_ARRAY('256GB', '512GB', '1TB'))
  ),
  JSON_OBJECT(),
  'Thiet ke titan, camera zoom quang hoc 5x, chip A17 Pro va bao hanh chinh hang.',
  'active'
),
(
  (SELECT id FROM categories WHERE slug = 'dien-thoai-laptop'),
  'S24U-256',
  'Samsung Galaxy S24 Ultra 12GB/256GB AI Phone',
  'samsung-galaxy-s24-ultra-12gb-256gb-ai-phone',
  'Samsung',
  JSON_ARRAY('https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80'),
  33990000, 26490000, 25990000, 22,
  4.70, 89, 28, TRUE, FALSE,
  JSON_ARRAY(JSON_OBJECT('name', 'Mau sac', 'values', JSON_ARRAY('Xam titan', 'Den titan', 'Tim titan'))),
  JSON_OBJECT(),
  'Man hinh Dynamic AMOLED 2X, S Pen, Galaxy AI va camera 200MP.',
  'active'
),
(
  (SELECT id FROM categories WHERE slug = 'dien-thoai-laptop'),
  'MBA-M3-256',
  'MacBook Air 13 inch M3 8GB/256GB',
  'macbook-air-13-inch-m3-8gb-256gb',
  'Apple',
  JSON_ARRAY('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'),
  27990000, 25490000, NULL, 9,
  4.90, 42, 15, TRUE, FALSE,
  JSON_ARRAY(JSON_OBJECT('name', 'Mau sac', 'values', JSON_ARRAY('Xam', 'Bac', 'Vang'))),
  JSON_OBJECT(),
  'Laptop mong nhe voi chip Apple M3, man hinh Liquid Retina va pin ca ngay.',
  'active'
),
(
  (SELECT id FROM categories WHERE slug = 'thoi-trang'),
  'WIND-BLOCKER',
  'Ao khoac gio nam chong nuoc WindBlocker',
  'ao-khoac-gio-nam-chong-nuoc-windblocker',
  'Coolmate',
  JSON_ARRAY('https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80'),
  550000, 299000, 199000, 45,
  4.50, 310, 120, FALSE, TRUE,
  JSON_ARRAY(
    JSON_OBJECT('name', 'Mau sac', 'values', JSON_ARRAY('Den', 'Xanh than', 'Reu')),
    JSON_OBJECT('name', 'Kich co', 'values', JSON_ARRAY('M', 'L', 'XL'))
  ),
  JSON_OBJECT(),
  'Vai chang tham nhe, can gio tot, phu hop di mua nhe hoac di phuot.',
  'active'
),
(
  (SELECT id FROM categories WHERE slug = 'phu-kien-so'),
  'SONY-XM5',
  'Tai nghe chong on Sony WH-1000XM5',
  'tai-nghe-chong-on-sony-wh-1000xm5',
  'Sony',
  JSON_ARRAY('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'),
  8490000, 6990000, NULL, 17,
  4.80, 75, 22, FALSE, FALSE,
  JSON_ARRAY(JSON_OBJECT('name', 'Mau sac', 'values', JSON_ARRAY('Den', 'Bac', 'Xanh navy'))),
  JSON_OBJECT('Pin', '30 gio', 'Ket noi', 'Bluetooth'),
  'Chong on chu dong, am thanh hi-res va thoi luong pin len den 30 gio.',
  'active'
),
(
  (SELECT id FROM categories WHERE slug = 'gia-dung'),
  'TEFAL-EASYFRY',
  'Noi chien khong dau Tefal Easy Fry 4.2L',
  'noi-chien-khong-dau-tefal-easy-fry-42l',
  'Tefal',
  JSON_ARRAY('https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80'),
  4390000, 2190000, 1890000, 50,
  4.70, 160, 35, FALSE, TRUE,
  JSON_ARRAY(JSON_OBJECT('name', 'Phien ban', 'values', JSON_ARRAY('Co dien', 'Cam ung'))),
  JSON_OBJECT('Dung tich', '4.2L'),
  'Dung tich 4.2L, chien nuong tien loi va de ve sinh cho gia dinh.',
  'active'
);

CREATE TABLE user_vouchers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,

  code VARCHAR(80) NOT NULL,
  title VARCHAR(160) NULL,
  description TEXT NULL,
  discount_type ENUM('fixed', 'percent') NOT NULL,
  discount_value DECIMAL(14,2) NOT NULL,
  min_order_value DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  max_discount DECIMAL(14,2) NULL,

  status ENUM('active', 'used', 'expired', 'disabled') NOT NULL DEFAULT 'active',
  used_at DATETIME NULL,
  starts_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_vouchers_user_code (user_id, code),
  INDEX idx_user_vouchers_user_status (user_id, status),
  INDEX idx_user_vouchers_code (code),
  INDEX idx_user_vouchers_expires_at (expires_at),

  CONSTRAINT fk_user_vouchers_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (
  username, password, name, email, phone, image,
  role, status, loyalty_points, orders_count, password_changed_at
) VALUES
(
  'admin',
  MD5('admin123'),
  'Velocart Admin',
  'admin@velocart.vn',
  '0900000000',
  NULL,
  'admin',
  'active',
  0,
  0,
  NOW()
),
(
  'vanhung',
  MD5('member123'),
  'Nguyen Van Hung',
  'vanhung.nguyen@gmail.com',
  '0912345678',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'member',
  'active',
  1240,
  14,
  NOW()
);

INSERT INTO notifications (title, message, type, audience, target_path, target_params, status, created_at)
VALUES (
  'Chao mung den VeloCart',
  'Nhan ma LIXI2026 giam 100K cho don hang dau tien.',
  'system',
  'user',
  '/(tabs)/account',
  JSON_OBJECT(),
  'active',
  '2026-06-22 00:00:00'
);
SET @welcome_notification_id = LAST_INSERT_ID();

INSERT INTO user_notifications (user_id, notification_id, is_read, delivered_at)
SELECT id, @welcome_notification_id, FALSE, '2026-06-22 00:00:00'
FROM users
WHERE username = 'vanhung';

INSERT INTO notifications (title, message, type, audience, target_path, target_params, status, created_at)
VALUES (
  'Flash sale cong nghe',
  'Nhieu san pham dien thoai, laptop va phu kien dang giam sau hom nay.',
  'promo',
  'all',
  '/(tabs)/catalog',
  JSON_OBJECT('categorySlug', 'dien-thoai-laptop'),
  'active',
  '2026-06-22 00:00:00'
);
SET @flash_sale_notification_id = LAST_INSERT_ID();

INSERT INTO user_notifications (user_id, notification_id, is_read, delivered_at)
SELECT id, @flash_sale_notification_id, FALSE, '2026-06-22 00:00:00'
FROM users
WHERE status = 'active';

INSERT INTO reviews (product_id, user_id, name, images, rating, comment, status, created_at)
SELECT
  p.id,
  u.id,
  u.name,
  CASE
    WHEN u.image IS NULL OR u.image = '' THEN JSON_ARRAY()
    ELSE JSON_ARRAY(u.image)
  END,
  5,
  'May dep, giao nhanh, dung nhu mo ta. Pin va camera rat an tuong.',
  'approved',
  DATE_SUB(NOW(), INTERVAL 12 DAY)
FROM products p
JOIN users u ON u.username = 'vanhung'
WHERE p.sku = 'IP15PM-256';

INSERT INTO reviews (product_id, user_id, name, images, rating, comment, status, created_at)
SELECT
  p.id,
  u.id,
  u.name,
  CASE
    WHEN u.image IS NULL OR u.image = '' THEN JSON_ARRAY()
    ELSE JSON_ARRAY(u.image)
  END,
  5,
  'Tai nghe chong on tot, deo lau khong bi dau tai.',
  'approved',
  DATE_SUB(NOW(), INTERVAL 7 DAY)
FROM products p
JOIN users u ON u.username = 'vanhung'
WHERE p.sku = 'SONY-XM5';

INSERT INTO reviews (product_id, user_id, name, images, rating, comment, status, created_at)
SELECT
  p.id,
  NULL,
  'Khach hang VeloCart',
  JSON_ARRAY(),
  4,
  'San pham tot trong tam gia, dong goi can than.',
  'approved',
  DATE_SUB(NOW(), INTERVAL 4 DAY)
FROM products p
WHERE p.sku = 'TEFAL-EASYFRY';

INSERT INTO user_address (user_id, city, district, ward, address_detail)
SELECT id, 'Ho Chi Minh', 'Quan 1', 'Phuong Ben Nghe', '25 Nguyen Hue'
FROM users
WHERE username = 'vanhung';

INSERT INTO user_address (user_id, city, district, ward, address_detail)
SELECT id, 'Ha Noi', 'Dong Da', 'Phuong Lang Ha', 'Toa nha Halo, 88 Lang Ha'
FROM users
WHERE username = 'vanhung';

INSERT INTO user_vouchers (
  user_id, code, title, description, discount_type, discount_value,
  min_order_value, max_discount, status, starts_at, expires_at
)
SELECT
  id,
  'LIXI2026',
  'Giam 100K don dau',
  'Voucher danh cho khach hang VeloCart.',
  'fixed',
  100000,
  500000,
  100000,
  'active',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 90 DAY)
FROM users
WHERE username = 'vanhung';

INSERT INTO user_vouchers (
  user_id, code, title, description, discount_type, discount_value,
  min_order_value, max_discount, status, starts_at, expires_at
)
SELECT
  id,
  'GIAM20',
  'Giam 20 phan tram',
  'Giam 20% toi da 200K cho don hang du dieu kien.',
  'percent',
  20,
  300000,
  200000,
  'active',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 60 DAY)
FROM users
WHERE username = 'vanhung';
