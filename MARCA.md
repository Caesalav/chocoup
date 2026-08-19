# La marca de ChocóUp

Este documento es la identidad visual del portal: los colores con sus valores, el papel que
juega cada uno, cuándo el sistema habla alto y cuándo baja la voz, y las reglas que impiden
repetir fallos que ya estuvieron publicados.

Va aparte del README porque son dos cosas distintas. El README explica cómo se monta y cómo
se usa el portal, y ya tiene 65 KB; esto se consulta al maquetar una pantalla nueva. En el
README queda un resumen de una pantalla, en «Sistema visual», que apunta aquí.

La implementación está en `app/globals.css` (las fichas) y `components/ui/styles.ts` (las
recetas). Los números de contraste de este documento **no están escritos a mano**: los calcula
`node scripts/contraste.mjs` leyendo `app/globals.css`. Si cambias un valor, vuelve a pasarlo
y corrige aquí lo que salga distinto.

---

## De dónde sale

La paleta se muestreó píxel a píxel de una lámina de referencia —una marca de tienda de
plantas de interior— con `scripts/muestrear-referencia.py`. No se estimó a ojo: cinco colores
se llevan casi toda la superficie, y estos son sus valores exactos y su cobertura.

| Color | Valor | Área de la lámina | Luminancia |
| --- | --- | --- | --- |
| Blanco del campo | `#ffffff` | 44,96 % | 1,0000 |
| Verde lima vivo | `#a5ed69` | 6,84 % | 0,6959 |
| Verde bosque muy oscuro | `#0f352d` | 6,65 % | 0,0284 |
| Lavanda | `#dcc8fe` | 5,46 % | 0,6368 |
| Verde medio de las cintas | `#1ab169` | 1,81 % | 0,3268 |
| Tinta clara sobre el bosque | `#f0fee5` | — | 0,9507 |

**Lo que se abstrae es el sistema, no la marca ajena.** No hay nada aquí de su logotipo ni de
su nombre. Lo que se toma son las relaciones, que es lo que se puede reutilizar sin copiar:

- Un **campo casi vacío** —casi la mitad de la lámina es blanco— con **bloques macizos** de
  color encima. No hay ni un degradado en la referencia, y no hay ni uno aquí.
- Un **oscuro que hace de autoridad y de tinta a la vez**. El bosque está a 13,40:1 del
  blanco: sirve de fondo con letras claras y de letra sobre fondo claro. Es el que carga con
  la jerarquía.
- Un **claro vivo que es superficie y nunca texto**. El lima sobre blanco es 1,41:1. Escrito
  con él, un rótulo no existe; con tinta oscura encima es de lo más legible de la paleta.
- Un **verde medio reservado a la forma orgánica**: las cintas onduladas. Ni texto ni
  frontera, solo dibujo.
- Un **frío que hace de contrapeso** y que se lleva lo que invita a hacer algo.
- Esquinas **generosas pero no pastilla**: medidas, 23-24 px en cajas de 415×222 y 220×223,
  entre el 10 % y el 11 % del lado corto.

---

## La paleta

Los nombres van en castellano por una razón que no es de gusto: **ninguna ficha de color puede
llamarse como una utilidad de Tailwind.** Los nombres que pedía el oído —`forest`, `lime`,
`vine`, `lavender`— tienen el problema de que `lime` es una familia de color de Tailwind, así
que `--color-lime` conviviría con `bg-lime-500` y nadie sabría de dónde sale cuál. En
castellano el choque es imposible por construcción, que es la única garantía que no depende de
que alguien se acuerde. Ver más abajo, en «Las reglas», por qué esto tiene su propio apartado.

### Superficies

La escala **crece hacia el hueco**, no hacia la luz, y eso es deliberado: papel, panel y panel
alto se llevan ocho y tres niveles de 255, y por arriba el techo es el blanco. Entre esos tres
tonos no cabe señalar que una tarjeta está bajo el dedo, y este diseño es todo tarjetas. Así
que lo que se hunde tiene dos peldaños propios.

| Ficha | Valor | Papel que juega |
| --- | --- | --- |
| `land` | `#dfe5da` | El hueco más profundo: el marco de una foto que no existe, el fondo del retrato. |
| `canvas` | `#eaeee6` | Un peldaño por debajo del papel: el canal de una barra de progreso, la pastilla «Retirada». |
| `paper` | `#f4f7f2` | El campo de la página. Es el blanco de la referencia tirado hacia el verde. |
| `panel` | `#fafcf8` | La tarjeta sobria: formularios y panel del equipo. |
| `panel-high` | `#ffffff` | Blanco puro. La tarjeta que lleva una foto dentro, para que la imagen no parezca sucia. |
| `contour` | `#93a198` | El filete entre municipios del mapa. |

### Tinta

Con el matiz de la selva dentro. Un negro neutro sobre un papel que tira a verde se lee como
una mancha de otra imagen.

| Ficha | Valor | Sobre `paper` | Papel que juega |
| --- | --- | --- | --- |
| `ink` | `#0e1a15` | 16,51:1 | Titulares y el nombre de una persona. |
| `body` | `#27352f` | 11,87:1 | Texto corrido. |
| `muted` | `#475851` | 6,98:1 | Texto secundario, y el mínimo sobre superficies hundidas. |
| `faint` | `#5f6e67` | 4,97:1 | Rótulos y notas al pie. Es el peso más ligero que existe. |
| `luz` | `#f0fee5` | — | La tinta de lo que se escribe sobre `selva`: 12,77:1. |

