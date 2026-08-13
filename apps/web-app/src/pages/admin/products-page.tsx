import ProductManagement from "./components/product-management";
import ProductModal from "./components/product-modal";
import { useState, useEffect } from "react";
import { catalogService } from "../../services/catalog.service";
import type { Product } from "../../services/types";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function AdminProductsPage() {
  usePageTitle(
    "Admin Products Management",
    "StyleShop Catalog & Product Management Administration."
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    catalogService
      .getProducts()
      .then((res) => {
        if (Array.isArray(res)) {
          setProducts(res);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch products from API:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (productData.id) {
        const { id, ...payload } = productData;
        const updated = await catalogService.updateProduct(id, payload);
        setProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      } else {
        const created = await catalogService.createProduct(productData);
        setProducts((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save product:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product from store catalog?")) {
      try {
        await catalogService.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Failed to delete product:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ProductManagement
          products={products}
          onAddProduct={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          onEditProduct={(product) => {
            setSelectedProduct(product);
            setIsModalOpen(true);
          }}
          onDeleteProduct={handleDeleteProduct}
        />

        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          initialData={selectedProduct}
        />
      </div>
    </div>
  );
}
