<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Serve the SPA for any other non-API frontend route so client routing works
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
