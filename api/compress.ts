import sharp from "sharp"

export const runtime = "nodejs"

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "X-Original-Bytes, X-Compressed-Bytes"
}

export async function POST(req: Request) {

    const form = await req.formData()
    const file = form.get("image")
    const url = new URL(req.url)

    const widthParam = url.searchParams.get("width")
    const width = widthParam ? Math.floor(Number(widthParam)) : undefined
    const imageType = url.searchParams.get("imageType")

    let qualityGiven = clamp(Number(url.searchParams.get("quality") || 75), 1, 100)
    if (imageType === "image/png") {
        qualityGiven /= 10
    }

    if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({            
            error: "Missing Input"
        }), {
            headers: headers
        })
    }

    const input = Buffer.from(await file.arrayBuffer())
    let contentType = ""
    let out = await sharp(input)
        .rotate()
        .resize(width)
    if (imageType === "image/jpg" || imageType === "image/jpeg") {
        out.jpeg({mozjpeg: true, quality: qualityGiven})
        contentType = "image/jpeg"
    } else if (imageType === "image/png") {
        out = out.png({compressionLevel: Math.floor(clamp(qualityGiven, 0, 9)), palette: true})
        contentType = "image/png"
    } else {
        out = out.webp({quality: qualityGiven})
        contentType = "image/webp"
    }
    const bufferArray = await out.toBuffer()

    return new Response(bufferArray as any, {
        headers: {
            ...headers,
            "Content-Type": contentType,
            "X-Original-Bytes": String(file.size),
            "X-Compressed-Bytes": String(bufferArray.length)
        }
    })
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

