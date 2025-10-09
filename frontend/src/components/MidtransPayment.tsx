import { useEffect } from 'react';

interface MidtransPaymentProps {
  amount: number; // Amount in IDR
  email: string;
  name: string;
  onSuccess: (result: any) => void;
  onPending: (result: any) => void;
  onError: (result: any) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    snap: any;
  }
}

export const MidtransPayment = ({ 
  amount, 
  email, 
  name, 
  onSuccess, 
  onPending, 
  onError, 
  onClose 
}: MidtransPaymentProps) => {
  useEffect(() => {
    const loadMidtransScript = () => {
      // Check if Snap script is already loaded
      if (window.snap) {
        return;
      }

      // Load Midtrans Snap script
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
      script.async = true;
      
      script.onload = () => {
        // Script loaded successfully
        console.log('Midtrans Snap script loaded');
      };
      
      script.onerror = () => {
        console.error('Failed to load Midtrans Snap script');
      };
      
      document.body.appendChild(script);
    };

    loadMidtransScript();
  }, []);

  const handlePayment = async () => {
    if (!window.snap) {
      console.error('Midtrans Snap is not loaded');
      return;
    }

    try {
      // In a real implementation, you would call your backend to create a transaction
      // and get a Snap token. For now, we'll simulate this.
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api-v2.obskt.xyz'}/api/billing/midtrans-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          email,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get payment token');
      }

      const { token } = await response.json();

      // Show Midtrans Snap
      window.snap.show({
        token: token,
        onSuccess: (result: any) => {
          onSuccess && onSuccess(result);
        },
        onPending: (result: any) => {
          onPending && onPending(result);
        },
        onError: (result: any) => {
          onError && onError(result);
        },
        onClose: () => {
          onClose && onClose();
        }
      });
    } catch (error) {
      console.error('Error initiating Midtrans payment:', error);
      onError && onError(error);
    }
  };

  return (
    <button 
      onClick={handlePayment}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Pay with Midtrans
    </button>
  );
};