import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  PlayCircle, 
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useBookings, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StaffLoginForm } from '@/components/staff/StaffLoginForm';
import { StaffSignupForm } from '@/components/staff/StaffSignupForm';
import logo from '@/assets/handrest-logo.jpeg';
import type { Booking, BookingStatus } from '@/types/database';

const statusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// LoginForm removed - now using StaffLoginForm and StaffSignupForm components

function JobCard({ booking, onStatusUpdate }: { 
  booking: Booking; 
  onStatusUpdate: (bookingId: string, status: BookingStatus) => void;
}) {
  const canStart = booking.status === 'assigned';
  const canComplete = booking.status === 'in_progress';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-foreground">{booking.booking_number}</p>
              <p className="text-sm text-muted-foreground">{booking.package?.name}</p>
            </div>
            <Badge className={statusColors[booking.status]}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{booking.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <a href={`tel:${booking.customer_phone}`} className="text-brand-teal">
                {booking.customer_phone}
              </a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{booking.address_line1}, {booking.city}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>{booking.scheduled_time}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {canStart && (
              <Button 
                variant="hero" 
                size="sm" 
                className="flex-1"
                onClick={() => onStatusUpdate(booking.id, 'in_progress')}
              >
                <PlayCircle className="w-4 h-4 mr-1" />
                Start Job
              </Button>
            )}
            {canComplete && (
              <Button 
                variant="hero" 
                size="sm" 
                className="flex-1"
                onClick={() => onStatusUpdate(booking.id, 'completed')}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StaffApp() {
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const { user, profile, signIn, signOut, loading: authLoading, role } = useAuth();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const updateStatus = useUpdateBookingStatus();
  const { toast } = useToast();

  const handleLogin = async (mobile: string, password: string) => {
    const cleanMobile = mobile.replace(/\D/g, '');
    const fakeEmail = `${cleanMobile}@staff.handrest.local`;
    
    // Also try looking up from profiles in case they were created by admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('phone', cleanMobile)
      .single();
    
    const email = profileData?.email || fakeEmail;
    
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateStatus.mutateAsync({ bookingId, status });
      toast({
        title: 'Status Updated',
        description: `Job marked as ${status.replace('_', ' ')}`,
      });
    } catch {
      toast({
        title: 'Update Failed',
        description: 'Could not update status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-pulse">
          <img src={logo} alt="HandRest" className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') {
      return <StaffSignupForm onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <StaffLoginForm onLogin={handleLogin} onSwitchToSignup={() => setAuthView('signup')} />;
  }

  // Filter bookings that are assigned or in progress
  const myJobs = bookings?.filter(b => 
    ['assigned', 'in_progress'].includes(b.status)
  ) || [];
  
  const completedJobs = bookings?.filter(b => b.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-navy text-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="HandRest" className="h-10 rounded-lg" />
            <div>
              <p className="font-semibold">Staff Portal</p>
              <p className="text-xs text-white/70">{profile?.full_name || user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-white hover:bg-white/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-brand-light-blue border-none">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-brand-navy">{myJobs.length}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-none">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{completedJobs.length}</p>
              <p className="text-sm text-muted-foreground">Completed Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs */}
        <h2 className="text-xl font-bold text-foreground mb-4">My Jobs</h2>
        
        {bookingsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : myJobs.length > 0 ? (
          <div className="space-y-4">
            {myJobs.map(booking => (
              <JobCard 
                key={booking.id} 
                booking={booking} 
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-muted/50">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active jobs assigned</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
