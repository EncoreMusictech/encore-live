import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const AdminPasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetAdminPassword = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          email: 'info@encoremusic.tech',
          newPassword: '*Peacock87'
        }
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Admin password reset successfully! You can now sign in with the new password.');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Admin Password Reset</CardTitle>
        <CardDescription>
          Reset the admin account password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={resetAdminPassword} 
          disabled={loading}
          className="w-full mb-4"
        >
          {loading ? 'Resetting...' : 'Reset Admin Password to *Peacock87'}
        </Button>
        {message && (
          <div className={`p-3 rounded text-sm ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPasswordReset;