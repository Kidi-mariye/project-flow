<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskReminderNotification extends Notification
{
    use Queueable;

    public function __construct(public Task $task)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $dueDate = optional($this->task->due_date)?->toIso8601String();

        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'due_date' => $dueDate,
            'reminder_at' => optional($this->task->reminder_at)?->toIso8601String(),
            'message' => $dueDate
                ? "Deadline reminder: {$this->task->title} is due soon."
                : "Deadline reminder: {$this->task->title} needs attention.",
        ];
    }
}