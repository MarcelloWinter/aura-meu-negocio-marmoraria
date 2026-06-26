import axios, { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
	if (
		isAxiosError(error) &&
		typeof error.response?.data?.message === "string"
	) {
		return error.response.data.message;
	}

	return fallback;
}

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("@aura:token");

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error?.response?.status === 401) {
			localStorage.removeItem("@aura:token");
			localStorage.removeItem("@aura:user");
		}

		return Promise.reject(error);
	}
);
