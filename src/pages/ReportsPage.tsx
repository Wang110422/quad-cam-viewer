import { useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { rooms } from "@/data/rooms";
import { violations } from "@/data/violations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const fmt = (iso: string) => new Date(iso).toLocaleString("vi-VN");

const ReportsPage = () => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { toast } = useToast();

  const grouped = useMemo(() => {
    return rooms.map((r) => ({
      room: r,
      list: violations.filter((v) => v.room === r.room),
    }));
  }, []);

  const exportRoom = (roomName: string) => {
    const items = violations.filter((v) => v.room === roomName);
    if (!items.length) return;
    const header = ["Ngày giờ", "Tên", "Lớp", "ID", "Phòng thi", "Tầng", "Tòa nhà", "Lý do"];
    const escape = (t: string) => `"${t.replace(/"/g, '""')}"`;
    const rows = items.map((v) => [
      fmt(v.time), v.studentName, v.className, v.studentId, v.room, v.floor, v.building, v.reason,
    ].map(escape).join(","));
    const csv = "\uFEFF" + [header.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-${roomName.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Đã xuất báo cáo", description: roomName });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar activeKey="reports" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Báo cáo vi phạm</h1>
          <p className="text-sm text-muted-foreground">Danh sách phòng thi và các vi phạm được ghi nhận</p>
        </header>
        <div className="flex-1 overflow-auto p-6 space-y-3">
          {grouped.map(({ room, list }) => {
            const hasViolations = list.length > 0;
            const isOpen = expanded === room.id;
            return (
              <Card key={room.id} className="overflow-hidden">
                <div className="p-4 flex flex-wrap items-center gap-4">
                  <span className={`w-3 h-3 rounded-full ${hasViolations ? "bg-destructive" : "bg-emerald-500"}`} />
                  <div className="min-w-[180px]">
                    <div className="font-semibold text-foreground">{room.room}</div>
                    <div className="text-xs text-muted-foreground">Lớp {room.className} • {room.building} • {room.floor}</div>
                  </div>
                  <Badge variant={hasViolations ? "destructive" : "default"}>
                    {hasViolations ? `${list.length} vi phạm` : "Không vi phạm"}
                  </Badge>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={!hasViolations} onClick={() => exportRoom(room.room)}>
                      <Download className="w-4 h-4" /> Xuất
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : room.id)}>
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-border p-4 bg-muted/30">
                    {hasViolations ? (
                      <div className="space-y-3">
                        {list.map((v) => (
                          <div key={v.id} className="flex gap-4 p-3 rounded-lg bg-background border border-border">
                            <img src={v.image} alt={v.studentName} className="w-28 h-20 object-cover rounded-md" />
                            <div className="flex-1 text-sm">
                              <div className="font-semibold">{v.studentName} <span className="text-muted-foreground font-normal">({v.studentId})</span></div>
                              <div className="text-muted-foreground">Lớp {v.className} • {fmt(v.time)}</div>
                              <div className="mt-1 text-destructive">{v.reason}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">Không có vi phạm.</div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
