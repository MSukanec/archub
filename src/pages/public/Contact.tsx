import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MarketingLayout } from "@/layouts/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Phone, MapPin, Send, Building2, CheckCircle, Loader2 } from "lucide-react";
const countries = [
  { code: "AR", name: "Argentina", phone: "+54" },
  { code: "MX", name: "México", phone: "+52" },
  { code: "CO", name: "Colombia", phone: "+57" },
  { code: "CL", name: "Chile", phone: "+56" },
  { code: "PE", name: "Perú", phone: "+51" },
  { code: "EC", name: "Ecuador", phone: "+593" },
  { code: "UY", name: "Uruguay", phone: "+598" },
  { code: "PY", name: "Paraguay", phone: "+595" },
  { code: "BO", name: "Bolivia", phone: "+591" },
  { code: "VE", name: "Venezuela", phone: "+58" },
  { code: "BR", name: "Brasil", phone: "+55" },
  { code: "ES", name: "España", phone: "+34" },
  { code: "US", name: "Estados Unidos", phone: "+1" },
  { code: "OTHER", name: "Otro país", phone: "" },
];
const contactFormSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresa un email válido"),
  company: z.string().optional(),
  phone: z.string().min(6, "Ingresa un número de teléfono válido"),
  country: z.string().min(1, "Selecciona tu país"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres").max(2000, "El mensaje es demasiado largo"),
  honeypot: z.string().max(0, "Error de validación"),
});
type ContactFormData = z.infer<typeof contactFormSchema>;
export default function Contact() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formStartTime = useRef(Date.now());
  const contactTokenRef = useRef<string | null>(null);
  const tokenQuery = useQuery<{ token: string; expiresIn: number }>({
    queryKey: ['/api/contact/token'],
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (tokenQuery.data?.token) {
      contactTokenRef.current = tokenQuery.data.token;
    }
  }, [tokenQuery.data]);
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
      country: "",
      message: "",
      honeypot: "",
    },
  });
  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (data.honeypot) {
        throw new Error("Validación de seguridad fallida");
      }
      const timeTaken = Date.now() - formStartTime.current;
      if (timeTaken < 3000) {
        throw new Error("Por favor, espera unos segundos antes de enviar el formulario");
      }
      const currentToken = contactTokenRef.current;
      if (!currentToken) {
        throw new Error("Error de seguridad. Por favor, recarga la página e intenta de nuevo.");
      }
      const response = await apiRequest("POST", "/api/contact", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company || "",
        phone: data.phone,
        country: data.country,
        message: data.message,
        honeypot: data.honeypot || "",
        formStartTime: formStartTime.current,
        submittedAt: Date.now(),
        contactToken: currentToken,
      });
      return response;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      contactTokenRef.current = null;
      tokenQuery.refetch();
      toast({
        title: "Mensaje enviado",
        description: "Gracias por contactarnos. Te responderemos pronto.",
      });
    },
    onError: (error: any) => {
      tokenQuery.refetch();
      toast({
        title: "Error al enviar",
        description: error.message || "Hubo un problema al enviar tu mensaje. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });
  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };
  if (isSubmitted) {
    return (
      <MarketingLayout
        headerNavigation={[
          { label: "Cursos", href: "/cursos" },
          { label: "Fundadores", href: "/founders" },
          { label: "Precios", href: "/precios" },
          { label: "Contacto", href: "/contact" },
        ]}
        seo={{
          title: "Mensaje Enviado - Seencel",
          description: "Tu mensaje ha sido enviado exitosamente.",
        }}
      >
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">¡Mensaje Enviado!</h1>
            <p className="text-muted-foreground text-lg">
              Gracias por contactarnos. Nuestro equipo revisará tu mensaje y te responderá 
              a la brevedad posible.
            </p>
            <Button asChild className="mt-4">
              <a href="/">Volver al Inicio</a>
            </Button>
          </div>
        </div>
      </MarketingLayout>
    );
  }
  return (
    <MarketingLayout
      headerNavigation={[
        { label: "Cursos", href: "/cursos" },
        { label: "Fundadores", href: "/founders" },
        { label: "Precios", href: "/precios" },
        { label: "Contacto", href: "/contact" },
      ]}
      seo={{
        title: "Contacto - Seencel",
        description: "Ponte en contacto con el equipo de Seencel. Estamos aquí para ayudarte con tus proyectos de construcción.",
        ogTitle: "Contacto - Seencel",
        ogDescription: "Contacta al equipo de Seencel para consultas sobre gestión de proyectos de construcción.",
      }}
    >
      <div className="min-h-[calc(100vh-80px)] flex items-center py-12">
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight">Contáctanos</h1>
                <p className="text-muted-foreground">
                  ¿Tienes preguntas sobre Seencel? ¿Necesitas ayuda con tu proyecto? 
                  Estamos aquí para ayudarte.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a 
                      href="mailto:contacto@seencel.com" 
                      className="text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      contacto@seencel.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Empresas</p>
                    <p className="text-sm text-muted-foreground">
                      Planes empresariales y demos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    <p className="text-sm text-muted-foreground">
                      Buenos Aires, Argentina
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-4 border-t">
                Responderemos en un plazo de 24-48 horas hábiles.
              </p>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Tu nombre" 
                                {...field} 
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Tu apellido" 
                                {...field} 
                                data-testid="input-last-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="tu@email.com" 
                              {...field} 
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nombre de tu empresa" 
                              {...field} 
                              data-testid="input-company"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-country">
                                  <SelectValue placeholder="Selecciona tu país" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono *</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="+54 11 1234-5678" 
                                {...field} 
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensaje *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Cuéntanos cómo podemos ayudarte..."
                              className="min-h-[100px] resize-none"
                              {...field} 
                              data-testid="textarea-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px'}}>
                      <label htmlFor="website">No llenar este campo</label>
                      <input
                        type="text"
                        id="website"
                        {...form.register("honeypot")}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-contact"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensaje
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Al enviar este formulario, aceptas nuestra{" "}
                      <a href="/privacy" className="underline hover:text-accent">
                        Política de Privacidad
                      </a>
                      .
                    </p>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
