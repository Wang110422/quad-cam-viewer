import { useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { useRoomsStore } from "@/data/roomsStore";
import { violations } from "@/data/violations";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ChevronRight } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "#eab308", "hsl(var(--destructive))"];
const BEHAVIOR_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "#eab308", "#10b981", "#8b5cf6", "#f97316"];

const BehaviorTimeChart = () => {
  const { buckets, behaviors, dominantPerBucket } = useMemo(() => {
    const events = violations.flatMap((v) =>
      v.frameLogs.map((f) => ({ time: new Date(v.time), behavior: f.behavior })),
    );
    if (!events.length) return { buckets: [], behaviors: [] as string[], dominantPerBucket: [] as { label: string; behavior: string; count: number }[] };

    const behaviorSet = Array.from(new Set(events.map((e) => e.behavior)));
    const bucketMap = new Map<string, Record<string, number>>();
    for (const e of events) {
      const d = e.time;
      const m = d.getMinutes() < 30 ? "00" : "30";
      const label = `${String(d.getHours()).padStart(2, "0")}:${m}`;
      const cur = bucketMap.get(label) ?? {};
      cur[e.behavior] = (cur[e.behavior] ?? 0) + 1;
      bucketMap.set(label, cur);
    }
    const labels = Array.from(bucketMap.keys()).sort();
    const buckets = labels.map((label) => {
      const row: Record<string, number | string> = { time: label };
      for (const b of behaviorSet) row[b] = bucketMap.get(label)?.[b] ?? 0;
      return row;
    });
    const dominantPerBucket = labels.map((label) => {
      const row = bucketMap.get(label) ?? {};
      const top = Object.entries(row).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
      return { label, behavior: top?.[0] ?? "—", count: (top?.[1] as number) ?? 0 };
    });
    return { buckets, behaviors: behaviorSet, dominantPerBucket };
  }, []);

  if (!buckets.length) return null;

  return (
    <Card className="p-4">
      <div className="font-semibold mb-1">Vi phạm theo thời gian</div>
      <p className="text-xs text-muted-foreground mb-3">
        Trục dọc: số lượng theo hành vi • Trục ngang: thời gian (mỗi mốc 30 phút)
      </p>
      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {behaviors.map((b, i) => (
              <Line key={b} type="monotone" dataKey={b} stroke={BEHAVIOR_COLORS[i % BEHAVIOR_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {dominantPerBucket.map((d) => (
          <Badge key={d.label} variant="outline" className="text-xs">
            {d.label}: {d.behavior} ({d.count})
          </Badge>
        ))}
      </div>
    </Card>
  );
};

const StatisticsPage = () => {
  const rooms = useRoomsStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const data = useMemo(() => {
    return rooms.map((r) => {
      const v = violations.filter((x) => x.room === r.room).length;
      const present = r.roomStatus === "upcoming" ? 0 : r.present;
      const absent = r.roomStatus === "upcoming" ? 0 : r.absent;
      return { id: r.id, name: r.room, "Có mặt": present, "Vắng mặt": absent, "Vi phạm": v };
    });
  }, [rooms]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, d) => ({
        present: acc.present + d["Có mặt"],
        absent: acc.absent + d["Vắng mặt"],
        violation: acc.violation + d["Vi phạm"],
      }),
      { present: 0, absent: 0, violation: 0 },
    );
  }, [data]);

  const selectedRoom = rooms.find((r) => r.id === selectedId) || null;
  const selectedData = data.find((d) => d.id === selectedId) || null;

  const pieData = selectedData
    ? [
        { name: "Có mặt", value: selectedData["Có mặt"] },
        { name: "Vắng mặt", value: selectedData["Vắng mặt"] },
        { name: "Vi phạm", value: selectedData["Vi phạm"] },
      ].filter((d) => d.value > 0)
    : [];

  const total = pieData.reduce((s, d) => s + d.value, 0);
  const top = pieData.length
    ? [...pieData].sort((a, b) => b.value - a.value)[0]
    : null;
  const topPct = top && total > 0 ? Math.round((top.value / total) * 100) : 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar activeKey="statistics" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Thống kê</h1>
          <p className="text-sm text-muted-foreground">Tổng hợp trạng thái sinh viên theo phòng thi</p>
        </header>
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Tổng có mặt</div>
              <div className="text-2xl font-bold text-emerald-600">{totals.present}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Tổng vắng mặt</div>
              <div className="text-2xl font-bold text-yellow-600">{totals.absent}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Tổng vi phạm</div>
              <div className="text-2xl font-bold text-destructive">{totals.violation}</div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="font-semibold mb-4">Theo phòng thi</div>
            <div className="w-full h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Có mặt" fill="hsl(var(--primary))" />
                  <Bar dataKey="Vắng mặt" fill="#eab308" />
                  <Bar dataKey="Vi phạm" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <BehaviorTimeChart />

          <Card className="p-4">
            <div className="font-semibold mb-3">Danh sách phòng thi</div>
            <p className="text-xs text-muted-foreground mb-3">Bấm vào một phòng để xem thống kê chi tiết.</p>
            <div className="space-y-2">
              {rooms.map((r) => {
                const d = data.find((x) => x.id === r.id);
                const active = selectedId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(active ? null : r.id)}
                    className={`w-full text-left rounded-lg border px-4 py-3 flex items-center gap-4 transition-colors ${
                      active ? "border-primary bg-accent" : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="min-w-[160px]">
                      <div className="font-medium text-foreground">{r.room}</div>
                      <div className="text-xs text-muted-foreground">Lớp {r.className}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{r.building} • {r.floor}</div>
                    <div className="ml-auto flex items-center gap-3 text-sm">
                      <span className="text-emerald-600">CM: {d?.["Có mặt"] ?? 0}</span>
                      <span className="text-yellow-600">VM: {d?.["Vắng mặt"] ?? 0}</span>
                      <span className="text-destructive">VP: {d?.["Vi phạm"] ?? 0}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${active ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedRoom && selectedData && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Chi tiết: {selectedRoom.room}</div>
                  <div className="text-xs text-muted-foreground">
                    Lớp {selectedRoom.className} • {selectedRoom.building} • {selectedRoom.floor} • Giám thị: {selectedRoom.supervisor}
                  </div>
                </div>
                {top && (
                  <Badge variant="outline" className="text-sm">
                    {top.name} chiếm {topPct}% (cao nhất)
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-[300px]">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(e) => `${e.name}: ${Math.round((e.value / total) * 100)}%`}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      Phòng thi chưa diễn ra — chưa có dữ liệu thống kê.
                    </div>
                  )}
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[selectedData]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Có mặt" fill="hsl(var(--primary))" />
                      <Bar dataKey="Vắng mặt" fill="#eab308" />
                      <Bar dataKey="Vi phạm" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-muted-foreground">Có mặt</div>
                  <div className="text-lg font-semibold text-emerald-600">
                    {selectedData["Có mặt"]} {total > 0 && `(${Math.round((selectedData["Có mặt"] / total) * 100)}%)`}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-muted-foreground">Vắng mặt</div>
                  <div className="text-lg font-semibold text-yellow-600">
                    {selectedData["Vắng mặt"]} {total > 0 && `(${Math.round((selectedData["Vắng mặt"] / total) * 100)}%)`}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-muted-foreground">Vi phạm</div>
                  <div className="text-lg font-semibold text-destructive">
                    {selectedData["Vi phạm"]} {total > 0 && `(${Math.round((selectedData["Vi phạm"] / total) * 100)}%)`}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default StatisticsPage;
