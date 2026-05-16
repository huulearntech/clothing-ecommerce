import Header from "@/components/header"
import Footer from "@/components/footer"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header className="static border-b border-2" />
      {children}
      <Footer />
    </>
  );
}