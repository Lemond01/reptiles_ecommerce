// ===== Configuración =====
const ENVIO_GRATIS = 150;                    // Monto mínimo para el envío gratis
const CLAVE_GUARDADO = 'reptilianos-carrito'; // Nombre con el que se guarda en localStorage
const DURACION_AVISO = 2500;                 // Tiempo que se ve el aviso (en milisegundos)


// ===== Elementos del HTML =====
const botonCarrito = document.getElementById('boton-carrito');
const contador = document.querySelector('.header__count');
const carritoPanel = document.getElementById('carrito');
const fondo = document.querySelector('.cart-overlay');
const botonCerrar = document.querySelector('.cart__close');
const textoEnvio = document.querySelector('.cart__shipping');
const barraEnvio = document.querySelector('.cart__bar-fill');
const lista = document.querySelector('.cart__list');
const totalTexto = document.querySelector('.cart__total-price');
const botonFinalizar = document.querySelector('.cart__checkout');
const aviso = document.querySelector('.toast');
const botonesAnadir = document.querySelectorAll('.product-card__button');


// ===== Estado =====
// El carrito es un arreglo de objetos: { id, nombre, precio, imagen, cantidad }
let carrito = cargarCarrito();
let temporizadorAviso; // Guarda el setTimeout del aviso para poder reiniciarlo


// ===== Utilidades =====
// Convierte un número en texto de precio: 29.9 -> "$29.90"
function formatearPrecio(numero) {
    return '$' + numero.toFixed(2);
}


// ===== Guardar y cargar (localStorage) =====
// Se usa try/catch porque localStorage puede fallar (por ejemplo, en modo privado)
function cargarCarrito() {
    try {
        const guardado = localStorage.getItem(CLAVE_GUARDADO);
        return guardado ? JSON.parse(guardado) : [];
    } catch (error) {
        return [];
    }
}

function guardarCarrito() {
    try {
        localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(carrito));
    } catch (error) {
        // Si no se puede guardar, el carrito sigue funcionando hasta recargar
    }
}


// ===== Abrir y cerrar el carrito =====
function carritoAbierto() {
    return carritoPanel.classList.contains('cart--open');
}

function abrirCarrito() {
    carritoPanel.classList.add('cart--open');
    fondo.classList.add('cart-overlay--visible');
    botonCarrito.setAttribute('aria-expanded', 'true');
    botonCerrar.focus(); // El foco pasa al botón ×
}

function cerrarCarrito() {
    // Si el foco estaba dentro del carrito, lo regresamos al botón del header
    const focoDentro = carritoPanel.contains(document.activeElement);

    carritoPanel.classList.remove('cart--open');
    fondo.classList.remove('cart-overlay--visible');
    botonCarrito.setAttribute('aria-expanded', 'false');

    if (focoDentro) {
        botonCarrito.focus();
    }
}

botonCarrito.addEventListener('click', function () {
    if (carritoAbierto()) {
        cerrarCarrito();
    } else {
        abrirCarrito();
    }
});

botonCerrar.addEventListener('click', cerrarCarrito);
fondo.addEventListener('click', cerrarCarrito);

document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && carritoAbierto()) {
        cerrarCarrito();
    }
});


// ===== Aviso (toast) =====
function mostrarAviso(mensaje) {
    aviso.textContent = mensaje;
    aviso.classList.add('toast--visible');

    // Si ya había un aviso, reiniciamos el tiempo
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(function () {
        aviso.classList.remove('toast--visible');
    }, DURACION_AVISO);
}


// ===== Añadir productos =====
function anadirProducto(tarjeta) {
    // Los datos vienen de los atributos data-* de cada tarjeta
    const datos = tarjeta.dataset;
    const existente = carrito.find(function (producto) {
        return producto.id === datos.id;
    });

    if (existente) {
        // Si ya está en el carrito, solo sumamos 1
        existente.cantidad++;
    } else {
        carrito.push({
            id: datos.id,
            nombre: datos.nombre,
            precio: Number(datos.precio),
            imagen: datos.imagen,
            cantidad: 1
        });
    }

    actualizar();
    mostrarAviso(datos.nombre + ' se añadió al carrito');
}

