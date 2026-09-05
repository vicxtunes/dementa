  -- ============================================================
  -- Provision the single teacher account.
  --
  -- Run this ONCE in the Supabase SQL editor (Project > SQL Editor),
  -- AFTER schema.sql (and fix-auth-issues.sql). Safe to re-run — it does
  -- nothing if the account already exists.
  --
  -- Teacher login:
  --   email:    victordementa@gmail.com
  --   password: Admin123@
  --
  -- Sign-up in the app is students only (the role picker was removed), so
  -- this is the only way the teacher account is created. Change the
  -- password after first login from the Supabase dashboard, or with:
  --   update auth.users
  --   set encrypted_password = crypt('NEW_PASSWORD', gen_salt('bf'))
  --   where email = 'victordementa@gmail.com';
  -- ============================================================

  -- pgcrypto provides crypt() / gen_salt() — enabled by default on Supabase.
  create extension if not exists pgcrypto;

  do $$
  declare
    v_email      text := 'victordementa@gmail.com';
    v_password   text := 'Admin123@';
    v_full_name  text := 'Victor Dementa';
    v_class_code text := 'S.4 General';
    v_user_id    uuid;
  begin
    select id into v_user_id from auth.users where email = v_email;

    if v_user_id is null then
      v_user_id := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_password, gen_salt('bf')),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_full_name, 'role', 'teacher', 'class_code', v_class_code),
        now(),
        now(),
        '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(), now(), now()
      );
    end if;

    -- Make sure the profile row exists and is marked as the teacher, even if
    -- the on_auth_user_created trigger wasn't in place when the user was made.
    insert into public.profiles (id, full_name, role, class_code)
    values (v_user_id, v_full_name, 'teacher', v_class_code)
    on conflict (id) do update
      set role = 'teacher',
          class_code = excluded.class_code,
          full_name = coalesce(public.profiles.full_name, excluded.full_name);
  end $$;
