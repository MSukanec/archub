import { Link } from "wouter";

interface PublicHeaderProps {
  rightContent?: React.ReactNode;
}

export function PublicHeader({ rightContent }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
            <img 
              src="/Seencel512.png" 
              alt="Seencel" 
              className="h-7 w-7 object-contain"
            />
            <span className="font-bold text-lg">Seencel</span>
          </a>
        </Link>
        {rightContent && (
          <div className="text-sm text-muted-foreground">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
