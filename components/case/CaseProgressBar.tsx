import Link from "next/link";
import { ProgressRing } from "@/components/case/ProgressRing";
import { formatCOP } from "@/lib/format";
import {
  firstPendingItem,
  lastPurchasedItem,
  type BudgetItem,
  type BudgetProgress,
} from "@/lib/budget";
import {
  raisedNote,
  moneyProgress,
  moneyRingLabel,
  shortCOP,
} from "@/lib/money-progress";

/**
 * La barra del presupuesto de una causa.
 *
 * Tres piezas, en el orden en que se leen, y cada una contesta una pregunta
 * distinta:
 *
 *   1. EL ANILLO. Cuánto de la meta ya está comprado. Es la cifra auditable y la
 *      única que sale como porcentaje. Por qué esa y no lo recaudado está escrito
 *      largo en lib/money-progress.ts, que es donde se decide.
 *   2. LO RECIBIDO. El dinero que ha entrado, con su procedencia en la misma
 *      frase: está fila por fila en el registro de donaciones de esta ficha.
 *      Sin cifra no hay renglón; no se escribe «$0 recaudados».
 *   3. LA PRUEBA. Una línea con la última compra, que lleva al presupuesto
 *      entero. Es el sitio de la referencia donde va «Jennifer Creelman donated
 *      $300 ›» —prueba y navegación a la vez— con lo único que aquí se puede
 *      demostrar. Quién donó, con nombre o anónimo, vive en el registro de
 *      donaciones de la misma ficha (`DonationLog`), no en esta barra.
 *
 * Con la meta a cero no se dibuja nada, igual que antes: un 0 % fingido diría que
 * no se ha hecho nada cuando lo que pasa es que todavía no se ha anotado el plan.
 */
