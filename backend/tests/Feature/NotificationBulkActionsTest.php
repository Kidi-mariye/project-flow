<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Tests\TestCase;

class NotificationBulkActionsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    private function createNotification($userId = null, $readAt = null)
    {
        return DatabaseNotification::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'notifiable_type' => User::class,
            'notifiable_id' => $userId ?? $this->user->id,
            'type' => 'App\Notifications\TaskReminderNotification',
            'data' => json_encode(['title' => 'Test Reminder', 'message' => 'This is a test reminder.']),
            'read_at' => $readAt,
        ]);
    }

    public function test_can_delete_notification()
    {
        $notification = $this->createNotification();

        $response = $this->actingAs($this->user)->deleteJson("/api/notifications/{$notification->id}");

        $response->assertOk();
        $this->assertModelMissing($notification);
    }

    public function test_cannot_delete_others_notification()
    {
        $otherUser = User::factory()->create();
        $notification = $this->createNotification($otherUser->id);

        $response = $this->actingAs($this->user)->deleteJson("/api/notifications/{$notification->id}");

        $response->assertNotFound();
        $this->assertModelExists($notification);
    }

    public function test_can_mark_notification_as_read()
    {
        $notification = $this->createNotification();

        $response = $this->actingAs($this->user)->postJson("/api/notifications/{$notification->id}/read");

        $response->assertOk();
        $notification->refresh();
        $this->assertNotNull($notification->read_at);
    }

    public function test_can_mark_all_notifications_as_read()
    {
        $this->createNotification();
        $this->createNotification();
        $this->createNotification();
        $this->createNotification(readAt: now());

        $response = $this->actingAs($this->user)->postJson('/api/notifications/read-all');

        $response->assertOk();

        $unreadNotifications = $this->user
            ->notifications()
            ->whereNull('read_at')
            ->get();

        $this->assertCount(0, $unreadNotifications);
    }

    public function test_notification_list_includes_unread_count()
    {
        $this->createNotification();
        $this->createNotification();
        $this->createNotification(readAt: now());

        $response = $this->actingAs($this->user)->getJson('/api/notifications');

        $response->assertOk();
        $response->assertJsonPath('meta.unread_count', 2);
    }

    public function test_notification_list_is_paginated()
    {
        for ($i = 0; $i < 15; $i++) {
            $this->createNotification();
        }

        $response = $this->actingAs($this->user)->getJson('/api/notifications?per_page=10');

        $response->assertOk();
        $response->assertJsonPath('meta.total', 15);
        $response->assertJsonPath('meta.last_page', 2);
        $this->assertCount(10, $response->json('data'));
    }

    public function test_cannot_read_others_notification()
    {
        $otherUser = User::factory()->create();
        $notification = $this->createNotification($otherUser->id);

        $response = $this->actingAs($this->user)->postJson("/api/notifications/{$notification->id}/read");

        $response->assertNotFound();
    }
}

