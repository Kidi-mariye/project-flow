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
        $upcomingDeadlines = (clone $taskQuery)
            ->where('completed', false)
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$now, $now->copy()->addDays(7)])
            ->count();

        $overdueTasks = (clone $taskQuery)
            ->where('completed', false)
            ->whereNotNull('due_date')
            ->where('due_date', '<', $now)
            ->count();

        $activeCourses = $user->categories()->whereHas('tasks')->count();

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
            'upcoming_deadlines' => $upcomingDeadlines,
            'overdue_tasks' => $overdueTasks,
            'active_courses' => $activeCourses,
            'completion_percent' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0,
            'progress_by_category' => $progressByCategory,
        ]);
    }
}
