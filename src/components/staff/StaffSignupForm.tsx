import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { usePanchayaths } from '@/hooks/usePanchayaths';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/handrest-logo.jpeg';

export function StaffSignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPanchayath, setSelectedPanchayath] = useState('');
  const [selectedWards, setSelectedWards] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data: panchayaths, isLoading: panchayathsLoading } = usePanchayaths();

  const currentPanchayath = panchayaths?.find(p => p.id === selectedPanchayath);
  const wardOptions = currentPanchayath
    ? Array.from({ length: currentPanchayath.ward_count }, (_, i) => i + 1)
    : [];

  const toggleWard = (ward: number) => {
    setSelectedWards(prev =>
      prev.includes(ward) ? prev.filter(w => w !== ward) : [...prev, ward]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (selectedWards.length === 0) {
      toast({ title: 'Please select at least one ward', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-staff', {
        body: {
          name: name.trim(),
          mobile: mobile.trim(),
          password,
          panchayath_id: selectedPanchayath,
          ward_numbers: selectedWards.sort((a, b) => a - b),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Registration Successful!',
        description: 'You can now log in with your mobile number and password.',
      });
      onSwitchToLogin();
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
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <img src={logo} alt="HandRest" className="h-16 mx-auto mb-3 rounded-xl" />
            <CardTitle className="text-2xl text-brand-navy">Staff Sign Up</CardTitle>
            <p className="text-muted-foreground">Join HandRest Cleaning Solutions</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Mobile Number</label>
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
                <label className="text-sm font-medium">Panchayath</label>
                <Select value={selectedPanchayath} onValueChange={v => { setSelectedPanchayath(v); setSelectedWards([]); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={panchayathsLoading ? "Loading..." : "Select Panchayath"} />
                  </SelectTrigger>
                  <SelectContent>
                    {panchayaths?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPanchayath && wardOptions.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Wards ({selectedWards.length} selected)
                  </label>
                  <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {wardOptions.map(ward => (
                      <label
                        key={ward}
                        className={`flex items-center justify-center p-2 rounded-md cursor-pointer text-sm font-medium border transition-colors ${
                          selectedWards.includes(ward)
                            ? 'bg-secondary text-secondary-foreground border-secondary'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selectedWards.includes(ward)}
                          onChange={() => toggleWard(ward)}
                        />
                        {ward}
                      </label>
                    ))}
                  </div>
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
                <button type="button" onClick={onSwitchToLogin} className="text-secondary font-medium hover:underline">
                  Login
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
