import React, { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyMember } from "../hooks/useQueries";
import { TABS, TabId } from "../constants";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Users,
  CheckCircle2,
  Smile,
  Calendar,
  UtensilsCrossed,
  ShoppingCart,
  Settings,
  Menu,
  X,
  LogOut,
  Search,
  User,
} from "lucide-react";

interface LayoutProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  children: React.ReactNode;
}

// Icon mapping for tabs
const TAB_ICONS: Record<TabId, React.ComponentType<{ className?: string }>> = {
  dashboard: Home,
  family: Users,
  chores: CheckCircle2,
  mood: Smile,
  calendar: Calendar,
  meals: UtensilsCrossed,
  shopping: ShoppingCart,
  settings: Settings,
};

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  setActiveTab,
  children,
}) => {
  const { clear } = useInternetIdentity();
  const { data: myMember } = useMyMember();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex transition-colors duration-400">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-brand-surface border-r border-brand-gray-200 fixed h-full z-30 transition-all duration-400 shadow-soft">
        {/* Logo */}
        <div className="p-6 border-b border-brand-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-card bg-brand-primary-500 flex items-center justify-center shadow-soft">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-medium text-brand-gray-900">
              FamilyHub
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-250 ${
                  isActive
                    ? "bg-brand-primary-500 text-white shadow-soft"
                    : "text-brand-gray-600 hover:bg-brand-gray-100 hover:text-brand-gray-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-brand-gray-200">
          <button
            onClick={clear}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-brand-gray-600 hover:bg-brand-gray-100 hover:text-brand-gray-800 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Header Bar */}
      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-brand-surface border-b border-brand-gray-200 z-40 transition-all duration-400 shadow-soft">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-brand-gray-600 hover:text-brand-gray-900 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Empty spacer for mobile */}
          <div className="flex-1 md:hidden" />

          {/* User Display */}
          <div className="flex items-center">
            {myMember && (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: myMember.color }}
                >
                  {myMember.avatarEmoji}
                </div>
                <span className="text-sm font-medium text-brand-gray-800 hidden sm:inline">
                  {myMember.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 w-64 h-full bg-brand-surface shadow-xl border-l border-brand-gray-200 transition-colors">
            <div className="p-4 border-b border-brand-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-brand-gray-800">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-brand-gray-600 hover:text-brand-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-1 overflow-y-auto">
              {TABS.map((tab) => {
                const Icon = TAB_ICONS[tab.id];
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-250 ${
                      isActive
                        ? "bg-brand-primary-500 text-white shadow-soft"
                        : "text-brand-gray-600 hover:bg-brand-gray-100 hover:text-brand-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-brand-gray-200">
              <button
                onClick={() => {
                  clear();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-brand-gray-600 hover:bg-brand-gray-100 hover:text-brand-gray-800 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-24 md:pt-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">{children}</div>
      </main>
    </div>
  );
};