### Verde de marca

| Ficha | Valor | Papel que juega |
| --- | --- | --- |
| `selva` | `#0f352d` | El bloque oscuro y la autoridad. Relleno del botón principal. **El único que sirve en los dos registros.** |
| `brote` | `#a5ed69` | Superficie viva, nunca texto. Baldosas de sección, botón de invitar, sello de confirmación. |
| `liana` | `#1ab169` | Solo forma orgánica: las cintas. Ni texto ni frontera. |
| `accent` | `#126a44` | El verde que sí aguanta como palabra: enlaces, aros de foco, la pastilla «Cubierta». |
| `accent-strong` | `#0d4f34` | Más peso, que en claro quiere decir más oscuro. El hover. |
| `accent-soft` | `accent` al 18 % | El relleno de la pastilla «Cubierta». El alfa está elegido, ver más abajo. |
| `lavanda` | `#dcc8fe` | El contrapeso frío: la superficie de lo que pide algo. |

Tres cosas de aquí merecen explicación, porque son las que se rompen si alguien las cambia sin
saber:

**`accent` sale de la rampa entre `selva` y `liana`, al 42 %.** No es un verde inventado: es el
punto de la línea entre el bloque oscuro y las cintas donde el color deja de ser decorativo y
empieza a poder ser un enlace. Da 6,13:1 sobre papel, frente a los 4,82:1 del verde de la
etapa anterior. Y contra `body` da 1,94:1, que es lo que hace que un enlace se vea que lo es
sin necesidad de subrayarlo.

**El botón principal es un bloque de `selva`, no de `brote`.** Tres motivos que apuntan al
mismo sitio: la tinta encima da 12,77:1 (antes 5,3:1); la frontera del botón contra el papel es
de 12,40:1, así que se recorta solo y no necesita filete; y es el único de los tres verdes que
funciona igual en la portada y en la ficha de una persona. Un botón de `brote` está bien en
`/ofrecer` y está mal debajo del retrato de alguien que perdió la casa.

**`brote`, `liana` y `lavanda` no son fronteras de nada.** Contra el papel dan 1,30:1, 2,58:1 y
1,41:1, muy por debajo del 3:1 que pide WCAG 1.4.11 para el contorno de un control. Como fondo
de una sección da igual, porque una sección no es un control. **En cuanto un bloque de esos se
pueda pulsar, lleva filete de `selva`**, que es lo que hace `button.invite`.

### La escala de necesidad

Otra familia, **derivada de la misma ley**. Tiene su propio apartado más abajo, y ahí está el
porqué de cada número.

| Ficha | Valor | Hex | Tramo |
| --- | --- | --- | --- |
| `need-blank` | `#e4e9e0` | `#e4e9e0` | Sin documentar: nadie ha llegado. |
| `need-none` | `oklch(0.62 0.156 152)` | `#19a054` | Sin casos reportados: está bien. |
| `need-low` | `oklch(0.74 0.15 74)` | `#e29a1d` | Falta poco. |
| `need-mid` | `oklch(0.58 0.157 46)` | `#c25510` | A medias. |
| `need-high` | `oklch(0.42 0.164 24)` | `#920a1b` | Prioritario. |
| `need-mid-soft` | `need-mid` al 20 % | | Relleno de la pastilla «Abierta». |
| `need-mid-strong` | `oklch(0.44 0.12 46)` | `#863806` | La tinta de esas pastillas. |
| `need-high-soft` | `need-high` al 12 % | | El lavado de un aviso de error. |

Van en `oklch()` y no en hexadecimal a propósito: es la única forma de que la ley se lea en el
archivo. Los cuatro tienen la misma estructura —L que baja, H que gira hacia el rojo, C al 95 %
de lo que el sRGB permite— y en hexadecimal eso es invisible. `need-blank` es el único en
hexadecimal, también a propósito: no es un tramo de la escala sino el gris del papel.

---

## Los dos registros, y cuándo se usa cada uno

Esto es lo más delicado de todo el sistema, así que va escrito como regla y no como criterio.

La referencia es alegre porque vende plantas de interior. Este portal publica fichas de cinco
personas identificables, con nombre, con retrato y con el consentimiento firmado, cuya casa se
cayó en un terremoto. **La misma paleta tiene que sostener las dos cosas sin partirse en dos
marcas**, y la respuesta no es tener menos color: es que el color fuerte tenga un sitio donde
le corresponde estar y un sitio donde no.

### Registro abierto

**Dónde:** portada, navegación, mapa, listados (`/municipios`, `/casos`, `/necesidades`,
`/ofrecido`, `/ayudas`), páginas de invitación (`/ofrecer`, `/sugerencias`, las de gracias) y
la landing de `/proximamente`.

**Qué se permite:** `brote` a plena potencia como superficie, bloques de `selva`, cintas de
`liana`, `lavanda` en lo que pide algo. Las tres recetas de bloque de `components/ui/styles.ts`
—`blockDark`, `blockLive`, `blockInvite`— son de aquí.

