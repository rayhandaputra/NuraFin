import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { 
  ChevronLeft, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  X,
  Building2,
  Smartphone,
  Wallet as WalletIcon
} from "lucide-react";
import { useFinanceData, Wallet, Transaction } from "../../../hooks/useFinance";
import { auth } from "../../../nexus/firebase";
import { FinanceService } from "../../../services/financeService";
import { toast } from "sonner";

interface WalletDetailPageProps {
  wallet: Wallet;
  onClose: () => void;
}

export function WalletDetailPage({ wallet, onClose }: WalletDetailPageProps) {
  const { transactions, profile } = useFinanceData('Semua');
  const [activePeriod, setActivePeriod] = useState<'Mingguan' | 'Bulanan'>('Bulanan');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(wallet.name);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(wallet.balance.toString());

  const walletTransactions = useMemo(() => {
    return transactions.filter(t => t.walletId === wallet.id);
  }, [transactions, wallet.id]);

  const stats = useMemo(() => {
    const inflow = walletTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const outflow = walletTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return {
      inflow,
      outflow,
      net: inflow - outflow,
      count: walletTransactions.length
    };
  }, [walletTransactions]);

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    const result = await Swal.fire({
      title: 'Hapus Dompet?',
      text: `Apakah Anda yakin ingin menghapus dompet "${wallet.name}"? Semua data transaksi yang terkait mungkin tidak akan terlihat di halaman ini.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#1e293b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-[32px] font-sans',
        title: 'font-black text-[#1e293b]',
        confirmButton: 'rounded-xl font-bold px-6 py-3',
        cancelButton: 'rounded-xl font-bold px-6 py-3'
      }
    });

    if (result.isConfirmed) {
      try {
        await FinanceService.deleteData(user.uid, profile.linkedUserId || null, 'wallets', wallet.id);
        onClose();
        Swal.fire({
          title: 'Berhasil!',
          text: 'Dompet telah dihapus.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-[32px] font-sans'
          }
        });
      } catch (error: any) {
        toast.error(`Gagal: ${error.message}`);
      }
    }
  };

  const handleUpdateBalance = async () => {
    const user = auth.currentUser;
    if (!user || isNaN(Number(newBalance)) || !profile) return;
    try {
      await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'wallets', wallet.id, {
        balance: Number(newBalance)
      });
      setIsUpdatingBalance(false);
      setShowMenu(false);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Saldo dompet telah diperbarui.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-[32px] font-sans'
        }
      });
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    }
  };

  const handleEditWallet = async () => {
    const user = auth.currentUser;
    if (!user || !editName || !profile) return;
    try {
      await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'wallets', wallet.id, {
        name: editName
      });
      setIsEditing(false);
      setShowMenu(false);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Nama dompet telah diubah.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-[32px] font-sans'
        }
      });
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    }
  };

  const getWalletIcon = (iconName: string) => {
    switch(iconName) {
      case 'Building2': return Building2;
      case 'Smartphone': return Smartphone;
      default: return WalletIcon;
    }
  };

  const Icon = getWalletIcon(wallet.icon);

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-0 z-[60] bg-[#f8f9fa] flex flex-col overflow-y-auto"
    >
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#f8f9fa]/90 backdrop-blur-md z-10">
        <button onClick={onClose} className="p-2">
            <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${wallet.color} bg-opacity-10 rounded-lg flex items-center justify-center ${wallet.color.replace('bg-', 'text-')}`}>
            <Icon size={16} />
          </div>
          <h2 className="text-xl font-bold text-[#1e293b]">{wallet.name}</h2>
        </div>
        <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2">
                <MoreVertical size={24} className="text-gray-600" />
            </button>
            <AnimatePresence>
                {showMenu && (
                    <>
                        <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-neutral-dark z-50 overflow-hidden"
                        >
                            <button 
                                onClick={() => { setIsUpdatingBalance(true); setShowMenu(false); }}
                                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-neutral transition-colors text-sm font-bold text-gray-700"
                            >
                                <RefreshCw size={18} />
                                Perbarui Saldo
                            </button>
                            <button 
                                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-neutral transition-colors text-sm font-bold text-gray-700 border-t border-neutral"
                            >
                                <Edit size={18} />
                                Ubah Dompet
                            </button>
                            <button onClick={handleDelete} className="w-full px-6 py-4 flex items-center gap-3 hover:bg-red-50 transition-colors text-sm font-bold text-accent border-t border-neutral">
                                <Trash2 size={18} />
                                Hapus
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
      </header>

      <div className="p-6 flex flex-col gap-8 pb-12">
        {/* Period Selector */}
        <div className="flex bg-[#f1f5f9] p-1.5 rounded-full border border-neutral-dark max-w-[200px] self-center">
            {['Mingguan', 'Bulanan'].map(p => (
                <button 
                   key={p}
                   onClick={() => setActivePeriod(p as any)}
                   className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activePeriod === p ? 'bg-white shadow-sm text-[#1e293b]' : 'text-gray-400'}`}
                >
                    {p}
                </button>
            ))}
        </div>

        {/* Big Balance */}
        <div className="flex flex-col items-center gap-4 py-4">
            <div className={`w-20 h-20 ${wallet.color} bg-opacity-10 rounded-[28px] flex items-center justify-center shadow-sm ${wallet.color.replace('bg-', 'text-')}`}>
                <Icon size={40} />
            </div>
            {wallet.type === 'credit' ? (
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tagihan Kredit Saat Ini</span>
                        <h3 className="text-5xl font-black text-accent tracking-tighter">Rp{wallet.balance.toLocaleString('id-ID')}</h3>
                    </div>
                    
                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-400">Limit Digunakan</span>
                            <span className="text-accent">{((wallet.balance / (wallet.limit || 1)) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-neutral-dark rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (wallet.balance / (wallet.limit || 1)) * 100)}%` }}
                                className={`h-full rounded-full ${wallet.balance > (wallet.limit || 0) * 0.8 ? 'bg-accent' : 'bg-primary'}`}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-400">TOTAL LIMIT: Rp{wallet.limit?.toLocaleString('id-ID')}</span>
                            <span className="text-primary">SISA: Rp{((wallet.limit || 0) - wallet.balance).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saldo Saat Ini</span>
                    <h3 className="text-5xl font-black text-[#1e293b]">Rp{wallet.balance.toLocaleString('id-ID')}</h3>
                </div>
            )}
        </div>

        {/* Monthly Summary */}
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-lg font-black text-[#1e293b]">Ringkasan Bulanan</h4>
                <span className="text-[10px] font-bold text-gray-400">1 Apr - 30 Apr</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <SummaryItem 
                    icon={<TrendingDown size={14} />} 
                    label="Arus Masuk" 
                    value={stats.inflow} 
                    color="text-green-500" 
                    bg="bg-green-50"
                />
                <SummaryItem 
                    icon={<TrendingUp size={14} />} 
                    label="Arus Keluar" 
                    value={stats.outflow} 
                    color="text-accent" 
                    bg="bg-red-50"
                />
                <SummaryItem 
                    icon={<RefreshCw size={14} />} 
                    label="Arus Bersih" 
                    value={stats.net} 
                    color={stats.net >= 0 ? "text-green-600" : "text-accent"} 
                    bg="bg-white"
                />
                <SummaryItem 
                    icon={<TrendingUp size={14} />} 
                    label="Jumlah Tx" 
                    value={stats.count} 
                    color="text-primary" 
                    bg="bg-white"
                    isCurrency={false}
                />
            </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3">
             <ActionButton icon={<ArrowUpRight />} label="Pengeluaran" color="bg-red-100 text-accent" />
             <ActionButton icon={<ArrowDownLeft />} label="Pemasukan" color="bg-green-100 text-green-600" />
             <ActionButton icon={<ArrowLeftRight />} label="Transfer" color="bg-blue-100 text-blue-600" />
        </div>

        {/* Recent Transactions */}
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-lg font-black text-[#1e293b]">Transaksi Terakhir</h4>
                <button className="text-xs font-bold text-gray-400">Lihat Semua</button>
            </div>

            <div className="flex flex-col gap-4">
                {walletTransactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="bg-white p-5 rounded-[28px] border border-neutral-dark shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 ${tx.type === 'income' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-accent'} rounded-2xl flex items-center justify-center`}>
                                {tx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                             </div>
                             <div>
                                <h5 className="font-bold text-[#1e293b]">{tx.title}</h5>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tx.category}</p>
                             </div>
                        </div>
                        <span className={`font-black ${tx.type === 'income' ? 'text-green-500' : 'text-accent'}`}>
                            {tx.type === 'income' ? '+' : '-'}Rp{tx.amount.toLocaleString('id-ID')}
                        </span>
                    </div>
                ))}
                {walletTransactions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-4 text-center opacity-40">
                         <TrendingUp size={48} />
                         <p className="text-sm font-bold">Belum ada transaksi</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Update Balance Modal */}
      <AnimatePresence>
        {isUpdatingBalance && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#1e293b]/40 backdrop-blur-sm"
               onClick={() => setIsUpdatingBalance(false)}
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white rounded-[40px] p-8 w-full max-w-sm relative z-10 shadow-2xl flex flex-col gap-6"
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-[#1e293b]">Perbarui Saldo</h3>
                    <button onClick={() => setIsUpdatingBalance(false)} className="p-2 bg-neutral rounded-full"><X size={18} /></button>
                </div>
                <div className="bg-[#f1f5f9] p-6 rounded-[28px]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Saldo Baru (Rp)</p>
                    <input 
                        type="number" 
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        className="bg-transparent text-2xl font-black outline-none w-full"
                    />
                </div>
                <button 
                    onClick={handleUpdateBalance}
                    className="bg-[#1e293b] text-white py-5 rounded-[24px] font-black text-lg"
                >
                    Update Sekarang
                </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Wallet Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#1e293b]/40 backdrop-blur-sm"
               onClick={() => setIsEditing(false)}
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white rounded-[40px] p-8 w-full max-w-sm relative z-10 shadow-2xl flex flex-col gap-6"
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-[#1e293b]">Ubah Dompet</h3>
                    <button onClick={() => setIsEditing(false)} className="p-2 bg-neutral rounded-full"><X size={18} /></button>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-[#f1f5f9] p-6 rounded-[28px]">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nama Dompet</p>
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-transparent text-xl font-black outline-none w-full"
                        />
                    </div>
                </div>
                <button 
                    onClick={handleEditWallet}
                    disabled={!editName}
                    className="bg-[#1e293b] text-white py-5 rounded-[24px] font-black text-lg disabled:opacity-50"
                >
                    Simpan Perubahan
                </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SummaryItem({ icon, label, value, color, bg, isCurrency = true }: any) {
    return (
        <div className={`${bg} border border-neutral-dark p-6 rounded-[32px] flex flex-col gap-3 shadow-sm`}>
            <div className={`flex items-center gap-2 ${color} font-bold text-[10px] uppercase tracking-widest`}>
                {icon}
                <span>{label}</span>
            </div>
            <p className={`text-lg font-black ${color}`}>
                {isCurrency ? `Rp${value.toLocaleString('id-ID')}` : value}
            </p>
        </div>
    );
}

function ActionButton({ icon, label, color }: any) {
    return (
        <button className="flex flex-col items-center gap-2">
            <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-all`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{label}</span>
        </button>
    );
}
