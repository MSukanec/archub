export type ModalType = "member" | "movement" | "movement-concept" | "movement-import" | "bitacora" | "contact" | "gallery" | "board" | "card" | "list" | "project" | "project-client" | "document-upload" | "document-folder" | "delete-confirmation";

export interface ModalData {
  [key: string]: any;
}