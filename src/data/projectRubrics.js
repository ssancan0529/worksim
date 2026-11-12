export const RUBRIC_VERSION = 2;
const number = (id, label, expected, help, tolerance = 0.01) => ({ id, label, type: 'number', expected, help, tolerance });
const choice = (id, label, options, expected, help) => ({ id, label, type: 'select', options, expected, help });
export const SALES = [
  ['v1', 'enero', 'A', 6000], ['v2', 'enero', 'B', 2200],
  ['v1', 'enero', 'A', 6000], ['v3', 'febrero', 'A', 5000],
  ['v4', 'febrero', 'B', 2400], ['v5', 'marzo', 'A', 4000],
  ['v6', 'marzo', 'B', 2300], ['d1', 'marzo', 'B', -200],
];
const uniqueSales = [...new Map(SALES.map(row => [row[0], row])).values()];
const sum = rows => rows.reduce((total, row) => total + row[3], 0);
const january = sum(uniqueSales.filter(row => row[1] === 'enero'));
const march = sum(uniqueSales.filter(row => row[1] === 'marzo'));
export const INVENTORY_CASES = [
  { name: 'Salida válida', stock: 10, cantidad: 3, operacion: 'salida', expected: { aceptado: true, stock: 7 } },
  { name: 'Salida superior al stock', stock: 10, cantidad: 12, operacion: 'salida', expected: { aceptado: false, stock: 10 } },
  { name: 'Salida de todas las unidades', stock: 10, cantidad: 10, operacion: 'salida', expected: { aceptado: true, stock: 0 } },
  { name: 'Entrada', stock: 10, cantidad: 3, operacion: 'entrada', expected: { aceptado: true, stock: 13 } },
  { name: 'Cantidad cero', stock: 10, cantidad: 0, operacion: 'salida', expected: { aceptado: false, stock: 10 } },
  { name: 'Cantidad negativa', stock: 10, cantidad: -3, operacion: 'salida', expected: { aceptado: false, stock: 10 } },
  { name: 'Cantidad fraccionaria', stock: 10, cantidad: 1.5, operacion: 'salida', expected: { aceptado: false, stock: 10 } },
  { name: 'Cantidad de texto', stock: 10, cantidad: '3', operacion: 'salida', expected: { aceptado: false, stock: 10 } },
  { name: 'Cantidad booleana', stock: 10, cantidad: true, operacion: 'salida', expected: { aceptado: false, stock: 10 } },
  { name: 'Operación desconocida', stock: 10, cantidad: 3, operacion: 'otra', expected: { aceptado: false, stock: 10 } },
];
export const PROJECT_RUBRICS = {
  'diagnostico-de-ventas': {
    context: 'Datos de práctica en USD. El ID identifica un movimiento. v1 está repetido por una importación. d1 es una devolución de marzo, representada con importe negativo. Compara enero con marzo usando ingresos netos. Las categorías A y B son líneas de productos.',
    review: 'Revisar si la explicación relaciona los hallazgos con la recomendación, reconoce límites y documenta pasos suficientes para reproducir el análisis.',
    stages: [
      [choice('period', 'Periodo de comparación', ['enero–marzo', 'enero–febrero', 'febrero–marzo'], 'enero–marzo', 'El encargo compara enero con marzo.'), choice('metric', 'Indicador principal', ['Ingresos netos', 'Número de filas', 'Ingresos sin devoluciones'], 'Ingresos netos', 'Las devoluciones forman parte del valor neto vendido.')],
      [number('duplicates', 'Movimientos duplicados que debes excluir', 1, 'Cuenta las repeticiones del mismo ID de movimiento.'), choice('key', 'Clave para eliminar duplicados', ['ID de movimiento', 'Mes', 'Categoría'], 'ID de movimiento', 'Varias ventas del mismo mes o categoría son válidas.'), number('refund', 'Importe neto de la devolución (USD)', -200, 'La devolución reduce los ingresos de marzo.')],
      [number('january', 'Ingresos netos de enero (USD)', january, 'Suma enero después de excluir la importación repetida.'), number('march', 'Ingresos netos de marzo (USD)', march, 'Incluye el movimiento negativo de marzo.'), number('delta', 'Variación absoluta, marzo menos enero (USD)', march-january, 'Resta los ingresos iniciales a los finales.'), number('percent', 'Variación porcentual (%)', (march-january)/january*100, 'Divide la diferencia entre el valor de enero y multiplica por 100.', 0.05)],
      [choice('direction', 'Conclusión sobre los ingresos', ['Disminuyeron', 'Aumentaron', 'Se mantuvieron'], 'Disminuyeron', 'Contrasta los totales de enero y marzo.'), choice('category', 'Categoría que explica la mayor caída absoluta', ['A', 'B'], 'A', 'Compara la diferencia en USD de cada categoría.'), number('categoryDelta', 'Variación de esa categoría (USD)', -2000, 'La categoría A pasa de 6.000 a 4.000 USD.'), number('control', 'Total neto del trimestre para conciliar (USD)', sum(uniqueSales), 'La suma de los meses debe coincidir con la suma de movimientos únicos.')],
    ],
  },
  'api-de-inventario': {
    context: 'Contrato de práctica. GET /productos lista productos (200). POST /productos crea un código único (201), o rechaza un código duplicado (409). PATCH /productos/{id}/stock devuelve 404 si el producto no existe. Implementa mover_stock(stock, cantidad, operacion) en Python. Stock inicial entero no negativo. Cantidad entera positiva, excluyendo booleanos. Operación entrada o salida. Devuelve un diccionario con aceptado (booleano) y stock (entero). Toda operación inválida conserva el stock inicial.',
    review: 'Revisar el servicio HTTP completo, persistencia, concurrencia y que las instrucciones funcionen en un entorno nuevo. Las pruebas automáticas de esta entrega cubren la función de stock.',
    stages: [
      [number('created', 'Estado HTTP de creación', 201, 'Una creación exitosa devuelve 201.'), number('duplicate', 'Estado HTTP de código duplicado', 409, 'El contrato define un conflicto 409.'), number('missing', 'Estado HTTP de producto inexistente', 404, 'El contrato define 404 para un producto inexistente.')],
      [],
      [number('validStock', 'Stock esperado al retirar 3 de 10', 7, 'Resta la cantidad solicitada cuando hay suficientes unidades.'), number('rejectedStock', 'Stock esperado al intentar retirar 12 de 10', 10, 'Una operación rechazada conserva el estado inicial.'), choice('zeroAccepted', '¿Aceptar una salida de cantidad cero?', ['Sí', 'No'], 'No', 'La cantidad debe ser positiva.'), number('boundaryStock', 'Stock esperado al retirar 10 de 10', 0, 'Retirar exactamente las existencias es válido.')],
      [choice('method', 'Método del ejemplo de creación', ['POST', 'GET', 'DELETE'], 'POST', 'La creación corresponde a POST /productos.'), number('exampleStatus', 'Estado de respuesta del ejemplo de creación', 201, 'La respuesta documentada debe coincidir con el contrato.'), number('exampleStock', 'Stock tras crear con 10 y registrar una entrada de 3', 13, 'Una entrada incrementa las existencias.')],
    ],
  },
  'campana-de-lanzamiento': {
    context: 'Brief de práctica. Servicio de entregas para tiendas pequeñas de Guayaquil. Cobertura inicial limitada a Centro y Urdesa. Entrega estimada entre 24 y 48 horas, con confirmación de cobertura al cotizar. Campaña de 7 días, presupuesto máximo de 100 USD y meta de 10 solicitudes de cotización. Canales disponibles: Instagram y correo. Datos de seguimiento: 1.000 personas alcanzadas, 50 clics y 10 solicitudes recibidas. No hay una garantía de ventas ni de entregas en una hora.',
    review: 'Revisar la claridad del mensaje principal y su variante, su adecuación al público y cualquier promesa escrita. Las elecciones estructuradas se contrastan con el brief, pero no certifican la calidad de la redacción libre.',
    stages: [
      [choice('audience', 'Público del encargo', ['Tiendas pequeñas de Guayaquil', 'Consumidores de todo Ecuador', 'Grandes industrias'], 'Tiendas pequeñas de Guayaquil', 'El brief delimita actividad y ciudad.'), number('goal', 'Meta de solicitudes', 10, 'La meta del brief es de 10 cotizaciones.'), number('days', 'Duración de campaña (días)', 7, 'El periodo acordado es de siete días.'), number('budget', 'Presupuesto planificado (USD)', 100, 'Distribuye hasta 100 USD para la campaña.', 0.01)],
      [choice('promise', 'Compromiso que comunicarás', ['Entrega estimada de 24–48 horas, previa confirmación de cobertura', 'Entrega garantizada en una hora', 'Aumento de ventas garantizado'], 'Entrega estimada de 24–48 horas, previa confirmación de cobertura', 'Usa las condiciones de entrega y la incertidumbre expresadas en el brief.'), choice('coverage', 'Cobertura comunicada', ['Centro y Urdesa', 'Todo Guayaquil', 'Todo Ecuador'], 'Centro y Urdesa', 'La cobertura inicial incluye dos sectores.'), choice('cta', 'Acción solicitada al público', ['Solicitar cotización y confirmar cobertura', 'Pagar por entrega garantizada en una hora', 'Compartir sin solicitar información'], 'Solicitar cotización y confirmar cobertura', 'El llamado a la acción debe contribuir a la meta de cotizaciones.')],
      [number('announcement', 'Día del anuncio (1–7)', null, 'El anuncio debe preceder a la demostración.'), number('demonstration', 'Día de la demostración (1–7)', null, 'Ubica la demostración entre el anuncio y el recordatorio.'), number('reminder', 'Día del recordatorio (1–7)', null, 'El recordatorio debe estar dentro de la semana.'), choice('channel', 'Canal para las piezas', ['Instagram', 'Correo', 'Televisión'], ['Instagram', 'Correo'], 'El brief contempla Instagram y correo.')],
      [choice('source', 'Fuente para contar cotizaciones', ['Registro de formularios recibidos', 'Número de impresiones', 'Cantidad de publicaciones'], 'Registro de formularios recibidos', 'Las solicitudes deben medirse en el registro de recepción.'), number('conversion', 'Conversión de clics a solicitudes (%)', 20, 'Calcula 10 / 50 × 100.'), number('reviewDay', 'Día de revisión final', 7, 'Revisa el resultado al cierre del periodo de campaña.'), choice('achieved', '¿Se alcanzó la meta de solicitudes?', ['Sí', 'No'], 'Sí', 'Compara las diez solicitudes recibidas con la meta.')],
    ],
  },
};
