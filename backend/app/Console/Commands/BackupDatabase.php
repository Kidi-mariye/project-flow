<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class BackupDatabase extends Command
{
    protected $signature = 'app:backup {--prune=30 : Number of backups to keep (0 disables pruning)}';

    protected $description = 'Create a backup of the SQLite database and application files';

    public function handle(): int
    {
        $destination = storage_path('app/backups/' . date('Ymd_His'));
        File::makeDirectory($destination, 0755, true, true);

        $this->copyDatabase($destination);
        $this->copyFiles($destination);

        $pruned = $this->prune((int) $this->option('prune'));

        $this->info("Backup created: {$destination}");
        if ($pruned > 0) {
            $this->info("Pruned {$pruned} old backup(s).");
        }

        return self::SUCCESS;
    }

    private function copyDatabase(string $destination): void
    {
        $database = config('database.connections.sqlite.database');

        if (! $database || ! File::exists($database)) {
            $this->warn('SQLite database not found; skipping database copy.');

            return;
        }

        File::copy($database, $destination . '/database.sqlite');

        // SQLite keeps pending changes in -wal/-shm sidecar files; copy them
        // so the backup is recoverable even mid-write.
        foreach (['-wal', '-shm'] as $suffix) {
            $sidecar = $database . $suffix;

            if (File::exists($sidecar)) {
                File::copy($sidecar, $destination . '/database.sqlite' . $suffix);
            }
        }

        $env = base_path('.env');

        if (File::exists($env)) {
            File::copy($env, $destination . '/.env');
        }

        $this->info('Copied database.');
    }

    private function copyFiles(string $destination): void
    {
        $private = storage_path('app/private');

        if (File::isDirectory($private)) {
            File::copyDirectory($private, $destination . '/private');
            $this->info('Copied private storage.');
        }

        $public = storage_path('app/public');

        if (File::isDirectory($public)) {
            File::copyDirectory($public, $destination . '/uploads');
            $this->info('Copied public uploads.');
        }
    }

    private function prune(int $keep): int
    {
        if ($keep <= 0) {
            return 0;
        }

        $root = storage_path('app/backups');

        if (! File::isDirectory($root)) {
            return 0;
        }

        $toDelete = collect(File::directories($root))
            ->map(fn (string $dir): string => basename($dir))
            ->filter(fn (string $name): bool => preg_match('/^\d{8}_\d{6}$/', $name) === 1)
            ->sortDesc()
            ->values()
            ->slice($keep);

        foreach ($toDelete as $name) {
            File::deleteDirectory($root . '/' . $name);
        }

        return $toDelete->count();
    }
}
