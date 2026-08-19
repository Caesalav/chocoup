import { MercadoPagoCheckout } from "@/components/donations/MercadoPagoCheckout";
import { blockDark } from "@/components/ui/styles";

/**
 * El gesto de donar sin elegir causa: bloque de selva, cintas, el valor y
 * Donar. Es del registro abierto —esta página invita—, no de la ficha de
 * una persona.
 */
export function GeneralFundHero() {
  return (
    <section className={`${blockDark} p-5 sm:p-8`} aria-labelledby="fondo-general">
      <h2
        id="fondo-general"
        className="font-display text-[26px] leading-tight text-luz lg:text-[34px]"
      >
        Donar al fondo
      </h2>
      <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-luz/85 lg:text-[17px]">
        El equipo lo reparte entre las causas según la necesidad y la urgencia.
        No hace falta elegir una familia.
      </p>
      <div className="mt-6 max-w-md rounded-2xl bg-panel-high p-5 text-ink">
        <MercadoPagoCheckout heading="Donación al fondo general" showHeading={false} />
      </div>
    </section>
  );
}
