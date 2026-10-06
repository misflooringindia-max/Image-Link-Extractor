// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// src/server/extractor.ts
var USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
function normalizeAjioUrl(input) {
  const trimmed = input.trim();
  if (/^\d{8,15}$/.test(trimmed)) {
    return {
      url: `https://www.ajio.com/p/${trimmed}`,
      code: trimmed
    };
  }
  const codeMatch = trimmed.match(/\/p\/([0-9a-zA-Z_-]+)/);
  const code = codeMatch ? codeMatch[1] : "";
  let url = trimmed;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return { url, code };
}
async function extractAjioProduct(inputUrl, sku) {
  const { url, code } = normalizeAjioUrl(inputUrl);
  if (!code && !url.includes("ajio.com")) {
    return {
      success: false,
      sku,
      productCode: code || "UNKNOWN",
      originalUrl: inputUrl,
      title: sku || "Invalid URL",
      primaryImage: "",
      standardImage: "",
      thumbnailImage: "",
      allImages: [],
      error: "Not a valid AJIO product URL or product code."
    };
  }
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      redirect: "follow"
    });
    if (!response.ok) {
      throw new Error(`AJIO server responded with HTTP status ${response.status}`);
    }
    const html = await response.text();
    const preloadedMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/);
    if (preloadedMatch) {
      try {
        const state = JSON.parse(preloadedMatch[1]);
        const details = state?.product?.productDetails;
        if (details) {
          const rawImages = Array.isArray(details.images) ? details.images : [];
          const allImages = [];
          let superZoomUrl = "";
          let standardUrl = "";
          let thumbnailUrl = "";
          for (const img of rawImages) {
            const imgUrl = img.url || "";
            if (!imgUrl) continue;
            const format = img.format || "";
            const type = img.imageType === "PRIMARY" ? "PRIMARY" : "GALLERY";
            const alt = img.altText || details.name;
            allImages.push({
              url: imgUrl,
              format,
              type,
              alt
            });
            if (type === "PRIMARY") {
              if (format === "superZoomPdp") superZoomUrl = imgUrl;
              if (format === "product") standardUrl = imgUrl;
              if (format === "mobileProductListingImage" || format === "thumbnail") {
                if (!thumbnailUrl) thumbnailUrl = imgUrl;
              }
            }
          }
          const primaryImage = superZoomUrl || standardUrl || allImages.find((i) => i.type === "PRIMARY")?.url || allImages[0]?.url || "";
          const finalStandard = standardUrl || superZoomUrl || primaryImage;
          const finalThumbnail = thumbnailUrl || finalStandard || primaryImage;
          return {
            success: Boolean(primaryImage),
            sku,
            productCode: details.code || code,
            originalUrl: inputUrl,
            title: details.name || sku || "AJIO Product",
            brand: details.brandName || "",
            color: details.baseOptions?.[0]?.selected?.color || "",
            price: details.price?.formattedValue || details.price?.displayformattedValue || "",
            mrp: details.wasPriceData?.formattedValue || "",
            primaryImage,
            standardImage: finalStandard,
            thumbnailImage: finalThumbnail,
            allImages
          };
        }
      } catch (jsonErr) {
      }
    }
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const ogImage = ogImageMatch ? ogImageMatch[1] : "";
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i) || html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const title = titleMatch ? titleMatch[1].replace(/ - AJIO.*/i, "").trim() : sku || "AJIO Product";
    let highRes = ogImage;
    if (highRes && highRes.includes("Wx") && highRes.includes("H-")) {
      highRes = highRes.replace(/-\d+Wx\d+H-/, "-1117Wx1400H-");
    }
    if (ogImage || highRes) {
      return {
        success: true,
        sku,
        productCode: code,
        originalUrl: inputUrl,
        title,
        primaryImage: highRes || ogImage,
        standardImage: ogImage,
        thumbnailImage: ogImage,
        allImages: [
          { url: highRes || ogImage, format: "superZoomPdp", type: "PRIMARY", alt: title }
        ]
      };
    }
    throw new Error("Could not find product image in AJIO page.");
  } catch (err) {
    return {
      success: false,
      sku,
      productCode: code || "UNKNOWN",
      originalUrl: inputUrl,
      title: sku || "Product",
      primaryImage: "",
      standardImage: "",
      thumbnailImage: "",
      allImages: [],
      error: err.message || "Failed to fetch AJIO product"
    };
  }
}

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var port = process.env.PORT || 3e3;
app.use(express.json({ limit: "10mb" }));
app.all("/api/extract", async (req, res) => {
  try {
    const url = req.query.url || req.body?.url;
    const sku = req.query.sku || req.body?.sku;
    if (!url) {
      return res.status(400).json({ success: false, error: "Product URL is required" });
    }
    const data = await extractAjioProduct(url, sku);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});
app.post("/api/extract-batch", async (req, res) => {
  try {
    const items = req.body?.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Array of items required" });
    }
    const batch = items.slice(0, 100);
    const results = [];
    const concurrency = 4;
    for (let i = 0; i < batch.length; i += concurrency) {
      const chunk = batch.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map((item) => extractAjioProduct(item.url, item.sku))
      );
      results.push(...chunkResults);
    }
    return res.json({ success: true, count: results.length, results });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Batch extraction error" });
  }
});
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.listen(port, () => {
  console.log(`AJIO Image Extractor server listening on port ${port}`);
});
