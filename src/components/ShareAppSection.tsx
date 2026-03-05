import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const APP_URL = window.location.origin;

const ShareAppSection = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      toast.success('Link copiado com sucesso!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Conheça nosso app de finanças!',
      text: 'Organize suas contas e divida despesas com facilidade.',
      url: APP_URL,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error('Erro ao compartilhar');
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card p-5 space-y-4"
    >
      <h2 className="font-display font-semibold text-sm">Compartilhar aplicativo</h2>

      {/* QR Code */}
      <div className="flex justify-center py-3">
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG value={APP_URL} size={160} level="H" />
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Escaneie o QR Code para acessar o app
      </p>

      {/* Link + Copy */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
        <ExternalLink size={14} className="text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground truncate flex-1">{APP_URL}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
        </button>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 gradient-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Share2 size={16} />
        Compartilhar aplicativo
      </button>
    </motion.div>
  );
};

export default ShareAppSection;
