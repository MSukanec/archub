import React from 'react';
import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageCircle } from 'lucide-react';

interface Contact {
  id: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string;
  location?: string;
}

interface ContactModalProps {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
}

export function ContactModal({ contact, open, onClose }: ContactModalProps) {
  if (!contact) return null;

  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
  const initials = `${contact.first_name.charAt(0)}${contact.last_name?.charAt(0) || ''}`.toUpperCase();

  const handleWhatsApp = () => {
    if (contact.phone) {
      // Remove any non-numeric characters and format for WhatsApp
      const cleanPhone = contact.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      const emailUrl = `mailto:${contact.email}`;
      window.location.href = emailUrl;
    }
  };

  const handleCall = () => {
    if (contact.phone) {
      const telUrl = `tel:${contact.phone}`;
      window.location.href = telUrl;
    }
  };

  // Create contact methods array based on available data
  const contactMethods = [];

  if (contact.phone) {
    contactMethods.push(
      {
        id: 'whatsapp',
        title: 'WhatsApp',
        subtitle: contact.phone,
        icon: MessageCircle,
        onClick: handleWhatsApp,
        color: 'text-green-600',
        bgColor: 'bg-green-50 hover:bg-green-100',
      },
      {
        id: 'call',
        title: 'Llamar',
        subtitle: contact.phone,
        icon: Phone,
        onClick: handleCall,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 hover:bg-blue-100',
      }
    );
  }

  if (contact.email) {
    contactMethods.push({
      id: 'email',
      title: 'Email',
      subtitle: contact.email,
      icon: Mail,
      onClick: handleEmail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
    });
  }

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title="Contactar"
            description={`Elige cómo contactar a ${fullName}`}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <div className="space-y-4">
              {/* Contact info header */}
              <div className="flex items-center gap-3 p-4 bg-[var(--muted)] rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" alt={fullName} />
                  <AvatarFallback className="bg-[var(--accent-bg)] text-[var(--accent-fg)]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-[var(--foreground)]">{fullName}</h3>
                  {contact.company_name && (
                    <p className="text-sm text-[var(--muted-foreground)]">{contact.company_name}</p>
                  )}
                  {contact.location && (
                    <p className="text-xs text-[var(--muted-foreground)]">{contact.location}</p>
                  )}
                </div>
              </div>

              {/* Contact methods */}
              {contactMethods.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[var(--foreground)]">
                    Métodos de contacto disponibles
                  </h4>
                  <div className="grid gap-3">
                    {contactMethods.map((method) => {
                      const IconComponent = method.icon;
                      return (
                        <Card
                          key={method.id}
                          className={`cursor-pointer transition-all duration-200 ${method.bgColor} border-[var(--border)] hover:border-[var(--accent)] hover:shadow-sm`}
                          onClick={method.onClick}
                        >
                          <CardContent className="flex items-center gap-3 p-4">
                            <div className={`p-2 rounded-full bg-white ${method.color}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-[var(--foreground)]">{method.title}</h5>
                              <p className="text-sm text-[var(--muted-foreground)]">{method.subtitle}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[var(--muted-foreground)]">
                    No hay métodos de contacto disponibles para este contacto.
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Agrega un teléfono o email para poder contactar.
                  </p>
                </div>
              )}
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter onCancel={onClose} />
        ),
      }}
    </CustomModalLayout>
  );
}