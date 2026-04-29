import { useState, useMemo, useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { 
  ChevronLeft, 
  Search, 
  ChevronDown, 
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  Tag,
  Trash2,
  Download
} from "lucide-react";
import { useFinanceData, Transaction } from "../../../hooks/useFinance";
import { FinanceService } from "../../../services/financeService";
import { auth } from "../../../nexus/firebase";
import Swal from "sweetalert2";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';

export function TransactionLogPage({ onClose }: { onClose: () => void }) {
  const dragControls = useDragControls();
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<'Hari' | 'Minggu' | 'Bulan' | 'Tahun' | 'Semua'>('Semua');
  const { transactions, loading, categories, wallets, profile } = useFinanceData(activeFilter);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>("Semua");

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                         t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(t.category);
    const matchesWallet = selectedWallet === "Semua" || t.walletId === selectedWallet;
    
    return matchesSearch && matchesCategory && matchesWallet;
  });

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions]);

  const handleExport = (type: 'csv' | 'xlsx') => {
    if (filteredTransactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const exportData = filteredTransactions.map(t => ({
      Tanggal: t.date.toLocaleDateString('id-ID'),
      Judul: t.title,
      Kategori: t.category,
      Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Jumlah: t.amount,
      Dompet: wallets.find(w => w.id === t.walletId)?.name || 'N/A',
      Catatan: t.notes || ''
    }));

    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    exportData.push({
      Tanggal: 'TOTAL',
      Judul: 'Ringkasan',
      Kategori: '-',
      Tipe: '-',
      Jumlah: 0,
      Dompet: '-',
      Catatan: `Pemasukan: Rp${totalIncome.toLocaleString()} | Pengeluaran: Rp${totalExpense.toLocaleString()}`
    } as any);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    
    const fileName = `Export_Log_Keuangan_${activeFilter}_${new Date().getTime()}.${type}`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Berhasil ekspor ke ${type.toUpperCase()}`);
  };

  const handleExportImage = async () => {
    if (reportRef.current === null) return;
    
    const toastId = toast.loading("Menghasilkan laporan gambar...");
    try {
      const dataUrl = await toPng(reportRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
          padding: '40px',
          borderRadius: '0px'
        },
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `Laporan_Log_Keuangan_${activeFilter}_${new Date().toLocaleDateString('id-ID')}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Laporan berhasil disimpan!", { id: toastId });
    } catch (err) {
      console.error("Export Error:", err);
      toast.error("Gagal mengekspor gambar laporan.");
    }
  };

  const handleDelete = async (tx: Transaction) => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    const result = await Swal.fire({
      title: 'Hapus Transaksi?',
      text: "Saldo dompet akan dikembalikan otomatis.",
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
        await FinanceService.deleteTransaction(user.uid, profile.linkedUserId || null, tx);
        toast.success("Transaksi berhasil dihapus");
      } catch (error) {
        toast.error("Gagal menghapus transaksi");
      }
    }
  };

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
       dragElastic={0.7}
       onDragEnd={(_, info) => {
         if (info.offset.y > 150) onClose();
       }}
       className="fixed inset-x-0 bottom-0 top-[8%] z-[60] bg-neutral flex flex-col rounded-t-[48px] shadow-2xl border-t border-white/20 overflow-hidden"
     >
       {/* Drag Handle */}
       <div className="w-full flex justify-center pt-3 pb-2 sticky top-0 bg-neutral/80 backdrop-blur-md z-[20] cursor-grab active:cursor-grabbing shrink-0" onPointerDown={(e) => dragControls.start(e)}>
         <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
       </div>

       <div className="overflow-y-auto flex-1">
         <header className="p-6 pt-2 flex items-center justify-between sticky top-0 bg-neutral/80 backdrop-blur-md z-10">
           <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm">
             <ChevronLeft size={24} className="text-gray-600" />
           </button>
           <h2 className="text-xl font-black text-primary">Log Transaksi</h2>
           <div className="w-10" />
         </header>

         <div className="px-6 pb-32 flex flex-col gap-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full bg-white py-6 pl-16 pr-6 rounded-[32px] border border-neutral-dark shadow-sm outline-none font-bold text-primary focus:border-primary/20 transition-all"
          />
        </div>

        {/* Filters Scroll */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center bg-white/50 px-4 py-2 rounded-2xl border border-neutral-dark mb-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Ekspor</span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleExport('csv')}
                className="p-2 bg-white text-primary rounded-xl border border-neutral-dark active:scale-95 transition-all shadow-sm flex items-center justify-center"
                title="Ekspor CSV"
              >
                <Download size={14} />
                <span className="text-[10px] font-black ml-1.5 uppercase">CSV</span>
              </button>
              <button 
                onClick={() => handleExport('xlsx')}
                className="p-2 bg-green-50 text-green-600 rounded-xl border border-green-200 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                title="Ekspor Excel"
              >
                <Download size={14} />
                <span className="text-[10px] font-black ml-1.5 uppercase">XLS</span>
              </button>
              <button 
                onClick={handleExportImage}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                title="Ekspor Image"
              >
                <Download size={14} />
                <span className="text-[10px] font-black ml-1.5 uppercase">IMG</span>
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <div className="flex bg-white px-2 py-2 rounded-full border border-neutral-dark shadow-xs gap-1">
                {['Hari', 'Minggu', 'Bulan', 'Tahun', 'Semua'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setActiveFilter(f as any)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all ${activeFilter === f ? 'bg-primary text-white' : 'text-gray-400'}`}
                  >
                    {f}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <Tag size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button 
                onClick={() => setSelectedCategories([])}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all border whitespace-nowrap ${selectedCategories.length === 0 ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-neutral-dark'}`}
              >
                Semua
              </button>
              {[...new Set(categories.map(c => c.name))].map(catName => (
                <button 
                  key={catName}
                  onClick={() => {
                    setSelectedCategories(prev => 
                      prev.includes(catName) 
                        ? prev.filter(c => c !== catName)
                        : [...prev, catName]
                    );
                  }}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all border whitespace-nowrap ${selectedCategories.includes(catName) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-neutral-dark'}`}
                >
                  {catName}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <FilterSelect 
                label="Dompet" 
                icon={Wallet} 
                value={selectedWallet} 
                onChange={setSelectedWallet}
                options={[
                  "Semua",
                  ...wallets.map(w => ({ label: w.name, value: w.id }))
                ]} 
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center p-10">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-[40px] p-12 border-2 border-dashed border-neutral-dark text-center">
              <p className="font-bold text-gray-400">Tidak ada transaksi yang ditemukan.</p>
            </div>
          ) : (
            filteredTransactions.map(tx => (
              <div key={tx.id} className="bg-white p-5 rounded-[32px] border border-neutral-dark flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${tx.type === 'income' ? 'bg-secondary/5 text-secondary' : 'bg-accent/5 text-accent'}`}>
                    {tx.type === 'income' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">{tx.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                      {tx.category}{tx.subCategory ? ` • ${tx.subCategory}` : ''} • {tx.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} {tx.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-black ${tx.type === 'income' ? 'text-secondary' : 'text-accent'}`}>
                      {tx.type === 'income' ? '+' : '-'}Rp{tx.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(tx); }}
                    className="p-2 text-gray-300 hover:text-accent transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hidden Report Template for Image Export */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={reportRef} className="w-[800px] bg-white p-10 flex flex-col gap-6 text-black">
          <div className="flex justify-between items-end border-b-2 border-primary pb-4">
            <div>
              <h1 className="text-3xl font-black text-primary">LAPORAN TRANSAKSI</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Filter: {activeFilter} | Kategori: {selectedCategories.length === 0 ? 'Semua' : selectedCategories.join(', ')} | Dompet: {selectedWallet}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase">Tanggal Cetak</p>
              <p className="font-bold">{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
              <p className="text-[10px] font-bold text-green-600 uppercase">Total Pemasukan</p>
              <p className="text-xl font-black text-green-700">Rp{totals.income.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <p className="text-[10px] font-bold text-red-600 uppercase">Total Pengeluaran</p>
              <p className="text-xl font-black text-red-700">Rp{totals.expense.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Selisih Kas</p>
              <p className="text-xl font-black text-blue-700">Rp{(totals.income - totals.expense).toLocaleString('id-ID')}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-neutral-dark/10">
              <tr>
                <th className="py-2 px-3 text-left font-bold uppercase text-[10px]">Tanggal</th>
                <th className="py-2 px-3 text-left font-bold uppercase text-[10px]">Transaksi</th>
                <th className="py-2 px-3 text-left font-bold uppercase text-[10px]">Kategori</th>
                <th className="py-2 px-3 text-right font-bold uppercase text-[10px]">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t, idx) => (
                <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral/30'}>
                  <td className="py-2 px-3">{t.date.toLocaleDateString('id-ID')}</td>
                  <td className="py-2 px-3 font-bold">{t.title}</td>
                  <td className="py-2 px-3 text-xs">{t.category}</td>
                  <td className={`py-2 px-3 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'} Rp{t.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-auto pt-10 text-center border-t border-neutral-dark/30">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Dicetak via NEXUS Finance App - Rekapan Log</p>
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );
}

function FilterSelect({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  options 
}: { 
  label: string, 
  icon: any, 
  value: string, 
  onChange: (val: string) => void,
  options: (string | { label: string, value: string })[]
}) {
  const selectedLabel = useMemo(() => {
    if (value === "Semua") return label;
    const opt = options.find(o => typeof o === 'string' ? o === value : o.value === value);
    if (!opt) return label;
    return typeof opt === 'string' ? opt : opt.label;
  }, [value, options, label]);

  return (
    <div className="relative group overflow-hidden">
      <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-full border border-neutral-dark shadow-xs whitespace-nowrap text-xs font-bold text-gray-500 group-hover:bg-neutral transition-all">
        <Icon size={14} className="text-gray-300" />
        <span className="max-w-[100px] overflow-hidden text-ellipsis">
          {selectedLabel}
        </span>
        <ChevronDown size={14} className="text-gray-300 ml-1" />
      </div>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {options.map((opt, i) => {
          const isString = typeof opt === 'string';
          return (
            <option key={i} value={isString ? opt : opt.value}>
              {isString ? opt : opt.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
