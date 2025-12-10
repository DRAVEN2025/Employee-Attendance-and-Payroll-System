import { Outlet, useLocation } from 'react-router-dom';
import { motion } from "framer-motion";

const MainLayout = () => {
  const location = useLocation();

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isAuthPage = () => {
    return location.pathname === '/user/signin';
  };

  // Animation variants
  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const linkVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    tap: { scale: 0.95 },
  };

  const activeLinkClass = "text-white bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition-all duration-300 cursor-default";
  const inactiveLinkClass = "text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105";
  const disabledLinkClass = "text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed opacity-70";

  const renderNavLink = (path, label) => {
    const isActive = isActivePath(path);
    
    if (isActive) {
      return (
        <motion.span
          className={activeLinkClass}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.span>
      );
    }
    
    if (isAuthPage()) {
      return (
        <span
          className={disabledLinkClass}
        >
          {label}
        </span>
      );
    }
    
    return (
      <motion.a
        href={path}
        className={inactiveLinkClass}
        variants={linkVariants}
        whileHover="hover"
        whileTap="tap"
      >
        {label}
      </motion.a>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-[Inter]">
      {/* Enhanced Navbar */}
      <motion.nav 
        className="w-full fixed top-0 left-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200"
        initial="hidden"
        animate="visible"
        variants={navVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <motion.div 
              className="flex-shrink-0 flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                EAPS
              </h1>
              <span className="ml-2 text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                v1.0
              </span>
            </motion.div>
            
            {/* Navigation Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-2">
                {renderNavLink('/', 'Home')}
                {renderNavLink('/features', 'Features')}
                {renderNavLink('/about', 'About')}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <div className="flex-grow pt-16">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Outlet />
        </motion.main>
      </div>

      {/* Footer */}
      <motion.footer 
        className="bg-white border-t border-gray-200 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-gray-600 text-sm">
              © 2025 Employee Attendance & Payroll System. All rights reserved.
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default MainLayout;