import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Info, 
  ChevronRight, 
  Building2, 
  Smartphone, 
  Wallet as WalletIcon,
  Plus
} from "lucide-react";
import { auth } from "../../../nexus/firebase";
import { FinanceService } from "../../../services/financeService";
import { toast } from "sonner";
import { useFinanceData } from "../../../hooks/useFinance";

export function NewWalletForm({ onClose }: { onClose: () => void }) {
  const { profile } = useFinanceData();
  const [walletName, setWalletName] = useState("");
  const [balance, setBalance] = useState("0");
  const [walletCategory, setWalletCategory] = useState<"debit" | "credit">("debit");
  const [creditLimit, setCreditLimit] = useState("0");
  const [type, setType] = useState<"Bank" | "E-Wallet" | "Cash">("Bank");
  const [selectedIcon, setSelectedIcon] = useState<string>(type === 'Bank' ? 'Building2' : type === 'E-Wallet' ? 'Smartphone' : 'WalletIcon');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !walletName || !profile) return;

    setLoading(true);
    try {
      await FinanceService.addData(user.uid, profile.linkedUserId || null, 'wallets', {
        name: walletName,
        balance: Number(balance),
        type: walletCategory, // debit or credit
        walletType: type, // Bank, E-Wallet, Cash
        limit: walletCategory === 'credit' ? Number(creditLimit) : 0,
        color: type === 'Bank' ? 'bg-blue-500' : type === 'E-Wallet' ? 'bg-purple-500' : 'bg-green-500',
        icon: selectedIcon
      });
      toast.success("Dompet berhasil ditambahkan");
      onClose();
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-0 z-[70] bg-neutral flex flex-col overflow-y-auto"
    >
      <header className="p-6 flex items-center justify-between bg-white border-b border-neutral shadow-sm sticky top-0 z-10">
        <button onClick={onClose} className="p-2">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold">Tambah Dompet</h2>
        <button 
          onClick={handleSave}
          disabled={loading || !walletName}
          className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {loading ? '...' : 'Simpan'}
        </button>
      </header>

      <div className="p-6 flex flex-col gap-8">
        {/* Info Box */}
        <div className="bg-orange-50/50 border border-orange-100 p-6 rounded-[24px] flex items-start gap-4">
          <div className="p-1 rounded-full bg-orange-100 flex items-center justify-center">
            <Info size={14} className="text-orange-500" />
          </div>
          <div className="flex flex-col gap-1">
             <p className="text-[12px] font-bold text-gray-700">Tidak ada template tersedia</p>
             <p className="text-[12px] text-gray-500 italic font-serif">Impor paket ikon di Pengaturan untuk melihat paket ikon bank/e-wallet</p>
          </div>
        </div>

        <section className="flex flex-col gap-6">
           <h3 className="text-xl font-black text-primary">Detail Dompet</h3>

           <div className="flex flex-col gap-6">
             {/* Wallet Category Selector */}
             <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Kategori Dompet</label>
               <div className="flex bg-white p-1.5 rounded-[28px] shadow-sm border border-neutral-dark">
                 <button 
                  onClick={() => setWalletCategory("debit")}
                  className={`flex-1 py-4 font-bold rounded-[22px] transition-all ${walletCategory === 'debit' ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}
                 >
                   Debit (Saldo Rill)
                 </button>
                 <button 
                  onClick={() => setWalletCategory("credit")}
                  className={`flex-1 py-4 font-bold rounded-[22px] transition-all ${walletCategory === 'credit' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-gray-400'}`}
                 >
                   Kredit (Limit)
                 </button>
               </div>
             </div>

             {/* Credit Limit (Only if credit) */}
             {walletCategory === 'credit' && (
               <motion.div 
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-4"
               >
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Limit Kredit / Paylater</label>
                 <input 
                   type="number" 
                   value={creditLimit}
                   onChange={(e) => setCreditLimit(e.target.value)}
                   className="w-full bg-white p-6 rounded-[32px] text-2xl font-black text-[#1e293b] outline-none border border-white focus:border-primary/20 shadow-sm"
                 />
               </motion.div>
             )}

             {/* Wallet Name */}
             <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Nama Dompet</label>
               <input 
                 type="text" 
                 value={walletName}
                 onChange={(e) => setWalletName(e.target.value)}
                 placeholder="misal: BCA, GoPay, Tunai"
                 className="w-full bg-white p-6 rounded-[32px] text-lg font-bold outline-none border border-white focus:border-primary/20 shadow-sm"
               />
             </div>

             {/* Currency Selector */}
             <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Mata Uang Dompet</label>
               <div className="bg-white p-6 rounded-[32px] border border-white flex items-center justify-between shadow-sm cursor-pointer active:scale-95 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral rounded-full flex items-center justify-center">
                      <span className="text-gray-600">🌐</span>
                    </div>
                    <div>
                      <p className="font-bold text-primary">IDR</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Indonesian Rupiah</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
               </div>
             </div>

             {/* Initial Balance */}
             <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Saldo Awal</label>
               <input 
                 type="number" 
                 value={balance}
                 onChange={(e) => setBalance(e.target.value)}
                 className="w-full bg-white p-6 rounded-[32px] text-2xl font-black text-primary outline-none border border-white focus:border-primary/20 shadow-sm"
               />
             </div>

             {/* Exclude Toggle */}
             <div className="bg-white/50 p-6 rounded-[32px] border border-white/50 flex items-center justify-between">
                <div className="flex flex-col gap-1 pr-4">
                  <p className="font-bold text-primary text-sm">Kecualikan dari Total</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Saldo dompet ini tidak dihitung ke total saldo utama. Transaksi yang menggunakan dompet ini juga akan dikecualikan dari statistik.</p>
                </div>
                <div className="w-14 h-8 bg-gray-200 rounded-full relative p-1 cursor-pointer">
                  <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
                </div>
             </div>

             {/* Type Selector */}
             <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Tipe</label>
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                 {[
                   { id: 'Bank', label: 'Bank', icon: Building2 },
                   { id: 'E-Wallet', label: 'E-Wallet', icon: Smartphone },
                   { id: 'Cash', label: 'Tunai', icon: WalletIcon }
                 ].map(t => (
                   <button 
                    key={t.id}
                    onClick={() => setType(t.id as any)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold whitespace-nowrap transition-all border ${type === t.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-white shadow-sm'}`}
                   >
                     <t.icon size={18} />
                     {t.label}
                   </button>
                 ))}
               </div>
             </div>

             {/* Icons */}
             <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Ikon</label>
               <div className="flex gap-4">
                 {[
                   { id: 'Building2', icon: Building2 },
                   { id: 'Smartphone', icon: Smartphone },
                   { id: 'WalletIcon', icon: WalletIcon }
                 ].map(i => (
                   <button 
                    key={i.id}
                    onClick={() => setSelectedIcon(i.id)}
                    className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all border ${selectedIcon === i.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-gray-400 border-white shadow-sm'}`}
                   >
                     <i.icon size={28} />
                   </button>
                 ))}
               </div>
             </div>

          </div>
        </section>
      </div>
    </motion.div>
  );
}
