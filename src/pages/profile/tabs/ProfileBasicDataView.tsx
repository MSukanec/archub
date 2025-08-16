interface ProfileBasicDataViewProps {
  user: any;
}

export function ProfileBasicDataView({ user }: ProfileBasicDataViewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-muted-foreground">
          Datos Básicos del Perfil
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Contenido en desarrollo...
        </p>
      </div>
    </div>
  );
}