import { gql, GraphQLClient } from 'graphql-request'
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const graphcms = new GraphQLClient(`https://api-us-east-1.hygraph.com/v2/cl6k70mk15mbr01uh6ti15dfg/master`, {
    headers: {
        Authorization: `Bearer ${process.env.GQL_MUTATION}`
    }
})

const hook = async (req, res) => {
    const event = req.body
    const checkoutId = event.data.object.id
    const session = await stripe.checkout.sessions.retrieve(
        checkoutId,
        {
            expand: ['line_items.data.price.product', 'customer']
        }
    )

    const line_items = session.line_items.data
    const customer = session.customer
    console.log({ session })
    // console.log({ customer });
    // console.log({ line_items });

    const { order } = await graphcms.request(
        gql`mutation CreateOrderMutation($data: OrderCreateInput!) {
            createOrder(data: $data) {
                id
                emailAddress
                total
            }
        }
        `,
        {
            data: {
                emailAddress: customer.email,
                total: session.amount_total,
                stripeCheckoutId: session.id,
                orderItems: {
                    create: line_items.map((li) => ({
                        quantity: li.quantity,
                        total: li.amount_total,
                        product: {
                            connect: {
                                slug: li.price.product.metadata.productSlug,
                            }
                        }
                    }))
                }
            }
        }
    )
    res.json({ message: 'success' })
}

export default hook

// const stripe = require('stripe')('sk_test_51LOzR4FjWJMkfhCc3yaQnURArAZLbKc1kLYej8sNPRr1CX4Jk6gMKfmJkV7E6JWRaiL9SBojUgy5yc6W3u1X5OPt008j5YjtD5');
// export default async (req, res) => {
//     const event = req.body
//     const checkoutId = event.data.object.id
//     const session = await stripe.checkout.sessions.retrieve(
//         checkoutId,
//         {
//             expand: ['line_items.data.price.product', 'customer']
//         }
//     );

//     console.log({ session })
// }