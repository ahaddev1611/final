
"use client";
import Link from 'next/link';
import { ReceiptText, UserCircle, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"; // Assuming next-themes is or will be installed
import React, { useEffect, useState } from 'react';


export function AppHeader({ userRole }: { userRole?: 'admin' | 'cashier' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme() ?? {}; // Graceful degradation if useTheme is not available
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  const handleLogout = () => {
    // Mock logout: In a real app, clear session/token
    router.push('/');
  };

  const getUsername = () => {
    if (userRole === 'admin') return 'Admin';
    if (userRole === 'cashier') {
        if (pathname.includes('cashier1')) return 'Cashier 1'; // Example logic
        if (pathname.includes('cashier2')) return 'Cashier 2'; // Example logic
        return 'Cashier';
    }
    return 'User';
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href={userRole === 'admin' ? '/admin/dashboard' : userRole === 'cashier' ? '/cashier/billing' : '/'} className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <ReceiptText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-headline text-xl font-semibold text-foreground">Al-Shawaya</span>
        </Link>
        
        <div className="flex items-center space-x-3">
          {mounted && setTheme && (
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                aria-label="Toggle theme"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
          )}
         
          {userRole && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${getUsername().charAt(0)}`} alt={getUsername()} data-ai-hint="avatar profile" />
                    <AvatarFallback>{getUsername().charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getUsername()}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

// ThemeProvider component to wrap layout
export function ThemeProvider({ children, ...props }: React.PropsWithChildren<import("next-themes/dist/types").ThemeProviderProps>) {
  const NextThemesProvider = require("next-themes").ThemeProvider; // Dynamic import for SSR
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

