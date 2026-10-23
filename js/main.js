// ===== Configuración =====
const ENVIO_GRATIS = 150;                    // Monto mínimo para el envío gratis (Política de envíos 4.2)
const COSTO_ENVIO = 99;                      // Envío estándar si no se llega al mínimo (Política de envíos 4.2)
const CLAVE_GUARDADO = 'repko-carrito';       // Nombre con el que se guarda el carrito en localStorage
const CLAVE_PROMOCIONES = 'repko-promociones'; // Guarda true o false (solo de ejemplo, no hay servidor)
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
const subtotalTexto = document.querySelector('.cart__subtotal');
const envioTexto = document.querySelector('.cart__shipping-cost');
const totalTexto = document.querySelector('.cart__total-price');
const botonFinalizar = document.querySelector('.cart__checkout');
const aviso = document.querySelector('.toast');
const botonesAnadir = document.querySelectorAll('.product-card__button');
const tarjetas = document.querySelectorAll('.product-card');

// Menú lateral
const botonMenu = document.getElementById('boton-menu');
const menuPanel = document.getElementById('menu');
const botonCerrarMenu = document.querySelector('.menu__close');
const enlacesMenu = document.querySelectorAll('.menu__link');

// Filtros
const botonesFiltro = document.querySelectorAll('.filters__button');
const textoConteo = document.querySelector('.products__count');

// Ventana de confirmación del pedido
const ventanaConfirmar = document.getElementById('confirmar-pedido');
const resumenPiezas = document.querySelector('.confirm__pieces');
const resumenSubtotal = document.querySelector('.confirm__subtotal');
const resumenEnvio = document.querySelector('.confirm__shipping');
const resumenTotal = document.querySelector('.confirm__total');
const casillaTerminos = document.getElementById('casilla-terminos');
const bloqueReptiles = document.getElementById('bloque-reptiles');
const casillaReptiles = document.getElementById('casilla-reptiles');
const casillaPromociones = document.getElementById('casilla-promociones');
const botonVolver = document.querySelector('.confirm__back');
const botonConfirmar = document.querySelector('.confirm__submit');


// ===== Estado =====
// El carrito es un arreglo de objetos: { id, nombre, precio, imagen, categoria, cantidad }
let carrito = cargarCarrito();
let temporizadorAviso; // Guarda el setTimeout del aviso para poder reiniciarlo


