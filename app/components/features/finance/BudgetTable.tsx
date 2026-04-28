import { BudgetItem, BudgetStatus } from "../../../types/finance";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, MoreHorizontal } from "lucide-react";

interface BudgetTableProps {
  items: BudgetItem[];
  onToggleStatus: (id: string) => void;
}

export const BudgetTable = ({ items, onToggleStatus }: BudgetTableProps) => {
  const getDeadlineColor = (deadline: string, status: BudgetStatus) => {
    if (status === BudgetStatus.PAID) return "bg-green-100 text-green-700";
    const date = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < today) return "bg-red-100 text-red-700";
    if (date.getTime() === today.getTime()) return "bg-yellow-100 text-yellow-700";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#EBE7DA] flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-serif italic text-2xl text-[#4A4A4A]">Rincian Anggaran Aktif</h2>
        <div className="text-[11px] font-bold text-[#8DA382] border-b-2 border-[#8DA382] pb-1 cursor-pointer hover:opacity-70 transition-opacity">
          TAMBAH DATA +
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">
              <th className="pb-4 font-semibold">Nama Anggaran</th>
              <th className="pb-4 font-semibold">Kategori</th>
              <th className="pb-4 font-semibold">Nominal</th>
              <th className="pb-4 font-semibold text-center">Status</th>
              <th className="pb-4 font-semibold text-right">Tenggat</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.tr
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group hover:bg-[#F5F2E9]/30 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                  onClick={() => onToggleStatus(item.id)}
                >
                  <td className="py-5 font-medium text-[#4A4A4A]">
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      {item.notes && <span className="text-[10px] text-gray-400 italic font-normal">{item.notes}</span>}
                    </div>
                  </td>
                  <td className="py-5">
                    <span className="px-2 py-1 bg-neutral-dark text-slate-600 rounded text-[10px] font-bold uppercase">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-5 font-mono text-[#4A4A4A]">
                    {item.amount.toLocaleString()}
                  </td>
                  <td className="py-5">
                    <div className="flex justify-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.status === BudgetStatus.PAID ? "bg-[#8DA382]" : "bg-red-400"}`}></div>
                    </div>
                  </td>
                  <td className="py-5 text-right">
                    <span className={`text-[11px] font-bold ${getDeadlineColor(item.deadline, item.status).includes('red') ? 'text-red-500' : 'text-gray-400'}`}>
                      {format(new Date(item.deadline), "dd MMM")}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};
