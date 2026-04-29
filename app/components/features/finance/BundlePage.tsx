import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Plus, 
  ChevronRight, 
  MoreVertical, 
  Briefcase, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Wallet as WalletIcon,
  ShoppingBag
} from "lucide-react";
import { useFinanceData, Bundle } from "../../../hooks/useFinance";
import { FinanceService } from "../../../services/financeService";
import { auth } from "../../../nexus/firebase";
import { NewBundleForm } from "./NewBundleForm";
import { TransactionForm } from "./TransactionForm";
import { toast } from "sonner";
import Swal from "sweetalert2";

interface BundlePageProps {
  onClose: () => void;
}

export const BundlePage = ({ onClose }: BundlePageProps) => {
  const { bundles, wallets, profile, loading } = useFinanceData();
  const [showNewBundle, setShowNewBundle] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [payingBundle, setPayingBundle] = useState<Bundle | null>(null);

  const activeBundles = bundles.filter(b => b.status === 'active');
  const paidBundles = bundles.filter(b => b.status === 'paid');

  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  const handleToggleItem = async (bundle: Bundle, itemIndex: number) => {
    if (!profile) return;
    try {
      const newItems = [...bundle.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        isChecked: !newItems[itemIndex].isChecked
      };

      await FinanceService.updateData(
        auth.currentUser!.uid, 
        profile.linkedUserId || null, 
        'bundles', 
        bundle.id, 
        { items: newItems }
      );
    } catch (error) {
      toast.error('Gagal memperbarui item');
    }
  };

  const handlePay = (bundle: Bundle) => {
    setPayingBundle(bundle);
  };

  const handleDeleteBundle = async (id: string) => {
    if (!profile) return;

    const result = await Swal.fire({
      title: 'Hapus Bundle?',
      text: "Data bundle akan dihapus secara permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-[32px]',
        confirmButton: 'rounded-xl px-6 py-3 font-bold',
        cancelButton: 'rounded-xl px-6 py-3 font-bold'
      }
    });

    if (result.isConfirmed) {
      try {
        await FinanceService.deleteData(auth.currentUser!.uid, profile.linkedUserId || null, 'bundles', id);
        toast.success("Bundle dihapus");
      } catch (error) {
        toast.error("Gagal menghapus bundle");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-neutral flex flex-col">
      <header className="p-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-neutral-dark sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 bg-neutral rounded-full shadow-sm">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <h2 className="text-xl font-black text-primary">Bundle Saya</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 pb-32">
        {/* Active Bundles */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Aktif</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{activeBundles.length} Item</span>
          </div>

          {activeBundles.length === 0 ? (
            <div className="bg-white/50 rounded-[40px] p-10 border-2 border-dashed border-neutral-dark flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-neutral rounded-full flex items-center justify-center">
                <ShoppingBag size={32} className="text-gray-300" />
              </div>
              <div>
                <p className="font-bold text-gray-500">Belum ada bundle aktif.</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">Mulai belanja lebih terencana!</p>
              </div>
            </div>
          ) : (
            activeBundles.map(bundle => (
              <BundleCard 
                key={bundle.id} 
                bundle={bundle} 
                wallets={wallets}
                onPay={() => handlePay(bundle)}
                onEdit={() => setEditingBundle(bundle)}
                onDelete={() => handleDeleteBundle(bundle.id)}
                onToggleItem={(itemIndex) => handleToggleItem(bundle, itemIndex)}
              />
            ))
          )}
        </section>

        {/* Paid Bundles */}
        {paidBundles.length > 0 && (
          <section className="space-y-4 opacity-70">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Selesai</h3>
            {paidBundles.map(bundle => (
              <BundleCard 
                key={bundle.id} 
                bundle={bundle} 
                wallets={wallets}
                onPay={() => {}}
                onDelete={() => handleDeleteBundle(bundle.id)}
                isPaid
              />
            ))}
          </section>
        )}
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px]">
        <button 
          onClick={() => setShowNewBundle(true)}
          className="w-full bg-primary py-6 rounded-[32px] text-white flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={24} />
          <span className="text-sm font-black uppercase tracking-widest">Bundle Baru</span>
        </button>
      </div>

      <AnimatePresence>
        {showNewBundle && (
          <NewBundleForm onClose={() => setShowNewBundle(false)} />
        )}
        {editingBundle && (
          <NewBundleForm 
            editBundle={editingBundle} 
            onClose={() => setEditingBundle(null)} 
          />
        )}
        {payingBundle && (
          <TransactionForm 
            onClose={() => setPayingBundle(null)}
            initialData={{
              title: `Belanja ${payingBundle.name}`,
              amount: payingBundle.items.filter(i => i.isChecked).reduce((acc, i) => acc + i.amount, 0).toString(),
              notes: `Bundle: ${payingBundle.name} ${payingBundle.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
              walletId: payingBundle.walletId
            }}
            relatedBundle={payingBundle}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function BundleCard({ 
  bundle, 
  wallets, 
  onPay, 
  onToggleItem,
  onEdit,
  onDelete,
  isPaid 
}: { 
  bundle: Bundle, 
  wallets: any[], 
  onPay: () => void, 
  onToggleItem?: (index: number) => void,
  onEdit?: () => void,
  onDelete?: () => void,
  isPaid?: boolean 
}) {
  const total = bundle.items.reduce((acc, item) => acc + item.amount, 0);
  const checkedItemsTotal = bundle.items.filter(i => i.isChecked).reduce((acc, item) => acc + item.amount, 0);
  const wallet = wallets.find(w => w.id === bundle.walletId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="bg-white rounded-[32px] overflow-hidden border border-neutral-dark shadow-sm">
      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-[22px] flex items-center justify-center text-primary relative overflow-hidden">
               <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
               <ShoppingBag size={28} className="relative z-10" />
            </div>
            <div>
              <h4 className="font-black text-primary text-base leading-tight">{bundle.name}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">
                {bundle.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {bundle.items.length} Items
              </p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-gray-400">
              <MoreVertical size={20} />
            </button>
            <AnimatePresence>
              {showOptions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-32 bg-white rounded-2xl shadow-xl border border-neutral-dark z-20 overflow-hidden"
                  >
                    {!isPaid && onEdit && (
                      <button 
                        onClick={() => { onEdit(); setShowOptions(false); }}
                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-neutral transition-colors text-[10px] font-black uppercase text-gray-700"
                      >
                        Ubah
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => { onDelete(); setShowOptions(false); }}
                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-neutral transition-colors text-[10px] font-black uppercase text-accent"
                      >
                        Hapus
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="h-px bg-neutral-dark w-full" />

        <div className="space-y-4">
           {bundle.items.slice(0, isExpanded ? bundle.items.length : 3).map((item, i) => (
             <div 
                key={i} 
                className="flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => !isPaid && onToggleItem?.(i)}
              >
                <div className="flex items-center gap-3">
                   <div className={`w-6 h-6 rounded-lg border-2 border-primary/20 flex items-center justify-center transition-colors ${item.isChecked ? 'bg-primary border-primary' : 'bg-neutral'}`}>
                      {item.isChecked && <CheckCircle2 size={14} className="text-white" />}
                   </div>
                   <span className={`text-sm font-bold transition-all ${item.isChecked ? 'line-through text-gray-400' : 'text-primary'}`}>
                    {item.name}
                   </span>
                </div>
                <span className={`text-xs font-black ${item.isChecked ? 'text-gray-300' : 'text-gray-500'}`}>
                  Rp{item.amount.toLocaleString('id-ID')}
                </span>
             </div>
           ))}
           
           {!isExpanded && bundle.items.length > 3 && (
             <button 
               onClick={() => setIsExpanded(true)}
               className="text-[10px] font-black text-primary uppercase mt-2 tracking-widest pl-9"
             >
               + {bundle.items.length - 3} Item Lagi
             </button>
           )}
        </div>

        <div className="h-px bg-neutral-dark w-full" />

        <div className="flex justify-between items-center">
           <div className="flex flex-col gap-0.5">
             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                <WalletIcon size={14} />
                <span className="uppercase">{wallet?.name || 'Tunai'}</span>
             </div>
             {checkedItemsTotal > 0 && !isPaid && (
               <span className="text-[10px] font-black text-primary">Checklist: Rp{checkedItemsTotal.toLocaleString('id-ID')}</span>
             )}
           </div>
           
           {!isPaid && (
             <button 
                onClick={onPay}
                disabled={checkedItemsTotal === 0}
                className="bg-primary text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:grayscale disabled:opacity-50"
             >
                Bayar Rp{checkedItemsTotal === 0 ? total.toLocaleString('id-ID') : checkedItemsTotal.toLocaleString('id-ID')}
             </button>
           )}

           {isPaid && (
              <div className="flex items-center gap-2 text-green-500 font-black text-xs uppercase bg-green-50 px-4 py-2 rounded-xl">
                 <CheckCircle2 size={16} />
                 Lunas & Selesai
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
