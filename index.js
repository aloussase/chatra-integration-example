const sessions = new Map();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function sse(req) {
  const tienda = new URL(req.url).searchParams.get("tienda");
  const { signal } = req;
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(`data: OK\n\n`);
        sessions.set(tienda, controller);
        signal.onabort = () => {
          controller.close();
          sessions.delete(tienda);
        };
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...CORS_HEADERS,
      },
    }
  );
}

async function sendToTienda(message) {
  if (message.agents.length == 0) {
    const tienda = message.client.info?.tienda;
    console.log(`sending message to tienda: ${tienda}`);
    if (tienda && sessions.has(tienda)) {
      const controller = sessions.get(tienda);
      controller.enqueue(
        `data: ${JSON.stringify({
          type: "message",
          clientId: message.client.id,
          clientName: message.client.displayedName,
          text: message.messages?.[0].message || "",
        })}\n\n`
      );
    }
  }
  return new Response();
}

async function sendMessage(req) {
  const { clientId, text } = await req.json();
  await fetch("https://app.chatra.io/api/pushedMessages/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Chatra.Simple PcBfDQtcNQDeX7Tet:pYFsXHWA64rrNQvcCgWFyC9E2RFjwFk9Eiz3KmANFHBjE3nf`,
    },
    body: JSON.stringify({ clientId, text }),
  });
  return new Response(null, { headers: { ...CORS_HEADERS } });
}

Bun.serve({
  port: 3000,
  idleTimeout: 120,
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (new URL(req.url).pathname === "/reply") {
      return await sendMessage(req);
    }

    if (new URL(req.url).pathname === "/sse") {
      return await sse(req);
    }

    const message = await req.json();

    switch (message.eventName) {
      case "chatFragment":
        return await sendToTienda(message);
      default:
        return new Response();
    }
  },

  error(error) {
    console.log(error);
    return new Response();
  },
});
