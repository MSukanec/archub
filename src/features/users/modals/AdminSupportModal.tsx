/**
 * 💬 SupportModal - Modal wrapper para chat de soporte
 */

import { Headphones } from 'lucide-react'
import { FormModalLayout, FormModalHeader } from '@/components/modal'
import { ChatPanel, FooterPanel, useSupportChat } from '../forms/AdminSupportForm'

interface SupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userFullName: string
  userAvatarUrl?: string
}

export function AdminSupportModal({ open, onOpenChange, userId, userFullName, userAvatarUrl }: SupportModalProps) {
  const {
    messages,
    isLoading,
    inputValue,
    setInputValue,
    handleSendMessage,
    isPending,
    scrollAreaRef,
    textareaRef,
  } = useSupportChat({ userId, open })

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!open) return null

  const headerContent = (
    <FormModalHeader
      title="Soporte"
      description="Contacta con nuestro equipo para ayuda o feedback"
      icon={Headphones}
    />
  )

  const editPanel = (
    <div className="flex flex-col h-[calc(80vh-180px)] bg-[var(--content-bg)]">
      <ChatPanel
        messages={messages}
        isLoading={isLoading}
        userFullName={userFullName}
        userAvatarUrl={userAvatarUrl}
        scrollAreaRef={scrollAreaRef}
      />
    </div>
  )

  const footerContent = (
    <FooterPanel
      inputValue={inputValue}
      setInputValue={setInputValue}
      onSend={handleSendMessage}
      isPending={isPending}
      textareaRef={textareaRef}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
      wide={true}
    />
  )
}
