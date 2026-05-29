<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_update_profile_details(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/user/profile', [
            'name' => 'Updated Name',
            'avatarUrl' => 'data:image/png;base64,ZmFrZQ==',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.user.name', 'Updated Name');
        $response->assertJsonPath('data.user.settings.account.name', 'Updated Name');
        $response->assertJsonPath('data.user.settings.account.avatarUrl', 'data:image/png;base64,ZmFrZQ==');

        $this->user->refresh();
        $this->assertSame('Updated Name', $this->user->name);
        $this->assertSame('Updated Name', $this->user->settings['account']['name']);
        $this->assertSame('data:image/png;base64,ZmFrZQ==', $this->user->settings['account']['avatarUrl']);
    }
}
