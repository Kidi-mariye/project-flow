<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);
    Route::post('/categories/seed-defaults', [CategoryController::class, 'seedDefaults']);

    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
