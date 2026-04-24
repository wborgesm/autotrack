import { NivelAcesso } from "@prisma/client";
import { registrarAuditoria } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao } from "@/lib/permissoes";
import { UnidadeMedida } from "@prisma/client";
import { z } from "zod";
import { writeFile, mkdir, rename, unlink } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!checkApiPermissao(session.user.nivel, "estoque")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const categoria = searchParams.get("categoria");
  const critico = searchParams.get("critico") === "true";

  const where: any = { tenantId, ativo: true };
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { codigo: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoria) where.categoria = categoria;
  if (critico) where.qtdEstoque = { lte: prisma.peca.fields.qtdMinima };

  const pecas = await prisma.peca.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  const categorias = await prisma.peca.groupBy({
    by: ["categoria"],
    where: { tenantId, ativo: true },
  });

  return NextResponse.json({ pecas, categorias: categorias.map(c => c.categoria).filter(Boolean) });
}

const pecaSchema = z.object({
  codigoBarras: z.string().optional(),
  nome: z.string().min(1),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  unidade: z.nativeEnum(UnidadeMedida).default(UnidadeMedida.UN),
  qtdEstoque: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().default(0)),
  qtdMinima: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().default(0)),
  custoPadrao: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
  precoVenda: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
  imagem: z.string().optional(),
});

const movimentoSchema = z.object({
  pecaId: z.string(),
  tipo: z.enum(["ENTRADA", "SAIDA", "AJUSTE"]),
  quantidade: z.number(),
  custo: z.number().optional(),
  observacoes: z.string().optional(),
  ordemId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!checkApiPermissao(session.user.nivel, "estoque")) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Movimentação de stock (se vier pecaId)
    if (body.pecaId) {
      const validated = movimentoSchema.parse(body);
      const peca = await prisma.peca.findFirst({ where: { id: validated.pecaId, tenantId } });
      if (!peca) return NextResponse.json({ error: "Peça não encontrada" }, { status: 404 });

      let novaQtd = peca.qtdEstoque.toNumber();
      if (validated.tipo === "ENTRADA") novaQtd += validated.quantidade;
      else if (validated.tipo === "SAIDA") {
        if (novaQtd < validated.quantidade) return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
        novaQtd -= validated.quantidade;
      } else if (validated.tipo === "AJUSTE") novaQtd = validated.quantidade;

      const [mov] = await prisma.$transaction([
        prisma.movimentoEstoque.create({
          data: {
            tenantId,
            pecaId: validated.pecaId,
            tipo: validated.tipo,
            quantidade: validated.quantidade,
            custo: validated.custo,
            observacoes: validated.observacoes,
            ordemId: validated.ordemId,
          },
        }),
        prisma.peca.update({
          where: { id: validated.pecaId },
          data: { qtdEstoque: novaQtd },
        }),
      ]);
      return NextResponse.json(mov, { status: 201 });
    }

    // Criação de peça
    const validated = pecaSchema.parse(body);

    // Gerar código sequencial automático (inteiro)
    const ultimo = await prisma.peca.findFirst({
      where: { tenantId },
      orderBy: { codigo: "desc" },
      select: { codigo: true },
    });
    const ultimoCodigo = ultimo?.codigo ? parseInt(ultimo.codigo, 10) || 0 : 0;
    const codigoGerado = (ultimoCodigo + 1).toString();

    // Calcular margem sobre o preço de venda (europeia)
    let margemLucro = undefined;
    if (validated.custoPadrao !== undefined && validated.precoVenda !== undefined && validated.precoVenda > 0) {
      margemLucro = ((validated.precoVenda - validated.custoPadrao) / validated.precoVenda) * 100;
    }

    let imagemTmp = validated.imagem || null;

    const peca = await prisma.peca.create({
      data: {
        tenantId,
        codigo: codigoGerado,
        codigoBarras: validated.codigoBarras,
        nome: validated.nome,
        descricao: validated.descricao,
        categoria: validated.categoria,
        unidade: validated.unidade,
        qtdEstoque: validated.qtdEstoque,
        qtdMinima: validated.qtdMinima,
        custoPadrao: validated.custoPadrao,
        precoVenda: validated.precoVenda,
        margemLucro,
      },
    });

    // Processar imagem temporária, se houver
    if (imagemTmp && imagemTmp.startsWith("/uploads/produtos/tmp/")) {
      const oldPath = path.join(process.cwd(), "public", imagemTmp);
      const ext = path.extname(imagemTmp).toLowerCase();
      const newFileName = `${peca.id}${ext}`;
      const newDir = path.join(process.cwd(), "public/uploads/produtos");
      const newPath = path.join(newDir, newFileName);
      const newUrl = `/uploads/produtos/${newFileName}`;

      try {
        await mkdir(newDir, { recursive: true });
        await rename(oldPath, newPath);
        await prisma.peca.update({ where: { id: peca.id }, data: { imagem: newUrl } });
        peca.imagem = newUrl;
      } catch (e) {
        console.error("Erro ao mover imagem:", e);
      }
    } else if (imagemTmp) {
      await prisma.peca.update({ where: { id: peca.id }, data: { imagem: imagemTmp } });
      peca.imagem = imagemTmp;
    }

    // Auditoria
    if (session.user.nivel === "ADMIN" || session.user.nivel === "SUPER_ADMIN") {
      await registrarAuditoria({
        tenantId,
        usuarioId: session.user.id,
        usuarioNome: session.user.name || session.user.email!,
        acao: "Criação de peça",
        entidade: "Peca",
        entidadeId: peca.id,
        dadosNovos: validated,
      });
    }

    return NextResponse.json(peca, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
