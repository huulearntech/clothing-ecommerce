import { ShoppingCart, Trash2 } from "lucide-react";

export interface WishlistItemProps {
  item: {
    id: string;
    productId?: string;
    variantId?: string;
    name: string;
    category: string;
    size: string;
    color: string;
    price: number;
    originalPrice?: number;
    inStock: boolean;
    image: string;
  };
  addedToCart?: boolean;
  onAddToCart: (item: WishlistItemProps["item"]) => void;
  onRemove: (id: string) => void;
}

export default function WishlistCard({
  item,
  addedToCart,
  onAddToCart,
  onRemove,
}: WishlistItemProps) {
  const targetId = item.productId || item.id;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-5">
      <div className="flex gap-4">
        <a href={`/products/${targetId}`} className="block shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-24 h-24 rounded-xl object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
          />
        </a>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            {item.category}
          </span>
          <a href={`/products/${targetId}`} className="block">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1 mt-0.5 hover:text-indigo-600 transition-colors">
              {item.name}
            </h3>
          </a>
          <p className="text-xs text-slate-400 mt-1">
            Size: {item.size} • Color: {item.color}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              ${item.price.toFixed(2)}
            </span>
            {item.originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                ${item.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onAddToCart(item)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            addedToCart
              ? "bg-emerald-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {addedToCart ? "Added to Cart!" : "Move to Cart"}
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
          title="Remove from wishlist"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
