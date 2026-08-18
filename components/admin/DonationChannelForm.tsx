import { SubmitButton } from "@/components/admin/SubmitButton";
import { field, panel } from "@/components/ui/styles";
import type { DonationColumns } from "@/lib/types";

type Props = {
  /** La Server Action del nivel que toque: municipio o caso. */
  action: (formData: FormData) => Promise<void>;
  /** La fila que se edita. */
  id: string;
  row: DonationColumns;
  /** De quién es el canal, para escribirlo en las ayudas del formulario. */
  owner: string;
};

/**
 * El formulario del canal de donación, el mismo para un municipio y para un caso.
 *
 * Va aparte del formulario grande de la ficha y con su propio botón de guardar, y
 * eso es lo que tiene que conseguir que se entienda de un vistazo: esto no es un
 * campo más de la ficha. Dentro del mismo formulario, cambiar el nombre de una
 * familia con prisa sería cambiar a dónde va su dinero sin darse cuenta, porque
 * las dos cosas se guardarían con el mismo botón.
 *
 * Y hay una razón técnica que apunta al mismo sitio: el canal solo lo puede
 * escribir coordinación, mientras que el resto de la ficha lo escribe también
 * quien documenta ese municipio. Con los campos juntos, un guardado de
 * documentación mandaría el canal vacío y el disparador de la base de datos
 * rechazaría la ficha entera.
 *
 * Dos campos y no un conmutador de formato: un `select` que decidiera cuál de los
 * dos campos vale necesitaría JavaScript para esconder el otro, y el panel se usa
 * en campo con la señal del Chocó. Con los dos escritos, la Server Action lo
 * rechaza y lo dice; con los dos vacíos, el canal se retira, que es lo primero
 * que hay que poder hacer si un destino se compromete.
 */
export function DonationChannelForm({ action, id, row, owner }: Props) {
  return (
    <form action={action} className={`${panel} space-y-4 p-5`}>
      <input type="hidden" name="id" value={id} />

      <label className="block">
        <span className={field.label}>La llave de transferencia</span>
        <input
          name="donation_key"
          defaultValue={row.donation_key}
          className={`${field.input} font-mono`}
          placeholder="@ejemplo"
          autoComplete="off"
          spellCheck={false}
        />
        <span className={field.hint}>
          Lo que se teclea en la app del banco, sin espacios. Se guarda literal: no se le añade
          nada ni se le corrige nada, porque cualquier arreglo automático sobre un destino de
          dinero sería un destino distinto.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>…o el enlace de recaudación</span>
        <input
          name="donation_url"
          type="url"
          inputMode="url"
          defaultValue={row.donation_url}
          className={field.input}
          placeholder="https://…"
        />
        <span className={field.hint}>
          Una Vaki o la página donde recauda. Uno de estos tres campos, nunca dos: con dos
          destinos puestos no habría forma de saber cuál recibe.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>…o el número de contacto</span>
        <input
          name="donation_phone"
          type="tel"
          inputMode="tel"
          defaultValue={row.donation_phone}
          className={`${field.input} font-mono`}
          placeholder="314 591 5701"
          autoComplete="off"
        />
        <span className={field.hint}>
          Si no hay llave ni enlace, el número al que se llama o se escribe para coordinar
          cualquier donación directa. Sale en «Enviar dinero» de la ficha.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>En qué app se usa la llave</span>
        <input
          name="donation_app"
          defaultValue={row.donation_app}
          className={field.input}
          placeholder="Bre-B, Nequi, Daviplata…"
          autoComplete="off"
        />
        <span className={field.hint}>
          Sale al lado de la llave y dentro de los pasos. Vacío no rompe nada: el portal dice
          entonces «tu app de banco o billetera», que es cierto pero hace dudar. Ponlo.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>A nombre de quién aparece</span>
        <input
          name="donation_holder"
          defaultValue={row.donation_holder}
          className={field.input}
          placeholder="El nombre que muestra la app al confirmar"
          autoComplete="off"
        />
        <span className={field.hint}>
          El portal le pide a quien dona que compruebe este nombre antes de confirmar. Es lo
          único con lo que puede darse cuenta de que la llave ha sido cambiada por otra, así que
          tiene que estar escrito exactamente como lo muestra la app. Si no lo sabes con
          seguridad, déjalo vacío antes que poner uno aproximado: un nombre que no coincide
          enseña a ignorar la comprobación.
        </span>
      </label>

      <p className="text-xs leading-relaxed text-faint">
        Con los tres campos de destino vacíos, {owner} se queda sin canal y su ficha lo dice con
        esas palabras. Es lo primero que hay que hacer si un destino se compromete: no hace
        falta tener a mano el siguiente.
      </p>

      <SubmitButton>Guardar el canal</SubmitButton>
    </form>
  );
}
