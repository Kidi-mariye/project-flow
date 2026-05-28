<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    private function applyReminderDefaults(array $validated, Request $request): array
    {
        if (empty($validated['due_date'])) {
            $validated['reminder_at'] = null;

            return $validated;
        }

        if (! empty($validated['reminder_at'])) {
            return $validated;
        }

        $settings = $request->user()->settings ?? [];
        $notificationsEnabled = data_get($settings, 'notifications.enabled', true);

        if (! $notificationsEnabled) {
            $validated['reminder_at'] = null;

            return $validated;
        }

        $reminderTiming = (int) data_get($settings, 'notifications.reminderTiming', 10);
        $validated['reminder_at'] = Carbon::parse($validated['due_date'])
            ->subMinutes(max(0, $reminderTiming))
            ->toISOString();

        return $validated;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = auth()->user()->tasks()->with('category');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($searchQuery) use ($search) {
                $searchQuery->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }

        if ($request->filled('completed')) {
            $query->where('completed', filter_var($request->query('completed'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->boolean('overdue')) {
            $query->where('completed', false)
                ->whereNotNull('due_date')
                ->where('due_date', '<', Carbon::now());
        }

        $query
            ->orderByRaw("CASE WHEN due_date IS NULL THEN 1 ELSE 0 END")
            ->orderBy('due_date')
            ->orderByDesc('created_at');

        $perPage = max(1, min((int) $request->integer('per_page', 15), 100));

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTaskRequest $request)
    {
        $validated = $this->applyReminderDefaults($request->validated(), $request);

        $task = $request->user()->tasks()->create($validated);

        return response()->json($task->load('category'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $task = auth()->user()->tasks()->findOrFail($id);

        return response()->json($task->load('category'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTaskRequest $request, string $id)
    {
        $validated = $this->applyReminderDefaults($request->validated(), $request);

        $task = auth()->user()->tasks()->findOrFail($id);
        $task->update($validated);

        return response()->json($task->load('category'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $task = auth()->user()->tasks()->findOrFail($id);
        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully.',
        ]);
    }
}
