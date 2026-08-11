<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Mail\LoginChallengeMail;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function defaultAccountSettings(): array
    {
        return [
            'twoFactorEnabled' => false,
            'loginMethod' => 'password',
            'connectedAccounts' => [
                'google' => false,
                'microsoft' => false,
                'github' => false,
            ],
        ];
    }

    private function getAccountSettings(User $user): array
    {
        return array_replace_recursive($this->defaultAccountSettings(), $user->settings['account'] ?? []);
    }

    private function challengeKey(string $challengeId): string
    {
        return 'auth-challenge:' . $challengeId;
    }

    private function resetCodeKey(string $email): string
    {
        return 'password-reset:' . strtolower($email);
    }

    private function createChallenge(User $user, string $purpose, ?string $provider = null): array
    {
        $challengeId = (string) Str::uuid();
        $verificationCode = (string) random_int(100000, 999999);

        Cache::put($this->challengeKey($challengeId), [
            'user_id' => $user->id,
            'purpose' => $purpose,
            'provider' => $provider,
            'code' => $verificationCode,
        ], now()->addMinutes(10));

        return [
            'challenge_id' => $challengeId,
            'verification_code' => $verificationCode,
        ];
    }

    private function sendChallengeEmail(User $user, string $code, string $purpose): void
    {
        Mail::to($user->email)->send(new LoginChallengeMail(
            userName: $user->name ?: 'User',
            code: $code,
            purpose: $purpose,
        ));
    }

    /**
     * In local development with the "log" mailer no email is actually
     * delivered, so the verification code is returned in the response for
     * manual entry. Never included outside that exact configuration.
     */
    private function debugCodePayload(?string $code): array
    {
        if ($code !== null && app()->environment('local') && config('mail.default') === 'log') {
            return ['debug_code' => $code];
        }

        return [];
    }

    private function issueTokenResponse(User $user, string $message = 'Login successful'): array
    {
        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
            'message' => $message,
        ];
    }

    public function loginOptions(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return response()->json([
                'exists' => false,
                'account' => $this->defaultAccountSettings(),
            ]);
        }

        return response()->json([
            'exists' => true,
            'account' => $this->getAccountSettings($user),
        ]);
    }

    public function register(RegisterRequest $request)
    {
        $validated = $request->validated();

        $user = User::create($validated);

        foreach (Category::DEFAULT_PROJECT_CATEGORIES as $defaultCategory) {
            $user->categories()->create($defaultCategory);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['nullable', 'string'],
            'method' => ['nullable', 'in:password,magic-link'],
            'challenge_id' => ['nullable', 'string'],
            'verification_code' => ['nullable', 'string'],
        ]);

        if (! empty($validated['challenge_id']) && ! empty($validated['verification_code'])) {
            return $this->verifyLoginChallenge($request);
        }

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $account = $this->getAccountSettings($user);
        $requestedMethod = $validated['method'] ?? $account['loginMethod'];

        if ($requestedMethod !== $account['loginMethod']) {
            throw ValidationException::withMessages([
                'method' => ['This account is configured for ' . $account['loginMethod'] . ' login.'],
            ]);
        }

        if ($requestedMethod === 'password') {
            if (empty($validated['password']) || ! Auth::attempt([
                'email' => $validated['email'],
                'password' => $validated['password'],
            ])) {
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            if ($account['twoFactorEnabled']) {
                $challenge = $this->createChallenge($user, 'two-factor');
                $this->sendChallengeEmail($user, $challenge['verification_code'], 'two-factor');

                return response()->json(array_merge([
                    'requires_verification' => true,
                    'verification_type' => 'two-factor',
                    'challenge_id' => $challenge['challenge_id'],
                    'message' => 'Two-factor verification required. Check your email for the code.',
                ], $this->debugCodePayload($challenge['verification_code'])));
            }

            return response()->json($this->issueTokenResponse($user));
        }

        if ($requestedMethod === 'magic-link') {
            $challenge = $this->createChallenge($user, 'magic-link');
            $this->sendChallengeEmail($user, $challenge['verification_code'], 'magic-link');

            return response()->json(array_merge([
                'requires_verification' => true,
                'verification_type' => 'magic-link',
                'challenge_id' => $challenge['challenge_id'],
                'message' => 'Magic-link verification required. Check your email for the code.',
            ], $this->debugCodePayload($challenge['verification_code'])));
        }

        throw ValidationException::withMessages([
            'method' => ['Unsupported login method selected.'],
        ]);

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('api-token')->plainTextToken,
        ]);
    }

    public function verifyLoginChallenge(Request $request)
    {
        $validated = $request->validate([
            'challenge_id' => ['required', 'string'],
            'verification_code' => ['required', 'string'],
        ]);

        $challenge = Cache::get($this->challengeKey($validated['challenge_id']));

        if (! $challenge || ! hash_equals((string) $challenge['code'], (string) $validated['verification_code'])) {
            throw ValidationException::withMessages([
                'verification_code' => ['The verification code is invalid or expired.'],
            ]);
        }

        $user = User::find($challenge['user_id']);

        if (! $user) {
            throw ValidationException::withMessages([
                'challenge_id' => ['The verification challenge is no longer valid.'],
            ]);
        }

        Cache::forget($this->challengeKey($validated['challenge_id']));

        return response()->json($this->issueTokenResponse($user, 'Verified successfully'));
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        // Respond identically whether or not the account exists so the
        // endpoint cannot be used to enumerate registered addresses.
        if ($user) {
            $code = (string) random_int(100000, 999999);

            Cache::put($this->resetCodeKey($user->email), [
                'code' => $code,
                'created_at' => now(),
            ], now()->addMinutes(30));

            $this->sendChallengeEmail($user, $code, 'password-reset');
        }

        return response()->json(array_merge([
            'message' => 'If that email address is registered, a password reset code has been sent.',
        ], $this->debugCodePayload($code ?? null)));
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'verification_code' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $stored = Cache::get($this->resetCodeKey($validated['email']));

        if (! $stored || ! hash_equals((string) $stored['code'], (string) $validated['verification_code'])) {
            throw ValidationException::withMessages([
                'verification_code' => ['The reset code is invalid or expired.'],
            ]);
        }

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account was found for that email address.'],
            ]);
        }

        // password is cast to "hashed", so the new value is hashed on save.
        $user->password = $validated['password'];
        $user->save();

        Cache::forget($this->resetCodeKey($user->email));

        // Invalidate existing sessions/tokens so the old password can't be
        // used through an already-issued token.
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Your password has been reset. You can now log in.',
        ]);
    }
}
