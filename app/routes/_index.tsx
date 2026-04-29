import { useFinanceData } from "../hooks/useFinance";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Wallet as WalletIcon,
  Plus,
  ChevronRight,
  Receipt,
  User,
  Home,
  PieChart,
  BarChart3,
  Clock,
  MessageSquare,
  Scan,
  Mic,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Repeat,
  Target,
  FileText,
  CreditCard,
  Shield,
  Settings,
  LogOut,
  Moon,
  Palette,
  HelpCircle,
  LogIn,
  Building2,
  Smartphone,
  Copy,
  Link,
  Users,
  ShoppingBag
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ReceiptScanner } from "../components/features/finance/ReceiptScanner";
import { TransactionForm } from "../components/features/finance/TransactionForm";
import { BudgetPage } from "../components/features/finance/BudgetPage";
import { NewWalletForm } from "../components/features/finance/NewWalletForm";
import { CategoryManagement } from "../components/features/finance/CategoryManagement";
import { DebtPage } from "../components/features/finance/DebtPage";
import { TransactionLogPage } from "../components/features/finance/TransactionLogPage";
import { FinancialStressTest } from "../components/features/finance/FinancialStressTest";
import { BillsPage } from "../components/features/finance/BillsPage";
import { RecurringPage } from "../components/features/finance/RecurringPage";
import { SavingsTargetPage } from "../components/features/finance/SavingsTargetPage";
import { WalletDetailPage } from "../components/features/finance/WalletDetailPage";
import { NotificationsPage } from "../components/features/finance/NotificationsPage";
import { StatisticsDashboard } from "../components/features/finance/StatisticsDashboard";
import { BundlePage } from "../components/features/finance/BundlePage";
import { onAuthStateChanged, type User as FirebaseUser, signOut } from "firebase/auth";
import { auth, loginWithGoogle, db, handleFirestoreError, OperationType } from "../nexus/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { FinanceService } from "../services/financeService";
import { toast } from "sonner";
import Swal from "sweetalert2";

type Tab = 'home' | 'insights' | 'wallet' | 'profile';

