import { useState, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { 
  ChevronLeft, 
  MoreVertical, 
  Plus, 
  Utensils, 
  Home, 
  Bus, 
  ShoppingBag, 
  Film, 
  Activity,
  User,
  LayoutGrid
} from "lucide-react";
import { FinanceService } from "../../../services/financeService";
import { auth } from "../../../nexus/firebase";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useFinanceData } from "../../../hooks/useFinance";

interface Budget {
  id: string;
  limit: number;
  period: "Weekly" | "Monthly";
  categoryId: string;
  categoryName: string;
  spent: number;
  subCategory?: string | null;
}

export function BudgetPage({ onClose }: { onClose: () => void }) {
  const dragControls = useDragControls();
  const { transactions, categories, budgets: rawBudgets, loading, profile } = useFinanceData();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (loading) return;

    // Calculate spent for each budget
    const categorySpent: Record<string, number> = {};
    const subCategorySpent: Record<string, number> = {};

    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category;
      categorySpent[cat] = (categorySpent[cat] || 0) + t.amount;
      
      if (t.subCategory) {
        const subKey = `${cat}:${t.subCategory}`;
        subCategorySpent[subKey] = (subCategorySpent[subKey] || 0) + t.amount;
      }
    });

    setBudgets(rawBudgets.map(b => {
      let spent = 0;
      if (b.subCategory) {
        spent = subCategorySpent[`${b.categoryName}:${b.subCategory}`] || 0;
      } else {
        spent = categorySpent[b.categoryName] || 0;
      }

      return {
        ...b,
        spent
      } as Budget;
    }));
  }, [transactions, rawBudgets, loading]);

  const handleDeleteBudget = async (id: string) => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    const result = await Swal.fire({
      title: 'Hapus Anggaran?',
      text: "Data anggaran akan dihapus secara permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-[32px]' }
    });

    if (result.isConfirmed) {
      try {
        await FinanceService.deleteData(user.uid, profile.linkedUserId || null, 'budgets', id);
        toast.success("Anggaran dihapus");
      } catch (error: any) {
        toast.error(`Gagal: ${error.message}`);
      }
    }
  };

  const totalLimit = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const percentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.y > 150) onClose();
      }}
      className="fixed inset-0 z-[60] bg-neutral flex flex-col overflow-y-auto"
    >
      {/* Drag Handle */}
      <div className="w-full flex justify-center pt-2 pb-1 sticky top-0 bg-neutral/80 backdrop-blur-md z-[20] cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <header className="p-6 pt-2 flex items-center justify-between sticky top-[22px] bg-neutral/80 backdrop-blur-md z-10">
        <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-black text-primary">Anggaran</h2>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pb-32 flex flex-col gap-8">
        {/* Progress Card */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-dark">
          <div className="flex flex-col items-center gap-2 mb-6">
            <p className="text-sm font-bold text-gray-400 capitalize">Sisa Anggaran</p>
            <div className="flex items-center gap-3">
              <h3 className={`text-3xl font-black ${totalLimit - totalSpent < 0 ? 'text-accent' : 'text-primary'}`}>
                Rp{(totalLimit - totalSpent).toLocaleString('id-ID')}
              </h3>
              {percentage > 90 ? (
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Bahaya
                </span>
              ) : (
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Aman
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-gray-400">Bulan Ini</p>
          </div>

          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="40%" className="fill-transparent stroke-neutral-dark stroke-[15px]" />
              <circle 
                cx="50%" 
                cy="50%" 
                r="40%" 
                className="fill-transparent stroke-primary stroke-[15px] transition-all duration-1000" 
                strokeDashoffset={251 - (251 * Math.min(100, percentage)) / 100}
                strokeDasharray="251"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-primary">{percentage}%</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terpakai</span>
            </div>
          </div>

          <div className="mt-8 text-center">
             <p className="text-lg font-black text-primary">
               Rp{totalSpent.toLocaleString('id-ID')} <span className="text-gray-300 font-bold">/ Rp{totalLimit.toLocaleString('id-ID')}</span>
             </p>
          </div>
        </section>

        {/* Budget List */}
        <section className="flex flex-col gap-6">
          <h3 className="text-xl font-black text-primary">Anggaran Anda</h3>
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex justify-center p-10">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : budgets.length === 0 ? (
              <div className="bg-white rounded-[32px] p-10 border-2 border-dashed border-neutral-dark text-center">
                <p className="font-bold text-gray-400">Belum ada anggaran ditambahkan.</p>
              </div>
            ) : (
              budgets.map(budget => (
                <BudgetItem 
                  key={budget.id} 
                  budget={budget} 
                  onEdit={() => setEditingBudget(budget)}
                  onDelete={() => handleDeleteBudget(budget.id)}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <button 
        onClick={() => setShowAddBudget(true)}
        className="fixed bottom-32 right-6 w-16 h-16 bg-primary text-white rounded-[24px] shadow-2xl flex items-center justify-center active:scale-90 transition-all z-20"
      >
        <Plus size={32} />
      </button>

      <AnimatePresence>
        {(showAddBudget || editingBudget) && (
          <NewBudgetForm 
            editData={editingBudget || undefined}
            onClose={() => {
              setShowAddBudget(false);
              setEditingBudget(null);
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BudgetItem({ budget, onEdit, onDelete }: { budget: any, onEdit: () => void, onDelete: () => void }) {
  const { categories } = useFinanceData();
  const percentage = Math.min(100, Math.round((budget.spent / budget.limit) * 100));
  const [showMenu, setShowMenu] = useState(false);
  
  const category = categories.find(c => c.id === budget.categoryId || c.name === budget.categoryName);

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Utensils': return <Utensils size={28} />;
      case 'Bus': return <Bus size={28} />;
      case 'ShoppingBag': return <ShoppingBag size={28} />;
      case 'Home': return <Home size={28} />;
      case 'Film': return <Film size={28} />;
      case 'Activity': return <Activity size={28} />;
      case 'User': return <User size={28} />;
      case 'LayoutGrid': return <LayoutGrid size={28} />;
      default: return <span className="text-3xl">{iconName || '📦'}</span>;
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-neutral-dark flex flex-col gap-6 relative group overflow-hidden transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 rounded-[22px] flex items-center justify-center text-primary relative overflow-hidden shadow-sm" style={{ backgroundColor: category?.color || '#f1f5f9' }}>
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
            <div className="relative z-10">
                {getIcon(category?.icon || '📦')}
            </div>
          </div>
          <div className="ml-2">
            <h4 className="font-black text-primary text-base leading-tight">{budget.categoryName}</h4>
            {budget.subCategory ? (
              <span className="text-[10px] font-bold text-gray-400 bg-neutral/50 px-2 py-0.5 rounded-lg uppercase mt-1 inline-block">
                {budget.subCategory}
              </span>
            ) : (
                <span className="text-[10px] font-bold text-gray-300 uppercase mt-1 inline-block">Semua Sub</span>
            )}
            <div className="w-40 h-1.5 bg-neutral rounded-full mt-3 overflow-hidden">
               <div 
                 className={`h-full ${percentage > 90 ? 'bg-accent shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_8px_rgba(26,54,93,0.3)]'} transition-all duration-1000 ease-out`}
                 style={{ width: `${percentage}%` }}
               />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{budget.period}</span>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 mt-1 hover:bg-neutral rounded-full transition-colors"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end">
          <p className="text-lg font-black text-primary">
            Rp{budget.spent.toLocaleString('id-ID')} <span className="text-gray-300 font-bold">/ Rp{budget.limit.toLocaleString('id-ID')}</span>
          </p>
        </div>
        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
          {budget.limit - budget.spent < 0 ? 'Over budget ' : ''}
          Rp{Math.abs(budget.limit - budget.spent).toLocaleString('id-ID')} {budget.limit - budget.spent < 0 ? 'Kelebihan' : 'Tersisa'}
        </p>
      </div>

      <AnimatePresence>
        {showMenu && (
          <>
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center gap-6">
               <button 
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="flex flex-col items-center gap-2 text-primary font-bold"
               >
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                   <Activity size={20} />
                 </div>
                 <span className="text-xs">Ubah</span>
               </button>
               <button 
                onClick={() => { onDelete(); setShowMenu(false); }}
                className="flex flex-col items-center gap-2 text-accent font-bold"
               >
                 <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                   <Plus size={20} className="rotate-45" />
                 </div>
                 <span className="text-xs">Hapus</span>
               </button>
               <button 
                onClick={() => setShowMenu(false)}
                className="absolute top-4 right-4 p-2"
               >
                 <Plus size={24} className="rotate-45 text-gray-400" />
               </button>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewBudgetForm({ onClose, editData }: { onClose: () => void, editData?: Budget }) {
  const { categories, profile } = useFinanceData();
  const [amount, setAmount] = useState(editData ? editData.limit.toString() : "");
  const [period, setPeriod] = useState<"Weekly" | "Monthly">(editData ? editData.period : "Monthly");
  const [selectedCategoryId, setSelectedCategoryId] = useState(editData ? editData.categoryId : "");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Utensils': return <Utensils size={28} />;
      case 'Bus': return <Bus size={28} />;
      case 'ShoppingBag': return <ShoppingBag size={28} />;
      case 'Home': return <Home size={28} />;
      case 'Film': return <Film size={28} />;
      case 'Activity': return <Activity size={28} />;
      case 'User': return <User size={28} />;
      case 'LayoutGrid': return <LayoutGrid size={28} />;
      default: return <span className="text-3xl">{iconName || '📦'}</span>;
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !amount || !selectedCategoryId || !profile) return;

    setLoading(true);
    try {
      const budgetData = {
        limit: Number(amount),
        period,
        categoryId: selectedCategoryId,
        categoryName: selectedCategory?.name || selectedCategoryId,
        subCategory: selectedSubCategory
      };

      if (editData) {
        await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'budgets', editData.id, budgetData);
        toast.success("Anggaran diperbarui");
      } else {
        await FinanceService.addData(user.uid, profile.linkedUserId || null, 'budgets', budgetData);
        toast.success("Anggaran ditambahkan");
      }
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
      className="fixed inset-0 z-[70] bg-[#f8f9fa] flex flex-col overflow-y-auto pb-10"
    >
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-neutral shadow-sm">
        <button onClick={onClose} className="p-2">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold">{editData ? 'Ubah Anggaran' : 'Anggaran Baru'}</h2>
        <button 
          onClick={handleSubmit}
          disabled={loading || !amount || !selectedCategoryId}
          className="text-primary font-bold disabled:opacity-30"
        >
          {loading ? '...' : 'Simpan'}
        </button>
      </header>

      <div className="p-6 md:p-8 flex flex-col gap-10">
        {/* Amount Input */}
        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Batas Jumlah</label>
          <div className="flex items-center gap-4">
             <div className="bg-white p-4 rounded-3xl flex items-center gap-2 shadow-sm border border-neutral-dark">
               <span className="font-bold text-primary">Rp</span>
             </div>
             <input 
               type="number" 
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder="0"
               className="text-5xl font-black text-primary outline-none bg-transparent w-full"
             />
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex flex-col gap-4">
           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Periode</label>
           <div className="flex bg-white p-1.5 rounded-[28px] shadow-sm border border-neutral-dark">
             <button 
              onClick={() => setPeriod("Weekly")}
              className={`flex-1 py-4 font-bold rounded-[22px] transition-all ${period === 'Weekly' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-gray-400'}`}
             >
               Mingguan
             </button>
             <button 
              onClick={() => setPeriod("Monthly")}
              className={`flex-1 py-4 font-bold rounded-[22px] transition-all ${period === 'Monthly' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-gray-400'}`}
             >
               Bulanan
             </button>
           </div>
        </div>

        {/* Categories Selection */}
        <div className="flex flex-col gap-6">
           <div className="flex justify-between items-center px-4">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pilih Kategori</label>
             <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">Kustom</span>
           </div>
           
           <div className="grid grid-cols-4 gap-4 px-2">
             {categories.map((cat: any) => {
               const isActive = selectedCategoryId === cat.id;
               return (
                 <button 
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setSelectedSubCategory(null);
                  }}
                  className="flex flex-col items-center gap-2 group relative"
                 >
                   <div 
                    className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all relative overflow-hidden ${isActive ? 'scale-110 shadow-xl ring-2 ring-primary ring-offset-2' : 'opacity-70 grayscale-[0.3]'}`} 
                    style={{ backgroundColor: cat.color || '#f1f5f9' }}
                   >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
                     <div className="relative z-10 transition-transform group-active:scale-95">
                        {getIcon(cat.icon)}
                     </div>
                     {isActive && (
                       <div className="absolute inset-0 border-2 border-primary/20 rounded-[24px] pointer-events-none" />
                     )}
                     
                     {/* Commitment Badge Overlay */}
                     {cat.commitmentType && cat.commitmentType !== 'regular' && (
                       <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm z-20">
                          {cat.commitmentType === 'debt' && <span className="text-[8px]">🛡️</span>}
                          {cat.commitmentType === 'fixed' && <span className="text-[8px]">⚡</span>}
                          {cat.commitmentType === 'savings' && <span className="text-[8px]">🎯</span>}
                       </div>
                     )}
                   </div>
                   <div className="flex flex-col items-center">
                     <span className={`text-[10px] font-black text-center leading-tight uppercase transition-colors ${isActive ? 'text-[#1e293b]' : 'text-gray-400'}`}>
                       {cat.name}
                     </span>
                     {cat.commitmentType && cat.commitmentType !== 'regular' && (
                       <span className="text-[8px] font-bold text-gray-300 mt-0.5 uppercase tracking-tighter">
                         {cat.commitmentType === 'debt' ? 'Hutang' : cat.commitmentType === 'fixed' ? 'Tagihan' : 'Tabung'}
                       </span>
                     )}
                   </div>
                 </button>
               );
             })}

             {categories.length === 0 && (
               <div className="col-span-4 py-8 text-center bg-white rounded-[32px] border border-dashed border-neutral-dark">
                 <p className="text-xs font-bold text-gray-400">Belum ada kategori kustom.</p>
               </div>
             )}
           </div>
        </div>

        {/* Sub-Categories */}
        {selectedCategory && selectedCategory.subCategories && selectedCategory.subCategories.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Sub-Kategori (Opsional)</label>
            <div className="flex flex-wrap gap-2 px-2">
              <button 
                onClick={() => setSelectedSubCategory(null)}
                className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all border ${!selectedSubCategory ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-neutral-dark hover:border-primary/30'}`}
              >
                Semua
              </button>
              {selectedCategory.subCategories.map((sub: string) => (
                <button 
                  key={sub}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all border ${selectedSubCategory === sub ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-neutral-dark hover:border-primary/30'}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
