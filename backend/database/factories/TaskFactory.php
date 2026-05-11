<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category_id' => null,
            'title' => $this->faker->sentence(),
            'description' => $this->faker->text(200),
            'completed' => false,
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
            'due_date' => $this->faker->dateTimeBetween('+1 day', '+30 days'),
            'reminder_at' => null,
            'reminder_sent_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed' => true,
        ]);
    }

    public function withCategory(): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => Category::factory(),
        ]);
    }

    public function withReminder(): static
    {
        return $this->state(fn (array $attributes) => [
            'reminder_at' => $this->faker->dateTimeBetween('+1 hour', '+7 days'),
        ]);
    }
}
