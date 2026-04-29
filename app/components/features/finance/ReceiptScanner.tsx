import { useState } from "react";
import { Camera, Upload, Loader2, Share2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { extractReceiptData, ExtractedReceipt } from "../../../nexus/ai";

export const ReceiptScanner = ({ onSave }: { onSave?: (data: ExtractedReceipt) => void }) => {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"compressing" | "scanning" | null>(null);
  const [receipt, setReceipt] = useState<ExtractedReceipt | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [participants, setParticipants] = useState(2);

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max size 1000px for better AI readability but small file size
        const MAX_SIZE = 1000;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); // 0.8 high enough quality for AI
      };
      img.src = base64;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        let base64 = reader.result as string;
        
        // Check if file size > 1MB (1,048,576 bytes)
        if (file.size > 1024 * 1024) {
          setLoadingStep("compressing");
          base64 = await compressImage(base64);
        }

        setLoadingStep("scanning");
        const data = await extractReceiptData(base64);
        setReceipt(data);
        setLoading(false);
        setLoadingStep(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setLoadingStep(null);
      alert("Gagal menganalisis struk. Silakan coba lagi.");
    }
  };

  const handleSaveToTransaction = () => {
    if (receipt && onSave) {
      onSave(receipt);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Pindai Struk</h2>
      
      {!receipt && !loading && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-dark rounded-3xl p-12 bg-neutral/50 cursor-pointer hover:bg-neutral/80 transition-colors">
            <Camera size={48} className="text-primary mb-4" />
            <span className="font-bold text-gray-500">Ambil Foto</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
          </label>
          
          <label className="flex items-center justify-center gap-3 bg-white border border-neutral-dark py-4 rounded-2xl font-bold text-gray-600 cursor-pointer">
            <Upload size={20} />
            <span>Unggah dari Galeri</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={48} className="text-primary animate-spin" />
          <p className="font-bold text-gray-500 animate-pulse text-center px-6">
            {loadingStep === 'compressing' ? 'Mengompres gambar...' : 'AI sedang membaca struk Anda...'}
          </p>
        </div>
      )}

      {receipt && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="surface-card bg-neutral/30 border-none">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-primary">{receipt.merchant}</h3>
                <p className="text-xs text-gray-400">{receipt.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-400 uppercase">Total</p>
                <p className="text-xl font-black">Rp {receipt.total.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600 italic">
                    <span className="font-bold text-primary">{item.qty}x</span> {item.name}
                  </span>
                  <span className="font-bold">Rp {item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {!isSplitting ? (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsSplitting(true)}
                className="flex items-center justify-center gap-2 bg-secondary text-white py-4 rounded-2xl font-bold shadow-lg shadow-secondary/20"
              >
                <Users size={20} />
                Bagi Tagihan
              </button>
              <button 
                className="flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20"
                onClick={handleSaveToTransaction}
              >
                Simpan
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="surface-card border-secondary/30"
            >
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Users size={18} className="text-secondary" />
                Bagi rata di antara
              </h4>
              <div className="flex items-center justify-between bg-neutral p-4 rounded-2xl mb-6">
                <button onClick={() => setParticipants(Math.max(1, participants - 1))} className="text-2xl font-bold px-4">-</button>
                <span className="text-xl font-black">{participants} Orang</span>
                <button onClick={() => setParticipants(participants + 1)} className="text-2xl font-bold px-4">+</button>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm font-bold text-gray-500 uppercase">Masing-masing Bayar</p>
                <p className="text-2xl font-black text-secondary">
                  Rp {Math.round(receipt.total / participants).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsSplitting(false)} className="flex-1 font-bold text-gray-400">Batal</button>
                <button className="flex-2 bg-secondary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <Share2 size={18} />
                  Bagikan Link
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};
