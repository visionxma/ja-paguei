import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnsavedChangesDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

const UnsavedChangesDialog = ({ open, onStay, onLeave }: UnsavedChangesDialogProps) => (
  <AlertDialog open={open} onOpenChange={(o) => !o && onStay()}>
    <AlertDialogContent className="max-w-sm mx-auto">
      <AlertDialogHeader>
        <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
        <AlertDialogDescription>
          Você possui informações não salvas nesta tela. Deseja realmente sair e perder essas alterações?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onStay}>Permanecer na página</AlertDialogCancel>
        <AlertDialogAction onClick={onLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Sair mesmo assim
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default UnsavedChangesDialog;
