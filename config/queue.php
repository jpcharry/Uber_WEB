<?php

return [
    'default' => env('QUEUE_CONNECTION', 'sync'),
    'connections' => [
        'sync' => ['driver' => 'sync'],
        'database' => ['driver' => 'database', 'connection' => env('DB_QUEUE_CONNECTION'), 'table' => 'jobs', 'queue' => 'default', 'retry_after' => 90, 'after_commit' => false],
    ],
    'failed' => ['driver' => env('QUEUE_FAILED_DRIVER', 'null'), 'database' => env('DB_CONNECTION', 'pgsql'), 'table' => 'failed_jobs'],
];
