import { Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, Users, FileText, BarChart3, Shield, Zap, Star, ArrowRight, Github, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const features = [
  {
    icon: Building,
    title: "Gestión de Proyectos",
    description: "Administra todos tus proyectos de construcción desde un solo lugar con herramientas inteligentes"
  },
  {
    icon: Users,
    title: "Colaboración en Tiempo Real",
    description: "Coordina equipos y mantén a todos sincronizados con actualizaciones instantáneas"
  },
  {
    icon: FileText,
    title: "Documentación Técnica",
    description: "Organiza planos, especificaciones y documentos importantes de forma centralizada"
  },
  {
    icon: BarChart3,
    title: "Análisis y Reportes",
    description: "Obtén insights valiosos sobre el progreso de tus proyectos con dashboards intuitivos"
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Tus datos están protegidos con los más altos estándares de seguridad empresarial"
  },
  {
    icon: Zap,
    title: "Rápido y Eficiente",
    description: "Interfaz optimizada para maximizar tu productividad y reducir tiempos de gestión"
  }
];

const stats = [
  { value: "10,000+", label: "Proyectos gestionados" },
  { value: "500+", label: "Empresas confían en nosotros" },
  { value: "99.9%", label: "Tiempo de actividad" },
  { value: "24/7", label: "Soporte disponible" }
];

export default function Landing() {
  const { user, loading, initialized, initialize, logout } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  const getUserInitials = (user: any) => {
    if (!user) return "U";
    const name = user.user_metadata?.full_name || user.email || "Usuario";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
      backgroundColor: 'var(--layout-bg)', 
      color: 'var(--text-default)' 
    }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--layout-border)' }}>
            {/* Logo y navegación izquierda */}
              </div>
              
                <a 
                  href="#features" 
                  style={{ color: 'var(--text-muted)' }}
                >
                  Características
                </a>
                <a 
                  href="#pricing" 
                  style={{ color: 'var(--text-muted)' }}
                >
                  Precios
                </a>
                <a 
                  href="#contact" 
                  style={{ color: 'var(--text-muted)' }}
                >
                  Contacto
                </a>
              </nav>
            </div>

            {/* Navegación derecha */}
              {!loading && (
                user ? (
                  // Usuario autenticado
                    <Link href="/dashboard">
                      <Button 
                        size="sm" 
                        style={{ 
                          backgroundColor: 'var(--accent)', 
                          color: 'var(--accent-text)',
                          border: 'none'
                        }}
                      >
                        Dashboard
                      </Button>
                    </Link>

                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback 
                          style={{ 
                            backgroundColor: 'var(--card-bg)', 
                            color: 'var(--text-default)' 
                          }}
                        >
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Dropdown menu oculto por ahora, se puede implementar después */}
                           style={{ 
                             backgroundColor: 'var(--popover-bg)', 
                             border: '1px solid var(--layout-border)' 
                           }}>
                        <button
                          onClick={logout}
                          style={{ color: 'var(--text-default)' }}
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Usuario no autenticado
                    <Link href="/login">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        style={{ 
                          backgroundColor: 'var(--button-ghost-bg)',
                          color: 'var(--button-ghost-text)',
                          border: 'none'
                        }}
                      >
                        Iniciar Sesión
                      </Button>
                    </Link>
                    
                    <Link href="/register">
                      <Button 
                        size="sm" 
                        style={{ 
                          backgroundColor: 'var(--accent)', 
                          color: 'var(--accent-text)',
                          border: 'none'
                        }}
                      >
                        Comenzar Gratis
                      </Button>
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
              {[...Array(5)].map((_, i) => (
                  fill: 'var(--accent)', 
                  color: 'var(--accent)' 
                }} />
              ))}
            </div>
              Calificado 5/5 por más de 500 empresas
            </span>
          </div>
          
            Gestiona tus proyectos de{" "}
            <span style={{ color: 'var(--accent)' }}>
              construcción
            </span>
            {" "}de forma inteligente
          </h1>
          
            La plataforma completa para administrar proyectos de construcción. 
            Controla presupuestos, coordina equipos, gestiona documentos y 
            supervisa el progreso de tus obras en tiempo real.
          </p>
          
            <Link href="/register">
              <Button 
                size="lg" 
                style={{ 
                  backgroundColor: 'var(--accent)', 
                  color: 'var(--accent-text)',
                  border: 'none'
                }}
              >
                Comenzar Gratis
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              style={{ 
                backgroundColor: 'var(--button-secondary-bg)', 
                color: 'var(--button-secondary-text)',
                border: '1px solid var(--layout-border)'
              }}
            >
              Ver Demo
            </Button>
          </div>

          {/* Stats */}
            {stats.map((stat, index) => (
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
              Todo lo que necesitas para gestionar construcción
            </h2>
              Una suite completa de herramientas diseñadas específicamente para la industria de la construcción
            </p>
          </div>
          
            {features.map((feature, index) => (
              <div 
                key={index} 
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--card-border)' 
                }}
              >
                  <feature.icon 
                    style={{ color: 'var(--accent)' }} 
                  />
                </div>
                  {feature.title}
                </h3>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
              Comienza a gestionar tus proyectos hoy mismo
            </h2>
              Únete a miles de empresas que ya optimizan sus procesos constructivos con Archub
            </p>
              <Link href="/register">
                <Button 
                  size="lg" 
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: 'var(--accent-text)',
                    border: 'none'
                  }}
                >
                  Comenzar Gratis
                </Button>
              </Link>
                Sin tarjeta de crédito requerida
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
            </div>
              © 2025 Archub. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}