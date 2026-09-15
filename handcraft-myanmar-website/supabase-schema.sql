-- Handcraft Myanmar portfolio backend
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  location text,
  description text,
  image_url text,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Public can view published projects"
on public.projects for select
to anon, authenticated
using (published = true);

create policy "Authenticated admins can insert projects"
on public.projects for insert
to authenticated
with check (true);

create policy "Authenticated admins can update projects"
on public.projects for update
to authenticated
using (true)
with check (true);

create policy "Authenticated admins can delete projects"
on public.projects for delete
to authenticated
using (true);

insert into storage.buckets (id,name,public)
values ('project-images','project-images',true)
on conflict (id) do nothing;

create policy "Public can view project images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'project-images');

create policy "Authenticated users can upload project images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-images');

create policy "Authenticated users can update project images"
on storage.objects for update
to authenticated
using (bucket_id = 'project-images')
with check (bucket_id = 'project-images');

create policy "Authenticated users can delete project images"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-images');
