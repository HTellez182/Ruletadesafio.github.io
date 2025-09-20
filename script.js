// ==================== INICIALIZACIÓN SEGURA ====================
function inicializarUsuarios() {
    const usuariosPorDefecto = [
        { usuario: "odin", password: "admin", nombre: "Odin", saldo: 9999, inventario: [], historialCompras: [], esAdmin: true },
        { usuario: "athena", password: "admin", nombre: "Athena", saldo: 8000, inventario: [], historialCompras: [], esAdmin: true },
        { usuario: "hugo", password: "123", nombre: "Hugo", saldo: 500, inventario: [], historialCompras: [], esAdmin: false },
        { usuario: "ivan", password: "456", nombre: "Ivan", saldo: 200, inventario: [], historialCompras: [], esAdmin: false }
    ];

    let usuariosGuardados;
    try {
        usuariosGuardados = JSON.parse(localStorage.getItem("usuarios"));
        if (!Array.isArray(usuariosGuardados) || usuariosGuardados.length === 0) {
            throw new Error("Usuarios inválidos");
        }
    } catch (e) {
        localStorage.setItem("usuarios", JSON.stringify(usuariosPorDefecto));
        usuariosGuardados = usuariosPorDefecto;
    }

    return usuariosGuardados;
}

let usuarios = inicializarUsuarios();
let usuarioActivo = null;

let productos = JSON.parse(localStorage.getItem("productos")) || [
    { id: 'item1', nombre: 'Poción', descripcion: 'Restaura 20 PS.', precio: 50 },
    { id: 'item2', nombre: 'Superpoción', descripcion: 'Restaura 50 PS.', precio: 40 },
    { id: 'item3', nombre: 'Poké Ball', descripcion: 'Para capturar Pokémon.', precio: 80 },
    { id: 'item4', nombre: 'Caramelo Raro', descripcion: 'Sube un nivel a tu Pokémon.', precio: 30 }
];

let premiosRuleta = JSON.parse(localStorage.getItem("premiosRuleta")) || productos.map(p => p.id);
let ruletaGirando = false;
let ruletaAngulo = 0;
let ruletaPremioIndex = 0;

// ==================== LOGIN ====================
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const usuarioInput = document.getElementById("usuario").value.trim();
    const passwordInput = document.getElementById("password").value.trim();
    const errorDiv = document.getElementById("error-message");

    const user = usuarios.find(u => u.usuario === usuarioInput && u.password === passwordInput);
    if (!user) {
        errorDiv.innerText = "Usuario o contraseña incorrectos.";
        errorDiv.classList.remove('hidden');
        return;
    }

    usuarioActivo = user;
    errorDiv.classList.add('hidden');

    document.getElementById("nombreUsuario").innerText = usuarioActivo.nombre;
    document.getElementById("saldo").innerText = usuarioActivo.saldo;

    document.getElementById("loginForm").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
});

// ==================== RULETA ====================
function dibujarRuleta(angulo = 0, highlightIndex = null) {
    const canvas = document.getElementById('canvasRuleta');
    const ctx = canvas.getContext('2d');
    const premios = premiosRuleta.map(id => productos.find(p => p.id === id)).filter(Boolean);
    const num = premios.length;
    const colors = ["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#F44336","#8BC34A","#00BCD4","#FFC107"];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for(let i=0; i<num; i++) {
        ctx.save();
        ctx.translate(200,200);
        ctx.rotate(angulo + (i*2*Math.PI/num));
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0,0,180, 0, 2*Math.PI/num);
        ctx.fillStyle = (highlightIndex === i) ? "#fff176" : colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.rotate(Math.PI/num);
        ctx.textAlign = "right";
        ctx.fillStyle = "#222";
        ctx.font = "bold 18px Arial";
        ctx.fillText(premios[i].nombre, 170, 10);
        ctx.restore();
    }

    // Indicador arriba
    ctx.save();
    ctx.translate(200, 20);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-20, -30);
    ctx.lineTo(20, -30);
    ctx.closePath();
    ctx.fillStyle = "#f44336";
    ctx.fill();
    ctx.restore();
}

document.getElementById('girarRuletaBtn').onclick = function() {
    if (ruletaGirando) return;
    const premios = premiosRuleta.map(id => productos.find(p => p.id === id)).filter(Boolean);
    if (premios.length === 0) {
        document.getElementById('premioRuleta').innerText = "No hay premios configurados.";
        return;
    }
    ruletaGirando = true;
    document.getElementById('premioRuleta').innerText = "";

    // Elegir premio
    ruletaPremioIndex = Math.floor(Math.random() * premios.length);
    const vueltas = 5 + Math.random() * 2;
    const anguloPorPremio = 2 * Math.PI / premios.length;
    const anguloFinal = (2 * Math.PI * vueltas) - (ruletaPremioIndex * anguloPorPremio) - anguloPorPremio/2;
    let start = null;
    let duracion = 3500;

    function animarRuleta(timestamp) {
        if (!start) start = timestamp;
        let progreso = (timestamp - start) / duracion;
        if (progreso > 1) progreso = 1;
        let ease = 1 - Math.pow(1 - progreso, 3);
        ruletaAngulo = ease * anguloFinal;
        dibujarRuleta(ruletaAngulo);
        if (progreso < 1) {
            requestAnimationFrame(animarRuleta);
        } else {
            dibujarRuleta(ruletaAngulo, ruletaPremioIndex);
            setTimeout(() => {
                const ganador = premios[ruletaPremioIndex];
                const premioDiv = document.getElementById('premioRuleta');
                premioDiv.innerText = `¡Ganaste: ${ganador.nombre}!`;
                premioDiv.classList.remove('premio-ganado-anim');
                // Forzar reflow para reiniciar animación si se gana varias veces
                void premioDiv.offsetWidth;
                premioDiv.classList.add('premio-ganado-anim');
                usuarioActivo.inventario.push(ganador);
                usuarioActivo.historialCompras.push({ item: ganador.nombre + " (Ruleta)", fecha: new Date().toLocaleString() });
                localStorage.setItem("usuarios", JSON.stringify(usuarios));
                ruletaGirando = false;
            }, 800);
        }
    }
    requestAnimationFrame(animarRuleta);
};

// Dibujar ruleta inicial
dibujarRuleta();