import Link from "next/link";
import { eyebrow, panel } from "@/components/ui/styles";
import { getMoneyDestinations } from "@/lib/admin-data";
import { currentTeam } from "@/lib/team";
import type { MoneyDestination } from "@/lib/donation-channel";

export const dynamic = "force-dynamic";

/**
 * A dónde va el dinero: todos los destinos que publica el portal, en una lista y
 * sin un solo campo que se pueda editar.
 *
 * Aquí estaba el formulario de la llave del portal, una para todo el Chocó. Esa
 * llave se fue: no existe un canal general, porque un canal general no puede
 * decir a dónde va el dinero de nadie. Ahora cada municipio tiene el suyo y cada
 * caso el suyo, y **se editan en la ficha de quien lo recibe**, con su nombre y su
 * historia delante. Poner aquí un formulario sería un segundo sitio donde cambiar
 * lo mismo, que es exactamente cómo se cambia el que no se quería cambiar.
 *
 * Lo que sí se perdió al repartir los canales es la pregunta que esta pantalla
 * vuelve a contestar: **¿qué destinos estamos publicando ahora mismo?** Con un
 * solo campo bastaba mirarlo; con uno por pueblo y uno por familia hay que poder
 * recorrerlos de un vistazo, porque es así como se detecta el que no debería
 * estar ahí. Es la pantalla que se abre el día que el dinero aparezca donde no
 * debe.
 *
 * Es de coordinación por lo mismo que lo eran los canales: es la lista completa
 * de a dónde va el dinero del portal, junta y en una pantalla.
 */
export default async function MoneyPage() {
  const session = await currentTeam();

  if (session?.role !== "coordinacion") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl text-ink">Esta pantalla es de coordinación</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          A dónde va el dinero de cada municipio y de cada familia lo registra quien coordina.
          Tu cuenta documenta municipios: puedes escribir todo lo demás de sus fichas.
        </p>
      </div>
    );
  }

  const destinations = await getMoneyDestinations();
  const live = destinations.filter((row) => row.live);
  const draft = destinations.filter((row) => !row.live);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className={eyebrow}>Panel del equipo</p>
      <h1 className="mt-1 font-display text-3xl text-ink">A dónde va el dinero</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Todos los destinos que el portal publica hoy, juntos. No se cambian aquí: cada uno se
        edita en la ficha de quien lo recibe, y el enlace de cada fila lleva allí.
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Un caso sin canal propio <span className="text-ink">no hereda ninguno</span>: ni el de su
        municipio ni el de su fundación. Si no está en esta lista, su ficha dice que todavía no
        hay a dónde enviarle.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Se ven en el portal</h2>
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
          <h2 className="font-display text-2xl text-ink">Escritos, pero todavía sin salir</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
            Están guardados y no los ve nadie: su municipio está sin publicar, o el caso sigue en
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
        <h2 className="font-display text-2xl text-ink">Quién puede cambiarlos</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Solo coordinación, y está comprobado en tres capas que no dependen entre sí: la ficha
          no ofrece el campo, la Server Action lo rechaza, y un disparador de la base de datos
          para el cambio aunque la llamada llegue desde fuera de la web. Esa tercera capa es la
          que importa: quien documenta un municipio <span className="text-ink">sí</span> puede
          escribir el resto del caso, así que sin ella cambiar el canal sería una edición más de
          la ficha.
        </p>
      </section>
    </div>
  );
}

const LEVEL_LABEL: Record<MoneyDestination["level"], string> = {
  municipio: "Municipio",
  caso: "Caso",
  fundacion: "Fundación",
};

/**
 * El destino escrito entero y en monoespaciada, no recortado.
 *
 * Esta pantalla existe para comparar lo que está publicado con lo que se acordó,
 * y eso se hace carácter a carácter: una llave con un dígito cambiado y un enlace
 * con un dominio parecido son las dos formas que tiene esto de salir mal, y las
 * dos se leen igual de bien en letra de texto.
 */
function DestinationRow({ destination }: { destination: MoneyDestination }) {
  return (
    <li className={`${panel} p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="min-w-0 font-medium text-ink">{destination.owner}</p>
        <p className="shrink-0 text-xs text-faint">
          {LEVEL_LABEL[destination.level]} · {destination.cityName}
        </p>
      </div>

      <p className="mt-2 break-all font-mono text-[13px] leading-relaxed text-body">
        {destination.target}
      </p>

      <Link
        href={destination.href}
        className="mt-2 inline-block text-sm text-accent hover:underline"
      >
        Abrir la ficha donde se cambia
      </Link>
    </li>
  );
}
