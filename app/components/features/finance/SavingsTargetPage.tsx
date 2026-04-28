import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  MoreVertical, 
  TrendingUp,
  Target,
  PiggyBank,
  Edit,
  Trash2,
  X,
  Palette
} from "lucide-react";
import { useFinanceData, SavingsTarget } from "../../../hooks/useFinance";
import { auth } from "../../../nexus/firebase";
import { FinanceService } from "../../../services/financeService";
import { toast } from "sonner";

export function SavingsTargetPage({ onClose }: { onClose: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const { savingsTargets, loading } = useFinanceData();

  const totalTarget = savingsTargets.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const totalCurrent = savingsTargets.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const progressPercent = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

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
                <h2 className="text-xl font-bold text-[#1e293b]">Target Tabungan</h2>
            </div>
            <button className="p-2">
                <MoreVertical size={24} className="text-gray-600" />
            </button>
        </header>

        <div className="p-6 flex flex-col gap-8 pb-12">
            {/* Summary card */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-dark flex flex-col gap-4">
                <p className="text-sm font-bold text-gray-400">Total Target</p>
                <h3 className="text-4xl font-black text-[#1e293b]">Rp{totalTarget.toLocaleString('id-ID')}</h3>
                <div className="flex items-center gap-2 text-green-500 font-bold text-xs bg-green-50 self-start px-3 py-1.5 rounded-full">
                    <TrendingUp size={14} />
                    <span>+{progressPercent.toFixed(1)}% bulan ini</span>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <h4 className="text-xl font-black text-[#1e293b]">Kantong Keuangan</h4>
                
                {savingsTargets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-300">
                        <PiggyBank size={80} strokeWidth={1.5} />
                        <p className="text-sm font-bold">Belum ada target tabungan</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {savingsTargets.map(target => (
                            <div key={target.id} className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 ${target.color || 'bg-primary'} bg-opacity-10 rounded-2xl flex items-center justify-center ${target.color?.replace('bg-', 'text-') || 'text-primary'}`}>
                                            <Target size={24} />
                                        </div>
                                        <div>
                                            <h5 className="font-black text-[#1e293b]">{target.name}</h5>
                                            <p className="text-xs font-bold text-gray-400">Target: Rp{target.targetAmount.toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-accent">Rp{target.currentAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-neutral-dark rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${target.color || 'bg-primary'} rounded-full`}
                                        style={{ width: `${Math.min((target.currentAmount / target.targetAmount) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <button 
            onClick={() => setShowAdd(true)}
            className="fixed right-6 bottom-10 w-16 h-16 bg-[#1e293b] text-white rounded-2xl shadow-xl flex items-center justify-center z-20 active:scale-95 transition-all"
        >
            <Plus size={32} />
        </button>

        <AnimatePresence>
            {showAdd && <AddSavingsForm onClose={() => setShowAdd(false)} />}
        </AnimatePresence>
    </motion.div>
  );
}

function AddSavingsForm({ onClose }: { onClose: () => void }) {
    const { profile } = useFinanceData();
    const [name, setName] = useState("");
    const [target, setTarget] = useState("");
    const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !name || !target || !profile) return;
    setLoading(true);
    try {
        await FinanceService.addData(user.uid, profile.linkedUserId || null, 'savings_targets', {
            name,
            targetAmount: Number(target),
            currentAmount: 0,
            deadline: null,
            color: "bg-primary",
            icon: "Target"
        });
        toast.success("Target tabungan berhasil dibuat");
        onClose();
    } catch (error: any) {
        toast.error(`Gagal: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

    return (
        <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-0 z-[80] bg-white flex flex-col p-8"
        >
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-[#1e293b]">Target Baru</h3>
                <button onClick={onClose} className="p-2 bg-neutral rounded-full text-gray-500">
                    <X size={20} />
                </button>
            </div>

            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Nama Target</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Rumah Baru, Dana Darurat"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#f8f9fa] border-2 border-neutral-dark rounded-[24px] px-6 py-4 font-bold text-[#1e293b] outline-none focus:border-primary transition-all"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Jumlah Target (Rp)</label>
                    <input 
                        type="number" 
                        placeholder="0"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full bg-[#f8f9fa] border-2 border-neutral-dark rounded-[24px] px-6 py-4 font-bold text-[#1e293b] outline-none focus:border-primary transition-all"
                    />
                </div>

                <div className="p-6 bg-blue-50 rounded-[32px] flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                        <Palette size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-blue-900">Kustomisasi</p>
                        <p className="text-xs text-blue-700">Pilih warna dan ikon kantongmu</p>
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={loading || !name || !target}
                    className="mt-4 bg-[#1e293b] text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-[#1e293b]/10 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? "Menyimpan..." : "Buat Target Sekarang"}
                </button>
            </div>
        </motion.div>
    );
}
