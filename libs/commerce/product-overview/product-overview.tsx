import { Button } from "ui";
import { useNavigate } from "react-router-dom";
import { ProductList } from "product-list";

function ProductOverview() {
  const navigate = useNavigate();

  return (
    <section>
      <Button onClick={() => navigate("add-product")}>Add Product</Button>
      <ProductList />
    </section>
  );
}

export default ProductOverview;
