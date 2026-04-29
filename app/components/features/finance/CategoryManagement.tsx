import { useState, useMemo } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { 
  ChevronLeft, 
  ArrowUpDown, 
  ChevronDown, 
  Plus, 
  Utensils, 
  Bus, 
  ShoppingBag, 
  Home, 
  Film, 
  Activity, 
  User,
  LayoutGrid,
  Trash2,
  X
} from "lucide-react";
import { FinanceService } from "../../../services/financeService";
import { auth } from "../../../nexus/firebase";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useFinanceData, Category } from "../../../hooks/useFinance";

export function CategoryManagement({ onClose }: { onClose: () => void }) {
  const dragControls = useDragControls();
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const { categories, loading, profile } = useFinanceData();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState<{ [key: string]: string }>({});

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === activeTab);
  }, [categories, activeTab]);

  const handleDeleteCategory = async (id: string) => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    const result = await Swal.fire({
      title: 'Hapus Kategori?',
      text: "Semua transaksi dengan kategori ini mungkin perlu disesuaikan.",
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
      try {
        await FinanceService.deleteData(user.uid, profile.linkedUserId || null, 'categories', id);
        toast.success("Kategori dihapus");
      } catch (error: any) {
        toast.error(`Gagal menghapus: ${error.message}`);
      }
    }
  };

  const handleAddSubCategory = async (categoryId: string) => {
    const subName = newSubCategoryName[categoryId];
    if (!subName?.trim()) return;

    const user = auth.currentUser;
    if (!user || !profile) return;

    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      const newSubCategories = [...(category.subCategories || []), subName.trim()];
      await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'categories', categoryId, {
        subCategories: newSubCategories
      });
      setNewSubCategoryName(prev => ({ ...prev, [categoryId]: "" }));
      toast.success("Sub-kategori ditambahkan");
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    }
  };

  const handleRemoveSubCategory = async (categoryId: string, subName: string) => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    const result = await Swal.fire({
      title: 'Hapus Sub-kategori?',
      text: `Ingin menghapus "${subName}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-[32px]'
      }
    });

    if (result.isConfirmed) {
      try {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const newSubCategories = (category.subCategories || []).filter(s => s !== subName);
        await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'categories', categoryId, {
          subCategories: newSubCategories
        });
        toast.success("Sub-kategori dihapus");
      } catch (error: any) {
        toast.error(`Gagal: ${error.message}`);
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

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.y > 150) onClose();
      }}
      className="fixed inset-0 z-[70] bg-neutral flex flex-col overflow-y-auto"
    >
      {/* Drag Handle */}
      <div className="w-full flex justify-center pt-2 pb-1 sticky top-0 bg-neutral/80 backdrop-blur-md z-[20] cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <header className="px-6 py-4 flex items-center justify-between sticky top-[22px] bg-neutral/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold">Kategori</h2>
        </div>
        <button className="p-2">
          <ArrowUpDown size={20} className="text-gray-600" />
        </button>
      </header>

      <div className="px-6 flex flex-col gap-8 pb-32">
        {/* Type Tabs */}
        <div className="flex border-b border-neutral shadow-sm">
          <button 
            onClick={() => setActiveTab("expense")}
            className={`flex-1 py-4 font-bold text-sm transition-all border-b-4 ${activeTab === 'expense' ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}
          >
            Pengeluaran
          </button>
          <button 
            onClick={() => setActiveTab("income")}
            className={`flex-1 py-4 font-bold text-sm transition-all border-b-4 ${activeTab === 'income' ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}
          >
            Pemasukan
          </button>
        </div>

        {/* Category List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center p-10">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white rounded-[32px] p-10 border-2 border-dashed border-neutral-dark text-center">
               <p className="font-bold text-gray-400 text-sm">Belum ada kategori kustom.</p>
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const IconComp = getIcon(cat.icon);
              const isExpanded = expandedCategoryId === cat.id;

              return (
                <div key={cat.id} className="bg-white rounded-[32px] shadow-sm border border-neutral-dark overflow-hidden transition-all">
                  <div 
                    onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                    className="p-6 flex items-center justify-between cursor-pointer active:bg-neutral transition-colors"
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-14 h-14 ${cat.color} bg-opacity-10 rounded-[20px] flex items-center justify-center ${cat.color.replace('bg-', 'text-')}`}>
                         <IconComp size={28} />
                       </div>
                       <div>
                         <h4 className="font-bold text-primary">{cat.name}</h4>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{(cat.subCategories?.length || 0)} sub-kategori</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                       >
                          <Activity size={18} />
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                        className="p-2 text-gray-400 hover:text-accent transition-colors"
                       >
                          <Trash2 size={18} />
                       </button>
                       <ChevronDown size={20} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-neutral px-6 py-4 bg-neutral/30 flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap gap-2">
                        {cat.subCategories?.map(sub => (
                          <div key={sub} className="bg-white px-4 py-2 rounded-full border border-neutral-dark flex items-center gap-2 group">
                             <span className="text-xs font-bold text-gray-600">{sub}</span>
                             <button 
                              onClick={() => handleRemoveSubCategory(cat.id, sub)}
                              className="text-gray-300 hover:text-accent"
                             >
                                <X size={14} />
                             </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Sub-kategori..."
                            value={newSubCategoryName[cat.id] || ""}
                            onChange={(e) => setNewSubCategoryName(prev => ({ ...prev, [cat.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddSubCategory(cat.id);
                            }}
                            className="flex-1 bg-white px-4 py-2 rounded-full border border-neutral-dark text-xs font-bold outline-none focus:border-primary"
                          />
                          <button 
                            onClick={() => handleAddSubCategory(cat.id)}
                            className="bg-primary text-white p-2 rounded-full shadow-sm active:scale-95 transition-transform"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <button 
        onClick={() => setShowAddCategory(true)}
        className="fixed bottom-32 right-6 w-16 h-16 bg-primary text-white rounded-[24px] shadow-2xl flex items-center justify-center active:scale-90 transition-all z-20"
      >
        <Plus size={32} />
      </button>

      <AnimatePresence>
        {(showAddCategory || editingCategory) && (
          <NewCategoryForm 
            editData={editingCategory || undefined}
            onClose={() => {
              setShowAddCategory(false);
              setEditingCategory(null);
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type CommitmentType = 'debt' | 'fixed' | 'savings' | 'regular' | 'catatan';

function NewCategoryForm({ onClose, editData }: { onClose: () => void, editData?: Category }) {
  const { profile } = useFinanceData();
  const [name, setName] = useState(editData?.name || "");
  const [type, setType] = useState<"expense" | "income">(editData?.type || "expense");
  const [commitmentType, setCommitmentType] = useState<CommitmentType>(editData?.commitmentType as CommitmentType || "regular");
  const [selectedColor, setSelectedColor] = useState(editData?.color || "bg-orange-500");
  const [selectedIcon, setSelectedIcon] = useState(editData?.icon || "LayoutGrid");
  const [subCategories, setSubCategories] = useState<string[]>(editData?.subCategories || []);
  const [newSubName, setNewSubName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const colors = [
    "bg-red-500", "bg-pink-500", "bg-purple-500", "bg-indigo-500",
    "bg-blue-500", "bg-cyan-500", "bg-teal-500", "bg-green-500",
    "bg-yellow-500", "bg-orange-500", "bg-brown-500", "bg-gray-500"
  ];

  const icons = [
    { name: 'Utensils', icon: Utensils },
    { name: 'Bus', icon: Bus },
    { name: 'ShoppingBag', icon: ShoppingBag },
    { name: 'Home', icon: Home },
    { name: 'Film', icon: Film },
    { name: 'Activity', icon: Activity },
    { name: 'User', icon: User },
    { name: 'LayoutGrid', icon: LayoutGrid }
  ];

  const PreviewIcon = icons.find(i => i.name === selectedIcon)?.icon || LayoutGrid;

  const handleAddSub = () => {
    if (newSubName.trim() && !subCategories.includes(newSubName.trim())) {
      setSubCategories([...subCategories, newSubName.trim()]);
      setNewSubName("");
    }
  };

  const handleRemoveSub = (sub: string) => {
    setSubCategories(subCategories.filter(s => s !== sub));
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !name || !profile) return;

    setLoading(true);
    try {
      const categoryData = {
        name,
        type,
        commitmentType,
        color: selectedColor,
        icon: selectedIcon,
        subCategories: subCategories
      };

      if (editData) {
        await FinanceService.updateData(user.uid, profile.linkedUserId || null, 'categories', editData.id, categoryData);
        toast.success("Kategori berhasil diperbarui");
      } else {
        await FinanceService.addData(user.uid, profile.linkedUserId || null, 'categories', categoryData);
        toast.success("Kategori berhasil ditambahkan");
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
      className="fixed inset-0 z-[80] bg-neutral flex flex-col overflow-y-auto"
    >
      <header className="p-6 flex items-center justify-between bg-white border-b border-neutral shadow-sm sticky top-0 z-10">
        <button onClick={onClose} className="p-2">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold">{editData ? 'Ubah Kategori' : 'Kategori Baru'}</h2>
        <button 
          onClick={handleSubmit} 
          disabled={loading || !name}
          className="text-primary font-bold disabled:opacity-30"
        >
          {loading ? '...' : 'Simpan'}
        </button>
      </header>

      <div className="p-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Nama Kategori</label>
          <div className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-center gap-4">
             <div className={`w-12 h-12 ${selectedColor} bg-opacity-10 rounded-xl flex items-center justify-center ${selectedColor.replace('bg-', 'text-')}`}>
               <PreviewIcon size={24} />
             </div>
             <input 
               type="text" 
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Nama kategori"
               className="flex-1 text-lg font-bold outline-none placeholder:text-gray-300"
             />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Tipe</label>
          <div className="flex gap-4">
             <button 
              onClick={() => setType("expense")}
              className={`flex-1 py-5 rounded-[24px] font-bold shadow-sm border-2 transition-all ${type === 'expense' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-400 border-white'}`}
             >
               Pengeluaran
             </button>
             <button 
              onClick={() => setType("income")}
              className={`flex-1 py-5 rounded-[24px] font-bold shadow-sm border-2 transition-all ${type === 'income' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-400 border-white'}`}
             >
               Pemasukan
             </button>
          </div>
        </div>

        {/* Commitment Type Selector */}
        {type === 'expense' && (
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Tipe Komitmen</label>
            <div className="flex bg-white p-1.5 rounded-[28px] shadow-sm border border-neutral-dark">
              {[
                { id: 'regular', label: 'Umum' },
                { id: 'debt', label: 'Hutang' },
                { id: 'fixed', label: 'Tagihan' },
                { id: 'savings', label: 'Tabungan' },
                { id: 'catatan', label: 'Catatan' }
              ].map(ct => (
                <button 
                  key={ct.id}
                  onClick={() => setCommitmentType(ct.id as any)}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-wider rounded-[22px] transition-all ${commitmentType === ct.id ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 font-bold px-4 leading-relaxed italic">
              Digunakan untuk laporan realisasi komitmen anggaran otomatis.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Warna</label>
          <div className="bg-white p-8 rounded-[40px] shadow-sm grid grid-cols-4 gap-4">
            {colors.map(color => (
              <button 
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-full aspect-square rounded-[20px] flex items-center justify-center transition-all ${color} ${selectedColor === color ? 'ring-4 ring-offset-4 ring-primary shadow-lg' : 'hover:scale-105 opacity-80'}`}
              >
                {selectedColor === color && <div className="text-white">✓</div>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Ikon</label>
          <div className="bg-white p-8 rounded-[40px] shadow-sm grid grid-cols-4 gap-4">
             {icons.map((item) => {
               const Icon = item.icon;
               return (
                <button 
                  key={item.name}
                  onClick={() => setSelectedIcon(item.name)}
                  className={`w-full aspect-square rounded-[20px] flex items-center justify-center transition-all ${selectedIcon === item.name ? `${selectedColor} text-white shadow-lg scale-110` : 'bg-neutral text-gray-400'}`}
                >
                  <Icon size={24} />
                </button>
               );
             })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Sub-Kategori</label>
          <div className="bg-white p-6 rounded-[32px] border border-neutral-dark shadow-sm flex items-center gap-4">
             <input 
               type="text" 
               value={newSubName}
               onChange={(e) => setNewSubName(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAddSub()}
               placeholder="Tambah sub-kategori..."
               className="flex-1 text-sm font-bold outline-none placeholder:text-gray-300"
             />
             <button 
              onClick={handleAddSub}
              className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all"
             >
                <Plus size={20} />
             </button>
          </div>

          {subCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {subCategories.map(sub => (
                <div key={sub} className="bg-white border border-neutral-dark px-4 py-2 rounded-full flex items-center gap-2 group">
                   <span className="text-xs font-bold text-gray-600">{sub}</span>
                   <button onClick={() => handleRemoveSub(sub)} className="text-gray-300 hover:text-accent transition-colors">
                      <X size={14} />
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
