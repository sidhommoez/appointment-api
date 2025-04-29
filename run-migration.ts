import { execSync } from 'child_process';

const arg = process.argv[2];
if (!arg) {
  console.error('❌ Please provide a name for the migration (e.g., insert-db)');
  process.exit(1);
}

const command = `dotenv -e ./.env -- ts-node -r tsconfig-paths/register --project ./tsconfig.json node_modules/typeorm/cli.js -d src/pg-data-source.ts migration:generate src/assets/migrations/${arg}`;

console.log(`👉 Running: ${command}`);
execSync(command, { stdio: 'inherit' });
