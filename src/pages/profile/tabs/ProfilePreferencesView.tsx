interface ProfilePreferencesViewProps {
  user: any;
}

export function ProfilePreferencesView({ user }: ProfilePreferencesViewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-muted-foreground">
          Preferencias del Perfil
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Contenido en desarrollo...
        </p>
      </div>
    </div>
  );
}