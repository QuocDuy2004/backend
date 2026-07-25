import { useEffect, useState } from 'react';
import CustomSelect from '../../shared/ui/CustomSelect';
import {
  Settings, UserCheck, CreditCard, Truck, BrainCircuit,
  Bell, Save, CheckCircle2, ShieldAlert, Plus, Trash2, Edit3, Check, X, Key, Globe, Building, ChevronDown, Mail, Server
} from 'lucide-react';
import { dashboardApi, paymentsApi, settingsApi } from '../../../lib/api';

interface BankConfig {
  id: string;
  paymentId?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  apiSignature: string;
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

const BANK_OPTIONS = [
  { value: 'MBBank', label: 'MBBank' },
  { value: 'ACB', label: 'ACB' },
  { value: 'Vietcombank', label: 'Vietcombank' },
  { value: 'OCB', label: 'OCB' },
  { value: 'TPBank', label: 'TPBank' },
  { value: 'BIDV', label: 'BIDV' },
  { value: 'Techcombank', label: 'Techcombank' },
  { value: 'Agribank', label: 'Agribank' },
];

const bankLogoFiles: Record<string, string> = {
  MBBank: 'mbbank',
  ACB: 'acb',
  Vietcombank: 'vietcombank',
  TPBank: 'tpbank',
};

const getBankLogo = (bankType: string) => {
  const typeBank = bankLogoFiles[bankType.trim()] || bankType.trim().toLowerCase() || 'mbbank';
  return `https://api.sieuthicode.net/assets/images/${typeBank}.png`;
};

const createBankPaymentId = () => `bank_${Date.now()}`;

function PaymentSetupGuide({
  title,
  tone,
  steps,
  fields,
}: {
  title: string;
  tone: 'blue' | 'pink' | 'slate';
  steps: string[];
  fields: string[];
}) {
  const toneClass = {
    blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
    pink: 'border-pink-100 bg-pink-50/70 text-pink-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }[tone];

  return (
    <div className={`md:col-span-2 rounded-xl border p-3.5 ${toneClass}`}>
      <h5 className="text-[11px] font-extrabold uppercase tracking-wide">{title}</h5>
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px] leading-relaxed">
        <div>
          <p className="font-extrabold text-[#0F172A] mb-1">Vào đâu để lấy key</p>
          <ol className="pl-4 space-y-1 list-decimal text-slate-600">
            {steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
        <div>
          <p className="font-extrabold text-[#0F172A] mb-1">Key cần copy về hệ thống</p>
          <ul className="pl-4 space-y-1 list-disc text-slate-600">
            {fields.map((field) => <li key={field}>{field}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'payments' | 'smtp' | 'ai' | 'notifications'>('general');

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

  // SMTP marketing email settings state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Velocart');

  // Bank Transfer config state
  const [bankEnabled, setBankEnabled] = useState(true);
  const [banksList, setBanksList] = useState<BankConfig[]>([]);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankToDelete, setBankToDelete] = useState<BankConfig | null>(null);

  const getWebhookOrigin = () => {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    return window.location.origin || 'http://localhost:3000';
  };

  const buildBankWebhookUrl = (paymentId: string) => {
    const normalizedId = paymentId.trim() || 'bank_transfer';
    return `${getWebhookOrigin()}/webhook/sieuthicode?type=${encodeURIComponent(normalizedId)}`;
  };

  // Bank addition state
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankPaymentId, setNewBankPaymentId] = useState(createBankPaymentId());
  const [newBankName, setNewBankName] = useState('Vietcombank');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newApiSignature, setNewApiSignature] = useState('');

  const handleAddBank = async () => {
    if (!newAccountNumber.trim() || !newAccountName.trim()) {
      alert('Vui lòng nhập đầy đủ Số tài khoản và Tên tài khoản!');
      return;
    }
    const bankId = newBankPaymentId;

    const newBankItem: BankConfig = {
      id: bankId,
      paymentId: bankId,
      bankName: newBankName,
      accountNumber: newAccountNumber,
      accountName: newAccountName,
      apiSignature: newApiSignature,
      details: ''
    };

    try {
      setConfigError('');
      await saveBankPaymentToDatabase(newBankItem);
      setBanksList(prev => [newBankItem, ...prev.filter(bank => bank.id !== bankId)]);
      setIsAddingBank(false);
      setNewAccountNumber('');
      setNewAccountName('');
      setNewApiSignature('');
      setNewBankPaymentId(createBankPaymentId());
      showConfigToast(`Đã thêm ngân hàng và lưu logo_uri ${getBankLogo(newBankName)} vào bảng payments.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể thêm ngân hàng vào bảng payments.';
      setConfigError(message);
      showConfigToast(message);
    }
  };

  const handleDeleteBank = (id: string) => {
    const bank = banksList.find(item => item.id === id);
    if (bank) setBankToDelete(bank);
  };

  const confirmDeleteBank = async () => {
    if (!bankToDelete) return;
    const code = bankToDelete.paymentId || bankToDelete.id;
    try {
      setConfigError('');
      await paymentsApi.remove(code);

      setBanksList(prev => prev.filter(b => b.id !== bankToDelete.id));
      setBankToDelete(null);
      showConfigToast(`Đã xóa ${code} khỏi bảng payments.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xóa cấu hình ngân hàng khỏi bảng payments.';
      setConfigError(message);
      showConfigToast(message);
    }
  };

  const updateBankConfig = (currentId: string, field: keyof BankConfig, value: string) => {
    setBanksList(prev => prev.map(bank => {
      if (bank.id !== currentId) return bank;
      return { ...bank, [field]: value };
    }));
  };

  const buildBankPaymentPayload = (bank?: BankConfig) => {
    const bankType = bank?.bankName || 'MBBank';
    const bankLogoUri = getBankLogo(bankType);
    const paymentId = bank?.paymentId || bank?.id || createBankPaymentId();

    return {
      title: `Chuyen khoan ${bankType}`,
      status: bankEnabled ? 'active' : 'inactive',
      logoUri: bankLogoUri,
      logo_uri: bankLogoUri,
      config: {
        bankType,
        accountNumber: bank?.accountNumber || '',
        accountName: bank?.accountName || 'VELOCart',
        webhookSignature: bank?.apiSignature || '',
        apiToken: bank?.apiSignature || '',
        paymentId,
        webhookUrl: buildBankWebhookUrl(paymentId),
        transactionsEndpoint: 'https://api.sieuthicode.net/v1/transactions/list',
        transferGuide: bank?.details || 'Noi dung chuyen khoan: Ten nguoi chuyen + Ma don hang.',
        requiresOnlineCheckout: true,
      },
    };
  };

  const saveBankPaymentToDatabase = async (bank?: BankConfig) => {
    const payload = buildBankPaymentPayload(bank);
    const paymentId = bank?.paymentId || bank?.id || createBankPaymentId();
    try {
      return (await paymentsApi.save(paymentId, payload)).payment;
    } catch (error: any) {
      if (error?.status !== 404) throw error;
      return (await paymentsApi.create({
        ...payload,
        code: paymentId,
        title: payload.title || `Chuyen khoan ${bank?.bankName || 'MBBank'}`,
      })).payment;
    }
  };

  const handleBankTypeChange = async (bank: BankConfig, bankType: string) => {
    const nextBank = { ...bank, bankName: bankType };
    updateBankConfig(bank.id, 'bankName', bankType);

    try {
      setConfigError('');
      await saveBankPaymentToDatabase(nextBank);
      showConfigToast(`Đã lưu logo_uri ${getBankLogo(bankType)} vào bảng payments.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu bankType vào bảng payments.';
      setConfigError(message);
      showConfigToast(message);
    }
  };

  const saveBankConfig = async (bank: BankConfig) => {
    try {
      setConfigError('');
      await saveBankPaymentToDatabase(bank);
      setEditingBankId(null);
      showConfigToast('Đã sửa cấu hình ngân hàng trong bảng payments.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể sửa cấu hình ngân hàng.';
      setConfigError(message);
      showConfigToast(message);
    }
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
  const [vnpayCheckMessage, setVnpayCheckMessage] = useState('');
  const [vnpayCheckOk, setVnpayCheckOk] = useState<boolean | null>(null);
  const [isCheckingVnpay, setIsCheckingVnpay] = useState(false);

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
  const [aiAssistantStatus, setAiAssistantStatus] = useState<'active' | 'inactive'>('active');
  const [aiConfidence, setAiConfidence] = useState(85);
  const [aiAutoRespond, setAiAutoRespond] = useState(false);
  const [aiEscalationMode, setAiEscalationMode] = useState('immediate');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash');
  const [chatgptApiKey, setChatgptApiKey] = useState('');
  const [chatgptBaseUrl, setChatgptBaseUrl] = useState('https://api.openai.com/v1');
  const [chatgptModel, setChatgptModel] = useState('gpt-4o-mini');
  const [aiSystemPrompt, setAiSystemPrompt] = useState('Bạn là trợ lý CSKH của VeloCart. Trả lời ngắn gọn, lịch sự, ưu tiên tiếng Việt, hỏi thêm mã đơn hàng khi cần.');

  // Notification flags state
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifSla, setNotifSla] = useState(true);
  const [notifFraud, setNotifFraud] = useState(false);
  const showConfigToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleCheckVnpayConfig = async () => {
    setIsCheckingVnpay(true);
    setVnpayCheckMessage('');
    setVnpayCheckOk(null);

    try {
      const data = await paymentsApi.validateVnpay({
          tmnCode: vnpayTmnCode.trim(),
          hashSecret: vnpayHashSecret.trim(),
          url: vnpayUrl.trim() || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
          returnUrl: `${window.location.origin}/api/payments/vnpay/return`,
          environment: 'sandbox',
      });
      setVnpayCheckOk(Boolean(data.ok));
      setVnpayCheckMessage(data.message || (data.ok ? 'Cấu hình VNPay hợp lệ.' : 'Cấu hình VNPay chưa hợp lệ.'));
    } catch (error) {
      setVnpayCheckOk(false);
      setVnpayCheckMessage(error instanceof Error ? error.message : 'Không thể kiểm tra cấu hình VNPay.');
    } finally {
      setIsCheckingVnpay(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadDatabaseConfig = async () => {
      setIsLoadingConfig(true);
      setConfigError('');
      try {
        const [settingsData, paymentsData, usersData, notificationsData] = await dashboardApi.bootstrapSettings();

        if (!mounted) return;

        const settingsByKey = new Map<string, any>(
          (settingsData.settings || []).map((item: any) => [item.settingKey || item.key, item])
        );
        const contactSetting = settingsByKey.get('contact_information') || {};
        const aiSetting = settingsByKey.get('ai_customer_support') || {};
        const smtpSetting = settingsByKey.get('marketing_smtp_config') || {};
        const contact = asRecord(contactSetting.value);
        const ai = asRecord(aiSetting.value);
        const smtp = asRecord(smtpSetting.value);
        const gemini = asRecord(ai.gemini);
        const chatgpt = asRecord(ai.chatgpt);

        // Load VNPay config from settings table (primary source)
        const vnpaySettings = asRecord(settingsByKey.get('vnpay_config')?.value);
        // Load MoMo config from settings table (primary source)
        const momoSettings = asRecord(settingsByKey.get('momo_config')?.value);

        setStoreName(pickString(contact.storeName, 'VeloCart'));
        setLegalName(pickString(contact.legalName, 'Cong ty TNHH VeloCart Viet Nam'));
        setStoreEmail(pickString(contact.supportEmail, 'support@velocart.vn'));
        setHotline(pickString(contact.hotline, '0900000000'));
        setHeadOfficeAddress(pickString(contact.headOfficeAddress, '25 Nguyen Hue, Phuong Ben Nghe, Quan 1, TP.HCM'));
        setWarehouseAddress(pickString(contact.warehouseAddress, '88 Lang Ha, Quan Dong Da, Ha Noi'));
        setSupportHours(pickString(contact.supportHours, '08:00 - 21:00 hang ngay'));
        setSmtpHost(pickString(smtp.host));
        setSmtpPort(Number(smtp.port || 587));
        setSmtpSecure(Boolean(smtp.secure));
        setSmtpUsername(pickString(smtp.username));
        setSmtpPassword(pickString(smtp.password));
        setSmtpFromEmail(pickString(smtp.fromEmail || smtp.username || contact.supportEmail));
        setSmtpFromName(pickString(smtp.fromName, 'Velocart'));
        const nextAiStatus = aiSetting.status === 'inactive' || ai.enabled === false ? 'inactive' : 'active';
        setAiAssistantStatus(nextAiStatus);
        setAiAutoRespond(Boolean(ai.autoReply));
        setAiProvider(pickString(ai.provider, 'gemini'));
        setAiConfidence(typeof gemini.temperature === 'number' ? Math.round(gemini.temperature * 100) : 40);
        setAiEscalationMode(nextAiStatus === 'inactive' ? 'block' : (Array.isArray(ai.handoffKeywords) && ai.handoffKeywords.length ? 'immediate' : 'draft'));
        setGeminiApiKey(pickString(gemini.apiKey));
        setGeminiModel(pickString(gemini.model, 'gemini-3.5-flash'));
        setChatgptApiKey(pickString(chatgpt.apiKey));
        setChatgptBaseUrl(pickString(chatgpt.baseUrl, 'https://api.openai.com/v1'));
        setChatgptModel(pickString(chatgpt.model, 'gpt-4o-mini'));
        setAiSystemPrompt(pickString(ai.systemPrompt, 'Bạn là trợ lý CSKH của VeloCart. Trả lời ngắn gọn, lịch sự, ưu tiên tiếng Việt, hỏi thêm mã đơn hàng khi cần.'));

        // Load VNPay config from settings (primary) or fallback to payments table
        const paymentsByCode = new Map<string, any>((paymentsData.payments || []).map((item: any) => [item.code, item]));
        const vnpay = paymentsByCode.get('vnpay');
        const momo = paymentsByCode.get('momo');
        const visa = paymentsByCode.get('visa');
        const bankPayments = (paymentsData.payments || []).filter((item: any) => {
          const config = asRecord(item.config);
          return typeof config.bankType === 'string' && config.bankType.trim();
        });
        const bank = bankPayments[0];
        const vnpayPaymentConfig = asRecord(vnpay?.config);
        const momoPaymentConfig = asRecord(momo?.config);
        const visaConfig = asRecord(visa?.config);
        const bankConfig = asRecord(bank?.config);

        // VNPay - prioritize settings table, fallback to payments table
        setVnpayEnabled(vnpaySettings.enabled !== undefined ? Boolean(vnpaySettings.enabled) : (vnpay?.status !== 'inactive'));
        setVnpayTmnCode(pickString(vnpaySettings.tmnCode || vnpayPaymentConfig.vnp_TmnCode));
        setVnpayHashSecret(pickString(vnpaySettings.hashSecret || vnpayPaymentConfig.vnp_HashSecret));
        setVnpayUrl(pickString(vnpaySettings.url || vnpayPaymentConfig.urlEndpoint, 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'));

        // MoMo - prioritize settings table, fallback to payments table
        setMomoEnabled(momoSettings.enabled !== undefined ? Boolean(momoSettings.enabled) : (momo?.status !== 'inactive'));
        setMomoPartnerCode(pickString(momoSettings.partnerCode || momoPaymentConfig.partnerCode));
        setMomoAccessKey(pickString(momoSettings.accessKey || momoPaymentConfig.accessKey));
        setMomoSecretKey(pickString(momoSettings.secretKey || momoPaymentConfig.secretKey));
        setMomoEnv(pickString(momoSettings.environment || momoPaymentConfig.environment, 'sandbox'));

        setVisaEnabled(visa?.status !== 'inactive');
        setVisaMerchantId(pickString(visaConfig.merchantId));
        setVisaSecretKey(pickString(visaConfig.secretKey));

        setBankEnabled(bankPayments.length ? bankPayments.some((item: any) => item.status !== 'inactive') : true);
        setBanksList(bankPayments.map((item: any) => {
          const config = asRecord(item.config);
          const paymentId = pickString(config.paymentId, item.code || 'bank_transfer');

          return {
            id: paymentId,
            paymentId,
            bankName: pickString(config.bankType, 'Vietcombank'),
            accountNumber: pickString(config.accountNumber),
            accountName: pickString(config.accountName, 'VELOCart'),
            apiSignature: pickString(config.webhookSignature),
            details: pickString(config.transferGuide, 'Vui long chuyen khoan dung noi dung: Ma don hang + so dien thoai.'),
          };
        }));

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
        enabled: aiAssistantStatus === 'active',
        status: aiAssistantStatus,
        provider: aiProvider,
        fallbackProvider: aiProvider === 'gemini' ? 'chatgpt' : 'gemini',
        language: 'vi',
        autoReply: aiAutoRespond,
        maxContextMessages: 20,
        handoffKeywords: aiEscalationMode === 'immediate'
          ? ['hoan tien', 'khieu nai', 'doi tra', 'gap nhan vien', 'complaint', 'refund']
          : [],
        systemPrompt: aiSystemPrompt,
        gemini: {
          apiKey: geminiApiKey.trim(),
          model: geminiModel.trim() || 'gemini-3.5-flash',
          temperature: Math.max(0, Math.min(1, aiConfidence / 100)),
          maxOutputTokens: 1024,
        },
        chatgpt: {
          apiKey: chatgptApiKey.trim(),
          baseUrl: chatgptBaseUrl.trim() || 'https://api.openai.com/v1',
          model: chatgptModel.trim() || 'gpt-4o-mini',
          temperature: Math.max(0, Math.min(1, aiConfidence / 100)),
          maxOutputTokens: 1024,
        }
      };

      const vnpayConfigValue = {
        tmnCode: vnpayTmnCode.trim(),
        hashSecret: vnpayHashSecret.trim(),
        url: vnpayUrl.trim() || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/payments/vnpay/return` : 'http://localhost:3000/api/payments/vnpay/return',
        environment: 'sandbox',
        enabled: vnpayEnabled,
      };

      const momoConfigValue = {
        partnerCode: momoPartnerCode.trim(),
        accessKey: momoAccessKey.trim(),
        secretKey: momoSecretKey.trim(),
        endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
        returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/payments/momo/return` : 'http://localhost:3000/api/payments/momo/return',
        ipnUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/payments/momo/ipn` : 'http://localhost:3000/api/payments/momo/ipn',
        environment: momoEnv,
        enabled: momoEnabled,
      };

      const smtpConfigValue = {
        host: smtpHost.trim(),
        port: Number(smtpPort) || 587,
        secure: smtpSecure,
        username: smtpUsername.trim(),
        password: smtpPassword,
        fromEmail: smtpFromEmail.trim(),
        fromName: smtpFromName.trim() || 'Velocart',
      };

      const requests = [
        settingsApi.save('contact_information', { settingGroup: 'contact', title: 'Thong tin lien he app thuong mai dien tu', value: contactValue, status: 'active' }),
        settingsApi.save('ai_customer_support', { settingGroup: 'ai', title: 'Cau hinh CSKH bang AI', value: aiValue, status: aiAssistantStatus }),
        settingsApi.save('marketing_smtp_config', { settingGroup: 'marketing', title: 'Cau hinh SMTP gui email marketing', value: smtpConfigValue, status: smtpConfigValue.host ? 'active' : 'inactive' }),
        settingsApi.save('vnpay_config', { settingGroup: 'payment', title: 'Cau hinh thanh toan VNPay', value: vnpayConfigValue, status: vnpayEnabled ? 'active' : 'inactive' }),
        settingsApi.save('momo_config', { settingGroup: 'payment', title: 'Cau hinh thanh toan MoMo', value: momoConfigValue, status: momoEnabled ? 'active' : 'inactive' }),
        paymentsApi.save('momo', { status: momoEnabled ? 'active' : 'inactive', config: { partnerCode: momoPartnerCode, accessKey: momoAccessKey, secretKey: momoSecretKey, environment: momoEnv, urlEndpoint: 'https://test-payment.momo.vn/v2/gateway/api/create', requiresOnlineCheckout: true } }),
        paymentsApi.save('vnpay', { status: vnpayEnabled ? 'active' : 'inactive', config: { vnp_TmnCode: vnpayTmnCode, vnp_HashSecret: vnpayHashSecret, urlEndpoint: vnpayUrl, environment: 'sandbox', requiresOnlineCheckout: true } }),
        paymentsApi.save('visa', {
            status: visaEnabled ? 'active' : 'inactive',
            config: {
              provider: 'vnpay',
              merchantId: visaMerchantId,
              secretKey: visaSecretKey,
              endpoint: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
              returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/payments/visa/return` : 'http://localhost:3000/api/payments/visa/return',
              ipnUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/payments/visa/ipn` : 'http://localhost:3000/api/payments/visa/ipn',
              environment: 'sandbox',
              requiresOnlineCheckout: true,
              cardType: 'international',
            },
          }),
        ...banksList.map(bank => paymentsApi.save(bank.paymentId || bank.id, buildBankPaymentPayload(bank))),
      ];

      await Promise.all(requests);

      showConfigToast('Cấu hình đã được lưu vào bảng settings và payments trong database.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu cấu hình.';
      setConfigError(message);
      showConfigToast(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-blue-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Cấu Hình Hệ Thống</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Thiết lập thông tin cửa hàng, thanh toán, SMTP, trợ lý AI và thông báo vận hành.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-260px)] min-h-[560px] relative">

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

      {bankToDelete && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-md bg-white border shadow-2xl rounded-xl border-slate-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-[#0F172A]">Xóa ngân hàng?</h4>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Thao tác này sẽ xóa cấu hình khỏi bảng payments.</p>
              </div>
              <button
                type="button"
                onClick={() => setBankToDelete(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-4 space-y-2 text-xs font-semibold text-slate-600">
              <div>Ngân hàng: <strong className="text-[#0F172A]">{bankToDelete.bankName}</strong></div>
              <div>Payment ID: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-blue-600">{bankToDelete.paymentId || bankToDelete.id}</code></div>
              {bankToDelete.accountNumber ? (
                <div>Số tài khoản: <strong className="font-mono text-[#0F172A]">{bankToDelete.accountNumber}</strong></div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBankToDelete(null)}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDeleteBank}
                className="px-3 py-2 text-xs font-bold text-white rounded-lg bg-rose-600 hover:bg-rose-700"
              >
                Xóa ngân hàng
              </button>
            </div>
          </div>
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
          <CreditCard className="w-4 h-4" /> Cấu hình Thanh toán
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg text-left transition-all ${
            activeTab === 'smtp' ? 'bg-[#EFF6FF] text-[#2563EB] border-l-4 border-[#2563EB] rounded-r-lg rounded-l-none' : 'text-[#64748B] hover:bg-slate-100/80 hover:text-[#0F172A]'
          }`}
        >
          <Mail className="w-4 h-4" /> SMTP Email Marketing
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg text-left transition-all ${
            activeTab === 'ai' ? 'bg-[#EFF6FF] text-[#2563EB] border-l-4 border-[#2563EB] rounded-r-lg rounded-l-none' : 'text-[#64748B] hover:bg-slate-100/80 hover:text-[#0F172A]'
          }`}
        >
          <BrainCircuit className="w-4 h-4" /> Cấu hình AI
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
      <div className="flex flex-col justify-between flex-1 h-full p-6 overflow-y-auto bg-white">
        <div className="space-y-6">

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Cấu Hình Cửa Hàng Tổng Quan</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Xác định thông tin cơ bản về hồ sơ thương mại của cửa hàng và múi giờ giao dịch.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <div className="p-3 bg-white border rounded-lg border-slate-100">setting_key: <code className="font-mono text-blue-600">contact_information</code></div>
                  <div className="p-3 bg-white border rounded-lg border-slate-100">setting_group: <code className="font-mono text-blue-600">contact</code></div>
                  <div className="p-3 bg-white border rounded-lg border-slate-100">value.storeName: <strong>{storeName}</strong></div>
                  <div className="p-3 bg-white border rounded-lg border-slate-100">value.supportEmail: <strong>{storeEmail}</strong></div>
                  <div className="p-3 bg-white border rounded-lg border-slate-100 md:col-span-2">value.supportHours: <strong>{supportHours}</strong></div>
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
                  <div key={i} className="p-4 space-y-2 border bg-slate-50 rounded-xl border-slate-100">
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
                        className="object-contain w-10 p-1 border rounded h-7 bg-slate-50 border-slate-100"
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
                      <div className="md:col-span-2 rounded-xl border border-[#E2E8F0] bg-slate-50 p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[11px] font-black uppercase text-[#0F172A]">Kiểm tra chữ ký VNPay</p>
                            <p className="mt-1 text-[11px] leading-5 text-[#64748B]">Dùng đúng bộ key sandbox/production trước khi bật thanh toán trong checkout.</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCheckVnpayConfig}
                            disabled={isCheckingVnpay}
                            className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-black text-white disabled:cursor-wait disabled:bg-slate-300"
                          >
                            {isCheckingVnpay ? 'Đang kiểm tra...' : 'Kiểm tra key'}
                          </button>
                        </div>
                        {vnpayCheckMessage ? (
                          <div className={`mt-3 rounded-lg border px-3 py-2 text-[11px] font-bold leading-5 ${vnpayCheckOk ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                            {vnpayCheckMessage}
                          </div>
                        ) : null}
                      </div>
                      <PaymentSetupGuide
                        title="Hướng dẫn lấy key VNPAY"
                        tone="blue"
                        steps={[
                          'Đăng nhập cổng Merchant/Admin do VNPAY cấp cho doanh nghiệp.',
                          'Mở phần quản lý website/ứng dụng thanh toán hoặc thông tin tích hợp.',
                          'Tìm mục thông tin kết nối API/IPN/Payment Gateway.',
                          'Copy đúng bộ key theo môi trường đang dùng: sandbox dùng key sandbox, production dùng key production.',
                          'Nếu kiểm tra báo Sai chữ ký, hãy lấy lại HashSecret từ cổng sandbox/merchant và lưu lại trước khi checkout.',
                        ]}
                        fields={[
                          'vnp_TmnCode: mã website/terminal/merchant của shop trên VNPAY.',
                          'vnp_HashSecret: khóa bí mật dùng để ký và kiểm tra checksum.',
                          'URL Endpoint: link thanh toán VNPAY tương ứng sandbox hoặc production.',
                        ]}
                      />
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
                      <PaymentSetupGuide
                        title="Hướng dẫn lấy key MoMo"
                        tone="pink"
                        steps={[
                          'Đăng nhập MoMo Business/Merchant Center bằng tài khoản merchant.',
                          'Vào phần Payment Gateway, API Integration hoặc thông tin đối tác.',
                          'Chọn đúng ứng dụng/shop cần tích hợp để xem bộ thông tin kết nối.',
                          'Copy đúng bộ key theo môi trường sandbox hoặc production.',
                        ]}
                        fields={[
                          'Partner Code: mã đối tác/merchant do MoMo cấp.',
                          'Access Key: khóa truy cập API của merchant.',
                          'Secret Key: khóa bí mật dùng để ký request và xác thực callback.',
                          'Environment: chọn sandbox nếu dùng bộ key test, production nếu dùng bộ key thật.',
                        ]}
                      />
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
                                src={getBankLogo(b.bankName)}
                                alt={b.bankName}
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none';
                                }}
                                className="w-11 h-8 object-contain bg-white px-1.5 py-1 rounded border border-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-[#0F172A]">{b.bankName}</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-600 rounded">WEBHOOK LIVE</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#475569] font-medium">
                                  <div>Số tài khoản: <strong className="font-mono font-semibold text-slate-800">{b.accountNumber}</strong></div>
                                  <div>Chủ tài khoản: <strong className="font-semibold uppercase text-slate-800">{b.accountName}</strong></div>
                                  <div className="flex items-center gap-1 truncate sm:col-span-2">
                                    <Globe className="w-3.5 h-3.5 text-slate-400" /> Webhook URL: <code className="bg-white px-1 border border-slate-200 text-[10px] text-blue-600 rounded font-mono truncate max-w-xs">{buildBankWebhookUrl(b.paymentId || b.id)}</code>
                                  </div>
                                  <div className="flex items-center gap-1 truncate sm:col-span-2">
                                    <Key className="w-3.5 h-3.5 text-slate-400" /> Webhook Signature: <code className="bg-white px-1 border border-slate-200 text-[10px] text-indigo-600 rounded font-mono truncate max-w-xs">{b.apiSignature || 'Không có'}</code>
                                  </div>
                                </div>
                                {editingBankId === b.id && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Ngân hàng</label>
                                    <CustomSelect
                                      value={b.bankName}
                                      onChange={(value) => handleBankTypeChange(b, value)}
                                      options={BANK_OPTIONS}
                                      className="w-full font-bold"
                                      showSearch={true}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Số tài khoản</label>
                                    <input
                                      type="text"
                                      value={b.accountNumber}
                                      onChange={(e) => updateBankConfig(b.id, 'accountNumber', e.target.value)}
                                      className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[11px] text-[#0F172A] outline-none font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Chủ tài khoản</label>
                                    <input
                                      type="text"
                                      value={b.accountName}
                                      onChange={(e) => updateBankConfig(b.id, 'accountName', e.target.value)}
                                      className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[11px] text-[#0F172A] outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Signature / API Token</label>
                                    <input
                                      type="text"
                                      value={b.apiSignature}
                                      onChange={(e) => updateBankConfig(b.id, 'apiSignature', e.target.value)}
                                      className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[11px] text-[#0F172A] outline-none font-mono"
                                    />
                                  </div>
                                </div>
                                )}
                              </div>
                            </div>

                            <div className="md:absolute md:top-3 md:right-3 flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => editingBankId === b.id ? saveBankConfig(b) : setEditingBankId(b.id)}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"
                                title={editingBankId === b.id ? 'Lưu cấu hình tài khoản vào database' : 'Sửa cấu hình tài khoản'}
                              >
                                {editingBankId === b.id ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteBank(b.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg"
                                title="Xóa cấu hình tài khoản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {banksList.length === 0 && (
                          <div className="py-6 text-xs font-semibold text-center border border-dashed bg-slate-50 rounded-xl border-slate-200 text-slate-400">
                            Chưa có tài khoản ngân hàng nào được cấu hình.
                          </div>
                        )}
                      </div>

                      {/* Add new bank account panel */}
                      {isAddingBank ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 text-xs font-semibold">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                            <h5 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                              <Plus className="w-4 h-4 text-blue-600" /> Cấu hình tài khoản ngân hàng mới
                            </h5>
                            <button
                              onClick={() => setIsAddingBank(false)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chọn Ngân Hàng</label>
                                <CustomSelect
                                  value={newBankName}
                                  onChange={setNewBankName}
                                  options={BANK_OPTIONS}
                                  className="w-full font-bold"
                                  showSearch={true}
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
                                <span className="font-normal text-blue-600 lowercase">(Tự động sinh ra)</span>
                              </label>
                              <input
                                type="text"
                                disabled
                                value={buildBankWebhookUrl(newBankPaymentId)}
                                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-slate-400 bg-slate-50 outline-none font-mono"
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
                          onClick={() => {
                            setNewBankPaymentId(createBankPaymentId());
                            setIsAddingBank(true);
                          }}
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
                      <PaymentSetupGuide
                        title="Hướng dẫn lấy key Visa / Mastercard"
                        tone="slate"
                        steps={[
                          'Đăng nhập dashboard của đơn vị cổng thanh toán thẻ quốc tế/acquirer đang dùng.',
                          'Mở mục Developers, API Keys, Merchant Settings hoặc Integration.',
                          'Chọn merchant/site/app của shop để xem thông tin tích hợp thẻ.',
                          'Copy đúng key sandbox hoặc production theo môi trường thanh toán.',
                        ]}
                        fields={[
                          'Merchant ID: mã định danh merchant/shop trên cổng thẻ.',
                          'Secret Key: khóa bí mật dùng để ký request hoặc verify giao dịch.',
                          'Một số gateway có thêm Public Key, Client ID, Terminal ID hoặc Profile ID; nếu có thì lưu theo tài liệu gateway tương ứng.',
                        ]}
                      />
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

              <div className="p-5 space-y-4 text-xs font-semibold border bg-slate-50 rounded-xl border-slate-100">
                <div className="flex items-center justify-between p-4 bg-white border rounded-xl border-slate-200">
                  <div>
                    <span className="block font-bold text-[#0F172A]">Trạng thái AI trả lời khách hàng</span>
                    <span className="text-[10px] text-[#64748B]">
                      Khi tạm dừng, `settings.ai_customer_support.status` được lưu là `inactive` và ChatBox sẽ không tự sinh câu trả lời AI.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiAssistantStatus((current) => current === 'active' ? 'inactive' : 'active')}
                    className={`relative h-6 w-11 rounded-full transition-colors ${aiAssistantStatus === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    title={aiAssistantStatus === 'active' ? 'Tạm dừng AI trả lời' : 'Bật AI trả lời'}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${aiAssistantStatus === 'active' ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block font-bold text-[#0F172A]">Nhà cung cấp AI dùng cho ChatBox Expo</label>
                    <CustomSelect
                      value={aiProvider}
                      onChange={setAiProvider}
                      options={[
                        { value: 'gemini', label: 'Gemini' },
                        { value: 'chatgpt', label: 'GPT / OpenAI compatible' },
                      ]}
                      className="w-full"
                    />
                    <p className="text-[10px] text-[#64748B] leading-relaxed">
                      Cấu hình này được lưu tại `settings.ai_customer_support` và được API `/api/ai/customer-support` sử dụng cho ChatBox khách hàng.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-bold text-[#0F172A]">System prompt</label>
                    <textarea
                      value={aiSystemPrompt}
                      onChange={(e) => setAiSystemPrompt(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4 border-t lg:grid-cols-2 border-slate-200/50">
                  <div className={['rounded-xl border p-4 space-y-3 bg-white', aiProvider === 'gemini' ? 'border-blue-200 ring-2 ring-blue-50' : 'border-slate-200'].join(' ')}>
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-[#0F172A]">Gemini</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gemini API key</label>
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIza..."
                        className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Model Gemini</label>
                      <input
                        type="text"
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value)}
                        placeholder="gemini-3.5-flash"
                        className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className={['rounded-xl border p-4 space-y-3 bg-white', aiProvider === 'chatgpt' ? 'border-blue-200 ring-2 ring-blue-50' : 'border-slate-200'].join(' ')}>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-[#0F172A]">GPT / OpenAI compatible</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">API key</label>
                      <input
                        type="password"
                        value={chatgptApiKey}
                        onChange={(e) => setChatgptApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Base URL</label>
                      <input
                        type="text"
                        value={chatgptBaseUrl}
                        onChange={(e) => setChatgptBaseUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Model GPT</label>
                      <input
                        type="text"
                        value={chatgptModel}
                        onChange={(e) => setChatgptModel(e.target.value)}
                        placeholder="gpt-4o-mini"
                        className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

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
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-slate-200"
                    value={aiConfidence}
                    onChange={(e) => setAiConfidence(parseInt(e.target.value))}
                  />
                  <p className="text-[10px] text-[#64748B] leading-relaxed mt-1">
                    AI sẽ chỉ phản hồi trực tiếp cho khách hàng khi điểm đánh giá khớp ngữ cảnh cao hơn mức cấu hình. Ngược lại, AI sẽ soạn bản thảo gợi ý và đợi nhân viên phê duyệt.
                  </p>
                </div>

                {/* Auto reply boolean */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
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
                <div className="pt-4 space-y-2 border-t border-slate-200/50">
                  <label className="block font-bold text-[#0F172A]">Xử Lý Khi Khách Hàng Tiêu Cực (Phẫn nộ)</label>
                    <CustomSelect
                      value={aiEscalationMode}
                      onChange={(value) => {
                        setAiEscalationMode(value);
                        setAiAssistantStatus(value === 'block' ? 'inactive' : 'active');
                      }}
                      options={[
                        { value: 'immediate', label: 'Chuyển tiếp lập tức cho nhân viên hỗ trợ trực tiếp' },
                        { value: 'draft', label: 'Tiếp tục soạn bản thảo gợi ý cho hàng đợi' },
                        { value: 'block', label: 'Tắt AI trả lời và lưu status inactive' }
                      ]}
                      className="w-full"
                    />
                    <p className="text-[10px] text-[#64748B] leading-relaxed">
                      Chọn chế độ tắt sẽ cập nhật `settings.ai_customer_support.status = inactive`.
                    </p>
                </div>
              </div>
            </div>
          )}

          {/* SMTP TAB */}
          {activeTab === 'smtp' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#2563EB]" />
                  Cấu hình SMTP gửi email marketing
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">Cấu hình này được lưu tại bảng settings với setting_key: marketing_smtp_config và được trang /marketing sử dụng khi gửi quảng cáo qua mail.</p>
              </div>

              <div className="p-4 border bg-slate-50 rounded-xl border-slate-100">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">SMTP Host</label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Cổng SMTP</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="587"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value) || 587)}
                    />
                  </div>

                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#475569]">
                    <input
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    Dùng SSL/TLS
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Tài khoản SMTP</label>
                    <input
                      type="text"
                      placeholder="email hoặc username SMTP"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Mật khẩu / App password</label>
                    <input
                      type="password"
                      placeholder="Mật khẩu SMTP"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Email gửi đi</label>
                    <input
                      type="email"
                      placeholder="sales@velocart.vn"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                      value={smtpFromEmail}
                      onChange={(e) => setSmtpFromEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1.5">Tên người gửi</label>
                    <input
                      type="text"
                      placeholder="Velocart"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB]"
                      value={smtpFromName}
                      onChange={(e) => setSmtpFromName(e.target.value)}
                    />
                  </div>
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

              <div className="p-4 space-y-3 text-xs font-semibold border bg-slate-50 rounded-xl border-slate-100">
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
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
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
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
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
        <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" /> Lưu cấu hình hệ thống
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default SettingsView;
