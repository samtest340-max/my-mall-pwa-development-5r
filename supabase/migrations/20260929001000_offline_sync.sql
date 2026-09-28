create or replace function public.sync_push(p_device_id uuid, p_changes jsonb) returns jsonb language plpgsql security invoker set search_path = public as $$
declare c jsonb; result jsonb := '[]'::jsonb; rid uuid; t text; op text; payload jsonb; existing_version bigint; business uuid;
begin
  business := app_private.current_business_id();
  if business is null then raise exception 'Business context required'; end if;
  for c in select * from jsonb_array_elements(coalesce(p_changes,'[]'::jsonb)) loop
    rid := (c->>'id')::uuid; t := c->>'table'; op := c->>'op'; payload := c->'payload';
    if t in ('sales','sale_items','payments','stock_movements','customer_ledger') and op <> 'insert' then
      insert into sync_conflicts(id,business_id,table_name,record_id,client_payload,server_payload,reason) values (gen_random_uuid(),business,rid,rid,payload,'{}','append_only_update_rejected');
      result := result || jsonb_build_array(jsonb_build_object('id',c->>'id','result','conflict')); continue;
    end if;
    if op = 'delete' then execute format('delete from public.%I where id = $1 and business_id = $2',t) using rid,business;
    elsif op in ('insert','update') then
      execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I,$1) on conflict (id) do nothing',t,t) using payload;
    else raise exception 'Unsupported sync operation'; end if;
    result := result || jsonb_build_array(jsonb_build_object('id',c->>'id','result','applied'));
  end loop;
  return result;
end $$;
revoke all on function public.sync_push(uuid,jsonb) from public;
grant execute on function public.sync_push(uuid,jsonb) to authenticated;

create or replace function public.sync_pull(p_since bigint default 0, p_batch_size int default 500) returns jsonb language plpgsql security invoker set search_path = public as $$
declare business uuid := app_private.current_business_id(); max_cursor bigint := p_since; rows jsonb := '[]'::jsonb; t text; r record; n int := 0;
begin
  if business is null then raise exception 'Business context required'; end if;
  for t in select unnest(array['businesses','branches','profiles','devices','categories','products','stock_movements','customers','sales','sale_items','payments','customer_ledger','suppliers','purchases','purchase_items','supplier_ledger','expenses','till_sessions','audit_log','sync_conflicts']) loop
    for r in execute format('select to_jsonb(x) row from public.%I x where x.business_id = $1 and x.server_version > $2 order by x.server_version limit $3',t) using business,p_since,p_batch_size loop
      rows := rows || jsonb_build_array(jsonb_build_object('table',t,'row',r.row)); max_cursor := greatest(max_cursor,(r.row->>'server_version')::bigint); n := n + 1; if n >= p_batch_size then return jsonb_build_object('rows',rows,'cursor',max_cursor); end if;
    end loop;
  end loop;
  return jsonb_build_object('rows',rows,'cursor',max_cursor);
end $$;
revoke all on function public.sync_pull(bigint,int) from public;
grant execute on function public.sync_pull(bigint,int) to authenticated;
