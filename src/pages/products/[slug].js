import React from "react";
import { client, urlFor } from "../../lib/client";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { Product, ProductDesc, Info } from "../../components";
import { useStateContext } from "@/context/StateContext";
import getStripe from "@/lib/getStripe";
import { toast } from "react-hot-toast";

const ProductDetails = ({ product, products }) => {
  const { productImage, images, name, price, relatedProducts, presetNumber } =
    product;
  const { onAddToCart, cartItems, setCartItems } = useStateContext();

  const handleBuyNow = async () => {
    const stripe = await getStripe();
    const newCartItems = [...cartItems, {...product, quantity: 1}]

    setCartItems(newCartItems)

    const res = await fetch("/api/stripe", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cartItems),
    });

    if (res.status === 500) {
      console.log("Error");
      return;
    }

    const data = await res.json();

    toast.loading("Redirecting...");

    return stripe.redirectToCheckout({ sessionId: data.id }); // an instance of a checkout
  };

  return (
    <>
      <div className="product-details">
        <div className="image-container">
          <img
            src={urlFor(productImage && productImage)}
            className="product-details-image"
            width={450}
            height={450}
          />
          <div className="other-images-container">
            {images?.map((image, i) => {
              return (
                <img key={i} src={urlFor(image)} className="other-image" />
              );
            })}
          </div>
        </div>
        <div>
          <h1 className="product-details-title">{name}</h1>
          <div>
            <AiFillStar />
            <AiFillStar />
            <AiFillStar />
            <AiFillStar />
            <AiOutlineStar />
          </div>
          <div className="product-details-info">
            <Info />
          </div>

          <div className="details-price">${price} CAD</div>
          <ProductDesc presetNumber={presetNumber} />
          <div className="product-detail-buttons">
            <button type="botton" className="buy-now" onClick={handleBuyNow}>
              Buy Now
            </button>
            <button
              type="button"
              className="add-to-cart"
              onClick={() => {onAddToCart(product)}}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
      <div>
        <h1>What's Diffing</h1>
      </div>
      <div className="recommended-products-container">
        <h2 className="rec-products">Recommended Products</h2>
        <div className="recommended-products">
          {products.map((product) => {
            if (relatedProducts.includes(product.name)) {
              return <Product product={product} width={250} height={250} />;
            }
          })}
        </div>
      </div>
    </>
  );
};

export const getStaticPaths = async () => {
  // get all products but only return slug property
  const query = `*[_type == "product"] {
        slug {
            current
        }
    }`;

  const products = await client.fetch(query);
  const paths = products.map((product) => ({
    params: { slug: product.slug.current },
  }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps = async ({ params: { slug } }) => {
  const query = `*[_type == "product" && slug.current == "${slug}"][0]`; // get all products
  const product = await client.fetch(query);

  const productsQuery = '*[_type == "product"]';
  const products = await client.fetch(productsQuery);

  return {
    props: { product, products },
  };
};

export default ProductDetails;
