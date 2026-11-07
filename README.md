# WORKSIM · i3lab

Sitio estático de práctica profesional con IA. No requiere instalación ni compilación.

## Publicar en GitHub Pages
1. Extrae el ZIP y sube su contenido a tu repositorio. index.html debe quedar en la raíz, junto a sql-worker.js y la carpeta vendor.
2. En Settings > Pages selecciona Deploy from a branch, rama main y carpeta / (root), y guarda.
3. Espera la publicación y abre el enlace que indique GitHub Pages.

No subas solo index.html: el entorno SQL necesita sql-worker.js, vendor/sql-wasm.js y vendor/sql-wasm.wasm.
Para probar localmente, usa un servidor HTTP; abrir el HTML con doble clic puede impedir el funcionamiento del worker.

## Datos y límites
El historial se guarda en el navegador de cada visitante. No hay cuentas, servidor de resultados ni certificación. El historial de la versión de Sites no se transfiere automáticamente a GitHub Pages porque tienen dominios distintos.

## Dependencias
SQLite en el navegador mediante sql.js 1.13.0; licencia incluida en vendor/SQLJS-LICENSE.txt.
