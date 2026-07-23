import { Type } from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import type { Request, Response } from 'express';
import { getGemini } from '../services/gemini.service';
import { findSettingByKey } from '../services/settings.service';

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function fallbackSupportReply(customerName: string | undefined, messages: any[]) {
  const lastCustomerMessage = [...messages].reverse().find((message: any) => message.sender === 'customer' || message.sender === 'user');
  const text = String(lastCustomerMessage?.text || '').toLowerCase();
  const name = customerName || 'bạn';

  if (text.includes('voucher') || text.includes('mã giảm') || text.includes('khuyến mãi')) {
    return {
      suggestedReply: `Chào ${name}, hiện VeloCart có các mã ưu đãi như LIXI2026, FREESHIP và GIAM20 tùy điều kiện đơn hàng. Bạn gửi mình sản phẩm muốn mua, mình sẽ gợi ý mã phù hợp nhất.`,
      intent: 'voucher',
      recommendedActions: ['Gợi ý mã giảm giá', 'Mở danh mục sản phẩm'],
    };
  }

  if (text.includes('giao') || text.includes('ship') || text.includes('vận chuyển')) {
    return {
      suggestedReply: `Chào ${name}, VeloCart hỗ trợ giao nhanh nội thành và giao toàn quốc. Nếu bạn đã có mã đơn hàng, gửi mình mã đơn để kiểm tra trạng thái chi tiết nhé.`,
      intent: 'shipping',
      recommendedActions: ['Kiểm tra mã đơn hàng', 'Tư vấn phương thức giao hàng'],
    };
  }

  if (text.includes('hoàn tiền') || text.includes('đổi trả') || text.includes('refund') || text.includes('khiếu nại')) {
    return {
      suggestedReply: `Chào ${name}, mình rất tiếc vì trải nghiệm chưa tốt. Bạn gửi giúp mình mã đơn hàng và tình trạng sản phẩm, VeloCart sẽ kiểm tra chính sách đổi trả hoặc hoàn tiền phù hợp.`,
      intent: 'handoff',
      recommendedActions: ['Yêu cầu mã đơn hàng', 'Chuyển nhân viên hỗ trợ'],
    };
  }

  return {
    suggestedReply: `Chào ${name}, mình có thể hỗ trợ tư vấn sản phẩm, kiểm tra ưu đãi, hướng dẫn thanh toán hoặc tra cứu đơn hàng. Bạn cho mình biết nhu cầu cụ thể nhé.`,
    intent: 'general',
    recommendedActions: ['Tư vấn sản phẩm', 'Kiểm tra ưu đãi'],
  };
}

async function getAiSupportConfig() {
  const setting = await findSettingByKey('ai_customer_support');
  const value = asRecord(setting?.value);
  const provider = ['gemini', 'chatgpt'].includes(String(value.provider)) ? String(value.provider) : 'gemini';
  const gemini = asRecord(value.gemini);
  const chatgpt = asRecord(value.chatgpt);

  return {
    enabled: setting?.status !== 'inactive' && value.enabled !== false,
    provider,
    systemPrompt: String(value.systemPrompt || 'Bạn là trợ lý CSKH của VeloCart. Trả lời ngắn gọn, lịch sự, bằng tiếng Việt.'),
    maxContextMessages: Math.max(1, Number(value.maxContextMessages || 20)),
    gemini: {
      apiKey: String(gemini.apiKey || ''),
      model: String(gemini.model || 'gemini-3.5-flash'),
      temperature: Number(gemini.temperature ?? 0.4),
      maxOutputTokens: Number(gemini.maxOutputTokens || 1024),
    },
    chatgpt: {
      apiKey: String(chatgpt.apiKey || ''),
      baseUrl: String(chatgpt.baseUrl || 'https://api.openai.com/v1'),
      model: String(chatgpt.model || 'gpt-4o-mini'),
      temperature: Number(chatgpt.temperature ?? 0.4),
      maxOutputTokens: Number(chatgpt.maxOutputTokens || 1024),
    },
  };
}

