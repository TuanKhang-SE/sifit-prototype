import React, { createContext, useState, useContext } from 'react';
import {
  MOCK_USERS, MOCK_LISTINGS, MOCK_ORDERS,
  MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_REVIEWS,
  MOCK_REPORTS, MOCK_PACKAGES, MOCK_STATS,
} from '../data/mockData';

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  // ── Auth State ──
  const [user, setUser] = useState(null);
  const [currentView, setCurrentViewRaw] = useState('homepage');

  // ── Data State (in-memory, mutable) ──
  const [products, setProducts] = useState([...MOCK_LISTINGS]);
  const [orders, setOrders] = useState([...MOCK_ORDERS]);
  const [chats, setChats] = useState([...MOCK_CONVERSATIONS]);
  const [messages, setMessages] = useState({ ...MOCK_MESSAGES });
  const [reports, setReports] = useState([...MOCK_REPORTS]);
  const [users, setUsers] = useState([...MOCK_USERS]);
  const [stats, setStats] = useState({ ...MOCK_STATS });
  const [packages] = useState([...MOCK_PACKAGES]);

  // ── UI State ──
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [activePackage, setActivePackage] = useState(null);
  const [currentSellerId, setCurrentSellerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    categories: [], brands: [], sizes: [], condition: 0, priceMax: 10000000,
  });
  const [sortOption, setSortOption] = useState('Hàng Mới Về');

  // ── AI Stylist ──
  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', text: 'Chào bạn! Mình là Trợ lý AI Stylist của Sifit ✨. Bạn đang tìm đồ cho dịp gì (đi biển, mùa đông, dự tiệc...) hay phong cách nào (vintage, streetwear)?' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [aiIntent, setAiIntent] = useState('');

  const sendAiMessage = (text) => {
    setAiMessages(prev => [...prev, { role: 'user', text }]);
    setIsAiTyping(true);

    setTimeout(() => {
      let replyText = '';
      let recommendedListings = [];
      const lowerText = text.toLowerCase();

      if (aiStep === 0) {
        setAiIntent(lowerText);
        replyText = 'Nghe thú vị đó! Để mình gợi ý chuẩn xác nhất, bạn có thể cho mình biết **giới tính, chiều cao, cân nặng** và **dáng người** (VD: dáng quả lê, gầy, đầy đặn...) của bạn không?';
        setAiStep(1);
      } else {
        const combinedIntent = aiIntent + ' ' + lowerText;
        if (combinedIntent.includes('biển') || combinedIntent.includes('hè') || combinedIntent.includes('nóng')) {
          replyText = 'Với vóc dáng của bạn đi biển thì những món đồ mỏng nhẹ, sáng màu hoặc phụ kiện như mũ là tôn dáng nhất! Bạn xem thử mấy món này nhé:';
          recommendedListings = products.filter(p => p.category === 'Tops' || p.category === 'Accessories').slice(0, 4);
        } else if (combinedIntent.includes('đông') || combinedIntent.includes('lạnh') || combinedIntent.includes('ấm')) {
          replyText = 'Vào mùa đông, với dáng người của bạn thì khoác áo có form đứng sẽ che khuyết điểm rất tốt. Mình gợi ý cho bạn mấy mẫu cực chất đang có trên sàn:';
          recommendedListings = products.filter(p => p.category === 'Outerwear' || p.material.toLowerCase().includes('wool')).slice(0, 4);
        } else if (combinedIntent.includes('vintage')) {
          replyText = 'Đồ vintage form rộng (oversize) sẽ cực kỳ hợp với form người của bạn luôn. Đây là những món đồ có style vintage rất đặc trưng vừa vặn với bạn:';
          recommendedListings = products.filter(p => p.title.toLowerCase().includes('vintage') || p.brand === "Levi's" || p.brand === 'Stussy').slice(0, 4);
        } else if (combinedIntent.includes('tiệc') || combinedIntent.includes('sang')) {
          replyText = 'Đi tiệc thì cần đồ thanh lịch, tôn dáng. Với số đo của bạn, Blazer form vừa hoặc đồ lụa/satin là lựa chọn tuyệt vời:';
          recommendedListings = products.filter(p => p.title.toLowerCase().includes('blazer') || p.material.toLowerCase().includes('satin')).slice(0, 4);
        } else {
          replyText = 'Cảm ơn bạn! Với vóc dáng này, mình nghĩ những món đồ basic đang hot nhất hôm nay sẽ rất hợp. Xem thử nhé:';
          recommendedListings = products.filter(p => p.isFeatured).slice(0, 4);
        }
        setAiStep(0);
        setAiIntent('');
      }

      setAiMessages(prev => [...prev, { role: 'ai', text: replyText, products: recommendedListings }]);
      setIsAiTyping(false);
    }, 1500);
  };

  // ── Navigation ──
  const setCurrentView = (view) => {
    setCurrentViewRaw(view);
    window.history.pushState({ view }, '', `?view=${view}`);
  };

  // ── Auth ──
  const loginUser = (email, password) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!found) return { success: false, message: 'Email hoặc mật khẩu không đúng.' };
    if (found.blocked) return { success: false, message: 'Tài khoản này đã bị khóa.' };
    setUser(found);
    if (found.role === 'seller') setCurrentView('seller');
    else if (found.role === 'admin') setCurrentView('admin');
    else setCurrentView('homepage');
    return { success: true };
  };

  const registerUser = (name, email, password, role) => {
    if (MOCK_USERS.find(u => u.email === email)) {
      return { success: false, message: 'Email này đã được sử dụng.' };
    }
    const newUser = {
      _id: `user_${Date.now()}`, name, email, password, role,
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      phone: '', blocked: false, averageRating: 0, reviewCount: 0,
      addresses: [], createdAt: new Date().toISOString(),
    };
    MOCK_USERS.push(newUser);
    setUser(newUser);
    setUsers(prev => [...prev, newUser]);
    if (role === 'seller') setCurrentView('seller');
    else setCurrentView('homepage');
    return { success: true };
  };

  const logoutUser = () => {
    setUser(null);
    setCart([]);
    setActiveChatId(null);
    setCheckoutProduct(null);
    setCurrentView('homepage');
  };

  const updateUser = (newData) => {
    const updated = { ...user, ...newData };
    setUser(updated);
    setUsers(prev => prev.map(u => u._id === user._id ? updated : u));
  };

  // ── Listings ──
  const createListing = (listingData) => {
    const newListing = {
      _id: `listing_${Date.now()}`,
      seller: { _id: user._id, name: user.name, avatar: user.avatar, averageRating: user.averageRating, reviewCount: user.reviewCount },
      ...listingData,
      status: 'active',
      isFeatured: false,
      averageRating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    };
    setProducts(prev => [newListing, ...prev]);
    return { success: true, data: newListing };
  };

  const updateListing = (id, listingData) => {
    setProducts(prev => prev.map(p => p._id === id ? { ...p, ...listingData } : p));
    return { success: true };
  };

  const deleteListing = (id) => {
    setProducts(prev => prev.filter(p => p._id !== id));
    return { success: true };
  };

  const fetchListings = () => {}; // no-op for mock

  // ── Cart ──
  const addToCart = (product) => {
    if (!user) { alert('Vui lòng đăng nhập để thêm vào giỏ hàng!'); return; }
    if (cart.find(p => p._id === product._id)) { alert('Sản phẩm đã có trong giỏ hàng!'); return; }
    setCart(prev => [...prev, product]);
    alert('Đã thêm vào giỏ hàng! 🛒');
  };

  const removeFromCart = (listingId) => {
    setCart(prev => prev.filter(p => p._id !== listingId));
  };

  const handleInstantBuy = (product) => {
    setCheckoutProduct(product);
    setCurrentView('checkout');
  };

  // ── Orders ──
  const createOrder = (orderData) => {
    const listing = products.find(p => p._id === orderData.listingId) || checkoutProduct;
    if (!listing) return { success: false, message: 'Không tìm thấy sản phẩm.' };
    const newOrder = {
      _id: `order_${Date.now()}`,
      buyer: { _id: user._id, name: user.name },
      seller: listing.seller,
      listing,
      price: listing.price,
      shippingFee: 30000,
      totalAmount: listing.price + 30000,
      status: 'pending',
      shippingAddress: orderData.shippingAddress,
      trackingNumber: null,
      shippingCarrier: null,
      isReviewed: false,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
    setProducts(prev => prev.map(p => p._id === listing._id ? { ...p, status: 'processing' } : p));
    return { success: true, data: newOrder };
  };

  const updateOrderStatus = (orderId, statusData) => {
    setOrders(prev => prev.map(o =>
      o._id === orderId ? { ...o, ...statusData } : o
    ));
    if (statusData.status === 'completed') {
      const order = orders.find(o => o._id === orderId);
      if (order) {
        setProducts(prev => prev.map(p =>
          p._id === order.listing._id ? { ...p, status: 'sold' } : p
        ));
        setStats(prev => ({
          ...prev,
          totalRevenue: prev.totalRevenue + order.listing.price,
          platformRevenue: (prev.platformRevenue || 0) + (order.listing.price * 0.07),
          completedOrders: prev.completedOrders + 1
        }));
      }
    }
    return { success: true };
  };

  const fetchOrders = () => {}; // no-op

  // ── Chat ──
  const startChat = (product) => {
    if (!user) { alert('Vui lòng đăng nhập để chat!'); setCurrentView('auth'); return; }
    const existingConv = chats.find(c =>
      c.listing?._id === product._id &&
      c.participants.some(p => p._id === user._id)
    );
    if (existingConv) {
      setActiveChatId(existingConv._id);
      setCurrentView('chat');
      return;
    }
    const seller = product.seller;
    const newConv = {
      _id: `conv_${Date.now()}`,
      participants: [
        { _id: user._id, name: user.name, avatar: user.avatar || 'https://i.pravatar.cc/150' },
        { _id: seller._id, name: seller.name, avatar: seller.avatar || 'https://i.pravatar.cc/150' },
      ],
      listing: { _id: product._id, title: product.title, images: product.images },
      lastMessage: null,
      createdAt: new Date().toISOString(),
    };
    setChats(prev => [newConv, ...prev]);
    setMessages(prev => ({ ...prev, [newConv._id]: [] }));
    setActiveChatId(newConv._id);
    setCurrentView('chat');
  };

  const sendMessage = (convId, content) => {
    const newMsg = {
      _id: `msg_${Date.now()}`,
      conversation: convId,
      sender: user._id,
      content,
      attachments: [],
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));
    setChats(prev => prev.map(c =>
      c._id === convId ? { ...c, lastMessage: newMsg } : c
    ));
  };

  const fetchChats = () => {}; // no-op

  // ── Reports ──
  const addReport = (reason, details) => {
    if (!user) { alert('Vui lòng đăng nhập!'); return; }
    const newReport = {
      _id: `report_${Date.now()}`,
      reporter: { _id: user._id, name: user.name },
      listing: selectedProduct,
      reason, details,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setReports(prev => [newReport, ...prev]);
    setStats(prev => ({ ...prev, pendingReports: prev.pendingReports + 1 }));
    alert('Báo cáo vi phạm đã được ghi nhận! Ban quản trị sẽ xem xét.');
    setProducts(prev => prev.map(p =>
      p._id === selectedProduct?._id ? { ...p, status: 'reported' } : p
    ));
  };

  // ── Admin ──
  const toggleBlockUser = (userId) => {
    setUsers(prev => prev.map(u =>
      u._id === userId ? { ...u, blocked: !u.blocked } : u
    ));
  };

  const resolveReport = (reportId, action) => {
    const report = reports.find(r => r._id === reportId);
    if (action === 'delete_listing' || action === 'block_user') {
      if (report?.listing?._id) {
        setProducts(prev => prev.map(p =>
          p._id === report.listing._id ? { ...p, status: 'hidden' } : p
        ));
      }
      if (action === 'block_user' && report?.listing?.seller?._id) {
        toggleBlockUser(report.listing.seller._id);
      }
      setReports(prev => prev.map(r =>
        r._id === reportId ? { ...r, status: 'resolved' } : r
      ));
    } else {
      setReports(prev => prev.map(r =>
        r._id === reportId ? { ...r, status: 'dismissed' } : r
      ));
    }
    setStats(prev => ({ ...prev, pendingReports: Math.max(0, prev.pendingReports - 1) }));
  };

  // ── Shop Profile ──
  const viewShopProfile = (sellerId) => {
    setCurrentSellerId(sellerId);
    setCurrentView('shop');
  };

  const getSellerData = (sellerId) => {
    return {
      seller: users.find(u => u._id === sellerId) || null,
      listings: products.filter(p => p.seller?._id === sellerId && p.status === 'active'),
      reviews: MOCK_REVIEWS[`seller_${sellerId}`] || [],
    };
  };

  const getProductReviews = (listingId) => {
    return MOCK_REVIEWS[listingId] || [];
  };

  const submitReview = (orderId, rating, comment) => {
    setOrders(prev => prev.map(o =>
      o._id === orderId ? { ...o, isReviewed: true } : o
    ));
    alert('Cảm ơn bạn đã đánh giá! ⭐');
  };

  return (
    <AppContext.Provider value={{
      // Auth
      user, loginUser, registerUser, logoutUser, updateUser,
      // Navigation
      currentView, setCurrentView,
      // Products
      products, setProducts, fetchListings, createListing, updateListing, deleteListing,
      selectedProduct, setSelectedProduct,
      // Cart
      cart, setCart, addToCart, removeFromCart,
      handleInstantBuy,
      checkoutProduct, setCheckoutProduct,
      // Orders
      orders, setOrders, fetchOrders, createOrder, updateOrderStatus,
      // Chat
      chats, setChats, activeChatId, setActiveChatId,
      messages, sendMessage, fetchChats, startChat,
      // Reports
      reports, addReport, resolveReport,
      // Admin
      users, stats, setStats, toggleBlockUser,
      // Packages
      packages, activePackage, setActivePackage,
      // Search & Filters
      searchQuery, setSearchQuery, filters, setFilters, sortOption, setSortOption,
      // Shop
      currentSellerId, viewShopProfile, getSellerData, getProductReviews,
      // Reviews
      submitReview,
      // AI Stylist
      aiMessages, isAiTyping, sendAiMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
