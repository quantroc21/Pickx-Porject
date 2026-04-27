import { useAvailableAvatars, useSetAvatar } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarPickerProps {
  playerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AvatarPicker({ playerId, isOpen, onClose }: AvatarPickerProps) {
  const { data: available = [], isLoading } = useAvailableAvatars();
  const { mutate: setAvatar, isPending } = useSetAvatar();

  const handleSelect = (url: string) => {
    setAvatar({ playerId, avatar_url: url }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border/60 bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/40 p-6">
              <h2 className="font-display text-xl font-bold">Chọn diện mạo 3D</h2>
              <button onClick={onClose} className="rounded-full bg-muted/50 p-2 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <div className="scrollbar-hide h-[400px] overflow-y-auto p-6">
              <p className="mb-4 text-xs text-muted-foreground uppercase tracking-widest font-bold">
                Kho Avatar duy nhất ({available.length} còn lại)
              </p>
              
              {isLoading ? (
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted/30" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {available.map((url) => (
                    <button
                      key={url}
                      onClick={() => handleSelect(url)}
                      disabled={isPending}
                      className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-transparent transition-all hover:border-primary hover:scale-105 active:scale-95"
                    >
                      <img src={url} alt="Avatar option" className="size-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-primary-foreground bg-primary px-2 py-1 rounded-full">Chọn</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-muted/30 p-6 text-center text-[11px] text-muted-foreground">
              <p>Luật của hội: Mỗi tay vợt một diện mạo độc nhất. <br/>Avatar bạn chọn sẽ biến mất khỏi kho cho người khác.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
