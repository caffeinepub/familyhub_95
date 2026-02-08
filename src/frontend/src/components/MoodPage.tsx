import React, { useState, useMemo } from "react";
import {
  useFamilyMembers,
  useMoodEntries,
  useCreateMoodEntry,
  useDeleteMoodEntry,
  useMyMember,
  useIsAdmin,
} from "../hooks/useQueries";
import { MOODS } from "../constants";
import { LoadingScreen } from "./LoadingScreen";
import { Toast } from "./shared/Toast";
import { ConfirmDialog } from "./shared/ConfirmDialog";
import { FormButton } from "./shared/FormButton";
import { MemberAvatar } from "./shared/MemberAvatar";
import { PageCard } from "./shared/PageCard";
import { EmptyState } from "./shared/EmptyState";
import { StatCard } from "./shared/StatCard";
import { TrendChart } from "./shared/TrendChart";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smile, X, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  calculateAverageMoodScore,
  getEmojiForScore,
  getMoodScore,
} from "../utils/dataHelpers";
import {
  formatNanoseconds,
  nanosecondsToDate,
  getLast7Days,
  dateToNanoseconds,
} from "../utils/dateHelpers";
import { prepareMoodChartData } from "../utils/chartHelpers";

type ViewMode = "checkin" | "history";

