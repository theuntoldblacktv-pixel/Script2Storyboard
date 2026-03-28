
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
          S
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white/90">
          Script2<span className="text-purple-400">Storyboard</span>
        </h1>
      </div>
      <nav className="hidden md:flex gap-8 text-sm font-medium text-white/60">
        <a href="#" className="hover:text-white transition-colors">Workspace</a>
        <a href="#" className="hover:text-white transition-colors">Library</a>
        <a href="#" className="hover:text-white transition-colors">Community</a>
      </nav>
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-full transition-all">
          Sign In
        </button>
      </div>
    </header>
  );
};

export default Header;
