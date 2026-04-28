import fs from "fs";
import path from "path";

const COUNTER_FILE = path.join(process.cwd(), ".chatbot-counter.json");
const MAX_PEDIDOS = 1500;
const ALERTA_PEDIDOS = 1300;

interface CounterData {
  date: string; // "YYYY-MM-DD"
  count: number;
}

function loadCounter(): CounterData {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const raw = fs.readFileSync(COUNTER_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {}
  return { date: new Date().toISOString().slice(0, 10), count: 0 };
}

function saveCounter(data: CounterData) {
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(data));
}

export function incrementRequest(): { remaining: number; alert: boolean } {
  const data = loadCounter();
  const hoje = new Date().toISOString().slice(0, 10);

  // Se é um novo dia, reinicia o contador
  if (data.date !== hoje) {
    data.date = hoje;
    data.count = 0;
  }

  data.count++;
  saveCounter(data);

  const remaining = MAX_PEDIDOS - data.count;
  const alert = data.count >= ALERTA_PEDIDOS;

  return { remaining, alert };
}

export function getRemaining(): number {
  const data = loadCounter();
  const hoje = new Date().toISOString().slice(0, 10);
  if (data.date !== hoje) return MAX_PEDIDOS;
  return MAX_PEDIDOS - data.count;
}
