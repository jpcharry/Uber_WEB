<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('ruta:info', function () {
    $this->info('RUTA: interfaz Laravel que consume la API REST del profesor.');
    $this->info('Servidor externo configurado: '.config('services.profesor_api_url'));
})->purpose('Muestra el backend remoto utilizado.');
