import Link from "next/link";
import type { Metadata } from "next";
import { OfferForm } from "./OfferForm";
import { CategoryChip } from "@/components/ui/Chip";
import { card } from "@/components/ui/styles";
import { getOfferTarget } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofrecer un recurso",
  description:
    "Si puedes donar o conseguir un recurso concreto para el Chocó, déjanos el contacto y lo cruzamos con la necesidad de la zona o de la familia.",
};

type Props = {
  searchParams: Promise<{ need?: string; case?: string; city?: string }>;
};

export default async function OfferPage({ searchParams }: Props) {
  const params = await searchParams;
  const target = await getOfferTarget(params);

  // Sin flecha de volver: /ofrecer es una de las cuatro pestañas de la barra
  // inferior, y una pestaña no vuelve a ningún sitio.
  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-6 sm:px-8 lg:pb-20 lg:pt-14">
      <p className="text-[13px] text-faint">Ofrecer un recurso</p>
      <h1 className="mt-1.5 font-display text-[28px] leading-tight text-ink lg:text-[38px]">
        {target?.needTitle
          ? "Puedo aportar esto"
          : target?.caseName
            ? `Puedo ayudar a ${target.caseName}`
            : "Quiero ayudar"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Son tres preguntas cortas y no hace falta crear una cuenta. Sirve igual si no eres tú quien
        dona, sino alguien que conoces.
      </p>

      {target && (target.needTitle || target.caseName || target.cityName) && (
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
    </div>
  );
}
