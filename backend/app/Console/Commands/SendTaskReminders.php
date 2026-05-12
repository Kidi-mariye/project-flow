<?php

namespace App\Console\Commands;

use App\Mail\TaskReminderMail;
use App\Models\Task;
use App\Notifications\TaskReminderNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendTaskReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:send-reminders {--channel=all : Send reminders via specific channel (all, email, database)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send due task reminders to users via email and/or database notifications';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = Carbon::now();
        $channel = $this->option('channel');

        $tasks = Task::query()
            ->with('user')
            ->where('completed', false)
            ->whereNotNull('reminder_at')
            ->whereNull('reminder_sent_at')
            ->where('reminder_at', '<=', $now)
            ->get();

        $sentEmail = 0;
        $sentDatabase = 0;

        foreach ($tasks as $task) {
            if (! $task->user) {
                continue;
            }

            // Send database notification
            if (in_array($channel, ['all', 'database'])) {
                $task->user->notify(new TaskReminderNotification($task));
                $sentDatabase++;
            }

            // Send email notification
            if (in_array($channel, ['all', 'email'])) {
                try {
                    Mail::to($task->user->email)->send(new TaskReminderMail($task));
                    $sentEmail++;
                } catch (\Exception $e) {
                    $this->warn("Failed to send email for task {$task->id}: {$e->getMessage()}");
                }
            }

            // Mark as sent only after all channels are attempted
            $task->forceFill(['reminder_sent_at' => $now])->save();
        }

        $this->info("Sent {$sentDatabase} database reminder(s), {$sentEmail} email(s).");

        return self::SUCCESS;
    }
}