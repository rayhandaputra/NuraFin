import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  MoreVertical, 
  Plus, 
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Clock
} from "lucide-react";
import { useFinanceData } from "../../../hooks/useFinance";
import { auth } from "../../../nexus/firebase";
import { NewDebtForm } from "./NewDebtForm";

interface Debt {
  id: string;
  personName: string;
  amount: number;
  paidAmount?: number;
  type: 'debt' | 'receivable';
  dueDate?: any;
  borrowDate: any;
  status: 'active' | 'paid';
  notes?: string;
}

export function DebtPage({ onClose }: { onClose: () => void }) {
  const { debts, loading, profile } = useFinanceData();
  const [activeTab, setActiveTab] = useState<'debt' | 'receivable'>('debt');
  const [showAddForm, setShowAddForm] = useState(false);

  const totalDebt = debts.filter((d: Debt) => d.type === 'debt' && d.status === 'active').reduce((sum: number, d: Debt) => sum + (d.amount || 0), 0);
  const totalReceivable = debts.filter((d: Debt) => d.type === 'receivable' && d.status === 'active').reduce((sum: number, d: Debt) => sum + (d.amount || 0), 0);
  const netBalance = totalReceivable - totalDebt;

  const filteredDebts = debts.filter((d: Debt) => d.type === activeTab);

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-0 z-[60] bg-neutral overflow-y-auto"
    >
      <header className="p-6 flex items-center justify-between sticky top-0 bg-neutral/80 backdrop-blur-md z-10">
        <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-black text-primary">Hutang Piutang</h2>
        <button className="p-2">
          <MoreVertical size={24} className="text-gray-600" />
        </button>
      </header>

      <main className="px-6 pb-32 flex flex-col gap-8">
        {/* Summary Card */}
        <section className="bg-primary rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 blur-3xl"></div>
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Saldo Bersih</p>
              <h2 className={`text-4xl font-black tracking-tighter ${netBalance < 0 ? 'text-red-200' : 'text-white'}`}>
                {netBalance < 0 ? '-' : ''}Rp{Math.abs(netBalance).toLocaleString('id-ID')}
              </h2>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 bg-white/10 p-4 rounded-3xl">
                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Hutang Saya</p>
                <p className="font-bold">Rp{totalDebt.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex-1 bg-white/10 p-4 rounded-3xl">
                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Piutang Saya</p>
                <p className="font-bold">Rp{totalReceivable.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 right-6 p-3 bg-white/10 rounded-2xl">
            <Wallet size={24} />
          </div>
        </section>

        {/* Tabs */}
        <div className="bg-white p-1 rounded-[24px] flex shadow-sm border border-neutral-dark">
          <button 
            onClick={() => setActiveTab('debt')}
            className={`flex-1 py-4 font-bold rounded-[22px] transition-all ${activeTab === 'debt' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400'}`}
          >
            Hutang Saya
          </button>
          <button 
            onClick={() => setActiveTab('receivable')}
            className={`flex-1 py-4 font-bold rounded-[22px] transition-all ${activeTab === 'receivable' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400'}`}
          >
            Piutang Saya
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center p-10">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="bg-white rounded-[40px] p-12 border-2 border-dashed border-neutral-dark flex flex-col items-center gap-4 text-center">
               <div className="w-20 h-20 bg-neutral-dark rounded-full flex items-center justify-center">
                 <Clock size={40} className="text-gray-300" />
               </div>
               <div>
                  <p className="font-black text-primary">Belum ada {activeTab === 'debt' ? 'hutang' : 'piutang'}</p>
                  <p className="text-xs text-gray-400 mt-1">Mulai catat transaksi pinjam meminjammu.</p>
               </div>
            </div>
          ) : (
            filteredDebts.map(debt => (
              <BudgetItem key={debt.id} debt={debt} />
            ))
          )}
        </div>
      </main>

      <button 
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-32 right-6 w-16 h-16 bg-primary text-white rounded-[24px] shadow-2xl flex items-center justify-center active:scale-90 transition-all z-20"
      >
        <Plus size={32} />
      </button>

      <AnimatePresence>
        {showAddForm && (
          <NewDebtForm onClose={() => setShowAddForm(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BudgetItem({ debt }: { debt: Debt }) {
  const isDebt = debt.type === 'debt';
  const paid = debt.paidAmount || 0;
  const progress = Math.min(Math.round((paid / debt.amount) * 100), 100);
  const remaining = Math.max(debt.amount - paid, 0);
  
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-neutral-dark flex flex-col gap-4 group active:bg-neutral transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDebt ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
            {isDebt ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div>
            <h4 className="font-black text-primary">{debt.personName}</h4>
            <div className="flex items-center gap-2 mt-1">
              {debt.dueDate && (
                <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                  <Clock size={10} /> {new Date(debt.dueDate.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </p>
              )}
              {debt.status === 'paid' && (
                <span className="text-[8px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">Lunas</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-primary">Rp{debt.amount.toLocaleString('id-ID')}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span>Progres Bayar</span>
          <span className="text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-neutral rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full rounded-full ${isDebt ? 'bg-red-400' : 'bg-green-400'}`}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Dibayar: Rp{paid.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-primary font-black">Sisa: Rp{remaining.toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  );
}
