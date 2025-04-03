/**
 * Funciones de cálculo para la calculadora de sueldos HBL
 * + Lógica de interacción y animación de resultados.
 * + Muestra detalles de ISR e IMSS (redondeados).
 */

// --- Funciones Comunes (Cálculos) ---

/**
 * Calcula el Impuesto Sobre la Renta (ISR) mensual.
 * @param {number} sueldo - El sueldo bruto mensual.
 * @returns {number} El ISR mensual calculado, redondeado a 2 decimales.
 */
function calcularISR(sueldo) {
  // (Misma lógica de cálculo ISR que antes)
  const tramosISR = [
    { limite_inferior: 0.01,      cuota_fija: 0.00,      tasa: 0.0192 },
    { limite_inferior: 746.05,    cuota_fija: 14.32,     tasa: 0.0640 },
    { limite_inferior: 6332.06,   cuota_fija: 371.83,    tasa: 0.1088 },
    { limite_inferior: 11128.02,  cuota_fija: 893.63,    tasa: 0.16   },
    { limite_inferior: 12935.83,  cuota_fija: 1182.88,   tasa: 0.1792 },
    { limite_inferior: 15487.72,  cuota_fija: 1640.18,   tasa: 0.2136 },
    { limite_inferior: 31236.50,  cuota_fija: 5004.12,   tasa: 0.2352 },
    { limite_inferior: 49233.01,  cuota_fija: 9236.89,   tasa: 0.30   },
    { limite_inferior: 93993.91,  cuota_fija: 22665.17,  tasa: 0.32   },
    { limite_inferior: 125325.21, cuota_fija: 32691.18,  tasa: 0.34   },
    { limite_inferior: 375975.62, cuota_fija: 117912.32, tasa: 0.35   }
  ];
  let limiteInferior = 0, cuotaFija = 0, tasa = 0;
  for (let i = tramosISR.length - 1; i >= 0; i--) {
    if (sueldo >= tramosISR[i].limite_inferior) {
      limiteInferior = tramosISR[i].limite_inferior;
      cuotaFija = tramosISR[i].cuota_fija;
      tasa = tramosISR[i].tasa;
      break;
    }
  }
  const excedente = sueldo - limiteInferior;
  const impuestoMarginal = excedente * tasa;
  const isrCausado = impuestoMarginal + cuotaFija;
  return Math.round(isrCausado * 100) / 100; // Mantenemos precisión interna
}

/**
 * Calcula la cuota obrera del IMSS mensual usando factor de integración.
 * @param {number} sueldoMensual - El sueldo bruto mensual.
 * @param {number} [factorInteg=1.049031] - Factor de integración salarial.
 * @param {number} [diasCotizar=30] - Días a cotizar en el mes.
 * @returns {number} La cuota IMSS mensual calculada, redondeada a 2 decimales.
 */
function calcularImssFactorIntegre(sueldoMensual, factorInteg = 1.049031, diasCotizar = 30) {
   // (Misma lógica de cálculo IMSS que antes)
  const UMA = 113.14; // Valor UMA 2024 (Asegúrate que sea el valor vigente si cambia)
  const TASA_EXCEDENTE = 0.004;
  const TASA_PRESTACIONES_DINERO = 0.0025;
  const TASA_GASTOS_MEDICOS = 0.00375;
  const TASA_INVALIDEZ = 0.00625;
  const TASA_CESANTIA_VEJEZ = 0.01125;
  const TOPE_SBC_DIARIO = UMA * 25;

  const sueldoBaseDiario = sueldoMensual / 30.0;
  let SBCdiario = sueldoBaseDiario * factorInteg;
  SBCdiario = Math.min(SBCdiario, TOPE_SBC_DIARIO);

  const excedenteBase = Math.max(SBCdiario - (3 * UMA), 0);
  const cuotaExcedente = excedenteBase * TASA_EXCEDENTE * diasCotizar;
  const prestacionesDinero = SBCdiario * TASA_PRESTACIONES_DINERO * diasCotizar;
  const gastosMedicos = SBCdiario * TASA_GASTOS_MEDICOS * diasCotizar;
  const invalidez = SBCdiario * TASA_INVALIDEZ * diasCotizar;
  const cesantiaVejez = SBCdiario * TASA_CESANTIA_VEJEZ * diasCotizar;

  let imssTotal = cuotaExcedente + prestacionesDinero + gastosMedicos + invalidez + cesantiaVejez;
  return Math.round(imssTotal * 100) / 100; // Mantenemos precisión interna
}


// --- Cálculo: Bruto a Neto ---

