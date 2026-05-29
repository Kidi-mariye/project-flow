<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
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
            'data' => $user->settings ?? [],
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
        
        // Validate that settings is an object/array
        $validated = $request->validate([
            'general' => 'nullable|array',
            'projects' => 'nullable|array',
            'notifications' => 'nullable|array',
            'collaboration' => 'nullable|array',
            'account' => 'nullable|array',
            'dataSecurity' => 'nullable|array',
            'advanced' => 'nullable|array',
        ]);

        // Merge new settings with existing settings using overwrite semantics
        $currentSettings = $user->settings ?? [];
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

        $currentSettings = $user->settings ?? [];
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

