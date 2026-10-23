// ===== Aviso de almacenamiento =====
// Este archivo se carga en index.html y en legal.html.
// Muestra la barra de aviso solo la primera vez que alguien visita el sitio.

const CLAVE_AVISO = 'repko-aviso-almacenamiento'; // Nombre con el que se guarda en localStorage

const barraAviso = document.querySelector('.storage-notice');
const botonEntendido = document.querySelector('.storage-notice__button');


// Revisa si la persona ya aceptó el aviso antes.
// Se usa try/catch porque localStorage puede fallar (por ejemplo, en modo privado)
function avisoAceptado() {
    try {
        return localStorage.getItem(CLAVE_AVISO) === 'aceptado';
    } catch (error) {
        return false;
    }
}

function guardarAvisoAceptado() {
    try {
        localStorage.setItem(CLAVE_AVISO, 'aceptado');
    } catch (error) {
        // Si no se puede guardar, el aviso volverá a salir en la próxima visita
    }
}


// Al cargar la página: si no lo ha aceptado, quitamos el atributo hidden para mostrar la barra
if (!avisoAceptado()) {
    barraAviso.hidden = false;
}

// Al hacer clic en "Entendido": guardamos y ocultamos la barra
botonEntendido.addEventListener('click', function () {
    guardarAvisoAceptado();
    barraAviso.hidden = true;
});
