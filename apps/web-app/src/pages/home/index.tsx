import RootLayout from "../../layouts/root.layout";
import HeroBanner from "./components/hero-banner";
import CategorySection from "./components/category-section";
import FeaturedProducts from "./components/featured-products";
import PromoFeatures from "./components/promo-features";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function Home() {
  usePageTitle(
    "Home - Premium Apparel Store",
    "Discover trending shirts, pants, and accessories at StyleShop. High-quality fashion with fast checkout."
  );

  return (
    <RootLayout>
      <main className="space-y-0">
        {/* 1. Hero Banner with CTA */}
        <HeroBanner />

        {/* 2. Key Benefits Bar */}
        <PromoFeatures />

        {/* 3. Category Showcase (Top-half, Bottom-half, Accessories) */}
        <CategorySection />

        {/* 4. Featured Product Catalog Cards */}
        <FeaturedProducts />
      </main>
    </RootLayout>
  );
}