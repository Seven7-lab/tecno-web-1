const API_KEY = 'b6dd516c53da5eb99f9461cc4ef3b5a8'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');


// ============================================================================
// UTILIDADES DE UI (DADO - no modificar)
// ============================================================================
const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


// ============================================================================
// DARK MODE (DADO - no modificar)
// ============================================================================
const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();


// ############################################################################
// #                                                                          #
// #                          TU CÓDIGO AQUÍ                    #
// #                                                                          #
// ############################################################################
 
// 1. Carga inicial
const obtenerSeriesPopulares = async () => {
    mostrarLoading();
    try {
        const respuesta = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`);
        if (!respuesta.ok) {
            if (respuesta.status === 401) throw new Error('API Key inválida');
            throw new Error('Error en el servidor');
        }
        const datos = await respuesta.json();
        renderizarSeries(datos.results);
        resultsTitle.textContent = 'Series Populares';
        resultsCount.textContent = `${datos.results.length} series encontradas`;
        ocultarLoading();
    } catch (error) {
        if (error.message === 'API Key inválida') {
            mostrarError('API Key inválida');
        } else {
            mostrarError('Error de conexión');
        }
    }
};

// 2. Targeta de series
const renderizarSeries = (series) => {
    seriesGrid.innerHTML = '';
    if (series.length === 0) {
        seriesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No se encontraron series.</p>';
        return;
    }

    series.forEach(serie => {
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('serie-card');
        
        const anio = serie.first_air_date ? serie.first_air_date.split('-')[0] : 'Desconocido';
        const imagen = serie.poster_path ? `${IMAGE_URL}${serie.poster_path}` : 'https://via.placeholder.com/500x750?text=Sin+Imagen';

        tarjeta.innerHTML = `
            <div class="serie-card__poster">
                <img class="serie-card__image" src="${imagen}" alt="${serie.name}">
                <span class="serie-card__rating">⭐ ${serie.vote_average.toFixed(1)}</span>
            </div>
            <div class="serie-card__content">
                <h3 class="serie-card__title">${serie.name}</h3>
                <p class="serie-card__year">${anio}</p>
            </div>
        `;

        tarjeta.addEventListener('click', () => obtenerDetalleSerie(serie.id));
        seriesGrid.appendChild(tarjeta);
    });
};

// 3. Búsqueda
let timeoutId;
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(timeoutId);

    if (query === '') {
        obtenerSeriesPopulares();
        return;
    }

    timeoutId = setTimeout(async () => {
        mostrarLoading();
        //5. Manejo de Errores
        try {
            const respuesta = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`);
            if (!respuesta.ok) {
                if (respuesta.status === 401) throw new Error('API Key inválida');
                throw new Error('Error en el servidor');
            }
            const datos = await respuesta.json();
            renderizarSeries(datos.results);
            resultsTitle.textContent = `Resultados para: "${query}"`;
            resultsCount.textContent = `${datos.results.length} series encontradas`;
            ocultarLoading();
        } catch (error) {
            if (error.message === 'API Key inválida') {
                mostrarError('API Key inválida');
            } else {
                mostrarError('Error de conexión');
            }
        }
    }, 400);
});

// Botón Limpiar búsqueda
clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    obtenerSeriesPopulares();
});

// Botón Intentar de nuevo (Error)
retryBtn.addEventListener('click', () => {
    if (searchInput.value.trim() !== '') {
        searchInput.dispatchEvent(new Event('input'));
    } else {
        obtenerSeriesPopulares();
    }
});

// 4. Modal de detalle
const obtenerDetalleSerie = async (id) => {
    try {
        const respuesta = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`);
        if (!respuesta.ok) {
            if (respuesta.status === 401) throw new Error('API Key inválida');
            throw new Error('Error en el servidor');
        }
        const serie = await respuesta.json();
        
        const generos = serie.genres ? serie.genres.map(g => g.name).join(', ') : 'N/A';
        const posterModal = serie.poster_path ? `${IMAGE_URL}${serie.poster_path}` : '';

        modalBody.innerHTML = `
            <h2 class="modal__title">${serie.name}</h2>
            <p class="modal__subtitle">${serie.tagline || ''}</p>
            ${posterModal ? `<img src="${posterModal}" alt="${serie.name}" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px;">` : ''}
            <div class="modal__info">
                <span><strong>Estado:</strong> ${serie.status || 'N/A'}</span>
                <span><strong>Temporadas:</strong> ${serie.number_of_seasons || 0}</span>
                <span><strong>Episodios:</strong> ${serie.number_of_episodes || 0}</span>
                <span><strong>Géneros:</strong> ${generos}</span>
            </div>
            <p class="modal__overview"><strong>Sinopsis:</strong> ${serie.overview || 'Sin descripción disponible.'}</p>
        `;

        modal.classList.add('modal--show');
    } catch (error) {
        if (error.message === 'API Key inválida') {
            alert('API Key inválida');
        } else {
            alert('Error de conexión');
        }
    }
};

const cerrarModalFunc = () => {
    modal.classList.remove('modal--show');
};

modalClose.addEventListener('click', cerrarModalFunc);
modalOverlay.addEventListener('click', cerrarModalFunc);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModalFunc();
});

obtenerSeriesPopulares();