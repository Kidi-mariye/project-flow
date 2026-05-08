<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('settings')->nullable()->default(json_encode([
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
            ]))->after('password');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('settings');
        });
    }
};
