const limitesCostaRica = L.latLngBounds(
    [8.0, -86.1],
    [11.3, -82.4]
);

const mapa = L.map('map', {
    center: [9.7489, -83.7534],
    zoom: 8,
    minZoom: 8,
    maxZoom: 15,

    maxBounds: limitesCostaRica,
    maxBoundsViscosity: 1.0
});

let marcadorActual = null;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);

mapa.on('click', function () {

    if (marcadorActual !== null) {
        mapa.removeLayer(marcadorActual);
        marcadorActual = null;
    }

});

function obtenerCoordenadas(texto) {

    const partes = texto.split(',');

    if (partes.length !== 2) {
        return null;
    }

    const latitud = parseFloat(partes[0].trim());
    const longitud = parseFloat(partes[1].trim());

    if (isNaN(latitud) || isNaN(longitud)) {
        return null;
    }

    if (latitud < -90 || latitud > 90 ||
        longitud < -180 || longitud > 180) {
        return null;
    }

    return {
        latitud: latitud,
        longitud: longitud
    };
}

async function buscarDistrito(latitud, longitud) {

    const punto = turf.point([longitud, latitud]);

    const respuestaCodigos = await fetch('data/distritos.json');

    if (!respuestaCodigos.ok) {
        throw new Error(`Error cargando distritos.json: ${respuestaCodigos.status}`);
    }

    const codigos = await respuestaCodigos.json();

    for (const codigo of codigos) {

        const respuesta = await fetch(`data/distritos/${codigo}.geojson`);

        if (!respuesta.ok) {
            console.error(`No se pudo cargar ${codigo}.geojson`);
            continue;
        }

        try {
            const distrito = await respuesta.json();

            if (turf.booleanPointInPolygon(punto, distrito)) {
                return distrito;
            }
        }
        catch (error)
        {
            console.warn();
            continue;
        }
    }

    return null;
}

let nombresDistritos = null;

async function cargarNombresDistritos() {

    const respuesta = await fetch('data/nombres-distritos.json');

    if (!respuesta.ok) {
        throw new Error(`Error cargando nombres-distritos.json: ${respuesta.status}`);
    }

    nombresDistritos = await respuesta.json();
}

document.getElementById("btnBuscar").addEventListener("click", async function () {

    const texto = document.getElementById("coordenadas").value;

    const coordenadas = obtenerCoordenadas(texto);

    if (coordenadas === null) {

        mostrarModalError("Las coordenadas ingresadas no son válidas");

        return;
    }

    try {

        await cargarNombresDistritos();

        const distrito = await buscarDistrito(
            coordenadas.latitud,
            coordenadas.longitud
        );

        if (distrito === null) {

            mostrarModalError("Las coordenadas indicadas están fuera de Costa Rica");

            return;
        }

        const codigo = distrito.properties.Codigo;

        const informacion = nombresDistritos[codigo];

        const posicion = [
            coordenadas.latitud,
            coordenadas.longitud
        ];

        //Recorte de Latitud y Longitud a 6 decimales
        const latitudCopiar = Math.trunc(coordenadas.latitud * 1000000) / 1000000;
        const longitudCopiar = Math.trunc(coordenadas.longitud * 1000000) / 1000000;

        //Variable del texto copiado
        const textoCopiar = `,${latitudCopiar},${longitudCopiar},"${informacion.provincia}, ${informacion.canton} - ${informacion.distrito}",`;

        if (marcadorActual !== null) {
            mapa.removeLayer(marcadorActual);
        }

        marcadorActual = L.marker(posicion)
            .addTo(mapa)
            .bindPopup(
                `<div style="text-align: center;">
                    <b>${informacion.provincia}, ${informacion.canton} - ${informacion.distrito}
                    <br>
                    ${informacion.gam ? "Dentro GAM" : "Fuera GAM"}
                    <br>
                    ${latitudCopiar},${longitudCopiar}</b>
                    <br>

                    <button id="btnCopiar">
                    📋 Copiar
                    </button>
                </div>`
            )
            .on('popupclose', function () {

                mapa.removeLayer(marcadorActual);
                marcadorActual = null;

            })
            .openPopup();

        document.getElementById("btnCopiar").addEventListener("click", function () {

            navigator.clipboard.writeText(textoCopiar);
                .then(function () {

                const mensajeCopiado = document.getElementById("mensajeCopiado");

                mensajeCopiado.textContent = "Texto copiado";
                mensajeCopiado.style.display = "block";

                setTimeout(function () {

                    mensajeCopiado.style.display = "none";

                }, 2000);

            })
            .catch(function (error) {

                console.error("No se pudo copiar el texto:", error);
    
                const mensajeCopiado = document.getElementById("mensajeCopiado");
    
                mensajeCopiado.textContent = "Error: No se pudo copiar";
                mensajeCopiado.style.display = "block";
    
                setTimeout(function () {

                    mensajeCopiado.style.display = "none";

                }, 2000);

            });

        });

        mapa.setView(posicion, 15);

    } catch (error) {

        console.error("Error durante la búsqueda:", error);

    }
});

