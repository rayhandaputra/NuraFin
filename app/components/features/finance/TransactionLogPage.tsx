import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Search, 
  ChevronDown, 
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  Tag
} from "lucide-react";
import { useFinanceData } from "../../../hooks/useFinance";

export function TransactionLogPage({ onClose }: { onClose: () => void }) {
  const [activeFilter, setActiveFilter] = useState<'Hari' | 'Minggu' | 'Bulan' | 'Tahun' | 'Semua'>('Semua');
  const { transactions, loading, categories, wallets } = useFinanceData(activeFilter);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedWallet, setSelectedWallet] = useState<string>("Semua");

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                         t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || t.category === selectedCategory;
    const matchesWallet = selectedWallet === "Semua" || t.walletId === selectedWallet;
    
    return matchesSearch && matchesCategory && matchesWallet;
  });

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.y > 150) onClose();
      }}
      className="fixed inset-0 z-[60] bg-neutral flex flex-col overflow-y-auto"
    >
      {/* Drag Handle */}
      <div className="w-full flex justify-center pt-2 pb-1 sticky top-0 bg-neutral/80 backdrop-blur-md z-[20]">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <header className="p-6 pt-2 flex items-center justify-between sticky top-[22px] bg-neutral/80 backdrop-blur-md z-10">
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

          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <FilterSelect 
              label="Kategori" 
              icon={Tag} 
              value={selectedCategory} 
              onChange={setSelectedCategory}
              options={["Semua", ...new Set(categories.map(c => c.name))]} 
            />
            <FilterSelect 
              label="Dompet" 
              icon={Wallet} 
              value={selectedWallet} 
              onChange={setSelectedWallet}
              options={[
                { label: "Semua", value: "Semua" },
                ...wallets.map(w => ({ label: w.name, value: w.id }))
              ]} 
            />
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
                <div className="text-right">
                  <p className={`font-black ${tx.type === 'income' ? 'text-secondary' : 'text-accent'}`}>
                    {tx.type === 'income' ? '+' : '-'}Rp{tx.amount.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))
          )}
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
  return (
    <div className="relative group">
      <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-full border border-neutral-dark shadow-xs whitespace-nowrap text-xs font-bold text-gray-500 group-hover:bg-neutral transition-all">
        <Icon size={14} className="text-gray-300" />
        <span className="max-w-[80px] overflow-hidden text-ellipsis">
          {typeof options[0] === 'string' ? value : (options.find(o => (o as any).value === value) as any)?.label || label}
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
            <option key={i} value={isString ? opt : (opt as any).value}>
              {isString ? opt : (opt as any).label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
