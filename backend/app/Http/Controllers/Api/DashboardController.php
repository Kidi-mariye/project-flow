<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function metrics(Request $request)
    {
        $now = Carbon::now();
        $user = $request->user();

        $taskQuery = $user->tasks();
        $totalTasks = (clone $taskQuery)->count();
        $completedTasks = (clone $taskQuery)->where('completed', true)->count();
        $overdueTasks = (clone $taskQuery)
            ->where('completed', false)
            ->whereNotNull('due_date')
            ->where('due_date', '<', $now)
            ->count();

        $pendingTasks = (clone $taskQuery)
            ->where('completed', false)
            ->where(function ($query) use ($now) {
                $query->whereNull('due_date')
                    ->orWhere('due_date', '>=', $now);
            })
            ->count();

        $upcomingDeadlines = (clone $taskQuery)
            ->where('completed', false)
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$now, $now->copy()->addDays(7)])
            ->count();

        $activeCourses = $user->categories()->whereHas('tasks')->count();

        $addedThisMonth = (clone $taskQuery)
            ->whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->count();

        $tasksByPriority = (clone $taskQuery)
            ->selectRaw('priority, COUNT(*) as aggregate')
            ->groupBy('priority')
            ->pluck('aggregate', 'priority');

        $tasksUpdatedToday = (clone $taskQuery)
            ->whereDate('updated_at', $now->toDateString())
            ->count();

        $activeToday = max(1, $tasksUpdatedToday);
        $teamMembers = 1;
        $toDoPercentage = $totalTasks > 0 ? round(($pendingTasks / $totalTasks) * 100) : 0;

        $progressByCategory = $user->categories()
            ->withCount('tasks')
            ->withCount([
                'tasks as completed_tasks_count' => fn ($query) => $query->where('completed', true),
            ])
            ->get()
            ->map(function ($category) {
                $percent = $category->tasks_count > 0
                    ? round(($category->completed_tasks_count / $category->tasks_count) * 100)
                    : 0;

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'color' => $category->color,
                    'tasks_count' => $category->tasks_count,
                    'completed_tasks_count' => $category->completed_tasks_count,
                    'progress_percent' => $percent,
                ];
            })
            ->values();

        return response()->json([
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'pending_tasks' => $pendingTasks,
            'upcoming_deadlines' => $upcomingDeadlines,
            'overdue_tasks' => $overdueTasks,
            'active_courses' => $activeCourses,
            'added_this_month' => $addedThisMonth,
            'hours_logged' => null,
            'team_avg_hours' => null,
            'team_members' => $teamMembers,
            'active_today' => $activeToday,
            'to_do_percentage' => $toDoPercentage,
            'overdue_trend' => $overdueTasks > 0 ? "{$overdueTasks} overdue" : 'No overdue tasks',
            'tasks_by_priority' => [
                'high' => (int) ($tasksByPriority['high'] ?? 0),
                'medium' => (int) ($tasksByPriority['medium'] ?? 0),
                'low' => (int) ($tasksByPriority['low'] ?? 0),
            ],
            'completion_percent' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0,
            'completion_percentage' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0,
            'progress_by_category' => $progressByCategory,
        ]);
    }
}
