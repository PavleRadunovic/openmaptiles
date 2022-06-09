create table public.street as
select row_number() OVER () as osm_id, lin.*, prv.name, prv.name_alt, prv.name_local, prv.type, prv.type_en
from (SELECT geometry,
	ST_AsGeoJSON(geometry) as geom_json,
	ST_AsGeoJSON(st_transform(geometry, 4326)) as geom_latlng_json,
	ST_XMin(geometry) as x_min,
	ST_XMax(geometry) as x_max,
	ST_YMin(geometry) as y_min,
	ST_YMax(geometry) as y_max,
	ST_XMin(st_transform(geometry, 4326)) as lng_min,
	ST_YMin(st_transform(geometry, 4326)) as lat_min,
	ST_XMax(st_transform(geometry, 4326)) as lng_max,
	ST_YMax(st_transform(geometry, 4326)) as lat_max,
	tags -> 'name' as street_name,
	tags -> 'name:en' as street_name_en,
	highway, 
	to_tsvector('simple', concat_ws(' ',tags -> 'name', tags -> 'name:en')) as ts_data 
FROM public.osm_transportation_name_linestring) as lin
left join public.ne_10m_admin_1_states_provinces as prv
on st_intersects(lin.geometry, prv.geometry);

CREATE INDEX street_ts_data_idx ON public.street USING gin (ts_data);

alter table public.street
add primary key(osm_id);
