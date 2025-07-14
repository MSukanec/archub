import React from 'react';
import { Phone, Mail, MapPin, User, Calendar, Building } from 'lucide-react';
import { FormSubsectionButton } from './FormSubsectionButton';

// Ejemplo de uso del componente FormSubsectionButton
export function FormSubsectionButtonExample() {
  const handleAddPhoneNumber = () => {
    console.log('Navigating to phone number subform...');
    // Aquí iría la lógica para navegar al subformulario de teléfono
  };

  const handleAddEmail = () => {
    console.log('Navigating to email subform...');
    // Aquí iría la lógica para navegar al subformulario de email
  };

  const handleAddAddress = () => {
    console.log('Navigating to address subform...');
    // Aquí iría la lógica para navegar al subformulario de dirección
  };

  return (
    <div className="space-y-4 p-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">Información de Contacto</h2>
      
      <FormSubsectionButton
        icon={<Phone />}
        title="Phone Number"
        description="Add phone number"
        onClick={handleAddPhoneNumber}
      />

      <FormSubsectionButton
        icon={<Mail />}
        title="Email Address"
        description="Add email address"
        onClick={handleAddEmail}
      />

      <FormSubsectionButton
        icon={<MapPin />}
        title="Address"
        description="Add physical address"
        onClick={handleAddAddress}
      />

      <FormSubsectionButton
        icon={<User />}
        title="Personal Information"
        description="Add personal details"
        onClick={() => console.log('Personal info...')}
      />

      <FormSubsectionButton
        icon={<Calendar />}
        title="Schedule"
        description="Add availability schedule"
        onClick={() => console.log('Schedule...')}
        disabled
      />

      <FormSubsectionButton
        icon={<Building />}
        title="Company Information"
        description="Add company details"
        onClick={() => console.log('Company info...')}
        className="bg-accent/5"
      />
    </div>
  );
}

// Ejemplo de cómo usar el componente en un modal con FormModalLayout
export function ExampleModal() {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Agregar Información</h1>
        <p className="text-muted-foreground mt-2">
          Selecciona qué información deseas agregar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSubsectionButton
          icon={<Phone />}
          title="Teléfono"
          description="Agregar número de teléfono"
          onClick={() => console.log('Teléfono...')}
        />

        <FormSubsectionButton
          icon={<Mail />}
          title="Email"
          description="Agregar dirección de correo"
          onClick={() => console.log('Email...')}
        />

        <FormSubsectionButton
          icon={<MapPin />}
          title="Dirección"
          description="Agregar dirección física"
          onClick={() => console.log('Dirección...')}
        />

        <FormSubsectionButton
          icon={<User />}
          title="Información Personal"
          description="Agregar datos personales"
          onClick={() => console.log('Personal...')}
        />
      </div>
    </div>
  );
}