<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_metrics_include_expected_fields(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 11, 12, 0, 0));

        $user = User::factory()->create();
        User::factory()->create();
        Sanctum::actingAs($user);

        Task::query()->create([
            'user_id' => $user->id,
            'title' => 'High priority task',
            'priority' => 'high',
            'completed' => false,
            'due_date' => Carbon::now()->addDay(),
        ]);

        Task::query()->create([
            'user_id' => $user->id,
            'title' => 'Medium task',
            'priority' => 'medium',
            'completed' => true,
            'due_date' => Carbon::now()->subDay(),
        ]);

        $response = $this->getJson('/api/dashboard/metrics');

        $response->assertOk()
            ->assertJsonPath('total_tasks', 2)
            ->assertJsonPath('completed_tasks', 1)
            ->assertJsonPath('pending_tasks', 1)
            ->assertJsonPath('tasks_by_priority.high', 1)
            ->assertJsonPath('tasks_by_priority.medium', 1)
            ->assertJsonPath('tasks_by_priority.low', 0)
            ->assertJsonPath('team_members', 2)
            ->assertJsonPath('active_today', 1)
            ->assertJsonPath('completion_percentage', 50);

        Carbon::setTestNow();
    }
}