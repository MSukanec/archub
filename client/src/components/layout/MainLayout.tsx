import { useState, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MainLayoutProps {
  children: ReactNode;
  mobileSidebarOpen?: boolean;
  onMobileSidebarOpenChange?: (open: boolean) => void;
}

export function MainLayout({ 
  children,
  mobileSidebarOpen,
  onMobileSidebarOpenChange
}: MainLayoutProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  // Handle mobile sidebar if we're controlling it from outside
  const [internalMobileSidebarOpen, setInternalMobileSidebarOpen] = useState(false);
  const sidebarOpen = mobileSidebarOpen !== undefined ? mobileSidebarOpen : internalMobileSidebarOpen;
  const setSidebarOpen = onMobileSidebarOpenChange || setInternalMobileSidebarOpen;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="flex w-full">
        {/* Desktop Sidebar */}
        <div className="fixed left-0 top-0 h-full z-20">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-[300px] p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col ml-16 transition-all duration-200 w-full">
          <Header 
            toggleSidebar={toggleSidebar} 
            currentProjectId={selectedProjectId}
            onProjectChange={handleProjectChange}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Budget Creation Dialog */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent className="max-w-3xl">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Crear nuevo presupuesto</h2>
            {/* Budget form would go here */}
            <div className="flex justify-end gap-2 mt-4">
              <button 
                className="px-4 py-2 border rounded-md"
                onClick={() => setIsBudgetDialogOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-primary text-white rounded-md"
                onClick={() => {
                  setIsBudgetDialogOpen(false);
                  setLocation(`/projects/${selectedProjectId}/budgets/new`);
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
