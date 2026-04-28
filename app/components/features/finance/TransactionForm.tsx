import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Camera, 
  FileText, 
  Edit3, 
  ChevronDown, 
  Check,
  Calendar,
  ArrowLeft,
  Delete,
  ChevronLeft,
  LayoutGrid,
  Utensils,
  Bus,
  ShoppingBag,
  Home,
  Film,
  Activity,
  User,
  Wallet as WalletIcon,
  CreditCard
} from 'lucide-react';
import { auth } from '../../../nexus/firebase';
import { FinanceService } from '../../../services/financeService';
import { toast } from 'sonner';
import { useFinanceData, Category, Bundle } from '../../../hooks/useFinance';

interface TransactionFormProps {
  onClose: () => void;
  initialData?: {
    amount?: string;
    title?: string;
    notes?: string;
    walletId?: string;
  };
  relatedBundle?: Bundle;
}

export function TransactionForm({ onClose, initialData, relatedBundle }: TransactionFormProps) {
  const { categories, wallets, loading: categoriesLoading, profile } = useFinanceData();
  const [type, setType] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');
  const [amount, setAmount] = useState(initialData?.amount || '0');
  const [title, setTitle] = useState(initialData?.title || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedWalletId, setSelectedWalletId] = useState<string>(initialData?.walletId || "");
  
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubCategoryPicker, setShowSubCategoryPicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets, selectedWalletId]);

  const filteredCategories = useMemo(() => {
    const targetType = type === 'pemasukan' ? 'income' : 'expense';
    return categories.filter(c => c.type === targetType);
  }, [categories, type]);

  useEffect(() => {
    if (filteredCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(filteredCategories[0]);
    }
  }, [filteredCategories, selectedCategory]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleKeypadPress = (val: string) => {
    if (val === 'backspace') {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === '000') {
      setAmount(prev => prev === '0' ? '0' : prev + '000');
    } else {
      setAmount(prev => prev === '0' ? val : prev + val);
    }
  };

  const handleSave = async () => {
    if (amount === '0') {
      toast.error('Jumlah tidak boleh 0');
      return;
    }
    if (!title.trim()) {
      toast.error('Judul harus diisi');
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId || !profile) {
      toast.error('Anda harus masuk untuk menyimpan transaksi');
      return;
    }

    const linkedUserId = profile.linkedUserId || null;

    setLoading(true);
    try {
      const transactionData = {
        title: title.trim(),
        amount: Number(amount),
        category: selectedCategory?.name || 'Lainnya',
        categoryId: selectedCategory?.id || null,
        subCategory: selectedSubCategory || null,
        walletId: selectedWalletId || null,
        type: type === 'pemasukan' ? 'income' : 'expense',
        notes: notes.trim(),
        date: new Date(),
      };

      await FinanceService.addData(userId, linkedUserId, 'transactions', transactionData);
      
      // Update Bundle if related
      if (relatedBundle) {
        await FinanceService.updateData(userId, linkedUserId, 'bundles', relatedBundle.id, {
          status: 'paid'
        });
      }

      // Update Wallet Balance
      if (selectedWallet) {
        const currentBalance = Number(selectedWallet.balance) || 0;
        let newBalance = currentBalance;

        if (selectedWallet.type === 'credit') {
          // Untuk dompet kredit, balance = Terpakai
          // Pemasukan (bayar cicilan) mengurangi terpakai, Pengeluaran menambah terpakai
          newBalance = type === 'pemasukan' ? currentBalance - Number(amount) : currentBalance + Number(amount);
        } else {
          // Untuk dompet debit, balance = Saldo Rill
          // Pemasukan menambah saldo, Pengeluaran mengurangi saldo
          newBalance = type === 'pemasukan' ? currentBalance + Number(amount) : currentBalance - Number(amount);
        }

        await FinanceService.updateData(userId, linkedUserId, 'wallets', selectedWalletId, {
          balance: newBalance
        });
      }

      // Auto-debt creation for credit wallets
      if (selectedWallet?.type === 'credit' && type === 'pengeluaran') {
        const debtData = {
          personName: selectedWallet.name,
          amount: Number(amount),
          type: 'debt',
          borrowDate: new Date(),
          status: 'active',
          notes: `Otomatis dari penggunaan ${selectedWallet.name}: ${title.trim()}`,
          sourceTransactionId: null
        };
        await FinanceService.addData(userId, linkedUserId, 'debts', debtData);
        toast.info('Tercatat sebagai hutang baru (Credit Limit)');
      }

      toast.success('Transaksi berhasil disimpan');
      onClose();
    } catch (error: any) {
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Utensils': return Utensils;
      case 'Bus': return Bus;
      case 'ShoppingBag': return ShoppingBag;
      case 'Home': return Home;
      case 'Film': return Film;
      case 'Activity': return Activity;
      case 'User': return User;
      default: return LayoutGrid;
    }
  };

  const CategoryIcon = selectedCategory ? getIcon(selectedCategory.icon) : LayoutGrid;
  const selectedWallet = wallets.find(w => w.id === selectedWalletId);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.y > 150) onClose();
      }}
      className="fixed inset-0 z-[60] bg-white flex flex-col"
    >
      {/* Drag Handle */}
      <div className="w-full flex justify-center pt-2 pb-1">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
      </div>

      {/* Top Header */}
      <div className="p-6 pt-2 flex items-center justify-between">
        <div className="flex bg-neutral-dark rounded-[24px] p-1 w-fit">
          <button 
            onClick={() => {
              setType('pengeluaran');
              setSelectedCategory(null);
            }}
            className={`px-6 py-3 rounded-[20px] text-sm font-bold transition-all ${type === 'pengeluaran' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-gray-500'}`}
          >
            Pengeluaran
          </button>
          <button 
            onClick={() => {
              setType('pemasukan');
              setSelectedCategory(null);
            }}
            className={`px-6 py-3 rounded-[20px] text-sm font-bold transition-all ${type === 'pemasukan' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-gray-500'}`}
          >
            Pemasukan
          </button>
        </div>
        <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-neutral-dark">
          <Camera size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Hero Category Selection */}
      <div className="px-6 py-4 flex flex-col items-center gap-4">
        {categoriesLoading ? (
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat kategori...</div>
        ) : (
            <div className="flex items-center gap-2">
                {selectedCategory && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${selectedCategory.color} bg-opacity-10 ${selectedCategory.color.replace('bg-', 'text-')}`}>
                        <CategoryIcon size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{selectedCategory.name}</span>
                    </div>
                )}
                {selectedSubCategory && (
                    <div className="bg-neutral-dark px-4 py-2 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                        {selectedSubCategory}
                    </div>
                )}
            </div>
        )}
        
        <div className="flex flex-col items-center gap-2">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-[#94a3b8]">JUMLAH</div>
          <div className="flex items-center gap-4">
            <div className="bg-neutral-dark px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm font-bold text-[#64748b]">
              Rp <ChevronDown size={14} />
            </div>
            <div className="text-6xl font-black text-[#1e293b] tracking-tighter">
              {Number(amount).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex-1 px-6 flex flex-col gap-4 mt-8">
        <div className="bg-white border-2 border-neutral-dark rounded-[24px] p-4 flex items-center gap-4 shadow-sm focus-within:border-primary transition-colors">
          <FileText size={20} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Judul" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-bold text-[#1e293b] placeholder:text-gray-300"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-4">
            <button 
                onClick={() => setShowCategoryPicker(true)}
                className="flex-1 bg-white border-2 border-neutral-dark rounded-[24px] px-6 py-4 flex items-center justify-between shadow-sm font-bold text-[#1e293b] active:border-primary"
            >
                <div className="flex items-center gap-3">
                    <CategoryIcon size={20} className="text-gray-400" />
                    <span>{selectedCategory?.name || 'Pilih Kategori'}</span>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
            </button>

            <button 
                onClick={() => setShowWalletPicker(true)}
                className="flex-1 bg-white border-2 border-neutral-dark rounded-[24px] px-6 py-4 flex items-center justify-between shadow-sm font-bold text-[#1e293b] active:border-primary"
            >
                <div className="flex items-center gap-3 truncate">
                    <WalletIcon size={20} className="text-gray-400" />
                    <span className="truncate">{selectedWallet?.name || 'Pilih Dompet'}</span>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
            </button>
          </div>

          <div className="flex gap-4">
            <button 
                onClick={() => {
                    if (selectedCategory && selectedCategory.subCategories?.length > 0) {
                        setShowSubCategoryPicker(true);
                    } else {
                        toast.error('Pilih kategori dengan sub-kategori terlebih dahulu');
                    }
                }}
                className={`flex-1 bg-white border-2 border-neutral-dark rounded-[24px] px-6 py-4 flex items-center justify-between shadow-sm font-bold text-[#1e293b] active:border-primary ${(!selectedCategory || !selectedCategory.subCategories?.length) ? 'opacity-50' : ''}`}
            >
                <div className="flex items-center gap-3 truncate">
                    <LayoutGrid size={20} className="text-gray-400" />
                    <span className="truncate">{selectedSubCategory || 'Sub-Kategori'}</span>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
            </button>

            <div className="flex-1 bg-white border-2 border-neutral-dark rounded-[24px] p-4 flex items-center gap-4 shadow-sm focus-within:border-primary transition-colors">
              <Edit3 size={20} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Catatan..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none font-bold text-[#1e293b] placeholder:text-gray-300 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Picker Overlay */}
      <AnimatePresence>
        {showCategoryPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-[40px] shadow-2xl p-8 pb-12 overflow-y-auto max-h-[70vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-[#1e293b]">Pilih Kategori</h3>
              <button 
                onClick={() => setShowCategoryPicker(false)}
                className="p-2 bg-neutral-dark rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {filteredCategories.map((cat) => {
                const Icon = getIcon(cat.icon);
                return (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setSelectedCategory(cat);
                            setSelectedSubCategory("");
                            setShowCategoryPicker(false);
                            if (cat.subCategories?.length > 0) {
                                setShowSubCategoryPicker(true);
                            }
                        }}
                        className={`flex items-center gap-4 p-4 rounded-[24px] border-2 transition-all ${selectedCategory?.id === cat.id ? 'border-primary bg-primary/5' : 'border-neutral-dark'}`}
                    >
                        <div className={`w-10 h-10 ${cat.color} bg-opacity-10 rounded-xl flex items-center justify-center ${cat.color.replace('bg-', 'text-')}`}>
                            <Icon size={20} />
                        </div>
                        <span className="text-xs font-bold text-[#1e293b] uppercase">{cat.name}</span>
                    </button>
                );
              })}
              {filteredCategories.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-400 font-bold">
                    Belum ada kategori kustom.
                  </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-Category Picker Overlay */}
      <AnimatePresence>
        {showSubCategoryPicker && selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-[40px] shadow-2xl p-8 pb-12 overflow-y-auto max-h-[70vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowSubCategoryPicker(false); setShowCategoryPicker(true); }} className="p-2">
                    <ChevronLeft size={20} />
                </button>
                <h3 className="text-xl font-black text-[#1e293b]">Pilih Sub-Kategori</h3>
              </div>
              <button 
                onClick={() => setShowSubCategoryPicker(false)}
                className="p-2 bg-neutral-dark rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedCategory.subCategories?.map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedSubCategory(sub);
                    setShowSubCategoryPicker(false);
                  }}
                  className={`px-6 py-4 rounded-[20px] border-2 transition-all font-bold text-sm ${selectedSubCategory === sub ? 'border-primary bg-primary/5 text-primary' : 'border-neutral-dark text-[#1e293b]'}`}
                >
                  {sub}
                </button>
              ))}
              <button
                onClick={() => {
                    setSelectedSubCategory("");
                    setShowSubCategoryPicker(false);
                }}
                className={`px-6 py-4 rounded-[20px] border-2 border-dashed border-neutral-dark text-gray-400 font-bold text-sm`}
              >
                Tanpa Sub-Kategori
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keypad */}
      <div className="bg-[#f8fafc] p-4 grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <KeyButton label="1" onClick={() => handleKeypadPress('1')} />
        <KeyButton label="2" onClick={() => handleKeypadPress('2')} />
        <KeyButton label="3" onClick={() => handleKeypadPress('3')} />
        <button 
          onClick={() => handleKeypadPress('backspace')}
          className="bg-[#fee2e2] text-[#ef4444] rounded-[24px] flex items-center justify-center p-6 active:scale-95 transition-transform"
        >
          <Delete size={24} />
        </button>

        {/* Row 2 */}
        <KeyButton label="4" onClick={() => handleKeypadPress('4')} />
        <KeyButton label="5" onClick={() => handleKeypadPress('5')} />
        <KeyButton label="6" onClick={() => handleKeypadPress('6')} />
        <button className="bg-white text-gray-400 rounded-[24px] flex items-center justify-center p-6 shadow-sm border border-neutral-dark">
          <div className="grid grid-cols-2 gap-1 text-[10px] font-black">
            <span>+</span><span>-</span>
            <span>x</span><span>=</span>
          </div>
        </button>

        {/* Row 3 */}
        <KeyButton label="7" onClick={() => handleKeypadPress('7')} />
        <KeyButton label="8" onClick={() => handleKeypadPress('8')} />
        <KeyButton label="9" onClick={() => handleKeypadPress('9')} />
        <button className="bg-white text-gray-400 rounded-[24px] flex flex-col items-center justify-center p-4 shadow-sm border border-neutral-dark leading-none">
          <span className="text-[10px] font-black uppercase text-blue-400">
            {currentTime.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
          </span>
          <span className="text-[12px] font-black text-[#1e293b]">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        </button>

        {/* Row 4 */}
        <KeyButton label="." onClick={() => handleKeypadPress('.')} />
        <KeyButton label="0" onClick={() => handleKeypadPress('0')} />
        <KeyButton label="000" onClick={() => handleKeypadPress('000')} />
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-[#1e293b] text-white rounded-[24px] flex items-center justify-center p-6 active:scale-95 transition-transform shadow-lg shadow-[#1e293b]/20 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check size={28} />
          )}
        </button>
      </div>

      {/* Wallet Picker Overlay */}
      <AnimatePresence>
        {showWalletPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-[40px] shadow-2xl p-8 pb-12 overflow-y-auto max-h-[70vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-[#1e293b]">Pilih Dompet</h3>
              <button 
                onClick={() => setShowWalletPicker(false)}
                className="p-2 bg-neutral-dark rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {/* Debit Wallets */}
              {wallets.filter(w => w.type === 'debit' || !w.type).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Debit / Saldo Rill</h4>
                  {wallets.filter(w => w.type === 'debit' || !w.type).map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => {
                        setSelectedWalletId(wallet.id);
                        setShowWalletPicker(false);
                      }}
                      className={`flex items-center justify-between p-5 rounded-[28px] border-2 transition-all w-full ${selectedWalletId === wallet.id ? 'border-primary bg-primary/5' : 'border-neutral-dark'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${wallet.color} bg-opacity-10 rounded-xl flex items-center justify-center ${wallet.color.replace('bg-', 'text-')}`}>
                          <WalletIcon size={20} />
                        </div>
                        <span className="font-bold text-[#1e293b]">{wallet.name}</span>
                      </div>
                      <span className="text-xs font-black text-primary">Rp{wallet.balance.toLocaleString('id-ID')}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Credit Wallets */}
              {wallets.filter(w => w.type === 'credit').length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Limit Kredit / Paylater</h4>
                  {wallets.filter(w => w.type === 'credit').map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => {
                        setSelectedWalletId(wallet.id);
                        setShowWalletPicker(false);
                      }}
                      className={`flex items-center justify-between p-5 rounded-[28px] border-2 transition-all w-full ${selectedWalletId === wallet.id ? 'border-[#1e293b] bg-[#1e293b]/5' : 'border-neutral-dark'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 bg-[#1e293b]/10 rounded-xl flex items-center justify-center text-[#1e293b]`}>
                          <CreditCard size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-[#1e293b]">{wallet.name}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Limit: Rp{wallet.limit?.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-[#1e293b]">Rp{wallet.balance.toLocaleString('id-ID')}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Terpakai</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {wallets.length === 0 && (
                <div className="text-center py-10 text-gray-400 font-bold italic">
                  Belum ada dompet. Tambahkan di tab Dompet.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dismiss button for mobile accessibility */}
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm md:hidden"
      >
        <ArrowLeft size={20} className="text-[#1e293b]" />
      </button>
    </motion.div>
  );
}

function KeyButton({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white text-[#1e293b] text-2xl font-black rounded-[24px] p-6 shadow-sm border border-neutral-dark active:scale-95 transition-transform"
    >
      {label}
    </button>
  );
}