Es la voz que invita a entrar, y es la que se ve cuando alguien abre un enlace de WhatsApp.

### Registro sobrio

**Dónde:** la ficha de una persona (`/ciudades/[slug]/casos/[id]`) y las tarjetas que llevan su
cara y su nombre (`CaseRow`, `CaseBigCard`, todo `components/case/`).

**Qué se permite:** papel, la rampa de tinta, `accent` como línea y como texto, `selva` para la
acción principal, y la escala de necesidad para el estado. **Nada más.**

**Qué se prohíbe:** cintas, campos de `brote` o `liana`, `lavanda`. Ahí la foto y el nombre son
lo único que puede levantar la voz; una cinta ondulada detrás del retrato de alguien que perdió
la casa dice algo que el proyecto no quiere decir.

Un registro se define por lo que se quita: no hay recetas propias del sobrio, porque el sobrio
es `card`, `panel` y la tipografía de siempre.

### Por qué está en el `lint` y no solo aquí

Porque un criterio escrito en un documento se lo salta cualquiera con buena intención. La
portada queda bien con un bloque de brote, y de ahí a copiarlo en la ficha de un caso hay un
`cmd+C`. Nadie lo hace de mala fe y nadie lo revisa después.

El bloque final de `eslint.config.mjs` prohíbe `cintas`, `bg-brote`, `bg-liana`, `bg-lavanda`,
`border-brote`, `border-lavanda`, `text-brote`, las tres recetas de bloque y `button.invite` en
los archivos del registro sobrio, y **falla el `lint`**. Si algún día hay que romperlo, se
rompe ahí y a la vista, no en la pantalla.

Lo que la regla **no** puede comprobar es que una pantalla nueva del registro abierto se pase
de loud. Eso sigue siendo criterio, y el criterio es: **como mucho un bloque de `selva` por
pantalla**, porque dos compitiendo dejan a los dos sin ser el principal.

---

## La escala de estados es otra familia, y no se mezcla

**Verde de marca** es lo que se hace: botones, enlaces, navegación, y la pastilla de una
necesidad ya cubierta, que es la única forma de «hecho» que existe aquí.

**La escala cálida (`need-*`)** es el calor del dato: cuánto falta. Pinta los municipios del
mapa y, con los mismos tonos, las pastillas de estado. Así el chip «Urgente» de Quibdó y la
forma de Quibdó en el mapa dicen lo mismo con el mismo color.

### La regla existe porque se rompió

Cuando la urgencia se pintaba con el verde de marca, «Abierta», «Urgente» y «Cubierta» eran
tres verdes medios seguidos y la urgencia dejaba de leerse. En un portal que reparte ayuda eso
no es cosmético. Y en el otro sentido, **más verde nunca puede significar más necesidad**: se
leería como «mejor», y aquí significa lo contrario.

**Cambiar de identidad no relaja esto: lo agrava.** Con tres verdes de marca en la paleta nueva
en vez de uno, la tentación de pintar un estado «a juego» es mayor que antes y rompe lo mismo.

### Pero «familia aparte» no era «otro idioma visual»

Esta distinción costó una vuelta entera y es la razón de que exista el apartado que sigue.

En el primer paso de la identidad nueva los cuatro tonos cálidos se conservaron **con los
valores exactos que tenían**, razonando que estaban medidos y probados y que repintarlos «para
que peguen» era el movimiento que ya había fallado una vez. Cumplían la regla: no eran verdes y
la urgencia se leía. Y aun así estaban mal, porque **venían de una identidad anterior de papel
y ámbar**: al lado de `brote` y de `lavanda` se leían como invitados de otro sistema. Un peach
apagado (`#f3b591`, al 77,6 % de lo que el sRGB permite en su sitio) junto a una lavanda que está
pegada al borde de la gama (97,3 %) no es «otra familia»: es otra paleta.

Estar en otro tono no exime de estar en el mismo registro. Lo que separa a las dos familias
tiene que ser **el tono y el significado**, no el grado de acabado.

### La derivación, en OKLCH

Trabajar en hexadecimal no permite igualar registro entre tonos distintos: hay que hacerlo en
un espacio perceptual. La ley tiene tres partes y las tres son medibles.

**1. Saturación al 95 % del techo del sRGB.** Es la media medida del núcleo cromático de la
marca. Y lo que se iguala es la saturación **relativa**, no el croma:

| | L | C | H | Saturación relativa |
| --- | --- | --- | --- | --- |
| `lavanda` | 0,867 | 0,077 | 302 | 97,3 % |
| `liana` | 0,671 | 0,159 | 155 | 95,9 % |
| `accent` | 0,465 | 0,101 | 159 | 92,2 % |
| | | | | |
| `need-none` | 0,620 | 0,156 | 152 | **95,0 %** |
| `need-low` | 0,740 | 0,150 | 74 | **95,1 %** |
| `need-mid` | 0,580 | 0,157 | 46 | **95,2 %** |
| `need-high` | 0,420 | 0,164 | 24 | **94,9 %** |
| `need-mid-strong` | 0,440 | 0,120 | 46 | **94,5 %** |
| | | | | |
| `need-blank` | 0,928 | 0,013 | 131 | 7,2 % |