botonesAnadir.forEach(function (boton) {
    boton.addEventListener('click', function () {
        anadirProducto(boton.closest('.product-card'));
    });
});


// ===== Botones de la lista (delegación de eventos) =====
// Un solo listener en la <ul> atiende los botones − + y eliminar de todos los productos
lista.addEventListener('click', function (evento) {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return; // El clic no fue en un botón

    const accion = boton.dataset.accion;
    const id = boton.closest('.cart__item').dataset.id;
    const producto = carrito.find(function (item) {
        return item.id === id;
    });

    if (accion === 'sumar') {
        producto.cantidad++;
    } else if (accion === 'restar') {
        producto.cantidad--;
    }

    // Si se borra o la cantidad llega a 0, quitamos el producto del arreglo
    if (accion === 'borrar' || producto.cantidad === 0) {
        carrito = carrito.filter(function (item) {
            return item.id !== id;
        });
    }

    actualizar();

    // La lista se vuelve a dibujar, así que devolvemos el foco al mismo botón
    // (o al botón × si el producto ya no existe) para quien usa el teclado
    const mismoBoton = lista.querySelector('[data-id="' + id + '"] [data-accion="' + accion + '"]');
    (mismoBoton || botonCerrar).focus();
});


// ===== Finalizar compra (sin pago) =====
botonFinalizar.addEventListener('click', function () {
    carrito = [];
    actualizar();
    cerrarCarrito();
    mostrarAviso('¡Gracias por tu pedido! Te contactaremos para el pago y envío.');
});


// ===== Actualizar todo =====
// Dibuja la lista, calcula total, contador y barra de envío, y guarda el carrito
function actualizar() {
    // 1. Dibujar la lista de productos
    lista.innerHTML = carrito.map(function (producto) {
        return `
            <li class="cart__item" data-id="${producto.id}">
                <img class="cart__image" src="${producto.imagen}" alt="">
                <p class="cart__name">${producto.nombre}</p>
                <div class="cart__qty">
                    <button class="cart__qty-button" type="button" data-accion="restar" aria-label="Quitar uno de ${producto.nombre}">
                        <img class="cart__qty-icon" src="img/icons/minus.svg" alt="">
                    </button>
                    <span class="cart__qty-number">${producto.cantidad}</span>
                    <button class="cart__qty-button" type="button" data-accion="sumar" aria-label="Añadir uno de ${producto.nombre}">
                        <img class="cart__qty-icon" src="img/icons/plus.svg" alt="">
                    </button>
                </div>
                <p class="cart__price">${formatearPrecio(producto.precio * producto.cantidad)}</p>
                <button class="cart__delete" type="button" data-accion="borrar" aria-label="Eliminar ${producto.nombre}">
                    <img class="cart__delete-icon" src="img/icons/trash.svg" alt="">
                </button>
            </li>`;
    }).join('');

    // 2. Calcular el total y el número de piezas
    let total = 0;
    let piezas = 0;
    carrito.forEach(function (producto) {
        total += producto.precio * producto.cantidad;
        piezas += producto.cantidad;
    });

    totalTexto.textContent = formatearPrecio(total);

    // 3. Contador del ícono del carrito (se oculta si está vacío)
    contador.textContent = piezas;
    contador.classList.toggle('header__count--visible', piezas > 0);
    botonCarrito.setAttribute('aria-label', 'Ver carrito (' + piezas + (piezas === 1 ? ' producto)' : ' productos)'));

    // 4. Barra y texto de envío gratis
    if (total >= ENVIO_GRATIS) {
        textoEnvio.textContent = '¡Tienes envío gratis!';
    } else {
        textoEnvio.textContent = 'Te faltan ' + formatearPrecio(ENVIO_GRATIS - total) + ' para el envío gratis';
    }
    const porcentaje = Math.min(total / ENVIO_GRATIS * 100, 100);
    barraEnvio.style.width = porcentaje + '%';

    // 5. Sin productos no se puede finalizar la compra
    botonFinalizar.disabled = carrito.length === 0;

    // 6. Guardar en localStorage
    guardarCarrito();
}


// ===== Inicio =====
// Dibuja el carrito guardado al cargar la página
actualizar();
