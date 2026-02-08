import React, { useMemo } from "react";
import {
  useFamilyMembers,
  useMoodEntries,
  useCalendarEvents,
  useChores,
  useMealOptions,
  useShoppingItems,
} from "../hooks/useQueries";
import { PageCard } from "./shared/PageCard";
import { TrendChart } from "./shared/TrendChart";
import { ActivityFeed } from "./shared/ActivityFeed";
import { MemberAvatar } from "./shared/MemberAvatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Calendar,
  CheckCircle2,
  Smile,
  UtensilsCrossed,
  Users,
  Cake,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  calculateChange,
  calculateAverageMoodScore,
  getEmojiForScore,
  generateActivityFeed,
  filterToday,
} from "../utils/dataHelpers";
import {
  isThisWeekNano,
  isLastWeekNano,
  formatNanoseconds,
  nanosecondsToDate,
  daysUntilNano,
  isWithinDaysFromNow,
} from "../utils/dateHelpers";
import {
  prepareMoodChartData,
  prepareChoreChartData,
} from "../utils/chartHelpers";

export const Dashboard: React.FC = () => {
  const { data: members = [] } = useFamilyMembers();
  const { data: allMoods = [] } = useMoodEntries();
  const { data: events = [] } = useCalendarEvents();
  const { data: chores = [] } = useChores();
  const { data: meals = [] } = useMealOptions();
  const { data: shoppingItems = [] } = useShoppingItems();

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();

    // This week vs last week chores completed
    const thisWeekCompleted = chores.filter(
      (c) => c.isCompleted && isThisWeekNano(c.dueDate),
    );
    const lastWeekCompleted = chores.filter(
      (c) => c.isCompleted && isLastWeekNano(c.dueDate),
    );

    // Events this week
    const eventsThisWeek = events.filter((e) => isThisWeekNano(e.startDate));
    const todayEvents = events.filter((e) => {
      const eventDate = nanosecondsToDate(e.startDate);
      return eventDate.toDateString() === today.toDateString();
    });

    // Mood average
    const recentMoods = allMoods.filter((m) => isThisWeekNano(m.date));
    const avgMoodScore = calculateAverageMoodScore(recentMoods);

    // Chore completion trend (last 7 days)
    const completionTrend = prepareChoreChartData(chores)
      .map((d) => Number(d.rate))
      .filter((rate) => rate > 0);

    return {
      members: members.length,
      choresCompleted: {
        value: thisWeekCompleted.length,
        change: calculateChange(
          thisWeekCompleted.length,
          lastWeekCompleted.length,
        ),
        trend: completionTrend.length > 0 ? completionTrend : undefined,
      },
      moodAverage: {
        score: avgMoodScore,
        emoji: getEmojiForScore(avgMoodScore),
      },
      events: {
        thisWeek: eventsThisWeek.length,
        today: todayEvents.length,
      },
    };
  }, [members, chores, events, allMoods]);

  // Today's data
  const todayData = useMemo(() => {
    const today = new Date();

    return {
      moods: allMoods.filter((m) => {
        const moodDate = nanosecondsToDate(m.date);
        return moodDate.toDateString() === today.toDateString();
      }),
      chores: chores.filter((c) => {
        if (c.isCompleted) return false;
        const dueDate = nanosecondsToDate(c.dueDate);
        return dueDate.toDateString() === today.toDateString();
      }),
      events: events
        .filter((e) => {
          const eventDate = nanosecondsToDate(e.startDate);
          return eventDate.toDateString() === today.toDateString();
        })
        .sort((a, b) => Number(a.startDate - b.startDate)),
      meals: meals.filter((m) => {
        const mealDate = nanosecondsToDate(m.scheduledDate);
        return mealDate.toDateString() === today.toDateString();
      }),
    };
  }, [allMoods, chores, events, meals]);

  // Alerts
  const alerts = useMemo(() => {
    const overdue = chores.filter((c) => {
      if (c.isCompleted) return false;
      return nanosecondsToDate(c.dueDate) < new Date();
    });

    const upcomingBirthdays = events.filter(
      (e) => e.eventType === "birthday" && isWithinDaysFromNow(e.startDate, 7),
    );

    return { overdue, upcomingBirthdays };
  }, [chores, events]);

  // Chart data
  const moodChartData = useMemo(
    () => prepareMoodChartData(allMoods),
    [allMoods],
  );
  const choreChartData = useMemo(() => prepareChoreChartData(chores), [chores]);

  // Activity feed
  const activities = useMemo(
    () => generateActivityFeed(allMoods, chores, events, meals, members, 10),
    [allMoods, chores, events, meals, members],
  );

  const selectedMeal = todayData.meals.find((m) => m.isSelected);
  const upcomingEvents = events
    .filter((e) => nanosecondsToDate(e.startDate) >= new Date())
    .sort((a, b) => Number(a.startDate - b.startDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-medium text-brand-gray-800">Dashboard</h2>
        <p className="text-sm text-brand-gray-500 mt-1">
          Welcome back! Here's your family overview.
        </p>
      </div>

      {/* Alerts */}
      {alerts.overdue.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Overdue Chores</AlertTitle>
          <AlertDescription>
            You have {alerts.overdue.length} overdue chore
            {alerts.overdue.length === 1 ? "" : "s"}
          </AlertDescription>
        </Alert>
      )}

      {alerts.upcomingBirthdays.length > 0 && (
        <Alert>
          <Cake className="h-4 w-4" />
          <AlertTitle>Upcoming Birthday!</AlertTitle>
          <AlertDescription>
            {alerts.upcomingBirthdays[0].title} in{" "}
            {daysUntilNano(alerts.upcomingBirthdays[0].startDate)} days -{" "}
            {formatNanoseconds(alerts.upcomingBirthdays[0].startDate, "MMM dd")}
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageCard title="Mood Trends" subtitle="Last 7 days">
          <TrendChart
            data={moodChartData}
            type="area"
            dataKey="score"
            xKey="date"
            color="#a855f7"
          />
        </PageCard>

        <PageCard title="Chore Completion Rate" subtitle="Last 7 days">
          <TrendChart
            data={choreChartData}
            type="bar"
            dataKey="rate"
            xKey="date"
            color="#10b981"
          />
        </PageCard>
      </div>

      {/* Activity Feed & Today's Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <PageCard title="Recent Activity" className="lg:col-span-1">
          <ActivityFeed activities={activities} maxItems={8} />
        </PageCard>

        {/* Today's Highlights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Family Moods */}
          <PageCard
            title="Family Moods"
            subtitle="Today"
            headerAction={<Smile className="w-5 h-5 text-brand-primary-500" />}
          >
            {todayData.moods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayData.moods.map((mood) => {
                  const member = members.find((m) => m.id === mood.memberId);
                  if (!member) return null;
                  return (
                    <div
                      key={mood.id.toString()}
                      className="flex items-center gap-3 bg-brand-gray-50 rounded-lg px-4 py-3"
                    >
                      <MemberAvatar member={member} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-brand-gray-800 truncate">
                          {member.name}
                        </div>
                        <div className="text-sm text-brand-gray-500 truncate">
                          {mood.note || "No note"}
                        </div>
                      </div>
                      <span className="text-2xl">{mood.mood}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-brand-gray-400">
                <Smile className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No moods logged yet today</p>
              </div>
            )}
          </PageCard>

          {/* Today's Chores & Events Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PageCard
              title="Today's Chores"
              subtitle={`${todayData.chores.length} pending`}
              headerAction={
                <CheckCircle2 className="w-5 h-5 text-brand-primary-500" />
              }
            >
              {todayData.chores.length > 0 ? (
                <div className="space-y-2">
                  {todayData.chores.slice(0, 4).map((chore) => {
                    const assignee = chore.assignedTo
                      ? members.find((m) => m.id === chore.assignedTo)
                      : null;
                    return (
                      <div
                        key={chore.id.toString()}
                        className="flex items-center gap-3 bg-brand-gray-50 rounded-lg px-3 py-2"
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-brand-primary-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-brand-gray-800 truncate">
                            {chore.title}
                          </div>
                          {assignee && (
                            <div className="text-xs text-brand-gray-500">
                              {assignee.name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {todayData.chores.length > 4 && (
                    <p className="text-xs text-brand-gray-400 text-center pt-1">
                      +{todayData.chores.length - 4} more
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-brand-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">All done for today!</p>
                </div>
              )}
            </PageCard>

            <PageCard
              title="Today's Events"
              subtitle={`${todayData.events.length} scheduled`}
              headerAction={
                <Calendar className="w-5 h-5 text-brand-primary-500" />
              }
            >
              {todayData.events.length > 0 ? (
                <div className="space-y-2">
                  {todayData.events.slice(0, 4).map((event) => (
                    <div
                      key={event.id.toString()}
                      className="flex items-center gap-3 bg-brand-gray-50 rounded-lg px-3 py-2"
                    >
                      <Calendar className="w-4 h-4 text-brand-primary-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-brand-gray-800 truncate">
                          {event.title}
                        </div>
                        <div className="text-xs text-brand-gray-500">
                          {formatNanoseconds(event.startDate, "h:mm a")}
                        </div>
                      </div>
                    </div>
                  ))}
                  {todayData.events.length > 4 && (
                    <p className="text-xs text-brand-gray-400 text-center pt-1">
                      +{todayData.events.length - 4} more
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-brand-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No events today</p>
                </div>
              )}
            </PageCard>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {members.length === 0 && (
        <div className="bg-brand-surface rounded-xl p-8 border border-brand-gray-200 text-center shadow-soft">
          <div className="w-16 h-16 rounded-full bg-brand-primary-500 flex items-center justify-center mx-auto mb-4 shadow-soft">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-brand-gray-800 mb-2">
            Welcome to FamilyHub!
          </h3>
          <p className="text-brand-gray-500 mb-4">
            Get started by adding family members or loading sample data in
            Settings.
          </p>
        </div>
      )}
    </div>
  );
};
