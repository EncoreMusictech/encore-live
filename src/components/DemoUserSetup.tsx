import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const DemoUserSetup = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createDemoUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-demo-user');
      
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Success: ${data.message}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Demo User Setup</h3>
      <Button onClick={createDemoUser} disabled={loading}>
        {loading ? 'Creating...' : 'Create Demo User'}
      </Button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
};

export default DemoUserSetup;