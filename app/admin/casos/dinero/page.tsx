import Link from "next/link";
import { saveGeneralDonationChannel } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ChannelCheck } from "@/components/admin/ChannelCheck";
import { DonationChannelForm } from "@/components/admin/DonationChannelForm";
import { FormSection } from "@/components/admin/FormSection";
import { CasesIcon } from "@/components/ui/icons";
import { panel } from "@/components/ui/styles";
import { getMoneyDestinations } from "@/lib/admin-data";
import { getGeneralChannel } from "@/lib/data";
import { CHANNEL_CHECK_STALE_DAYS } from "@/lib/donation-channel";
import { plural } from "@/lib/format";
import { currentTeam } from "@/lib/team";
import type { MoneyDestination } from "@/lib/donation-channel";
import type { DonationColumns } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * A dónde va el dinero: todos los destinos que publica el portal, en una lista.
 *
 * Con los canales repartidos —uno general y uno por causa— deja de haber un solo
 * sitio donde mirar, y esa pregunta hay que poder hacerla de un vistazo: es así
 * como se detecta el destino que no debería estar ahí. Es la pantalla que se abre
 * el día que el dinero aparezca donde no debe.
 *
 * ESTÁ DENTRO DE CASOS Y NO ES UNA CUARTA SECCIÓN. El canal general no es de
 * ningún municipio, así que en Ciudades no cabe; y lo que hace es dar destino a
 * las CAUSAS que no tienen el suyo, así que es de Casos aunque no sea de una causa.
 * Verlo a la vez con los canales propios es además lo que contesta la única
 * pregunta que esta pantalla existe para contestar. Ver lib/admin-sections.ts.
 *
 * El canal general SÍ se edita aquí, y es la única excepción a la regla de que
 * cada destino se cambia en la ficha de quien lo recibe. El motivo es que no
 * recibe nadie en particular: no tiene ficha donde vivir, y ponerlo en la de un
 * municipio o de una causa haría creer que es suyo. Los canales de las causas
 * siguen editándose en su ficha y aquí solo se enlazan.
 *
 * Aquí abajo estaba la lista de correos de los avisos, y se fue a
 * /admin/recursos/avisos. Estaban juntas por una razón que no era una razón —«la
 * pantalla ya existe y su condición de entrada es la misma»—, que es cómo se llena
 * de cosas la única pantalla con cerrojo. Un correo apuntado a los avisos es algo
 * que llegó de fuera, como una oferta, y no un destino de dinero.
 *
 * LO QUE ESTA PANTALLA NO ES: el dinero recaudado. No hay ninguna cifra de lo que
 * ha entrado, porque el dinero no pasa por el portal y aquí no hay nada que sumar.
 * Lo que se repasa es a dónde apuntan los destinos publicados y desde cuándo nadie
 * los ha comprobado.
 */
