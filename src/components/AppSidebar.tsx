import {
  LayoutDashboard,
  DoorOpen,
  Camera,
  Users,
  CalendarDays,
  Eye,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";

type ActiveKey =
  | "overview"
  | "rooms"
  | "cameras"
  | "students"
  | "schedule"
  | "supervisors"
  | "reports"
  | "statistics"
  | "settings";

interface AppSidebarProps {
  activeKey?: ActiveKey;
}

const menuItems: { icon: typeof LayoutDashboard; label: string; key: ActiveKey; to: string }[] = [
  { icon: LayoutDashboard, label: "Tổng quan", key: "overview", to: "/" },
  { icon: DoorOpen, label: "Phòng thi", key: "rooms", to: "/rooms" },
  { icon: Camera, label: "Camera", key: "cameras", to: "/" },
  { icon: Users, label: "Học sinh", key: "students", to: "/" },
  { icon: CalendarDays, label: "Lịch thi", key: "schedule", to: "/" },
  { icon: Eye, label: "Giám thị", key: "supervisors", to: "/supervisors" },
  { icon: FileText, label: "Báo cáo", key: "reports", to: "/reports" },
  { icon: BarChart3, label: "Thống kê", key: "statistics", to: "/statistics" },
  { icon: Settings, label: "Cài đặt", key: "settings", to: "/" },
];

const AppSidebar = ({ activeKey = "cameras" }: AppSidebarProps) => {
  return (
    <aside className="w-60 flex flex-col border-r border-border bg-card shrink-0">
      <div className="p-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Camera className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-bold text-sm text-foreground leading-tight">
            QUẢN LÝ PHÒNG THI
          </div>
          <div className="text-[11px] text-muted-foreground leading-tight">
            Hệ thống giám sát & quản lý
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item) => {
          const active = item.key === activeKey;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button className="w-full flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-foreground">Admin</div>
            <div className="text-xs text-muted-foreground">Quản trị viên</div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
