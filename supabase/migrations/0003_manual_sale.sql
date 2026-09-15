-- Ticketing app: venta manual con comprobante (factura o foto de efectivo).
-- Correr esto en el SQL Editor de Supabase (o via `supabase db push`).

alter table tickets add column payment_proof_path text;

-- Bucket privado: solo se lee/escribe con la service role desde server
-- actions (createAdminClient()), nunca directo desde el browser, así que no
-- hace falta ninguna policy de storage.objects.
--
-- Si el SQL Editor no te deja hacer este insert (depende del plan de
-- Supabase), se crea igual desde Dashboard -> Storage -> "New bucket" ->
-- payment-proofs, marcado como privado.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
