import { BrowserRouter } from "react-router-dom";
import { ShellRoutes } from "./routes/routes";

export function App() {
  return (
    <>
      <BrowserRouter>
        <ShellRoutes />
      </BrowserRouter>
    </>
  );
}

export default App;
