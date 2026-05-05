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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupervisorsStore } from "@/data/supervisorsStore";

export interface RoomFormValues {
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
}

const defaults: RoomFormValues = {
  room: "",
  className: "",
  students: 30,
  present: 0,
  absent: 0,
  floor: "",
  building: "",
  supervisor: "",
  startTime: "",
  endTime: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (v: RoomFormValues) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: Partial<RoomFormValues>;
}

const RoomFormDialog = ({ open, onOpenChange, onSubmit, title, description, submitLabel, initialValues }: Props) => {
  const supervisors = useSupervisorsStore();
  const [values, setValues] = useState<RoomFormValues>(defaults);
  const [errors, setErrors] = useState<Partial<Record<keyof RoomFormValues, string>>>({});

  useEffect(() => {
    if (!open) return;
    setValues({ ...defaults, ...initialValues });
    setErrors({});
  }, [open, initialValues]);

  const handleNum = (k: "students" | "present" | "absent", v: string) =>
    setValues((p) => ({ ...p, [k]: Math.max(0, Number(v) || 0) }));

  const validate = () => {
    const e: Partial<Record<keyof RoomFormValues, string>> = {};
    if (!values.room.trim()) e.room = "Nhập tên phòng";
    if (!values.className.trim()) e.className = "Nhập lớp";
    if (!values.supervisor.trim()) e.supervisor = "Chọn giám thị";
    if (!values.startTime) e.startTime = "Chọn thời gian bắt đầu";
    if (!values.endTime) e.endTime = "Chọn thời gian kết thúc";
    if (values.present + values.absent !== values.students) e.students = "Có mặt + vắng phải bằng tổng SV";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
              { key: "room", label: "Phòng thi", type: "text" },
              { key: "className", label: "Lớp", type: "text" },
              { key: "floor", label: "Tầng", type: "text" },
              { key: "building", label: "Tòa nhà", type: "text" },
              { key: "startTime", label: "Bắt đầu", type: "datetime-local" },
              { key: "endTime", label: "Kết thúc", type: "datetime-local" },
            ].map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  type={f.type}
                  value={values[f.key as keyof RoomFormValues] as string}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                />
                {errors[f.key as keyof RoomFormValues] && (
                  <p className="text-sm text-destructive">{errors[f.key as keyof RoomFormValues]}</p>
                )}
              </div>
            ))}

            <div className="space-y-2 md:col-span-2">
              <Label>Giám thị</Label>
              <Select
                value={values.supervisor}
                onValueChange={(v) => setValues((p) => ({ ...p, supervisor: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={supervisors.length ? "Chọn giám thị từ danh sách" : "Chưa có giám thị — thêm tại trang Giám thị"} />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name} — {s.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supervisor && <p className="text-sm text-destructive">{errors.supervisor}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: "students", label: "Tổng sinh viên" },
              { key: "present", label: "Có mặt" },
              { key: "absent", label: "Vắng mặt" },
            ].map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  type="number"
                  min="0"
                  value={values[f.key as keyof RoomFormValues] as number}
                  onChange={(e) => handleNum(f.key as "students" | "present" | "absent", e.target.value)}
                />
                {f.key === "students" && errors.students && <p className="text-sm text-destructive">{errors.students}</p>}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomFormDialog;
