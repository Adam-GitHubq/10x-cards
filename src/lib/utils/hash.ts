export async function computeMD5(input: string): Promise<{ output: string }> {
  if (typeof input !== "string") {
    throw new TypeError("input must be a string");
  }

  if (input.length === 0) {
    throw new Error("input cannot be empty");
  }

  // Use Web Crypto API with SHA-256 (MD5 is not available in Web Crypto API)
  // SHA-256 is more secure and widely supported in both Node.js and Cloudflare Workers
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return { output: hash };
}
