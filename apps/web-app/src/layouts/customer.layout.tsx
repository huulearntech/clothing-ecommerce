import Header from "../components/ui/header";
import Footer from "../components/ui/footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
