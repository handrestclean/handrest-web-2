import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePanchayaths } from '@/hooks/usePanchayaths';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export function CustomerAuthForm({ onBack, onLoginSuccess }: Props) {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPanchayath, setSelectedPanchayath] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data: panchayaths, isLoading: panchayathsLoading } = usePanchayaths();

  const currentPanchayath = panchayaths?.find(p => p.id === selectedPanchayath);
  const wardOptions = currentPanchayath
    ? Array.from({ length: currentPanchayath.ward_count }, (_, i) => i + 1)
    : [];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      // Look up profile by phone to get email
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone', cleanMobile)
        .single();

      const email = profileData?.email || `${cleanMobile}@customer.handrest.local`;
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // If login fails, suggest signup
        toast({
          title: 'Login Failed',
          description: 'Account not found or wrong password. Please sign up if you are new.',
          variant: 'destructive',
        });
      } else {
        onLoginSuccess();
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-customer', {
        body: {
          name: name.trim(),
          mobile: mobile.trim(),
          password,
          panchayath_id: selectedPanchayath,
          ward_number: parseInt(selectedWard),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Registration Successful!',
        description: 'Logging you in...',
      });

      // Auto-login after registration
      const cleanMobile = mobile.replace(/\D/g, '');
      const email = `${cleanMobile}@customer.handrest.local`;
      await supabase.auth.signInWithPassword({ email, password });
      onLoginSuccess();
    } catch (err: any) {
      toast({
        title: 'Registration Failed',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <Card className="shadow-elevated">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl text-brand-navy">
            {view === 'login' ? 'Customer Login' : 'Customer Sign Up'}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {view === 'login' ? 'Login with your mobile number' : 'Create your account'}
          </p>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Mobile Number
                  </label>
                  <Input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setView('signup')} className="text-secondary font-medium hover:underline">
                    Sign Up
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSignup}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Mobile Number
                  </label>
                  <Input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Panchayath
                  </label>
                  <Select value={selectedPanchayath} onValueChange={v => { setSelectedPanchayath(v); setSelectedWard(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={panchayathsLoading ? "Loading..." : "Select Panchayath"} />
                    </SelectTrigger>
                    <SelectContent>
                      {panchayaths?.filter(p => p.is_active).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPanchayath && wardOptions.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Ward</label>
                    <Select value={selectedWard} onValueChange={setSelectedWard}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wardOptions.map(ward => (
                          <SelectItem key={ward} value={String(ward)}>Ward {ward}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading ? 'Registering...' : 'Sign Up'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setView('login')} className="text-secondary font-medium hover:underline">
                    Login
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
