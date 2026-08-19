import { today } from "@/app/admin/today";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { field, panel } from "@/components/ui/styles";
import type { DonationColumns } from "@/lib/types";

type Props = {
  /** La Server Action del nivel que toque: un caso o el canal general. */
  action: (formData: FormData) => Promise<void>;
  /** La fila que se edita. El canal general no lo lleva: hay una sola. */
  id?: string;
  row: DonationColumns;
  /** De quién es el canal, para escribirlo en las ayudas del formulario. */
  owner: string;
  /** Qué se queda sin destino al vaciar los tres campos. */
  emptyWarning?: string;
};

/**
 * El formulario del canal de donación, el mismo para un caso y para el general.
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
 * Tres campos y no un conmutador de formato: un `select` que decidiera cuál de
 * los tres vale necesitaría JavaScript para esconder los otros, y el panel se usa
 * en campo con la señal del Chocó. Con dos escritos, la Server Action lo rechaza
 * y lo dice; con los tres vacíos, el canal se retira, que es lo primero que hay
 * que poder hacer si un destino se compromete.
 *
 * LA FECHA DE COMPROBACIÓN VA AQUÍ DENTRO Y NO EN LA FICHA (0016). Es el mismo
 * razonamiento por el que el canal salió del formulario grande, aplicado un nivel
 * más abajo: comprobar es un acto sobre un destino concreto, así que la fecha
 * pertenece al destino y no a la persona. Y porque devolver los seis campos juntos
 * es lo único que impide el fallo al revés —una fecha que llegara vacía donde
 * había una borraría la comprobación cada vez que alguien tocara el titular—.
 */
export function DonationChannelForm({ action, id, row, owner, emptyWarning }: Props) {
  return (
    <form action={action} className={`${panel} space-y-4 p-5`}>
      {id && <input type="hidden" name="id" value={id} />}

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

      {/* La comprobación va al final y separada de los cinco campos del destino,
          porque no describe el destino: describe nuestro trabajo sobre él. Es la
          diferencia entre «editado» y «comprobado», que es lo único que el portal
          puede afirmar con honestidad sobre a dónde va el dinero —no hay ninguna
          garantía que dar, porque el dinero no pasa por aquí—. */}
      <label className="block border-t border-line pt-4">
        <span className={field.label}>¿Qué día lo comprobaste?</span>
        <input
          type="date"
          name="donation_verified_on"
          // Una comprobación es algo que ya ocurrió. La acción y el disparador
          // `guard_channel_verification` (0016) rechazan el futuro; esto es para no
          // ofrecerlo. El día se lee del reloj de Colombia, igual que la acción.
          max={today()}
          defaultValue={row.donation_verified_on ?? ""}
          className={field.input}
        />
        <span className={field.hint}>
          Comprobar es llamar al número, o mandar mil pesos a la llave y mirar qué nombre sale.
          Escribe el día en que lo hiciste, no el día en que se escribió el canal: «editado» no es
          «comprobado», y esta fecha es la que la ficha pública le enseña a quien va a donar.
          Vacío es lo normal y no dice nada; a los dos meses el portal deja de presentarlo como
          reciente.
        </span>
        <span className={field.hint}>
          <span className="text-body">Si cambias el destino, esta fecha se borra sola</span> a menos
          que escribas una nueva en el mismo guardado. Lo hace la base de datos, y es lo que
          impide que quede «Comprobado el 3 de agosto» debajo de una llave que se cambió el 12 de
          septiembre.
        </span>
      </label>

      <p className="text-xs leading-relaxed text-faint">
        {emptyWarning ??
          `Con los tres campos de destino vacíos, ${owner} se queda sin canal y su ficha lo dice con esas palabras.`}{" "}
        Es lo primero que hay que hacer si un destino se compromete: no hace falta tener a mano
        el siguiente.
      </p>

      <SubmitButton>Guardar el canal</SubmitButton>
    </form>
  );
}
