<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    public const DEFAULT_PROJECT_CATEGORIES = [
        ['name' => 'Planning', 'color' => '#2563eb'],
        ['name' => 'Design', 'color' => '#db2777'],
        ['name' => 'Development', 'color' => '#7c3aed'],
        ['name' => 'Testing', 'color' => '#ea580c'],
        ['name' => 'Deployment', 'color' => '#0284c7'],
        ['name' => 'Documentation', 'color' => '#0f766e'],
        ['name' => 'Collaboration', 'color' => '#16a34a'],
        ['name' => 'Maintenance', 'color' => '#4b5563'],
    ];

    protected $fillable = [
        'user_id',
        'name',
        'color',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
