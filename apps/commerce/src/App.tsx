import "ui/shadcn.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { AddProduct } from "add-product";
import ProductOverview from "product-overview";

// Exposed by the federation plugin as 'commerce/App'.
// Consumers render it lazily via `lazyProvider('commerce', 'App')`.
export function App() {
  return (
    <section data-testid="commerce">
      <Routes>
        <Route index element={<ProductOverview />} />
        <Route path="add-product" element={<AddProduct />} />
        <Route path="*" element={<Navigate relative="path" to=".." replace />} />
      </Routes>
    </section>
  );
}

export default App;
