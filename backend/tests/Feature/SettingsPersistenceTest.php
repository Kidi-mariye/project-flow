<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsPersistenceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_save_settings()
    {
        $settings = [
            'general' => [
                'theme' => 'dark',
                'languageRegion' => 'English (UK)',
                'timeFormat' => '12h',
            ],
            'notifications' => [
                'enabled' => true,
                'reminderTiming' => '15',
            ],
        ];

        $response = $this->actingAs($this->user)->putJson('/api/user/settings', $settings);

        $response->assertOk();
        $response->assertJsonPath('data.general.theme', 'dark');
        $response->assertJsonPath('data.notifications.reminderTiming', '15');

        $this->user->refresh();
        $this->assertEquals('dark', $this->user->settings['general']['theme']);
    }

    public function test_user_settings_are_merged_not_replaced()
    {
        $this->user->update([
            'settings' => [
                'general' => ['theme' => 'light', 'timeFormat' => '24h'],
                'projects' => ['defaultPriority' => 'high'],
            ],
        ]);

        $response = $this->actingAs($this->user)->putJson('/api/user/settings', [
            'general' => ['theme' => 'dark'],
        ]);

        $response->assertOk();
        $this->user->refresh();

        $this->assertEquals('dark', $this->user->settings['general']['theme']);
        $this->assertEquals('24h', $this->user->settings['general']['timeFormat']);
        $this->assertEquals('high', $this->user->settings['projects']['defaultPriority']);
    }

    public function test_user_can_retrieve_settings()
    {
        $this->user->update([
            'settings' => [
                'general' => ['theme' => 'dark'],
            ],
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/user/settings');

        $response->assertOk();
        $response->assertJsonPath('data.general.theme', 'dark');
    }
}
