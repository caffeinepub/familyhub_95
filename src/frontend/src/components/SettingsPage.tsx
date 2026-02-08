import React, { useState, useMemo } from "react";
import {
  useDataCounts,
  useIsAdmin,
  useFamilyMembers,
  useChores,
  useMoodEntries,
  useCalendarEvents,
  useShoppingItems,
  useMyMember,
} from "../hooks/useQueries";
import {
  exportChoresCSV,
  exportMoodsCSV,
  exportEventsCSV,
  exportShoppingCSV,
  downloadCSV,
  generateFilename,
} from "../utils/csvExport";
import { Toast } from "./shared/Toast";
import { PageCard } from "./shared/PageCard";
import { MemberAvatar } from "./shared/MemberAvatar";
import {
  Download,
  Sun,
  Moon,
  Monitor,
  User,
  CheckCircle2,
  Smile,
  Calendar,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const SettingsPage: React.FC = () => {
  const { data: counts } = useDataCounts();
  const { data: isAdmin } = useIsAdmin();
  const { data: members = [] } = useFamilyMembers();
  const { data: chores = [] } = useChores();
  const { data: moods = [] } = useMoodEntries();
  const { data: events = [] } = useCalendarEvents();
  const { data: shoppingItems = [] } = useShoppingItems();
  const { data: myMember } = useMyMember();
  const { theme, setTheme } = useTheme();

  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Personal stats for current user
  const personalStats = useMemo(() => {
    if (!myMember)
      return { choresCompleted: 0, moodCheckIns: 0, eventsAttended: 0 };

    const choresCompleted = chores.filter(
      (c) => c.assignedTo === myMember.id && c.isCompleted,
    ).length;

    const moodCheckIns = moods.filter((m) => m.memberId === myMember.id).length;

    const eventsAttended = events.filter((e) =>
      e.memberIds.includes(myMember.id),
    ).length;

    return { choresCompleted, moodCheckIns, eventsAttended };
  }, [myMember, chores, moods, events]);

  const showExportMessage = (message: string) => {
    setExportMessage(message);
    setTimeout(() => setExportMessage(null), 3000);
  };

  const handleExportChores = () => {
    if (chores.length === 0) {
      showExportMessage("No chores to export");
      return;
    }
    const csv = exportChoresCSV(chores, members);
    downloadCSV(csv, generateFilename("chores"));
    showExportMessage(`Exported ${chores.length} chores`);
  };

  const handleExportMoods = () => {
    if (moods.length === 0) {
      showExportMessage("No mood entries to export");
      return;
    }
    const csv = exportMoodsCSV(moods, members);
    downloadCSV(csv, generateFilename("moods"));
    showExportMessage(`Exported ${moods.length} mood entries`);
  };

  const handleExportEvents = () => {
    if (events.length === 0) {
      showExportMessage("No calendar events to export");
      return;
    }
    const csv = exportEventsCSV(events, members);
    downloadCSV(csv, generateFilename("events"));
    showExportMessage(`Exported ${events.length} events`);
  };

  const handleExportShopping = () => {
    if (shoppingItems.length === 0) {
      showExportMessage("No shopping items to export");
      return;
    }
    const csv = exportShoppingCSV(shoppingItems, members);
    downloadCSV(csv, generateFilename("shopping"));
    showExportMessage(`Exported ${shoppingItems.length} shopping items`);
  };

  const handleExportAll = () => {
    let exportCount = 0;
    if (chores.length > 0) {
      const csv = exportChoresCSV(chores, members);
      downloadCSV(csv, generateFilename("chores"));
      exportCount++;
    }
    if (moods.length > 0) {
      const csv = exportMoodsCSV(moods, members);
      downloadCSV(csv, generateFilename("moods"));
      exportCount++;
    }
    if (events.length > 0) {
      const csv = exportEventsCSV(events, members);
      downloadCSV(csv, generateFilename("events"));
      exportCount++;
    }
    if (shoppingItems.length > 0) {
      const csv = exportShoppingCSV(shoppingItems, members);
      downloadCSV(csv, generateFilename("shopping"));
      exportCount++;
    }
    if (exportCount === 0) {
      showExportMessage("No data to export");
    } else {
      showExportMessage(`Exported ${exportCount} file(s)`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Message Toast */}
      <Toast
        message={exportMessage || ""}
        type="success"
        isOpen={!!exportMessage}
        onClose={() => setExportMessage(null)}
      />

      {/* Header */}
      <div>
        <h2 className="text-3xl font-light text-brand-gray-800">Settings</h2>
        <p className="text-sm text-brand-gray-500 mt-1">
          Manage your preferences and view app information
        </p>
      </div>

      {/* Data Summary */}
      <PageCard
        title="Data Summary"
        subtitle="Your family hub data at a glance"
        className=""
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-brand-gray-50 rounded-lg border border-brand-gray-200">
            <div className="text-2xl font-light text-brand-gray-800">
              {counts?.members || 0}
            </div>
            <div className="text-sm font-extralight text-brand-gray-500">
              Members
            </div>
            <Progress
              value={Math.min(((counts?.members || 0) / 10) * 100, 100)}
              className="h-1 mt-2"
            />
          </div>
          <div className="text-center p-4 bg-brand-gray-50 rounded-lg border border-brand-gray-200">
            <div className="text-2xl font-light text-brand-gray-800">
              {counts?.moodEntries || 0}
            </div>
            <div className="text-sm font-extralight text-brand-gray-500">
              Moods
            </div>
            <Progress
              value={Math.min(((counts?.moodEntries || 0) / 100) * 100, 100)}
              className="h-1 mt-2"
            />
          </div>
          <div className="text-center p-4 bg-brand-gray-50 rounded-lg border border-brand-gray-200">
            <div className="text-2xl font-light text-brand-gray-800">
              {counts?.events || 0}
            </div>
            <div className="text-sm font-extralight text-brand-gray-500">
              Events
            </div>
            <Progress
              value={Math.min(((counts?.events || 0) / 50) * 100, 100)}
              className="h-1 mt-2"
            />
          </div>
          <div className="text-center p-4 bg-brand-gray-50 rounded-lg border border-brand-gray-200">
            <div className="text-2xl font-light text-brand-gray-800">
              {counts?.chores || 0}
            </div>
            <div className="text-sm font-extralight text-brand-gray-500">
              Chores
            </div>
            <Progress
              value={Math.min(((counts?.chores || 0) / 100) * 100, 100)}
              className="h-1 mt-2"
            />
          </div>
          <div className="text-center p-4 bg-brand-gray-50 rounded-lg border border-brand-gray-200">
            <div className="text-2xl font-light text-brand-gray-800">
              {counts?.meals || 0}
            </div>
            <div className="text-sm font-extralight text-brand-gray-500">
              Meals
            </div>
            <Progress
              value={Math.min(((counts?.meals || 0) / 50) * 100, 100)}
              className="h-1 mt-2"
            />
          </div>
          <div className="text-center p-4 bg-brand-gray-50 rounded-lg border border-brand-gray-200">
            <div className="text-2xl font-light text-brand-gray-800">
              {counts?.shoppingItems || 0}
            </div>
            <div className="text-sm font-extralight text-brand-gray-500">
              Shopping
            </div>
            <Progress
              value={Math.min(((counts?.shoppingItems || 0) / 50) * 100, 100)}
              className="h-1 mt-2"
            />
          </div>
        </div>
      </PageCard>

      {/* Export Data */}
      <PageCard
        title="Export Data"
        subtitle="Download your data as CSV files"
        className=""
      >
        <p className="text-sm font-light text-brand-gray-500 mb-4">
          Download your family data as CSV files for backup or analysis.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={handleExportChores}
            className="px-4 py-3 bg-brand-primary-500/10 text-brand-primary-500 rounded-lg hover:bg-brand-primary-500/20 transition-colors flex flex-col items-center gap-1 border border-brand-primary-500/20"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm font-light">Chores</span>
            <span className="text-xs font-extralight text-brand-gray-500">
              {chores.length} items
            </span>
          </button>
          <button
            onClick={handleExportMoods}
            className="px-4 py-3 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors flex flex-col items-center gap-1 border border-purple-500/20"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm font-light">Moods</span>
            <span className="text-xs font-extralight text-brand-gray-500">
              {moods.length} items
            </span>
          </button>
          <button
            onClick={handleExportEvents}
            className="px-4 py-3 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex flex-col items-center gap-1 border border-blue-500/20"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm font-light">Events</span>
            <span className="text-xs font-extralight text-brand-gray-500">
              {events.length} items
            </span>
          </button>
          <button
            onClick={handleExportShopping}
            className="px-4 py-3 bg-teal-500/10 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors flex flex-col items-center gap-1 border border-teal-500/20"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm font-light">Shopping</span>
            <span className="text-xs font-extralight text-brand-gray-500">
              {shoppingItems.length} items
            </span>
          </button>
          <button
            onClick={handleExportAll}
            className="px-4 py-3 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors flex flex-col items-center gap-1 border border-green-500/20"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm font-light">All Data</span>
            <span className="text-xs font-extralight text-brand-gray-500">
              Download all
            </span>
          </button>
        </div>
      </PageCard>

      {/* About */}
      <PageCard title="About FamilyHub" subtitle="App information" className="">
        <div className="space-y-2 text-sm font-light text-brand-gray-600">
          <p>
            <strong className="text-brand-gray-800">FamilyHub</strong> - A
            family organization app for the Internet Computer.
          </p>
          <p>
            Admin Status:{" "}
            <span className="text-brand-primary-500">
              {isAdmin ? "Yes" : "No"}
            </span>
          </p>
        </div>
      </PageCard>
    </div>
  );
};
