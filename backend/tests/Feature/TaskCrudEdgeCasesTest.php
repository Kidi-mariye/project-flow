<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCrudEdgeCasesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->category = Category::factory()->for($this->user)->create();
    }

    public function test_can_create_task_with_required_fields()
    {
        $response = $this->actingAs($this->user)->postJson('/api/tasks', [
            'title' => 'Test Task',
            'category_id' => $this->category->id,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('title', 'Test Task');
    }

    public function test_can_update_task_with_description()
    {
        $task = Task::factory()->for($this->user)->create();

        $response = $this->actingAs($this->user)->putJson("/api/tasks/{$task->id}", [
            'title' => 'Updated title',
            'description' => 'Updated description',
        ]);

        $response->assertOk();
        $response->assertJsonPath('description', 'Updated description');
    }

    public function test_can_toggle_task_completion()
    {
        $task = Task::factory()->for($this->user)->create(['completed' => false]);

        $response = $this->actingAs($this->user)->putJson("/api/tasks/{$task->id}", [
            'completed' => true,
        ]);

        $response->assertOk();
        $response->assertJsonPath('completed', true);

        $task->refresh();
        $this->assertTrue($task->completed);
    }

    public function test_can_update_task_with_due_date()
    {
        $task = Task::factory()->for($this->user)->create();
        $dueDate = now()->addDays(5);

        $response = $this->actingAs($this->user)->putJson("/api/tasks/{$task->id}", [
            'due_date' => $dueDate->toDateTimeString(),
        ]);

        $response->assertOk();
        $task->refresh();
        $this->assertNotNull($task->due_date);
    }

    public function test_can_assign_task_to_category()
    {
        $task = Task::factory()->for($this->user)->create(['category_id' => null]);

        $response = $this->actingAs($this->user)->putJson("/api/tasks/{$task->id}", [
            'category_id' => $this->category->id,
        ]);

        $response->assertOk();
        $task->refresh();
        $this->assertEquals($this->category->id, $task->category_id);
    }

    public function test_can_set_task_priority()
    {
        $task = Task::factory()->for($this->user)->create();

        $response = $this->actingAs($this->user)->putJson("/api/tasks/{$task->id}", [
            'priority' => 'high',
        ]);

        $response->assertOk();
        $response->assertJsonPath('priority', 'high');
    }

    public function test_can_set_reminder_for_task()
    {
        $dueDate = now()->addDays(3);
        $task = Task::factory()->for($this->user)->create(['due_date' => null]);
        $reminderAt = now()->addHours(2);

        $response = $this->actingAs($this->user)->putJson("/api/tasks/{$task->id}", [
            'reminder_at' => $reminderAt->toDateTimeString(),
            'due_date' => $dueDate->toDateTimeString(),
        ]);

        $response->assertOk();
        $task->refresh();
        $this->assertNotNull($task->reminder_at);
    }

    public function test_can_delete_task()
    {
        $task = Task::factory()->for($this->user)->create();

        $response = $this->actingAs($this->user)->deleteJson("/api/tasks/{$task->id}");

        $response->assertOk();
        $this->assertModelMissing($task);
    }
}
