import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Repeat,
  Wallet,
  Trash2,
  CheckCircle2,
  Clock,
  LayoutGrid
} from "lucide-react";
import { auth } from "../../../nexus/firebase";
import { FinanceService } from "../../../services/financeService";
import { toast } from "sonner";
import { useFinanceData, RecurringTransaction } from "../../../hooks/useFinance";

export function RecurringPage({ onClose }: { onClose: () => void }) {
  const { recurringTransactions, wallets, loading, profile } = useFinanceData();
  const [showAdd, setShowAdd] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleDelete = async (id: string) => {
    const user = auth.currentUser;
    if (!user || !profile || !confirm("Hapus transaksi berulang ini?")) return;
    try {
      await FinanceService.deleteData(user.uid, profile.linkedUserId || null, 'recurring_transactions', id);
      toast.success("Transaksi berulang dihapus");
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const hasRecurringOnDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    return recurringTransactions.some(rec => {
      const start = new Date(rec.startDate);
      start.setHours(0, 0, 0, 0);
      
      if (d < start) return false;

      if (rec.frequency === 'Daily') return true;
      if (rec.frequency === 'Weekly') return d.getDay() === start.getDay();
      if (rec.frequency === 'Monthly') {
        const targetDate = start.getDate();
        // Handle cases for days 29, 30, 31 in shorter months
        const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        if (targetDate > lastDayOfMonth) {
          return d.getDate() === lastDayOfMonth;
        }
        return d.getDate() === targetDate;
      }
      return false;
    });
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = getDaysInMonth(year, month);
    let firstDay = getFirstDayOfMonth(year, month);
    // Adjust for Monday start
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const calendarItems = [];
    // Prev month padding
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      d.setHours(0, 0, 0, 0);
      calendarItems.push({ 
        day: prevMonthLastDate - i, 
        currentMonth: false,
        date: d
      });
    }
    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      calendarItems.push({ 
        day: i, 
        currentMonth: true,
        date: d
      });
    }
    // Next month padding
    const remaining = 42 - calendarItems.length;
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        d.setHours(0, 0, 0, 0);
        calendarItems.push({ 
          day: i, 
          currentMonth: false,
          date: d
        });
    }

    return calendarItems;
  };

  const isPaidThisMonth = (rec: RecurringTransaction) => {
    if (!rec.paidMonths) return false;
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return rec.paidMonths.includes(monthYear);
  };

  const handleExecutePayment = async (rec: RecurringTransaction) => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    // We might want to let user select wallet, but for now use the one in rec or default
    const walletId = rec.walletId || (wallets.length > 0 ? wallets[0].id : 'cash');
    
    if (!confirm(`Eksekusi pembayaran ${rec.title} sebesar Rp${rec.amount.toLocaleString('id-ID')}?`)) return;

    try {
      await FinanceService.executeRecurringPayment(user.uid, profile.linkedUserId || null, rec, walletId);
      toast.success(`Pembayaran ${rec.title} berhasil dieksekusi`);
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    }
  };

  const totalCommitment = recurringTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const filteredTransactions = recurringTransactions.filter(rec => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    const start = new Date(rec.startDate);
    start.setHours(0, 0, 0, 0);
    
    if (d < start) return false;

    if (rec.frequency === 'Daily') return true;
    if (rec.frequency === 'Weekly') return d.getDay() === start.getDay();
    if (rec.frequency === 'Monthly') {
      const targetDate = start.getDate();
      const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      if (targetDate > lastDayOfMonth) {
        return d.getDate() === lastDayOfMonth;
      }
      return d.getDate() === targetDate;
    }
    return false;
  });

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
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
          <h2 className="text-xl font-bold text-[#1e293b]">Berulang</h2>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="p-2"
        >
          <Plus size={24} className="text-gray-600" />
        </button>
      </header>

      <div className="p-6 flex flex-col gap-6">
        {/* commitment card */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-dark flex flex-col gap-6">
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Komitmen Bulanan</span>
              <span className="text-xl font-black text-[#1e293b]">Rp{totalCommitment.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="h-[1px] bg-neutral-dark w-full" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-2">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-neutral rounded-full transition-colors"><ChevronLeft size={20} /></button>
                    <h3 className="font-black text-primary text-base uppercase tracking-tight">{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-neutral rounded-full transition-colors"><ChevronRight size={20} /></button>
                </div>

                <div className="grid grid-cols-7 text-center gap-y-2">
                    {days.map(d => <span key={d} className="text-[8px] font-black text-gray-300 uppercase letter tracking-widest">{d}</span>)}
                    {renderCalendar().map((item, i) => {
                        const hasNotif = item.currentMonth && hasRecurringOnDate(item.date);
                        const isSelected = isSameDay(item.date, selectedDate);
                        const isToday = isSameDay(item.date, new Date());

                        return (
                            <button 
                                key={i} 
                                onClick={() => setSelectedDate(item.date)}
                                className={`flex flex-col items-center py-2 relative transition-all ${isSelected ? 'scale-110 z-10' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                                    isSelected ? 'bg-primary text-white shadow-xl rotate-6' : 
                                    item.currentMonth ? (isToday ? 'text-primary bg-primary/10' : 'text-[#1e293b]') : 'text-gray-200'
                                }`}>
                                    {item.day}
                                </div>
                                {hasNotif && !isSelected && (
                                    <div className="absolute bottom-1 w-1 h-1 bg-accent rounded-full" />
                                )}
                                {hasNotif && isSelected && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full border border-white" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {isSameDay(selectedDate, new Date()) ? 'Hari Ini' : selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </p>
                <div className="flex items-center gap-1 opacity-40">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase">{selectedDate.getFullYear()}</span>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {filteredTransactions.map(rec => {
                    const paid = isPaidThisMonth(rec);
                    return (
                        <div key={rec.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-dark flex items-center justify-between group hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center border border-neutral-dark ${paid ? 'bg-primary/10 text-primary' : 'bg-[#f8f9fa] text-[#1e293b]'}`}>
                                    {paid ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Repeat size={24} strokeWidth={2.5} />}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="font-black text-[#1e293b]">{rec.title}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 rounded-lg ${paid ? 'bg-green-100 text-green-600' : 'bg-primary/5 text-primary'}`}>
                                            {paid ? 'Lunas' : rec.frequency}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Wallet size={10} className="text-gray-400" />
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Tunai</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <span className="text-xl font-black text-accent">Rp{rec.amount.toLocaleString('id-ID')}</span>
                                <div className="flex items-center gap-2">
                                    {!paid && (
                                        <button 
                                            onClick={() => handleExecutePayment(rec)}
                                            className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-sm hover:translate-y-[-2px] transition-all"
                                        >
                                            Bayar
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(rec.id)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredTransactions.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-300 opacity-50">
                        <CalendarIcon size={64} strokeWidth={1.5} />
                        <p className="text-sm font-bold uppercase tracking-widest">Tidak ada jadwal</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && <NewRecurringForm onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function NewRecurringForm({ onClose }: { onClose: () => void }) {
    const { profile } = useFinanceData();
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState<'Monthly' | 'Weekly' | 'Daily'>("Monthly");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        const user = auth.currentUser;
        if (!user || !title || !amount || !profile) return;

        setLoading(true);
        try {
            await FinanceService.addData(user.uid, profile.linkedUserId || null, 'recurring_transactions', {
                title,
                amount: Number(amount),
                frequency,
                startDate: new Date(startDate),
                endDate: null,
                notes: ""
            });
            toast.success("Transaksi berulang berhasil ditambahkan");
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
            className="fixed inset-0 z-[80] bg-white flex flex-col overflow-y-auto"
        >
            <header className="p-6 flex items-center justify-between bg-white border-b border-neutral shadow-sm">
                <button onClick={onClose} className="p-2"><ChevronLeft size={24} className="text-gray-600" /></button>
                <h2 className="text-xl font-bold">Transaksi Berulang Baru</h2>
                <button onClick={handleSubmit} disabled={loading || !title} className="text-[#1e293b] font-bold p-2"><CheckCircle2 size={24} /></button>
            </header>

            <div className="p-8 flex flex-col gap-8 pb-12">
                <div className="flex flex-col gap-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Jumlah</label>
                    <div className="bg-[#f1f5f9] p-6 rounded-[28px] flex items-center gap-4">
                        <div className="px-4 py-2 bg-neutral-dark rounded-xl text-lg font-black text-[#1e293b]">Rp</div>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="bg-transparent flex-1 text-4xl font-black outline-none"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Judul</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Contoh: VIP Shopee"
                        className="bg-[#f1f5f9] p-6 rounded-[28px] text-lg font-bold outline-none"
                    />
                </div>

                <div className="flex flex-col gap-4">
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Custom Icon (Optional)</label>
                   <div className="bg-white border-2 border-dashed border-neutral-dark p-10 rounded-[28px] flex flex-col items-center justify-center gap-3 text-gray-400">
                        <div className="w-12 h-12 bg-neutral-dark rounded-xl flex items-center justify-center">
                            <Plus size={24} />
                        </div>
                        <p className="text-xs font-bold">Tap to select icon</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Frekuensi</label>
                        <select 
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as any)}
                            className="bg-[#f1f5f9] p-6 rounded-[28px] font-bold outline-none appearance-none"
                        >
                            <option value="Monthly">Monthly</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Daily">Daily</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Tanggal Mulai</label>
                         <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-[#f1f5f9] p-6 rounded-[28px] font-bold outline-none"
                         />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Bayar dengan Dompet</label>
                    <div className="bg-[#f1f5f9] p-6 rounded-[28px] flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-xs flex items-center justify-center">
                                <Wallet size={20} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="font-bold text-primary">Cash</p>
                                <p className="text-[10px] font-bold text-gray-400">Rp 91.000</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
