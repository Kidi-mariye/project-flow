<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Notifications\TaskReminderNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendTaskReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send due task reminders to users';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = Carbon::now();

        $tasks = Task::query()
            ->with('user')
            ->where('completed', false)
            ->whereNotNull('reminder_at')
            ->whereNull('reminder_sent_at')
            ->where('reminder_at', '<=', $now)
            ->get();

        $sent = 0;

        foreach ($tasks as $task) {
            if (! $task->user) {
                continue;
            }

            $task->user->notify(new TaskReminderNotification($task));
            $task->forceFill(['reminder_sent_at' => $now])->save();
            $sent++;
        }

        $this->info("Sent {$sent} reminder notification(s).");

        return self::SUCCESS;
    }
}