/**
 * Calcula el sueldo neto, ISR e IMSS a partir del sueldo bruto.
 * @param {number} sueldoBruto - El sueldo bruto mensual.
 * @returns {object} Un objeto con { neto, isr, imss } o { neto: 0, isr: 0, imss: 0 } si la entrada es inválida.
 */
function calcularNetoDetallado(sueldoBruto) {
  if (isNaN(sueldoBruto) || sueldoBruto < 0) {
    return { neto: 0, isr: 0, imss: 0 };
  }
  const isr = calcularISR(sueldoBruto);
  const imss = calcularImssFactorIntegre(sueldoBruto);
  const neto = sueldoBruto - isr - imss;
  return {
    neto: Math.round(neto * 100) / 100, // Neto con decimales
    isr: isr, // ISR con decimales (para posible uso futuro)
    imss: imss // IMSS con decimales (para posible uso futuro)
  };
}

// --- Cálculo: Neto a Bruto ---

/**
 * Busca por bisección el sueldo bruto que produce un neto deseado.
 * (Esta función no necesita cambios para mostrar ISR/IMSS en el otro panel)
 * @param {number} netoDeseado - El sueldo neto mensual deseado.
 * @param {number} [maxBusqueda=1000000] - Límite superior para la búsqueda del bruto.
 * @returns {number} El sueldo bruto mensual aproximado, redondeado a 2 decimales.
 */
function sueldoBrutoDesdeNeto(netoDeseado, maxBusqueda = 1000000) {
  if (isNaN(netoDeseado) || netoDeseado <= 0) return 0;
  let low = netoDeseado, high = maxBusqueda, eps = 0.01, maxIteraciones = 100, iteraciones = 0;

  // Función interna para obtener neto desde bruto (evita recalcular ISR/IMSS innecesariamente)
  const getNeto = (bruto) => calcularNetoDetallado(bruto).neto;

  if (netoDeseado <= 0) return 0;
  const netoMaximo = getNeto(high);
  if (netoMaximo < netoDeseado) {
      console.warn(`Neto deseado ${netoDeseado} podría ser inalcanzable con límite ${maxBusqueda}. Neto máx: ${netoMaximo}. Aumentando límite.`);
      high = netoDeseado * 2.5; // Aumentar más el límite superior
      if (getNeto(high) < netoDeseado) {
          console.error("Neto deseado parece inalcanzable incluso con límite aumentado.");
          return NaN;
      }
  }
  while ((high - low) > eps && iteraciones < maxIteraciones) {
    const mid = low + (high - low) / 2;
    const netoMid = getNeto(mid);
    if (netoMid < netoDeseado) { low = mid; } else { high = mid; }
    iteraciones++;
  }
   if (iteraciones >= maxIteraciones) { console.warn("Máximo de iteraciones alcanzado (Neto a Bruto)."); }
  const brutoAproximado = (low + high) / 2;
  return parseFloat(brutoAproximado.toFixed(2));
}

// --- Funciones de Animación ---

/**
 * Aplica una clase de animación 'highlight' a un elemento y la quita después.
 * @param {HTMLElement} elemento - El elemento del DOM a animar.
 */
function animarResultado(elemento) {
    if (!elemento) return;
    elemento.classList.remove('highlight');
    void elemento.offsetWidth; // Forzar reflow
    elemento.classList.add('highlight');
    setTimeout(() => {
        elemento.classList.remove('highlight');
    }, 750); // Duración de la animación highlightResult (CSS)
}

/**
 * NUEVO: Hace visible un elemento añadiendo la clase 'visible'.
 * @param {HTMLElement} elemento - El elemento del DOM a hacer visible.
 */
function mostrarConAnimacion(elemento) {
    if (!elemento) return;
    // Asegura que la animación se ejecute cada vez
    elemento.classList.remove('visible');
    void elemento.offsetWidth; // Forzar reflow
    elemento.classList.add('visible');
}

