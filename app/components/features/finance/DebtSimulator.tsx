import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, TrendingDown, ArrowRight, Wallet } from "lucide-react";
import { getDebtSimulation } from "../../../nexus/finance";

interface DebtSimulatorProps {
  currentNafas: number;
}

export const DebtSimulator = ({ currentNafas }: DebtSimulatorProps) => {
  const [debtAmount, setDebtAmount] = useState<number>(0);

  const scenarios = useMemo(() => {
    if (!debtAmount) return null;
    return {
      aggressive: getDebtSimulation(currentNafas, debtAmount, 6),
      relaxed: getDebtSimulation(currentNafas, debtAmount, 12),
    };
  }, [currentNafas, debtAmount]);

  return (
    <div className="bg-dark rounded-3xl p-8 shadow-xl flex flex-col min-h-full">
      <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-2">
        <Wallet size={14} className="text-tertiary" />
        Debt Stress Test
      </h2>
      
      <div className="mb-8">
        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-3 pl-1">
          New Debt Amount (Simulation)
        </label>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm leading-none">Rp</span>
          <input
            type="number"
            value={debtAmount || ""}
            onChange={(e) => setDebtAmount(Number(e.target.value))}
            placeholder="0"
            className="w-full bg-dark-accent rounded-2xl py-4 pl-12 pr-5 text-white border-none focus:ring-2 focus:ring-primary font-mono text-lg transition-all"
          />
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {scenarios ? (
          <>
            {/* Scenario Aggressive */}
            <div className={`p-5 rounded-2xl border transition-colors ${scenarios.aggressive.isOvercapacity ? "bg-red-500/10 border-red-500/30" : "bg-dark-accent border-white/5"}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold uppercase tracking-widest">
                  Aggressive (6 Mo)
                </span>
                <span className="text-white font-mono text-sm">
                  {(scenarios.aggressive.monthlyInstallment / 1000000).toFixed(2)}M/bln
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 italic">Remaining Nafas</span>
                <span className={`font-bold font-mono ${scenarios.aggressive.isOvercapacity ? "text-red-400" : "text-primary"}`}>
                  Rp {(scenarios.aggressive.newNafas / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>

            {/* Scenario Relaxed */}
            <div className={`p-5 rounded-2xl border transition-colors ${scenarios.relaxed.isOvercapacity ? "bg-red-500/10 border-red-500/30" : "bg-dark-accent border-white/5"}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[9px] font-bold uppercase tracking-widest">
                  Relaxed (12 Mo)
                </span>
                <span className="text-white font-mono text-sm">
                  {(scenarios.relaxed.monthlyInstallment / 1000000).toFixed(2)}M/bln
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 italic">Remaining Nafas</span>
                <span className={`font-bold font-mono ${scenarios.relaxed.isOvercapacity ? "text-red-400" : "text-primary"}`}>
                  Rp {(scenarios.relaxed.newNafas / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-gray-500 bg-dark-accent/50 rounded-2xl border border-dashed border-white/5">
            <TrendingDown size={28} className="mb-3 opacity-20" />
            <p className="text-[11px] font-medium opacity-60">Input nominal untuk simulasi</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="bg-primary text-white py-4 rounded-2xl text-center font-bold text-[11px] uppercase tracking-widest cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/10">
          APPLY SIMULATION
        </div>
        <p className="text-[9px] text-center text-gray-500 mt-5 leading-relaxed italic">
          Data in simulation does not affect real balance until applied.
        </p>
      </div>
    </div>
  );
};
