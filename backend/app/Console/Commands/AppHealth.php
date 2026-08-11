<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class AppHealth extends Command
{
    protected $signature = 'app:health';

    protected $description = 'Run a quick health check of the application (DB and storage)';

    public function handle(): int
    {
        $ok = true;

        try {
            DB::select('select 1');
            $this->info('Database: OK');
        } catch (\Throwable $e) {
            $ok = false;
            $this->error('Database: FAILED - ' . $e->getMessage());
        }

        if (File::isWritable(storage_path('logs'))) {
            $this->info('Storage: OK');
        } else {
            $ok = false;
            $this->error('Storage: NOT WRITABLE (' . storage_path('logs') . ')');
        }

        return $ok ? self::SUCCESS : self::FAILURE;
    }
}