En croma absoluto `lavanda` (0,077) parece cuatro veces más apagada que este rojo (0,164), y en
realidad **las dos están pegadas al borde del sRGB**: el espacio de color es mucho más estrecho
en un lila claro que en un rojo oscuro. Igualar el croma a pelo entre tonos distintos es
exactamente el error que dejaba una familia de otro idioma al lado de la otra. La cifra que hay
que igualar es qué fracción de lo posible está usando cada color, y la calcula
`scripts/contraste.mjs` buscando el borde de la gama por bisección.

`brote` (73,1 %) y `selva` (76,8 %) quedan fuera de esa banda y no son un contraejemplo: son
los dos extremos de la rampa, donde el sRGB permite tanto que llegar al 95 % daría un lima
fosforito y un verde negro. El núcleo son los tres de arriba.

**2. El eje cálido se queda.** H va de 152 (verde) a 74, 46 y 24: **oro, naranja, rojo**. No se
convierten en verdes, porque más verde no puede significar más necesidad —se leería como
«mejor»— y porque el giro hacia el rojo es lo que hace que la urgencia se lea como urgencia. El
giro es además deliberado y no arrastrado: la escala anterior iba de 51 a 45 y 31, veinte
grados en total; ésta recorre cincuenta y el salto entre tramos se nota.

**3. La luminosidad la manda el mapa, no la estética.** Está en el apartado siguiente.

`need-none` se queda en L 0,620 por un motivo concreto: esquiva los dos peldaños del verde de
marca —`liana` 0,671 y `accent` 0,465— para que no sean fichas casi duplicadas.

Una nota sobre escribir `oklch()` en un portal que se abre con mala señal: **no sube el suelo de
compatibilidad**, porque ya estaba ahí. Los velos de las fotos, las líneas y las cuatro sombras
usan `oklch()` desde antes, así que un navegador que no lo entienda ya tenía el portal roto por
otro lado. Lo que sí conviene saber es que el relleno del mapa es más crítico que una sombra: si
algún día hay que bajar ese suelo, la conversión a hexadecimal es mecánica —las columnas de la
tabla de arriba tienen el hex al lado— pero **hay que dejar el `oklch()` en un comentario**, o el
próximo se queda otra vez sin poder leer de dónde salen los números.

### Los cuatro estados

| Estado | Relleno | Tinta | Contraste | Forma |
| --- | --- | --- | --- | --- |
| Urgente | `need-high` macizo | `paper` | 8,53:1 | macizo |
| Abierta | `need-mid-soft` | `need-mid-strong` | 6,07:1 | macizo |
| Parcial | filete, sin relleno | `need-mid-strong` | 7,91:1 | al aire |
| Cubierta | `accent-soft` | `accent-strong` | 7,10:1 | macizo **+ visto** |

### El alfa del 18 % está elegido, no encontrado

El `18 %` de `accent-soft` y el `20 %` de `need-mid-soft` están puestos para que los dos
lavados queden **a la misma luminancia**. El 20 % se volvió a resolver al rederivar la escala:
es el alfa del naranja nuevo que iguala la luminancia del verde lavado, y salió del cálculo, no
de retocarlo a ojo. Medido:

| Par de rellenos | En color | En gris | En deuteranopía |
| --- | --- | --- | --- |
| Abierta / Cubierta | 1,01:1 | 1,01:1 | 1,17:1 |
| **Urgente / Abierta** | **6,85:1** | **6,85:1** | **3,64:1** |
| Urgente / Cubierta | 6,82:1 | 6,82:1 | 3,11:1 |
| Abierta / Parcial | 1,30:1 | 1,30:1 | 1,19:1 |

**El salto de urgencia subió al rederivar la escala**, que es lo primero que había que
comprobar: «Urgente» contra «Abierta» pasó de 4,71:1 a 6,85:1 en color y de 2,69:1 a 3,64:1 en
deuteranopía. Si esa fila hubiera bajado, el arreglo no habría servido de nada.

Que «Abierta» y «Cubierta» sean indistinguibles por tono **es el punto**, no un descuido. El
tono no las separa, y no se pretende que lo haga: las separa **el visto de «Cubierta»**, que es
la única de las cuatro con dibujo. Y una forma sobrevive a los tres filtros, mientras que un
tono se pierde justo para quien no puede verlo.

Si alguien sube o baja ese alfa «para que se distingan mejor», lo que consigue es que se
distingan para quien ya las distinguía y sigan sin distinguirse para quien no.

La prueba renderizada —los cuatro estados en color, en gris y en deuteranopía, con los
componentes de verdad y filtros CSS de verdad— está en
`capturas-verificacion/marca/estados-color-gris-deuteranopia.png`. Cómo regenerarla, al final.

### La prueba dura no es la pastilla: es el mapa

Una pastilla lleva su palabra al lado. Los cinco tramos de esta escala **pintan municipios**:
áreas pequeñas, sin etiqueta, sobre papel. Y el mapa no las ordena —cualquier municipio puede
tocar a cualquier otro—, así que la escala no se valida mirando los tramos consecutivos sino
**los diez pares**.

