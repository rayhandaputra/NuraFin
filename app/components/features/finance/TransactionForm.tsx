import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from "framer-motion";
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
  CreditCard,
  Trash2
} from 'lucide-react';
import { auth, db } from '../../../nexus/firebase';
import { FinanceService } from '../../../services/financeService';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { increment } from 'firebase/firestore';
import { useFinanceData, Category, Bundle, Transaction } from '../../../hooks/useFinance';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface TransactionFormProps {
  onClose: () => void;
  initialData?: Partial<Transaction>;
  relatedBundle?: Bundle;
}

export function TransactionForm({ onClose, initialData, relatedBundle }: TransactionFormProps) {
  const dragControls = useDragControls();
  const { categories, wallets, loading: categoriesLoading, profile } = useFinanceData();
  
  const isEditing = !!initialData?.id;
  
  const [type, setType] = useState<'pemasukan' | 'pengeluaran'>(initialData?.type === 'income' ? 'pemasukan' : 'pengeluaran');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '0');
  const [title, setTitle] = useState(initialData?.title || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(initialData?.subCategory || "");
  const [selectedWalletId, setSelectedWalletId] = useState<string>(initialData?.walletId || "");
  
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubCategoryPicker, setShowSubCategoryPicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionDate, setTransactionDate] = useState<Date>(
    initialData?.date 
      ? new Date(initialData.date) 
      : new Date()
  );

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
      if (isEditing && initialData?.category) {
        const found = filteredCategories.find(c => c.name === initialData.category);
        if (found) {
          setSelectedCategory(found);
          return;
        }
      }
      setSelectedCategory(filteredCategories[0]);
    }
  }, [filteredCategories, selectedCategory, isEditing, initialData]);

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
        date: new Date(transactionDate),
      };

      if (isEditing && initialData?.id) {
        await FinanceService.updateTransaction(userId, linkedUserId, initialData.id, initialData, transactionData);
        toast.success('Transaksi diperbarui');
      } else {
        await FinanceService.addData(userId, linkedUserId, 'transactions', transactionData);
        
        // Update Wallet Balance for New Transaction
        if (selectedWalletId) {
          const numericAmount = Number(amount);
          const wallet = wallets.find(w => w.id === selectedWalletId);
          
          if (wallet) {
            let incrementVal = type === 'pemasukan' ? numericAmount : -numericAmount;
            if (wallet.type === 'credit') {
              incrementVal = -incrementVal; // Credit cards increase balance (debt) on expense
            }
            
            await FinanceService.updateData(userId, linkedUserId, 'wallets', selectedWalletId, {
              balance: increment(incrementVal)
            });

            // Auto-debt creation for credit wallets
            if (wallet.type === 'credit' && type === 'pengeluaran') {
              const debtData = {
                personName: wallet.name,
                amount: numericAmount,
                type: 'debt',
                borrowDate: new Date(transactionDate),
                status: 'active',
                notes: `Otomatis dari penggunaan ${wallet.name}: ${title.trim()}`,
                sourceTransactionId: null
              };
              await FinanceService.addData(userId, linkedUserId, 'debts', debtData);
              toast.info('Tercatat sebagai hutang baru (Credit Limit)');
            }
          }
        }

        toast.success('Transaksi berhasil disimpan');
      }
      
      // Update Bundle if related
      if (relatedBundle) {
        await FinanceService.updateData(userId, linkedUserId, 'bundles', relatedBundle.id, {
          status: 'paid'
        });
      }

      onClose();
    } catch (error: any) {
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !initialData?.id || !profile) return;
    
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
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      setLoading(true);
      try {
        await FinanceService.deleteTransaction(userId, profile.linkedUserId || null, initialData);
        toast.success('Transaksi dihapus');
        onClose();
      } catch (error: any) {
        toast.error(`Gagal menghapus: ${error.message}`);
      } finally {
        setLoading(false);
      }
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
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.y > 150) onClose();
      }}
      className="fixed inset-0 z-[60] bg-white flex flex-col"
    >
      {/* Drag Handle */}
      <div className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
        <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Top Header */}
        <div className="p-6 pt-2 flex items-center justify-between">
          <div className="flex bg-neutral-dark rounded-[24px] p-1 w-fit">
            <button 
              onClick={() => {
                setType('pengeluaran');
                setSelectedCategory(null);
              }}
              className={`px-6 py-2.5 rounded-[20px] text-[13px] font-bold transition-all ${type === 'pengeluaran' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-gray-500'}`}
            >
              Pengeluaran
            </button>
            <button 
              onClick={() => {
                setType('pemasukan');
                setSelectedCategory(null);
              }}
              className={`px-6 py-2.5 rounded-[20px] text-[13px] font-bold transition-all ${type === 'pemasukan' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-gray-500'}`}
            >
              Pemasukan
            </button>
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <button 
                onClick={handleDelete}
                className="p-3 bg-red-50 rounded-2xl flex items-center justify-center shadow-sm border border-red-100"
              >
                <Trash2 size={18} className="text-red-500" />
              </button>
            )}
            <button className="p-3 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-neutral-dark">
              <Camera size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Hero Category Selection */}
        <div className="px-6 py-2 flex flex-col items-center gap-2">
          {categoriesLoading ? (
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat kategori...</div>
          ) : (
              <div className="flex items-center gap-2">
                  {selectedCategory && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${selectedCategory.color} bg-opacity-10 ${selectedCategory.color.replace('bg-', 'text-')}`}>
                          <CategoryIcon size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-tight">{selectedCategory.name}</span>
                      </div>
                  )}
                  {selectedSubCategory && (
                      <div className="bg-neutral-dark px-3 py-1.5 rounded-full text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                          {selectedSubCategory}
                      </div>
                  )}
              </div>
          )}
          
          <div className="flex flex-col items-center gap-1">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-[#94a3b8]">JUMLAH</div>
            <div className="flex items-center gap-3">
              <div className="bg-neutral-dark px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold text-[#64748b]">
                Rp <ChevronDown size={12} />
              </div>
              <div className="text-4xl sm:text-5xl font-black text-[#1e293b] tracking-tighter">
                {Number(amount).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="px-6 flex flex-col gap-3 mt-4 pb-6">
          <div className="bg-white border-2 border-neutral-dark rounded-[20px] p-3.5 flex items-center gap-4 shadow-sm focus-within:border-primary transition-colors">
            <FileText size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Judul" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-bold text-[#1e293b] placeholder:text-gray-300 text-sm"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button 
                  onClick={() => setShowCategoryPicker(true)}
                  className="flex-1 bg-white border-2 border-neutral-dark rounded-[20px] px-4 py-3.5 flex items-center justify-between shadow-sm font-bold text-[#1e293b] active:border-primary overflow-hidden"
              >
                  <div className="flex items-center gap-2.5 truncate">
                      <CategoryIcon size={18} className="text-gray-400" />
                      <span className="truncate text-sm">{selectedCategory?.name || 'Kategori'}</span>
                  </div>
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
              </button>

              <button 
                  onClick={() => setShowWalletPicker(true)}
                  className="flex-1 bg-white border-2 border-neutral-dark rounded-[20px] px-4 py-3.5 flex items-center justify-between shadow-sm font-bold text-[#1e293b] active:border-primary overflow-hidden"
              >
                  <div className="flex items-center gap-2.5 truncate">
                      <WalletIcon size={18} className="text-gray-400" />
                      <span className="truncate text-sm">{selectedWallet?.name || 'Dompet'}</span>
                  </div>
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
              </button>
            </div>

            <div className="flex gap-3 text-xs">
              <button 
                  onClick={() => {
                      if (selectedCategory && selectedCategory.subCategories?.length > 0) {
                          setShowSubCategoryPicker(true);
                      } else {
                          toast.error('Pilih kategori dengan sub-kategori terlebih dahulu');
                      }
                  }}
                  className={`flex-1 bg-white border-2 border-neutral-dark rounded-[20px] px-4 py-3.5 flex items-center justify-between shadow-sm font-bold text-[#1e293b] active:border-primary ${(!selectedCategory || !selectedCategory.subCategories?.length) ? 'opacity-50' : ''}`}
              >
                  <div className="flex items-center gap-2.5 truncate">
                      <LayoutGrid size={18} className="text-gray-400" />
                      <span className="truncate">{selectedSubCategory || 'Sub'}</span>
                  </div>
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
              </button>

              <div className="flex-1 bg-white border-2 border-neutral-dark rounded-[20px] p-3.5 flex items-center gap-3 shadow-sm focus-within:border-primary transition-colors">
                <Edit3 size={18} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Catatan..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none font-bold text-[#1e293b] placeholder:text-gray-300 text-[13px]"
                />
              </div>
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
        <div className="bg-white rounded-[24px] flex flex-col items-center justify-center shadow-sm border border-neutral-dark leading-none w-full h-full active:bg-neutral transition-colors cursor-pointer relative overflow-visible group">
          <DatePicker
            selected={transactionDate}
            onChange={(date) => date && setTransactionDate(date)}
            dateFormat="dd MMM yyyy"
            customInput={
              <button 
                type="button"
                className="w-full h-full flex flex-col items-center justify-center p-4 outline-none active:scale-95 transition-transform"
                onClick={() => {
                  console.log('Date picker clicked');
                  toast.info('Membuka kalender...');
                }}
              >
                <span className="text-[9px] font-black uppercase text-blue-600 mb-1 shrink-0">Pilih Tanggal</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Calendar size={12} className="text-[#1e293b]" />
                  <span className="text-[11px] font-black text-[#1e293b] whitespace-nowrap">
                    {transactionDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </button>
            }
            popperPlacement="top-end"
            portalId="root-portal"
          />
        </div>

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
