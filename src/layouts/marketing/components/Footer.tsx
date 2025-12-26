import { Link } from "wouter";
export function Footer() {
  return (
    <footer className="border-t bg-background py-8 mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/seencel-logo-192.png" 
                alt="Seencel" 
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold text-lg">Seencel</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plataforma integral de gestión para la construcción y arquitectura.
              Gestiona proyectos, equipos y finanzas con IA.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Producto</h3>
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-home"
              >
                Inicio
              </Link>
              <Link 
                href="/register" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-register"
              >
                Crear Cuenta
              </Link>
              <Link 
                href="/login" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-login"
              >
                Iniciar Sesión
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/privacy" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-privacy"
              >
                Política de Privacidad
              </Link>
              <a 
                href="mailto:privacy@seencel.com" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-contact"
              >
                Contacto
              </a>
            </nav>
          </div>
        </div>
        <div className="border-t pt-6">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Seencel. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
