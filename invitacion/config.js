// Datos de la invitación. Editá solo los textos entre comillas.
window.CONFIG = {
  festejado: "",                           // opcional: nombre del cumpleañero (si lo dejás vacío no se muestra)
  titulo: "Estás invitado",
  subtitulo: "a mi cumple",
  fecha: "21/12/2026",
  hora: "21:00 HS",                               // opcional (vacío = no se muestra)
  lugar: "Casa Falsa 123",
  nota: "",                               // opcional, ej. "Confirmá antes del 15/12"

  // Pegá acá la URL de tu Google Apps Script (ver LEEME.txt, paso 3).
  // Mientras diga PEGAR..., la página funciona en "modo prueba" y NO envía nada.
  scriptUrl: "https://script.google.com/macros/s/PEGAR_ID/exec",

  // Caja neón 3D que aparece primero. El invitado la toca para abrirla (o se abre sola a los N segundos).
  // invitacionSeg = cuántos segundos queda a la vista la invitación antes de "guardarse" en el ícono.
  // activa: false  -> saltea la caja y muestra la invitación directamente.
  regalo: { activa: true, autoAbrirSeg: 6, invitacionSeg: 8 },

  aspecto: 0.571,                          // alto ÷ ancho de tu tarjeta (1400x800 = 0.571)
  escala: 1,                               // tamaño general de la interfaz
  colores: { cian: "#00e5ff", magenta: "#ff2bd6", verde: "#3dff9a", rojo: "#ff4d6d" }
};
