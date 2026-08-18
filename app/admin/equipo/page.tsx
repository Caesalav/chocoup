import { removeTeamMember, saveTeamMember } from "@/app/admin/actions";
import { DangerSubmitButton, SubmitButton } from "@/components/admin/SubmitButton";
import { eyebrow, field, panel } from "@/components/ui/styles";
import { getAdminCities, getTeamDirectory } from "@/lib/admin-data";
import { TEAM_ROLES, teamRoleLabel } from "@/lib/constants";
import { currentTeam } from "@/lib/team";
import type { AdminCityRow, TeamMemberEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Quién puede tocar qué.
 *
 * La pantalla es de coordinación, y esto no es lo que la protege: la comprobación
 * de abajo es la primera de tres —la pantalla, la Server Action y las funciones
 * de la base de datos, que rechazan la llamada aunque llegue desde fuera de la
 * web—. Aquí se comprueba para no pintar una lista de correos del equipo a quien
 * no le corresponde verla.
 *
 * Invitar es escribir un correo, y se puede hacer antes de que la persona entre
 * por primera vez: hasta que entra no existe ninguna cuenta suya. Esa es la razón
 * de que la lista vaya por correo y no por usuario.
 *
 * Lo que esta pantalla NO hace es dar acceso: reparte permisos sobre un correo.
 * La cuenta y su contraseña se crean en Supabase, porque el portal entra con
 * contraseña y no tiene registro ni recuperación propios. Invitar aquí a alguien
 * que no tenga cuenta allí lo deja con permisos y sin puerta.
 */
export default async function TeamPage() {
  const session = await currentTeam();

  if (session?.role !== "coordinacion") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl text-ink">Esta pantalla es de coordinación</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Tu cuenta documenta municipios. Los permisos del equipo los reparte quien coordina; si
          necesitas un municipio más, pídelo por ahí.
        </p>
      </div>
    );
  }

  const [members, cities] = await Promise.all([getTeamDirectory(), getAdminCities()]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className={eyebrow}>Panel del equipo</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Quién documenta qué</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Quien coordina puede con todo el portal. Quien documenta sube fotos, escribe casos y
        registra necesidades <span className="text-ink">solo en los municipios que le asignes</span>
        , y no publica municipios ni toca los canales de donación.
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Puedes invitar a alguien antes de que entre por primera vez: basta su correo, y la primera
        vez que entre ya encontrará sus municipios esperando. Esto reparte permisos, no crea la
        cuenta: la contraseña se le da de alta en Supabase.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Invitar a alguien</h2>
        <form action={saveTeamMember} className={`${panel} mt-4 space-y-4 p-5`}>
          <label className="block">
            <span className={field.label}>Correo</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="off"
              className={field.input}
              placeholder="nombre@correo.com"
            />
            <span className={field.hint}>
              Tiene que ser el mismo con el que va a entrar al panel.
            </span>
          </label>

          <RoleField />
          <CityField cities={cities} />

          <SubmitButton pendingLabel="Invitando…">Invitar</SubmitButton>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">El equipo</h2>
        <p className="mt-1 text-sm text-muted">
          {members.length === 0
            ? "Todavía no hay nadie en la lista."
            : `${members.length} personas con acceso.`}
        </p>

        <ul className="mt-4 space-y-4">
          {members.map((member) => (
            <li key={member.email}>
              <MemberCard
                member={member}
                cities={cities}
                isSelf={member.email.toLowerCase() === session.email.toLowerCase()}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RoleField({ value }: { value?: string }) {
  return (
    <div>
      <span className={field.label}>Rol</span>
      <div className="mt-2 space-y-2">
        {TEAM_ROLES.map((role) => (
          <label key={role.value} className={field.checkboxRow}>
            <input
              type="radio"
              name="role"
              value={role.value}
              required
              defaultChecked={(value ?? "documentacion") === role.value}
              className={field.checkbox}
            />
            <span>
              {role.label}
              <span className="mt-0.5 block text-xs text-muted">{role.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CityField({
  cities,
  selected = [],
}: {
  cities: AdminCityRow[];
  selected?: string[];
}) {
  return (
    <div>
      <span className={field.label}>Municipios asignados</span>
      <span className={field.hint}>
        Solo cuentan para documentación: coordinación escribe en todos.
      </span>

      {cities.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Todavía no hay municipios que asignar.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {cities.map((city) => (
            <li key={city.id}>
              <label className="flex items-center gap-2 rounded-full border border-line-strong px-3.5 py-2 text-[13px] text-body">
                <input
                  type="checkbox"
                  name="cities"
                  value={city.id}
                  defaultChecked={selected.includes(city.id)}
                  className="size-4 shrink-0 accent-accent"
                />
                {city.name}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MemberCard({
  member,
  cities,
  isSelf,
}: {
  member: TeamMemberEntry;
  cities: AdminCityRow[];
  isSelf: boolean;
}) {
  const assigned = cities.filter((city) => member.cityIds.includes(city.id));

  return (
    <div className={`${panel} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium text-ink">
          {member.nombre || member.email}
          {isSelf && <span className="ml-2 text-xs text-faint">tú</span>}
        </h3>
        <span className="text-xs text-faint">{teamRoleLabel(member.role)}</span>
      </div>

      <p className="mt-0.5 text-xs text-faint">{member.email}</p>
      <p className="mt-2 text-sm text-muted">
        {member.role === "coordinacion"
          ? "Todos los municipios, publicados o no."
          : assigned.length === 0
            ? "Sin municipios asignados: puede entrar al panel y mirar, pero no escribir nada."
            : assigned.map((city) => city.name).join(" · ")}
      </p>

      <form action={saveTeamMember} className="mt-4 space-y-4 border-t border-line pt-4">
        <input type="hidden" name="email" value={member.email} />
        <RoleField value={member.role} />
        <CityField cities={cities} selected={member.cityIds} />
        <SubmitButton variant="secondary">Guardar cambios</SubmitButton>
      </form>

      {/* A quien coordina no se le ofrece quitarse a sí misma: si se va la última
          persona con permiso para repartir permisos, no hay forma de arreglarlo
          desde aquí. Las acciones y la base de datos lo rechazan igual. */}
      {!isSelf && (
        <form action={removeTeamMember} className="mt-4 border-t border-line pt-4">
          <input type="hidden" name="email" value={member.email} />
          <DangerSubmitButton
            confirmText={`¿Quitar a ${member.email} del equipo? Podrá iniciar sesión pero no verá el panel.`}
          >
            Quitar del equipo
          </DangerSubmitButton>
        </form>
      )}
    </div>
  );
}
