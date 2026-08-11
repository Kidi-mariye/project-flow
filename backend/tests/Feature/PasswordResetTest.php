<?php

namespace Tests\Feature;

use App\Mail\LoginChallengeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_sends_reset_code(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'If that email address is registered, a password reset code has been sent.',
            ]);

        Mail::assertSent(LoginChallengeMail::class);
    }

    public function test_forgot_password_does_not_leak_account_existence(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'nobody@example.com',
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'If that email address is registered, a password reset code has been sent.',
            ]);

        Mail::assertNothingSent();
    }

    public function test_reset_password_requires_confirmed_password(): void
    {
        $user = User::factory()->create();

        Cache::put('password-reset:' . $user->email, [
            'code' => '123456',
            'created_at' => now(),
        ], now()->addMinutes(30));

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => $user->email,
            'verification_code' => '123456',
            'password' => 'newpassword1',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_with_invalid_code_fails(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => $user->email,
            'verification_code' => '000000',
            'password' => 'newpassword1',
            'password_confirmation' => 'newpassword1',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['verification_code']);
    }

    public function test_reset_password_updates_password_and_revokes_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('api-token');

        Cache::put('password-reset:' . $user->email, [
            'code' => '123456',
            'created_at' => now(),
        ], now()->addMinutes(30));

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => $user->email,
            'verification_code' => '123456',
            'password' => 'newpassword1',
            'password_confirmation' => 'newpassword1',
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Your password has been reset. You can now log in.',
            ]);

        $this->assertTrue(Hash::check('newpassword1', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
        $this->assertNull(Cache::get('password-reset:' . $user->email));
    }
}
