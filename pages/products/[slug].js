import { gql, GraphQLClient } from "graphql-request"
import Image from "next/image"
import Stripe from "stripe"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
const graphcms = new GraphQLClient(`https://api-us-east-1.hygraph.com/v2/cl6k70mk15mbr01uh6ti15dfg/master`)

export async function getStaticPaths() {
    const { products } = await graphcms.request(
        gql`
        {
            products {
              name
              slug
            }
          }
        `
    )
    return {
        paths: products.map(({ slug }) => ({
            params: {
                slug
            }
        })),
        fallback: false,
    }

}

export async function getStaticProps({ params }) {
    const { product } = await graphcms.request(
        gql`
            query ProductPageQuery($slug: String!) {
                product(where: {slug: $slug}) {
                    name
                    slug
                    price
                    images {
                        id
                        url
                        width
                        height
                    }
                }
            }
        `,
        {
            slug: params.slug
        }
    )
    return {
        props: {
            product
        }
    }
}

const PayBtn = ({ slug }) => {
    const handleClick = async (e) => {
        e.preventDefault();
        const stripe = await stripePromise;

        const session = await fetch(`/api/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slug: slug
            })
        }).then(res => res.json())

        const result = await stripe.redirectToCheckout({
            sessionId: session.id,
        })
    }
    return (
        <button onClick={handleClick}>buy!</button>
    )
}

const ProductPage = ({ product }) => {
    const [image] = product.images

    return (
        <div>
            <>{product.name}</>
            <>{product.price}</>

            <div>
                <Image src={image.url} width={160} height={90} layout="intrinsic" />
                <PayBtn slug={product.slug} />
            </div>
        </div>
    )
}

export default ProductPage