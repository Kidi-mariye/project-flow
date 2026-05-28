<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationsInboxTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifications_inbox_lists_database_notifications_and_marks_them_read(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $task = Task::query()->create([
            'user_id' => $user->id,
            'title' => 'Reminder task',
            'priority' => 'medium',
            'completed' => false,
        ]);

        $user->notify(new TaskReminderNotification($task));

        $listResponse = $this->getJson('/api/notifications');

        $listResponse->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.unread_count', 1)
            ->assertJsonPath('data.0.data.task_id', $task->id);

        $notificationId = $listResponse->json('data.0.id');

        $readResponse = $this->postJson("/api/notifications/{$notificationId}/read");

        $readResponse->assertOk();

        $this->assertDatabaseHas('notifications', [
            'id' => $notificationId,
        ]);

        $this->assertDatabaseCount('notifications', 1);
        $this->assertNotNull($user->fresh()->notifications()->first()->read_at);
    }

    public function test_notifications_inbox_can_filter_reminder_notifications(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $task = Task::query()->create([
            'user_id' => $user->id,
            'title' => 'Reminder task',
            'priority' => 'medium',
            'completed' => false,
        ]);

        $user->notify(new TaskReminderNotification($task));

        $response = $this->getJson('/api/notifications?type=App\\Notifications\\TaskReminderNotification');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.type', 'App\\Notifications\\TaskReminderNotification');
    }
}