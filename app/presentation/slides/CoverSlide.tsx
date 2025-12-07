"use client";

export function CoverSlide() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src="/logo-text.png"
        alt="Volition"
        style={{
          height: "clamp(300px, 15vw, 400px)",
          width: "auto",
          maxWidth: "80%",
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

// Corner art positioned at the page level via CSS
export function CoverSlideCornerArt() {
  return (
    <img
      src="/corner-art.png"
      alt=""
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: "clamp(500px, 25vw, 800px)",
        height: "auto",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 9999,
      }}
      loading="lazy"
      decoding="async"
    />
  );
}
