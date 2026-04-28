import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { 
  ChevronLeft, 
  Bell, 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  Trash2,
  Clock
} from "lucide-react";
import { useFinanceData, Notification } from "../../../hooks/useFinance";
import { auth } from "../../../nexus/firebase";
import { FinanceService } from "../../../services/financeService";
import { toast } from "sonner";

export function NotificationsPage({ onClose }: { onClose: () => void }) {
  const { notifications, loading, profile } = useFinanceData();

  const handleMarkAllRead = async () => {
    const user = auth.currentUser;
    if (!user || !profile) return;
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'notifications', n.id, { read: true });
      }
      toast.success("Semua ditandai dibaca");
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
      const user = auth.currentUser;
      if (!user || !profile) return;
      try {
          await FinanceService.deleteData(user.uid, profile.linkedUserId || null, 'notifications', id);
          toast.success("Notifikasi dihapus");
      } catch (error: any) {
          toast.error(`Gagal: ${error.message}`);
      }
  };

  const handleClearAll = async () => {
      const user = auth.currentUser;
      if (!user || !profile) return;

      const result = await Swal.fire({
          title: 'Hapus Semua?',
          text: 'Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#1e293b',
          confirmButtonText: 'Ya, Hapus Semua',
          cancelButtonText: 'Batal',
          background: '#ffffff',
          customClass: {
              popup: 'rounded-[32px] font-sans',
              title: 'font-black text-[#1e293b]',
              confirmButton: 'rounded-xl font-bold px-6 py-3',
              cancelButton: 'rounded-xl font-bold px-6 py-3'
          }
      });

      if (result.isConfirmed) {
          try {
              for (const n of notifications) {
                await FinanceService.deleteData(user.uid, profile.linkedUserId || null, 'notifications', n.id);
              }
              Swal.fire({
                  title: 'Dibersihkan!',
                  text: 'Semua notifikasi telah dihapus.',
                  icon: 'success',
                  timer: 1500,
                  showConfirmButton: false,
                  customClass: {
                      popup: 'rounded-[32px] font-sans'
                  }
              });
          } catch (error: any) {
              toast.error(`Gagal: ${error.message}`);
          }
      }
  };

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-0 z-[60] bg-[#f8f9fa] flex flex-col overflow-y-auto"
    >
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#f8f9fa]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-[#1e293b]">Semua Notifikasi</h2>
        </div>
        <button onClick={handleClearAll} className="p-2 text-gray-400 hover:text-accent">
          <Trash2 size={20} />
        </button>
      </header>

      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center px-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{notifications.length} Notifikasi</p>
            <button onClick={handleMarkAllRead} className="text-xs font-bold text-primary">Tandai semua dibaca</button>
        </div>

        <div className="flex flex-col gap-4">
            {notifications.map(notif => (
                <div 
                    key={notif.id} 
                    className={`bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-start justify-between group ${!notif.read ? 'border-l-4 border-l-primary' : ''}`}
                >
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            notif.type === 'success' ? 'bg-green-50 text-green-500' :
                            notif.type === 'warning' ? 'bg-yellow-50 text-yellow-500' :
                            'bg-blue-50 text-blue-500'
                        }`}>
                            {notif.type === 'success' ? <CheckCircle2 size={20} /> :
                             notif.type === 'warning' ? <AlertTriangle size={20} /> :
                             <Info size={20} />}
                        </div>
                        <div className="flex flex-col gap-1">
                            <h4 className={`text-sm font-black ${notif.read ? 'text-gray-400' : 'text-[#1e293b]'}`}>{notif.title}</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                            <div className="flex items-center gap-1 mt-1 opacity-40">
                                <Clock size={10} />
                                <span className="text-[10px] font-bold">{notif.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => handleDelete(notif.id)} className="p-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}

            {notifications.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-300">
                    <Bell size={64} strokeWidth={1.5} />
                    <p className="text-sm font-bold">Tidak ada notifikasi</p>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
}
