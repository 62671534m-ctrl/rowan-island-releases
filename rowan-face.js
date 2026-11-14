/* ============================================================================
   ROWAN FACE — Motor de Rostro Animado 60 FPS & 100 Emociones Exactas
   Extraído de rowan/ui/index.html (Rowan Island v1.0)
   ============================================================================ */
(function (global) {
  'use strict';

  const EMOTIONS_CATALOG = {
  "Familia 1: Alegría, Éxito & Celebración (15)": [
    {
      "name": "happy",
      "icon": "😊",
      "desc": "Sonrisa suave (⌒ ⌒), arco superior",
      "shape": "rainbow",
      "h": 26,
      "w": 18,
      "rot": 12,
      "transY": -4,
      "aura": "rgba(254, 240, 138, 0.22)"
    },
    {
      "name": "cheerful",
      "icon": "😄",
      "desc": "Rebote elástico y aura dorada",
      "shape": "rainbow",
      "h": 32,
      "w": 18,
      "rot": 8,
      "anim": "anim-bounce",
      "aura": "rgba(250, 204, 21, 0.28)"
    },
    {
      "name": "ecstatic",
      "icon": "✨",
      "desc": "Chevrons agudos (^ ^) y rebote",
      "shape": "chevron",
      "h": 26,
      "w": 18,
      "rot": 22,
      "transY": -6,
      "anim": "anim-bounce",
      "aura": "rgba(251, 191, 36, 0.3)"
    },
    {
      "name": "laughing",
      "icon": "😆",
      "desc": "Temblor alegre de risa",
      "shape": "rainbow",
      "h": 22,
      "w": 20,
      "rot": 14,
      "anim": "anim-laugh",
      "aura": "rgba(253, 224, 71, 0.28)"
    },
    {
      "name": "giggle",
      "icon": "🤭",
      "desc": "Guiño travieso con micro-vibración",
      "shape": "asym_wink",
      "h": 26,
      "anim": "anim-vibe",
      "aura": "rgba(244, 114, 182, 0.24)"
    },
    {
      "name": "proud",
      "icon": "😌",
      "desc": "Ojos erguidos, ladeo exterior y elevación",
      "shape": "rainbow",
      "h": 42,
      "rot": -8,
      "transY": -6,
      "aura": "rgba(167, 243, 208, 0.24)"
    },
    {
      "name": "victorious",
      "icon": "🏆",
      "desc": "Chevrons (^ ^) y destello triunfal",
      "shape": "chevron",
      "h": 30,
      "w": 18,
      "rot": 24,
      "transY": -8,
      "aura": "rgba(251, 191, 36, 0.38)"
    },
    {
      "name": "party",
      "icon": "🎉",
      "desc": "Vaivén festivo y ondas de brillo",
      "shape": "chevron",
      "h": 32,
      "anim": "anim-party",
      "aura": "rgba(244, 63, 94, 0.3)"
    },
    {
      "name": "grateful",
      "icon": "🌸",
      "desc": "Mirada dulce marfil y parpadeo lento",
      "shape": "rainbow",
      "h": 32,
      "w": 16,
      "transY": 2,
      "aura": "rgba(254, 243, 199, 0.25)"
    },
    {
      "name": "greeting",
      "icon": "👋",
      "desc": "Doble rebote elástico de bienvenida",
      "shape": "greeting",
      "h": 46,
      "w": 17,
      "anim": "anim-bounce",
      "aura": "rgba(243, 242, 238, 0.26)"
    },
    {
      "name": "playful",
      "icon": "😜",
      "desc": "Alternancia de salto asimétrico",
      "shape": "rainbow",
      "h": 34,
      "animSocket": "anim-hop",
      "aura": "rgba(232, 121, 249, 0.24)"
    },
    {
      "name": "excited",
      "icon": "🤩",
      "desc": "Cápsulas agrandadas vibrando",
      "shape": "pill",
      "h": 54,
      "w": 20,
      "anim": "anim-vibe",
      "aura": "rgba(250, 204, 21, 0.32)"
    },
    {
      "name": "beaming",
      "icon": "🌟",
      "desc": "Ultra-brillantes con resplandor amplio",
      "shape": "rainbow",
      "h": 36,
      "w": 18,
      "rot": 6,
      "aura": "rgba(255, 255, 255, 0.42)"
    },
    {
      "name": "delighted",
      "icon": "🥰",
      "desc": "Micro-arqueo hacia arriba y aura ámbar",
      "shape": "rainbow",
      "h": 28,
      "w": 17,
      "transY": -4,
      "rot": 9,
      "aura": "rgba(245, 158, 11, 0.25)"
    },
    {
      "name": "optimistic",
      "icon": "🚀",
      "desc": "Cápsulas alargadas hacia arriba",
      "shape": "pill",
      "h": 50,
      "w": 16,
      "transY": -5,
      "aura": "rgba(52, 211, 153, 0.25)"
    }
  ],
  "Familia 2: Curiosidad, Intelecto & Enfoque (15)": [
    {
      "name": "thinking",
      "icon": "🌊",
      "desc": "Asimétrico: izq plano, der arco (— ⌒)",
      "shape": "thinking_real",
      "h": 34,
      "aura": "rgba(56, 189, 248, 0.26)"
    },
    {
      "name": "focused",
      "icon": "🎯",
      "desc": "Hendiduras 6° hacia el centro, gap 16px",
      "shape": "focused",
      "h": 22,
      "w": 13,
      "gap": 16,
      "rot": 6,
      "aura": "rgba(96, 165, 250, 0.26)"
    },
    {
      "name": "curious",
      "icon": "🧐",
      "desc": "Ojo izq +8px y ladeo facial de 5°",
      "shape": "curious_tilt",
      "h": 42,
      "transYLeft": -8,
      "faceRot": 5,
      "aura": "rgba(251, 191, 36, 0.22)"
    },
    {
      "name": "analytical",
      "icon": "📊",
      "desc": "Barras horizontales escaneando",
      "shape": "slit",
      "h": 18,
      "w": 18,
      "animSocket": "anim-scan",
      "aura": "rgba(56, 189, 248, 0.28)"
    },
    {
      "name": "eureka",
      "icon": "💡",
      "desc": "Micro-salto con destello blanco intenso",
      "shape": "pill",
      "h": 56,
      "w": 20,
      "transY": -10,
      "aura": "rgba(255, 255, 255, 0.48)"
    },
    {
      "name": "calculating",
      "icon": "🧮",
      "desc": "Parpadeo alternado procesando",
      "shape": "calculating",
      "h": 26,
      "aura": "rgba(99, 102, 241, 0.25)"
    },
    {
      "name": "observing",
      "icon": "👁️",
      "desc": "Seguimiento horizontal fluido",
      "shape": "pill",
      "h": 36,
      "w": 16,
      "animSocket": "anim-scan",
      "aura": "rgba(45, 212, 191, 0.22)"
    },
    {
      "name": "intrigued",
      "icon": "🤨",
      "desc": "Ceja alzada asimétrica pulsante",
      "shape": "asym_tilt",
      "h": 40,
      "transYLeft": -6,
      "aura": "rgba(217, 119, 6, 0.24)"
    },
    {
      "name": "studious",
      "icon": "📖",
      "desc": "Rendijas horizontales ultra-estables",
      "shape": "slit",
      "h": 16,
      "w": 16,
      "aura": "rgba(148, 163, 184, 0.2)"
    },
    {
      "name": "brainstorming",
      "icon": "🧠",
      "desc": "Vibración con aura pulsante",
      "shape": "pill",
      "h": 44,
      "anim": "anim-vibe",
      "aura": "rgba(168, 85, 247, 0.35)"
    },
    {
      "name": "reading",
      "icon": "📑",
      "desc": "Lectura rítmica de izquierda a derecha",
      "shape": "slit",
      "h": 22,
      "w": 15,
      "animSocket": "anim-reading",
      "aura": "rgba(125, 211, 252, 0.22)"
    },
    {
      "name": "evaluating",
      "icon": "⚖️",
      "desc": "Un ojo más estrecho sopesando",
      "shape": "asym_weight",
      "h": 36,
      "aura": "rgba(148, 163, 184, 0.24)"
    },
    {
      "name": "puzzled",
      "icon": "❓",
      "desc": "Inclinación de cabeza y alturas dispares",
      "shape": "curious_tilt",
      "h": 38,
      "transYLeft": -10,
      "transYRight": 4,
      "faceRot": -7,
      "aura": "rgba(253, 224, 71, 0.2)"
    },
    {
      "name": "sharp",
      "icon": "🗡️",
      "desc": "Máxima altura con bordes hiper-definidos",
      "shape": "sharp",
      "h": 56,
      "w": 14,
      "aura": "rgba(243, 242, 238, 0.38)"
    },
    {
      "name": "detective",
      "icon": "🕵️",
      "desc": "Entrecerrados mirando esquina inferior",
      "shape": "slit",
      "h": 20,
      "transY": 7,
      "aura": "rgba(180, 83, 9, 0.22)"
    }
  ],
  "Familia 3: Picardía, Afecto & Complicidad (15)": [
    {
      "name": "amused",
      "icon": "😏",
      "desc": "Guiño pícaro clásico (guiño + sonrisa)",
      "shape": "asym_wink_smile",
      "h": 30,
      "aura": "rgba(244, 114, 182, 0.24)"
    },
    {
      "name": "smug",
      "icon": "😼",
      "desc": "Entrecerrados con superioridad amistosa",
      "shape": "slit",
      "h": 20,
      "rot": 10,
      "faceRot": 3,
      "aura": "rgba(251, 191, 36, 0.22)"
    },
    {
      "name": "winking",
      "icon": "😉",
      "desc": "Guiño rápido con rebote elástico",
      "shape": "winking_quick",
      "h": 36,
      "aura": "rgba(236, 72, 153, 0.22)"
    },
    {
      "name": "flirty",
      "icon": "😘",
      "desc": "Parpadeo coqueto y aura rosada",
      "shape": "rainbow",
      "h": 30,
      "rot": 8,
      "aura": "rgba(244, 114, 182, 0.3)"
    },
    {
      "name": "tsundere",
      "icon": "😒",
      "desc": "Inclinados hacia afuera mirando ladeado",
      "shape": "angry",
      "h": 26,
      "rot": 14,
      "faceRot": 6,
      "aura": "rgba(244, 63, 94, 0.22)"
    },
    {
      "name": "affectionate",
      "icon": "💌",
      "desc": "Arcos suaves con latido cardíaco tenue",
      "shape": "rainbow",
      "h": 28,
      "rot": 10,
      "anim": "anim-heartbeat",
      "aura": "rgba(251, 113, 133, 0.3)"
    },
    {
      "name": "bashful",
      "icon": "🙈",
      "desc": "Inclinación diagonal (/ \\) tímida",
      "shape": "puppy",
      "h": 30,
      "rot": -8,
      "transY": 5,
      "aura": "rgba(253, 164, 175, 0.22)"
    },
    {
      "name": "charming",
      "icon": "✨",
      "desc": "Mirada centrada con pulsación elegante",
      "shape": "pill",
      "h": 44,
      "anim": "anim-heartbeat",
      "aura": "rgba(216, 180, 254, 0.25)"
    },
    {
      "name": "teasing",
      "icon": "😋",
      "desc": "Guiño alternado con ladeo de cabeza",
      "shape": "asym_wink",
      "h": 32,
      "faceRot": -6,
      "aura": "rgba(244, 114, 182, 0.24)"
    },
    {
      "name": "sarcastic",
      "icon": "🙄",
      "desc": "Entrecerrados horizontales con ladeo 6°",
      "shape": "slit",
      "h": 18,
      "faceRot": 6,
      "transY": -4,
      "aura": "rgba(148, 163, 184, 0.18)"
    },
    {
      "name": "friendly",
      "icon": "🤝",
      "desc": "Cápsulas acogedoras con respiración armónica",
      "shape": "pill",
      "h": 42,
      "anim": "anim-zen",
      "aura": "rgba(254, 240, 138, 0.2)"
    },
    {
      "name": "cozy",
      "icon": "☕",
      "desc": "Cápsulas gorditas y redondeadas",
      "shape": "pill",
      "h": 34,
      "w": 22,
      "aura": "rgba(253, 186, 116, 0.22)"
    },
    {
      "name": "tender",
      "icon": "🌿",
      "desc": "Mirada suave hacia abajo con descenso",
      "shape": "puppy",
      "h": 32,
      "transY": 6,
      "aura": "rgba(167, 243, 208, 0.2)"
    },
    {
      "name": "conspirator",
      "icon": "🤫",
      "desc": "Gap reducido a 12px compartiendo secreto",
      "shape": "slit",
      "h": 22,
      "gap": 12,
      "aura": "rgba(192, 132, 252, 0.24)"
    },
    {
      "name": "reassured",
      "icon": "🕊️",
      "desc": "Parpadeo largo de alivio y confianza",
      "shape": "rainbow",
      "h": 32,
      "aura": "rgba(147, 197, 253, 0.22)"
    }
  ],
  "Familia 4: Vulnerabilidad, Tristeza & Empatía (15)": [
    {
      "name": "puppy_eyes",
      "icon": "🥺",
      "desc": "Inclinación (/ \\) dilatada y vidriosa",
      "shape": "puppy",
      "h": 46,
      "w": 20,
      "rot": -14,
      "aura": "rgba(251, 191, 36, 0.2)"
    },
    {
      "name": "sympathetic",
      "icon": "🫂",
      "desc": "Mirada comprensiva hacia abajo",
      "shape": "puppy",
      "h": 38,
      "rot": 10,
      "transY": 4,
      "aura": "rgba(253, 224, 71, 0.2)"
    },
    {
      "name": "pleading",
      "icon": "🙏",
      "desc": "Cápsulas en (/ \\) con micro-temblor",
      "shape": "puppy",
      "h": 36,
      "rot": -12,
      "anim": "anim-vibe",
      "aura": "rgba(244, 114, 182, 0.22)"
    },
    {
      "name": "sad",
      "icon": "😢",
      "desc": "Cápsulas caídas en altura y aura tenue",
      "shape": "puppy",
      "h": 24,
      "rot": 8,
      "transY": 7,
      "opacity": 0.7,
      "aura": "rgba(96, 165, 250, 0.16)"
    },
    {
      "name": "crying",
      "icon": "😭",
      "desc": "Micro-gota de luz desprendiéndose",
      "shape": "puppy",
      "h": 28,
      "rot": 10,
      "transY": 6,
      "anim": "anim-crying",
      "aura": "rgba(147, 197, 253, 0.3)"
    },
    {
      "name": "heartbroken",
      "icon": "💔",
      "desc": "Tiemblan levemente con aura fría azulada",
      "shape": "puppy",
      "h": 26,
      "rot": 6,
      "anim": "anim-vibe",
      "aura": "rgba(59, 130, 246, 0.28)"
    },
    {
      "name": "shy",
      "icon": "👉👈",
      "desc": "Ojos retraídos, gap estrecho y mirada baja",
      "shape": "puppy",
      "h": 22,
      "w": 12,
      "gap": 14,
      "transY": 8,
      "aura": "rgba(244, 114, 182, 0.18)"
    },
    {
      "name": "apologetic",
      "icon": "🙇",
      "desc": "Reverencia suave y desplazamiento en Y",
      "shape": "puppy",
      "h": 28,
      "transY": 10,
      "aura": "rgba(203, 213, 225, 0.18)"
    },
    {
      "name": "melancholy",
      "icon": "🌧️",
      "desc": "Ojos lánguidos con parpadeo pesado",
      "shape": "slit",
      "h": 14,
      "w": 18,
      "transY": 4,
      "aura": "rgba(100, 116, 139, 0.15)"
    },
    {
      "name": "comforting",
      "icon": "🤍",
      "desc": "Ondulación suave como un abrazo visual",
      "shape": "rainbow",
      "h": 34,
      "animSocket": "anim-scan",
      "aura": "rgba(243, 242, 238, 0.24)"
    },
    {
      "name": "lonely",
      "icon": "🍂",
      "desc": "Ojos separados con mínima luminosidad",
      "shape": "slit",
      "h": 16,
      "gap": 34,
      "opacity": 0.5,
      "aura": "rgba(71, 85, 105, 0.1)"
    },
    {
      "name": "disappointed",
      "icon": "😞",
      "desc": "Encogiéndose verticalmente con descenso seco",
      "shape": "slit",
      "h": 12,
      "transY": 8,
      "aura": "rgba(148, 163, 184, 0.12)"
    },
    {
      "name": "vulnerable",
      "icon": "🫧",
      "desc": "Translúcidas al 60% y formas frágiles",
      "shape": "pill",
      "h": 30,
      "w": 14,
      "opacity": 0.6,
      "aura": "rgba(186, 230, 253, 0.18)"
    },
    {
      "name": "forgiving",
      "icon": "🤲",
      "desc": "Apertura suave y luminosa",
      "shape": "rainbow",
      "h": 38,
      "w": 18,
      "transY": -2,
      "aura": "rgba(254, 240, 138, 0.26)"
    },
    {
      "name": "nostalgic",
      "icon": "🌌",
      "desc": "Mirada perdida arriba a la derecha",
      "shape": "pill",
      "h": 34,
      "transY": -7,
      "faceRot": 5,
      "aura": "rgba(199, 210, 254, 0.2)"
    }
  ],
  "Familia 5: Intensidad, Determinación & Tensión (15)": [
    {
      "name": "determined",
      "icon": "⚔️",
      "desc": "Inclinación agresiva (\\ /) fija",
      "shape": "angry",
      "h": 34,
      "rot": 14,
      "aura": "rgba(239, 68, 68, 0.28)"
    },
    {
      "name": "angry",
      "icon": "💢",
      "desc": "Diagonal (/ ) marcada y aura roja",
      "shape": "angry",
      "h": 32,
      "rot": -22,
      "anim": "anim-vibe",
      "aura": "rgba(239, 68, 68, 0.42)"
    },
    {
      "name": "annoyed",
      "icon": "😤",
      "desc": "Un ojo plano y el otro ladeado",
      "shape": "asym_tilt",
      "h": 22,
      "rot": 12,
      "aura": "rgba(249, 115, 22, 0.28)"
    },
    {
      "name": "glare",
      "icon": "😠",
      "desc": "Rendijas hiper-estrechas fijas",
      "shape": "slit",
      "h": 10,
      "w": 18,
      "rot": -8,
      "aura": "rgba(220, 38, 38, 0.32)"
    },
    {
      "name": "fierce",
      "icon": "🦁",
      "desc": "Ojos anchos con inclinación filosa",
      "shape": "angry",
      "h": 36,
      "w": 19,
      "rot": -18,
      "aura": "rgba(244, 63, 94, 0.36)"
    },
    {
      "name": "frustrated",
      "icon": "🤦",
      "desc": "Headshake lateral rápido de 'no puede ser'",
      "shape": "angry",
      "h": 28,
      "rot": -12,
      "animSocket": "anim-headshake",
      "aura": "rgba(239, 68, 68, 0.34)"
    },
    {
      "name": "impatient",
      "icon": "⏱️",
      "desc": "Golpeteo rítmico vertical de una cápsula",
      "shape": "asym_tilt",
      "h": 30,
      "animRight": "anim-tap-right",
      "aura": "rgba(249, 115, 22, 0.24)"
    },
    {
      "name": "defiant",
      "icon": "✊",
      "desc": "Elevación con ojos entrecerrados pero altos",
      "shape": "slit",
      "h": 22,
      "transY": -8,
      "rot": 8,
      "aura": "rgba(245, 158, 11, 0.3)"
    },
    {
      "name": "protective",
      "icon": "🛡️",
      "desc": "Cápsulas firmes con escudo brillante",
      "shape": "pill",
      "h": 46,
      "w": 20,
      "aura": "rgba(59, 130, 246, 0.35)"
    },
    {
      "name": "rebellious",
      "icon": "⚡",
      "desc": "Inclinación asimétrica desafiante",
      "shape": "asym_tilt",
      "h": 36,
      "rot": 15,
      "faceRot": -6,
      "aura": "rgba(236, 72, 153, 0.32)"
    },
    {
      "name": "serious",
      "icon": "🗿",
      "desc": "Hendiduras sobrias sin movimiento",
      "shape": "slit",
      "h": 20,
      "w": 16,
      "aura": "rgba(148, 163, 184, 0.2)"
    },
    {
      "name": "overheated",
      "icon": "🔥",
      "desc": "Parpadeo rápido y alarma térmica roja",
      "shape": "pill",
      "h": 42,
      "anim": "anim-vibe",
      "aura": "rgba(220, 38, 38, 0.48)"
    },
    {
      "name": "stubborn",
      "icon": "🧱",
      "desc": "Ojos apretados que no se mueven",
      "shape": "slit",
      "h": 12,
      "w": 18,
      "aura": "rgba(217, 119, 6, 0.25)"
    },
    {
      "name": "commanding",
      "icon": "👑",
      "desc": "Grandes y autoritarios con resplandor nítido",
      "shape": "pill",
      "h": 54,
      "w": 18,
      "aura": "rgba(243, 242, 238, 0.4)"
    },
    {
      "name": "hyperfocus",
      "icon": "🎯",
      "desc": "Ultra-delgadas con brillo concentrado",
      "shape": "slit",
      "h": 28,
      "w": 10,
      "gap": 14,
      "aura": "rgba(56, 189, 248, 0.35)"
    }
  ],
  "Familia 6: Asombro, Confusión & Glitch (15)": [
    {
      "name": "surprised",
      "icon": "😲",
      "desc": "Agrandados (24x56) y destello en aura",
      "shape": "pill",
      "h": 56,
      "w": 24,
      "aura": "rgba(255, 255, 255, 0.45)"
    },
    {
      "name": "confused",
      "icon": "🤨",
      "desc": "Arqueo asimétrico y ladeo de 5°",
      "shape": "asym_tilt",
      "h": 42,
      "transYLeft": -8,
      "faceRot": 5,
      "aura": "rgba(251, 191, 36, 0.24)"
    },
    {
      "name": "shocked",
      "icon": "😱",
      "desc": "Abiertos temblando con respiración contenida",
      "shape": "pill",
      "h": 58,
      "w": 22,
      "anim": "anim-vibe",
      "aura": "rgba(239, 68, 68, 0.35)"
    },
    {
      "name": "mindblown",
      "icon": "🤯",
      "desc": "Expansión rápida con halo explosivo suave",
      "shape": "pill",
      "h": 62,
      "w": 26,
      "aura": "rgba(251, 191, 36, 0.5)"
    },
    {
      "name": "dizzy",
      "icon": "💫",
      "desc": "Oscilación contraria o tambaleo",
      "shape": "pill",
      "h": 36,
      "w": 18,
      "animLeft": "anim-dizzy-left",
      "animRight": "anim-dizzy-right",
      "aura": "rgba(192, 132, 252, 0.28)"
    },
    {
      "name": "hypnotized",
      "icon": "😵💫",
      "desc": "Movimiento sinusoidal continuo",
      "shape": "olitas",
      "h": 36,
      "aura": "rgba(232, 121, 249, 0.3)"
    },
    {
      "name": "glitch",
      "icon": "⚡",
      "desc": "Desfase horizontal y chromatic glitch",
      "shape": "pill",
      "h": 42,
      "anim": "anim-glitch",
      "aura": "rgba(236, 72, 153, 0.45)"
    },
    {
      "name": "paranoid",
      "icon": "👀",
      "desc": "Mirando frenéticamente a ambos lados",
      "shape": "pill",
      "h": 40,
      "animSocket": "anim-paranoid",
      "aura": "rgba(245, 158, 11, 0.3)"
    },
    {
      "name": "skeptical",
      "icon": "🧐",
      "desc": "Un ojo muy achinado mirando con recelo",
      "shape": "asym_tilt",
      "h": 44,
      "hRight": 16,
      "aura": "rgba(161, 161, 170, 0.22)"
    },
    {
      "name": "speechless",
      "icon": "😶",
      "desc": "Congeladas a media altura sin parpadear",
      "shape": "pill",
      "h": 32,
      "aura": "rgba(243, 242, 238, 0.2)"
    },
    {
      "name": "baffled",
      "icon": "🌀",
      "desc": "Desalineados verticalmente con aura confusa",
      "shape": "asym_tilt",
      "h": 42,
      "transYLeft": -10,
      "transYRight": 8,
      "aura": "rgba(125, 211, 252, 0.25)"
    },
    {
      "name": "startled",
      "icon": "⚡",
      "desc": "Salto de 10px arriba y encogimiento",
      "shape": "pill",
      "h": 52,
      "transY": -10,
      "anim": "anim-bounce",
      "aura": "rgba(250, 204, 21, 0.35)"
    },
    {
      "name": "overloaded",
      "icon": "💥",
      "desc": "Parpadeo caótico alternante",
      "shape": "calculating",
      "h": 38,
      "anim": "anim-vibe",
      "aura": "rgba(239, 68, 68, 0.38)"
    },
    {
      "name": "disoriented",
      "icon": "😵",
      "desc": "Balanceo lento buscando equilibrio",
      "shape": "asym_tilt",
      "h": 34,
      "faceRot": -8,
      "animSocket": "anim-headshake",
      "aura": "rgba(168, 85, 247, 0.25)"
    },
    {
      "name": "clueless",
      "icon": "😶🌫️",
      "desc": "Redondeadas vacías mirando al infinito",
      "shape": "pill",
      "h": 26,
      "w": 26,
      "opacity": 0.7,
      "aura": "rgba(148, 163, 184, 0.16)"
    }
  ],
  "Familia 7: Calma, Sueño, Música & Standby (10)": [
    {
      "name": "groove",
      "icon": "🎵",
      "desc": "Head-bob squash & stretch a ~110 BPM",
      "shape": "groove",
      "h": 44,
      "anim": "anim-groove",
      "aura": "rgba(168, 85, 247, 0.32)"
    },
    {
      "name": "sleepy",
      "icon": "🥱",
      "desc": "Cápsulas al 25% de altura y parpadeo pesado",
      "shape": "sleepy",
      "h": 12,
      "transY": 7,
      "aura": "rgba(148, 163, 184, 0.12)"
    },
    {
      "name": "sleeping",
      "icon": "😴",
      "desc": "Rendijas estáticas con respiración profunda",
      "shape": "slit",
      "h": 6,
      "w": 18,
      "transY": 6,
      "anim": "anim-zen",
      "aura": "rgba(100, 116, 139, 0.1)"
    },
    {
      "name": "yawn",
      "icon": "🥱",
      "desc": "Se alargan verticalmente y luego se cierran",
      "shape": "pill",
      "h": 54,
      "anim": "anim-yawn",
      "aura": "rgba(253, 186, 116, 0.24)"
    },
    {
      "name": "zen",
      "icon": "🪨",
      "desc": "Respiración armónica de 4s y aura azulada",
      "shape": "pill",
      "h": 36,
      "anim": "anim-zen",
      "aura": "rgba(147, 197, 253, 0.2)"
    },
    {
      "name": "meditating",
      "icon": "🧘",
      "desc": "Rendijas flotando con aura pacífica",
      "shape": "rainbow",
      "h": 20,
      "w": 18,
      "anim": "anim-zen",
      "aura": "rgba(167, 243, 208, 0.22)"
    },
    {
      "name": "low_battery",
      "icon": "🪫",
      "desc": "Hendiduras ultra-finas con puntos parpadeando",
      "shape": "standby",
      "h": 8,
      "eyeColor": "#fca5a5",
      "aura": "rgba(239, 68, 68, 0.2)"
    },
    {
      "name": "recharging",
      "icon": "🔋",
      "desc": "Llenándose de luz progresivamente",
      "shape": "pill",
      "h": 40,
      "anim": "anim-recharge",
      "eyeColor": "#a7f3d0",
      "aura": "rgba(16, 185, 129, 0.32)"
    },
    {
      "name": "standby",
      "icon": "⚪",
      "desc": "Hendiduras mínimas (— —) con sensores cian",
      "shape": "standby",
      "h": 10,
      "w": 18,
      "aura": "rgba(56, 189, 248, 0.18)"
    },
    {
      "name": "cyber",
      "icon": "🌐",
      "desc": "Destello futurista con micro-escaneo y aura fría",
      "shape": "slit",
      "h": 22,
      "w": 16,
      "animSocket": "anim-scan",
      "aura": "rgba(186, 230, 253, 0.32)"
    }
  ]
};

  const EMOTION_MAP = {};
  Object.values(EMOTIONS_CATALOG).forEach(fam => fam.forEach(e => { EMOTION_MAP[e.name] = e; }));

  const ALL_ANIM_CLASSES = [
    'anim-bounce', 'anim-laugh', 'anim-vibe', 'anim-glitch', 'anim-groove',
    'anim-scan', 'anim-reading', 'anim-headshake', 'anim-heartbeat', 'anim-zen',
    'anim-paranoid', 'anim-dizzy-left', 'anim-dizzy-right', 'anim-tap-right',
    'anim-hop-l', 'anim-hop-r', 'anim-party', 'anim-yawn', 'anim-recharge', 'anim-crying'
  ];

  function mount(hostEl, options = {}) {
    if (!hostEl) throw new Error('RowanFace.mount requiere un elemento contenedor');

    const notchMode = Boolean(options.notchMode);
    const trackMouse = options.trackMouse !== false;
    const autoReset = Boolean(options.autoReset);

    hostEl.innerHTML = `
      <div class="rowan-avatar-stage ${notchMode ? 'notch-mode' : ''}">
        <div class="rowan-eyes-container">
          <div class="ambient-glow"></div>
          <div class="eye-soundwave-ring"></div>
          <div class="eye-socket">
            <div class="sensor-dot sensor-dot-left"></div>
            <div class="rowan-eye rowan-eye-left"><div class="tear-drop"></div></div>
            <div class="rowan-eye rowan-eye-right"><div class="tear-drop"></div></div>
            <div class="sensor-dot sensor-dot-right"></div>
          </div>
        </div>
      </div>
    `;

    const stage = hostEl.querySelector('.rowan-avatar-stage');
    const eyesContainer = hostEl.querySelector('.rowan-eyes-container');
    const ambientAura = hostEl.querySelector('.ambient-glow');
    const eyeSocket = hostEl.querySelector('.eye-socket');
    const eyeLeft = hostEl.querySelector('.rowan-eye-left');
    const eyeRight = hostEl.querySelector('.rowan-eye-right');

    let isNotch = notchMode;
    let currentState = 'idle';
    let currentEmotion = null;
    let activeEmotion = null;
    let emotionStartTime = 0;
    let emotionTimer = null;

    let mouseX = global.innerWidth / 2;
    let mouseY = global.innerHeight / 2;
    let currentX = 0;
    let currentY = 0;

    let curLH = 44, curRH = 44;
    let curLW = 16, curRW = 16;
    let curLRot = 0, curRRot = 0;
    let curLY = 0, curRY = 0;
    let curGap = isNotch ? 15 : 24;
    let curFaceAngle = 0;
    let curOpacity = 1;

    let speakingWaveAngle = 0;
    let thinkingWaveAngle = 0;
    let lastFrameTs = performance.now();
    let rafId = null;
    let blinkTimeout = null;
    let destroyed = false;

    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    if (trackMouse) {
      global.addEventListener('mousemove', onMouseMove);
    }

    function clearAnimationClasses() {
      ALL_ANIM_CLASSES.forEach(c => {
        eyeLeft.classList.remove(c);
        eyeRight.classList.remove(c);
        eyeSocket.classList.remove(c);
      });
      eyeLeft.style.animation = '';
      eyeRight.style.animation = '';
      eyeSocket.style.animation = '';
    }

    function resetEmotion() {
      if (emotionTimer) clearTimeout(emotionTimer);
      clearAnimationClasses();
      activeEmotion = null;
      currentEmotion = null;
      eyesContainer.classList.remove('sensor-active');
      ambientAura.style.background = 'radial-gradient(ellipse at center, rgba(243, 242, 238, 0.06) 0%, transparent 75%)';
    }

    function setEmotion(name, duration = null) {
      if (!name || name === 'idle' || name === 'neutral') {
        resetEmotion();
        return null;
      }
      const preset = EMOTION_MAP[name] || { name, icon: '✨', desc: 'Custom', shape: 'pill', h: 44, aura: 'rgba(243,242,238,0.2)' };
      if (emotionTimer) clearTimeout(emotionTimer);
      clearAnimationClasses();

      activeEmotion = preset;
      currentEmotion = preset.name;
      emotionStartTime = performance.now();

      if (preset.shape === 'standby' || name === 'standby' || name === 'cyber' || name === 'low_battery') {
        eyesContainer.classList.add('sensor-active');
      } else {
        eyesContainer.classList.remove('sensor-active');
      }

      if (preset.anim) {
        eyeLeft.classList.add(preset.anim);
        eyeRight.classList.add(preset.anim);
      }
      if (preset.animLeft) eyeLeft.classList.add(preset.animLeft);
      if (preset.animRight) eyeRight.classList.add(preset.animRight);
      if (preset.animSocket) {
        if (preset.animSocket === 'anim-hop') {
          eyeLeft.classList.add('anim-hop-l');
          eyeRight.classList.add('anim-hop-r');
        } else {
          eyeSocket.classList.add(preset.animSocket);
        }
      }

      if (preset.aura) {
        ambientAura.style.background = `radial-gradient(ellipse at center, ${preset.aura} 0%, transparent 75%)`;
      }

      if (duration || autoReset) {
        const eff = duration || 5000;
        emotionTimer = setTimeout(() => resetEmotion(), eff);
      }
      return preset;
    }

    function setState(state) {
      currentState = state || 'idle';
      eyesContainer.classList.remove('speaking', 'listening', 'thinking');
      if (currentState === 'speak') eyesContainer.classList.add('speaking');
      if (currentState === 'listen') eyesContainer.classList.add('listening');
      if (currentState === 'think') eyesContainer.classList.add('thinking');
    }

    function setNotchMode(enabled) {
      isNotch = Boolean(enabled);
      stage.classList.toggle('notch-mode', isNotch);
    }

    function tick(timestamp) {
      if (destroyed) return;
      const now = timestamp || performance.now();
      const dt = Math.min(0.05, Math.max(0.004, (now - lastFrameTs) / 1000));
      lastFrameTs = now;

      const lerpStep = 1 - Math.exp(-9.2 * dt);
      const morphStep = 1 - Math.exp(-10.5 * dt);

      const maxX = isNotch ? 10 : 18;
      const maxY = isNotch ? 7 : 12;
      const rect = stage.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 || global.innerWidth / 2;
      const centerY = rect.top + rect.height / 2 || global.innerHeight / 2;

      const deltaX = (mouseX - centerX) / Math.max(1, global.innerWidth / 2);
      const deltaY = (mouseY - centerY) / Math.max(1, global.innerHeight / 2);
      const targetX = trackMouse ? Math.max(-1, Math.min(1, deltaX)) * maxX : 0;
      const targetY = trackMouse ? Math.max(-1, Math.min(1, deltaY)) * maxY : 0;

      currentX += (targetX - currentX) * lerpStep;
      currentY += (targetY - currentY) * lerpStep;

      let speechModulation = 0;
      if (currentState === 'speak') {
        speakingWaveAngle += 0.23;
        speechModulation = Math.sin(speakingWaveAngle) * 8;
      }

      let lH = 44, rH = 44, lW = 16, rW = 16;
      let lRot = 0, rRot = 0, lY = 0, rY = 0;
      let lRadius = '9999px', rRadius = '9999px';
      let socketGap = isNotch ? 15 : 24;
      let faceAngle = 0;
      let eyeColor = '#f3f2ee';
      let opacityVal = 1;

      thinkingWaveAngle += 0.065;
      const waveSin = Math.sin(thinkingWaveAngle);
      const waveL = (waveSin + 1) / 2;
      const waveR = (-waveSin + 1) / 2;

      const p = activeEmotion;
      const el = activeEmotion ? (now - emotionStartTime) / 1000 : 0;

      if (p) {
        if (p.h) { lH = p.h; rH = p.h; }
        if (p.w) { lW = p.w; rW = p.w; }
        if (p.gap) socketGap = p.gap;
        if (p.transY) { lY = p.transY; rY = p.transY; }
        if (p.transYLeft !== undefined) lY = p.transYLeft;
        if (p.transYRight !== undefined) rY = p.transYRight;
        if (p.hRight !== undefined) rH = p.hRight;
        if (p.faceRot) faceAngle = p.faceRot;
        if (p.eyeColor) eyeColor = p.eyeColor;
        if (p.opacity !== undefined) opacityVal = p.opacity;

        switch (p.shape) {
          case 'rainbow':
            lRadius = '20px 20px 6px 6px';
            rRadius = '20px 20px 6px 6px';
            lRot = -(p.rot || 10);
            rRot = (p.rot || 10);
            break;
          case 'chevron':
            lRadius = '9999px 9999px 4px 4px';
            rRadius = '9999px 9999px 4px 4px';
            lRot = -(p.rot || 20);
            rRot = (p.rot || 20);
            break;
          case 'thinking_real':
          case 'olitas':
          case 'wave':
            lW = 32 + waveL * 6;
            lH = 13 + waveL * 13;
            lY = -waveL * 9;
            lRadius = `${Math.round(14 + waveL * 14)}px ${Math.round(14 + waveL * 14)}px ${Math.round(14 - waveL * 6)}px ${Math.round(14 - waveL * 6)}px`;
            rW = 32 + waveR * 6;
            rH = 13 + waveR * 13;
            rY = -waveR * 9;
            rRadius = `${Math.round(14 + waveR * 14)}px ${Math.round(14 + waveR * 14)}px ${Math.round(14 - waveR * 6)}px ${Math.round(14 - waveR * 6)}px`;
            break;
          case 'focused':
            lRot = -(p.rot || 6);
            rRot = (p.rot || 6);
            break;
          case 'curious_tilt':
            lRot = -3;
            rRot = 3;
            break;
          case 'calculating': {
            const calcPhase = Math.sin(el * 14);
            lH = calcPhase > 0 ? (p.h || 26) : 8;
            rH = calcPhase <= 0 ? (p.h || 26) : 8;
            break;
          }
          case 'puppy':
            lRot = Math.abs(p.rot || 14);
            rRot = -Math.abs(p.rot || 14);
            break;
          case 'angry':
            lRot = -Math.abs(p.rot || 18);
            rRot = Math.abs(p.rot || 18);
            break;
          case 'slant':
            lRot = -24;
            rRot = 24;
            break;
          case 'slit':
          case 'standby':
            lH = p.h || 10;
            rH = p.h || 10;
            lW = p.w || 38;
            rW = p.w || 38;
            lRadius = '6px';
            rRadius = '6px';
            break;
          case 'sleepy':
            lH = p.h || 12;
            rH = p.h || 12;
            opacityVal = 0.7;
            break;
          case 'asym_wink_smile':
            lRadius = '20px 20px 6px 6px';
            lRot = -10;
            lH = p.h || 30;
            rH = 8;
            rRot = 6;
            break;
          case 'winking_quick':
            lH = p.h || 36;
            rH = Math.sin(el * 10) > 0 ? 6 : (p.h || 36);
            break;
          case 'asym_wink':
            lH = p.h || 36;
            rH = 10;
            rRot = 10;
            break;
          case 'asym_tilt':
            lRot = -(p.rot || 8);
            rRot = (p.rot ? p.rot * 0.4 : 4);
            break;
          case 'asym_weight':
            lW = 18; rW = 12; lH = 34; rH = 26;
            break;
          case 'sharp':
            lRadius = '2px'; rRadius = '2px';
            break;
          case 'groove': {
            const osc = Math.sin(el * 5.2);
            lH = 44 + osc * 3.5;
            rH = 44 + osc * 3.5;
            lY = osc * 1.8;
            rY = -osc * 1.8;
            break;
          }
          case 'greeting': {
            const b = Math.sin(el * 9) * 8;
            lY = -Math.abs(b);
            rY = -Math.abs(b);
            break;
          }
          default:
            if (p.rot) {
              lRot = p.rot;
              rRot = -p.rot;
            }
            break;
        }
      } else if (currentState === 'think') {
        lW = 32 + waveL * 6;
        lH = 13 + waveL * 13;
        lY = -waveL * 9;
        lRadius = `${Math.round(14 + waveL * 14)}px ${Math.round(14 + waveL * 14)}px ${Math.round(14 - waveL * 6)}px ${Math.round(14 - waveL * 6)}px`;
        rW = 32 + waveR * 6;
        rH = 13 + waveR * 13;
        rY = -waveR * 9;
        rRadius = `${Math.round(14 + waveR * 14)}px ${Math.round(14 + waveR * 14)}px ${Math.round(14 - waveR * 6)}px ${Math.round(14 - waveR * 6)}px`;
      }

      if (currentState === 'speak') {
        lH += speechModulation;
        rH += speechModulation;
      }

      curLH += (lH - curLH) * morphStep;
      curRH += (rH - curRH) * morphStep;
      curLW += (lW - curLW) * morphStep;
      curRW += (rW - curRW) * morphStep;
      curLRot += (lRot - curLRot) * morphStep;
      curRRot += (rRot - curRRot) * morphStep;
      curLY += (lY - curLY) * morphStep;
      curRY += (rY - curRY) * morphStep;
      curGap += (socketGap - curGap) * morphStep;
      curFaceAngle += (faceAngle - curFaceAngle) * morphStep;
      curOpacity += (opacityVal - curOpacity) * morphStep;

      eyeSocket.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) rotate(${curFaceAngle.toFixed(2)}deg)`;
      eyeSocket.style.gap = `${curGap.toFixed(1)}px`;

      if (!eyeLeft.classList.contains('blink')) {
        eyeLeft.style.height = `${Math.max(4, curLH).toFixed(2)}px`;
        eyeLeft.style.width = `${Math.max(6, curLW).toFixed(2)}px`;
        eyeLeft.style.borderRadius = lRadius;
        eyeLeft.style.backgroundColor = eyeColor;
        eyeLeft.style.opacity = curOpacity.toFixed(2);
        eyeLeft.style.transform = `translate3d(0, ${curLY.toFixed(2)}px, 0) rotate(${curLRot.toFixed(2)}deg)`;
      }

      if (!eyeRight.classList.contains('blink')) {
        eyeRight.style.height = `${Math.max(4, curRH).toFixed(2)}px`;
        eyeRight.style.width = `${Math.max(6, curRW).toFixed(2)}px`;
        eyeRight.style.borderRadius = rRadius;
        eyeRight.style.backgroundColor = eyeColor;
        eyeRight.style.opacity = curOpacity.toFixed(2);
        eyeRight.style.transform = `translate3d(0, ${curRY.toFixed(2)}px, 0) rotate(${curRRot.toFixed(2)}deg)`;
      }

      rafId = global.requestAnimationFrame(tick);
    }

    function scheduleBlink() {
      if (destroyed) return;
      const delay = Math.random() * 2600 + 2800;
      blinkTimeout = setTimeout(() => {
        if (destroyed) return;
        if (currentState !== 'think' && currentEmotion !== 'sleepy') {
          eyeLeft.classList.add('blink');
          eyeRight.classList.add('blink');
          setTimeout(() => {
            eyeLeft.classList.remove('blink');
            eyeRight.classList.remove('blink');
          }, 110);
        } else if (currentEmotion === 'sleepy') {
          eyeLeft.classList.add('blink');
          eyeRight.classList.add('blink');
          setTimeout(() => {
            eyeLeft.classList.remove('blink');
            eyeRight.classList.remove('blink');
          }, 320);
        }
        scheduleBlink();
      }, delay);
    }

    rafId = global.requestAnimationFrame(tick);
    scheduleBlink();

    return {
      setEmotion,
      resetEmotion,
      setState,
      setNotchMode,
      getCurrentEmotion: () => currentEmotion,
      destroy() {
        destroyed = true;
        if (rafId) global.cancelAnimationFrame(rafId);
        if (blinkTimeout) clearTimeout(blinkTimeout);
        if (emotionTimer) clearTimeout(emotionTimer);
        if (trackMouse) global.removeEventListener('mousemove', onMouseMove);
      }
    };
  }

  global.RowanFace = {
    EMOTIONS_CATALOG,
    EMOTION_MAP,
    mount
  };
})(window);
