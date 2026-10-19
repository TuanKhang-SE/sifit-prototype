export const categories = ['dresses', 'tops', 'pants', 'jeans', 'skirts', 'jackets', 'knitwear', 'shoes', 'bags', 'allClothing'];
const normalize = text => (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
export function matchesCategory(product, category) {
  const title = normalize(product.title);
  const productCategory = normalize(product.category);
  const productSlug = normalize(product.categorySlug || product.categoryId?.slug);
  switch (category) {
    case 'dresses': return /dress|dam|vay/.test(title) && !/skirt|chan vay/.test(title);
    case 'tops': return product.category === 'Tops' || productCategory === 'ao' || productSlug === 'ao';
    case 'pants': return product.category === 'Bottoms' || productCategory === 'quan' || productSlug === 'quan' || /quan|pants|trousers|jeans/.test(title);
    case 'jeans': return /jeans/.test(title);
    case 'skirts': return /skirt|chan vay/.test(title);
    case 'jackets': return product.category === 'Outerwear' || productCategory === 'ao khoac' || productSlug === 'ao-khoac';
    case 'knitwear': return /len|knit|wool|sweater/.test(title + ' ' + normalize(product.material));
    case 'shoes': return product.category === 'Footwear' || productCategory === 'giay dep' || productSlug === 'giay-dep';
    case 'bags': return productCategory === 'tui xach' || productSlug === 'tui-xach' || /tui|bag|tote/.test(title);
    case 'clothing': case 'allClothing': return ['Tops', 'Bottoms', 'Outerwear'].includes(product.category) || ['ao', 'quan', 'vay', 'dam', 'ao khoac'].includes(productCategory);
    default: return product.category === category;
  }
}
