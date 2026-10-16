import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { useAuth } from "./components/AuthProvider";
import { NotificationCenter } from "./components/NotificationCenter";
import {
  LayoutDashboard,
  Search,
  Target,
  FileText,
  Bot,
  User,
  Bell,
  Menu,
  X,
  ChevronRight,
  Briefcase,
  LogOut,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Job Search", icon: Search, page: "JobSearch" },
  { name: "Skills & Roadmap", icon: Target, page: "SkillsRoadmap" },
  { name: "Applications", icon: FileText, page: "Applications" },
  { name: "AI Planner", icon: Bot, page: "AIPlanner" },
  { name: "Profile", icon: User, page: "Profile" },
];

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Skip layout for onboarding
  if (currentPageName === "Onboarding") {
    return <>{children}</>;
  }

  const NavLink = ({ item, mobile = false }) => {
    const isActive = currentPageName === item.page;
    const Icon = item.icon;

    return (
      <Link
        to={createPageUrl(item.page)}
        onClick={() => mobile && setMobileOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
          ${
            isActive
              ? "bg-gradient-to-r from-teal-500/10 to-blue-500/10 text-teal-600 font-medium"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }
        `}
      >
        <Icon className={`w-5 h-5 ${isActive ? "text-teal-500" : ""}`} />
        <span>{item.name}</span>
        {isActive && <ChevronRight className="w-4 h-4 ml-auto text-teal-500" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <Link
            to={createPageUrl("Dashboard")}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                Career Compass
              </h1>
              <p className="text-xs text-slate-400">Singapore</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>

        {/* User Section */}
        {user && (
          <div className="p-4 border-t border-slate-100">
            {/* Notification Bell */}
            <div className="mb-3 flex justify-end">
              <NotificationCenter />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-medium">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.full_name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    to={createPageUrl("Profile")}
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-40 flex items-center justify-between px-4">
        <Link
          to={createPageUrl("Dashboard")}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Career Compass
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationCenter />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="w-5 h-5 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="p-6 border-b border-slate-100">
                {user && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-medium text-lg">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {user.full_name || "User"}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink key={item.name} item={item} mobile />
                ))}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`lg:ml-72 pt-16 lg:pt-0 min-w-0 ${currentPageName === "AIPlanner" ? "h-dvh" : "min-h-screen"}`}
      >
        <div
          className={
            currentPageName === "AIPlanner"
              ? "h-full min-h-0 min-w-0 p-3 lg:p-6 pb-24 lg:pb-24"
              : "p-4 lg:p-8 pb-32 lg:pb-32"
          }
        >
          {children}
        </div>
      </main>

      {/* Bottom Navigation - All Devices */}
      <nav className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;

            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 flex-1 ${
                  isActive
                    ? "bg-gradient-to-r from-teal-500/10 to-blue-500/10 text-teal-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-teal-500" : ""}`}
                />
                <span
                  className={`text-xs font-medium ${isActive ? "text-teal-600" : "text-slate-600"}`}
                >
                  {item.name.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating AI Chat Button - Desktop Only */}
      {currentPageName !== "AIPlanner" && (
        <Link
          to={createPageUrl("AIPlanner")}
          className="hidden lg:flex fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white items-center justify-center shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300 hover:scale-105 z-50"
        >
          <Bot className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
