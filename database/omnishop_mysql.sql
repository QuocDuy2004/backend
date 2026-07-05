CREATE DATABASE IF NOT EXISTS omnishop_backend
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE omnishop_backend;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS marketing_campaigns;
DROP TABLE IF EXISTS user_notifications;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_favorites;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS order_timeline_events;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS bank_accounts;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS inventory_history;
DROP TABLE IF EXISTS product_version_history;
DROP TABLE IF EXISTS product_translations;
DROP TABLE IF EXISTS product_warehouse_stock;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS customer_journey;
DROP TABLE IF EXISTS customer_preferred_categories;
DROP TABLE IF EXISTS customer_upsell_opportunities;
DROP TABLE IF EXISTS customers;

SET FOREIGN_KEY_CHECKS = 1;

/*
Database workflow:
1. users la bang goc cho khach hang, nguoi ban va quan tri vien.
2. categories quan ly danh muc; banners va products co the lien ket toi categories qua category_id.
3. products lien ket toi categories qua category_id va toi users qua seller_id.
4. user_favorites, orders, reviews, user_notifications va support_tickets deu lien ket nguoi dung qua user_id.
5. reviews lien ket products qua product_id va co the lien ket orders qua order_id.
6. support_messages lien ket support_tickets qua ticket_id.
7. marketing_campaigns lien ket coupons qua campaign_id.

Quy uoc khoa:
- Moi bang thuc the dung id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
- Cot dang *_id la khoa ngoai neu no tro toi mot bang khac.
- Du lieu mau khong ep id thu cong; MySQL tu tang id, sau do luu LAST_INSERT_ID() vao bien de tao cac ban ghi lien quan.
*/

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL,
  password CHAR(32) NOT NULL,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NULL,
  address TEXT NULL,
  image TEXT NULL,
  cart JSON NOT NULL DEFAULT (JSON_ARRAY()),
  role ENUM('member', 'seller', 'admin') NOT NULL DEFAULT 'member',
  status ENUM('active', 'blocked', 'deleted') NOT NULL DEFAULT 'active',
  orders_count INT NOT NULL DEFAULT 0,
  last_login_at DATETIME NULL,
  password_changed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role_status (role, status),
  CHECK (JSON_VALID(cart))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  image TEXT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_name (name),
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
  target_path VARCHAR(255) NOT NULL DEFAULT '/(tabs)/catalog',
  target_params JSON NOT NULL DEFAULT (JSON_OBJECT()),
  bg_class_name VARCHAR(120) NOT NULL,
  chip_class_name VARCHAR(120) NOT NULL,
  chip_text_class_name VARCHAR(120) NOT NULL,
  button_class_name VARCHAR(120) NOT NULL,
  button_text_color CHAR(7) NOT NULL,
  icon_name VARCHAR(60) NOT NULL,
  detail_icon_name VARCHAR(60) NOT NULL,
  detail_label VARCHAR(120) NOT NULL,
  status ENUM('active', 'inactive', 'scheduled') NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_banners_category (category_id),
  INDEX idx_banners_status_sort (status, sort_order),
  INDEX idx_banners_schedule (starts_at, expires_at),
  CHECK (JSON_VALID(target_params)),
  CONSTRAINT fk_banners_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  subtitle VARCHAR(255) NULL,
  logo_uri TEXT NULL,
  payment_status_on_order ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  config JSON NOT NULL DEFAULT (JSON_OBJECT()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payments_code (code),
  INDEX idx_payments_status_sort (status, sort_order),
  CHECK (JSON_VALID(config))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id INT UNSIGNED NULL,
  category_id INT UNSIGNED NULL,
  sku VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL,
  brand VARCHAR(160) NOT NULL,
  images JSON NOT NULL DEFAULT (JSON_ARRAY()),
  original_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  flash_sale_price DECIMAL(14,2) NULL,
  discount_percent INT NOT NULL DEFAULT 0,
  cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  sold INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  attributes JSON NOT NULL DEFAULT (JSON_ARRAY()),
  specification JSON NOT NULL DEFAULT (JSON_OBJECT()),
  tags JSON NOT NULL DEFAULT (JSON_ARRAY()),
  description TEXT NULL,
  status ENUM('active', 'draft', 'archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_products_sku (sku),
  UNIQUE KEY uq_products_slug (slug),
  INDEX idx_products_category_status (category_id, status),
  INDEX idx_products_seller (seller_id),
  INDEX idx_products_name (name),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_products_seller
    FOREIGN KEY (seller_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CHECK (JSON_VALID(images)),
  CHECK (JSON_VALID(attributes)),
  CHECK (JSON_VALID(specification)),
  CHECK (JSON_VALID(tags))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_favorites (
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  INDEX idx_favorites_product (product_id),
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_favorites_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(60) NULL,
  audience ENUM('all', 'user') NOT NULL DEFAULT 'all',
  target_path VARCHAR(255) NULL,
  target_params JSON NOT NULL DEFAULT (JSON_OBJECT()),
  status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_user_notifications_notification
    FOREIGN KEY (notification_id) REFERENCES notifications(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE marketing_campaigns (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  type ENUM('coupon', 'flash_sale', 'email', 'push_notification', 'affiliate') NOT NULL,
  status ENUM('active', 'scheduled', 'ended') NOT NULL DEFAULT 'scheduled',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  clicks INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  budget DECIMAL(14,2) NOT NULL DEFAULT 0,
  ai_suggestions JSON NOT NULL DEFAULT (JSON_ARRAY()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_marketing_status_dates (status, start_date, end_date),
  CHECK (JSON_VALID(ai_suggestions))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coupons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT UNSIGNED NULL,
  code VARCHAR(80) NOT NULL,
  discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(14,2) NOT NULL,
  min_order_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(14,2) NULL,
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  status ENUM('active', 'scheduled', 'ended') NOT NULL DEFAULT 'active',
  start_date DATE NULL,
  end_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupons_code (code),
  INDEX idx_coupons_campaign (campaign_id),
  INDEX idx_coupons_status_dates (status, start_date, end_date),
  CONSTRAINT fk_coupons_campaign
    FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
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
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status_date (order_status, created_at),
  INDEX idx_orders_phone (customer_phone),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CHECK (JSON_VALID(items)),
  CHECK (JSON_VALID(timeline))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NULL,
  user_id INT UNSIGNED NULL,
  product_name VARCHAR(255) NULL,
  user_name VARCHAR(160) NOT NULL,
  user_avatar TEXT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('approved', 'pending', 'spam') NOT NULL DEFAULT 'pending',
  response TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reviews_product_status (product_id, status),
  INDEX idx_reviews_order (order_id),
  INDEX idx_reviews_user (user_id),
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE support_tickets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_email VARCHAR(255) NULL,
  customer_phone VARCHAR(40) NULL,
  subject VARCHAR(255) NULL,
  last_message TEXT NOT NULL,
  status ENUM('open', 'pending', 'solved') NOT NULL DEFAULT 'open',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  assigned_to_ai BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_support_user (user_id),
  INDEX idx_support_status_priority (status, priority),
  CONSTRAINT fk_support_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE support_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT UNSIGNED NOT NULL,
  sender ENUM('customer', 'ai', 'agent') NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_support_messages_ticket_date (ticket_id, created_at),
  CONSTRAINT fk_support_messages_ticket
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
  setting_key VARCHAR(120) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (JSON_VALID(setting_value))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, password, name, email, phone, address, image, cart, role, status, orders_count)
VALUES ('admin', MD5('admin123'), 'Velocart Admin', 'admin@velocart.vn', '0900000000', 'Ho Chi Minh, Viet Nam', NULL, JSON_ARRAY(), 'admin', 'active', 0);
SET @admin_user_id = LAST_INSERT_ID();

INSERT INTO users (username, password, name, email, phone, address, image, cart, role, status, orders_count)
VALUES ('seller_demo', MD5('seller123'), 'Velocart Seller', 'seller@velocart.vn', '0900000001', 'Ha Noi, Viet Nam', NULL, JSON_ARRAY(), 'seller', 'active', 0);
SET @seller_user_id = LAST_INSERT_ID();

INSERT INTO users (username, password, name, email, phone, address, image, cart, role, status, orders_count)
VALUES ('vanhung', MD5('member123'), 'Nguyen Van Hung', 'vanhung.nguyen@gmail.com', '0912345678', '12 Nguyen Hue, Quan 1, TP.HCM', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80', JSON_ARRAY(), 'member', 'active', 14);
SET @member_user_id = LAST_INSERT_ID();

INSERT INTO categories (name, slug, status, sort_order)
VALUES ('Dien thoai & Laptop', 'dien-thoai-laptop', 'active', 1);
SET @phones_category_id = LAST_INSERT_ID();

INSERT INTO categories (name, slug, status, sort_order)
VALUES ('Thoi trang', 'thoi-trang', 'active', 2);
SET @fashion_category_id = LAST_INSERT_ID();

INSERT INTO categories (name, slug, status, sort_order)
VALUES ('Gia dung', 'gia-dung', 'active', 3);
SET @home_category_id = LAST_INSERT_ID();

INSERT INTO categories (name, slug, status, sort_order)
VALUES ('Phu kien so', 'phu-kien-so', 'active', 4);
SET @accessories_category_id = LAST_INSERT_ID();

INSERT INTO categories (name, slug, status, sort_order)
VALUES ('Lam dep', 'lam-dep', 'active', 5);
SET @beauty_category_id = LAST_INSERT_ID();

INSERT INTO banners (
  category_id, tag, title, description, note, cta, target_path, target_params,
  bg_class_name, chip_class_name, chip_text_class_name,
  button_class_name, button_text_color, icon_name, detail_icon_name, detail_label,
  status, sort_order
)
VALUES
(
  @phones_category_id,
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
  @fashion_category_id,
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
  code, name, title, subtitle, provider,
  logo_type, logo_text, logo_uri, logo_bg_class_name, tone_class_name,
  payment_status_on_order, status, sort_order, config
)
VALUES
(
  'COD',
  'Cash on Delivery',
  'Thanh toan khi nhan hang',
  'Kiem tra don roi moi thanh toan',
  'internal',
  'text',
  'COD',
  NULL,
  'bg-amber-500',
  'bg-amber-50 border-amber-200',
  'pending',
  'active',
  1,
  JSON_OBJECT('requiresOnlineCheckout', FALSE)
),
(
  'momo',
  'MoMo',
  'Vi MoMo',
  'Thanh toan nhanh bang vi dien tu',
  'momo',
  'image',
  NULL,
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/MoMo_Logo_App.svg/960px-MoMo_Logo_App.svg.png',
  NULL,
  'bg-fuchsia-50 border-fuchsia-200',
  'paid',
  'active',
  2,
  JSON_OBJECT('requiresOnlineCheckout', TRUE, 'sandbox', TRUE)
),
(
  'vnpay',
  'VNPay',
  'VNPay',
  'Quet ma hoac thanh toan online',
  'vnpay',
  'image',
  NULL,
  'https://images.seeklogo.com/logo-png/42/1/vnpay-logo-png_seeklogo-428006.png',
  NULL,
  'bg-sky-50 border-sky-200',
  'paid',
  'active',
  3,
  JSON_OBJECT('requiresOnlineCheckout', TRUE, 'sandbox', TRUE)
),
(
  'visa',
  'Visa',
  'Visa / The quoc te',
  'The tin dung va the ghi no',
  'visa',
  'image',
  NULL,
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Visa_Brandmark_2021.svg/960px-Visa_Brandmark_2021.svg.png',
  NULL,
  'bg-indigo-50 border-indigo-200',
  'paid',
  'active',
  4,
  JSON_OBJECT('requiresOnlineCheckout', TRUE)
),
(
  'bank_transfer',
  'Bank transfer',
  'Chuyen khoan ngan hang',
  'Nhan thong tin tai khoan sau khi dat hang',
  'bank',
  'text',
  'BANK',
  NULL,
  'bg-emerald-600',
  'bg-emerald-50 border-emerald-200',
  'pending',
  'active',
  5,
  JSON_OBJECT('requiresOnlineCheckout', FALSE, 'bankName', 'Vietcombank', 'accountName', 'VELOCart')
);

INSERT INTO products (
  seller_id, category_id, sku, name, slug, brand, images, original_price,
  discount_price, flash_sale_price, discount_percent, cost, stock, sold, rating, review_count,
  is_new, is_best_seller, attributes, specification, tags, description, status
)
VALUES (
  @seller_user_id, @phones_category_id, 'IP15PM-256', 'iPhone 15 Pro Max 256GB chinh hang VN/A',
  'iphone-15-pro-max-256gb-chinh-hang-vna', 'Apple',
  JSON_ARRAY('https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80'),
  34990000, 29990000, 28990000, 14, 26000000, 45, 120, 4.8, 124, FALSE, TRUE,
  JSON_ARRAY(JSON_OBJECT('name', 'Mau sac', 'values', JSON_ARRAY('Titan tu nhien', 'Titan den', 'Titan xanh')), JSON_OBJECT('name', 'Dung luong', 'values', JSON_ARRAY('256GB', '512GB', '1TB'))),
  JSON_OBJECT('Bao hanh', '12 thang', 'Xuat xu', 'VN/A'),
  JSON_ARRAY('dien-thoai', 'apple', 'iphone'),
  'Thiet ke titan, camera zoom quang hoc 5x, chip A17 Pro va bao hanh chinh hang.',
  'active'
);
SET @iphone_product_id = LAST_INSERT_ID();

INSERT INTO products (
  seller_id, category_id, sku, name, slug, brand, images, original_price,
  discount_price, flash_sale_price, discount_percent, cost, stock, sold, rating, review_count,
  is_new, is_best_seller, attributes, specification, tags, description, status
)
VALUES (
  @seller_user_id, @accessories_category_id, 'SONY-XM5', 'Tai nghe chong on Sony WH-1000XM5',
  'tai-nghe-chong-on-sony-wh-1000xm5', 'Sony',
  JSON_ARRAY('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'),
  8490000, 6990000, NULL, 17, 5200000, 22, 75, 4.8, 75, FALSE, FALSE,
  JSON_ARRAY(JSON_OBJECT('name', 'Mau sac', 'values', JSON_ARRAY('Den', 'Bac', 'Xanh navy'))),
  JSON_OBJECT('Pin', '30 gio', 'Ket noi', 'Bluetooth'),
  JSON_ARRAY('tai-nghe', 'sony', 'audio'),
  'Chong on chu dong, am thanh hi-res va thoi luong pin len den 30 gio.',
  'active'
);
SET @sony_product_id = LAST_INSERT_ID();

UPDATE users
SET cart = JSON_ARRAY(@iphone_product_id, @sony_product_id)
WHERE id = @member_user_id;

INSERT INTO user_favorites (user_id, product_id)
VALUES (@member_user_id, @iphone_product_id);

INSERT INTO notifications (title, message, type, audience, target_path, target_params, status)
VALUES ('Chao mung den Velocart', 'Nhan ma LIXI2026 giam 100K cho don hang dau tien.', 'system', 'user', '/(tabs)/account', JSON_OBJECT(), 'active');
SET @welcome_notification_id = LAST_INSERT_ID();

INSERT INTO user_notifications (user_id, notification_id, is_read)
VALUES (@member_user_id, @welcome_notification_id, FALSE);

INSERT INTO notifications (title, message, type, audience, target_path, target_params, status)
VALUES ('Flash sale cong nghe', 'Nhieu san pham dien thoai, laptop va phu kien dang giam sau hom nay.', 'promo', 'all', '/(tabs)/catalog', JSON_OBJECT('categorySlug', 'dien-thoai-laptop'), 'active');
SET @flash_sale_notification_id = LAST_INSERT_ID();

INSERT INTO user_notifications (user_id, notification_id, is_read)
SELECT id, @flash_sale_notification_id, FALSE
FROM users
WHERE status = 'active';

INSERT INTO marketing_campaigns (name, type, status, start_date, end_date, clicks, conversions, revenue, budget, ai_suggestions)
VALUES ('Lixi 2026', 'coupon', 'active', '2026-06-01', '2026-07-01', 1200, 86, 25800000, 5000000, JSON_ARRAY('Uu tien khach co gio hang chua thanh toan.', 'Day voucher cho nhom mua phu kien.'));
SET @lixi_campaign_id = LAST_INSERT_ID();

INSERT INTO coupons (campaign_id, code, discount_type, discount_value, min_order_value, max_discount, usage_limit, status, start_date, end_date)
VALUES (@lixi_campaign_id, 'LIXI2026', 'fixed', 100000, 500000, 100000, 1000, 'active', '2026-06-01', '2026-07-01');

INSERT INTO coupons (campaign_id, code, discount_type, discount_value, min_order_value, max_discount, usage_limit, status, start_date, end_date)
VALUES (NULL, 'FREESHIP', 'fixed', 30000, 150000, 30000, 500, 'active', NULL, NULL);

INSERT INTO coupons (campaign_id, code, discount_type, discount_value, min_order_value, max_discount, usage_limit, status, start_date, end_date)
VALUES (NULL, 'GIAM20', 'percent', 20, 300000, 200000, 500, 'active', NULL, NULL);

INSERT INTO orders (
  user_id, customer_name, customer_phone, customer_email, customer_address, items,
  subtotal, shipping_fee, discount_amount, total_amount, voucher_code_used, shipping_unit,
  payment_method, payment_status, order_status, note, timeline
)
VALUES (
  @member_user_id, 'Nguyen Van Hung', '0912345678', 'vanhung.nguyen@gmail.com',
  '12 Nguyen Hue, Quan 1, TP.HCM',
  JSON_ARRAY(JSON_OBJECT('productId', @iphone_product_id, 'productName', 'iPhone 15 Pro Max 256GB chinh hang VN/A', 'productImage', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80', 'quantity', 1, 'price', 29990000, 'selectedVersion', '256GB')),
  29990000, 30000, 100000, 29920000, 'LIXI2026', 'standard', 'COD', 'pending', 'pending',
  'Giao gio hanh chinh',
  JSON_ARRAY(JSON_OBJECT('status', 'pending', 'title', 'Da dat hang', 'date', '2026-06-26 09:00:00'))
);
SET @sample_order_id = LAST_INSERT_ID();

INSERT INTO reviews (product_id, order_id, user_id, product_name, user_name, user_avatar, rating, comment, is_approved, status, response)
VALUES (@iphone_product_id, @sample_order_id, @member_user_id, 'iPhone 15 Pro Max 256GB chinh hang VN/A', 'Nguyen Van Hung', NULL, 5, 'San pham dung mo ta, giao nhanh.', TRUE, 'approved', 'Cam on ban da danh gia san pham.');

INSERT INTO support_tickets (user_id, customer_name, customer_email, customer_phone, subject, last_message, status, priority, assigned_to_ai)
VALUES (@member_user_id, 'Nguyen Van Hung', 'vanhung.nguyen@gmail.com', '0912345678', 'Hoi ve don hang', 'Khi nao don hang cua toi duoc giao?', 'open', 'medium', TRUE);
SET @sample_ticket_id = LAST_INSERT_ID();

INSERT INTO support_messages (ticket_id, sender, message)
VALUES (@sample_ticket_id, 'customer', 'Khi nao don hang cua toi duoc giao?');

INSERT INTO settings (setting_key, setting_value)
VALUES
  ('store', JSON_OBJECT('name', 'Velocart', 'email', 'support@velocart.vn', 'currency', 'VND', 'taxRate', 0)),
  ('payments', JSON_OBJECT('COD', TRUE, 'momo', TRUE, 'vnpay', TRUE, 'visa', TRUE, 'bank_transfer', TRUE)),
  ('shipping', JSON_OBJECT('freeShipMinOrder', 500000, 'defaultFee', 30000, 'fastFee', 55000)),
  ('roles', JSON_OBJECT('member', 'Khach hang', 'seller', 'Nguoi ban', 'admin', 'Quan tri'));
