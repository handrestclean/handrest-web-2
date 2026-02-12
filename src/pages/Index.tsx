import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CustomerAuthForm } from '@/components/customer/CustomerAuthForm';
import logo from '@/assets/handrest-logo.jpeg';

type View = 'home' | 'customer';

const Index = () => {
  const [view, setView] = useState<View>('home');
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (user && role === 'staff') {
    navigate('/staff');
    return null;
  }
  if (user && (role === 'customer')) {
    navigate('/app');
    return null;
  }
  if (user && (role === 'admin' || role === 'super_admin')) {
    navigate('/admin');
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            {/* Logo */}
            <motion.img
              src={logo}
              alt="HandRest Cleaning Solutions"
              className="h-28 w-28 rounded-2xl shadow-elevated mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            />

            <h1 className="text-3xl font-bold text-primary mb-2">
              HandRest
            </h1>
            <p className="text-muted-foreground mb-2 text-lg">Cleaning Solutions</p>
            <div className="flex items-center gap-2 mb-10">
              <Sparkles className="w-4 h-4 text-secondary" />
              <p className="text-secondary font-medium italic text-sm">
                "You Relax. We Restore."
              </p>
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>

            {/* Login Options */}
            <div className="w-full space-y-4">
              <Button
                variant="hero"
                size="xl"
                className="w-full h-16 text-lg gap-3"
                onClick={() => setView('customer')}
              >
                <Users className="w-6 h-6" />
                Customer Login
              </Button>

              <Button
                variant="heroOutline"
                size="xl"
                className="w-full h-16 text-lg gap-3"
                onClick={() => navigate('/staff')}
              >
                <Briefcase className="w-6 h-6" />
                Staff Login
              </Button>
            </div>

            {/* Admin link - subtle */}
            <button
              onClick={() => navigate('/admin')}
              className="mt-8 text-xs text-muted-foreground hover:text-secondary transition-colors"
            >
              Admin Access
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="customer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md"
          >
            <CustomerAuthForm
              onBack={() => setView('home')}
              onLoginSuccess={() => navigate('/app')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
