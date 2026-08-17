import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { api } from '../utils/api';
import { AccessVerifyResponse } from '../types';

interface AccessGuardProps {
  children: (data: AccessVerifyResponse) => React.ReactNode;
}

export const AccessGuard: React.FC<AccessGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [verifyData, setVerifyData] = useState<AccessVerifyResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      try {
        const res = await api.verifyAccess();
        if (isMounted) {
          if (!res.authorized) {
            navigate('/', { replace: true, state: { paywallRequired: true } });
          } else {
            setVerifyData(res);
            setLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          navigate('/', { replace: true, state: { paywallRequired: true } });
        }
      }
    }

    check();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (loading || !verifyData) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-4">
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-brand">
            <Lock className="w-6 h-6 text-brand-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wider uppercase">
              Verificando Acesso Seguro
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Validando sua credencial individual junto ao servidor...
            </p>
          </div>
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  return <>{children(verifyData)}</>;
};
