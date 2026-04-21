import {
  LayoutDashboard,
  DoorOpen,
  Camera,
  Users,
  CalendarDays,
  Eye,
  FileText,
  CalendarCheck,
  Settings,
  ChevronDown,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Tổng quan" },
  { icon: DoorOpen, label: "Phòng thi" },
  { icon: Camera, label: "Camera", active: true },
  { icon: Users, label: "Học sinh" },
  { icon: CalendarDays, label: "Lịch thi" },
  { icon: Eye, label: "Giám thị" },
  { icon: FileText, label: "Báo cáo" },
  { icon: CalendarCheck, label: "Sự kiện" },
  { icon: Settings, label: "Cài đặt" },
];

const AppSidebar = () => {
  return (
    <aside className="w-60 flex flex-col border-r border-border bg-card shrink-0">
      {/* Logo */}
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

      {/* Menu */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              item.active
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
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
