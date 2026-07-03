import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-heading font-black text-xl text-white">Sifit.</span>
          <p className="text-sm mt-1">© 2025 Sifit. Sustainable fashion starts here.</p>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          {['Giới thiệu', 'Điều khoản', 'Bảo mật', 'Liên hệ'].map(item => (
            <button key={item} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-gray-400">
              {item}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
