import { Link } from "wouter";

interface PublicHeaderProps {
  rightContent?: React.ReactNode;
  navigation?: Array<{ label: string; href: string }>;
  actions?: React.ReactNode;
}

export function PublicHeader({ rightContent, navigation, actions }: PublicHeaderProps) {
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
        
        <div className="flex items-center">
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
