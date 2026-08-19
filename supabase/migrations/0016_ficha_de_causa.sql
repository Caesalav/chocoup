-- Chocó-up: lo que le falta a la ficha de una causa para poder leerse con prisa
-- y sin mentir. Qué es la causa, la frase que viaja por WhatsApp, y desde cuándo
-- nadie ha comprobado a dónde va su dinero.
--
-- Va detrás de 0015 y se puede ejecutar más de una vez sin errores.
--
-- ===========================================================================
-- ESTA VA DETRÁS DE 0015 Y NO SE PUEDE ADELANTAR
--
-- No porque borre nada —no borra nada— sino porque toca
-- `public.donation_channel`, que 0015 crea, y porque vuelve a escribir
-- `private.guard_donation_channel()`, que 0013 dejó con cinco columnas y aquí
-- pasa a tener seis. Pegada sobre una base sin 0015 falla en la primera línea
-- del bloque del canal general, que es la forma correcta de fallar: en seco y
-- antes de tocar nada.
--
-- El orden de despliegue es el que 0015 dejó escrito y esta no lo cambia: código
-- y migraciones en el mismo rato. Lo que esta añade son columnas nuevas con valor
-- por omisión, así que el código de AHORA MISMO en producción no se rompe si esto
-- se pega antes que el suyo —`select *` devuelve tres columnas más y nadie las
-- lee—. Lo que sí se rompe al revés: el código nuevo pide `case_kind` y `summary`
-- por su nombre.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Qué es la causa: una persona, un colegio, un animal o una fundación
--
-- El portal ya lo decía con palabras —lo escriben /donaciones y la ficha de un
-- municipio desde 0015— pero no lo sabía nadie más que el texto. Sin este campo,
-- todo lo que la interfaz decide sobre una causa lo decide como si fuera una
-- persona, y hay una decisión que se nota: la reserva del retrato.
--
-- CUANDO NO HAY RETRATO, `CasePortrait` DIBUJA LAS INICIALES DEL NOMBRE. Para
-- una persona es una respuesta —«DC» donde va la cara de Daniela Córdoba— y para
-- un colegio es un error de bulto: «IE» en un círculo, donde tenía que haber una
-- escuela, se lee como un dato mal guardado. Con un animal es peor todavía,
-- porque un animal no tiene iniciales de nada. Lo que hace este campo posible es
-- que el hueco vacío diga qué falta en vez de inventar dos letras; el dibujo lo
-- elige components/case/CasePortrait.tsx y aquí solo se registra qué es.
--
-- ES TEXTO CON RESTRICCIÓN Y NO UN `enum` DE POSTGRES, igual que `offers.status`
-- (0012) y `feedback.kind`. El motivo es el mismo: añadir un valor a un enum es
-- una migración que no se puede volver a pegar sin más, y aquí va a haber un
-- quinto tipo —un puesto de salud, una vereda— antes de que acabe el año. Con una
-- restricción de texto, ampliarla es `drop constraint` y `add constraint` en dos
-- líneas idempotentes.
--
-- 'persona' POR OMISIÓN, y no un valor vacío que obligue a elegir. Las causas que
-- ya están escritas son personas —lo son todas las que hay— y un campo obligatorio
-- nuevo dejaría la ficha de la mujer de Quibdó sin poder guardarse hasta que
-- alguien contestara una pregunta cuya respuesta ya sabemos. Quien documenta en
-- terreno no puede encontrarse un formulario que no guarda por un campo que se
-- añadió mientras estaba en el río.
-- ---------------------------------------------------------------------------

alter table public.cases
  add column if not exists case_kind text not null default 'persona';

alter table public.cases drop constraint if exists cases_kind_valid;
alter table public.cases add constraint cases_kind_valid
  check (case_kind in ('persona', 'colegio', 'animal', 'fundacion'));

