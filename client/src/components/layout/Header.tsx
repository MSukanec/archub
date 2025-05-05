import { useState } from "react";
import { useLocation } from "wouter";
import { ProfileMenu } from "@/components/common/ProfileMenu";
import { Button } from "@/components/ui/button";
import { LucideBell, LucideMenu, LucidePlus, LucideSearch, LucideZap } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

interface HeaderProps {
  toggleSidebar?: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Query for user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  return (
    <header className="z-30 bg-white border-b sticky top-0 w-full h-16">
      <div className="flex items-center justify-between px-5 h-full">
        {/* Left section with app logo */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={toggleSidebar}
          >
            <LucideMenu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="flex items-center">
            <LucideZap className="h-6 w-6 text-primary mr-2" />
            <span className="font-medium text-gray-800">
              {APP_NAME}
            </span>
          </div>

          <div className="rounded-md border border-gray-200 px-3 py-1 flex items-center max-w-md w-64 h-9 hidden md:flex">
            <LucideSearch className="h-4 w-4 text-gray-400 mr-2" />
            <Input 
              className="border-0 focus-visible:ring-0 focus-visible:ring-transparent p-0 text-sm h-6 placeholder:text-gray-400"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right section with actions and user profile */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-700 hidden md:flex"
            onClick={() => {
              if (location.includes('/materials')) {
                setLocation('/materials/new');
              } else if (location.includes('/tasks')) {
                setLocation('/tasks/new');
              } else if (location.includes('/budgets')) {
                setLocation('/budgets/new');
              }
            }}
          >
            <LucidePlus className="h-4 w-4 mr-2" />
            {location.includes('/materials') ? 'Nuevo Material' : 
             location.includes('/tasks') ? 'Nueva Tarea' : 
             location.includes('/budgets') ? 'Nuevo Presupuesto' : 'Nuevo'}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setLocation('/notifications')}
          >
            <LucideBell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <ProfileMenu user={user || null} />
        </div>
      </div>
    </header>
  );
}
