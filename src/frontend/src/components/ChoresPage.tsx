import React, { useState, useMemo } from "react";
import {
  useFamilyMembers,
  useChores,
  useCreateChore,
  useUpdateChore,
  useToggleChoreComplete,
  useDeleteChore,
  useIsAdmin,
  useMyMember,
} from "../hooks/useQueries";
import type { Chore, FamilyMember } from "../backend";
import { LoadingScreen } from "./LoadingScreen";
import { Toast } from "./shared/Toast";
import { Modal } from "./shared/Modal";
import { ConfirmDialog } from "./shared/ConfirmDialog";
import { FormButton } from "./shared/FormButton";
import { PageCard } from "./shared/PageCard";
import { MemberAvatar } from "./shared/MemberAvatar";
import { EmptyState } from "./shared/EmptyState";
import { TrendChart } from "./shared/TrendChart";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  X,
  Edit2,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateCompletionRate, calculateChange } from "../utils/dataHelpers";
import {
  nanosecondsToDate,
  formatNanoseconds,
  isThisWeekNano,
  isLastWeekNano,
  getTodayLocalDate,
  localDateStringToNanoseconds,
  nanosecondsToLocalDateString,
  NS_PER_MS,
} from "../utils/dateHelpers";
import { prepareChoreChartData } from "../utils/chartHelpers";

type ViewMode = "list" | "week";

