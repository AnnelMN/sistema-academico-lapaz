// Reglas comunes para las claves secretas leídas del entorno (C-01).
// Los valores de ejemplo de .env.example ("cambia_esto_…") son públicos: si se
// copian tal cual, cualquiera que vea la plantilla conocería la clave. Por eso
// nunca se aceptan como claves válidas.

const LARGO_MINIMO = 32;      // desarrollo
const LARGO_PRODUCCION = 64;  // producción

const esMarcador = (valor) => /^\s*["']?cambia_esto/i.test(String(valor || ''));

// Clave usable: definida, no es un marcador y tiene el largo mínimo
const esClaveValida = (valor, minimo = LARGO_MINIMO) => (
  typeof valor === 'string' && !esMarcador(valor) && valor.length >= minimo
);

module.exports = { LARGO_MINIMO, LARGO_PRODUCCION, esMarcador, esClaveValida };
