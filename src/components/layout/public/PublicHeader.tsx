import { useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface PublicHeaderProps {
  rightContent?: React.ReactNode;
  navigation?: Array<{ label: string; href: string }>;
  actions?: React.ReactNode;
}

export function PublicHeader({ rightContent, navigation, actions }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
            <img 
              src="/Seencel512_b.png" 
              alt="Seencel" 
              className="h-7 w-7 object-contain"
            />
            <span className="font-bold text-lg">Seencel</span>
          </Link>
          
          {/* Desktop Navigation */}
          {navigation && navigation.length > 0 && (
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <a 
                  key={item.href}
                  href={item.href} 
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mobile Menu */}
          {navigation && navigation.length > 0 && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menú</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  {navigation.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                      data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}

          {/* Actions or Right Content */}
          {actions || (rightContent && (
            <div className="text-sm text-muted-foreground">
              {rightContent}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
