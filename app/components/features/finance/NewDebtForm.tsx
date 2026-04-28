import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  User, 
  Calendar, 
  Clock, 
  Wallet, 
  FileText,
  ChevronDown
} from "lucide-react";
import { auth } from "../../../nexus/firebase";
import { FinanceService } from "../../../services/financeService";
import { useFinanceData } from "../../../hooks/useFinance";
import { toast } from "sonner";

export function NewDebtForm({ onClose }: { onClose: () => void }) {
  const { profile } = useFinanceData();
  const [type, setType] = useState<'debt' | 'receivable'>('debt');
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [interestRate, setInterestRate] = useState("2.49");
  const [tenor, setTenor] = useState("12");
  const [dueDateDay, setDueDateDay] = useState("28");
  const [startDate, setStartDate] = useState("2026-04-28");

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !personName || !amount || !profile) return;

    setLoading(true);
    try {
      const debtAmount = Number(amount);
      const debtId = await FinanceService.addData(user.uid, profile.linkedUserId || null, 'debts', {
        personName,
        amount: debtAmount,
        paidAmount: 0,
        type,
        borrowDate: new Date(),
        status: 'active',
        notes: notes.trim(),
        isInstallment,
        interestRate: isInstallment ? Number(interestRate) : 0,
        tenor: isInstallment ? Number(tenor) : 0,
        dueDateDay: isInstallment ? Number(dueDateDay) : 0,
      });

      if (isInstallment) {
        // Create Recurring Transaction for installments
        const months = Number(tenor);
        const monthlyInterest = Number(interestRate) / 100;
        const monthlyAmount = Math.round((debtAmount / months) + (debtAmount * monthlyInterest));

        const start = new Date(startDate);
        
        await FinanceService.addData(user.uid, profile.linkedUserId || null, 'recurring_transactions', {
          title: `Cicilan ${personName}`,
          amount: monthlyAmount,
          frequency: 'Monthly',
          startDate: start,
          notes: `Cicilan untuk hutang ${personName}. Tenor ${months} bulan.`,
          relatedId: debtId,
          type: type === 'debt' ? 'expense' : 'income'
        });
      }

      toast.success("Hutang dan cicilan berhasil ditambahkan");
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
      className="fixed inset-0 z-[70] bg-neutral flex flex-col overflow-y-auto"
    >
      <header className="p-6 flex items-center justify-between bg-white border-b border-neutral shadow-sm sticky top-0 z-10">
        <button onClick={onClose} className="p-2">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold">Tambah Hutang/Piutang</h2>
        <button 
          onClick={handleSubmit} 
          disabled={loading || !personName || !amount}
          className="text-primary font-bold disabled:opacity-30"
        >
          {loading ? "..." : "Simpan"}
        </button>
      </header>

      <div className="p-8 flex flex-col gap-8">
        {/* Toggle Type */}
        <div className="flex bg-white p-1 rounded-[24px] shadow-sm border border-neutral-dark">
           <button 
             onClick={() => setType('debt')}
             className={`flex-1 py-4 font-bold rounded-[22px] transition-all ${type === 'debt' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'text-gray-400'}`}
           >
             Saya Berhutang
           </button>
           <button 
             onClick={() => setType('receivable')}
             className={`flex-1 py-4 font-bold rounded-[22px] transition-all ${type === 'receivable' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'text-gray-400'}`}
           >
             Saya Meminjamkan
           </button>
        </div>

        {/* Person Name */}
        <div className="flex flex-col gap-4">
           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Nama Orang/Lembaga</label>
           <div className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-center gap-4">
              <User size={20} className="text-gray-400" />
              <input 
                type="text" 
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Istri, Teman, Bank BCA"
                className="flex-1 text-lg font-bold outline-none placeholder:text-gray-300"
              />
           </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-4">
           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Total Hutang</label>
           <div className="flex items-center gap-4">
              <div className="bg-white px-4 py-4 rounded-2xl border border-neutral-dark shadow-xs flex items-center gap-2">
                <span className="font-bold text-primary">Rp</span>
              </div>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="text-4xl font-black text-primary outline-none bg-transparent w-full"
              />
           </div>
        </div>

        {/* Installment Toggle */}
        <div className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-primary">Atur Cicilan</p>
              <p className="text-xs text-gray-400 font-bold">Otomatis buat data berulang</p>
            </div>
            <button 
              onClick={() => setIsInstallment(!isInstallment)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isInstallment ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isInstallment ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {isInstallment && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="flex flex-col gap-4 pt-4 border-t border-neutral"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Bunga Per Bulan (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full bg-neutral p-4 rounded-2xl font-bold text-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Tenor (Bulan)</label>
                  <input 
                    type="number" 
                    value={tenor}
                    onChange={(e) => setTenor(e.target.value)}
                    className="w-full bg-neutral p-4 rounded-2xl font-bold text-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Tanggal Jatuh Tempo</label>
                  <input 
                    type="number" 
                    min="1" max="31"
                    value={dueDateDay}
                    onChange={(e) => setDueDateDay(e.target.value)}
                    className="w-full bg-neutral p-4 rounded-2xl font-bold text-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Mulai Dari</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-neutral p-4 rounded-2xl font-bold text-primary outline-none text-xs"
                  />
                </div>
              </div>
              
              <div className="mt-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Estimasi Cicilan</p>
                <p className="text-xl font-black text-primary">
                  Rp{Number(amount) > 0 ? Math.round((Number(amount) / (Number(tenor) || 1)) + (Number(amount) * (Number(interestRate) / 100))).toLocaleString('id-ID') : '0'}
                  <span className="text-xs font-bold text-gray-400 ml-1">/ bulan</span>
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-4">
           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Catatan</label>
           <div className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-center gap-4">
              <FileText size={20} className="text-gray-400" />
              <input 
                type="text" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambah catatan..."
                className="flex-1 text-sm font-bold outline-none placeholder:text-gray-300"
              />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
