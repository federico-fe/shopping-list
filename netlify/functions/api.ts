// netlify/functions/api.ts
import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
);

const json = (status: number, data: any) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(data),
});

export const handler: Handler = async (event) => {
  try {
    const { httpMethod, path, body } = event;
    const seg = path.replace("/.netlify/functions/api", "").split("/").filter(Boolean);

    if (httpMethod === "POST" && seg[0] === "lists" && seg.length === 1) {
      const { data, error } = await supabase.from("lists").insert({}).select("id").single();
      if (error) return json(500, { error: error.message });
      return json(200, { listId: data!.id });
    }

    if (httpMethod === "GET" && seg[0] === "lists" && seg[1]) {
      const listId = seg[1];
      const { data, error } = await supabase
        .from("items")
        .select("id,label,done,updated_at,qty")
        .eq("list_id", listId)
        .order("updated_at", { ascending: false });
      if (error) return json(500, { error: error.message });
      return json(200, { items: data ?? [] });
    }

    if (httpMethod === "POST" && seg[0] === "lists" && seg[1] && seg[2] === "items") {
      const listId = seg[1];
      const { label, qty } = JSON.parse(body || "{}");
      if (!label) return json(400, { error: "label required" });
      const toInsert: any = { list_id: listId, label, qty: typeof qty === "number" ? qty : 1 };
      const { data, error } = await supabase
        .from("items")
        .insert(toInsert)
        .select("id,label,done,updated_at,qty")
        .single();
      if (error) return json(500, { error: error.message });
      return json(200, { item: data });
    }

    if (httpMethod === "PATCH" && seg[0] === "lists" && seg[1] && seg[2] === "items" && seg[3]) {
      const [_, listId, __, itemId] = seg;
      const patch = JSON.parse(body || "{}");
      patch.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("items")
        .update(patch)
        .eq("id", itemId)
        .eq("list_id", listId)
        .select("id,label,done,updated_at,qty")
        .single();
      if (error) return json(500, { error: error.message });
      return json(200, { item: data });
    }

    if (httpMethod === "DELETE" && seg[0] === "lists" && seg[1] && seg[2] === "items" && seg[3]) {
      const [_, listId, __, itemId] = seg;
      const { error } = await supabase.from("items").delete().eq("id", itemId).eq("list_id", listId);
      if (error) return json(500, { error: error.message });
      return { statusCode: 204, body: "" };
    }

    return json(404, { error: "Not found" });
  } catch (e: any) {
    return json(500, { error: e.message || "Server error" });
  }
};
