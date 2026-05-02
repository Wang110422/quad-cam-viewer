import { type FormEvent, useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoomsStore } from "@/data/roomsStore";

export interface CameraFormValues {
  name: string;
  roomId: number | null;
  notes: string;
  videoFile: File | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CameraFormValues) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: Partial<CameraFormValues>;
  requireVideo?: boolean;
}

const defaults: CameraFormValues = { name: "", roomId: null, notes: "", videoFile: null };

const CameraFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  submitLabel,
  initialValues,
  requireVideo = false,
}: Props) => {
  const rooms = useRoomsStore();
  const [values, setValues] = useState<CameraFormValues>(defaults);
  const [errors, setErrors] = useState<Partial<Record<keyof CameraFormValues, string>>>({});

  useEffect(() => {
    if (!open) return;
    setValues({ ...defaults, ...initialValues, videoFile: null });
    setErrors({});
  }, [open, initialValues]);

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === values.roomId) || null, [rooms, values.roomId]);

  const validate = () => {
    const e: Partial<Record<keyof CameraFormValues, string>> = {};
    if (!values.name.trim()) e.name = "Vui lòng nhập tên camera";
    if (!values.roomId) e.roomId = "Vui lòng chọn phòng thi";
    if (requireVideo && !values.videoFile) e.videoFile = "Vui lòng tải video";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card text-card-foreground sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Tên camera</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
                placeholder="VD: CAM 07 - Phòng 201"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Phòng thi</Label>
              <Select
                value={values.roomId ? String(values.roomId) : ""}
                onValueChange={(v) => setValues((p) => ({ ...p, roomId: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng thi" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.room} — Lớp {r.className} ({r.building} • {r.floor})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roomId && <p className="text-sm text-destructive">{errors.roomId}</p>}
            </div>
          </div>

          {selectedRoom && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm grid gap-1 md:grid-cols-2">
              <div><span className="text-muted-foreground">Tòa nhà:</span> {selectedRoom.building}</div>
              <div><span className="text-muted-foreground">Tầng:</span> {selectedRoom.floor}</div>
              <div><span className="text-muted-foreground">Lớp:</span> {selectedRoom.className}</div>
              <div><span className="text-muted-foreground">Sĩ số:</span> {selectedRoom.students}</div>
              <div><span className="text-muted-foreground">Giám thị:</span> {selectedRoom.supervisor}</div>
              <div><span className="text-muted-foreground">Thời gian:</span> {selectedRoom.startTime} → {selectedRoom.endTime}</div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[1fr_320px]">
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={values.notes}
                onChange={(e) => setValues((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Mô tả nhanh về vị trí camera"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoFile">Video camera</Label>
              <Input
                id="videoFile"
                type="file"
                accept="video/*"
                onChange={(e) => setValues((p) => ({ ...p, videoFile: e.target.files?.[0] ?? null }))}
              />
              {errors.videoFile && <p className="text-sm text-destructive">{errors.videoFile}</p>}
            </div>
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

export default CameraFormDialog;