export const MoodPage: React.FC = () => {
  const { data: members = [], isLoading: membersLoading } = useFamilyMembers();
  const {
    data: moods = [],
    isLoading: moodsLoading,
    error,
    refetch,
  } = useMoodEntries();
  const { data: myMember } = useMyMember();
  const { data: isAdmin } = useIsAdmin();
  const createMood = useCreateMoodEntry();
  const deleteMood = useDeleteMoodEntry();

  const [viewMode, setViewMode] = useState<ViewMode>("checkin");
  const [selectedMember, setSelectedMember] = useState<bigint | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteMoodId, setDeleteMoodId] = useState<bigint | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
  };

  React.useEffect(() => {
    if (!isAdmin && myMember) {
      setSelectedMember(myMember.id);
    }
  }, [isAdmin, myMember]);

  // Analytics
  const analytics = useMemo(() => {
    const last7Days = getLast7Days();
    const last7DaysStart = last7Days[0].getTime();

    const recentMoods = moods.filter((m) => {
      const moodTime = nanosecondsToDate(m.date).getTime();
      return moodTime >= last7DaysStart;
    });

    const avgScore = calculateAverageMoodScore(recentMoods);
    const avgEmoji = moods.length === 0 ? "😊" : getEmojiForScore(avgScore);

    // Check for streak (7+ days of happy moods)
    const happyMoods = ["😊", "🤩"];
    const last7DaysHappy = last7Days.every((day) => {
      const dayMoods = moods.filter((m) => {
        const moodDate = nanosecondsToDate(m.date);
        return moodDate.toDateString() === day.toDateString();
      });
      return dayMoods.some((m) => happyMoods.includes(m.mood));
    });

    // Today's check-ins
    const today = new Date();
    const todayMoods = moods.filter((m) => {
      const moodDate = nanosecondsToDate(m.date);
      return moodDate.toDateString() === today.toDateString();
    });

    return {
      avgScore: avgScore.toFixed(1),
      avgEmoji,
      hasStreak: last7DaysHappy && recentMoods.length >= 7,
      todayCheckIns: todayMoods.length,
      totalCheckIns: moods.length,
    };
  }, [moods]);

  // Chart data
  const chartData = useMemo(() => prepareMoodChartData(moods), [moods]);

  // Per-member recent moods
  const memberMoods = useMemo(() => {
    return members.map((member) => {
      const memberMoodsList = moods
        .filter((m) => m.memberId === member.id)
        .sort((a, b) => Number(b.date - a.date));

      const recentMood = memberMoodsList[0];
      const last7 = memberMoodsList.slice(0, 7);

      return {
        member,
        recentMood: recentMood?.mood || null,
        recentNote: recentMood?.note || null,
        last7Days: last7,
      };
    });
  }, [members, moods]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const memberId = isAdmin ? selectedMember : (myMember?.id ?? null);

    if (memberId === null || !selectedMood) {
      showToast("Please select a family member and mood", "error");
      return;
    }

    try {
      await createMood.mutateAsync({
        memberId,
        mood: selectedMood,
        note,
        date: dateToNanoseconds(new Date()),
      });
      showToast("Mood logged successfully!", "success");
      setSelectedMember(null);
      setSelectedMood(null);
      setNote("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to log mood",
        "error",
      );
    }
  };

  const handleDeleteClick = (moodId: bigint) => {
    setDeleteMoodId(moodId);
  };

  const handleConfirmDelete = async () => {
    if (deleteMoodId !== null) {
      try {
        await deleteMood.mutateAsync(deleteMoodId);
        showToast("Mood entry deleted!", "success");
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to delete",
          "error",
        );
      }
    }
  };

  if (moodsLoading || membersLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<X className="w-12 h-12 text-red-400" />}
        title="Failed to load moods"
        description="Please try again"
        action={{ label: "Try Again", onClick: () => refetch() }}
      />
    );
  }

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
        <h2 className="text-3xl font-light text-brand-gray-800">
          Mood Tracker
        </h2>
        <p className="text-sm text-brand-gray-500 mt-1">
          Track family moods and emotional wellbeing
        </p>
      </div>

      {/* Streak Alert */}
      {analytics.hasStreak && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Positive Streak!</AlertTitle>
          <AlertDescription>
            Your family has logged happy moods for 7 days straight! 🎉
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mood Score Card */}
        <PageCard
          title="Family Mood Score"
          subtitle="Last 7 days average"
          className=""
        >
          <div className="text-center py-4">
            <div className="text-4xl mb-3">{analytics.avgEmoji}</div>
            <div className="text-3xl font-light text-brand-gray-800 mb-2">
              {analytics.avgScore}/10
            </div>
            <Progress
              value={Number(analytics.avgScore) * 10}
              className="h-2 mb-2"
            />
            <div className="text-sm text-brand-gray-500">
              {analytics.todayCheckIns} check-ins today
            </div>
          </div>
        </PageCard>

        {/* Mood Trends Chart */}
        <PageCard
          title="Mood Trends"
          subtitle="Last 7 days"
          className="lg:col-span-2"
        >
          <TrendChart
            data={chartData}
            type="area"
            dataKey="score"
            xKey="date"
            color="#a855f7"
          />
        </PageCard>
      </div>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList>
          <TabsTrigger value="checkin">
            <Smile className="w-4 h-4 mr-2" />
            Check In
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Check In View */}
      {viewMode === "checkin" && (
        <div className="space-y-6">
          {/* Check-in Form - First */}
          <PageCard title="Log a Mood" subtitle="How is everyone feeling?">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-brand-gray-600 font-light mb-2">
                  Family Member
                </Label>
                {isAdmin ? (
                  <select
                    value={selectedMember?.toString() || ""}
                    onChange={(e) =>
                      setSelectedMember(
                        e.target.value ? BigInt(e.target.value) : null,
                      )
                    }
                    className="w-full px-4 py-2 rounded-lg border border-brand-gray-300 bg-brand-gray-100 text-brand-gray-800 font-light"
                    required
                  >
                    <option value="">Select a member</option>
                    {members.map((m) => (
                      <option key={m.id.toString()} value={m.id.toString()}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2 rounded-lg border border-brand-gray-300 bg-brand-gray-100 text-brand-gray-800 font-light">
                    {myMember?.name || "You"}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-brand-gray-600 font-light mb-2">
                  Mood
                </Label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.emoji}
                      type="button"
                      onClick={() => setSelectedMood(mood.emoji)}
                      className={`aspect-square text-3xl rounded-xl border-2 transition-all hover:scale-105 ${
                        selectedMood === mood.emoji
                          ? "border-brand-primary-500 bg-brand-primary-500/20 scale-105"
                          : "border-brand-gray-300 hover:border-brand-primary-500"
                      }`}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-brand-gray-600 font-light mb-2">
                  Note (Optional)
                </Label>
                <Input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="How are you feeling?"
                  className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 font-light"
                />
              </div>

              <FormButton
                type="submit"
                disabled={
                  (isAdmin ? selectedMember === null : !myMember) ||
                  !selectedMood ||
                  createMood.isPending
                }
                loading={createMood.isPending}
                variant="primary"
                className="w-full"
              >
                Log Mood
              </FormButton>
            </form>
          </PageCard>

          {/* Per-Member Mood Cards - After Log a Mood */}
          <div>
            <h3 className="text-lg font-light text-brand-gray-800 mb-4">
              Family Moods
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {memberMoods.map(({ member, recentMood, last7Days }) => (
                <HoverCard key={member.id.toString()}>
                  <HoverCardTrigger asChild>
                    <PageCard className="cursor-pointer hover:shadow-lg transition-all">
                      <div className="text-center">
                        <MemberAvatar
                          member={member}
                          size="lg"
                          className="mx-auto mb-2"
                        />
                        <div className="font-light text-brand-gray-800 mb-1">
                          {member.name}
                        </div>
                        <div className="text-3xl mb-1">{recentMood || "—"}</div>
                        <div className="text-xs text-brand-gray-500">
                          {last7Days.length > 0 ? (
                            <>
                              Last:{" "}
                              {formatNanoseconds(last7Days[0].date, "MMM dd")}
                            </>
                          ) : (
                            "No moods yet"
                          )}
                        </div>
                      </div>
                    </PageCard>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64">
                    <div className="space-y-2">
                      <h4 className="font-light text-brand-gray-800">
                        Last 7 Days
                      </h4>
                      {last7Days.length === 0 ? (
                        <p className="text-sm text-brand-gray-500">
                          No recent moods
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {last7Days.map((m) => (
                            <div
                              key={m.id.toString()}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-xl">{m.mood}</span>
                              <span className="text-xs text-brand-gray-500">
                                {formatNanoseconds(m.date, "MMM dd")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {viewMode === "history" && (
        <PageCard title="Mood History" subtitle="Recent check-ins" className="">
          {moods.length === 0 ? (
            <EmptyState
              icon={<Smile className="w-12 h-12 text-brand-primary-500" />}
              title="No mood entries yet"
              description="Start tracking moods to see history"
            />
          ) : (
            <div className="space-y-3">
              {moods
                .slice()
                .sort((a, b) => Number(b.date - a.date))
                .slice(0, 20)
                .map((mood) => {
                  const member = members.find((m) => m.id === mood.memberId);
                  if (!member) return null;

                  return (
                    <div
                      key={mood.id.toString()}
                      className="flex items-center gap-4 p-3 rounded-lg bg-brand-gray-50 border border-brand-gray-200"
                    >
                      <div className="text-2xl">{mood.mood}</div>
                      <MemberAvatar member={member} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-light text-brand-gray-800">
                          {member.name}
                        </div>
                        {mood.note && (
                          <div className="text-sm text-brand-gray-500 truncate">
                            {mood.note}
                          </div>
                        )}
                        <div className="text-xs text-brand-gray-400 mt-0.5">
                          {formatNanoseconds(
                            mood.date,
                            "MMM dd, yyyy 'at' h:mm a",
                          )}
                        </div>
                      </div>
                      {(isAdmin || mood.memberId === myMember?.id) && (
                        <button
                          onClick={() => handleDeleteClick(mood.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </PageCard>
      )}

      {moods.length === 0 && (
        <EmptyState
          icon={<Smile className="w-12 h-12 text-brand-primary-500" />}
          title="No mood entries yet"
          description="Start tracking family moods to see trends!"
        />
      )}

      <ConfirmDialog
        isOpen={deleteMoodId !== null}
        onClose={() => setDeleteMoodId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Mood Entry"
        description="Are you sure you want to delete this mood entry? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};
