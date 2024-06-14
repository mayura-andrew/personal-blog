import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  const meta = {
    title: 'mayuraandrew.tech',
    description: 'Exploring Future Technologies: Building Something Useful for Everyone 🌐👨🏻‍💻 Welcome to my personal blog where curiosity meets passion for future technology. Join me on a journey of innovation and research, as I delve into building impactful solutions with the latest in technology. Discover how technology can empower and benefit everyone, and explore insightful articles on cutting-edge advancements. Whether you are a curious mind or a tech enthusiast, there is something here for you to learn and explore.',
    image: '../public/favicon.ico',
  }

  return (
    <Html lang="en">
      <Head>
        <meta name="robots" content="follow, index" />
        <meta name="description" content={meta.description} />
        <meta property="og:site_name" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@mayura-andrew" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Head>
      <body>
        <Main />
        <NextScript />

      </body>
    </Html>
  )
}
