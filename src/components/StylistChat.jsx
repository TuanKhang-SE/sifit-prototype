import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import LocalizedContent from '../components/LocalizedContent';

export default function StylistChat() {
  const { aiMessages, isAiTyping, sendAiMessage, setSelectedProduct, setCurrentView, addToCart } = useApp();
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiTyping]);

  const send = () => {
    if (!input.trim()) return;
    sendAiMessage(input.trim());
    setInput('');
  };

  return (
    <LocalizedContent>
    <div className="ai-workspace max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="font-heading font-black text-3xl text-gray-900 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-4xl text-amber-500 fill">auto_awesome</span>
          Tư vấn phối đồ
        </h1>
        <p className="text-sm text-gray-500 mt-2">Trợ lý thời trang cá nhân của bạn. Hỏi về bất kỳ phong cách nào!</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-card flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
          {aiMessages.map((m, i) => {
            const isMe = m.role === 'user';
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-xl fill">auto_awesome</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-3">
                    <div className={`px-5 py-3.5 shadow-sm ${isMe ? 'bg-gray-900 text-white rounded-[24px] rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-[24px] rounded-tl-sm'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>

                    {/* Product Recommendations */}
                    {m.products && m.products.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-1">
                        {m.products.map(p => (
                          <div key={p._id} className="w-40 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setSelectedProduct(p); setCurrentView('detail'); }}>
                            <div className="aspect-[3/4] relative overflow-hidden">
                              <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute top-1.5 left-1.5 badge-condition scale-90 origin-top-left">Mới {p.condition}%</div>
                            </div>
                            <div className="p-3">
                              <p className="font-bold text-[11px] text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{p.title}</p>
                              <div className="flex justify-between items-center mt-1.5">
                                <span className="font-black text-[#ee4d2d] text-xs">{p.price.toLocaleString('vi-VN')}đ</span>
                                <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none text-gray-600">
                                  <span className="material-symbols-outlined text-[13px]">add_shopping_cart</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isAiTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm animate-pulse">
                  <span className="material-symbols-outlined text-xl fill">auto_awesome</span>
                </div>
                <div className="px-5 py-3.5 bg-gray-100 rounded-[24px] rounded-tl-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
          <input
            type="text"
            placeholder="Bạn cần gợi ý phối đồ như thế nào? (VD: đi tiệc, mùa đông, vintage...)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-amber-400/50 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.1)] rounded-full px-5 py-3 text-sm outline-none transition-all"
          />
          <button
            onClick={send}
            className="bg-gradient-to-r from-amber-400 to-orange-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer border-none flex-shrink-0"
          >
            <span className="material-symbols-outlined text-xl ml-0.5">send</span>
          </button>
        </div>
      </div>
    </div>
    </LocalizedContent>
  );
}
