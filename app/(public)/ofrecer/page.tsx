import Link from "next/link";
import type { Metadata } from "next";
import { OfferForm } from "./OfferForm";
import { CategoryChip } from "@/components/ui/Chip";
import { panel } from "@/components/ui/styles";
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

  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-28 sm:px-8">
      <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Ofrecer un recurso</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
        {target?.needTitle
          ? "Puedo aportar esto"
          : target?.caseName
            ? `Puedo ayudar a ${target.caseName}`
            : "Quiero ayudar"}
      </h1>
      <p className="mt-5 max-w-prose text-[17px] leading-[1.7] text-muted">
        Son tres preguntas cortas y no hace falta crear una cuenta. Sirve igual si no eres tú quien
        dona, sino alguien que conoces.
      </p>

      {target && (target.needTitle || target.caseName || target.cityName) && (
        <div className={`${panel} mt-8 p-5`}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber">Estás respondiendo a</p>
          {target.needTitle && (
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className="font-display text-xl leading-tight text-ink">
                {target.needTitle}
              </span>
              {target.needCategory && <CategoryChip category={target.needCategory} />}
            </div>
          )}
          <p className="mt-1 text-sm text-muted">
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
