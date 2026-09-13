import { useNavigate } from "react-router-dom";
import { ProductList } from "product-list";

function ProductOverview() {
  const navigate = useNavigate();

  return (
    <section>
      <ProductList />
    </section>
  );
}

export default ProductOverview;