// --- Conexión con el DOM y Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Cargado. Inicializando calculadora..."); // Log inicial

  // Elementos para Bruto a Neto
  const inputSueldoBruto = document.getElementById('sueldo-bruto');
  const btnCalcularNeto = document.getElementById('btn-calcular-neto');
  const resultadoNetoDisplay = document.getElementById('neto-calculado'); // ID actualizado
  const resultadoNetoContenedor = document.getElementById('resultado-neto'); // Contenedor para animar highlight
  // NUEVO: Elementos para mostrar ISR e IMSS
  const isrDisplay = document.getElementById('isr-calculado');
  const imssDisplay = document.getElementById('imss-calculado');
  const detalleIsrContenedor = document.getElementById('detalle-isr'); // Contenedor para animar fade-in
  const detalleImssContenedor = document.getElementById('detalle-imss'); // Contenedor para animar fade-in

  // Elementos para Neto a Bruto
  const inputSueldoNeto = document.getElementById('sueldo-neto');
  const btnCalcularBruto = document.getElementById('btn-calcular-bruto');
  const resultadoBrutoDisplay = document.getElementById('bruto-calculado'); // ID actualizado
  const resultadoBrutoContenedor = document.getElementById('resultado-bruto'); // Contenedor para animar highlight

  // --- Event Listener: Bruto a Neto ---
  if (btnCalcularNeto && inputSueldoBruto && resultadoNetoDisplay && resultadoNetoContenedor && isrDisplay && imssDisplay && detalleIsrContenedor && detalleImssContenedor) {
    console.log("Listener Bruto->Neto añadido (con detalles ISR/IMSS).");
    const calcularYMostrarNeto = () => {
      console.log("Calculando Neto y detalles...");
      const sueldoBruto = parseFloat(inputSueldoBruto.value);

      // Ocultar detalles previos antes de validar/calcular
      detalleIsrContenedor.classList.remove('visible');
      detalleImssContenedor.classList.remove('visible');
      isrDisplay.textContent = '-';
      imssDisplay.textContent = '-';

      if (isNaN(sueldoBruto) || sueldoBruto < 0) {
        resultadoNetoDisplay.textContent = 'Inválido';
        console.warn("Input Bruto inválido:", inputSueldoBruto.value);
        // No animar highlight si es inválido
        resultadoNetoContenedor.classList.remove('highlight');
        return;
      }

      console.log("Sueldo Bruto ingresado:", sueldoBruto);
      // Usar la función detallada
      const { neto, isr, imss } = calcularNetoDetallado(sueldoBruto);
      console.log("Neto calculado:", neto, "ISR:", isr, "IMSS:", imss);

      // Formatear y mostrar resultados
      // Formato para moneda con decimales (para el neto)
      const formatMXN = (value) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      // NUEVO: Formato para moneda SIN decimales (para ISR/IMSS)
      const formatMXNInteger = (value) => `$${Math.round(value).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

      resultadoNetoDisplay.textContent = formatMXN(neto);
      // Aplicar formato SIN decimales a ISR e IMSS
      isrDisplay.textContent = formatMXNInteger(isr);
      imssDisplay.textContent = formatMXNInteger(imss);

      // Animar el contenedor del resultado neto
      animarResultado(resultadoNetoContenedor);
      // NUEVO: Animar la aparición de los detalles ISR/IMSS
      mostrarConAnimacion(detalleIsrContenedor);
      mostrarConAnimacion(detalleImssContenedor);
    };

    btnCalcularNeto.addEventListener('click', calcularYMostrarNeto);
    inputSueldoBruto.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevenir envío de formulario si existiera
            calcularYMostrarNeto();
        }
    });
  } else {
    console.error("Error: Faltan elementos para Bruto a Neto o sus detalles.");
  }

  // --- Event Listener: Neto a Bruto ---
  if (btnCalcularBruto && inputSueldoNeto && resultadoBrutoDisplay && resultadoBrutoContenedor) {
     console.log("Listener Neto->Bruto añadido.");
     const calcularYMostrarBruto = () => {
        console.log("Calculando Bruto...");
        const netoDeseado = parseFloat(inputSueldoNeto.value);
        if (isNaN(netoDeseado) || netoDeseado <= 0) { // Neto debe ser positivo
            resultadoBrutoDisplay.textContent = 'Inválido';
            console.warn("Input Neto inválido:", inputSueldoNeto.value);
            // No animar highlight si es inválido
            resultadoBrutoContenedor.classList.remove('highlight');
            return;
        }
        console.log("Neto deseado ingresado:", netoDeseado);
        const brutoAprox = sueldoBrutoDesdeNeto(netoDeseado);
        console.log("Bruto aproximado calculado:", brutoAprox);

        if (isNaN(brutoAprox)) {
            resultadoBrutoDisplay.textContent = 'Inalcanzable';
            console.error("No se pudo calcular el Bruto para el Neto deseado.");
             // No animar highlight si es inalcanzable
            resultadoBrutoContenedor.classList.remove('highlight');
        } else {
             // Formato para moneda con decimales (para el bruto)
            const formatMXN = (value) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            resultadoBrutoDisplay.textContent = formatMXN(brutoAprox);
            // Animar el contenedor del resultado bruto
             animarResultado(resultadoBrutoContenedor);
        }
     };

    btnCalcularBruto.addEventListener('click', calcularYMostrarBruto);
    inputSueldoNeto.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
             event.preventDefault(); // Prevenir envío de formulario si existiera
            calcularYMostrarBruto();
        }
    });

  } else {
     console.error("Error: Faltan elementos para Neto a Bruto.");
  }

}); // Fin del DOMContentLoaded
