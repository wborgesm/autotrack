import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { mkdir, rename, unlink } from "fs/promises";
import path from "path";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;

  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const peca = await prisma.peca.findFirst({ where: { id: params.id, tenantId } });
    if (!peca) return NextResponse.json({ error: "Peça não encontrada" }, { status: 404 });

    const {
      nome, descricao, categoria, unidade,
      qtdEstoque, qtdMinima, custoPadrao, precoVenda, imagem
    } = body;

    // Calcular margem automaticamente
    let margemLucro = peca.margemLucro?.toNumber() ?? null;
    if (custoPadrao !== undefined && precoVenda !== undefined && custoPadrao > 0) {
      margemLucro = ((precoVenda - custoPadrao) / precoVenda) * 100;
    }

    // Processar imagem temporária
    let novaImagem = imagem !== undefined ? imagem : peca.imagem;
    if (novaImagem && novaImagem.startsWith("/uploads/produtos/tmp/")) {
      const oldPath = path.join(process.cwd(), "public", novaImagem);
      const ext = path.extname(novaImagem).toLowerCase();
      const newFileName = `${params.id}${ext}`;
      const newDir = path.join(process.cwd(), "public/uploads/produtos");
      const newPath = path.join(newDir, newFileName);
      try {
        await mkdir(newDir, { recursive: true });
        await rename(oldPath, newPath);
        if (peca.imagem && peca.imagem !== novaImagem) {
          const oldImagePath = path.join(process.cwd(), "public", peca.imagem);
          await unlink(oldImagePath).catch(() => {});
        }
        novaImagem = `/uploads/produtos/${newFileName}`;
      } catch (e) {
        console.error("Erro ao mover imagem:", e);
      }
    }

    const updated = await prisma.peca.update({
      where: { id: params.id },
      data: {
        nome: nome !== undefined ? nome : undefined,
        descricao: descricao !== undefined ? descricao : undefined,
        categoria: categoria !== undefined ? categoria : undefined,
        unidade: unidade !== undefined ? unidade : undefined,
        qtdEstoque: qtdEstoque !== undefined ? qtdEstoque : undefined,
        qtdMinima: qtdMinima !== undefined ? qtdMinima : undefined,
        custoPadrao: custoPadrao !== undefined ? custoPadrao : undefined,
        ...(body.codigoBarras !== undefined ? { codigoBarras: body.codigoBarras }as any : {}),
        precoVenda: precoVenda !== undefined ? precoVenda : undefined,
        margemLucro: margemLucro !== null ? margemLucro : undefined,
        imagem: novaImagem !== undefined ? novaImagem : undefined,
      },
    });

    // Auditoria
    await registrarAuditoria({
      tenantId,
      usuarioId: session.user.id,
      usuarioNome: session.user.name || session.user.email!,
      acao: "Edição de peça",
      entidade: "Peca",
      entidadeId: peca.id,
      dadosAnteriores: {
        nome: peca.nome,
        qtdEstoque: peca.qtdEstoque.toNumber(),
        qtdMinima: peca.qtdMinima.toNumber(),
        custoPadrao: peca.custoPadrao?.toNumber(),
        precoVenda: peca.precoVenda?.toNumber(),
      },
      dadosNovos: {
        nome: updated.nome,
        qtdEstoque: updated.qtdEstoque.toNumber(),
        qtdMinima: updated.qtdMinima.toNumber(),
        custoPadrao: updated.custoPadrao?.toNumber(),
        precoVenda: updated.precoVenda?.toNumber(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
