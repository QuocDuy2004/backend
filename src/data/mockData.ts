import { Product, Order, Customer, SupportTicket, MarketingCampaign, KPICards, InventoryHistory, ProductReview } from '../types';

export const mockKPIData: KPICards = {
  revenueToday: 14250.00,
  monthlyRevenue: 342980.50,
  totalOrders: 1842,
  newCustomers: 248,
  conversionRate: 3.42,
  returnRate: 1.18,
};

export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    sku: 'TSH-S1-BLK',
    name: 'AeroWave Pro Running Shirt',
    category: 'Activewear',
    brand: 'CoreAthletics',
    price: 49.00,
    cost: 14.50,
    inventory: 142,
    warehouseStock: { 'W1-West': 90, 'W2-East': 52 },
    rating: 4.8,
    sales: 1240,
    status: 'active',
    updatedAt: '2026-06-23T14:20:00Z',
    description: 'Ultra-lightweight, high-performance athletic apparel featuring moisture-wicking weave and dynamic heat dissipation panels.',
    tags: ['activewear', 'clothing', 'running', 'breathable'],
    seoTitle: 'AeroWave Pro Men\'s Running Shirt | CoreAthletics',
    seoDescription: 'Shop the high-performance AeroWave Pro athletic shirt. Breathable moisture-wicking weave designed for professional athletes. Buy now with free shipping.',
    versionHistory: [
      { version: 2, date: '2026-06-10', author: 'S. Cooper', changes: 'Updated pricing from $45 to $49' },
      { version: 1, date: '2026-03-12', author: 'M. Vance', changes: 'Initial release' }
    ]
  },
  {
    id: 'prod_2',
    sku: 'EAR-H1-WHT',
    name: 'SoundSphere ANC Earbuds',
    category: 'Electronics',
    brand: 'AcoustiMax',
    price: 189.00,
    cost: 58.00,
    inventory: 8,
    warehouseStock: { 'W1-West': 3, 'W2-East': 5 },
    rating: 4.6,
    sales: 840,
    status: 'active',
    updatedAt: '2026-06-24T09:12:00Z',
    description: 'Active Noise Cancelling true wireless earbuds with 40-hour battery life and customizable high-definition acoustic drivers.',
    tags: ['electronics', 'audio', 'wireless', 'accessories'],
    seoTitle: 'SoundSphere ANC Premium Wireless Earbuds',
    seoDescription: 'Experience pure audio clarity with SoundSphere ANC Wireless Earbuds. Long-lasting battery, hybrid active noise cancellation, and water resistance.',
    versionHistory: [
      { version: 1, date: '2025-11-20', author: 'T. Harris', changes: 'Product setup' }
    ]
  },
  {
    id: 'prod_3',
    sku: 'MAT-Z1-GRN',
    name: 'ZenFlex Eco Yoga Mat',
    category: 'Fitness',
    brand: 'ZenVibe',
    price: 75.00,
    cost: 22.00,
    inventory: 230,
    warehouseStock: { 'W1-West': 150, 'W2-East': 80 },
    rating: 4.9,
    sales: 3100,
    status: 'active',
    updatedAt: '2026-06-22T11:05:00Z',
    description: 'Biodegradable, non-slip therapeutic alignment yoga mat made from organic tree rubber and sustainable premium hemp fiber.',
    tags: ['fitness', 'yoga', 'eco-friendly', 'wellness'],
    seoTitle: 'ZenFlex Biodegradable Eco Yoga Mat - ZenVibe',
    seoDescription: 'A durable, non-slip, eco-friendly organic yoga mat featuring precision body alignment guides. Ideal for hot yoga and pilates.',
    versionHistory: [
      { version: 1, date: '2025-08-05', author: 'L. Patel', changes: 'Initial product release' }
    ]
  },
  {
    id: 'prod_4',
    sku: 'BOT-I1-SLV',
    name: 'HydroShield Vacuum Flask',
    category: 'Accessories',
    brand: 'PeakPerformance',
    price: 35.00,
    cost: 9.20,
    inventory: 4,
    warehouseStock: { 'W1-West': 1, 'W2-East': 3 },
    rating: 4.5,
    sales: 2430,
    status: 'active',
    updatedAt: '2026-06-24T18:45:00Z',
    description: 'Double-walled vacuum insulated stainless steel water bottle. Keeps liquids ice cold for 24 hours or steaming hot for 12 hours.',
    tags: ['accessories', 'drinkware', 'flask', 'outdoors'],
    seoTitle: 'HydroShield Stainless Steel Vacuum Insulated Flask',
    seoDescription: 'Discover the dual-walled insulated water bottle. Premium stainless steel construction that keeps cold for 24h. Secure leak-proof lid.',
    versionHistory: [
      { version: 1, date: '2025-05-14', author: 'M. Vance', changes: 'Setup initial SKU' }
    ]
  },
  {
    id: 'prod_5',
    sku: 'WTC-D1-SLV',
    name: 'ChronoPulse Smart Watch',
    category: 'Electronics',
    brand: 'AcoustiMax',
    price: 299.00,
    cost: 110.00,
    inventory: 45,
    warehouseStock: { 'W1-West': 25, 'W2-East': 20 },
    rating: 4.7,
    sales: 420,
    status: 'active',
    updatedAt: '2026-06-20T08:30:00Z',
    description: 'Premium healthcare smart watch equipped with SpO2 sensors, custom sleep coach algorithms, ECG monitoring, and auto-workout detection.',
    tags: ['electronics', 'wearable', 'fitness', 'smartwatch'],
    seoTitle: 'ChronoPulse Healthcare Smartwatch & ECG Tracker',
    seoDescription: 'Monitor your health and active minutes with the ChronoPulse Smart Watch. ECG tracker, Sleep diagnostics, SpO2 sensor, and smart assistant.',
    versionHistory: [
      { version: 1, date: '2026-01-10', author: 'T. Harris', changes: 'Launch product' }
    ]
  },
  {
    id: 'prod_6',
    sku: 'BAC-P1-GRY',
    name: 'OmniPack Travel Backpack',
    category: 'Accessories',
    brand: 'PeakPerformance',
    price: 120.00,
    cost: 38.00,
    inventory: 85,
    warehouseStock: { 'W1-West': 40, 'W2-East': 45 },
    rating: 4.8,
    sales: 910,
    status: 'active',
    updatedAt: '2026-06-19T10:00:00Z',
    description: 'Water-resistant multi-compartment travel companion. Fits a 17-inch laptop, integrates a USB pass-through charging port, and hides RFID blocking pockets.',
    tags: ['accessories', 'backpack', 'travel', 'bags'],
    seoTitle: 'OmniPack 17-inch Water-Resistant Travel Backpack',
    seoDescription: 'High-durability travel backpack featuring TSA-friendly layout, anti-theft zipper, RFID secure compartments, and external charger port.',
    versionHistory: [
      { version: 1, date: '2025-04-18', author: 'S. Cooper', changes: 'Setup item' }
    ]
  }
];

