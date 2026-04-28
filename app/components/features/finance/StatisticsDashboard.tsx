import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PieChart as PieIcon,
  BarChart3,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Info,
  TrendingUp,
  MoreVertical,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Clock,
  Briefcase,
  AlertCircle,
  ShoppingBag
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from "recharts";
import { useFinanceData, Transaction } from "../../../hooks/useFinance";

type StatsPeriod = 'Mingguan' | 'Bulanan' | 'Tahunan' | 'Rentang';
type ViewType = 'Pemasukan' | 'Pengeluaran';

export function StatisticsDashboard() {
  const [period, setPeriod] = useState<StatsPeriod>('Bulanan');
  const [viewType, setViewType] = useState<ViewType>('Pengeluaran');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const { 
      transactions, 
      categories, 
      wallets, 
      loading, 
      budgets, 
      debts, 
      bills, 
      recurringTransactions,
      savingsTargets,
      bundles,
      stats: financeStats
  } = useFinanceData('Semua');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (period === 'Bulanan') {
        return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
      }
      if (period === 'Tahunan') {
         return tDate.getFullYear() === currentDate.getFullYear();
      }
      return true;
    });
  }, [transactions, currentDate, period]);

  const [showCommitments, setShowCommitments] = useState(false);

  const commitmentStats = useMemo(() => {
    // 1. Pelunasan Hutang
    const totalDebt = debts.reduce((acc, d) => acc + d.amount, 0);
    const debtBudget = budgets
      .filter(b => {
        const cat = categories.find(c => c.id === b.categoryId || c.name === b.categoryName);
        return cat?.commitmentType === 'debt' || b.categoryName.toLowerCase().includes('hutang') || b.categoryName.toLowerCase().includes('debt');
      })
      .reduce((acc, b) => acc + b.limit, 0);
    
    // 2. Tagihan & Berulang
    const totalBills = bills.filter(b => b.status !== 'paid').reduce((acc, b) => acc + b.amount, 0);
    const totalRecurring = recurringTransactions.reduce((acc, r) => acc + r.amount, 0);
    const fixedBudget = budgets
      .filter(b => {
        const cat = categories.find(c => c.id === b.categoryId || c.name === b.categoryName);
        return cat?.commitmentType === 'fixed' || 
          b.categoryName.toLowerCase().includes('tagihan') || 
          b.categoryName.toLowerCase().includes('bill') || 
          b.categoryName.toLowerCase().includes('fixed');
      })
      .reduce((acc, b) => acc + b.limit, 0);

    // 3. Target Tabungan
    const totalSavingsGoal = savingsTargets.reduce((acc, s) => acc + (s.targetAmount - s.currentAmount), 0);
    const savingsBudget = budgets
      .filter(b => {
        const cat = categories.find(c => c.id === b.categoryId || c.name === b.categoryName);
        return cat?.commitmentType === 'savings' || 
          b.categoryName.toLowerCase().includes('tabungan') || 
          b.categoryName.toLowerCase().includes('simpanan') || 
          b.categoryName.toLowerCase().includes('investasi');
      })
      .reduce((acc, b) => acc + b.limit, 0);

    // 4. Catatan (Bundles)
    const unpaidBundlesTotal = bundles.filter(b => b.status === 'active').reduce((acc, b) => {
      return acc + b.items.reduce((sum, item) => sum + item.amount, 0);
    }, 0);
    const catatanBudget = budgets
      .filter(b => {
        const cat = categories.find(c => c.id === b.categoryId || c.name === b.categoryName);
        return cat?.commitmentType === 'catatan' || b.categoryName.toLowerCase().includes('catatan') || b.categoryName.toLowerCase().includes('bundle');
      })
      .reduce((acc, b) => acc + b.limit, 0);

    return [
        {
            id: 'debt',
            name: 'Pelunasan Hutang',
            icon: ShieldCheck,
            actual: totalDebt,
            budget: debtBudget,
            color: 'text-orange-500',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-100'
        },
        {
            id: 'fixed',
            name: 'Biaya Tetap (Tagihan)',
            icon: Zap,
            actual: totalBills + totalRecurring,
            budget: fixedBudget,
            color: 'text-purple-500',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-100'
        },
        {
            id: 'savings',
            name: 'Target Masa Depan',
            icon: Target,
            actual: totalSavingsGoal,
            budget: savingsBudget,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-100'
        },
        {
            id: 'catatan',
            name: 'Catatan Belanja',
            icon: ShoppingBag,
            actual: unpaidBundlesTotal,
            budget: catatanBudget,
            color: 'text-teal-500',
            bgColor: 'bg-teal-50',
            borderColor: 'border-teal-100'
        }
    ];
  }, [budgets, debts, bills, recurringTransactions, savingsTargets, bundles, categories]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    // Group by category for donut chart
    const categoryMap: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === viewType.toLowerCase().replace('pengeluaran', 'expense').replace('pemasukan', 'income')).forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    const categoryData = Object.entries(categoryMap).map(([name, value]) => {
      const catObj = categories.find(c => c.name === name);
      return {
        name,
        value,
        color: catObj?.color || '#cbd5e1'
      };
    }).sort((a, b) => b.value - a.value);

    // Daily summary for charts
    const dailyMap: Record<string, { income: number, expense: number }> = {};
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    let chartDays: string[] = [];
    if (period === 'Bulanan') {
      chartDays = Array.from({ length: daysInMonth }).map((_, i) => (i + 1).toString());
    } else {
      // Default to 7 days for other views
      chartDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - (6 - i));
        return d.getDate().toString();
      });
    }

    chartDays.forEach(day => {
      dailyMap[day] = { income: 0, expense: 0 };
    });

    filteredTransactions.forEach(t => {
      const d = t.date.getDate().toString();
      if (dailyMap[d]) {
        dailyMap[d][t.type as 'income' | 'expense'] += t.amount;
      }
    });

    let cumulativeExpense = 0;
    let cumulativeIncome = 0;
    const dailyData = chartDays.map(day => {
      cumulativeExpense += dailyMap[day].expense;
      cumulativeIncome += dailyMap[day].income;
      return {
        day,
        ...dailyMap[day],
        cumulativeExpense,
        cumulativeIncome
      };
    });

    // Monthly Growth (Comparison with last month)
    const lastMonth = new Date(currentDate);
    lastMonth.setMonth(currentDate.getMonth() - 1);
    const lastMonthTxs = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === lastMonth.getMonth() && td.getFullYear() === lastMonth.getFullYear();
    });
    const lastMonthExpense = lastMonthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const growth = lastMonthExpense > 0 ? ((expense - lastMonthExpense) / lastMonthExpense) * 100 : 0;

    // Daily Average & Projection
    const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
    const daysPassed = isCurrentMonth ? new Date().getDate() : daysInMonth;
    const dailyAvg = expense / Math.max(1, daysPassed);
    const projection = dailyAvg * daysInMonth;

    return { 
      income, 
      expense, 
      categoryData, 
      dailyData, 
      growth, 
      dailyAvg, 
      projection,
      total: viewType === 'Pengeluaran' ? expense : income
    };
  }, [filteredTransactions, viewType, categories, transactions, currentDate, period]);

  const activityMap = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const dayMap: Record<number, number> = {};
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        dayMap[t.date.getDate()] = (dayMap[t.date.getDate()] || 0) + t.amount;
      }
    });

    const items = [];
    // Padding
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) items.push({ day: null, amount: 0 });
    for (let i = 1; i <= totalDays; i++) items.push({ day: i, amount: dayMap[i] || 0 });
    
    return items;
  }, [filteredTransactions, currentDate]);

  const topExpenses = useMemo(() => {
    const map: Record<string, { amount: number, count: number }> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      if (!map[t.category]) map[t.category] = { amount: 0, count: 0 };
      map[t.category].amount += t.amount;
      map[t.category].count += 1;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions]);

  const searchFilteredTransactions = filteredTransactions.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  if (loading) return (
    <div className="flex justify-center p-20">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="px-6 pt-2">
        <h2 className="text-2xl font-black text-primary text-center">Statistik</h2>
      </header>

      {/* Period Tabs */}
      <div className="px-6">
        <div className="flex bg-white/50 p-1 rounded-2xl border border-neutral-dark shadow-sm">
          {(['Mingguan', 'Bulanan', 'Tahunan', 'Rentang'] as StatsPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${period === p ? 'bg-white shadow-md text-[#1e293b]' : 'text-gray-400'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <section className="px-6 grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-dark flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo Rill</span>
          <h4 className="text-xl font-black text-primary">Rp{financeStats.totalWalletBalance.toLocaleString('id-ID')}</h4>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-dark flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Limit Tersedia</span>
          <h4 className="text-xl font-black text-[#1e293b]">Rp{financeStats.totalCreditAvailable.toLocaleString('id-ID')}</h4>
        </div>
      </section>

      {/* Month Navigator */}
      <div className="px-6 flex items-center justify-between">
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          className="p-2 hover:bg-neutral rounded-full"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h3 className="font-black text-primary text-lg">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            (1 {months[currentDate.getMonth()]} - {new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()} {months[currentDate.getMonth()]})
          </p>
        </div>
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          className="p-2 hover:bg-neutral rounded-full"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Growth Card */}
      <section className="px-6">
        <div className={`p-6 rounded-[32px] border flex items-center gap-4 ${stats.growth > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stats.growth > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
            <TrendingUp size={24} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold leading-tight">
              {viewType} {stats.growth > 0 ? 'naik' : 'turun'} {Math.abs(stats.growth).toFixed(1)}% dari bulan lalu
            </p>
          </div>
        </div>
      </section>

      {/* Commitment Analysis (Realisasi) */}
      <section className="px-6">
          <button 
            onClick={() => setShowCommitments(!showCommitments)}
            className="w-full flex justify-between items-center mb-6 px-4 bg-white/50 py-3 rounded-2xl border border-neutral-dark shadow-sm active:scale-95 transition-all"
          >
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <ShieldCheck size={16} />
                  </div>
                  <h3 className="text-sm font-black text-primary">Realisasi Komitmen</h3>
              </div>
              <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 opacity-40">
                      <Briefcase size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Balance Check</span>
                  </div>
                  <ChevronRight size={16} className={`text-primary transition-transform duration-300 ${showCommitments ? 'rotate-90' : ''}`} />
              </div>
          </button>

          <AnimatePresence>
            {showCommitments && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                  <div className="flex flex-col gap-4 pb-6">
                      {commitmentStats.map((item) => {
                          const diff = item.budget - item.actual;
                          const isHealthy = diff >= 0;
                          const progress = item.budget > 0 ? Math.min(100, (item.actual / item.budget) * 100) : 0;
                          
                          return (
                              <div key={item.id} className={`p-6 rounded-[32px] border ${item.bgColor} ${item.borderColor} flex flex-col gap-5 shadow-sm`}>
                                  <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm ${item.color}`}>
                                              <item.icon size={22} strokeWidth={2.5} />
                                          </div>
                                          <div>
                                              <h4 className="font-black text-[#1e293b] text-sm leading-tight">{item.name}</h4>
                                              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Budget Alokasi vs Aktual</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <div className={`text-xs font-black px-3 py-1 rounded-full inline-block ${isHealthy ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-red-500 text-white shadow-lg shadow-red-200'}`}>
                                              {isHealthy ? 'Surplus' : 'Defisit'}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex flex-col gap-2">
                                      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                          <span className="text-gray-400">Penggunaan</span>
                                          <span className={item.color}>{Math.round(progress)}%</span>
                                      </div>
                                      <div className="w-full h-2.5 bg-white rounded-full overflow-hidden shadow-inner border border-neutral/30">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className={`h-full rounded-full ${isHealthy ? 'bg-primary' : 'bg-red-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                                          />
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 pt-2">
                                      <div className="bg-white/60 p-4 rounded-2xl flex flex-col gap-1 border border-white/40">
                                          <span className="text-[8px] font-black text-gray-400 uppercase leading-none">Anggaran Dikunci</span>
                                          <span className="text-sm font-black text-primary">Rp{item.budget.toLocaleString('id-ID')}</span>
                                      </div>
                                      <div className="bg-white/60 p-4 rounded-2xl flex flex-col gap-1 border border-white/40">
                                          <span className="text-[8px] font-black text-gray-400 uppercase leading-none">Beban Aktual</span>
                                          <span className="text-sm font-black text-[#1e293b]">Rp{item.actual.toLocaleString('id-ID')}</span>
                                      </div>
                                  </div>

                                  <div className={`flex items-center justify-between p-4 rounded-2xl border-2 border-dashed ${isHealthy ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                                      <div className="flex items-center gap-2">
                                          {isHealthy ? <Zap size={14} className="text-green-600" /> : <AlertCircle size={14} className="text-red-600" />}
                                          <span className={`text-[10px] font-black uppercase tracking-widest ${isHealthy ? 'text-green-700' : 'text-red-700'}`}>
                                              {isHealthy ? 'Uang Dingin Tersedia' : 'Kekurangan Dana'}
                                          </span>
                                      </div>
                                      <span className={`text-sm font-black ${isHealthy ? 'text-green-700' : 'text-red-700'}`}>
                                          Rp{Math.abs(diff).toLocaleString('id-ID')}
                                      </span>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
      </section>

      {/* Type Toggle */}
      <div className="px-6">
        <div className="flex gap-4">
          <button 
            onClick={() => setViewType('Pemasukan')}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${viewType === 'Pemasukan' ? 'bg-secondary/10 border-secondary text-secondary shadow-sm shadow-secondary/10' : 'bg-white border-neutral-dark text-gray-400'}`}
          >
            Pemasukan
          </button>
          <button 
            onClick={() => setViewType('Pengeluaran')}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${viewType === 'Pengeluaran' ? 'bg-accent/10 border-accent text-accent shadow-sm shadow-accent/10' : 'bg-white border-neutral-dark text-gray-400'}`}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <section className="px-6">
        <div className="bg-white rounded-[40px] p-8 border border-neutral-dark shadow-sm flex flex-col items-center">
            <div className="relative w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {stats.categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => `Rp${value.toLocaleString('id-ID')}`}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                    <p className="text-xl font-black text-primary">Rp{stats.total.toLocaleString('id-ID')}</p>
                </div>
            </div>

            {/* Category Legend/Breakdown */}
            <div className="w-full mt-8 flex flex-col gap-6">
                {stats.categoryData.map((cat, i) => {
                    const percentage = Math.round((cat.value / stats.total) * 100);
                    return (
                        <div key={i} className="flex flex-col gap-2">
                           <div className="flex justify-between items-center px-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                    </div>
                                    <span className="text-sm font-bold text-[#1e293b]">{cat.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-primary">{percentage}%</span>
                                    <p className="text-[10px] font-bold text-gray-400 italic">Rp{cat.value.toLocaleString('id-ID')}</p>
                                </div>
                           </div>
                           <div className="w-full h-2 bg-neutral rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${percentage}%` }}
                                 className="h-full rounded-full"
                                 style={{ backgroundColor: cat.color }}
                               />
                           </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </section>

      {/* Daily Summary Chart */}
      <section className="px-6">
        <div className="bg-white rounded-[32px] p-8 border border-neutral-dark shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-primary">Ringkasan Harian</h3>
                <div className="flex flex-col gap-1 text-right">
                    <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">Rata2 In: Rp{(stats.income / 30).toLocaleString('id-ID')}</span>
                    <span className="text-[9px] font-bold text-accent uppercase tracking-tighter">Rata2 Out: Rp{stats.dailyAvg.toLocaleString('id-ID')}</span>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyData}>
                        <XAxis 
                          dataKey="day" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                        />
                        <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} />
                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Pemasukan</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Pengeluaran</span>
                </div>
            </div>
        </div>
      </section>

      {/* Monthly Comparison */}
      <section className="px-6">
          <div className="bg-white rounded-[32px] p-8 border border-neutral-dark shadow-sm flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-primary">Perbandingan Bulanan</h3>
                    <div className="bg-red-50 text-accent px-3 py-1 rounded-full flex items-center gap-1">
                        <ArrowUpRight size={14} strokeWidth={3} />
                        <span className="text-[11px] font-black">{stats.growth.toFixed(1)}%</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500 font-medium -mt-4">Pengeluaran lebih tinggi dari biasanya.</p>

                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.dailyData}>
                            <defs>
                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                              dataKey="day" 
                              hide={false} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fontWeight: 600, fill: '#cbd5e1' }}
                              interval={Math.floor(stats.dailyData.length / 4)}
                            />
                            <Area type="monotone" dataKey="cumulativeExpense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col border-r border-neutral">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rata-rata Harian</span>
                        <h4 className="text-xl font-black text-[#1e293b]">Rp{stats.dailyAvg.toLocaleString('id-ID')}</h4>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Proyeksi</span>
                        <h4 className="text-xl font-black text-gray-400">Rp{stats.projection.toLocaleString('id-ID')}</h4>
                    </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-blue-800 leading-relaxed italic font-serif">Berdasarkan kebiasaan belanja Anda bulan ini.</p>
                </div>
          </div>
      </section>

      {/* Activity Map (Heatmap) */}
      <section className="px-6">
        <div className="bg-white rounded-[32px] p-8 border border-neutral-dark shadow-sm">
            <h3 className="text-lg font-black text-primary mb-6">Peta Aktivitas</h3>
            
            <div className="flex justify-between items-center mb-4 px-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <span key={`${d}-${i}`} className="text-[10px] font-black text-gray-300 w-8 text-center">{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {activityMap.map((item, i) => {
                    let intensity = 'bg-[#f8f9fa]';
                    if (item.amount > 0) {
                        const ratio = item.amount / 500000; // Ref base
                        if (ratio < 0.2) intensity = 'bg-red-50';
                        else if (ratio < 0.5) intensity = 'bg-red-200';
                        else if (ratio < 1) intensity = 'bg-red-400';
                        else intensity = 'bg-red-600';
                    }

                    return (
                        <div 
                          key={i} 
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center relative group transition-all hover:scale-110 ${intensity} ${item.day ? 'shadow-xs border border-white/40' : 'opacity-0'}`}
                        >
                            {item.day && (
                                <>
                                    <span className={`text-[10px] font-bold ${item.amount > 100000 ? 'text-white' : 'text-gray-400'}`}>{item.day}</span>
                                    {item.amount > 500000 && (
                                        <span className="text-[6px] font-black text-white absolute bottom-1 uppercase tracking-tighter">
                                          {Math.round(item.amount / 1000)}k
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
                <span className="text-[10px] font-bold text-gray-400 uppercase italic font-serif mt-0.5">Sedikit</span>
                <div className="flex gap-1">
                    <div className="w-4 h-4 rounded bg-red-100" />
                    <div className="w-4 h-4 rounded bg-red-200" />
                    <div className="w-4 h-4 rounded bg-red-400" />
                    <div className="w-4 h-4 rounded bg-red-600" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase italic font-serif mt-0.5">Banyak</span>
            </div>
        </div>
      </section>

      {/* Top Expenses */}
      <section className="px-6">
        <div className="bg-white rounded-[32px] p-8 border border-neutral-dark shadow-sm">
            <h3 className="text-lg font-black text-primary mb-6">Pengeluaran Terbesar</h3>
            <div className="flex flex-col gap-4">
                {topExpenses.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-neutral rounded-xl flex items-center justify-center font-bold text-primary italic font-serif">
                                {i + 1}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-[#1e293b]">{ex.name}</h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{ex.count} transaksi</p>
                            </div>
                        </div>
                        <span className="font-bold text-sm text-primary">Rp{ex.amount.toLocaleString('id-ID')}</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Integrated Transaction Log Section */}
      <section className="px-6 pt-4">
          <div className="flex justify-between items-end mb-6 px-4">
              <div>
                  <h3 className="text-2xl font-black text-primary">Log Transaksi</h3>
              </div>
              <button className="text-[11px] font-bold text-primary uppercase tracking-widest border-b-2 border-primary/20 pb-1">Lihat Semua <ChevronRight size={10} className="inline ml-1" /></button>
          </div>

          <div className="bg-white rounded-[40px] p-6 border border-neutral-dark shadow-sm flex flex-col gap-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="Cari transaksi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-[#f8f9fa] rounded-[24px] text-sm font-medium border border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none"
                    />
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-neutral rounded-full text-xs font-black text-primary border border-neutral-dark">
                        Semua <ChevronLeft size={14} className="-rotate-90 opacity-40" />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-neutral rounded-full text-xs font-black text-primary border border-neutral-dark">
                        Semua Dompet <ChevronLeft size={14} className="-rotate-90 opacity-40" />
                    </button>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                    {searchFilteredTransactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between px-2 group">
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-black text-gray-300 w-10 uppercase tracking-tighter">
                                    {tx.date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                                </div>
                                <div className="w-10 h-10 bg-neutral-dark/30 rounded-xl flex items-center justify-center relative">
                                    <span className="text-lg relative z-10">{tx.type === 'income' ? '💰' : '🍔'}</span>
                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-xl" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-black text-primary leading-tight">{tx.category}</span>
                                    {tx.title !== tx.category && <span className="text-[10px] font-bold text-gray-400 mt-0.5 line-clamp-1">{tx.title}</span>}
                                </div>
                            </div>
                            <span className={`text-[13px] font-black ${tx.type === 'income' ? 'text-green-500' : 'text-[#1e293b]'}`}>
                                {tx.type === 'income' ? '+' : '-'}Rp{tx.amount >= 1000000 ? (tx.amount / 1000000).toFixed(1) + 'jt' : tx.amount >= 1000 ? (tx.amount / 1000).toFixed(0) + 'k' : tx.amount.toLocaleString('id-ID')}
                            </span>
                        </div>
                    ))}
                    
                    <button className="w-full py-4 mt-4 bg-neutral rounded-[24px] text-xs font-black text-primary uppercase tracking-widest active:scale-95 transition-all">
                        Lihat Semua Transaksi
                    </button>
                </div>
          </div>
      </section>
    </div>
  );
}
