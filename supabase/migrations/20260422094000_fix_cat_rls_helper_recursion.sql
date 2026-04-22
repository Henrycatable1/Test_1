-- ### prevent cats RLS helper functions from recursively re-entering cats policies
create or replace function app_private.can_manage_cat(target_cat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.cats c
      where c.id = target_cat_id
        and c.owner_user_id = auth.uid()
    )
  end;
$$;

-- ### use definer rights for collaborator-aware edit checks as well
create or replace function app_private.can_edit_cat(target_cat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.cats c
      where c.id = target_cat_id
        and c.owner_user_id = auth.uid()
    ) or exists (
      select 1
      from public.cat_collaborators cc
      where cc.cat_id = target_cat_id
        and cc.user_id = auth.uid()
        and cc.role = 'caretaker'
    )
  end;
$$;

-- ### keep cats visibility checks safe for direct reads and downstream policies
create or replace function app_private.can_view_cat(target_cat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.cats c
      where c.id = target_cat_id
        and c.owner_user_id = auth.uid()
    ) or exists (
      select 1
      from public.cat_collaborators cc
      where cc.cat_id = target_cat_id
        and cc.user_id = auth.uid()
    )
  end;
$$;