-- ---------------------------------------------------------------------------
-- La frase que viaja por WhatsApp
--
-- Hoy la tarjeta de una causa corta la historia a 140 caracteres con `excerpt()`,
-- y ese corte cae donde cae: a mitad de una frase, a veces a mitad de una palabra.
-- Da igual en una lista y no da igual aquí, porque ESA es la frase que sale en la
-- vista previa de WhatsApp cuando alguien comparte el enlace, que es como se mueve
-- este portal entero. Un recorte automático es lo que hace que el primer contacto
-- de alguien con una familia del Chocó sea media oración.
--
-- 120 caracteres y no 140: la vista previa de WhatsApp corta antes que la tarjeta
-- del portal, y el número tiene que ser el del sitio más estrecho donde se lee.
-- Se comprueba en la base de datos porque el aviso del formulario se puede saltar
-- —el panel se usa desde un móvil y un `maxlength` no viaja en una llamada a la
-- API— y lo que hay al otro lado no es un texto feo, es un texto cortado.
--
-- Vacío es válido y es como nacen todas. Sin resumen, la tarjeta sigue recortando
-- la historia como hasta ahora: esto no puede ser un requisito para publicar,
-- porque entonces una familia se quedaría sin publicar por una frase de redacción.
-- Lo que hace es que se pueda escribir bien cuando haya un minuto.
-- ---------------------------------------------------------------------------

alter table public.cases
  add column if not exists summary text not null default '';

alter table public.cases drop constraint if exists cases_summary_len;
alter table public.cases add constraint cases_summary_len
  check (char_length(summary) <= 120);

-- ---------------------------------------------------------------------------
-- Desde cuándo nadie ha comprobado a dónde va el dinero
--
-- «Editado» no es «comprobado», y hasta aquí el portal solo sabía lo primero.
-- `updated_at` se mueve cuando alguien arregla una errata en la historia, así que
-- no dice nada sobre el destino del dinero; y el destino del dinero es lo único de
-- esta pantalla que puede hacer daño de verdad.
--
-- LO QUE ESTA COLUMNA SUSTITUYE, Y POR QUÉ NO SE HIZO LO OTRO. Lo que se pedía en
-- la referencia era una insignia de «donación protegida», de las que llevan las
-- plataformas de recaudación. Aquí sería mentira: el dinero NO pasa por el portal
-- —lo dice cada tarjeta de canal— así que no hay nada que el portal pueda
-- proteger, ni devolver, ni retener. Una insignia así afirma una garantía que
-- nadie puede cumplir, y quien la lee dona con una red que no existe.
--
-- Lo honesto que sí se puede afirmar es más pequeño y es cierto: alguien de
-- coordinación llamó a este número, o mandó mil pesos a esta llave y comprobó qué
-- nombre salía, tal día. Eso es lo que se guarda aquí.
--
-- Y ENVEJECE A LA VISTA, que es la mitad del valor de este campo. Una fecha de
-- comprobación de hace ocho meses presentada como una insignia fija diría que
-- esto está vigilado cuando lleva ocho meses sin mirarse. Pasados 60 días la ficha
-- lo dice con palabras; el umbral y la frase viven en lib/donation-channel.ts, que
-- es donde se lee, y no aquí.
--
-- NULO ES EL ESTADO NORMAL Y NO UN HUECO QUE HAYA QUE RELLENAR: significa que
-- nadie lo ha comprobado, que es la verdad de casi todos los canales el día que
-- se registran. La ficha no dice nada en ese caso, y callar es correcto: lo que no
-- se puede hacer es dar por comprobado lo que no lo está.
--
-- Va en las dos tablas y con el mismo nombre, por lo que 0015 dejó escrito de las
-- otras cinco: `donationChannel()` (lib/donation-channel.ts) lee una fila con esa
-- forma y no sabe de quién es. Si el general tuviera fecha de comprobación y el de
-- una familia no, la ficha tendría que saber cuál está mirando para decidir si
-- puede decirlo, y ahí es donde se cuela el que se queda atrás.
-- ---------------------------------------------------------------------------

alter table public.cases
  add column if not exists donation_verified_on date;

alter table public.donation_channel
  add column if not exists donation_verified_on date;

-- ---------------------------------------------------------------------------
-- La comprobación es del canal, así que la pone quien pone el canal
--
-- Sexta columna del guardián de 0011, ampliado en 0013. Sin ella, quien documenta
-- un municipio podría escribir «Comprobado hoy» sobre el canal de una familia sin
-- haber comprobado nada, y esa frase es justamente la que el portal pone para que
-- alguien se fíe. Cambiar el destino y afirmar que está verificado son la misma
-- clase de escritura y tienen que estar en el mismo círculo pequeño.
--
-- El resto del guardián no cambia y conviene releer por qué mira el CAMBIO y no el
-- valor: quien documenta tiene que poder seguir guardando la ficha entera —la
-- historia, el consentimiento, el retrato, y ahora el tipo de causa y el
-- resumen— sin tropezar con un canal que ya estaba puesto y que no toca.
-- ---------------------------------------------------------------------------