Se miden dos cosas y no una. El contraste de WCAG solo ve la luminancia, así que da 1,34:1 para
un verde y un naranja que cualquiera distingue: sirve para texto sobre fondo y no para dos áreas
de color una al lado de la otra. La segunda medida es **ΔE en OKLab**, que sí ve el tono.

| Par | ΔE | Color | Gris | Deuteranopía | ΔE en gris |
| --- | --- | --- | --- | --- | --- |
| blank / none \* | 0,340 | 2,76:1 | 2,76:1 | 4,88:1 | 0,292 |
| blank / low | 0,236 | 1,92:1 | 1,92:1 | 1,32:1 | 0,195 |
| blank / mid | 0,381 | 3,70:1 | 3,70:1 | 1,99:1 | 0,364 |
| blank / high | 0,535 | 7,48:1 | 7,48:1 | 3,59:1 | 0,529 |
| none / low \* | 0,227 | 1,44:1 | 1,44:1 | 3,71:1 | 0,096 |
| none / mid | 0,253 | 1,34:1 | 1,34:1 | 2,46:1 | 0,073 |
| none / high | 0,350 | 2,71:1 | 2,71:1 | 1,36:1 | 0,238 |
| low / mid \* | 0,177 | 1,93:1 | 1,93:1 | 1,51:1 | 0,169 |
| low / high | 0,347 | 3,90:1 | 3,90:1 | 2,73:1 | 0,334 |
| mid / high \* | 0,171 | 2,02:1 | 2,02:1 | 1,81:1 | 0,165 |

\* = consecutivos en el orden de la leyenda.

Y el resultado que decide si la rederivación valió la pena, que es el **peor** de los diez pares
comparado con el peor de la escala que había:

| | ΔE | Color | Gris | Deuteranopía | ΔE en gris |
| --- | --- | --- | --- | --- | --- |
| Escala de papel y ámbar | 0,136 | 1,13:1 | 1,13:1 | 1,08:1 | 0,032 |
| **Escala derivada** | **0,171** | **1,34:1** | **1,34:1** | **1,32:1** | **0,073** |

Las cinco columnas suben. La escala nueva no es solo coherente con la paleta: **se distingue
mejor que la anterior en los tres filtros**, y el margen no es de redondeo —el peor par en gris
mejora ×2,3—.

Dos cosas que la tabla enseña y que conviene no perder:

**El peor par no es cálido, es `none / mid`** —el verde contra el naranja—. En color y en gris
se quedan a 1,34:1 porque están casi a la misma luminancia, y lo que los separa es el tono
(ΔE 0,253). Eso es sólido en deuteranopía (2,46:1, porque el verde se oscurece y el naranja no)
y **frágil en monocromía completa**, que es lo que mide la columna de gris. Se acepta a
sabiendas: la acromatopsia total es del orden de 1 entre 30.000, la deuteranopía de 1 entre 16
hombres, y la alternativa —mover el verde a otra altura— empeoraba `none / low` o lo dejaba
encima de `liana`. La escala anterior estaba en 1,13:1 en ese mismo par, así que esto es la
versión buena del problema, no una regresión.

**`low / mid` y `mid / high` son el suelo del eje cálido** (ΔE 0,177 y 0,171). Ese suelo es lo
que fija las luminosidades: el techo lo pone `need-blank` en L 0,928, que no se mueve porque
pertenece a la familia del papel, y el suelo lo pone `need-high`, que no puede subir porque
`paper` escribe encima de él y tiene que pasar AA. Entre esos dos extremos hay 0,49 de L para
repartir entre cuatro valores, y de ahí salen 0,740, 0,620, 0,580 y 0,420. **No hay sitio para
un quinto tramo cálido**, y por eso no se propone.

El mapa con la escala nueva está capturado a los tres anchos en
`capturas-verificacion/marca/mapa-escala-derivada/`.

### «Sin documentar» no es un tramo

`need-blank` tiene que leerse como **ausencia de dato** y no como el tramo más suave de la
escala, porque significa algo distinto en especie: nadie ha ido. Lo que lo saca de la escala no
es su luminosidad —está en el mismo sitio que siempre, L 0,928— sino **su croma: 0,013 contra el
0,15 de los otros cuatro**. Es el único de los cinco sin color, y esa es la señal.

Lo mismo lo sostiene por el otro lado: es el único que sigue escrito en hexadecimal, porque
pertenece a la familia neutra del papel (`paper`, `canvas`, `land`) y se retiñe con ella, no con
la escala.

### Y la palabra «cubierta» no se compara a mano

Hay una regla de ESLint, anterior a este cambio, que prohíbe `=== "cubierta"` fuera de
`lib/needs.ts`. Existe porque la ficha de Quibdó decía «0 necesidades abiertas» mientras
`/municipios` y el mapa decían diez del mismo municipio: cada pantalla se había escrito su
propio `filter`. Sigue en pie y no se ha tocado.

---

## Tipografía

Dos familias, y la elección es la misma que hace la referencia: geométrica de palo seco, con la
de titular más construida que la de texto.

| Uso | Familia | Ajustes |
| --- | --- | --- |
| Titulares, cifras, el nombre de un municipio | `--font-display` (Bricolage Grotesque) | `600`, `letter-spacing: -0.04em` |
| Texto, campos, pastillas | `--font-sans` (Outfit) | `letter-spacing: 0.01em` |

