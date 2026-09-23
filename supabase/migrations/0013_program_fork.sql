-- 0013: Program kopyalama (fork) künyesi.
-- Kopyalanan program, kaynağına referans tutar (silinirse null'a düşer). Kopyalama işlemi
-- istemci tarafında yapılır (herkese açık programı okuyup kendi adına insert) — ekstra RPC gerekmez.

alter table public.programs
  add column if not exists forked_from uuid references public.programs (id) on delete set null;

create index if not exists programs_forked_from_idx on public.programs (forked_from);