export const mockInventoryHistory: InventoryHistory[] = [
  {
    productId: 'prod_2',
    date: '2026-06-24T09:12:00Z',
    change: -5,
    type: 'sale',
    warehouse: 'W1-West',
    notes: 'Order #ORD-1002 Fulfillment'
  },
  {
    productId: 'prod_1',
    date: '2026-06-23T14:20:00Z',
    change: 100,
    type: 'restock',
    warehouse: 'W1-West',
    notes: 'Inbound shipment receipt and QA clearance'
  },
  {
    productId: 'prod_4',
    date: '2026-06-24T18:45:00Z',
    change: -2,
    type: 'sale',
    warehouse: 'W2-East',
    notes: 'Order #ORD-1001 Fulfillment'
  },
  {
    productId: 'prod_3',
    date: '2026-06-22T11:05:00Z',
    change: 50,
    type: 'transfer',
    warehouse: 'W2-East',
    notes: 'Inter-facility transfer from West depot'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-1001',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.vance@gmail.com',
    date: '2026-06-24T18:30:00Z',
    items: [
      { productId: 'prod_4', productName: 'HydroShield Vacuum Flask', sku: 'BOT-I1-SLV', price: 35.00, quantity: 2 }
    ],
    subtotal: 70.00,
    tax: 5.60,
    shipping: 10.00,
    total: 85.60,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'Stripe Credit Card',
    shippingAddress: {
      street: '142 Market St, Apt 4B',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'USA'
    },
    timeline: [
      { date: '2026-06-24T18:30:00Z', status: 'pending', title: 'Order Placed', description: 'Transaction initialized via customer checkout' }
    ],
    internalNotes: 'Customer requested eco-friendly packaging if available.',
    fraudRisk: 'low',
    fraudRiskScore: 12,
    delayPrediction: 'none'
  },
  {
    id: 'ORD-1002',
    customerName: 'Sarah Cooper',
    customerEmail: 'sarah.coop90@yahoo.com',
    date: '2026-06-24T08:15:00Z',
    items: [
      { productId: 'prod_2', productName: 'SoundSphere ANC Earbuds', sku: 'EAR-H1-WHT', price: 189.00, quantity: 1 },
      { productId: 'prod_1', productName: 'AeroWave Pro Running Shirt', sku: 'TSH-S1-BLK', price: 49.00, quantity: 1 }
    ],
    subtotal: 238.00,
    tax: 19.04,
    shipping: 0.00,
    total: 257.04,
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'Apple Pay',
    shippingAddress: {
      street: '782 Pine Heights Rd',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'USA'
    },
    timeline: [
      { date: '2026-06-24T08:18:00Z', status: 'processing', title: 'Payment Confirmed', description: 'Gateway status: settled. Batch routing complete.' },
      { date: '2026-06-24T08:15:00Z', status: 'pending', title: 'Order Placed', description: 'Customer transaction initiated' }
    ],
    internalNotes: 'Prioritize fast courier route due to prime subscriber status.',
    fraudRisk: 'low',
    fraudRiskScore: 5,
    delayPrediction: 'none'
  },
  {
    id: 'ORD-1003',
    customerName: 'Leila Patel',
    customerEmail: 'leila.p@patelconsulting.com',
    date: '2026-06-23T11:45:00Z',
    items: [
      { productId: 'prod_3', productName: 'ZenFlex Eco Yoga Mat', sku: 'MAT-Z1-GRN', price: 75.00, quantity: 2 }
    ],
    subtotal: 150.00,
    tax: 12.00,
    shipping: 12.50,
    total: 174.50,
    status: 'shipping',
    paymentStatus: 'paid',
    paymentMethod: 'PayPal',
    shippingAddress: {
      street: '901 Executive Pkwy, Ste 300',
      city: 'Austin',
      state: 'TX',
      zip: '78759',
      country: 'USA'
    },
    timeline: [
      { date: '2026-06-24T10:00:00Z', status: 'shipping', title: 'Carrier Manifest Generated', description: 'Picked up by FedEx Ground. Tracker: FX-84918239' },
      { date: '2026-06-23T12:00:00Z', status: 'processing', title: 'Payment Confirmed', description: 'Gateway authorized successfully' },
      { date: '2026-06-23T11:45:00Z', status: 'pending', title: 'Order Placed', description: 'Checkout completed' }
    ],
    internalNotes: 'Send standard shipping milestone tracking alerts.',
    fraudRisk: 'low',
    fraudRiskScore: 18,
    delayPrediction: 'none'
  },
  {
    id: 'ORD-1004',
    customerName: 'James Miller',
    customerEmail: 'james.miller88@proton.me',
    date: '2026-06-22T21:10:00Z',
    items: [
      { productId: 'prod_5', productName: 'ChronoPulse Smart Watch', sku: 'WTC-D1-SLV', price: 299.00, quantity: 1 }
    ],
    subtotal: 299.00,
    tax: 23.92,
    shipping: 0.00,
    total: 322.92,
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'Google Pay',
    shippingAddress: {
      street: '556 Spruce Ln',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      country: 'USA'
    },
    timeline: [
      { date: '2026-06-24T15:30:00Z', status: 'delivered', title: 'Package Delivered', description: 'Delivered to front porch. Photo verification received.' },
      { date: '2026-06-23T09:00:00Z', status: 'shipping', title: 'Shipped via DHL', description: 'In transit to destination sorting hub' },
      { date: '2026-06-22T21:15:00Z', status: 'processing', title: 'Payment Settled', description: 'Automatic settlement completed' }
    ],
    internalNotes: 'No signatures required.',
    fraudRisk: 'medium',
    fraudRiskScore: 45,
    delayPrediction: 'none'
  },
  {
    id: 'ORD-1005',
    customerName: 'Emily Peterson',
    customerEmail: 'emily.peterson@comcast.net',
    date: '2026-06-21T14:50:00Z',
    items: [
      { productId: 'prod_2', productName: 'SoundSphere ANC Earbuds', sku: 'EAR-H1-WHT', price: 189.00, quantity: 3 }
    ],
    subtotal: 567.00,
    tax: 45.36,
    shipping: 15.00,
    total: 627.36,
    status: 'refunded',
    paymentStatus: 'refunded',
    paymentMethod: 'Stripe Credit Card',
    shippingAddress: {
      street: '1288 Oakwood Ter',
      city: 'Boston',
      state: 'MA',
      zip: '02115',
      country: 'USA'
    },
    timeline: [
      { date: '2026-06-23T11:00:00Z', status: 'refunded', title: 'Refund Completed', description: 'Processed original credit of $627.36. Gateway transaction ID: rf_84109.' },
      { date: '2026-06-21T14:50:00Z', status: 'pending', title: 'Order Placed', description: 'System record initialized' }
    ],
    internalNotes: 'Customer reported accidental triple order. Return process handled via chatbot auto-escalation.',
    fraudRisk: 'high',
    fraudRiskScore: 82,
    delayPrediction: 'none',
    refundRecommendation: 'Approve refund instantly since items have not left the warehouse and transaction risk was high.'
  }
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust_1',
    username: 'marcusv',
    name: 'Marcus Vance',
    email: 'marcus.vance@gmail.com',
    phone: '+1 (555) 234-8901',
    address: '142 Market St, Apt 4B, San Francisco, CA',
    cart: ['prod_5', 'prod_6'],
    role: 'member',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
    joinedDate: '2025-01-15',
    tier: 'VIP',
    ordersCount: 14,
    churnRisk: 'low',
    repurchaseProbability: 0.94,
    upsellOpportunities: ['ChronoPulse Smart Watch', 'OmniPack Travel Backpack'],
    preferredCategories: ['Electronics', 'Accessories'],
    journey: [
      { date: '2026-06-24', event: 'Purchased Flask', channel: 'Mobile App', details: 'Completed Order #ORD-1001' },
      { date: '2026-06-20', event: 'Email Open', channel: 'Newsletter', details: 'Opened Summer Gear Campaign' },
      { date: '2026-05-18', event: 'Support Solved', channel: 'AI Support Chat', details: 'Asked about water bottle insulation durability' }
    ]
  },
  {
    id: 'cust_2',
    username: 'sarahcoop',
    name: 'Sarah Cooper',
    email: 'sarah.coop90@yahoo.com',
    phone: '+1 (555) 412-3321',
    address: '782 Pine Heights Rd, Seattle, WA',
    cart: ['prod_3'],
    role: 'member',
    status: 'active',
    joinedDate: '2025-03-10',
    tier: 'Loyal',
    ordersCount: 5,
    churnRisk: 'low',
    repurchaseProbability: 0.78,
    upsellOpportunities: ['ZenFlex Eco Yoga Mat'],
    preferredCategories: ['Activewear', 'Electronics'],
    journey: [
      { date: '2026-06-24', event: 'Order Placed', channel: 'Web Desktop', details: 'Purchased SoundSphere Earbuds (#ORD-1002)' },
      { date: '2026-06-22', event: 'Search Activity', channel: 'Search', details: 'Searched for "ANC active headphones"' }
    ]
  },
  {
    id: 'cust_3',
    username: 'leilapatel',
    name: 'Leila Patel',
    email: 'leila.p@patelconsulting.com',
    phone: '+1 (555) 901-8833',
    address: '901 Executive Pkwy, Ste 300, Austin, TX',
    cart: ['prod_5'],
    role: 'member',
    status: 'active',
    joinedDate: '2024-11-20',
    tier: 'VIP',
    ordersCount: 22,
    churnRisk: 'medium',
    repurchaseProbability: 0.52,
    upsellOpportunities: ['ChronoPulse Smart Watch'],
    preferredCategories: ['Fitness', 'Accessories'],
    journey: [
      { date: '2026-06-23', event: 'Order Shipping', channel: 'FedEx Tracker', details: 'Shipped Yoga Mat order' },
      { date: '2026-06-15', event: 'Cart Abandonment', channel: 'Web Desktop', details: 'Left ChronoPulse Smart Watch in cart' }
    ]
  },
  {
    id: 'cust_4',
    username: 'jamesmiller',
    name: 'James Miller',
    email: 'james.miller88@proton.me',
    phone: '+1 (555) 777-1243',
    address: '556 Spruce Ln, Denver, CO',
    cart: [],
    role: 'member',
    status: 'active',
    joinedDate: '2026-05-01',
    tier: 'New',
    ordersCount: 1,
    churnRisk: 'high',
    repurchaseProbability: 0.21,
    upsellOpportunities: ['OmniPack Travel Backpack', 'AeroWave Pro Running Shirt'],
    preferredCategories: ['Electronics'],
    journey: [
      { date: '2026-06-24', event: 'Delivered', channel: 'Courier Portal', details: 'ORD-1004 delivered' },
      { date: '2026-06-22', event: 'First Purchase', channel: 'Mobile Web', details: 'Bought ChronoPulse Watch' }
    ]
  }
];

