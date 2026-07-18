-- ### restore the trusted email mirror before enforcing the client write boundary
update public.profiles as profile
set email = auth_user.email
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.email is distinct from auth_user.email;

-- ### require profile creation to use the verified email from the caller's signed auth token
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
  and email is not distinct from (select auth.jwt() ->> 'email')
);

-- ### prevent app clients from redirecting alerts or reserving another user's signup email
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and email is not distinct from (select auth.jwt() ->> 'email')
);
