import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Check, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ChevronDown, 
  Wallet as WalletIcon,
  Trash2,
  FileText
} from "lucide-react";
import { useFinanceData } from "../../../hooks/useFinance";
import { FinanceService } from "../../../services/financeService";
import { auth } from "../../../nexus/firebase";
import { toast } from "sonner";

interface NewBundleFormProps {
  onClose: () => void;
  editBundle?: any;
}

export const NewBundleForm = ({ onClose, editBundle }: NewBundleFormProps) => {
  const { wallets, profile } = useFinanceData();
  const [name, setName] = useState(editBundle?.name || "");
  const [walletId, setWalletId] = useState(editBundle?.walletId || (wallets[0]?.id || ""));
  const [notes, setNotes] = useState(editBundle?.notes || "");
  const [items, setItems] = useState<{name: string, amount: string}[]>(
    editBundle?.items.map((i: any) => ({ name: i.name, amount: i.amount.toString() })) || 
    [{name: '', amount: ''}, {name: '', amount: ''}]
  );
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  const total = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  const addItem = () => {
    setItems([...items, {name: '', amount: ''}]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'name' | 'amount', value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Nama bundle harus diisi");
      return;
    }

    const validItems = items.filter(i => i.name.trim() !== '');
    if (validItems.length === 0) {
      toast.error("Minimal harus ada satu item");
      return;
    }

    try {
      if (!profile) return;
      const bundleData = {
        name,
        walletId,
        notes,
        updatedAt: new Date(),
        items: validItems.map((i, index) => ({
          name: i.name,
          amount: Number(i.amount) || 0,
          isChecked: editBundle ? (editBundle.items[index]?.isChecked || false) : false
        }))
      };

      if (editBundle) {
        await FinanceService.updateData(auth.currentUser!.uid, profile.linkedUserId || null, 'bundles', editBundle.id, bundleData);
        toast.success("Bundle berhasil diubah");
      } else {
        await FinanceService.addData(auth.currentUser!.uid, profile.linkedUserId || null, 'bundles', {
          ...bundleData,
          date: new Date(),
          status: 'active'
        });
        toast.success("Bundle berhasil dibuat");
      }
      onClose();
    } catch (error) {
      toast.error(editBundle ? "Gagal mengubah bundle" : "Gagal membuat bundle");
    }
  };

  const selectedWallet = wallets.find(w => w.id === walletId);

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-neutral flex flex-col"
    >
      <header className="p-6 flex items-center justify-between bg-white border-b border-neutral-dark">
        <button onClick={onClose} className="p-2 text-gray-400">
          <X size={24} />
        </button>
        <h2 className="text-xl font-black text-primary">{editBundle ? 'Ubah Bundle' : 'Bundle Baru'}</h2>
        <button onClick={handleSubmit} className="p-2 text-primary">
          <Check size={28} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="flex flex-col gap-8">
          {/* Bundle Name */}
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-dark flex flex-col gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                   <ShoppingBag size={24} />
                </div>
                <input 
                  type="text"
                  placeholder="Nama Bundle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-xl font-black text-primary placeholder:text-gray-300"
                />
             </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Bayar dengan Dompet</p>
            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => setShowWalletPicker(true)}
                  className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-dark flex items-center gap-4 text-left relative overflow-hidden"
               >
                  <div className={`w-10 h-10 ${selectedWallet?.color || 'bg-primary'} bg-opacity-10 rounded-xl flex items-center justify-center ${selectedWallet?.color?.replace('bg-', 'text-') || 'text-primary'}`}>
                    <WalletIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Dompet</p>
                    <p className="font-bold text-primary truncate leading-tight">{selectedWallet?.name || 'Pilih'}</p>
                  </div>
                  <ChevronDown size={16} className="text-gray-300" />
               </button>

               <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-dark flex flex-col justify-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Mata Uang</p>
                  <p className="font-bold text-primary leading-tight">IDR (Rp)</p>
               </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-lg font-black text-primary">Daftar Item</h3>
               <button onClick={addItem} className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Plus size={18} />
                  Tambah Item
               </button>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-[28px] border border-neutral-dark flex items-center gap-3 shadow-sm transition-all focus-within:border-primary">
                  <input 
                    type="text"
                    placeholder="Nama Barang"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="flex-1 bg-transparent border-none focus:outline-none font-bold text-primary placeholder:text-gray-200 text-sm"
                  />
                  <div className="h-6 w-px bg-neutral-dark mx-2" />
                  <input 
                    type="number"
                    placeholder="Harga"
                    value={item.amount}
                    onChange={(e) => updateItem(index, 'amount', e.target.value)}
                    className="w-20 bg-transparent border-none focus:outline-none font-black text-primary placeholder:text-gray-200 text-sm text-right"
                  />
                  <button onClick={() => removeItem(index)} className="p-2 text-accent">
                    <Minus size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-[32px] p-6 border border-neutral-dark shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 bg-neutral rounded-xl flex items-center justify-center text-gray-400">
                <FileText size={20} />
             </div>
             <input 
               type="text"
               placeholder="Catatan Tambahan"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               className="flex-1 bg-transparent border-none focus:outline-none font-bold text-sm text-primary placeholder:text-gray-300"
             />
          </div>
        </div>
      </div>

      <div className="p-8 bg-white border-t border-neutral-dark rounded-t-[48px] shadow-2xl">
         <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Estimasi Total</p>
            <p className="text-2xl font-black text-primary">Rp{total.toLocaleString('id-ID')}</p>
         </div>
      </div>

      {/* Wallet Picker Modal */}
      <AnimatePresence>
        {showWalletPicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWalletPicker(false)}
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 z-[85] bg-white rounded-t-[40px] p-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-primary">Pilih Dompet</h3>
                <button onClick={() => setShowWalletPicker(false)}>
                  <X size={24} className="text-gray-400" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {wallets.map(w => (
                  <button 
                    key={w.id}
                    onClick={() => {
                      setWalletId(w.id);
                      setShowWalletPicker(false);
                    }}
                    className={`flex items-center justify-between p-5 rounded-[28px] border-2 transition-all ${walletId === w.id ? 'border-primary bg-primary/5' : 'border-neutral-dark'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${w.color} bg-opacity-10 rounded-xl flex items-center justify-center ${w.color.replace('bg-', 'text-')}`}>
                        <WalletIcon size={18} />
                      </div>
                      <span className="font-bold text-primary">{w.name}</span>
                    </div>
                    <span className="text-xs font-black text-primary">Rp{w.balance.toLocaleString('id-ID')}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
