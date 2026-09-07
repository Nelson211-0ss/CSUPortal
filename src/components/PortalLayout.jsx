import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Award, BarChart3, Bell, CalendarDays, ChevronDown, LayoutDashboard, LogOut, Menu,
  Search, ShieldCheck, Upload, UserRound, BookOpen, X, ClipboardCheck, Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo, Notice, Toast } from "./ui";

const NAV = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["My CPD", "/cpd", Award],
  ["Upload Activity", "/upload", Upload],
  ["Events & Training", "/events", CalendarDays],
  ["Resources", "/resources", BookOpen],
  ["Profile", "/profile", UserRound],
];

const MOBILE_NAV = [
  ["Home", "/dashboard", LayoutDashboard],
  ["My CPD", "/cpd", Award],
  ["Upload", "/upload", Upload],
  ["Events", "/events", CalendarDays],
  ["Profile", "/profile", UserRound],
];

const TITLES = {
  "/dashboard": "Dashboard",
  "/cpd": "My CPD",
  "/upload": "Upload Activity",
  "/events": "Events & Training",
  "/resources": "Resources",
  "/profile": "My Profile",
  "/admin": "CPD Verification",
  "/admin/materials": "CPD Materials",
  "/admin/users": "Member Management",
  "/admin/analytics": "Compliance Analytics",
};

export default function PortalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!showNotifications && !showProfileMenu) return;
    const onPointerDown = (e) => {
      if (showNotifications && !notificationsRef.current?.contains(e.target)) setShowNotifications(false);
      if (showProfileMenu && !profileMenuRef.current?.contains(e.target)) setShowProfileMenu(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showNotifications, showProfileMenu]);

  const nav =
    user?.role === "admin"
      ? [
          ...NAV,
          ["CPD Verification", "/admin", ClipboardCheck],
          ["CPD Materials", "/admin/materials", BookOpen],
          ["Member Management", "/admin/users", Users],
          ["Compliance Analytics", "/admin/analytics", BarChart3],
        ]
      : NAV;

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  };

  const goTo = (path) => {
    navigate(path);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f7fb] text-slate-900">
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/35 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside className={`fixed inset-y-0 left-0 z-50 w-[270px] transform border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <Logo />
            <div>
              <div className="text-[15px] font-extrabold tracking-tight text-[#5b21b6]">CSU</div>
              <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">Professional Portal</div>
            </div>
            <button className="ml-auto rounded-lg p-2 text-slate-500 lg:hidden" onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="px-4 pt-5">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</div>
            <nav className="space-y-0.5">
              {nav.map(([label, path, Icon]) => {
                const active = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => goTo(path)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${active ? "bg-[#f3ebfd] text-[#7c3aed]" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                    {label}
                    {path === "/upload" && <span className="ml-auto rounded-md bg-[#db2777] px-2 py-0.5 text-[10px] font-bold text-white">New</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-3.5">
            <div className="rounded-lg bg-[#f3ebfd] p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-[#6d28d9]">
                <ShieldCheck size={17} />
                <span className="text-xs font-bold">Professional account</span>
              </div>
              <p className="text-xs leading-5 text-slate-500">Keep your CPD evidence current and your professional profile up to date.</p>
              <button onClick={() => goTo("/profile")} className="mt-2 text-xs font-bold text-[#7c3aed]">
                View profile →
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu />
            </button>
            <div>
              <div className="text-lg font-bold tracking-tight">{TITLES[location.pathname] || ""}</div>
              <div className="hidden text-xs text-slate-400 sm:block">Cytology Society of Uganda · Professional Portal</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="w-56 rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a78bfa] focus:ring-4 focus:ring-[#f3ebfd]" placeholder="Search portal..." />
              </div>
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => {
                    setShowNotifications((v) => !v);
                    setShowProfileMenu(false);
                  }}
                  className="relative rounded-md border border-slate-200 p-2.5 text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Bell size={18} />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#db2777]" />
                </button>
                <div
                  className={`absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] origin-top-right rounded-lg border border-slate-200 bg-white p-3 shadow-xl transition duration-150 ease-out ${
                    showNotifications ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                  }`}
                >
                  <div className="flex items-center justify-between px-2 py-2">
                    <b className="text-sm">Notifications</b>
                    <span className="text-xs text-[#7c3aed]">Updates</span>
                  </div>
                  <Notice text="Check your CPD record for verification updates." />
                  <Notice text="New cytology events may be available." />
                </div>
              </div>
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => {
                    setShowProfileMenu((v) => !v);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-1.5 pr-3 transition-colors hover:bg-slate-50"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#f3ebfd] text-xs font-bold text-[#7c3aed]">{initials}</div>
                  <span className="hidden text-sm font-semibold sm:block">{user?.name}</span>
                  <ChevronDown size={15} className={`hidden text-slate-400 transition-transform sm:block ${showProfileMenu ? "rotate-180" : ""}`} />
                </button>
                <div
                  className={`absolute right-0 top-12 w-56 origin-top-right rounded-lg border border-slate-200 bg-white p-2 shadow-xl transition duration-150 ease-out ${
                    showProfileMenu ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                  }`}
                >
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <div className="truncate text-sm font-bold text-slate-900">{user?.name}</div>
                    <div className="truncate text-xs text-slate-400">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      goTo("/profile");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <UserRound size={16} /> View profile
                  </button>
                  <button
                    onClick={async () => {
                      await logout();
                      navigate("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
          <Outlet context={{ notify }} />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around bg-[#5b21b6] px-2 py-2 shadow-[0_-2px_12px_rgba(0,0,0,.15)] lg:hidden">
        {MOBILE_NAV.map(([label, path, Icon]) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => goTo(path)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[10px] font-semibold transition-all duration-150 active:scale-90 ${active ? "text-white" : "text-violet-200"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} className="transition-transform" />
              {label}
            </button>
          );
        })}
      </nav>

      {toast && <Toast message={toast} />}
    </div>
  );
}
