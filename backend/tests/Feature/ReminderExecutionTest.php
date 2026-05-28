<?php

namespace Tests\Feature;

use App\Console\Commands\SendTaskReminders;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Tests\TestCase;

class ReminderExecutionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_reminder_command_sends_database_notification()
    {
        $task = Task::factory()->for($this->user)->create([
            'reminder_at' => now()->subMinutes(5),
            'reminder_sent_at' => null,
            'completed' => false,
        ]);

        $this->artisan('tasks:send-reminders')
            ->assertSuccessful();

        $this->user->refresh();
        $this->assertCount(1, $this->user->notifications);

        $task->refresh();
        $this->assertNotNull($task->reminder_sent_at);
    }

    public function test_reminder_not_sent_for_completed_task()
    {
        Task::factory()->for($this->user)->create([
            'reminder_at' => now()->subMinutes(5),
            'reminder_sent_at' => null,
            'completed' => true,
        ]);

        $this->artisan('tasks:send-reminders')
            ->assertSuccessful();

        $this->user->refresh();
        $this->assertCount(0, $this->user->notifications);
    }

    public function test_reminder_not_sent_if_already_sent()
    {
        Task::factory()->for($this->user)->create([
            'reminder_at' => now()->subMinutes(5),
            'reminder_sent_at' => now()->subMinutes(1),
            'completed' => false,
        ]);

        $this->artisan('tasks:send-reminders')
            ->assertSuccessful()
            ->expectsOutput('Sent 0 database reminder(s), 0 email(s).');

        $this->user->refresh();
        $this->assertCount(0, $this->user->notifications);
    }

    public function test_reminder_not_sent_for_future_reminder_at()
    {
        Task::factory()->for($this->user)->create([
            'reminder_at' => now()->addMinutes(5),
            'reminder_sent_at' => null,
            'completed' => false,
        ]);

        $this->artisan('tasks:send-reminders')
            ->assertSuccessful()
            ->expectsOutput('Sent 0 database reminder(s), 0 email(s).');

        $this->user->refresh();
        $this->assertCount(0, $this->user->notifications);
    }

    public function test_multiple_reminders_sent_in_single_command()
    {
        Task::factory()->count(3)->for($this->user)->create([
            'reminder_at' => now()->subMinutes(5),
            'reminder_sent_at' => null,
            'completed' => false,
        ]);

        $this->artisan('tasks:send-reminders')
            ->assertSuccessful();

        $this->user->refresh();
        $this->assertCount(3, $this->user->notifications);
    }

    public function test_task_creation_uses_notification_timing_when_reminder_is_missing()
    {
        $this->user->update([
            'settings' => [
                'notifications' => [
                    'enabled' => true,
                    'reminderTiming' => '15',
                ],
            ],
        ]);

        $dueDate = now()->addDay()->seconds(0);

        $response = $this->actingAs($this->user)->postJson('/api/tasks', [
            'title' => 'Auto reminder task',
            'priority' => 'medium',
            'completed' => false,
            'due_date' => $dueDate->toISOString(),
        ]);

        $response->assertCreated();

        $task = Task::query()->latest('id')->first();

        $this->assertNotNull($task->reminder_at);
        $this->assertSame(
            $dueDate->copy()->subMinutes(15)->toIso8601String(),
            $task->reminder_at->toIso8601String()
        );
    }
}
