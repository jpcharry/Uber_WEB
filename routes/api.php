<?php

use App\Http\Controllers\Api\ProxyController;
use Illuminate\Support\Facades\Route;

// La API del profesor vive en 20.20.1.157:8000; aqui solo se hace de pasarela.
// No existen controladores locales de Uber ni base de datos propia.
Route::match(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], '{endpoint}', [ProxyController::class, 'forward'])
    ->where('endpoint', '.*');
