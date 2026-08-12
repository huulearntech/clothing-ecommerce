import { X, Ruler } from "lucide-react";

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string; // e.g. "top-half" or "bottom-half"
}

export default function SizeChartModal({ isOpen, onClose, category }: SizeChartModalProps) {
  if (!isOpen) return null;

  const isTopHalf = category.toLowerCase().includes("top");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Ruler className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isTopHalf ? "Top-Half Size Chart (Shirts & Polos)" : "Bottom-Half Size Chart (Jeans & Pants)"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Measurements are given in inches. For the best fit, measure your body and compare with the guide below.
          </p>

          {/* Size Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                {isTopHalf ? (
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3">Chest (in)</th>
                    <th className="p-3">Length (in)</th>
                    <th className="p-3">Shoulder (in)</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="p-3">Waist Size</th>
                    <th className="p-3">Waist (in)</th>
                    <th className="p-3">Hip (in)</th>
                    <th className="p-3">Inseam (in)</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                {isTopHalf ? (
                  <>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">S</td>
                      <td className="p-3">36 - 38</td>
                      <td className="p-3">27.5</td>
                      <td className="p-3">16.5</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">M</td>
                      <td className="p-3">39 - 41</td>
                      <td className="p-3">28.5</td>
                      <td className="p-3">17.5</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">L</td>
                      <td className="p-3">42 - 44</td>
                      <td className="p-3">29.5</td>
                      <td className="p-3">18.5</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">XL</td>
                      <td className="p-3">45 - 47</td>
                      <td className="p-3">30.5</td>
                      <td className="p-3">19.5</td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">28 - 29</td>
                      <td className="p-3">28 - 29.5</td>
                      <td className="p-3">35 - 36.5</td>
                      <td className="p-3">30</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">30 - 31</td>
                      <td className="p-3">30 - 31.5</td>
                      <td className="p-3">37 - 38.5</td>
                      <td className="p-3">31</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">32 - 33</td>
                      <td className="p-3">32 - 33.5</td>
                      <td className="p-3">39 - 40.5</td>
                      <td className="p-3">32</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">34 - 36</td>
                      <td className="p-3">34 - 36.5</td>
                      <td className="p-3">41 - 43.5</td>
                      <td className="p-3">32</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
