import { useState, useMemo, useEffect } from "react";
import { type ClientLoaderFunctionArgs } from "react-router";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  getDoc,
  setDoc,
  Timestamp
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType, 
  loginWithGoogle 
} from "../nexus/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calculator, 
  Plus,
  LogIn,
  MoreVertical,
  ChevronRight,
  User as UserIcon
} from "lucide-react";
import { toast } from "sonner";

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  status: "Lunas" | "Belum dibayar";
  deadline: Timestamp;
}

interface UserProfile {
  monthlyIncome: number;
  displayName: string;
}

export default function FinanceDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  // Simulation State
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [tenor, setTenor] = useState<6 | 12>(12);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        fetchData(u.uid);
      }
    });
    return unsubscribe;
  }, []);

  const fetchData = async (uid: string) => {
    setLoading(true);
    const monthYear = "2026-04";
    const userDocRef = doc(db, "users", uid);
    const itemsColRef = collection(db, "users", uid, "monthly_budgets", monthYear, "items");

    try {
      // 1. Fetch User Profile
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        setProfile(userSnap.data() as UserProfile);
      } else {
        // Create default profile if not exists
        const defaultProfile: UserProfile = { monthlyIncome: 5000000, displayName: auth.currentUser?.displayName || "User" };
        await setDoc(userDocRef, defaultProfile);
        setProfile(defaultProfile);
      }

      // 2. Fetch Budget Items
      const itemsSnap = await getDocs(itemsColRef);
      const fetchedItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() } as BudgetItem));
      setItems(fetchedItems);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/monthly_budgets/${monthYear}/items`);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (item: BudgetItem) => {
    if (!user) return;
    const monthYear = "2026-04";
    const newStatus = item.status === "Lunas" ? "Belum dibayar" : "Lunas";
    const itemRef = doc(db, "users", user.uid, "monthly_budgets", monthYear, "items", item.id);

    // Optimistic Update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus as any } : i));

    try {
      await updateDoc(itemRef, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      // Rollback
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: item.status } : i));
      handleFirestoreError(error, OperationType.UPDATE, itemRef.path);
    }
  };

  // Calculations
  const stats = useMemo(() => {
    const income = profile?.monthlyIncome || 0;
    const expenses = items.reduce((acc, item) => acc + item.amount, 0);
    const nafas = income - expenses;
    const healthPercentage = income > 0 ? (expenses / income) * 100 : 0;
    
    return { income, expenses, nafas, healthPercentage };
  }, [profile, items]);

  const debtSimulation = useMemo(() => {
    const monthlyInstallment = loanAmount / tenor;
    const remainingNafas = stats.nafas - monthlyInstallment;
    const isSesak = remainingNafas < 0;
    
    return { monthlyInstallment, remainingNafas, isSesak };
  }, [loanAmount, tenor, stats.nafas]);

  const seedData = async () => {
    if (!user) return;
    const monthYear = "2026-04";
    const itemsColRef = collection(db, "users", user.uid, "monthly_budgets", monthYear, "items");
    
    const sampleItems = [
      { name: "Sewa Apartemen", amount: 2500000, category: "Housing", status: "Lunas", deadline: Timestamp.fromDate(new Date("2026-04-05")) },
      { name: "Listrik & Air", amount: 450000, category: "Utilities", status: "Belum dibayar", deadline: Timestamp.fromDate(new Date("2026-04-10")) },
      { name: "Internet (Wifi)", amount: 350000, category: "Utilities", status: "Belum dibayar", deadline: Timestamp.fromDate(new Date("2026-04-15")) },
      { name: "Cicilan Motor", amount: 1200000, category: "Debt", status: "Belum dibayar", deadline: Timestamp.fromDate(new Date("2026-04-20")) },
      { name: "Asuransi Kesehatan", amount: 300000, category: "Health", status: "Belum dibayar", deadline: Timestamp.fromDate(new Date("2026-04-25")) },
    ];

    try {
      setLoading(true);
      for (const item of sampleItems) {
        await setDoc(doc(itemsColRef), item);
      }
      toast.success("Sample data seeded successfully!");
      fetchData(user.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, itemsColRef.path);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center h-screen bg-neutral">Loading Auth...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-[30px] flex items-center justify-center">
            <LogIn size={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-black text-primary">Finance Sanctuary</h1>
          <p className="text-gray-500 text-sm italic font-serif">Sign in to manage your monthly budgets and test your financial breath.</p>
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-primary text-white py-4 rounded-[20px] font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            <UserIcon size={20} />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral flex flex-col font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="p-8 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50 border-b border-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} alt="Avatar" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Mizanly Profile</p>
            <h1 className="text-xl font-black text-primary">{user.displayName || "Financial Seeker"}</h1>
          </div>
        </div>
        <button onClick={() => fetchData(user.uid)} className="p-3 bg-white rounded-2xl shadow-sm border border-neutral-dark active:rotate-180 transition-transform duration-500">
          <Clock size={20} className="text-primary" />
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-8 max-w-5xl mx-auto w-full">
        {/* Top Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Income" 
            amount={stats.income} 
            icon={ArrowUpCircle} 
            color="bg-primary" 
            sub="Monthly Base Salary"
          />
          <StatCard 
            title="Total Expenses" 
            amount={stats.expenses} 
            icon={ArrowDownCircle} 
            color="bg-accent" 
            sub={`${items.length} Items this month`}
          />
          <StatCard 
            title="Nafas Nominal" 
            amount={stats.nafas} 
            icon={Wallet} 
            color={stats.nafas >= 0 ? "bg-secondary" : "bg-red-500"} 
            sub={stats.nafas >= 0 ? "Surplus remaining" : "Deficit Warning"}
          />
        </section>

        {/* Budget Health */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-white flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-primary">Budget Health</h3>
            {stats.healthPercentage > 80 && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-xs animate-pulse">
                <AlertTriangle size={14} /> Danger: Overspending
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm font-bold text-gray-500">
              <span>Income Spent</span>
              <span>{stats.healthPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-neutral rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stats.healthPercentage, 100)}%` }}
                className={`h-full ${stats.healthPercentage > 80 ? 'bg-red-500' : 'bg-primary'}`}
              />
            </div>
          </div>
        </section>

        {/* Main Budget Table */}
        <section className="bg-white rounded-[40px] shadow-sm border border-white overflow-hidden">
          <div className="p-8 border-b border-neutral flex justify-between items-center">
            <h3 className="font-black text-primary uppercase tracking-widest text-sm">Monthly Items (2026-04)</h3>
            <button className="p-2 bg-neutral rounded-xl text-primary"><Plus size={18} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral/30 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                  <th className="px-8 py-4">Item Name</th>
                  <th className="px-8 py-4">Category</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Deadline</th>
                  <th className="px-8 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-gray-300 italic font-serif">No budget items found for this month.</p>
                        <button 
                          onClick={seedData}
                          disabled={loading}
                          className="px-6 py-3 bg-primary/10 text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                        >
                          {loading ? "Seeding..." : "Seed Sample Data (2026-04)"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map(item => {
                    const isOverdue = item.deadline.toDate() < new Date() && item.status === "Belum dibayar";
                    return (
                      <tr 
                        key={item.id} 
                        className={`group hover:bg-neutral/20 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            {isOverdue && <AlertTriangle size={14} className="text-red-500 animate-bounce" />}
                            <span className={`font-bold text-sm ${isOverdue ? 'text-red-700' : 'text-primary'}`}>{item.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-bold uppercase bg-neutral-dark/40 px-3 py-1 rounded-full text-gray-600">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-black text-sm">
                          Rp {item.amount.toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-xs font-bold text-gray-400">
                          {item.deadline.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <button 
                            onClick={() => toggleStatus(item)}
                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mx-auto transition-all ${
                              item.status === "Lunas" 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700 hover:scale-105'
                            }`}
                          >
                            {item.status === "Lunas" ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-orange-700 rounded-full animate-pulse" />}
                            {item.status}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Debt Simulator Section */}
        <section className="bg-primary/5 rounded-[40px] p-8 border border-primary/10 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary rounded-[24px] text-white">
              <Calculator size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-primary">Debt Simulator (Nafas Test)</h3>
              <p className="text-xs text-gray-500 font-serif italic">Check if a new loan will suffocate your monthly finances.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Total Pinjaman (IDR)</label>
                <input 
                  type="number" 
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  placeholder="e.g. 5000000"
                  className="bg-white p-5 rounded-[24px] text-lg font-black text-primary border border-primary/10 transition-all focus:ring-4 focus:ring-primary/5"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Tenor (Bulan)</label>
                <div className="flex gap-4">
                  {[6, 12].map(t => (
                    <button 
                      key={t}
                      onClick={() => setTenor(t as 6 | 12)}
                      className={`flex-1 py-4 rounded-[20px] font-black text-sm transition-all ${tenor === t ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-neutral-dark'}`}
                    >
                      {t} Bulan
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`p-8 rounded-[32px] flex flex-col justify-between items-center text-center transition-all duration-500 ${debtSimulation.isSesak ? 'bg-red-100 text-red-900 shadow-xl shadow-red-200' : 'bg-green-100 text-green-900 shadow-xl shadow-green-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Monthly Installment</p>
                <h4 className="text-3xl font-black">Rp {debtSimulation.monthlyInstallment.toLocaleString()}</h4>
              </div>
              
              <div className="w-full h-px bg-current opacity-10 my-6"></div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">New Nafas Nominal</p>
                <h4 className={`text-4xl font-black ${debtSimulation.isSesak ? 'text-red-600' : 'text-green-600'}`}>
                  Rp {debtSimulation.remainingNafas.toLocaleString()}
                </h4>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {debtSimulation.isSesak ? (
                  <>
                    <div className="p-2 bg-red-600 rounded-full text-white animate-bounce"><AlertTriangle size={24} /></div>
                    <span className="text-xl font-black tracking-widest">SESAK!</span>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-green-600 rounded-full text-white animate-pulse"><CheckCircle2 size={24} /></div>
                    <span className="text-xl font-black tracking-widest">NAFAS</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, amount, icon: Icon, color, sub }: { title: string, amount: number, icon: any, color: string, sub: string }) {
  return (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-white flex flex-col gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className={`p-4 ${color} rounded-[24px] text-white shadow-lg`}>
          <Icon size={24} />
        </div>
        <MoreVertical size={20} className="text-gray-200" />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-primary tracking-tighter">Rp {amount.toLocaleString()}</h3>
        <div className="flex items-center gap-1 mt-2 text-gray-400 group-hover:text-primary transition-colors">
          <p className="text-[10px] font-black italic font-serif">"{sub}"</p>
          <ChevronRight size={10} />
        </div>
      </div>
    </div>
  );
}
