import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  DollarSign
} from "lucide-react";
import { auth } from "../../../nexus/firebase";
import { FinanceService } from "../../../services/financeService";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useFinanceData, Bill } from "../../../hooks/useFinance";

export function BillsPage({ onClose }: { onClose: () => void }) {
  const { bills, loading, profile } = useFinanceData();
  const [showAddBill, setShowAddBill] = useState(false);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');

  const handleDeleteBill = async (id: string) => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    const result = await Swal.fire({
      title: 'Hapus Tagihan?',
      text: "Data tagihan akan dihapus secara permanen.",
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
        await FinanceService.deleteData(user.uid, profile.linkedUserId || null, 'bills', id);
        toast.success("Tagihan dihapus");
      } catch (error: any) {
        toast.error(`Gagal: ${error.message}`);
      }
    }
  };

  const handleToggleStatus = async (bill: Bill) => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    try {
      await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'bills', bill.id, {
        status: bill.status === 'paid' ? 'unpaid' : 'paid'
      });
      toast.success("Status tagihan diperbarui");
    } catch (error: any) {
       toast.error(`Gagal: ${error.message}`);
    }
  };

  const unpaidBills = bills.filter(b => b.status === 'unpaid');
  const paidBills = bills.filter(b => b.status === 'paid');
  const totalUnpaid = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);

  const currentList = activeTab === 'unpaid' ? unpaidBills : paidBills;

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
          <h2 className="text-xl font-bold text-[#1e293b]">Tagihan</h2>
        </div>
        <button className="p-2">
          <MoreVertical size={24} className="text-gray-600" />
        </button>
      </header>

      <div className="p-6 flex flex-col gap-8 pb-12">
        {/* Summary Card */}
        <div className="bg-[#7c4dff] rounded-[40px] p-8 shadow-xl shadow-primary/20 text-white flex flex-col gap-6">
            <div className="flex justify-between items-center opacity-80">
                <span className="text-xs font-bold uppercase tracking-widest">Total Belum Dibayar</span>
                <span className="text-xs font-bold px-3 py-1 bg-white/20 rounded-full">{unpaidBills.length} Bills</span>
            </div>
            <h3 className="text-4xl font-black">Rp{totalUnpaid.toLocaleString('id-ID')}</h3>
            <div className="flex items-center gap-2 self-start px-3 py-1.5 bg-white/20 rounded-full text-[10px] font-bold">
                <ThumbsUp size={14} />
                <span>Semua Lunas!</span>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f1f5f9] p-1.5 rounded-[28px] border border-neutral-dark">
            <button 
                onClick={() => setActiveTab('unpaid')}
                className={`flex-1 py-4 rounded-[22px] font-bold text-sm transition-all ${activeTab === 'unpaid' ? 'bg-[#7c4dff] text-white shadow-lg' : 'text-gray-400'}`}
            >
                Belum Bayar
            </button>
            <button 
                onClick={() => setActiveTab('paid')}
                className={`flex-1 py-4 rounded-[22px] font-bold text-sm transition-all ${activeTab === 'paid' ? 'bg-[#7c4dff] text-white shadow-lg' : 'text-gray-400'}`}
            >
                Lunas
            </button>
        </div>

        {/* List Content */}
        {loading ? (
            <div className="flex justify-center p-20">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-8 text-center">
                <div className="w-24 h-24 bg-[#f1f5f9] rounded-full flex items-center justify-center text-gray-300">
                    <CheckCircle2 size={48} />
                </div>
                <div>
                   <h5 className="text-lg font-black text-[#1e293b] uppercase tracking-widest">Semua Terbayar!</h5>
                   <p className="text-xs text-gray-400 mt-2 leading-relaxed px-10">
                       Tagihan berulang berikutnya akan muncul otomatis di sini mendekati tanggal jatuh temponya.
                   </p>
                </div>

                <div className="bg-white border border-neutral-dark p-6 rounded-[28px] shadow-sm flex items-start gap-4 text-left max-w-xs">
                    <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-500 shrink-0">
                        <HelpCircle size={20} />
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                        Ketuk pengaturan di atas untuk melihat jadwal "Master" Tagihan Anda.
                    </p>
                </div>
            </div>
        ) : (
            <div className="flex flex-col gap-4">
                {currentList.map(bill => (
                    <div key={bill.id} className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                             <button 
                                onClick={() => handleToggleStatus(bill)}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${bill.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-neutral text-gray-400'}`}
                             >
                                <CheckCircle2 size={24} />
                             </button>
                             <div>
                                <h4 className="font-black text-[#1e293b]">{bill.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    Due: {bill.dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </p>
                             </div>
                        </div>
                        <div className="text-right">
                             <p className="text-lg font-black text-[#1e293b]">Rp{bill.amount.toLocaleString('id-ID')}</p>
                             <button onClick={() => handleDeleteBill(bill.id)} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={16} />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <button 
        onClick={() => setShowAddBill(true)}
        className="fixed right-6 bottom-10 w-16 h-16 bg-[#1e293b] text-white rounded-2xl shadow-xl flex items-center justify-center z-20 active:scale-95 transition-all"
      >
        <Plus size={32} />
      </button>

      <AnimatePresence>
        {showAddBill && (
          <NewBillForm onClose={() => setShowAddBill(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { MoreVertical, ThumbsUp, HelpCircle } from "lucide-react";

function NewBillForm({ onClose }: { onClose: () => void }) {
  const { profile } = useFinanceData();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !name || !amount || !dueDate || !profile) return;

    setLoading(true);
    try {
      await FinanceService.addData(user.uid, profile.linkedUserId || null, 'bills', {
        name,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        status: 'unpaid',
        category: 'Tagihan'
      });
      toast.success("Tagihan berhasil ditambahkan");
      onClose();
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="fixed inset-0 z-[80] bg-neutral flex flex-col"
    >
      <header className="p-6 flex items-center justify-between bg-white border-b border-neutral shadow-sm">
        <button onClick={onClose} className="p-2">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold">Tagihan Baru</h2>
        <button 
          onClick={handleSubmit}
          disabled={loading || !name}
          className="text-primary font-bold disabled:opacity-30"
        >
          {loading ? '...' : 'Simpan'}
        </button>
      </header>

      <div className="p-8 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Nama Tagihan</label>
          <div className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
               <AlertCircle size={24} />
             </div>
             <input 
               type="text" 
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Contoh: Listrik, Netflix"
               className="flex-1 text-lg font-bold outline-none placeholder:text-gray-300"
             />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Jumlah (IDR)</label>
          <div className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
               <DollarSign size={24} />
             </div>
             <input 
               type="number" 
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder="0"
               className="flex-1 text-lg font-bold outline-none placeholder:text-gray-300"
             />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Jatuh Tempo</label>
          <div className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
               <Calendar size={24} />
             </div>
             <input 
               type="date" 
               value={dueDate}
               onChange={(e) => setDueDate(e.target.value)}
               className="flex-1 text-lg font-bold outline-none"
             />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
