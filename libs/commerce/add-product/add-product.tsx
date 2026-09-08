import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { apiClient } from "api-client";
import { Button, Input } from "ui";
import styles from "./add-product.module.css";

const userId = () => localStorage.getItem("rustic.userId") ?? "local-user";

export function AddProduct() {
  const [productId, setProductId] = useState<string>();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function createDraft(form: HTMLFormElement) {
    const values = new FormData(form);
    setBusy(true);
    setStatus("Creating draft…");
    const { data, error } = await apiClient.POST("/products", {
      params: { header: { "x-user-id": userId() } },
      body: {
        title: String(values.get("title") ?? ""),
        description: String(values.get("description") ?? ""),
        brand: String(values.get("brand") ?? "").trim() || undefined,
        colour: String(values.get("colour") ?? "").trim() || undefined,
        category: String(values.get("category") ?? "").trim() || undefined,
        priceMinor: Math.round(Number(values.get("price")) * 100),
        currency: "EUR",
      },
    });
    if (error || !data) {
      setStatus("Could not create the draft. Check the fields and retry.");
      setBusy(false);
      return;
    }
    setProductId(data.id);
    const image = values.get("image");
    if (image instanceof File && image.size > 0) {
      await addImage(image, data.id);
      return;
    }
    setStatus("Draft created. Add an image to publish it.");
    setBusy(false);
  }

  async function addImage(file: File, id = productId) {
    if (!id) return;
    setBusy(true);
    setStatus("Uploading image…");
    try {
      await upload(`products/${id}/${file.name}`, file, {
        access: "public",
        contentType: file.type,
        handleUploadUrl: "/api/uploads/product-image-token",
        headers: { "x-user-id": userId() },
      });
      const { error } = await apiClient.POST("/products/{productId}/publish", {
        params: { path: { productId: id }, header: { "x-user-id": userId() } },
      });
      setStatus(
        error ? "Image uploaded, but the product is not ready to publish." : "Product published.",
      );
    } catch {
      setStatus("Image upload failed. Please retry.");
    }
    setBusy(false);
  }

  return (
    <section className={styles.screen} aria-label="Add a product">
      <div className={styles.heading}>
        <p className={styles.eyebrow}>New listing</p>
        <h2>Add a product</h2>
        <p>Keep the details simple. You can add an image after saving.</p>
      </div>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void createDraft(event.currentTarget);
        }}
      >
        <label className={styles.field}>
          <span>Title</span>
          <Input
            name="title"
            placeholder="e.g. Linen overshirt"
            minLength={3}
            maxLength={120}
            required
          />
        </label>
        <label className={styles.field}>
          <span>Description</span>
          <textarea
            className={styles.textarea}
            name="description"
            placeholder="Describe the item, condition, and any useful details."
            maxLength={5000}
            required
          />
        </label>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>Brand</span>
            <Input name="brand" placeholder="Optional" />
          </label>
          <label className={styles.field}>
            <span>Colour</span>
            <Input name="colour" placeholder="Optional" />
          </label>
        </div>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>Category</span>
            <select className={styles.select} name="category" defaultValue="">
              <option value="" disabled>
                Select a category
              </option>
              <option>Clothing</option>
              <option>Accessories</option>
              <option>Home & living</option>
              <option>Electronics</option>
              <option>Other</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Price</span>
            <div className={styles.price}>
              <Input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
              <span>EUR</span>
            </div>
          </label>
        </div>
        <label className={styles.field}>
          <span>
            Image <em>optional</em>
          </span>
          <Input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && productId) void addImage(file);
            }}
          />
        </label>
        <div className={styles.actions}>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save product"}
          </Button>
        </div>
      </form>
      {status && (
        <p className={styles.status} aria-live="polite">
          {status}
        </p>
      )}
    </section>
  );
}

export default AddProduct;
