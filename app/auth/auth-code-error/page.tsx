export default function AuthCodeError() {
  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h1>Enlace inválido o expirado</h1>
      <p>
        El enlace de acceso ya no es válido. Por favor solicita uno nuevo
        desde la página de login.
      </p>
      <a href="/login">Volver al login</a>
    </div>
  );
}
