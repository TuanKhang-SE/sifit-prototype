export const categories = ['dresses', 'tops', 'pants', 'jeans', 'skirts', 'jackets', 'knitwear', 'shoes', 'bags', 'allClothing'];
const normalize = text => (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
export function matchesCategory(product, category) {
  const title = normalize(product.title);
  switch (category) {
    case 'dresses': return /dress|dam|vay/.test(title) && !/skirt|chan vay/.test(title);
    case 'tops': return product.category === 'Tops';
    case 'pants': return product.category === 'Bottoms' && /quan|pants|trousers|jeans/.test(title);
    case 'jeans': return /jeans/.test(title);
    case 'skirts': return /skirt|chan vay/.test(title);
    case 'jackets': return product.category === 'Outerwear';
    case 'knitwear': return /len|knit|wool|sweater/.test(title + ' ' + normalize(product.material));
    case 'shoes': return product.category === 'Footwear';
    case 'bags': return /tui|bag|tote/.test(title);
    case 'clothing': case 'allClothing': return ['Tops', 'Bottoms', 'Outerwear'].includes(product.category);
    default: return product.category === category;
  }
}
