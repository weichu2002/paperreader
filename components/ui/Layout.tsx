import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Share2, Settings, Github } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebarContent }) => {
  const location = useLocation();
  const isReader = location.pathname.includes('/reader');

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Primary Sidebar */}
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-20">
        <div className="mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            C
          </div>
        </div>
        
        <nav className="flex-1 flex flex-col gap-4 w-full px-2">
          <Link to="/" className={`p-2 rounded-md flex justify-center transition-colors ${location.pathname === '/' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Home size={24} />
          </Link>
          <div className={`p-2 rounded-md flex justify-center text-gray-500 cursor-not-allowed opacity-50`}>
            <Github size={24} />
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-4 w-full px-2">
           <button className="p-2 rounded-md flex justify-center text-gray-500 hover:bg-gray-100">
            <Settings size={24} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;
