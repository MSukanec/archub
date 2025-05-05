import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LucidePlus } from "lucide-react";

interface Task {
  id: number;
  name: string;
  unit: string;
  unitPrice: number;
}

interface AddTaskFormProps {
  tasks: Task[];
  onAddTask: (taskId: number, quantity: number) => void;
  isSubmitting?: boolean;
}

// Form schema
const taskFormSchema = z.object({
  taskId: z.string().min(1, "Selecciona una tarea"),
  quantity: z.string().min(1, "La cantidad es requerida").transform(Number),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export function AddTaskForm({ tasks, onAddTask, isSubmitting = false }: AddTaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      taskId: "",
      quantity: "",
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    onAddTask(parseInt(data.taskId), data.quantity);
    form.reset({ taskId: "", quantity: "" });
  };

  const selectedTaskId = form.watch("taskId");
  const selectedTask = tasks.find(task => task.id.toString() === selectedTaskId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <FormField
            control={form.control}
            name="taskId"
            render={({ field }) => (
              <FormItem className="md:col-span-7">
                <FormLabel>Tarea</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tarea" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.name} ({task.unit})
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
            name="quantity"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Cantidad</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2 flex items-end">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              <LucidePlus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>
        </div>

        {selectedTask && (
          <div className="mt-2 text-sm text-muted-foreground">
            Precio unitario: ${selectedTask.unitPrice.toFixed(2)} / {selectedTask.unit}
          </div>
        )}
      </form>
    </Form>
  );
}
