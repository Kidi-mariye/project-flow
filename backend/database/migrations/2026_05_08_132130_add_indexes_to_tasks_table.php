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
        Schema::table('tasks', function (Blueprint $table) {
            // Add indexes for foreign keys and frequently queried columns
            $table->index('user_id');
            $table->index('category_id');
            $table->index('completed');
            $table->index('priority');
            $table->index('due_date');
            // Composite index for common queries
            $table->index(['user_id', 'completed']);
            $table->index(['user_id', 'priority']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            //
        });
    }
};
