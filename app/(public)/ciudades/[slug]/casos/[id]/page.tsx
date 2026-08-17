import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NeedsList } from "@/components/NeedsList";
import { PhotoGrid } from "@/components/PhotoGrid";
import { DraftChip } from "@/components/ui/Chip";
import { button, panel } from "@/components/ui/styles";
import { getCasePage } from "@/lib/data";
import { excerpt, externalUrl, formatDate, plural, whatsappLink } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await getCasePage(slug, id);
  if (!data) return { title: "Caso no encontrado" };
  return {
    title: `${data.caseRecord.display_name} · ${data.city.name}`,
    description: data.caseRecord.story ? excerpt(data.caseRecord.story, 155) : undefined,
  };
}

export default async function CasePage({ params }: Props) {
  const { slug, id } = await params;
  const data = await getCasePage(slug, id);
  if (!data) notFound();

  const { city, caseRecord, photos, needs, foundation } = data;
  const openNeeds = needs.filter((need) => need.status !== "cubierta").length;

  // El dinero para una familia no se expone como un número personal: se entrega a
  // través de la fundación madre, que ya rinde cuentas en el municipio. El enlace
  // es su canal oficial y el WhatsApp lleva el nombre de la familia como referencia.
  const donate = foundation ? externalUrl(foundation.donation_url) : "";
  const moneyWhatsapp = foundation
    ? whatsappLink(
        foundation.whatsapp,
        `Hola, quiero enviar un aporte económico para ${caseRecord.display_name} en ${city.name}.`,
      )
    : "";
  const canSendMoney = Boolean(foundation && (donate || moneyWhatsapp));

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-28 sm:px-8">
      <Link
        href={`/ciudades/${city.slug}`}
        className="smallcaps inline-flex items-center gap-2 text-[15px] text-muted transition-colors hover:text-ink"
      >
        <span className="text-amber">←</span> {city.name}
      </Link>

      <header className="mt-6 border-b border-line pb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">
          Caso documentado en {city.name}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
          {caseRecord.display_name}
        </h1>
        {caseRecord.household && (
          <p className="mt-3 text-[15px] text-body">{caseRecord.household}</p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.12em] text-faint">
          <span>Actualizado {formatDate(caseRecord.updated_at)}</span>
          {openNeeds > 0 && (
            <span className="flex items-center gap-2 text-amber">
              <span className="size-1.5 rounded-full bg-amber" />
              {plural(openNeeds, "necesidad abierta", "necesidades abiertas")}
            </span>
          )}
          {!caseRecord.published && <DraftChip label="Sin publicar" />}
        </div>
      </header>

      {photos.length > 0 && (
        <div className="mt-10">
          <PhotoGrid photos={photos} featureFirst />
        </div>
      )}

      {caseRecord.story && (
        <div className="mt-12 max-w-prose space-y-5 text-[17px] leading-[1.75] text-body">
          {caseRecord.story.split(/\n\s*\n/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      <section className="mt-16">
        <h2 className="font-display text-3xl leading-tight text-ink">
          Qué necesita
          <sup className="ml-1.5 align-super text-[0.42em] font-normal text-muted">
            ({needs.length})
          </sup>
        </h2>
        <div className="mt-6">
          <NeedsList
            needs={needs}
            emptyLabel="Todavía no hemos registrado necesidades concretas de este caso."
          />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl leading-tight text-ink">Cómo ayudar</h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted">
          Dos formas de aportar a {caseRecord.display_name}, y las dos pasan por el equipo y la
          fundación de {city.name}.
        </p>

        <div className={`mt-6 grid gap-4 ${canSendMoney ? "sm:grid-cols-2" : ""}`}>
          {foundation && (donate || moneyWhatsapp) && (
            <div className={`${panel} flex flex-col p-6`}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-amber">Enviar dinero</p>
              <h3 className="mt-2 font-display text-2xl leading-tight text-ink">Dinero para la familia</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                Se entrega a través de {foundation.name}, que lo hace llegar a {caseRecord.display_name}.
                Al escribir por WhatsApp ya va dicho que es para esta familia, así queda constancia
                del aporte y no hace falta el número personal de nadie.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                {donate && (
                  <a
                    href={donate}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`${button.primary} w-full`}
                  >
                    Donar dinero
                  </a>
                )}
                {moneyWhatsapp && (
                  <a
                    href={moneyWhatsapp}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`${donate ? button.secondary : button.primary} w-full`}
                  >
                    Coordinar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          <div className={`${panel} flex flex-col p-6`}>
            <p className="text-[10px] uppercase tracking-[0.18em] text-teal-light">
              Ofrecer un recurso
            </p>
            <h3 className="mt-2 font-display text-2xl leading-tight text-ink">
              Dar algo que necesita
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              Si puedes aportar algo de la lista de arriba —o conoces a quien pueda—, déjanos el
              contacto y lo cruzamos con la necesidad. No hace falta crear una cuenta.
            </p>
            <Link
              href={`/ofrecer?case=${caseRecord.id}`}
              className={`${canSendMoney ? button.secondary : button.primary} mt-5 w-full`}
            >
              Ofrecer un recurso
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
