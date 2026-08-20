-- Chocó-up: la marca de que ya se avisó de una donación.
--
-- Va detrás de 0023_donacion_al_fondo.sql y se puede ejecutar más de una vez
-- sin errores.
--
-- ===========================================================================
-- POR QUÉ HACEN FALTA DOS COLUMNAS PARA MANDAR DOS CORREOS
--
-- Cuando un pago se confirma salen dos correos: el agradecimiento a quien donó
-- y el aviso al equipo. Parece que bastaría con enviarlos en el webhook, justo
-- después de escribir la fila, y no basta, porque el webhook NO se ejecuta una
-- vez por pago:
--
--   * Mercado Pago reintenta lo que no responda 200 —por diseño, cuando algo
--     falla o tarda—, y ese reintento vuelve a entrar por aquí.
--   * Un pago avisa varias veces a lo largo de su vida: pendiente, aprobado,
--     y a veces reembolsado. La ruta ya está escrita para eso: el índice único
--     de 0017 convierte el segundo aviso en la misma fila, no en una nueva.
--
-- O sea que la tabla ya sabe no duplicar el DINERO, y esa misma protección no
-- sirve para los correos: una fila que se actualiza cuatro veces es una sola
-- donación, pero serían cuatro agradecimientos a la misma persona y cuatro
-- avisos al equipo por el mismo pago. Un registro contable que se corrige solo
-- y una bandeja de entrada que no se puede descorregir no son el mismo
-- problema: el correo ya enviado no se puede retirar.
--
-- Así que el envío se apunta en la fila, y se apunta ANTES de enviar. El orden
-- importa y es lo contrario de lo intuitivo: quien va a mandar el correo
-- primero se apropia del turno con un `update ... where thanked_at is null`,
-- que la base resuelve para uno solo aunque entren dos avisos a la vez, y solo
-- entonces envía. Marcar después dejaría la ventana abierta justo donde el
-- problema ocurre. Si el envío falla, quien lo intentó borra su marca y el
-- siguiente reintento de Mercado Pago lo vuelve a coger.
--
-- SON DOS COLUMNAS Y NO UNA porque son dos destinatarios y fallan por separado.
-- Con una sola marca compartida, que Resend rechace el correo de quien donó
-- —una dirección con una errata, un buzón lleno— cancelaría también el aviso al
-- equipo, y el equipo dejaría de enterarse de un dinero que sí entró. Cada
-- correo lleva su propia cuenta.
--
-- LO QUE ESTAS COLUMNAS NO SON: no son el correo de quien donó. Ese no se
-- guarda en ninguna parte. Llega en la respuesta de Mercado Pago cuando el
-- webhook pregunta por el pago, se usa para enviar y se suelta. Aquí solo queda
-- la hora a la que se envió, que es lo que hace falta para no repetirlo y para
-- poder mirar después si un aviso salió o no. El portal no tiene lista de
-- correos de donantes, y estas columnas no la abren.
-- ===========================================================================

alter table public.donations
  add column if not exists thanked_at timestamptz,
  add column if not exists alerted_at timestamptz;

comment on column public.donations.thanked_at is
  'Cuándo se envió el agradecimiento a quien donó. Nulo si no se ha enviado. No guarda la dirección: esa no se guarda.';

comment on column public.donations.alerted_at is
  'Cuándo se avisó al equipo de esta donación. Nulo si no se ha avisado.';

-- ---------------------------------------------------------------------------
-- El registro público no cambia
--
-- Se deja escrito porque la tentación de tocarlo existe: `donation_log` nombra
-- sus columnas una a una (0023), así que estas dos no salen solas ni saldrían
-- aunque alguien las quisiera. No hay nada que revocar y no se recrea la vista.
--
-- Y la tabla sigue con las tres barreras de 0017 enteras. Estas columnas las
-- escribe el mismo webhook y con la misma llave de servicio que ya escribía el
-- importe: añadir dónde apuntar un envío no añade una puerta.
-- ---------------------------------------------------------------------------

-- Quien busca a quién le falta el correo pregunta por lo confirmado y sin
-- marca. Parcial por lo mismo que los índices de 0021 y 0023: una donación
-- fallida no lleva agradecimiento y no tiene por qué ocupar el índice.
create index if not exists donations_sin_avisar
  on public.donations (status)
  where status = 'confirmada' and (thanked_at is null or alerted_at is null);