export const mockTickets: SupportTicket[] = [
  {
    id: 'TKT-102',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.vance@gmail.com',
    lastMessage: 'Is the Vacuum Flask dishwasher safe? I want to make sure the paint doesn\'t peel.',
    updatedAt: '2026-06-24T19:55:00Z',
    status: 'open',
    priority: 'medium',
    sentiment: 'neutral',
    sentimentScore: 0.1,
    intent: 'Product Usage Inquiry',
    confidenceScore: 94,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hey there! I just ordered two HydroShield Vacuum Flasks (#ORD-1001). Can you let me know if they are dishwasher safe?', timestamp: '2026-06-24T19:54:00Z' },
      { id: 'm2', sender: 'customer', text: 'Is the Vacuum Flask dishwasher safe? I want to make sure the paint doesn\'t peel.', timestamp: '2026-06-24T19:55:00Z' }
    ],
    assignedToAI: true,
    slaMinutesRemaining: 45
  },
  {
    id: 'TKT-103',
    customerName: 'Liza Koshy',
    customerEmail: 'liza.k@gmail.com',
    lastMessage: 'I received the package but it only contains 1 pair of shoes, whereas I paid for 2. This is extremely frustrating.',
    updatedAt: '2026-06-24T19:10:00Z',
    status: 'open',
    priority: 'high',
    sentiment: 'negative',
    sentimentScore: -0.8,
    intent: 'Missing Items Claim',
    confidenceScore: 98,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hello, I got my delivery just an hour ago.', timestamp: '2026-06-24T19:08:00Z' },
      { id: 'm2', sender: 'customer', text: 'I received the package but it only contains 1 pair of shoes, whereas I paid for 2. This is extremely frustrating.', timestamp: '2026-06-24T19:10:00Z' }
    ],
    assignedToAI: false,
    notes: 'Escalated to supervisor due to high-risk negative sentiment.',
    slaMinutesRemaining: 15
  },
  {
    id: 'TKT-104',
    customerName: 'Leila Patel',
    customerEmail: 'leila.p@patelconsulting.com',
    lastMessage: 'Great, thank you for confirming the tracking! That helps immensely.',
    updatedAt: '2026-06-24T10:30:00Z',
    status: 'solved',
    priority: 'low',
    sentiment: 'positive',
    sentimentScore: 0.9,
    intent: 'Order Tracking Query',
    confidenceScore: 97,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Has my ZenFlex Yoga Mat shipped yet? ORD-1003', timestamp: '2026-06-24T09:50:00Z' },
      { id: 'm2', sender: 'ai', text: 'Hello Leila! Yes, your Order #ORD-1003 was picked up by FedEx Ground this morning. Your tracking number is FX-84918239.', timestamp: '2026-06-24T10:02:00Z' },
      { id: 'm3', sender: 'customer', text: 'Great, thank you for confirming the tracking! That helps immensely.', timestamp: '2026-06-24T10:30:00Z' }
    ],
    assignedToAI: true,
    slaMinutesRemaining: 120
  }
];

