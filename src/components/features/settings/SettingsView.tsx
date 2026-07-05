import { useEffect, useState } from 'react';
import CustomSelect from '../../shared/ui/CustomSelect';
import { 
  Settings, UserCheck, CreditCard, Truck, BrainCircuit, 
  Bell, Save, CheckCircle2, ShieldAlert, Plus, Trash2, Edit3, Check, X, Key, Globe, Building, ChevronDown
} from 'lucide-react';

interface BankConfig {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  apiSignature: string;
  webhookUrl: string;
  details: string;
}

type UserRole = 'member' | 'seller' | 'admin';

interface RoleConfig {
  name: string;
  users: number;
  permissions: string[];
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function pickString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

async function readApiJson(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const preview = (await response.text()).slice(0, 80);
    throw new Error(`API trả về dữ liệu không phải JSON: ${preview}`);
  }
  return response.json();
}

const bankLogos: { [key: string]: string } = {
  'Vietcombank': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietcombank.png',
  'MBBank': 'https://cdn.haitrieu.com/wp-content/uploads/2022/02/Logo-MB-Bank-MBB.png',
  'Techcombank': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Techcombank-Red.png',
  'BIDV': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-BIDV.png',
  'ACB': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-ACB.png',
  'TPBank': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-TPBank.png',
  'OCB': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-OCB.png',
  'Agribank': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Agribank.png'
};

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'payments' | 'ai' | 'notifications'>('general');

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState('');
  const [notificationStats, setNotificationStats] = useState({ total: 0, active: 0, archived: 0 });

  // General settings state
  const [storeName, setStoreName] = useState('VeloCart');
  const [storeEmail, setStoreEmail] = useState('support@velocart.vn');
  const [legalName, setLegalName] = useState('Cong ty TNHH VeloCart Viet Nam');
  const [hotline, setHotline] = useState('0900000000');

  // Contact information settings state
  const [headOfficeAddress, setHeadOfficeAddress] = useState('25 Nguyen Hue, Phuong Ben Nghe, Quan 1, TP.HCM');
  const [warehouseAddress, setWarehouseAddress] = useState('88 Lang Ha, Quan Dong Da, Ha Noi');
  const [supportHours, setSupportHours] = useState('08:00 - 21:00 hang ngay');

  // Bank Transfer config state
  const [bankEnabled, setBankEnabled] = useState(true);
  const [banksList, setBanksList] = useState<BankConfig[]>([
    {
      id: 'bank_transfer',
      bankName: 'Vietcombank',
      accountNumber: '',
      accountName: 'VELOCart',
      apiSignature: '',
      webhookUrl: '',
      details: 'Vui long chuyen khoan dung noi dung: Ma don hang + so dien thoai.'
    }
  ]);

  // Bank addition state
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('Vietcombank');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newApiSignature, setNewApiSignature] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newDetails, setNewDetails] = useState('');

  const handleAddBank = () => {
    if (!newAccountNumber.trim() || !newAccountName.trim()) {
      alert('Vui lòng nhập đầy đủ Số tài khoản và Tên tài khoản!');
      return;
    }
    const bankId = `bank_${Date.now()}`;
    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://domain';
    const finalWebhookUrl = `${domain}/webhook/sieuthicode?type=${newBankName.toLowerCase().replace(/\s+/g, '')}`;

    const newBankItem: BankConfig = {
      id: bankId,
      bankName: newBankName,
      accountNumber: newAccountNumber,
      accountName: newAccountName.toUpperCase(),
      apiSignature: newApiSignature,
      webhookUrl: finalWebhookUrl,
      details: newDetails
    };
    setBanksList(prev => [...prev, newBankItem]);
    setIsAddingBank(false);
    // Reset inputs
    setNewAccountNumber('');
    setNewAccountName('');
    setNewApiSignature('');
    setNewWebhookUrl('');
    setNewDetails('');
  };

  const handleDeleteBank = (id: string) => {
    setBanksList(prev => prev.filter(b => b.id !== id));
  };

  // MoMo Payment config state
  const [momoEnabled, setMomoEnabled] = useState(true);
  const [momoPartnerCode, setMomoPartnerCode] = useState('');
  const [momoAccessKey, setMomoAccessKey] = useState('');
  const [momoSecretKey, setMomoSecretKey] = useState('');
  const [momoEnv, setMomoEnv] = useState('sandbox');

  // VNPAY Payment config state
  const [vnpayEnabled, setVnpayEnabled] = useState(true);
  const [vnpayTmnCode, setVnpayTmnCode] = useState('');
  const [vnpayHashSecret, setVnpayHashSecret] = useState('');
  const [vnpayUrl, setVnpayUrl] = useState('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');

  // Visa/Mastercard config state
  const [visaEnabled, setVisaEnabled] = useState(true);
  const [visaMerchantId, setVisaMerchantId] = useState('');
  const [visaSecretKey, setVisaSecretKey] = useState('');

  // Roles state maps directly to users.role ENUM('member', 'seller', 'admin').
  const [roles, setRoles] = useState<RoleConfig[]>([
    { name: 'Admin', users: 0, permissions: ['Quản trị hệ thống', 'Quản lý người dùng', 'Cấu hình dữ liệu'] },
    { name: 'Seller', users: 0, permissions: ['Quản lý sản phẩm', 'Xử lý đơn hàng', 'Xem khách hàng'] },
    { name: 'Member', users: 0, permissions: ['Mua hàng', 'Quản lý giỏ hàng', 'Nhận thông báo'] }
  ]);

  // AI settings state
  const [aiConfidence, setAiConfidence] = useState(85);
  const [aiAutoRespond, setAiAutoRespond] = useState(false);
  const [aiEscalationMode, setAiEscalationMode] = useState('immediate');

  // Notification flags state
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifSla, setNotifSla] = useState(true);
  const [notifFraud, setNotifFraud] = useState(false);
  const showConfigToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  useEffect(() => {
    let mounted = true;

    const loadDatabaseConfig = async () => {
      setIsLoadingConfig(true);
      setConfigError('');
      try {
        const [settingsResponse, paymentsResponse, usersResponse, notificationsResponse] = await Promise.all([
          fetch('/api/settings?includeInactive=true'),
          fetch('/api/payments?includeInactive=true'),
          fetch('/api/users'),
          fetch('/api/notifications'),
        ]);

        const [settingsData, paymentsData, usersData, notificationsData] = await Promise.all([
          readApiJson(settingsResponse),
          readApiJson(paymentsResponse),
          readApiJson(usersResponse),
          readApiJson(notificationsResponse),
        ]);

        if (!mounted) return;
        if (!settingsData.ok) throw new Error(settingsData.message || 'Không thể tải bảng settings');
        if (!paymentsData.ok) throw new Error(paymentsData.message || 'Không thể tải bảng payments');

        const settingsByKey = new Map<string, Record<string, any>>(
          (settingsData.settings || []).map((item: any) => [item.settingKey || item.key, asRecord(item.value)])
        );
        const contact = settingsByKey.get('contact_information') || {};
        const ai = settingsByKey.get('ai_customer_support') || {};
        const gemini = asRecord(ai.gemini);

        setStoreName(pickString(contact.storeName, 'VeloCart'));
        setLegalName(pickString(contact.legalName, 'Cong ty TNHH VeloCart Viet Nam'));
        setStoreEmail(pickString(contact.supportEmail, 'support@velocart.vn'));
        setHotline(pickString(contact.hotline, '0900000000'));
        setHeadOfficeAddress(pickString(contact.headOfficeAddress, '25 Nguyen Hue, Phuong Ben Nghe, Quan 1, TP.HCM'));
        setWarehouseAddress(pickString(contact.warehouseAddress, '88 Lang Ha, Quan Dong Da, Ha Noi'));
        setSupportHours(pickString(contact.supportHours, '08:00 - 21:00 hang ngay'));
        setAiAutoRespond(Boolean(ai.autoReply));
        setAiConfidence(typeof gemini.temperature === 'number' ? Math.round(gemini.temperature * 100) : 40);
        setAiEscalationMode(Array.isArray(ai.handoffKeywords) && ai.handoffKeywords.length ? 'immediate' : 'draft');

        const paymentsByCode = new Map<string, any>((paymentsData.payments || []).map((item: any) => [item.code, item]));
        const momo = paymentsByCode.get('momo');
        const vnpay = paymentsByCode.get('vnpay');
        const visa = paymentsByCode.get('visa');
        const bank = paymentsByCode.get('bank_transfer');
        const momoConfig = asRecord(momo?.config);
        const vnpayConfig = asRecord(vnpay?.config);
        const visaConfig = asRecord(visa?.config);
        const bankConfig = asRecord(bank?.config);

        setMomoEnabled(momo?.status !== 'inactive');
        setMomoPartnerCode(pickString(momoConfig.partnerCode));
        setMomoAccessKey(pickString(momoConfig.accessKey));
        setMomoSecretKey(pickString(momoConfig.secretKey));
        setMomoEnv(pickString(momoConfig.environment, 'sandbox'));

        setVnpayEnabled(vnpay?.status !== 'inactive');
        setVnpayTmnCode(pickString(vnpayConfig.vnp_TmnCode));
        setVnpayHashSecret(pickString(vnpayConfig.vnp_HashSecret));
        setVnpayUrl(pickString(vnpayConfig.urlEndpoint, 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'));

        setVisaEnabled(visa?.status !== 'inactive');
        setVisaMerchantId(pickString(visaConfig.merchantId));
        setVisaSecretKey(pickString(visaConfig.secretKey));

        setBankEnabled(bank?.status !== 'inactive');
        setBanksList([
          {
            id: 'bank_transfer',
            bankName: pickString(bankConfig.bankType, 'Vietcombank'),
            accountNumber: pickString(bankConfig.accountNumber),
            accountName: pickString(bankConfig.accountName, 'VELOCart'),
            apiSignature: pickString(bankConfig.webhookSignature),
            webhookUrl: pickString(bankConfig.webhookUrl),
            details: pickString(bankConfig.transferGuide, 'Vui long chuyen khoan dung noi dung: Ma don hang + so dien thoai.'),
          }
        ]);

        if (usersData.ok) {
          const roleCounts = (usersData.users || []).reduce((acc: Record<UserRole, number>, user: any) => {
            const role = ['admin', 'seller', 'member'].includes(user.role) ? user.role as UserRole : 'member';
            acc[role] += 1;
            return acc;
          }, { admin: 0, seller: 0, member: 0 });
          setRoles([
            { name: 'Admin', users: roleCounts.admin, permissions: ['Quản trị hệ thống', 'Quản lý người dùng', 'Cấu hình dữ liệu'] },
            { name: 'Seller', users: roleCounts.seller, permissions: ['Quản lý sản phẩm', 'Xử lý đơn hàng', 'Xem khách hàng'] },
            { name: 'Member', users: roleCounts.member, permissions: ['Mua hàng', 'Quản lý giỏ hàng', 'Nhận thông báo'] },
          ]);
        }

        if (notificationsData.ok) {
          const notifications = notificationsData.notifications || [];
          setNotificationStats({
            total: notifications.length,
            active: notifications.filter((item: any) => item.status !== 'archived').length,
            archived: notifications.filter((item: any) => item.status === 'archived').length,
          });
        }
      } catch (error) {
        if (!mounted) return;
        setConfigError(error instanceof Error ? error.message : 'Không thể tải cấu hình từ database.');
      } finally {
        if (mounted) setIsLoadingConfig(false);
      }
    };

    loadDatabaseConfig();
    return () => {
      mounted = false;
    };
  }, []);
  const handleSaveSettings = async () => {
    try {
      setConfigError('');
      const primaryBank = banksList[0];
      const contactValue = {
        storeName,
        legalName,
        hotline,
        supportEmail: storeEmail,
        salesEmail: storeEmail,
        headOfficeAddress,
        warehouseAddress,
        supportHours,
        chatChannels: { zalo: '', facebookMessenger: '', liveChat: true },
        socialLinks: { facebook: '', tiktok: '', instagram: '', youtube: '' },
        policyContacts: {
          returnExchange: storeEmail,
          warranty: storeEmail,
          deliverySupport: storeEmail,
          complaint: storeEmail,
        },
        returnAddress: warehouseAddress,
        appScheme: 'velocart://',
        mapUrl: '',
        taxCode: '',
        businessLicense: '',
      };
      const aiValue = {
        enabled: true,
        provider: 'gemini',
        fallbackProvider: 'chatgpt',
        language: 'vi',
        autoReply: aiAutoRespond,
        maxContextMessages: 20,
        handoffKeywords: aiEscalationMode === 'immediate'
          ? ['hoan tien', 'khieu nai', 'doi tra', 'gap nhan vien', 'complaint', 'refund']
          : [],
        systemPrompt: 'Ban la tro ly CSKH cua VeloCart. Tra loi ngan gon, lich su, uu tien tieng Viet, hoi them ma don hang khi can.',
        gemini: {
          apiKey: '',
          model: 'gemini-3.5-flash',
          temperature: Math.max(0, Math.min(1, aiConfidence / 100)),
          maxOutputTokens: 1024,
        },
        chatgpt: {
          apiKey: '',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4o-mini',
          temperature: Math.max(0, Math.min(1, aiConfidence / 100)),
          maxOutputTokens: 1024,
        }
      };

      const requests = [
        fetch('/api/settings/contact_information', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settingGroup: 'contact', title: 'Thong tin lien he app thuong mai dien tu', value: contactValue, status: 'active' }),
        }),
        fetch('/api/settings/ai_customer_support', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settingGroup: 'ai', title: 'Cau hinh CSKH bang AI', value: aiValue, status: 'active' }),
        }),
        fetch('/api/payments/momo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: momoEnabled ? 'active' : 'inactive', paymentStatusOnOrder: 'paid', config: { partnerCode: momoPartnerCode, accessKey: momoAccessKey, secretKey: momoSecretKey, environment: momoEnv, urlEndpoint: 'https://test-payment.momo.vn/v2/gateway/api/create', requiresOnlineCheckout: true } }),
        }),
        fetch('/api/payments/vnpay', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: vnpayEnabled ? 'active' : 'inactive', paymentStatusOnOrder: 'paid', config: { vnp_TmnCode: vnpayTmnCode, vnp_HashSecret: vnpayHashSecret, urlEndpoint: vnpayUrl, environment: 'sandbox', requiresOnlineCheckout: true } }),
        }),
        fetch('/api/payments/visa', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: visaEnabled ? 'active' : 'inactive', paymentStatusOnOrder: 'paid', config: { merchantId: visaMerchantId, secretKey: visaSecretKey, environment: 'sandbox', requiresOnlineCheckout: true } }),
        }),
        fetch('/api/payments/bank_transfer', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: bankEnabled ? 'active' : 'inactive', paymentStatusOnOrder: 'pending', config: { bankType: primaryBank?.bankName || 'Vietcombank', bankLogo: bankLogos[primaryBank?.bankName || 'Vietcombank'] || 'https://api.vietqr.io/img/VCB.png', accountNumber: primaryBank?.accountNumber || '', accountName: primaryBank?.accountName || 'VELOCart', webhookSignature: primaryBank?.apiSignature || '', webhookUrl: primaryBank?.webhookUrl || '', transferGuide: primaryBank?.details || 'Vui long chuyen khoan dung noi dung: Ma don hang + so dien thoai.', requiresOnlineCheckout: false } }),
        }),
      ];

      const responses = await Promise.all(requests);
      const failed = responses.find(response => !response.ok);
      if (failed) throw new Error('Có cấu hình không lưu được vào database.');

      showConfigToast('Cấu hình đã được lưu vào bảng settings và payments trong database.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu cấu hình.';
      setConfigError(message);
      showConfigToast(message);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] animate-fade-in relative">
      
      {/* Toast Alert Popups */}
      {showToast && (
        <div className="absolute top-4 right-4 z-50 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 animate-slide-right">
          <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {(isLoadingConfig || configError) && (
        <div className={['absolute top-4 left-4 z-50 px-4 py-3 rounded-lg shadow-xl border text-xs font-bold', configError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700'].join(' ')}>
          {configError || 'Đang tải cấu hình từ database...'}
        </div>
      )}

      {/* Side menu selection */}
      <div className="w-full md:w-64 border-r border-[#E2E8F0] bg-[#F8FAFC]/60 p-4 space-y-1.5 shrink-0">
        <div className="px-3 py-2 text-[10px] font-bold text-[#64748B] uppercase mb-2">
          Bảng Điều Khiển Cấu Hình
        </div>
        
        <button
          onClick={() => setActiveTab('general')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg text-left transition-all ${
            activeTab === 'general' ? 'bg-[#EFF6FF] text-[#2563EB] border-l-4 border-[#2563EB] rounded-r-lg rounded-l-none' : 'text-[#64748B] hover:bg-slate-100/80 hover:text-[#0F172A]'
          }`}
        >
          <Settings className="w-4 h-4" /> Cấu hình cửa hàng
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg text-left transition-all ${
            activeTab === 'roles' ? 'bg-[#EFF6FF] text-[#2563EB] border-l-4 border-[#2563EB] rounded-r-lg rounded-l-none' : 'text-[#64748B] hover:bg-slate-100/80 hover:text-[#0F172A]'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Vai trò & Quyền hạn
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg text-left transition-all ${
            activeTab === 'payments' ? 'bg-[#EFF6FF] text-[#2563EB] border-l-4 border-[#2563EB] rounded-r-lg rounded-l-none' : 'text-[#64748B] hover:bg-slate-100/80 hover:text-[#0F172A]'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Cấu hình Thanh toán & Vận chuyển
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg text-left transition-all ${
            activeTab === 'ai' ? 'bg-[#EFF6FF] text-[#2563EB] border-l-4 border-[#2563EB] rounded-r-lg rounded-l-none' : 'text-[#64748B] hover:bg-slate-100/80 hover:text-[#0F172A]'
          }`}
        >
          <BrainCircuit className="w-4 h-4" /> Trợ lý AI Co-pilot
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg text-left transition-all ${
            activeTab === 'notifications' ? 'bg-[#EFF6FF] text-[#2563EB] border-l-4 border-[#2563EB] rounded-r-lg rounded-l-none' : 'text-[#64748B] hover:bg-slate-100/80 hover:text-[#0F172A]'
          }`}
        >
          <Bell className="w-4 h-4" /> Thiết lập thông báo
        </button>
      </div>

      {/* Detail panel (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between bg-white h-full">
        <div className="space-y-6">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Cấu Hình Cửa Hàng Tổng Quan</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Xác định thông tin cơ bản về hồ sơ thương mại của cửa hàng và múi giờ giao dịch.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Tên Cửa Hàng / Doanh Nghiệp</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Email hỗ trợ khách hàng</label>
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Tên pháp nhân</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Hotline</label>
                  <input
                    type="text"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Địa chỉ trụ sở</label>
                  <textarea
                    value={headOfficeAddress}
                    onChange={(e) => setHeadOfficeAddress(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Địa chỉ kho hàng</label>
                  <textarea
                    value={warehouseAddress}
                    onChange={(e) => setWarehouseAddress(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Giờ hỗ trợ</label>
                  <input
                    type="text"
                    value={supportHours}
                    onChange={(e) => setSupportHours(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl p-4.5 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Globe className="w-4 h-4 text-[#2563EB]" />
                  <h4 className="text-xs font-bold text-[#0F172A]">Mapping bảng settings.contact_information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[#475569] font-semibold">
                  <div className="rounded-lg bg-white border border-slate-100 p-3">setting_key: <code className="font-mono text-blue-600">contact_information</code></div>
                  <div className="rounded-lg bg-white border border-slate-100 p-3">setting_group: <code className="font-mono text-blue-600">contact</code></div>
                  <div className="rounded-lg bg-white border border-slate-100 p-3">value.storeName: <strong>{storeName}</strong></div>
                  <div className="rounded-lg bg-white border border-slate-100 p-3">value.supportEmail: <strong>{storeEmail}</strong></div>
                  <div className="rounded-lg bg-white border border-slate-100 p-3 md:col-span-2">value.supportHours: <strong>{supportHours}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ROLES TAB */}
          {activeTab === 'roles' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Quản Lý Vai Trò & Phân Quyền</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Phân bổ quyền truy cập và hạn chế truy cập hệ thống bảo mật đối với các phòng ban.</p>
              </div>

              <div className="space-y-3">
                {roles.map((r, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A]">{r.name}</span>
                      <span className="text-[10px] font-semibold text-[#64748B] font-mono">{r.users} Thành viên đang hoạt động</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.map((p, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded-sm text-[10px] font-bold">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENTS TAB (HIGHLY ENHANCED WITH VN_GATEWAYS VNPAY, MOMO, VISA & BANKS) */}
          {activeTab === 'payments' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Cấu Hình Các Phương Thức Thanh Toán Giao Dịch</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Kích hoạt, điều chỉnh tham số kết nối API của cổng VNPAY, ví MoMo, thẻ tín dụng và thanh toán chuyển khoản ngân hàng (có Webhook tự động).</p>
              </div>

              <div className="space-y-5">
                
                {/* 1. CỔNG THANH TOÁN VNPAY */}
                <div className="border border-[#E2E8F0] rounded-xl p-4.5 bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png" 
                        alt="VNPAY Logo" 
                        className="w-10 h-7 object-contain bg-slate-50 p-1 rounded border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">Cổng Thanh Toán Quốc Tế VNPAY</h4>
                        <p className="text-[10px] text-[#64748B]">Thanh toán qua Ứng dụng ngân hàng qua mã QR, thẻ ATM & Tài khoản nội địa.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={vnpayEnabled} 
                        onChange={(e) => setVnpayEnabled(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                    </label>
                  </div>

                  {vnpayEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-1.5 text-xs font-semibold animate-fade-in">
                      <div>
                        <label className="block text-[#64748B] uppercase text-[9px] mb-1">Mã định danh VNPay (vnp_TmnCode)</label>
                        <input 
                          type="text" 
                          value={vnpayTmnCode} 
                          onChange={(e) => setVnpayTmnCode(e.target.value)}
                          placeholder="Mã TMNCode cung cấp bởi VNPAY"
                          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[#64748B] uppercase text-[9px] mb-1">Chuỗi bí mật kiểm băm (vnp_HashSecret)</label>
                        <input 
                          type="password" 
                          value={vnpayHashSecret} 
                          onChange={(e) => setVnpayHashSecret(e.target.value)}
                          placeholder="Mã HashSecret bảo mật"
                          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[#64748B] uppercase text-[9px] mb-1">URL Endpoint Thanh Toán VNPAY</label>
                        <input 
                          type="text" 
                          value={vnpayUrl} 
                          onChange={(e) => setVnpayUrl(e.target.value)}
                          placeholder="Link API redirect"
                          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. VÍ ĐIỆN TỬ MOMO */}
                <div className="border border-[#E2E8F0] rounded-xl p-4.5 bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Transparent.png" 
                        alt="MoMo Logo" 
                        className="w-8 h-8 object-contain bg-slate-50 p-0.5 rounded border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">Ví Điện Tử MoMo</h4>
                        <p className="text-[10px] text-[#64748B]">Cổng kết nối thanh toán ví MoMo trực tuyến bằng mã quét QRCode.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={momoEnabled} 
                        onChange={(e) => setMomoEnabled(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>

                  {momoEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-1.5 text-xs font-semibold animate-fade-in">
                      <div>
                        <label className="block text-[#64748B] uppercase text-[9px] mb-1">Mã Đối Tác (Partner Code)</label>
                        <input 
                          type="text" 
                          value={momoPartnerCode} 
                          onChange={(e) => setMomoPartnerCode(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[#64748B] uppercase text-[9px] mb-1">Mã Truy Cập (Access Key)</label>
                        <input 
                          type="text" 
                          value={momoAccessKey} 
                          onChange={(e) => setMomoAccessKey(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[#64748B] uppercase text-[9px] mb-1">Khóa Bảo Mật (Secret Key)</label>
                        <input 
                          type="password" 
                          value={momoSecretKey} 
                          onChange={(e) => setMomoSecretKey(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[#64748B] uppercase text-[9px] mb-1">Môi trường (Environment)</label>
                        <CustomSelect
                          value={momoEnv}
                          onChange={setMomoEnv}
                          options={[
                            { value: 'sandbox', label: 'Thử nghiệm (Sandbox)' },
                            { value: 'production', label: 'Môi trường thật (Production)' }
                          ]}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. THANH TOÁN CHUYỂN KHOẢN NGÂN HÀNG (MBBANK, ACB, VCB,...) */}
                <div className="border border-[#E2E8F0] rounded-xl p-4.5 bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-3">
                      <Building className="w-8 h-8 text-blue-600 bg-blue-50 p-1.5 rounded border border-blue-100" />
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">Thanh Toán Chuyển Khoản Ngân Hàng</h4>
                        <p className="text-[10px] text-[#64748B]">Tích hợp tài khoản ngân hàng và webhook tự động đồng bộ trạng thái đơn hàng.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={bankEnabled} 
                        onChange={(e) => setBankEnabled(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {bankEnabled && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Bank accounts list */}
                      <div className="grid grid-cols-1 gap-3">
                        {banksList.map((b) => (
                          <div key={b.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl relative flex flex-col md:flex-row md:items-start justify-between gap-3 group">
                            <div className="flex items-start gap-3">
                              <img 
                                src={bankLogos[b.bankName] || 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietcombank.png'} 
                                alt={b.bankName} 
                                className="w-11 h-8 object-contain bg-white px-1.5 py-1 rounded border border-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-[#0F172A]">{b.bankName}</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-600 rounded">WEBHOOK LIVE</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#475569] font-medium">
                                  <div>Số tài khoản: <strong className="font-semibold text-slate-800 font-mono">{b.accountNumber}</strong></div>
                                  <div>Chủ tài khoản: <strong className="font-semibold text-slate-800 uppercase">{b.accountName}</strong></div>
                                  <div className="sm:col-span-2 truncate flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5 text-slate-400" /> Webhook URL: <code className="bg-white px-1 border border-slate-200 text-[10px] text-blue-600 rounded font-mono truncate max-w-xs">{b.webhookUrl || 'Không cấu hình'}</code>
                                  </div>
                                  <div className="sm:col-span-2 truncate flex items-center gap-1">
                                    <Key className="w-3.5 h-3.5 text-slate-400" /> Webhook Signature: <code className="bg-white px-1 border border-slate-200 text-[10px] text-indigo-600 rounded font-mono truncate max-w-xs">{b.apiSignature || 'Không có'}</code>
                                  </div>
                                </div>
                                {b.details && (
                                  <p className="text-[10px] text-slate-400 italic font-medium pt-1">
                                    Ghi chú: {b.details}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteBank(b.id)}
                              className="md:absolute md:top-3 md:right-3 p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              title="Xóa cấu hình tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {banksList.length === 0 && (
                          <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-semibold text-slate-400">
                            Chưa có tài khoản ngân hàng nào được cấu hình.
                          </div>
                        )}
                      </div>

                      {/* Add new bank account panel */}
                      {isAddingBank ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 text-xs font-semibold">
                          <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                            <h5 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                              <Plus className="w-4 h-4 text-blue-600" /> Cấu hình tài khoản ngân hàng mới
                            </h5>
                            <button 
                              onClick={() => setIsAddingBank(false)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chọn Ngân Hàng</label>
                                <CustomSelect
                                  value={newBankName}
                                  onChange={setNewBankName}
                                  options={[
                                    { value: 'MBBank', label: 'MBBank (Ngân hàng Quân Đội)' },
                                    { value: 'ACB', label: 'ACB (Ngân hàng Á Châu)' },
                                    { value: 'Vietcombank', label: 'Vietcombank (Ngân hàng Ngoại Thương)' },
                                    { value: 'OCB', label: 'OCB (Ngân hàng Phương Đông)' },
                                    { value: 'TPBank', label: 'TPBank (Ngân hàng Tiên Phong)' },
                                    { value: 'BIDV', label: 'BIDV (Ngân hàng Đầu tư & Phát triển)' },
                                    { value: 'Techcombank', label: 'Techcombank (Ngân hàng Kỹ Thương)' },
                                    { value: 'Agribank', label: 'Agribank (Ngân hàng Nông nghiệp)' }
                                  ]}
                                  className="w-full font-bold"
                                  showSearch={true}
                                />
                            </div>

                            <div className="flex items-center justify-center pt-4">
                              <img 
                                src={bankLogos[newBankName]} 
                                alt={newBankName} 
                                className="h-10 object-contain bg-white px-2.5 py-1 rounded border border-slate-200 shadow-3xs"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Số Tài Khoản</label>
                              <input 
                                type="text"
                                value={newAccountNumber}
                                onChange={(e) => setNewAccountNumber(e.target.value)}
                                placeholder="Ví dụ: 0987654321"
                                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên Chủ Tài Khoản</label>
                              <input 
                                type="text"
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                                placeholder="Ví dụ: NGUYEN VAN A"
                                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none uppercase"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Signature Webhook Của Bạn (Từ nhà cung cấp API)</label>
                              <input 
                                type="text"
                                value={newApiSignature}
                                onChange={(e) => setNewApiSignature(e.target.value)}
                                placeholder="Khóa token signature xác thực"
                                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                                <span>Link Webhook Nhận Kết Quả</span>
                                <span className="text-blue-600 lowercase font-normal">(Tự động sinh ra)</span>
                              </label>
                              <input 
                                type="text"
                                disabled
                                value={(() => {
                                  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://domain';
                                  return `${domain}/webhook/sieuthicode?type=${newBankName.toLowerCase().replace(/\s+/g, '')}`;
                                })()}
                                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-slate-400 bg-slate-50 outline-none font-mono"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vùng Nhập Chi Tiết / Hướng Dẫn Chuyển Khoản</label>
                              <textarea
                                value={newDetails}
                                onChange={(e) => setNewDetails(e.target.value)}
                                placeholder="Ví dụ: Cú pháp: OMNI_Mã đơn hàng. Tiền được cộng tự động..."
                                rows={2}
                                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setIsAddingBank(false)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              onClick={handleAddBank}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-4 h-4" /> Hoàn tất thêm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsAddingBank(true)}
                          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-blue-600" /> Thêm tài khoản ngân hàng liên kết Webhook
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. THẺ VISA / MASTERCARD */}
                <div className="border border-[#E2E8F0] rounded-xl p-4.5 bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded bg-[#EFF6FF] flex items-center justify-center font-extrabold text-[#2563EB] text-xs">V/M</div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">Thẻ Tín Dụng Quốc Tế (Visa / Mastercard)</h4>
                        <p className="text-[10px] text-[#64748B]">Xử lý thanh toán thẻ quốc tế trực tiếp qua cổng liên kết toàn cầu.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visaEnabled} 
                        onChange={(e) => setVisaEnabled(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                    </label>
                  </div>

                  {visaEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-1.5 text-xs font-semibold animate-fade-in">
                      <div>
                        <label className="block text-[#64748B] uppercase text-[9px] mb-1">Mã định danh đơn vị (Merchant ID)</label>
                        <input 
                          type="text" 
                          value={visaMerchantId} 
                          onChange={(e) => setVisaMerchantId(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[#64748B] uppercase text-[9px] mb-1">Khóa Secret Key</label>
                        <input 
                          type="password" 
                          value={visaSecretKey} 
                          onChange={(e) => setVisaSecretKey(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Tùy Chọn Hoạt Động Trợ Lý AI Co-pilot</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Cấu hình độ nhạy, ngưỡng phản hồi tự động và cơ chế chuyển tiếp khi gặp cảm xúc tiêu cực.</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4 text-xs font-semibold">
                {/* Confidence threshold slider */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-[#0F172A]">
                    <span>Ngưỡng Tự Tin Khớp Lệnh Của Trợ Lý AI</span>
                    <span className="text-[#2563EB]">{aiConfidence}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={98}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    value={aiConfidence}
                    onChange={(e) => setAiConfidence(parseInt(e.target.value))}
                  />
                  <p className="text-[10px] text-[#64748B] leading-relaxed mt-1">
                    AI sẽ chỉ phản hồi trực tiếp cho khách hàng khi điểm đánh giá khớp ngữ cảnh cao hơn mức cấu hình. Ngược lại, AI sẽ soạn bản thảo gợi ý và đợi nhân viên phê duyệt.
                  </p>
                </div>

                {/* Auto reply boolean */}
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-4">
                  <div>
                    <span className="block font-bold text-[#0F172A]">Kích Hoạt Tự Động Trả Lời</span>
                    <span className="text-[10px] text-[#64748B]">Cho phép AI thay thế nhân viên trực tuyến giải quyết các ticket nhanh.</span>
                  </div>
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    checked={aiAutoRespond}
                    onChange={(e) => setAiAutoRespond(e.target.checked)}
                  />
                </div>

                {/* Escalation mode dropdown */}
                <div className="space-y-2 border-t border-slate-200/50 pt-4">
                  <label className="block font-bold text-[#0F172A]">Xử Lý Khi Khách Hàng Tiêu Cực (Phẫn nộ)</label>
                    <CustomSelect
                      value={aiEscalationMode}
                      onChange={setAiEscalationMode}
                      options={[
                        { value: 'immediate', label: 'Chuyển tiếp lập tức cho nhân viên hỗ trợ trực tiếp' },
                        { value: 'draft', label: 'Tiếp tục soạn bản thảo gợi ý cho hàng đợi' },
                        { value: 'block', label: 'Tạm dừng đoạn chat và thông báo quản trị viên' }
                      ]}
                      className="w-full"
                    />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Thiết Lập Nhận Cảnh Báo & Thông Báo Vận Hành</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Quản lý cách hệ thống gửi tin nhắn cảnh báo tồn kho, phản hồi chậm và rủi ro gian lận.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block font-bold text-[#0F172A]">Cảnh báo hết hàng / Tồn kho thấp</span>
                    <span className="text-[10px] text-[#64748B]">Báo động cho quản kho khi một sản phẩm giảm xuống dưới 10 đơn vị.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifLowStock} 
                    onChange={(e) => setNotifLowStock(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]" 
                  />
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                  <div>
                    <span className="block font-bold text-[#0F172A]">Cảnh báo vi phạm thời gian cam kết SLA</span>
                    <span className="text-[10px] text-[#64748B]">Cảnh báo quản lý khi thời hạn xử lý ticket phản hồi sắp hết (dưới 15 phút).</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifSla} 
                    onChange={(e) => setNotifSla(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]" 
                  />
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                  <div>
                    <span className="block font-bold text-[#0F172A]">Khóa băng đơn hàng có nguy cơ gian lận cao</span>
                    <span className="text-[10px] text-[#64748B]">Tự động đóng băng tạm thời các đơn hàng bị AI đánh giá rủi ro gian lận đỏ.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifFraud} 
                    onChange={(e) => setNotifFraud(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]" 
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer save */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" /> Lưu cấu hình hệ thống
          </button>
        </div>
      </div>
    </div>
  );
}








