import { Minus, Plus, Trash2 } from "lucide-react";

export interface CartCardItemProps {
  item: {
    id: string;
    productId?: string;
    variantId?: string;
    name: string;
    category: string;
    size: string;
    color: string;
    price: number;
    quantity: number;
    image: string;
  };
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export default function CartCardItem({
  item,
  selected = false,
  onToggleSelect,
  onUpdateQuantity,
  onRemove,
}: CartCardItemProps) {
  const targetId = item.productId || item.id;

  return (
    <div className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
      selected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
    }`}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(item.id)}
            aria-label={`Select ${item.name}`}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
          />
        )}
        <a href={`/products/${targetId}`} className="block shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
          />
        </a>
        <div>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            {item.category}
          </span>
          <a href={`/products/${targetId}`} className="block">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-snug hover:text-indigo-600 transition-colors">
              {item.name}
            </h3>
          </a>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>
              Size:{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {item.size}
              </strong>
            </span>
            <span>•</span>
            <span>
              Color:{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {item.color}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
          <button
            onClick={() => onUpdateQuantity(item.id, -1)}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-3 text-xs font-semibold text-slate-900 dark:text-white min-w-[2rem] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="text-right min-w-[5.5rem]">
          <p className="text-base font-bold text-slate-900 dark:text-white">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400">
            ${item.price.toFixed(2)} each
          </p>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          title="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
