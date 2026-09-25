import { apiUrl } from "api-client";

type AuthPayload = {
  email: string;
  password: string;
};

type SignUpPayload = AuthPayload & {
  displayName: string;
};

async function request(path: string, body: AuthPayload | SignUpPayload): Promise<Response> {
  return fetch(apiUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function updateRequest(path: string, body: object): Promise<Response> {
  return fetch(apiUrl(path), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function signUp(input: SignUpPayload): Promise<Response> {
  return request("auth/signup", input);
}

export function signIn(input: AuthPayload): Promise<Response> {
  return request("auth/login", input);
}

export function changePassword(input: AuthPayload & { newPassword: string }): Promise<Response> {
  return updateRequest("auth/password", input);
}