function summarizeShopContext(shopContext: Record<string, any>) {
  const capabilities = Array.isArray(shopContext.capabilities)
    ? shopContext.capabilities.map(String).join('\n- ')
    : '';
  const categories = Array.isArray(shopContext.categories)
    ? shopContext.categories.slice(0, 12).map((item: any) => `${item.id}: ${item.name}`).join(', ')
    : '';
  const vouchers = Array.isArray(shopContext.vouchers)
    ? shopContext.vouchers.slice(0, 8).map((item: any) => `${item.code} ${item.discountType === 'percent' ? `${item.discountValue}%` : `${item.discountValue}đ`} min ${item.minOrderValue || 0}`).join(', ')
    : '';
  const cart = Array.isArray(shopContext.cart)
    ? shopContext.cart.slice(0, 12).map((item: any) => `${item.productId} ${item.name || ''} x${item.quantity || 1} giá ${item.price || ''}`).join(', ')
    : '';
  const orders = Array.isArray(shopContext.orders)
    ? shopContext.orders.slice(0, 5).map((item: any) => `${item.id}: ${item.status}, thanh toán ${item.paymentStatus}, tổng ${item.totalAmount}`).join(', ')
    : '';
  const notifications = Array.isArray(shopContext.notifications)
    ? shopContext.notifications.slice(0, 5).map((item: any) => `${item.title}: ${item.message}`).join(' | ')
    : '';
  const favorites = Array.isArray(shopContext.favorites)
    ? shopContext.favorites.map(String).slice(0, 20).join(', ')
    : '';

  return `API/capability được phép sử dụng trong ChatBox:
${capabilities ? `- ${capabilities}` : '- Chưa có danh sách capability kèm theo.'}

Dữ liệu shop hiện có:
- Danh mục: ${categories || 'chưa có'}
- Voucher/ưu đãi: ${vouchers || 'chưa có'}
- Giỏ hàng hiện tại: ${cart || 'trống hoặc chưa đăng nhập'}
- Sản phẩm yêu thích: ${favorites || 'trống hoặc chưa đăng nhập'}
- Đơn hàng gần đây: ${orders || 'chưa có hoặc chưa đăng nhập'}
- Thông báo mới: ${notifications || 'chưa có'}`;
}

function buildSupportPrompt(systemPrompt: string, customerName: string | undefined, customerEmail: string | undefined, messages: any[], catalog: any[], shopContext: Record<string, any>) {
  const conversation = messages
    .map((message: any) => `${message.sender === 'user' || message.sender === 'customer' ? 'Khách' : 'Trợ lý'}: ${message.text}`)
    .join('\n');
  const products = catalog
    .map((product: any) => {
      const trend = product.trendLabel || (product.isBestSeller ? 'trending' : 'catalog');
      return `- ${product.id || ''} | ${product.name} | ${product.brand || ''} | ${product.category || ''} | giá ${product.price || product.discountPrice || ''} | còn ${product.stock ?? ''} | đã bán ${product.soldCount ?? 0} | ${product.rating ?? 0} sao | ${trend} | ảnh ${product.image || ''}`;
    })
    .join('\n');

  return `${systemPrompt}

Tên khách: ${customerName || 'Khách VeloCart'}
Email: ${customerEmail || 'chưa có'}

Sản phẩm nổi bật có thể tư vấn:
${products || 'Chưa có catalog kèm theo.'}

${summarizeShopContext(shopContext)}

Quy tắc hỗ trợ:
- Trả lời như trợ lý CSKH của shop, ưu tiên dữ liệu trong catalog và shop context.
- Có thể hướng dẫn hoặc đề xuất thao tác qua các API/capability được liệt kê.
- Với thao tác ghi dữ liệu như thêm/xóa giỏ hàng hoặc yêu thích, chỉ xác nhận khi client đã thực hiện hoặc khi khách bấm nút hành động trong ChatBox.
- Không bịa dữ liệu đơn hàng, tồn kho, giá, voucher hoặc chính sách nếu shop context không có.

Hội thoại:
${conversation}

Hãy trả lời JSON hợp lệ:
{
  "suggestedReply": "câu trả lời tiếng Việt gửi khách",
  "intent": "general|product_advice|voucher|shipping|payment|handoff",
  "recommendedActions": ["..."]
}`;
}

