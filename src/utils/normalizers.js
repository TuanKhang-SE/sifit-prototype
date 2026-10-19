const CONDITION_TO_PERCENT = {
  NEW_WITH_TAGS: 100,
  LIKE_NEW: 95,
  GOOD: 85,
  FAIR: 65,
};

export const conditionPercentToEnum = value => {
  const number = Number(value);
  if (number >= 98) return 'NEW_WITH_TAGS';
  if (number >= 90) return 'LIKE_NEW';
  if (number >= 70) return 'GOOD';
  return 'FAIR';
};

export const sizeToApi = size => (size === 'Freesize' ? 'FREE_SIZE' : size);
export const sizeFromApi = size => (size === 'FREE_SIZE' ? 'Freesize' : size);

export const normalizeSeller = seller => {
  if (!seller) return null;
  if (typeof seller === 'string') return { _id: seller, id: seller, name: '', averageRating: 0, reviewCount: 0 };
  return {
    _id: seller._id || seller.id || seller.userId,
    id: seller.id || seller._id || seller.userId,
    name: seller.name || seller.fullName || seller.shopName || 'Seller',
    avatar: seller.avatar,
    averageRating: seller.averageRating || seller.ratingAverage || 0,
    reviewCount: seller.reviewCount || seller.ratingCount || 0,
    createdAt: seller.createdAt,
  };
};

export const normalizeProduct = product => {
  if (!product) return null;
  const seller = product.seller || product.sellerId;
  const category = product.category || product.categoryId;
  const images = (product.images || (product.primaryImage ? [product.primaryImage] : []))
    .map(image => (typeof image === 'string' ? image : image?.url))
    .filter(Boolean);

  return {
    ...product,
    _id: product._id || product.id,
    id: product.id || product._id,
    seller: normalizeSeller(seller),
    title: product.title || '',
    description: product.description || '',
    brand: product.brand || '',
    category: typeof category === 'string' ? category : category?.name || category?.slug || '',
    categoryId: typeof category === 'object' ? category?._id || category?.id : product.categoryId,
    categorySlug: typeof category === 'object' ? category?.slug : product.categorySlug,
    size: sizeFromApi(product.size),
    condition: typeof product.condition === 'number' ? product.condition : CONDITION_TO_PERCENT[product.condition] || 0,
    conditionCode: product.condition,
    color: product.color || '',
    material: product.material || '',
    gender: product.gender || 'unisex',
    defects: product.defects || product.description || 'Không có thông tin.',
    price: product.price || 0,
    imageAssets: product.images || [],
    images,
    status: String(product.status || '').toLowerCase(),
    isFeatured: Boolean(product.isFeatured),
    averageRating: product.averageRating || 0,
    reviewCount: product.reviewCount || 0,
    createdAt: product.createdAt,
  };
};

export const normalizeCartItemProduct = item => {
  const product = item?.product || item;
  if (!product) return null;
  return normalizeProduct({
    id: product.id,
    _id: product.id,
    title: product.title,
    price: product.price,
    status: product.status,
    images: product.image ? [product.image] : product.images,
    seller: product.seller,
  });
};

export const normalizeConversation = conversation => ({
  ...conversation,
  _id: conversation._id || conversation.id,
  participants: (conversation.participants || []).map(user => ({
    ...user,
    _id: user._id || user.id,
    name: user.name || user.fullName || 'User',
  })),
    listing: normalizeProduct(conversation.listing || conversation.product),
  lastMessage: conversation.lastMessage
    ? {
        ...conversation.lastMessage,
        _id: conversation.lastMessage._id || conversation.lastMessage.id,
        sender: conversation.lastMessage.sender || conversation.lastMessage.senderId,
      }
    : null,
});

export const normalizeMessage = message => ({
  ...message,
  _id: message._id || message.id,
  conversation: message.conversation || message.conversationId,
  sender: message.sender || message.senderId,
});
