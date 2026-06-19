alter table public.profiles
add column if not exists country_code text,
add column if not exists country_name_en text,
add column if not exists province_code text,
add column if not exists province_name_en text,
add column if not exists gender text;

alter table public.evaluations
add column if not exists user_country_code text,
add column if not exists user_country_name_en text,
add column if not exists user_province_code text,
add column if not exists user_province_name_en text,
add column if not exists user_gender text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_gender_check'
  ) then
    alter table public.profiles
    add constraint profiles_gender_check
    check (gender is null or gender in ('male', 'female', 'prefer_not_to_say'));
  end if;
end;
$$;

update public.profiles
set
  country_code = 'IQ',
  country_name_en = 'Iraq'
where country_code is null
  and lower(trim(coalesce(country, ''))) in ('iraq', 'العراق', 'عراق');

update public.profiles
set
  country_code = 'AE',
  country_name_en = 'United Arab Emirates'
where country_code is null
  and lower(trim(coalesce(country, ''))) in ('united arab emirates', 'uae', 'الإمارات', 'الامارات', 'دبي', 'dubai');

update public.profiles
set province_code = 'BGD', province_name_en = 'Baghdad'
where province_code is null
  and lower(trim(coalesce(province, city, ''))) in ('baghdad', 'بغداد', 'بغداد محافظة');

update public.profiles
set province_code = 'BSR', province_name_en = 'Basra'
where province_code is null
  and lower(trim(coalesce(province, city, ''))) in ('basra', 'البصرة', 'البصره');

update public.profiles
set province_code = 'EBL', province_name_en = 'Erbil'
where province_code is null
  and lower(trim(coalesce(province, city, ''))) in ('erbil', 'أربيل', 'اربيل', 'هەولێر');

update public.evaluations e
set
  user_country_code = p.country_code,
  user_country_name_en = p.country_name_en,
  user_province_code = p.province_code,
  user_province_name_en = p.province_name_en,
  user_gender = p.gender
from public.profiles p
where e.user_id = p.id
  and (
    e.user_country_code is null
    or e.user_country_name_en is null
    or e.user_province_code is null
    or e.user_gender is null
  );
