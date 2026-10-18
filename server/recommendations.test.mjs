import test from 'node:test';
import assert from 'node:assert/strict';
import { rankRecommendations, buildOutfits, colorHarmony } from './recommendations.mjs';
test('semantic results include outfit groups, respect budget and exclusions', () => {
  const products = [{ _id: 'a', category: 'Tops', price: 100 }, { _id: 'b', category: 'Tops', price: 150 }, { _id: 'c', category: 'Bottoms', price: 120 }, { _id: 'd', category: 'Outerwear', price: 500 }];
  const vectors = [[1, 0], [0.9, 0], [0.5, 0], [0.3, 0]];
  const r = rankRecommendations(products, vectors, [1, 0], ['a'], 200);
  assert.deepEqual(r.map(p => p._id), ['b', 'c']);
  assert.equal(rankRecommendations(products, vectors, [1, 0])[1].category, 'Bottoms');
});
test('outfits keep gender groups separate, include top/bottom/shoes, and reject clashing accent colours', () => {
  const make = (id, category, gender, kind, palette) => ({ _id: id, title: id, category, gender, price: 100, vision: { kind, palette, clothingStyle: 'neutral', clothingStyleConfidence: .4 } });
  const products = [make('shirt', 'Tops', 'men', 'shirt', 'blue'), make('pants', 'Bottoms', 'men', 'trousers', 'beige'), make('shoe', 'Footwear', 'men', 'formalShoes', 'brown'), make('dress', 'Bottoms', 'women', 'dress', 'pink'), make('woman-top', 'Tops', 'women', 'shirt', 'pink'), make('woman-skirt', 'Bottoms', 'women', 'skirt', 'gray'), make('woman-shoe', 'Footwear', 'women', 'heels', 'black'), make('red-pants', 'Bottoms', 'men', 'trousers', 'red')];
  const result = buildOutfits(products, products.map(() => 1), { gender: 'all', prompt: 'Đi làm thanh lịch' });
  assert.equal(result.length, 2);
  for (const outfit of result) {
    assert.equal(outfit.items.length, 3);
    assert.deepEqual(outfit.items.map(p => p.category), ['Tops', 'Bottoms', 'Footwear']);
    assert.ok(outfit.items.every(p => p.gender === outfit.gender));
    assert.ok(!outfit.items.some(p => ['dress', 'red-pants'].includes(p._id)));
  }
  assert.ok(colorHarmony('blue', 'red') < .7);
  assert.equal(buildOutfits(products, products.map(() => 1), { gender: 'men', budget: 200 }).length, 0, 'budget covers the whole outfit');
});
