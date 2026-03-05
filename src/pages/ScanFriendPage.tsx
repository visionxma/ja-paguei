import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ScanFriendPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
        }
      } catch {
        setHasCamera(false);
        toast.error('Não foi possível acessar a câmera.');
      }
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!scanning) return;

    // Use BarcodeDetector if available
    const BarcodeDetectorAPI = (window as any).BarcodeDetector;
    if (!BarcodeDetectorAPI) {
      // Fallback: inform user
      return;
    }

    const detector = new BarcodeDetectorAPI({ formats: ['qr_code'] });

    intervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          if (intervalRef.current) clearInterval(intervalRef.current);
          handleQRResult(value);
        }
      } catch { /* ignore frame errors */ }
    }, 300);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [scanning]);

  const handleQRResult = (value: string) => {
    try {
      const url = new URL(value);
      const userId = url.searchParams.get('user');
      if (url.pathname === '/add-friend' && userId) {
        navigate(`/add-friend?user=${userId}`);
      } else {
        toast.error('QR Code inválido para amizade.');
      }
    } catch {
      toast.error('QR Code inválido.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/friends')} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-display font-bold">Escanear QR Code</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        {hasCamera ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-2 border-primary/30">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {/* Overlay corners */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
            </div>
            <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/80 drop-shadow">Aponte para o QR Code de amizade</p>
          </motion.div>
        ) : (
          <div className="glass-card p-6 text-center space-y-3">
            <Camera size={40} className="mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Câmera não disponível.</p>
            <p className="text-xs text-muted-foreground">Verifique as permissões do navegador.</p>
          </div>
        )}

        {!(window as any).BarcodeDetector && hasCamera && (
          <p className="text-xs text-muted-foreground mt-4 text-center">Seu navegador não suporta leitura automática de QR Code. Tente usar o Google Chrome.</p>
        )}
      </div>
    </div>
  );
};

export default ScanFriendPage;
