import { Type } from '@google/genai';
import type { Request, Response } from 'express';
import { getGemini } from '../services/gemini.service';

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
