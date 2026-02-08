import React, { useState, useMemo } from "react";
import {
  useFamilyMembers,
  useMealOptions,
  useCreateMealOption,
  useVoteForMeal,
  useSelectMeal,
  useDeleteMealOption,
  useMealAttendance,
  useSetMealAttendance,
  useIsAdmin,
  useMyMember,
} from "../hooks/useQueries";
import type { MealOption } from "../backend";
import { LoadingScreen } from "./LoadingScreen";
import { Toast } from "./shared/Toast";
import { Modal } from "./shared/Modal";
import { FormButton } from "./shared/FormButton";
import { MemberAvatar } from "./shared/MemberAvatar";
import { PageCard } from "./shared/PageCard";
import { EmptyState } from "./shared/EmptyState";
import { UtensilsCrossed, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  formatNanoseconds,
  nanosecondsToDate,
  getTodayLocalDate,
  localDateStringToNanoseconds,
  dateToNanoseconds,
  NS_PER_MS,
  NS_PER_DAY,
} from "../utils/dateHelpers";

export const MealsPage: React.FC = () => {
  const { data: members = [], isLoading: membersLoading } = useFamilyMembers();
  const {
    data: meals = [],
    isLoading: mealsLoading,
    error,
    refetch,
  } = useMealOptions();
  const { data: isAdmin } = useIsAdmin();
  const { data: myMember } = useMyMember();
  const createMeal = useCreateMealOption();
  const voteForMeal = useVoteForMeal();
  const selectMeal = useSelectMeal();
  const deleteMeal = useDeleteMealOption();
  const setMealAttendance = useSetMealAttendance();

  // Get today's date for attendance
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return dateToNanoseconds(now);
  }, []);

  const { data: attendanceList = [] } = useMealAttendance(today);

  const [showForm, setShowForm] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("today");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scheduledDate: getTodayLocalDate(),
  });
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myMember) return;
    try {
      const scheduledDate = localDateStringToNanoseconds(
        formData.scheduledDate,
      );
      await createMeal.mutateAsync({
        name: formData.name,
        description: formData.description,
        proposedBy: myMember.id,
        scheduledDate,
      });
      showToast("Meal suggestion added!", "success");
      setShowForm(false);
      setFormData({
        name: "",
        description: "",
        scheduledDate: getTodayLocalDate(),
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to add meal",
        "error",
      );
    }
  };

  const handleVote = async (mealId: bigint) => {
    if (!myMember) return;
    try {
      await voteForMeal.mutateAsync({ mealId, memberId: myMember.id });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to vote", "error");
    }
  };

  const handleSelect = async (mealId: bigint) => {
    try {
      await selectMeal.mutateAsync(mealId);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to select meal",
        "error",
      );
    }
  };

  const handleDelete = async (mealId: bigint) => {
    try {
      await deleteMeal.mutateAsync(mealId);
      showToast("Meal removed!", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to remove meal",
        "error",
      );
    }
  };

  const handleAttendanceToggle = async (
    memberId: bigint,
    currentlyAttending: boolean,
  ) => {
    try {
      await setMealAttendance.mutateAsync({
        date: today,
        memberId,
        attending: !currentlyAttending,
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to update attendance",
        "error",
      );
    }
  };

  // Build attendance map for today
  const attendanceMap = useMemo(() => {
    const map = new Map<string, boolean>();
    attendanceList.forEach((a) => {
      map.set(a.memberId.toString(), a.attending);
    });
    return map;
  }, [attendanceList]);

  // Count attending members for today
  const attendingCount = useMemo(() => {
    let count = 0;
    members.forEach((member) => {
      const attending = attendanceMap.get(member.id.toString());
      // Default to attending if no record exists
      if (attending === undefined || attending === true) {
        count++;
      }
    });
    return count;
  }, [members, attendanceMap]);

  // Statistics
  const stats = useMemo(() => {
    const totalVotes = meals.reduce((sum, m) => sum + m.votes.length, 0);
    const selectedMeals = meals.filter((m) => m.isSelected);
    const attendanceRate =
      members.length > 0 ? (attendingCount / members.length) * 100 : 0;

    // Most popular meal (by votes)
    const mostPopular = meals.reduce((prev, current) => {
      return current.votes.length > prev.votes.length ? current : prev;
    }, meals[0]);

    return {
      totalProposed: meals.length,
      totalVotes,
      selectedCount: selectedMeals.length,
      attendanceRate,
      mostPopular: mostPopular?.name || "—",
    };
  }, [meals, attendingCount, members.length]);

  // Filter and group meals by date
  const filteredMeals = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayNs = dateToNanoseconds(now);

    return meals.filter((meal) => {
      const mealDateNs = meal.scheduledDate;
      if (selectedDateFilter === "today") {
        return mealDateNs >= todayNs && mealDateNs < todayNs + NS_PER_DAY;
      } else if (selectedDateFilter === "week") {
        return (
          mealDateNs >= todayNs && mealDateNs < todayNs + NS_PER_DAY * BigInt(7)
        );
      }
      return true;
    });
  }, [meals, selectedDateFilter]);

  const mealsByDate = useMemo(() => {
    const groups: Record<string, MealOption[]> = {};
    filteredMeals.forEach((meal) => {
      const dateStr = nanosecondsToDate(
        meal.scheduledDate,
      ).toLocaleDateString();
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(meal);
    });
    // Sort each group by vote count (descending)
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => b.votes.length - a.votes.length);
    });
    return groups;
  }, [filteredMeals]);

  // Top meals by votes (for leaderboard)
  const topMeals = useMemo(() => {
    return [...filteredMeals]
      .sort((a, b) => b.votes.length - a.votes.length)
      .slice(0, 5);
  }, [filteredMeals]);

  // Week view: Get next 7 days with meals
  const weekView = useMemo(() => {
    const days: Array<{ date: Date; meals: MealOption[] }> = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dayStart = dateToNanoseconds(date);
      const dayEnd = dayStart + NS_PER_DAY;

      const dayMeals = meals
        .filter((m) => m.scheduledDate >= dayStart && m.scheduledDate < dayEnd)
        .sort((a, b) => b.votes.length - a.votes.length);

      days.push({ date, meals: dayMeals });
    }
    return days;
  }, [meals]);

  const isLoading = membersLoading || mealsLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<X className="w-12 h-12 text-red-400" />}
        title="Failed to load meals"
        description="Please try again"
        action={{
          label: "Try Again",
          onClick: () => refetch(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Messages */}
      <Toast
        message={toastMessage?.message || ""}
        type={toastMessage?.type || "success"}
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light text-brand-gray-800">
            Meal Planning
          </h2>
          <p className="text-sm text-brand-gray-500 mt-1">
            Vote on meals and track attendance
          </p>
        </div>
        <FormButton onClick={() => setShowForm(true)} variant="primary">
          + Suggest Meal
        </FormButton>
      </div>

      {/* Who's Eating Tonight - Attendance Section */}
      <PageCard
        title="Who's eating tonight?"
        subtitle={`${attendingCount} of ${members.length} attending`}
      >
        <div className="flex gap-3 flex-wrap">
          {members.map((member) => {
            const attendingValue = attendanceMap.get(member.id.toString());
            // Default to attending if no record
            const isAttending =
              attendingValue === undefined || attendingValue === true;
            const canModify =
              isAdmin || (myMember && member.id === myMember.id);

            return (
              <button
                key={member.id.toString()}
                onClick={() => handleAttendanceToggle(member.id, isAttending)}
                disabled={!canModify || setMealAttendance.isPending}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                  !canModify ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  isAttending
                    ? "border-green-500 bg-green-500/20"
                    : "border-brand-gray-300 bg-brand-gray-100/30 opacity-60"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform ${
                    !isAttending ? "grayscale" : ""
                  }`}
                  style={{ backgroundColor: member.color }}
                >
                  {member.avatarEmoji}
                </span>
                <span
                  className={`text-sm font-light ${!isAttending ? "line-through text-brand-gray-500" : "text-brand-gray-800"}`}
                >
                  {member.name}
                </span>
                <span
                  className={`text-lg ${isAttending ? "text-green-400" : "text-brand-gray-500"}`}
                >
                  {isAttending ? "+" : "-"}
                </span>
              </button>
            );
          })}
        </div>
        {members.some((m) => {
          const v = attendanceMap.get(m.id.toString());
          return v === false;
        }) && (
          <p className="text-xs text-brand-gray-500 font-extralight mt-3">
            Members marked as not attending won't be counted for tonight's meal.
          </p>
        )}
      </PageCard>

      {/* View Toggle */}
      <Tabs
        value={selectedDateFilter}
        onValueChange={(v) => setSelectedDateFilter(v)}
      >
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="all">All Meals</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Voting Leaderboard - Show when there are meals */}
      {topMeals.length > 0 && (
        <PageCard
          title="Voting Leaderboard"
          subtitle="Top meal suggestions by votes"
        >
          <div className="space-y-3">
            {topMeals.map((meal, index) => {
              const proposer = members.find((m) => m.id === meal.proposedBy);
              const totalVotes = topMeals.reduce(
                (sum, m) => sum + m.votes.length,
                0,
              );
              const votePercentage =
                totalVotes > 0 ? (meal.votes.length / totalVotes) * 100 : 0;
              const rank = index + 1;

              return (
                <div
                  key={meal.id.toString()}
                  className="flex items-center gap-4 p-3 rounded-lg bg-brand-gray-50 border border-brand-gray-200"
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-light shrink-0 ${
                      rank === 1
                        ? "bg-yellow-500 text-white"
                        : rank === 2
                          ? "bg-gray-400 text-white"
                          : rank === 3
                            ? "bg-orange-600 text-white"
                            : "bg-brand-gray-300 text-brand-gray-600"
                    }`}
                  >
                    {rank === 1
                      ? "🥇"
                      : rank === 2
                        ? "🥈"
                        : rank === 3
                          ? "🥉"
                          : `#${rank}`}
                  </div>

                  {/* Meal Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-light text-brand-gray-800">
                        {meal.name}
                      </span>
                      {meal.isSelected && (
                        <Badge className="bg-green-500 text-white">
                          Winner
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-brand-gray-500 font-light">
                      by {proposer?.name || "Unknown"} •{" "}
                      {formatNanoseconds(meal.scheduledDate, "MMM dd")}
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-light text-brand-gray-800">
                          {meal.votes.length} vote
                          {meal.votes.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-brand-gray-500">
                          ({Math.round(votePercentage)}%)
                        </span>
                      </div>
                      <Progress value={votePercentage} className="h-2" />
                    </div>
                  </div>

                  {/* Quick Vote Button */}
                  {myMember && (
                    <FormButton
                      onClick={() => handleVote(meal.id)}
                      disabled={voteForMeal.isPending}
                      variant={
                        meal.votes.includes(myMember.id)
                          ? "primary"
                          : "secondary"
                      }
                      className="text-sm"
                    >
                      {meal.votes.includes(myMember.id) ? "Voted" : "Vote"}
                    </FormButton>
                  )}
                </div>
              );
            })}
          </div>
        </PageCard>
      )}

      {/* Meals by Date */}
      {Object.entries(mealsByDate).map(([dateStr, dateMeals]) => {
        const totalVotes = dateMeals.reduce(
          (sum, m) => sum + m.votes.length,
          0,
        );
        const maxVotes = Math.max(...dateMeals.map((m) => m.votes.length), 1);

        return (
          <PageCard
            key={dateStr}
            title={dateStr}
            subtitle={`${totalVotes} total votes`}
          >
            <div className="space-y-4">
              {dateMeals.map((meal, index) => {
                const proposer = members.find((m) => m.id === meal.proposedBy);
                const hasVoted = myMember && meal.votes.includes(myMember.id);
                const votePercentage =
                  totalVotes > 0 ? (meal.votes.length / totalVotes) * 100 : 0;
                const isLeading =
                  meal.votes.length === maxVotes && maxVotes > 0;

                return (
                  <div
                    key={meal.id.toString()}
                    className={`relative rounded-xl overflow-hidden ${
                      meal.isSelected
                        ? "bg-green-500/10 border-2 border-green-400"
                        : isLeading && index === 0
                          ? "bg-brand-primary-500/10 border-2 border-brand-primary-500/40"
                          : "bg-brand-gray-100/30 border border-brand-gray-200"
                    }`}
                  >
                    {/* Vote Progress Bar Background */}
                    <div
                      className={`absolute inset-y-0 left-0 transition-all ${
                        meal.isSelected
                          ? "bg-green-500/20"
                          : "bg-brand-primary-500/20"
                      }`}
                      style={{ width: `${votePercentage}%`, opacity: 0.5 }}
                    />

                    <div className="relative flex items-start gap-4 p-4">
                      <UtensilsCrossed className="w-8 h-8 text-brand-primary-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-light text-brand-gray-800">
                            {meal.name}
                          </span>
                          {meal.isSelected && (
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-light">
                              Winner!
                            </span>
                          )}
                          {isLeading && index === 0 && !meal.isSelected && (
                            <span className="text-xs bg-brand-primary-500 text-white px-2 py-0.5 rounded-full font-light">
                              Leading
                            </span>
                          )}
                        </div>
                        {meal.description && (
                          <div className="text-sm text-brand-gray-500 font-extralight truncate">
                            {meal.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-brand-gray-500 font-extralight">
                            by{" "}
                            <span className="font-light text-brand-gray-600">
                              {proposer?.name || "Unknown"}
                            </span>
                          </span>
                        </div>

                        {/* Vote visualization */}
                        <div className="mt-3 space-y-2">
                          {/* Vote count and percentage */}
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-light text-brand-gray-800">
                              {meal.votes.length}
                            </span>
                            <span className="text-sm text-brand-gray-500 font-extralight">
                              vote{meal.votes.length !== 1 ? "s" : ""}
                            </span>
                            {totalVotes > 0 && (
                              <span className="text-sm font-light text-brand-primary-500">
                                ({Math.round(votePercentage)}%)
                              </span>
                            )}
                          </div>

                          {/* Voter avatars with names */}
                          {meal.votes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {meal.votes.map((voterId) => {
                                const voter = members.find(
                                  (m) => m.id === voterId,
                                );
                                return voter ? (
                                  <div
                                    key={voterId.toString()}
                                    className="flex items-center gap-1"
                                  >
                                    <MemberAvatar
                                      member={voter}
                                      size="xs"
                                      showName
                                    />
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2">
                        {myMember && (
                          <FormButton
                            onClick={() => handleVote(meal.id)}
                            disabled={voteForMeal.isPending}
                            variant={hasVoted ? "primary" : "secondary"}
                            className="text-sm"
                          >
                            {hasVoted ? "Voted!" : "Vote"}
                          </FormButton>
                        )}
                        {isAdmin && (
                          <FormButton
                            onClick={() => handleSelect(meal.id)}
                            disabled={selectMeal.isPending}
                            variant={meal.isSelected ? "primary" : "secondary"}
                            className={`text-sm ${
                              meal.isSelected
                                ? "bg-green-500 hover:bg-green-600"
                                : "border-green-500/40 text-green-400 hover:bg-green-500/10"
                            }`}
                          >
                            {meal.isSelected ? "Winner" : "Select"}
                          </FormButton>
                        )}
                        <button
                          onClick={() => handleDelete(meal.id)}
                          disabled={deleteMeal.isPending}
                          className="text-brand-gray-500 hover:text-red-400 text-sm disabled:opacity-50 px-2 font-light"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PageCard>
        );
      })}

      {filteredMeals.length === 0 && (
        <EmptyState
          icon={
            <UtensilsCrossed className="w-12 h-12 text-brand-primary-500" />
          }
          title={
            selectedDateFilter === "today"
              ? "No meal suggestions for today"
              : selectedDateFilter === "week"
                ? "No meal suggestions this week"
                : "No meal suggestions yet"
          }
          description="Add meal ideas and let the family vote!"
        />
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Suggest a Meal"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Meal Name
            </Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 placeholder:text-brand-gray-400 font-light"
              required
            />
          </div>
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Description (optional)
            </Label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 placeholder:text-brand-gray-400 font-light"
            />
          </div>
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              For Date
            </Label>
            <Input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
              }
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 font-light"
              required
            />
          </div>
          <div className="flex gap-2 pt-4">
            <FormButton
              type="button"
              onClick={() => setShowForm(false)}
              variant="secondary"
            >
              Cancel
            </FormButton>
            <FormButton
              type="submit"
              disabled={!myMember || !formData.name.trim()}
              loading={createMeal.isPending}
              variant="primary"
            >
              Suggest
            </FormButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
