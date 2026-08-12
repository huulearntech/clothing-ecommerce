import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "./tmp-components/dashboard-sidebar";
import DashboardHeader from "./tmp-components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar variant="inset"/>
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-col flex-1 px-4 py-3"> {children} </div>
      </SidebarInset>
    </SidebarProvider>
  );
}