export default async function MoneyPage() {
  const session = await currentTeam();

  if (session?.role !== "coordinacion") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <AdminHeader
          backHref="/admin/casos"
          backLabel="Casos"
          title="Esta pantalla es de coordinación"
          Icon={CasesIcon}
          description="A dónde va el dinero de cada causa y el canal general del portal los registra quien coordina."
        />
      </div>
    );
  }

  const [destinations, general] = await Promise.all([getMoneyDestinations(), getGeneralChannel()]);

  const live = destinations.filter((row) => row.live);
  const draft = destinations.filter((row) => !row.live);
  const generalRow = destinations.find((row) => row.level === "general");

  // Lo que convierte la lista en una pantalla de trabajo: cuántos hay que mirar
  // hoy. Se cuenta solo sobre los que se ven en el portal, que son los que pueden
  // recibir dinero de alguien ahora mismo; los que todavía no salen se revisan
  // igual, pero ahí abajo y sin prisa.
  const stale = live.filter((row) => row.check?.stale).length;
  const never = live.filter((row) => !row.check).length;

  // El formulario necesita las seis columnas y `getGeneralChannel` devuelve el
  // canal ya interpretado, que es una unión de tres formas. Se vuelve a aplanar
  // aquí en vez de pedir la fila cruda por segunda vía: dos consultas al mismo
  // destino son dos sitios donde puede quedarse una vieja.
  //
  // La fecha de comprobación se copia de lo guardado y no se manda vacía, y esto
  // no es un detalle: el formulario devuelve los seis campos, así que una fecha
  // que llegara nula donde había una borraría la comprobación cada vez que
  // coordinación tocara el titular de la llave. Es el mismo fallo que sacó el
  // canal del formulario grande de una ficha.
  const generalRaw: DonationColumns = {
    donation_key: general?.kind === "llave" ? general.value : "",
    donation_url: general?.kind === "enlace" ? general.url : "",
    donation_phone: general?.kind === "telefono" ? general.value : "",
    donation_app: general?.kind === "llave" ? general.app : "",
    donation_holder: general?.kind === "llave" ? general.holder : "",
    donation_verified_on: general?.verifiedOn ?? null,
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin/casos"
        backLabel="Casos"
        title="A dónde va el dinero"
        Icon={CasesIcon}
        description={
          <>
            Todos los destinos que el portal publica hoy. El de una causa se edita en su ficha. Una
            causa sin canal propio <span className="text-ink">recibe por el general</span>
            {generalRow?.usedBy
              ? `, y ahora mismo ${
                  generalRow.usedBy === 1
                    ? "hay una causa publicada que recibe"
                    : `hay ${generalRow.usedBy} causas publicadas que reciben`
                } así.`
              : ", y ahora mismo no hay ninguna causa publicada recibiendo por él."}
          </>
        }
      />

      {/* El aviso va arriba y antes del formulario, porque es lo que se viene a
          hacer: quien abre esto sin un motivo concreto lo abre para repasar, y sin
          este renglón tendría que recorrer catorce filas para saber si hay algo que
          repasar. Solo aparece cuando hay algo que decir. */}
      {(stale > 0 || never > 0) && (
        <p className={`${panel} mt-4 p-4 text-sm leading-relaxed text-body`}>
          De los {live.length} destinos que se ven en el portal,{" "}
          {stale > 0 && (
            <span className="text-ink">
              {plural(stale, "lleva", "llevan")} más de {CHANNEL_CHECK_STALE_DAYS} días sin
              comprobarse
            </span>
          )}
          {stale > 0 && never > 0 && " y "}
          {never > 0 && (
            <span className="text-ink">
              {never === 1 ? "hay uno que nadie ha comprobado nunca" : `hay ${never} que nadie ha comprobado nunca`}
            </span>
          )}
          . Comprobar es llamar al número, o mandar mil pesos a la llave y mirar qué nombre sale.
        </p>
      )}

      <div className="mt-8">
        <FormSection
          framed={false}
          title="El canal general"
          hint="Es el destino con más alcance del portal: cambiarlo cambia a dónde va el dinero de todas las causas sin canal propio a la vez."
        >
          <DonationChannelForm
            action={saveGeneralDonationChannel}
            row={generalRaw}
            owner="el portal"
            emptyWarning="Con los tres campos de destino vacíos, ninguna causa sin canal propio tiene a dónde recibir, y sus fichas lo dicen con esas palabras."
          />
        </FormSection>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-[20px] leading-tight text-ink">Se ven en el portal</h2>
        {live.length === 0 ? (
          <p className={`${panel} mt-4 p-4 text-sm leading-relaxed text-muted`}>
            Ningún destino publicado. Nadie que abra el portal encuentra a dónde enviar dinero.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {live.map((row) => (
              <DestinationRow key={`${row.level}-${row.owner}-${row.target}`} destination={row} />
            ))}
          </ul>
        )}
      </section>

      {/* Los que aún no salen se listan igual, y aparte. Un canal escrito en una
          ficha que todavía no está publicada es justo lo que conviene revisar
          antes de que salga, no después. */}
      {draft.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-[20px] leading-tight text-ink">Escritos, pero todavía sin salir</h2>
          <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-muted">
            Están guardados y no los ve nadie: su municipio está sin publicar, o la causa sigue en
            borrador o sin consentimiento. Se revisan ahora, que es cuando todavía no hay dinero
            de por medio.
          </p>
          <ul className="mt-4 space-y-3">
            {draft.map((row) => (
              <DestinationRow key={`${row.level}-${row.owner}-${row.target}`} destination={row} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="font-display text-[20px] leading-tight text-ink">Quién puede cambiarlos</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Solo coordinación, y está comprobado en tres capas que no dependen entre sí: la ficha
          no ofrece el campo, la Server Action lo rechaza, y la base de datos para el cambio
          aunque la llamada llegue desde fuera de la web. Esa tercera capa es la que importa:
          quien documenta un municipio <span className="text-ink">sí</span> puede escribir el
          resto de la ficha de una causa, así que sin ella cambiar el canal sería una edición más.
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          La fecha de comprobación va en el mismo cerrojo y por el mismo motivo: «editado» no es
          «comprobado», y quien pudiera escribir que un destino está comprobado sin haberlo
          comprobado estaría escribiendo la frase que el portal pone para que alguien se fíe. Y se
          borra sola si el destino cambia sin comprobarlo de nuevo, porque comprobar es un acto
          sobre un destino concreto.
        </p>
      </section>
    </div>
  );
}

const LEVEL_LABEL: Record<MoneyDestination["level"], string> = {
  general: "Canal general",
  caso: "Causa",
};

/**
 * El destino escrito entero y en monoespaciada, no recortado.
 *
 * Esta pantalla existe para comparar lo que está publicado con lo que se acordó,
 * y eso se hace carácter a carácter: una llave con un dígito cambiado y un enlace
 * con un dominio parecido son las dos formas que tiene esto de salir mal, y las
 * dos se leen igual de bien en letra de texto.
 *
 * La antigüedad de la comprobación va en la misma fila y no en una columna aparte,
 * por lo que dejó escrito `DonationChannel`: una llave sin fecha y una llave
 * comprobada anteayer se leen igual si la fecha viaja por su cuenta.
 */
function DestinationRow({ destination }: { destination: MoneyDestination }) {
  return (
    <li className={`${panel} p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="min-w-0 font-medium text-ink">{destination.owner}</p>
        <p className="shrink-0 text-xs text-faint">
          {LEVEL_LABEL[destination.level]}
          {destination.cityName && ` · ${destination.cityName}`}
        </p>
      </div>

      <p className="mt-2 break-all font-mono text-[13px] leading-relaxed text-body">
        {destination.target}
      </p>

      {/* Sin destino escrito no hay nada que comprobar, y una pastilla que dijera
          «sin comprobar nunca» debajo de «Sin canal general» hablaría de un trabajo
          que no existe. La única fila que puede llegar vacía es la del general, que
          `moneyDestinationsOf` lista siempre; las de las causas solo entran en la
          lista si tienen canal, así que en ellas se escribe aunque no salgan
          publicadas todavía —es cuando conviene mirarlas—. */}
      {(destination.level === "caso" || destination.live) && (
        <p className="mt-2.5">
          <ChannelCheck check={destination.check} />
        </p>
      )}

      {destination.level === "general" && destination.usedBy !== undefined && (
        <p className="mt-2 text-xs leading-relaxed text-faint">
          {destination.usedBy === 0
            ? "Ninguna causa publicada recibe por aquí ahora mismo."
            : `${plural(destination.usedBy, "causa publicada recibe", "causas publicadas reciben")} por aquí sin haberlo elegido.`}
        </p>
      )}

      <Link
        href={destination.href}
        className="mt-2 inline-flex min-h-11 items-center text-sm text-accent hover:underline"
      >
        {destination.level === "general"
          ? "Se cambia en el formulario de arriba"
          : "Abrir la ficha donde se cambia"}
      </Link>
    </li>
  );
}
