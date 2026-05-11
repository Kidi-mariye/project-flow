<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #f9fafb;
            border-radius: 8px;
            padding: 24px;
            border: 1px solid #e5e7eb;
        }
        .header {
            margin-bottom: 24px;
        }
        .header h1 {
            margin: 0;
            color: #1f2937;
            font-size: 24px;
        }
        .content {
            background: white;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 24px;
            border-left: 4px solid #2563eb;
        }
        .content p {
            margin: 0 0 12px 0;
        }
        .task-details {
            background: #f3f4f6;
            padding: 12px;
            border-radius: 4px;
            margin: 12px 0;
        }
        .task-details-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
        }
        .task-details-label {
            font-weight: bold;
            color: #6b7280;
        }
        .task-details-value {
            color: #1f2937;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 10px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 12px;
        }
        .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 16px;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Task Reminder</h1>
            <p>Hi {{ $userName }},</p>
        </div>

        <div class="content">
            <p>This is a reminder about your upcoming task:</p>

            <div class="task-details">
                <div class="task-details-row">
                    <span class="task-details-label">Task:</span>
                    <span class="task-details-value">{{ $task->title }}</span>
                </div>
                @if($task->due_date)
                <div class="task-details-row">
                    <span class="task-details-label">Due:</span>
                    <span class="task-details-value">{{ \Carbon\Carbon::parse($task->due_date)->format('M d, Y H:i') }}</span>
                </div>
                @endif
                @if($task->priority)
                <div class="task-details-row">
                    <span class="task-details-label">Priority:</span>
                    <span class="task-details-value" style="text-transform: capitalize;">{{ $task->priority }}</span>
                </div>
                @endif
                @if($task->description)
                <div class="task-details-row">
                    <span class="task-details-label">Description:</span>
                    <span class="task-details-value">{{ Str::limit($task->description, 100) }}</span>
                </div>
                @endif
            </div>

            <p>Don't forget to complete this task on time!</p>
        </div>

        <div class="footer">
            <p>This is an automated reminder from Task Manager. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
