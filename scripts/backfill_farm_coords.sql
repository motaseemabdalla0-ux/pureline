UPDATE farms SET coordinates_lat = 26.6975008, coordinates_lng = 38.0415061 WHERE farm_code = 'UDH-000338' AND coordinates_lat IS NULL;
UPDATE farms SET coordinates_lat = 26.7421912, coordinates_lng = 37.9859717 WHERE farm_code = 'UDH-000373' AND coordinates_lat IS NULL;
UPDATE farms SET coordinates_lat = 26.7034545, coordinates_lng = 38.0687482 WHERE farm_code = 'UDH-000337' AND coordinates_lat IS NULL;
UPDATE farms SET coordinates_lat = 25.7360428, coordinates_lng = 39.2452946 WHERE farm_code = 'KHP-00007' AND coordinates_lat IS NULL;
UPDATE farms SET coordinates_lat = 25.7352281, coordinates_lng = 39.2521503 WHERE farm_code = 'KHP-00002' AND coordinates_lat IS NULL;
UPDATE farms SET coordinates_lat = 26.7213654, coordinates_lng = 37.9275147 WHERE farm_code = 'UDH-000002' AND coordinates_lat IS NULL;
UPDATE traps t SET lat = f.coordinates_lat + 0.0006 * ((t.id % 3) - 1), lng = f.coordinates_lng + 0.0006 * (t.id % 2)
  FROM farms f WHERE f.farm_code = t.farm_code AND t.lat IS NULL;
