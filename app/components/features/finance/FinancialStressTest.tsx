import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Info,
  ArrowRight,
  Save,
  Loader2
} from "lucide-react";
import { useFinanceData } from "../../../hooks/useFinance";
import { auth, db } from "../../../nexus/firebase";
import { FinanceService } from "../../../services/financeService";
import { doc, getDoc } from "firebase/firestore";

interface SimulationResult {
  tenor: number;
  installment: number;
  remainingNafas: number;
  nafasPercentage: number;
  status: "Safe" | "Warning" | "Critical";
}

export function FinancialStressTest({ onClose }: { onClose: () => void }) {
  const { stats, profile } = useFinanceData();
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0); // Bunga per tahun (%)
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load last simulation
  useEffect(() => {
    const loadLastSim = async () => {
      const user = auth.currentUser;
      if (!user || !profile) {
        if (!user) setInitialLoading(false);
        return;
      }
      
      try {
        const ownerId = FinanceService.getDataPath(user.uid, profile.linkedUserId || null);
        const docRef = doc(db, 'users', ownerId, 'simulations', 'last_simulation');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLoanAmount(data.loanAmount || 0);
          setInterestRate(data.interestRate || 0);
        }
      } catch (error) {
        console.error("Error loading simulation:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadLastSim();
  }, [profile]);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    setSaving(true);
    try {
      await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'simulations', 'last_simulation', {
        loanAmount,
        interestRate
      });
    } catch (error) {
      console.error("Error saving simulation:", error);
    } finally {
      setSaving(false);
    }
  };

  // Data Dasar
  const monthlyIncome = stats.income || 5000000; // Fallback jika 0
  const monthlyExpenses = stats.expense || 0;
  const currentNafas = monthlyIncome - monthlyExpenses;

  const calculateSimulation = (tenorMonths: number): SimulationResult => {
    // Rumus cicilan: (Pokok + (Pokok * Bunga% * TenorTahun)) / TenorBulan
    const totalInterest = loanAmount * (interestRate / 100) * (tenorMonths / 12);
    const installment = (loanAmount + totalInterest) / tenorMonths;
    const remainingNafas = currentNafas - installment;
    const nafasPercentage = (remainingNafas / monthlyIncome) * 100;

    let status: SimulationResult["status"] = "Safe";
    if (remainingNafas < 0) status = "Critical";
    else if (nafasPercentage < 15) status = "Warning";

    return {
      tenor: tenorMonths,
      installment,
      remainingNafas,
      nafasPercentage,
      status
    };
  };

  const sim6 = useMemo(() => calculateSimulation(6), [loanAmount, interestRate, currentNafas]);
  const sim12 = useMemo(() => calculateSimulation(12), [loanAmount, interestRate, currentNafas]);

  const getRecommendation = () => {
    if (loanAmount === 0) return "Masukkan jumlah pinjaman untuk memulai simulasi.";
    if (sim6.status === "Safe") return "Tenor 6 bulan aman untuk Anda. Anda bisa melunasi lebih cepat dengan bunga total lebih rendah.";
    if (sim12.status === "Safe") return "Kami menyarankan tenor 12 bulan agar sisa nafas Anda tetap terjaga di zona hijau.";
    if (sim12.status === "Warning") return "Kondisi keuangan akan sangat ketat. Pertimbangkan untuk mengurangi jumlah pinjaman.";
    return "Peringatan: Pinjaman ini berisiko membuat arus kas Anda negatif. Sangat tidak disarankan.";
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-[60] bg-neutral flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={48} />
      </div>
    );
  }

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
        <h2 className="text-xl font-black text-primary">Health Hub</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="p-2 bg-white rounded-full shadow-sm text-primary active:scale-95 transition-all"
        >
          {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
        </button>
      </header>

      <main className="px-6 pb-32 flex flex-col gap-8">
        {/* Current State Card */}
        <section className="bg-white rounded-[32px] p-6 border border-neutral-dark shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-primary" size={20} />
            <h3 className="font-bold text-primary">Kondisi Saat Ini</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Pemasukan</p>
              <p className="font-black text-primary">Rp{monthlyIncome.toLocaleString('id-ID')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Sisa Nafas</p>
              <p className={`font-black ${currentNafas > 0 ? 'text-secondary' : 'text-accent'}`}>
                Rp{currentNafas.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="flex flex-col gap-6">
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Total Pinjaman Baru</label>
            <div className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-center gap-4">
              <span className="text-2xl font-black text-primary/30">Rp</span>
              <input 
                type="number" 
                value={loanAmount || ""}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                placeholder="0"
                className="flex-1 text-3xl font-black text-primary outline-none placeholder:text-gray-200"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Estimasi Bunga (%)</label>
            <input 
              type="range" 
              min="0" 
              max="30" 
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full h-2 bg-neutral-dark rounded-full appearance-none accent-primary cursor-pointer"
            />
            <div className="flex justify-between px-2">
              <span className="text-[10px] font-bold text-gray-400">{interestRate}% Bunga Tahunan</span>
              <span className="text-[10px] font-bold text-gray-400">Max 30%</span>
            </div>
          </div>
        </section>

        {/* Comparison Simulation */}
        <section className="flex flex-col gap-6">
          <h3 className="text-lg font-black text-primary">Simulasi Cicilan</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {[sim6, sim12].map((result) => (
              <div 
                key={result.tenor}
                className={`bg-white rounded-[32px] p-6 border-2 transition-all ${
                  result.status === 'Safe' ? 'border-green-100' : 
                  result.status === 'Warning' ? 'border-orange-100' : 'border-red-100'
                } shadow-sm`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-neutral text-[10px] font-black text-primary px-3 py-1 rounded-full border border-neutral-dark">
                    TENOR {result.tenor} BULAN
                  </span>
                  <StatusBadge status={result.status} />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Cicilan Bulanan</p>
                      <p className="text-xl font-black text-primary">Rp{Math.round(result.installment).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Nafas Baru</p>
                      <p className={`font-black ${result.status === 'Critical' ? 'text-accent' : 'text-primary'}`}>
                        Rp{Math.round(result.remainingNafas).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-neutral-dark rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        result.status === 'Safe' ? 'bg-secondary' : 
                        result.status === 'Warning' ? 'bg-orange-400' : 'bg-accent'
                      }`}
                      style={{ width: `${Math.max(5, Math.min(100, result.nafasPercentage))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendation Box */}
        <section className="bg-primary/5 border border-primary/10 rounded-[32px] p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl">
               <Info size={20} className="text-primary" />
             </div>
             <h4 className="font-black text-primary">Rekomendasi Mizanly</h4>
          </div>
          <p className="text-sm text-primary/70 leading-relaxed italic font-serif">
            {getRecommendation()}
          </p>
        </section>
      </main>

      {/* Floating Action Button for Help */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px]">
         <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-2 shadow-2xl flex items-center justify-between border border-white">
            <div className="flex items-center gap-3 ml-4">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <Activity size={16} className="text-secondary" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Financial Score: {Math.round(sim12.nafasPercentage > 0 ? sim12.nafasPercentage : 0)}%</span>
            </div>
            <button 
              onClick={onClose}
              className="bg-primary text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2"
            >
              Selesai <ArrowRight size={14} />
            </button>
         </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: SimulationResult["status"] }) {
  switch (status) {
    case "Safe":
      return (
        <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-green-100">
          <CheckCircle2 size={12} /> Masih Bisa Nafas
        </span>
      );
    case "Warning":
      return (
        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-orange-100">
          <AlertCircle size={12} /> Resiko Sesak
        </span>
      );
    case "Critical":
      return (
        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-red-100">
          <XCircle size={12} /> Gagal Nafas
        </span>
      );
  }
}
