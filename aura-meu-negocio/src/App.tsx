import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Login } from "./pages/Auth/Login";
import { ForgotPassword } from "./pages/Auth/ForgotPassword";
import { VerifyCode } from "./pages/Auth/VerifyCode";
import { ResetPassword } from "./pages/Auth/ResetPassword";
import { Service } from "./pages/Modules/Service";
import { Agenda } from "./pages/Modules/Agenda";
import { Vendas } from "./pages/Modules/Vendas";
import { Financeiro } from "./pages/Modules/Financeiro";
import { Equipe } from "./pages/Modules/Equipe";
import { Clientes } from "./pages/Modules/Clientes";
import { AuthProvider } from "./contexts/AuthContext";
import { ClientesProvider } from "./contexts/ClientesContext";
import { FinanceiroProvider } from "./contexts/FinanceiroContext";

export function App() {
	return (
		<AuthProvider>
			<ClientesProvider>
			<FinanceiroProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Login />} />
					<Route path="/recuperar-senha" element={<ForgotPassword />} />
					<Route path="/verificar-codigo" element={<VerifyCode />} />
					<Route path="/resetar-senha" element={<ResetPassword />} />
					<Route path="/atendimento" element={<Service />} />
					<Route path="/agenda" element={<Agenda />} />
					<Route path="/clientes" element={<Clientes />} />
					<Route path="/vendas" element={<Vendas />} />
					<Route path="/financeiro" element={<Financeiro />} />
					<Route path="/equipe" element={<Equipe />} />
				</Routes>
			</BrowserRouter>
			</FinanceiroProvider>
			</ClientesProvider>
		</AuthProvider>
	);
}

export default App;
