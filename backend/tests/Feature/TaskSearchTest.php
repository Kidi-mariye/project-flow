<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_tasks_endpoint_filters_by_search_term(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Task::query()->create([
            'user_id' => $user->id,
            'title' => 'Launch planning session',
            'description' => 'Discuss release steps',
            'priority' => 'high',
            'completed' => false,
        ]);

        Task::query()->create([
            'user_id' => $user->id,
            'title' => 'Design review',
            'description' => 'Check the UI polish',
            'priority' => 'medium',
            'completed' => false,
        ]);

        $response = $this->getJson('/api/tasks?search=launch');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Launch planning session');
    }
}