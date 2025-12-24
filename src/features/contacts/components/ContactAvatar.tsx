import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getContactAvatarUrl } from "@/lib/storage/uploadHelpers";
import { useEffect, useState } from "react";

interface ContactAvatarProps {
  contact: any;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "h-24 w-24"
};

export function ContactAvatar({ 
  contact, 
  className = "",
  size = "md"
}: ContactAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    const loadAvatar = async () => {
      if (contact?.id) {
        const url = await getContactAvatarUrl(contact.id);
        setAvatarUrl(url || "");
      }
    };
    loadAvatar();
  }, [contact?.id]);

  const displayName = `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 'Contacto';
  const initials = displayName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const linkedUserAvatar = contact?.linked_user?.avatar_url;

  return (
    <Avatar className={`${sizeClasses[size]} flex-shrink-0 ${className}`}>
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt={displayName} />
      )}
      {!avatarUrl && linkedUserAvatar && (
        <AvatarImage src={linkedUserAvatar} alt={displayName} />
      )}
      <AvatarFallback>
        {initials || 'C'}
      </AvatarFallback>
    </Avatar>
  );
}
