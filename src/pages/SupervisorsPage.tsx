import { useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import {
  useSupervisorsStore,
  addSupervisor,
  removeSupervisor,
  updateSupervisor,
} from "@/data/supervisorsStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Mail, Phone, MapPin, Briefcase, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Supervisor } from "@/types/models";

const SupervisorsPage = () => {
  const list = useSupervisorsStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supervisor | null>(null);
  const { toast } = useToast();

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const created = await addSupervisor({
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        gender: (fd.get("gender") as "Nam" | "Nữ") || "Nam",
        dob: String(fd.get("dob") || ""),
        address: String(fd.get("address") || ""),
        department: String(fd.get("department") || ""),
        assignedRoom: null,
      });
      setOpen(false);
      toast({ title: "Đã thêm giám thị", description: created.name });
    } catch {
      toast({ title: "Không thể thêm giám thị" });
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    try {
      await updateSupervisor(editing.id, {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        gender: (fd.get("gender") as "Nam" | "Nữ") || "Nam",
        dob: String(fd.get("dob") || ""),
        address: String(fd.get("address") || ""),
        department: String(fd.get("department") || ""),
      });
      setEditing(null);
      toast({ title: "Đã cập nhật giám thị" });
    } catch {
      toast({ title: "Không thể cập nhật giám thị" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar activeKey="supervisors" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-foreground">Giám thị</h1>
            <p className="text-sm text-muted-foreground">Danh sách giám thị và trạng thái phân công</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4" /> Thêm giám thị</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm giám thị</DialogTitle>
                <DialogDescription>Nhập thông tin chi tiết của giám thị.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Họ tên</Label><Input name="name" required /></div>
                  <div><Label>Giới tính</Label>
                    <select name="gender" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option>Nam</option><option>Nữ</option>
                    </select>
                  </div>
                  <div><Label>Email</Label><Input name="email" type="email" required /></div>
                  <div><Label>Số điện thoại</Label><Input name="phone" required /></div>
                  <div><Label>Ngày sinh</Label><Input name="dob" type="date" /></div>
                  <div><Label>Khoa/Bộ môn</Label><Input name="department" /></div>
                </div>
                <div><Label>Địa chỉ</Label><Textarea name="address" rows={2} /></div>
                <DialogFooter><Button type="submit">Lưu</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((s) => {
            const working = Boolean(s.assignedRoom);
            return (
              <Card key={s.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${working ? "bg-emerald-500" : "bg-white border border-border"}`} />
                    <div>
                      <div className="font-semibold text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.gender} • {s.dob}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={working ? "default" : "secondary"}>
                      {working ? `Đang trực ${s.assignedRoom}` : "Trống"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Sửa giám thị"
                      onClick={() => setEditing(s)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={working}
                      title={working ? "Không thể xóa giám thị đang trực" : "Xóa giám thị"}
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={async () => {
                        if (working) {
                          toast({ title: "Không thể xóa", description: "Giám thị đang trực phòng thi." });
                          return;
                        }
                        if (!confirm(`Xóa giám thị ${s.name}?`)) return;
                        try {
                          await removeSupervisor(s.id);
                          toast({ title: "Đã xóa giám thị", description: s.name });
                        } catch (err) {
                          toast({ title: "Không thể xóa", description: (err as Error).message });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {s.email}</div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {s.phone}</div>
                  <div className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {s.department}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {s.address}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Dialog SỬA giám thị */}
      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa giám thị</DialogTitle>
            <DialogDescription>Cập nhật thông tin giám thị.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEdit} className="space-y-3" key={editing.id}>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Họ tên</Label><Input name="name" defaultValue={editing.name} required /></div>
                <div><Label>Giới tính</Label>
                  <select name="gender" defaultValue={editing.gender} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option>Nam</option><option>Nữ</option>
                  </select>
                </div>
                <div><Label>Email</Label><Input name="email" type="email" defaultValue={editing.email} required /></div>
                <div><Label>Số điện thoại</Label><Input name="phone" defaultValue={editing.phone} required /></div>
                <div><Label>Ngày sinh</Label><Input name="dob" type="date" defaultValue={editing.dob} /></div>
                <div><Label>Khoa/Bộ môn</Label><Input name="department" defaultValue={editing.department} /></div>
              </div>
              <div><Label>Địa chỉ</Label><Textarea name="address" rows={2} defaultValue={editing.address} /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
                <Button type="submit">Lưu thay đổi</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupervisorsPage;