export function CaseProgressBar({
  budget,
  compact = false,
  tone = "paper",
  items,
  itemsHref,
}: {
  budget: BudgetProgress;
  compact?: boolean;
  /** Sobre una foto de portada el texto y el anillo tienen que ser papel. */
  tone?: "paper" | "photo";
  /**
   * Los ítems del presupuesto, si quien pinta esto los tiene. De aquí salen las
   * dos frases que no se pueden sacar de los totales: la última compra y, cuando
   * no hay ninguna, lo primero que falta.
   */
  items?: BudgetItem[];
  /** A dónde lleva la línea de la prueba. Sin él, la prueba no es un enlace. */
  itemsHref?: string;
}) {
  if (budget.goal === 0) return null;

  const progress = moneyProgress(budget);
  const raised = raisedNote(progress);
  const onPhoto = tone === "photo";
  const muted = onPhoto ? "text-paper/70" : "text-faint";
  const soft = onPhoto ? "text-paper/75" : "text-muted";
  const ink = onPhoto ? "text-paper" : "text-ink";

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <ProgressRing
          percent={progress.percent}
          label={moneyRingLabel(progress)}
          tone={tone}
        />
        <div className="min-w-0">
          {/* El importe entregado en negrita y la meta en gris, que es la
              jerarquía de la referencia: lo que ha pasado pesa y el techo
              acompaña. En pesos las dos van abreviadas o la línea no cabe en una
              tarjeta de rejilla. */}
          <p className={`truncate text-[13px] ${soft}`}>
            <span className={`font-medium ${ink}`}>
              {shortCOP(progress.delivered)} entregados
            </span>{" "}
            de {shortCOP(progress.goal)}
          </p>
          {progress.raised > 0 && (
            <p className={`truncate text-[12px] ${muted}`}>
              {shortCOP(progress.raised)} recibidos
            </p>
          )}
        </div>
      </div>
    );
  }

  const lastDelivered = lastPurchasedItem(items);
  const nextUp = firstPendingItem(items);

  return (
    <div>
      <div className="flex items-center gap-4">
        <ProgressRing
          percent={progress.percent}
          label={moneyRingLabel(progress)}
          size="lg"
          tone={tone}
        />

        <div className="min-w-0 flex-1">
          {progress.state === "sin-entregar" ? (
            <p className={`text-[15px] leading-snug ${soft}`}>
              <span className={`font-medium ${ink}`}>Todavía sin comprar nada</span> de una
              meta de {shortCOP(progress.goal)}
            </p>
          ) : (
            <p className={`text-[15px] leading-snug ${soft}`}>
              <span
                className={`font-display text-[24px] leading-none tabular-nums ${ink} lg:text-[28px]`}
              >
                {formatCOP(progress.delivered)}
              </span>
              <br />
              entregados de {formatCOP(progress.goal)}
            </p>
          )}
        </div>
      </div>

      {/* El estado delicado: hay meta y no se ha comprado nada. Un anillo vacío
          con su 0 % desanima y además dice menos que esta frase, así que el hueco
          lo ocupa lo que sí se puede pedir: el primer ítem del presupuesto, con
          su precio. Es la versión honesta del «sé el primero» de la referencia
          —que aquí no se puede escribir, porque el portal no sabe si alguien ha
          aportado ya— y convierte una barra vacía en un encargo concreto. */}
      {progress.state === "sin-entregar" && nextUp && (
        <p className={`mt-3 text-[13px] leading-relaxed ${soft}`}>
          Lo primero: {nextUp.title}
          {" · "}
          <span className={`tabular-nums ${ink}`}>{formatCOP(nextUp.amount_cop)}</span>
        </p>
      )}

      {raised && <p className={`mt-3 text-[13px] leading-relaxed ${muted}`}>{raised}</p>}

      {progress.state !== "cumplida" && progress.missing > 0 && (
        <p className={`mt-1 text-[13px] ${muted}`}>
          Faltan {formatCOP(progress.missing)} para la meta
        </p>
      )}

      {progress.state === "cumplida" && (
        <p className={`mt-3 text-[13px] leading-relaxed ${muted}`}>
          El presupuesto está comprado entero.
        </p>
      )}

      {/* La prueba, y la puerta al detalle. Va con altura de mando aunque sea
          texto pequeño, y con subrayado permanente y no de `hover:`: es una línea
          sola del color de la letra pequeña que tiene encima, y en un móvil el
          `hover:` no existe. Es el mismo criterio que el renglón de procedencia
          del canal, unas líneas más abajo en la ficha.

          Va en UNA línea y recortada si no cabe, como la de la referencia. La
          versión de dos líneas dejaba el chevrón colgado a la derecha del primer
          renglón, que se lee como un fallo de maquetación; y el título entero de
          un ítem —«Bloque, cemento, tejas y madera para reconstruir la casa»— no
          es lo que hay que leer aquí, sino que hubo una compra y que se puede ir a
          verla.

          Aquí iba también la fecha. Se ha mudado a la lista, que es donde vive el
          ítem: la fecha es la prueba —la que se compara con una factura— y su
          sitio es al lado de lo comprado, no en un resumen que la recorta. No se
          va en edad relativa: la referencia escribe «6 yrs» porque la fecha de una
          donación no demuestra nada y solo tiene que sonar a movimiento; «hace
          nueve días» no se compara con ninguna factura. */}
      {lastDelivered && itemsHref && (
        <p className="mt-2">
          {/* El chevrón va en su propio hijo y fuera del recorte: dentro del
              `truncate` se lo llevaba la elipsis justo cuando más falta hace, que
              es cuando el título no cabe. */}
          <Link
            href={itemsHref}
            className={`flex max-w-full items-center gap-1 py-1 text-[13px] ${muted} hover:text-ink`}
          >
            <span className="truncate underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              Comprado: {lastDelivered.title}
            </span>
            <span aria-hidden className="shrink-0">
              ›
            </span>
          </Link>
        </p>
      )}
    </div>
  );
}
