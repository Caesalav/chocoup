import Link from "next/link";
import { CampaignFocusForm } from "@/components/admin/CampaignFocusForm";
import { cardLink, eyebrow, panel } from "@/components/ui/styles";
import {
  getAdminCases,
  getAdminCities,
  getFeedback,
  getMoneyDestinations,
  getSupportOffers,
} from "@/lib/admin-data";
import { ADMIN_SECTIONS, ADMIN_UTILITIES, MONEY_REVIEW_PATH } from "@/lib/admin-sections";
import { teamRoleLabel } from "@/lib/constants";
import { getCampaignFocusRow } from "@/lib/data";
import { plural } from "@/lib/format";
import { canWriteCity, currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

/**
 * La puerta: una sola, y con lo que hay pendiente en cada sección.
 *
 * Antes esta pantalla era «Panel» —una de cinco entradas, con la lista de
 * municipios dentro y llamándose igual que el panel entero—. Ahora es lo único
 * por donde se entra, y el reparto de las tres secciones está explicado una vez
 * en lib/admin-sections.ts.
 *
 * LO QUE LA HACE UNA PUERTA Y NO UN MENÚ SON LOS NÚMEROS. Un índice de tres
 * enlaces con su frase debajo no ahorra nada: quien abre esto en terreno no tiene
 * la duda de cómo se llaman las secciones, tiene la de por dónde empezar hoy, y
 * eso solo lo contesta saber que hay tres ofertas sin revisar y dos causas sin
 * publicar. Un menú obligaría a entrar en las tres para averiguarlo, con la señal
 * del Chocó y una recarga por sección.
 *
 * El recordatorio de cómo documentar un pueblo ya no vive aquí: Ciudades es
 * crear y situar, y los casos se abren en su sección.
 */
export default async function AdminHomePage() {
  const [team, cities, cases, supportOffers, inbox, focus] = await Promise.all([
    currentTeam(),
    getAdminCities(),
    getAdminCases(),
    getSupportOffers(),
    getFeedback(),
    getCampaignFocusRow(),
  ]);

  const isCoordination = team?.role === "coordinacion";

  // Los destinos solo se piden para coordinación, que es la única que puede abrir
  // esa pantalla: pedirlos siempre sería recorrer todas las causas del portal para
  // un número que la mitad del equipo no va a ver.
  //
  // Se cuentan solo los que se ven en el portal, que es lo mismo que cuenta la
  // pantalla del repaso: son los que pueden estar recibiendo dinero de alguien
  // ahora mismo, y dos cifras distintas del mismo día en dos pantallas del mismo
  // panel es el fallo que lib/needs.ts explica largo.
  const liveDestinations = isCoordination
    ? (await getMoneyDestinations()).filter((row) => row.live)
    : [];
  const staleChannels = liveDestinations.filter((row) => row.check?.stale).length;
  const uncheckedLive = liveDestinations.filter((row) => !row.check).length;

  const draftCities = cities.filter((city) => !city.published).length;
  const draftCases = cases.filter((row) => !row.published).length;
  const noConsent = cases.filter((row) => !row.consent).length;
  const noProgress = cases.filter((row) => row.lastUpdateOn === null).length;
  const mine = cities.filter((city) => canWriteCity(team, city.id)).length;

  /**
   * Qué hay esperando en cada sección, con la palabra de esa sección.
   *
   * Va por clave y no en el orden del recorrido para que añadir una cuarta sección
   * a `ADMIN_SECTIONS` no obligue a acordarse de esta lista: sin su entrada, la
   * tarjeta sale sin números en vez de salir descolocada.
   */
  const waiting: Record<
    string,
    { count: number; one: string; many: string; calm: string; note: string | null }
  > = {
    ciudades: {
      count: draftCities,
      one: "municipio sin publicar",
      many: "municipios sin publicar",
      calm:
        cities.length === 0
          ? "Todavía no hay ningún municipio"
          : `${plural(cities.length, "municipio", "municipios")}, y todos publicados`,
      note: cities.length > 0 ? `${plural(cities.length, "municipio", "municipios")} en total` : null,
    },
    casos: {
      count: draftCases,
      one: "causa sin publicar",
      many: "causas sin publicar",
      calm:
        cases.length === 0
          ? "Todavía no hay ninguna causa"
          : `${plural(cases.length, "causa", "causas")}, y todas publicadas`,
      // El segundo renglón es el motivo por el que existe la sección: la causa que
      // lleva más tiempo sin un avance es la que hay que ir a ver.
      note:
        noProgress > 0
          ? plural(
              noProgress,
              "causa sin ningún avance escrito",
              "causas sin ningún avance escrito",
            )
          : noConsent > 0
            ? plural(noConsent, "causa sin consentimiento", "causas sin consentimiento")
            : null,
    },
    recursos: {
      count: supportOffers.length,
      one: "oferta recibida",
      many: "ofertas recibidas",
      calm: "Todavía no ha llegado ninguna",
      note: supportOffers.length > 0 ? "Voluntarios, profesiones y recursos" : null,
    },
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
      <p className={eyebrow}>Panel del equipo</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Qué hay que hacer hoy</h1>
      {team && (
        // El rol, escrito donde alguien lo va a leer. Explica por adelantado por
        // qué faltan botones —quien documenta no crea municipios ni ve el repaso
        // del dinero— y sin decirlo en alguna parte eso se lee como una avería. En
        // la barra solo cabe a partir de pantalla grande.
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Entras como <span className="text-ink">{teamRoleLabel(team.role)}</span>
          {isCoordination
            ? ": puedes escribir en todo el portal."
            : mine === 0
              ? ": todavía no tienes ningún municipio asignado, así que puedes leerlo todo y escribir en ninguno. Pídeselo a coordinación."
              : `: escribes en ${plural(mine, "municipio", "municipios")} y lees el resto.`}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ADMIN_SECTIONS.map((section) => {
          const status = waiting[section.key];
          return (
            <Link
              key={section.key}
              href={section.href}
              className={`${cardLink} flex h-full flex-col p-5`}
            >
              <h2 className="flex items-center gap-2 font-display text-xl leading-tight text-ink">
                <section.Icon className="size-5 shrink-0 text-accent" />
                {section.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{section.blurb}</p>

              {/* Los números al final de la tarjeta y anclados abajo con `mt-auto`:
                  los tres títulos miden distinto —el de la tercera son tres
                  renglones— y con alturas naturales las tres cifras quedarían en
                  escalera y habría que buscarlas una por una. */}
              <div className="mt-auto pt-4">
                {status && status.count > 0 ? (
                  <p className="flex items-baseline gap-2">
                    <span className="rounded-full bg-need-mid-soft px-2 py-0.5 text-[13px] font-medium tabular-nums text-need-mid-strong">
                      {status.count}
                    </span>
                    <span className="text-[13px] leading-snug text-ink">
                      {status.count === 1 ? status.one : status.many}
                    </span>
                  </p>
                ) : (
                  <p className="text-[13px] text-faint">{status?.calm ?? "Abrir"}</p>
                )}
                {status?.note && (
                  <p className="mt-1 text-xs leading-snug text-faint">{status.note}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* El repaso del dinero cuelga de Casos y tiene su propia pantalla, pero su
          aviso se lee aquí: un destino que lleva cuatro meses sin comprobarse no
          avisa por su cuenta y nadie abre esa pantalla sin un motivo. Solo aparece
          si hay algo que decir, y solo para quien puede entrar. */}
      {isCoordination && (staleChannels > 0 || uncheckedLive > 0) && (
        <Link
          href={MONEY_REVIEW_PATH}
          className={`${panel} mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-4 transition-colors hover:border-line-strong`}
        >
          <div className="min-w-0">
            <p className="font-medium text-ink">
              {staleChannels > 0
                ? plural(
                    staleChannels,
                    "destino de dinero con la comprobación vieja",
                    "destinos de dinero con la comprobación vieja",
                  )
                : plural(
                    uncheckedLive,
                    "destino publicado sin comprobar nunca",
                    "destinos publicados sin comprobar nunca",
                  )}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Comprobar es llamar al número, o mandar mil pesos a la llave y mirar qué nombre sale.
            </p>
          </div>
          <span className="smallcaps shrink-0 text-[15px] text-accent">Repasar</span>
        </Link>
      )}

      {/* Las dos que no son ninguna de las tres. Van juntas, aparte y con menos
          peso: son las pantallas de las que uno se acuerda una vez al mes. Por qué
          no caben dentro de ninguna sección está escrito en lib/admin-sections.ts
          —Sugerencias llega de fuera, como los recursos, y ahí acaba el parecido:
          no hay nada que verificar, aceptar ni negar—. */}
      <section className="mt-10 border-t border-line pt-5">
        <p className={eyebrow}>Lo demás</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {ADMIN_UTILITIES.map((utility) => {
            if (utility.coordinationOnly && !isCoordination) return null;
            const count = utility.href === "/admin/sugerencias" ? inbox.length : 0;
            return (
              <li key={utility.href}>
                <Link
                  href={utility.href}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-panel-high px-4 text-sm text-body transition-colors hover:border-ink/40 hover:text-ink"
                >
                  {utility.label}
                  {count > 0 && (
                    <span className="rounded-full bg-need-mid-soft px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-need-mid-strong">
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* El foco del momento se queda en la puerta, y fue lo único que no cabía
          limpiamente en ninguna parte. No es una cuarta sección: es un recado que
          señala a la vez un municipio y una causa, así que ni Ciudades ni Casos lo
          admiten sin mentir sobre a quién pertenece —un formulario en la ficha de
          Quibdó que decide qué destaca la portada de una familia estaría en el
          pueblo equivocado—. Y no es una utilidad: se cambia cada semana, no una
          vez al mes. Va al final para no pesar sobre los números de arriba, que
          son lo que se viene a leer. */}
      {isCoordination && (
        <CampaignFocusForm
          focus={focus}
          cities={cities
            .filter((city) => city.published)
            .map((city) => ({ id: city.id, name: city.name }))}
          // Solo las causas que el público puede ver: un recado que señala una
          // causa en borrador dejaría la portada apuntando a una página que no
          // existe todavía. Se filtra con las tres condiciones de la cascada, las
          // mismas que decide `moneyDestinationsOf` para saber si un destino está
          // vivo.
          cases={cases
            .filter((row) => row.published && row.consent && row.cityPublished)
            .map((row) => ({
              id: row.id,
              display_name: row.displayName,
              city_id: row.cityId,
            }))}
        />
      )}
    </div>
  );
}