El tracking cerrado del titular es lo que hace que «ChocóUp» y un nombre de pueblo pesen como
marca. La `.smallcaps` que queda es la voz del panel del equipo y **no se usa en las pantallas
públicas**: unas mayúsculas apretadas a 11 px pesan más que la frase que acompañan, y en
`/ofrecer` se leían peor que una frase normal.

Los campos de formulario van a 16 px por debajo de `640px` de ancho, que es lo que evita que
iOS haga zoom al enfocar y pierda el encuadre. El equipo documenta desde el móvil.

---

## Radios y formas

La referencia redondea de más. Medido: 23-24 px en cajas de 415×222 y 220×223, entre el 10 % y
el 11 % del lado corto, y su icono es un cuadrado de esquina casi tan blanda como una pastilla.

Reproducirlo pieza a pieza sería repintar cada `rounded-*` del portal, así que **la escala
entera sube un peldaño desde `@theme`**: es un sitio, se lee de un vistazo y alcanza también a
las pantallas que nadie ha vuelto a tocar.

| Utilidad | Antes | Ahora | Dónde se ve |
| --- | --- | --- | --- |
| `rounded-sm` | 4 px | 6 px | |
| `rounded-md` | 6 px | 8 px | |
| `rounded-lg` | 8 px | 12 px | Campos de formulario, avisos. |
| `rounded-xl` | 12 px | 18 px | `panel`: tarjeta del equipo. |
| `rounded-2xl` | 16 px | 22 px | Baldosas de sección. |
| `rounded-3xl` | 24 px | 28 px | `card` y los tres bloques. |
| `rounded-4xl` | 32 px | 36 px | |

`rounded-full` no entra —una pastilla es una pastilla— y `rounded-xs` tampoco, que es el radio
de un filete y no de una caja.

### Las cintas

La forma orgánica del sistema: bandas anchas de `liana` que serpentean por detrás del contenido
de un bloque. Es lo que evita que un rectángulo de color macizo parezca un cuadro de
presentación. Van en `.cintas`, como imagen de fondo con un SVG incrustado —no como
pseudoelemento ni como nodo en el marcado— para que funcionen sin JavaScript y no le añadan a
un lector de pantalla nada que ignorar.

Dos condiciones, y ninguna es de gusto:

**Al 35 %, y no al 100 %.** Es el techo calculado para que el texto pueda cruzar una cinta sin
perder legibilidad: la tinta `luz` sobre una cinta maciza se quedaría en **2,66:1**, y al 35 %
está en **7,16:1**. Así la cinta puede pasar por donde quiera y no hay que acordarse de
esquivarla con el texto, que es una regla que nadie cumple. Es el mismo criterio que los velos
de las fotos: primero el peor caso, y luego la decoración.

**Cuatro bandas, no dos.** Esto lo enseñó una captura. Con dos, el `background-size: cover` de
una caja muy ancha y baja —el bloque de la portada mide 1330×80— recorta una franja horizontal
del centro de la composición, y el centro era justamente el hueco entre las dos bandas: salía
un bloque verde liso con un arañazo en una esquina. La clase tiene que servir igual en esa
franja y en el panel alto y estrecho de la landing, que es el otro extremo (640×950).

---

## Las fotos mandan

Las hace el equipo con el móvil, en campo y con la luz que haya, y a veces no hay ninguna. Esta
parte del sistema **no cambió con la identidad** y es importante que no cambie: los velos son
negro con alfa, así que no dependen de la paleta.

Los números están calculados contra **la foto imposible** —un cielo del Chocó quemado, blanco
puro— y no contra las de muestra, que son oscuras y perdonan cualquier cosa.

| Parada del velo | Resultado sobre blanco puro | Texto claro encima |
| --- | --- | --- |
| negro al 88 % | `#1f1f1f` | 15,32:1 |
| negro al 82 % | `#2e2e2e` | 12,58:1 |
| negro al 78 % | `#383838` | 10,83:1 |
| negro al 70 % | `#4d4d4d` | 7,88:1 |
| negro al 64 % | `#5c5c5c` | 6,21:1 |
| negro al 46 % | `#8a8a8a` | 3,21:1 — **solo mandos** |

**La consecuencia de diseño es que todo texto sobre foto vive en el tercio bajo del velo.** Por
encima del 55 % el degradado ya no garantiza nada; lo que sostienen las paradas de arriba es
que un mando con su propia pastilla no se pierda contra una fachada blanca, no la legibilidad
de un párrafo.

Los cuatro velos son `.veil-b`, `.veil-t`, `.veil-head` y `.veil-hero`, y los dos encuadres son
`.photo-crop` (una situación, desde el 62 %) y `.photo-portrait` (una persona, desde el 22 %,
porque en un retrato la cara está arriba). Están documentados en `app/globals.css`.

Cuando no hay foto, el hueco es dignidad y no un error: superficie hundida (`land`) con la
marca en contorno y el texto en `muted`.

---

## Contrastes medidos

Todo lo que sigue lo calcula `node scripts/contraste.mjs` leyendo `app/globals.css`. AA pide
4,5:1 para texto normal y 3:1 para texto grande y para el contorno de un control.

### Rampa de tinta sobre superficies neutras

