const DECODER = new TextDecoder();
const json = JSON.parse(DECODER.decode(Deno.readFileSync("deno.json")));
const version = DECODER.decode(Deno.readFileSync("version.txt"));
json.version = version.trim();
Deno.writeFileSync(
  "deno.json",
  new TextEncoder().encode(JSON.stringify(json, null, 2) + "\n"),
);