// ===== Utilidades =====
// Convierte un número en texto de precio en pesos: 2899 -> "$2,899.00"
function formatearPrecio(numero) {
    return '$' + numero.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Arma un producto del carrito con los datos data-* de una tarjeta
function datosDeTarjeta(tarjeta, cantidad) {
    const datos = tarjeta.dataset;
    return {
        id: datos.id,
        nombre: datos.nombre,
        precio: Number(datos.precio),
        imagen: datos.imagen,
        categoria: datos.categoria, // Sirve para saber si hay un reptil en el carrito
        cantidad: cantidad
    };
}


// ===== Guardar y cargar (localStorage) =====
// Se usa try/catch porque localStorage puede fallar (por ejemplo, en modo privado)
function cargarCarrito() {
    let guardado = [];
    try {
        const texto = localStorage.getItem(CLAVE_GUARDADO);
        guardado = texto ? JSON.parse(texto) : [];
    } catch (error) {
        return [];
    }

    // Del carrito guardado solo usamos el id y la cantidad.
    // El precio, nombre y categoría se toman de las tarjetas de la página,
    // así nunca queda un precio viejo. Si el producto ya no existe o se agotó, se quita.
    const actualizado = [];
    guardado.forEach(function (item) {
        const tarjeta = document.querySelector('.product-card[data-id="' + item.id + '"]');
        if (tarjeta && tarjeta.dataset.agotado !== 'true') {
            actualizado.push(datosDeTarjeta(tarjeta, item.cantidad));
        }
    });
    return actualizado;
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
    cerrarMenu(false); // Solo puede haber un panel abierto
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


// ===== Menú =====
function menuAbierto() {
    return menuPanel.classList.contains('menu--open');
}

function abrirMenu() {
    cerrarCarrito(); // Solo puede haber un panel abierto
    menuPanel.classList.add('menu--open');
    fondo.classList.add('cart-overlay--visible'); // Reutilizamos el fondo del carrito
    botonMenu.setAttribute('aria-expanded', 'true');
    botonCerrarMenu.focus();
}

// devolverFoco = false cuando el menú se cierra al hacer clic en un enlace
// (así el foco no regresa al header mientras la página baja)
function cerrarMenu(devolverFoco = true) {
    const focoDentro = menuPanel.contains(document.activeElement);

    menuPanel.classList.remove('menu--open');
    fondo.classList.remove('cart-overlay--visible');
    botonMenu.setAttribute('aria-expanded', 'false');

    if (devolverFoco && focoDentro) {
        botonMenu.focus();
    }
}

botonMenu.addEventListener('click', function () {
    if (menuAbierto()) {
        cerrarMenu();
    } else {
        abrirMenu();
    }
});

botonCerrarMenu.addEventListener('click', function () {
    cerrarMenu();
});

// Los enlaces de categoría aplican el filtro; todos cierran el menú.
// No evitamos el comportamiento del enlace, así la página baja a #productos o #faq
enlacesMenu.forEach(function (enlace) {
    enlace.addEventListener('click', function () {
        if (enlace.dataset.filtro) {
            aplicarFiltro(enlace.dataset.filtro);
        }
        cerrarMenu(false);
    });
});


// ===== Cerrar paneles con el fondo y con Escape =====
function cerrarPaneles() {
    if (carritoAbierto()) cerrarCarrito();
    if (menuAbierto()) cerrarMenu();
}

fondo.addEventListener('click', cerrarPaneles);

document.addEventListener('keydown', function (evento) {
    // Si la ventana de confirmación está abierta, Escape solo la cierra a ella
    // (el navegador lo hace solo) y el carrito sigue abierto detrás
    if (ventanaConfirmar.open) return;

    if (evento.key === 'Escape') {
        cerrarPaneles();
    }
});


// ===== Aviso (toast) =====
// duracion es opcional: si no se indica, se usa DURACION_AVISO
function mostrarAviso(mensaje, duracion = DURACION_AVISO) {
    aviso.textContent = mensaje;
    aviso.classList.add('toast--visible');

    // Si ya había un aviso, reiniciamos el tiempo
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(function () {
        aviso.classList.remove('toast--visible');
    }, duracion);
}


// ===== Añadir productos =====
function anadirProducto(tarjeta) {
    // Los datos vienen de los atributos data-* de cada tarjeta
    const datos = tarjeta.dataset;

    // Un producto agotado nunca entra al carrito
    if (datos.agotado === 'true') return;

    const existente = carrito.find(function (producto) {
        return producto.id === datos.id;
    });

    if (existente) {
        // Si ya está en el carrito, solo sumamos 1
        existente.cantidad++;
    } else {
        carrito.push(datosDeTarjeta(tarjeta, 1));
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


// ===== Finalizar compra: ventana de confirmación (sin pago) =====
// "Finalizar compra" ya no vacía el carrito: primero abre la ventana <dialog>
function abrirConfirmacion() {
    // 1. Llenar el resumen con los totales actuales
    const totales = calcularTotales();
    resumenPiezas.textContent = totales.piezas;
    resumenSubtotal.textContent = formatearPrecio(totales.subtotal);
    resumenEnvio.textContent = totales.envio === 0 ? 'Gratis' : formatearPrecio(totales.envio);
    resumenTotal.textContent = formatearPrecio(totales.total);

    // 2. La casilla de mayoría de edad solo aparece si hay un reptil en el carrito
    const hayReptiles = carrito.some(function (producto) {
        return producto.categoria === 'reptiles';
    });
    bloqueReptiles.hidden = !hayReptiles;

    // 3. Las casillas empiezan desmarcadas cada vez que se abre la ventana
    casillaTerminos.checked = false;
    casillaReptiles.checked = false;
    casillaPromociones.checked = false;
    revisarCasillas();

    // 4. showModal() la abre encima de todo, con fondo oscuro (::backdrop)
    ventanaConfirmar.showModal();
}

// "Confirmar pedido" solo se habilita si están marcadas las casillas obligatorias
function revisarCasillas() {
    const reptilesOk = bloqueReptiles.hidden || casillaReptiles.checked;
    botonConfirmar.disabled = !(casillaTerminos.checked && reptilesOk);
}

function guardarPromociones(acepta) {
    try {
        localStorage.setItem(CLAVE_PROMOCIONES, acepta); // Se guarda "true" o "false"
    } catch (error) {
        // Solo es un ejemplo: si falla, no pasa nada
    }
}

botonFinalizar.addEventListener('click', abrirConfirmacion);

// Cada vez que se marca o desmarca una casilla, revisamos el botón
ventanaConfirmar.addEventListener('change', revisarCasillas);

botonVolver.addEventListener('click', function () {
    ventanaConfirmar.close(); // Regresa al carrito, que sigue abierto
});

botonConfirmar.addEventListener('click', function () {
    guardarPromociones(casillaPromociones.checked);
    ventanaConfirmar.close();
    carrito = [];
    actualizar();
    cerrarCarrito();
    mostrarAviso('¡Gracias por tu pedido! Te enviamos la confirmación por correo. (Proyecto académico: no se realiza ningún cobro).', 5000);
});


// ===== Filtros =====
// Muestra solo las tarjetas de la categoría elegida ('todos' las muestra todas)
function aplicarFiltro(categoria) {
    let visibles = 0;

    tarjetas.forEach(function (tarjeta) {
        const coincide = categoria === 'todos' || tarjeta.dataset.categoria === categoria;
        tarjeta.hidden = !coincide; // El atributo hidden oculta la tarjeta
        if (coincide) visibles++;
    });

    // Marcamos como presionado solo el botón del filtro activo
    botonesFiltro.forEach(function (boton) {
        boton.setAttribute('aria-pressed', boton.dataset.filtro === categoria);
    });

    textoConteo.textContent = 'Mostrando ' + visibles + (visibles === 1 ? ' producto' : ' productos');
}

botonesFiltro.forEach(function (boton) {
    boton.addEventListener('click', function () {
        aplicarFiltro(boton.dataset.filtro);
    });
});


// ===== Etiquetas/Agotado =====
// Las tarjetas con data-agotado="true" no se pueden comprar
tarjetas.forEach(function (tarjeta) {
    if (tarjeta.dataset.agotado === 'true') {
        const boton = tarjeta.querySelector('.product-card__button');
        boton.disabled = true;          // Deshabilitado: no se puede hacer clic
        boton.textContent = 'Agotado';
        tarjeta.classList.add('product-card--agotado'); // Apaga la imagen (en el SCSS)
    }
});


// ===== Totales =====
// Calcula piezas, subtotal, envío y total. La usan el carrito y la ventana de confirmación
function calcularTotales() {
    let subtotal = 0;
    let piezas = 0;
    carrito.forEach(function (producto) {
        subtotal += producto.precio * producto.cantidad;
        piezas += producto.cantidad;
    });

    // Envío: gratis desde ENVIO_GRATIS; si el carrito está vacío, no se cobra
    let envio = COSTO_ENVIO;
    if (piezas === 0 || subtotal >= ENVIO_GRATIS) {
        envio = 0;
    }

    return {
        piezas: piezas,
        subtotal: subtotal,
        envio: envio,
        total: subtotal + envio
    };
}


// ===== Actualizar todo =====
// Dibuja la lista, calcula totales, contador y barra de envío, y guarda el carrito
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

    // 2. Subtotal, envío y total
    const totales = calcularTotales();
    const piezas = totales.piezas;
    const subtotal = totales.subtotal;

    subtotalTexto.textContent = formatearPrecio(subtotal);
    if (piezas === 0) {
        envioTexto.textContent = '—';
    } else if (totales.envio === 0) {
        envioTexto.textContent = 'Gratis';
    } else {
        envioTexto.textContent = formatearPrecio(totales.envio);
    }
    totalTexto.textContent = formatearPrecio(totales.total);

    // 3. Contador del ícono del carrito (se oculta si está vacío)
    contador.textContent = piezas;
    contador.classList.toggle('header__count--visible', piezas > 0);
    botonCarrito.setAttribute('aria-label', 'Ver carrito (' + piezas + (piezas === 1 ? ' producto)' : ' productos)'));

    // 4. Barra y texto de envío gratis (se mide con el subtotal, sin contar el envío)
    if (subtotal >= ENVIO_GRATIS) {
        textoEnvio.textContent = '¡Tienes envío gratis!';
    } else {
        textoEnvio.textContent = 'Te faltan ' + formatearPrecio(ENVIO_GRATIS - subtotal) + ' para el envío gratis';
    }
    const porcentaje = Math.min(subtotal / ENVIO_GRATIS * 100, 100);
    barraEnvio.style.width = porcentaje + '%';

    // 5. Sin productos no se puede finalizar la compra
    botonFinalizar.disabled = carrito.length === 0;

    // 6. Guardar en localStorage
    guardarCarrito();
}


// ===== Inicio =====
// Dibuja el carrito guardado al cargar la página
actualizar();