| | `paper` | `panel` | `panel-high` | `canvas` | `land` |
| --- | --- | --- | --- | --- | --- |
| `ink` | 16,51 | 17,28 | 17,84 | 15,18 | 13,89 |
| `body` | 11,87 | 12,43 | 12,83 | 10,92 | 10,00 |
| `muted` | 6,98 | 7,31 | 7,55 | 6,42 | 5,88 |
| `faint` | 4,97 | 5,20 | 5,37 | 4,57 | **4,18** |
| `accent` | 6,13 | 6,42 | 6,62 | 5,64 | 5,16 |
| `accent-strong` | 8,89 | 9,31 | 9,61 | 8,18 | 7,49 |

### Comparado con la etapa anterior

Nada bajó. Lo que iba raspando AA subió.

| | Antes | Ahora |
| --- | --- | --- |
| `accent` sobre `paper` | 4,82:1 | **6,13:1** |
| `faint` sobre `paper` | 4,78:1 | **4,97:1** |
| `muted` sobre `paper` | 6,79:1 | 6,98:1 |
| `body` sobre `paper` | 11,22:1 | 11,87:1 |
| `ink` sobre `paper` | 16,51:1 | 16,51:1 |
| Tinta del botón principal | 5,34:1 | **12,77:1** |

Un aviso sobre el encargo: se pedía no empeorar «el acento en 4,53:1». Medido contra `paper`
con la fórmula de WCAG 2.x, el acento anterior (`#1b7a4c`) daba **4,82:1**, no 4,53:1. No sé de
dónde sale esa cifra; puede ser de otro fondo o de otra fórmula. En cualquier caso el nuevo
está por encima de las dos.

### Bloques de color

| | Contraste |
| --- | --- |
| `luz` sobre `selva` | 12,77:1 |
| `paper` sobre `selva` | 12,40:1 |
| `selva` sobre `brote` | 9,52:1 |
| `ink` sobre `brote` | 12,67:1 |
| `ink` sobre `lavanda` | 11,67:1 |
| `selva` sobre `lavanda` | 8,76:1 |
| `luz` sobre cinta sobre `selva` | 7,16:1 |
| `selva` sobre cinta sobre `brote` | 7,51:1 |

### Hasta dónde llega la tinta sobre una superficie de color

Sobre `brote` y `lavanda` la rampa **se agota antes** que sobre papel: son claras pero
cromáticas. Esto es fácil de olvidar y es un fallo silencioso, porque a simple vista parecen
fondos claros normales.

| Tinta | Sobre `brote` | Sobre `lavanda` |
| --- | --- | --- |
| `ink` | 12,67 | 11,67 |
| `body` | 9,12 | 8,39 |
| `muted` | 5,36 | 4,94 |
| `accent` | 4,70 | **4,33 — no usar** |
| `accent-strong` | 6,83 | 6,29 |
| `faint` | **3,81 — no usar** | **3,51 — no usar** |

**En un bloque de `brote` o de `lavanda`, los enlaces van en `accent-strong` y el texto no baja
de `muted`.**

### Frontera de un control contra el papel

| | Contraste | |
| --- | --- | --- |
| `selva` | 12,40:1 | se recorta solo |
| `accent` | 6,13:1 | se recorta solo |
| `liana` | 2,58:1 | necesita filete si es pulsable |
| `lavanda` | 1,41:1 | necesita filete si es pulsable |
| `brote` | 1,30:1 | necesita filete si es pulsable |

---

## Las reglas

Cada una está aquí porque algo falló, y cada una dice qué la sostiene.

### 1. Ninguna ficha de color se llama como una utilidad de Tailwind

El papel se llamó `base` un tiempo. Con ese nombre, `text-base` dejaba de emitir
`font-size: 1rem` y emitía `color: var(--color-base)`: los cuatro sitios que lo escribían
pidiendo 16 px se quedaron sin tamaño sin que nadie lo notara, porque 16 px es también lo que
heredaban. Y al revés era peor: quien escribiera `text-base` esperando un tamaño se llevaba
letra color papel sobre papel.

Por eso los cuatro colores nuevos van en castellano —`selva`, `brote`, `liana`, `lavanda`—: el
choque es imposible por construcción y no depende de que alguien lo recuerde. **Lo sostiene:**
nada automático. Es la regla más frágil de esta lista y la que hay que mirar a mano al añadir
una ficha.

### 2. Los estados de necesidad son una familia aparte del verde

Y «Cubierta» lleva un visto porque el tono, a propósito, no la separa de «Abierta».
**Lo sostiene:** la regla de `no-restricted-syntax` sobre `"cubierta"`, la lámina de
`capturas-verificacion/marca/`, y `node scripts/contraste.mjs --estados`.

### 2 bis. Aparte del verde, pero no de la paleta

Un color de estado **no se importa de fuera y no se elige a ojo en hexadecimal**: se deriva con
la ley de OKLCH de más arriba —saturación al 95 % del techo del sRGB, eje cálido, y la
luminosidad que deje sitio en el mapa—. Esta regla existe porque ya se saltó: los cuatro cálidos
sobrevivieron a un cambio de identidad entero conservando los valores de la paleta muerta de la
que venían, y lo hicieron precisamente porque en hexadecimal **nadie podía leer de dónde
salían**.