function mostrarModalError(mensaje) {

    const modal = document.getElementById("modalError");
    const mensajeModal = document.getElementById("mensajeModal");

    mensajeModal.textContent = mensaje;

    modal.style.display = "flex";
}

function cerrarModalError() {

    document.getElementById("modalError").style.display = "none";
}

document.getElementById("cerrarModal").addEventListener("click", function () {
    cerrarModalError();
});

document.getElementById("modalError").addEventListener("click", function (evento) {

    if (evento.target === this) {
        cerrarModalError();
    }

});

// ========================================
// GENERADOR DE TEXTO
// ========================================

const nombreInput = document.getElementById("nombre");
const librasInput = document.getElementById("libras");
const piesInput = document.getElementById("piesCubicos");


// Validación del nombre mientras se escribe
nombreInput.addEventListener("input", function () {

    // Eliminar espacios al inicio
    this.value = this.value.replace(/^\s+/, "");

    // Eliminar espacios al final
    this.value = this.value.replace(/\s+$/, "");

});


// Validación de libras mientras se escribe
librasInput.addEventListener("input", function () {

    // Permitir únicamente números
    this.value = this.value.replace(/\D/g, "");

});


// Validación de pies cúbicos mientras se escribe
piesInput.addEventListener("input", function () {

    // Permitir únicamente números
    this.value = this.value.replace(/\D/g, "");

});


// Generar texto
document.getElementById("btnCopiarMensaje").addEventListener("click", function () {

    const nombre = nombreInput.value;
    const libras = librasInput.value;
    const piesCubicos = piesInput.value;

    const mensajeCopiado = document.getElementById("mensajeCopiado");

    // Ocultar cualquier mensaje anterior
    mensajeCopiado.style.display = "none";


    // Validar campos
    if (nombre === "" || libras === "" || piesCubicos === "") {

        mensajeCopiado.textContent = "Error: Llene los datos";
        mensajeCopiado.style.display = "block";

        setTimeout(function () {

            mensajeCopiado.style.display = "none";

        }, 2000);

        return;
    }


    // Convertir valores a números
    const librasNumero = Number(libras);
    const piesCubicosNumero = Number(piesCubicos);


    // Cálculos
    const librasMaximas = librasNumero + 1;

    const precioMinimo = librasNumero * 8;
    const precioMaximo = precioMinimo + 8;

    const valorPiesCubicos = piesCubicosNumero * 32;


    // Texto temporal
    const texto = `Buenos días ${nombre}
Tenemos un paquete de ${librasNumero}-${librasMaximas} libras... aproximadamente serían $${precioMinimo}-${precioMaximo} dólares...
Vía marítima serían ${piesCubicosNumero} pies... con un valor de $${valorPiesCubicos} dólares...`;


    // Copiar al portapapeles
    navigator.clipboard.writeText(texto)

        .then(function () {

            mensajeCopiado.textContent = "Texto copiado";
            mensajeCopiado.style.display = "block";

            setTimeout(function () {

                mensajeCopiado.style.display = "none";

            }, 2000);

        })

        .catch(function (error) {

            console.error("No se pudo copiar el texto:", error);

            mensajeCopiado.textContent = "Error: No se pudo copiar";
            mensajeCopiado.style.display = "block";

            setTimeout(function () {

                mensajeCopiado.style.display = "none";

            }, 2000);

        });

});


// Limpiar campos
document.getElementById("btnLimpiarMensaje").addEventListener("click", function () {

    nombreInput.value = "";
    librasInput.value = "";
    piesInput.value = "";

    document.getElementById("mensajeCopiado").style.display = "none";

    nombreInput.focus();

});
