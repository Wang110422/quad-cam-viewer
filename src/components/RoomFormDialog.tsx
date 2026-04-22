import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface RoomFormValues {
  name: string;
  room: string;
  className: string;
  students: number;
  present: number;
  absent: number;
  floor: string;
  building: string;
  supervisor: string;
  startTime: string;
  endTime: string;
  notes: string;
  videoFile: File | null;
}

const defaultValues: RoomFormValues = {
  name: "",
  room: "",
  className: "",
  students: 0,
  present: 0,
  absent: 0,
  floor: "",
  building: "",
  supervisor: "",
  startTime: "",
  endTime: "",
  notes: "",
  videoFile: null,
};

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RoomFormValues) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: Partial<RoomFormValues>;
  requireVideo?: boolean;
}

const RoomFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  submitLabel,
  initialValues,
  requireVideo = false,
}: RoomFormDialogProps) => {
  const [values, setValues] = useState<RoomFormValues>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof RoomFormValues, string>>>({});

  useEffect(() => {
    if (!open) return;

    setValues({
      ...defaultValues,
      ...initialValues,
      videoFile: null,
    });
    setErrors({});
  }, [initialValues, open]);

  const handleNumberChange = (field: "students" | "present" | "absent", value: string) => {
    const nextValue = Math.max(0, Number(value) || 0);
    setValues((prev) => ({ ...prev, [field]: nextValue }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof RoomFormValues, string>> = {};

    if (!values.name.trim()) nextErrors.name = "Vui lòng nhập tên camera";
    if (!values.room.trim()) nextErrors.room = "Vui lòng nhập phòng thi";
    if (!values.className.trim()) nextErrors.className = "Vui lòng nhập lớp";
    if (!values.supervisor.trim()) nextErrors.supervisor = "Vui lòng nhập giám thị";
    if (!values.startTime) nextErrors.startTime = "Vui lòng nhập thời gian bắt đầu";
    if (!values.endTime) nextErrors.endTime = "Vui lòng nhập thời gian kết thúc";
    if (requireVideo && !values.videoFile) nextErrors.videoFile = "Vui lòng tải video phòng thi";
    if (values.present + values.absent !== values.students) {
      nextErrors.students = "Tổng có mặt và vắng mặt phải bằng số sinh viên";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-border bg-card text-card-foreground sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: "name", label: "Tên camera", type: "text" },
              { key: "room", label: "Phòng thi", type: "text" },
              { key: "className", label: "Lớp", type: "text" },
              { key: "supervisor", label: "Giám thị", type: "text" },
              { key: "floor", label: "Tầng", type: "text" },
              { key: "building", label: "Tòa nhà", type: "text" },
              { key: "startTime", label: "Bắt đầu", type: "datetime-local" },
              { key: "endTime", label: "Kết thúc", type: "datetime-local" },
            ].map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={values[field.key as keyof RoomFormValues] as string}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: event.target.value,
                    }))
                  }
                />
                {errors[field.key as keyof RoomFormValues] && (
                  <p className="text-sm text-destructive">{errors[field.key as keyof RoomFormValues]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: "students", label: "Tổng sinh viên" },
              { key: "present", label: "Có mặt" },
              { key: "absent", label: "Vắng mặt" },
            ].map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type="number"
                  min="0"
                  value={values[field.key as keyof RoomFormValues] as number}
                  onChange={(event) => handleNumberChange(field.key as "students" | "present" | "absent", event.target.value)}
                />
                {field.key === "students" && errors.students && <p className="text-sm text-destructive">{errors.students}</p>}
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_320px]">
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={values.notes}
                onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Mô tả nhanh về vị trí camera hoặc ghi chú phòng thi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoFile">Video camera</Label>
              <Input
                id="videoFile"
                type="file"
                accept="video/*"
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    videoFile: event.target.files?.[0] ?? null,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Hỗ trợ video dùng để phát trực tiếp trong ô camera.
              </p>
              {errors.videoFile && <p className="text-sm text-destructive">{errors.videoFile}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomFormDialog;