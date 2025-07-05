# AI Modal Template - Archub

## Componente base
Todos los modales deben seguir esta estructura:

```tsx
<CustomModal
  title={editingItem ? "Editar Movimiento" : "Nuevo Movimiento"}
  open={open}
  onClose={handleClose}
>
  <form onSubmit={handleSubmit(onSubmit)}>
    <CustomModalBody>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ejemplo de campo al 50% */}
        <div className="col-span-1">
          <Input label="Nombre" {...register("name")} />
        </div>

        {/* Ejemplo de campo al 100% */}
        <div className="col-span-2">
          <Textarea label="Descripción" {...register("description")} />
        </div>
      </div>
    </CustomModalBody>

    <CustomModalFooter
      onClose={handleClose}
      isSubmitting={isSubmitting}
    />
  </form>
</CustomModal>
Comportamientos obligatorios
El formulario debe ser controlado con react-hook-form

Al abrir el modal en modo edición (editingItem), los campos deben precargarse con form.reset(...)

Al cerrar el modal, debe resetearse el formulario (opcional: en onClose)

El botón de guardar debe desactivarse mientras se envía (isSubmitting)

El modal debe funcionar tanto para crear como para editar

Estilo visual

Todos los campos deben tener separación y alineación vertical consistente

Componentes compatibles
<Input /> para campos de texto

<Select /> o <CustomSelect /> para opciones

<Textarea /> para textos largos

<Switch /> para booleanos

<DatePicker /> para fechas

<FileInput /> si se requieren archivos

## Asegurate de que el modal NUNCA este dentro del Layout de la página, y que no haya errores de SELECT ITEM. ##