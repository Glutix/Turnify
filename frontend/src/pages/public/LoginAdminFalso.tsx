/* import { useAuthStore } from "../../stores/authStore";

export function LoginAdminFalso() {
  const setAuth = useAuthStore((state) => state.setAuth);

  function entrarComoAdmin() {
    setAuth(
      {
        id: 1,
        nombre: "Administrador",
        rol: "admin",
        perfil_completo: true,
      },
      "token-prueba-admin",
    );
  }

  return (
    <button onClick={entrarComoAdmin}>
      Entrar como administrador
    </button>
  );
} */