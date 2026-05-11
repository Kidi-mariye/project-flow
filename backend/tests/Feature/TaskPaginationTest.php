<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tasks_endpoint_paginates_results(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        for ($index = 1; $index <= 20; $index++) {
            Task::query()->create([
                'user_id' => $user->id,
                'title' => 'Task '.$index,
                'priority' => 'medium',
                'completed' => false,
            ]);
        }

        $response = $this->getJson('/api/tasks?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('per_page', 10)
            ->assertJsonPath('total', 20);
    }
}