// Small, code-native line icons keep the category rail crisp at every size.
const paths = {
  dresses: 'M20 5h8l3 10-5 5 7 23H15l7-23-5-5z',
  tops: 'M16 9l5-4 3 6 3-6 5 4v31H16z',
  pants: 'M16 6h16l2 36h-9l-1-24-1 24h-9z',
  jeans: 'M15 6h18v9l2 27H25l-1-23-1 23H13l2-27z M15 13h18 M24 6v8',
  skirts: 'M17 9h14l4 31H13z M16 17h16',
  jackets: 'M17 7l7 6 7-6 10 9-7 7-3-3v21H17V20l-3 3-7-7z M24 13v28 M17 7l3 12 4-6 4 6 3-12',
  knitwear: 'M16 9l5-3c0 6 6 6 6 0l5 3 9 8-6 8-4-4v20H17V21l-4 4-6-8z',
  shoes: 'M6 30l9-11 8 7 10 2c5 1 8 5 9 10H6z M6 34h35 M15 19l7 11',
  bags: 'M12 17h24l4 24H8z M18 17v-5c0-8 12-8 12 0v5',
  allClothing: 'M17 7l7 6 7-6 10 10-7 7-4-4v21H18V20l-4 4-7-7z',
};
export default function CategoryIcon({ category }) {
  return <svg viewBox="0 0 48 48" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={paths[category] || paths.allClothing} /></svg>;
}
