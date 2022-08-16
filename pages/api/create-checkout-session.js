import Stripe from "stripe";
import { gql, GraphQLClient } from "graphql-request"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const graphcms = new GraphQLClient(`https://api-us-east-1.hygraph.com/v2/cl6k70mk15mbr01uh6ti15dfg/master`)

export default async (req, res) => {
    const { slug } = req.body
    console.log(slug);
    // fetch product from graphcms
    const { product } = await graphcms.request(
        gql`
            query ProductPageQuery($slug: String!) {
                product(where: {slug: $slug}) {
                    name
                    slug
                    price 
                }
            }
        `,
        {
            slug: slug
        }
    )
    try {
        const session = await stripe.checkout.sessions.create({
            success_url: 'http://localhost:3000/?id={CHECKOUT_SESSION_ID}',
            cancel_url: `http://localhost:300/products/${slug}`,
            mode: 'payment',
            payment_method_types: ['card', 'ideal', 'giropay', 'sepa_debit'],
            line_items: [{
                price_data: {
                    unit_amount: product.price,
                    currency: 'EUR',
                    product_data: {
                        name: product.name,
                    },
                },
                quantity: 1,
            }],
        })
        res.json(session)
        return
    } catch (e) {
        res.json({ error: { message: e } })
        return
    }
}