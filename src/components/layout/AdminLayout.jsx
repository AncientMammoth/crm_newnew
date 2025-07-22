import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminNavbar from './AdminNavbar';
import Footer from './Footer';

/**
 * The main layout for the admin section.
 * It now includes a smoother transition to match the regular user dashboard,
 * providing a more consistent and polished user experience.
 */
export default function AdminLayout() {
  const location = useLocation();

  return (
    <>
      <AdminNavbar />
      
      <div className="min-h-[80vh] bg-card">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* AnimatePresence ensures smooth transitions between different pages */}
          <AnimatePresence mode="wait">
            <motion.div
              // The key is crucial for AnimatePresence to detect page changes
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Footer />
    </>
  );
}