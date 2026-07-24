import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../src/lib/mysql';
import { slugify } from '../src/server/utils/slug';

type CategorySeed = {
  name: string;
  image: string;
  sortOrder: number;
};

type ProductSeed = {
  category: string;
  sku: string;
  name: string;
  brand: string;
  images: string[];
  originalPrice: number;
  discountPrice: number;
  flashSalePrice?: number | null;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  stock: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  attributes?: Array<{ name: string; values: string[] }>;
  specification?: Record<string, string>;
  description: string;
};

const categories: CategorySeed[] = [
  {
    name: 'Dien thoai & Laptop',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&auto=format&fit=crop&q=80',
    sortOrder: 10,
  },
  {
    name: 'Thoi trang nam',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=900&auto=format&fit=crop&q=80',
    sortOrder: 20,
  },
  {
    name: 'Thoi trang nu',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80',
    sortOrder: 30,
  },
  {
    name: 'Gia dung & Doi song',
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=900&auto=format&fit=crop&q=80',
    sortOrder: 40,
  },
  {
    name: 'Me & Be',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=900&auto=format&fit=crop&q=80',
    sortOrder: 50,
  },
  {
    name: 'Lam dep & Cham soc',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&auto=format&fit=crop&q=80',
    sortOrder: 60,
  },
  {
    name: 'The thao & Du lich',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&auto=format&fit=crop&q=80',
    sortOrder: 70,
  },
  {
    name: 'Phu kien so',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&auto=format&fit=crop&q=80',
    sortOrder: 80,
  },
  {
    name: 'Sach & Van phong pham',
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=900&auto=format&fit=crop&q=80',
    sortOrder: 90,
  },
  {
    name: 'Noi that',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80',
    sortOrder: 100,
  },
  {
    name: 'Bep & An uong',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&auto=format&fit=crop&q=80',
    sortOrder: 110,
  },
  {
    name: 'Do choi & Giai tri',
    image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=900&auto=format&fit=crop&q=80',
    sortOrder: 120,
  },
];

const commonColors = ['Den', 'Trang', 'Xanh', 'Do', 'Vang'];
const commonSizes = ['S', 'M', 'L', 'XL', 'XXL'];

