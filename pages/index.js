import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Link from 'next/link'
import { GraphQLClient } from 'graphql-request'

const graphcms = new GraphQLClient(`https://api-us-east-1.hygraph.com/v2/cl6k70mk15mbr01uh6ti15dfg/master`)

export async function getStaticProps() {
  // fetch products
  const { products } = await graphcms.request(
    `
      {
        products {
          name
          slug
          id
          price
        }
      }
    `
  )
  return {
    props: {
      products
    },
  }
}

export default ({ products }) => {

  return (
    products.map(({ name, slug, id, price }) => {
      return (
        <div>
          <Link key={id} href={`/products/${slug}`}>
            {name}
          </Link>
        </div>
      )
    })
  )
}
