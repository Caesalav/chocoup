import { saveDonationKey } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { alertBox, eyebrow, field, panel } from "@/components/ui/styles";
import { getDonationKeyRow } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";
import { currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

/**
 * La llave de transferencia del portal: un formulario de tres campos, y es el
 * formulario más delicado del panel.
 *
 * Está aparte de la ficha de un municipio a propósito, y eso es lo que la pantalla
 * tiene que conseguir que se entienda de un vistazo: la llave es UNA para todo el
 * portal. El enlace de donación de una fundación se edita dentro de su municipio y
 * solo afecta a ese municipio; esto se edita aquí y cambia a dónde transfiere todo
 * el que done desde cualquier pantalla. Si estas dos cosas vivieran en el mismo
 * formulario, cambiar una con prisa sería cambiar la otra sin darse cuenta.
 *
 * La comprobación de rol de abajo no es lo que protege nada: es la primera de tres
 * —la pantalla, la Server Action y la política `donation_key_coordination`, que
 * rechaza el update aunque la llamada llegue desde fuera de la web—. Aquí se
 * comprueba para no ofrecerle a quien documenta un campo que la base de datos le va
 * a rechazar, y sobre todo para no enseñarle dónde está.
 */
export default async function DonationKeyPage() {
  const session = await currentTeam();

  if (session?.role !== "coordinacion") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl text-ink">Esta pantalla es de coordinación</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          La llave a la que transfiere quien dona la cambia quien coordina, igual que los enlaces de
          donación de las fundaciones. Tu cuenta documenta municipios.
        </p>
      </div>
    );
  }

  const donationKey = await getDonationKeyRow();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className={eyebrow}>Panel del equipo</p>
      <h1 className="mt-1 font-display text-3xl text-ink">A dónde va el dinero</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Esta llave es <span className="text-ink">una para todo el portal</span> y sale en{" "}
        <code className="rounded bg-line px-1.5 py-0.5 text-xs text-body">/donaciones</code>, en la
        ficha de cada municipio y en la de cada caso. Cambiarla aquí la cambia en las tres, en la
        siguiente carga y sin desplegar nada.
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        No es el enlace de donación de una fundación. Ese es de su municipio, va en la ficha del
        municipio y solo afecta a ese municipio.
      </p>

      {donationKey === null ? (
        /* Sin fila no hay nada que editar, y ofrecer el formulario sería ofrecer un
           guardado que no tiene dónde caer. Se dice qué falta con el nombre del
           archivo, que es lo que hay que pegar en el SQL Editor. */
        <p className={`${alertBox} mt-8 max-w-prose leading-relaxed`}>
          La base de datos todavía no tiene la tabla de la llave. Pega{" "}
          <code>supabase/migrations/0010_llave_de_transferencia.sql</code> en el SQL Editor de
          Supabase y vuelve a esta pantalla.
        </p>
      ) : (
        <>
          <section className="mt-8">
            <form action={saveDonationKey} className={`${panel} space-y-4 p-5`}>
              <label className="block">
                <span className={field.label}>La llave</span>
                <input
                  name="key_value"
                  defaultValue={donationKey.value}
                  className={`${field.input} font-mono`}
                  placeholder="@soschoco"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className={field.hint}>
                  Tal y como se teclea en la app, sin espacios. Se guarda literal: no se le añade
                  nada ni se le corrige nada, porque cualquier arreglo automático sobre un destino de
                  dinero sería un destino distinto. Vacía retira la llave del portal y las tres
                  pantallas dejan de ofrecerla; es lo primero que hay que hacer si se compromete.
                </span>
              </label>

              <label className="block">
                <span className={field.label}>En qué app se usa</span>
                <input
                  name="app_label"
                  defaultValue={donationKey.app}
                  className={field.input}
                  placeholder="Bre-B, Nequi, Daviplata…"
                  autoComplete="off"
                />
                <span className={field.hint}>
                  Sale escrito al lado de la llave y dentro de las instrucciones. Vacío no rompe
                  nada: el portal dice entonces «tu app de banco o billetera», que es cierto pero
                  hace dudar. Ponlo.
                </span>
              </label>

              <label className="block">
                <span className={field.label}>A nombre de quién aparece</span>
                <input
                  name="holder"
                  defaultValue={donationKey.holder}
                  className={field.input}
                  placeholder="El nombre que muestra la app al confirmar"
                  autoComplete="off"
                />
                <span className={field.hint}>
                  El portal le pide a quien dona que compruebe este nombre antes de confirmar la
                  transferencia. Es lo único con lo que puede darse cuenta de que la llave ha sido
                  cambiada por otra, así que tiene que estar escrito exactamente como lo muestra la
                  app. Si no lo sabes con seguridad, déjalo vacío antes que poner uno aproximado.
                </span>
              </label>

              <SubmitButton>Guardar la llave</SubmitButton>
            </form>
          </section>

          {/* Quién y cuándo, tomado de la fila y no del panel: lo escribe un
              disparador desde el correo del token, así que dice de qué sesión salió
              el cambio y no lo que un formulario quisiera afirmar. Es lo primero
              que se va a mirar el día que el dinero aparezca donde no debe. */}
          <p className="mt-4 text-xs leading-relaxed text-faint">
            Último cambio: {formatDateTime(donationKey.updatedAt)}
            {donationKey.updatedBy
              ? ` · ${donationKey.updatedBy}`
              : " · sin sesión (SQL Editor o la propia migración)"}
          </p>

          <section className="mt-10 border-t border-line pt-6">
            <h2 className="font-display text-2xl text-ink">Cómo se ve ahora mismo</h2>
            {donationKey.value ? (
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
                Quien entre a{" "}
                <code className="rounded bg-line px-1.5 py-0.5 text-xs text-body">/donaciones</code>{" "}
                lee la llave <span className="font-mono text-ink">{donationKey.value}</span>, escrita
                entera y en grande, con los pasos para pegarla en{" "}
                {donationKey.app || "su app de banco o billetera"}
                {donationKey.holder
                  ? `, y con el aviso de comprobar que la app dice ${donationKey.holder} antes de confirmar.`
                  : ", y sin ningún nombre que comprobar, porque no hay ninguno registrado."}
              </p>
            ) : (
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
                No hay llave puesta, así que el portal no la ofrece en ninguna pantalla. Un caso sin
                canal propio y sin fundación en su municipio se puede leer y no se le puede enviar
                dinero.
              </p>
            )}
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              El portal no cobra ni recibe nada: publica la llave y la transferencia se hace dentro
              de la app de quien dona. Sin JavaScript se ve igual, porque la llave va escrita en la
              página y el botón de copiar es solo un añadido.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
