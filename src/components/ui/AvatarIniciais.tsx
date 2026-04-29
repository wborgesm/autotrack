function corPorNome(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

export function AvatarIniciais({ nome, tamanho = "md" }: { nome: string; tamanho?: "sm" | "md" | "lg" }) {
  const iniciais = nome
    .split(" ")
    .map(p => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizeMap = { sm: 24, md: 32, lg: 40 };
  const size = sizeMap[tamanho];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size, backgroundColor: corPorNome(nome), fontSize: size * 0.4 }}
    >
      {iniciais}
    </div>
  );
}
