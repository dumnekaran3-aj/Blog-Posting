import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Tags,
  ScrollText,
  UserCog,
  LogOut,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { ADMIN_PATH } from "../../constants/adminPath";

const navItems = [
  { to: `/${ADMIN_PATH}`, label: "Overview", icon: LayoutDashboard, roles: ["admin", "moderator", "analyst"], end: true },
  { to: `/${ADMIN_PATH}/users`, label: "Users", icon: Users, roles: ["admin", "moderator"] },
  { to: `/${ADMIN_PATH}/posts`, label: "Posts", icon: FileText, roles: ["admin", "moderator"] },
  { to: `/${ADMIN_PATH}/comments`, label: "Comments", icon: MessageSquare, roles: ["admin", "moderator"] },
  { to: `/${ADMIN_PATH}/categories`, label: "Categories", icon: Tags, roles: ["admin", "moderator", "analyst"] },
  { to: `/${ADMIN_PATH}/logs`, label: "Audit logs", icon: ScrollText, roles: ["admin"] },
  { to: `/${ADMIN_PATH}/accounts`, label: "Admin accounts", icon: UserCog, roles: ["admin"] },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(`/${ADMIN_PATH}/login`);
  };

  const visibleItems = navItems.filter((item) => item.roles.includes(admin?.role));

  return (
    <div className="min-h-screen flex bg-bgLight">
      <aside className="w-56 bg-primaryDark flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-white text-sm font-medium">VarityWire</p>
          <p className="text-white/50 text-[11px]">Admin panel</p>
        </div>

        <nav className="flex-1 py-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-5 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-white/10 text-white border-r-2 border-accent" : "text-white/70 hover:bg-white/5"
                }`
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-white text-xs font-medium">{admin?.name}</p>
          <p className="text-white/50 text-[11px] capitalize mb-3">{admin?.role}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/70 hover:text-white text-xs"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}