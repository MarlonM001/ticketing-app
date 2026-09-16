"use client";

// WhatsApp (wa.me) solo permite precargar texto, no adjuntar imágenes: no
// hay forma de mandar el QR "solo" por un link. Como paso intermedio, este
// botón descarga el QR y abre el chat en el mismo click, para que el archivo
// ya esté en Descargas listo para arrastrar al chat que se abre.
export default function SendWhatsappButton({
  qrDataUrl,
  fileName,
  whatsappUrl,
}: {
  qrDataUrl: string;
  fileName: string;
  whatsappUrl: string;
}) {
  function handleClick() {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = fileName;
    link.click();
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleClick}
      className="block w-full rounded-md bg-lime-500 px-4 py-3 font-medium text-neutral-950"
    >
      Enviar por WhatsApp
    </button>
  );
}
