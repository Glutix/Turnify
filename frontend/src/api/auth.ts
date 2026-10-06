import api from "./axios";

export interface Usuario {
  id: number;
  nombre: string;
  apellido?: string;
  telefono: string;
  rol: "cliente" | "admin";
  perfil_completo: boolean;
}

export interface ValidarCodigoResponse {
  requiereRegistro: boolean;
  token?: string;
  usuario?: Usuario;
  telefono?: string;
}

export async function solicitarCodigo(telefono: string): Promise<void> {
  await api.post("/auth/solicitar-codigo", {
    telefono,
  });
}

export async function validarCodigo(
  telefono: string,
  codigo: string,
): Promise<ValidarCodigoResponse> {
  const { data } = await api.post<ValidarCodigoResponse>(
    "/auth/validar-codigo",
    {
      telefono,
      codigo,
    },
  );

  return data;
}

export async function registrarUsuario(
  telefono: string,
  nombre: string,
  apellido: string,
) {
  const { data } = await api.post("/auth/registro", {
    telefono,
    nombre,
    apellido,
  });

  return data;
}

export interface LoginPasswordResponse {
  token: string;
  usuario: Usuario;
}

// RF20 / RF30: teléfono + contraseña. 5 fallos bloquean 15 min (HTTP 429).
export async function loginConPassword(
  telefono: string,
  password: string,
): Promise<LoginPasswordResponse> {
  const { data } = await api.post<LoginPasswordResponse>("/auth/login", {
    telefono,
    password,
  });
  return data;
}

export async function establecerPassword(payload: {
  passwordActual?: string;
  passwordNueva: string;
}): Promise<{ mensaje: string }> {
  const { data } = await api.post("/auth/password", payload);
  return data;
}
