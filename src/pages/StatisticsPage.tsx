import { useMemo } from "react";
import AppSidebar from "@/components/AppSidebar";
import { rooms } from "@/data/rooms";
import { violations } from "@/data/violations";
import { Card } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const StatisticsPage = () => {
  const data = useMemo(() => {
    return rooms.map((r) => {
      const v = violations.filter((x) => x.room === r.room).length;
      const present = r.roomStatus === "upcoming" ? 0 : r.present;
      const absent = r.roomStatus === "upcoming" ? 0 : r.absent;
      return { name: r.room, "Có mặt": present, "Vắng mặt": absent, "Vi phạm": v };
    });
  }, []);

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
        </div>
      </main>
    </div>
  );
};

export default StatisticsPage;