export const ChoresPage: React.FC = () => {
  const { data: members = [], isLoading: membersLoading } = useFamilyMembers();
  const {
    data: chores = [],
    isLoading: choresLoading,
    error,
    refetch,
  } = useChores();
  const { data: isAdmin } = useIsAdmin();
  const { data: myMember } = useMyMember();
  const createChore = useCreateChore();
  const updateChore = useUpdateChore();
  const toggleChore = useToggleChoreComplete();
  const deleteChore = useDeleteChore();

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    return start;
  });
  const [showForm, setShowForm] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [filterMemberId, setFilterMemberId] = useState<bigint | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: null as bigint | null,
    dueDate: getTodayLocalDate(),
    recurrence: "none",
  });
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Chore | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
  };

  // Statistics
  const stats = useMemo(() => {
    const thisWeek = chores.filter((c) => isThisWeekNano(c.dueDate));
    const lastWeek = chores.filter((c) => isLastWeekNano(c.dueDate));

    const thisWeekCompleted = thisWeek.filter((c) => c.isCompleted).length;
    const lastWeekCompleted = lastWeek.filter((c) => c.isCompleted).length;

    const today = new Date();
    const todayChores = chores.filter((c) => {
      const choreDate = nanosecondsToDate(c.dueDate);
      return choreDate.toDateString() === today.toDateString();
    });

    const overdue = chores.filter((c) => {
      if (c.isCompleted) return false;
      return nanosecondsToDate(c.dueDate) < today;
    });

    const completionRate = calculateCompletionRate(chores);
    const change = calculateChange(thisWeekCompleted, lastWeekCompleted);

    return {
      total: chores.length,
      completionRate,
      change,
      dueToday: todayChores.filter((c) => !c.isCompleted).length,
      overdue: overdue.length,
    };
  }, [chores]);

  // Chart data
  const chartData = useMemo(() => prepareChoreChartData(chores), [chores]);

  // Week days
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeekStart]);

  const navigatePrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const navigateNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  const getChoresForDate = (date: Date): Chore[] => {
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    let filtered = chores.filter((c) => {
      const choreDate = Number(c.dueDate / NS_PER_MS);
      return choreDate >= dayStart && choreDate < dayEnd;
    });

    if (filterMemberId) {
      filtered = filtered.filter((c) => c.assignedTo === filterMemberId);
    }

    return filtered;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingChore) {
        await updateChore.mutateAsync({
          id: editingChore.id,
          title: formData.title,
          description: formData.description,
          assignedTo: formData.assignedTo,
          dueDate: localDateStringToNanoseconds(formData.dueDate),
          recurrence: formData.recurrence,
        });
        showToast("Chore updated successfully!", "success");
      } else {
        // For recurrence, we need to manipulate dates, so parse to Date first
        const [year, month, day] = formData.dueDate.split("-").map(Number);
        const baseDueDate = new Date(year, month - 1, day);

        if (formData.recurrence === "daily") {
          const chorePromises: Promise<bigint>[] = [];
          for (let i = 0; i < 7; i++) {
            const choreDate = new Date(baseDueDate);
            choreDate.setDate(baseDueDate.getDate() + i);
            chorePromises.push(
              createChore.mutateAsync({
                title: formData.title,
                description: formData.description,
                assignedTo: formData.assignedTo,
                dueDate: BigInt(choreDate.getTime()) * NS_PER_MS,
                recurrence: "none",
              }),
            );
          }
          await Promise.all(chorePromises);
          showToast("7 daily chores created!", "success");
        } else if (formData.recurrence === "weekly") {
          const chorePromises: Promise<bigint>[] = [];
          for (let i = 0; i < 4; i++) {
            const choreDate = new Date(baseDueDate);
            choreDate.setDate(baseDueDate.getDate() + i * 7);
            chorePromises.push(
              createChore.mutateAsync({
                title: formData.title,
                description: formData.description,
                assignedTo: formData.assignedTo,
                dueDate: BigInt(choreDate.getTime()) * NS_PER_MS,
                recurrence: "none",
              }),
            );
          }
          await Promise.all(chorePromises);
          showToast("4 weekly chores created!", "success");
        } else {
          await createChore.mutateAsync({
            title: formData.title,
            description: formData.description,
            assignedTo: formData.assignedTo,
            dueDate: localDateStringToNanoseconds(formData.dueDate),
            recurrence: formData.recurrence,
          });
          showToast("Chore added!", "success");
        }
      }

      setShowForm(false);
      setEditingChore(null);
      setFormData({
        title: "",
        description: "",
        assignedTo: null,
        dueDate: getTodayLocalDate(),
        recurrence: "none",
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "An error occurred",
        "error",
      );
    }
  };

  const handleToggleComplete = async (chore: Chore) => {
    try {
      await toggleChore.mutateAsync(chore.id);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to toggle chore",
        "error",
      );
    }
  };

  const handleEdit = (chore: Chore) => {
    setEditingChore(chore);
    setFormData({
      title: chore.title,
      description: chore.description,
      assignedTo: chore.assignedTo || null,
      dueDate: nanosecondsToLocalDateString(chore.dueDate),
      recurrence: chore.recurrence,
    });
    setShowForm(true);
  };

  const handleDeleteClick = (chore: Chore) => {
    setDeleteTarget(chore);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteChore.mutateAsync(deleteTarget.id);
        showToast("Chore deleted!", "success");
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to delete chore",
          "error",
        );
      }
    }
  };

  if (choresLoading || membersLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<X className="w-12 h-12 text-red-400" />}
        title="Failed to load chores"
        description="Please try again"
        action={{ label: "Try Again", onClick: () => refetch() }}
      />
    );
  }

  const allChores = filterMemberId
    ? chores.filter((c) => c.assignedTo === filterMemberId)
    : chores;

  const pendingChores = allChores.filter((c) => !c.isCompleted);

  return (
    <div className="space-y-6">
      <Toast
        message={toastMessage?.message || ""}
        type={toastMessage?.type || "success"}
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <div>
        <h2 className="text-3xl font-light text-brand-gray-800">Chores</h2>
        <p className="text-sm text-brand-gray-500 mt-1">
          Manage family chores and track completion
        </p>
      </div>

      {/* Weekly Progress Chart */}
      <PageCard title="Weekly Progress" subtitle="Last 7 days completion rate">
        <TrendChart
          data={chartData}
          type="bar"
          dataKey="rate"
          xKey="date"
          color="#10b981"
        />
      </PageCard>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList>
              <TabsTrigger value="week">
                <CalendarDays className="w-4 h-4 mr-2" />
                Week View
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="w-4 h-4 mr-2" />
                List View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {/* Member Filter */}
          <select
            value={filterMemberId?.toString() || ""}
            onChange={(e) =>
              setFilterMemberId(e.target.value ? BigInt(e.target.value) : null)
            }
            className="px-3 py-2 rounded-lg border border-brand-gray-300 bg-brand-surface text-brand-gray-800 text-sm"
          >
            <option value="">All Members</option>
            {members.map((m) => (
              <option key={m.id.toString()} value={m.id.toString()}>
                {m.name}
              </option>
            ))}
          </select>

          <FormButton
            onClick={() => {
              setEditingChore(null);
              setFormData({
                title: "",
                description: "",
                assignedTo: !isAdmin && myMember ? myMember.id : null,
                dueDate: getTodayLocalDate(),
                recurrence: "none",
              });
              setShowForm(true);
            }}
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Chore
          </FormButton>
        </div>
      </div>

      {/* Week View */}
      {viewMode === "week" && (
        <div className="space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={navigatePrevWeek}
              className="p-2 hover:bg-brand-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-brand-gray-600" />
            </button>
            <div className="text-center">
              <div className="font-light text-brand-gray-800">
                {currentWeekStart.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <button
                onClick={goToThisWeek}
                className="text-sm text-brand-primary-500 hover:text-brand-primary-600"
              >
                Go to this week
              </button>
            </div>
            <button
              onClick={navigateNextWeek}
              className="p-2 hover:bg-brand-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-brand-gray-600" />
            </button>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayChores = getChoresForDate(day);
              const completed = dayChores.filter((c) => c.isCompleted).length;
              const total = dayChores.length;
              const completionPercent =
                total > 0 ? (completed / total) * 100 : 0;

              return (
                <PageCard
                  key={day.toISOString()}
                  className={`${
                    isToday(day) ? "ring-2 ring-brand-primary-500/40" : ""
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="text-xs font-light text-brand-gray-500">
                      {day.toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                    <div className="text-lg font-light text-brand-gray-800">
                      {day.getDate()}
                    </div>
                    {total > 0 && (
                      <div className="mt-2">
                        <Progress value={completionPercent} className="h-1.5" />
                        <div className="text-xs text-brand-gray-500 mt-1">
                          {completed}/{total}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dayChores.length === 0 ? (
                      <div className="text-xs text-center text-brand-gray-400 py-4">
                        No chores
                      </div>
                    ) : (
                      dayChores.map((chore) => {
                        const assignee = members.find(
                          (m) => m.id === chore.assignedTo,
                        );
                        return (
                          <div
                            key={chore.id.toString()}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              chore.isCompleted
                                ? "bg-green-50 border-green-200 opacity-60"
                                : "bg-brand-gray-50 border-brand-gray-200 hover:shadow-sm"
                            }`}
                            onClick={() => handleToggleComplete(chore)}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  chore.isCompleted
                                    ? "border-green-500 bg-green-500"
                                    : "border-brand-gray-400"
                                }`}
                              >
                                {chore.isCompleted && (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-xs font-light truncate ${
                                    chore.isCompleted
                                      ? "line-through text-brand-gray-500"
                                      : "text-brand-gray-800"
                                  }`}
                                >
                                  {chore.title}
                                </div>
                                {assignee && (
                                  <div className="text-xs text-brand-gray-500 mt-0.5">
                                    {assignee.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </PageCard>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <PageCard>
          {pendingChores.length === 0 ? (
            <EmptyState
              icon={
                <CheckCircle2 className="w-12 h-12 text-brand-primary-500" />
              }
              title="All chores complete!"
              description="No pending chores right now"
            />
          ) : (
            <div className="space-y-2">
              {pendingChores.map((chore) => {
                const assignee = members.find((m) => m.id === chore.assignedTo);
                const dueDate = nanosecondsToDate(chore.dueDate);
                const isOverdue = dueDate < new Date();

                return (
                  <div
                    key={chore.id.toString()}
                    className="flex items-center gap-3 p-3 rounded-lg bg-brand-gray-50 border border-brand-gray-200 hover:shadow-sm transition-all"
                  >
                    <button
                      onClick={() => handleToggleComplete(chore)}
                      className="w-6 h-6 rounded-full border-2 border-brand-gray-400 hover:border-brand-primary-500 flex items-center justify-center transition-colors"
                    >
                      {chore.isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-brand-primary-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-light text-brand-gray-800">
                        {chore.title}
                      </div>
                      {chore.description && (
                        <div className="text-sm text-brand-gray-500">
                          {chore.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {assignee && (
                          <div className="flex items-center gap-1">
                            <MemberAvatar member={assignee} size="xs" />
                            <span className="text-xs text-brand-gray-500">
                              {assignee.name}
                            </span>
                          </div>
                        )}
                        <Badge
                          variant={isOverdue ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {formatNanoseconds(chore.dueDate, "MMM dd")}
                        </Badge>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(chore)}
                          className="p-2 hover:bg-brand-gray-200 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-brand-gray-600" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(chore)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </PageCard>
      )}

      {chores.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12 text-brand-primary-500" />}
          title="No chores yet"
          description="Add your first chore to get started!"
        />
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingChore(null);
        }}
        title={editingChore ? "Edit Chore" : "Add Chore"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">Title</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Take out trash"
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 font-light"
              required
            />
          </div>
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Description
            </Label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional details"
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 font-light"
            />
          </div>
          {isAdmin ? (
            <div>
              <Label className="text-brand-gray-600 font-light mb-2">
                Assign To
              </Label>
              <select
                value={formData.assignedTo?.toString() || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assignedTo: e.target.value ? BigInt(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-brand-gray-300 bg-brand-gray-100 text-brand-gray-800 font-light"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id.toString()} value={m.id.toString()}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label className="text-brand-gray-600 font-light mb-2">
                Assigned To
              </Label>
              <div className="w-full px-3 py-2 rounded-lg border border-brand-gray-300 bg-brand-gray-100 text-brand-gray-800 font-light">
                {myMember?.name || "You"}
              </div>
            </div>
          )}
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Due Date
            </Label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 font-light"
              required
            />
          </div>
          {!editingChore && (
            <div>
              <Label className="text-brand-gray-600 font-light mb-2">
                Recurrence
              </Label>
              <select
                value={formData.recurrence}
                onChange={(e) =>
                  setFormData({ ...formData, recurrence: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-brand-gray-300 bg-brand-gray-100 text-brand-gray-800 font-light"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily (7 days)</option>
                <option value="weekly">Weekly (4 weeks)</option>
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <FormButton
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingChore(null);
              }}
              variant="secondary"
            >
              Cancel
            </FormButton>
            <FormButton
              type="submit"
              disabled={createChore.isPending || updateChore.isPending}
              loading={createChore.isPending || updateChore.isPending}
              variant="primary"
            >
              {editingChore ? "Save" : "Add Chore"}
            </FormButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Chore"
        description="Are you sure you want to delete this chore? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};
