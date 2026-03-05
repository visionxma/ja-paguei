import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAttachments, uploadAttachment, deleteAttachment } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Paperclip, Upload, Trash2, FileText, Image, Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface AttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string;
}

const AttachmentsDialog = ({ open, onOpenChange, billId }: AttachmentsDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['attachments', billId],
    queryFn: () => fetchAttachments(billId),
    enabled: !!billId && open,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(billId, user!.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', billId] });
      toast.success('Arquivo enviado!');
    },
    onError: () => toast.error('Erro ao enviar arquivo'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => deleteAttachment(id, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', billId] });
      toast.success('Arquivo removido!');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => uploadMutation.mutate(file));
    }
    e.target.value = '';
  };

  const getIcon = (type?: string | null) => {
    if (type?.startsWith('image/')) return <Image size={16} className="text-primary" />;
    return <FileText size={16} className="text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Paperclip size={18} /> Anexos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Upload buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex-1 glass-card p-3 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Upload size={16} /> Arquivo
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex-1 glass-card p-3 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Camera size={16} /> Câmera
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploadMutation.isPending && (
            <div className="flex items-center justify-center py-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground ml-2">Enviando...</span>
            </div>
          )}

          {/* Attachments list */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-6">
              <Paperclip size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum anexo ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Envie PDFs, fotos ou comprovantes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div key={att.id} className="glass-card p-3 flex items-center gap-3">
                  {att.file_type?.startsWith('image/') ? (
                    <img src={att.file_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      {getIcon(att.file_type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{att.file_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(att.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate({ id: att.id, url: att.file_url })}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentsDialog;
