export const stylistBackgrounds = [
  { id: 'white', label: 'Phông trắng', image: null },
  ...[1, 2, 3, 4].map((_number, i) => ({ id: `scene-${i + 1}`, label: ['Studio ấm', 'Phố xanh', 'Nắng nhẹ', 'Boutique'][i], image: `/api/stylist/backgrounds/scene-${i + 1}` })),
  ...[1, 2, 3, 4].map((_number, i) => ({ id: `decor-${i + 1}`, label: `Trang trí ${i + 1}`, image: `/api/stylist/backgrounds/decor-${i + 1}` })),
];
