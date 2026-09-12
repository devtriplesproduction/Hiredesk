import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { to, text, attachment } = await req.json();

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      return NextResponse.json({ error: "WhatsApp credentials not configured in .env.local" }, { status: 500 });
    }
    if (!to || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let mediaId = null;

    if (attachment && attachment.content && attachment.filename) {
       // Convert base64 to Blob for FormData
       const buffer = Buffer.from(attachment.content, 'base64');
       const blob = new Blob([buffer], { type: 'application/pdf' });
       
       const formData = new FormData();
       formData.append('file', blob, attachment.filename);
       formData.append('type', 'application/pdf');
       formData.append('messaging_product', 'whatsapp');

       const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/media`, {
         method: 'POST',
         headers: {
           Authorization: `Bearer ${token}`,
         },
         body: formData,
       });

       const uploadData = await uploadRes.json();
       if (!uploadRes.ok) {
         throw new Error(`Media upload failed: ${JSON.stringify(uploadData)}`);
       }
       mediaId = uploadData.id;
    }

    const payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace("+", ""),
    };

    if (mediaId) {
      payload.type = "document";
      payload.document = {
        id: mediaId,
        caption: text,
        filename: attachment.filename || "document.pdf",
      };
    } else {
      payload.type = "text";
      payload.text = {
        preview_url: true,
        body: text,
      };
    }

    const sendRes = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const sendData = await sendRes.json();

    if (!sendRes.ok) {
       return NextResponse.json({ error: `Message send failed: ${JSON.stringify(sendData)}` }, { status: sendRes.status });
    }

    return NextResponse.json({ success: true, data: sendData });
  } catch (error: any) {
    console.error("Failed to send WhatsApp message:", error);
    return NextResponse.json({ error: error.message || "Failed to send WhatsApp message" }, { status: 500 });
  }
}
