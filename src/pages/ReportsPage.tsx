import { useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { rooms } from "@/data/rooms";
import { violations } from "@/data/violations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Download, FileText, Video } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const fmt = (iso: string) => new Date(iso).toLocaleString("vi-VN");
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadCsv = (header: string[], rows: string[][], filename: string) => {
  const escape = (t: string) => `"${String(t).replace(/"/g, '""')}"`;
  const csv =
    "\uFEFF" + [header.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
};

const ReportsPage = () => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { toast } = useToast();

  const grouped = useMemo(
    () => rooms.map((r) => ({ room: r, list: violations.filter((v) => v.room === r.room) })),
    [],
  );

  const exportRoom = (roomName: string) => {
    const items = violations.filter((v) => v.room === roomName);
    if (!items.length) return;
    downloadCsv(
      ["Ngày giờ", "Tên", "Lớp", "ID", "Phòng thi", "Tầng", "Tòa nhà", "Lỗi"],
      items.map((v) => [fmt(v.time), v.studentName, v.className, v.studentId, v.room, v.floor, v.building, v.reason]),
      `bao-cao-${slug(roomName)}.csv`,
    );
    toast({ title: "Đã xuất báo cáo phòng", description: roomName });
  };

  const exportFrameLog = (vid: typeof violations[number]) => {
    const lines = [
      `# Nhật ký vi phạm`,
      `Sinh viên: ${vid.studentName} (${vid.studentId})`,
      `Lớp: ${vid.className} | Phòng: ${vid.room} | ${vid.building} - ${vid.floor}`,
      `Thời điểm: ${fmt(vid.time)}`,
      `Hành vi: ${vid.reason}`,
      `Đoạn video: ${vid.videoStart}s → ${vid.videoEnd}s`,
      ``,
      `Frame\tTimestamp\tHành vi\tĐộ tin cậy`,
      ...vid.frameLogs.map((f) => `${f.frame}\t${f.timestamp}\t${f.behavior}\t${(f.confidence * 100).toFixed(1)}%`),
    ].join("\n");
    downloadBlob(new Blob([lines], { type: "text/plain;charset=utf-8;" }), `log-${vid.studentId}-${slug(vid.reason)}.txt`);
    toast({ title: "Đã xuất file log", description: vid.studentName });
  };

  const exportVideo = async (vid: typeof violations[number]) => {
    try {
      const res = await fetch(vid.videoUrl);
      const blob = await res.blob();
      downloadBlob(blob, `video-${vid.studentId}-${vid.videoStart}s-${vid.videoEnd}s.mp4`);
      toast({
        title: "Đã xuất video",
        description: `${vid.studentName} • ${vid.videoStart}s → ${vid.videoEnd}s`,
      });
    } catch {
      toast({ title: "Không thể xuất video", description: vid.studentName });
    }
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
                    <div className="text-xs text-muted-foreground">
                      Lớp {room.className} • {room.building} • {room.floor}
                    </div>
                  </div>
                  <Badge variant={hasViolations ? "destructive" : "default"}>
                    {hasViolations ? `${list.length} vi phạm` : "Không vi phạm"}
                  </Badge>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={!hasViolations} onClick={() => exportRoom(room.room)}>
                      <Download className="w-4 h-4" /> Xuất phòng
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
                          <div key={v.id} className="flex flex-wrap gap-4 p-3 rounded-lg bg-background border border-border">
                            <img src={v.image} alt={v.studentName} className="w-32 h-20 object-cover rounded-md" />
                            <div className="flex-1 min-w-[200px] text-sm">
                              <div className="font-semibold">
                                {v.studentName} <span className="text-muted-foreground font-normal">({v.studentId})</span>
                              </div>
                              <div className="text-muted-foreground">Lớp {v.className} • {fmt(v.time)}</div>
                              <div className="mt-1 text-destructive">{v.reason}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Đoạn video: {v.videoStart}s → {v.videoEnd}s • {v.frameLogs.length} frame ghi nhận
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 self-center">
                              <Button size="sm" variant="outline" onClick={() => exportVideo(v)}>
                                <Video className="w-4 h-4" /> Xuất video
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => exportFrameLog(v)}>
                                <FileText className="w-4 h-4" /> Xuất file log
                              </Button>
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