const products: ProductSeed[] = [
  {
    category: 'Dien thoai & Laptop',
    sku: 'IP15PM-256-BLU',
    name: 'iPhone 15 Pro Max 256GB Titan Xanh',
    brand: 'Apple',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=900&auto=format&fit=crop&q=80',
    ],
    originalPrice: 34990000,
    discountPrice: 29990000,
    flashSalePrice: 28990000,
    discountPercent: 14,
    rating: 4.8,
    reviewCount: 124,
    stock: 45,
    isBestSeller: true,
    attributes: [
      { name: 'Mau sac', values: ['Titan xanh', 'Titan den', 'Titan tu nhien'] },
      { name: 'Dung luong', values: ['256GB', '512GB', '1TB'] },
    ],
    specification: { ManHinh: '6.7 inch OLED', Chip: 'A17 Pro', Camera: '48MP', BaoHanh: '12 thang' },
    description: 'Dien thoai cao cap voi thiet ke titan, camera manh va hieu nang tot cho cong viec lan giai tri.',
  },
  {
    category: 'Dien thoai & Laptop',
    sku: 'S24U-256-TITAN',
    name: 'Samsung Galaxy S24 Ultra 12GB 256GB',
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 33990000,
    discountPrice: 26490000,
    flashSalePrice: 25990000,
    discountPercent: 22,
    rating: 4.7,
    reviewCount: 89,
    stock: 28,
    isNew: true,
    attributes: [{ name: 'Mau sac', values: ['Xam titan', 'Den titan', 'Tim titan'] }],
    specification: { ManHinh: '6.8 inch Dynamic AMOLED', Camera: '200MP', Pin: '5000mAh', But: 'S Pen' },
    description: 'Galaxy AI, camera 200MP va S Pen phu hop nguoi dung can dien thoai nang suat cao.',
  },
  {
    category: 'Dien thoai & Laptop',
    sku: 'MBA-M3-256-MID',
    name: 'MacBook Air 13 inch M3 8GB 256GB',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 27990000,
    discountPrice: 25490000,
    discountPercent: 9,
    rating: 4.9,
    reviewCount: 42,
    stock: 15,
    isNew: true,
    attributes: [
      { name: 'Mau sac', values: ['Xam', 'Bac', 'Vang'] },
      { name: 'Bo nho', values: ['8GB/256GB', '16GB/512GB'] },
    ],
    specification: { CPU: 'Apple M3', ManHinh: '13.6 inch Liquid Retina', Pin: 'Len den 18 gio', CanNang: '1.24kg' },
    description: 'Laptop mong nhe, pin lau, phu hop hoc tap, van phong va lam viec sang tao co ban.',
  },
  {
    category: 'Dien thoai & Laptop',
    sku: 'DELL-XPS13-9340',
    name: 'Dell XPS 13 Plus Core Ultra 7',
    brand: 'Dell',
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 38990000,
    discountPrice: 34990000,
    discountPercent: 10,
    rating: 4.6,
    reviewCount: 36,
    stock: 18,
    attributes: [{ name: 'Mau sac', values: ['Bac', 'Xam'] }],
    specification: { CPU: 'Intel Core Ultra 7', RAM: '16GB', SSD: '1TB', ManHinh: '13.4 inch OLED' },
    description: 'Laptop sieu mong voi man hinh dep, ban phim hien dai va hieu nang on dinh cho doanh nhan.',
  },
  {
    category: 'Thoi trang nam',
    sku: 'MEN-JACKET-WB01',
    name: 'Ao khoac gio nam WindBlocker chong nuoc',
    brand: 'Coolmate',
    images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 550000,
    discountPrice: 299000,
    flashSalePrice: 249000,
    discountPercent: 45,
    rating: 4.5,
    reviewCount: 310,
    stock: 120,
    isBestSeller: true,
    attributes: [
      { name: 'Mau sac', values: ['Den', 'Xanh than', 'Reu'] },
      { name: 'Kich co', values: commonSizes },
    ],
    specification: { ChatLieu: 'Polyester chong tham', Form: 'Regular fit', Tui: '2 tui khoa keo' },
    description: 'Ao khoac gio nhe, can gio va chong tham nhe, phu hop di lam hoac di choi.',
  },
  {
    category: 'Thoi trang nam',
    sku: 'MEN-POLO-BC02',
    name: 'Ao polo nam basic cotton co gian',
    brand: 'Routine',
    images: ['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 360000,
    discountPrice: 249000,
    discountPercent: 31,
    rating: 4.4,
    reviewCount: 188,
    stock: 210,
    attributes: [
      { name: 'Mau sac', values: ['Trang', 'Den', 'Be', 'Xanh navy'] },
      { name: 'Kich co', values: commonSizes },
    ],
    specification: { ChatLieu: 'Cotton pique', Form: 'Slim fit', HuongDan: 'Giat may nuoc lanh' },
    description: 'Ao polo de phoi do, chat lieu thoang, phu hop van phong va di choi hang ngay.',
  },
  {
    category: 'Thoi trang nam',
    sku: 'MEN-JEAN-SLIM01',
    name: 'Quan jean nam slim fit xanh dam',
    brand: 'Levents',
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 690000,
    discountPrice: 459000,
    discountPercent: 33,
    rating: 4.3,
    reviewCount: 96,
    stock: 86,
    attributes: [
      { name: 'Mau sac', values: ['Xanh dam', 'Den'] },
      { name: 'Kich co', values: ['29', '30', '31', '32', '34'] },
    ],
    specification: { ChatLieu: 'Denim co gian', Form: 'Slim fit', LuuY: 'Khong tay trang' },
    description: 'Quan jean nam form gon, de mac di lam va di choi.',
  },
  {
    category: 'Thoi trang nu',
    sku: 'WOMEN-DRESS-FL01',
    name: 'Dam midi hoa tiet hoa nhe nha',
    brand: 'Lamer',
    images: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 890000,
    discountPrice: 599000,
    discountPercent: 33,
    rating: 4.7,
    reviewCount: 145,
    stock: 64,
    isBestSeller: true,
    attributes: [
      { name: 'Mau sac', values: ['Trang hoa', 'Xanh hoa', 'Hong hoa'] },
      { name: 'Kich co', values: ['S', 'M', 'L', 'XL'] },
    ],
    specification: { ChatLieu: 'Voan mem', DaiVay: 'Midi', Form: 'Xoe nhe' },
    description: 'Dam midi nu tinh, chat lieu mem va nhe, phu hop di tiec nhe hoac cafe cuoi tuan.',
  },
  {
    category: 'Thoi trang nu',
    sku: 'WOMEN-BAG-TOTE01',
    name: 'Tui tote da mem cong so',
    brand: 'Juno',
    images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 750000,
    discountPrice: 529000,
    discountPercent: 29,
    rating: 4.5,
    reviewCount: 76,
    stock: 92,
    attributes: [{ name: 'Mau sac', values: ['Den', 'Nau', 'Kem'] }],
    specification: { ChatLieu: 'Da tong hop', KichThuoc: '32 x 28 x 12cm', Ngan: '3 ngan' },
    description: 'Tui tote rong, thiet ke thanh lich cho cong so va di choi.',
  },
  {
    category: 'Thoi trang nu',
    sku: 'WOMEN-SNEAKER-W01',
    name: 'Giay sneaker nu trang de em',
    brand: 'Ananas',
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 890000,
    discountPrice: 699000,
    discountPercent: 21,
    rating: 4.6,
    reviewCount: 201,
    stock: 73,
    isNew: true,
    attributes: [
      { name: 'Mau sac', values: ['Trang', 'Kem'] },
      { name: 'Kich co', values: ['36', '37', '38', '39', '40'] },
    ],
    specification: { ChatLieu: 'Canvas va da tong hop', De: 'Cao su', PhongCach: 'Basic' },
    description: 'Sneaker trang de phoi do, de em va phu hop di bo hang ngay.',
  },
  {
    category: 'Gia dung & Doi song',
    sku: 'AIRFRY-TEFAL-42',
    name: 'Noi chien khong dau Tefal Easy Fry 4.2L',
    brand: 'Tefal',
    images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 2990000,
    discountPrice: 1890000,
    flashSalePrice: 1690000,
    discountPercent: 37,
    rating: 4.7,
    reviewCount: 267,
    stock: 55,
    isBestSeller: true,
    attributes: [{ name: 'Mau sac', values: ['Den', 'Bac'] }],
    specification: { DungTich: '4.2L', CongSuat: '1500W', BaoHanh: '24 thang' },
    description: 'Noi chien khong dau dung tich vua, giup nau mon ngon it dau mo va de ve sinh.',
  },
  {
    category: 'Gia dung & Doi song',
    sku: 'VAC-DREAME-V12',
    name: 'May hut bui cam tay Dreame V12',
    brand: 'Dreame',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 8990000,
    discountPrice: 5990000,
    discountPercent: 33,
    rating: 4.6,
    reviewCount: 93,
    stock: 31,
    attributes: [{ name: 'Mau sac', values: ['Xam', 'Trang'] }],
    specification: { LucHut: '27000Pa', Pin: 'Len den 90 phut', PhuKien: '5 dau hut' },
    description: 'May hut bui khong day luc hut manh, phu hop nha o, can ho va xe hoi.',
  },
  {
    category: 'Gia dung & Doi song',
    sku: 'FAN-XIAOMI-2PRO',
    name: 'Quat thong minh Xiaomi Smart Fan 2 Pro',
    brand: 'Xiaomi',
    images: ['https://images.unsplash.com/photo-1628584170770-40729b3583be?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 2990000,
    discountPrice: 2190000,
    discountPercent: 27,
    rating: 4.5,
    reviewCount: 84,
    stock: 44,
    isNew: true,
    attributes: [{ name: 'Mau sac', values: ['Trang'] }],
    specification: { KetNoi: 'WiFi', Pin: 'Co pin sac', CheDo: 'Gio tu nhien' },
    description: 'Quat thong minh dieu khien qua app, co pin sac va van hanh em.',
  },
  {
    category: 'Me & Be',
    sku: 'BABY-STROLLER-A1',
    name: 'Xe day em be gap gon sieu nhe',
    brand: 'Joie',
    images: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 3990000,
    discountPrice: 2990000,
    discountPercent: 25,
    rating: 4.7,
    reviewCount: 63,
    stock: 22,
    attributes: [{ name: 'Mau sac', values: ['Xam', 'Den', 'Xanh'] }],
    specification: { TaiTrong: '15kg', CanNang: '5.9kg', DoTuoi: '0-36 thang' },
    description: 'Xe day em be nhe, de gap, co mai che nang va day an toan.',
  },
  {
    category: 'Me & Be',
    sku: 'BABY-DIAPER-M80',
    name: 'Bim ta quan em be size M goi 80 mieng',
    brand: 'Merries',
    images: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 520000,
    discountPrice: 429000,
    discountPercent: 18,
    rating: 4.8,
    reviewCount: 412,
    stock: 180,
    isBestSeller: true,
    attributes: [{ name: 'Kich co', values: ['S', 'M', 'L', 'XL'] }],
    specification: { SoLuong: '80 mieng', CanNang: '6-11kg', XuatXu: 'Nhat Ban' },
    description: 'Bim ta quan mem, tham hut tot va giup be thoai mai khi van dong.',
  },
  {
    category: 'Lam dep & Cham soc',
    sku: 'SKIN-SERUM-VC30',
    name: 'Serum Vitamin C sang da 30ml',
    brand: 'La Roche-Posay',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 980000,
    discountPrice: 799000,
    discountPercent: 18,
    rating: 4.6,
    reviewCount: 158,
    stock: 75,
    isNew: true,
    attributes: [{ name: 'Dung tich', values: ['30ml'] }],
    specification: { ThanhPhan: 'Vitamin C', LoaiDa: 'Moi loai da', HanDung: '24 thang' },
    description: 'Serum ho tro lam sang da, cai thien sac to va ket cau da.',
  },
  {
    category: 'Lam dep & Cham soc',
    sku: 'HAIR-DRY-DYSON',
    name: 'May say toc toc do cao ion am',
    brand: 'Dyson',
    images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 11990000,
    discountPrice: 9990000,
    discountPercent: 17,
    rating: 4.8,
    reviewCount: 71,
    stock: 19,
    isBestSeller: true,
    attributes: [{ name: 'Mau sac', values: ['Hong', 'Xam', 'Den'] }],
    specification: { CongSuat: '1600W', CheDoNhiet: '4 muc', BaoHanh: '24 thang' },
    description: 'May say toc cao cap, bao ve toc, say nhanh va tao kieu linh hoat.',
  },
  {
    category: 'The thao & Du lich',
    sku: 'RUN-SHOES-AIR01',
    name: 'Giay chay bo dem khi thoang nhe',
    brand: 'Nike',
    images: ['https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 3290000,
    discountPrice: 2490000,
    discountPercent: 24,
    rating: 4.7,
    reviewCount: 221,
    stock: 69,
    isBestSeller: true,
    attributes: [
      { name: 'Mau sac', values: ['Den', 'Trang', 'Xanh'] },
      { name: 'Kich co', values: ['39', '40', '41', '42', '43'] },
    ],
    specification: { DeGiay: 'Foam dan hoi', TrongLuong: '265g', PhuHop: 'Road running' },
    description: 'Giay chay bo nhe, dem em, ho tro tap luyen hang ngay.',
  },
  {
    category: 'The thao & Du lich',
    sku: 'BALO-TRAVEL-40L',
    name: 'Balo du lich chong nuoc 40L',
    brand: 'Naturehike',
    images: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 1290000,
    discountPrice: 899000,
    discountPercent: 30,
    rating: 4.5,
    reviewCount: 132,
    stock: 58,
    attributes: [{ name: 'Mau sac', values: ['Den', 'Xanh reu', 'Cam'] }],
    specification: { DungTich: '40L', ChatLieu: 'Nylon chong nuoc', NganLaptop: '15.6 inch' },
    description: 'Balo du lich rong, nhieu ngan, phu hop picnic, trekking nhe va cong tac ngan ngay.',
  },
  {
    category: 'Phu kien so',
    sku: 'SONY-XM5-BLK',
    name: 'Tai nghe Sony WH-1000XM5 chong on',
    brand: 'Sony',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 9490000,
    discountPrice: 6990000,
    flashSalePrice: 6490000,
    discountPercent: 26,
    rating: 4.8,
    reviewCount: 356,
    stock: 40,
    isBestSeller: true,
    attributes: [{ name: 'Mau sac', values: ['Den', 'Bac'] }],
    specification: { Pin: '30 gio', KetNoi: 'Bluetooth 5.2', ChongOn: 'ANC' },
    description: 'Tai nghe chong on cao cap, am thanh chi tiet va pin lau.',
  },
  {
    category: 'Phu kien so',
    sku: 'ANKER-PB-20K',
    name: 'Pin sac du phong Anker 20000mAh 30W',
    brand: 'Anker',
    images: ['https://images.unsplash.com/photo-1609592806596-b43bada2f2e9?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 1490000,
    discountPrice: 1090000,
    discountPercent: 27,
    rating: 4.6,
    reviewCount: 98,
    stock: 140,
    attributes: [{ name: 'Mau sac', values: ['Den', 'Trang'] }],
    specification: { DungLuong: '20000mAh', CongSuat: '30W', CongSac: 'USB-C' },
    description: 'Pin sac du phong dung luong lon, sac nhanh cho dien thoai va may tinh bang.',
  },
  {
    category: 'Phu kien so',
    sku: 'LOGI-MX-MASTER3S',
    name: 'Chuot Logitech MX Master 3S',
    brand: 'Logitech',
    images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 2590000,
    discountPrice: 1990000,
    discountPercent: 23,
    rating: 4.8,
    reviewCount: 119,
    stock: 52,
    isNew: true,
    attributes: [{ name: 'Mau sac', values: ['Den', 'Xam'] }],
    specification: { KetNoi: 'Bluetooth/USB Receiver', DPI: '8000', Pin: '70 ngay' },
    description: 'Chuot cong thai hoc cao cap cho lap trinh, thiet ke va van phong.',
  },
  {
    category: 'Sach & Van phong pham',
    sku: 'BOOK-ATOMIC-HABITS',
    name: 'Sach Atomic Habits ban tieng Viet',
    brand: 'NXB The Gioi',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 189000,
    discountPrice: 139000,
    discountPercent: 26,
    rating: 4.9,
    reviewCount: 520,
    stock: 300,
    isBestSeller: true,
    attributes: [{ name: 'Bia sach', values: ['Bia mem'] }],
    specification: { TacGia: 'James Clear', SoTrang: '320', NgonNgu: 'Tieng Viet' },
    description: 'Cuon sach ve thoi quen nho tao nen thay doi lon trong cong viec va cuoc song.',
  },
  {
    category: 'Sach & Van phong pham',
    sku: 'PEN-MUJI-05-BLK',
    name: 'Bo 5 but gel muc den 0.5mm',
    brand: 'Muji',
    images: ['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 150000,
    discountPrice: 99000,
    discountPercent: 34,
    rating: 4.5,
    reviewCount: 211,
    stock: 500,
    attributes: [{ name: 'Mau muc', values: ['Den', 'Xanh', 'Do'] }],
    specification: { DauBut: '0.5mm', SoLuong: '5 cay', LoaiMuc: 'Gel' },
    description: 'But gel viet em, muc deu, phu hop hoc tap va van phong.',
  },
  {
    category: 'Noi that',
    sku: 'CHAIR-ERGONOMIC-M1',
    name: 'Ghe cong thai hoc lung luoi cao cap',
    brand: 'ErgoHome',
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 4990000,
    discountPrice: 3590000,
    discountPercent: 28,
    rating: 4.6,
    reviewCount: 87,
    stock: 24,
    isBestSeller: true,
    attributes: [{ name: 'Mau sac', values: ['Den', 'Xam'] }],
    specification: { ChatLieu: 'Luoi thoang khi', TaiTrong: '120kg', BaoHanh: '36 thang' },
    description: 'Ghe cong thai hoc ho tro lung, tua dau va tay nang ha phu hop lam viec dai gio.',
  },
  {
    category: 'Noi that',
    sku: 'DESK-WOOD-120',
    name: 'Ban lam viec go soi 120cm',
    brand: 'HomeOffice',
    images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 2490000,
    discountPrice: 1890000,
    discountPercent: 24,
    rating: 4.4,
    reviewCount: 52,
    stock: 37,
    attributes: [{ name: 'Mau sac', values: ['Go tu nhien', 'Trang', 'Den'] }],
    specification: { KichThuoc: '120 x 60 x 75cm', ChatLieu: 'Go cong nghiep phu veneer', TaiTrong: '80kg' },
    description: 'Ban lam viec gon, mat ban rong va thiet ke toi gian cho phong lam viec tai nha.',
  },
  {
    category: 'Bep & An uong',
    sku: 'COFFEE-GRINDER-C1',
    name: 'May xay ca phe mini chinh co xay',
    brand: 'Timemore',
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 1290000,
    discountPrice: 990000,
    discountPercent: 23,
    rating: 4.7,
    reviewCount: 66,
    stock: 45,
    attributes: [{ name: 'Mau sac', values: ['Den', 'Bac'] }],
    specification: { ChatLieu: 'Hop kim nhom', LuoiXay: 'Thep khong gi', DieuChinh: 'Nhieu cap do' },
    description: 'May xay ca phe cam tay nho gon, co xay deu, phu hop pha pour over va espresso co ban.',
  },
  {
    category: 'Bep & An uong',
    sku: 'LUNCHBOX-INOX-3T',
    name: 'Hop com giu nhiet inox 3 tang',
    brand: 'LocknLock',
    images: ['https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 690000,
    discountPrice: 459000,
    discountPercent: 33,
    rating: 4.5,
    reviewCount: 174,
    stock: 110,
    attributes: [{ name: 'Mau sac', values: ['Bac', 'Xanh', 'Hong'] }],
    specification: { ChatLieu: 'Inox 304', SoTang: '3', DungTich: '1.8L' },
    description: 'Hop com giu nhiet tien loi cho van phong va hoc sinh.',
  },
  {
    category: 'Do choi & Giai tri',
    sku: 'LEGO-CITY-60368',
    name: 'Bo lap rap Lego City xe cuu hoa',
    brand: 'Lego',
    images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 1290000,
    discountPrice: 999000,
    discountPercent: 23,
    rating: 4.8,
    reviewCount: 82,
    stock: 33,
    isNew: true,
    attributes: [{ name: 'Do tuoi', values: ['6+', '8+'] }],
    specification: { SoManh: '250+', ChuDe: 'City', ChatLieu: 'Nhua ABS' },
    description: 'Bo lego chu de cuu hoa giup tre phat trien tu duy lap rap va sang tao.',
  },
  {
    category: 'Do choi & Giai tri',
    sku: 'BOARDGAME-CATAN-VN',
    name: 'Boardgame Catan ban Viet hoa',
    brand: 'BoardgameVN',
    images: ['https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=900&auto=format&fit=crop&q=80'],
    originalPrice: 990000,
    discountPrice: 790000,
    discountPercent: 20,
    rating: 4.6,
    reviewCount: 58,
    stock: 26,
    isBestSeller: true,
    attributes: [{ name: 'So nguoi choi', values: ['3-4', '5-6'] }],
    specification: { ThoiGian: '60-90 phut', DoTuoi: '10+', NgonNgu: 'Tieng Viet' },
    description: 'Boardgame chien thuat kinh dien cho gia dinh va nhom ban.',
  },
];

async function upsertCategory(category: CategorySeed) {
  const slug = slugify(category.name);

  await pool.query(
    `INSERT INTO categories (name, slug, image, status, sort_order)
     VALUES (?, ?, ?, 'active', ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       image = VALUES(image),
       status = 'active',
       sort_order = VALUES(sort_order),
       updated_at = NOW(3)`,
    [category.name, slug, category.image, category.sortOrder]
  );
}

async function getCategoryIds() {
  const [rows] = await pool.query<Array<RowDataPacket & { id: number; name: string; slug: string }>>(
    'SELECT id, name, slug FROM categories'
  );

  return new Map(rows.map((row) => [row.name, row.id]));
}

async function upsertProduct(product: ProductSeed, categoryId: number) {
  const slug = slugify(product.name);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO products
      (category_id, sku, name, slug, brand, images,
       original_price, discount_price, flash_sale_price, discount_percent,
       rating, review_count, stock, is_new, is_best_seller,
       attributes, specification, description, status)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
     ON DUPLICATE KEY UPDATE
       category_id = VALUES(category_id),
       name = VALUES(name),
       slug = VALUES(slug),
       brand = VALUES(brand),
       images = VALUES(images),
       original_price = VALUES(original_price),
       discount_price = VALUES(discount_price),
       flash_sale_price = VALUES(flash_sale_price),
       discount_percent = VALUES(discount_percent),
       rating = VALUES(rating),
       review_count = VALUES(review_count),
       stock = VALUES(stock),
       is_new = VALUES(is_new),
       is_best_seller = VALUES(is_best_seller),
       attributes = VALUES(attributes),
       specification = VALUES(specification),
       description = VALUES(description),
       status = 'active',
       updated_at = NOW()`,
    [
      categoryId,
      product.sku,
      product.name,
      slug,
      product.brand,
      JSON.stringify(product.images),
      product.originalPrice,
      product.discountPrice,
      product.flashSalePrice ?? null,
      product.discountPercent,
      product.rating,
      product.reviewCount,
      product.stock,
      Boolean(product.isNew),
      Boolean(product.isBestSeller),
      JSON.stringify(product.attributes || []),
      JSON.stringify(product.specification || {}),
      product.description,
    ]
  );

  return result.affectedRows;
}

async function main() {
  for (const category of categories) {
    await upsertCategory(category);
  }

  const categoryIds = await getCategoryIds();
  let affectedProducts = 0;

  for (const product of products) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) {
      throw new Error(`Missing category for product ${product.sku}: ${product.category}`);
    }

    affectedProducts += await upsertProduct(product, categoryId);
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
  console.log(`Product rows affected: ${affectedProducts}.`);
}

try {
  await main();
} finally {
  await pool.end();
}