**Lo sostiene:** que las fichas estén escritas en `oklch()`, donde la estructura se ve; y el
apartado «EL REGISTRO» de `node scripts/contraste.mjs`, que imprime la saturación relativa de la
paleta entera junta. Si una ficha nueva se sale de la banda del 92-97 %, sale en esa tabla al
lado de las que sí están.

### 3. El registro sobrio no lleva color a plena potencia

**Lo sostiene:** el bloque final de `eslint.config.mjs`. Falla el `lint`.

### 4. `brote`, `liana` y `lavanda` son superficie, nunca texto

Sobre blanco dan 1,41:1, 2,79:1 y 1,53:1. **Lo sostiene:** nada automático; la tabla de arriba
y `scripts/contraste.mjs`, que los lista en su propio apartado.

### 5. Un bloque de color pulsable lleva filete

Porque su frontera contra el papel no llega a 3:1. **Lo sostiene:** `button.invite` ya lo trae;
para lo demás, la tabla de fronteras.

### 6. Pares prohibidos

- `faint` sobre `land` (4,18:1). Las superficies hundidas escriben en `muted`.
- `faint` sobre `brote` (3,81:1) y sobre `lavanda` (3,51:1).
- `accent` sobre `lavanda` (4,33:1). Ahí va `accent-strong`.

### 7. Los velos no se retocan a la baja

Están calculados contra una foto quemada a blanco puro. **Lo sostiene:** el apartado de velos
de `scripts/contraste.mjs`.

### 8. Todo funciona sin JavaScript

El portal se abre con mala señal y se comparte por WhatsApp. Nada de la identidad depende de
hidratar: las cintas son una imagen de fondo, los bloques son color plano, y la barra de
navegación se pinta en el servidor. Comprobado con el navegador sin JavaScript en
`capturas-verificacion/marca/sin-javascript/`.

---

## Cómo regenerar los números y la lámina

Los contrastes:

```bash
node scripts/contraste.mjs            # la tabla completa
node scripts/contraste.mjs --estados  # solo los cuatro estados y los tres filtros
```

La paleta de la referencia, si hiciera falta volver a muestrearla:

```bash
python3 scripts/muestrear-referencia.py <ruta de la imagen>
```

La lámina de los cuatro estados **no vive en el repositorio a propósito**: sería una ruta de
diagnóstico colgando del portal público. Se genera con una página temporal que monta los
componentes de verdad y les aplica los filtros con CSS, y se borra después. La receta es una
página con el filtro SVG de Viénot, Brettel y Mollon (1999) —la misma matriz que usa
`scripts/contraste.mjs`— en RGB lineal:

```tsx
<filter id="deuteranopia" colorInterpolationFilters="linearRGB">
  <feColorMatrix type="matrix" values="0.625 0.375 0 0 0
                                       0.700 0.300 0 0 0
                                       0     0.300 0.7 0 0
                                       0     0     0   1 0" />
</filter>
```

y tres copias de `<UrgentChip />` más `<NeedStatusChip status="abierta|parcial|cubierta" />`,
cada copia dentro de un contenedor con `filter: none`, `grayscale(1)` y `url(#deuteranopia)`.

La lámina lleva además **el mapa entero pintado tres veces**, y no solo las pastillas, porque
los cinco tramos son rellenos de área y una pastilla es un caso fácil. Va a dos tamaños: uno
grande y otro de 150 px de alto, que es donde un municipio del norte mide lo que una uña.

### El reparto de tramos para poder mirar el mapa

Hay un detalle práctico que conviene dejar escrito, porque cuesta media hora descubrirlo: **con
los datos de verdad el mapa no sirve para validar la escala**. Hay tres municipios documentados
y los tres caen en el mismo tramo, así que el mapa real solo enseña dos de los cinco colores
—`high` y `blank`— y no dice nada de si los tramos se distinguen entre sí.

Para verlo hay que repartir los cinco tramos por las treinta formas, y eso **se hace en una
copia del repositorio, nunca aquí**: es una línea en `paintMunicipalities` detrás de una variable
de entorno, y el repositorio no debe tener una puerta para falsear el estado de un municipio.
Las capturas de `capturas-verificacion/marca/mapa-escala-derivada/` están hechas así, y las dos
que se llaman `datos-reales` no, para que se vea también lo que hay hoy en producción.

El servidor de las capturas va en una copia en `/tmp` por otro motivo: `npm run build` escribe en
el mismo `.next` que usa el `next dev` que el equipo tiene abierto, y construir aquí le tira el
servidor de debajo.

### Y una comprobación que cierra el círculo

Las fichas están en OKLCH y **la conversión a sRGB la hace el navegador, no `contraste.mjs`**. Eso
abre la posibilidad de que la tabla mida una cosa y la pantalla enseñe otra, así que se comprobó:
muestreando los píxeles de la captura del mapa sin JavaScript, los cinco rellenos salen en
`#e4e9e0`, `#19a054`, `#e29a1d`, `#c25510` y `#920a1b` —exactamente los cinco valores que calcula
el script, ΔE 0,0000 en los cinco—. Si algún día se cambia el espacio de color de las fichas,
esta es la comprobación que hay que repetir.
