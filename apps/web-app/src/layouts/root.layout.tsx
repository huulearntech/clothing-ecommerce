import CustomerLayout from "./customer.layout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <CustomerLayout>{children}</CustomerLayout>;
}