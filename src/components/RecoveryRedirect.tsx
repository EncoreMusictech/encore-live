import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RecoveryRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hasRecoveryInHash = hash.includes('type=recovery');
    const params = new URLSearchParams(search);
    const isRecoveryParam = params.get('recovery') === '1';

    if (hasRecoveryInHash && location.pathname !== '/auth') {
      // Clean the URL of sensitive tokens and redirect to /auth with a hint param
      history.replaceState(null, '', window.location.pathname + window.location.search);
      navigate('/auth?recovery=1', { replace: true });
    } else if (isRecoveryParam && location.pathname !== '/auth') {
      navigate('/auth?recovery=1', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default RecoveryRedirect;
