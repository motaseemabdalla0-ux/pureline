$sql = @"
ALTER TABLE farms ADD COLUMN IF NOT EXISTS region VARCHAR(150);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS coordinates_lat DOUBLE PRECISION;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS coordinates_lng DOUBLE PRECISION;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS area_hectares DOUBLE PRECISION;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS owner_name VARCHAR(200);
CREATE INDEX IF NOT EXISTS ix_farms_region ON farms (region);
"@
$sql | docker exec -i deployment-db-1 psql -U pureline -d pureline
Write-Output "--- verify columns ---"
docker exec deployment-db-1 psql -U pureline -d pureline -c "\d farms"