export const mockCampaigns: MarketingCampaign[] = [
  {
    id: 'cmp_1',
    name: 'Summer Athletic Launch',
    type: 'email',
    status: 'active',
    startDate: '2026-06-15',
    endDate: '2026-07-15',
    clicks: 14200,
    conversions: 890,
    revenue: 43610.00,
    budget: 8000,
    roiPredicted: 5.4,
    aiSuggestions: [
      'Segment customers who purchased ZenFlex Mats previously to boost activewear cross-sells by 18%.',
      'Optimize email headline to emphasize biodegradable properties for the West coast audience.'
    ]
  },
  {
    id: 'cmp_2',
    name: 'VIP Gadget Loyalty Flash',
    type: 'flash_sale',
    status: 'active',
    startDate: '2026-06-24',
    endDate: '2026-06-26',
    clicks: 3400,
    conversions: 420,
    revenue: 125580.00,
    budget: 15000,
    roiPredicted: 8.3,
    aiSuggestions: [
      'Add stock countdown on SoundSphere earbuds page as they are currently predicted to run out in 12 hours.'
    ]
  },
  {
    id: 'cmp_3',
    name: 'Eco-Friendly Outreach',
    type: 'coupon',
    status: 'scheduled',
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    clicks: 0,
    conversions: 0,
    revenue: 0,
    budget: 2500,
    roiPredicted: 3.2,
    aiSuggestions: [
      'Pre-generate coupon codes for users classified with low risk of churn to encourage high-value recovery transactions.'
    ]
  }
];