export default function Dashboard() {
  const { profile } = useFinanceData();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showNewWallet, setShowNewWallet] = useState(false);
  const [showDebts, setShowDebts] = useState(false);
  const [showTransactionLog, setShowTransactionLog] = useState(false);
  const [showHealthHub, setShowHealthHub] = useState(false);
  const [showBills, setShowBills] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showSavings, setShowSavings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [selectedWalletDetail, setSelectedWalletDetail] = useState<any>(null);
  const [showBundleList, setShowBundleList] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'Hari' | 'Minggu' | 'Bulan' | 'Tahun' | 'Semua'>('Bulan');
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    import("../nexus/firebase").then(({ testConnection }) => {
      testConnection();
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading) {
    return (
      <div className="mobile-container flex items-center justify-center bg-neutral">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center bg-neutral p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-[30px] flex items-center justify-center">
            <LogIn size={40} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary">Mizanly</h1>
            <p className="text-gray-500 text-sm italic font-serif mt-2">Masuk untuk mulai mencapai keseimbangan finansial holistik Anda.</p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="w-full bg-primary text-white py-4 rounded-[20px] font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            <User size={20} />
            Masuk dengan Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <AnimatePresence>
        {isAddingTransaction && (
          <TransactionForm
            initialData={prefilledData}
            onClose={() => {
              setIsAddingTransaction(false);
              setPrefilledData(null);
            }}
          />
        )}
        {showBudgets && (
          <BudgetPage onClose={() => setShowBudgets(false)} />
        )}
        {showCategories && (
          <CategoryManagement onClose={() => setShowCategories(false)} />
        )}
        {showNewWallet && (
          <NewWalletForm onClose={() => setShowNewWallet(false)} />
        )}
        {showDebts && (
          <DebtPage onClose={() => setShowDebts(false)} />
        )}
        {showTransactionLog && (
          <TransactionLogPage onClose={() => setShowTransactionLog(false)} />
        )}
        {showHealthHub && (
          <FinancialStressTest onClose={() => setShowHealthHub(false)} />
        )}
        {showBills && (
          <BillsPage onClose={() => setShowBills(false)} />
        )}
        {showRecurring && (
          <RecurringPage onClose={() => setShowRecurring(false)} />
        )}
        {showSavings && (
          <SavingsTargetPage onClose={() => setShowSavings(false)} />
        )}
        {showNotifications && (
          <NotificationsPage onClose={() => setShowNotifications(false)} />
        )}
        {showBundleList && (
          <BundlePage onClose={() => setShowBundleList(false)} />
        )}
        {selectedWalletDetail && (
          <WalletDetailPage
            wallet={selectedWalletDetail}
            onClose={() => setSelectedWalletDetail(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-6 flex items-center justify-between shrink-0 bg-neutral">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-surface shadow-sm">
              <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Profile" />
            </div>
          </div>
          <div>
            <p className="text-[12px] text-gray-500 font-medium font-serif italic">Hai, {user.displayName?.split(' ')[0] || 'User'}!</p>
            <h1 className="text-xl font-black text-primary leading-tight">Mizanly</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'profile' ? (
            <button className="p-2.5 bg-surface rounded-full shadow-sm">
              <Settings size={20} className="text-gray-600" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                className="p-2.5 bg-surface rounded-full shadow-sm relative active:scale-95 transition-all"
              >
                <Bell size={20} className="text-gray-400" />
                <NotificationBadge />
              </button>

              <AnimatePresence>
                {showNotificationPopup && (
                  <NotificationPopup
                    profile={profile}
                    onClose={() => setShowNotificationPopup(false)}
                    onSeeAll={() => {
                      setShowNotificationPopup(false);
                      setShowNotifications(true);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isScanning ? (
            <motion.main
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-6 pb-32"
            >
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setIsScanning(false)} className="p-2 bg-white rounded-full shadow-sm">
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <h2 className="text-lg font-bold">Pindai Struk</h2>
              </div>
              <ReceiptScanner onSave={(data) => {
                setPrefilledData({
                  amount: data.total.toString(),
                  title: data.merchant,
                  notes: `Scan Struk: ${data.items.map(i => i.name).join(', ')}`
                });
                setIsScanning(false);
                setIsAddingTransaction(true);
              }} />
            </motion.main>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="pb-32"
            >
              {activeTab === 'home' && (
                <HomeTab
                  onScan={() => setIsScanning(true)}
                  onAdd={() => setIsAddingTransaction(true)}
                  onOpenBudgets={() => setShowBudgets(true)}
                  onOpenDebts={() => setShowDebts(true)}
                  onOpenTransactionLog={() => setShowTransactionLog(true)}
                  onOpenHealthHub={() => setShowHealthHub(true)}
                  onOpenBills={() => setShowBills(true)}
                  onOpenRecurring={() => setShowRecurring(true)}
                  onOpenSavings={() => setShowSavings(true)}
                  onOpenBundles={() => setShowBundleList(true)}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                />
              )}
              {activeTab === 'insights' && <InsightsTab onOpenLog={() => setShowTransactionLog(true)} />}
              {activeTab === 'wallet' && (
                <WalletTab
                  onAddNew={() => setShowNewWallet(true)}
                  onWalletClick={(w) => setSelectedWalletDetail(w)}
                />
              )}
              {activeTab === 'profile' && <ProfileTab onOpenCategories={() => setShowCategories(true)} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-white rounded-[40px] shadow-2xl px-8 py-4 flex items-center justify-between z-50">
        <NavLink
          isActive={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
          icon={Home}
          label="Beranda"
        />
        <NavLink
          isActive={activeTab === 'insights'}
          onClick={() => setActiveTab('insights')}
          icon={BarChart3}
          label="Laporan"
        />
        <NavLink
          isActive={activeTab === 'wallet'}
          onClick={() => setActiveTab('wallet')}
          icon={WalletIcon}
          label="Dompet"
        />
        <NavLink
          isActive={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          icon={User}
          label="Profil"
        />
      </nav>
    </div>
  );
}

function NotificationBadge() {
  const { notifications } = useFinanceData();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (unreadCount === 0) return null;

  return (
    <div className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
  );
}

function NotificationPopup({ profile, onClose, onSeeAll }: { profile: any, onClose: () => void, onSeeAll: () => void }) {
  const { notifications } = useFinanceData();
  const user = auth.currentUser;

  const handleRead = async (id: string) => {
    if (!user || !profile) return;
    try {
      await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'notifications', id, { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10, x: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10, x: 20 }}
        className="absolute right-0 mt-2 w-72 bg-white rounded-[32px] shadow-2xl border border-neutral-dark z-[60] overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-neutral flex justify-between items-center">
          <h4 className="text-sm font-black text-[#1e293b]">Notifikasi</h4>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {notifications.filter(n => !n.read).length} Baru
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs italic font-bold">
              Tidak ada notifikasi
            </div>
          ) : (
            notifications.slice(0, 5).map(notif => (
              <button
                key={notif.id}
                onClick={() => {
                  handleRead(notif.id);
                  // Handle link if needed
                }}
                className={`w-full p-4 flex items-start gap-3 border-b border-neutral hover:bg-neutral transition-colors text-left ${!notif.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${notif.type === 'success' ? 'bg-green-50 text-green-500' :
                    notif.type === 'warning' ? 'bg-yellow-50 text-yellow-500' :
                      'bg-blue-50 text-blue-500'
                  }`}>
                  <Bell size={14} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] font-black text-[#1e293b] leading-tight">{notif.title}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                  <p className="text-[8px] font-bold text-gray-300 mt-1 uppercase">{notif.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <button
          onClick={onSeeAll}
          className="p-4 w-full text-center text-xs font-bold text-primary hover:bg-neutral transition-colors"
        >
          Lihat Semua
        </button>
      </motion.div>
    </>
  );
}

function NavLink({ isActive, onClick, icon: Icon, label }: { isActive: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button onClick={onClick} className={`nav-link ${isActive ? 'text-primary' : 'text-gray-300'}`}>
      <div className={`${isActive ? 'bg-primary/10 p-2 rounded-2xl' : ''} transition-all`}>
        <Icon size={isActive ? 24 : 22} className="transition-all" />
      </div>
      <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
    </button>
  );
}

function HomeTab({
  onScan,
  onAdd,
  onOpenBudgets,
  onOpenDebts,
  onOpenTransactionLog,
  onOpenHealthHub,
  onOpenBills,
  onOpenRecurring,
  onOpenSavings,
  onOpenBundles,
  activeFilter,
  setActiveFilter
}: {
  onScan: () => void,
  onAdd: () => void,
  onOpenBudgets: () => void,
  onOpenDebts: () => void,
  onOpenTransactionLog: () => void,
  onOpenHealthHub: () => void,
  onOpenBills: () => void,
  onOpenRecurring: () => void,
  onOpenSavings: () => void,
  onOpenBundles: () => void,
  activeFilter: 'Hari' | 'Minggu' | 'Bulan' | 'Tahun' | 'Semua',
  setActiveFilter: (f: any) => void
}) {
  const { transactions, stats, loading } = useFinanceData(activeFilter);
  const timeFilters = ["Hari", "Minggu", "Bulan", "Tahun", "Semua"];

  return (
    <div className="flex flex-col gap-8">
      <div className="px-6 flex gap-2">
        {timeFilters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter as any)}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${activeFilter === filter ? 'bg-primary text-white shadow-lg' : 'bg-neutral-dark text-gray-500'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="px-6">
        <div className="bg-primary rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 blur-3xl"></div>
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Total Saldo (IDR)</p>
              <h2 className="text-5xl font-black tracking-tighter">
                Rp{stats.balance.toLocaleString('id-ID')}
              </h2>
            </div>

            <div className="h-px w-full bg-white/10 my-2"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                  <ArrowDown size={20} className="text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60">Pemasukan</p>
                  <p className="font-bold">Rp {stats.income.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                  <ArrowUp size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60">Pengeluaran</p>
                  <p className="font-bold">Rp {stats.expense.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 grid grid-cols-4 gap-x-4 gap-y-6">
        {[
          { icon: LayoutGrid, label: "Anggaran", onClick: onOpenBudgets, className: "" },
          { icon: Repeat, label: "Berulang", onClick: onOpenRecurring, className: "" },
          { icon: Target, label: "Tabungan", onClick: onOpenSavings, className: "" },
          { icon: FileText, label: "Tagihan", onClick: onOpenBills, className: "" },
          { icon: Shield, label: "Health Hub", onClick: onOpenHealthHub, className: "" },
          { icon: CreditCard, label: "Hutang", onClick: onOpenDebts, className: "" },
          { icon: ShoppingBag, label: "Bundle", onClick: onOpenBundles, className: "" },
        ].map((item, i) => (
          <button key={i} onClick={item.onClick} className={`flex flex-col items-center gap-3 ${item.className || ''}`}>
            <div className="w-16 h-16 bg-neutral-dark rounded-[24px] flex items-center justify-center shadow-xs transition-transform active:scale-90">
              <item.icon size={28} className="text-primary" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </section>

      <section className="px-6">
        <div className="bg-white/60 rounded-[40px] p-8 border border-white shadow-sm flex flex-col gap-6 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-primary">Anggaran Bulanan</h3>
            <span className="bg-neutral-dark text-[10px] font-bold text-gray-500 px-3 py-1.5 rounded-full uppercase">
              {stats.expense > 0 ? Math.round((stats.expense / stats.totalBudgetLimit) * 100) : 0}% Terpakai
            </span>
          </div>

          <div className="w-full h-2.5 bg-neutral-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full shadow-lg shadow-primary/20 transition-all duration-500"
              style={{ width: `${Math.min(100, stats.expense > 0 ? (stats.expense / stats.totalBudgetLimit) * 100 : 5)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Terpakai</p>
              <p className="text-xl font-black text-primary">Rp{stats.expense.toLocaleString('id-ID')}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total</p>
              <p className="text-sm font-bold text-gray-500 italic">Rp{stats.totalBudgetLimit.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-primary">Transaksi Terakhir</h3>
          <button
            onClick={onOpenTransactionLog}
            className="text-[10px] font-bold text-primary uppercase border-b-2 border-primary/20"
          >
            Lihat Semua
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-[40px] p-10 border-2 border-dashed border-neutral-dark flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-neutral-dark rounded-full flex items-center justify-center">
              <Clock size={32} className="text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800">Belum ada transaksi bulan ini.</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">Mulai catat pengeluaran atau pemasukanmu!</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="bg-white p-4 rounded-[28px] border border-neutral-dark flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${tx.type === 'income' ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'}`}>
                    {tx.type === 'income' ? '💰' : '💸'}
                  </div>
                  <div>
                    <p className="font-bold text-primary">{tx.title}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{tx.category} • {tx.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <p className={`font-black ${tx.type === 'income' ? 'text-secondary' : 'text-accent'}`}>
                  {tx.type === 'income' ? '+' : '-'}Rp{tx.amount.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="px-6 flex gap-4">
        <button onClick={onAdd} className="flex-1 bg-cyan-100/50 p-4 rounded-[32px] flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-sm">
          <FileText size={20} className="text-cyan-700" />
          <span className="font-bold text-cyan-900 text-sm">Catat</span>
        </button>
        <button onClick={onScan} className="flex-1 bg-green-100/50 p-4 rounded-[32px] flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-sm border border-green-200">
          <Scan size={20} className="text-green-700" />
          <span className="font-bold text-green-900 text-sm">Pindai</span>
        </button>
        <button className="flex-1 bg-orange-100/50 p-4 rounded-[32px] flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-sm">
          <Mic size={20} className="text-orange-700" />
          <span className="font-bold text-orange-900 text-sm">Suara</span>
        </button>
      </section>
    </div>
  );
}

function InsightsTab({ onOpenLog }: { onOpenLog: () => void }) {
  return <StatisticsDashboard onShowAllTransactions={onOpenLog} />;
}

function WalletTab({ onAddNew, onWalletClick }: { onAddNew: () => void, onWalletClick: (w: any) => void }) {
  const { wallets, stats, loading } = useFinanceData();

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const getWalletIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return Building2;
      case 'Smartphone': return Smartphone;
      default: return WalletIcon;
    }
  };

  const debitWallets = wallets.filter(w => w.type === 'debit' || !w.type);
  const creditWallets = wallets.filter(w => w.type === 'credit');

  return (
    <div className="flex flex-col gap-8">
      <div className="px-6">
        <h2 className="text-4xl font-black text-primary">Dompet Saya</h2>
        <p className="text-sm text-gray-500 font-serif italic mt-1 leading-tight">Harmoni dalam perjalanan finansial Anda dimulai di sini.</p>
      </div>

      <section className="px-6">
        <div className="bg-gradient-to-br from-cyan-50 to-neutral rounded-[40px] p-8 flex flex-col gap-8 border border-white shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-serif italic">Total Saldo Terintegrasi</p>
            <h3 className="text-6xl font-black text-primary tracking-tighter">
              Rp{stats.totalWalletBalance.toLocaleString('id-ID')}
            </h3>
          </div>

          <div className="flex flex-col gap-4 relative z-10">
            <div className="bg-white/80 p-5 rounded-3xl flex justify-between items-center backdrop-blur-sm border border-white/50">
              <span className="text-xs font-bold text-gray-500 uppercase">Pemasukan Bulan Ini</span>
              <span className="font-black text-primary">Rp{stats.income.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-white/80 p-5 rounded-3xl flex justify-between items-center backdrop-blur-sm border border-white/50">
              <span className="text-xs font-bold text-gray-400 uppercase">Pengeluaran Bulan Ini</span>
              <span className="font-black text-accent">Rp{stats.expense.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Debit Section */}
      <section className="px-6 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-4 bg-primary rounded-full"></div>
          <h3 className="text-xs font-black text-primary uppercase tracking-widest">Saldo Debit / Tunai</h3>
        </div>
        <div className="surface-card flex flex-col gap-6">
          {debitWallets.length === 0 ? (
            <div className="text-center py-6 text-gray-400 font-bold italic text-xs">
              Belum ada dompet debit.
            </div>
          ) : (
            debitWallets.map(wallet => {
              const Icon = getWalletIcon(wallet.icon);
              return (
                <button
                  key={wallet.id}
                  onClick={() => onWalletClick(wallet)}
                  className="flex items-center justify-between group w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${wallet.color} bg-opacity-10 rounded-[20px] flex items-center justify-center shadow-xs transition-transform group-active:scale-95 ${wallet.color.replace('bg-', 'text-')}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-primary">{wallet.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{wallet.walletType || 'Bank'}</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-primary tracking-tight">Rp{wallet.balance.toLocaleString('id-ID')}</p>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Credit Section */}
      <section className="px-6 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-4 bg-[#1e293b] rounded-full"></div>
          <h3 className="text-xs font-black text-[#1e293b] uppercase tracking-widest">Limit Kredit / Paylater</h3>
        </div>
        <div className="bg-[#1e293b] rounded-[40px] p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

          {creditWallets.length === 0 ? (
            <div className="text-center py-6 text-gray-400 font-bold italic text-xs">
              Belum ada limit kredit terdaftar.
            </div>
          ) : (
            creditWallets.map(wallet => {
              const Icon = getWalletIcon(wallet.icon);
              const usedPercent = (wallet.balance / (wallet.limit || 1)) * 100;
              return (
                <button
                  key={wallet.id}
                  onClick={() => onWalletClick(wallet)}
                  className="flex flex-col gap-4 w-full text-left p-4 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/70`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{wallet.name}</h4>
                        <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Pinjaman Aktif</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-white/40 uppercase">Tersedia</p>
                      <p className="text-sm font-black text-white">Rp{(wallet.limit - wallet.balance).toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">Penggunaan Limit</span>
                      <span className="text-[10px] font-black text-white">{usedPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${usedPercent > 80 ? 'bg-accent' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, usedPercent)}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="px-6">
        <button
          onClick={onAddNew}
          className="w-full bg-primary py-6 rounded-[32px] text-white flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={24} />
          <span className="text-sm font-black uppercase tracking-widest">Hubungkan Rekening Bank</span>
        </button>
      </section>
    </div>
  );
}

function ProfileTab({ onOpenCategories }: { onOpenCategories: () => void }) {
  const { profile } = useFinanceData();
  const [linkingCode, setLinkingCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const user = auth.currentUser;

  if (!user || !profile) return null;

  const handleLink = async () => {
    if (!linkingCode.trim()) return;
    setIsLinking(true);
    try {
      await FinanceService.linkAccount(user.uid, linkingCode.trim().toUpperCase());
      toast.success("Akun berhasil ditautkan!");
      setLinkingCode("");
    } catch (error: any) {
      toast.error(error.message || "Gagal menautkan akun");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    const result = await Swal.fire({
      title: 'Putuskan Tautan?',
      text: "Anda akan kembali menggunakan data sendiri setelah ini.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Putuskan!',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-[32px]' }
    });

    if (result.isConfirmed) {
      try {
        await FinanceService.unlinkAccount(user.uid);
        toast.success("Tautan diputuskan");
      } catch (error) {
        toast.error("Gagal memutuskan tautan");
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.appCode);
    toast.success("Kode App disalin!");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-6 px-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Avatar" className="scale-110" />
          </div>
          <button className="absolute bottom-1 right-1 p-2.5 bg-primary text-white rounded-full shadow-lg border-2 border-white active:scale-90 transition-all">
            <Palette size={16} />
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-primary">{user.displayName || 'Pengguna Anonim'}</h2>
          <p className="text-sm font-serif italic text-gray-500 mt-1">Mencapai keseimbangan sejak {new Date(user.metadata.creationTime || Date.now()).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Relasi Akun Section */}
      <section className="px-6">
        <div className="bg-[#1e293b] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight leading-tight">Kode Akses Saya</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Bagikan ke Keluarga/Pasangan</p>
              </div>
              <Users size={24} className="text-white/20" />
            </div>

            <div className="bg-white/10 p-5 rounded-[28px] border border-white/10 flex items-center justify-between">
              <span className="text-2xl font-black tracking-[0.2em]">{profile.appCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"
              >
                <Copy size={20} />
              </button>
            </div>

            <div className="h-px bg-white/10 w-full" />

            {profile.linkedUserId ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Link size={14} className="text-green-500" />
                  </div>
                  <span className="text-xs font-bold text-green-400">Terhubung dengan Akun Partner</span>
                </div>
                <button
                  onClick={handleUnlink}
                  className="w-full py-3 bg-red-500/10 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20"
                >
                  Putuskan Tautan
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tautkan ke Kode Partner</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="KODE..."
                    value={linkingCode}
                    onChange={(e) => setLinkingCode(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest placeholder:text-white/20 outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleLink}
                    disabled={isLinking || !linkingCode}
                    className="bg-primary px-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    Tautkan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-6">
        <div className="surface-card flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-primary">Informasi Pribadi</h3>
            <User size={18} className="text-gray-300" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-4">Nama Lengkap</span>
              <div className="bg-neutral-dark/50 p-4 rounded-2xl text-sm font-bold text-gray-800">{user.displayName || '-'}</div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-4">Alamat Email</span>
              <div className="bg-neutral-dark/50 p-4 rounded-2xl text-sm font-bold text-gray-800">{user.email || '-'}</div>
            </div>
            <div className="flex gap-2 ml-4">
              {["Ketenangan", "Keseimbangan Finansial"].map(tag => (
                <span key={tag} className="px-4 py-2 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full border border-secondary/10 uppercase">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6">
        <div className="surface-card flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-primary">Pengaturan & Kategori</h3>
            <Settings size={18} className="text-gray-300" />
          </div>

          <button
            onClick={onOpenCategories}
            className="flex items-center justify-between p-4 bg-white border border-neutral-dark rounded-2xl hover:bg-neutral transition-colors"
          >
            <div className="flex items-center gap-3">
              <LayoutGrid size={18} className="text-primary" />
              <span className="text-sm font-bold text-gray-700">Kelola Kategori</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

          <button
            onClick={() => {
              if ("Notification" in window && "serviceWorker" in navigator) {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") {
                    navigator.serviceWorker.ready.then(registration => {
                      registration.showNotification("Mizanly Notif", {
                        body: "Ini adalah notifikasi percobaan dari Mizanly! 🚀",
                        icon: "/icon-192x192.png"
                      });
                      toast.success("Notifikasi terkirim!");
                    });
                  } else {
                    toast.error("Izin notifikasi ditolak");
                  }
                });
              } else {
                toast.error("Browser tidak mendukung notifikasi");
              }
            }}
            className="flex items-center justify-between p-4 bg-white border border-neutral-dark rounded-2xl hover:bg-neutral transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-primary" />
              <span className="text-sm font-bold text-gray-700">Test Push Notif</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

          <button className="flex items-center justify-between p-4 bg-white border border-neutral-dark rounded-2xl hover:bg-neutral transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-primary" />
              <span className="text-sm font-bold text-gray-700">Ganti Kata Sandi</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

          <div className="flex items-center justify-between p-4 bg-white border border-neutral-dark rounded-2xl">
            <div className="flex items-center gap-3">
              <Settings size={18} className="text-primary" />
              <div>
                <p className="text-sm font-bold text-gray-700 leading-tight">Autentikasi Dua-Faktor</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase">Tingkatkan keamanan Anda</p>
              </div>
            </div>
            <div className="bg-primary/10 text-primary text-[8px] font-black px-2 py-1 rounded-full uppercase">Aktif</div>
          </div>
        </div>
      </section>

      <section className="px-6 flex gap-4">
        <button className="flex-1 bg-accent/10 border border-accent/20 p-6 rounded-[32px] flex flex-col items-center gap-3 active:scale-95 transition-all group">
          <HelpCircle size={28} className="text-accent group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black text-accent uppercase">Pusat Bantuan</span>
        </button>
        <button className="flex-1 bg-accent/10 border border-accent/20 p-6 rounded-[32px] flex flex-col items-center gap-3 active:scale-95 transition-all group">
          <FileText size={28} className="text-accent group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black text-accent uppercase">Ketentuan</span>
        </button>
      </section>

      <section className="px-6 pb-12">
        <button
          onClick={() => signOut(auth)}
          className="w-full py-5 rounded-[24px] border-2 border-red-200 text-red-500 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <LogOut size={20} />
          Keluar dari Sanctuary
        </button>
        <p className="text-center text-[10px] text-gray-300 font-bold uppercase mt-6 tracking-widest">
          Mizanly V2.4.1 — Holistic Equilibrium
        </p>
      </section>
    </div>
  );
}
