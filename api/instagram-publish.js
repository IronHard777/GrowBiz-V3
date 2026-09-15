export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ erro: "Method Not Allowed" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const accessToken = body.accessToken || "";
  const igUserId = body.igUserId || "";
  const caption = body.caption || "";
  const mediaUrl = body.mediaUrl || "";
  const mediaType = body.mediaType === "REELS" ? "REELS" : "IMAGE";

  if (!accessToken || !igUserId) {
    res.status(401).json({ erro: "Sessao Instagram ausente. Conecte a conta novamente." });
    return;
  }
  if (!mediaUrl || !/^https:\/\//i.test(mediaUrl)) {
    res.status(400).json({
      erro: "A Meta exige URL publica HTTPS da midia. Edite o card e cole uma URL https da imagem (Feed) ou do video (Reels)."
    });
    return;
  }

  const pareceImagem = /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(mediaUrl);
  const pareceVideo = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);
  if (mediaType === "REELS" && pareceImagem && !pareceVideo) {
    res.status(400).json({
      erro: "Este card e Instagram Reels, mas a URL parece uma imagem. Troque o canal para Instagram Feed ou cole uma URL HTTPS de video .mp4/.mov."
    });
    return;
  }

  try {
    const params = new URLSearchParams();
    params.set("caption", caption);
    params.set("access_token", accessToken);
    if (mediaType === "REELS") {
      params.set("media_type", "REELS");
      params.set("video_url", mediaUrl);
      params.set("share_to_feed", "true");
    } else {
      params.set("image_url", mediaUrl);
    }

    const createRes = await fetch(
      "https://graph.facebook.com/v21.0/" + encodeURIComponent(igUserId) + "/media",
      { method: "POST", body: params }
    );
    const createJson = await createRes.json();
    if (!createRes.ok || !createJson.id) {
      res.status(createRes.status || 502).json({
        erro: (createJson.error && createJson.error.message) || "Falha ao criar container de midia no Instagram."
      });
      return;
    }

    if (mediaType === "REELS") {
      let lastStatus = "";
      let lastDetail = "";
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const stRes = await fetch(
          "https://graph.facebook.com/v21.0/" + encodeURIComponent(createJson.id) +
            "?fields=status_code,status&access_token=" + encodeURIComponent(accessToken)
        );
        const stJson = await stRes.json();
        lastStatus = stJson.status_code || "";
        lastDetail = stJson.status || "";
        if (lastStatus === "FINISHED") break;
        if (lastStatus === "ERROR") {
          res.status(502).json({
            erro: "Processamento do Reel falhou no Instagram. " +
              (lastDetail || "Use uma URL HTTPS publica de video (.mp4/.mov), sem login, acessivel pela Meta.")
          });
          return;
        }
      }
      if (lastStatus && lastStatus !== "FINISHED") {
        res.status(504).json({
          erro: "Timeout aguardando o Instagram processar o Reel (status: " + lastStatus + "). Tente de novo."
        });
        return;
      }
    }

    const pubParams = new URLSearchParams();
    pubParams.set("creation_id", createJson.id);
    pubParams.set("access_token", accessToken);
    const pubRes = await fetch(
      "https://graph.facebook.com/v21.0/" + encodeURIComponent(igUserId) + "/media_publish",
      { method: "POST", body: pubParams }
    );
    const pubJson = await pubRes.json();
    if (!pubRes.ok || !pubJson.id) {
      res.status(pubRes.status || 502).json({
        erro: (pubJson.error && pubJson.error.message) || "Falha ao publicar no Instagram."
      });
      return;
    }

    res.status(200).json({ ok: true, mediaId: pubJson.id, containerId: createJson.id, mediaType });
  } catch (erro) {
    console.warn("instagram-publish falhou:", erro);
    res.status(502).json({ erro: "Erro interno ao publicar no Instagram." });
  }
}