export const mockReviews: ProductReview[] = [
  {
    id: 'rev_1',
    productId: 'prod_1',
    productName: 'AeroWave Pro Running Shirt',
    customerName: 'Nguyễn Văn Minh',
    customerEmail: 'minhnv@gmail.com',
    rating: 5,
    comment: 'Áo mặc cực kỳ mát và nhẹ, thấm hút mồ hôi rất tốt khi chạy bộ đường dài. Rất đáng tiền!',
    status: 'approved',
    date: '2026-06-24T10:00:00Z',
    sentiment: 'positive',
    response: 'OmniShop rất vui vì bạn đã hài lòng với sản phẩm! Chúc bạn có những buổi chạy tuyệt vời.'
  },
  {
    id: 'rev_2',
    productId: 'prod_2',
    productName: 'SoundSphere ANC Earbuds',
    customerName: 'Lê Thảo Vy',
    customerEmail: 'vy.le@yahoo.com',
    rating: 4,
    comment: 'Chất âm rất hay, chống ồn chủ động tốt trong phân khúc tầm giá này. Tuy nhiên đeo lâu hơi mỏi tai một chút.',
    status: 'approved',
    date: '2026-06-23T15:30:00Z',
    sentiment: 'positive'
  },
  {
    id: 'rev_3',
    productId: 'prod_3',
    productName: 'ZenFlex Eco Yoga Mat',
    customerName: 'Trần Thanh Hải',
    customerEmail: 'haitt@hotmail.com',
    rating: 3,
    comment: 'Thảm có độ bám dính tốt, không bị trượt khi tập yoga nóng. Tuy nhiên mùi cao su tự nhiên lúc mới mở ra hơi nồng.',
    status: 'pending',
    date: '2026-06-22T08:45:00Z',
    sentiment: 'neutral'
  },
  {
    id: 'rev_4',
    productId: 'prod_1',
    productName: 'AeroWave Pro Running Shirt',
    customerName: 'Phạm Đức Anh',
    customerEmail: 'ducanh99@gmail.com',
    rating: 1,
    comment: 'Giao sai màu và size áo, liên hệ tổng đài không thấy ai phản hồi. Quá thất vọng!',
    status: 'pending',
    date: '2026-06-21T11:20:00Z',
    sentiment: 'negative'
  },
  {
    id: 'rev_5',
    productId: 'prod_4',
    productName: 'HydroShield Vacuum Flask',
    customerName: 'Hoàng Kim Chi',
    customerEmail: 'chihk@outlook.com',
    rating: 5,
    comment: 'Bình giữ nhiệt tốt vô cùng, để nước đá từ sáng đến tối muộn vẫn không bị tan. Thiết kế nhám mờ sang trọng.',
    status: 'approved',
    date: '2026-06-20T14:10:00Z',
    sentiment: 'positive'
  }
];
