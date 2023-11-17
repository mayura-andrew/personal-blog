import 'nextra-theme-blog/style.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/main.css'

const socialMediaLinks = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/mayura-alahakoon-827381201/', icon: 'images/linkedin.svg' },
  { name: 'GitHub', url: 'https://github.com/mayura-andrew', icon: 'images/github.svg' },
  { name: 'StackOverFlow', url: 'https://stackoverflow.com/users/18835623/mayura-andrew', icon: 'images/stackoverflow.svg'}
  // Add more social media links as needed
];

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS"
          href="/feed.xml"
        />
        <link
          rel="preload"
          href="/fonts/Inter-roman.latin.var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
 
        <meta property="og:title" content="Mayura Andrew" />
        <meta property="og:image" content="../public/favicon.ico" />
      </Head>
            {/* Add social media links to the navigation bar */}
      <header>
        <nav>
          <div className="social-links">
            {socialMediaLinks.map((link) => (
              <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer">
              <img src={link.icon} alt={link.name} /></a>
            ))}
          </div>
        </nav>
      </header>
      <Component {...pageProps} />
    </>
  )
}
