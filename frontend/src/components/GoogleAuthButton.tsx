import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { getGoogleConfigApi } from '../api/authClient';
import { UserRole } from '../api/types';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  role?: UserRole;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onSuccess?: () => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  role = 'finance_manager',
  text = 'continue_with',
  onSuccess,
}) => {
  const { loginWithGoogle, isLoading } = useAuthStore();
  const [clientId, setClientId] = useState<string | null>(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || null
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Fetch client ID if not in env
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      if (!clientId) {
        try {
          const config = await getGoogleConfigApi();
          if (isMounted && config.client_id) {
            setClientId(config.client_id);
          }
        } catch (err) {
          console.warn('Could not load Google client ID from backend:', err);
        }
      }
      if (isMounted) setIsInitializing(false);
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, [clientId]);

  // Initialize and render Google Identity Services button
  useEffect(() => {
    if (!clientId) return;

    const interval = setInterval(() => {
      if (window.google?.accounts?.id && buttonRef.current) {
        clearInterval(interval);

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            if (response?.credential) {
              setIsGoogleLoading(true);
              const ok = await loginWithGoogle(response.credential, role);
              setIsGoogleLoading(false);
              if (ok && onSuccess) {
                onSuccess();
              }
            }
          },
        });

        // Clear container before rendering
        buttonRef.current.innerHTML = '';

        const containerWidth = buttonRef.current.offsetWidth || 340;
        const buttonWidth = Math.min(Math.max(containerWidth, 200), 400);

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text,
          shape: 'rectangular',
          width: buttonWidth,
          logo_alignment: 'left',
        });
      }
    }, 150);

    return () => clearInterval(interval);
  }, [clientId, role, text, loginWithGoogle, onSuccess]);

  if (!clientId && !isInitializing) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full relative flex items-center justify-center min-h-[44px]">
        {/* Render container for Google GIS button */}
        <div
          ref={buttonRef}
          className="w-full flex justify-center [&>div]:w-full [&_iframe]:!mx-auto"
        />

        {/* Loading overlay when authenticating */}
        {(isLoading || isGoogleLoading) && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-teal-300">
            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
            Connecting to Google...
          </div>
        )}
      </div>
    </div>
  );
};