async function callOpenAi(config: Awaited<ReturnType<typeof getAiSupportConfig>>, prompt: string) {
  const response = await fetch(`${config.chatgpt.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.chatgpt.apiKey}`,
    },
    body: JSON.stringify({
      model: config.chatgpt.model,
      temperature: config.chatgpt.temperature,
      max_tokens: config.chatgpt.maxOutputTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI request failed (${response.status})`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI.');
  return JSON.parse(text);
}

async function callGemini(config: Awaited<ReturnType<typeof getAiSupportConfig>>, prompt: string) {
  const ai = new GoogleGenAI({
    apiKey: config.gemini.apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const response = await ai.models.generateContent({
    model: config.gemini.model,
    contents: prompt,
    config: {
      temperature: config.gemini.temperature,
      maxOutputTokens: config.gemini.maxOutputTokens,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from Gemini.');
  return JSON.parse(text.trim());
}

export async function describeProduct(req: Request, res: Response) {
  const { productName, category, brand, keyFeatures } = req.body;
  if (!productName) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  try {
    const ai = getGemini();
    if (!ai) throw new Error('Gemini API is not configured. Please add GEMINI_API_KEY.');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Generate a premium e-commerce product description and 4-6 search tags.
        Name: ${productName}
        Category: ${category || 'General'}
        Brand: ${brand || 'Generic'}
        Key features: ${keyFeatures || 'None specified'}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['description', 'tags'],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error('Empty response from model');
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn('Describe Product error, using fallback:', error.message || error);
    res.json({
      description: `${productName} cua ${brand || 'OmniShop'} la lua chon chat luong cao trong danh muc ${category || 'san pham pho bien'}, phu hop cho nhu cau mua sam hien dai.`,
      tags: [
        String(productName).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-'),
        String(category || 'san-pham').toLowerCase().replace(/\s+/g, '-'),
        String(brand || 'omnishop').toLowerCase().replace(/\s+/g, '-'),
        'chinh-hang',
        'gia-tot',
      ],
    });
  }
}

export async function optimizeSeo(req: Request, res: Response) {
  const { productName, description, brand } = req.body;
  if (!productName) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  try {
    const ai = getGemini();
    if (!ai) throw new Error('Gemini API is not configured. Please add GEMINI_API_KEY.');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Generate an SEO title and meta description.
        Product: ${productName}
        Brand: ${brand || ''}
        Description: ${description || ''}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoTitle: { type: Type.STRING },
            seoMetaDescription: { type: Type.STRING },
          },
          required: ['seoTitle', 'seoMetaDescription'],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error('Empty response from model');
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn('SEO Optimize error, using fallback:', error.message || error);
    res.json({
      seoTitle: `${productName} chinh hang | ${brand || 'OmniShop'} - Gia Tot`,
      seoMetaDescription: `Mua ${productName} chinh hang tai ${brand || 'OmniShop'}, giao hang nhanh va nhieu uu dai.`,
    });
  }
}

export async function suggestReply(req: Request, res: Response) {
  const { customerName, customerEmail, messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Conversation messages are required' });
  }

  const conversationString = messages
    .map((message: any) => `${message.sender === 'customer' ? 'Customer' : 'Agent/AI'}: ${message.text}`)
    .join('\n');

  try {
    const ai = getGemini();
    if (!ai) throw new Error('Gemini API is not configured. Please add GEMINI_API_KEY.');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze this e-commerce support conversation.
        Customer Name: ${customerName || 'Valued Customer'}
        Customer Email: ${customerEmail || 'unknown@example.com'}
        Conversation:
        ${conversationString}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            sentimentScore: { type: Type.NUMBER },
            intent: { type: Type.STRING },
            confidenceScore: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            suggestedReply: { type: Type.STRING },
            recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['sentiment', 'sentimentScore', 'intent', 'confidenceScore', 'summary', 'suggestedReply', 'recommendedActions'],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error('Empty response from model');
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn('Support Suggest Reply error, using fallback:', error.message || error);
    const lastCustomerMessage = [...messages].reverse().find((message: any) => message.sender === 'customer');
    const text = String(lastCustomerMessage?.text || '').toLowerCase();

    let intent = 'Yeu cau ho tro chung';
    let sentiment = 'neutral';
    let sentimentScore = 0;
    let summary = 'Khach hang can duoc tu van va ho tro them.';
    let suggestedReply = `Chao ${customerName || 'ban'}, cam on ban da lien he. Minh da ghi nhan yeu cau va se kiem tra de phan hoi ban som nhat.`;
    let recommendedActions = ['Phan hoi khach hang', 'Kiem tra thong tin lien quan'];

    if (text.includes('giao') || text.includes('ship') || text.includes('van chuyen')) {
      intent = 'Hoi dap van chuyen';
      summary = 'Khach hang hoi ve tien trinh giao hang.';
      suggestedReply = `Chao ${customerName || 'ban'}, minh se kiem tra trang thai van chuyen va gui ma theo doi moi nhat cho ban ngay.`;
      recommendedActions = ['Kiem tra ma van don', 'Cap nhat trang thai giao hang'];
    } else if (text.includes('hoan tien') || text.includes('refund') || text.includes('tra hang')) {
      intent = 'Yeu cau hoan tien / doi tra';
      sentiment = 'negative';
      sentimentScore = -0.4;
      summary = 'Khach hang muon xu ly hoan tien hoac doi tra.';
      suggestedReply = `Chao ${customerName || 'ban'}, minh rat tiec ve trai nghiem nay. Ban vui long gui ma don hang de minh kiem tra va ho tro quy trinh hoan tien.`;
      recommendedActions = ['Kiem tra don hang', 'Khoi tao quy trinh hoan tien'];
    }

    res.json({
      sentiment,
      sentimentScore,
      intent,
      confidenceScore: 90,
      summary,
      suggestedReply,
      recommendedActions,
    });
  }
}

export async function customerSupportChat(req: Request, res: Response) {
  const { customerName, customerEmail, messages, catalog, shopContext } = req.body;
  const conversation = Array.isArray(messages) ? messages : [];

  if (conversation.length === 0) {
    return res.status(400).json({ ok: false, message: 'messages is required.' });
  }

  const fallback = fallbackSupportReply(customerName, conversation);

  try {
    const config = await getAiSupportConfig();
    if (!config.enabled) {
      return res.json({
        ok: true,
        provider: 'disabled',
        aiDisabled: true,
        suggestedReply: '',
        intent: fallback.intent,
        recommendedActions: [],
      });
    }

    const providerConfig = config.provider === 'chatgpt' ? config.chatgpt : config.gemini;
    if (!providerConfig.apiKey) {
      return res.json({
        ok: true,
        provider: 'fallback',
        ...fallback,
        note: `Chưa cấu hình API key cho ${config.provider === 'chatgpt' ? 'GPT' : 'Gemini'} trong /settings.`,
      });
    }

    const prompt = buildSupportPrompt(
      config.systemPrompt,
      customerName,
      customerEmail,
      conversation.slice(-config.maxContextMessages),
      Array.isArray(catalog) ? catalog : [],
      asRecord(shopContext),
    );

    const result = config.provider === 'chatgpt'
      ? await callOpenAi(config, prompt)
      : await callGemini(config, prompt);

    return res.json({
      ok: true,
      provider: config.provider,
      suggestedReply: String(result.suggestedReply || fallback.suggestedReply),
      intent: String(result.intent || fallback.intent),
      recommendedActions: Array.isArray(result.recommendedActions) ? result.recommendedActions.map(String) : fallback.recommendedActions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI support failed';
    console.warn('Customer support AI error, using fallback:', message);
    return res.json({ ok: true, provider: 'fallback', ...fallback, note: message });
  }
}

export async function forecastDemand(req: Request, res: Response) {
  const { name, category, sku, currentStock, monthlySales } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  try {
    const ai = getGemini();
    if (!ai) throw new Error('Gemini API is not configured. Please add GEMINI_API_KEY.');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze inventory risk and restock strategy.
        Product: ${name}
        SKU: ${sku}
        Category: ${category || 'General'}
        Current stock: ${currentStock || 0}
        Monthly sales: ${monthlySales || 0}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stockOutRisk: { type: Type.STRING },
            daysRemainingPredicted: { type: Type.INTEGER },
            recommendation: { type: Type.STRING },
            marketTrendAnalysis: { type: Type.STRING },
          },
          required: ['stockOutRisk', 'daysRemainingPredicted', 'recommendation', 'marketTrendAnalysis'],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error('Empty response from model');
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn('Demand Forecast error, using fallback:', error.message || error);
    const monthly = Number(monthlySales || 15);
    const stock = Number(currentStock || 0);
    const days = monthly > 0 ? Math.round((stock / monthly) * 30) : 180;
    const stockOutRisk = days < 10 ? 'critical' : days < 30 ? 'medium' : 'low';

    res.json({
      stockOutRisk,
      daysRemainingPredicted: days,
      recommendation:
        stockOutRisk === 'critical'
          ? `Nhap gap toi thieu ${Math.round(monthly * 1.5)} san pham de tranh het hang.`
          : stockOutRisk === 'medium'
            ? `Len lich nhap them khoang ${monthly} san pham trong 10 ngay toi.`
            : 'Ton kho dang an toan, tiep tuc theo doi dinh ky.',
      marketTrendAnalysis: 'Nhu cau duoc uoc tinh tu ton kho hien tai va toc do ban hang trung binh.',
    });
  }
}