create or replace function private.guard_donation_channel()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') = '' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if (new.donation_key <> '' or new.donation_url <> ''
        or new.donation_phone <> ''
        or new.donation_app <> '' or new.donation_holder <> ''
        or new.donation_verified_on is not null)
       and not private.is_coordination() then
      raise exception 'El canal de donación lo pone coordinación'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if (new.donation_key         is distinct from old.donation_key
   or new.donation_url         is distinct from old.donation_url
   or new.donation_phone       is distinct from old.donation_phone
   or new.donation_app         is distinct from old.donation_app
   or new.donation_holder      is distinct from old.donation_holder
   or new.donation_verified_on is distinct from old.donation_verified_on)
     and not private.is_coordination() then
    raise exception 'Cambiar el canal de donación es de coordinación'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Un destino nuevo no hereda la comprobación del anterior
--
-- Es el fallo que este bloque existe para hacer imposible, y es silencioso: la
-- ficha dice «Comprobado el 3 de agosto» debajo de una llave que se cambió el 12
-- de septiembre. Nadie ha mentido a mano; simplemente la fecha se quedó donde
-- estaba mientras el destino se movía debajo, y lo que queda en pantalla es una
-- comprobación de una cuenta que ya no es esa. Quien dona lee la frase que el
-- portal puso para que se fíe, y se fía de lo que no se ha mirado.
--
-- Así que la fecha se borra sola en cuanto el destino cambia. La regla es la
-- misma que hace correcto el guardián de arriba —se mira el cambio, no el valor—
-- y se lee en una frase: comprobar es un acto sobre un destino concreto, y con
-- otro destino delante ese acto no ha ocurrido.
--
-- SALVO QUE SE ESCRIBAN LAS DOS COSAS A LA VEZ, que es el caso normal y no una
-- excepción: coordinación cambia la llave y en la misma pantalla anota que acaba
-- de comprobar la nueva. Se distingue igual que en el guardián, comparando con la
-- fila vieja: si la fecha viene distinta de la que había, la puso quien escribe y
-- se respeta; si viene igual, es la de antes viajando de acompañante en un
-- `update` que cambia el destino, y esa es la que se cae.
--
-- Y no se acepta una comprobación en el futuro. «Comprobado el 15 de octubre» en
-- agosto no es un error de dedo inofensivo: es la frase de fiarse, fechada para
-- que aguante dos meses más de los que le tocan. Va en el disparador y no en una
-- restricción porque una restricción no puede mirar el calendario —tendría que
-- llamar a `current_date`, que no es inmutable— y porque aquí el error se puede
-- explicar.
-- ---------------------------------------------------------------------------

create or replace function private.guard_channel_verification()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.donation_verified_on is not null
     and new.donation_verified_on > current_date then
    raise exception 'Una comprobación del canal no puede ser de una fecha futura'
      using errcode = '22007';
  end if;

  if tg_op = 'UPDATE'
     and new.donation_verified_on is not distinct from old.donation_verified_on
     and (new.donation_key   is distinct from old.donation_key
       or new.donation_url   is distinct from old.donation_url
       or new.donation_phone is distinct from old.donation_phone) then
    new.donation_verified_on = null;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_channel_verification() from anon, authenticated;

drop trigger if exists cases_guard_channel_verification on public.cases;
create trigger cases_guard_channel_verification
  before insert or update on public.cases
  for each row execute function private.guard_channel_verification();

drop trigger if exists donation_channel_guard_verification on public.donation_channel;
create trigger donation_channel_guard_verification
  before insert or update on public.donation_channel
  for each row execute function private.guard_channel_verification();

-- ---------------------------------------------------------------------------
-- Ni el tipo, ni el resumen, ni la comprobación abren un permiso nuevo
--
-- No hay nada que conceder y esta nota está aquí para que se vea que no es un
-- olvido. Las tres columnas viven en tablas que ya tienen sus permisos
-- recortados por 0008 y por 0015, y los permisos de tabla son de la TABLA y no de
-- la columna: quien podía escribir en `public.cases` puede escribir en las
-- columnas nuevas, y quien no, no.
--
-- Lo que sí hacía falta comprobar era quién puede escribir cada una, y no es lo
-- mismo para las tres. El tipo y el resumen los escribe quien documenta, como el
-- resto de la ficha: son lo que se ve en terreno. La fecha de comprobación no, y
-- de eso se encarga el guardián de arriba.
-- ---------------------------------------------------------------------------
