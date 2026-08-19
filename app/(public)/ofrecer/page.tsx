import Link from "next/link";
import type { Metadata } from "next";
import { OfferForm } from "./OfferForm";
import { OFFER_TO_A_CASE_HEADLINE } from "@/components/cards/OfferRow";
import { ContributionCounter } from "@/components/offers/ContributionCounter";
import { UpdatesSignup } from "@/components/offers/UpdatesSignup";
import { CategoryChip } from "@/components/ui/Chip";
import { card } from "@/components/ui/styles";
import { getContributionTally, getOfferTarget } from "@/lib/data";
import { formatDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofrecer un recurso",
  description:
    "Si puedes donar o conseguir un recurso concreto para el Chocó, déjanos el contacto y lo cruzamos con la necesidad de la zona o de la familia.",
};

type Props = {
  searchParams: Promise<{
    need?: string;
    case?: string;
    city?: string;
    completa?: string;
    avisos?: string;
  }>;
};

/**
 * A dónde vuelve el formulario de avisos, reconstruido con los mismos parámetros
 * con los que se abrió esta página.
 *
 * Se rehace aquí en vez de leer la dirección del navegador porque esto se pinta en
 * el servidor y porque el destino tiene que ser exacto: quien está ofreciendo algo
 * para una familia concreta llegó con `?case=…`, y perder ese parámetro al dejar un
 * correo le cambiaría el formulario debajo de las manos.
 *
 * `avisos` se queda fuera a propósito: es la respuesta de la vez anterior y
 * arrastrarla dejaría el aviso pegado a la dirección para siempre.
 */
function returnPath(params: { need?: string; case?: string; city?: string; completa?: string }) {
  const query = new URLSearchParams();
  for (const key of ["need", "case", "city", "completa"] as const) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  const search = query.toString();
  return search ? `/ofrecer?${search}` : "/ofrecer";
}

function parseSignupState(value: string | undefined): "recibido" | "correo" | null {
  if (value === "recibido") return "recibido";
  if (value === "correo") return "correo";
  return null;
}

export default async function OfferPage({ searchParams }: Props) {
  const params = await searchParams;
  const [target, tally] = await Promise.all([
    getOfferTarget(params),
    getContributionTally(),
  ]);

  // Sin flecha de volver: /ofrecer es una de las cuatro pestañas de la barra
  // inferior, y una pestaña no vuelve a ningún sitio.
  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-6 sm:px-8 lg:pb-20 lg:pt-14">
      <p className="text-[13px] text-faint">Ofrecer un recurso</p>
      <h1 className="mt-1.5 font-display text-[28px] leading-tight text-ink lg:text-[38px]">
        {target?.completes
          ? "Puedo completar esto"
          : target?.needTitle
            ? "Puedo aportar esto"
            : target?.caseName
              ? `Puedo ayudar a ${target.caseName}`
              : "Quiero ayudar"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        {target?.completes
          ? "Son tres preguntas cortas. No publicamos el contacto de quien ofreció aquello, ni vamos a publicar el tuyo, así que las dos ofertas se juntan por aquí: el equipo recibe la tuya al lado de la suya y las cruza."
          : "Son tres preguntas cortas y no hace falta crear una cuenta. Sirve igual si no eres tú quien dona, sino alguien que conoces."}
      </p>

      {/* El contador va antes del formulario y no al final: contesta lo que se
          piensa al llegar —si esto lo usa alguien— y esa duda se tiene antes de
          escribir, no después. */}
      <ContributionCounter tally={tally} />

      {/* El enlace que le da sentido al muro de lo prometido, y por eso está
          antes del formulario y no debajo: lo que más falta no siempre es una
          cosa más, sino la pieza que completa una promesa a medias —el transporte
          de unas tejas, un cupo en un camión que sube vacío—. No se enseña cuando
          se viene justo de allí. */}
      {!target?.completes && (
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          Antes de ofrecer, mira{" "}
          <Link href="/ofrecido" className="text-accent hover:underline">
            qué hay ya prometido
          </Link>
          : puede que lo que falte sea completar algo que alguien ya ofreció.
        </p>
      )}

      {/* Completar la oferta de otro tiene su propia tarjeta y no un caso más de
          la de abajo: esa dice a quién va dirigido lo que ofreces, y esta dice a
          qué promesa te estás sumando. Todo lo que se pinta aquí sale de
          `public.offer_log`, que es la vista sin contacto: en esta página no hay
          forma de enseñar el teléfono de quien ofreció aquello, porque no llega. */}
      {target?.completes && (
        <div className={`${card} mt-6 p-4`}>
          <p className="text-[12px] text-accent-strong">Vas a completar esta oferta</p>
          {/* El mismo respaldo que la fila de /ofrecido, y de ahí importado: la
              vista no publica el texto de una oferta dirigida a una familia
              (0012), así que aquí llega nulo igual que allí. Sin esto la tarjeta
              enseñaba una pastilla de categoría suelta encima de la fecha, que se
              lee como un dato que se perdió al abrir la página —y peor aquí que
              en la fila, porque este es el sitio donde hay que reconocer lo que
              se acaba de pulsar. Con las tejas de Istmina, que es hoy una de las
              tres promesas del muro, era el caso más probable de todos. */}
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <span className="font-display text-[18px] leading-tight text-ink">
              {target.completes.resource ?? OFFER_TO_A_CASE_HEADLINE}
            </span>
            <CategoryChip category={target.completes.category} />
          </div>
          <p className="mt-1.5 text-[13px] text-muted">
            Ofrecida el {formatDay(target.completes.offered_on)}
            {target.cityName && (
              <>
                {" · "}
                {target.citySlug ? (
                  <Link href={`/ciudades/${target.citySlug}`} className="hover:underline">
                    {target.cityName}
                  </Link>
                ) : (
                  target.cityName
                )}
              </>
            )}
            {target.needTitle && <> · Para «{target.needTitle}»</>}
          </p>
          {target.completes.state === "sin_confirmar" && (
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Sigue sin confirmar: alguien la ofreció y el equipo todavía no ha hablado con esa
              persona.
            </p>
          )}
        </div>
      )}

      {!target?.completes && target && (target.needTitle || target.caseName || target.cityName) && (
        <div className={`${card} mt-6 p-4`}>
          <p className="text-[12px] text-accent-strong">Estás respondiendo a</p>
          {target.needTitle && (
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className="font-display text-[18px] leading-tight text-ink">
                {target.needTitle}
              </span>
              {target.needCategory && <CategoryChip category={target.needCategory} />}
            </div>
          )}
          <p className="mt-1.5 text-[13px] text-muted">
            {target.caseName && <span>Caso de {target.caseName}</span>}
            {target.caseName && target.cityName && " · "}
            {target.cityName && (
              <>
                {target.citySlug ? (
                  <Link href={`/ciudades/${target.citySlug}`} className="hover:underline">
                    {target.cityName}
                  </Link>
                ) : (
                  target.cityName
                )}
              </>
            )}
          </p>
        </div>
      )}

      <OfferForm target={target} />

      <UpdatesSignup from={returnPath(params)} state={parseSignupState(params.avisos)} />
    </div>
  );
}
