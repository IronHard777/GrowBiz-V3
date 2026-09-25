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
  const action = body.action || (mediaType === "REELS" ? "create" : "all");
  const containerId = body.containerId || "";

  if (!accessToken || !igUserId) {
    res.status(401).json({ erro: "Sessao Instagram ausente. Conecte a conta novamente." });
    return;
  }

  try {
    if (action === "status") {
      if (!containerId) {
        res.status(400).json({ erro: "containerId obrigatorio para status." });
        return;
      }
      const stRes = await fetch(
        "https://graph.facebook.com/v21.0/" + encodeURIComponent(containerId) +
          "?fields=status_code,status&access_token=" + encodeURIComponent(accessToken)
      );
      const stJson = await stRes.json();
      if (!stRes.ok) {
        res.status(stRes.status || 502).json({
          erro: (stJson.error && stJson.error.message) || "Falha ao consultar status do container."
        });
        return;
      }
      res.status(200).json({
        ok: true,
        status_code: stJson.status_code || "",
        status: stJson.status || ""
      });
      return;
    }

    if (action === "publish") {
      if (!containerId) {
        res.status(400).json({ erro: "containerId obrigatorio para publish." });
        return;
      }
      const pubParams = new URLSearchParams();
      pubParams.set("creation_id", containerId);
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
      res.status(200).json({ ok: true, mediaId: pubJson.id, containerId, mediaType });
      return;
    }

    // create (or all for IMAGE)
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
    if (mediaType === "REELS" && !pareceVideo) {
      res.status(400).json({
        erro: "Para Reels a URL precisa ser de video publico (.mp4/.mov). URLs sem extensao de video sao rejeitadas."
      });
      return;
    }

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

    // IMAGE: publish immediately (fast). REELS: return container for client polling.
    if (mediaType === "REELS" || action === "create") {
      res.status(200).json({ ok: true, containerId: createJson.id, mediaType, precisaProcessar: mediaType === "REELS" });
      return;
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
