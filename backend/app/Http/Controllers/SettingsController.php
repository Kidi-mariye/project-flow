<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    private function defaultSettings(): array
    {
        return [
            'general' => [
                'languageRegion' => 'English (US)',
                'timeFormat' => '24h',
                'theme' => 'light',
            ],
            'projects' => [
                'defaultPriority' => 'medium',
                'defaultDueDate' => 'none',
                'customStatuses' => 'todo, inprogress, completed',
                'recurringTaskOption' => 'weekly',
            ],
            'notifications' => [
                'enabled' => true,
                'reminderTiming' => '10',
                'quietHoursStart' => '22:00',
                'quietHoursEnd' => '07:00',
                'channels' => [
                    'email' => true,
                    'sms' => false,
                    'push' => true,
                ],
            ],
            'collaboration' => [
                'projectVisibility' => 'private',
                'allowComments' => true,
                'shareByLink' => false,
            ],
            'account' => [
                'name' => '',
                'email' => '',
                'avatarUrl' => '',
                'twoFactorEnabled' => false,
                'loginMethod' => 'password',
                'connectedAccounts' => [
                    'google' => false,
                    'microsoft' => false,
                    'github' => false,
                ],
            ],
            'dataSecurity' => [
                'backupRestore' => 'manual',
                'cloudSync' => 'none',
                'retentionDays' => '0',
                'encryptionLevel' => 'standard',
            ],
            'advanced' => [
                'developerMode' => false,
                'apiAccess' => false,
                'betaFeatures' => false,
            ],
        ];
    }

    private function normalizeSettings(?array $settings): array
    {
        return array_replace_recursive($this->defaultSettings(), $settings ?? []);
    }

    /**
     * Get the authenticated user's settings
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'data' => $this->normalizeSettings($user->settings ?? null),
        ]);
    }

    /**
     * Update the authenticated user's settings
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'general' => 'nullable|array',
            'projects' => 'nullable|array',
            'notifications' => 'nullable|array',
            'collaboration' => 'nullable|array',
            'account' => 'nullable|array',
            'account.name' => 'nullable|string|max:255',
            'account.email' => 'nullable|email',
            'account.avatarUrl' => 'nullable|string',
            'account.twoFactorEnabled' => 'nullable|boolean',
            'account.loginMethod' => 'nullable|in:password,magic-link,oauth',
            'account.connectedAccounts' => 'nullable|array',
            'account.connectedAccounts.google' => 'nullable|boolean',
            'account.connectedAccounts.microsoft' => 'nullable|boolean',
            'account.connectedAccounts.github' => 'nullable|boolean',
            'dataSecurity' => 'nullable|array',
            'advanced' => 'nullable|array',
        ]);

        // Merge new settings with existing settings using overwrite semantics
        $currentSettings = $this->normalizeSettings($user->settings ?? null);
        $updatedSettings = array_replace_recursive($currentSettings, $validated);

        // Update user settings
        $user->settings = $updatedSettings;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => $user->settings,
        ]);
    }

    /**
     * Update the authenticated user's profile details.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'avatarUrl' => 'nullable|string',
        ]);

        $user->name = $validated['name'];

        $currentSettings = $this->normalizeSettings($user->settings ?? null);
        $updatedSettings = array_replace_recursive($currentSettings, [
            'account' => [
                'name' => $validated['name'],
                'avatarUrl' => $validated['avatarUrl'] ?? '',
            ],
        ]);

        $user->settings = $updatedSettings;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => $user->fresh(),
            ],
        ]);
    }
}

