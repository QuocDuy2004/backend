import React, { useState } from 'react';
import { ProductReview, Product } from '../../../types';
import { 
  Star, MessageSquare, Check, X, Search, Filter, 
  Sparkles, Trash2, User, ShoppingBag, Send, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { aiApi } from '../../../lib/api';
import CustomSelect from '../../shared/ui/CustomSelect';

interface ReviewsViewProps {
  reviews: ProductReview[];
  setReviews: React.Dispatch<React.SetStateAction<ProductReview[]>>;
  products: Product[];
}

export function ReviewsView({
  reviews,
  setReviews,
  products
}: ReviewsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Reply state
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isGeneratingAiReply, setIsGeneratingAiReply] = useState(false);

  // Filter logic
  const filteredReviews = reviews.filter(rev => {
    const matchesSearch = 
      rev.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.comment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = ratingFilter === 'all' || rev.rating.toString() === ratingFilter;
    const matchesSentiment = sentimentFilter === 'all' || rev.sentiment === sentimentFilter;
    const matchesStatus = statusFilter === 'all' || rev.status === statusFilter;

    return matchesSearch && matchesRating && matchesSentiment && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: 'approved' | 'pending' | 'spam') => {
    setReviews(prev => prev.map(rev => 
      rev.id === id ? { ...rev, status: newStatus } : rev
    ));
  };

  const handleDeleteReview = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      setReviews(prev => prev.filter(rev => rev.id !== id));
    }
  };

  const handleSendReply = (id: string) => {
    if (!replyText.trim()) return;

    setReviews(prev => prev.map(rev => 
      rev.id === id ? { ...rev, response: replyText.trim(), status: 'approved' } : rev
    ));

    setReplyText('');
    setActiveReviewId(null);
  };

  // Premium AI Co-pilot Reply generation using Gemini or a simulated highly natural response
  const handleGenerateAiReply = async (rev: ProductReview) => {
    setIsGeneratingAiReply(true);
    try {
      const data = await aiApi.describeProduct({
          productName: rev.productName,
          category: 'Review Response',
          brand: rev.customerName,
          keyFeatures: `The customer rated it ${rev.rating} stars and said: "${rev.comment}". Provide a highly polite and empathetic customer service reply in Vietnamese. Keep it warm and natural.`
      });
      if (data.description) {
        setReplyText(data.description);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback response based on star rating
      if (rev.rating >= 4) {
        setReplyText(`Chào ${rev.customerName}, cảm ơn bạn rất nhiều vì đã tin dùng sản phẩm ${rev.productName} của OmniShop và dành thời gian đánh giá 5 sao. Sự hài lòng của bạn là động lực lớn để chúng tôi cải thiện chất lượng dịch vụ mỗi ngày!`);
      } else if (rev.rating === 3) {
        setReplyText(`Chào ${rev.customerName}, OmniShop xin ghi nhận ý kiến phản hồi từ bạn về sản phẩm ${rev.productName}. Chúng tôi sẽ nỗ lực nâng cao trải nghiệm sản phẩm tốt hơn trong tương lai. Mong tiếp tục nhận được sự ủng hộ của bạn.`);
      } else {
        setReplyText(`Chào ${rev.customerName}, OmniShop thành thật xin lỗi vì trải nghiệm chưa trọn vẹn của bạn với sản phẩm ${rev.productName}. Chúng tôi rất mong được liên hệ trực tiếp qua email ${rev.customerEmail} để tiếp nhận thêm thông tin chi tiết và hỗ trợ phương án đổi trả/bảo hành tốt nhất cho bạn.`);
      }
    } finally {
      setIsGeneratingAiReply(false);
    }
  };

  // Stats calculation
  const totalReviews = reviews.length;
  const approvedReviews = reviews.filter(r => r.status === 'approved').length;
  const pendingReviews = reviews.filter(r => r.status === 'pending').length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER ROW */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-blue-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-indigo-600 fill-indigo-600/20" />
            <h2 className="text-base font-extrabold text-slate-900">Quản Lý Đánh Giá Khách Hàng</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kiểm duyệt bình luận đánh giá, phản hồi ý kiến phản hồi từ khách hàng và phân tích xu hướng sentiment tự động bằng AI.
          </p>
        </div>
      </div>

      {/* METRIC SHIELD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-3xs">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Điểm đánh giá TB</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-[#0F172A]">{avgRating}</span>
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star 
                  key={idx} 
                  className={`w-3.5 h-3.5 ${idx < Math.round(Number(avgRating)) ? 'fill-amber-400' : 'text-slate-200'}`} 
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-3xs">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Tổng đánh giá</span>
          <div className="text-xl font-bold text-[#0F172A] mt-1.5 block">{totalReviews}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-3xs">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Đã phê duyệt</span>
          <div className="text-xl font-bold text-[#0F172A] mt-1.5 block">{approvedReviews}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-3xs">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Chờ kiểm duyệt</span>
          <div className="text-xl font-bold text-[#0F172A] mt-1.5 block">{pendingReviews}</div>
        </div>
      </div>

      {/* FILTERS & SEARCH ROW */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo sản phẩm, khách hàng hoặc bình luận..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50 font-semibold"
          />
        </div>

        {/* Status filter */}
        <div className="w-full md:w-44">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'approved', label: 'Đã duyệt' },
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'spam', label: 'Spam' }
            ]}
            className="w-full text-xs"
          />
        </div>

        {/* Rating filter */}
        <div className="w-full md:w-40">
          <CustomSelect
            value={ratingFilter}
            onChange={setRatingFilter}
            options={[
              { value: 'all', label: 'Tất cả số sao' },
              { value: '5', label: '5 Sao ⭐⭐⭐⭐⭐' },
              { value: '4', label: '4 Sao ⭐⭐⭐⭐' },
              { value: '3', label: '3 Sao ⭐⭐⭐' },
              { value: '2', label: '2 Sao ⭐⭐' },
              { value: '1', label: '1 Sao ⭐' }
            ]}
            className="w-full text-xs"
          />
        </div>

        {/* Sentiment filter */}
        <div className="w-full md:w-44">
          <CustomSelect
            value={sentimentFilter}
            onChange={setSentimentFilter}
            options={[
              { value: 'all', label: 'Tất cả sắc thái' },
              { value: 'positive', label: 'Tích cực (Positive)' },
              { value: 'neutral', label: 'Trung tính (Neutral)' },
              { value: 'negative', label: 'Tiêu cực (Negative)' }
            ]}
            className="w-full text-xs"
          />
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase">Danh Sách Ý Kiến Đánh Giá ({filteredReviews.length})</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredReviews.map((rev) => (
            <div key={rev.id} className="p-5 hover:bg-slate-50/30 transition-colors space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Left side: user profile, stars, product */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-extrabold text-sm flex items-center justify-center shrink-0">
                    {rev.customerName[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-sm">{rev.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{rev.customerEmail}</span>
                      
                      {/* Sentiment Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        rev.sentiment === 'positive' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rev.sentiment === 'neutral'
                          ? 'bg-slate-50 text-slate-500 border-slate-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                      }`}>
                        {rev.sentiment === 'positive' ? 'Tích cực' : rev.sentiment === 'neutral' ? 'Trung tính' : 'Tiêu cực'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span>Mua sản phẩm:</span>
                      <span className="font-extrabold text-slate-800 hover:underline cursor-pointer">{rev.productName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-mono text-slate-400">{new Date(rev.date).toLocaleDateString('vi-VN')}</span>
                    </div>

                    {/* Star ratings */}
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star 
                          key={idx} 
                          className={`w-4 h-4 ${idx < rev.rating ? 'fill-amber-400' : 'text-slate-200'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side: quick status change */}
                <div className="flex items-center gap-1.5 self-end sm:self-start">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border mr-1.5 ${
                    rev.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : rev.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    {rev.status === 'approved' ? 'Đã duyệt' : rev.status === 'pending' ? 'Chờ duyệt' : 'Spam'}
                  </span>

                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'approved')}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
                      title="Phê duyệt"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  {rev.status !== 'spam' && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'spam')}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
                      title="Đánh dấu Spam"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    title="Xóa đánh giá"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Review Comment Text */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700 leading-relaxed">
                "{rev.comment}"
              </div>

              {/* Response feedback */}
              {rev.response ? (
                <div className="pl-6 border-l-2 border-blue-500/80 space-y-1 bg-blue-50/20 p-3 rounded-r-xl">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 uppercase">
                    <CheckCircle className="w-3.5 h-3.5" /> Phản hồi từ quản trị viên
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {rev.response}
                  </p>
                </div>
              ) : (
                <div className="pl-6">
                  {activeReviewId === rev.id ? (
                    <div className="space-y-2 max-w-xl animate-fade-in text-xs font-semibold">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Viết phản hồi của bạn:</label>
                        <button
                          onClick={() => handleGenerateAiReply(rev)}
                          disabled={isGeneratingAiReply}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {isGeneratingAiReply ? 'Đang soạn thảo...' : 'Soạn phản hồi bằng AI'}
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập nội dung phản hồi ý kiến cho khách hàng..."
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-white font-medium"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendReply(rev.id)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" /> Gửi phản hồi
                        </button>
                        <button
                          onClick={() => { setActiveReviewId(null); setReplyText(''); }}
                          className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveReviewId(rev.id)}
                      className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" /> Trả lời đánh giá này
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="p-16 text-center text-slate-400 font-semibold">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Không tìm thấy đánh giá nào khớp với bộ lọc tìm kiếm.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewsView;



